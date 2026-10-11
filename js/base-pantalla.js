/* ============================================================
   base-pantalla.js — la tarjeta «Tablas para informes» de Herramientas →
   Puesta a punto y reparaciones (fila 334, docs/DATOS-2-TABLAS-PARA-INFORMES.md).

   Dice cuántos asuntos archivados están apuntados en las tablas, de cuántos,
   cuándo se puso al día por última vez en este ordenador, y tiene un botón
   «Poner al día ahora» con una barra. Va plegada y solo se pinta al abrirla;
   abierta, se refresca sola mientras se ve.
   ============================================================ */
var BasePantalla = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }

  function fechaHora(iso) {
    var d = new Date(iso || '');
    if (isNaN(d.getTime())) return '';
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    return d.getDate() + '-' + dos(d.getMonth() + 1) + '-' + d.getFullYear() + ' · ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  var mensajeFinal = '';
  var pintando = false;

  async function pintar() {
    var cuerpo = $('base-cuerpo');
    if (!cuerpo || pintando || !window.BasePonerAlDia) return;
    pintando = true;
    try {
      var c = await BasePonerAlDia.contar();
      var faltan = c.total - c.apuntados;
      var ultimo = BasePonerAlDia.ultimo();
      var trabajando = BasePonerAlDia.estaCorriendo();
      cuerpo.innerHTML =
        '<p id="base-cuantos"><strong>Asuntos archivados apuntados: ' + c.apuntados + ' de ' + c.total + '.</strong>' +
        (faltan > 0 ? ' <span class="suave">Faltan ' + faltan + '. Se apuntan solos, poco a poco.</span>' : '') + '</p>' +
        '<p class="suave" id="base-ultima">' + (ultimo ? 'Última puesta al día: ' + esc(fechaHora(ultimo.cuando)) + ', en este ordenador.' : 'Todavía no se ha puesto al día en este ordenador.') + '</p>' +
        (c.incompletos ? '<p class="suave" id="base-incompletos">' + c.incompletos + (c.incompletos === 1 ? ' asunto antiguo no tiene guardados sus hitos: se ha apuntado con lo que hay.' : ' asuntos antiguos no tienen guardados sus hitos: se han apuntado con lo que hay.') + '</p>' : '') +
        '<p><button type="button" class="boton" id="base-boton"' + (trabajando ? ' disabled' : '') + '>Poner al día ahora</button> ' +
        '<progress id="base-barra" max="100" value="0" hidden></progress> <span id="base-fin" class="suave">' + esc(mensajeFinal) + '</span></p>';
      var boton = $('base-boton');
      if (boton) boton.addEventListener('click', poner);
    } catch (e) {
      if (cuerpo) cuerpo.innerHTML = '<p class="suave">Ahora no se pueden leer las tablas.</p>';
    }
    pintando = false;
  }

  async function poner() {
    var boton = $('base-boton'), barra = $('base-barra'), fin = $('base-fin');
    if (boton) boton.disabled = true;
    if (barra) { barra.hidden = false; barra.value = 0; }
    mensajeFinal = '';
    var r = await BasePonerAlDia.ponerAlDia({
      alAvanzar: function (hechos, total) { var b = $('base-barra'); if (b) b.value = total ? Math.round(hechos * 100 / total) : 100; }
    });
    if (r && r.ok) mensajeFinal = 'Apuntados ' + r.apuntados + (r.apuntados === 1 ? ' asunto.' : ' asuntos.');
    else if (r && r.motivo === 'solo-consulta') mensajeFinal = 'En este ordenador solo se consulta: no se escribe nada.';
    else if (r && r.motivo === 'otro-ordenador') mensajeFinal = 'Otro ordenador lo está poniendo al día ahora. Prueba dentro de un rato.';
    else mensajeFinal = 'No se ha podido terminar. Se seguirá solo.';
    await pintar();
    if (fin && $('base-fin')) $('base-fin').textContent = mensajeFinal;
  }

  function montar() {
    var puesta = $('herramientas-puesta-cuerpo');
    if (!puesta || $('bloque-base')) return;
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = 'bloque-base';
    det.innerHTML = '<summary><span class="bloque-titulo">Tablas para informes</span><span class="bloque-pie">Los asuntos archivados, apuntados en tablas para las estadísticas que vengan</span></summary>' +
      '<div class="bloque-cuerpo"><p class="explica">Cada asunto que se archiva queda apuntado, con sus hitos, sus personas y sus documentos, además de en su carpeta. Las carpetas no cambian.</p>' +
      '<div id="base-cuerpo"></div></div>';
    puesta.appendChild(det);
    det.addEventListener('toggle', function () { if (det.open) pintar(); });
    det.addEventListener('click', function () { setTimeout(function () { if (det.open && !$('base-boton')) pintar(); }, 0); });
    setInterval(function () {
      if (det.open && det.offsetParent !== null && !BasePonerAlDia.estaCorriendo() && !(window.ColaGuardado && ColaGuardado.hayGuardado())) pintar();
    }, 5000);
  }

  function arrancar() { montar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

  return { pintar: pintar };
})();
window.BasePantalla = BasePantalla;
