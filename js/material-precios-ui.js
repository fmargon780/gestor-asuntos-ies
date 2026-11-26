/* ============================================================
   material-precios-ui.js — la tabla de precios del artículo elegido del catálogo y el cuadro «+ Añadir precio»
   (fila 751, docs/583-COMPRAS-DE-MATERIAL.md, parte 2).

   Un renglón por proveedor (el último precio de cada uno), de barato a caro: Proveedor, Precio, Fecha, De dónde.
   El más barato de los últimos seis meses, en verde; los de más de seis meses, en gris (se ven, pero no cuentan).
   Si el precio viene de un presupuesto, el documento se abre al pulsar el renglón.

   El cuadro de añadir precio se vuelve a abrir (con lo escrito) cuando hay que dar de alta una empresa o elegir el
   documento del presupuesto: nunca dos cuadros a la vez.
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }

  var ORIGENES = ['Llamada', 'Correo', 'Presupuesto'];

  /* ---------- abrir el documento de un precio ---------- */

  async function abrirDocumento(d) {
    try {
      var ficha = ((App.E.registro && App.E.registro.asuntos) || {})[d.asunto];
      if (!ficha) throw new Error('El asunto «' + d.asunto + '» ya no está.');
      var carpeta = await ElegirAsunto.carpetaDelAsunto(d.asunto, ficha);
      var f = await (await carpeta.getFileHandle(d.doc)).getFile();
      if (window.Lector) Lector.abrir({ titulo: d.doc, pie: d.asunto, blob: f });
    } catch (e) { U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(e), 'ambar'); }
  }

  /* ---------- la tabla del artículo ---------- */

  function tablaDePrecios(a) {
    var filas = Material.renglones(a.id);
    if (!filas.length) return '<p class="explica">Ningún proveedor tiene precio de este artículo. Apunta el primero.</p>';
    return '<table class="material-tabla material-precios-tabla"><thead><tr><th>Proveedor</th><th>Precio sin IVA</th><th>Fecha</th><th>De dónde</th></tr></thead><tbody>' +
      filas.map(function (r) {
        var clase = r.mejor ? 'material-precio-mejor' : (r.reciente ? '' : 'material-precio-viejo');
        var de = r.d ? 'Presupuesto · ' + r.d.doc : r.o;
        return '<tr class="' + clase + (r.d ? ' material-precio-abre' : '') + '"' + (r.d ? ' data-asunto="' + esc(r.d.asunto) + '" data-doc="' + esc(r.d.doc) + '" title="Abrir el documento"' : '') + '>' +
          '<td>' + esc(r.proveedor) + '</td><td class="material-num">' + esc(Material.euros(r.i)) + '</td><td class="material-cuando">' +
          esc(Material.fechaCorta(r.f)) + '</td><td>' + esc(de) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="explica">En verde, el más barato de los últimos seis meses. En gris, precios de hace más de seis meses: se ven, pero no cuentan como «mejor precio».</p>';
  }

  Material.alPintarCatalogo = function (caja, artId) {
    var sitio = $('material-precios');
    if (!sitio) return;
    var a = Material.articuloDe(Material.estado.cat, artId);
    if (!a) return;
    sitio.innerHTML = '<h4>Precios de los proveedores</h4>' + tablaDePrecios(a) +
      '<p><button type="button" class="boton" id="material-precio-nuevo">+ Añadir precio</button></p>';
    $('material-precio-nuevo').onclick = function () { anadirPrecio(a.id, {}); };
    Array.prototype.forEach.call(sitio.querySelectorAll('.material-precio-abre'), function (f) {
      f.onclick = function () { abrirDocumento({ asunto: f.getAttribute('data-asunto'), doc: f.getAttribute('data-doc') }); };
    });
  };

  /* ---------- elegir el documento del presupuesto ---------- */

  /* Devuelve { asunto, doc } o null. Dos pasos: el asunto y su documento (cada uno en su cuadro, uno detrás de otro). */
  async function elegirDocumento() {
    var asunto, nombres;
    for (;;) {
      asunto = await ElegirAsunto.elegir({ titulo: 'Presupuesto: ¿en qué asunto está?' });
      if (!asunto) return null;
      try {
        var carpeta = await ElegirAsunto.carpetaDelAsunto(asunto.nombre, asunto.ficha);
        nombres = (await Carpetas.ficheros(carpeta)).map(function (f) { return f.nombre; });
      } catch (e) { U.aviso('No he podido ver la carpeta de ese asunto: ' + U.mensajeDeError(e), 'ambar'); continue; }
      if (nombres.length) break;
      U.aviso('Ese asunto no tiene documentos en su carpeta: elige otro.', 'ambar');   /* y se vuelve a elegir */
    }
    var elegido = nombres[0];
    var ok = await Material.cuadro('Presupuesto: ¿qué documento?', '<p class="explica">' + esc(asunto.nombre) + '</p>' +
      '<div class="material-fila-campo"><label for="material-pdoc-sel">Documento</label><select id="material-pdoc-sel" class="campo">' +
      nombres.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('') + '</select></div>', 'Elegir',
      function () { $('material-pdoc-sel').focus(); },
      function () { elegido = $('material-pdoc-sel').value; return ''; });
    return ok ? { asunto: asunto.nombre, doc: elegido } : null;
  }

  /* ---------- «+ Añadir precio» ---------- */

  /* `ini`: lo ya escrito ({ prov, i, f, o, d }). Para «Proveedor» ya elegido (parte 3), `ini.prov` y `ini.fijo`. */
  async function anadirPrecio(artId, ini) {
    var est = { prov: ini.prov || '', i: ini.i || '', f: ini.f || Material.hoyIso(), o: ini.o || 'Llamada', d: ini.d || null };
    for (;;) {
      var senal = '', guardado = null;
      var cat = Material.estado.cat, a = Material.articuloDe(cat, artId);
      var empresas = Material.estado.empresas || [];
      var cuerpo = '<p class="explica"><b>' + esc(a ? Material.nombreDe(cat, a) : '') + '</b></p>' +
        '<div class="material-fila-campo"><label for="material-pp">Proveedor</label><select id="material-pp" class="campo"' + (ini.fijo ? ' disabled' : '') + '>' +
        '<option value="">Elige el proveedor…</option>' + empresas.map(function (e) {
          return '<option value="' + esc(e.nombre) + '"' + (e.nombre === est.prov ? ' selected' : '') + '>' + esc(e.nombre) + '</option>';
        }).join('') + (ini.fijo ? '' : '<option value="__nueva">+ Nueva empresa…</option>') + '</select></div>' +
        '<div class="material-fila-campo"><label for="material-pi">Precio sin IVA (€)</label><input type="text" id="material-pi" class="campo" inputmode="decimal" autocomplete="off" value="' + esc(est.i) + '"></div>' +
        '<div class="material-fila-campo"><label for="material-pf">Fecha</label><input type="date" id="material-pf" class="campo" value="' + esc(est.f) + '"></div>' +
        '<div class="material-fila-campo"><label for="material-po">De dónde sale</label><select id="material-po" class="campo">' + ORIGENES.map(function (o) {
          return '<option' + (o === est.o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
        '<div class="material-fila-campo' + (est.o === 'Presupuesto' ? '' : ' oculto') + '" id="material-pd"><label>Documento</label><span>' +
        (est.d ? esc(est.d.doc) + ' <span class="suave">· ' + esc(est.d.asunto) + '</span> ' : '') +
        '<button type="button" class="boton" id="material-pdoc">' + (est.d ? 'Cambiar' : 'Elegir el documento…') + '</button></span></div>' +
        '<p class="explica">Siempre sin IVA. Un precio del mismo proveedor y del mismo día sustituye al anterior.</p>';
      var leer = function () {
        est.prov = $('material-pp').value === '__nueva' ? est.prov : $('material-pp').value;
        est.i = $('material-pi').value; est.f = $('material-pf').value; est.o = $('material-po').value;
      };
      var abrir = function () {
        $('material-pp').onchange = function () { if ($('material-pp').value === '__nueva') { leer(); senal = 'nueva'; Material.cancelarCuadro(); } };
        $('material-po').onchange = function () { $('material-pd').classList.toggle('oculto', $('material-po').value !== 'Presupuesto'); };
        $('material-pdoc').onclick = function () { leer(); senal = 'doc'; Material.cancelarCuadro(); };
        (est.prov ? $('material-pi') : $('material-pp')).focus();
      };
      var ok = await Material.cuadro('Añadir precio', cuerpo, 'Guardar', abrir, async function () {
        leer();
        var dato = { a: artId, p: est.prov, i: parseFloat(String(est.i).replace(',', '.')), f: est.f, o: est.o, d: est.o === 'Presupuesto' ? est.d : null };
        var r = await Material.cambiarPrecios(function (d) { return Material.anadirPrecio(d, dato); });
        if (!r.ok) return r.error;
        guardado = { proveedor: est.prov, sustituye: r.sustituye };
        return '';
      });
      if (ok && guardado) {
        U.aviso(guardado.sustituye ? 'Precio de ' + guardado.proveedor + ' de ese día sustituido.' : 'Precio apuntado: ' + guardado.proveedor + '.');
        await Material.recargar();
        return true;
      }
      if (senal === 'nueva') {
        var antes = (Material.estado.empresas || []).map(function (e) { return e.nombre; });
        var alta = await window.RecurrenteTercero.darDeAlta('EMPRESAS', '');
        Material.estado.empresas = await Material.leerEmpresas();
        var nueva = Material.estado.empresas.filter(function (e) { return antes.indexOf(e.nombre) === -1; })[0];
        if (alta && nueva) est.prov = nueva.nombre;
        continue;
      }
      if (senal === 'doc') {
        var d = await elegirDocumento();
        if (d) est.d = d;
        continue;
      }
      return false;
    }
  }
  Material.anadirPrecioDialogo = anadirPrecio;

  /* Fila 752 (parte 3) pedirá precios con el mismo cuadro y el proveedor ya puesto: `anadirPrecioDialogo(art, { prov, fijo: true })`. */
})();
