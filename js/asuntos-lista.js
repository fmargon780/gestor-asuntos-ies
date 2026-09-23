/* ============================================================
   asuntos-lista.js — la pantalla de asuntos abiertos.

   Las tres tarjetas de arriba, las tarjetas por tipo de asunto que
   salen dentro de dos de ellas, el orden, los filtros y la tarjeta de
   cada asunto. También el estado, la vía de comunicación y la fecha
   límite, que son los tres datos que se cambian desde la propia
   tarjeta sin abrir nada.
   ============================================================ */

/* Se lee la carpeta entera de una vez: las carpetas son los asuntos,
   y los ficheros sueltos son trabajo que todavía no tiene carpeta. */
App.verAbiertos = async function (yaLeido) {
  var hay = yaLeido || await Carpetas.contenido(App.E.abiertos);

  App.E.listaAbiertos = hay.carpetas
    .filter(function (c) {
      if (c.nombre.charAt(0) === '_') return false;
      if (App.E.registro.asuntos[c.nombre]) return true;
      return !Carpetas.esCarpetaTemporalDeSincronizacion(c.nombre);
    })
    .map(function (c) {
      var leido = Nombres.leer(c.nombre, App.E.tipos);
      var ficha = App.E.registro.asuntos[c.nombre] || {};
      /* Las notas entran en la búsqueda (fila 73,
         docs/BUSCAR-EN-LAS-NOTAS.md): buscaSinNotas se queda aparte
         para saber, al buscar, si una palabra solo aparece por una
         nota (y entonces enseñar el trocito de la nota, punto 2.3). */
      /* Los dos nombres del tipo, el largo y el corto (fila 97): la
         carpeta solo lleva uno de los dos. */
      var buscaSinNotas = U.normalizar(c.nombre + ' ' +
        (leido.tipo ? Nombres.nombresDeTipo(leido.tipo, App.E.tipos).join(' ') : ''));
      var notasTexto = window.Notas ? Notas.textoParaBuscar(ficha) : '';
      return { nombre: c.nombre, handle: c.handle, leido: leido, ficha: ficha,
               buscaSinNotas: buscaSinNotas, notasTexto: notasTexto,
               busca: buscaSinNotas + ' ' + U.normalizar(notasTexto) };
    });

  App.E.sueltos = hay.ficheros.filter(function (f) { return App.esDocumentoDeTrabajo(f.nombre); });

  /* Un documento que ya se ha metido en su carpeta deja de estar recién
     llegado: se quita del contador de la pestaña del navegador. */
  Object.keys(App.E.reciales).forEach(function (n) {
    var sigue = App.E.sueltos.some(function (f) { return f.nombre === n; });
    if (!sigue) delete App.E.reciales[n];
  });
  App.actualizarTitulo();

  $('cuenta-abiertos').textContent = App.E.listaAbiertos.length || '';
  App.pintarFiltroEstado();
  App.pintarCuentas();
  App.pintarAbiertos();
  await App.pintarSueltos();
};

/* Windows y Dropbox dejan por ahí ficheros suyos que no son trabajo
   de nadie, y Word deja los temporales que empiezan por ~$. */
App.FICHEROS_DEL_SISTEMA = ['desktop.ini', 'thumbs.db', '.ds_store', 'icon\r'];

App.esDocumentoDeTrabajo = function (nombre) {
  var n = String(nombre || '');
  if (!n) return false;
  if (n.charAt(0) === '.' || n.charAt(0) === '_') return false;
  if (n.indexOf('~$') === 0) return false;
  if (App.FICHEROS_DEL_SISTEMA.indexOf(n.toLowerCase()) !== -1) return false;
  return true;
};

/* Cómo se ordenan los asuntos abiertos.

   Por defecto, del más antiguo al más reciente: lo que lleva más
   tiempo abierto es lo que hay que mirar primero. El orden elegido se
   recuerda en este ordenador. */
