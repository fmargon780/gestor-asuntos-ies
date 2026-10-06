/* ============================================================
   hitos-guion.js — el guion de un hito (24-sep-2026, fila 109,
   docs/EL-HITO-A-PANTALLA-COMPLETA.md, sección 3).

   El guion es la lista de lo que hay que hacer dentro de un hito. Vive
   en su paso de la guía (`guion: [{ id, texto, explicacion, accion,
   normativa }]`), no en hitos.json: el hito lo lee por `origenGuia`,
   igual que la comunicación, así que un guion corregido vale también
   para los asuntos vivos. En el hito solo se guarda el estado:

     guionHecho:  { <id>: { hecho, noaplica, quien, cuando } }
     guionPropio: [{ id, texto, enLugarDe? }]   (lo añadido solo a este asunto;
                   `enLugarDe` si sustituye, en su mismo sitio, a una tarea de
                   la guía cambiada con «Cambiar aquí»)
     guionOcultos: [id, id...]   (tareas de la guía que no se ven en este
                   asunto: la de «Cambiar aquí» —con su sustituta en
                   guionPropio— y la de «Borrar» —sin sustituta—)
     guionElegido: { <idPregunta>: <idOpcion> }   (fila 116: la respuesta
                   a cada pregunta del guion, docs/PREGUNTAS-EN-EL-GUION.md)

   Un paso de guion que desaparece de la guía se deja de ver; su estado
   se queda guardado sin estorbar.

   Se engancha a window.Hitos, como js/hitos-requisitos.js:
     Hitos.guionDe(a, hito)              -> [{ id, texto, explicacion, accion, normativa, propio, hecho, noaplica, quien, cuando }]
     Hitos.cuentaGuion(lista)            -> { hechos, total }
     Hitos.marcarGuion(clave, idHito, idPaso, { hecho?, noaplica? })
     Hitos.marcarGuionPorAccion(a, idHito, accion)  (el primer paso sin marcar con esa acción)
     Hitos.anadirGuionPropio(clave, idHito, texto)
     Hitos.elegirEnGuion(clave, idHito, idPregunta, idOpcion)   (fila 116)

   Fila 224 (docs/TAREAS-DEL-HITO-SENCILLAS.md): el «⋮» de cada tarea.
     Hitos.cambiarGuionAqui(clave, idHito, original, nuevoTexto)   («Cambiar aquí»
                   de una tarea de la guía: la esconde con guionOcultos y pone
                   una propia en su mismo sitio, con su marca de hecha)
     Hitos.cambiarGuionPropioTexto(clave, idHito, idPropio, nuevoTexto)  («Cambiar»
                   de una tarea «solo aquí», sea o no una sustituta)
     Hitos.borrarGuionPropio(clave, idHito, idPropio)   («Borrar» de una tarea
                   «solo aquí»: desaparece de este asunto)
     Hitos.ocultarGuionDeGuia(clave, idHito, idOriginal)   («Borrar» de una
                   tarea de la guía: se esconde solo en este asunto, sin sustituta)
     Hitos.pasarGuionPropioAGuia(clave, idHito, idPropio, idNuevo)   («Pasar a
                   la guía»: quita la propia y traslada su marca de hecha al id
                   nuevo que ya se ha añadido a la guía)

   Fila 138 (docs/UNA-SOLA-LISTA-EN-EL-HITO.md): una línea puede ser algo
   que hay que reunir (`reunir`, `obligatorio`; en el estado, `valor` o
   `documento`). «Lo que hay que reunir» ya no es una lista aparte:
     Hitos.faltanReunir(a, hito, soloObligatorias)
     Hitos.textoLoQueFaltaGuion(a, hito)        («Pedir lo que falta»)
     Hitos.escribirValorGuion(clave, idHito, idLinea, valor)
     Hitos.marcarReunirPorDocumento(a|clave, idHito, nombreDocumento)
     Hitos.desmarcarReunirPorDocumento(a|clave, idHito, nombreDocumento)

   Con preguntas (fila 116), `guionDe` devuelve las líneas tal como se
   ven: las normales, la pregunta (hecha si está respondida) y, detrás,
   las de la respuesta elegida. Aparte, en `.plegadas`, las líneas ya
   marcadas de una respuesta que se cambió.

   Se carga después de js/hitos-requisitos.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  var ACCIONES = ['generar', 'registrar', 'comunicar', 'anadir'];

  function tipoDe(a) {
    return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || '';
  }

  /* El paso de la guía de este hito, a cualquier profundidad. */
  function buscarPaso(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      var p = pasos[i];
      if (p.id === id) return p;
      for (var j = 0; j < (p.opciones || []).length; j++) {
        var enc = buscarPaso((p.opciones[j] && p.opciones[j].pasos) || [], id);
        if (enc) return enc;
      }
    }
    return null;
  }

  function pasoDe(a, hito) {
    if (!hito || !hito.origenGuia || !window.GuiasDelCentro) return null;
    return buscarPaso(GuiasDelCentro.pasosDe(tipoDe(a)), hito.origenGuia);
  }

  /* Puro: junta el guion del paso y el propio del asunto con el estado
     guardado en el hito. Fila 224: una tarea de la guía escondida
     (`guionOcultos`) con una sustituta en `guionPropio` (`enLugarDe`)
     sale en su mismo sitio, con la sustituta; sin sustituta, desaparece
     (era un «Borrar» de una tarea de la guía). Las de `guionPropio`
     que no sustituyen a ninguna son las «solo aquí» de siempre: van al
     final. */
  function unir(guionDelPaso, hito) {
    var estado = (hito && hito.guionHecho) || {};
    var elegido = (hito && hito.guionElegido) || {};
    var ocultos = {};
    ((hito && hito.guionOcultos) || []).forEach(function (id) { ocultos[id] = true; });
    var propios = (hito && hito.guionPropio) || [];
    var sustitutas = {};
    propios.forEach(function (g) { if (g.enLugarDe) sustitutas[g.enLugarDe] = g; });

    function linea(g, propio, deOpcion) {
      var x = Object.assign({}, g, estado[g.id] || {});
      return { id: g.id, texto: x.texto || '', explicacion: x.explicacion || '', accion: x.accion || '',
               normativa: x.normativa || null, propio: !!propio, hecho: !!x.hecho,
               noaplica: !!x.noaplica, quien: x.quien || '', cuando: x.cuando || '',
               pregunta: false, deOpcion: deOpcion || null,
               /* Fila 138: algo que hay que reunir, con su valor o su documento. */
               reunir: (g.reunir === 'documento' || g.reunir === 'dato') ? g.reunir : '',
               obligatorio: !!g.obligatorio, valor: x.valor || '', documento: x.documento || '',
               /* Fila 164: la receta del paso (sus detalles), si la lleva. */
               receta: g.receta || null };
    }
    /* La línea de la guía en su sitio: la propia (si «Cambiar aquí» la
       sustituyó), o la de siempre; null si un «Borrar» la escondió sin
       sustituta. */
    function lineaDeGuia(g, deOpcion) {
      if (!ocultos[g.id]) return linea(g, false, deOpcion);
      var sust = sustitutas[g.id];
      return sust ? linea(Object.assign({ explicacion: '', accion: '', normativa: null }, sust), true, deOpcion) : null;
    }
    var lista = [], plegadas = [];
    (guionDelPaso || []).forEach(function (g) {
      if (!g.pregunta) { var l = lineaDeGuia(g); if (l) lista.push(l); return; }
      var opciones = g.opciones || [];
      var op = opciones.filter(function (o) { return o.id === elegido[g.id]; })[0] || null;
      lista.push({ id: g.id, texto: g.texto || '', explicacion: g.explicacion || '', accion: '', normativa: null,
                   propio: false, hecho: !!op, noaplica: false, quien: '', cuando: '', pregunta: true,
                   elegida: op ? op.id : '', opciones: opciones.map(function (o) { return { id: o.id, texto: o.texto }; }),
                   deOpcion: null });
      opciones.forEach(function (o) {
        (o.lineas || []).forEach(function (x) {
          var deOpcion = { pregunta: g.id, opcion: o.id, respuesta: o.texto || '' };
          var lx = lineaDeGuia(x, deOpcion);
          if (!lx) return;
          if (op && o.id === op.id) lista.push(lx);
          else if (lx.hecho || lx.noaplica) plegadas.push(lx);
        });
      });
    });
    propios.filter(function (g) { return !g.enLugarDe; }).forEach(function (g) {
      lista.push(linea(Object.assign({ explicacion: '', accion: '', normativa: null }, g), true));
    });
    lista.plegadas = plegadas;
    return lista;
  }

  function guionDe(a, hito) {
    if (!hito || hito.clase === 'decision') { var vacia = []; vacia.plegadas = []; return vacia; }
    var paso = pasoDe(a, hito);
    return unir((paso && paso.guion) || [], hito);
  }

  /* Fila 154: un paso «No aplica» no cuenta ni para lo hecho ni para el
     total (4 pasos, uno no aplica y uno hecho: «1 de 3»). */
  function cuentaGuion(lista) {
    var aplican = (lista || []).filter(function (g) { return !g.noaplica; });
    var hechos = aplican.filter(function (g) { return g.hecho; }).length;
    return { hechos: hechos, total: aplican.length };
  }

  async function editarHito(clave, idHito, mutador) {
    var datos = await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = Hitos.buscar(entrada.hitos, idHito);
      if (h) mutador(h);
      return d;
    });
    var entrada = datos.porAsunto[clave];
    return entrada ? Hitos.buscar(entrada.hitos, idHito) : null;
  }

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
  async function marcarGuionPorAccion(a, idHito, accion) {
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
      var paso = guionDe(a, h).filter(function (g) { return g.accion === accion && !g.hecho && !g.noaplica; })[0];
      if (!paso) return null;
      await marcarGuion(a.nombre, idHito, paso.id, { hecho: true });
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

  function anadirGuionPropio(clave, idHito, texto) {
    texto = String(texto || '').trim();
    if (!texto) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      h.guionPropio = (h.guionPropio || []).concat([{ id: U.nuevoId('gp'), texto: texto }]);
    });
  }

  /* Fila 224: «Cambiar aquí» de una tarea de la guía. `original` es la
     línea tal como la da `guionDe` (con su hecho/noaplica/valor de
     antes): la sustituta nace ya con esa marca, y el original se
     esconde. */
  function cambiarGuionAqui(clave, idHito, original, nuevoTexto) {
    var texto = String(nuevoTexto || '').trim();
    if (!texto || !original || !original.id) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      var ocultos = h.guionOcultos || [];
      if (ocultos.indexOf(original.id) === -1) ocultos = ocultos.concat([original.id]);
      h.guionOcultos = ocultos;
      var nuevoId = U.nuevoId('gp');
      h.guionPropio = (h.guionPropio || []).concat([{
        id: nuevoId, texto: texto, enLugarDe: original.id,
        explicacion: original.explicacion || '', accion: original.accion || '',
        normativa: original.normativa || null, reunir: original.reunir || '',
        obligatorio: !!original.obligatorio, receta: original.receta || null
      }]);
      h.guionHecho = h.guionHecho || {};
      if (original.hecho || original.noaplica || original.valor || original.documento) {
        h.guionHecho[nuevoId] = { hecho: original.hecho, noaplica: original.noaplica, quien: original.quien,
          cuando: original.cuando, valor: original.valor, documento: original.documento };
      }
      delete h.guionHecho[original.id];
    });
  }

  /* «Cambiar» de una tarea «solo aquí» (sustituta o no): solo el texto. */
  function cambiarGuionPropioTexto(clave, idHito, idPropio, nuevoTexto) {
    var texto = String(nuevoTexto || '').trim();
    if (!texto) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      h.guionPropio = (h.guionPropio || []).map(function (g) {
        return g.id === idPropio ? Object.assign({}, g, { texto: texto }) : g;
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
      if (estadoAntes && (estadoAntes.hecho || estadoAntes.noaplica || estadoAntes.valor || estadoAntes.documento)) {
        h.guionHecho = h.guionHecho || {};
        h.guionHecho[idNuevo] = estadoAntes;
      }
    });
  }

  /* ---------- lo que hay que reunir (fila 138, docs/UNA-SOLA-LISTA-EN-EL-HITO.md) ---------- */

  function asuntoDe(a) {
    if (typeof a !== 'string') return a;
    return ((window.App && App.E && App.E.listaAbiertos) || []).filter(function (x) { return x.nombre === a; })[0] ||
      { nombre: a, ficha: (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a]) || {} };
  }

  async function hitoDe(a, idHito) {
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[a.nombre];
    return entrada ? Hitos.buscar(entrada.hitos, idHito) : null;
  }

  /* Las líneas de reunir sin hacer (ni «no aplica»); con `soloObligatorias`,
     solo las obligatorias. */
  function faltanReunir(a, hito, soloObligatorias) {
    return guionDe(a, hito).filter(function (g) {
      return g.reunir && !g.hecho && !g.noaplica && (!soloObligatorias || g.obligatorio);
    });
  }

  /* «Pedir lo que falta»: lo que queda por reunir, en texto. */
  function textoLoQueFalta(a, hito) {
    var pendientes = faltanReunir(a, hito, false);
    if (!pendientes.length) return '';
    return 'Falta por aportar:\n' + pendientes.map(function (g) { return '- ' + g.texto; }).join('\n');
  }

  /* Un dato: se marca al escribirlo (y se desmarca si se borra). */
  function escribirValorGuion(clave, idHito, idLinea, valor) {
    var v = String(valor || '').trim();
    return editarHito(clave, idHito, function (h) {
      h.guionHecho = h.guionHecho || {};
      var e = h.guionHecho[idLinea] || {};
      e.valor = v;
      e.hecho = !!v;
      if (v) { e.noaplica = false; e.quien = quien(); e.cuando = U.ahora(); } else { delete e.quien; delete e.cuando; }
      h.guionHecho[idLinea] = e;
    });
  }

  /* Un documento añadido o asociado al hito marca la línea de documento
     que quede por reunir (si hay varias, pregunta con cuál). */
  async function marcarReunirPorDocumento(a, idHito, nombreDocumento) {
    a = asuntoDe(a);
    var h = await hitoDe(a, idHito);
    if (!h) return null;
    var pendientes = faltanReunir(a, h, false).filter(function (g) { return g.reunir === 'documento'; });
    if (!pendientes.length) return null;
    var elegida = pendientes[0];
    if (pendientes.length > 1) {
      var idCampo = 'guion-reunir-elegir-' + Date.now();
      var ok = await U.preguntar('¿Con qué se corresponde?',
        '<p class="explica">' + U.escapar(nombreDocumento) + '</p>' +
        '<select class="campo" id="' + idCampo + '"><option value="">Ninguna</option>' +
        pendientes.map(function (g) { return '<option value="' + U.escapar(g.id) + '">' + U.escapar(g.texto) + '</option>'; }).join('') +
        '</select>', 'Marcar');
      var campo = document.getElementById(idCampo);
      var id = ok && campo ? campo.value : '';
      elegida = pendientes.filter(function (g) { return g.id === id; })[0] || null;
      if (!elegida) return null;
    }
    await editarHito(a.nombre, idHito, function (x) {
      x.guionHecho = x.guionHecho || {};
      x.guionHecho[elegida.id] = { hecho: true, documento: nombreDocumento, quien: quien(), cuando: U.ahora() };
    });
    U.aviso('Marcado: ' + elegida.texto, 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
    return elegida;
  }

  /* Al quitar ese documento del hito, su línea vuelve a estar por reunir. */
  async function desmarcarReunirPorDocumento(a, idHito, nombreDocumento) {
    a = asuntoDe(a);
    var h = await hitoDe(a, idHito);
    if (!h) return;
    var l = guionDe(a, h).filter(function (g) { return g.reunir === 'documento' && g.hecho && g.documento === nombreDocumento; })[0];
    if (!l) return;
    await editarHito(a.nombre, idHito, function (x) {
      var e = (x.guionHecho || {})[l.id];
      if (e) { e.hecho = false; e.documento = ''; delete e.quien; delete e.cuando; }
    });
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  /* Fila 282: solo leer. La línea del guion que se marcó sola con ese documento (reunir === 'documento', hecha, con ese
     nombre), o null. La usa js/hitos-sacar-documento.js para avisar de que sigue marcada al quitar el documento. */
  function tareaMarcadaPorDocumento(a, hito, nombreDocumento) {
    return guionDe(asuntoDe(a), hito).filter(function (g) {
      return g.reunir === 'documento' && g.hecho && g.documento === nombreDocumento;
    })[0] || null;
  }

  Hitos.tareaMarcadaPorDocumento = tareaMarcadaPorDocumento;
  Hitos.faltanReunir = faltanReunir;
  Hitos.textoLoQueFaltaGuion = textoLoQueFalta;
  Hitos.escribirValorGuion = escribirValorGuion;
  Hitos.marcarReunirPorDocumento = marcarReunirPorDocumento;
  Hitos.desmarcarReunirPorDocumento = desmarcarReunirPorDocumento;

  Hitos.guionDe = guionDe;
  Hitos.unirGuion = unir;
  Hitos.cuentaGuion = cuentaGuion;
  Hitos.marcarGuion = marcarGuion;
  Hitos.marcarGuionPorAccion = marcarGuionPorAccion;
  Hitos.anadirGuionPropio = anadirGuionPropio;
  Hitos.cambiarGuionAqui = cambiarGuionAqui;
  Hitos.cambiarGuionPropioTexto = cambiarGuionPropioTexto;
  Hitos.borrarGuionPropio = borrarGuionPropio;
  Hitos.ocultarGuionDeGuia = ocultarGuionDeGuia;
  Hitos.pasarGuionPropioAGuia = pasarGuionPropioAGuia;
  Hitos.elegirEnGuion = elegirEnGuion;
  Hitos.pasoDeGuia = pasoDe;
  Hitos.ACCIONES_GUION = ACCIONES;
})();
