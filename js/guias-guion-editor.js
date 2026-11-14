/* ============================================================
   guias-guion-editor.js — el editor de la lista de tareas de un hito
   (fila 109; desde la fila 464, docs/EDITOR-DE-LA-GUIA-CLARO.md, parte B,
   cada tarea en una línea que se abre al pulsarla).

   Pinta (`bloqueHTML`), lee (`leer`) y engancha (`enganchar`) la lista de
   tareas dentro de un contenedor, y se cuelga de `GuiasGuion`, que sigue
   teniendo el dato (js/guias-guion.js, que se carga antes). Qué tarea está
   abierta, y si lo está su «Más de esta tarea», se recuerda por id para que
   un repintado no las cierre: `reiniciar()` al abrir el editor y
   `abrirTarea(id)` para abrir una desde fuera («Abrir en la guía»).
   ============================================================ */
(function () {
  var GG = window.GuiasGuion;
  var ACCIONES = GG.ACCIONES, A_QUIEN = GG.A_QUIEN, VIAS = GG.VIAS;
  var recetaHTML = GG.recetaHTML, nuevoId = GG.nuevoId, normalizarReceta = GG.normalizarReceta;

  /* Fila 464 (docs/EDITOR-DE-LA-GUIA-CLARO.md, parte B): cada tarea de un hito
     ocupa una línea (texto, lo que hace en gris y «▸»); al pulsarla se abre ahí
     mismo, de una en una. Qué tarea está abierta, y si lo está su «Más de esta
     tarea», se recuerda por id para que un repintado no las cierre. */
  var abiertas = {};
  var masAbiertas = {};
  var enfocar = null;

  function reiniciar() { abiertas = {}; masAbiertas = {}; enfocar = null; }
  /* Deja abierta la tarea `id` (y cerradas las demás); la usa «Abrir en la guía». */
  function abrirTarea(id) { abiertas = {}; if (id) abiertas[id] = true; }

  function textoDe(lista, valor) {
    var x = lista.filter(function (e) { return e.valor === valor; })[0];
    return x ? x.texto : '';
  }

  /* Lo que hace la tarea, en pocas palabras, para su línea. */
  function resumenDe(g) {
    if (g.pregunta) {
      var n = (g.opciones || []).length;
      return 'Pregunta · ' + n + (n === 1 ? ' respuesta' : ' respuestas');
    }
    var r = g.receta || {};
    /* Fila 659: el nombre de lo que se hace (sin el sitio) y, aparte, dónde. */
    var texto = textoDe(ACCIONES, g.accion || '') || 'Otra cosa';
    if (g.accion === 'firmar' && GG.firmasNecesarias(g) > 1) texto += ' · ' + GG.firmasNecesarias(g) + ' firmas';
    if (g.accion === 'copiar' && r.carpeta) texto += ' · ' + r.carpeta;   /* fila 552 */
    if (g.accion === 'pedir' && r.campos && r.campos.length) texto += ' · ' + r.campos.length + (r.campos.length === 1 ? ' campo' : ' campos');   /* fila 530 */
    var donde = window.Sitios ? Sitios.textoDe(Sitios.datos(), Sitios.dondeDe(g)) : '';
    return texto + (donde ? ' · ' + donde : '');
  }

  function filaHTML(g, dentro) {
    var n = g.normativa || {};
    var pregunta = !dentro && !!g.pregunta;
    var abierta = !dentro && !!abiertas[g.id];
    var masAbierto = !dentro && !!masAbiertas[g.id];
    var normaHTML = pregunta ? '' :
      '<div class="guion-fila-linea guion-norma">' +
        '<input class="campo guion-cita" value="' + U.escapar(n.cita || '') + '" placeholder="Normativa: la cita (opcional)">' +
        '<input class="campo guion-url" value="' + U.escapar(n.url || '') + '" placeholder="Enlace al BOE o al BOJA (opcional)">' +
      '</div>';
    var reunirHTML = pregunta ? '' :
      '<div class="guion-fila-linea guion-reunir-fila' + (g.reunir ? ' con-reunir' : '') + '">' +
        '<label class="interruptor"><input type="checkbox" class="guion-reunir"' + (g.reunir ? ' checked' : '') +
          '><span>Hay que reunirlo</span></label>' +
        '<select class="campo guion-reunir-clase">' +
          '<option value="documento"' + (g.reunir !== 'dato' ? ' selected' : '') + '>📎 Un documento</option>' +
          '<option value="dato"' + (g.reunir === 'dato' ? ' selected' : '') + '>✎ Un dato</option>' +
        '</select>' +
        '<label class="interruptor guion-obligatorio-etiqueta"><input type="checkbox" class="guion-obligatorio"' + (g.obligatorio ? ' checked' : '') +
          '><span>Obligatorio</span></label>' +
      '</div>';
    var explicacionHTML = '<input class="campo guion-explicacion" value="' + U.escapar(g.explicacion || '') + '" placeholder="Explicación corta (opcional)">';
    var preguntaFilaHTML = dentro ? '' : '<label class="interruptor guion-pregunta-fila"><input type="checkbox" class="guion-es-pregunta"' +
      (pregunta ? ' checked' : '') + '><span>Esta tarea es una pregunta: lo que hay que hacer depende de la respuesta</span></label>';
    /* Las líneas de dentro de una respuesta se quedan como estaban; las demás, con línea, apertura y «Más de esta tarea». */
    var cabeza = dentro ? '' :
      '<button type="button" class="guion-resumen" aria-expanded="' + (abierta ? 'true' : 'false') + '">' +
        '<span class="guion-resumen-texto">' + U.escapar(g.texto || '(tarea sin texto)') + '</span>' +
        '<span class="guion-resumen-que suave">' + U.escapar(resumenDe(g)) + '</span>' +
        '<span class="solo-si-etiqueta guion-resumen-si"' + (window.GuiasCuando && GuiasCuando.etiqueta(g.soloSi) ? '' : ' hidden') + '>' +
          U.escapar(window.GuiasCuando ? GuiasCuando.etiqueta(g.soloSi) : '') + '</span>' +   /* fila 576 */
        '<span class="guion-resumen-flecha"></span></button>';
    var lineaTexto = dentro
      ? '<input class="campo guion-texto" value="' + U.escapar(g.texto || '') + '" placeholder="Texto de la tarea">'
      : '<label class="dato guion-dato-texto"><span class="etiqueta">Texto de la tarea</span>' +
        '<input class="campo guion-texto" value="' + U.escapar(g.texto || '') + '" placeholder="' +
          (pregunta ? 'La pregunta (¿Viene con toda la documentación?)' : 'Texto de la tarea') + '"></label>';
    var mandos = '<span class="requisito-mandos">' +
      (dentro ? '' : '<button type="button" class="boton guion-subir" data-ayuda-clave="subir">↑</button>' +
        '<button type="button" class="boton guion-bajar" data-ayuda-clave="bajar">↓</button>') +
      '<button type="button" class="boton boton-peligro guion-quitar" data-ayuda-clave="quitar">' + (dentro ? '✕' : 'Quitar') + '</button>' +
    '</span>';
    var queSeHace = (pregunta) ? '' :
      (dentro
        ? '' :
        '<div class="guion-fila-linea guion-linea-accion"><label class="dato"><span class="etiqueta">Qué se hace</span>' + accionSelectHTML(g) + '</label></div>' +
        (window.DondeCampo ? DondeCampo.html(g) : ''));   /* fila 659: «Dónde se hace», «Qué documento» y «A quién» */
    /* Fila 531: una tarea de la lista común lo dice y se cambia con «Cambiar la tarea» (js/comunes-guia.js); cambiar aquí su texto o su plantilla la suelta de la lista. */
    var comunHTML = (!dentro && !pregunta && g.comun)
      ? '<div class="guion-fila-linea guion-comun"><span class="suave pequeno">Tarea de la lista común. Si cambias aquí su texto o su plantilla, deja de serlo.</span>' +
        '<button type="button" class="boton boton-chico comunes-cambiar-tarea" data-comun="' + U.escapar(g.comun) + '">Cambiar la tarea</button></div>' : '';
    /* Fila 576: «Cuándo se hace» (js/guias-cuando.js), en las tareas que no son pregunta. */
    var cuandoHTML = (!dentro && !pregunta && window.GuiasCuando) ? GuiasCuando.html(g.soloSi, 'guion-cuando') : '';
    var opcionesHTML2 = pregunta ? '<div class="guion-opciones">' + (g.opciones || []).map(function (o) {
      return '<div class="guion-opcion" data-id="' + U.escapar(o.id) + '">' +
        '<div class="guion-fila-linea guion-opcion-cabecera"><input class="campo guion-opcion-texto" value="' +
          U.escapar(o.texto || '') + '" placeholder="Respuesta (Sí, No…)">' +
          '<button type="button" class="boton boton-peligro guion-opcion-quitar" data-ayuda-clave="quitar-respuesta">✕</button></div>' +
        '<div class="guion-opcion-lineas">' + (o.lineas || []).map(function (x) { return filaHTML(x, true); }).join('') + '</div>' +
        '<button type="button" class="enlace guion-linea-anadir">+ Añadir línea</button>' +
      '</div>';
    }).join('') + '<button type="button" class="enlace guion-opcion-anadir">+ Añadir respuesta</button></div>' : '';

    if (dentro) {
      return '<div class="guion-fila guion-subfila" data-id="' + U.escapar(g.id) + '">' +
        '<div class="guion-fila-linea">' + lineaTexto +
          '<select class="campo guion-accion">' + ACCIONES.map(function (a) {
            return '<option value="' + a.valor + '"' + (a.valor === (g.accion || '') ? ' selected' : '') + '>' + U.escapar(a.texto) + '</option>';
          }).join('') + '</select>' + mandos + '</div>' +
        (window.DondeCampo ? DondeCampo.html(g) : '') +   /* fila 659 */
        recetaHTML(g, true) + explicacionHTML + normaHTML + reunirHTML + '</div>';
    }
    return '<div class="guion-fila' + (pregunta ? ' guion-fila-pregunta' : '') + (abierta ? ' guion-abierta' : '') +
        (masAbierto ? ' guion-mas-abierto' : '') + '" data-id="' + U.escapar(g.id) + '"' +
        (!dentro && !pregunta && g.comun ? ' data-comun="' + U.escapar(g.comun) + '"' : '') + '>' +
      cabeza +
      '<div class="guion-fila-linea guion-linea-texto">' + lineaTexto + mandos + '</div>' +
      queSeHace + cuandoHTML + comunHTML +
      (pregunta ? '' : recetaHTML(Object.assign({ editorGuia: true }, g), false)) +   /* fila 530: «Pedir datos» se edita aquí */
      opcionesHTML2 +
      '<button type="button" class="enlace guion-mas-cab" aria-expanded="' + (masAbierto ? 'true' : 'false') + '"><span class="guion-mas-flecha"></span> Más de esta tarea</button>' +
      '<div class="guion-mas">' + explicacionHTML + normaHTML + reunirHTML + preguntaFilaHTML + '</div>' +
    '</div>';
  }

  function accionSelectHTML(g) {
    return '<select class="campo guion-accion" data-previa="' + U.escapar(g.accion || '') + '">' + ACCIONES.map(function (a) {
      return '<option value="' + a.valor + '"' + (a.valor === (g.accion || '') ? ' selected' : '') + '>' + U.escapar(a.texto) + '</option>';
    }).join('') + '</select>';
  }

  function bloqueHTML(guion) {
    var lista = guion || [];
    return '<details class="paso-guion">' +
      '<summary>Tareas de este hito' + (lista.length ? ' (' + lista.length + ')' : '') + '</summary>' +
      '<p class="nota">Lo que hay que hacer dentro del hito. Las tareas con acción se marcan solas cuando ' +
      'la aplicación la ve desde el hito; los demás, a mano.</p>' +
      '<div class="guion-lista">' + lista.map(function (g) { return filaHTML(g, false); }).join('') + '</div>' +
      '<button type="button" class="boton boton-ancho guion-anadir">+ Añadir una tarea</button>' +
      (window.ComunesGuia ? '<button type="button" class="boton boton-ancho comunes-anadir-tarea-guia">+ Añadir una tarea de la lista</button>' : '') +   /* fila 531 */
      '</details>';
  }

  /* Lee las filas tal cual (sin descartar las vacías: el índice tiene que
     casar con el de la lista para subir/bajar/quitar). */
  function leerFila(f, dentro) {
    function q(sel) { return f.querySelector(':scope > ' + sel); }
    /* Fila 464: en una tarea, explicación, normativa, «Hay que reunirlo» y la casilla de pregunta están en «Más de esta tarea». */
    var mas = f.querySelector(':scope > .guion-mas') || f;
    function m(sel) { return mas.querySelector(':scope > ' + sel); }
    var marca = m('.guion-pregunta-fila > .guion-es-pregunta');
    var base = { id: f.dataset.id || nuevoId(), texto: q('.guion-fila-linea .guion-texto').value.trim(),
                 explicacion: m('.guion-explicacion').value.trim() };
    if (!dentro && marca && marca.checked) {
      base.pregunta = true;
      base.opciones = Array.prototype.map.call(f.querySelectorAll(':scope > .guion-opciones > .guion-opcion'), function (o) {
        return { id: o.dataset.id || nuevoId(),
                 texto: o.querySelector(':scope > .guion-opcion-cabecera > .guion-opcion-texto').value.trim(),
                 lineas: Array.prototype.map.call(o.querySelectorAll(':scope > .guion-opcion-lineas > .guion-fila'),
                   function (x) { return leerFila(x, true); }) };
      });
      return base;
    }
    var sel = q('.guion-fila-linea .guion-accion');
    var cita = m('.guion-norma > .guion-cita');
    var cuando = (!dentro && window.GuiasCuando) ? GuiasCuando.leer(f, ':scope > .cuando-bloque') : null;   /* fila 576 */
    if (cuando) base.soloSi = cuando;
    base.accion = sel ? sel.value : '';
    var receta = q('.guion-receta');
    if (receta) {
      var leida = {};
      [['a', '.guion-receta-a'], ['via', '.guion-receta-via'], ['plantilla', '.guion-receta-plantilla'], ['sentido', '.guion-receta-sentido'], ['firmas', '.guion-receta-firmas']]
        .forEach(function (x) { var c = receta.querySelector(x[1]); if (c) leida[x[0]] = c.value; });
      if (receta.dataset.a && leida.a === undefined) leida.a = receta.dataset.a;   /* fila 555 */
      if (receta.dataset.via && leida.via === undefined) leida.via = receta.dataset.via;   /* fila 659: la vía de antes se conserva, aunque ya no se elige */
      if (receta.classList.contains('guion-receta-copiar') && window.TareaCopiarEditor) Object.assign(leida, TareaCopiarEditor.leerGuia(receta));   /* fila 552 */
      if (receta.dataset.campos) { try { leida.campos = JSON.parse(receta.dataset.campos); } catch (e) { /* sin campos */ } }   /* fila 530 */
      var limpia = normalizarReceta(base.accion, leida);
      if (limpia) base.receta = limpia;
    }
    var dondeBloque = q('.donde-campo');   /* fila 659 */
    if (dondeBloque && window.DondeCampo) Sitios.aplicarDatos(base, base.accion, DondeCampo.leer(dondeBloque));
    /* Fila 531: sigue siendo de la lista común mientras no se cambie su texto, lo que hace ni su plantilla. */
    if (f.dataset.comun) { base.comun = f.dataset.comun; if (window.ComunesGuia && !ComunesGuia.sigueIgual(base)) delete base.comun; }
    base.normativa = (cita && cita.value.trim())
      ? { cita: cita.value.trim(), bloque: '', clave: '', url: m('.guion-norma > .guion-url').value.trim() } : null;
    var reunir = m('.guion-reunir-fila .guion-reunir');
    if (reunir && reunir.checked) {
      base.reunir = m('.guion-reunir-fila > .guion-reunir-clase').value === 'dato' ? 'dato' : 'documento';
      base.obligatorio = !!m('.guion-reunir-fila .guion-obligatorio').checked;
    }
    return base;
  }

  function leer(raiz) {
    var filas = raiz.querySelectorAll(':scope > .paso-guion > .guion-lista > .guion-fila');
    return Array.prototype.map.call(filas, function (f) { return leerFila(f, false); });
  }

  function lineaNueva() { return { id: nuevoId(), texto: '', explicacion: '', accion: '', normativa: null }; }

  function enganchar(raiz, alCambiar) {
    var det = raiz.querySelector(':scope > .paso-guion');
    if (!det) return;
    var anadir = det.querySelector(':scope > .guion-anadir');
    if (anadir) anadir.onclick = function () {
      alCambiar(function (lista) {
        var nueva = { id: nuevoId(), texto: '', explicacion: '', accion: '', normativa: null };
        /* Fila 464, B5: la tarea nueva sale abierta (las demás, cerradas) y con el cursor en su texto. */
        lista.forEach(function (x) { delete abiertas[x.id]; });
        abiertas[nueva.id] = true;
        enfocar = nueva.id;
        lista.push(nueva);
      });
    };
    Array.prototype.forEach.call(det.querySelectorAll(':scope > .guion-lista > .guion-fila'), function (fila, idx) {
      function boton(sel) { return fila.querySelector(':scope > .guion-fila-linea ' + sel); }
      boton('.guion-subir').onclick = function () {
        alCambiar(function (l) { if (idx > 0) { var t = l[idx - 1]; l[idx - 1] = l[idx]; l[idx] = t; } });
      };
      boton('.guion-bajar').onclick = function () {
        alCambiar(function (l) { if (idx < l.length - 1) { var t = l[idx + 1]; l[idx + 1] = l[idx]; l[idx] = t; } });
      };
      boton('.guion-quitar').onclick = function () {
        alCambiar(function (l) { delete abiertas[l[idx].id]; l.splice(idx, 1); });
      };
      /* Fila 464, B1/B2: pulsar la línea abre la tarea (y cierra las demás de la lista); «Más de esta tarea» se abre y se cierra solo. */
      var resumen = fila.querySelector(':scope > .guion-resumen');
      if (resumen) resumen.onclick = function () {
        var abrir = !fila.classList.contains('guion-abierta');
        Array.prototype.forEach.call(det.querySelectorAll(':scope > .guion-lista > .guion-fila'), function (o) {
          o.classList.remove('guion-abierta');
          var r = o.querySelector(':scope > .guion-resumen');
          if (r) r.setAttribute('aria-expanded', 'false');
          delete abiertas[o.dataset.id];
        });
        if (abrir) {
          fila.classList.add('guion-abierta');
          resumen.setAttribute('aria-expanded', 'true');
          abiertas[fila.dataset.id] = true;
        }
      };
      var masCab = fila.querySelector(':scope > .guion-mas-cab');
      if (masCab) masCab.onclick = function () {
        var ahora = !fila.classList.contains('guion-mas-abierto');
        fila.classList.toggle('guion-mas-abierto', ahora);
        masCab.setAttribute('aria-expanded', ahora ? 'true' : 'false');
        if (ahora) masAbiertas[fila.dataset.id] = true; else delete masAbiertas[fila.dataset.id];
      };
      /* La línea sigue lo que se escribe y se cambia (texto y lo que hace). */
      function alisarLinea() {
        var leida = leerFila(fila, false);
        var t = resumen && resumen.querySelector('.guion-resumen-texto');
        var q = resumen && resumen.querySelector('.guion-resumen-que');
        if (t) t.textContent = leida.texto || '(tarea sin texto)';
        if (q) q.textContent = resumenDe(leida);
        var si = resumen && resumen.querySelector('.guion-resumen-si');   /* fila 576 */
        if (si && window.GuiasCuando) { si.textContent = GuiasCuando.etiqueta(leida.soloSi); si.hidden = !si.textContent; }
      }
      if (window.GuiasCuando) GuiasCuando.enganchar(fila.querySelector(':scope > .cuando-bloque'), alisarLinea);
      fila.addEventListener('input', alisarLinea);
      fila.addEventListener('change', alisarLinea);
      /* Fila 464, B4: «Obligatorio» y «Un documento / Un dato» solo salen con «Hay que reunirlo» marcado; lo guardado no se borra. */
      var reunirMarca = fila.querySelector(':scope > .guion-mas > .guion-reunir-fila .guion-reunir');
      if (reunirMarca) reunirMarca.addEventListener('change', function () {
        reunirMarca.closest('.guion-reunir-fila').classList.toggle('con-reunir', reunirMarca.checked);
      });
      /* Fila 530: los campos de una tarea «Pedir datos»: quitar y «+ Añadir campo» (la ventana de elegir). */
      Array.prototype.forEach.call(fila.querySelectorAll(':scope > .guion-receta-pedir .guion-pedir-quitar'), function (q) {
        q.onclick = function () { alCambiar(function (l) { l[idx].receta.campos.splice(+q.dataset.i, 1); }); };
      });
      var anadirCampo = fila.querySelector(':scope > .guion-receta-pedir .guion-pedir-anadir');
      if (anadirCampo) anadirCampo.onclick = function () {
        CamposElegir.abrir({ tipo: '', soloGuardables: true, alElegir: async function (campo) {
          try {
            var entrada = await DatosDelAsunto.entradaDeCampoDeLista(campo, null);
            alCambiar(function (l) {
              var r = l[idx].receta = l[idx].receta || {};
              r.campos = GG.normalizarCampos((r.campos || []).concat([entrada]));
            });
          } catch (e) { U.fallo('No he podido añadir el campo', e); }
        } });
      };
      if (window.TareaCopiarEditor) TareaCopiarEditor.guia(fila, alCambiar);   /* fila 552: «Elegir carpeta» e «Insertar campo» */
      /* Fila 164: al cambiar la acción, sale (o se va) su receta. */
      var accionSel = fila.querySelector(':scope > .guion-fila-linea .guion-accion');
      if (accionSel) accionSel.onchange = function () {
        var previa = accionSel.dataset.previa || '';
        alCambiar(function (l) {
          /* Fila 659: el sitio pasa al que propone la acción nueva (si no se había tocado) y salen o se van «Qué documento» y «A quién». */
          var x = l[idx];
          if (!x) return;
          var d = Sitios.datos(), deAntes = Sitios.propuesto(d, previa);
          var donde = x.donde;
          if (!donde || (deAntes && Sitios.igualDonde(donde, deAntes))) donde = Sitios.propuesto(d, x.accion) || null;
          Sitios.aplicarDatos(x, x.accion, { donde: donde, tipoDocumento: x.tipoDocumento, aQuien: x.aQuien });
        });
      };
      if (window.DondeCampo) DondeCampo.enganchar(fila.querySelector(':scope > .donde-campo'), alisarLinea);   /* fila 659 */
      /* Fila 116: la casilla «Es una pregunta» y sus respuestas. */
      var marca = fila.querySelector(':scope > .guion-mas > .guion-pregunta-fila > .guion-es-pregunta');
      if (marca) marca.onchange = function () {
        alCambiar(function (l) {
          var g = l[idx];
          if (!g) return;
          if (marca.checked) {
            g.pregunta = true;
            if (!g.opciones || !g.opciones.length) {
              g.opciones = [{ id: nuevoId(), texto: 'Sí', lineas: [] }, { id: nuevoId(), texto: 'No', lineas: [lineaNueva()] }];
            }
          } else { delete g.pregunta; delete g.opciones; }
        });
      };
      var anadirOpcion = fila.querySelector(':scope > .guion-opciones > .guion-opcion-anadir');
      if (anadirOpcion) anadirOpcion.onclick = function () {
        alCambiar(function (l) { l[idx].opciones.push({ id: nuevoId(), texto: '', lineas: [lineaNueva()] }); });
      };
      Array.prototype.forEach.call(fila.querySelectorAll(':scope > .guion-opciones > .guion-opcion'), function (op, j) {
        op.querySelector(':scope > .guion-opcion-cabecera > .guion-opcion-quitar').onclick = function () {
          alCambiar(function (l) { l[idx].opciones.splice(j, 1); });
        };
        op.querySelector(':scope > .guion-linea-anadir').onclick = function () {
          alCambiar(function (l) { l[idx].opciones[j].lineas.push(lineaNueva()); });
        };
        Array.prototype.forEach.call(op.querySelectorAll(':scope > .guion-opcion-lineas > .guion-fila'), function (sub, k) {
          sub.querySelector(':scope > .guion-fila-linea .guion-quitar').onclick = function () {
            alCambiar(function (l) { l[idx].opciones[j].lineas.splice(k, 1); });
          };
        });
      });
    });
    /* El cursor, en el texto de la tarea recién añadida (cuando ya está en pantalla). */
    if (enfocar) {
      var nuevaFila = det.querySelector(':scope > .guion-lista > .guion-fila[data-id="' + enfocar + '"]');
      if (nuevaFila) {
        var id = enfocar;
        enfocar = null;
        setTimeout(function () {
          var t = document.querySelector('.guion-fila[data-id="' + id + '"] .guion-linea-texto .guion-texto');
          if (t) t.focus();
        }, 0);
      }
    }
  }

  Object.assign(GG, { bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar,
    reiniciar: reiniciar, abrirTarea: abrirTarea, resumenDe: resumenDe });
})();
