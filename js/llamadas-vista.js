/* ============================================================
   llamadas-vista.js — los botones y las listas de las llamadas (13-nov-2026, fila 639,
   docs/639-LLAMAR-POR-TELEFONO.md; pantalla de prueba docs/pantallas/565.html).

   - El botón del teléfono (icono de un solo color, sin texto; «Apuntar llamada» al pasar el ratón): en cada tarea «Llamar por
     teléfono» (también con la tarea hecha) y en la cabecera del asunto, a la derecha, antes de «Ruta». Los dos abren la
     ventana de js/llamadas-ventana.js; la app no marca el número.
   - Bajo cada tarea con llamadas, una línea plegada «3 llamadas · 1 con respuesta»; al pulsarla salen las llamadas, la más
     reciente arriba. Una tarea de llamar sin llamadas dice «Sin llamadas todavía».
   - En cada llamada (bajo la tarea y en el Registro) un «⋮» con «Corregir» y la marca «corregida».
   Un solo oyente en el documento atiende todos los botones (se repintan con innerHTML).
   ============================================================ */
(function () {
  if (typeof window.Llamadas === 'undefined') return;

  var ICONO = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="display:block">' +
    '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>';
  var abiertas = {};   /* «idHito|idTarea» -> true: la lista de llamadas está desplegada (solo la vista) */

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }
  function consulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function atributosConsulta() { return consulta() ? ' disabled data-motivo-clave="consulta"' : ''; }

  /* El botón de una tarea de llamar. */
  Llamadas.botonTareaHTML = function (g, siguiente) {
    return '<button type="button" class="boton boton-chico guion-accion-tarea ll-boton' + (siguiente && !g.hecho ? ' boton-principal' : '') + '" data-accion="llamar"' +
      ' title="Apuntar llamada" aria-label="Apuntar llamada"' + atributosConsulta() + '>' + ICONO + '</button>';
  };

  /* El botón de la cabecera del asunto (se ve siempre). */
  Llamadas.botonCabecera = function () {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ll-boton ll-boton-cabecera';
    b.title = 'Apuntar llamada';
    b.setAttribute('aria-label', 'Apuntar llamada');
    b.innerHTML = ICONO;
    if (consulta()) { b.disabled = true; b.setAttribute('data-motivo-clave', 'consulta'); }
    return b;
  };

  /* «⋮ → Corregir» y la marca «corregida» de una línea de llamada del registro (o de la lista bajo la tarea). */
  Llamadas.marcasHTML = function (llamada) {
    if (!llamada) return '';
    return (llamada.corregida ? '<span class="ll-corregida" title="Corregida el ' + esc(Llamadas.legible(llamada.corregida.cuando)) + ' por ' + esc(llamada.corregida.quien || '') + '">corregida</span>' : '') +
      '<span class="registro-menu"><button type="button" class="registro-mas" aria-label="Más acciones de la llamada"' + atributosConsulta() + '>⋮</button>' +
      '<span class="registro-acciones oculto"><button type="button" class="boton llamada-corregir" data-llamada="' + esc(llamada.id) + '">Corregir</button></span></span>';
  };

  /* Lo que va debajo de una tarea: la lista plegada de sus llamadas, o «Sin llamadas todavía» si es de llamar. */
  Llamadas.debajoHTML = function (g, h) {
    if (!g || g.pregunta) return '';
    var lista = Llamadas.deTarea(h, g.id);
    if (!lista.length) return g.accion === 'llamar' ? '<div class="ll-lista"><span class="ll-cuenta">Sin llamadas todavía</span></div>' : '';
    return '<details class="ll-lista" data-clave="' + esc(h.id + '|' + g.id) + '"' + (abiertas[h.id + '|' + g.id] ? ' open' : '') + '>' +
      '<summary class="ll-cuenta">' + esc(Llamadas.cuenta(lista)) + '</summary>' + lista.map(function (n) {
        var l = n.llamada;
        return '<div class="ll-linea" data-llamada="' + esc(l.id) + '"><div class="ll-linea-cab"><small>' + esc(Llamadas.legible(n.cuando)) + ' · ' + esc(n.quien || '') + '</small> · ' +
          (l.sentido === 'recibida' ? 'Recibida de ' : 'A ') + esc(l.con) + ' · ' +
          (l.resultado === 'si' ? '<span class="ll-si">Hablado</span>' : '<span class="ll-no">No contesta</span>') + Llamadas.marcasHTML(l) + '</div>' +
          (l.comentario ? '<div class="ll-comentario">' + esc(l.comentario) + '</div>' : '') + '</div>';
      }).join('') + '</details>';
  };

  /* Recuerda qué listas están desplegadas (para que un repintado no las pliegue). */
  Llamadas.enganchar = function (caja) {
    Array.prototype.forEach.call(caja.querySelectorAll('details.ll-lista'), function (d) {
      d.ontoggle = function () { if (d.open) abiertas[d.dataset.clave] = true; else delete abiertas[d.dataset.clave]; };
    });
  };

  /* ---------- apuntar y corregir ---------- */

  async function apuntarDe(a, o) {
    var res = await Llamadas.abrir(a, o);
    if (!res) return;
    try {
      var tarea = res.tarea;
      await Llamadas.apuntar(a, res.r, tarea);
      var marcada = false;
      try { marcada = await Llamadas.marcarSiHablado(a, tarea, res.r.resultado); }
      catch (e1) { U.accesorio('Llamada apuntada, pero no he podido marcar la tarea', e1); }
      U.aviso(Llamadas.avisoDe(tarea, marcada, !tarea || o.tarea || tarea.delActual), 'bueno');
    } catch (e) { U.fallo('No he podido apuntar la llamada', e); }
    Llamadas.repintar(a);
  }

  Llamadas.abrirDeTarea = function (a, h, g) { return apuntarDe(a, { tarea: { h: h, g: g } }); };
  Llamadas.abrirDeCabecera = function (a) { return apuntarDe(a, { cabecera: true }); };

  async function corregirPorId(a, id) {
    var enc = await Llamadas.buscar(a, id);
    if (!enc) { U.aviso('Esa llamada ya no está.', 'ambar'); return; }
    var res = await Llamadas.abrir(a, { corregir: { llamada: enc.nota.llamada, cuando: enc.nota.cuando } });
    if (!res) return;
    try {
      var r = await Llamadas.corregir(a, enc, res.r);
      if (!r.cambio) U.aviso('No has cambiado nada.', 'ambar');
      else U.aviso(r.marcada ? 'Llamada corregida. La tarea queda hecha.' : 'Llamada corregida: el registro guarda lo que había antes.', 'bueno');
    } catch (e) { U.fallo('No he podido corregir la llamada', e); }
    Llamadas.repintar(a);
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    var cab = t.closest('.ll-boton-cabecera:not([disabled])');
    var corregir = t.closest('.llamada-corregir');
    var a = window.FichaNucleo && FichaNucleo.actual;
    if (cab && a) { ev.preventDefault(); Llamadas.abrirDeCabecera(a); }
    else if (corregir && a) { ev.preventDefault(); corregirPorId(a, corregir.dataset.llamada); }
  });
})();
