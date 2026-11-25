/* ============================================================
   material-pantalla.js — la pantalla «Material» (fila 750,
   docs/583-COMPRAS-DE-MATERIAL.md): entrada en el menú entre «Cuentas» y
   «Herramientas», y sus pestañas.

   Cada parte del tema añade la suya con `Material.registrarPestana`
   ({ id, titulo, orden, cuenta(estado), pintar(caja, estado) }); una
   pestaña que aún no está registrada no sale. Orden fijo del tema:
   Lo que falta (10) · Pedidos (20) · Catálogo (30) · Proveedores (40).

   `Material.estado` = { cat, falta }, lo último leído del disco.
   `Material.recargar()` lo vuelve a leer y repinta lo que se ve; todo
   guardado de las pestañas termina llamándola (el último repintado gana).
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  App.PANTALLAS.push('material');

  var pestanas = [];
  var activa = 'falta';
  var turno = 0;
  var construida = false;

  Material.estado = { cat: Material.normalizarCatalogo(null), falta: Material.normalizarFalta(null) };

  Material.registrarPestana = function (p) {
    pestanas = pestanas.filter(function (x) { return x.id !== p.id; }).concat([p])
      .sort(function (a, b) { return a.orden - b.orden; });
  };

  function construir() {
    if (construida) return;
    var contenido = document.querySelector('main.contenido');
    if (!contenido) return;
    var seccion = document.createElement('section');
    seccion.id = 'pantalla-material';
    seccion.className = 'pantalla oculto';
    seccion.innerHTML =
      '<header class="cabecera"><h2>Material</h2><div id="material-pestanas" class="material-pestanas" role="tablist"></div></header>' +
      '<div id="material-cuerpo"><div class="vacio">Cargando…</div></div>';
    contenido.appendChild(seccion);
    construida = true;
  }
  if (typeof document !== 'undefined' && document.querySelector) construir();

  function pintarPestanas() {
    var caja = $('material-pestanas');
    if (!caja) return;
    caja.innerHTML = pestanas.map(function (p) {
      return '<button type="button" class="material-pestana' + (p.id === activa ? ' activa' : '') + '" data-pestana="' +
        p.id + '" role="tab">' + U.escapar(p.titulo) + ' (' + p.cuenta(Material.estado) + ')</button>';
    }).join('');
    Array.prototype.forEach.call(caja.querySelectorAll('.material-pestana'), function (b) {
      b.onclick = function () { ir(b.getAttribute('data-pestana')); };
    });
  }

  function pintar() {
    if (!pestanas.length) return;
    if (!pestanas.some(function (p) { return p.id === activa; })) activa = pestanas[0].id;
    pintarPestanas();
    var p = pestanas.filter(function (x) { return x.id === activa; })[0];
    var caja = $('material-cuerpo');
    if (caja) p.pintar(caja, Material.estado);
  }

  function ir(id) { activa = id; pintar(); }

  async function recargar() {
    var mio = ++turno;
    try {
      var cat = await Material.leerCatalogo();
      var falta = await Material.leerFalta();
      if (mio !== turno) return;
      Material.estado = { cat: cat, falta: falta };
    } catch (e) {
      if (mio === turno) U.fallo('No he podido leer el material', e);
    }
    if (mio === turno) pintar();
  }
  Material.recargar = recargar;

  async function abrir(pestana) {
    construir();
    if (pestana) activa = pestana;
    App.ir('material');
    await recargar();
  }
  Material.abrir = abrir;
  Material.pestanaActiva = function () { return activa; };
  Material.irA = ir;

})();
