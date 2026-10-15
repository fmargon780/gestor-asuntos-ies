/* ============================================================
   caja-con-sugerencias.js — una caja en la que se escribe y que va enseñando, debajo, solo lo que coincide
   (fila 350, 15-oct-2026, docs/ETIQUETAS-BUSCADOR-VERTICAL-FILTRO.md). Sustituye a las listas desplegables
   largas del filtro del alumnado (js/repartir-filtro.js) y de Etiquetas (js/etiquetas-pantalla.js), y es
   también la caja del buscador de personas de Etiquetas.

   - html(id, { placeholder, valor, deshabilitada }) → la caja (un <input id="id"> y su lista).
   - enganchar(raiz, id, { fuente, minimo, alElegir, vaciar }):
       fuente(texto) → [{ valor, texto, detalle?, aviso? }] lo que se enseña para ese texto;
       minimo: letras que hacen falta antes de enseñar nada (0 = con la caja vacía salen todos);
       alElegir(item); vaciar: true deja la caja vacía tras elegir (el buscador), si no se queda el texto.
     Flechas arriba y abajo para moverse, Intro para elegir (el marcado, o el primero), Esc para cerrar.
   - deLista(items, tope) → una `fuente` que filtra una lista fija [{ valor, texto }] por lo escrito
     (sin distinguir mayúsculas ni tildes).
   ============================================================ */
var CajaConSugerencias = (function () {

  var TOPE = 200;

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function nor(t) { return U.normalizar(String(t || '')); }

  function html(id, op) {
    op = op || {};
    return '<span class="csg"><input id="' + esc(id) + '" class="campo csg-entrada" type="text" autocomplete="off" role="combobox" aria-expanded="false"' +
      ' placeholder="' + esc(op.placeholder || '') + '" value="' + esc(op.valor || '') + '"' + (op.deshabilitada ? ' disabled' : '') + '>' +
      '<ul class="csg-lista oculto" role="listbox"></ul></span>';
  }

  function deLista(items, tope) {
    return function (texto) {
      var q = nor(texto).trim();
      var salida = !q ? items.slice() : items.filter(function (o) { return nor(o.texto + ' ' + o.valor).indexOf(q) !== -1; });
      return salida.slice(0, tope || TOPE);
    };
  }

  function enganchar(raiz, id, op) {
    var entrada = raiz.querySelector('#' + id);
    if (!entrada) return null;
    var lista = entrada.parentNode.querySelector('.csg-lista');
    var minimo = op.minimo || 0, items = [], activo = -1;

    function cerrar() {
      lista.classList.add('oculto');
      entrada.setAttribute('aria-expanded', 'false');
      activo = -1;
    }

    function marcar() {
      Array.prototype.forEach.call(lista.querySelectorAll('li[data-i]'), function (li) {
        li.classList.toggle('csg-activo', Number(li.getAttribute('data-i')) === activo);
      });
      var li = lista.querySelector('li.csg-activo');
      if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
    }

    function pintar() {
      var texto = entrada.value, q = nor(texto).trim();
      if (q.length < minimo) {
        items = [];
        lista.innerHTML = q.length ? '<li class="csg-nota">Escribe al menos ' + minimo + ' letras.</li>' : '';
        lista.classList.toggle('oculto', !q.length);
        entrada.setAttribute('aria-expanded', q.length ? 'true' : 'false');
        return;
      }
      items = op.fuente(texto) || [];
      activo = -1;
      lista.innerHTML = items.length ? items.map(function (o, i) {
        return '<li role="option" data-i="' + i + '"' + (o.aviso ? ' class="csg-gris"' : '') + '><span>' + esc(o.texto) + '</span>' +
          (o.detalle ? ' <span class="csg-detalle">' + esc(o.detalle) + '</span>' : '') + '</li>';
      }).join('') : '<li class="csg-nota">Nada coincide.</li>';
      lista.classList.remove('oculto');
      entrada.setAttribute('aria-expanded', 'true');
    }

    function elegir(i) {
      var o = items[i];
      if (!o) return;
      entrada.value = op.vaciar ? '' : o.texto;
      cerrar();
      op.alElegir(o);
    }

    entrada.addEventListener('focus', pintar);
    entrada.addEventListener('input', pintar);
    entrada.addEventListener('click', function () { if (lista.classList.contains('oculto')) pintar(); });
    entrada.addEventListener('blur', function () { setTimeout(cerrar, 120); });
    entrada.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (lista.classList.contains('oculto')) pintar();
        if (!items.length) return;
        activo = ev.key === 'ArrowDown' ? Math.min(items.length - 1, activo + 1) : Math.max(0, activo - 1);
        marcar();
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (!items.length || lista.classList.contains('oculto')) return;
        var exacto = -1, q = nor(entrada.value).trim();
        items.forEach(function (o, i) { if (exacto === -1 && q && (nor(o.texto) === q || nor(o.valor) === q)) exacto = i; });
        elegir(activo >= 0 ? activo : (exacto >= 0 ? exacto : 0));
      } else if (ev.key === 'Escape') {
        if (!lista.classList.contains('oculto')) { ev.stopPropagation(); ev.preventDefault(); cerrar(); }
      }
    });
    /* mousedown (no click): así la caja no pierde el foco antes de elegir. */
    lista.addEventListener('mousedown', function (ev) {
      var li = ev.target.closest('li[data-i]');
      if (!li) return;
      ev.preventDefault();
      elegir(Number(li.getAttribute('data-i')));
    });
    return { cerrar: cerrar, repintar: pintar };
  }

  return { html: html, enganchar: enganchar, deLista: deLista };
})();
window.CajaConSugerencias = CajaConSugerencias;
