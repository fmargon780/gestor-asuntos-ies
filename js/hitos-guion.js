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

  var I = Hitos._guionInterno = Hitos._guionInterno || {};
  function quien() { return I.quien.apply(this, arguments); }

  var ACCIONES = ['generar', 'firmar', 'registrar', 'comunicar', 'anadir'];   /* fila 523: firmar */

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
    var textos = (hito && hito.guionTextos) || {};   /* fila 405: texto de una pregunta «solo aquí» */
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
      /* Fila 405: una pregunta escondida en este asunto se va con las líneas
         de todas sus respuestas (lo ya marcado queda guardado, sin verse). */
      if (ocultos[g.id]) return;
      var opciones = g.opciones || [];
      var op = opciones.filter(function (o) { return o.id === elegido[g.id]; })[0] || null;
      lista.push({ id: g.id, texto: textos[g.id] || g.texto || '', explicacion: g.explicacion || '', accion: '', normativa: null,
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


  I.ACCIONES = ACCIONES;
  I.pasoDe = pasoDe;
  I.unir = unir;
  I.guionDe = guionDe;
  I.cuentaGuion = cuentaGuion;
  I.editarHito = editarHito;
})();
