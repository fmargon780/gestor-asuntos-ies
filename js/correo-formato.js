/* ============================================================
   correo-formato.js — el formato del correo: negrita, cursiva, subrayado, listas y tablas
   (27-nov-2026, fila 772, docs/758-CORREOS-MAS-COMODOS.md, parte 2).

   Lo que no es pantalla: limpiar, pasar a texto sencillo, rellenar con los datos del asunto y preparar el correo que sale.
   El editor con su barra está en js/correo-formato-editor.js.

   Solo se admiten estas etiquetas (todo lo demás se limpia al pegar y al guardar; nunca entra `style`, `class`, `font`,
   `script` ni atributos `on…`): b, i, u, p, br, ul, ol, li, table, thead, tbody, tr, th, td.

       CorreoFormato.limpiar(html)           -> el mismo html, solo con lo admitido
       CorreoFormato.aTexto(html)            -> texto sencillo (cada fila de una tabla en una línea, casillas con « · »)
       CorreoFormato.deTexto(texto)          -> html (párrafos y saltos de línea)
       CorreoFormato.tieneFormato(html)      -> true si lleva algo más que párrafos y saltos de línea
       CorreoFormato.htmlDe(plantilla)       -> el html de una plantilla de correo (sin `html`, su `texto` pasado a html)
       CorreoFormato.rellenar(html, valores) -> { html, faltan }: las marcas {si:…} y los campos variables, con el valor escapado
       CorreoFormato.paraEnviar(html)        -> html con los estilos en línea (bordes de las tablas) que lleva el correo
       CorreoFormato.aBloques(html)          -> [{ tipo: 'p'|'lista'|'tabla', … }] con trozos { t, b, i, u } (para el PDF)
   ============================================================ */
