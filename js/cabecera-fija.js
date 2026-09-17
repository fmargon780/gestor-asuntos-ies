/* ============================================================
   cabecera-fija.js — la cabecera de cada pantalla se queda pegada
   arriba al bajar, y se encoge a una sola línea (17/18-sep-2026,
   fila 46, docs/CABECERA-QUE-SE-QUEDA.md).

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
     a 80px, se despliega a 40px, para que no parpadee en el límite.
   - Un MutationObserver sobre <main class="contenido"> cubre dos
     cosas a la vez, sin tener que engancharse a App.ir ni tocar
     js/ficha-asunto.js: que cambie qué pantalla está visible (la
     clase "oculto"), y que una pantalla se repinte por dentro (la
     ficha rehace su cabecera entera con innerHTML en cada pintar(),
     por encima sigue U.conservandoLoEscrito) sin perder el estado
     encogido ni lo que se esté escribiendo. */
(function () {
  'use strict';

  if (window.CabeceraFija) return; /* el nombre ya estaba cogido */

  var ENCOGE_A = 80;
  var DESPLIEGA_A = 40;

  var cabeceraActual = null;
  var encogidaActual = false;
  var pendiente = false;

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

  function aplicar() {
    var pantalla = pantallaVisible();
    var cabecera = cabeceraDe(pantalla);

    if (cabecera !== cabeceraActual) {
      if (cabeceraActual) cabeceraActual.classList.remove('encogida');
      cabeceraActual = cabecera;
    }
    if (!cabeceraActual) return;

    var y = window.scrollY || window.pageYOffset || 0;
    if (y > ENCOGE_A) encogidaActual = true;
    else if (y < DESPLIEGA_A) encogidaActual = false;
    /* entre 40 y 80: se queda como estaba (la histéresis) */

    cabeceraActual.classList.toggle('encogida', encogidaActual);
    actualizarViendo(cabeceraActual, pantalla);

    try {
      document.documentElement.style.setProperty(
        '--cabecera-fija-alto', Math.round(cabeceraActual.getBoundingClientRect().height) + 'px'
      );
    } catch (e) { /* medir el alto es solo para Ajustes; sin él no pasa nada */ }
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    var pedirFrame = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    pedirFrame(function () { pendiente = false; aplicar(); });
  }

  function arrancar() {
    window.addEventListener('scroll', programar, { passive: true });
    window.addEventListener('resize', programar, { passive: true });

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
