/* ============================================================
   material-precios.js — los precios de cada proveedor y las cifras de la pestaña
   «Proveedores» (fila 751, docs/583-COMPRAS-DE-MATERIAL.md, parte 2).

   Un fichero nuevo en `_GESTOR`, siempre por `ColaGuardado` y releído antes de escribir:
   - `material-precios.json`: { precios, portes, cifras }
       precio: { id, a: id de artículo, p: razón social del proveedor, i: precio sin IVA, f: fecha ISO,
                 o: «Llamada» | «Correo» | «Presupuesto» | «Factura …», d: { asunto, doc } si viene de un documento }
       portes: { <proveedor en minúsculas y sin tildes>: importe desde el que son gratis }
       cifras: { <proveedor…>: { facturado, sinFacturar } } SOLO de partida (la copia de demostración las
               usa hasta que la parte 5 las calcule de los pedidos y las facturas; en datos reales no hay).
   Los precios no se borran: un precio del mismo artículo, proveedor y día sustituye al anterior.

   La lógica (`anadirPrecio`, `renglones`, `mejorPrecio`, `filaDeProveedor`…) es pura, sin DOM ni disco: se
   comprueba sin navegador en pruebas/material-precios.mjs. Los importes se redondean a céntimos.

   Puntos para las partes siguientes: `Material.cifrasDeProveedor(clave)` -> { facturado, sinFacturar }
   (la parte 5 lo sustituye) y `Material.proveedoresConPedido()` -> [nombres] (la parte 3 lo sustituye).
   ============================================================ */
