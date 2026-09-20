/* ============================================================
   docx.js — rellenar los huecos de una plantilla de Word, a mano
   (docs/PLANTILLAS-DE-DOCUMENTO.md, 4).

   Un .docx es un ZIP. Aquí se lee su directorio central, se copian
   tal cual las entradas que no hacen falta tocar, y se descomprimen,
   sustituyen y vuelven a escribir sin comprimir (más simple: sin
   librerías, con `DecompressionStream('deflate-raw')`, que trae el
   navegador y también Node 22) las que sí:

     - word/document.xml
     - word/headerN.xml y word/footerN.xml, si existen

   No hace falta ninguna librería ni CDN: la única que hay en el
   repositorio es pdf.js, copiada para otra cosa. Tampoco hace falta
   `CompressionStream`: un ZIP con entradas "almacenadas" (método 0,
   sin comprimir) es válido de sobra y Word lo abre igual.

   La trampa de verdad es que Word reparte el texto de un párrafo en
   varias etiquetas `<w:t>` (por una corrección ortográfica, o porque
   una palabra suelta lleva negrita), así que `{nombre}` puede llegar
   partido en dos o tres. Antes de sustituir, cada `<w:p>` se repara:
   se localizan sus `<w:t>` en orden, y si un hueco cruza de una a la
   siguiente, se mueven los caracteres del hueco hasta que quede
   entero dentro de una sola — sin fundir TODAS las `<w:t>` del
   párrafo en una, que es lo que perdería la negrita o el subrayado de
   las palabras que no forman parte de ningún hueco.

   Sustituye con `Plantillas.rellenar`: la sintaxis de los huecos es
   la misma, de una sola llave, en todas partes.

   Función pública: `Docx.rellenar(bufferDelDocx, valores)` ->
   `{ blob, faltan }`. `bufferDelDocx` puede ser un `ArrayBuffer` o un
   `Uint8Array`.

   Simplificación consciente: no se contemplan los "data descriptors"
   del formato ZIP (bit 3 de las banderas, para ficheros escritos en
   flujo sin saber el tamaño de antemano). Word, LibreOffice y las
   librerías que generan .docx escriben siempre el tamaño y el CRC en
   la propia cabecera local, así que no hace falta: un .docx de verdad
   nunca los trae.
   ============================================================ */
