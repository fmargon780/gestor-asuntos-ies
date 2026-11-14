/* ============================================================
   hitos-normalizar.js — las constantes del modelo de los hitos y cómo se
   normaliza lo leído de hitos.json (fila 535: trozo de js/hitos.js, que
   sigue siendo el que explica el modelo; mismas funciones, solo cambian
   de fichero). Se carga antes de js/hitos.js.
   ============================================================ */
(function () {

  var I = window.HitosNucleo = window.HitosNucleo || {};
  var FICHERO = 'hitos.json';
  var CLASES_ESTADO = ['pendiente', 'encurso', 'hecho', 'noaplica'];

  /* Los responsables de partida (sección 6); se cambian en Ajustes › Hitos. */
  var RESPONSABLES_DEFECTO = [
    { id: 'yo', nombre: 'Yo', clase: 'centro' },
    { id: 'companero', nombre: 'Mi compañero', clase: 'centro' },
    { id: 'direccion', nombre: 'Dirección', clase: 'centro' },
    { id: 'jefatura', nombre: 'Jefatura', clase: 'centro' },
    { id: 'secretaria', nombre: 'Secretaría', clase: 'centro' }
  ];

  /* Los "papeles" son fijos, no configurables: se resuelven con datos
     que la aplicación ya tiene, asunto por asunto. */
  var PAPELES = [
    { id: 'tercero', nombre: 'El tercero del asunto', clase: 'papel' },
    { id: 'tutor', nombre: 'El tutor del alumnado', clase: 'papel' },
    { id: 'profesores', nombre: 'Sus profesores', clase: 'papel' },   /* fila 615 */
    { id: 'relacionado', nombre: 'Un relacionado', clase: 'papel' }
  ];

  function nuevoId() { return U.nuevoId('h'); }

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  /* ==========================================================
     LEER Y NORMALIZAR
     ========================================================== */

  function normalizarNota(n) {
    var nota = {
      texto: String((n && n.texto) || ''),
      quien: String((n && n.quien) || ''),
      cuando: String((n && n.cuando) || '')
    };
    /* Fila 639 (js/llamadas.js): una línea de llamada lleva sus datos aparte. */
    if (n && n.llamada && typeof n.llamada === 'object') nota.llamada = JSON.parse(JSON.stringify(n.llamada));
    return nota;
  }

  /* "Lo que hay que reunir" (18-sep-2026, fila 59,
     docs/REQUISITOS-DE-HITO.md): la misma casilla de la guía
     (id/texto/clase/obligatorio), con el estado propio del hito
     encima (hecho/valor/documento/quien/cuando, como en las notas). */
  function normalizarRequisitoHito(r) {
    return {
      id: (r && r.id) || nuevoId(),
      texto: String((r && r.texto) || ''),
      clase: (r && r.clase) === 'documento' ? 'documento' : 'dato',
      obligatorio: !!(r && r.obligatorio),
      hecho: !!(r && r.hecho),
      valor: String((r && r.valor) || ''),
      documento: String((r && r.documento) || ''),
      quien: String((r && r.quien) || ''),
      cuando: String((r && r.cuando) || '')
    };
  }

  /* Cómo se cuenta un plazo (fila 131, js/plazos.js): hábiles si no dice. */
  function cuentaDePlazo(c) { return Plazos.cuentaValida(c); }   /* fila 284: también «meses» */

  /* Un hito, tal y como se guarda. Recursivo: un hito de clase
     "decision" lleva sus opciones, cada una con su propia lista de
     hitos (nunca otra decisión dentro, igual que en la guía). */
  function normalizarHito(h) {
    var esDecision = (h && h.clase) === 'decision';
    var salida = {
      id: (h && h.id) || nuevoId(),
      titulo: String((h && h.titulo) || ''),
      cuerpo: String((h && h.cuerpo) || ''),
      origenGuia: (h && h.origenGuia) || null,
      clase: esDecision ? 'decision' : 'paso',
      estado: CLASES_ESTADO.indexOf(h && h.estado) !== -1 ? h.estado : 'pendiente',
      desde: String((h && h.desde) || ''),
      responsable: String((h && h.responsable) || ''),
      fecha: String((h && h.fecha) || ''),
      fechaManual: !!(h && h.fechaManual),
      plazo: (h && h.plazo && h.plazo.dias)
        ? Plazos.conBase({ dias: parseInt(h.plazo.dias, 10) || 0, desde: String(h.plazo.desde || ''),
            cuenta: cuentaDePlazo(h.plazo.cuenta) }, h.plazo) : null,   /* fila 131: hábiles si no dice */
      estadoAsunto: (h && h.estadoAsunto) || null,
      notas: Array.isArray(h && h.notas) ? h.notas.map(normalizarNota) : [],
      documentos: Array.isArray(h && h.documentos) ? h.documentos.map(String) : [],
      requisitos: Array.isArray(h && h.requisitos) ? h.requisitos.map(normalizarRequisitoHito) : [],
      plantilla: (h && h.plantilla) || null,   /* hueco sin uso, sección 9 */
      /* 20-sep-2026, fila 79, apartados 4.6 y 4.7: un hito sin estos dos
         campos (todos los que ya existían antes de esta fila) se
         comporta como uno normal y sin normativa. Solo existen en el
         hito de arriba, nunca en el de una opción (igual que en su paso
         de guía). */
      soloInformativo: !!(h && h.soloInformativo),
      /* Fila 414: recibe varios documentos (como `toca`, llega de la guía). */
      /* 28-sep-2026, fila 201, docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md,
         apartado 1: el texto y el tipo de documento que propone este
         hito al añadir o nombrar un documento desde él (apartado 4,
         js/documentos-formulario.js). Igual que `soloInformativo`:
         solo en el hito de arriba, nunca en el de una opción. */
      textoDocumentos: esDecision ? '' : String((h && h.textoDocumentos) || ''),
      tipoDocumento: esDecision ? '' : String((h && h.tipoDocumento) || ''),
      normativa: (window.Guias ? Guias.normalizarNormativa(h && h.normativa) : []),
      /* 20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md: claves del
         catálogo de `js/formularios.js`. Mismo criterio que `normativa`:
         solo en el hito de arriba, nunca en el de una opción. */
      formularios: Array.isArray(h && h.formularios) ? h.formularios.map(String) : [],
      /* 23-sep-2026, fila 94, docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md: el
         tipo del que venía un hito que se ha quedado tras cambiar el tipo
         del asunto (tenía algo apuntado). No existe en los demás. No
         se ve en la lista ni cuenta: sale plegado con los huérfanos.
         Solo se escribe cuando lo hay (más abajo), para no cambiar la
         forma de ningún hito de antes. */
      opciones: [], elegida: null
    };
    if (h && h.delTipoAnterior) salida.delTipoAnterior = String(h.delTipoAnterior);
    /* Fila 205: una Administración como responsable (`adm:…`) lleva una copia de su nombre; en los demás hitos, nada. */
    if (h && window.ResponsableOrganismo && ResponsableOrganismo.esOrganismo(h.responsable)) salida.responsableNombre = ResponsableOrganismo.copia(h.responsable, h.responsableNombre);
    /* «Avisar a quien lo pide» (fila 195, docs/AVISOS-A-QUIEN-LO-PIDE.md):
       los dos campos del paso, solo si están encendidos (un hito de
       antes de esta fila se comporta como si no avisara), y la marca
       de que ya se ha preguntado por este hito, solo si la hay. */
    if (h && h.avisarLoPide) {
      salida.avisarLoPide = true;
      salida.avisarLoPidePlantilla = String(h.avisarLoPidePlantilla || '');
    }
    if (h && h.avisoLoPideHecho) salida.avisoLoPideHecho = true;
    if (h && h.cadena && h.cadena.estado && salida.estado !== 'hecho') salida.cadena = Object.assign({}, h.cadena);   /* fila 285 */
    if (h && h.sinRespuesta && salida.estado === 'hecho') salida.sinRespuesta = true;   /* fila 286: hecho sin que llegara nada */
    /* La fecha en que se dio por hecho (fila 102, para {hecho:...}).
       Solo si la hay: los hitos de antes no la tienen, y no se inventa. */
    if (h && h.hechoEl) salida.hechoEl = String(h.hechoEl);
    /* El estado del guion (fila 109, js/hitos-guion.js): solo si lo hay. */
    if (h && h.guionHecho && typeof h.guionHecho === 'object') salida.guionHecho = h.guionHecho;
    if (h && Array.isArray(h.guionPropio) && h.guionPropio.length) salida.guionPropio = h.guionPropio;
    /* Fila 522: el documento colgado de cada tarea (js/tareas-con-documento.js), solo si lo hay. */
    if (h && h.guionDocumento && typeof h.guionDocumento === 'object' && Object.keys(h.guionDocumento).length) salida.guionDocumento = h.guionDocumento;
    /* Fila 224: las tareas de la guía escondidas en este asunto («Cambiar
       aquí» o «Borrar»), solo si hay alguna. */
    if (h && Array.isArray(h.guionOcultos) && h.guionOcultos.length) salida.guionOcultos = h.guionOcultos;
    /* Fila 553: el orden de las tareas en este asunto (js/hitos-guion-orden.js). */
    if (h && Array.isArray(h.guionOrden) && h.guionOrden.length) salida.guionOrden = h.guionOrden.map(String);
    /* Fila 116: la respuesta a cada pregunta del guion, solo si la hay. */
    if (h && h.guionElegido && typeof h.guionElegido === 'object' && Object.keys(h.guionElegido).length) salida.guionElegido = h.guionElegido;
    /* Fila 405: el texto de una pregunta cambiado «solo aquí», por id de pregunta. */
    if (h && h.guionTextos && typeof h.guionTextos === 'object' && Object.keys(h.guionTextos).length) salida.guionTextos = h.guionTextos;
    /* Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md), solo si los hay: la marca
       del paso («Nos toca» / «Esperamos a…») y el «Esperando a…» puesto a
       mano, con desde cuándo, el motivo y los ficheros que había. */
    if (h && (h.toca === 'nos' || h.toca === 'espera')) salida.toca = h.toca;
    if (h && h.toca === 'espera' && h.tocaA) salida.tocaA = String(h.tocaA);
    if (h && h.variosDocumentos && !esDecision) salida.variosDocumentos = true;   /* fila 414: solo si lo lleva */
    /* Fila 416: algo de este hito (título, explicación, responsable, plazo, «solo informativo») se cambió a mano solo en este asunto: la guía ya no lo pisa. */
    if (h && h.cambioAqui) salida.cambioAqui = true;
    /* Fila 576: «Cuándo se hace» (js/solo-si.js). `cond` (lo que dice el campo del asunto ahora) nunca se guarda: se pone al leer. */
    var soloSi = h && h.soloSi ? (window.SoloSi ? SoloSi.normalizar(h.soloSi) : h.soloSi) : null;
    if (soloSi) salida.soloSi = soloSi;
    if (h && h.variosPropio && !esDecision) salida.variosPropio = true;   /* fila 414: cambiado «solo en este asunto»: la guía ya no lo pisa */
    if (h && h.esperandoA) {
      salida.esperandoA = String(h.esperandoA);
      salida.esperandoDesde = String(h.esperandoDesde || '');
      if (h.esperandoMotivo) salida.esperandoMotivo = String(h.esperandoMotivo);
      if (Array.isArray(h.esperandoFicheros)) salida.esperandoFicheros = h.esperandoFicheros.map(String);
    }
    if (esDecision) {
      salida.opciones = (Array.isArray(h && h.opciones) ? h.opciones : []).map(function (o) {
        return {
          id: (o && o.id) || nuevoId(),
          texto: String((o && o.texto) || ''),
          hitos: (Array.isArray(o && o.hitos) ? o.hitos : []).map(normalizarHito)
        };
      });
      salida.elegida = (h && h.elegida) || null;
    }
    return salida;
  }

  function normalizarLista(lista) {
    return (Array.isArray(lista) ? lista : []).map(normalizarHito);
  }

  function normalizarAjustes(a) {
    var responsables = (Array.isArray(a && a.responsables) ? a.responsables : RESPONSABLES_DEFECTO.slice())
      .map(function (r) {
        var id = String((r && r.id) || '');
        /* Fila 104: si es de Administración (sí/no). De partida, `yo` y
           `companero`; los que se guardaron antes de la marca, igual. */
        var adm = (r && typeof r.administracion === 'boolean') ? r.administracion : (id === 'yo' || id === 'companero');
        return { id: id, nombre: String((r && r.nombre) || ''), clase: 'centro', administracion: adm };
      })
      .filter(function (r) { return r.id && r.nombre; });
    if (window.HitosAdministracion) responsables = HitosAdministracion.asegurar(responsables);   /* fila 159 */
    var noLectivos = (Array.isArray(a && a.noLectivos) ? a.noLectivos : [])
      .map(String).filter(function (f) { return /^\d{4}-\d{2}-\d{2}$/.test(f); }).sort();
    /* Fila 131: los festivos, aparte (cuentan para todos los plazos). */
    var festivos = (Array.isArray(a && a.festivos) ? a.festivos : [])
      .map(String).filter(function (f) { return /^\d{4}-\d{2}-\d{2}$/.test(f); }).sort();
    return { responsables: responsables, noLectivos: noLectivos, festivos: festivos };
  }

  function normalizar(leido) {
    var l = leido || {};
    var porAsunto = {};
    var origen = (l.porAsunto && typeof l.porAsunto === 'object') ? l.porAsunto : {};
    Object.keys(origen).forEach(function (clave) {
      var e = origen[clave] || {};
      porAsunto[clave] = { creados: String(e.creados || ''), hitos: normalizarLista(e.hitos) };
      if (e.actividadEl) porAsunto[clave].actividadEl = String(e.actividadEl);   /* fila 451: última vez que se marcó o desmarcó un hito */
      /* Fila 118 (js/hitos-sincronizar.js): los pasos de la guía que ya han pasado por el asunto. */
      if (window.Hitos && Hitos.pasosConocidosDe) porAsunto[clave].pasosConocidos = Hitos.pasosConocidosDe(e, porAsunto[clave].hitos);
    });
    return { ajustes: normalizarAjustes(l.ajustes), porAsunto: porAsunto };
  }

  function vacio() { return normalizar(null); }

  I.FICHERO = FICHERO;
  I.CLASES_ESTADO = CLASES_ESTADO;
  I.RESPONSABLES_DEFECTO = RESPONSABLES_DEFECTO;
  I.PAPELES = PAPELES;
  I.nuevoId = nuevoId;
  I.gestor = gestor;
  I.normalizarHito = normalizarHito;
  I.normalizarAjustes = normalizarAjustes;
  I.normalizar = normalizar;
  I.vacio = vacio;
})();
