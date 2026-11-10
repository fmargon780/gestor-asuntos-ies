/* ============================================================
   hitos-arbol.js — buscar, lo visible, el hito en curso, el estado del
   asunto, los plazos que dependen de otro hito y de un paso de la guía a
   un hito (fila 535: trozo de js/hitos.js; mismas funciones, solo cambian
   de fichero). Se carga después de js/hitos-fichero.js y antes de
   js/hitos.js.
   ============================================================ */
(function () {

  var I = window.HitosNucleo = window.HitosNucleo || {};
  function normalizarHito() { return I.normalizarHito.apply(this, arguments); }

  /* ==========================================================
     BUSCAR, LO VISIBLE Y EL SIGUIENTE EN CURSO

     Un hito de clase "decision" corta la lista mientras no se elige
     una opción: nada de lo que viene después se ve ni se cuenta. Al
     elegir, los hitos de la rama elegida se cuentan como si vinieran
     justo debajo (sección 4 del encargo).
     ========================================================== */

  /* Fila 229: las líneas que la aplicación deja sola al marcar (hito dado por hecho o
     reabierto, tarea marcada) no cuentan como «algo apuntado» al cambiar de rama o de
     tipo: marcar un hito hecho no debe impedir descartarlo. */
  var LINEA_DE_MARCAR = /^(Dado por hecho$|Reabierto$|Tarea )/;
  function notasPropias(h) {
    return ((h && h.notas) || []).filter(function (n) { return !LINEA_DE_MARCAR.test(String((n && n.texto) || '')); });
  }

  function buscar(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) {
      var h = lista[i];
      if (h.id === id) return h;
      if (h.clase === 'decision') {
        for (var j = 0; j < h.opciones.length; j++) {
          var enc = buscar(h.opciones[j].hitos, id);
          if (enc) return enc;
        }
      }
    }
    return null;
  }

  /* Una pregunta sin responder corta la lista ENTERA, esté al nivel
     que esté (fila 95: preguntas dentro de las respuestas): si la de
     dentro de una rama no se ha respondido, tampoco se ve lo que viene
     después de la pregunta de fuera. */
  function recorrerVisibles(lista, out) {
    for (var i = 0; i < (lista || []).length; i++) {
      var h = lista[i];
      if (h.delTipoAnterior) continue;   /* fila 94: va con los huérfanos */
      if (h.cond === 'quita' && h.estado !== 'hecho') continue;   /* fila 576: «Solo si» y el campo tiene otro valor */
      out.push(h);
      if (h.clase === 'decision') {
        if (!h.elegida) return true;   /* se corta aquí: nada más se ve */
        var opt = h.opciones.filter(function (o) { return o.id === h.elegida; })[0];
        if (opt && recorrerVisibles(opt.hitos, out)) return true;
      }
    }
    return false;
  }

  function visibles(lista) {
    var out = [];
    recorrerVisibles(lista, out);
    return out;
  }

  /* Los hitos "noaplica" que se quedaron colgando al cambiar de rama
     (tenían notas o documentos, así que no se borraron). Se pintan
     plegados, al final, vengan de la rama que vengan. */
  function huerfanos(lista) {
    var out = [];
    (lista || []).forEach(function (h) {
      if (h.delTipoAnterior) { out.push(h); return; }   /* fila 94 */
      if (h.clase !== 'decision') return;
      h.opciones.forEach(function (o) {
        if (o.id !== h.elegida) out = out.concat(descartados(o.hitos));
        else out = out.concat(huerfanos(o.hitos));
      });
    });
    return out;
  }

  /* Todo lo "noaplica" de una rama no elegida, a cualquier profundidad
     (fila 95): una pregunta de dentro se enseña solo si tenía algo
     suyo apuntado; sus pasos con algo, siempre. */
  function descartados(lista) {
    var out = [];
    (lista || []).forEach(function (x) {
      if (x.clase === 'decision') {
        if (x.estado === 'noaplica' && (notasPropias(x).length || (x.documentos && x.documentos.length))) out.push(x);
        x.opciones.forEach(function (o) { out = out.concat(descartados(o.hitos)); });
      } else if (x.estado === 'noaplica') {
        out.push(x);
      }
    });
    return out;
  }

  /* Solo puede haber un hito en curso a la vez (sección 5). Si ya hay
     uno, no se toca nada. Si no, el primer "pendiente" de la lista
     visible pasa a "encurso" y se le anota "desde". Devuelve ese hito,
     o null si no había ninguno que avanzar. */
  function recomputeEnCurso(raiz) {
    var vis = visibles(raiz);
    if (vis.some(function (h) { return h.estado === 'encurso'; })) return null;
    var siguiente = vis.filter(function (h) { return h.estado === 'pendiente'; })[0];
    if (!siguiente) return null;
    siguiente.estado = 'encurso';
    siguiente.desde = U.hoyIso();
    return siguiente;
  }

  function cuenta(lista) {
    var vis = visibles(lista);
    var hechos = vis.filter(function (h) { return h.estado === 'hecho'; }).length;
    return { hechos: hechos, total: vis.length };
  }

  /* "Lo que hay que reunir" (fila 59, sección 6 del encargo): las
     casillas obligatorias de un hito que siguen sin marcar. Vacía si
     no hay ninguna, o si el hito no tiene requisitos. No cambia
     `marcar`: es js/hitos-panel-lista.js quien llama a esto ANTES de
     pasar un hito a "hecho", para avisar sin impedir nada. */
  function faltanObligatorios(hito, a) {
    /* Fila 138: con el asunto, las líneas obligatorias del guion por reunir. */
    if (a && window.Hitos && Hitos.faltanReunir) return Hitos.faltanReunir(a, hito, true);
    return ((hito && hito.requisitos) || []).filter(function (r) { return r.obligatorio && !r.hecho; });
  }

  /* ==========================================================
     EL ESTADO DEL ASUNTO (sección 8 del encargo)

     Desde la fila 129 (docs/EL-HITO-ES-EL-ESTADO.md) el estado del
     asunto ES su hito actual: «Paso N de M · título», «Listo para
     archivar» o «Sin hitos», y a quién le toca. Esta es la ÚNICA
     función que lo decide; la cuenta vive en js/hitos-a-quien.js
     (Hitos.ladoDelAsunto). Ya no se escribe nada en asuntos.json. */
  function estadoDelAsunto(hitos, ajustes, contexto) {
    if (typeof Hitos.ladoDelAsunto !== 'function') return { lado: 'administracion', texto: '', sinHitos: true };
    return Hitos.ladoDelAsunto(hitos || [], ajustes || null, contexto);
  }

  /* Tras mover un hito: la cabecera de la ficha, si está abierta, y la
     lista, solo si se ve (App.pintarAbiertos la deja pendiente si no). */
  async function aplicarEstadoDelHito(clave) {
    if (!window.App) return;
    try {
      if (typeof App.repintarAccionesFicha === 'function') App.repintarAccionesFicha(clave);
      if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
    } catch (e2) { /* solo pintar */ }
  }

  /* Las fechas límite calculadas por plazo (sección 7): cuando un hito
     pasa a "hecho", los hitos cuyo plazo cuenta "desde" él (y que
     Francisco no haya tocado a mano) recalculan su fecha, contada como
     diga su plazo (fila 131: hábiles, lectivos o naturales) con los
     festivos y los no lectivos de Ajustes › Hitos. */
  /* Fila 573: con `plazo.base === 'registro'` cuenta desde la fecha de registro del documento del hito `desde` (`fechaRegistroDe`, la
     más reciente si hay varios); si aún no la tiene, desde hoy, y se recalcula al llegar el listado (js/fecha-de-registro-plazos.js). */
  function aplicarPlazosDependientes(raiz, idHecho, ajustes, fechaRegistroDe) {
    var aj = ajustes || {};
    (function recorrer(lista) {
      (lista || []).forEach(function (h) {
        if (h.plazo && h.plazo.desde === idHecho && !h.fechaManual) {
          var base = (h.plazo.base === 'registro' && fechaRegistroDe && fechaRegistroDe(idHecho)) || U.hoyIso();
          h.fecha = Plazos.sumarPlazo(base, h.plazo.dias, h.plazo.cuenta, aj.festivos, aj.noLectivos);
        }
        if (h.clase === 'decision') h.opciones.forEach(function (o) { recorrer(o.hitos); });
      });
    })(raiz);
  }

  /* ==========================================================
     CREAR LOS HITOS DE UN ASUNTO, DESDE SU GUÍA

     El id del hito es el mismo que el del paso de la guía
     (origenGuia): así un plazo "desde" tal paso, o un pasosElegidos
     de un asunto viejo, se traduce solo, sin tener que llevar un mapa
     aparte.
     ========================================================== */

  function pasoAHito(p) {
    var esDecision = Guias.esPregunta(p);
    return normalizarHito({
      id: p.id, origenGuia: p.id, titulo: p.titulo, cuerpo: p.cuerpo,
      clase: esDecision ? 'decision' : 'paso', estado: 'pendiente',
      responsable: p.responsable || '', estadoAsunto: p.estadoAsunto || null,
      toca: p.toca || '', tocaA: p.tocaA || '',
      plazo: (p.plazo && p.plazo.dias) ? Plazos.conBase({ dias: p.plazo.dias, desde: p.plazo.desde || '', cuenta: p.plazo.cuenta }, p.plazo) : null,   /* fila 573: base */
      /* Una pregunta no lleva requisitos propios (fila 59, sección 4.1
         del encargo: el editor no se los deja poner); los de sus
         opciones llegan solos, porque cada paso de dentro se convierte
         en su propio hito, con los suyos. */
      requisitos: esDecision ? [] : (p.requisitos || []),
      /* Una pregunta tampoco lleva estos dos (fila 79, apartados 4.6 y
         4.7): igual que los requisitos, son de los pasos de arriba. */
      soloInformativo: esDecision ? false : !!p.soloInformativo,
      variosDocumentos: esDecision ? false : !!p.variosDocumentos,
      normativa: esDecision ? [] : (p.normativa || []),
      formularios: esDecision ? [] : (p.formularios || []),
      /* Fila 201: igual que los de arriba, solo de los pasos de arriba. */
      textoDocumentos: esDecision ? '' : (p.textoDocumentos || ''),
      tipoDocumento: esDecision ? '' : (p.tipoDocumento || ''),
      /* «Avisar a quien lo pide» (fila 195): igual que los dos de
         arriba, solo de los pasos de arriba, nunca de una pregunta. */
      avisarLoPide: esDecision ? false : !!p.avisarLoPide,
      avisarLoPidePlantilla: esDecision ? '' : (p.avisarLoPidePlantilla || ''),
      soloSi: p.soloSi || null,   /* fila 576 */
      opciones: esDecision ? p.opciones.map(function (o) {
        return { id: o.id, texto: o.titulo, hitos: (o.pasos || []).map(pasoAHito) };
      }) : [],
      elegida: null
    });
  }

  /* La guía del tipo; si no tiene, la guía mínima (fila 129,
     js/estado-hito.js), que se guarda como guía normal del tipo. */

  I.notasPropias = notasPropias;
  I.buscar = buscar;
  I.visibles = visibles;
  I.huerfanos = huerfanos;
  I.recomputeEnCurso = recomputeEnCurso;
  I.cuenta = cuenta;
  I.faltanObligatorios = faltanObligatorios;
  I.estadoDelAsunto = estadoDelAsunto;
  I.aplicarEstadoDelHito = aplicarEstadoDelHito;
  I.aplicarPlazosDependientes = aplicarPlazosDependientes;
  I.pasoAHito = pasoAHito;
})();
