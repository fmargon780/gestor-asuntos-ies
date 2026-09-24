/* ============================================================
   guias-mapa.js — el mapa de la guía (24-sep-2026, fila 113,
   docs/MAPA-DE-LA-GUIA.md). Un dibujo de solo lectura, como un
   diagrama de flujo: los pasos de arriba abajo; en cada pregunta, las
   ramas una al lado de otra, con la respuesta encima, a cualquier
   profundidad; y después, los pasos comunes. Solo HTML y CSS
   (css/guias-mapa.css), sin librerías: vale también sin internet.

   - `GuiasMapa.html(pasos, op)`: pura. `op` (opcional):
       hitos        los hitos del asunto: resalta el camino elegido, pone
                    el estado de cada hito y deja en gris las ramas no
                    elegidas y las preguntas sin responder; los hitos que
                    no son de la guía salen al final, «Fuera de la guía».
       responsable  function (id) -> nombre, para la línea pequeña.
     Cada caja pulsable lleva `.mapa-pulsable` y `data-id` (el del paso,
     que es también el del hito).
   - `GuiasMapa.abrirEnAjustes(nombreTipo, pasos, alPulsar)`: en un
     cuadro grande (Ajustes → tipo → «Pasos del trámite»).
   - `GuiasMapa.panelHTML()` / `GuiasMapa.pintarEnPanel(panel, pasos,
     alPulsar)`: dentro del cuadro de escribir la guía (js/guias.js).
   - `GuiasMapa.abrirDeAsunto(a)`: en la ficha, con los hitos del asunto
     (botón en la cabecera del bloque de hitos, js/hitos-panel.js).
   ============================================================ */
