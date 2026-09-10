/* ============================================================
   lector.js — el panel de la derecha para leer sin dejar de trabajar.

   La aplicación se queda a la izquierda y lo que se lee sale a la
   derecha, en una columna. Así se puede mirar un correo y montar el
   asunto a la vez, sin cambiar de pestaña.

   El borde izquierdo del panel se arrastra para darle más o menos
   sitio, y el ancho se recuerda para la próxima vez.

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

  /* ---------- el ancho, que se puede arrastrar ---------- */

  var CLAVE = 'gestor-lector-ancho';
  var MINIMO = 380;

  function techo() {
    return Math.max(MINIMO, Math.round(window.innerWidth * 0.72));
  }

  function anchoGuardado() {
    var v = 0;
    try { v = parseInt(window.localStorage.getItem(CLAVE), 10); } catch (e) {}
    if (!v) v = Math.round(window.innerWidth * 0.46);
    return Math.min(techo(), Math.max(MINIMO, v));
  }

  function ponerAncho(px, guardar) {
    var v = Math.min(techo(), Math.max(MINIMO, Math.round(px)));
    document.documentElement.style.setProperty('--ancho-lector', v + 'px');
    if (guardar) { try { window.localStorage.setItem(CLAVE, String(v)); } catch (e) {} }
    return v;
  }

  /* Arrastrar el borde. Mientras se arrastra no se selecciona texto ni
     se le pasan los movimientos al documento de dentro del marco. */
  function engancharTirador(tirador) {
    tirador.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      tirador.setPointerCapture(ev.pointerId);
      document.body.classList.add('estirando-lector');

      function mover(e) { ponerAncho(window.innerWidth - e.clientX, false); }
      function soltar(e) {
        tirador.removeEventListener('pointermove', mover);
        tirador.removeEventListener('pointerup', soltar);
        document.body.classList.remove('estirando-lector');
        ponerAncho(window.innerWidth - e.clientX, true);
      }

      tirador.addEventListener('pointermove', mover);
      tirador.addEventListener('pointerup', soltar);
    });

    /* Doble clic: se vuelve al reparto de siempre, la mitad y poco. */
    tirador.addEventListener('dblclick', function () {
      ponerAncho(window.innerWidth * 0.46, true);
    });
  }

  /* ---------- el panel ---------- */

  function panel() {
    var p = $('lector');
    if (p) return p;
    p = document.createElement('aside');
    p.id = 'lector';
    p.className = 'oculto';
    p.innerHTML =
      '<div class="lector-tirador" id="lector-tirador" title="Arrastra para hacerlo más ancho o más estrecho"></div>' +
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
    engancharTirador($('lector-tirador'));
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

    ponerAncho(anchoGuardado(), false);

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

  /* Si se achica la ventana, el panel no puede quedarse más ancho que ella. */
  window.addEventListener('resize', function () {
    if (!document.body.classList.contains('con-lector')) return;
    ponerAncho(anchoGuardado(), false);
  });

  window.Lector = { abrir: abrir, cerrar: cerrar };

})();
