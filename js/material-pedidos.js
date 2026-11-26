/* ============================================================
   material-pedidos.js — la pestaña «Pedidos» de «Material» (fila 752, docs/583-COMPRAS-DE-MATERIAL.md, parte 3).

   Un recuadro por asunto COMPRA abierto con líneas de pedido (`ficha.pedido`, que escribe js/material-pedido-crear.js):
   número y nombre (abre el asunto), «pedido el <fecha>», el documento de pedido (se abre) y, cuando exista la
   parte 5, «Comprobar recibido y factura»; debajo, la tabla Artículo, Cantidad, Precio, Importe y
   «Total sin IVA · con IVA (21 %)». Sale de aquí cuando se cierra el asunto.

   También da a las demás pestañas lo que ahora ya existe: `Material.proveedoresConPedido()` (los proveedores
   con algún pedido abierto) y `Material.cifrasDeProveedor(clave)` (lo de partida más el «pedido sin facturar»
   de este año natural; el «facturado» llega con la parte 5).
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }
  function centimos(n) { return Math.round(Number(n) * 100) / 100; }

  /* Los asuntos COMPRA abiertos con pedido, del más nuevo al más viejo: [{ nombre, ficha, pedido }]. */
  function abiertos() {
    var asuntos = (window.App && App.E && App.E.registro && App.E.registro.asuntos) || {};
    return Object.keys(asuntos).filter(function (n) {
      var f = asuntos[n];
      return f && f.estado === 'abierto' && f.pedido && Array.isArray(f.pedido.lineas) && f.pedido.lineas.length;
    }).map(function (n) { return { nombre: n, ficha: asuntos[n], pedido: asuntos[n].pedido }; })
      .sort(function (a, b) { return a.pedido.fecha < b.pedido.fecha ? 1 : (a.pedido.fecha > b.pedido.fecha ? -1 : (a.nombre < b.nombre ? 1 : -1)); });
  }
  Material.pedidosAbiertos = abiertos;

  Material.proveedoresConPedido = function () { return abiertos().map(function (p) { return p.pedido.proveedor; }); };

  /* Lo de partida de ese proveedor (`cifras` de material-precios.json) más el pedido sin facturar de este año. */
  Material.cifrasDeProveedor = function (k) {
    var base = (Material.estado.precios && Material.estado.precios.cifras && Material.estado.precios.cifras[k]) || { facturado: 0, sinFacturar: 0 };
    var anio = String(Material.hoyIso()).slice(0, 4), extra = 0;
    abiertos().forEach(function (p) {
      if (Material.clave(p.pedido.proveedor) === k && String(p.pedido.fecha).slice(0, 4) === anio && !(p.pedido.factura && p.pedido.factura.base)) extra += Number(p.pedido.sinIva) || 0;
    });
    return { facturado: base.facturado || 0, sinFacturar: centimos((base.sinFacturar || 0) + extra) };
  };

  async function abrirDocumento(p) {
    try {
      var carpeta = await ElegirAsunto.carpetaDelAsunto(p.nombre, p.ficha);
      var f = await (await carpeta.getFileHandle(p.pedido.doc)).getFile();
      if (window.Lector) Lector.abrir({ titulo: p.pedido.doc, pie: p.nombre, blob: f });
    } catch (e) { U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(e), 'ambar'); }
  }

  function recuadro(p, i) {
    var lineas = p.pedido.lineas, t = Material.PedidoCrear.totalesDe(lineas);
    return '<section class="material-caja mp-pedido" data-pedido="' + i + '"><h3><span><button type="button" class="boton-enlace" data-abre="' + i + '">' +
      esc(p.ficha.numero || '') + ' · ' + esc(p.pedido.proveedor) + '</button> <span class="suave">pedido el ' + esc(Material.fechaCorta(p.pedido.fecha)) + '</span></span>' +
      '<span>' + (p.pedido.doc ? '<button type="button" class="boton-enlace" data-doc="' + i + '">' + esc(p.pedido.doc) + '</button>' : '<span class="suave">sin documento de pedido</span>') +
      (Material.comprobarPedido ? ' <button type="button" class="boton" data-comprueba="' + i + '">Comprobar recibido y factura</button>' : '') + '</span></h3>' +
      '<table class="material-tabla"><thead><tr><th>Artículo</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead><tbody>' +
      lineas.map(function (l) {
        return '<tr><td>' + esc(l.n) + (l.para ? ' <span class="suave">· para ' + esc(l.para) + '</span>' : '') + '</td><td class="material-num">' + esc(String(l.c).replace('.', ',')) + ' ' + esc(l.u) +
          '</td><td class="material-num">' + esc(Material.euros(l.i)) + '</td><td class="material-num">' + esc(Material.euros(centimos(l.i * l.c))) + '</td></tr>';
      }).join('') + '<tr><td colspan="3" class="material-num"><b>Total sin IVA · con IVA (21 %)</b></td><td class="material-num"><b>' +
      esc(Material.euros(t.sinIva)) + ' · ' + esc(Material.euros(t.conIva)) + '</b></td></tr></tbody></table></section>';
  }

  function pintar(caja) {
    var lista = abiertos();
    caja.innerHTML = '<p class="explica">Los pedidos que se han hecho desde «Lo que falta», uno por proveedor. Cada uno es un asunto COMPRA: ábrelo para ver su documento de pedido. ' +
      'Sale de aquí cuando se cierra el asunto.</p>' +
      (lista.length ? lista.map(recuadro).join('') : '<p class="explica">No hay pedidos abiertos. Se hacen marcando líneas en «Lo que falta» y pulsando «Pedir lo marcado».</p>');
    Array.prototype.forEach.call(caja.querySelectorAll('[data-abre]'), function (b) {
      b.onclick = function () {
        var p = lista[parseInt(b.getAttribute('data-abre'), 10)];
        if (p && window.Navegacion && !Navegacion.abrirAbierto(p.nombre)) U.aviso('No encuentro ese asunto entre los abiertos. Pulsa Recargar.', 'ambar');
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-doc]'), function (b) {
      b.onclick = function () { var p = lista[parseInt(b.getAttribute('data-doc'), 10)]; if (p) abrirDocumento(p); };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-comprueba]'), function (b) {
      b.onclick = function () { var p = lista[parseInt(b.getAttribute('data-comprueba'), 10)]; if (p && Material.comprobarPedido) Material.comprobarPedido(p.nombre); };
    });
  }

  Material.registrarPestana({
    id: 'pedidos', titulo: 'Pedidos', orden: 20,
    cuenta: function () { return abiertos().length; },
    pintar: pintar
  });
})();
