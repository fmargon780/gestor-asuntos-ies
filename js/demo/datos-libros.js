/* ============================================================
   demo/datos-libros.js — la ficha de entrega de libros en la copia de pruebas
   (fila 501, docs/501-FICHA-ENTREGA-LIBROS.md).

     ?demo=1&auto=1&libros=1

   Deja, con datos inventados:
     - el listado de libros de texto del curso de hoy (`LIBROS-HECHO <curso>.json`, como lo deja el
       Centro de datos): 1º a 4º de ESO. Bachillerato NO trae libros.
     - las asignaturas de la matrícula de varios alumnos (`ALUMNADO-BD.json`):
         2100001 Aguilar Ponce, Marina (1º A): 1º ESO con Religión Católica y Francés.
         2100040 Soler Vega, Adrián (1º A): 1º ESO sin Religión ni Francés.
         2100012 Klein Soto, Ana (1º C): una asignatura («Tecnología Aplicada») que no está en el listado.
         2100004, 2100005, 2100013, 2100014, 2100015 (2º B): 2º ESO completo.
         2100016 Pardo Luna, Nerea (2º B): una asignatura («Taller de Teatro») que no está en el listado.
         2100007 Fuentes Calvo, Rubén (1º Bach A): Bachillerato, sin libros en el listado.
     - una columna «Documento de identidad» inventada en el RegAlum (DNI buscable).
     - el tipo FICHA ENTREGA LIBROS con sus campos, su guía y su plantilla.
   Sin `libros=1` este fichero no hace nada. Lo llama js/demo/datos.js al montar.
   ============================================================ */
