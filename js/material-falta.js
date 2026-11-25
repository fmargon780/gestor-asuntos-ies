/* ============================================================
   material-falta.js — la pestaña «Lo que falta» de «Material» (fila 750,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 1): apuntar lo que hace falta
   (buscador de artículos, «Para», cantidad), y la tabla de lo apuntado.
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }

  var marcadas = [];
  var CLAVE_PARA = 'gestor.material.para';

  function paraRecordado() {
    try { return localStorage.getItem(CLAVE_PARA) || ''; } catch (e) { return ''; }
  }
  function recordarPara(v) {
    try { localStorage.setItem(CLAVE_PARA, v); } catch (e) { /* sin recordar */ }
  }

  /* 25-nov-2026 → «25-nov-2026» */
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaCorta(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? parseInt(m[3], 10) + '-' + MESES[parseInt(m[2], 10) - 1] + '-' + m[1] : '';
  }

  function pintar(caja, estado) {
    var cat = estado.cat, falta = estado.falta;
    marcadas = marcadas.filter(function (id) { return falta.lineas.some(function (l) { return l.id === id; }); });
    var para = paraRecordado();
    var destinos = Material.destinosDe(falta);
    if (destinos.indexOf(para) === -1) para = destinos[0];

    var acciones = Material.accionesDeFalta.map(function (a) {
      return '<button type="button" class="boton' + (a.principal ? ' boton-principal' : '') + '" data-accion="' + esc(a.id) + '"' +
        (marcadas.length ? '' : ' disabled') + '>' + esc(a.texto) + (marcadas.length ? ' (' + marcadas.length + ')' : '') + '…</button>';
    }).join('');

    caja.innerHTML = '<p class="explica">Lo que hace falta en la oficina. Lo apuntáis los dos; se queda aquí hasta que se pida.</p>' +
      '<div class="material-apuntar"><input type="text" id="material-busca" class="campo" autocomplete="off" ' +
        'placeholder="Apuntar: escribe qué hace falta (papel A4, sobres, tóner…)">' +
        '<select id="material-para" class="campo" title="Para quién">' + destinos.map(function (d) {
          return '<option value="' + esc(d) + '"' + (d === para ? ' selected' : '') + '>' + esc(d) + '</option>';
        }).join('') + '<option value="__nuevo">+ Nuevo…</option></select>' +
        '<input type="number" id="material-cant" class="campo" min="1" step="1" value="1" title="Cantidad">' +
        '<button type="button" class="boton boton-principal" id="material-apuntar" disabled>Apuntar</button>' +
        '<div id="material-sug" class="material-sug oculto" role="listbox"></div></div>' +
      '<div class="material-acciones">' + acciones + '<button type="button" class="boton" id="material-quitar"' +
        (marcadas.length ? '' : ' disabled') + '>Quitar de la lista</button></div>' +
      (falta.lineas.length ? tabla(cat, falta) : '<p class="explica">No falta nada.</p>');
    enganchar(caja);
  }

  function tabla(cat, falta) {
    var filas = falta.lineas.map(function (l) {
      var a = Material.articuloDe(cat, l.a), c = a && Material.categoriaDe(cat, a.cat);
      var m = Material.mejorPrecio(l.a);
      return '<tr class="' + (marcadas.indexOf(l.id) !== -1 ? 'elegida' : '') + '"><td><input type="checkbox" data-marca="' + esc(l.id) + '"' +
        (marcadas.indexOf(l.id) !== -1 ? ' checked' : '') + ' aria-label="Marcar"></td>' +
        '<td>' + esc(a ? Material.nombreDe(cat, a) : '(artículo que ya no está)') + '</td>' +
        '<td>' + (c ? '<span class="material-chip">' + esc(c.nombre) + '</span>' : '') + '</td>' +
        '<td>' + esc(l.para) + '</td>' +
        '<td class="material-num"><input type="number" class="campo material-cantidad" min="1" step="1" value="' + l.c + '" data-cant="' + esc(l.id) + '"> ' + esc(a ? a.u : '') + '</td>' +
        '<td>' + (m ? esc(m.texto) : '') + '</td>' +
        '<td>' + esc(l.q) + '</td><td class="material-cuando">' + esc(fechaCorta(l.f)) + '</td></tr>';
    }).join('');
    return '<table class="material-tabla"><thead><tr><th><input type="checkbox" id="material-todas"' +
      (marcadas.length && marcadas.length === falta.lineas.length ? ' checked' : '') + ' aria-label="Marcar todas"></th>' +
      '<th>Artículo</th><th>Categoría</th><th>Para</th><th>Cantidad</th><th>Mejor precio de los últimos seis meses (sin IVA)</th>' +
      '<th>Apuntado por</th><th>Cuándo</th></tr></thead><tbody>' + filas + '</tbody></table>';
  }

  function enganchar(caja) {
    var elegido = null;           /* el artículo que se va a apuntar */
    var activa = -1;              /* sugerencia resaltada con las flechas */
    var sugeridos = [];
    var busca = $('material-busca'), sug = $('material-sug'), cant = $('material-cant'), boton = $('material-apuntar');

    function cerrarSug() { sug.classList.add('oculto'); sug.innerHTML = ''; activa = -1; }

    function elegir(a) {
      elegido = a;
      busca.value = Material.nombreDe(Material.estado.cat, a);
      boton.disabled = false;
      cerrarSug();
      cant.focus(); cant.select();
    }

    function nuevoArticulo() {
      var escrito = busca.value.trim();
      cerrarSug();
      Material.altaArticulo({ cat: '', inicial: escrito }).then(function (a) { if (a) elegir(a); });
    }

    function resaltar() {
      Array.prototype.forEach.call(sug.children, function (d, i) { d.classList.toggle('activa', i === activa); });
    }

    function mostrarSug() {
      elegido = null; boton.disabled = true;
      var escrito = busca.value;
      if (!escrito.trim()) { cerrarSug(); return; }
      var cat = Material.estado.cat;
      sugeridos = Material.buscar(cat, escrito, 8);
      sug.innerHTML = sugeridos.map(function (a, i) {
        return '<div class="material-sug-fila" role="option" data-i="' + i + '">' + esc(Material.nombreDe(cat, a)) +
          ' <span class="suave">· ' + esc(a.u) + '</span></div>';
      }).join('') + '<div class="material-sug-fila material-sug-nuevo" data-nuevo="1">+ Nuevo artículo…</div>';
      sug.classList.remove('oculto');
      activa = sugeridos.length ? 0 : sugeridos.length;   /* sin coincidencias, resalta «+ Nuevo artículo…» */
      resaltar();
      Array.prototype.forEach.call(sug.children, function (d) {
        d.onmousedown = function (ev) {
          ev.preventDefault();
          if (d.getAttribute('data-nuevo')) nuevoArticulo(); else elegir(sugeridos[parseInt(d.getAttribute('data-i'), 10)]);
        };
      });
    }

    busca.oninput = mostrarSug;
    busca.onblur = function () { setTimeout(cerrarSug, 120); };
    busca.onkeydown = function (ev) {
      if (sug.classList.contains('oculto')) return;
      var total = sugeridos.length + 1;
      if (ev.key === 'ArrowDown') { activa = (activa + 1) % total; resaltar(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { activa = (activa - 1 + total) % total; resaltar(); ev.preventDefault(); }
      else if (ev.key === 'Escape') { cerrarSug(); }
      else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (activa >= 0 && activa < sugeridos.length) elegir(sugeridos[activa]); else nuevoArticulo();
      }
    };

    $('material-para').onchange = function () {
      var sel = $('material-para');
      if (sel.value === '__nuevo') { sel.value = paraRecordado() || sel.options[0].value; nuevoDestino(); }
      else recordarPara(sel.value);
    };

    async function apuntar() {
      if (!elegido) return;
      var datos = { a: elegido.id, c: parseFloat(cant.value), para: $('material-para').value, q: Material.quienSoy(), f: Material.hoyIso() };
      var r;
      try { r = await Material.cambiarFalta(function (d) { return Material.apuntar(d, datos); }); }
      catch (e) { U.fallo('No he podido apuntarlo', e); return; }
      if (!r.ok) { U.aviso(r.error, 'ambar'); return; }
      recordarPara(datos.para);
      var u = elegido.u;
      if (r.suma) U.aviso('Ya estaba apuntado para ' + datos.para + ': ahora ' + r.linea.c + ' × ' + u + '.');
      else U.aviso('Apuntado: ' + datos.c + ' × ' + u + ' para ' + datos.para + '.');
      await Material.recargar();
      var b = $('material-busca'); if (b) b.focus();
    }
    boton.onclick = apuntar;
    cant.onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); apuntar(); } };

    Array.prototype.forEach.call(caja.querySelectorAll('[data-marca]'), function (c) {
      c.onchange = function () {
        var id = c.getAttribute('data-marca');
        marcadas = marcadas.filter(function (x) { return x !== id; }).concat(c.checked ? [id] : []);
        Material.irA('falta');
      };
    });
    if ($('material-todas')) $('material-todas').onchange = function () {
      marcadas = this.checked ? Material.estado.falta.lineas.map(function (l) { return l.id; }) : [];
      Material.irA('falta');
    };
    Array.prototype.forEach.call(caja.querySelectorAll('[data-cant]'), function (i) {
      i.onchange = async function () {
        var id = i.getAttribute('data-cant'), v = parseFloat(i.value);
        if (!(v > 0)) { U.aviso('Escribe una cantidad mayor que cero.', 'ambar'); await Material.recargar(); return; }
        try { await Material.cambiarFalta(function (d) { return Material.ponerCantidad(d, id, v) ? { ok: true } : { ok: false }; }); }
        catch (e) { U.fallo('No he podido cambiar la cantidad', e); }
        await Material.recargar();
      };
    });
    $('material-quitar').onclick = async function () {
      var ids = marcadas.slice();
      if (!ids.length) return;
      try { await Material.cambiarFalta(function (d) { Material.quitar(d, ids); return { ok: true }; }); }
      catch (e) { U.fallo('No he podido quitarlo', e); return; }
      marcadas = [];
      U.aviso(ids.length === 1 ? 'Quitada 1 línea de la lista.' : 'Quitadas ' + ids.length + ' líneas de la lista.');
      await Material.recargar();
    };
    Array.prototype.forEach.call(caja.querySelectorAll('[data-accion]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-accion');
        var a = Material.accionesDeFalta.filter(function (x) { return x.id === id; })[0];
        if (a) a.alPulsar(Material.estado.falta.lineas.filter(function (l) { return marcadas.indexOf(l.id) !== -1; }));
      };
    });
  }

  /* «+ Nuevo…» en «Para»: un cuadro para escribir el nombre. */
  async function nuevoDestino() {
    var elegido = '';
    var ok = await Material.cuadro('Nuevo destino', '<div class="material-fila-campo"><label for="material-nd">Nombre</label>' +
      '<input type="text" id="material-nd" class="campo" autocomplete="off" placeholder="Departamento de Lengua"></div>', 'Guardar',
      function () { $('material-nd').focus(); },
      async function () {
        var nombre = $('material-nd').value;
        var r = await Material.cambiarFalta(function (d) { return Material.anadirDestino(d, nombre); });
        if (!r.ok) return r.error;
        elegido = r.destino;
        return '';
      });
    if (ok && elegido) { recordarPara(elegido); await Material.recargar(); }
  }

  Material.registrarPestana({
    id: 'falta', titulo: 'Lo que falta', orden: 10,
    cuenta: function (estado) { return estado.falta.lineas.length; },
    pintar: pintar
  });
})();
