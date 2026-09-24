/* ============================================================
   guias-paso-bloques.js — los bloques de dentro de un paso de la guía que
   no es pregunta: lo que hay que reunir, comunicación, documentos, guion,
   solo informativo, normativa y formularios, y «Guardar en la biblioteca».

   Sacado tal cual de `pintar()` del editor (js/guias-editor.js) en la
   fila 133 (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que
   hace. Recibe el mismo contexto que la caja de opciones
   (js/guias-opciones-editor.js): `ctx.nivel()`, `ctx.recoger()`,
   `ctx.pintar()` y `ctx.restaurar(det, pos, idSub)`.
   ============================================================ */
var GuiasPasoBloques = (function () {

  /* Qué secciones plegables (paso-extra, "Lo que hay que reunir",
     "Comunicación de este paso", de un paso o de un subpaso) estaban
     abiertas antes de repintar (18-sep-2026, fila 60: sin esto, "+
     Añadir"/quitar/mover una fila de cualquiera de las dos hace
     recoger()+pintar() del paso entero, que reconstruye el `<details>`
     desde cero y se cierra solo, llevándose por delante la fila que
     Francisco acaba de tocar). La clave es la posición del paso de
     arriba (estable dentro de un mismo repintado: nada más reordena
     los pasos aquí) más el id del subpaso, si lo hay. */
  function detallesAbiertos(caja) {
    var abiertos = {};
    Array.prototype.forEach.call(caja.querySelectorAll('details[open]'), function (det) {
      var pasoEditor = det.closest('.paso-editor');
      var subEditor = det.closest('.subpaso-editor');
      var clave = (pasoEditor ? pasoEditor.dataset.pos : '') + '|' +
        (subEditor ? subEditor.dataset.id : '') + '|' + det.className;
      abiertos[clave] = true;
    });
    return abiertos;
  }

  function restaurarAbierto(det, abiertos, pos, idSubpaso) {
    if (!det) return;
    var clave = pos + '|' + (idSubpaso || '') + '|' + det.className;
    if (abiertos[clave]) det.open = true;
  }

  function anadir(d, p, i, pregunta, ctx) {
    /* "Lo que hay que reunir" (18-sep-2026, fila 59,
       docs/REQUISITOS-DE-HITO.md): solo en los pasos que no son
       pregunta. Una pregunta no se "da por hecha" con una casilla:
       se resuelve eligiendo una opción, y son SUS pasos (más abajo,
       cajaDeOpciones) los que pueden llevar requisitos. */
    if (!pregunta && window.GuiasRequisitos) {
      d.insertAdjacentHTML('beforeend', GuiasRequisitos.bloqueHTML(p.requisitos));
      ctx.restaurar(d.querySelector(':scope > .paso-requisitos'), i, '');
      GuiasRequisitos.enganchar(d, function (mutador) {
        ctx.recoger();
        mutador(ctx.nivel()[i].requisitos);
        ctx.pintar();
      });
    }

    /* "Comunicación de este paso" (18-sep-2026, fila 60,
       docs/COMUNICAR-DESDE-EL-HITO.md): mismo criterio, solo en los
       pasos que no son pregunta. A diferencia del bloque de arriba,
       son solo campos de texto: no hace falta recoger()+pintar() en
       cada tecla, basta con leerlos en recoger() como el título o
       el cuerpo del paso. */
    if (!pregunta && window.GuiasComunicacion) {
      d.insertAdjacentHTML('beforeend', GuiasComunicacion.bloqueHTML(p.id, p.comunicacion));
      ctx.restaurar(d.querySelector(':scope > .paso-comunicacion'), i, '');
      GuiasComunicacion.enganchar(d, p.id);
    }

    /* «Documentos de este paso» (fila 102, js/guias-documentos.js):
       mismo criterio, solo en los pasos que no son pregunta. */
    if (!pregunta && window.GuiasDocumentos) {
      d.insertAdjacentHTML('beforeend', GuiasDocumentos.bloqueHTML(p.plantillasDocumento));
      ctx.restaurar(d.querySelector(':scope > .paso-documentos'), i, '');
      GuiasDocumentos.enganchar(d);
    }
    /* «Guion de este paso» (fila 109, js/guias-guion.js). */
    if (!pregunta && window.GuiasGuion) {
      d.insertAdjacentHTML('beforeend', GuiasGuion.bloqueHTML(p.guion));
      ctx.restaurar(d.querySelector(':scope > .paso-guion'), i, '');
      GuiasGuion.enganchar(d, function (mutador) { ctx.recoger(); mutador(ctx.nivel()[i].guion = ctx.nivel()[i].guion || []); ctx.pintar(); });
    }

    /* "Solo informativo" y "Normativa" (20-sep-2026, fila 79,
       apartados 4.6 y 4.7): mismo criterio que arriba, solo en los
       pasos que no son pregunta. */
    if (!pregunta) {
      var filaInf = document.createElement('label');
      filaInf.className = 'interruptor paso-solo-informativo-fila';
      filaInf.innerHTML = '<input type="checkbox" class="paso-solo-informativo"' +
        (p.soloInformativo ? ' checked' : '') + '>' +
        '<span>Solo informativo: se ve, pero no reclama trabajo</span>';
      d.appendChild(filaInf);

      if (window.HitosNormativa) {
        /* Formularios oficiales (20-sep-2026, fila 82,
           docs/FORMULARIOS-OFICIALES.md): el buscador se pinta
           dentro del mismo `<details>` de normativa, para no
           alargar más la pantalla del paso. */
        var formulariosHTML = window.Formularios ? Formularios.bloqueEmbebidoHTML(p.formularios) : '';
        d.insertAdjacentHTML('beforeend', HitosNormativa.bloqueHTML(p.normativa, formulariosHTML));
        ctx.restaurar(d.querySelector(':scope > .paso-normativa'), i, '');
        HitosNormativa.enganchar(d, function (mutador) {
          ctx.recoger();
          mutador(ctx.nivel()[i].normativa);
          ctx.pintar();
        });
        if (window.Formularios) Formularios.engancharEmbebido(d);
      }

      /* "Guardar en la biblioteca" (apartados 4.2 y 4.3): junto al
         resto de los mandos del paso. Sin nada que subir (paso al
         día con su modelo), el botón no se pinta. */
      if (window.GuiasBiblioteca && window.HitosBiblioteca) {
        (function (indice) {
          HitosBiblioteca.leer().then(function (biblioteca) {
            /* Puede que ya se haya vuelto a pintar (otra tecla, otro
               paso movido) mientras se leía la biblioteca: `d` ya
               no estaría en el documento, y tocarlo no serviría de
               nada (o peor, duplicaría el botón en el sitio viejo). */
            if (!d.isConnected) return;
            var pasoActual = ctx.nivel()[indice];
            if (!pasoActual || pasoActual.opciones.length) return;   /* se ha vuelto pregunta mientras leíamos */
            var modelo = pasoActual.origenBiblioteca ? HitosBiblioteca.buscar(biblioteca, pasoActual.origenBiblioteca.id) : null;
            var diffs = modelo ? HitosBiblioteca.diferencias(pasoActual, modelo) : [];
            /* Ya viene de la biblioteca: el botón solo sale si ha
               cambiado y Francisco todavía no ha decidido "Solo en
               este tipo" para este mismo cambio (apartado 4.2). */
            if (pasoActual.origenBiblioteca &&
                (!modelo || pasoActual.origenBiblioteca.divergido || !diffs.length)) return;
            var mandosDelPaso = d.querySelector('.paso-mandos');
            if (!mandosDelPaso) return;
            mandosDelPaso.insertAdjacentHTML('beforeend', GuiasBiblioteca.botonHTML());
            GuiasBiblioteca.engancharBoton(d, pasoActual, modelo, diffs, function (origenNuevo) {
              ctx.recoger();
              ctx.nivel()[indice].origenBiblioteca = origenNuevo;
              ctx.pintar();
            });
          }).catch(function () { /* sin biblioteca legible, el botón simplemente no sale */ });
        })(i);
      }
    }
  }

  return { anadir: anadir, detallesAbiertos: detallesAbiertos, restaurarAbierto: restaurarAbierto };
})();
window.GuiasPasoBloques = GuiasPasoBloques;
