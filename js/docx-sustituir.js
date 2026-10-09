/* ============================================================
   docx-sustituir.js — cambiar texto dentro de un .docx, quitar
   párrafos, quitar la cabecera de página y poner el párrafo
   {{MEMBRETE}} (fila 280, docs/CONVERTIR-EN-PLANTILLA.md).

   Es la pieza «delicada» de «Convertir en plantilla». Pura: recibe el
   .docx original (ArrayBuffer o Uint8Array) y una lista de cambios, y
   devuelve el .docx de trabajo y las veces que se aplicó cada cambio.
   SIEMPRE se parte del original y se aplican todos los cambios activos:
   no hay estado intermedio ni «deshacer» aparte (desmarcar es volver a
   calcular sin ese cambio).

   Word reparte el texto de un párrafo en varios `<w:t>`. Se busca en el
   texto unido del párrafo y lo que se pone se escribe en el primer trozo
   tocado, vaciando el resto del tramo; el formato de ese primer trozo se
   conserva (el de los demás trozos, fuera del tramo, no se toca). Lo que
   se pone se protege con una marca privada mientras se aplican los
   demás cambios, para que un hueco recién puesto no se vuelva a cambiar.

   Se recorre el cuerpo (`word/document.xml`, con sus tablas) y los pies
   de página; las cabeceras no se tocan (se quitan, si se pide).

   Usa las piezas del ZIP de js/docx.js (`Docx.interno`), igual que
   js/docx-imagen.js.
   ============================================================ */
