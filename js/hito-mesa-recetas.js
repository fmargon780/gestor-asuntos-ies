/* ============================================================
   hito-mesa-recetas.js — las recetas de las tareas del guion, arriba de
   los menús de la cabecera del hito (25-sep-2026, fila 164,
   docs/HITOS-ACCIONES-EN-EL-HITO.md, punto 3).

   Una tarea del guion con acción (comunicar, generar, registrar) es una
   tarea con receta; `receta` (js/guias-guion.js) dice los detalles, si
   los hay. Aquí:

     - «Comunicar ▾»: arriba, las tareas pendientes con receta de
       comunicar, con su texto. Al elegir una, el cuadro de Correo o de
       Séneca se abre ya con los destinatarios (a quién) y la plantilla
       de la receta, y al terminar se marca ESA tarea (`idPasoGuion`,
       js/correo-rastro.js).
     - «Generar documento ▾»: arriba, las tareas pendientes con receta
       de generar. Con plantilla fija, la genera y marca esa tarea; sin
       ella, abre el cuadro de elegir de siempre.
     - «Registrar»: las tareas pendientes con receta de registrar salen
       como título del menú de documentos (js/hito-mesa.js).

   Debajo de cada bloque sigue lo de siempre (comunicar o generar
   libremente). Lo llaman js/hito-mesa-comunicar.js y
   js/hito-mesa-documentos.js.
   ============================================================ */
