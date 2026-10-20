/* ============================================================
   docx-pie.js — el pie común de los Word con membrete (fila 375,
   docs/TELEFONO-Y-CORREO-DEL-CENTRO.md): una línea pequeña y centrada
   con el teléfono y el correo del centro, en el pie de cada página.
   Lo pone la aplicación al generar el documento; ninguna plantilla se
   toca. Se carga justo después de js/docx-imagen.js.

   `Docx.ponerPie(buffer, { telefono, correo, hueco })` devuelve otro
   buffer (Uint8Array). No toca nada (devuelve el mismo) si:
     - el documento no tiene el hueco `{{<hueco>}}` (por defecto
       MEMBRETE): los formularios y demás salen como siempre;
     - no hay ni teléfono ni correo;
     - la plantilla ya trae un pie con algún texto o campo (también solo
       el número de página).
   Si no trae pie, o el que trae está vacío, se pone el nuestro. Letra: la
   que hereda del estilo Normal; tamaño, 2 puntos menos que el de ese
   estilo (o que el de los valores por defecto del documento); gris oscuro.
   ============================================================ */
(function () {
  var I = Docx.interno;

  var CT_PIE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml';
  var TIPO_PIE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';
  var NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  var NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var GRIS = '404040';
  var MEDIOS_PUNTOS_POR_DEFECTO = 22;   /* Calibri 11, la de las plantillas de la aplicación */

  function texto(bytes, entrada) {
    return I.datosDeEntrada(bytes, entrada).then(function (d) { return new TextDecoder('utf-8').decode(d); });
  }

  function escapar(t) { return I.escaparXml ? I.escaparXml(t) : String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* La línea: «Teléfono 9XX XXX XXX · Correo xxx@xxx»; con uno solo, ese solo. */
  function linea(telefono, correo) {
    var partes = [];
    if (String(telefono || '').trim()) partes.push('Teléfono ' + String(telefono).trim());
    if (String(correo || '').trim()) partes.push('Correo ' + String(correo).trim());
    return partes.join(' · ');
  }

  /* ¿Lleva el pie algún texto o algún campo (número de página incluido)? */
  function pieConAlgo(xml) {
    if (/<w:fldChar|<w:fldSimple|<w:instrText/.test(xml)) return true;
    var t = '', m, re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
    while ((m = re.exec(xml))) t += m[1];
    return t.trim() !== '';
  }

  /* El tamaño del estilo Normal (en medios puntos) o, si no lo tiene, el de los valores por defecto. */
  function tamanoBase(stylesXml) {
    if (stylesXml) {
      var normal = /<w:style\b[^>]*w:styleId="Normal"[^>]*>[\s\S]*?<\/w:style>/.exec(stylesXml);
      var sz = normal && /<w:sz\s+w:val="(\d+)"/.exec(normal[0]);
      if (sz) return +sz[1];
      var def = /<w:docDefaults>[\s\S]*?<\/w:docDefaults>/.exec(stylesXml);
      sz = def && /<w:sz\s+w:val="(\d+)"/.exec(def[0]);
      if (sz) return +sz[1];
    }
    return MEDIOS_PUNTOS_POR_DEFECTO;
  }

  function xmlDelPie(contenido, medios) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
      '<w:ftr xmlns:w="' + NS_W + '"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
      '<w:r><w:rPr><w:color w:val="' + GRIS + '"/><w:sz w:val="' + medios + '"/><w:szCs w:val="' + medios + '"/></w:rPr>' +
      '<w:t xml:space="preserve">' + escapar(contenido) + '</w:t></w:r></w:p></w:ftr>';
  }

  function tieneHueco(xml, hueco) {
    var re = new RegExp('\\{\\{\\s*' + hueco.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\}\\}', 'i');
    var encontrado = false;
    String(xml).replace(I.RE_PARRAFO, function (p) {
      var plano = I.extraerTextos(p).map(function (s) { return I.decodificarEntidades(s.texto); }).join('');
      if (re.test(plano)) encontrado = true;
      return p;
    });
    return encontrado;
  }

  async function ponerPie(bufferDocx, opciones) {
    var o = opciones || {};
    var bytes = bufferDocx instanceof Uint8Array ? bufferDocx : new Uint8Array(bufferDocx);
    var contenido = linea(o.telefono, o.correo);
    if (!contenido) return bytes;

    var entradas = I.leerDirectorioCentral(bytes);
    var porNombre = {};
    entradas.forEach(function (e) { porNombre[e.nombre] = e; });
    if (!porNombre['word/document.xml']) return bytes;

    /* Solo los documentos con membrete: el hueco, en el cuerpo o en una cabecera. */
    var conHueco = false, i, e;
    for (i = 0; i < entradas.length && !conHueco; i++) {
      e = entradas[i];
      if (/^word\/(document|header\d*)\.xml$/i.test(e.nombre)) conHueco = tieneHueco(await texto(bytes, e), o.hueco || 'MEMBRETE');
    }
    if (!conHueco) return bytes;

    /* Un pie que ya trae algo se deja tal cual. */
    var vacios = [];
    for (i = 0; i < entradas.length; i++) {
      e = entradas[i];
      if (!/^word\/footer\d*\.xml$/i.test(e.nombre)) continue;
      if (pieConAlgo(await texto(bytes, e))) return bytes;
      vacios.push(e.nombre);
    }

    var medios = Math.max(8, tamanoBase(porNombre['word/styles.xml'] ? await texto(bytes, porNombre['word/styles.xml']) : '') - 4);
    var pieXml = xmlDelPie(contenido, medios);
    var cambios = {}, nuevas = [];

    var doc = await texto(bytes, porNombre['word/document.xml']);
    var relsNombre = 'word/_rels/document.xml.rels';
    var rels = porNombre[relsNombre] ? await texto(bytes, porNombre[relsNombre])
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

    /* ¿Hay ya un pie «por defecto» (vacío) enganchado? Entonces se rellena ese. */
    var ref = /<w:footerReference\b[^>]*>/.exec(doc.replace(/<w:footerReference\b[^>]*w:type="(?:first|even)"[^>]*>/g, ''));
    var rIdExistente = ref && /r:id="([^"]+)"/.exec(ref[0]);
    var destino = null;
    if (rIdExistente) {
      var rel = new RegExp('<Relationship\\b[^>]*Id="' + rIdExistente[1] + '"[^>]*>').exec(rels);
      var objetivo = rel && /Target="([^"]+)"/.exec(rel[0]);
      if (objetivo) destino = 'word/' + objetivo[1].replace(/^\/?(word\/)?/, '');
    }
    if (destino && porNombre[destino]) {
      cambios[destino] = pieXml;
    } else {
      /* Pie nuevo: su parte, su relación, su tipo de contenido y su enganche en la primera sección. */
      var n = 1;
      while (porNombre['word/footerGestor' + n + '.xml']) n++;
      var nombrePie = 'word/footerGestor' + n + '.xml';
      var usados = {}, m, reId = /Id="([^"]+)"/g;
      while ((m = reId.exec(rels))) usados[m[1]] = true;
      var k = 1;
      while (usados['rIdPieGestor' + k]) k++;
      var rId = 'rIdPieGestor' + k;
      nuevas.push({ nombre: nombrePie, texto: pieXml });
      var relacion = '<Relationship Id="' + rId + '" Type="' + TIPO_PIE + '" Target="footerGestor' + n + '.xml"/>';
      var relsNuevo = rels.replace('</Relationships>', relacion + '</Relationships>');
      if (porNombre[relsNombre]) cambios[relsNombre] = relsNuevo; else nuevas.push({ nombre: relsNombre, texto: relsNuevo });

      var enganche = '<w:footerReference xmlns:r="' + NS_R + '" w:type="default" r:id="' + rId + '"/>';
      var docNuevo;
      var seccion = /<w:sectPr\b[^>]*>/.exec(doc);
      if (seccion && /\/>$/.test(seccion[0])) {
        docNuevo = doc.replace(seccion[0], seccion[0].replace(/\s*\/>$/, '>') + enganche + '</w:sectPr>');
      } else if (seccion) {
        docNuevo = doc.replace(seccion[0], seccion[0] + enganche);
      } else {
        docNuevo = doc.replace(/<\/w:body>/, '<w:sectPr>' + enganche + '</w:sectPr></w:body>');
      }
      if (docNuevo === doc) return bytes;
      cambios['word/document.xml'] = docNuevo;

      var tiposNombre = '[Content_Types].xml';
      if (porNombre[tiposNombre]) {
        var tipos = await texto(bytes, porNombre[tiposNombre]);
        cambios[tiposNombre] = tipos.replace('</Types>', '<Override PartName="/' + nombrePie + '" ContentType="' + CT_PIE + '"/></Types>');
      }
    }

    var partes = [], centrales = [], offset = 0;
    function escribirNueva(nombre, contenidoEntrada, original) {
      var datos = new TextEncoder().encode(contenidoEntrada);
      var crc = I.crc32(datos), nombreBytes = new TextEncoder().encode(nombre);
      var tiempo = original ? original.tiempoDos : 0, fecha = original ? original.fechaDos : 0;
      var local = I.cabeceraLocal({ crc: crc, tam: datos.length, nombreBytes: nombreBytes, tiempoDos: tiempo, fechaDos: fecha });
      partes.push(local, datos);
      centrales.push(I.entradaCentral({ crc: crc, tam: datos.length, nombreBytes: nombreBytes, tiempoDos: tiempo, fechaDos: fecha,
        atributosExternos: original ? original.atributosExternos : 0, offset: offset }));
      offset += local.length + datos.length;
    }
    for (var j = 0; j < entradas.length; j++) {
      var ent = entradas[j];
      if (Object.prototype.hasOwnProperty.call(cambios, ent.nombre)) { escribirNueva(ent.nombre, cambios[ent.nombre], ent); continue; }
      var inicioLocal = I.inicioDeDatos(bytes, ent.offsetLocal);
      var tramo = bytes.subarray(ent.offsetLocal, inicioLocal + ent.compTam);
      partes.push(tramo);
      var copia = bytes.slice(ent.cdInicio, ent.cdFin);
      I.escribirU32(copia, 42, offset);
      centrales.push(copia);
      offset += tramo.length;
    }
    nuevas.forEach(function (x) { escribirNueva(x.nombre, x.texto, null); });

    var directorio = I.concatenar(centrales);
    return I.concatenar(partes.concat([directorio, I.finDeDirectorio(entradas.length + nuevas.length, directorio.length, offset)]));
  }

  Docx.ponerPie = ponerPie;
  Docx.linea = linea;
})();
