/* ============================================================
   hito-mesa-guion.js — la columna izquierda de la mesa del hito: el
   guion, o la pregunta de un hito-pregunta (24-sep-2026, fila 109,
   docs/EL-HITO-A-PANTALLA-COMPLETA.md, sección 3).

   - "Tareas del hito", la cuenta "N de M" y una barra de progreso.
   - Cada tarea: casilla, texto en negrita, explicación en gris, su
     normativa como etiqueta "§ cita" y "No aplica". Desde la fila 154
     (docs/HITOS-ACCIONES-EN-EL-HITO.md), sin botones de acción: las
     acciones viven en la cabecera del hito (js/hito-mesa.js). Hecho: en
     gris, con quién y cuándo al lado; «No aplica»: tachado.
   - Fila 224 (docs/TAREAS-DEL-HITO-SENCILLAS.md): sin frases al pie. Al
     final de la lista, una sola caja «Nueva tarea… (escribe y pulsa
     Intro)»: añade solo a este asunto (`Hitos.anadirGuionPropio`, como
     antes «+ Añadir una tarea solo para este asunto»). Cada tarea lleva
     su «⋮» (js/hito-mesa-tarea-menu.js): Anotar, Cambiar (aquí o no) y
     Borrar o Pasar a la guía, según sea «solo aquí» o de la guía. «+
     Añadir una tarea a la guía del tipo» (fila 120) pasa a ser «Pasar a
     la guía» de una tarea «solo aquí»; «✎ Cambiar las tareas de este
     hito» pasa a ser «Cambiar en la guía» de una tarea de la guía,
     resaltándola en el mismo editor.
   - Una pregunta de las tareas (fila 116, docs/PREGUNTAS-EN-EL-GUION.md): su
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

  /* Fila 229: marcar, desmarcar o «No aplica» de una tarea deja su línea
     en el registro del hito (accesorio: si falla, ámbar). */
  function apuntarTarea(a, h, tarea, que) {
    if (!window.RegistroAsunto || !tarea) return Promise.resolve();
    return RegistroAsunto.auto(a, 'Tarea ' + (que === 'no aplica' ? '«' + tarea.texto + '»: no aplica' : que + ': ' + tarea.texto), h);
  }

  function enlaceNormativa(n) {
    if (!n || !n.cita) return '';
    var url = n.url || '';
    return url
      ? '<a class="mesa-cita" href="' + U.escapar(url) + '" target="_blank" rel="noopener">§ ' + U.escapar(n.cita) + '</a>'
      : '<span class="mesa-cita">§ ' + U.escapar(n.cita) + '</span>';
  }

  /* Fila 145: la acción de la tarea; algo 📎 que hay que reunir, sin
     acción, se añade con «Añadir documento». */
  function accionDe(g) { return g.accion || (g.reunir === 'documento' ? 'anadir' : ''); }

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaCorta(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3 || !MESES[parseInt(p[1], 10) - 1]) return '';
    return parseInt(p[2], 10) + '-' + MESES[parseInt(p[1], 10) - 1];
  }

  function pasoHTML(g, abierto, siguiente, a, h) {
    var marcado = g.hecho || g.noaplica;
    var titulo = marcado ? (g.noaplica ? 'No aplica' : 'Hecho') + (g.quien ? ' por ' + g.quien : '') +
      (g.cuando ? ' el ' + String(g.cuando).slice(0, 10) : '') +
      (g.valor ? ' · ' + g.valor : '') + (g.documento ? ' · ' + g.documento : '') : '';
    var claveAccion = accionDe(g);
    var marcaReunir = g.reunir === 'documento' ? '<span class="guion-reunir-marca" title="Un documento que hay que reunir">📎</span>'
      : (g.reunir === 'dato' ? '<span class="guion-reunir-marca" title="Un dato que hay que reunir">✎</span>' : '');
    /* Fila 154 (docs/HITOS-ACCIONES-EN-EL-HITO.md): las tareas ya no llevan
       botones de acción; las acciones viven solo en la cabecera del hito.
       Una tarea hecha dice al lado, en pequeño, quién y cuándo. */
    var quienCuando = g.hecho && !g.noaplica && (g.quien || g.cuando)
      ? '<span class="guion-paso-quien">' + U.escapar([g.quien || '', fechaCorta(g.cuando)].filter(Boolean).join(' · ')) + '</span>' : '';
    /* Fila 224: «solo aquí» (una tarea propia, sustituya o no a una de
       la guía) y el «⋮»/💬 de cada tarea, solo con el hito abierto. */
    var etiquetaPropia = g.propio ? '<span class="guion-tarea-propia" title="Solo existe en este asunto">solo aquí</span>' : '';
    var botonesTarea = (abierto && window.HitoMesaTareaMenu) ? HitoMesaTareaMenu.botonesHTML(g, a) : '';
    var debajoTarea = (abierto && window.HitoMesaTareaMenu) ? HitoMesaTareaMenu.debajoHTML(g, a) : '';
    return '<div class="guion-paso' + (g.hecho ? ' hecho' : '') + (g.noaplica ? ' noaplica' : '') + (g.reunir ? ' guion-reunir' : '') +
        (siguiente ? ' guion-siguiente' : '') + '" data-id="' +
        U.escapar(g.id) + '"' + (titulo ? ' title="' + U.escapar(titulo) + '"' : '') + '>' +
      '<div class="guion-paso-fila"><label class="guion-paso-linea"><input type="checkbox" class="guion-casilla"' + (g.hecho ? ' checked' : '') +
        (abierto ? '' : ' disabled') + '>' + marcaReunir + '<span class="guion-paso-texto">' + U.escapar(g.texto) + '</span>' +
        (g.reunir && g.obligatorio ? ' <strong class="guion-obligatorio">obligatorio</strong>' : '') + etiquetaPropia + '</label>' +
        quienCuando + botonesTarea + '</div>' +
      debajoTarea +
      (g.explicacion ? '<div class="guion-paso-explicacion">' + U.escapar(g.explicacion) + '</div>' : '') +
      (g.reunir === 'dato' ? '<input class="campo guion-dato" value="' + U.escapar(g.valor || '') + '" placeholder="Escríbelo aquí"' +
        (abierto ? '' : ' disabled') + '>' : '') +
      (g.reunir === 'documento' && g.hecho && g.documento ? '<div class="guion-paso-explicacion guion-reunir-documento">📎 ' + U.escapar(g.documento) + '</div>' : '') +
      (abierto && siguiente && claveAccion === 'anadir' ? '<div class="guion-soltar">Suelta aquí el PDF</div>' : '') +
      '<div class="guion-paso-botones">' +
        enlaceNormativa(g.normativa) +
        (abierto ? '<button type="button" class="enlace guion-noaplica">' + (g.noaplica ? 'Sí aplica' : 'No aplica') + '</button>' : '') +
      '</div>' +
    '</div>';
  }

  /* Fila 116: una pregunta de las tareas, con un botón por respuesta. */
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

  function lineaHTML(g, abierto, siguiente, a, h) {
    if (g.pregunta) return preguntaGuionHTML(g, abierto, siguiente);
    var html = pasoHTML(g, abierto, siguiente, a, h);
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
    /* Fila 224: el repintado de esta tarjeta no puede tirar lo que se
       esté escribiendo (la caja «Nueva tarea…», o el texto o la nota de
       una tarea en edición), ni el foco ni el cursor. */
    U.conservandoLoEscrito(caja, function () { pintarGuion(caja, fila, a, h, abierto); });
  }

  function pintarGuion(caja, fila, a, h, abierto) {
    var guion = Hitos.guionDe(a, h);
    var c = Hitos.cuentaGuion(guion);
    var pct = c.total ? Math.round(100 * c.hechos / c.total) : 0;
    /* Fila 145: la siguiente tarea, la primera sin hacer y sin «No aplica»
       (con el hito ya hecho, ninguno). */
    var siguiente = h.estado === 'hecho' ? null : guion.filter(function (g) { return !g.hecho && !g.noaplica; })[0];
    caja.innerHTML =
      '<div class="mesa-bloque-cabecera mesa-guion-cabecera"><span class="mesa-bloque-titulo">Tareas del hito</span>' +
        '<div class="mesa-barra"><span style="width:' + pct + '%"></span></div>' +
        '<span class="mesa-guion-cuenta">' + c.hechos + ' de ' + c.total + '</span></div>' +
      guion.map(function (g) { return lineaHTML(g, abierto, g === siguiente, a, h); }).join('') + plegadasHTML(guion.plegadas) +
      (abierto ? '<input class="campo guion-nueva-tarea" id="guion-nueva-tarea" placeholder="Nueva tarea… (escribe y pulsa Intro)">' : '');

    /* La normativa de las tareas del guion, también en la columna de consulta. */
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
    /* Fila 116: elegir (o cambiar) la respuesta de una pregunta de las tareas. */
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-pregunta .guion-respuesta'), function (b) {
      b.onclick = function () {
        var idPregunta = b.closest('.guion-pregunta').dataset.id;
        guardar(b, function () { return Hitos.elegirEnGuion(a.nombre, h.id, idPregunta, b.dataset.opcion); });
      };
    });
    var porId = {};
    guion.forEach(function (g) { porId[g.id] = g; });
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-paso:not(.guion-pregunta):not(.guion-paso-plegada)'), function (el) {
      var id = el.dataset.id;
      var casilla = el.querySelector('.guion-casilla');
      casilla.onchange = function () {
        var hecha = casilla.checked;
        guardar(casilla, function () {
          return Hitos.marcarGuion(a.nombre, h.id, id, { hecho: hecha }).then(function (r) {
            return apuntarTarea(a, h, porId[id], hecha ? 'hecha' : 'sin hacer').then(function () { return r; });
          });
        });
      };
      /* Fila 138: un dato se marca al escribirlo. */
      var dato = el.querySelector('.guion-dato');
      if (dato) dato.onchange = function () {
        guardar(dato, function () { return Hitos.escribirValorGuion(a.nombre, h.id, id, dato.value); });
      };
      var noaplica = el.querySelector('.guion-noaplica');
      if (noaplica) noaplica.onclick = function () {
        var ahoraNoAplica = !el.classList.contains('noaplica');
        guardar(noaplica, function () {
          return Hitos.marcarGuion(a.nombre, h.id, id, { noaplica: ahoraNoAplica }).then(function (r) {
            return apuntarTarea(a, h, porId[id], ahoraNoAplica ? 'no aplica' : 'sin hacer').then(function () { return r; });
          });
        });
      };
      /* Fila 224: el «⋮» (Anotar, Cambiar…, Borrar/Pasar a la guía) y el
         💬 de esta tarea. */
      var g = porId[id];
      if (g && window.HitoMesaTareaMenu) {
        HitoMesaTareaMenu.engancharFila(el, a, h, g, function () { pintar(fila, a, h, abierto); });
      }
    });
    /* Fila 145: soltar un fichero en la siguiente tarea, como en la columna derecha. */
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
    /* Fila 224: «Nueva tarea…», al pie de la lista. Intro añade solo a
       este asunto, vacía la caja y deja el foco para escribir otra
       (U.conservandoLoEscrito, más arriba, se encarga del foco tras el
       repintado). */
    var nueva = caja.querySelector('#guion-nueva-tarea');
    if (nueva) nueva.onkeydown = function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      var texto = nueva.value.trim();
      if (!texto) return;
      nueva.value = '';
      guardar(null, function () { return Hitos.anadirGuionPropio(a.nombre, h.id, texto); });
    };
  }

  function tipoDe(a) {
    return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || '';
  }

  /* El hito de la guía del que sale el hito, si lo hay y no es una pregunta. */
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

  function puedeAnadirALaGuia(a, h) { return !!pasoDeLaGuia(a, h); }

  /* Fila 150: el editor de tareas de siempre, en la propia mesa, sin
     salir a Ajustes. Reutiliza js/guias-guion.js (el mismo editor de
     Ajustes), aquí solo para la lista `guion` de este hito: `leer()` para
     recoger lo escrito, `enganchar()` para subir/bajar/quitar/preguntas,
     igual que hace js/guias-paso-bloques.js con `ctx.recoger()`/`ctx.pintar()`.
     Fila 224: se abre desde el «⋮» de una tarea de la guía («Cambiar en
     la guía»), con `idResaltar` a la vista y resaltada. */
  async function cambiarGuionDelPaso(a, h, idResaltar) {
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
      if (idResaltar) {
        var fila = caja.querySelector('.guion-fila[data-id="' + idResaltar + '"]');
        if (fila) { fila.classList.add('guion-fila-resaltada'); fila.scrollIntoView({ block: 'center' }); }
      }
    }
    pintarLocal();
    var esperar = U.preguntar('Cambiar en la guía de ' + U.escapar(tipo),
      '<p class="nota">Vale para todos los asuntos de ' + U.escapar(tipo) + ', abiertos y nuevos. ' +
      'Las tareas ya marcadas en un asunto no se desmarcan.</p><div id="mesa-guion-editor"></div>', 'Guardar');
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
      if (!hecho) { U.aviso('Ese hito ya no está en la guía del tipo.', 'ambar'); return; }
    } catch (e) {
      U.fallo('No he podido guardar las tareas', e);
      return;
    }
    U.aviso('Tareas actualizadas.', 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  return { pintar: pintar, puedeAnadirALaGuia: puedeAnadirALaGuia,
           cambiarGuionDelPaso: cambiarGuionDelPaso, buscarPasoDeGuia: buscarPaso };
})();
window.HitoMesaGuion = HitoMesaGuion;
