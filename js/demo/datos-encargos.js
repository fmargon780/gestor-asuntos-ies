/* ============================================================
   demo/datos-encargos.js — los encargos de los directivos (fila 289,
   docs/ENCARGOS-DE-DIRECTIVOS.md) en la copia de pruebas:
     - «Jefa de estudios de prueba»: uno sin atender (con un documento y un
       alumno elegido), uno en marcha (de un asunto de Jefatura con hitos),
       uno terminado (el del asunto archivado de Jefatura) y uno que no procede;
     - «Directora de prueba»: uno sin atender.
   Todo inventado. Lo llama `Demo.perfil.construir` (js/demo/datos-perfil.js)
   al final, ya con los asuntos montados.
   ============================================================ */
(function () {
  'use strict';

  async function pdf(texto) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    doc.addPage([595, 842]).drawText(texto, { x: 50, y: 780, size: 12, font: fuente });
    return doc.save();
  }

  function claveDe(trozoTercero, estado) {
    var registro = App.E.registro.asuntos || {};
    return Object.keys(registro).filter(function (n) {
      var f = registro[n] || {};
      return String(f.tercero || '').indexOf(trozoTercero) !== -1 && f.tipo === 'MATRICULA' && (!estado || f.estado === estado);
    })[0] || '';
  }

  async function construir(o, nombres) {
    nombres = nombres || {};
    var JEFA = 'Jefa de estudios de prueba', ORGANO_JEFA = 'Jefatura de Estudios';
    function id(dias, k, quien) { return o.hace(dias).slice(2).replace(/-/g, '') + '-09' + k + '000-' + quien; }
    function cuando(dias) { return o.hace(dias) + 'T09:00:00.000Z'; }

    var pablo = claveDe('Aguilar Ponce, Pablo', 'abierto');
    var pabloFicha = (App.E.registro.asuntos || {})[pablo] || {};
    var idSin = id(1, '10', 'jefa'), idMarcha = id(6, '20', 'jefa'), idFin = id(20, '30', 'jefa'), idNo = id(9, '40', 'jefa'), idDir = id(2, '10', 'directora');

    /* El documento del encargo sin atender, en su carpeta. */
    var carpeta = await Carpetas.crear(await Carpetas.crear(App.E.gestor, Encargos.CARPETA), idSin);
    await Carpetas.escribirBytes(carpeta, 'Justificante de matrícula (prueba).pdf', await pdf('Justificante de matrícula de Iker Delgado Prieto (copia de pruebas)'), 'application/pdf');

    await Encargos.cambiar(function (d) {
      d.encargos.push(
        { id: idSin, de: JEFA, organo: ORGANO_JEFA, cuando: cuando(1), estado: 'sin-atender',
          texto: 'Hay que preparar el cambio de grupo de Iker Delgado Prieto a 2º A. La familia lo ha pedido por escrito y adjunto el justificante.',
          afecta: { nombre: 'Delgado Prieto, Iker', categoria: 'ALUMNADO', clave: '2100005', unidad: '2º B' },
          paraCuando: o.hace(-10), documentos: ['Justificante de matrícula (prueba).pdf'] },
        { id: idMarcha, de: JEFA, organo: ORGANO_JEFA, cuando: cuando(6), estado: 'asunto',
          texto: 'Revisar la matrícula de Pablo Aguilar Ponce: falta documentación de la familia.',
          afecta: { nombre: 'Aguilar Ponce, Pablo', categoria: 'ALUMNADO', clave: '2100002', unidad: '3º A' },
          asunto: { numero: pabloFicha.numero || '', nombre: pablo }, atendidoPor: 'Revisor', atendidoEl: cuando(5) },
        { id: idFin, de: JEFA, organo: ORGANO_JEFA, cuando: cuando(20), estado: 'terminado',
          texto: 'Cerrar el expediente de matrícula de Ana Klein Soto, ya resuelto con la familia.',
          afecta: { nombre: 'Klein Soto, Ana', categoria: 'ALUMNADO', clave: '2100012', unidad: '' },
          asunto: { numero: '', nombre: nombres.archivadoJefatura || '' }, atendidoPor: 'Revisor', atendidoEl: cuando(14) },
        { id: idNo, de: JEFA, organo: ORGANO_JEFA, cuando: cuando(9), estado: 'no-procede',
          texto: 'Quitar del listado de faltas a todo 1º A durante la semana de excursión.',
          afecta: { texto: 'Todo el grupo 1º A' },
          motivo: 'Eso se hace en Séneca, no es un asunto del centro.', atendidoPor: 'Revisor', atendidoEl: cuando(8) },
        { id: idDir, de: 'Directora de prueba', organo: 'Dirección', cuando: cuando(2), estado: 'sin-atender',
          texto: 'Preparar la carta de bienvenida al profesorado nuevo para el claustro de septiembre.', afecta: null, paraCuando: '', documentos: [] }
      );
    });
    if (pablo) await App.anotarLista(pablo, 'encargos', { anadir: [{ id: idMarcha, de: JEFA, cuando: cuando(6) }] });
  }

  window.Demo = window.Demo || {};
  window.Demo.encargos = { construir: construir };
})();
