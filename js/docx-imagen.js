/* ============================================================
   docx-imagen.js — meter una imagen (el membrete) en el hueco
   {{MEMBRETE}} de un .docx (20-sep-2026, fila 81,
   docs/FIRMANTES-Y-MEMBRETE.md). Sacado de js/docx.js el 24-sep-2026
   (fila 110) para no pasar ese fichero de las 400 líneas: usa sus
   piezas del ZIP (`Docx.interno`) y publica `Docx.ponerImagen`.
   Se carga justo después de js/docx.js.
   ============================================================ */
(function () {
  var I = Docx.interno;
  var leerDirectorioCentral = I.leerDirectorioCentral, datosDeEntrada = I.datosDeEntrada,
      inicioDeDatos = I.inicioDeDatos, cabeceraLocal = I.cabeceraLocal, entradaCentral = I.entradaCentral,
      finDeDirectorio = I.finDeDirectorio, concatenar = I.concatenar, crc32 = I.crc32,
      escribirU32 = I.escribirU32, RE_PARRAFO = I.RE_PARRAFO, extraerTextos = I.extraerTextos,
      decodificarEntidades = I.decodificarEntidades;

  /* ---------- meter una imagen en el hueco del membrete (20-sep-2026,
     fila 81, docs/FIRMANTES-Y-MEMBRETE.md) ---------- */

  var RE_OBJETIVO_IMAGEN = /^word\/(document\.xml|header\d*\.xml)$/i;
  var CM_EN_EMU = 360000;

  function huecoDobleRegex(nombreHueco) {
    var escapado = nombreHueco.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\{\\{\\s*' + escapado + '\\s*\\}\\}', 'i');
  }

  function textoPlanoDeParrafo(xmlParrafo) {
    return extraerTextos(xmlParrafo).map(function (s) { return decodificarEntidades(s.texto); }).join('');
  }

  function parrafoDeImagen(rId, cx, cy) {
    return '<w:p><w:r><w:drawing>' +
      '<wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">' +
        '<wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
        '<wp:docPr id="1" name="Membrete"/>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
          '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
              '<pic:nvPicPr><pic:cNvPr id="0" name="Membrete"/><pic:cNvPicPr/></pic:nvPicPr>' +
              '<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
              '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
            '</pic:pic>' +
          '</a:graphicData>' +
        '</a:graphic>' +
      '</wp:inline>' +
    '</w:drawing></w:r></w:p>';
  }

  /* Sustituye, en `textoXml`, cada `<w:p>` cuyo texto (ya reparado de
     huecos partidos entre varios `<w:t>`, como en `rellenar`) sea
     `{{nombreHueco}}` por un párrafo con la imagen. Puede no haber
     ninguno: `encontrado` lo dice. */
  function reemplazarParrafoConImagen(textoXml, nombreHueco, rId, cx, cy) {
    var regexHueco = huecoDobleRegex(nombreHueco);
    var encontrado = false;
    var salida = textoXml.replace(RE_PARRAFO, function (parrafo) {
      if (!regexHueco.test(textoPlanoDeParrafo(parrafo))) return parrafo;
      encontrado = true;
      return parrafoDeImagen(rId, cx, cy);
    });
    return { texto: salida, encontrado: encontrado };
  }

  function idRelacionLibre(textoRels) {
    var usados = {}, m;
    var re = /Id="([^"]+)"/g;
    while ((m = re.exec(textoRels))) usados[m[1]] = true;
    var n = 1;
    while (usados['rIdMembrete' + n]) n++;
    return 'rIdMembrete' + n;
  }

  function anadirRelacionImagen(textoRels, rId) {
    var relacion = '<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/membrete.png"/>';
    return textoRels.replace('</Relationships>', relacion + '</Relationships>');
  }

  var RELS_VACIO = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

  /* `bytesPng` es la imagen ya montada (`Membrete.montar`), y
     `anchoPx`/`altoPx` su tamaño, para calcular el alto en proporción
     a un ancho fijo de 17 cm (el ancho útil de un A4 con márgenes
     normales). Se aplica ANTES de `rellenar`, y devuelve otro buffer
     (`Uint8Array`), no un `Blob`: `rellenar` acepta los dos. Si el
     hueco `{{nombreHueco}}` no está en ningún `document.xml` ni
     `headerN.xml`, no toca nada. */
  async function ponerImagen(bufferDocx, nombreHueco, bytesPng, anchoPx, altoPx) {
    var bytes = bufferDocx instanceof Uint8Array ? bufferDocx : new Uint8Array(bufferDocx);
    var entradas = leerDirectorioCentral(bytes);
    var porNombre = {};
    entradas.forEach(function (e) { porNombre[e.nombre] = e; });

    var cx = Math.round(17 * CM_EN_EMU);
    var cy = Math.round(cx * ((altoPx || 1) / (anchoPx || 1)));

    var objetivos = entradas.filter(function (e) { return RE_OBJETIVO_IMAGEN.test(e.nombre); });
    var cambios = {};    /* nombre de entrada ya existente -> texto nuevo */
    var nuevas = [];     /* [{ nombre, texto }] entradas que no existían (los .rels) */
    var tocoAlguno = false;

    for (var i = 0; i < objetivos.length; i++) {
      var e = objetivos[i];
      var texto = new TextDecoder('utf-8').decode(await datosDeEntrada(bytes, e));

      var nombreRels = e.nombre.replace(/^word\//, 'word/_rels/') + '.rels';
      var entradaRels = porNombre[nombreRels];
      var textoRels = entradaRels
        ? new TextDecoder('utf-8').decode(await datosDeEntrada(bytes, entradaRels))
        : RELS_VACIO;

      var rId = idRelacionLibre(textoRels);
      var resultado = reemplazarParrafoConImagen(texto, nombreHueco, rId, cx, cy);
      if (!resultado.encontrado) continue;

      tocoAlguno = true;
      cambios[e.nombre] = resultado.texto;
      var textoRelsNuevo = anadirRelacionImagen(textoRels, rId);
      if (entradaRels) cambios[nombreRels] = textoRelsNuevo;
      else nuevas.push({ nombre: nombreRels, texto: textoRelsNuevo });
    }

    if (!tocoAlguno) return bytes;

    var entradaTipos = porNombre['[Content_Types].xml'];
    if (entradaTipos) {
      var textoTipos = new TextDecoder('utf-8').decode(await datosDeEntrada(bytes, entradaTipos));
      if (!/Extension="png"/i.test(textoTipos)) {
        cambios['[Content_Types].xml'] = textoTipos.replace(/(<Types[^>]*>)/,
          '$1<Default Extension="png" ContentType="image/png"/>');
      }
    }

    var datosImagen = bytesPng instanceof Uint8Array ? bytesPng : new Uint8Array(bytesPng);
    var partes = [], entradasCentrales = [], offsetActual = 0;

    function escribirEntradaNueva(nombre, contenido) {
      var datosBytes = typeof contenido === 'string' ? new TextEncoder().encode(contenido) : contenido;
      var crc = crc32(datosBytes);
      var nombreBytes = new TextEncoder().encode(nombre);
      var local = cabeceraLocal({ crc: crc, tam: datosBytes.length, nombreBytes: nombreBytes, tiempoDos: 0, fechaDos: 0 });
      partes.push(local, datosBytes);
      entradasCentrales.push(entradaCentral({
        crc: crc, tam: datosBytes.length, nombreBytes: nombreBytes, tiempoDos: 0, fechaDos: 0,
        atributosExternos: 0, offset: offsetActual
      }));
      offsetActual += local.length + datosBytes.length;
    }

    for (var j = 0; j < entradas.length; j++) {
      var ent = entradas[j];
      if (Object.prototype.hasOwnProperty.call(cambios, ent.nombre)) {
        escribirEntradaNueva(ent.nombre, cambios[ent.nombre]);
        continue;
      }
      var inicioLocal = inicioDeDatos(bytes, ent.offsetLocal);
      var tramo = bytes.subarray(ent.offsetLocal, inicioLocal + ent.compTam);
      partes.push(tramo);
      var cdCopia = bytes.slice(ent.cdInicio, ent.cdFin);
      escribirU32(cdCopia, 42, offsetActual);
      entradasCentrales.push(cdCopia);
      offsetActual += tramo.length;
    }

    nuevas.forEach(function (n) { escribirEntradaNueva(n.nombre, n.texto); });
    escribirEntradaNueva('word/media/membrete.png', datosImagen);

    var totalEntradas = entradas.length + nuevas.length + 1;
    var inicioDirectorio = offsetActual;
    var directorioCentral = concatenar(entradasCentrales);
    var eocd = finDeDirectorio(totalEntradas, directorioCentral.length, inicioDirectorio);
    return concatenar(partes.concat([directorioCentral, eocd]));
  }

  Docx.ponerImagen = ponerImagen;
  Docx.huecoDobleRegex = huecoDobleRegex;
  Docx.textoPlanoDeParrafo = textoPlanoDeParrafo;
})();
