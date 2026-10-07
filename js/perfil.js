/* ============================================================
   perfil.js — quién es cada nombre de la lista de entrada y qué ve
   (7-oct-2026, fila 287, docs/PERFIL-DIRECTIVO.md).

   Cuatro perfiles: ADMIN (Administración, el de siempre; un nombre que no
   está en `_GESTOR/perfiles.json` es ADMIN), DIRECCION, SECRETARIA y
   JEFATURA (los de `TiposOrgano.ORGANOS`). Un directivo (perfil distinto de
   ADMIN) entra a mirar sus asuntos, no a tramitar: su sesión va
   protegida como «solo consultar» (`SoloConsulta.activo()` también es verdad
   para él) y ve solo Inicio y Archivo con los asuntos de su órgano.

   Esto ordena la pantalla; no es un cierre: las carpetas siguen en el Dropbox
   de cada uno. Ningún texto debe decir ni dar a entender que protege o impide
   el acceso.

   `Perfil.escribir(fn)` es la única puerta para escribir de un directivo (la
   estrenan las filas 289 y 290): pasa a `fn` las carpetas SIN envolver, solo
   mientras dura `fn`, sin levantar la protección general.
   ============================================================ */
var Perfil = (function () {

  var FICHERO = 'perfiles.json';
  var ADMIN = 'ADMIN';
  var PERFILES = [
    { valor: ADMIN, texto: 'Administración' },
    { valor: 'DIRECCION', texto: 'Dirección' },
    { valor: 'SECRETARIA', texto: 'Secretaría' },
    { valor: 'JEFATURA', texto: 'Jefatura de Estudios' }
  ];

  var datos = { perfiles: {} };
  var usuario = '';

  function valido(v) { return PERFILES.some(function (p) { return p.valor === v; }) ? v : ADMIN; }

  /* PURA: el contenido del fichero, con la forma de siempre. */
  function normalizar(leido) {
    var salida = { perfiles: {} };
    var origen = (leido && typeof leido.perfiles === 'object' && leido.perfiles) || {};
    Object.keys(origen).forEach(function (n) {
      var e = origen[n] || {};
      salida.perfiles[n] = { perfil: valido(e.perfil), correo: String(e.correo || '') };
    });
    if (leido && Number(leido._esquema) > 0) salida._esquema = Number(leido._esquema);
    return salida;
  }

  function perfilDe(nombre) { var e = datos.perfiles[nombre]; return e ? valido(e.perfil) : ADMIN; }
  function textoDe(valor) { var p = PERFILES.filter(function (x) { return x.valor === valor; })[0]; return p ? p.texto : ''; }

  /* Lo primero al entrar, ANTES de proteger las carpetas: lee `perfiles.json` sin crear nada. Si no se puede
     leer (no existe todavía, o sin permiso), el nombre es de Administración. */
  async function leerAntes(abiertos, nombre) {
    usuario = String(nombre || '').trim();
    datos = { perfiles: {} };
    try {
      if (!(await Carpetas.permiso(abiertos, true))) return;
      var g = await abiertos.getDirectoryHandle('_GESTOR');
      var f = await g.getFileHandle(FICHERO);
      datos = normalizar(JSON.parse(await (await f.getFile()).text()));
    } catch (e) { datos = { perfiles: {} }; }
  }

  /* Ya dentro: al día con el disco (para Ajustes). */
  async function cargar() {
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g) return datos;
    var leido = null;
    try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { leido = null; }
    datos = normalizar(leido);
    return datos;
  }

  function usuarioActual() { return usuario; }
  function esDirectivo() { return !!usuario && perfilDe(usuario) !== ADMIN; }
  function organo() { return esDirectivo() ? perfilDe(usuario) : ''; }
  function correoDe(n) { var e = datos.perfiles[n]; return e ? e.correo : ''; }
  function correo() { return correoDe(usuario); }
  function textoDeEntrada() { return 'Entras como ' + textoDe(organo()) + '. Ves los asuntos de tu órgano.'; }

  /* ¿Lo ve quien entra? Administración, todo; un directivo, los de su órgano y los que nacieron de un encargo suyo.
     Los tipos de «Varios» o sin asignar no entran, salvo por un encargo. */
  function veAsunto(a) {
    if (!esDirectivo()) return true;
    var o = window.TiposOrgano && window.App && App.tipoDeAsunto ? TiposOrgano.deNombre(App.tipoDeAsunto(a)) : '';
    if (o && o === organo()) return true;
    var enc = a && a.ficha && a.ficha.encargos;
    return Array.isArray(enc) && enc.some(function (e) { return e && e.de === usuario; });
  }

  /* ---------- guardar (solo Administración, desde Ajustes) ---------- */

  async function guardar(nombre, cambios) {
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g) return;
    var hacer = async function () {
      var leido = null;
      try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { leido = null; }
      var actual = normalizar(leido);
      var e = actual.perfiles[nombre] || { perfil: ADMIN, correo: '' };
      if ('perfil' in cambios) e.perfil = valido(cambios.perfil);
      if ('correo' in cambios) e.correo = String(cambios.correo || '').trim();
      if (e.perfil === ADMIN && !e.correo) delete actual.perfiles[nombre]; else actual.perfiles[nombre] = e;
      await Copias.guardar(g, FICHERO, actual);
      datos = actual;
    };
    return window.ColaGuardado ? ColaGuardado.poner(FICHERO, hacer) : hacer();
  }

  /* «2 de Administración · 3 directivos» */
  function resumen(nombres) {
    var admin = 0, dir = 0;
    (nombres || []).forEach(function (n) { if (perfilDe(n) === ADMIN) admin++; else dir++; });
    return admin + ' de Administración · ' + dir + (dir === 1 ? ' directivo' : ' directivos');
  }

  /* ---------- la puerta para escribir ---------- */

  async function escribir(fn) {
    var crudo = window.SoloConsulta && SoloConsulta.crudo ? SoloConsulta.crudo : function (x) { return x; };
    return fn(crudo(App.E.gestor), crudo(App.E.abiertos), crudo(App.E.archivo));
  }

  /* ---------- un conflicto de Dropbox en perfiles.json: se funde por nombre ---------- */

  async function fusionarConflicto(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, FICHERO);
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || typeof conflicto.perfiles !== 'object') return false;
    var a = normalizar(real), b = normalizar(conflicto);
    var fusion = { perfiles: Object.assign({}, b.perfiles, a.perfiles) };   /* si los dos cambian el mismo nombre, gana el fichero real */
    var I = window.Conflictos && Conflictos._interno;
    if (I && I.conservarEsquemaMayor) I.conservarEsquemaMayor(fusion, real, conflicto);
    await Copias.guardar(g, FICHERO, fusion);
    if (I && I.archivarConflicto) await I.archivarConflicto(g, nombreConflicto);
    return true;
  }

  /* Para la copia de pruebas: entrar otra vez con otro nombre. */
  function _reiniciar() { datos = { perfiles: {} }; usuario = ''; }

  return {
    FICHERO: FICHERO, PERFILES: PERFILES, ADMIN: ADMIN,
    leerAntes: leerAntes, cargar: cargar, usuarioActual: usuarioActual, esDirectivo: esDirectivo, organo: organo, correo: correo, correoDe: correoDe,
    veAsunto: veAsunto, guardar: guardar, escribir: escribir, perfilDe: perfilDe, textoDe: textoDe, resumen: resumen,
    textoDeEntrada: textoDeEntrada, fusionarConflicto: fusionarConflicto,
    _normalizar: normalizar, _reiniciar: _reiniciar
  };
})();
window.Perfil = Perfil;
