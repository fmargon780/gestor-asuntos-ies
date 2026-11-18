/* ============================================================
   tarea-espera.js — la espera es de la tarea, con su día para volver a mirar
   (18-nov-2026, fila 702, docs/702-ESPERA-EN-LA-TAREA.md; pantalla de prueba docs/pantallas/692.html;
   diseño en docs/notas-diseno/692.md).

   Solo para un asunto «lista de tareas» (js/asunto-sin-hitos.js). Una tarea está por hacer, esperando o hecha.
   La espera no es una tarea aparte: es un estado de la tarea nuestra que la provoca, y se guarda en ella:
   `guionHecho[<id>].espera = { quien, desde, volver }` (`quien`: el id de la lista de «A quién esperamos»;
   `desde` y `volver`: días AAAA-MM-DD).

   - «Esperando a…» (⋮ de la tarea): ventana pequeña con «A quién esperamos» y «Qué día volver a mirarlo»
     (nace vacío y es obligatorio).
   - Bajo la tarea: «Esperando a X desde el … · volver a mirarlo el …» con «Ya ha llegado» (la tarea queda
     hecha), «Cambiar el día» y «Dejar de esperar». Al llegar el día: «Se espera a X desde el …. Tocaba volver
     a mirarlo el ….», y «Cambiar el día» pasa a «Seguir esperando…».
   - El estado del asunto lo calcula `Hitos.aQuienLeToca` (js/hitos-a-quien.js) con `TareaEspera.estadoDe`.
   - Aviso de Inicio «N esperas por reclamar» (`avisar`), en la línea de avisos (js/avisos-linea.js).
   «Hoy» se mira al pintar; no hay ninguna tarea de fondo.
   ============================================================ */
