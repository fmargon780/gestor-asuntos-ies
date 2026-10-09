/* ============================================================
   permisos-carpetas.js — el permiso de las carpetas recordadas
   (9-oct-2026, fila 318, docs/PERMISOS-DE-CARPETAS-AL-ENTRAR.md).

   Las carpetas del alumnado, de la bandeja y del Centro de datos se
   señalan una vez y el navegador las recuerda, pero el permiso sobre
   ellas caduca. Antes había que volver a señalarlas cada mañana. Aquí
   se pide el permiso SOBRE LA CARPETA YA RECORDADA (requestPermission),
   que es lo único con lo que Chrome ofrece «Permitir en cada visita».

     estado(id)      — 'sin-carpeta' | 'con-permiso' | 'sin-permiso'. Solo mira.
     pedir(id)       — pide el permiso de esa carpeta; true si queda con él.
                       Nunca lanza. No vuelve a guardar la carpeta.
     pedirAlEntrar() — lo llama «Entrar»: pide las que estén recordadas,
                       sin permiso y no omitidas, todas seguidas.

   Cada carpeta pide el mismo modo que pide hoy (alumnado y Centro de
   datos, solo leer; la bandeja, el de Carpetas). No escribe nada.
   ============================================================ */
(function () {
  'use strict';

  var ESPERA_MAX_MS = 60000;

  /* El mismo `id` que usa su fila en js/comprobacion-entrada.js. */
  var LISTA = [
    { id: 'alumnado', carpeta: function () { return window.AlumnadoBD ? AlumnadoBD.carpeta() : null; },
      permiso: function (d, p) { return AlumnadoBD.permiso(d, p); } },
    { id: 'centro-de-datos', carpeta: function () { return window.CentroDeDatos ? CentroDeDatos.carpeta() : null; },
      permiso: function (d, p) { return CentroDeDatos.permiso(d, p); },
      /* En «solo consultar» el Centro de datos no se lee (js/centro-de-datos.js): no se pide. */
      noSePide: function () { return !!(window.SoloConsulta && SoloConsulta.activo()); } },
    { id: 'bandeja', carpeta: function () { return Almacen.leer('bandeja'); },
      permiso: function (d, p) { return Carpetas.permiso(d, p); } }
  ];

  function deLaLista(id) { return LISTA.filter(function (x) { return x.id === id; })[0] || null; }

  async function carpetaDe(item) {
    try { return (await item.carpeta()) || null; } catch (e) { return null; }
  }

  async function mirar(item, dir) {
    try { return !!(await item.permiso(dir, false)); } catch (e) { return false; }
  }

  async function estado(id) {
    var item = deLaLista(id);
    if (!item) return 'sin-carpeta';
    var dir = await carpetaDe(item);
    if (!dir) return 'sin-carpeta';
    return (await mirar(item, dir)) ? 'con-permiso' : 'sin-permiso';
  }

  async function pedirA(item, dir) {
    try { return !!(await item.permiso(dir, true)); } catch (e) { return false; }
  }

  async function pedir(id) {
    var item = deLaLista(id);
    if (!item) return false;
    var dir = await carpetaDe(item);
    if (!dir) return false;
    return pedirA(item, dir);
  }

  function conTiempo(promesa) {
    return new Promise(function (resolver) {
      var t = setTimeout(function () { resolver(false); }, ESPERA_MAX_MS);
      promesa.then(function (v) { clearTimeout(t); resolver(v); }, function () { clearTimeout(t); resolver(false); });
    });
  }

  async function pedirAlEntrar() {
    var salida = { conPermiso: [], sinPermiso: [] };
    /* Con `auto=1` de la copia de pruebas no hay pulsación en «Entrar»: no se pide nada. */
    if (window.Demo && Demo.sinPulsacion && Demo.sinPulsacion()) return salida;
    var omitidas = (window.ComprobacionEntrada && ComprobacionEntrada.leerOmitidas) ? ComprobacionEntrada.leerOmitidas() : [];
    var pendientes = [];
    for (var i = 0; i < LISTA.length; i++) {
      var item = LISTA[i];
      if (omitidas.indexOf(item.id) !== -1) continue;
      if (item.noSePide && item.noSePide()) continue;
      var dir = await carpetaDe(item);
      if (!dir) continue;
      if (await mirar(item, dir)) { salida.conPermiso.push(item.id); continue; }
      pendientes.push({ item: item, dir: dir });
    }
    /* Todas seguidas, sin esperar la respuesta de una para lanzar la siguiente: la pulsación que
       permite pedir un permiso caduca a los pocos segundos. Después se esperan juntas. */
    var respuestas = await Promise.all(pendientes.map(function (p) { return conTiempo(pedirA(p.item, p.dir)); }));
    pendientes.forEach(function (p, i) { (respuestas[i] ? salida.conPermiso : salida.sinPermiso).push(p.item.id); });
    return salida;
  }

  window.PermisosCarpetas = { estado: estado, pedir: pedir, pedirAlEntrar: pedirAlEntrar, ids: function () { return LISTA.map(function (x) { return x.id; }); } };
})();
