/* ============================================================
   hito-mesa-tarea-menu.js — el «⋮» de cada tarea del guion, en la
   tarjeta «Tareas del hito» (29-sep-2026, fila 224,
   docs/TAREAS-DEL-HITO-SENCILLAS.md, secciones 2 y 4).

   Antes, cambiar una tarea eran tres frases largas al pie de la
   tarjeta («+ Añadir una tarea solo para este asunto», «✎ Cambiar las
   tareas de este hito…»). Ahora cada tarea lleva su propio «⋮»:

     De la guía: Subir · Bajar · Anotar · Cambiar · Borrar · Abrir en la guía
     «Solo aquí»: Subir · Bajar · Anotar · Cambiar · Borrar

   Fila 660: «Cambiar», «Borrar», «Subir» y «Bajar» van a la guía del tipo si
   la marca «Los cambios en hitos y tareas van también a la guía» está encendida
   (js/marca-guia.js) y se quedan en este asunto si está apagada
   (js/donde-se-guarda-tareas.js). Ya no hay «Pasar a la guía». «Abrir en la guía»
   es el editor de siempre.

   - «Anotar» abre una línea para escribir debajo de la tarea; la nota
     va a la libreta única del asunto (NotasHito.anadirDesdeTarea, fila
     139) con el nombre de la tarea delante. Con notas, la tarea lleva
     un 💬 que las despliega.
   - «Cambiar»: el texto se edita en la propia línea; Intro abre el
     emergente (DondeSeGuardaTareas.cambiar).
   - «Abrir en la guía»: el editor de siempre
     (HitoMesaGuion.cambiarGuionDelPaso), con la tarea ya resaltada.
   - «Borrar»: de una tarea de la guía, el emergente; de una «solo aquí»,
     se borra como siempre (Hitos.borrarGuionPropio).

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
      ? '<button type="button" class="guion-tarea-notas-boton" data-ayuda-clave="ver-notas-tarea">💬' +
        (notas.length > 1 ? ' ' + notas.length : '') + '</button>'
      : '';
    return boton + '<button type="button" class="guion-tarea-menu-boton" data-ayuda-clave="mas-opciones">⋮</button>';
  }

  /* Lo que va debajo de la tarea: la edición en línea, la caja de
     anotar, o las notas ya escritas. Como mucho, una a la vez. */
  function debajoHTML(g, a) {
    var st = e(g.id);
    if (st.editando) {
      return '<div class="guion-tarea-editar">' +
        '<input class="campo guion-tarea-editar-texto" data-clave="tarea-editar-' + U.escapar(g.id) +
        '" value="' + U.escapar(g.texto) + '">' +
        /* Fila 522: «Qué se hace» y su dato, como en la guía (una pregunta no los lleva). */
        (!g.pregunta && window.AnadirTarea ? '<div class="at-hueco at-hueco-cambiar"></div><p class="suave tcd-alcance">' + U.escapar(window.MarcaGuia ? MarcaGuia.alcance(a) : '') + '</p>' +
          '<div class="tcd-botones"><button type="button" class="boton boton-chico guion-tarea-editar-guardar">Guardar</button>' +
          '<button type="button" class="enlace guion-tarea-editar-cancelar">Cancelar</button></div>' : '') +
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

  async function borrar(a, h, g) {
    if (g.propio) {
      var notas = notasDe(a, g);
      if (g.hecho || g.noaplica || notas.length) {
        var ok = await U.preguntar('Borrar esta tarea', '<p>' + U.escapar(g.texto) + '</p>', 'Borrar');
        if (!ok) return;
      }
    }
    var borrada = await DondeSeGuardaTareas.borrar(a, h, g);
    if (borrada) delete estado[g.id];
  }

  /* Intro en la línea editada: abre «¿Dónde se guarda?». Si se cancela,
     la línea sigue en edición con lo escrito. */
  function guardarTexto(a, h, g, texto, extras) {
    return DondeSeGuardaTareas.cambiar(a, h, g, texto, extras).then(function (ok) {
      if (ok) delete estado[g.id];
    });
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
  /* Fila 553: «Subir» y «Bajar» (apagados en la primera y la última), separados por una raya; el orden cambia al momento en este asunto. */
  function moverOpciones(a, h, g) {
    if (!g.clave || !Hitos.moverGuion) return [];
    var pos = Hitos.posicionGuion(a, h, g.clave);
    function mover(delta) {
      return function () {
        Hitos.moverGuion(a, h.id, g.clave, delta).then(function () {
          /* Fila 660: con la marca de la guía encendida, el orden nuevo va también a la guía (sin franja ni pregunta). */
          if (g.propio || !window.MarcaGuia || !MarcaGuia.enGuia(a) || !HitoMesaGuion.puedeAnadirALaGuia(a, h)) return null;
          return Hitos.hitosDe(a.nombre).then(function (hitos) { return Hitos.guardarOrdenEnLaGuia(a, Hitos.buscar(hitos, h.id) || h); });
        }).then(function () {
          if (window.HitosPanel) HitosPanel.programarRepintado();
        }).catch(function (err) { U.fallo('No he podido mover la tarea', err); });
      };
    }
    return [
      { texto: 'Subir', clase: 'mesa-tarea-subir', deshabilitado: pos.indice <= 0, alPulsar: mover(-1) },
      { texto: 'Bajar', clase: 'mesa-tarea-bajar', deshabilitado: pos.indice === -1 || pos.indice >= pos.total - 1, alPulsar: mover(1) },
      { raya: true }
    ];
  }

  function opciones(a, h, g, repintar) {
    var lista = moverOpciones(a, h, g).concat([
      { texto: 'Anotar', alPulsar: function () { e(g.id).anotando = true; repintar(); } }
    ]);
    /* Fila 660: «Cambiar» es el mismo formulario para todas las tareas (js/anadir-tarea.js) y dice a dónde irá. Una tarea de la lista común que se
       cambia aquí deja de ser la de la lista (el cambio de la lista entera se hace en Ajustes, en la guía del tipo). */
    lista.push({ texto: 'Cambiar', alPulsar: function () { e(g.id).editando = true; repintar(); } });
    lista.push({ texto: 'Borrar', clase: 'ficha-menu-peligro', alPulsar: function () { borrar(a, h, g); } });
    if (!g.propio) {
      lista.push({ texto: 'Abrir en la guía', deshabilitado: !HitoMesaGuion.puedeAnadirALaGuia(a, h),
        alPulsar: function () { HitoMesaGuion.cambiarGuionDelPaso(a, h, g.id); } });
    }
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
      var caja = el.querySelector('.guion-tarea-editar');
      /* Fila 660: «Qué se hace», «sobre qué» y «Dónde se hace», con la casilla que se busca escribiendo (js/anadir-tarea.js). */
      var huecoForma = !g.pregunta && window.AnadirTarea ? caja.querySelector('.at-hueco-cambiar') : null;
      var forma = huecoForma ? AnadirTarea.montar(huecoForma, { modo: 'cambiar', inicial: { accion: g.accion || '', receta: g.receta || null, donde: g.donde || Sitios.dondeDe(g) || null,
        tipoDocumento: g.tipoDocumento, aQuien: g.aQuien, elegida: true } }) : null;
      var guardarEditado = function () {
        var texto = editar.value.trim();
        if (texto) guardarTexto(a, h, g, texto, forma ? forma.resultado() : undefined);
      };
      var botonGuardar = caja.querySelector('.guion-tarea-editar-guardar');
      if (botonGuardar) botonGuardar.onclick = guardarEditado;
      var botonCancelar = caja.querySelector('.guion-tarea-editar-cancelar');
      if (botonCancelar) botonCancelar.onclick = function () { e(g.id).editando = false; repintar(); };
      editar.onkeydown = function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          guardarEditado();
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
