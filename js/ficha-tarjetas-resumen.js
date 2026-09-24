/* ============================================================
   ficha-tarjetas-resumen.js — lo que enseña cada tarjeta cerrada de la
   ficha (Hitos, Documentos, Notas, Otros asuntos, Personas), sacado de
   js/ficha-tarjetas.js (24-sep-2026, fila 114,
   docs/DOCUMENTOS-EN-LA-TARJETA.md: aquel pasaba de las 450 líneas).

   `FichaTarjetasResumen.crear(c)` con c = { raiz, documentos,
   abrirDocumento, abrir, asunto } devuelve { todas, medir }:
   - `todas()`: rehace los resúmenes (solo si cambia lo que dicen).
   - `medir()`: cuántos documentos caben enteros en la tarjeta cerrada
     (lo llama `ajustarAlto()` de js/ficha-tarjetas.js).
   Cada renglón lleva `title` con su texto entero. Se carga justo antes
   de js/ficha-tarjetas.js.
   ============================================================ */
var FichaTarjetasResumen = (function () {
  function $(id) { return document.getElementById(id); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function crear(c) {
  var raiz = c.raiz;

  function ponerCuenta(id, texto) {
    var r = raiz();
    var el = r && r.querySelector('.ficha-cuenta[data-cuenta-tarjeta="' + id + '"]');
    if (el && el.textContent !== texto) el.textContent = texto;
  }

  /* `partes`: lista de { texto, clase, alPulsar }. Solo se rehace si
     cambia lo que dice (así no despierta al observador en balde). */
  function ponerResumen(id, partes, vacio) {
    var r = raiz();
    var caja = r && r.querySelector('.ficha-tarjeta[data-tarjeta="' + id + '"] > .ficha-tarjeta-resumen');
    if (!caja) return;
    var firma = JSON.stringify(partes.map(function (p) { return [p.texto, p.clase || '']; })) + (vacio ? '·v' : '');
    if (caja.dataset.firma === firma) return;
    caja.dataset.firma = firma;
    caja.innerHTML = '';
    caja.closest('.ficha-tarjeta').classList.toggle('ficha-tarjeta-vacia', !!vacio);
    partes.forEach(function (p) {
      var el = document.createElement(p.alPulsar ? 'button' : 'div');
      if (p.alPulsar) {
        el.type = 'button';
        el.onclick = function (ev) { ev.stopPropagation(); p.alPulsar(); };
      }
      el.className = 'ficha-resumen-linea' + (p.clase ? ' ' + p.clase : '');
      el.textContent = p.texto;
      el.title = p.texto;   /* el texto entero, si no cabe (fila 114) */
      caja.appendChild(el);
    });
  }

  function resumirHitos() {
    var guia = $('ficha-guia');
    if (!guia) return;
    var filas = Array.prototype.filter.call(guia.querySelectorAll('.hito'), function (h) {
      return !h.classList.contains('hito-noaplica');
    });
    if (!filas.length) {
      ponerCuenta('hitos', '');
      ponerResumen('hitos', [{ texto: 'ninguno todavía' }], true);
      return;
    }
    var hechos = filas.filter(function (h) { return h.classList.contains('hito-hecho'); }).length;
    ponerCuenta('hitos', hechos + '/' + filas.length);
    var partes = [{ texto: hechos + ' de ' + filas.length + (filas.length === 1 ? ' hecho' : ' hechos'), clase: 'fuerte' }];
    var siguiente = filas.filter(function (h) { return h.classList.contains('hito-encurso'); })[0] ||
                    filas.filter(function (h) { return h.classList.contains('hito-pendiente'); })[0];
    if (siguiente) {
      var titulo = siguiente.querySelector('.hito-titulo');
      var meta = siguiente.querySelector('.hito-meta');
      partes.push({ texto: 'Siguiente: ' + (titulo ? titulo.textContent.trim() : '') });
      if (meta && meta.textContent.trim()) partes.push({ texto: meta.textContent.trim(), clase: 'suave' });
    }
    ponerResumen('hitos', partes, false);
  }

  /* Documentos (fila 114): sin la línea «N documentos» (ya está en el
     círculo del título); como mucho 5 nombres, o los que quepan enteros,
     y «y N más», que abre la tarjeta en grande. */
  var MAX_DOCS = 5;
  var caben = MAX_DOCS;

  function resumirDocumentos() {
    var docs = c.documentos();
    if (!docs.length) {
      var caja = $('ficha-documentos');
      var leyendo = caja && /Leyendo/.test(caja.textContent || '');
      ponerResumen('documentos', [{ texto: leyendo ? 'Leyendo…' : 'ninguno todavía' }], !leyendo);
      return;
    }
    var limite = Math.max(1, Math.min(MAX_DOCS, caben));
    var vistos = docs.length <= limite ? docs.length : Math.max(1, limite - 1);
    var partes = docs.slice(0, vistos).map(function (d) {
      return { texto: d.nombre, clase: 'ficha-resumen-doc', alPulsar: function () { c.abrirDocumento(d.nombre); } };
    });
    if (docs.length > vistos) {
      partes.push({ texto: 'y ' + (docs.length - vistos) + ' más', clase: 'ficha-resumen-doc ficha-resumen-mas',
        alPulsar: function () { c.abrir('documentos'); } });
    }
    ponerResumen('documentos', partes, false);
  }

  /* Cuántos renglones enteros caben en el resumen de Documentos: el alto
     de la caja entre el de un renglón (con su separación). Se llama
     después de ajustar el alto de la rejilla. */
  function medir() {
    var r = raiz();
    var caja = r && r.querySelector('.ficha-tarjeta[data-tarjeta="documentos"] > .ficha-tarjeta-resumen');
    if (!caja || !caja.offsetParent) return;
    var linea = caja.querySelector('.ficha-resumen-linea');
    if (!linea) return;
    var alto = linea.getBoundingClientRect().height;
    var hueco = parseFloat(getComputedStyle(caja).rowGap) || 0;
    if (!alto) return;
    var n = Math.max(1, Math.floor((caja.clientHeight + hueco) / (alto + hueco)));
    if (n !== caben) { caben = n; resumirDocumentos(); }
  }

  function resumirNotas() {
    var a = c.asunto();
    var ficha = a && ((App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha);
    var notas = (ficha && ficha.notas) || [];
    ponerCuenta('notas', notas.length ? String(notas.length) : '');
    if (!notas.length) { ponerResumen('notas', [{ texto: 'ninguna todavía' }], true); return; }
    var n = notas[notas.length - 1];
    var cuando = n.cuando ? U.fechaLegible(U.aAaMmDd(String(n.cuando).slice(0, 10))) : '';
    ponerResumen('notas', [
      { texto: plural(notas.length, 'nota', 'notas'), clase: 'fuerte' },
      { texto: [n.quien, cuando].filter(Boolean).join(' · '), clase: 'suave' },
      { texto: String(n.texto || '').replace(/\s+/g, ' ').trim() }
    ], false);
  }

  function resumirLista(id, cajaId, selector, nombreDe, uno, varios) {
    var caja = $(cajaId);
    if (!caja) return;
    var filas = Array.prototype.slice.call(caja.querySelectorAll(selector));
    var total = caja.dataset.cuenta ? parseInt(caja.dataset.cuenta, 10) : filas.length;
    ponerCuenta(id, total ? String(total) : '');
    if (!filas.length) {
      var buscando = /Buscando|Leyendo/.test(caja.textContent || '');
      ponerResumen(id, [{ texto: buscando ? caja.textContent.trim() : 'ninguno todavía' }], !buscando);
      return;
    }
    var partes = [{ texto: plural(Math.max(total, filas.length), uno, varios), clase: 'fuerte' }];
    filas.forEach(function (f) { partes.push({ texto: nombreDe(f) }); });
    ponerResumen(id, partes, false);
  }

  function resumirTodas() {
    if (!raiz()) return;
    resumirHitos();
    resumirDocumentos();
    resumirNotas();
    resumirLista('otros', 'ficha-otros', '.otros-asunto', function (b) { return b.dataset.nombre || b.textContent; },
      'asunto', 'asuntos');
    resumirLista('relacionados', 'ficha-relacionados', '.relacionado-fila', function (f) {
      var s = f.querySelectorAll(':scope > span');
      return s.length > 1 ? s[1].textContent : f.textContent;
    }, 'persona', 'personas');
  }

  return { todas: resumirTodas, medir: medir };
  }

  return { crear: crear };
})();
window.FichaTarjetasResumen = FichaTarjetasResumen;
