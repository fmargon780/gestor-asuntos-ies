/* ============================================================
   entrar-pasos.js — «Entrar» dice en qué se ha quedado
   (fila 740, docs/740-ENTRAR-DICE-DONDE-SE-QUEDA.md).

   - `EntrarPasos.paso(texto)`: pinta bajo el botón «Entrar» una línea fija
     con lo que la app está haciendo ahora, la apunta en la consola
     (`Entrar: …`) y arranca un reloj de 15 s: si ese paso no termina,
     añade «Sigue esperando: <paso>. Si Chrome o Edge te pide permiso,
     pulsa «Permitir».».
   - `EntrarPasos.fin()`: quita la línea (al entrar, o si la entrada se para).
   - `EntrarPasos.fallo(texto)`: un cuadro rojo FIJO junto al botón con lo
     que falló, tal cual lo dice el navegador; no desaparece solo. Se
     quita al volver a pulsar «Entrar» (`EntrarPasos.empezar()`).
   No cambia el botón ni el orden de los pasos. Lo llaman js/nucleo.js.
   ============================================================ */
var EntrarPasos = (function () {
  var ESPERA_MS = 15000;
  var reloj = null;
  var actual = '';

  function caja(id, clase) {
    var el = document.getElementById(id);
    if (el) return el;
    var boton = document.getElementById('btn-entrar');
    if (!boton || !boton.parentNode) return null;
    el = document.createElement('p');
    el.id = id;
    el.className = clase;
    el.setAttribute('role', 'status');
    boton.parentNode.insertBefore(el, boton.nextSibling);
    return el;
  }

  function quitarReloj() { if (reloj) { clearTimeout(reloj); reloj = null; } }

  function paso(texto) {
    quitarReloj();
    actual = texto;
    try { console.info('Entrar:', texto); } catch (e) { /* sin consola */ }
    var el = caja('entrar-paso', 'entrar-paso');
    if (el) { el.textContent = texto; el.classList.remove('oculto'); }
    reloj = setTimeout(function () {
      var l = document.getElementById('entrar-paso');
      if (l && actual === texto) l.textContent = texto + ' Sigue esperando: ' + texto.replace(/…$/, '') +
        '. Si Chrome o Edge te pide permiso, pulsa «Permitir».';
    }, ESPERA_MS);
  }

  function fin() {
    quitarReloj();
    actual = '';
    var l = document.getElementById('entrar-paso');
    if (l && l.parentNode) l.parentNode.removeChild(l);
  }

  function fallo(texto) {
    var el = caja('entrar-fallo', 'entrar-fallo');
    if (el) { el.textContent = texto; el.classList.remove('oculto'); }
    try { console.info('Entrar: falló:', texto); } catch (e) { /* sin consola */ }
  }

  function empezar() {
    var f = document.getElementById('entrar-fallo');
    if (f && f.parentNode) f.parentNode.removeChild(f);
  }

  return { paso: paso, fin: fin, fallo: fallo, empezar: empezar };
})();
window.EntrarPasos = EntrarPasos;
