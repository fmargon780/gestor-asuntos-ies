/* ============================================================
   demo/datos-notas.js — las notas de directivos (fila 290,
   docs/NOTAS-DE-DIRECTIVOS.md) en la copia de pruebas: «Jefa de estudios de
   prueba» deja una nota sin ver, con un documento, en la matrícula de Marina
   Aguilar Ponce, y una nota ya vista (por «Revisor») en la de Pablo Aguilar
   Ponce. Todo inventado. Lo llama `Demo.perfil.construir`.
   ============================================================ */
(function () {
  'use strict';

  function claveDe(trozo) {
    var registro = App.E.registro.asuntos || {};
    return Object.keys(registro).filter(function (n) {
      var f = registro[n] || {};
      return String(f.tercero || '').indexOf(trozo) !== -1 && f.tipo === 'MATRICULA' && f.estado === 'abierto';
    })[0] || '';
  }

  async function pdf(texto) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    doc.addPage([595, 842]).drawText(texto, { x: 50, y: 780, size: 12, font: fuente });
    return doc.save();
  }

  async function construir(o) {
    var JEFA = 'Jefa de estudios de prueba', ORGANO = 'Jefatura de Estudios';
    var marina = claveDe('Aguilar Ponce, Marina'), pablo = claveDe('Aguilar Ponce, Pablo');
    var idDoc = o.hace(1).slice(2).replace(/-/g, '') + '-101500-jefa-de-estudios-de-prue';
    if (marina) {
      var carpeta = await Carpetas.crear(await Carpetas.crear(App.E.gestor, NotasDirectivos.CARPETA), idDoc);
      await Carpetas.escribirBytes(carpeta, 'Informe de la tutora (prueba).pdf', await pdf('Informe de la tutora sobre Marina (copia de pruebas)'), 'application/pdf');
      var cuando = o.hace(1) + 'T10:15:00.000Z';
      await App.anotarLista(marina, 'notas', { anadir: [{
        texto: 'Aquí tienes el informe de la tutora que faltaba para la matrícula.', quien: JEFA, cuando: cuando,
        deDirectivo: true, organo: ORGANO, documentos: ['Informe de la tutora (prueba).pdf'], carpeta: idDoc
      }], extra: { notaEl: cuando, notaPor: JEFA } });
    }
    if (pablo) {
      var antes = o.hace(3) + 'T09:30:00.000Z';
      await App.anotarLista(pablo, 'notas', { anadir: [{
        texto: 'La familia ya ha entregado la documentación en Jefatura.', quien: JEFA, cuando: antes,
        deDirectivo: true, organo: ORGANO, documentos: [], vistaPor: 'Revisor', vistaEl: o.hace(2) + 'T08:00:00.000Z'
      }], extra: { notaEl: antes, notaPor: JEFA } });
    }
  }

  window.Demo = window.Demo || {};
  window.Demo.notas = { construir: construir };
})();
