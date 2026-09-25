/* ============================================================
   hito-mesa-tarjetas.js — las tarjetas pequeñas de la mesa del hito
   (25-sep-2026, fila 147, docs/MESA-TARJETAS-QUE-SE-ABREN.md).

   La mesa tiene tres tarjetas: «Qué hay que hacer» (el guion),
   «Documentos del hito» y «Notas e historia». Una está en grande a la
   izquierda; las otras dos salen a la derecha como resumen, sin botones
   dentro. Pulsar una (o Intro/espacio con el foco) la abre en grande
   (`HitoMesa.abrirTarjeta`), y «← Volver al guion» vuelve.

   Aquí solo se rellenan los tres resúmenes y se enganchan los gestos;
   las tres tarjetas grandes las pinta js/hitos-panel-lista.js
   (`cuerpoDeHito`) y cuál se ve lo recuerda js/hito-mesa.js. Se pintan
   las tres pequeñas siempre: el CSS esconde la que está en grande.

   Lo llama js/hito-mesa.js (`aplicar`), con la mesa abierta.
   ============================================================ */
var HitoMesaTarjetas = (function () {

  var MAX_DOCS = 5;

  /* «Qué hay que hacer» · «N de M»: ✓ los hechos, ☐ los pendientes y el
     siguiente en negrita con «→». Los «No aplica», fuera. */
  function resumenGuion(a, h) {
    if (h.clase === 'decision') {
      var opt = (h.opciones || []).filter(function (o) { return o.id === h.elegida; })[0];
      return { cuenta: '', html: '<div class="mesa-resumen-linea">' +
        (opt ? '✓ ' + U.escapar(opt.texto || '') : '¿Qué supuesto es? Sin elegir') + '</div>' };
    }
    var guion = Hitos.guionDe ? Hitos.guionDe(a, h) : [];
    var c = Hitos.cuentaGuion ? Hitos.cuentaGuion(guion) : { hechos: 0, total: 0 };
    var siguiente = h.estado === 'hecho' ? null : guion.filter(function (g) { return !g.hecho && !g.noaplica; })[0];
    var lineas = guion.filter(function (g) { return !g.noaplica; });
    return {
      cuenta: c.hechos + ' de ' + c.total,
      html: lineas.length ? lineas.map(function (g) {
        var es = g === siguiente;
        var clase = g.hecho ? 'mesa-resumen-hecho' : (es ? 'mesa-resumen-siguiente' : 'mesa-resumen-pendiente');
        var marca = g.hecho ? '✓' : (es ? '→' : '☐');
        return '<div class="mesa-resumen-linea ' + clase + '" title="' + U.escapar(g.texto || '') + '"><span class="mesa-resumen-marca">' +
          marca + '</span> ' + U.escapar(g.texto || '') + '</div>';
      }).join('') : '<div class="mesa-resumen-vacio">Sin guion todavía.</div>'
    };
  }

  /* «Documentos del hito» · número: el tipo y el registro (o «Sin
     registrar»), sin gemelos; cinco como mucho. */
  function resumenDocs(h) {
    var docs = window.HitoMesaDocumentos && HitoMesaDocumentos.resumen ? HitoMesaDocumentos.resumen(h) : [];
    var vistos = docs.slice(0, MAX_DOCS);
    return {
      cuenta: String(docs.length),
      html: (docs.length ? vistos.map(function (d) {
        return '<div class="mesa-resumen-linea mesa-resumen-doc" title="' + U.escapar(d.nombre) + '"><span class="mesa-resumen-doc-tipo">' +
          U.escapar(d.tipo) + '</span>' + (d.registro
            ? '<span class="mesa-resumen-etq mesa-resumen-reg">' + U.escapar(d.registro) + '</span>'
            : '<span class="mesa-resumen-etq mesa-resumen-sinreg">Sin registrar</span>') + '</div>';
      }).join('') + (docs.length > MAX_DOCS ? '<div class="mesa-resumen-mas">y ' + (docs.length - MAX_DOCS) + ' más</div>' : '')
        : '<div class="mesa-resumen-vacio">Ninguno todavía.</div>') +
        '<div class="mesa-resumen-pie">Pulsa para trabajar con ellos</div>'
    };
  }

  function dia(cuando) {
    var d = String(cuando || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && window.Plazos ? Plazos.legible(d) : d;
  }

  function primeraLinea(t) { return String(t || '').split('\n')[0]; }

  /* «Notas e historia» · «N notas»: la primera línea de la última nota y
     quién y cuándo; sin notas, lo último de la historia. */
  function resumenNotas(a, h) {
    var notas = window.NotasHito ? NotasHito.delHito(a, h.id) : [];
    var historia = h.notas || [];
    var ultima = notas[notas.length - 1];
    var html;
    if (ultima) {
      html = '<div class="mesa-resumen-linea mesa-resumen-nota">' + U.escapar(primeraLinea(ultima.texto)) + '</div>' +
        '<div class="mesa-resumen-pie">Última: ' + U.escapar(ultima.quien || '') + ' · ' + U.escapar(dia(ultima.cuando)) + '</div>';
    } else if (historia.length) {
      var h1 = historia[historia.length - 1];
      html = '<div class="mesa-resumen-linea mesa-resumen-historia">' + U.escapar(primeraLinea(h1.texto)) + '</div>' +
        '<div class="mesa-resumen-pie">Sin notas · ' + U.escapar(dia(h1.cuando)) + '</div>';
    } else {
      html = '<div class="mesa-resumen-vacio">Sin notas</div>';
    }
    return { cuenta: notas.length + (notas.length === 1 ? ' nota' : ' notas'), html: html };
  }

  function rellenar(fila, cual, r) {
    var t = fila.querySelector('.mesa-resumen[data-tarjeta="' + cual + '"]');
    if (!t) return;
    t.querySelector('.mesa-resumen-cuenta').textContent = r.cuenta ? '· ' + r.cuenta : '';
    t.querySelector('.mesa-resumen-cuerpo').innerHTML = r.html;
  }

  function pintar(fila, a, h) {
    if (!fila || !h) return;
    rellenar(fila, 'guion', resumenGuion(a, h));
    rellenar(fila, 'docs', resumenDocs(h));
    rellenar(fila, 'notas', resumenNotas(a, h));
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-resumen'), function (t) {
      t.onclick = function () { HitoMesa.abrirTarjeta(t.dataset.tarjeta); };
      t.onkeydown = function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        HitoMesa.abrirTarjeta(t.dataset.tarjeta);
      };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-volver-guion'), function (b) {
      b.onclick = function () { HitoMesa.abrirTarjeta('guion'); };
    });
  }

  return { pintar: pintar, resumenGuion: resumenGuion, resumenDocs: resumenDocs, resumenNotas: resumenNotas };
})();
window.HitoMesaTarjetas = HitoMesaTarjetas;
