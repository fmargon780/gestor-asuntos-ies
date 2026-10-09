/* ============================================================
   demo/datos-plantillas-pantalla.js — lo que necesita la pantalla
   «Plantillas» de Herramientas (fila 320, docs/PANTALLA-DE-PLANTILLAS.md,
   punto 8) en la copia de pruebas:
     - una plantilla de Word que no usa ningún hito («Nota de baja médica»);
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
    await docx('Justificante común.docx', 'JUSTIFICANTE');
    await Plantillas.guardar(App.E.gestor, function (actual) {
      function fila(tipo, categoria, nombre, fichero, tipoDocumento) {
        actual.documentos.push({ id: Plantillas.idNuevoDocumento(), tipo: tipo, categoria: categoria, nombre: nombre, fichero: fichero,
          tipoDocumento: tipoDocumento, texto: '', firmante: '', vistoBueno: '', conLogoCentro: false });
      }
      fila('BAJA MEDICA', 'PERSONAL', 'Nota de baja médica', 'Nota de baja médica.docx', 'NOTA');
      fila('FACTURA', 'EMPRESAS', 'Justificante de pago', 'Justificante común.docx', 'JUSTIFICANTE');
      fila('SEGURO ESCOLAR', 'ALUMNADO', 'Justificante de cobro', 'Justificante común.docx', 'JUSTIFICANTE');
      return actual;
    });
  }

  window.Demo = window.Demo || {};
  window.Demo.plantillasPantalla = { construir: construir };
})();
