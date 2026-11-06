/* ============================================================
   plan-guias-listas.js — de las guías ya limpias (js/plan-guias.js) a las
   listas comunes de tareas y de hitos (fila 551,
   docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md, puntos 3 a 5).

   Puro: recibe las guías, qué tipos pasan y las listas que ya hay, y devuelve
   las guías con la marca `comun` en cada tarea y cada hito, las listas
   completas y las cuentas. No escribe nada.

   - Una tarea es la misma si dicen lo mismo su nombre, lo que hace y su
     configuración (la plantilla incluida): se unen, y la tarea común guarda
     TODAS las explicaciones (una debajo de otra, sin repetir) y todas las
     normativas (la primera como normativa; las demás, citadas al final de la
     explicación). Si cambia la plantilla o la configuración, quedan como
     tareas distintas, con el mismo nombre.
   - Lo mismo con los hitos: mismo nombre y mismas tareas. Un hito con una
     pregunta dentro de sus tareas no cabe en la lista de hitos (guarda la
     pregunta): se queda como está, y se cuenta.
   - Las líneas conservan su `id`: los asuntos abiertos no se tocan.
   ============================================================ */
var PlanGuiasListas = (function () {

  var n = PlanGuias.norm;
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function claveTarea(g) {
    return [n(g.texto), g.accion || '', JSON.stringify(g.receta || null), g.reunir || '', g.reunir ? (g.obligatorio ? '1' : '0') : ''].join('|');
  }
  function claveDeTareaComun(t) {
    return claveTarea({ texto: t.nombre, accion: t.accion, receta: t.receta, reunir: t.reunir, obligatorio: t.obligatorio });
  }
  function sinEtiquetas(h) { return n(String(h || '').replace(/<[^>]*>/g, ' ')); }

  /* La tarea común de un grupo de líneas iguales. `existente`: la de la lista, si ya hay una igual. */
  function tareaDeGrupo(grupo, existente) {
    var primera = grupo.lineas[0], explicacion = existente ? existente.explicacion || '' : '';
    var normativa = (existente && existente.normativa) || null;
    grupo.lineas.forEach(function (g) {
      explicacion = PlanGuias.unirTexto(explicacion, g.explicacion);
      if (!normativa && g.normativa && g.normativa.cita) normativa = copia(g.normativa);
    });
    grupo.lineas.forEach(function (g) {
      var tmp = { explicacion: explicacion, normativa: normativa };
      explicacion = PlanGuias.citaAlTexto(tmp, g.normativa);
    });
    return Comunes.normalizarTarea({
      id: existente ? existente.id : U.nuevoId('tc'), nombre: existente ? existente.nombre : primera.texto,
      accion: primera.accion || '', receta: primera.receta || null, explicacion: explicacion, normativa: normativa,
      reunir: primera.reunir, obligatorio: primera.obligatorio
    });
  }

  function tieneEnlace(paso) {
    return (paso.guion || []).some(function (g) { return g.pregunta; });
  }

  /* `tipos`: los tipos cuyas guías pasan. `listas`: { tareas, hitos } que ya hay. Devuelve { guias, listas, informe }. */
  function construir(guias, tipos, listas) {
    var nuevas = copia(guias || {}), sub = {}, previas = listas || { tareas: [], hitos: [] };
    tipos.forEach(function (t) { if (nuevas[t]) sub[t] = nuevas[t]; });
    var inf = { lineas: 0, tareasComunes: 0, tareasYaEstaban: 0, tareasUnidas: 0, tareasSeparadas: [],
                hitosPasos: 0, hitosComunes: 0, hitosYaEstaban: 0, hitosUnidos: 0, hitosSeparados: [], hitosConPregunta: 0 };

    /* 1. Tareas */
    var grupos = {}, orden = [];
    Comunes.recorrerGuias(sub, null, function (g) {
      if (g.pregunta) return;
      inf.lineas++;
      var k = claveTarea(g);
      if (!grupos[k]) { grupos[k] = { clave: k, lineas: [] }; orden.push(k); }
      grupos[k].lineas.push(g);
    });
    var tareas = copia(previas.tareas), porNombre = {};
    orden.forEach(function (k) {
      var gr = grupos[k];
      var existente = tareas.filter(function (t) { return claveDeTareaComun(t) === k; })[0] || null;
      var t = tareaDeGrupo(gr, existente);
      if (existente) { inf.tareasYaEstaban++; tareas = tareas.map(function (x) { return x.id === t.id ? t : x; }); }
      else { inf.tareasComunes++; tareas.push(t); }
      if (gr.lineas.length > 1) inf.tareasUnidas += gr.lineas.length - 1;
      var nom = n(t.nombre);
      (porNombre[nom] = porNombre[nom] || []).push(t.nombre);
      gr.lineas.forEach(function (g) { Comunes.aplicarATarea(g, t); g.comun = t.id; });
    });
    Object.keys(porNombre).forEach(function (nom) {
      if (porNombre[nom].length > 1) inf.tareasSeparadas.push({ nombre: porNombre[nom][0], maneras: porNombre[nom].length });
    });

    /* 2. Hitos */
    var gh = {}, ordenH = [];
    Comunes.recorrerGuias(sub, function (p) {
      if (p.opciones && p.opciones.length) return;
      if (tieneEnlace(p)) { inf.hitosConPregunta++; return; }
      inf.hitosPasos++;
      var ids = (p.guion || []).map(function (g) { return g.comun; });
      var k = n(p.titulo) + '|' + ids.join(',');
      if (!gh[k]) { gh[k] = { clave: k, pasos: [], ids: ids }; ordenH.push(k); }
      gh[k].pasos.push(p);
    }, null);
    var hitos = copia(previas.hitos), hporNombre = {};
    ordenH.forEach(function (k) {
      var gr = gh[k], primero = gr.pasos[0], cuerpo = '';
      var existente = hitos.filter(function (h) { return n(h.nombre) === n(primero.titulo) && (h.tareas || []).join(',') === gr.ids.join(','); })[0] || null;
      var vistos = [];
      [existente ? existente.explicacion : ''].concat(gr.pasos.map(function (p) { return p.cuerpo; })).forEach(function (c) {
        var s = sinEtiquetas(c);
        if (!s || vistos.indexOf(s) !== -1) return;
        vistos.push(s);
        cuerpo += c;
      });
      var h = Comunes.normalizarHito({ id: existente ? existente.id : U.nuevoId('hc'), nombre: existente ? existente.nombre : primero.titulo, explicacion: cuerpo, tareas: gr.ids });
      if (existente) { inf.hitosYaEstaban++; hitos = hitos.map(function (x) { return x.id === h.id ? h : x; }); }
      else { inf.hitosComunes++; hitos.push(h); }
      if (gr.pasos.length > 1) inf.hitosUnidos += gr.pasos.length - 1;
      var nom = n(h.nombre);
      (hporNombre[nom] = hporNombre[nom] || []).push(h.nombre);
      gr.pasos.forEach(function (p) { p.titulo = h.nombre; p.cuerpo = Guias.limpiar(h.explicacion); p.comun = h.id; });
    });
    Object.keys(hporNombre).forEach(function (nom) {
      if (hporNombre[nom].length > 1) inf.hitosSeparados.push({ nombre: hporNombre[nom][0], maneras: hporNombre[nom].length });
    });

    return { guias: nuevas, listas: { tareas: tareas, hitos: hitos }, informe: inf };
  }

  /* Mete lo calculado en lo que haya ahora en el disco (por id: lo calculado manda, lo demás se queda). */
  function fusionar(actual, calculada) {
    var lista = (actual || []).slice();
    (calculada || []).forEach(function (x) {
      var i = -1;
      lista.forEach(function (y, j) { if (y.id === x.id) i = j; });
      if (i === -1) lista.push(x); else lista[i] = x;
    });
    return lista;
  }

  return { construir: construir, fusionar: fusionar, claveTarea: claveTarea };
})();
window.PlanGuiasListas = PlanGuiasListas;
