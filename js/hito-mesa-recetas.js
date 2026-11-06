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
    return ((g && g.receta && g.receta.via) || canales[0] || 'correo');
  }

  async function comunicarPaso(a, h, g, lista) {
    var receta = g.receta || {};
    /* Fila 321: la plantilla de la tarea está fuera de uso: no se prepara nada. */
    var fuera = await plantillaFueraDeUso(g);
    if (fuera) { Plantillas.avisoFueraDeUso(fuera); return; }
    var via = canalDe(a, h, g);
    var op = await opcionesDePaso(a, h, g, lista, via);
    if (via === 'correo') {
      var marcados = window.HitoMesaDocumentos && HitoMesaDocumentos.marcados ? HitoMesaDocumentos.marcados(document) : [];
      if (marcados.length) op.adjuntos = marcados;
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

  /* ---------- el botón dentro de la propia tarea (fila 410) ---------- */

  /* «Enviar correo», «Enviar por Séneca» o «Generar documento», en la línea de cada tarea pendiente con esa
     acción (registrar no lleva). Vacío si no toca. */
  function botonDeTareaHTML(a, h, g) {
    if (!g || g.pregunta || g.hecho || g.noaplica) return '';
    var texto = g.accion === 'generar' ? 'Generar documento'
      : (g.accion === 'comunicar' ? (canalDe(a, h, g) === 'seneca' ? 'Enviar por Séneca' : 'Enviar correo') : '');
    if (!texto) return '';
    var consulta = window.SoloConsulta && SoloConsulta.activo();
    return '<button type="button" class="boton boton-chico guion-accion-tarea" data-accion="' + g.accion + '"' +
      (consulta ? ' disabled data-motivo-clave="consulta"' : '') + '>' + texto + '</button>';
  }

  /* Lo mismo que elegir esa tarea en el menú de la cabecera. */
  async function lanzarTarea(a, h, g, fila, boton) {
    if (g.accion === 'generar') return generarPaso(a, h, g, fila, boton);
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

  return { plantillaFueraDeUso: plantillaFueraDeUso, pendientes: pendientes, bloqueHTML: bloqueHTML, enganchar: enganchar, botonDeTareaHTML: botonDeTareaHTML, lanzarTarea: lanzarTarea, opcionesDePaso: opcionesDePaso };
})();
window.HitoMesaRecetas = HitoMesaRecetas;
