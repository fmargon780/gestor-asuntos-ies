/* ============================================================
   duplicados-aviso.js — el recuadro de «Nuevo asunto» con lo que ya
   tiene el tercero (25-sep-2026, fila 163, docs/AVISO-DE-PARECIDOS-AL-CREAR.md).

   Sustituye al aviso ámbar de js/duplicados.js (la parada al pulsar
   «Crear» no cambia). Sale en cuanto hay tercero, aunque aún no haya
   tipo, y enseña, en este orden:

     1. Sus abiertos del mismo tipo, en rojo, arriba.
     2. Sus archivados del mismo tipo abiertos a 15 días o menos (antes o
        después) de la fecha del asunto nuevo (AAMMDD del nombre).
     3. El resto de sus abiertos, en gris (sin tipo elegido, todos).

   Seis como mucho por bloque y «y N más». Un reservado, con candado y
   tapado (salvo «Mostrar reservados»). Cada uno se pulsa: un abierto
   abre su ficha; un archivado, la suya del ARCHIVO (los mismos caminos
   que la parada al crear). Sin nada que enseñar, no sale. Nunca impide
   crear: todo en try/catch.

   Lo llama `mirarSiYaExiste` (js/duplicados.js), con lo que ya ha leído;
   aquí solo lo que es puro y el pintado.
   ============================================================ */
var DuplicadosAviso = (function () {

  var MAX = 6;
  var DIAS = 15;

  /* Pura: '260910 …' → '2026-09-10', o '' si no empieza por AAMMDD. */
  function fechaDeNombre(nombre) {
    var m = /^(\d{2})(\d{2})(\d{2})\b/.exec(String(nombre || ''));
    if (!m) return '';
    var mes = parseInt(m[2], 10), dia = parseInt(m[3], 10);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return '';
    return '20' + m[1] + '-' + m[2] + '-' + m[3];
  }

  /* Pura: días entre dos fechas ISO (sin signo), o null. */
  function diasEntre(a, b) {
    if (!a || !b) return null;
    var ta = Date.parse(a + 'T00:00:00Z'), tb = Date.parse(String(b).slice(0, 10) + 'T00:00:00Z');
    if (isNaN(ta) || isNaN(tb)) return null;
    return Math.round(Math.abs(ta - tb) / 86400000);
  }

  /* Pura: los archivados del mismo tipo a `DIAS` o menos de `fechaNuevo`. */
  function archivadosCerca(nombres, fechaNuevo) {
    return (nombres || []).filter(function (n) {
      var d = diasEntre(fechaDeNombre(n), fechaNuevo);
      return d !== null && d <= DIAS;
    });
  }

  /* Pura: los tres bloques. `mismoTipo(nombre)` dice si es del tipo elegido
     (sin tipo, ninguno lo es). */
  function bloques(todo, tipo, fechaNuevo, mismoTipo) {
    var abiertos = todo.abiertos || [];
    var rojo = tipo ? abiertos.filter(mismoTipo) : [];
    var archivados = tipo ? archivadosCerca((todo.archivados || []).filter(mismoTipo), fechaNuevo) : [];
    var gris = abiertos.filter(function (n) { return rojo.indexOf(n) === -1; });
    return { rojo: rojo, archivados: archivados, gris: gris };
  }

  function comoVer(nombre, archivado) {
    var a = null;
    if (!archivado) a = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombre; })[0] || null;
    if (!a) {
      a = { nombre: nombre, leido: window.Nombres ? Nombres.leer(nombre, App.E.tipos) : {},
            ficha: (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[nombre]) || {} };
    }
    var R = window.Reservados;
    return { texto: R ? R.nombreParaVer(a) : nombre, candado: R ? R.candadoHtml(a) : '' };
  }

  function listaHTML(nombres, clase, archivado) {
    return '<ul class="lista-parecidos">' + nombres.slice(0, MAX).map(function (n) {
      var v = comoVer(n, archivado);
      return '<li><button type="button" class="enlace parecido ' + clase + '" data-nombre="' + U.escapar(n) + '"' +
        (archivado ? ' data-archivado="1"' : '') + '>' + v.candado + U.escapar(v.texto) + '</button>' +
        (archivado ? ' <span class="parecido-etiqueta">archivado</span>' : '') + '</li>';
    }).join('') + '</ul>' +
    (nombres.length > MAX ? '<p class="nota">Y ' + (nombres.length - MAX) + ' más.</p>' : '');
  }

  /* Pinta el recuadro en `caja`. Devuelve si ha salido. `ir(nombre,
     archivado)`: lo que hace pulsar uno. */
  function pintar(caja, b, ir) {
    if (!b.rojo.length && !b.archivados.length && !b.gris.length) {
      caja.className = 'oculto';
      caja.innerHTML = '';
      return false;
    }
    caja.className = 'aviso aviso-parecidos';
    caja.innerHTML =
      (b.rojo.length ? '<div class="parecidos-bloque parecido-mismo-tipo-bloque"><strong>Ya tiene abierto un asunto de este tipo</strong>' +
        listaHTML(b.rojo, 'parecido-mismo-tipo', false) + '</div>' : '') +
      (b.archivados.length ? '<div class="parecidos-bloque"><strong>Archivado hace poco, del mismo tipo</strong>' +
        listaHTML(b.archivados, 'parecido-archivado', true) + '</div>' : '') +
      (b.gris.length ? '<div class="parecidos-bloque parecido-otros-bloque"><strong>Otros asuntos abiertos de este tercero</strong>' +
        listaHTML(b.gris, 'parecido-otro', false) + '</div>' : '') +
      '<p class="nota parecidos-pie">Es solo un aviso. Si es otra gestión, créalo sin más.</p>';
    Array.prototype.forEach.call(caja.querySelectorAll('.parecido'), function (el) {
      el.onclick = function () { ir(el.dataset.nombre, el.dataset.archivado === '1'); };
    });
    return true;
  }

  return { fechaDeNombre: fechaDeNombre, diasEntre: diasEntre, archivadosCerca: archivadosCerca,
           bloques: bloques, pintar: pintar, DIAS: DIAS };
})();
window.DuplicadosAviso = DuplicadosAviso;
