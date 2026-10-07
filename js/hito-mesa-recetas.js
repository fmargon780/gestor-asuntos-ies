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
        return '<button type="button" class="mesa-receta" data-paso="' + U.escapar(g.id) + '">' + U.escapar(g.texto) + '</button>';
      }).join('') + '</div>';
  }

  /* ---------- comunicar ---------- */

  /* Los destinatarios de la receta, de entre los de siempre de la mesa
     (js/hito-mesa-comunicar.js). Sin «a quién», los premarcados de
     siempre; «el tutor o tutora del grupo» (fila 299, js/tutor-del-grupo.js)
     son las casillas «tutoria0»…; «otro» no se sabe: el cuadro sale sin
     correo, para escribirlo. */
  function elegidosPara(receta, h, lista) {
    var a = (receta && receta.a) || '';
    if (a === 'tercero') return lista.filter(function (c) { return c.id === 'tercero'; });
    if (a === 'tutores') return lista.filter(function (c) { return /^tutor\d/.test(c.id); });
    if (a === 'relacionados') return lista.filter(function (c) { return /^rel/.test(c.id); });
    if (a === 'tutoria') return lista.filter(function (c) { return c.tutorDelGrupo; });
    if (a === 'otro') return [];
    var ids = window.HitoMesaComunicar ? HitoMesaComunicar.premarcados(h, lista) : ['tercero'];
    return lista.filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }

  /* Lo que el cuadro de Correo o de Séneca necesita de una tarea de comunicar (fila 299: una sola regla para la mesa y para
     «Hacer este hito»): quién (nombres, correos), con qué plantilla y, si es a la tutoría, el aviso para el cuadro. */
  async function opcionesDePaso(a, h, g, lista, via) {
    var receta = g.receta || {};
    var sel = elegidosPara(receta, h, lista || []);
    var op = { idPasoGuion: g.id, nombres: sel.map(function (c) { return c.soloNombre || c.nombre; }) };
    if (receta.a === 'tutoria' && !sel.length) op.nombres = ['la tutoría'];
    if (receta.a === 'tutoria' || (sel.length && sel.every(function (c) { return c.tutorDelGrupo; }))) op.tutoria = true;
    if (receta.plantilla) op.plantilla = receta.plantilla;
    if (via === 'correo' && window.HitoMesaComunicar) op.correos = await HitoMesaComunicar.correosDe(sel);
    return op;
  }

  async function comunicarPaso(a, h, g, lista) {
    var receta = g.receta || {};
    var canales = window.HitosComunicar && HitosComunicar.canalesDe ? HitosComunicar.canalesDe(a, h) : ['correo'];
    var via = receta.via || canales[0] || 'correo';
    var op = await opcionesDePaso(a, h, g, lista, via);
    if (via === 'correo' && window.HitoMesaComunicar) {
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

  return { pendientes: pendientes, bloqueHTML: bloqueHTML, enganchar: enganchar, elegidosPara: elegidosPara, opcionesDePaso: opcionesDePaso };
})();
window.HitoMesaRecetas = HitoMesaRecetas;
