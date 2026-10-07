/* ============================================================
   guias-biblioteca-guardias.js — apartados 2 y 3 de
   docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md (28-sep-2026, fila 201):

     1. De dónde viene cada hito de una guía (la etiqueta, siempre a
        la vista, del editor: js/guias-paso-bloques.js la pinta).
     2. La biblioteca se ofrece sola al escribir el título de un paso
        nuevo (busca con `U.parecidos`; la pintura, otra vez, en
        js/guias-paso-bloques.js).
     3. Cuántos tipos, además del actual, usan ya un modelo («lo usan
        N tipos más»), para la pregunta de una sola frase que ya
        reescribe js/guias-biblioteca.js al guardar un paso cambiado.
     4. La guardia de parecidos del texto de los documentos (de un
        hito o de un tipo de documento), contra cualquier otro sitio
        que ya tenga el mismo texto.

   Sacado de js/guias-biblioteca.js en la misma fila (416 líneas:
   "pártelo antes de seguir metiendo código"). Extiende el mismo
   `GuiasBiblioteca` (un solo nombre hacia fuera); se carga justo
   después de js/guias-biblioteca.js.
   ============================================================ */
(function () {
  if (typeof GuiasBiblioteca === 'undefined') return;

  /* ==========================================================
     1. DE DÓNDE VIENE CADA HITO (apartado 2)

     Una etiqueta pequeña, siempre a la vista (no está dentro de ningún
     `<details>`, así que no se pliega con el resto del hito): «De la
     biblioteca», «De la biblioteca · cambiado aquí» o «Propio de este
     tipo». Pulsarla (si viene de la biblioteca) abre, debajo, el
     nombre del modelo y «Ver en la biblioteca», que abre el mismo
     editor que «Cambiar» en Ajustes → El centro → Biblioteca de hitos
     (js/guias-biblioteca-ajustes.js): no hay un segundo camino.
     ========================================================== */

  function etiquetaOrigen(p) {
    if (p && p.origenBiblioteca && p.origenBiblioteca.divergido) {
      return { texto: 'De la biblioteca · cambiado aquí', clase: 'cambiado' };
    }
    if (p && p.origenBiblioteca) return { texto: 'De la biblioteca', clase: 'biblioteca' };
    return { texto: 'Propio de este tipo', clase: 'propio' };
  }

  function chipOrigenHTML(p) {
    var e = etiquetaOrigen(p);
    var puedeAbrir = !!(p && p.origenBiblioteca);
    return '<button type="button" class="chip-origen chip-origen-' + e.clase + '"' +
      (puedeAbrir ? '' : ' disabled') + '>' + U.escapar(e.texto) + '</button>' +
      (puedeAbrir ? '<div class="chip-origen-panel oculto"></div>' : '');
  }

  /* `raiz` es el `.paso-cabecera` donde ya está chipOrigenHTML(). */
  function engancharChipOrigen(raiz, p) {
    var boton = raiz.querySelector(':scope > .chip-origen');
    var panel = raiz.querySelector(':scope > .chip-origen-panel');
    if (!boton || !panel || !p.origenBiblioteca) return;
    boton.onclick = async function () {
      var abrir = panel.classList.contains('oculto');
      panel.classList.toggle('oculto');
      if (!abrir) return;
      panel.textContent = 'Buscando…';
      var biblioteca;
      try { biblioteca = await HitosBiblioteca.leer(); } catch (e) { biblioteca = null; }
      if (!panel.isConnected) return;
      var modelo = biblioteca ? HitosBiblioteca.buscar(biblioteca, p.origenBiblioteca.id) : null;
      if (!modelo) { panel.innerHTML = '<p class="nota">Ese modelo ya no está en la biblioteca.</p>'; return; }
      panel.innerHTML = '<p><strong>' + U.escapar(modelo.nombre) + '</strong></p>' +
        '<button type="button" class="enlace chip-origen-ver">Ver en la biblioteca</button>';
      panel.querySelector('.chip-origen-ver').onclick = function () {
        if (window.GuiasBiblioteca && GuiasBiblioteca.editarModeloPorId) GuiasBiblioteca.editarModeloPorId(modelo.id);
      };
    };
  }

  /* ==========================================================
     2. LA BIBLIOTECA SE OFRECE SOLA (apartado 3, punto 1): la
     búsqueda al escribir el título de un paso nuevo. La pintura vive
     en js/guias-paso-bloques.js; aquí solo la parte con datos: los
     modelos que se parecen al título que se está escribiendo.
     ========================================================== */

  async function modelosParecidosATitulo(titulo) {
    if (!titulo || titulo.trim().length < 3) return [];
    var biblioteca;
    try { biblioteca = await HitosBiblioteca.leer(); } catch (e) { return []; }
    var nombres = biblioteca.modelos.map(function (m) { return m.nombre; });
    var cerca = U.parecidos(titulo.trim(), nombres);
    return cerca.map(function (c) {
      return biblioteca.modelos.filter(function (m) { return m.nombre === c.nombre; })[0];
    }).filter(Boolean);
  }

  /* ==========================================================
     3. «LO USAN N TIPOS MÁS» (apartado 3, punto 2): cuántos tipos,
     además de `nombreTipoActual`, usan ya este modelo. La pregunta de
     una sola frase, con los dos botones, la escribe
     js/guias-biblioteca.js (engancharBoton y revisarAlGuardar).
     ========================================================== */

  async function otrosTiposQueUsan(idModelo, nombreTipoActual) {
    if (!window.App || !App.E || !App.E.gestor) return 0;
    try {
      var guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
      var tipos = HitosBiblioteca.tiposQueUsan(idModelo, guias || {});
      return tipos.filter(function (t) { return t !== nombreTipoActual; }).length;
    } catch (e) { return 0; }
  }

  /* Fila 297: `tituloHito` (el que tenía al abrir) y `contador` ('(1 de 3)')
     son opcionales; sin ellos, la frase de siempre. */
  function preguntaCambioSoloAqui(nombreTipo, otros, tituloHito, contador) {
    var cabeza = tituloHito ? (contador ? contador + ' ' : '') + 'Has cambiado el hito «' + tituloHito + '». ' : '';
    return cabeza + (tituloHito ? '¿Es solo para ' : '¿Este cambio es solo para ') + nombreTipo + ', o también para la biblioteca?' +
      (otros > 0 ? ' (lo usan ' + otros + (otros === 1 ? ' tipo más' : ' tipos más') + ')' : '');
  }

  /* ==========================================================
     4. LA GUARDIA DE PARECIDOS DEL TEXTO DE LOS DOCUMENTOS (apartado
     3, punto 4): contra el texto de cualquier otro hito (de cualquier
     tipo), de cualquier modelo de la biblioteca, y del «Texto por
     defecto» de cualquier tipo de documento. `evitar` es
     { pasoId } o { modeloId } o { tipoDocumento }: el propio sitio
     donde se está escribiendo, para no avisar de que se parece a sí
     mismo. Devuelve { texto, origen } del primero que encuentra igual
     (salvo tildes, mayúsculas y espacios), o null si no hay ninguno.
     ========================================================== */

  async function textoDocumentosParecido(texto, evitar) {
    var limpio = U.normalizar(texto);
    if (!limpio) return null;
    evitar = evitar || {};

    try {
      var biblioteca = await HitosBiblioteca.leer();
      for (var i = 0; i < biblioteca.modelos.length; i++) {
        var m = biblioteca.modelos[i];
        if (evitar.modeloId === m.id) continue;
        if (m.textoDocumentos && U.normalizar(m.textoDocumentos) === limpio) {
          return { texto: m.textoDocumentos, origen: 'el hito «' + m.nombre + '» de la biblioteca' };
        }
      }
    } catch (e) { /* sin biblioteca legible, se pasa por alto */ }

    if (window.App && App.E && App.E.gestor) {
      try {
        var guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
        var encontrado = null;
        Object.keys(guias || {}).forEach(function (tipo) {
          (function recorrer(pasos) {
            (pasos || []).forEach(function (p) {
              if (encontrado || evitar.pasoId === p.id) return;
              if (p.textoDocumentos && U.normalizar(p.textoDocumentos) === limpio) {
                encontrado = { texto: p.textoDocumentos, origen: 'el hito «' + (p.titulo || 'sin título') + '» de ' + tipo };
                return;
              }
              (p.opciones || []).forEach(function (o) { recorrer(o.pasos); });
            });
          })(guias[tipo]);
        });
        if (encontrado) return encontrado;
      } catch (e) { /* sin guías legibles, se pasa por alto */ }
    }

    try {
      var tipos = (window.App && App.E && App.E.tiposDocumento) || [];
      for (var j = 0; j < tipos.length; j++) {
        if (evitar.tipoDocumento === tipos[j]) continue;
        var td = (window.Campos && Campos.textoPorDefectoDeDocumento) ? Campos.textoPorDefectoDeDocumento(App.E.campos, tipos[j]) : '';
        if (td && U.normalizar(td) === limpio) return { texto: td, origen: 'el tipo de documento «' + tipos[j] + '»' };
      }
    } catch (e) { /* sin tipos, se pasa por alto */ }

    return null;
  }

  Object.assign(GuiasBiblioteca, {
    etiquetaOrigen: etiquetaOrigen, chipOrigenHTML: chipOrigenHTML, engancharChipOrigen: engancharChipOrigen,
    modelosParecidosATitulo: modelosParecidosATitulo,
    otrosTiposQueUsan: otrosTiposQueUsan, preguntaCambioSoloAqui: preguntaCambioSoloAqui,
    textoDocumentosParecido: textoDocumentosParecido
  });
})();
