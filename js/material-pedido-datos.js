/* ============================================================
   material-pedido-datos.js — la lógica pura del cuadro «Pedir N artículos» (fila 752,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 3): sin DOM ni disco, se comprueba sin navegador
   en pruebas/material-pedido-datos.mjs.

   Un cuadro de pedido es { filas, extras }:
   - fila:   { id, a: artículo, c: cantidad, para, origen: id de la línea de «Lo que falta», asig: proveedor o '' }
   - extras: proveedores añadidos a mano con «+ Otro proveedor» (columna sin precios)
   Los precios salen de `material-precios.json` (`Material.renglonesDe`): un renglón por proveedor, el último
   precio de cada uno. Los importes se redondean a céntimos; el IVA de las sumas es el 21 %.
   ============================================================ */
(function () {

  var IVA = 0.21;

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function lista(v) { return Array.isArray(v) ? v : []; }
  function clave(v) { return Material.clave(v); }
  function centimos(n) { return Math.round(Number(n) * 100) / 100; }
  function idFila() { return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* Las filas de partida: una por línea marcada de «Lo que falta». */
  function filasDeLineas(lineas) {
    return lista(lineas).map(function (l) {
      return { id: idFila(), a: l.a, c: Number(l.c) > 0 ? Number(l.c) : 1, para: l.para || '', origen: l.id, asig: '' };
    });
  }

  /* Los proveedores con columna: los que tienen algún precio de esos artículos y los añadidos a mano, por nombre. */
  function proveedoresDe(precios, filas, extras, hoy) {
    var vistos = {}, salida = [];
    function mirar(n) { var k = clave(n); if (k && !vistos[k]) { vistos[k] = 1; salida.push(texto(n)); } }
    var artsVistos = {};
    lista(filas).forEach(function (f) {
      if (artsVistos[f.a]) return;
      artsVistos[f.a] = 1;
      Material.renglonesDe(precios, f.a, hoy).forEach(function (r) { mirar(r.proveedor); });
    });
    lista(extras).forEach(mirar);
    return salida.sort(function (a, b) { return a.localeCompare(b, 'es'); });
  }

  /* El renglón de un proveedor para un artículo: { i, f, reciente, mejor } o null si no tiene precio. */
  function casilla(precios, articulo, proveedor, hoy) {
    var k = clave(proveedor);
    return Material.renglonesDe(precios, articulo, hoy).filter(function (r) { return clave(r.proveedor) === k; })[0] || null;
  }

  /* A quién va una línea de entrada: al más barato con precio reciente; si no hay, al más barato que haya; si no, a nadie. */
  function asignacionInicial(precios, articulo, hoy) {
    var rs = Material.renglonesDe(precios, articulo, hoy);
    var mejor = rs.filter(function (r) { return r.reciente; })[0] || rs[0];
    return mejor ? mejor.proveedor : '';
  }

  function asignarPorDefecto(precios, filas, hoy) {
    lista(filas).forEach(function (f) { f.asig = asignacionInicial(precios, f.a, hoy); });
  }

  /* Cambiar la cantidad de una fila. Si se baja, lo que queda pasa a otra fila del mismo artículo justo debajo,
     sin asignar. Devuelve { ok, partida: { aqui, resto } | null }. */
  function ponerCantidad(est, id, nueva) {
    nueva = Number(nueva);
    var i = est.filas.map(function (f) { return f.id; }).indexOf(id);
    if (i === -1 || !(nueva > 0)) return { ok: false };
    var f = est.filas[i];
    if (nueva < f.c) {
      var resto = Math.round((f.c - nueva) * 1000) / 1000;
      est.filas.splice(i + 1, 0, { id: idFila(), a: f.a, c: resto, para: f.para, origen: f.origen, asig: '' });
      f.c = nueva;
      return { ok: true, partida: { aqui: nueva, resto: resto } };
    }
    f.c = nueva;
    return { ok: true, partida: null };
  }

  /* Lo asignado a un proveedor: líneas, importe sin IVA y con IVA (21 %). Una fila sin precio de ese proveedor no cuenta. */
  function totalesDeProveedor(precios, filas, proveedor, hoy) {
    var k = clave(proveedor), n = 0, sin = 0;
    lista(filas).forEach(function (f) {
      if (clave(f.asig) !== k) return;
      var r = casilla(precios, f.a, proveedor, hoy);
      if (!r) return;
      n++; sin += centimos(r.i * f.c);
    });
    sin = centimos(sin);
    return { lineas: n, sinIva: sin, conIva: centimos(sin * (1 + IVA)) };
  }

  /* Portes: con el límite apuntado, «gratis» o «te faltan X €»; sin él, `limite` es null. Solo cuenta si hay algo asignado. */
  function portesDe(datosPrecios, proveedor, sinIva) {
    var limite = (datosPrecios && datosPrecios.portes && datosPrecios.portes[clave(proveedor)]) || null;
    if (!limite) return { limite: null, gratis: false, falta: 0 };
    return { limite: limite, gratis: sinIva >= limite, falta: sinIva >= limite ? 0 : centimos(limite - sinIva) };
  }

  /* «Este año»: facturado + pedido sin facturar + lo de este pedido, contra el tope del contrato menor. */
  function topeDe(cifras, esteSinIva) {
    var tope = Material.TOPE;
    var usado = centimos(((cifras && cifras.facturado) || 0) + ((cifras && cifras.sinFacturar) || 0) + (esteSinIva || 0));
    var pct = Math.round(usado / tope * 100);
    return { usado: usado, pct: pct, estado: usado > tope ? 'pasado' : (pct >= 80 ? 'cerca' : 'bien') };
  }

  /* Los pedidos que saldrían: un grupo por proveedor con líneas asignadas (y con precio). */
  function pedidosDe(cat, precios, est, hoy) {
    var provs = proveedoresDe(precios, est.filas, est.extras, hoy);
    return provs.map(function (p) {
      var lineas = lista(est.filas).filter(function (f) { return clave(f.asig) === clave(p) && casilla(precios, f.a, p, hoy); }).map(function (f) {
        var r = casilla(precios, f.a, p, hoy), a = Material.articuloDe(cat, f.a);
        return { a: f.a, n: a ? Material.nombreDe(cat, a) : '', u: a ? a.u : '', c: f.c, i: r.i, imp: centimos(r.i * f.c), para: f.para };
      });
      return { proveedor: p, lineas: lineas };
    }).filter(function (g) { return g.lineas.length; });
  }

  /* Qué pasa con «Lo que falta» al pedir: por cada línea de origen, lo que no se asigna se queda (con esa cantidad);
     lo que se asigna del todo se quita. Devuelve { quitar: [ids], poner: { id: cantidad } }. */
  function repartoDeFalta(est, pedidos) {
    var quitar = [], poner = {}, porOrigen = {};
    lista(est.filas).forEach(function (f) { (porOrigen[f.origen] = porOrigen[f.origen] || []).push(f); });
    Object.keys(porOrigen).forEach(function (origen) {
      var filas = porOrigen[origen], sobra = 0;
      filas.forEach(function (f) {
        var asignada = f.asig && lista(pedidos).some(function (g) {
          return clave(g.proveedor) === clave(f.asig) && g.lineas.some(function (l) { return l.a === f.a && l.c === f.c; });
        });
        if (!asignada) sobra += f.c;
      });
      sobra = Math.round(sobra * 1000) / 1000;
      if (sobra > 0) poner[origen] = sobra; else quitar.push(origen);
    });
    return { quitar: quitar, poner: poner };
  }

  Material.PedidoDatos = {
    IVA: IVA, filasDeLineas: filasDeLineas, proveedoresDe: proveedoresDe, casilla: casilla, asignacionInicial: asignacionInicial,
    asignarPorDefecto: asignarPorDefecto, ponerCantidad: ponerCantidad, totalesDeProveedor: totalesDeProveedor,
    portesDe: portesDe, topeDe: topeDe, pedidosDe: pedidosDe, repartoDeFalta: repartoDeFalta
  };
})();
