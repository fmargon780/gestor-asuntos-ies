/* ============================================================
   medidas.js — el Gestor apunta cuánto tarda cada cosa
   (fila 332, docs/DATOS-1-MEDIDAS.md; plan en docs/PLAN-DATOS-DEL-GESTOR.md).

   Solo se apuntan TIEMPOS, TAMAÑOS DE FICHERO y RECUENTOS. Ningún nombre
   de persona, de asunto ni de documento.

   LA REGLA QUE NO SE PUEDE ROMPER: un rótulo nunca se monta con un dato.
   Todo rótulo sale de una tabla fija de este fichero o es una palabra
   escrita en el código de quien mide. Para un fichero,
   `rotuloDeFichero(carpeta, nombre)`: el nombre solo si está en la lista
   fija; si no, por el nombre exacto de su carpeta; si no, «otro».

   Por día se guarda de cada tiempo: cuántas veces, la suma, el máximo y
   siete cubos (menos de 100 ms, 300 ms, 1 s, 3 s, 10 s, 30 s y más). Nada
   de cada medida suelta ni de la hora.

   Viven en `localStorage` (clave `gestor-medidas-AAAA-MM-DD`), como mucho
   cada 30 segundos y al ocultarse la página; no se escriben en ninguna
   carpeta. Todo va dentro de `try`: medir nunca puede dar un error ni
   frenar nada. Quien lo llama lo hace siempre con `if (window.Medidas)`.
   Se cargan antes que js/reintentar-escritura.js y js/carpetas.js.
   ============================================================ */
