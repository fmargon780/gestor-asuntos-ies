/* ============================================================
   membrete.js — el membrete del centro, con el nombre de la
   Consejería escrito encima de la imagen (20-sep-2026, fila 81,
   docs/FIRMANTES-Y-MEMBRETE.md, parte 3).

   La imagen (_GESTOR/PLANTILLAS/membrete.png) se sube una vez desde
   Ajustes, sin el nombre de la Consejería: ese nombre se escribe
   encima, con lo que diga Ajustes, así que cuando la Consejería
   cambie de nombre basta con corregir una línea de texto.

   `Membrete.medir` es una función SIN EFECTOS (no toca el DOM, no lee
   nada): dado un texto y una caja en porcentaje, decide el tamaño de
   letra y si hace falta partirlo en dos líneas. Es lo único que se
   prueba sin navegador. `Membrete.montar` sí necesita canvas: lee la
   imagen, dibuja el texto encima con `Membrete.medir`, y devuelve el
   PNG resultante en bytes.
   ============================================================ */
var Membrete = (function () {

  var CARPETA_PLANTILLAS = 'PLANTILLAS';
  var FICHERO_IMAGEN = 'membrete.png';

  /* Ancho medio de una letra en Arial/Helvetica, como fracción del
     tamaño de la letra: suficiente para decidir si un texto cabe,
     sin tener que pintar nada (no hay `canvas` fuera del navegador). */
  var ANCHO_MEDIO_LETRA = 0.56;
  var PROPORCION_MINIMA = 0.55;

  function anchoDeTexto(texto, tamano) {
    return String(texto || '').length * tamano * ANCHO_MEDIO_LETRA;
  }

  /* Parte el texto en dos líneas por el espacio que deje las dos
     mitades más parejas en longitud. Si no hay ningún espacio, no se
     puede partir: se devuelve tal cual en una sola "línea". */
  function partirEnDosLineas(texto) {
    var t = String(texto || '');
    var palabras = t.split(' ');
    if (palabras.length < 2) return [t];
    var mejorCorte = 1, mejorDiferencia = Infinity;
    for (var i = 1; i < palabras.length; i++) {
      var l1 = palabras.slice(0, i).join(' ');
      var l2 = palabras.slice(i).join(' ');
      var diferencia = Math.abs(l1.length - l2.length);
      if (diferencia < mejorDiferencia) { mejorDiferencia = diferencia; mejorCorte = i; }
    }
    return [palabras.slice(0, mejorCorte).join(' '), palabras.slice(mejorCorte).join(' ')];
  }

  /* Empieza por el tamaño máximo (caja.alto % del alto de la imagen) y
     lo baja de punto en punto mientras el texto no quepa en
     caja.ancho, hasta un mínimo del 55% del máximo. Si con ese mínimo
     sigue sin caber, lo parte en dos líneas. Devuelve
     { tamano, lineas: [...] }, con `lineas` de una o dos posiciones. */
  function medir(texto, caja, anchoImagen, altoImagen) {
    var anchoCajaPx = anchoImagen * ((caja && caja.ancho) || 0) / 100;
    var tamanoMax = altoImagen * ((caja && caja.alto) || 0) / 100;
    var tamanoMin = tamanoMax * PROPORCION_MINIMA;

    for (var t = tamanoMax; t >= tamanoMin; t--) {
      if (anchoDeTexto(texto, t) <= anchoCajaPx) return { tamano: t, lineas: [texto] };
    }
    return { tamano: tamanoMin, lineas: partirEnDosLineas(texto) };
  }

  /* ---------- montar el PNG con el texto ya escrito encima ---------- */

  function carpetaDePlantillas() {
    return Carpetas.crear(App.E.gestor, CARPETA_PLANTILLAS);
  }

  /* Lee membrete.png de _GESTOR/PLANTILLAS y los ajustes, dibuja la
     imagen en un <canvas> de su tamaño original, escribe encima el
     nombre de la Consejería y devuelve { bytes, ancho, alto } en PNG.
     Si no hay imagen guardada, devuelve null: quien llame sigue sin
     membrete, sin que nada falle. */
  async function montar() {
    if (!window.App || !App.E || !App.E.gestor) return null;

    var handle;
    try {
      var carpeta = await carpetaDePlantillas();
      handle = await carpeta.getFileHandle(FICHERO_IMAGEN);
    } catch (e) { return null; }

    var datosCentro;
    try { datosCentro = await Plantillas.cargar(App.E.gestor); } catch (e) { return null; }
    if (!datosCentro || !datosCentro.consejeria) return null;

    var fichero, bitmap;
    try {
      fichero = await handle.getFile();
      bitmap = await createImageBitmap(fichero);
    } catch (e) { return null; }

    var caja = datosCentro.membreteCaja || Plantillas.CAJA_MEMBRETE_POR_DEFECTO;
    var resultado = medir(datosCentro.consejeria, caja, bitmap.width, bitmap.height);

    var canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    ctx.fillStyle = '#1E1A1E';
    ctx.textBaseline = 'alphabetic';
    ctx.font = Math.round(resultado.tamano) + 'px Arial, Helvetica, sans-serif';

    var xPx = bitmap.width * (caja.x / 100);
    var yBasePx = bitmap.height * (caja.y / 100);
    if (resultado.lineas.length === 1) {
      ctx.fillText(resultado.lineas[0], xPx, yBasePx);
    } else {
      /* Con dos líneas, la primera sube y la segunda baja, repartidas
         alrededor de la línea base de la caja. */
      ctx.fillText(resultado.lineas[0], xPx, yBasePx - resultado.tamano * 0.6);
      ctx.fillText(resultado.lineas[1], xPx, yBasePx + resultado.tamano * 0.6);
    }

    var blob = await new Promise(function (resolver) { canvas.toBlob(resolver, 'image/png'); });
    var bytes = new Uint8Array(await blob.arrayBuffer());
    return { bytes: bytes, ancho: bitmap.width, alto: bitmap.height };
  }

  return {
    FICHERO_IMAGEN: FICHERO_IMAGEN,
    medir: medir,
    montar: montar
  };
})();
