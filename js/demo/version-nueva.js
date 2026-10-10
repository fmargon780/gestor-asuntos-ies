/* ============================================================
   demo/version-nueva.js — «hay versión nueva» en la copia de pruebas
   (fila 325, docs/VERSION-NUEVA-SIN-FRANJA.md, punto 5).

     ?demo=1&auto=1&versionnueva=1

   La comprobación de la web (js/aviso-version-web.js) da por buena una
   versión remota inventada y se lanza sola nada más cargar, sin esperar
   30 minutos. Tras recargar desde la marca, en esa pestaña ya no vuelve
   a salir (se apunta en sessionStorage): se ve que «se ha actualizado».

   Todo vive aquí: el código de producción no sabe nada de esto. Sin
   `versionnueva=1` este fichero no hace nada.
   ============================================================ */
(function () {
  'use strict';
  if (!/(?:^|[?&])versionnueva=1(&|$)/.test(location.search)) return;
  var CLAVE = 'gestor-demo-version-nueva-vista';
  var INVENTADA = '31-dic-2099 · 23:59';

  function vista() { try { return sessionStorage.getItem(CLAVE) === '1'; } catch (e) { return false; } }

  window.VersionNuevaDemo = {
    remota: function () { return vista() ? ((window.App && App.VERSION) || '') : INVENTADA; },
    alRecargar: function () { try { sessionStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ } }
  };

  /* Se lanza sola en cuanto se ha entrado y no hay un guardado en marcha (si lo hay, la comprobación no hace nada). */
  var intentos = 0;
  var reloj = setInterval(function () {
    if (vista() || !window.AvisoVersionWeb || ++intentos > 200) { clearInterval(reloj); return; }
    var pie = document.getElementById('usuario-pie');
    if (!pie || !pie.textContent) return;
    AvisoVersionWeb.comprobar();
    if (window.MarcaVersion && MarcaVersion.hay()) clearInterval(reloj);
  }, 300);
})();