(function () {
  'use strict';
  var m = /(?:^|[?&])libros=([^&]*)/.exec(location.search);
  if (!m || m[1] !== '1') return;

  var LISTADO = {
    eso1: [['Biología y Geología', 'Biología y Geología 1º ESO', 'Editorial Demo', '9780000000011', '24.5'], ['Geografía e Historia', 'Geografía e Historia 1º ESO', 'Editorial Demo', '9780000000028', '26'],
      ['Lengua Castellana y Literatura', 'Lengua 1º ESO Proyecto Demo', 'Editorial Demo', '9780000000035', '37.9'], ['Inglés', 'English Demo 1', 'Editorial Demo', '9780000000042', '29.75'],
      ['Matemáticas', 'Matemáticas 1º ESO', 'Editorial Demo', '9780000000059', '27.4'], ['Música', 'Música 1º ESO', 'Editorial Demo', '9780000000066', '18'],
      ['Religión Católica', 'Religión 1º ESO', 'Editorial Demo', '9780000000073', '15'], ['Francés (Segundo Idioma)', 'Jeu de Mots 1', 'Editorial Demo', '9780000000080', '31.65'],
      ['Educación Física'], ['Tutoría']],
    eso2: [['Física y Química', 'Física y Química 2º ESO', 'Editorial Demo', '9780000000103', '28'], ['Geografía e Historia', 'Geografía e Historia 2º ESO', 'Editorial Demo', '9780000000110', '26'],
      ['Lengua Castellana y Literatura', 'Lengua 2º ESO Proyecto Demo', 'Editorial Demo', '9780000000127', '37.9'], ['Inglés', 'English Demo 2', 'Editorial Demo', '9780000000134', '29.75'],
      ['Matemáticas', 'Matemáticas 2º ESO', 'Editorial Demo', '9780000000141', '27.4'], ['Educación Física']],
    eso3: [['Biología y Geología', 'Biología y Geología 3º ESO', 'Editorial Demo', '9780000000202', '25'], ['Inglés', 'English Demo 3', 'Editorial Demo', '9780000000219', '29.75'],
      ['Matemáticas', 'Matemáticas 3º ESO', 'Editorial Demo', '9780000000226', '27.4'], ['Educación Física']],
    eso4: [['Geografía e Historia', 'Geografía e Historia 4º ESO', 'Editorial Demo', '9780000000301', '26'], ['Inglés', 'English Demo 4', 'Editorial Demo', '9780000000318', '29.75'],
      ['Matemáticas', 'Matemáticas 4º ESO', 'Editorial Demo', '9780000000325', '27.4'], ['Educación Física']]
  };
  var TEXTO = { eso1: '1º ESO', eso2: '2º ESO', eso3: '3º ESO', eso4: '4º ESO' };

  var M1 = ['Biología y Geología', 'Geografía e Historia', 'Lengua Castellana y Literatura', 'Inglés', 'Matemáticas', 'Música', 'Educación Física', 'Tutoría'];
  var M2 = ['Física y Química', 'Geografía e Historia', 'Lengua Castellana y Literatura', 'Inglés', 'Matemáticas', 'Educación Física'];
  var MATERIAS = {
    '2100001': M1.concat(['Religión Católica', 'Francés (Segundo Idioma)']),
    '2100040': M1,
    '2100012': M1.concat(['Tecnología Aplicada']),
    '2100004': M2, '2100005': M2, '2100013': M2, '2100014': M2, '2100015': M2,
    '2100016': M2.slice(0, 5).concat(['Taller de Teatro']),
    '2100007': ['Filosofía', 'Lengua Castellana y Literatura I', 'Inglés I']
  };

  function registros() {
    var salida = [];
    Object.keys(LISTADO).forEach(function (nivel) {
      LISTADO[nivel].forEach(function (f) {
        var d = { nivel: nivel, nivelTexto: TEXTO[nivel], materia: f[0], conLibro: f.length > 1 };
        if (f.length > 1) { d.titulo = f[1]; d.editorial = f[2]; d.isbn = f[3]; d.importe = Number(f[4]); d.anioImplantacion = 2024; d.digital = false; d.chequeLibro = true; }
        salida.push({ id: nivel + '~' + f[0].toLowerCase() + '~' + (f[3] || ''), datos: d });
      });
    });
    return salida;
  }

  async function construir() {
    try {
      var curso = U.cursoActual();
      var parte = { acuerdoHecho: 1, conjunto: 'libros', parte: 'curso', cursoEscolar: curso, generado: new Date().toISOString(),
        origen: 'centro-de-datos-ies', campos: [], registros: registros(), avisos: [] };
      await Carpetas.escribirTexto(App.E.datos, LibrosHecho.nombreDe(curso), JSON.stringify(parte));

      /* Una columna «Documento de identidad» inventada para todos, para poder buscar por DNI (sin dejar «falta el DNI» a nadie). */
      var csv = (await Carpetas.leerTexto(App.E.datos, 'RegAlum.csv')).replace(/\s+$/, '').split(/\r?\n/);
      var LETRA = 'TRWAGMYFPDXBNJZSQVHLCKE';
      csv = csv.map(function (l, i) { var n = 30000000 + i * 1237; return l + ';' + (i === 0 ? 'Documento de identidad' : n + LETRA[n % 23]); });
      await Carpetas.escribirTexto(App.E.datos, 'RegAlum.csv', csv.join('\r\n') + '\r\n');

      await AlumnadoBD.guardar({
        acuerdo: AlumnadoBD.ACUERDO, generado: new Date().toISOString(), origen: 'centro-de-datos-ies', cursoAcademico: curso,
        campos: [{ clave: 'materias', etiqueta: 'Materias matriculadas', apartado: 'Materias', tipo: 'tabla',
          columnas: [{ clave: 'materia', etiqueta: 'Materia' }, { clave: 'situacion', etiqueta: 'Situación' }] }],
        alumnos: Object.keys(MATERIAS).map(function (id) {
          return { idEscolar: id, matriculado: true, datos: { materias: MATERIAS[id].map(function (x) { return { materia: x, situacion: 'MATR' }; }) } };
        })
      });
      if (window.Datos && Datos.olvidar) Datos.olvidar('ALUMNADO');
      if (window.LibrosFicha && !LibrosFicha.tipoQueHay()) await LibrosFicha.crear();
    } catch (e) { console.error('libros:', e); }
  }

  window.Demo = window.Demo || {};
  window.Demo.libros = { construir: construir };
})();
