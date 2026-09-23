/* ============================================================
   documentos-sueltos.js — lo que llega y lo que se archiva.

   Un fichero suelto en la carpeta de asuntos abiertos es trabajo que
   todavía no tiene carpeta: casi siempre, algo que ha dejado ahí el
   equipo directivo. Se enseñan arriba del todo, y los que llegan con
   la aplicación abierta se marcan como nuevos.

   Aquí están también la vigilancia que mira cada poco si ha llegado
   alguno, y el archivado y la reapertura de asuntos.
   ============================================================ */

/* El marcador con el que se abre un suelto en el visor (17-sep-2026,
   fila 25): así se sabe, sin ambigüedad, cuál de la lista es. */
function marcadorDeSuelto(nombre) { return 'suelto:' + nombre; }

/* Si el documento que se está viendo ha dejado de estar en "Por
   clasificar" (se ha creado un asunto con él, se ha metido en uno que
   ya existía, o se ha borrado), el visor se cierra solo: no tiene
   sentido seguir viendo ni sus botones ni su documento. */
function cerrarVisorSiYaNoEsSuelto() {
  if (!window.Visor) return;
  var m = Visor.marcadorAbierto();
  if (!m || m.indexOf('suelto:') !== 0) return;
  var nombre = m.slice('suelto:'.length);
  if (!App.E.sueltos.some(function (s) { return s.nombre === nombre; })) Visor.cerrar();
}

/* El último repintado gana (fila 101): la lista se monta aparte y se
   cambia de una vez al final, y una pasada vieja que termina tarde no
   pinta nada (antes salían tarjetas repetidas). */
App.turnoSueltos = 0;

App.pintarSueltos = async function () {
  var turno = ++App.turnoSueltos;
  cerrarVisorSiYaNoEsSuelto();
  var q = U.normalizar($('buscar-abiertos').value);
  var lista = App.E.sueltos.filter(function (s) {
    return !q || U.normalizar(s.nombre).indexOf(q) !== -1;
  });

  var cuantosNuevos = Object.keys(App.E.reciales).length;
  $('btn-sueltos-visto').classList.toggle('oculto', !cuantosNuevos);
  var rotulo = $('nuevos-sueltos');
  rotulo.textContent = cuantosNuevos === 1 ? '1 nuevo' : cuantosNuevos + ' nuevos';
  rotulo.classList.toggle('oculto', !cuantosNuevos);
  App.pintarCuentas();

  /* Saber la fecha de cada documento obliga a abrirlo, así que solo se
     hace cuando esta lista está a la vista. */
  if (App.E.vista !== 'clasificar') return;

  var caja = $('lista-sueltos');
  if (!lista.length) {
    caja.innerHTML = '';
    caja.innerHTML = '<div class="vacio">' + (App.E.sueltos.length
      ? 'Ningún documento coincide con lo que buscas.'
      : 'No hay documentos sueltos. Todo lo que ha llegado está ya dentro de su asunto.') +
      '</div>';
    return;
  }

  var conFecha = lista.length <= 40;
  var nueva = document.createDocumentFragment();
  for (var i = 0; i < lista.length; i++) {
    var s = lista[i];
    var pie = '';
    if (conFecha) {
      try {
        var f = await s.handle.getFile();
        var d = new Date(f.lastModified);
        pie = isNaN(d.getTime()) ? ''
            : 'Puesto ahí el ' + d.toLocaleDateString('es-ES') + ' a las ' +
              String(d.getHours()).padStart(2, '0') + ':' +
              String(d.getMinutes()).padStart(2, '0');
      } catch (e) { pie = ''; }
      if (turno !== App.turnoSueltos) return;
    }
    nueva.appendChild(App.tarjetaSuelto(s, pie, !!App.E.reciales[s.nombre]));
  }
  if (turno !== App.turnoSueltos) return;
  caja.innerHTML = '';
  caja.appendChild(nueva);
};