var DocxSustituir = (function () {

  var I = window.Docx.interno;
  /* Un párrafo de verdad: `<w:p …>…</w:p>`, sin tragarse al siguiente si es `<w:p/>`. */
  var RE_PARRAFO = /<w:p\b(?:[^>]*[^\/>])?>[\s\S]*?<\/w:p>/g;
  var RE_A_TOCAR = /^word\/(document\.xml|footer\d*\.xml)$/i;
  var INI = '\uE000', FIN = '\uE001';

  /* ---------- buscar: sin mayúsculas, sin tildes, palabra entera ---------- */

  /* Del mismo largo que el texto (letra a letra), para que las posiciones valgan en el original. */
  function normalizar(texto) {
    var s = String(texto === undefined || texto === null ? '' : texto), salida = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), b = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      salida += b.length === 1 ? b.toLowerCase() : c.toLowerCase();
    }
    return salida;
  }

  function escaparRe(t) { return String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* [{ ini, fin }] de cada aparición de `buscar` en `texto`. */
  function buscarTodos(texto, buscar) {
    var b = normalizar(String(buscar || '').trim());
    if (!b) return [];
    var t = normalizar(texto), salida = [], m;
    var re = new RegExp('(?<![\\p{L}\\p{N}_])' + escaparRe(b).replace(/\s+/g, '\\s+') + '(?![\\p{L}\\p{N}_])', 'gu');
    while ((m = re.exec(t))) {
      salida.push({ ini: m.index, fin: m.index + m[0].length });
      if (!m[0].length) re.lastIndex++;
    }
    return salida;
  }

  function contar(texto, buscar) { return buscarTodos(texto, buscar).length; }

  /* ---------- un párrafo ---------- */

  function planoDeXml(xml) { return xml.replace(/<[^>]*>/g, '').trim(); }

  /* Pone `nuevo` en el tramo [ini, fin) del texto unido de los trozos. */
  function ponerEnTramo(textos, ini, fin, nuevo) {
    var offsets = [], acc = 0;
    textos.forEach(function (t) { offsets.push(acc); acc += t.length; });
    var i = -1, j = -1;
    for (var k = 0; k < textos.length; k++) {
      if (ini >= offsets[k] && ini < offsets[k] + textos[k].length) i = k;
      if (fin - 1 >= offsets[k] && fin - 1 < offsets[k] + textos[k].length) j = k;
    }
    if (i === -1 || j === -1) return;
    if (i === j) { textos[i] = textos[i].slice(0, ini - offsets[i]) + nuevo + textos[i].slice(fin - offsets[i]); return; }
    textos[i] = textos[i].slice(0, ini - offsets[i]) + nuevo;
    for (var q = i + 1; q < j; q++) textos[q] = '';
    textos[j] = textos[j].slice(fin - offsets[j]);
  }

  function cambiarParrafo(parrafo, cambios, veces) {
    var segs = I.extraerTextos(parrafo);
    if (!segs.length) return parrafo;
    var originales = segs.map(function (s) { return I.decodificarEntidades(s.texto); });
    var textos = originales.slice(), marcas = [];
    cambios.forEach(function (c) {
      var hallados = buscarTodos(textos.join(''), c.buscar);
      for (var h = hallados.length - 1; h >= 0; h--) {
        marcas.push(String(c.poner));
        ponerEnTramo(textos, hallados[h].ini, hallados[h].fin, INI + (marcas.length - 1) + FIN);
        veces[c.id] = (veces[c.id] || 0) + 1;
        if (c.tambien) veces[c.tambien] = (veces[c.tambien] || 0) + 1;   /* un «D.» pegado a un nombre cuenta también para el nombre */
      }
    });
    if (!marcas.length) return parrafo;
    textos = textos.map(function (t) {
      return t.replace(new RegExp(INI + '(\\d+)' + FIN, 'g'), function (m, n) { return marcas[+n]; });
    });
    var salida = parrafo;
    for (var j = segs.length - 1; j >= 0; j--) {
      if (textos[j] === originales[j]) continue;
      salida = salida.slice(0, segs[j].inicio) + '<w:t xml:space="preserve">' + I.escaparXml(textos[j]) + '</w:t>' + salida.slice(segs[j].fin);
    }
    /* Un párrafo con texto que se queda vacío (y sin imagen) desaparece. */
    if (planoDeXml(parrafo) && !planoDeXml(salida) && !/<w:drawing|<w:pict/.test(salida)) return '';
    return salida;
  }

  /* El texto de cada párrafo de un trozo de xml, en orden (es el índice que usa `quitarParrafos`). */
  function textosDeParrafos(xml) {
    var lista = [];
    String(xml).replace(RE_PARRAFO, function (p) {
      lista.push(I.extraerTextos(p).map(function (s) { return I.decodificarEntidades(s.texto); }).join(''));
      return p;
    });
    return lista;
  }

  function transformarXml(xml, op, esCuerpo, veces) {
    var indice = -1, quitar = {};
    (esCuerpo ? op.quitarParrafos || [] : []).forEach(function (n) { quitar[n] = true; });
    var salida = xml.replace(RE_PARRAFO, function (p) {
      indice++;
      if (quitar[indice]) return '';
      var nuevo = cambiarParrafo(p, op.cambios || [], veces);
      /* Fila 322: el índice, en el original, de cada párrafo del cuerpo que sobrevive (para «Retocar»). */
      if (esCuerpo && op.sobrevivientes && nuevo !== '') op.sobrevivientes.push(indice);
      return nuevo;
    });
    if (esCuerpo) {
      if (op.sinCabecera) salida = salida.replace(/<w:headerReference\b[^>]*\/>/g, '');
      if (op.membrete && salida.indexOf('{{MEMBRETE}}') === -1) {
        salida = salida.replace(/<w:body>/, '<w:body><w:p><w:r><w:t xml:space="preserve">{{MEMBRETE}}</w:t></w:r></w:p>');
      }
    }
    return salida;
  }

  /* ---------- el .docx ---------- */

  /* op: { cambios: [{ id, buscar, poner }], quitarParrafos: [índices del cuerpo], sinCabecera, membrete,
     sobrevivientes: [] (opcional: se llena con el índice original de cada párrafo del cuerpo que queda) }.
     Devuelve { bytes, blob, veces: { id: n } }. */
  async function aplicar(buffer, op) {
    op = op || {};
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var entradas = I.leerDirectorioCentral(bytes);
    var veces = {}, partes = [], centrales = [], offset = 0;
    for (var i = 0; i < entradas.length; i++) {
      var e = entradas[i];
      if (!RE_A_TOCAR.test(e.nombre)) {
        var inicioLocal = I.inicioDeDatos(bytes, e.offsetLocal);
        var tramo = bytes.subarray(e.offsetLocal, inicioLocal + e.compTam);
        partes.push(tramo);
        var copia = bytes.slice(e.cdInicio, e.cdFin);
        I.escribirU32(copia, 42, offset);
        centrales.push(copia);
        offset += tramo.length;
        continue;
      }
      var xml = new TextDecoder('utf-8').decode(await I.datosDeEntrada(bytes, e));
      var nuevo = new TextEncoder().encode(transformarXml(xml, op, /document\.xml$/i.test(e.nombre), veces));
      var nombreBytes = new TextEncoder().encode(e.nombre), crc = I.crc32(nuevo);
      var local = I.cabeceraLocal({ crc: crc, tam: nuevo.length, nombreBytes: nombreBytes, tiempoDos: e.tiempoDos, fechaDos: e.fechaDos });
      partes.push(local, nuevo);
      centrales.push(I.entradaCentral({ crc: crc, tam: nuevo.length, nombreBytes: nombreBytes, tiempoDos: e.tiempoDos,
        fechaDos: e.fechaDos, atributosExternos: e.atributosExternos, offset: offset }));
      offset += local.length + nuevo.length;
    }
    var directorio = I.concatenar(centrales);
    var salida = I.concatenar(partes.concat([directorio, I.finDeDirectorio(entradas.length, directorio.length, offset)]));
    return {
      bytes: salida, veces: veces,
      blob: new Blob([salida], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    };
  }

  /* Los textos de los párrafos del cuerpo y de los pies, para proponer cambios. */
  async function leerParrafos(buffer) {
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var entradas = I.leerDirectorioCentral(bytes), cuerpo = [], pies = [];
    for (var i = 0; i < entradas.length; i++) {
      if (!RE_A_TOCAR.test(entradas[i].nombre)) continue;
      var xml = new TextDecoder('utf-8').decode(await I.datosDeEntrada(bytes, entradas[i]));
      var t = textosDeParrafos(xml);
      if (/document\.xml$/i.test(entradas[i].nombre)) cuerpo = t; else pies = pies.concat(t);
    }
    return { cuerpo: cuerpo, pies: pies, hayCabecera: entradas.some(function (e) { return /^word\/header\d*\.xml$/i.test(e.nombre); }) };
  }

  /* El xml del cuerpo, para saber qué párrafos son solo una imagen. */
  async function xmlDelCuerpo(buffer) {
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var e = I.leerDirectorioCentral(bytes).filter(function (x) { return x.nombre === 'word/document.xml'; })[0];
    return e ? new TextDecoder('utf-8').decode(await I.datosDeEntrada(bytes, e)) : '';
  }

  /* Por párrafo del cuerpo: { texto, imagen }, con `imagen` cierto si lleva un dibujo. */
  function parrafosConImagen(xml) {
    var lista = [];
    String(xml).replace(RE_PARRAFO, function (p) {
      lista.push({ texto: I.extraerTextos(p).map(function (s) { return I.decodificarEntidades(s.texto); }).join(''), imagen: /<w:drawing|<w:pict/.test(p) });
      return p;
    });
    return lista;
  }

  return {
    normalizar: normalizar, buscarTodos: buscarTodos, contar: contar, aplicar: aplicar,
    leerParrafos: leerParrafos, xmlDelCuerpo: xmlDelCuerpo, parrafosConImagen: parrafosConImagen,
    textosDeParrafos: textosDeParrafos, transformarXml: transformarXml
  };
})();
window.DocxSustituir = DocxSustituir;
