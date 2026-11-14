/* ============================================================
   fases.js — las fases de un hito común (fila 660, docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md,
   tema 650 parte 4). Las once fijas salen de `Comunes.FASES` (con sus textos de `Comunes.FASES_TEXTO`) y
   no se borran; las del centro viven en `_GESTOR/fases.json`: { version: 1, fases: [{ id, nombre }] }.

   Las fases nuevas se crean SOLO en Ajustes → El centro → «Fases» («+ Fase nueva», que avisa si se parece
   a una que existe): al añadir un hito desde un asunto no se crea ninguna. Esa lista es la que enseña el
   primer paso de «+ Añadir hito» (js/anadir-hito.js).

     Fases.todas()              [{ id, nombre, fija }] (las fijas en su orden y luego las del centro)
     Fases.texto(id)            el nombre que se ve ('' si no existe)
     Fases.existe(id)
     Fases.deHito(asunto, hito)  la fase de un hito del asunto (la de su hito común), para la fila de hitos y la línea del hito
     Fases.parecidas(nombre)    las que se parecen (mismo nombre, o con palabras largas en común)
     Fases.cargar() / Fases.anadir(nombre)
   ============================================================ */
var Fases = (function () {

  var FICHERO = 'fases.json';
  var propias = [];

  function norm(t) { return U.normalizar(String(t || '')); }
  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  function normalizar(leido) {
    var vistos = {}, salida = [];
    ((leido && Array.isArray(leido.fases)) ? leido.fases : []).forEach(function (f) {
      var nombre = String((f && f.nombre) || '').trim(), id = String((f && f.id) || '');
      if (!nombre || !id || vistos[id] || Comunes.FASES.indexOf(id) !== -1) return;
      vistos[id] = true;
      salida.push({ id: id, nombre: nombre });
    });
    return salida;
  }

  function todas() {
    return Comunes.FASES.map(function (id) { return { id: id, nombre: Comunes.textoDeFase(id), fija: true }; })
      .concat(propias.map(function (f) { return { id: f.id, nombre: f.nombre, fija: false }; }));
  }
  function texto(id) { var f = todas().filter(function (x) { return x.id === id; })[0]; return f ? f.nombre : ''; }
  function existe(id) { return todas().some(function (x) { return x.id === id; }); }

  function palabras(t) { return norm(t).split(/[^a-z0-9ñ]+/).filter(function (p) { return p.length > 3; }); }
  function parecidas(nombre) {
    var a = norm(nombre), pa = palabras(nombre);
    if (!a) return [];
    return todas().filter(function (f) {
      var b = norm(f.nombre);
      return a === b || (a.length > 3 && b.length > 3 && (a.indexOf(b) !== -1 || b.indexOf(a) !== -1)) || palabras(f.nombre).some(function (p) { return pa.indexOf(p) !== -1; });
    });
  }

  async function cargar() {
    var g = gestor();
    var leido = g ? await Carpetas.leerJson(g, FICHERO) : null;
    propias = normalizar(leido);
    return propias;
  }

  /* Añade una fase del centro (el aviso de «se parece» lo hace quien llama). Devuelve la fase. */
  function anadir(nombre) {
    nombre = String(nombre || '').trim();
    if (!nombre) return Promise.reject(new Error('Escribe el nombre de la fase.'));
    var nueva = { id: 'fs-' + U.nuevoId('f'), nombre: nombre };
    return ColaGuardado.poner(FICHERO, async function () {
      var g = gestor();
      if (!g) throw new Error('No hay carpeta de ajustes señalada.');
      var actual = normalizar(await Carpetas.leerJson(g, FICHERO));
      if (actual.some(function (f) { return norm(f.nombre) === norm(nombre); })) throw new Error('Ya hay una fase con ese nombre.');
      var nuevas = actual.concat([nueva]);
      await Copias.guardar(g, FICHERO, { version: 1, fases: nuevas });
      propias = nuevas;
      return nueva;
    });
  }

  /* La fase de un hito del asunto: la del hito común del que viene ('' si no viene de la lista o no tiene fase). */
  var alDiaHecho = false;
  function deHito(a, h) {
    if (!alDiaHecho) {   /* una vez: lee la lista y las fases del centro y repinta para que la fase salga */
      alDiaHecho = true;
      Promise.all([cargar(), ComunesGuardado.leer()]).then(function () { if (window.HitosPanel) HitosPanel.programarRepintado(); }).catch(function () { /* sin fase */ });
    }
    var id = window.ComunesAsunto ? ComunesAsunto.hitoComunDe(a, h) : '';
    var hc = id ? Comunes.buscar(ComunesGuardado.enMemoria().hitos, id) : null;
    return hc && hc.fase ? texto(hc.fase) : '';
  }

  /* ---------- Ajustes → El centro → «Fases» ---------- */

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function pintarAjustes() {
    var caja = document.getElementById('fases-lista');
    if (!caja) return;
    caja.innerHTML = '<ul class="fases-lista">' + todas().map(function (f) {
      return '<li>' + esc(f.nombre) + (f.fija ? ' <span class="suave">· fija</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  async function alAbrirAjustes() {
    try { await cargar(); } catch (e) { /* con las fijas */ }
    pintarAjustes();
  }

  document.addEventListener('click', async function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#fases-anadir') : null;
    if (!b) return;
    var campo = document.getElementById('fases-nombre'), aviso = document.getElementById('fases-aviso');
    var nombre = (campo.value || '').trim();
    if (!nombre) { aviso.innerHTML = '<div class="aviso aviso-ambar">Escribe el nombre de la fase.</div>'; return; }
    var par = parecidas(nombre);
    if (par.length && !b.dataset.igual) {
      aviso.innerHTML = '<div class="aviso aviso-ambar">Se parece a <b>«' + esc(par[0].nombre) + '»</b>, que ya existe. ' +
        '<button type="button" class="boton" id="fases-igual">Crear la mía igualmente</button> <button type="button" class="boton" id="fases-no">Cancelar</button></div>';
      document.getElementById('fases-igual').onclick = function () { b.dataset.igual = '1'; b.click(); };
      document.getElementById('fases-no').onclick = function () { aviso.innerHTML = ''; };
      return;
    }
    delete b.dataset.igual;
    try {
      var f = await anadir(nombre);
      campo.value = '';
      aviso.innerHTML = '<div class="aviso aviso-bueno">Fase «' + esc(f.nombre) + '» creada.</div>';
      pintarAjustes();
    } catch (e) { U.fallo('No he podido crear la fase', e); }
  });
  document.addEventListener('toggle', function (ev) {
    if (ev.target && ev.target.id === 'bloque-fases' && ev.target.open) alAbrirAjustes();
  }, true);

  return { todas: todas, texto: texto, existe: existe, deHito: deHito, parecidas: parecidas, cargar: cargar, anadir: anadir, normalizar: normalizar, pintarAjustes: pintarAjustes };
})();
window.Fases = Fases;
