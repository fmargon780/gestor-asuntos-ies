/* ============================================================
   material-factura-datos.js — la lógica pura de «Pedido y factura» (fila 754,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 5): sin DOM ni disco, se comprueba sin navegador
   en pruebas/material-factura-datos.mjs.

   Lo de cada pedido vive en la ficha del asunto COMPRA (`ficha.pedido`, que crea js/material-pedido-crear.js)
   y esta parte le añade:
   - rec:     [recibido de cada línea] (de entrada, todo lo pedido; si falta, vale lo pedido)
   - fac:     [{ c: cantidad facturada, i: precio facturado sin IVA }] por línea ('' = aún sin factura)
   - factura: { num, f, base, iva, tot } (solo en el pedido donde se escribe la factura)
   - junto:   [nombres de otros asuntos COMPRA del mismo proveedor que van en esta misma factura]
   - repuesto: true cuando ya se ha vuelto a pedir lo no recibido (solo una vez)

   «Grupo» = el pedido de la factura y los que se le juntan: [{ nombre, pedido }].
   Los importes se redondean a céntimos antes de comparar (menos de 0,01 € de diferencia = igual).
   ============================================================ */
(function () {

  var IVA = 0.21;

  function lista(v) { return Array.isArray(v) ? v : []; }
  function centimos(n) { return Math.round(Number(n) * 100) / 100; }
  /* Un número escrito (con coma o con punto) o null si está vacío o no es un número. */
  function num(v) {
    if (v === '' || v == null) return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  function cantidadTexto(n) { return String(Math.round(Number(n) * 1000) / 1000).replace('.', ','); }
  function eur(n) { return Material.euros(n); }

  function recibidoDe(p, i) {
    var r = num(lista(p.rec)[i]);
    return r == null ? p.lineas[i].c : r;
  }
  function facturadoDe(p, i) {
    var f = lista(p.fac)[i] || {};
    return { c: num(f.c), i: num(f.i) };
  }

  /* Cada línea de un pedido con lo recibido, lo facturado y lo que dice la comparación. */
  function lineasDe(p) {
    return lista(p.lineas).map(function (l, i) {
      var rec = recibidoDe(p, i), f = facturadoDe(p, i);
      var falta = f.c == null || f.i == null;
      var dRec = rec !== l.c;
      var dC = f.c != null && f.c !== rec;
      var dP = f.i != null && Math.abs(centimos(f.i) - centimos(l.i)) >= 0.01;
      var textos = [];
      if (dRec) textos.push('recibido ' + cantidadTexto(rec) + ' de ' + cantidadTexto(l.c));
      if (dC) textos.push('facturado ' + cantidadTexto(f.c) + ', recibido ' + cantidadTexto(rec));
      if (dP) textos.push('precio ' + eur(f.i) + ' en vez de ' + eur(l.i));
      return {
        indice: i, linea: l, rec: rec, fc: f.c, fi: f.i, importe: falta ? null : centimos(f.c * f.i),
        dRec: dRec, dC: dC, dP: dP, falta: falta, textos: textos,
        diferencia: dRec || dC || dP,
        /* «falta la factura», «✓ cuadra» o las diferencias, como el texto de la parte 5 */
        estado: falta ? 'falta' : (textos.length ? 'difiere' : 'cuadra'),
        enRojo: dRec || dC || dP
      };
    });
  }

  /* Las tres comprobaciones de una factura contra lo que suman las líneas. `F` = { base, iva, tot }. */
  function comprobarFactura(F, suma) {
    var base = num(F.base), iva = num(F.iva), tot = num(F.tot), c = [];
    if (base != null) {
      c.push(Math.abs(base - suma) < 0.01
        ? { ok: true, texto: 'Las líneas suman ' + eur(suma) + ', igual que la base imponible.' }
        : { ok: false, texto: 'Las líneas suman ' + eur(suma) + ' y la base imponible es ' + eur(base) + '.' });
    }
    if (base != null && iva != null) {
      c.push(Math.abs(base * IVA - iva) < 0.01
        ? { ok: true, texto: 'IVA al 21 %.' }
        : { ok: false, texto: 'El IVA no es el 21 % de la base (sería ' + eur(centimos(base * IVA)) + ').' });
    }
    if (base != null && iva != null && tot != null) {
      c.push(Math.abs(base + iva - tot) < 0.01
        ? { ok: true, texto: 'Base más IVA da el total.' }
        : { ok: false, texto: 'Base más IVA da ' + eur(centimos(base + iva)) + ', no ' + eur(tot) + '.' });
    }
    return { comprobaciones: c, ok: base != null && iva != null && tot != null && c.every(function (x) { return x.ok; }) };
  }

  /* Todo lo que enseña el bloque de un grupo de pedidos y su factura. */
  function resumenDe(grupo, factura) {
    var porPedido = lista(grupo).map(function (g) { return { nombre: g.nombre, pedido: g.pedido, lineas: lineasDe(g.pedido) }; });
    var suma = 0, dif = 0, falta = 0, pendientes = 0;
    porPedido.forEach(function (g) {
      g.lineas.forEach(function (l) {
        if (l.importe != null) suma += l.importe;
        if (l.diferencia) dif++;
        if (l.falta) falta++;
        if (l.rec < l.linea.c) pendientes++;
      });
    });
    suma = centimos(suma);
    var comp = falta ? { comprobaciones: [], ok: false } : comprobarFactura(factura || {}, suma);
    var conforme = !falta && !dif && comp.ok;
    return {
      porPedido: porPedido, suma: suma, diferencias: dif, faltan: falta, pendientes: pendientes,
      comprobaciones: comp.comprobaciones, conforme: conforme,
      /* '' sin factura todavía, o «conforme» / «diferencias» */
      veredicto: falta ? '' : (conforme ? 'conforme' : 'diferencias')
    };
  }

  /* Lo que vuelve a «Lo que falta»: lo no recibido de cada línea, con su destino. */
  function reposicion(grupo) {
    var salida = [];
    lista(grupo).forEach(function (g) {
      lista(g.pedido.lineas).forEach(function (l, i) {
        var rec = recibidoDe(g.pedido, i);
        if (rec < l.c) salida.push({ a: l.a, c: Math.round((l.c - rec) * 1000) / 1000, para: l.para || '' });
      });
    });
    return salida;
  }

  /* Los precios facturados que pasan al catálogo: uno por línea facturada, con la fecha de la factura. */
  function preciosFacturados(grupo, factura) {
    var fecha = String((factura && factura.f) || ''), num_ = String((factura && factura.num) || '').trim();
    var salida = [];
    lista(grupo).forEach(function (g) {
      lineasDe(g.pedido).forEach(function (l) {
        if (l.fi == null || !(l.fi > 0) || !l.linea.a) return;
        salida.push({ a: l.linea.a, p: g.pedido.proveedor, i: centimos(l.fi), f: fecha, o: ('Factura ' + num_).trim() });
      });
    });
    return salida;
  }

  /* El registro de lo facturado, en `material-precios.json` (`facturas`): una entrada por asunto con base imponible,
     para que «Facturado en el año» siga contando cuando el asunto se cierra. Sin base, se quita. */
  function ponerFactura(datos, id, proveedor, fecha, base) {
    datos.facturas = lista(datos.facturas).filter(function (x) { return x.id !== id; });
    var b = num(base);
    if (b != null && b > 0) datos.facturas.push({ id: id, p: String(proveedor || ''), f: String(fecha || ''), base: centimos(b) });
  }

  /* Los pedidos abiertos del mismo proveedor que se pueden juntar a esta factura. `todos` = [{ nombre, pedido }]. */
  function juntables(todos, actual) {
    var k = Material.clave(actual.pedido.proveedor);
    var yaJuntos = {};
    lista(todos).forEach(function (t) { lista(t.pedido.junto).forEach(function (n) { yaJuntos[n] = t.nombre; }); });
    return lista(todos).filter(function (t) {
      return t.nombre !== actual.nombre && Material.clave(t.pedido.proveedor) === k && !yaJuntos[t.nombre] &&
        !lista(t.pedido.junto).length && !(t.pedido.factura && num(t.pedido.factura.base) != null);
    });
  }

  Material.FacturaDatos = {
    IVA: IVA, num: num, lineasDe: lineasDe, comprobarFactura: comprobarFactura, resumenDe: resumenDe,
    reposicion: reposicion, preciosFacturados: preciosFacturados, ponerFactura: ponerFactura, juntables: juntables,
    recibidoDe: recibidoDe, cantidadTexto: cantidadTexto
  };
})();
