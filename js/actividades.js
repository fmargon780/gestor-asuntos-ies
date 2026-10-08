/* ============================================================
   actividades.js — el registro de actividades extraescolares (8-oct-2026,
   fila 306, docs/ACTIVIDADES-EXTRAESCOLARES.md).

   `_GESTOR/actividades.json` es la única fuente de los datos de una
   actividad: cuándo es, dónde, qué unidades van, cuánto alumnado y qué
   profesorado (quién organiza y quién acompaña). Un asunto de actividad es un
   asunto de grupo (js/asunto-de-grupo.js) que lleva `ficha.actividad = { id }`;
   su alumnado son sus relacionados, su profesorado vive aquí.

       { _esquema: 1, tipoMarcado: true, actividades: [ { id, asunto: {numero, nombre} | null,
         nombre, inicio, fin, salida, regreso, lugar, departamento, horas,
         unidades: [ { unidad, van, de } ], alumnado,
         profesorado: [ { nombre, clave, papel } ], anulada, enPapelera, antigua,
         creadaPor, creadaEl, cambiadaPor, cambiadaEl } ] }

   Qué tipo de asunto apunta actividades lo dice una marca en el propio tipo
   (`tipo.actividades = true`, en tipos.json). Una pasada única al entrar la pone
   al tipo ACTIVIDAD EXTRAESCOLAR (si el centro lo tiene).
   El formulario es js/actividades-formulario.js; la tarjeta de la ficha,
   js/actividades-ficha.js.
   ============================================================ */