var Docx = (function () {

  /* ---------- CRC-32, a mano (docs/PLANTILLAS-DE-DOCUMENTO.md, 4) ---------- */

  var TABLA_CRC32 = (function () {
    var tabla = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tabla[n] = c >>> 0;
    }
    return tabla;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = TABLA_CRC32[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* ---------- leer bytes/escribir bytes, little-endian ---------- */

  function u16(view, off) { return view.getUint16(off, true); }
  function u32(view, off) { return view.getUint32(off, true); }
  function escribirU16(bytes, off, v) { bytes[off] = v & 0xFF; bytes[off + 1] = (v >>> 8) & 0xFF; }
  function escribirU32(bytes, off, v) {
    bytes[off] = v & 0xFF; bytes[off + 1] = (v >>> 8) & 0xFF;
    bytes[off + 2] = (v >>> 16) & 0xFF; bytes[off + 3] = (v >>> 24) & 0xFF;
  }

  function concatenar(lista) {
    var total = 0;
    lista.forEach(function (b) { total += b.length; });
    var salida = new Uint8Array(total);
    var pos = 0;
    lista.forEach(function (b) { salida.set(b, pos); pos += b.length; });
    return salida;
  }

  /* ---------- leer el ZIP: directorio central y cabeceras locales ---------- */

  var FIN_DIRECTORIO = 0x06054b50;
  var FICHERO_CENTRAL = 0x02014b50;
  var FICHERO_LOCAL = 0x04034b50;

  /* El EOCD es de tamaño variable (el comentario final), así que es el
     único sitio fiable desde el que empezar: se busca desde el final. */
  function buscarEOCD(bytes) {
    var minimo = Math.max(0, bytes.length - 65557);
    for (var i = bytes.length - 22; i >= minimo; i--) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4B && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
        return i;
      }
    }
    throw new Error('No parece un .docx válido: no se encuentra el final del directorio central del ZIP.');
  }

  function leerDirectorioCentral(bytes) {
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var eocd = buscarEOCD(bytes);
    var total = u16(view, eocd + 10);
    var offsetCD = u32(view, eocd + 16);

    var entradas = [];
    var p = offsetCD;
    for (var i = 0; i < total; i++) {
      if (u32(view, p) !== FICHERO_CENTRAL) {
        throw new Error('Directorio central del ZIP corrupto en la entrada ' + i + '.');
      }
      var metodo = u16(view, p + 10);
      var tiempoDos = u16(view, p + 12);
      var fechaDos = u16(view, p + 14);
      var crc = u32(view, p + 16);
      var compTam = u32(view, p + 20);
      var tam = u32(view, p + 24);
      var nombreLargo = u16(view, p + 28);
      var extraLargo = u16(view, p + 30);
      var comentarioLargo = u16(view, p + 32);
      var atributosExternos = u32(view, p + 38);
      var offsetLocal = u32(view, p + 42);
      var nombre = new TextDecoder('utf-8').decode(bytes.subarray(p + 46, p + 46 + nombreLargo));
      var fin = p + 46 + nombreLargo + extraLargo + comentarioLargo;

      entradas.push({
        nombre: nombre, metodo: metodo, crc: crc, compTam: compTam, tam: tam,
        tiempoDos: tiempoDos, fechaDos: fechaDos, atributosExternos: atributosExternos,
        offsetLocal: offsetLocal, cdInicio: p, cdFin: fin
      });
      p = fin;
    }
    return entradas;
  }

  /* Dónde empiezan los datos comprimidos de una entrada: justo después
     de su propia cabecera local (que puede llevar un nombre o un
     "extra" de otro tamaño que el que trae el directorio central). */
  function inicioDeDatos(bytes, offsetLocal) {
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (u32(view, offsetLocal) !== FICHERO_LOCAL) {
      throw new Error('Cabecera local del ZIP corrupta en el byte ' + offsetLocal + '.');
    }
    var nombreLargo = u16(view, offsetLocal + 26);
    var extraLargo = u16(view, offsetLocal + 28);
    return offsetLocal + 30 + nombreLargo + extraLargo;
  }

  async function inflar(bytes) {
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function datosDeEntrada(bytes, entrada) {
    var inicio = inicioDeDatos(bytes, entrada.offsetLocal);
    var comprimidos = bytes.subarray(inicio, inicio + entrada.compTam);
    if (entrada.metodo === 0) return comprimidos;
    if (entrada.metodo === 8) return await inflar(comprimidos);
    throw new Error('El método de compresión ' + entrada.metodo + ' de "' + entrada.nombre +
                     '" no está soportado.');
  }

  /* ---------- escribir una entrada nueva, siempre sin comprimir ---------- */

  function cabeceraLocal(o) {
    var nombreBytes = o.nombreBytes;
    var buf = new Uint8Array(30 + nombreBytes.length);
    escribirU32(buf, 0, FICHERO_LOCAL);
    escribirU16(buf, 4, 20);              /* versión mínima: 2.0 */
    escribirU16(buf, 6, 0);               /* banderas: ninguna */
    escribirU16(buf, 8, 0);               /* método: 0, almacenado */
    escribirU16(buf, 10, o.tiempoDos || 0);
    escribirU16(buf, 12, o.fechaDos || 0);
    escribirU32(buf, 14, o.crc);
    escribirU32(buf, 18, o.tam);          /* comprimido == sin comprimir */
    escribirU32(buf, 22, o.tam);
    escribirU16(buf, 26, nombreBytes.length);
    escribirU16(buf, 28, 0);              /* sin "extra" */
    buf.set(nombreBytes, 30);
    return buf;
  }

  function entradaCentral(o) {
    var nombreBytes = o.nombreBytes;
    var buf = new Uint8Array(46 + nombreBytes.length);
    escribirU32(buf, 0, FICHERO_CENTRAL);
    escribirU16(buf, 4, 20);              /* versión con la que se hizo */
    escribirU16(buf, 6, 20);              /* versión mínima */
    escribirU16(buf, 8, 0);
    escribirU16(buf, 10, 0);              /* método: 0, almacenado */
    escribirU16(buf, 12, o.tiempoDos || 0);
    escribirU16(buf, 14, o.fechaDos || 0);
    escribirU32(buf, 16, o.crc);
    escribirU32(buf, 20, o.tam);
    escribirU32(buf, 24, o.tam);
    escribirU16(buf, 28, nombreBytes.length);
    escribirU16(buf, 30, 0);
    escribirU16(buf, 32, 0);
    escribirU16(buf, 34, 0);
    escribirU16(buf, 36, 0);
    escribirU32(buf, 38, o.atributosExternos || 0);
    escribirU32(buf, 42, o.offset);
    buf.set(nombreBytes, 46);
    return buf;
  }

  function finDeDirectorio(totalEntradas, tamDirectorio, offsetDirectorio) {
    var buf = new Uint8Array(22);
    escribirU32(buf, 0, FIN_DIRECTORIO);
    escribirU16(buf, 4, 0);
    escribirU16(buf, 6, 0);
    escribirU16(buf, 8, totalEntradas);
    escribirU16(buf, 10, totalEntradas);
    escribirU32(buf, 12, tamDirectorio);
    escribirU32(buf, 16, offsetDirectorio);
    escribirU16(buf, 20, 0);
    return buf;
  }

  /* ---------- reparar los huecos partidos y sustituir, por párrafo ---------- */

  var RE_PARRAFO = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  var RE_TEXTO = /<w:t\b[^>]*>[\s\S]*?<\/w:t>/g;
  var RE_HUECO = /\{[^{}]*\}/g;

  function decodificarEntidades(t) {
    return String(t || '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /* Ojo: solo &, < y >. Las comillas dentro de texto normal de <w:t>
     no hace falta escaparlas (no es un valor de atributo). */
  function escaparXml(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function extraerTextos(xmlParrafo) {
    var segmentos = [];
    var m;
    RE_TEXTO.lastIndex = 0;
    while ((m = RE_TEXTO.exec(xmlParrafo))) {
      var dentro = m[0].replace(/^<w:t\b[^>]*>/, '').replace(/<\/w:t>$/, '');
      segmentos.push({ inicio: m.index, fin: m.index + m[0].length, texto: dentro });
    }
    return segmentos;
  }

  /* Mueve los caracteres de un hueco partido hasta dejarlo entero
     dentro de un único segmento (el último de los que toca), sin
     tocar el texto de los segmentos que no forman parte de ningún
     hueco. Muta `segmentos` en el sitio. */
  function repararHuecosPartidos(segmentos) {
    var offsets = [];
    var acc = 0;
    segmentos.forEach(function (s) { offsets.push(acc); acc += s.texto.length; });
    var conjunto = segmentos.map(function (s) { return s.texto; }).join('');

    var huecos = [];
    var m;
    RE_HUECO.lastIndex = 0;
    while ((m = RE_HUECO.exec(conjunto))) huecos.push({ ini: m.index, fin: m.index + m[0].length });

    huecos.forEach(function (h) {
      var iInicio = -1, iFin = -1;
      for (var i = 0; i < segmentos.length; i++) {
        var s0 = offsets[i], s1 = s0 + segmentos[i].texto.length;
        if (h.ini >= s0 && h.ini < s1) iInicio = i;
        if (h.fin - 1 >= s0 && h.fin - 1 < s1) iFin = i;
      }
      if (iInicio === -1 || iFin === -1 || iInicio === iFin) return;   /* ya está entero */

      var recogido = '';
      for (var k = iInicio; k < iFin; k++) {
        if (k === iInicio) {
          var corte = h.ini - offsets[k];
          recogido += segmentos[k].texto.slice(corte);
          segmentos[k].texto = segmentos[k].texto.slice(0, corte);
        } else {
          recogido += segmentos[k].texto;
          segmentos[k].texto = '';
        }
      }
      segmentos[iFin].texto = recogido + segmentos[iFin].texto;
    });
  }

  /* Repara, sustituye y escapa un `<w:p>...</w:p>` completo. Se
     reescribe de atrás adelante para que las posiciones (calculadas
     sobre el xml original del párrafo) de los `<w:t>` que aún faltan
     por tocar no se muevan por los que ya se han sustituido. */
  function repararYRellenarParrafo(xmlParrafo, valores, faltanTotal) {
    var segmentos = extraerTextos(xmlParrafo);
    if (!segmentos.length) return xmlParrafo;
    repararHuecosPartidos(segmentos);

    var salida = xmlParrafo;
    for (var j = segmentos.length - 1; j >= 0; j--) {
      var seg = segmentos[j];
      var plano = decodificarEntidades(seg.texto);
      var r = Plantillas.rellenar(plano, valores);
      if (r.faltan.length) faltanTotal.push.apply(faltanTotal, r.faltan);
      var escapado = escaparXml(r.texto).split('\n').join('</w:t><w:br/><w:t xml:space="preserve">');
      var nuevo = '<w:t xml:space="preserve">' + escapado + '</w:t>';
      salida = salida.slice(0, seg.inicio) + nuevo + salida.slice(seg.fin);
    }
    return salida;
  }

  function rellenarXml(textoXml, valores, faltanTotal) {
    return textoXml.replace(RE_PARRAFO, function (parrafo) {
      return repararYRellenarParrafo(parrafo, valores, faltanTotal);
    });
  }

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

  /* ---------- la función pública ---------- */

  var RE_ENTRADA_A_TOCAR = /^word\/(document\.xml|header\d*\.xml|footer\d*\.xml)$/i;

  async function rellenar(bufferDocx, valores) {
    var bytes = bufferDocx instanceof Uint8Array ? bufferDocx : new Uint8Array(bufferDocx);
    var entradas = leerDirectorioCentral(bytes);

    var faltanTotal = [];
    var partes = [];
    var entradasCentrales = [];
    var offsetActual = 0;

    for (var i = 0; i < entradas.length; i++) {
      var e = entradas[i];

      if (!RE_ENTRADA_A_TOCAR.test(e.nombre)) {
        var inicioLocal = inicioDeDatos(bytes, e.offsetLocal);
        var tramo = bytes.subarray(e.offsetLocal, inicioLocal + e.compTam);
        partes.push(tramo);

        var cdCopia = bytes.slice(e.cdInicio, e.cdFin);
        escribirU32(cdCopia, 42, offsetActual);
        entradasCentrales.push(cdCopia);

        offsetActual += tramo.length;
        continue;
      }

      var original = await datosDeEntrada(bytes, e);
      var textoOriginal = new TextDecoder('utf-8').decode(original);
      var textoNuevo = rellenarXml(textoOriginal, valores, faltanTotal);
      var datosNuevos = new TextEncoder().encode(textoNuevo);
      var crcNuevo = crc32(datosNuevos);
      var nombreBytes = new TextEncoder().encode(e.nombre);

      var local = cabeceraLocal({
        crc: crcNuevo, tam: datosNuevos.length, nombreBytes: nombreBytes,
        tiempoDos: e.tiempoDos, fechaDos: e.fechaDos
      });
      partes.push(local, datosNuevos);

      entradasCentrales.push(entradaCentral({
        crc: crcNuevo, tam: datosNuevos.length, nombreBytes: nombreBytes,
        tiempoDos: e.tiempoDos, fechaDos: e.fechaDos,
        atributosExternos: e.atributosExternos, offset: offsetActual
      }));

      offsetActual += local.length + datosNuevos.length;
    }

    var inicioDirectorio = offsetActual;
    var directorioCentral = concatenar(entradasCentrales);
    var eocd = finDeDirectorio(entradas.length, directorioCentral.length, inicioDirectorio);
    var salida = concatenar(partes.concat([directorioCentral, eocd]));

    var vistos = {};
    var faltanUnicos = faltanTotal.filter(function (x) { return x && !vistos[x] && (vistos[x] = true); });

    return {
      blob: new Blob([salida], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      faltan: faltanUnicos
    };
  }

  /* Lee una entrada de texto de un .docx ya generado (por ejemplo,
     word/document.xml), para las pruebas: no hace falta un segundo
     lector de ZIP aparte del de aquí arriba. */
  async function leerEntradaDeTexto(bufferDocx, nombreEntrada) {
    var bytes = bufferDocx instanceof Uint8Array ? bufferDocx : new Uint8Array(bufferDocx);
    var entradas = leerDirectorioCentral(bytes);
    var entrada = entradas.filter(function (e) { return e.nombre === nombreEntrada; })[0];
    if (!entrada) return null;
    var datos = await datosDeEntrada(bytes, entrada);
    return new TextDecoder('utf-8').decode(datos);
  }

  return {
    rellenar: rellenar,
    ponerImagen: ponerImagen,
    leerEntradaDeTexto: leerEntradaDeTexto,
    /* Expuestos solo para las pruebas del ZIP y de la reparación de
       huecos partidos, sin tener que reescribirlos allí. */
    crc32: crc32,
    leerDirectorioCentral: leerDirectorioCentral,
    repararYRellenarParrafo: repararYRellenarParrafo
  };
})();
