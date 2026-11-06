/* ============================================================
   plan-guias.js — aplicar el plan de las guías (fila 551,
   docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md, tema 550; el plan es
   docs/544-PLAN-GUIAS.md y viaja como dato en
   datos-biblioteca/plan-guias.json).

   Esta parte es solo cálculo (sin disco ni pantalla): recibe las guías, el plan
   y qué tipos están activos, y devuelve las guías cambiadas más un informe.
   Primero lo propio de cada guía de la biblioteca (sustituir, quitar, mover);
   después, en todas: quitar «Archivar», unir los hitos y las tareas que se
   llaman distinto y dicen lo mismo, y poner en cada hito de certificado la
   tarea de enviar el documento. Las listas comunes las monta
   js/plan-guias-listas.js; guardar y la pantalla, js/plan-guias-pantalla.js.
   Lo que el plan nombra y no se encuentra se salta y se dice; nada se inventa.
   ============================================================ */
var PlanGuias = (function () {

  function n(t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function igualJson(a, b) { return JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b); }

  /* Un nombre del plan casa con un texto de la guía. Si acaba en «…», con todo lo que empiece así (y devuelve el resto). */
  function casa(nombrePlan, texto) {
    var a = n(nombrePlan), b = n(texto);
    if (a.charAt(a.length - 1) === '…') {
      var pref = a.slice(0, -1).trim();
      return b.indexOf(pref) === 0 ? { resto: String(texto).trim().slice(pref.length).trim() } : null;
    }
    return a === b ? { resto: '' } : null;
  }
  function nombreDe(x) { return typeof x === 'string' ? x : (x && x.nombre) || ''; }

  /* De los nombres de la tabla del plan (hitos o tareas) saca a cuál corresponde un texto: { destino, desde, resto } o null. */
  function buscarEn(tabla, texto) {
    for (var i = 0; i < tabla.length; i++) {
      var desde = tabla[i].desde || [];
      for (var j = 0; j < desde.length; j++) {
        var m = casa(nombreDe(desde[j]), texto);
        if (m) return { destino: tabla[i], desde: desde[j], resto: m.resto };
      }
      var propio = casa(tabla[i].nombre, texto);
      if (propio) return { destino: tabla[i], desde: tabla[i].nombre, resto: '' };
    }
    return null;
  }

  /* ---------- recorrer ---------- */

  /* Cada hito de la lista y, dentro de una pregunta, los de sus respuestas: fn(paso, lista, índice). */
  function recorrerPasos(pasos, fn) {
    (pasos || []).forEach(function (p, i) {
      fn(p, pasos, i);
      (p.opciones || []).forEach(function (o) { recorrerPasos(o.pasos, fn); });
    });
  }
  function quitarDe(lista, i) { lista.splice(i, 1); }

  function unirTexto(a, b) {
    a = String(a || '').trim(); b = String(b || '').trim();
    if (!b || n(a).indexOf(n(b)) !== -1) return a;
    return a ? a + '\n\n' + b : b;
  }
  /* La normativa de una tarea que se une a otra: si es otra cita, pasa a su explicación. */
  function citaAlTexto(g, normativa) {
    if (!normativa || !normativa.cita) return g.explicacion || '';
    if (g.normativa && n(g.normativa.cita) === n(normativa.cita)) return g.explicacion || '';
    return unirTexto(g.explicacion, 'Normativa: ' + normativa.cita);
  }

  /* ---------- lo propio de cada guía de la biblioteca ---------- */

  function pasoSustituto(p) {
    var paso = Guias.normalizar([{ titulo: p.titulo, cuerpo: p.cuerpo || '' }])[0];
    paso.guion = GuiasGuion.normalizar((p.tareas || []).map(function (t) {
      return { texto: t.nombre, accion: t.accion || '', receta: t.receta || null };
    }));
    return paso;
  }

  function buscarPaso(pasos, nombre) {
    var r = null;
    recorrerPasos(pasos, function (p, lista, i) { if (!r && n(p.titulo) === n(nombre)) r = { paso: p, lista: lista, i: i }; });
    return r;
  }

  function lineaDe(paso, nombre) {
    var lineas = paso.guion || [];
    for (var i = 0; i < lineas.length; i++) if (!lineas[i].pregunta && n(lineas[i].texto) === n(nombre)) return i;
    return -1;
  }

  /* Devuelve los pasos nuevos de la guía y apunta en el informe lo hecho y lo que no se encuentra. */
  function aplicarGuia(pasos, op, inf) {
    var rotulo = '«' + op.tipo + '»: ';
    if (op.sustituir) {
      inf.guiasSustituidas.push(op.tipo);
      return op.sustituir.map(pasoSustituto);
    }
    (op.mover || []).forEach(function (m) {
      var de = buscarPaso(pasos, m.de), a = buscarPaso(pasos, m.a);
      var i = de ? lineaDe(de.paso, m.tarea) : -1;
      if (!de || !a || i === -1) { inf.noEncontrado.push(rotulo + 'no encuentro la tarea «' + m.tarea + '» en «' + m.de + '» (o el hito «' + m.a + '»), no la muevo.'); return; }
      var linea = de.paso.guion.splice(i, 1)[0];
      a.paso.guion = (a.paso.guion || []).concat([linea]);
      inf.tareasMovidas++;
    });
    (op.quitar || []).forEach(function (nombre) {
      var q = buscarPaso(pasos, nombre);
      if (!q) { inf.noEncontrado.push(rotulo + 'no encuentro el hito «' + nombre + '», no lo quito.'); return; }
      quitarDe(q.lista, q.i);
      inf.hitosQuitados++;
    });
    (op.conservar || []).forEach(function (nombre) {
      if (!buscarPaso(pasos, nombre)) inf.noEncontrado.push(rotulo + 'no encuentro el hito «' + nombre + '», que el plan deja.');
    });
    return pasos;
  }

  /* ---------- en todas las guías ---------- */

  function quitarArchivar(pasos, plan, inf) {
    var fuera = (plan.quitarHitos || []).map(n);
    recorrerPasos(pasos, function (p, lista, i) {
      if (fuera.indexOf(n(p.titulo)) !== -1 && !(p.opciones && p.opciones.length)) { p.__quitar = true; }
    });
    (function limpiar(lista) {
      for (var i = lista.length - 1; i >= 0; i--) {
        if (lista[i].__quitar) { quitarDe(lista, i); inf.hitosQuitados++; continue; }
        (lista[i].opciones || []).forEach(function (o) { limpiar(o.pasos || []); });
      }
    })(pasos);
  }

  function renombrarHitos(pasos, plan, inf) {
    recorrerPasos(pasos, function (p) {
      var m = buscarEn(plan.hitos || [], p.titulo);
      if (!m) return;
      if (n(p.titulo) !== n(m.destino.nombre)) inf.hitosRenombrados++;
      p.titulo = m.destino.nombre;
      var quien = typeof m.desde === 'object' ? m.desde.responsable : '';
      if (quien) p.responsable = quien;
    });
  }

  /* Una tarea que el plan renombra: nombre, acción y receta de la tarea del plan; la condición («si se remite») pasa a su explicación. */
  function poner(g, t, resto) {
    var antes = g.accion;
    g.texto = t.nombre;
    g.accion = t.accion || '';
    if (t.receta) g.receta = copia(t.receta);
    else if (!(g.accion === 'firmar' && antes === 'firmar')) delete g.receta;
    if (t.condicion && resto) g.explicacion = unirTexto(g.explicacion, resto.charAt(0).toUpperCase() + resto.slice(1) + '.');
  }

  function mismaTarea(a, b) {
    return n(a.texto) === n(b.texto) && (a.accion || '') === (b.accion || '') && igualJson(a.receta, b.receta);
  }

  function tareasDe(lineas, plan, inf) {
    var salida = [], fuera = (plan.quitarTareas || []).map(n);
    (lineas || []).forEach(function (g) {
      if (g.pregunta) {
        (g.opciones || []).forEach(function (o) { o.lineas = tareasDe(o.lineas, plan, inf); });
        salida.push(g);
        return;
      }
      if (fuera.indexOf(n(g.texto)) !== -1) { inf.tareasQuitadas++; return; }
      var m = buscarEn(plan.tareas || [], g.texto);
      if (!m) { salida.push(g); return; }
      if (n(g.texto) !== n(m.destino.nombre)) inf.tareasRenombradas++;
      poner(g, m.destino, m.resto);
      var previa = salida.filter(function (x) { return !x.pregunta && mismaTarea(x, g); })[0];
      if (previa) {
        previa.explicacion = unirTexto(previa.explicacion, g.explicacion);
        previa.explicacion = citaAlTexto(previa, g.normativa);
        inf.tareasUnidas++;
        return;
      }
      salida.push(g);
    });
    return salida;
  }

  /* En cada hito que el plan nombra, la tarea de enviar el documento (como comunicación). */
  function tareasEnHitos(pasos, plan, inf) {
    recorrerPasos(pasos, function (p) {
      (plan.tareaEnHito || []).forEach(function (x) {
        if (n(p.titulo) !== n(x.hito) || (p.opciones && p.opciones.length)) return;
        p.guion = p.guion || [];
        var i = lineaDe(p, x.nombre);
        if (i !== -1) {
          var g = p.guion[i];
          if (g.accion !== x.accion) { g.accion = x.accion; g.receta = GuiasGuion.normalizarReceta(x.accion, g.receta) || undefined; if (!g.receta) delete g.receta; inf.tareasAnadidas++; }
          return;
        }
        p.guion.push(GuiasGuion.normalizar([{ texto: x.nombre, accion: x.accion }])[0]);
        inf.tareasAnadidas++;
      });
    });
  }

  /* ---------- todo junto ---------- */

  function informeVacio() {
    return { hitosQuitados: 0, hitosRenombrados: 0, tareasQuitadas: 0, tareasRenombradas: 0, tareasUnidas: 0, tareasAnadidas: 0, tareasMovidas: 0,
             guiasSustituidas: [], guiasTocadas: [], noEncontrado: [], saltadas: [] };
  }

  /* `quien`: { activos: [tipos con guía que se tocan], inactivos: [tipos desactivados] }. Devuelve { guias, informe }; `guias` es una copia de todas. */
  function transformar(guias, plan, quien) {
    var nuevas = copia(guias || {}), inf = informeVacio();
    var activos = (quien && quien.activos) || Object.keys(nuevas), inactivos = (quien && quien.inactivos) || [];
    (plan.guias || []).forEach(function (op) {
      var nombres = [op.tipo].concat(op.otrosNombres || []).map(n);
      var elegido = activos.filter(function (t) { return nombres.indexOf(n(t)) !== -1 && nuevas[t]; })[0];
      if (elegido) { nuevas[elegido] = aplicarGuia(nuevas[elegido], op, inf); return; }
      var apagado = inactivos.filter(function (t) { return nombres.indexOf(n(t)) !== -1; })[0];
      if (apagado) inf.saltadas.push('«' + apagado + '»: está desactivado, no se toca.');
      else inf.noEncontrado.push('«' + op.tipo + '»: no encuentro ese tipo con guía.');
    });
    activos.forEach(function (tipo) {
      if (!nuevas[tipo]) return;
      quitarArchivar(nuevas[tipo], plan, inf);
      renombrarHitos(nuevas[tipo], plan, inf);
      recorrerPasos(nuevas[tipo], function (p) { if (!(p.opciones && p.opciones.length) && p.guion) p.guion = tareasDe(p.guion, plan, inf); });
      tareasEnHitos(nuevas[tipo], plan, inf);
    });
    activos.forEach(function (tipo) {
      if (nuevas[tipo] && !igualJson(nuevas[tipo], (guias || {})[tipo])) inf.guiasTocadas.push(tipo);
    });
    return { guias: nuevas, informe: inf };
  }

  return { transformar: transformar, informeVacio: informeVacio, norm: n, unirTexto: unirTexto, citaAlTexto: citaAlTexto, recorrerPasos: recorrerPasos };
})();
window.PlanGuias = PlanGuias;
