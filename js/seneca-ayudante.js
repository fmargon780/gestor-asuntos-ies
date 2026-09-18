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
    '  var ESPERA_SUGERENCIA = 150;',
    '  var ESPERA_SUGERENCIA_MAXIMA = 5000;',
    '  var ESPERA_SUGERENCIA_MAXIMA_REINTENTO = 7000;',
    '  var ESPERA_ANTES_DE_FLECHA = 350;',
    '  var ESPERA_CAMPO_VACIO_MAXIMA = 2500;',
    '  var ESPERA_ENTRE_USUARIOS = 600;',
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
    '  /* Busca, en un documento, una hoja del árbol (sin hijos) visible,',
    '     distinta del propio campo, cuyo texto contenga lo que se acaba',
    '     de escribir: es el desplegable de sugerencias de Séneca, sin',
    '     necesidad de saber cómo se llama su etiqueta. */',
    '  function elementoConTexto(doc, campo, buscado) {',
    '    var todos = doc.querySelectorAll("*");',
    '    for (var i = 0; i < todos.length; i++) {',
    '      var el = todos[i];',
    '      if (el === campo || (el.children && el.children.length)) continue;',
    '      var t = (el.textContent || "").trim().toLowerCase();',
    '      if (t && t.indexOf(buscado) !== -1 && visible(el)) return el;',
    '    }',
    '    return null;',
    '  }',
    '  function haySugerencia(campo, buscado) {',
    '    if (elementoConTexto(document, campo, buscado)) return true;',
    '    var marcos = document.querySelectorAll("iframe");',
    '    for (var i = 0; i < marcos.length; i++) {',
    '      var doc = null;',
    '      try { doc = marcos[i].contentDocument; } catch (e) { doc = null; }',
    '      if (doc && elementoConTexto(doc, campo, buscado)) return true;',
    '    }',
    '    return false;',
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
    '  /* `botones`: lista de { texto, alPulsar }, o null/[] sin ninguno. */',
    '  function pintar(texto, botones) {',
    '    var c = caja();',
    '    c.innerHTML = "";',
    '    var span = document.createElement("span");',
    '    span.textContent = texto;',
    '    c.appendChild(span);',
    '    (botones || []).forEach(function (info) {',
    '      var b = document.createElement("button");',
    '      b.textContent = info.texto;',
    '      b.style.cssText = "margin-left:12px;cursor:pointer;border:0;border-radius:4px;padding:3px 10px";',
    '      b.onclick = info.alPulsar;',
    '      c.appendChild(b);',
    '    });',
    '  }',
    '  function quitarCaja() {',
    '    var c = document.getElementById(ID_CAJA);',
    '    if (c) c.remove();',
    '  }',
    '  function quitarCajaLuego() {',
    '    setTimeout(quitarCaja, 3000);',
    '  }',
    '  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }',
    '  function esperarHasta(comprobar, pasoMs, maximoMs) {',
    '    return new Promise(function (resolver) {',
    '      var pasado = 0;',
    '      (function mirar() {',
    '        if (comprobar()) { resolver(true); return; }',
    '        pasado += pasoMs;',
    '        if (pasado >= maximoMs) { resolver(false); return; }',
    '        setTimeout(mirar, pasoMs);',
    '      })();',
    '    });',
    '  }',
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
    '  /* Un intento de meter a una persona: escribe, espera a que Séneca',
    '     despliegue su sugerencia (o al máximo indicado, lo que llegue',
    '     antes), flecha abajo, una pausa, Intro, y comprueba si el campo',
    '     se ha vaciado de verdad. Devuelve si ha entrado. */',
    '  async function intentoUsuario(campo, valor, maximoSugerencia) {',
    '    ponerValor(campo, valor);',
    '    disparar(campo, "input");',
    '    disparar(campo, "keyup");',
    '    var buscado = valor.replace(/^@/, "").toLowerCase();',
    '    await esperarHasta(function () { return haySugerencia(campo, buscado); }, ESPERA_SUGERENCIA, maximoSugerencia);',
    '    await esperar(ESPERA_ANTES_DE_FLECHA);',
    '    dispararTecla(campo, "keydown", "ArrowDown", 40);',
    '    dispararTecla(campo, "keyup", "ArrowDown", 40);',
    '    dispararTecla(campo, "keydown", "Enter", 13);',
    '    dispararTecla(campo, "keyup", "Enter", 13);',
    '    return esperarHasta(function () { return !campo.value; }, ESPERA_SUGERENCIA, ESPERA_CAMPO_VACIO_MAXIMA);',
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
    '    var metidos = 0;',
    '    var fallidos = [];',
    '',
    '    for (var i = 0; i < usuarios.length; i++) {',
    '      if (parar) break;',
    '      pintar("Metiendo " + (i + 1) + " de " + usuarios.length, [{ texto: "Parar", alPulsar: pararAhora }]);',
    '      var valor = usuarios[i].charAt(0) === "@" ? usuarios[i] : ("@" + usuarios[i]);',
    '      var entrado = await intentoUsuario(campo, valor, ESPERA_SUGERENCIA_MAXIMA);',
    '      if (parar) break;',
    '      if (!entrado) entrado = await intentoUsuario(campo, valor, ESPERA_SUGERENCIA_MAXIMA_REINTENTO);',
    '      if (entrado) {',
    '        metidos++;',
    '      } else {',
    '        fallidos.push(valor);',
    '        ponerValor(campo, "");',
    '        disparar(campo, "input");',
    '      }',
    '      if (parar) break;',
    '      await esperar(ESPERA_ENTRE_USUARIOS);',
    '    }',
    '',
    '    if (parar) {',
    '      pintar("Parado.", null);',
    '      quitarCajaLuego();',
    '      return;',
    '    }',
    '    if (!fallidos.length) {',
    '      pintar("Hecho: " + metidos + " metidos.", null);',
    '      quitarCajaLuego();',
    '      return;',
    '    }',
    '    pintar("Hechos " + metidos + " de " + usuarios.length + ". No han entrado: " + fallidos.join(", "), [',
    '      { texto: "Copiar los que faltan", alPulsar: function () {',
    '          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(fallidos.join("\\n"));',
    '        } },',
    '      { texto: "Cerrar", alPulsar: quitarCaja }',
    '    ]);',
    '  })();',
    '})();'
  ].join('\n');

  /* El texto del enlace, para el atributo `href` de un `<a>`: siempre
     empieza por "javascript:". No se ejecuta nunca desde aquí. */
  function textoDelMarcador() {
    return 'javascript:' + CODIGO_INTERNO;
  }

  /* Pinta, dentro de `contenedor`, el enlace-marcador con sus frases
     (arrastrar, permiso del portapapeles, red de seguridad). Se puede
     llamar varias veces sobre el mismo contenedor (Ajustes se repinta
     al cambiar de pestaña): no duplica nada.

     `contenedorExplicacion` es opcional (fila 53, 18-sep-2026,
     docs/SENECA-CUADRO-ANCHO.md, 3.5): si se pasa, la explicación se
     pinta ahí en vez de junto al enlace, para que el cuadro de Séneca
     (js/seneca-cuadro.js) la meta dentro de su `<details>` cerrado. El
     texto no cambia; solo dónde se pinta. Sin él (como en Ajustes,
     js/ajustes-mantenimiento.js), enlace y explicación van juntos,
     como siempre. */
  function insertarEnlace(contenedor, contenedorExplicacion) {
    if (!contenedor) return;
    contenedor.innerHTML = '';
    if (contenedorExplicacion) contenedorExplicacion.innerHTML = '';

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
      'El ayudante comprueba cada destinatario; si alguno no entra, lo dice al final por su ' +
      'nombre para pegarlo a mano con "Copiar el siguiente".<br>' +
      'Para un grupo que uses todos los meses, lo mejor es crearlo una vez en el gestor de ' +
      'contactos del propio Séneca: este ayudante es para listas de un día.';

    contenedor.appendChild(enlace);
    if (contenedorExplicacion) contenedorExplicacion.appendChild(explica);
    else contenedor.appendChild(explica);
  }

  window.SenecaAyudante = {
    textoDelMarcador: textoDelMarcador,
    insertarEnlace: insertarEnlace
  };

})();
