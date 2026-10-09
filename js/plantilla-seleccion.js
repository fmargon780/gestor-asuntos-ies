/* ============================================================
   plantilla-seleccion.js — lo que comparten «Convertir en plantilla»
   (js/convertir-en-plantilla-pantalla.js, fila 280) y «Retocar»
   (js/plantilla-retocar-pantalla.js, fila 322): pintar el Word con sus
   huecos resaltados, saber qué se ha seleccionado con el ratón, el menú
   que sale sobre la selección y los cuadros pequeños de «Cambiar por un
   dato…» y «Cambiar por otro texto…».

   Sacado de js/convertir-en-plantilla-pantalla.js sin cambiar lo que
   hace (fila 322, docs/RETOCAR-UNA-PLANTILLA.md).
   ============================================================ */
var PlantillaSeleccion = (function () {

  function esc(t) { return U.escapar(t); }

  /* ---------- el documento, con los huecos en amarillo ---------- */

  /* Cada `{…}` o `{{…}}` del documento, en un <mark>. `alClic(hueco)`: al pulsar uno. */
  function resaltarHuecos(caja, alClic) {
    var recorrido = document.createTreeWalker(caja, NodeFilter.SHOW_TEXT, null), nodos = [], n;
    while ((n = recorrido.nextNode())) { if (n.parentNode.nodeName !== 'STYLE' && /\{[^{}]+\}/.test(n.nodeValue)) nodos.push(n); }   /* no el css que pone el visor */
    nodos.forEach(function (nodo) {
      var texto = nodo.nodeValue, re = /\{\{[^{}]+\}\}|\{[^{}]+\}/g, ultimo = 0, m, frag = document.createDocumentFragment();
      while ((m = re.exec(texto))) {
        if (m.index > ultimo) frag.appendChild(document.createTextNode(texto.slice(ultimo, m.index)));
        var marca = document.createElement('mark');
        marca.className = 'cep-hueco';
        marca.dataset.hueco = m[0];
        marca.textContent = m[0];
        marca.onclick = function (ev) { ev.stopPropagation(); if (alClic) alClic(this.dataset.hueco); };
        frag.appendChild(marca);
        ultimo = m.index + m[0].length;
      }
      if (ultimo < texto.length) frag.appendChild(document.createTextNode(texto.slice(ultimo)));
      nodo.parentNode.replaceChild(frag, nodo);
    });
  }

  async function pintarDocumento(hoja, blob, alClicHueco) {
    var antes = hoja.scrollTop;
    var caja = hoja.querySelector('.cep-hoja-interior');
    if (!caja) { caja = document.createElement('div'); caja.className = 'cep-hoja-interior'; hoja.appendChild(caja); }
    try {
      await WordVisor.pintarEn(caja, blob);
      resaltarHuecos(caja, alClicHueco);
    } catch (e) {
      caja.innerHTML = '<p class="explica">No he podido enseñar este Word: ' + esc(U.mensajeDeError(e)) + '</p>';
    }
    hoja.scrollTop = antes;
  }

  function primerSitioDeTexto(caja, texto) {
    var buscado = DocxSustituir.normalizar(String(texto).replace(/\s+/g, ' ').trim());
    if (!buscado) return null;
    var recorrido = document.createTreeWalker(caja, NodeFilter.SHOW_TEXT, null), n;
    while ((n = recorrido.nextNode())) {
      if (n.parentNode.nodeName !== 'STYLE' && DocxSustituir.normalizar(n.nodeValue).indexOf(buscado) !== -1) return n.parentNode;
    }
    return null;
  }

  /* ---------- lo seleccionado y su menú ---------- */

  /* El texto seleccionado, si está dentro de un solo párrafo de `doc` (3 caracteres o más). Con `conHuecos`, también
     vale un trozo con `{…}`. Devuelve { texto, rect, parrafo } o null. */
  function seleccionValida(doc, conHuecos) {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !doc) return null;
    var a = sel.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode);
    var f = sel.focusNode && (sel.focusNode.nodeType === 3 ? sel.focusNode.parentNode : sel.focusNode);
    if (!a || !f || !doc.contains(a) || !doc.contains(f)) return null;
    var pa = a.closest('p'), pf = f.closest('p');
    if (!pa || pa !== pf) return null;
    var texto = sel.toString().replace(/\s+/g, ' ').trim();
    if (texto.length < 3 || (!conHuecos && /[{}]/.test(texto))) return null;
    return { texto: texto, rect: sel.getRangeAt(0).getBoundingClientRect(), parrafo: pa };
  }

  /* El menú sobre la selección. `opc`: { documento: () => el documento pintado, activo: () => bool, conHuecos: bool,
     opciones: (s) => [[texto, acción]] }. Devuelve { ocultar, hayMenu, destruir }. */
  function montar(opc) {
    var menu = null;

    function ocultar() {
      if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
      menu = null;
      var viejo = document.getElementById('cep-hueco-temporal');
      if (viejo) viejo.remove();
    }

    function mostrar(s) {
      ocultar();
      menu = document.createElement('div');
      menu.className = 'cep-menu-sel';
      menu.addEventListener('mousedown', function (e) { e.preventDefault(); });
      opc.opciones(s).forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = o[0];
        b.onclick = function () { menu.style.visibility = 'hidden'; o[1](); window.getSelection().removeAllRanges(); };
        menu.appendChild(b);
      });
      document.body.appendChild(menu);
      var r = s.rect;
      menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px';
      menu.style.top = Math.min(window.innerHeight - menu.offsetHeight - 8, r.bottom + 6) + 'px';
    }

    function alSoltarRaton(ev) {
      if (!opc.activo() || (menu && menu.contains(ev.target))) return;
      setTimeout(function () {
        var s = opc.activo() ? seleccionValida(opc.documento(), opc.conHuecos) : null;
        if (!s) { if (!menu || !menu.matches(':hover')) ocultar(); return; }
        mostrar(s);
      }, 0);
    }

    function alPulsarFuera(ev) { if (menu && !menu.contains(ev.target)) ocultar(); }

    document.addEventListener('mouseup', alSoltarRaton, true);
    document.addEventListener('mousedown', alPulsarFuera, true);
    return {
      ocultar: ocultar, hayMenu: function () { return !!menu; },
      destruir: function () {
        document.removeEventListener('mouseup', alSoltarRaton, true);
        document.removeEventListener('mousedown', alPulsarFuera, true);
        ocultar();
      }
    };
  }

  /* ---------- los cuadros pequeños ---------- */

  /* «Cambiar por un dato…»: el buscador de huecos de siempre. `alElegir(hueco)`. */
  function cambiarPorUnDato(s, alElegir) {
    var viejo = document.getElementById('cep-hueco-temporal');
    if (viejo) viejo.remove();
    var caja = document.createElement('div');
    caja.id = 'cep-hueco-temporal';
    caja.style.cssText = 'position:fixed;left:' + Math.round(s.rect.left) + 'px;top:' + Math.round(s.rect.bottom) + 'px;width:1px;height:1px;overflow:hidden';
    var campo = document.createElement('input'), boton = document.createElement('button');
    boton.type = 'button';
    caja.appendChild(campo); caja.appendChild(boton);
    document.body.appendChild(caja);
    HuecosBuscador.montar({ boton: boton, campos: [campo] });
    campo.addEventListener('input', function () {
      var hueco = campo.value.trim();
      caja.remove();
      if (hueco) alElegir(hueco);
    });
    boton.click();
  }

  /* «Cambiar por otro texto…» (fila 322): el trozo seleccionado ya escrito, para corregirlo. Devuelve el texto nuevo, o
     null si se cancela o no hay nada que cambiar (vacío, o igual que antes). */
  async function cuadroCambiarTexto(texto) {
    var espera = U.preguntar('Cambiar este texto',
      '<input id="cep-texto-nuevo" class="campo" autocomplete="off" value="' + esc(texto) + '">' +
      '<p class="nota">Antes: ' + esc(texto) + '</p>', 'Cambiar');
    var campo = document.getElementById('cep-texto-nuevo');
    if (campo) { campo.focus(); campo.select(); }
    var ok = await espera;
    if (!ok) return null;
    var nuevo = String((document.getElementById('cep-texto-nuevo') || {}).value || '').replace(/\s+/g, ' ').trim();
    if (!nuevo || nuevo === texto) return null;
    return nuevo;
  }

  return { pintarDocumento: pintarDocumento, resaltarHuecos: resaltarHuecos, primerSitioDeTexto: primerSitioDeTexto,
    seleccionValida: seleccionValida, montar: montar, cambiarPorUnDato: cambiarPorUnDato, cuadroCambiarTexto: cuadroCambiarTexto };
})();
window.PlantillaSeleccion = PlantillaSeleccion;
