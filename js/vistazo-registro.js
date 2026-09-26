/* ============================================================
   vistazo-registro.js — fila 176, punto 3 (docs/DATOS-ENTRE-ORDENADORES.md).

   App.mirarLaCarpeta (js/documentos-sueltos.js) mira cada 20 segundos
   si han llegado documentos o carpetas nuevas, pero no si el OTRO
   ordenador ha cambiado `asuntos.json` o `hitos.json` sin que cambie
   ninguna carpeta (una nota nueva, un hito marcado): esos solo se
   releían al entrar y en cada guardado propio. En una sesión larga se
   acaba viendo, y decidiendo con, un estado viejo.

   Aquí se engancha a la misma vuelta (envolviendo App.mirarLaCarpeta:
   no hay ningún punto ya previsto para "cada 20 segundos" que sirva,
   así que toca envolver, apuntado en js/envolturas-esperadas.js). Si la
   fecha de modificación de alguno de los dos ficheros ha cambiado desde
   la última vez, y no hay un guardado en marcha, se relee y se repinta
   solo lo que está a la vista, sin tirar lo que se esté escribiendo
   (U.conservandoLoEscrito).
   ============================================================ */
(function () {

  var fechaAsuntos = 0, fechaHitos = 0;

  /* Un guardado propio de hitos.json ya avisa por Hitos.alCambiar (un
     punto previsto, sin envolver nada más): se aprovecha para poner al
     día la fecha recordada y no releer en la siguiente vuelta lo que
     uno mismo acaba de escribir. asuntos.json no tiene un punto
     parecido: como mucho se releerá una vez de más tras un guardado
     propio, sin perjuicio ninguno (los datos ya están frescos). */
  if (window.Hitos && Hitos.alCambiar) {
    Hitos.alCambiar.push(function () {
      if (App.E.gestor) Carpetas.fechaFichero(App.E.gestor, 'hitos.json').then(function (f) { fechaHitos = f; });
    });
  }

  async function repintarLoVisible() {
    if (typeof App.pintarAbiertosSiPendiente === 'function') App.pintarAbiertosSiPendiente();
    if (App.pantallaALaVista && App.pantallaALaVista('abiertos') && typeof App.pintarAbiertos === 'function') {
      App.pintarAbiertos();
    }
    if (typeof App.reengancharFicha === 'function') App.reengancharFicha();
  }

  async function comprobarYReleer() {
    if (!App.E.gestor) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;

    var fA = await Carpetas.fechaFichero(App.E.gestor, App.FICHERO_ASUNTOS);
    var fH = window.Hitos ? await Carpetas.fechaFichero(App.E.gestor, 'hitos.json') : 0;
    var cambioAsuntos = fA && fA !== fechaAsuntos;
    var cambioHitos = fH && fH !== fechaHitos;
    fechaAsuntos = fA || fechaAsuntos;
    fechaHitos = fH || fechaHitos;
    if (!cambioAsuntos && !cambioHitos) return;

    var raiz = document.getElementById('aplicacion') || document.body;
    await U.conservandoLoEscrito(raiz, async function () {
      if (cambioAsuntos) await App.cargarRegistro();
      if (cambioHitos) await Hitos.leer();
      App.refrescarFichas();
      await repintarLoVisible();
    });
  }

  U.envolver(window.App, 'App.mirarLaCarpeta', 'vistazo-registro.js', function (comoEra) {
    return function () {
      return comoEra().then(function () {
        return comprobarYReleer().catch(function (e) { /* se intenta en la siguiente vuelta */ });
      });
    };
  });

  /* Para pruebas/datos-entre-ordenadores.mjs: llamar directo, sin
     esperar al intervalo de 20 s ni pasar por App.mirarLaCarpeta. */
  window.VistazoRegistro = { comprobarYReleer: comprobarYReleer };
})();
