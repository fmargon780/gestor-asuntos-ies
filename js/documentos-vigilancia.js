/* ============================================================
   documentos-vigilancia.js — mirar cada poco si ha llegado algo.

   Sacado tal cual de js/documentos-sueltos.js en la fila 191
   (docs/INICIO-CUATRO-BLOQUES.md), sin cambiar nada de lo que hace. Se
   carga justo detrás de él, en el mismo sitio donde vivía antes.
   ============================================================ */

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
