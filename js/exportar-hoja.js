/* ============================================================
   exportar-hoja.js — la hoja de cálculo de «Exportar ▾ → Hoja de
   cálculo» (1-oct-2026, fila 241, docs/EXPORTAR-ASUNTOS.md, sección 4).

   Un `.xlsx` escrito aquí mismo con JSZip (js/lib/jszip.min.js, la que
   ya usa el visor de Word): sin internet y sin librería nueva. Un
   `.xlsx` es un zip de pequeños ficheros XML; aquí van los justos para
   que lo abran Excel, LibreOffice y Hojas de cálculo de Google:

     - Pestaña «Asuntos»: una fila por asunto, con las columnas
       elegidas. Las fechas son fechas y las cantidades son números (se
       pueden sumar y ordenar). Al final, una línea con «N asuntos» y,
       debajo de cada columna de cantidades, su suma.
     - Pestaña «Hitos»: siempre, una fila por cada hito de cada asunto.

   `libro(hojas)` es genérico (sin saber de asuntos) y se prueba suelto;
   `deAsuntos(tabla, filasDeHitos)` monta las dos pestañas.
   ============================================================ */
var ExportarHoja = (function () {

  var MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  var promesaJSZip = null;

  function cargarJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (promesaJSZip) return promesaJSZip;
    promesaJSZip = new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = 'js/lib/jszip.min.js';
      s.onload = function () { resolver(window.JSZip); };
      s.onerror = function () { promesaJSZip = null; rechazar(new Error('No se ha podido cargar JSZip.')); };
      document.head.appendChild(s);
    });
    return promesaJSZip;
  }

  /* ---------- trozos de XML ---------- */

  function xml(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 0 → A, 25 → Z, 26 → AA. */
  function letra(i) {
    var s = '';
    for (var n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  }

  /* 'AAAA-MM-DD' → los días que cuenta Excel desde el 30-dic-1899. */
  function serialDeFecha(iso) {
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) + 25569;
  }

  /* Los estilos (posición en cellXfs):
       0 normal · 1 negrita · 2 fecha · 3 número con dos decimales ·
       4 negrita con dos decimales · 5 negrita (totales, entero). */
  var ESTILOS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="6">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="4" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '</cellXfs></styleSheet>';

  /* Una celda: { k: 'texto'|'fecha'|'numero', v, b: negrita, dec: dos decimales }. */
  function celdaXml(celda, fila, col) {
    var ref = letra(col) + fila;
    if (!celda || celda.v === '' || celda.v === null || celda.v === undefined) {
      return celda && celda.b ? '<c r="' + ref + '" s="1"/>' : '';
    }
    if (celda.k === 'fecha') {
      var serial = serialDeFecha(celda.v);
      if (serial !== null) return '<c r="' + ref + '" s="2"><v>' + serial + '</v></c>';
    }
    if (celda.k === 'numero' && typeof celda.v === 'number' && isFinite(celda.v)) {
      var estilo = celda.dec ? (celda.b ? 4 : 3) : (celda.b ? 5 : 0);
      return '<c r="' + ref + '" s="' + estilo + '"><v>' + celda.v + '</v></c>';
    }
    return '<c r="' + ref + '" t="inlineStr"' + (celda.b ? ' s="1"' : '') + '><is><t xml:space="preserve">' + xml(celda.v) + '</t></is></c>';
  }

  function hojaXml(hoja) {
    var filas = hoja.filas || [];
    var anchos = hoja.anchos || [];
    var cols = anchos.length
      ? '<cols>' + anchos.map(function (w, i) {
          return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
        }).join('') + '</cols>'
      : '';
    var datos = filas.map(function (fila, i) {
      return '<row r="' + (i + 1) + '">' + fila.map(function (c, j) { return celdaXml(c, i + 1, j); }).join('') + '</row>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      cols + '<sheetData>' + datos + '</sheetData></worksheet>';
  }

  function nombreDeHoja(n, i) {
    var limpio = String(n || 'Hoja ' + (i + 1)).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31);
    return limpio || 'Hoja ' + (i + 1);
  }

  /* El libro entero, como bytes. `hojas`: [{ nombre, filas: [[celda…]], anchos?: [número…] }]. */
  async function libro(hojas) {
    var JSZip = await cargarJSZip();
    var zip = new JSZip();
    var n = hojas.length;
    /* Sin entradas de carpeta (`_rels/`, `xl/`…): un .xlsx no las lleva. */
    var poner = function (nombre, texto) { zip.file(nombre, texto, { createFolders: false }); };
    var tipos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      hojas.map(function (h, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join('') + '</Types>';
    poner('[Content_Types].xml', tipos);
    poner('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    poner('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      hojas.map(function (h, i) {
        return '<sheet name="' + xml(nombreDeHoja(h.nombre, i)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      }).join('') + '</sheets></workbook>');
    poner('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      hojas.map(function (h, i) {
        return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join('') +
      '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    poner('xl/styles.xml', ESTILOS);
    hojas.forEach(function (h, i) { poner('xl/worksheets/sheet' + (i + 1) + '.xml', hojaXml(h)); });
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: MIME });
  }

  /* ---------- las dos pestañas de la exportación de asuntos ---------- */

  function ancho(texto) { return Math.max(10, Math.min(60, String(texto).length + 2)); }

  /* `tabla`: lo que devuelve ExportarAsuntos.tabla. `hitos`: ExportarAsuntos.filasDeHitos. */
  function hojasDeAsuntos(tabla, hitos) {
    var cols = tabla.columnas;
    /* Una columna de cantidades con decimales (o de dinero) se enseña con dos. */
    var decimales = cols.map(function (c, i) {
      if (c.clase !== 'numero') return false;
      if (c.sufijo) return true;
      return tabla.filas.some(function (f) { return f[i].k === 'numero' && !Number.isInteger(f[i].v); });
    });

    var anchos = cols.map(function (c) { return ancho(c.titulo); });
    var filas = [cols.map(function (c) { return { k: 'texto', v: c.titulo, b: true }; })];
    tabla.filas.forEach(function (fila) {
      filas.push(fila.map(function (celda, i) {
        if (celda.k === 'numero') return { k: 'numero', v: celda.v, dec: decimales[i] };
        var largo = String(celda.v || '').length;
        if (largo + 2 > anchos[i]) anchos[i] = Math.min(60, largo + 2);
        return celda;
      }));
    });

    var total = cols.map(function () { return null; });
    var primeraDeTexto = 0;
    for (var p = 0; p < cols.length; p++) { if (cols[p].clase !== 'numero') { primeraDeTexto = p; break; } }
    cols.forEach(function (c, i) {
      if (c.clase === 'numero') total[i] = { k: 'numero', v: tabla.sumas[i] || 0, dec: decimales[i], b: true };
    });
    if (cols.length) {
      total[primeraDeTexto] = { k: 'texto', v: ExportarAsuntos.textoDeNumeroDeAsuntos(tabla.total), b: true };
      anchos[primeraDeTexto] = Math.max(anchos[primeraDeTexto], 14);
      filas.push(total.map(function (c) { return c || { k: 'texto', v: '' }; }));
    }

    var titulosHitos = ['Número de asunto', 'Tercero', 'Tipo', 'Nº del hito', 'Título del hito', 'Estado',
      'Responsable', 'Plazo', 'Terminado el'];
    var filasHitos = [titulosHitos.map(function (t) { return { k: 'texto', v: t, b: true }; })];
    hitos.forEach(function (h) {
      filasHitos.push([
        { k: 'texto', v: h.numero }, { k: 'texto', v: h.tercero }, { k: 'texto', v: h.tipo },
        { k: 'numero', v: h.n }, { k: 'texto', v: h.titulo }, { k: 'texto', v: h.estado },
        { k: 'texto', v: h.responsable },
        h.plazo ? { k: 'fecha', v: h.plazo } : { k: 'texto', v: '' },
        h.terminado ? { k: 'fecha', v: h.terminado } : { k: 'texto', v: '' }
      ]);
    });

    return [
      { nombre: 'Asuntos', filas: filas, anchos: anchos },
      { nombre: 'Hitos', filas: filasHitos, anchos: [16, 28, 22, 10, 44, 12, 22, 12, 14] }
    ];
  }

  async function deAsuntos(tabla, hitos) {
    var bytes = await libro(hojasDeAsuntos(tabla, hitos));
    return new Blob([bytes], { type: MIME });
  }

  /* El nombre del fichero: AAMMDD Asuntos.xlsx, o con el TIPO si hay uno solo filtrado. */
  function nombreDeFichero(tipo, hoy) {
    var d = hoy || new Date();
    var aammdd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var t = String(tipo || '').replace(/[\\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
    return aammdd + ' Asuntos' + (t ? ' ' + t : '') + '.xlsx';
  }

  /* Se descarga directamente. */
  function descargar(blob, nombre) {
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  return {
    MIME: MIME, libro: libro, hojasDeAsuntos: hojasDeAsuntos, deAsuntos: deAsuntos,
    nombreDeFichero: nombreDeFichero, descargar: descargar,
    _letra: letra, _serialDeFecha: serialDeFecha
  };
})();
window.ExportarHoja = ExportarHoja;
