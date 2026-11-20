/* ============================================================
   papel-enviado.js — el último paso del papel: «Enviado»
   (19-nov-2026, fila 705, docs/705-PAPEL-ENVIAR.md; pantalla de prueba docs/pantallas/692.html).

   El paso «Enviado» de una tarea de papel (js/tarea-papel.js) lleva su botón según el «Por dónde» del recorrido del tipo
   (js/recorrido-tipo.js):
     - Correo electrónico → «Enviar correo»: abre el correo a quien dice el recorrido y con el documento adjunto; cuando el
       correo sale de verdad (`alEnviar`, enganchado a js/correo-rastro.js) la app apunta sola el paso;
     - En mano, correo postal, tablón e iPasen → «Marcar enviado»: apunta solo quién, el día de hoy y la vía, sin ventana.
   Qué se guarda: en la ficha del documento, `enviado: { a, cuando, via, quien, aMano }` (por `DocumentosDatos.anotar`).
   `a` es lo que se lee en el Registro («la familia», o las direcciones del correo), `cuando` el día (AAAA-MM-DD).
   El día y la vía se corrigen desde el ⋮ de la tarea («Corregir el envío»). En el Registro queda una línea.
   ============================================================ */
var PapelEnviado = (function () {

  /* El papel con el que el correo entiende a quién va (js/correo-para.js) y cómo se dice en el Registro. */
  var PAPEL = { 'Familia': 'legales', 'Interesado': 'interesado', 'Quien lo pide': 'pide', 'Tutor/a del grupo': 'tutor', 'Personas relacionadas': 'relac' };
  var A_QUIEN = { 'Familia': 'la familia', 'Interesado': 'el interesado', 'Quien lo pide': 'quien lo pide', 'Tutor/a del grupo': 'el tutor o tutora del grupo', 'Personas relacionadas': 'las personas relacionadas' };
  var POR = { 'en mano': 'en mano', 'correo postal': 'por correo postal', 'tablon': 'en el tablón', 'ipasen': 'por iPasen', 'correo electronico': 'por correo electrónico' };
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function norm(t) { return U.normalizar(String(t || '')); }
  function quien() { return (window.App && App.E && App.E.usuario) || ''; }

  /* Funciones puras. */
  function quienTexto(aquien) { return A_QUIEN[aquien] || String(aquien || '').toLowerCase(); }
  function viaTexto(via) { return POR[norm(via)] || ('por ' + String(via || '').toLowerCase()); }
  function diaCorto(iso) {
    var m = /^\d{4}-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? parseInt(m[2], 10) + '-' + MESES[parseInt(m[1], 10) - 1] : '';
  }
  /* «Enviado en mano a la familia · Francisco · 17-nov» */
  function linea(d) {
    return 'Enviado ' + viaTexto(d.via) + ' ' + String('a ' + (d.a || 'el tercero')).replace(/^a el /, 'al ') + (d.quien ? ' · ' + d.quien : '') + (diaCorto(d.cuando) ? ' · ' + diaCorto(d.cuando) : '');
  }

  function numeroDe(g) { return (g.papelDoc && g.papelDoc.numero) || ''; }

  /* ---------- marcar enviado (en mano, postal, tablón, iPasen) ---------- */

  /* «Marcar enviado»: apunta quién, el día de hoy y la vía del recorrido, y deja la línea en el Registro. */
  async function marcarEnviado(a, h, g) {
    var env = TareaPapel.estado(a, g).envio;
    if (!env) return;
    var datos = { a: quienTexto(env.aquien), cuando: U.hoyIso(), via: env.via, quien: quien(), aMano: true };
    var numero = numeroDe(g);
    if (numero) {
      await DocumentosDatos.anotar(a.nombre, numero, { enviado: datos });
      if (window.RegistroAsunto) await RegistroAsunto.auto(a, linea(datos) + ': ' + g.texto);
    } else {
      await TareaPapel.marcarAMano(a, h, g);   /* sin documento no hay ficha donde apuntarlo: queda como paso marcado a mano */
    }
    await esperarLoQueVuelve(a);
  }

  /* Fila 723: tras enviar, la tarea de papel que nos llega y lo pide su guía queda esperando (js/papel-espera-recibir.js). */
  async function esperarLoQueVuelve(a) {
    if (!window.PapelEsperaRecibir) return;
    try { await PapelEsperaRecibir.alEnviar(a); } catch (e) { if (U.accesorio) U.accesorio('El papel está enviado, pero no he podido poner en espera la tarea de recibirlo', e); }
  }

  /* ---------- corregir el día y la vía (⋮) ---------- */

  function hayEnvio(a, g) {
    var n = numeroDe(g), d = n ? DocumentosDatos.de(TareaPapel.fichaDe(a), n) : null;
    return d && d.enviado ? d.enviado : null;
  }

  async function corregir(a, g) {
    var env = hayEnvio(a, g);
    if (!env) return null;
    var vias = RecorridoTipo.vias();
    if (vias.indexOf(env.via) === -1 && env.via) vias.push(env.via);
    var ok = await U.preguntar('Corregir el envío · ' + g.texto,
      '<label class="th-rotulo" for="pe-dia">Día del envío</label><input type="date" class="campo" id="pe-dia" value="' + esc(env.cuando || U.hoyIso()) + '">' +
      '<label class="th-rotulo" for="pe-via">Por dónde</label><select class="campo" id="pe-via">' +
      vias.map(function (v) { return '<option value="' + esc(v) + '"' + (v === env.via ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select>', 'Guardar');
    if (!ok) return null;
    var dia = document.getElementById('pe-dia').value, via = document.getElementById('pe-via').value;
    if (!dia || (dia === env.cuando && via === env.via)) return null;
    var nuevo = Object.assign({}, env, { cuando: dia, via: via });
    await DocumentosDatos.anotar(a.nombre, numeroDe(g), { enviado: nuevo });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Envío corregido: ' + linea(nuevo) + ': ' + g.texto);
    return nuevo;
  }

  /* La opción «Corregir el envío» del ⋮ (solo con un envío ya apuntado en la ficha del documento). */
  function opcionMenu(a, h, g, guardar, menu) {
    if (!hayEnvio(a, g)) return null;
    return { texto: 'Corregir el envío', clase: 'tp-corregir-opcion', alPulsar: function () {
      guardar(menu, 'corregir el envío', async function () { await corregir(a, g); await TareaPapel.sincronizar(a, h); });
    } };
  }

  /* ---------- enviar correo ---------- */

  /* El fichero del documento de la tarea en la carpeta del asunto: el PDF si lo hay (el último), si no el primero. */
  async function ficheroDe(a, numero) {
    try {
      var suyos = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }).filter(function (n) { return numero && n.indexOf(numero) !== -1; }).sort();
      var pdfs = suyos.filter(function (n) { return /\.pdf$/i.test(n); });
      return pdfs.length ? pdfs[pdfs.length - 1] : (suyos[0] || '');
    } catch (e) { return ''; }
  }

  /* Las plantillas de correo del tipo de asunto que adjuntan este tipo de documento. */
  async function plantillasDe(a, papel) {
    try {
      var datos = await Plantillas.cargar(App.E.gestor);
      var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
      return Plantillas.deTipo(datos, CorreoNucleo.categoriaDe(a), tipo).filter(function (p) { return norm(p.adjuntar) === norm(papel); });
    } catch (e) { return []; }
  }

  /* Abre el correo con el documento adjunto y a quien dice el recorrido. `p`: la plantilla elegida, o null (sin plantilla). */
  async function abrirCorreo(a, h, g, p) {
    var nombre = await ficheroDe(a, numeroDe(g));
    if (!nombre) { U.aviso('No encuentro el documento en la carpeta del asunto.', 'ambar'); return; }
    var env = TareaPapel.estado(a, g).envio;
    var extra = { adjuntosMarcados: [nombre], papelesPara: env && PAPEL[env.aquien] ? [PAPEL[env.aquien]] : [] };
    if (p) extra.plantilla = p.id; else extra.sinPlantilla = true;
    await CorreoNucleo.abrirCuadro(a, false, extra);
    await TareaPapel.sincronizar(a, h, g.id);
  }

  /* El botón «Enviar correo»: con una plantilla del tipo que adjunte este papel, la usa; con varias, deja elegir; con ninguna, abre el correo sin plantilla. */
  async function montarEnviarCorreo(a, h, g, boton) {
    var lista = await plantillasDe(a, g.papel);
    if (!boton.isConnected) return;
    var con = function (p) { abrirCorreo(a, h, g, p); };
    if (lista.length <= 1) { boton.onclick = function () { con(lista[0] || null); }; return; }
    boton.textContent = 'Enviar correo ▾';
    if (window.FichaMenus) FichaMenus.montar(boton, lista.map(function (p) { return { texto: p.nombre, alPulsar: function () { con(p); } }; }));
  }

  /* Cuando el correo sale de verdad (js/correo-rastro.js): apunta `enviado` en cada documento adjunto con número. */
  async function alEnviar(a, nombresAdjuntos, para) {
    var datos = { a: para || 'el tercero', cuando: U.hoyIso(), via: 'Correo electrónico', quien: quien(), aMano: false };
    var hechos = {};
    for (var i = 0; i < (nombresAdjuntos || []).length; i++) {
      var n = window.Numeros ? Numeros.delNombreDeDocumento(nombresAdjuntos[i]) : '';
      if (!n || hechos[n]) continue;
      hechos[n] = true;
      await DocumentosDatos.anotar(a.nombre, n, { enviado: datos });
    }
    if (Object.keys(hechos).length) await esperarLoQueVuelve(a);
  }

  return { linea: linea, quienTexto: quienTexto, viaTexto: viaTexto, diaCorto: diaCorto, marcarEnviado: marcarEnviado, corregir: corregir, opcionMenu: opcionMenu,
           montarEnviarCorreo: montarEnviarCorreo, alEnviar: alEnviar };
})();
window.PapelEnviado = PapelEnviado;
