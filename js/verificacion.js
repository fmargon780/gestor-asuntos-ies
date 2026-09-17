/* ============================================================
   verificacion.js — el código de verificación del pie de un documento
   (17-sep-2026, fila 19, docs/CSV-DEL-DOCUMENTO.md).

   Los documentos electrónicos de la administración llevan impreso en
   el pie un código de verificación (CSV, CVE...) y la dirección de la
   página donde se teclea para comprobar que el documento es
   auténtico. Aquí solo se lee ese pie, para no tener que teclear el
   código a mano: nunca se descarga nada de esa página (cada
   administración tiene la suya, y su formulario no se abre con una
   dirección que lleve el código dentro), y nada de esto se guarda en
   ningún fichero compartido.

   Reutiliza `RegistroLector.textoDePrimeraPagina` (pdf.js, cargado por
   ese fichero, no aquí): no hace falta una segunda copia de cómo se
   saca el texto de un PDF.
   ============================================================ */
var Verificacion = (function () {

  /* Sin distinguir mayúsculas ni tildes: [oó] y [oó]n cubren las dos
     grafías de "código"/"verificación". La de "Código Seguro de
     Verificación (CSV)" cae en la primera rama, con el "(CSV)" opcional. */
  var ETIQUETA = /c[oó]digo\s+seguro\s+de\s+verificaci[oó]n(?:\s*\(csv\))?|c[oó]digo\s+de\s+verificaci[oó]n|\bcsv\b|\bcve\b/i;

  /* Detrás de la etiqueta puede haber dos puntos, un guion o nada. El
     código: letras, números y + / = - _ ., de ocho caracteres o más.
     El espacio no está en el conjunto, así que el propio patrón para
     en el primer hueco: no hace falta adivinar dónde acaba. */
  var CODIGO_DETRAS = /^[\s:\-]*([A-Za-z0-9+/=_.\-]{8,})/;

  var URL_HTTP = /https?:\/\/[^\s"'<>)]+/g;
  var PALABRAS_ENLACE = /verifica|csv|cve|valida|cotejo|sede/i;

  /* La basura que suele quedar pegada al final de una dirección
     escrita dentro de una frase: puntos, comas, paréntesis, comillas. */
  function sinColaDeFrase(url) {
    return String(url || '').replace(/[.,;:)\]'"]+$/, '');
  }

  function leerDelTexto(texto) {
    var t = String(texto || '');
    var codigo = '';

    var mEtiqueta = t.match(ETIQUETA);
    if (mEtiqueta) {
      var resto = t.slice(mEtiqueta.index + mEtiqueta[0].length);
      var mCodigo = resto.match(CODIGO_DETRAS);
      if (mCodigo) codigo = mCodigo[1];
    }

    var enlace = '';
    var candidatos = t.match(URL_HTTP) || [];
    for (var i = 0; i < candidatos.length; i++) {
      var limpio = sinColaDeFrase(candidatos[i]);
      if (PALABRAS_ENLACE.test(limpio)) { enlace = limpio; break; }
    }

    return { codigo: codigo, enlace: enlace };
  }

  /* Nunca lanza: un documento sin código es lo más normal del mundo, y
     uno que no sea PDF (o que pdf.js no pueda leer) tampoco es un
     error, aquí simplemente no hay nada que enseñar. */
  async function leerDelFichero(fichero) {
    try {
      var esPdf = (fichero && fichero.type === 'application/pdf') ||
                  /\.pdf$/i.test((fichero && fichero.name) || '');
      if (!esPdf || !window.RegistroLector) return { codigo: '', enlace: '' };
      var texto = await RegistroLector.textoDePrimeraPagina(fichero);
      return leerDelTexto(texto);
    } catch (e) {
      return { codigo: '', enlace: '' };
    }
  }

  return { leerDelTexto: leerDelTexto, leerDelFichero: leerDelFichero };
})();
window.Verificacion = Verificacion;
