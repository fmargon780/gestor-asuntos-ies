/* ============================================================
   lista-pegada.js — formar un grupo pegando una lista (fila 296,
   docs/TRABAJO-EN-BLOQUE-LISTA-PEGADA.md).

   Este fichero es la parte sin efectos: partir el texto en líneas y
   celdas, saltar la cabecera y reconocer a cada persona.
   `ListaPegada.reconocer(texto, personasPorCategoria, categoria)` →
   `{ encontradas, dudosas, noEncontradas, cabecera }`.

   Cada línea se reconoce por este orden, parando en el primero que dé
   UNA sola persona: Nº de identificación escolar, DNI/NIE (con o sin
   letra, con o sin guiones) y nombre entero (sin tildes, sin comas y
   sin importar el orden de las palabras). Dos con el mismo nombre
   nunca se eligen solas: van a «dudosas». En alumnado solo se busca
   entre los matriculados de este curso; quien solo aparece entre los
   antiguos va a «dudosas» diciéndolo.

   Se monta un índice por número, por documento y por nombre una sola
   vez por llamada: nada de recorrer la lista entera por cada línea.
   Lo pegado no se guarda ni se apunta en ningún sitio. El cuadro con
   sus tres apartados está en js/lista-pegada-pantalla.js.
   ============================================================ */
