/* ============================================================
   demo/datos-orden.js — lo que necesita el orden nuevo de la guía
   (fila 300, docs/ORDEN-DE-LA-GUIA-LLEGA-A-LOS-ASUNTOS.md) en la copia de pruebas:
     el tipo AJUSTE DE PLANIFICACION, con una guía de cuatro hitos (Recoger la
     petición, Valorar el ajuste, Ajustar la planificación, Comunicar el ajuste), y
     dos asuntos abiertos suyos: Pozo Mena, Alba (con «Recoger la petición» hecho y
     «Valorar el ajuste» en curso) y Cano Lara, Sergio (sin tocar). Para ver el caso:
     «Cambiar la guía» del tipo, subir «Comunicar el ajuste» al segundo puesto, Guardar.
   Todo inventado. `Demo.orden.construir({ crearTipoConGuia, crearAsunto, hace })` lo
   llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  async function construir(o) {
    var tipo = await o.crearTipoConGuia('AJUSTE DE PLANIFICACION', 'ALUMNADO', [
      { titulo: 'Recoger la petición', cuerpo: '<p>Qué se pide y por qué.</p>', responsable: 'yo' },
      { titulo: 'Valorar el ajuste', cuerpo: '<p>Con el equipo educativo.</p>', responsable: 'yo' },
      { titulo: 'Ajustar la planificación', cuerpo: '<p>Cambiar las fechas en el calendario.</p>', responsable: 'yo' },
      { titulo: 'Comunicar el ajuste', cuerpo: '<p>A la familia y al profesorado.</p>', responsable: 'yo' }
    ], null);
    var alumnos = [['Pozo Mena, Alba', '2100061', true], ['Cano Lara, Sergio', '2100062', false]];
    for (var i = 0; i < alumnos.length; i++) {
      var clave = await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: alumnos[i][0], id: alumnos[i][1] }), o.hace(9), {
        abiertoEl: o.hace(9) + 'T09:00:00.000Z'
      });
      if (!alumnos[i][2]) continue;
      var hitos = await Hitos.hitosDe(clave);
      await Hitos.marcar(clave, hitos[0].id, 'hecho', 'Petición recogida.');
    }
  }

  window.Demo = window.Demo || {};
  window.Demo.orden = { construir: construir };
})();
