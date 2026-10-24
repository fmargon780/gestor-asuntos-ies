/* ============================================================
   ficheros-de-google.js — los atajos que Google Drive deja en el disco
   (fila 456, 24-oct-2026, docs/PASAR-A-DRIVE.md).

   `.gdoc`, `.gsheet`, `.gslides`, `.gform`, `.gdraw`, `.gmap`, `.gsite` y
   `.gjam` solo son un enlace a la nube: no son documentos. No salen en las
   listas (documentos del asunto, «Por clasificar», ARCHIVO). Solo se
   esconden en las listas: al trasladar una carpeta se copian como
   cualquier otro fichero.

   Va cargado justo después de js/carpetas.js.
   ============================================================ */
(function () {
  var RE = /\.(gdoc|gsheet|gslides|gform|gdraw|gmap|gsite|gjam)$/i;
  window.Carpetas.esFicheroDeGoogle = function (nombre) { return RE.test(String(nombre || '')); };
})();
