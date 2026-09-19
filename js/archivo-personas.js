/* ============================================================
   archivo-personas.js — las dos pantallas de consulta.

   El ARCHIVO de asuntos cerrados y la ficha de personas y empresas,
   con todos los asuntos de cada una.
   ============================================================ */

/* ==========================================================
   PANTALLA: ARCHIVO
   ========================================================== */

/* El índice (`js/archivo-indice.js`) es quien recorre el disco: aquí
   solo se orquesta. Si no hay índice usable (no existe, está roto o
   es de otra versión), se cae al recorrido de disco de siempre —
   `IndiceArchivo.construir()` hace el mismo trabajo, solo que sin
   guardar nada — y se avisa. Si el índice existe pero un recuento
   barato (categorías y carpetas de tercero) no cuadra con el suyo, se
   enseña igual, con otro aviso: no se reconstruye sola nunca. */
App.verArchivo = async function () {
  $('explica-archivo').textContent = 'Leyendo el archivo…';

  var progreso = function (nombreCategoria, total) {
    $('explica-archivo').textContent = 'Leyendo el archivo… ' + nombreCategoria + ' · ' + total + ' asuntos';
  };

  var resultado = await IndiceArchivo.leerDisco();
  var usable, avisoIndice = '';
  App.E.indiceSinHacer = false;

  if (resultado.ok) {
    usable = resultado.datos;
    try {
      var actual = await IndiceArchivo.recuentoActual();
      if (!IndiceArchivo.recuentosIguales(actual, usable.recuento || {})) {
        avisoIndice = 'El índice puede no estar al día. Reconstruir el índice.';
      }
    } catch (e) { /* si falla la comprobación, se enseña el índice igual */ }
  } else {
    App.E.indiceSinHacer = true;
    avisoIndice = 'El índice no está hecho. Reconstruir el índice.';
    usable = await IndiceArchivo.construir(progreso);
  }

  var descolocados = 0;
  var salida = (usable.asuntos || []).map(function (e) {
    if (e.sueltoEn) descolocados++;
    /* Fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): la ficha de
       un archivado ya no está en App.E.registro.asuntos, así que se
       arma con lo poco que el propio índice guarda (categoria y
       tercero hacen falta para que App.reabrirAsunto sepa localizar
       la carpeta sin tener que resolver el manejador antes). Si se
       necesita la ficha entera (al abrir la ficha de verdad), se
       completa con FichaArchivo.completar. */
    var ficha = {
      situacion: e.situacion || '', via: e.via || '', viaDato: e.viaDato || '',
      categoria: e.categoria || '', tercero: e.tercero || ''
    };
    return {
      nombre: e.nombre, handle: null, padre: null, ruta: e.ruta,
      categoria: e.categoria, tercero: e.tercero, sueltoEn: e.sueltoEn || '',
      leido: Nombres.leer(e.nombre, App.E.tipos), ficha: ficha,
      busca: IndiceArchivo.textoDeBusqueda(e)
    };
  });
  salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
  App.E.listaArchivo = salida;

  var partes = [salida.length + ' asuntos archivados.'];
  if (avisoIndice) partes.push(avisoIndice);
  if (descolocados) {
    partes.push('Hay ' + descolocados + ' asunto' + (descolocados === 1 ? '' : 's') +
      ' colocado' + (descolocados === 1 ? '' : 's') + ' fuera de su sitio.');
  }
  $('explica-archivo').textContent = partes.join(' ');
  App.pintarArchivo();
};

/* Botón "Reconstruir el índice": recorre el archivo entero una vez
   (con la línea de arriba avisando por dónde va, categoría a
   categoría) y guarda lo encontrado. Si algo falla a mitad de camino
   (permiso, Dropbox), no se escribe nada a medias: se avisa y se deja
   el índice que hubiera. */
App.reconstruirIndiceArchivo = async function () {
  await U.mientrasGuarda($('btn-reconstruir-indice'), async function () {
    try {
      var indice = await IndiceArchivo.construir(function (nombreCategoria, total) {
        $('explica-archivo').textContent = 'Leyendo el archivo… ' + nombreCategoria + ' · ' + total + ' asuntos';
      });
      await IndiceArchivo.guardar(indice);
      U.aviso('Índice reconstruido.', 'bueno');
      await App.verArchivo();
    } catch (e) {
      U.aviso('No se ha podido reconstruir el índice: ' + U.mensajeDeError(e), 'malo');
    }
  });
};

