/* ============================================================
   pdf-comprimir.js — comprimir un PDF a 5 MB y pasar sus hojas a A4
   (15-oct-2026, fila 349, docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md).

   Solo sabe de bytes (`Uint8Array` dentro y fuera): ni disco ni
   pantalla, igual que js/pdf-margenes.js. Usa PdfHerramientas.cargarPdfLib
   y PdfMargenes.pareceFirmado tal cual. Para volver a codificar las
   imágenes de una página necesita un lienzo (`OffscreenCanvas`, o un
   `<canvas>` suelto sin enganchar a la pantalla).

   Comprimir: las imágenes de las páginas (lo que llega escaneado) se
   vuelven a guardar con menos resolución y calidad JPEG, de menos a más
   agresivo, y se para en el primer intento que baje del límite. La
   calidad mínima es 150 ppp de resolución efectiva y calidad JPEG 0,6:
   si ni así baja, `logrado` sale falso y quien llama guarda el original.

   Pasar a un tamaño: cada hoja que sea mayor que el tamaño elegido pasa
   a ese tamaño, con su orientación, el contenido encogido en proporción
   y centrado; una hoja que ya cabe se deja como está. El giro (`/Rotate`)
   se respeta igual que en js/pdf-margenes.js: se dibuja en coordenadas
   crudas.

   Un PDF con firma electrónica no se toca nunca (lo decide quien llama,
   con `PdfMargenes.pareceFirmado`).
   ============================================================ */
