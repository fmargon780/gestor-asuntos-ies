/* ============================================================
   demo/datos-baja.js — lo que necesita BAJA MATRICULA (fila 592,
   docs/592-BAJA-MATRICULA.md) en la copia de pruebas:
     el tipo «BAJA» de antes (alumnado), con una guía genérica de tres hitos, y un
     asunto abierto suyo con la carpeta de siempre («… BAJA Apellidos, Nombre …»).
     Al acabar de montar, `alAcabar` hace la pasada de js/baja-matricula.js: el tipo
     pasa a «Baja de matrícula» (BAJA MATRICULA), con su guía, datos y plantillas, y
     el asunto de antes sigue abriéndose como de ese tipo.
   Todo inventado. `Demo.baja.construir({ crearTipoConGuia, crearAsunto, hace })` y
   `Demo.baja.alAcabar()` los llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  async function construir(o) {
    var tipo = await o.crearTipoConGuia('BAJA', 'ALUMNADO', [
      { id: 'bj-1', titulo: 'Registrar el motivo de la baja', cuerpo: '<p>Traslado, fin de escolarización u otro.</p>', responsable: 'yo' },
      { id: 'bj-2', titulo: 'Dar la baja en Séneca', cuerpo: '<p>Con su fecha y su motivo.</p>', responsable: 'yo' },
      { id: 'bj-3', titulo: 'Comunicar a la tutoría', cuerpo: '<p>Que sepa que ya no está en el grupo.</p>', responsable: 'yo' }
    ], null);
    await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Pardo Vega, Irene', id: '2100077' }), o.hace(20), {
      abiertoEl: o.hace(20) + 'T09:00:00.000Z'
    });
  }

  /* Ya montado todo lo demás: la pasada que renombra el tipo y le pone su guía (sale su línea verde). */
  async function alAcabar() {
    if (!window.BajaMatricula) return;
    var r = await BajaMatricula.pasada({ forzar: true });
    if (r) U.aviso('El tipo «BAJA MATRICULA» ya está al día: guía de ' + r.hitos + ' hitos, con sus datos y plantillas.', 'bueno');
  }

  window.Demo = window.Demo || {};
  window.Demo.baja = { construir: construir, alAcabar: alAcabar };
})();
