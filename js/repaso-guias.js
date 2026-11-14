/* ============================================================
   repaso-guias.js — el repaso de la lista común de hitos y tareas (fila 657,
   docs/657-REPASO-LISTA-COMUN.md, tema 650 parte 2; el plan es
   docs/657-PLAN-REPASO.md y viaja como dato en datos-biblioteca/repaso-guias.json).

   Esta parte es solo cálculo (sin disco ni pantalla):
   - `transformar(guias, plan, quien, tareasViejas)`: de las guías de hoy y del plan
     saca las guías repasadas (hitos juntos y renombrados, cada tarea con su acción)
     y un informe. Se busca por `id` y, si el `id` no está, por nombre exacto; lo que
     no se encuentra se salta y se dice; nada se inventa.
   - `listas(guiasNuevas, tipos, viejas)`: las dos listas comunes rehechas desde las
     guías repasadas (cada hito común con su fase), conservando el `id` común de hoy.
   Guardar y la pantalla: js/repaso-guias-aplicar.js y js/repaso-guias-pantalla.js.
   ============================================================ */
var RepasoGuias = (function () {

  function n(t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function sinEtiquetas(h) { return n(String(h || '').replace(/<[^>]*>/g, ' ')); }
  function pl(x, uno, varios) { return x + ' ' + (x === 1 ? uno : varios); }

  /* Las once fases de un hito común (fila 657): lo que hace quien usa la app. */
  var FASES = Comunes.FASES;

  /* ---------- una tarea ---------- */

  /* La línea nueva de una tarea que el plan crea: si ya hay una tarea común con ese nombre y esa acción, con su receta y su explicación. */
  function lineaNueva(t, viejas) {
    var comun = (viejas || []).filter(function (c) { return n(c.nombre) === n(t.texto) && (c.accion || '') === (t.accion || ''); })[0];
    var base = { texto: t.texto, accion: t.accion || '' };
    if (comun) {
      base.explicacion = comun.explicacion || '';
      if (comun.receta) base.receta = copia(comun.receta);
      if (comun.normativa) base.normativa = copia(comun.normativa);
      if (comun.reunir) { base.reunir = comun.reunir; base.obligatorio = !!comun.obligatorio; }
    } else if (base.accion === 'registrar') {
      base.receta = { sentido: /salida/.test(n(t.texto)) ? 'salida' : 'entrada' };
    }
    var g = GuiasGuion.normalizar([base])[0];
    if (comun) g.__v = comun.id;
    return g;
  }

  /* Un registrar sin sentido (hoy, con una línea que antes no registraba): el de la tarea común del mismo nombre o, si no hay, el que dice su texto. */
  function sentidoDe(g, viejas) {
    if (g.accion !== 'registrar' || (g.receta && g.receta.sentido)) return;
    var comun = (viejas || []).filter(function (c) { return n(c.nombre) === n(g.texto) && c.accion === 'registrar' && c.receta && c.receta.sentido; })[0];
    var sentido = comun ? comun.receta.sentido : (/salida/.test(n(g.texto)) ? 'salida' : (/entrada/.test(n(g.texto)) ? 'entrada' : ''));
    if (sentido) g.receta = { sentido: sentido };
  }

  /* La línea de hoy con el nombre y la acción del plan. */
  function lineaRepasada(vieja, t, viejas) {
    var g = copia(vieja);
    g.__v = vieja.comun || '';
    g.texto = t.texto;
    if (t.accion != null && (g.accion || '') !== t.accion) {
      g.accion = t.accion;
      var receta = GuiasGuion.normalizarReceta(g.accion, g.receta);
      if (receta) g.receta = receta; else delete g.receta;
    }
    sentidoDe(g, viejas);
    return g;
  }

  function lineasDe(paso) { return (paso && paso.guion) || []; }

  /* ---------- un hito ---------- */

  function unirLista(a, b) {
    var r = copia(a || []), vistos = r.map(function (x) { return JSON.stringify(x); });
    (b || []).forEach(function (x) {
      var k = JSON.stringify(x);
      if (vistos.indexOf(k) === -1) { vistos.push(k); r.push(copia(x)); }
    });
    return r;
  }
  function unirCuerpos(pasos) {
    var vistos = [], cuerpo = '';
    pasos.forEach(function (p) {
      var s = sinEtiquetas(p.cuerpo);
      if (!s || vistos.indexOf(s) !== -1) return;
      vistos.push(s);
      cuerpo += p.cuerpo;
    });
    return cuerpo;
  }

  /* Los hitos de hoy que juntan en uno: toca, tocaA, estadoAsunto, soloSi y responsable del primero; plazo del último;
     plantillas, formularios, normativa y requisitos unidos sin repetir; el cuerpo, uno debajo de otro. */
  function unirPasos(pasos) {
    var base = copia(pasos[0]);
    if (pasos.length > 1) {
      base.plazo = copia(pasos[pasos.length - 1].plazo === undefined ? null : pasos[pasos.length - 1].plazo);
      ['plantillasDocumento', 'formularios', 'normativa', 'requisitos'].forEach(function (k) {
        var r = [];
        pasos.forEach(function (p) { r = unirLista(r, p[k]); });
        base[k] = r;
      });
      base.cuerpo = unirCuerpos(pasos);
    }
    return base;
  }

  /* Dónde está el hito de hoy: por `id` y, si no, por nombre (el que no esté ya cogido). */
  function buscarPaso(viejos, cogidos, id, nombre) {
    var r = viejos.filter(function (p) { return p.id === id; })[0] || null;
    if (!r && nombre) r = viejos.filter(function (p) { return cogidos.indexOf(p.id) === -1 && n(p.titulo) === n(nombre); })[0] || null;
    return r;
  }
  /* La línea de hoy de una tarea del plan. Los `id` de línea se repiten entre hitos (g1, g2…): se casa el `id` y, entre los que valen, el texto;
     las que ya se han cogido (se comparan las propias líneas, no los `id`) no valen. */
  function buscarLinea(pasos, usadas, id, texto) {
    var todas = [];
    pasos.forEach(function (p) { lineasDe(p).forEach(function (g) { if (usadas.indexOf(g) === -1) todas.push(g); }); });
    var porId = todas.filter(function (g) { return g.id === id; });
    var r = porId.filter(function (g) { return n(g.texto) === n(texto); })[0] || porId[0] || null;
    if (!r && texto) r = todas.filter(function (g) { return !g.pregunta && n(g.texto) === n(texto); })[0] || null;
    return r;
  }

  /* ---------- una guía ---------- */

  function guiaRepasada(viejos, plan, quitar, tipo, tareasViejas, inf) {
    var rotulo = '«' + tipo + '»: ';
    var salida = [], cogidos = [], tg = { juntan: [], renombran: [], quitan: [], tareasNuevas: [], tareasRenombradas: [], tareasQuitadas: [], sobran: [] };
    var quitarPasos = ((quitar && quitar.pasos) || []).map(function (x) { return x.id; });
    var quitarLineas = (quitar && quitar.lineas) || [];

    plan.forEach(function (h) {
      var encontrados = [];
      (h.de || []).forEach(function (id, i) {
        var p = buscarPaso(viejos, cogidos, id, (h.deNombres || [])[i] || h.antes || h.titulo);
        if (p) { encontrados.push(p); cogidos.push(p.id); }
        else inf.noEncontrado.push(rotulo + 'no encuentro el hito «' + ((h.deNombres || [])[i] || h.antes || h.titulo) + '», no lo toco.');
      });
      if (!encontrados.length) return;
      var nuevo = unirPasos(encontrados);
      nuevo.__v = encontrados.map(function (p) { return p.comun || ''; }).filter(Boolean);
      nuevo.__fase = h.fase;
      if (encontrados.length > 1) tg.juntan.push({ nuevo: h.titulo, de: encontrados.map(function (p) { return p.titulo; }) });
      else if (n(encontrados[0].titulo) !== n(h.titulo)) tg.renombran.push({ antes: encontrados[0].titulo, ahora: h.titulo });
      nuevo.titulo = h.titulo;

      var lineas = [], usadas = [];
      (h.tareas || []).forEach(function (t) {
        if (t.de == null) {
          if (t.accion == null && !t.texto) return;
          lineas.push(lineaNueva(t, tareasViejas));
          tg.tareasNuevas.push(t.texto);
          return;
        }
        var vieja = buscarLinea(encontrados, usadas, t.de, t.deTexto);
        if (!vieja) { inf.noEncontrado.push(rotulo + 'no encuentro la tarea «' + (t.deTexto || t.texto) + '» en «' + h.titulo + '», no la toco.'); return; }
        usadas.push(vieja);
        if (t.tipo === 'pregunta' || t.tipo === 'reunir') { var igual = copia(vieja); igual.__v = vieja.comun || ''; lineas.push(igual); return; }
        if (n(vieja.texto) !== n(t.texto)) tg.tareasRenombradas.push({ antes: vieja.texto, ahora: t.texto });
        lineas.push(lineaRepasada(vieja, t, tareasViejas));
      });
      /* Líneas de hoy que el plan no nombra: se quitan solo las que el plan dice; las demás (la guía cambió después) se quedan. */
      encontrados.forEach(function (p) {
        lineasDe(p).forEach(function (g, i) {
          if (usadas.indexOf(g) !== -1) return;
          if (quitarLineas.some(function (q) { return q.id === g.id && n(q.texto) === n(g.texto); })) { tg.tareasQuitadas.push(g.texto); return; }
          var copiaLinea = copia(g); copiaLinea.__v = g.comun || '';
          var previa = -1;
          for (var j = i - 1; j >= 0; j--) { var k = lineas.map(function (x) { return x.id; }).indexOf(lineasDe(p)[j].id); if (k !== -1) { previa = k; break; } }
          lineas.splice(previa + 1, 0, copiaLinea);
          tg.sobran.push(g.texto);
          inf.noEncontrado.push(rotulo + 'la tarea «' + g.texto + '» no está en el plan; se queda en «' + h.titulo + '».');
        });
      });
      nuevo.guion = lineas;
      salida.push({ paso: nuevo, de: encontrados.map(function (p) { return p.id; }) });
    });

    /* Hitos de hoy que el plan no nombra: se quitan solo los que dice el plan; los demás se quedan donde estaban. */
    var resultado = salida.map(function (s) { return s.paso; });
    viejos.forEach(function (p, i) {
      if (cogidos.indexOf(p.id) !== -1) return;
      if (quitarPasos.indexOf(p.id) !== -1) { tg.quitan.push(p.titulo); return; }
      var copiaPaso = copia(p);
      copiaPaso.__v = p.comun ? [p.comun] : [];
      var pos = 0;
      for (var j = i - 1; j >= 0; j--) {
        var k = salida.map(function (s) { return s.de.indexOf(viejos[j].id) !== -1; }).indexOf(true);
        if (k !== -1) { pos = resultado.indexOf(salida[k].paso) + 1; break; }
      }
      resultado.splice(pos, 0, copiaPaso);
      inf.noEncontrado.push(rotulo + 'el hito «' + p.titulo + '» no está en el plan; se queda.');
    });
    return { pasos: resultado, informe: tg };
  }

  function informeVacio() {
    return { guias: [], noEncontrado: [], saltadas: [], guiasTocadas: [], hitosJuntados: 0, hitosRenombrados: 0, hitosQuitados: 0,
             tareasNuevas: 0, tareasRenombradas: 0, tareasQuitadas: 0 };
  }

  /* `quien`: { activos, inactivos }. Devuelve { guias, informe }; `guias` es una copia de todas, con marcas `__v` y `__fase` que
     `listas` consume y quita. */
  function transformar(guias, plan, quien, tareasViejas) {
    var nuevas = copia(guias || {}), inf = informeVacio();
    var activos = (quien && quien.activos) || Object.keys(nuevas), inactivos = (quien && quien.inactivos) || [];
    var tipos = plan.tipos || {}, quitar = plan.quitar || {};
    Object.keys(tipos).forEach(function (tipo) {
      var elegido = activos.filter(function (t) { return n(t) === n(tipo) && nuevas[t]; })[0];
      if (elegido) {
        var r = guiaRepasada(nuevas[elegido], tipos[tipo], quitar[tipo], tipo, tareasViejas, inf);
        nuevas[elegido] = r.pasos;
        var tg = r.informe; tg.tipo = elegido;
        if (tg.juntan.length || tg.renombran.length || tg.quitan.length || tg.tareasQuitadas.length || tg.tareasRenombradas.length || tg.tareasNuevas.length) inf.guias.push(tg);
        inf.hitosJuntados += tg.juntan.length; inf.hitosRenombrados += tg.renombran.length; inf.hitosQuitados += tg.quitan.length;
        inf.tareasNuevas += tg.tareasNuevas.length; inf.tareasRenombradas += tg.tareasRenombradas.length; inf.tareasQuitadas += tg.tareasQuitadas.length;
        return;
      }
      var apagado = inactivos.filter(function (t) { return n(t) === n(tipo); })[0];
      if (apagado) inf.saltadas.push('«' + apagado + '»: está desactivado, no se toca.');
      else inf.noEncontrado.push('«' + tipo + '»: no encuentro ese tipo con guía.');
    });
    inf.guiasTocadas = Object.keys(tipos).filter(function (t) { return nuevas[t] && activos.indexOf(t) !== -1; });
    return { guias: nuevas, informe: inf };
  }

  /* ---------- las listas comunes ---------- */

  function quitarMarcas(guias) {
    Comunes.recorrerGuias(guias, function (p) { delete p.__v; delete p.__fase; }, function (g) { delete g.__v; });
  }

  /* Cuántas guías usan cada marca común de hoy: para quedarse con la más usada al unir. */
  function usosDe(guias) {
    var u = Comunes.usos(guias), r = {};
    Object.keys(u.tareas).forEach(function (id) { r[id] = u.tareas[id].length; });
    Object.keys(u.hitos).forEach(function (id) { r[id] = u.hitos[id].length; });
    return r;
  }

  /* `guiasNuevas`: lo que devuelve `transformar`. `tipos`: los repasados. `viejas`: { tareas, hitos } de hoy; `guiasViejas`: las guías de hoy.
     Devuelve { guias, listas: { tareas, hitos }, informe }. */
  function listas(guiasNuevas, tipos, viejas, guiasViejas) {
    var nuevas = copia(guiasNuevas), usos = usosDe(guiasViejas || {});
    var sub = {};
    tipos.forEach(function (t) { if (nuevas[t]) sub[t] = nuevas[t]; });

    /* Las marcas comunes de hoy ya no valen: `__v` guarda de cuáles venían. */
    Comunes.recorrerGuias(sub, function (p) { delete p.comun; }, function (g) { delete g.comun; });

    /* El hito común guarda todas las explicaciones, pero cada guía conserva la suya: el repaso no mezcla textos de unas guías en otras. */
    var cuerpos = [];
    Comunes.recorrerGuias(sub, function (p) { cuerpos.push(p.cuerpo); }, null);
    var r = PlanGuiasListas.construir(sub, tipos, { tareas: [], hitos: [] });
    var tareas = r.listas.tareas, hitos = r.listas.hitos, rehechas = r.guias;

    /* Con las guías rehechas por construir, vuelvo a recorrer en el mismo orden para casar cada línea y cada hito con lo que traía. */
    var lineasR = [], pasosR = [];
    Comunes.recorrerGuias(rehechas, null, function (g) { if (!g.pregunta) lineasR.push(g); });
    Comunes.recorrerGuias(rehechas, function (p) { pasosR.push(p); }, null);
    pasosR.forEach(function (p, i) { p.cuerpo = cuerpos[i]; });

    var candT = {}, candH = {}, fases = {};
    lineasR.forEach(function (g) {
      if (!g.comun) return;
      (candT[g.comun] = candT[g.comun] || []).push(g.__v || '');
    });
    pasosR.forEach(function (p) {
      if (!p.comun) return;
      (candH[p.comun] = candH[p.comun] || []).push.apply(candH[p.comun], p.__v || []);
      if (p.__fase && !fases[p.comun]) fases[p.comun] = p.__fase;
    });

    var cambiosT = {}, tomadosT = {};
    tareas.forEach(function (t) {
      var cs = (candT[t.id] || []).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).sort(function (a, b) { return (usos[b] || 0) - (usos[a] || 0); });
      var e = cs.filter(function (c) { return !tomadosT[c]; })[0];
      if (e) { tomadosT[e] = true; cambiosT[t.id] = e; }
    });
    var cambiosH = {}, tomadosH = {};
    hitos.forEach(function (h) {
      var cs = (candH[h.id] || []).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).sort(function (a, b) { return (usos[b] || 0) - (usos[a] || 0); });
      var e = cs.filter(function (c) { return !tomadosH[c]; })[0];
      if (e) { tomadosH[e] = true; cambiosH[h.id] = e; }
    });
    tareas.forEach(function (t) { if (cambiosT[t.id]) t.id = cambiosT[t.id]; });
    hitos.forEach(function (h) {
      h.tareas = h.tareas.map(function (id) { return cambiosT[id] || id; });
      var fase = fases[h.id];
      if (cambiosH[h.id]) h.id = cambiosH[h.id];
      if (fase) h.fase = fase;
    });
    pasosR.forEach(function (p) { if (p.comun) p.comun = cambiosH[p.comun] || p.comun; });
    lineasR.forEach(function (g) { if (g.comun) g.comun = cambiosT[g.comun] || g.comun; });

    var todas = copia(nuevas);
    Object.keys(rehechas).forEach(function (t) { todas[t] = rehechas[t]; });
    quitarMarcas(todas);
    var hitosFinal = hitos.map(function (h) { return Comunes.normalizarHito(h); });
    return { guias: todas, listas: { tareas: tareas, hitos: hitosFinal }, informe: r.informe };
  }

  return { FASES: FASES, transformar: transformar, listas: listas, norm: n, pl: pl };
})();
window.RepasoGuias = RepasoGuias;
