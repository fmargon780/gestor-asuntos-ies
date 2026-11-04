/* ============================================================
   texto-condicional.js — los «textos condicionales» de las plantillas
   (fila 510, docs/510-PARRAFOS-SEGUN-EL-ASUNTO.md).

   Un párrafo de una plantilla de Word o de correo puede llevar delante una
   marca `{si:Campo=Valor}`. «Campo» es un campo de lista del tipo de asunto
   y «Valor» una de sus opciones. Al generar el documento o el correo la
   marca NUNCA sale: el párrafo sale si el campo del asunto tiene ese valor
   y desaparece entero si tiene otro. Si el campo está vacío (o la marca
   nombra un campo o un valor que el tipo no tiene), el párrafo sale con
   «[falta: Campo]» delante —en amarillo en el Word— y el campo entra en
   `faltan`, como un campo variable sin rellenar.

   Pura (sin pantalla): la usan js/plantillas.js (correos: párrafos
   separados por una línea en blanco), js/docx.js (Word: un `<w:p>`),
   js/word-faltan.js (el desplegable de «Faltan datos») y los cuadros de
   js/texto-condicional-cuadro.js.

   Lo que necesita de `valores` (js/plantillas-valores.js): `campos` (nombre
   -> valor del asunto), `camposLista` (nombre -> opciones, solo los campos
   de lista del tipo) y, opcional, `aMano` (lo escrito en «Faltan datos»).
   Sin `camposLista` (un texto suelto, una vista previa) solo se mira
   `campos`.
   ============================================================ */
