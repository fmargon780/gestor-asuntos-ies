/* ============================================================
   tablas-datos.js — las tablas de datos y los huecos que traen datos
   de ellas (24-sep-2026, fila 110, docs/TABLAS-DE-DATOS.md).

   Tablas que la aplicación lee de la carpeta de datos, unidas a la
   persona por su DNI (los dígitos, como `clavePersona` de js/datos.js):

   - TUTORIAS: los PDF «Función Tutorial 2025-2026.pdf» (o que empiecen
     por «RelFunTut») de Séneca, leídos por js/tablas-datos-leer.js.
   - PROFESORADO: no se lee otra vez, sale de `Datos` (los RelPerCen).
   - Cualquier CSV o Excel de la subcarpeta `Tablas`: una tabla por
     fichero, con su cabecera tal cual.

   Huecos de plantilla (js/plantillas.js los enseña en su catálogo):
   {{ESPECIALIDAD}}, {{TABLA TUTORIAS}}, {{DATO <tabla>: <columna>}} y
   {{TABLA <tabla>: <col1> | <col2> | …}}. `prepararDocumento` los
   resuelve antes de `Docx.rellenar` (lo llama js/plantillas-documento.js);
   lo que no tiene dato sale «[falta: …]» en amarillo y entra en «faltan».

   Además: el bloque «Tablas de datos» de Ajustes → Mantenimiento (solo
   lectura) y el plegable «Datos de las tablas» de la ficha del tercero.
   ============================================================ */