App.ORDENES = {
  'fecha-asc':  function (a, b) { return App.claveDeFecha(a.leido.fecha) < App.claveDeFecha(b.leido.fecha) ? -1 : 1; },
  'fecha-desc': function (a, b) { return App.claveDeFecha(a.leido.fecha) > App.claveDeFecha(b.leido.fecha) ? -1 : 1; },
  'tipo':       function (a, b) { return App.textoDeOrden(a, 'tipo') < App.textoDeOrden(b, 'tipo') ? -1 : 1; },
  'tercero':    function (a, b) { return App.textoDeOrden(a, 'tercero') < App.textoDeOrden(b, 'tercero') ? -1 : 1; },
  'estado':     function (a, b) {
    var d = App.posEstado(a) - App.posEstado(b);
    if (d) return d;
    return App.claveDeFecha(a.leido.fecha) < App.claveDeFecha(b.leido.fecha) ? -1 : 1;
  },
  /* Lo que antes vence, arriba. Los que no tienen fecha límite van al
     final: no urgen, pero siguen estando. */
  'limite':     function (a, b) {
    var ka = a.ficha.limite || '9999-99-99';
    var kb = b.ficha.limite || '9999-99-99';
    if (ka !== kb) return ka < kb ? -1 : 1;
    return App.claveDeFecha(a.leido.fecha) < App.claveDeFecha(b.leido.fecha) ? -1 : 1;
  }
};

/* El sitio que ocupa el estado del asunto en la lista de Ajustes.
   Los que no tienen estado, o tienen uno que ya se quitó, al final. */
App.posEstado = function (a) {
  var i = App.posDeEstado(a.ficha.situacion || '');
  return i === -1 ? 9999 : i;
};

/* Un asunto sin fecha en el nombre se va al final en los dos sentidos. */
App.claveDeFecha = function (fecha) {
  return /^\d{6}$/.test(fecha) ? fecha : '999999';
};

App.textoDeOrden = function (a, cual) {
  if (cual === 'tipo') return U.normalizar(a.leido.tipo || 'zzz');
  return U.normalizar(a.ficha.tercero || a.leido.resto || 'zzz');
};

/* Cada estado se pinta de un color, según el sitio que ocupa en la
   lista. Hay seis colores y se van repitiendo. */
App.colorEstado = function (situacion) {
  var i = App.posDeEstado(situacion);
  return 'estado-' + (i === -1 ? 'x' : (i % 6));
};

/* ---------- la fecha límite de un asunto ----------

   Las cuentas y los textos están en plazos.js. Aquí solo queda lo que
   necesita saber de los tipos y de las fichas de los asuntos. */

/* Los días de plazo que el centro le ha puesto a un tipo en Ajustes.
   Devuelve null si ese tipo no tiene plazo. */
App.plazoDeTipo = function (nombreTipo) {
  for (var i = 0; i < App.E.tipos.length; i++) {
    if (App.E.tipos[i].tipo === nombreTipo) {
      var n = parseInt(App.E.tipos[i].plazo, 10);
      return (!isNaN(n) && n > 0) ? n : null;
    }
  }
  return null;
};

/* El plazo de un asunto, ya masticado. Null si no tiene fecha límite. */
App.plazoDe = function (a) {
  return Plazos.de((a.ficha && a.ficha.limite) || '');
};

/* Cuadro para poner, cambiar o quitar la fecha límite de un asunto que
   ya está abierto. */
/* `control` (opcional, fila 100): el botón que lo abrió, en
   «Guardando…» solo mientras se guarda, no con el cuadro abierto. */