App.tarjetaSuelto = function (s, pie, esNuevo) {
  var div = document.createElement('div');
  var abierta = window.Visor && Visor.marcadorAbierto() === marcadorDeSuelto(s.nombre);
  div.className = 'tarjeta tarjeta-suelto' + (esNuevo ? ' tarjeta-nueva' : '') +
                   (abierta ? ' tarjeta-abierta' : '');
  div.dataset.suelto = s.nombre;
  div.title = 'Pulsa para verlo al lado del programa';
  div.onclick = function (ev) {
    if (ev.target.closest('button, a, input, select, textarea, label, .acciones')) return;
    App.abrirSuelto(s);
  };
  var ext = Nombres.extensionDe(s.nombre);
  div.innerHTML = App.ICONO_DOCUMENTO +
    '<div class="tarjeta-texto">' +
      '<div class="tarjeta-nombre">' +
        (esNuevo ? '<span class="marca-nueva">NUEVO</span>' : '') +
        (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
        U.escapar(s.nombre) +
      '</div>' +
      '<div class="tarjeta-pie">' + U.escapar(pie) + '</div>' +
    '</div>';

  var acciones = document.createElement('div');
  acciones.className = 'acciones';

  /* A la vista, las dos que se usan de verdad al mirar la lista; el
     resto (Abrir, Separar, Unir, Sacar páginas, y Borrar, que lo añade
     js/papelera.js por envoltura) va detrás del menú de tres puntos,
     para que el nombre nunca se estruje (17-sep-2026, fila 36,
     docs/FILAS-QUE-NO-SE-ESTRUJAN.md). */
  var enMenu = [];

  var ver = document.createElement('button');
  ver.className = 'boton';
  ver.textContent = 'Abrir';
  ver.title = 'Lo abre en otra pestaña para verlo';
  ver.onclick = function () { App.abrirSuelto(s); };
  enMenu.push(ver);

  var crear = document.createElement('button');
  crear.className = 'boton boton-principal';
  crear.textContent = 'Crear asunto con él';
  crear.onclick = function () { App.empezarAsuntoCon(s); };
  acciones.appendChild(crear);

  /* Muchas veces el documento es de un asunto que ya existe. Este botón
     lo lleva allí sin crear nada. */
  var meter = document.createElement('button');
  meter.className = 'boton';
  meter.textContent = 'Meter en un asunto';
  meter.title = 'Lo lleva a la carpeta de un asunto que ya existe';
  /* Apagado mientras dura todo (fila 100: se podía pulsar dos veces). */
  meter.onclick = async function () {
    if (meter.disabled) return;
    meter.disabled = true;
    try { await App.meterSueltoEnAsunto(s); }
    catch (e) { U.fallo('No he podido meterlo en el asunto', e); }
    finally { meter.disabled = false; }
  };
  acciones.appendChild(meter);

  /* Separar, Unir y Sacar páginas (17-sep-2026, fila 22,
     docs/SEPARAR-Y-UNIR-PDF.md): solo para PDF, también aquí, para el
     escaneo de golpe que trae papeles de varios asuntos a la vez. */
  if (window.PdfSepararUnir && window.PdfHerramientas && PdfHerramientas.esPdf(s.nombre, '')) {
    function botonPdfSuelto(texto, ayuda, accion) {
      var boton = document.createElement('button');
      boton.className = 'boton';
      boton.title = ayuda;
      boton.textContent = texto;
      boton.onclick = function () {
        accion({
          modo: 'suelto', dir: App.E.abiertos, nombre: s.nombre, handle: s.handle,
          alTerminar: function () { App.pintarSueltos(); }
        });
      };
      return boton;
    }
    enMenu.push(botonPdfSuelto('Separar', 'Partirlo en varios documentos', PdfSepararUnir.separar));
    enMenu.push(botonPdfSuelto('Unir', 'Juntarlo con otro PDF de Por clasificar', PdfSepararUnir.unir));
    enMenu.push(botonPdfSuelto('Sacar páginas', 'Sacar una copia con solo algunas páginas', PdfSepararUnir.sacarPaginas));
    /* Fila 57, 18-sep-2026, docs/HUECO-PARA-SELLO-Y-FIRMA.md. Texto del
       botón "Ajustar tamaño" desde la fila 58 (docs/AJUSTES-DE-USO-2026-
       09-18.md, 2); el fichero y la función se quedan igual. */
    if (window.PrepararDocumento) {
      enMenu.push(botonPdfSuelto('Ajustar tamaño',
        'Deja hueco arriba para el sello de Séneca y abajo para la firma', PrepararDocumento.abrir));
    }
  }

  /* Siempre hay al menos "Abrir": el menú existe siempre, así
     js/papelera.js siempre encuentra dónde meter "Borrar" al final. */
  acciones.appendChild(U.menuDeAcciones(enMenu));

  div.appendChild(acciones);
  return div;
};

/* ---------- meter un documento suelto en un asunto que ya existe ----------

   El cuadro de elegir asunto es el mismo de la bandeja de correos, y
   vive en js/elegir-asunto.js. Lo único propio de aquí es la
   puntuación de "Podrían encajar": de un documento suelto solo se sabe
   el nombre del fichero.

     +10  por cada palabra de cuatro letras o más del nombre del
          fichero (sin extensión, sin la fecha AAMMDD de delante y sin
          el código de registro) que aparezca en el nombre del asunto.
     +40  el nombre del tercero del asunto (apellidos y nombre, en
          cualquier orden) aparece en el nombre del fichero.
     +15  el asunto está abierto.
     +10  el asunto se creó o se movió en los últimos 30 días.
     +50  (fila 88, 21-sep-2026) el lector ya ha reconocido el tercero
          del documento, y es el mismo que el del asunto.
     +10  (fila 88) el lector ya ha reconocido el tipo, y es el mismo
          que el del asunto.

   Se enseñan los que pasen de 40 puntos, como mucho cinco. */

App.palabrasDelSuelto = function (nombre) {
  var limpio = String(nombre || '')
    .replace(/\.[A-Za-z0-9]{1,8}$/, ' ')            /* la extensión */
    .replace(/^\d{6}(?=\D|$)/, ' ')                 /* la fecha AAMMDD de delante */
    .replace(/\d{2}[ESes][MAma]\d{4}/g, ' ');       /* el código de registro */
  return U.normalizar(limpio)
    .split(/[^a-z0-9ñ]+/)
    .filter(function (p) { return p.length >= 4; });
};

/* Fila 88, 21-sep-2026, docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md, punto
   8: si js/documentos-sueltos-lector.js ya tiene un resultado en caché
   para este fichero (la pantalla de "Por clasificar" lo lee siempre
   que puede), se suma a la puntuación de siempre, sin quitar nada:
   +50 si el tercero leído es el del asunto, +10 si el tipo leído es
   el del asunto. Así, en "Meter en un asunto", los asuntos del
   tercero leído salen arriba en "Podrían encajar". Sin lector
   cargado, o sin resultado todavía (o sin nada que proponer), la
   puntuación es la de siempre. */
App.parecidoDelSuelto = function (nombre) {
  var E = window.ElegirAsunto;
  var palabras = App.palabrasDelSuelto(nombre);
  var texto = U.normalizar(nombre);
  var leido = window.LectorDeSueltos && window.LectorDeSueltos.resultadoDe(nombre);
  var S = window.SugerenciasAsuntoExistente;
  return E.mejores(E.todos().map(function (x) {
    var puntos = E.puntosPorPalabras(palabras, x.nombre);
    if (E.terceroDentroDe(x.ficha, texto)) puntos += 40;
    puntos += E.puntosDeBase(x.nombre, x.ficha);
    if (leido) {
      if (leido.tercero && x.ficha.categoria === leido.tercero.categoria && S &&
          S.esDelMismoTercero(leido.tercero, x.ficha.tercero)) puntos += 50;
      if (leido.tipo && x.ficha.tipo === leido.tipo.tipo) puntos += 10;
    }
    return { nombre: x.nombre, ficha: x.ficha, puntos: puntos };
  }));
};

App.meterSueltoEnAsunto = async function (s) {
  var E = window.ElegirAsunto;

  var sugeridos = [];
  try { sugeridos = App.parecidoDelSuelto(s.nombre); } catch (e) { sugeridos = []; }

  var elegido = await E.elegir({
    titulo: 'Meter el documento en un asunto',
    cabecera: '<p class="explica">' + U.escapar(s.nombre) +
              '<br><span class="suave">Se llevará a la carpeta del asunto que elijas, ' +
              'y después se abrirá el cuadro de ponerle nombre.</span></p>',
    sugeridos: sugeridos
  });
  if (!elegido) return;
  await App.meterSueltoEnAsuntoElegido(s, elegido);
};

/* El traslado propiamente dicho, una vez que ya se sabe a qué asunto
   ({nombre, ficha}): si está archivado, pregunta si reabrir antes de
   meterlo (App.llevarSueltoA, más abajo). Es lo que hace
   App.meterSueltoEnAsunto tras "Meter en un asunto", pero se saca
   aparte (21-sep-2026, fila 88, docs/POR-CLASIFICAR-ASUNTO-
   EXISTENTE.md) porque "Meter aquí", el botón de la sugerencia que
   pinta js/documentos-sueltos-sugerencias.js, ya sabe a qué asunto va
   sin pasar por el cuadro de elegir: necesita el mismo camino, sin
   repetirlo. */
/* `opciones` (fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, sección 1,
   camino "Desde 'Por clasificar'"): opcional, con `{ hito }`. Viaja
   tal cual hasta App.verDocumentos, para que al ponerle nombre al
   documento ya movido quede apuntado al hito. */
App.meterSueltoEnAsuntoElegido = async function (s, elegido, opciones) {
  var E = window.ElegirAsunto;

  if (!E.estaArchivado(elegido.ficha)) {
    await App.llevarSueltoA(s, elegido.nombre, elegido.ficha, opciones);
    return;
  }

  var que = await E.preguntarSiReabrir(elegido, {
    explica: '<p>Si el documento es de una gestión que vuelve a moverse, lo normal es ' +
             'reabrir el asunto. Si solo es papeleo que llega tarde, no hace falta.</p>',
    reabrir: 'Reabrir y meterlo aquí',
    sinReabrir: 'Meterlo sin reabrir'
  });
  if (que === 'reabrir') {
    var ficha = elegido.ficha || {};
    var dentro;
    try {
      dentro = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
    } catch (e) {
      U.aviso('No encuentro la carpeta de ese asunto en el ARCHIVO: ' + U.mensajeDeError(e), 'malo');
      return;
    }
    await App.reabrirAsunto({ nombre: elegido.nombre, padre: dentro, ficha: ficha });
    /* Si no se ha llegado a reabrir (se canceló, o falló el traslado de
       la carpeta), el documento no se toca. */
    if (!(await Carpetas.existe(App.E.abiertos, elegido.nombre))) return;
    await App.llevarSueltoA(s, elegido.nombre, {}, opciones);
  } else if (que === 'guardar') {
    await App.llevarSueltoA(s, elegido.nombre, elegido.ficha, opciones);
  }
};

/* El traslado propiamente dicho. Carpetas.moverFichero ya copia,
   comprueba que la copia pesa lo mismo y solo entonces borra: en las
   carpetas de Dropbox el move() del navegador no vale. Si algo falla,
   el documento se queda en "Por clasificar". */
App.llevarSueltoA = async function (s, nombreAsunto, ficha, opciones) {
  var E = window.ElegirAsunto;

  var destino;
  try {
    destino = await E.carpetaDelAsunto(nombreAsunto, ficha);
  } catch (e) {
    U.aviso('No encuentro la carpeta de ese asunto: ' + U.mensajeDeError(e), 'malo');
    return;
  }

  /* Las rutas muy largas dan problemas en un Dropbox sincronizado: se
     avisa y se deja decidir, como al crear un asunto. */
  var ruta = nombreAsunto + '/' + s.nombre;
  if (ruta.length > App.LARGO_MAXIMO_NOMBRE) {
    var seguir = await U.preguntar('La ruta es muy larga',
      '<p>El documento quedaría en una ruta de ' + ruta.length + ' caracteres:</p>' +
      '<p class="nota">' + U.escapar(ruta) + '</p>' +
      '<p>Las rutas muy largas dan problemas en un Dropbox sincronizado.</p>',
      'Meterlo igual');
    if (!seguir) return;
  }

  /* Si ya hay un fichero con ese nombre en el destino, no se pisa:
     igual que hace Documentos.guardar. */
  var yaEsta = false;
  try {
    await destino.getFileHandle(s.nombre);
    yaEsta = true;
  } catch (e) { yaEsta = false; }
  if (yaEsta) {
    U.aviso('Ya hay un documento llamado "' + s.nombre + '" en ese asunto. ' +
            'No lo he pisado: sigue en Por clasificar.', 'malo');
    return;
  }

  try {
    await Carpetas.moverFichero(App.E.abiertos, s.nombre, destino);
  } catch (e) {
    /* Con el motivo (fila 100): antes se callaba. */
    U.fallo('El documento no ha podido entrar en el asunto. Sigue en Por clasificar', e);
    return;
  }

  delete App.E.reciales[s.nombre];
  U.aviso('Documento metido en ' + nombreAsunto + '.', 'bueno');
  /* Desde un hito (arreglo de la fila 103): queda apuntado a él nada
     más entrar, con el nombre que trae, aunque luego se cierre el
     cuadro sin ponerle otro. Si se le pone nombre, js/documentos.js
     cambia el viejo por el nuevo en el hito. */
  var hito = opciones && opciones.hito;
  if (hito && window.Hitos) {
    try {
      await Hitos.anadirDocumento(nombreAsunto, hito.id, s.nombre);
      if (window.HitosRequisitos) {
        try { await HitosRequisitos.marcarPorDocumento(nombreAsunto, hito.id, s.nombre); } catch (e4) { /* no crítico */ }
      }
    } catch (e3) {
      U.accesorio('Documento metido, pero no he podido apuntarlo al hito', e3);
    }
    if (window.HitosPanel) HitosPanel.desplegarAlAbrir(nombreAsunto, hito.id);
  }
  try {
    await App.verAbiertos();

    /* Con el documento ya dentro, el cuadro de siempre para ponerle el
       nombre que le toca. */
    await App.verDocumentos({
      nombre: nombreAsunto, handle: destino,
      ficha: (App.E.registro.asuntos || {})[nombreAsunto] || {},
      leido: Nombres.leer(nombreAsunto, App.E.tipos)
    }, hito ? { hito: hito, ponerNombre: s.nombre } : opciones);
  } catch (e2) {
    U.accesorio('Documento metido, pero no he podido abrir el cuadro para ponerle nombre', e2);
  }
  /* El hito sigue desplegado al volver a la ficha. */
  if (hito && window.HitosPanel) {
    HitosPanel.desplegarAlAbrir(nombreAsunto, hito.id);
    HitosPanel.programarRepintado();
  }
};

App.abrirSuelto = async function (s) {
  try {
    var f = await s.handle.getFile();
    var url = URL.createObjectURL(f);
    window.open(url, '_blank');
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  } catch (e) {
    U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(e), 'malo');
  }
};

