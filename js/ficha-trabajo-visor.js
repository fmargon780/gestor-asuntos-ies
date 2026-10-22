/* ============================================================
   ficha-trabajo-visor.js — el documento abierto, en la columna derecha de
   «Trabajo» (22-oct-2026, fila 425, docs/FICHA-VISTA-DE-TRABAJO.md).

   El visor (`#visor-lateral`, js/visor.js) y el Word en grande
   (`#word-visor`, js/word-visor.js) cuelgan de <body>: uno es una columna
   fija a la derecha de la pantalla y el otro una capa a pantalla completa.
   Con la pestaña «Trabajo» a la vista, este módulo los cambia de sitio y
   los mete en `#trabajo-der`, EN LUGAR de la lista de documentos de la
   carpeta; el hito sigue a la izquierda y «← Carpeta» (el botón que
   llevan los dos) cierra el documento y devuelve la lista. En cualquier
   otra pestaña, o fuera de la ficha, son lo de siempre.

   - `ubicar()`: pone cada panel abierto donde toca (lo llaman el visor,
     el Word y la ficha al cambiar de pestaña o de pantalla).
   - `alAbrir()`: si se abre un documento con la ficha a la vista pero en
     otra pestaña, primero se pasa a «Trabajo»; al cerrarlo, si nadie ha
     cambiado de pestaña mientras tanto, se vuelve a la de antes.
   - `soltar()`: los devuelve a <body> (antes de rehacer la ficha entera, y
     al imprimir, que esconde todo lo que no sea el Word).
   ============================================================ */
var FichaTrabajoVisor = (function () {

  var PANELES = ['visor-lateral', 'word-visor'];
  var vinoDe = null;   /* la pestaña en la que se estaba al abrir un documento, para volver a ella al cerrarlo */

  function $(id) { return document.getElementById(id); }

  function aQueLaVista() {
    var c = $('trabajo-columnas');
    return !!(c && c.offsetParent);
  }

  function abierto(p) { return !!p && !p.classList.contains('oculto'); }

  function ubicar() {
    var col = $('trabajo-der');
    var aqui = aQueLaVista();
    var hay = false;
    PANELES.forEach(function (id) {
      var p = $(id);
      if (!p) return;
      var dentro = !!col && col.contains(p);
      if (abierto(p) && aqui && col) {
        if (!dentro) col.appendChild(p);
        p.classList.add('en-trabajo');
        hay = true;
      } else if (dentro) {
        document.body.appendChild(p);
        p.classList.remove('en-trabajo');
      } else if (p.classList.contains('en-trabajo')) {
        p.classList.remove('en-trabajo');
      }
    });
    if (col) col.classList.toggle('con-documento', hay);
    document.body.classList.toggle('visor-en-trabajo', hay);
    if (window.FichaTarjetas && FichaTarjetas.ajustarAlto) FichaTarjetas.ajustarAlto();
    /* Cerrado el documento que obligó a pasar a «Trabajo», se vuelve a donde se estaba. */
    if (!hay && vinoDe && aqui && window.FichaTarjetas && FichaTarjetas.abierta() === 'trabajo') {
      var antes = vinoDe;
      vinoDe = null;
      FichaTarjetas.abrir(antes, true);
    }
  }

  function alAbrir() {
    if (window.App && App.fichaAbierta && App.fichaAbierta() && window.FichaTarjetas && FichaTarjetas.abierta() !== 'trabajo') {
      var estaba = FichaTarjetas.abierta();
      FichaTarjetas.abrir('trabajo', true);
      vinoDe = estaba;
    }
    ubicar();
  }

  /* Quien cambia de pestaña a mano deja de querer volver a la de antes. */
  function olvidar() { vinoDe = null; }

  function soltar() {
    PANELES.forEach(function (id) {
      var p = $(id);
      if (p && p.parentNode !== document.body) document.body.appendChild(p);
      if (p) p.classList.remove('en-trabajo');
    });
    var col = $('trabajo-der');
    if (col) col.classList.remove('con-documento');
    document.body.classList.remove('visor-en-trabajo');
  }

  /* Al salir de la ficha (otra pantalla), lo que estaba en la columna vuelve a <body>: el documento no se esconde con la
     ficha, sigue al lado, como siempre. */
  var pantalla = $('pantalla-asunto');
  if (pantalla) new MutationObserver(function () { ubicar(); }).observe(pantalla, { attributes: true, attributeFilter: ['class'] });

  /* Imprimir un Word esconde todo lo que no cuelga de <body> (css/word-visor.css). */
  window.addEventListener('beforeprint', soltar);
  window.addEventListener('afterprint', function () { ubicar(); });

  return { ubicar: ubicar, alAbrir: alAbrir, soltar: soltar, olvidar: olvidar };
})();
window.FichaTrabajoVisor = FichaTrabajoVisor;
