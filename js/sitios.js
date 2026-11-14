/* ============================================================
   sitios.js — «Dónde se hace» de una tarea: el mapa de sitios y sus zonas
   (fila 659, docs/659-DONDE-SE-HACE-Y-NOMBRES.md, tema 650 parte 3).

   Una tarea dice QUÉ se hace (su acción) y, aparte, DÓNDE se hace: un sitio
   (Séneca, iPasen, Correo electrónico, En mano…) y, si el sitio tiene zonas,
   una zona (Séneca → Alumnado). La tarea guarda `donde: { sitio, zona? }` por
   `id`, no por nombre: cambiar el nombre de un sitio no toca ninguna tarea.

   Fichero de datos `_GESTOR/sitios.json`:
     { version: 1, sitios: [{ id, nombre, zonas: [{ id, nombre }] }], borrados: [ids] }
   Si no existe, vale la lista de partida (`PARTIDA`, los mismos `id` siempre).
   Un sitio o una zona borrados llevan lápida (`borrados`) para que otro
   ordenador con una copia vieja no los devuelva.

   Esta parte es pura (sin disco ni pantalla) y guarda en memoria lo último
   leído (`datos()`: lo leído, o la lista de partida mientras no se lee).
   Guardar: js/sitios-guardado.js; la ventana: js/sitios-ventana.js; la
   casilla de las tareas: js/donde-campo.js.
   ============================================================ */
