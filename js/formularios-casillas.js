/* ============================================================
   formularios-casillas.js — las casillas de un impreso oficial, con
   nombres que se entienden (fila 146, 25-sep-2026,
   docs/IMPRESOS-CASILLAS-LEGIBLES.md).

   Un impreso de la Junta es un formulario XFA con copia AcroForm, y sus
   casillas se llaman por dentro
   `form1[0].#pageSet[0].Página_2[0].CABECERA[0].datos[0].apellido1encab[0]`.
   Aquí, sin efectos (se prueban sin navegador):

   - nombreLegible(nombre) → { pagina, texto }: «Página 2 · Primer apellido».
   - esDePersona(nombre): la regla que manda de la fila 84 es que los
     datos de la persona NUNCA se rellenan; js/formularios-rellenar.js no
     propone nada para una casilla de persona.
   - clasificarCasilla(nombre, mapaGuardado, hueco) → 'centro' | 'persona' | 'otra'.
   - agrupar(nombres): las que dan el mismo texto (la cabecera repetida en
     cada página), en una sola fila.

   Y, con pdf-lib y pdf.js, dónde está cada casilla en el papel
   (`posicionesDe`) y su miniatura (`pintarMiniatura`), para la pantalla de
   Ajustes (js/formularios-ajustes.js).
   ============================================================ */
