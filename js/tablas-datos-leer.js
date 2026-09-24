/* ============================================================
   tablas-datos-leer.js — leer las tablas de datos (24-sep-2026, fila
   110, docs/TABLAS-DE-DATOS.md): el PDF de «Relación de funciones
   tutoriales» de Séneca, y cualquier CSV o Excel de la subcarpeta
   `Tablas` de la carpeta de datos.

   Todo lo de aquí es puro o casi (recibe bytes o trozos de texto y
   devuelve filas): la caché, los huecos de las plantillas y lo que se
   pinta viven en js/tablas-datos.js. Sin librerías nuevas: el PDF se
   lee con pdf.js (`App.cargarPdfJs()`), el Excel con el mismo lector
   de ZIP de js/docx.js (`Docx.interno`), el CSV con `Datos.aTabla`.
   ============================================================ */
var TablasDatosLeer = (function () {

  var GRUPO_ATENCION = 'Pedagogía Terapéutica, Audición y Lenguaje o Diversificación';
  var RE_DNI = /^[XYZ]?\d{6,8}[A-Z]?$/i;
  var RE_PERIODO = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/;
  var RE_IGNORAR = /^(pág\.?|pag\.?|ref\.? ?doc|cód\.? ?centro|cod\.? ?centro|fecha generaci)/i;

  function clave(documento) { return String(documento || '').replace(/\D/g, ''); }

  /* "Martínez, Ana (Sustituto/a)" -> "Martínez, Ana"; "Manhaes Panini ., Andre" -> "Manhaes Panini, Andre". */
  function limpiarNombre(n) {
    return String(n || '').replace(/\s*\(\s*sustitut[oa]\/?[ao]?\s*\)\s*/gi, ' ')
      .replace(/\s+\.(?=\s*,)/g, '').replace(/\s+\.\s+/g, ' ').replace(/\s+,/g, ',')
      .replace(/\s+/g, ' ').trim();
  }

  function isoDe(ddmmaaaa) {
    var p = String(ddmmaaaa || '').split('/');
    return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : '';
  }

  /* Los trozos de texto de pdf.js ({ str, x, y, pagina }) agrupados en
     líneas (misma página y casi la misma altura), de arriba abajo y cada
     una de izquierda a derecha. */
  function lineasDe(trozos) {
    var ordenados = trozos.filter(function (t) { return String(t.str || '').trim(); })
      .sort(function (a, b) { return a.pagina - b.pagina || b.y - a.y || a.x - b.x; });
    var lineas = [];
    ordenados.forEach(function (t) {
      var ultima = lineas[lineas.length - 1];
      if (ultima && ultima.pagina === t.pagina && Math.abs(ultima.y - t.y) <= 3) ultima.trozos.push(t);
      else lineas.push({ pagina: t.pagina, y: t.y, trozos: [t] });
    });
    lineas.forEach(function (l) {
      l.trozos.sort(function (a, b) { return a.x - b.x; });
      l.texto = l.trozos.map(function (t) { return t.str.trim(); }).join(' ');
    });
    return lineas;
  }

  /* De una línea de cabecera, dónde empieza cada columna. */
  function columnasDe(linea) {
    var cols = [];
    linea.trozos.forEach(function (t) {
      var n = U.normalizar(t.str);
      if (/^unidad/.test(n)) cols.push({ nombre: 'unidad', x: t.x });
      else if (/^emplead/.test(n)) cols.push({ nombre: 'nombre', x: t.x });
      else if (/^d\.?\s*n\.?\s*i/.test(n)) cols.push({ nombre: 'dni', x: t.x });
      else if (/^periodo/.test(n)) cols.push({ nombre: 'periodo', x: t.x });
    });
    return cols.sort(function (a, b) { return a.x - b.x; });
  }

  function columnaDe(cols, x) {
    var elegida = null;
    for (var i = 0; i < cols.length; i++) if (x >= cols[i].x - 4) elegida = cols[i];
    return elegida ? elegida.nombre : (cols[0] && cols[0].nombre);
  }

  /* Pura: los trozos de texto del PDF de funciones tutoriales -> filas
     { curso, grupo, nombre, dni, desde, hasta, clave }. `nombreFichero`
     sirve para el curso si el texto no lo dice. */
  function tutoriasDeTrozos(trozos, nombreFichero) {
    var lineas = lineasDe(trozos);
    var todo = lineas.map(function (l) { return l.texto; }).join(' ');
    var m = todo.match(/curso escolar\s+(\d{4})\s*\/\s*(\d{4})/i);
    var curso = m ? m[1] + '/' + m[2] : cursoDeNombre(nombreFichero);

    var filas = [];
    var bloque = 0, cols = null, ultima = null;
    lineas.forEach(function (l) {
      var n = U.normalizar(l.texto);
      if (/procedentes de tutorias de unidades/.test(n)) { bloque = 1; cols = null; ultima = null; return; }
      if (/pedagogia terapeutica/.test(n) && /diversificacion/.test(n)) { bloque = 2; cols = null; ultima = null; return; }
      if (!bloque) return;
      if (/emplead/.test(n) && /periodo/.test(n)) { cols = columnasDe(l); ultima = null; return; }
      if (!cols || RE_IGNORAR.test(l.texto.trim())) return;

      var celdas = { unidad: '', nombre: '', dni: '', periodo: '' };
      l.trozos.forEach(function (t) {
        var c = columnaDe(cols, t.x);
        celdas[c] = (celdas[c] ? celdas[c] + ' ' : '') + t.str.trim();
      });
      var p = (celdas.periodo || l.texto).match(RE_PERIODO);
      var dni = String(celdas.dni || '').replace(/\s+/g, '');
      if (p && RE_DNI.test(dni)) {
        ultima = { curso: curso, grupo: bloque === 1 ? celdas.unidad.trim() : GRUPO_ATENCION,
                   nombre: celdas.nombre, dni: dni.toUpperCase(), desde: isoDe(p[1]), hasta: isoDe(p[2]) };
        filas.push(ultima);
      } else if (ultima && celdas.nombre && !celdas.dni && !p) {
        /* La segunda línea de un nombre partido: se pega a la de arriba. */
        ultima.nombre += ' ' + celdas.nombre;
        if (celdas.unidad && bloque === 1) ultima.grupo = (ultima.grupo + ' ' + celdas.unidad).trim();
      }
    });

    var vistos = {};
    return filas.map(function (f) {
      f.nombre = limpiarNombre(f.nombre);
      f.clave = clave(f.dni);
      return f;
    }).filter(function (f) {
      var k = [f.curso, f.grupo, f.dni, f.desde, f.hasta].join('|');
      if (vistos[k]) return false;
      vistos[k] = true;
      return true;
    });
  }

  function cursoDeNombre(nombre) {
    var m = String(nombre || '').match(/(20\d{2})\s*[-–_\/]\s*(20\d{2})/);
    if (m) return m[1] + '/' + m[2];
    return window.Datos && Datos.cursoDelFichero ? Datos.cursoDelFichero(nombre) : '';
  }

  /* Los trozos de texto de todas las páginas de un PDF, con pdf.js. */
  async function trozosDePdf(bytes) {
    var pdfjs = await App.cargarPdfJs();
    /* Una copia: pdf.js se queda con el buffer que se le da (lo vacía). */
    var doc = await pdfjs.getDocument({ data: new Uint8Array(bytes).slice() }).promise;
    var trozos = [];
    for (var p = 1; p <= doc.numPages; p++) {
      var pagina = await doc.getPage(p);
      var contenido = await pagina.getTextContent();
      contenido.items.forEach(function (it) {
        trozos.push({ str: it.str, x: it.transform[4], y: it.transform[5], pagina: p });
      });
    }
    return trozos;
  }

  async function tutoriasDePdf(bytes, nombreFichero) {
    return tutoriasDeTrozos(await trozosDePdf(bytes), nombreFichero);
  }

  /* ---------- CSV y Excel de la subcarpeta Tablas ---------- */

  var RE_COL_DNI = /^(dni|d\.?n\.?i\.?|dni\/pasaporte|documento|nif)$/;

  function columnaDni(cabecera) {
    for (var i = 0; i < cabecera.length; i++) {
      if (RE_COL_DNI.test(U.normalizar(cabecera[i]).replace(/\s+/g, ''))) return i;
    }
    return -1;
  }

  /* Pura: una tabla (lista de filas, la primera la cabecera) -> { cabecera, filas: [{ celdas, dni, clave }] }. */
  function deMatriz(matriz) {
    var cabecera = (matriz[0] || []).map(function (x) { return String(x || '').trim(); });
    var iDni = columnaDni(cabecera);
    var filas = matriz.slice(1).filter(function (f) { return f.some(function (c) { return String(c || '').trim(); }); })
      .map(function (f) {
        var celdas = {};
        cabecera.forEach(function (c, i) { celdas[c] = String(f[i] === undefined ? '' : f[i]).trim(); });
        var dni = iDni === -1 ? '' : String(f[iDni] || '').trim();
        return { celdas: celdas, dni: dni, clave: clave(dni) };
      });
    return { cabecera: cabecera, filas: filas, columnaDni: iDni === -1 ? '' : cabecera[iDni] };
  }

  function deCsv(texto) { return deMatriz(Datos.aTabla(texto).filas); }

  function columnaDeRef(ref) {
    var letras = String(ref || '').replace(/\d+/g, '');
    var n = 0;
    for (var i = 0; i < letras.length; i++) n = n * 26 + (letras.charCodeAt(i) - 64);
    return n - 1;
  }

  function desescapar(t) {
    return String(t || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  }

  /* El .xlsx es un ZIP: la primera hoja y sus textos compartidos. */
  async function deXlsx(bytes) {
    var I = Docx.interno;
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    var entradas = I.leerDirectorioCentral(b);
    async function texto(nombre) {
      var e = entradas.filter(function (x) { return x.nombre === nombre; })[0];
      return e ? new TextDecoder('utf-8').decode(await I.datosDeEntrada(b, e)) : '';
    }
    var compartidos = [];
    (await texto('xl/sharedStrings.xml')).replace(/<si>([\s\S]*?)<\/si>/g, function (todo, si) {
      var partes = [];
      si.replace(/<t[^>]*>([\s\S]*?)<\/t>/g, function (t2, dentro) { partes.push(desescapar(dentro)); });
      compartidos.push(partes.join(''));
    });
    var hoja = await texto('xl/worksheets/sheet1.xml');
    if (!hoja) {
      var primera = entradas.filter(function (x) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(x.nombre); })[0];
      hoja = primera ? await texto(primera.nombre) : '';
    }
    var matriz = [];
    hoja.replace(/<row[^>]*>([\s\S]*?)<\/row>/g, function (todo, fila) {
      var celdas = [];
      fila.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, function (t, atributos, dentro) {
        var ref = (atributos.match(/\br="([A-Z]+\d+)"/) || [])[1];
        var tipo = (atributos.match(/\bt="([^"]+)"/) || [])[1] || '';
        var valor = '';
        if (tipo === 'inlineStr') {
          var partes = [];
          String(dentro || '').replace(/<t[^>]*>([\s\S]*?)<\/t>/g, function (x, d) { partes.push(desescapar(d)); });
          valor = partes.join('');
        } else {
          var v = (String(dentro || '').match(/<v>([\s\S]*?)<\/v>/) || [])[1] || '';
          valor = tipo === 's' ? (compartidos[parseInt(v, 10)] || '') : desescapar(v);
        }
        var i = ref ? columnaDeRef(ref) : celdas.length;
        celdas[i] = valor;
      });
      for (var k = 0; k < celdas.length; k++) if (celdas[k] === undefined) celdas[k] = '';
      matriz.push(celdas);
    });
    return deMatriz(matriz);
  }

  return {
    GRUPO_ATENCION: GRUPO_ATENCION, clave: clave, limpiarNombre: limpiarNombre,
    lineasDe: lineasDe, tutoriasDeTrozos: tutoriasDeTrozos, tutoriasDePdf: tutoriasDePdf,
    deMatriz: deMatriz, deCsv: deCsv, deXlsx: deXlsx, columnaDni: columnaDni
  };
})();
window.TablasDatosLeer = TablasDatosLeer;
