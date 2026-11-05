/* ============================================================
   correo-cuadro-destinatarios.js — los destinatarios, la copia oculta y abrir el correo (fila 536: trozo de js/correo-cuadro.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/correo-cuadro.js.
   ============================================================ */
var CorreoCuadroNucleo = CorreoCuadroNucleo || {};
(function () {

  var I = CorreoCuadroNucleo;
  I.S = I.S || {};
  I.S.elegidos = {};             /* qué correos van marcados */
  I.S.cco = {};                  /* direcciones en copia oculta, de los grupos */
  I.S.ccoSinCorreo = [];         /* nombres de miembros de un grupo sin ningún correo */
  I.S.documentosAdjuntados = []; /* los que ha llevado el último correo enviado de verdad */
  I.S.plantillaElegida = '';
  I.S.textoProgramado = '';

  function $(id) { return document.getElementById(id); }
  function n() { return window.CorreoNucleo || {}; }

  /* ---------- de dónde salen los correos ---------- */

  /* Todas las direcciones de la ficha de esa persona: la regla común de
     js/destinatarios.js (fila 132). */
  function correosDe(persona) { return Destinatarios.correosDe(persona); }

  function paraDelCuadro() {
    var lista = [];
    Array.prototype.forEach.call(document.querySelectorAll('.correo-marca'), function (c) {
      if (c.checked) lista.push(c.value);
    });
    var otro = $('correo-otro') ? $('correo-otro').value.trim() : '';
    if (otro) lista.push(otro);
    return lista.join(', ');
  }

  function ccoDelCuadro() {
    return Object.keys(I.S.cco).join(', ');
  }

  /* ---------- los grupos, para la copia oculta ----------

     17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md. Decisión de
     Francisco: los destinatarios que vienen de un grupo van SIEMPRE en
     copia oculta, nunca en Para, para que una familia no vea el correo
     de las demás. */

  /* De cada miembro, TODOS sus correos: la regla común (fila 132). */
  function combinarCorreosDeGrupo(miembrosConPersona) { return Destinatarios.delGrupo(miembrosConPersona); }

  function contenidoCco() {
    var direcciones = Object.keys(I.S.cco);
    /* Fila 348: junto al nombre del campo, «+ Tutor/a de …» (si el alumnado tiene tutor), aunque todavía no haya ninguna. */
    var cabecera = window.CorreoTutorBotones
      ? CorreoTutorBotones.cabeceraHtml('cco', direcciones.length ? ' <span class="suave">(' + direcciones.length + ')</span>' : '') : '';
    if (!direcciones.length && !I.S.ccoSinCorreo.length) return cabecera;
    return (direcciones.length
      ? (cabecera || '<label class="etiqueta">Copia oculta <span class="suave">(' + direcciones.length + ')</span></label>') +
        '<div class="marcados-lista">' + direcciones.map(function (d) {
          return '<span class="marcado-chip">' + U.escapar(d) +
            '<button type="button" class="cco-quitar" data-dir="' + U.escapar(d) + '" ' +
            'data-ayuda-clave="quitar-de-copia-oculta">×</button></span>';
        }).join('') + '</div>'
      : '') +
      (I.S.ccoSinCorreo.length
        ? ((n()._interno || {}).copiaOcultaDocentes   /* fila 352: el aviso al claustro, en ámbar */
          ? '<p class="aviso aviso-ambar" id="cco-sin-correo-docentes">' + I.S.ccoSinCorreo.length +
            (I.S.ccoSinCorreo.length === 1 ? ' docente del centro no tiene correo: ' : ' docentes del centro no tienen correo: ') +
            U.escapar(I.S.ccoSinCorreo.join(', ')) + '</p>'
          : '<p class="nota aviso-en-linea">' + I.S.ccoSinCorreo.length +
            (I.S.ccoSinCorreo.length === 1 ? ' no tiene correo: ' : ' no tienen correo: ') +
            U.escapar(I.S.ccoSinCorreo.join(', ')) + '</p>')
        : '');
  }

  function engancharCco() {
    Array.prototype.forEach.call(document.querySelectorAll('.cco-quitar'), function (b) {
      b.onclick = function () { delete I.S.cco[b.dataset.dir]; refrescarCco(); };
    });
  }

  function refrescarCco() {
    var caja = $('correo-cco-caja');
    if (!caja) return;
    caja.innerHTML = contenidoCco();
    engancharCco();
    if (window.CorreoTutorBotones) CorreoTutorBotones.enganchar({ anadirCco: anadirCco });   /* fila 348 */
  }

  /* Fila 348: «+ Tutor/a de …» en la copia oculta. */
  function anadirCco(dirs) {
    dirs.forEach(function (d) { I.S.cco[d] = true; });
    refrescarCco();
  }

  /* ---------- copiar y abrir ---------- */

  function copiar(texto, boton) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    U.copiar(texto, boton);
  }

  function abrirGmail() {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=' + encodeURIComponent(paraDelCuadro()) +
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '') +
      '&su=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value);
    window.open(url, '_blank');
  }

  function abrirDelOrdenador() {
    var url = 'mailto:' + encodeURIComponent(paraDelCuadro()) +
      '?subject=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value) +
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

  I.S.destinoCtx = { persona: null, correoLoPide: '' };

  /* La plantilla con la que se abre el cuadro (la pedida por una receta, la del tipo o ninguna): se fija aquí, antes de pintar
     «Para», y `bloqueCuerpo` la encuentra ya decidida. */
  function plantillaInicial(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    var pedida = (n()._interno || {}).plantillaPedida;
    if (pedida && opciones.some(function (p) { return p.id === pedida; })) { I.S.plantillaElegida = pedida; n()._interno.plantillaPedida = ''; }
    if (I.S.plantillaElegida === null) I.S.plantillaElegida = n().plantillaDeEntrada(a, opciones);
    if (I.S.plantillaElegida && !opciones.some(function (p) { return p.id === I.S.plantillaElegida; })) I.S.plantillaElegida = '';
    return opciones.filter(function (p) { return p.id === I.S.plantillaElegida; })[0] || null;
  }

  /* A quién va según el «Va a:»: { elegidos: { dirección: bool }, otro }. */
  function destinoDe(vaA) {
    var ctx = I.S.destinoCtx;
    var posibles = Destinatarios.posibles(ctx.persona, vaA === 'quien-lo-pide' ? ctx.correoLoPide : '', {});
    var elegidos = {};
    Object.keys(posibles.elegidos).forEach(function (k) { elegidos[k] = false; });
    if (vaA === 'familia') {
      Object.keys(posibles.elegidos).forEach(function (k) { elegidos[k] = posibles.elegidos[k]; });
      return { elegidos: elegidos, otro: '' };
    }
    if (vaA === 'tutor') return { elegidos: elegidos, otro: window.CorreoTutorBotones ? CorreoTutorBotones.correos().join(', ') : '' };
    return { elegidos: elegidos, otro: ctx.correoLoPide || '' };
  }

  /* Al cambiar de plantilla en el desplegable: si la nueva dice a quién va, «Para» se pone así. */
  function aplicarDestino(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    var p = opciones.filter(function (x) { return x.id === I.S.plantillaElegida; })[0];
    if (!p || !p.vaA || !$('correo-otro')) return;
    var d = destinoDe(p.vaA);
    I.S.elegidos = d.elegidos;
    Array.prototype.forEach.call(document.querySelectorAll('.correo-marca'), function (c) { c.checked = !!I.S.elegidos[c.value]; });
    $('correo-otro').value = d.otro;
  }

  I.$ = $;
  I.n = n;
  I.correosDe = correosDe;
  I.paraDelCuadro = paraDelCuadro;
  I.ccoDelCuadro = ccoDelCuadro;
  I.combinarCorreosDeGrupo = combinarCorreosDeGrupo;
  I.contenidoCco = contenidoCco;
  I.engancharCco = engancharCco;
  I.refrescarCco = refrescarCco;
  I.anadirCco = anadirCco;
  I.copiar = copiar;
  I.abrirGmail = abrirGmail;
  I.abrirDelOrdenador = abrirDelOrdenador;
  I.plantillaInicial = plantillaInicial;
  I.destinoDe = destinoDe;
  I.aplicarDestino = aplicarDestino;
})();
