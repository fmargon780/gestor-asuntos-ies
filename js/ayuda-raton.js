/* ============================================================
   ayuda-raton.js — el recuadro de ayuda al dejar el ratón quieto sobre un
   botón o una pestaña (fila 462, 24-oct-2026, docs/AYUDA-AL-PASAR-EL-RATON.md).

   Sustituye a las ayudas pequeñas y grises del navegador (el atributo
   `title`). Un solo estilo y un solo sitio:

   - El texto de una ayuda sale de `data-ayuda` (el que pone el propio código
     según los datos del momento: el nombre entero de algo cortado, un aviso
     ámbar) o de `js/ayudas.js` (los textos fijos, uno por línea, por clave,
     por identificador o por el rótulo del botón).
   - Ningún `title` se queda en la página: lo que el código escriba en `title`
     (con `el.title = …` o dentro de un texto HTML) se pasa solo a `data-ayuda`
     y, si el botón es solo un símbolo, su texto pasa también a `aria-label`
     para que los lectores de pantalla no pierdan su nombre. Se respetan los
     `<iframe title>`: el navegador los exige como nombre del marco y no sacan
     ayuda gris.
   - Sale con el ratón quieto 400 ms, se va al salir y solo hay uno a la vez. No
     sale en pantallas sin ratón. Con el tabulador sale al llegar al botón.
   - Un botón apagado también la enseña, con el motivo (`data-ayuda-apagado`,
     la tabla de js/ayudas.js o, si no hay otro, el aviso general).
   ============================================================ */
