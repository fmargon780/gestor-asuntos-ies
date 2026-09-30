/* ============================================================
   donde-se-guarda-tareas.js — crear, cambiar, borrar y pasar una tarea
   del hito, preguntando antes «¿Dónde se guarda?» (30-sep-2026, fila
   235, docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md, puntos 3 y 4).

   Lo llaman la caja «Nueva tarea…» (js/hito-mesa-guion.js) y el «⋮» de
   cada tarea (js/hito-mesa-tarea-menu.js). Cada función abre el
   emergente pequeño de js/donde-se-guarda.js y, según la respuesta:

   - «Solo en este asunto»: lo de siempre (js/hitos-guion.js).
   - «A la guía»: la tarea vive en el paso de la guía (`guion`), así que
     llega sola a todos los asuntos abiertos del tipo. Si el hito no está
     en la guía (un hito propio del asunto), se lleva entero con todas
     sus tareas (HitosDesdeElAsuntoGuia.llevarHitoEntero). El aviso verde
     lleva «Deshacer».

   Las tres (nueva, cambiar, borrar) devuelven una promesa de true si se
   ha guardado (en la guía o aquí) y de false si se ha cancelado con
   Escape o ha fallado, para que quien llama decida si deja lo escrito.
   Con el asunto sin tipo no se pregunta: se guarda solo en el asunto.
   ============================================================ */
