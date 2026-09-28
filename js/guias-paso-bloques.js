/* ============================================================
   guias-paso-bloques.js — los bloques de dentro de un paso de la guía que
   no es pregunta: lo que hay que reunir, guion, solo informativo,
   normativa y formularios, y «Guardar en la biblioteca».

   Sacado tal cual de `pintar()` del editor (js/guias-editor.js) en la
   fila 133 (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que
   hace. Recibe el mismo contexto que la caja de opciones
   (js/guias-opciones-editor.js): `ctx.nivel()`, `ctx.recoger()`,
   `ctx.pintar()` y `ctx.restaurar(det, pos, idSub)`.

   27-sep-2026, fila 199 (docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md,
   apartado 4): «Comunicación de este paso» y «Documentos de este paso»
   ya no se pintan aquí. Su contenido pasa a tareas del guion, en la
   conversión automática de `js/guias-editor.js`
   (`convertirDocumentosYComunicacionPuro`, llamada al abrir el
   editor); `js/guias-comunicacion.js` se borró (ya no lo llamaba
   nadie); `js/guias-documentos.js` sigue existiendo, para el catálogo
   de plantillas de documento, pero ya no lo llama este fichero.
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
    /* «De dónde viene» (28-sep-2026, fila 201,
       docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md, apartado 2): una etiqueta
       fija junto al título, plegado el hito o no (no vive dentro de
       ningún `<details>`, así que el CSS del acordeón, fila 122, no la
       esconde). Pulsarla, si viene de la biblioteca, abre el nombre
       del modelo y «Ver en la biblioteca». */
    if (window.GuiasBiblioteca) {
      var cabecera = d.querySelector(':scope > .paso-cabecera');
      if (cabecera) {
        cabecera.insertAdjacentHTML('beforeend', GuiasBiblioteca.chipOrigenHTML(p));
        GuiasBiblioteca.engancharChipOrigen(cabecera, p);
      }
    }

    /* Apartado 3, punto 1: mientras se escribe el título de un hito
       propio (sin origenBiblioteca todavía), si se parece a algo de la
       biblioteca, se dice debajo con «Usarlo» (sustituye el paso a
       medio escribir por el modelo elegido, como «+ Traer de la
       biblioteca»). Si no se pulsa, el paso sigue siendo propio. */
    if (!p.origenBiblioteca && window.GuiasBiblioteca && window.HitosBiblioteca) {
      (function (indice) {
        var tituloInput = d.querySelector(':scope > .paso-cabecera > .paso-titulo');
        if (!tituloInput) return;
        var aviso = document.createElement('div');
        aviso.className = 'paso-titulo-parecido oculto';
        tituloInput.insertAdjacentElement('afterend', aviso);
        var espera = null;
        tituloInput.addEventListener('input', function () {
          clearTimeout(espera);
          var texto = tituloInput.value.trim();
          if (texto.length < 3) { aviso.classList.add('oculto'); aviso.innerHTML = ''; return; }
          espera = setTimeout(async function () {
            var modelos = await GuiasBiblioteca.modelosParecidosATitulo(texto);
            if (!aviso.isConnected || tituloInput.value.trim() !== texto) return;
            if (!modelos.length) { aviso.classList.add('oculto'); aviso.innerHTML = ''; return; }
            var modelo = modelos[0];
            aviso.classList.remove('oculto');
            aviso.innerHTML = 'En la biblioteca hay «' + U.escapar(modelo.nombre) + '» · ' +
              '<button type="button" class="enlace paso-titulo-usarlo">Usarlo</button>';
            aviso.querySelector('.paso-titulo-usarlo').onclick = function () {
              ctx.recoger();
              ctx.nivel()[indice] = HitosBiblioteca.modeloAPaso(modelo);
              ctx.plegado.abrir(ctx.nivel()[indice].id);
              ctx.pintar();
            };
          }, 250);
        });
      })(i);
    }

    /* "Lo que hay que reunir" ya no es una sección aparte (fila 138,
       docs/UNA-SOLA-LISTA-EN-EL-HITO.md): es la casilla «Hay que
       reunirlo» de cada línea del guion (js/guias-guion.js). Sin la
       sección, js/guias-editor.js no toca los `requisitos` viejos del
       paso: se quedan en el fichero, sin leerse. */

    /* «Comunicación de este paso» y «Documentos de este paso» (fila 199):
       ya no tienen sección propia aquí. Su contenido, si lo hubiera,
       se convierte solo en tareas del guion al abrir el editor
       (js/guias-editor.js), antes de llegar a pintar() . */

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

      /* «Avisar a quien lo pide» (fila 195, docs/AVISOS-A-QUIEN-LO-PIDE.md,
         punto 1): casilla + plantilla, un campo más del paso. */
      if (window.AvisosLoPide) {
        var filaAviso = document.createElement('label');
        filaAviso.className = 'interruptor paso-avisar-lopide-fila';
        filaAviso.innerHTML = '<input type="checkbox" class="paso-avisar-lopide"' +
          (p.avisarLoPide ? ' checked' : '') + '>' +
          '<span>Al terminar este hito, avisar a quien lo pide</span>';
        d.appendChild(filaAviso);

        var cajaAviso = document.createElement('div');
        cajaAviso.className = 'paso-avisar-lopide-plantilla' + (p.avisarLoPide ? '' : ' oculto');
        cajaAviso.innerHTML = '<label class="etiqueta-en-linea">Con la plantilla:</label>' +
          '<select class="campo paso-avisar-lopide-select"><option value="">Cargando…</option></select>';
        d.appendChild(cajaAviso);

        filaAviso.querySelector('.paso-avisar-lopide').onchange = function () {
          cajaAviso.classList.toggle('oculto', !this.checked);
        };

        AvisosLoPide.opcionesPlantillaHTML(ctx.nombreTipo, p.avisarLoPidePlantilla, AvisosLoPide.NOMBRE_AVANCE)
          .then(function (html) {
            if (!cajaAviso.isConnected) return;
            cajaAviso.querySelector('.paso-avisar-lopide-select').innerHTML = html;
          });
      }

      /* «Texto para los documentos de este hito» y «Tipo de documento
         que suele salir de aquí» (28-sep-2026, fila 201,
         docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md, apartado 1): rellenan de
         antemano el cuadro de «Cambiar el nombre» al añadir o nombrar
         un documento desde este hito (apartado 4). Campo de solo texto,
         sin necesidad de repintar en cada tecla: `recoger()` lo lee
         directamente del DOM, como el resto del paso. */
      var filaTextoDoc = document.createElement('div');
      filaTextoDoc.className = 'paso-texto-documentos-fila';
      filaTextoDoc.innerHTML =
        '<div class="etiqueta-con-boton">' +
          '<label class="etiqueta">Texto para los documentos de este hito ' +
            '<span class="suave">(opcional)</span></label>' +
          '<button type="button" class="boton boton-hueco paso-texto-documentos-boton">Insertar hueco</button>' +
        '</div>' +
        '<input class="campo paso-texto-documentos" value="' + U.escapar(p.textoDocumentos || '') + '">' +
        '<label class="etiqueta">Tipo de documento que suele salir de aquí ' +
          '<span class="suave">(opcional)</span></label>' +
        '<select class="campo paso-tipo-documento"><option value="">(sin elegir)</option>' +
        ((window.App && App.E && App.E.tiposDocumento) || []).map(function (t) {
          return '<option value="' + U.escapar(t) + '"' + (t === p.tipoDocumento ? ' selected' : '') + '>' +
            U.escapar(t) + '</option>';
        }).join('') + '</select>';
      d.appendChild(filaTextoDoc);
      if (window.HuecosBuscador) {
        HuecosBuscador.montar({
          boton: filaTextoDoc.querySelector('.paso-texto-documentos-boton'),
          campos: [filaTextoDoc.querySelector('.paso-texto-documentos')]
        });
      }
      /* Apartado 3, punto 4: la guardia de parecidos, también aquí. */
      if (window.GuiasBiblioteca) {
        var campoTextoDoc = filaTextoDoc.querySelector('.paso-texto-documentos');
        var avisoTextoDoc = document.createElement('div');
        avisoTextoDoc.className = 'paso-texto-documentos-parecido oculto';
        campoTextoDoc.insertAdjacentElement('afterend', avisoTextoDoc);
        var esperaTextoDoc = null;
        campoTextoDoc.addEventListener('input', function () {
          clearTimeout(esperaTextoDoc);
          var texto = campoTextoDoc.value.trim();
          if (!texto) { avisoTextoDoc.classList.add('oculto'); avisoTextoDoc.innerHTML = ''; return; }
          esperaTextoDoc = setTimeout(async function () {
            var parecido = await GuiasBiblioteca.textoDocumentosParecido(texto, { pasoId: p.id });
            if (!avisoTextoDoc.isConnected || campoTextoDoc.value.trim() !== texto) return;
            if (!parecido) { avisoTextoDoc.classList.add('oculto'); avisoTextoDoc.innerHTML = ''; return; }
            avisoTextoDoc.classList.remove('oculto');
            avisoTextoDoc.innerHTML = 'Ese mismo texto ya lo tiene ' + U.escapar(parecido.origen) + ' · ' +
              '<button type="button" class="enlace paso-texto-documentos-copiar">Copiarlo tal cual</button>';
            avisoTextoDoc.querySelector('.paso-texto-documentos-copiar').onclick = function () {
              campoTextoDoc.value = parecido.texto;
              avisoTextoDoc.classList.add('oculto');
              avisoTextoDoc.innerHTML = '';
            };
          }, 400);
        });
      }

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
            GuiasBiblioteca.engancharBoton(d, pasoActual, modelo, diffs, ctx.nombreTipo, function (origenNuevo) {
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
