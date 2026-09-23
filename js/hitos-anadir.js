/* ============================================================
   hitos-anadir.js — «Añadir documento» dentro de un hito (23-sep-2026,
   fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, sección 1).

   Sustituye al botón "Apuntar un documento" de siempre
   (js/hitos-documentos.js, que sigue existiendo tal cual: es el
   camino 3 de aquí abajo). Un solo botón "Añadir documento" que abre
   el menú pequeño de js/ficha-menus.js con tres caminos:

     1. Desde el ordenador → Documentos.abrir(a, { hito }), que se
        salta la lista y va directa al selector de fichero; al
        guardar la copia, se apunta sola al hito (js/documentos.js).
     2. Desde "Por clasificar" → elegir uno de los documentos sueltos
        (los mismos de App.E.sueltos) y seguir el mismo camino que
        "Meter aquí" (App.meterSueltoEnAsuntoElegido), con el mismo
        {hito} para que, al ponerle nombre, quede apuntado.
     3. Uno que ya está en la carpeta → el cuadro de siempre,
        HitosDocumentos.abrir(a, h), sin cambios.

   Mismo patrón que js/hitos-generar.js: botonHTML(a, h),
   engancharBoton(div, a, h), pintado en .hito-botones, y no sale en
   un hito "decision" ni "noaplica".

   Se carga después de js/hitos-generar.js.
   ============================================================ */
window.HitosAnadir = (function () {

  function botonHTML(a, hito) {
    if (!hito || hito.clase === 'decision' || hito.estado === 'noaplica') return '';
    return '<button type="button" class="boton hito-anadir-documento">Añadir documento</button>';
  }

  /* ---------- camino 1: desde el ordenador ---------- */

  function desdeElOrdenador(a, hito) {
    if (!window.Documentos || !Documentos.abrir) return;
    Documentos.abrir(a, { hito: hito, irDirectoAAnadir: true });
  }

  /* ---------- camino 2: desde "Por clasificar" ----------

     Un cuadro pequeño, con el mismo patrón que js/elegir-asunto.js
     (se pinta sobre #capa, se elige pulsando la fila, Cancelar es el
     de siempre): sin sitio nuevo donde guardar nada, y sin CSS nuevo
     (reutiliza .resultado, de css/estilos.css, y .enlace-lista, de
     css/bandeja.css: los dos ya cargados). */
  function elegirSuelto(sueltos) {
    return new Promise(function (resolver) {
      var resuelto = false;
      function unaVez(v) { if (!resuelto) { resuelto = true; resolver(v); } }

      var capa = document.getElementById('capa');
      var titulo = document.getElementById('cuadro-titulo');
      var cuerpo = document.getElementById('cuadro-cuerpo');
      var aceptar = document.getElementById('cuadro-aceptar');
      var cancelar = document.getElementById('cuadro-cancelar');
      if (!capa || !titulo || !cuerpo || !aceptar || !cancelar) { unaVez(null); return; }

      titulo.textContent = 'Elegir un documento suelto';
      cuerpo.innerHTML = '<div class="lista enlace-lista">' + sueltos.map(function (s, i) {
        return '<button type="button" class="resultado enlace-asunto" data-i="' + i + '">' +
          U.escapar(s.nombre) + '</button>';
      }).join('') + '</div>';
      aceptar.classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        aceptar.classList.remove('oculto');
        cancelar.onclick = null;
      }

      cancelar.onclick = function () { cerrar(); unaVez(null); };
      Array.prototype.forEach.call(cuerpo.querySelectorAll('.enlace-asunto'), function (b) {
        b.onclick = function () {
          var s = sueltos[Number(b.dataset.i)];
          cerrar();
          unaVez(s);
        };
      });
    });
  }

  async function desdePorClasificar(a, hito) {
    var sueltos = (window.App && App.E && App.E.sueltos) || [];
    if (!sueltos.length) return;
    var s = await elegirSuelto(sueltos);
    if (!s || !window.App || !App.meterSueltoEnAsuntoElegido) return;
    await App.meterSueltoEnAsuntoElegido(s, { nombre: a.nombre, ficha: a.ficha }, { hito: hito });
  }

  /* ---------- camino 3: uno que ya está en la carpeta ---------- */

  function yaEnLaCarpeta(a, hito) {
    if (!window.HitosDocumentos) return;
    HitosDocumentos.abrir(a, hito);
  }

  /* ---------- el menú ---------- */

  function engancharBoton(div, a, hito) {
    var boton = div.querySelector('.hito-anadir-documento');
    if (!boton || !window.FichaMenus) return;
    var sueltos = (window.App && App.E && App.E.sueltos) || [];
    FichaMenus.montar(boton, [
      { texto: 'Desde el ordenador', alPulsar: function () { desdeElOrdenador(a, hito); } },
      {
        texto: 'Desde "Por clasificar"' + (sueltos.length ? '' : ' (no hay ninguno)'),
        deshabilitado: !sueltos.length,
        alPulsar: function () { desdePorClasificar(a, hito); }
      },
      { texto: 'Uno que ya está en la carpeta', alPulsar: function () { yaEnLaCarpeta(a, hito); } }
    ]);
  }

  return { botonHTML: botonHTML, engancharBoton: engancharBoton };
})();
