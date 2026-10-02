/* ============================================================
   solo-consulta.js — «En este ordenador, solo consultar» (2-oct-2026,
   fila 260, docs/SOLO-CONSULTA-EN-ESTE-ORDENADOR.md).

   Para un ordenador que trabaja sobre una COPIA de las carpetas del
   centro (el Chromebook de casa, con las carpetas en Drive): la
   aplicación no guarda nada en las carpetas. La marca vive en el
   navegador (`localStorage`), nunca en `_GESTOR`, y se lee lo primero.

   Dos capas:
   1. el permiso: las carpetas se piden en modo lectura (js/carpetas.js);
   2. el cierre de verdad: `proteger(manejador)` devuelve la carpeta
      envuelta; ella y todo lo que sale de ella rechazan escribir, borrar,
      mover o crear con un error `SoloConsulta`. Se aplica al entrar
      (js/nucleo.js). Sin la marca, `proteger` devuelve el manejador tal cual.

   Lo que la aplicación hace sola (copias, presencia…) mira
   `SoloConsulta.activo()` y se salta. Un intento rechazado que viene de
   una acción de la usuaria sale en ámbar («Solo consulta: no se ha
   guardado nada.»), nunca en rojo (`U.mensajeDeError`, `U.aviso`).
   ============================================================ */
