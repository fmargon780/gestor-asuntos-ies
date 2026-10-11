/* ============================================================
   demo/personal-hecho.js — el personal ya preparado por el Centro de
   datos, en la copia de pruebas (fila 327,
   docs/PERSONAL-DEL-CENTRO-DE-DATOS.md, apartado 7).

     ?demo=1&auto=1&personalhecho=avisos | limpio | amano

   La carpeta del Centro de datos de mentira queda señalada sola, con
   permiso, y su índice trae `capacidades: ["hechos"]` y una parte del
   personal del curso de hoy (su fichero, su huella de verdad y `hecho` de
   mañana), hecha con el personal inventado de la copia. Después se toma,
   como al entrar de verdad.

     avisos: más tres avisos inventados: una persona sin DNI («Lozano Rey,
             Marina»), una que sale en los dos listados y uno del listado.
     limpio: sin ningún aviso.
     amano:  como `limpio`, y en `_GESTOR/datos` hay un RelPerCen de este
             curso apuntado a mano, con fecha real de pasado mañana y una
             persona que no está en la parte («Vega Soto, Lucas»): manda él.

   Todo vive aquí: el código de producción no sabe nada de esto. Sin
   `personalhecho=` este fichero no hace nada.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Demo) return;
  var m = /(?:^|[?&])personalhecho=([^&]*)/.exec(location.search);
  var caso = m ? decodeURIComponent(m[1]) : '';
  if (['avisos', 'limpio', 'amano'].indexOf(caso) === -1) return;

  var DIA = 86400000;
  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

  async function sha256(texto) {
    var h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
    return Array.prototype.map.call(h, function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  /* Una fila de un listado de Séneca → un registro de la parte. */
  function registroDe(cabecera, fila, tipo) {
    var celdas = [], por = {};
    cabecera.forEach(function (c, i) {
      var v = String(fila[i] === undefined ? '' : fila[i]).trim();
      if (v) { celdas.push({ columna: c, valor: v }); por[c] = v; }
    });
    var doc = por['DNI/Pasaporte'] || '';
    return {
      id: doc.toUpperCase().replace(/[\s.\-]/g, ''),
      datos: { empleado: por['Empleado/a'], documento: doc, tipoPersonal: tipo, puesto: por['Puesto'] || '', celdas: celdas }
    };
  }

  async function registros(d, curso, centro) {
    var T = Datos._interno.aTabla;
    var lista = [];
    var t = T(await Carpetas.leerTexto(d, 'RelPerCen ' + curso + '.csv'));
    t.filas.slice(1).forEach(function (f) { lista.push(registroDe(t.filas[0], f, 'docente')); });
    var dirNoDoc = await centro.getDirectoryHandle('listados').then(function (x) { return x.getDirectoryHandle('personal'); })
      .then(function (x) { return x.getDirectoryHandle(curso); }).then(function (x) { return x.getDirectoryHandle('no-docentes'); });
    var n = T(await Carpetas.leerTexto(dirNoDoc, 'RelPerCenNodocente ' + curso + '.csv'));
    n.filas.slice(1).forEach(function (f) { lista.push(registroDe(n.filas[0], f, 'no-docente')); });
    return lista.filter(function (r) { return r.datos.empleado && r.id; });
  }

  async function montar(disco) {
    var d = App.E.datos;
    var curso = U.cursoActual();
    var centro = disco.centro;
    await Demo.llenarCentro(centro);
    var hecho = new Date(Date.now() + DIA).toISOString();
    var regs = await registros(d, curso, centro);
    var avisos = [];
    if (caso === 'avisos') {
      avisos = [
        { tipo: 'personal-sin-id', id: '', datos: { empleado: 'Lozano Rey, Marina', puesto: 'Ordenanza', listado: 'no-docentes' } },
        { tipo: 'personal-en-dos-listados', id: regs[0].id, datos: { empleado: regs[0].datos.empleado } },
        { tipo: 'personal-fichero', id: '', datos: { listado: 'docentes', detalle: 'En el listado falta la columna Teléfono.' } }
      ];
    }
    var parte = { acuerdoHecho: 1, conjunto: 'personal', parte: 'curso', cursoEscolar: curso, generado: hecho, origen: 'centro-de-datos-ies',
      campos: [], registros: regs, avisos: avisos };
    var texto = JSON.stringify(parte);
    var ruta = 'hecho/personal/' + curso + '/curso.json';
    var dir = centro;
    var trozos = ruta.split('/');
    for (var i = 0; i < trozos.length - 1; i++) dir = await dir.getDirectoryHandle(trozos[i], { create: true });
    await Carpetas.escribirTexto(dir, 'curso.json', texto);
    var indice = await Carpetas.leerJson(centro, 'indice.json');
    indice.capacidades = (indice.capacidades || []).concat(['hechos']);
    indice.hechos = (indice.hechos || []).concat([{ conjunto: 'personal', parte: 'curso', cursoEscolar: curso, acuerdoHecho: 1, ruta: ruta, idDrive: '',
      hecho: hecho, huella: await sha256(texto), registros: regs.length, bytes: texto.length, alDia: true, fuentes: [] }]);
    await Carpetas.escribirTexto(centro, 'indice.json', JSON.stringify(indice));

    if (caso === 'amano') {
      var nombre = 'RelPerCen ' + curso + '.csv';
      var csv = await Carpetas.leerTexto(d, nombre);
      await Carpetas.escribirTexto(d, nombre, csv.replace(/\s+$/, '') + '\r\n' + 'Vega Soto, Lucas;55667788K;Música P.E.S.;01/09/2022;;650999000;lvega@correo-demo.es\r\n');
      await DatosQueTengo.apuntar(nombre, { via: 'a-mano', nombreOriginal: nombre, fechaOriginal: new Date(Date.now() + 2 * DIA).toISOString() });
    }
  }

  /* Se llama (sin esperar) cuando la demostración ya está montada. */
  window.Demo.prepararPersonalHecho = async function (disco) {
    try {
      await montar(disco);
      await Almacen.guardar('centro-de-datos-carpeta', disco.centro);
      for (var i = 0; i < 10; i++) {
        var r = await CentroDeDatos.traer({ avisar: false, pedir: false });
        if (r.motivo !== 'ya se está tomando') break;
        await esperar(1000);
      }
      if (window.DatosQueTengo) DatosQueTengo.olvidarMirada();
      window.Demo.personalHechoListo = true;
    } catch (e) { console.error('personalhecho:', e); }
  };
})();
