/* ============================================================
   docx-tabla.js — tablas de datos dentro de un .docx (24-sep-2026,
   fila 110, docs/TABLAS-DE-DATOS.md).

   - `Docx.ponerTabla(buffer, nombreHueco, cabecera, filas)`: gemela de
     `Docx.ponerImagen` (js/docx-imagen.js). Sustituye el párrafo cuyo
     texto sea `{{nombreHueco}}` por un `<w:tbl>` con la cabecera en
     negrita, bordes finos y el ancho útil de la página.
   - `Docx.resaltarFaltas(buffer)`: lo que ha quedado como
     `⟦falta: Especialidad⟧` (lo pone js/tablas-datos.js en los huecos sin
     dato) se escribe como «[falta: Especialidad]» resaltado en amarillo.
   - `Docx.textoDelDocumento(buffer)`: el texto seguido del documento,
     para saber qué huecos trae (aunque Word los parta en trozos).

   Usa las piezas del ZIP de js/docx.js (`Docx.interno`). Se carga
   después de js/docx.js.
   ============================================================ */
(function () {
  var I = Docx.interno;
  var RE_ENTRADAS = /^word\/(document\.xml|header\d*\.xml|footer\d*\.xml)$/i;
  var MARCA_INI = '⟦', MARCA_FIN = '⟧';

  function escapar(t) { return I.escaparXml(String(t === null || t === undefined ? '' : t)); }

  /* Reescribe el ZIP cambiando el texto de las entradas que `fn(nombre,
     texto)` devuelva distinto (o null para no tocarla). */
  async function reescribir(bufferDocx, fn) {
    var bytes = bufferDocx instanceof Uint8Array ? bufferDocx : new Uint8Array(bufferDocx);
    var entradas = I.leerDirectorioCentral(bytes);
    var partes = [], centrales = [], offset = 0, tocado = false;
    for (var i = 0; i < entradas.length; i++) {
      var e = entradas[i];
      var nuevo = null;
      if (RE_ENTRADAS.test(e.nombre)) {
        var texto = new TextDecoder('utf-8').decode(await I.datosDeEntrada(bytes, e));
        var r = fn(e.nombre, texto);
        if (r !== null && r !== undefined && r !== texto) nuevo = r;
      }
      if (nuevo === null) {
        var inicio = I.inicioDeDatos(bytes, e.offsetLocal);
        var tramo = bytes.subarray(e.offsetLocal, inicio + e.compTam);
        partes.push(tramo);
        var cd = bytes.slice(e.cdInicio, e.cdFin);
        I.escribirU32(cd, 42, offset);
        centrales.push(cd);
        offset += tramo.length;
        continue;
      }
      tocado = true;
      var datos = new TextEncoder().encode(nuevo);
      var crc = I.crc32(datos);
      var nombreBytes = new TextEncoder().encode(e.nombre);
      var local = I.cabeceraLocal({ crc: crc, tam: datos.length, nombreBytes: nombreBytes, tiempoDos: e.tiempoDos, fechaDos: e.fechaDos });
      partes.push(local, datos);
      centrales.push(I.entradaCentral({ crc: crc, tam: datos.length, nombreBytes: nombreBytes, tiempoDos: e.tiempoDos,
        fechaDos: e.fechaDos, atributosExternos: e.atributosExternos, offset: offset }));
      offset += local.length + datos.length;
    }
    if (!tocado) return bytes;
    var directorio = I.concatenar(centrales);
    return I.concatenar(partes.concat([directorio, I.finDeDirectorio(entradas.length, directorio.length, offset)]));
  }

  function textoDeParrafo(p) {
    return I.extraerTextos(p).map(function (s) { return I.decodificarEntidades(s.texto); }).join('');
  }

  function huecoRegex(nombre) {
    return new RegExp('\\{\\{\\s*' + nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*') + '\\s*\\}\\}', 'i');
  }

  function celda(texto, ancho, negrita) {
    return '<w:tc><w:tcPr><w:tcW w:w="' + ancho + '" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>' +
      '<w:r>' + (negrita ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + escapar(texto) + '</w:t></w:r></w:p></w:tc>';
  }

  /* Una tabla de Word: cabecera en negrita, bordes finos, a 9.000 dxa
     (el ancho útil de un A4 con los márgenes de las plantillas del centro). */
  function tablaXml(cabecera, filas) {
    var total = 9000;
    var ancho = Math.floor(total / Math.max(1, cabecera.length));
    var borde = '<w:top w:val="single" w:sz="4" w:space="0" w:color="808080"/><w:left w:val="single" w:sz="4" w:space="0" w:color="808080"/>' +
      '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="808080"/><w:right w:val="single" w:sz="4" w:space="0" w:color="808080"/>' +
      '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="808080"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="808080"/>';
    return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblBorders>' + borde + '</w:tblBorders>' +
      '<w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid>' +
      cabecera.map(function () { return '<w:gridCol w:w="' + ancho + '"/>'; }).join('') + '</w:tblGrid>' +
      '<w:tr>' + cabecera.map(function (c) { return celda(c, ancho, true); }).join('') + '</w:tr>' +
      filas.map(function (f) { return '<w:tr>' + f.map(function (c) { return celda(c, ancho, false); }).join('') + '</w:tr>'; }).join('') +
      '</w:tbl><w:p/>';
  }

  /* Devuelve { bytes, encontrado }. */
  async function ponerTabla(bufferDocx, nombreHueco, cabecera, filas) {
    var re = huecoRegex(nombreHueco);
    var encontrado = false;
    var bytes = await reescribir(bufferDocx, function (nombre, texto) {
      return texto.replace(I.RE_PARRAFO, function (p) {
        if (!re.test(textoDeParrafo(p))) return p;
        encontrado = true;
        return tablaXml(cabecera, filas);
      });
    });
    return { bytes: bytes, encontrado: encontrado };
  }

  /* Dentro de cada `<w:r>` con una marca ⟦…⟧, cada `<w:t>` que la lleve se
     parte: lo de fuera sigue en el mismo trozo (con su formato, y con lo
     demás que hubiera en él, como un salto de línea); lo de dentro va en
     un trozo aparte, «[…]», resaltado en amarillo. */
  var RE_RUN = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
  var RE_T = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;

  function resaltarXml(texto) {
    if (texto.indexOf(MARCA_INI) === -1) return texto;
    var reMarca = new RegExp('(' + MARCA_INI + '[^' + MARCA_FIN + ']*' + MARCA_FIN + ')');
    return texto.replace(RE_RUN, function (todo, dentro) {
      if (dentro.indexOf(MARCA_INI) === -1) return todo;
      var rPr = (dentro.match(/^\s*<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0].trim();
      var conResalte = rPr ? rPr.replace('</w:rPr>', '<w:highlight w:val="yellow"/></w:rPr>') : '<w:rPr><w:highlight w:val="yellow"/></w:rPr>';
      var nuevo = dentro.replace(RE_T, function (t, contenido) {
        if (contenido.indexOf(MARCA_INI) === -1) return t;
        return contenido.split(reMarca).filter(function (x) { return x !== ''; }).map(function (x) {
          if (x.charAt(0) === MARCA_INI) {
            return '</w:r><w:r>' + conResalte + '<w:t xml:space="preserve">[' + x.slice(1, -1) + ']</w:t></w:r><w:r>' + rPr;
          }
          return '<w:t xml:space="preserve">' + x + '</w:t>';
        }).join('');
      });
      return '<w:r>' + nuevo + '</w:r>';
    }).replace(/<w:r>(<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr>)?<\/w:r>/g, '');
  }

  function resaltarFaltas(bufferDocx) {
    return reescribir(bufferDocx, function (nombre, texto) { return resaltarXml(texto); });
  }

  async function textoDelDocumento(bufferDocx) {
    var bytes = bufferDocx instanceof Uint8Array ? bufferDocx : new Uint8Array(bufferDocx);
    var trozos = [];
    var entradas = I.leerDirectorioCentral(bytes).filter(function (e) { return RE_ENTRADAS.test(e.nombre); });
    for (var i = 0; i < entradas.length; i++) {
      var texto = new TextDecoder('utf-8').decode(await I.datosDeEntrada(bytes, entradas[i]));
      (texto.match(I.RE_PARRAFO) || []).forEach(function (p) { trozos.push(textoDeParrafo(p)); });
    }
    return trozos.join('\n');
  }

  Docx.ponerTabla = ponerTabla;
  Docx.resaltarFaltas = resaltarFaltas;
  Docx.textoDelDocumento = textoDelDocumento;
  Docx.MARCA_FALTA = function (texto) { return MARCA_INI + 'falta: ' + texto + MARCA_FIN; };
  Docx._resaltarXml = resaltarXml;
})();
