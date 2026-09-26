/* ============================================================
   nombres-topes.js — cuánto hueco queda para el nombre del asunto y
   para el del documento, contando la ruta completa dentro de Dropbox
   (fila 177, docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2).

   Antes los topes eran fijos (150 y 120, en js/nombres.js) y solo
   miraban el nombre. Pero lo que de verdad no puede pasar de largo es
   la RUTA ENTERA dentro de Dropbox (Windows deja de sincronizarla a
   partir de 260 caracteres): la carpeta de Dropbox en este ordenador,
   lo de dentro de Dropbox hasta el ARCHIVO, la categoría, el tercero,
   el nombre del asunto y, para un documento, además la subcarpeta
   "Versiones previas" y su propio nombre. Se deja margen: tope 240.

   Se carga después de js/nombres.js (usa Nombres.CATEGORIAS) y de
   js/copiar-ruta.js (usa RutaCarpetas.comunActual()). Sin alguno de
   los dos, no hace nada: js/nombres.js sigue con sus topes fijos.
   ============================================================ */
(function () {
  if (typeof Nombres === 'undefined') return;

  var TOPE_RUTA_TOTAL = 240;
  var RAIZ_DROPBOX_POR_DEFECTO = 45;     /* "C:\Users\<usuario largo>\Dropbox\" */
  var CLAVE_DROPBOX = 'gestor-ruta-dropbox';
  var SUBCARPETA_VERSIONES = 'Versiones previas';
  /* Sin tercero conocido todavía (por ejemplo, al calcular el tope
     antes de elegirlo): un nombre largo de verdad, con dos apellidos
     y el documento (mejor pasarse por poco que quedarse corto). */
  var TERCERO_LARGO_POR_DEFECTO = 50;

  function categoriaMasLarga() {
    var largo = 0;
    (Nombres.CATEGORIAS || []).forEach(function (c) { if (c.length > largo) largo = c.length; });
    return largo;
  }

  /* La raíz de Dropbox EN ESTE ORDENADOR: 45 por defecto, o lo
     apuntado en este navegador si es más largo (no lo deducido de la
     copia sin internet: ese ya se sabe corto, y lo que importa aquí
     es no quedarse corto en el peor caso). */
  function raizDropbox() {
    var apuntada = '';
    try { apuntada = (window.localStorage.getItem(CLAVE_DROPBOX) || '').trim(); } catch (e) { /* sin memoria */ }
    return Math.max(RAIZ_DROPBOX_POR_DEFECTO, apuntada.length);
  }

  /* Lo de dentro de Dropbox hasta la carpeta ARCHIVO (más larga que
     la de abiertos, por eso manda), de `_GESTOR/rutas.json`. Vacío si
     todavía no se ha cargado en esta sesión (RutaCarpetas.cargarComun()). */
  function dentroDropboxDelArchivo() {
    var rc = window.RutaCarpetas;
    if (!rc || typeof rc.comunActual !== 'function') return 0;
    var c = rc.comunActual();
    return (c && c.archivo) ? String(c.archivo).length : 0;
  }

  /* `opciones.tercero`: el nombre del tercero ya montado (el que
     escribe terceroAlumno, terceroPersonal...), si ya se conoce.
     `opciones.nombreAsunto`: el nombre YA PUESTO de la carpeta del
     asunto (para calcular el tope del documento con la ruta real, no
     con el peor caso, cuando el asunto ya existe). */
  function topes(opciones) {
    opciones = opciones || {};
    var terceroLargo = opciones.tercero ? String(opciones.tercero).length : TERCERO_LARGO_POR_DEFECTO;
    var fijo = raizDropbox() + 1 + dentroDropboxDelArchivo() + 1 + categoriaMasLarga() + 1 + terceroLargo;
    var asunto = Math.max(0, TOPE_RUTA_TOTAL - fijo - 1);
    var documento;
    if (opciones.nombreAsunto) {
      /* El asunto ya existe: se cuenta su nombre de verdad, no el peor
         caso, para no reservar de más. */
      documento = Math.max(0, TOPE_RUTA_TOTAL - fijo - 1 - String(opciones.nombreAsunto).length -
        1 - SUBCARPETA_VERSIONES.length - 1);
    } else {
      /* Todavía no se sabe cómo se llamará el asunto (por ejemplo, al
         montar la vista previa de un documento suelto): no se dobla la
         reserva suponiendo el peor caso también aquí, que dejaría sin
         hueco casi cualquier documento normal. Se deja el mismo margen
         que al asunto, menos la subcarpeta de versiones. */
      documento = Math.max(0, asunto - 1 - SUBCARPETA_VERSIONES.length - 1);
    }
    return { asunto: asunto, documento: documento };
  }

  /* El largo de la ruta completa hasta un trozo del ARCHIVO, con los
     segmentos REALES (los que ya existen en disco: categoría, tercero,
     nombre del asunto, y el del documento si se pide), no el peor caso
     de `topes()`. Para el aviso de Ajustes → Mantenimiento (fila 177,
     "Poner en orden las fichas del ARCHIVO"), que cuenta con el índice
     lo que YA pasa del tope, sin bajar a disco otra vez. */
  function largoRuta(segmentos) {
    var partes = (segmentos || []).filter(Boolean).map(String);
    return raizDropbox() + 1 + dentroDropboxDelArchivo() + 1 + partes.join('/').length;
  }

  Object.assign(window.Nombres, { topes: topes, largoRuta: largoRuta, TOPE_RUTA_TOTAL: TOPE_RUTA_TOTAL });
})();
