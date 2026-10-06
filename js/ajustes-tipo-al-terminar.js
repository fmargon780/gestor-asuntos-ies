/* ============================================================
   ajustes-tipo-al-terminar.js — el apartado «Al terminar el asunto»
   de la pantalla de un tipo (fila 274, docs/AL-TERMINAR-EL-ASUNTO.md).

   Dice, sin abrirlo, qué pasa con un asunto de este tipo cuando se
   termina («se archiva» o «pasa a Por liquidar»), y lleva dentro las
   dos casillas que antes vivían en «Datos del tipo»: la de liquidar
   (fila 249) y la de avisar a quien lo pide al cerrar (fila 195).
   Mismos campos de siempre en tipos.json (`liquidar`,
   `avisarLoPideCierre`, `avisarLoPideCierrePlantilla`): nada que migrar.

   `AjustesTipoAlTerminar.construir(tipo)` devuelve el `<details>` ya
   hecho; `resumen(tipo)` el texto de su título (lo pone
   AjustesPlegado.resumirTipo, que lo repinta tras cada cambio).
   ============================================================ */
var AjustesTipoAlTerminar = (function () {

  function resumen(tipo) {
    return (tipo.liquidar ? 'pasa a Por liquidar' : 'se archiva') +
      (tipo.avisarLoPideCierre ? ' · avisa a quien lo pide' : '');
  }

  function construir(tipo) {
    var b = AjustesPlegado.seccion('al-terminar', 'Al terminar el asunto', 'Qué pasa con un asunto de este tipo cuando se termina.');

    /* Fila 249 (docs/POR-LIQUIDAR.md): al terminar, el asunto pasa a «Por liquidar» en vez de archivarse. */
    var filaLiquidar = App.construirInterruptorDeTipo(tipo, 'liquidar', false,
      'Al terminar, pasa a «Por liquidar» en vez de archivarse',
      'Los asuntos terminados de este tipo esperan en la pestaña «Por liquidar» de Inicio hasta que se liquidan.');
    /* Con el cambio, la pestaña «Por liquidar» de Inicio sale o se va sin esperar a otro repintado. */
    filaLiquidar.querySelector('input').addEventListener('change', function () {
      if (window.InicioTabla) InicioTabla.pintar();
      /* Fila 253: con la casilla marcada, sus asuntos abiertos sin nada por hacer pasan ya. */
      if (window.PorLiquidar) PorLiquidar.alMarcarCasilla(tipo);
    });
    b.cuerpo.appendChild(filaLiquidar);
    var nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = 'Los asuntos terminados de este tipo esperan en la pestaña «Por liquidar» de Inicio hasta que se liquidan.';
    b.cuerpo.appendChild(nota);

    /* «Al cerrar el asunto, avisar a quien lo pide» (fila 195, docs/AVISOS-A-QUIEN-LO-PIDE.md, punto 1). */
    if (window.AvisosLoPide) {
      var filaAvisoCierre = document.createElement('label');
      filaAvisoCierre.className = 'interruptor';
      filaAvisoCierre.style.marginTop = '10px';
      filaAvisoCierre.innerHTML = '<input type="checkbox" class="tipo-avisar-lopide-cierre"' +
        (tipo.avisarLoPideCierre ? ' checked' : '') + '>' +
        '<span>Al cerrar el asunto, avisar a quien lo pide</span>';
      b.cuerpo.appendChild(filaAvisoCierre);

      var cajaAvisoCierre = document.createElement('div');
      cajaAvisoCierre.className = 'tipo-avisar-lopide-cierre-plantilla' + (tipo.avisarLoPideCierre ? '' : ' oculto');
      cajaAvisoCierre.innerHTML = '<label class="etiqueta-en-linea">Con la plantilla:</label>' +
        '<select class="campo tipo-avisar-lopide-cierre-select"><option value="">Cargando…</option></select>';
      b.cuerpo.appendChild(cajaAvisoCierre);

      var casillaAvisoCierre = filaAvisoCierre.querySelector('.tipo-avisar-lopide-cierre');
      var selectAvisoCierre = cajaAvisoCierre.querySelector('.tipo-avisar-lopide-cierre-select');
      casillaAvisoCierre.onchange = async function () {
        tipo.avisarLoPideCierre = casillaAvisoCierre.checked;
        cajaAvisoCierre.classList.toggle('oculto', !casillaAvisoCierre.checked);
        await App.guardarTipos();
      };
      selectAvisoCierre.onchange = async function () {
        tipo.avisarLoPideCierrePlantilla = selectAvisoCierre.value;
        await App.guardarTipos();
      };
      AvisosLoPide.opcionesPlantillaHTML(tipo.tipo, tipo.avisarLoPideCierrePlantilla, AvisosLoPide.NOMBRE_CIERRE)
        .then(function (html) {
          if (!selectAvisoCierre.isConnected) return;
          selectAvisoCierre.innerHTML = html;
        });
    }
    return b.sec;
  }

  return { construir: construir, resumen: resumen };
})();
window.AjustesTipoAlTerminar = AjustesTipoAlTerminar;