/* Ya no es `indexOf` sobre un solo texto: lo escrito se normaliza y
   se parte en palabras, y un asunto sale si su texto de búsqueda (ya
   calculado al cargar el índice) tiene TODAS, en cualquier orden. */
App.pintarArchivo = function () {
  var palabras = U.normalizar($('buscar-archivo').value).split(' ').filter(Boolean);
  var lista = App.E.listaArchivo.filter(function (a) {
    return palabras.every(function (p) { return a.busca.indexOf(p) !== -1; });
  });
  var caja = $('lista-archivo');
  caja.innerHTML = '';
  if (!lista.length) {
    var msg = palabras.length
      ? 'Ningún asunto archivado tiene todas esas palabras.'
      : 'Nada que mostrar.';
    if (App.E.indiceSinHacer) msg += ' El índice no está hecho: pulsa "Reconstruir el índice".';
    caja.innerHTML = '<div class="vacio">' + U.escapar(msg) + '</div>';
    return;
  }
  lista.slice(0, 300).forEach(function (a) { caja.appendChild(App.tarjetaAsunto(a, 'archivado')); });
  if (lista.length > 300) {
    var mas = document.createElement('div');
    mas.className = 'explica';
    mas.textContent = 'Se muestran los 300 primeros de ' + lista.length + '. Afina la búsqueda.';
    caja.appendChild(mas);
  }
};

/* Las tarjetas del ARCHIVO no traen manejador de carpeta (el índice
   no puede guardar uno): "Documentos" lo resuelve aquí, con lo que el
   índice sí sabe, justo antes de abrirlo. "Reabrir" no hace falta
   tocarlo: `App.reabrirAsunto` ya sabía recalcular la carpeta cuando
   `a.padre` faltaba o estaba viejo (17-sep-2026, fila 45). */
U.envolver(App, 'App.verDocumentos', 'archivo-personas.js', function (comoEra) {
  return async function (a) {
    if (!a.handle) {
      var resuelto = await IndiceArchivo.resolverHandle(a);
      if (!resuelto) {
        U.aviso('No encuentro la carpeta de este asunto. Puede que se haya movido: pulsa ' +
          'Actualizar o Reconstruir el índice.', 'ambar');
        return;
      }
      a.handle = resuelto.handle;
      a.padre = resuelto.padre;
    }
    return comoEra(a);
  };
});

$('buscar-archivo').oninput = function () { App.pintarArchivo(); };
$('btn-recargar-archivo').onclick = function () { App.verArchivo(); };
$('btn-reconstruir-indice').onclick = function () { App.reconstruirIndiceArchivo(); };

/* ==========================================================
   PANTALLA: PERSONAS
   ========================================================== */

App.personasCargadas = null;

App.pintarPersonas = async function () {
  var categoria = $('filtro-personas').value;
  var fuente = await Datos.cargar(App.E.datos, categoria);
  App.personasCargadas = fuente;
  App.buscarPersonas();
};

App.buscarPersonas = function () {
  if (!App.personasCargadas) return;
  var texto = $('buscar-personas').value;
  var caja = $('lista-personas');
  var lista = U.normalizar(texto).length >= 2
    ? Datos.buscar(App.personasCargadas.lista, texto, 60)
    : App.personasCargadas.lista.slice(0, 60);
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
  }
  lista.forEach(function (p) {
    var d = document.createElement('div');
    d.className = App.claseDeResultado(p);
    if (p.id) d.dataset.nie = p.id;
    d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                  '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
    d.onclick = function () { App.verFicha(p); };
    caja.appendChild(d);
  });
  var b = document.createElement('button');
  b.className = 'boton';
  b.textContent = $('filtro-personas').value === 'ALUMNADO'
    ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
  b.onclick = function () { App.altaDesdePersonas(); };
  caja.appendChild(b);
};

App.altaDesdePersonas = async function () {
  await App.altaTercero($('filtro-personas').value, $('buscar-personas').value.trim());
  Datos.olvidar($('filtro-personas').value);
  App.pintarPersonas();
};

