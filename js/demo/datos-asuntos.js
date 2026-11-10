/* ============================================================
   demo/datos-asuntos.js — los asuntos abiertos de la copia de pruebas y su ficha sin carpeta.
   (fila 560, docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/demo/datos.js sin cambiar nada; el código es el de siempre,
   movido tal cual). Se carga después de js/demo/datos-resto.js y antes que js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  window.Demo.datos = window.Demo.datos || {};
  var I = window.Demo.datos._interno = window.Demo.datos._interno || {};   /* lo que se comparten las piezas de datos.js */

  var hace = I.hace;
  var archivarDeMentira = I.archivarDeMentira;
  var PDF_DE_MENTIRA = I.PDF_DE_MENTIRA;

  /* ---------- asuntos ---------- */

  async function crearAsunto(tipoObj, categoria, tercero, fecha, extra) {
    extra = extra || {};
    /* Fila 239: los asuntos de la demostración llevan número (estructura
       fija); uno, `sinNumero`, se deja como los de antes para ver los dos. */
    var numero = extra.sinNumero ? '' : (await Numeros.reservar('asuntos', '')).numero;
    var montado = Nombres.montarAsunto({
      fecha: fecha, tipo: Nombres.tipoParaCarpeta(tipoObj), categoria: categoria,
      curso: '', grupo: '', campos: [], descripcion: extra.descripcion || '', tercero: tercero, numero: numero
    });
    var nombre = montado.nombre;
    await Carpetas.crear(App.E.abiertos, nombre);
    var datos = Object.assign({
      estado: 'abierto', tipo: tipoObj.tipo, categoria: categoria, tercero: tercero,
      descripcion: extra.descripcion || '', abiertoEl: extra.abiertoEl || U.ahora(),
      abiertoPor: App.E.usuario || 'Revisor'
    }, numero ? { numero: numero } : {}, extra.datos || {});
    await App.anotar(nombre, datos);
    return nombre;
  }

  /* Fila 288 (docs/AJUSTES-EN-CUATRO-PESTANAS.md): una ficha cuya carpeta se renombró por fuera de la
     aplicación: está en asuntos.json y no en ninguna carpeta, para que Ajustes → Problemas →
     «Fichas sin carpeta» tenga algo que enseñar. */
  async function crearFichaSinCarpeta(tipos) {
    var tercero = Nombres.terceroEmpresa({ nombre: 'Ferretería Los Álamos', nif: '55443322Z' });
    var montado = Nombres.montarAsunto({
      fecha: hace(40), tipo: Nombres.tipoParaCarpeta(tipos.FACTURA), categoria: 'EMPRESAS',
      curso: '', grupo: '', campos: [], descripcion: '', tercero: tercero, numero: ''
    });
    /* Directo al registro, sin pasar por `App.anotar` (que también le montaría hitos, y entonces saldrían «Hitos huérfanos»). */
    await App.guardarRegistroFresco(function (registro) {
      registro.asuntos[montado.nombre] = {
        estado: 'abierto', tipo: tipos.FACTURA.tipo, categoria: 'EMPRESAS', tercero: tercero,
        descripcion: '', abiertoEl: hace(40) + 'T09:00:00.000Z', abiertoPor: App.E.usuario || 'Revisor', notas: []
      };
    });
    return montado.nombre;
  }

  /* Fila 239: un documento con número (su registro vive en la ficha) y uno de
     antes (con el registro en el nombre), para ver los dos. */
  async function crearDocumentosDeDemostracion(asuntoNombre) {
    var carpeta = await Carpetas.crear(App.E.abiertos, asuntoNombre);
    var fecha = hace(4);
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombreNuevo = Nombres.montarDocumento({ fecha: fecha, tipo: 'SOLICITUD', extension: 'pdf', numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(carpeta, nombreNuevo, PDF_DE_MENTIRA, 'application/pdf');
    await DocumentosDatos.anotar(asuntoNombre, numeroDoc, {
      tipo: 'SOLICITUD', fecha: fecha, texto: 'Curso 26-27', campos: [], valores: {},
      registros: [{ ano: fecha.slice(2, 4), sentido: 'E', modo: 'M', numero: '0123', fecha: hace(1), fuente: 'sello', codigo: Nombres.codigoRegistro({ ano: fecha.slice(2, 4), sentido: 'E', modo: 'M', numero: '0123' }) }]
    });
    var antiguo = Nombres.montarDocumento({ fecha: hace(9), codigo: fecha.slice(2, 4) + 'EM0098', tipo: 'INFORME', curso: 'Antiguo', extension: 'pdf' });
    await Carpetas.escribirBytes(carpeta, antiguo, PDF_DE_MENTIRA, 'application/pdf');
  }

  /* Fila 233: un PDF con el sello de registro de Séneca suelto en la carpeta, sin ningún
     documento anterior (el certificado firmado y descargado), para probar «Es un documento
     nuevo» en el aviso ámbar de la ficha. */
  async function crearSelladoSuelto(asuntoNombre) {
    try {
      var PDFLib = await PdfHerramientas.cargarPdfLib();
      var doc = await PDFLib.PDFDocument.create();
      var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      var pagina = doc.addPage([595, 842]);
      pagina.drawText('Certificado firmado por la Direccion (copia de pruebas)', { x: 50, y: 780, size: 12, font: fuente });
      var d = new Date(Date.now() - 86400000);
      var fecha = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
      pagina.drawText(d.getFullYear() + '/29700692/M000000000657SALIDA Fecha: ' + fecha + ' 10:15:00', { x: 50, y: 40, size: 9, font: fuente });
      var carpeta = await App.E.abiertos.getDirectoryHandle(asuntoNombre);
      await Carpetas.escribirBytes(carpeta, '29700692 - Fuente Lucena.pdf', await doc.save(), 'application/pdf');
    } catch (e) { /* sin el PDF de ejemplo, la demostración sigue igual */ }
  }

  async function marcarPrimerHito(nombre, estado, nota) {
    var hitos = await Hitos.hitosDe(nombre);
    if (hitos && hitos[0]) await Hitos.marcar(nombre, hitos[0].id, estado, nota || '');
  }

  async function crearAsuntosAbiertos(tipos) {
    var marina = Nombres.terceroAlumno({ nombre: 'Aguilar Ponce, Marina', id: '2100001' });
    var pablo = Nombres.terceroAlumno({ nombre: 'Aguilar Ponce, Pablo', id: '2100002' });
    var carla = Nombres.terceroAlumno({ nombre: 'Espejo Montes, Carla', id: '2100006' });
    var diego = Nombres.terceroAlumno({ nombre: 'Herrera Lozano, Diego', id: '2100009' });
    var marta = Nombres.terceroPersonal({ nombre: 'Otero Campos, Marta', documento: '11223344A' });
    var dobla = Nombres.terceroEmpresa({ nombre: 'Suministros Escolares Dobla, S.L.', nif: 'B12345678' });

    /* 1. recién creado, sin nada marcado todavía. */
    await crearAsunto(tipos.MATRICULA, 'ALUMNADO', marina, hace(0), {
      abiertoEl: new Date().toISOString(),
      datos: { via: 'PRESENCIAL', viaDato: '' }
    });

    /* 2. con el primer hito ya hecho: "esperamos a otros" (paso 2 toca
       espera de verdad solo en BAJA MEDICA; este queda "nos toca"). */
    var pabloClave = await crearAsunto(tipos.MATRICULA, 'ALUMNADO', pablo, hace(5), {
      abiertoEl: hace(5) + 'T09:00:00.000Z'
    });
    await marcarPrimerHito(pabloClave, 'hecho', 'Documentación recibida y comprobada.');
    await crearDocumentosDeDemostracion(pabloClave);
    if (window.Demo.firmas) await Demo.firmas.construir(pabloClave, hace);   /* fila 515 */
    /* Fila 281: un PDF con texto de dos páginas y uno con una tabla (js/demo/datos-plantilla.js). */
    if (window.Demo.plantilla) await Demo.plantilla.construirPdf({ pabloClave: pabloClave, hace: hace });
    /* Fila 229: un registro con líneas de los dos tipos (escritas a mano y automáticas)
       en dos hitos distintos, y alguna sin hito. */
    var hitosPablo = await Hitos.hitosDe(pabloClave);
    if (hitosPablo.length > 1) {
      await Notas.anadir({ nombre: pabloClave }, 'Llama la madre: traerá la matrícula firmada el viernes.',
        { hito: hitosPablo[0].id, hitoTitulo: hitosPablo[0].titulo || '' });
      await Notas.anadir({ nombre: pabloClave }, 'Pasa por secretaría a recoger el impreso.');
      await Notas.anadir({ nombre: pabloClave }, 'Dice la directora que se admite fuera de plazo.',
        { hito: hitosPablo[1].id, hitoTitulo: hitosPablo[1].titulo || '' });
      await Hitos.anadirNota(pabloClave, hitosPablo[1].id, 'Generado «Justificante de matrícula»');
      await Hitos.anadirNota(pabloClave, hitosPablo[1].id, 'Tarea hecha: Comprobar la documentación');
    }

    /* 3. con la fecha límite ya vencida. */
    var carlaClave = await crearAsunto(tipos.CERTIFICADO, 'ALUMNADO', carla, hace(20), {
      abiertoEl: hace(20) + 'T09:00:00.000Z',
      /* Fila 305, ASUNTO C: sin «quién lo pide», vía correo, con un correo que el alumno ya tiene en su fichero. */
      datos: { limite: hace(6), limiteEl: hace(20) + 'T09:00:00.000Z', limitePor: 'Revisor', via: 'CORREO', viaDato: 'tutor.carla@correo-demo.es' }
    });
    await crearSelladoSuelto(carlaClave);

    /* 4. reservado (no enseña el nombre del tercero en las listas). */
    await crearAsunto(tipos.CERTIFICADO, 'ALUMNADO', diego, hace(2), {
      abiertoEl: hace(2) + 'T09:00:00.000Z',
      datos: { reservado: true }
    });

    /* 5. de personal, "esperando a" el interesado (segundo hito, toca:espera). */
    var martaClave = await crearAsunto(tipos['BAJA MEDICA'], 'PERSONAL', marta, hace(10), {
      abiertoEl: hace(10) + 'T09:00:00.000Z'
    });
    await marcarPrimerHito(martaClave, 'hecho', 'Parte de baja recibido.');
    /* Fila 280: lo que necesita «Convertir en plantilla» (js/demo/datos-plantilla.js). */
    if (window.Demo.plantilla) await Demo.plantilla.construir({ carlaClave: carlaClave, martaClave: martaClave, hace: hace, pdf: PDF_DE_MENTIRA });

    /* 6b. fila 241: dos cobros del seguro escolar todavía abiertos, con su importe. */
    var alvaro = Nombres.terceroAlumno({ nombre: 'Bermúdez Ortiz, Álvaro', id: '2100003' });
    var noa = Nombres.terceroAlumno({ nombre: 'Castro Reina, Noa', id: '2100004' });
    /* Fila 249: los tres primeros, ya terminados y en «Por liquidar» (el último sin
       importe); el cuarto sigue abierto, para dar por hecho su último hito. */
    var porLiquidar = { desde: hace(1), auto: false };
    var claveAlvaro = await crearAsunto(tipos['SEGURO ESCOLAR'], 'ALUMNADO', alvaro, hace(1), {
      abiertoEl: hace(1) + 'T09:00:00.000Z',
      datos: { porLiquidar: porLiquidar, campos: { 'propio:p-importe': { valor: '1,12', enNombre: false } },
        /* Fila 305, ASUNTO A: lo pide su madre, vía correo, con otra dirección escrita a mano. */
        loPide: { nombre: 'Rosa Ortiz', categoria: '', relacion: 'Madre', correo: 'tutor.alvaro@correo-demo.es', telefono: '600333444', via: 'CORREO', fecha: hace(1), apuntadoPor: 'Revisor' },
        via: 'CORREO', viaDato: 'otra.direccion@ejemplo.es' }
    });
    var claveNoa = await crearAsunto(tipos['SEGURO ESCOLAR'], 'ALUMNADO', noa, hace(1), {
      abiertoEl: hace(1) + 'T09:00:00.000Z',
      datos: { porLiquidar: porLiquidar, campos: { 'propio:p-importe': { valor: '1,12', enNombre: false } },
        /* Fila 305, ASUNTO B: lo pide su padre, vía teléfono, con el teléfono escrito a mano. */
        loPide: { nombre: 'Luis Castro', categoria: '', relacion: 'Padre', correo: 'tutor.noa@correo-demo.es', telefono: '600444555', via: 'TELEFONO', fecha: hace(1), apuntadoPor: 'Revisor' },
        via: 'TELEFONO', viaDato: '600 111 222' }
    });
    var claveDuarte = await crearAsunto(tipos['SEGURO ESCOLAR'], 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Duarte Gil, Pilar', id: '2100020' }), hace(1), {
      abiertoEl: hace(1) + 'T09:00:00.000Z', datos: { porLiquidar: porLiquidar }
    });
    await marcarPrimerHito(claveAlvaro, 'hecho', 'Cobrado.');
    await marcarPrimerHito(claveNoa, 'hecho', 'Cobrado.');
    await marcarPrimerHito(claveDuarte, 'hecho', 'Cobrado.');
    await crearAsunto(tipos['SEGURO ESCOLAR'], 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Esteban Roca, Iván', id: '2100021' }), hace(0), {
      abiertoEl: new Date().toISOString(),
      datos: { campos: { 'propio:p-importe': { valor: '1,12', enNombre: false } } }
    });

    /* 6c. fila 238: un certificado de miembro del Consejo Escolar. */
    var consejoClave = await crearAsunto(tipos['CERTIFICADO MIEMBRO CONSEJO ESCOLAR'], 'PERSONAL', marta, hace(0), {
      abiertoEl: new Date().toISOString()
    });
    /* Fila 234: su hito actual es de «Secretaría con V.º B.º de Dirección». */
    await marcarPrimerHito(consejoClave, 'hecho', 'Certificado preparado.');

    /* 6c bis. fila 414: unas elecciones con la recepción de candidaturas como hito actual. */
    var ramon = Nombres.terceroPersonal({ nombre: 'Vidal Cano, Ramón', documento: '44556677D' });
    var eleccionesClave = await crearAsunto(tipos['Elecc. Consejo Escolar'], 'PERSONAL', ramon, hace(8), {
      abiertoEl: hace(8) + 'T09:00:00.000Z'
    });
    await marcarPrimerHito(eleccionesClave, 'hecho', 'Elecciones convocadas.');

    /* Fila 458 (docs/PASAR-A-DRIVE.md): el asunto con más documentos de la demostración, para comprobar que tras «Pasar a Drive»
       se abre con todo: diez documentos y una carpeta de versiones previas. */
    var carpetaElecciones = await App.E.abiertos.getDirectoryHandle(eleccionesClave);
    for (var ne = 1; ne <= 10; ne++) {
      await Carpetas.escribirBytes(carpetaElecciones, 'Candidatura ' + (ne < 10 ? '0' : '') + ne + '.pdf', 'candidatura ' + ne, 'application/pdf');
    }
    var previasElecciones = await Carpetas.crear(carpetaElecciones, 'Versiones previas');
    await Carpetas.escribirBytes(previasElecciones, 'Convocatoria (versión 1).pdf', 'convocatoria v1', 'application/pdf');
    await Carpetas.escribirBytes(previasElecciones, 'Convocatoria (versión 2).pdf', 'convocatoria v2', 'application/pdf');

    /* 6. dormido: abierto hace tiempo, sin ningún hito tocado. Sin número:
       es un asunto «de antes», con la estructura de nombre de siempre. */
    await crearAsunto(tipos.FACTURA, 'EMPRESAS', dobla, hace(60), {
      abiertoEl: hace(75) + 'T09:00:00.000Z', sinNumero: true,   /* fila 451: claramente dormido (más de los 60 días de aviso) */
      datos: { campos: { 'propio:p-importe-factura': { valor: '125,5', enNombre: false },
                         'propio:p-fecha-factura': { valor: hace(58), enNombre: false } } }
    });

    if (window.Demo.hacer && tipos['CERTIFICADO DE NOTAS']) {
      await Demo.hacer.construir({ tipo: tipos['CERTIFICADO DE NOTAS'], tipoBaja: tipos['BAJA MEDICA'], tipos: tipos, archivar: archivarDeMentira, crearAsunto: crearAsunto, hace: hace });
    }

    /* 6d. fila 244: dos facturas más, con un importe negativo y uno que no es una cifra
       («unos 30 euros»), para probar el cambio de clase de «Importe de la factura». */
    var mante = Nombres.terceroEmpresa({ nombre: 'Mantenimientos del Sur, S.A.', nif: 'A87654321' });
    var copi = Nombres.terceroEmpresa({ nombre: 'Copistería Central', nif: '99887766X' });
    await crearAsunto(tipos.FACTURA, 'EMPRESAS', mante, hace(0), {
      abiertoEl: new Date().toISOString(),
      datos: { campos: { 'propio:p-importe-factura': { valor: '-80', enNombre: false } } }
    });
    await crearAsunto(tipos.FACTURA, 'EMPRESAS', copi, hace(0), {
      abiertoEl: new Date().toISOString(),
      datos: { campos: { 'propio:p-importe-factura': { valor: 'unos 30 euros', enNombre: false } } }
    });
  }

  I.crearAsunto = crearAsunto;
  I.crearFichaSinCarpeta = crearFichaSinCarpeta;
  I.crearAsuntosAbiertos = crearAsuntosAbiertos;
})();
