/* ============================================================
   visor.js — el documento al lado del programa.

   Al pulsar un documento, la pantalla se parte: el programa se queda
   a la izquierda y el papel se ve a la derecha. El visor no se cierra
   al moverse por la aplicación, así que se puede cambiar el estado,
   escribir una nota o abrir otro asunto con el documento delante.

   El documento NO se enseña encogido para que quepa entero: se abre
   al ancho de la columna, que es como se lee. Se sube y se baja con
   la rueda, y se amplía y se reduce con los botones de arriba.

   Los PDF los pinta el propio navegador, con su barra de siempre.
   Las imágenes las pinta este fichero. Un Word o un Excel no se
   pueden ver dentro del navegador: esos se abren fuera, como antes.
   ============================================================ */
(function () {

  var ANCHO_MINIMO = 340;
  var NIVELES = [50, 75, 100, 125, 150, 200, 300, 400];

  var panel = null;
  var cuerpo = null;
  var rotulo = null;
  var acciones = null;
  var marcaZoom = null;
  var url = null;         /* la dirección temporal del documento */
  var clase = '';         /* 'pdf', 'imagen' o 'otro' */
  var nivel = 100;        /* el zoom, en porcentaje */
  var alAncho = true;     /* de partida, al ancho de la columna */

  /* Quién ha abierto lo que se está viendo (17-sep-2026, fila 25): un
     texto cualquiera que solo entiende quien lo puso (por ahora,
     "suelto:<nombre>" desde "Por clasificar"). Sirve para que esa
     pantalla sepa marcar la tarjeta que corresponde y cerrar el visor
     solo si el documento deja de estar ahí, sin que este fichero sepa
     nada de esa lista. */
  var marcador = null;
  var nombreAbierto = '';   /* el documento que se está viendo (fila 107: el chip marcado) */
  var oyentes = [];

  function avisar() {
    oyentes.slice().forEach(function (fn) { try { fn(marcador); } catch (e) {} });
  }

  function $(id) { return document.getElementById(id); }

  /* ---------- el ancho de la columna, que se recuerda ---------- */

  function anchoGuardado() {
    var v = 0;
    try { v = parseInt(window.localStorage.getItem('ancho-visor'), 10); } catch (e) {}
    if (!v || v < ANCHO_MINIMO) v = Math.round(Math.min(720, window.innerWidth * 0.45));
    return v;
  }

  function ponerAncho(px) {
    var tope = Math.max(ANCHO_MINIMO, window.innerWidth - 420);
    var v = Math.max(ANCHO_MINIMO, Math.min(px, tope));
    document.documentElement.style.setProperty('--ancho-visor', v + 'px');
    try { window.localStorage.setItem('ancho-visor', String(v)); } catch (e) {}
  }

  /* ---------- la columna ---------- */

  function construir() {
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'visor-lateral';
    panel.className = 'oculto';
    panel.innerHTML =
      '<div class="visor-tirador" id="visor-tirador" title="Arrastra para ensanchar o estrechar"></div>' +
      '<div class="visor-cabecera">' +
        '<div class="visor-nombre" id="visor-nombre"></div>' +
        '<div class="visor-botones">' +
          '<button type="button" class="boton" id="visor-menos" title="Reducir">−</button>' +
          '<span class="visor-zoom" id="visor-zoom"></span>' +
          '<button type="button" class="boton" id="visor-mas" title="Ampliar">+</button>' +
          '<button type="button" class="boton" id="visor-ancho" title="Al ancho de la columna">Ancho</button>' +
          '<button type="button" class="boton" id="visor-fuera" title="Abrirlo en otra pestaña">Fuera</button>' +
          '<button type="button" class="boton" id="visor-cerrar" title="Cerrar el visor">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="visor-acciones oculto" id="visor-acciones"></div>' +
      '<div class="visor-cuerpo" id="visor-cuerpo"></div>';
    document.body.appendChild(panel);

    cuerpo = $('visor-cuerpo');
    rotulo = $('visor-nombre');
    acciones = $('visor-acciones');
    marcaZoom = $('visor-zoom');

    $('visor-cerrar').onclick = cerrar;
    $('visor-menos').onclick = function () { cambiarZoom(-1); };
    $('visor-mas').onclick = function () { cambiarZoom(1); };
    $('visor-ancho').onclick = function () { alAncho = true; pintarDocumento(); };
    $('visor-fuera').onclick = function () { if (url) window.open(url, '_blank'); };

    prepararTirador();
    ponerAncho(anchoGuardado());
    return panel;
  }

  /* Arrastrando el borde izquierdo se ensancha o se estrecha. */
  function prepararTirador() {
    var tirador = $('visor-tirador');
    var arrastrando = false;

    tirador.onmousedown = function (ev) {
      arrastrando = true;
      document.body.classList.add('visor-arrastrando');
      ev.preventDefault();
    };
    document.addEventListener('mousemove', function (ev) {
      if (!arrastrando) return;
      ponerAncho(window.innerWidth - ev.clientX);
    });
    document.addEventListener('mouseup', function () {
      if (!arrastrando) return;
      arrastrando = false;
      document.body.classList.remove('visor-arrastrando');
      if (clase === 'pdf' && alAncho) pintarDocumento();
    });
  }

  /* ---------- abrir y cerrar ---------- */

  function tipoDe(nombre, fichero) {
    var ext = Nombres.extensionDe(nombre);
    var tipo = (fichero && fichero.type) || '';
    if (tipo === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (tipo.indexOf('image/') === 0 ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].indexOf(ext) !== -1) return 'imagen';
    return 'otro';
  }

  function soltar() {
    if (url) { URL.revokeObjectURL(url); url = null; }
  }

  /* El nombre completo va siempre en el title; en la propia cabecera,
     si no cabe entero, se corta por el medio (no por el final), para
     que se siga viendo la extensión (17-sep-2026, fila 25). */
  function ponerNombre(nombre) {
    rotulo.textContent = nombre;
    rotulo.title = nombre;
    requestAnimationFrame(function () {
      if (!rotulo || rotulo.title !== nombre) return;   /* ya se ha abierto otro */
      if (rotulo.scrollWidth <= rotulo.clientWidth) return;
      var ini = Math.ceil(nombre.length / 2);
      var a = nombre.slice(0, ini), b = nombre.slice(ini);
      while ((a.length + b.length) > 6 && rotulo.scrollWidth > rotulo.clientWidth) {
        if (a.length >= b.length) a = a.slice(0, -1); else b = b.slice(1);
        rotulo.textContent = a + '…' + b;
      }
    });
  }

  function pintarAcciones(botones) {
    if (!acciones) return;
    acciones.innerHTML = '';
    if (botones) { acciones.appendChild(botones); acciones.classList.remove('oculto'); }
    else acciones.classList.add('oculto');
  }

  /* 'opts.marcador' identifica lo que se abre (ver más arriba);
     'opts.acciones' es un elemento con los botones propios de quien
     abre, que se enseña debajo de la cabecera. Los dos son opcionales:
     sin ellos, el visor se comporta exactamente como hasta hoy. */
  async function abrir(handle, nombre, opts) {
    opts = opts || {};
    construir();
    try {
      var fichero = await handle.getFile();
      soltar();
      url = URL.createObjectURL(fichero);
      clase = tipoDe(nombre || fichero.name, fichero);
      nivel = 100;
      alAncho = true;
      ponerNombre(nombre || fichero.name);
      pintarAcciones(opts.acciones || null);
      panel.classList.remove('oculto');
      document.body.classList.add('con-visor');
      pintarDocumento();
      marcador = opts.marcador || null;
      nombreAbierto = nombre || fichero.name;
      avisar();

      /* Lo que el navegador no sabe enseñar se abre fuera, como antes. */
      if (clase === 'otro') window.open(url, '_blank');
    } catch (e) {
      U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(e), 'malo');
    }
  }

  function cerrar() {
    if (panel) panel.classList.add('oculto');
    document.body.classList.remove('con-visor');
    if (cuerpo) cuerpo.innerHTML = '';
    pintarAcciones(null);
    soltar();
    nombreAbierto = '';
    if (marcador !== null) { marcador = null; avisar(); }
  }

  /* ---------- pintar y hacer zoom ---------- */

  function cambiarZoom(paso) {
    alAncho = false;
    var i = NIVELES.indexOf(nivel);
    if (i === -1) i = NIVELES.indexOf(100);
    i = Math.max(0, Math.min(NIVELES.length - 1, i + paso));
    nivel = NIVELES[i];
    pintarDocumento();
  }

  function pintarDocumento() {
    if (!cuerpo || !url) return;
    marcaZoom.textContent = alAncho ? 'Ancho' : nivel + '%';

    if (clase === 'pdf') {
      /* El navegador trae su propia barra: pasar páginas, buscar,
         imprimir. El zoom se le pasa en la dirección, y por eso hay
         que volver a cargarlo al cambiarlo. */
      var zoom = alAncho ? 'page-width' : String(nivel);
      cuerpo.innerHTML = '<iframe id="visor-marco" title="Documento" src="' +
        url + '#zoom=' + zoom + '&navpanes=0"></iframe>';
      return;
    }

    if (clase === 'imagen') {
      cuerpo.innerHTML = '<img id="visor-imagen" alt="Documento" src="' + url + '">';
      var img = $('visor-imagen');
      img.style.width = alAncho ? '100%' : nivel + '%';
      img.style.maxWidth = 'none';
      return;
    }

    cuerpo.innerHTML = '<p class="explica">Este tipo de fichero no se puede ver dentro ' +
      'del navegador. Se ha abierto en otra pestaña, y desde ahí lo abre el programa ' +
      'que le corresponda.</p>';
  }

  window.Visor = {
    abrir: abrir, cerrar: cerrar,
    marcadorAbierto: function () { return marcador; },
    nombreAbierto: function () { return nombreAbierto; },
    alCambiar: function (fn) { oyentes.push(fn); }
  };

  /* ---------- los documentos sueltos también se ven aquí ----------

     Se cambia la función de la aplicación, para no tener que tocar la
     pantalla de los documentos por clasificar. Las acciones (Crear
     asunto con él, Meter en un asunto, Borrar) son las mismas de la
     tarjeta, montadas por App.accionesDeSuelto (js/documentos-sueltos.js)
     para no duplicar esa lógica aquí (17-sep-2026, fila 25). */
  App.abrirSuelto = function (s) {
    var acciones = App.accionesDeSuelto ? App.accionesDeSuelto(s) : null;
    return abrir(s.handle, s.nombre, { marcador: 'suelto:' + s.nombre, acciones: acciones });
  };

})();
