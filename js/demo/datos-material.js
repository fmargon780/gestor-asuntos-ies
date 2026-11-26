/* ============================================================
   demo/datos-material.js — el material de oficina de la copia de pruebas
   (fila 750, docs/583-COMPRAS-DE-MATERIAL.md): categorías con sus características,
   artículos (con la cartulina A3 azul satinado y la A4 azul mate, para ver que son
   dos) y unas líneas de «Lo que falta». Todo inventado.
   `Demo.material.construir()` lo llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  function categoria(id, nombre, car, sin) {
    return { id: id, nombre: nombre, car: car, sin: !!sin, vals: {} };
  }

  async function construir() {
    if (!window.Material || !App.E || !App.E.gestor) return;
    var cats = [
      categoria('cpapel', 'Papel', ['Formato', 'Gramaje', 'Color']),
      categoria('csobres', 'Sobres', ['Medida', 'Ventana']),
      categoria('cescritura', 'Escritura', ['Tipo', 'Color']),
      categoria('ctoner', 'Tóner y tinta', ['Impresora', 'Color']),
      categoria('carchivo', 'Archivo', ['Tipo', 'Formato'], true),
      categoria('cpequeno', 'Pequeño material', ['Tipo', 'Medida'], true),
      categoria('ccartulina', 'Cartulina', ['Formato', 'Color', 'Acabado', 'Gramaje'])
    ];
    var arts = [
      ['a1', 'cpapel', ['A4', '80 g', 'Blanco'], 'paquete de 500 hojas'],
      ['a2', 'cpapel', ['A3', '80 g', 'Blanco'], 'paquete de 500 hojas'],
      ['a3', 'cpapel', ['A4', '160 g', 'Blanco'], 'paquete de 250 hojas'],
      ['a4', 'cpapel', ['A4', '80 g', 'Amarillo'], 'paquete de 500 hojas'],
      ['a5', 'csobres', ['DL 110×220', 'Con ventana'], 'caja de 500'],
      ['a6', 'csobres', ['C4 229×324', 'Sin ventana'], 'caja de 250'],
      ['a7', 'cescritura', ['Bolígrafo', 'Azul'], 'caja de 50'],
      ['a8', 'cescritura', ['Rotulador de pizarra', 'Negro'], 'caja de 12'],
      ['a9', 'ctoner', ['Brother HL-L5100', 'Negro'], 'unidad'],
      ['a10', 'carchivo', ['Archivador AZ', 'Folio'], 'unidad'],
      ['a11', 'cpequeno', ['Grapas', '24/6'], 'caja de 1000'],
      ['a12', 'ccartulina', ['A3', 'Azul', 'Satinado', '180 g'], 'paquete de 50'],
      ['a13', 'ccartulina', ['A4', 'Azul', 'Mate', '180 g'], 'paquete de 100'],
      ['a14', 'ccartulina', ['A4', 'Rojo', 'Mate', '180 g'], 'paquete de 100']
    ].map(function (a) { return { id: a[0], cat: a[1], v: a[2], u: a[3] }; });
    var unidades = [];
    arts.forEach(function (a) {
      var c = cats.filter(function (k) { return k.id === a.cat; })[0];
      c.car.forEach(function (k, i) {
        c.vals[k] = c.vals[k] || [];
        if (a.v[i] && c.vals[k].indexOf(a.v[i]) === -1) c.vals[k].push(a.v[i]);
      });
      if (unidades.indexOf(a.u) === -1) unidades.push(a.u);
    });
    cats.forEach(function (c) { c.car.forEach(function (k) { c.vals[k] = (c.vals[k] || []).sort(); }); });
    unidades.sort();
    await Copias.guardar(App.E.gestor, 'material-catalogo.json', { categorias: cats, articulos: arts, unidades: unidades });

    function dia(atras) { var d = new Date(); d.setDate(d.getDate() - atras); return d.toISOString().slice(0, 10); }
    await Copias.guardar(App.E.gestor, 'material-falta.json', {
      lineas: [
        { id: 'f1', a: 'a1', c: 20, para: 'Administración', q: 'Diego', f: dia(7) },
        { id: 'f2', a: 'a5', c: 2, para: 'Administración', q: 'Francisco', f: dia(5) },
        { id: 'f3', a: 'a7', c: 1, para: 'Conserjería', q: 'Diego', f: dia(4) },
        { id: 'f4', a: 'a2', c: 3, para: 'Jefatura de estudios', q: 'Francisco', f: dia(1) }
      ],
      quitadas: [],
      destinos: ['Dpto. de Lengua']
    });
  }

  window.Demo = window.Demo || {};
  window.Demo.material = { construir: construir };
})();
