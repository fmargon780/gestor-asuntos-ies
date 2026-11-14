/* ============================================================
   sitios-ventana.js — la ventana «Sitios: dónde se hacen las tareas»
   (fila 659, docs/659-DONDE-SE-HACE-Y-NOMBRES.md; pantalla de prueba docs/pantallas/650.html).

   A la izquierda, el mapa: cada sitio con sus zonas y cuántas tareas usan cada uno. A la derecha,
   lo que se hace con el que se pulsa: «Usar … en la tarea» (solo si se abre desde una tarea),
   cambiarle el nombre (cambia en todas las tareas: van por `id`) o borrarlo («Pasar y borrar» si
   alguna tarea lo usa). «+ Sitio nuevo»: un sitio o una zona de uno que existe; si se parece a uno
   que hay, avisa con «Ir a ese». No hay «Otro sitio».

   Se abre con `SitiosVentana.abrir({ alElegir(donde), alCerrar() })`: desde «Ver todos los sitios…» de una
   tarea (con `alElegir`) o desde Ajustes → El centro → «Sitios» (sin nada). Lo guardado, en
   js/sitios-guardado.js; el bloque de Ajustes, en js/sitios-ajustes.js.
   ============================================================ */
var SitiosVentana = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function pl(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function tareas(n) { return pl(n, 'tarea', 'tareas'); }

  async function abrir(o) {
    o = o || {};
    var S = { sel: null, modo: '', cuentas: {}, aviso: '' };
    var capa = document.createElement('div');
    capa.className = 'capa capa-campos sitios-capa';
    capa.innerHTML = '<div class="cuadro sitios-cuadro" role="dialog" aria-modal="true" aria-label="Sitios: dónde se hacen las tareas" style="max-width:860px;width:100%">' +
      '<h3>Sitios: dónde se hacen las tareas</h3>' +
      '<div class="sitios-cuerpo" style="display:flex;gap:16px;flex-wrap:wrap;overflow:auto"><div id="sv-mapa" style="flex:1 1 260px"></div><div id="sv-panel" style="flex:2 1 320px"></div></div>' +
      '<div class="cuadro-botones"><button type="button" class="boton" id="sv-cerrar">Cerrar</button></div></div>';
    document.body.appendChild(capa);
    var previo = document.activeElement;
    function $(id) { return capa.querySelector('#' + id); }

    function cerrar() {
      document.removeEventListener('keydown', tecla, true);
      if (capa.parentNode) capa.parentNode.removeChild(capa);
      if (previo && previo.focus && document.contains(previo)) { try { previo.focus(); } catch (e) { /* sin foco */ } }
      if (o.alCerrar) o.alCerrar();
    }
    function tecla(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrar(); } }
    document.addEventListener('keydown', tecla, true);
    $('sv-cerrar').onclick = cerrar;

    function datos() { return Sitios.datos(); }
    function textoSel() { return S.sel ? Sitios.textoDe(datos(), S.sel.donde) : ''; }
    function nDe(donde) { return S.cuentas[donde.sitio + (donde.zona ? '|' + donde.zona : '')] || 0; }

    async function contar() {
      try { S.cuentas = Sitios.cuentas(await SitiosGuardado.lineasQueLoUsan()); }
      catch (e) { S.cuentas = {}; }
    }

    function pintarMapa() {
      var d = datos();
      $('sv-mapa').innerHTML = '<div class="sitios-titulo"><strong>Lo que hay</strong></div>' + d.sitios.map(function (s) {
        var act = S.modo === 'ver' && S.sel && S.sel.id === s.id;
        return '<button type="button" class="sitio sitios-sitio' + (act ? ' activo' : '') + '" data-id="' + esc(s.id) + '" style="display:flex;justify-content:space-between;width:100%;text-align:left"><span>' + esc(s.nombre) + '</span><span class="suave">' + esc(tareas(nDe({ sitio: s.id }))) + '</span></button>' +
          s.zonas.map(function (z) {
            var actz = S.modo === 'ver' && S.sel && S.sel.id === z.id;
            return '<button type="button" class="sitio zona sitios-zona' + (actz ? ' activo' : '') + '" data-id="' + esc(z.id) + '" data-sitio="' + esc(s.id) + '" style="display:flex;justify-content:space-between;width:100%;text-align:left;padding-left:22px"><span>' + esc(z.nombre) + '</span><span class="suave">' + esc(tareas(nDe({ sitio: s.id, zona: z.id }))) + '</span></button>';
          }).join('');
      }).join('') + '<div style="margin-top:10px"><button type="button" class="boton" id="sv-nuevo">+ Sitio nuevo</button></div>';
      Array.prototype.forEach.call(capa.querySelectorAll('#sv-mapa .sitio'), function (b) {
        b.onclick = function () {
          var s = b.dataset.sitio ? b.dataset.sitio : b.dataset.id;
          S.sel = { id: b.dataset.id, donde: b.dataset.sitio ? { sitio: s, zona: b.dataset.id } : { sitio: s } };
          S.modo = 'ver'; S.aviso = '';
          pintar();
        };
      });
      $('sv-nuevo').onclick = function () { S.modo = 'nuevo'; S.sel = null; pintar(); };
    }

    function pintarPanel() {
      var pn = $('sv-panel');
      if (S.modo === 'ver' && S.sel) return panelVer(pn);
      if (S.modo === 'nuevo') return panelNuevo(pn);
      pn.innerHTML = '<div class="suave sitios-vacio">Pulsa un sitio para ' + (o.alElegir ? 'usarlo en la tarea, ' : '') + 'cambiarle el nombre o borrarlo. Si no está el que buscas, «+ Sitio nuevo».</div>' + S.aviso;
    }

    function pintar() { pintarMapa(); pintarPanel(); }

    function panelVer(pn) {
      var d = datos(), donde = S.sel.donde, esZona = !!donde.zona;
      var s = d.sitios.filter(function (x) { return x.id === donde.sitio; })[0];
      if (!s) { S.modo = ''; S.sel = null; return pintar(); }
      var z = esZona ? s.zonas.filter(function (x) { return x.id === donde.zona; })[0] : null;
      if (esZona && !z) { S.modo = ''; S.sel = null; return pintar(); }
      var texto = Sitios.textoDe(d, donde), n = nDe(donde);
      pn.innerHTML = '<div><strong>' + (esZona ? 'Zona de ' + esc(s.nombre) : 'Sitio') + '</strong></div><div class="sitios-form" style="margin-top:8px">' +
        (o.alElegir ? '<p><button type="button" class="boton boton-principal" id="sv-usar">Usar «' + esc(texto) + '» en la tarea</button></p>' : '') +
        '<label class="et" for="sv-nombre">Nombre</label><div class="en-linea"><input id="sv-nombre" class="campo" value="' + esc(esZona ? z.nombre : s.nombre) + '"> <button type="button" class="boton" id="sv-guardar">Guardar el nombre</button></div>' +
        '<p class="explica">' + (n === 1 ? 'Lo usa ' : 'Lo usan ') + esc(tareas(n)) + (!esZona && s.zonas.length ? ', contando sus ' + s.zonas.length + ' zonas' : '') + '. Si cambias el nombre, cambia en todas.</p>' +
        '<p><button type="button" class="boton boton-peligro" id="sv-borrar">Borrar</button></p><div id="sv-aviso">' + S.aviso + '</div></div>';
      if (o.alElegir) $('sv-usar').onclick = function () { var f = o.alElegir; var dd = donde; cerrarSinAviso(); f(dd); };
      $('sv-guardar').onclick = async function () {
        var nombre = $('sv-nombre').value.trim();
        if (!nombre) { $('sv-aviso').innerHTML = '<div class="aviso aviso-ambar">Ponle un nombre.</div>'; return; }
        try {
          await SitiosGuardado.cambiar(function (x) { return Sitios.renombrar(x, esZona ? z.id : s.id, nombre); });
          S.aviso = '<div class="aviso aviso-bueno">Nombre cambiado en el sitio y en ' + esc(tareas(n)) + '.</div>';
          pintar();
        } catch (e) { U.fallo('No he podido guardar el nombre', e); }
      };
      $('sv-borrar').onclick = function () { preguntarBorrar(donde, texto, n); };
    }

    /* Borrar: si lo usa alguna tarea, antes se elige a qué sitio pasan. */
    function preguntarBorrar(donde, texto, n) {
      var d = datos(), av = $('sv-aviso');
      var fuera = Sitios.quitar(d, donde.zona || donde.sitio, null).quitados;
      var resto = Sitios.opciones(d).filter(function (x) { return fuera.indexOf(x.donde.zona || x.donde.sitio) === -1 && fuera.indexOf(x.donde.sitio) === -1; });
      av.innerHTML = '<div class="aviso aviso-ambar">' + (n
        ? '«' + esc(texto) + '» lo ' + (n === 1 ? 'usa ' : 'usan ') + esc(tareas(n)) + '. Para borrarlo, pásalas antes a: <select id="sv-destino" class="campo">' +
          resto.map(function (x, i) { return '<option value="' + i + '">' + esc(x.texto) + '</option>'; }).join('') + '<option value="-1">(sin sitio)</option></select>'
        : '¿Borrar «' + esc(texto) + '»? No lo usa ninguna tarea.') +
        '<div class="botones" style="margin-top:6px"><button type="button" class="boton boton-principal" id="sv-b-ok">' + (n ? 'Pasar y borrar' : 'Borrar') + '</button> <button type="button" class="boton" id="sv-b-no">Cancelar</button></div></div>';
      $('sv-b-no').onclick = function () { av.innerHTML = ''; };
      $('sv-b-ok').onclick = async function () {
        var destino = null;
        if (n) { var v = +$('sv-destino').value; destino = v >= 0 ? resto[v].donde : null; }
        try {
          var r = Sitios.quitar(datos(), donde.zona || donde.sitio, destino);
          if (n) await SitiosGuardado.reasignar(r.pasan);
          await SitiosGuardado.cambiar(function (x) { return Sitios.quitar(x, donde.zona || donde.sitio, destino).datos; });
          S.modo = ''; S.sel = null;
          S.aviso = '<div class="aviso aviso-bueno">«' + esc(texto) + '» borrado' + (n ? '; sus tareas pasan a «' + esc(destino ? Sitios.textoDe(datos(), destino) : 'sin sitio') + '».' : '.') + '</div>';
          await contar();
          pintar();
        } catch (e) { U.fallo('No he podido borrar el sitio', e); }
      };
    }

    function panelNuevo(pn) {
      var d = datos();
      pn.innerHTML = '<div><strong>Sitio nuevo</strong></div><div class="sitios-form" style="margin-top:8px">' +
        '<p><label><input type="radio" name="sv-tipo" value="sitio" checked> Es un sitio nuevo</label></p>' +
        '<p><label><input type="radio" name="sv-tipo" value="zona"> Es una zona de un sitio que ya existe:</label> <select id="sv-padre" class="campo">' +
          d.sitios.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.nombre) + '</option>'; }).join('') + '</select></p>' +
        '<label class="et" for="sv-nn">Nombre</label><input id="sv-nn" class="campo" placeholder="Por ejemplo: Sede electrónica">' +
        '<div id="sv-aviso"></div><p style="margin-top:8px"><button type="button" class="boton boton-principal" id="sv-crear">Crear</button> <button type="button" class="boton" id="sv-n-no">Cancelar</button></p>' +
        (o.alElegir ? '<p class="explica">Al crearlo queda elegido en la tarea.</p>' : '') + '</div>';
      $('sv-padre').onchange = function () { pn.querySelector('input[value="zona"]').checked = true; };
      $('sv-n-no').onclick = function () { S.modo = ''; pintar(); };
      async function crear(forzar) {
        var nombre = $('sv-nn').value.trim();
        if (!nombre) { $('sv-aviso').innerHTML = '<div class="aviso aviso-ambar">Escribe el nombre.</div>'; return; }
        var par = Sitios.parecidos(datos(), nombre)[0];
        if (par && !forzar) {
          $('sv-aviso').innerHTML = '<div class="aviso aviso-ambar">Se parece a <b>«' + esc(par.texto) + '»</b>, que ya existe.<div class="botones" style="margin-top:6px"><button type="button" class="boton boton-principal" id="sv-ir">Ir a ese</button> <button type="button" class="boton" id="sv-igual">Crear el mío igualmente</button></div></div>';
          $('sv-ir').onclick = function () { S.sel = { id: par.donde.zona || par.donde.sitio, donde: par.donde }; S.modo = 'ver'; S.aviso = ''; pintar(); };
          $('sv-igual').onclick = function () { crear(true); };
          return;
        }
        var esZona = pn.querySelector('input[name="sv-tipo"]:checked').value === 'zona';
        var nuevo = null;
        try {
          await SitiosGuardado.cambiar(function (x) {
            var r = Sitios.anadir(x, nombre, esZona ? $('sv-padre').value : '');
            nuevo = r.donde;
            return r.datos;
          });
        } catch (e) { U.fallo('No he podido crear el sitio', e); return; }
        if (o.alElegir && nuevo) { var f = o.alElegir; cerrarSinAviso(); f(nuevo); U.aviso('Sitio «' + Sitios.textoDe(datos(), nuevo) + '» creado y elegido en la tarea.', 'bueno'); return; }
        S.sel = { id: nuevo.zona || nuevo.sitio, donde: nuevo }; S.modo = 'ver';
        S.aviso = '<div class="aviso aviso-bueno">Sitio «' + esc(Sitios.textoDe(datos(), nuevo)) + '» creado.</div>';
        await contar();
        pintar();
      }
      $('sv-crear').onclick = function () { crear(false); };
      $('sv-nn').focus();
    }

    /* Se cierra sin avisar a `alCerrar` (ya se ha elegido algo, y quien llama lo pone al día). */
    function cerrarSinAviso() { var f = o.alCerrar; o.alCerrar = null; cerrar(); if (f) f(); }

    try { await SitiosGuardado.cargar(true); } catch (e) { /* con la lista que haya */ }
    await contar();
    pintar();
    return { cerrar: cerrar };
  }

  /* Ajustes → El centro → «Sitios»: el botón abre la ventana sin más. */
  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#sitios-abrir') : null;
    if (b) abrir();
  });

  return { abrir: abrir };
})();
window.SitiosVentana = SitiosVentana;
