/* ============================================================
   demo/datos-grande-asuntos.js — los asuntos del juego GRANDE de la copia de pruebas
   (fila 711, docs/711-DATOS-INVENTADOS-GRANDES.md). Solo se carga con `?demo=1&auto=1&grande=1`.

   150 asuntos abiertos (como los crearía la pantalla: `crearAsunto`) y 1.500 cerrados en tres cursos
   (como los deja el archivado: carpeta + `_ficha.json`), repartidos entre los alumnos de
   js/demo/datos-grande-personas.js, más los casos raros de docs/CASOS-DE-PRUEBA.md. Todo inventado, con semilla fija.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  var G = window.Demo.grande = window.Demo.grande || {};

  function dia(atras) {
    var d = new Date(Date.now() - atras * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* o: { tipos, crearAsunto, archivar, hace }. Devuelve cuántos asuntos hizo (para la prueba). */
  G.construirAsuntos = async function (o) {
    var az = G.azar(713), T = o.tipos, terceros = G.terceros || [];
    var nombresTipo = ['MATRICULA', 'CERTIFICADO', 'SEGURO ESCOLAR'];
    var hechos = { abiertos: 0, cerrados: 0, ms: {} }, t0 = Date.now();
    function de(nombre) { return Nombres.terceroAlumno({ nombre: nombre.nombre, id: nombre.id }); }
    function buscar(texto) { return terceros.filter(function (t) { return t.nombre.indexOf(texto) === 0; })[0]; }

    /* --- abiertos: repartidos en el tiempo, algunos con el primer hito hecho --- */
    for (var i = 0; i < G.TAM.abiertos; i++) {
      var t = az.de(terceros), tipo = T[az.de(nombresTipo)], atras = az.entre(120);
      var clave = await o.crearAsunto(tipo, 'ALUMNADO', de(t), o.hace(atras), { abiertoEl: o.hace(atras) + 'T09:00:00.000Z' });
      hechos.abiertos++;
      if (i % 3 === 0) {
        var hitos = await Hitos.hitosDe(clave);
        if (hitos && hitos[0]) await Hitos.marcar(clave, hitos[0].id, 'hecho', 'Hecho (datos inventados).');
      }
    }

    hechos.ms.abiertos = Date.now() - t0; t0 = Date.now();

    /* --- casos raros de asuntos (docs/CASOS-DE-PRUEBA.md) --- */
    var homonimo = buscar('Homónimo Primero');
    if (homonimo) {
      for (var k = 0; k < 8; k++) {
        await o.crearAsunto(T.CERTIFICADO, 'ALUMNADO', de(homonimo), o.hace(k * 3), { abiertoEl: o.hace(k * 3) + 'T10:00:00.000Z' });   /* muchos del mismo tercero */
        hechos.abiertos++;
      }
    }
    var cincuenta = buscar('de la Cruz del Río');
    if (cincuenta) {
      var cl = await o.crearAsunto(T.MATRICULA, 'ALUMNADO', de(cincuenta), o.hace(20), { abiertoEl: o.hace(20) + 'T09:00:00.000Z', descripcion: 'CASO 50 DOCUMENTOS' });
      var carpeta = await App.E.abiertos.getDirectoryHandle(cl);
      for (var d = 1; d <= 50; d++) {   /* un asunto con 50 documentos */
        var num = (await Numeros.reservar('documentos', '')).numero;
        var nombre = Nombres.montarDocumento({ fecha: o.hace(19), tipo: 'INFORME', extension: 'pdf', numeroDoc: num });
        await Carpetas.escribirBytes(carpeta, nombre, 'documento de prueba ' + d, 'application/pdf');
        await DocumentosDatos.anotar(cl, num, { tipo: 'INFORME', fecha: o.hace(19), texto: 'Documento ' + d, campos: [], valores: {}, registros: [] });
      }
      hechos.abiertos++;
    }
    var antiguo = buscar('Muñoz Peña');
    if (antiguo) {   /* uno del curso anterior, todavía abierto */
      var fechaVieja = (new Date().getFullYear() - 1) + '-09-20';
      await o.crearAsunto(T.CERTIFICADO, 'ALUMNADO', de(antiguo), fechaVieja, { abiertoEl: fechaVieja + 'T09:00:00.000Z', descripcion: 'CASO CURSO ANTERIOR' });
      hechos.abiertos++;
    }
    var vencido = buscar('Custodia Dudosa');
    if (vencido) {   /* vencido: abierto hace un año largo */
      await o.crearAsunto(T.MATRICULA, 'ALUMNADO', de(vencido), o.hace(400), { abiertoEl: o.hace(400) + 'T09:00:00.000Z', descripcion: 'CASO VENCIDO' });
      hechos.abiertos++;
    }

    hechos.ms.casos = Date.now() - t0; t0 = Date.now();

    /* --- cerrados: tres cursos --- */
    var ano = new Date().getFullYear();
    for (var c = 0; c < G.TAM.cerrados; c++) {
      var tt = az.de(terceros), tp = T[az.de(nombresTipo)];
      var curso = c % 3, mes = 9 + az.entre(9), anio = ano - curso - (mes > 12 ? 0 : 1);
      var f = anio + '-' + String(((mes - 1) % 12) + 1).padStart(2, '0') + '-' + String(1 + az.entre(27)).padStart(2, '0');
      if (new Date(f) > new Date()) f = dia(30 + az.entre(60));
      await o.archivar(tp, 'ALUMNADO', de(tt), f, true, {
        estado: 'cerrado', tipo: tp.tipo, categoria: 'ALUMNADO', tercero: de(tt),
        abiertoEl: f + 'T09:00:00.000Z', cerradoEl: f + 'T09:05:00.000Z'
      });
      hechos.cerrados++;
    }
    hechos.ms.cerrados = Date.now() - t0; t0 = Date.now();
    if (window.IndiceArchivo) await IndiceArchivo.guardar(await IndiceArchivo.construir());
    hechos.ms.indice = Date.now() - t0;
    return hechos;
  };
})();
