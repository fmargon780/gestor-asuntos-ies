/* ============================================================
   avisos-que-faltan.js — fila 68 de la cola
   (docs/AVISOS-QUE-FALTAN.md), partes 1 y 3: dos líneas discretas en
   la pantalla de "Asuntos abiertos" para dos cosas que la aplicación
   ya sabía pero no decía.

   1. Fichas sin carpeta (huérfanas): antes solo se veían entrando a
      propósito en Ajustes → Mantenimiento. Ahora hay una línea aquí
      que lleva directo a ese bloque.
   2. La papelera vieja: el aviso ya existía dentro de la papelera
      (fila 200: Herramientas, antes Ajustes → Mantenimiento); aquí
      sale también en la pantalla principal, con cuántas cosas son y
      cuánto ocupan, y sin botón para quitarlo sin decidir (la única
      acción sigue siendo borrarlo del todo, en Herramientas).

   Las dos comprobaciones cuestan un poco de disco (leer el índice del
   ARCHIVO, o el propio papelera.json), así que **no se enganchan al
   repintado de cada tecla del buscador** (`window.Gestor.alRefrescar`,
   que se llama en cada filtro): se envuelve `App.verAbiertos`, que solo
   se llama al entrar en la pantalla, al pulsar "Actualizar" y tras
   crear/cerrar/archivar un asunto.

   La parte 3 del encargo (si la papelera debería vaciarse ella sola)
   es una decisión de Francisco, no de quien programe, y el propio
   encargo pide preguntársela antes de tocar esa parte: se deja sin
   hacer, apuntada en docs/HISTORIA.md y en docs/CONTEXTO-CORTO.md.

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

  /* De la fila 86 (docs/PULSAR-PARA-ABRIR-Y-AVISO-OCULTABLE.md): quedó
     un botón propio de "callar 7 días" este aviso; desde la fila 193
     ese hueco es el único "Ocultar por hoy" de toda la línea de
     avisos (js/avisos-linea.js), así que aquí ya no se escribe nunca
     `aviso-huerfanas-callado`. Se deja `sePintaHuerfanas` (y esta
     lectura) porque las pruebas la comprueban sola, por si algún día
     vuelve a haber un botón propio. */
  var CLAVE_HUERFANAS_CALLADO = 'aviso-huerfanas-callado';

  function guardadoHuerfanas() {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLAVE_HUERFANAS_CALLADO));
      if (!v || typeof v.hasta !== 'string' || typeof v.n !== 'number') return null;
      return v;
    } catch (e) { return null; }
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

  async function calcularPapeleraVieja() {
    if (!window.Papelera) return { n: 0, viejas: [] };
    var lista;
    try { lista = await Papelera.leer(); } catch (e) { return { n: 0, viejas: [] }; }
    var viejas = lista.filter(function (f) { return Papelera._diasDesde(f.cuando) > Papelera.DIAS_AVISO; });
    return { n: viejas.length, viejas: viejas };
  }

  function irAMantenimiento(idBloque) {
    App.ir('ajustes');
    if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('mantenimiento');
    var bloque = $(idBloque);
    if (bloque) bloque.open = true;
  }

  /* Fila 200: la papelera vive en Herramientas, no ya en Ajustes →
     Mantenimiento. */
  function irAHerramientas(idBloque) {
    App.ir('herramientas');
    var bloque = $(idBloque);
    if (bloque) bloque.open = true;
  }

  async function pintarHuerfanas() {
    if (!window.AvisosLinea) return;
    var huerfanas = await calcularHuerfanas();
    if (!huerfanas.length || !sePintaHuerfanas(huerfanas.length, guardadoHuerfanas())) {
      AvisosLinea.registrar('huerfanas', null);
      return;
    }
    AvisosLinea.registrar('huerfanas', {
      texto: huerfanas.length === 1 ? '1 ficha sin carpeta' : huerfanas.length + ' fichas sin carpeta',
      rojo: false,
      onclick: function () { irAMantenimiento('bloque-huerfanas'); }
    });
  }

  /* Medir la papelera recorre sus ficheros: se hace como mucho cada
     diez minutos, no en cada vistazo a la carpeta (fila 101,
     docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md). */
  var CADA_MS_PAPELERA = 10 * 60 * 1000;
  var ultimaPapelera = 0;

  async function pintarPapeleraVieja() {
    if (!window.AvisosLinea) return;
    if (ultimaPapelera && Date.now() - ultimaPapelera < CADA_MS_PAPELERA) return;
    ultimaPapelera = Date.now();
    var r = await calcularPapeleraVieja();
    if (!r.n) { AvisosLinea.registrar('papelera-vieja', null); return; }

    var tamano = await Papelera.tamanoDeViejas(r.viejas);
    AvisosLinea.registrar('papelera-vieja', {
      texto: 'papelera: ' + r.n + (r.n === 1 ? ' cosa' : ' cosas') +
        ' de más de ' + Papelera.DIAS_AVISO + ' días (' + bytesLegibles(tamano) + ')',
      rojo: false,
      onclick: function () { irAHerramientas('bloque-papelera'); }
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
    _calcularPapeleraVieja: calcularPapeleraVieja,
    _bytesLegibles: bytesLegibles,
    _sePintaHuerfanas: sePintaHuerfanas
  };
})();
