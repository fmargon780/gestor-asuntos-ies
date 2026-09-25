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

  /* Fila 150: el «Comunicar» de un paso del guion no pasa por el botón
     escondido de siempre (`.hito-comunicar-boton`, dentro de
     `.mesa-ocultos`): cuando ofrece dos vías, `FichaMenus` monta su menú
     ahí mismo, y un contenedor con `display:none` se lo lleva por
     delante, invisible. Se llama a `HitosComunicar.comunicar` en línea
     recta, con el mismo cuadro que la cabecera, y con `idPasoGuion` para
     marcar justo este paso (no «el primero pendiente»). */
  var ETIQUETA_CANAL_GUION = { correo: 'Correo electrónico', seneca: 'Mensaje de Séneca' };

  function enlaceNormativa(n) {
    if (!n || !n.cita) return '';
    var url = n.url || '';
    return url
      ? '<a class="mesa-cita" href="' + U.escapar(url) + '" target="_blank" rel="noopener">§ ' + U.escapar(n.cita) + '</a>'
      : '<span class="mesa-cita">§ ' + U.escapar(n.cita) + '</span>';
  }

  /* Fila 145: la acción del paso; algo 📎 que hay que reunir, sin
     acción, se añade con «Añadir documento». */
  function accionDe(g) { return g.accion || (g.reunir === 'documento' ? 'anadir' : ''); }

  function pasoHTML(g, abierto, siguiente) {
    var marcado = g.hecho || g.noaplica;
    var titulo = marcado ? (g.noaplica ? 'No aplica' : 'Hecho') + (g.quien ? ' por ' + g.quien : '') +
      (g.cuando ? ' el ' + String(g.cuando).slice(0, 10) : '') +
      (g.valor ? ' · ' + g.valor : '') + (g.documento ? ' · ' + g.documento : '') : '';
    var claveAccion = accionDe(g);
    var accion = BOTON_DE_ACCION[claveAccion];
    var marcaReunir = g.reunir === 'documento' ? '<span class="guion-reunir-marca" title="Un documento que hay que reunir">📎</span>'
      : (g.reunir === 'dato' ? '<span class="guion-reunir-marca" title="Un dato que hay que reunir">✎</span>' : '');
    var botonAccion = abierto && accion && !marcado ? '<button type="button" class="boton ' + (siguiente ? 'boton-principal' : 'boton-chico') +
      ' guion-accion-boton" data-accion="' + U.escapar(claveAccion) + '">' + U.escapar(accion.texto) + '</button>' : '';
    return '<div class="guion-paso' + (g.hecho ? ' hecho' : '') + (g.noaplica ? ' noaplica' : '') + (g.reunir ? ' guion-reunir' : '') +
        (siguiente ? ' guion-siguiente' : '') + '" data-id="' +
        U.escapar(g.id) + '"' + (titulo ? ' title="' + U.escapar(titulo) + '"' : '') + '>' +
      '<div class="guion-paso-fila"><label class="guion-paso-linea"><input type="checkbox" class="guion-casilla"' + (g.hecho ? ' checked' : '') +
        (abierto ? '' : ' disabled') + '>' + marcaReunir + '<span class="guion-paso-texto">' + U.escapar(g.texto) + '</span>' +
        (g.reunir && g.obligatorio ? ' <strong class="guion-obligatorio">obligatorio</strong>' : '') + '</label>' + botonAccion + '</div>' +
      (g.explicacion ? '<div class="guion-paso-explicacion">' + U.escapar(g.explicacion) + '</div>' : '') +
      (g.reunir === 'dato' ? '<input class="campo guion-dato" value="' + U.escapar(g.valor || '') + '" placeholder="Escríbelo aquí"' +
        (abierto ? '' : ' disabled') + '>' : '') +
      (g.reunir === 'documento' && g.hecho && g.documento ? '<div class="guion-paso-explicacion guion-reunir-documento">📎 ' + U.escapar(g.documento) + '</div>' : '') +
      (abierto && siguiente && claveAccion === 'anadir' ? '<div class="guion-soltar">Suelta aquí el PDF, o pulsa el botón</div>' : '') +
      '<div class="guion-paso-botones">' +
        enlaceNormativa(g.normativa) +
        (abierto ? '<button type="button" class="enlace guion-noaplica">' + (g.noaplica ? 'Sí aplica' : 'No aplica') + '</button>' : '') +
      '</div>' +
    '</div>';
  }

  /* Fila 116: una pregunta del guion, con un botón por respuesta. */
  function preguntaGuionHTML(g, abierto, siguiente) {
    return '<div class="guion-paso guion-pregunta' + (g.elegida ? ' hecho' : '') + (siguiente ? ' guion-siguiente' : '') + '" data-id="' + U.escapar(g.id) + '">' +
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

  function lineaHTML(g, abierto, siguiente) {
    if (g.pregunta) return preguntaGuionHTML(g, abierto, siguiente);
    var html = pasoHTML(g, abierto, siguiente);
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
    /* Fila 145: el siguiente paso, el primero sin hacer y sin «No aplica»
       (con el hito ya hecho, ninguno). */
    var siguiente = h.estado === 'hecho' ? null : guion.filter(function (g) { return !g.hecho && !g.noaplica; })[0];
    caja.innerHTML =
      '<div class="mesa-bloque-cabecera mesa-guion-cabecera"><span class="mesa-bloque-titulo">Qué hay que hacer</span>' +
        '<div class="mesa-barra"><span style="width:' + pct + '%"></span></div>' +
        '<span class="mesa-guion-cuenta">' + c.hechos + ' de ' + c.total + '</span></div>' +
      (guion.length ? guion.map(function (g) { return lineaHTML(g, abierto, g === siguiente); }).join('') + plegadasHTML(guion.plegadas)
        : '<p class="explica">Este hito todavía no tiene guion. Añade el primer paso aquí abajo.</p>') +
      (abierto ? '<button type="button" class="enlace guion-anadir-propio">+ Añadir un paso solo para este asunto</button>' : '') +
      (abierto && puedeAnadirALaGuia(a, h)
        ? '<button type="button" class="enlace guion-cambiar-guion">✎ Cambiar el guion de este hito (para todos los asuntos de este tipo)</button>' : '');

    /* La normativa de los pasos del guion, también en la columna de consulta. */
    var consulta = fila.querySelector('.mesa-normativa-guion');
    if (consulta) {
      var ya = {};
      (h.normativa || []).forEach(function (n) { ya[n.cita] = true; });
      var delGuion = guion.filter(function (g) { return g.normativa && !ya[g.normativa.cita] && (ya[g.normativa.cita] = true); });
      consulta.innerHTML = delGuion.map(function (g) { return '<div class="mesa-normativa-linea">' + enlaceNormativa(g.normativa) + '</div>'; }).join('');
      /* Fila 145: «Normativa (N)», plegada; sin ninguna, no sale. */
      var bloqueNormas = consulta.closest('.mesa-normativa');
      var total = Object.keys(ya).length;
      if (bloqueNormas) {
        bloqueNormas.classList.toggle('oculto', !total);
        var cuenta = bloqueNormas.querySelector('.mesa-normativa-cuenta');
        if (cuenta) cuenta.textContent = total;
      }
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
      if (accion && accion.dataset.accion === 'comunicar' && window.HitosComunicar) {
        /* Fila 150: en línea recta, con este paso ya elegido para marcar. */
        var canales = HitosComunicar.canalesDe(a, h);
        if (canales.length > 1 && window.FichaMenus) {
          FichaMenus.montar(accion, canales.map(function (canal) {
            return { texto: ETIQUETA_CANAL_GUION[canal] || canal, alPulsar: function () {
              HitosComunicar.comunicar(a, h, canal, { idPasoGuion: id });
            } };
          }));
        } else {
          accion.onclick = function () { HitosComunicar.comunicar(a, h, canales[0] || 'correo', { idPasoGuion: id }); };
        }
      } else if (accion) {
        accion.onclick = function () {
          /* Fila 147: registrar se hace desde el ⋯ del documento, en su tarjeta. */
          if (accion.dataset.accion === 'registrar' && window.HitoMesa && HitoMesa.abrirTarjeta) HitoMesa.abrirTarjeta('docs');
          var destino = BOTON_DE_ACCION[accion.dataset.accion];
          var b = destino && fila.querySelector(destino.clase);
          if (b) b.click();
          else U.aviso('Esa acción está en los documentos del hito.', 'ambar');
        };
      }
    });
    /* Fila 145: soltar un fichero en el siguiente paso, como en la columna derecha. */
    var soltar = caja.querySelector('.guion-soltar');
    if (soltar) {
      soltar.ondragover = function (ev) { ev.preventDefault(); ev.stopPropagation(); soltar.classList.add('encima'); };
      soltar.ondragleave = function () { soltar.classList.remove('encima'); };
      soltar.ondrop = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        soltar.classList.remove('encima');
        var ficheros = ev.dataTransfer && ev.dataTransfer.files;
        if (ficheros && ficheros.length && window.Documentos && Documentos.abrir) Documentos.abrir(a, { hito: h, ficheroSoltado: ficheros[0] });
      };
    }
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
    var cambiarGuion = caja.querySelector('.guion-cambiar-guion');
    if (cambiarGuion) cambiarGuion.onclick = function () { cambiarGuionDelPaso(a, h); };
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

  function puedeAnadirALaGuia(a, h) { return !!pasoDeLaGuia(a, h); }

  /* Fila 150: «✎ Cambiar el guion de este hito», en la propia mesa, sin
     salir a Ajustes. Reutiliza js/guias-guion.js (el mismo editor de
     Ajustes), aquí solo para la lista `guion` de este paso: `leer()` para
     recoger lo escrito, `enganchar()` para subir/bajar/quitar/preguntas,
     igual que hace js/guias-paso-bloques.js con `ctx.recoger()`/`ctx.pintar()`. */
  async function cambiarGuionDelPaso(a, h) {
    var p = pasoDeLaGuia(a, h);
    if (!p || !window.GuiasGuion) return;
    var tipo = tipoDe(a);
    var lista = GuiasGuion.normalizar(p.guion || []);
    var caja = document.createElement('div');
    function pintarLocal() {
      caja.innerHTML = GuiasGuion.bloqueHTML(lista);
      var det = caja.querySelector('.paso-guion');
      if (det) det.open = true;
      GuiasGuion.enganchar(caja, function (mutador) {
        lista = GuiasGuion.leer(caja);
        mutador(lista);
        pintarLocal();
      });
    }
    pintarLocal();
    var esperar = U.preguntar('Cambiar el guion de este hito',
      '<p class="nota">Vale para todos los asuntos de ' + U.escapar(tipo) + ', abiertos y nuevos. ' +
      'Los pasos ya marcados en un asunto no se desmarcan.</p><div id="mesa-guion-editor"></div>', 'Guardar');
    var sitio = document.getElementById('mesa-guion-editor');
    if (sitio) sitio.appendChild(caja);
    var ok = await esperar;
    if (!ok) return;
    try {
      var normalizado = GuiasGuion.normalizar(GuiasGuion.leer(caja));
      var hecho = await GuiasDelCentro.cambiarPasos(tipo, function (pasos) {
        var pp = buscarPaso(pasos, h.origenGuia);
        if (!pp || (pp.opciones && pp.opciones.length)) return false;
        pp.guion = normalizado;
        return true;
      });
      if (!hecho) { U.aviso('Ese paso ya no está en la guía del tipo.', 'ambar'); return; }
    } catch (e) {
      U.fallo('No he podido guardar el guion', e);
      return;
    }
    U.aviso('Guion actualizado.', 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  return { pintar: pintar, puedeAnadirALaGuia: puedeAnadirALaGuia, anadirALaGuia: anadirALaGuia,
           cambiarGuionDelPaso: cambiarGuionDelPaso };
})();
window.HitoMesaGuion = HitoMesaGuion;
