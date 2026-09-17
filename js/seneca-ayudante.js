/* ============================================================
   seneca-ayudante.js — el ayudante de Séneca (fila 47, 17-sep-2026,
   docs/DESTINATARIOS-EN-SENECA.md, 4).

   No es un botón normal: es un enlace-marcador que Francisco
   ARRASTRA una vez a la barra de marcadores del navegador. Al
   pulsarlo, ya en la pantalla de Séneca, lee la lista del
   portapapeles (la que deja "Copiar la lista" del cuadro de Séneca,
   js/seneca-destinatarios.js) y va metiendo los usuarios uno a uno en
   el campo de destinatarios.

   Por qué hace falta esperar y dar a la flecha abajo: comprobado por
   Francisco en Séneca de verdad (docs/DESTINATARIOS-EN-SENECA.md, y
   docs/HISTORIA.md). Pegar vale, pero hace falta esperar algo más de
   un segundo y lanzar la flecha abajo para que Séneca se quede con el
   destinatario.

   El código que se ejecuta DENTRO de Séneca vive aquí como una cadena
   de verdad (`CODIGO_INTERNO`), no minificada a mano, para que se
   pueda leer: `textoDelMarcador()` solo le pone delante "javascript:".
   No se ejecuta nada de este código en el gestor: aquí solo se genera
   el texto del enlace.
   ============================================================ */
