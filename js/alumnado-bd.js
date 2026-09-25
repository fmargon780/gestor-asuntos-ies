/* ============================================================
   alumnado-bd.js — el alumnado de la base de datos de alumnado, desde
   la carpeta de Drive (fila 144, 25-sep-2026,
   docs/ALUMNADO-BD-DESDE-DRIVE.md; el acuerdo entre las dos
   aplicaciones, versión 2, en docs/ACUERDO-ALUMNADO.md). Sustituye el
   camino por dirección web de la fila 142: aquí no hay `fetch`, ni
   dirección, ni clave.

   - La carpeta: la «Datos de matrícula» que Google Drive para ordenador
     enseña en el ordenador. Se señala en Ajustes › El centro › «Carpeta
     de la base de datos de alumnado» y se recuerda en este ordenador
     (Almacen, `alumnado-bd-carpeta`), como las del Dropbox.
   - Traer: al entrar y con «Traer el alumnado ahora» (Mantenimiento).
     Si la carpeta está señalada y su `ALUMNADO-BD.json` es más nuevo
     (`generado`) que la copia, se valida y se copia a
     `_GESTOR/datos/ALUMNADO-BD.json` por ColaGuardado. Sin carpeta (el
     compañero), la copia tal cual. Si no vale, la copia y ámbar.
   - Todo genérico, guiado por `campos`: ningún dato con nombre propio,
     salvo `idEscolar` y `matriculado`. La copia se lee una vez y queda
     en memoria.
   - Unir (lo llama js/datos-alumnado.js): el RegAlum sigue siendo la
     base; el archivo suma datos por Nº escolar y, si no es más viejo
     que el RegAlum, manda en `matriculado` y en las columnas del RegAlum
     que se llamen igual que una `etiqueta`.
   - Lo que se ve (tarjetas por apartado, huecos, grupos), en
     js/alumnado-bd-ver.js.
   ============================================================ */
