/* ============================================================
   plazos.js — la fecha límite de los asuntos.

   Un asunto puede llevar fecha límite. Es opcional, y va en la ficha
   de _GESTOR/asuntos.json, nunca en el nombre de la carpeta: cambia
   mientras se tramita, y renombrar carpetas en un Dropbox sincronizado
   cada vez que algo se mueve es pedir problemas.

   La fecha límite de un asunto se cuenta en días naturales, de
   calendario. Los plazos de los hitos dicen cómo se cuentan: hábiles,
   lectivos o naturales (fila 131, sumarPlazo, más abajo).
   ============================================================ */
var Plazos = (function () {

  /* A partir de aquí se considera que un plazo "vence pronto". */
  var DIAS_CERCA = 7;

  /* Suma días a una fecha AAAA-MM-DD y devuelve otra AAAA-MM-DD. */
  function sumarDias(iso, dias) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var n = parseInt(dias, 10);
    if (isNaN(n)) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + n);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  /* Días que faltan hasta esa fecha. Hoy es 0, mañana 1, ayer -1.
     Devuelve null si la fecha no se entiende o viene vacía. */
  function diasHasta(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return null;
    var f = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(f.getTime())) return null;
    var h = new Date();
    var hoy = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    return Math.round((f.getTime() - hoy.getTime()) / 86400000);
  }

  /* AAAA-MM-DD -> DD/MM/AAAA. */
  function legible(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  /* Todo lo que hace falta saber de un plazo, ya masticado: los días que
     quedan, el texto de la etiqueta y el color con que se pinta.
     Devuelve null si no hay fecha límite. */
  function de(limite) {
    var dias = diasHasta(limite);
    if (dias === null) return null;
    var texto, clase;
    if (dias < -1)        { texto = 'venció hace ' + (-dias) + ' días'; clase = 'plazo-vencido'; }
    else if (dias === -1) { texto = 'venció ayer';                      clase = 'plazo-vencido'; }
    else if (dias === 0)  { texto = 'vence hoy';                        clase = 'plazo-vencido'; }
    else if (dias === 1)  { texto = 'vence mañana';                     clase = 'plazo-cerca'; }
    else if (dias <= DIAS_CERCA) { texto = 'vence en ' + dias + ' días'; clase = 'plazo-cerca'; }
    else                  { texto = 'vence en ' + dias + ' días';       clase = 'plazo-lejos'; }
    return { limite: limite, dias: dias, texto: texto, clase: clase };
  }

  /* El desplegable de plazo de la cabecera de asuntos abiertos. */
  function pasaFiltro(limite, filtro) {
    if (!filtro) return true;
    var p = de(limite);
    if (filtro === 'sinplazo') return !p;
    if (filtro === 'conplazo') return !!p;
    if (!p) return false;
    if (filtro === 'vencidos') return p.dias <= 0;
    if (filtro === 'pronto') return p.dias <= DIAS_CERCA;
    return true;
  }

  /* ---------- días hábiles (16-sep-2026, hitos) ----------

     Para el plazo de un hito (js/hitos.js): de lunes a viernes,
     descontando además los días no lectivos que Francisco pega en
     Ajustes › Hitos (una fecha AAAA-MM-DD por línea, en
     _GESTOR/hitos.json). Con nombre propio para que lo reutilice
     también la pantalla "Qué me toca" (fila 16 de la cola). */
  /* Compatibilidad (fila 131): salta sábados, domingos y los días que se
     le pasen, como siempre. Lo nuevo usa sumarPlazo. */
  function sumarDiasHabiles(iso, dias, noLectivos) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var n = parseInt(dias, 10);
    if (isNaN(n) || n < 0) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d.getTime())) return '';
    var festivos = {};
    (noLectivos || []).forEach(function (f) { festivos[String(f)] = true; });
    var contados = 0;
    while (contados < n) {
      d.setDate(d.getDate() + 1);
      var diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      if (festivos[d.getFullYear() + '-' + mm + '-' + dd]) continue;
      contados++;
    }
    var m2 = String(d.getMonth() + 1).padStart(2, '0');
    var d2 = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m2 + '-' + d2;
  }

  /* ---------- cómo se cuenta un plazo (24-sep-2026, fila 131,
     docs/PLAZOS-BIEN-CONTADOS.md) ----------

     - `habiles` (por defecto): sin sábados, domingos ni festivos. Las
       vacaciones escolares SÍ cuentan (procedimiento administrativo).
     - `lectivos`: sin sábados, domingos, festivos ni días no lectivos.
     - `naturales`: todos; pero si el último cae en sábado, domingo o
       festivo, pasa al siguiente hábil.
     Se empieza a contar el día siguiente al de partida. Un plazo sin
     `cuenta` (todos los de antes) se cuenta en hábiles. */
  var CUENTAS = [
    { valor: 'habiles', texto: 'Días hábiles', corto: 'hábiles' },
    { valor: 'lectivos', texto: 'Días lectivos', corto: 'lectivos' },
    { valor: 'naturales', texto: 'Días naturales', corto: 'naturales' }
  ];

  function cuentaValida(c) {
    return CUENTAS.some(function (x) { return x.valor === c; }) ? c : 'habiles';
  }

  function aIso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function conjunto(lista) {
    var s = {};
    (lista || []).forEach(function (f) { s[String(f)] = true; });
    return s;
  }

  /* ¿Cuenta este día para un plazo de este modo? */
  function diaCuenta(d, cuenta, fest, noLect) {
    if (cuenta === 'naturales') return true;
    var ds = d.getDay();
    if (ds === 0 || ds === 6) return false;
    var iso = aIso(d);
    if (fest[iso]) return false;
    if (cuenta === 'lectivos' && noLect[iso]) return false;
    return true;
  }

  function sumarPlazo(iso, dias, cuenta, festivos, noLectivos) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var n = parseInt(dias, 10);
    if (isNaN(n) || n < 0) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d.getTime())) return '';
    cuenta = cuentaValida(cuenta);
    var fest = conjunto(festivos), noLect = conjunto(noLectivos);
    var contados = 0;
    while (contados < n) {
      d.setDate(d.getDate() + 1);
      if (diaCuenta(d, cuenta, fest, noLect)) contados++;
    }
    /* Naturales: si el último día no es hábil, al siguiente hábil. */
    if (cuenta === 'naturales') {
      var vueltas = 0;
      while (!diaCuenta(d, 'habiles', fest, noLect) && vueltas++ < 60) d.setDate(d.getDate() + 1);
    }
    return aIso(d);
  }

  /* Cuántos días de ese modo quedan desde `hoy` hasta `fecha` (0 si ya
     ha llegado), para «quedan N días hábiles» de la mesa del hito. */
  function diasQueQuedan(hoy, fecha, cuenta, festivos, noLectivos) {
    cuenta = cuentaValida(cuenta);
    if (cuenta === 'naturales') {
      var d = diasHasta(fecha);
      return d === null ? 0 : Math.max(d, 0);
    }
    var n = 0;
    while (n < 400 && sumarPlazo(hoy, n + 1, cuenta, festivos, noLectivos) <= fecha) n++;
    return n;
  }

  /* «10 días hábiles», «2 días lectivos», «1 día natural». */
  function textoPlazo(plazo) {
    if (!plazo || !plazo.dias) return '';
    return textoDias(parseInt(plazo.dias, 10), plazo.cuenta);
  }

  function textoDias(n, cuenta) {
    var c = CUENTAS.filter(function (x) { return x.valor === cuentaValida(cuenta); })[0];
    return n + (n === 1 ? ' día ' + c.corto.replace(/es$/, '').replace(/s$/, '') : ' días ' + c.corto);
  }

  /* ---------- la etiqueta de vencimiento de la cabecera (18-sep-2026,
     fila 52, docs/CABECERA-DEL-ASUNTO.md, 8) ----------

     Sustituye al botón "Plazo" y a la marca `.marca-plazo`: aquí el
     dato se ve sin pulsar nada. Con un umbral propio (2 días, no los 7
     de DIAS_CERCA de arriba: ese es el de los avisos y los filtros, y
     aquí Francisco pidió uno más corto) y sus propios textos, para no
     tocar `de()`, que ya usan `js/avisos.js`, `js/que-me-toca.js` y
     `js/asuntos-lista.js` con su propio significado de "vencido"
     (que a día de hoy incluye "vence hoy", y aquí no). */
  var DIAS_AMBAR_VENCIMIENTO = 2;
  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* "25-sep", sin año: la fecha ya es de este curso o del que viene,
     nunca de hace años, así que el año sobra en una etiqueta tan
     corta. */
  function fechaCortaSinAno(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var mes = parseInt(p[1], 10);
    if (!mes || mes < 1 || mes > 12) return '';
    return String(parseInt(p[2], 10)) + '-' + MESES_CORTOS[mes - 1];
  }

  /* { texto, clase } de la etiqueta. `clase` es '' para el color
     normal (sin nada especial que resaltar). */
  function etiquetaVencimiento(limite) {
    var dias = diasHasta(limite);
    if (dias === null) return { texto: 'Sin plazo', clase: 'vencimiento-sin' };
    if (dias < 0) {
      var vencido = -dias;
      return { texto: 'Venció hace ' + vencido + ' día' + (vencido === 1 ? '' : 's'), clase: 'vencimiento-vencido' };
    }
    if (dias === 0) return { texto: 'Vence hoy', clase: 'vencimiento-cerca' };
    var texto = 'Vence el ' + fechaCortaSinAno(limite) + ' · quedan ' + dias + ' día' + (dias === 1 ? '' : 's');
    return { texto: texto, clase: dias <= DIAS_AMBAR_VENCIMIENTO ? 'vencimiento-cerca' : '' };
  }

  return {
    DIAS_CERCA: DIAS_CERCA,
    sumarDias: sumarDias, sumarDiasHabiles: sumarDiasHabiles,
    diasHasta: diasHasta, legible: legible,
    CUENTAS: CUENTAS, cuentaValida: cuentaValida, sumarPlazo: sumarPlazo,
    diasQueQuedan: diasQueQuedan, textoPlazo: textoPlazo, textoDias: textoDias,
    de: de, pasaFiltro: pasaFiltro,
    etiquetaVencimiento: etiquetaVencimiento
  };
})();
