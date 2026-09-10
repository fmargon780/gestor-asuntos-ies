/* ============================================================
   lector.js — el panel de la derecha para leer sin dejar de trabajar.

   La aplicación se queda a la izquierda y lo que se lee sale a la
   derecha, en una columna fija. Así se puede mirar un correo y montar
   el asunto a la vez, sin cambiar de pestaña.

   Se usa desde otros módulos:

     Lector.abrir({ titulo, pie, blob, botones });
     Lector.cerrar();

   'blob' es el fichero tal cual sale del disco. El panel se encarga de
   enseñarlo y de soltarlo al cerrar. 'botones' es una lista de
   { texto, alPulsar } que sale en la cabecera del panel: ahí es donde
   pone, por ejemplo, "Abrir en Gmail".

   Se cierra con la tecla Escape o con la equis.
   ============================================================ */
(function () {

  var url = '';        /* la dirección temporal del fichero que se está viendo */

  function $(id) { return document.getElementById(id); }

  function panel() {
    var p = $('lector');
    if (p) return p;
    p = document.createElement('aside');
    p.id = 'lector';
    p.className = 'oculto';
    p.innerHTML =
      '<div class="lector-cabecera">' +
        '<div class="lector-texto">' +
          '<div class="lector-titulo" id="lector-titulo"></div>' +
          '<div class="lector-pie" id="lector-pie"></div>' +
        '</div>' +
        '<div class="lector-botones" id="lector-botones"></div>' +
        '<button type="button" class="lector-cerrar" id="lector-cerrar" ' +
          'title="Cerrar el panel">✕</button>' +
      '</div>' +
      '<div class="lector-cuerpo"><iframe id="lector-marco" title="Lo que se está leyendo"></iframe></div>';
    document.body.appendChild(p);
    $('lector-cerrar').onclick = cerrar;
    return p;
  }

  function soltar() {
    if (!url) return;
    try { URL.revokeObjectURL(url); } catch (e) {}
    url = '';
  }

  function cerrar() {
    var p = $('lector');
    if (!p) return;
    var marco = $('lector-marco');
    if (marco) marco.src = 'about:blank';
    soltar();
    p.classList.add('oculto');
    document.body.classList.remove('con-lector');
  }

  function abrir(opciones) {
    var o = opciones || {};
    var p = panel();

    $('lector-titulo').textContent = o.titulo || '';
    $('lector-pie').textContent = o.pie || '';

    var caja = $('lector-botones');
    caja.innerHTML = '';
    (o.botones || []).forEach(function (b) {
      if (!b || !b.texto) return;
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton';
      boton.textContent = b.texto;
      boton.onclick = b.alPulsar || function () {};
      caja.appendChild(boton);
    });

    soltar();
    if (o.blob) {
      url = URL.createObjectURL(o.blob);
      $('lector-marco').src = url;
    } else if (o.url) {
      $('lector-marco').src = o.url;
    }

    p.classList.remove('oculto');
    document.body.classList.add('con-lector');
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && document.body.classList.contains('con-lector')) cerrar();
  });

  window.Lector = { abrir: abrir, cerrar: cerrar };

})();
