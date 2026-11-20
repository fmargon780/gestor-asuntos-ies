/* ============================================================
   aula-aviso-leer.js — lee el aviso de la intranet del aula de convivencia
   (20-nov-2026, fila 724, docs/724-CREAR-VARIOS-DESDE-EL-AVISO.md).

   Piezas puras, sin pantalla (las usa js/aula-aviso-pantalla.js y la prueba):
   - leer(texto): { anio, lineas: [{ linea, apellidos, nombre, grupo, dias, desde, hasta, avisos }] }.
     Se ignoran el título y la línea «Enviado el … por …» (que da el año). Una línea con otra forma
     devuelve `entendida: false`. Nunca se inventa un dato.
   - lectivosEntre(a, b, ajustes): días lectivos de a a b, ambos incluidos.
   - revisar(fila, ajustes): los avisos de fechas: el día de la semana escrito contra la fecha y el
     número de días contra los días lectivos que hay de verdad.
   ============================================================ */
var AulaAviso = (function () {

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  var SEMANA_BONITA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DOW = '(domingo|lunes|martes|miercoles|jueves|viernes|sabado)';
  var MES = '(' + MESES.join('|') + ')';

  function sinTildes(t) { return U.normalizar(t); }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function aIso(a, m, d) { return a + '-' + dos(m) + '-' + dos(d); }
  function deIso(iso) { var p = String(iso || '').split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) { return aIso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function existe(a, m, d) { var f = new Date(a, m - 1, d); return f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d; }

  /* «martes 3 de noviembre». */
  function enLetra(isoFecha) {
    var d = deIso(isoFecha);
    return SEMANA_BONITA[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }

  /* El año sale de «Enviado el 14/11/2026 …». Sin esa línea, '' (se pide a mano). */
  function anioDe(texto) {
    var m = /enviado\s+el\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(texto);
    return m ? { anio: +m[3], mes: +m[2] } : null;
  }

  /* Fechas de la línea: { d1, m1, dow1, d2, m2, dow2 } o null. */
  function fechasDe(resto) {
    var t = sinTildes(resto);
    var m = new RegExp('del?\\s+(?:' + DOW + '\\s+)?(\\d{1,2})(?:\\s+de\\s+' + MES + ')?\\s+al\\s+(?:' + DOW + '\\s+)?(\\d{1,2})\\s+de\\s+' + MES).exec(t);
    if (m) {
      var m2 = MESES.indexOf(m[6]) + 1;
      var m1 = m[3] ? MESES.indexOf(m[3]) + 1 : (+m[2] > +m[5] ? m2 - 1 : m2);
      return { d1: +m[2], m1: m1, dow1: m[1] || '', d2: +m[5], m2: m2, dow2: m[4] || '' };
    }
    m = new RegExp('(?:el|dia)\\s+(?:' + DOW + '\\s+)?(\\d{1,2})\\s+de\\s+' + MES).exec(t);
    if (m) { var mm = MESES.indexOf(m[3]) + 1; return { d1: +m[2], m1: mm, dow1: m[1] || '', d2: +m[2], m2: mm, dow2: m[1] || '' }; }
    return null;
  }

  /* Una línea de alumno. Devuelve null si no tiene la forma «Apellidos, Nombre (grupo) N días, …». */
  function lineaDe(linea, anio) {
    var m = /^\s*([^,()]+?)\s*,\s*([^()]+?)\s*\(([^)]+)\)\s*(\d+)\s*d[ií]as?\b\s*,?\s*(.*)$/i.exec(linea);
    var f = { linea: linea.trim(), entendida: false, apellidos: '', nombre: '', grupo: '', dias: 0, desde: '', hasta: '', dowDesde: '', dowHasta: '', avisos: [] };
    if (!m) return f;
    f.apellidos = m[1].trim(); f.nombre = m[2].trim(); f.grupo = m[3].trim(); f.dias = +m[4];
    var fe = fechasDe(m[5]);
    if (!fe) return f;
    f.entendida = true;
    f.dowDesde = fe.dow1; f.dowHasta = fe.dow2;
    if (!anio) { f.entendida = false; return f; }   /* sin el año no se inventa: la pantalla lo pide */
    {
      /* Un aviso de diciembre con fechas de enero: las fechas son del año siguiente. */
      var a2 = fe.m2 < anio.mes - 6 ? anio.anio + 1 : anio.anio;
      var a1 = fe.m1 > fe.m2 ? a2 - 1 : a2;
      if (existe(a1, fe.m1, fe.d1) && existe(a2, fe.m2, fe.d2)) { f.desde = aIso(a1, fe.m1, fe.d1); f.hasta = aIso(a2, fe.m2, fe.d2); }
      else f.entendida = false;
    }
    return f;
  }

  function leer(texto) {
    var anio = anioDe(String(texto || ''));
    var lineas = String(texto || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).filter(function (l) {
      return !/^alumnado\s+para\s+el\s+aula/i.test(sinTildes(l)) && !/^enviado\s+el\b/i.test(sinTildes(l));
    }).map(function (l) { return lineaDe(l, anio); });
    return { anio: anio ? anio.anio : 0, lineas: lineas };
  }

  /* Días lectivos de `a` a `b` (AAAA-MM-DD), ambos incluidos: sin sábados ni domingos ni festivos ni días no lectivos. */
  function lectivosEntre(a, b, ajustes) {
    var fest = {}, noLect = {};
    ((ajustes && ajustes.festivos) || []).forEach(function (x) { fest[x] = true; });
    ((ajustes && ajustes.noLectivos) || []).forEach(function (x) { noLect[x] = true; });
    var d = deIso(a), fin = deIso(b), n = 0;
    for (var i = 0; d <= fin && i < 400; i++) {
      var s = iso(d);
      if (d.getDay() !== 0 && d.getDay() !== 6 && !fest[s] && !noLect[s]) n++;
      d.setDate(d.getDate() + 1);
    }
    return n;
  }

  /* El día más cercano a `fechaIso` (± 3 días) que cae en ese día de la semana. */
  function conDiaDeSemana(fechaIso, dow) {
    var objetivo = SEMANA.indexOf(dow), d = deIso(fechaIso);
    for (var k = 0; k <= 3; k++) {
      for (var s = -1; s <= 1; s += 2) {
        var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + s * k);
        if (x.getDay() === objetivo) return iso(x);
      }
    }
    return '';
  }

  /* Los avisos de fechas de una fila: [{ tipo, texto, opciones: [{ texto, hasta, desde, dias }] }]. */
  function revisar(f, ajustes) {
    var avisos = [];
    if (!f.desde || !f.hasta) return avisos;
    var cuenta = lectivosEntre(f.desde, f.hasta, ajustes);
    var malo = [];
    [['desde', 'dowDesde'], ['hasta', 'dowHasta']].forEach(function (par) {
      var dow = f[par[1]];
      if (dow && SEMANA[deIso(f[par[0]]).getDay()] !== dow) malo.push(par[0]);
    });
    malo.forEach(function (cual) {
      var tal = conDiaDeSemana(f[cual], f[cual === 'desde' ? 'dowDesde' : 'dowHasta']);
      var escrito = SEMANA_BONITA[SEMANA.indexOf(f[cual === 'desde' ? 'dowDesde' : 'dowHasta'])];
      var opciones = [f[cual], tal].filter(Boolean).map(function (x) {
        var desde = cual === 'desde' ? x : f.desde, hasta = cual === 'hasta' ? x : f.hasta;
        var n = hasta >= desde ? lectivosEntre(desde, hasta, ajustes) : 0;
        return { texto: enLetra(x) + ' (' + n + (n === 1 ? ' día lectivo' : ' días lectivos') + ')', desde: desde, hasta: hasta, dias: n };
      });
      avisos.push({ tipo: 'semana', texto: 'El aviso dice «' + escrito + ' ' + deIso(f[cual]).getDate() + '», pero el ' + deIso(f[cual]).getDate() + ' de ' +
        MESES[deIso(f[cual]).getMonth()] + ' es ' + SEMANA_BONITA[deIso(f[cual]).getDay()] + '. ¿Cuál vale?', opciones: opciones });
    });
    if (!malo.length && cuenta !== f.dias) {
      avisos.push({ tipo: 'dias', texto: 'Las fechas no cuadran: el aviso dice ' + f.dias + (f.dias === 1 ? ' día' : ' días') + ', pero del ' + enLetra(f.desde) + ' al ' + enLetra(f.hasta) +
        ' hay ' + cuenta + (cuenta === 1 ? ' día lectivo' : ' días lectivos') + '. ¿Cuál vale?',
        opciones: [{ texto: f.dias + (f.dias === 1 ? ' día' : ' días') + ', como dice el aviso', desde: f.desde, hasta: f.hasta, dias: f.dias },
                   { texto: cuenta + (cuenta === 1 ? ' día lectivo' : ' días lectivos') + ', los que hay entre las fechas', desde: f.desde, hasta: f.hasta, dias: cuenta }] });
    }
    return avisos;
  }

  /* El grupo del aviso y el del alumno son el mismo: «1º ESO B» y «1º B» → 1B; «1º Bach A» → 1BACHA. */
  function claveGrupo(g) {
    var t = sinTildes(g).replace(/\./g, ' ');
    var curso = (/\d/.exec(t) || [''])[0];
    var bach = /bach/.test(t) ? 'bach' : '';
    var letra = (/\b([a-z])\s*$/.exec(t) || ['', ''])[1];
    return curso + bach + letra;
  }

  return { leer: leer, revisar: revisar, lectivosEntre: lectivosEntre, claveGrupo: claveGrupo, enLetra: enLetra, MESES: MESES };
})();
window.AulaAviso = AulaAviso;
