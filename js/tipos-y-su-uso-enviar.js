/* ============================================================
   tipos-y-su-uso-enviar.js — «Enviar las guías activas a Claude» (fila 543,
   docs/543-TIPOS-Y-SU-USO.md). Un aviso normal al buzón de soporte
   (`SoporteCargar.buzon`, como js/medidas-enviar.js): `texto` es la línea
   GUIAS-PARA-CLAUDE y, debajo, un JSON con cada tipo activo y su guía.
   Nunca va nada de asuntos.json, de personas ni de correos. Los tipos
   desactivados no van. Se puede enviar más de una vez.

   No se envía en la demostración (?demo=1) ni bajo un navegador manejado por
   un programa (navigator.webdriver), salvo que la dirección lleve `guias=1`.
   ============================================================ */
var TiposYSuUsoEnviar = (function () {

  var REPO = 'fmargon780/gestor-asuntos-ies';
  var enviando = false;

  function sePuedeEnviar() {
    if (/(^|[?&])guias=1(&|$)/.test(location.search)) return true;
    if (/(^|[?&])demo=1(&|$)/.test(location.search)) return false;
    return !(navigator && navigator.webdriver);
  }
  function pl(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* Los tipos activos con su guía. */
  function paquete(filas, guiaDe) {
    var activos = filas.filter(function (f) { return !f.desactivado; });
    var tipos = activos.map(function (f) {
      return { nombre: f.tipo, categoria: f.categoria, abiertos: f.abiertos, archivados: f.archivados, ultimoUso: f.ultimo || '',
        guia: (window.GuiasDelCentro && GuiasDelCentro.pasosDe(f.tipo)) || [] };
    });
    var hitos = 0, tareas = 0;
    activos.forEach(function (f) { var g = guiaDe(f.tipo); hitos += g.length; g.forEach(function (h) { tareas += h.tareas.length; }); });
    return { tipos: tipos, hitos: hitos, tareas: tareas };
  }

  function cuerpoDe(p) {
    var texto = 'GUIAS-PARA-CLAUDE\n' + JSON.stringify({ generado: new Date().toISOString(), tipos: p.tipos });
    return JSON.stringify({ tipo: 'mejora', repo: REPO, app: 'Gestor de Asuntos', pantalla: 'Herramientas',
      quien: String((window.App && App.E && App.E.usuario) || ''), fecha: new Date().toISOString(),
      version: String((window.App && App.VERSION) || ''), texto: texto });
  }

  async function enviar(filas, guiaDe, mensaje) {
    if (enviando) return;
    var p = paquete(filas, guiaDe), n = p.tipos.length;
    var cuerpo = '<p>Se enviarán ' + pl(n, 'guía', 'guías') + ', con ' + pl(p.hitos, 'hito', 'hitos') + ' y ' + pl(p.tareas, 'tarea', 'tareas') + '.</p>' +
      '<p>Van los nombres de tipos, hitos, tareas y plantillas, y cuántas veces se ha usado cada tipo. No va ningún dato de asuntos ni de personas.</p>' +
      '<p>Los tipos desactivados no se envían.</p>';
    if (!(await U.preguntar('Enviar las guías activas a Claude', cuerpo, 'Enviar'))) return;
    if (!sePuedeEnviar()) {
      mensaje('En la demostración no se envía nada: se habrían enviado ' + pl(n, 'guía', 'guías') + '.', 'aviso-ambar');
      return;
    }
    enviando = true;
    try {
      var buzon = window.SoporteCargar && SoporteCargar.buzon;
      if (!buzon) throw new Error('no encuentro la dirección del buzón');
      var r = await fetch(buzon, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: cuerpoDe(p) });
      var j = await r.json();
      if (!j || j.ok !== true) throw new Error((j && j.motivo) || 'el buzón no lo ha aceptado');
      mensaje('Enviadas ' + pl(n, 'guía', 'guías') + ' a Claude. Dile en la conversación que ya están.');
    } catch (e) {
      U.fallo('No he podido enviar las guías', e);
    }
    enviando = false;
  }

  return { enviar: enviar, paquete: paquete, cuerpoDe: cuerpoDe, sePuedeEnviar: sePuedeEnviar };
})();
window.TiposYSuUsoEnviar = TiposYSuUsoEnviar;