var PdfComprimir = (function () {

  var LIMITE_BYTES = 5 * 1024 * 1024;

  /* En puntos PDF (1 pt = 1/72 de pulgada), en vertical. */
  var TAMANOS = {
    'A4': [595.28, 841.89],
    'A3': [841.89, 1190.55],
    'A5': [419.53, 595.28],
    'Carta': [612, 792],
    'Oficio': [612, 936]
  };
  var NOMBRES = ['A4', 'A3', 'A5', 'Carta', 'Oficio'];

  /* De menos a más agresivo. El último es la calidad mínima. */
  var PASOS = [
    { ppp: 300, calidad: 0.8 },
    { ppp: 250, calidad: 0.75 },
    { ppp: 200, calidad: 0.7 },
    { ppp: 175, calidad: 0.65 },
    { ppp: 150, calidad: 0.6 }
  ];
  var PIXELES_MINIMOS = 250000;   /* una imagen más pequeña (un logo) no se toca */

  function errorDeLectura() {
    var error = new Error('Este PDF no se puede abrir: puede que venga protegido o roto.');
    error.name = 'PdfIlegible';
    return error;
  }

  async function abrir(PDFLib, bytes) {
    try { return await PDFLib.PDFDocument.load(bytes); }
    catch (e) { throw errorDeLectura(); }
  }

  function anguloDe(pagina) {
    var r = pagina.getRotation();
    var a = ((r && typeof r.angle === 'number') ? r.angle : 0) % 360;
    if (a < 0) a += 360;
    return [0, 90, 180, 270].reduce(function (mejor, v) {
      return Math.abs(a - v) < Math.abs(a - mejor) ? v : mejor;
    }, 0);
  }

  function visibleDe(pagina) {
    var c = pagina.getSize();
    var angulo = anguloDe(pagina);
    var girada = angulo === 90 || angulo === 270;
    return {
      ancho: girada ? c.height : c.width, alto: girada ? c.width : c.height,
      angulo: angulo, anchoCrudo: c.width, altoCrudo: c.height
    };
  }

  /* ---------- las cuentas, puras ---------- */

  /* «Más de un 10 % por encima de 210 × 297 mm en cualquiera de los dos
     lados, en cualquier orientación.» */
  function esMasGrandeQueA4(ancho, alto) {
    var corto = Math.min(ancho, alto), largo = Math.max(ancho, alto);
    return corto > TAMANOS.A4[0] * 1.1 || largo > TAMANOS.A4[1] * 1.1;
  }

  /* El tamaño al que quedaría una hoja de `ancho` × `alto` al pasarla a
     `clave`: con su orientación, y sin agrandarla nunca. */
  function tamanoDestino(ancho, alto, clave) {
    var base = TAMANOS[clave] || TAMANOS.A4;
    var apaisada = ancho > alto;
    var tw = apaisada ? base[1] : base[0];
    var th = apaisada ? base[0] : base[1];
    if (ancho <= tw + 0.5 && alto <= th + 0.5) {
      return { ancho: ancho, alto: alto, cambia: false, escala: 1 };
    }
    return { ancho: tw, alto: th, cambia: true, escala: Math.min(tw / ancho, th / alto) };
  }

  /* Dónde dibujar la página original dentro de la nueva, en coordenadas
     crudas (misma idea que PdfMargenes.posicionCruda, pero con la hoja
     nueva de otro tamaño que la original). `X` e `Y` son la esquina de
     abajo a la izquierda del contenido, VISIBLE. */
  function posicionCrudaEnNueva(angulo, anchoNuevoCrudo, altoNuevoCrudo, anchoCrudo, altoCrudo, escala, X, Y) {
    if (angulo === 90) return { x: anchoNuevoCrudo - Y - anchoCrudo * escala, y: X };
    if (angulo === 270) return { x: Y, y: altoNuevoCrudo - X - altoCrudo * escala };
    if (angulo === 180) return { x: anchoNuevoCrudo - X - anchoCrudo * escala, y: altoNuevoCrudo - Y - altoCrudo * escala };
    return { x: X, y: Y };
  }

  /* ---------- medir y pasar a un tamaño ---------- */

  async function tamanosDeHojas(bytes) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await abrir(PDFLib, bytes);
    return doc.getPages().map(function (p) {
      var v = visibleDe(p);
      return { ancho: v.ancho, alto: v.alto };
    });
  }

  async function hayHojasGrandes(bytes) {
    var hojas = await tamanosDeHojas(bytes);
    return hojas.some(function (h) { return esMasGrandeQueA4(h.ancho, h.alto); });
  }

  /* Devuelve los bytes nuevos, y `hojasCambiadas`. Si ninguna hoja cambia,
     devuelve los mismos bytes sin tocar. */
  async function pasarATamano(bytes, clave) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var origen = await abrir(PDFLib, bytes);
    var paginas = origen.getPages();
    var planes = paginas.map(function (p) {
      var v = visibleDe(p);
      return { pagina: p, v: v, destino: tamanoDestino(v.ancho, v.alto, clave) };
    });
    var cambiadas = planes.filter(function (p) { return p.destino.cambia; }).length;
    if (!cambiadas) return { bytes: bytes, hojasCambiadas: 0 };

    var nuevo = await PDFLib.PDFDocument.create();
    for (var i = 0; i < planes.length; i++) {
      var pl = planes[i];
      if (!pl.destino.cambia) {
        var copiadas = await nuevo.copyPages(origen, [i]);
        nuevo.addPage(copiadas[0]);
        continue;
      }
      var v = pl.v, d = pl.destino;
      var girada = v.angulo === 90 || v.angulo === 270;
      var anchoNuevoCrudo = girada ? d.alto : d.ancho;
      var altoNuevoCrudo = girada ? d.ancho : d.alto;
      var hoja = nuevo.addPage([anchoNuevoCrudo, altoNuevoCrudo]);
      if (v.angulo) hoja.setRotation(PDFLib.degrees(v.angulo));
      var embebida = await nuevo.embedPage(pl.pagina);
      var X = (d.ancho - v.ancho * d.escala) / 2;
      var Y = (d.alto - v.alto * d.escala) / 2;
      var pos = posicionCrudaEnNueva(v.angulo, anchoNuevoCrudo, altoNuevoCrudo, v.anchoCrudo, v.altoCrudo, d.escala, X, Y);
      hoja.drawPage(embebida, { x: pos.x, y: pos.y, xScale: d.escala, yScale: d.escala });
    }
    var salida = await nuevo.save();
    return { bytes: salida, hojasCambiadas: cambiadas };
  }

  /* ---------- comprimir ---------- */

  function nombreDe(obj) {
    return obj && typeof obj.asString === 'function' ? obj.asString() : '';
  }

  function filtrosDe(PDFLib, dict) {
    var f = dict.get(PDFLib.PDFName.of('Filter'));
    if (!f) return [];
    if (f instanceof PDFLib.PDFArray) {
      var lista = [];
      for (var i = 0; i < f.size(); i++) lista.push(nombreDe(f.lookup(i)));
      return lista;
    }
    return [nombreDe(f)];
  }

  function numeroDe(PDFLib, dict, clave) {
    var n = dict.lookup(PDFLib.PDFName.of(clave));
    return n && typeof n.asNumber === 'function' ? n.asNumber() : 0;
  }

  /* Cuántos componentes por píxel tiene el espacio de color, o 0 si no
     sabemos volver a codificarlo (CMYK, indexado, con máscara…). */
  function componentesDe(PDFLib, dict) {
    var cs = dict.lookup(PDFLib.PDFName.of('ColorSpace'));
    if (!cs) return 0;
    if (cs instanceof PDFLib.PDFName) {
      var n = nombreDe(cs);
      if (n === '/DeviceRGB') return 3;
      if (n === '/DeviceGray') return 1;
      return 0;
    }
    if (cs instanceof PDFLib.PDFArray && cs.size() >= 2 && nombreDe(cs.lookup(0)) === '/ICCBased') {
      var perfil = cs.lookup(1);
      var nc = perfil && perfil.dict ? numeroDe(PDFLib, perfil.dict, 'N') : 0;
      return (nc === 3 || nc === 1) ? nc : 0;
    }
    return 0;
  }

  /* Las imágenes de este documento que se pueden volver a codificar, con
     su resolución efectiva (la mayor de las páginas donde se usan). */
  function imagenesDe(PDFLib, doc) {
    var ppp = new Map();   /* ref -> ppp efectivos */
    doc.getPages().forEach(function (pagina) {
      var v = visibleDe(pagina);
      var recursos = pagina.node.Resources && pagina.node.Resources();
      var xobjetos = recursos && recursos.lookupMaybe(PDFLib.PDFName.of('XObject'), PDFLib.PDFDict);
      if (!xobjetos) return;
      xobjetos.entries().forEach(function (par) {
        var ref = par[1];
        if (!(ref instanceof PDFLib.PDFRef)) return;
        var obj = doc.context.lookup(ref);
        if (!obj || !obj.dict) return;
        var sub = obj.dict.get(PDFLib.PDFName.of('Subtype'));
        if (nombreDe(sub) !== '/Image') return;
        var w = numeroDe(PDFLib, obj.dict, 'Width'), h = numeroDe(PDFLib, obj.dict, 'Height');
        if (!w || !h) return;
        if ((w > h) !== (v.ancho > v.alto)) { var t = w; w = h; h = t; }
        var este = Math.min(w / (v.ancho / 72), h / (v.alto / 72));
        if (!ppp.has(ref) || ppp.get(ref) < este) ppp.set(ref, este);
      });
    });
    var lista = [];
    ppp.forEach(function (valor, ref) {
      var obj = doc.context.lookup(ref);
      if (!(obj instanceof PDFLib.PDFRawStream)) return;
      var d = obj.dict, N = PDFLib.PDFName.of;
      var w = numeroDe(PDFLib, d, 'Width'), h = numeroDe(PDFLib, d, 'Height');
      if (w * h < PIXELES_MINIMOS) return;
      if (d.get(N('ImageMask')) || d.get(N('Mask')) || d.get(N('Decode'))) return;
      if (numeroDe(PDFLib, d, 'BitsPerComponent') !== 8) return;
      var comps = componentesDe(PDFLib, d);
      if (!comps) return;
      var filtros = filtrosDe(PDFLib, d);
      var tipo = '';
      if (filtros.length === 1 && filtros[0] === '/DCTDecode') tipo = 'jpeg';
      else if (filtros.length === 1 && filtros[0] === '/FlateDecode') {
        var parms = d.lookup(N('DecodeParms'));
        var predictor = parms && parms.lookup ? numeroDe(PDFLib, parms, 'Predictor') : 0;
        if (predictor > 1) return;
        tipo = 'flate';
      } else return;
      lista.push({ ref: ref, obj: obj, ancho: w, alto: h, comps: comps, tipo: tipo, ppp: valor });
    });
    return lista;
  }

  function nuevoLienzo(ancho, alto) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(ancho, alto);
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    return c;
  }

  function lienzoABlob(lienzo, calidad) {
    if (typeof lienzo.convertToBlob === 'function') return lienzo.convertToBlob({ type: 'image/jpeg', quality: calidad });
    return new Promise(function (resolver, rechazar) {
      lienzo.toBlob(function (b) { b ? resolver(b) : rechazar(new Error('Sin imagen.')); }, 'image/jpeg', calidad);
    });
  }

  /* Dibuja la imagen en un lienzo de `ancho`×`alto` y devuelve un JPEG. */
  async function recodificar(PDFLib, im, escala, calidad) {
    var ancho = Math.max(1, Math.round(im.ancho * escala));
    var alto = Math.max(1, Math.round(im.alto * escala));
    var lienzo = nuevoLienzo(ancho, alto);
    var c2 = lienzo.getContext('2d');
    c2.fillStyle = '#fff';
    c2.fillRect(0, 0, ancho, alto);
    var fuente;
    if (im.tipo === 'jpeg') {
      fuente = await createImageBitmap(new Blob([im.obj.getContents()], { type: 'image/jpeg' }), { imageOrientation: 'none' });
    } else {
      var crudos = PDFLib.decodePDFRawStream(im.obj).decode();
      if (crudos.length < im.ancho * im.alto * im.comps) throw new Error('Imagen incompleta.');
      var rgba = new Uint8ClampedArray(im.ancho * im.alto * 4);
      for (var i = 0, n = im.ancho * im.alto; i < n; i++) {
        if (im.comps === 3) {
          rgba[i * 4] = crudos[i * 3]; rgba[i * 4 + 1] = crudos[i * 3 + 1]; rgba[i * 4 + 2] = crudos[i * 3 + 2];
        } else {
          rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = crudos[i];
        }
        rgba[i * 4 + 3] = 255;
      }
      fuente = await createImageBitmap(new ImageData(rgba, im.ancho, im.alto));
    }
    c2.imageSmoothingQuality = 'high';
    c2.drawImage(fuente, 0, 0, ancho, alto);
    if (fuente.close) fuente.close();
    var blob = await lienzoABlob(lienzo, calidad);
    return { bytes: new Uint8Array(await blob.arrayBuffer()), ancho: ancho, alto: alto };
  }

  /* Un intento: abre el original, cambia las imágenes que salen más
     pequeñas y guarda. */
  async function intento(PDFLib, bytes, paso) {
    var doc = await abrir(PDFLib, bytes);
    if (paso) {
      var imagenes = imagenesDe(PDFLib, doc);
      for (var i = 0; i < imagenes.length; i++) {
        var im = imagenes[i];
        var escala = Math.min(1, paso.ppp / im.ppp);
        var nueva;
        try { nueva = await recodificar(PDFLib, im, escala, paso.calidad); }
        catch (e) { continue; }   /* una imagen que no se deja volver a codificar se queda como está */
        if (nueva.bytes.length >= im.obj.getContents().length) continue;
        var N = PDFLib.PDFName.of;
        var flujo = doc.context.stream(nueva.bytes, {
          Type: 'XObject', Subtype: 'Image', Width: nueva.ancho, Height: nueva.alto,
          ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode'
        });
        var smask = im.obj.dict.get(N('SMask'));
        if (smask) flujo.dict.set(N('SMask'), smask);
        doc.context.assign(im.ref, flujo);
      }
    }
    return doc.save({ useObjectStreams: true });
  }

  /* Baja `bytes` a `limite` o menos. Devuelve { bytes, antes, despues,
     logrado }: si no se consigue sin pasar de la calidad mínima, `bytes`
     son los originales y `logrado` es falso. Si ya pesa menos del
     límite, no hace nada (`logrado` verdadero, mismos bytes). */
  async function comprimir(bytes, limite) {
    limite = limite || LIMITE_BYTES;
    var antes = bytes.length;
    if (antes <= limite) return { bytes: bytes, antes: antes, despues: antes, logrado: true, cambiado: false };
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var pasos = [null].concat(PASOS);
    for (var i = 0; i < pasos.length; i++) {
      var salida;
      try { salida = await intento(PDFLib, bytes, pasos[i]); }
      catch (e) { if (e && e.name === 'PdfIlegible') throw e; continue; }
      if (salida.length <= limite && salida.length < antes) {
        return { bytes: salida, antes: antes, despues: salida.length, logrado: true, cambiado: true };
      }
    }
    return { bytes: bytes, antes: antes, despues: antes, logrado: false, cambiado: false };
  }

  /* «12,3 MB». */
  function megas(n) {
    return (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
  }

  return {
    LIMITE_BYTES: LIMITE_BYTES, TAMANOS: TAMANOS, NOMBRES: NOMBRES,
    esMasGrandeQueA4: esMasGrandeQueA4, tamanoDestino: tamanoDestino,
    posicionCrudaEnNueva: posicionCrudaEnNueva,
    tamanosDeHojas: tamanosDeHojas, hayHojasGrandes: hayHojasGrandes,
    pasarATamano: pasarATamano, comprimir: comprimir, megas: megas
  };
})();
window.PdfComprimir = PdfComprimir;
