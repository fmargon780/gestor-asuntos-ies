/* ============================================================
   material-datos.js — el material de oficina: catálogo y lista de lo
   que falta (fila 750, docs/583-COMPRAS-DE-MATERIAL.md, parte 1).

   Dos ficheros nuevos en `_GESTOR`, los dos por `ColaGuardado` y siempre
   releídos justo antes de escribir (dos personas a la vez no se pisan):
   - `material-catalogo.json`: { categorias, articulos, unidades }
       categoría: { id, nombre, car: [características], sin: true si el
                    nombre del artículo NO empieza por el de la categoría,
                    vals: { característica: [valores de su lista] } }
       artículo:  { id, cat, v: [un valor por característica], u: «se compra por» }
   - `material-falta.json`: { lineas, quitadas, destinos }
       línea: { id, a: id de artículo, c: cantidad, para, q: quién, f: fecha ISO }
       quitadas: ids de líneas quitadas (lápidas: una línea quitada no resucita).
   Nada de lo que hay aquí se borra salvo las líneas de «Lo que falta».

   La lógica de las listas (`crearArticulo`, `apuntar`, `buscar`…) es pura,
   sin DOM ni disco: se comprueba sin navegador en pruebas/material-datos.mjs.
   Solo `leer` y `cambiar` tocan `Carpetas`, `Copias` y `Gestor`.

   Las partes siguientes del tema 583 se enganchan por `Material.pestanas`
   (js/material-pantalla.js) y por los puntos `Material.mejorPrecio` y
   `Material.accionesDeFalta`, que aquí valen «sin precio» y «ninguna».
   ============================================================ */
