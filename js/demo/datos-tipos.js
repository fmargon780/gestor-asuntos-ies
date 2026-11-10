/* ============================================================
   demo/datos-tipos.js — los tipos con su guía y la plantilla de correo del juego de datos.
   (fila 560, docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/demo/datos.js sin cambiar nada; el código es el de siempre,
   movido tal cual). Se carga antes que js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  window.Demo.datos = window.Demo.datos || {};
  var I = window.Demo.datos._interno = window.Demo.datos._interno || {};   /* lo que se comparten las piezas de datos.js */

  var HOY = I.HOY;

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

  async function crearReclamacion() {
    var datos = await App.leerFicheroDeLaApp('datos-biblioteca/biblioteca-centro.json', 'json');
    var ids = ['b118', 'b120', 'b121'];
    var modelos = ids.map(function (id) {
      return HitosBiblioteca._normalizarModelo(datos.modelos.filter(function (m) { return m.id === id; })[0]);
    });
    await HitosBiblioteca.cambiar(function (d) {
      modelos.forEach(function (m) { d.modelos.push(m); });
      return d;
    });
    await crearTipoConGuia('Reclamación de calificaciones', 'ALUMNADO', modelos.map(function (m) {
      return HitosBiblioteca.modeloAPaso(m, '');
    }), null);
  }

  async function crearTipos() {
    var matricula = await crearTipoConGuia('MATRICULA', 'ALUMNADO', [
      /* Fila 282: una tarea de «reunir un documento» en cada uno de los dos primeros hitos, para probar «Quitar del hito»
         y «Traer a este hito» (la tarea se marca sola al apuntar el documento y se queda marcada al quitarlo). */
      { titulo: 'Recibir la solicitud', cuerpo: '<p>Comprobar que llega firmada por quien tiene la patria potestad.</p>', responsable: 'yo',
        guion: [{ id: 'g-demo-solicitud', texto: 'Reunir la solicitud firmada', reunir: 'documento' }] },
      { titulo: 'Comprobar la documentación', cuerpo: '<p>Si es matrícula nueva, comprobamos que trae:</p><ul><li>DNI o NIE</li><li>Libro de familia</li><li>Empadronamiento</li></ul>', responsable: 'yo',
        guion: [{ id: 'g-demo-documentos', texto: 'Reunir el libro de familia', reunir: 'documento' }] },
      { titulo: 'Registrar la matrícula en Séneca', cuerpo: '<p>Dar de alta al alumno o alumna en el grupo que corresponda.</p>', responsable: 'yo' }
    ], 15);

    var certificado = await crearTipoConGuia('CERTIFICADO', 'ALUMNADO', [
      { titulo: 'Preparar el certificado', cuerpo: '<p>Con la plantilla del tipo.</p>', responsable: 'yo' },
      { titulo: 'Entregarlo a quien lo pide', cuerpo: '<p>En mano o por correo, según lo acordado.</p>', responsable: 'yo' }
    ], 5);

    var bajaMedica = await crearTipoConGuia('BAJA MEDICA', 'PERSONAL', [
      { titulo: 'Recibir el parte de baja', cuerpo: '<p>Del interesado o de la mutua.</p>', responsable: 'yo',
        guion: [{ id: 'g-demo-baja-comunicar', texto: 'Acusar recibo del parte', accion: 'comunicar', receta: { via: 'correo', a: 'tercero', plantilla: 'pl-demo-baja' } }] },   /* fila 320: una plantilla de correo puesta en una tarea */
      { titulo: 'Esperar el parte de alta', cuerpo: '<p>Hasta que el interesado lo traiga.</p>', toca: 'espera', tocaA: 'Interesado' },
      { titulo: 'Archivar el parte de alta', cuerpo: '<p>Dejar el parte en la carpeta.</p>', responsable: 'yo' }
    ], null);

    var factura = await crearTipoConGuia('FACTURA', 'EMPRESAS', [
      { titulo: 'Revisar la factura', cuerpo: '<p>Importe, concepto y cuenta presupuestaria.</p>', responsable: 'yo' },
      { titulo: 'Tramitar el pago', cuerpo: '<p>Pasarla a Secretaría para su pago.</p>', responsable: 'yo' }
    ], 30);

    /* Fila 241: un tipo con un campo propio de cantidad («Importe»), para
       probar «Exportar ▾» con sumas: el cobro del seguro escolar. */
    var seguro = await crearTipoConGuia('SEGURO ESCOLAR', 'ALUMNADO', [
      { titulo: 'Cobrar el seguro escolar', cuerpo: '<p>Cobrar y dar el recibo.</p>', responsable: 'yo' }
    ], null);
    await Campos.guardarPropios(App.E.gestor, function (lista) {
      lista.push({ id: 'p-importe', nombre: 'Importe', clase: 'importe', valores: [] });
      return lista;
    });
    await Campos.guardarConfigDeTipo(App.E.gestor, 'SEGURO ESCOLAR',
      [{ origen: 'propio', id: 'p-importe', obligatorio: false, enNombre: false }]);
    App.E.campos = await Campos.leer(App.E.gestor);
    /* Fila 249: el seguro escolar hay que liquidarlo antes de archivarlo. */
    seguro.liquidar = true;
    await App.guardarTipos();

    /* Fila 244: la factura lleva «Importe de la factura» (Texto libre, para probar el cambio
       de clase a Importe en euros) y «Fecha de la factura» (clase Fecha). */
    await Campos.guardarPropios(App.E.gestor, function (lista) {
      lista.push({ id: 'p-importe-factura', nombre: 'Importe de la factura', clase: 'texto', valores: [] });
      lista.push({ id: 'p-fecha-factura', nombre: 'Fecha de la factura', clase: 'fecha', valores: [] });
      return lista;
    });
    await Campos.guardarConfigDeTipo(App.E.gestor, 'FACTURA', [
      { origen: 'propio', id: 'p-importe-factura', obligatorio: false, enNombre: false },
      /* Fila 255: «Fecha de la factura» es un campo del hito «Tramitar el pago». */
      { origen: 'propio', id: 'p-fecha-factura', obligatorio: false, enNombre: false,
        hito: GuiasDelCentro.pasosDe('FACTURA')[1].id }]);
    App.E.campos = await Campos.leer(App.E.gestor);

    /* Fila 238: el tipo del certificado de miembro del Consejo Escolar. */
    var consejo = await crearTipoConGuia('CERTIFICADO MIEMBRO CONSEJO ESCOLAR', 'PERSONAL', [
      { titulo: 'Preparar el certificado', cuerpo: '<p>Con la plantilla del tipo.</p>', responsable: 'yo' },
      { titulo: 'Firmar el certificado', cuerpo: '<p>Lo firma Secretaría con el visto bueno de Dirección.</p>', responsable: 'secretaria-vb-direccion' }
    ], null);
    consejo.nombreCorto = 'CertConsEsc';
    await App.guardarTipos();

    /* Fila 414: elecciones al Consejo Escolar. Su hito de recepción de candidaturas le toca a terceros y
       «Recibe varios documentos» está puesto: cada candidatura que entra se une al hito sin cerrarlo. */
    var elecciones = await crearTipoConGuia('Elecc. Consejo Escolar', 'PERSONAL', [
      { titulo: 'Convocar las elecciones', cuerpo: '<p>Publicar el calendario electoral.</p>', responsable: 'yo' },
      { titulo: 'Recepción de candidaturas', cuerpo: '<p>Llegan las solicitudes de candidatura.</p>', toca: 'espera', tocaA: 'Candidatos', variosDocumentos: true },
      { titulo: 'Proclamar las candidaturas', cuerpo: '<p>Publicar la lista de candidatos.</p>', responsable: 'yo' }
    ], null);
    elecciones.candidaturas = true;
    await App.guardarTipos();

    /* Fila 493: un tipo de una sola clase (Otros) al que se le pueden marcar más en Ajustes. */
    await crearTipoConGuia('COMUNICACION RECIBIDA', 'OTROS', [
      { titulo: 'Registrar y archivar la comunicación', cuerpo: '<p>Dejar la copia en la carpeta.</p>', responsable: 'yo' }
    ], null);

    var notas = null;
    if (window.Demo.hacer) {
      var idPlantilla = await Demo.hacer.crearPlantilla();
      notas = await crearTipoConGuia('CERTIFICADO DE NOTAS', 'ALUMNADO', [
        { titulo: 'Preparar y enviar el certificado', cuerpo: '<p>Con la plantilla del tipo.</p>', responsable: 'yo', guion: Demo.hacer.guion(idPlantilla) },
        { titulo: 'Archivar el expediente', cuerpo: '<p>Dejar la copia en la carpeta.</p>', responsable: 'yo' }
      ], null);
    }

    if (window.Demo.planGuias) await Demo.planGuias.construir({ crearTipoConGuia: crearTipoConGuia });   /* fila 551 */
    await crearReclamacion();   /* fila 284: guía de la tabla de plazos, sin plazo (lo pone js/plazos-del-centro.js) */

    return { MATRICULA: matricula, CERTIFICADO: certificado, 'BAJA MEDICA': bajaMedica, FACTURA: factura,
             'SEGURO ESCOLAR': seguro, 'CERTIFICADO MIEMBRO CONSEJO ESCOLAR': consejo, 'CERTIFICADO DE NOTAS': notas,
             'Elecc. Consejo Escolar': elecciones };
  }

  /* ---------- plantilla de correo ---------- */

  async function crearPlantillas() {
    await Plantillas.guardar(App.E.gestor, function (actual) {
      actual.centro = 'IES Fuente Lucena (copia de pruebas)';
      actual.localidad = 'Localidad de pruebas';
      /* Fila 434: la primera del tipo es la que se propone al abrir «Comunicar» en cualquier hito sin plantilla propia
         (js/correo.js, plantillaDeEntrada): la de pedir documentación, que va con los hitos del principio; la de confirmar
         la matrícula, que es la final, queda detrás y se elige a mano. */
      actual.lista.push({
        id: Plantillas.idNuevo(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
        nombre: 'Documentación pendiente de matrícula',
        texto: 'Para completar la matrícula nos falta documentación. Por favor, tráigala al centro cuanto antes.'
      });
      actual.lista.push({
        id: Plantillas.idNuevo(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
        nombre: 'Confirmación de matrícula',
        texto: 'Le confirmamos que la matrícula ha quedado registrada correctamente.'
      });
      /* Fila 320 (pantalla «Plantillas»): una de correo en la tarea de un hito (la usa BAJA MEDICA) y las dos de la aplicación. */
      actual.lista.push({ id: 'pl-demo-baja', tipo: 'BAJA MEDICA', categoria: 'PERSONAL', nombre: 'Acuse de recibo del parte',
        texto: 'Hemos recibido su parte de baja. Cuando tenga el parte de alta, tráigalo al centro.' });
      actual.lista.push({ id: Plantillas.idNuevo(), tipo: '', categoria: '', nombre: 'Aviso de avance',
        texto: 'Le informamos de que su gestión sigue en marcha.\n\nVa por el hito {{HITON}} de {{HITOSM}}: {{HITO}}.\n\nFecha: {{HOY}}.' });
      actual.lista.push({ id: Plantillas.idNuevo(), tipo: '', categoria: '', nombre: 'Aviso de cierre',
        texto: 'Le informamos de que su gestión ha quedado cerrada el {{HOY}}.' });
      return actual;
    });
  }

  I.crearTipoConGuia = crearTipoConGuia;
  I.crearTipos = crearTipos;
  I.crearPlantillas = crearPlantillas;
})();
