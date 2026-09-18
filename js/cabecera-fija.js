/* ============================================================
   cabecera-fija.js — la cabecera de cada pantalla se queda pegada
   arriba al bajar, y se encoge a una sola línea (17/18-sep-2026,
   fila 46, docs/CABECERA-QUE-SE-QUEDA.md; sin temblor, 18-sep-2026,
   fila 50, docs/CABECERA-NO-TIEMBLA.md).

   Un solo mecanismo para las siete pantallas: no sabe nada de ninguna
   pantalla en concreto, salvo el caso de "Por clasificar" (punto 4
   del documento), que solo mira una tarjeta ya marcada por
   js/documentos-sueltos.js, sin tocar ese fichero ni js/visor.js.

   Cómo funciona:
   - Busca, dentro de la pantalla visible (section.pantalla sin la
     clase "oculto"), su cabecera: header.cabecera o
     header.ficha-cabecera.
   - Escucha el desplazamiento de la ventana (el que se mueve es
     .contenido, no ningún contenedor con overflow: css/vista.css ya
     deja que sea la ventana quien decide el ancho de verdad, y aquí
     pasa lo mismo con el alto) y, con requestAnimationFrame, pone o
     quita la clase "encogida" según el umbral, con histéresis: encoge
     a 120px, se despliega a 24px, para que no parpadee en el límite.
   - Un MutationObserver sobre <main class="contenido"> cubre dos
     cosas a la vez, sin tener que engancharse a App.ir ni tocar
     js/ficha-asunto.js: que cambie qué pantalla está visible (la
     clase "oculto"), y que una pantalla se repinte por dentro (la
     ficha rehace su cabecera entera con innerHTML en cada pintar(),
     por encima sigue U.conservandoLoEscrito) sin perder el estado
     encogido ni lo que se esté escribiendo.

   FILA 50 — el temblor: en una pantalla cuyo contenido apenas pasa del
   alto de la ventana, encogerse le quita alto de golpe al documento
   entero; el navegador recorta `scrollY` al nuevo máximo, ese valor
   recortado cae por debajo de DESPLIEGA_A, la cabecera se despliega
   otra vez, la página vuelve a crecer, y el gesto empuja otra vez por
   encima de ENCOGE_A: bucle. Tres arreglos, el primero de fondo y los
   otros dos de repuesto:
   1. Se guarda, por pantalla, el alto del documento con la cabecera
      desplegada (`alturaPorPantalla`, con la cabecera forzada
      desplegada un instante, sin que se note: leer `scrollHeight`
      fuerza el cálculo pero no el pintado). Al encogerse, si esa
      pantalla es corta (menos que el alto de la ventana + 400px), se
      calcula cuánto alto se ha perdido de verdad y se le devuelve a
      `main.contenido` con la variable `--cabecera-compensa`
      (`css/cabecera-fija.css`). Se vuelve a medir al cambiar de
      pantalla y al cambiar el tamaño de la ventana.
   2. Los umbrales de la histéresis se separan más (120/24, antes
      80/40): el salto de alto ya no puede ser mayor que la distancia
      entre los dos.
   3. Un candado de 400 ms: después de cada cambio de verdad (de
      desplegada a encogida o al revés) no se admite el cambio
      contrario hasta que pasen 400 ms. Un cambio en el mismo sentido
      (seguir encogida si ya lo estaba) no cuenta como cambio y no se
      bloquea. Al cambiar de pantalla el candado no se aplica: la
      pantalla nueva siempre empieza desplegada, sin esperar nada. */
