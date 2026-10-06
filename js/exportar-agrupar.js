/* ============================================================
   exportar-agrupar.js — el informe en PDF de «Exportar», agrupado por una
   o dos columnas (fila 278, docs/INFORME-AGRUPADO.md). Solo cálculo: no
   toca la pantalla.

   `ExportarAgrupar.agrupar(tabla, ids)` recibe la tabla ya preparada para
   el informe (`ExportarAsuntos.tabla`) y los ids de las columnas por las
   que se agrupa (una o dos) y devuelve:

     { niveles: [{ id, titulo, pos }],      las columnas de agrupar, con su posición
       posiciones: [pos…],                  las columnas que salen en las tablas
       bloques: [ { texto, titulo, n, filas: [pos de fila…], sumas, hijos: [bloques] } ] }

   Se agrupa siempre sobre lo que se lee en cada celda (`textoDeCelda`),
   nunca sobre los datos del asunto: un reservado va al bloque «Reservado».
   Los bloques guardan posiciones de fila, porque el informe necesita a la
   vez la fila de la tabla y el registro de cada asunto.
   ============================================================ */
var ExportarAgrupar = (function () {

  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var SIN_DATO = 'Sin dato';

  function E() { return window.ExportarAsuntos; }

  function norm(t) { return U.normalizar(String(t === undefined || t === null ? '' : t)).trim(); }

  /* La clave de un valor en su columna: { cat, orden, texto, clave }. `cat`: 0 meses y números (por `orden`),
     1 textos (alfabético), 2 sin dato (siempre el último). */
  function claveDe(celda, columna) {
    var texto = String(E().textoDeCelda(celda, columna) === undefined ? '' : E().textoDeCelda(celda, columna)).trim();
    if (!texto) return { cat: 2, orden: 0, texto: SIN_DATO, clave: 'sin-dato' };
    if (celda.k === 'fecha') {
      var m = String(celda.v).match(/^(\d{4})-(\d{2})/);
      if (m) {
        var mes = parseInt(m[2], 10);
        return { cat: 0, orden: parseInt(m[1], 10) * 12 + mes, texto: MESES[mes - 1] + ' de ' + m[1], clave: 'mes:' + m[1] + '-' + m[2] };
      }
    }
    if (celda.k === 'numero') return { cat: 0, orden: celda.v, texto: texto, clave: 'num:' + celda.v };
    return { cat: 1, orden: 0, texto: texto, clave: 't:' + norm(texto) };
  }

  function comparar(a, b) {
    if (a.cat !== b.cat) return a.cat - b.cat;
    if (a.cat === 0) return a.orden - b.orden;
    if (a.cat === 1) return a.texto.localeCompare(b.texto, 'es', { numeric: true, sensitivity: 'base' });
    return 0;
  }

  /* Parte las filas `posiciones` por la columna `pos`: [{ clave datos…, filas }] ya ordenados. */
  function partir(tabla, filas, pos) {
    var columna = tabla.columnas[pos];
    var por = {}, lista = [];
    filas.forEach(function (i) {
      var k = claveDe(tabla.filas[i][pos], columna);
      if (!por[k.clave]) { por[k.clave] = Object.assign({ filas: [] }, k); lista.push(por[k.clave]); }
      por[k.clave].filas.push(i);
    });
    lista.sort(comparar);
    return lista;
  }

  /* Las sumas de un bloque, solo de las columnas de cantidades que salen en las tablas. */
  function sumasDe(tabla, filas, posiciones) {
    var sumas = {};
    posiciones.forEach(function (p) {
      if (tabla.columnas[p].clase !== 'numero') return;
      var s = 0;
      filas.forEach(function (i) { var c = tabla.filas[i][p]; if (c && c.k === 'numero') s += c.v; });
      sumas[p] = Number(s.toFixed(8));
    });
    return sumas;
  }

  function agrupar(tabla, ids) {
    var niveles = [];
    (ids || []).forEach(function (id) {
      for (var i = 0; i < tabla.columnas.length; i++) {
        if (tabla.columnas[i].id === id && !niveles.some(function (n) { return n.pos === i; })) niveles.push({ id: id, titulo: tabla.columnas[i].titulo, pos: i });
      }
    });
    niveles = niveles.slice(0, 2);
    var todas = tabla.columnas.map(function (c, i) { return i; });
    var agrupadas = niveles.map(function (n) { return n.pos; });
    var posiciones = todas.filter(function (i) { return agrupadas.indexOf(i) === -1; });
    if (!posiciones.length) posiciones = todas;   /* sin ninguna columna para las tablas, no se quita ninguna */
    var filasTodas = tabla.filas.map(function (f, i) { return i; });

    function construir(filas, nivel) {
      return partir(tabla, filas, niveles[nivel].pos).map(function (g) {
        var b = { texto: g.texto, titulo: niveles[nivel].titulo + ': ' + g.texto, n: g.filas.length, filas: g.filas,
          sumas: sumasDe(tabla, g.filas, posiciones), hijos: [] };
        if (nivel + 1 < niveles.length) b.hijos = construir(g.filas, nivel + 1);
        return b;
      });
    }
    return { niveles: niveles, posiciones: posiciones, bloques: niveles.length ? construir(filasTodas, 0) : [] };
  }

  /* «Agrupado por: Lo encarga y Tipo». */
  function textoDeAgrupado(r) {
    return 'Agrupado por: ' + r.niveles.map(function (n) { return n.titulo; }).join(' y ');
  }

  /* «CERTIFICADO: 12 asuntos · Total Importe: 180,00 €» */
  function lineaDeCierre(tabla, r, bloque) {
    var partes = [bloque.texto + ': ' + E().textoDeNumeroDeAsuntos(bloque.n)];
    r.posiciones.forEach(function (p) {
      if (tabla.columnas[p].clase === 'numero') partes.push(E().textoDeTotal({ columnas: tabla.columnas, sumas: bloque.sumas }, p));
    });
    return partes.join(' · ');
  }

  return { agrupar: agrupar, textoDeAgrupado: textoDeAgrupado, lineaDeCierre: lineaDeCierre, MESES: MESES };
})();
window.ExportarAgrupar = ExportarAgrupar;
