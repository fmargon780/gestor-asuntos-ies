/* ============================================================
   demo/datos-resto.js — el archivo, el tablón, la papelera, los documentos por clasificar y la bandeja de correos del juego de datos.
   (fila 560, docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/demo/datos.js sin cambiar nada; el código es el de siempre,
   movido tal cual). Se carga antes que js/demo/datos-asuntos.js y js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  window.Demo.datos = window.Demo.datos || {};
  var I = window.Demo.datos._interno = window.Demo.datos._interno || {};   /* lo que se comparten las piezas de datos.js */

  var HOY = I.HOY;
  var hace = I.hace;

  /* ---------- archivo ---------- */

  async function archivarDeMentira(tipoObj, categoria, tercero, fecha, conNumero, ficha) {
    var numero = conNumero ? (await Numeros.reservar('asuntos', '')).numero : '';
    var montado = Nombres.montarAsunto({
      fecha: fecha, tipo: Nombres.tipoParaCarpeta(tipoObj), categoria: categoria,
      curso: '', grupo: '', campos: [], descripcion: '', tercero: tercero, numero: numero
    });
    var nombre = montado.nombre;
    var destino = await Carpetas.bajar(App.E.archivo, [categoria, tercero], true);
    var carpeta = await Carpetas.crear(destino, nombre);
    /* Fila 241: la ficha del archivado, en su carpeta, como la dejaría el archivado de verdad. */
    if (ficha && window.FichaArchivo) await FichaArchivo.escribir(carpeta, ficha);
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

    /* Fila 241: tres cobros del seguro escolar ya archivados (se archivan en el momento). */
    var cobros = [
      [Nombres.terceroAlumno({ nombre: 'Delgado Prieto, Iker', id: '2100005' }), 3, '1,12'],
      [Nombres.terceroAlumno({ nombre: 'Fuentes Calvo, Rubén', id: '2100007' }), 4, '1,12'],
      [Nombres.terceroAlumno({ nombre: 'Gallardo Reyes, Vera', id: '2100008' }), 4, '1,12']
    ];
    for (var i = 0; i < cobros.length; i++) {
      await archivarDeMentira(tipos['SEGURO ESCOLAR'], 'ALUMNADO', cobros[i][0], hace(cobros[i][1]), true, {
        estado: 'cerrado', tipo: 'SEGURO ESCOLAR', categoria: 'ALUMNADO', tercero: cobros[i][0],
        abiertoEl: hace(cobros[i][1]) + 'T09:00:00.000Z', cerradoEl: hace(cobros[i][1]) + 'T09:05:00.000Z',
        campos: { 'propio:p-importe': { valor: cobros[i][2], enNombre: false } }
      });
    }

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
      /* Fila 372 (avisos a hora fija): una nota compartida con hora dos minutos
         después de cargar la demo y «a la hora justa», y otra de ayer ya pasada y
         sin atender (da la ventana con «era a las 9:30» al entrar). Solo con
         `?avisos=1`: la ventana taparía las demás revisiones. */
      if (!/[?&]avisos=1(&|$)/.test(location.search)) return lista;
      var d = function (t) {
        return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
      };
      var dentro = new Date(Date.now() + 2 * 60000), ayer = new Date(Date.now() - 86400000);
      lista.push({
        id: U.nuevoId('n'), texto: 'Reunión de tutores de 1º ESO en el dpto. de orientación: darles los carnés de estudiante',
        color: 'amarillo', autor: App.E.usuario || 'Revisor', creado: U.ahora(),
        para: d(dentro), hora: String(dentro.getHours()).padStart(2, '0') + ':' + String(dentro.getMinutes()).padStart(2, '0'),
        antes: 0, atendido: [], privada: false, hecha: false, hechaPor: '', hechaEl: ''
      });
      lista.push({
        id: U.nuevoId('n'), texto: 'Entregar la hoja de guardias en jefatura',
        color: 'rosa', autor: App.E.usuario || 'Revisor', creado: U.ahora(),
        para: d(ayer), hora: '09:30', antes: 15, atendido: [], privada: false, hecha: false, hechaPor: '', hechaEl: ''
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
    await Carpetas.escribirBytes(App.E.abiertos, 'justificante.pdf', PDF_DE_MENTIRA, 'application/pdf');    await Carpetas.escribirBytes(App.E.abiertos, 'escaneo_0012.pdf', PDF_DE_MENTIRA, 'application/pdf');   /* fila 661 */
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
    /* Fila 661: un correo con el PDF del correo, el del hilo y dos adjuntos (cada uno entra en su cuadro, con su hito y su tarea). */
    var tres = {
      id: 'demo-correo-3', asunto: 'Matrícula de Pablo: documentación',
      texto: 'Les envío la solicitud firmada y el recibo del seguro escolar. Un saludo.',
      de: { nombre: 'Marina Ponce Ruiz', correo: 'tutor.pablo@correo-demo.es' },
      correos: ['tutor.pablo@correo-demo.es'],
      fecha: hace(0), fechaUltimo: hace(0), adjuntos: ['solicitud firmada.pdf', 'recibo seguro escolar.pdf'],
      pdf: 'demo-correo-3 - hilo.pdf', pdfMensaje: 'demo-correo-3 - mensaje.pdf'
    };
    await Carpetas.escribirBytes(disco.bandeja, 'factura-septiembre.pdf', PDF_DE_MENTIRA, 'application/pdf');
    for (var ia = 0; ia < tres.adjuntos.concat([tres.pdf, tres.pdfMensaje]).length; ia++) {
      await Carpetas.escribirBytes(disco.bandeja, tres.adjuntos.concat([tres.pdf, tres.pdfMensaje])[ia], PDF_DE_MENTIRA, 'application/pdf');
    }
    await Carpetas.guardarJson(disco.bandeja, uno.id + '.json', uno);
    await Carpetas.guardarJson(disco.bandeja, dos.id + '.json', dos);
    await Carpetas.guardarJson(disco.bandeja, tres.id + '.json', tres);
    /* Fila 336: la señal del recolector. Sin parámetro, de hace un momento (sin aviso); `?latido=viejo`, de hace
       tres días (aviso con fecha); `?latido=ninguno`, sin fichero (aviso sin fecha). */
    var latido = new URLSearchParams(window.location.search).get('latido') || '';
    if (latido !== 'ninguno') {
      var hora = new Date(Date.now() - (latido === 'viejo' ? 3 * 24 * 3600 * 1000 : 60 * 1000)).toISOString();
      await Carpetas.guardarJson(disco.bandeja, 'latido.json', { hora: hora, version: '13-oct-2026 · fila 336', cuenta: (window.Plantillas && Plantillas.POR_DEFECTO_CUENTA_ADMIN) || '29700692.administracion@g.educaand.es' });
    }
    /* La bandeja ya arrancó sin carpeta: con `?latido=` se le dice cuál es (sin él la demostración sigue como siempre). */
    if (latido && window.BandejaNucleo) {
      await BandejaNucleo.recordarCarpeta();
      await Bandeja.mirarDeNuevo(true);
    }
  }

  I.archivarDeMentira = archivarDeMentira;
  I.PDF_DE_MENTIRA = PDF_DE_MENTIRA;
  I.crearArchivados = crearArchivados;
  I.crearTablon = crearTablon;
  I.crearPapelera = crearPapelera;
  I.crearSueltos = crearSueltos;
  I.crearBandeja = crearBandeja;
})();
