/* ============================================================
   campos-pasos.js — los pasos de un campo creado a partir de otros
   (fila 529, docs/529-CREAR-CAMPOS-POR-PASOS.md).

   Un campo creado así parte de otro campo y le aplica una lista de
   pasos, uno detrás de otro: el resultado de cada paso es el valor de
   partida del siguiente. Este fichero es solo la cuenta, sin nada de
   interfaz (se prueba sola, pruebas/campos-pasos.mjs): cada paso es
   `{ op: '...', ...datos }` y `aplicar(paso, valor, ctx)` da el valor
   nuevo.

   `ctx` lo pone quien llama (js/campos-calculo.js):
     otro(origen)   -> el valor, en texto, de otro campo de la persona
     festivos       -> fechas ISO de festivo (Ajustes › Hitos)
     hoy            -> fecha ISO de hoy (para la edad); por defecto, la de verdad

   Los pasos que no se pueden hacer (una fecha que no es fecha, una
   cuenta con algo que no es un número) dan vacío, nunca un error.
   Los viejos calculados de una sola operación se leen como una lista
   de un paso (`deLegado`), con el mismo resultado de siempre.
   ============================================================ */
var CamposPasos = (function () {

  function limpiar(v) { return String(v == null ? '' : v).trim(); }
  function dd(n) { return String(n).padStart(2, '0'); }

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  /* ---------- fechas: se leen DD/MM/AAAA y AAAA-MM-DD, se escribe DD/MM/AAAA ---------- */

  function leerFecha(t) {
    var v = limpiar(t);
    var m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/), a, me, d;
    if (m) { d = +m[1]; me = +m[2]; a = +m[3]; }
    else {
      m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (!m) return null;
      a = +m[1]; me = +m[2]; d = +m[3];
    }
    var f = new Date(a, me - 1, d);
    return (f.getFullYear() === a && f.getMonth() === me - 1 && f.getDate() === d) ? f : null;
  }
  function escribirFecha(f) { return dd(f.getDate()) + '/' + dd(f.getMonth() + 1) + '/' + f.getFullYear(); }
  function aIso(f) { return f.getFullYear() + '-' + dd(f.getMonth() + 1) + '-' + dd(f.getDate()); }

  function sumarHabiles(f, n, festivos) {
    var fest = {};
    (festivos || []).forEach(function (x) { fest[String(x)] = true; });
    var paso = n < 0 ? -1 : 1, resto = Math.abs(n);
    while (resto > 0) {
      f.setDate(f.getDate() + paso);
      if (f.getDay() !== 0 && f.getDay() !== 6 && !fest[aIso(f)]) resto--;
    }
    return f;
  }
  function sumarMeses(f, n) {
    var dia = f.getDate();
    var destino = new Date(f.getFullYear(), f.getMonth() + n, 1);
    destino.setDate(Math.min(dia, new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate()));
    return destino;
  }

  /* ---------- números ---------- */

  function leerNumero(t) {
    var s = limpiar(t).replace(/\./g, '').replace(',', '.');
    return (s !== '' && !isNaN(+s)) ? +s : null;
  }
  function escribirNumero(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }

  var UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  var DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  var CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  function entero(n) {
    if (n < 30) return UNIDADES[n];
    if (n < 100) { var u = n % 10; return DECENAS[Math.floor(n / 10)] + (u ? ' y ' + UNIDADES[u] : ''); }
    if (n === 100) return 'cien';
    if (n < 1000) { var r = n % 100; return CENTENAS[Math.floor(n / 100)] + (r ? ' ' + entero(r) : ''); }
    if (n < 10000) {
      var m = Math.floor(n / 1000), resto = n % 1000;
      return (m === 1 ? 'mil' : entero(m) + ' mil') + (resto ? ' ' + entero(resto) : '');
    }
    return String(n);
  }
  function enLetra(t) {
    var n = leerNumero(t);
    if (n === null || n < 0) return '';
    var e = Math.floor(n), dec = limpiar(t).split(',')[1];
    return dec ? entero(e) + ' con ' + entero(+dec) : entero(e);
  }

  /* ---------- los pasos ---------- */

  function otro(ctx, origen) { return (ctx && ctx.otro && origen) ? limpiar(ctx.otro(origen)) : ''; }

  var OPS = {
    juntar: { n: 'Juntar con otro campo', grupo: 'Texto', d: function () { return { campo: null, sep: ' ', lado: 'final' }; },
      run: function (s, v, ctx) {
        var o = otro(ctx, s.campo);
        if (!o) return v;
        if (!v) return o;
        return s.lado === 'principio' ? o + String(s.sep == null ? '' : s.sep) + v : v + String(s.sep == null ? '' : s.sep) + o;
      } },
    texto: { n: 'Añadir un texto fijo', grupo: 'Texto', d: function () { return { txt: '', lado: 'principio' }; },
      run: function (s, v) { return !v ? v : (s.lado === 'principio' ? String(s.txt) + v : v + String(s.txt)); } },
    quitarFin: { n: 'Quitar los últimos caracteres', grupo: 'Texto', d: function () { return { n: 1 }; },
      run: function (s, v) {
        if (!v) return '';
        var n = Math.max(0, Math.min(40, parseInt(s.n, 10) || 0));
        for (var i = 0; i < n && v.length; i++) {
          if (s.soloSiEsLetra && !/[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(v)) break;
          v = v.slice(0, -1);
        }
        return limpiar(v);
      } },
    quitarIni: { n: 'Quitar los primeros caracteres', grupo: 'Texto', d: function () { return { n: 1 }; },
      run: function (s, v) { return limpiar(String(v).slice(Math.max(0, Math.min(40, parseInt(s.n, 10) || 0)))); } },
    partir: { n: 'Partir por un signo', grupo: 'Texto', d: function () { return { signo: ' ', parte: '1' }; },
      run: function (s, v) {
        var signo = String(s.signo || '').charAt(0);
        if (!signo || !v) return v;
        var idx;
        if (s.parte === 'despuesPrimero') { idx = v.indexOf(signo); return idx === -1 ? v : limpiar(v.slice(idx + 1)); }
        if (s.parte === 'antesUltimo') { idx = v.lastIndexOf(signo); return idx === -1 ? v : limpiar(v.slice(0, idx)); }
        var trozos = v.split(signo);
        var t = s.parte === 'u' ? trozos[trozos.length - 1] : trozos[(parseInt(s.parte, 10) || 1) - 1];
        return limpiar(t || '');
      } },
    letras: { n: 'Mayúsculas o minúsculas', grupo: 'Texto', d: function () { return { modo: 'mayus' }; },
      run: function (s, v) {
        var t = String(v);
        if (s.modo === 'minus') return t.toLowerCase();
        if (s.modo === 'cada') return t.toLowerCase().replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
        return t.toUpperCase();
      } },
    si: { n: 'Si… entonces… si no…', grupo: 'Decidir', d: function () { return { campo: null, cond: 'igual', val: '', ent: '', sino: '' }; },
      run: function (s, v, ctx) {
        var a = (s.campo ? otro(ctx, s.campo) : String(v)).toLowerCase(), b = String(s.val == null ? '' : s.val).toLowerCase();
        var ok = { igual: a === b, distinto: a !== b, contiene: b !== '' && a.indexOf(b) !== -1, empieza: b !== '' && a.indexOf(b) === 0, vacio: !a, lleno: !!a }[s.cond];
        var r = ok ? s.ent : s.sino;
        return (r === '' || r == null) ? v : String(r);
      } },
    vacio: { n: 'Si está vacío, usar otro campo', grupo: 'Decidir', d: function () { return { campo: null }; },
      run: function (s, v, ctx) { return v || otro(ctx, s.campo); } },
    equiv: { n: 'Tabla de equivalencias', grupo: 'Decidir', d: function () { return { filas: [{ de: '', a: '' }], ignorarMayusculas: true, siNoEsta: 'seguir' }; },
      run: function (s, v) {
        if (!v) return '';
        var norm = (s.ignorarMayusculas === false) ? function (x) { return String(x == null ? '' : x).trim().replace(/\s+/g, ' '); }
          : function (x) { return (typeof U !== 'undefined' && U.normalizar) ? U.normalizar(x) : String(x == null ? '' : x).trim().replace(/\s+/g, ' ').toLowerCase(); };
        var buscado = norm(v);
        var f = (s.filas || []).filter(function (x) { return x && norm(x.de) !== '' && norm(x.de) === buscado; })[0];
        if (f) return limpiar(f.a);
        return s.siNoEsta === 'vaciar' ? '' : v;
      } },
    fechaSuma: { n: 'Sumar a una fecha', grupo: 'Fechas', d: function () { return { cant: 10, uni: 'habiles' }; },
      run: function (s, v, ctx) {
        var f = leerFecha(v), c = parseInt(s.cant, 10) || 0;
        if (!f) return '';
        if (s.uni === 'dias') f.setDate(f.getDate() + c);
        else if (s.uni === 'meses') f = sumarMeses(f, c);
        else f = sumarHabiles(f, c, ctx && ctx.festivos);
        return escribirFecha(f);
      } },
    fechaFormato: { n: 'Escribir una fecha de otra forma', grupo: 'Fechas', d: function () { return { f: 'larga' }; },
      run: function (s, v, ctx) {
        var f = leerFecha(v);
        if (!f) return '';
        if (s.f === 'dia') return DIAS[f.getDay()];
        if (s.f === 'mes') return MESES[f.getMonth()];
        if (s.f === 'anio') return String(f.getFullYear());
        if (s.f === 'anioAcademico') return (typeof U !== 'undefined' && U.cursoDeFecha) ? U.cursoDeFecha(aIso(f)) : '';
        if (s.f === 'edad') {
          var h = (ctx && ctx.hoy && leerFecha(ctx.hoy)) || new Date();
          var e = h.getFullYear() - f.getFullYear();
          if (h.getMonth() < f.getMonth() || (h.getMonth() === f.getMonth() && h.getDate() < f.getDate())) e--;
          return String(e);
        }
        return f.getDate() + ' de ' + MESES[f.getMonth()] + ' de ' + f.getFullYear();
      } },
    cuenta: { n: 'Hacer una cuenta', grupo: 'Números', d: function () { return { oper: '+', modo: 'num', num: 1, campo: null }; },
      run: function (s, v, ctx) {
        var a = leerNumero(v), b = s.modo === 'campo' ? leerNumero(otro(ctx, s.campo)) : leerNumero(s.num);
        if (a === null || b === null) return '';
        if (s.oper === '/' && b === 0) return '';
        return escribirNumero({ '+': a + b, '-': a - b, '*': a * b, '/': a / b }[s.oper]);
      } },
    enLetra: { n: 'Escribir un número en letra', grupo: 'Números', d: function () { return {}; },
      run: function (s, v) { return enLetra(v); } }
  };

  var GRUPOS_DE_PASOS = [
    ['Texto', ['juntar', 'texto', 'quitarFin', 'quitarIni', 'partir', 'letras']],
    ['Decidir', ['si', 'vacio', 'equiv']],
    ['Fechas', ['fechaSuma', 'fechaFormato']],
    ['Números', ['cuenta', 'enLetra']]
  ];

  function nuevoPaso(op) {
    var d = OPS[op] ? OPS[op].d() : {};
    d.op = op;
    return d;
  }

  function aplicar(paso, valor, ctx) {
    var o = paso && OPS[paso.op];
    if (!o) return valor;
    return limpiar(o.run(paso, limpiar(valor), ctx));
  }

  /* Los campos de los que sale un paso (para ciclos y para «vale para»). */
  function camposDelPaso(paso) {
    var c = [];
    if (paso && (paso.op === 'juntar' || paso.op === 'vacio') && paso.campo) c.push(paso.campo);
    if (paso && paso.op === 'si' && paso.campo) c.push(paso.campo);
    if (paso && paso.op === 'cuenta' && paso.modo === 'campo' && paso.campo) c.push(paso.campo);
    return c;
  }

  /* Motivos por los que un paso no se puede guardar (lista vacía si vale). */
  function validarPaso(paso, i) {
    var cual = 'Paso ' + (i + 1) + ': ';
    if (!paso || !OPS[paso.op]) return [cual + 'no sé qué hace.'];
    var m = [];
    if ((paso.op === 'juntar' || paso.op === 'vacio') && !paso.campo) m = m.concat(cual + 'elige el otro campo.');
    if (paso.op === 'texto' && !String(paso.txt || '')) m = m.concat(cual + 'escribe el texto.');
    if ((paso.op === 'quitarFin' || paso.op === 'quitarIni') && !(parseInt(paso.n, 10) >= 1 && parseInt(paso.n, 10) <= 40)) m = m.concat(cual + 'cuántos caracteres, de 1 a 40.');
    if (paso.op === 'partir' && String(paso.signo || '').length !== 1) m = m.concat(cual + 'el signo es un solo carácter.');
    if (paso.op === 'si') {
      if (paso.cond !== 'vacio' && paso.cond !== 'lleno' && String(paso.val || '') === '') m = m.concat(cual + 'escribe el valor con el que comparar.');
    }
    if (paso.op === 'equiv' && !(paso.filas || []).some(function (f) { return f && limpiar(f.de); })) m = m.concat(cual + 'escribe al menos una línea con «Si vale».');
    if (paso.op === 'fechaSuma' && isNaN(parseInt(paso.cant, 10))) m = m.concat(cual + 'cuánto se suma.');
    if (paso.op === 'cuenta') {
      if (paso.modo === 'campo' ? !paso.campo : leerNumero(paso.num) === null) m = m.concat(cual + (paso.modo === 'campo' ? 'elige el campo.' : 'escribe la cifra.'));
    }
    return m;
  }

  /* En palabras, para la lista de campos. `nombre(origen)` da el nombre de otro campo. */
  function describirPaso(paso, nombre) {
    var o = paso && OPS[paso.op];
    if (!o) return '';
    var c = function (x) { return (nombre && x && nombre(x)) || 'otro campo'; };
    switch (paso.op) {
      case 'juntar': return 'juntar con ' + c(paso.campo);
      case 'texto': return 'añadir «' + paso.txt + '»';
      case 'quitarFin': return 'quitar los últimos ' + paso.n;
      case 'quitarIni': return 'quitar los primeros ' + paso.n;
      case 'partir': return 'partir por «' + paso.signo + '»';
      case 'letras': return paso.modo === 'minus' ? 'minúsculas' : paso.modo === 'cada' ? 'cada palabra con mayúscula' : 'mayúsculas';
      case 'si': return 'si… entonces… si no…';
      case 'vacio': return 'si está vacío, ' + c(paso.campo);
      case 'equiv': return 'tabla de equivalencias';
      case 'fechaSuma': return 'sumar ' + paso.cant + ' ' + (paso.uni === 'dias' ? 'días' : paso.uni === 'meses' ? 'meses' : 'días hábiles');
      case 'fechaFormato': return 'escribir la fecha de otra forma';
      case 'cuenta': return 'hacer una cuenta';
      case 'enLetra': return 'escribir en letra';
      default: return o.n.toLowerCase();
    }
  }

  /* Un calculado de una sola operación (el de antes de la fila 529), como lista de un paso. */
  function deLegado(receta) {
    var p = (receta && receta.parametros) || {};
    switch (receta && receta.operacion) {
      case 'quitarFinal': return [{ op: 'quitarFin', n: p.n || 1, soloSiEsLetra: !!p.soloSiEsLetra }];
      case 'quitarInicio': return [{ op: 'quitarIni', n: p.n || 1 }];
      case 'partir': {
        var despues = p.lado === 'despues', ultima = p.ocurrencia === 'ultima';
        return [{ op: 'partir', signo: p.signo || '', parte: despues ? (ultima ? 'u' : 'despuesPrimero') : (ultima ? 'antesUltimo' : '1') }];
      }
      case 'equivalencias': return [{ op: 'equiv', filas: (p.pares || []).map(function (x) { return { de: x.de, a: x.a }; }), ignorarMayusculas: !!p.ignorarMayusculas, siNoEsta: p.siNoEsta === 'vaciar' ? 'vaciar' : 'seguir' }];
      case 'juntar': return [{ op: 'juntar', campo: p.origen2 || null, sep: p.separador == null ? '' : p.separador, lado: 'final' }];
      case 'deFecha': return [{ op: 'fechaFormato', f: p.que === 'edad' ? 'edad' : (p.que === 'anio' ? 'anio' : 'anioAcademico') }];
      case 'pasos': return JSON.parse(JSON.stringify(receta.pasos || []));
      default: return [];
    }
  }

  return {
    OPS: OPS, GRUPOS_DE_PASOS: GRUPOS_DE_PASOS, nuevoPaso: nuevoPaso, aplicar: aplicar,
    camposDelPaso: camposDelPaso, validarPaso: validarPaso, describirPaso: describirPaso, deLegado: deLegado,
    enLetra: enLetra, leerFecha: leerFecha, escribirFecha: escribirFecha
  };
})();
window.CamposPasos = CamposPasos;
