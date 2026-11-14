/* ============================================================
   repaso-guias-pantalla.js — Herramientas → «Aplicar el repaso de la lista común»
   (fila 657, docs/657-REPASO-LISTA-COMUN.md).

   Al abrir el bloque enseña qué va a cambiar —hitos que se juntan, cambian de
   nombre o se quitan, guía por guía; tareas; lo que no encuentra— sin cambiar
   nada. «Aplicar» pide confirmación y entonces lo hace (js/repaso-guias-aplicar.js).
   Una vez aplicado, el bloque ya no sale.
   ============================================================ */
var RepasoGuiasPantalla = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function pl(x, uno, varios) { return x + ' ' + (x === 1 ? uno : varios); }
  function lista(items) { return items.length ? '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '<p class="suave">Nada.</p>'; }
  function com(t) { return '«' + esc(t) + '»'; }

  function deUnaGuia(g) {
    var l = [];
    g.juntan.forEach(function (x) { l.push('Se juntan en ' + com(x.nuevo) + ': ' + x.de.map(com).join(' + ')); });
    g.renombran.forEach(function (x) { l.push(com(x.antes) + ' pasa a llamarse ' + com(x.ahora)); });
    g.quitan.forEach(function (x) { l.push('Se quita el hito ' + com(x)); });
    g.tareasRenombradas.forEach(function (x) { l.push('La tarea ' + com(x.antes) + ' pasa a llamarse ' + com(x.ahora)); });
    g.tareasQuitadas.forEach(function (x) { l.push('Se quita la tarea ' + com(x)); });
    g.tareasNuevas.forEach(function (x) { l.push('Tarea nueva: ' + com(x)); });
    return '<li><strong>' + esc(g.tipo) + '</strong>' + lista(l) + '</li>';
  }

  function aHTML(r) {
    var p = r.plan;
    return '<p>Se tocarían <strong>' + pl(r.cambian.length, 'guía', 'guías') + '</strong> de las ' + r.quien.activos.length + ' activas con guía.</p>' +
      '<h4>En las listas comunes</h4>' + lista([
        pl(r.listasAntes.hitos.length, 'hito común', 'hitos comunes') + ' hoy; quedarían ' + r.listas.hitos.length + ', cada uno con su fase',
        pl(r.listasAntes.tareas.length, 'tarea común', 'tareas comunes') + ' hoy; quedarían ' + r.listas.tareas.length + ', cada una con su acción']) +
      '<h4>En las guías</h4>' + lista([
        pl(p.hitosJuntados, 'hito se junta', 'hitos se juntan') + ' con el de al lado',
        pl(p.hitosRenombrados, 'hito cambia', 'hitos cambian') + ' de nombre',
        pl(p.hitosQuitados, 'hito se quita', 'hitos se quitan'),
        pl(p.tareasNuevas, 'tarea nueva', 'tareas nuevas') + ' (la que dice lo mismo que su hito, o una que faltaba)',
        pl(p.tareasRenombradas, 'tarea cambia', 'tareas cambian') + ' de nombre',
        pl(p.tareasQuitadas, 'tarea se quita', 'tareas se quitan') + ' (las hace la app sola o son pasos de otra pantalla)']) +
      '<h4>Guía por guía</h4>' + (p.guias.length ? '<ul>' + p.guias.map(deUnaGuia).join('') + '</ul>' : '<p class="suave">Nada.</p>') +
      '<h4>No encontrado</h4>' + lista(p.noEncontrado.map(esc)) +
      (p.saltadas.length ? '<h4>Se salta</h4>' + lista(p.saltadas.map(esc)) : '') +
      '<p class="explica">Antes de aplicar se guarda una copia de las guías y de las dos listas. Los asuntos abiertos no cambian.</p>';
  }

  async function mirar() {
    var salida = $('repaso-lista-salida');
    if (!salida || salida.dataset.mirando) return;
    salida.dataset.mirando = '1';
    salida.innerHTML = '<p class="suave">Mirando las guías…</p>';
    try {
      var r = await RepasoGuiasAplicar.calcular();
      salida.innerHTML = '<div class="aviso aviso-ambar">Es solo lo que va a cambiar: todavía no se ha cambiado nada.</div><div class="repaso-lista-informe">' + aHTML(r) +
        '</div><button type="button" class="boton boton-principal" id="btn-repaso-lista-aplicar">Aplicar el repaso de la lista común</button>';
      $('btn-repaso-lista-aplicar').onclick = aplicar;
    } catch (e) {
      salida.innerHTML = '';
      U.fallo('No he podido preparar el repaso de la lista común', e);
    }
    delete salida.dataset.mirando;
  }

  async function aplicar() {
    var boton = $('btn-repaso-lista-aplicar');
    var ok = await U.preguntar('Aplicar el repaso de la lista común',
      '<p>Se guarda una copia de las guías y de las dos listas comunes y se aplica el repaso: los hitos y las tareas repetidos se unen, los hitos seguidos de la misma fase se juntan en cada guía y cada tarea lleva su acción.</p>' +
      '<p>Los asuntos abiertos siguen con las tareas que tenían (las que cambian o se quitan se les quedan como estaban). Esto no se puede repetir.</p>', 'Aplicar');
    if (!ok) return;
    try {
      var r = await U.mientrasGuarda(boton, function () { return RepasoGuiasAplicar.aplicar(); });
      U.aviso('Repaso aplicado: ' + pl(r.cambian.length, 'guía cambiada', 'guías cambiadas') + ', ' + pl(r.listas.hitos.length, 'hito común', 'hitos comunes') +
        ' y ' + pl(r.listas.tareas.length, 'tarea común', 'tareas comunes') + '.', 'bueno');
      var salida = $('repaso-lista-salida');
      if (salida) salida.innerHTML = '<p class="explica">Aplicado. La copia de las guías y de las listas de antes está en la carpeta de ajustes.</p>';
      var b = $('bloque-repaso-lista');
      if (b) setTimeout(function () { if (RepasoGuiasAplicar.aplicado() && b.parentNode) b.parentNode.removeChild(b); }, 0);
    } catch (e) {
      U.fallo('No he podido aplicar el repaso de la lista común', e);
    }
  }

  function bloque() {
    if ($('bloque-repaso-lista')) return;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-repaso-lista';
    d.innerHTML = '<summary><span class="bloque-titulo">Aplicar el repaso de la lista común</span>' +
      '<span class="bloque-pie">Une los hitos y tareas repetidos y pone fase y acción; antes enseña qué cambia</span></summary>' +
      '<div class="bloque-cuerpo"><div id="repaso-lista-salida"></div></div>';
    pantalla.appendChild(d);
    d.addEventListener('toggle', function () { if (d.open) mirar(); });
  }

  function crear() {
    if (window.RepasoGuiasAplicar && RepasoGuiasAplicar.aplicado()) return;
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
window.RepasoGuiasPantalla = RepasoGuiasPantalla;
