/* ============================================================
   huecos-buscador.js — el botón "Insertar hueco" y su cuadro pequeño
   con buscador (17-sep-2026, docs/HUECOS-INSERTAR.md, fila 35 de
   docs/COLA.md).

   Antes, el editor de una plantilla de correo pintaba encima del
   cuadro de texto un botón por cada hueco del catálogo: más de
   treinta, en un muro que ocupaba casi toda la pantalla y tapaba el
   nombre de la plantilla y el tipo de asunto. El catálogo no sobra;
   lo que sobraba era tenerlo todo desplegado a la vez.

   Aquí vive un solo sitio con el cuadro: un buscador flotante que se
   abre pegado al botón, filtra por nombre en claro y por código, se
   maneja con las flechas y Enter, se cierra con Escape, y mete el
   hueco elegido donde estuviera el cursor.

   No es un segundo U.preguntar: el cuadro de la plantilla YA es el
   único U.preguntar de la aplicación y sigue abierto debajo. Este es
   un elemento aparte, colgado del <body> con position:fixed, por
   encima de la capa del cuadro (z-index 50) y por debajo de los
   mensajes (60), y calculado a partir de dónde esté el botón. Mismo
   patrón de cierre que el menú de los tres puntos de Ajustes
   (App.botonMenuTarjeta, js/ajustes.js): mousedown fuera o Escape,
   los dos en fase de captura.

   CÓMO SE USA

     HuecosBuscador.montar({
       boton: <button>,            // el que abre el cuadro
       campos: [asunto, texto],    // dónde puede entrar el hueco
       huecos: [{clave, etiqueta}] // opcional; por defecto Plantillas.HUECOS
     });

   `campos` va en el orden en que están en el formulario. Se recuerda
   cuál tuvo el foco por última vez, y con él la posición del cursor
   (al abrir el buscador el foco se va, así que hay que guardarla
   antes). Si todavía no se ha tocado ninguno, el hueco entra al final
   del ÚLTIMO de la lista, que es siempre el cuadro de texto grande.

   Tras insertar se lanza un evento `input` en el campo, para que la
   vista previa de quien nos llame se repinte sola sin tener que
   enterarse de nada.
   ============================================================ */
