/* ============================================================
   demo/datos-tutor.js — lo que necesita el correo al tutor o tutora del
   grupo (fila 299, docs/CORREO-AL-TUTOR-DEL-GRUPO.md) en la copia de pruebas:
     1. la relación de funciones tutoriales de este curso (un PDF «Función Tutorial»
        en la carpeta de datos, dibujado como el de Séneca): 4º A con un tutor que
        tiene correo en PERSONAL (Otero Campos, Marta), 1º Bach A con una tutora sin
        correo (Cabello Ruiz, Esperanza, que js/demo/datos.js da de alta en RelPerCen
        sin correo), 2º B con dos tutores en vigor (Reyes Palma, Fernando y Uceda Molina,
        Patricia) y 1º C sin ninguno;
     2. el tipo SANCION, con el hito «Notificar al tutor/a» y una tarea de comunicar sin
        detalles (la pasada de js/informar-al-tutor.js, que se lanza al acabar de montar,
        lo deja como «Informar al tutor/a»), y cuatro asuntos abiertos suyos: Jimenez
        Rubio, Mateo (4º A, con un PDF NOTIFICACION en su carpeta), Fuentes Calvo, Rubén
        (1º Bach A, sin él), Delgado Prieto, Iker (2º B, dos tutores) y Klein Soto, Ana
        (1º C, sin tutor);
     3. un asunto de otro tipo (INCIDENCIA DE AULA, también de Jimenez Rubio, Mateo, 4º A: los
        demás alumnos de 4º A ya tienen asuntos que otras pruebas buscan por su nombre) cuyo hito
        lleva la tarea «Avisar a la tutoría», sin detalles.
   Todo inventado. `Demo.tutor.construir({ crearTipoConGuia, crearAsunto, hace })` y
   `Demo.tutor.alAcabar()` los llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  async function escribirTutorias() {
    var hoy = new Date();
    var inicio = hoy.getMonth() >= 8 ? hoy.getFullYear() : hoy.getFullYear() - 1;
    var periodo = '01/09/' + inicio + ' - 31/08/' + (inicio + 1);
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var p = doc.addPage([595, 842]);
    var y = 800;
    function linea(trozos, salto) {
      trozos.forEach(function (t) { p.drawText(t[1], { x: t[0], y: y, size: 8, font: fuente }); });
      y -= (salto || 14);
    }
    var X = { unidad: 40, nombre: 110, dni: 330, periodo: 420 };
    linea([[40, 'Relación de funciones tutoriales']]);
    linea([[40, 'D./Dña. Directora del centro certifica que durante el curso escolar ' + inicio + '/' + (inicio + 1) + ' han ejercido:']], 20);
    linea([[40, 'Funciones tutoriales procedentes de tutorías de unidades']]);
    linea([[X.unidad, 'Unidad'], [X.nombre, 'Empleado/a'], [X.dni, 'D.N.I.'], [X.periodo, 'Periodo']]);
    [['4º A', 'Otero Campos, Marta', '11223344A'], ['1º Bach A', 'Cabello Ruiz, Esperanza', '77889900G'],
     ['2º B', 'Reyes Palma, Fernando', '22334455B'], ['2º B', 'Uceda Molina, Patricia', '33445566C']].forEach(function (f) {
      linea([[X.unidad, f[0]], [X.nombre, f[1]], [X.dni, f[2]], [X.periodo, periodo]]);
    });
    y -= 6;
    linea([[40, 'Funciones tutoriales correspondientes a Pedagogía Terapéutica, Audición y Lenguaje y Diversificación Curricular']]);
    linea([[X.nombre, 'Empleado/a'], [X.dni, 'D.N.I.'], [X.periodo, 'Periodo']]);
    linea([[X.nombre, 'Vidal Cano, Ramón'], [X.dni, '44556677D'], [X.periodo, periodo]], 30);
    linea([[40, 'Pág. 1 de 1'], [300, 'Ref.Doc.: CerFunTut']]);
    await Carpetas.escribirBytes(App.E.datos, 'Función Tutorial ' + inicio + '-' + (inicio + 1) + '.pdf', await doc.save(), 'application/pdf');
    if (window.TablasDatos) TablasDatos.olvidar();
  }

  async function pdf(texto) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    doc.addPage([595, 842]).drawText(texto, { x: 50, y: 780, size: 12, font: fuente });
    return doc.save();
  }

  async function construir(o) {
    await escribirTutorias();
    /* El sexo de los cuatro alumnos (su RegAlum no trae la columna «Sexo»): «al alumno» sale ya resuelto.
       Una sola escritura de `sexos.json` (el montaje de la demostración tiene que seguir siendo rápido). */
    try {
      var sexos = (await Carpetas.leerJson(App.E.gestor, 'sexos.json')) || {};
      [['2100011', 'Jimenez Rubio, Mateo', 'H'], ['2100007', 'Fuentes Calvo, Rubén', 'H'], ['2100005', 'Delgado Prieto, Iker', 'H'],
       ['2100012', 'Klein Soto, Ana', 'M']].forEach(function (a) { sexos[Genero.claveDe({ id: a[0], nombre: a[1] }, 'ALUMNADO')] = a[2]; });
      await Copias.guardar(App.E.gestor, 'sexos.json', sexos);
      await Genero.leer();
    } catch (e) { /* sin el sexo, la plantilla deja la forma doble */ }

    var sancion = await o.crearTipoConGuia('SANCION', 'ALUMNADO', [
      { titulo: 'Notificar al tutor/a', cuerpo: '<p>Que la tutoría sepa qué medida se ha tomado con su alumno o alumna.</p>', responsable: 'yo',
        guion: [{ id: 'g-demo-tutor-avisar', texto: 'Avisar al tutor/a', accion: 'comunicar' }] },
      { titulo: 'Entregar la notificación a la familia', cuerpo: '<p>En mano, con acuse de recibo.</p>', responsable: 'yo' }
    ], null);
    var alumnos = [['Jimenez Rubio, Mateo', '2100011', true], ['Fuentes Calvo, Rubén', '2100007', false],
                   ['Delgado Prieto, Iker', '2100005', false], ['Klein Soto, Ana', '2100012', false]];
    for (var i = 0; i < alumnos.length; i++) {
      var clave = await o.crearAsunto(sancion, 'ALUMNADO', Nombres.terceroAlumno({ nombre: alumnos[i][0], id: alumnos[i][1] }), o.hace(0), {
        abiertoEl: new Date().toISOString()
      });
      if (!alumnos[i][2]) continue;
      var carpeta = await App.E.abiertos.getDirectoryHandle(clave);
      var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
      var nombre = Nombres.montarDocumento({ fecha: o.hace(0), tipo: 'NOTIFICACION', extension: 'pdf', numeroDoc: numeroDoc });
      await Carpetas.escribirBytes(carpeta, nombre, await pdf('Notificación de la medida disciplinaria (copia de pruebas)'), 'application/pdf');
      await DocumentosDatos.anotar(clave, numeroDoc, { tipo: 'NOTIFICACION', fecha: o.hace(0), texto: '', campos: [], valores: {}, registros: [] });
    }

    var incidencia = await o.crearTipoConGuia('INCIDENCIA DE AULA', 'ALUMNADO', [
      { titulo: 'Comunicar la incidencia', cuerpo: '<p>Que la tutoría lo sepa el mismo día.</p>', responsable: 'yo',
        guion: [{ id: 'g-demo-tutoria-avisar', texto: 'Avisar a la tutoría', accion: 'comunicar' }] }
    ], null);
    await o.crearAsunto(incidencia, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Jimenez Rubio, Mateo', id: '2100011' }), o.hace(0), {
      abiertoEl: new Date().toISOString()
    });
  }

  /* Al acabar de montar (ya recargado): la pasada que deja «Informar al tutor/a» (js/informar-al-tutor.js). */
  async function alAcabar() {
    if (!window.InformarAlTutor) return;
    for (var i = 0; i < 40 && window.ColaGuardado && ColaGuardado.hayGuardado(); i++) await new Promise(function (ok) { setTimeout(ok, 25); });
    try { await InformarAlTutor.pasada({ forzar: true }); } catch (e) { /* sin la pasada, la demostración sigue igual */ }
  }

  window.Demo = window.Demo || {};
  window.Demo.tutor = { construir: construir, alAcabar: alAcabar };
})();
