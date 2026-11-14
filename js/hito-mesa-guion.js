/* ============================================================
   hito-mesa-guion.js — la columna izquierda de la mesa del hito: el
   guion, o la pregunta de un hito-pregunta (24-sep-2026, fila 109,
   docs/EL-HITO-A-PANTALLA-COMPLETA.md, sección 3).

   - "Tareas del hito", la cuenta "N de M" y una barra de progreso.
   - Cada tarea: casilla, texto en negrita, explicación en gris, su
     normativa como etiqueta "§ cita" y "No aplica". Desde la fila 154
     (docs/HITOS-ACCIONES-EN-EL-HITO.md), las acciones viven en la cabecera
     del hito (js/hito-mesa.js); desde la fila 410
     (docs/BOTON-DE-LA-ACCION-EN-LA-TAREA.md), cada tarea pendiente de
     comunicar o de generar lleva además su botón. Hecho: en
     gris, con quién y cuándo al lado; «No aplica»: tachado.
   - Fila 224 (docs/TAREAS-DEL-HITO-SENCILLAS.md): sin frases al pie. Al
     final de la lista, una sola caja «Nueva tarea… (escribe y pulsa
     Intro)». Desde la fila 235 (docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md)
     Intro abre «¿Dónde se guarda?» (js/donde-se-guarda-tareas.js): a la
     guía o solo a este asunto (`Hitos.anadirGuionPropio`). Cada tarea lleva
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

  function pasoHTML(g, abierto, siguiente, a, h, ctx) {
    var marcado = g.hecho || g.noaplica;
    var titulo = marcado ? (g.noaplica ? 'No aplica' : 'Hecho') + (g.quien ? ' por ' + g.quien : '') +
      (g.cuando ? ' el ' + String(g.cuando).slice(0, 10) : '') +
      (g.valor ? ' · ' + g.valor : '') + (g.documento ? ' · ' + g.documento : '') : '';
    var claveAccion = accionDe(g);
    var marcaReunir = g.reunir === 'documento' ? '<span class="guion-reunir-marca" data-ayuda-clave="reunir-documento">📎</span>'
      : (g.reunir === 'dato' ? '<span class="guion-reunir-marca" data-ayuda-clave="reunir-dato">✎</span>' : '');
    /* Fila 154: las acciones viven en la cabecera del hito; fila 410: y cada
       tarea pendiente de comunicar o de generar lleva su botón, delante del
       💬 y del «⋮». Una tarea hecha dice al lado, en pequeño, quién y cuándo. */
    var botonAccion = (abierto && window.HitoMesaRecetas) ? HitoMesaRecetas.botonDeTareaHTML(a, h, g, { siguiente: siguiente, guion: ctx && ctx.guion }) : '';
    var quienCuando = g.hecho && !g.noaplica && (g.quien || g.cuando)
      ? '<span class="guion-paso-quien">' + U.escapar([g.quien || '', fechaCorta(g.cuando)].filter(Boolean).join(' · ')) + '</span>' : '';
    /* Fila 224: «solo aquí» (una tarea propia, sustituya o no a una de
       la guía) y el «⋮»/💬 de cada tarea, solo con el hito abierto. */
    var etiquetaFirmar = (g.accion === 'firmar' && window.GuiasGuion)
      ? '<span class="guion-tarea-clase guion-tarea-accion">' + (GuiasGuion.firmasNecesarias(g) > 1 ? 'Poner a la firma · ' + GuiasGuion.firmasNecesarias(g) + ' firmas' : 'Poner a la firma') + '</span>'   /* fila 523 */
      /* Fila 553: cada tarea con acción lleva su etiqueta, al lado del nombre. */
      : ((g.accion && window.Comunes) ? '<span class="guion-tarea-accion" data-accion="' + U.escapar(g.accion) + '">' + U.escapar(Comunes.textoDeHace(g.accion)) + '</span>' : '');
    var etiquetaPropia = g.propio ? '<span class="guion-tarea-propia" data-ayuda-clave="solo-aqui-tarea">solo aquí</span>' : '';
    var botonesTarea = (abierto && window.HitoMesaTareaMenu) ? HitoMesaTareaMenu.botonesHTML(g, a) : '';
    var debajoTarea = (abierto && window.HitoMesaTareaMenu) ? HitoMesaTareaMenu.debajoHTML(g, a) : '';
    return '<div class="guion-paso' + (g.hecho ? ' hecho' : '') + (g.noaplica ? ' noaplica' : '') + (g.reunir ? ' guion-reunir' : '') +
        (siguiente ? ' guion-siguiente' : '') + '" data-id="' +
        U.escapar(g.id) + '"' + (titulo ? ' title="' + U.escapar(titulo) + '"' : '') + '>' +
      '<div class="guion-paso-fila"><label class="guion-paso-linea"><input type="checkbox" class="guion-casilla"' + (g.hecho ? ' checked' : '') +
        (abierto ? '' : ' disabled') + '>' + marcaReunir + '<span class="guion-paso-texto">' + U.escapar(g.texto) + '</span>' +
        (window.Plantillas && Plantillas.fueraDeUsoDeLaTarea(g) ? ' ' + '<span class="guion-fuera-de-uso" data-ayuda-clave="plantilla-fuera-de-uso">plantilla fuera de uso</span>' : '') +
        (g.reunir && g.obligatorio ? ' <strong class="guion-obligatorio">obligatorio</strong>' : '') + etiquetaFirmar +
        (window.DondeCampo && g.accion ? DondeCampo.etiquetaHTML(g) : '') +   /* fila 659: dónde se hace, junto a lo que se hace */
        etiquetaPropia +
        (window.SoloSi ? SoloSi.faltaHTML(g.falta) : '') + '</label>' +   /* fila 576 */
        quienCuando + botonAccion + botonesTarea + '</div>' +
      debajoTarea +
      /* Fila 530: los datos de su plantilla (o los campos de «Pedir datos»), para escribir lo que falte (js/datos-de-la-tarea.js). */
      (window.DatosDeLaTarea ? DatosDeLaTarea.marcoHTML(g) : '') +
      (window.TareaCopiar ? TareaCopiar.vistaHTML(g, a, h) : '') +   /* fila 552: lo copiado, o el aviso de lo pendiente */
      /* Fila 522: su documento colgado (js/tareas-con-documento-vista.js). */
      (window.TareasConDocumentoVista && ctx ? TareasConDocumentoVista.colgadoHTML(a, h, g, ctx) : '') +
      (window.Llamadas && Llamadas.debajoHTML ? Llamadas.debajoHTML(g, h) : '') +   /* fila 639: sus llamadas, plegadas */
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
  function preguntaGuionHTML(g, abierto, siguiente, a) {
    /* Fila 405: el «⋮» y el 💬 como en cualquier tarea, solo con el hito abierto. */
    var botones = (abierto && window.HitoMesaTareaMenu) ? HitoMesaTareaMenu.botonesHTML(g, a) : '';
    var debajo = (abierto && window.HitoMesaTareaMenu) ? HitoMesaTareaMenu.debajoHTML(g, a) : '';
    return '<div class="guion-paso guion-pregunta' + (g.elegida ? ' hecho' : '') + (siguiente ? ' guion-siguiente' : '') + '" data-id="' + U.escapar(g.id) + '">' +
      '<div class="guion-paso-fila"><div class="guion-paso-linea"><span class="guion-pregunta-marca">¿</span><span class="guion-paso-texto">' +
        U.escapar(g.texto) + '</span></div>' + botones + '</div>' + debajo +
      (g.explicacion ? '<div class="guion-paso-explicacion">' + U.escapar(g.explicacion) + '</div>' : '') +
      '<div class="guion-respuestas">' + (g.opciones || []).map(function (o) {
        var es = o.id === g.elegida;
        return '<button type="button" class="guion-respuesta' + (es ? ' elegida' : '') + '" data-opcion="' + U.escapar(o.id) + '"' +
          (abierto ? '' : ' disabled') + '>' + (es ? '✓ ' : '') + U.escapar(o.texto || 'Respuesta') + '</button>';
      }).join('') + '</div>' +
    '</div>';
  }

  function lineaHTML(g, abierto, siguiente, a, h, ctx) {
    if (g.pregunta) return preguntaGuionHTML(g, abierto, siguiente, a);
    var html = pasoHTML(g, abierto, siguiente, a, h, ctx);
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

  function pintar(fila, a, h, abierto, hitos) {
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
    U.conservandoLoEscrito(caja, function () { pintarGuion(caja, fila, a, h, abierto, hitos); });
  }

  /* Fila 553: si el orden de las tareas de la guía ha cambiado en este asunto, la franja con las dos salidas (js/hitos-guion-orden.js). */
  function franjaDelOrdenHTML(a, h) {
    if (!Hitos.ordenDeLaGuiaCambiado || !puedeAnadirALaGuia(a, h) || !Hitos.ordenDeLaGuiaCambiado(a, h)) return '';
    return '<div class="guion-orden-cambiado"><span>Has cambiado el orden de las tareas en este asunto.</span>' +
      '<button type="button" class="boton boton-chico boton-principal guion-orden-guia">Guardar también en la guía</button>' +
      '<button type="button" class="boton boton-chico guion-orden-aqui">Solo en este asunto</button></div>';
  }

  function engancharFranjaDelOrden(caja, a, h) {
    var guia = caja.querySelector('.guion-orden-guia'), aqui = caja.querySelector('.guion-orden-aqui');
    function repintar() { if (window.HitosPanel) HitosPanel.programarRepintado(); }
    if (guia) guia.onclick = function () {
      U.mientrasGuarda(guia, async function () {
        try {
          if (await Hitos.guardarOrdenEnLaGuia(a, h)) U.aviso('Orden guardado también en la guía de ' + tipoDe(a) + '.', 'bueno');
          else U.aviso('Ese hito ya no está en la guía del tipo.', 'ambar');
          repintar();
        } catch (e) { U.fallo('No he podido guardar el orden en la guía', e); }
      });
    };
    if (aqui) aqui.onclick = function () {
      Hitos.dejarOrdenSoloAqui(a, h.id).then(repintar).catch(function (e) { U.fallo('No he podido guardar el cambio', e); });
    };
  }

  function pintarGuion(caja, fila, a, h, abierto, hitos) {
    var guion = Hitos.guionDe(a, h);
    /* Fila 145: la siguiente tarea, la primera sin hacer y sin «No aplica»
       (con el hito ya hecho, ninguno). */
    var siguiente = h.estado === 'hecho' ? null : guion.filter(function (g) { return !g.hecho && !g.noaplica; })[0];
    var ctx = { guion: guion, hitos: hitos || [], abierto: abierto };
    /* Fila 638: sin recuadro ni cabecera «Tareas»; un hito sin tareas lo dice. Debajo, «+ Añadir tarea». */
    caja.innerHTML =
      (!guion.length ? '<p class="mesa-sin-tareas">Este hito no tiene tareas.</p>' : '') +
      guion.map(function (g) { return lineaHTML(g, abierto, g === siguiente, a, h, ctx); }).join('') + plegadasHTML(guion.plegadas) +
      (abierto ? franjaDelOrdenHTML(a, h) : '') +
      (abierto && window.HitoMesaNuevaTarea ? HitoMesaNuevaTarea.html(a, h) : '');

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
    /* Fila 405: el «⋮» y el 💬 de una pregunta (no tiene casilla ni «No aplica»). */
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-pregunta'), function (el) {
      var g = porId[el.dataset.id];
      if (g && window.HitoMesaTareaMenu) {
        HitoMesaTareaMenu.engancharFila(el, a, h, g, function () { pintar(fila, a, h, abierto, hitos); });
      }
    });
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
      /* Fila 410: el botón de la acción de la tarea. */
      var accionTarea = el.querySelector('.guion-accion-tarea');
      if (accionTarea && porId[id]) accionTarea.onclick = function () {
        HitoMesaRecetas.lanzarTarea(a, h, porId[id], fila, accionTarea);
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
        HitoMesaTareaMenu.engancharFila(el, a, h, g, function () { pintar(fila, a, h, abierto, hitos); });
      }
    });
    /* Fila 530: los datos de cada tarea de generar, comunicar o «Pedir datos». */
    if (window.DatosDeLaTarea) DatosDeLaTarea.pintar(caja, a, h, guion, siguiente, abierto, function () { pintar(fila, a, h, abierto, hitos); });
    /* Fila 522: lo colgado de cada tarea (abrir, «Ruta», «Elegir documento», «Cambiar»). */
    if (window.TareasConDocumentoVista) {
      TareasConDocumentoVista.enganchar(caja, a, h, hitos || [], abierto, function () { pintar(fila, a, h, abierto, hitos); });
    }
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
        if (window.Perfil && Perfil.esDirectivo()) return;   /* fila 287: un directivo no guarda documentos */
        var delPaso = soltar.closest('.guion-paso');
        if (ficheros && ficheros.length && window.Documentos && Documentos.abrir) Documentos.abrir(a, { hito: h, tarea: delPaso ? delPaso.dataset.id : '', ficheroSoltado: ficheros[0] });   /* fila 638: ya se sabe de qué tarea es */
      };
    }
    if (window.Llamadas && Llamadas.enganchar) Llamadas.enganchar(caja);   /* fila 639 */
    /* Fila 638: «+ Añadir tarea» y su formulario. */
    if (window.HitoMesaNuevaTarea) HitoMesaNuevaTarea.enganchar(caja, a, h, function () { pintar(fila, a, h, abierto, hitos); });
    engancharFranjaDelOrden(caja, a, h);
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

  /* Fila 150 y fila 224: «Abrir en la guía» desde el «⋮» de una tarea de la guía.
     Fila 464 (docs/EDITOR-DE-LA-GUIA-CLARO.md, B6): ya no monta una ventana
     pequeña; abre el editor completo de la guía del tipo, con el hito de la
     tarea elegido y la tarea abierta y resaltada. «Guardar» guarda la guía
     (lo mismo que en Ajustes) y deja el asunto como estaba, repintado. */
  async function cambiarGuionDelPaso(a, h, idResaltar) {
    var p = pasoDeLaGuia(a, h);
    if (!p || !window.GuiasDelCentro) return;
    var tipo = tipoDe(a);
    var guardada = await GuiasDelCentro.escribir(tipo, {
      irA: h.origenGuia, tarea: idResaltar,
      aviso: 'Vale para todos los asuntos de ' + tipo + ', abiertos y nuevos. ' +
        'Las tareas ya marcadas en un asunto no se desmarcan.'
    });
    if (guardada && window.HitosPanel) HitosPanel.programarRepintado();
  }

  return { pintar: pintar, puedeAnadirALaGuia: puedeAnadirALaGuia,
           cambiarGuionDelPaso: cambiarGuionDelPaso, buscarPasoDeGuia: buscarPaso };
})();
window.HitoMesaGuion = HitoMesaGuion;
