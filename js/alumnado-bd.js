/* ============================================================
   alumnado-bd.js — el alumnado, desde la base de datos de alumnado
   (fila 142, 25-sep-2026, docs/ALUMNADO-DESDE-LA-BD.md; el acuerdo
   entre las dos aplicaciones, en docs/ACUERDO-ALUMNADO.md).

   La base de datos de alumnado (fmargon780/bd-alumnado-ies) limpia y
   cruza las listas de Séneca y ofrece el resultado en una dirección con
   clave (`…?k=`). Aquí:

   - La dirección, en los ajustes del centro (`asuntos.json`,
     `ajustesAlumnadoBD.url`), nunca en el navegador. Sin `?k=`, se
     rechaza sin llamar. Bloque «Base de datos de alumnado» en Ajustes ›
     El centro (junto a «Ficheros de datos»), con «Probar».
   - Traer: al entrar, una vez al día, y con «Traer el alumnado ahora»
     (Ajustes › Mantenimiento). Lo recibido, validado, va a
     `_GESTOR/datos/ALUMNADO-BD.json` por ColaGuardado. Si falla, se
     sigue con la última copia; ámbar solo si falla con la dirección
     puesta, y una sola vez por sesión.
   - Unir (lo llama js/datos-alumnado.js): con un fichero válido
     (`acuerdo: 1`, todos con `idEscolar`), sus datos mandan sobre los
     del RegAlum para cada alumno que traiga (por Nº escolar); lo que no
     traiga sigue saliendo del RegAlum. Sin fichero válido, todo como
     antes.
   - La tarjeta «Datos académicos» de la ficha del alumno, la tabla
     «ALUMNADO BD» para los huecos {{DATO ALUMNADO BD: <columna>}}
     (js/tablas-datos.js, unida por Nº escolar) y la fecha `generado`
     para el aviso de frescura (js/frescura.js).
   ============================================================ */
