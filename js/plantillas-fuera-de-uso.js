/* ============================================================
   plantillas-fuera-de-uso.js — dejar una plantilla «fuera de uso» y
   volver a activarla (10-oct-2026, fila 321,
   docs/PLANTILLAS-FUERA-DE-USO.md).

   Una plantilla fuera de uso lleva `fueraDeUso: { desde, por }` en
   `plantillas.json` (en `lista` o en `documentos`). Sigue en la lista, en
   gris, y deja de ofrecerse (Plantillas.deTipo, documentosDeTipo…). Los
   documentos ya hechos no se tocan. Borrar sigue existiendo aparte.
   Una sola función dice si está en uso: Plantillas.enUso.
   ============================================================ */
var PlantillasFueraDeUso = (function () {

  var TOPE_LISTA = 8;

  function clave(clase) { return clase === 'documento' ? 'documentos' : 'lista'; }
  function quien() { return (window.App && App.E && App.E.usuario) || ''; }

  /* «09/10/2026» */
  function fechaCorta(iso) {
    var d = new Date(iso || '');
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  /* «Fuera de uso desde el 09/10/2026» */
  function etiqueta(p) {
    if (!p || !p.fueraDeUso) return '';
    var f = fechaCorta(p.fueraDeUso.desde);
    return 'Fuera de uso' + (f ? ' desde el ' + f : '');
  }

  async function poner(p, clase, valor) {
    await Plantillas.guardar(App.E.gestor, function (actual) {
      (actual[clave(clase)] || []).forEach(function (x) {
        if (x.id !== p.id) return;
        if (valor) x.fueraDeUso = valor; else delete x.fueraDeUso;
      });
      return actual;
    });
  }

  /* El cuerpo del cuadro: lo que usa la plantilla (de js/plantillas-uso.js) y lo que significa dejarla fuera de uso. */
  function cuerpoDelCuadro(usos, abiertos) {
    var html = '';
    if (usos.length) {
      var tipos = {};
      usos.forEach(function (u) { if (u.tipo) tipos[u.tipo] = true; });
      var m = Object.keys(tipos).length;
      html += '<p><strong>' + (usos.length === 1 ? 'La usa 1 hito' : 'La usan ' + usos.length + ' hitos') +
        (m ? ' de ' + m + (m === 1 ? ' tipo de asunto' : ' tipos de asunto') : '') + ':</strong></p><ul class="pfu-lista">';
      var ver = abiertos ? usos : usos.slice(0, TOPE_LISTA);
      ver.forEach(function (u) { html += '<li>' + U.escapar((u.tipo ? u.tipo + ' · ' : '') + u.etiqueta) + '</li>'; });
      html += '</ul>';
      if (usos.length > TOPE_LISTA && !abiertos) html += '<p><button type="button" class="enlace" id="pfu-mas">y ' + (usos.length - TOPE_LISTA) + ' más</button></p>';
      html += '<p>Esas tareas se quedan en su hito, marcadas «plantilla fuera de uso», y no generan nada hasta que les pongas otra plantilla o vuelvas a activar esta.</p>';
    } else {
      html += '<p>No la usa ningún hito.</p>';
    }
    html += '<p>Deja de ofrecerse al generar un documento o al preparar un correo. Lo ya hecho con ella no cambia. Puedes volver a activarla cuando quieras.</p>';
    return html;
  }

  /* «Dejar fuera de uso…». `usos`: los sitios donde está puesta (PlantillasUso). Devuelve true si se ha dejado. */
  async function dejar(p, clase, usos, alTerminar) {
    usos = usos || [];
    var abiertos = false;
    var promesa = U.preguntar('Dejar fuera de uso «' + p.nombre + '»', cuerpoDelCuadro(usos, false), 'Dejar fuera de uso');
    function enlazar() {
      var mas = document.getElementById('pfu-mas');
      if (mas) mas.onclick = function () {
        abiertos = true;
        document.getElementById('cuadro-cuerpo').innerHTML = cuerpoDelCuadro(usos, true);
      };
    }
    enlazar();
    var ok = await promesa;
    if (!ok) return false;
    try {
      await poner(p, clase, { desde: new Date().toISOString(), por: quien() });
    } catch (e) { U.aviso('No he podido dejarla fuera de uso: ' + U.mensajeDeError(e), 'malo'); return false; }
    U.aviso('«' + p.nombre + '» queda fuera de uso.', 'bueno', {
      boton: 'Deshacer',
      alPulsar: async function () {
        try { await poner(p, clase, null); } catch (e) { U.aviso('No he podido deshacerlo: ' + U.mensajeDeError(e), 'malo'); }
        if (typeof alTerminar === 'function') alTerminar();
      }
    });
    if (typeof alTerminar === 'function') alTerminar();
    return true;
  }

  /* «Volver a activar»: no pregunta. */
  async function volverAActivar(p, clase, alTerminar) {
    try { await poner(p, clase, null); } catch (e) { U.aviso('No he podido volver a activarla: ' + U.mensajeDeError(e), 'malo'); return false; }
    U.aviso('«' + p.nombre + '» vuelve a estar en uso.', 'bueno');
    if (typeof alTerminar === 'function') alTerminar();
    return true;
  }

  return { dejar: dejar, volverAActivar: volverAActivar, etiqueta: etiqueta, fechaCorta: fechaCorta };
})();
window.PlantillasFueraDeUso = PlantillasFueraDeUso;
