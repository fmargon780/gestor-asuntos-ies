/* ============================================================
   candidaturas-lista.js — la lista de candidaturas en PDF, para el tablón
   (15-oct-2026, fila 347, docs/CANDIDATURAS-CONSEJO-ESCOLAR.md, apartado 5).

   «Lista de candidaturas ▾» de la tarjeta «Candidaturas» ofrece «Provisional» y «Definitiva»:

   - Provisional: en la lista, las admitidas y las presentadas; las excluidas, aparte al final de su sector, con
     el motivo.
   - Definitiva: solo las admitidas; las excluidas, aparte con el motivo. Las presentadas sin resolver no salen
     y, si queda alguna, se avisa antes («Hay N candidaturas sin resolver»).
   - Las retiradas no salen en ninguna. Solo nombre y apellidos: ni DNI ni número escolar (es para el tablón).

   Lleva el membrete del centro, el título, un bloque por sector (por apellidos) y, al pie, el lugar y la fecha y
   la firma de quien ocupe la Presidencia de la Junta Electoral en `cargos.json` (si no existe ese cargo, la de
   Dirección). Se guarda en la carpeta del asunto como `AAMMDD LISTA CANDIDATURAS D26-….pdf` (tipo de documento
   LISTA DE CANDIDATURAS, creado solo si no existe) y se abre en el visor. pdf-lib viene de js/pdf-herramientas.js,
   como en js/por-liquidar-liquidar.js. Se carga después de js/candidaturas.js.
   ============================================================ */
