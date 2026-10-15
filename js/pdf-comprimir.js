/* ============================================================
   pdf-comprimir.js — bajar un PDF de 5 MB (15-oct-2026, fila 349,
   docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md).

   Lo normal en lo que llega al centro son escaneos: el peso está en
   las imágenes de las páginas. Se vuelven a guardar con menos
   resolución y menos calidad JPEG, de menos a más agresivo, y se para
   en el primer intento que baje de 5 MB. Nunca por debajo de la
   calidad mínima (150 ppp de resolución efectiva, calidad JPEG 0,6):
   si ni así baja, no se toca y se dice.

   Solo sabe de bytes (`Uint8Array` dentro y fuera): no toca el disco
   ni el DOM, igual que js/pdf-margenes.js. Lo único que necesita un
   navegador es volver a codificar un JPEG (`recodificar`); por defecto
   usa un lienzo, y las pruebas le pasan uno falso
   (pruebas/pdf-comprimir.mjs).

   Solo se tocan las imágenes JPEG (DCTDecode), que es lo que sacan los
   escáneres y los móviles. Un PDF de solo texto que pase de 5 MB se
   reescribe igual (objetos sin usar fuera); si no baja, se queda como
   está.
   ============================================================ */
var PdfComprimir = (function () {

  var UMBRAL = 5 * 1024 * 1024;
  var PPP_MINIMO = 150;
  var CALIDAD_MINIMA = 0.6;

  /* De menos a más agresivo. El último es el suelo: calidad mínima. */
  var ESCALERA = [
    { ppp: 300, calidad: 0.8 },
    { ppp: 250, calidad: 0.7 },
    { ppp: 200, calidad: 0.7 },
    { ppp: 200, calidad: 0.6 },
    { ppp: PPP_MINIMO, calidad: CALIDAD_MINIMA }
  ];

  function errorDeLectura() {
    var error = new Error('Este PDF no se puede abrir: puede que venga protegido o roto.');
    error.name = 'PdfIlegible';
    return error;
  }

  async function abrir(PDFLib, bytes) {
    try { return await PDFLib.PDFDocument.load(bytes, { updateMetadata: false }); }
    catch (e) { throw errorDeLectura(); }
  }

  /* El JPEG que da el navegador al volver a codificar: la imagen a
     `ancho` x `alto` y esa calidad (0 a 1). */
  async function recodificarEnNavegador(bytes, ancho, alto, calidad) {
    var mapa = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }), { imageOrientation: 'none' });
    var lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    var c = lienzo.getContext('2d');
    c.fillStyle = '#fff';
    c.fillRect(0, 0, ancho, alto);
    c.imageSmoothingQuality = 'high';
    c.drawImage(mapa, 0, 0, ancho, alto);
    if (mapa.close) mapa.close();
    var blob = await new Promise(function (resolver) { lienzo.toBlob(resolver, 'image/jpeg', calidad); });
    if (!blob) throw new Error('El navegador no ha podido volver a guardar la imagen.');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), ancho: ancho, alto: alto };
  }

  /* Texto llano de un nombre PDF (`/DCTDecode` -> 'DCTDecode'). */
  function nombreDe(PDFLib, valor) {
    return valor instanceof PDFLib.PDFName ? valor.decodeText() : '';
  }

  /* ¿Qué filtro lleva? Solo cuenta el caso de un único filtro JPEG. */
  function esJpeg(PDFLib, contexto, dict) {
    var f = contexto.lookup(dict.get(PDFLib.PDFName.of('Filter')));
    if (f instanceof PDFLib.PDFArray) {
      if (f.size() !== 1) return false;
      f = contexto.lookup(f.get(0));
    }
    return nombreDe(PDFLib, f) === 'DCTDecode';
  }

  function numeroDe(PDFLib, contexto, dict, clave) {
    var v = contexto.lookup(dict.get(PDFLib.PDFName.of(clave)));
    return (v instanceof PDFLib.PDFNumber) ? v.asNumber() : 0;
  }

  /* Cuánto mide de ancho (en puntos) la página más ancha que usa cada
     imagen. Es una cuenta por lo bajo: una imagen que no ocupa toda la
     hoja tiene más resolución real que la calculada, así que bajar
     hasta aquí nunca la deja por debajo del mínimo. Las imágenes que no
     se encuentran en ninguna página (dentro de formularios) usan la
     hoja más ancha del documento. */
  function anchoPorImagen(PDFLib, doc) {
    var contexto = doc.context;
    var mapa = new Map();
    var masAncha = 0;
    doc.getPages().forEach(function (pagina) {
      var cruda = pagina.getSize();
      var rot = pagina.getRotation();
      var ang = rot && typeof rot.angle === 'number' ? ((rot.angle % 360) + 360) % 360 : 0;
      var ancho = (ang === 90 || ang === 270) ? cruda.height : cruda.width;
      masAncha = Math.max(masAncha, ancho);
      var recursos = pagina.node.Resources();
      if (!recursos) return;
      var xobj = contexto.lookupMaybe(recursos.get(PDFLib.PDFName.of('XObject')), PDFLib.PDFDict);
      if (!xobj) return;
      xobj.entries().forEach(function (par) {
        if (!(par[1] instanceof PDFLib.PDFRef)) return;
        var clave = par[1].toString();
        mapa.set(clave, Math.max(mapa.get(clave) || 0, ancho));
      });
    });
    return { mapa: mapa, porDefecto: masAncha || 595 };
  }

  /* Un intento: todas las imágenes JPEG a `ppp` y `calidad`. Devuelve los
     bytes del PDF nuevo y cuántas imágenes se han cambiado. */
  async function intentar(bytes, intento, recodificar) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await abrir(PDFLib, bytes);
    var contexto = doc.context;
    var anchos = anchoPorImagen(PDFLib, doc);
    var cambiadas = 0;

    var objetos = contexto.enumerateIndirectObjects();
    for (var i = 0; i < objetos.length; i++) {
      var ref = objetos[i][0], obj = objetos[i][1];
      if (!(obj instanceof PDFLib.PDFRawStream)) continue;
      var dict = obj.dict;
      if (nombreDe(PDFLib, dict.get(PDFLib.PDFName.of('Subtype'))) !== 'Image') continue;
      if (!esJpeg(PDFLib, contexto, dict)) continue;
      if (dict.get(PDFLib.PDFName.of('ImageMask')) === PDFLib.PDFBool.True) continue;
      if (dict.has(PDFLib.PDFName.of('Mask'))) continue;

      var ancho = numeroDe(PDFLib, contexto, dict, 'Width');
      var alto = numeroDe(PDFLib, contexto, dict, 'Height');
      if (!ancho || !alto) continue;

      var anchoPagina = anchos.mapa.get(ref.toString()) || anchos.porDefecto;
      var anchoMeta = Math.min(ancho, Math.max(1, Math.round(intento.ppp * anchoPagina / 72)));
      var altoMeta = Math.max(1, Math.round(alto * anchoMeta / ancho));

      var nuevo;
      try { nuevo = await recodificar(obj.contents, anchoMeta, altoMeta, intento.calidad); }
      catch (e) { continue; }   /* una imagen que no se deja leer se queda como está */
      if (!nuevo || !nuevo.bytes || nuevo.bytes.length >= obj.contents.length) continue;

      dict.set(PDFLib.PDFName.of('Width'), PDFLib.PDFNumber.of(nuevo.ancho));
      dict.set(PDFLib.PDFName.of('Height'), PDFLib.PDFNumber.of(nuevo.alto));
      dict.set(PDFLib.PDFName.of('ColorSpace'), PDFLib.PDFName.of('DeviceRGB'));
      dict.set(PDFLib.PDFName.of('BitsPerComponent'), PDFLib.PDFNumber.of(8));
      dict.delete(PDFLib.PDFName.of('Decode'));
      dict.delete(PDFLib.PDFName.of('DecodeParms'));
      contexto.assign(ref, PDFLib.PDFRawStream.of(dict, nuevo.bytes));
      cambiadas++;
    }
    return { bytes: await doc.save(), cambiadas: cambiadas };
  }

  /* Lo que devuelve: { bytes, antes, despues, comprimido }.
     - `comprimido` true: `bytes` es el PDF nuevo y pesa `despues` (<= 5 MB).
     - `comprimido` false: `bytes` son los de antes, tal cual (no pesaba más
       de 5 MB, o no ha bajado sin perder calidad); `motivo` dice cuál:
       'pequeno' o 'no-baja'.
     `opciones.recodificar` (para las pruebas) cambia cómo se vuelve a
     guardar una imagen; `opciones.umbral`, el tope. */
  async function comprimir(bytes, opciones) {
    opciones = opciones || {};
    var umbral = opciones.umbral || UMBRAL;
    var recodificar = opciones.recodificar || recodificarEnNavegador;
    var antes = bytes.length;
    if (antes <= umbral) return { bytes: bytes, antes: antes, despues: antes, comprimido: false, motivo: 'pequeno' };

    /* Primero lo más suave: reescribir sin tocar las imágenes. */
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await abrir(PDFLib, bytes);
    var reescrito = await doc.save();
    if (reescrito.length <= umbral && reescrito.length < antes) {
      return { bytes: reescrito, antes: antes, despues: reescrito.length, comprimido: true };
    }

    for (var i = 0; i < ESCALERA.length; i++) {
      if (opciones.alProgreso) opciones.alProgreso(i + 1, ESCALERA.length);
      var r = await intentar(bytes, ESCALERA[i], recodificar);
      if (r.cambiadas && r.bytes.length <= umbral && r.bytes.length < antes) {
        return { bytes: r.bytes, antes: antes, despues: r.bytes.length, comprimido: true };
      }
    }
    return { bytes: bytes, antes: antes, despues: antes, comprimido: false, motivo: 'no-baja' };
  }

  /* «12,3 MB» */
  function pesoLegible(n) {
    var mb = n / (1024 * 1024);
    return mb.toFixed(1).replace('.', ',') + ' MB';
  }

  return {
    UMBRAL: UMBRAL,
    PPP_MINIMO: PPP_MINIMO,
    CALIDAD_MINIMA: CALIDAD_MINIMA,
    ESCALERA: ESCALERA,
    comprimir: comprimir,
    pesoLegible: pesoLegible
  };
})();
window.PdfComprimir = PdfComprimir;
