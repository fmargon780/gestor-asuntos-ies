/* ============================================================
   salir.js — el botón de Salir.

   La aplicación es una página web: el navegador no deja que una
   página se cierre a sí misma. Así que salir aquí significa cerrar
   la sesión: se vuelve a la pantalla de entrada, con las carpetas ya
   señaladas, para que entre otra persona con su nombre.

   No hay nada que guardar al salir: todo se escribe en las carpetas
   en el momento en que se hace.

   Se engancha solo al pie de la barra de la izquierda, debajo de
   Ajustes. Por eso index.html solo necesita la línea del <script>.
   ============================================================ */
(function () {

  function poner() {
    var pie = document.querySelector('.lateral-pie');
    if (!pie || document.getElementById('btn-salir')) return;

    var b = document.createElement('button');
    b.id = 'btn-salir';
    b.className = 'pestana pestana-salir';
    b.innerHTML =
      '<span>Salir</span>' +
      '<svg class="salir-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14"/>' +
      '<path d="M16.5 8.5 20 12l-3.5 3.5"/><path d="M20 12h-9"/></svg>';

    b.onclick = async function () {
      var ok = await U.preguntar(
        'Salir de la aplicación',
        '<p>Vuelves a la pantalla de entrada. Ahí puede entrar otra persona con su nombre.</p>' +
        '<p class="nota">No se pierde nada: todo lo que has hecho ya está escrito en las carpetas. ' +
        'Las dos carpetas siguen señaladas en este ordenador.</p>',
        'Salir');
      if (!ok) return;
      location.reload();
    };

    /* Antes del rótulo de la sesión, que es el último del pie. */
    var usuario = document.getElementById('usuario-pie');
    if (usuario) pie.insertBefore(b, usuario);
    else pie.appendChild(b);
  }

  /* El <script> va al final del body, así que la barra ya está puesta.
     Por si algún día se moviera de sitio, se reintenta al terminar de
     cargar la página. */
  poner();
  if (!document.getElementById('btn-salir')) {
    document.addEventListener('DOMContentLoaded', poner);
  }

})();
