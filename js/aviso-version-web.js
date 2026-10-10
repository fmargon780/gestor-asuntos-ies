/* ============================================================
   aviso-version-web.js — el aviso de versión nueva en la web (fila 178,
   docs/CORREO-VERSIONES-Y-LIMPIEZA.md, punto 4; separado de
   js/actualizar-copia.js y cambiado en la fila 325,
   docs/VERSION-NUEVA-SIN-FRANJA.md: ya no hay franja, sale la marca
   «hay versión nueva» junto al número de versión, js/marca-version.js).

   Aquí no hay ninguna carpeta que tocar: solo se avisa. Nunca recarga
   sola; la marca pregunta antes y, al aceptar, recarga y la aplicación
   entra sola (js/entrar-sola.js).

   Cada 30 minutos, y al recuperar el foco de la pestaña (como mucho
   una vez cada 10 minutos), si no hay un guardado en marcha, se pide
   `js/version.js?v=<hora>` (sin caché) y se compara el `App.VERSION`
   que trae con el ya cargado. Distinto, la marca; igual, se quita.

   Se activa siempre que esto NO sea la copia sin internet (`file:`):
   la web de verdad se sirve por `https://`, pero el servidor local con
   el que se prueba esta aplicación (`python3 -m http.server`) la sirve
   por `http://`, y tiene que poder probarse igual.

   `window.VersionNuevaDemo` (js/demo/version-nueva.js, solo en la copia
   de pruebas con `versionnueva=1`) inventa la versión remota. */
(function () {
  if (location.protocol === 'file:') return;

  var CADA_MS = 30 * 60 * 1000;
  var MIN_ENTRE_FOCOS_MS = 10 * 60 * 1000;
  var ultimaComprobacion = 0;

  function $(id) { return document.getElementById(id); }

  /* `js/version.js` es JavaScript, no JSON: se lee su texto y se saca
     la línea `App.VERSION = '...'` con una expresión regular, sin
     ejecutarlo (ejecutar lo que llega de una petición es innecesario
     aquí, y así no hace falta un `<script>` nuevo por cada comprobación). */
  function extraerVersion(texto) {
    var m = String(texto || '').match(/App\.VERSION\s*=\s*'([^']*)'/);
    return m ? m[1] : '';
  }

  async function comprobarVersionWeb() {
    if (!window.App || !App.VERSION) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    var demo = window.VersionNuevaDemo;
    var remota;
    if (demo) remota = demo.remota();
    else {
      var texto;
      try {
        var resp = await fetch('js/version.js?v=' + Date.now(), { cache: 'no-store' });
        if (!resp.ok) return;
        texto = await resp.text();
      } catch (e) { return; }   /* sin conexión ahora mismo: se prueba en la próxima vuelta */
      remota = extraerVersion(texto);
    }
    if (!remota) return;
    if (remota === App.VERSION) { if (window.MarcaVersion) MarcaVersion.quitar(); return; }
    if (!window.MarcaVersion) return;
    MarcaVersion.poner(remota, function () {
      if (window.EntrarSola) EntrarSola.apuntar();
      if (demo && demo.alRecargar) demo.alRecargar();
      location.reload();
    });
  }

  function alRecuperarElFoco() {
    var ahora = Date.now();
    if (ahora - ultimaComprobacion < MIN_ENTRE_FOCOS_MS) return;
    ultimaComprobacion = ahora;
    comprobarVersionWeb();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') alRecuperarElFoco();
  });
  window.addEventListener('focus', alRecuperarElFoco);

  setInterval(function () { ultimaComprobacion = Date.now(); comprobarVersionWeb(); }, CADA_MS);

  /* Para las pruebas. */
  window.AvisoVersionWeb = { comprobar: comprobarVersionWeb, _extraerVersion: extraerVersion };
})();