var ListaPegada = (function () {

  var MAX_CANDIDATAS = 5;
  var RE_CABECERA = /nombre|alumn|apellid|\bdni\b|\bnie\b|\bnif\b|document|identific|escolar|\bid\b|^n[º°o.]?$|^num/;
  var RE_COLUMNA_DOC = /(^|\s)(dni|nie|nif|documento)/;
  var RE_DE_TUTOR = /tutor|padre|madre|responsable/;

  function sinComillas(c) {
    c = String(c === null || c === undefined ? '' : c).trim();
    if (c.length > 1 && c.charAt(0) === '"' && c.charAt(c.length - 1) === '"') c = c.slice(1, -1).replace(/""/g, '"').trim();
    return c;
  }

  /* El texto en líneas con celdas: por tabulador (hoja de cálculo), si no por punto y coma, si no la línea entera. */
  function partir(texto) {
    var lineas = String(texto || '').replace(/^﻿/, '').split(/\r?\n/).filter(function (l) { return l.trim(); });
    var sep = null;
    if (lineas.some(function (l) { return l.indexOf('\t') !== -1; })) sep = '\t';
    else if (lineas.some(function (l) { return l.indexOf(';') !== -1; })) sep = ';';
    return lineas.map(function (l) {
      var celdas = (sep ? l.split(sep) : [l]).map(sinComillas);
      return { linea: l.replace(/\t+/g, ' · ').trim(), celdas: celdas.filter(function (c) { return c; }) };
    }).filter(function (f) { return f.celdas.length; });
  }

  /* Una tabla (filas de celdas, como la dan un CSV o un Excel) como texto de tabuladores: así vale lo mismo que lo pegado. */
  function deFilas(filas) {
    return (filas || []).map(function (f) {
      return f.map(function (c) { return String(c === null || c === undefined ? '' : c).replace(/[\t\r\n]+/g, ' ').trim(); }).join('\t');
    }).filter(function (l) { return l.replace(/\t/g, '').trim(); }).join('\n');
  }

  /* ---------- claves ---------- */

  function claveNombre(texto) {
    var palabras = U.normalizar(texto).replace(/[,;.]/g, ' ').split(' ').filter(Boolean);
    return palabras.length ? palabras.sort().join(' ') : '';
  }
  function claveDoc(texto) { return String(texto || '').toUpperCase().replace(/[\s.\-]/g, ''); }
  function sinLetra(doc) { return /^[XYZ]?\d{5,8}[A-Z]$/.test(doc) ? doc.slice(0, -1) : ''; }
  function claveNumero(texto) { return String(texto || '').trim().replace(/\.0+$/, ''); }

  function documentosDe(p) {
    var docs = [];
    if (p.documento) docs.push(p.documento);
    var campos = p.campos || {};
    Object.keys(campos).forEach(function (k) {
      var t = U.normalizar(k);
      if (RE_COLUMNA_DOC.test(t) && !RE_DE_TUTOR.test(t) && campos[k]) docs.push(campos[k]);
    });
    return docs.map(claveDoc).filter(function (d) { return d.length >= 6; });
  }

  function textoDe(p) { return (window.App && App.textoTercero) ? App.textoTercero(p) : p.nombre; }

  function nuevoIndice() { return { id: {}, doc: {}, docSin: {}, nombre: {}, idAnt: {}, docAnt: {}, docSinAnt: {}, nombreAnt: {} }; }
  function poner(mapa, clave, p) {
    if (!clave) return;
    if (!mapa[clave]) mapa[clave] = [];
    if (mapa[clave].indexOf(p) === -1) mapa[clave].push(p);
  }

  function indexar(porCategoria, categorias) {
    var ix = nuevoIndice();
    categorias.forEach(function (cat) {
      var lista = (porCategoria && porCategoria[cat]) || [];
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        var antiguo = cat === 'ALUMNADO' && !p.matriculado;
        var sufijo = antiguo ? 'Ant' : '';
        if (cat === 'ALUMNADO' && p.id) poner(ix['id' + sufijo], claveNumero(p.id), p);
        documentosDe(p).forEach(function (d) { poner(ix['doc' + sufijo], d, p); poner(ix['docSin' + sufijo], sinLetra(d), p); });
        poner(ix['nombre' + sufijo], claveNombre(p.nombre), p);
        if (p.nombreNatural) poner(ix['nombre' + sufijo], claveNombre(p.nombreNatural), p);
      }
    });
    return ix;
  }

  /* ---------- una línea ---------- */

  function corridas(celdas) {
    var salida = [];
    for (var i = 0; i < celdas.length; i++) {
      var acumulado = celdas[i];
      salida.push(acumulado);
      for (var j = i + 1; j < celdas.length && j < i + 5; j++) { acumulado += ' ' + celdas[j]; salida.push(acumulado); }
    }
    return salida;
  }

  function candidatosDeNombre(celdas) {
    var trozos = [];
    celdas.forEach(function (c) {
      if (c.indexOf(',') !== -1) c.split(',').forEach(function (x) { x = x.trim(); if (x) trozos.push(x); });
    });
    return corridas(celdas).concat(trozos.length ? corridas(trozos) : []);
  }

  /* Reúne las personas a las que lleva una serie de claves: devuelve { vivos, antiguos } sin repetir. */
  function juntar(ix, tipo, claves, quitarLetra) {
    var vivos = [], antiguos = [];
    claves.forEach(function (k) {
      if (!k) return;
      [['', vivos], ['Ant', antiguos]].forEach(function (par) {
        var hallados = ix[tipo + par[0]][k] || (quitarLetra ? ix['docSin' + par[0]][k] : null) || [];
        hallados.forEach(function (p) { if (par[1].indexOf(p) === -1) par[1].push(p); });
      });
    });
    return { vivos: vivos, antiguos: antiguos };
  }

  function pasos(celdas, ix) {
    var todas = celdas.slice();
    celdas.forEach(function (c) { if (c.indexOf(',') !== -1) c.split(',').forEach(function (x) { if (x.trim()) todas.push(x.trim()); }); });
    return [
      function () { return juntar(ix, 'id', todas.map(claveNumero), false); },
      function () { return juntar(ix, 'doc', todas.map(claveDoc).filter(function (d) { return d.length >= 6; }), true); },
      function () { return juntar(ix, 'nombre', candidatosDeNombre(celdas).map(claveNombre), false); }
    ];
  }

  function candidata(p) {
    var unidad = p.categoria === 'ALUMNADO' ? (p.matriculado ? (p.unidad || '') : 'ya no matriculado este curso')
      : (p.puesto || p.categoria || '');
    return { categoria: p.categoria, nombre: textoDe(p), persona: p, unidad: unidad };
  }

  function esCabecera(celdas) {
    return celdas.some(function (c) { return RE_CABECERA.test(U.normalizar(c)); });
  }

  function categoriasDe(personasPorCategoria, categoria) {
    if (categoria && categoria !== 'TODAS') return [categoria];
    return Object.keys(personasPorCategoria || {});
  }

  function reconocer(texto, personasPorCategoria, categoria) {
    var ix = indexar(personasPorCategoria, categoriasDe(personasPorCategoria, categoria));
    var filas = partir(texto);
    var salida = { encontradas: [], dudosas: [], noEncontradas: [], cabecera: '' };
    var vistas = [];
    filas.forEach(function (fila, n) {
      var unica = null, ambiguas = null, antiguas = null;
      var etapas = pasos(fila.celdas, ix);
      for (var e = 0; e < etapas.length && !unica; e++) {
        var r = etapas[e]();
        if (r.vivos.length === 1) unica = r.vivos[0];
        else if (r.vivos.length > 1 && !ambiguas) ambiguas = r.vivos;
        else if (!r.vivos.length && r.antiguos.length && !antiguas) antiguas = r.antiguos;
      }
      if (unica) {
        if (vistas.indexOf(unica) !== -1) return;   /* repetida: entra una sola vez */
        vistas.push(unica);
        salida.encontradas.push({ linea: fila.linea, categoria: unica.categoria, nombre: textoDe(unica), persona: unica });
      } else if (ambiguas) {
        salida.dudosas.push({ linea: fila.linea, motivo: 'Hay más de una con ese dato.',
          candidatas: ambiguas.slice(0, MAX_CANDIDATAS).map(candidata) });
      } else if (antiguas) {
        salida.dudosas.push({ linea: fila.linea, motivo: 'No está matriculada este curso.',
          candidatas: antiguas.slice(0, MAX_CANDIDATAS).map(candidata) });
      } else if (n === 0 && esCabecera(fila.celdas)) {
        salida.cabecera = fila.linea;   /* la primera línea es una cabecera: ni persona ni «no encontrada» */
      } else {
        salida.noEncontradas.push(fila.linea);
      }
    });
    return salida;
  }

  return { partir: partir, deFilas: deFilas, reconocer: reconocer, claveNombre: claveNombre, MAX_CANDIDATAS: MAX_CANDIDATAS };
})();
window.ListaPegada = ListaPegada;