(function () {

  var CODIGO_INTERNO = [
    '(function () {',
    '  var ESPERA_ANTES_DE_FLECHA = 1400;',
    '  var ESPERA_ENTRE_USUARIOS = 400;',
    '  var ID_CAJA = "gestor-ayudante-seneca";',
    '',
    '  function esInputDeTexto(el) {',
    '    if (!el || el.tagName !== "INPUT") return false;',
    '    var t = (el.type || "text").toLowerCase();',
    '    return t === "text" || t === "search" || t === "email" || t === "tel";',
    '  }',
    '  function visible(el) {',
    '    var r = el.getBoundingClientRect();',
    '    return r.width > 0 && r.height > 0;',
    '  }',
    '  function primerVisible(doc) {',
    '    var todos = doc.querySelectorAll("input");',
    '    for (var i = 0; i < todos.length; i++) {',
    '      if (esInputDeTexto(todos[i]) && visible(todos[i])) return todos[i];',
    '    }',
    '    return null;',
    '  }',
    '  function buscarCampo() {',
    '    if (esInputDeTexto(document.activeElement)) return document.activeElement;',
    '    var directo = primerVisible(document);',
    '    if (directo) return directo;',
    '    var marcos = document.querySelectorAll("iframe");',
    '    for (var i = 0; i < marcos.length; i++) {',
    '      var doc = null;',
    '      try { doc = marcos[i].contentDocument; } catch (e) { doc = null; }',
    '      if (!doc) continue;',
    '      if (esInputDeTexto(doc.activeElement)) return doc.activeElement;',
    '      var deDentro = primerVisible(doc);',
    '      if (deDentro) return deDentro;',
    '    }',
    '    return null;',
    '  }',
    '',
    '  function caja() {',
    '    var c = document.getElementById(ID_CAJA);',
    '    if (c) return c;',
    '    c = document.createElement("div");',
    '    c.id = ID_CAJA;',
    '    c.style.cssText = "position:fixed;top:12px;right:12px;z-index:2147483647;" +',
    '      "background:#1f3a5f;color:#fff;padding:10px 14px;border-radius:8px;" +',
    '      "font:14px/1.4 sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.35)";',
    '    document.body.appendChild(c);',
    '    return c;',
    '  }',
    '  function pintar(texto, botonParar) {',
    '    var c = caja();',
    '    c.innerHTML = "";',
    '    var span = document.createElement("span");',
    '    span.textContent = texto;',
    '    c.appendChild(span);',
    '    if (botonParar) {',
    '      var b = document.createElement("button");',
    '      b.textContent = "Parar";',
    '      b.style.cssText = "margin-left:12px;cursor:pointer;border:0;border-radius:4px;padding:3px 10px";',
    '      b.onclick = botonParar;',
    '      c.appendChild(b);',
    '    }',
    '  }',
    '  function quitarCajaLuego() {',
    '    setTimeout(function () {',
    '      var c = document.getElementById(ID_CAJA);',
    '      if (c) c.remove();',
    '    }, 3000);',
    '  }',
    '  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }',
    '',
    '  function ponerValor(campo, valor) {',
    '    try {',
    '      var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");',
    '      descriptor.set.call(campo, valor);',
    '    } catch (e) { campo.value = valor; }',
    '  }',
    '  function disparar(campo, tipo) {',
    '    campo.dispatchEvent(new Event(tipo, { bubbles: true }));',
    '  }',
    '  function dispararTecla(campo, tipo, tecla, codigoTecla) {',
    '    campo.dispatchEvent(new KeyboardEvent(tipo, {',
    '      key: tecla, code: tecla, keyCode: codigoTecla, which: codigoTecla, bubbles: true',
    '    }));',
    '  }',
    '',
    '  (async function () {',
    '    var campo = buscarCampo();',
    '    var textoPortapapeles = "";',
    '    try { textoPortapapeles = await navigator.clipboard.readText(); } catch (e) { textoPortapapeles = ""; }',
    '    var usuarios = textoPortapapeles.split(/\\r?\\n/)',
    '      .map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });',
    '',
    '    if (!campo || !usuarios.length) {',
    '      pintar("Haz clic dentro del campo de destinatarios y vuelve a pulsar", null);',
    '      quitarCajaLuego();',
    '      return;',
    '    }',
    '',
    '    var parar = false;',
    '    function pararAhora() { parar = true; }',
    '',
    '    for (var i = 0; i < usuarios.length; i++) {',
    '      if (parar) break;',
    '      pintar("Metiendo " + (i + 1) + " de " + usuarios.length, pararAhora);',
    '      var valor = usuarios[i].charAt(0) === "@" ? usuarios[i] : ("@" + usuarios[i]);',
    '      ponerValor(campo, valor);',
    '      disparar(campo, "input");',
    '      disparar(campo, "keyup");',
    '      await esperar(ESPERA_ANTES_DE_FLECHA);',
    '      if (parar) break;',
    '      dispararTecla(campo, "keydown", "ArrowDown", 40);',
    '      dispararTecla(campo, "keyup", "ArrowDown", 40);',
    '      dispararTecla(campo, "keydown", "Enter", 13);',
    '      dispararTecla(campo, "keyup", "Enter", 13);',
    '      await esperar(ESPERA_ENTRE_USUARIOS);',
    '    }',
    '',
    '    pintar(parar ? "Parado." : ("Hecho: " + usuarios.length + " metidos."), null);',
    '    quitarCajaLuego();',
    '  })();',
    '})();'
  ].join('\n');

  /* El texto del enlace, para el atributo `href` de un `<a>`: siempre
     empieza por "javascript:". No se ejecuta nunca desde aquí. */
  function textoDelMarcador() {
    return 'javascript:' + CODIGO_INTERNO;
  }

  /* Pinta, dentro de `contenedor`, el enlace-marcador con sus tres
     frases (arrastrar, permiso del portapapeles, red de seguridad).
     Se puede llamar varias veces sobre el mismo contenedor (Ajustes
     se repinta al cambiar de pestaña): no duplica nada. */
  function insertarEnlace(contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    var enlace = document.createElement('a');
    enlace.className = 'boton boton-principal';
    enlace.href = textoDelMarcador();
    enlace.draggable = true;
    enlace.textContent = 'Instalar el ayudante de Séneca';
    enlace.title = 'Arrástralo a la barra de marcadores. No se pulsa.';
    enlace.onclick = function (ev) {
      ev.preventDefault();
      if (window.U) U.aviso('Este enlace se arrastra a la barra de marcadores: no se pulsa.', 'malo');
    };

    var explica = document.createElement('p');
    explica.className = 'nota';
    explica.style.marginTop = '8px';
    explica.innerHTML =
      'Arrastra este enlace, sin soltarlo, hasta la barra de marcadores del navegador. ' +
      'Se hace <strong>una sola vez</strong>.<br>' +
      'La primera vez que lo uses en Séneca, el navegador pedirá permiso para leer el ' +
      'portapapeles: dale a Permitir.<br>' +
      'Si alguna vez no hace nada, usa "Copiar el siguiente" y pégalo a mano: es la manera ' +
      'de siempre, y no depende de este ayudante.';

    contenedor.appendChild(enlace);
    contenedor.appendChild(explica);
  }

  window.SenecaAyudante = {
    textoDelMarcador: textoDelMarcador,
    insertarEnlace: insertarEnlace
  };

})();
