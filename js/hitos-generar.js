/* ============================================================
   hitos-generar.js — «Generar documento» dentro de un hito
   (23-sep-2026, fila 102, docs/DOCUMENTOS-DESDE-EL-HITO.md).

   Como js/hitos-comunicar.js: las plantillas no se guardan en el hito,
   se leen de su paso de la guía por `origenGuia` (campo
   `plantillasDocumento`, que se marca en «Documentos de este paso»,
   js/guias-documentos.js). Así, si cambian las del paso, los asuntos
   vivos usan lo nuevo.

   El motor es el de siempre (js/plantillas-documento.js,
   `PlantillasDocumento.generar(asunto, plantilla, modo, { hito })`):
   aquí solo se decide con cuál, y se pinta el botón.

   Lo llama js/hitos-panel-lista.js (`botonHTML`, `engancharBoton`),
   dentro de `.hito-botones`, al lado de los de HitosComunicar. Se
   carga después de js/plantillas-documento.js.
   ============================================================ */
window.HitosGenerar = (function () {

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  /* El paso de la guía de este hito, a cualquier profundidad (fila 95). */
  function buscarPaso(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      var p = pasos[i];
      if (p.id === id) return p;
      for (var j = 0; j < (p.opciones || []).length; j++) {
        var enc = buscarPaso(p.opciones[j].pasos, id);
        if (enc) return enc;
      }
    }
    return null;
  }

  function idsDelPaso(a, hito) {
    if (!hito || !hito.origenGuia || !window.GuiasDelCentro) return [];
    var paso = buscarPaso(GuiasDelCentro.pasosDe(tipoDe(a)), hito.origenGuia);
    return (paso && paso.plantillasDocumento) || [];
  }

  /* Pura, para las pruebas: las del paso (en su orden, sin las borradas)
     y las del tipo que no estén ya en las del paso. Una plantilla unida
     al paso vale aunque sea de otro tipo de asunto. */
  function agrupar(ids, documentosDelTipo, catalogo) {
    var porId = {};
    (catalogo || []).forEach(function (d) { porId[d.id] = d; });
    var vistos = {};
    var delPaso = [];
    (ids || []).forEach(function (id) {
      if (vistos[id] || !porId[id]) return;
      vistos[id] = true;
      delPaso.push(porId[id]);
    });
    var delTipo = (documentosDelTipo || []).filter(function (d) {
      if (vistos[d.id]) return false;
      vistos[d.id] = true;
      return true;
    });
    return { delPaso: delPaso, delTipo: delTipo };
  }

  /* Con lo que ya haya en memoria (síncrona, para decidir al pintar si
     hace falta el botón). */
  function gruposEnMemoria(a, hito) {
    var datos = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    if (!datos) return null;
    var delTipo = Plantillas.documentosDeTipo(datos, PlantillasDocumento.categoriaDelAsunto(a),
      PlantillasDocumento.tipoDelAsunto(a));
    return agrupar(idsDelPaso(a, hito), delTipo, datos.documentos || []);
  }

  var pidiendo = false;

  function botonHTML(a, hito) {
    if (!window.PlantillasDocumento || !PlantillasDocumento.generar) return '';
    if (!hito || hito.clase === 'decision' || hito.estado === 'noaplica') return '';
    var g = gruposEnMemoria(a, hito);
    if (!g) {
      /* Todavía no se han leído las plantillas: se leen y se repinta. */
      if (!pidiendo && window.Plantillas && window.App && App.E && App.E.gestor) {
        pidiendo = true;
        Plantillas.cargarReciente(App.E.gestor, 60000).then(function () {
          pidiendo = false;
          if (window.HitosPanel) HitosPanel.programarRepintado();
        }, function () { pidiendo = false; });
      }
      return '';
    }
    if (!g.delPaso.length && !g.delTipo.length) return '';
    return '<button type="button" class="boton hito-generar" title="Sacar un documento de una plantilla, ' +
      'ya apuntado a este hito">Generar documento</button>';
  }

  function engancharBoton(div, a, hito) {
    var b = div.querySelector('.hito-generar');
    if (!b) return;
    b.onclick = async function () {
      if (b.dataset.guardando) return;
      try {
        try { await Plantillas.cargarReciente(App.E.gestor, 60000); } catch (e) { /* con lo que haya */ }
        var g = gruposEnMemoria(a, hito) || { delPaso: [], delTipo: [] };
        var total = g.delPaso.length + g.delTipo.length;
        if (!total) { U.aviso('No hay ninguna plantilla de documento para este hito.', 'ambar'); return; }
        var elegida = total === 1 ? (g.delPaso[0] || g.delTipo[0]) : await PlantillasDocumento.elegir(g);
        if (!elegida) return;
        /* «Guardando…» solo mientras genera, no con el cuadro de elegir abierto. */
        await U.mientrasGuarda(b, function () { return PlantillasDocumento.generar(a, elegida, 'abierto', { hito: hito }); });
      } catch (e) {
        U.fallo('No he podido generar el documento', e);
      }
    };
  }

  return { botonHTML: botonHTML, engancharBoton: engancharBoton, agrupar: agrupar, buscarPaso: buscarPaso,
           grupos: gruposEnMemoria /* fila 109, la mesa del hito */ };
})();