var AlumnadoBD = (function () {

  var FICHERO = 'ALUMNADO-BD.json';
  var ACUERDO = 2;
  var CLAVE_CARPETA = 'alumnado-bd-carpeta';
  var memoria = null;       /* la copia válida, leída una vez: { datos } o { datos: null } */
  var avisadoFallo = false;

  function $(id) { return document.getElementById(id); }

  /* ---------- validar (puro) ---------- */

  function validar(datos) {
    if (!datos || typeof datos !== 'object') return { ok: false, motivo: 'no es un archivo de la base de datos de alumnado' };
    if (datos.acuerdo !== ACUERDO) return { ok: false, motivo: 'viene con el acuerdo ' + datos.acuerdo + ', y este gestor conoce el ' + ACUERDO };
    if (!Array.isArray(datos.campos)) return { ok: false, motivo: 'no trae la lista de campos' };
    if (!Array.isArray(datos.alumnos)) return { ok: false, motivo: 'no trae la lista de alumnos' };
    var sinId = datos.alumnos.filter(function (a) { return !a || !String(a.idEscolar || '').trim(); }).length;
    if (sinId) return { ok: false, motivo: sinId + (sinId === 1 ? ' alumno viene' : ' alumnos vienen') + ' sin Nº de identificación escolar' };
    return { ok: true };
  }

  function fecha(iso) {
    var f = new Date(iso || '');
    return isNaN(f.getTime()) ? null : f;
  }

  function fechaLegible(iso) {
    var s = String(iso || '').slice(0, 10).split('-');
    return s.length === 3 ? s[2] + '-' + s[1] + '-' + s[0] : '';
  }

  /* ---------- la copia del Dropbox, en memoria ---------- */

  async function leer() {
    if (memoria) return memoria.datos;
    var dir = App.E && App.E.datos;
    if (!dir) return null;
    var datos = null;
    try { datos = await Carpetas.leerJson(dir, FICHERO); } catch (e) { datos = null; }
    memoria = { datos: datos && validar(datos).ok ? datos : null };
    return memoria.datos;
  }

  /* Lo que ya esté en memoria, sin leer (para lo que no puede esperar). */
  function enMemoria() { return memoria ? memoria.datos : null; }

  function olvidar() {
    memoria = null;
    if (window.Datos && Datos.olvidar) Datos.olvidar('ALUMNADO');
    if (window.TablasDatos && TablasDatos.olvidar) TablasDatos.olvidar();
  }

  async function guardar(datos) {
    var dir = App.E.datos;
    if (!dir) throw new Error('No está señalada la carpeta de datos.');
    var hacer = function () { return Carpetas.escribirTexto(dir, FICHERO, JSON.stringify(datos)); };
    await (window.ColaGuardado ? ColaGuardado.poner(FICHERO, hacer) : hacer());
    olvidar();
    memoria = { datos: datos };
  }

  /* ---------- la carpeta de Drive (de este ordenador) ---------- */

  async function carpeta() {
    try { return (await Almacen.leer(CLAVE_CARPETA)) || null; } catch (e) { return null; }
  }

  async function permiso(dir, pedir) {
    var op = { mode: 'read' };
    try {
      if ((await dir.queryPermission(op)) === 'granted') return true;
      if (!pedir) return false;
      return (await dir.requestPermission(op)) === 'granted';
    } catch (e) { return false; }
  }

  async function senalarCarpeta() {
    try {
      var h = await window.showDirectoryPicker({ id: 'gestor-alumnado-bd', mode: 'read' });
      await Almacen.guardar(CLAVE_CARPETA, h);
      pintarAjustes();
      U.aviso('Carpeta de la base de datos de alumnado señalada: ' + h.name, 'bueno');
      await traer(false, true);
      pintarCopia();
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      U.fallo('No he podido usar esa carpeta', e);
    }
  }

  async function olvidarCarpeta() {
    try { await Almacen.guardar(CLAVE_CARPETA, null); } catch (e) { /* nada */ }
    pintarAjustes();
  }

  /* ---------- traer ---------- */

  /* Devuelve { ok, copiado, cuantos, generado } o { ok: false, motivo }.
     `avisar`: avisos verdes (el botón). `pedir`: puede pedir permiso
     (solo tras un clic). */
  async function traer(avisar, pedir) {
    var dir = await carpeta();
    if (!dir) return { ok: false, motivo: 'sin carpeta' };
    if (!(await permiso(dir, pedir))) return { ok: false, motivo: 'sin permiso' };
    try {
      var nuevo = await Carpetas.leerJson(dir, FICHERO);
      if (!nuevo) throw new Error('no encuentro ' + FICHERO + ' en la carpeta ' + dir.name);
      var v = validar(nuevo);
      if (!v.ok) throw new Error('el archivo no vale: ' + v.motivo);
      var copia = await leer();
      var fn = fecha(nuevo.generado), fc = copia && fecha(copia.generado);
      if (copia && fc && fn && fn <= fc) {
        if (avisar) U.aviso('El alumnado ya estaba al día (datos del ' + fechaLegible(copia.generado) + ').', 'bueno');
        return { ok: true, copiado: false, cuantos: copia.alumnos.length, generado: copia.generado };
      }
      await guardar(nuevo);
      if (avisar) U.aviso('Alumnado traído: ' + nuevo.alumnos.length + ' alumnos, datos del ' + fechaLegible(nuevo.generado) + '.', 'bueno');
      return { ok: true, copiado: true, cuantos: nuevo.alumnos.length, generado: nuevo.generado };
    } catch (e) {
      if (!avisadoFallo || avisar) {
        avisadoFallo = true;
        U.accesorio('No he podido traer el alumnado de la base de datos; sigo con la última copia', e);
      }
      return { ok: false, motivo: U.mensajeDeError(e) };
    }
  }

  /* La fila 142 guardaba una dirección en asuntos.json: fuera. */
  function quitarDireccionVieja() {
    var r = App.E.registro;
    if (!r || !r.ajustesAlumnadoBD) return;
    Promise.resolve(App.guardarRegistroFresco(function (registro) { delete registro.ajustesAlumnadoBD; })).catch(function () {});
  }

  var yaMirado = false;
  function alEntrar() {
    if (yaMirado || !App.E || !App.E.datos || !App.E.registro) return;
    yaMirado = true;
    quitarDireccionVieja();
    setTimeout(async function () {
      await leer();
      var r = await traer(false, false);
      if (r.copiado) pintarCopia();
    }, 1500);
  }

  /* ---------- unir con el RegAlum (lo llama js/datos-alumnado.js) ---------- */

  function porClave(datos) {
    var m = {};
    ((datos && datos.campos) || []).forEach(function (c) { if (c && c.clave) m[c.clave] = c; });
    return m;
  }

  /* `lista` y `porId` de js/datos-alumnado.js; `fechaRegAlum`, la del
     RegAlum (o null). Devuelve { generado, unidos, cuantos, manda } o null. */
  async function unir(lista, porId, fechaRegAlum) {
    var datos = await leer();
    if (!datos) return null;
    var fg = fecha(datos.generado);
    var manda = !fechaRegAlum || isNaN(fechaRegAlum.getTime()) || !fg || fg >= fechaRegAlum;
    var campos = porClave(datos);
    var unidos = 0;
    datos.alumnos.forEach(function (a) {
      var p = porId && porId[String(a.idEscolar).trim()];
      if (!p) return;
      unidos++;
      p.bd = a.datos || {};
      p.bdGenerado = datos.generado || '';
      if (manda && typeof a.matriculado === 'boolean' && a.matriculado !== p.matriculado) {
        p.matriculado = a.matriculado;
        if (!a.matriculado) { p.unidad = ''; p.curso = ''; }
      }
      /* Las columnas del RegAlum que se llaman igual que un dato. */
      var columnas = {};
      Object.keys(p.campos || {}).forEach(function (k) { columnas[U.normalizar(k)] = k; });
      Object.keys(p.bd).forEach(function (clave) {
        var c = campos[clave], v = p.bd[clave];
        if (!c || v === null || v === undefined || typeof v === 'object') return;
        var col = columnas[U.normalizar(c.etiqueta || '')];
        if (col && (manda || !p.campos[col])) p.campos[col] = String(v);
      });
    });
    return { generado: datos.generado || '', unidos: unidos, cuantos: datos.alumnos.length, manda: manda };
  }

  /* La fecha `generado`, para el aviso de frescura. */
  async function fechaGenerado() {
    var d = await leer();
    return d ? fecha(d.generado) : null;
  }

  /* ---------- Ajustes ---------- */

  function bloque(id, titulo, pie, cuerpo) {
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = id;
    det.innerHTML = '<summary><span class="bloque-titulo">' + titulo + '</span><span class="bloque-pie">' + pie + '</span></summary>' +
      '<div class="bloque-cuerpo">' + cuerpo + '</div>';
    return det;
  }

  async function pintarAjustes() {
    var centro = $('ajustes-tab-centro');
    if (centro && !$('bloque-alumnado-bd')) {
      var det = bloque('bloque-alumnado-bd', 'Carpeta de la base de datos de alumnado', 'De dónde sale el alumnado de la base de datos, en este ordenador',
        '<p class="explica">Señala la carpeta «Datos de matrícula» de Google Drive para ordenador, la que tiene ' +
        '<code>' + FICHERO + '</code>. Es de este ordenador, como las del Dropbox: el otro usa la copia.</p>' +
        '<p class="explica" id="alumnado-bd-carpeta"></p>' +
        '<div class="alta-tipo"><button type="button" class="boton" id="alumnado-bd-senalar">Señalar la carpeta</button>' +
        '<button type="button" class="boton" id="alumnado-bd-olvidar">Olvidarla</button></div>' +
        '<p class="explica alumnado-bd-copia"></p>');
      var datosCaja = $('estado-datos');
      var ancla = datosCaja && datosCaja.closest('details');
      if (ancla && ancla.parentNode === centro) centro.insertBefore(det, ancla.nextSibling); else centro.appendChild(det);
      $('alumnado-bd-senalar').onclick = senalarCarpeta;
      $('alumnado-bd-olvidar').onclick = olvidarCarpeta;
    }
    var mant = $('ajustes-tab-mantenimiento');
    if (mant && !$('bloque-alumnado-bd-traer')) {
      mant.appendChild(bloque('bloque-alumnado-bd-traer', 'Traer el alumnado', 'De la carpeta de la base de datos de alumnado',
        '<p class="explica alumnado-bd-copia" id="alumnado-bd-copia"></p>' +
        '<button type="button" class="boton" id="alumnado-bd-traer">Traer el alumnado ahora</button>'));
      $('alumnado-bd-traer').onclick = function () {
        return U.mientrasGuarda($('alumnado-bd-traer'), async function () {
          if (!(await carpeta())) { U.aviso('Primero señala la carpeta en Ajustes › El centro › Carpeta de la base de datos de alumnado.', 'ambar'); return; }
          await traer(true, true);
          pintarCopia();
        });
      };
    }
    var p = $('alumnado-bd-carpeta');
    if (p) {
      var dir = await carpeta();
      p.textContent = dir ? 'Carpeta señalada: ' + dir.name + '.' : 'Sin carpeta señalada en este ordenador: se usa la copia del Dropbox.';
      var olv = $('alumnado-bd-olvidar');
      if (olv) olv.classList.toggle('oculto', !dir);
    }
    await pintarCopia();
  }

  async function pintarCopia() {
    var ps = document.querySelectorAll('.alumnado-bd-copia');
    if (!ps.length) return;
    var d = await leer();
    var texto = d ? 'Última copia: ' + d.alumnos.length + ' alumnos y ' + d.campos.length + ' datos, del ' + fechaLegible(d.generado) + '.'
      : 'Todavía no hay ninguna copia: el alumnado sale solo de RegAlum.csv.';
    Array.prototype.forEach.call(ps, function (x) { x.textContent = texto; });
  }

  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    FICHERO: FICHERO, ACUERDO: ACUERDO, CLAVE_CARPETA: CLAVE_CARPETA, validar: validar,
    leer: leer, enMemoria: enMemoria, olvidar: olvidar, guardar: guardar, carpeta: carpeta, traer: traer,
    unir: unir, porClave: porClave, fechaGenerado: fechaGenerado, fechaLegible: fechaLegible,
    pintarAjustes: pintarAjustes
  };
})();
window.AlumnadoBD = AlumnadoBD;