App.editarPlazo = async function (a, control) {
  var p = App.plazoDe(a);
  var delTipo = App.plazoDeTipo(a.leido.tipo || (a.ficha && a.ficha.tipo) || '');
  var sugerida = '';
  if (!p && delTipo && a.ficha && a.ficha.abiertoEl) {
    sugerida = Plazos.sumarDias(String(a.ficha.abiertoEl).slice(0, 10), delTipo);
  }

  var ok = await U.preguntar('Fecha límite del asunto',
    '<p class="explica">Hasta cuándo hay de plazo para resolverlo. ' +
    'No sale en el nombre de la carpeta: se guarda en la carpeta del centro ' +
    'y lo ve todo el que abra la aplicación.</p>' +
    '<label class="etiqueta">Fecha límite</label>' +
    '<input id="plazo-fecha" type="date" class="campo" value="' +
    U.escapar(p ? p.limite : sugerida) + '">' +
    (delTipo ? '<p class="nota">El tipo ' + U.escapar(a.leido.tipo || '') +
               ' tiene ' + delTipo + ' días de plazo en Ajustes.</p>' : '') +
    '<p class="nota">Déjala en blanco para que el asunto se quede sin plazo.</p>',
    'Guardar');
  if (!ok) return;

  var valor = $('plazo-fecha').value;
  try {
    await U.mientrasGuarda(control || null, function () {
      return App.anotar(a.nombre, {
        limite: valor,
        limiteEl: U.ahora(),
        limitePor: App.E.usuario
      });
    });
  } catch (e) {
    U.fallo('No he podido guardarla', e);
    return;
  }
  U.aviso(valor ? 'Fecha límite guardada.' : 'Asunto sin fecha límite.', 'bueno');
  try { App.pintarAbiertos(); }
  catch (e2) { U.accesorio('Fecha guardada, pero no he podido repintar la lista', e2); }
};

App.nombreVia = function (clave) {
  var v = Nombres.via(clave);
  return v ? v.texto : (clave || '');
};

/* "Teléfono: 600 11 22 33", para el pie de la tarjeta. */
App.textoVia = function (ficha) {
  if (!ficha || !ficha.via) return '';
  var n = App.nombreVia(ficha.via);
  return ficha.viaDato ? n + ': ' + ficha.viaDato : n;
};

/* Guarda el estado que se acaba de elegir en el desplegable. */
/* Lo principal (guardar) y lo accesorio (repintar la lista) por
   separado (fila 100): si falla solo el repintado, el estado ya está
   guardado y el aviso es ámbar, nunca rojo. */
App.ponerEstado = async function (a, situacion) {
  try {
    await App.anotar(a.nombre, {
      situacion: situacion,
      situacionEl: U.ahora(),
      situacionPor: App.E.usuario
    });
  } catch (e) {
    U.fallo('No he podido guardar el estado', e);
    return false;
  }
  try {
    App.pintarAbiertos();
  } catch (e2) {
    U.accesorio('Estado guardado, pero no he podido repintar la lista', e2);
  }
  return true;
};

/* Cuadro para apuntar por dónde prefiere hablar el tercero EN ESTE
   asunto. Se guarda en la carpeta del centro, así que lo ve todo el
   que abra la aplicación sobre ella. */
App.editarVia = async function (a) {
  var actual = a.ficha.via || '';
  var opciones = '<option value="">Sin indicar</option>' +
    Nombres.VIAS.map(function (v) {
      return '<option value="' + v.clave + '"' + (v.clave === actual ? ' selected' : '') +
             '>' + U.escapar(v.texto) + '</option>';
    }).join('');

  var ok = await U.preguntar('Vía de comunicación preferente',
    '<p class="explica">Es solo de este asunto. Los datos de siempre de la persona ' +
    'están en su ficha; aquí va lo que haya dicho para esta gestión.</p>' +
    '<label class="etiqueta">Por dónde prefiere que le hablemos</label>' +
    '<select id="via-clave" class="campo">' + opciones + '</select>' +
    '<label class="etiqueta">Teléfono, correo o aclaración <span class="suave">(opcional)</span></label>' +
    '<input id="via-dato" class="campo" value="' + U.escapar(a.ficha.viaDato || '') + '" ' +
    'placeholder="Por ejemplo: 600 11 22 33">',
    'Guardar');
  if (!ok) return;

  try {
    await App.anotar(a.nombre, {
      via: $('via-clave').value,
      viaDato: $('via-dato').value.trim(),
      viaEl: U.ahora(),
      viaPor: App.E.usuario
    });
    App.pintarAbiertos();
    App.pintarArchivo();
    U.aviso('Vía de comunicación guardada.', 'bueno');
  } catch (e) {
    U.aviso('No he podido guardarla: ' + U.mensajeDeError(e), 'malo');
  }
};

