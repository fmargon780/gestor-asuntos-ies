/* ============================================================
   demo/datos.js — el juego de datos inventados de la copia de pruebas
   (fila 222, docs/COPIA-DE-PRUEBAS.md).

   Nada se fabrica a mano en el formato interno de la aplicación: los
   CSV de Séneca (RegAlum, RelPerCen) se escriben directos, como los
   escribiría de verdad la exportación del centro, pero los tipos, las
   guías, las plantillas y los propios asuntos se crean llamando a las
   MISMAS funciones que usan las pantallas (`App.crearTipo`,
   `GuiasDelCentro.guardarPasos`, `App.anotar`, `Hitos.marcar`,
   `Plantillas.guardar`...), para no arriesgarse a escribir un JSON que
   luego la aplicación no reconozca.

   Nombres, empresas y demás son inventados a propósito: ningún dato
   real de ninguna persona.

   `Demo.datos.construir()` se llama UNA vez, justo después de "entrar"
   con las carpetas de mentira ya activas (App.E.gestor / App.E.abiertos
   / App.E.archivo ya puestos por el paso normal de entrada). No hace
   falta volver a llamarla: "Volver a empezar" recarga la página entera
   (`Demo.reiniciar()`), y con el disco vacío todo se vuelve a construir
   desde cero.
   ============================================================ */
