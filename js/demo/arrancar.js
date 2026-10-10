/* ============================================================
   demo/arrancar.js — decide si esta visita es la copia de pruebas
   (fila 222, docs/COPIA-DE-PRUEBAS.md).

   Este fichero, unas pocas líneas, se carga SIEMPRE, también en
   producción: la Content-Security-Policy de `vercel.json`
   (`script-src 'self' blob:`, sin 'unsafe-inline') no deja poner esta
   comprobación en línea dentro de index.html, así que hace falta un
   fichero de verdad. El resto de `js/demo/` (el disco de mentira, los
   datos inventados y la franja) solo se pide si esta visita es de
   pruebas: en `asuntos.fmargon.com` no llega a descargarse ni un byte
   de ellos.

   Es de pruebas: `pruebas.fmargon.com`, una *preview* de Vercel de la
   rama "pruebas" (su dirección lleva "-git-pruebas-"), o cualquier
   dirección con `?demo=1` (la puerta de emergencia, también en
   producción, por si la copia de pruebas no estuviera publicada; y el
   camino normal en `localhost`, por lo de abajo).

   OJO, `localhost` a propósito NO entra sola, sin `?demo=1`: las 180 y
   pico pruebas de `pruebas/` sirven la aplicación real en
   `http://localhost:8123` con SU PROPIO disco de mentira, inyectado con
   `page.addInitScript` antes de que corra ningún script de la página
   (`pruebas/navegador.mjs` y compañía). Si esta comprobación entrara
   sola en `localhost`, `js/demo/disco.js` pisaría ese disco con el
   suyo propio en cuanto se cargara la página, y las 180 pruebas
   dejarían de ver los datos que ellas mismas escriben. `pruebas/copia-de-pruebas.mjs`
   (la prueba de esta misma fila) pide `?demo=1` como cualquier otro. */
(function () {
  'use strict';
  var h = location.hostname;
  var esDemo = h.indexOf('-git-pruebas-') !== -1 || h === 'pruebas.fmargon.com' ||
    /(^|[?&])demo=1(&|$)/.test(location.search);
  if (!esDemo) return;

  var enlace = document.createElement('link');
  enlace.rel = 'stylesheet';
  enlace.href = 'css/demo.css';
  document.head.appendChild(enlace);

  ['js/demo/disco.js', 'js/demo/datos-plantilla.js', 'js/demo/datos-hacer-hito.js', 'js/demo/datos-plantillas-pantalla.js', 'js/demo/datos-perfil.js', 'js/demo/datos-encargos.js', 'js/demo/datos-notas.js', 'js/demo/datos-problemas.js', 'js/demo/datos-grupo.js', 'js/demo/datos-actividades.js', 'js/demo/datos-biblioteca.js', 'js/demo/datos-tutor.js', 'js/demo/datos-orden.js', 'js/demo/datos-centro-de-datos.js', 'js/demo/datos.js', 'js/demo/permisos.js', 'js/demo/mas-nuevo.js', 'js/demo/version-nueva.js', 'js/demo/franja.js'].forEach(function (src) {
    document.write('<script src="' + src + '"><' + '/script>');
  });
})();