App.empezarAsuntoCon = function (s) {
  App.E.pendiente = s;
  delete App.E.reciales[s.nombre];
  App.actualizarTitulo();
  App.ir('nuevo');
};

App.pintarPendiente = function () {
  var caja = $('aviso-pendiente');
  if (!App.E.pendiente) { caja.classList.add('oculto'); caja.innerHTML = ''; return; }
  caja.classList.remove('oculto');
  caja.innerHTML = '<strong>Este asunto se crea con un documento.</strong>' +
    '<p>' + U.escapar(App.E.pendiente.nombre) + ' se meterá dentro de la carpeta nueva. ' +
    'Después se abrirá el cuadro para ponerle el nombre.</p>';
  var b = document.createElement('button');
  b.className = 'boton';
  b.textContent = 'Dejarlo donde está';
  b.onclick = function () { App.E.pendiente = null; App.pintarPendiente(); };
  caja.appendChild(b);
};

$('btn-sueltos-visto').onclick = function () {
  App.E.reciales = {};
  App.actualizarTitulo();
  App.pintarSueltos();
};

/* ---------- mirar cada poco si ha llegado algo ----------

   El navegador no avisa solo cuando aparece un fichero, así que hay
   que ir a mirar. Solo se leen los nombres de la carpeta, no se abre
   nada, y por eso no se nota aunque haya cientos de asuntos.

   Mientras la pestaña esté cerrada no hay aviso: esto solo funciona
   con la aplicación abierta. */
