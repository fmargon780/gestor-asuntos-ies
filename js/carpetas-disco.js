/* ============================================================
   carpetas-disco.js — soporte del navegador, elegir carpeta, permisos, listar y abrir carpetas (fila 535: trozo de js/carpetas.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/carpetas.js.
   ============================================================ */
(function () {

  var I = window.CarpetasNucleo = window.CarpetasNucleo || {};
  function soportado() {
    return typeof window.showDirectoryPicker === 'function';
  }

  /* Fila 260: en un ordenador de solo consulta, las carpetas se piden solo para leer. */
  function modo() { return (window.SoloConsulta && (SoloConsulta.soloPorMarca ? SoloConsulta.soloPorMarca() : SoloConsulta.activo())) ? 'read' : 'readwrite'; }   /* fila 287: un directivo pide permiso de escritura */

  /* Abre el cuadro de Windows para señalar una carpeta. */
  function elegir(id) {
    return window.showDirectoryPicker({ id: id, mode: modo() });
  }

  /* ¿Seguimos teniendo permiso sobre esta carpeta?
     'pedir' a true muestra el cuadro del navegador; solo vale si el
     usuario acaba de pulsar algo. */
  function permiso(dir, pedir) {
    var opciones = { mode: modo() };
    return dir.queryPermission(opciones).then(function (estado) {
      if (estado === 'granted') return true;
      if (!pedir) return false;
      return dir.requestPermission(opciones).then(function (e) { return e === 'granted'; });
    });
  }

  /* ---------- listar ---------- */

  function porNombre(a, b) {
    return a.nombre < b.nombre ? -1 : (a.nombre > b.nombre ? 1 : 0);
  }

  async function subcarpetas(dir) {
    var lista = [];
    for await (var pareja of dir.entries()) {
      if (pareja[1].kind === 'directory') lista.push({ nombre: pareja[0], handle: pareja[1] });
    }
    lista.sort(porNombre);
    return lista;
  }

  async function ficheros(dir) {
    var lista = [];
    for await (var pareja of dir.entries()) {
      if (pareja[1].kind === 'file') lista.push({ nombre: pareja[0], handle: pareja[1] });
    }
    lista.sort(porNombre);
    return lista;
  }

  /* Lo que hay en una carpeta, carpetas y ficheros, en una sola pasada.

     La pantalla de asuntos abiertos necesita las dos cosas a la vez, y
     se relee cada poco para ver si ha llegado algo nuevo. Aquí solo se
     leen los nombres: no se abre ningún fichero. */
  async function contenido(dir) {
    var carpetas = [], sueltos = [];
    for await (var pareja of dir.entries()) {
      var ficha = { nombre: pareja[0], handle: pareja[1] };
      if (pareja[1].kind === 'directory') carpetas.push(ficha);
      else sueltos.push(ficha);
    }
    carpetas.sort(porNombre);
    sueltos.sort(porNombre);
    return { carpetas: carpetas, ficheros: sueltos };
  }

  /* Google Drive y Dropbox dejan carpetas propias al sincronizar, que
     la aplicación estaba tomando por carpetas de asunto. Aquí, en un
     solo sitio, para poder ampliar la lista sin buscarla por el
     código: empiezan por un punto o una virgulilla (cubre .tmp,
     .~lock, .dropbox, .driveupload, .tmp.driveupload,
     .tmp.drivedownload y .DS_Store), o son de los nombres y trozos de
     siempre. */
  var NOMBRES_CARPETA_TEMPORAL = ['desktop.ini', 'icon\r'];

  function esCarpetaTemporalDeSincronizacion(nombre) {
    var n = String(nombre || '');
    if (!n) return true;
    if (n === '_copia-ruta') return true;   /* fila 478: la copia de seguridad de la «Ruta» (js/ruta-copia.js) */
    var c = n.charAt(0);
    if (c === '.' || c === '~') return true;
    var min = n.toLowerCase();
    if (NOMBRES_CARPETA_TEMPORAL.indexOf(min) !== -1) return true;
    return min.indexOf('conflicted copy') !== -1;
  }

  /* Los ficheros que NO se copian al trasladar una carpeta: los
     temporales de siempre, pero NUNCA una copia en conflicto de Dropbox
     («conflicted copy», fila 99, docs/GUARDAR-EN-FILA.md). Ese trozo
     del filtro de arriba es para CARPETAS: aplicado a ficheros, la
     copia no llegaba al destino y el borrado del original se la
     llevaba por delante. */
  function esFicheroQueNoSeCopia(nombre) {
    var n = String(nombre || '');
    if (n.toLowerCase().indexOf('conflicted copy') !== -1) return false;
    return esCarpetaTemporalDeSincronizacion(n);
  }

  function noSeCopia(nombre, h) {
    return h.kind === 'file' ? esFicheroQueNoSeCopia(nombre) : esCarpetaTemporalDeSincronizacion(nombre);
  }

  async function existe(dir, nombre) {
    try { await dir.getDirectoryHandle(nombre); return true; }
    catch (e) { return false; }
  }

  /* ---------- crear ---------- */

  function crear(dir, nombre) {
    return dir.getDirectoryHandle(nombre, { create: true });
  }

  /* Baja por una ruta de carpetas, creando las que falten.
     ruta es una lista: ['ALUMNADO', 'Pérez García, Ana 1234']. */
  async function bajar(dir, ruta, crearlas) {
    var actual = dir;
    for (var i = 0; i < ruta.length; i++) {
      if (!ruta[i]) continue;
      actual = await actual.getDirectoryHandle(ruta[i], { create: !!crearlas });
    }
    return actual;
  }

  I.soportado = soportado;
  I.elegir = elegir;
  I.permiso = permiso;
  I.subcarpetas = subcarpetas;
  I.ficheros = ficheros;
  I.contenido = contenido;
  I.esCarpetaTemporalDeSincronizacion = esCarpetaTemporalDeSincronizacion;
  I.noSeCopia = noSeCopia;
  I.existe = existe;
  I.crear = crear;
  I.bajar = bajar;
})();
