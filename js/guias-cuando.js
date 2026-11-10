/* ============================================================
   guias-cuando.js — el recuadro «Cuándo se hace» del editor de la guía, en
   cada hito y en cada tarea (fila 576, docs/576-SOLO-SI-EN-HITOS-Y-TAREAS.md).

   Un desplegable: «Siempre» (por defecto) o «Solo si el campo «X» vale…», con
   los campos de lista del tipo de asunto (los mismos que usan los textos
   condicionales, TextoCondicional.camposDeLista). Al elegir un campo salen sus
   opciones como casillas. Si el tipo no tiene campos de lista, solo ofrece
   «Siempre». El valor se guarda como `soloSi: { campo, valores }` (js/solo-si.js).

   - `ponerTipo(tipo)`: el tipo de la guía que se está editando.
   - `bloque(soloSi, prefijo)`: el elemento del recuadro, ya enganchado (al
     cambiar el desplegable se rehace él solo; las casillas no repintan nada).
   - `leer(raiz, sel)`: lo que dice el recuadro, { campo, valores } o null.
   ============================================================ */
var GuiasCuando = (function () {

  var tipo = '';
  var contador = 0;

  function ponerTipo(t) { tipo = String(t || ''); }

  function camposDelTipo() {
    return window.TextoCondicional ? TextoCondicional.camposDeLista(tipo) : [];
  }

  function opcionesDe(campo, soloSi) {
    var c = camposDelTipo().filter(function (x) { return U.normalizar(x.nombre) === U.normalizar(campo); })[0];
    var valores = c ? c.valores.slice() : [];
    /* Un valor guardado que el campo ya no tiene se sigue enseñando, para poder quitarlo. */
    ((soloSi && U.normalizar(soloSi.campo) === U.normalizar(campo)) ? soloSi.valores : []).forEach(function (v) {
      if (!valores.some(function (x) { return U.normalizar(x) === U.normalizar(v); })) valores.push(v);
    });
    return valores;
  }

  /* El contenido del recuadro para `soloSi` ({ campo, valores } o null). */
  function contenidoHTML(soloSi, id) {
    var campos = camposDelTipo();
    var actual = soloSi && soloSi.campo ? soloSi.campo : '';
    var nombres = campos.map(function (c) { return c.nombre; });
    if (actual && !nombres.some(function (n) { return U.normalizar(n) === U.normalizar(actual); })) nombres.push(actual);
    var opts = '<option value="">Siempre</option>' + nombres.map(function (n) {
      return '<option value="' + U.escapar(n) + '"' + (actual && U.normalizar(n) === U.normalizar(actual) ? ' selected' : '') +
        '>Solo si el campo «' + U.escapar(n) + '» vale…</option>';
    }).join('');
    var html = '<div class="cuando-linea"><label class="etiqueta" for="' + id + '">Cuándo se hace</label>' +
      '<select class="campo cuando-campo" id="' + id + '">' + opts + '</select></div>';
    if (actual) {
      var marcados = (soloSi.valores || []).map(function (v) { return U.normalizar(v); });
      html += '<div class="cuando-valores">' + opcionesDe(actual, soloSi).map(function (v, j) {
        return '<label class="cuando-valor-et"><input type="checkbox" class="cuando-valor" value="' + U.escapar(v) + '"' +
          (marcados.indexOf(U.normalizar(v)) !== -1 ? ' checked' : '') + '> ' + U.escapar(v) + '</label>';
      }).join('') + '</div>' +
        '<p class="nota cuando-nota">En el asunto, si el campo tiene otro valor, esto no sale.</p>' +
        ((soloSi.valores || []).length ? '' : '<p class="nota cuando-nota">Marca al menos un valor; si no, se guardará como «Siempre».</p>') +
        ((soloSi.ademas || []).length ? '<p class="nota cuando-nota">Además, solo si ' + soloSi.ademas.map(function (x) { return U.escapar(x.campo + ': ' + x.valores.join(' o ')); }).join(' y ') + '.</p>' : '');
    }
    return html;
  }

  /* Lo que dice el recuadro ahora: { campo, valores } (valores puede estar vacío mientras se elige) o null. */
  function leer(raiz, sel) {
    var b = raiz && raiz.matches && raiz.matches('.cuando-bloque') ? raiz : (raiz && raiz.querySelector(sel || ':scope > .cuando-bloque'));
    if (!b) return null;
    var s = b.querySelector('.cuando-campo');
    if (!s || !s.value) return null;
    var salida = { campo: s.value, valores: Array.prototype.map.call(b.querySelectorAll('.cuando-valor:checked'), function (c) { return c.value; }) };
    /* Las otras condiciones que vienen de una guía con preguntas dentro de respuestas: no se editan aquí, pero no se pierden. */
    try { var ademas = JSON.parse(b.dataset.ademas || '[]'); if (ademas.length) salida.ademas = ademas; } catch (e) { /* sin ellas */ }
    return salida;
  }

  /* `alCambiar` (opcional): se llama después de cambiar el desplegable. */
  function bloque(soloSi, claseExtra, alCambiar) {
    var d = document.createElement('div');
    d.className = 'cuando-bloque ' + (claseExtra || '');
    var id = 'cuando-' + (++contador);
    function pintar(valor) {
      d.innerHTML = contenidoHTML(valor, id);
      var s = d.querySelector('.cuando-campo');
      /* Directo en el desplegable: corre antes que el aviso de cambio del editor, que ya lo encuentra rehecho. */
      s.onchange = function () {
        pintar(s.value ? { campo: s.value, valores: [] } : null);
        if (alCambiar) alCambiar();
      };
    }
    if (soloSi && soloSi.ademas && soloSi.ademas.length) d.dataset.ademas = JSON.stringify(soloSi.ademas);
    pintar(soloSi && soloSi.campo ? soloSi : null);
    return d;
  }

  /* Para una tarea: el HTML del recuadro (la tarea se repinta entera al cambiar algo, así que no hace falta enganchar). */
  function html(soloSi, claseExtra) {
    var d = bloque(soloSi, claseExtra);
    return d.outerHTML;
  }

  /* Engancha el desplegable de un recuadro que ya está en pantalla (el de una tarea). */
  function enganchar(b, alCambiar) {
    if (!b) return;
    var s = b.querySelector('.cuando-campo');
    if (!s) return;
    var id = s.id;
    s.onchange = function () {
      b.innerHTML = contenidoHTML(s.value ? { campo: s.value, valores: [] } : null, id);
      enganchar(b, alCambiar);
      if (alCambiar) alCambiar();
    };
  }

  /* La frase gris del resumen de un hito o tarea: '' si es «Siempre». */
  function etiqueta(soloSi) { return window.SoloSi ? SoloSi.etiqueta(soloSi) : ''; }

  return { ponerTipo: ponerTipo, bloque: bloque, html: html, enganchar: enganchar, leer: leer, etiqueta: etiqueta };
})();
window.GuiasCuando = GuiasCuando;
