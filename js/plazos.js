/* ============================================================
   plazos.js — la fecha límite de los asuntos.

   Un asunto puede llevar fecha límite. Es opcional, y va en la ficha
   de _GESTOR/asuntos.json, nunca en el nombre de la carpeta: cambia
   mientras se tramita, y renombrar carpetas en un Dropbox sincronizado
   cada vez que algo se mueve es pedir problemas.

   Los días se cuentan naturales, de calendario. Es lo que viene en el
   papel del trámite; si en un caso hacen falta hábiles, se cambia la
   fecha a mano.
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

  return {
    DIAS_CERCA: DIAS_CERCA,
    sumarDias: sumarDias, sumarDiasHabiles: sumarDiasHabiles,
    diasHasta: diasHasta, legible: legible,
    de: de, pasaFiltro: pasaFiltro
  };
})();
