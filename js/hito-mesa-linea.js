/* ============================================================
   hito-mesa-linea.js — la línea del hito, debajo de su título (13-nov-2026,
   fila 638, docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md; pantalla de prueba
   docs/pantallas/630.html).

   «Hito actual · En curso · plazo», y:
     - el plazo se pulsa ahí mismo para ponerlo, cambiarlo o quitarlo;
     - el estado se sigue pudiendo cambiar con su menú (como antes);
     - «Le toca a: …» solo si el hito es de alguien que no es de
       Administración (el responsable se cambia en «Hito ▾ → Cambiar»);
     - «Esperando a…» (y, en espera, «Esperando a … desde el …» con «Ya ha
       llegado») solo en el hito actual.
   Antes, el plazo y el responsable eran etiquetas de la cabecera, y
   «Esperando a…» estaba a la derecha de la fila de hitos.

   Lo llaman js/hito-mesa.js (`html`, `enganchar`).
   ============================================================ */
var HitoMesaLinea = (function () {

  var ESTADOS = [
    { valor: 'pendiente', texto: 'Sin empezar' },
    { valor: 'encurso', texto: 'En curso' },
    { valor: 'hecho', texto: 'Hecho' },
    { valor: 'noaplica', texto: 'No aplica' }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t == null ? '' : String(t)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  function contextoDe(a) {
    var f = (a && a.ficha) || {};
    return { tercero: f.tercero || (a && a.leido && a.leido.resto) || '', relacionados: f.relacionados || [], tutor: null };
  }

  function esActual(h, hitos, ajustes) {
    return !!(window.EstadoHito && EstadoHito.idActual && EstadoHito.idActual(hitos, ajustes) === h.id);
  }

  /* El estado, con las palabras de la línea: el hito actual está «En curso»; uno que aún no toca, «Sin empezar». */
  function textoEstado(h, actual) {
    if (h.estado === 'hecho') return window.Esperas ? Esperas.textoHecho(h) : 'Hecho';
    if (h.estado === 'noaplica') return 'No aplica';
    return (actual || h.estado === 'encurso') ? 'En curso' : 'Sin empezar';
  }

  /* A quién le toca, si no es de Administración; '' si es de la casa. */
  function leToca(h, ajustes, ctx) {
    if (!h || h.clase === 'decision' || h.toca === 'nos' || h.estado === 'hecho' || h.estado === 'noaplica' || !window.Hitos) return '';
    if (h.toca === 'espera') return Hitos.nombreDeEspera(h.tocaA || h.responsable || 'tercero', ajustes, ctx) || '';
    if (!h.responsable || Hitos.esDeAdministracion(h.responsable, ajustes)) return '';
    return Hitos.nombreDeEspera(h.responsable, ajustes, ctx) || '';
  }

  /* La espera puesta a mano en este hito (solo vale en el actual). */
  function esperaManual(h, actual) {
    return actual && h.esperandoA && window.Hitos
      ? { a: h.esperandoA, desde: h.esperandoDesde || '', motivo: h.esperandoMotivo || '' } : null;
  }

  /* ¿Se puede poner «Esperando a…»? Solo el hito actual, abierto, sin una espera ya (ni la automática del responsable). */
  function puedePonerEspera(a, h, hitos, ajustes, abierto, actual) {
    if (!abierto || !actual || h.clase === 'decision' || h.esperandoA || !window.Hitos || !Hitos.aQuienLeToca) return false;
    var l = Hitos.aQuienLeToca(hitos, ajustes, contextoDe(a));
    return !(l.esperando && l.esperando.auto);
  }

  function html(a, h, hitos, ajustes, abierto) {
    var actual = esActual(h, hitos, ajustes);
    var ctx = contextoDe(a);
    var plazo = window.HitoMesa ? HitoMesa.textoPlazo(h.fecha, ajustes, h.plazo && h.plazo.cuenta) : { texto: 'Sin plazo', clase: '' };
    var espera = esperaManual(h, actual);
    var estado = espera
      ? '<span class="mesa-linea-espera">' + esc(EstadoHito.textoEsperando({ nombre: Hitos.nombreDeEspera(espera.a, ajustes, ctx), desde: espera.desde })) + '</span>'
      : (h.estado === 'hecho'
        ? '<button type="button" class="mesa-etq mesa-etq-estado mesa-etq-hecho">' + esc(textoEstado(h, actual)) + '</button>'
        : '<button type="button" class="mesa-meta mesa-etq-estado">' + esc(textoEstado(h, actual)) + '</button>');
    var toca = leToca(h, ajustes, ctx);
    var boton = '';
    if (espera) boton = '<button type="button" class="boton boton-chico mesa-ya-llego"' + (soloConsulta() ? ' disabled data-motivo-clave="consulta"' : '') + '>Ya ha llegado</button>';
    else if (puedePonerEspera(a, h, hitos, ajustes, abierto, actual)) boton = '<button type="button" class="boton boton-chico mesa-esperando-a"' + (soloConsulta() ? ' disabled data-motivo-clave="consulta"' : '') + '>Esperando a…</button>';
    return '<div class="mesa-linea mesa-etiquetas">' +
      (actual && window.EstadoHito ? EstadoHito.etiquetaPasoActualHTML() + '<span class="mesa-meta-punto">·</span>' : '') +
      estado + '<span class="mesa-meta-punto">·</span>' +
      '<button type="button" class="mesa-meta mesa-etq-plazo ' + plazo.clase + '">' + esc(plazo.texto) + '</button>' +
      (toca ? '<span class="mesa-meta-punto">·</span><span class="mesa-linea-toca"><b>Le toca a: ' + esc(toca) + '</b></span>' : '') +
      boton +
      (window.ContactoALaVista ? ContactoALaVista.html(a) : '') +   /* fila 305 */
    '</div>';
  }

  function guardar(control, queNo, hacer) {
    if (window.HitosPanelLista && HitosPanelLista.guardarHito) return HitosPanelLista.guardarHito(control, queNo, hacer);
    return hacer();
  }

  function repintar() { if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado(); }

  function enganchar(cab, a, h, hitos, ajustes, abierto) {
    if (!abierto || !window.FichaMenus) return;
    var estado = cab.querySelector('.mesa-etq-estado');
    if (estado) FichaMenus.montar(estado, ESTADOS.map(function (e) {
      return { texto: e.texto, alPulsar: function () {
        guardar(null, 'cambiar el estado', function () { return Hitos.marcar(a.nombre, h.id, e.valor, window.RegistroAsunto ? RegistroAsunto.notaDeEstado(h.estado, e.valor) : ''); });
      } };
    }));
    var plazo = cab.querySelector('.mesa-etq-plazo');
    if (plazo) FichaMenus.montar(plazo, [
      { texto: 'Cambiar la fecha…', alPulsar: async function () {
        var ok = await U.preguntar('Fecha límite de este hito',
          '<input type="date" class="campo" id="mesa-fecha-nueva" value="' + esc(h.fecha || '') + '">', 'Guardar');
        if (!ok) return;
        var v = ($('mesa-fecha-nueva') && $('mesa-fecha-nueva').value) || '';
        guardar(null, 'guardar la fecha', function () { return Hitos.guardarCampos(a.nombre, h.id, { fecha: v }); });
      } },
      { texto: 'Quitar la fecha', alPulsar: function () {
        guardar(null, 'quitar la fecha', function () { return Hitos.guardarCampos(a.nombre, h.id, { fecha: '' }); });
      } }
    ]);
    var esperando = cab.querySelector('.mesa-esperando-a:not([disabled])');
    if (esperando) esperando.onclick = function () {
      Promise.resolve(EstadoHito.pedirEsperando(a, esperando)).then(repintar, repintar);
    };
    var llego = cab.querySelector('.mesa-ya-llego:not([disabled])');
    if (llego) llego.onclick = function () {
      Promise.resolve(EstadoHito.yaHaLlegado(a, llego)).then(repintar, repintar);
    };
  }

  return { html: html, enganchar: enganchar, leToca: leToca, textoEstado: textoEstado, ESTADOS: ESTADOS };
})();
window.HitoMesaLinea = HitoMesaLinea;
