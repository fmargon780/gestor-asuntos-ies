/* ============================================================
   tablas-datos-tutorias.js — la tabla TUTORIAS, sacada de las fichas que
   deja el Centro de datos (fila 376, docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md).

   Desde la fila 376 el Gestor ya no lee el PDF de la función tutorial de
   Séneca: el Centro de datos lo lee y deja una ficha por curso
   (`hecho/tutorias/<curso>/curso.json`), que js/centro-de-datos-tutorias.js
   copia a `_GESTOR/datos/TUTORIAS-HECHO <curso>.json`. Aquí se leen todas
   las que haya (todos los cursos: el certificado necesita los de cursos
   pasados) y se convierten a la misma forma de fila que daba el PDF
   (`TablasDatosLeer.tutoriasDeTrozos`): { curso, grupo, nombre, dni, desde,
   hasta, clave }, con el curso como «2025/2026». Lo que usa esa tabla
   (js/tablas-datos.js, js/tutor-del-grupo.js…) no cambia.

   Un PDF de función tutorial que siga suelto en la carpeta de datos no se
   lee: si su curso no está en el Centro de datos, `pdfsSueltos` lo dice
   (aviso ámbar «Súbelo al Centro de datos»).
   ============================================================ */
var TablasDatosTutorias = (function () {

  var RE_FICHA = /^TUTORIAS-HECHO (\d{2}-\d{2})\.json$/i;
  var RE_DNI = /^[XYZ]?\d{6,8}[A-Z]?$/i;
  var ACUERDO_MAXIMO = 1;

  function nombreDe(curso) { return 'TUTORIAS-HECHO ' + curso + '.json'; }

  /* «26-27» -> «2026/2027». */
  function cursoLargo(corto) {
    var m = /^(\d{2})-(\d{2})$/.exec(String(corto || ''));
    return m ? '20' + m[1] + '/20' + m[2] : String(corto || '');
  }

  /* ¿Es una parte de tutorías que se puede leer? */
  function vale(parte) {
    return !!parte && parte.conjunto === 'tutorias' && Array.isArray(parte.registros) && !(Number(parte.acuerdoHecho) > ACUERDO_MAXIMO);
  }

  /* Una línea de `tutores` (o de `funcionesSinGrupo`) -> fila de la tabla, o null si no trae documento y periodo
     (el PDF tampoco daba fila en ese caso). */
  function filaDe(linea, curso, grupo) {
    if (!linea) return null;
    var dni = String(linea.documento || '').replace(/\s+/g, '').toUpperCase();
    var desde = String(linea.desde || ''), hasta = String(linea.hasta || '');
    if (!RE_DNI.test(dni) || !desde || !hasta) return null;
    var L = window.TablasDatosLeer;
    return { curso: curso, grupo: grupo, nombre: L.limpiarNombre(linea.empleado || ''), dni: dni, desde: desde, hasta: hasta, clave: L.clave(dni) };
  }

  /* PURA. De una parte (`curso.json` ya leído) -> las filas de ese curso, en el orden de la ficha. `cursoCorto`: «26-27». */
  function filasDeParte(parte, cursoCorto) {
    var curso = cursoLargo(cursoCorto || parte.cursoEscolar);
    var L = window.TablasDatosLeer;
    var filas = [];
    (parte.registros || []).forEach(function (r) {
      var d = (r && r.datos) || {};
      var grupo = String(d.unidad || (r && r.id) || '').trim();
      (d.tutores || []).forEach(function (l) { var f = filaDe(l, curso, grupo); if (f) filas.push(f); });
    });
    (parte.funcionesSinGrupo || []).forEach(function (l) { var f = filaDe(l, curso, L.GRUPO_ATENCION); if (f) filas.push(f); });
    return filas;
  }

  /* El curso largo («2025/2026») que dice el nombre de un PDF suelto, o ''. */
  function cursoDelPdf(nombre) {
    var m = String(nombre || '').match(/(\d{4})\s*[-–_\/]\s*(\d{4})/);
    return m ? m[1] + '/' + m[2] : '';
  }

  function esPdfDeFuncionTutorial(nombre) {
    var norm = U.normalizar(nombre);
    return /\.pdf$/i.test(nombre) && (/^funcion tutorial/.test(norm) || /^relfuntut/.test(norm));
  }

  /* PURA. De los nombres de los ficheros de la carpeta de datos y de los cursos que trae el Centro de datos
     («2025/2026») -> los avisos ámbar de los PDF sueltos de un curso que el Centro de datos no trae. */
  function pdfsSueltos(nombres, cursosDelCentro) {
    var avisos = [];
    (nombres || []).forEach(function (n) {
      if (!esPdfDeFuncionTutorial(n)) return;
      var curso = cursoDelPdf(n);
      if (curso && (cursosDelCentro || []).indexOf(curso) !== -1) return;   /* el Centro de datos ya trae ese curso: el PDF sobra, no se lee */
      avisos.push({
        fichero: n,
        motivo: (curso ? 'El curso ' + curso.replace('/', '-') + ' está en un PDF suelto' : 'Hay un PDF de función tutorial suelto') +
          ', pero no en el Centro de datos. Súbelo al Centro de datos.'
      });
    });
    return avisos;
  }

  /* Lee todas las fichas de tutorías de la carpeta de datos. Devuelve { tabla | null, errores, avisos }:
     la tabla en la forma de `TablasDatos` ({ nombre, ficheros, cursos, cabecera, filas, origen }). */
  async function leer(dirDatos, lista, cabecera) {
    var salida = { tabla: null, errores: [] };
    var tut = { nombre: 'TUTORIAS', ficheros: [], cursos: [], cabecera: cabecera, filas: [], origen: 'centro-de-datos' };
    for (var i = 0; i < lista.length; i++) {
      var m = RE_FICHA.exec(lista[i].nombre);
      if (!m) continue;
      try {
        var parte = await Carpetas.leerJson(dirDatos, lista[i].nombre);
        if (!vale(parte)) throw new Error('La ficha de tutorías del Centro de datos no se puede leer.');
        var filas = filasDeParte(parte, m[1]);
        tut.ficheros.push(lista[i].nombre);
        tut.cursos.push(cursoLargo(m[1]));
        tut.filas = tut.filas.concat(filas);
      } catch (e) { salida.errores.push({ fichero: lista[i].nombre, motivo: U.mensajeDeError(e) }); }
    }
    /* Sin repetir (misma clave que usaba la tabla del PDF). */
    var vistos = {};
    tut.filas = tut.filas.filter(function (f) {
      var k = [f.curso, f.grupo, f.dni, f.desde, f.hasta].join('|');
      return vistos[k] ? false : (vistos[k] = true);
    });
    tut.cursos.sort();
    if (tut.ficheros.length) salida.tabla = tut;
    salida.errores = salida.errores.concat(pdfsSueltos(lista.map(function (f) { return f.nombre; }), tut.cursos));
    return salida;
  }

  return { nombreDe: nombreDe, cursoLargo: cursoLargo, vale: vale, filasDeParte: filasDeParte, pdfsSueltos: pdfsSueltos,
           leer: leer, ACUERDO_MAXIMO: ACUERDO_MAXIMO, RE_FICHA: RE_FICHA };
})();
window.TablasDatosTutorias = TablasDatosTutorias;