var TareaEspera = (function () {

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  /* '2026-11-18…' → '18-nov'. */
  function diaCorto(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3 || !MESES[parseInt(p[1], 10) - 1]) return '';
    return parseInt(p[2], 10) + '-' + MESES[parseInt(p[1], 10) - 1];
  }

  function hoy() { return U.hoyIso(); }

  /* Función pura. ¿Ha llegado el día de volver a mirarla? Hoy o antes. */
  function vencida(espera, hoyIso) {
    return !!(espera && espera.volver && String(espera.volver).slice(0, 10) <= (hoyIso || hoy()));
  }

  /* Función pura. Lo que `Hitos.aQuienLeToca` da para una tarea con espera (js/hitos-a-quien.js): con la espera viva, el
     lado de terceros y `esperando`; con el día llegado, el lado de Administración y `reclamar`. `nombre`: cómo se llama
     quien se espera. */
  function estadoDe(espera, nombre, hoyIso) {
    var e = { a: espera.quien, nombre: nombre, desde: espera.desde || '', volver: espera.volver || '', motivo: '' };
    return vencida(espera, hoyIso) ? { reclamar: e } : { esperando: e };
  }

  /* ---------- el texto ---------- */

  function textoEstado(r) {
    if (r.reclamar) return 'Reclamar a ' + r.reclamar.nombre + (diaCorto(r.reclamar.desde) ? ' · espera desde el ' + diaCorto(r.reclamar.desde) : '');
    return 'Esperando a ' + r.esperando.nombre + (diaCorto(r.esperando.volver) ? ' · hasta el ' + diaCorto(r.esperando.volver) : '');
  }

  function nombreDe(quien, ajustes) {
    return (window.Hitos && Hitos.nombreDeEspera) ? Hitos.nombreDeEspera(quien, ajustes) : quien;
  }
  /* Fila 704: la espera de una firma (`paso: 'firmado'`) lleva el nombre de quien firma escrito en ella. */
  function nombreDeEspera(es, ajustes) { return (es && es.paso === 'firmado' && es.nombre) ? es.nombre : nombreDe(es && es.quien, ajustes); }

  function ajustesDe() {
    var d = window.Hitos && Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    return d ? d.ajustes : null;
  }

  /* ---------- bajo la tarea ---------- */

  function debajoHTML(g, abierto) {
    var es = g.espera;
    if (!es || g.hecho) return '';
    var nombre = esc(nombreDeEspera(es, ajustesDe()));
    var firma = es.paso === 'firmado';   /* fila 704: a la firma; sin «Ya ha llegado»: llega con el PDF firmado o con «Marcar el paso a mano» */
    var texto = firma ? (vencida(es)
      ? 'A la firma de ' + nombre + (diaCorto(es.desde) ? ' desde el ' + diaCorto(es.desde) : '') + '. Tocaba volver a mirarlo el ' + esc(diaCorto(es.volver)) + '.'
      : 'A la firma de ' + nombre + (diaCorto(es.desde) ? ' desde el ' + diaCorto(es.desde) : '') + ' · volver a mirarlo el ' + esc(diaCorto(es.volver)))
      : vencida(es)
      ? 'Se espera a ' + nombre + (diaCorto(es.desde) ? ' desde el ' + diaCorto(es.desde) : '') + '. Tocaba volver a mirarlo el ' + esc(diaCorto(es.volver)) + '.'
      : 'Esperando a ' + nombre + (diaCorto(es.desde) ? ' desde el ' + diaCorto(es.desde) : '') + ' · volver a mirarlo el ' + esc(diaCorto(es.volver));
    return '<div class="ash-espera' + (vencida(es) ? ' vencida' : '') + '"><span class="ash-espera-texto">' + texto + '</span>' +
      (abierto ? '<span class="ash-espera-botones">' + (firma ? '' : '<button type="button" class="boton boton-chico ash-espera-llegado">Ya ha llegado</button>') +
        '<button type="button" class="boton boton-chico ash-espera-dia">' + (vencida(es) ? 'Seguir esperando…' : 'Cambiar el día') + '</button>' +
        '<button type="button" class="enlace ash-espera-dejar">Dejar de esperar</button></span>' : '') + '</div>';
  }

  /* ---------- la ventana pequeña ---------- */

  /* `soloDia`: solo pide el día (para «Cambiar el día» y «Seguir esperando…»). Promesa de { quien, volver } o null. */
  function abrirVentana(a, g, soloDia) {
    var ajustes = ajustesDe();
    var lista = window.EstadoHito ? EstadoHito.aQuienSePuedeEsperar(ajustes) : [{ id: 'tercero', nombre: 'Tercero' }];
    var categoria = (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || '';
    var defecto = categoria === 'ALUMNADO' ? 'tutor' : 'tercero';
    return new Promise(function (resolver) {
      var previo = document.activeElement;
      var capa = document.createElement('div');
      capa.className = 'capa th-capa';
      capa.innerHTML = '<div class="cuadro th-cuadro" role="dialog" aria-modal="true" aria-labelledby="te-titulo">' +
        '<h3 id="te-titulo">' + (soloDia ? 'Qué día volver a mirarlo' : 'Esperando a…') + ' · ' + esc(g.texto) + '</h3><div class="th-cuerpo">' +
        (soloDia ? '' : '<label class="th-rotulo" for="te-quien">A quién esperamos</label><select class="campo" id="te-quien">' +
          lista.map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === defecto ? ' selected' : '') + '>' + esc(r.nombre) + '</option>'; }).join('') + '</select>') +
        '<label class="th-rotulo" for="te-dia">Qué día volver a mirarlo</label><input type="date" class="campo" id="te-dia" data-clave="te-dia">' +
        '<p class="nota te-aviso oculto" id="te-aviso">Elige el día en que volver a mirarlo.</p>' +
        '</div><div class="cuadro-botones"><button type="button" class="boton" id="te-no">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="te-ok">' + (soloDia ? 'Guardar' : 'Poner en espera') + '</button></div></div>';
      document.body.appendChild(capa);
      function $(id) { return capa.querySelector('#' + id); }
      var cerrado = false;
      function cerrar(valor) {
        if (cerrado) return;
        cerrado = true;
        document.removeEventListener('keydown', alTeclear, true);
        if (capa.parentNode) capa.parentNode.removeChild(capa);
        try { if (previo && previo.focus && document.contains(previo)) previo.focus(); } catch (e) { /* sin foco que devolver */ }
        resolver(valor);
      }
      function alTeclear(ev) {
        if (ev.key !== 'Escape') return;
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        cerrar(null);
      }
      document.addEventListener('keydown', alTeclear, true);
      function aceptar() {
        var dia = $('te-dia').value;
        if (!dia) { $('te-aviso').classList.remove('oculto'); $('te-dia').focus(); return; }   /* el día es obligatorio */
        cerrar({ quien: soloDia ? ((g.espera && g.espera.quien) || '') : $('te-quien').value, volver: dia });
      }
      capa.addEventListener('click', function (ev) {
        var b = ev.target.closest('button');
        if (!b) return;
        if (b.id === 'te-no') cerrar(null);
        else if (b.id === 'te-ok') aceptar();
      });
      ($('te-quien') || $('te-dia')).focus();
    });
  }

  /* ---------- guardar ---------- */

  function editar(a, h, g, mutador) {
    return Hitos._guionInterno.editarHito(a.nombre, h.id, function (hito) {
      hito.guionHecho = hito.guionHecho || {};
      var e = hito.guionHecho[g.id] || {};
      mutador(e);
      hito.guionHecho[g.id] = e;
    });
  }

  /* Apunta en el Registro y pone al día el aviso de Inicio (que si no esperaría a la siguiente vuelta). */
  async function apuntar(a, texto) {
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, texto);
    await avisar();
  }

  /* «Esperando a…»: pone la espera y repinta. `hacer` es el guardado con aviso de fallo (js/asunto-sin-hitos.js). */
  async function poner(a, h, g, datos) {
    await editar(a, h, g, function (e) { e.espera = { quien: datos.quien, desde: hoy(), volver: datos.volver }; });
    await apuntar(a, 'Tarea en espera de ' + nombreDe(datos.quien, ajustesDe()) + ' hasta el ' + diaCorto(datos.volver) + ': ' + g.texto);
  }

  async function cambiarDia(a, h, g, volver) {
    await editar(a, h, g, function (e) { if (e.espera) e.espera.volver = volver; });
    await apuntar(a, 'Tarea: nuevo día para volver a mirar (' + diaCorto(volver) + '): ' + g.texto);
  }

  async function dejarDeEsperar(a, h, g) {
    await editar(a, h, g, function (e) { delete e.espera; });
    await apuntar(a, 'Tarea: dejamos de esperar: ' + g.texto);
  }

  async function yaHaLlegado(a, h, g) {
    await Hitos.marcarGuion(a.nombre, h.id, g.id, { hecho: true });   /* marcarla hecha le quita la espera */
    await apuntar(a, 'Tarea hecha (ha llegado lo esperado): ' + g.texto);
  }

  /* Engancha los botones de la tarea pintada. `guardar(control, queNo, hacer)`: el guardado con aviso y repintado de la lista. */
  function enganchar(el, a, h, g, guardar) {
    var llegado = el.querySelector('.ash-espera-llegado');
    if (llegado) llegado.onclick = function () { guardar(llegado, 'marcar la tarea', function () { return yaHaLlegado(a, h, g); }); };
    var dia = el.querySelector('.ash-espera-dia');
    if (dia) dia.onclick = async function () {
      var r = await abrirVentana(a, g, true);
      if (r) guardar(dia, 'cambiar el día', function () { return cambiarDia(a, h, g, r.volver); });
    };
    var dejar = el.querySelector('.ash-espera-dejar');
    if (dejar) dejar.onclick = function () { guardar(dejar, 'dejar de esperar', function () { return dejarDeEsperar(a, h, g); }); };
  }

  /* La opción «Esperando a…» del ⋮ de una tarea sin hacer. */
  function opcionMenu(a, h, g, guardar, boton) {
    return { texto: 'Esperando a…', clase: 'ash-esperando-opcion', alPulsar: async function () {
      var r = await abrirVentana(a, g, false);
      if (r) guardar(boton, 'poner la tarea en espera', function () { return poner(a, h, g, r); });
    } };
  }

  /* ---------- el panel ---------- */

  /* El texto del panel para la primera tarea sin hacer, si espera: { titulo, sub, clase }; o null. */
  function panelDe(g) {
    var es = g && g.espera;
    if (!es) return null;
    var nombre = nombreDeEspera(es, ajustesDe());
    if (es.paso === 'firmado') {   /* fila 704 */
      if (vencida(es)) return { clase: 'ash-vuelve', titulo: 'Toca volver a mirar la firma: ' + g.texto, sub: 'Se espera la firma de ' + nombre + (diaCorto(es.desde) ? ' desde el ' + diaCorto(es.desde) : '') + '.' };
      return { clase: 'ash-espera-panel', titulo: 'A la firma de ' + nombre + ' · volver a mirarlo el ' + diaCorto(es.volver), sub: 'Le toca a ' + nombre + '.' };
    }
    if (vencida(es)) return { clase: 'ash-vuelve', titulo: 'Toca volver a mirarlo: ' + g.texto, sub: 'Se espera a ' + nombre + (diaCorto(es.desde) ? ' desde el ' + diaCorto(es.desde) : '') + '.' };
    return { clase: 'ash-espera-panel', titulo: 'Esperando a ' + nombre + ' · volver a mirarlo el ' + diaCorto(es.volver), sub: 'Le toca a ' + nombre + '.' };
  }

  /* ---------- el aviso de Inicio ---------- */

  async function avisar() {
    if (!window.AvisosLinea || !window.Hitos) return;
    try {
      var datos = await Hitos.leer();
      var abiertos = window.Gestor && Gestor.asuntos ? Gestor.asuntos() : [];
      var lista = abiertos.filter(function (a) {
        var e = (datos.porAsunto || {})[a.nombre];
        return !!(e && Hitos.aQuienLeToca(e.hitos, datos.ajustes).reclamar);
      });
      var n = lista.length;
      AvisosLinea.registrar('esperas-por-reclamar', n ? n + (n === 1 ? ' espera por reclamar' : ' esperas por reclamar') : '', false, null, lista);
    } catch (e) { /* un aviso de más o de menos, nunca un error */ }
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(avisar);

  return { nombreDeEspera: nombreDeEspera, diaCorto: diaCorto, vencida: vencida, estadoDe: estadoDe, textoEstado: textoEstado, debajoHTML: debajoHTML, enganchar: enganchar,
           opcionMenu: opcionMenu, panelDe: panelDe, avisar: avisar, abrirVentana: abrirVentana };
})();
window.TareaEspera = TareaEspera;
