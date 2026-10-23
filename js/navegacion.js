/* ============================================================
   navegacion.js — adónde lleva la aplicación después de cada acción
   (24-sep-2026, fila 119, docs/TRAS-CADA-ACCION.md).

   Dos cosas, y nada de pila de historial (un solo nivel de memoria):

   - La pantalla de ORIGEN de una ficha: App.abrirFicha (js/ficha-asunto.js)
     llama a Navegacion.apuntar() antes de cambiar de pantalla, y
     «Volver» (y Escape, que pulsa el mismo botón) llama a
     Navegacion.volver(): se vuelve a «Qué me toca», «Duplicados», el
     ARCHIVO con su búsqueda, Ajustes… en vez de siempre a la lista. Si
     la ficha se abre desde otra ficha (otros del mismo tercero), se
     conserva el origen de la primera. Desde «Nuevo asunto», el origen es
     Asuntos abiertos.
   - La ALTURA de la lista al salir de ella (la ventana es la que se
     desplaza, ver css/cabecera-fija.css): al volver, se deja donde
     estaba en vez de arriba del todo.

   Y Navegacion.abrirAbierto(nombre): abre la ficha de un asunto de
   Asuntos abiertos por su nombre, con Asuntos abiertos de origen (tras
   crear, reabrir o editar, y el botón «Ir al asunto» de los avisos).

   Se carga justo después de js/ficha-asunto.js. No envuelve nada.
   ============================================================ */
