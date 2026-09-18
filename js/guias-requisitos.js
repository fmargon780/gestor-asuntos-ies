/* ============================================================
   guias-requisitos.js — la sección "Lo que hay que reunir" del editor
   de un paso (18-sep-2026, fila 59, docs/REQUISITOS-DE-HITO.md).

   Aparte de js/guias.js porque ese fichero ya rondaba las 800 líneas
   (sección 8 del encargo). Este no sabe nada de "pasos" ni de
   "opciones": solo sabe pintar y leer una lista de requisitos dentro
   de un contenedor que le dan, con el mismo estilo imperativo del
   resto del editor de guías (leer todo lo escrito, mutar el array,
   volver a pintar).

   CÓMO SE USA (desde js/guias.js)

     d.insertAdjacentHTML('beforeend', GuiasRequisitos.bloqueHTML(p.requisitos));
     GuiasRequisitos.enganchar(d, function (mutador) {
       recoger();                       // relee todo lo demás del paso
       mutador(pasos[i].requisitos);    // añade, quita o mueve una fila
       pintar();                        // repinta el editor entero
     });

   Y en recoger(), para leer lo escrito en los campos de texto y las
   casillas antes de guardar o de repintar por otro motivo:

     pasos[i].requisitos = GuiasRequisitos.leer(caja);

   Se carga después de js/guias.js.
   ============================================================ */
var GuiasRequisitos = (function () {

  function nuevoId() {
    return 'r' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  }

  function filaHTML(r) {
    var nombreRadio = 'req-clase-' + U.escapar(r.id);
    return '<div class="requisito-fila" data-id="' + U.escapar(r.id) + '">' +
      '<input class="campo requisito-texto" value="' + U.escapar(r.texto) +
        '" placeholder="Qué hay que reunir">' +
      '<span class="requisito-clase">' +
        '<label><input type="radio" name="' + nombreRadio + '" class="requisito-clase-documento" value="documento"' +
          (r.clase === 'documento' ? ' checked' : '') + '> Documento</label>' +
        '<label><input type="radio" name="' + nombreRadio + '" class="requisito-clase-dato" value="dato"' +
          (r.clase === 'documento' ? '' : ' checked') + '> Dato</label>' +
      '</span>' +
      '<label class="interruptor requisito-obligatorio-fila">' +
        '<input type="checkbox" class="requisito-obligatorio"' + (r.obligatorio ? ' checked' : '') + '>' +
        '<span>Obligatorio</span>' +
      '</label>' +
      '<span class="requisito-mandos">' +
        '<button type="button" class="boton requisito-subir" title="Subir">↑</button>' +
        '<button type="button" class="boton requisito-bajar" title="Bajar">↓</button>' +
        '<button type="button" class="boton boton-peligro requisito-quitar" title="Quitar la fila">✕</button>' +
      '</span></div>';
  }

  /* El HTML de todo el bloque plegable, listo para insertar como hijo
     directo del recuadro del paso (o del subpaso). `requisitos` puede
     venir vacío o sin definir: un paso que nunca tuvo ninguno. */
  function bloqueHTML(requisitos) {
    var lista = requisitos || [];
    return '<details class="paso-requisitos">' +
      '<summary>Lo que hay que reunir' + (lista.length ? ' (' + lista.length + ')' : '') + '</summary>' +
      '<div class="requisitos-lista">' + lista.map(filaHTML).join('') + '</div>' +
      '<button type="button" class="boton boton-ancho requisito-anadir">+ Añadir</button>' +
      '</details>';
  }

  /* Lee el estado actual de las filas, tal y como están en el DOM
     dentro de `raiz` (el recuadro del paso o del subpaso). Nunca
     descarta una fila con el texto vacío: eso lo decide, al guardar,
     `Guias.normalizarRequisitos` — aquí hace falta que el índice de
     cada fila se corresponda siempre con el de `pasos[i].requisitos`,
     para que quitar/subir/bajar por posición no se equivoque de fila. */
  function leer(raiz) {
    var filas = raiz.querySelectorAll(':scope > .paso-requisitos > .requisitos-lista > .requisito-fila');
    return Array.prototype.map.call(filas, function (fila) {
      var documento = fila.querySelector('.requisito-clase-documento');
      return {
        id: fila.dataset.id || nuevoId(),
        texto: fila.querySelector('.requisito-texto').value.trim(),
        clase: (documento && documento.checked) ? 'documento' : 'dato',
        obligatorio: fila.querySelector('.requisito-obligatorio').checked
      };
    });
  }

  /* Engancha "+ Añadir" y los mandos de cada fila ya pintada dentro de
     `raiz` (el bloqueHTML() que se acaba de insertar). `alCambiar`
     recibe una función `mutador(listaDeRequisitos)` que quien llama
     aplica sobre su propio array (empujar, quitar, intercambiar) antes
     de volver a pintar: este fichero no toca `pasos` para nada, solo
     sabe de índices dentro de la lista que le enseñan. */
  function enganchar(raiz, alCambiar) {
    var det = raiz.querySelector(':scope > .paso-requisitos');
    if (!det) return;

    var anadir = det.querySelector(':scope > .requisito-anadir');
    if (anadir) {
      anadir.onclick = function () {
        alCambiar(function (lista) {
          lista.push({ id: nuevoId(), texto: '', clase: 'documento', obligatorio: false });
        });
      };
    }

    var filas = det.querySelectorAll(':scope > .requisitos-lista > .requisito-fila');
    Array.prototype.forEach.call(filas, function (fila, idx) {
      var subir = fila.querySelector('.requisito-subir');
      var bajar = fila.querySelector('.requisito-bajar');
      var quitar = fila.querySelector('.requisito-quitar');
      if (subir) subir.onclick = function () {
        alCambiar(function (lista) {
          if (idx === 0) return;
          var t = lista[idx - 1]; lista[idx - 1] = lista[idx]; lista[idx] = t;
        });
      };
      if (bajar) bajar.onclick = function () {
        alCambiar(function (lista) {
          if (idx === lista.length - 1) return;
          var t = lista[idx + 1]; lista[idx + 1] = lista[idx]; lista[idx] = t;
        });
      };
      if (quitar) quitar.onclick = function () {
        alCambiar(function (lista) { lista.splice(idx, 1); });
      };
    });
  }

  return { bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar };
})();
window.GuiasRequisitos = GuiasRequisitos;
