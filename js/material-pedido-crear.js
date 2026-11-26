/* ============================================================
   material-pedido-crear.js — de un pedido a su asunto COMPRA y su documento (fila 752,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 3).

   Por cada proveedor con líneas se crea:
   - un asunto COMPRA nuevo a su nombre (tercero = la empresa), con su número, por el mismo camino que
     `crearUno` de js/recurrentes.js (`Numeros.reservar`, `Nombres.montarAsunto`, `App.anotar`);
   - su documento de pedido, un PDF `AAMMDD PEDIDO D26-….pdf` (tipo de documento PEDIDO, creado solo si no
     existe) con las líneas, cantidades, precios, importes y totales, guardado en la carpeta del asunto
     como los demás documentos que genera la app (pdf-lib de js/pdf-herramientas.js, como
     js/candidaturas-lista.js);
   - en la ficha del asunto, `pedido`: { proveedor, fecha, doc, lineas: [{ a, n, u, c, i, para }], sinIva }.
     Es de donde salen la pestaña «Pedidos» y, en la parte 5, la comprobación del pedido y la factura.
   ============================================================ */
(function () {

  var TIPO_ASUNTO = 'COMPRA';
  var TIPO_DOCUMENTO = 'PEDIDO';
  var IVA = 0.21;

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

  function centimos(n) { return Math.round(Number(n) * 100) / 100; }
  function cantidadTexto(n) { return String(Number(n)).replace('.', ','); }
  function fechaLegible(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || '');
  }

  /* Los totales de un pedido, sin IVA, el IVA y con IVA. */
  function totalesDe(lineas) {
    var sin = centimos((lineas || []).reduce(function (s, l) { return s + centimos(l.i * l.c); }, 0));
    var iva = centimos(sin * IVA);
    return { sinIva: sin, iva: iva, conIva: centimos(sin + iva) };
  }

  /* ---------- el PDF ---------- */

  /* `d` = { centro, proveedor, fecha, numero, lineas: [{ n, u, c, i, para }] }. Devuelve los bytes. */
  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var gris = PDFLib.rgb(0.35, 0.35, 0.35), negro = PDFLib.rgb(0, 0, 0);
    var ANCHO = 595.28, ALTO = 841.89, M = 48, SALTO = 15;
    var COL = { n: M, c: 292, p: 392, i: 480 };   /* x de cada columna; las cifras se alinean a la derecha de la suya */
    var pagina, y, imagen = null;

    if (window.Membrete && Membrete.montar) {
      try {
        var m = await Membrete.montar({ conLogoCentro: true });
        if (m && m.bytes) imagen = await doc.embedPng(m.bytes);
      } catch (e) { imagen = null; }   /* sin membrete, como el resto de documentos */
    }

    function texto(t, x, yy, tam, fuente, color) {
      pagina.drawText(limpio(t), { x: x, y: yy, size: tam, font: fuente || normal, color: color || negro });
    }
    function derecha(t, xDer, yy, tam, fuente) {
      var f = fuente || normal, s = limpio(t);
      pagina.drawText(s, { x: xDer - f.widthOfTextAtSize(s, tam), y: yy, size: tam, font: f, color: negro });
    }
    function cabeceraTabla() {
      texto('Artículo', COL.n, y, 9.5, negrita);
      derecha('Cantidad', COL.c + 80, y, 9.5, negrita);
      derecha('Precio', COL.p + 72, y, 9.5, negrita);
      derecha('Importe', COL.i + 66, y, 9.5, negrita);
      y -= 6;
      pagina.drawLine({ start: { x: M, y: y }, end: { x: ANCHO - M, y: y }, thickness: 0.6, color: gris });
      y -= SALTO;
    }
    function nuevaPagina(conCabecera) {
      pagina = doc.addPage([ANCHO, ALTO]);
      y = ALTO - M;
      if (conCabecera) cabeceraTabla();
    }

    nuevaPagina(false);
    if (imagen) {
      var escala = Math.min((ANCHO - 2 * M) / imagen.width, 70 / imagen.height, 1);
      pagina.drawImage(imagen, { x: M, y: y - imagen.height * escala, width: imagen.width * escala, height: imagen.height * escala });
      y -= imagen.height * escala + 14;
    } else if (d.centro) { texto(d.centro, M, y, 11, negrita); y -= SALTO + 8; }
    texto('PEDIDO', M, y, 18, negrita); y -= 24;
    texto('Proveedor: ' + d.proveedor, M, y, 11, negrita); y -= SALTO;
    texto('Fecha: ' + fechaLegible(d.fecha) + (d.numero ? '   ·   Asunto ' + d.numero : ''), M, y, 10.5, normal); y -= SALTO + 12;
    cabeceraTabla();

    d.lineas.forEach(function (l) {
      if (y < M + 90) nuevaPagina(true);
      var nombre = limpio(l.n);
      while (nombre.length > 3 && normal.widthOfTextAtSize(nombre, 9.5) > COL.c - COL.n - 8) nombre = nombre.slice(0, -2);
      if (nombre !== limpio(l.n)) nombre += '…';
      texto(nombre, COL.n, y, 9.5);
      derecha(cantidadTexto(l.c) + ' × ' + (l.u || ''), COL.c + 80, y, 9);
      derecha(Material.euros(l.i), COL.p + 72, y, 9.5);
      derecha(Material.euros(centimos(l.i * l.c)), COL.i + 66, y, 9.5);
      y -= SALTO;
      if (l.para) { texto('para ' + l.para, COL.n + 8, y + 2, 8, normal, gris); y -= 4; }
    });

    var t = totalesDe(d.lineas);
    if (y < M + 70) nuevaPagina(false);
    y -= 6;
    pagina.drawLine({ start: { x: COL.p - 20, y: y + 10 }, end: { x: ANCHO - M, y: y + 10 }, thickness: 0.6, color: gris });
    texto('Total sin IVA', COL.p - 20, y, 10); derecha(Material.euros(t.sinIva), COL.i + 66, y, 10); y -= SALTO;
    texto('IVA (21 %)', COL.p - 20, y, 10); derecha(Material.euros(t.iva), COL.i + 66, y, 10); y -= SALTO;
    texto('Total con IVA', COL.p - 20, y, 10.5, negrita); derecha(Material.euros(t.conIva), COL.i + 66, y, 10.5, negrita);

    var paginas = doc.getPages();
    paginas.forEach(function (p, i) {
      pagina = p;
      var num = 'Página ' + (i + 1) + ' de ' + paginas.length;
      texto(num, ANCHO - M - normal.widthOfTextAtSize(num, 8), 28, 8, normal, gris);
    });
    doc.setTitle(limpio('Pedido a ' + d.proveedor));
    return doc.save();
  }

  /* ---------- el asunto ---------- */

  async function asegurarTipoDeDocumento() {
    if (!window.App || !App.E || !Array.isArray(App.E.tiposDocumento)) return;
    if (App.E.tiposDocumento.indexOf(TIPO_DOCUMENTO) === -1) {
      if (window.Borrados && Borrados.revivir) await Borrados.revivir(App.E.gestor, 'tiposDocumento', TIPO_DOCUMENTO);
      App.E.tiposDocumento.push(TIPO_DOCUMENTO);
      await App.guardarTiposDocumento();
    }
  }

  /* Crea el asunto COMPRA y su documento de pedido para un proveedor. `grupo` = { proveedor, lineas, persona? }.
     Devuelve { nombre, numero, doc }. Lanza si no se puede crear el asunto; si solo falla el documento, el
     asunto se queda sin él y `doc` va vacío con `falloDoc`. */
  async function crear(grupo) {
    var tipo = ((window.App && App.E && App.E.tipos) || []).filter(function (t) { return t.tipo === TIPO_ASUNTO; })[0];
    if (!tipo) throw new Error('No existe el tipo de asunto ' + TIPO_ASUNTO + '. Créalo en Ajustes › Tipos de asunto.');
    var hoy = U.hoyIso();
    var persona = grupo.persona || null;
    var tercero = Nombres.terceroEmpresa({ nombre: grupo.proveedor, nif: persona && persona.nif });
    var categoria = tipo.categoria || 'EMPRESAS';

    var numero = (await Numeros.reservar('asuntos', '')).numero;
    var nombre = Nombres.montarAsunto({
      fecha: hoy, tipo: Nombres.tipoParaCarpeta(tipo), categoria: categoria,
      curso: '', grupo: '', campos: [], descripcion: '', tercero: tercero, numero: numero
    }).nombre;
    if (!nombre) throw new Error('el nombre del asunto sale vacío');
    if (await Carpetas.existe(App.E.abiertos, nombre)) throw new Error('ya hay un asunto abierto con el nombre ' + nombre);
    var carpeta = await Carpetas.crear(App.E.abiertos, nombre);

    var doc = '', falloDoc = null;
    try {
      var centro = '';
      try { centro = (await Plantillas.valoresDeAsunto({ nombre: nombre, handle: carpeta }, { fecha: hoy, conLoQueFalta: false })).centro || ''; } catch (e0) { centro = ''; }
      var bytes = await pdfDe({ centro: centro, proveedor: grupo.proveedor, fecha: hoy, numero: numero, lineas: grupo.lineas });
      await asegurarTipoDeDocumento();
      var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
      doc = Nombres.montarDocumento({ fecha: hoy, tipo: TIPO_DOCUMENTO, extension: 'pdf', numeroDoc: numeroDoc });
      await Carpetas.escribirBytes(carpeta, doc, bytes, 'application/pdf');
      try { await DocumentosDatos.anotar(nombre, numeroDoc, { tipo: TIPO_DOCUMENTO, fecha: hoy, registros: [], campos: [], texto: '' }); }
      catch (e1) { U.accesorio('El pedido está guardado, pero no he podido apuntar sus datos en la ficha', e1); }
    } catch (e2) { doc = ''; falloDoc = e2; }

    var ficha = {
      estado: 'abierto', tipo: TIPO_ASUNTO, categoria: categoria, tercero: tercero,
      curso: U.cursoDeFecha(hoy), grupo: '', descripcion: '', numero: numero, via: '', viaDato: '',
      abiertoEl: U.ahora(), abiertoPor: App.E.usuario,
      pedido: { proveedor: grupo.proveedor, fecha: hoy, doc: doc, sinIva: totalesDe(grupo.lineas).sinIva, lineas: grupo.lineas.map(function (l) {
        return { a: l.a, n: l.n, u: l.u, c: l.c, i: l.i, para: l.para || '' };
      }) }
    };
    if (persona && window.Datos && Datos.fotoDeContacto) { try { ficha.contacto = Datos.fotoDeContacto(persona, categoria); } catch (e3) { /* sin foto del contacto */ } }
    await App.anotar(nombre, ficha);
    if (window.RegistroAsunto) { try { await RegistroAsunto.auto({ nombre: nombre }, 'Asunto creado desde «Material» · pedido a ' + grupo.proveedor); } catch (e4) { /* accesorio */ } }
    return { nombre: nombre, numero: numero, doc: doc, falloDoc: falloDoc };
  }

  Material.PedidoCrear = { crear: crear, pdfDe: pdfDe, totalesDe: totalesDe, TIPO_ASUNTO: TIPO_ASUNTO, TIPO_DOCUMENTO: TIPO_DOCUMENTO };
})();
