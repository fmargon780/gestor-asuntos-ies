/* ============================================================
   material-proveedores.js — la pestaña «Proveedores» de «Material» (fila 751,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 2): una fila por proveedor con algún precio o pedido.

   Columnas: Proveedor, Correo, Portes gratis desde (se cambia pulsándolo; vacío = «sin apuntar»), Facturado en el año
   natural, Pedido sin facturar, y una barra hacia el tope del contrato menor de suministros (15.000 € sin IVA) con
   «N € · N %»: ámbar desde el 80 % («cerca del tope»), roja al pasarlo («pasado del tope»).
   Hasta la parte 5, «Facturado» y «Pedido sin facturar» van a cero.
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }

  function filas(estado) {
    var precios = estado.precios || Material.normalizarPrecios(null);
    return Material.proveedoresDe(precios, estado.empresas, Material.proveedoresConPedido()).map(function (p) {
      var c = Material.cifrasDeProveedor ? Material.cifrasDeProveedor(Material.clave(p.nombre)) : undefined;
      return Material.filaDeProveedor(precios, p.nombre, p.correo, c);
    });
  }

  function pintar(caja, estado) {
    var lista = filas(estado);
    caja.innerHTML = '<p class="explica">Cada proveedor con algún precio o pedido. <b>Portes gratis desde</b>: lo que hay que pedir para no pagar transporte (púlsalo para cambiarlo). ' +
      '<b>Facturado</b> y <b>Pedido sin facturar</b>: lo de este año natural, sin IVA. La barra mide lo que llevas contra el tope de ' + esc(Material.euros(Material.TOPE)) +
      ' del contrato menor de suministros.</p>' +
      (lista.length ? '<table class="material-tabla"><thead><tr><th>Proveedor</th><th>Correo</th><th>Portes gratis desde</th><th>Facturado en el año</th>' +
        '<th>Pedido sin facturar</th><th>Contra el tope de ' + esc(Material.euros(Material.TOPE)) + '</th></tr></thead><tbody>' + lista.map(function (f) {
          var rotulo = f.estado === 'pasado' ? 'pasado del tope' : (f.estado === 'cerca' ? 'cerca del tope' : '');
          return '<tr><td>' + esc(f.proveedor) + '</td><td>' + (f.correo ? esc(f.correo) : '<span class="suave">sin correo</span>') + '</td>' +
            '<td><button type="button" class="boton-enlace" data-portes="' + esc(f.proveedor) + '">' + (f.portes ? esc(Material.euros(f.portes)) : 'sin apuntar') + '</button></td>' +
            '<td class="material-num">' + esc(Material.euros(f.facturado)) + '</td><td class="material-num">' + esc(Material.euros(f.sinFacturar)) + '</td>' +
            '<td><div class="material-barra material-barra-' + f.estado + '" title="' + esc(rotulo) + '"><span style="width:' + Math.min(100, f.pct) + '%"></span></div>' +
            '<div class="material-barra-texto">' + esc(Material.euros(f.usado)) + ' · ' + f.pct + ' %' + (rotulo ? ' · <b>' + rotulo + '</b>' : '') + '</div></td></tr>';
        }).join('') + '</tbody></table>'
        : '<p class="explica">Aún no hay proveedores: salen aquí cuando apuntas el primer precio en el catálogo.</p>');
    Array.prototype.forEach.call(caja.querySelectorAll('[data-portes]'), function (b) {
      b.onclick = function () { cambiarPortes(b.getAttribute('data-portes')); };
    });
  }

  /* El cuadro de «Portes gratis desde» (lo usa también el cuadro «Pedir», parte 3). */
  async function cambiarPortes(proveedor) {
    var actual = (Material.estado.precios && Material.estado.precios.portes[Material.clave(proveedor)]) || '';
    var ok = await Material.cuadro('Portes gratis · ' + proveedor,
      '<div class="material-fila-campo"><label for="material-portes">Desde (€, sin IVA)</label><input type="text" id="material-portes" class="campo" inputmode="decimal" autocomplete="off" value="' +
      esc(actual === '' ? '' : String(actual).replace('.', ',')) + '"></div><p class="explica">Déjalo vacío si no lo sabes: saldrá «sin apuntar».</p>', 'Guardar',
      function () { $('material-portes').focus(); $('material-portes').select(); },
      async function () {
        var v = $('material-portes').value;
        var r = await Material.cambiarPrecios(function (d) { return Material.ponerPortes(d, proveedor, v); });
        return r.ok ? '' : r.error;
      });
    if (ok) await Material.recargar();
    return ok;
  }
  Material.cambiarPortes = cambiarPortes;

  Material.registrarPestana({
    id: 'proveedores', titulo: 'Proveedores', orden: 40,
    cuenta: function (estado) { return filas(estado).length; },
    pintar: pintar
  });
})();
