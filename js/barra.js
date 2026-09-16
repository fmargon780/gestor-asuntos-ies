/* ============================================================
   barra.js — la barra azul de la izquierda, plegada.

   La barra ocupa sitio todo el rato, y de lo que hay en ella solo se
   usa una cosa muchas veces al día: crear un asunto nuevo. Así que la
   barra nace plegada, y lo de crear pasa a un botón grande dentro de
   la propia pantalla de asuntos abiertos.

   Plegada queda una franja estrecha con el botón de las tres rayas.
   Al pulsarlo se abre entera; al elegir una pantalla se vuelve a
   plegar sola.

   Cómo la dejó cada uno se recuerda en su navegador, así que si él
   prefiere tenerla siempre abierta, la abre una vez y se queda.
   ============================================================ */
(function () {

  var CLAVE = 'gestor-barra';       /* 'plegada' o 'abierta' */

  function $(id) { return document.getElementById(id); }

  function comoEstaba() {
    try {
      var v = window.localStorage.getItem(CLAVE);
      return v === 'abierta' ? 'abierta' : 'plegada';
    } catch (e) { return 'plegada'; }
  }

  function recordar(estado) {
    try { window.localStorage.setItem(CLAVE, estado); } catch (e) {}
  }

  function aplicacion() { return $('aplicacion'); }

  function poner(estado) {
    var app = aplicacion();
    if (!app) return;
    app.classList.toggle('barra-plegada', estado === 'plegada');
    var b = $('btn-barra');
    if (b) b.title = estado === 'plegada' ? 'Abrir el menú' : 'Esconder el menú';
  }

  function estaPlegada() {
    var app = aplicacion();
    return !!(app && app.classList.contains('barra-plegada'));
  }

  function cambiar() {
    var nuevo = estaPlegada() ? 'abierta' : 'plegada';
    poner(nuevo);
    recordar(nuevo);
  }

  /* ---------- el botón de las tres rayas ---------- */

  function ponerElBoton() {
    var barra = document.querySelector('#aplicacion .lateral');
    if (!barra || $('btn-barra')) return;

    var b = document.createElement('button');
    b.id = 'btn-barra';
    b.className = 'barra-boton';
    b.type = 'button';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>';
    b.onclick = cambiar;
    barra.insertBefore(b, barra.firstChild);

    /* Al elegir una pantalla, la barra se pliega sola: se abrió para
       eso. Si él la quiere fija, la deja abierta desde el botón. */
    Array.prototype.forEach.call(barra.querySelectorAll('.pestana'), function (p) {
      p.addEventListener('click', function () {
        if (comoEstaba() === 'plegada') poner('plegada');
      });
    });
  }

  /* ---------- el icono de Ajustes, para cuando está plegada ----------

     Plegada, la barra esconde todas las pestañas (css/barra.css) y solo
     deja el botón de las tres rayas: para ir a Ajustes había que abrirla
     primero. Este icono lleva directo, y solo se ve plegada (B3 de
     docs/AJUSTES-AGIL.md). */

  function ponerElBotonDeAjustes() {
    var barra = document.querySelector('#aplicacion .lateral');
    if (!barra || $('btn-barra-ajustes')) return;

    var b = document.createElement('button');
    b.id = 'btn-barra-ajustes';
    b.className = 'barra-boton barra-boton-ajustes';
    b.type = 'button';
    b.title = 'Ajustes';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"/>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>' +
      '</svg>';
    b.onclick = function () { App.ir('ajustes'); };

    var btnRayas = $('btn-barra');
    if (btnRayas && btnRayas.parentNode) btnRayas.parentNode.insertBefore(b, btnRayas.nextSibling);
    else barra.insertBefore(b, barra.firstChild);
  }

  /* ---------- la entrada de "Qué me toca" (fila 16) ----------

     Un botón .pestana más, junto a los que ya hay, con su cuenta de
     vencidos (js/que-me-toca.js la mantiene al día). Como se añade
     aquí y no está en el index.html de partida, el bucle de
     nucleo.js que pone el onclick a los .pestana ya existentes no lo
     alcanza: se le pone a mano. El resaltado como "activa" sí lo
     hace solo App.ir, que vuelve a mirar los .pestana que haya cada
     vez que se llama (js/nucleo.js). */

  function ponerLaEntradaDeQueMeToca() {
    if ($('pestana-que-me-toca')) return;
    var referencia = document.querySelector('.pestana[data-pantalla="personas"]');
    if (!referencia || !referencia.parentNode) return;

    var b = document.createElement('button');
    b.id = 'pestana-que-me-toca';
    b.className = 'pestana';
    b.type = 'button';
    b.dataset.pantalla = 'que-me-toca';
    b.innerHTML = '<span>Qué me toca</span><span class="cuenta oculto" id="cuenta-que-me-toca"></span>';
    b.onclick = function () { if (window.QueMeToca) window.QueMeToca.abrir(); };
    b.addEventListener('click', function () {
      if (comoEstaba() === 'plegada') poner('plegada');
    });
    referencia.parentNode.insertBefore(b, referencia.nextSibling);
  }

  /* ---------- el botón grande de Nuevo asunto ---------- */

  function ponerElDeNuevoAsunto() {
    if ($('btn-nuevo-asunto')) return;
    var cabecera = document.querySelector('#pantalla-abiertos .cabecera');
    if (!cabecera) return;
    var titulo = cabecera.querySelector('h2');
    if (!titulo) return;

    var b = document.createElement('button');
    b.id = 'btn-nuevo-asunto';
    b.type = 'button';
    b.className = 'boton boton-principal boton-nuevo';
    b.innerHTML = '<span class="boton-nuevo-mas">+</span><span>Nuevo asunto</span>';
    b.onclick = function () { App.ir('nuevo'); };
    titulo.parentNode.insertBefore(b, titulo.nextSibling);
  }

  function arrancar() {
    ponerElBoton();
    ponerElBotonDeAjustes();
    ponerLaEntradaDeQueMeToca();
    ponerElDeNuevoAsunto();
    poner(comoEstaba());
  }

  arrancar();
  if (!$('btn-barra')) document.addEventListener('DOMContentLoaded', arrancar);

})();
