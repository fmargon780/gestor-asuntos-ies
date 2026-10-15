/* ============================================================
   lista-con-casillas.js — la lista de personas con su casilla, todas marcadas al principio (fila 350,
   15-oct-2026, docs/ETIQUETAS-BUSCADOR-VERTICAL-FILTRO.md). La usan el filtro del alumnado
   (js/repartir-filtro.js: repartos, «Añadir varios relacionados», exportar) y Etiquetas.

   Solo cuentan las marcadas. Lo desmarcado se guarda en `desmarcadas` ({ clave: true }), que vive tanto como
   el cuadro: al rehacerse la lista, las personas nuevas entran marcadas y las que siguen desmarcadas, así.

   - html(items, desmarcadas, op) → «N de M marcadas», «Marcar todas», «Desmarcar todas» y la lista (hasta
     `op.tope`, 200; el resto cuenta igual). `items`: [{ clave, texto, anadida? }] (anadida: lleva la marca
     «añadida» y una ✕ para quitarla). `op`: { id, tope, abierta }.
   - enganchar(raiz, items, desmarcadas, { alCambiar, alQuitar }): alCambiar() tras marcar o desmarcar;
     alQuitar(clave) al pulsar la ✕ de una añadida. Conserva la posición de la lista y el foco al repintar.
   - marcadas(items, desmarcadas) → los items marcados.
   ============================================================ */
var ListaConCasillas = (function () {

  var TOPE = 200;

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function marcadas(items, desmarcadas) {
    return items.filter(function (it) { return !desmarcadas[it.clave]; });
  }

  function cuenta(items, desmarcadas) {
    return marcadas(items, desmarcadas).length + ' de ' + items.length + ' marcadas';
  }

  function html(items, desmarcadas, op) {
    op = op || {};
    var tope = op.tope || TOPE;
    return '<div class="cc" data-cc-id="' + esc(op.id || '') + '">' +
      '<p class="cc-barra"><span class="cc-cuenta" aria-live="polite">' + esc(cuenta(items, desmarcadas)) + '</span> · ' +
      '<button type="button" class="enlace" data-cc="todas">Marcar todas</button> · ' +
      '<button type="button" class="enlace" data-cc="ninguna">Desmarcar todas</button></p>' +
      '<ul class="cc-lista">' + items.slice(0, tope).map(function (it) {
        return '<li><label><input type="checkbox" data-cc-clave="' + esc(it.clave) + '"' + (desmarcadas[it.clave] ? '' : ' checked') + '> <span>' + esc(it.texto) + '</span></label>' +
          (it.anadida ? ' <span class="cc-marca">añadida</span> <button type="button" class="boton boton-mini" data-cc-quitar="' + esc(it.clave) + '" aria-label="Quitar a ' + esc(it.texto) + '">✕</button>' : '') + '</li>';
      }).join('') + (items.length > tope ? '<li class="suave">…y ' + (items.length - tope) + ' más (cuentan igual).</li>' : '') + '</ul></div>';
  }

  function enganchar(raiz, items, desmarcadas, op) {
    var caja = raiz.querySelector('.cc');
    if (!caja) return;
    var lista = caja.querySelector('.cc-lista');
    function cambiar(hacer) {
      var arriba = lista ? lista.scrollTop : 0;
      hacer();
      op.alCambiar();
      /* La pantalla se rehace entera: se vuelve a la misma posición de la lista, con el foco en la misma casilla. */
      var nueva = raiz.querySelector('.cc .cc-lista');
      if (nueva) nueva.scrollTop = arriba;
    }
    Array.prototype.forEach.call(caja.querySelectorAll('[data-cc-clave]'), function (c) {
      c.onchange = function () {
        var k = c.getAttribute('data-cc-clave');
        cambiar(function () { if (c.checked) delete desmarcadas[k]; else desmarcadas[k] = true; });
        var otra = Array.prototype.filter.call(raiz.querySelectorAll('.cc [data-cc-clave]'), function (x) { return x.getAttribute('data-cc-clave') === k; })[0];
        if (otra && otra.focus) otra.focus();
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-cc]'), function (b) {
      b.onclick = function () {
        var todas = b.getAttribute('data-cc') === 'todas';
        cambiar(function () { items.forEach(function (it) { if (todas) delete desmarcadas[it.clave]; else desmarcadas[it.clave] = true; }); });
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-cc-quitar]'), function (b) {
      b.onclick = function () { if (op.alQuitar) op.alQuitar(b.getAttribute('data-cc-quitar')); };
    });
  }

  return { html: html, enganchar: enganchar, marcadas: marcadas, cuenta: cuenta };
})();
window.ListaConCasillas = ListaConCasillas;
