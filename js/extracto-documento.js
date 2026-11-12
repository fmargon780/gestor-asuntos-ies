/* ============================================================
   extracto-documento.js — el botón «Extracto» de cada documento (fila 627, docs/627-ASUNTO-Y-EXTRACTO.md).

   Sale al lado de «Ruta» en los dos sitios donde sale «Ruta» de un documento del asunto: «Documentos» del hito (la mesa)
   y «Documentos de la carpeta» (la ficha). Copia el extracto de ese documento: el de su tipo de documento, o el general,
   relleno con los datos del asunto y de ese documento, con sus saltos de línea (`AsuntoExtracto.extractoDeDocumento`).
   Sale en todos los documentos, también en los ya registrados. Con solo consulta se puede copiar.

       ExtractoDocumento.boton(a, nombre)       el botón, listo para colgar de una fila
       ExtractoDocumento.huecoHTML(nombre)      un hueco para filas que se pintan como texto
       ExtractoDocumento.enganchar(raiz, a)     rellena los huecos de `raiz` con el botón
   ============================================================ */
var ExtractoDocumento = (function () {

  async function copiar(a, nombre, boton) {
    var texto = '';
    try { texto = await AsuntoExtracto.extractoDeDocumento(a, nombre); }
    catch (e) { U.aviso('No he podido componer el extracto: ' + U.mensajeDeError(e), 'malo'); return; }
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    var ok = await U.copiar(texto, boton, { avisoFallo: 'No he podido copiarlo. Es ' + texto + '.' });
    if (ok) U.aviso('Extracto copiado', 'bueno');
  }

  function boton(a, nombre) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-chico boton-copiar-fila extracto-documento';
    b.textContent = 'Extracto';
    b.setAttribute('data-ayuda-clave', 'copiar-el-extracto-de-este-documento');
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      copiar(a, nombre, b);
    };
    return b;
  }

  function huecoHTML(nombre) {
    return '<span class="extracto-documento-lugar" data-doc="' + U.escapar(nombre) + '"></span>';
  }

  function enganchar(raiz, a) {
    if (!raiz || !a) return;
    Array.prototype.forEach.call(raiz.querySelectorAll('.extracto-documento-lugar'), function (l) {
      l.innerHTML = '';
      l.appendChild(boton(a, l.dataset.doc));
    });
  }

  return { boton: boton, huecoHTML: huecoHTML, enganchar: enganchar };
})();
window.ExtractoDocumento = ExtractoDocumento;
