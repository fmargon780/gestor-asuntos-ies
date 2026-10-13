/* ============================================================
   repartir-nucleo.js — repartir un PDF entre terceros: las cuentas,
   sin disco ni pantalla (fila 141, 25-sep-2026,
   docs/REPARTIR-ENTRE-TERCEROS.md). Se prueban con `vm`.

   Un trozo es { desde, hasta } (páginas, contando desde 1, las dos
   incluidas), con `quedarse` (se queda en el asunto de origen) o
   `tercero` (el nombre del tercero, tal cual va en su carpeta), y
   `extra` si ha salido de páginas sobrantes.

   - proponer(total, primera, porTrozo): los trozos. Las páginas antes
     de `primera` forman uno propio, «Se queda en este asunto».
   - porTrozoPropuesto(total, primera, personas) y avisoDivision(...).
   - moverCorte(trozos, i, delta, total): +1/−1 al final del trozo i;
     los de debajo se recolocan con su largo; ninguno se queda en cero
     páginas (el que no cabe, fuera) y lo que sobra, un trozo más.
   - asignarPorOrden(trozos, nombres).
   - compararNombre(texto, persona) → 'verde' | 'ambar' | '' y
     leerTrozo(texto, personas) → { tercero, marca } o null.
   ============================================================ */