var Sitios = (function () {

  /* Los `id` de los sitios que el programa necesita reconocer aunque cambien de nombre. */
  var ID_CORREO = 'st-correo', ID_IPASEN = 'st-ipasen';

  function sitio(id, nombre, zonas) {
    return { id: id, nombre: nombre, zonas: (zonas || []).map(function (z) { return { id: 'zn-' + id.slice(3) + '-' + z[0], nombre: z[1] }; }) };
  }
  var PARTIDA = [
    sitio('st-seneca', 'Séneca', [['alumnado', 'Alumnado'], ['personal', 'Personal'], ['registro', 'Registro'], ['documentos', 'Documentos'], ['ventanilla', 'Ventanilla Electrónica']]),
    sitio(ID_IPASEN, 'iPasen'), sitio(ID_CORREO, 'Correo electrónico'), sitio('st-postal', 'Correo postal'),
    sitio('st-telefono', 'Teléfono'), sitio('st-en-mano', 'En mano'), sitio('st-tablon', 'Tablón'),
    sitio('st-expediente', 'Expediente del alumno'), sitio('st-archivo', 'Archivo del centro'), sitio('st-app', 'En esta app')
  ];

  /* El sitio que propone cada acción al elegirla (las que no están, no proponen). */
  var PROPUESTA = {
    registrar: 'Séneca · Registro', seneca: 'Séneca · Alumnado', llamar: 'Teléfono',
    entregar: 'En mano', recoger: 'En mano', cobrar: 'En mano', publicar: 'Tablón', comunicar: 'Correo electrónico',
    generar: 'En esta app', anadir: 'En esta app', pedir: 'En esta app', copiar: 'En esta app'
  };

  /* Qué datos más lleva la tarea según su acción: «Qué documento» o «A quién». */
  var CON_DOCUMENTO = ['registrar', 'firmar', 'anadir'];
  var CON_A_QUIEN = ['llamar'];

  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function norm(t) { return (window.U && U.normalizar) ? U.normalizar(String(t || '')) : String(t || '').toLowerCase().trim(); }
  function nuevoId(p) { return (window.U && U.nuevoId) ? U.nuevoId(p) : p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- el fichero ---------- */

  function partida() { return { version: 1, sitios: copia(PARTIDA), borrados: [] }; }

  function normalizar(leido) {
    if (!leido || !Array.isArray(leido.sitios)) return partida();
    var borrados = (Array.isArray(leido.borrados) ? leido.borrados : []).filter(function (x) { return typeof x === 'string'; });
    var vistos = {};
    function nuevo(i) { var v = i || nuevoId('st'); while (vistos[v]) v = nuevoId('st'); vistos[v] = true; return v; }
    var sitios = [];
    leido.sitios.forEach(function (s) {
      var nombre = String((s && s.nombre) || '').trim();
      if (!nombre || (s.id && borrados.indexOf(s.id) !== -1)) return;
      var zonas = [];
      ((s && s.zonas) || []).forEach(function (z) {
        var n = String((z && z.nombre) || '').trim();
        if (!n || (z.id && borrados.indexOf(z.id) !== -1)) return;
        zonas.push({ id: nuevo(z.id), nombre: n });
      });
      sitios.push({ id: nuevo(s.id), nombre: nombre, zonas: zonas });
    });
    return { version: 1, sitios: sitios, borrados: borrados };
  }

  /* ---------- lo último leído ---------- */

  var cache = null;
  function datos() { return cache || partida(); }
  function poner(d) { cache = normalizar(d); return cache; }

  /* ---------- un «dónde» ---------- */

  /* { sitio, zona? } limpio, o null si no dice nada. */
  function normalizarDonde(d) {
    var sitio = String((d && d.sitio) || '');
    if (!sitio) return null;
    var o = { sitio: sitio };
    if (d.zona) o.zona = String(d.zona);
    return o;
  }
  function igualDonde(a, b) {
    a = normalizarDonde(a); b = normalizarDonde(b);
    return (a ? a.sitio + '|' + (a.zona || '') : '') === (b ? b.sitio + '|' + (b.zona || '') : '');
  }

  function buscarSitio(d, id) { return (d.sitios || []).filter(function (s) { return s.id === id; })[0] || null; }

  /* «Séneca · Alumnado»; '' si el sitio ya no está. Una zona que ya no está se queda en el sitio. */
  function textoDe(d, donde) {
    donde = normalizarDonde(donde);
    if (!donde) return '';
    var s = buscarSitio(d, donde.sitio);
    if (!s) return '';
    var z = donde.zona ? s.zonas.filter(function (x) { return x.id === donde.zona; })[0] : null;
    return s.nombre + (z ? ' · ' + z.nombre : '');
  }

  /* Todas las opciones, en el orden del mapa: cada sitio y, debajo, sus zonas. */
  function opciones(d) {
    var lista = [];
    (d.sitios || []).forEach(function (s) {
      lista.push({ texto: s.nombre, donde: { sitio: s.id } });
      s.zonas.forEach(function (z) { lista.push({ texto: s.nombre + ' · ' + z.nombre, donde: { sitio: s.id, zona: z.id } }); });
    });
    return lista;
  }

  /* Lo que se ha escrito, como «dónde»; null si no es ninguno de los que hay. */
  function deTexto(d, texto) {
    var t = norm(texto).replace(/\s*·\s*/g, ' · ');
    if (!t) return null;
    var o = opciones(d).filter(function (x) { return norm(x.texto) === t; })[0];
    return o ? copia(o.donde) : null;
  }

  /* El «dónde» que propone una acción, con los sitios que haya ahora; null si no propone. */
  function propuesto(d, accion) {
    var t = PROPUESTA[accion || ''];
    return t ? deTexto(d, t) : null;
  }

  /* Enviar: lo que hace el botón según el sitio. 'correo' (prepara el correo), 'seneca' (prepara el mensaje de iPasen)
     o '' (otro sitio: no envía nada, se marca a mano). `nulo`: lo que vale una tarea sin sitio. */
  function canalDeSitio(donde) {
    donde = normalizarDonde(donde);
    if (!donde) return null;
    if (donde.sitio === ID_CORREO) return 'correo';
    if (donde.sitio === ID_IPASEN) return 'seneca';
    return '';
  }

  /* El canal de una tarea de Enviar: el que dice su sitio ('correo', 'seneca' o '' si no envía nada); sin sitio, el de su vía de antes
     (o null si tampoco la tiene: se decide como siempre, por el asunto). */
  function canalDeTarea(g) {
    var c = canalDeSitio(g && g.donde);
    if (c !== null) return c;
    return (g && g.receta && g.receta.via) || null;
  }

  /* El «dónde» de una tarea que aún no lo tiene: el que dice su vía de antes (correo → Correo electrónico; mensaje de Séneca → iPasen). */
  function deLaVia(accion, receta) {
    var via = receta && receta.via;
    if (accion !== 'comunicar' || (via !== 'seneca' && via !== 'correo')) return null;
    return { sitio: via === 'seneca' ? ID_IPASEN : ID_CORREO };
  }

  /* El «dónde» que vale de una tarea: el suyo o, si no lo tiene, el que sale de su vía. */
  function dondeDe(g) {
    return normalizarDonde(g && g.donde) || deLaVia(g && g.accion, g && g.receta);
  }

  function usaDocumento(accion) { return CON_DOCUMENTO.indexOf(accion || '') !== -1; }
  function usaAQuien(accion) { return CON_A_QUIEN.indexOf(accion || '') !== -1; }

  /* Lo que lleva una tarea además de su acción: `donde`, y `tipoDocumento` o `aQuien` solo si su acción los pide. */
  function limpiarDatos(accion, x) {
    var o = {}, d = normalizarDonde(x && x.donde);
    if (d) o.donde = d;
    if (usaDocumento(accion) && x && String(x.tipoDocumento || '').trim()) o.tipoDocumento = String(x.tipoDocumento).trim();
    if (usaAQuien(accion) && x && String(x.aQuien || '').trim()) o.aQuien = String(x.aQuien).trim();
    return o;
  }
  /* Pone `limpiarDatos` en la línea `g` (y quita lo que no toca). */
  function aplicarDatos(g, accion, x) {
    delete g.donde; delete g.tipoDocumento; delete g.aQuien;
    return Object.assign(g, limpiarDatos(accion, x));
  }

  /* ---------- cuántas tareas usan cada sitio ---------- */

  /* `lineas`: tareas con `donde`. Devuelve { sitio: n, 'sitio|zona': n }. Un sitio cuenta también las de sus zonas. */
  function cuentas(lineas) {
    var r = {};
    (lineas || []).forEach(function (g) {
      var d = normalizarDonde(g && g.donde);
      if (!d) return;
      r[d.sitio] = (r[d.sitio] || 0) + 1;
      if (d.zona) r[d.sitio + '|' + d.zona] = (r[d.sitio + '|' + d.zona] || 0) + 1;
    });
    return r;
  }

  /* ---------- cambiar el mapa (siempre devuelven un mapa nuevo) ---------- */

  function renombrar(d, id, nombre) {
    var n = copia(d);
    nombre = String(nombre || '').trim();
    if (!nombre) return n;
    n.sitios.forEach(function (s) {
      if (s.id === id) s.nombre = nombre;
      s.zonas.forEach(function (z) { if (z.id === id) z.nombre = nombre; });
    });
    return n;
  }

  /* Un sitio nuevo, o una zona nueva de `sitioId`. Devuelve { datos, donde }. */
  function anadir(d, nombre, sitioId) {
    var n = copia(d);
    nombre = String(nombre || '').trim();
    if (sitioId) {
      var s = buscarSitio(n, sitioId);
      if (!s) return { datos: n, donde: null };
      var z = { id: nuevoId('zn'), nombre: nombre };
      s.zonas.push(z);
      return { datos: n, donde: { sitio: s.id, zona: z.id } };
    }
    var nuevo = { id: nuevoId('st'), nombre: nombre, zonas: [] };
    n.sitios.push(nuevo);
    return { datos: n, donde: { sitio: nuevo.id } };
  }

  /* Los «dónde» que dejan de existir al borrar `id` (un sitio entero con sus zonas, o una zona): [{ sitio, zona? }]. */
  function dondesDe(d, id) {
    var lista = [];
    (d.sitios || []).forEach(function (s) {
      if (s.id === id) { lista.push({ sitio: s.id }); s.zonas.forEach(function (z) { lista.push({ sitio: s.id, zona: z.id }); }); }
      else s.zonas.forEach(function (z) { if (z.id === id) lista.push({ sitio: s.id, zona: z.id }); });
    });
    return lista;
  }

  /* Borrar. Devuelve { datos, quitados: [ids], pasan: función(donde) → el «dónde» nuevo }.
     `destino`: a dónde pasan las tareas que lo usaban ({ sitio, zona? } o null: se quedan sin sitio). */
  function quitar(d, id, destino) {
    var n = copia(d), quitados = [id];
    var s = buscarSitio(n, id);
    if (s) { s.zonas.forEach(function (z) { quitados.push(z.id); }); n.sitios = n.sitios.filter(function (x) { return x.id !== id; }); }
    else n.sitios.forEach(function (x) { x.zonas = x.zonas.filter(function (z) { return z.id !== id; }); });
    n.borrados = (n.borrados || []).concat(quitados.filter(function (q) { return (n.borrados || []).indexOf(q) === -1; }));
    function pasan(donde) {
      var dd = normalizarDonde(donde);
      if (!dd) return null;
      if (quitados.indexOf(dd.sitio) !== -1 || (dd.zona && quitados.indexOf(dd.zona) !== -1)) return normalizarDonde(destino);
      return dd;
    }
    return { datos: n, quitados: quitados, pasan: pasan };
  }

  /* Los sitios y zonas que se parecen al nombre escrito: el mismo (con o sin el sitio delante) primero y, detrás, los que comparten
     palabras largas (más palabras en común, antes). */
  function parecidos(d, nombre) {
    var a = norm(nombre);
    if (!a) return [];
    function palabras(t) { return t.split(/[^a-z0-9ñ]+/).filter(function (p) { return p.length > 3; }); }
    var pa = palabras(a);
    var puntuadas = [];
    opciones(d).forEach(function (o) {
      var completo = norm(o.texto).replace(/\s*·\s*/g, ' '), ultimo = norm(o.texto.split(' · ').slice(-1)[0]), puntos = 0;
      if (completo === a || ultimo === a) puntos = 100;
      else {
        var pb = palabras(completo);
        puntos = pa.filter(function (p) { return pb.indexOf(p) !== -1; }).length * 10;
        if (!puntos && a.length > 3 && ultimo.length > 3 && (ultimo.indexOf(a) !== -1 || a.indexOf(ultimo) !== -1)) puntos = 5;
      }
      if (puntos) puntuadas.push({ o: o, puntos: puntos, i: puntuadas.length });
    });
    puntuadas.sort(function (x, y) { return y.puntos - x.puntos || x.i - y.i; });
    return puntuadas.map(function (x) { return x.o; });
  }

  return {
    PARTIDA: PARTIDA, PROPUESTA: PROPUESTA, ID_CORREO: ID_CORREO, ID_IPASEN: ID_IPASEN,
    partida: partida, normalizar: normalizar, datos: datos, poner: poner,
    normalizarDonde: normalizarDonde, igualDonde: igualDonde, textoDe: textoDe, opciones: opciones, deTexto: deTexto,
    propuesto: propuesto, canalDeSitio: canalDeSitio, canalDeTarea: canalDeTarea, deLaVia: deLaVia, dondeDe: dondeDe,
    usaDocumento: usaDocumento, usaAQuien: usaAQuien, limpiarDatos: limpiarDatos, aplicarDatos: aplicarDatos,
    cuentas: cuentas, renombrar: renombrar, anadir: anadir, dondesDe: dondesDe, quitar: quitar, parecidos: parecidos
  };
})();
window.Sitios = Sitios;
