/* ============================================================
   hito-mesa-tarea-menu.js — el «⋮» de cada tarea del guion, en la
   tarjeta «Tareas del hito» (29-sep-2026, fila 224,
   docs/TAREAS-DEL-HITO-SENCILLAS.md, secciones 2 y 4).

   Antes, cambiar una tarea eran tres frases largas al pie de la
   tarjeta («+ Añadir una tarea solo para este asunto», «✎ Cambiar las
   tareas de este hito…»). Ahora cada tarea lleva su propio «⋮»:

     De la guía: Anotar · Cambiar aquí · Cambiar en la guía · Borrar
     «Solo aquí»: Anotar · Cambiar · Pasar a la guía · Borrar

   - «Anotar» abre una línea para escribir debajo de la tarea; la nota
     va a la libreta única del asunto (NotasHito.anadirDesdeTarea, fila
     139) con el nombre de la tarea delante. Con notas, la tarea lleva
     un 💬 que las despliega.
   - «Cambiar aquí» / «Cambiar»: el texto se edita en la propia línea
     (Hitos.cambiarGuionAqui / Hitos.cambiarGuionPropioTexto,
     js/hitos-guion.js).
   - «Cambiar en la guía»: el editor de siempre
     (HitoMesaGuion.cambiarGuionDelPaso), con la tarea ya resaltada.
   - «Pasar a la guía»: añade la tarea al final del guion del paso de
     la guía (Hitos.pasarGuionPropioAGuia) y dispersa la marca de hecha
     si la tenía.
   - «Borrar»: Hitos.borrarGuionPropio (una «solo aquí») o
     Hitos.ocultarGuionDeGuia (una de la guía, sin sustituta).

   El estado de qué tarea está editándose, anotándose o con las notas
   desplegadas vive aquí (vista, no se guarda en disco): `estadoDe(id)`.
   Lo pinta js/hito-mesa-guion.js, con `botonesHTML`/`debajoHTML`, y lo
   engancha con `engancharFila` justo después de pintar cada tarea.
   ============================================================ */
