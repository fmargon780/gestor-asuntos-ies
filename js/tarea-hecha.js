/* ============================================================
   tarea-hecha.js — las tareas «con ventana»: sin casilla, con su botón (14-nov-2026, fila 671,
   docs/671-ACCIONES-QUE-HACEN-ALGO-1.md; tema 665; pantalla de prueba docs/pantallas/665.html).

   «Grabar o cambiar datos» (botón «Grabado»), «Entregar» («Entregado»), «Recoger» («Recogido») y «Comprobar» («Está bien» y
   «Falta algo») no llevan casilla (`Comunes.conVentana`). Cada botón abre una ventana de datos opcionales
   (js/tarea-hecha-ventana.js); al guardar, la tarea queda hecha, enseña debajo en verde lo apuntado, con la fecha y quién la
   marcó, y deja su línea en el Registro. «Falta algo» deja la tarea sin hacer, en rojo, con «Falta: …». «Deshacer» (menú ⋮)
   la vuelve a dejar sin hacer.

   Lo apuntado vive en la tarea del asunto: `guionHecho[id].hechoCon = { fecha, aQuien, nota, texto }` (`texto`, la línea verde
   ya compuesta) y `guionHecho[id].falta = { texto, quien, cuando }`. `Hitos.guionDe` los da como `hechoCon` y `faltaAlgo`.
   Aquí, el texto, los botones, la línea bajo la tarea, «Cómo se hace» y lo que se hace al pulsar; lo guarda
   js/hitos-guion-marcar.js. La fila 672 amplía `Comunes.ACCIONES_CON_VENTANA`.
   ============================================================ */
