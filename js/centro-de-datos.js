/* ============================================================
   centro-de-datos.js — beber del Centro de datos (fila 312, 9-oct-2026,
   docs/BEBER-DEL-CENTRO-DE-DATOS.md).

   El Centro de datos es un proyecto aparte (`centro-de-datos-ies`): una
   página donde se suelta cada listado de Séneca una sola vez y una
   carpeta de Drive, «CENTRO DE DATOS», donde queda guardado con un
   `indice.json`. Aquí el gestor SOLO LEE esa carpeta y coge él solo lo
   nuevo, pasándolo por la misma importación de siempre (la entrega de
   cada clave vive en js/centro-de-datos-reparto.js).

   - La carpeta se señala una vez por ordenador (Almacen,
     `centro-de-datos-carpeta`), en modo lectura.
   - Lo que se ha tomado se apunta en `_GESTOR/centro-de-datos.json`
     (por ColaGuardado y Copias): así el otro ordenador, que no tiene la
     carpeta, sabe de cuándo son los datos, y ninguno repite.
   - Un listado se toma solo si su `huella` es distinta de la apuntada,
     su `subido` es posterior al apuntado y el fichero que el gestor ya
     tiene no es más reciente: nunca se sustituye un dato por otro más
     viejo.
   - Sin carpeta señalada y sin nada apuntado, todo es como antes.
   - Lo que se ve (bloque de Ajustes, líneas grises, botón), en
     js/centro-de-datos-ver.js.
   ============================================================ */
