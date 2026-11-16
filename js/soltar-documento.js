/* ============================================================
   soltar-documento.js — arrastrar un fichero a la app (fila 686,
   docs/686-ANADIR-DOCUMENTO-MAS-SENCILLO.md).

   Un fichero soltado en el cuadro de Documentos o encima de cualquier
   tarea (o de la zona de trabajo del hito) entra en el asunto SIN hito
   ni tarea y sin preguntar la tarea: sale el cuadro del nombre de
   siempre (js/documentos.js). Después se puede colgar de una tarea con
   «Colgar de una tarea», como cualquier documento «sin tarea» (fila 680).

   Soltar ya no marca solo la tarea «Añadir documento» (como hacía la
   zona de trabajo, fila 109): solo marca quien pulsa su botón.

   Si el cuadro de Documentos ya tiene un documento a medias, soltar otro
   no hace nada y avisa. Un directivo no guarda documentos (fila 287).
   Soltar varios ficheros a la vez: entra el primero.
   ============================================================ */
var SoltarDocumento = (function () {
  /* Engancha `zona` para recibir ficheros del asunto `a`. Se puede volver a
     llamar con la misma zona (los repintados de la mesa): sustituye lo anterior. */
  function enganchar(zona, a) {
    if (!zona) return;
    zona.ondragover = function (ev) {
      if (!traeFicheros(ev)) return;
      ev.preventDefault();
      ev.stopPropagation();
      zona.classList.add('encima');
    };
    zona.ondragleave = function (ev) {
      if (!ev.relatedTarget || !zona.contains(ev.relatedTarget)) zona.classList.remove('encima');
    };
    zona.ondrop = function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      zona.classList.remove('encima');
      var ficheros = ev.dataTransfer && ev.dataTransfer.files;
      if (!ficheros || !ficheros.length) return;
      if (window.Perfil && Perfil.esDirectivo()) return;   /* fila 287 */
      soltado(a, ficheros[0]);
    };
  }

  function desenganchar(zona) {
    if (!zona) return;
    zona.ondragover = zona.ondragleave = zona.ondrop = null;
    zona.classList.remove('encima');
  }

  function traeFicheros(ev) {
    var t = ev.dataTransfer && ev.dataTransfer.types;
    return !t || Array.prototype.indexOf.call(t, 'Files') !== -1;
  }

  function soltado(a, fichero) {
    if (window.Documentos && Documentos.soltarFichero) Documentos.soltarFichero(a, fichero);
  }

  return { enganchar: enganchar, desenganchar: desenganchar };
})();
window.SoltarDocumento = SoltarDocumento;
