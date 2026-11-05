/* ============================================================
   guias-editor-plazo.js — trozo de js/guias-editor.js (fila 531: ese fichero
   pasaba de 400 líneas; mismas funciones, solo cambian de fichero): el
   bloque «responsable, a quién le toca y plazo» de cada hito del editor de la
   guía y el aviso de «Guardar» cuando un hito tiene días pero no «desde».

   `ctx`: { nivel() (los hitos que se ven), opcionesResp, opciones, plegado }.
   Se carga antes de js/guias-editor.js.
   ============================================================ */
window.GuiasEditorPlazo = (function () {
  function $(id) { return document.getElementById(id); }

  /* Fila 175, punto 7: el mismo criterio que recoger() para saber si un hito se va a quedar sin plazo por no tener «desde», pero ANTES de recoger(). */
    /* (ver arriba) el mismo criterio que recoger() (más abajo)
       para saber si un hito se va a quedar sin plazo por no tener
       «desde», pero ANTES de recoger() (que lo perdería sin avisar).
       Solo mira el nivel que se está viendo: los demás ya pasaron por
       este mismo aviso al salir de él (GuiasNiveles llama a recoger()
       al cambiar de nivel). */
    function conDiasSinDesde(ctx) {
      var nivel = ctx.nivel();
      var cajas = Array.prototype.slice.call($('guia-pasos').children);
      for (var k = 0; k < cajas.length; k++) {
        var caja = cajas[k];
        var i = parseInt(caja.dataset.pos, 10);
        if (isNaN(i) || !nivel[i]) continue;
        var diasInp = caja.querySelector(':scope > .paso-extra .paso-plazo-dias');
        var desdeSel = caja.querySelector(':scope > .paso-extra .paso-plazo-desde');
        var dias = diasInp ? parseInt(diasInp.value, 10) : NaN;
        if (!isNaN(dias) && dias > 0 && desdeSel && !desdeSel.value) {
          var tituloEl = caja.querySelector(':scope > .paso-cabecera .paso-titulo');
          return { caja: caja, desdeSel: desdeSel, titulo: (tituloEl && tituloEl.value.trim()) || 'Hito sin título' };
        }
      }
      return null;
    }


    /* ---------- responsable, estado y plazo por defecto (sección 11) ----------

       "Desde qué hito" solo puede ser OTRO hito del mismo nivel (el
       que se está viendo: la guía entera o los hitos de una opción,
       fila 95). Se reconstruye en cada pintado, con los hitos tal y
       como están en ese momento. */
    function extraHTML(ctx, p, i) {
      var nivel = ctx.nivel(), opcionesResp = ctx.opcionesResp, opciones = ctx.opciones;
      var otros = nivel.filter(function (x, k) { return k !== i; });
      /* Fila 463, A4: todo en una fila (baja a dos si no cabe), cada cosa con su rótulo. */
      return '<div class="paso-extra">' +
        /* Fila 531: un hito de la lista común lo dice y se cambia con «Cambiar el hito» (js/comunes-guia.js). */
        (p.comun ? '<div class="paso-comun"><span class="suave pequeno">Hito de la lista común.</span> <button type="button" class="boton boton-chico comunes-cambiar-hito" data-comun="' + U.escapar(p.comun) + '">Cambiar el hito</button></div>' : '') +
        '<div class="paso-extra-cuerpo">' +
          '<label class="dato dato-responsable"><span class="etiqueta">Responsable</span>' +
          '<select class="campo paso-responsable"><option value="">(sin responsable)</option>' +
          opcionesResp.map(function (r) {
            return '<option value="' + U.escapar(r.id) + '"' + (r.id === p.responsable ? ' selected' : '') +
              '>' + U.escapar(r.nombre) + '</option>';
          }).join('') + (window.ResponsableOrganismo ? ResponsableOrganismo.opcionesExtra(p) : '') + '</select></label>' +
          /* Fila 129: a quién le toca este hito (js/guias-toca.js); siempre a la vista (fila 463). */
          (window.GuiasToca ? '<div class="dato paso-toca-bloque">' + GuiasToca.html(p, opcionesResp) + '</div>' : '') +
          '<div class="paso-plazo-fila">' +
            '<label class="dato dato-plazo-dias"><span class="etiqueta">Plazo (días)</span>' +
            '<input type="number" min="1" class="campo paso-plazo-dias" placeholder="' +
            (p.plazo && p.plazo.cuenta === 'meses' ? 'meses' : 'días') + '" value="' +
            (p.plazo ? p.plazo.dias : '') + '"></label>' +
            (window.GuiasPlazo ? '<label class="dato dato-cuenta"><span class="etiqueta">Cómo se cuentan</span>' + GuiasPlazo.html(p) + '</label>' : '') +   /* fila 131 */
            (opciones && opciones.esModelo
              /* Fila 284: un modelo de la biblioteca no dice desde qué hito; cada guía lo decide al traerlo. */
              ? '<span class="suave paso-plazo-desde-fijo">desde que se termine el hito de arriba, en cada guía</span>'
              : '<label class="dato dato-desde"><span class="etiqueta">Desde</span>' +
                '<select class="campo paso-plazo-desde"><option value="">(sin plazo)</option>' +
                otros.map(function (o) {
                  return '<option value="' + U.escapar(o.id) + '"' +
                    (p.plazo && p.plazo.desde === o.id ? ' selected' : '') + '>' +
                    U.escapar(o.titulo || 'Hito sin título') + '</option>';
                }).join('') + '</select></label>') +
          '</div>' +
        '</div>' +
      '</div>';
    }

    /* Fila 175, punto 7: si algún hito tiene días de plazo escritos
       pero ningún «desde» elegido, «Guardar» no cierra el cuadro (los
       días se perderían sin que nadie se entere, ver recoger() más
       abajo): avisa, abre ese hito y pone el foco en su «desde». */
    function enganchar(ctx) {
      var aceptar = $('cuadro-aceptar');
      var cerrarDeVerdad = aceptar.onclick;
      aceptar.onclick = function () {
        var falta = conDiasSinDesde(ctx);
        if (!falta) { cerrarDeVerdad(); return; }
        U.aviso('El hito «' + falta.titulo + '» tiene días de plazo, pero no dice desde cuándo. ' +
          'Elige "desde" o borra los días.', 'malo');
        ctx.plegado.abrir(falta.caja.dataset.pasoId);
        ctx.plegado.aplicar();
        if (falta.caja.scrollIntoView) falta.caja.scrollIntoView({ block: 'nearest' });
        falta.desdeSel.focus();
      };
    }

  return { extraHTML: extraHTML, conDiasSinDesde: conDiasSinDesde, enganchar: enganchar };
})();