window.DondeSeGuardaTareas = (function () {

  var SOLO_AQUI = 'Guardado solo en este asunto.';
  var MOTIVO = 'Este hito está dentro de una pregunta: en la guía se cambia desde Ajustes.';

  function repintar() { if (window.HitosPanel) HitosPanel.programarRepintado(); }

  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  /* La línea `id` de un guion (a cualquier nivel: las de una respuesta
     están en `opciones[].lineas`): { lista, i } o null. */
  function lineaEn(guion, id) {
    for (var i = 0; i < (guion || []).length; i++) {
      var g = guion[i];
      if (g.id === id) return { lista: guion, i: i };
      if (g.pregunta) {
        for (var j = 0; j < (g.opciones || []).length; j++) {
          var enc = lineaEn(g.opciones[j].lineas, id);
          if (enc) return enc;
        }
      }
    }
    return null;
  }

  /* Dónde está el hito: en la guía (paso sin preguntas), propio del
     asunto (se puede llevar entero) o en un sitio donde no se puede. */
  async function contexto(a, h) {
    var tipo = DondeSeGuarda.tipoDe(a);
    var ctx = { tipo: tipo, tipoCorto: tipo ? DondeSeGuarda.nombreCortoDe(tipo) : '', enGuia: false, propio: false, apagada: '' };
    if (!tipo) return ctx;
    var paso = Hitos.pasoDeGuia ? Hitos.pasoDeGuia(a, h) : null;
    if (paso && !(paso.opciones && paso.opciones.length)) { ctx.enGuia = true; return ctx; }
    if (!paso && h.clase !== 'decision') {
      var nivel = HitosDesdeElAsunto.nivelSuperior(await Hitos.hitosDe(a.nombre));
      if (nivel.some(function (x) { return x.id === h.id; })) {
        ctx.propio = true;
        ctx.tareas = (h.guionPropio || []).filter(function (g) { return !g.enLugarDe; }).length;
        return ctx;
      }
    }
    ctx.apagada = MOTIVO;
    return ctx;
  }

  /* Abre el emergente. Devuelve 'guia', 'aqui' o null (cancelado). Sin
     tipo, 'aqui' sin preguntar nada. `extra`: { conTrabajo, nota, tareasMas }. */
  async function preguntar(a, h, ctx, texto, extra) {
    if (!ctx.tipo) return 'aqui';
    extra = extra || {};
    return DondeSeGuarda.preguntar({
      titulo: '¿Dónde se guarda?',
      cuerpoHtml: '<p class="dsg-tarea">' + U.escapar(texto) + '</p>' + (extra.nota ? '<p class="nota">' + U.escapar(extra.nota) + '</p>' : ''),
      aceptar: 'Guardar',
      tipoCorto: ctx.tipoCorto,
      otros: DondeSeGuarda.otrosAbiertos(a).length,
      conTrabajo: extra.conTrabajo || 0,
      hitoNuevo: ctx.propio ? { titulo: h.titulo, tareas: ctx.tareas + (extra.tareasMas || 0) } : null,
      apagada: ctx.apagada
    });
  }

  /* Edita una copia de los pasos del tipo con `enPaso(paso)`, que puede
     devolver false para no guardar nada. */
  function tocarPaso(a, h, ctx, enPaso) {
    return GuiasDelCentro.cambiarPasos(ctx.tipo, function (pasos) {
      var p = HitoMesaGuion.buscarPasoDeGuia(pasos, h.origenGuia);
      if (!p || (p.opciones && p.opciones.length)) return false;
      return enPaso(p) === false ? false : true;
    });
  }

  /* Edita este asunto: una sola escritura de hitos.json sobre el hito `h`. */
  function editarAqui(a, h, mutador) {
    return Hitos.cambiar(function (d) {
      var e = d.porAsunto[a.nombre];
      var x = e && Hitos.buscar(e.hitos, h.id);
      if (x) mutador(x);
      return d;
    });
  }

  /* El camino común de «A la guía». `o`:
       antesDeTocar()   lo que se arregla en otros asuntos antes de tocar la guía
       enPaso(paso)     lo que se toca en el paso de la guía (hito en la guía)
       despues()        lo que se arregla en este asunto tras tocar la guía
       antesLlevar()    (hito propio) lo que se cambia aquí antes de llevarlo entero
       deshacerAqui()   lo que «Deshacer» deja hecho en este asunto
       saltados         asuntos en los que no se tocará
     Devuelve true si se ha guardado. */
  async function aLaGuia(a, h, ctx, o) {
    var G = HitosDesdeElAsuntoGuia;
    var antes = await G.instantanea(ctx.tipo, a.nombre);
    var reg = { tipo: ctx.tipo, claveActual: a.nombre, antes: antes, aqui: o.deshacerAqui };
    if (o.antesDeTocar) await o.antesDeTocar();
    if (ctx.enGuia) {
      var hecho = await tocarPaso(a, h, ctx, o.enPaso);
      if (!hecho) { U.aviso('Ese hito ya no está en la guía del tipo.', 'ambar'); return false; }
      if (o.despues) {
        try { await o.despues(); } catch (err) { U.accesorio('Guardado en la guía, pero no he podido dejarlo así en este asunto', err); }
      }
    } else {
      if (o.antesLlevar) await o.antesLlevar();
      var r = await G.llevarHitoEntero(a, h);
      reg.aqui = function () { return G.dejarComoEstaba(a.nombre, r.hitoAntes); };
    }
    await G.avisarConDeshacer(
      G.textoGuardado(ctx.tipoCorto, DondeSeGuarda.otrosAbiertos(a).length, o.saltados || 0), reg);
    repintar();
    return true;
  }

  /* Una tarea «solo aquí» que «Deshacer» devuelve a este asunto, con su
     marca de hecha si la tenía. */
  async function devolverAqui(a, h, g, texto) {
    var nuevo = await Hitos.anadirGuionPropio(a.nombre, h.id, texto);
    var propia = nuevo && (nuevo.guionPropio || []).slice(-1)[0];
    if (propia && (g.hecho || g.noaplica)) {
      await Hitos.marcarGuion(a.nombre, h.id, propia.id, g.noaplica ? { noaplica: true } : { hecho: true });
    }
  }

  function lineaParaLaGuia(g, texto) {
    var nueva = { texto: texto, explicacion: g.explicacion || '', accion: g.accion || '', normativa: g.normativa || null };
    if (g.reunir) { nueva.reunir = g.reunir; nueva.obligatorio = !!g.obligatorio; }
    if (g.receta) nueva.receta = g.receta;
    return nueva;
  }

  /* ---------- Nueva tarea ---------- */

  /* `alElegir()` se llama en cuanto hay una respuesta que guarda (para
     vaciar la caja antes del repintado). */
  async function nueva(a, h, texto, alElegir) {
    texto = String(texto || '').trim();
    if (!texto) return false;
    try {
      var ctx = await contexto(a, h);
      var donde = await preguntar(a, h, ctx, texto, { tareasMas: 1 });
      if (!donde) return false;
      if (alElegir) alElegir();
      if (donde === 'aqui' || ctx.apagada) {
        await Hitos.anadirGuionPropio(a.nombre, h.id, texto);
        if (ctx.tipo) U.aviso(SOLO_AQUI, 'bueno');
        repintar();
        return true;
      }
      return await aLaGuia(a, h, ctx, {
        enPaso: function (p) { p.guion = GuiasGuion.normalizar((p.guion || []).concat([{ texto: texto }])); },
        antesLlevar: function () { return Hitos.anadirGuionPropio(a.nombre, h.id, texto); },
        deshacerAqui: function () { return Hitos.anadirGuionPropio(a.nombre, h.id, texto); }
      });
    } catch (err) {
      U.fallo('No he podido guardar la tarea', err);
      return false;
    }
  }

  /* ---------- Cambiar (y «Pasar a la guía», que es cambiar sin cambiar el texto) ---------- */

  async function cambiar(a, h, g, texto) {
    texto = String(texto || '').trim();
    if (!texto) return false;
    try {
      var ctx = await contexto(a, h);
      var donde = await preguntar(a, h, ctx, texto);
      if (!donde) return false;
      if (donde === 'aqui' || ctx.apagada) {
        if (g.propio) { if (texto !== g.texto) await Hitos.cambiarGuionPropioTexto(a.nombre, h.id, g.id, texto); }
        else await Hitos.cambiarGuionAqui(a.nombre, h.id, g, texto);
        if (ctx.tipo) U.aviso(SOLO_AQUI, 'bueno');
        repintar();
        return true;
      }
      var propiaRaw = g.propio ? (h.guionPropio || []).filter(function (x) { return x.id === g.id; })[0] : null;
      var idOriginal = propiaRaw && propiaRaw.enLugarDe;
      var nuevoId = null;

      if (!g.propio) {
        /* De la guía: cambia su texto en la guía; en este asunto ya se ve. */
        return await aLaGuia(a, h, ctx, {
          enPaso: function (p) {
            var l = lineaEn(p.guion, g.id);
            if (!l) return false;
            l.lista[l.i].texto = texto;
          },
          deshacerAqui: function () { return Hitos.cambiarGuionAqui(a.nombre, h.id, g, texto); }
        });
      }
      if (idOriginal) {
        /* Una sustituta de «Cambiar aquí»: el texto nuevo pasa a la línea
           de la guía que sustituía, y aquí vuelve a verse la de la guía. */
        return await aLaGuia(a, h, ctx, {
          enPaso: function (p) {
            var l = lineaEn(p.guion, idOriginal);
            if (!l) return false;
            l.lista[l.i].texto = texto;
          },
          despues: function () {
            return editarAqui(a, h, function (x) {
              var estado = (x.guionHecho && x.guionHecho[g.id]) || null;
              x.guionPropio = (x.guionPropio || []).filter(function (p) { return p.id !== g.id; });
              x.guionOcultos = (x.guionOcultos || []).filter(function (id) { return id !== idOriginal; });
              if (x.guionHecho) delete x.guionHecho[g.id];
              if (estado) { x.guionHecho = x.guionHecho || {}; x.guionHecho[idOriginal] = estado; }
            });
          },
          deshacerAqui: function () {
            return Hitos.cambiarGuionAqui(a.nombre, h.id, Object.assign({}, g, { id: idOriginal }), texto);
          }
        });
      }
      /* «Solo aquí» de verdad: entra en la guía al final de las tareas del hito. */
      return await aLaGuia(a, h, ctx, {
        enPaso: function (p) {
          p.guion = GuiasGuion.normalizar((p.guion || []).concat([lineaParaLaGuia(g, texto)]));
          nuevoId = p.guion[p.guion.length - 1].id;
        },
        despues: function () { return Hitos.pasarGuionPropioAGuia(a.nombre, h.id, g.id, nuevoId); },
        antesLlevar: function () { return texto !== g.texto ? Hitos.cambiarGuionPropioTexto(a.nombre, h.id, g.id, texto) : null; },
        deshacerAqui: function () { return devolverAqui(a, h, g, texto); }
      });
    } catch (err) {
      U.fallo('No he podido guardar el cambio', err);
      return false;
    }
  }

  /* «Pasar a la guía» del «⋮» de una tarea «solo aquí»: el mismo
     emergente, con «A la guía» marcada. */
  function pasar(a, h, g) { return cambiar(a, h, g, g.texto); }

  /* ---------- Borrar ---------- */

  /* De los otros asuntos abiertos del tipo, en cuántos está hecha (o con
     «No aplica») la tarea `idTarea` del hito de origen `idOrigen`. */
  async function hechasEnOtros(a, tipo, idOrigen, idTarea) {
    var datos = await Hitos.leer();
    var n = 0;
    DondeSeGuarda.otrosAbiertos(a).forEach(function (c) {
      var e = datos.porAsunto[c];
      var x = e && (e.hitos || []).filter(function (y) { return y.origenGuia === idOrigen && !y.delTipoAnterior; })[0];
      var st = x && x.guionHecho && x.guionHecho[idTarea];
      if (st && (st.hecho || st.noaplica)) n++;
    });
    return n;
  }

  /* Pasa a «solo aquí» la tarea `g` en los otros asuntos donde ya está
     hecha, para que, al quitarla de la guía, no pierdan lo marcado. */
  async function conservarHechas(a, h, g) {
    await Hitos.cambiar(function (d) {
      DondeSeGuarda.otrosAbiertos(a).forEach(function (c) {
        var e = d.porAsunto[c];
        var x = e && (e.hitos || []).filter(function (y) { return y.origenGuia === h.origenGuia && !y.delTipoAnterior; })[0];
        var st = x && x.guionHecho && x.guionHecho[g.id];
        if (!st || !(st.hecho || st.noaplica)) return;
        x.guionPropio = (x.guionPropio || []).concat([{
          id: g.id, texto: g.texto, explicacion: g.explicacion || '', accion: g.accion || '',
          normativa: g.normativa || null, reunir: g.reunir || '', obligatorio: !!g.obligatorio, receta: g.receta || null
        }]);
      });
      return d;
    });
  }

  async function borrar(a, h, g) {
    try {
      var ctx = await contexto(a, h);
      /* «Solo aquí»: nada que preguntar, se borra como siempre. */
      if (g.propio || !ctx.tipo) {
        await Hitos[g.propio ? 'borrarGuionPropio' : 'ocultarGuionDeGuia'](a.nombre, h.id, g.id);
        repintar();
        return true;
      }
      var hechas = ctx.enGuia ? await hechasEnOtros(a, ctx.tipo, h.origenGuia, g.id) : 0;
      var notas = window.NotasHito ? NotasHito.delTarea(a, g.id) : [];
      var nota = (g.hecho || g.noaplica || notas.length)
        ? 'Esta tarea ' + (g.hecho || g.noaplica ? 'está marcada' : 'tiene notas') + ' en este asunto.' : '';
      var donde = await preguntar(a, h, ctx, g.texto, { conTrabajo: hechas, nota: nota });
      if (!donde) return false;
      if (donde === 'aqui' || ctx.apagada || !ctx.enGuia) {
        await Hitos.ocultarGuionDeGuia(a.nombre, h.id, g.id);
        U.aviso(SOLO_AQUI, 'bueno');
        repintar();
        return true;
      }
      return await aLaGuia(a, h, ctx, {
        saltados: hechas,
        enPaso: function (p) {
          var l = lineaEn(p.guion, g.id);
          if (!l) return false;
          l.lista.splice(l.i, 1);
        },
        antesDeTocar: function () { return conservarHechas(a, h, g); },
        deshacerAqui: function () { return Hitos.ocultarGuionDeGuia(a.nombre, h.id, g.id); }
      });
    } catch (err) {
      U.fallo('No he podido borrar la tarea', err);
      return false;
    }
  }

  return { nueva: nueva, cambiar: cambiar, pasar: pasar, borrar: borrar, lineaEn: lineaEn };
})();