var HitoMesaTareaMenu = (function () {

  var estado = {};   /* idTarea -> { editando, anotando, notasAbiertas } */

  function e(id) { return estado[id] || (estado[id] = {}); }

  function tipoDe(a) {
    return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || '';
  }

  function nombreCortoDe(tipo) {
    return (window.Nombres && window.App) ? Nombres.tipoParaVer(tipo, App.E.tipos) : tipo;
  }

  function notasDe(a, g) { return window.NotasHito ? NotasHito.delTarea(a, g.id) : []; }

  /* Lo que va al final de la fila de la tarea (junto al «quién y
     cuándo»): el 💬 (solo si tiene notas) y el «⋮», siempre visibles,
     sin mover ni tapar el «No aplica». */
  function botonesHTML(g, a) {
    var notas = notasDe(a, g);
    var boton = notas.length
      ? '<button type="button" class="guion-tarea-notas-boton" title="Ver las notas de esta tarea">💬' +
        (notas.length > 1 ? ' ' + notas.length : '') + '</button>'
      : '';
    return boton + '<button type="button" class="guion-tarea-menu-boton" title="Más opciones">⋮</button>';
  }

  /* Lo que va debajo de la tarea: la edición en línea, la caja de
     anotar, o las notas ya escritas. Como mucho, una a la vez. */
  function debajoHTML(g, a) {
    var st = e(g.id);
    if (st.editando) {
      return '<div class="guion-tarea-editar">' +
        '<input class="campo guion-tarea-editar-texto" data-clave="tarea-editar-' + U.escapar(g.id) +
        '" value="' + U.escapar(g.texto) + '">' +
        '<p class="nota">Intro guarda, Escape cancela.</p></div>';
    }
    if (st.anotando) {
      return '<div class="guion-tarea-anotar">' +
        '<textarea class="campo guion-tarea-anotar-texto" rows="2" data-clave="tarea-anotar-' + U.escapar(g.id) +
        '" placeholder="Qué hay que anotar de esta tarea"></textarea>' +
        '<p class="nota">Intro guarda, Escape cancela.</p></div>';
    }
    if (st.notasAbiertas) {
      var notas = notasDe(a, g);
      if (!notas.length) return '';
      return '<div class="guion-tarea-notas-lista">' + notas.map(function (n) {
        var cuando = window.Notas ? Notas.cuando(n.cuando) : '';
        return '<div class="guion-tarea-nota"><span class="suave">' + U.escapar(cuando + (n.quien ? ' · ' + n.quien : '')) +
          '</span><div>' + U.escapar(n.texto) + '</div></div>';
      }).join('') + '</div>';
    }
    return '';
  }

  /* ---------- acciones ---------- */

  async function pasarALaGuia(a, h, g, repintar) {
    var tipo = tipoDe(a);
    if (!tipo || !window.GuiasDelCentro || !window.GuiasGuion) return;
    var ok = await U.preguntar('Pasar a la guía',
      '<p>¿Pasar «' + U.escapar(g.texto) + '» a la guía de ' + U.escapar(nombreCortoDe(tipo)) +
      '? Llegará a los asuntos abiertos de este tipo.</p>', 'Pasar a la guía');
    if (!ok) return;
    var nuevoId = null;
    try {
      var hecho = await GuiasDelCentro.cambiarPasos(tipo, function (pasos) {
        var p = HitoMesaGuion.buscarPasoDeGuia(pasos, h.origenGuia);
        if (!p || (p.opciones && p.opciones.length)) return false;
        var nueva = { texto: g.texto, explicacion: g.explicacion || '', accion: g.accion || '', normativa: g.normativa || null };
        if (g.reunir) { nueva.reunir = g.reunir; nueva.obligatorio = !!g.obligatorio; }
        p.guion = GuiasGuion.normalizar((p.guion || []).concat([nueva]));
        nuevoId = p.guion[p.guion.length - 1].id;
        return true;
      });
      if (!hecho) { U.aviso('Ese hito ya no está en la guía del tipo.', 'ambar'); return; }
    } catch (err) {
      U.fallo('No he podido pasarlo a la guía', err);
      return;
    }
    try {
      await Hitos.pasarGuionPropioAGuia(a.nombre, h.id, g.id, nuevoId);
    } catch (err) {
      U.accesorio('Pasado a la guía, pero no he podido dejarlo así en este asunto', err);
    }
    U.aviso('Pasado a la guía de ' + nombreCortoDe(tipo) + '.', 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  async function borrar(a, h, g) {
    var notas = notasDe(a, g);
    var necesitaConfirmar = g.hecho || g.noaplica || notas.length;
    if (necesitaConfirmar) {
      var ok = await U.preguntar('Borrar esta tarea', '<p>' + U.escapar(g.texto) + '</p>', 'Borrar');
      if (!ok) return;
    }
    try {
      if (g.propio) await Hitos.borrarGuionPropio(a.nombre, h.id, g.id);
      else await Hitos.ocultarGuionDeGuia(a.nombre, h.id, g.id);
    } catch (err) {
      U.fallo('No he podido borrar la tarea', err);
      return;
    }
    delete estado[g.id];
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  function guardarTexto(a, h, g, texto) {
    var p = g.propio ? Hitos.cambiarGuionPropioTexto(a.nombre, h.id, g.id, texto)
                      : Hitos.cambiarGuionAqui(a.nombre, h.id, g, texto);
    return p.then(function () {
      delete estado[g.id];
      if (window.HitosPanel) HitosPanel.programarRepintado();
    }).catch(function (err) { U.fallo('No he podido guardar el cambio', err); });
  }

  function guardarNota(a, h, g, texto) {
    if (!window.NotasHito) return Promise.resolve(null);
    return NotasHito.anadirDesdeTarea(a, h, g, g.texto + ': ' + texto).then(function () {
      var st = e(g.id);
      st.anotando = false;
      st.notasAbiertas = true;
      if (window.HitosPanel) HitosPanel.programarRepintado();
    }).catch(function (err) { U.fallo('No he podido guardar la nota', err); });
  }

  /* Las opciones del «⋮», según venga la tarea de la guía o sea «solo
     aquí». `repintar` es un repintado local, inmediato, para abrir el
     modo de edición/anotar sin esperar al repintado general. */
  function opciones(a, h, g, repintar) {
    var lista = [
      { texto: 'Anotar', alPulsar: function () { e(g.id).anotando = true; repintar(); } }
    ];
    if (g.propio) {
      lista.push({ texto: 'Cambiar', alPulsar: function () { e(g.id).editando = true; repintar(); } });
      lista.push({ texto: 'Pasar a la guía', alPulsar: function () { pasarALaGuia(a, h, g, repintar); } });
    } else {
      lista.push({ texto: 'Cambiar aquí', alPulsar: function () { e(g.id).editando = true; repintar(); } });
      lista.push({ texto: 'Cambiar en la guía', deshabilitado: !HitoMesaGuion.puedeAnadirALaGuia(a, h),
        alPulsar: function () { HitoMesaGuion.cambiarGuionDelPaso(a, h, g.id); } });
    }
    lista.push({ texto: 'Borrar', clase: 'ficha-menu-peligro', alPulsar: function () { borrar(a, h, g); } });
    return lista;
  }

  /* Engancha el «⋮», el 💬 y la edición/anotar en línea de una tarea ya
     pintada. `el` es su `.guion-paso`; `repintar` repinta solo esta
     tarjeta (sin esperar al disco), para abrir/cerrar un modo o
     desplegar las notas al momento. */
  function engancharFila(el, a, h, g, repintar) {
    var menuBoton = el.querySelector('.guion-tarea-menu-boton');
    if (menuBoton && window.FichaMenus) FichaMenus.montar(menuBoton, opciones(a, h, g, repintar));

    var notasBoton = el.querySelector('.guion-tarea-notas-boton');
    if (notasBoton) notasBoton.onclick = function () {
      var st = e(g.id);
      st.notasAbiertas = !st.notasAbiertas;
      repintar();
    };

    var editar = el.querySelector('.guion-tarea-editar-texto');
    if (editar) {
      editar.onkeydown = function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          var texto = editar.value.trim();
          if (texto) guardarTexto(a, h, g, texto);
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          e(g.id).editando = false;
          repintar();
        }
      };
    }

    var anotar = el.querySelector('.guion-tarea-anotar-texto');
    if (anotar) {
      anotar.onkeydown = function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          ev.preventDefault();
          var texto = anotar.value.trim();
          if (texto) guardarNota(a, h, g, texto);
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          e(g.id).anotando = false;
          repintar();
        }
      };
    }
  }

  return { botonesHTML: botonesHTML, debajoHTML: debajoHTML, engancharFila: engancharFila };
})();
window.HitoMesaTareaMenu = HitoMesaTareaMenu;
