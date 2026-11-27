/* ============================================================
   asunto-sin-hitos.js — el asunto como lista de tareas y un panel
   (18-nov-2026, fila 699, docs/699-ASUNTO-SIN-HITOS-PANTALLA.md; pantalla de prueba
   docs/pantallas/692.html; diseño en docs/notas-diseno/692.md).

   Un tipo con la casilla «Sin hitos: el asunto es una lista de tareas» (`tipo.sinHitos`, Ajustes de
   un tipo) da asuntos nuevos sin fila de hitos. Por dentro, el asunto lleva UN hito oculto
   (`h.listaDeTareas`, titulado «Tareas»), que solo existe para guardar las tareas con el mismo
   guardado de siempre (`guionPropio`, `guionHecho`, `guionOrden`): ninguna pantalla lo enseña.
   Un asunto es «lista de tareas» por llevar ese hito, no por lo que diga el tipo hoy: los asuntos
   ya abiertos y los de un tipo sin la casilla no cambian en nada.

   Pinta (en `#ficha-guia`, en lugar de la mesa del hito; lo llama `HitoMesa.aplicar`):
     - el panel: «Ahora toca: <la primera tarea sin hacer>» o «Listo para cerrar», con «N de M tareas
       hechas» y «Cerrar el asunto»;
     - la lista de tareas (casilla, frase, quién y cuándo, «solo aquí», «⋮» con Anotar, Cambiar y Borrar);
     - «+ Añadir tarea», en una línea.
   Fila 702: una tarea puede estar esperando (js/tarea-espera.js): «Esperando a…» en su ⋮, la línea y los tres botones bajo ella y el panel.
   Fila 703: una tarea puede llevar un papel (js/tarea-papel.js, js/tarea-papel-pintar.js): sin casilla, con los pasos de su recorrido.
   Nada de «Qué se hace», «Dónde se hace», «A quién» ni «Qué documento».
   Sin casilla «los cambios van a la guía»: lo que se hace aquí se queda en el asunto.

   `avisoAlCerrar(a)` (lo llama App.cerrarAsunto): con tareas sin hacer, avisa de cuántas quedan y
   deja seguir.
   ============================================================ */
