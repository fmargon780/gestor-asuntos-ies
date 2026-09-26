/* ============================================================
   archivo-personas.js — las dos pantallas de consulta.

   El ARCHIVO de asuntos cerrados y la ficha de personas y empresas,
   con todos los asuntos de cada una.
   ============================================================ */

/* ==========================================================
   PANTALLA: ARCHIVO
   ========================================================== */

/* Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md): el curso académico que
   se está viendo en la pantalla Archivo. null hasta la primera carga
   (entonces se pone al curso actual); 'todos', para verlos todos. Se
   recuerda mientras dure la sesión, para que "Actualizar" no vuelva a
   dejarlo en el curso actual si se había elegido otro. */
App.E.cursoArchivo = null;

function pintarSelectorCurso(cursos) {
  var sel = $('archivo-curso');
  if (!cursos || !cursos.length) { sel.classList.add('oculto'); return; }
  if (!App.E.cursoArchivo) App.E.cursoArchivo = IndiceArchivo.cursoActual();
  var elegido = (App.E.cursoArchivo === 'todos' || cursos.indexOf(App.E.cursoArchivo) !== -1)
    ? App.E.cursoArchivo : cursos[0];
  App.E.cursoArchivo = elegido;
  sel.innerHTML = cursos.map(function (c) {
    return '<option value="' + c + '"' + (c === elegido ? ' selected' : '') + '>Curso: ' + c + '</option>';
  }).join('') + '<option value="todos"' + (elegido === 'todos' ? ' selected' : '') + '>Todos los cursos</option>';
  sel.classList.remove('oculto');
}

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

  var opciones = App.E.cursoArchivo === 'todos' ? { todos: true }
    : App.E.cursoArchivo ? { curso: App.E.cursoArchivo } : {};
  var resultado = await IndiceArchivo.leerDisco(opciones);
  var usable, avisoIndice = '';
  App.E.indiceSinHacer = false;

  if (resultado.ok) {
    usable = resultado.datos;
    pintarSelectorCurso(resultado.cursos);
    try {
      var actual = await IndiceArchivo.recuentoActual();
      if (!IndiceArchivo.recuentosIguales(actual, usable.recuento || {})) {
        avisoIndice = 'El índice puede no estar al día.';
      }
    } catch (e) { /* si falla la comprobación, se enseña el índice igual */ }
  } else {
    App.E.indiceSinHacer = true;
    avisoIndice = 'El índice no está hecho.';
    usable = await IndiceArchivo.construir(progreso);
    $('archivo-curso').classList.add('oculto');
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
      categoria: e.categoria || '', tercero: e.tercero || '',
      seQuedoEn: e.seQuedoEn || '', terminado: !!e.terminado   /* fila 129 */
    };
    if (e.reservado !== undefined) ficha.reservado = e.reservado;   /* fila 135 */
    return {
      nombre: e.nombre, handle: null, padre: null, ruta: e.ruta,
      categoria: e.categoria, tercero: e.tercero, sueltoEn: e.sueltoEn || '',
      leido: Nombres.leer(e.nombre, App.E.tipos), ficha: ficha,
      /* Fila 73, docs/BUSCAR-EN-LAS-NOTAS.md: busca lleva las notas,
         buscaSinNotas no, para saber si una palabra ha salido solo
         por una nota (App.fragmentoDeNota). */
      busca: IndiceArchivo.textoDeBusqueda(e),
      buscaSinNotas: IndiceArchivo.textoDeBusqueda(e, false),
      notasTexto: e.notas || ''
    };
  });
  salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
  App.E.listaArchivo = salida;

  var partes = [salida.length + ' asuntos archivados.'];
  if (descolocados) {
    partes.push('Hay ' + descolocados + ' asunto' + (descolocados === 1 ? '' : 's') +
      ' colocado' + (descolocados === 1 ? '' : 's') + ' fuera de su sitio.');
  }
  var explica = $('explica-archivo');
  explica.textContent = partes.join(' ') + (avisoIndice ? ' ' : '');
  /* Fila 175, punto 3: el aviso lleva un botón de verdad, no solo texto
     con pinta de botón. */
  if (avisoIndice) {
    explica.appendChild(document.createTextNode(avisoIndice + ' '));
    var btnAviso = document.createElement('button');
    btnAviso.type = 'button';
    btnAviso.className = 'enlace';
    btnAviso.textContent = 'Reconstruir el índice';
    btnAviso.onclick = function () { App.reconstruirIndiceArchivo(btnAviso); };
    explica.appendChild(btnAviso);
  }
  App.pintarArchivo();
};

