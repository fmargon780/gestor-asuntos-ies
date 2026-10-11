/* ============================================================
   soporte-cargar.js — presenta la app al botón «Soporte» único y lo pide
   (fila 326 de la cola, docs/BOTON-UNICO-DE-SOPORTE.md).

   El botón y su ventana ya no son de este repositorio: viven en
   `fmargon780/soporte-apps` y se piden a Google después de cargar la
   página. Aquí solo se hacen tres cosas:

   1. Recoger los errores tempranos (error, unhandledrejection y
      console.error), hasta que el botón existe: desde ahí los recoge él.
   2. Poner `window.SOPORTE_APP` (repo, versión y lo que el botón pregunta
      al abrir y al enviar: pantalla, contexto, persona y errores).
   3. Pedir el botón con un <script> metido por código tras el `load`
      (nunca escrito en index.html: uno que no contesta retrasaría el
      arranque). Si falla, no se ve nada. Se repite al volver la conexión
      (`online`) y cada diez minutos mientras no haya botón.

   No se pide en la demostración (?demo=1) ni bajo un navegador manejado
   por un programa (navigator.webdriver), salvo que la dirección lleve
   `soporte=1`: así ni las pruebas ni el revisor mandan avisos de verdad.
   Sin conexión con Google no sale ningún botón.
   ============================================================ */
(function () {

  var REPO = 'fmargon780/gestor-asuntos-ies';
  var DIRECCION = 'https://script.google.com/macros/s/AKfycbz2LFRhlvnlUjr_QZFW5cuY3ayE-wmXCCg1TdtUCNDJ6SEosNMetkZP6muz1NVwFDMXhQ/exec?boton=1&repo=' + REPO;
  var CADA_MS = 10 * 60 * 1000;
  var MAX_ERRORES = 20;
  var LARGO_ERROR = 300;

  var PANTALLAS = {
    abiertos: 'Inicio', asunto: 'Ficha de un asunto', nuevo: 'Nuevo asunto', archivo: 'Archivo',
    personas: 'Personas y empresas', herramientas: 'Herramientas', ajustes: 'Ajustes',
    'tipo-asunto': 'Ajustes de un tipo de asunto', impresos: 'Impresos', cuentas: 'Cuentas'
  };

  /* ---------- los errores de antes de que cargue el botón ---------- */

  var errores = [];

  function hora() {
    var d = new Date();
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    return dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  function apuntarError(texto) {
    if (window.__soporteBoton) return;   /* desde que existe el botón, los recoge él: saldrían repetidos */
    errores.push(hora() + ' ' + String(texto).replace(/\s+/g, ' ').slice(0, LARGO_ERROR));
    if (errores.length > MAX_ERRORES) errores.shift();
  }

  window.addEventListener('error', function (e) {
    var donde = e && e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : '';
    apuntarError((e && e.message) + donde);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    apuntarError('Promesa rechazada: ' + ((r && r.message) || r));
  });
  if (window.console && typeof console.error === 'function') {
    var original = console.error;
    console.error = function () {
      try {
        apuntarError(Array.prototype.map.call(arguments, function (a) {
          return (a && a.message) ? a.message : String(a);
        }).join(' '));
      } catch (e) { /* recoger errores nunca puede dar errores */ }
      return original.apply(console, arguments);
    };
  }

  /* ---------- lo que la app cuenta al botón ---------- */

  function nombrePantalla() {
    var p = document.querySelector('.pantalla:not(.oculto)');
    if (!p || !p.id) return 'Pantalla de entrada';
    var clave = p.id.replace(/^pantalla-/, '');
    if (PANTALLAS[clave]) return PANTALLAS[clave];
    return clave.charAt(0).toUpperCase() + clave.slice(1).replace(/-/g, ' ');
  }

  function contexto() {
    var partes = [location.protocol === 'file:' ? 'copia sin internet' : 'web'];
    if (window.SoloConsulta && SoloConsulta.activo()) partes.push('solo consultar');
    partes.push(window.Perfil && Perfil.esDirectivo && Perfil.esDirectivo() ? 'perfil directivo' : 'perfil Administración');
    return partes.join(' · ');
  }

  window.SOPORTE_APP = {
    repo: REPO,
    get version() { return (window.App && App.VERSION) || ''; },
    pantalla: nombrePantalla,
    contexto: contexto,
    persona: function () {
      var nombre = (window.App && App.E && App.E.usuario) || '';
      var correo = (window.Perfil && Perfil.correo && Perfil.correo()) || '';
      return { nombre: String(nombre), correo: String(correo) };
    },
    errores: function () { return errores.slice(); }
  };

  /* ---------- pedir el botón ---------- */

  function sePide() {
    if (/(^|[?&])soporte=1(&|$)/.test(location.search)) return true;
    if (/(^|[?&])demo=1(&|$)/.test(location.search)) return false;
    return !(navigator && navigator.webdriver);
  }

  var pidiendo = false;

  function pedir() {
    if (window.__soporteBoton || pidiendo || !document.body) return;
    pidiendo = true;
    var s = document.createElement('script');
    s.src = DIRECCION;
    s.async = true;
    s.onload = function () { pidiendo = false; s.remove(); };
    s.onerror = function () { pidiendo = false; s.remove(); };
    document.head.appendChild(s);
  }

  if (!sePide()) return;

  function empezar() {
    pedir();
    window.addEventListener('online', pedir);
    setInterval(pedir, CADA_MS);
  }
  if (document.readyState === 'complete') empezar();
  else window.addEventListener('load', empezar);

})();
