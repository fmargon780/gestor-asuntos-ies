/* ============================================================
   datos-de-lista.js — datos propios de cada persona de un asunto de grupo,
   sacados de las columnas de la lista pegada (fila 722, 20-nov-2026,
   docs/722-DATOS-POR-PERSONA-EN-LA-LISTA.md; parte del tema 393).

   Al pegar la lista para formar el grupo (js/lista-pegada-pantalla.js), las
   columnas con cabecera se guardan en el asunto y sirven como datos distintos
   para cada persona en la plantilla de documento y en la de correo
   (`{campo:Columna}`), con el grupo «De la lista del asunto» en el editor.

   Dónde vive: `_GESTOR/datos-de-lista.json`, no en `asuntos.json` (un grupo de
   600 personas pesa) ni en la carpeta del asunto (saldría como documento):
     { asuntos: { <carpeta del asunto>: { columnas: [nombre…],
                                           personas: { 'CATEGORÍA|nombre': { columna: valor } } } } }
   Todo pasa por la cola por fichero (`App.enFila`) y `Copias.guardar`.

   Se lee de una vez y se guarda en memoria (`preparar`), para que
   `Plantillas.asuntoParaPersona`, que es síncrona, pueda ponerlos.
   Las columnas se comparan sin tildes ni mayúsculas (`U.normalizar`).
   ============================================================ */