/* ---------- las tres tarjetas de arriba ----------

   El trabajo de la pantalla se reparte en tres montones, según dónde
   esté ahora mismo: papeles que aún no son un asunto, asuntos que nos
   toca mover, y asuntos que dependen de que conteste otro. Se ve un
   montón cada vez, para no mezclarlos. */

App.VISTAS = ['clasificar', 'departamento', 'espera'];
App.DIAS_DE_AVISO = 15;

App.vistaGuardada = function () {
  var v = '';
  try { v = window.localStorage.getItem('vista-abiertos') || ''; } catch (e) {}
  return App.VISTAS.indexOf(v) !== -1 ? v : 'departamento';
};

App.irVista = function (cual) {
  App.E.vista = App.VISTAS.indexOf(cual) !== -1 ? cual : 'departamento';
  try { window.localStorage.setItem('vista-abiertos', App.E.vista); } catch (e) {}

  /* Al cambiar de montón se empieza viendo todos los tipos. */
  App.tipoElegido = '';

  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
    b.classList.toggle('activo', b.dataset.vista === App.E.vista);
  });
  var esClasificar = App.E.vista === 'clasificar';
  $('zona-clasificar').classList.toggle('oculto', !esClasificar);
  $('zona-asuntos').classList.toggle('oculto', esClasificar);
  /* La bandeja de correos arranca siempre plegada al entrar aquí, se
     dejara como se dejara la última vez (fila 27, 17-sep-2026): sin
     memoria en localStorage, a propósito. */
  if (esClasificar && window.BandejaPantalla) window.BandejaPantalla.plegar();
  /* Ordenar y filtrar por estado o por plazo solo tiene sentido con asuntos. */
  $('filtro-estado').parentNode.querySelectorAll('#filtro-estado, #filtro-plazo, #orden-abiertos')
    .forEach(function (el) { el.classList.toggle('oculto', esClasificar); });
  Array.prototype.forEach.call(document.querySelectorAll('.etiqueta-en-linea'), function (el) {
    el.classList.toggle('oculto', esClasificar);
  });

  App.pintarAbiertos();
  App.pintarSueltos();
};

Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
  b.onclick = function () { App.irVista(b.dataset.vista); };
});

/* ---------- los montones por tipo de asunto ----------

   Dentro de "En el departamento" y de "A la espera de terceros", los
   asuntos se agrupan además por su tipo: una tarjeta pequeña por tipo,
   encima de la lista. Al pulsar una, la lista se queda solo con los de
   ese tipo; al volver a pulsarla, vuelven a salir todos. */

App.tipoElegido = '';
App.SIN_TIPO = 'Sin tipo';

App.tipoDeAsunto = function (a) {
  return a.leido.tipo || (a.ficha && a.ficha.tipo) || App.SIN_TIPO;
};

/* Ojo con el nombre: `App.elegirTipo` ya existe, y es el de elegir el
   tipo al crear un asunto nuevo (js/asuntos-nuevo.js). Aquel fichero se
   carga después que este, así que si se repitiera el nombre este se
   perdería sin decir nada, y las tarjetas no harían nada al pulsarlas.
   Pasó el 10-sep-2026. */
App.filtrarPorTipo = function (tipo) {
  App.tipoElegido = (App.tipoElegido === tipo) ? '' : tipo;
  App.pintarAbiertos();
};

/* La fila de tarjetas vive dentro de la zona de asuntos, justo encima
   de la lista. Se crea la primera vez que hace falta. */
App.cajaDeTipos = function () {
  var caja = $('grupos-tipo');
  if (caja) return caja;
  var zona = $('zona-asuntos');
  var lista = $('lista-abiertos');
  if (!zona || !lista) return null;
  caja = document.createElement('div');
  caja.id = 'grupos-tipo';
  caja.className = 'grupos-tipo oculto';
  zona.insertBefore(caja, lista);
  return caja;
};

/* Los montones, del más gordo al más flaco. A igualdad de asuntos, por
   orden alfabético, para que no bailen de sitio. */