var TareaHecha = (function () {

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  /* El botón de cada acción (las tres primeras abren su ventana; «Comprobar» tiene dos). */
  var BOTON = { seneca: 'Grabado', entregar: 'Entregado', recoger: 'Recogido' };
  var VERBO = { seneca: 'Grabado', entregar: 'Entregado', recoger: 'Recogido' };

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }
  function quien() { return (window.Hitos && Hitos._guionInterno && Hitos._guionInterno.quien && Hitos._guionInterno.quien()) || (window.App && App.E && App.E.usuario) || ''; }

  function conVentana(g) { return !!g && !g.pregunta && !!window.Comunes && Comunes.conVentana(g.accion); }

  /* «2026-11-14» → «14-nov-2026». */
  function fechaLarga(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3 || !MESES[parseInt(p[1], 10) - 1]) return '';
    return parseInt(p[2], 10) + '-' + MESES[parseInt(p[1], 10) - 1] + '-' + p[0];
  }

  /* Lo que se ha hecho, sin la fecha ni quién: «Entregado a Dirección», «Grabado», «Comprobado: está bien». */
  function hechoDe(accion, d) {
    if (accion === 'comprobar') return 'Comprobado: está bien';
    var base = VERBO[accion] || 'Hecho';
    return base + (d && d.aQuien ? (accion === 'recoger' ? ' de ' : ' a ') + d.aQuien : '');
  }

  /* La línea verde: «✔ Entregado a Dirección · 14-nov-2026 · Francisco · nota». */
  function textoDe(accion, d, por) {
    var partes = [hechoDe(accion, d), fechaLarga(d && d.fecha), por];
    if (d && d.nota) partes.push(d.nota);
    return '✔ ' + partes.filter(Boolean).join(' · ');
  }

  /* La línea del Registro. */
  function registroDe(g, d) {
    return 'Tarea hecha: ' + g.texto + ' — ' + hechoDe(g.accion, d) + (d && d.fecha ? ' (' + fechaLarga(d.fecha) + ')' : '') + (d && d.nota ? '. ' + d.nota : '');
  }

  function apuntarRegistro(a, h, texto) {
    if (!window.RegistroAsunto) return Promise.resolve();
    return RegistroAsunto.auto(a, texto, h);
  }

  /* ---------- lo que se pinta ---------- */

  /* Los botones de una tarea pendiente (o con «Falta algo»); '' si no es de las de ventana, o ya está hecha. */
  function botonesHTML(g, siguiente) {
    if (!conVentana(g) || g.hecho || g.noaplica) return '';
    var consulta = window.SoloConsulta && SoloConsulta.activo();
    var apagado = consulta ? ' disabled data-motivo-clave="consulta"' : '';
    function boton(que, texto, principal) {
      return '<button type="button" class="boton boton-chico guion-hecha-boton' + (principal ? ' boton-principal' : '') + '" data-hecha="' + que + '"' + apagado + '>' + texto + '</button>';
    }
    if (g.accion === 'comprobar') return boton('esta-bien', 'Está bien', !!siguiente) + boton('falta', 'Falta algo', false);
    return boton(g.accion, BOTON[g.accion] || 'Hecho', !!siguiente);
  }

  /* Debajo de la tarea: lo apuntado en verde (hecha) o «Falta: …» en rojo (Comprobar sin cerrar). */
  function lineaHTML(g) {
    if (!conVentana(g)) return '';
    if (g.hecho && g.hechoCon && g.hechoCon.texto) return '<div class="guion-hecha-linea">' + esc(g.hechoCon.texto) + '</div>';
    if (!g.hecho && !g.noaplica && g.faltaAlgo) {
      var f = g.faltaAlgo;
      var cola = [fechaLarga(f.cuando), f.quien].filter(Boolean).join(' · ');
      return '<div class="guion-falta-linea">Falta: ' + esc(f.texto || 'algo') + (cola ? ' · ' + esc(cola) : '') + '</div>';
    }
    return '';
  }

  /* «▸ Cómo se hace» plegado, con los pasos numerados; sin pasos, no sale (en cualquier tarea). */
  function comoHTML(g) {
    var pasos = String((g && g.como) || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (!pasos.length || (g && g.pregunta)) return '';
    return '<details class="guion-como"><summary>Cómo se hace</summary><ol>' + pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol></details>';
  }

  /* ---------- lo que se hace al pulsar ---------- */

  /* Lo que se pide al pulsar `que` ('esta-bien', 'falta' o la acción): { fecha, aQuien, nota } o { texto } (falta); null si se cancela. */
  async function pedir(a, h, g, que) {
    var hoy = (window.U && U.hoyIso && U.hoyIso()) || '';
    if (que === 'esta-bien') return { fecha: hoy };
    if (!window.TareaHechaVentana) return { fecha: hoy };
    return TareaHechaVentana.abrir(a, h, g, que === 'falta' ? 'falta' : 'hecha');
  }

  /* Guarda lo pedido y lo apunta en el Registro. */
  async function aplicar(a, h, g, que, r) {
    if (que === 'falta') {
      var texto = String((r && r.texto) || '').trim();
      var guardada = await Hitos.apuntarFalta(a.nombre, h.id, g.id, { texto: texto });
      await apuntarRegistro(a, h, 'Tarea «' + g.texto + '»: falta' + (texto ? ': ' + texto : ' algo'));
      return guardada;
    }
    var d = { fecha: (r && r.fecha) || '', aQuien: (r && r.aQuien) || '', nota: String((r && r.nota) || '').trim() };
    var hechoCon = { fecha: d.fecha, aQuien: d.aQuien, nota: d.nota, texto: textoDe(g.accion, d, quien()) };
    var h2 = await Hitos.marcarConDatos(a.nombre, h.id, g.id, hechoCon);
    await apuntarRegistro(a, h, registroDe(g, d));
    return h2;
  }

  /* «Deshacer» (menú ⋮): la tarea vuelve a estar sin hacer. */
  async function deshacer(a, h, g) {
    var h2 = await Hitos.deshacerGuion(a.nombre, h.id, g.id);
    await apuntarRegistro(a, h, 'Tarea «' + g.texto + '»: deshecha, vuelve a estar sin hacer');
    return h2;
  }

  return { conVentana: conVentana, fechaLarga: fechaLarga, textoDe: textoDe, hechoDe: hechoDe, botonesHTML: botonesHTML, lineaHTML: lineaHTML,
           comoHTML: comoHTML, pedir: pedir, aplicar: aplicar, deshacer: deshacer };
})();
window.TareaHecha = TareaHecha;
