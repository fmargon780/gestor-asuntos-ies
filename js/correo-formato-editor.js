/* ============================================================
   correo-formato-editor.js — el recuadro con formato del correo, con su barra
   (27-nov-2026, fila 772, docs/758-CORREOS-MAS-COMODOS.md, parte 2).

   Sustituye al recuadro de texto sencillo del «Texto» de la plantilla de correo y del cuerpo del cuadro de Correo.
   Encima, una barra: Negrita, Cursiva, Subrayado, Lista con puntos, Lista numerada y Tabla (se elige cuántas filas y
   columnas; con el cursor dentro de una tabla salen «+ Fila», «− Fila», «+ Columna» y «− Columna»). Al pegar desde Word
   quedan la negrita, la cursiva, el subrayado, las listas y las tablas; el resto (letra, tamaño, colores) se quita
   (`CorreoFormato.limpiar`, js/correo-formato.js).

       CorreoFormatoEditor.html(id, htmlInicial, { minimo })  -> el HTML de la barra y del recuadro (el recuadro lleva el `id`)
       CorreoFormatoEditor.enganchar(id)                      -> pone en marcha la barra y le da al recuadro lo que tenía un
                                                                 textarea, para lo que ya existía:
           .value (texto sencillo) · .html (con formato, limpio) · .ponerHtml(html) · .insertarTexto(t) ·
           .ponerCondicional(campo, valor) · .reemplazarTexto(a, b) · .seleccionarTexto(t) · oninput / evento `input`
   ============================================================ */
