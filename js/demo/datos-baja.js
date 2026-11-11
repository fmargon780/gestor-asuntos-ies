/* ============================================================
   demo/datos-baja.js — lo que necesita BAJA MATRICULA (fila 592,
   docs/592-BAJA-MATRICULA.md) en la copia de pruebas:
     el tipo «BAJA» de antes (alumnado), con una guía genérica de tres hitos, y un
     asunto abierto suyo con la carpeta de siempre («… BAJA Apellidos, Nombre …»).
     Al acabar de montar, `alAcabar` hace la pasada de js/baja-matricula.js: el tipo
     pasa a «Baja de matrícula» (BAJA MATRICULA), con su guía, datos y plantillas, y
     el asunto de antes sigue abriéndose como de ese tipo.
   Solo con `?demo=1&auto=1&baja=1`: sin él este fichero no hace nada (las pasadas de los demás
   ficheros de demo dependen de listas comunes y tipos sin tocar).
   Todo inventado. `Demo.baja.construir({ crearTipoConGuia, crearAsunto, hace })` y
   `Demo.baja.alAcabar()` los llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  function pedido() { return /(?:^|[?&])baja=1(?:&|$)/.test(location.search); }

  async function construir(o) {
    if (!pedido()) return;
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
    if (!pedido() || !window.BajaMatricula) return;
    var r = await BajaMatricula.pasada({ forzar: true });
    if (r) U.aviso('El tipo «BAJA MATRICULA» ya está al día: guía de ' + r.hitos + ' hitos, con sus datos y plantillas.', 'bueno');
  }

  window.Demo = window.Demo || {};
  window.Demo.baja = { construir: construir, alAcabar: alAcabar };
})();
