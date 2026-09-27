/* ============================================================
   navegacion.js — adónde lleva la aplicación después de cada acción
   (24-sep-2026, fila 119, docs/TRAS-CADA-ACCION.md; generalizado a
   todas las pantallas en la fila 194, 27-sep-2026,
   docs/AVISOS-MENU-Y-VOLVER.md, apartados 3 y 4).

   Dos cosas, y nada de pila de historial (un solo nivel de memoria):

   - La pantalla de ORIGEN: desde la fila 194, `App.ir` está envuelto
     aquí mismo, así que CUALQUIER cambio de pantalla apunta de dónde
     se viene, no solo el de abrir una ficha. Un solo «← Volver» (y
     Escape, que pulsa el mismo botón) llama a Navegacion.volver(): se
     vuelve a «Qué me toca», «Duplicados», el ARCHIVO con su
     búsqueda, Ajustes… en vez de siempre a Asuntos abiertos. Si la
     ficha se abre desde otra ficha (otros del mismo tercero), se
     conserva el origen de la primera. Desde «Nuevo asunto», el origen es
     Asuntos abiertos. Sin origen apuntado (o si la pantalla guardada ya
     no existe), se va a Asuntos abiertos.
   - La ALTURA de la lista al salir de ella (la ventana es la que se
     desplaza, ver css/cabecera-fija.css): al volver, se deja donde
     estaba en vez de arriba del todo.

   Y Navegacion.abrirAbierto(nombre): abre la ficha de un asunto de
   Asuntos abiertos por su nombre, con Asuntos abiertos de origen (tras
   crear, reabrir o editar, y el botón «Ir al asunto» de los avisos).

   Se carga justo después de js/ficha-asunto.js.
   ============================================================ */
window.Navegacion = (function () {

  var origen = null;          /* { pantalla, alto } */
  var forzado = null;         /* el origen de la PRÓXIMA ficha que se abra */

  function pantallaVisible() {
    var lista = (window.App && App.PANTALLAS) || [];
    for (var i = 0; i < lista.length; i++) {
      var el = document.getElementById('pantalla-' + lista[i]);
      if (el && !el.classList.contains('oculto')) return lista[i];
    }
    return '';
  }

  function altoActual() {
    return window.scrollY || (document.documentElement && document.documentElement.scrollTop) || 0;
  }

  function apuntar() {
    if (forzado) { origen = { pantalla: forzado, alto: null }; forzado = null; return; }
    var v = pantallaVisible();
    if (!v || v === 'asunto') return;          /* de ficha a ficha: el origen de la primera */
    if (v === 'nuevo') { origen = { pantalla: 'abiertos', alto: null }; return; }
    origen = { pantalla: v, alto: altoActual() };
  }

  /* Fila 194 (docs/AVISOS-MENU-Y-VOLVER.md, apartado 3): antes solo
     App.abrirFicha llamaba a apuntar() antes de cambiar de pantalla.
     Envolviendo App.ir aquí, TODAS las pantallas quedan apuntadas de
     la misma forma, sin que cada una tenga que acordarse de llamar a
     nada. Si la pantalla de destino ya es la que se ve, no hay
     navegación de verdad: no se toca el origen. */
  if (window.App && typeof App.ir === 'function' && window.U && typeof U.envolver === 'function') {
    U.envolver(App, 'App.ir', 'navegacion.js', function (comoEra) {
      return function (cual) {
        if (pantallaVisible() !== cual) apuntar();
        return comoEra(cual);
      };
    });
  }

  function ponerAltura(alto) {
    if (alto === null || alto === undefined) return;
    window.scrollTo(0, alto);
    /* Por si la lista termina de pintarse un momento después. */
    setTimeout(function () { if (Math.abs(altoActual() - alto) > 2) window.scrollTo(0, alto); }, 60);
  }

  /* `defecto`: adónde ir si no se sabe de dónde se vino. */
  function volver(defecto) {
    var o = origen;
    origen = null;
    var destino = (o && o.pantalla) || defecto || 'abiertos';
    if (!document.getElementById('pantalla-' + destino)) destino = defecto || 'abiertos';
    App.ir(destino);
    if (o && o.pantalla === destino) ponerAltura(o.alto);
  }

  /* La próxima ficha que se abra tendrá esta pantalla de origen. */
  function trasVolverA(pantalla) { forzado = pantalla || null; }

  function buscarAbierto(nombre) {
    return (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombre; })[0] || null;
  }

  /* Devuelve true si la ha abierto. */
  function abrirAbierto(nombre) {
    var a = nombre ? buscarAbierto(nombre) : null;
    if (!a || typeof App.abrirFicha !== 'function') return false;
    trasVolverA('abiertos');
    App.abrirFicha(a, 'abierto');
    return true;
  }

  /* El aviso de siempre, con el botón «Ir al asunto» (punto 6 del
     encargo). Si al pulsarlo el asunto ya no está en Asuntos abiertos,
     se va a la lista. */
  function avisoConIr(texto, clase, nombre) {
    /* Un asunto del ARCHIVO no tiene ficha de abierto a la que ir: el aviso de siempre. */
    if (!buscarAbierto(nombre)) { U.aviso(texto, clase || 'bueno'); return; }
    U.aviso(texto, clase || 'bueno', {
      boton: 'Ir al asunto',
      alPulsar: async function () {
        if (abrirAbierto(nombre)) return;
        if (App.verAbiertos) { try { await App.verAbiertos(); } catch (e) { /* se sigue */ } }
        if (!abrirAbierto(nombre)) App.ir('abiertos');
      }
    });
  }

  return {
    apuntar: apuntar,
    volver: volver,
    trasVolverA: trasVolverA,
    abrirAbierto: abrirAbierto,
    avisoConIr: avisoConIr,
    pantallaVisible: pantallaVisible,
    origen: function () { return origen; }
  };
})();
