/* ============================================================
   util-pantalla.js — ayudas de pantalla: conservar lo escrito al
   repintar (U.conservandoLoEscrito), el menú de tres puntos
   (U.menuDeAcciones) y copiar al portapapeles (U.copiar). Salió de
   js/util.js en la fila 133 (24-sep-2026,
   docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada. Se carga justo
   después de js/util-parecidos.js.
   ============================================================ */
(function () {
  var aviso = U.aviso;

  /* ---------- un repintado no puede tirar lo que se está escribiendo ----------

     (17-sep-2026, filas 33 y 34 de la cola.) Media aplicación repinta
     bloques enteros con innerHTML, y algunos de esos bloques se
     repintan solos cada pocos segundos, sin que nadie los toque. Si
     Francisco está a media nota cuando eso pasa, lo escrito
     desaparece, y con él el foco y el cursor.

     Se envuelve el repintado con esta ayuda: antes apunta lo que hay
     escrito en cada campo de escribir de `raiz`, y después se lo
     devuelve a los que hayan vuelto a salir Y ESTÉN VACÍOS (nunca se
     pisa un valor que el propio repintado haya traído con contenido),
     más el foco y la posición del cursor al que lo tenía.

     La identidad de un campo es su `id`; si no tiene, su
     `data-clave`. Y si tampoco, quien llama puede pasar un
     `clavePara(campo)` propio que la saque de donde sepa: los hitos,
     por ejemplo, la sacan del `data-id` de su fila
     (`hito-nota-<id del hito>`), porque dentro de una misma ficha hay
     un cuerpo de hito por hito y ninguno de sus campos puede llevar
     id. Un campo del que no salga ninguna clave no se apunta: no
     habría forma de reconocerlo después del repintado.

     `hacer` puede devolver una promesa o no devolver nada; el
     resultado se pasa tal cual, y si se cae, lo escrito se devuelve
     igualmente antes de propagar el error. */

  var TIPOS_DE_ESCRIBIR = {
    text: 1, search: 1, email: 1, tel: 1, url: 1, number: 1, password: 1,
    date: 1, 'datetime-local': 1, month: 1, time: 1, week: 1
  };

  function claveDelCampo(el, clavePara) {
    if (el.id) return el.id;
    var puesta = el.getAttribute('data-clave');
    if (puesta) return puesta;
    if (!clavePara) return '';
    try { return clavePara(el) || ''; } catch (e) { return ''; }
  }

  function camposDeEscribir(raiz, clavePara) {
    var buenos = [];
    var todos;
    try { todos = raiz.querySelectorAll('textarea, input'); } catch (e) { return buenos; }
    Array.prototype.forEach.call(todos, function (el) {
      if (el.tagName === 'INPUT' && !TIPOS_DE_ESCRIBIR[(el.type || 'text').toLowerCase()]) return;
      if (!claveDelCampo(el, clavePara)) return;
      buenos.push(el);
    });
    return buenos;
  }

  function conservandoLoEscrito(raiz, hacer, clavePara) {
    if (!raiz) return hacer();

    var apuntes = [];
    var conFoco = document.activeElement;
    camposDeEscribir(raiz, clavePara).forEach(function (el) {
      var apunte = { clave: claveDelCampo(el, clavePara), valor: el.value, tenia: el === conFoco,
                     inicio: null, fin: null };
      if (apunte.tenia) {
        /* selectionStart no existe en todos los tipos de campo (los de
           fecha, por ejemplo, lo dan por error): sin cursor apuntado,
           se devuelve solo el foco. */
        try { apunte.inicio = el.selectionStart; apunte.fin = el.selectionEnd; } catch (e) { /* sin cursor */ }
      }
      apuntes.push(apunte);
    });

    function devolver() {
      if (!apuntes.length) return;
      var porClave = {};
      camposDeEscribir(raiz, clavePara).forEach(function (el) {
        var clave = claveDelCampo(el, clavePara);
        if (!porClave[clave]) porClave[clave] = el;
      });
      var devolverElFocoA = null, apunteDelFoco = null;
      apuntes.forEach(function (apunte) {
        var el = porClave[apunte.clave];
        if (!el) return;            /* ese campo ya no existe: no pasa nada */
        if (apunte.valor && !el.value) {
          try { el.value = apunte.valor; } catch (e) { /* no se ha podido: se deja como esté */ }
        }
        if (apunte.tenia) { devolverElFocoA = el; apunteDelFoco = apunte; }
      });
      if (!devolverElFocoA) return;
      try {
        devolverElFocoA.focus({ preventScroll: true });
        if (apunteDelFoco.inicio !== null && devolverElFocoA.setSelectionRange) {
          devolverElFocoA.setSelectionRange(apunteDelFoco.inicio, apunteDelFoco.fin);
        }
      } catch (e) { /* el campo ya no admite foco: se deja como esté */ }
    }

    var salida;
    try { salida = hacer(); }
    catch (e) { devolver(); throw e; }

    if (salida && typeof salida.then === 'function') {
      return salida.then(
        function (v) { devolver(); return v; },
        function (e) { devolver(); throw e; }
      );
    }
    devolver();
    return salida;
  }

  /* ---------- el menú de tres puntos de una fila (17-sep-2026, fila 36,
     docs/FILAS-QUE-NO-SE-ESTRUJAN.md) ----------

     `botones` es una lista de elementos <button> ya montados, con su
     propio onclick puesto (los mismos que hoy se cuelgan sueltos de la
     fila). Se devuelve un envoltorio para colgar en la fila, con un
     botón de tres puntos que despliega esos botones debajo, anclado a
     él. Se cierra al elegir uno, al pulsar fuera y con Escape.

     No abre ningún U.preguntar: es un desplegable propio, así que la
     regla de "un solo cuadro a la vez" sigue intacta.

     Los botones viven siempre en el documento (dentro del envoltorio,
     ocultos con la clase "oculto" hasta que se abre), no solo cuando el
     menú está desplegado: así aplicarModoConsulta (que recorre todo
     #ficha-asunto-cuerpo con querySelectorAll) los alcanza y los apaga
     igual que a los demás, estén el menú abierto o cerrado. Y así otra
     pieza (js/copiar.js, con el botón "Copiar") puede seguir
     añadiendo botones al menú después de montado, buscándolo por su
     clase ("fila-menu"). */
  function menuDeAcciones(botones) {
    var envoltorio = document.createElement('div');
    envoltorio.className = 'fila-menu-envoltorio';
    if (!botones || !botones.length) return envoltorio;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'fila-menu-btn';
    boton.title = 'Más acciones';
    boton.setAttribute('aria-haspopup', 'true');
    boton.setAttribute('aria-expanded', 'false');
    boton.textContent = '⋮';

    var menu = document.createElement('div');
    menu.className = 'fila-menu oculto';
    botones.forEach(function (b) { menu.appendChild(b); });

    function abierto() { return !menu.classList.contains('oculto'); }

    function cerrar() {
      if (!abierto()) return;
      menu.classList.add('oculto');
      boton.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', alPulsarFuera, true);
      document.removeEventListener('keydown', alPulsarTecla, true);
    }
    function alPulsarFuera(e) { if (!envoltorio.contains(e.target)) cerrar(); }
    function alPulsarTecla(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }

    boton.onclick = function (e) {
      e.stopPropagation();
      if (abierto()) { cerrar(); return; }
      menu.classList.remove('oculto');
      boton.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', alPulsarFuera, true);
      document.addEventListener('keydown', alPulsarTecla, true);
    };

    /* Al elegir cualquiera de los botones del menú, se cierra: el click
       ya ha disparado el onclick propio del botón (que puede seguir
       siendo async) antes de llegar aquí, así que no se le quita nada. */
    menu.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('button')) cerrar();
    });

    envoltorio.appendChild(boton);
    envoltorio.appendChild(menu);
    return envoltorio;
  }

  /* ==========================================================
     COPIAR AL PORTAPAPELES (fila 71, docs/COSAS-REPETIDAS.md)

     Doce sitios lo hacían cada uno a su manera: unos solo con
     navigator.clipboard, otros con una reserva por si el navegador no
     lo deja, y la mitad sin avisar cuando fallaba. Queda uno solo.
     ========================================================== */

  function copiarALaAntigua(texto) {
    try {
      var c = document.createElement('textarea');
      c.value = texto;
      c.setAttribute('readonly', '');
      c.style.cssText = 'position:fixed;top:-1000px;left:-1000px';
      document.body.appendChild(c);
      c.select();
      var ok = document.execCommand('copy');
      c.parentNode.removeChild(c);
      return ok;
    } catch (e) { return false; }
  }

  /* Copia `texto` al portapapeles. Si se le pasa `boton`, al terminar
     le pone "Copiado" (con el aviso azul de boton-marcado) y lo
     devuelve a su texto de antes al cabo de 1.400 ms. Si el navegador
     no deja copiar, avisa con U.aviso en vez de quedarse callado.

     `opciones.avisoFallo` cambia el mensaje del aviso; `opciones.sinAviso`
     lo calla del todo, para cuando quien llama ya avisa por su cuenta
     (así lo usa `Copiar.copiar`, en js/copiar.js, que no lleva botón).

     Devuelve una promesa que se cumple con true o false. */
  function copiar(texto, boton, opciones) {
    opciones = opciones || {};
    function marcar(ok) {
      if (!ok) {
        if (!opciones.sinAviso) aviso(opciones.avisoFallo || 'No he podido copiarlo.', 'malo');
        return false;
      }
      if (boton) {
        var antes = boton.textContent;
        boton.textContent = 'Copiado';
        boton.classList.add('boton-marcado');
        setTimeout(function () {
          boton.textContent = antes;
          boton.classList.remove('boton-marcado');
        }, 1400);
      }
      return true;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return marcar(true); })
        .catch(function () { return marcar(copiarALaAntigua(texto)); });
    }
    return Promise.resolve(marcar(copiarALaAntigua(texto)));
  }

  U.conservandoLoEscrito = conservandoLoEscrito;
  U.menuDeAcciones = menuDeAcciones;
  U.copiar = copiar;
})();
