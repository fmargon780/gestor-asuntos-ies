/* ============================================================
   vista.js — la pantalla de asuntos abiertos, ordenada.

   Dos cosas, y nada más:

   1. Los tres desplegables (estado, plazo y orden) viven plegados
      detrás del botón "Filtros". Sueltos en la barra se salían de
      línea y cada etiqueta acababa lejos de su campo.

   2. El tablón de notas solo se ve cuando se está echando un vistazo
      general. En cuanto se está a lo suyo —leyendo un correo, buscando,
      o metido en una de las tres tarjetas— se quita solo. El botón
      "Tablón" de la cabecera lo trae de vuelta cuando haga falta, y en
      cuanto la situación cambia vuelve a mandar el automático.

   El ancho lo lleva css/vista.css, que mide la zona de trabajo y no la
   ventana: por eso vale igual con el panel de lectura abierto.
   ============================================================ */
(function () {

  var enganchado = false;

  function $(id) { return document.getElementById(id); }

  function recordar(clave, valor) {
    try { window.localStorage.setItem(clave, valor); } catch (e) {}
  }
  function recordado(clave) {
    try { return window.localStorage.getItem(clave); } catch (e) { return null; }
  }

  /* ---------- 1. los filtros ---------- */

  function hayFiltroPuesto() {
    var e = $('filtro-estado'), p = $('filtro-plazo');
    return !!((e && e.value) || (p && p.value));
  }

  function pintarBotonFiltros() {
    var b = $('btn-filtros'), caja = $('filtros-abiertos');
    if (!b || !caja) return;
    var abierto = !caja.classList.contains('oculto');
    b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    b.classList.toggle('tiene-filtros', hayFiltroPuesto());
    b.title = abierto ? 'Esconder los filtros' : 'Filtrar y ordenar la lista';
  }

  function engancharFiltros() {
    var b = $('btn-filtros'), caja = $('filtros-abiertos');
    if (!b || !caja) return;

    if (recordado('gestor-filtros') === 'abiertos') caja.classList.remove('oculto');

    b.onclick = function () {
      var abierto = caja.classList.toggle('oculto') === false;
      recordar('gestor-filtros', abierto ? 'abiertos' : 'plegados');
      pintarBotonFiltros();
    };

    ['filtro-estado', 'filtro-plazo'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('change', pintarBotonFiltros);
    });

    pintarBotonFiltros();
  }

  /* ---------- 2. el tablón ---------- */

  var manual = null;        /* lo que él ha pedido a mano, si ha pedido algo */
  var escondiaAntes = null; /* lo que decía el automático la última vez */
  var boton = null;

  /* El automático: cuándo estorba el tablón. */
  function estorba() {
    if (document.body.classList.contains('con-lector')) return true;
    var pantalla = $('pantalla-abiertos');
    if (!pantalla) return false;
    if (pantalla.querySelector('.panel.activo')) return true;
    var q = $('buscar-abiertos');
    if (q && q.value.trim()) return true;
    return false;
  }

  function pendientes() {
    var t = $('tablon');
    if (!t) return 0;
    return t.querySelectorAll('.papel:not(.papel-hecha)').length;
  }

  function pintarTablon() {
    var pantalla = $('pantalla-abiertos');
    if (!pantalla) return;

    var auto = estorba();
    if (escondiaAntes !== null && auto !== escondiaAntes) manual = null;
    escondiaAntes = auto;

    var seVe = manual === null ? !auto : manual;
    pantalla.classList.toggle('sin-tablon', !seVe);

    if (!boton) return;
    var cuantas = pendientes();
    var texto = seVe ? 'Ocultar el tablón' : 'Tablón';
    var marca = (!seVe && cuantas) ? '<span class="cuenta-tablon">' + cuantas + '</span>' : '';
    var quiere = texto + marca;
    if (boton.innerHTML !== quiere) boton.innerHTML = quiere;
    boton.title = seVe
      ? 'Quitar de la vista las notas rápidas'
      : 'Ver las notas rápidas';
  }

  function engancharTablon() {
    var pantalla = $('pantalla-abiertos');
    if (!pantalla) return;

    boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'btn-tablon';
    boton.className = 'boton';
    boton.textContent = 'Tablón';
    boton.onclick = function () {
      var seVe = !pantalla.classList.contains('sin-tablon');
      manual = !seVe;
      pintarTablon();
    };
    var recargar = $('btn-recargar');
    if (recargar && recargar.parentNode) recargar.parentNode.insertBefore(boton, recargar);

    /* Lo que cambia la situación: abrir un correo, elegir una tarjeta,
       o ponerse a buscar. */
    new MutationObserver(pintarTablon)
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });

    pantalla.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('.panel')) setTimeout(pintarTablon, 0);
    });

    if ($('buscar-abiertos')) {
      $('buscar-abiertos').addEventListener('input', function () { setTimeout(pintarTablon, 0); });
    }

    /* El tablón se crea solo cuando la aplicación arranca, y se repinta
       cada vez que se apunta una nota: hay que mirarlo para la cuenta. */
    new MutationObserver(function () {
      var t = $('tablon');
      if (t && !t.dataset.vigilado) {
        t.dataset.vigilado = '1';
        new MutationObserver(pintarTablon).observe(t, { childList: true, subtree: true });
      }
      pintarTablon();
    }).observe(pantalla, { childList: true });

    pintarTablon();
  }

  /* ---------- arranque ---------- */

  function enganchar() {
    if (enganchado) return;
    if (!$('pantalla-abiertos')) return;
    enganchado = true;
    engancharFiltros();
    engancharTablon();
  }

  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

})();
