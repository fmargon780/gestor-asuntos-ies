/* ============================================================
   plantillas-descargar.js — «Descargar el Word» de una plantilla
   (fila 748, docs/748-DESCARGAR-EL-WORD-DE-UNA-PLANTILLA.md).

   En Herramientas › Plantillas › Word, el menú «⋮» de cada plantilla baja
   su fichero .docx tal cual, con su nombre y sus huecos escritos como están,
   para cambiarle el formato en Word. Para devolverlo se usa «Sustituir el
   fichero…». No escribe nada en la carpeta: sirve también en solo consulta.
   ============================================================ */
var PlantillasDescargar = (function () {

  /* Baja el .docx de la plantilla `p`. Devuelve true si se descargó; false si no se encontró el fichero
     (y entonces ya ha avisado). `alFaltar` se llama cuando no está, para marcar «Falta el fichero». */
  async function descargar(p, alFaltar) {
    var file;
    try {
      var dir = await PlantillasDocumento._interno.carpetaDePlantillas();
      var h = await dir.getFileHandle(p.fichero);
      file = await h.getFile();
    } catch (e) {
      if (typeof alFaltar === 'function') alFaltar();
      U.aviso('No encuentro «' + p.fichero + '» en la carpeta de plantillas.', 'malo');
      return false;
    }
    try {
      var direccion = URL.createObjectURL(file);
      var enlace = document.createElement('a');
      enlace.href = direccion;
      enlace.download = p.fichero;
      enlace.style.display = 'none';
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      setTimeout(function () { URL.revokeObjectURL(direccion); }, 10000);
    } catch (e) {
      U.aviso('No he podido descargar «' + p.fichero + '»: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
    U.aviso('Descargado «' + p.fichero + '». Cámbialo en Word sin tocar lo que va entre llaves y, para devolverlo, usa «Sustituir el fichero…».');
    return true;
  }

  return { descargar: descargar };
})();
