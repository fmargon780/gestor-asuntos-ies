/* ============================================================
   varios-cuadro.js — la forma del cuadro de «señalar varios» (fila 338,
   13-oct-2026, docs/ANADIR-VARIOS-MAS-CLARO.md).

   Lo usan «Añadir varios relacionados» (js/relacionados.js) y los
   miembros de un grupo de Ajustes (js/ajustes-centro.js). En el cuadro
   común (`#capa`) pone: la ✕ arriba, el cuerpo que se desplaza y un pie
   fijo abajo con lo señalado, «Cancelar» y el botón principal (los pinta
   `App.pintarBuscadorDeTercero` con `opciones.sitioBarra`). El pie nunca
   sale de la pantalla.

   «Cancelar», la ✕ y Esc (js/usabilidad.js pulsa `#cuadro-cancelar`)
   pasan por la misma pregunta, en el mismo pie: si hay algo señalado que
   se perdería, «¿Descartar los N señalados?» con «Descartar» y «Seguir
   eligiendo». Lo señalado al entrar (`iniciales`) no cuenta.

     VariosCuadro.abrir()  -> el elemento donde va la barra (el pie)
     VariosCuadro.cancelarCon({ marcados, iniciales, salir }) -> la función
        que se pone en `#cuadro-cancelar`
     VariosCuadro.cerrar()
   ============================================================ */
var VariosCuadro = (function () {

  function $(id) { return document.getElementById(id); }
  function claves(l) { return (l || []).map(function (m) { return m.categoria + '|' + m.nombre; }).sort().join('\n'); }

  /* PURA: ¿hay algo señalado que se perdería al cerrar? */
  function hayQueDescartar(marcados, iniciales) {
    if (!marcados || !marcados.length) return false;
    if (iniciales && claves(marcados) === claves(iniciales)) return false;
    return true;
  }

  function textoPregunta(n) { return n === 1 ? '¿Descartar 1 señalado?' : '¿Descartar los ' + n + ' señalados?'; }

  function abrir() {
    var cuadro = $('capa').querySelector('.cuadro');
    cuadro.classList.add('cuadro-varios');
    var x = document.createElement('button');
    x.type = 'button';
    x.id = 'varios-cerrar';
    x.className = 'cuadro-cerrar-x';
    x.setAttribute('data-ayuda-clave', 'cancelar');
    x.setAttribute('aria-label', 'Cancelar');
    x.textContent = '✕';
    x.onclick = function () { $('cuadro-cancelar').click(); };
    cuadro.insertBefore(x, cuadro.firstChild);
    var pie = document.createElement('div');
    pie.id = 'varios-pie';
    pie.className = 'varios-pie';
    pie.innerHTML = '<div id="varios-pie-barra"></div><div id="varios-pie-pregunta" class="oculto"></div>';
    cuadro.insertBefore(pie, cuadro.querySelector('.cuadro-botones'));
    return $('varios-pie-barra');
  }

  function cerrar() {
    var cuadro = $('capa').querySelector('.cuadro');
    cuadro.classList.remove('cuadro-varios');
    var x = $('varios-cerrar'), pie = $('varios-pie');
    if (x) x.remove();
    if (pie) pie.remove();
  }

  function cancelarCon(o) {
    function seguir() {
      $('varios-pie-pregunta').classList.add('oculto');
      $('varios-pie-barra').classList.remove('oculto');
    }
    return function () {
      var pregunta = $('varios-pie-pregunta');
      if (!pregunta) { o.salir(); return; }
      if (!pregunta.classList.contains('oculto')) { seguir(); return; }   /* Esc con la pregunta puesta: sigue eligiendo */
      var m = o.marcados();
      if (!hayQueDescartar(m, o.iniciales)) { o.salir(); return; }
      pregunta.innerHTML =
        '<p class="varios-pregunta"><strong>' + textoPregunta(m.length) + '</strong></p>' +
        '<div class="marcados-acciones"><button type="button" class="boton" id="varios-seguir">Seguir eligiendo</button>' +
        '<button type="button" class="boton boton-principal" id="varios-descartar">Descartar</button></div>';
      $('varios-pie-barra').classList.add('oculto');
      pregunta.classList.remove('oculto');
      $('varios-seguir').onclick = seguir;
      $('varios-descartar').onclick = function () { o.salir(); };
    };
  }

  return { abrir: abrir, cerrar: cerrar, cancelarCon: cancelarCon, _hayQueDescartar: hayQueDescartar, _textoPregunta: textoPregunta };
})();
window.VariosCuadro = VariosCuadro;