App.verFicha = function (p) {
  var caja = $('ficha-persona');

  function pintarFilas(filas) {
    return filas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' +
             U.escapar(f.valor) + '</span></div>';
    }).join('');
  }

  var html = '<h4>' + U.escapar(p.nombre) + '</h4>';

  if (p.categoria === 'ALUMNADO') {
    /* Lo que se consulta a diario va arriba: la edad de hoy, si sigue
       matriculado, el grupo y los datos de contacto de los tutores
       legales. El resto del fichero de Séneca sigue estando, más abajo. */
    var d = Datos.destacadosAlumno(p);
    html += pintarFilas(d.destacados);
    if (d.resto.length) {
      html += '<p class="nota"><button type="button" class="enlace" id="ver-resto">' +
              'Ver los demás datos del fichero (' + d.resto.length + ')</button></p>' +
              '<div id="resto-ficha" class="oculto">' + pintarFilas(d.resto) + '</div>';
    }
  } else if (p.categoria === 'PERSONAL') {
    /* Igual que en el alumnado: arriba el puesto, si sigue en el centro
       y por dónde se le localiza; el resto del fichero, debajo. */
    var dp = Datos.destacadosPersona(p);
    html += pintarFilas(dp.destacados);
    if (dp.resto.length) {
      html += '<p class="nota"><button type="button" class="enlace" id="ver-resto">' +
              'Ver los demás datos del fichero (' + dp.resto.length + ')</button></p>' +
              '<div id="resto-ficha" class="oculto">' + pintarFilas(dp.resto) + '</div>';
    }
  } else {
    html += pintarFilas(Object.keys(p.campos).map(function (c) {
      return { titulo: c, valor: p.campos[c] };
    }));
  }

  html += '<p class="nota"><button type="button" class="boton" id="ver-sus-asuntos">' +
          'Ver sus asuntos</button></p><div id="asuntos-del-tercero"></div>';

  caja.innerHTML = html;

  if ($('ver-resto')) {
    $('ver-resto').onclick = function () {
      $('resto-ficha').classList.toggle('oculto');
    };
  }
  $('ver-sus-asuntos').onclick = function () { App.verAsuntosDeTercero(p); };

  /* Y, si es de los que se dieron de alta a mano, el botón de cambiar
     sus datos. */
  if (App.sePuedeCambiarElTercero(p)) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.style.marginLeft = '8px';
    b.id = 'cambiar-tercero';
    b.textContent = 'Cambiar los datos';
    b.onclick = function () { App.cambiarDatosDelTercero(p); };
    $('ver-sus-asuntos').parentNode.appendChild(b);
  }
};

/* ---------- cambiar los datos de un tercero ----------

   Hasta el 10-sep-2026 un tercero se daba de alta y ya no se podía
   tocar. En cuanto apareció el nombre comercial de las empresas eso
   dejó de valer: las que ya estaban dadas de alta no tenían dónde
   ponerlo, y la única salida habría sido abrir el CSV a mano. Justo lo
   que no queremos.

   **Solo los dados de alta a mano.** Lo que viene de Séneca no se toca
   desde aquí: se corrige en Séneca y se vuelve a descargar el fichero,
   o el cambio se perdería en la siguiente descarga. */

App.sePuedeCambiarElTercero = function (p) {
  if (!p || !p.categoria) return false;
  if (!Datos.LISTAS[p.categoria]) return false;
  return p.deSeneca !== true;
};

