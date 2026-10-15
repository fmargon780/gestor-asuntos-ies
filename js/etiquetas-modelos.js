/* ============================================================
   etiquetas-modelos.js — las hojas de etiquetas A4 (fila 344, docs/ETIQUETAS.md).

   Los modelos que trae la app son los de Avery A4 más corrientes en los centros. Las medidas (en
   milímetros) salen de la lista de plantillas de etiquetas de LibreOffice (labels.xml), que las tiene
   por código de la caja; no están inventadas. Del código de Apli solo se apunta el que se ha podido
   contrastar (02416 = L7164); el resto se añade cuando se contraste.

   Un modelo es, siempre: { nombre, filas, columnas, sup, inf, izq, der, sepH, sepV } (mm). El tamaño de
   cada etiqueta sale de repartir lo que queda entre las casillas; así una hoja nueva solo necesita filas y
   columnas, y «Cambiar» ajusta los demás números. Un modelo propio lleva además su tamaño de hoja,
   `hoja: { nombre, ancho, alto }` (mm; fila 346); sin `hoja`, es A4.

   - todos() → los modelos de la app, completos.   - nuevo(nombre, filas, columnas) → un modelo sin márgenes.
   - geometria(m) → { filas, columnas, ancho, alto, x0, y0, px, py, hojaAncho, hojaAlto } (mm; x0/y0: esquina de la casilla 1).
   - hojaDe(m) → { nombre, ancho, alto } de la hoja del modelo (A4 si no lleva).   - TAMANOS, tamano(nombre).
   - texto(m) → «3 × 7 · 63,5 × 38,1 mm · A4».
   ============================================================ */