var AlumnadoBD = (function () {

  var FICHERO = 'ALUMNADO-BD.json';
  var ACUERDO = 1;
  var CLAVE_DIA = 'gestor-alumnado-bd-traido';
  var avisadoFallo = false;

  function $(id) { return document.getElementById(id); }

  /* ---------- la dirección ---------- */

  function direccion() {
    var a = (App.E.registro && App.E.registro.ajustesAlumnadoBD) || {};
    return String(a.url || '').trim();
  }

  function problemaDeDireccion(url) {
    if (!url) return 'Falta la dirección.';
    if (!/^https:\/\//i.test(url)) return 'La dirección tiene que empezar por https://.';
    if (!/[?&]k=[^&]+/.test(url)) return 'A la dirección le falta la clave (?k=…). Cópiala entera.';
    return '';
  }

  function guardarDireccion(url) {
    return App.guardarRegistroFresco(function (registro) {
      registro.ajustesAlumnadoBD = Object.assign({}, registro.ajustesAlumnadoBD || {}, { url: String(url || '').trim() });
    });
  }

  /* ---------- validar (puro) ---------- */

  function validar(datos) {
    if (!datos || typeof datos !== 'object') return { ok: false, motivo: 'no es un fichero de la base de datos de alumnado' };
    if (datos.acuerdo !== ACUERDO) return { ok: false, motivo: 'viene con el acuerdo ' + datos.acuerdo + ', y este gestor conoce el ' + ACUERDO };
    if (!Array.isArray(datos.alumnos)) return { ok: false, motivo: 'no trae la lista de alumnos' };
    var sinId = datos.alumnos.filter(function (a) { return !a || !String(a.idEscolar || '').trim(); }).length;
    if (sinId) return { ok: false, motivo: sinId + (sinId === 1 ? ' alumno viene' : ' alumnos vienen') + ' sin Nº de identificación escolar' };
    return { ok: true };
  }

  /* ---------- leer lo guardado ---------- */

  async function leer() {
    var dir = App.E && App.E.datos;
    if (!dir) return null;
    var datos = null;
    try { datos = await Carpetas.leerJson(dir, FICHERO); } catch (e) { return null; }
    if (!datos) return null;
    var v = validar(datos);
    return v.ok ? datos : null;
  }

  /* ---------- traer ---------- */

  async function pedir(url) {
    var r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('la dirección ha contestado ' + r.status);
    var texto = await r.text();
    var datos;
    try { datos = JSON.parse(texto); } catch (e) { throw new Error('la dirección no ha devuelto el alumnado (¿clave equivocada?)'); }
    if (datos && datos.error) throw new Error(String(datos.error));
    var v = validar(datos);
    if (!v.ok) throw new Error('el fichero no vale: ' + v.motivo);
    return datos;
  }

  async function guardar(datos) {
    var dir = App.E.datos;
    if (!dir) throw new Error('No está señalada la carpeta de datos.');
    var hacer = function () { return Carpetas.escribirTexto(dir, FICHERO, JSON.stringify(datos)); };
    await (window.ColaGuardado ? ColaGuardado.poner(FICHERO, hacer) : hacer());
    if (window.Datos && Datos.olvidar) Datos.olvidar('ALUMNADO');
    if (window.TablasDatos && TablasDatos.olvidar) TablasDatos.olvidar();
  }

  /* Devuelve { ok, cuantos, generado } o { ok: false, motivo }. `silencioso`:
     sin avisos verdes (la vuelta diaria). */
  async function traer(silencioso) {
    var url = direccion();
    if (!url) return { ok: false, motivo: 'sin dirección' };
    var problema = problemaDeDireccion(url);
    if (problema) return { ok: false, motivo: problema };
    try {
      var datos = await pedir(url);
      await guardar(datos);
      try { window.localStorage.setItem(CLAVE_DIA, U.hoyIso()); } catch (e) { /* no pasa nada */ }
      if (!silencioso) U.aviso('Alumnado traído: ' + datos.alumnos.length + ' alumnos, datos del ' + fechaLegible(datos.generado) + '.', 'bueno');
      return { ok: true, cuantos: datos.alumnos.length, generado: datos.generado };
    } catch (e) {
      if (!avisadoFallo || !silencioso) {
        avisadoFallo = true;
        U.accesorio('No he podido traer el alumnado de la base de datos; sigo con la última copia', e);
      }
      return { ok: false, motivo: U.mensajeDeError(e) };
    }
  }

  var yaMirado = false;
  function alEntrar() {
    if (yaMirado || !App.E || !App.E.datos || !App.E.registro) return;
    yaMirado = true;
    if (!direccion()) return;
    try { if (window.localStorage.getItem(CLAVE_DIA) === U.hoyIso()) return; } catch (e) { /* se trae igual */ }
    setTimeout(function () { traer(true); }, 1500);
  }

  function fechaLegible(iso) {
    var s = String(iso || '').slice(0, 10).split('-');
    return s.length === 3 ? s[2] + '-' + s[1] + '-' + s[0] : '';
  }

  /* ---------- unir con el RegAlum (lo llama js/datos-alumnado.js) ---------- */

  function nombreDe(a) {
    var ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
    return (ap ? ap + ', ' : '') + (a.nombre || '');
  }
  function ddmmaaaa(iso) { var s = String(iso || '').split('-'); return s.length === 3 ? s[2] + '/' + s[1] + '/' + s[0] : ''; }

  /* `lista` y `porId` de js/datos-alumnado.js. Devuelve { generado, unidos, nuevos } o null. */
  async function unir(lista, porId) {
    var datos = await leer();
    if (!datos) return null;
    var unidos = 0, nuevos = 0;
    datos.alumnos.forEach(function (a) {
      var id = String(a.idEscolar).trim();
      var p = porId && porId[id];
      if (!p) {
        p = { nombre: nombreDe(a), id: id, ano: 0, categoria: 'ALUMNADO', campos: {}, fechaNac: '',
              matriculado: false, unidad: '', curso: '', anoUltima: 0, unidadUltima: '', cursoUltima: '' };
        p.campos['Alumno/a'] = p.nombre;
        p.campos['Nº Id. Escolar'] = id;
        lista.push(p);
        if (porId) porId[id] = p;
        nuevos++;
      } else unidos++;
      /* Lo que traiga, manda. */
      if (a.apellido1 || a.nombre) p.nombre = nombreDe(a);
      if (typeof a.matriculado === 'boolean') p.matriculado = a.matriculado;
      if (a.matriculado && a.unidad) { p.unidad = a.unidad; p.curso = a.curso || p.curso; }
      if (!a.matriculado && typeof a.matriculado === 'boolean') { p.unidad = ''; p.curso = ''; }
      if (a.fechaNacimiento) p.fechaNac = ddmmaaaa(a.fechaNacimiento);
      if (a.documento) p.documento = a.documento;
      var c = a.contacto || {};
      if (c.telefono) p.campos['Teléfono'] = c.telefono;
      if (c.movil) p.campos['Teléfono móvil'] = c.movil;
      if (c.correo) p.campos['Correo electrónico personal alumno/a'] = c.correo;
      if (c.domicilio) p.campos['Dirección'] = c.domicilio;
      if (c.localidad) p.campos['Localidad'] = c.localidad;
      if (c.codigoPostal) p.campos['Código postal'] = c.codigoPostal;
      if (c.provincia) p.campos['Provincia'] = c.provincia;
      if (a.documento) p.campos['DNI/Pasaporte'] = a.documento;
      if (a.sexo) p.campos['Sexo'] = a.sexo;
      p.bd = a;
      p.bdGenerado = datos.generado || '';
      p.busca = U.normalizar(p.nombre + ' ' + id + ' ' + (p.documento || ''));
    });
    lista.sort(function (x, y) { return U.normalizar(x.nombre) < U.normalizar(y.nombre) ? -1 : 1; });
    return { generado: datos.generado || '', unidos: unidos, nuevos: nuevos, cuantos: datos.alumnos.length };
  }

  /* ---------- la tarjeta «Datos académicos» ---------- */

  function lista(l) { return (Array.isArray(l) && l.length) ? l.join(', ') : ''; }

  function filasAcademicas(p) {
    var a = p && p.bd;
    if (!a) return null;
    var ac = a.academico || {};
    return [
      { titulo: 'Unidad', valor: a.matriculado ? (a.unidad || '') : '' },
      { titulo: 'Repeticiones', valor: ac.repeticiones === null || ac.repeticiones === undefined ? '' : String(ac.repeticiones) },
      { titulo: 'PIL', valor: ac.pil === true ? 'Sí' : (ac.pil === false ? 'No' : '') },
      { titulo: 'Pendientes', valor: lista(ac.pendientes) },
      { titulo: 'Materias no superadas', valor: lista(ac.materiasNoSuperadas) },
      /* NEAE: solo «Sí» o nada (es dato de salud: sin detalle). */
      { titulo: 'NEAE', valor: ac.neae === true ? 'Sí' : '' }
    ].filter(function (f) { return f.valor; });
  }

  function tarjetaAcademica(p) {
    var filas = filasAcademicas(p);
    if (!filas) return null;
    var div = document.createElement('div');
    div.className = 'vt-tarjeta vt-tarjeta-academica';
    div.innerHTML = '<div class="vt-tarjeta-titulo"><span class="vt-icono">🎓</span>Datos académicos</div>' +
      (filas.length ? '<div class="ficha-datos">' + filas.map(function (f) {
        return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' + U.escapar(f.valor) + '</span></div>';
      }).join('') + '</div>' : '<p class="explica">Sin datos académicos.</p>') +
      '<p class="nota">Datos de la base de datos de alumnado del ' + U.escapar(fechaLegible(p.bdGenerado)) + '</p>';
    return div;
  }

  /* ---------- la tabla «ALUMNADO BD» para los huecos ---------- */

  var CABECERA = ['Nº Id. Escolar', 'Apellido 1', 'Apellido 2', 'Nombre', 'Sexo', 'Fecha de nacimiento', 'Documento',
    'Unidad', 'Curso', 'Enseñanza', 'Repeticiones', 'PIL', 'Pendientes', 'Materias no superadas', 'NEAE',
    'Teléfono', 'Móvil', 'Correo', 'Domicilio', 'Localidad', 'Código postal', 'Provincia'];

  function filaDeTabla(a) {
    var c = a.contacto || {}, ac = a.academico || {};
    var v = [a.idEscolar, a.apellido1, a.apellido2, a.nombre, a.sexo, ddmmaaaa(a.fechaNacimiento), a.documento,
      a.unidad, a.curso, a.ensenanza,
      ac.repeticiones === null || ac.repeticiones === undefined ? '' : String(ac.repeticiones),
      ac.pil === true ? 'Sí' : (ac.pil === false ? 'No' : ''), lista(ac.pendientes), lista(ac.materiasNoSuperadas),
      ac.neae === true ? 'Sí' : '', c.telefono, c.movil, c.correo, c.domicilio, c.localidad, c.codigoPostal, c.provincia];
    var celdas = {};
    CABECERA.forEach(function (k, i) { celdas[k] = v[i] === null || v[i] === undefined ? '' : String(v[i]); });
    return { celdas: celdas, idEscolar: String(a.idEscolar).trim(), clave: '' };
  }

  /* Añade la tabla a `salida.tablas` de TablasDatos.cargar. */
  async function comoTabla(salida) {
    var datos = await leer();
    if (!datos) return;
    salida.tablas['ALUMNADO BD'] = { nombre: 'ALUMNADO BD', ficheros: [FICHERO], cursos: [datos.cursoAcademico || ''].filter(Boolean),
      cabecera: CABECERA.slice(), filas: datos.alumnos.map(filaDeTabla) };
  }

  /* La fecha `generado`, para el aviso de frescura. */
  async function fechaGenerado() {
    var d = await leer();
    if (!d || !d.generado) return null;
    var f = new Date(d.generado);
    return isNaN(f.getTime()) ? null : f;
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
      var det = bloque('bloque-alumnado-bd', 'Base de datos de alumnado', 'La dirección de la base de datos de alumnado, con su clave',
        '<p class="explica">Pega aquí la dirección que da la base de datos de alumnado, entera (con su <code>?k=</code>). ' +
        'Es del centro: vale para los dos ordenadores.</p>' +
        '<div class="alta-tipo"><input class="campo" id="alumnado-bd-url" placeholder="https://script.google.com/…?k=…">' +
        '<button type="button" class="boton" id="alumnado-bd-guardar">Guardar</button>' +
        '<button type="button" class="boton" id="alumnado-bd-probar">Probar</button></div>' +
        '<p class="aviso-en-vivo" id="alumnado-bd-estado"></p>' +
        '<p class="explica alumnado-bd-copia"></p>');
      var datosCaja = $('estado-datos');
      var ancla = datosCaja && datosCaja.closest('details');
      if (ancla && ancla.parentNode === centro) centro.insertBefore(det, ancla.nextSibling); else centro.appendChild(det);
      $('alumnado-bd-guardar').onclick = async function () {
        var url = $('alumnado-bd-url').value.trim();
        var problema = url ? problemaDeDireccion(url) : '';
        if (problema) { estado(problema, 'malo'); return; }
        try { await guardarDireccion(url); estado(url ? 'Dirección guardada.' : 'Dirección quitada.', 'bueno'); }
        catch (e) { U.fallo('No he podido guardarla', e); }
      };
      $('alumnado-bd-probar').onclick = async function () {
        var url = $('alumnado-bd-url').value.trim();
        var problema = problemaDeDireccion(url);
        if (problema) { estado(problema, 'malo'); return; }
        estado('Probando…', '');
        try {
          var d = await pedir(url);
          estado('Funciona: trae ' + d.alumnos.length + ' alumnos, datos del ' + fechaLegible(d.generado) + '.', 'bueno');
        } catch (e) { estado('No funciona: ' + U.mensajeDeError(e), 'malo'); }
      };
    }
    var mant = $('ajustes-tab-mantenimiento');
    if (mant && !$('bloque-alumnado-bd-traer')) {
      mant.appendChild(bloque('bloque-alumnado-bd-traer', 'Traer el alumnado', 'De la base de datos de alumnado',
        '<p class="explica alumnado-bd-copia" id="alumnado-bd-copia"></p>' +
        '<button type="button" class="boton" id="alumnado-bd-traer">Traer el alumnado ahora</button>'));
      $('alumnado-bd-traer').onclick = function () {
        return U.mientrasGuarda($('alumnado-bd-traer'), async function () {
          if (!direccion()) { U.aviso('Primero pega la dirección en Ajustes › El centro › Base de datos de alumnado.', 'ambar'); return; }
          await traer(false);
          pintarCopia();
        });
      };
    }
    var campo = $('alumnado-bd-url');
    if (campo && document.activeElement !== campo) campo.value = direccion();
    pintarCopia();
  }

  function estado(texto, clase) {
    var e = $('alumnado-bd-estado');
    if (!e) return;
    e.className = 'aviso-en-vivo' + (clase === 'malo' ? ' aviso-en-vivo-malo' : '');
    e.textContent = texto;
  }

  async function pintarCopia() {
    var ps = document.querySelectorAll('.alumnado-bd-copia');
    if (!ps.length) return;
    var d = await leer();
    var texto = d ? 'Última copia: ' + d.alumnos.length + ' alumnos, datos del ' + fechaLegible(d.generado) + '.'
      : 'Todavía no hay ninguna copia: el alumnado sale de RegAlum.csv.';
    Array.prototype.forEach.call(ps, function (p) { p.textContent = texto; });
  }

  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    FICHERO: FICHERO, ACUERDO: ACUERDO, validar: validar, problemaDeDireccion: problemaDeDireccion,
    direccion: direccion, guardarDireccion: guardarDireccion, leer: leer, traer: traer, guardar: guardar,
    unir: unir, filasAcademicas: filasAcademicas, tarjetaAcademica: tarjetaAcademica,
    comoTabla: comoTabla, fechaGenerado: fechaGenerado, pintarAjustes: pintarAjustes
  };
})();
window.AlumnadoBD = AlumnadoBD;
