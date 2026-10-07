/* ============================================================
   demo/datos-hacer-hito.js — lo que necesita «Hacer este hito»
   (fila 285, docs/HACER-ESTE-HITO.md) en la copia de pruebas:
     1. una plantilla de Word («Certificado de notas») en _GESTOR/PLANTILLAS;
     2. el tipo CERTIFICADO DE NOTAS: su primer hito lleva tres tareas con acción
        (generar con esa plantilla, registrar en Séneca, comunicar por correo);
     3. un asunto con ese hito sin tocar (para pulsar «Hacer este hito»);
     4. otro con el hito ya «esperando el sello»: su PDF y, en la carpeta, el
        papel con el sello de registro, para que la pasada de fondo lo coloque
        sola al entrar y salga «1 listos para enviar».

   Todo inventado. js/demo/datos.js llama a `Demo.hacer.crearPlantilla()`,
   `Demo.hacer.guion(id)` y `Demo.hacer.construir({...})`.
   ============================================================ */
(function () {
  'use strict';

  var FICHERO = 'Certificado de notas.docx';

  async function crearPlantilla() {
    var P = window.Demo.plantilla;
    var bytes = P.docx([
      P.p([P.r('CERTIFICADO DE NOTAS', true)], true),
      P.p([P.r('Se certifica que {{NOMBRE NATURAL}} ha obtenido las calificaciones del curso actual en este centro.')]),
      P.p([P.r('En Localidad de pruebas, a {{HOY}}')])
    ]);
    var carpeta = await PlantillasDocumento._interno.carpetaDePlantillas();
    await Carpetas.escribirBytes(carpeta, FICHERO, bytes, P.WORD);
    var id = '';
    await Plantillas.guardar(App.E.gestor, function (actual) {
      id = Plantillas.idNuevoDocumento();
      actual.documentos.push({ id: id, tipo: 'CERTIFICADO DE NOTAS', categoria: 'ALUMNADO', nombre: 'Certificado de notas',
        fichero: FICHERO, tipoDocumento: 'CERTIFICADO', texto: '', firmante: '', vistoBueno: '', conLogoCentro: false });
      return actual;
    });
    return id;
  }

  /* Las tareas del primer hito del tipo. */
  function guion(idPlantilla) {
    return [
      { id: 'g-hacer-generar', texto: 'Generar el certificado', accion: 'generar', receta: { plantilla: idPlantilla } },
      { id: 'g-hacer-registrar', texto: 'Registrar la salida en Séneca', accion: 'registrar' },
      { id: 'g-hacer-comunicar', texto: 'Enviar el certificado por correo', accion: 'comunicar', receta: { via: 'correo', a: 'tercero' } }
    ];
  }

  function fechaDelSello() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  async function construir(o) {
    var hoy = o.hace(0);
    /* 1. Sin tocar: el botón «Hacer este hito». */
    await o.crearAsunto(o.tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Vidal Soto, Irene', id: '2100030' }), hoy, {
      abiertoEl: new Date().toISOString()
    });

    /* 2. Esperando el sello, con su documento y el papel sellado ya en la carpeta. */
    var clave = await o.crearAsunto(o.tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Moreno Sanz, Hugo', id: '2100031' }), hoy, {
      abiertoEl: new Date().toISOString()
    });
    var carpeta = await App.E.abiertos.getDirectoryHandle(clave);
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    async function pdf(texto, sello) {
      var doc = await PDFLib.PDFDocument.create();
      var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      var pagina = doc.addPage([595, 842]);
      pagina.drawText(texto, { x: 50, y: 780, size: 12, font: fuente });
      if (sello) pagina.drawText('2026/29700692/M000000000700SALIDA Fecha: ' + fechaDelSello() + ' 09:30:00', { x: 50, y: 40, size: 9, font: fuente });
      return doc.save();
    }
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombrePdf = Nombres.montarDocumento({ fecha: hoy, tipo: 'CERTIFICADO', extension: 'pdf', numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(carpeta, nombrePdf, await pdf('Certificado de notas de Hugo Moreno Sanz (copia de pruebas)', false), 'application/pdf');
    await DocumentosDatos.anotar(clave, numeroDoc, { tipo: 'CERTIFICADO', fecha: hoy, texto: '', campos: [], valores: {}, registros: [] });
    await Carpetas.escribirBytes(carpeta, '29700692 - Fuente Lucena (certificado).pdf',
      await pdf('Certificado de notas de Hugo Moreno Sanz (copia de pruebas)', true), 'application/pdf');
    var h = (await Hitos.hitosDe(clave))[0];
    await Hitos.anadirDocumento(clave, h.id, nombrePdf);
    await Hitos.marcarGuion(clave, h.id, 'g-hacer-generar', { hecho: true });
    await Hitos.guardarCampos(clave, h.id, { cadena: { estado: 'esperando-sello', tarea: 'g-hacer-registrar', documento: nombrePdf,
      quien: 'Revisor', cuando: new Date(Date.now() - 3600000).toISOString() } });
    await construirEsperas(o);
    if (window.Demo.perfil) await Demo.perfil.construir(o);   /* fila 287 */
  }

  /* Fila 286 (docs/ESPERAS-QUE-SE-CIERRAN.md): un papel suelto del tercero de un asunto que está en espera (el de Marta,
     «Esperar el parte de alta») y otro asunto en espera con la fecha límite del hito ya pasada. */
  async function construirEsperas(o) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    doc.addPage([595, 842]).drawText('Parte de alta de Marta Otero Campos (copia de pruebas)', { x: 50, y: 780, size: 12, font: fuente });
    await Carpetas.escribirBytes(App.E.abiertos, 'parte de alta Otero Campos Marta.pdf', await doc.save(), 'application/pdf');

    var clave = await o.crearAsunto(o.tipoBaja, 'PERSONAL', Nombres.terceroPersonal({ nombre: 'Reyes Palma, Fernando', documento: '22334455B' }), o.hace(12), {
      abiertoEl: o.hace(12) + 'T09:00:00.000Z'
    });
    var hitos = await Hitos.hitosDe(clave);
    await Hitos.marcar(clave, hitos[0].id, 'hecho', 'Parte de baja recibido.');
    await Hitos.guardarCampos(clave, hitos[1].id, { fecha: o.hace(5) });
  }

  /* Al acabar de montar: que la pasada de fondo coloque el PDF sellado y salga el aviso de Inicio. */
  async function alAcabar() {
    if (!window.HacerEsteHitoSello) return;
    for (var i = 0; i < 20 && window.ColaGuardado && ColaGuardado.hayGuardado(); i++) await new Promise(function (ok) { setTimeout(ok, 250); });
    HacerEsteHitoSello._reiniciar();
    await HacerEsteHitoSello.pasada();
    await HacerEsteHitoSello.avisar();
  }

  window.Demo = window.Demo || {};
  window.Demo.hacer = { crearPlantilla: crearPlantilla, guion: guion, construir: construir, alAcabar: alAcabar };
})();
