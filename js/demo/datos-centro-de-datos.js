/* ============================================================
   demo/datos-centro-de-datos.js — la carpeta «CENTRO DE DATOS» de la copia
   de pruebas (fila 312, docs/BEBER-DEL-CENTRO-DE-DATOS.md).

   Se llena al señalarla (Ajustes › Este ordenador › Carpeta del Centro de
   datos): un `indice.json` y sus listados inventados, escritos con las
   funciones de siempre. El alumnado y el personal son los de la copia con
   una persona más cada uno; el registro de entrada, dos apuntes. Nada
   se toma hasta que se señala la carpeta: sin ella, la copia de pruebas
   se comporta como siempre. Las fechas de «subido» van a mañana: el disco
   de mentira da siempre la hora de ahora a sus ficheros.
   ============================================================ */
(function () {
  'use strict';

  async function subcarpeta(dir, ruta) {
    var actual = dir;
    var partes = ruta.split('/');
    for (var i = 0; i < partes.length; i++) actual = await actual.getDirectoryHandle(partes[i], { create: true });
    return actual;
  }

  async function poner(dir, ruta, nombre, texto) {
    var sub = await subcarpeta(dir, 'listados/' + ruta);
    await Carpetas.escribirTexto(sub, nombre, texto);
    return 'listados/' + ruta + '/' + nombre;
  }

  function sinFinal(t) { return t.replace(/\s+$/, ''); }

  async function llenarCentro(dir) {
    if (dir._lleno) return;
    dir._lleno = true;
    var d = window.App && App.E && App.E.datos;
    var subido = new Date(Date.now() + 86400000).toISOString();
    var curso = U.cursoActual();
    var ano = curso.slice(3);
    var listados = [];
    function entrada(clave, titulo, fichero, ruta, tipo, resumen, variante) {
      listados.push({ clave: clave, variante: variante || '', titulo: titulo, fichero: fichero, ruta: ruta, tipo: tipo,
        cursoEscolar: '', subido: subido, subidoPor: 'direccion@centro-demo.es', via: 'pagina', bytes: 0, filas: 0,
        resumen: resumen, huella: 'demo-' + clave + '-' + subido, caducaDias: 30 });
    }
    if (d) {
      var reg = sinFinal(await Carpetas.leerTexto(d, 'RegAlum.csv'));
      var rutaReg = await poner(dir, 'alumnado', 'RegAlum.csv', reg + '\r\n' +
        ['Zamora Vega, Lola', '2100099', '1º de E.S.O.', '1º A', '20' + ano, 'Matriculada', '12/04/2013', '600123123', 'tutor.lola@correo-demo.es'].join(';') + '\r\n');
      entrada('alumnado', 'Alumnado', 'RegAlum.csv', rutaReg, 'csv', '15 alumnos');
      var nombrePer = 'RelPerCen ' + curso + '.csv';
      var per = sinFinal(await Carpetas.leerTexto(d, nombrePer));
      var rutaPer = await poner(dir, 'personal', nombrePer, per + '\r\n' +
        ['Medina Rivas, Teodoro', '88990011H', 'Tecnología P.E.S.', '01/09/2024', '', '650777888', 'tmedina@correo-demo.es'].join(';') + '\r\n');
      entrada('personal', 'Personal', nombrePer, rutaPer, 'csv', '7 empleados');
    }
    var ent = '"Nº.Registro","Fecha de trabajo","Fecha de registro","Extracto","Clase de documento","Estado","Tipo de remitente","Remitente","Procedencia","Modo de recepción","Doc. Adjunta"\r\n' +
      '"2026/29700692/M000000000901","01/10/2026","01/10/2026","SOLICITUD de ejemplo","Solicitudes","Completo","Familia","Lara Quintero, Bruno","","Registro presencial","S"\r\n' +
      '"2026/29700692/A000000000902","02/10/2026","02/10/2026","HORAS de ejemplo","Comunicación electrónica de la Delegación/Consejería","Completo","Unidad administrativa","Servicio de Ordenación Educativa","","Comunicación electrónica de la Adm.","N"\r\n';
    var rutaEnt = await poner(dir, 'registro-entrada', 'RegLibEntCen.csv', ent);
    entrada('registro-entrada', 'Registro de entrada', 'RegLibEntCen.csv', rutaEnt, 'csv', '2 apuntes');
    await Carpetas.escribirTexto(dir, 'configuracion.json', JSON.stringify({
      contrato: 1, actualizado: new Date().toISOString(), actualizadoPor: 'direccion@centro-demo.es',
      centro: { nombre: 'IES Centro de Demostración', codigo: '', direccion: '', localidad: 'Granada', provincia: '', telefono: '958000000' },
      correo: { direccionDelCentro: '', firma: 'Un saludo.\n{usuario}\n{centro}' }
    }));
    await Carpetas.escribirTexto(dir, 'indice.json', JSON.stringify({
      contrato: 1, actualizado: new Date().toISOString(), web: '', listados: listados
    }));
  }

  window.Demo = window.Demo || {};
  window.Demo.llenarCentro = llenarCentro;
})();
