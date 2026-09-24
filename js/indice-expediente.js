/* ============================================================
   indice-expediente.js — el índice del expediente (fila 137,
   25-sep-2026, docs/INDICE-DEL-EXPEDIENTE.md).

   Cuando un expediente va a Inspección o a un recurso, la ley pide un
   índice numerado de sus documentos. Aquí se hace solo: un PDF,
   `000 ÍNDICE DEL EXPEDIENTE.pdf` (el 000 para que salga el primero),
   dentro de la carpeta del asunto, con pdf-lib (js/pdf-herramientas.js):

   - Arriba: el centro, «Índice del expediente», la carpeta, el tipo, el
     tercero, y las fechas de apertura y (si está archivado) de archivo.
   - Tabla: Nº · Fecha · Registro · Documento · Páginas, en orden de
     fecha y, a igual fecha, de nombre. Fecha y registro, del nombre del
     fichero; páginas, de los PDF (los demás, «—»). Los originales «SIN
     SELLAR» entran, marcados. El propio índice, no.
   - Pie: quién y cuándo lo generó, y el número de página.

   Se crea al archivar (js/asuntos-archivar.js; si falla, ámbar: el
   asunto queda archivado igual) y con «Índice del expediente» en el menú
   de la ficha (lo rehace y lo abre en el visor). Si ya había uno, el
   anterior va a la papelera.

   El índice no es un documento del asunto: `es(nombre)` y `fuera(lista)`
   lo apartan de la cuenta de la ficha, de «Registrar», de asociar a
   hitos, del índice del ARCHIVO y de la lectura de sellos.
   ============================================================ */
