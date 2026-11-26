/* ============================================================
   material-catalogo.js — la pestaña «Catálogo» de «Material» (fila 750,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 1): categorías a la izquierda,
   artículos de la categoría en el centro, el artículo elegido a la derecha,
   y los cuadros de nueva categoría, cambiar características y nuevo artículo.
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }

  var catSel = '', artSel = '';

  /* ---------- la pestaña ---------- */

  function pintar(caja, estado) {
    var cat = estado.cat;
    if (!Material.categoriaDe(cat, catSel)) catSel = cat.categorias.length ? cat.categorias[0].id : '';
    var c = Material.categoriaDe(cat, catSel);
    var lista = cat.articulos.filter(function (a) { return a.cat === catSel; });
    var a = lista.filter(function (x) { return x.id === artSel; })[0] || lista[0] || null;
    artSel = a ? a.id : '';

    var izq = '<div class="material-caja material-categorias"><h3><span>Categorías</span> ' +
      '<button type="button" class="boton-enlace" id="material-nueva-cat">+ Nueva</button></h3>' +
      (cat.categorias.map(function (k) {
        return '<div class="material-cat' + (k.id === catSel ? ' activa' : '') + '" data-cat="' + esc(k.id) + '"><span>' + esc(k.nombre) +
          '</span><span>' + cat.articulos.filter(function (z) { return z.cat === k.id; }).length + '</span></div>';
      }).join('') || '<p class="explica">Aún no hay categorías.</p>') + '</div>';

    var centro = '<div class="material-caja">' + (c
      ? '<h3><span>' + esc(c.nombre) + ' <span class="suave">· características: ' + esc(c.car.join(' · ')) + '</span> ' +
        '<button type="button" class="boton-enlace" id="material-cambiar-car">Cambiar</button></span>' +
        '<button type="button" class="boton" id="material-nuevo-art">+ Nuevo artículo</button></h3>' + tabla(cat, c, lista)
      : '<p class="explica">Empieza por «+ Nueva» para crear la primera categoría.</p>') + '</div>';

    var der = '<div class="material-caja">' + (a ? detalle(cat, a) : '<p class="explica">Elige un artículo.</p>') + '</div>';

    caja.innerHTML = '<p class="explica">Todo lo que se compra, bien clasificado: cada categoría tiene sus características ' +
      '(formato, gramaje, color…) y cada artículo, un valor de cada una.</p><div class="material-catalogo">' + izq + centro + der + '</div>';
    enganchar(caja);
  }

  function tabla(cat, c, lista) {
    if (!lista.length) return '<p class="explica">Esta categoría no tiene artículos.</p>';
    return '<table class="material-tabla"><thead><tr>' + c.car.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') +
      '<th>Se compra por</th><th>Mejor precio</th></tr></thead><tbody>' + lista.map(function (x) {
        var m = Material.mejorPrecio(x.id);
        return '<tr class="material-fila' + (x.id === artSel ? ' elegida' : '') + '" data-art="' + esc(x.id) + '">' +
          c.car.map(function (k, i) { return '<td>' + esc(x.v[i] || '') + '</td>'; }).join('') +
          '<td>' + esc(x.u) + '</td><td>' + (m ? esc(m.texto) : '') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function detalle(cat, a) {
    return '<h3>' + esc(Material.nombreDe(cat, a)) + '</h3><p class="explica">Se compra por ' + esc(a.u) + '.</p>' +
      '<div id="material-precios"></div>';   /* la parte 2 pone aquí la tabla de precios */
  }

  function enganchar(caja) {
    Array.prototype.forEach.call(caja.querySelectorAll('.material-cat'), function (d) {
      d.onclick = function () { catSel = d.getAttribute('data-cat'); artSel = ''; Material.irA('catalogo'); };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('.material-fila'), function (f) {
      f.onclick = function () { artSel = f.getAttribute('data-art'); Material.irA('catalogo'); };
    });
    $('material-nueva-cat').onclick = function () { dialogoCategoria(false); };
    if ($('material-cambiar-car')) $('material-cambiar-car').onclick = function () { dialogoCategoria(true); };
    if ($('material-nuevo-art')) $('material-nuevo-art').onclick = function () { altaArticulo({ cat: catSel }); };
    if (window.Material && Material.alPintarCatalogo) Material.alPintarCatalogo(caja, artSel);
  }

  /* ---------- nueva categoría / cambiar características ---------- */

  /* `alCrear(categoria)` (opcional): quien llama (el alta de artículo) sigue con la categoría recién creada. */
  async function dialogoCategoria(editar, alCrear) {
    var cat = Material.estado.cat;
    var c = editar ? Material.categoriaDe(cat, catSel) : null;
    if (editar && !c) return null;
    var cuerpo = (editar ? '' : '<div class="material-fila-campo"><label for="material-cn">Nombre</label>' +
        '<input type="text" id="material-cn" class="campo" autocomplete="off" placeholder="Papel"></div>') +
      '<div class="material-fila-campo"><label for="material-cc">Características</label>' +
        '<input type="text" id="material-cc" class="campo" autocomplete="off" placeholder="Formato, Gramaje, Color" value="' + esc(editar ? c.car.join(', ') : '') + '"></div>' +
      '<p class="explica">Separadas por comas, en el orden en que forman el nombre del artículo.' + (editar ? ' Los artículos que ya hay conservan sus datos.' : '') + '</p>' +
      (editar ? '<p class="explica">Valores de cada lista: ' + c.car.map(function (k) {
        return '<b>' + esc(k) + '</b>: ' + esc((c.vals[k] || []).join(', ') || '—');
      }).join(' · ') + '</p>' : '') +
      '<label class="material-casilla"><input type="checkbox" id="material-cdel"' + (!editar || !c.sin ? ' checked' : '') + '> ' +
      'El nombre del artículo empieza por el de la categoría («Papel A4 80 g Blanco»). Quítalo si no hace falta («Grapas 24/6»).</label>';
    var creada = null;
    var ok = await Material.cuadro(editar ? 'Características de ' + c.nombre : 'Nueva categoría', cuerpo, 'Guardar', function () {
      var campo = $(editar ? 'material-cc' : 'material-cn'); if (campo) campo.focus();
    }, async function () {
      var car = Material.caracteristicasDe($('material-cc').value), sin = !$('material-cdel').checked;
      var r = await Material.cambiarCatalogo(function (d) {
        return editar ? Material.cambiarCaracteristicas(d, c.id, car, sin)
          : Material.crearCategoria(d, { nombre: $('material-cn').value, car: car, sin: sin });
      });
      if (!r.ok) return r.error;
      creada = r.categoria;
      return '';
    });
    if (ok && creada) {
      if (!editar) { catSel = creada.id; artSel = ''; }
      await Material.recargar();
      if (alCrear) alCrear(creada);
    }
    return ok ? creada : null;
  }

  /* ---------- nuevo artículo ---------- */

  /* `o.cat`: categoría de salida; `o.inicial`: lo que se buscó y no estaba. Devuelve el artículo creado o null.
     Si se elige «+ Nueva categoría…» o se cambia de categoría, el cuadro se vuelve a abrir con el estado nuevo. */
  async function altaArticulo(o) {
    var est = { cat: o.cat || '', v: [], u: '' };
    for (;;) {
      var cat = Material.estado.cat;
      var c = Material.categoriaDe(cat, est.cat);
      var senal = '', creado = null;
      var cuerpo = (o.inicial ? '<p class="explica">Has buscado «' + esc(o.inicial) + '» y no está en el catálogo.</p>' : '') +
        '<div class="material-fila-campo"><label for="material-ac">Categoría</label><select id="material-ac" class="campo">' +
        (c ? '' : '<option value="">Elige la categoría…</option>') +
        cat.categorias.map(function (k) { return '<option value="' + esc(k.id) + '"' + (k.id === est.cat ? ' selected' : '') + '>' + esc(k.nombre) + '</option>'; }).join('') +
        '<option value="__nueva">+ Nueva categoría…</option></select></div>' +
        (c ? c.car.map(function (k, i) {
          return '<div class="material-fila-campo"><label>' + esc(k) + '</label>' + Material.listaHtml('data-i="' + i + '"', c.vals[k] || [], est.v[i]) + '</div>';
        }).join('') + '<div class="material-fila-campo"><label>Se compra por</label>' + Material.listaHtml('id="material-au"', cat.unidades, est.u) + '</div>' +
          '<p class="explica">Elige cada valor de su lista. Si no está, «+ Nuevo valor…»: queda en la lista para la próxima vez.</p>' +
          '<p class="explica">Se llamará: <b id="material-anom"></b></p>' : '');
      var abrir = function () {
        $('material-ac').onchange = function (e) {
          senal = e.target.value === '__nueva' ? 'nueva' : 'cambia';
          if (senal === 'cambia') { est.cat = e.target.value; est.v = []; est.u = ''; }
          Material.cancelarCuadro();
        };
        if (!c) return;
        var ins = Array.prototype.slice.call($('cuadro-cuerpo').querySelectorAll('[data-i]'));
        var nom = function () {
          var vv = ins.map(Material.valorDeLista).filter(Boolean).join(' ');
          $('material-anom').textContent = (c.sin ? '' : c.nombre + ' ') + vv;
        };
        ins.forEach(function (e) { Material.engancharLista(e, nom); });
        Material.engancharLista($('material-au'), nom);
        nom();
        if (ins[0]) ins[0].focus();
      };
      var ok = await Material.cuadro('Nuevo artículo', cuerpo, 'Guardar', abrir, async function () {
        if (!c) return 'Elige la categoría.';
        var ins = Array.prototype.slice.call($('cuadro-cuerpo').querySelectorAll('[data-i]'));
        var v = ins.map(Material.valorDeLista), u = Material.valorDeLista($('material-au'));
        var r = await Material.cambiarCatalogo(function (d) { return Material.crearArticulo(d, { cat: c.id, v: v, u: u }); });
        if (!r.ok) return r.error;
        creado = r.articulo;
        return '';
      });
      if (ok && creado) {
        catSel = creado.cat; artSel = creado.id;
        await Material.recargar();
        return creado;
      }
      if (senal === 'nueva') {
        var nueva = await dialogoCategoria(false);
        if (nueva) est = { cat: nueva.id, v: [], u: '' };
        continue;
      }
      if (senal === 'cambia') continue;
      return null;
    }
  }

  Material.altaArticulo = altaArticulo;
  Material.registrarPestana({
    id: 'catalogo', titulo: 'Catálogo', orden: 30,
    cuenta: function (estado) { return estado.cat.articulos.length; },
    pintar: pintar
  });
})();
