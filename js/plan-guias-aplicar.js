/* ============================================================
   plan-guias-aplicar.js — calcular y aplicar el plan de las guías (fila 551,
   docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md). La pantalla, en
   js/plan-guias-pantalla.js; el cálculo, en js/plan-guias.js y
   js/plan-guias-listas.js.

   - `calcular()` no escribe nada: es lo que se enseña antes de aplicar.
   - `aplicar()` guarda una copia de las guías, escribe las dos listas comunes
     y las guías (sin llevar nada a los asuntos abiertos: siguen como están) y,
     al final, apunta en `_GESTOR/plan-guias-aplicado.json` que el plan está
     aplicado. Con esa marca desaparece lo viejo (class `plan-guias-aplicado`
     en <html>, css/comunes.css); sin ella, todo sigue como hoy.
   - `alActivarTipo()`: al activar un tipo después, su guía pasa a las listas
     con las mismas reglas.
   ============================================================ */
var PlanGuiasAplicar = (function () {

  var MARCA = 'plan-guias-aplicado.json';
  var RUTA_PLAN = 'datos-biblioteca/plan-guias.json';
  var marca = null, marcaLeida = false, plan = null;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }
  function aplicado() { return !!marca; }
  function ponerClase() { document.documentElement.classList.toggle('plan-guias-aplicado', !!marca); }

  async function leerMarca() {
    var g = gestor();
    if (!g) return null;
    try {
      var d = await Carpetas.leerJson(g, MARCA);
      marca = (d && d.aplicado) ? d : null;
      marcaLeida = true;
    } catch (e) { /* sin lectura, se queda como estaba */ }
    ponerClase();
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

  async function calcularSobre(tiposElegidos) {
    try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
    var guias = GuiasDelCentro.todas(), quien = tiposDe(guias);
    if (tiposElegidos) quien = { activos: tiposElegidos.filter(function (t) { return (guias[t] || []).length; }), inactivos: [] };
    var listas = await ComunesGuardado.leer();
    var a = PlanGuias.transformar(guias, await leerPlan(), quien);
    var b = PlanGuiasListas.construir(a.guias, quien.activos, listas);
    var cambian = quien.activos.filter(function (t) { return JSON.stringify(b.guias[t] || null) !== JSON.stringify(guias[t] || null); });
    return { antes: guias, guias: b.guias, listas: b.listas, plan: a.informe, comunes: b.informe, quien: quien, cambian: cambian };
  }
  function calcular() { return calcularSobre(null); }

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

  /* Escribe listas y guías de un cálculo. Las guías se releen justo antes de escribir y solo se tocan los tipos que cambian. */
  async function escribir(r) {
    var g = gestor();
    if (!g) throw new Error('No hay carpeta de ajustes señalada.');
    /* Los asuntos abiertos siguen como están: lo que cambia o se quita de una tarea se les queda como tarea suya (antes de tocar la guía). */
    await ComunesGuardado.fijarEnAbiertos(lineasQueCambian(r.antes, r.guias, r.cambian), '');
    await ComunesGuardado.cambiar('tareas', function (actual) { return PlanGuiasListas.fusionar(actual, r.listas.tareas); });
    await ComunesGuardado.cambiar('hitos', function (actual) { return PlanGuiasListas.fusionar(actual, r.listas.hitos); });
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

  /* El botón «Aplicar el plan de las guías». Devuelve el cálculo aplicado. */
  async function aplicar() {
    var g = gestor();
    if (!g) throw new Error('No hay carpeta de ajustes señalada.');
    var r = await calcular();
    /* La copia de las guías, aparte de la del día, justo antes de tocar nada. */
    await Carpetas.guardarJson(g, 'guias-antes-del-plan-' + sello() + '.json', r.antes);
    await escribir(r);
    var nueva = { version: 1, aplicado: new Date().toISOString(), guiasCambiadas: r.cambian.length,
                  tareasComunes: r.comunes.tareasComunes, hitosComunes: r.comunes.hitosComunes };
    await Copias.guardar(g, MARCA, nueva);
    marca = nueva;
    ponerClase();
    if (window.Gestor && Gestor.recargar) { try { await Gestor.recargar(); } catch (e) { /* solo pintar */ } }
    return r;
  }

  function pl(x, uno, varios) { return x + ' ' + (x === 1 ? uno : varios); }

  /* Un tipo que se activa después: su guía pasa a las listas con las mismas reglas, y se avisa de cuántas ya estaban y cuántas entran. */
  async function alActivarTipo(tipo) {
    if (!marca || !tipo || !gestor()) return null;
    try {
      var r = await calcularSobre([tipo.tipo]);
      if (!(r.antes[tipo.tipo] || []).length) return null;
      await escribir(r);
      var c = r.comunes;
      U.aviso('La guía de «' + tipo.tipo + '» ha pasado a las listas comunes: ' + pl(c.tareasYaEstaban, 'tarea ya estaba', 'tareas ya estaban') +
        ' en la lista y ' + pl(c.tareasComunes, 'entra nueva', 'entran nuevas') + '; ' + pl(c.hitosYaEstaban, 'hito ya estaba', 'hitos ya estaban') +
        ' y ' + pl(c.hitosComunes, 'entra nuevo', 'entran nuevos') + '.', 'bueno');
      return r;
    } catch (e) {
      U.fallo('No he podido pasar la guía de «' + tipo.tipo + '» a las listas comunes', e);
      return null;
    }
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (!marcaLeida && window.Gestor.carpetaGestor()) leerMarca();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { calcular: calcular, aplicar: aplicar, aplicado: aplicado, leerMarca: leerMarca, alActivarTipo: alActivarTipo, MARCA: MARCA };
})();
window.PlanGuiasAplicar = PlanGuiasAplicar;
