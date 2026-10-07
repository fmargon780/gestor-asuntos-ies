/* ============================================================
   conflictos-diferencias.js — «Qué cambia» (fila 292,
   docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartado 4).

   Cuando dos ordenadores guardan a la vez y la app no puede unir las dos
   versiones sola (js/conflictos.js), la tarjeta «N cosas se guardaron a la
   vez en dos ordenadores» enseña, antes de elegir, de cuándo es cada versión
   y en qué se diferencian, en palabras y con nombres. SOLO SE LEE: nada se
   escribe.

     ConflictosDiferencias.describir(g, { real, nombreConflicto })
       -> { cuando: ['…', '…'], lineas: ['…'], mas: N, igual: bool, sinDetalle: bool }

   Se sabe contar la diferencia de: una lista de nombres, una lista de cosas con
   identificador (id, tipo, nombre o clave), el tablón, la lista de asuntos y los
   hitos. De lo demás solo se dice si las dos versiones dicen lo mismo; si no,
   «No se puede enseñar la diferencia de este fichero.»
   ============================================================ */
var ConflictosDiferencias = (function () {

  var MAXIMO = 10;
  var LLAVES = ['id', 'tipo', 'nombre', 'clave'];
  var CAMPOS = { situacion: 'hito actual', estado: 'estado', tercero: 'tercero', tipo: 'tipo', descripcion: 'descripción',
    limite: 'fecha límite', categoria: 'categoría', reservado: 'reservado', texto: 'texto', titulo: 'título' };

  function norm(v) { return JSON.stringify(v, function (k, x) { return k === '_esquema' ? undefined : x; }); }
  function corto(t) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > 60 ? t.slice(0, 57) + '…' : t; }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function llaveDe(x) {
    if (x === null || typeof x !== 'object') return String(x);
    for (var i = 0; i < LLAVES.length; i++) if (x[LLAVES[i]]) return String(x[LLAVES[i]]);
    return null;
  }
  function etiquetaDe(x) {
    if (x === null || typeof x !== 'object') return String(x);
    return corto(x.nombre || x.titulo || x.texto || x.tipo || x.id || x.clave || '');
  }

  /* Cómo se llaman, en palabras, los campos que cambian de una cosa a otra. */
  function loQueCambia(a, b) {
    var partes = [];
    var claves = Object.keys(Object.assign({}, a, b)).filter(function (k) { return k !== '_esquema'; });
    claves.forEach(function (k) {
      if (norm(a[k]) === norm(b[k])) return;
      if (k === 'notas' && (Array.isArray(a[k]) || Array.isArray(b[k]))) {
        var ids = {};
        (a[k] || []).forEach(function (n) { ids[llaveDe(n) || norm(n)] = 1; });
        var otras = (b[k] || []).filter(function (n) { return !ids[llaveDe(n) || norm(n)]; }).length +
          (a[k] || []).filter(function (n) { var q = llaveDe(n) || norm(n); return !(b[k] || []).some(function (m) { return (llaveDe(m) || norm(m)) === q; }); }).length;
        partes.push(plural(otras || 1, 'nota', 'notas'));
      } else if (CAMPOS[k]) partes.push(CAMPOS[k]);
    });
    return partes;
  }

  /* Dos listas con identificador (o de nombres sueltos). `unidad`: cómo se llama cada cosa al decirlo. */
  function compararListas(mias, otras, lineas) {
    var mapaO = {}, mapaA = {};
    (otras || []).forEach(function (x, i) { var k = llaveDe(x); mapaO[k === null ? '#' + i : k] = x; });
    (mias || []).forEach(function (x, i) { var k = llaveDe(x); mapaA[k === null ? '#' + i : k] = x; });
    Object.keys(mapaA).forEach(function (k) {
      if (!(k in mapaO)) lineas.push('Solo en este ordenador: ' + etiquetaDe(mapaA[k]));
    });
    Object.keys(mapaO).forEach(function (k) {
      if (!(k in mapaA)) lineas.push('Solo en el otro: ' + etiquetaDe(mapaO[k]));
    });
    Object.keys(mapaA).forEach(function (k) {
      if (!(k in mapaO) || norm(mapaA[k]) === norm(mapaO[k])) return;
      var que = (typeof mapaA[k] === 'object' && mapaA[k]) ? loQueCambia(mapaA[k], mapaO[k]) : [];
      lineas.push('Distinto: ' + etiquetaDe(mapaA[k]) + (que.length ? ' — ' + que.join(', ') : ''));
    });
  }

  /* Lo mismo para un objeto con un mapa de cosas por nombre (la lista de asuntos, los hitos de cada asunto). */
  function compararMapas(a, b, lineas, hitos) {
    a = a || {}; b = b || {};
    Object.keys(a).forEach(function (k) { if (!(k in b)) lineas.push('Solo en este ordenador: ' + corto(k)); });
    Object.keys(b).forEach(function (k) { if (!(k in a)) lineas.push('Solo en el otro: ' + corto(k)); });
    Object.keys(a).forEach(function (k) {
      if (!(k in b) || norm(a[k]) === norm(b[k])) return;
      if (hitos) {
        var tmp = [];
        compararListas(a[k].hitos, b[k].hitos, tmp);
        if (!tmp.length) return;
        tmp.forEach(function (t) { lineas.push(t.replace(/^(Solo en este ordenador|Solo en el otro|Distinto): /, '$1: ' + corto(k) + ', hito ')); });
      } else {
        var que = loQueCambia(a[k] || {}, b[k] || {});
        lineas.push('Distinto: ' + corto(k) + (que.length ? ' — ' + que.join(', ') : ''));
      }
    });
  }

  /* La parte que se compara: la lista (o el mapa) que lleva el fichero. */
  function comparar(real, nombreReal, mio, otro) {
    var lineas = [];
    if (norm(mio) === norm(otro)) return { igual: true, lineas: lineas };
    if (Array.isArray(mio) && Array.isArray(otro)) { compararListas(mio, otro, lineas); return { igual: !lineas.length, lineas: lineas }; }
    if (mio && otro && typeof mio === 'object' && typeof otro === 'object') {
      if (mio.asuntos && otro.asuntos) compararMapas(mio.asuntos, otro.asuntos, lineas, false);
      else if (mio.porAsunto && otro.porAsunto) compararMapas(mio.porAsunto, otro.porAsunto, lineas, true);
      else {
        var listas = Object.keys(mio).filter(function (k) { return Array.isArray(mio[k]) && Array.isArray(otro[k]); });
        if (listas.length === 1) compararListas(mio[listas[0]], otro[listas[0]], lineas);
        else return { sinDetalle: true, lineas: lineas };
      }
      return lineas.length ? { igual: false, lineas: lineas } : { igual: false, sinDetalle: true, lineas: lineas };
    }
    return { sinDetalle: true, lineas: lineas };
  }

  function cuandoEs(ms) {
    if (!ms) return 'no se sabe cuándo';
    try {
      return new Date(ms).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); }
  }

  /* «asuntos (copia en conflicto de PC2 2026-09-11).json» -> «PC2» */
  function quienEs(nombreConflicto) {
    var m = String(nombreConflicto).match(/conflicto de (.+?)\s+\d{4}-\d{2}-\d{2}/i) ||
      String(nombreConflicto).match(/\((.+?)(?:'s| s)?\s+conflicted copy/i);
    return m ? m[1].trim() : '';
  }

  async function fecha(g, nombre) {
    try { return (await (await g.getFileHandle(nombre)).getFile()).lastModified; } catch (e) { return 0; }
  }

  async function describir(g, p) {
    var salida = { cuando: [], lineas: [], mas: 0, igual: false, sinDetalle: false };
    var quien = quienEs(p.nombreConflicto);
    salida.cuando.push('La de este ordenador: ' + cuandoEs(await fecha(g, p.real)));
    salida.cuando.push('La del otro' + (quien ? ' (' + quien + ')' : '') + ': ' + cuandoEs(await fecha(g, p.nombreConflicto)));
    var mio, otro;
    try {
      mio = await Carpetas.leerJson(g, p.real);
      otro = JSON.parse(await Carpetas.leerTexto(g, p.nombreConflicto));
    } catch (e) { salida.sinDetalle = true; salida.lineas = ['No se puede enseñar la diferencia de este fichero.']; return salida; }
    var r = comparar(null, p.real, mio, otro);
    if (r.igual) { salida.igual = true; salida.lineas = ['Las dos dicen lo mismo.']; return salida; }
    if (r.sinDetalle) { salida.sinDetalle = true; salida.lineas = ['No se puede enseñar la diferencia de este fichero.']; return salida; }
    salida.lineas = r.lineas.slice(0, MAXIMO);
    salida.mas = Math.max(0, r.lineas.length - MAXIMO);
    return salida;
  }

  return { describir: describir, comparar: comparar, quienEs: quienEs, MAXIMO: MAXIMO };
})();
window.ConflictosDiferencias = ConflictosDiferencias;