window.SoloConsulta = (function () {

  var CLAVE = 'gestor.soloConsulta';
  var TEXTO_ERROR = 'Solo consulta: no se ha guardado nada.';
  var marcado = leer();
  var pausado = false;
  var RAW = typeof Symbol === 'function' ? Symbol('crudo') : '__crudo';

  function leer() {
    try { return window.localStorage.getItem(CLAVE) === '1'; } catch (e) { return false; }
  }

  /* ¿Está puesta ahora? (`pausar` la apaga un momento: solo lo usa la copia de pruebas para montar sus datos.) */
  function activo() { return marcado && !pausado; }
  function pausar(si) { pausado = !!si; }

  function guardar(valor) {
    marcado = !!valor;
    try {
      if (valor) window.localStorage.setItem(CLAVE, '1'); else window.localStorage.removeItem(CLAVE);
    } catch (e) { /* sin almacenamiento: vale solo hasta recargar */ }
    document.body.classList.toggle('solo-consulta', activo());
  }

  /* Cambiar la marca desde Ajustes: la aplicación se recarga y vuelve a la entrada. */
  function poner(valor) {
    guardar(valor);
    window.location.reload();
  }

  function error() {
    var e = new Error(TEXTO_ERROR);
    e.name = 'SoloConsulta';
    return e;
  }
  function esError(e) { return !!e && e.name === 'SoloConsulta'; }
  function rechazo() { return Promise.reject(error()); }

  /* ---------- la capa 2: el manejador protegido ---------- */

  function desenvolver(x) { return (x && x[RAW]) || x; }

  function envolver(h) {
    if (!h || typeof h !== 'object' || h[RAW]) return h;
    var tipo = h.kind;
    if (tipo !== 'directory' && tipo !== 'file') return h;
    return new Proxy(h, {
      get: function (t, p) {
        if (p === RAW) return t;
        if (!activo()) { var v0 = t[p]; return typeof v0 === 'function' ? v0.bind(t) : v0; }
        if (tipo === 'file' && (p === 'createWritable' || p === 'move' || p === 'remove')) return rechazo;
        if (tipo === 'directory') {
          if (p === 'removeEntry' || p === 'move' || p === 'remove') return rechazo;
          if (p === 'getDirectoryHandle' || p === 'getFileHandle') {
            /* Abrir lo que ya existe vale; crear lo que no existe, no. */
            return function (nombre, o) {
              return t[p](nombre).then(envolver, function (e) {
                if (e && e.name === 'NotFoundError' && o && o.create) throw error();
                throw e;
              });
            };
          }
          if (p === 'entries' || p === 'values') {
            return function () {
              var it = t.entries();
              var salida = {};
              salida[Symbol.asyncIterator] = function () { return salida; };
              salida.next = function () {
                return Promise.resolve(it.next()).then(function (r) {
                  if (r.done) return r;
                  return { done: false, value: p === 'entries' ? [r.value[0], envolver(r.value[1])] : envolver(r.value[1]) };
                });
              };
              return salida;
            };
          }
          if (p === 'isSameEntry' || p === 'resolve') {
            return function (otro) { return t[p](desenvolver(otro)); };
          }
        } else if (p === 'isSameEntry') {
          return function (otro) { return t.isSameEntry(desenvolver(otro)); };
        }
        var v = t[p];
        return typeof v === 'function' ? v.bind(t) : v;
      }
    });
  }

  function proteger(h) { return activo() ? envolver(h) : h; }

  /* ---------- la pantalla de entrada y el aviso fijo ---------- */

  function enganchar() {
    var c = document.getElementById('check-solo-consulta');
    if (c) {
      c.checked = marcado;
      c.onchange = function () { guardar(c.checked); };
    }
    var a = document.getElementById('ajustes-solo-consulta');
    if (a) {
      a.checked = marcado;
      a.onchange = function () { poner(a.checked); };
    }
  }

  function medirFranja() {
    var f = document.getElementById('franja-solo-consulta');
    document.documentElement.style.setProperty('--franja-consulta-alto', f ? Math.ceil(f.getBoundingClientRect().height) + 'px' : '0px');
  }

  async function quitar() {
    var ok = await U.preguntar('Quitar «solo consultar»',
      '<p>¿Quitar «solo consultar» en este ordenador? La aplicación volverá a guardar en las carpetas ' +
      'señaladas. Hazlo solo si son las carpetas del centro, no una copia.</p>', 'Quitar');
    if (ok) poner(false);
  }

  /* Al entrar: el aviso fijo arriba (en todas las pantallas) y todo lo que cambia algo, apagado. */
  function alEntrar() {
    if (!activo()) return;
    document.body.classList.add('solo-consulta');
    if (!document.getElementById('franja-solo-consulta')) {
      var f = document.createElement('div');
      f.id = 'franja-solo-consulta';
      f.setAttribute('role', 'status');
      f.innerHTML = '<span>Solo consulta: en este ordenador no se puede cambiar nada.</span>' +
        '<button type="button" class="boton" id="franja-solo-consulta-quitar">Quitar</button>';
      document.body.insertBefore(f, document.body.firstChild);
      document.getElementById('franja-solo-consulta-quitar').onclick = quitar;
      window.addEventListener('resize', medirFranja, { passive: true });
    }
    medirFranja();
    vigilarControles();
  }

  /* ---------- los controles que cambian algo, apagados ---------- */

  /* Lo que se apaga: todo lo que guarda, crea, borra o envía. Lo demás (buscar,
     filtrar, ordenar, abrir, copiar la «Ruta», «Exportar», «Imprimir») se deja.
     Tres reglas generales, para no depender de apagar cada botón a mano:
     1. controles concretos; 2. todas las cajas y desplegables de pantallas donde solo se
     cambia (Nuevo asunto, Ajustes, Herramientas, tablón); 3. cualquier botón cuyo
     texto sea una acción que cambia algo. */
  var CONCRETOS = ['.pestana[data-pantalla="nuevo"]', '#btn-nuevo-asunto', '#tablon-texto', '#tablon-para'].join(',');
  var CAJAS = ['#pantalla-nuevo', '#pantalla-ajustes', '#pantalla-tipo-asunto', '#pantalla-herramientas', '#tablon']
    .map(function (x) { return x + ' input, ' + x + ' select, ' + x + ' textarea'; }).join(',');
  var ACCION = /^(\+ ?)?(Archivar|Pasar a Por liquidar|Liquidar|Guardar|Guardar aquí|Guardar en un asunto|Guardar PDF|Crear|Crear asunto con él|Crear el asunto|Borrar|Quitar|Cambiar el nombre|Reabrir|Enviar|Enviar estado|Añadir|Anotar|Marcar|Publicar|Restaurar|Traer|Importar|Subir|Vaciar|Duplicar|Renombrar|Probar|Arreglarlo|Actualizar|Nuevo asunto|Nuevo asunto para esta persona|Tomar el mando)/i;
  /* Lo que se queda encendido aunque caiga en algo de arriba. */
  var DEJAR = ['#ajustes-solo-consulta', '#franja-solo-consulta-quitar', '#cuadro-cancelar', '#cuadro-aceptar',
    '[data-solo-lectura]', '.ficha-menu-boton', '#ficha-volver', '.boton-volver', '#btn-soporte'].join(',');

  function apagarUno(el) {
    if (el.disabled || el.dataset.guardando || el.matches(DEJAR) || el.closest('#capa, #franja-solo-consulta')) return;
    el.disabled = true;
    el.dataset.apagadoPorSoloConsulta = '1';
    el.title = 'Solo consulta';
  }

  function apagarControles() {
    Array.prototype.forEach.call(document.querySelectorAll(CONCRETOS + ',' + CAJAS), apagarUno);
    /* Los botones de acción de las pantallas normales (la ficha y la mesa se apagan solas: js/ficha-consulta.js). */
    Array.prototype.forEach.call(document.querySelectorAll('#aplicacion button'), function (b) {
      if (b.closest('#ficha-asunto-cuerpo') || b.closest('.ajustes-tab-botones')) return;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && ACCION.test(t)) apagarUno(b);
    });
  }

  var observador = null;
  var turno = null;
  function vigilarControles() {
    apagarControles();
    if (observador) return;
    observador = new MutationObserver(function () {
      if (turno) return;
      turno = setTimeout(function () { turno = null; apagarControles(); }, 60);
    });
    observador.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', enganchar);
  if (document.readyState !== 'loading') enganchar();
  /* Una promesa rechazada por esta causa, en una tarea de fondo, no es un fallo: se calla. */
  window.addEventListener('unhandledrejection', function (ev) { if (esError(ev.reason)) ev.preventDefault(); });

  return {
    activo: activo, pausar: pausar, poner: poner, guardar: guardar, proteger: proteger, error: error, esError: esError,
    alEntrar: alEntrar, enganchar: enganchar, apagarControles: apagarControles, TEXTO_ERROR: TEXTO_ERROR
  };
})();
