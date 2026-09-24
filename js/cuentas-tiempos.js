/* ============================================================
   cuentas-tiempos.js — el tiempo de tramitación en «Cuentas» (fila 140,
   25-sep-2026, docs/TIEMPO-DE-TRAMITACION.md). Aparte de js/cuentas.js
   para no pasarlo de 400 líneas; lo llama su `pintar()`.

   - En la tabla por tipo, «Media (días)» y «Máximo (días)»: el mismo
     cálculo de «Cuánto se tarda» (`Cuentas._tiempoDeTramite`), solo con
     los archivados de ese tipo. Sin datos, «—». También al copiar.
   - Arriba, «Abiertos hace más de 30 días: N».
   - La tabla «Los que más tiempo llevan abiertos»: los diez más
     antiguos, con tipo, días abiertos y hito actual; pulsar uno abre su
     ficha. Los reservados (fila 135), tapados.
   Todo respeta el curso elegido arriba (el de la fecha de apertura).
   ============================================================ */
var CuentasTiempos = (function () {

  var DIAS_AVISO = 30;
  var CUANTOS = 10;

  /* ---------- por tipo (puro) ---------- */

  function claveDeEntrada(e) {
    return (e.categoria || 'Sin clasificar') + '\u0001' + (e.categoria ? e.tipo : '—');
  }

  /* Añade `media` y `maximo` (o null) a cada fila de `Cuentas._porTipo`. */
  function anadirTiempos(filas, entradas, curso) {
    var porClave = {};
    (entradas || []).forEach(function (e) { (porClave[claveDeEntrada(e)] = porClave[claveDeEntrada(e)] || []).push(e); });
    (filas || []).forEach(function (f) {
      var t = Cuentas._tiempoDeTramite(porClave[f.categoria + '\u0001' + f.tipo] || [], curso);
      f.media = t.cuantos ? t.media : null;
      f.maximo = t.cuantos ? t.maximo : null;
    });
    return filas;
  }

  function celda(n) { return n === null || n === undefined ? '—' : String(n); }

  /* ---------- los abiertos más antiguos (puro, sobre los asuntos) ---------- */

  function diasDesde(a, hoy) {
    var f = a.ficha || {};
    var desde = f.abiertoEl ? String(f.abiertoEl).slice(0, 10) : '';
    var fecha = (a.leido && a.leido.fecha) || '';
    if (!desde && /^\d{6}$/.test(fecha)) desde = '20' + fecha.slice(0, 2) + '-' + fecha.slice(2, 4) + '-' + fecha.slice(4, 6);
    if (!desde) return null;
    var d1 = new Date(desde + 'T00:00:00').getTime(), d2 = new Date((hoy || U.hoyIso()) + 'T00:00:00').getTime();
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.max(0, Math.round((d2 - d1) / 86400000));
  }

  function cursoDe(a) {
    var fecha = (a.leido && a.leido.fecha) || '';
    return /^\d{6}$/.test(fecha) ? U.cursoDeFecha('20' + fecha.slice(0, 2) + '-' + fecha.slice(2, 4) + '-' + fecha.slice(4, 6)) : '';
  }

  /* { masDe30, lista: [{ a, dias }] } de los abiertos del curso. */
  function abiertosAntiguos(asuntos, curso, hoy) {
    var con = (asuntos || []).filter(function (a) { return !curso || cursoDe(a) === curso; })
      .map(function (a) { return { a: a, dias: diasDesde(a, hoy) }; })
      .filter(function (x) { return x.dias !== null; });
    con.sort(function (x, y) { return y.dias - x.dias || (x.a.nombre < y.a.nombre ? -1 : 1); });
    return { masDe30: con.filter(function (x) { return x.dias > DIAS_AVISO; }).length, lista: con.slice(0, CUANTOS) };
  }

  /* ---------- lo que se pinta ---------- */

  function numeroArribaHTML(r) {
    return '<p class="cuentas-aviso-abiertos' + (r.masDe30 ? ' cuentas-aviso-ambar' : '') + '">Abiertos hace más de ' +
      DIAS_AVISO + ' días: <strong>' + r.masDe30 + '</strong></p>';
  }

  function tipoParaVer(a) {
    var t = a.leido && a.leido.tipo;
    return t ? (window.Nombres ? Nombres.tipoParaVer(t, App.E.tipos) : t) : '—';
  }

  function tablaAntiguosHTML(r) {
    if (!r.lista.length) return '';
    var filas = r.lista.map(function (x, i) {
      var a = x.a;
      var nombre = window.Reservados ? Reservados.candadoHtml(a) + U.escapar(Reservados.nombreParaVer(a)) : U.escapar(a.nombre);
      var hito = window.EstadoHito && EstadoHito.textoDeNombre ? EstadoHito.textoDeNombre(a.nombre) : '';
      return '<tr class="cuentas-antiguo" data-i="' + i + '" title="Abrir su ficha"><td>' + nombre + '</td><td>' +
        U.escapar(tipoParaVer(a)) + '</td><td>' + x.dias + '</td><td>' + U.escapar(hito || '—') + '</td></tr>';
    }).join('');
    return '<h3 class="cuentas-subtitulo">Los que más tiempo llevan abiertos</h3>' +
      '<table class="cuentas-tabla cuentas-antiguos"><thead><tr><th>Asunto</th><th>Tipo</th><th>Días abierto</th>' +
      '<th>Hito actual</th></tr></thead><tbody>' + filas + '</tbody></table>';
  }

  function enganchar(caja, r) {
    Array.prototype.forEach.call(caja.querySelectorAll('.cuentas-antiguo'), function (tr) {
      tr.onclick = function () {
        var x = r.lista[Number(tr.dataset.i)];
        if (x && window.App && App.abrirFicha) App.abrirFicha(x.a, 'abierto');
      };
    });
  }

  return {
    DIAS_AVISO: DIAS_AVISO,
    anadirTiempos: anadirTiempos, celda: celda, diasDesde: diasDesde, abiertosAntiguos: abiertosAntiguos,
    numeroArribaHTML: numeroArribaHTML, tablaAntiguosHTML: tablaAntiguosHTML, enganchar: enganchar
  };
})();
window.CuentasTiempos = CuentasTiempos;