var Actividades = (function () {

  var FICHERO = 'actividades.json';
  var NOMBRE_TIPO = 'ACTIVIDAD EXTRAESCOLAR';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  var datos = { actividades: [], tipoMarcado: false };
  var huella = '';
  var alCambiar = [];
  var ultimaLectura = 0;
  var corriendo = false;

  function gestor() { return window.Gestor && Gestor.carpetaGestor(); }
  function texto(v, max) { return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 200); }
  function usuario() { return (window.Gestor && Gestor.usuario && Gestor.usuario()) || (window.App && App.E && App.E.usuario) || ''; }

  /* ---------- sin efectos ---------- */

  /* 'anulada', 'realizada' (su fecha de fin quedó atrás) o 'prevista'. */
  function situacion(act, hoyIso) {
    if (!act) return 'prevista';
    if (act.anulada) return 'anulada';
    var fin = act.fin || act.inicio || '';
    return fin && fin < hoyIso ? 'realizada' : 'prevista';
  }

  /* Cuenta para el certificado: realizada y no en la papelera. */
  function cuenta(act, hoyIso) {
    return !!act && !act.enPapelera && situacion(act, hoyIso) === 'realizada';
  }

  /* `van`: el alumnado que va (cada uno con su `unidad`); `todos`: el alumnado matriculado, para saber de cuántos es la unidad. */
  function unidadesDe(van, todos) {
    var vistas = {};
    (van || []).forEach(function (p) {
      var u = String(p && p.unidad || '').trim();
      if (!u) return;
      if (!vistas[u]) vistas[u] = { unidad: u, van: 0, de: 0 };
      vistas[u].van++;
    });
    Object.keys(vistas).forEach(function (u) {
      var de = (todos || []).filter(function (p) { return p.matriculado !== false && String(p.unidad || '').trim() === u; }).length;
      vistas[u].de = Math.max(de, vistas[u].van);
    });
    return Object.keys(vistas).map(function (k) { return vistas[k]; })
      .sort(function (a, b) { return a.unidad < b.unidad ? -1 : (a.unidad > b.unidad ? 1 : 0); });
  }

  function partes(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? { a: +m[1], m: +m[2], d: +m[3] } : null;
  }

  /* «15 de octubre de 2026» o «del 15 al 17 de octubre de 2026». */
  function fechasLegibles(act) {
    var i = partes(act && act.inicio), f = partes(act && (act.fin || act.inicio));
    if (!i) return '';
    if (!f || (f.a === i.a && f.m === i.m && f.d === i.d)) return i.d + ' de ' + MESES[i.m - 1] + ' de ' + i.a;
    if (f.a === i.a && f.m === i.m) return 'del ' + i.d + ' al ' + f.d + ' de ' + MESES[i.m - 1] + ' de ' + i.a;
    if (f.a === i.a) return 'del ' + i.d + ' de ' + MESES[i.m - 1] + ' al ' + f.d + ' de ' + MESES[f.m - 1] + ' de ' + i.a;
    return 'del ' + i.d + ' de ' + MESES[i.m - 1] + ' de ' + i.a + ' al ' + f.d + ' de ' + MESES[f.m - 1] + ' de ' + f.a;
  }

  /* «15-oct-2026», para el resumen de la tarjeta. */
  function fechaCorta(iso) {
    var p = partes(iso);
    return p ? p.d + '-' + MESES_CORTOS[p.m - 1] + '-' + p.a : '';
  }

  function textoSituacion(s) { return s === 'anulada' ? 'Anulada' : (s === 'realizada' ? 'Realizada' : 'Prevista'); }

  /* ---------- lo que hay en el fichero ---------- */

  function limpia(x) {
    x = x || {};
    var asunto = x.asunto && (x.asunto.nombre || x.asunto.numero) ? { numero: texto(x.asunto.numero, 40), nombre: texto(x.asunto.nombre, 300) } : null;
    var horas = x.horas === null || x.horas === undefined || x.horas === '' ? null : Number(String(x.horas).replace(',', '.'));
    return {
      id: texto(x.id, 80), asunto: asunto, nombre: texto(x.nombre, 120),
      inicio: texto(x.inicio, 10), fin: texto(x.fin || x.inicio, 10), salida: texto(x.salida, 5), regreso: texto(x.regreso, 5),
      lugar: texto(x.lugar, 200), departamento: texto(x.departamento, 120), horas: isFinite(horas) ? horas : null,
      unidades: Array.isArray(x.unidades) ? x.unidades.map(function (u) { return { unidad: texto(u.unidad, 40), van: +u.van || 0, de: +u.de || 0 }; }) : [],
      alumnado: +x.alumnado || 0,
      profesorado: Array.isArray(x.profesorado) ? x.profesorado.filter(function (p) { return p && p.nombre; }).map(function (p) {
        return { nombre: texto(p.nombre, 200), clave: texto(p.clave, 80), papel: p.papel === 'organiza' ? 'organiza' : 'acompana' };
      }) : [],
      anulada: !!x.anulada, enPapelera: !!x.enPapelera, antigua: !!x.antigua,
      creadaPor: texto(x.creadaPor, 80), creadaEl: texto(x.creadaEl, 40), cambiadaPor: texto(x.cambiadaPor, 80), cambiadaEl: texto(x.cambiadaEl, 40)
    };
  }

  /* PURA. */
  function normalizar(leido) {
    var salida = { tipoMarcado: !!(leido && leido.tipoMarcado), actividades: [] };
    var vistos = {};
    ((leido && Array.isArray(leido.actividades)) ? leido.actividades : []).forEach(function (x) {
      var a = limpia(x);
      if (!a.id || vistos[a.id]) return;
      vistos[a.id] = true;
      salida.actividades.push(a);
    });
    if (leido && Number(leido._esquema) > 0) salida._esquema = Number(leido._esquema);
    return salida;
  }

  /* PURA: dos registros fundidos por `id`; en un mismo `id` gana el `cambiadaEl` más reciente. */
  function fundir(a, b) {
    var porId = {}, orden = [];
    (a.actividades || []).concat(b.actividades || []).forEach(function (x) {
      var antes = porId[x.id];
      if (!antes) { porId[x.id] = x; orden.push(x.id); return; }
      if (String(x.cambiadaEl || x.creadaEl) > String(antes.cambiadaEl || antes.creadaEl)) porId[x.id] = x;
    });
    return { tipoMarcado: !!(a.tipoMarcado || b.tipoMarcado), actividades: orden.map(function (id) { return porId[id]; }) };
  }

  /* ---------- leer y escribir ---------- */

  function guardarEnMemoria(nuevo) {
    var h = JSON.stringify(nuevo.actividades);
    var cambio = h !== huella;
    huella = h;
    datos = nuevo;
    return cambio;
  }

  async function releer() {
    var g = gestor();
    if (!g) return false;
    var leido = null;
    try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { return false; }
    ultimaLectura = Date.now();
    return guardarEnMemoria(normalizar(leido));
  }

  function lista() { return datos.actividades.slice(); }
  function porId(id) { return datos.actividades.filter(function (a) { return a.id === id; })[0] || null; }
  function porAsunto(nombre) { return datos.actividades.filter(function (a) { return a.asunto && a.asunto.nombre === nombre; })[0] || null; }
  function tipoMarcado() { return !!datos.tipoMarcado; }

  function avisarCambio() {
    alCambiar.forEach(function (f) { try { f(); } catch (e) { /* una pantalla rota no tumba lo demás */ } });
  }

  /* Leer, cambiar y guardar, en la fila de este fichero. `hacer(actual)` muta `actual.actividades`.
     Cada actividad que se toca lleva su `cambiadaPor` y `cambiadaEl` (lo pone `sellar`). */
  function cambiar(hacer) {
    var g = gestor();
    if (!g) return Promise.reject(new Error('No hay carpeta de datos.'));
    return App.enFila(FICHERO, async function () {
      /* Si no se puede leer, no se escribe encima: se perdería lo que hubiera. */
      var actual = normalizar(await Carpetas.leerJson(g, FICHERO));
      var r = await hacer(actual);
      await Copias.guardar(g, FICHERO, actual);
      guardarEnMemoria(actual);
      return r;
    }).then(function (r) { avisarCambio(); return r; });
  }

  function sellar(a) { a.cambiadaPor = usuario(); a.cambiadaEl = U.ahora(); return a; }

  /* Una actividad nueva o cambiada, a partir de lo que dice el formulario (js/actividades-formulario.js). */
  function construir(r, base) {
    var a = limpia(Object.assign({}, base || {}, r));
    a.unidades = unidadesDe(r.alumnos || [], r.matriculados || []);
    a.alumnado = (r.alumnos || []).length;
    if (!base || !base.creadaEl) { a.creadaPor = usuario(); a.creadaEl = U.ahora(); }
    return sellar(a);
  }

  async function guardarActividad(a) {
    return cambiar(function (d) {
      var i = d.actividades.map(function (x) { return x.id; }).indexOf(a.id);
      if (i === -1) d.actividades.push(a); else d.actividades[i] = a;
    });
  }

  async function marcarAnulada(id, anulada) {
    return cambiar(function (d) {
      d.actividades.forEach(function (a) { if (a.id === id) { a.anulada = !!anulada; sellar(a); } });
    });
  }

  /* ---------- el tipo que apunta actividades ---------- */

  function tipoPorNombre(t) {
    if (!t) return null;
    if (typeof t === 'object') return t;
    return (App.E.tipos || []).filter(function (x) { return x.tipo === t; })[0] || null;
  }
  function esTipoDeActividad(tipo) {
    var t = tipoPorNombre(tipo);
    return !!(t && t.actividades === true);
  }
  /* ¿Lleva este asunto la tarjeta «La actividad»? Por su tipo, o porque ya lleva actividad. */
  function tarjetaAplica(a) {
    var f = (a && a.ficha) || {};
    if (f.actividad && f.actividad.id) return true;
    var tipo = window.App && App.tipoDeAsunto ? App.tipoDeAsunto(a) : f.tipo;
    return esTipoDeActividad(tipo);
  }
  function tieneActividad(a) {
    var f = (a && a.ficha) || a || {};
    return !!(f.actividad && f.actividad.id);
  }

  /* La pasada única: pone la marca al tipo ACTIVIDAD EXTRAESCOLAR (o al que lo tuvo como nombre antiguo). */
  async function pasada() {
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!gestor() || !App.E || !App.E.tipos) return null;
    corriendo = true;
    try {
      await releer();
      if (datos.tipoMarcado) return null;
      var objetivo = U.normalizar(NOMBRE_TIPO);
      var tipo = App.E.tipos.filter(function (t) { return U.normalizar(t.tipo) === objetivo; })[0] ||
        App.E.tipos.filter(function (t) { return (t.alias || []).some(function (x) { return U.normalizar(x) === objetivo; }); })[0];
      /* Un centro que no tiene el tipo (lo borró a propósito) no lo recibe de vuelta: se reintenta en la próxima entrada. */
      if (!tipo) return null;
      if (tipo.actividades !== true) { tipo.actividades = true; await App.guardarTipos(); }
      await cambiar(function (d) { d.tipoMarcado = true; });
      return tipo;
    } finally {
      corriendo = false;
    }
  }

  /* ---------- la cuenta siempre es la verdadera ---------- */

  async function alumnadoMatriculado() {
    if (!App.E.datos || !window.Datos) return [];
    try { return (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista || []; } catch (e) { return []; }
  }

  /* Del alumnado que va (relacionados de ALUMNADO), las personas con sus datos. */
  async function alumnosDe(ficha) {
    var rel = ((ficha && ficha.relacionados) || []).filter(function (r) { return r && r.categoria === 'ALUMNADO'; });
    var todos = await alumnadoMatriculado();
    var porTexto = {};
    todos.forEach(function (p) { porTexto[App.textoTercero(p)] = p; });
    var van = rel.map(function (r) { return porTexto[r.nombre] ? Object.assign({ nombreRel: r.nombre }, porTexto[r.nombre]) : null; }).filter(Boolean);
    return { cuantos: rel.length, van: van, todos: todos };
  }

  var puestoAlDia = false;
  async function ponerAlDia() {
    if (puestoAlDia) return;
    if (window.SoloConsulta && SoloConsulta.activo()) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    if (window.Demo && Demo.montando) return;
    var reg = window.App && App.E && App.E.registro && App.E.registro.asuntos;
    if (!gestor() || !reg) return;
    var nombres = Object.keys(reg).filter(function (n) { return reg[n] && reg[n].actividad && reg[n].actividad.id; });
    if (!nombres.length) return;
    puestoAlDia = true;
    try {
      if (Date.now() - ultimaLectura > 15000) await releer();
      var cambios = [];
      for (var i = 0; i < nombres.length; i++) {
        var act = porId(reg[nombres[i]].actividad.id);
        if (!act) continue;
        var al = await alumnosDe(reg[nombres[i]]);
        var unidades = unidadesDe(al.van, al.todos);
        var nuevo = { alumnado: al.cuantos, unidades: unidades, asunto: { numero: reg[nombres[i]].numero || (act.asunto && act.asunto.numero) || '', nombre: nombres[i] } };
        if (act.alumnado !== nuevo.alumnado || JSON.stringify(act.unidades) !== JSON.stringify(unidades) ||
            !act.asunto || act.asunto.nombre !== nombres[i]) cambios.push({ id: act.id, nuevo: nuevo });
      }
      if (cambios.length) {
        await cambiar(function (d) {
          cambios.forEach(function (c) {
            d.actividades.forEach(function (a) {
              if (a.id !== c.id) return;
              a.alumnado = c.nuevo.alumnado; a.unidades = c.nuevo.unidades; a.asunto = c.nuevo.asunto; sellar(a);
            });
          });
        });
      }
    } catch (e) { /* a la siguiente pasada */ }
    finally { puestoAlDia = false; }
  }

  var yaMirado = false;
  function alRefrescar() {
    if (!gestor() || !window.App || !App.E) return;
    if (window.Demo && Demo.montando) return;
    if (!yaMirado && App.E.tipos && App.E.tipos.length) {
      yaMirado = true;
      setTimeout(function () {
        pasada().catch(function (e) { U.accesorio('No he podido preparar el tipo de asunto de las actividades extraescolares', e); });
      }, 3500);
    }
    ponerAlDia();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  /* ---------- papelera, unir, renombrar ---------- */

  async function alCambiarElAsunto(nombre, accion) {
    if (!gestor()) return;
    var mia = null;
    try { await releer(); mia = porAsunto(nombre); } catch (e) { return; }
    if (!mia) return;
    var enPapelera = accion === 'papelera';
    if (mia.enPapelera === enPapelera) return;
    try { await cambiar(function (d) { d.actividades.forEach(function (a) { if (a.id === mia.id) { a.enPapelera = enPapelera; sellar(a); } }); }); }
    catch (e) { U.accesorio('No he podido poner al día la actividad extraescolar de ese asunto', e); }
  }

  async function alMoverAsunto(viejo, nuevo) {
    if (!viejo || viejo === nuevo || !gestor()) return;
    var mia = null;
    try { await releer(); mia = porAsunto(viejo); } catch (e) { return; }
    if (!mia) return;
    try { await cambiar(function (d) { d.actividades.forEach(function (a) { if (a.id === mia.id) { a.asunto.nombre = nuevo; } }); }); }
    catch (e) { U.accesorio('No he podido poner al día el nombre del asunto en su actividad extraescolar', e); }
  }

  /* Dos asuntos unidos: si los dos llevan actividad, se queda la del que se queda y la otra va a la papelera. */
  async function alUnirAsuntos(claveQueda, claveVa) {
    if (!gestor()) return;
    var va = null, queda = null;
    try { await releer(); va = porAsunto(claveVa); queda = porAsunto(claveQueda); } catch (e) { return; }
    if (!va || !queda || va.id === queda.id) return;
    try { await cambiar(function (d) { d.actividades.forEach(function (a) { if (a.id === va.id) { a.enPapelera = true; sellar(a); } }); }); }
    catch (e) { U.accesorio('No he podido apartar la actividad extraescolar del asunto unido', e); }
  }

  /* Una persona cambia de nombre: su nombre en `profesorado` la sigue. */
  async function alRenombrarPersona(categoria, viejo, nuevo) {
    if (categoria !== 'PERSONAL' || !viejo || viejo === nuevo || !gestor()) return;
    try {
      await releer();
      if (!datos.actividades.some(function (a) { return a.profesorado.some(function (p) { return p.nombre === viejo; }); })) return;
      await cambiar(function (d) {
        d.actividades.forEach(function (a) {
          a.profesorado.forEach(function (p) { if (p.nombre === viejo) { p.nombre = nuevo; sellar(a); } });
        });
      });
    } catch (e) { U.accesorio('No he podido poner al día el nombre de ese profesor o profesora en sus actividades', e); }
  }

  /* ---------- un conflicto de Dropbox en actividades.json ---------- */

  async function fusionarConflicto(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, FICHERO);
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || !Array.isArray(conflicto.actividades)) return false;
    var fusion = fundir(normalizar(real), normalizar(conflicto));
    var I = window.Conflictos && Conflictos._interno;
    if (I && I.conservarEsquemaMayor) I.conservarEsquemaMayor(fusion, real, conflicto);
    await App.enFila(FICHERO, function () { return Copias.guardar(g, FICHERO, fusion); });
    if (I && I.archivarConflicto) await I.archivarConflicto(g, nombreConflicto);
    await releer();
    return true;
  }

  /* ---------- la plantilla de antes, una por relacionado ---------- */

  /* «Participación del profesorado en actividad extraescolar»: pensada para cuando los relacionados eran los profesores. */
  function esPlantillaVieja(p) {
    return !!p && (/participacion-actividad\.docx$/i.test(String(p.fichero || '')) ||
      U.normalizar(p.nombre || '') === U.normalizar('Participación del profesorado en actividad extraescolar'));
  }

  return {
    FICHERO: FICHERO, NOMBRE_TIPO: NOMBRE_TIPO,
    situacion: situacion, cuenta: cuenta, unidadesDe: unidadesDe, fechasLegibles: fechasLegibles, fechaCorta: fechaCorta,
    textoSituacion: textoSituacion,
    releer: releer, lista: lista, porId: porId, porAsunto: porAsunto, tipoMarcado: tipoMarcado, cambiar: cambiar,
    construir: construir, guardarActividad: guardarActividad, marcarAnulada: marcarAnulada, sellar: sellar,
    esTipoDeActividad: esTipoDeActividad, tarjetaAplica: tarjetaAplica, tieneActividad: tieneActividad,
    pasada: pasada, ponerAlDia: ponerAlDia, alumnosDe: alumnosDe, alumnadoMatriculado: alumnadoMatriculado,
    alCambiarElAsunto: alCambiarElAsunto, alMoverAsunto: alMoverAsunto, alUnirAsuntos: alUnirAsuntos,
    alRenombrarPersona: alRenombrarPersona, fusionarConflicto: fusionarConflicto,
    esPlantillaVieja: esPlantillaVieja,
    alCambiar: alCambiar, avisarCambio: avisarCambio,
    _normalizar: normalizar, _fundir: fundir
  };
})();
window.Actividades = Actividades;
