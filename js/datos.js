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

  function columna(cabecera, nombre) {
    var objetivo = U.normalizar(nombre);
    for (var i = 0; i < cabecera.length; i++) {
      if (U.normalizar(cabecera[i]) === objetivo) return i;
    }
    return -1;
  }

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
      CACHE.ALUMNADO = { lista: [], fichero: null, ano: 0, curso: '', matriculados: 0 };
      return CACHE.ALUMNADO;
    }

    var texto = await Carpetas.leerTexto(dirDatos, fichero.nombre);
    var t = aTabla(texto);
    if (!t.filas.length) {
      CACHE.ALUMNADO = { lista: [], fichero: fichero.nombre, ano: 0, curso: '', matriculados: 0 };
      return CACHE.ALUMNADO;
    }

    var cab = t.filas[0];
    var iNombre = columna(cab, 'Alumno/a');
    var iId = columna(cab, 'Nº Id. Escolar');
    var iCurso = columna(cab, 'Curso');
    var iUnidad = columna(cab, 'Unidad');
    var iAno = columna(cab, 'Año de la matrícula');
    var iNac = columna(cab, 'Fecha de nacimiento');
    var iEstado = columna(cab, 'Estado Matrícula');

    /* El curso de la descarga. */
    var anoUltimo = 0;
    for (var g = 1; g < t.filas.length; g++) {
      var aa = iAno === -1 ? 0 : parseInt(t.filas[g][iAno], 10) || 0;
      if (aa > anoUltimo) anoUltimo = aa;
    }

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
      if (anoUltimo && ano === anoUltimo) {
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
    CACHE.ALUMNADO = {
      lista: lista, fichero: fichero.nombre, ano: anoUltimo,
      curso: U.cursoDeAno(anoUltimo), matriculados: matriculados
    };
    return CACHE.ALUMNADO;
  }

  /* ---------- personal (RelPerCen de Séneca + altas a mano) ----------

     El RelPerCen trae solo al profesorado. Conserjería, administración,
     limpieza y demás no salen ahí, así que se siguen dando de alta a
     mano en personal.csv y las dos listas se juntan en una sola.

     La columna "Fecha de cese" dice hasta cuándo está cada persona en
     el centro. Si esa fecha ya pasó, la persona sigue apareciendo en la
     búsqueda (sus asuntos viejos siguen existiendo) pero la aplicación
     avisa de que ya no está. */
  async function cargarPersonal(dirDatos) {
    if (CACHE.PERSONAL) return CACHE.PERSONAL;

    var lista = [];
    var vistos = {};
    var fichero = await ficheroQueEmpiezaPor(dirDatos, 'RelPerCen');
    var enElCentro = 0;

    if (fichero) {
      var texto = await Carpetas.leerTexto(dirDatos, fichero.nombre);
      var t = aTabla(texto);
      if (t.filas.length) {
        var cab = t.filas[0].map(function (x) { return String(x).trim(); });
        var iNombre = columna(cab, 'Empleado/a');
        var iDoc = columna(cab, 'DNI/Pasaporte');
        var iPuesto = columna(cab, 'Puesto');
        var iCese = columna(cab, 'Fecha de cese');
        if (iNombre === -1) iNombre = 0;
        if (iDoc === -1) iDoc = 1;

        for (var f = 1; f < t.filas.length; f++) {
          var fila = t.filas[f];
          var nombre = String(fila[iNombre] || '').trim();
          if (!nombre) continue;
          var documento = String(fila[iDoc] || '').trim();
          var puesto = iPuesto === -1 ? '' : String(fila[iPuesto] || '').trim();
          var cese = iCese === -1 ? '' : String(fila[iCese] || '').trim();
          var campos = {};
          for (var c = 0; c < cab.length; c++) {
            var v = String(fila[c] === undefined ? '' : fila[c]).trim();
            if (v) campos[cab[c]] = v;
          }
          var esta = !U.yaPaso(cese);
          if (esta) enElCentro++;
          vistos[U.normalizar(nombre)] = true;
          lista.push({
            nombre: nombre, documento: documento, nif: '', referencia: '',
            puesto: puesto, fechaCese: cese, enElCentro: esta,
            deSeneca: true, categoria: 'PERSONAL', campos: campos,
            busca: U.normalizar(nombre + ' ' + documento + ' ' + puesto)
          });
        }
      }
    }

    /* Y encima, los que se han dado de alta a mano. Si alguien está en
       las dos listas manda Séneca, que es el dato bueno. */
    var manual = await cargarLista(dirDatos, 'PERSONAL', 'PERSONAL_MANUAL');
    for (var m = 0; m < manual.lista.length; m++) {
      var p = manual.lista[m];
      if (vistos[U.normalizar(p.nombre)]) continue;
      lista.push(p);
      enElCentro++;
    }

    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    CACHE.PERSONAL = {
      lista: lista, fichero: fichero ? fichero.nombre : null,
      manuales: manual.lista.length, enElCentro: enElCentro
    };
    return CACHE.PERSONAL;
  }

  var LISTAS = {
    PERSONAL: { fichero: 'personal.csv',
                cabecera: ['Nombre', 'Documento', 'Puesto', 'Teléfono', 'Correo'] },
    EMPRESAS: { fichero: 'empresas.csv',
                cabecera: ['Razón social', 'NIF', 'Contacto', 'Teléfono', 'Correo'] },
    OTROS:    { fichero: 'otros.csv',
                cabecera: ['Nombre', 'Referencia', 'Teléfono', 'Correo'] }
  };

  async function cargarLista(dirDatos, categoria, clave) {
    clave = clave || categoria;
    if (CACHE[clave]) return CACHE[clave];
    var def = LISTAS[categoria];
    var texto = await Carpetas.leerTexto(dirDatos, def.fichero);
    var lista = [];
    if (texto === null) {
      await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, []));
    } else {
      var t = aTabla(texto);
      var cab = t.filas.length ? t.filas[0].map(function (x) { return String(x).trim(); }) : def.cabecera;
      for (var f = 1; f < t.filas.length; f++) {
        var fila = t.filas[f];
        var campos = {};
        for (var c = 0; c < cab.length; c++) {
          var v = String(fila[c] === undefined ? '' : fila[c]).trim();
          if (v) campos[cab[c]] = v;
        }
        var nombre = String(fila[0] || '').trim();
        if (!nombre) continue;
        lista.push({
          nombre: nombre,
          documento: categoria === 'PERSONAL' ? String(fila[1] || '').trim() : '',
          nif: categoria === 'EMPRESAS' ? String(fila[1] || '').trim() : '',
          referencia: categoria === 'OTROS' ? String(fila[1] || '').trim() : '',
          campos: campos, categoria: categoria, deSeneca: false,
          enElCentro: true, fechaCese: '', puesto: campos['Puesto'] || '',
          busca: U.normalizar(nombre + ' ' + (fila[1] || '') + ' ' + (campos['Puesto'] || ''))
        });
      }
    }
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    CACHE[clave] = { lista: lista, fichero: def.fichero };
    return CACHE[clave];
  }

  /* Da de alta un tercero nuevo y lo escribe en su CSV. */
  async function anadirALista(dirDatos, categoria, valores) {
    var def = LISTAS[categoria];
    var clave = categoria === 'PERSONAL' ? 'PERSONAL_MANUAL' : categoria;
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
    if (categoria === 'PERSONAL') delete CACHE.PERSONAL_MANUAL;
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

    if (persona.puesto) { meter('Puesto', persona.puesto); fuera['puesto'] = true; }

    if (persona.enElCentro) {
      meter('Situación', persona.fechaCese
        ? 'En el centro hasta el ' + persona.fechaCese
        : 'En el centro');
    } else {
      meter('Situación', 'Ya no está en el centro' +
        (persona.fechaCese ? '  ·  cesó el ' + persona.fechaCese : ''));
    }
    fuera['fecha de cese'] = true;

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
    return { destacados: filas, resto: resto };
  }

  return {
    aTabla: aTabla, aCsv: aCsv, cargar: cargar, anadirALista: anadirALista,
    buscar: buscar, olvidar: olvidar, LISTAS: LISTAS,
    unidadesDistintas: unidadesDistintas, destacadosAlumno: destacadosAlumno,
    destacadosPersona: destacadosPersona
  };
})();