var GuiasMapa = (function () {
  function esc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var ESTADOS = { pendiente: 'Pendiente', encurso: 'En curso', hecho: 'Hecho', noaplica: 'No aplica' };

  /* Todos los hitos del asunto por id, a cualquier profundidad. */
  function porId(hitos) {
    var m = {};
    (function recorrer(l) {
      (l || []).forEach(function (h) {
        if (h && h.id) m[h.id] = h;
        (h && h.opciones || []).forEach(function (o) { recorrer(o.hitos); });
      });
    })(hitos);
    return m;
  }

  function idsDeLaGuia(pasos) {
    var ids = {};
    (function recorrer(l) {
      (l || []).forEach(function (p) {
        ids[p.id] = true;
        (p.opciones || []).forEach(function (o) { recorrer(o.pasos); });
      });
    })(pasos);
    return ids;
  }

  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }

  function lineaPequena(p, op) {
    var trozos = [];
    if (p.responsable) trozos.push((op.responsable && op.responsable(p.responsable)) || 'con responsable');
    if (p.plazo && p.plazo.dias) trozos.push(typeof Plazos !== 'undefined' && Plazos.textoPlazo ? Plazos.textoPlazo(p.plazo) : p.plazo.dias + ' días');   /* fila 131: «10 días hábiles» */
    return trozos.length ? '<span class="mapa-meta">' + esc(trozos.join(' · ')) + '</span>' : '';
  }

  /* `enCamino`: con hitos, si esta lista está en el camino elegido. */
  function columna(lista, op, enCamino) {
    return '<div class="mapa-columna">' + (lista || []).map(function (p) {
      return nodo(p, op, enCamino);
    }).join('') + '</div>';
  }

  function nodo(p, op, enCamino) {
    var conHitos = !!op.hitosPorId;
    var h = conHitos ? op.hitosPorId[p.id] : null;
    var pregunta = esPregunta(p);
    var clases = ['mapa-caja'];
    if (pregunta) clases.push('mapa-pregunta');
    if (p.soloInformativo) clases.push('mapa-informativo');
    var pulsable = !conHitos || (enCamino && h);
    if (conHitos && !(enCamino && h)) clases.push('mapa-gris');
    if (conHitos && enCamino && h) clases.push('mapa-en-camino', 'mapa-estado-' + h.estado);
    if (pulsable) clases.push('mapa-pulsable');
    var estado = (conHitos && enCamino && h && !pregunta) ? '<span class="mapa-estado">' + esc(ESTADOS[h.estado] || h.estado) + '</span>' : '';
    var caja = '<div class="' + clases.join(' ') + '" data-id="' + esc(p.id) + '"' +
      (pulsable ? ' role="button" tabindex="0"' : '') + ' title="' + esc(p.titulo || '') + '">' +
      (pregunta ? '<span class="mapa-marca">pregunta</span>' : '') +
      '<span class="mapa-titulo">' + esc(p.titulo || (pregunta ? 'Pregunta sin título' : 'Paso sin título')) +
        /* Fila 116: el guion de este paso tiene una pregunta (el mapa no dibuja el guion). */
        ((p.guion || []).some(function (g) { return g && g.pregunta; })
          ? ' <span class="mapa-guion-pregunta" title="El guion tiene una pregunta">¿</span>' : '') + '</span>' +
      lineaPequena(p, op) + estado + '</div>';
    if (!pregunta) return '<div class="mapa-nodo">' + caja + '</div>';
    var elegida = h && h.elegida;
    var ramas = p.opciones.map(function (o) {
      var enEsta = conHitos ? (enCamino && !!h && elegida === o.id) : true;
      return '<div class="mapa-rama' + (conHitos && !enEsta ? ' mapa-rama-gris' : '') + (conHitos && enEsta ? ' mapa-rama-elegida' : '') + '">' +
        '<div class="mapa-respuesta">' + esc(o.titulo || 'Opción sin nombre') + '</div>' +
        (o.pasos && o.pasos.length ? columna(o.pasos, op, enEsta) : '<div class="mapa-columna"><div class="mapa-nodo"><div class="mapa-vacio">sin pasos</div></div></div>') +
      '</div>';
    }).join('');
    return '<div class="mapa-nodo mapa-nodo-pregunta">' + caja + '<div class="mapa-ramas">' + ramas + '</div></div>';
  }

  function html(pasos, op) {
    op = op || {};
    var conHitos = Array.isArray(op.hitos);
    var o2 = { responsable: op.responsable, hitosPorId: conHitos ? porId(op.hitos) : null };
    if (!pasos || !pasos.length) {
      if (!conHitos || !op.hitos.length) return '<div class="mapa"><div class="vacio">Esta guía todavía no tiene pasos.</div></div>';
    }
    var salida = '<div class="mapa' + (conHitos ? ' mapa-de-asunto' : '') + '"><div class="mapa-lienzo">' +
      columna(pasos, o2, true) + '</div>';
    if (conHitos) {
      var ids = idsDeLaGuia(pasos);
      var fuera = [];
      (function recorrer(l) {
        (l || []).forEach(function (h) {
          if (h.delTipoAnterior || !ids[h.id]) fuera.push(h);
          else (h.opciones || []).forEach(function (o) { recorrer(o.hitos); });
        });
      })(op.hitos);
      if (fuera.length) {
        salida += '<div class="mapa-fuera"><div class="mapa-fuera-titulo">Fuera de la guía</div><div class="mapa-fuera-fila">' +
          fuera.map(function (h) {
            return '<div class="mapa-caja mapa-en-camino mapa-pulsable mapa-estado-' + esc(h.estado) + '" data-id="' + esc(h.id) +
              '" role="button" tabindex="0" title="' + esc(h.titulo || '') + '"><span class="mapa-titulo">' + esc(h.titulo || 'Hito sin título') +
              '</span><span class="mapa-estado">' + esc(ESTADOS[h.estado] || h.estado) + '</span></div>';
          }).join('') + '</div></div>';
      }
    }
    return salida + '</div>';
  }

  /* Pulsar (o Intro) en una caja pulsable -> alPulsar(id). */
  function enganchar(raiz, alPulsar) {
    if (!raiz) return;
    raiz.addEventListener('click', function (ev) {
      var c = ev.target.closest && ev.target.closest('.mapa-pulsable');
      if (c && raiz.contains(c)) alPulsar(c.dataset.id);
    });
    raiz.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var c = ev.target.closest && ev.target.closest('.mapa-pulsable');
      if (c) { ev.preventDefault(); alPulsar(c.dataset.id); }
    });
  }

  /* Los nombres de los responsables (Ajustes › Hitos y los papeles). */
  var responsables = null;
  async function cargarResponsables() {
    try { var d = await Hitos.leer(); responsables = d.ajustes.responsables.concat(Hitos.PAPELES || []); }
    catch (e) { responsables = responsables || []; }
  }
  function nombreDeResponsable(id) {
    var r = (responsables || []).filter(function (x) { return x.id === id; })[0];
    return r ? r.nombre : '';
  }

  /* ---------- en Ajustes: un cuadro grande ---------- */
  async function abrirEnAjustes(nombreTipo, pasos, alPulsar) {
    await cargarResponsables();
    var elegido = null;
    var promesa = U.preguntar('Mapa de la guía de ' + nombreTipo,
      '<p class="explica">La guía entera de un vistazo. Pulsa un paso para escribirlo.</p>' +
      '<div id="mapa-cuadro">' + html(pasos, { responsable: nombreDeResponsable }) + '</div>', 'Cerrar', true);
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-ancho');
    enganchar(document.getElementById('mapa-cuadro'), function (id) {
      elegido = id;
      var b = document.getElementById('cuadro-cancelar') || document.getElementById('cuadro-aceptar');
      if (b) b.click();
    });
    await promesa;
    if (cuadro) cuadro.classList.remove('cuadro-ancho');
    if (elegido && alPulsar) alPulsar(elegido);
  }

  /* ---------- dentro del cuadro de escribir la guía ---------- */
  function panelHTML() {
    return '<div id="guia-mapa-panel" class="guia-mapa-panel oculto">' +
      '<div class="guia-mapa-panel-cabecera"><strong>Mapa de la guía</strong>' +
      '<button type="button" class="boton" id="guia-mapa-cerrar">Cerrar el mapa</button></div>' +
      '<div class="guia-mapa-panel-cuerpo"></div></div>';
  }

  async function pintarEnPanel(panel, pasos, alPulsar) {
    if (!panel) return;
    if (!responsables) await cargarResponsables();
    var cuerpo = panel.querySelector('.guia-mapa-panel-cuerpo');
    cuerpo.innerHTML = html(pasos, { responsable: nombreDeResponsable });
    if (!panel.dataset.enganchado) {
      panel.dataset.enganchado = '1';
      enganchar(cuerpo, function (id) { panel.classList.add('oculto'); alPulsar(id); });
      panel.querySelector('#guia-mapa-cerrar').onclick = function () { panel.classList.add('oculto'); };
    }
    panel.classList.remove('oculto');
    if (panel.scrollIntoView) panel.scrollIntoView({ block: 'start' });
  }

  /* ---------- en la ficha de un asunto ---------- */
  async function abrirDeAsunto(a) {
    if (!a) return;
    var tipo = (a.ficha && a.ficha.tipo) || (a.leido && a.leido.tipo) || '';
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo)) || [];
    await cargarResponsables();
    var hitos = [];
    try { var d = await Hitos.leer(); hitos = (d.porAsunto[a.nombre] || {}).hitos || []; } catch (e) { hitos = []; }
    var elegido = null;
    var promesa = U.preguntar('Mapa de la guía' + (tipo ? ' de ' + tipo : ''),
      '<p class="explica">El camino de este asunto, resaltado; lo que no toca, en gris. Pulsa un hito para abrirlo.</p>' +
      '<div id="mapa-cuadro">' + html(pasos, { hitos: hitos, responsable: nombreDeResponsable }) + '</div>', 'Cerrar', true);
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-ancho');
    enganchar(document.getElementById('mapa-cuadro'), function (id) {
      elegido = id;
      var b = document.getElementById('cuadro-cancelar') || document.getElementById('cuadro-aceptar');
      if (b) b.click();
    });
    await promesa;
    if (cuadro) cuadro.classList.remove('cuadro-ancho');
    if (elegido && window.HitoMesa) {
      if (window.FichaTarjetas && FichaTarjetas.abierta() !== 'hitos') FichaTarjetas.abrir('hitos');
      HitoMesa.abrir(a, elegido);
    }
  }

  return { html: html, enganchar: enganchar, abrirEnAjustes: abrirEnAjustes, panelHTML: panelHTML,
           pintarEnPanel: pintarEnPanel, abrirDeAsunto: abrirDeAsunto };
})();
window.GuiasMapa = GuiasMapa;