/* Botón "Reconstruir el índice": recorre el archivo entero una vez
   (con la línea de arriba avisando por dónde va, categoría a
   categoría) y guarda lo encontrado. Si algo falla a mitad de camino
   (permiso, Dropbox), no se escribe nada a medias: se avisa y se deja
   el índice que hubiera. */
App.reconstruirIndiceArchivo = async function (boton) {
  await U.mientrasGuarda(boton || null, async function () {
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
    /* Un reservado tapado solo sale por su nombre de carpeta (fila 135). */
    var busca = (window.Reservados && Reservados.tapar(a)) ? Reservados.textoDeBusqueda(a) : a.busca;
    return palabras.every(function (p) { return busca.indexOf(p) !== -1; });
  });
  var caja = $('lista-archivo');
  var alto = window.scrollY;   /* fila 119: la lista se queda a la misma altura */
  caja.innerHTML = '';
  if (!lista.length) {
    var msg = palabras.length
      ? 'Ningún asunto archivado tiene todas esas palabras.'
      : 'Nada que mostrar.';
    if (App.E.indiceSinHacer) msg += ' El índice no está hecho: pulsa "Reconstruir el índice".';
    caja.innerHTML = '<div class="vacio">' + U.escapar(msg) + '</div>';
    return;
  }
  lista.slice(0, 300).forEach(function (a) {
    var tapado = window.Reservados && Reservados.tapar(a);
    a._fragmento = tapado ? null : App.fragmentoDeNota(a, palabras);
    var tarjeta = App.tarjetaAsunto(a, 'archivado');
    caja.appendChild(window.Reservados ? Reservados.enTarjeta(tarjeta, a) : tarjeta);
  });
  if (lista.length > 300) {
    var mas = document.createElement('div');
    mas.className = 'explica';
    mas.textContent = 'Se muestran los 300 primeros de ' + lista.length + '. Afina la búsqueda.';
    caja.appendChild(mas);
  }
  if (window.scrollY !== alto) window.scrollTo(0, alto);
};

/* Las tarjetas del ARCHIVO no traen manejador de carpeta (el índice
   no puede guardar uno): "Documentos" lo resuelve aquí, con lo que el
   índice sí sabe, justo antes de abrirlo. "Reabrir" no hace falta
   tocarlo: `App.reabrirAsunto` ya sabía recalcular la carpeta cuando
   `a.padre` faltaba o estaba viejo (17-sep-2026, fila 45). */
U.envolver(App, 'App.verDocumentos', 'archivo-personas.js', function (comoEra) {
  return async function (a, opciones) {
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
    return comoEra(a, opciones);
  };
});

$('buscar-archivo').oninput = function () { App.pintarArchivo(); };
$('archivo-curso').onchange = function () {
  App.E.cursoArchivo = $('archivo-curso').value;
  App.verArchivo();
};

/* Fila 175, punto 3: "Actualizar" y "Reconstruir el índice" pasan al
   menú de tres puntos, a la derecha del buscador. Mismos textos,
   mismo comportamiento. */
(function () {
  var actualizar = document.createElement('button');
  actualizar.type = 'button';
  actualizar.id = 'btn-recargar-archivo';
  actualizar.className = 'boton';
  actualizar.textContent = 'Actualizar';
  actualizar.onclick = function () { App.verArchivo(); };

  var reconstruir = document.createElement('button');
  reconstruir.type = 'button';
  reconstruir.id = 'btn-reconstruir-indice';
  reconstruir.className = 'boton';
  reconstruir.title = 'Recorre el archivo entero una vez y guarda el índice de búsqueda';
  reconstruir.textContent = 'Reconstruir el índice';
  reconstruir.onclick = function () { App.reconstruirIndiceArchivo(reconstruir); };

  document.querySelector('#pantalla-archivo .acciones').appendChild(U.menuDeAcciones([actualizar, reconstruir]));
})();

/* ==========================================================
   PANTALLA: PERSONAS
   ========================================================== */

App.personasCargadas = null;

/* Puntos previstos de la ficha de Personas (fila 166): la ficha de una
   categoría que monta otro módulo (`{ html(p), enganchar(caja, p) }`), y
   lo que se añade después de pintar cualquier ficha (`fn(p, caja)`). */
App.FICHAS_DE_CATEGORIA = {};
App.trasPintarFicha = [];
/* Y la lista de una categoría pintada a su manera (fila 167:
   Administraciones, agrupada): `fn(caja, fuente, texto, tarjeta)` -> cuántos. */