(function () {
  'use strict';

  var HOY = new Date();

  function hace(dias) {
    var d = new Date(HOY.getTime() - dias * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function csv(filas) {
    return filas.map(function (f) { return f.join(';'); }).join('\r\n') + '\r\n';
  }

  /* ---------- los ficheros de datos (RegAlum, RelPerCen, altas a mano) ---------- */

  async function escribirDatos() {
    var d = App.E.datos;

    /* RegAlum.csv: 14 alumnos, tres grupos, dos hermanos (mismo tutor)
       y un alumno que ya no está matriculado este curso. */
    var curso = U.cursoActual();
    var anoMatricula = curso.slice(3);
    await Carpetas.escribirTexto(d, 'RegAlum.csv', csv([
      ['Alumno/a', 'Nº Id. Escolar', 'Curso', 'Unidad', 'Año de la matrícula', 'Estado Matrícula', 'Fecha de nacimiento', 'Teléfono del tutor', 'Correo del tutor'],
      ['Aguilar Ponce, Marina', '2100001', '1º de E.S.O.', '1º A', '20' + anoMatricula, 'Matriculada', '14/03/2013', '600111222', 'tutor.marina@correo-demo.es'],
      ['Aguilar Ponce, Pablo', '2100002', '3º de E.S.O.', '3º A', '20' + anoMatricula, 'Matriculado', '02/06/2011', '600111222', 'tutor.marina@correo-demo.es'],
      ['Bermúdez Ortiz, Álvaro', '2100003', '1º de E.S.O.', '1º C', '20' + anoMatricula, 'Matriculado', '02/09/2014', '600333444', 'tutor.alvaro@correo-demo.es'],
      ['Castro Reina, Noa', '2100004', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculada', '19/11/2012', '600444555', 'tutor.noa@correo-demo.es'],
      ['Delgado Prieto, Iker', '2100005', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculado', '05/01/2013', '600555666', 'tutor.iker@correo-demo.es'],
      ['Espejo Montes, Carla', '2100006', '4º de E.S.O.', '4º A', '20' + anoMatricula, 'Matriculada', '23/04/2011', '600666777', 'tutor.carla@correo-demo.es'],
      ['Fuentes Calvo, Rubén', '2100007', '1º de Bachillerato', '1º Bach A', '20' + anoMatricula, 'Matriculado', '11/05/2009', '600777888', 'tutor.ruben@correo-demo.es'],
      ['Gallardo Reyes, Vera', '2100008', '1º de Bachillerato', '1º Bach A', '20' + anoMatricula, 'Matriculada', '30/07/2009', '600888999', 'tutor.vera@correo-demo.es'],
      ['Herrera Lozano, Diego', '2100009', '2º de Bachillerato', '2º Bach B', '20' + anoMatricula, 'Matriculado', '17/02/2008', '600999000', 'tutor.diego@correo-demo.es'],
      ['Ibarra Nieto, Sara', '2100010', '3º de E.S.O.', '3º A', '20' + anoMatricula, 'Matriculada', '08/08/2011', '600000111', 'tutor.sara@correo-demo.es'],
      ['Jimenez Rubio, Mateo', '2100011', '4º de E.S.O.', '4º A', '20' + anoMatricula, 'Matriculado', '21/12/2010', '600111333', 'tutor.mateo@correo-demo.es'],
      ['Klein Soto, Ana', '2100012', '1º de E.S.O.', '1º C', '20' + anoMatricula, 'Matriculada', '09/09/2014', '600222444', 'tutor.ana@correo-demo.es'],
      ['Lara Quintero, Bruno', '2100013', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculado', '15/10/2012', '600333555', 'tutor.bruno@correo-demo.es'],
      /* aspirante sin matricular: sin fila propia hasta que se dé de alta a mano */
      /* un alumno antiguo (ya no está matriculado este curso) */
      ['Moya Santana, Elena', '2099998', '4º de E.S.O.', '4º A', '20' + (parseInt(anoMatricula, 10) - 1), 'Baja', '02/02/2010', '600444888', 'tutor.elena@correo-demo.es']
    ]));

    /* RelPerCen: profesorado y PAS de este curso. */
    await Carpetas.escribirTexto(d, 'RelPerCen ' + curso + '.csv', csv([
      ['Empleado/a', 'DNI/Pasaporte', 'Puesto', 'Fecha de toma de posesión', 'Fecha de cese', 'Teléfono', 'Correo'],
      ['Otero Campos, Marta', '11223344A', 'Matemáticas P.E.S.', '01/09/2015', '', '650111222', 'motero@correo-demo.es'],
      ['Reyes Palma, Fernando', '22334455B', 'Lengua P.E.S.', '01/09/2010', '', '650222333', 'freyes@correo-demo.es'],
      ['Uceda Molina, Patricia', '33445566C', 'Jefatura de Estudios', '01/09/2020', '', '650333444', 'puceda@correo-demo.es'],
      ['Vidal Cano, Ramón', '44556677D', 'Ordenanza', '01/09/2012', '', '650444555', 'rvidal@correo-demo.es']
    ]));

    /* empresas.csv: alta manual (CONTEXTO.md: Razón social · Nombre
       comercial · NIF · Contacto · Teléfono · Correo). */
    await Carpetas.escribirTexto(d, 'empresas.csv', csv([
      ['Razón social', 'Nombre comercial', 'NIF', 'Contacto', 'Teléfono', 'Correo'],
      ['Suministros Escolares Dobla, S.L.', 'Dobla', 'B12345678', 'Laura Santos', '950111000', 'pedidos@dobla-demo.es'],
      ['Mantenimientos del Sur, S.A.', '', 'A87654321', 'Julio Reina', '950222000', 'oficina@mantesur-demo.es'],
      ['Copistería Central', 'Copistería Central', '99887766X', 'Nuria Paz', '950333000', 'info@copicentral-demo.es']
    ]));

    /* tutores.csv: tutores legales ya dados de alta como tercero. */
    await Carpetas.escribirTexto(d, 'tutores.csv', csv([
      ['Nombre', 'Documento', 'Teléfono', 'Teléfono 2', 'Correo', 'Correo 2', 'Domicilio', 'Hijos'],
      ['Ponce Duarte, Rocío', '55667788E', '600111222', '', 'tutor.marina@correo-demo.es', '', 'Calle Mayor 4', ''],
      ['Ortiz Vela, Manuel', '66778899F', '600333444', '', 'tutor.alvaro@correo-demo.es', '', 'Avda. del Parque 9', '']
    ]));
  }

  /* ---------- tipos y guías ---------- */

  async function crearTipoConGuia(nombre, categoria, pasos, plazo) {
    var tipo = await App.crearTipo({ nombre: nombre, categoria: categoria });
    if (plazo) {
      tipo.plazo = plazo;
      await App.guardarTipos();
    }
    await GuiasDelCentro.guardarPasos(nombre, Guias.normalizar(pasos));
    return tipo;
  }

  async function crearTipos() {
    var matricula = await crearTipoConGuia('MATRICULA', 'ALUMNADO', [
      { titulo: 'Recibir la solicitud', cuerpo: '<p>Comprobar que llega firmada por quien tiene la patria potestad.</p>', responsable: 'yo' },
      { titulo: 'Comprobar la documentación', cuerpo: '<p>DNI o NIE, libro de familia y empadronamiento.</p>', responsable: 'yo' },
      { titulo: 'Registrar la matrícula en Séneca', cuerpo: '<p>Dar de alta al alumno o alumna en el grupo que corresponda.</p>', responsable: 'yo' }
    ], 15);

    var certificado = await crearTipoConGuia('CERTIFICADO', 'ALUMNADO', [
      { titulo: 'Preparar el certificado', cuerpo: '<p>Con la plantilla del tipo.</p>', responsable: 'yo' },
      { titulo: 'Entregarlo a quien lo pide', cuerpo: '<p>En mano o por correo, según lo acordado.</p>', responsable: 'yo' }
    ], 5);

    var bajaMedica = await crearTipoConGuia('BAJA MEDICA', 'PERSONAL', [
      { titulo: 'Recibir el parte de baja', cuerpo: '<p>Del interesado o de la mutua.</p>', responsable: 'yo' },
      { titulo: 'Esperar el parte de alta', cuerpo: '<p>Hasta que el interesado lo traiga.</p>', toca: 'espera', tocaA: 'Interesado' }
    ], null);

    var factura = await crearTipoConGuia('FACTURA', 'EMPRESAS', [
      { titulo: 'Revisar la factura', cuerpo: '<p>Importe, concepto y cuenta presupuestaria.</p>', responsable: 'yo' },
      { titulo: 'Tramitar el pago', cuerpo: '<p>Pasarla a Secretaría para su pago.</p>', responsable: 'yo' }
    ], 30);

    return { MATRICULA: matricula, CERTIFICADO: certificado, 'BAJA MEDICA': bajaMedica, FACTURA: factura };
  }

  /* ---------- plantilla de correo ---------- */

  async function crearPlantillas() {
    await Plantillas.guardar(App.E.gestor, function (actual) {
      actual.centro = 'IES Fuente Lucena (copia de pruebas)';
      actual.localidad = 'Localidad de pruebas';
      actual.lista.push({
        id: Plantillas.idNuevo(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
        nombre: 'Confirmación de matrícula',
        texto: 'Le confirmamos que la matrícula ha quedado registrada correctamente.'
      });
      return actual;
    });
  }

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
      registros: [{ ano: fecha.slice(2, 4), sentido: 'E', modo: 'M', numero: '0123', codigo: Nombres.codigoRegistro({ ano: fecha.slice(2, 4), sentido: 'E', modo: 'M', numero: '0123' }) }]
    });
    var antiguo = Nombres.montarDocumento({ fecha: hace(9), codigo: fecha.slice(2, 4) + 'EM0098', tipo: 'INFORME', curso: 'Antiguo', extension: 'pdf' });
    await Carpetas.escribirBytes(carpeta, antiguo, PDF_DE_MENTIRA, 'application/pdf');
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

    /* 3. con la fecha límite ya vencida. */
    await crearAsunto(tipos.CERTIFICADO, 'ALUMNADO', carla, hace(20), {
      abiertoEl: hace(20) + 'T09:00:00.000Z',
      datos: { limite: hace(6), limiteEl: hace(20) + 'T09:00:00.000Z', limitePor: 'Revisor' }
    });

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

    /* 6. dormido: abierto hace tiempo, sin ningún hito tocado. Sin número:
       es un asunto «de antes», con la estructura de nombre de siempre. */
    await crearAsunto(tipos.FACTURA, 'EMPRESAS', dobla, hace(60), {
      abiertoEl: hace(60) + 'T09:00:00.000Z', sinNumero: true
    });
  }

  /* ---------- archivo ---------- */

  async function archivarDeMentira(tipoObj, categoria, tercero, fecha, conNumero) {
    var numero = conNumero ? (await Numeros.reservar('asuntos', '')).numero : '';
    var montado = Nombres.montarAsunto({
      fecha: fecha, tipo: Nombres.tipoParaCarpeta(tipoObj), categoria: categoria,
      curso: '', grupo: '', campos: [], descripcion: '', tercero: tercero, numero: numero
    });
    var nombre = montado.nombre;
    var destino = await Carpetas.bajar(App.E.archivo, [categoria, tercero], true);
    await Carpetas.crear(destino, nombre);
    return nombre;
  }

  async function crearArchivados(tipos) {
    var sara = Nombres.terceroAlumno({ nombre: 'Ibarra Nieto, Sara', id: '2100010' });
    var elena = Nombres.terceroAlumno({ nombre: 'Moya Santana, Elena', id: '2099998' });

    /* del curso actual (una fecha reciente, dentro del mismo curso académico) */
    await archivarDeMentira(tipos.CERTIFICADO, 'ALUMNADO', sara, hace(10), true);
    /* de un curso anterior */
    var fechaCursoAnterior = (HOY.getFullYear() - 1) + '-10-05';
    await archivarDeMentira(tipos.MATRICULA, 'ALUMNADO', elena, fechaCursoAnterior);

    if (window.IndiceArchivo) {
      var construido = await IndiceArchivo.construir();
      await IndiceArchivo.guardar(construido);
    }
  }

  /* ---------- tablón ---------- */

  async function crearTablon() {
    if (!window.Tablon) return;
    await Tablon.cambiar(function (lista) {
      lista.push({
        id: U.nuevoId('n'), texto: 'Llamar a la Delegación por lo del transporte.',
        color: 'amarillo', autor: App.E.usuario || 'Revisor', creado: U.ahora(),
        para: '', privada: false, hecha: false, hechaPor: '', hechaEl: ''
      });
      lista.push({
        id: U.nuevoId('n'), texto: 'Recordar: claustro el próximo lunes.',
        color: 'azul', autor: App.E.usuario || 'Revisor', creado: U.ahora(),
        para: '', privada: false, hecha: false, hechaPor: '', hechaEl: ''
      });
      return lista;
    });
  }

  /* ---------- la papelera (fila 203) ----------

     Cuatro notas del tablón mandadas a la papelera con la función de
     verdad y luego con la fecha de entrada cambiada: una de hace 95
     días (pasada de plazo: se vacía sola), una de hace 85 (sale en el
     aviso, con la fecha de borrado en rojo), una de hace 60 y una de
     ayer. */
  async function crearPapelera() {
    if (!window.Papelera || !Papelera._interno) return;
    var I = Papelera._interno;
    var notas = [[95, 'Nota de septiembre pasado'], [85, 'Recordatorio de la reunión de tutores'],
                 [60, 'Pedir fotocopias de las llaves'], [1, 'Aviso del simulacro']];
    for (var i = 0; i < notas.length; i++) {
      var nota = { id: U.nuevoId('n'), texto: notas[i][1], color: 'amarillo', autor: App.E.usuario || 'Revisor',
        creado: U.ahora(), para: '', privada: false, hecha: false, hechaPor: '', hechaEl: '' };
      var ficha = await Papelera.mandarDato('nota-tablon', notas[i][1], null, nota);
      var cuando = new Date(Date.now() - notas[i][0] * 86400000).toISOString();
      await I.cambiar(function (l) {
        l.forEach(function (f) { if (f.id === ficha.id) f.cuando = cuando; });
        return l;
      });
    }
    /* Lo de hace 95 días ya toca borrarlo: se hace ahora, como haría el
       vaciado al entrar, para que el registro de lo borrado tenga algo. */
    if (Papelera.vaciarLoVencido) await Papelera.vaciarLoVencido();
    if (window.AvisosQueFaltan) await AvisosQueFaltan.repintarPapelera();
  }

  /* ---------- documentos por clasificar ---------- */

  var PDF_DE_MENTIRA = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<<>>>>endobj',
    'trailer<</Size 4/Root 1 0 R>>',
    '%%EOF'
  ].join('\n');

  async function crearSueltos() {
    await Carpetas.escribirBytes(App.E.abiertos, 'solicitud escaneada.pdf', PDF_DE_MENTIRA, 'application/pdf');
    await Carpetas.escribirBytes(App.E.abiertos, 'justificante.pdf', PDF_DE_MENTIRA, 'application/pdf');
  }

  /* ---------- la bandeja de correos ---------- */

  async function crearBandeja(disco) {
    if (!disco || !disco.bandeja) return;
    await Almacen.guardar('bandeja', disco.bandeja);
    var uno = {
      id: 'demo-correo-1', asunto: 'Solicitud de certificado de escolaridad',
      texto: 'Buenos días, les escribo para pedir un certificado de escolaridad de mi hijo Pablo. Gracias.',
      de: { nombre: 'Rocío Ponce Duarte', correo: 'tutor.marina@correo-demo.es' },
      correos: ['tutor.marina@correo-demo.es'],
      fecha: hace(1), fechaUltimo: hace(1), adjuntos: []
    };
    var dos = {
      id: 'demo-correo-2', asunto: 'Factura pendiente de pago',
      texto: 'Adjuntamos la factura del material de septiembre.',
      de: { nombre: 'Laura Santos', correo: 'pedidos@dobla-demo.es' },
      correos: ['pedidos@dobla-demo.es'],
      fecha: hace(2), fechaUltimo: hace(2), adjuntos: ['factura-septiembre.pdf']
    };
    await Carpetas.escribirBytes(disco.bandeja, 'factura-septiembre.pdf', PDF_DE_MENTIRA, 'application/pdf');
    await Carpetas.guardarJson(disco.bandeja, uno.id + '.json', uno);
    await Carpetas.guardarJson(disco.bandeja, dos.id + '.json', dos);
  }

  /* ---------- todo junto ---------- */

  var construido = false;

  async function construir(disco) {
    if (construido) return;
    construido = true;
    /* La entrada normal ya ha sembrado tipos.json con Nombres.POR_DEFECTO
       (fichero vacío la primera vez): se vacía antes de poner los tipos
       propios de la demo, para no mezclar treinta y tantos tipos reales
       con los cuatro inventados. */
    App.E.tipos = [];
    await Carpetas.guardarJson(App.E.gestor, App.FICHERO_TIPOS, []);
    await escribirDatos();
    /* La entrada normal ya ha podido leer (y guardar en caché, vacíos)
       los CSV de personas al pintar Inicio, antes de que estos
       existieran: se tira esa caché para que la próxima lectura sí los
       encuentre. */
    if (window.Datos && Datos.olvidar) Datos.olvidar();
    var tipos = await crearTipos();
    await crearPlantillas();
    await crearAsuntosAbiertos(tipos);
    await crearArchivados(tipos);
    await crearTablon();
    await crearPapelera();
    await crearSueltos();
    await crearBandeja(disco);
  }

  window.Demo = window.Demo || {};
  window.Demo.datos = { construir: construir };
})();
