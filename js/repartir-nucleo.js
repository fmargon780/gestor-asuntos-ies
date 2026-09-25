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
  function piezas(tercero) {
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
  function compararNombre(texto, persona) {
    var norm = ' ' + normalizar(texto) + ' ';
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
    (personas || []).forEach(function (p) {
      var r = compararNombre(texto, p);
      if (r === 'verde') verdes.push(p.tercero); else if (r === 'ambar') ambares.push(p.tercero);
    });
    if (verdes.length === 1 && !ambares.length) return { tercero: verdes[0], marca: 'verde' };
    if (verdes.length + ambares.length === 0) return null;
    return { tercero: verdes[0] || ambares[0], marca: 'ambar' };
  }

  function textoPaginas(t) { return t.desde === t.hasta ? 'Página ' + t.desde : 'Páginas ' + t.desde + '–' + t.hasta; }

  return {
    porTrozoPropuesto: porTrozoPropuesto, avisoDivision: avisoDivision, proponer: proponer,
    moverCorte: moverCorte, asignarPorOrden: asignarPorOrden, normalizar: normalizar, piezas: piezas,
    compararNombre: compararNombre, leerTrozo: leerTrozo, textoPaginas: textoPaginas
  };
})();
if (typeof window !== 'undefined') window.RepartirNucleo = RepartirNucleo;