(function () {
  'use strict';

  if (window.CabeceraFija) return; /* el nombre ya estaba cogido */

  var ENCOGE_A = 120;
  var DESPLIEGA_A = 24;
  var CANDADO_MS = 400;
  var MARGEN_PANTALLA_CORTA = 400;

  var pantallaActual = null;
  var cabeceraActual = null;
  var encogidaActual = false;
  var ultimoCambioEn = 0;
  var pendiente = false;

  /* El alto del documento con la cabecera desplegada, por pantalla
     (section.pantalla, que no se destruye entre un repintado y otro:
     solo su <header> de dentro cambia de referencia en la ficha). Se
     borra entera al cambiar el tamaño de la ventana. */
  var alturaPorPantalla = new WeakMap();

  function pantallaVisible() {
    var todas = document.querySelectorAll('section.pantalla');
    for (var i = 0; i < todas.length; i++) {
      if (!todas[i].classList.contains('oculto')) return todas[i];
    }
    return null;
  }

  function cabeceraDe(pantalla) {
    return pantalla ? pantalla.querySelector('header.cabecera, header.ficha-cabecera') : null;
  }

  /* ---------- el único caso especial: "Por clasificar" ----------

     Con un documento abierto en el panel de la derecha, la cabecera
     encogida añade "Viendo: <nombre>" y un botón "Ir a su fila". Solo
     mira la tarjeta que ya viene marcada (.tarjeta-abierta, puesta por
     js/documentos-sueltos.js); la visibilidad de este bloque la decide
     el CSS (solo se ve con la cabecera encogida), aquí solo se crea o
     se quita según haya o no tarjeta abierta. */
  function tarjetaAbierta(pantalla) {
    if (!pantalla || pantalla.id !== 'pantalla-abiertos') return null;
    return pantalla.querySelector('#lista-sueltos .tarjeta-abierta');
  }

  function irASuFila() {
    var t = tarjetaAbierta(pantallaVisible());
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function actualizarViendo(cabecera, pantalla) {
    var tarjeta = tarjetaAbierta(pantalla);
    var nombre = tarjeta ? tarjeta.dataset.suelto : '';
    var caja = cabecera.querySelector('.cabecera-viendo');

    if (!nombre) {
      if (caja) caja.remove();
      return;
    }
    if (!caja) {
      caja = document.createElement('div');
      caja.className = 'cabecera-viendo';
      var span = document.createElement('span');
      span.className = 'cabecera-viendo-nombre';
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton cabecera-viendo-ir';
      boton.textContent = 'Ir a su fila';
      boton.onclick = irASuFila;
      caja.appendChild(span);
      caja.appendChild(boton);
      cabecera.appendChild(caja);
    }
    var texto = 'Viendo: ' + nombre;
    var span2 = caja.querySelector('.cabecera-viendo-nombre');
    if (span2.textContent !== texto) span2.textContent = texto;
  }

  /* ---------- el mecanismo de verdad ---------- */

  function setCompensacion(px) {
    var valor = (px && px > 0) ? Math.round(px) : 0;
    document.documentElement.style.setProperty('--cabecera-compensa', valor + 'px');
  }

  /* El alto del documento con `cabecera` desplegada, para `pantalla`.
     Si ahora mismo está encogida, se despliega un instante para medir
     y se vuelve a encoger: leer `scrollHeight` fuerza el cálculo de la
     medida, no que se pinte, así que no se llega a ver el amago. */
  function medirBase(pantalla, cabecera) {
    var estabaEncogida = cabecera.classList.contains('encogida');
    if (estabaEncogida) {
      setCompensacion(0);
      cabecera.classList.remove('encogida');
    }
    alturaPorPantalla.set(pantalla, document.documentElement.scrollHeight);
    if (estabaEncogida) cabecera.classList.add('encogida');
  }

  /* Cuánto alto ha perdido el documento al encogerse, devuelto a
     `main.contenido` — pero solo en una pantalla corta: si ya tenía
     alto de sobra (más que la ventana más 400px), el problema del
     temblor no existe y no hay que añadir ningún hueco al final. */
  function aplicarCompensacion(pantalla, cabecera) {
    if (!cabecera || !cabecera.classList.contains('encogida')) { setCompensacion(0); return; }
    var base = alturaPorPantalla.get(pantalla);
    if (base == null || base >= window.innerHeight + MARGEN_PANTALLA_CORTA) { setCompensacion(0); return; }
    setCompensacion(0);   /* para medir sin que la compensación de antes se cuente sola */
    setCompensacion(base - document.documentElement.scrollHeight);
  }

  /* `realineacion` (fila 50): true cuando este cálculo lo dispara un
     cambio de tamaño de la ventana, no un scroll de verdad. Un
     redimensionado puede mover `scrollY` por su cuenta (el "scroll
     anchoring" del navegador, para que la vista no salte cuando algo
     de arriba cambia de alto al reflotar la rejilla de Ajustes con
     menos columnas): ese movimiento no lo ha pedido nadie, así que
     alinearse con él tampoco debe armar el candado, o bloquearía el
     siguiente scroll de verdad. */
  function aplicar(realineacion) {
    var pantalla = pantallaVisible();
    var cabecera = cabeceraDe(pantalla);
    var pantallaNueva = pantalla !== pantallaActual;

    if (cabecera !== cabeceraActual) {
      if (cabeceraActual) cabeceraActual.classList.remove('encogida');
      cabeceraActual = cabecera;
    }
    if (pantallaNueva) {
      pantallaActual = pantalla;
      encogidaActual = false;      /* una pantalla nueva siempre empieza desplegada */
      ultimoCambioEn = 0;          /* y el candado no tiene nada que bloquear todavía */
    }
    if (!cabeceraActual) { setCompensacion(0); return; }

    if (pantallaNueva || !alturaPorPantalla.has(pantalla)) medirBase(pantalla, cabeceraActual);

    var y = window.scrollY || window.pageYOffset || 0;
    var deseada = encogidaActual;
    if (y > ENCOGE_A) deseada = true;
    else if (y < DESPLIEGA_A) deseada = false;
    /* entre 24 y 120: se queda como estaba (la histéresis) */

    if (deseada !== encogidaActual) {
      if (pantallaNueva || realineacion) {
        /* la pantalla nueva se alinea con el scroll real que ya
           hubiera (el usuario no ha tocado nada): no arma el candado,
           para no bloquear el primer scroll de verdad que venga
           después. */
        encogidaActual = deseada;
      } else {
        var ahora = Date.now();
        if (ahora - ultimoCambioEn >= CANDADO_MS) {
          encogidaActual = deseada;
          ultimoCambioEn = ahora;
        }
        /* si no, el cambio contrario queda bloqueado por el candado:
           se reintentará solo, en el próximo scroll, cuando ya no lo
           esté */
      }
    }

    cabeceraActual.classList.toggle('encogida', encogidaActual);
    actualizarViendo(cabeceraActual, pantalla);
    aplicarCompensacion(pantalla, cabeceraActual);

    try {
      document.documentElement.style.setProperty(
        '--cabecera-fija-alto', Math.round(cabeceraActual.getBoundingClientRect().height) + 'px'
      );
    } catch (e) { /* medir el alto es solo para Ajustes; sin él no pasa nada */ }
  }

  var pendienteRealineacion = false;

  function programar(realineacion) {
    if (realineacion) pendienteRealineacion = true;
    if (pendiente) return;
    pendiente = true;
    var pedirFrame = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    pedirFrame(function () {
      pendiente = false;
      var r = pendienteRealineacion;
      pendienteRealineacion = false;
      aplicar(r);
    });
  }

  /* Al cambiar el tamaño de la ventana, los altos guardados ya no
     valen para nada: se tiran todos, y `aplicar()` los vuelve a medir
     él solo, uno a uno, según le toque a cada pantalla. */
  function alCambiarTamano() {
    alturaPorPantalla = new WeakMap();
    programar(true);
  }

  function arrancar() {
    window.addEventListener('scroll', programar, { passive: true });
    window.addEventListener('resize', alCambiarTamano, { passive: true });

    var raiz = document.querySelector('main.contenido') || document.body;
    if (window.MutationObserver) {
      new MutationObserver(programar).observe(raiz, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
      });
    }
    aplicar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  /* Por si una prueba quiere forzar la comprobación sin esperar al
     siguiente scroll (p.ej. justo después de abrir un documento). */
  window.CabeceraFija = { evaluar: aplicar };
})();
