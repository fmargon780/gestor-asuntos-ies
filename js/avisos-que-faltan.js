/* ============================================================
   avisos-que-faltan.js — fila 68 de la cola
   (docs/AVISOS-QUE-FALTAN.md), partes 1 y 3: dos líneas discretas en
   la pantalla de "Asuntos abiertos" para dos cosas que la aplicación
   ya sabía pero no decía.

   1. Fichas sin carpeta (huérfanas): antes solo se veían entrando a
      propósito en Ajustes → Mantenimiento. Ahora hay una línea aquí
      que lleva directo a ese bloque.
   2. La papelera vieja: el aviso ya existía dentro de la papelera de
      Ajustes; aquí sale también en la pantalla principal, con cuántas
      cosas son y cuánto ocupan, y sin botón para quitarlo sin decidir
      (la única acción sigue siendo borrarlo del todo, en Ajustes).

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

  /* ---------- las cajas, junto a panel-avisos / panel-frescura ---------- */

  function caja(id) {
    var c = $(id);
    if (c) return c;
    var referencia = $('panel-frescura') || $('panel-avisos');
    if (!referencia || !referencia.parentNode) return null;
    c = document.createElement('div');
    c.id = id;
    c.className = 'oculto';
    referencia.parentNode.insertBefore(c, referencia);
    return c;
  }

  function irAMantenimiento(idBloque) {
    App.ir('ajustes');
    if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('mantenimiento');
    var bloque = $(idBloque);
    if (bloque) bloque.open = true;
  }

  async function pintarHuerfanas() {
    var c = caja('panel-huerfanas');
    if (!c) return;
    var huerfanas = await calcularHuerfanas();
    if (!huerfanas.length) { c.className = 'oculto'; c.innerHTML = ''; return; }

    c.className = 'aviso aviso-ambar';
    c.innerHTML = '<strong>Hay ' + huerfanas.length +
      (huerfanas.length === 1 ? ' ficha sin carpeta.' : ' fichas sin carpeta.') + '</strong> ';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'boton';
    btn.textContent = 'Verlas';
    btn.onclick = function () { irAMantenimiento('bloque-huerfanas'); };
    c.appendChild(btn);
  }

  async function pintarPapeleraVieja() {
    var c = caja('panel-papelera-vieja');
    if (!c) return;
    var r = await calcularPapeleraVieja();
    if (!r.n) { c.className = 'oculto'; c.innerHTML = ''; return; }

    var tamano = await Papelera.tamanoDeViejas(r.viejas);
    c.className = 'aviso aviso-ambar';
    c.innerHTML = '<strong>Hay ' + r.n + (r.n === 1 ? ' cosa' : ' cosas') +
      ' en la papelera desde hace más de ' + Papelera.DIAS_AVISO + ' días' +
      ' (' + bytesLegibles(tamano) + ').</strong> ';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'boton';
    btn.textContent = 'Verlas';
    btn.onclick = function () { irAMantenimiento('bloque-papelera'); };
    c.appendChild(btn);
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
    _bytesLegibles: bytesLegibles
  };
})();
