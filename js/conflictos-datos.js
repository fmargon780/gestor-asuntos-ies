/* ============================================================
   conflictos-datos.js — los CSV de terceros, administraciones.json y
   "los terceros se releen solos".

   Sacado tal cual de js/conflictos.js en la fila 176
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hacía.
   Lo compartido se pide a `Conflictos._interno` (I). Se carga justo
   detrás de js/conflictos.js.
   ============================================================ */
(function () {
  if (typeof Conflictos === 'undefined' || !Conflictos._interno) return;
  var I = Conflictos._interno;

  /* ---------- los CSV de terceros dados de alta a mano (fila 130) ----------

     `solicitantes.csv`, `personal.csv`, `empresas.csv` y `otros.csv`, en
     `_GESTOR/datos`. Se unen solos: unión de filas, y dos filas iguales
     se quedan en una. Si dos filas tienen el mismo nombre (primera
     columna) y datos distintos, se queda la del fichero real y la otra
     se apunta para que Francisco elija en Ajustes. Antes, el fichero
     real se copia a `_GESTOR/copias` y la copia en conflicto se mueve
     allí: no se pierde ninguna fila. */
  var CSV_DE_TERCEROS = ['solicitantes.csv', 'personal.csv', 'empresas.csv', 'otros.csv',
                         'tutores.csv'];   /* fila 166: los tutores legales ya terceros */

  function ficheroRealCsv(nombreConflicto) {
    var m = nombreConflicto.match(/^(.+?)\s*\([^)]*conflic[^)]*\)\.csv$/i);
    return m ? m[1].trim() + '.csv' : '';
  }

  /* Función pura. `real` y `otro`: el texto de los dos CSV. Devuelve
     { texto, anadidas, dudosas: [{ nombre, fila (objeto columna → valor) }] }. */
  function unirCsv(real, otro) {
    var tReal = Datos.aTabla(real || '').filas;
    var tOtro = Datos.aTabla(otro || '').filas;
    var cab = (tReal[0] || tOtro[0] || []).map(function (x) { return String(x).trim(); });
    var cabOtro = (tOtro[0] || cab).map(function (x) { return String(x).trim(); });
    function limpia(fila) { return cab.map(function (c, i) { return String(fila[i] === undefined ? '' : fila[i]).trim(); }); }
    function delOtro(fila) {
      return cab.map(function (c) {
        var i = cabOtro.indexOf(c);
        return i === -1 ? '' : String(fila[i] === undefined ? '' : fila[i]).trim();
      });
    }
    var filas = tReal.slice(1).map(limpia).filter(function (f) { return f[0]; });
    var enteras = {}, porNombre = {};
    filas.forEach(function (f) { enteras[f.join('\u0001')] = true; porNombre[U.normalizar(f[0])] = true; });
    var anadidas = 0, dudosas = [];
    tOtro.slice(1).map(delOtro).forEach(function (f) {
      if (!f[0] || enteras[f.join('\u0001')]) return;
      if (porNombre[U.normalizar(f[0])]) {
        var obj = {};
        cab.forEach(function (c, i) { obj[c] = f[i]; });
        dudosas.push({ nombre: f[0], fila: obj });
        return;
      }
      enteras[f.join('\u0001')] = true;
      porNombre[U.normalizar(f[0])] = true;
      filas.push(f);
      anadidas++;
    });
    filas.sort(function (a, b) { return U.normalizar(a[0]) < U.normalizar(b[0]) ? -1 : 1; });
    return { texto: Datos.aCsv(cab, filas), anadidas: anadidas, dudosas: dudosas };
  }

  function categoriaDeCsv(fichero) {
    var L = (window.Datos && Datos.LISTAS) || {};
    return Object.keys(L).filter(function (k) { return L[k].fichero === fichero; })[0] || '';
  }

  function sello() {
    var d = new Date();
    function dos(n) { return String(n).padStart(2, '0'); }
    return String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate()) + '-' + dos(d.getHours()) + dos(d.getMinutes());
  }

  function fusionarCsv(g, dirDatos, nombreConflicto, real) {
    var hacer = function () { return fusionarCsvYa(g, dirDatos, nombreConflicto, real); };
    return window.ColaGuardado ? ColaGuardado.poner(real, hacer) : hacer();
  }

  async function fusionarCsvYa(g, dirDatos, nombreConflicto, real) {
    var textoReal, textoOtro;
    try {
      textoReal = (await Carpetas.leerTexto(dirDatos, real)) || '';
      textoOtro = await Carpetas.leerTexto(dirDatos, nombreConflicto);
    } catch (e) { return null; }
    if (textoOtro === null) return null;
    var r = unirCsv(textoReal, textoOtro);
    var copias = await Carpetas.crear(g, 'copias');
    await Carpetas.escribirTexto(copias, real.replace(/\.csv$/, '') + '-antes-de-unir-' + sello() + '.csv', textoReal);
    await Carpetas.escribirTexto(dirDatos, real, r.texto);
    await Carpetas.moverFichero(dirDatos, nombreConflicto, copias, nombreConflicto);
    var cat = categoriaDeCsv(real);
    if (cat && window.Datos) Datos.olvidar(cat);
    r.dudosas.forEach(function (d) {
      I.pendientesPush({ real: real, nombreConflicto: nombreConflicto, fila: d.fila, nombre: d.nombre, categoria: cat });
    });
    return r;
  }

  /* ---------- los terceros se releen solos (fila 132) ----------

     La caché de `Datos` no caducaba en toda la sesión: un alta del
     compañero o un RegAlum.csv nuevo no se veían hasta recargar. En
     esta misma revisión (cada cinco minutos, nunca con un guardado en
     marcha) se mira la fecha de cada CSV de `_GESTOR/datos`; si ha
     cambiado desde la vez anterior, se olvida esa categoría. Nada más:
     se relee la próxima vez que se pida, sin repintar nada. */
  var fechasDatos = null;   /* { nombre: lastModified } de la pasada anterior */

  function categoriaDeDatos(nombre) {
    var cat = categoriaDeCsv(nombre);
    if (cat) return cat;
    var n = String(nombre).toLowerCase();
    if (/regalum|alumn|matric/.test(n)) return 'ALUMNADO';
    if (/relpercen|personal|profesor/.test(n)) return 'PERSONAL';
    return '';
  }

  /* Función pura: qué categorías olvidar al pasar de `antes` a `ahora`
     (null = todas; [] = ninguna). La primera pasada solo apunta. */
  function categoriasCambiadas(antes, ahora) {
    if (!antes) return [];
    var cats = {}, todas = false;
    Object.keys(ahora).forEach(function (n) {
      if (antes[n] === ahora[n]) return;
      var c = categoriaDeDatos(n);
      if (c) cats[c] = true; else todas = true;
    });
    return todas ? null : Object.keys(cats);
  }

  async function revisarFechasDatos() {
    var dirDatos = window.App && App.E && App.E.datos;
    if (!dirDatos || !window.Datos) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    var ahora = {};
    try {
      var lista = await Carpetas.ficheros(dirDatos);
      for (var i = 0; i < lista.length; i++) {
        if (!/\.(csv|xlsx?)$/i.test(lista[i].nombre)) continue;
        try { ahora[lista[i].nombre] = (await lista[i].handle.getFile()).lastModified; } catch (e) { /* se mira la próxima vez */ }
      }
    } catch (e) { return; }
    var cambiadas = categoriasCambiadas(fechasDatos, ahora);
    fechasDatos = ahora;
    if (cambiadas === null) Datos.olvidar();
    else cambiadas.forEach(function (c) { Datos.olvidar(c); });
  }

  /* Fila 167: la copia en conflicto de administraciones.json se une por
     id dentro de la misma cola que sus guardados, y se aparta a copias. */
  function fusionarAdministraciones(g, dirDatos, nombreConflicto) {
    var otro = null;
    return Administraciones.cambiar(dirDatos, async function (d) {
      var texto = await Carpetas.leerTexto(dirDatos, nombreConflicto);
      if (texto === null) return false;
      try { otro = JSON.parse(texto); } catch (e) { otro = null; }
      var unido = Administraciones.unirDatos(d, otro);
      d.superiores = unido.superiores;
      d.organismos = unido.organismos;
      return true;
    }).then(async function (hecho) {
      if (!hecho) return false;
      var copias = await Carpetas.crear(g, 'copias');
      await Carpetas.moverFichero(dirDatos, nombreConflicto, copias, nombreConflicto);
      return true;
    });
  }

  /* Fila 130: las copias en conflicto de los CSV de terceros, en _GESTOR/datos. */
  async function revisarCsv(g) {
    var dirDatos = window.App && App.E && App.E.datos;
    if (!dirDatos || !window.Datos) return;
    var lista;
    try { lista = await Carpetas.ficheros(dirDatos); } catch (e) { return; }
    for (var i = 0; i < lista.length; i++) {
      var nombre = lista[i].nombre;
      /* Fila 167: administraciones.json, unido por id (Administraciones.unirDatos). */
      if (/^administraciones\s*\([^)]*conflic[^)]*\)\.json$/i.test(nombre) && window.Administraciones) {
        try { if (await fusionarAdministraciones(g, dirDatos, nombre)) U.aviso('Se han unido los cambios de los dos ordenadores en administraciones.json.'); }
        catch (e) { /* a la siguiente pasada */ }
        continue;
      }
      var real = ficheroRealCsv(nombre);
      if (!real || CSV_DE_TERCEROS.indexOf(real) === -1) continue;
      var r = null;
      try { r = await fusionarCsv(g, dirDatos, nombre, real); } catch (e) { r = null; }
      if (!r) continue;
      U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.' +
        (r.dudosas.length ? ' ' + r.dudosas.length + (r.dudosas.length === 1 ? ' persona sale' : ' personas salen') +
          ' con datos distintos en cada uno: elige en Ajustes → Mantenimiento → Conflictos de Dropbox.' : ''),
        r.dudosas.length ? 'ambar' : '');
    }
  }

  I.revisarCsv = revisarCsv;
  I.revisarFechasDatos = revisarFechasDatos;

  Object.assign(window.Conflictos, {
    unirCsv: unirCsv, fusionarCsv: fusionarCsv,
    categoriasCambiadas: categoriasCambiadas, revisarFechasDatos: revisarFechasDatos
  });
})();