var Material = (function () {

  var F_CAT = 'material-catalogo.json';
  var F_FALTA = 'material-falta.json';
  var DESTINOS_DE_FABRICA = ['Administración', 'Dirección', 'Jefatura de estudios', 'Conserjería'];

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function clave(v) { return window.U && U.normalizar ? U.normalizar(texto(v)) : texto(v).toLowerCase(); }
  function lista(v) { return Array.isArray(v) ? v : []; }

  function idNuevo() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ==========================================================
     NORMALIZAR LO LEÍDO (un fichero a medias o raro no rompe nada)
     ========================================================== */

  function categoriaOk(c) {
    if (!c || !texto(c.id) || !texto(c.nombre)) return null;
    var car = lista(c.car).map(texto).filter(Boolean);
    var vals = {};
    car.forEach(function (k) { vals[k] = lista(c.vals && c.vals[k]).map(texto).filter(Boolean); });
    return { id: texto(c.id), nombre: texto(c.nombre), car: car, sin: !!c.sin, vals: vals };
  }

  function normalizarCatalogo(d) {
    d = d || {};
    return {
      categorias: lista(d.categorias).map(categoriaOk).filter(Boolean),
      articulos: lista(d.articulos).filter(function (a) { return a && texto(a.id) && texto(a.cat); }).map(function (a) {
        return { id: texto(a.id), cat: texto(a.cat), v: lista(a.v).map(texto), u: texto(a.u) };
      }),
      unidades: lista(d.unidades).map(texto).filter(Boolean)
    };
  }

  function normalizarFalta(d) {
    d = d || {};
    return {
      lineas: lista(d.lineas).filter(function (l) { return l && texto(l.id) && texto(l.a); }).map(function (l) {
        var c = Number(l.c);
        return { id: texto(l.id), a: texto(l.a), c: c > 0 ? c : 1, para: texto(l.para), q: texto(l.q), f: texto(l.f) };
      }),
      quitadas: lista(d.quitadas).map(texto).filter(Boolean),
      destinos: lista(d.destinos).map(texto).filter(Boolean)
    };
  }

  /* ==========================================================
     EL CATÁLOGO (puro)
     ========================================================== */

  function categoriaDe(cat, id) {
    return lista(cat.categorias).filter(function (c) { return c.id === id; })[0] || null;
  }
  function articuloDe(cat, id) {
    return lista(cat.articulos).filter(function (a) { return a.id === id; })[0] || null;
  }

  /* «Papel A4 80 g Blanco»; con la casilla desmarcada, «Grapas 24/6». */
  function nombreDe(cat, art) {
    var c = art && categoriaDe(cat, art.cat);
    if (!c) return '';
    return (c.sin ? '' : c.nombre + ' ') + lista(art.v).filter(Boolean).join(' ');
  }

  /* El valor de la lista que ya existe con otras mayúsculas (o tildes), o null. */
  function igualA(valores, v) {
    var k = clave(v);
    if (!k) return null;
    var ya = lista(valores).filter(function (x) { return clave(x) === k; })[0];
    return ya === undefined ? null : ya;
  }

  /* Lo escrito en «+ Nuevo valor…»: si ya estaba con otras mayúsculas, se queda lo que había. */
  function resolverValor(valores, v) {
    v = texto(v);
    var ya = igualA(valores, v);
    return ya === null ? { valor: v, yaEstaba: false } : { valor: ya, yaEstaba: true };
  }

  function nombreLibre(cat, nombre) {
    var k = clave(nombre);
    return !lista(cat.categorias).some(function (c) { return clave(c.nombre) === k; });
  }

  /* Características escritas «Formato, Gramaje, Color»: sin repetidas ni vacías. */
  function caracteristicasDe(textoEscrito) {
    var vistas = {}, salida = [];
    String(textoEscrito || '').split(',').forEach(function (s) {
      var k = texto(s);
      if (k && !vistas[clave(k)]) { vistas[clave(k)] = 1; salida.push(k); }
    });
    return salida;
  }

  function crearCategoria(cat, o) {
    var nombre = texto(o.nombre), car = lista(o.car).map(texto).filter(Boolean);
    if (!nombre) return { ok: false, error: 'Escribe el nombre de la categoría.' };
    if (!car.length) return { ok: false, error: 'Escribe al menos una característica.' };
    if (!nombreLibre(cat, nombre)) return { ok: false, error: 'Ya hay una categoría que se llama «' + nombre + '».' };
    var c = { id: idNuevo(), nombre: nombre, car: car, sin: !!o.sin, vals: {} };
    car.forEach(function (k) { c.vals[k] = []; });
    cat.categorias.push(c);
    return { ok: true, categoria: c };
  }

  /* Cambiar las características de una categoría: se conservan los datos por NOMBRE de característica. */
  function cambiarCaracteristicas(cat, id, car, sin) {
    var c = categoriaDe(cat, id);
    car = lista(car).map(texto).filter(Boolean);
    if (!c) return { ok: false, error: 'No encuentro la categoría.' };
    if (!car.length) return { ok: false, error: 'Escribe al menos una característica.' };
    var viejas = c.car.slice(), vals = {};
    lista(cat.articulos).filter(function (a) { return a.cat === id; }).forEach(function (a) {
      var por = {};
      viejas.forEach(function (k, i) { por[clave(k)] = a.v[i] || ''; });
      a.v = car.map(function (k) { return por[clave(k)] || ''; });
    });
    car.forEach(function (k) {
      var antes = viejas.filter(function (x) { return clave(x) === clave(k); })[0];
      vals[k] = antes !== undefined ? c.vals[antes] || [] : [];
    });
    c.car = car; c.vals = vals; c.sin = !!sin;
    return { ok: true, categoria: c };
  }

  function articuloIgual(cat, catId, v) {
    var k = lista(v).map(clave).join('|');
    return lista(cat.articulos).filter(function (a) {
      return a.cat === catId && lista(a.v).map(clave).join('|') === k;
    })[0] || null;
  }

  /* Alta de un artículo: cada valor entra en la lista de su característica si es nuevo. */
  function crearArticulo(cat, o) {
    var c = categoriaDe(cat, o.cat);
    if (!c) return { ok: false, error: 'Elige la categoría.' };
    var v = c.car.map(function (k, i) { return texto(lista(o.v)[i]); });
    var u = texto(o.u);
    if (!v.some(Boolean) || !u) return { ok: false, error: 'Rellena las características y cómo se compra.' };
    var igual = articuloIgual(cat, c.id, v);
    if (igual) return { ok: false, error: 'Ese artículo ya existe: ' + nombreDe(cat, igual), existente: igual };
    c.car.forEach(function (k, i) {
      if (!v[i]) return;
      var ya = igualA(c.vals[k], v[i]);
      if (ya === null) c.vals[k] = lista(c.vals[k]).concat([v[i]]).sort(porNombre);
      else v[i] = ya;
    });
    var unidad = igualA(cat.unidades, u);
    if (unidad === null) cat.unidades = cat.unidades.concat([u]).sort(porNombre); else u = unidad;
    var a = { id: idNuevo(), cat: c.id, v: v, u: u };
    cat.articulos.push(a);
    return { ok: true, articulo: a };
  }

  function porNombre(a, b) { return String(a).localeCompare(String(b), 'es'); }

  /* Los artículos que salen al escribir: todas las palabras, en cualquier orden, sobre el nombre completo. */
  function buscar(cat, escrito, maximo) {
    var palabras = clave(escrito).split(/\s+/).filter(Boolean);
    if (!palabras.length) return [];
    return lista(cat.articulos).filter(function (a) {
      var c = categoriaDe(cat, a.cat);
      var m = clave((c ? c.nombre + ' ' : '') + nombreDe(cat, a));
      return palabras.every(function (p) { return m.indexOf(p) !== -1; });
    }).sort(function (x, y) { return porNombre(nombreDe(cat, x), nombreDe(cat, y)); }).slice(0, maximo || 8);
  }

  /* ==========================================================
     LO QUE FALTA (puro)
     ========================================================== */

  function destinosDe(falta) {
    var salida = DESTINOS_DE_FABRICA.slice();
    lista(falta.destinos).forEach(function (d) { if (igualA(salida, d) === null) salida.push(d); });
    return salida;
  }

  function anadirDestino(falta, nombre) {
    nombre = texto(nombre);
    if (!nombre) return { ok: false, error: 'Escribe el nombre.' };
    var ya = igualA(destinosDe(falta), nombre);
    if (ya !== null) return { ok: true, destino: ya, yaEstaba: true };
    falta.destinos.push(nombre);
    return { ok: true, destino: nombre, yaEstaba: false };
  }

  /* Apuntar: el mismo artículo para el mismo destino suma; para otro destino, otra línea. */
  function apuntar(falta, o) {
    var c = Number(o.c);
    if (!texto(o.a)) return { ok: false, error: 'Elige el artículo.' };
    if (!(c > 0)) return { ok: false, error: 'Escribe la cantidad.' };
    var para = texto(o.para);
    var ya = lista(falta.lineas).filter(function (l) { return l.a === o.a && clave(l.para) === clave(para); })[0];
    if (ya) { ya.c += c; return { ok: true, linea: ya, suma: true }; }
    var l = { id: idNuevo(), a: o.a, c: c, para: para, q: texto(o.q), f: texto(o.f) };
    falta.lineas.push(l);
    return { ok: true, linea: l, suma: false };
  }

  function ponerCantidad(falta, id, c) {
    c = Number(c);
    var l = lista(falta.lineas).filter(function (x) { return x.id === id; })[0];
    if (!l || !(c > 0)) return false;
    l.c = c;
    return true;
  }

  function quitar(falta, ids) {
    ids = lista(ids);
    falta.lineas = falta.lineas.filter(function (l) { return ids.indexOf(l.id) === -1; });
    ids.forEach(function (id) { if (falta.quitadas.indexOf(id) === -1) falta.quitadas.push(id); });
  }

  /* Al leer: lo quitado en otro ordenador no resucita aunque este lo traiga de una copia vieja. */
  function sinQuitadas(falta) {
    falta.lineas = falta.lineas.filter(function (l) { return falta.quitadas.indexOf(l.id) === -1; });
    return falta;
  }

  /* ==========================================================
     EL DISCO (en fila, releyendo antes de escribir)
     ========================================================== */

  function enFila(fichero, fn) { return window.ColaGuardado ? ColaGuardado.poner(fichero, fn) : fn(); }
  function gestor() { return window.Gestor && window.Gestor.carpetaGestor && window.Gestor.carpetaGestor(); }

  async function leerFichero(fichero, normalizar) {
    var g = gestor(), d = null;
    if (g) { try { d = await Carpetas.leerJson(g, fichero); } catch (e) { d = null; } }
    return normalizar(d);
  }
  function leerCatalogo() { return leerFichero(F_CAT, normalizarCatalogo); }
  async function leerFalta() { return sinQuitadas(await leerFichero(F_FALTA, normalizarFalta)); }

  /* Lee, aplica `hacer` sobre lo que hay AHORA en el disco y escribe. Devuelve lo que devuelva `hacer`;
     si `hacer` devuelve {ok:false}, no se escribe nada. */
  function cambiar(fichero, normalizar, hacer) {
    var g = gestor();
    if (!g) return Promise.reject(new Error('No hay carpeta del Gestor señalada.'));
    return enFila(fichero, async function () {
      var datos = await leerFichero(fichero, normalizar);
      if (fichero === F_FALTA) sinQuitadas(datos);
      var r = hacer(datos);
      if (r && r.ok === false) return r;
      await Copias.guardar(g, fichero, datos);
      return r || { ok: true };
    });
  }
  function cambiarCatalogo(hacer) { return cambiar(F_CAT, normalizarCatalogo, hacer); }
  function cambiarFalta(hacer) { return cambiar(F_FALTA, normalizarFalta, hacer); }

  function quienSoy() { return (window.Gestor && window.Gestor.usuario && window.Gestor.usuario()) || ''; }
  function hoyIso() { return window.U && U.hoyIso ? U.hoyIso() : new Date().toISOString().slice(0, 10); }

  return {
    FICHEROS: [F_CAT, F_FALTA],
    /* disco */
    leerCatalogo: leerCatalogo, leerFalta: leerFalta, cambiarCatalogo: cambiarCatalogo, cambiarFalta: cambiarFalta,
    quienSoy: quienSoy, hoyIso: hoyIso,
    /* catálogo */
    categoriaDe: categoriaDe, articuloDe: articuloDe, nombreDe: nombreDe, igualA: igualA, resolverValor: resolverValor,
    caracteristicasDe: caracteristicasDe, crearCategoria: crearCategoria, cambiarCaracteristicas: cambiarCaracteristicas,
    crearArticulo: crearArticulo, articuloIgual: articuloIgual, buscar: buscar,
    /* lo que falta */
    destinosDe: destinosDe, anadirDestino: anadirDestino, apuntar: apuntar, ponerCantidad: ponerCantidad, quitar: quitar, sinQuitadas: sinQuitadas,
    /* puntos para las partes siguientes del tema 583 */
    mejorPrecio: function () { return null; },        /* parte 2: { texto, titulo } o null */
    accionesDeFalta: [],                              /* parte 3 y 4: { texto, id, alPulsar(lineas) } */
    normalizarCatalogo: normalizarCatalogo, normalizarFalta: normalizarFalta
  };
})();
window.Material = Material;
