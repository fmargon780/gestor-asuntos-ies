/* ============================================================
   registro-lector.js — leer el número de registro del sello de
   Séneca, dentro del propio PDF.

   Comprobado el 11-sep-2026 con un PDF real de Séneca: el sello va
   como texto dentro del PDF, en todas las páginas, aunque el
   documento sea un escaneado (imagen). El texto de la primera
   página trae, tal cual:

       29700692 - Fuente Lucena
       2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02

   Es decir: AÑO / CÓDIGO DEL CENTRO / SERIE + número con ceros por
   delante, pegado a ENTRADA o SALIDA, pegado a la fecha y hora del
   sello. Ese ejemplo es el registro 26EM0368.

   Usa pdf.js (Mozilla), copiado en js/lib/ (versión 4.2.67, fila 72,
   docs/DETALLES-DE-MANTENIMIENTO.md, punto 5: la 3.11.174 de antes
   tenía un fallo de seguridad real, CVE-2024-4367, arreglado en la
   4.2.67), y solo se carga la primera vez que hace falta: no al
   arrancar la aplicación.

   Desde la 4.x, pdf.js solo se distribuye como módulo (.mjs): ya no
   hay un `pdf.min.js` de toda la vida que ponga `window.pdfjsLib` con
   una simple etiqueta `<script>`. Por eso, en `http(s)`,
   `App.cargarPdfJs()` (js/cargar-fichero.js) usa `import()`, que sí
   funciona desde un script normal; en `file://` (la copia sin
   internet, fila 89) usa en su lugar dos `<script>` clásicos con las
   versiones IIFE.

   El sello unas veces se detectaba y otras no, con el mismo
   documento (queja de Francisco, fila 20 de docs/COLA.md,
   17-sep-2026): solo se leía la página 1, y pdf.js puede partir el
   mismo texto en trozos distintos según cómo se abra el PDF. Ahora se
   leen hasta 10 páginas, parando en cuanto se encuentra el sello, y
   el texto se busca dos veces: una vez normalizado (todo espacio
   seguido se deja en uno solo) y, si así no aparece, otra vez sin
   ningún espacio, porque el sello a veces viene pegado
   (".../M000000000368ENTRADAFecha: ...").
   ============================================================ */