(function () {

  var ANCHO = 340;        /* el ancho del cuadro, en píxeles */
  var abierto = null;     /* el cuadro que esté abierto ahora mismo, si hay alguno */

  /* ---------- el cuadro flotante ---------- */

  function cerrar() {
    if (!abierto) return;
    var c = abierto;
    abierto = null;
    document.removeEventListener('mousedown', c.alPulsarFuera, true);
    document.removeEventListener('keydown', c.alPulsarTecla, true);
    window.removeEventListener('resize', c.alMover, true);
    if (c.caja && c.caja.parentNode) c.caja.parentNode.removeChild(c.caja);
  }

  function colocar(caja, boton) {
    var r = boton.getBoundingClientRect();
    var ancho = Math.min(ANCHO, window.innerWidth - 16);
    var izquierda = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8));
    caja.style.width = ancho + 'px';
    caja.style.left = izquierda + 'px';

    /* Debajo del botón si cabe; si no, encima. */
    var alto = caja.offsetHeight || 260;
    if (r.bottom + 6 + alto <= window.innerHeight - 8) {
      caja.style.top = (r.bottom + 6) + 'px';
    } else {
      caja.style.top = Math.max(8, r.top - 6 - alto) + 'px';
    }
  }

  /* ---------- lo que se sabe de cada campo ----------

     De cada campo se apunta, al perder el foco, dónde estaba el
     cursor. `ultimo` es el campo que lo tuvo la última vez. */

  function vigilarCampos(campos) {
    var estado = { ultimo: null, inicio: null, fin: null };
    campos.forEach(function (campo) {
      if (!campo) return;
      function apuntar() {
        estado.ultimo = campo;
        estado.inicio = campo.selectionStart;
        estado.fin = campo.selectionEnd;
      }
      campo.addEventListener('focus', function () { estado.ultimo = campo; });
      campo.addEventListener('blur', apuntar);
      campo.addEventListener('keyup', apuntar);
      campo.addEventListener('mouseup', apuntar);
      campo.addEventListener('input', apuntar);
    });
    return estado;
  }

  /* ---------- meter el hueco donde toca ---------- */

  function insertarEn(campo, inicio, fin, texto) {
    var valor = campo.value || '';
    var a = (typeof inicio === 'number' && inicio >= 0) ? Math.min(inicio, valor.length) : valor.length;
    var b = (typeof fin === 'number' && fin >= 0) ? Math.min(fin, valor.length) : a;
    if (b < a) { var t = a; a = b; b = t; }
    campo.value = valor.slice(0, a) + texto + valor.slice(b);
    campo.focus();
    try {
      campo.selectionStart = campo.selectionEnd = a + texto.length;
    } catch (e) { /* un <input> raro que no deje: el texto ya está puesto */ }
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ============================================================
     MONTAR
     ============================================================ */

  function montar(opciones) {
    var boton = opciones.boton;
    var campos = (opciones.campos || []).filter(function (c) { return !!c; });
    if (!boton || !campos.length) return;

    var estado = vigilarCampos(campos);
    var porDefecto = campos[campos.length - 1];

    boton.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (abierto) { cerrar(); return; }
      abrir();
    });

    /* El botón no se puede llevar el foco del campo: si lo hiciera,
       `estado` apuntaría al propio botón y se perdería el cursor. */
    boton.addEventListener('mousedown', function (ev) { ev.preventDefault(); });

    function abrir() {
      var lista = opciones.huecos ||
        ((window.Plantillas && Plantillas.HUECOS) || []);

      var caja = document.createElement('div');
      caja.className = 'huecos-cuadro';
      caja.id = 'huecos-cuadro';
      caja.innerHTML =
        '<input type="search" class="campo huecos-buscar" id="huecos-buscar" ' +
          'placeholder="Buscar un hueco: escribe unas letras" autocomplete="off">' +
        '<div class="huecos-lista" id="huecos-lista"></div>' +
        '<p class="huecos-pie">Flechas y Enter para elegir. Escape para cerrar.</p>';
      document.body.appendChild(caja);

      var campoBuscar = caja.querySelector('#huecos-buscar');
      var cajaLista = caja.querySelector('#huecos-lista');
      var visibles = [];
      var elegido = 0;

      function pintar() {
        var q = U.normalizar(campoBuscar.value);
        visibles = lista.filter(function (h) {
          if (!q) return true;
          return U.normalizar(h.etiqueta + ' ' + h.clave).indexOf(q) !== -1;
        });
        elegido = 0;
        cajaLista.innerHTML = '';
        if (!visibles.length) {
          cajaLista.innerHTML = '<div class="huecos-vacio">Ningún hueco se llama así.</div>';
          return;
        }
        visibles.forEach(function (h, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'huecos-opcion' + (i === 0 ? ' elegido' : '');
          b.setAttribute('data-clave', h.clave);
          b.innerHTML = '<span class="huecos-nombre">' + U.escapar(h.etiqueta) + '</span>' +
            '<span class="huecos-codigo">{' + U.escapar(h.clave) + '}</span>';
          b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
          b.onclick = function () { elegir(h); };
          cajaLista.appendChild(b);
        });
        colocar(caja, boton);
      }

      function marcar(i) {
        if (!visibles.length) return;
        elegido = (i + visibles.length) % visibles.length;
        var todos = cajaLista.querySelectorAll('.huecos-opcion');
        for (var n = 0; n < todos.length; n++) {
          todos[n].classList.toggle('elegido', n === elegido);
        }
        if (todos[elegido] && todos[elegido].scrollIntoView) {
          todos[elegido].scrollIntoView({ block: 'nearest' });
        }
      }

      function elegir(h) {
        var campo = estado.ultimo || porDefecto;
        var inicio = (estado.ultimo === campo) ? estado.inicio : null;
        var fin = (estado.ultimo === campo) ? estado.fin : null;
        cerrar();
        insertarEn(campo, inicio, fin, '{' + h.clave + '}');
        /* El campo se queda con el cursor detrás de lo insertado, y
           lo apuntamos ya, por si se pide otro hueco seguido sin
           volver a tocar el texto. */
        estado.ultimo = campo;
        estado.inicio = estado.fin = campo.selectionStart;
      }

      campoBuscar.addEventListener('input', pintar);
      campoBuscar.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowDown') { ev.preventDefault(); marcar(elegido + 1); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); marcar(elegido - 1); }
        else if (ev.key === 'Enter') {
          ev.preventDefault();
          if (visibles[elegido]) elegir(visibles[elegido]);
        }
      });

      /* Escape y el pulsar fuera, en captura: por debajo hay un
         U.preguntar abierto y js/usabilidad.js cierra ese cuadro con
         Escape. Aquí se para la tecla antes de que llegue allí. */
      function alPulsarTecla(ev) {
        if (ev.key !== 'Escape') return;
        ev.preventDefault();
        ev.stopPropagation();
        cerrar();
      }
      function alPulsarFuera(ev) {
        if (caja.contains(ev.target) || boton.contains(ev.target)) return;
        cerrar();
      }
      function alMover() { colocar(caja, boton); }

      abierto = { caja: caja, alPulsarTecla: alPulsarTecla, alPulsarFuera: alPulsarFuera, alMover: alMover };
      document.addEventListener('mousedown', alPulsarFuera, true);
      document.addEventListener('keydown', alPulsarTecla, true);
      window.addEventListener('resize', alMover, true);

      pintar();
      colocar(caja, boton);
      campoBuscar.focus();
    }
  }

  /* Un botón ya hecho, para no repetir las mismas cuatro líneas en
     cada formulario que lo quiera. */
  function boton(texto) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-hueco';
    b.textContent = texto || 'Insertar hueco';
    return b;
  }

  window.HuecosBuscador = { montar: montar, boton: boton, cerrar: cerrar };

})();
