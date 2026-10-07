/* ============================================================
   demo/datos-grupo.js — un asunto de grupo (fila 293, docs/TRABAJO-EN-BLOQUE.md)
   en la copia de pruebas: «GRUPO 2ºB», seis personas de una unidad, tres con su
   «Certificado de notas» ya generado (de hace tres días), una con su registro de
   Séneca y su envío (la que lo tiene todo), y el resto sin nada.
   Todo inventado. Lo llama js/demo/datos.js al montar los asuntos.
   ============================================================ */
(function () {
  'use strict';

  var ALUMNOS = [
    ['Castro Reina, Noa', '2100004'], ['Delgado Prieto, Iker', '2100005'], ['Lara Quintero, Bruno', '2100013'],
    ['Navarro Gil, Lucía', '2100014'], ['Ortega Paz, Darío', '2100015'], ['Pardo Luna, Nerea', '2100016']
  ];

  async function construir(o) {
    var tipo = o.tipo;
    if (!tipo || !window.Demo.plantilla) return;
    var personas = ALUMNOS.map(function (a) { return { categoria: 'ALUMNADO', nombre: Nombres.terceroAlumno({ nombre: a[0], id: a[1] }) }; });
    var nombreGrupo = Nombres.grupoCompacto('2º B', '2º de E.S.O.') || '2ºB';
    /* De hace ocho días: fuera de la ventana de «Desde y Hasta» de la prueba de exportar (de hace 6 a hace 1 día). */
    var clave = await o.crearAsunto(tipo, 'ALUMNADO', 'GRUPO ' + nombreGrupo, o.hace(8), {
      abiertoEl: o.hace(8) + 'T09:00:00.000Z',
      datos: { grupo: { nombre: nombreGrupo, origen: 'unidad', creado: o.hace(8) + 'T09:00:00.000Z' }, relacionados: personas }
    });
    var datosPlantillas = await Plantillas.cargar(App.E.gestor);
    var plantilla = (datosPlantillas.documentos || []).filter(function (d) { return d.nombre === 'Certificado de notas'; })[0];
    if (!plantilla) return;

    var P = Demo.plantilla, carpeta = await App.E.abiertos.getDirectoryHandle(clave);
    var fecha = o.hace(3), hechos = [];
    for (var i = 0; i < 3; i++) {
      var texto = ALUMNOS[i][0];
      var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
      var nombre = Nombres.montarDocumento({ fecha: fecha, tipo: 'CERTIFICADO', curso: texto, extension: 'docx', numeroDoc: numeroDoc });
      var bytes = P.docx([
        P.p([P.r('CERTIFICADO DE NOTAS', true)], true),
        P.p([P.r('Se certifica que ' + texto.split(', ').reverse().join(' ') + ' ha obtenido las calificaciones del curso actual en este centro.')]),
        P.p([P.r('En Localidad de pruebas, a ' + fecha)])
      ]);
      await Carpetas.escribirBytes(carpeta, nombre, bytes, P.WORD);
      var registros = [];
      if (i === 0) {
        var r = { ano: fecha.slice(2, 4), sentido: 'S', modo: 'M', numero: '0412' };
        registros.push(Object.assign({ codigo: Nombres.codigoRegistro(r) }, r));
      }
      await DocumentosDatos.anotar(clave, numeroDoc, { tipo: 'CERTIFICADO', fecha: fecha, texto: texto, campos: [], valores: {}, registros: registros,
        generadoDe: plantilla.id + '|' + personas[i].categoria + '|' + personas[i].nombre, hito: '' });
      hechos.push(nombre);
    }
    await App.anotar(clave, { enviosPorPersona: [{ documento: hechos[0], correo: 'tutor.noa@correo-demo.es', cuando: o.hace(2) + 'T10:00:00.000Z', quien: App.E.usuario || 'Revisor' }] });
  }

  window.Demo = window.Demo || {};
  window.Demo.grupo = { construir: construir };
})();
