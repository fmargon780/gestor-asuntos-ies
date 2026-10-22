/* ============================================================
   donde-se-guarda-tareas.js — crear, cambiar, borrar y pasar una tarea
   del hito (30-sep-2026, fila 235, docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md;
   sin pregunta desde la fila 416, docs/HITOS-UN-SOLO-SITIO.md, parte A:
   la guía manda).

   Lo llaman la caja «Nueva tarea…» (js/hito-mesa-guion.js) y el «⋮» de
   cada tarea (js/hito-mesa-tarea-menu.js). Ya no sale ningún emergente
   «¿Dónde se guarda?»:

   - «Nueva tarea…»: se guarda solo en este asunto, con su marca «solo aquí».
   - «Cambiar» y «Borrar» una tarea de la guía: van a la guía (la tarea
     vive en el paso, así que llega sola a todos los asuntos abiertos del
     tipo). Borrar una pregunta ya respondida en otros asuntos avisa antes.
   - «Pasar a la guía» (la «⋮» de una tarea «solo aquí»): la lleva a la
     guía; si el hito no está en la guía (un hito «solo aquí»), se lleva
     entero con todas sus tareas (HitosDesdeElAsuntoGuia.llevarHitoEntero).
   - Cambiar o borrar una tarea «solo aquí»: se queda en el asunto.
   - Sin tipo, o con el hito dentro de una pregunta: solo en el asunto.

   Las tres (nueva, cambiar, borrar) devuelven una promesa de true si se
   ha guardado y de false si se ha cancelado o ha fallado, para que quien
   llama decida si deja lo escrito. El aviso verde de lo que va a la guía
   lleva «Deshacer».
   ============================================================ */
