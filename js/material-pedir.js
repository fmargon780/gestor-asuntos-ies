/* ============================================================
   material-pedir.js — el cuadro «Pedir N artículos» (fila 752, docs/583-COMPRAS-DE-MATERIAL.md, parte 3).

   Sale de «Pedir lo marcado (N)…» en «Lo que falta». Una fila por línea marcada y una columna por cada proveedor
   con algún precio de esos artículos (más «+ Otro proveedor»). Cada línea va a un proveedor: la casilla elegida
   lleva recuadro azul y «✓». La lógica (asignar, partir, totales, portes, tope) es pura, en
   js/material-pedido-datos.js; el asunto y el documento los crea js/material-pedido-crear.js.

   El cuadro se vuelve a abrir (con lo hecho) cuando hay que dar un precio o cambiar los portes: nunca dos
   cuadros a la vez.
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }

  function proveedorDe(nombre) {
    var k = Material.clave(nombre);
    return (Material.estado.empresas || []).filter(function (e) { return Material.clave(e.nombre) === k; })[0] || null;
  }

  function cifrasDe(prov) {
    var c = Material.cifrasDeProveedor ? Material.cifrasDeProveedor(Material.clave(prov)) : null;
    return c || { facturado: 0, sinFacturar: 0 };
  }

  /* ---------- el cuerpo del cuadro ---------- */

  function casillaHtml(est, f, prov) {
    var D = Material.PedidoDatos, r = D.casilla(Material.estado.precios, f.a, prov, Material.hoyIso());
    var elegida = Material.clave(f.asig) === Material.clave(prov);
    if (!r) {
      return '<td class="mp-casilla mp-sin" data-fila="' + esc(f.id) + '" data-prov="' + esc(prov) + '" data-pide="1" title="Apuntar el precio de este proveedor">sin precio</td>';
    }
    var clase = r.mejor ? 'mp-mejor' : (r.reciente ? '' : 'mp-viejo');
    return '<td class="mp-casilla ' + clase + (elegida ? ' mp-elegida' : '') + '" data-fila="' + esc(f.id) + '" data-prov="' + esc(prov) + '">' +
      (elegida ? '<span class="mp-marca">✓</span> ' : '') + '<b>' + esc(Material.euros(Math.round(r.i * f.c * 100) / 100)) + '</b><br>' +
      '<span class="suave">' + esc(Material.euros(r.i)) + ' · ' + esc(Material.fechaCorta(r.f)) + '</span>' +
      (elegida ? '<br><button type="button" class="boton-enlace" data-cambia-precio="' + esc(f.id) + '" data-prov="' + esc(prov) + '">Cambiar precio</button>' : '') + '</td>';
  }

  function pieHtml(prov, est) {
    var D = Material.PedidoDatos, precios = Material.estado.precios, hoy = Material.hoyIso();
    var t = D.totalesDeProveedor(precios, est.filas, prov, hoy);
    var portes = D.portesDe(precios, prov, t.sinIva);
    var tope = D.topeDe(cifrasDe(prov), t.sinIva);
    var linea = portes.limite
      ? '<button type="button" class="boton-enlace" data-portes="' + esc(prov) + '">portes gratis desde ' + esc(Material.euros(portes.limite)) + '</button>' +
        (t.lineas ? (portes.gratis ? ' · <b class="mp-bien">✓ portes gratis</b>' : ' · <b>te faltan ' + esc(Material.euros(portes.falta)) + '</b>') : '')
      : '<button type="button" class="boton-enlace" data-portes="' + esc(prov) + '">portes gratis desde: sin apuntar</button>';
    return '<td class="mp-pie"><b>' + (t.lineas ? esc(Material.euros(t.sinIva)) : '—') + '</b>' +
      (t.lineas ? '<br><span class="suave">' + t.lineas + (t.lineas === 1 ? ' línea' : ' líneas') + ' · con IVA ' + esc(Material.euros(t.conIva)) + '</span>' : '') +
      '<br>' + linea +
      '<br><span class="mp-tope mp-tope-' + tope.estado + '">este año: ' + esc(Material.euros(tope.usado)) + ' de ' + esc(Material.euros(Material.TOPE)) +
      (tope.estado === 'pasado' ? ' · <b>se pasa del tope</b>' : (tope.estado === 'cerca' ? ' · <b>cerca del tope</b>' : '')) + '</span></td>';
  }

  function pintar(est) {
    var D = Material.PedidoDatos, cat = Material.estado.cat, raiz = $('mp-raiz');
    if (!raiz) return;
    var provs = D.proveedoresDe(Material.estado.precios, est.filas, est.extras, Material.hoyIso());
    var filas = est.filas.map(function (f) {
      var a = Material.articuloDe(cat, f.a);
      return '<tr><td>' + esc(a ? Material.nombreDe(cat, a) : '(artículo que ya no está)') +
        (f.para ? '<br><span class="suave">para ' + esc(f.para) + '</span>' : '') +
        (f.asig ? '' : '<br><span class="mp-sin-asignar">sin asignar: se queda en «Lo que falta»</span>') + '</td>' +
        '<td class="material-num"><input type="number" class="campo material-cantidad" min="0.01" step="any" value="' + f.c + '" data-cantf="' + esc(f.id) + '"> ' +
        esc(a ? a.u : '') + '</td>' + provs.map(function (p) { return casillaHtml(est, f, p); }).join('') + '</tr>';
    }).join('');
    var libres = (Material.estado.empresas || []).filter(function (e) {
      return !provs.some(function (p) { return Material.clave(p) === Material.clave(e.nombre); });
    });
    raiz.innerHTML = '<p class="explica">Cada línea va a un proveedor: pulsa su casilla para cambiarla. En verde, el más barato de los últimos seis meses; ' +
      'en gris, precios de hace más de seis meses. Todo sin IVA.</p>' +
      '<div class="mp-envuelve"><table class="material-tabla mp-tabla"><thead><tr><th>Artículo</th><th>Cantidad</th>' +
      provs.map(function (p) { return '<th class="mp-prov">' + esc(p) + '</th>'; }).join('') + '</tr></thead><tbody>' + filas +
      '<tr class="mp-fila-pie"><td colspan="2"><b>Lo asignado, sin IVA</b></td>' + provs.map(function (p) { return pieHtml(p, est); }).join('') + '</tr></tbody></table></div>' +
      '<div class="mp-otro"><select id="mp-otro-sel" class="campo"><option value="">+ Otro proveedor…</option>' + libres.map(function (e) {
        return '<option value="' + esc(e.nombre) + '">' + esc(e.nombre) + '</option>';
      }).join('') + '</select></div>';
    var n = D.pedidosDe(cat, Material.estado.precios, est, Material.hoyIso());
    var boton = $('cuadro-aceptar');
    if (boton) boton.textContent = n.length === 1 ? 'Pedir a ' + n[0].proveedor : (n.length ? 'Hacer ' + n.length + ' pedidos' : 'Pedir');
    enganchar(est, raiz);
  }

  function enganchar(est, raiz) {
    var D = Material.PedidoDatos;
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-cantf]'), function (i) {
      i.onchange = function () {
        var r = D.ponerCantidad(est, i.getAttribute('data-cantf'), parseFloat(String(i.value).replace(',', '.')));
        if (!r.ok) U.aviso('Escribe una cantidad mayor que cero.', 'ambar');
        else if (r.partida) U.aviso('Partida: ' + r.partida.aqui + ' aquí y ' + r.partida.resto + ' en la fila de debajo, sin asignar.');
        pintar(est);
      };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('td.mp-casilla'), function (td) {
      td.onclick = function (ev) {
        if (ev.target.closest && ev.target.closest('button')) return;
        var f = est.filas.filter(function (x) { return x.id === td.getAttribute('data-fila'); })[0];
        if (!f) return;
        if (td.getAttribute('data-pide')) { est.senal = { que: 'precio', fila: f.id, a: f.a, prov: td.getAttribute('data-prov') }; Material.cancelarCuadro(); return; }
        f.asig = td.getAttribute('data-prov');
        pintar(est);
      };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-cambia-precio]'), function (b) {
      b.onclick = function () {
        var f = est.filas.filter(function (x) { return x.id === b.getAttribute('data-cambia-precio'); })[0];
        if (f) { est.senal = { que: 'precio', fila: f.id, a: f.a, prov: b.getAttribute('data-prov') }; Material.cancelarCuadro(); }
      };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-portes]'), function (b) {
      b.onclick = function () { est.senal = { que: 'portes', prov: b.getAttribute('data-portes') }; Material.cancelarCuadro(); };
    });
    $('mp-otro-sel').onchange = function () {
      var v = $('mp-otro-sel').value;
      if (v) { est.extras.push(v); pintar(est); }
    };
  }

  /* ---------- lo que pasa al pulsar «Pedir» ---------- */

  async function hacer(est, pedidos) {
    var creados = [], hechos = [], fallos = [];
    for (var i = 0; i < pedidos.length; i++) {
      var g = pedidos[i], e = proveedorDe(g.proveedor);
      try {
        var r = await Material.PedidoCrear.crear({ proveedor: g.proveedor, lineas: g.lineas, persona: e ? e.persona : null });
        creados.push(r); hechos.push(g);
        if (r.falloDoc) U.accesorio('El asunto ' + r.numero + ' está creado, pero no he podido preparar su documento de pedido', r.falloDoc);
      } catch (err) { fallos.push(g.proveedor + ': ' + U.mensajeDeError(err)); }
    }
    if (hechos.length) {
      var reparto = Material.PedidoDatos.repartoDeFalta(est, hechos);
      try {
        await Material.cambiarFalta(function (d) {
          Material.quitar(d, reparto.quitar);
          Object.keys(reparto.poner).forEach(function (id) { Material.ponerCantidad(d, id, reparto.poner[id]); });
          return { ok: true };
        });
      } catch (err2) { U.accesorio('Los pedidos están hechos, pero no he podido quitar las líneas de «Lo que falta»', err2); }
    }
    try { if (window.App && App.verAbiertos) await App.verAbiertos(); } catch (err3) { /* solo pintar */ }
    if (creados.length) {
      U.aviso(creados.length === 1
        ? 'Asunto nuevo ' + creados[0].numero + ' COMPRA ' + hechos[0].proveedor + ', con su documento de pedido.'
        : creados.length + ' asuntos COMPRA nuevos: ' + creados.map(function (c) { return c.numero; }).join(', ') + '.', 'bueno');
    }
    if (fallos.length) U.aviso('No he podido hacer ' + fallos.length + (fallos.length === 1 ? ' pedido: ' : ' pedidos: ') + fallos.join(' · '), 'malo');
    await Material.recargar();
    if (creados.length) Material.irA('pedidos');
  }

  /* ---------- abrir el cuadro ---------- */

  async function pedir(lineas) {
    lineas = lineas || [];
    if (!lineas.length) { U.aviso('Marca lo que quieres pedir.', 'ambar'); return false; }
    var est = { filas: Material.PedidoDatos.filasDeLineas(lineas), extras: [], senal: null };
    Material.PedidoDatos.asignarPorDefecto(Material.estado.precios, est.filas, Material.hoyIso());
    for (;;) {
      est.senal = null;
      var pedidos = null;
      var ok = await Material.cuadro(lineas.length === 1 ? 'Pedir 1 artículo' : 'Pedir ' + lineas.length + ' artículos', '<div id="mp-raiz"></div>', 'Pedir',
        function () { var c = document.querySelector('#capa .cuadro'); if (c) c.classList.add('cuadro-ancho'); pintar(est); },
        function () {
          pedidos = Material.PedidoDatos.pedidosDe(Material.estado.cat, Material.estado.precios, est, Material.hoyIso());
          return pedidos.length ? '' : 'Elige a qué proveedor va cada línea.';
        });
      var c = document.querySelector('#capa .cuadro'); if (c) c.classList.remove('cuadro-ancho');
      if (ok && pedidos) { await hacer(est, pedidos); return true; }
      var s = est.senal;
      if (!s) return false;
      if (s.que === 'precio') {
        var fila = est.filas.filter(function (x) { return x.id === s.fila; })[0];
        var actual = Material.PedidoDatos.casilla(Material.estado.precios, s.a, s.prov, Material.hoyIso());
        var guardado = await Material.anadirPrecioDialogo(s.a, { prov: s.prov, fijo: true, i: actual ? String(actual.i).replace('.', ',') : '' });
        if (guardado && fila) fila.asig = s.prov;
      } else if (s.que === 'portes') {
        await Material.cambiarPortes(s.prov);
      }
    }
  }
  Material.pedir = pedir;

  /* «Pedir lo marcado (N)…» en «Lo que falta» (js/material-falta.js). */
  Material.accionesDeFalta.push({ id: 'pedir', texto: 'Pedir lo marcado', principal: true, alPulsar: function (lineas) { pedir(lineas); } });
})();
