/* ============================================================
   datos.js — de dónde salen los terceros.

   Alumnado: del RegAlum.csv de Séneca, que se deja en
             _GESTOR/datos. Se queda con la matrícula más
             reciente de cada alumno.
   Personal, empresas y otros: de tres CSV que mantiene la
             propia aplicación, en la misma carpeta.
   ============================================================ */
var Datos = (function () {

  var CACHE = {};   /* lo leído en esta sesión, para no releer 10 MB cada vez */

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

  async function cargarAlumnado(dirDatos) {
    if (CACHE.ALUMNADO) return CACHE.ALUMNADO;
    var fichero = await ficheroQueEmpiezaPor(dirDatos, 'RegAlum');
    if (!fichero) { CACHE.ALUMNADO = { lista: [], fichero: null }; return CACHE.ALUMNADO; }

    var texto = await Carpetas.leerTexto(dirDatos, fichero.nombre);
    var t = aTabla(texto);
    if (!t.filas.length) { CACHE.ALUMNADO = { lista: [], fichero: fichero.nombre }; return CACHE.ALUMNADO; }

    var cab = t.filas[0];
    var iNombre = columna(cab, 'Alumno/a');
    var iId = columna(cab, 'Nº Id. Escolar');
    var iCurso = columna(cab, 'Curso');
    var iUnidad = columna(cab, 'Unidad');
    var iAno = columna(cab, 'Año de la matrícula');
    var iNac = columna(cab, 'Fecha de nacimiento');

    var porId = {};
    for (var f = 1; f < t.filas.length; f++) {
      var fila = t.filas[f];
      var nombre = String(fila[iNombre] || '').trim();
      if (!nombre) continue;
      var id = iId === -1 ? '' : String(fila[iId] || '').trim();
      var clave = id || U.normalizar(nombre);
      var ano = iAno === -1 ? 0 : parseInt(fila[iAno], 10) || 0;
      if (porId[clave] && porId[clave].ano >= ano) continue;
      var campos = {};
      for (var c = 0; c < cab.length; c++) {
        var v = String(fila[c] === undefined ? '' : fila[c]).trim();
        if (v) campos[String(cab[c]).trim()] = v;
      }
      porId[clave] = {
        nombre: nombre, id: id, ano: ano,
        curso: iCurso === -1 ? '' : String(fila[iCurso] || '').trim(),
        unidad: iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim(),
        fechaNac: iNac === -1 ? '' : String(fila[iNac] || '').trim(),
        campos: campos, categoria: 'ALUMNADO'
      };
    }

    var lista = Object.keys(porId).map(function (k) { return porId[k]; });
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    for (var i = 0; i < lista.length; i++) lista[i].busca = U.normalizar(lista[i].nombre + ' ' + lista[i].id);
    CACHE.ALUMNADO = { lista: lista, fichero: fichero.nombre };
    return CACHE.ALUMNADO;
  }

  var LISTAS = {
    PERSONAL: { fichero: 'personal.csv',
                cabecera: ['Nombre', 'Documento', 'Puesto', 'Teléfono', 'Correo'] },
    EMPRESAS: { fichero: 'empresas.csv',
                cabecera: ['Razón social', 'NIF', 'Contacto', 'Teléfono', 'Correo'] },
    OTROS:    { fichero: 'otros.csv',
                cabecera: ['Nombre', 'Referencia', 'Teléfono', 'Correo'] }
  };

  async function cargarLista(dirDatos, categoria) {
    if (CACHE[categoria]) return CACHE[categoria];
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
          campos: campos, categoria: categoria,
          busca: U.normalizar(nombre + ' ' + (fila[1] || ''))
        });
      }
    }
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    CACHE[categoria] = { lista: lista, fichero: def.fichero };
    return CACHE[categoria];
  }

  /* Da de alta un tercero nuevo y lo escribe en su CSV. */
  async function anadirALista(dirDatos, categoria, valores) {
    var def = LISTAS[categoria];
    var actual = await cargarLista(dirDatos, categoria);
    var filas = actual.lista.map(function (p) {
      return def.cabecera.map(function (c) { return p.campos[c] || ''; });
    });
    filas.push(def.cabecera.map(function (c) { return valores[c] || ''; }));
    filas.sort(function (a, b) { return U.normalizar(a[0]) < U.normalizar(b[0]) ? -1 : 1; });
    await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, filas));
    delete CACHE[categoria];
    return cargarLista(dirDatos, categoria);
  }

  async function cargar(dirDatos, categoria) {
    if (categoria === 'ALUMNADO') return cargarAlumnado(dirDatos);
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
    if (categoria) delete CACHE[categoria]; else CACHE = {};
  }

  /* Las unidades distintas que trae el fichero, para poder enseñar en
     Ajustes cómo queda abreviada cada una. */
  function unidadesDistintas(lista) {
    var vistas = {};
    for (var i = 0; i < lista.length; i++) {
      var u = String(lista[i].unidad || '').trim();
      if (!u || vistas[u]) continue;
      vistas[u] = { unidad: u, curso: lista[i].curso || '', cuantos: 0 };
    }
    for (var j = 0; j < lista.length; j++) {
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
    if (alumno.unidad) meter('Grupo', alumno.unidad);
    if (alumno.curso) meter('Curso', alumno.curso);

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

  return {
    aTabla: aTabla, aCsv: aCsv, cargar: cargar, anadirALista: anadirALista,
    buscar: buscar, olvidar: olvidar, LISTAS: LISTAS,
    unidadesDistintas: unidadesDistintas, destacadosAlumno: destacadosAlumno
  };
})();