var FormulariosCasillas = (function () {

  /* Sufijos de maquetación que no dicen nada. */
  var SUFIJOS = ['encab', 'enca', 'enc', 'cab', 'txt', 'campo', 'field', 'datos'];
  var PEGADOS = ['encab', 'enca', 'enc'];   /* pegados al final: «apellido2enca», «nombreenc» */

  /* Palabras conocidas (sin tildes → como se escriben). */
  var PALABRAS = {
    dni: 'DNI', nif: 'NIF', nie: 'NIE', cp: 'código postal', tfno: 'teléfono', telf: 'teléfono', tlf: 'teléfono',
    telefono: 'teléfono', num: 'número', numero: 'número', n: 'número', inscripcion: 'inscripción',
    codigo: 'código', direccion: 'dirección', poblacion: 'población', pais: 'país', electronico: 'electrónico',
    academico: 'académico', ano: 'año', nac: 'nacimiento', movil: 'móvil', relacion: 'relación'
  };

  function sinTildes(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function ultimoTramo(nombre) {
    var partes = String(nombre || '').split('.').filter(function (p) { return p.replace(/\[\d+\]/g, '').trim(); });
    return (partes.length ? partes[partes.length - 1] : String(nombre || '')).replace(/\[\d+\]/g, '').replace(/^#/, '');
  }

  function trozos(tramo) {
    var t = String(tramo || '')
      .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
      .replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])(\d)/g, '$1 $2')
      .replace(/(\d)([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, '$1 $2');
    return sinTildes(t).split(/[\s_\-.\/]+/).filter(Boolean);
  }

  function limpiarSufijos(lista) {
    var salida = [];
    lista.forEach(function (w) {
      if (SUFIJOS.indexOf(w) !== -1 && lista.length > 1) return;
      for (var i = 0; i < PEGADOS.length; i++) {
        var s = PEGADOS[i];
        if (w.length > s.length + 2 && w.slice(-s.length) === s) { w = w.slice(0, -s.length); break; }
      }
      salida.push(w);
    });
    return salida.length ? salida : lista;
  }

  function paginaDe(nombre) {
    var m = String(nombre || '').match(/(?:p[aá]gina|page)[_\s]*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function nombreLegible(nombre) {
    var palabras = limpiarSufijos(trozos(ultimoTramo(nombre)));
    var texto = palabras.join(' ')
      .replace(/\bapellido 1\b/, 'primer apellido').replace(/\bapellido 2\b/, 'segundo apellido');
    texto = texto.split(' ').map(function (w) { return PALABRAS.hasOwnProperty(w) ? PALABRAS[w] : w; }).join(' ');
    texto = texto.charAt(0).toUpperCase() + texto.slice(1);
    return { pagina: paginaDe(nombre), texto: texto };
  }

  function textoConPagina(l) { return (l.pagina ? 'Página ' + l.pagina + ' · ' : '') + l.texto; }

  /* ---------- de quién es la casilla ---------- */

  var LARGAS = ['apellido', 'nombre', 'pasaporte', 'domicilio', 'direccion', 'telefono', 'movil', 'correo', 'email',
    'firma', 'nacimiento', 'sexo', 'nacionalidad', 'tutor', 'padre', 'madre', 'progenitor', 'alumn', 'solicitante',
    'representante', 'hermano', 'codigo postal', 'guardador', 'parentesco'];
  var CORTAS = ['dni', 'nif', 'nie', 'cp', 'nac', 'tfno', 'telf'];
  var CONTEXTO = ['solicitante', 'alumn', 'domicilio', 'tutor', 'representante', 'guardador', 'progenitor', 'padre', 'madre', 'hermano'];

  function esDePersona(nombre) {
    var todo = trozos(String(nombre || '').replace(/\[\d+\]/g, ' ')).join(' ');
    /* El centro de donde viene la persona es suyo, no el nuestro. */
    if (/centro ?(actual|de procedencia|procedencia|origen|anterior)/.test(todo)) return true;
    if (/centro/.test(todo)) return false;
    var tramo = trozos(ultimoTramo(nombre));
    var texto = ' ' + tramo.join(' ') + ' ' + tramo.join('') + ' ';
    if (LARGAS.some(function (w) { return texto.indexOf(w) !== -1; })) return true;
    if (CORTAS.some(function (w) { return tramo.indexOf(w) !== -1; })) return true;
    var partes = String(nombre || '').split('.');
    var padres = trozos(partes.slice(0, -1).join(' ').replace(/\[\d+\]/g, ' ')).join(' ');
    return CONTEXTO.some(function (w) { return padres.indexOf(w) !== -1; });
  }

  /* `hueco`: el que propondría js/formularios-rellenar.js (o nada). */
  function clasificarCasilla(nombre, mapaGuardado, hueco) {
    if (mapaGuardado && mapaGuardado[nombre]) return 'centro';
    if (esDePersona(nombre)) return 'persona';
    if (hueco === undefined && window.FormulariosRellenar && FormulariosRellenar.huecoPropuestoDe) hueco = FormulariosRellenar.huecoPropuestoDe(nombre);
    return hueco ? 'centro' : 'otra';
  }

  /* Las que dan el mismo texto, en una fila: [{ texto, nombres, paginas, etiqueta }]. */
  function agrupar(nombres) {
    var orden = [], por = {};
    (nombres || []).forEach(function (n) {
      var l = nombreLegible(n);
      var k = sinTildes(l.texto);
      if (!por[k]) { por[k] = { texto: l.texto, nombres: [], paginas: [] }; orden.push(k); }
      por[k].nombres.push(n);
      if (l.pagina && por[k].paginas.indexOf(l.pagina) === -1) por[k].paginas.push(l.pagina);
    });
    return orden.map(function (k) {
      var g = por[k];
      g.etiqueta = g.nombres.length > 1 ? g.texto + ' (en ' + g.nombres.length + ' páginas)'
        : textoConPagina({ pagina: g.paginas[0] || null, texto: g.texto });
      return g;
    });
  }

  /* ---------- dónde está en el papel ---------- */

  /* { nombre: { pagina (desde 0), x, y, ancho, alto } } con pdf-lib. */
  async function posicionesDe(bytesPdf) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var salida = {};
    var doc;
    try { doc = await PDFLib.PDFDocument.load(bytesPdf); } catch (e) { return salida; }
    var paginas = doc.getPages();
    var campos;
    try { campos = doc.getForm().getFields(); } catch (e) { return salida; }
    campos.forEach(function (c) {
      try {
        var w = c.acroField.getWidgets()[0];
        if (!w) return;
        var r = w.getRectangle();
        var ref = w.P && w.P();
        var i = -1;
        for (var k = 0; ref && k < paginas.length; k++) if (paginas[k].ref === ref) { i = k; break; }
        if (i === -1) { var p = paginaDe(c.getName()); i = p ? p - 1 : -1; }
        if (i < 0 || i >= paginas.length) return;
        salida[c.getName()] = { pagina: i, x: r.x, y: r.y, ancho: r.width, alto: r.height };
      } catch (e) { /* sin sitio: sin miniatura */ }
    });
    return salida;
  }

  /* Pinta la página de la casilla en `caja`, con la casilla recuadrada. */
  async function pintarMiniatura(caja, bytesPdf, pos) {
    if (!caja || !pos || !App.cargarPdfJs) return false;
    var pdfjs = await App.cargarPdfJs();
    var doc = await pdfjs.getDocument({ data: new Uint8Array(bytesPdf).slice() }).promise;
    var pagina = await doc.getPage(pos.pagina + 1);
    var base = pagina.getViewport({ scale: 1 });
    var vp = pagina.getViewport({ scale: 700 / base.width });
    var canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    var ctx = canvas.getContext('2d');
    await pagina.render({ canvasContext: ctx, viewport: vp }).promise;
    var r = vp.convertToViewportRectangle([pos.x, pos.y, pos.x + pos.ancho, pos.y + pos.alto]);
    ctx.strokeStyle = '#e0457b';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(224, 69, 123, .18)';
    var x = Math.min(r[0], r[2]), y = Math.min(r[1], r[3]), an = Math.abs(r[2] - r[0]), al = Math.abs(r[3] - r[1]);
    ctx.fillRect(x - 3, y - 3, an + 6, al + 6);
    ctx.strokeRect(x - 3, y - 3, an + 6, al + 6);
    caja.innerHTML = '';
    caja.appendChild(canvas);
    return true;
  }

  /* El nombre propio de la casilla (su último tramo), sin tildes ni
     mayúsculas: lo que mira la propuesta automática. */
  function palabrasDe(nombre) { return trozos(ultimoTramo(nombre)).join(' '); }

  return {
    nombreLegible: nombreLegible, palabrasDe: palabrasDe, textoConPagina: textoConPagina, esDePersona: esDePersona,
    clasificarCasilla: clasificarCasilla, agrupar: agrupar, posicionesDe: posicionesDe, pintarMiniatura: pintarMiniatura
  };
})();
if (typeof window !== 'undefined') window.FormulariosCasillas = FormulariosCasillas;