App.mirando = false;

App.vigilarLaCarpeta = function () {
  setInterval(App.mirarLaCarpeta, App.SEGUNDOS_ENTRE_MIRADAS * 1000);
  window.addEventListener('focus', App.mirarLaCarpeta);
};

App.mirarLaCarpeta = async function () {
  if (!App.E.abiertos || App.mirando) return;
  /* Con un guardado o un traslado en marcha no se mira (fila 99,
     docs/GUARDAR-EN-FILA.md): durante un archivado vería desaparecer
     la carpeta y sacaría de la ficha con un aviso en rojo. */
  if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
  if ($('aplicacion').classList.contains('oculto')) return;
  App.mirando = true;
  try {
    var hay = await Carpetas.contenido(App.E.abiertos);

    var antes = App.E.sueltos.map(function (f) { return f.nombre; });
    var ahora = hay.ficheros
      .filter(function (f) { return App.esDocumentoDeTrabajo(f.nombre); })
      .map(function (f) { return f.nombre; });
    var llegados = ahora.filter(function (n) { return antes.indexOf(n) === -1; });

    var carpetasAntes = App.E.listaAbiertos.map(function (a) { return a.nombre; }).join('|');
    var carpetasAhora = hay.carpetas
      .filter(function (c) { return c.nombre.charAt(0) !== '_'; })
      .map(function (c) { return c.nombre; }).join('|');

    var algoCambia = llegados.length || antes.length !== ahora.length ||
                     carpetasAntes !== carpetasAhora;
    if (!algoCambia) return;

    llegados.forEach(function (n) { App.E.reciales[n] = true; });
    await App.verAbiertos(hay);

    if (llegados.length === 1) {
      U.aviso('Ha llegado un documento nuevo: ' + llegados[0], 'bueno');
    } else if (llegados.length > 1) {
      U.aviso('Han llegado ' + llegados.length + ' documentos nuevos.', 'bueno');
    }
  } catch (e) {
    /* Si se ha perdido el permiso sobre la carpeta, ya se verá al
       pulsar cualquier botón. Aquí no se molesta al usuario. */
  } finally {
    App.mirando = false;
  }
};