App.montonesPorTipo = function (lista) {
  var por = {};
  lista.forEach(function (a) {
    var t = App.tipoDeAsunto(a);
    if (!por[t]) por[t] = { tipo: t, cuantos: 0, vencidos: 0 };
    por[t].cuantos++;
    var p = App.plazoDe(a);
    if (p && p.dias <= 0) por[t].vencidos++;
  });
  return Object.keys(por).map(function (k) { return por[k]; })
    .sort(function (a, b) {
      if (a.cuantos !== b.cuantos) return b.cuantos - a.cuantos;
      return a.tipo < b.tipo ? -1 : 1;
    });
};

App.tarjetaDeTipo = function (tipo, texto, cuantos, vencidos) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'grupo' + (App.tipoElegido === tipo ? ' activo' : '');
  b.dataset.tipo = tipo;
  b.title = tipo
    ? (App.tipoElegido === tipo ? 'Volver a ver todos los tipos'
                                : 'Ver solo los asuntos de tipo ' + tipo)
    : 'Ver todos los tipos';

  var n = document.createElement('span');
  n.className = 'grupo-nombre';
  n.textContent = texto;
  b.appendChild(n);

  var c = document.createElement('span');
  c.className = 'grupo-cuenta';
  c.textContent = cuantos;
  b.appendChild(c);

  if (vencidos) {
    var v = document.createElement('span');
    v.className = 'grupo-vencidos';
    v.textContent = vencidos + ' fuera de plazo';
    b.appendChild(v);
  }

  b.onclick = function () { App.filtrarPorTipo(tipo); };
  return b;
};

/* `lista` son los asuntos del montón de arriba, ya pasados por el
   buscador y los filtros, pero todavía sin quedarnos con un tipo. */
App.pintarGruposTipo = function (lista) {
  var caja = App.cajaDeTipos();
  if (!caja) return;

  var grupos = App.montonesPorTipo(lista);

  /* Con un solo tipo, las tarjetas no dicen nada que no diga ya la
     lista de abajo. En "Por clasificar" no hay asuntos, solo papeles. */
  if (App.E.vista === 'clasificar' || grupos.length < 2) {
    caja.classList.add('oculto');
    caja.innerHTML = '';
    return;
  }

  caja.innerHTML = '';
  caja.classList.remove('oculto');

  var rotulo = document.createElement('span');
  rotulo.className = 'grupos-rotulo';
  rotulo.textContent = 'Por tipo de asunto';
  caja.appendChild(rotulo);

  caja.appendChild(App.tarjetaDeTipo('', 'Todos', lista.length, 0));
  grupos.forEach(function (g) {
    /* Se enseña el nombre corto; se agrupa y filtra por el de verdad
       (fila 97): dos tipos con el mismo corto siguen siendo dos tarjetas. */
    caja.appendChild(App.tarjetaDeTipo(g.tipo, Nombres.tipoParaVer(g.tipo, App.E.tipos), g.cuantos, g.vencidos));
  });
};

