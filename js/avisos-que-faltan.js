/* ============================================================
   avisos-que-faltan.js — fila 68 de la cola
   (docs/AVISOS-QUE-FALTAN.md), partes 1 y 3: dos líneas discretas en
   la pantalla de "Asuntos abiertos" para dos cosas que la aplicación
   ya sabía pero no decía.

   1. Fichas sin carpeta (huérfanas): antes solo se veían entrando a
      propósito en Ajustes → Mantenimiento. Desde la fila 291 son una
      tarjeta de «Problemas» y Inicio avisa con «N problemas por resolver».
   2. La papelera: desde la fila 203 avisa de lo que se borrará del todo
      pronto («12 cosas se borrarán del todo el 3-oct · Ver»); «Ver»
      abre Herramientas › Papelera filtrada a esas cosas.

   Las dos comprobaciones cuestan un poco de disco (leer el índice del
   ARCHIVO, o el propio papelera.json), así que **no se enganchan al
   repintado de cada tecla del buscador** (`window.Gestor.alRefrescar`,
   que se llama en cada filtro): se envuelve `App.verAbiertos`, que solo
   se llama al entrar en la pantalla, al pulsar "Actualizar" y tras
   crear/cerrar/archivar un asunto.

   La parte 3 (que la papelera se vacíe sola) se hizo en la fila 203:
   js/papelera-vaciado.js.

   La parte 2 (el bloque "Dormidos") vive en js/que-me-toca.js, no
   aquí: ese fichero ya tiene los otros tres bloques de esa pantalla.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- 1. fichas sin carpeta (huérfanas) ----------

     La cuenta de verdad vive en js/fichas-huerfanas.js
     (`window.FichasHuerfanas.calcular`), que ya no fuerza un recorrido
     del ARCHIVO: usa el índice guardado, o el ARCHIVO si ya se ha
     leído por otro motivo. Aquí solo se pinta el aviso. */
  function calcularHuerfanas() {
    return window.FichasHuerfanas ? FichasHuerfanas.calcular() : Promise.resolve([]);
  }

  /* Ocultar el aviso 7 días (20-sep-2026, fila 86,
     docs/PULSAR-PARA-ABRIR-Y-AVISO-OCULTABLE.md): preferencia de quien
     está delante del ordenador, así que va en localStorage, no en
     `_GESTOR`. Se guarda también cuántas fichas había: si aparecen más
     antes de que pasen los 7 días, el aviso vuelve. */
  var CLAVE_HUERFANAS_CALLADO = 'aviso-huerfanas-callado';
  var DIAS_HUERFANAS_CALLADO = 7;

  function guardadoHuerfanas() {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLAVE_HUERFANAS_CALLADO));
      if (!v || typeof v.hasta !== 'string' || typeof v.n !== 'number') return null;
      return v;
    } catch (e) { return null; }
  }

  function callarHuerfanas(n) {
    try {
      window.localStorage.setItem(CLAVE_HUERFANAS_CALLADO, JSON.stringify({
        hasta: new Date(Date.now() + DIAS_HUERFANAS_CALLADO * 86400000).toISOString(),
        n: n
      }));
    } catch (e) { /* si el navegador no deja guardarlo, el aviso sale siempre */ }
  }

  /* Sin pantalla, para poder probarla sola: dado cuántas fichas hay
     ahora y lo que hay guardado (o null si no hay nada, o está
     corrupto), dice si el aviso tiene que salir. */
  function sePintaHuerfanas(nAhora, guardado) {
    if (!guardado) return true;
    if (nAhora > guardado.n) return true;
    return Date.now() >= new Date(guardado.hasta).getTime();
  }

  /* ---------- 3. la papelera vieja ---------- */

  function bytesLegibles(n) {
    if (!n) return '0 KB';
    if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
    return (n / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  /* Fila 203 (docs/PAPELERA-SE-VACIA-SOLA.md): ya no es «papelera vieja de
     más de 30 días» sino lo que se va a borrar del todo pronto. */
  async function calcularPorBorrar() {
    if (!window.Papelera || !Papelera.loQueSeBorraPronto) return { n: 0, lista: [], primera: null };
    return await Papelera.loQueSeBorraPronto();
  }

  /* ---------- los trozos de la franja de avisos ----------

     Fila 193, apartado 1: ya no pintan su propia caja junto a
     panel-avisos/panel-frescura. Cada uno es un trozo de
     js/avisos-linea.js, que al pulsarlo lleva a su bloque de
     Mantenimiento (lo que hacía el botón "Verlas" de antes). */

  /* Fila 200, apartado 7, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md: la
     papelera se ha ido a la pestaña "Herramientas", calcada a
     irAMantenimiento pero sin pasar por Ajustes. */
  function irAHerramientas(idBloque) {
    App.ir('herramientas');
    var bloque = $(idBloque);
    if (bloque) bloque.open = true;
  }

  /* Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): las fichas sin carpeta ya no tienen su trozo en
     Inicio: son una tarjeta más de «Problemas» y el trozo es «N problemas por resolver»
     (js/problemas.js). Aquí solo se lanzan los cálculos de las tarjetas en cada refresco de
     Inicio: ninguno fuerza una lectura del ARCHIVO, ninguno corre con un guardado en marcha, y
     lo caro se calcula como mucho cada diez minutos. */
  async function pintarHuerfanas() {
    if (window.Problemas) await Problemas.calcular();
  }

  /* Medir la papelera recorre sus ficheros: se hace como mucho cada
     diez minutos, no en cada vistazo a la carpeta (fila 101,
     docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md). */
  var CADA_MS_PAPELERA = 10 * 60 * 1000;
  var ultimaPapelera = 0;
  var ultimaPapeleraN = 0;
  /* Fila 203: si la última vez no había nada que avisar, se vuelve a mirar
     enseguida (pudo llegar algo justo después: la primera vista es previa
     a que se cargue todo); con algo apuntado, cada diez minutos. */
  var CADA_MS_PAPELERA_VACIA = 5 * 1000;

  async function pintarPapeleraVieja() {
    if (!window.AvisosLinea) return;
    if (ultimaPapelera && Date.now() - ultimaPapelera < (ultimaPapeleraN ? CADA_MS_PAPELERA : CADA_MS_PAPELERA_VACIA)) return;
    ultimaPapelera = Date.now();
    var r = await calcularPorBorrar();
    ultimaPapeleraN = r.n;
    var texto = '';
    if (r.n) {
      texto = r.n + (r.n === 1 ? ' cosa se borrará' : ' cosas se borrarán') + ' del todo el ' +
        Papelera.fechaBreve(r.primera);
    }
    AvisosLinea.registrar('papelera-vieja', texto, false, function () {
      if (Papelera.filtrarPronto) Papelera.filtrarPronto(true);
      irAHerramientas('bloque-papelera');
      if (typeof App.pintarPapelera === 'function') App.pintarPapelera();
    });
  }

  async function pintarTodo() {
    try { await pintarHuerfanas(); } catch (e) { /* un aviso roto no puede tumbar la aplicación */ }
    try { await pintarPapeleraVieja(); } catch (e) { /* idem */ }
  }

  U.envolver(App, 'App.verAbiertos', 'avisos-que-faltan.js', function (comoEra) {
    return async function (yaLeido) {
      var r = await comoEra(yaLeido);
      pintarTodo();
      return r;
    };
  });

  window.AvisosQueFaltan = {
    /* para las pruebas */
    _calcularHuerfanas: calcularHuerfanas,
    /* Fila 203: repinta ya el aviso de la papelera (tras devolver, borrar o
       vaciar), sin esperar al plazo entre vistazos. */
    repintarPapelera: function () {
      ultimaPapelera = 0;
      return pintarPapeleraVieja().catch(function () { /* un aviso roto no tumba nada */ });
    },
    _calcularPorBorrar: calcularPorBorrar,
    _bytesLegibles: bytesLegibles,
    _sePintaHuerfanas: sePintaHuerfanas
  };
})();