/* El contador de la pestaña del navegador, para enterarse aunque se
   esté trabajando en otra ventana. */
App.actualizarTitulo = function () {
  var n = Object.keys(App.E.reciales).length;
  document.title = n ? '(' + n + ') ' + App.TITULO : App.TITULO;
};

/* ---------- las acciones, también dentro del panel del visor ----------

   (17-sep-2026, fila 25). Mismos botones que la tarjeta, tal cual: se
   construye la tarjeta entera (que ya trae "Borrar", puesto por
   js/papelera.js envolviendo App.tarjetaSuelto) y se saca su bloque de
   acciones, quitando "Abrir" porque ahí ya se está viendo. Así no hay
   una segunda copia de la lógica de los botones. */
App.accionesDeSuelto = function (s) {
  var tarjeta = App.tarjetaSuelto(s, '', false);
  var acciones = tarjeta.querySelector('.acciones');
  if (!acciones) return null;
  /* "Abrir" vive ahora dentro del menú de tres puntos (fila 36), no
     suelto entre los hijos directos: se busca en cualquier profundidad
     y se quita de donde esté. */
  var abrir = Array.prototype.filter.call(acciones.querySelectorAll('button'), function (b) {
    return (b.textContent || '').trim() === 'Abrir';
  })[0];
  if (abrir && abrir.parentNode) abrir.parentNode.removeChild(abrir);
  return acciones;
};

/* ---------- marcar en la lista el documento que se está viendo ----------

   (17-sep-2026, fila 25). js/visor.js no sabe nada de esta lista: solo
   avisa de qué marcador está abierto (o ninguno) cada vez que cambia.
   Aquí se traduce eso a la tarjeta de verdad. */
(function () {
  function marcar(marcador) {
    var caja = $('lista-sueltos');
    if (!caja) return;
    Array.prototype.forEach.call(caja.querySelectorAll('.tarjeta-abierta'), function (el) {
      el.classList.remove('tarjeta-abierta');
    });
    if (!marcador || marcador.indexOf('suelto:') !== 0) return;
    var nombre = marcador.slice('suelto:'.length);
    var fila = Array.prototype.filter.call(caja.querySelectorAll('.tarjeta-suelto'), function (el) {
      return el.dataset.suelto === nombre;
    })[0];
    if (!fila) return;
    fila.classList.add('tarjeta-abierta');
    fila.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function enganchar() {
    if (!window.Visor) return;
    Visor.alCambiar(marcar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();
})();
