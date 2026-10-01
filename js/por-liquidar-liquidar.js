/* ============================================================
   por-liquidar-liquidar.js — el botón «Liquidar» de la pestaña «Por
   liquidar» (1-oct-2026, fila 249, docs/POR-LIQUIDAR.md, apartados 4 y 5).

   Abre un cuadro (fecha, quién entrega, quién recibe, nota, la lista con
   su total) y, al aceptar, por cada asunto marcado, en este orden:

     1. el PDF LIQUIDACIÓN, guardado en la carpeta del asunto con el
        nombre de la fila 239 (`AAMMDD LIQUIDACION D26-01234.pdf`, tipo
        de documento «LIQUIDACION», creado solo si no existe);
     2. la línea del registro: «Liquidado el <fecha>: entrega …, recibe …»;
     3. el asunto sale de «Por liquidar» y se archiva por el camino de
        siempre (`App.cerrarAsunto`), sin preguntar uno a uno: la
        confirmación es la del propio cuadro.

   Lo principal es archivar, pero la constancia va antes: si el PDF falla
   en un asunto, aviso ámbar y ese asunto NO se archiva (se queda en «Por
   liquidar»). El PDF es el mismo para todos los asuntos de la tanda (lleva
   la lista entera); cada carpeta guarda su copia con su número de documento.
   pdf-lib viene de js/pdf-herramientas.js, como en js/correo-enviado-pdf.js.
   Carga después de js/por-liquidar.js.
   ============================================================ */
