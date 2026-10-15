/* ============================================================
   etiquetas-disenos.js — qué lleva cada etiqueta (fila 344, docs/ETIQUETAS.md).

   Un diseño es { id, nombre, para: 'alumnado'|'personal'|'ambos', unaPorFamilia, renglones: [renglon] }, con
   renglon = { dato: <clave de EtiquetasDatos.CAMPOS> | 'texto', texto?, negrita, tamano: 'pequeno'|'normal'|'grande',
   alinea: 'izq'|'centro'|'der' }. Los tres primeros los trae la app (`integrado`): se duplican, no se borran.

   - integrados() → los tres diseños de la app.   - nuevoRenglon(), limpiar(d) → un diseño propio bien formado.
   - Fila 350: `vertical` ('arriba' | 'centro' | 'abajo'; sin él, 'centro' como siempre) coloca el bloque de renglones entero
     dentro de la etiqueta: `inicioY(vertical, alto, total, relleno)` da dónde empieza (mismas unidades que los tres números).
   - lineas(diseno, valores) → [{ texto, negrita, pt, alinea }] sin los renglones vacíos.
   - ajustar(lineas, anchoMm, altoMm, medir) → { lineas (con su pt final), corto } : la letra baja sola hasta
     que cabe; si aun así una línea no cabe a lo ancho, se corta con «…» y `corto` es true.
     `medir(texto, pt, negrita)` → ancho en puntos.
   ============================================================ */
var EtiquetasDisenos = (function () {

  var PT = { pequeno: 7, normal: 10, grande: 13 };
  var MM = 72 / 25.4;
  var RELLENO_MM = 2.5;
  var MINIMO = 0.55;   /* hasta qué fracción se reduce la letra antes de cortar */

  function r(dato, negrita, tamano, alinea) { return { dato: dato, negrita: !!negrita, tamano: tamano || 'normal', alinea: alinea || 'izq' }; }

  function integrados() {
    return [
      { id: 'sobre', nombre: 'Sobre', para: 'alumnado', unaPorFamilia: true, integrado: true,
        renglones: [r('familia', true, 'normal'), r('domicilio'), r('cpLocalidad'), r('provincia')] },
      { id: 'alumno', nombre: 'Alumno', para: 'alumnado', unaPorFamilia: false, integrado: true,
        renglones: [r('apellidosNombre', true, 'grande'), r('unidad'), r('escolar', false, 'pequeno')] },
      { id: 'profesor', nombre: 'Profesor', para: 'personal', unaPorFamilia: false, integrado: true,
        renglones: [r('apellidosNombre', true, 'grande'), r('departamento')] }
    ];
  }

  var VERTICALES = ['arriba', 'centro', 'abajo'];

  /* Dónde empieza el bloque de renglones, medido desde el borde de arriba de la etiqueta. */
  function inicioY(vertical, alto, total, relleno) {
    if (vertical === 'arriba') return relleno;
    if (vertical === 'abajo') return Math.max(0, alto - total - relleno);
    return Math.max(0, (alto - total) / 2);
  }

  function nuevoRenglon() { return r('apellidosNombre', false, 'normal', 'izq'); }

  function limpiar(d) {
    var para = ['alumnado', 'personal', 'ambos'].indexOf(d.para) !== -1 ? d.para : 'ambos';
    var salida = {
      id: d.id, nombre: String(d.nombre || '').trim(), para: para,
      unaPorFamilia: !!d.unaPorFamilia && para !== 'personal',
      renglones: (d.renglones || []).map(function (x) {
        var o = r(x.dato || 'texto', x.negrita, PT[x.tamano] ? x.tamano : 'normal', x.alinea === 'centro' || x.alinea === 'der' ? x.alinea : 'izq');
        if (o.dato === 'texto') o.texto = String(x.texto || '');
        return o;
      })
    };
    if (VERTICALES.indexOf(d.vertical) !== -1) salida.vertical = d.vertical;
    return salida;
  }

  function lineas(diseno, valores) {
    var salida = [];
    diseno.renglones.forEach(function (x) {
      var t = x.dato === 'texto' ? x.texto : valores[x.dato];
      t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
      if (t) salida.push({ texto: t, negrita: !!x.negrita, pt: PT[x.tamano] || PT.normal, alinea: x.alinea });
    });
    return salida;
  }

  function recortar(texto, pt, negrita, ancho, medir) {
    if (medir(texto, pt, negrita) <= ancho) return texto;
    var t = texto;
    while (t.length > 1 && medir(t + '…', pt, negrita) > ancho) t = t.slice(0, -1);
    return t.replace(/\s+$/, '') + '…';
  }

  function ajustar(ls, anchoMm, altoMm, medir) {
    var ancho = (anchoMm - 2 * RELLENO_MM) * MM, alto = (altoMm - 2 * RELLENO_MM) * MM;
    function cabe(f) {
      var h = 0;
      for (var i = 0; i < ls.length; i++) {
        var pt = ls[i].pt * f;
        h += pt * 1.2;
        if (medir(ls[i].texto, pt, ls[i].negrita) > ancho) return false;
      }
      return h <= alto;
    }
    var f = 1;
    while (!cabe(f) && f > MINIMO) f = Math.round((f - 0.05) * 100) / 100;
    var corto = false, salida = ls.map(function (l) {
      var pt = Math.round(l.pt * f * 10) / 10;
      var t = recortar(l.texto, pt, l.negrita, ancho, medir);
      if (t !== l.texto) corto = true;
      return { texto: t, negrita: l.negrita, pt: pt, alinea: l.alinea };
    });
    /* Si ni así cabe a lo alto, se quitan las últimas líneas y se avisa. */
    var h = salida.reduce(function (s, l) { return s + l.pt * 1.2; }, 0);
    while (salida.length > 1 && h > alto + 0.5) { var q = salida.pop(); h -= q.pt * 1.2; corto = true; }
    return { lineas: salida, corto: corto };
  }

  return { PT: PT, MM: MM, RELLENO_MM: RELLENO_MM, VERTICALES: VERTICALES, inicioY: inicioY, integrados: integrados, nuevoRenglon: nuevoRenglon, limpiar: limpiar, lineas: lineas, ajustar: ajustar };
})();
window.EtiquetasDisenos = EtiquetasDisenos;
