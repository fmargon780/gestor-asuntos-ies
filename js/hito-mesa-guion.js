/* ============================================================
   hito-mesa-guion.js — la columna izquierda de la mesa del hito: el
   guion, o la pregunta de un hito-pregunta (24-sep-2026, fila 109,
   docs/EL-HITO-A-PANTALLA-COMPLETA.md, sección 3).

   - "Guion del hito", la cuenta "N de M" y una barra de progreso.
   - Cada paso: casilla, texto en negrita, explicación en gris y, debajo,
     su acción (si tiene: pulsa el botón de siempre del hito), su
     normativa como etiqueta "§ cita" y "No aplica". Marcado: tachado,
     con quién y cuándo en el `title`.
   - "+ Añadir un paso a la guía del tipo" (fila 120, docs/GUION-DESDE-EL-HITO.md):
     la línea va al final del guion del paso de la guía (`origenGuia`) y
     sale en todos los asuntos de ese tipo. No sale si el hito no viene
     de un paso de la guía, ni si ese paso es una pregunta.
   - "+ Añadir un paso solo para este asunto" (no toca la guía).
   - Una pregunta del guion (fila 116, docs/PREGUNTAS-EN-EL-GUION.md): su
     texto y un botón por respuesta; debajo, sangradas, las líneas de la
     elegida. Lo marcado de una respuesta que se cambió, plegado al final.
   - Un hito-pregunta enseña "¿Qué supuesto es?" con las opciones como
     tarjetas; elegir otra cambia de rama como siempre.

   - Algo que hay que reunir (fila 138, docs/UNA-SOLA-LISTA-EN-EL-HITO.md):
     📎 delante si es un documento (se marca solo al añadirlo o asociarlo
     al hito, y dice cuál), ✎ si es un dato (con su caja: se marca al
     escribirlo), y «obligatorio» en negrita si lo es.

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
    var marcaReunir = g.reunir === 'documento' ? '<span class="guion-reunir-marca" title="Un documento que hay que reunir">📎</span>'
      : (g.reunir === 'dato' ? '<span class="guion-reunir-marca" title="Un dato que hay que reunir">✎</span>' : '');
    return '<div class="guion-paso' + (g.hecho ? ' hecho' : '') + (g.noaplica ? ' noaplica' : '') + (g.reunir ? ' guion-reunir' : '') + '" data-id="' +
        U.escapar(g.id) + '"' + (titulo ? ' title="' + U.escapar(titulo) + '"' : '') + '>' +
      '<label class="guion-paso-linea"><input type="checkbox" class="guion-casilla"' + (g.hecho ? ' checked' : '') +
        (abierto ? '' : ' disabled') + '>' + marcaReunir + '<span class="guion-paso-texto">' + U.escapar(g.texto) + '</span>' +
        (g.reunir && g.obligatorio ? ' <strong class="guion-obligatorio">obligatorio</strong>' : '') + '</label>' +
      (g.explicacion ? '<div class="guion-paso-explicacion">' + U.escapar(g.explicacion) + '</div>' : '') +
      (g.reunir === 'dato' ? '<input class="campo guion-dato" value="' + U.escapar(g.valor || '') + '" placeholder="Escríbelo aquí"' +
        (abierto ? '' : ' disabled') + '>' : '') +
      (g.reunir === 'documento' && g.hecho && g.documento ? '<div class="guion-paso-explicacion guion-reunir-documento">📎 ' + U.escapar(g.documento) + '</div>' : '') +
      '<div class="guion-paso-botones">' +
        (abierto && accion && !marcado ? '<button type="button" class="boton boton-chico guion-accion-boton" data-accion="' +
          U.escapar(g.accion) + '">' + U.escapar(accion.texto) + '</button>' : '') +
        enlaceNormativa(g.normativa) +
        (abierto ? '<button type="button" class="enlace guion-noaplica">' + (g.noaplica ? 'Sí aplica' : 'No aplica') + '</button>' : '') +
      '</div>' +
    '</div>';
  }

  /* Fila 116: una pregunta del guion, con un botón por respuesta. */
  function preguntaGuionHTML(g, abierto) {
    return '<div class="guion-paso guion-pregunta' + (g.elegida ? ' hecho' : '') + '" data-id="' + U.escapar(g.id) + '">' +
      '<div class="guion-paso-linea"><span class="guion-pregunta-marca">¿</span><span class="guion-paso-texto">' +
        U.escapar(g.texto) + '</span></div>' +
      (g.explicacion ? '<div class="guion-paso-explicacion">' + U.escapar(g.explicacion) + '</div>' : '') +
      '<div class="guion-respuestas">' + (g.opciones || []).map(function (o) {
        var es = o.id === g.elegida;
        return '<button type="button" class="guion-respuesta' + (es ? ' elegida' : '') + '" data-opcion="' + U.escapar(o.id) + '"' +
          (abierto ? '' : ' disabled') + '>' + (es ? '✓ ' : '') + U.escapar(o.texto || 'Respuesta') + '</button>';
      }).join('') + '</div>' +
    '</div>';
  }

  function lineaHTML(g, abierto) {
    if (g.pregunta) return preguntaGuionHTML(g, abierto);
    var html = pasoHTML(g, abierto);
    return g.deOpcion ? html.replace('class="guion-paso', 'class="guion-paso guion-de-opcion') : html;
  }

  /* Lo marcado de una respuesta que ya no es la elegida: en gris, plegado. */
  function plegadasHTML(lista) {
    if (!lista || !lista.length) return '';
    return '<details class="guion-plegadas"><summary>' + lista.length +
      (lista.length === 1 ? ' línea marcada' : ' líneas marcadas') + ' de otra respuesta</summary>' +
      lista.map(function (g) {
        return '<div class="guion-paso guion-paso-plegada">' + (g.hecho ? '✓ ' : '— ') + U.escapar(g.texto) +
          ' <span class="suave">(' + U.escapar((g.deOpcion && g.deOpcion.respuesta) || '') + ')</span></div>';
      }).join('') + '</details>';
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
      (guion.length ? guion.map(function (g) { return lineaHTML(g, abierto); }).join('') + plegadasHTML(guion.plegadas)
        : '<p class="explica">Este hito todavía no tiene guion. Añade el primer paso aquí abajo.</p>') +
      (abierto && pasoDeLaGuia(a, h) ? '<button type="button" class="enlace guion-anadir-guia">+ Añadir un paso a la guía del tipo</button><br>' : '') +
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
    /* Fila 116: elegir (o cambiar) la respuesta de una pregunta del guion. */
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-pregunta .guion-respuesta'), function (b) {
      b.onclick = function () {
        var idPregunta = b.closest('.guion-pregunta').dataset.id;
        guardar(b, function () { return Hitos.elegirEnGuion(a.nombre, h.id, idPregunta, b.dataset.opcion); });
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-paso:not(.guion-pregunta):not(.guion-paso-plegada)'), function (el) {
      var id = el.dataset.id;
      var casilla = el.querySelector('.guion-casilla');
      casilla.onchange = function () {
        guardar(casilla, function () { return Hitos.marcarGuion(a.nombre, h.id, id, { hecho: casilla.checked }); });
      };
      /* Fila 138: un dato se marca al escribirlo. */
      var dato = el.querySelector('.guion-dato');
      if (dato) dato.onchange = function () {
        guardar(dato, function () { return Hitos.escribirValorGuion(a.nombre, h.id, id, dato.value); });
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
    var deGuia = caja.querySelector('.guion-anadir-guia');
    if (deGuia) deGuia.onclick = function () { anadirALaGuia(a, h); };
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

  function tipoDe(a) {
    return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || '';
  }

  /* El paso de la guía del que sale el hito, si lo hay y no es una pregunta. */
  function pasoDeLaGuia(a, h) {
    if (!h || !h.origenGuia || !Hitos.pasoDeGuia || !window.GuiasDelCentro || !GuiasDelCentro.cambiarPasos) return null;
    var p = Hitos.pasoDeGuia(a, h);
    return (p && !(p.opciones && p.opciones.length)) ? p : null;
  }

  function buscarPaso(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      if (pasos[i].id === id) return pasos[i];
      for (var j = 0; j < (pasos[i].opciones || []).length; j++) {
        var enc = buscarPaso(pasos[i].opciones[j].pasos, id);
        if (enc) return enc;
      }
    }
    return null;
  }

  /* Lo escrito que no se pudo guardar: vuelve a salir al abrir el cuadro. */
  var sinGuardar = '';

  /* Fila 120: la línea nueva, al final del guion del paso (fuera de las
     respuestas de una pregunta), sin acción ni normativa. */
  async function anadirALaGuia(a, h) {
    var tipo = tipoDe(a);
    var esperar = U.preguntar('Añadir un paso a la guía del tipo',
      '<input class="campo" id="guion-guia-texto" placeholder="Qué hay que hacer">' +
      '<p class="nota">Sale en todos los asuntos de ' + U.escapar(tipo) + ', abiertos y nuevos. ' +
      'La acción, la normativa y la explicación se completan en Ajustes.</p>', 'Añadir');
    var t = document.getElementById('guion-guia-texto');
    if (t && sinGuardar) t.value = sinGuardar;
    var ok = await esperar;
    if (!ok) return;
    var texto = String((t && t.value) || '').trim();
    if (!texto) return;
    sinGuardar = texto;
    try {
      var hecho = await GuiasDelCentro.cambiarPasos(tipo, function (pasos) {
        var p = buscarPaso(pasos, h.origenGuia);
        if (!p || (p.opciones && p.opciones.length)) return false;
        p.guion = GuiasGuion.normalizar((p.guion || []).concat([{ texto: texto, explicacion: '', accion: '', normativa: null }]));
        return true;
      });
      if (!hecho) { U.aviso('Ese paso ya no está en la guía del tipo.', 'ambar'); return; }
    } catch (e) {
      U.fallo('No he podido añadirlo a la guía', e);
      return;
    }
    sinGuardar = '';
    var t2 = (App.E.tipos || []).filter(function (x) { return x.tipo === tipo; })[0];
    U.aviso('Añadido a la guía de ' + (Nombres.tipoParaCarpeta ? Nombres.tipoParaCarpeta(t2) || tipo : tipo), 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  return { pintar: pintar };
})();
window.HitoMesaGuion = HitoMesaGuion;
