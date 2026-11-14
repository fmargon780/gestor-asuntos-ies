/* ============================================================
   repaso-donde.js — el repaso del «dónde» de las tareas que ya existen (fila 659,
   docs/659-DONDE-SE-HACE-Y-NOMBRES.md, tema 650 parte 3; el plan es docs/659-plan-donde.json y
   viaja como dato en datos-biblioteca/repaso-donde.json).

   Esta parte es solo cálculo (sin disco ni pantalla). `transformar(guias, listas, plan, contexto)`:
   - Busca cada tarea (la de la lista común y la línea de cada guía) en el plan por su texto
     normalizado y le pone su `donde` (si no lo tiene ya), su «Qué documento» (solo si ese tipo
     existe en la app) y, donde el plan lo dice con `antes`, su acción nueva («Archivar» y «Recoger»).
   - Una tarea que no está en el plan recibe el sitio que propone su acción y sale en la lista `sinPlan`.
   - Una tarea de Enviar con vía «mensaje de Séneca» va a «iPasen» aunque el plan diga otra cosa.
   - Quita de sus guías los hitos que el plan dice (los cuatro «Archivar» vacíos) si de verdad no tienen tareas.
   - Nada se inventa: lo que no se encuentra se dice en `noEncontrado` y no se toca.
   `contexto`: { sitios (el mapa de js/sitios.js), tiposDocumento: [textos] }.
   Guardar y la pantalla: js/repaso-donde-aplicar.js y js/repaso-donde-pantalla.js.
   ============================================================ */
var RepasoDonde = (function () {

  function n(t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function indiceDelPlan(plan) {
    var r = {};
    ((plan && plan.tareas) || []).forEach(function (t) { r[n(t.texto)] = t; });
    return r;
  }

  function tipoDeDocumento(contexto, texto) {
    return ((contexto && contexto.tiposDocumento) || []).filter(function (t) { return n(t) === n(texto); })[0] || '';
  }

  /* Repasa una tarea (lista común: `nombre`; línea de guía: `texto`). Devuelve true si la ha cambiado. */
  function repasarTarea(g, ctx, inf) {
    var texto = g.texto != null ? g.texto : g.nombre, clave = n(texto), antes = JSON.stringify(g), e = ctx.plan[clave];
    var sitios = ctx.contexto.sitios;
    if (e) {
      ctx.vistos[clave] = true;
      if (e.antes !== undefined && (g.accion || '') === (e.antes || '') && (e.accion || '') !== (g.accion || '')) {
        if (!inf.acciones[clave]) inf.acciones[clave] = { texto: texto, antes: Comunes.textoDeHace(g.accion || ''), ahora: Comunes.textoDeHace(e.accion || '') };
        g.accion = e.accion || '';
        var receta = window.GuiasGuion ? GuiasGuion.normalizarReceta(g.accion, g.receta) : null;
        if (receta) g.receta = receta; else delete g.receta;
      }
      if (!g.donde) {
        var d = e.donde ? Sitios.deTexto(sitios, e.donde) : null;
        if (e.donde && !d) inf.noEncontrado.push('El sitio «' + e.donde + '» (tarea «' + texto + '») ya no está en el mapa de sitios: la dejo sin sitio.');
        if (g.accion === 'comunicar' && g.receta && g.receta.via === 'seneca') d = { sitio: Sitios.ID_IPASEN };
        if (d) g.donde = d;
      }
      if (e.documento && Sitios.usaDocumento(g.accion || '') && !g.tipoDocumento) {
        var t = tipoDeDocumento(ctx.contexto, e.documento);
        if (t) { g.tipoDocumento = t; inf.documentos[clave] = { texto: texto, tipo: t }; }
        else inf.noEncontrado.push('El tipo de documento «' + e.documento + '» no existe en la app (tarea «' + texto + '»): la dejo sin «Qué documento».');
      }
    } else if (!g.donde) {
      var p = (g.accion === 'comunicar' && g.receta && g.receta.via === 'seneca') ? { sitio: Sitios.ID_IPASEN } : Sitios.propuesto(sitios, g.accion || '');
      if (p) g.donde = p;
      inf.sinPlan[clave] = texto;
    }
    return JSON.stringify(g) !== antes;
  }

  /* De las guías y las listas de hoy, las guías y las listas repasadas, y un informe. Nada se escribe. */
  function transformar(guias, listas, plan, contexto) {
    var ctx = { plan: indiceDelPlan(plan), vistos: {}, contexto: contexto || { sitios: Sitios.datos(), tiposDocumento: [] } };
    var inf = { acciones: {}, documentos: {}, sinPlan: {}, noEncontrado: [], hitosQuitados: [], hitosNoQuitados: [], guiasTocadas: [], lineas: 0, tareasComunes: 0 };
    var nuevasGuias = copia(guias || {});
    var nuevasTareas = copia((listas && listas.tareas) || []);
    nuevasTareas.forEach(function (t) { if (repasarTarea(t, ctx, inf)) inf.tareasComunes++; });
    var tocadas = {};
    /* Los hitos que el plan quita: solo si de verdad no tienen ninguna tarea. */
    ((plan && plan.hitosQueSeQuitan) || []).forEach(function (q) {
      var tipo = Object.keys(nuevasGuias).filter(function (t) { return n(t) === n(q.guia); })[0];
      if (!tipo) { inf.noEncontrado.push('No encuentro la guía «' + q.guia + '»: no le quito el hito «' + q.titulo + '».'); return; }
      var pasos = nuevasGuias[tipo], i = -1;
      pasos.forEach(function (p, k) { if (i === -1 && n(p.titulo) === n(q.titulo)) i = k; });
      if (i === -1) { inf.noEncontrado.push('La guía «' + tipo + '» ya no tiene el hito «' + q.titulo + '».'); return; }
      if ((pasos[i].guion || []).length || (pasos[i].opciones || []).length) { inf.hitosNoQuitados.push('«' + tipo + '»: el hito «' + q.titulo + '» tiene tareas, lo dejo.'); return; }
      pasos.splice(i, 1);
      tocadas[tipo] = true;
      inf.hitosQuitados.push({ guia: tipo, titulo: q.titulo });
    });
    /* Cada línea de cada guía. */
    Comunes.recorrerGuias(nuevasGuias, null, function (g, lista, i, tipo) {
      if (g.pregunta) return;
      if (repasarTarea(g, ctx, inf)) { tocadas[tipo] = true; inf.lineas++; }
    });
    /* Lo del plan que no está en ninguna parte. */
    Object.keys(ctx.plan).forEach(function (k) {
      if (!ctx.vistos[k]) inf.noEncontrado.push('La tarea «' + ctx.plan[k].texto + '» del plan no está en ninguna guía ni en la lista común.');
    });
    inf.guiasTocadas = Object.keys(tocadas);
    return { guias: nuevasGuias, tareas: nuevasTareas, informe: inf };
  }

  return { transformar: transformar, repasarTarea: repasarTarea };
})();
window.RepasoDonde = RepasoDonde;
