/* ============================================================
   inicio-ordenar.js — ordenar la lista de Inicio pulsando el título de
   una columna (fila 367, docs/INICIO-ORDENAR-POR-COLUMNA.md).

   Pulsar el título de una columna ordena por ella (ascendente); otra vez,
   al revés; otra columna, ascendente por esa. Una flecha (▲ / ▼) marca la
   que manda. Vale en todas las pestañas, «Por liquidar» incluida.

   El orden es de esta sesión de pantalla: no se guarda en ningún sitio.
   Vuelve al de siempre (el natural de cada pestaña) al cambiar de pestaña
   (js/inicio-tabla.js llama a `reset`) y al pulsar «Inicio» en el menú.

   Qué se compara: siempre lo que se ve en esa pestaña. Lo que no tiene
   dato va al final en los dos sentidos. Empate: fecha de inicio, la más
   antigua primero (el desempate no se da la vuelta).

   Se carga después de js/inicio-tabla.js. */
(function () {
  'use strict';

  var estado = null;   /* { col, dir } — dir 1 ascendente, -1 descendente */
  var cotejo = (typeof Intl !== 'undefined' && Intl.Collator)
    ? new Intl.Collator('es', { sensitivity: 'base' }) : null;

  function activo() { return !!estado; }

  function reset() { estado = null; }

  /* ---------- lo que se ve en cada columna ---------- */

  function textoDeHito(a) {
    if (!window.EstadoHito) return '';
    var d = document.createElement('div');
    d.innerHTML = EstadoHito.marcaHTML(a, 'abierto', App.ladoDe(a));
    return (d.textContent || '').trim();
  }

  function textoDeTercero(a, liq) {
    if (window.Reservados && Reservados.tapar(a)) return 'Reservado';
    var grupo = !liq && window.AsuntoDeGrupo ? AsuntoDeGrupo.terceroEnLista(a) : '';
    return grupo || QueMeToca.terceroDe(a) || a.nombre || '';
  }

  /* Cada elemento: { a: asunto, hito, dias }. Devuelve null si no hay dato. */
  function clave(col, pestana, it) {
    var a = it.a;
    var t;
    switch (col) {
      case 'plazo':
        if (pestana === 'esp') return typeof it.dias === 'number' ? { n: -it.dias } : null;
        if (pestana === 'dorm') return typeof it.dias === 'number' ? { n: -it.dias } : null;
        t = pestana === 'adm' ? (it.hito && it.hito.fecha) : (a.ficha && a.ficha.limite);
        return t ? { s: String(t) } : null;
      case 'tercero': return { t: textoDeTercero(a, pestana === 'liq') };
      case 'tipo':
        t = a.leido && a.leido.tipo;
        return t ? { t: Nombres.tipoParaVer(t, App.E.tipos) } : null;
      case 'hito': t = textoDeHito(a); return t ? { t: t } : null;
      case 'quien': t = App.textoLeTocaA(a, App.ladoDe(a)); return t ? { t: t } : null;
      case 'inicio':
        t = a.leido && a.leido.fecha;
        return /^\d{6}$/.test(t || '') ? { s: t } : null;
      case 'desde':
        t = a.ficha && a.ficha.porLiquidar && a.ficha.porLiquidar.desde;
        return t ? { s: String(t) } : null;
      case 'importe':
        t = window.PorLiquidar ? PorLiquidar.importeDe(a) : null;
        return (t && !t.sinImporte) ? { n: t.n } : null;
    }
    return null;
  }

  function comparar(x, y) {
    if (x.t !== undefined) return cotejo ? cotejo.compare(x.t, y.t) : (x.t < y.t ? -1 : x.t > y.t ? 1 : 0);
    var vx = x.n !== undefined ? x.n : x.s, vy = y.n !== undefined ? y.n : y.s;
    return vx < vy ? -1 : vx > vy ? 1 : 0;
  }

  /* Ordena `lista` (de asuntos, o de { asunto, hito, dias }) por la columna
     activa; sin orden activo, la devuelve tal cual. */
  function ordenar(lista, pestana) {
    if (!estado) return lista;
    var col = estado.col, dir = estado.dir;
    var filas = lista.map(function (x, i) {
      var it = x && x.asunto ? { a: x.asunto, hito: x.hito, dias: x.dias } : { a: x };
      if (pestana === 'esp' && it.hito && window.QueMeToca) it.dias = QueMeToca.diasParado(it.hito);
      var f = it.a.leido && it.a.leido.fecha;
      return { x: x, i: i, k: clave(col, pestana, it), f: /^\d{6}$/.test(f || '') ? f : null };
    });
    filas.sort(function (p, q) {
      if (!p.k || !q.k) {
        if (p.k) return -1;
        if (q.k) return 1;
      } else {
        var c = comparar(p.k, q.k) * dir;
        if (c) return c;
      }
      if (p.f !== q.f) return p.f === null ? 1 : q.f === null ? -1 : (p.f < q.f ? -1 : 1);
      return p.i - q.i;
    });
    return filas.map(function (p) { return p.x; });
  }

  /* ---------- la flecha y las pulsaciones ---------- */

  function pintarFlechas() {
    var ths = document.querySelectorAll('.inicio-tabla thead th');
    Array.prototype.forEach.call(ths, function (th) {
      var vieja = th.querySelector('.orden-flecha');
      if (vieja) vieja.remove();
      th.removeAttribute('aria-sort');
      if (estado && th.dataset.col === estado.col) {
        var s = document.createElement('span');
        s.className = 'orden-flecha';
        s.textContent = estado.dir === 1 ? ' ▲' : ' ▼';
        th.appendChild(s);
        th.setAttribute('aria-sort', estado.dir === 1 ? 'ascending' : 'descending');
      }
    });
  }

  function repintar() {
    if (window.App && App.repintarLaPestanaActiva) App.repintarLaPestanaActiva();
  }

  function pulsar(col) {
    if (estado && estado.col === col) estado = { col: col, dir: -estado.dir };
    else estado = { col: col, dir: 1 };
    repintar();
  }

  function enganchar() {
    var tabla = document.querySelector('.inicio-tabla');
    if (tabla) {
      tabla.addEventListener('click', function (ev) {
        var th = ev.target.closest && ev.target.closest('thead th[data-col]');
        if (th) pulsar(th.dataset.col);
      });
    }
    /* «Inicio» en el menú de la izquierda: vuelve el orden de siempre. Fase de
       captura, para que ya esté a cero cuando el menú pinte la pantalla. */
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.pestana[data-pantalla="abiertos"]');
      if (!b || !estado) return;
      estado = null;
      setTimeout(repintar, 0);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  window.InicioOrdenar = {
    activo: activo, reset: reset, ordenar: ordenar, pintarFlechas: pintarFlechas,
    /* para las pruebas */
    _estado: function () { return estado ? { col: estado.col, dir: estado.dir } : null; }
  };
})();
