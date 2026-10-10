/* ============================================================
   marca-version.js — la marca «hay versión nueva» junto al número de
   versión del menú de la izquierda (10-oct-2026, fila 325,
   docs/VERSION-NUEVA-SIN-FRANJA.md).

   Sustituye a la franja amarilla de arriba, que solo queda para
   cuando algo falla. La usan la copia sin internet (js/actualizar-copia.js)
   y la web (js/aviso-version-web.js).

     MarcaVersion.poner(versionNueva, alActualizar) — pinta la marca. Al
         pulsarla pregunta («Actualizar el Gestor») y, si se acepta,
         llama a `alActualizar` DENTRO de esa misma pulsación (la copia
         necesita la pulsación para pedir el permiso de su carpeta).
     MarcaVersion.quitar() — la quita.
     MarcaVersion.hay()    — si está puesta.

   La marca es un elemento aparte del número de versión (que sigue
   abriendo «Qué hay de nuevo»). js/nucleo.js reescribe `#usuario-pie`
   al entrar y `NovedadesVentana.hacerPulsable` lo rehace: un
   observador la vuelve a colgar si desaparece, y la pinta al entrar si
   todavía no se había entrado.
   ============================================================ */
window.MarcaVersion = (function () {
  'use strict';

  var estado = null;      /* { version, alActualizar } */
  var marca = null;
  var observador = null;
  var ESPERA_GUARDADO_MS = 15000;

  function pie() { return document.getElementById('usuario-pie'); }

  function actual() { return (window.App && App.VERSION) || ''; }

  function esperarGuardado() {
    var limite = Date.now() + ESPERA_GUARDADO_MS;
    return new Promise(function (resolver) {
      (function vuelta() {
        if (!(window.ColaGuardado && ColaGuardado.hayGuardado()) || Date.now() > limite) { resolver(); return; }
        setTimeout(vuelta, 100);
      })();
    });
  }

  function pulsada() {
    if (!estado) return;
    var capa = document.getElementById('capa');
    if (capa && !capa.classList.contains('oculto')) return;   /* un solo cuadro a la vez */
    var s = estado;
    var cuerpo = 'Hay una versión nueva (<strong></strong>). Esta pantalla tiene la <strong></strong>. ' +
      'Al actualizar, la aplicación se recarga: lo que esté a medio escribir se pierde.';
    U.preguntar('Actualizar el Gestor', cuerpo, 'Actualizar ahora').then(async function (si) {
      if (!si || !s.alActualizar) return;
      await esperarGuardado();
      try { await s.alActualizar(); } catch (e) { console.warn('Actualizar desde la marca:', e); }
    });
    var negritas = document.querySelectorAll('#cuadro-cuerpo strong');
    if (negritas.length > 1) { negritas[0].textContent = s.version; negritas[1].textContent = actual(); }
  }

  function crear() {
    var m = document.createElement('span');
    m.id = 'marca-version';
    m.className = 'marca-version';
    m.textContent = 'hay versión nueva';
    m.setAttribute('role', 'button');
    m.tabIndex = 0;
    m.onclick = pulsada;
    m.onkeydown = function (ev) { if (ev.key === 'Enter') pulsada(); };
    return m;
  }

  function colgar() {
    var p = pie();
    if (!p || !estado) return;
    if (!marca) marca = crear();
    marca.title = 'Hay una versión nueva del Gestor (' + estado.version + '). Pulsa para actualizar ahora.';
    if (marca.parentNode !== p || p.lastChild !== marca) p.appendChild(marca);
  }

  function vigilar() {
    var p = pie();
    if (!p || observador || !window.MutationObserver) return;
    observador = new MutationObserver(function () {
      if (estado && (!marca || marca.parentNode !== pie())) colgar();
    });
    observador.observe(p, { childList: true });
  }

  function poner(versionNueva, alActualizar) {
    estado = { version: versionNueva, alActualizar: alActualizar };
    colgar();
    vigilar();
  }

  function quitar() {
    estado = null;
    if (marca && marca.parentNode) marca.parentNode.removeChild(marca);
    marca = null;
  }

  return { poner: poner, quitar: quitar, hay: function () { return !!estado; } };
})();
