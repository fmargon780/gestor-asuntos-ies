/* ============================================================
   medidas-enganches.js — las envolturas de la fila 332
   (docs/DATOS-1-MEDIDAS.md, apartado 2): cuánto tarda abrir un asunto,
   archivarlo, reabrirlo y repintar la lista de Inicio.

   Son las únicas envolturas de la fila (lo demás es una línea dentro de
   la función medida). Se carga justo antes de js/envolturas-esperadas.js,
   así que envuelve por fuera de todas las demás y mide «con todas sus
   envolturas». Cada una devuelve y lanza lo mismo que la original: solo
   apunta el tiempo. Los rótulos están escritos aquí: ningún dato.
   ============================================================ */
(function () {
  if (!window.Medidas || !window.U || !U.envolver) return;

  U.envolver(App, 'App.abrirFicha', 'medidas-enganches.js', function (comoEra) { return Medidas.medida('asunto.abrir', comoEra); });
  U.envolver(App, 'App.cerrarAsunto', 'medidas-enganches.js', function (comoEra) { return Medidas.medida('asunto.archivar', comoEra); });
  U.envolver(App, 'App.reabrirAsunto', 'medidas-enganches.js', function (comoEra) { return Medidas.medida('asunto.reabrir', comoEra); });

  /* La lista de Inicio: la de entrar tiene su propio rótulo (`entrar.lista`, js/nucleo.js); el resto, `lista.repintar`. */
  U.envolver(App, 'App.verAbiertos', 'medidas-enganches.js', function (comoEra) {
    var medida = Medidas.medida('lista.repintar', comoEra);
    return function () { return Medidas.entrando ? comoEra.apply(this, arguments) : medida.apply(this, arguments); };
  });
})();