var RegistroLector = (function () {

  var SELLO = /(\d{4})\s*\/\s*\d+\s*\/\s*([MA])\s*0*(\d+)\s*(ENTRADA|SALIDA)/;
  var FECHA_SELLO = /Fecha:\s*(\d{2}\/\d{2}\/\d{4})/;
  var TOPE_PAGINAS = 10;

  /* pdf.js pesa más de un megabyte con el worker: se trae solo la
     primera vez que hace falta, no al arrancar la aplicación.
     Carga compartida con js/preparar-documento.js y
     js/pdf-separar-unir.js (`App.cargarPdfJs()`, en
     js/cargar-fichero.js, fila 89 de docs/COLA.md): en `file://` (la
     copia sin internet) no se puede hacer `import()`. */
  function cargarPdfJs() {
    return App.cargarPdfJs();
  }

  /* El texto de la primera página, tal cual lo da pdf.js: los trozos
     sueltos que ha reconocido, uno detrás de otro. */
  async function textoDePrimeraPagina(fichero) {
    var pdfjsLib = await cargarPdfJs();
    var buffer = await fichero.arrayBuffer();
    var documento = await pdfjsLib.getDocument({ data: buffer }).promise;
    var pagina = await documento.getPage(1);
    var contenido = await pagina.getTextContent();
    return contenido.items.map(function (i) { return i.str; }).join(' ');
  }

  /* Todos los espacios, tabuladores y saltos de línea, en uno solo. */
  function normalizarEspacios(t) {
    return String(t || '').replace(/\s+/g, ' ').trim();
  }

  /* Busca el sello en un texto ya extraído del PDF. Sin efectos ni
     dependencias de pdf.js ni del navegador: se puede probar con
     cualquier cadena (pruebas/registro-sin-duplicar.mjs). Se prueba
     primero con el texto normalizado, y si no aparece, otra vez sin
     ningún espacio. */
  function buscarEnTexto(texto) {
    var candidatos = [normalizarEspacios(texto)];
    candidatos.push(candidatos[0].replace(/\s+/g, ''));

    for (var i = 0; i < candidatos.length; i++) {
      var t = candidatos[i];
      var m = t.match(SELLO);
      if (!m) continue;

      var numero = m[3];                  /* ya sin los ceros de delante */
      var numeroLargo = numero.length > 4;
      var fecha = t.match(FECHA_SELLO);

      return {
        anio: m[1].slice(2),
        serie: m[2],
        tipo: m[4] === 'SALIDA' ? 'S' : 'E',
        numero: numeroLargo ? numero : numero.padStart(4, '0'),
        numeroLargo: numeroLargo,
        fecha: fecha ? fecha[1] : ''
      };
    }
    return null;
  }

  /* El texto de hasta `tope` páginas, parando en cuanto el sello
     aparece: no hace falta leer las 10 si ya está en la primera. */
  async function textoHastaElSello(fichero, tope) {
    var pdfjsLib = await cargarPdfJs();
    var buffer = await fichero.arrayBuffer();
    var documento = await pdfjsLib.getDocument({ data: buffer }).promise;
    var limite = Math.min(documento.numPages, tope || TOPE_PAGINAS);
    var texto = '';
    for (var n = 1; n <= limite; n++) {
      var pagina = await documento.getPage(n);
      var contenido = await pagina.getTextContent();
      texto += contenido.items.map(function (i) { return i.str; }).join(' ') + ' ';
      if (buscarEnTexto(texto)) break;
    }
    return texto;
  }

  /* Lee el sello de un fichero. Devuelve null si no es un PDF, si no
     se puede leer, o si no se encuentra el sello: en cualquiera de
     esos casos el cuadro de Registrar sale vacío, como siempre, sin
     avisar de nada raro. */
  async function leerSello(fichero) {
    var esPdf = (fichero && fichero.type === 'application/pdf') ||
                /\.pdf$/i.test((fichero && fichero.name) || '');
    if (!esPdf) return null;

    try {
      var texto = await textoHastaElSello(fichero, TOPE_PAGINAS);
      return buscarEnTexto(texto);
    } catch (e) {
      return null;
    }
  }

  /* El texto de hasta `tope` páginas (5 por defecto), sin buscar nada
     dentro: la usa js/lector-documentos.js (17-sep-2026, fila 41,
     docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md) para proponer tipo, fecha,
     registro y tercero de un documento suelto en "Por clasificar". Si
     el fichero no es un PDF, o pdf.js falla, devuelve cadena vacía y
     no avisa de nada raro: es exactamente lo que hace `leerSello` con
     el sello, aquí sin buscar el sello ni pararse antes de tiempo. */
  async function textoDe(fichero, topePaginas) {
    var esPdf = (fichero && fichero.type === 'application/pdf') ||
                /\.pdf$/i.test((fichero && fichero.name) || '');
    if (!esPdf) return '';
    try {
      /* Un fichero con extensión .pdf pero que no lo sea de verdad (un
         adjunto renombrado a mano, o el de mentira de las pruebas) no
         se le pasa ni a pdf.js: el PDF de verdad siempre empieza por
         "%PDF-". Así se evita cargar la librería, y sus avisos por
         consola, para nada. */
      var cabecera = await fichero.slice(0, 5).text();
      if (cabecera !== '%PDF-') return '';
      var pdfjsLib = await cargarPdfJs();
      var buffer = await fichero.arrayBuffer();
      var documento = await pdfjsLib.getDocument({ data: buffer }).promise;
      var limite = Math.min(documento.numPages, topePaginas || 5);
      var texto = '';
      for (var n = 1; n <= limite; n++) {
        var pagina = await documento.getPage(n);
        var contenido = await pagina.getTextContent();
        texto += contenido.items.map(function (i) { return i.str; }).join(' ') + ' ';
      }
      return texto;
    } catch (e) {
      return '';
    }
  }

  /* Expuesta para js/verificacion.js (17-sep-2026, fila 19): el código
     de verificación del pie de un documento se busca con la misma
     máquina que ya lee el sello de Séneca, sin cargar pdf.js dos veces
     ni duplicar cómo se saca el texto de una página. */
  return {
    leerSello: leerSello, textoDePrimeraPagina: textoDePrimeraPagina,
    buscarEnTexto: buscarEnTexto, textoDe: textoDe
  };
})();