var CentroDeDatos = (function () {

  var FICHERO = 'centro-de-datos.json';
  var ESQUEMA = 1;
  var CONTRATO = 2;   /* fila 317: el del índice; configuracion.json lleva el suyo (1) */
  var CLAVE_CARPETA = 'centro-de-datos-carpeta';
  var CLAVES = ['alumnado', 'personal', 'alumnado-bd', 'tutorias', 'consejo-escolar', 'registro-entrada', 'registro-salida'];
  var TITULOS = {
    'alumnado': 'Alumnado', 'personal': 'Personal', 'alumnado-bd': 'Alumnado de la base de datos',
    'tutorias': 'Función tutorial', 'consejo-escolar': 'Consejo Escolar',
    'registro-entrada': 'Registro de entrada', 'registro-salida': 'Registro de salida'
  };
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  var yaMirado = false;
  var tomando = false;
  var avisadoContrato = false;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor ? window.Gestor.carpetaGestor() : (window.App && App.E && App.E.gestor); }
  function quien() { return (window.App && App.E && App.E.usuario) || ''; }
  function ahora() { return window.U && U.ahora ? U.ahora() : new Date().toISOString(); }
  function llave(clave, variante) { return clave + '|' + (variante || ''); }

  /* «8-oct» o «8-oct-2026». */
  function fechaCorta(iso, conAno) {
    var f = new Date(iso || '');
    if (isNaN(f.getTime())) return '';
    return f.getDate() + '-' + MESES[f.getMonth()] + (conAno ? '-' + f.getFullYear() : '');
  }

  /* ---------- la carpeta (de este ordenador) ---------- */

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

  /* { ok, indice } o { ok: false, motivo, sinIndice? }. */
  async function leerIndice(dir) {
    var indice;
    try { indice = await Carpetas.leerJson(dir, 'indice.json'); }
    catch (e) { return { ok: false, motivo: 'no he podido leer indice.json: ' + U.mensajeDeError(e) }; }
    if (!indice || typeof indice !== 'object' || !Array.isArray(indice.listados)) {
      return { ok: false, sinIndice: true, motivo: 'no trae indice.json' };
    }
    return { ok: true, indice: indice };
  }

  async function senalarCarpeta() {
    try {
      var h = await window.showDirectoryPicker({ id: 'gestor-centro-de-datos', mode: 'read' });
      var r = await leerIndice(h);
      if (!r.ok) {
        if (window.CentroDeDatosVer) CentroDeDatosVer.avisoCarpeta('Esta carpeta no es la del Centro de datos.');
        U.aviso('Esta carpeta no es la del Centro de datos.', 'ambar');
        return;
      }
      await Almacen.guardar(CLAVE_CARPETA, h);
      U.aviso('Carpeta del Centro de datos señalada: ' + h.name, 'bueno');
      if (window.CentroDeDatosVer) CentroDeDatosVer.pintar();
      await traer({ avisar: true, pedir: true });
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      U.fallo('No he podido usar esa carpeta', e);
    }
  }

  async function olvidarCarpeta() {
    try { await Almacen.guardar(CLAVE_CARPETA, null); } catch (e) { /* nada */ }
    if (window.CentroDeDatosVer) CentroDeDatosVer.pintar();
  }

  /* ---------- lo apuntado, en _GESTOR/centro-de-datos.json ---------- */

  function vacio() { return { _esquema: ESQUEMA, tomado: {} }; }

  /* Se lee del disco como mucho cada 20 segundos (las pantallas lo piden a menudo); `fresco` lo fuerza. */
  var enMemoria = null, leidoEn = 0;
  async function leerApuntes(fresco) {
    var g = gestor();
    if (!g) return vacio();
    if (!fresco && enMemoria && Date.now() - leidoEn < 20000) return enMemoria;
    var j = null;
    try { j = await Carpetas.leerJson(g, FICHERO); } catch (e) { j = null; }
    var a = Object.assign(vacio(), j || {});
    a.tomado = a.tomado || {};
    enMemoria = a; leidoEn = Date.now();
    return a;
  }

  function apuntar(nuevos) {
    var llaves = Object.keys(nuevos);
    if (!llaves.length) return Promise.resolve();
    return ColaGuardado.poner(FICHERO, async function () {
      var g = gestor();
      var actual = await leerApuntes(true);
      llaves.forEach(function (k) {
        var previo = actual.tomado[k];
        /* Nunca se sustituye un apunte por otro más viejo. */
        if (previo && new Date(previo.subido) > new Date(nuevos[k].subido)) return;
        actual.tomado[k] = nuevos[k];
      });
      actual._esquema = ESQUEMA;
      await Copias.guardar(g, FICHERO, actual);
      enMemoria = actual; leidoEn = Date.now();
    });
  }

  /* Fila 313: lo que se tomó de configuracion.json, junto a `tomado`. */
  function apuntarConfiguracion(configuracion) {
    return ColaGuardado.poner(FICHERO, async function () {
      var g = gestor();
      var actual = await leerApuntes(true);
      actual.configuracion = configuracion;
      actual._esquema = ESQUEMA;
      await Copias.guardar(g, FICHERO, actual);
      enMemoria = actual; leidoEn = Date.now();
    });
  }

  /* El último apunte de una clave (el de la variante más reciente). */
  function apunteDe(apuntes, clave) {
    var mejor = null;
    Object.keys((apuntes && apuntes.tomado) || {}).forEach(function (k) {
      if (k.split('|')[0] !== clave) return;
      var a = apuntes.tomado[k];
      if (!mejor || new Date(a.subido) > new Date(mejor.subido)) mejor = a;
    });
    return mejor;
  }

  /* ---------- qué hay que tomar ---------- */

  async function llegarAlFichero(dir, ruta) {
    var partes = String(ruta || '').split('/').filter(Boolean);
    var actual = dir;
    for (var i = 0; i < partes.length - 1; i++) actual = await actual.getDirectoryHandle(partes[i]);
    return actual.getFileHandle(partes[partes.length - 1]);
  }

  /* Fila 317 (contrato 2): qué entradas del índice se cogen. Con un índice de contrato 1 (sin `cursoActual` ni
     fichas) los campos que faltan se leen vacíos y sale lo de siempre. Devuelve { lista, avisos }. */
  function elegir(indice) {
    var cursoActual = (indice && indice.cursoActual) || (window.U && U.cursoActual ? U.cursoActual() : '');
    var avisos = [];
    var todas = ((indice && indice.listados) || []).filter(function (e) {
      return e && CLAVES.indexOf(e.clave) !== -1 && e.ruta && !e.porAlumno && !e.alumno;
    });
    var de = function (clave) { return todas.filter(function (e) { return e.clave === clave; }); };
    var delCurso = function (clave) {
      var l = de(clave);
      var hoy = l.filter(function (e) { return (e.cursoEscolar || '') === cursoActual; });
      return hoy.length ? hoy : l.filter(function (e) { return !e.cursoEscolar; });
    };
    var unica = function (clave, nombre) {
      var l = de(clave);
      if (l.length > 1) { avisos.push('En el Centro de datos hay más de un listado de ' + nombre + '. No he traído ninguno.'); return []; }
      return l;
    };
    var elegidas = [].concat(unica('alumnado', 'alumnado'), unica('alumnado-bd', 'alumnado de la base de datos'), de('personal'),
      delCurso('tutorias'), de('consejo-escolar'), delCurso('registro-entrada'), delCurso('registro-salida'));
    var lista = todas.filter(function (e) { return elegidas.indexOf(e) !== -1; });   /* en el orden del índice */
    return { lista: lista, avisos: avisos, cursoActual: cursoActual };
  }

  /* Las tres condiciones del diseño. `deLaCasa`: la fecha (ms) del dato que el gestor ya tiene, o 0. */
  function hayQueTomar(e, apuntes, deLaCasa) {
    var ap = apuntes.tomado[llave(e.clave, e.variante)];
    var subido = new Date(e.subido).getTime();
    if (ap && ap.huella && e.huella && ap.huella === e.huella) return false;
    /* Fila 317: si algún apunte de esa clave, con la variante que sea, tiene la misma huella, no se vuelve a tomar
       (con el contrato 2 cambian algunas variantes y el apunte de antes ya no casa por su llave). */
    if (e.huella && Object.keys(apuntes.tomado).some(function (k) { return k.split('|')[0] === e.clave && apuntes.tomado[k].huella === e.huella; })) return false;
    if (ap && !isNaN(subido) && new Date(ap.subido).getTime() >= subido) return false;
    if (deLaCasa && !isNaN(subido) && deLaCasa > subido) return false;
    return true;
  }

  /* Los del índice que se tomarían ahora. `sinRegistro`: dejar fuera los del registro. */
  async function pendientes(indice, apuntes, sinRegistro) {
    var R = window.CentroDeDatosReparto;
    var elegidas = elegir(indice).lista;
    var lista = [];
    for (var i = 0; i < elegidas.length; i++) {
      var e = elegidas[i];
      if (sinRegistro && /^registro-/.test(e.clave)) continue;
      var deLaCasa = 0;
      try { deLaCasa = await R.fechaDelGestor(e, elegidas); } catch (x) { deLaCasa = 0; }
      if (hayQueTomar(e, apuntes, deLaCasa)) lista.push(e);
    }
    return lista;
  }

  /* ¿Hay listados nuevos del registro esperando la fecha «Revisar desde»? */
  async function registroEsperando() {
    try {
      var dir = await carpeta();
      if (!dir || !(await permiso(dir, false))) return false;
      var r = await leerIndice(dir);
      if (!r.ok || (r.indice.contrato || 1) > CONTRATO || r.indice.ocupado) return false;
      var lista = await pendientes(r.indice, await leerApuntes(), false);
      return lista.some(function (e) { return /^registro-/.test(e.clave); });
    } catch (e) { return false; }
  }

  /* ---------- tomar ---------- */

  var RECOLOCANDO = 'El Centro de datos está recolocando sus ficheros. Lo traeré más tarde.';
  var avisadosElegir = {};

  /* El aviso verde de lo traído; `config`: lo que se copió de configuracion.json. */
  function avisarTraido(partes, config) {
    partes = partes.slice();
    if (config && config.centro) partes.push('los datos del centro');
    if (config && config.buzon) partes.push('la dirección del buzón de soporte');
    var conConfig = !!(config && (config.centro || config.buzon));
    U.aviso('Traído del Centro de datos: ' + (conConfig && partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes.join(', ')) + '.', 'bueno');
  }
  function avisarConfiguracion(config) { avisarTraido([], config); }

  /* `avisar`: contesta siempre (el botón); `pedir`: puede pedir permiso (tras un clic).
     Devuelve { ok, tomados: [clave…], fallos: [texto…], motivo? }. */
  async function traer(op) {
    op = op || {};
    var salida = { ok: false, tomados: [], fallos: [] };
    if (tomando) { salida.motivo = 'ya se está tomando'; return salida; }
    if (window.SoloConsulta && SoloConsulta.activo()) { salida.motivo = 'solo consulta'; return salida; }
    var dir = await carpeta();
    if (!dir) {
      salida.motivo = 'sin carpeta';
      if (op.avisar) U.aviso('Primero señala la carpeta en Ajustes › Este ordenador › Carpeta del Centro de datos.', 'ambar');
      return salida;
    }
    if (!(await permiso(dir, op.pedir))) {
      salida.motivo = 'sin permiso';
      if (op.avisar) U.aviso('El navegador no da permiso a la carpeta del Centro de datos. Hay que dárselo en Ajustes › Este ordenador.', 'ambar');
      return salida;
    }
    tomando = true;
    try {
      var r = await leerIndice(dir);
      if (!r.ok) {
        salida.motivo = r.motivo;
        U.accesorio('No he podido leer el índice del Centro de datos', new Error(r.motivo));
        return salida;
      }
      var apuntes = await leerApuntes(true);
      /* Fila 317: los datos del centro (configuracion.json, que lleva su propio contrato) se leen aunque el índice
         sea de un contrato más nuevo o esté ocupado. */
      var config = null;
      if (window.CentroDeDatosConfiguracion) {
        try { config = await CentroDeDatosConfiguracion.tomar(dir, r.indice, apuntes); }
        catch (x) { salida.fallos.push('Datos del centro: ' + U.mensajeDeError(x)); }
      }
      salida.configuracion = !!(config && (config.centro || config.buzon));
      var bloqueo = (r.indice.contrato || 1) > CONTRATO ? 'contrato' : (r.indice.ocupado ? 'ocupado' : '');
      if (bloqueo) {
        salida.motivo = bloqueo;
        if (bloqueo === 'contrato' && (!avisadoContrato || op.avisar)) { avisadoContrato = true; U.aviso('El Centro de datos es más nuevo que esta aplicación.', 'ambar'); }
        if (bloqueo === 'ocupado' && op.avisar) U.aviso(RECOLOCANDO);
        if (salida.configuracion) avisarConfiguracion(config);
        return salida;
      }
      var elegido = elegir(r.indice);
      elegido.avisos.forEach(function (a) { if (!avisadosElegir[a] || op.avisar) { avisadosElegir[a] = true; U.aviso(a, 'ambar'); } });
      var lista = await pendientes(r.indice, apuntes, false);
      var R = window.CentroDeDatosReparto;
      var ctx = R.contexto(elegido.lista);
      var nuevos = {};
      var esperaRegistro = false;
      for (var i = 0; i < lista.length; i++) {
        var e = lista[i];
        try {
          var h = await llegarAlFichero(dir, e.ruta);
          var res = await R.entregar(e, h, ctx);
          if (res === 'sin-fecha') { esperaRegistro = true; continue; }
          if (!res) continue;
          salida.tomados.push(e.clave);
          nuevos[llave(e.clave, e.variante)] = {
            huella: e.huella || '', subido: e.subido || '', fichero: e.fichero || '', resumen: e.resumen || '',
            subidoPor: e.subidoPor || '', tomadoEl: ahora(), tomadoPor: quien()
          };
        } catch (x) {
          salida.fallos.push((TITULOS[e.clave] || e.clave) + ': ' + U.mensajeDeError(x));
        }
      }
      await R.terminar(ctx);
      await apuntar(nuevos);
      salida.ok = true;
      salida.esperaRegistro = esperaRegistro;
      if (salida.tomados.length || salida.configuracion) {
        var vistos = {};
        var partes = [];
        lista.forEach(function (e) {
          if (nuevos[llave(e.clave, e.variante)] && !vistos[e.clave]) {
            vistos[e.clave] = true;
            partes.push(TITULOS[e.clave] + ' (' + fechaCorta(e.subido, false) + ')');
          }
        });
        avisarTraido(partes, config);
      } else if (op.avisar && !salida.fallos.length) {
        U.aviso('No hay nada nuevo en el Centro de datos.', 'bueno');
      }
      salida.fallos.forEach(function (f) { U.accesorio('No he podido traer del Centro de datos', new Error(f)); });
    } catch (e) {
      salida.motivo = U.mensajeDeError(e);
      U.accesorio('No he podido traer lo del Centro de datos', e);
    } finally {
      tomando = false;
      if (window.CentroDeDatosVer) CentroDeDatosVer.pintar();
      if (window.DatosQueTengoVer) DatosQueTengoVer.repintar();   /* fila 319 */
    }
    return salida;
  }

  /* Al entrar: una sola vez por sesión, a los 1,5 segundos; con un guardado en marcha, espera (hasta 10 veces). */
  function alEntrar() {
    if (yaMirado || !window.App || !App.E || !App.E.datos || !App.E.registro) return;
    yaMirado = true;
    var intentos = 0;
    function probar() {
      if (window.SoloConsulta && SoloConsulta.activo()) return;
      if (window.ColaGuardado && ColaGuardado.hayGuardado() && intentos++ < 10) { setTimeout(probar, 1500); return; }
      traer({ avisar: false, pedir: false }).catch(function () { /* a la siguiente entrada */ });
    }
    setTimeout(probar, 1500);
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    FICHERO: FICHERO, CLAVE_CARPETA: CLAVE_CARPETA, CONTRATO: CONTRATO, CLAVES: CLAVES, TITULOS: TITULOS,
    carpeta: carpeta, permiso: permiso, leerIndice: leerIndice, senalarCarpeta: senalarCarpeta, olvidarCarpeta: olvidarCarpeta,
    leerApuntes: leerApuntes, apuntarConfiguracion: apuntarConfiguracion, apunteDe: apunteDe, traer: traer, registroEsperando: registroEsperando,
    fechaCorta: fechaCorta, hayQueTomar: hayQueTomar, elegir: elegir, pendientes: pendientes, RECOLOCANDO: RECOLOCANDO,
    _alEntrarDeNuevo: function () { yaMirado = false; alEntrar(); }   /* para las pruebas */
  };
})();
window.CentroDeDatos = CentroDeDatos;
