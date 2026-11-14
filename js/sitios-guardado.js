/* ============================================================
   sitios-guardado.js — leer y guardar el mapa de sitios en `_GESTOR/sitios.json`
   (fila 659, docs/659-DONDE-SE-HACE-Y-NOMBRES.md). La parte pura está en js/sitios.js.

   - `cargar()` lee el fichero y lo deja en memoria (`Sitios.datos()`); si no existe, vale la
     lista de partida y se crea el fichero la primera vez que se cambia algo.
   - `cambiar(fn)`: relee, deja que `fn` devuelva el mapa nuevo y lo guarda (ColaGuardado + Copias).
   - `reasignar(pasan)`: pone en las tareas el «dónde» nuevo (lista común, guías y tareas «solo aquí»
     de los asuntos). Se hace ANTES de borrar el sitio.
   - `lineasQueLoUsan()`: las tareas de la lista común, de las guías y «solo aquí» de los asuntos, para contar.
   ============================================================ */
var SitiosGuardado = (function () {

  var FICHERO = 'sitios.json';

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  async function leer() {
    var g = gestor();
    var leido = g ? await Carpetas.leerJson(g, FICHERO) : null;
    return Sitios.poner(leido);
  }

  var cargando = null;
  /* Lee el fichero una vez y deja lo leído en memoria. `otraVez`: vuelve a leerlo. */
  function cargar(otraVez) {
    if (!cargando || otraVez) cargando = leer().catch(function () { return Sitios.datos(); });
    return cargando;
  }

  /* `hacer(datos)` devuelve el mapa nuevo. Se guarda releyendo justo antes. */
  function cambiar(hacer) {
    return ColaGuardado.poner(FICHERO, async function () {
      var g = gestor();
      if (!g) throw new Error('No hay carpeta de ajustes señalada.');
      var leido = await Carpetas.leerJson(g, FICHERO);
      var actual = Sitios.normalizar(leido);
      var nuevo = Sitios.normalizar(hacer(actual) || actual);
      await Copias.guardar(g, FICHERO, nuevo);
      Sitios.poner(nuevo);
      return nuevo;
    });
  }

  /* Las tareas que cuentan para los números de la ventana: las de la lista común y las líneas de las guías que no vienen de ella. */
  async function lineasQueLoUsan() {
    var lineas = [];
    try { lineas = lineas.concat((await ComunesGuardado.leer()).tareas); } catch (e) { /* sin lista, sin sus tareas */ }
    try {
      await GuiasDelCentro.recargar();
      Comunes.recorrerGuias(GuiasDelCentro.todas(), null, function (g) { if (!g.pregunta && !g.comun) lineas.push(g); });
    } catch (e2) { /* sin guías, sin sus líneas */ }
    /* Y las tareas «solo aquí» de los asuntos, que también llevan su sitio. */
    try {
      var d = window.Hitos && Hitos.leer ? await Hitos.leer() : null;
      Object.keys((d && d.porAsunto) || {}).forEach(function (k) {
        ((d.porAsunto[k] && d.porAsunto[k].hitos) || []).forEach(function (h) { (h.guionPropio || []).forEach(function (g) { lineas.push(g); }); });
      });
    } catch (e3) { /* sin asuntos, sin sus tareas */ }
    return lineas;
  }

  /* Pone `pasan(donde)` en cada tarea que lo tiene: lista común, guías y tareas «solo aquí» de los asuntos. Devuelve cuántas tocó. */
  async function reasignar(pasan) {
    var tocadas = 0;
    function cambia(g) {
      if (!g.donde) return false;
      var nuevo = pasan(g.donde);
      if (Sitios.igualDonde(nuevo, g.donde)) return false;
      if (nuevo) g.donde = nuevo; else delete g.donde;
      return true;
    }
    await ComunesGuardado.cambiar('tareas', function (lista) {
      return lista.map(function (t) { var c = JSON.parse(JSON.stringify(t)); if (cambia(c)) tocadas++; return c; });
    });
    try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
    var guias = GuiasDelCentro.todas();
    var tipos = Object.keys(guias || {});
    for (var i = 0; i < tipos.length; i++) {
      await GuiasDelCentro.cambiarPasos(tipos[i], function (pasos) {
        var hay = false;
        Comunes.recorrerGuias({ t: pasos }, null, function (g) { if (!g.pregunta && cambia(g)) hay = true; });
        return hay ? undefined : false;
      }, { sinLlevar: true });
    }
    if (window.Hitos && Hitos.cambiar) {
      await Hitos.cambiar(function (d) {
        Object.keys((d && d.porAsunto) || {}).forEach(function (k) {
          ((d.porAsunto[k] && d.porAsunto[k].hitos) || []).forEach(function (h) { (h.guionPropio || []).forEach(cambia); });
        });
        return d;
      });
    }
    return tocadas;
  }

  return { cargar: cargar, cambiar: cambiar, reasignar: reasignar, lineasQueLoUsan: lineasQueLoUsan, FICHERO: FICHERO };
})();
window.SitiosGuardado = SitiosGuardado;