(function () {

  var F_PRECIOS = 'material-precios.json';
  var TOPE = 15000;          /* contrato menor de suministros, sin IVA */
  var MESES_RECIENTE = 6;

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function lista(v) { return Array.isArray(v) ? v : []; }
  function clave(v) { return window.U && U.normalizar ? U.normalizar(texto(v)) : texto(v).toLowerCase(); }
  function centimos(n) { return Math.round(Number(n) * 100) / 100; }
  function idNuevo() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function normalizarPrecios(d) {
    d = d || {};
    var portes = {}, cifras = {};
    Object.keys(d.portes && typeof d.portes === 'object' ? d.portes : {}).forEach(function (k) {
      var n = Number(d.portes[k]); if (n > 0) portes[k] = centimos(n);
    });
    Object.keys(d.cifras && typeof d.cifras === 'object' ? d.cifras : {}).forEach(function (k) {
      var c = d.cifras[k] || {};
      cifras[k] = { facturado: centimos(c.facturado) || 0, sinFacturar: centimos(c.sinFacturar) || 0 };
    });
    return {
      precios: lista(d.precios).filter(function (p) { return p && texto(p.id) && texto(p.a) && texto(p.p) && Number(p.i) > 0; }).map(function (p) {
        var r = { id: texto(p.id), a: texto(p.a), p: texto(p.p), i: centimos(p.i), f: texto(p.f), o: texto(p.o) };
        if (p.d && texto(p.d.asunto) && texto(p.d.doc)) r.d = { asunto: texto(p.d.asunto), doc: texto(p.d.doc) };
        return r;
      }),
      portes: portes,
      cifras: cifras
    };
  }

  /* La fecha, seis meses antes de `hoy` (ISO): lo anterior es «de hace más de seis meses». */
  function limiteReciente(hoy) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(hoy || '');
    var d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date();
    d.setUTCMonth(d.getUTCMonth() - MESES_RECIENTE);
    return d.toISOString().slice(0, 10);
  }

  /* Alta de un precio. El mismo artículo, proveedor y día sustituye al anterior. */
  function anadirPrecio(datos, o) {
    var i = Number(o.i);
    if (!texto(o.a)) return { ok: false, error: 'Elige el artículo.' };
    if (!texto(o.p)) return { ok: false, error: 'Elige el proveedor.' };
    if (!(i > 0)) return { ok: false, error: 'Escribe el precio sin IVA.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto(o.f))) return { ok: false, error: 'Escribe la fecha.' };
    if (!texto(o.o)) return { ok: false, error: 'Di de dónde sale el precio.' };
    if (texto(o.o) === 'Presupuesto' && !(o.d && texto(o.d.asunto) && texto(o.d.doc))) return { ok: false, error: 'Elige el documento del presupuesto.' };
    var nuevo = { id: idNuevo(), a: texto(o.a), p: texto(o.p), i: centimos(i), f: texto(o.f), o: texto(o.o) };
    if (texto(o.o) === 'Presupuesto') nuevo.d = { asunto: texto(o.d.asunto), doc: texto(o.d.doc) };
    var antes = datos.precios.length;
    datos.precios = datos.precios.filter(function (p) {
      return !(p.a === nuevo.a && clave(p.p) === clave(nuevo.p) && p.f === nuevo.f);
    });
    datos.precios.push(nuevo);
    return { ok: true, precio: nuevo, sustituye: datos.precios.length === antes };
  }

  /* Un renglón por proveedor (su precio más reciente; a igual fecha, el último apuntado), de barato a caro.
     Cada uno lleva `reciente` y `mejor` (el más barato de los recientes). */
  function renglones(datos, articulo, hoy) {
    var por = {};
    lista(datos.precios).forEach(function (p) {
      if (p.a !== articulo) return;
      var k = clave(p.p), ya = por[k];
      if (!ya || p.f >= ya.f) por[k] = p;
    });
    var corte = limiteReciente(hoy);
    var filas = Object.keys(por).map(function (k) {
      var p = por[k];
      return { precio: p, proveedor: p.p, i: p.i, f: p.f, o: p.o, d: p.d || null, reciente: p.f >= corte, mejor: false };
    }).sort(function (x, y) { return x.i - y.i || (x.proveedor < y.proveedor ? -1 : 1); });
    var mejor = filas.filter(function (r) { return r.reciente; })[0];
    if (mejor) mejor.mejor = true;
    return filas;
  }

  function euros(n) {
    var partes = (Math.round(Number(n) * 100) / 100).toFixed(2).split('.');
    return partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + partes[1] + ' €';
  }
  function fechaCorta(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return m ? parseInt(m[3], 10) + '-' + meses[parseInt(m[2], 10) - 1] + '-' + m[1] : '';
  }

  /* «2,15 € · Papelería La Esquina, S.L. (20-nov-2026)» o «Sin precio reciente». */
  function mejorPrecio(datos, articulo, hoy) {
    var m = renglones(datos, articulo, hoy).filter(function (r) { return r.mejor; })[0];
    if (!m) return { texto: 'Sin precio reciente', titulo: 'Ningún proveedor tiene precio de los últimos seis meses.', precio: null };
    return { texto: euros(m.i) + ' · ' + m.proveedor + ' (' + fechaCorta(m.f) + ')', titulo: '', precio: m.i, proveedor: m.proveedor };
  }

  function ponerPortes(datos, proveedor, importe) {
    var k = clave(proveedor), n = texto(importe).replace(',', '.');
    if (!k) return { ok: false, error: 'Falta el proveedor.' };
    if (n === '') { delete datos.portes[k]; return { ok: true, vacio: true }; }
    if (!(Number(n) > 0)) return { ok: false, error: 'Escribe un importe mayor que cero, o déjalo vacío.' };
    datos.portes[k] = centimos(n);
    return { ok: true, importe: datos.portes[k] };
  }

  /* Las cifras de un proveedor para la pestaña: la parte 5 las sustituye por lo real. */
  function cifrasDeFondo(datos, k) { return datos.cifras[k] || { facturado: 0, sinFacturar: 0 }; }

  function filaDeProveedor(datos, nombre, correo, cifras) {
    var k = clave(nombre), c = cifras || cifrasDeFondo(datos, k);
    var usado = centimos((c.facturado || 0) + (c.sinFacturar || 0));
    var pct = Math.round(usado / TOPE * 100);
    return {
      proveedor: nombre, correo: correo || '', portes: datos.portes[k] || null, facturado: c.facturado || 0, sinFacturar: c.sinFacturar || 0,
      usado: usado, pct: pct, estado: usado > TOPE ? 'pasado' : (pct >= 80 ? 'cerca' : 'bien')
    };
  }

  /* Los proveedores con algún precio (o algún pedido), uno por nombre; el de «Personas y empresas» da el correo. */
  function proveedores(datos, empresas, conPedido) {
    var vistos = {}, salida = [];
    function mirar(nombre) {
      var k = clave(nombre); if (!k || vistos[k]) return;
      vistos[k] = 1;
      var e = lista(empresas).filter(function (x) { return clave(x.nombre) === k; })[0];
      salida.push({ nombre: e ? e.nombre : nombre, correo: e ? e.correo : '' });
    }
    lista(datos.precios).forEach(function (p) { mirar(p.p); });
    lista(conPedido).forEach(mirar);
    return salida.sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });
  }

  /* ---------- disco ---------- */

  async function leerPrecios() {
    var g = window.Gestor && Gestor.carpetaGestor && Gestor.carpetaGestor(), d = null;
    if (g) { try { d = await Carpetas.leerJson(g, F_PRECIOS); } catch (e) { d = null; } }
    return normalizarPrecios(d);
  }
  function cambiarPrecios(hacer) {
    var g = window.Gestor && Gestor.carpetaGestor && Gestor.carpetaGestor();
    if (!g) return Promise.reject(new Error('No hay carpeta del Gestor señalada.'));
    var en = window.ColaGuardado ? function (fn) { return ColaGuardado.poner(F_PRECIOS, fn); } : function (fn) { return fn(); };
    return en(async function () {
      var datos = await leerPrecios();
      var r = hacer(datos);
      if (r && r.ok === false) return r;
      await Copias.guardar(g, F_PRECIOS, datos);
      return r || { ok: true };
    });
  }

  /* «Personas y empresas»: las empresas del centro (razón social y correo). */
  async function leerEmpresas() {
    try {
      var em = await Datos.cargar(App.E.datos, 'EMPRESAS');
      return em.lista.map(function (p) { return { nombre: p.nombre, correo: (p.campos && p.campos['Correo']) || '', comercial: p.comercial || '', nif: p.nif || '', persona: p }; });
    } catch (e) { return []; }
  }

  Material.FICHEROS.push(F_PRECIOS);
  Material.TOPE = TOPE;
  Material.normalizarPrecios = normalizarPrecios;
  Material.limiteReciente = limiteReciente;
  Material.anadirPrecio = anadirPrecio;
  Material.renglones = function (a) { return renglones(Material.estado.precios, a, Material.hoyIso()); };
  Material.renglonesDe = renglones;
  Material.mejorPrecioDe = mejorPrecio;
  Material.mejorPrecio = function (a) { return mejorPrecio(Material.estado.precios, a, Material.hoyIso()); };
  Material.ponerPortes = ponerPortes;
  Material.proveedoresDe = proveedores;
  Material.filaDeProveedor = filaDeProveedor;
  Material.cifrasDeProveedor = null;            /* parte 5: function (clave) -> { facturado, sinFacturar } */
  Material.proveedoresConPedido = function () { return []; };   /* parte 3: nombres de los que tienen pedido */
  Material.leerPrecios = leerPrecios;
  Material.cambiarPrecios = cambiarPrecios;
  Material.leerEmpresas = leerEmpresas;
  Material.clave = clave;
  Material.euros = euros;
  Material.fechaCorta = fechaCorta;
})();
