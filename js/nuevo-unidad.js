/* ============================================================
   nuevo-unidad.js — el desplegable «Unidad» junto al buscador de «Nuevo asunto»
   (fila 501, docs/501-FICHA-ENTREGA-LIBROS.md).

   Sale cuando se busca alumnado (la pastilla ALUMNADO pulsada, o sin pastilla y
   con ALUMNADO entre las clases que admite el tipo). Con una unidad elegida salen
   sus alumnos enteros, sin tope y sin escribir nada; escribiendo, se acotan dentro
   de ella (`App.buscarEnCategorias` recibe la unidad; `App.buscarTercero` la pide
   aquí). Se crea solo al primer uso: no cambia `index.html`.
   ============================================================ */
var NuevoUnidad = (function () {

  var caja = null, sel = null, cargadas = false, turno = 0;

  function montar() {
    if (sel) return true;
    var entrada = document.getElementById('buscar-tercero');
    if (!entrada || !entrada.parentNode) return false;
    caja = document.createElement('div');
    caja.className = 'buscar-fila';
    entrada.parentNode.insertBefore(caja, entrada);
    caja.appendChild(entrada);
    sel = document.createElement('select');
    sel.id = 'unidad-tercero';
    sel.className = 'campo oculto';
    sel.setAttribute('aria-label', 'Unidad');
    sel.onchange = function () { App.buscarTercero(); };
    caja.appendChild(sel);
    return true;
  }

  function categorias() {
    return App.E.nuevo.categoria ? [App.E.nuevo.categoria] : App.clasesPermitidasNuevo();
  }

  function visible() { return categorias().indexOf('ALUMNADO') !== -1; }

  /* Las unidades de este curso, tal como las trae el listado de alumnado. */
  async function llenar() {
    var mio = ++turno;
    var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
    if (mio !== turno) return;
    var vistas = {};
    (fuente.lista || []).forEach(function (p) { if (p.matriculado && p.unidad) vistas[p.unidad] = true; });
    var nombres = Object.keys(vistas).sort(function (a, b) { return a.localeCompare(b, 'es', { numeric: true }); });
    var actual = sel.value;
    sel.innerHTML = '';
    var todas = document.createElement('option');
    todas.value = '';
    todas.textContent = 'Todas';
    sel.appendChild(todas);
    nombres.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n;
      o.textContent = n;
      sel.appendChild(o);
    });
    sel.value = nombres.indexOf(actual) !== -1 ? actual : '';
    cargadas = true;
  }

  /* Enseña u oculta el desplegable según lo que se busca; al ocultarlo, vuelve a «Todas». */
  async function actualizar() {
    if (!montar()) return;
    var ver = visible();
    sel.classList.toggle('oculto', !ver);
    if (!ver) { sel.value = ''; return; }
    if (!cargadas) { try { await llenar(); } catch (e) { sel.classList.add('oculto'); } }
  }

  /* La unidad elegida («1º A»), o vacío. */
  function unidad() { return sel && !sel.classList.contains('oculto') ? sel.value : ''; }

  /* Hay otros datos de alumnado (otro RegAlum): se vuelven a leer las unidades. */
  function olvidar() { cargadas = false; }

  return { actualizar: actualizar, unidad: unidad, olvidar: olvidar };
})();
window.NuevoUnidad = NuevoUnidad;
