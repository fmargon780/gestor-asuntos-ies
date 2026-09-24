/* ============================================================
   datos-alumnado.js — el alumnado (RegAlum de Séneca) y los solicitantes dados de alta a mano.

   Sacado tal cual de js/datos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo compartido (la caché, leer CSV, cargarLista…) se pide a
   `Datos._interno` (I). Se carga justo detrás de js/datos.js.
   ============================================================ */
(function () {
  if (typeof Datos === 'undefined' || !Datos._interno) return;
  var I = Datos._interno;

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
    if (I.CACHE.ALUMNADO) return I.CACHE.ALUMNADO;
    var fichero = await ficheroQueEmpiezaPor(dirDatos, 'RegAlum');
    if (!fichero) {
      var sueltos = [];
      var soloSolicitantes = await anadirSolicitantes(dirDatos, sueltos, null);
      I.CACHE.ALUMNADO = { lista: sueltos, fichero: null, ano: 0, curso: '',
                         sinAnos: false, columnas: {}, faltan: [], cabecera: [],
                         matriculados: 0, solicitantes: soloSolicitantes };
      return I.CACHE.ALUMNADO;
    }

    var texto = await Carpetas.leerTexto(dirDatos, fichero.nombre);
    var t = I.aTabla(texto);
    if (!t.filas.length) {
      var vacios = [];
      var soloSol = await anadirSolicitantes(dirDatos, vacios, null);
      I.CACHE.ALUMNADO = { lista: vacios, fichero: fichero.nombre, ano: 0, curso: '',
                         sinAnos: false, columnas: {}, faltan: [], cabecera: [],
                         matriculados: 0, solicitantes: soloSol };
      return I.CACHE.ALUMNADO;
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

    I.CACHE.ALUMNADO = {
      lista: lista, fichero: fichero.nombre, ano: anoUltimo,
      curso: sinAnos ? U.cursoActual() : U.cursoDeAno(anoUltimo),
      sinAnos: sinAnos, columnas: columnas, faltan: faltan,
      cabecera: cab.map(function (x) { return String(x).trim(); }),
      matriculados: matriculados, solicitantes: solicitantes
    };
    return I.CACHE.ALUMNADO;
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
    var manual = await I.cargarLista(dirDatos, 'ALUMNADO', 'ALUMNADO_MANUAL');
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

  Object.assign(I, {
    cargarAlumnado: cargarAlumnado,
    columna: columna
  });
})();
