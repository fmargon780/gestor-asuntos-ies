/* ============================================================
   entrar-sola.js — entrar sin pulsar nada después de actualizar
   (10-oct-2026, fila 325, docs/VERSION-NUEVA-SIN-FRANJA.md).

   Quien recarga la página para poner la versión nueva (la copia sin
   internet al pulsar «Entrar», la marca «hay versión nueva» en la copia
   y en la web) llama a `EntrarSola.apuntar()` antes de recargar. Al
   cargar, si la marca tiene menos de 60 segundos:
     - se borra;
     - si las dos carpetas de Dropbox recordadas siguen con permiso
       (se mira, nunca se pide: no hay pulsación) y hay nombre de
       usuario, se entra por el mismo camino que el botón;
     - si no, no se entra y encima del botón sale «Gestor actualizado a
       la versión <versión>. Pulsa «Entrar».».
   En la copia de pruebas (js/demo/) no hace nada: allí ya se entra con
   `auto=1`.
   ============================================================ */
window.EntrarSola = (function () {
  'use strict';

  var CLAVE = 'gestor-entrar-sola';
  var VALE_MS = 60000;
  var ESPERA_MAX_MS = 15000;
  var activo = false;

  function leer() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); } catch (e) { return null; }
  }

  function apuntar() {
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ cuando: Date.now() })); } catch (e) { /* nada */ }
  }

  function dice(version) {
    var boton = document.getElementById('btn-entrar');
    if (!boton || document.getElementById('aviso-actualizado')) return;
    var p = document.createElement('p');
    p.id = 'aviso-actualizado';
    p.className = 'nota';
    p.textContent = 'Gestor actualizado a la versión ' + version + '. Pulsa «Entrar».';
    boton.parentNode.insertBefore(p, boton);
  }

  function esperarA(condicion) {
    var limite = Date.now() + ESPERA_MAX_MS;
    return new Promise(function (resolver) {
      (function vuelta() {
        if (condicion()) { resolver(true); return; }
        if (Date.now() > limite) { resolver(false); return; }
        setTimeout(vuelta, 100);
      })();
    });
  }

  async function conPermiso(dir) {
    try { return !!(await Carpetas.permiso(dir, false)); } catch (e) { return false; }
  }

  async function intentar() {
    var m = leer();
    if (!m) return;
    try { sessionStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
    if (!m.cuando || Date.now() - m.cuando > VALE_MS) return;
    if (window.Demo) return;
    var listo = await esperarA(function () {
      var b = document.getElementById('btn-entrar');
      return window.App && App.VERSION && b && !b.disabled && App.E && App.E.abiertos && App.E.archivo;
    });
    var puede = listo && !!App.E.usuario && await conPermiso(App.E.abiertos) && await conPermiso(App.E.archivo);
    if (!puede) { dice(window.App ? App.VERSION : ''); return; }
    activo = true;
    document.getElementById('btn-entrar').click();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', intentar);
  else intentar();

  return { apuntar: apuntar, sinPulsacion: function () { return activo; } };
})();