var AsuntoSinHitos = (function () {

  var estado = {};   /* idTarea -> { editando, anotando, notasAbiertas } (vista, no se guarda) */
  var ultimo = null; /* { a, hitos, abierto } del último pintado, para repintar sin ir al disco */

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function e(id) { return estado[id] || (estado[id] = {}); }

  function tipoDe(a) { return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || ''; }

  /* ¿El tipo lleva hoy la casilla «Sin hitos»? Solo decide cómo NACE un asunto nuevo. */
  function tipoSinHitos(nombreTipo) {
    var lista = (window.App && App.E && App.E.tipos) || [];
    var t = lista.filter(function (x) { return x.tipo === nombreTipo; })[0];
    return !!(t && t.sinHitos);
  }

  /* El hito oculto donde viven las tareas, o null si el asunto es de los de siempre. */
  function hitoDe(hitos) {
    return (hitos || []).filter(function (h) { return h && h.listaDeTareas; })[0] || null;
  }

  function es(hitos) { return !!hitoDe(hitos); }

  /* Asunto nuevo de un tipo «sin hitos»: nace con el hito oculto y, fila 701, con las tareas de la guía de su tipo, en su orden. */
  async function crear(clave, tipo) {
    var previos = await Hitos.hitosDe(clave);
    if (previos.length) return previos;
    var tareas = (tipo && window.AsuntoSinHitosGuia) ? await AsuntoSinHitosGuia.deLaGuia(tipo) : [];
    var resultado = null;
    var datos = await Hitos.cambiar(function (d) {
      var h = Hitos.pasoAHito({ id: Hitos.nuevoId(), titulo: 'Tareas' });
      h.origenGuia = null;
      h.listaDeTareas = true;
      if (tareas.length) AsuntoSinHitosGuia.darTareas(h, tareas);
      var lista = [h];
      resultado = Hitos.recomputeEnCurso(lista);
      d.porAsunto[clave] = { creados: U.hoyIso(), hitos: lista };
      return d;
    });
    if (resultado) await Hitos.aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaCorta(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3 || !MESES[parseInt(p[1], 10) - 1]) return '';
    return parseInt(p[2], 10) + '-' + MESES[parseInt(p[1], 10) - 1];
  }

  function tareasDe(a, h) { return Hitos.guionDe(a, h).filter(function (g) { return !g.pregunta; }); }
  function notasDe(a, g) { return window.NotasHito ? NotasHito.delTarea(a, g.id) : []; }
  function soloLectura() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- el panel ---------- */

  function panelHTML(lista, abierto, a) {
    var c = Hitos.cuentaGuion(lista);
    var cuenta = '<span class="ash-cuenta">' + c.hechos + ' de ' + c.total + ' tareas hechas</span>';
    var siguiente = lista.filter(function (g) { return !g.hecho && !g.noaplica; })[0];
    if (!c.total) {
      return '<div class="ash-panel ash-toca"><div class="ash-panel-texto"><b>Todavía no hay tareas</b>' +
        '<span>Añade la primera aquí debajo.</span></div>' + cuenta + '</div>';
    }
    if (!siguiente) {
      return '<div class="ash-panel ash-listo"><div class="ash-panel-texto"><b>Listo para cerrar</b>' +
        '<span>Todas las tareas están hechas.</span></div>' + cuenta +
        (abierto ? '<button type="button" class="boton boton-principal ash-cerrar">Cerrar el asunto</button>' : '') + '</div>';
    }
    var espera = window.TareaEspera ? TareaEspera.panelDe(siguiente) : null;   /* fila 702: la primera tarea sin hacer espera */
    if (espera) return '<div class="ash-panel ' + espera.clase + '"><div class="ash-panel-texto"><b>' + esc(espera.titulo) + '</b><span>' + esc(espera.sub) + '</span></div>' + cuenta + '</div>';
    var sub = (siguiente.papel && window.TareaPapelPintar && a) ? TareaPapelPintar.siguienteTexto(siguiente, a) : '';   /* fila 703: «Siguiente paso: <botón>.» */
    return '<div class="ash-panel ash-toca"><div class="ash-panel-texto"><b>Ahora toca: ' + esc(siguiente.texto) + '</b>' +
      '<span>' + esc(sub || 'Le toca a Administración.') + '</span></div>' + cuenta + '</div>';
  }

  /* ---------- las tareas ---------- */

  function debajoHTML(g, a) {
    var st = e(g.id);
    if (window.AsuntoSinHitosFalta) { var rel = AsuntoSinHitosFalta.debajoHTML(g, a); if (rel) return rel; }
    if (g.accion === 'copiar' && window.TareaCopiar && !st.editando && !st.anotando && !st.notasAbiertas) { var cop = TareaCopiar.vistaHTML(g, a, hitoDe(ultimo && ultimo.hitos)); if (cop) return cop; }   /* fila 783 */
    if (st.editando) {
      return '<div class="ash-editar"><input class="campo ash-editar-texto" data-clave="ash-editar-' + esc(g.id) + '" value="' + esc(g.texto) + '">' +
        '<button type="button" class="boton boton-chico ash-editar-guardar">Guardar</button>' +
        '<button type="button" class="enlace ash-editar-cancelar">Cancelar</button></div>';
    }
    if (st.anotando) {
      return '<div class="ash-anotar"><textarea class="campo ash-anotar-texto" rows="2" data-clave="ash-anotar-' + esc(g.id) +
        '" placeholder="Qué hay que anotar de esta tarea"></textarea><p class="nota">Intro guarda, Escape cancela.</p></div>';
    }
    if (st.notasAbiertas) {
      return '<div class="ash-notas">' + notasDe(a, g).map(function (n) {
        var cuando = window.Notas ? Notas.cuando(n.cuando) : '';
        return '<div class="ash-nota"><span class="suave">' + esc(cuando + (n.quien ? ' · ' + n.quien : '')) + '</span><div>' + esc(n.texto) + '</div></div>';
      }).join('') + '</div>';
    }
    return '';
  }

  /* Fila 707: «Cómo se hace» de una tarea que viene de la guía. Se lee de la guía al pintar, no se copia al asunto. */
  function comoDe(a, g) {
    if (!g || !g.origenGuia || !window.GuiasDelCentro || !window.AsuntoSinHitosGuia) return '';
    var pasos = GuiasDelCentro.pasosDe(tipoDe(a)) || [];
    var t = AsuntoSinHitosGuia.tareasDe(pasos).filter(function (x) { return x.id === g.origenGuia; })[0];
    return (t && t.comoSeHace) || '';
  }

  /* Fila 706: la banda del rótulo, delante de la primera tarea a la vista de su grupo (sin tareas a la vista, no sale). */
  function rotuloHTML(g, previo) {
    var r = g.grupo && g.grupo !== previo.v ? '<div class="ash-rotulo">' + esc(g.grupo) + '</div>' : '';
    previo.v = g.grupo || '';
    return r;
  }

  function tareaHTML(g, a, abierto, ahora) {
    var como = comoDe(a, g);
    var comoAbierto = !!(como && e(g.id).comoAbierto);
    var puede = abierto && !soloLectura();
    var notas = notasDe(a, g);
    var quien = g.hecho && (g.quien || g.cuando) ? [g.quien || '', fechaCorta(g.cuando)].filter(Boolean).join(' · ') : '';
    return '<div class="ash-tarea' + (g.falta ? ' falta' : '') + (g.hecho ? ' hecha' : '') + (g.noaplica ? ' noaplica' : '') + (ahora ? ' ahora' : '') + (g.grupo ? ' bajo-rotulo' : '') + '" data-id="' + esc(g.id) + '">' +
      '<div class="ash-fila">' + ((g.papel && window.TareaPapelPintar) ? TareaPapelPintar.centroHTML(g, a) :   /* fila 703: la tarea de papel no lleva casilla */
        '<label class="ash-linea"><input type="checkbox" class="ash-casilla"' + (g.hecho ? ' checked' : '') + (puede ? '' : ' disabled') + '>' +
        '<span class="ash-texto-tarea">' + esc(g.texto) + '</span></label>') +
        (g.propio && !g.deGuia ? '<span class="ash-etq">solo aquí</span>' : '') +   /* fila 701: las que vienen de la guía no llevan marca */
        (window.AsuntoSinHitosFalta ? AsuntoSinHitosFalta.etiquetaHTML(g) : '') +
        (quien ? '<span class="ash-quien">' + esc(quien) + '</span>' : '') +
        ((g.papel && window.TareaPapelPintar) ? TareaPapelPintar.botonHTML(g, a, puede) : '') +
        (como ? '<button type="button" class="ash-como-boton" aria-expanded="' + comoAbierto + '" aria-label="Cómo se hace" title="Cómo se hace">ⓘ</button>' : '') +
        (notas.length ? '<button type="button" class="ash-notas-boton">💬' + (notas.length > 1 ? ' ' + notas.length : '') + '</button>' : '') +
        (puede ? '<button type="button" class="ash-menu-boton" aria-label="Más de esta tarea">⋮</button>' : '') +
      '</div>' + (comoAbierto ? '<div class="ash-como">' + esc(como) + '</div>' : '') + debajoHTML(g, a) +
      (window.TareaEspera ? TareaEspera.debajoHTML(g, puede) : '') + '</div>';   /* fila 702: la espera de la tarea */
  }

  function anadirHTML(abierto) {
    if (!abierto || soloLectura()) return '';
    return '<div class="ash-anadir"><input class="campo ash-anadir-texto" data-clave="ash-anadir" placeholder="+ Añadir tarea: escribe qué hay que hacer" aria-label="Tarea nueva">' +
      (window.TareaPapelPintar ? TareaPapelPintar.selectorHTML('ash-anadir-papel', '') : '') +   /* fila 703 */
      '<button type="button" class="boton boton-chico ash-anadir-boton">Añadir</button></div>';
  }

  /* ---------- pintar y enganchar ---------- */

  function limpiarLoDeLosHitos(a, abierto) {
    var tira = document.getElementById('ficha-tira');
    if (tira) tira.innerHTML = '';
    var marca = document.getElementById('ficha-marca-guia');
    if (marca) marca.innerHTML = '';   /* sin casilla «los cambios van también a la guía» */
    var columnas = document.getElementById('trabajo-columnas');
    if (columnas) columnas.classList.remove('con-hito');
    /* Fila 686 (devuelta, 19-nov-2026): también en un asunto de lista de tareas se puede soltar un fichero (js/soltar-documento.js). */
    if (window.SoltarDocumento) SoltarDocumento[abierto ? 'enganchar' : 'desenganchar'](columnas, a);
    if (window.FichaDocumentos && FichaDocumentos.marcarHito) FichaDocumentos.marcarHito(a, [], null, !!abierto);
  }

  function pintar(caja, a, hitos, ajustes, abierto) {
    var h = hitoDe(hitos);
    if (!caja || !h) return false;
    ultimo = { caja: caja, a: a, hitos: hitos, ajustes: ajustes, abierto: abierto };
    limpiarLoDeLosHitos(a, abierto);
    revelarMenu();
    caja.classList.remove('con-mesa');
    U.conservandoLoEscrito(caja, function () {
      var lista = tareasDe(a, h);
      var siguiente = lista.filter(function (g) { return !g.hecho && !g.noaplica; })[0];
      var previoGrupo = { v: '' };
      caja.innerHTML = '<div class="ash">' + panelHTML(lista, abierto, a) +
        '<div class="ash-lista">' + lista.map(function (g) { return rotuloHTML(g, previoGrupo) + tareaHTML(g, a, abierto, g === siguiente); }).join('') + '</div>' +
        anadirHTML(abierto) + '</div>';
      enganchar(caja, a, h, lista, abierto);
      if (window.SoltarDocumento && abierto) Array.prototype.forEach.call(caja.querySelectorAll('.ash-tarea'), function (el) { SoltarDocumento.enganchar(el, a); });   /* fila 686 */
    });
    /* Fila 703: los papeles que han llegado por otro camino se unen solos y las tareas de papel completas quedan hechas. */
    if (window.TareaPapel && abierto && tareasDe(a, h).some(function (g) { return g.papel; })) {
      TareaPapel.sincronizar(a, h).then(function (cambio) { if (cambio && window.HitosPanel) HitosPanel.programarRepintado(); });
    }
    return true;
  }

  function repintar() {
    if (ultimo) pintar(ultimo.caja, ultimo.a, ultimo.hitos, ultimo.ajustes, ultimo.abierto);
  }

  /* Guarda, repinta desde el disco y, si falla, avisa en rojo. */
  async function guardar(control, queNo, hacer) {
    try { await U.mientrasGuarda(control, hacer); }
    catch (err) { U.fallo('No he podido ' + queNo, err); }
    finally { if (window.HitosPanel) HitosPanel.programarRepintado(); }
  }

  function apuntar(a, g, que) {
    if (!window.RegistroAsunto) return Promise.resolve();
    return RegistroAsunto.auto(a, 'Tarea ' + que + ': ' + g.texto);
  }

  async function borrar(a, h, g) {
    if (g.hecho || g.noaplica || notasDe(a, g).length) {
      var ok = await U.preguntar('Borrar esta tarea', '<p>' + esc(g.texto) + '</p>', 'Borrar');
      if (!ok) return;
    }
    await Hitos.borrarGuionPropio(a.nombre, h.id, g.id);
    delete estado[g.id];
  }

  function enganchar(caja, a, h, lista, abierto) {
    var porId = {};
    lista.forEach(function (g) { porId[g.id] = g; });
    var puede = abierto && !soloLectura();

    Array.prototype.forEach.call(caja.querySelectorAll('.ash-tarea'), function (el) {
      var g = porId[el.dataset.id];
      if (!g) return;
      if (window.AsuntoSinHitosFalta) AsuntoSinHitosFalta.enganchar(el, a, g, repintar);
      var casilla = el.querySelector('.ash-casilla');
      if (casilla && puede) casilla.onchange = function () {
        var hecha = casilla.checked;
        guardar(casilla, 'guardar la tarea', function () {
          return Hitos.marcarGuion(a.nombre, h.id, g.id, { hecho: hecha }).then(function () {
            return apuntar(a, g, hecha ? 'hecha' : 'sin hacer');
          });
        });
      };
      var comoBoton = el.querySelector('.ash-como-boton');
      if (comoBoton) comoBoton.onclick = function () { e(g.id).comoAbierto = !e(g.id).comoAbierto; repintar(); };
      var notasBoton = el.querySelector('.ash-notas-boton');
      if (notasBoton) notasBoton.onclick = function () { e(g.id).notasAbiertas = !e(g.id).notasAbiertas; repintar(); };
      var menu = el.querySelector('.ash-menu-boton');
      if (menu && window.FichaMenus) {
        var opciones = [
          { texto: 'Anotar', clase: 'ash-anotar-opcion', alPulsar: function () { e(g.id).anotando = true; e(g.id).editando = false; repintar(); } },
          { texto: 'Cambiar', clase: 'ash-cambiar-opcion', alPulsar: function () { e(g.id).editando = true; e(g.id).anotando = false; repintar(); } },
          { texto: 'Borrar', clase: 'ficha-menu-peligro ash-borrar-opcion', alPulsar: function () { guardar(menu, 'borrar la tarea', function () { return borrar(a, h, g); }); } }
        ];
        if (window.TareaEspera && !g.hecho && !g.espera) opciones.splice(2, 0, TareaEspera.opcionMenu(a, h, g, guardar, menu));   /* fila 702: «Esperando a…» */
        if (g.papel && window.TareaPapelPintar) TareaPapelPintar.opcionesMenu(a, h, g, guardar, menu).forEach(function (o, k) { opciones.splice(k, 0, o); });   /* fila 703 */
        FichaMenus.montar(menu, opciones);
      }
      if (window.TareaEspera && g.espera) TareaEspera.enganchar(el, a, h, g, guardar);   /* fila 702 */
      if (g.papel && window.TareaPapelPintar) TareaPapelPintar.enganchar(el, a, h, g, guardar);   /* fila 703: el botón del paso que toca */

      var editar = el.querySelector('.ash-editar-texto');
      if (editar) {
        var guardarTexto = function () {
          var texto = editar.value.trim();
          if (!texto) return;
          guardar(editar, 'cambiar la tarea', function () {
            return Hitos.cambiarGuionPropioTexto(a.nombre, h.id, g.id, texto).then(function () { delete estado[g.id]; });
          });
        };
        var bg = el.querySelector('.ash-editar-guardar');
        if (bg) bg.onclick = guardarTexto;
        var bc = el.querySelector('.ash-editar-cancelar');
        if (bc) bc.onclick = function () { e(g.id).editando = false; repintar(); };
        editar.onkeydown = function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); guardarTexto(); }
          else if (ev.key === 'Escape') { ev.preventDefault(); e(g.id).editando = false; repintar(); }
        };
      }
      var anotar = el.querySelector('.ash-anotar-texto');
      if (anotar) anotar.onkeydown = function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          ev.preventDefault();
          var texto = anotar.value.trim();
          if (!texto || !window.NotasHito) return;
          guardar(anotar, 'guardar la nota', function () {
            return NotasHito.anadirDesdeTarea(a, h, g, g.texto + ': ' + texto).then(function () {
              e(g.id).anotando = false; e(g.id).notasAbiertas = true;
            });
          });
        } else if (ev.key === 'Escape') { ev.preventDefault(); e(g.id).anotando = false; repintar(); }
      };
    });

    /* «+ Añadir tarea»: una línea, sin ventana. */
    var texto = caja.querySelector('.ash-anadir-texto');
    var boton = caja.querySelector('.ash-anadir-boton');
    if (texto && boton) {
      var anadir = function () {
        var v = texto.value.trim();
        if (!v) { texto.focus(); return; }
        var papel = caja.querySelector('.ash-anadir-papel');   /* fila 703: «Sin papel» o «Papel: <tipo>» */
        guardar(boton, 'añadir la tarea', function () {
          var puesta = papel && papel.value && window.TareaPapel ? TareaPapel.anadir(a, h, v, papel.value) : Hitos.anadirGuionPropio(a.nombre, h.id, v);
          return puesta.then(function () { texto.value = ''; });
        });
      };
      boton.onclick = anadir;
      texto.onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); anadir(); } };
    }

    /* «Cerrar el asunto», el mismo botón de la cabecera de la ficha (así hace lo mismo: avisos, guardado y salida). */
    var cerrar = caja.querySelector('.ash-cerrar');
    if (cerrar) cerrar.onclick = function () {
      var real = document.querySelector('#ficha-archivar button');
      if (real) real.click();
    };
  }

  /* Al cerrar un asunto de la lista con tareas sin hacer: avisa de cuántas quedan y deja seguir. Devuelve
     { sigue, hayAviso } como AvisosFalta.alArchivar; `hayAviso` evita repetir la pregunta de «Archivar». */
  async function avisoAlCerrar(a) {
    var datos = window.Hitos && Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    var entrada = datos && datos.porAsunto ? datos.porAsunto[a.nombre] : null;
    var h = entrada ? hitoDe(entrada.hitos) : null;
    if (!h) return { sigue: true, hayAviso: false };
    var c = Hitos.cuentaGuion(tareasDe(a, h));
    var faltan = c.total - c.hechos;
    if (faltan <= 0) return { sigue: true, hayAviso: false };
    var ok = await U.preguntar('Cerrar el asunto',
      '<p>' + (faltan === 1 ? 'Queda 1 tarea sin hacer.' : 'Quedan ' + faltan + ' tareas sin hacer.') + '</p><p class="nota">Puedes cerrarlo igualmente.</p>', 'Cerrar igualmente');
    return { sigue: !!ok, hayAviso: true };
  }

  /* Fila 701: «Cambiar la guía…» del menú «⋯» de la cabecera: avisa de que vale para todos los asuntos del tipo y abre el editor. */
  async function cambiarLaGuia(a) {
    var tipo = tipoDe(a);
    if (!tipo || !window.GuiasDelCentro) return;
    try { await GuiasDelCentro.escribir(tipo, { aviso: 'Vale para todos los asuntos de ' + tipo + ', no solo para este.' }); }
    catch (err) { U.fallo('No he podido abrir la guía', err); return; }
    if (window.HitosPanel) HitosPanel.programarRepintado(); else repintar();
  }

  /* «Cambiar la guía…» está en el menú desde el principio, escondido: se enseña si el asunto que se ve es una lista de tareas y está abierto. */
  function revelarMenu() {
    var it = document.querySelector('.ficha-nombre [data-clave="cambiar-guia"]');
    if (it) it.hidden = !(ultimo && ultimo.abierto && !soloLectura());
  }

  return { es: es, hitoDe: hitoDe, tipoSinHitos: tipoSinHitos, crear: crear, pintar: pintar, avisoAlCerrar: avisoAlCerrar,
           cambiarLaGuia: cambiarLaGuia, revelarMenu: revelarMenu, repintar: repintar };
})();
window.AsuntoSinHitos = AsuntoSinHitos;