/* Cuántos días lleva un asunto en el estado que tiene puesto. */
App.diasEnEstado = function (a) {
  var d = new Date(a.ficha.situacionEl || a.ficha.abiertoEl || '');
  if (isNaN(d.getTime())) return -1;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

App.deLaVista = function (a, vista) {
  if (vista === 'espera') return App.esDeEspera(a.ficha.situacion || '');
  return !App.esDeEspera(a.ficha.situacion || '');
};

App.pintarCuentas = function () {
  var enEspera = App.E.listaAbiertos.filter(function (a) { return App.deLaVista(a, 'espera'); });
  $('cuenta-clasificar').textContent = App.E.sueltos.length;
  $('cuenta-departamento').textContent = App.E.listaAbiertos.length - enEspera.length;
  $('cuenta-espera').textContent = enEspera.length;

  var viejo = enEspera.some(function (a) { return App.diasEnEstado(a) >= App.DIAS_DE_AVISO; });
  $('cuenta-espera').classList.toggle('cuenta-roja', viejo);
  $('cuenta-clasificar').classList.toggle('cuenta-ambar', App.E.sueltos.length > 0);
};

/* El desplegable de arriba que deja ver solo los asuntos que están en
   un estado. Se rehace cada vez porque la lista de estados se puede
   cambiar en Ajustes. */
App.pintarFiltroEstado = function () {
  var sel = $('filtro-estado');
  var antes = sel.value;
  sel.innerHTML = '<option value="">Todos los estados</option>' +
    '<option value="__sin__">Sin estado</option>' +
    App.E.estados.map(function (e) {
      return '<option value="' + U.escapar(e.nombre) + '">' + U.escapar(e.nombre) + '</option>';
    }).join('');
  sel.value = antes;
  if (sel.selectedIndex === -1) sel.value = '';
};

App.ordenElegido = function () {
  var v = '';
  try { v = window.localStorage.getItem('orden-abiertos') || ''; } catch (e) {}
  return App.ORDENES[v] ? v : 'fecha-asc';
};

App.pintarAbiertos = function () {
  App.pintarCuentas();
  /* Varias palabras sueltas, en cualquier orden (fila 73,
     docs/BUSCAR-EN-LAS-NOTAS.md, punto 2.1): mismo criterio que ya
     usa el buscador del ARCHIVO (App.pintarArchivo). */
  var palabras = U.normalizar($('buscar-abiertos').value).split(' ').filter(Boolean);
  var rotulo = $('cuenta-lista-abiertos');
  var orden = App.ordenElegido();
  $('orden-abiertos').value = orden;
  var filtro = $('filtro-estado').value;
  var plazo = $('filtro-plazo').value;

  /* Primero, el montón entero: lo que pasa el buscador y los filtros.
     Sobre esto se cuentan las tarjetas de tipo. */
  var monton = App.E.listaAbiertos.filter(function (a) {
    if (!App.deLaVista(a, App.E.vista)) return false;
    if (palabras.length && !palabras.every(function (p) { return a.busca.indexOf(p) !== -1; })) return false;
    if (!Plazos.pasaFiltro(a.ficha.limite || '', plazo)) return false;
    if (filtro === '__sin__') return !a.ficha.situacion;
    if (filtro) return a.ficha.situacion === filtro;
    return true;
  });

  /* Si el tipo elegido ya no está en el montón, se vuelve a todos: si
     no, la lista se quedaría vacía sin que se vea por qué. */
  if (App.tipoElegido && !monton.some(function (a) {
    return App.tipoDeAsunto(a) === App.tipoElegido;
  })) App.tipoElegido = '';

  App.pintarGruposTipo(monton);

  var lista = App.tipoElegido
    ? monton.filter(function (a) { return App.tipoDeAsunto(a) === App.tipoElegido; })
    : monton;

  lista.sort(App.ORDENES[orden]);
  if (rotulo) rotulo.textContent = lista.length;
  var caja = $('lista-abiertos');
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">' + App.textoVacio() + '</div>';
    App.avisarALosModulos();
    return;
  }
  lista.forEach(function (a) {
    a._fragmento = App.fragmentoDeNota(a, palabras);
    caja.appendChild(App.tarjetaAsunto(a, 'abierto'));
  });
  App.avisarALosModulos();
};

/* Si el asunto ha salido en la búsqueda SOLO por una nota (ninguna de
   las palabras buscadas está en `buscaSinNotas`), el trocito de la
   nota donde aparece, para enseñar por qué ha salido (fila 73,
   docs/BUSCAR-EN-LAS-NOTAS.md, punto 2.3). null si no hay búsqueda, o
   si ya se explica solo (el nombre, el tercero...). Vale tanto para
   asuntos abiertos como archivados: los dos traen `busca`,
   `buscaSinNotas` y `notasTexto`. */
App.fragmentoDeNota = function (a, palabras) {
  if (!window.Notas) return null;
  return Notas.fragmentoSiSoloEnNota(a.busca, a.buscaSinNotas, a.notasTexto, palabras);
};

/* Dos dibujos para que se vea de un golpe qué es cada fila:
   una carpeta para los asuntos, una hoja para los documentos sueltos. */