var TablasDatos = (function () {

  var CACHE = null;   /* { tablas: { NOMBRE: { nombre, ficheros, cursos, cabecera, filas } }, errores: [] } */
  var L = window.TablasDatosLeer;
  /* Fila 123: como el certificado del centro. Los nombres viejos (Curso
     escolar, Grupo, Desde, Hasta) siguen valiendo en {{TABLA TUTORIAS: …}}. */
  var COLUMNAS_TUTORIAS = ['Cargo', 'Curso', 'Toma de posesión', 'Cese'];
  var GRUPO_DIVERSIDAD = 'pedagogia terapeutica';

  function dirDatos() { return window.App && App.E && App.E.datos; }
  function nombreTabla(n) { return U.normalizar(String(n || '')).replace(/\.(csv|xlsx)$/i, '').replace(/[^a-z0-9]+/g, ' ').trim().toUpperCase(); }
  function fechaLegible(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }

  async function leerBytes(dir, nombre) {
    var h = await dir.getFileHandle(nombre);
    return new Uint8Array(await (await h.getFile()).arrayBuffer());
  }

  /* ---------- leer todo (con caché) ---------- */

  async function cargar(forzar) {
    if (CACHE && !forzar) return CACHE;
    var salida = { tablas: {}, errores: [] };
    var dir = dirDatos();
    if (!dir) return (CACHE = salida);
    var lista = [];
    try { lista = await Carpetas.ficheros(dir); } catch (e) { lista = []; }

    var tut = { nombre: 'TUTORIAS', ficheros: [], cursos: [], cabecera: COLUMNAS_TUTORIAS, filas: [] };
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i].nombre;
      var norm = U.normalizar(n);
      if (!/\.pdf$/i.test(n) || !(/^funcion tutorial/.test(norm) || /^relfuntut/.test(norm))) continue;
      try {
        var filas = await L.tutoriasDePdf(await leerBytes(dir, n), n);
        if (!filas.length) throw new Error('No he encontrado ninguna fila de tutoría en el PDF.');
        tut.ficheros.push(n);
        filas.forEach(function (f) { if (tut.cursos.indexOf(f.curso) === -1) tut.cursos.push(f.curso); });
        tut.filas = tut.filas.concat(filas);
      } catch (e) { salida.errores.push({ fichero: n, motivo: U.mensajeDeError(e) }); }
    }
    /* Sin repetir entre ficheros (el mismo PDF bajado dos veces). */
    var vistos = {};
    tut.filas = tut.filas.filter(function (f) {
      var k = [f.curso, f.grupo, f.dni, f.desde, f.hasta].join('|');
      return vistos[k] ? false : (vistos[k] = true);
    });
    tut.cursos.sort();
    if (tut.ficheros.length) salida.tablas.TUTORIAS = tut;

    var sub = null;
    try { sub = await dir.getDirectoryHandle('Tablas'); } catch (e) { sub = null; }
    if (sub) {
      var enSub = [];
      try { enSub = await Carpetas.ficheros(sub); } catch (e) { enSub = []; }
      for (var j = 0; j < enSub.length; j++) {
        var f2 = enSub[j].nombre;
        if (!/\.(csv|xlsx)$/i.test(f2)) continue;
        try {
          var t = /\.csv$/i.test(f2) ? L.deCsv(await Carpetas.leerTexto(sub, f2)) : await L.deXlsx(await leerBytes(sub, f2));
          if (!t.cabecera.length) throw new Error('Está vacío.');
          salida.tablas[nombreTabla(f2)] = { nombre: nombreTabla(f2), ficheros: [f2], cursos: [], cabecera: t.cabecera,
            filas: t.filas, columnaDni: t.columnaDni };
          if (!t.columnaDni) salida.errores.push({ fichero: f2, motivo: 'No encuentro la columna del DNI: la tabla se lee, pero no se puede unir a nadie.' });
        } catch (e) { salida.errores.push({ fichero: f2, motivo: U.mensajeDeError(e) }); }
      }
    }
    /* Fila 142: la tabla «ALUMNADO BD» (unida por Nº escolar). */
    if (window.AlumnadoBD) { try { await AlumnadoBD.comoTabla(salida); } catch (e) { salida.errores.push({ fichero: 'ALUMNADO-BD.json', motivo: U.mensajeDeError(e) }); } }
    CACHE = salida;
    return salida;
  }

  function olvidar() { CACHE = null; }

  /* [{ nombre, ficheros, cursos, filas }] y los errores. */
  async function lista() {
    var d = await cargar();
    var tablas = Object.keys(d.tablas).map(function (k) {
      var t = d.tablas[k];
      return { nombre: t.nombre, ficheros: t.ficheros, cursos: t.cursos, filas: t.filas.length };
    });
    return { tablas: tablas, errores: d.errores };
  }

  /* ---------- las filas de una persona ---------- */

  /* Con el documento entero, por sus dígitos; si solo se tienen los 4
     últimos caracteres, por esos 4 y el nombre normalizado. */
  function esDeLaPersona(fila, persona) {
    if (fila.idEscolar) return !!persona && String(persona.idEscolar || persona.id || '').trim() === fila.idEscolar;
    var doc = String((persona && (persona.documento || persona.dni)) || '');
    var clave = L.clave(doc);
    if (clave.length > 4) return fila.clave === clave;
    var ultimos = doc.replace(/\s+/g, '').slice(-4).toUpperCase();
    if (!ultimos) return false;
    var dniFila = String(fila.dni || '').toUpperCase();
    var nombreFila = U.normalizar(fila.nombre || (fila.celdas && Object.values(fila.celdas).join(' ')) || '');
    return dniFila.slice(-4) === ultimos && nombreFila.indexOf(U.normalizar((persona.nombre || '').split(',')[0])) !== -1;
  }

  async function filasDe(nombre, persona) {
    var d = await cargar();
    var t = d.tablas[nombreTabla(nombre)];
    if (!t || !persona) return [];
    return t.filas.filter(function (f) { return esDeLaPersona(f, persona); })
      .sort(function (a, b) { return String(a.curso || '').localeCompare(String(b.curso || '')) || String(a.desde || '').localeCompare(String(b.desde || '')); });
  }

  /* Una fila como lista de celdas, con las columnas pedidas. */
  function celdasDe(tabla, fila, columnas) {
    if (tabla === 'TUTORIAS') {
      var desde = fechaLegible(fila.desde), hasta = fechaLegible(fila.hasta);
      var mapa = { 'curso escolar': fila.curso, 'curso': String(fila.curso || '').replace('/', '-'), 'grupo': fila.grupo,
                   'cargo': cargoDe(fila.grupo), 'desde': desde, 'toma de posesion': desde, 'hasta': hasta, 'cese': hasta,
                   'nombre': fila.nombre, 'dni': fila.dni };
      return columnas.map(function (c) { return mapa[U.normalizar(c)] || ''; });
    }
    return columnas.map(function (c) {
      var real = Object.keys(fila.celdas).filter(function (k) { return U.normalizar(k) === U.normalizar(c); })[0];
      return real ? fila.celdas[real] : '';
    });
  }

  /* «Tutoría 4º ESO C»; en el bloque de atención a la diversidad (sin
     unidad), «Tutoría de Pedagogía Terapéutica, …» (fila 123). */
  function cargoDe(grupo) {
    var g = String(grupo || '').trim();
    if (!g) return 'Tutoría';
    return U.normalizar(g).indexOf(GRUPO_DIVERSIDAD) === 0 ? 'Tutoría de ' + g : 'Tutoría ' + g;
  }

  /* «Cursos que pide» (campo propio del tipo, fila 123): solo los periodos
     de esos cursos. Vacío, todos; sin entenderlo, todos y un aviso. */
  function filtrarPorCursos(filas, valores, faltan) {
    var escrito = '';
    var campos = (valores && valores.campos) || {};
    Object.keys(campos).forEach(function (k) { if (U.normalizar(k) === 'cursos que pide') escrito = campos[k]; });
    var pedido = window.TablasDatosCursos ? TablasDatosCursos.entender(escrito) : null;
    if (!pedido) return filas;
    if (!pedido.entendido) {
      faltan.push('Cursos que pide: no entiendo «' + escrito + '», salen todos los cursos');
      return filas;
    }
    return filas.filter(function (f) { return pedido.anios.indexOf(TablasDatosCursos.anioDe(f.curso)) !== -1; });
  }

  /* ---------- los huecos de un documento ---------- */

  /* La persona del asunto (el tercero), la misma que busca la ficha. */
  async function personaDelAsunto(asunto) {
    if (!window.FichaTercero || !FichaTercero.datosBasicos) return null;
    try { return (await FichaTercero.datosBasicos(asunto)).persona; } catch (e) { return null; }
  }

  /* Lee qué huecos de tabla trae la plantilla, mete las tablas en su
     sitio (Docx.ponerTabla) y deja en `valores` lo que va en texto
     (`especialidad`, `datosTablas`). Devuelve { buffer, faltan }. */
  async function prepararDocumento(buffer, asunto, valores) {
    var texto = await Docx.textoDelDocumento(buffer);
    var huecos = [];
    texto.replace(/\{\{\s*(ESPECIALIDAD(?:\s+FIRMANTE|\s+VISTO\s+BUENO)?|TABLA[^{}]*|DATO[^{}]*)\s*\}\}/gi, function (t, dentro) { huecos.push(dentro.trim()); });
    if (!huecos.length) return { buffer: buffer, faltan: [] };

    var persona = await personaDelAsunto(asunto);
    var faltan = [];
    valores.datosTablas = valores.datosTablas || {};

    for (var i = 0; i < huecos.length; i++) {
      var h = huecos[i];
      if (/^especialidad$/i.test(h)) {
        var esp = await especialidadDe(persona);
        if (!esp) { faltan.push('Especialidad'); esp = Docx.MARCA_FALTA('Especialidad'); }
        valores.especialidad = esp;
        continue;
      }
      /* {{ESPECIALIDAD FIRMANTE}} / {{ESPECIALIDAD VISTO BUENO}} (fila 123):
         el puesto de quien ocupa el cargo en la fecha del documento. */
      var deCargo = h.match(/^especialidad\s+(firmante|visto\s+bueno)$/i);
      if (deCargo) {
        var quien = /^firmante$/i.test(deCargo[1]) ? 'firmante' : 'visto bueno';
        var etiquetaCargo = quien === 'firmante' ? 'Especialidad de quien firma' : 'Especialidad del visto bueno';
        var espCargo = await especialidadPorNombre(valores[quien], valores[quien + ' documento']);
        if (!espCargo) { faltan.push(etiquetaCargo); espCargo = Docx.MARCA_FALTA(etiquetaCargo); }
        valores['especialidad ' + quien] = espCargo;
        continue;
      }
      var tabla = h.match(/^TABLA\s+([^:]+?)\s*(?::\s*(.*))?$/i);
      if (tabla) {
        var nombre = nombreTabla(tabla[1]);
        var columnas = tabla[2] ? tabla[2].split('|').map(function (c) { return c.trim(); }).filter(Boolean)
          : (nombre === 'TUTORIAS' ? COLUMNAS_TUTORIAS : ((await cargar()).tablas[nombre] || { cabecera: [] }).cabecera);
        var filas = await filasDe(nombre, persona);
        if (nombre === 'TUTORIAS' && filas.length) filas = filtrarPorCursos(filas, valores, faltan);
        if (filas.length) {
          var r = await Docx.ponerTabla(buffer, h, columnas, filas.map(function (f) { return celdasDe(nombre, f, columnas); }));
          buffer = r.bytes;
        } else {
          var etiqueta = 'Tabla ' + tabla[1].trim();
          faltan.push(etiqueta);
          valores.datosTablas[U.normalizar(h)] = Docx.MARCA_FALTA(etiqueta);
        }
        continue;
      }
      var dato = h.match(/^DATO\s+([^:]+?)\s*:\s*(.+)$/i);
      if (dato) {
        var filasD = await filasDe(dato[1], persona);
        var v = filasD.length ? celdasDe(nombreTabla(dato[1]), filasD[filasD.length - 1], [dato[2].trim()])[0] : '';
        if (!v) { faltan.push(dato[2].trim()); v = Docx.MARCA_FALTA(dato[2].trim()); }
        valores.datosTablas[U.normalizar(h)] = v;
      }
    }
    return { buffer: buffer, faltan: faltan };
  }

  /* La especialidad es el puesto de la persona en los RelPerCen (curso más reciente). */
  async function especialidadDe(persona) {
    if (!persona) return '';
    if (persona.puesto) return persona.puesto;
    try {
      var personal = await Datos.cargar(App.E.datos, 'PERSONAL');
      var clave = L.clave(persona.documento);
      var p = personal.lista.filter(function (x) { return clave && L.clave(x.documento) === clave; })[0];
      return (p && p.puesto) || '';
    } catch (e) { return ''; }
  }

  /* La de quien ocupa un cargo (fila 123): por su documento si se sabe y,
     si no, por el nombre, sin tildes, mayúsculas, comas ni orden («Pérez
     Gómez, Juana» = «Juana Pérez Gómez»). */
  function huesoDelNombre(n) {
    return U.normalizar(String(n || '')).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  }

  async function especialidadPorNombre(nombre, documento) {
    if (!nombre && !documento) return '';
    try {
      var personal = await Datos.cargar(App.E.datos, 'PERSONAL');
      var clave = L.clave(documento || '');
      var hueso = huesoDelNombre(nombre);
      var p = personal.lista.filter(function (x) {
        return (clave.length > 4 && L.clave(x.documento) === clave) || (hueso && huesoDelNombre(x.nombre) === hueso);
      })[0];
      return (p && p.puesto) || '';
    } catch (e) { return ''; }
  }

  /* Después de Docx.rellenar: lo marcado como falta, en amarillo. */
  async function resaltarResultado(resultado, faltan) {
    var bytes = new Uint8Array(await resultado.blob.arrayBuffer());
    var nuevos = await Docx.resaltarFaltas(bytes);
    var todas = (resultado.faltan || []).slice();
    (faltan || []).forEach(function (f) { if (todas.indexOf(f) === -1) todas.push(f); });
    return { blob: new Blob([nuevos], { type: resultado.blob.type }), faltan: todas };
  }

  return {
    cargar: cargar, olvidar: olvidar, lista: lista, filasDe: filasDe, celdasDe: celdasDe,
    nombreTabla: nombreTabla, prepararDocumento: prepararDocumento, resaltarResultado: resaltarResultado,
    especialidadDe: especialidadDe, especialidadPorNombre: especialidadPorNombre, cargoDe: cargoDe,
    COLUMNAS_TUTORIAS: COLUMNAS_TUTORIAS, _esDeLaPersona: esDeLaPersona
  };
})();
window.TablasDatos = TablasDatos;
