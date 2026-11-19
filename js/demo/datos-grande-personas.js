/* ============================================================
   demo/datos-grande-personas.js — el juego GRANDE de personas de la copia de pruebas
   (fila 711, docs/711-DATOS-INVENTADOS-GRANDES.md). Solo se carga con `?demo=1&auto=1&grande=1`.

   Todo inventado, con semilla fija (los mismos datos siempre). Añade, al RegAlum.csv, a empresas.csv y a
   tutores.csv que ya escribe js/demo/datos-ficheros.js, unos 700 alumnos, 55 personas de personal y los
   casos raros de docs/CASOS-DE-PRUEBA.md. Sin `grande=1` este fichero no se carga.
   Tamaños en `Demo.grande.TAM`: una constante fácil de cambiar.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  var G = window.Demo.grande = window.Demo.grande || {};
  G.TAM = G.TAM || { alumnos: 700, personal: 55, abiertos: 40, cerrados: 400 };

  /* Generador con semilla fija (mulberry32). */
  G.azar = function (semilla) {
    var a = semilla >>> 0;
    var f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.entre = function (n) { return Math.floor(f() * n); };
    f.de = function (lista) { return lista[Math.floor(f() * lista.length)]; };
    return f;
  };

  var NOMBRES_H = ['Adrián', 'Álvaro', 'Pablo', 'Hugo', 'Mateo', 'Daniel', 'Lucas', 'Martín', 'Leo', 'Manuel', 'Javier', 'Sergio', 'Iván', 'Óscar', 'Raúl', 'Íñigo', 'Joaquín', 'Rubén', 'Nicolás', 'Gonzalo'];
  var NOMBRES_M = ['Lucía', 'Sofía', 'Martina', 'Paula', 'Julia', 'Valeria', 'Noa', 'Carla', 'Irene', 'Alba', 'Sara', 'Ángela', 'Marta', 'Elena', 'Claudia', 'Nerea', 'Rocío', 'Inés', 'Cristina', 'Aitana'];
  var APELLIDOS = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Castro', 'Ortega', 'Rubio', 'Marín', 'Sanz', 'Núñez', 'Iglesias', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego', 'Vidal', 'León', 'Márquez', 'Peña', 'Flores', 'Cabrera', 'Campos', 'Vega', 'Fuentes', 'Carrasco', 'Díez', 'Reyes', 'Caballero', 'Nieto', 'Aguilar', 'Pascual', 'Santana', 'Herrero', 'Montero', 'Lorenzo', 'Hidalgo', 'Giménez', 'Ibáñez', 'Ferrer', 'Duran', 'Santiago', 'Benítez', 'Mora', 'Vicente', 'Vargas', 'Arias', 'Carmona', 'Crespo', 'Román', 'Pastor', 'Soto', 'Sáez', 'Velasco', 'Moya', 'Soler', 'Parra', 'Esteban', 'Bravo', 'Gallardo', 'Rojas'];
  /* Unidades: [curso, unidad, nº de grupos]. */
  var UNIDADES = [['1º de E.S.O.', '1º', 4], ['2º de E.S.O.', '2º', 4], ['3º de E.S.O.', '3º', 3], ['4º de E.S.O.', '4º', 3], ['1º de Bachillerato', '1º Bach', 3], ['2º de Bachillerato', '2º Bach', 2]];

  function fecha(az, edad) {
    var d = String(1 + az.entre(28)).padStart(2, '0'), m = String(1 + az.entre(12)).padStart(2, '0');
    return d + '/' + m + '/' + (new Date().getFullYear() - edad);
  }

  /* Los alumnos del juego grande como filas de RegAlum (sin cabecera) y la lista de sus terceros. */
  G.alumnos = function () {
    var az = G.azar(711);
    var curso = U.cursoActual(), ano = '20' + curso.slice(3);
    var filas = [], terceros = [];
    var porUnidad = [];
    UNIDADES.forEach(function (u) { for (var g = 0; g < u[2]; g++) porUnidad.push([u[0], u[1] + ' ' + String.fromCharCode(65 + g), 12 + u[0].length % 3]); });
    var total = G.TAM.alumnos, n = 0;
    function id() { return String(2200000 + n); }
    function anadir(nombre, idEsc, unidad, estado, extra) {
      n++;
      extra = extra || {};
      var correoT = 'tutor.g' + n + '@correo-demo.es';
      filas.push([nombre, idEsc, unidad[0], unidad[1], ano, estado || 'Matriculado', extra.nacimiento || fecha(az, 12 + az.entre(6)),
        '6' + String(10000000 + az.entre(89999999)), correoT, '',
        'Calle Inventada ' + (1 + az.entre(90)), '29100', 'Localidad de pruebas', 'Málaga',
        extra.t1 || az.de(NOMBRES_M), extra.t1a || az.de(APELLIDOS), extra.t1b || az.de(APELLIDOS),
        extra.t2 || '', extra.t2a || '', extra.t2b || '', extra.custodia || '']);
      if (idEsc && (estado || 'Matriculado') !== 'Baja') terceros.push({ nombre: nombre, id: idEsc });
    }
    var i = 0;
    while (n < total - 40) {
      var u = porUnidad[i++ % porUnidad.length];
      var ap1 = az.de(APELLIDOS), ap2 = az.de(APELLIDOS);
      var nom = az.de(az() < 0.5 ? NOMBRES_H : NOMBRES_M);
      var idEsc = id();
      anadir(ap1 + ' ' + ap2 + ', ' + nom, idEsc, u);
      /* Un hermano de cada veinticinco, en otra unidad, con los mismos apellidos y tutor. */
      if (n % 25 === 0 && n < total - 40) {
        var otra = porUnidad[(i + 7) % porUnidad.length];
        anadir(ap1 + ' ' + ap2 + ', ' + az.de(NOMBRES_M), id(), otra);
      }
    }
    /* --- los casos raros (docs/CASOS-DE-PRUEBA.md): nombres fijos y reconocibles --- */
    var u1 = porUnidad[0], u2 = porUnidad[5], u3 = porUnidad[16];
    anadir('Homónimo Primero, Antonio', id(), u1, '', { t1: 'Antonia', t1a: 'Homónimo', t1b: 'Primero' });
    anadir('Homónimo Primero, Antonio', id(), u2, '', { t1: 'Manuel', t1a: 'Homónimo', t1b: 'Primero' });
    anadir('de la Cruz del Río, Mª Carmen', id(), u1, 'Matriculada');
    anadir('del Valle y de la Peña, Íñigo', id(), u2, 'Matriculado');
    anadir('Muñoz Peña, Ñusta Núñez', id(), u1, 'Matriculada');
    anadir('Caso Nombrelargo Dosapellidos, María Concepción Josefa Remedios Dolores Trinidad Soledad', id(), u3, 'Matriculada');
    anadir('Sinnúmero Escolar, Aspirante', '', u1, 'Matriculado');
    anadir('Cambiado de Grupo, Leo', id(), u1, 'Matriculado', { t1: 'Rosa', t1a: 'Cambiado', t1b: 'de Grupo' });
    anadir('Cambiado de Grupo, Leo', id(), u2, 'Baja', { t1: 'Rosa', t1a: 'Cambiado', t1b: 'de Grupo' });
    anadir('Bajademediocurso Ruiz, Pilar', id(), u3, 'Baja');
    anadir('Custodia Compartida, Hugo', id(), u1, 'Matriculado', { t1: 'Ana', t1a: 'Custodia', t1b: 'Compartida', t2: 'Luis', t2a: 'Custodia', t2b: 'Compartida', custodia: 'Custodia Compartida, Ana' });
    anadir('Custodia Dudosa, Vera', id(), u2, 'Matriculada', { t1: 'Ana', t1a: 'Custodia', t1b: 'Dudosa', t2: 'Luis', t2a: 'Custodia', t2b: 'Dudosa', custodia: 'Abuela materna' });
    anadir('Sin Custodia Dicha, Noa', id(), u3, 'Matriculada', { t1: 'Eva', t1a: 'Sin', t1b: 'Custodia', t2: 'Pedro', t2a: 'Sin', t2b: 'Custodia' });
    while (n < total) anadir(az.de(APELLIDOS) + ' ' + az.de(APELLIDOS) + ', ' + az.de(NOMBRES_M), id(), porUnidad[n % porUnidad.length]);
    return { filas: filas, terceros: terceros };
  };

  /* Se llama justo después de `escribirDatos` (datos.js): añade lo grande a los CSV de siempre. */
  G.escribirPersonas = async function () {
    var d = App.E.datos, curso = U.cursoActual();
    async function anadirA(nombre, filas) {
      var texto = await Carpetas.leerTexto(d, nombre);
      await Carpetas.escribirTexto(d, nombre, texto.replace(/\r?\n$/, '') + '\r\n' + filas.map(function (f) { return f.join(';'); }).join('\r\n') + '\r\n');
    }
    var al = G.alumnos();
    G.terceros = al.terceros;
    await anadirA('RegAlum.csv', al.filas);

    var az = G.azar(712), per = [], cargos = ['Matemáticas P.E.S.', 'Lengua P.E.S.', 'Inglés P.E.S.', 'Física y Química P.E.S.', 'Biología y Geología P.E.S.', 'Geografía e Historia P.E.S.', 'Educación Física P.E.S.', 'Francés P.E.S.', 'Dibujo P.E.S.', 'Música P.E.S.'];
    for (var i = 0; i < G.TAM.personal; i++) {
      var nom = az.de(APELLIDOS) + ' ' + az.de(APELLIDOS) + ', ' + az.de(az() < 0.5 ? NOMBRES_H : NOMBRES_M);
      per.push([nom, String(30000000 + i * 137) + 'ABCDEFGHJKLMNPRT'.charAt(i % 16), cargos[i % cargos.length], '01/09/' + (2005 + i % 20), '', '650' + String(100000 + az.entre(899999)), 'pg' + i + '@correo-demo.es', '']);
    }
    await anadirA('RelPerCen ' + curso + '.csv', per);

    /* Terceros: empresa con nombre comercial y NIF repetido; tutores con DNI, NIE y pasaporte. */
    await anadirA('empresas.csv', [
      ['Grande Suministros del Sur, S.L.', 'Gran Sur', 'B20000001', 'Ana Grande', '950700001', 'grande@gransur-demo.es'],
      ['Grande Suministros del Norte, S.L.', 'Gran Norte', 'B20000001', 'Pedro Grande', '950700002', 'norte@gransur-demo.es']
    ]);
    await anadirA('tutores.csv', [
      ['Tutor Con Dni, Pilar', '12345678Z', '600700001', '', 'dni@correo-demo.es', '', 'Calle Inventada 1', ''],
      ['Tutor Con Nie, Mohamed', 'X1234567L', '600700002', '', 'nie@correo-demo.es', '', 'Calle Inventada 2', ''],
      ['Tutor Con Pasaporte, Olga', 'PA1234567', '600700003', '', 'pasaporte@correo-demo.es', '', 'Calle Inventada 3', '']
    ]);
  };
})();
