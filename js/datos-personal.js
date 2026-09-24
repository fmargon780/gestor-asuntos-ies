/* ============================================================
   datos-personal.js — el personal (RelPerCen de Séneca más las altas a mano).

   Sacado tal cual de js/datos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo compartido (la caché, leer CSV, cargarLista…) se pide a
   `Datos._interno` (I). Se carga justo detrás de js/datos.js.
   ============================================================ */
(function () {
  if (typeof Datos === 'undefined' || !Datos._interno) return;
  var I = Datos._interno;

  /* ---------- personal (RelPerCen de Séneca + altas a mano) ----------

     Se leen TODOS los ficheros de la carpeta cuyo nombre empiece por
     RelPerCen, no solo uno. Así entra el profesorado de cursos
     anteriores y también el personal no docente, que Séneca descarga
     por separado.

     De qué curso es cada fichero lo dice su nombre:
       RelPerCen 26-27.csv             -> 26-27
       RelPerCenNodocente 2627.csv     -> 26-27
       RelPerCen 2026-2027.csv         -> 26-27
       RelPerCen.csv (sin año)         -> el curso de hoy

     Una persona está EN EL CENTRO si sale en algún fichero del curso más
     alto de todos y su fecha de cese no ha pasado. Quien solo sale en
     ficheros de cursos viejos ya no está: sigue apareciendo en la
     búsqueda, porque sus asuntos siguen existiendo, pero la aplicación
     lo dice. */

  /* El curso académico que le corresponde a un fichero, sacado de su
     nombre. Si no lleva año, se supone que es la descarga de hoy. */
  function cursoDelFichero(nombre) {
    var n = String(nombre || '');

    /* 2026-2027 */
    var largo = n.match(/(20\d{2})\s*[-–\/]\s*20\d{2}/);
    if (largo) return U.cursoDeAno(largo[1]);

    /* 26-27, 26/27, 2627: dos pares seguidos, el segundo uno más que el
       primero. Es lo que distingue "2627" (el curso) de "2026" (un año). */
    var pares = n.match(/(?:^|[^\d])(\d{2})\s*[-–\/ ]?\s*(\d{2})(?!\d)/g) || [];
    for (var i = 0; i < pares.length; i++) {
      var d = pares[i].match(/(\d{2})\s*[-–\/ ]?\s*(\d{2})$/);
      if (!d) continue;
      var a = parseInt(d[1], 10), b = parseInt(d[2], 10);
      if ((a + 1) % 100 === b) return d[1] + '-' + d[2];
    }

    /* 2026 a secas */
    var suelto = n.match(/(20\d{2})/);
    if (suelto) return U.cursoDeAno(suelto[1]);

    return U.cursoActual();
  }

  async function ficherosQueEmpiezanPor(dir, prefijo) {
    var lista = await Carpetas.ficheros(dir);
    var salida = [];
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i].nombre;
      if (!/\.csv$/i.test(n)) continue;
      if (U.normalizar(n).indexOf(U.normalizar(prefijo)) !== 0) continue;
      salida.push(lista[i]);
    }
    return salida;
  }

  /* La clave con la que se sabe que dos filas son la misma persona:
     los dígitos del documento. Si no lo trae, el nombre. */
  function clavePersona(documento, nombre) {
    var digitos = String(documento || '').replace(/\D/g, '');
    return digitos || U.normalizar(nombre);
  }

  async function cargarPersonal(dirDatos) {
    if (I.CACHE.PERSONAL) return I.CACHE.PERSONAL;

    var ficheros = await ficherosQueEmpiezanPor(dirDatos, 'RelPerCen');
    var porPersona = {};
    var resumen = [];
    var cursoMasAlto = '';

    for (var i = 0; i < ficheros.length; i++) {
      var nombreFichero = ficheros[i].nombre;
      var curso = cursoDelFichero(nombreFichero);
      if (curso > cursoMasAlto) cursoMasAlto = curso;

      var texto = await Carpetas.leerTexto(dirDatos, nombreFichero);
      var t = I.aTabla(texto);
      if (!t.filas.length) { resumen.push({ fichero: nombreFichero, curso: curso, filas: 0 }); continue; }

      var cab = t.filas[0].map(function (x) { return String(x).trim(); });
      var iNombre = I.columna(cab, 'Empleado/a');
      var iDoc = I.columna(cab, 'DNI/Pasaporte');
      var iPuesto = I.columna(cab, 'Puesto');
      var iCese = I.columna(cab, 'Fecha de cese');
      if (iNombre === -1) iNombre = 0;
      if (iDoc === -1) iDoc = 1;

      var cuantas = 0;
      for (var f = 1; f < t.filas.length; f++) {
        var fila = t.filas[f];
        var nombre = String(fila[iNombre] || '').trim();
        if (!nombre) continue;
        cuantas++;
        var documento = String(fila[iDoc] || '').trim();
        var puesto = iPuesto === -1 ? '' : String(fila[iPuesto] || '').trim();
        var cese = iCese === -1 ? '' : String(fila[iCese] || '').trim();
        var campos = {};
        for (var c = 0; c < cab.length; c++) {
          var v = String(fila[c] === undefined ? '' : fila[c]).trim();
          if (v) campos[cab[c]] = v;
        }

        var clave = clavePersona(documento, nombre);
        if (!porPersona[clave]) {
          porPersona[clave] = {
            nombre: nombre, documento: documento, nif: '', referencia: '',
            puesto: puesto, fechaCese: cese, enElCentro: false,
            deSeneca: true, categoria: 'PERSONAL', campos: campos,
            cursos: [], cursoUltimo: ''
          };
        }
        var r = porPersona[clave];
        if (r.cursos.indexOf(curso) === -1) r.cursos.push(curso);

        /* Los datos buenos son los del fichero más reciente en que sale. */
        if (curso >= r.cursoUltimo) {
          r.cursoUltimo = curso;
          r.nombre = nombre;
          r.documento = documento || r.documento;
          r.puesto = puesto;
          r.fechaCese = cese;
          r.campos = campos;
        }
      }
      resumen.push({ fichero: nombreFichero, curso: curso, filas: cuantas });
    }

    var lista = [];
    var vistos = {};
    var enElCentro = 0;
    Object.keys(porPersona).forEach(function (k) {
      var r = porPersona[k];
      r.cursos.sort();
      r.esteCurso = r.cursos.indexOf(cursoMasAlto) !== -1;
      r.enElCentro = r.esteCurso && !U.yaPaso(r.fechaCese);
      if (r.enElCentro) enElCentro++;
      r.busca = U.normalizar(r.nombre + ' ' + r.documento + ' ' + r.puesto);
      vistos[U.normalizar(r.nombre)] = true;
      lista.push(r);
    });

    /* Y encima, los que se han dado de alta a mano: conserjería,
       administración, limpieza… todo lo que Séneca no lista. Si alguien
       está en las dos listas manda Séneca, que es el dato bueno. */
    var manual = await I.cargarLista(dirDatos, 'PERSONAL', 'PERSONAL_MANUAL');
    for (var m = 0; m < manual.lista.length; m++) {
      var p = manual.lista[m];
      if (vistos[U.normalizar(p.nombre)]) continue;
      p.cursos = [];
      p.cursoUltimo = '';
      p.esteCurso = true;
      lista.push(p);
      enElCentro++;
    }

    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    I.CACHE.PERSONAL = {
      lista: lista,
      fichero: ficheros.length ? ficheros[ficheros.length - 1].nombre : null,
      ficheros: resumen, curso: cursoMasAlto,
      manuales: manual.lista.length, enElCentro: enElCentro
    };
    return I.CACHE.PERSONAL;
  }

  Object.assign(Datos, {
    cursoDelFichero: cursoDelFichero,
    clavePersona: clavePersona
  });

  Object.assign(I, {
    cargarPersonal: cargarPersonal
  });
})();
