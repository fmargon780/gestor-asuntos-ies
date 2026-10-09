/* ============================================================
   demo/datos-plantillas-pantalla.js — lo que necesita la pantalla
   «Plantillas» de Herramientas (fila 320, docs/PANTALLA-DE-PLANTILLAS.md,
   punto 8) en la copia de pruebas:
     - dos plantillas de Word que no usa ningún hito («Nota de baja médica» y, fila 322, «Aviso de revisión», para «Retocar»);
     - dos de tipos de asunto distintos que comparten el mismo .docx
       («Justificante de pago» y «Justificante de cobro»).
   «Certificado de notas» (que sí usa un hito) la crea js/demo/datos-hacer-hito.js;
   las de correo, js/demo/datos.js. Todo inventado.
   ============================================================ */
(function () {
  'use strict';

  async function construir() {
    var P = window.Demo.plantilla;
    if (!P) return;
    var carpeta = await PlantillasDocumento._interno.carpetaDePlantillas();
    async function docx(nombre, titulo) {
      var bytes = P.docx([
        P.p([P.r(titulo, true)], true),
        P.p([P.r('Se hace constar que {{NOMBRE NATURAL}} figura en los registros de este centro.')]),
        P.p([P.r('En Localidad de pruebas, a {{HOY}}')])
      ]);
      await Carpetas.escribirBytes(carpeta, nombre, bytes, P.WORD);
    }
    await docx('Nota de baja médica.docx', 'NOTA DE BAJA MÉDICA');
    /* Fila 322: «Aviso de revisión», para probar «Retocar»: una errata («el alunmo»), un hueco, «2025» dos veces y un párrafo que sobra. */
    await Carpetas.escribirBytes(carpeta, 'Aviso de revisión.docx', P.docx([
      P.p([P.r('AVISO DE REVISIÓN', true)], true),
      P.p([P.r('Se informa de que el alunmo {{NOMBRE NATURAL}} debe presentar su documentación antes del 30 de junio de 2025.')]),
      P.p([P.r('Este aviso vale para el curso 2025 y no sustituye a ningún otro.')]),
      P.p([P.r('En caso de no presentar los documentos, se archivará el expediente sin más trámite.')]),
      P.p([P.r('En Localidad de pruebas, a {{HOY}}')])
    ]), P.WORD);
    await docx('Justificante común.docx', 'JUSTIFICANTE');
    await Plantillas.guardar(App.E.gestor, function (actual) {
      function fila(tipo, categoria, nombre, fichero, tipoDocumento) {
        actual.documentos.push({ id: Plantillas.idNuevoDocumento(), tipo: tipo, categoria: categoria, nombre: nombre, fichero: fichero,
          tipoDocumento: tipoDocumento, texto: '', firmante: '', vistoBueno: '', conLogoCentro: false });
      }
      fila('BAJA MEDICA', 'PERSONAL', 'Nota de baja médica', 'Nota de baja médica.docx', 'NOTA');
      fila('BAJA MEDICA', 'PERSONAL', 'Aviso de revisión', 'Aviso de revisión.docx', 'AVISO');
      fila('FACTURA', 'EMPRESAS', 'Justificante de pago', 'Justificante común.docx', 'JUSTIFICANTE');
      fila('SEGURO ESCOLAR', 'ALUMNADO', 'Justificante de cobro', 'Justificante común.docx', 'JUSTIFICANTE');
      return actual;
    });
    /* Fila 321: con `&fueradeuso=1`, «Certificado de notas» (Word, en la tarea de generar de su hito) y «Acuse de recibo del parte»
       (correo, en la tarea de comunicar del primer hito de BAJA MEDICA) arrancan fuera de uso. */
    if (/(^|[?&])fueradeuso=1(&|$)/.test(location.search)) {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        (actual.documentos || []).concat(actual.lista || []).forEach(function (p) {
          if (p.nombre === 'Certificado de notas' || p.nombre === 'Acuse de recibo del parte') {
            p.fueraDeUso = { desde: new Date().toISOString(), por: 'Revisor' };
          }
        });
        return actual;
      });
    }
  }

  window.Demo = window.Demo || {};
  window.Demo.plantillasPantalla = { construir: construir };
})();