window.DondeSeGuardaTareas = (function () {

  var SOLO_AQUI = 'Guardado solo en este asunto.';
  var SOLO_AQUI_EN_PREGUNTA = 'Guardado solo en este asunto: dentro de una pregunta no se puede cambiar la guía desde aquí.';

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
    ctx.apagada = SOLO_AQUI_EN_PREGUNTA;
    return ctx;
  }

  /* Edita una copia de los pasos del tipo con `enPaso(paso)`, que puede
     devolver false para no guardar nada. */
  function tocarPaso(a, h, ctx, enPaso) {
    return GuiasDelCentro.cambiarPasos(ctx.tipo, function (pasos) {
      var p = HitoMesaGuion.buscarPasoDeGuia(pasos, h.origenGuia);
      if (!p || (p.opciones && p.opciones.length)) return false;
      return enPaso(p) === false ? false : true;
    }, { claveActual: a.nombre });
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

  /* Siempre solo en este asunto, con su marca «solo aquí». `alElegir()` se
     llama en cuanto se guarda (para vaciar la caja antes del repintado). */
  async function nueva(a, h, texto, alElegir) {
    texto = String(texto || '').trim();
    if (!texto) return false;
    try {
      if (alElegir) alElegir();
      await Hitos.anadirGuionPropio(a.nombre, h.id, texto);
      if (DondeSeGuarda.tipoDe(a)) U.aviso(SOLO_AQUI, 'bueno');
      repintar();
      return true;
    } catch (err) {
      U.fallo('No he podido guardar la tarea', err);
      return false;
    }
  }

  /* ---------- Cambiar ---------- */

  async function cambiar(a, h, g, texto) {
    texto = String(texto || '').trim();
    if (!texto) return false;
    try {
      var ctx = await contexto(a, h);
      var propiaRaw = g.propio ? (h.guionPropio || []).filter(function (x) { return x.id === g.id; })[0] : null;
      var idOriginal = propiaRaw && propiaRaw.enLugarDe;
      /* Una tarea «solo aquí» de verdad, o un hito que no está en la guía: se queda en el asunto. */
      if ((g.propio && !idOriginal) || !ctx.tipo || ctx.apagada || !ctx.enGuia) {
        if (g.pregunta) { if (texto !== g.texto) await Hitos.cambiarPreguntaAqui(a.nombre, h.id, g.id, texto); }
        else if (g.propio) { if (texto !== g.texto) await Hitos.cambiarGuionPropioTexto(a.nombre, h.id, g.id, texto); }
        else await Hitos.cambiarGuionAqui(a.nombre, h.id, g, texto);
        if (ctx.tipo) U.aviso(ctx.apagada || SOLO_AQUI, 'bueno');
        repintar();
        return true;
      }
      if (!g.propio) {
        /* De la guía: cambia su texto en la guía; en este asunto ya se ve. */
        return await aLaGuia(a, h, ctx, {
          enPaso: function (p) {
            var l = lineaEn(p.guion, g.id);
            if (!l) return false;
            l.lista[l.i].texto = texto;
          },
          /* Fila 405: una pregunta con texto «solo aquí» vuelve a seguir a la guía. */
          despues: g.pregunta ? function () { return Hitos.cambiarPreguntaAqui(a.nombre, h.id, g.id, ''); } : null,
          deshacerAqui: function () {
            return g.pregunta ? Hitos.cambiarPreguntaAqui(a.nombre, h.id, g.id, texto) : Hitos.cambiarGuionAqui(a.nombre, h.id, g, texto);
          }
        });
      }
      /* Una sustituta de un «Cambiar aquí» de antes: el texto nuevo pasa a la línea
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
    } catch (err) {
      U.fallo('No he podido guardar el cambio', err);
      return false;
    }
  }

  /* ---------- Pasar a la guía ---------- */

  /* «Pasar a la guía» del «⋮» de una tarea «solo aquí»: la lleva a la guía,
     sin preguntar. Si el hito tampoco está en la guía, se lleva entero. */
  async function pasar(a, h, g) {
    try {
      var ctx = await contexto(a, h);
      if (!ctx.tipo || ctx.apagada) { U.aviso('Dentro de una pregunta no se puede pasar a la guía desde aquí.', 'ambar'); return false; }
      var nuevoId = null;
      return await aLaGuia(a, h, ctx, {
        enPaso: function (p) {
          p.guion = GuiasGuion.normalizar((p.guion || []).concat([lineaParaLaGuia(g, g.texto)]));
          nuevoId = p.guion[p.guion.length - 1].id;
        },
        despues: function () { return Hitos.pasarGuionPropioAGuia(a.nombre, h.id, g.id, nuevoId); },
        deshacerAqui: function () { return devolverAqui(a, h, g, g.texto); }
      });
    } catch (err) {
      U.fallo('No he podido pasarla a la guía', err);
      return false;
    }
  }

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

  /* Fila 405: de los otros asuntos abiertos del tipo, en cuántos está ya
     respondida la pregunta `idPregunta` del hito de origen `idOrigen`. */
  async function respondidasEnOtros(a, idOrigen, idPregunta) {
    var datos = await Hitos.leer();
    var n = 0;
    DondeSeGuarda.otrosAbiertos(a).forEach(function (c) {
      var e = datos.porAsunto[c];
      var x = e && (e.hitos || []).filter(function (y) { return y.origenGuia === idOrigen && !y.delTipoAnterior; })[0];
      if (x && x.guionElegido && x.guionElegido[idPregunta]) n++;
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
      /* «Solo aquí» (o sin tipo): se borra como siempre. */
      if (g.propio || !ctx.tipo) {
        await Hitos[g.propio ? 'borrarGuionPropio' : 'ocultarGuionDeGuia'](a.nombre, h.id, g.id);
        repintar();
        return true;
      }
      /* Un hito que no está en la guía, o dentro de una pregunta: solo en este asunto. */
      if (ctx.apagada || !ctx.enGuia) {
        await Hitos.ocultarGuionDeGuia(a.nombre, h.id, g.id);
        U.aviso(ctx.apagada || SOLO_AQUI, 'bueno');
        repintar();
        return true;
      }
      /* Fila 405: una pregunta no se «conserva» en los asuntos que la tienen
         respondida: dejan de verla (y se avisa antes). */
      var respondidas = g.pregunta ? await respondidasEnOtros(a, h.origenGuia, g.id) : 0;
      var hechas = g.pregunta ? 0 : await hechasEnOtros(a, ctx.tipo, h.origenGuia, g.id);
      if (respondidas) {
        var ok = await U.preguntar('Borrar esta pregunta',
          '<p>' + U.escapar(g.texto) + '</p><p class="nota">En ' + (respondidas === 1 ? '1 asunto' : respondidas + ' asuntos') +
          ' ya está respondida; allí dejará de verse.</p>', 'Borrar');
        if (!ok) return false;
      }
      return await aLaGuia(a, h, ctx, {
        saltados: hechas,
        enPaso: function (p) {
          var l = lineaEn(p.guion, g.id);
          if (!l) return false;
          l.lista.splice(l.i, 1);
        },
        antesDeTocar: g.pregunta ? null : function () { return conservarHechas(a, h, g); },
        deshacerAqui: function () { return Hitos.ocultarGuionDeGuia(a.nombre, h.id, g.id); }
      });
    } catch (err) {
      U.fallo('No he podido borrar la tarea', err);
      return false;
    }
  }

  return { nueva: nueva, cambiar: cambiar, pasar: pasar, borrar: borrar, lineaEn: lineaEn };
})();