var CorreoFormatoEditor = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  var VACIO = '<div><br></div>';   /* recuadro vacío: ya con su párrafo, para que lo escrito sea un párrafo y las listas funcionen */

  /* Para editar, los párrafos son `div`: con `p` las listas de Chrome salen mal (`<p><ul>…`). `CorreoFormato.limpiar` los vuelve párrafos al leer. */
  function paraEditar(html) {
    return CorreoFormato.limpiar(html || '').replace(/<p>/g, '<div>').replace(/<\/p>/g, '</div>');
  }

  function html(id, inicial, opciones) {
    var o = opciones || {};
    function boton(cmd, texto, titulo, estilo) {
      return '<button type="button" class="boton boton-chico cfe-boton" data-cfe="' + cmd + '" title="' + esc(titulo) + '" aria-pressed="false"' +
        (estilo ? ' style="' + estilo + '"' : '') + '>' + texto + '</button>';
    }
    return '<div class="cfe" id="' + id + '-rt">' +
      '<div class="cfe-barra" role="toolbar" aria-label="Formato del texto">' +
        boton('bold', 'Negrita', 'Negrita (Ctrl+B)', 'font-weight:700') +
        boton('italic', 'Cursiva', 'Cursiva (Ctrl+I)', 'font-style:italic') +
        boton('underline', 'Subrayado', 'Subrayado (Ctrl+U)', 'text-decoration:underline') +
        boton('insertUnorderedList', 'Lista con puntos', 'Lista con puntos') +
        boton('insertOrderedList', 'Lista numerada', 'Lista numerada') +
        boton('tabla', 'Tabla', 'Meter una tabla') +
        '<span class="cfe-en-tabla oculto">' +
          boton('fila-mas', '+ Fila', 'Añadir una fila debajo') + boton('fila-menos', '− Fila', 'Quitar esta fila') +
          boton('columna-mas', '+ Columna', 'Añadir una columna a la derecha') + boton('columna-menos', '− Columna', 'Quitar esta columna') +
        '</span>' +
      '</div>' +
      '<div class="cfe-nueva oculto">' +
        '<label>Filas <input type="number" class="campo cfe-filas" min="1" max="30" value="3"></label>' +
        '<label>Columnas <input type="number" class="campo cfe-columnas" min="1" max="10" value="3"></label>' +
        '<button type="button" class="boton boton-chico boton-principal cfe-meter">Meter la tabla</button>' +
        '<button type="button" class="boton boton-chico cfe-no-meter">Cancelar</button>' +
      '</div>' +
      '<div id="' + id + '" class="campo cfe-cuerpo" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Texto"' +
        ' style="min-height:' + (o.minimo || 160) + 'px">' + (paraEditar(inicial) || VACIO) + '</div>' +
    '</div>';
  }

  function enganchar(id) {
    var el = document.getElementById(id);
    if (!el || el.esRico) return el || null;
    var caja = el.parentNode, barra = caja.querySelector('.cfe-barra'), nueva = caja.querySelector('.cfe-nueva');
    var rango = null;
    el.esRico = true;

    function dentro(n) { return !!n && el.contains(n); }
    function guardar() {
      var s = window.getSelection();
      if (s && s.rangeCount && dentro(s.anchorNode)) rango = s.getRangeAt(0).cloneRange();
      repintarBarra();
    }
    function restaurar() {
      var s = window.getSelection();
      if (!s) return;
      if (document.activeElement === el && s.rangeCount && dentro(s.anchorNode)) return;   /* el cursor ya está donde estaba: no se toca */
      el.focus();
      if (!rango) { rango = document.createRange(); rango.selectNodeContents(el); rango.collapse(false); }
      s.removeAllRanges();
      s.addRange(rango);
    }
    /* Tras una tabla al final siempre queda un párrafo, para poder seguir escribiendo debajo. */
    function pieDeTabla() {
      var u = el.lastElementChild;
      if (u && u.nodeName === 'TABLE') el.insertAdjacentHTML('beforeend', VACIO);
    }
    function cambio() { pieDeTabla(); el.dispatchEvent(new Event('input', { bubbles: true })); }
    function casillaActual() {
      var n = rango ? rango.startContainer : null;
      if (n && n.nodeType === 3) n = n.parentNode;
      var c = n && n.closest ? n.closest('td,th') : null;
      return c && dentro(c) ? c : null;
    }
    function repintarBarra() {
      barra.querySelector('.cfe-en-tabla').classList.toggle('oculto', !casillaActual());
      ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'].forEach(function (cmd) {
        var b = barra.querySelector('[data-cfe="' + cmd + '"]'), activo = false;
        try { activo = document.activeElement === el && document.queryCommandState(cmd); } catch (e) { activo = false; }
        if (b) b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      });
    }

    /* ---------- la barra ---------- */
    function ponerEnCasilla(c, alFinal) {
      if (!c) return;
      var r = document.createRange();
      r.selectNodeContents(c);
      r.collapse(!alFinal);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      rango = r.cloneRange();
    }
    function nuevaCasilla() { var td = document.createElement('td'); td.appendChild(document.createElement('br')); return td; }
    function indiceDe(c) { return Array.prototype.indexOf.call(c.parentNode.children, c); }

    /* Las listas las hace esta función y no la orden del navegador: con `insertUnorderedList` Chrome deja el cursor al principio del
       renglón y la lista dentro del `div`. Los nodos se mueven, no se copian, así que el cursor sigue en su sitio. */
    function bloqueDe(nodo) {
      while (nodo && nodo !== el) {
        var p = nodo.parentNode;
        if (p === el || (p && /^(TD|TH)$/.test(p.nodeName) && dentro(p))) return nodo;
        nodo = p;
      }
      return null;
    }
    function alternarLista(etiqueta) {
      restaurar();
      var s = window.getSelection(), cmd = etiqueta === 'UL' ? 'insertUnorderedList' : 'insertOrderedList';
      if (!s || !s.rangeCount) return;
      var r = s.getRangeAt(0), ini = { n: r.startContainer, o: r.startOffset }, fin = { n: r.endContainer, o: r.endOffset };
      var desde = bloqueDe(ini.n), hasta = bloqueDe(fin.n);
      var son = function (b) { return b && /^(DIV|P|UL|OL)$/.test(b.nodeName); };
      if (!son(desde) || !son(hasta) || desde.parentNode !== hasta.parentNode) { document.execCommand(cmd, false, null); return; }
      var cambiados = [], nuevo = null;
      for (var b = desde; b; b = b.nextSibling) { if (!son(b)) { document.execCommand(cmd, false, null); return; } cambiados.push(b); if (b === hasta) break; }
      var mapa = [];   /* [bloque de antes, bloque de ahora] para llevar el cursor */
      function mover(de, a) { while (de.firstChild) a.appendChild(de.firstChild); mapa.push([de, a]); }
      var lista = cambiados.length === 1 && /^(UL|OL)$/.test(cambiados[0].nodeName) ? cambiados[0] : null;
      var padre = desde.parentNode, antes = desde.nextSibling && cambiados.indexOf(desde.nextSibling) === -1 ? desde.nextSibling : cambiados[cambiados.length - 1].nextSibling;
      if (lista && lista.nodeName === etiqueta) {   /* ya era de esa clase: se quita la lista, cada elemento vuelve a ser un renglón */
        Array.prototype.forEach.call(lista.children, function (li) { var d = document.createElement('div'); mover(li, d); padre.insertBefore(d, lista); });
        padre.removeChild(lista);
      } else if (lista) {   /* era de la otra clase: cambia */
        nuevo = document.createElement(etiqueta.toLowerCase());
        Array.prototype.forEach.call(lista.children, function (li) { var l2 = document.createElement('li'); mover(li, l2); nuevo.appendChild(l2); });
        padre.replaceChild(nuevo, lista);
      } else {
        nuevo = document.createElement(etiqueta.toLowerCase());
        cambiados.forEach(function (bq) {
          if (/^(UL|OL)$/.test(bq.nodeName)) { Array.prototype.forEach.call(bq.children, function (li) { var l3 = document.createElement('li'); mover(li, l3); nuevo.appendChild(l3); }); }
          else { var l4 = document.createElement('li'); mover(bq, l4); if (!l4.firstChild) l4.appendChild(document.createElement('br')); nuevo.appendChild(l4); }
        });
        padre.insertBefore(nuevo, antes);
        cambiados.forEach(function (bq) { if (bq.parentNode === padre) padre.removeChild(bq); });
      }
      function llevar(x) { var m = mapa.filter(function (par) { return par[0] === x.n; })[0]; return m ? { n: m[1], o: Math.min(x.o, m[1].childNodes.length) } : x; }
      var a2 = llevar(ini), b2 = llevar(fin), nr = document.createRange();
      try { nr.setStart(a2.n, a2.o); nr.setEnd(b2.n, b2.o); s.removeAllRanges(); s.addRange(nr); } catch (e) { /* el cursor queda como lo deje el navegador */ }
      cambio();
      guardar();
    }

    function operarTabla(que) {
      var c = casillaActual();
      if (!c) return;
      var fila = c.parentNode, tabla = c.closest('table'), i = indiceDe(c);
      if (que === 'fila-mas') {
        var nf = document.createElement('tr');
        Array.prototype.forEach.call(fila.children, function () { nf.appendChild(nuevaCasilla()); });
        fila.parentNode.insertBefore(nf, fila.nextSibling);
        ponerEnCasilla(nf.children[Math.min(i, nf.children.length - 1)]);
      } else if (que === 'fila-menos') {
        var otra = fila.nextElementSibling || fila.previousElementSibling;
        fila.parentNode.removeChild(fila);
        if (!tabla.querySelector('tr')) { var p = document.createElement('p'); p.innerHTML = '<br>'; tabla.parentNode.replaceChild(p, tabla); ponerEnCasilla(p); }
        else ponerEnCasilla(otra && otra.children[Math.min(i, otra.children.length - 1)]);
      } else if (que === 'columna-mas') {
        Array.prototype.forEach.call(tabla.querySelectorAll('tr'), function (f) {
          var nueva2 = nuevaCasilla(), ref = f.children[i];
          f.insertBefore(nueva2, ref ? ref.nextSibling : null);
        });
        ponerEnCasilla(fila.children[i + 1]);
      } else if (que === 'columna-menos') {
        Array.prototype.forEach.call(tabla.querySelectorAll('tr'), function (f) { if (f.children[i]) f.removeChild(f.children[i]); });
        if (!tabla.querySelector('td,th')) { var p2 = document.createElement('p'); p2.innerHTML = '<br>'; tabla.parentNode.replaceChild(p2, tabla); ponerEnCasilla(p2); }
        else ponerEnCasilla(fila.children[Math.min(i, fila.children.length - 1)]);
      }
      cambio();
      repintarBarra();
    }

    function meterTabla() {
      var filas = Math.max(1, Math.min(30, parseInt(caja.querySelector('.cfe-filas').value, 10) || 3));
      var cols = Math.max(1, Math.min(10, parseInt(caja.querySelector('.cfe-columnas').value, 10) || 3));
      var antes = Array.prototype.slice.call(el.querySelectorAll('table'));
      var celda = '<td><br></td>', fila = '<tr>' + new Array(cols + 1).join(celda) + '</tr>';
      restaurar();
      document.execCommand('insertHTML', false, '<table><tbody>' + new Array(filas + 1).join(fila) + '</tbody></table><p><br></p>');
      var creada = Array.prototype.filter.call(el.querySelectorAll('table'), function (t) { return antes.indexOf(t) === -1; })[0];
      nueva.classList.add('oculto');
      if (creada) ponerEnCasilla(creada.querySelector('td'));
      cambio();
      repintarBarra();
    }

    barra.addEventListener('mousedown', function (ev) { ev.preventDefault(); });   /* el texto no pierde el cursor */
    caja.querySelector('.cfe-nueva').addEventListener('mousedown', function (ev) { if (ev.target.nodeName !== 'INPUT') ev.preventDefault(); });
    barra.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-cfe]') : null;
      if (!b) return;
      var cmd = b.getAttribute('data-cfe');
      if (cmd === 'tabla') { nueva.classList.toggle('oculto'); return; }
      if (/^(fila|columna)-/.test(cmd)) { restaurar(); operarTabla(cmd); return; }
      if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') { alternarLista(cmd === 'insertUnorderedList' ? 'UL' : 'OL'); return; }
      restaurar();
      document.execCommand(cmd, false, null);
      guardar();
    });
    caja.querySelector('.cfe-meter').addEventListener('click', meterTabla);
    caja.querySelector('.cfe-no-meter').addEventListener('click', function () { nueva.classList.add('oculto'); });

    /* ---------- escribir y pegar ---------- */
    ['keyup', 'mouseup', 'focus', 'input'].forEach(function (ev) { el.addEventListener(ev, guardar); });
    el.addEventListener('input', pieDeTabla);
    el.addEventListener('blur', function () { guardar(); });
    document.addEventListener('selectionchange', function f() {
      if (!el.isConnected) { document.removeEventListener('selectionchange', f); return; }
      if (document.activeElement === el) guardar();
    });
    el.addEventListener('paste', function (ev) {
      var d = ev.clipboardData;
      if (!d) return;
      ev.preventDefault();
      var h = d.getData('text/html');
      if (h) document.execCommand('insertHTML', false, paraEditar(h));
      else document.execCommand('insertHTML', false, paraEditar(CorreoFormato.deTexto(d.getData('text/plain'))));   /* las líneas en blanco separan párrafos */
    });
    el.addEventListener('keydown', function (ev) {   /* Tabulador: a la casilla siguiente (o anterior con Mayús) */
      if (ev.key !== 'Tab') return;
      var c = casillaActual();
      if (!c) return;
      var todas = Array.prototype.slice.call(c.closest('table').querySelectorAll('td,th')), i = todas.indexOf(c) + (ev.shiftKey ? -1 : 1);
      if (i < 0 || i >= todas.length) return;
      ev.preventDefault();
      ponerEnCasilla(todas[i]);
    });

    /* ---------- lo que tenía un textarea ---------- */
    function textoSencillo() { return CorreoFormato.aTexto(el.innerHTML); }
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: textoSencillo,
      set: function (v) { el.innerHTML = paraEditar(CorreoFormato.deTexto(v)) || VACIO; }
    });
    Object.defineProperty(el, 'html', {
      configurable: true,
      get: function () { return CorreoFormato.limpiar(el.innerHTML); },
      set: function (v) { el.innerHTML = paraEditar(v) || VACIO; pieDeTabla(); }
    });
    el.ponerHtml = function (v) { el.html = v; rango = null; cambio(); };
    el.insertarTexto = function (t) { restaurar(); document.execCommand('insertText', false, String(t)); guardar(); };
    el.ponerCondicional = function (campo, valor) {
      var n = rango ? rango.startContainer : null;
      if (n && n.nodeType === 3) n = n.parentNode;
      var bloque = n && n.closest ? n.closest('div,p,li,td,th') : null;
      if (!bloque || bloque === el || !dentro(bloque)) bloque = el.querySelector('div,p,li,td,th') || el;
      var previa = window.TextoCondicional.leerMarca(bloque.textContent);
      if (previa) CorreoFormato.quitarDelPrincipio(bloque, previa.largo);
      bloque.insertBefore(document.createTextNode(TextoCondicional.marcaEscrita(campo, valor) + ' '), bloque.firstChild);
      cambio();
    };
    el.reemplazarTexto = function (de, a) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) if (n.data.indexOf(de) !== -1) n.data = n.data.split(de).join(a);
      cambio();
    };
    el.seleccionarTexto = function (t) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) {
        var i = n.data.indexOf(t);
        if (i === -1) continue;
        el.focus();
        var r = document.createRange();
        r.setStart(n, i); r.setEnd(n, i + t.length);
        var s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
        rango = r.cloneRange();
        return true;
      }
      return false;
    };
    repintarBarra();
    return el;
  }

  return { html: html, enganchar: enganchar };
})();
window.CorreoFormatoEditor = CorreoFormatoEditor;
