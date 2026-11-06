/* ============================================================
   correo-cuadro-destinatarios.js — los destinatarios (js/correo-para.js, fila 555) y abrir el correo (fila 536: trozo de js/correo-cuadro.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/correo-cuadro.js.
   ============================================================ */
var CorreoCuadroNucleo = CorreoCuadroNucleo || {};
(function () {

  var I = CorreoCuadroNucleo;
  I.S = I.S || {};
  I.S.documentosAdjuntados = []; /* los que ha llevado el último correo enviado de verdad */
  I.S.plantillaElegida = '';
  I.S.textoProgramado = '';

  function $(id) { return document.getElementById(id); }
  function n() { return window.CorreoNucleo || {}; }

  /* ---------- Para, Copia y Copia oculta (fila 555: js/correo-para.js) ---------- */

  function paraDelCuadro() { return window.CorreoPara ? CorreoPara.texto('para') : ''; }
  function ccDelCuadro() { return window.CorreoPara ? CorreoPara.texto('copia') : ''; }
  function ccoDelCuadro() { return window.CorreoPara ? CorreoPara.texto('oculta') : ''; }

  /* ---------- copiar y abrir ---------- */

  function copiar(texto, boton) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    U.copiar(texto, boton);
  }

  function abrirGmail() {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=' + encodeURIComponent(paraDelCuadro()) +
      (ccDelCuadro() ? '&cc=' + encodeURIComponent(ccDelCuadro()) : '') +
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '') +
      '&su=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value);
    window.open(url, '_blank');
  }

  function abrirDelOrdenador() {
    var url = 'mailto:' + encodeURIComponent(paraDelCuadro()) +
      '?subject=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value) +
      (ccDelCuadro() ? '&cc=' + encodeURIComponent(ccDelCuadro()) : '') +
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '');
    window.location.href = url;
  }

  /* ---------- el cuerpo del cuadro, en dos columnas ----------

     18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 5: mismo
     patrón que `SenecaCuadro.cuerpoHtml` (fila 53) — ancho hasta
     1100px, y a partir de 900px, dos columnas: a la izquierda
     destinatarios, asunto y los documentos que se adjuntan; a la
     derecha el texto del correo. Todo el formulario va dentro de
     `#correo-formulario`, hermano de `#correo-resumen` (fila 115). */
  /* ---------- fila 348: «Va a:» de la plantilla ---------- */

  /* La plantilla con la que se abre el cuadro (la pedida por una receta, la del tipo o ninguna): se fija aquí, antes de pintar
     «Para», y `bloqueCuerpo` la encuentra ya decidida. */
  function plantillaInicial(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    var pedida = (n()._interno || {}).plantillaPedida;
    if (pedida && opciones.some(function (p) { return p.id === pedida; })) { I.S.plantillaElegida = pedida; n()._interno.plantillaPedida = ''; }
    var antes = (n()._interno || {}).restaurar;
    if (antes && antes.plantilla !== undefined) I.S.plantillaElegida = antes.plantilla;
    if (I.S.plantillaElegida === null) I.S.plantillaElegida = n().plantillaDeEntrada(a, opciones);
    if (I.S.plantillaElegida && !opciones.some(function (p) { return p.id === I.S.plantillaElegida; })) I.S.plantillaElegida = '';
    return opciones.filter(function (p) { return p.id === I.S.plantillaElegida; })[0] || null;
  }

  /* Al cambiar de plantilla en el desplegable: si la nueva propone destinatarios, se ponen esos (los de antes se quitan); «Sin plantilla» no deja a nadie. */
  function aplicarDestino(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    var p = opciones.filter(function (x) { return x.id === I.S.plantillaElegida; })[0];
    if (!window.CorreoPara) return;
    if (!I.S.plantillaElegida) { CorreoPara.vaciar(); CorreoPara.repintar(); return; }   /* «Sin plantilla»: el correo queda sin nadie puesto */
    if (!p) return;
    CorreoPara.vaciar();
    CorreoPara.aplicarPapeles({ para: p.para, copia: p.copia, oculta: p.oculta });
    CorreoPara.repintar();
  }

  I.$ = $;
  I.n = n;
  I.paraDelCuadro = paraDelCuadro;
  I.ccDelCuadro = ccDelCuadro;
  I.ccoDelCuadro = ccoDelCuadro;
  I.copiar = copiar;
  I.abrirGmail = abrirGmail;
  I.abrirDelOrdenador = abrirDelOrdenador;
  I.plantillaInicial = plantillaInicial;
  I.aplicarDestino = aplicarDestino;
})();
