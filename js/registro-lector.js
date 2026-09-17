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

   Usa pdf.js (Mozilla), copiado en js/lib/ (versión 3.11.174), y
   solo se carga la primera vez que hace falta: no al arrancar la
   aplicación.
   ============================================================ */
var RegistroLector = (function () {

  var SELLO = /(\d{4})\s*\/\s*\d+\s*\/\s*([MA])\s*0*(\d+)\s*(ENTRADA|SALIDA)/;
  var FECHA_SELLO = /Fecha:\s*(\d{2}\/\d{2}\/\d{4})/;

  var cargando = null;

  /* pdf.js pesa más de un megabyte con el worker: se trae solo la
     primera vez que hace falta, no al arrancar la aplicación. */
  function cargarPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (cargando) return cargando;
    cargando = new Promise(function (resolver, rechazar) {
      var script = document.createElement('script');
      script.src = 'js/lib/pdf.min.js';
      script.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/lib/pdf.worker.min.js';
        resolver(window.pdfjsLib);
      };
      script.onerror = function () { rechazar(new Error('No se ha podido cargar pdf.js.')); };
      document.head.appendChild(script);
    });
    return cargando;
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

  /* Lee el sello de un fichero. Devuelve null si no es un PDF, si no
     se puede leer, o si no se encuentra el sello: en cualquiera de
     esos casos el cuadro de Registrar sale vacío, como siempre, sin
     avisar de nada raro. */
  async function leerSello(fichero) {
    var esPdf = (fichero && fichero.type === 'application/pdf') ||
                /\.pdf$/i.test((fichero && fichero.name) || '');
    if (!esPdf) return null;

    try {
      var texto = await textoDePrimeraPagina(fichero);
      var m = texto.match(SELLO);
      if (!m) return null;

      var numero = m[3];                    /* ya sin los ceros de delante */
      var numeroLargo = numero.length > 4;
      var fecha = texto.match(FECHA_SELLO);

      return {
        anio: m[1].slice(2),
        serie: m[2],
        tipo: m[4] === 'SALIDA' ? 'S' : 'E',
        numero: numeroLargo ? numero : numero.padStart(4, '0'),
        numeroLargo: numeroLargo,
        fecha: fecha ? fecha[1] : ''
      };
    } catch (e) {
      return null;
    }
  }

  /* Expuesta para js/verificacion.js (17-sep-2026, fila 19): el código
     de verificación del pie de un documento se busca con la misma
     máquina que ya lee el sello de Séneca, sin cargar pdf.js dos veces
     ni duplicar cómo se saca el texto de una página. */
  return { leerSello: leerSello, textoDePrimeraPagina: textoDePrimeraPagina };
})();
