/* ============================================================
   candidaturas-papeletas.js — las papeletas de las elecciones al Consejo Escolar
   (9-nov-2026, fila 571, docs/571-PAPELETAS-CONSEJO-ESCOLAR.md; pantalla de prueba docs/pantallas/570.html).

   «Papeletas» de la tarjeta «Candidaturas» abre una ventana con una fila por sector (admitidas, cruces que se
   pueden marcar —ya puestas por la norma— y cuántas papeletas hacen falta). Sale un PDF por sector, guardado en
   el asunto como documento propio (tipo PAPELETAS), con solo las candidaturas admitidas, numeradas y por
   apellidos. Hojas A4: hasta 8 admitidas, 10 papeletas por hoja (2 × 5); con más, 8 (2 × 4) y letra mayor.
   Solo nombre y apellidos (nunca el DNI ni el número escolar). El PDF se hace con pdf-lib, como
   js/candidaturas-lista.js, de donde se toma `limpio` y el guardado. Se carga después de ese fichero.

   Cruces (Decreto 327/2010, art. 50, 53.4 y 58.6): 12 unidades o más, 5 · 5 · 8 · 1; con menos, 3 · 4 · 6 · 1.
   Si la AMPA ha designado representante, madres y padres eligen uno menos (Orden de 7-oct-2010, art. 5).
   «Es de la AMPA» (en el ⋮ de js/candidaturas-ficha.js) apunta `ampa` en la candidatura: sale a la derecha del nombre.
   ============================================================ */
