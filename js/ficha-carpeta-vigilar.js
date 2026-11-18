/* ============================================================
   ficha-carpeta-vigilar.js — fila 677 (docs/677-DOCUMENTO-GUARDADO-TARDA-EN-SALIR.md).
   Con la ficha de un asunto a la vista, mira la carpeta de ese asunto cada
   `App.SEGUNDOS_ENTRE_MIRADAS` s y al volver a la ventana; si ha cambiado la lista
   de documentos (uno guardado desde Word, el explorador o el escáner), repinta
   «Documentos» sin salir de la ficha. Solo lee: no escribe nada en ninguna carpeta.
   La primera mirada tras abrir o cambiar de asunto solo apunta.
   Medida: `asunto.mirar-carpeta`.
   ============================================================ */
var FichaCarpetaVigilar = (function () {
  var asuntoVisto = null;   /* nombre del asunto cuya lista se apuntó */
  var firmaVista = null;    /* nombres de la mirada anterior de ese asunto */
  var mirando = false;
  var turno = 0;

  function $(id) { return document.getElementById(id); }

  function ocupada() {
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return true;
    var capa = $('capa');
    if (capa && !capa.classList.contains('oculto')) return true;   /* un cuadro abierto */
    var app = $('aplicacion');
    return !app || app.classList.contains('oculto');
  }

  async function mirar() {
    if (mirando || !window.App || !App.asuntoDeLaFicha || !window.Carpetas) return;
    var a = App.asuntoDeLaFicha();
    if (!a) { asuntoVisto = null; firmaVista = null; return; }
    if (!a.handle || ocupada()) return;
    mirando = true;
    var fin = window.Medidas ? Medidas.tiempo('asunto.mirar-carpeta') : function () {};
    try {
      var nombre = a.nombre;
      var yo = ++turno;
      var firma = (await Carpetas.ficheros(a.handle))
        .map(function (f) { return f.nombre; })
        .filter(function (n) { return App.esDocumentoDeTrabajo(n); })
        .sort().join('|');
      /* Mientras se leía puede haberse cambiado de asunto o abierto un cuadro. */
      var ahora = App.asuntoDeLaFicha();
      if (yo !== turno || !ahora || ahora.nombre !== nombre) return;
      if (asuntoVisto !== nombre) { asuntoVisto = nombre; firmaVista = firma; return; }
      if (firma === firmaVista) return;
      if (ocupada()) return;   /* se queda sin apuntar: repinta en la siguiente mirada */
      firmaVista = firma;
      if (!window.FichaDocumentos) return;
      await U.conservandoLoEscrito($('ficha-asunto-cuerpo'), function () { return FichaDocumentos.pintar(ahora); });
    } catch (e) {
      /* Sin permiso o carpeta ocupada: se reintenta en la siguiente mirada, sin molestar. */
    } finally {
      fin();
      mirando = false;
    }
  }

  return { mirar: mirar };
})();
window.FichaCarpetaVigilar = FichaCarpetaVigilar;
