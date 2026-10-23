/* ============================================================
   etiquetas-guardado.js — los modelos y los diseños propios (fila 344, docs/ETIQUETAS.md).

   `_GESTOR/etiquetas.json`: { modelos: [modelo], disenos: [diseno] }, compartido por los dos ordenadores. Se
   guarda por la cola por fichero (ColaGuardado), leyendo de nuevo justo antes de escribir. Imprimir no escribe
   nada: solo guardar un modelo o un diseño (en «solo consultar», no se puede).
   - leer() → { modelos, disenos }.
   - cambiar(fn) → lee, aplica `fn(datos)` y guarda; devuelve lo guardado.
   - nuevoId(prefijo) → un identificador que no se repite.
   - ultimo() / recordar(clave, valor): lo último que se usó en ESTE ordenador (localStorage): modelo, diseño y orden.
   - trabajo() / guardarTrabajo(obj) (fila 450): el trabajo a medias de la pantalla (personas, filtro, lista pegada,
     copias, huecos de cada pestaña), también solo en ESTE ordenador. Nunca da error: sin almacenamiento, no guarda.
   ============================================================ */
var EtiquetasGuardado = (function () {

  var FICHERO = 'etiquetas.json';
  var CLAVE = 'gestor.etiquetas.ultimo';
  var CLAVE_TRABAJO = 'gestor.etiquetas.trabajo';

  function normalizar(d) {
    d = d && typeof d === 'object' ? d : {};
    return { modelos: Array.isArray(d.modelos) ? d.modelos : [], disenos: Array.isArray(d.disenos) ? d.disenos : [] };
  }

  async function leer(g) {
    g = g || App.E.gestor;
    if (!g) return normalizar(null);
    try { return normalizar(await Carpetas.leerJson(g, FICHERO)); }
    catch (e) { return normalizar(null); }
  }

  /* Como js/encargos.js: un directivo escribe por `Perfil.escribir`; en un ordenador marcado «solo consultar», no. */
  function escribir(fn) {
    var marcado = window.SoloConsulta && SoloConsulta.soloPorMarca && SoloConsulta.soloPorMarca();
    if (!marcado && window.Perfil && Perfil.esDirectivo()) return Perfil.escribir(fn);
    return fn(App.E.gestor);
  }

  function cambiar(hacer) {
    return escribir(function (g) {
      return App.enFila(FICHERO, async function () {
        var datos = await leer(g);
        hacer(datos);
        await Carpetas.guardarJson(g, FICHERO, datos);
        return datos;
      });
    });
  }

  function nuevoId(prefijo) { return prefijo + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  function ultimo() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (e) { return {}; }
  }
  function recordar(clave, valor) {
    try { var u = ultimo(); u[clave] = valor; localStorage.setItem(CLAVE, JSON.stringify(u)); } catch (e) { /* sin almacenamiento */ }
  }

  function trabajo() {
    try { var t = JSON.parse(localStorage.getItem(CLAVE_TRABAJO) || 'null'); return t && typeof t === 'object' ? t : null; } catch (e) { return null; }
  }
  function guardarTrabajo(obj) {
    try { localStorage.setItem(CLAVE_TRABAJO, JSON.stringify(obj)); } catch (e) { /* sin almacenamiento */ }
  }

  return { trabajo: trabajo, guardarTrabajo: guardarTrabajo, FICHERO: FICHERO, leer: leer, cambiar: cambiar, nuevoId: nuevoId, ultimo: ultimo, recordar: recordar };
})();
window.EtiquetasGuardado = EtiquetasGuardado;
