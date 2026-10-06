/* ============================================================
   guias-plazo.js — cómo se cuenta el plazo de un paso de la guía
   (fila 131, 24-sep-2026, docs/PLAZOS-BIEN-CONTADOS.md).

   Junto a los días y al «desde» del plazo, un desplegable: Días
   hábiles (por defecto) / Días lectivos / Días naturales. Se guarda en
   el paso como `plazo.cuenta` y lo copia su hito (js/hitos.js). El
   cálculo vive en js/plazos.js (Plazos.sumarPlazo).

   js/guias.js pinta el desplegable con GuiasPlazo.html(p) y lo lee al
   recoger con GuiasPlazo.leer(caja). Se carga antes de js/guias.js.
   ============================================================ */
var GuiasPlazo = (function () {

  function html(p) {
    return htmlConId(p, '');
  }

  /* Igual que html(p), pero con un id propio (28-sep-2026, fila 206,
     docs/HITOS-DESDE-EL-ASUNTO.md): lo usa el cuadro de crear/cambiar
     un hito desde el asunto, fuera del `.paso-extra` del editor de la
     guía, para poder leer el valor con un simple getElementById. */
  function htmlConId(p, id) {
    var actual = Plazos.cuentaValida(p && p.plazo && p.plazo.cuenta);
    return '<select' + (id ? ' id="' + id + '"' : '') + ' class="campo paso-plazo-cuenta" title="Cómo se cuentan los días">' +
      Plazos.CUENTAS.map(function (c) {
        return '<option value="' + c.valor + '"' + (c.valor === actual ? ' selected' : '') + '>' +
          U.escapar(c.texto) + '</option>';
      }).join('') + '</select>';
  }

  function leer(caja) {
    return leerSelect(caja.querySelector(':scope > .paso-extra .paso-plazo-cuenta'));
  }

  function leerSelect(sel) {
    return Plazos.cuentaValida(sel && sel.value);
  }

  /* Fila 284: con «Meses» elegido, el recuadro de al lado dice «meses», no «días» (se lee «1 mes desde…»). */
  document.addEventListener('change', function (ev) {
    var sel = ev.target;
    if (!sel || !sel.classList || !sel.classList.contains('paso-plazo-cuenta') || !sel.parentNode) return;
    var dias = sel.parentNode.querySelector('input[type="number"]');
    if (dias) dias.placeholder = sel.value === 'meses' ? 'meses' : 'días';
  });

  return { html: html, htmlConId: htmlConId, leer: leer, leerSelect: leerSelect };
})();
window.GuiasPlazo = GuiasPlazo;
