/* ============================================================
   tablas-datos-consejo.js — la tabla CONSEJO ESCOLAR (1-oct-2026, fila
   238, docs/CERTIFICADO-CONSEJO-ESCOLAR.md).

   Séneca da, por cada renovación del Consejo, un CSV «Registro de miembros
   del Consejo Escolar» (`RegMieConEsc 2024-2025.csv`, a veces con un
   prefijo de números y guiones bajos). Aquí se leen (columnas por su
   título, no por su sitio: Sector, Miembro(s), Nombramiento, Cese) y se
   unen en UNA tabla de `TablasDatos`, una fila por nombramiento:

     { apellidos, nombre, sector, cargo, desde, hasta (ISO), periodos,
       nato, reciente, claveNombre, orden }

   Se une a la persona por el NOMBRE (Séneca no da el DNI): sin tildes,
   mayúsculas, comas ni orden, y «Mª» = «María». No se une por parecido.

   Funciones puras salvo donde se dice: `leerTexto`, `unir`, `celdas`,
   `claveNombre`, `periodoDe`, `esFicheroDelConsejo`, `nombreLimpio`.
   ============================================================ */
var TablasDatosConsejo = (function () {

  var NOMBRE_TABLA = 'CONSEJO ESCOLAR';
  var COLUMNAS = ['Sector', 'Cargo', 'Nombramiento', 'Cese'];
  var PARTICULAS = { de: 1, del: 1, la: 1, las: 1, los: 1, el: 1, y: 1, e: 1 };

  function norm(t) { return U.normalizar(String(t || '')); }

  /* ---------- el nombre del fichero ---------- */

  function esFicheroDelConsejo(nombre) {
    return /^[\d_\-\s.]*regmieconesc/.test(norm(nombre).replace(/\s+/g, ' ')) && /\.csv$/i.test(nombre);
  }

  /* '2024-2025' del nombre del fichero (mirando solo lo que va tras «RegMieConEsc»), o ''. */
  function periodoDe(nombre) {
    var n = norm(nombre);
    var i = n.indexOf('regmieconesc');
    var m = n.slice(i === -1 ? 0 : i + 12).match(/(\d{4})\D+(\d{4})/);
    return m ? m[1] + '-' + m[2] : '';
  }

  function nombreLimpio(nombre, periodo) {
    return 'RegMieConEsc' + (periodo || periodoDe(nombre) ? ' ' + (periodo || periodoDe(nombre)) : '') + '.csv';
  }

  /* ---------- texto ---------- */

  function sinHtml(t) { return String(t || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }

  function todoMayusculas(t) { return t === t.toUpperCase() && t !== t.toLowerCase(); }

  /* Un nombre entero en mayúsculas pasa a tipo título; si no, se deja. */
  function nombrePropio(t) {
    t = String(t || '').trim();
    if (!todoMayusculas(t)) return t;
    return t.toLowerCase().split(/(\s+)/).map(function (p, i) {
      if (!p.trim() || (i > 0 && PARTICULAS[p])) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join('');
  }

  /* Un cargo entero en mayúsculas pasa a frase («Director/a»). */
  function cargoLimpio(t) {
    t = String(t || '').trim();
    if (!todoMayusculas(t)) return t;
    t = t.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /* Sin tildes, mayúsculas, comas ni orden; «Mª» = «María». */
  function claveNombre(n) {
    return norm(n).replace(/\bm[ªº]\.?(?=\s|$|,)/g, 'maria').replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/).filter(Boolean).sort().join(' ');
  }

  function isoDe(t) {
    var m = String(t || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return '';
    return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  }

  function fechaLegible(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }

  /* ---------- leer un fichero ---------- */

  /* { ok, motivo, periodo, filas: [{ apellidos, nombre, sector, cargo, desde, hasta }] } */
  function leerTexto(texto, fichero) {
    var matriz = Datos.aTabla(texto).filas;
    var cab = -1, col = {};
    for (var i = 0; i < Math.min(matriz.length, 8) && cab === -1; i++) {
      var c = {};
      matriz[i].forEach(function (celda, j) {
        var t = norm(sinHtml(celda));
        if (t === 'sector') c.sector = j;
        else if (/^miembros?$/.test(t)) c.miembro = j;
        else if (t.indexOf('nombramiento') !== -1) c.nombramiento = j;
        else if (t.indexOf('cese') !== -1) c.cese = j;
      });
      if (c.sector !== undefined && c.miembro !== undefined && c.nombramiento !== undefined && c.cese !== undefined) { cab = i; col = c; }
    }
    if (cab === -1) return { ok: false, motivo: 'No trae las columnas Sector, Miembro, Nombramiento y Cese.', filas: [], periodo: periodoDe(fichero) };
    var filas = [];
    matriz.slice(cab + 1).forEach(function (f) {
      var miembro = String(f[col.miembro] || '').trim();
      if (!miembro) return;
      var sector = sinHtml(f[col.sector]), cargoSector = '', cargoMiembro = '';
      var ms = sector.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
      if (ms) { sector = ms[1].trim(); cargoSector = ms[2].trim(); }
      var mm = miembro.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
      if (mm) { miembro = mm[1].trim(); cargoMiembro = mm[2].trim(); }
      var coma = miembro.indexOf(',');
      var apellidos = coma === -1 ? miembro : miembro.slice(0, coma);
      var nombre = coma === -1 ? '' : miembro.slice(coma + 1);
      filas.push({
        apellidos: nombrePropio(apellidos), nombre: nombrePropio(nombre), sector: nombrePropio(sector),
        cargo: cargoLimpio(cargoSector || cargoMiembro),
        desde: isoDe(f[col.nombramiento]), hasta: isoDe(f[col.cese])
      });
    });
    return { ok: true, motivo: '', filas: filas, periodo: periodoDe(fichero) };
  }

  /* ---------- unir los ficheros ---------- */

  /* `ficheros`: [{ fichero, periodo, filas }]. Devuelve { filas, periodos, avisos }. */
  function unir(ficheros) {
    var orden = ficheros.slice().sort(function (a, b) { return String(a.periodo).localeCompare(String(b.periodo)); });
    var mapa = {}, lista = [], avisos = [], firmas = {};
    var ultimo = '';
    orden.forEach(function (f) { if (f.periodo && f.periodo > ultimo) ultimo = f.periodo; });

    orden.forEach(function (f) {
      var tarde = 0;
      var firma = JSON.stringify(f.filas.map(function (x) { return [claveNombre(x.apellidos + ' ' + x.nombre), norm(x.sector), norm(x.cargo), x.desde, x.hasta].join('|'); }).sort());
      if (f.periodo && f.filas.length) {
        if (firmas[firma] && firmas[firma].periodo !== f.periodo) {
          avisos.push('«' + f.fichero + '» tiene el mismo contenido que «' + firmas[firma].fichero + '», de otro periodo.');
        } else if (!firmas[firma]) firmas[firma] = { fichero: f.fichero, periodo: f.periodo };
      }
      var limite = f.periodo ? f.periodo.split('-')[1] + '-08-31' : '';
      f.filas.forEach(function (x) {
        var nato = !x.desde;
        var k = [claveNombre(x.apellidos + ' ' + x.nombre), norm(x.sector), norm(x.cargo), nato ? 'nato' : x.desde].join('|');
        var e = mapa[k];
        if (!e) {
          e = mapa[k] = { apellidos: x.apellidos, nombre: x.nombre, sector: x.sector, cargo: x.cargo, desde: x.desde, hasta: '',
            periodos: [], nato: nato, claveNombre: claveNombre(x.apellidos + ' ' + x.nombre), _conflicto: false };
          lista.push(e);
        }
        if (f.periodo && e.periodos.indexOf(f.periodo) === -1) e.periodos.push(f.periodo);
        if (x.hasta) {
          if (e.hasta && e.hasta !== x.hasta) e._conflicto = true;
          e.hasta = x.hasta;
        }
        if (limite && x.desde && x.desde > limite) tarde++;
      });
      if (tarde) avisos.push('«' + f.fichero + '»: ' + (tarde === 1 ? '1 nombramiento tiene' : tarde + ' nombramientos tienen') + ' una fecha posterior al periodo ' + f.periodo + '.');
    });
    var conflictos = lista.filter(function (e) { return e._conflicto; }).length;
    if (conflictos) avisos.push((conflictos === 1 ? 'Un mismo nombramiento sale' : conflictos + ' nombramientos salen') + ' con ceses distintos según el fichero; vale el del más reciente.');
    lista.forEach(function (e) {
      e.periodos.sort();
      e.reciente = !!ultimo && e.periodos.indexOf(ultimo) !== -1;
      e.orden = e.desde || ((e.periodos[0] || '0000').slice(0, 4) + '-09-01');
      delete e._conflicto;
    });
    lista.sort(function (a, b) { return a.orden.localeCompare(b.orden) || a.apellidos.localeCompare(b.apellidos); });
    var periodos = [];
    orden.forEach(function (f) { if (f.periodo && periodos.indexOf(f.periodo) === -1) periodos.push(f.periodo); });
    return { filas: lista, periodos: periodos, avisos: avisos };
  }

  /* ---------- una fila como celdas ---------- */

  /* `ctx.faltan` (solo al generar un documento): un cese que falta en un
     Consejo antiguo sale resaltado y se suma al aviso ámbar. */
  function celdas(fila, columnas, ctx) {
    var cese = '';
    if (!fila.nato) {
      if (fila.hasta) cese = fechaLegible(fila.hasta);
      else if (fila.reciente) cese = 'Hasta la actualidad';
      else if (ctx && ctx.faltan) {
        if (ctx.faltan.indexOf('Cese') === -1) ctx.faltan.push('Cese');
        cese = Docx.MARCA_FALTA('Cese');
      }
    }
    var mapa = {
      'sector': fila.sector, 'cargo': fila.cargo,
      'nombramiento': fila.nato ? 'Cursos ' + fila.periodos.join(', ') : fechaLegible(fila.desde),
      'cese': cese, 'periodos': fila.periodos.join(', '),
      'nombre': fila.apellidos + (fila.nombre ? ', ' + fila.nombre : ''),
      'desde': fechaLegible(fila.desde), 'hasta': fechaLegible(fila.hasta)
    };
    return columnas.map(function (c) { return mapa[norm(c)] || ''; });
  }

  return {
    NOMBRE_TABLA: NOMBRE_TABLA, COLUMNAS: COLUMNAS,
    esFicheroDelConsejo: esFicheroDelConsejo, periodoDe: periodoDe, nombreLimpio: nombreLimpio,
    claveNombre: claveNombre, leerTexto: leerTexto, unir: unir, celdas: celdas
  };
})();
window.TablasDatosConsejo = TablasDatosConsejo;
