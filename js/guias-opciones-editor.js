/* ============================================================
   guias-opciones-editor.js — en el cuadro de escribir la guía, las
   opciones de un paso-pregunta y los pasos de cada opción. Sacado de
   js/guias.js (24-sep-2026, fila 122, docs/GUIA-EN-ACORDEON.md: aquel
   fichero pasaba de las 1.200 líneas).

   `GuiasOpcionesEditor.caja(c, p, i)` devuelve la caja de opciones del
   paso `p` (posición `i` del nivel que se ve). `c` es lo que el editor
   le presta: { nivel(), recoger, pintar, entrar(p, opcion),
   prepararRecuadro(el), restaurar(det, i, idSubpaso), plegado } (este
   último, js/guias-plegado.js, para que un paso nuevo salga abierto).
   ============================================================ */
var GuiasOpcionesEditor = (function () {

  /* Las opciones de un paso-pregunta, cada una con sus propios nivel.
     Todo lo que cambia la lista hace lo mismo: recoger lo escrito,
     tocar el array y volver a pintar. */
  function caja(c, p, i) {
    var nivel = c.nivel(), recoger = c.recoger, pintar = c.pintar;
    var caja = document.createElement('div');
    caja.className = 'paso-opciones';

    var explica = document.createElement('p');
    explica.className = 'explica';
    explica.textContent = 'Dentro del asunto se elige una opción, y solo salen los ' +
                          'pasos de la elegida.';
    caja.appendChild(explica);

    p.opciones.forEach(function (o, j) {
      var oc = document.createElement('div');
      oc.className = 'opcion-editor';
      oc.dataset.id = o.id;
      oc.innerHTML =
        '<div class="opcion-cabecera">' +
          '<input class="campo opcion-titulo" value="' + U.escapar(o.titulo) + '" ' +
          'placeholder="Nombre de la opción. Por ejemplo: la hemos recibido en mano">' +
        '</div>' +
        '<div class="opcion-pasos"></div>';

      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'boton boton-peligro';
      quitar.textContent = 'Quitar la opción';
      quitar.title = 'Quitar esta opción y sus pasos';
      quitar.onclick = function () {
        recoger();
        nivel[i].opciones.splice(j, 1);
        pintar();
      };
      oc.querySelector('.opcion-cabecera').appendChild(quitar);

      var dentro = oc.querySelector('.opcion-pasos');
      o.pasos.forEach(function (sp, k) {
        var sc = document.createElement('div');
        sc.className = 'subpaso-editor';
        sc.dataset.id = sp.id;
        sc.dataset.pasoId = sp.id;   /* fila 122, js/guias-plegado.js */

        /* Fila 95: un paso de una opción que es a su vez una pregunta
           no se dibuja anidado (recuadros dentro de recuadros no se
           leen): una línea con su título, la marca y «Entrar», que
           enseña los pasos de sus opciones en este mismo cuadro. */
        var subPregunta = Guias.esPregunta(sp);
        sc.innerHTML =
          '<div class="paso-cabecera">' +
            '<input class="campo subpaso-titulo" value="' + U.escapar(sp.titulo) + '" ' +
            'placeholder="' + (subPregunta ? 'La pregunta' : 'Título corto del paso') + '">' +
            (subPregunta ? '<span class="marca-pregunta">pregunta</span>' : '') +
          '</div>' +
          (subPregunta ? '' : '<div class="paso-cuerpo subpaso-cuerpo" contenteditable="true" ' +
            'data-vacio="Explicación del paso">' + Guias.limpiar(sp.cuerpo) + '</div>');

        if (subPregunta) {
          var entrarB = document.createElement('button');
          entrarB.type = 'button';
          entrarB.className = 'boton boton-principal subpaso-entrar';
          entrarB.textContent = 'Entrar';
          entrarB.title = 'Ver y escribir las opciones de esta pregunta';
          entrarB.onclick = function () {
            recoger();
            /* Se entra en el nivel donde está la pregunta (los pasos de
               esta opción): ahí se ve entera, con sus opciones. */
            c.entrar(nivel[i], nivel[i].opciones[j]);
            var aqui = document.querySelector('#guia-pasos .paso-editor[data-pos="' + k + '"]');
            if (aqui && aqui.scrollIntoView) aqui.scrollIntoView({ block: 'start' });
          };
          sc.querySelector('.paso-cabecera').appendChild(entrarB);
        }

        var fuera = document.createElement('button');
        fuera.type = 'button';
        fuera.className = 'boton boton-peligro';
        fuera.textContent = 'Quitar';
        fuera.onclick = function () {
          recoger();
          nivel[i].opciones[j].pasos.splice(k, 1);
          pintar();
        };
        sc.querySelector('.paso-cabecera').appendChild(fuera);

        if (!subPregunta) {
          c.prepararRecuadro(sc.querySelector('.subpaso-cuerpo'));
          if (window.GuiasRequisitos) {
            sc.insertAdjacentHTML('beforeend', GuiasRequisitos.bloqueHTML(sp.requisitos));
            c.restaurar(sc.querySelector(':scope > .paso-requisitos'), i, sp.id);
            GuiasRequisitos.enganchar(sc, function (mutador) {
              recoger();
              mutador(nivel[i].opciones[j].pasos[k].requisitos);
              pintar();
            });
          }
          if (window.GuiasComunicacion) {
            sc.insertAdjacentHTML('beforeend', GuiasComunicacion.bloqueHTML(sp.id, sp.comunicacion));
            c.restaurar(sc.querySelector(':scope > .paso-comunicacion'), i, sp.id);
            GuiasComunicacion.enganchar(sc, sp.id);
          }
          if (window.GuiasDocumentos) {
            sc.insertAdjacentHTML('beforeend', GuiasDocumentos.bloqueHTML(sp.plantillasDocumento));
            c.restaurar(sc.querySelector(':scope > .paso-documentos'), i, sp.id);
            GuiasDocumentos.enganchar(sc);
          }
          if (window.GuiasGuion) {   /* fila 109 */
            sc.insertAdjacentHTML('beforeend', GuiasGuion.bloqueHTML(sp.guion));
            c.restaurar(sc.querySelector(':scope > .paso-guion'), i, sp.id);
            GuiasGuion.enganchar(sc, function (mutador) {
              recoger(); var spx = nivel[i].opciones[j].pasos[k]; mutador(spx.guion = spx.guion || []); pintar();
            });
          }
        }

        /* La misma casilla que un paso de arriba (fila 95). */
        var filaPreg = document.createElement('label');
        filaPreg.className = 'interruptor paso-es-pregunta-fila';
        filaPreg.innerHTML = '<input type="checkbox" class="subpaso-es-pregunta"' +
          (subPregunta ? ' checked' : '') + '><span>Este paso es una pregunta</span>';
        sc.appendChild(filaPreg);
        filaPreg.querySelector('.subpaso-es-pregunta').onchange = function () {
          recoger();
          var el = nivel[i].opciones[j].pasos[k];
          if (this.checked && !el.opciones.length) {
            el.opciones = [
              { id: Guias.nuevoId(), titulo: '', pasos: [] },
              { id: Guias.nuevoId(), titulo: '', pasos: [] }
            ];
          }
          pintar();
        };

        dentro.appendChild(sc);
      });

      var mas = document.createElement('button');
      mas.type = 'button';
      mas.className = 'boton boton-ancho';
      mas.textContent = '+ Añadir un paso a esta opción';
      mas.onclick = function () {
        recoger();
        var nuevo = { id: Guias.nuevoId(), titulo: '', cuerpo: '', opciones: [], requisitos: [], comunicacion: null };
        nivel[i].opciones[j].pasos.push(nuevo);
        /* Fila 122: el paso nuevo, ya abierto y con el cursor en su título. */
        if (c.plegado) c.plegado.abrir(nuevo.id);
        pintar();
        if (c.plegado) c.plegado.alTitulo(nuevo.id);
      };
      oc.appendChild(mas);

      caja.appendChild(oc);
    });

    var otra = document.createElement('button');
    otra.type = 'button';
    otra.className = 'boton boton-ancho';
    otra.textContent = '+ Añadir otra opción';
    otra.onclick = function () {
      recoger();
      nivel[i].opciones.push({ id: Guias.nuevoId(), titulo: '', pasos: [] });
      pintar();
    };
    caja.appendChild(otra);

    return caja;
  }


  return { caja: caja };
})();
window.GuiasOpcionesEditor = GuiasOpcionesEditor;
