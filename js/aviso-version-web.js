/* ============================================================
   aviso-version-web.js — la franja «Hay una versión nueva» también en
   la web (fila 178, punto 4, docs/CORREO-VERSIONES-Y-LIMPIEZA.md).

   La copia sin internet (js/actualizar-copia.js) ya avisa sola y se
   actualiza cuando hay versión nueva; la web no: quien la tiene
   abierta se queda con la vieja hasta que recarga ella misma. Aquí
   solo se avisa, con la misma franja de arriba (#franja-copia);
   nunca se actualiza nada ni se recarga sola.

   Cada 30 minutos, y al recuperar el foco (como mucho una vez cada 10
   minutos), si no hay guardado en marcha (ColaGuardado.hayGuardado()):
   se pide `js/version.js` (con `?v=` para saltarse la caché) y se
   compara su `App.VERSION` con la ya cargada. Se lee como texto, con
   una expresión regular (nunca se ejecuta el fichero traído: sería un
   segundo `App.VERSION` compitiendo con el de esta página).

   El arranque automático (el intervalo y el foco) solo se arma si la
   página se sirve por `https:`; `window.AvisoVersionWeb.comprobar()`
   queda expuesto siempre, para las pruebas.
   ============================================================ */
(function () {
  var CADA_MS = 30 * 60 * 1000;
  var FOCO_MINIMO_MS = 10 * 60 * 1000;
  var ultimaComprobacion = 0;
  var cerrada = false;

  function $(id) { return document.getElementById(id); }

  async function versionRemota() {
    var resp = await fetch('js/version.js?v=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('http ' + resp.status);
    var texto = await resp.text();
    var m = texto.match(/App\.VERSION\s*=\s*'([^']*)'/);
    if (!m) throw new Error('js/version.js no se puede leer');
    return m[1];
  }

  function franja(remota) {
    if (cerrada || $('franja-copia')) return;
    var caja = document.createElement('div');
    caja.id = 'franja-copia';
    caja.setAttribute('role', 'alert');
    caja.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;display:flex;align-items:center;' +
      'gap:12px;flex-wrap:wrap;padding:10px 48px 10px 16px;background:#fff4d6;border-bottom:2px solid #e0b34a;' +
      'color:#1b2430;font-size:15px;box-shadow:0 4px 12px rgba(10,25,45,.18)';

    var texto = document.createElement('span');
    texto.id = 'franja-copia-texto';
    texto.innerHTML = 'Hay una versión nueva. <strong>Recargar</strong> para verla.';
    caja.appendChild(texto);

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'franja-copia-actualizar';
    boton.className = 'boton boton-principal';
    boton.textContent = 'Recargar';
    boton.onclick = function () { location.reload(); };
    caja.appendChild(boton);

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.id = 'franja-copia-cerrar';
    cerrar.title = 'Cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '✕';
    cerrar.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);border:0;' +
      'background:none;font-size:18px;cursor:pointer;color:#5d6b7a';
    cerrar.onclick = function () { cerrada = true; caja.remove(); };
    caja.appendChild(cerrar);

    document.body.appendChild(caja);
  }

  async function comprobar() {
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    ultimaComprobacion = Date.now();
    try {
      var remota = await versionRemota();
      if (window.App && App.VERSION && remota !== App.VERSION) franja(remota);
    } catch (e) { /* sin conexión o fallo puntual: se reintenta en la próxima pasada */ }
  }

  if (location.protocol === 'https:') {
    setInterval(comprobar, CADA_MS);
    window.addEventListener('focus', function () {
      if (Date.now() - ultimaComprobacion >= FOCO_MINIMO_MS) comprobar();
    });
  }

  /* Para las pruebas: comprobar() en cualquier protocolo. */
  window.AvisoVersionWeb = { comprobar: comprobar };
})();