window.Navegacion = (function () {

  var origen = null;          /* { pantalla, alto } */
  var forzado = null;         /* el origen de la PRÓXIMA ficha que se abra */
  var enVolver = false;       /* fila 194: para que App.ir no reapunte al salir por Volver */
  var desdeVerTodo = null;    /* fila 449: { soloQue, alto } de «Ver todo» al pulsar «Ir al asunto» de su aviso */

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
    if (enVolver) return;
    if (desdeVerTodo) {   /* fila 449: la ficha se abre desde el aviso de «Ver todo» */
      origen = { pantalla: 'abiertos', alto: desdeVerTodo.alto, verTodo: true, soloQue: desdeVerTodo.soloQue };
      desdeVerTodo = null; forzado = null; return;
    }
    if (forzado) { origen = { pantalla: forzado, alto: null }; forzado = null; return; }
    var v = pantallaVisible();
    if (!v || v === 'asunto') return;          /* de ficha a ficha: el origen de la primera */
    if (v === 'nuevo') { origen = { pantalla: 'abiertos', alto: null }; return; }
    origen = { pantalla: v, alto: altoActual() };
  }

  /* Fila 256 (docs/LISTA-A-LA-MISMA-ALTURA-AL-VOLVER.md): la pantalla de destino se
     termina de pintar a trozos durante un rato (la lista, la franja de avisos, la
     cabecera que se encoge) y el «scroll anchoring» del navegador movía `scrollY`
     unos 40 px con cada trozo: la lista volvía más abajo de donde estaba. Mientras
     dura el regreso (casi un segundo) se apaga el anclaje y se devuelve la página a
     la altura guardada cada vez que se aparta, salvo que la persona toque la pantalla
     (rueda, tacto, tecla o ratón): entonces se le devuelve el anclaje y se la deja en
     paz. `alturaPedida()` dice esa altura a quien repinta la pantalla en ese rato
     (js/inicio.js), porque el `scrollY` de entonces ya puede venir movido. */
  var VIGILAR_MS = 900;
  var pedida = null;   /* { alto, hasta } */
  var vigilanciaActual = null;
  var paso = window.requestAnimationFrame ? function (f) { window.requestAnimationFrame(f); } : function (f) { setTimeout(f, 16); };

  function alturaPedida() {
    return (pedida && Date.now() < pedida.hasta) ? pedida.alto : null;
  }

  function ponerAltura(alto) {
    if (alto === null || alto === undefined) return;
    if (vigilanciaActual) vigilanciaActual();   /* una sola a la vez */
    var raiz = document.documentElement;
    var anclajeAntes = raiz.style.overflowAnchor;
    var terminada = false;
    var eventos = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    function parar() {
      if (terminada) return;
      terminada = true;
      vigilanciaActual = null;
      raiz.style.overflowAnchor = anclajeAntes;
      eventos.forEach(function (e) { window.removeEventListener(e, parar, true); });
    }
    pedida = { alto: alto, hasta: Date.now() + VIGILAR_MS };
    raiz.style.overflowAnchor = 'none';
    eventos.forEach(function (e) { window.addEventListener(e, parar, { capture: true, passive: true }); });
    vigilanciaActual = parar;
    window.scrollTo(0, alto);
    (function vigilar() {
      if (terminada) return;
      if (Math.abs(altoActual() - alto) > 2) window.scrollTo(0, alto);
      if (Date.now() < pedida.hasta) paso(vigilar); else parar();
    })();
  }

  /* `defecto`: adónde ir si no se sabe de dónde se vino. */
  function volver(defecto) {
    var o = origen;
    origen = null;
    var destino = (o && o.pantalla) || defecto || 'abiertos';
    if (!document.getElementById('pantalla-' + destino)) destino = defecto || 'abiertos';
    enVolver = true;
    App.ir(destino);
    /* Fila 449: la ficha venía del aviso de «Ver todo»: se vuelve allí, a la misma parte y a la misma altura. */
    if (o && o.verTodo && destino === 'abiertos' && App.irVista) App.irVista('clasificar', o.soloQue);
    enVolver = false;
    if (o && o.pantalla === destino) ponerAltura(o.alto);
  }

  /* La próxima ficha que se abra tendrá esta pantalla de origen. */
  function trasVolverA(pantalla) { forzado = pantalla || null; }

  function buscarAbierto(nombre) {
    return (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombre; })[0] || null;
  }

  /* Devuelve true si la ha abierto. `idHito` (fila 449, opcional): abre la ficha con ese hito en la mesa. */
  function abrirAbierto(nombre, idHito) {
    var a = nombre ? buscarAbierto(nombre) : null;
    if (!a || typeof App.abrirFicha !== 'function') return false;
    trasVolverA('abiertos');
    App.abrirFicha(a, 'abierto');
    if (idHito && window.HitoMesa && HitoMesa.abrir) HitoMesa.abrir(a, idHito);
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

  /* Fila 449 (docs/IR-AL-ASUNTO-TRAS-ANADIR.md): el aviso de «Documento guardado en…» / «Guardado en…» /
     «Anotado en…». Si se está en «Ver todo» no se borra solo: se queda hasta la ✕, «Ir al asunto», guardar
     otro o salir de «Ver todo» (U.quitarAvisosFijos, desde App.ir y App.irVista). «Ir al asunto» abre
     «Trabajo» con `idHito` (o el hito en curso) y su «← Volver a Ver todo» vuelve aquí. Fuera de «Ver todo»
     (guardado desde un hito de la ficha) es el aviso de siempre, con sus 8 s. */
  function enVerTodo() {
    var p = document.getElementById('pantalla-abiertos');
    return !!(window.App && App.E && App.E.vista === 'clasificar' && p && !p.classList.contains('oculto') && pantallaVisible() === 'abiertos');
  }

  function avisoAnadido(texto, nombre, idHito) {
    U.quitarAvisosFijos();   /* nunca dos a la vez */
    if (!buscarAbierto(nombre)) { U.aviso(texto, 'bueno'); return; }   /* ARCHIVO sin reabrir: sin botón */
    var fijo = enVerTodo();
    U.aviso(texto, 'bueno', {
      boton: 'Ir al asunto',
      fijo: fijo,
      alPulsar: async function () {
        if (fijo) desdeVerTodo = { soloQue: App.E.soloQueClasificar || '', alto: altoActual() };
        if (abrirAbierto(nombre, idHito)) { desdeVerTodo = null; return; }
        desdeVerTodo = null;
        if (App.verAbiertos) { try { await App.verAbiertos(); } catch (e) { /* se sigue */ } }
        if (fijo) desdeVerTodo = { soloQue: App.E.soloQueClasificar || '', alto: altoActual() };
        if (!abrirAbierto(nombre, idHito)) App.ir('abiertos');
        desdeVerTodo = null;
      }
    });
  }

  return {
    avisoAnadido: avisoAnadido,
    apuntar: apuntar,
    volver: volver,
    trasVolverA: trasVolverA,
    abrirAbierto: abrirAbierto,
    avisoConIr: avisoConIr,
    pantallaVisible: pantallaVisible,
    alturaPedida: alturaPedida,
    origen: function () { return origen; }
  };
})();
