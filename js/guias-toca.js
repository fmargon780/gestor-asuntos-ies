/* ============================================================
   guias-toca.js — a quién le toca cada paso de la guía (fila 129,
   24-sep-2026, docs/EL-HITO-ES-EL-ESTADO.md).

   Cada paso de la guía dice si, mientras está abierto, el asunto nos
   toca a nosotros («Nos toca») o está esperando a alguien de fuera
   («Esperamos a…», con a quién: los papeles fijos y los responsables
   de Ajustes › Hitos). Se guarda en el paso (`toca`, `tocaA`) y lo
   heredan sus hitos (js/hitos-sincronizar.js). Sin marca, se deduce
   del responsable con Hitos.esDeAdministracion, que sigue siendo el
   único sitio que decide quién es Administración.

   js/guias.js pinta esto dentro de «Responsable, a quién le toca y
   plazo» (GuiasToca.html) y lo lee al recoger (GuiasToca.leer); la
   fila cerrada del acordeón (js/guias-plegado.js) enseña la marca con
   GuiasToca.marca. Se carga antes de js/guias.js.
   ============================================================ */
var GuiasToca = (function () {

  /* El nombre corto de cada papel fijo, el mismo de la tarjeta. */
  var PAPELES = { tercero: 'Tercero', tutor: 'Familia', relacionado: 'Relacionado' };

  function nombreDe(id, responsables) {
    if (PAPELES[id]) return PAPELES[id];
    var r = (responsables || []).filter(function (x) { return x.id === id; })[0];
    return r ? r.nombre : id;
  }

  /* A quién se puede esperar: primero los papeles fijos y luego los
     responsables que no son de Administración (esperar a «Yo» no tiene
     sentido). `responsables` puede traer ya los papeles mezclados. */
  function aQuien(responsables) {
    var lista = Object.keys(PAPELES).map(function (id) { return { id: id, nombre: PAPELES[id] }; });
    (responsables || []).forEach(function (r) {
      if (!r || !r.id || PAPELES[r.id] || r.clase === 'papel') return;
      if (r.administracion) return;
      lista.push({ id: r.id, nombre: r.nombre });
    });
    return lista;
  }

  function html(p, responsables) {
    var toca = (p && p.toca) || '';
    var tocaA = (p && p.tocaA) || 'tercero';
    return '<label class="etiqueta">A quién le toca</label>' +
      '<div class="paso-toca-fila">' +
        '<select class="campo paso-toca">' +
          '<option value=""' + (!toca ? ' selected' : '') + '>Según el responsable</option>' +
          '<option value="nos"' + (toca === 'nos' ? ' selected' : '') + '>Nos toca</option>' +
          '<option value="espera"' + (toca === 'espera' ? ' selected' : '') + '>Esperamos a…</option>' +
        '</select>' +
        '<select class="campo paso-toca-a"' + (toca === 'espera' ? '' : ' hidden') + '>' +
          aQuien(responsables).map(function (r) {
            return '<option value="' + U.escapar(r.id) + '"' + (r.id === tocaA ? ' selected' : '') + '>' +
              U.escapar(r.nombre) + '</option>';
          }).join('') +
        '</select>' +
      '</div>';
  }

  /* Lee lo elegido en el recuadro del paso `caja` y lo deja en `paso`. */
  function leer(caja, paso) {
    var sel = caja.querySelector(':scope > .paso-extra .paso-toca');
    if (!sel) return;
    var a = caja.querySelector(':scope > .paso-extra .paso-toca-a');
    paso.toca = sel.value === 'nos' || sel.value === 'espera' ? sel.value : '';
    paso.tocaA = paso.toca === 'espera' ? ((a && a.value) || 'tercero') : '';
  }

  /* El texto de la marca en la fila cerrada: «Nos toca», «Espera: Familia». */
  function marca(p, responsables) {
    if (!p || !p.toca) return '';
    if (p.toca === 'nos') return 'Nos toca';
    return 'Espera: ' + nombreDe(p.tocaA || 'tercero', responsables);
  }

  /* El segundo desplegable solo se ve con «Esperamos a…». */
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || !t.classList || !t.classList.contains('paso-toca')) return;
    var otro = t.parentNode && t.parentNode.querySelector('.paso-toca-a');
    if (otro) otro.hidden = t.value !== 'espera';
  });

  return { html: html, leer: leer, marca: marca, aQuien: aQuien, nombreDe: nombreDe };
})();
window.GuiasToca = GuiasToca;