App.ICONO_CARPETA =
  '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.6h8.8A1.5 1.5 0 0 1 21 9.1v9A1.5 1.5 0 0 1 19.5 19.6h-15A1.5 1.5 0 0 1 3 18.1z"/></svg>';

App.ICONO_DOCUMENTO =
  '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M13.8 3H7A1.5 1.5 0 0 0 5.5 4.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.7z"/>' +
  '<path d="M13.8 3v4.7h4.7"/></svg>';

App.textoVacio = function () {
  if (!App.E.listaAbiertos.length) return 'No hay asuntos abiertos. Crea el primero en "Nuevo asunto".';
  if (App.tipoElegido) return 'No queda ningún asunto de tipo ' + App.tipoElegido + ' en este montón.';
  if ($('buscar-abiertos').value.trim() || $('filtro-estado').value || $('filtro-plazo').value) {
    return 'Ningún asunto coincide con lo que buscas.';
  }
  if (App.E.vista === 'espera') return 'No hay nada esperando a terceros. Mejor así.';
  return 'Nada pendiente de gestionar aquí ahora mismo.';
};

App.tarjetaAsunto = function (a, modo) {
  var div = document.createElement('div');
  div.className = 'tarjeta tarjeta-asunto';
  var tercero = a.ficha.tercero || '';
  var situacion = a.ficha.situacion || '';
  var via = App.textoVia(a.ficha);
  var pie = [];
  if (a.leido.fecha) pie.push('Abierto el ' + U.fechaLegible(a.leido.fecha));
  if (tercero) pie.push(tercero);
  else if (a.leido.resto) pie.push(a.leido.resto);
  if (via) pie.push(via);
  if (modo === 'archivado' && a.ruta) pie.push(a.ruta);

  var dias = (modo === 'abierto' && App.esDeEspera(situacion)) ? App.diasEnEstado(a) : -1;
  var esperaLarga = dias >= App.DIAS_DE_AVISO;
  if (dias === 0) pie.push('en espera desde hoy');
  else if (dias === 1) pie.push('en espera desde ayer');
  else if (dias > 1) pie.push('en espera desde hace ' + dias + ' días');

  /* El plazo se ve de dos formas: una etiqueta de color arriba, junto
     al tipo y al estado, y la fecha completa en el pie. En el archivo
     no se enseña: allí ya no vence nada. */
  var p = (modo === 'abierto') ? App.plazoDe(a) : null;
  if (p) pie.push('Fecha límite ' + Plazos.legible(p.limite));

  /* Si ha salido en la búsqueda solo por una nota, el trocito donde
     está la palabra, con ella marcada (fila 73, punto 2.3): si no,
     Francisco ve el asunto en los resultados y no sabe por qué. */
  var fragmento = a._fragmento;
  var notaEncontrada = fragmento
    ? '<div class="tarjeta-nota-encontrada">' + U.escapar(fragmento.antes) +
      ' <mark>' + U.escapar(fragmento.palabra) + '</mark> ' + U.escapar(fragmento.despues) + '</div>'
    : '';

  div.innerHTML = App.ICONO_CARPETA +
    '<div class="tarjeta-texto">' +
      '<div class="tarjeta-nombre">' +
        (a.leido.tipo ? '<span class="marca-tipo" title="' + U.escapar(a.leido.tipo) + '">' +
                        U.escapar(Nombres.tipoParaVer(a.leido.tipo, App.E.tipos)) + '</span>' : '') +
        (situacion ? '<span class="marca-estado ' + App.colorEstado(situacion) + '">' +
                     U.escapar(situacion) + '</span>' : '') +
        (p ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '') +
        U.escapar(a.nombre) +
      '</div>' +
      '<div class="tarjeta-pie' + (esperaLarga ? ' pie-aviso' : '') + '">' +
        U.escapar(pie.join('  ·  ')) + '</div>' +
      notaEncontrada +
    '</div>';

  var acciones = document.createElement('div');
  acciones.className = 'acciones';

  /* En los asuntos abiertos, el estado se cambia aquí mismo y la vía
     de comunicación se apunta con el botón de al lado. En el archivo
     no: allí lo que hay es el rastro de lo que se hizo. */
  if (modo === 'abierto') {
    var sel = document.createElement('select');
    sel.className = 'campo campo-estado';
    sel.title = 'Estado del asunto';
    var lista = App.E.estados.map(function (e) { return e.nombre; });
    if (situacion && lista.indexOf(situacion) === -1) lista.push(situacion);
    sel.innerHTML = '<option value="">Sin estado</option>' +
      lista.map(function (e) {
        return '<option value="' + U.escapar(e) + '"' + (e === situacion ? ' selected' : '') +
               '>' + U.escapar(e) + '</option>';
      }).join('');
    sel.onchange = async function () {
      await U.mientrasGuarda(sel, function () { return App.ponerEstado(a, sel.value); });
    };
    acciones.appendChild(sel);

    var bvia = document.createElement('button');
    bvia.className = 'boton' + (a.ficha.via ? ' boton-marcado' : '');
    var v = Nombres.via(a.ficha.via);
    bvia.textContent = v ? v.corto : (a.ficha.via || 'Vía');
    bvia.title = via || 'Apuntar la vía de comunicación preferente';
    bvia.onclick = function () { App.editarVia(a); };
    acciones.appendChild(bvia);

    var bplazo = document.createElement('button');
    bplazo.className = 'boton' + (p ? ' boton-marcado' : '');
    bplazo.textContent = 'Plazo';
    bplazo.title = p ? 'Fecha límite ' + Plazos.legible(p.limite) + ' · ' + p.texto
                     : 'Poner una fecha límite a este asunto';
    bplazo.onclick = function () { App.editarPlazo(a); };
    acciones.appendChild(bplazo);

    var editar = document.createElement('button');
    editar.className = 'boton';
    editar.textContent = 'Editar';
    editar.title = 'Cambiar la fecha, el tipo, la descripción o el tercero';
    editar.onclick = function () { App.editarAsunto(a); };
    acciones.appendChild(editar);
  }

  var copiar = document.createElement('button');
  copiar.className = 'boton';
  copiar.textContent = 'Copiar nombre';
  copiar.title = 'Para pegarlo como asunto del correo';
  copiar.onclick = function () {
    U.copiar(a.nombre).then(function (ok) {
      if (ok) U.aviso('Nombre copiado.', 'bueno');
    });
  };
  acciones.appendChild(copiar);

  var ver = document.createElement('button');
  ver.className = 'boton';
  ver.textContent = 'Documentos';
  ver.onclick = function () { App.verDocumentos(a); };
  acciones.appendChild(ver);

  var principal = document.createElement('button');
  principal.className = 'boton boton-principal';
  principal.textContent = modo === 'abierto' ? 'Cerrar' : 'Reabrir';
  principal.onclick = async function () {
    await U.mientrasGuarda(principal, function () {
      return modo === 'abierto' ? App.cerrarAsunto(a) : App.reabrirAsunto(a);
    });
  };
  acciones.appendChild(principal);

  div.appendChild(acciones);
  /* Con una acción larga en marcha sobre este asunto (fila 100,
     App.conOcupado), la tarjeta sale con sus botones apagados aunque
     se repinte. */
  if (App.E.ocupados && App.E.ocupados[a.nombre]) {
    div.classList.add('tarjeta-ocupada');
    Array.prototype.forEach.call(div.querySelectorAll('button, select'), function (b) { b.disabled = true; });
  }
  return div;
};

App.verDocumentos = async function (a) {
  await Documentos.abrir(a);
};

$('buscar-abiertos').oninput = function () {
  App.pintarAbiertos();
  App.pintarSueltos();
};
$('filtro-estado').onchange = function () { App.pintarAbiertos(); };
$('filtro-plazo').onchange = function () { App.pintarAbiertos(); };

$('orden-abiertos').onchange = function () {
  try { window.localStorage.setItem('orden-abiertos', this.value); } catch (e) {}
  App.pintarAbiertos();
};
$('btn-recargar').onclick = function () { App.verAbiertos(); };