App.cambiarDatosDelTercero = async function (p) {
  var def = Datos.LISTAS[p.categoria];
  var nombreAntes = p.nombre;

  var valores = {};
  def.cabecera.forEach(function (c) { valores[c] = (p.campos && p.campos[c]) || ''; });
  valores[def.cabecera[0]] = nombreAntes;

  var puestos = await App.cuadroDeTercero(
    p.categoria, valores, 'Cambiar los datos de ' + nombreAntes, 'Guardar los cambios');
  if (!puestos) return;

  try {
    await Datos.guardarEnLista(App.E.datos, p.categoria, nombreAntes, puestos);
  } catch (e) {
    U.aviso('No he podido guardar el cambio: ' + e.message, 'malo');
    return;
  }

  /* Cambiar el nombre no renombra las carpetas de sus asuntos: el
     nombre de una carpeta es el rastro del día en que se creó.

     La única excepción es el Nº de identificación escolar de un
     aspirante (17-sep-2026, fila 42, sección 4): si antes no lo tenía y
     ahora sí, sus asuntos ABIERTOS pasan a llamarse con el número, igual
     que si se hubiera matriculado. Se pregunta antes con la lista de
     carpetas (App.renombrarAsuntosAbiertosDelTercero, en
     js/asuntos-editar.js), y las archivadas no se tocan. */
  var esAspiranteConNumeroNuevo = p.categoria === 'ALUMNADO' && p.solicitante &&
    !p.id && (puestos['Nº Id. Escolar'] || '').trim();

  U.aviso(U.normalizar(puestos[def.cabecera[0]]) !== U.normalizar(nombreAntes)
    ? 'Cambiado. Las carpetas de sus asuntos de antes conservan el nombre viejo.'
    : 'Cambiado.', 'bueno');

  Datos.olvidar(p.categoria);
  App.pintarPersonas();

  if (esAspiranteConNumeroNuevo && App.renombrarAsuntosAbiertosDelTercero) {
    var textoAntes = App.textoTercero({ categoria: 'ALUMNADO', nombre: nombreAntes, id: '' });
    var textoDespues = App.textoTercero({
      categoria: 'ALUMNADO', nombre: puestos[def.cabecera[0]] || nombreAntes,
      id: (puestos['Nº Id. Escolar'] || '').trim()
    });
    await App.renombrarAsuntosAbiertosDelTercero('ALUMNADO', textoAntes, textoDespues);
  }
};

/* Todos los asuntos de una persona o empresa, los abiertos y los
   archivados, en una sola lista. */
App.verAsuntosDeTercero = async function (p) {
  var caja = $('asuntos-del-tercero');
  caja.innerHTML = '<p class="explica">Buscando…</p>';
  var texto = App.textoTercero(p);
  var clave = U.normalizar(texto);
  var salida = [];

  var abiertas = await Carpetas.subcarpetas(App.E.abiertos);
  abiertas.forEach(function (c) {
    if (c.nombre.charAt(0) === '_') return;
    if (U.normalizar(c.nombre).indexOf(clave) === -1) return;
    salida.push({ nombre: c.nombre, donde: 'Abierto' });
  });

  try {
    var cat = await App.E.archivo.getDirectoryHandle(p.categoria);
    var ter = await cat.getDirectoryHandle(texto);
    var cerradas = await Carpetas.subcarpetas(ter);
    cerradas.forEach(function (c) {
      salida.push({ nombre: c.nombre, donde: 'Archivado', handle: c.handle });
    });
  } catch (e) { /* todavía no tiene carpeta en el archivo */ }

  salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });

  if (!salida.length) {
    caja.innerHTML = '<div class="vacio">Todavía no hay ningún asunto suyo.</div>';
    return;
  }
  /* Fila 64: la ficha de uno archivado ya no está en
     App.E.registro.asuntos, hay que leer su _ficha.json (se tiene el
     manejador de la propia carpeta, así que sale barato). */
  var filas = await Promise.all(salida.map(async function (a) {
    var leido = Nombres.leer(a.nombre, App.E.tipos);
    var ficha = a.donde === 'Abierto'
      ? (App.E.registro.asuntos[a.nombre] || {})
      : ((window.FichaArchivo && await FichaArchivo.leer(a.handle)) || {});
    var situacion = ficha.situacion || '';
    return '<div class="resultado"><div>' +
           (leido.tipo ? '<span class="marca-tipo">' + U.escapar(leido.tipo) + '</span>' : '') +
           (situacion ? '<span class="marca-estado ' + App.colorEstado(situacion) + '">' +
                        U.escapar(situacion) + '</span>' : '') +
           U.escapar(a.nombre) + '</div>' +
           '<div class="resultado-pie">' + a.donde +
           (leido.fecha ? '  ·  ' + U.fechaLegible(leido.fecha) : '') + '</div></div>';
  }));
  caja.innerHTML = filas.join('');
};

$('filtro-personas').onchange = function () { App.pintarPersonas(); };
$('buscar-personas').oninput = function () { App.buscarPersonas(); };
