/* ============================================================
   material-factura-guardar.js — los guardados del bloque «Pedido y factura» (fila 754,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 5).

   Lo de cada pedido se guarda en la ficha de su asunto COMPRA (`ficha.pedido`: rec, fac, factura, junto, repuesto,
   ver js/material-factura-datos.js) por `App.guardarRegistroFresco`, que relee `asuntos.json` antes de escribir y
   pasa por la cola de guardado; lo de «Lo que falta» y los precios, por `Material.cambiarFalta` y
   `Material.cambiarPrecios`. Cada función devuelve una promesa; quien la llama enseña el error.
   ============================================================ */
(function () {

  function D() { return Material.FacturaDatos; }
  function hoy() { return Material.hoyIso(); }

  /* Cambia el pedido de un asunto con lo que haya ahora en el disco. `hacer(pedido, ficha)` puede lanzar. */
  async function cambiarPedido(nombre, hacer) {
    var salida;
    await App.guardarRegistroFresco(async function (registro) {
      await App.comprobarNoCerrado(nombre);
      var ficha = registro.asuntos[nombre];
      if (!ficha || !ficha.pedido || !Array.isArray(ficha.pedido.lineas)) throw new Error('Este asunto ya no tiene pedido.');
      salida = hacer(ficha.pedido, ficha, registro);
    });
    return salida;
  }

  /* Una casilla de la tabla: recibido (`rec`), cantidad facturada (`fc`) o precio facturado (`fi`). Vacía vuelve al principio. */
  function ponerLinea(nombre, i, tipo, valor) {
    var n = D().num(valor);
    if (valor !== '' && (n == null || n < 0)) return Promise.reject(new Error('Escribe un número, o déjalo vacío.'));
    return cambiarPedido(nombre, function (p) {
      var l = p.lineas[i];
      if (!l) return;
      if (tipo === 'rec') {
        p.rec = (p.rec || []).slice(0, p.lineas.length);
        while (p.rec.length < p.lineas.length) p.rec.push(p.lineas[p.rec.length].c);
        p.rec[i] = n == null ? l.c : n;
      } else {
        p.fac = (p.fac || []).slice(0, p.lineas.length);
        while (p.fac.length < p.lineas.length) p.fac.push({ c: '', i: '' });
        p.fac[i] = Object.assign({ c: '', i: '' }, p.fac[i]);
        p.fac[i][tipo === 'fc' ? 'c' : 'i'] = n == null ? '' : n;
      }
    });
  }

  /* Un dato de la factura. Con la base imponible apuntada, el asunto cuenta como facturado en «Proveedores». */
  async function ponerFactura(nombre, campo, valor) {
    var esNumero = campo === 'base' || campo === 'iva' || campo === 'tot';
    var n = esNumero ? D().num(valor) : null;
    if (esNumero && valor !== '' && n == null) throw new Error('Escribe un importe.');
    var datos = {};
    await cambiarPedido(nombre, function (p) {
      p.factura = Object.assign({ num: '', f: '', base: '', iva: '', tot: '' }, p.factura);
      p.factura[campo] = esNumero ? (n == null ? '' : n) : String(valor || '').trim();
      datos = { proveedor: p.proveedor, fecha: p.factura.f || p.fecha, base: p.factura.base };
    });
    await Material.cambiarPrecios(function (d) { D().ponerFactura(d, nombre, datos.proveedor, datos.fecha, datos.base); });
  }

  function juntar(nombre, otro) {
    return cambiarPedido(nombre, function (p, f, registro) {
      var ficha = registro.asuntos[otro];
      if (!ficha || ficha.estado !== 'abierto' || !ficha.pedido) throw new Error('Ese pedido ya no está abierto.');
      var yaEnOtro = Object.keys(registro.asuntos).some(function (n) { var q = registro.asuntos[n]; return n !== nombre && q && q.pedido && (q.pedido.junto || []).indexOf(otro) !== -1; });
      if (yaEnOtro) throw new Error('Ese pedido ya va en la factura de otro asunto.');
      p.junto = (p.junto || []).filter(function (n) { return n !== otro; }).concat([otro]);
    });
  }

  function quitarJunto(nombre, otro) {
    return cambiarPedido(nombre, function (p) { p.junto = (p.junto || []).filter(function (n) { return n !== otro; }); });
  }

  /* «Volver a pedir lo no recibido»: lo que falta por recibir vuelve a «Lo que falta» con su destino; solo una vez. */
  async function reponer(nombre) {
    var grupo = FacturaFicha.grupoDe(nombre);
    if (grupo.some(function (g) { return g.pedido.repuesto; })) return 'Ya se volvió a pedir lo no recibido de este pedido.';
    var items = D().reposicion(grupo);
    if (!items.length) return 'No falta nada por recibir.';
    var quien = Material.quienSoy(), fecha = hoy();
    await Material.cambiarFalta(function (d) {
      items.forEach(function (x) { Material.apuntar(d, { a: x.a, c: x.c, para: x.para, q: quien, f: fecha }); });
    });
    for (var i = 0; i < grupo.length; i++) await cambiarPedido(grupo[i].nombre, function (p) { p.repuesto = true; });
    return items.length === 1 ? 'Una línea ha vuelto a «Lo que falta».' : items.length + ' líneas han vuelto a «Lo que falta».';
  }

  /* «Pasar los precios facturados al catálogo»: cada precio facturado entra con la fecha de la factura y «Factura <nº>». */
  async function alCatalogo(nombre) {
    var grupo = FacturaFicha.grupoDe(nombre), factura = grupo[0] && grupo[0].pedido.factura;
    if (!factura || !/^\d{4}-\d{2}-\d{2}$/.test(String(factura.f || ''))) throw new Error('Escribe la fecha de la factura.');
    var res = D().resumenDe(grupo, factura);
    if (res.faltan) throw new Error('Faltan líneas por facturar.');
    var items = D().preciosFacturados(grupo, factura), error = '';
    await Material.cambiarPrecios(function (d) {
      items.forEach(function (x) { var r = Material.anadirPrecio(d, x); if (!r.ok && !error) error = r.error; });
      if (error) return { ok: false, error: error };
    });
    if (error) throw new Error(error);
    return items.length === 1 ? 'Un precio pasado al catálogo (' + ('Factura ' + (factura.num || '')).trim() + ').'
      : items.length + ' precios pasados al catálogo (' + ('Factura ' + (factura.num || '')).trim() + ').';
  }

  Material.FacturaGuardar = { cambiarPedido: cambiarPedido, ponerLinea: ponerLinea, ponerFactura: ponerFactura, juntar: juntar, quitarJunto: quitarJunto, reponer: reponer, alCatalogo: alCatalogo };
})();
