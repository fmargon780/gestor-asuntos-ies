/* ============================================================
   correo-enviado-pdf-formato.js — el cuerpo con formato del correo enviado, en el PDF
   (27-nov-2026, fila 772, docs/758-CORREOS-MAS-COMODOS.md, parte 2).

   El PDF del correo enviado que se guarda en el asunto (js/correo-enviado-pdf.js) conserva la negrita, la cursiva, el subrayado,
   las listas y las tablas con sus líneas. Si una tabla no cabe a lo ancho, se reparte el ancho entre las columnas y el texto
   salta de línea dentro de la casilla.

       CorreoEnviadoPdfFormato.cuerpo(ctx, html)
         ctx: { fuentes: { normal, negrita, cursiva, negritaCursiva }, rgb, ANCHO, M, SALTO, TAM, limpio,
                pagina(), y(), ponerY(v), sitio(alto) }   (lo arma `pdfDe`)
   ============================================================ */
var CorreoEnviadoPdfFormato = (function () {

  function fuenteDe(ctx, t) {
    var f = ctx.fuentes;
    return t.b && t.i ? f.negritaCursiva : (t.b ? f.negrita : (t.i ? f.cursiva : f.normal));
  }

  /* Los trozos { t, b, i, u } de un bloque, partidos en renglones que caben en `ancho`: [[{ t, b, i, u, f, ancho }]]. */
  function renglones(ctx, trozos, ancho, tam) {
    var salida = [[]], actual = salida[0], x = 0;
    function nuevo() { actual = []; salida.push(actual); x = 0; }
    trozos.forEach(function (tr) {
      var f = fuenteDe(ctx, tr);
      tr.t.split('\n').forEach(function (parte, k) {
        if (k > 0) nuevo();
        parte.split(/( )/).forEach(function (palabra) {
          if (palabra === '') return;
          var texto = ctx.limpio(palabra), w = f.widthOfTextAtSize(texto, tam);
          if (palabra === ' ' && x === 0) return;
          if (x + w > ancho && x > 0 && palabra !== ' ') nuevo();
          while (w > ancho && texto.length > 1) {   /* una palabra más ancha que la línea: se parte */
            var corte = texto.length - 1;
            while (corte > 1 && f.widthOfTextAtSize(texto.slice(0, corte), tam) > ancho - x) corte--;
            var primero = texto.slice(0, corte);
            actual.push({ t: primero, f: f, u: tr.u, w: f.widthOfTextAtSize(primero, tam) });
            nuevo();
            texto = texto.slice(corte);
            w = f.widthOfTextAtSize(texto, tam);
          }
          actual.push({ t: texto, f: f, u: tr.u, w: w });
          x += w;
        });
      });
    });
    return salida;
  }

  function dibujarRenglon(ctx, r, x0, y, tam) {
    var x = x0, pagina = ctx.pagina();
    r.forEach(function (p) {
      pagina.drawText(p.t, { x: x, y: y, size: tam, font: p.f, color: ctx.rgb(0, 0, 0) });
      if (p.u && p.t.trim()) pagina.drawLine({ start: { x: x, y: y - 1.5 }, end: { x: x + p.w, y: y - 1.5 }, thickness: 0.5, color: ctx.rgb(0, 0, 0) });
      x += p.w;
    });
  }

  function parrafo(ctx, trozos, x0, ancho, tam) {
    renglones(ctx, trozos, ancho, tam).forEach(function (r) {
      ctx.sitio(ctx.SALTO);
      dibujarRenglon(ctx, r, x0, ctx.y(), tam);
      ctx.ponerY(ctx.y() - ctx.SALTO);
    });
  }

  function lista(ctx, b, tam) {
    var sangria = 16;
    b.items.forEach(function (it, i) {
      var marca = ctx.limpio(b.ordenada ? (i + 1) + '.' : '·');
      var rs = renglones(ctx, it, ctx.ANCHO - 2 * ctx.M - sangria, tam);
      rs.forEach(function (r, k) {
        ctx.sitio(ctx.SALTO);
        if (k === 0) ctx.pagina().drawText(marca, { x: ctx.M + 2, y: ctx.y(), size: tam, font: ctx.fuentes.normal, color: ctx.rgb(0, 0, 0) });
        dibujarRenglon(ctx, r, ctx.M + sangria, ctx.y(), tam);
        ctx.ponerY(ctx.y() - ctx.SALTO);
      });
    });
  }

  /* Anchos de columna: lo que ocupa cada una en una línea, y si no cabe, repartido a partes iguales de lo que ocupan. */
  function anchosDe(ctx, filas, total, tam, relleno) {
    var n = Math.max.apply(null, filas.map(function (f) { return f.length; })), natural = [];
    for (var c = 0; c < n; c++) {
      var max = 20;
      filas.forEach(function (f) {
        if (!f[c]) return;
        var w = 0;
        f[c].forEach(function (tr) { w += fuenteDe(ctx, tr).widthOfTextAtSize(ctx.limpio(tr.t.replace(/\n/g, ' ')), tam); });
        max = Math.max(max, w + 2 * relleno);
      });
      natural.push(max);
    }
    var suma = natural.reduce(function (a, b) { return a + b; }, 0);
    if (suma <= total) return natural;
    var minimo = 28;
    return natural.map(function (w) { return Math.max(minimo, total * w / suma); });
  }

  function tabla(ctx, b, tam) {
    var relleno = 4, total = ctx.ANCHO - 2 * ctx.M, anchos = anchosDe(ctx, b.filas, total, tam, relleno);
    b.filas.forEach(function (fila) {
      var rs = fila.map(function (celda, c) { return renglones(ctx, celda, (anchos[c] || 28) - 2 * relleno, tam); });
      var lineas = Math.max.apply(null, rs.map(function (r) { return r.length; }).concat([1]));
      var alto = lineas * ctx.SALTO + 2 * relleno;
      ctx.sitio(alto);
      var top = ctx.y() + 10, x = ctx.M;   /* `y` es la línea de base del texto: la casilla empieza una letra más arriba */
      fila.forEach(function (celda, c) {
        var w = anchos[c] || 28;
        ctx.pagina().drawRectangle({ x: x, y: top - alto, width: w, height: alto, borderColor: ctx.rgb(0.55, 0.55, 0.55), borderWidth: 0.6 });
        rs[c].forEach(function (r, k) { dibujarRenglon(ctx, r, x + relleno, top - relleno - 9 - k * ctx.SALTO, tam); });
        x += w;
      });
      ctx.ponerY(top - alto - 10);
    });
    ctx.ponerY(ctx.y() - 4);
  }

  function cuerpo(ctx, html) {
    var tam = ctx.TAM;
    CorreoFormato.aBloques(html).forEach(function (b) {
      if (b.tipo === 'lista') lista(ctx, b, tam);
      else if (b.tipo === 'tabla') tabla(ctx, b, tam);
      else parrafo(ctx, b.trozos, ctx.M, ctx.ANCHO - 2 * ctx.M, tam);
      ctx.ponerY(ctx.y() - ctx.SALTO * 0.5);   /* un respiro entre bloques */
    });
  }

  return { cuerpo: cuerpo, _renglones: renglones };
})();
window.CorreoEnviadoPdfFormato = CorreoEnviadoPdfFormato;