App.LISTAS_DE_CATEGORIA = {};

App.pintarPersonas = async function () {
  var categoria = $('filtro-personas').value;
  var turno = App.turnoPersonas = (App.turnoPersonas || 0) + 1;   /* el último gana (fila 167) */
  var fuente = await Datos.cargar(App.E.datos, categoria);
  if (turno !== App.turnoPersonas) return;
  App.personasCargadas = fuente;
  App.buscarPersonas();
};

App.buscarPersonas = function () {
  if (!App.personasCargadas) return;
  var texto = $('buscar-personas').value;
  var caja = $('lista-personas');
  caja.innerHTML = '';
  function tarjeta(p) {
    var d = document.createElement('div');
    d.className = App.claseDeResultado(p);
    if (window.PersonasFamilias) PersonasFamilias.marcarTarjeta(d, p);   /* fila 125 */
    if (p.id) d.dataset.nie = p.id;
    d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                  '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
    d.onclick = function () { App.verFicha(p); };
    return d;
  }
  /* Fila 125: en Alumnado, familias arriba, matriculados y aspirantes, y
     los antiguos plegados (js/personas-familias.js). */
  if ($('filtro-personas').value === 'ALUMNADO' && window.PersonasFamilias) {
    if (!PersonasFamilias.pintar(caja, App.personasCargadas, texto, tarjeta, function (h) { App.verFicha(h); })) {
      caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
    }
  } else if (App.LISTAS_DE_CATEGORIA[$('filtro-personas').value]) {
    if (!App.LISTAS_DE_CATEGORIA[$('filtro-personas').value](caja, App.personasCargadas, texto, tarjeta)) {
      caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
    }
  } else {
    var lista = U.normalizar(texto).length >= 2
      ? Datos.buscar(App.personasCargadas.lista, texto, 60)
      : App.personasCargadas.lista.slice(0, 60);
    if (!lista.length) caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
    lista.forEach(function (p) { caja.appendChild(tarjeta(p)); });
  }
  if (!App.admiteAlta($('filtro-personas').value)) return;   /* fila 166: tutores, sin alta */
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
  if (window.PersonasFamilias) PersonasFamilias.marcarVista(p);   /* fila 125 */

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
    /* «Hermanos en el centro», justo después de «Curso» (fila 125). */
    html += window.PersonasFamilias
      ? PersonasFamilias.filasConHermanos(d.destacados, p, pintarFilas) : pintarFilas(d.destacados);
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
  } else if (App.FICHAS_DE_CATEGORIA[p.categoria]) {
    html += App.FICHAS_DE_CATEGORIA[p.categoria].html(p);
  } else {
    html += pintarFilas(Object.keys(p.campos).map(function (c) {
      return { titulo: c, valor: p.campos[c] };
    }));
  }

  /* Fila 175, punto 2: "+ Nuevo asunto para esta persona", junto a
     "Cambiar los datos" (si sale). Fila 175, punto 1: "Sus asuntos"
     sale solo, sin pulsar nada. */
  html += '<p class="nota" id="ficha-persona-acciones"></p>' +
          '<h4 id="titulo-sus-asuntos">Sus asuntos</h4><div id="asuntos-del-tercero">' +
          '<p class="explica">Buscando…</p></div>';

  caja.innerHTML = html;

  if ($('ver-resto')) {
    $('ver-resto').onclick = function () {
      $('resto-ficha').classList.toggle('oculto');
    };
  }
  if (window.PersonasFamilias) PersonasFamilias.engancharHermanos(caja);
  if (App.FICHAS_DE_CATEGORIA[p.categoria]) App.FICHAS_DE_CATEGORIA[p.categoria].enganchar(caja, p);
  App.trasPintarFicha.forEach(function (f) {
    try { f(p, caja); } catch (e) { /* un módulo roto no tumba la ficha */ }
  });

  var acciones = $('ficha-persona-acciones');
  /* Y, si es de los que se dieron de alta a mano, el botón de cambiar
     sus datos. */
  if (App.sePuedeCambiarElTercero(p)) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.id = 'cambiar-tercero';
    b.textContent = 'Cambiar los datos';
    b.onclick = function () { App.cambiarDatosDelTercero(p); };
    acciones.appendChild(b);
  }
  var nuevoAsunto = document.createElement('button');
  nuevoAsunto.type = 'button';
  nuevoAsunto.id = 'nuevo-asunto-persona';
  nuevoAsunto.className = 'boton';
  nuevoAsunto.style.marginLeft = '8px';
  nuevoAsunto.textContent = '+ Nuevo asunto para esta persona';
  nuevoAsunto.onclick = function () { App.nuevoAsuntoCon({ tercero: p }); };
  acciones.appendChild(nuevoAsunto);

  App.verAsuntosDeTercero(p);
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
    U.aviso('No he podido guardar el cambio: ' + U.mensajeDeError(e), 'malo');
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
   archivados: sale sola al abrir la ficha (fila 175, punto 1), y cada
   fila se puede pulsar y abre esa ficha (abiertos con
   App.abrirFicha; archivados con OtrosDelTercero.montarArchivado,
   igual que "Abrir el que ya existe" de un duplicado archivado,
   js/duplicados.js). Abiertos primero, cada grupo del más reciente al
   más antiguo. */