var IndiceExpediente = (function () {

  var NOMBRE = '000 ÍNDICE DEL EXPEDIENTE.pdf';
  var RE_SIN_SELLAR = / SIN SELLAR(\s*\(\d+\))?\.[A-Za-z0-9]{1,8}$/i;
  var RE_REGISTRO = /^(\d{2})([ES])([MA])(\d{4,6})\b/;

  function es(nombre) { return String(nombre || '').normalize('NFC') === NOMBRE.normalize('NFC'); }

  /* Quita el índice de una lista de nombres o de { nombre }. */
  function fuera(lista) {
    return (lista || []).filter(function (x) { return !es(typeof x === 'string' ? x : x && x.nombre); });
  }

  /* ---------- los datos (sin PDF: se prueban sueltos) ---------- */

  function esDocumento(nombre) {
    var n = String(nombre || '');
    if (!n || es(n)) return false;
    if (n.charAt(0) === '.' || n.charAt(0) === '_' || n.indexOf('~$') === 0) return false;
    if (window.Carpetas && Carpetas.esCarpetaTemporalDeSincronizacion && Carpetas.esCarpetaTemporalDeSincronizacion(n)) return false;
    return true;
  }

  /* De un nombre «AAMMDD [REGISTRO] TIPO …»: fecha (dd-mm-aaaa, y
     AAAAMMDD para ordenar), registro y si es un original sin sellar. */
  function filaDe(nombre) {
    var sinExt = nombre.replace(/\.[A-Za-z0-9]{1,8}$/, '');
    var m = sinExt.match(/^(\d{2})(\d{2})(\d{2})\s+(.*)$/);
    var fecha = '', orden = '99999999', registro = '';
    if (m) {
      fecha = m[3] + '-' + m[2] + '-20' + m[1];
      orden = '20' + m[1] + m[2] + m[3];
      var r = m[4].match(RE_REGISTRO);
      if (r) registro = r[0];
    }
    return { nombre: nombre, fecha: fecha, orden: orden, registro: registro,
             sinSellar: RE_SIN_SELLAR.test(nombre), paginas: null };
  }

  function ordenar(filas) {
    return filas.slice().sort(function (a, b) {
      if (a.orden !== b.orden) return a.orden < b.orden ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }

  function legibleIso(iso) { return iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : ''; }
  function legibleAammdd(f) { return /^\d{6}$/.test(f || '') ? f.slice(4, 6) + '-' + f.slice(2, 4) + '-20' + f.slice(0, 2) : ''; }

  async function contarPaginas(f) {
    if (!/\.pdf$/i.test(f.nombre) || !window.PdfHerramientas) return null;
    try {
      var bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
      return await PdfHerramientas.contarPaginas(bytes);
    } catch (e) { return null; }
  }

  async function datosDe(a, opciones) {
    var op = opciones || {};
    var ficheros = (await Carpetas.ficheros(a.handle)).filter(function (f) { return esDocumento(f.nombre); });
    var filas = [];
    for (var i = 0; i < ficheros.length; i++) {
      var fila = filaDe(ficheros[i].nombre);
      fila.paginas = await contarPaginas(ficheros[i]);
      filas.push(fila);
    }
    var ficha = a.ficha || {};
    var leido = a.leido || (window.Nombres ? Nombres.leer(a.nombre, (App.E && App.E.tipos) || []) : {});
    var centro = '';
    try { centro = (await Plantillas.valoresDeAsunto({ nombre: a.nombre, ficha: ficha, leido: leido })).centro || ''; }
    catch (e) { centro = ''; }
    var archivado = op.archivadoEl || (ficha.estado === 'cerrado' ? ficha.cerradoEl : '') || '';
    return {
      centro: centro,
      carpeta: a.nombre,
      tipo: leido.tipo ? (window.Nombres ? Nombres.tipoParaVer(leido.tipo, App.E.tipos) : leido.tipo) : '',
      tercero: ficha.tercero || leido.resto || '',
      abierto: legibleAammdd(leido.fecha),
      archivado: legibleIso(archivado),
      filas: ordenar(filas),
      generado: legibleIso(U.hoyIso()),
      por: (window.App && App.E && App.E.usuario) || ''
    };
  }

  /* ---------- el PDF ---------- */

  /* Helvetica de pdf-lib solo sabe escribir WinAnsi: lo que no cabe
     (un emoji, por ejemplo) se cambia por «?» en vez de romper. */
  var EXTRA_WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function limpio(t) {
    return String(t || '').normalize('NFC').split('').map(function (c) {
      var n = c.charCodeAt(0);
      if (n === 9 || n === 10 || n === 13) return ' ';
      if ((n >= 32 && n <= 126) || (n >= 160 && n <= 255) || EXTRA_WINANSI.indexOf(c) !== -1) return c;
      return '?';
    }).join('');
  }

  function partir(texto, fuente, tam, ancho) {
    var palabras = limpio(texto).split(' ');
    var lineas = [], actual = '';
    palabras.forEach(function (p) {
      var prueba = actual ? actual + ' ' + p : p;
      if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) { actual = prueba; return; }
      if (actual) lineas.push(actual);
      actual = p;
      while (fuente.widthOfTextAtSize(actual, tam) > ancho && actual.length > 1) {
        var corte = actual.length - 1;
        while (corte > 1 && fuente.widthOfTextAtSize(actual.slice(0, corte), tam) > ancho) corte--;
        lineas.push(actual.slice(0, corte));
        actual = actual.slice(corte);
      }
    });
    if (actual) lineas.push(actual);
    return lineas.length ? lineas : [''];
  }

  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var gris = PDFLib.rgb(0.35, 0.35, 0.35), negro = PDFLib.rgb(0, 0, 0), linea = PDFLib.rgb(0.75, 0.75, 0.75);
    var ANCHO = 595.28, ALTO = 841.89, M = 50;
    var COLS = [{ t: 'Nº', x: M, w: 26 }, { t: 'Fecha', x: M + 28, w: 60 }, { t: 'Registro', x: M + 90, w: 62 },
                { t: 'Documento', x: M + 154, w: 300 }, { t: 'Páginas', x: M + 458, w: 37 }];
    var pagina, y;

    function texto(t, x, yy, tam, f, color) { pagina.drawText(limpio(t), { x: x, y: yy, size: tam, font: f || normal, color: color || negro }); }
    function cabeceraTabla() {
      COLS.forEach(function (c) { texto(c.t, c.x, y, 9, negrita); });
      y -= 5;
      pagina.drawLine({ start: { x: M, y: y }, end: { x: ANCHO - M, y: y }, thickness: 0.8, color: negro });
      y -= 13;
    }
    function nuevaPagina() { pagina = doc.addPage([ANCHO, ALTO]); y = ALTO - M; }

    nuevaPagina();
    if (d.centro) { texto(d.centro, M, y, 11, negrita, gris); y -= 22; }
    texto('Índice del expediente', M, y, 17, negrita); y -= 22;
    partir(d.carpeta, negrita, 10, ANCHO - 2 * M).forEach(function (l) { texto(l, M, y, 10, negrita); y -= 13; });
    y -= 3;
    var datos = [];
    if (d.tipo) datos.push('Tipo: ' + d.tipo);
    if (d.tercero) datos.push('Tercero: ' + d.tercero);
    if (d.abierto) datos.push('Abierto el ' + d.abierto);
    if (d.archivado) datos.push('Archivado el ' + d.archivado);
    partir(datos.join('   ·   '), normal, 9.5, ANCHO - 2 * M).forEach(function (l) { texto(l, M, y, 9.5, normal, gris); y -= 12; });
    y -= 14;
    cabeceraTabla();

    if (!d.filas.length) { texto('La carpeta no tiene documentos.', M, y, 10, normal, gris); y -= 14; }
    d.filas.forEach(function (f, i) {
      var nombre = f.nombre + (f.sinSellar ? '  (original sin sellar)' : '');
      var lineas = partir(nombre, normal, 9, COLS[3].w);
      var alto = lineas.length * 11 + 5;
      if (y - alto < M + 20) { nuevaPagina(); cabeceraTabla(); }
      texto(String(i + 1), COLS[0].x, y, 9);
      texto(f.fecha || '—', COLS[1].x, y, 9);
      texto(f.registro || '—', COLS[2].x, y, 9);
      lineas.forEach(function (l, k) { texto(l, COLS[3].x, y - k * 11, 9); });
      texto(f.paginas === null || f.paginas === undefined ? '—' : String(f.paginas), COLS[4].x, y, 9);
      y -= alto;
      pagina.drawLine({ start: { x: M, y: y + 9 }, end: { x: ANCHO - M, y: y + 9 }, thickness: 0.4, color: linea });
    });

    var paginas = doc.getPages();
    var pie = 'Generado por el Gestor de Asuntos el ' + d.generado + (d.por ? ', por ' + d.por : '') + '.';
    paginas.forEach(function (p, i) {
      pagina = p;
      texto(pie, M, 28, 8, normal, gris);
      var num = 'Página ' + (i + 1) + ' de ' + paginas.length;
      texto(num, ANCHO - M - normal.widthOfTextAtSize(num, 8), 28, 8, normal, gris);
    });
    doc.setTitle(limpio('Índice del expediente · ' + d.carpeta));
    return doc.save();
  }

  /* ---------- crearlo en la carpeta ---------- */

  /* `a` con `.handle` (la carpeta, abierta o archivada). Si ya había un
     índice, el anterior va a la papelera. Devuelve el manejador del nuevo. */
  async function carpetaDe(a) {
    if (a.handle) return a.handle;
    if (a.padre) { try { return await a.padre.getDirectoryHandle(a.nombre); } catch (e) { /* se busca abajo */ } }
    var f = a.ficha || {};
    var sitio = window.IndiceArchivo ? await IndiceArchivo.resolverHandle({
      nombre: a.nombre, categoria: a.categoria || f.categoria, tercero: a.tercero || f.tercero,
      ruta: a.ruta || '', sueltoEn: a.sueltoEn || '' }) : null;
    if (!sitio) throw new Error('No encuentro la carpeta del asunto.');
    return sitio.handle;
  }

  async function crear(a, opciones) {
    a = Object.assign({}, a, { handle: await carpetaDe(a) });
    var d = await datosDe(a, opciones);
    var bytes = await pdfDe(d);
    if (await Carpetas.existeFichero(a.handle, NOMBRE)) {
      var I = window.Papelera && Papelera._interno;
      if (I && I.mandarFichero) await I.mandarFichero(a.handle, NOMBRE, 'documento', { asunto: a.nombre });
    }
    await Carpetas.escribirBytes(a.handle, NOMBRE, bytes, 'application/pdf');
    return a.handle.getFileHandle(NOMBRE);
  }

  /* El botón del menú de la ficha: lo rehace y lo abre en el visor. */
  async function crearYAbrir(a) {
    var h;
    try {
      h = await crear(a);
    } catch (e) {
      U.fallo('No he podido hacer el índice del expediente', e);
      return;
    }
    U.aviso('Índice del expediente hecho: ' + NOMBRE + '.', 'bueno');
    if (window.Visor) { try { Visor.abrir(h, NOMBRE); } catch (e) { /* ya está en la carpeta */ } }
    if (window.FichaDocumentos && FichaDocumentos.pintar) { try { FichaDocumentos.pintar(a); } catch (e) { /* solo pintar */ } }
  }

  function opcionDelMenu(a) {
    return { texto: 'Índice del expediente', alPulsar: function () { crearYAbrir(a); } };
  }

  return {
    NOMBRE: NOMBRE, es: es, fuera: fuera, filaDe: filaDe, ordenar: ordenar,
    datosDe: datosDe, pdfDe: pdfDe, crear: crear, crearYAbrir: crearYAbrir, opcionDelMenu: opcionDelMenu
  };
})();
window.IndiceExpediente = IndiceExpediente;