window.AyudaRaton = (function () {

  var ESPERA = 400;   /* milisegundos con el ratón quieto antes de que salga */
  var ATRIBUTO = 'data-ayuda';
  var caja = null;
  var actual = null;       /* el elemento que tiene ahora (o va a tener) el recuadro */
  var temporizador = null;
  var ultimoToque = 0;     /* para no hacer caso del «ratón» que algunos navegadores inventan tras un toque */
  var ratonX = 0;

  /* ¿Hay ratón? Se decide por el aparato, no por el ancho: si ningún mando puede «pasar por encima», no sale nada. */
  function hayRaton() {
    try {
      if (!window.matchMedia) return true;
      return window.matchMedia('(any-hover: hover)').matches;
    } catch (e) { return true; }
  }

  /* ---------- 1. Nada de `title`: se pasa a `data-ayuda` ---------- */

  var SIN_NOMBRE = /^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]*$/;   /* un botón que es solo un símbolo */
  var NECESITA_NOMBRE = /^(BUTTON|SUMMARY|INPUT|SELECT|TEXTAREA)$/;

  /* Un botón de solo un símbolo (✕, ⋮, ↑…) tenía su nombre gracias al `title`: se lo quedamos como aria-label. */
  function guardarNombre(el, texto) {
    if (!texto || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;
    var esBoton = NECESITA_NOMBRE.test(el.tagName) || el.getAttribute('role') === 'button';
    if (!esBoton) return;
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      if (el.id && document.querySelector('label[for="' + el.id + '"]')) return;
      if (el.closest && el.closest('label') && (el.closest('label').textContent || '').trim()) return;
    } else if (!SIN_NOMBRE.test((el.textContent || '').trim())) return;
    el.setAttribute('aria-label', texto);
  }

  /* El nombre para lectores de pantalla se decide un momento después: el código suele poner el `title` antes que el
     texto del botón (`b.title = …; b.textContent = …`) y entonces el botón aún parece vacío. */
  var porNombrar = [];
  function nombrarDespues(el) {
    porNombrar.push(el);
    if (porNombrar.length > 1) return;
    Promise.resolve().then(function () {
      var lista = porNombrar; porNombrar = [];
      for (var i = 0; i < lista.length; i++) { var x = lista[i].getAttribute && lista[i].getAttribute(ATRIBUTO); if (x) guardarNombre(lista[i], x); }
    });
  }

  function poner(el, texto) {
    texto = texto == null ? '' : String(texto);
    if (texto) { el.setAttribute(ATRIBUTO, texto); nombrarDespues(el); }
    else el.removeAttribute(ATRIBUTO);
  }

  function convertir(el) {
    if (!el || el.nodeType !== 1 || !el.hasAttribute('title')) return;
    if (el.tagName === 'IFRAME' || el.tagName === 'TITLE') return;   /* el nombre del marco lo exige el navegador */
    if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;    /* el <title> de un dibujo SVG no es un atributo */
    var texto = el.getAttribute('title');
    el.removeAttribute('title');
    poner(el, texto);   /* en un <option> no se ve (el ratón no se sigue dentro de la lista), pero el <select> enseña el de la elegida */
  }

  /* Un botón de solo un símbolo con su ayuda por clave (js/ayudas.js) también conserva su nombre. */
  function nombrarPorClave(el) {
    var clave = el.getAttribute('data-ayuda-clave');
    if (clave && window.Ayudas && Ayudas.TEXTOS[clave]) guardarNombre(el, Ayudas.TEXTOS[clave]);
  }

  function convertirTodo(raiz) {
    if (!raiz || raiz.nodeType !== 1) return;
    if (raiz.hasAttribute('title')) convertir(raiz);
    if (raiz.hasAttribute('data-ayuda-clave')) nombrarPorClave(raiz);
    var lista = raiz.querySelectorAll('[title],[data-ayuda-clave]');
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].hasAttribute('title')) convertir(lista[i]);
      if (lista[i].hasAttribute('data-ayuda-clave')) nombrarPorClave(lista[i]);
    }
  }

  /* `el.title = …` y `el.title` (lo usa el código de la aplicación) hablan con `data-ayuda`. */
  function enganchar() {
    try {
      var nativo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'title');
      Object.defineProperty(HTMLElement.prototype, 'title', {
        configurable: true,
        enumerable: nativo ? nativo.enumerable : true,
        get: function () {
          if (this.tagName === 'IFRAME' && nativo) return nativo.get.call(this);
          return this.getAttribute(ATRIBUTO) || '';
        },
        set: function (v) {
          if (this.tagName === 'IFRAME' && nativo) { nativo.set.call(this, v); return; }
          poner(this, v);
        }
      });
    } catch (e) { /* si el navegador no deja, queda el observador */ }
  }

  function vigilar() {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function (cambios) {
      for (var i = 0; i < cambios.length; i++) {
        var c = cambios[i];
        if (c.type === 'attributes') { if (c.attributeName === 'title') convertir(c.target); else nombrarPorClave(c.target); }
        else for (var j = 0; j < c.addedNodes.length; j++) convertirTodo(c.addedNodes[j]);
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['title', 'data-ayuda-clave'], childList: true, subtree: true });
  }

  /* ---------- 2. Qué texto toca ---------- */

  function limpiar(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  function apagado(el) {
    return !!(el.disabled || el.getAttribute('aria-disabled') === 'true');
  }

  /* El motivo de un botón apagado. */
  function motivoDe(el) {
    var propio = el.getAttribute('data-ayuda-apagado');
    if (propio) return propio;
    var clave = el.getAttribute('data-motivo-clave');   /* el motivo fijo, que vive en js/ayudas.js */
    if (clave && window.Ayudas && Ayudas.MOTIVOS[clave]) return Ayudas.MOTIVOS[clave];
    var dicho = el.getAttribute(ATRIBUTO);   /* un botón apagado que ya traía su motivo en la ayuda de siempre */
    if (!window.Ayudas) return dicho || '';
    return Ayudas.motivo(el, !!(window.SoloConsulta && SoloConsulta.activo && SoloConsulta.activo()), dicho) || dicho || '';
  }

  /* { normal, motivo } para un elemento, o null si no lleva ayuda. */
  function textosDe(el) {
    var off = apagado(el);
    var normal = window.Ayudas ? Ayudas.de(el, off) : (off ? '' : (el.getAttribute(ATRIBUTO) || ''));
    if (!normal && !off && el.tagName === 'SELECT' && el.selectedOptions && el.selectedOptions[0]) normal = el.selectedOptions[0].getAttribute(ATRIBUTO) || '';   /* el nombre entero de la opción elegida */
    var motivo = off ? motivoDe(el) : '';
    if (!normal && !motivo) return null;
    return { normal: normal, motivo: motivo };
  }

  /* El elemento más cercano (hacia arriba) que lleva ayuda. */
  function buscar(desde) {
    var el = desde && desde.nodeType === 3 ? desde.parentNode : desde;
    var tope = document.body;
    while (el && el !== tope && el.nodeType === 1) {
      if (el.id === 'ayuda-raton') return null;
      if (textosDe(el)) return el;
      el = el.parentNode;
    }
    return null;
  }

  /* ---------- 3. El recuadro ---------- */

  function crear() {
    if (caja) return caja;
    caja = document.createElement('div');
    caja.id = 'ayuda-raton';
    caja.className = 'ayuda-raton';
    caja.setAttribute('role', 'tooltip');
    caja.hidden = true;
    document.body.appendChild(caja);
    return caja;
  }

  function colocar(el) {
    var margen = 8, hueco = 6;
    var r = el.getBoundingClientRect();
    var ancho = window.innerWidth, alto = window.innerHeight;
    caja.style.left = '0px'; caja.style.top = '0px';
    caja.style.maxWidth = Math.min(340, ancho - 2 * margen) + 'px';
    var c = caja.getBoundingClientRect();
    var x, y;
    /* Debajo si cabe; si no, encima; si no cabe en ninguno (elemento enorme), al lado. */
    var cabeDebajo = r.bottom + hueco + c.height + margen <= alto;
    var cabeEncima = r.top - hueco - c.height - margen >= 0;
    var centrarEn = r.left + r.width / 2;
    if (r.width > 260 && ratonX >= r.left && ratonX <= r.right) centrarEn = ratonX;   /* un elemento ancho: junto al ratón */
    x = centrarEn - c.width / 2;
    if (cabeDebajo) y = r.bottom + hueco;
    else if (cabeEncima) y = r.top - hueco - c.height;
    else {
      y = Math.max(margen, Math.min(alto - c.height - margen, r.top));
      x = (r.right + hueco + c.width + margen <= ancho) ? r.right + hueco : r.left - hueco - c.width;
    }
    x = Math.max(margen, Math.min(ancho - c.width - margen, x));
    caja.style.left = Math.round(x) + 'px';
    caja.style.top = Math.round(y) + 'px';
  }

  function mostrar(el) {
    if (!el || !el.isConnected) return;
    var t = textosDe(el);
    if (!t) return;
    crear();
    caja.innerHTML = '';
    if (t.normal) { var p = document.createElement('p'); p.className = 'ayuda-raton-texto'; p.textContent = t.normal; caja.appendChild(p); }
    if (t.motivo) { var q = document.createElement('p'); q.className = 'ayuda-raton-motivo'; q.textContent = t.motivo; caja.appendChild(q); }
    caja.hidden = false;
    caja.classList.add('ayuda-raton-visible');
    colocar(el);
    el.setAttribute('aria-describedby', 'ayuda-raton');
    actual = el;
  }

  function ocultar() {
    clearTimeout(temporizador); temporizador = null;
    if (caja) { caja.hidden = true; caja.classList.remove('ayuda-raton-visible'); caja.innerHTML = ''; }
    if (actual) { try { actual.removeAttribute('aria-describedby'); } catch (e) {} }
    actual = null;
  }

  function programar(el, espera) {
    ocultar();
    actual = el;
    if (espera <= 0) { mostrar(el); return; }
    temporizador = setTimeout(function () { temporizador = null; if (actual === el) mostrar(el); }, espera);
  }

  /* ---------- 4. Los avisos del navegador ---------- */

  function elRatonEs(ev) {
    return hayRaton() && Date.now() - ultimoToque > 800 && !(ev.pointerType === 'touch');
  }

  function alEntrar(ev) {
    if (!elRatonEs(ev)) return;
    ratonX = ev.clientX || 0;
    var el = buscar(ev.target);
    if (el === actual) return;
    if (!el) { ocultar(); return; }
    programar(el, ESPERA);
  }

  function alSalir(ev) {
    if (!actual) return;
    var a = ev.relatedTarget;
    if (a && actual.contains(a)) return;
    ocultar();
  }

  function alMover(ev) {
    ratonX = ev.clientX || 0;
    if (!actual) return;
    /* Si el ratón ya no está encima de lo que tenía el recuadro (p. ej. el botón se apagó o se repintó), fuera. */
    if (!actual.isConnected) ocultar();
  }

  function alEnfocar(ev) {
    if (!hayRaton()) return;
    var el = buscar(ev.target);
    if (!el) return;
    var visible = true;
    try { visible = el.matches(':focus-visible'); } catch (e) { /* navegador viejo: se enseña */ }
    if (!visible) return;
    programar(el, 0);
  }

  function alDesenfocar(ev) {
    if (actual && (ev.target === actual || actual.contains(ev.target))) ocultar();
  }

  function iniciar() {
    enganchar();
    convertirTodo(document.documentElement);
    vigilar();
    document.addEventListener('mouseover', alEntrar, true);
    document.addEventListener('mouseout', alSalir, true);
    document.addEventListener('mousemove', alMover, true);
    document.addEventListener('mousedown', ocultar, true);
    document.addEventListener('wheel', ocultar, true);
    document.addEventListener('scroll', ocultar, true);
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') ocultar(); }, true);
    document.addEventListener('focusin', alEnfocar, true);
    document.addEventListener('focusout', alDesenfocar, true);
    document.addEventListener('touchstart', function () { ultimoToque = Date.now(); ocultar(); }, { capture: true, passive: true });
    document.addEventListener('pointerdown', function (ev) { if (ev.pointerType === 'touch') { ultimoToque = Date.now(); ocultar(); } }, true);
    window.addEventListener('blur', ocultar);
    window.addEventListener('resize', ocultar);
  }

  iniciar();

  return {
    ESPERA: ESPERA,
    ocultar: ocultar,
    convertirTodo: convertirTodo,
    /* Para las pruebas: el texto que enseñaría un elemento ({ ayuda, motivo }) y si hay recuadro a la vista. */
    ayuda: function (el) { var x = textosDe(el); return { ayuda: x ? x.normal : '', motivo: x ? x.motivo : '' }; },
    visible: function () { return !!(caja && !caja.hidden); }
  };
})();