var CandidaturasPapeletas = (function () {

  var TIPO_DOCUMENTO = 'PAPELETAS';
  var CORTO = 'PAPELETAS';
  var PUESTOS = {
    grande: { 'Alumnado': 5, 'Madres y padres': 5, 'Profesorado': 8, 'PAS': 1 },
    pequeno: { 'Alumnado': 3, 'Madres y padres': 4, 'Profesorado': 6, 'PAS': 1 }
  };
  var MAXIMO = 5000;
  var recordado = {};   /* lo escrito la última vez, por asunto, mientras la ficha siga abierta */

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(String(v === undefined || v === null ? '' : v)); }

  /* ---------- lo que sale (puro) ---------- */

  function crucesDe(sector, unidades, designada) {
    var t = (unidades === 0 || unidades >= 12) ? PUESTOS.grande : PUESTOS.pequeno;   /* sin listado, se toman 12 o más */
    return Math.max(1, t[sector] - (sector === 'Madres y padres' && designada ? 1 : 0));
  }

  function textoMarca(n) { return 'Marca hasta ' + n + ' ' + (n === 1 ? 'cruz' : 'cruces'); }

  /* Las admitidas de un sector, por apellidos. `grupos`: { clave: unidad } del alumnado. */
  function admitidasDe(cands, sector, grupos) {
    return Candidaturas.porSector(cands, sector).filter(function (c) { return c.estado === 'Admitida'; }).map(function (c) {
      var derecha = sector === 'Alumnado' ? ((grupos || {})[(c.persona || {}).clave] || '') : (sector === 'Madres y padres' ? (c.ampa || '') : '');
      return { nombre: Candidaturas.visible(c.persona), derecha: derecha };
    });
  }

  /* 10 papeletas por hoja (2 × 5) hasta 8 candidatos; con más, 8 (2 × 4). */
  function porHoja(candidatos) { return candidatos > 8 ? 8 : 10; }

  /* ---------- el PDF ---------- */

  /* `d` = { centro, curso, sector, cruces, papeletas, candidatos: [{ nombre, derecha }] }. Devuelve los bytes. */
  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var limpio = CandidaturasLista.limpio;
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var negro = PDFLib.rgb(0, 0, 0), gris = PDFLib.rgb(0.45, 0.45, 0.45);
    var ANCHO = 595.28, ALTO = 841.89, MX = 20, MY = 20, COLS = 2, RELLENO = 7;
    var n = d.candidatos.length, hoja = porHoja(n), filas = hoja / COLS;
    var celdaW = (ANCHO - 2 * MX) / COLS, celdaH = (ALTO - 2 * MY) / filas;
    var tam = n > 8 ? 10.5 : 9;

    function centrado(p, t, x, w, y, tamano, f) {
      var s = limpio(t), ancho = f.widthOfTextAtSize(s, tamano);
      p.drawText(s, { x: x + (w - ancho) / 2, y: y, size: tamano, font: f, color: negro });
    }
    function recortado(t, f, tamano, max) {
      var s = limpio(t);
      while (s.length > 1 && f.widthOfTextAtSize(s, tamano) > max) s = s.slice(0, -2) + '…';
      return s;
    }

    function dibujar(p, x, y0) {   /* una papeleta con su esquina inferior izquierda en (x, y0) */
      p.drawRectangle({ x: x, y: y0, width: celdaW, height: celdaH, borderColor: gris, borderWidth: 0.6, borderDashArray: [3, 3] });
      var y = y0 + celdaH - RELLENO - tam;
      centrado(p, 'Elecciones al Consejo Escolar ' + d.curso, x, celdaW, y, tam, negrita); y -= tam * 1.3;
      centrado(p, (d.centro ? d.centro + ' · ' : '') + 'Sector ' + d.sector, x, celdaW, y, tam - 0.5, normal); y -= tam * 1.5;
      p.drawText(limpio(textoMarca(d.cruces)), { x: x + RELLENO, y: y, size: tam - 0.5, font: negrita, color: negro });
      y -= tam * 0.6;
      var libre = y - (y0 + RELLENO), paso = Math.min(tam * 1.7, libre / n), letra = Math.max(6, Math.min(tam, paso / 1.3));
      var caja = Math.min(letra, paso - 2);
      d.candidatos.forEach(function (c, i) {
        var yy = y - paso * (i + 1) + (paso - letra) / 2 + letra * 0.12;
        var derecha = c.derecha ? limpio(c.derecha) : '';
        var anchoDerecha = derecha ? normal.widthOfTextAtSize(derecha, letra) + 6 : 0;
        p.drawRectangle({ x: x + RELLENO, y: yy - 1, width: caja, height: caja, borderColor: negro, borderWidth: 0.7 });
        p.drawText(String(i + 1), { x: x + RELLENO + caja + 5, y: yy, size: letra, font: normal, color: negro });
        var xNombre = x + RELLENO + caja + 5 + letra * 1.6 + 4;
        p.drawText(recortado(c.nombre, normal, letra, celdaW - RELLENO - (xNombre - x) - anchoDerecha), { x: xNombre, y: yy, size: letra, font: normal, color: negro });
        if (derecha) p.drawText(derecha, { x: x + celdaW - RELLENO - anchoDerecha + 6, y: yy, size: letra, font: normal, color: negro });
      });
    }

    for (var hechas = 0; hechas < d.papeletas; hechas += hoja) {
      var pagina = doc.addPage([ANCHO, ALTO]);
      var enHoja = Math.min(hoja, d.papeletas - hechas);
      for (var k = 0; k < enHoja; k++) {
        dibujar(pagina, MX + (k % COLS) * celdaW, ALTO - MY - (Math.floor(k / COLS) + 1) * celdaH);
      }
    }
    doc.setTitle(limpio('Papeletas · Sector ' + d.sector));
    return doc.save();
  }

  /* ---------- datos del centro ---------- */

  /* { unidades, grupos: { clave: unidad } } del listado del alumnado. Sin listado: 0 unidades. */
  async function delAlumnado() {
    var salida = { unidades: 0, grupos: {} };
    try {
      var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
      salida.unidades = Datos.unidadesDistintas(fuente.lista).length;
      fuente.lista.forEach(function (p) {
        if (p.matriculado && p.unidad) salida.grupos[Candidaturas.claveDe(p)] = p.unidad;
      });
    } catch (e) { /* sin listado, sin grupos */ }
    return salida;
  }

  function cursoLargo() {
    var p = String(U.cursoActual() || '').split('-');
    return p.length === 2 ? '20' + p[0] + '-20' + p[1] : String(U.cursoActual() || '');
  }

  /* ---------- la ventana ---------- */

  function filasHtml(cands, unidades, grupos, previo) {
    return Candidaturas.SECTORES.map(function (s, i) {
      var n = admitidasDe(cands, s, grupos).length;
      return '<tr data-sector="' + esc(s) + '"><td>' + esc(s) + '</td>' +
        '<td class="pap-num">' + n + (n ? '' : ' <span class="suave">· sin admitidas</span>') + '</td>' +
        '<td class="pap-num" id="pap-cruces-' + i + '">' + crucesDe(s, unidades, !!previo.designada) + '</td>' +
        '<td><input id="pap-n-' + i + '" class="campo pap-papeletas" type="number" min="0" max="' + MAXIMO + '" inputmode="numeric" value="' +
          esc((previo.papeletas || {})[s] || '') + '"' + (n ? '' : ' disabled') + ' aria-label="Papeletas de ' + esc(s) + '"></td></tr>';
    }).join('');
  }

  /* Pregunta qué sacar. → { designada, pedido: [{ sector, cruces, papeletas }] } o null si cancela. */
  async function preguntar(a, cands, unidades, grupos) {
    var previo = recordado[a.nombre] || { designada: false, papeletas: {} };
    var cuerpo = '<p>Salen solo las candidaturas admitidas, en un PDF por sector. Deja en blanco las papeletas del sector que no quieras sacar.</p>' +
      '<div class="pap-tabla"><table><thead><tr><th>Sector</th><th>Admitidas</th><th>Cruces que se pueden marcar</th><th>Papeletas</th></tr></thead><tbody>' +
      filasHtml(cands, unidades, grupos, previo) + '</tbody></table></div>' +
      '<p class="suave" id="pap-norma">Cruces: tantas como puestos a cubrir (Decreto 327/2010, art. 50, 53.4 y 58.6). ' +
      (unidades ? 'El centro tiene ' + unidades + ' unidades.' : 'No hay listado del alumnado: se toman 12 unidades o más.') + '</p>' +
      '<label class="interruptor"><input type="checkbox" id="pap-designada"' + (previo.designada ? ' checked' : '') + '>' +
      '<span>La AMPA ha designado representante (madres y padres eligen uno menos)</span></label>';
    var respuesta = U.preguntar('Papeletas', cuerpo, 'Sacar las papeletas');
    $('pap-designada').onchange = function () {
      var i = Candidaturas.SECTORES.indexOf('Madres y padres');
      $('pap-cruces-' + i).textContent = crucesDe('Madres y padres', unidades, this.checked);
    };
    var ok = await respuesta;
    var designada = $('pap-designada') ? $('pap-designada').checked : false;
    var pedido = [], escritas = {};
    Candidaturas.SECTORES.forEach(function (s, i) {
      var campo = $('pap-n-' + i);
      if (!campo) return;
      escritas[s] = campo.value;
      var n = Math.min(MAXIMO, parseInt(campo.value, 10) || 0);
      if (!campo.disabled && n > 0) pedido.push({ sector: s, cruces: crucesDe(s, unidades, designada), papeletas: n });
    });
    recordado[a.nombre] = { designada: designada, papeletas: escritas };
    return ok ? { designada: designada, pedido: pedido } : null;
  }

  /* ---------- guardar y enseñar ---------- */

  function abrirUno(a, guardados, i) {
    var barra = document.createElement('div');
    barra.className = 'pap-sectores';
    guardados.forEach(function (g, j) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton' + (j === i ? ' principal' : '');
      b.textContent = g.sector;
      b.onclick = function () { abrirUno(a, guardados, j); };
      barra.appendChild(b);
    });
    a.handle.getFileHandle(guardados[i].nombre).then(function (h) {
      if (window.Visor) Visor.abrir(h, guardados[i].nombre, { asunto: a, carpeta: a.handle, acciones: barra });
    }).catch(function (e) { U.accesorio('Las papeletas están guardadas, pero no he podido abrirlas', e); });
  }

  /* Pregunta qué sacar, hace un PDF por sector, los guarda en el asunto y los abre. */
  async function hacer(a) {
    var cands = Candidaturas.lista(a);
    var centro = await delAlumnado();
    var r = await preguntar(a, cands, centro.unidades, centro.grupos);
    if (!r) return;
    if (!r.pedido.length) { U.aviso('Escribe cuántas papeletas hacen falta en algún sector.', 'ambar'); return; }
    var fecha = U.hoyIso();
    try {
      var valores = {};
      try { valores = await Plantillas.valoresDeAsunto(a, { fecha: fecha, conLoQueFalta: false }); } catch (e1) { valores = {}; }
      var guardados = [];
      for (var i = 0; i < r.pedido.length; i++) {
        var p = r.pedido[i];
        var bytes = await pdfDe({
          centro: valores.centro || Plantillas.POR_DEFECTO_CENTRO, curso: cursoLargo(), sector: p.sector,
          cruces: p.cruces, papeletas: p.papeletas, candidatos: admitidasDe(cands, p.sector, centro.grupos)
        });
        var nombre = await CandidaturasLista.guardarPdf(a, bytes, fecha, TIPO_DOCUMENTO, CORTO);
        guardados.push({ sector: p.sector, nombre: nombre, papeletas: p.papeletas });
        if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Papeletas del sector ' + p.sector + ' (' + p.papeletas + ') «' + nombre + '»');
      }
      U.aviso('Papeletas guardadas en el asunto, una por sector:\n' + guardados.map(function (g) { return g.nombre + ' (' + g.sector + ')'; }).join('\n'), 'bueno');
      var caja = $('mensajes');
      if (caja && caja.lastElementChild) caja.lastElementChild.classList.add('mensaje-lineas');
      abrirUno(a, guardados, 0);
      if (window.CandidaturasFicha) CandidaturasFicha.repintar();
    } catch (e) { U.fallo('No he podido sacar las papeletas', e); }
  }

  return {
    hacer: hacer, olvidar: function () { recordado = {}; }, pdfDe: pdfDe, crucesDe: crucesDe, admitidasDe: admitidasDe, porHoja: porHoja, textoMarca: textoMarca,
    TIPO_DOCUMENTO: TIPO_DOCUMENTO
  };
})();
window.CandidaturasPapeletas = CandidaturasPapeletas;
