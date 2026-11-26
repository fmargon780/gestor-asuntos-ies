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
    /* Fila 752: el tipo COMPRA (de EMPRESAS), el de los asuntos que crea «Pedir lo marcado», sin guía. */
    if (!(App.E.tipos || []).some(function (t) { return t.tipo === 'COMPRA'; })) await App.crearTipo({ nombre: 'COMPRA', categoria: 'EMPRESAS' });
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

    /* Fila 751: precios de proveedores (recientes y uno de hace más de seis meses) y, para ver la barra del tope,
       unas cifras de partida (la parte 5 las calculará de verdad de los pedidos y las facturas). */
    var P = [
      ['a1', 'Papelería La Esquina, S.L.', 2.35, 12, 'Llamada'], ['a1', 'Suministros Escolares Dobla, S.L.', 2.15, 30, 'Correo'],
      ['a1', 'Copistería Central', 1.9, 300, 'Llamada'], ['a2', 'Papelería La Esquina, S.L.', 4.8, 12, 'Llamada'],
      ['a2', 'Suministros Escolares Dobla, S.L.', 4.6, 30, 'Correo'], ['a5', 'Suministros Escolares Dobla, S.L.', 18.5, 20, 'Correo'],
      ['a7', 'Papelería La Esquina, S.L.', 14.9, 45, 'Llamada'], ['a12', 'Suministros Escolares Dobla, S.L.', 9.2, 10, 'Correo'],
      ['a13', 'Papelería La Esquina, S.L.', 8.1, 10, 'Llamada']
    ].map(function (q, i) { return { id: 'p' + i, a: q[0], p: q[1], i: q[2], f: dia(q[3]), o: q[4] }; });
    await Copias.guardar(App.E.gestor, 'material-precios.json', {
      precios: P,
      portes: { 'suministros escolares dobla, s.l.': 150 },
      cifras: {
        'suministros escolares dobla, s.l.': { facturado: 11800, sinFacturar: 1200 },
        'papeleria la esquina, s.l.': { facturado: 15600, sinFacturar: 0 },
        'copisteria central': { facturado: 900, sinFacturar: 0 }
      }
    });
  }

  window.Demo = window.Demo || {};
  window.Demo.material = { construir: construir };
})();
