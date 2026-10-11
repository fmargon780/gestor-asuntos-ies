/* ============================================================
   demo/datos-cargos.js — quien ocupa Dirección, en la copia de pruebas
   (fila 330, docs/ENTREGAR-CARGOS-AL-CENTRO-DE-DATOS.md): dos ocupantes
   (el de hoy y uno anterior), para que haya algo que entregar al Centro
   de datos. Secretaría ya lleva uno (js/demo/datos.js) y los demás cargos
   de fábrica se quedan sin ocupante. Nombres inventados.
   `Demo.cargos.escribir()` lo llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  async function escribir() {
    if (!window.Cargos) return;
    var anterior = await Cargos.anadirOcupante('direccion', 'Miguel Prado Soler', '2019-07-01', 'H');
    if (anterior) await Cargos.cerrarOcupante('direccion', anterior.id, '2025-06-30');
    await Cargos.anadirOcupante('direccion', 'Rosa Sellés Manzano', '2025-07-01', 'M');
  }

  window.Demo = window.Demo || {};
  window.Demo.cargos = { escribir: escribir };
})();
