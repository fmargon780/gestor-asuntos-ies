/* ============================================================
   pdf-a-parrafos.js — el texto de un PDF, en párrafos (fila 281,
   docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md, apartados 2 y 3.a).

   Para «Convertir en plantilla» con un PDF que no tiene su Word. Solo
   copia el TEXTO: tablas, columnas, imágenes y recuadros no se copian.

   Puro, salvo `leer` (pdf.js, por `App.cargarPdfJs`, como
   js/registro-lector.js) y `tieneCasillas` (pdf-lib, por
   `PdfHerramientas.cargarPdfLib`). Entrada: páginas
   `{ ancho, alto, items: [{ texto, x, y, ancho, alto }] }` (puntos; `y`
   crece hacia arriba, como en pdf.js; `alto` es el tamaño de la letra).

     renglones(pagina)   -> los trozos de la misma altura, de izquierda a derecha
     parrafos(paginas)   -> [{ texto, centrado, tamano, titulo, repetido, pagina }]
     sinTexto(paginas)   -> menos de 40 caracteres entre todas
     tieneTabla(paginas) -> tres o más renglones seguidos con tres o más
                            trozos separados por huecos anchos y alineados
   ============================================================ */
var PdfAParrafos = (function () {

  var MINIMO_TEXTO = 40;
  var HUECO_ANCHO = 3 * 0.28;   /* tres veces el ancho de un espacio, en tamaños de letra */

  /* ---------- renglones ---------- */

  /* Los trozos de la misma altura forman un renglón, de izquierda a derecha. */
  function renglones(pagina) {
    var items = (pagina.items || []).filter(function (i) { return String(i.texto || '').trim() !== '' || false; });
    items = items.slice().sort(function (a, b) { return (b.y - a.y) || (a.x - b.x); });
    var filas = [];
    items.forEach(function (it) {
      var fila = filas.filter(function (f) { return Math.abs(f.y - it.y) <= 0.5 * Math.max(f.alto, it.alto); })[0];
      if (!fila) { fila = { y: it.y, alto: it.alto, items: [] }; filas.push(fila); }
      fila.items.push(it);
    });
    return filas.sort(function (a, b) { return b.y - a.y; }).map(function (f) {
      f.items.sort(function (a, b) { return a.x - b.x; });
      var texto = '', cortes = [], previo = null;
      f.items.forEach(function (it) {
        var t = String(it.texto).replace(/\s+/g, ' ');
        if (previo) {
          var hueco = it.x - (previo.x + previo.ancho), tam = Math.max(previo.alto, it.alto) || 1;
          if (hueco > HUECO_ANCHO * tam) cortes.push(it.x);
          if (hueco > 0.1 * tam && !/\s$/.test(texto) && !/^\s/.test(t)) texto += ' ';
        }
        texto += t;
        previo = it;
      });
      var ultimo = f.items[f.items.length - 1];
      return { texto: texto.replace(/\s+/g, ' ').trim(), x0: f.items[0].x, x1: ultimo.x + ultimo.ancho, y: f.y, alto: f.alto,
               cortes: cortes, inicios: [f.items[0].x].concat(cortes) };
    });
  }

  /* ---------- tabla y falta de texto ---------- */

  function sinTexto(paginas) {
    var n = 0;
    (paginas || []).forEach(function (p) { (p.items || []).forEach(function (i) { n += String(i.texto || '').replace(/\s+/g, '').length; }); });
    return n < MINIMO_TEXTO;
  }

  /* Tres o más renglones seguidos con tres o más trozos, alineados en las mismas columnas. */
  function tieneTabla(paginas) {
    return (paginas || []).some(function (p) {
      var rs = renglones(p), racha = [];
      function cerrar() { var ok = racha.length >= 3; racha = []; return ok; }
      for (var i = 0; i < rs.length; i++) {
        var r = rs[i];
        if (r.inicios.length >= 3 && (!racha.length || alineados(racha[racha.length - 1], r))) racha.push(r);
        else { if (cerrar()) return true; if (r.inicios.length >= 3) racha.push(r); }
      }
      return cerrar();
    });
  }

  function alineados(a, b) {
    if (a.inicios.length !== b.inicios.length) return false;
    return a.inicios.every(function (x, i) { return Math.abs(x - b.inicios[i]) <= 4; });
  }

  /* ---------- párrafos ---------- */

  function sinGuion(texto, siguiente) {
    return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]-$/.test(texto) && /^[a-záéíóúüñ]/.test(siguiente);
  }

  function parrafosDePagina(pagina, numero) {
    var rs = renglones(pagina), grupos = [], actual = null;
    var anchoCuerpo = Math.max(rs.reduce(function (m, r) { return Math.max(m, r.x1 - r.x0); }, 0), 0.6 * (pagina.ancho || 0));
    rs.forEach(function (r) {
      var nuevo = !actual;
      if (actual) {
        var previo = actual.rs[actual.rs.length - 1];
        var salto = previo.y - r.y, cambioTamano = Math.abs(previo.alto - r.alto) > 0.15 * Math.max(previo.alto, 1);
        nuevo = salto > 1.5 * previo.alto || cambioTamano;
      }
      if (nuevo) { actual = { rs: [] }; grupos.push(actual); }
      actual.rs.push(r);
    });
    return grupos.map(function (g) {
      var texto = '';
      g.rs.forEach(function (r) {
        if (!texto) { texto = r.texto; return; }
        if (sinGuion(texto, r.texto)) texto = texto.slice(0, -1) + r.texto;
        else texto += ' ' + r.texto;
      });
      var centro = pagina.ancho / 2;
      var centrado = g.rs.every(function (r) { return Math.abs((r.x0 + r.x1) / 2 - centro) <= 10 && (r.x1 - r.x0) < 0.85 * anchoCuerpo; });
      return { texto: texto, centrado: centrado, tamano: g.rs[0].alto, pagina: numero };
    });
  }

  /* Para comparar los repetidos: sin números (de página) y sin mayúsculas. */
  function claveDeRepetido(texto) { return String(texto).toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim(); }

  function parrafos(paginas) {
    paginas = paginas || [];
    var porPagina = paginas.map(function (p, i) { return parrafosDePagina(p, i + 1); });
    /* Los que salen en todas las páginas (cabeceras, pies, números de página): una sola vez, marcados. */
    var cuenta = {};
    porPagina.forEach(function (lista) {
      var vistos = {};
      lista.forEach(function (p) { var k = claveDeRepetido(p.texto); if (!vistos[k]) { vistos[k] = true; cuenta[k] = (cuenta[k] || 0) + 1; } });
    });
    var yaDados = {}, salida = [];
    porPagina.forEach(function (lista) {
      lista.forEach(function (p) {
        var k = claveDeRepetido(p.texto);
        if (paginas.length > 1 && cuenta[k] === paginas.length) {
          if (yaDados[k]) return;
          yaDados[k] = true;
          p.repetido = true;
        }
        salida.push(p);
      });
    });
    /* El título: el primer párrafo centrado; si no hay, el primero de una sola línea con letra mayor que la del cuerpo. */
    var candidatos = salida.filter(function (p) { return !p.repetido; });
    var titulo = candidatos.filter(function (p) { return p.centrado; })[0];
    if (!titulo) {
      var cuerpo = tamanoDelCuerpo(candidatos);
      titulo = candidatos.filter(function (p) { return p.tamano > cuerpo * 1.1 && p.texto.length < 90; })[0];
    }
    salida.forEach(function (p) { p.titulo = (p === titulo); });
    return salida;
  }

  /* El tamaño de letra con más texto. */
  function tamanoDelCuerpo(lista) {
    var cuenta = {}, mejor = 0, mejorN = -1;
    lista.forEach(function (p) { var k = Math.round(p.tamano * 2) / 2; cuenta[k] = (cuenta[k] || 0) + p.texto.length; });
    Object.keys(cuenta).forEach(function (k) { if (cuenta[k] > mejorN) { mejorN = cuenta[k]; mejor = Number(k); } });
    return mejor;
  }

  /* ---------- leer el PDF (pdf.js y pdf-lib) ---------- */

  async function leer(buffer) {
    var pdfjsLib = await App.cargarPdfJs();
    var documento = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice ? buffer.slice(0) : buffer) }).promise;
    var paginas = [];
    for (var n = 1; n <= documento.numPages; n++) {
      var pagina = await documento.getPage(n);
      var vista = pagina.getViewport({ scale: 1 });
      var contenido = await pagina.getTextContent();
      paginas.push({
        ancho: vista.width, alto: vista.height,
        items: contenido.items.filter(function (i) { return typeof i.str === 'string'; }).map(function (i) {
          return { texto: i.str, x: i.transform[4], y: i.transform[5], ancho: i.width, alto: Math.hypot(i.transform[2], i.transform[3]) || i.height };
        })
      });
    }
    return paginas;
  }

  /* ¿Es un impreso con casillas para rellenar? */
  async function tieneCasillas(buffer) {
    try {
      var PDFLib = await PdfHerramientas.cargarPdfLib();
      var doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
      return doc.getForm().getFields().length > 0;
    } catch (e) { return false; }
  }

  return {
    renglones: renglones, parrafos: parrafos, sinTexto: sinTexto, tieneTabla: tieneTabla,
    leer: leer, tieneCasillas: tieneCasillas, MINIMO_TEXTO: MINIMO_TEXTO
  };
})();
window.PdfAParrafos = PdfAParrafos;
