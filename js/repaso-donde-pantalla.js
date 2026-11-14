/* ============================================================
   repaso-donde-pantalla.js — Herramientas → «Aplicar el repaso del dónde»
   (fila 659, docs/659-DONDE-SE-HACE-Y-NOMBRES.md). Como el de la fila 657
   (js/repaso-guias-pantalla.js): al abrir el bloque enseña qué va a cambiar —los sitios que se
   ponen, las acciones que cambian, los tipos de documento, los hitos que se quitan y lo que no
   encuentra— sin cambiar nada. «Aplicar» pide confirmación y entonces lo hace
   (js/repaso-donde-aplicar.js). Una vez aplicado, el bloque ya no sale.
   ============================================================ */
var RepasoDondePantalla = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function pl(x, uno, varios) { return x + ' ' + (x === 1 ? uno : varios); }
  function lista(items) { return items.length ? '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '<p class="suave">Nada.</p>'; }
  function com(t) { return '«' + esc(t) + '»'; }
  function valores(o) { return Object.keys(o).map(function (k) { return o[k]; }); }

  function aHTML(r) {
    var i = r.informe;
    var acciones = valores(i.acciones), documentos = valores(i.documentos), sinPlan = valores(i.sinPlan);
    return '<p>Se tocarían <strong>' + pl(i.tareasComunes, 'tarea de la lista común', 'tareas de la lista común') + '</strong> y <strong>' + pl(r.cambian.length, 'guía', 'guías') +
      '</strong> (' + pl(i.lineas, 'tarea', 'tareas') + ' dentro de ellas).</p>' +
      '<h4>Qué se hace (cambian de acción)</h4>' + lista(acciones.map(function (x) { return com(x.texto) + ': de ' + com(x.antes) + ' a ' + com(x.ahora); })) +
      '<h4>Qué documento</h4>' + lista(documentos.map(function (x) { return com(x.texto) + ': ' + com(x.tipo); })) +
      '<h4>Hitos que se quitan de sus guías</h4>' + lista(i.hitosQuitados.map(function (x) { return 'La guía ' + com(x.guia) + ': el hito ' + com(x.titulo) + ' (no tiene ninguna tarea)'; }).concat(i.hitosNoQuitados.map(esc))) +
      '<h4>Tareas que no están en el plan</h4>' + (sinPlan.length ? '<p class="explica">Reciben el sitio que propone su acción:</p>' : '') + lista(sinPlan.map(esc)) +
      '<h4>No encontrado</h4>' + lista(i.noEncontrado.map(esc)) +
      '<p class="explica">Antes de aplicar se guarda una copia de las guías y de la lista de tareas. Los asuntos abiertos no cambian.</p>';
  }

  async function mirar() {
    var salida = $('repaso-donde-salida');
    if (!salida || salida.dataset.mirando) return;
    salida.dataset.mirando = '1';
    salida.innerHTML = '<p class="suave">Mirando las guías…</p>';
    try {
      var r = await RepasoDondeAplicar.calcular();
      salida.innerHTML = '<div class="aviso aviso-ambar">Es solo lo que va a cambiar: todavía no se ha cambiado nada.</div><div class="repaso-donde-informe">' + aHTML(r) +
        '</div><button type="button" class="boton boton-principal" id="btn-repaso-donde-aplicar">Aplicar el repaso del dónde</button>';
      $('btn-repaso-donde-aplicar').onclick = aplicar;
    } catch (e) {
      salida.innerHTML = '';
      U.fallo('No he podido preparar el repaso del dónde', e);
    }
    delete salida.dataset.mirando;
  }

  async function aplicar() {
    var boton = $('btn-repaso-donde-aplicar');
    var ok = await U.preguntar('Aplicar el repaso del dónde',
      '<p>Se guarda una copia de las guías y de la lista de tareas y se aplica el repaso: cada tarea recibe su sitio («Dónde se hace»), las de archivar y las de recoger pasan a su acción nueva y se quitan los hitos «Archivar» que no tenían ninguna tarea.</p>' +
      '<p>Los asuntos abiertos siguen con las tareas que tenían. Esto no se puede repetir.</p>', 'Aplicar');
    if (!ok) return;
    try {
      var r = await U.mientrasGuarda(boton, function () { return RepasoDondeAplicar.aplicar(); });
      U.aviso('Repaso aplicado: ' + pl(r.informe.tareasComunes, 'tarea común', 'tareas comunes') + ' y ' + pl(r.cambian.length, 'guía cambiada', 'guías cambiadas') + '.', 'bueno');
      var salida = $('repaso-donde-salida');
      if (salida) salida.innerHTML = '<p class="explica">Aplicado. La copia de las guías y de las tareas de antes está en la carpeta de ajustes.</p>';
      var b = $('bloque-repaso-donde');
      if (b) setTimeout(function () { if (RepasoDondeAplicar.aplicado() && b.parentNode) b.parentNode.removeChild(b); }, 0);
    } catch (e) {
      U.fallo('No he podido aplicar el repaso del dónde', e);
    }
  }

  function bloque() {
    if ($('bloque-repaso-donde')) return;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-repaso-donde';
    d.innerHTML = '<summary><span class="bloque-titulo">Aplicar el repaso del dónde</span>' +
      '<span class="bloque-pie">Pone a cada tarea su sitio y su documento; antes enseña qué cambia</span></summary>' +
      '<div class="bloque-cuerpo"><div id="repaso-donde-salida"></div></div>';
    pantalla.appendChild(d);
    d.addEventListener('toggle', function () { if (d.open) mirar(); });
  }

  function crear() {
    if (window.RepasoDondeAplicar && RepasoDondeAplicar.aplicado()) return;
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
window.RepasoDondePantalla = RepasoDondePantalla;