App.verAsuntosDeTercero = async function (p) {
  var caja = $('asuntos-del-tercero');
  var titulo = $('titulo-sus-asuntos');
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

  /* Abiertos primero; dentro de cada grupo, del más reciente al más
     antiguo (el nombre empieza por AAMMDD, así que basta con ordenar
     al revés por nombre). */
  salida.sort(function (a, b) {
    if (a.donde !== b.donde) return a.donde === 'Abierto' ? -1 : 1;
    return a.nombre < b.nombre ? 1 : -1;
  });

  if (titulo) titulo.textContent = 'Sus asuntos' + (salida.length ? ' (' + salida.length + ')' : '');

  if (!salida.length) {
    caja.innerHTML = '<div class="vacio">Todavía no hay ningún asunto suyo.</div>';
    return;
  }

  function abrirFilaDeAsunto(a) {
    if (a.donde === 'Abierto') {
      var abierto = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === a.nombre; })[0];
      if (!abierto) { U.aviso('Ya no está abierto: puede que se haya archivado desde otro ordenador.', 'malo'); return; }
      App.abrirFicha(abierto, 'abierto');
      return;
    }
    (async function () {
      var objeto = window.OtrosDelTercero ? await OtrosDelTercero.montarArchivado(a.nombre, p.categoria, texto) : null;
      if (!objeto) { U.aviso('No he podido abrir «' + a.nombre + '»: ya no está en el archivo.', 'malo'); return; }
      App.abrirFicha(objeto, 'archivado');
    })();
  }

  /* Fila 64: la ficha de uno archivado ya no está en
     App.E.registro.asuntos, hay que leer su _ficha.json (se tiene el
     manejador de la propia carpeta, así que sale barato). */
  var filas = await Promise.all(salida.map(async function (a) {
    var leido = Nombres.leer(a.nombre, App.E.tipos);
    var ficha = a.donde === 'Abierto'
      ? (App.E.registro.asuntos[a.nombre] || {})
      : ((window.FichaArchivo && await FichaArchivo.leer(a.handle)) || {});
    /* Fila 129: el estado es el hito actual, o dónde se quedó al archivar. */
    var situacion = !window.EstadoHito ? '' : (a.donde === 'Abierto'
      ? EstadoHito.textoDeNombre(a.nombre) : EstadoHito.textoArchivado(ficha));
    var div = document.createElement('div');
    div.className = 'resultado';
    div.innerHTML = '<div>' +
           /* Fila 135: aquí ya se ha elegido a la persona; el reservado se ve, con su candado. */
           (window.Reservados ? Reservados.candadoHtml({ nombre: a.nombre, leido: leido, ficha: ficha }) : '') +
           (leido.tipo ? '<span class="marca-tipo" title="' + U.escapar(leido.tipo) + '">' +
                         U.escapar(Nombres.tipoParaVer(leido.tipo, App.E.tipos)) + '</span>' : '') +
           (situacion ? '<span class="marca-hito">' + U.escapar(situacion) + '</span>' : '') +
           U.escapar(a.nombre) + '</div>' +
           '<div class="resultado-pie">' + a.donde +
           (leido.fecha ? '  ·  ' + U.fechaLegible(leido.fecha) : '') + '</div>';
    div.onclick = function () { abrirFilaDeAsunto(a); };
    return div;
  }));
  caja.innerHTML = '';
  filas.forEach(function (div) { caja.appendChild(div); });
};

Nombres.opcionesCategorias($('filtro-personas'), 'lista');   /* fila 166: la lista única */
$('filtro-personas').onchange = function () { App.pintarPersonas(); };
$('buscar-personas').oninput = function () { App.buscarPersonas(); };
