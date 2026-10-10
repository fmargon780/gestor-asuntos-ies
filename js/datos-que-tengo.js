/* ============================================================
   datos-que-tengo.js — qué ficheros de alumnado y de personal tiene el
   gestor, de cuándo son, por dónde llegaron y si hay otro más nuevo
   (9-oct-2026, fila 319, docs/LO-QUE-TENGO-AHORA.md). Lo que se ve
   está en js/datos-que-tengo-ver.js.

   - apuntar(nombre, origen): quien copia un fichero de datos a
     `_GESTOR/datos` apunta por dónde llegó en `_GESTOR/datos-origen.json`
     (`via`: 'a-mano' | 'centro-de-datos' | 'carpeta-bd' | 'recogido').
     `marca` dice si el apunte sigue valiendo: si el fichero ya no
     coincide con ella, alguien lo cambió por otro camino.
   - estado(): una entrada por fichero (RegAlum.csv, ALUMNADO-BD.json y
     cada RelPerCen…csv).
   - mirarSiHayMasNuevo(): compara con las carpetas señaladas en este
     ordenador. Nunca pide permiso. Se guarda 60 segundos.

   No envuelve nada. Un fallo al apuntar no impide traer el fichero.
   ============================================================ */
var DatosQueTengo = (function () {

  var FICHERO = 'datos-origen.json';
  var ESQUEMA = 1;
  var BD = 'ALUMNADO-BD.json';
  var MARGEN_MS = 2000;
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function gestor() { return window.App && App.E && App.E.gestor; }
  function datos() { return window.App && App.E && App.E.datos; }
  function ms(v) { var t = typeof v === 'number' ? v : new Date(v || '').getTime(); return isNaN(t) ? 0 : t; }
  function dos(n) { return String(n).padStart(2, '0'); }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }   /* 4827 → 4.827 */

  /* «9-oct-2026 · 08:52» */
  function fechaHora(v) {
    var t = ms(v);
    if (!t) return '';
    var d = new Date(t);
    return d.getDate() + '-' + MESES[d.getMonth()] + '-' + d.getFullYear() + ' · ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  /* ---------- lo apuntado ---------- */

  var enMemoria = null, leidoEn = 0;

  async function leerApuntes(fresco) {
    var g = gestor();
    if (!g) return { _esquema: ESQUEMA, ficheros: {} };
    if (!fresco && enMemoria && Date.now() - leidoEn < 10000) return enMemoria;
    var j = null;
    try { j = await Carpetas.leerJson(g, FICHERO); } catch (e) { j = null; }
    var a = (j && typeof j === 'object' && !Array.isArray(j)) ? j : {};
    a.ficheros = a.ficheros || {};
    a._esquema = a._esquema || ESQUEMA;
    enMemoria = a; leidoEn = Date.now();
    return a;
  }

  /* Entre dos apuntes del mismo fichero (los dos ordenadores), gana el de `traidoEl` más reciente. */
  function elegirApunte(a, b) {
    if (!a) return b;
    if (!b) return a;
    return ms(b.traidoEl) > ms(a.traidoEl) ? b : a;
  }

  /* `origen`: { via, fechaOriginal, nombreOriginal, subidoPor, marca? }. La `marca` se calcula aquí si no viene:
     la fecha de la copia recién escrita (CSV) o el `generado` (ALUMNADO-BD.json). */
  async function apuntar(nombre, origen) {
    try {
      if (window.SoloConsulta && SoloConsulta.activo()) return;
      var g = gestor(), d = datos();
      if (!g || !d || !nombre || !origen) return;
      var marca = origen.marca;
      if (marca === undefined) marca = await Carpetas.fechaFichero(d, nombre);
      var ap = {
        via: origen.via || '', fechaOriginal: origen.fechaOriginal ? new Date(ms(origen.fechaOriginal)).toISOString() : '',
        nombreOriginal: origen.nombreOriginal || '', traidoEl: new Date().toISOString(),
        traidoPor: (window.App && App.E && App.E.usuario) || '', marca: marca, subidoPor: origen.subidoPor || ''
      };
      await ColaGuardado.poner(FICHERO, async function () {
        var actual = await leerApuntes(true);
        actual.ficheros[nombre] = elegirApunte(actual.ficheros[nombre], ap);
        actual._esquema = ESQUEMA;
        await Copias.guardar(g, FICHERO, actual);
        enMemoria = actual; leidoEn = Date.now();
      });
      olvidarMirada();
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('No he podido apuntar por dónde ha llegado ' + nombre, e);
    }
  }

  /* Dos copias de datos-origen.json (conflicto de Dropbox): cada fichero se queda con el apunte más reciente. */
  async function fusionarConflicto(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, FICHERO);
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || typeof conflicto.ficheros !== 'object') return false;
    var fusion = Object.assign({}, real || {}, { _esquema: ESQUEMA, ficheros: {} });
    var A = (real && real.ficheros) || {}, B = conflicto.ficheros || {};
    Object.keys(Object.assign({}, A, B)).forEach(function (k) { fusion.ficheros[k] = elegirApunte(A[k], B[k]); });
    var I = window.Conflictos && Conflictos._interno;
    if (I && I.conservarEsquemaMayor) I.conservarEsquemaMayor(fusion, real, conflicto);
    await App.enFila(FICHERO, function () { return Copias.guardar(g, FICHERO, fusion); });
    if (I && I.archivarConflicto) await I.archivarConflicto(g, nombreConflicto);
    enMemoria = null;
    return true;
  }

  /* ---------- qué hay ---------- */

  function tituloPersonal(curso) { return 'Personal' + (curso ? ' ' + curso : ''); }

  /* ¿Sigue valiendo el apunte? Para los CSV, la fecha del fichero coincide (con dos segundos de margen) con la marca. */
  function vale(ap, modificado, generado) {
    if (!ap) return false;
    if (generado !== undefined) return String(ap.marca) === String(generado);
    return !!ap.marca && Math.abs(ms(ap.marca) - modificado) <= MARGEN_MS;
  }

  function entrada(base, ap, modificado, generado) {
    var v = vale(ap, modificado, generado);
    base.hay = true;
    base.fecha = v && ap.fechaOriginal ? ap.fechaOriginal : (generado !== undefined ? generado : (modificado ? new Date(modificado).toISOString() : ''));
    base.fechaEsDeLaCopia = !(v && ap.fechaOriginal) && generado === undefined;
    base.via = v ? ap.via : '';
    base.traidoEl = v ? ap.traidoEl : '';
    base.traidoPor = v ? ap.traidoPor : '';
    base.subidoPor = v ? (ap.subidoPor || '') : '';
    return base;
  }

  async function estado() {
    var d = datos();
    var lista = [];
    if (!d) return lista;
    var apuntes = await leerApuntes();
    var F = apuntes.ficheros;
    var cargado = null;
    try { cargado = await Datos.cargar(d, 'ALUMNADO'); } catch (e) { cargado = null; }

    /* 1. Alumnado de Séneca */
    var reg = { id: 'alumnado', clave: 'alumnado', titulo: 'Alumnado de Séneca', nombre: 'RegAlum.csv', hay: false, cuantos: '' };
    var modReg = await Carpetas.fechaFichero(d, 'RegAlum.csv');
    if (modReg) {
      entrada(reg, F['RegAlum.csv'], modReg);
      var delRegAlum = ((cargado && cargado.lista) || []).filter(function (p) { return !p.solicitante; });
      var matriculados = delRegAlum.filter(function (p) { return p.matriculado; }).length;
      reg.alumnos = delRegAlum.length;
      reg.matriculados = matriculados;
      reg.cuantos = delRegAlum.length ? num(delRegAlum.length) + (delRegAlum.length === 1 ? ' alumno, ' : ' alumnos, ') + num(matriculados) + (matriculados === 1 ? ' matriculado' : ' matriculados') : '';
    }
    lista.push(reg);

    /* 2. Alumnado de la base de datos */
    var bd = { id: 'alumnado-bd', clave: 'alumnado-bd', titulo: 'Alumnado de la base de datos', nombre: BD, hay: false, cuantos: '' };
    var copia = window.AlumnadoBD ? await AlumnadoBD.leer() : null;
    if (copia) {
      entrada(bd, F[BD], 0, copia.generado);
      bd.cuantos = num(copia.alumnos.length) + (copia.alumnos.length === 1 ? ' alumno y ' : ' alumnos y ') + num(copia.campos.length) + (copia.campos.length === 1 ? ' dato' : ' datos');
    }
    lista.push(bd);

    /* 3. Personal: uno por fichero, los del curso actual primero */
    var personal = null;
    try { personal = await Datos.cargar(d, 'PERSONAL'); } catch (e) { personal = null; }
    var curso = U.cursoActual();
    var ficheros = ((personal && personal.ficheros) || []).slice();
    var ps = [];
    for (var i = 0; i < ficheros.length; i++) {
      var f = ficheros[i];
      var mod = await Carpetas.fechaFichero(d, f.fichero);
      var p = { id: 'personal:' + f.fichero, clave: 'personal', titulo: tituloPersonal(f.curso), nombre: f.fichero, hay: true,
        curso: f.curso, anterior: !!f.curso && f.curso !== curso, cuantos: num(f.filas) + (f.filas === 1 ? ' persona' : ' personas') };
      ps.push(entrada(p, F[f.fichero], mod));
    }
    ps.sort(function (a, b) { return (a.anterior ? 1 : 0) - (b.anterior ? 1 : 0); });
    if (!ps.length) ps.push({ id: 'personal', clave: 'personal', titulo: 'Personal', nombre: 'RelPerCen…csv', hay: false, cuantos: '' });
    return lista.concat(ps);
  }

  /* La frase de «Por dónde llegó» de la tabla. */
  function porDondeLlego(f) {
    if (f.via === 'a-mano') return 'A mano.' + (f.traidoPor ? ' Lo trajo ' + f.traidoPor : ' Lo trajeron') + (f.traidoEl ? ' el ' + fechaHora(f.traidoEl) : '') + '.';
    if (f.via === 'centro-de-datos') {
      if (f.subidoPor === 'centro-de-datos-ies') return 'Del Centro de datos. Lo hace el propio Centro de datos.';
      var quien = String(f.subidoPor || '').split('@')[0];
      return 'Del Centro de datos.' + (quien ? ' Lo subió ' + quien + '.' : '');
    }
    if (f.via === 'carpeta-bd') return 'De la carpeta de la base de datos de alumnado.';
    if (f.via === 'recogido') return 'Recogido de la carpeta de asuntos, donde estaba suelto.';
    return 'No se sabe por dónde llegó.';
  }

  /* La misma idea en una frase corta, para Ajustes: «Llegó del Centro de datos.» */
  function viaCorta(f) {
    if (f.via === 'a-mano') return 'Llegó a mano.';
    if (f.via === 'centro-de-datos') return 'Llegó del Centro de datos.';
    if (f.via === 'carpeta-bd') return 'Llegó de la carpeta de la base de datos de alumnado.';
    if (f.via === 'recogido') return 'Lo recogí de la carpeta de asuntos.';
    return '';
  }

  /* ---------- ¿hay otro más nuevo? ---------- */

  var NOMBRE_CENTRO = 'Centro de datos', NOMBRE_BD = 'carpeta de la base de datos de alumnado';
  var CLAVES_QUE_CUENTAN = ['alumnado', 'personal', 'alumnado-bd'];

  /* Lo del Centro de datos, una sola vez para todas las filas. */
  async function mirarCentro() {
    var C = window.CentroDeDatos;
    var no = { donde: NOMBRE_CENTRO };
    if (!C) return Object.assign(no, { estado: 'sin-carpeta' });
    var dir = await C.carpeta();
    if (!dir) return Object.assign(no, { estado: 'sin-carpeta' });
    if (!(await C.permiso(dir, false))) return Object.assign(no, { estado: 'sin-permiso', id: 'centro-de-datos' });
    var r = await C.leerIndice(dir);
    if (!r.ok) return Object.assign(no, { estado: 'no-se-puede', frase: 'El índice del Centro de datos no se puede leer.' });
    if ((r.indice.contrato || 1) > C.CONTRATO) return Object.assign(no, { estado: 'no-se-puede', frase: 'El Centro de datos es más nuevo que esta aplicación.', ambar: true });
    if (r.indice.ocupado) return Object.assign(no, { estado: 'no-se-puede', frase: C.RECOLOCANDO, ambar: true });
    var elegido = C.elegir(r.indice);
    var pend = (await C.pendientes(r.indice, await C.leerApuntes(true), true)).filter(function (e) { return CLAVES_QUE_CUENTAN.indexOf(e.clave) !== -1; });
    return Object.assign(no, { estado: 'ok', pendientes: pend, elegidas: elegido.lista, avisos: elegido.avisos });
  }

  async function mirarCarpetaBD() {
    var no = { donde: NOMBRE_BD };
    if (!window.AlumnadoBD || !AlumnadoBD.mirarCarpeta) return Object.assign(no, { estado: 'sin-carpeta' });
    var r = await AlumnadoBD.mirarCarpeta();
    if (r.sinCarpeta) return Object.assign(no, { estado: 'sin-carpeta' });
    if (r.sinPermiso) return Object.assign(no, { estado: 'sin-permiso', id: 'alumnado' });
    return Object.assign(no, { estado: 'ok', carpeta: r });
  }

  /* Qué entradas pendientes del Centro de datos son de cada fila. Las de personal van a la fila que tiene su nombre de
     fichero; si ninguna lo tiene (el fichero aún no existe), a la primera de personal que no sea de un curso anterior. */
  function repartir(filas, c) {
    var por = {};
    if (c.estado !== 'ok') return por;
    var R = window.CentroDeDatosReparto;
    var personal = filas.filter(function (f) { return f.clave === 'personal'; });
    var primera = personal.filter(function (f) { return !f.anterior; })[0] || personal[0];
    c.pendientes.forEach(function (e) {
      var fila = null;
      if (e.clave === 'personal') {
        var nombre = R.nombreDePersonal(e, c.elegidas);
        fila = personal.filter(function (f) { return f.hay && f.nombre === nombre; })[0] || primera;
      } else fila = filas.filter(function (f) { return f.clave === e.clave; })[0];
      if (fila) (por[fila.id] = por[fila.id] || []).push(e);
    });
    return por;
  }

  /* Lo que dice el Centro de datos de ESTA fila. */
  function delCentro(fila, c, suyos) {
    if (c.estado !== 'ok') return { estado: c.estado, id: c.id, frase: c.frase, ambar: c.ambar, donde: c.donde };
    if (suyos && suyos.length) {
      var e = suyos.slice().sort(function (x, y) { return ms(y.subido) - ms(x.subido); })[0];
      return { estado: 'mas-nuevo', donde: c.donde, fecha: e.subido };
    }
    var aviso = c.avisos && c.avisos.filter(function (a) { return fila.clave === 'alumnado' ? /listado de alumnado\./.test(a) : (fila.clave === 'alumnado-bd' && /base de datos/.test(a)); })[0];
    if (aviso) return { estado: 'no-se-puede', donde: c.donde, frase: 'En el Centro de datos hay más de un listado de este fichero: no he traído ninguno.', ambar: true };
    return { estado: 'al-dia', donde: c.donde };
  }

  function delBD(fila, b) {
    if (b.estado !== 'ok') return { estado: b.estado, id: b.id, donde: b.donde };
    var r = b.carpeta, copia = window.AlumnadoBD ? AlumnadoBD.enMemoria() : null;
    if (!r.hay) return { estado: 'al-dia', donde: b.donde };
    var nuevo = ms(r.generado) > ms(copia && copia.generado);
    if (!r.valido) return nuevo || !copia ? { estado: 'mas-nuevo', donde: b.donde, fecha: r.generado, motivo: r.motivo } : { estado: 'al-dia', donde: b.donde };
    if (!copia || nuevo) return { estado: 'mas-nuevo', donde: b.donde, fecha: r.generado };
    return { estado: 'al-dia', donde: b.donde };
  }

  var PRIORIDAD = ['mas-nuevo', 'sin-permiso', 'no-se-puede', 'al-dia', 'sin-carpeta'];

  function combinar(partes) {
    var al = partes.filter(function (p) { return p.estado === 'al-dia'; });
    var mejor = null;
    PRIORIDAD.forEach(function (e) { if (!mejor) mejor = partes.filter(function (p) { return p.estado === e; })[0] || null; });
    if (!mejor) return { estado: 'sin-carpeta' };
    if (mejor.estado === 'al-dia') return { estado: 'al-dia', mirado: al.map(function (p) { return p.donde; }) };
    return mejor;
  }

  var memoria = null, memoriaDe = 0, mirando = null;

  function olvidarMirada() { memoria = null; memoriaDe = 0; }

  /* { <id de la fila>: resultado }. Con `fresco` no usa lo guardado. */
  async function mirarSiHayMasNuevo(fresco) {
    if (!fresco && memoria && Date.now() - memoriaDe < 60000) return memoria;
    if (mirando) {
      var enMarcha = mirando;
      try { await enMarcha; } catch (e) { /* se vuelve a mirar */ }
      if (!fresco) return memoria || {};
      if (mirando) return mirando;   /* otra pidió lo mismo mientras tanto */
    }
    mirando = (async function () {
      var salida = {};
      try {
        var filas = await estado();
        var c = await mirarCentro();
        var b = filas.some(function (f) { return f.clave === 'alumnado-bd'; }) ? await mirarCarpetaBD() : null;
        var repartido = repartir(filas, c);
        filas.forEach(function (f) {
          var partes = [delCentro(f, c, repartido[f.id])];
          if (f.clave === 'alumnado-bd' && b) partes.push(delBD(f, b));
          salida[f.id] = combinar(partes);
        });
      } catch (e) { salida = {}; }
      memoria = salida; memoriaDe = Date.now();
      return salida;
    })();
    try { return await mirando; } finally { mirando = null; }
  }

  function enMemoriaLaMirada() { return memoria; }

  return {
    FICHERO: FICHERO, apuntar: apuntar, estado: estado, mirarSiHayMasNuevo: mirarSiHayMasNuevo, olvidarMirada: olvidarMirada,
    enMemoriaLaMirada: enMemoriaLaMirada, leerApuntes: leerApuntes, fusionarConflicto: fusionarConflicto, fechaHora: fechaHora, porDondeLlego: porDondeLlego, viaCorta: viaCorta,
    _elegirApunte: elegirApunte, _vale: vale
  };
})();
window.DatosQueTengo = DatosQueTengo;
