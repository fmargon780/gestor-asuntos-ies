/* ============================================================
   guias-biblioteca-guardias.js — dos ayudas del editor de la guía que
   miran en las guías de todos los tipos (fila 417,
   docs/HITOS-UN-SOLO-SITIO.md, parte B; nacieron en la fila 201,
   docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md):

     1. «En «<tipo>» hay "…" · Usarlo»: al escribir el título de un hito
        nuevo, los hitos de otras guías (y los de «Sin tipo») que se le
        parecen (la pintura, en js/guias-paso-bloques.js).
     2. La guardia de parecidos del texto de los documentos (de un hito
        o de un tipo de documento), contra cualquier otro sitio que ya
        tenga el mismo texto.

   Ya no hay etiqueta de origen ni «lo usan N tipos más». Extiende el
   mismo `GuiasBiblioteca`; se carga justo después de js/guias-biblioteca.js.
   ============================================================ */
(function () {
  if (typeof GuiasBiblioteca === 'undefined') return;

  /* ==========================================================
     «USARLO» AL ESCRIBIR EL TÍTULO: los hitos de otras guías (y los
     modelos de «Sin tipo») que se parecen al título que se está
     escribiendo. Devuelve [{ tipo, titulo, hito | modelo }].
     ========================================================== */

  async function modelosParecidosATitulo(titulo, tipoActual, idPasoActual) {
    if (!titulo || titulo.trim().length < 3) return [];
    var guias = (window.GuiasDelCentro && GuiasDelCentro.todas) ? GuiasDelCentro.todas() : {};
    var items = [];
    HitosBiblioteca.hitosDeOtrosTipos(guias, tipoActual).forEach(function (g) {
      g.hitos.forEach(function (p) {
        if (p.id !== idPasoActual) items.push({ tipo: g.tipo, titulo: p.titulo, hito: p });
      });
    });
    try {
      HitosBiblioteca.modelosSinTipo(await HitosBiblioteca.leer(), guias).forEach(function (m) {
        items.push({ tipo: 'Sin tipo', titulo: m.nombre, modelo: m });
      });
    } catch (e) { /* sin biblioteca legible, solo las guías */ }
    var cerca = U.parecidos(titulo.trim(), items.map(function (it) { return it.titulo; }));
    var salida = [];
    cerca.forEach(function (c) {
      items.forEach(function (it) { if (it.titulo === c.nombre && salida.indexOf(it) === -1) salida.push(it); });
    });
    return salida;
  }

  /* ==========================================================
     LA GUARDIA DE PARECIDOS DEL TEXTO DE LOS DOCUMENTOS: contra el texto
     de cualquier otro hito (de cualquier tipo) y del «Texto por
     defecto» de cualquier tipo de documento. `evitar` es
     { pasoId } o { tipoDocumento }: el propio sitio
     donde se está escribiendo, para no avisar de que se parece a sí
     mismo. Devuelve { texto, origen } del primero que encuentra igual
     (salvo tildes, mayúsculas y espacios), o null si no hay ninguno.
     ========================================================== */

  async function textoDocumentosParecido(texto, evitar) {
    var limpio = U.normalizar(texto);
    if (!limpio) return null;
    evitar = evitar || {};

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
    modelosParecidosATitulo: modelosParecidosATitulo,
    textoDocumentosParecido: textoDocumentosParecido
  });
})();
