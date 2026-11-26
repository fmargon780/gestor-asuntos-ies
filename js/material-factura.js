/* ============================================================
   material-factura.js — el bloque «Pedido y factura» del asunto COMPRA (fila 754,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 5).

   Es una tarjeta plegable de la ficha del asunto (js/ficha-tarjetas.js, `#ficha-pedido`) que solo sale en un asunto
   con `ficha.pedido` (lo crea js/material-pedido-crear.js). Se llega también desde «Pedidos» › «Comprobar recibido
   y factura» (`Material.comprobarPedido`). La lógica de comparar está en js/material-factura-datos.js; los guardados
   (releyendo antes de escribir) en js/material-factura-guardar.js.

   Tabla agrupada por pedido: Artículo, Pedido, Recibido, Facturado: cantidad, Facturado: precio sin IVA, Importe
   facturado y Comparación (las casillas con diferencia, en rojo claro). Debajo, la factura (Nº, Fecha, Base, IVA, Total)
   con sus comprobaciones, «Volver a pedir lo no recibido» y «Pasar los precios facturados al catálogo».
   ============================================================ */
var FacturaFicha = (function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }
  var D = function () { return Material.FacturaDatos; };

  var actual = null;
  var turno = 0;

  function aplica(a) {
    var p = a && a.ficha && a.ficha.pedido;
    return !!(p && Array.isArray(p.lineas) && p.lineas.length);
  }

  function registro() { return (App.E && App.E.registro && App.E.registro.asuntos) || {}; }

  /* Todos los asuntos abiertos con pedido: [{ nombre, pedido, ficha }]. */
  function todos() {
    var r = registro();
    return Object.keys(r).filter(function (n) { return r[n] && r[n].estado === 'abierto' && r[n].pedido && Array.isArray(r[n].pedido.lineas) && r[n].pedido.lineas.length; })
      .map(function (n) { return { nombre: n, pedido: r[n].pedido, ficha: r[n] }; });
  }

  /* El grupo de este asunto: él y los que tiene juntados (si ya no existe alguno, se salta). */
  function grupoDe(nombre) {
    var r = registro(), p = r[nombre] && r[nombre].pedido;
    if (!p) return [];
    var salida = [{ nombre: nombre, pedido: p }];
    (p.junto || []).forEach(function (n) { if (r[n] && r[n].pedido && Array.isArray(r[n].pedido.lineas)) salida.push({ nombre: n, pedido: r[n].pedido }); });
    return salida;
  }

  function celdaNum(clase, k, valor, ancho, paso) {
    return '<input type="number" min="0"' + (paso ? ' step="' + paso + '"' : '') + ' class="campo" data-' + clase + '="' + esc(k) + '" value="' +
      esc(valor == null ? '' : String(valor)) + '" style="width:' + ancho + 'px">';
  }

  function filasHtml(res, principal) {
    return res.porPedido.map(function (g) {
      var quitar = g.nombre === principal ? '' : ' <button type="button" class="boton-enlace" data-quitar-junto="' + esc(g.nombre) + '">quitar de esta factura</button>';
      var cab = '<tr class="mf-pedido"><td colspan="7"><b>Pedido ' + esc(((registro()[g.nombre] || {}).numero) || g.nombre) + '</b> <span class="suave">· ' +
        esc(Material.fechaCorta(g.pedido.fecha)) + '</span>' + quitar + '</td></tr>';
      return cab + g.lineas.map(function (l) {
        var k = g.nombre + '|' + l.indice;
        var est = l.estado === 'falta' ? '<span class="suave">falta la factura</span>'
          : (l.estado === 'cuadra' ? '<span class="mf-bien">✓ cuadra</span>' : '<span class="mf-mal">' + esc(l.textos.join(' · ')) + '</span>');
        return '<tr><td>' + esc(l.linea.n) + (l.linea.para ? '<br><small class="suave">para ' + esc(l.linea.para) + '</small>' : '') + '</td>' +
          '<td class="material-num">' + esc(D().cantidadTexto(l.linea.c)) + ' × ' + esc(Material.euros(l.linea.i)) + '<br><small>' + esc(Material.euros(l.linea.c * l.linea.i)) + '</small></td>' +
          '<td class="material-num' + (l.dRec ? ' mf-dif' : '') + '">' + celdaNum('rec', k, l.rec, 64) + '</td>' +
          '<td class="material-num' + (l.dC ? ' mf-dif' : '') + '">' + celdaNum('fc', k, l.fc, 64) + '</td>' +
          '<td class="material-num' + (l.dP ? ' mf-dif' : '') + '">' + celdaNum('fi', k, l.fi, 84, '0.01') + '</td>' +
          '<td class="material-num">' + (l.importe == null ? '' : esc(Material.euros(l.importe))) + '</td><td>' + est + '</td></tr>';
      }).join('');
    }).join('');
  }

  function cuerpo(a) {
    var nombre = a.nombre, grupo = grupoDe(nombre), principal = grupo[0], p = principal.pedido;
    var factura = p.factura || {};
    var res = D().resumenDe(grupo, factura);
    var otros = D().juntables(todos(), principal);
    var enOtra = todos().filter(function (t) { return (t.pedido.junto || []).indexOf(nombre) !== -1; })[0];
    if (enOtra) {
      return '<p class="explica">Este pedido va en la factura del asunto <button type="button" class="boton-enlace" data-ir="' + esc(enOtra.nombre) + '">' +
        esc(enOtra.ficha.numero || enOtra.nombre) + '</button>: allí se comprueba lo recibido y la factura.</p>';
    }
    var juntar = otros.length
      ? 'Esta factura incluye también otro pedido de este proveedor: <select id="mf-juntar" class="campo"><option value="">Elige el pedido…</option>' +
        otros.map(function (o) { return '<option value="' + esc(o.nombre) + '">' + esc(o.ficha.numero || o.nombre) + '</option>'; }).join('') + '</select>'
      : (grupo.length > 1 ? '<span class="suave">Esta factura junta ' + grupo.length + ' pedidos de este proveedor.</span>'
        : '<span class="suave">No hay otros pedidos abiertos de este proveedor para juntar en esta factura.</span>');
    if (otros.length && grupo.length > 1) juntar += ' <span class="suave">· ya junta ' + grupo.length + ' pedidos.</span>';

    var checks = res.comprobaciones.map(function (c) { return '<span class="' + (c.ok ? 'mf-bien' : 'mf-mal') + '">' + (c.ok ? '✓ ' : '') + esc(c.texto) + '</span>'; }).join('<br>');
    var veredicto = res.faltan ? '' : (res.conforme
      ? '<b class="mf-bien">✓ Factura conforme</b> con ' + (grupo.length > 1 ? 'los pedidos' : 'el pedido') + ' y lo recibido.'
      : '<b class="mf-mal">Con diferencias</b>: revisa lo marcado en rojo.');
    var campo = function (id, rotulo, tipo, v, extra) {
      return '<label>' + rotulo + '<br><input type="' + tipo + '" class="campo" id="mf-' + id + '" value="' + esc(v == null ? '' : String(v)) + '"' + (extra || '') + ' style="width:100%"></label>';
    };
    var yaRepuesto = grupo.some(function (g) { return g.pedido.repuesto; });
    var conPrecios = !res.faltan && !!factura.f;
    return '<p class="mf-juntar">' + juntar + '</p>' +
      '<table class="material-tabla mf-tabla"><thead><tr><th>Artículo</th><th>Pedido</th><th>Recibido</th><th>Facturado: cantidad</th><th>Facturado: precio sin IVA</th>' +
      '<th>Importe facturado</th><th style="width:26%">Comparación</th></tr></thead><tbody>' + filasHtml(res, nombre) + '</tbody></table>' +
      '<h4 class="mf-titulo">Factura</h4><div class="mf-factura">' + campo('num', 'Nº', 'text', factura.num, ' autocomplete="off"') + campo('f', 'Fecha', 'date', factura.f) +
      campo('base', 'Base imponible', 'number', factura.base, ' step="0.01"') + campo('iva', 'IVA', 'number', factura.iva, ' step="0.01"') +
      campo('tot', 'Total', 'number', factura.tot, ' step="0.01"') + '</div>' +
      '<p class="mf-checks">' + (checks || '<span class="suave">Cuando llegue la factura, escribe lo que pone en cada línea y aquí sus importes.</span>') + '</p>' +
      '<p class="mf-veredicto">' + veredicto + '</p>' +
      '<div class="material-acciones"><button type="button" class="boton" id="mf-reponer"' + (res.pendientes && !yaRepuesto ? '' : ' disabled') + '>Volver a pedir lo no recibido' +
        (res.pendientes ? ' (' + res.pendientes + ')' : '') + '</button>' +
      '<button type="button" class="boton boton-principal" id="mf-catalogo"' + (conPrecios ? '' : ' disabled') + '>Pasar los precios facturados al catálogo</button></div>';
  }

  function enganchar(caja, a) {
    var G = Material.FacturaGuardar, nombre = a.nombre;
    Array.prototype.forEach.call(caja.querySelectorAll('input[data-rec], input[data-fc], input[data-fi]'), function (c) {
      c.onchange = function () {
        var tipo = c.hasAttribute('data-rec') ? 'rec' : (c.hasAttribute('data-fc') ? 'fc' : 'fi');
        var k = c.getAttribute('data-' + tipo).split('|');
        G.ponerLinea(k[0], parseInt(k[1], 10), tipo, c.value).then(function () { repintar(); }, function (e) { U.fallo('No he podido guardar', e); });
      };
    });
    ['num', 'base', 'iva', 'tot'].forEach(function (id) {
      var c = $('mf-' + id);
      if (c) c.onchange = function () { G.ponerFactura(nombre, id, c.value).then(function () { repintar(); }, function (e) { U.fallo('No he podido guardar la factura', e); }); };
    });
    var f = $('mf-f');
    if (f) U.alTerminarFecha(f, function (v) { return G.ponerFactura(nombre, 'f', v).then(function () { repintar(); return true; }, function (e) { U.fallo('No he podido guardar la factura', e); return false; }); });
    var j = $('mf-juntar');
    if (j) j.onchange = function () { if (j.value) G.juntar(nombre, j.value).then(function () { repintar(); }, function (e) { U.fallo('No he podido juntar el pedido', e); }); };
    Array.prototype.forEach.call(caja.querySelectorAll('[data-quitar-junto]'), function (b) {
      b.onclick = function () { G.quitarJunto(nombre, b.getAttribute('data-quitar-junto')).then(function () { repintar(); }, function (e) { U.fallo('No he podido quitarlo', e); }); };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-ir]'), function (b) {
      b.onclick = function () { if (window.Navegacion && !Navegacion.abrirAbierto(b.getAttribute('data-ir'))) U.aviso('No encuentro ese asunto entre los abiertos. Pulsa Recargar.', 'ambar'); };
    });
    var rep = $('mf-reponer'), cat = $('mf-catalogo');
    if (rep) rep.onclick = function () { G.reponer(nombre).then(function (r) { if (r) U.aviso(r, 'verde'); repintar(); }, function (e) { U.fallo('No he podido volver a pedirlo', e); }); };
    if (cat) cat.onclick = function () { G.alCatalogo(nombre).then(function (r) { if (r) U.aviso(r, 'verde'); repintar(); }, function (e) { U.fallo('No he podido pasar los precios al catálogo', e); }); };
  }

  async function pintar(a) {
    actual = a || null;
    var caja = $('ficha-pedido');
    if (!caja || !a || !aplica(a)) return;
    var mio = ++turno;
    var fresca = registro()[a.nombre];
    if (fresca) a.ficha = fresca;
    if (mio !== turno || !caja.isConnected) return;
    U.conservandoLoEscrito(caja, function () {
      caja.className = 'mf-bloque';
      caja.innerHTML = cuerpo(a);
      enganchar(caja, a);
    });
  }

  function repintar() { if (actual) pintar(actual); }

  return { aplica: aplica, pintar: pintar, repintar: repintar, grupoDe: grupoDe, todos: todos };
})();
window.FacturaFicha = FacturaFicha;

/* «Comprobar recibido y factura» de la pestaña «Pedidos»: abre el asunto con el bloque ya abierto. */
Material.comprobarPedido = function (nombre) {
  if (window.FichaTarjetas) FichaTarjetas.abrirAlEntrar('pedido');
  if (!window.Navegacion || !Navegacion.abrirAbierto(nombre)) U.aviso('No encuentro ese asunto entre los abiertos. Pulsa Recargar.', 'ambar');
};