var RepartirNucleo = (function () {

  function entero(v, def) { var n = parseInt(v, 10); return isNaN(n) ? def : n; }
  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function copia(t) { return Object.assign({}, t); }

  function porTrozoPropuesto(total, primera, personas) {
    var quedan = total - limitar(entero(primera, 1), 1, total) + 1;
    if (!personas) return Math.max(1, quedan);
    return Math.max(1, Math.round(quedan / personas));
  }

  function avisoDivision(total, primera, personas) {
    var quedan = total - limitar(entero(primera, 1), 1, total) + 1;
    if (!personas || quedan % personas === 0) return '';
    return quedan + ' páginas no se reparten igual entre ' + personas +
      ' personas: puede que falte o sobre un cuestionario';
  }

  function proponer(total, primera, porTrozo) {
    total = Math.max(0, entero(total, 0));
    if (!total) return [];
    primera = limitar(entero(primera, 1), 1, total);
    porTrozo = Math.max(1, entero(porTrozo, 1));
    var trozos = [];
    if (primera > 1) trozos.push({ desde: 1, hasta: primera - 1, quedarse: true });
    for (var p = primera; p <= total; p += porTrozo) {
      trozos.push({ desde: p, hasta: Math.min(total, p + porTrozo - 1) });
    }
    return trozos;
  }

  function moverCorte(trozos, i, delta, total) {
    var salida = trozos.slice(0, i).map(copia);
    var t = copia(trozos[i]);
    t.hasta = limitar(t.hasta + delta, t.desde, total);
    salida.push(t);
    var p = t.hasta + 1;
    for (var j = i + 1; j < trozos.length && p <= total; j++) {
      var largo = trozos[j].hasta - trozos[j].desde + 1;
      var x = copia(trozos[j]);
      x.desde = p;
      x.hasta = Math.min(total, p + largo - 1);
      salida.push(x);
      p = x.hasta + 1;
    }
    if (p <= total) salida.push({ desde: p, hasta: total, extra: true });
    return salida;
  }

  function asignarPorOrden(trozos, nombres) {
    var k = 0;
    return trozos.map(function (t) {
      var x = copia(t);
      if (x.quedarse) return x;
      x.tercero = k < (nombres || []).length ? nombres[k] : '';
      k++;
      return x;
    });
  }

  /* ---------- los nombres ---------- */

  /* Sin tildes ni mayúsculas, solo letras y cifras; «M.ª», «Mª», «M.»
     como «María». */
  function normalizar(texto) {
    var t = String(texto || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
    t = t.replace(/[^a-z0-9ñ]+/g, ' ').trim();
    return t.split(' ').map(function (w) { return (w === 'm' || w === 'ma') ? 'maria' : w; }).join(' ');
  }

  /* «Apellido1 Apellido2, Nombre 1234567» → sus piezas. */
  var cachePiezas = {};
  function piezas(tercero) {
    var k = String(tercero || '');
    return cachePiezas[k] || (cachePiezas[k] = piezasDe(k));
  }
  function piezasDe(tercero) {
    var s = String(tercero || '');
    var coma = s.indexOf(',');
    var ap = coma === -1 ? '' : s.slice(0, coma);
    var resto = coma === -1 ? s : s.slice(coma + 1);
    var id = '';
    var m = resto.match(/\s([0-9][0-9A-Za-z]{3,})\s*$/);
    if (m) { id = m[1]; resto = resto.slice(0, m.index); }
    return { apellidos: normalizar(ap).split(' ').filter(Boolean), nombre: normalizar(resto).split(' ').filter(Boolean), id: id };
  }

  /* persona: { tercero, dni? } */
  function compararNombre(texto, persona) { return compararNorm(' ' + normalizar(texto) + ' ', persona); }

  /* Fila 342: lo mismo con el texto ya normalizado (entre espacios), para compararlo con muchas personas. */
  function compararNorm(norm, persona) {
    var p = piezas(persona && persona.tercero);
    function hay(w) { return norm.indexOf(' ' + w + ' ') !== -1; }
    if (p.id && hay(normalizar(p.id))) return 'verde';
    var dni = normalizar((persona && persona.dni) || '').replace(/ /g, '');
    if (dni && dni.length >= 6 && norm.replace(/ /g, '').indexOf(dni) !== -1) return 'verde';
    if (!p.nombre.length || !p.apellidos.length) return '';
    var nombre = p.nombre.every(hay);
    if (nombre && p.apellidos.every(hay)) return 'verde';
    if (nombre && hay(p.apellidos[0])) return 'ambar';
    return '';
  }

  /* De todas las personas, quién aparece en el texto del trozo. */
  function leerTrozo(texto, personas) {
    if (!String(texto || '').trim()) return null;
    var verdes = [], ambares = [];
    var norm = ' ' + normalizar(texto) + ' ';
    (personas || []).forEach(function (p) {
      var r = compararNorm(norm, p);
      if (r === 'verde') verdes.push(p.tercero); else if (r === 'ambar') ambares.push(p.tercero);
    });
    if (verdes.length === 1 && !ambares.length) return { tercero: verdes[0], marca: 'verde' };
    if (verdes.length + ambares.length === 0) return null;
    return { tercero: verdes[0] || ambares[0], marca: 'ambar' };
  }

  /* Fila 337: el tercero de un fichero suelto, por lo que dice su NOMBRE (sin la extensión), con la
     misma comparación que el texto de dentro. null si el nombre no lo resuelve. */
  function proponerPorNombre(nombreFichero, personas) {
    return leerTrozo(String(nombreFichero || '').replace(/\.[A-Za-z0-9]{1,5}$/, ''), personas);
  }

  /* ---------- cortar por alumno (fila 343, docs/REPARTIR-POR-NUMERO-ESCOLAR.md) ---------- */

  function plano(texto) { return String(texto || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  /* El Nº de identificación escolar que va junto a su etiqueta («Nº I. ESCOLAR», «Nº I.ESCOLAR», «Nº de
     identificación escolar»…), en la misma línea o justo debajo. En el bloque de la primera hoja
     («Nº EXPTE.: … Nº I.ESCOLAR:» y los números debajo, en el mismo orden) salta el del expediente. '' si no hay. */
  function numeroEtiquetado(texto) {
    var t = plano(texto);
    var re = /(?:\bn[o°.]*|\bnumero)\s*(?:de\s+)?(?:i\s*\.?\s*escolar|identificacion\s+escolar)\s*:?/g;
    var m = re.exec(t);
    if (!m) return '';
    var fin = m.index + m[0].length;
    var e = /\bn[o°.]*\s*(?:de\s+)?(?:expte?\b\.?|expediente)\s*:?/.exec(t);
    var despues = t.slice(fin).match(/\d{5,}/g) || [];
    if (e && e.index < m.index && !/\d{5,}/.test(t.slice(e.index + e[0].length, m.index))) return despues[1] || despues[0] || '';
    return despues[0] || '';
  }

  /* Lo que va junto a «APELLIDOS Y NOMBRE:» o a «APELLIDOS: … NOMBRE: …», como «Apellidos, Nombre». '' si no hay. */
  function nombreEtiquetado(texto) {
    var t = String(texto || '').replace(/\s+/g, ' ');
    var parar = '(?=\\s+(?:N[º°o]\\.?|NIF|DNI|FECHA|SEXO|EXPTE|DOMICILIO|LUGAR)(?![A-Za-z])|\\s*$|:)';
    var m = new RegExp('APELLIDOS\\s+Y\\s+NOMBRE\\s*:\\s*([^:]{3,80}?)' + parar, 'i').exec(t);
    if (m) return limpiaNombre(m[1]);
    m = new RegExp('APELLIDOS\\s*:\\s*([^:]{2,60}?)\\s+NOMBRE\\s*:\\s*([^:]{2,60}?)' + parar, 'i').exec(t);
    return m ? limpiaNombre(m[1].trim() + ', ' + m[2].trim()) : '';
  }
  function limpiaNombre(n) {
    n = n.trim().replace(/[\s.,;:]+$/, '');
    if (n && n === n.toUpperCase()) {
      n = n.toLowerCase().replace(/(^|[\s,-])([a-zñáéíóúü])/g, function (x, a, b) { return a + b.toUpperCase(); });
    }
    return n;
  }

  /* Quién es el de una página. `ctx`: { personas: [{ tercero, id }], porId: { id: persona } }.
     → { clave, tercero, marca: 'verde'|'ambar'|'nueva', enAlumnado, id, nombre } o null. 'nueva' = no está en el alumnado. */
  function identificarPagina(texto, ctx) {
    if (!String(texto || '').trim()) return null;
    var porId = (ctx && ctx.porId) || {};
    var etiquetado = numeroEtiquetado(texto);
    var conocidos = (String(texto).match(/\d{5,}/g) || []).filter(function (n) { return Object.prototype.hasOwnProperty.call(porId, n); });
    if (conocidos.length) {
      var id = conocidos.indexOf(etiquetado) !== -1 ? etiquetado : conocidos[0];
      return { clave: 'id:' + id, tercero: porId[id].tercero, marca: 'verde', enAlumnado: true, id: id };
    }
    var nombre = nombreEtiquetado(texto);
    if (etiquetado) {
      return { clave: 'id:' + etiquetado, tercero: nombre ? nombre + ' ' + etiquetado : '', marca: 'nueva', enAlumnado: false, id: etiquetado, nombre: nombre };
    }
    var r = leerTrozo(texto, (ctx && ctx.personas) || []);
    if (r) return { clave: 'nom:' + r.tercero, tercero: r.tercero, marca: r.marca, enAlumnado: true, id: '' };
    if (nombre) return { clave: 'nom:' + normalizar(nombre), tercero: nombre, marca: 'nueva', enAlumnado: false, id: '', nombre: nombre };
    return null;
  }

  /* Lo fijo de una página: su texto sin cifras ni fechas y sin las palabras del nombre del alumno. */
  function huella(texto, ident) {
    var quitar = {};
    if (ident && ident.tercero) normalizar(ident.tercero).split(' ').forEach(function (w) { quitar[w] = true; });
    var set = {};
    normalizar(String(texto || '').replace(/\d+/g, ' ')).split(' ').forEach(function (w) { if (w.length > 1 && !quitar[w]) set[w] = true; });
    return Object.keys(set);
  }

  function mismaHuella(a, b) {
    if (!a || !b || !a.length || !b.length) return false;
    var sb = {}, inter = 0;
    b.forEach(function (w) { sb[w] = true; });
    a.forEach(function (w) { if (sb[w]) inter++; });
    return inter / (a.length + b.length - inter) >= 0.9;
  }

  /* Los trozos por alumno. `paginas[i]` = { ident, huella } de la página i+1. null si menos del 80 % de las
     páginas tienen alumno (entonces, tamaño fijo). Un trozo nuevo empieza donde cambia el alumno y donde, con el
     mismo alumno, la página tiene la misma huella que la primera del trozo en curso. Las páginas sin alumno siguen
     al trozo anterior; las de delante forman «Se queda en este asunto». */
  function proponerPorAlumno(paginas) {
    var total = (paginas || []).length;
    if (!total) return null;
    var con = paginas.filter(function (p) { return p && p.ident; }).length;
    if (!con || con / total < 0.8) return null;
    var trozos = [], cur = null, primero = -1;
    for (var i = 0; i < total; i++) {
      var p = paginas[i];
      var id = p && p.ident;
      if (primero === -1) { if (!id) continue; primero = i; if (i > 0) trozos.push({ desde: 1, hasta: i, quedarse: true }); }
      var nuevo = !cur || (id && (id.clave !== cur.clave || mismaHuella(p.huella, cur.huella)));
      if (nuevo) {
        cur = { desde: i + 1, hasta: i + 1, clave: id.clave, huella: p.huella, ident: id };
        trozos.push(cur);
      } else cur.hasta = i + 1;
    }
    var salida = [], previo = null, porId = 0, porNombre = 0, alumnos = 0;
    trozos.forEach(function (t) {
      if (t.quedarse) { salida.push(t); return; }
      alumnos++;
      if (t.clave.indexOf('id:') === 0) porId++; else porNombre++;
      var x = { desde: t.desde, hasta: t.hasta, tercero: t.ident.tercero || '' };
      var marca = t.ident.marca;
      if (previo && previo.clave === t.clave && x.tercero) marca = 'mismo';
      if (x.tercero) x.lectura = { tercero: x.tercero, marca: marca };
      previo = t;
      salida.push(x);
    });
    return { trozos: salida, cuantos: alumnos, por: porId >= porNombre ? 'número escolar' : 'nombre' };
  }

  function textoPaginas(t) { return t.desde === t.hasta ? 'Página ' + t.desde : 'Páginas ' + t.desde + '–' + t.hasta; }

  return {
    porTrozoPropuesto: porTrozoPropuesto, avisoDivision: avisoDivision, proponer: proponer,
    moverCorte: moverCorte, asignarPorOrden: asignarPorOrden, normalizar: normalizar, piezas: piezas,
    compararNombre: compararNombre, leerTrozo: leerTrozo,
    numeroEtiquetado: numeroEtiquetado, nombreEtiquetado: nombreEtiquetado, identificarPagina: identificarPagina,
    huella: huella, proponerPorAlumno: proponerPorAlumno, proponerPorNombre: proponerPorNombre, textoPaginas: textoPaginas
  };
})();
if (typeof window !== 'undefined') window.RepartirNucleo = RepartirNucleo;