var EtiquetasModelos = (function () {

  var A4 = { ancho: 210, alto: 297 };

  /* Los tamaños de hoja que se eligen por el nombre (mm); «Otro» lleva sus propias medidas. */
  var TAMANOS = [
    { nombre: 'A3', ancho: 297, alto: 420 }, { nombre: 'A4', ancho: 210, alto: 297 }, { nombre: 'A5', ancho: 148, alto: 210 },
    { nombre: 'Carta', ancho: 216, alto: 279 }, { nombre: 'Oficio', ancho: 216, alto: 356 }
  ];
  function tamano(nombre) { return TAMANOS.filter(function (t) { return t.nombre === nombre; })[0] || null; }

  /* La hoja de un modelo: lo guardado antes de la fila 346 no lleva `hoja` y se lee como A4. */
  function hojaDe(m) {
    var h = m && m.hoja;
    if (h && h.ancho > 0 && h.alto > 0) return { nombre: h.nombre || 'Otro', ancho: h.ancho, alto: h.alto };
    return { nombre: 'A4', ancho: A4.ancho, alto: A4.alto };
  }

  /* [código Avery, código Apli (o ''), columnas, filas, paso horizontal, paso vertical, ancho, alto, izquierda, arriba] en mm */
  var AVERY = [
    ['L7156', '', 3, 15, 69.54, 17.80, 58.00, 17.80, 6.46, 14.10],
    ['L7157', '', 3, 11, 66.54, 24.30, 64.00, 24.30, 6.46, 14.00],
    ['L7158', '', 3, 10, 66.54, 26.70, 64.00, 26.70, 6.46, 14.00],
    ['L7159', '', 3, 8, 66.54, 33.86, 64.00, 33.86, 6.46, 13.06],
    ['L7160', '', 3, 7, 66.04, 38.10, 63.50, 38.10, 7.20, 15.15],
    ['L7161', '', 3, 6, 66.04, 46.56, 63.50, 46.56, 7.21, 8.82],
    ['L7162', '', 2, 8, 101.60, 33.87, 99.06, 33.87, 4.67, 13.02],
    ['L7163', '', 2, 7, 101.60, 38.10, 99.06, 38.10, 4.67, 15.15],
    ['L7164', '02416', 3, 4, 66.04, 71.97, 63.50, 71.97, 7.21, 4.57],
    ['L7165', '', 2, 4, 101.60, 67.73, 99.06, 67.73, 4.67, 13.04],
    ['L7166', '', 2, 3, 101.60, 93.13, 99.06, 93.13, 4.67, 8.81],
    ['L7173', '', 2, 5, 101.60, 57.00, 99.06, 57.00, 4.67, 6.00],
    ['J8654', '', 4, 10, 48.26, 25.40, 45.72, 25.40, 9.75, 21.43],
    ['L7651', '', 5, 13, 40.64, 21.17, 38.10, 21.17, 4.67, 10.90]
  ];

  function r2(x) { return Math.round(x * 100) / 100; }

  function deAvery(a) {
    var c = a[2], f = a[3], w = a[6], h = a[7];
    var sepH = a[4] - w, sepV = a[5] - h;
    return {
      id: 'avery-' + a[0], codigo: a[0], apli: a[1], nombre: a[0] + (a[1] ? ' / Apli ' + a[1] : ''), integrado: true,
      filas: f, columnas: c, izq: a[8], sup: a[9], sepH: r2(sepH), sepV: r2(sepV),
      der: r2(A4.ancho - a[8] - c * w - (c - 1) * sepH), inf: r2(A4.alto - a[9] - f * h - (f - 1) * sepV)
    };
  }

  /* Sin márgenes: la hoja entera (A4 si no se dice otra) repartida en filas × columnas. */
  function nuevo(nombre, filas, columnas, hoja) {
    var m = { nombre: String(nombre || '').trim(), filas: filas, columnas: columnas, sup: 0, inf: 0, izq: 0, der: 0, sepH: 0, sepV: 0 };
    if (hoja) m.hoja = { nombre: hoja.nombre, ancho: hoja.ancho, alto: hoja.alto };
    return m;
  }

  function todos() {
    var lista = AVERY.map(deAvery);
    var uno = nuevo('1 × 1 (A4 entero)', 1, 1);
    uno.id = 'a4-1x1'; uno.integrado = true;
    lista.push(uno);
    return lista;
  }

  function geometria(m) {
    var c = m.columnas, f = m.filas, h = hojaDe(m);
    var ancho = (h.ancho - m.izq - m.der - (c - 1) * m.sepH) / c;
    var alto = (h.alto - m.sup - m.inf - (f - 1) * m.sepV) / f;
    return { filas: f, columnas: c, ancho: ancho, alto: alto, x0: m.izq, y0: m.sup, px: ancho + m.sepH, py: alto + m.sepV, hojaAncho: h.ancho, hojaAlto: h.alto };
  }

  function coma(x) { return String(r2(x)).replace('.', ','); }

  function texto(m) {
    var g = geometria(m), h = hojaDe(m);
    return m.columnas + ' × ' + m.filas + ' · ' + coma(g.ancho) + ' × ' + coma(g.alto) + ' mm · ' +
      (h.nombre === 'Otro' ? coma(h.ancho) + ' × ' + coma(h.alto) + ' mm' : h.nombre);
  }

  /* Un modelo con números válidos: se dice qué falla (o '' si va bien). */
  function problema(m) {
    if (!(m.filas >= 1 && m.filas <= 40 && m.columnas >= 1 && m.columnas <= 12)) return 'Las filas y las columnas tienen que estar entre 1 y 40 (filas) y 1 y 12 (columnas).';
    var h = m.hoja || hojaDe(m);
    if (!(h.ancho >= 50 && h.alto >= 50 && h.ancho <= 1000 && h.alto <= 1000)) return 'La hoja tiene que medir entre 50 y 1.000 mm de ancho y de alto.';
    var g = geometria(m);
    if (!(g.ancho >= 10 && g.alto >= 8)) return 'Con esos márgenes las etiquetas quedan demasiado pequeñas.';
    return '';
  }

  return { A4: A4, TAMANOS: TAMANOS, tamano: tamano, hojaDe: hojaDe, todos: todos, nuevo: nuevo, geometria: geometria, texto: texto, problema: problema, r2: r2 };
})();
window.EtiquetasModelos = EtiquetasModelos;