var CandidaturasLista = (function () {

  var TIPO_DOCUMENTO = 'LISTA DE CANDIDATURAS';
  var CORTO = 'LISTA CANDIDATURAS';

  /* Helvetica de pdf-lib solo sabe escribir WinAnsi: lo que no cabe se cambia por «?» en vez de romper. */
  var EXTRA_WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function limpio(t) {
    return String(t || '').normalize('NFC').split('').map(function (c) {
      var n = c.charCodeAt(0);
      if (n === 9) return ' ';
      if ((n >= 32 && n <= 126) || (n >= 160 && n <= 255) || EXTRA_WINANSI.indexOf(c) !== -1) return c;
      return '?';
    }).join('');
  }

  /* ---------- qué sale en cada lista (pura) ---------- */

  /* → { sectores: [{ sector, lista: [nombre], excluidas: [{ nombre, motivo }] }], sinResolver, total } */
  function datosDe(cands, tipo) {
    var definitiva = tipo === 'definitiva';
    var sectores = Candidaturas.SECTORES.map(function (s) {
      var delSector = Candidaturas.porSector(cands, s);
      return {
        sector: s,
        lista: delSector.filter(function (c) { return c.estado === 'Admitida' || (!definitiva && c.estado === 'Presentada'); })
          .map(function (c) { return Candidaturas.visible(c.persona); }),
        excluidas: delSector.filter(function (c) { return c.estado === 'Excluida'; })
          .map(function (c) { return { nombre: Candidaturas.visible(c.persona), motivo: c.motivo || '' }; })
      };
    });
    return {
      sectores: sectores,
      sinResolver: cands.filter(function (c) { return c.estado === 'Presentada'; }).length,
      total: sectores.reduce(function (n, s) { return n + s.lista.length + s.excluidas.length; }, 0)
    };
  }

  function fechaLegible(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || '');
  }

  /* ---------- quién firma ---------- */

  /* La Presidencia de la Junta Electoral, si existe ese cargo con ocupante en la fecha; si no, la Dirección. */
  async function firmante(fecha) {
    try {
      var datos = await Cargos.leer();
      var junta = (datos.cargos || []).filter(function (c) {
        var n = U.normalizar(c.nombre);
        return n.indexOf('junta electoral') !== -1 && n.indexOf('presiden') !== -1;
      })[0];
      if (junta) {
        var f = await Cargos.enFecha(junta.id, fecha);
        if (f && f.persona) return { persona: f.persona, cargo: f.nombre || junta.nombre };
      }
      var d = await Cargos.enFecha('direccion', fecha);
      if (d && d.persona) return { persona: d.persona, cargo: d.nombre || 'Dirección' };
    } catch (e) { /* sin cargos, sin firma */ }
    return { persona: '', cargo: 'Dirección' };
  }

  /* ---------- el PDF ---------- */

  /* `d` = { tipo, centro, lugarYFecha, firma: { persona, cargo }, datos: datosDe(...) }. Devuelve los bytes. */
  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var gris = PDFLib.rgb(0.35, 0.35, 0.35), negro = PDFLib.rgb(0, 0, 0);
    var ANCHO = 595.28, ALTO = 841.89, M = 56, SALTO = 15;
    var pagina, y, imagen = null;

    if (window.Membrete && Membrete.montar) {
      try {
        var m = await Membrete.montar({ conLogoCentro: true });
        if (m && m.bytes) imagen = await doc.embedPng(m.bytes);
      } catch (e) { imagen = null; }   /* sin membrete, como el resto de documentos */
    }

    function texto(t, x, yy, tam, f, color) { pagina.drawText(limpio(t), { x: x, y: yy, size: tam, font: f || normal, color: color || negro }); }
    function nuevaPagina() { pagina = doc.addPage([ANCHO, ALTO]); y = ALTO - M; }
    function sitio(alto) { if (y - alto < M + 30) nuevaPagina(); }
    /* Parte un texto en renglones que quepan en `ancho`. */
    function renglones(t, f, tam, ancho) {
      var palabras = limpio(t).split(' '), salida = [], actual = '';
      palabras.forEach(function (p) {
        var prueba = actual ? actual + ' ' + p : p;
        if (f.widthOfTextAtSize(prueba, tam) <= ancho || !actual) actual = prueba; else { salida.push(actual); actual = p; }
      });
      if (actual) salida.push(actual);
      return salida;
    }
    function centrado(t, yy, tam, f) {
      var s = limpio(t);
      texto(s, (ANCHO - f.widthOfTextAtSize(s, tam)) / 2, yy, tam, f);
    }

    nuevaPagina();
    if (imagen) {
      var anchoImg = ANCHO - 2 * M, altoImg = anchoImg * imagen.height / imagen.width;
      pagina.drawImage(imagen, { x: M, y: y - altoImg, width: anchoImg, height: altoImg });
      y -= altoImg + 16;
    }
    var titulo = 'Lista ' + (d.tipo === 'definitiva' ? 'definitiva' : 'provisional') + ' de candidaturas';
    centrado(titulo, y, 16, negrita); y -= 20;
    centrado('Elecciones al Consejo Escolar', y, 13, negrita); y -= 18;
    if (d.centro) { centrado(d.centro, y, 10.5, normal); y -= 18; }
    y -= 8;

    d.datos.sectores.forEach(function (s) {
      sitio(SALTO * 3);
      texto(s.sector, M, y, 12, negrita); y -= SALTO + 2;
      if (!s.lista.length && !s.excluidas.length) {
        texto('Ninguna candidatura.', M + 10, y, 10.5, normal, gris); y -= SALTO;
      }
      s.lista.forEach(function (n, i) {
        sitio(SALTO);
        texto((i + 1) + '.', M + 10, y, 10.5, normal);
        texto(n, M + 32, y, 10.5, normal); y -= SALTO;
      });
      if (s.excluidas.length) {
        sitio(SALTO * 2);
        y -= 3;
        texto('Candidaturas excluidas', M + 10, y, 10, negrita, gris); y -= SALTO;
        s.excluidas.forEach(function (x) {
          var ls = renglones(x.nombre + (x.motivo ? ' — Motivo: ' + x.motivo : ''), normal, 10, ANCHO - 2 * M - 32);
          ls.forEach(function (l) { sitio(SALTO); texto(l, M + 32, y, 10, normal); y -= SALTO - 1; });
        });
      }
      y -= 10;
    });

    /* Pie: lugar y fecha y la firma. */
    if (y - 120 < M + 30) nuevaPagina();
    y -= 16;
    if (d.lugarYFecha) { texto(d.lugarYFecha + '.', M, y, 10.5, normal); y -= SALTO + 10; }
    texto(d.firma.cargo || '', M, y, 10.5, negrita); y -= 46;
    texto(d.firma.persona ? 'Fdo.: ' + d.firma.persona : 'Fdo.:', M, y, 10.5, normal);

    var paginas = doc.getPages();
    paginas.forEach(function (p, i) {
      pagina = p;
      var num = 'Página ' + (i + 1) + ' de ' + paginas.length;
      texto(num, ANCHO - M - normal.widthOfTextAtSize(num, 8), 28, 8, normal, gris);
    });
    doc.setTitle(limpio(titulo));
    return doc.save();
  }

  /* ---------- guardar y enseñar ---------- */

  async function guardarPdf(a, bytes, fecha) {
    if (!a || !a.handle) throw new Error('No encuentro la carpeta del asunto.');
    await Candidaturas.asegurarTipoDeDocumento(TIPO_DOCUMENTO, CORTO);
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombre = Nombres.montarDocumento({ fecha: fecha, tipo: TIPO_DOCUMENTO, extension: 'pdf', numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(a.handle, nombre, bytes, 'application/pdf');
    try {
      await DocumentosDatos.anotar(a.nombre, numeroDoc, { tipo: TIPO_DOCUMENTO, fecha: fecha, registros: [], campos: [], texto: '' });
    } catch (e) { U.accesorio('El PDF está guardado, pero no he podido apuntar sus datos en la ficha', e); }
    return nombre;
  }

  /* Saca la lista (`tipo`: 'provisional' | 'definitiva'), la guarda en el asunto y la abre. */
  async function hacer(a, tipo) {
    var cands = Candidaturas.lista(a);
    var datos = datosDe(cands, tipo);
    if (!datos.total) { U.aviso('No hay candidaturas que puedan salir en la lista ' + (tipo === 'definitiva' ? 'definitiva' : 'provisional') + '.', 'ambar'); return; }
    if (tipo === 'definitiva' && datos.sinResolver) {
      var ok = await U.preguntar('Hay ' + datos.sinResolver + (datos.sinResolver === 1 ? ' candidatura sin resolver' : ' candidaturas sin resolver'),
        '<p>' + (datos.sinResolver === 1 ? 'Una candidatura sigue «Presentada»' : datos.sinResolver + ' candidaturas siguen «Presentada»') +
        ': no sale' + (datos.sinResolver === 1 ? '' : 'n') + ' en la lista definitiva. ¿Sacarla igualmente?</p>', 'Sacar la lista');
      if (!ok) return;
    }
    var fecha = U.hoyIso();
    try {
      var valores = {};
      try { valores = await Plantillas.valoresDeAsunto(a, { fecha: fecha, conLoQueFalta: false }); } catch (e1) { valores = {}; }
      var bytes = await pdfDe({
        tipo: tipo, centro: valores.centro || '', lugarYFecha: valores.lugarYFecha || ('A ' + fechaLegible(fecha)),
        firma: await firmante(fecha), datos: datos
      });
      var nombre = await guardarPdf(a, bytes, fecha);
      if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Lista ' + (tipo === 'definitiva' ? 'definitiva' : 'provisional') + ' de candidaturas «' + nombre + '»');
      U.aviso('Lista guardada en el asunto: ' + nombre, 'bueno');
      try {
        var h = await a.handle.getFileHandle(nombre);
        if (window.Visor) Visor.abrir(h, nombre, { asunto: a, carpeta: a.handle });
      } catch (e2) { U.accesorio('La lista está guardada, pero no he podido abrirla', e2); }
      if (window.CandidaturasFicha) CandidaturasFicha.repintar();
    } catch (e) { U.fallo('No he podido sacar la lista', e); }
  }

  return { hacer: hacer, datosDe: datosDe, pdfDe: pdfDe, firmante: firmante, TIPO_DOCUMENTO: TIPO_DOCUMENTO };
})();
window.CandidaturasLista = CandidaturasLista;
