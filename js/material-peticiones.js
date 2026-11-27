/* ============================================================
   material-peticiones.js — «Pedir precios de lo marcado…» en «Lo que falta» de «Material» (fila 753,
   docs/583-COMPRAS-DE-MATERIAL.md, parte 4).

   Un cuadro con los proveedores (cada uno con su correo y una casilla; sin correo no se puede marcar) y, a la derecha,
   el correo tal como saldrá. «Enviar N correos» manda uno a cada proveedor marcado, desde la cuenta de Administración,
   por el envío de siempre de la app (`CorreoEnviar.enviar`). Cada correo que sale se apunta en `material-precios.json`
   (`peticiones`), y la línea pedida enseña en «Mejor precio» «precios pedidos el <fecha> a N proveedores».
   Las respuestas se apuntan como en la parte 2 (catálogo) o desde el cuadro «Pedir» (parte 3).

   La lógica (`textoPeticion`, `correosDe`, `anotarPeticiones`, `peticionDe`) es pura, sin DOM ni disco: se comprueba sin
   navegador en pruebas/material-peticiones.mjs.
   ============================================================ */
(function () {

  var esc = function (s) { return U.escapar(s); };
  function $(id) { return document.getElementById(id); }
  function texto(v) { return String(v == null ? '' : v).trim(); }
  function lista(v) { return Array.isArray(v) ? v : []; }
  function idNuevo() { return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- lo puro ---------- */

  /* El correo de la petición. `lineas`: [{ nombre, c, u }]. */
  function textoPeticion(centro, lineas) {
    var asunto = 'Petición de precios · ' + texto(centro);
    var cuerpo = 'Buenos días:\n\nLes rogamos nos indiquen precio sin IVA y plazo de entrega de:\n\n' +
      lista(lineas).map(function (l) { return '- ' + l.nombre + ': ' + l.c + ' × ' + l.u; }).join('\n') +
      '\n\nUn saludo.\nAdministración';
    return { asunto: asunto, cuerpo: cuerpo };
  }

  /* Las direcciones de un campo «Correo» (puede traer varias, separadas por coma, punto y coma o espacio). */
  function correosDe(campo) {
    var vistos = {}, salida = [];
    String(campo || '').split(/[;,\s]+/).forEach(function (c) {
      c = c.trim();
      if (c.indexOf('@') > 0 && !vistos[c.toLowerCase()]) { vistos[c.toLowerCase()] = 1; salida.push(c); }
    });
    return salida;
  }

  /* Apunta que se pidieron precios de `articulos` a `proveedores` (los que ya recibieron el correo), en el mismo lote. */
  function anotarPeticiones(datos, o) {
    var lote = idNuevo(), n = 0;
    datos.peticiones = lista(datos.peticiones);
    lista(o.proveedores).forEach(function (p) {
      lista(o.articulos).forEach(function (a) {
        datos.peticiones.push({ id: idNuevo(), l: lote, a: a, p: p, f: o.f });
        n++;
      });
    });
    return { ok: true, lote: lote, n: n };
  }

  /* La última petición de un artículo: { f, n } (n = a cuántos proveedores se pidió en ese envío) o null. */
  function peticionDe(datos, articulo) {
    var suyas = lista(datos && datos.peticiones).filter(function (q) { return q.a === articulo; });
    if (!suyas.length) return null;
    var ultima = suyas[0];
    suyas.forEach(function (q) { if (q.f >= ultima.f) ultima = q; });
    var pedidos = {};
    suyas.forEach(function (q) { if (q.l === ultima.l) pedidos[q.p] = 1; });
    return { f: ultima.f, n: Object.keys(pedidos).length };
  }

  /* «precios pedidos el 26-nov-2026 a 2 proveedores» o ''. */
  function notaDePeticion(datos, articulo) {
    var q = peticionDe(datos, articulo);
    return q ? 'precios pedidos el ' + Material.fechaCorta(q.f) + ' a ' + q.n + ' proveedor' + (q.n === 1 ? '' : 'es') : '';
  }

  /* ---------- el cuadro ---------- */

  function nombreDelCentro() {
    return (window.Centro && Centro.datos && Centro.datos() && Centro.datos().centro) ||
      (window.Plantillas && Plantillas.POR_DEFECTO_CENTRO) || '';
  }

  function proveedoresDelCuadro() {
    var precios = Material.estado.precios || Material.normalizarPrecios(null);
    return Material.proveedoresDe(precios, Material.estado.empresas, Material.proveedoresConPedido());
  }

  function lineasParaCorreo(lineas) {
    var cat = Material.estado.cat;
    return lineas.map(function (l) {
      var a = Material.articuloDe(cat, l.a);
      return { a: l.a, nombre: a ? Material.nombreDe(cat, a) : '(artículo que ya no está)', c: l.c, u: a ? a.u : '' };
    });
  }

  async function pedirPrecios(lineas) {
    if (!lineas.length) return;
    var provs = proveedoresDelCuadro();
    var para = lineasParaCorreo(lineas);
    var t = textoPeticion(nombreDelCentro(), para);
    var marcados = {};
    var cuerpoHtml = function () {
      return '<p class="explica">Se manda un correo a cada proveedor marcado, desde la cuenta de Administración, con esta lista. ' +
        'Cuando contesten, escribes sus precios en el catálogo o en el cuadro «Pedir».</p>' +
        '<div class="material-peticion"><div class="material-peticion-provs">' + (provs.length ? provs.map(function (p, i) {
          var correos = correosDe(p.correo);
          return '<label class="material-peticion-prov' + (correos.length ? '' : ' sin-correo') + '">' +
            '<input type="checkbox" data-prov="' + i + '"' + (marcados[i] ? ' checked' : '') + (correos.length ? '' : ' disabled') + '> ' + esc(p.nombre) +
            '<br><small class="suave">' + (correos.length ? esc(correos.join(', ')) : 'sin correo: añádelo en Personas y empresas') + '</small></label>';
        }).join('') : '<p class="explica">Aún no hay proveedores: salen aquí cuando apuntas el primer precio en el catálogo.</p>') + '</div>' +
        '<div class="material-peticion-correo"><b>Asunto:</b> ' + esc(t.asunto) + '<br><br>' +
        'Buenos días:<br>Les rogamos nos indiquen precio sin IVA y plazo de entrega de:<ul>' + para.map(function (l) {
          return '<li>' + esc(l.nombre) + ': ' + l.c + ' × ' + esc(l.u) + '</li>';
        }).join('') + '</ul>Un saludo.<br>Administración</div></div>';
    };
    function elegidos() { return provs.filter(function (p, i) { return marcados[i]; }); }
    function ponerBoton() {
      var n = elegidos().length, b = $('cuadro-aceptar');
      if (!b) return;
      b.textContent = n ? 'Enviar ' + n + ' correo' + (n === 1 ? '' : 's') : 'Enviar';
      b.disabled = !n;
    }
    function engancharCasillas() {
      Array.prototype.forEach.call(document.querySelectorAll('#cuadro-cuerpo [data-prov]'), function (c) {
        c.onchange = function () { marcados[c.getAttribute('data-prov')] = c.checked; ponerBoton(); };
      });
    }

    var resultado = null;
    var ok = await Material.cuadro('Pedir precios', cuerpoHtml(), 'Enviar',
      function () { engancharCasillas(); ponerBoton(); },
      async function () {
        var quienes = elegidos();
        if (!quienes.length) return 'Marca al menos un proveedor.';
        if (window.CorreoEnviar && CorreoEnviar.tieneConexion && !CorreoEnviar.tieneConexion()) {
          return 'No hay ninguna dirección de envío conectada: se conecta en Ajustes › Enviar correo.';
        }
        resultado = { enviados: [], fallos: [], demo: false };
        for (var i = 0; i < quienes.length; i++) {
          var p = quienes[i];
          try {
            var r = await CorreoEnviar.enviar({
              para: correosDe(p.correo).join(', '), cco: '', asunto: t.asunto, cuerpo: t.cuerpo, hilo: '', adjuntos: [],
              idEnvio: CorreoEnviar.nuevoIdEnvio()
            });
            if (!r || !r.ok) throw new Error((r && r.motivo) || 'El envío no ha salido bien.');
            if (r.demo) resultado.demo = true;
            resultado.enviados.push(p.nombre);
          } catch (e) {
            resultado.fallos.push(p.nombre + ': ' + U.mensajeDeError(e));
          }
        }
        return '';
      });
    if (!ok || !resultado) return;

    if (resultado.enviados.length) {
      try {
        var articulos = [];
        para.forEach(function (l) { if (articulos.indexOf(l.a) === -1) articulos.push(l.a); });
        await Material.cambiarPrecios(function (d) {
          return anotarPeticiones(d, { proveedores: resultado.enviados, articulos: articulos, f: Material.hoyIso() });
        });
      } catch (e) { U.accesorio('Enviados, pero no he podido apuntarlo en la lista', e); }
    }
    var n = resultado.enviados.length;
    if (n) U.aviso(n + ' correo' + (n === 1 ? '' : 's') + ' de petición de precios' + (resultado.demo ? ' (en la prueba no sale ninguno).' : ' enviado' + (n === 1 ? '' : 's') + '.'));
    if (resultado.fallos.length) U.aviso('No han salido ' + resultado.fallos.length + ': ' + resultado.fallos.join(' · '), 'ambar');
    await Material.recargar();
  }

  /* ---------- enganche con «Lo que falta» ---------- */

  Material.textoPeticion = textoPeticion;
  Material.correosDe = correosDe;
  Material.anotarPeticiones = anotarPeticiones;
  Material.peticionDe = peticionDe;
  Material.notaDePeticion = function (articulo) { return notaDePeticion(Material.estado.precios, articulo); };
  Material.pedirPrecios = pedirPrecios;
  Material.accionesDeFalta.push({ id: 'pedir-precios', texto: 'Pedir precios de lo marcado', alPulsar: pedirPrecios });
})();