var CorreoFormato = (function () {

  var BLOQUES = { P: 1, DIV: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, BLOCKQUOTE: 1, PRE: 1, SECTION: 1, ARTICLE: 1,
    HEADER: 1, FOOTER: 1, ADDRESS: 1, FIGURE: 1, CENTER: 1, DL: 1, DT: 1, DD: 1 };
  var SE_TIRAN = { SCRIPT: 1, STYLE: 1, HEAD: 1, TITLE: 1, META: 1, LINK: 1, TEMPLATE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, NOSCRIPT: 1,
    TEXTAREA: 1, SELECT: 1, SVG: 1, MATH: 1, IMG: 1, INPUT: 1, BUTTON: 1, CAPTION: 1, COLGROUP: 1, COL: 1 };

  function esTexto(n) { return n.nodeType === 3; }
  function esEl(n) { return n.nodeType === 1; }

  /* Lo que dice el estilo de un elemento pegado (Word, Google Docs): negrita, cursiva, subrayado. */
  function estiloDe(el, etiqueta) {
    var s = String(el.getAttribute && el.getAttribute('style') || '').toLowerCase();
    var peso = /font-weight\s*:\s*([a-z0-9]+)/.exec(s), cursiva = /font-style\s*:\s*(italic|oblique|normal)/.exec(s), sub = /text-decoration[a-z-]*\s*:[^;]*(underline|none)/.exec(s);
    var negrita = etiqueta === 'B' || etiqueta === 'STRONG', ital = etiqueta === 'I' || etiqueta === 'EM', subr = etiqueta === 'U';
    if (peso) negrita = peso[1] === 'bold' || peso[1] === 'bolder' || (/^\d+$/.test(peso[1]) && +peso[1] >= 600);
    if (cursiva) ital = cursiva[1] !== 'normal';
    if (sub) subr = sub[1] === 'underline';
    return { b: negrita, i: ital, u: subr };
  }

  /* Vuelca los hijos de `origen` en `destino` (un contenedor de bloques: cuerpo, casilla o elemento de lista).
     `estado.p`: el párrafo abierto, donde va lo que está en línea. */
  function volcar(origen, destino, estado) {
    Array.prototype.forEach.call(origen.childNodes, function (n) { uno(n, destino, estado); });
  }

  function lugarEnLinea(destino, estado) {
    if (destino.nodeName === 'LI') return destino;
    if (!estado.p) { estado.p = document.createElement('p'); destino.appendChild(estado.p); }
    return estado.p;
  }

  function cerrarParrafo(estado) { estado.p = null; }

  function uno(n, destino, estado) {
    if (esTexto(n)) {
      var t = n.data.replace(/[\s ]+/g, ' ');
      if (destino.nodeName !== 'LI' && !estado.p && !t.trim()) return;
      if (!estado.p && destino.nodeName !== 'LI') t = t.replace(/^ /, '');
      if (t) lugarEnLinea(destino, estado).appendChild(document.createTextNode(t));
      return;
    }
    if (!esEl(n)) return;
    var et = n.nodeName;
    if (SE_TIRAN[et]) return;
    if (et === 'BR') { lugarEnLinea(destino, estado).appendChild(document.createElement('br')); return; }
    if (et === 'UL' || et === 'OL') {
      cerrarParrafo(estado);
      var lista = document.createElement(et.toLowerCase());
      Array.prototype.forEach.call(n.childNodes, function (h) {
        if (!esEl(h) || h.nodeName !== 'LI') { if (esEl(h) && (h.nodeName === 'UL' || h.nodeName === 'OL')) { var li0 = document.createElement('li'); lista.appendChild(li0); uno(h, li0, { p: null }); } return; }
        var li = document.createElement('li');
        lista.appendChild(li);
        volcarEnLinea(h, li, { p: null });
      });
      if (lista.childNodes.length) destino.appendChild(lista);
      return;
    }
    if (et === 'LI') {   /* un elemento de lista suelto (pegado sin su lista): un párrafo */
      cerrarParrafo(estado);
      var suelto = document.createElement('p');
      destino.appendChild(suelto);
      volcarEnLinea(n, suelto, { p: null });
      return;
    }
    if (et === 'TABLE') { cerrarParrafo(estado); tabla(n, destino); return; }
    if (et === 'P' && /mso-list\s*:\s*(?!none)/i.test(n.getAttribute('style') || '')) {   /* un elemento de lista de Word: un párrafo con su marca escrita */
      var marca = n.querySelector('[style*="mso-list:Ignore" i], [style*="mso-list: Ignore" i]');
      var textoMarca = marca ? marca.textContent.replace(/[\s\u00a0]+/g, '') : '';
      if (marca) marca.parentNode.removeChild(marca);
      var clase = /^\(?(\d+|[a-zA-Z]{1,3})[.)]$/.test(textoMarca) ? 'ol' : 'ul';
      cerrarParrafo(estado);
      var ultima = destino.lastChild;
      if (!(ultima && ultima.nodeName.toLowerCase() === clase && ultima.deWord)) { ultima = document.createElement(clase); ultima.deWord = true; destino.appendChild(ultima); }
      var elemento = document.createElement('li');
      ultima.appendChild(elemento);
      volcarEnLinea(n, elemento, { p: null });
      return;
    }
    if (et === 'P' || BLOQUES[et]) {
      cerrarParrafo(estado);
      var interno = { p: null };
      if (et === 'P' || !tieneBloques(n)) {
        var p = document.createElement('p');
        volcarEnLinea(n, p, interno);
        if (p.childNodes.length || et === 'P' || n.querySelector('br')) destino.appendChild(p);
      } else volcar(n, destino, interno);
      cerrarParrafo(estado);
      return;
    }
    /* En línea (span, a, font, b, i, u, strong, em…): se conserva solo el formato. */
    if (!estado.p && destino.nodeName !== 'LI' && !n.textContent.trim() && !n.querySelector('br')) return;
    var f = estiloDe(n, et), donde = lugarEnLinea(destino, estado), actual = donde;
    ['b', 'i', 'u'].forEach(function (k) {
      if (!f[k]) return;
      var e = document.createElement(k);
      actual.appendChild(e);
      actual = e;
    });
    var hijoEstado = { p: actual, enLinea: true };
    Array.prototype.forEach.call(n.childNodes, function (h) { enLinea(h, actual, hijoEstado, destino); });
    if (actual !== donde && !actual.childNodes.length) actual.parentNode.removeChild(actual);
  }

  function tieneBloques(n) {
    return Array.prototype.some.call(n.querySelectorAll('p,div,ul,ol,table,li,h1,h2,h3,h4,h5,h6,blockquote'), function () { return true; });
  }

  /* Dentro de un párrafo (o de un elemento de lista): lo de en medio sigue en línea; un bloque de dentro es un salto. */
  function volcarEnLinea(origen, contenedor, estado) {
    estado.p = contenedor;
    Array.prototype.forEach.call(origen.childNodes, function (h) { enLinea(h, contenedor, estado, contenedor); });
    /* Un salto de línea al final no cuenta: lo quita. */
    while (contenedor.lastChild && contenedor.lastChild.nodeName === 'BR') contenedor.removeChild(contenedor.lastChild);
    var u = contenedor.lastChild;
    if (u && esTexto(u)) u.data = u.data.replace(/ +$/, '');
    var d = contenedor.firstChild;
    if (d && esTexto(d)) d.data = d.data.replace(/^ +/, '');
  }

  function enLinea(h, contenedor, estado, raiz) {
    if (esTexto(h)) {
      var t = h.data.replace(/[\s ]+/g, ' ');
      if (t) contenedor.appendChild(document.createTextNode(t));
      return;
    }
    if (!esEl(h) || SE_TIRAN[h.nodeName]) return;
    var et = h.nodeName;
    if (et === 'BR') { contenedor.appendChild(document.createElement('br')); return; }
    if (et === 'UL' || et === 'OL' || et === 'LI' || et === 'TABLE' || et === 'P' || BLOQUES[et]) {
      if (contenedor.childNodes.length && contenedor.lastChild.nodeName !== 'BR') contenedor.appendChild(document.createElement('br'));
      Array.prototype.forEach.call(h.childNodes, function (x) { enLinea(x, contenedor, estado, raiz); });
      if (contenedor.lastChild && contenedor.lastChild.nodeName !== 'BR') contenedor.appendChild(document.createElement('br'));
      return;
    }
    var f = estiloDe(h, et), actual = contenedor;
    ['b', 'i', 'u'].forEach(function (k) {
      if (!f[k] || (actual.nodeName.toLowerCase() === k)) return;
      var e = document.createElement(k);
      actual.appendChild(e);
      actual = e;
    });
    Array.prototype.forEach.call(h.childNodes, function (x) { enLinea(x, actual, estado, raiz); });
    if (actual !== contenedor && !actual.childNodes.length) actual.parentNode.removeChild(actual);
  }

  function tabla(origen, destino) {
    var t = document.createElement('table'), cuerpo = document.createElement('tbody'), cabecera = null;
    t.appendChild(cuerpo);
    Array.prototype.forEach.call(origen.querySelectorAll('tr'), function (fila) {
      if (fila.closest('table') !== origen) return;   /* las de una tabla de dentro no cuentan */
      var tr = document.createElement('tr');
      Array.prototype.forEach.call(fila.children, function (c) {
        if (c.nodeName !== 'TD' && c.nodeName !== 'TH') return;
        var td = document.createElement(c.nodeName.toLowerCase());
        var estado = { p: null };
        volcarCasilla(c, td, estado);
        tr.appendChild(td);
      });
      if (!tr.childNodes.length) return;
      var enCabecera = fila.parentNode && fila.parentNode.nodeName === 'THEAD';
      if (enCabecera) { if (!cabecera) { cabecera = document.createElement('thead'); t.insertBefore(cabecera, cuerpo); } cabecera.appendChild(tr); }
      else cuerpo.appendChild(tr);
    });
    if (!cuerpo.childNodes.length && !cabecera) return;
    if (!cuerpo.childNodes.length) t.removeChild(cuerpo);
    destino.appendChild(t);
  }

  /* Una casilla: si solo lleva texto en línea se queda así; con párrafos o listas, los conserva. */
  function volcarCasilla(c, td, estado) {
    if (!tieneBloques(c)) { volcarEnLinea(c, td, estado); return; }
    volcar(c, td, estado);
    if (td.childNodes.length === 1 && td.firstChild.nodeName === 'P') {   /* un solo párrafo: sin envoltorio */
      var p = td.firstChild;
      td.removeChild(p);
      while (p.firstChild) td.appendChild(p.firstChild);
    }
  }

  function aElemento(html) {
    var doc = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
    var cuerpo = document.createElement('div');
    volcar(doc.body, cuerpo, { p: null });
    /* Los párrafos del todo vacíos al principio y al final no cuentan. */
    function vacio(n) { return n && n.nodeName === 'P' && !n.textContent.trim() && !n.querySelector('br'); }
    while (vacio(cuerpo.firstChild)) cuerpo.removeChild(cuerpo.firstChild);
    while (vacio(cuerpo.lastChild)) cuerpo.removeChild(cuerpo.lastChild);
    Array.prototype.slice.call(cuerpo.querySelectorAll('p')).forEach(function (p) { if (!p.childNodes.length) p.innerHTML = '<br>'; });
    return cuerpo;
  }

  function limpiar(html) { return aElemento(html).innerHTML; }

  /* ---------- a texto sencillo ---------- */

  function textoEnLinea(n) {
    if (esTexto(n)) return n.data;
    if (!esEl(n)) return '';
    if (n.nodeName === 'BR') return '\n';
    return Array.prototype.map.call(n.childNodes, textoEnLinea).join('') + (n.nodeName === 'P' ? '\n' : '');   /* los párrafos de una casilla no se pegan */
  }

  function aTexto(html) {
    var cuerpo = aElemento(html), partes = [];
    function poner(t) { partes.push((partes.length ? '\n\n' : '') + t); }   /* un párrafo vacío (una línea en blanco) no cuenta en el texto sencillo */
    Array.prototype.forEach.call(cuerpo.childNodes, function (b) {
      if (b.nodeName === 'P') {
        var t = textoEnLinea(b).replace(/ *\n */g, '\n').trim();
        if (t) poner(t);
      } else if (b.nodeName === 'UL' || b.nodeName === 'OL') {
        poner(Array.prototype.map.call(b.children, function (li, i) {
          return (b.nodeName === 'OL' ? (i + 1) + '. ' : '- ') + textoEnLinea(li).replace(/ *\n */g, ' ').trim();
        }).join('\n'));
      } else if (b.nodeName === 'TABLE') {
        poner(Array.prototype.map.call(b.querySelectorAll('tr'), function (fila) {
          return Array.prototype.map.call(fila.children, function (c) { return textoEnLinea(c).replace(/ *\n */g, ' ').trim(); }).join(' · ');
        }).join('\n'));
      }
    });
    return partes.join('');
  }

  function deTexto(texto) {
    var t = String(texto == null ? '' : texto).replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '');
    if (!t) return '';
    var salida = [], trozos = t.split(/(\n[ \t]*\n+)/);
    for (var i = 0; i < trozos.length; i += 2) {
      var sep = trozos[i + 1], parrafo = trozos[i];
      salida.push('<p>' + parrafo.split('\n').map(function (l) { return U.escapar(l); }).join('<br>') + '</p>');
    }
    return salida.join('');
  }

  /* ¿Lleva algo más que párrafos y saltos de línea? */
  function tieneFormato(html) {
    return /<(b|i|u|ul|ol|table)[\s>]/i.test(limpiar(html));
  }

  /* El html de una plantilla de correo. Una plantilla sin `html` (de antes de la fila 772) se abre con su `texto`; si el `html`
     guardado ya no dice lo mismo que el `texto` (alguien cambió el texto por otro lado), vale el texto. */
  function htmlDe(plantilla) {
    var texto = String((plantilla && plantilla.texto) || '');
    var html = plantilla && plantilla.html;
    if (html && aTexto(html).trim() === texto.trim()) return limpiar(html);
    return deTexto(texto);
  }

  /* ---------- rellenar con los datos del asunto ---------- */

  var ES_BLOQUE_HOJA = 'p,li,td,th';

  function hojas(raiz) {
    return Array.prototype.filter.call(raiz.querySelectorAll(ES_BLOQUE_HOJA), function (e) { return !e.querySelector('p,li,ul,ol,table'); });
  }

  function quitarDelPrincipio(el, largo) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while (largo > 0 && (n = w.nextNode())) {
      var quitar = Math.min(largo, n.data.length);
      n.data = n.data.slice(quitar);
      largo -= quitar;
    }
  }

  /* Las marcas {si:Campo=Valor} del principio de un párrafo, un elemento de lista o una casilla. */
  function condicionales(raiz, valores, faltan) {
    if (!window.TextoCondicional) return;
    hojas(raiz).forEach(function (el) {
      var m = TextoCondicional.leerMarca(el.textContent);
      if (!m) return;
      var d = TextoCondicional.decidir(m, valores);
      if (d.estado === 'quita') {
        var padre = el.parentNode;
        padre.removeChild(el);
        if (padre.nodeName === 'TR' && !padre.childNodes.length) padre.parentNode.removeChild(padre);
        return;
      }
      quitarDelPrincipio(el, m.largo);
      if (d.estado === 'falta') {
        if (faltan) faltan.push(d.nombre);
        el.insertBefore(document.createTextNode('[falta: ' + d.nombre + '] '), el.firstChild);
      }
    });
  }

  /* `valores`: los de `Plantillas.valoresDeAsunto`. Cada trozo de texto se rellena con `Plantillas.rellenar`, así que los
     valores entran como texto (nunca como etiquetas). Un valor con saltos de línea («Pedir lo que falta») se queda con ellos. */
  function rellenar(html, valores) {
    var cuerpo = aElemento(html), faltan = [];
    condicionales(cuerpo, valores || {}, faltan);
    var w = document.createTreeWalker(cuerpo, NodeFilter.SHOW_TEXT), nodos = [], n;
    while ((n = w.nextNode())) nodos.push(n);
    nodos.forEach(function (nodo) {
      var r = Plantillas.rellenar(nodo.data, valores || {}, { sinCondicionales: true });
      (r.faltan || []).forEach(function (f) { faltan.push(f); });
      if (r.texto === nodo.data) return;
      var lineas = String(r.texto).split('\n');
      if (lineas.length === 1) { nodo.data = r.texto; return; }
      var padre = nodo.parentNode, antes = nodo;
      lineas.forEach(function (l, i) {
        if (i) padre.insertBefore(document.createElement('br'), antes);
        if (l) padre.insertBefore(document.createTextNode(l), antes);
      });
      padre.removeChild(nodo);
    });
    return { html: cuerpo.innerHTML, faltan: faltan };
  }

  /* ---------- el correo que sale ---------- */

  var ESTILOS = {
    P: 'margin:0 0 12px 0', UL: 'margin:0 0 12px 0;padding-left:24px', OL: 'margin:0 0 12px 0;padding-left:24px',
    TABLE: 'border-collapse:collapse;margin:0 0 12px 0',
    TD: 'border:1px solid #888888;padding:4px 8px;vertical-align:top', TH: 'border:1px solid #888888;padding:4px 8px;vertical-align:top;font-weight:bold;text-align:left;background:#f0f0f0'
  };

  function paraEnviar(html) {
    var cuerpo = aElemento(html);
    Array.prototype.forEach.call(cuerpo.querySelectorAll('p,ul,ol,table,td,th'), function (e) { e.setAttribute('style', ESTILOS[e.nodeName]); });
    return cuerpo.innerHTML;
  }

  /* ---------- para el PDF ---------- */

  function trozos(n, f, salida) {
    f = f || { b: false, i: false, u: false };
    if (esTexto(n)) { if (n.data) salida.push({ t: n.data, b: f.b, i: f.i, u: f.u }); return salida; }
    if (!esEl(n)) return salida;
    if (n.nodeName === 'BR') { salida.push({ t: '\n', b: f.b, i: f.i, u: f.u }); return salida; }
    var g = { b: f.b || n.nodeName === 'B', i: f.i || n.nodeName === 'I', u: f.u || n.nodeName === 'U' };
    Array.prototype.forEach.call(n.childNodes, function (h) { trozos(h, g, salida); });
    return salida;
  }

  function aBloques(html) {
    return Array.prototype.map.call(aElemento(html).childNodes, function (b) {
      if (b.nodeName === 'UL' || b.nodeName === 'OL') {
        return { tipo: 'lista', ordenada: b.nodeName === 'OL', items: Array.prototype.map.call(b.children, function (li) { return trozos(li, null, []); }) };
      }
      if (b.nodeName === 'TABLE') {
        return { tipo: 'tabla', filas: Array.prototype.map.call(b.querySelectorAll('tr'), function (fila) {
          return Array.prototype.map.call(fila.children, function (c) {
            var ts = trozos(c, null, []);
            if (c.nodeName === 'TH') ts = ts.map(function (x) { return { t: x.t, b: true, i: x.i, u: x.u }; });
            return ts;
          });
        }) };
      }
      return { tipo: 'p', trozos: trozos(b, null, []) };
    });
  }

  return {
    limpiar: limpiar, aTexto: aTexto, deTexto: deTexto, tieneFormato: tieneFormato, htmlDe: htmlDe, rellenar: rellenar,
    paraEnviar: paraEnviar, aBloques: aBloques, quitarDelPrincipio: quitarDelPrincipio
  };
})();
window.CorreoFormato = CorreoFormato;
