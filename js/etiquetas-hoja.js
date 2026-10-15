/* ============================================================
   etiquetas-hoja.js — de las personas a las hojas (fila 344, docs/ETIQUETAS.md).

   Sin pintar nada en la pantalla salvo `vistaHtml`, que devuelve el dibujo de las hojas.
   - construir(personas, clase, diseno, op) → [{ valores, sinDireccion, personas }]: una por persona, o una por
     familia (diseño «Una por familia»), ordenadas (alumnado: unidad y apellidos; personal: apellidos) y con las
     copias seguidas. `op`: { copias, indice (PersonasFamilias.indice), ctx: { centro, curso } }.
   - paginar(items, modelo, gastadas) → { hojas: [[{ i (casilla), item|null }]], etiquetas }. Las casillas
     `gastadas` (números de casilla, solo de la primera hoja) no llevan etiqueta.
   - preparar(items, diseno, modelo, medir) → Map etiqueta → sus líneas ya ajustadas { lineas, corto }.
   - vistaHtml(paginas, modelo, preparadas, escala) → el HTML de las hojas (escala: píxeles por mm).
   ============================================================ */
var EtiquetasHoja = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function claveOrden(p, clase) {
    var u = clase === 'alumnado' ? U.normalizar(p.unidad || '') : '';
    return u + '|' + U.normalizar(p.nombre || '');
  }

  function construir(personas, clase, diseno, op) {
    op = op || {};
    var copias = Math.max(1, Math.min(50, parseInt(op.copias, 10) || 1));
    var ordenadas = personas.slice().sort(function (a, b) {
      var x = claveOrden(a, clase), y = claveOrden(b, clase);
      return x < y ? -1 : (x > y ? 1 : 0);
    });
    var grupos;
    if (diseno.unaPorFamilia && clase === 'alumnado' && op.indice) grupos = EtiquetasDatos.familias(ordenadas, op.indice);
    else grupos = ordenadas.map(function (p) { return [p]; });
    var items = [];
    grupos.forEach(function (g) {
      var v = g.length > 1 ? EtiquetasDatos.valoresDeFamilia(g, clase, op.ctx) : EtiquetasDatos.valores(g[0], clase, op.ctx);
      var it = { valores: v, sinDireccion: !!v._sinDireccion && diseno.renglones.some(function (x) { return /domicilio|direccion|cpLocalidad/.test(x.dato); }), personas: g };
      for (var k = 0; k < copias; k++) items.push(it);
    });
    return items;
  }

  function paginar(items, modelo, gastadas) {
    var por = modelo.filas * modelo.columnas, malas = gastadas || {};
    var hojas = [], k = 0, h = 0;
    while (k < items.length || h === 0) {
      var hoja = [];
      for (var i = 0; i < por; i++) {
        if (h === 0 && malas[i]) { hoja.push({ i: i, item: null, gastada: true }); continue; }
        hoja.push({ i: i, item: k < items.length ? items[k++] : null });
      }
      hojas.push(hoja);
      h++;
    }
    return { hojas: hojas, etiquetas: items.length };
  }

  function preparar(items, diseno, modelo, medir) {
    var g = EtiquetasModelos.geometria(modelo), memo = new Map();
    items.forEach(function (it) {
      if (!memo.has(it)) memo.set(it, EtiquetasDisenos.ajustar(EtiquetasDisenos.lineas(diseno, it.valores), g.ancho, g.alto, medir));
    });
    return memo;
  }

  function vistaHtml(paginas, modelo, preparadas, escala) {
    var g = EtiquetasModelos.geometria(modelo), k = escala, mm = k;
    var pxPt = (25.4 / 72) * k;
    return paginas.hojas.map(function (hoja, nh) {
      var casillas = hoja.map(function (c) {
        var col = c.i % modelo.columnas, fila = Math.floor(c.i / modelo.columnas);
        var x = (g.x0 + col * g.px) * mm, y = (g.y0 + fila * g.py) * mm, w = g.ancho * mm, h = g.alto * mm;
        var estilo = 'left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px';
        if (c.gastada) {
          return '<div class="et-casilla et-gastada" data-casilla="' + c.i + '" style="' + estilo + '" title="Gastada: pulsa para volver a usarla"></div>';
        }
        var p = c.item ? preparadas.get(c.item) : null;
        var clases = 'et-casilla' + (c.item ? '' : ' et-libre') + (c.item && c.item.sinDireccion ? ' et-sin-direccion' : '') + (p && p.corto ? ' et-corta' : '');
        var dentro = '';
        if (p) {
          var alto = p.lineas.reduce(function (s, l) { return s + l.pt * 1.2; }, 0) * pxPt;
          dentro = '<div class="et-lineas" style="padding:0 ' + (EtiquetasDisenos.RELLENO_MM * mm).toFixed(1) + 'px;top:' + Math.max(0, (h - alto) / 2).toFixed(1) + 'px">' +
            p.lineas.map(function (l) {
              return '<div class="et-linea" style="font-size:' + (l.pt * pxPt).toFixed(2) + 'px;text-align:' + (l.alinea === 'centro' ? 'center' : (l.alinea === 'der' ? 'right' : 'left')) + ';font-weight:' + (l.negrita ? 700 : 400) + '">' + esc(l.texto) + '</div>';
            }).join('') + '</div>';
          if (c.item.sinDireccion) dentro += '<span class="et-aviso">Sin dirección</span>';
          if (p.corto) dentro += '<span class="et-aviso et-aviso-corto">No cabe</span>';
        }
        return '<div class="' + clases + '" data-casilla="' + c.i + '" style="' + estilo + '">' + dentro + '</div>';
      }).join('');
      return '<div class="et-hoja-caja"><div class="et-hoja-numero">Hoja ' + (nh + 1) + ' de ' + paginas.hojas.length + '</div>' +
        '<div class="et-hoja" data-hoja="' + nh + '" style="width:' + (g.hojaAncho * mm).toFixed(1) + 'px;height:' + (g.hojaAlto * mm).toFixed(1) + 'px">' + casillas + '</div></div>';
    }).join('');
  }

  return { construir: construir, paginar: paginar, preparar: preparar, vistaHtml: vistaHtml };
})();
window.EtiquetasHoja = EtiquetasHoja;
