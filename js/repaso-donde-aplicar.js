/* ============================================================
   repaso-donde-aplicar.js — calcular y aplicar el repaso del «dónde»
   (fila 659, docs/659-DONDE-SE-HACE-Y-NOMBRES.md). El cálculo, en js/repaso-donde.js; la pantalla, en
   js/repaso-donde-pantalla.js. Igual que el de la fila 657 (js/repaso-guias-aplicar.js):

   - `calcular()` no escribe nada: es lo que se enseña antes de aplicar.
   - `aplicar()` guarda una copia de las guías y de la lista común de tareas, crea el fichero de sitios si
     no existe, reescribe las guías tocadas y la lista de tareas (los asuntos abiertos siguen como están) y
     apunta en `_GESTOR/repaso-donde-aplicado.json` que ya está aplicado; con esa marca desaparece el botón.
   ============================================================ */
var RepasoDondeAplicar = (function () {

  var MARCA = 'repaso-donde-aplicado.json';
  var RUTA_PLAN = 'datos-biblioteca/repaso-donde.json';
  var marca = null, plan = null;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }
  function aplicado() { return !!marca; }

  async function leerMarca() {
    var g = gestor();
    if (!g) return null;
    try {
      var d = await Carpetas.leerJson(g, MARCA);
      marca = (d && d.aplicado) ? d : null;
    } catch (e) { /* sin lectura, se queda como estaba */ }
    return marca;
  }

  async function leerPlan() {
    if (!plan) plan = await App.leerFicheroDeLaApp(RUTA_PLAN, 'json');
    return plan;
  }

  /* Calcula con los datos que se le den (la prueba usa copias de los ficheros reales) o con los del disco. */
  function calcularCon(guias, listas, datosPlan, contexto) {
    var a = RepasoDonde.transformar(guias, listas, datosPlan, contexto);
    var cambian = a.informe.guiasTocadas.filter(function (t) { return JSON.stringify(a.guias[t] || null) !== JSON.stringify(guias[t] || null); });
    return { antes: guias, listasAntes: listas, guias: a.guias, listas: { tareas: a.tareas, hitos: listas.hitos }, informe: a.informe, cambian: cambian };
  }

  async function calcular() {
    try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
    try { await SitiosGuardado.cargar(true); } catch (e2) { /* con la lista de partida */ }
    var guias = GuiasDelCentro.todas();
    var contexto = { sitios: Sitios.datos(), tiposDocumento: (window.App && App.E && App.E.tiposDocumento) || [] };
    return calcularCon(guias, await ComunesGuardado.leer(), await leerPlan(), contexto);
  }

  function dosDigitos(x) { return String(x).padStart(2, '0'); }
  function sello() {
    var d = new Date();
    return '' + d.getFullYear() + dosDigitos(d.getMonth() + 1) + dosDigitos(d.getDate()) + '-' + dosDigitos(d.getHours()) + dosDigitos(d.getMinutes());
  }

  /* Lo que se ve de una tarea: si cambia (o desaparece), el asunto abierto se queda con la línea de antes. */
  function visible(g) {
    return JSON.stringify([g.texto, g.explicacion || '', g.accion || '', (g.normativa && g.normativa.cita) || '', g.receta || null, g.reunir || '', !!g.obligatorio, g.donde || null, g.tipoDocumento || '', g.aQuien || '']);
  }
  function lineasQueCambian(antes, despues, tipos) {
    var r = {};
    tipos.forEach(function (tipo) {
      var nuevas = {};
      Comunes.recorrerGuias({ t: despues[tipo] || [] }, null, function (g, l, i, t, paso) { if (!g.pregunta) nuevas[paso.id + '|' + g.id] = visible(g); });
      Comunes.recorrerGuias({ t: antes[tipo] || [] }, null, function (g, l, i, t, paso) {
        if (!g.pregunta && nuevas[paso.id + '|' + g.id] !== visible(g)) (r[tipo] = r[tipo] || []).push({ pasoId: paso.id, linea: g });
      });
    });
    return r;
  }

  function rehacer(actual, calculada, conocidos) {
    var ids = {};
    (conocidos || []).forEach(function (x) { ids[x.id] = true; });
    return calculada.concat((actual || []).filter(function (x) { return !ids[x.id]; }));
  }

  async function escribir(r) {
    var g = gestor();
    if (!g) throw new Error('No hay carpeta de ajustes señalada.');
    /* Los asuntos abiertos siguen como están: lo que cambia o se quita de una tarea se les queda como tarea suya (antes de tocar la guía). */
    await ComunesGuardado.fijarEnAbiertos(lineasQueCambian(r.antes, r.guias, r.cambian), '');
    await SitiosGuardado.cambiar(function (d) { return d; });   /* crea sitios.json con la lista de partida si no estaba */
    await ComunesGuardado.cambiar('tareas', function (actual) { return rehacer(actual, r.listas.tareas, r.listasAntes.tareas); });
    await ColaGuardado.poner('guias.json', async function () {
      var leido = await Carpetas.leerJson(g, 'guias.json');
      var datos = (leido && typeof leido === 'object') ? leido : {};
      r.cambian.forEach(function (t) { datos[t] = r.guias[t]; });
      await Copias.guardar(g, 'guias.json', datos);
    });
    await GuiasDelCentro.recargar();
    for (var i = 0; i < r.cambian.length; i++) {
      if (!window.CamposDeHito) break;
      try { await CamposDeHito.limpiarMarcas(r.cambian[i], r.guias[r.cambian[i]]); }
      catch (e) { U.accesorio('La guía de ' + r.cambian[i] + ' se ha guardado, pero no he podido soltar los campos de un hito quitado', e); }
    }
  }

  /* El botón «Aplicar el repaso del dónde». Devuelve el cálculo aplicado. */
  async function aplicar() {
    var g = gestor();
    if (!g) throw new Error('No hay carpeta de ajustes señalada.');
    var r = await calcular();
    /* La copia de las guías y de la lista común de tareas, aparte de la del día, justo antes de tocar nada. */
    await Carpetas.guardarJson(g, 'guias-antes-del-repaso-donde-' + sello() + '.json', r.antes);
    await Carpetas.guardarJson(g, 'listas-comunes-antes-del-repaso-donde-' + sello() + '.json', { version: 1, tareas: r.listasAntes.tareas, hitos: r.listasAntes.hitos });
    await escribir(r);
    var nueva = { version: 1, aplicado: new Date().toISOString(), guiasCambiadas: r.cambian.length, tareasComunes: r.informe.tareasComunes };
    await Copias.guardar(g, MARCA, nueva);
    marca = nueva;
    if (window.Gestor && Gestor.recargar) { try { await Gestor.recargar(); } catch (e) { /* solo pintar */ } }
    return r;
  }

  return { calcular: calcular, calcularCon: calcularCon, aplicar: aplicar, aplicado: aplicado, leerMarca: leerMarca, lineasQueCambian: lineasQueCambian, MARCA: MARCA };
})();
window.RepasoDondeAplicar = RepasoDondeAplicar;