var DatosDeLista = (function () {

  var FICHERO = 'datos-de-lista.json';
  var datos = { asuntos: {} };
  var ultimaLectura = 0;

  function gestor() { return window.Gestor && Gestor.carpetaGestor && Gestor.carpetaGestor(); }
  function clavePersona(categoria, nombre) { return String(categoria || '') + '|' + String(nombre || ''); }
  function norm(t) { return U.normalizar(String(t || '')); }

  /* PURA. */
  function normalizar(leido) {
    var salida = { asuntos: {} };
    var a = leido && leido.asuntos && typeof leido.asuntos === 'object' ? leido.asuntos : {};
    Object.keys(a).forEach(function (n) {
      var x = a[n] || {};
      var columnas = Array.isArray(x.columnas) ? x.columnas.map(String).filter(Boolean) : [];
      var personas = {};
      Object.keys(x.personas || {}).forEach(function (k) {
        var fila = {};
        Object.keys(x.personas[k] || {}).forEach(function (c) {
          var v = String(x.personas[k][c] === undefined || x.personas[k][c] === null ? '' : x.personas[k][c]).trim();
          if (v) fila[c] = v;
        });
        personas[k] = fila;
      });
      if (columnas.length) salida.asuntos[n] = { columnas: columnas, personas: personas };
    });
    return salida;
  }

  /* PURA. Une lo que trae una pegada (`{ columnas, personas: [{ categoria, nombre, datos }] }`) a lo ya guardado
     de un asunto (`{ columnas, personas }` o null). Una columna que ya estaba conserva su nombre; el valor nuevo de una
     persona sustituye al suyo, y las demás personas quedan como estaban. */
  function unir(actual, nuevo) {
    var salida = { columnas: ((actual && actual.columnas) || []).slice(), personas: {} };
    Object.keys((actual && actual.personas) || {}).forEach(function (k) { salida.personas[k] = Object.assign({}, actual.personas[k]); });
    var propio = {};
    salida.columnas.forEach(function (c) { propio[norm(c)] = c; });
    ((nuevo && nuevo.columnas) || []).forEach(function (c) { if (!propio[norm(c)]) { propio[norm(c)] = c; salida.columnas.push(c); } });
    ((nuevo && nuevo.personas) || []).forEach(function (p) {
      var k = clavePersona(p.categoria, p.nombre);
      var fila = salida.personas[k] = salida.personas[k] || {};
      ((nuevo && nuevo.columnas) || []).forEach(function (c) {
        delete fila[propio[norm(c)]];
        var v = String((p.datos || {})[c] || '').trim();
        if (v) fila[propio[norm(c)]] = v;
      });
    });
    return salida;
  }

  /* PURA. Dos pegadas seguidas (`{ columnas, personas: [{ categoria, nombre, datos }] }`) en una: las columnas se
     juntan y, de una persona repetida, vale la última. Una columna que la segunda pegada no trae no se pierde. */
  function unirPegadas(a, b) {
    var u = unir(null, a || { columnas: [], personas: [] });
    u = unir(u, b || { columnas: [], personas: [] });
    return { columnas: u.columnas, personas: Object.keys(u.personas).map(function (k) {
      var i = k.indexOf('|');
      return { categoria: k.slice(0, i), nombre: k.slice(i + 1), datos: u.personas[k] };
    }) };
  }

  /* PURA. Lo mismo, pero solo con las personas que se quedan en el grupo. */
  function soloDe(datosLista, miembros) {
    var quedan = {};
    (miembros || []).forEach(function (m) { quedan[clavePersona(m.categoria, m.nombre)] = true; });
    return { columnas: (datosLista && datosLista.columnas) || [],
      personas: ((datosLista && datosLista.personas) || []).filter(function (p) { return quedan[clavePersona(p.categoria, p.nombre)]; }) };
  }

  /* ---------- leer ---------- */

  async function releer() {
    var g = gestor();
    if (!g) return false;
    var leido = null;
    try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { return false; }
    ultimaLectura = Date.now();
    datos = normalizar(leido);
    return true;
  }

  /* Antes de armar los valores de una persona: el fichero, leído como mucho cada 15 segundos. */
  async function preparar() {
    if (Date.now() - ultimaLectura < 15000) return;
    await releer();
  }

  /* ---------- lo que se pregunta (síncrono, de memoria) ---------- */

  function delAsunto(nombre) { return datos.asuntos[nombre] || null; }

  /* Las columnas guardadas de un asunto, en el orden de la lista. */
  function columnasDe(nombre) { var x = delAsunto(nombre); return x ? x.columnas.slice() : []; }

  /* { columna: valor } de una persona de ese asunto; {} si no hay nada. */
  function de(nombreAsunto, categoria, nombre) {
    var x = delAsunto(nombreAsunto);
    return x && x.personas[clavePersona(categoria, nombre)] ? Object.assign({}, x.personas[clavePersona(categoria, nombre)]) : {};
  }

  /* Las columnas de todos los asuntos de grupo abiertos de un tipo (Ajustes, sin asunto delante). */
  function columnasDeTipo(tipo) {
    var vistas = {}, salida = [];
    var regs = (window.App && App.E && App.E.registro && App.E.registro.asuntos) || {};
    Object.keys(datos.asuntos).forEach(function (n) {
      if (regs[n] && regs[n].tipo !== tipo) return;
      datos.asuntos[n].columnas.forEach(function (c) { if (!vistas[norm(c)]) { vistas[norm(c)] = true; salida.push(c); } });
    });
    return salida;
  }

  /* ---------- escribir ---------- */

  function cambiar(hacer) {
    var g = gestor();
    if (!g) return Promise.reject(new Error('No hay carpeta de datos.'));
    return App.enFila(FICHERO, async function () {
      /* Si no se puede leer, no se escribe encima: se perdería lo que hubiera. */
      var actual = normalizar(await Carpetas.leerJson(g, FICHERO));
      var r = await hacer(actual);
      await Copias.guardar(g, FICHERO, actual);
      datos = actual;
      ultimaLectura = Date.now();
      return r;
    });
  }

  /* Guarda lo de una pegada en un asunto. Sin columnas no hace nada. */
  async function poner(nombreAsunto, datosLista) {
    if (!datosLista || !(datosLista.columnas || []).length) return false;
    await cambiar(function (d) { d.asuntos[nombreAsunto] = unir(d.asuntos[nombreAsunto], datosLista); });
    return true;
  }

  async function alMoverAsunto(viejo, nuevo) {
    if (!viejo || viejo === nuevo) return;
    var g = gestor();
    if (!g) return;
    try {
      var leido = normalizar(await Carpetas.leerJson(g, FICHERO));
      if (!leido.asuntos[viejo]) return;
      await cambiar(function (d) {
        if (!d.asuntos[viejo]) return;
        d.asuntos[nuevo] = d.asuntos[nuevo] ? unirTodo(d.asuntos[nuevo], d.asuntos[viejo]) : d.asuntos[viejo];
        delete d.asuntos[viejo];
      });
    } catch (e) { U.accesorio('No he podido poner al día los datos de la lista del asunto', e); }
  }

  function unirTodo(a, b) {
    var personas = Object.keys(b.personas).map(function (k) {
      var i = k.indexOf('|');
      return { categoria: k.slice(0, i), nombre: k.slice(i + 1), datos: b.personas[k] };
    });
    return unir(a, { columnas: b.columnas, personas: personas });
  }

  /* Una persona cambia de nombre o de Nº escolar: sus datos van con ella (js/tercero-renombrar.js). */
  async function alRenombrarPersona(asunto, categoria, viejo, nuevo) {
    var g = gestor();
    if (!g || viejo === nuevo) return;
    try {
      var leido = normalizar(await Carpetas.leerJson(g, FICHERO));
      var x = leido.asuntos[asunto];
      if (!x || !x.personas[clavePersona(categoria, viejo)]) return;
      await cambiar(function (d) {
        var y = d.asuntos[asunto];
        if (!y || !y.personas[clavePersona(categoria, viejo)]) return;
        y.personas[clavePersona(categoria, nuevo)] = y.personas[clavePersona(categoria, viejo)];
        delete y.personas[clavePersona(categoria, viejo)];
      });
    } catch (e) { U.accesorio('No he podido poner al día los datos de la lista de esa persona', e); }
  }

  /* Cada pasada del vistazo periódico: se relee el fichero (como mucho cada 15 s). */
  function alRefrescar() { if (gestor()) preparar(); }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  /* Al crear un asunto de grupo con la lista pegada, se guardan sus datos (accesorio, js/asuntos-nuevo-crear.js). */
  if (window.Gestor && Gestor.alCrearAsunto) {
    Gestor.alCrearAsunto.push(async function (nombre, datosAsunto, tercero) {
      var g = tercero && tercero.esGrupo && tercero.grupoDatos;
      if (!g || !g.datosLista) return;
      await poner(nombre, soloDe(g.datosLista, g.marcados));
    });
  }

  return {
    FICHERO: FICHERO, preparar: preparar, releer: releer, de: de, columnasDe: columnasDe, columnasDeTipo: columnasDeTipo,
    poner: poner, alMoverAsunto: alMoverAsunto, alRenombrarPersona: alRenombrarPersona,
    unir: unir, unirPegadas: unirPegadas, soloDe: soloDe, normalizar: normalizar
  };
})();
window.DatosDeLista = DatosDeLista;
