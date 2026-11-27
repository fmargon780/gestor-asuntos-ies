/* ============================================================
   ruta-chromebook.js — «Ruta» y «Abrir en Drive» en un Chromebook
   (fila 770, docs/770-LA-APP-DESDE-UN-CHROMEBOOK.md).

   En un Chromebook la ventana «Abrir archivo» no entiende una ruta
   escrita como en Windows (`G:\Mi unidad\...`), pero su lupa encuentra
   una carpeta de Drive por su nombre. Solo ahí:
     - «Ruta» (el de la ficha, el hito, el registro de grupo, los cuadros
       de Correo y de Séneca y el de cada documento) copia SOLO el nombre
       de la carpeta del asunto o del documento y no pide ninguna ruta;
     - junto a «Ruta» sale «Abrir en Drive»: abre en otra pestaña la
       búsqueda de la carpeta del asunto en Google Drive, con la cuenta
       común de Administración;
     - «Comprobación al entrar» no habla de la ruta de la nube.
   En los demás ordenadores no cambia nada.

   `window.__ES_CHROMEBOOK__` (true/false) manda sobre el navegador: es el
   punto de las pruebas.
   ============================================================ */
window.RutaChromebook = (function () {

  function activo() {
    if (typeof window.__ES_CHROMEBOOK__ === 'boolean') return window.__ES_CHROMEBOOK__;
    return /\bCrOS\b/.test((window.navigator && navigator.userAgent) || '');
  }

  /* Lo que se copia: el nombre del documento, o el de la carpeta del asunto. */
  function nombreDe(a, doc) {
    return String((doc && doc.nombre) || (a && a.nombre) || '');
  }

  /* Copia el nombre y avisa. Devuelve la promesa de U.copiar. */
  function copiar(a, doc, boton) {
    var nombre = nombreDe(a, doc);
    return U.copiar(nombre, boton, { avisoFallo: 'No he podido copiarlo. Es ' + nombre + '.' })
      .then(function (ok) {
        if (ok) U.aviso('Copiado: ' + nombre + '. Pégalo en la lupa de la ventana «Abrir archivo».', 'bueno');
        return ok;
      });
  }

  function cuentaComun() {
    var d = window.Plantillas && Plantillas.enMemoria && Plantillas.enMemoria();
    return (d && d.cuentaAdministracion) || (window.Plantillas && Plantillas.POR_DEFECTO_CUENTA_ADMIN) || '';
  }

  function direccionDrive(a) {
    var url = 'https://drive.google.com/drive/search?q=' + encodeURIComponent(nombreDe(a));
    var cuenta = cuentaComun();
    return cuenta ? url + '&authuser=' + encodeURIComponent(cuenta) : url;
  }

  function botonDrive(a) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-copiar-fila';
    b.id = 'ficha-abrir-en-drive';
    b.textContent = 'Abrir en Drive';
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      window.open(direccionDrive(a), '_blank', 'noopener');
    };
    return b;
  }

  return { activo: activo, copiar: copiar, direccionDrive: direccionDrive, botonDrive: botonDrive };
})();
