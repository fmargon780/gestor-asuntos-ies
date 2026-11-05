/* ============================================================
   hitos-guion-marcar.js — marcar, elegir y editar las tareas del
   guion de un hito (fila 535: trozo de js/hitos-guion.js, que sigue
   siendo el que lo explica; mismas funciones, solo cambian de fichero).
   Se carga después de js/hitos-guion.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  var I = Hitos._guionInterno = Hitos._guionInterno || {};
  var ACCIONES = I.ACCIONES;
  function guionDe() { return I.guionDe.apply(this, arguments); }
  function editarHito() { return I.editarHito.apply(this, arguments); }

  function quien() { return (window.App && App.E && App.E.usuario) || ''; }

  /* `cambio`: { hecho: true/false } o { noaplica: true/false }. Marcar uno
     quita el otro. Desmarcar deja el paso como estaba al principio. */
  function marcarGuion(clave, idHito, idPaso, cambio) {
    return editarHito(clave, idHito, function (h) {
      h.guionHecho = h.guionHecho || {};
      var e = h.guionHecho[idPaso] || {};
      if ('hecho' in cambio) { e.hecho = !!cambio.hecho; if (e.hecho) e.noaplica = false; }
      if ('noaplica' in cambio) { e.noaplica = !!cambio.noaplica; if (e.noaplica) e.hecho = false; }
      if (e.hecho || e.noaplica) { e.quien = quien(); e.cuando = U.ahora(); }
      else { delete e.quien; delete e.cuando; }
      h.guionHecho[idPaso] = e;
    });
  }

  /* Marcar solo (decisión 2): cuando pasa la acción desde ese hito, el
     primer paso del guion sin marcar con esa `accion`. No crítico: si
     falla, la acción ya está hecha (ámbar). Devuelve el paso marcado, o
     null si no había ninguno. */
  /* Fila 522: `documento`, si se da, es el documento con el que ha pasado la acción: la tarea de registrar (o de firmar)
     que se marca es la de ese documento (TareasConDocumento.elegirPaso). */
  async function marcarGuionPorAccion(a, idHito, accion, documento) {
    /* `a` puede ser el asunto o solo su clave (el nombre de la carpeta). */
    if (typeof a === 'string') {
      var clave = a;
      a = ((window.App && App.E && App.E.listaAbiertos) || []).filter(function (x) { return x.nombre === clave; })[0] ||
        { nombre: clave, ficha: (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[clave]) || {} };
    }
    if (!a || !idHito || ACCIONES.indexOf(accion) === -1) return null;
    try {
      var datos = await Hitos.leer();
      var entrada = datos.porAsunto[a.nombre];
      var h = entrada && Hitos.buscar(entrada.hitos, idHito);
      if (!h) return null;
      var candidatos = guionDe(a, h).filter(function (g) { return g.accion === accion && !g.hecho && !g.noaplica; });
      var paso = window.TareasConDocumento ? TareasConDocumento.elegirPaso(h, candidatos, accion, documento) : candidatos[0];
      if (!paso) return null;
      await marcarGuion(a.nombre, idHito, paso.id, { hecho: true });
      if (window.TareasConDocumento) await TareasConDocumento.alMarcar(a, h, paso, documento);
      if (window.HitosPanel) HitosPanel.programarRepintado();
      return paso;
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('Hecho, pero no he podido marcar el paso del guion', e);
      return null;
    }
  }

  /* Fila 116: la respuesta a una pregunta del guion. Cambiarla no borra lo
     marcado en la otra respuesta: se queda plegado (`guionDe().plegadas`). */
  function elegirEnGuion(clave, idHito, idPregunta, idOpcion) {
    return editarHito(clave, idHito, function (h) {
      h.guionElegido = Object.assign({}, h.guionElegido || {});
      if (idOpcion) h.guionElegido[idPregunta] = idOpcion; else delete h.guionElegido[idPregunta];
    });
  }

  /* Fila 522: «Qué se hace» de una tarea «solo aquí», limpio: { accion, receta } o null si no se ha dicho nada. */
  function extrasDeTarea(extras) {
    if (!extras || typeof extras !== 'object' || !('accion' in extras)) return null;
    var accion = ACCIONES.indexOf(extras.accion) !== -1 ? extras.accion : '';
    return { accion: accion, receta: window.GuiasGuion ? GuiasGuion.normalizarReceta(accion, extras.receta) : null };
  }

  function ponerExtras(g, x) {
    var e = extrasDeTarea(x);
    if (!e) return g;
    g.accion = e.accion;
    if (e.receta) g.receta = e.receta; else delete g.receta;
    return g;
  }

  /* `extras` (fila 522): { accion, receta } de «Qué se hace». Sin elegir, la tarea sale como siempre. */
  function anadirGuionPropio(clave, idHito, texto, extras) {
    texto = String(texto || '').trim();
    if (!texto) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      var g = ponerExtras({ id: U.nuevoId('gp'), texto: texto }, extras);
      if (!g.accion) delete g.accion;
      h.guionPropio = (h.guionPropio || []).concat([g]);
    });
  }

  /* Fila 224: «Cambiar aquí» de una tarea de la guía. `original` es la
     línea tal como la da `guionDe` (con su hecho/noaplica/valor de
     antes): la sustituta nace ya con esa marca, y el original se
     esconde. */
  function cambiarGuionAqui(clave, idHito, original, nuevoTexto, extras) {
    var texto = String(nuevoTexto || '').trim();
    if (!texto || !original || !original.id) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      var ocultos = h.guionOcultos || [];
      if (ocultos.indexOf(original.id) === -1) ocultos = ocultos.concat([original.id]);
      h.guionOcultos = ocultos;
      var nuevoId = U.nuevoId('gp');
      h.guionPropio = (h.guionPropio || []).concat([ponerExtras({
        id: nuevoId, texto: texto, enLugarDe: original.id,
        explicacion: original.explicacion || '', accion: original.accion || '',
        normativa: original.normativa || null, reunir: original.reunir || '',
        obligatorio: !!original.obligatorio, receta: original.receta || null
      }, extras)]);
      if (window.TareasConDocumento) TareasConDocumento.mover(h, original.id, nuevoId);   /* fila 522: el documento sigue a la tarea */
      h.guionHecho = h.guionHecho || {};
      if (original.hecho || original.noaplica || original.valor || original.documento) {
        h.guionHecho[nuevoId] = { hecho: original.hecho, noaplica: original.noaplica, quien: original.quien,
          cuando: original.cuando, valor: original.valor, documento: original.documento };
      }
      delete h.guionHecho[original.id];
    });
  }

  /* Fila 405: «Cambiar» solo aquí de una pregunta de las tareas. Guarda un
     texto alternativo por id de pregunta (`guionTextos`) y no toca las
     respuestas ni la elegida. Con texto vacío, vuelve el de la guía. */
  function cambiarPreguntaAqui(clave, idHito, idPregunta, nuevoTexto) {
    var texto = String(nuevoTexto || '').trim();
    return editarHito(clave, idHito, function (h) {
      var textos = Object.assign({}, h.guionTextos || {});
      if (texto) textos[idPregunta] = texto; else delete textos[idPregunta];
      h.guionTextos = textos;
    });
  }

  /* «Cambiar» de una tarea «solo aquí» (sustituta o no): solo el texto. */
  function cambiarGuionPropioTexto(clave, idHito, idPropio, nuevoTexto, extras) {
    var texto = String(nuevoTexto || '').trim();
    if (!texto) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      h.guionPropio = (h.guionPropio || []).map(function (g) {
        return g.id === idPropio ? ponerExtras(Object.assign({}, g, { texto: texto }), extras) : g;
      });
    });
  }

  /* «Borrar» de una tarea «solo aquí»: desaparece de este asunto. Si era
     una sustituta, el original de la guía se queda escondido (ya no
     interesaba tal como estaba escrito). */
  function borrarGuionPropio(clave, idHito, idPropio) {
    return editarHito(clave, idHito, function (h) {
      h.guionPropio = (h.guionPropio || []).filter(function (g) { return g.id !== idPropio; });
      if (h.guionHecho) delete h.guionHecho[idPropio];
      if (window.TareasConDocumento) TareasConDocumento.mover(h, idPropio, '');   /* fila 522 */
    });
  }

  /* «Borrar» de una tarea de la guía, sin sustituta: se esconde solo en
     este asunto. */
  function ocultarGuionDeGuia(clave, idHito, idOriginal) {
    return editarHito(clave, idHito, function (h) {
      var ocultos = h.guionOcultos || [];
      if (ocultos.indexOf(idOriginal) === -1) ocultos = ocultos.concat([idOriginal]);
      h.guionOcultos = ocultos;
      if (h.guionHecho) delete h.guionHecho[idOriginal];
    });
  }

  /* «Pasar a la guía»: la línea ya se ha añadido a la guía (con `idNuevo`,
     GuiasDelCentro.cambiarPasos); aquí se quita la propia y su marca de
     hecha (si tenía) pasa al id nuevo, solo en este asunto. */
  function pasarGuionPropioAGuia(clave, idHito, idPropio, idNuevo) {
    return editarHito(clave, idHito, function (h) {
      var estadoAntes = (h.guionHecho && h.guionHecho[idPropio]) || null;
      h.guionPropio = (h.guionPropio || []).filter(function (g) { return g.id !== idPropio; });
      if (h.guionHecho) delete h.guionHecho[idPropio];
      if (window.TareasConDocumento) TareasConDocumento.mover(h, idPropio, idNuevo);   /* fila 522: el documento se queda en el asunto */
      if (estadoAntes && (estadoAntes.hecho || estadoAntes.noaplica || estadoAntes.valor || estadoAntes.documento)) {
        h.guionHecho = h.guionHecho || {};
        h.guionHecho[idNuevo] = estadoAntes;
      }
    });
  }

  /* ---------- lo que hay que reunir (fila 138, docs/UNA-SOLA-LISTA-EN-EL-HITO.md) ---------- */


  I.quien = quien;
  I.marcarGuion = marcarGuion;
  I.marcarGuionPorAccion = marcarGuionPorAccion;
  I.elegirEnGuion = elegirEnGuion;
  I.anadirGuionPropio = anadirGuionPropio;
  I.cambiarGuionAqui = cambiarGuionAqui;
  I.cambiarPreguntaAqui = cambiarPreguntaAqui;
  I.cambiarGuionPropioTexto = cambiarGuionPropioTexto;
  I.borrarGuionPropio = borrarGuionPropio;
  I.ocultarGuionDeGuia = ocultarGuionDeGuia;
  I.pasarGuionPropioAGuia = pasarGuionPropioAGuia;
})();