var HitoMesaRecetas = (function () {

  var ETIQUETA = { comunicar: 'Tareas pendientes de comunicar', generar: 'Tareas pendientes de generar' };

  /* Las tareas pendientes (ni hechas ni «No aplica») con esa acción, en
     el orden en que se ven. */
  function pendientes(a, h, accion) {
    if (!h || !window.Hitos || !Hitos.guionDe) return [];
    return Hitos.guionDe(a, h).filter(function (g) {
      /* Fila 659: un «Enviar» a otro sitio que no sea el correo ni iPasen no envía nada: se marca a mano. */
      if (accion === 'comunicar' && window.Sitios && Sitios.canalDeSitio(g.donde) === '') return false;
      return !g.pregunta && !g.hecho && !g.noaplica && g.accion === accion;
    });
  }

  function bloqueHTML(a, h, accion) {
    var lista = pendientes(a, h, accion);
    if (!lista.length) return '';
    return '<div class="mesa-recetas" data-accion="' + accion + '"><div class="mesa-recetas-titulo">' + ETIQUETA[accion] + '</div>' +
      lista.map(function (g) {
        return '<button type="button" class="mesa-receta" data-paso="' + U.escapar(g.id) + '">' + U.escapar(g.texto) +
          (window.Plantillas && Plantillas.fueraDeUsoDeLaTarea(g) ? ' <span class="guion-fuera-de-uso">plantilla fuera de uso</span>' : '') + '</button>';
      }).join('') + '</div>';
  }

  /* ---------- comunicar ---------- */

  /* Lo que el cuadro de Correo o de Séneca necesita de una tarea de comunicar (fila 299: una sola regla para la mesa y para
     «Hacer este hito»): cuál es la tarea y con qué plantilla. Fila 555: a quién va lo dice la plantilla (sus papeles), no la tarea. */
  async function opcionesDePaso(a, h, g, lista, via) {
    var receta = g.receta || {};
    var op = { idPasoGuion: g.id };
    if (receta.plantilla) op.plantilla = receta.plantilla;
    return op;
  }

  /* La plantilla fuera de uso que lleva una tarea (leyendo lo último del disco), o null. */
  async function plantillaFueraDeUso(g) {
    var id = g && g.receta && g.receta.plantilla;
    if (!id || !window.Plantillas) return null;
    try { await Plantillas.cargarReciente(App.E.gestor); } catch (e) { /* con lo que haya */ }
    var p = Plantillas.porId(id);
    return p && !Plantillas.enUso(p) ? p : null;
  }

  /* El canal que abrirá una tarea de comunicar: el de la receta, o el primero de siempre. */
  function canalDe(a, h, g) {
    var canales = window.HitosComunicar && HitosComunicar.canalesDe ? HitosComunicar.canalesDe(a, h) : ['correo'];
    /* Fila 659: lo decide el sitio de la tarea (Correo electrónico → correo; iPasen → mensaje de Séneca; otro: nada); sin sitio, su vía de antes. */
    var c = window.Sitios ? Sitios.canalDeTarea(g) : ((g && g.receta && g.receta.via) || null);
    if (c === '') return '';
    return (c || canales[0] || 'correo');
  }

  async function comunicarPaso(a, h, g, lista) {
    var receta = g.receta || {};
    /* Fila 321: la plantilla de la tarea está fuera de uso: no se prepara nada. */
    var fuera = await plantillaFueraDeUso(g);
    if (fuera) { Plantillas.avisoFueraDeUso(fuera); return; }
    var via = canalDe(a, h, g);
    var op = await opcionesDePaso(a, h, g, lista, via);
    var propio = await documentoColgado(a, h, g);   /* fila 638: el documento colgado de la tarea */
    if (via === 'correo') {
      var marcados = window.HitoMesaDocumentos && HitoMesaDocumentos.marcados ? HitoMesaDocumentos.marcados(document) : [];
      /* Va adjunto, con los que se hayan marcado en la carpeta. */
      if (propio && marcados.indexOf(propio) === -1) marcados = [propio].concat(marcados);
      if (marcados.length) op.adjuntos = marcados;
    } else if (via === 'seneca' && propio) {
      op.documentoSeneca = propio;   /* Séneca no puede enganchar ficheros desde la web: se señala cuál adjuntar a mano */
    }
    HitosComunicar.comunicar(a, h, via, op);
  }

  /* ---------- generar ---------- */

  async function generarPaso(a, h, g, fila, boton) {
    var id = g.receta && g.receta.plantilla;
    var datos = null;
    if (id && window.Plantillas) {
      try { datos = await Plantillas.cargarReciente(App.E.gestor); } catch (e) { datos = null; }
    }
    var p = datos && (datos.documentos || []).filter(function (x) { return x.id === id; })[0];
    /* Fila 321: la plantilla de la tarea está fuera de uso: no se genera nada. */
    if (p && !Plantillas.enUso(p)) { Plantillas.avisoFueraDeUso(p); return; }
    if (!p) {
      /* Sin plantilla fija (o ya no está): el cuadro de elegir de siempre. */
      var b = fila && fila.querySelector('.hito-generar');
      if (b) b.click();
      else U.aviso('Elige la plantilla aquí abajo.', 'ambar');
      return;
    }
    try {
      await U.mientrasGuarda(boton, function () {
        return PlantillasDocumento.generar(a, p, 'abierto', { hito: h, idPasoGuion: g.id });
      });
    } catch (e) { U.fallo('No he podido generar el documento', e); }
  }

  /* ---------- el botón dentro de la propia tarea (fila 410; fila 638: uno por cada «Qué se hace») ---------- */

  var TEXTO = { generar: 'Generar documento', firmar: 'Poner a la firma', registrar: 'Registrar', anadir: 'Añadir documento', pedir: 'Rellenar' };

  /* El documento colgado de la tarea, con el nombre que tiene ahora; '' si no tiene. Lee los hitos al momento. */
  async function documentoColgado(a, h, g) {
    if (!window.TareasConDocumento) return '';
    try {
      var hitos = await Hitos.hitosDe(a.nombre);
      var fresco = Hitos.buscar(hitos, h.id) || h;
      var e = TareasConDocumento.de(fresco, g.id);
      if (!e || !e.doc) return '';
      return window.TareasConDocumentoVista ? TareasConDocumentoVista.nombreActual(e.doc, hitos) : e.doc;
    } catch (err) { return ''; }
  }

  /* El botón de la tarea pendiente, o ''. `o`: { siguiente (resaltado), guion }. Registrar y firmar sin documento, y
     registrar, firmar o comunicar cuyo documento saldrá de una tarea de generar pendiente, salen apagados. */
  /* Algo 📎 que hay que reunir, sin acción, se añade con «Añadir documento» (fila 145). */
  function accionDe(g) { return g.accion || (g.reunir === 'documento' ? 'anadir' : ''); }

  function botonDeTareaHTML(a, h, g, o) {
    /* Fila 639: el teléfono de una tarea de llamar sigue estando con la tarea hecha, para seguir apuntando llamadas. */
    if (g && !g.pregunta && !g.noaplica && g.accion === 'llamar' && window.Llamadas) return Llamadas.botonTareaHTML(g, !!(o && o.siguiente));
    if (!g || g.pregunta || g.hecho || g.noaplica) return '';
    o = o || {};
    var accion = accionDe(g);
    if (accion === 'comunicar' && canalDe(a, h, g) === '') return '';   /* fila 659: «Enviar» a otro sitio: sin botón, se marca a mano */
    var texto = accion === 'comunicar' ? (canalDe(a, h, g) === 'seneca' ? 'Enviar por Séneca' : 'Enviar correo') : TEXTO[accion];
    if (!texto) return '';
    var consulta = window.SoloConsulta && SoloConsulta.activo();
    var apagado = '';
    if (accion === 'registrar' || accion === 'firmar' || accion === 'comunicar') {
      var tiene = !!(window.TareasConDocumento && TareasConDocumento.de(h, g.id) && TareasConDocumento.de(h, g.id).doc);
      var saldra = !tiene && window.TareasConDocumentoVista ? TareasConDocumentoVista.saldra(g, o.guion || []) : '';
      if (saldra) apagado = saldra;
      else if (!tiene && accion !== 'comunicar') apagado = 'Elige antes el documento';
    }
    return '<button type="button" class="boton boton-chico guion-accion-tarea' + (o.siguiente ? ' boton-principal' : '') + '" data-accion="' + accion + '"' +
      (consulta ? ' disabled data-motivo-clave="consulta"' : (apagado ? ' disabled title="' + U.escapar(apagado) + '"' : '')) + '>' + texto + '</button>';
  }

  /* Registrar: la ventana de siempre del documento de la tarea (la de «Registrar» del menú del documento). */
  async function registrarPaso(a, h, g) {
    var doc = await documentoColgado(a, h, g);
    if (!doc) { U.aviso('Esta tarea aún no tiene documento.', 'ambar'); return; }
    if (window.HitosDocumentoMenu) await HitosDocumentoMenu.registrar(a, h, doc);
  }

  /* Firmar: lo que se hace es llevar el documento a firmar, que empieza con «Ruta» (js/documentos-firmados.js reconoce el firmado). */
  function firmarPaso(a, h, g, fila) {
    var ruta = (fila || document).querySelector('.tcd[data-tarea="' + g.id + '"] .ruta-documento');
    if (ruta) ruta.click();
    else U.aviso('Esta tarea aún no tiene documento.', 'ambar');
  }

  /* Añadir documento: la ventana de siempre; ya se sabe de qué tarea es, así que no pregunta. */
  function anadirPaso(a, h, g) {
    if (window.Documentos && Documentos.abrir) Documentos.abrir(a, { hito: h, tarea: g.id, irDirectoAAnadir: true });
  }

  /* Lo mismo que elegir esa tarea en el menú de la cabecera (antes de la fila 638) o su botón. */
  async function lanzarTarea(a, h, g, fila, boton) {
    var accion = accionDe(g);
    if (accion === 'generar') return generarPaso(a, h, g, fila, boton);
    if (accion === 'registrar') return registrarPaso(a, h, g);
    if (accion === 'firmar') return firmarPaso(a, h, g, fila);
    if (accion === 'anadir') return anadirPaso(a, h, g);
    if (accion === 'llamar') { if (window.Llamadas) Llamadas.abrirDeTarea(a, h, g); return; }   /* fila 639 */
    if (accion === 'pedir') { if (window.DatosDeLaTarea) DatosDeLaTarea.abrir(a, h, g, fila); return; }
    return comunicarPaso(a, h, g, []);
  }

  /* `extra`: { lista } (los candidatos de Comunicar) o { fila } (la mesa). */
  function enganchar(caja, a, h, accion, extra) {
    var bloque = caja && caja.querySelector('.mesa-recetas[data-accion="' + accion + '"]');
    if (!bloque) return;
    var lista = pendientes(a, h, accion);
    Array.prototype.forEach.call(bloque.querySelectorAll('.mesa-receta'), function (b) {
      var g = lista.filter(function (x) { return x.id === b.dataset.paso; })[0];
      if (!g) return;
      b.onclick = function () {
        if (accion === 'comunicar') comunicarPaso(a, h, g, extra && extra.lista);
        else if (accion === 'generar') generarPaso(a, h, g, extra && extra.fila, b);
      };
    });
  }

  return { plantillaFueraDeUso: plantillaFueraDeUso, pendientes: pendientes, bloqueHTML: bloqueHTML, enganchar: enganchar, botonDeTareaHTML: botonDeTareaHTML, canalDe: canalDe, lanzarTarea: lanzarTarea, opcionesDePaso: opcionesDePaso };
})();
window.HitoMesaRecetas = HitoMesaRecetas;
