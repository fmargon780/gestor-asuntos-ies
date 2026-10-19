/* ============================================================
   inicio-columnas.js — el orden de las columnas de Inicio, por persona
   (fila 368, docs/INICIO-COLOCACION-Y-COLUMNAS.md, parte 2).

   Cada persona arrastra el título de una columna y la suelta en otro sitio
   (js/inicio-ordenar.js lo engancha). Un solo orden para todas las pestañas
   de Inicio. La columna «⋮» no se mueve nunca. «Por liquidar» tiene otras
   columnas: allí solo cuenta si Tercero va antes o después de Tipo.

   Se recuerda por persona (el nombre con el que entra): un fichero por
   persona, `_GESTOR/preferencias/<nombre limpio>.json`
   (`{ usuario, columnasInicio: [...] }`), sin nada compartido que pisar
   en Dropbox. Se lee al entrar, antes del primer pintado de la tabla
   (js/nucleo.js). Un directivo escribe por `Perfil.escribir`. En un
   ordenador marcado «solo consultar» no se escribe en `_GESTOR`: el orden
   vive en ese ordenador (`localStorage`). Si guardar falla, el orden vale
   hasta recargar, sin avisos.

   EXPORTAR no lee este orden: tiene su propio catálogo
   (js/exportar-datos.js).
   ============================================================ */
window.InicioColumnas = (function () {

  var POR_DEFECTO = ['plazo', 'tercero', 'tipo', 'hito', 'quien', 'inicio'];
  var CARPETA = 'preferencias';
  var CLAVE_LOCAL = 'gestor.inicio.columnas.';

  var orden = null;   /* null = el orden de siempre */

  function usuario() { return (window.Gestor && Gestor.usuario && Gestor.usuario()) || ''; }

  function hueso() {
    var h = (window.U && U.hueso) ? U.hueso(usuario()) : String(usuario()).toLowerCase().replace(/[^a-z0-9]/g, '');
    return h || 'sin-nombre';
  }
  function nombreDeFichero() { return hueso() + '.json'; }

  function soloPorMarca() { return !!(window.SoloConsulta && SoloConsulta.soloPorMarca && SoloConsulta.soloPorMarca()); }

  /* PURA: la lista si es una colocación de las seis columnas (cada una una vez), si no null. Si es la de siempre, null. */
  function limpiar(lista) {
    if (!Array.isArray(lista) || lista.length !== POR_DEFECTO.length) return null;
    var vistas = {};
    for (var i = 0; i < lista.length; i++) {
      if (POR_DEFECTO.indexOf(lista[i]) === -1 || vistas[lista[i]]) return null;
      vistas[lista[i]] = true;
    }
    return lista.join() === POR_DEFECTO.join() ? null : lista.slice();
  }

  function actual() { return orden ? orden.slice() : POR_DEFECTO.slice(); }
  function movido() { return !!orden; }

  /* En «Por liquidar»: [tercero, tipo] o [tipo, tercero], según el orden elegido. */
  function ordenLiquidar() {
    var o = actual();
    return o.indexOf('tipo') < o.indexOf('tercero') ? ['tipo', 'tercero'] : ['tercero', 'tipo'];
  }

  /* «Restablecer columnas», dentro de «Filtros»: solo sale si esta persona ha movido alguna columna. */
  function pintarEnlace() {
    var b = document.getElementById('restablecer-columnas');
    if (!b) return;
    b.classList.toggle('oculto', !orden);
    b.onclick = function () {
      if (restablecer() && window.App && App.repintarLaPestanaActiva) App.repintarLaPestanaActiva();
    };
  }

  /* ---------- leer ---------- */

  function leerLocal() {
    try { return JSON.parse(window.localStorage.getItem(CLAVE_LOCAL + hueso())); } catch (e) { return null; }
  }

  /* Al entrar (js/nucleo.js), antes del primer pintado. Nunca falla: sin nada guardado, el orden de siempre. */
  async function cargar() {
    orden = null;
    try {
      if (soloPorMarca()) { orden = limpiar(leerLocal()); return; }
      var g = window.Gestor && Gestor.carpetaGestor();
      if (!g) return;
      var carpeta = await Carpetas.crear(g, CARPETA);
      var leido = await Carpetas.leerJson(carpeta, nombreDeFichero());
      orden = limpiar(leido && leido.columnasInicio);
    } catch (e) { /* sin lo guardado, el orden de siempre */ }
    finally { pintarEnlace(); }
  }

  /* ---------- guardar ---------- */

  function escribir(fn) {
    if (window.Perfil && Perfil.esDirectivo()) return Perfil.escribir(fn);
    return fn(window.Gestor && Gestor.carpetaGestor());
  }

  async function guardar() {
    var lista = orden ? orden.slice() : null;
    try {
      if (soloPorMarca()) {
        try {
          if (lista) window.localStorage.setItem(CLAVE_LOCAL + hueso(), JSON.stringify(lista));
          else window.localStorage.removeItem(CLAVE_LOCAL + hueso());
        } catch (e) { /* sin almacenamiento: vale hasta recargar */ }
        return;
      }
      await escribir(async function (g) {
        if (!g) return;
        var carpeta = await Carpetas.crear(g, CARPETA);
        if (lista) await Carpetas.guardarJson(carpeta, nombreDeFichero(), { usuario: usuario(), columnasInicio: lista });
        else { try { await carpeta.removeEntry(nombreDeFichero()); } catch (e) { /* ya no estaba */ } }
      });
    } catch (e) { /* el orden vale hasta recargar */ }
  }

  /* ---------- cambiar ---------- */

  /* Pone `col` en el hueco `hueco` (0 = la primera, 6 = detrás de la última) de la colocación de ahora. */
  function mover(col, hueco) {
    var o = actual();
    var de = o.indexOf(col);
    if (de === -1) return false;
    o.splice(de, 1);
    if (hueco > de) hueco--;
    o.splice(Math.max(0, Math.min(o.length, hueco)), 0, col);
    var nuevo = limpiar(o);
    if (JSON.stringify(nuevo) === JSON.stringify(orden)) return false;
    orden = nuevo;
    pintarEnlace();
    guardar();
    return true;
  }

  /* Vuelve al orden de siempre y borra lo guardado de esta persona. */
  function restablecer() {
    if (!orden) return false;
    orden = null;
    pintarEnlace();
    guardar();
    return true;
  }

  return {
    POR_DEFECTO: POR_DEFECTO, orden: actual, movido: movido, ordenLiquidar: ordenLiquidar,
    cargar: cargar, mover: mover, restablecer: restablecer,
    /* para las pruebas */
    _limpiar: limpiar
  };
})();
