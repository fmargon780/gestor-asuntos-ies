/* ============================================================
   demo/datos-plan-guias.js — cuatro guías con nombres del plan de las guías (fila 551, docs/544-PLAN-GUIAS.md) para poder
   aplicar el plan con la demostración: hitos y tareas que el plan une («Registro entrada», «Dar Registro de Entrada»,
   «Firma del director»…), otros que quita («Archivar», «Valorar la petición»), una tarea que cambia de hito, dos tareas
   con igual nombre y distinta explicación, dos con igual nombre y distinta plantilla, una dentro de una pregunta, y un
   tipo desactivado (para ver su guía pasar a las listas al activarlo). Todo inventado.
   Lo llama js/demo/datos.js al montar los tipos.
   ============================================================ */
(function () {
  'use strict';

  async function construir(o) {
    await o.crearTipoConGuia('CAMBIO DE GRUPO', 'ALUMNADO', [
      { titulo: 'Recoger la solicitud o la propuesta', cuerpo: '<p>De la familia o de la tutoría.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-1', texto: 'Registrar en Libro de Entrada', explicacion: 'Con su fecha de hoy.', accion: 'registrar', receta: { sentido: 'entrada' } },
                { id: 'g-plan-2', texto: 'Enviar correo de aviso', explicacion: 'Al tutor.', accion: 'comunicar', receta: { a: 'tutoria', via: 'correo', plantilla: 'pl-plan-a' } }] },
      { titulo: 'Valorar la petición', cuerpo: '<p>Lo hace Jefatura.</p>', responsable: 'Jefatura de Estudios' },
      { titulo: 'Modificar el grupo en Séneca', cuerpo: '<p>Cambiar la unidad.</p>', responsable: 'yo' },
      { titulo: 'Resolver', cuerpo: '<p>Resuelve Jefatura.</p>', responsable: 'Jefatura de Estudios' },
      { titulo: 'Comunicar a la familia, a las dos tutorías y al equipo docente', cuerpo: '<p>Por escrito.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-3', texto: 'Enviar el documento al solicitante por la vía acordada', explicacion: 'Por correo o iPasen.' }] },
      { titulo: 'Archivar', cuerpo: '<p>Dejar el expediente cerrado.</p>', responsable: 'yo' }
    ], null);

    await o.crearTipoConGuia('CONVALIDACIÓN CURSO', 'ALUMNADO', [
      { titulo: 'Recoger la solicitud', cuerpo: '<p>Con la documentación.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-4', texto: 'Registrar el documento en el Libro de Entrada', explicacion: 'Anotar el número en la ficha.', accion: 'registrar', receta: { sentido: 'entrada' } }] },
      { titulo: 'Informe del departamento', cuerpo: '<p>Lo pide el departamento.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-5', texto: 'Pasar la solicitud al departamento que corresponde', explicacion: '' }] },
      { titulo: 'Resolver o remitir, según el supuesto', cuerpo: '<p>Según el supuesto.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-6', texto: 'Registrar la salida en Séneca si se remite', explicacion: '', accion: 'registrar', receta: { sentido: 'salida' } }] },
      { titulo: 'Anotar en el expediente y en Séneca', cuerpo: '<p>Dejar constancia.</p>', responsable: 'yo' },
      { titulo: 'Comunicar a la familia y a la tutoría', cuerpo: '<p>Por escrito.</p>', responsable: 'yo' },
      { titulo: 'Archivar', cuerpo: '<p>Cerrar.</p>', responsable: 'yo' }
    ], null);

    await o.crearTipoConGuia('CERTIFICADO DEL PLAN', 'PERSONAL', [
      { titulo: 'Dar Registro de Entrada', cuerpo: '<p>Cuando llega la petición.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-7', texto: 'Registrar en Libro de entrada', explicacion: 'Solo si llega en papel.', accion: 'registrar', receta: { sentido: 'entrada' } }] },
      { titulo: 'Preparar el certificado', cuerpo: '<p>Con los datos de la ficha.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-8', texto: 'Enviar correo de aviso', explicacion: 'A la persona interesada.', accion: 'comunicar', receta: { a: 'tercero', via: 'correo', plantilla: 'pl-plan-b' } },
                { id: 'g-plan-9', texto: 'Qué falta', pregunta: true, opciones: [
                  { id: 'o-plan-1', texto: 'Falta algo', lineas: [{ id: 'g-plan-10', texto: 'Registrar de entrada el documento', explicacion: 'El que falte.', accion: 'registrar', receta: { sentido: 'entrada' } }] },
                  { id: 'o-plan-2', texto: 'Está todo', lineas: [] }] }] },
      { titulo: 'Firma del director', cuerpo: '<p>Lo firma Dirección.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-11', texto: 'Poner a la firma del Responsable', explicacion: '', accion: 'firmar' }] },
      { titulo: 'Envío del certificado', cuerpo: '<p>Al solicitante.</p>', responsable: 'yo' },
      { titulo: 'Archivar', cuerpo: '<p>Cerrar.</p>', responsable: 'yo' }
    ], null);

    /* Un tipo desactivado: su guía pasa a las listas al activarlo (con el plan ya aplicado). */
    var apagado = await o.crearTipoConGuia('Alta y actualización de datos', 'PERSONAL', [
      { titulo: 'Recoger los datos', cuerpo: '<p>Los que envía la persona.</p>', responsable: 'yo',
        guion: [{ id: 'g-plan-12', texto: 'Registrar en Libro de Entrada', explicacion: 'Con su fecha de hoy.', accion: 'registrar', receta: { sentido: 'entrada' } },
                { id: 'g-plan-13', texto: 'Comprobar la identidad', explicacion: 'Con el documento.' }] },
      { titulo: 'Grabar en Séneca', cuerpo: '<p>Dar de alta.</p>', responsable: 'yo' },
      { titulo: 'Archivar', cuerpo: '<p>Cerrar.</p>', responsable: 'yo' }
    ], null);
    apagado.desactivado = true;
    await App.guardarTipos();
  }

  window.Demo = window.Demo || {};
  window.Demo.planGuias = { construir: construir };
})();
