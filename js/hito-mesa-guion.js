/* ============================================================
   hito-mesa-guion.js — la columna izquierda de la mesa del hito: el
   guion, o la pregunta de un hito-pregunta (24-sep-2026, fila 109,
   docs/EL-HITO-A-PANTALLA-COMPLETA.md, sección 3).

   - "Guion del hito", la cuenta "N de M" y una barra de progreso.
   - Cada paso: casilla, texto en negrita, explicación en gris y, debajo,
     su acción (si tiene: pulsa el botón de siempre del hito), su
     normativa como etiqueta "§ cita" y "No aplica". Marcado: tachado,
     con quién y cuándo en el `title`.
   - "+ Añadir un paso solo para este asunto" (no toca la guía).
   - Un hito-pregunta enseña "¿Qué supuesto es?" con las opciones como
     tarjetas; elegir otra cambia de rama como siempre.

   El dato y el guardado viven en js/hitos-guion.js (Hitos.guionDe,
   Hitos.marcarGuion, Hitos.anadirGuionPropio). Lo llama js/hito-mesa.js.
   ============================================================ */
var HitoMesaGuion = (function () {

  var BOTON_DE_ACCION = {
    generar: { clase: '.hito-generar', texto: 'Generar documento' },
    comunicar: { clase: '.hito-comunicar-boton', texto: 'Comunicar' },
    anadir: { clase: '.hito-anadir-documento', texto: 'Añadir documento' },
    registrar: { clase: '.hito-doc-menu-boton', texto: 'Registrar (en el ⋯ del documento)' }
  };

  function enlaceNormativa(n) {
    if (!n || !n.cita) return '';
    var url = n.url || '';
    return url
      ? '<a class="mesa-cita" href="' + U.escapar(url) + '" target="_blank" rel="noopener">§ ' + U.escapar(n.cita) + '</a>'
      : '<span class="mesa-cita">§ ' + U.escapar(n.cita) + '</span>';
  }

  function pasoHTML(g, abierto) {
    var marcado = g.hecho || g.noaplica;
    var titulo = marcado ? (g.noaplica ? 'No aplica' : 'Hecho') + (g.quien ? ' por ' + g.quien : '') +
      (g.cuando ? ' el ' + String(g.cuando).slice(0, 10) : '') : '';
    var accion = BOTON_DE_ACCION[g.accion];
    return '<div class="guion-paso' + (g.hecho ? ' hecho' : '') + (g.noaplica ? ' noaplica' : '') + '" data-id="' +
        U.escapar(g.id) + '"' + (titulo ? ' title="' + U.escapar(titulo) + '"' : '') + '>' +
      '<label class="guion-paso-linea"><input type="checkbox" class="guion-casilla"' + (g.hecho ? ' checked' : '') +
        (abierto ? '' : ' disabled') + '><span class="guion-paso-texto">' + U.escapar(g.texto) + '</span></label>' +
      (g.explicacion ? '<div class="guion-paso-explicacion">' + U.escapar(g.explicacion) + '</div>' : '') +
      '<div class="guion-paso-botones">' +
        (abierto && accion && !marcado ? '<button type="button" class="boton boton-chico guion-accion-boton" data-accion="' +
          U.escapar(g.accion) + '">' + U.escapar(accion.texto) + '</button>' : '') +
        enlaceNormativa(g.normativa) +
        (abierto ? '<button type="button" class="enlace guion-noaplica">' + (g.noaplica ? 'Sí aplica' : 'No aplica') + '</button>' : '') +
      '</div>' +
    '</div>';
  }

  function preguntaHTML(h, abierto) {
    return '<div class="mesa-pregunta"><div class="mesa-bloque-titulo">¿Qué supuesto es?</div>' +
      '<div class="mesa-pregunta-opciones">' + (h.opciones || []).map(function (o) {
        return '<button type="button" class="mesa-opcion' + (o.id === h.elegida ? ' elegida' : '') + '" data-opcion="' +
          U.escapar(o.id) + '"' + (abierto ? '' : ' disabled') + '>' + (o.id === h.elegida ? '✓ ' : '') +
          U.escapar(o.texto || 'Opción') + '</button>';
      }).join('') + '</div></div>';
  }

  function pintar(fila, a, h, abierto) {
    var caja = fila.querySelector('.mesa-guion');
    if (!caja || !h) return;
    if (h.clase === 'decision') {
      caja.innerHTML = preguntaHTML(h, abierto);
      Array.prototype.forEach.call(caja.querySelectorAll('.mesa-opcion'), function (b) {
        b.onclick = function () {
          if (window.HitosPanelLista && HitosPanelLista.cambiarRama) HitosPanelLista.cambiarRama(a, h, b.dataset.opcion, b);
        };
      });
      return;
    }
    var guion = Hitos.guionDe(a, h);
    var c = Hitos.cuentaGuion(guion);
    var pct = c.total ? Math.round(100 * c.hechos / c.total) : 0;
    caja.innerHTML =
      '<div class="mesa-bloque-cabecera"><span class="mesa-bloque-titulo">Guion del hito</span>' +
        '<span class="mesa-guion-cuenta">' + c.hechos + ' de ' + c.total + '</span></div>' +
      '<div class="mesa-barra"><span style="width:' + pct + '%"></span></div>' +
      (guion.length ? guion.map(function (g) { return pasoHTML(g, abierto); }).join('')
        : '<p class="explica">Este hito todavía no tiene guion. Se escribe en la guía del tipo (Ajustes), en «Guion de este paso».</p>') +
      (abierto ? '<button type="button" class="enlace guion-anadir-propio">+ Añadir un paso solo para este asunto</button>' : '');

    /* La normativa de los pasos del guion, también en la columna de consulta. */
    var consulta = fila.querySelector('.mesa-normativa-guion');
    if (consulta) {
      var ya = {};
      (h.normativa || []).forEach(function (n) { ya[n.cita] = true; });
      consulta.innerHTML = guion.filter(function (g) { return g.normativa && !ya[g.normativa.cita] && (ya[g.normativa.cita] = true); })
        .map(function (g) { return '<div class="mesa-normativa-linea">' + enlaceNormativa(g.normativa) + '</div>'; }).join('');
    }
    if (!abierto) return;

    function guardar(control, hacer) {
      if (window.HitosPanelLista && HitosPanelLista.guardarHito) return HitosPanelLista.guardarHito(control, 'guardar el guion', hacer);
      return hacer();
    }
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-paso'), function (el) {
      var id = el.dataset.id;
      var casilla = el.querySelector('.guion-casilla');
      casilla.onchange = function () {
        guardar(casilla, function () { return Hitos.marcarGuion(a.nombre, h.id, id, { hecho: casilla.checked }); });
      };
      var noaplica = el.querySelector('.guion-noaplica');
      if (noaplica) noaplica.onclick = function () {
        guardar(noaplica, function () { return Hitos.marcarGuion(a.nombre, h.id, id, { noaplica: !el.classList.contains('noaplica') }); });
      };
      var accion = el.querySelector('.guion-accion-boton');
      if (accion) accion.onclick = function () {
        var destino = BOTON_DE_ACCION[accion.dataset.accion];
        var b = destino && fila.querySelector(destino.clase);
        if (b) b.click();
        else U.aviso('Esa acción está en los documentos del hito.', 'ambar');
      };
    });
    var propio = caja.querySelector('.guion-anadir-propio');
    if (propio) propio.onclick = async function () {
      var ok = await U.preguntar('Añadir un paso al guion de este asunto',
        '<input class="campo" id="guion-propio-texto" placeholder="Qué hay que hacer">' +
        '<p class="nota">Solo para este asunto: la guía del tipo no cambia.</p>', 'Añadir');
      if (!ok) return;
      var t = document.getElementById('guion-propio-texto');
      var texto = t ? t.value : '';
      guardar(null, function () { return Hitos.anadirGuionPropio(a.nombre, h.id, texto); });
    };
  }

  return { pintar: pintar };
})();
window.HitoMesaGuion = HitoMesaGuion;
