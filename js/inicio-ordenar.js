/* ============================================================
   inicio-ordenar.js — ordenar la lista de Inicio pulsando el título
   de una columna (fila 367, docs/INICIO-ORDENAR-POR-COLUMNA.md).
   Sustituye al desplegable «Ordenar» y a la cabecera «Inicio»
   pulsable de la fila 209.

   Primera pulsación en una columna: ascendente; segunda: al revés;
   otra columna: ascendente por esa. Una flecha (▲/▼) marca la que
   manda. Lo que no tiene dato va al final en los dos sentidos; el
   empate se desempata por la fecha de inicio, la más antigua primero
   (en los dos sentidos). Sin columna elegida, cada pestaña conserva
   su orden natural y no hay flecha.

   El orden no se guarda: vuelve al natural al cambiar de pestaña y
   al pulsar «Inicio» en el menú (reiniciar). Se conserva al volver
   de la ficha, al repintar, buscar y filtrar.

   Cada pintado de tabla llama a `ordenar(lista, pestana)` antes de
   pintar y a `decorar(pestana)` después (js/asuntos-lista-pintar.js,
   js/inicio-tabla.js, js/por-liquidar.js).
   ============================================================ */
window.InicioOrden = (function () {

  var estado = { col: null, dir: 1 };

  /* Las columnas con título pulsable, por posición de su <th>. */
  var COLUMNAS_NORMAL = ['plazo', 'tercero', 'tipo', 'hito', 'quien', 'inicio'];
  var COLUMNAS_LIQUIDAR = [null, 'tercero', 'tipo', 'desde', 'importe'];

  var comparador = new Intl.Collator('es', { sensitivity: 'base' });

  function asuntoDe(e) { return e && e.asunto ? e.asunto : e; }

  function textoLimpio(t) {
    t = String(t == null ? '' : t).trim();
    return t === '' ? null : t;
  }

  function tercero(a, pestana) {
    if (window.Reservados && Reservados.tapar(a)) return 'Reservado';
    if (pestana === 'liq') return textoLimpio(QueMeToca.terceroDe(a) || a.nombre);
    return textoLimpio((window.AsuntoDeGrupo && AsuntoDeGrupo.terceroEnLista(a)) || QueMeToca.terceroDe(a) || a.nombre);
  }

  function tipo(a) {
    var t = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
    if (!t) return null;
    return textoLimpio(window.Nombres ? Nombres.tipoParaVer(t, App.E.tipos) : t);
  }

  function textoDelHito(a, lado) {
    if (!window.EstadoHito) return null;
    var caja = document.createElement('div');
    caja.innerHTML = EstadoHito.marcaHTML(a, 'abierto', lado);
    return textoLimpio(caja.textContent);
  }

  /* El valor que se compara de `e` en la columna `col` (null = sin dato). */
  function clave(col, e, pestana) {
    var a = asuntoDe(e);
    if (col === 'tercero') return tercero(a, pestana);
    if (col === 'tipo') return tipo(a);
    if (col === 'hito') return textoDelHito(a, App.ladoDe(a));
    if (col === 'quien') return textoLimpio(App.textoLeTocaA(a, App.ladoDe(a)));
    if (col === 'inicio') return /^\d{6}$/.test((a.leido && a.leido.fecha) || '') ? a.leido.fecha : null;
    if (col === 'desde') return textoLimpio(a.ficha && a.ficha.porLiquidar && a.ficha.porLiquidar.desde);
    if (col === 'importe') {
      var i = window.PorLiquidar ? PorLiquidar.importeDe(a) : null;
      return i && !i.sinImporte ? i.n : null;
    }
    if (col === 'plazo') {
      if (pestana === 'adm') return textoLimpio(e.hito && e.hito.fecha);
      if (pestana === 'esp') return e.hito ? -QueMeToca.diasParado(e.hito) : null;   /* más días, arriba */
      if (pestana === 'dorm') return typeof e.dias === 'number' ? -e.dias : null;     /* más días sin novedades, arriba */
      return textoLimpio(a.ficha && a.ficha.limite);
    }
    return null;
  }

  function comparar(x, y) {
    if (typeof x === 'number' && typeof y === 'number') return x === y ? 0 : (x < y ? -1 : 1);
    return comparador.compare(String(x), String(y));
  }

  function fechaInicio(e) {
    var a = asuntoDe(e);
    var f = a.leido && a.leido.fecha;
    return /^\d{6}$/.test(f || '') ? f : '999999';
  }

  /* Una copia de `lista` ordenada según la columna elegida (o la misma
     lista si no hay ninguna). `pestana`: adm, esp, todos, dorm o liq. */
  function ordenar(lista, pestana) {
    if (!estado.col) return lista;
    var col = estado.col, dir = estado.dir;
    var conClave = lista.map(function (e) { return { e: e, k: clave(col, e, pestana) }; });
    conClave.sort(function (p, q) {
      if (p.k === null && q.k === null) return desempate(p.e, q.e);
      if (p.k === null) return 1;
      if (q.k === null) return -1;
      var c = comparar(p.k, q.k);
      return c ? c * dir : desempate(p.e, q.e);
    });
    return conClave.map(function (p) { return p.e; });
  }

  function desempate(e1, e2) {
    var a = fechaInicio(e1), b = fechaInicio(e2);
    return a === b ? 0 : (a < b ? -1 : 1);
  }

  /* El orden natural de «Todos los abiertos»: los más antiguos arriba. */
  function naturalDeTodos(lista) {
    return lista.slice().sort(desempate);
  }

  function repintar() {
    if (window.App && App.repintarLaPestanaActiva) App.repintarLaPestanaActiva();
  }

  function pulsar(col) {
    if (estado.col === col) estado.dir = -estado.dir;
    else { estado.col = col; estado.dir = 1; }
    repintar();
  }

  /* Vuelve al orden de siempre. Devuelve true si había uno elegido. */
  function reiniciar() {
    var habia = !!estado.col;
    estado.col = null;
    estado.dir = 1;
    return habia;
  }

  /* Pone la flecha y engancha las pulsaciones en la cabecera que se ve. */
  function decorar(pestana) {
    var cab = document.getElementById(pestana === 'liq' ? 'inicio-thead-liquidar' : 'inicio-thead-normal');
    if (!cab) return;
    var columnas = pestana === 'liq' ? COLUMNAS_LIQUIDAR : COLUMNAS_NORMAL;
    var ths = cab.querySelectorAll('th');
    Array.prototype.forEach.call(ths, function (th, i) {
      var col = columnas[i];
      var vieja = th.querySelector('.orden-flecha');
      if (vieja) vieja.remove();
      th.classList.remove('th-ordenable', 'th-ordenada');
      th.removeAttribute('aria-sort');
      if (!col) return;
      th.classList.add('th-ordenable');
      th.dataset.col = col;
      th.onclick = function () { pulsar(col); };
      if (estado.col === col) {
        th.classList.add('th-ordenada');
        th.setAttribute('aria-sort', estado.dir === 1 ? 'ascending' : 'descending');
        var f = document.createElement('span');
        f.className = 'orden-flecha';
        f.textContent = estado.dir === 1 ? ' ▲' : ' ▼';
        th.appendChild(f);
      }
    });
  }

  return {
    ordenar: ordenar, decorar: decorar, reiniciar: reiniciar, pulsar: pulsar,
    naturalDeTodos: naturalDeTodos,
    /* para las pruebas */
    _estado: function () { return { col: estado.col, dir: estado.dir }; }
  };
})();
