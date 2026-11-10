/* ============================================================
   demo/datos-ficheros.js — las fechas, el CSV y los ficheros de datos (RegAlum, RelPerCen, altas a mano) del juego de datos.
   (fila 560, docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/demo/datos.js sin cambiar nada; el código es el de siempre,
   movido tal cual). Se carga antes que js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  window.Demo.datos = window.Demo.datos || {};
  var I = window.Demo.datos._interno = window.Demo.datos._interno || {};   /* lo que se comparten las piezas de datos.js */

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
    /* Fila 295: «Correo del alumno» solo en Ibarra Nieto, Sara (2100010), para que «A quién» de «Enviar…» cambie la lista;
       y Gallardo Reyes, Vera (2100008) sin ningún correo. */
    var ALUMNO_CON_CORREO = { '2100010': 'sara.ibarra@correo-demo.es' };
    await Carpetas.escribirTexto(d, 'RegAlum.csv', csv([
      ['Alumno/a', 'Nº Id. Escolar', 'Curso', 'Unidad', 'Año de la matrícula', 'Estado Matrícula', 'Fecha de nacimiento', 'Teléfono del tutor', 'Correo del tutor'],
      ['Aguilar Ponce, Marina', '2100001', '1º de E.S.O.', '1º A', '20' + anoMatricula, 'Matriculada', '14/03/2013', '600111222', 'tutor.marina@correo-demo.es'],
      ['Aguilar Ponce, Pablo', '2100002', '3º de E.S.O.', '3º A', '20' + anoMatricula, 'Matriculado', '02/06/2011', '600111222', 'tutor.marina@correo-demo.es'],
      ['Bermúdez Ortiz, Álvaro', '2100003', '1º de E.S.O.', '1º C', '20' + anoMatricula, 'Matriculado', '02/09/2014', '600333444', 'tutor.alvaro@correo-demo.es'],
      ['Castro Reina, Noa', '2100004', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculada', '19/11/2012', '600444555', 'tutor.noa@correo-demo.es'],
      ['Delgado Prieto, Iker', '2100005', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculado', '05/01/2013', '600555666', 'tutor.iker@correo-demo.es'],
      ['Espejo Montes, Carla', '2100006', '4º de E.S.O.', '4º A', '20' + anoMatricula, 'Matriculada', '23/04/2011', '600666777', 'tutor.carla@correo-demo.es'],
      ['Fuentes Calvo, Rubén', '2100007', '1º de Bachillerato', '1º Bach A', '20' + anoMatricula, 'Matriculado', '11/05/2009', '600777888', 'tutor.ruben@correo-demo.es'],
      ['Gallardo Reyes, Vera', '2100008', '1º de Bachillerato', '1º Bach A', '20' + anoMatricula, 'Matriculada', '30/07/2009', '600888999', ''],
      ['Herrera Lozano, Diego', '2100009', '2º de Bachillerato', '2º Bach B', '20' + anoMatricula, 'Matriculado', '17/02/2008', '600999000', 'tutor.diego@correo-demo.es'],
      ['Quintero Maldonado, María Concepción Josefa Remedios', '2100020', '3º de E.S.O.', '3º A', '20' + anoMatricula, 'Matriculada', '03/03/2011', '600000222', 'tutor.maria@correo-demo.es'],
      ['Ibarra Nieto, Sara', '2100010', '3º de E.S.O.', '3º A', '20' + anoMatricula, 'Matriculada', '08/08/2011', '600000111', 'tutor.sara@correo-demo.es'],
      ['Jimenez Rubio, Mateo', '2100011', '4º de E.S.O.', '4º A', '20' + anoMatricula, 'Matriculado', '21/12/2010', '600111333', 'tutor.mateo@correo-demo.es'],
      ['Klein Soto, Ana', '2100012', '1º de E.S.O.', '1º C', '20' + anoMatricula, 'Matriculada', '09/09/2014', '600222444', 'tutor.ana@correo-demo.es'],
      ['Lara Quintero, Bruno', '2100013', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculado', '15/10/2012', '600333555', 'tutor.bruno@correo-demo.es'],
      /* Fila 293: tres más en 2º B, para que el asunto de grupo de la demostración sea de una unidad con seis. */
      ['Navarro Gil, Lucía', '2100014', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculada', '04/04/2013', '600141414', 'tutor.lucia@correo-demo.es'],
      ['Ortega Paz, Darío', '2100015', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculado', '27/07/2012', '600151515', 'tutor.dario@correo-demo.es'],
      ['Pardo Luna, Nerea', '2100016', '2º de E.S.O.', '2º B', '20' + anoMatricula, 'Matriculada', '13/01/2013', '600161616', 'tutor.nerea@correo-demo.es'],
      /* Fila 285: las dos alumnas y alumnos de «Hacer este hito», con correo del tutor para poder enviarles el certificado. */
      ['Vidal Soto, Irene', '2100030', '4º de E.S.O.', '4º A', '20' + anoMatricula, 'Matriculada', '12/05/2010', '600121212', 'tutor.irene@correo-demo.es'],
      ['Moreno Sanz, Hugo', '2100031', '4º de E.S.O.', '4º A', '20' + anoMatricula, 'Matriculado', '30/01/2010', '600131313', 'tutor.hugo@correo-demo.es'],
      /* Fila 296: dos alumnos con el mismo nombre y apellidos en unidades distintas (para «Pegar una lista»). */
      ['Soler Vega, Adrián', '2100040', '1º de E.S.O.', '1º A', '20' + anoMatricula, 'Matriculado', '10/10/2013', '600404040', 'tutor.adrian1@correo-demo.es'],
      ['Soler Vega, Adrián', '2100041', '3º de E.S.O.', '3º A', '20' + anoMatricula, 'Matriculado', '05/05/2011', '600414141', 'tutor.adrian3@correo-demo.es'],
      /* aspirante sin matricular: sin fila propia hasta que se dé de alta a mano */
      /* un alumno antiguo (ya no está matriculado este curso) */
      ['Moya Santana, Elena', '2099998', '4º de E.S.O.', '4º A', '20' + (parseInt(anoMatricula, 10) - 1), 'Baja', '02/02/2010', '600444888', 'tutor.elena@correo-demo.es']
    ].map(function (fila, i) { return fila.concat([i === 0 ? 'Correo del alumno' : (ALUMNO_CON_CORREO[fila[1]] || '')]); })
    /* Fila 344 (etiquetas): la dirección de casa y, de los dos hermanos Aguilar, el nombre del tutor; Gallardo Reyes, Vera, sin dirección. */
    .map(function (fila, i) {
      if (i === 0) return fila.concat(['Domicilio', 'Código postal', 'Localidad', 'Provincia', 'Nombre Primer tutor', 'Primer apellido Primer tutor', 'Segundo apellido Primer tutor']);
      var id = fila[1];
      if (id === '2100008') return fila.concat(['', '', '', '', '', '', '']);
      if (id === '2100001' || id === '2100002') return fila.concat(['Calle Mayor 4', '14900', 'Lucena', 'Córdoba', 'Rocío', 'Ponce', 'Duarte']);
      return fila.concat(['Calle Demo ' + (parseInt(id.slice(-2), 10) || 1) + ', 1º', '14900', 'Lucena', 'Córdoba', '', '', '']);
    })));

    /* RelPerCen: profesorado de este curso (Vidal Cano, el ordenanza, va en el listado de no docentes: fila 352). */
    var ayer = hace(2).split('-');
    var ceseDeAyer = ayer[2] + '/' + ayer[1] + '/' + ayer[0];
    await Carpetas.escribirTexto(d, 'RelPerCen ' + curso + '.csv', csv([
      ['Empleado/a', 'DNI/Pasaporte', 'Puesto', 'Fecha de toma de posesión', 'Fecha de cese', 'Teléfono', 'Correo', 'Especialidad'],
      ['Otero Campos, Marta', '11223344A', 'Matemáticas P.E.S.', '01/09/2015', '', '650111222', 'motero@correo-demo.es', 'Matemáticas'],
      ['Reyes Palma, Fernando', '22334455B', 'Lengua P.E.S.', '01/09/2010', '', '650222333', 'freyes@correo-demo.es', 'Lengua'],
      ['Uceda Molina, Patricia', '33445566C', 'Jefatura de Estudios', '01/09/2020', '', '650333444', 'puceda@correo-demo.es', ''],
      /* Fila 352: uno que ya se fue del centro (cese pasado), para el aviso al claustro. */
      ['Bonilla Cascado, Manuel', '55667788E', 'Geografía e Historia P.E.S.', '01/09/2016', ceseDeAyer, '650666777', 'mbonilla@correo-demo.es', 'Geografía e Historia'],
      /* Fila 299: una tutora sin correo en su ficha (js/demo/datos-tutor.js). */
      ['Cabello Ruiz, Esperanza', '77889900G', 'Inglés P.E.S.', '01/09/2018', '', '650555666', '', 'Inglés']
    ]));

    await Carpetas.escribirTexto(d, 'RelPerCenNodocente ' + curso + '.csv', csv([
      ['Empleado/a', 'DNI/Pasaporte', 'Puesto', 'Fecha de toma de posesión', 'Fecha de cese', 'Teléfono', 'Correo'],
      ['Vidal Cano, Ramón', '44556677D', 'Ordenanza', '01/09/2012', '', '650444555', 'rvidal@correo-demo.es']
    ]));

    /* empresas.csv: alta manual (CONTEXTO.md: Razón social · Nombre
       comercial · NIF · Contacto · Teléfono · Correo). */
    await Carpetas.escribirTexto(d, 'empresas.csv', csv([
      ['Razón social', 'Nombre comercial', 'NIF', 'Contacto', 'Teléfono', 'Correo'],
      ['Suministros Escolares Dobla, S.L.', 'Dobla', 'B12345678', 'Laura Santos', '950111000', 'pedidos@dobla-demo.es'],
      ['Mantenimientos del Sur, S.A.', '', 'A87654321', 'Julio Reina', '950222000', 'oficina@mantesur-demo.es'],
      ['Copistería Central', 'Copistería Central', '99887766X', 'Nuria Paz', '950333000', 'info@copicentral-demo.es'],
      /* Fila 328: una sin NIF y dos con el mismo (la entrega al Centro de datos las lleva todas). */
      ['Papelería La Esquina, S.L.', 'La Esquina', 'B-11223344', 'Rosa Vela', '950444000', 'esquina@papeleria-demo.es'],
      ['Reparaciones de Mentira', '', '', 'Tomás Gil', '950555000', ''],
      ['Suministros Dobla Norte, S.L.', 'Dobla Norte', 'b12345678', '', '950666000', '']
    ]));

    if (window.Demo.administraciones) await Demo.administraciones.escribir(d);   /* fila 329: cuatro Administraciones inventadas */

    /* Fila 238: dos ficheros del Consejo Escolar (como los da Séneca: el de
       2024-2025 con Cese antes que Nombramiento y un asterisco en HTML pegado
       a la cabecera), en `Tablas`. Nombres inventados. */
    var tablas = await d.getDirectoryHandle('Tablas', { create: true });
    await Carpetas.escribirTexto(tablas, 'RegMieConEsc 2024-2025.csv', [
      'Sector;Miembro;Cese;"Nombramiento<font class=""asterisco""> *</font>"',
      'Profesorado;OTERO CAMPOS, MARTA;;15/10/2022',
      'Profesorado;Reyes Palma, Fernando;30/06/2025;15/10/2021',
      'Equipo Directivo;Uceda Molina, Patricia (DIRECTOR/A);;',
      'Padres y madres;Ponce Duarte, Rocío (REPRESENTANTE DE LA A.M.P.A. MAYORITARIA);;01/11/2023',
      'Personal de administración y servicios;Vidal Cano, Ramón;;10/11/2023', ''
    ].join('\r\n'));
    await Carpetas.escribirTexto(tablas, 'RegMieConEsc 2025-2026.csv', [
      'Sector;Miembro;"Nombramiento<font class=""asterisco""> *</font>";Cese',
      'Profesorado;Otero Campos, Marta;15/10/2022;',
      'Profesorado (Impulsor de medidas de Igualdad);Otero Campos, Marta;01/10/2025;',
      'Equipo Directivo;Uceda Molina, Patricia (DIRECTOR/A);;',
      'Personal de administración y servicios;Vidal Cano, Ramón;10/11/2023;', ''
    ].join('\r\n'));

    /* tutores.csv: tutores legales ya dados de alta como tercero. */
    await Carpetas.escribirTexto(d, 'tutores.csv', csv([
      ['Nombre', 'Documento', 'Teléfono', 'Teléfono 2', 'Correo', 'Correo 2', 'Domicilio', 'Hijos'],
      ['Ponce Duarte, Rocío', '55667788E', '600111222', '', 'tutor.marina@correo-demo.es', '', 'Calle Mayor 4', ''],
      ['Ortiz Vela, Manuel', '66778899F', '600333444', '', 'tutor.alvaro@correo-demo.es', '', 'Avda. del Parque 9', '']
    ]));
  }

  I.HOY = HOY;
  I.hace = hace;
  I.csv = csv;
  I.escribirDatos = escribirDatos;
})();
