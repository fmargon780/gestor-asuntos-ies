/* ============================================================
   encargos.js — los encargos de los directivos (7-oct-2026, fila 289,
   docs/ENCARGOS-DE-DIRECTIVOS.md).

   Un encargo es lo que un directivo pide a Administración desde la
   aplicación. No es un asunto: Administración lo convierte (elige el tipo
   y el tercero) o dice que no procede. Se guarda en `_GESTOR/encargos.json`
   (`{ encargos: [ … ] }`) y sus documentos esperan en
   `_GESTOR/encargos/<id>/`.

   Quién escribe qué: el directivo envía y retira, siempre por
   `Perfil.escribir` (su única puerta, fila 287); Administración lo atiende
   y, al archivar, reabrir, borrar o recuperar un asunto, pone al día el
   estado de sus encargos (`alCambiarElAsunto`).

   Estados: `sin-atender`, `asunto`, `terminado`, `no-procede`, `retirado`.
   Este fichero es el núcleo; las pantallas son js/encargos-nuevo.js,
   js/encargos-mios.js y js/encargos-llegada.js.
   ============================================================ */
var Encargos = (function () {

  var FICHERO = 'encargos.json';
  var CARPETA = 'encargos';
  var ESTADOS = ['sin-atender', 'asunto', 'terminado', 'no-procede', 'retirado'];
  var MOTIVO_BORRADO = 'El asunto se ha borrado';

  var datos = { encargos: [] };
  var huella = '';
  var alCambiar = [];     /* pantallas que se repintan cuando cambian los encargos */
  var ultimaLectura = 0;

  function gestor() { return window.Gestor && Gestor.carpetaGestor(); }

  /* ---------- lo que hay en el fichero ---------- */

  function limpioEncargo(e) {
    e = e || {};
    var afecta = null;
    if (e.afecta && e.afecta.nombre) afecta = { nombre: String(e.afecta.nombre), categoria: String(e.afecta.categoria || ''), clave: String(e.afecta.clave || ''), unidad: String(e.afecta.unidad || '') };
    else if (e.afecta && e.afecta.texto) afecta = { texto: String(e.afecta.texto) };
    var asunto = e.asunto && (e.asunto.nombre || e.asunto.numero) ? { numero: String(e.asunto.numero || ''), nombre: String(e.asunto.nombre || '') } : null;
    return {
      id: String(e.id || ''), de: String(e.de || ''), organo: String(e.organo || ''), cuando: String(e.cuando || ''),
      texto: String(e.texto || ''), afecta: afecta, paraCuando: String(e.paraCuando || ''),
      documentos: Array.isArray(e.documentos) ? e.documentos.map(String) : [],
      estado: ESTADOS.indexOf(e.estado) !== -1 ? e.estado : 'sin-atender',
      asunto: asunto, motivo: String(e.motivo || ''), atendidoPor: String(e.atendidoPor || ''), atendidoEl: String(e.atendidoEl || '')
    };
  }

  /* PURA. */
  function normalizar(leido) {
    var salida = { encargos: [] };
    var vistos = {};
    ((leido && Array.isArray(leido.encargos)) ? leido.encargos : []).forEach(function (x) {
      var e = limpioEncargo(x);
      if (!e.id || vistos[e.id]) return;
      vistos[e.id] = true;
      salida.encargos.push(e);
    });
    if (leido && Number(leido._esquema) > 0) salida._esquema = Number(leido._esquema);
    return salida;
  }

  /* PURA: dos listas de encargos fundidas por `id`. Si los dos lados cambian el mismo, gana el de `atendidoEl` más
     reciente, y uno atendido gana a uno sin atender. */
  function fundir(a, b) {
    var porId = {}, orden = [];
    (a.encargos || []).concat(b.encargos || []).forEach(function (e) {
      var antes = porId[e.id];
      if (!antes) { porId[e.id] = e; orden.push(e.id); return; }
      var atendidoAntes = antes.estado !== 'sin-atender', atendidoAhora = e.estado !== 'sin-atender';
      if (atendidoAhora !== atendidoAntes) { if (atendidoAhora) porId[e.id] = e; return; }
      if (String(e.atendidoEl) > String(antes.atendidoEl)) porId[e.id] = e;
    });
    return { encargos: orden.map(function (id) { return porId[id]; }) };
  }

  /* ---------- leer ---------- */

  function guardarEnMemoria(nuevo) {
    var h = JSON.stringify(nuevo.encargos);
    var cambio = h !== huella;
    huella = h;
    datos = nuevo;
    return cambio;
  }

  /* Al día con el disco. Devuelve true si algo ha cambiado desde la última vez. */
  async function releer() {
    var g = gestor();
    if (!g) return false;
    var leido = null;
    try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { return false; }
    ultimaLectura = Date.now();
    return guardarEnMemoria(normalizar(leido));
  }

  function lista() { return datos.encargos.slice(); }
  function porId(id) { return datos.encargos.filter(function (e) { return e.id === id; })[0] || null; }
  function sinAtender() { return datos.encargos.filter(function (e) { return e.estado === 'sin-atender'; }); }
  /* Los de un directivo, sin los retirados, del más nuevo al más viejo. */
  function deDirectivo(nombre) {
    return datos.encargos.filter(function (e) { return e.de === nombre && e.estado !== 'retirado'; })
      .sort(function (x, y) { return String(y.cuando).localeCompare(String(x.cuando)); });
  }

  function avisarCambio() {
    alCambiar.forEach(function (f) { try { f(); } catch (e) { /* una pantalla rota no tumba lo demás */ } });
  }

  /* ---------- escribir ---------- */

  /* La única puerta: un directivo escribe por `Perfil.escribir`; Administración, directo. En un ordenador marcado «solo
     consultar» manda «solo consultar» (las carpetas siguen envueltas y rechazan). */
  function escribir(fn) {
    var marcado = window.SoloConsulta && SoloConsulta.soloPorMarca && SoloConsulta.soloPorMarca();
    if (!marcado && window.Perfil && Perfil.esDirectivo()) return Perfil.escribir(fn);
    return fn(gestor());
  }

  /* Leer, cambiar y guardar, en la fila de este fichero. `hacer(actual)` muta `actual.encargos`. */
  function cambiar(hacer) {
    return escribir(function (g) {
      return App.enFila(FICHERO, async function () {
        var leido = null;
        try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { leido = null; }
        var actual = normalizar(leido);
        var r = await hacer(actual);
        await Copias.guardar(g, FICHERO, actual);
        guardarEnMemoria(actual);
        return r;
      });
    }).then(function (r) { avisarCambio(); return r; });
  }

  function dos(n) { return String(n).padStart(2, '0'); }
  function hueso(nombre) { return U.normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'x'; }
  /* Fecha y hora más el nombre: sin contador, dos ordenadores no pueden repartir el mismo. */
  function nuevoId(nombre) {
    var d = new Date();
    return String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate()) + '-' + dos(d.getHours()) + dos(d.getMinutes()) + dos(d.getSeconds()) + '-' + hueso(nombre);
  }

  function nombreSeguro(nombre, usados) {
    var limpio = String(nombre || 'documento').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() || 'documento';
    var punto = limpio.lastIndexOf('.');
    var base = punto > 0 ? limpio.slice(0, punto) : limpio, ext = punto > 0 ? limpio.slice(punto) : '';
    var n = limpio, i = 2;
    while (usados.indexOf(n) !== -1) n = base + ' (' + (i++) + ')' + ext;
    return n;
  }

  /* El directivo envía un encargo: sus documentos a su carpeta y el encargo a encargos.json.
     `o`: { texto, afecta, paraCuando, ficheros: [File] }. Devuelve el encargo. */
  async function enviar(o) {
    var id = nuevoId(App.E.usuario);
    var nombres = [];
    var e = {
      id: id, de: App.E.usuario, organo: (window.Perfil && Perfil.esDirectivo()) ? Perfil.textoDe(Perfil.organo()) : '',
      cuando: U.ahora(), texto: String(o.texto || '').trim(), afecta: o.afecta || null, paraCuando: o.paraCuando || '',
      documentos: nombres, estado: 'sin-atender', asunto: null, motivo: '', atendidoPor: '', atendidoEl: ''
    };
    await escribir(async function (g) {
      var ficheros = o.ficheros || [];
      if (ficheros.length) {
        var carpeta = await Carpetas.crear(await Carpetas.crear(g, CARPETA), id);
        for (var i = 0; i < ficheros.length; i++) {
          var nombre = nombreSeguro(ficheros[i].name, nombres);
          await Carpetas.escribirBytes(carpeta, nombre, await ficheros[i].arrayBuffer(), ficheros[i].type);
          nombres.push(nombre);
        }
      }
      try {
        await cambiar(function (d) { d.encargos.push(limpioEncargo(e)); });
      } catch (err) {
        if (ficheros.length) { try { await (await Carpetas.crear(g, CARPETA)).removeEntry(id, { recursive: true }); } catch (e2) { /* se queda: no estorba */ } }
        throw err;
      }
    });
    return e;
  }

  /* El directivo retira uno que nadie ha cogido. Devuelve false si ya no estaba sin atender. */
  async function retirar(id) {
    var hecho = false;
    await cambiar(function (d) {
      var e = d.encargos.filter(function (x) { return x.id === id; })[0];
      if (e && e.estado === 'sin-atender') { e.estado = 'retirado'; hecho = true; }
    });
    return hecho;
  }

  /* Administración: lo ha convertido en asunto (o guardado en uno). `asunto`: { nombre, numero }. */
  function marcarAsunto(id, asunto) {
    return cambiar(function (d) {
      d.encargos.forEach(function (e) {
        if (e.id !== id) return;
        e.estado = 'asunto'; e.asunto = { numero: String(asunto.numero || ''), nombre: asunto.nombre }; e.motivo = '';
        e.atendidoPor = App.E.usuario || ''; e.atendidoEl = U.ahora();
      });
    });
  }

  function noProcede(id, motivo) {
    return cambiar(function (d) {
      d.encargos.forEach(function (e) {
        if (e.id !== id) return;
        e.estado = 'no-procede'; e.motivo = String(motivo || '').trim(); e.asunto = null;
        e.atendidoPor = App.E.usuario || ''; e.atendidoEl = U.ahora();
      });
    });
  }

  /* Los documentos del encargo, ya fuera de su carpeta (para llevarlos a un asunto): [{ nombre, handle }]. */
  async function carpetaDe(id, crear) {
    var g = gestor();
    try { return await (await g.getDirectoryHandle(CARPETA)).getDirectoryHandle(id); }
    catch (e) { if (crear) throw e; return null; }
  }

  async function borrarCarpeta(id) {
    try { await (await gestor().getDirectoryHandle(CARPETA)).removeEntry(id, { recursive: true }); } catch (e) { /* ya no estaba */ }
  }

  /* ---------- el asunto de un encargo ---------- */

  /* { nombre, ficha, abierto } o null. Se busca por el número del asunto (no cambia al renombrar) y, si no lo tiene, por el nombre. */
  function asuntoDe(e) {
    if (!e || !e.asunto) return null;
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var clave = '';
    if (e.asunto.numero) Object.keys(registro).forEach(function (n) { if (!clave && registro[n] && registro[n].numero === e.asunto.numero) clave = n; });
    if (!clave && registro[e.asunto.nombre]) clave = e.asunto.nombre;
    if (!clave) return null;
    var abierto = (App.E.listaAbiertos || []).some(function (a) { return a.nombre === clave; });
    return { nombre: clave, ficha: registro[clave], abierto: abierto };
  }

  /* El hito por el que va: { n, m, titulo } (n y m cuentan los visibles) o null. */
  function hitoDe(nombre) {
    var porAsunto = window.Hitos && Hitos.ultimosLeidos && Hitos.ultimosLeidos() && Hitos.ultimosLeidos().porAsunto;
    var entrada = porAsunto && porAsunto[nombre];
    if (!entrada) return null;
    var vis = Hitos.visibles(entrada.hitos || []);
    if (!vis.length) return null;
    var i = -1;
    vis.forEach(function (h, k) { if (i === -1 && h.estado === 'encurso') i = k; });
    if (i === -1) vis.forEach(function (h, k) { if (i === -1 && h.estado === 'pendiente') i = k; });
    if (i === -1) i = vis.length - 1;
    return { n: i + 1, m: vis.length, titulo: vis[i].titulo };
  }

  /* ---------- lo que le pasa después al asunto (punto 5) ---------- */

  var CAMBIOS = {
    archivar: { de: ['asunto'], a: 'terminado', motivo: '' },
    reabrir: { de: ['terminado'], a: 'asunto', motivo: '' },
    papelera: { de: ['asunto', 'terminado'], a: 'no-procede', motivo: MOTIVO_BORRADO },
    recuperar: { de: ['no-procede'], a: 'asunto', motivo: '', soloMotivo: MOTIVO_BORRADO },
    recuperarArchivado: { de: ['no-procede'], a: 'terminado', motivo: '', soloMotivo: MOTIVO_BORRADO }
  };

  /* Lo llama quien archiva, reabre, borra o recupera un asunto (nunca la sesión del directivo). `ficha`: la del asunto, si ya no está en el registro. */
  async function alCambiarElAsunto(nombre, que, ficha) {
    var c = CAMBIOS[que];
    var f = ficha || (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[nombre]) || {};
    var ids = (Array.isArray(f.encargos) ? f.encargos : []).map(function (x) { return x && x.id; }).filter(Boolean);
    if (!c || !ids.length) return;
    try {
      await cambiar(function (d) {
        d.encargos.forEach(function (e) {
          if (ids.indexOf(e.id) === -1 || c.de.indexOf(e.estado) === -1) return;
          if (c.soloMotivo && e.motivo !== c.soloMotivo) return;
          e.estado = c.a; e.motivo = c.motivo; e.atendidoPor = App.E.usuario || ''; e.atendidoEl = U.ahora();
        });
      });
    } catch (e) { U.accesorio('No he podido poner al día los encargos de este asunto', e); }
  }

  /* El asunto cambia de nombre (cambiar, unir): el nombre guardado en el encargo se pone al día. */
  async function alMoverAsunto(viejo, nuevo) {
    if (!viejo || viejo === nuevo) return;
    var g = gestor();
    if (!g) return;
    var leido = null;
    try { leido = normalizar(await Carpetas.leerJson(g, FICHERO)); } catch (e) { return; }
    if (!leido.encargos.some(function (e) { return e.asunto && e.asunto.nombre === viejo; })) return;
    try {
      await cambiar(function (d) {
        d.encargos.forEach(function (e) { if (e.asunto && e.asunto.nombre === viejo) e.asunto.nombre = nuevo; });
      });
    } catch (e) { U.accesorio('No he podido poner al día el nombre del asunto en sus encargos', e); }
  }

  /* ---------- un conflicto de Dropbox en encargos.json: se funde por id ---------- */

  async function fusionarConflicto(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, FICHERO);
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || !Array.isArray(conflicto.encargos)) return false;
    var fusion = fundir(normalizar(real), normalizar(conflicto));
    var I = window.Conflictos && Conflictos._interno;
    if (I && I.conservarEsquemaMayor) I.conservarEsquemaMayor(fusion, real, conflicto);
    await App.enFila(FICHERO, function () { return Copias.guardar(g, FICHERO, fusion); });
    if (I && I.archivarConflicto) await I.archivarConflicto(g, nombreConflicto);
    await releer();
    return true;
  }

  /* ---------- el vistazo de siempre ---------- */

  /* Cada pasada del vistazo periódico (js/puente.js, `alRefrescar`): se relee el fichero (como mucho cada 15 s) y, si ha cambiado, se repintan las pantallas. */
  function alRefrescar() {
    if (!gestor() || Date.now() - ultimaLectura < 15000) return;
    ultimaLectura = Date.now();
    releer().then(function (cambio) { if (cambio) avisarCambio(); });
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  /* Textos de pantalla (palabras de docs/VOCABULARIO.md). */
  var TEXTO_ESTADO = { 'sin-atender': 'Sin atender', asunto: 'En marcha', terminado: 'Terminado', 'no-procede': 'No procede' };

  function fechaLegible(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  return {
    FICHERO: FICHERO, CARPETA: CARPETA, ESTADOS: ESTADOS, TEXTO_ESTADO: TEXTO_ESTADO, MOTIVO_BORRADO: MOTIVO_BORRADO,
    releer: releer, lista: lista, porId: porId, sinAtender: sinAtender, deDirectivo: deDirectivo,
    enviar: enviar, retirar: retirar, marcarAsunto: marcarAsunto, noProcede: noProcede, cambiar: cambiar, escribir: escribir,
    carpetaDe: carpetaDe, borrarCarpeta: borrarCarpeta, asuntoDe: asuntoDe, hitoDe: hitoDe,
    alCambiarElAsunto: alCambiarElAsunto, alMoverAsunto: alMoverAsunto, fusionarConflicto: fusionarConflicto,
    alCambiar: alCambiar, avisarCambio: avisarCambio, fechaLegible: fechaLegible,
    _normalizar: normalizar, _fundir: fundir, _nuevoId: nuevoId
  };
})();
window.Encargos = Encargos;
