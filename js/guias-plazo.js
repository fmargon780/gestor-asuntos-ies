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
    var actual = Plazos.cuentaValida(p && p.plazo && p.plazo.cuenta);
    return '<select class="campo paso-plazo-cuenta" title="Cómo se cuentan los días">' +
      Plazos.CUENTAS.map(function (c) {
        return '<option value="' + c.valor + '"' + (c.valor === actual ? ' selected' : '') + '>' +
          U.escapar(c.texto) + '</option>';
      }).join('') + '</select>';
  }

  function leer(caja) {
    var sel = caja.querySelector(':scope > .paso-extra .paso-plazo-cuenta');
    return Plazos.cuentaValida(sel && sel.value);
  }

  return { html: html, leer: leer };
})();
window.GuiasPlazo = GuiasPlazo;