window.PorLiquidarLiquidar = (function () {

  function $(id) { return document.getElementById(id); }

  var TIPO_DOCUMENTO = 'LIQUIDACION';

  /* Helvetica de pdf-lib solo sabe escribir WinAnsi: lo que no cabe se
     cambia por «?» en vez de romper (como en js/correo-enviado-pdf.js). */
  var EXTRA_WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function limpio(t) {
    return String(t || '').normalize('NFC').split('').map(function (c) {
      var n = c.charCodeAt(0);
      if (n === 9) return ' ';
      if ((n >= 32 && n <= 126) || (n >= 160 && n <= 255) || EXTRA_WINANSI.indexOf(c) !== -1) return c;
      return '?';
    }).join('');
  }

  function fechaLegible(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || '');
  }

  /* ==========================================================
     EL PDF
     ========================================================== */

  /* `d` = { fecha (AAAA-MM-DD), entrega, recibe, nota, total (texto, o ''),
     filas: [{ numero, tipo, tercero, importe (texto) }] }. Devuelve los bytes. */
  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var gris = PDFLib.rgb(0.35, 0.35, 0.35), negro = PDFLib.rgb(0, 0, 0), raya = PDFLib.rgb(0.75, 0.75, 0.75);
    var ANCHO = 595.28, ALTO = 841.89, M = 50, SALTO = 15;
    var pagina, y, imagen = null;

    if (window.Membrete && Membrete.montar) {
      try {
        var m = await Membrete.montar({ conLogoCentro: true });
        if (m && m.bytes) imagen = await doc.embedPng(m.bytes);
      } catch (e) { imagen = null; }   /* sin membrete, como el resto de documentos */
    }

    function texto(t, x, yy, tam, f, color) { pagina.drawText(limpio(t), { x: x, y: yy, size: tam, font: f || normal, color: color || negro }); }
    function nuevaPagina() { pagina = doc.addPage([ANCHO, ALTO]); y = ALTO - M; }
    function sitio(alto) { if (y - alto < M + 30) { nuevaPagina(); cabeceraTabla(); } }
    function cortar(t, f, tam, ancho) {
      var s = limpio(t);
      if (f.widthOfTextAtSize(s, tam) <= ancho) return s;
      while (s.length > 1 && f.widthOfTextAtSize(s + '…', tam) > ancho) s = s.slice(0, -1);
      return s + '…';
    }

    var COL = { numero: M, tipo: M + 85, tercero: M + 215, importe: ANCHO - M - 70 };
    function cabeceraTabla() {
      texto('Nº del asunto', COL.numero, y, 9.5, negrita);
      texto('Tipo', COL.tipo, y, 9.5, negrita);
      texto('Tercero', COL.tercero, y, 9.5, negrita);
      if (d.conImporte) texto('Importe', COL.importe, y, 9.5, negrita);
      y -= 5;
      pagina.drawLine({ start: { x: M, y: y }, end: { x: ANCHO - M, y: y }, thickness: 0.6, color: raya });
      y -= SALTO - 2;
    }

    nuevaPagina();
    if (imagen) {
      var anchoImg = ANCHO - 2 * M, altoImg = anchoImg * imagen.height / imagen.width;
      pagina.drawImage(imagen, { x: M, y: y - altoImg, width: anchoImg, height: altoImg });
      y -= altoImg + 14;
    }
    texto('Liquidación', M, y, 18, negrita);
    y -= 26;
    [['Fecha', fechaLegible(d.fecha)], ['Entrega', d.entrega], ['Recibe', d.recibe]].forEach(function (par) {
      var etiqueta = par[0] + ': ';
      texto(etiqueta, M, y, 10.5, negrita);
      texto(par[1], M + negrita.widthOfTextAtSize(etiqueta, 10.5), y, 10.5, normal);
      y -= SALTO;
    });
    if (d.nota) {
      texto('Nota: ', M, y, 10.5, negrita);
      var anchoNota = ANCHO - 2 * M - negrita.widthOfTextAtSize('Nota: ', 10.5);
      texto(cortar(d.nota, normal, 10.5, anchoNota), M + negrita.widthOfTextAtSize('Nota: ', 10.5), y, 10.5, normal);
      y -= SALTO;
    }
    y -= 12;
    cabeceraTabla();
    d.filas.forEach(function (f) {
      sitio(SALTO);
      texto(cortar(f.numero || '', normal, 9.5, COL.tipo - COL.numero - 6), COL.numero, y, 9.5);
      texto(cortar(f.tipo || '', normal, 9.5, COL.tercero - COL.tipo - 6), COL.tipo, y, 9.5);
      texto(cortar(f.tercero || '', normal, 9.5, (d.conImporte ? COL.importe : ANCHO - M) - COL.tercero - 6), COL.tercero, y, 9.5);
      if (d.conImporte) texto(f.importe || '', COL.importe, y, 9.5);
      y -= SALTO;
    });
    y -= 4;
    pagina.drawLine({ start: { x: M, y: y }, end: { x: ANCHO - M, y: y }, thickness: 0.6, color: raya });
    y -= SALTO + 2;
    if (d.conImporte) {
      sitio(SALTO);
      texto('Total: ' + d.total, ANCHO - M - negrita.widthOfTextAtSize(limpio('Total: ' + d.total), 11), y, 11, negrita);
      y -= SALTO;
    }

    /* Los dos huecos de firma, en la última página. */
    if (y - 110 < M + 30) { nuevaPagina(); }
    y -= 50;
    var mitad = (ANCHO - 2 * M) / 2;
    [['Entrega', d.entrega, M], ['Recibe', d.recibe, M + mitad + 10]].forEach(function (p) {
      pagina.drawLine({ start: { x: p[2], y: y }, end: { x: p[2] + mitad - 30, y: y }, thickness: 0.6, color: negro });
      texto('Firma de quien ' + (p[0] === 'Entrega' ? 'entrega' : 'recibe'), p[2], y - 12, 9, normal, gris);
      texto(cortar(p[1], negrita, 10, mitad - 30), p[2], y - 26, 10, negrita);
    });

    var paginas = doc.getPages();
    paginas.forEach(function (p, i) {
      pagina = p;
      var num = 'Página ' + (i + 1) + ' de ' + paginas.length;
      texto(num, ANCHO - M - normal.widthOfTextAtSize(num, 8), 28, 8, normal, gris);
    });
    doc.setTitle(limpio('Liquidación del ' + fechaLegible(d.fecha)));
    return doc.save();
  }

  /* ==========================================================
     LO QUE SE HACE CON CADA ASUNTO
     ========================================================== */

  async function asegurarTipoDeDocumento() {
    if (!window.App || !App.E || !Array.isArray(App.E.tiposDocumento)) return;
    if (App.E.tiposDocumento.indexOf(TIPO_DOCUMENTO) !== -1) return;
    if (window.Borrados && Borrados.revivir) await Borrados.revivir(App.E.gestor, 'tiposDocumento', TIPO_DOCUMENTO);
    App.E.tiposDocumento.push(TIPO_DOCUMENTO);
    await App.guardarTiposDocumento();
  }

  function datosParaElPdf(asuntos, o) {
    var conImporte = asuntos.some(function (a) { return PorLiquidar.importeDe(a); });
    var s = PorLiquidar.sumar(asuntos);
    return {
      fecha: o.fecha, entrega: o.entrega, recibe: o.recibe, nota: o.nota, conImporte: conImporte,
      total: PorLiquidar.euros(s.total) + (conImporte && s.sinImporte ? ' (' + s.sinImporte + ' sin importe)' : ''),
      filas: asuntos.map(function (a) {
        var i = PorLiquidar.importeDe(a);
        var reservado = window.Reservados && Reservados.es && Reservados.es(a);
        return {
          numero: (a.ficha && a.ficha.numero) || (a.leido && a.leido.numero) || '',
          tipo: Nombres.tipoParaVer((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '', App.E.tipos),
          tercero: reservado ? '(reservado)' : (QueMeToca.terceroDe(a) || a.nombre),
          importe: i && !i.sinImporte ? i.texto : ''
        };
      })
    };
  }

  /* Guarda el PDF en la carpeta del asunto, con su número de documento. */
  async function guardarPdf(a, bytes, fecha) {
    if (!a || !a.handle) throw new Error('No encuentro la carpeta del asunto.');
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombre = Nombres.montarDocumento({ fecha: fecha, tipo: TIPO_DOCUMENTO, extension: 'pdf', numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(a.handle, nombre, bytes, 'application/pdf');
    try {
      await DocumentosDatos.anotar(a.nombre, numeroDoc, { tipo: TIPO_DOCUMENTO, fecha: fecha, registros: [], campos: [], texto: '' });
    } catch (e) { U.accesorio('El PDF está guardado, pero no he podido apuntar sus datos en la ficha', e); }
    return nombre;
  }

  async function estaArchivado(a) {
    try { return !(await Carpetas.existe(App.E.abiertos, a.nombre)); } catch (e) { return false; }
  }

  /* Liquida y archiva `asuntos` con los datos `o` ({ fecha, entrega, recibe, nota }). */
  async function hacer(asuntos, o) {
    var datos = datosParaElPdf(asuntos, o);
    var bytes = await pdfDe(datos);
    try { await asegurarTipoDeDocumento(); } catch (e) { U.accesorio('No he podido dar de alta el tipo de documento LIQUIDACION', e); }
    var hechos = [], fallidos = 0;
    for (var i = 0; i < asuntos.length; i++) {
      var a = asuntos[i];
      var antes = a.ficha && a.ficha.porLiquidar;
      try {
        await guardarPdf(a, bytes, o.fecha);
      } catch (e) {
        fallidos++;
        U.accesorio('No he podido guardar el PDF de la liquidación en «' + (QueMeToca.terceroDe(a) || a.nombre) +
          '»: ese asunto se queda en Por liquidar', e);
        continue;
      }
      if (window.RegistroAsunto) {
        await RegistroAsunto.auto(a, 'Liquidado el ' + fechaLegible(o.fecha) + ': entrega ' + o.entrega + ', recibe ' + o.recibe);
      }
      try {
        await App.anotar(a.nombre, { porLiquidar: null, liquidadoEl: o.fecha });
        if (a.ficha) a.ficha.porLiquidar = null;
        App.E.archivarSinPreguntar = true;
        try { await App.cerrarAsunto(a); } finally { App.E.archivarSinPreguntar = false; }
      } catch (e) {
        U.accesorio('No he podido archivar «' + (QueMeToca.terceroDe(a) || a.nombre) + '»', e);
      }
      if (await estaArchivado(a)) {
        hechos.push(a);
      } else {
        fallidos++;
        try { await App.anotar(a.nombre, { porLiquidar: antes || { desde: U.hoyIso(), auto: false } }); } catch (e2) { /* se ve al repintar */ }
      }
    }
    PorLiquidar.desmarcar(hechos.map(function (a) { return a.nombre; }));
    if (hechos.length) {
      var s = PorLiquidar.sumar(hechos);
      var conImporte = hechos.some(function (a) { return PorLiquidar.importeDe(a); });
      U.aviso('Liquidados y archivados ' + hechos.length + (hechos.length === 1 ? ' asunto' : ' asuntos') +
        (conImporte ? '. Total: ' + PorLiquidar.euros(s.total) : '') + '.', 'bueno');
    }
    try { await App.verAbiertos(); } catch (e3) { /* solo pintar */ }
    return { hechos: hechos.length, fallidos: fallidos };
  }

  /* ==========================================================
     EL CUADRO
     ========================================================== */

  async function nombresDeEntrada() {
    var nombres = [];
    try { if (window.Usuarios && App.E.gestor) nombres = await Usuarios.cargar(App.E.gestor); } catch (e) { nombres = []; }
    if (App.E.usuario && nombres.indexOf(App.E.usuario) === -1) nombres.unshift(App.E.usuario);
    return nombres;
  }

  async function recibeEn(fecha) {
    try {
      var s = window.Cargos ? await Cargos.enFecha('secretaria', fecha) : null;
      return (s && s.persona) || '';
    } catch (e) { return ''; }
  }

  async function abrir(asuntos) {
    if (!asuntos || !asuntos.length) return;
    var hoy = U.hoyIso();
    var nombres = await nombresDeEntrada();
    var recibe = await recibeEn(hoy);
    var s = PorLiquidar.sumar(asuntos);
    var conImporte = asuntos.some(function (a) { return PorLiquidar.importeDe(a); });
    var lista = asuntos.map(function (a) {
      var i = PorLiquidar.importeDe(a);
      var reservado = window.Reservados && Reservados.es && Reservados.es(a);
      return '<li>' + U.escapar(reservado ? '(reservado)' : (QueMeToca.terceroDe(a) || a.nombre)) +
        (i && i.texto ? ' · ' + U.escapar(i.texto) : '') + '</li>';
    }).join('');
    var esperar = U.preguntar('Liquidar',
      '<label class="etiqueta">Fecha</label><input type="date" id="liq-fecha" class="campo" value="' + hoy + '">' +
      '<label class="etiqueta">Entrega</label><input id="liq-entrega" class="campo" list="liq-entrega-lista" value="' +
        U.escapar(App.E.usuario || '') + '">' +
      '<datalist id="liq-entrega-lista">' + nombres.map(function (n) { return '<option value="' + U.escapar(n) + '">'; }).join('') + '</datalist>' +
      '<label class="etiqueta">Recibe</label><input id="liq-recibe" class="campo" value="' + U.escapar(recibe) + '" ' +
        'placeholder="Quien ocupa Secretaría">' +
      '<label class="etiqueta">Nota <span class="suave">(opcional)</span></label>' +
        '<input id="liq-nota" class="campo" placeholder="Por ejemplo: dinero en efectivo">' +
      '<p class="explica" style="margin-top:10px"><strong>' + asuntos.length + (asuntos.length === 1 ? ' asunto' : ' asuntos') + '</strong>' +
        (conImporte ? ' · Total: <strong>' + U.escapar(PorLiquidar.euros(s.total)) + '</strong>' +
          (s.sinImporte ? ' (' + s.sinImporte + ' sin importe)' : '') : '') + '</p>' +
      '<ul class="liq-lista">' + lista + '</ul>',
      'Liquidar y archivar');
    var recibeEditado = false;
    if ($('liq-recibe')) $('liq-recibe').oninput = function () { recibeEditado = true; };
    if ($('liq-fecha')) $('liq-fecha').onchange = async function () {
      if (recibeEditado) return;
      var nuevo = await recibeEn($('liq-fecha').value);
      if ($('liq-recibe') && !recibeEditado) $('liq-recibe').value = nuevo;
    };
    var ok = await esperar;
    if (!ok) return;
    var fecha = ($('liq-fecha') || {}).value || hoy;
    var entrega = (($('liq-entrega') || {}).value || '').trim();
    var recibeFinal = (($('liq-recibe') || {}).value || '').trim();
    var nota = (($('liq-nota') || {}).value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { U.aviso('Pon una fecha para la liquidación.', 'ambar'); return; }
    if (!entrega || !recibeFinal) { U.aviso('Hace falta saber quién entrega y quién recibe.', 'ambar'); return; }
    try {
      await hacer(asuntos, { fecha: fecha, entrega: entrega, recibe: recibeFinal, nota: nota });
    } catch (e) {
      U.fallo('No he podido liquidar', e);
    }
  }

  return { abrir: abrir, hacer: hacer, pdfDe: pdfDe, TIPO_DOCUMENTO: TIPO_DOCUMENTO };
})();
