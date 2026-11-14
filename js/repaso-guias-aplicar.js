/* ============================================================
   repaso-guias-aplicar.js — calcular y aplicar el repaso de la lista común
   (fila 657, docs/657-REPASO-LISTA-COMUN.md, tema 650 parte 2). El cálculo, en
   js/repaso-guias.js; la pantalla, en js/repaso-guias-pantalla.js.

   - `calcular()` no escribe nada: es lo que se enseña antes de aplicar.
   - `aplicar()` guarda una copia de las guías y de las dos listas comunes,
     reescribe las guías repasadas y las dos listas (sin llevar nada a los
     asuntos abiertos: siguen como están) y apunta en
     `_GESTOR/repaso-lista-aplicado.json` que el repaso está aplicado; con esa
     marca desaparece el botón.
   ============================================================ */
var RepasoGuiasAplicar = (function () {

  var MARCA = 'repaso-lista-aplicado.json';
  var RUTA_PLAN = 'datos-biblioteca/repaso-guias.json';
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

  /* Tipos con guía: los activos pasan, los desactivados se saltan. */
  function tiposDe(guias) {
    var activos = [], inactivos = [];
    Object.keys(guias || {}).forEach(function (nombre) {
      if (!(guias[nombre] || []).length) return;
      var t = (App.E.tipos || []).filter(function (x) { return x.tipo === nombre; })[0];
      if (!t) return;
      (t.desactivado ? inactivos : activos).push(nombre);
    });
    return { activos: activos, inactivos: inactivos };
  }

  /* Calcula con los datos que se le den (la prueba lo usa con copias de los ficheros reales) o con los del disco. */
  async function calcularCon(guias, listas, datosPlan, quien) {
    var a = RepasoGuias.transformar(guias, datosPlan, quien, listas.tareas);
    var tipos = a.informe.guiasTocadas;
    var b = RepasoGuias.listas(a.guias, tipos, listas, guias);
    var cambian = tipos.filter(function (t) { return JSON.stringify(b.guias[t] || null) !== JSON.stringify(guias[t] || null); });
    /* Lo que queda de cada lista: lo calculado y lo de hoy que otra guía no repasada sigue usando. */
    var usos = Comunes.usos(b.guias);
    var tareas = b.listas.tareas.slice(), hitos = b.listas.hitos.slice();
    listas.tareas.forEach(function (t) { if ((usos.tareas[t.id] || []).length && !tareas.some(function (x) { return x.id === t.id; })) tareas.push(t); });
    listas.hitos.forEach(function (h) { if ((usos.hitos[h.id] || []).length && !hitos.some(function (x) { return x.id === h.id; })) hitos.push(h); });
    return { antes: guias, listasAntes: listas, guias: b.guias, listas: { tareas: tareas, hitos: hitos }, plan: a.informe, comunes: b.informe,
             quien: quien, cambian: cambian };
  }

  async function calcular() {
    try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
    var guias = GuiasDelCentro.todas();
    return calcularCon(guias, await ComunesGuardado.leer(), await leerPlan(), tiposDe(guias));
  }

  function dosDigitos(x) { return String(x).padStart(2, '0'); }
  function sello() {
    var d = new Date();
    return '' + d.getFullYear() + dosDigitos(d.getMonth() + 1) + dosDigitos(d.getDate()) + '-' + dosDigitos(d.getHours()) + dosDigitos(d.getMinutes());
  }

  /* Las tareas de las guías que se ven distintas (o desaparecen) tras el cambio: { tipo: [{ pasoId, linea }] }, con la línea como era. */
  function visible(g) {
    return JSON.stringify([g.texto, g.explicacion || '', g.accion || '', (g.normativa && g.normativa.cita) || '', g.receta || null, g.reunir || '', !!g.obligatorio]);
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

  /* Una lista se rehace: lo calculado, más lo que haya entrado en el disco desde que se leyó (por id). */
  function rehacer(actual, calculada, conocidos) {
    var ids = {};
    (conocidos || []).forEach(function (x) { ids[x.id] = true; });
    return calculada.concat((actual || []).filter(function (x) { return !ids[x.id]; }));
  }

  /* Escribe listas y guías de un cálculo. Las guías se releen justo antes de escribir y solo se tocan los tipos que cambian. */
  async function escribir(r) {
    var g = gestor();
    if (!g) throw new Error('No hay carpeta de ajustes señalada.');
    /* Los asuntos abiertos siguen como están: lo que cambia o se quita de una tarea se les queda como tarea suya (antes de tocar la guía). */
    await ComunesGuardado.fijarEnAbiertos(lineasQueCambian(r.antes, r.guias, r.cambian), '');
    await ComunesGuardado.cambiar('tareas', function (actual) { return rehacer(actual, r.listas.tareas, r.listasAntes.tareas); });
    await ComunesGuardado.cambiar('hitos', function (actual) { return rehacer(actual, r.listas.hitos, r.listasAntes.hitos); });
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

  /* El botón «Aplicar el repaso de la lista común». Devuelve el cálculo aplicado. */
  async function aplicar() {
    var g = gestor();
    if (!g) throw new Error('No hay carpeta de ajustes señalada.');
    var r = await calcular();
    /* La copia de las guías y de las dos listas, aparte de la del día, justo antes de tocar nada. */
    await Carpetas.guardarJson(g, 'guias-antes-del-repaso-' + sello() + '.json', r.antes);
    await Carpetas.guardarJson(g, 'listas-comunes-antes-del-repaso-' + sello() + '.json', { version: 1, tareas: r.listasAntes.tareas, hitos: r.listasAntes.hitos });
    await escribir(r);
    var nueva = { version: 1, aplicado: new Date().toISOString(), guiasCambiadas: r.cambian.length,
                  tareasComunes: r.listas.tareas.length, hitosComunes: r.listas.hitos.length };
    await Copias.guardar(g, MARCA, nueva);
    marca = nueva;
    if (window.Gestor && Gestor.recargar) { try { await Gestor.recargar(); } catch (e) { /* solo pintar */ } }
    return r;
  }

  return { calcular: calcular, calcularCon: calcularCon, aplicar: aplicar, aplicado: aplicado, leerMarca: leerMarca, MARCA: MARCA };
})();
window.RepasoGuiasAplicar = RepasoGuiasAplicar;