var Medidas = (function () {

  var PREFIJO = 'gestor-medidas-';
  var CUBOS_MS = [100, 300, 1000, 3000, 10000, 30000];
  var DIAS_MAXIMOS = 30;
  var LARGO_MAXIMO = 40;     /* el buzón rechaza un texto de más de 40 caracteres */
  var CADA_MS = 30000;

  /* Los ficheros que se conocen por su nombre. Lo que no está aquí se apunta como «otro». */
  var FICHEROS = ['asuntos.json', 'guias.json', 'tipos.json', 'estados.json',
    'tipos-documento.json', 'tablon.json', 'recurrentes.json', 'frescura.json',
    'campos.json', 'papelera.json', 'no-duplicados.json', 'hitos.json', 'grupos.json',
    'usuarios.json', 'borrados-listas.json', 'hitos-biblioteca.json', 'cargos.json',
    'formularios-campos.json', 'papelera-borrados.json', 'perfiles.json', 'encargos.json',
    'correos-a-mano.json', 'actividades.json', 'centro-de-datos.json', 'datos-origen.json',
    'indice-archivo.json', '_ficha.json', 'HISTORIAL DE TRAMITACION.txt', 'rutas.json',
    'control-registro.json', 'RegAlum.csv', 'ALUMNADO-BD.json', 'solicitantes.csv', 'personal.csv',
    'empresas.csv', 'otros.csv', 'tutores.csv', 'administraciones.json', 'plantillas.json', 'envios.json',
    'informes.json', 'margenes-pdf.json', 'responsable-migrado.json', 'estado-migrado.json'];

  /* Carpetas conocidas por su nombre exacto: sus ficheros llevan nombres de personas o de cursos. */
  var CARPETAS = { 'indice-archivo': 'indice-por-curso', 'presencia': 'presencia', 'copias': 'copia', 'medidas': 'medidas',
    'base': 'base', 'control-registro': 'registro-por-año' };

  var EXTENSIONES = ['json', 'txt', 'csv', 'pdf', 'docx'];

  /* Los errores que se cuentan por su nombre (nunca su mensaje). */
  var ERRORES = ['FicheroRoto', 'LecturaVacia', 'EsquemaMasNuevo', 'CopiaNoVerificada', 'AsuntoCerrado', 'SoloConsulta',
    'NotFoundError', 'NotAllowedError', 'NotReadableError', 'InvalidStateError', 'NoModificationAllowedError', 'AbortError',
    'QuotaExceededError', 'TypeError'];

  var memoria = {};          /* día -> { tiempos, cuentas, pesos, foto } */
  var guardando = null;
  var unaVez = {};

  function dos(n) { return (n < 10 ? '0' : '') + n; }

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
  }

  function vacio() { return { tiempos: {}, cuentas: {}, pesos: {}, foto: null }; }

  function leerAlmacen(dia) {
    try {
      var t = window.localStorage.getItem(PREFIJO + dia);
      var o = t ? JSON.parse(t) : null;
      if (o && typeof o === 'object') return Object.assign(vacio(), o);
    } catch (e) { /* sin memoria del navegador: se mide en memoria */ }
    return vacio();
  }

  function dia(d) {
    d = d || hoy();
    if (!memoria[d]) memoria[d] = leerAlmacen(d);
    return memoria[d];
  }

  function rotuloSano(r) { return String(r || 'otro').slice(0, LARGO_MAXIMO); }

  /* ---------- apuntar ---------- */

  function cubo(ms) {
    for (var i = 0; i < CUBOS_MS.length; i++) if (ms < CUBOS_MS[i]) return i;
    return CUBOS_MS.length;
  }

  function apuntarTiempo(rotulo, ms) {
    try {
      var t = dia().tiempos;
      var r = rotuloSano(rotulo);
      var x = t[r] || (t[r] = { n: 0, suma: 0, max: 0, cubos: [0, 0, 0, 0, 0, 0, 0] });
      x.n++; x.suma += ms; if (ms > x.max) x.max = ms;
      x.cubos[cubo(ms)]++;
      programar();
    } catch (e) { /* medir nunca da error */ }
  }

  /* `var fin = Medidas.tiempo('rótulo'); … fin();`. Llamar a `fin` dos veces cuenta una. */
  function tiempo(rotulo) {
    var t0 = 0, hecho = false;
    try { t0 = performance.now(); } catch (e) { hecho = true; }
    return function () {
      if (hecho) return;
      hecho = true;
      try { apuntarTiempo(rotulo, performance.now() - t0); } catch (e) { /* nada */ }
    };
  }

  function cuenta(rotulo) {
    try { var c = dia().cuentas, r = rotuloSano(rotulo); c[r] = (c[r] || 0) + 1; programar(); } catch (e) { /* nada */ }
  }

  /* Como `cuenta`, pero una sola vez por sesión para esa `clave` (que nunca se guarda ni se envía). */
  function cuentaUnaVez(rotulo, clave) {
    try {
      var k = rotulo + '|' + clave;
      if (unaVez[k]) return;
      unaVez[k] = true;
      cuenta(rotulo);
    } catch (e) { /* nada */ }
  }

  function peso(rotulo, bytes) {
    try {
      var n = Number(bytes);
      if (!isFinite(n) || n < 0) return;
      var p = dia().pesos, r = rotuloSano(rotulo);
      var x = p[r] || (p[r] = { ultimo: 0, mayor: 0 });
      x.ultimo = n; if (n > x.mayor) x.mayor = n;
      programar();
    } catch (e) { /* nada */ }
  }

  function foto(objeto) { try { dia().foto = objeto; programar(); } catch (e) { /* nada */ } }

  /* Un error se cuenta por su NOMBRE y solo si está en la lista fija; si no, «otro». Nunca el mensaje. */
  function cuentaError(clase, e) {
    try {
      var n = e && e.name;
      cuenta(clase + ':' + (ERRORES.indexOf(n) !== -1 ? n : 'otro'));
    } catch (x) { /* nada */ }
  }

  /* ---------- los rótulos de los ficheros ---------- */

  function rotuloDeFichero(carpeta, nombre) {
    try {
      var n = String(nombre || '');
      if (FICHEROS.indexOf(n) !== -1) return n;
      var c = carpeta && carpeta.name;
      if (c && Object.prototype.hasOwnProperty.call(CARPETAS, c)) return CARPETAS[c];
      var m = /\.([A-Za-z0-9]{1,5})$/.exec(n);
      var ext = m ? m[1].toLowerCase() : '';
      return EXTENSIONES.indexOf(ext) !== -1 ? 'otro.' + ext : 'otro';
    } catch (e) { return 'otro'; }
  }

  function tamano(x) {
    if (typeof x === 'string') return x.length;
    return (x && (x.byteLength !== undefined ? x.byteLength : x.size)) || 0;
  }

  /* Una función de js/carpetas.js medida: `clase` es `leer` o `escribir`; devuelve otra igual (mismo resultado, mismos
     errores) que apunta cuánto tardó y, al escribir, el tamaño. Se llama `(carpeta, nombre, contenido…)`. */
  function fichero(clase, fn) {
    return function (dir, nombre, contenido) {
      var fin = null;
      try {
        var r = clase + ':' + rotuloDeFichero(dir, nombre);
        fin = tiempo(r);
        if (clase === 'escribir') peso(r, tamano(contenido));
      } catch (e) { fin = null; }
      var res;
      try { res = fn.apply(this, arguments); }
      catch (e) { if (fin) fin(); throw e; }
      try {
        if (res && typeof res.then === 'function') res.then(fin || function () {}, fin || function () {});
        else if (fin) fin();
      } catch (e) { /* nada */ }
      return res;
    };
  }

  /* Para `ColaGuardado.poner`: se llama al poner en fila (empieza «espera»), y `correr(fn)` cuando le toca. */
  function cola(fich) {
    var r = '', finEspera = null;
    try { r = rotuloDeFichero(null, fich); finEspera = tiempo('guardar.espera:' + r); } catch (e) { /* nada */ }
    return {
      correr: function (fn) {
        var finDura = null;
        try { if (finEspera) finEspera(); finDura = tiempo('guardar.dura:' + r); } catch (e) { /* nada */ }
        var res;
        try { res = fn(); }
        catch (e) { if (finDura) finDura(); throw e; }
        try {
          if (res && typeof res.then === 'function') res.then(finDura || function () {}, finDura || function () {});
          else if (finDura) finDura();
        } catch (e) { /* nada */ }
        return res;
      }
    };
  }

  /* Una función asíncrona de la propia aplicación medida entera (`rotulo` fijo, escrito en el código). */
  function medida(rotulo, fn) {
    return function () {
      var fin = tiempo(rotulo);
      var res;
      try { res = fn.apply(this, arguments); }
      catch (e) { fin(); throw e; }
      try { if (res && typeof res.then === 'function') res.then(fin, fin); else fin(); } catch (e) { /* nada */ }
      return res;
    };
  }

  /* ---------- guardar y leer lo guardado ---------- */

  function guardar() {
    guardando = null;
    try {
      Object.keys(memoria).forEach(function (d) {
        try { window.localStorage.setItem(PREFIJO + d, JSON.stringify(memoria[d])); } catch (e) { /* sin sitio: se queda en memoria */ }
      });
    } catch (e) { /* nada */ }
  }

  function programar() {
    if (guardando) return;
    try { guardando = setTimeout(guardar, CADA_MS); } catch (e) { guardando = null; }
  }

  function diasGuardados() {
    var salida = [];
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        var m = k && /^gestor-medidas-(\d{4}-\d{2}-\d{2})$/.exec(k);
        if (m) salida.push(m[1]);
      }
    } catch (e) { /* nada */ }
    Object.keys(memoria).forEach(function (d) { if (salida.indexOf(d) === -1) salida.push(d); });
    return salida.sort();
  }

  /* Lo apuntado de un día (lo de memoria manda: es lo más nuevo). */
  function leerDia(d) { guardar(); return JSON.parse(JSON.stringify(dia(d))); }

  function borrarDia(d) {
    try { delete memoria[d]; window.localStorage.removeItem(PREFIJO + d); } catch (e) { /* nada */ }
  }

  function purgar() {
    try {
      var limite = new Date(Date.now() - DIAS_MAXIMOS * 86400000);
      var corte = limite.getFullYear() + '-' + dos(limite.getMonth() + 1) + '-' + dos(limite.getDate());
      diasGuardados().forEach(function (d) { if (d < corte) borrarDia(d); });
    } catch (e) { /* nada */ }
  }

  try {
    purgar();
    window.addEventListener('pagehide', guardar);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') guardar(); });
  } catch (e) { /* sin ventana: nada que hacer */ }

  return {
    hoy: hoy, tiempo: tiempo, cuenta: cuenta, cuentaUnaVez: cuentaUnaVez, peso: peso, foto: foto, cuentaError: cuentaError,
    rotuloDeFichero: rotuloDeFichero, fichero: fichero, cola: cola, medida: medida,
    diasGuardados: diasGuardados, leerDia: leerDia, borrarDia: borrarDia, guardar: guardar,
    CUBOS_MS: CUBOS_MS, FICHEROS: FICHEROS, ERRORES: ERRORES, PREFIJO: PREFIJO,
    _reiniciar: function () { memoria = {}; unaVez = {}; }   /* para las pruebas */
  };
})();
window.Medidas = Medidas;
