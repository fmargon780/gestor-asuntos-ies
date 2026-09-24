/* ============================================================
   datos.js — de dónde salen los terceros.

   Alumnado: del RegAlum.csv de Séneca, que se deja en
             _GESTOR/datos.
   Personal: del RelPerCen.csv de Séneca, que se deja en la misma
             carpeta, más un personal.csv a mano para quien no
             aparece en Séneca (conserjería, administración,
             limpieza, empresas de servicios…).
   Empresas y otros: de dos CSV que mantiene la propia aplicación,
             en la misma carpeta.
   ============================================================ */
var Datos = (function () {

  var CACHE = {};   /* lo leído en esta sesión, para no releer 10 MB cada vez */

  /* ---------- lectura de CSV ---------- */

  function partirLinea(linea, sep) {
    var campos = [], actual = '', dentro = false;
    for (var i = 0; i < linea.length; i++) {
      var c = linea.charAt(i);
      if (dentro) {
        if (c === '"') {
          if (linea.charAt(i + 1) === '"') { actual += '"'; i++; }
          else dentro = false;
        } else actual += c;
      } else {
        if (c === '"') dentro = true;
        else if (c === sep) { campos.push(actual); actual = ''; }
        else actual += c;
      }
    }
    campos.push(actual);
    return campos;
  }

  function aTabla(texto) {
    texto = String(texto || '').replace(/^﻿/, '');
    var lineas = texto.split(/\r?\n/);
    var primera = '';
    for (var i = 0; i < lineas.length; i++) { if (lineas[i].trim()) { primera = lineas[i]; break; } }
    var sep = (primera.split(';').length - 1) > (primera.split(',').length - 1) ? ';' : ',';
    var tabla = [];
    for (var j = 0; j < lineas.length; j++) {
      if (!lineas[j].trim()) continue;
      tabla.push(partirLinea(lineas[j], sep));
    }
    return { filas: tabla, sep: sep };
  }

  function aCsv(cabecera, filas) {
    function campo(v) {
      var t = String(v === null || v === undefined ? '' : v);
      return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }
    var lineas = [cabecera.map(campo).join(';')];
    for (var i = 0; i < filas.length; i++) lineas.push(filas[i].map(campo).join(';'));
    return lineas.join('\r\n') + '\r\n';
  }

  /* ---------- alumnado (RegAlum de Séneca) ---------- */

  /* Busca una columna por su título. Se le pueden dar varios títulos
     posibles, porque Séneca no siempre los escribe igual según qué
     informe se descargue. Primero se prueba el nombre exacto; si no
     aparece ninguno, se admite que el título empiece por él. */
  function columna(cabecera, nombres) {
    var lista = [].concat(nombres);
    var i, j;
    for (j = 0; j < lista.length; j++) {
      var objetivo = U.normalizar(lista[j]);
      for (i = 0; i < cabecera.length; i++) {
        if (U.normalizar(cabecera[i]) === objetivo) return i;
      }
    }
    for (j = 0; j < lista.length; j++) {
      var trozo = U.normalizar(lista[j]);
      for (i = 0; i < cabecera.length; i++) {
        if (U.normalizar(cabecera[i]).indexOf(trozo) === 0) return i;
      }
    }
    return -1;
  }

  /* Los títulos que puede traer cada columna del RegAlum. */
  var COL_ALUMNO = {
    nombre: ['Alumno/a', 'Alumno', 'Alumno/a (Apellidos, Nombre)', 'Apellidos y nombre'],
    id: ['Nº Id. Escolar', 'Nº Id.Escolar', 'Nº Identificación Escolar',
         'Nº de identificación escolar', 'Id. Escolar', 'Número de identificación escolar'],
    curso: ['Curso'],
    unidad: ['Unidad', 'Unidad/Grupo', 'Grupo'],
    ano: ['Año de la matrícula', 'Año matrícula', 'Año académico', 'Curso académico'],
    estado: ['Estado Matrícula', 'Estado de matrícula', 'Estado de la matrícula', 'Estado'],
    nac: ['Fecha de nacimiento', 'F. Nacimiento', 'Fecha nacimiento']
  };

  async function ficheroQueEmpiezaPor(dir, prefijo) {
    var lista = await Carpetas.ficheros(dir);
    var mejor = null;
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i].nombre;
      if (!/\.csv$/i.test(n)) continue;
      if (U.normalizar(n).indexOf(U.normalizar(prefijo)) !== 0) continue;
      mejor = lista[i];
    }
    return mejor;
  }

  /* Una matrícula en estos estados no cuenta: el alumno no está en el
     centro este curso aunque la fila exista. */
  var ESTADOS_QUE_NO_CUENTAN = ['anulada', 'trasladada'];

  /* En el RegAlum hay una fila por cada matrícula, no una por alumno.
     Un alumno que lleve cuatro cursos en el centro sale cuatro veces.

     De ahí salen dos cosas distintas, y no hay que confundirlas:

       - El curso al que corresponde la descarga: el año más alto de
         toda la columna "Año de la matrícula".
       - Si un alumno concreto sigue matriculado: tiene una fila de ese
         año y esa matrícula no está anulada ni trasladada.

     Solo se ofrece el grupo de quien sigue matriculado, y se ofrece el
     de este curso. Al que ya se fue no se le ofrece ninguno: su último
     grupo es de otro año y meterlo en el nombre de una carpeta de hoy
     sería mentir. */
  async function cargarAlumnado(dirDatos) {
    if (CACHE.ALUMNADO) return CACHE.ALUMNADO;
    var fichero = await ficheroQueEmpiezaPor(dirDatos, 'RegAlum');
    if (!fichero) {
      var sueltos = [];
      var soloSolicitantes = await anadirSolicitantes(dirDatos, sueltos, null);
      CACHE.ALUMNADO = { lista: sueltos, fichero: null, ano: 0, curso: '',
                         sinAnos: false, columnas: {}, faltan: [], cabecera: [],
                         matriculados: 0, solicitantes: soloSolicitantes };
      return CACHE.ALUMNADO;
    }

    var texto = await Carpetas.leerTexto(dirDatos, fichero.nombre);
    var t = aTabla(texto);
    if (!t.filas.length) {
      var vacios = [];
      var soloSol = await anadirSolicitantes(dirDatos, vacios, null);
      CACHE.ALUMNADO = { lista: vacios, fichero: fichero.nombre, ano: 0, curso: '',
                         sinAnos: false, columnas: {}, faltan: [], cabecera: [],
                         matriculados: 0, solicitantes: soloSol };
      return CACHE.ALUMNADO;
    }

    var cab = t.filas[0];
    var iNombre = columna(cab, COL_ALUMNO.nombre);
    var iId = columna(cab, COL_ALUMNO.id);
    var iCurso = columna(cab, COL_ALUMNO.curso);
    var iUnidad = columna(cab, COL_ALUMNO.unidad);
    var iAno = columna(cab, COL_ALUMNO.ano);
    var iNac = columna(cab, COL_ALUMNO.nac);
    var iEstado = columna(cab, COL_ALUMNO.estado);
    if (iNombre === -1) iNombre = 0;

    /* Qué columnas se han encontrado y cuáles no. Se enseña en Ajustes:
       si un día Séneca cambia un título, se ve ahí en vez de quedarse
       sin saber por qué la aplicación no ofrece el grupo. */
    var columnas = {
      'Alumno/a': iNombre, 'Nº Id. Escolar': iId, 'Curso': iCurso,
      'Unidad': iUnidad, 'Año de la matrícula': iAno,
      'Estado Matrícula': iEstado, 'Fecha de nacimiento': iNac
    };
    var faltan = Object.keys(columnas).filter(function (k) { return columnas[k] === -1; });

    /* El curso de la descarga: el año más alto de la columna "Año de la
       matrícula".

       Si esa columna no viene, o no trae ningún año legible, es que la
       descarga es una foto del curso de hoy: una fila por alumno, sin
       histórico. Entonces todo el que no esté anulado ni trasladado
       cuenta como matriculado ahora. */
    var anoUltimo = 0;
    for (var g = 1; g < t.filas.length; g++) {
      var aa = iAno === -1 ? 0 : parseInt(t.filas[g][iAno], 10) || 0;
      if (aa > anoUltimo) anoUltimo = aa;
    }
    var sinAnos = !anoUltimo;

    var porId = {};
    for (var f = 1; f < t.filas.length; f++) {
      var fila = t.filas[f];
      var nombre = String(fila[iNombre] || '').trim();
      if (!nombre) continue;
      var id = iId === -1 ? '' : String(fila[iId] || '').trim();
      var clave = id || U.normalizar(nombre);
      var ano = iAno === -1 ? 0 : parseInt(fila[iAno], 10) || 0;
      var estado = iEstado === -1 ? '' : U.normalizar(fila[iEstado]);
      var cuenta = ESTADOS_QUE_NO_CUENTAN.indexOf(estado) === -1;
      var unidad = iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim();
      var curso = iCurso === -1 ? '' : String(fila[iCurso] || '').trim();

      if (!porId[clave]) {
        porId[clave] = {
          nombre: nombre, id: id, ano: 0, categoria: 'ALUMNADO', campos: {},
          fechaNac: '', matriculado: false, unidad: '', curso: '',
          anoUltima: 0, unidadUltima: '', cursoUltima: ''
        };
      }
      var r = porId[clave];

      /* Los datos de contacto salen de la fila más reciente que haya. */
      if (ano >= r.ano) {
        r.ano = ano;
        r.nombre = nombre;
        r.fechaNac = iNac === -1 ? '' : String(fila[iNac] || '').trim();
        var campos = {};
        for (var c = 0; c < cab.length; c++) {
          var v = String(fila[c] === undefined ? '' : fila[c]).trim();
          if (v) campos[String(cab[c]).trim()] = v;
        }
        r.campos = campos;
      }

      if (!cuenta) continue;

      /* La última matrícula buena, para poder decir de cuándo es. */
      if (ano > r.anoUltima) {
        r.anoUltima = ano;
        r.unidadUltima = unidad;
        r.cursoUltima = curso;
      }
      /* Y la de este curso, que es la única que da grupo. */
      if (sinAnos || ano === anoUltimo) {
        r.matriculado = true;
        r.unidad = unidad;
        r.curso = curso;
      }
    }

    var lista = Object.keys(porId).map(function (k) { return porId[k]; });
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    var matriculados = 0;
    for (var i = 0; i < lista.length; i++) {
      lista[i].busca = U.normalizar(lista[i].nombre + ' ' + lista[i].id);
      if (lista[i].matriculado) matriculados++;
    }
    var solicitantes = await anadirSolicitantes(dirDatos, lista, porId);

    CACHE.ALUMNADO = {
      lista: lista, fichero: fichero.nombre, ano: anoUltimo,
      curso: sinAnos ? U.cursoActual() : U.cursoDeAno(anoUltimo),
      sinAnos: sinAnos, columnas: columnas, faltan: faltan,
      cabecera: cab.map(function (x) { return String(x).trim(); }),
      matriculados: matriculados, solicitantes: solicitantes
    };
    return CACHE.ALUMNADO;
  }

  /* ---------- solicitantes ----------

     Quien ha pedido plaza pero todavía no está matriculado no sale en el
     RegAlum, y sin embargo tiene gestiones: la solicitud, la
     documentación, las reclamaciones. Se da de alta a mano en
     solicitantes.csv y aparece en el buscador junto al resto del
     alumnado, marcado como solicitante.

     No se le ofrece grupo, porque todavía no tiene. Y si ya trae Nº de
     identificación escolar, se pone: así, el día que se matricule, su
     carpeta del archivo ya se llama igual que la que montará el RegAlum.

     Si el aspirante trae Documento de identidad y ese mismo documento
     aparece en un alumno matriculado del RegAlum (comparado por
     `window.Dni.de`, sin espacios ni guiones, en mayúsculas), se da por
     reconocido y no se añade como aspirante: no se duplica (17-sep-2026,
     fila 42, docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md, sección 4). */
  function limpiarDocumentoAlumno(v) {
    return String(v === null || v === undefined ? '' : v).toUpperCase().replace(/[^0-9A-Z]/g, '');
  }

  function yaMatriculadoConDocumento(porId, documento) {
    var claves = Object.keys(porId);
    for (var i = 0; i < claves.length; i++) {
      var doc = window.Dni && window.Dni.de ? limpiarDocumentoAlumno(window.Dni.de(porId[claves[i]])) : '';
      if (doc && doc === documento) return true;
    }
    return false;
  }

  async function anadirSolicitantes(dirDatos, lista, porId) {
    var manual = await cargarLista(dirDatos, 'ALUMNADO', 'ALUMNADO_MANUAL');
    var cuantos = 0;
    for (var i = 0; i < manual.lista.length; i++) {
      var p = manual.lista[i];
      var id = String(p.campos['Nº Id. Escolar'] || '').trim();
      var documento = limpiarDocumentoAlumno(p.campos['Documento de identidad'] || '');
      var clave = id || U.normalizar(p.nombre);
      if (porId && porId[clave]) continue;   /* ya está matriculado, por Nº o por nombre */
      if (porId && documento && yaMatriculadoConDocumento(porId, documento)) continue;
      lista.push({
        nombre: p.nombre, id: id, documento: documento, ano: 0, categoria: 'ALUMNADO',
        campos: p.campos, fechaNac: String(p.campos['Fecha de nacimiento'] || '').trim(),
        matriculado: false, solicitante: true, deSeneca: false,
        unidad: '', curso: '', anoUltima: 0, unidadUltima: '', cursoUltima: '',
        busca: U.normalizar(p.nombre + ' ' + id + ' ' + documento)
      });
      cuantos++;
    }
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    return cuantos;
  }

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
    if (CACHE.PERSONAL) return CACHE.PERSONAL;

    var ficheros = await ficherosQueEmpiezanPor(dirDatos, 'RelPerCen');
    var porPersona = {};
    var resumen = [];
    var cursoMasAlto = '';

    for (var i = 0; i < ficheros.length; i++) {
      var nombreFichero = ficheros[i].nombre;
      var curso = cursoDelFichero(nombreFichero);
      if (curso > cursoMasAlto) cursoMasAlto = curso;

      var texto = await Carpetas.leerTexto(dirDatos, nombreFichero);
      var t = aTabla(texto);
      if (!t.filas.length) { resumen.push({ fichero: nombreFichero, curso: curso, filas: 0 }); continue; }

      var cab = t.filas[0].map(function (x) { return String(x).trim(); });
      var iNombre = columna(cab, 'Empleado/a');
      var iDoc = columna(cab, 'DNI/Pasaporte');
      var iPuesto = columna(cab, 'Puesto');
      var iCese = columna(cab, 'Fecha de cese');
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
    var manual = await cargarLista(dirDatos, 'PERSONAL', 'PERSONAL_MANUAL');
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
    CACHE.PERSONAL = {
      lista: lista,
      fichero: ficheros.length ? ficheros[ficheros.length - 1].nombre : null,
      ficheros: resumen, curso: cursoMasAlto,
      manuales: manual.lista.length, enElCentro: enElCentro
    };
    return CACHE.PERSONAL;
  }

  var LISTAS = {
    /* 'Documento de identidad' es del aspirante (17-sep-2026, fila 42):
       así se puede reconocer cuando llegue a matricularse, aunque
       todavía no tenga Nº de identificación escolar. Es opcional, igual
       que el Nº: muchos aspirantes lo traen ya (vienen del sistema
       educativo andaluz), los que no, lo tendrán al matricularse. */
    ALUMNADO: { fichero: 'solicitantes.csv',
                cabecera: ['Nombre', 'Documento de identidad', 'Nº Id. Escolar',
                           'Fecha de nacimiento', 'Teléfono de contacto', 'Correo de contacto',
                           'Curso de alta'] },
    PERSONAL: { fichero: 'personal.csv',
                cabecera: ['Nombre', 'Documento', 'Puesto', 'Teléfono', 'Correo'] },
    /* El nombre comercial es el rótulo del negocio, que muchas veces no
       tiene nada que ver con la razón social: "Papelería Pintor Palomo"
       de un autónomo que se llama Adolfo González de León. Se busca por
       los dos. En el nombre de la carpeta sigue mandando la razón
       social, que es la que viene en las facturas. */
    EMPRESAS: { fichero: 'empresas.csv',
                cabecera: ['Razón social', 'Nombre comercial', 'NIF',
                           'Contacto', 'Teléfono', 'Correo'] },
    OTROS:    { fichero: 'otros.csv',
                cabecera: ['Nombre', 'Referencia', 'Teléfono', 'Correo'] }
  };

  /* El valor de una columna buscándola por su título en la cabecera del
     propio fichero. Si ese título no está, se cae al sitio de reserva
     que se le indique; con -1 devuelve cadena vacía. Así un fichero
     viejo, con las columnas en otro orden, se sigue leyendo bien. */
  function porTitulo(cab, fila, titulo, sitioDeReserva) {
    var i = cab.indexOf(titulo);
    if (i === -1) i = sitioDeReserva;
    if (i < 0) return '';
    return String(fila[i] === undefined ? '' : fila[i]).trim();
  }

  /* clave por defecto === categoria. Se usa otra ('ALUMNADO_MANUAL',
     'PERSONAL_MANUAL') para las altas a mano de alumnado y personal,
     que conviven con su fichero de Séneca sin pisarlo.

     Desde el 11-sep-2026 se guarda también `cabecera`: la cabecera de
     verdad del fichero (o la de fábrica, si el fichero todavía no
     existe). La usa js/campos.js para ofrecer, en Ajustes, qué
     columnas de personal.csv, empresas.csv u otros.csv se pueden
     asociar a un tipo de asunto: se lee del fichero, no de una lista
     escrita a mano en el código. */
  async function cargarLista(dirDatos, categoria, clave) {
    clave = clave || categoria;
    if (CACHE[clave]) return CACHE[clave];
    var def = LISTAS[categoria];
    var texto = await Carpetas.leerTexto(dirDatos, def.fichero);
    var lista = [];
    var cab = def.cabecera;
    if (texto === null) {
      await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, []));
    } else {
      var t = aTabla(texto);
      cab = t.filas.length ? t.filas[0].map(function (x) { return String(x).trim(); }) : def.cabecera;
      for (var f = 1; f < t.filas.length; f++) {
        var fila = t.filas[f];
        var campos = {};
        for (var c = 0; c < cab.length; c++) {
          var v = String(fila[c] === undefined ? '' : fila[c]).trim();
          if (v) campos[cab[c]] = v;
        }
        var nombre = String(fila[0] || '').trim();
        if (!nombre) continue;
        /* La segunda columna se lee POR SU TÍTULO, no por su sitio. Los
           ficheros escritos antes de que existiera el nombre comercial
           tienen el NIF en la segunda columna; los nuevos, en la
           tercera. Leerlo por el título vale para los dos. */
        var doc = porTitulo(cab, fila, 'Documento', 1);
        var nif = porTitulo(cab, fila, 'NIF', 1);
        var ref = porTitulo(cab, fila, 'Referencia', 1);
        var comercial = porTitulo(cab, fila, 'Nombre comercial', -1);
        lista.push({
          nombre: nombre,
          documento: categoria === 'PERSONAL' ? doc : '',
          nif: categoria === 'EMPRESAS' ? nif : '',
          referencia: categoria === 'OTROS' ? ref : '',
          comercial: categoria === 'EMPRESAS' ? comercial : '',
          campos: campos, categoria: categoria, deSeneca: false,
          enElCentro: true, fechaCese: '', puesto: campos['Puesto'] || '',
          busca: U.normalizar([nombre, doc, nif, ref, comercial,
                               campos['Puesto'] || ''].join(' '))
        });
      }
    }
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    CACHE[clave] = { lista: lista, fichero: def.fichero, cabecera: cab };
    return CACHE[clave];
  }

  /* Da de alta un tercero nuevo y lo escribe en su CSV. Un solicitante
     (categoría ALUMNADO) se marca con el curso de hoy, aunque quien lo
     dé de alta no lo escriba: así se puede saber más adelante de qué
     curso es, sin preguntárselo a nadie (fila 66, 2.4). */
  async function anadirALista(dirDatos, categoria, valores) {
    var def = LISTAS[categoria];
    if (categoria === 'ALUMNADO' && !valores['Curso de alta']) {
      valores = Object.assign({}, valores, { 'Curso de alta': U.cursoActual() });
    }
    var clave = (categoria === 'PERSONAL' || categoria === 'ALUMNADO')
      ? categoria + '_MANUAL' : categoria;
    var actual = await cargarLista(dirDatos, categoria, clave);
    var filas = actual.lista.map(function (p) {
      return def.cabecera.map(function (c) { return p.campos[c] || ''; });
    });
    filas.push(def.cabecera.map(function (c) { return valores[c] || ''; }));
    filas.sort(function (a, b) { return U.normalizar(a[0]) < U.normalizar(b[0]) ? -1 : 1; });
    await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, filas));
    delete CACHE[clave];
    delete CACHE[categoria];
    return cargar(dirDatos, categoria);
  }

  /* Cambia los datos de un tercero que ya está dado de alta a mano.
     Se busca por el nombre que tenía antes, que es la primera columna
     del fichero. Si no aparece, se añade como uno nuevo: así un cambio
     nunca hace desaparecer a nadie.

     Ojo: esto NO renombra las carpetas de sus asuntos. El nombre de una
     carpeta es el rastro del día en que se creó. */
  async function guardarEnLista(dirDatos, categoria, nombreAntes, valores) {
    var def = LISTAS[categoria];
    var clave = (categoria === 'PERSONAL' || categoria === 'ALUMNADO')
      ? categoria + '_MANUAL' : categoria;
    var actual = await cargarLista(dirDatos, categoria, clave);
    var buscado = U.normalizar(nombreAntes || '');
    var estaba = false;
    var filas = actual.lista.map(function (p) {
      if (!estaba && U.normalizar(p.nombre) === buscado) {
        estaba = true;
        return def.cabecera.map(function (c) { return valores[c] || ''; });
      }
      return def.cabecera.map(function (c) { return p.campos[c] || ''; });
    });
    if (!estaba) filas.push(def.cabecera.map(function (c) { return valores[c] || ''; }));
    filas.sort(function (a, b) { return U.normalizar(a[0]) < U.normalizar(b[0]) ? -1 : 1; });
    await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, filas));
    delete CACHE[clave];
    delete CACHE[categoria];
    return cargar(dirDatos, categoria);
  }

  /* Quita a alguien de la lista de dados de alta a mano (papelera,
     11-sep-2026). Se busca por su nombre, igual que guardarEnLista.
     Solo tiene sentido para quien se dio de alta a mano: quitar a
     alguien de Séneca de aquí no tendría ningún efecto, porque el
     fichero de Séneca no lo escribe la aplicación. */
  async function quitarDeLista(dirDatos, categoria, nombre) {
    var def = LISTAS[categoria];
    var clave = (categoria === 'PERSONAL' || categoria === 'ALUMNADO')
      ? categoria + '_MANUAL' : categoria;
    var actual = await cargarLista(dirDatos, categoria, clave);
    var buscado = U.normalizar(nombre || '');
    var quitado = null;
    var filas = [];
    actual.lista.forEach(function (p) {
      if (!quitado && U.normalizar(p.nombre) === buscado) { quitado = p; return; }
      filas.push(def.cabecera.map(function (c) { return p.campos[c] || ''; }));
    });
    if (!quitado) return null;
    await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, filas));
    delete CACHE[clave];
    delete CACHE[categoria];
    return quitado;
  }

  async function cargar(dirDatos, categoria) {
    if (categoria === 'ALUMNADO') return cargarAlumnado(dirDatos);
    if (categoria === 'PERSONAL') return cargarPersonal(dirDatos);
    return cargarLista(dirDatos, categoria);
  }

  function buscar(lista, texto, tope) {
    var q = U.normalizar(texto);
    if (q.length < 2) return [];
    var trozos = q.split(' ').filter(function (x) { return x; });
    var salida = [];
    for (var i = 0; i < lista.length && salida.length < (tope || 40); i++) {
      var vale = true;
      for (var k = 0; k < trozos.length; k++) {
        if (lista[i].busca.indexOf(trozos[k]) === -1) { vale = false; break; }
      }
      if (vale) salida.push(lista[i]);
    }
    return salida;
  }

  function olvidar(categoria) {
    if (!categoria) { CACHE = {}; return; }
    delete CACHE[categoria];
    delete CACHE[categoria + '_MANUAL'];
  }

  /* Las unidades distintas de ESTE curso, para poder enseñar en Ajustes
     cómo queda abreviada cada una. */
  function unidadesDistintas(lista) {
    var vistas = {};
    for (var i = 0; i < lista.length; i++) {
      if (!lista[i].matriculado) continue;
      var u = String(lista[i].unidad || '').trim();
      if (!u || vistas[u]) continue;
      vistas[u] = { unidad: u, curso: lista[i].curso || '', cuantos: 0 };
    }
    for (var j = 0; j < lista.length; j++) {
      if (!lista[j].matriculado) continue;
      var v = String(lista[j].unidad || '').trim();
      if (vistas[v]) vistas[v].cuantos++;
    }
    var salida = Object.keys(vistas).map(function (k) { return vistas[k]; });
    salida.sort(function (a, b) { return a.unidad < b.unidad ? -1 : 1; });
    return salida;
  }

  /* Los datos de contacto que de verdad se consultan a diario, sacados
     del fichero de Séneca sin saber de antemano cómo se llaman sus columnas:
     se buscan por lo que dice el título de cada una. */
  function destacadosAlumno(alumno) {
    var fuera = {};
    var filas = [];

    function meter(titulo, valor) {
      if (valor === '' || valor === undefined || valor === null) return;
      filas.push({ titulo: titulo, valor: String(valor) });
    }

    var edad = U.edadDesde(alumno.fechaNac);
    if (edad !== '') meter('Edad actual', edad + ' años');
    if (alumno.fechaNac) { meter('Fecha de nacimiento', alumno.fechaNac); fuera['fecha de nacimiento'] = true; }

    if (alumno.matriculado) {
      meter('Matrícula', 'Matriculado en el curso ' + U.cursoDeAno(alumno.ano));
      if (alumno.unidad) meter('Grupo', alumno.unidad);
      if (alumno.curso) meter('Curso', alumno.curso);
    } else if (alumno.solicitante) {
      meter('Matrícula', 'Solicitante  ·  todavía sin matricular');
      if (!alumno.id) meter('Nº Id. Escolar', 'Todavía no lo tiene');
    } else {
      meter('Matrícula', 'No está matriculado este curso');
      if (alumno.anoUltima) {
        meter('Última matrícula', U.cursoDeAno(alumno.anoUltima) +
          (alumno.cursoUltima ? '  ·  ' + alumno.cursoUltima : '') +
          (alumno.unidadUltima ? '  ·  ' + alumno.unidadUltima : ''));
      }
    }

    var claves = Object.keys(alumno.campos);
    /* Primero todo lo que hable de tutores o de la familia. */
    for (var i = 0; i < claves.length; i++) {
      var t = U.normalizar(claves[i]);
      if (fuera[t]) continue;
      if (/tutor|padre|madre|responsable|familia/.test(t)) {
        meter(claves[i], alumno.campos[claves[i]]);
        fuera[t] = true;
      }
    }
    /* Después los teléfonos y correos que queden, y el domicilio. */
    for (var j = 0; j < claves.length; j++) {
      var t2 = U.normalizar(claves[j]);
      if (fuera[t2]) continue;
      if (/telefono|movil|correo|e-?mail|domicilio|direccion|localidad/.test(t2)) {
        meter(claves[j], alumno.campos[claves[j]]);
        fuera[t2] = true;
      }
    }

    var resto = [];
    for (var k = 0; k < claves.length; k++) {
      if (!fuera[U.normalizar(claves[k])]) {
        resto.push({ titulo: claves[k], valor: alumno.campos[claves[k]] });
      }
    }
    return { destacados: filas, resto: resto };
  }

  /* La ficha de una persona del centro. Arriba lo que se consulta a
     diario: qué puesto ocupa, si sigue en el centro y cómo se le
     localiza. Abajo, el resto de columnas del fichero de Séneca. */
  function destacadosPersona(persona) {
    var fuera = {};
    var filas = [];

    function meter(titulo, valor) {
      if (valor === '' || valor === undefined || valor === null) return;
      filas.push({ titulo: titulo, valor: String(valor) });
    }

    if (persona.documento) meter('DNI', persona.documento);

    if (persona.puesto) { meter('Puesto', persona.puesto); fuera['puesto'] = true; }

    if (persona.enElCentro) {
      meter('Situación', persona.fechaCese
        ? 'En el centro hasta el ' + persona.fechaCese
        : 'En el centro');
    } else if (persona.esteCurso) {
      meter('Situación', 'Ya no está en el centro' +
        (persona.fechaCese ? '  ·  cesó el ' + persona.fechaCese : ''));
    } else {
      meter('Situación', 'Ya no está en el centro' +
        (persona.cursoUltimo ? '  ·  su último curso aquí fue el ' + persona.cursoUltimo : ''));
    }
    fuera['fecha de cese'] = true;

    if (persona.cursos && persona.cursos.length > 1) {
      meter('Cursos en el centro', persona.cursos.join(', '));
    }

    var claves = Object.keys(persona.campos);
    for (var i = 0; i < claves.length; i++) {
      var t = U.normalizar(claves[i]);
      if (fuera[t]) continue;
      if (/telefono|movil|correo|e-?mail|cuenta/.test(t)) {
        meter(claves[i], persona.campos[claves[i]]);
        fuera[t] = true;
      }
    }

    var resto = [];
    for (var k = 0; k < claves.length; k++) {
      if (!fuera[U.normalizar(claves[k])]) {
        resto.push({ titulo: claves[k], valor: persona.campos[claves[k]] });
      }
    }
    /* Que no se repita abajo: la misma comparación por valor que hace
       js/dni.js con el alumnado, para que valga tanto para la columna
       DNI/Pasaporte de Séneca como para Documento de personal.csv. */
    if (persona.documento) {
      resto = resto.filter(function (f) {
        return String(f.valor).trim() !== persona.documento;
      });
    }
    return { destacados: filas, resto: resto };
  }

  /* ---------- los tutores legales, agrupados por persona ----------

     Viven en js/datos-tutores.js (fila 108, 24-sep-2026), que publica
     `Datos.tutoresDe`: este fichero ya pasaba de 1.000 líneas. */

  /* ---------- la línea resumen de "Datos y contacto" (17-sep-2026,
     fila 37, 3) ---------- */

  /* El teléfono propio de alguien (no el de un tutor): la primera
     columna de teléfono o móvil que NO hable de tutores ni de familia. */
  function telefonoPropio(persona) {
    var campos = (persona && persona.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      var t = U.normalizar(claves[i]);
      if (/tutor|padre|madre|responsable|familia/.test(t)) continue;
      if (!/telefono|movil/.test(t)) continue;
      var valor = String(campos[claves[i]] || '').trim();
      if (valor) return valor;
    }
    return '';
  }

  var EDAD_MAYORIA = 18;

  /* Datos.resumenDeTercero(persona, categoria) -> los datos de la línea
     "Datos y contacto": nombre, grupo o etiqueta de estado, edad, un
     solo teléfono (etiquetado) y documento. Pura: no toca el DOM. El
     aviso de DNI que falta lo sigue decidiendo `js/dni.js`
     (`window.Dni`, si está cargado), sin duplicar esa cuenta aquí. */
  function resumenDeTercero(persona, categoria) {
    var r = { nombre: '', grupo: null, edad: '', telefono: null, documento: null };
    if (!persona) return r;

    if (categoria === 'ALUMNADO') {
      r.nombre = persona.nombre || '';
      var edad = U.edadDesde(persona.fechaNac);
      if (edad !== '') r.edad = edad + ' años';

      if (persona.matriculado) {
        r.grupo = { texto: persona.unidad || persona.curso || '', clase: '' };
      } else if (persona.solicitante) {
        r.grupo = { texto: 'SOLICITANTE', clase: 'azul' };
      } else {
        var detalle = persona.anoUltima
          ? 'última matrícula: ' + U.cursoDeAno(persona.anoUltima) +
            (persona.unidadUltima ? ' · ' + persona.unidadUltima : '')
          : '';
        r.grupo = { texto: 'NO MATRICULADO ' + U.cursoActual(), clase: 'ambar', detalle: detalle };
      }

      var esMenor = edad !== '' && edad < EDAD_MAYORIA;
      if (esMenor) {
        var tutores = Datos.tutoresDe(persona);
        var primero = tutores[0];
        if (primero && primero.telefonos.length) {
          r.telefono = { valor: primero.telefonos[0], etiqueta: 'Tutor legal ' + primero.numero };
        }
      } else {
        var propio = telefonoPropio(persona);
        if (propio) r.telefono = { valor: propio, etiqueta: '' };
      }

      var doc = window.Dni ? window.Dni.de(persona) : '';
      var falta = window.Dni ? window.Dni.falta(persona) : false;
      if (doc) r.documento = { valor: doc, falta: false };
      else if (falta) r.documento = { valor: '', falta: true, edad: edad };
    } else if (categoria === 'PERSONAL') {
      r.nombre = persona.nombre || '';
      if (persona.enElCentro) {
        r.grupo = { texto: persona.puesto || '', clase: '' };
      } else {
        var detallePersonal = persona.cursoUltimo ? 'último curso aquí: ' + persona.cursoUltimo : '';
        r.grupo = { texto: 'YA NO ESTÁ', clase: 'ambar', detalle: detallePersonal };
      }
      var telPersonal = telefonoPropio(persona);
      if (telPersonal) r.telefono = { valor: telPersonal, etiqueta: '' };
      if (persona.documento) r.documento = { valor: persona.documento, falta: false };
    } else {
      /* Empresas y otros: nombre, el nombre comercial o la referencia en
         el sitio del grupo, un teléfono y el NIF o el documento. */
      r.nombre = (categoria === 'EMPRESAS' ? persona.nombre : persona.nombre) || '';
      var otro = (categoria === 'EMPRESAS' ? persona.comercial : persona.referencia) || '';
      if (otro) r.grupo = { texto: otro, clase: '' };
      var telOtro = telefonoPropio(persona);
      if (telOtro) r.telefono = { valor: telOtro, etiqueta: '' };
      var docOtro = (categoria === 'EMPRESAS' ? persona.nif : persona.documento) || '';
      if (docOtro) r.documento = { valor: docOtro, falta: false };
    }

    return r;
  }

  /* ---------- la foto del contacto, para cuando el tercero ya no está
     en el CSV (19-sep-2026, fila 66, docs/CONTACTO-GUARDADO-EN-LA-
     FICHA.md) ----------

     Solo las columnas que de verdad se miran: las mismas que ya buscan
     por título `destacadosAlumno`, `destacadosPersona`, `tutoresDe`,
     `telefonoPropio` y `js/dni.js` (tutor/familia, teléfono, correo,
     domicilio, cuenta y documento de identidad). Nada de columnas que
     no se consultan nunca, y nada del CSV entero. */
  var CAMPO_UTIL = /tutor|padre|madre|responsable|familia|telefono|movil|correo|e-?mail|domicilio|direccion|localidad|cuenta|dni\b|nif\b|nie\b|documento|identidad|pasaporte/;

  function ficheroDeCategoria(categoria) {
    if (categoria === 'ALUMNADO') return 'RegAlum.csv';
    if (categoria === 'PERSONAL') return 'RelPerCen.csv';
    return String(categoria || '') + '.csv';
  }

  /* Datos.fotoDeContacto(persona, categoria) -> un bloque pequeño para
     guardar en `ficha.contacto` al crear un asunto: lo justo para
     poder seguir trabajando el día que esta persona ya no esté en el
     fichero de Séneca. */
  function fotoDeContacto(persona, categoria) {
    if (!persona) return null;
    var origen = persona.campos || {};
    var campos = {};
    Object.keys(origen).forEach(function (clave) {
      if (CAMPO_UTIL.test(U.normalizar(clave))) campos[clave] = origen[clave];
    });
    return {
      nombre: persona.nombre || '',
      documento: persona.documento || '',
      id: persona.id || '',
      unidad: persona.unidad || '',
      curso: persona.curso || '',
      fechaNac: persona.fechaNac || '',
      puesto: persona.puesto || '',
      cursoUltimo: persona.cursoUltimo || '',
      comercial: persona.comercial || '',
      referencia: persona.referencia || '',
      nif: persona.nif || '',
      campos: campos,
      fichero: ficheroDeCategoria(categoria),
      fecha: U.hoyIso()
    };
  }

  /* Datos.personaDesdeFoto(contacto, categoria) -> una "persona" como
     las que devuelve el CSV, pero hecha con lo guardado en
     `ficha.contacto`. Vale para las mismas funciones de siempre
     (`destacadosAlumno`, `tutoresDe`, `resumenDeTercero`,
     `telefonoPropio`, `window.Dni`), así que la ventana "Ver todo" no
     necesita saber de dónde ha salido. Lleva `.foto = true` para que
     quien la pinte pueda avisar de que son datos guardados, no de hoy. */
  function personaDesdeFoto(contacto, categoria) {
    if (!contacto) return null;
    return {
      nombre: contacto.nombre || '', documento: contacto.documento || '',
      id: contacto.id || '', unidad: contacto.unidad || '', curso: contacto.curso || '',
      fechaNac: contacto.fechaNac || '', matriculado: false, solicitante: false,
      anoUltima: 0, unidadUltima: '', cursoUltima: '',
      puesto: contacto.puesto || '', enElCentro: false, esteCurso: false,
      cursoUltimo: contacto.cursoUltimo || '', cursos: [],
      comercial: contacto.comercial || '', referencia: contacto.referencia || '',
      nif: contacto.nif || '', campos: contacto.campos || {}, categoria: categoria,
      foto: true, fotoFecha: contacto.fecha || '', fotoFichero: contacto.fichero || ''
    };
  }

  /* ---------- los solicitantes de cursos anteriores (fila 66, 2.4)
     ----------

     `solicitantes.csv` no se limpia nunca solo: arrastraría a todos los
     aspirantes de todos los cursos. Se apartan (no se borran) a
     `solicitantes-anteriores.csv` los que se dieron de alta en un curso
     que no es el de hoy. */
  var FICHERO_SOLICITANTES_ANTERIORES = 'solicitantes-anteriores.csv';

  function esDeCursoAnterior(campos) {
    var curso = String((campos && campos['Curso de alta']) || '').trim();
    return curso !== '' && curso !== U.cursoActual();
  }

  async function contarSolicitantesAnteriores(dirDatos) {
    var actual = await cargarLista(dirDatos, 'ALUMNADO', 'ALUMNADO_MANUAL');
    return actual.lista.filter(function (p) { return esDeCursoAnterior(p.campos); }).length;
  }

  async function apartarSolicitantesAnteriores(dirDatos) {
    var def = LISTAS.ALUMNADO;
    var clave = 'ALUMNADO_MANUAL';
    var actual = await cargarLista(dirDatos, 'ALUMNADO', clave);
    var quedan = [], apartados = [];
    actual.lista.forEach(function (p) {
      (esDeCursoAnterior(p.campos) ? apartados : quedan).push(p);
    });
    if (!apartados.length) return 0;

    var filasQuedan = quedan.map(function (p) {
      return def.cabecera.map(function (c) { return p.campos[c] || ''; });
    });
    await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, filasQuedan));

    var textoAnteriores = await Carpetas.leerTexto(dirDatos, FICHERO_SOLICITANTES_ANTERIORES);
    var filasAnteriores = textoAnteriores ? aTabla(textoAnteriores).filas.slice(1) : [];
    apartados.forEach(function (p) {
      filasAnteriores.push(def.cabecera.map(function (c) { return p.campos[c] || ''; }));
    });
    await Carpetas.escribirTexto(dirDatos, FICHERO_SOLICITANTES_ANTERIORES,
      aCsv(def.cabecera, filasAnteriores));

    delete CACHE[clave];
    delete CACHE.ALUMNADO;
    return apartados.length;
  }

  return {
    aTabla: aTabla, aCsv: aCsv, cargar: cargar, anadirALista: anadirALista,
    buscar: buscar, olvidar: olvidar, LISTAS: LISTAS,
    guardarEnLista: guardarEnLista, quitarDeLista: quitarDeLista,
    unidadesDistintas: unidadesDistintas, destacadosAlumno: destacadosAlumno,
    destacadosPersona: destacadosPersona, cursoDelFichero: cursoDelFichero,
    resumenDeTercero: resumenDeTercero,
    fotoDeContacto: fotoDeContacto, personaDesdeFoto: personaDesdeFoto,
    contarSolicitantesAnteriores: contarSolicitantesAnteriores,
    apartarSolicitantesAnteriores: apartarSolicitantesAnteriores
  };
})();