var TextoCondicional = (function () {

  /* Al principio del párrafo: {si:Campo=Valor}, con espacios sueltos alrededor. */
  var RE_MARCA = /^\s*\{si:\s*([^=}]*?)\s*=\s*([^}]*?)\s*\}[ \t]*/i;
  var RE_SEPARADOR = /(\r?\n[ \t]*\r?\n\s*)/;

  /* Las opciones de los campos que han salido en `faltan`, para el desplegable de «Faltan datos». */
  var opcionesPendientes = {};

  function igual(a, b) { return U.normalizar(String(a === undefined || a === null ? '' : a).trim()) === U.normalizar(String(b === undefined || b === null ? '' : b).trim()); }

  /* { campo, valor, largo } de la marca que abre `texto`, o null. */
  function leerMarca(texto) {
    var m = RE_MARCA.exec(String(texto || ''));
    return m ? { campo: m[1], valor: m[2], largo: m[0].length } : null;
  }

  function marcaEscrita(campo, valor) { return '{si:' + campo + '=' + valor + '}'; }

  /* ---------- los campos de lista de un tipo ---------- */

  /* [{ nombre, valores }] de los campos de lista del tipo `tipo`. Con `ficha`, también los «solo aquí» de ese asunto. */
  function camposDeLista(tipo, ficha) {
    if (!window.Campos || !window.App || !App.E || !App.E.campos) return [];
    var config = (App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    var lista = ficha ? Campos.camposDeAsunto(config, ficha) : config;
    var salida = [];
    lista.forEach(function (cfg) {
      if (!cfg || cfg.origen !== 'propio') return;
      var p = Campos.propioDe(cfg.id, App.E.campos);
      if (!p || p.clase !== 'lista') return;
      salida.push({ nombre: p.nombre, valores: (p.valores || []).slice() });
    });
    return salida;
  }

  /* Lo mismo, como objeto nombre -> opciones (es `valores.camposLista`). */
  function listasPorNombre(tipo, ficha) {
    var salida = {};
    camposDeLista(tipo, ficha).forEach(function (c) { salida[c.nombre] = c.valores; });
    return salida;
  }

  /* ---------- decidir ---------- */

  function buscarClave(objeto, nombre) {
    var n = U.normalizar(nombre);
    return Object.keys(objeto || {}).filter(function (k) { return U.normalizar(k) === n; })[0];
  }

  function faltaDe(nombre, opciones) {
    if (opciones && opciones.length) opcionesPendientes[nombre] = opciones.slice();
    return { estado: 'falta', nombre: nombre };
  }

  /* 'sale' | 'quita' | 'falta' (con `nombre`, el que va en `faltan`). */
  function decidir(marca, valores) {
    valores = valores || {};
    var nombre = marca.campo, opciones = null;
    if (valores.camposLista) {
      var k = buscarClave(valores.camposLista, marca.campo);
      if (k === undefined) return faltaDe(nombre, null);
      nombre = k;
      opciones = valores.camposLista[k] || [];
      if (!opciones.some(function (o) { return igual(o, marca.valor); })) return faltaDe(nombre, opciones);
    }
    var aMano = valores.aMano || {}, valor = '';
    [nombre, marca.campo].forEach(function (c) {
      if (!valor && Object.prototype.hasOwnProperty.call(aMano, c) && String(aMano[c]).trim()) valor = String(aMano[c]).trim();
    });
    if (!valor) { var kc = buscarClave(valores.campos, nombre); valor = kc === undefined ? '' : String(valores.campos[kc] || '').trim(); }
    if (!valor) return faltaDe(nombre, opciones);
    return { estado: igual(valor, marca.valor) ? 'sale' : 'quita' };
  }

  function opcionesDeFalta(nombre) { return opcionesPendientes[nombre] || null; }

  /* ---------- correos: párrafos separados por una línea en blanco ---------- */

  function procesarCorreo(texto, valores, faltan) {
    texto = String(texto === undefined || texto === null ? '' : texto);
    if (texto.indexOf('{si:') === -1 && !/\{\s*si\s*:/i.test(texto)) return texto;
    var partes = texto.split(RE_SEPARADOR), parrafos = [];
    for (var i = 0; i < partes.length; i += 2) parrafos.push({ texto: partes[i], sep: partes[i + 1] || '' });
    var quedan = [];
    parrafos.forEach(function (p) {
      var m = leerMarca(p.texto);
      if (!m) { quedan.push(p); return; }
      var d = decidir(m, valores), resto = p.texto.slice(m.largo);
      if (d.estado === 'quita') return;
      if (d.estado === 'falta') { if (faltan) faltan.push(d.nombre); resto = '[falta: ' + d.nombre + '] ' + resto; }
      quedan.push({ texto: resto, sep: p.sep });
    });
    return quedan.map(function (p, i) { return p.texto + (i < quedan.length - 1 ? p.sep : ''); }).join('');
  }

  /* ---------- Word: un párrafo, ya con sus trozos de texto ---------- */

  /* `segmentos`: los `<w:t>` del párrafo ({ texto } con entidades XML). Quita la marca del principio. Devuelve null (sin
     marca), 'quita' (el párrafo no sale), 'sale' o 'falta' (con «[falta: Campo] » delante del texto). */
  function aplicarASegmentos(segmentos, valores, faltan, decodificar, codificar) {
    var textos = segmentos.map(function (s) { return decodificar(s.texto); });
    var m = leerMarca(textos.join(''));
    if (!m) return null;
    var d = decidir(m, valores);
    if (d.estado === 'quita') return 'quita';
    var resto = m.largo;
    for (var i = 0; i < textos.length && resto > 0; i++) {
      var quitar = Math.min(resto, textos[i].length);
      textos[i] = textos[i].slice(quitar);
      resto -= quitar;
    }
    if (d.estado === 'falta') {
      if (faltan) faltan.push(d.nombre);
      if (textos.length) textos[0] = '[falta: ' + d.nombre + '] ' + textos[0];
    }
    textos.forEach(function (t, j) { segmentos[j].texto = codificar(t); });
    return d.estado;
  }

  /* Todo el texto de un `<w:p>` en amarillo (los párrafos con «[falta: …]»). */
  function resaltarParrafoXml(xml) {
    return String(xml).replace(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, function (run) {
      if (run.indexOf('<w:highlight') !== -1) return run;
      if (/<w:rPr>[\s\S]*?<\/w:rPr>/.test(run)) return run.replace('</w:rPr>', '<w:highlight w:val="yellow"/></w:rPr>');
      return run.replace(/^(<w:r\b[^>]*>)/, '$1<w:rPr><w:highlight w:val="yellow"/></w:rPr>');
    });
  }

  /* ---------- poner la marca en un texto (el cuadro «Texto condicional») ---------- */

  /* El párrafo de `texto` donde está el cursor (`posicion`): [inicio, fin). Si el cursor está en una línea en blanco,
     el párrafo de encima. Sin párrafos, null. */
  function parrafoEn(texto, posicion) {
    var t = String(texto || ''), re = /\r?\n[ \t]*\r?\n\s*/g, m, ini = 0, spans = [];
    while ((m = re.exec(t))) { spans.push([ini, m.index]); ini = m.index + m[0].length; }
    spans.push([ini, t.length]);
    var elegido = spans[0];
    spans.forEach(function (s) { if (s[0] <= posicion) elegido = s; });   /* el último que empieza antes del cursor */
    return elegido;
  }

  /* Pone (o cambia) la marca al principio del párrafo de `texto` donde está el cursor. { texto, cursor }. */
  function ponerEnTexto(texto, posicion, campo, valor) {
    var t = String(texto || ''), pos = typeof posicion === 'number' ? posicion : t.length;
    var span = parrafoEn(t, pos) || [0, t.length];
    var antes = t.slice(0, span[0]), parrafo = t.slice(span[0], span[1]), despues = t.slice(span[1]);
    var previa = leerMarca(parrafo);
    if (previa) parrafo = parrafo.slice(previa.largo);
    var marca = marcaEscrita(campo, valor) + ' ';
    return { texto: antes + marca + parrafo + despues, cursor: antes.length + marca.length };
  }

  /* Lo que se dice al poner la marca. */
  function avisoDeMarca(campo, valor) {
    return 'Marca puesta: el párrafo solo saldrá si «' + campo + '» es «' + valor + '».';
  }

  return {
    RE_MARCA: RE_MARCA, leerMarca: leerMarca, marcaEscrita: marcaEscrita, igual: igual,
    camposDeLista: camposDeLista, listasPorNombre: listasPorNombre,
    decidir: decidir, opcionesDeFalta: opcionesDeFalta,
    procesarCorreo: procesarCorreo, aplicarASegmentos: aplicarASegmentos, resaltarParrafoXml: resaltarParrafoXml,
    parrafoEn: parrafoEn, ponerEnTexto: ponerEnTexto, avisoDeMarca: avisoDeMarca
  };
})();
window.TextoCondicional = TextoCondicional;
