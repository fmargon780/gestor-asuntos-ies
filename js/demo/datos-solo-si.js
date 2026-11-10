/* ============================================================
   demo/datos-solo-si.js — lo que necesita «Cuándo se hace» (fila 576,
   docs/576-SOLO-SI-EN-HITOS-Y-TAREAS.md) en la copia de pruebas:
     el tipo RECLAMACIÓN DE NOTAS (alumnado), con una guía de cuatro hitos donde
     «¿Quién la presenta?» es todavía un hito-pregunta (Familia / Alumno mayor de
     edad, cada uno con su hito dentro): al entrar, la aplicación la pasa sola a un
     campo de lista y a hitos con «Solo si»; y tres asuntos abiertos suyos:
     uno que ya contestó la pregunta (Familia), uno sin contestar (el campo vacío:
     salen todos con «Falta: ¿Quién la presenta?») y uno sin tocar.
   Todo inventado. `Demo.soloSi.construir({ crearTipoConGuia, crearAsunto, hace })` lo
   llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  async function construir(o) {
    GuiasSinPreguntas.pausar(true);   /* la conversión espera a que estén los asuntos */
    var tipo = await o.crearTipoConGuia('RECLAMACIÓN DE NOTAS', 'ALUMNADO', [
      { id: 'rn-1', titulo: 'Registrar la reclamación', cuerpo: '<p>Anotar la entrada y la fecha.</p>', responsable: 'yo',
        guion: [{ id: 'rn-g1', texto: 'Registrar en Libro de Entrada', explicacion: 'Con su fecha de hoy.' }] },
      { id: 'rn-2', titulo: '¿Quién la presenta?', cuerpo: '<p>De eso depende cómo se avisa.</p>', responsable: 'yo', opciones: [
        { id: 'rn-o1', titulo: 'Familia', pasos: [{ id: 'rn-2a', titulo: 'Avisar a la familia del plazo', cuerpo: '<p>Por correo o iPasen.</p>', responsable: 'yo' }] },
        { id: 'rn-o2', titulo: 'Alumno mayor de edad', pasos: [{ id: 'rn-2b', titulo: 'Avisar al alumno del plazo', cuerpo: '<p>Por correo.</p>', responsable: 'yo' }] }] },
      { id: 'rn-3', titulo: 'Trasladar al departamento', cuerpo: '<p>Con la hoja de reclamación.</p>', responsable: 'yo' },
      { id: 'rn-4', titulo: 'Comunicar la resolución', cuerpo: '<p>Al solicitante.</p>', responsable: 'yo' }
    ], null);
    var alumnos = [['Rubio Ortega, Marina', '2100071', 'respondida'], ['Lara Soto, Daniel', '2100072', 'sin contestar'], ['Vega Pardo, Irene', '2100073', 'sin tocar']];
    for (var i = 0; i < alumnos.length; i++) {
      var clave = await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: alumnos[i][0], id: alumnos[i][1] }), o.hace(5), {
        abiertoEl: o.hace(5) + 'T09:00:00.000Z'
      });
      var hitos = await Hitos.hitosDe(clave);
      if (alumnos[i][2] === 'sin tocar') continue;
      await Hitos.marcar(clave, hitos[0].id, 'hecho', 'Reclamación registrada.');
      if (alumnos[i][2] === 'respondida') await Hitos.elegirOpcion(clave, 'rn-2', 'rn-o1');
    }
    GuiasSinPreguntas.pausar(false);
    await GuiasSinPreguntas.convertir();
  }

  window.Demo = window.Demo || {};
  window.Demo.soloSi = { construir: construir };
})();
