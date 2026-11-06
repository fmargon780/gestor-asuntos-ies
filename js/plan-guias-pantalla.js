/* ============================================================
   plan-guias-pantalla.js — Herramientas → «Aplicar el plan de las guías»
   (fila 551, docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md).

   Al abrir el bloque enseña qué va a cambiar —lo que se une, lo que se quita,
   lo que queda separado y lo que no encuentra— sin cambiar nada. «Aplicar»
   pide confirmación y entonces lo hace (js/plan-guias-aplicar.js). Una vez
   aplicado, el bloque ya no sale.
   ============================================================ */
var PlanGuiasPantalla = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function pl(x, uno, varios) { return x + ' ' + (x === 1 ? uno : varios); }
  function lista(items) { return items.length ? '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '<p class="suave">Nada.</p>'; }

  function aHTML(r) {
    var p = r.plan, c = r.comunes;
    var separadas = c.tareasSeparadas.map(function (x) { return 'Tarea «' + esc(x.nombre) + '»: ' + x.maneras + ' maneras distintas (otra plantilla o configuración)'; })
      .concat(c.hitosSeparados.map(function (x) { return 'Hito «' + esc(x.nombre) + '»: ' + x.maneras + ' maneras distintas (otras tareas)'; }));
    return '<p>Se tocarían <strong>' + pl(r.cambian.length, 'guía', 'guías') + '</strong> de las ' + r.quien.activos.length + ' activas con guía.</p>' +
      '<h4>Se quita</h4>' + lista([pl(p.hitosQuitados, 'hito', 'hitos') + ' («Archivar» y los que hacen otros, según el plan)',
        pl(p.tareasQuitadas, 'tarea', 'tareas') + ' que ya no hacen falta']) +
      '<h4>Se une</h4>' + lista([pl(p.hitosRenombrados, 'hito cambia', 'hitos cambian') + ' de nombre al nombre único del plan',
        pl(p.tareasRenombradas, 'tarea cambia', 'tareas cambian') + ' de nombre al nombre único del plan',
        pl(p.tareasMovidas, 'tarea', 'tareas') + ' pasada de un hito a otro',
        pl(p.guiasSustituidas.length, 'guía se escribe', 'guías se escriben') + ' de nuevo' + (p.guiasSustituidas.length ? ': ' + esc(p.guiasSustituidas.join(', ')) : ''),
        'Entre las guías, ' + pl(c.tareasUnidas, 'tarea escrita se une', 'tareas escritas se unen') + ' a otra igual y ' + pl(c.hitosUnidos, 'hito se une', 'hitos se unen') + '; ninguna explicación ni normativa se pierde']) +
      '<h4>Pasa a las listas comunes</h4>' + lista([pl(c.tareasComunes, 'tarea nueva', 'tareas nuevas') + ' en la lista de tareas (' + c.tareasYaEstaban + ' ya estaban), de ' + pl(c.lineas, 'tarea escrita', 'tareas escritas') + ' en las guías',
        pl(c.hitosComunes, 'hito nuevo', 'hitos nuevos') + ' en la lista de hitos (' + c.hitosYaEstaban + ' ya estaban)']) +
      '<h4>Quedan separadas (mismo nombre, no dicen lo mismo)</h4>' + lista(separadas) +
      '<h4>Se queda como está</h4>' + lista([pl(c.hitosConPregunta, 'hito con una pregunta dentro de sus tareas', 'hitos con una pregunta dentro de sus tareas') + ' (no cabe en la lista de hitos; sus tareas sí pasan)']) +
      '<h4>No encontrado</h4>' + lista(p.noEncontrado.map(esc)) +
      (p.saltadas.length ? '<h4>Se salta</h4>' + lista(p.saltadas.map(esc)) : '') +
      '<p class="explica">Antes de aplicar se guarda una copia de las guías. Los asuntos abiertos no cambian. Al aplicarlo desaparecen escribir tareas e hitos libres en la guía, «+ Traer un hito de otro tipo», la caja «Nueva tarea…», «Tipos y su uso», la propuesta de pasar las guías y «Cargar la biblioteca del centro».</p>';
  }

  async function mirar() {
    var salida = $('plan-guias-salida');
    if (!salida || salida.dataset.mirando) return;
    salida.dataset.mirando = '1';
    salida.innerHTML = '<p class="suave">Mirando las guías…</p>';
    try {
      var r = await PlanGuiasAplicar.calcular();
      salida.innerHTML = '<div class="aviso aviso-ambar">Es solo lo que va a cambiar: todavía no se ha cambiado nada.</div><div class="plan-guias-informe">' + aHTML(r) +
        '</div><button type="button" class="boton boton-principal" id="btn-plan-guias-aplicar">Aplicar el plan de las guías</button>';
      $('btn-plan-guias-aplicar').onclick = aplicar;
    } catch (e) {
      salida.innerHTML = '';
      U.fallo('No he podido preparar el plan de las guías', e);
    }
    delete salida.dataset.mirando;
  }

  async function aplicar() {
    var boton = $('btn-plan-guias-aplicar');
    var ok = await U.preguntar('Aplicar el plan de las guías',
      '<p>Se guarda una copia de las guías y se aplica el plan: las tareas y los hitos de las guías pasan a las listas comunes, se unen los que dicen lo mismo y se quitan los que el plan quita.</p>' +
      '<p>Los asuntos abiertos no cambian. Esto no se puede repetir.</p>', 'Aplicar');
    if (!ok) return;
    try {
      var r = await U.mientrasGuarda(boton, function () { return PlanGuiasAplicar.aplicar(); });
      U.aviso('Plan de las guías aplicado: ' + pl(r.cambian.length, 'guía cambiada', 'guías cambiadas') + ', ' + pl(r.comunes.tareasComunes, 'tarea', 'tareas') +
        ' y ' + pl(r.comunes.hitosComunes, 'hito', 'hitos') + ' en las listas comunes.', 'bueno');
      var salida = $('plan-guias-salida');
      if (salida) salida.innerHTML = '<p class="explica">Aplicado. La copia de las guías de antes está en la carpeta de ajustes.</p>';
    } catch (e) {
      U.fallo('No he podido aplicar el plan de las guías', e);
    }
  }

  function bloque() {
    if ($('bloque-plan-guias')) return;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-plan-guias';
    d.innerHTML = '<summary><span class="bloque-titulo">Aplicar el plan de las guías</span>' +
      '<span class="bloque-pie">Pasa las guías a las listas comunes y limpia lo repetido; antes enseña qué cambia</span></summary>' +
      '<div class="bloque-cuerpo"><div id="plan-guias-salida"></div></div>';
    pantalla.appendChild(d);
    d.addEventListener('toggle', function () { if (d.open) mirar(); });
  }

  function crear() {
    if (window.PlanGuiasAplicar && PlanGuiasAplicar.aplicado()) return;
    if (window.Gestor && window.Gestor.carpetaGestor()) bloque();
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (App.pantallaALaVista && !App.pantallaALaVista('ajustes') && !App.pantallaALaVista('herramientas')) return;
      crear();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { crear: crear, aHTML: aHTML };
})();
window.PlanGuiasPantalla = PlanGuiasPantalla;
