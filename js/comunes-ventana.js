/* ============================================================
   comunes-ventana.js — «+ Añadir tarea» y «+ Añadir hito»: la ventana con
   la lista común (fila 531, docs/531-TAREAS-E-HITOS-COMUNES.md, puntos 4 a 6;
   pantalla docs/pantallas/518.html, «En un asunto»).

   ComunesVentana.abrir({ clase: 'tarea' | 'hito', titulo, tipo, para: [{ valor, texto }],
                          alElegir(elegido, para) })

   Sale la lista con buscador y, en tareas, agrupada por lo que hacen; cada
   línea dice en cuántos tipos se usa. Abajo, «Para» (si hay más de una
   opción) y «+ Crear una tarea nueva» / «+ Crear un hito nuevo» (el
   formulario, en js/comunes-ventana-nuevo.js). Elegir una (o crearla) cierra
   la ventana y llama a `alElegir`: quien la abre pone la línea o el hito donde
   toca. Es una ventana propia (no un `U.preguntar`): se parece a la de
   elegir un campo (js/campos-elegir.js) y usa su mismo aspecto.
   ============================================================ */
var ComunesVentana = (function () {

  var abierta = null;
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function cerrar() {
    if (!abierta) return;
    var a = abierta;
    abierta = null;
    document.removeEventListener('keydown', a.tecla, true);
    if (a.capa.parentNode) a.capa.parentNode.removeChild(a.capa);
  }

  /* El nombre de la plantilla de una tarea, si se conoce. */
  function nombrePlantilla(t) {
    var id = t.receta && t.receta.plantilla;
    if (!id) return '';
    var d = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    var lista = d ? (t.accion === 'comunicar' ? d.lista : d.documentos) || [] : [];
    var p = lista.filter(function (x) { return x.id === id; })[0];
    return p ? p.nombre : '';
  }

  async function abrir(ctx) {
    cerrar();
    var tarea = ctx.clase === 'tarea';
    if (window.Plantillas && Plantillas.cargarReciente && window.App && App.E && App.E.gestor) {
      try { await Plantillas.cargarReciente(App.E.gestor); } catch (e) { /* sin plantillas, sin sus nombres */ }
    }
    var listas, uso;
    try {
      listas = await ComunesGuardado.leer();
      try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
      uso = Comunes.usos(GuiasDelCentro.todas());
    } catch (e) { U.fallo('No he podido leer la lista', e); return; }

    var st = ctx.estado || { q: '', f: null, modo: 'lista', nuevo: null, sel: 0, para: ctx.para && ctx.para.length ? ctx.para[0].valor : '',
      detras: ctx.detras && ctx.detras.length ? ctx.detras[ctx.detras.length - 1].valor : '' };   /* fila 553: «Va detrás de», por defecto el último */
    var capa = document.createElement('div');
    capa.className = 'capa capa-campos';
    capa.innerHTML = '<div class="cuadro cuadro-campos" role="dialog" aria-modal="true" aria-label="' + (tarea ? 'Tareas de la lista' : 'Hitos de la lista') + '"></div>';
    document.body.appendChild(capa);
    var cuadro = capa.firstChild;
    function tecla(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrar(); } }
    document.addEventListener('keydown', tecla, true);
    abierta = { capa: capa, tecla: tecla };
    capa.addEventListener('mousedown', function (ev) { if (ev.target === capa) cerrar(); });

    var lista = tarea ? listas.tareas : listas.hitos;
    var mapaUso = tarea ? uso.tareas : uso.hitos;
    function elegir(x) { cerrar(); ctx.alElegir(x, st.para, st.detras); }
    function tareasDe(h) { return (h.tareas || []).map(function (id) { var t = Comunes.buscar(listas.tareas, id); return t ? t.nombre : ''; }).filter(Boolean).join(' · '); }

    function fila(x) {
      var detalle = tarea ? (nombrePlantilla(x) ? 'Plantilla «' + nombrePlantilla(x) + '»' : '') : tareasDe(x);
      return '<button type="button" class="campos-fila-campo comunes-fila" data-id="' + esc(x.id) + '"><span class="campos-fila-nombre">' + esc(x.nombre) + '</span>' +
        '<span class="campos-fila-ej suave pequeno">' + esc(detalle) + '</span>' +
        '<span class="suave pequeno">' + esc(Comunes.textoUsos(mapaUso[x.id]).replace('todavía no se usa en ningún tipo', 'sin usar todavía')) + '</span></button>';
    }

    function pintar() {
      var q = U.normalizar(st.q || '');
      var visibles = lista.filter(function (x) { return (!q || U.normalizar(x.nombre).indexOf(q) !== -1) && (!tarea || st.f === null || x.accion === st.f); });
      var grupos = '';
      if (tarea && st.modo === 'lista') {
        grupos = '<div class="campos-elegir-grupos"><button type="button" class="campos-grupo' + (st.f === null ? ' on' : '') + '" data-f="*"><span>Todas</span><span>' + lista.length + '</span></button>' +
          Comunes.HACE.map(function (h) {
            return '<button type="button" class="campos-grupo' + (st.f === h.valor ? ' on' : '') + '" data-f="' + esc(h.valor) + '"><span>' + esc(h.texto) + '</span><span>' +
              lista.filter(function (x) { return x.accion === h.valor; }).length + '</span></button>';
          }).join('') + '</div>';
      }
      var centro = st.modo === 'nuevo' ? '<div id="cv-nuevo"></div>'
        : (visibles.length ? visibles.map(fila).join('') : '<p class="suave" style="margin:6px">No hay ' + (tarea ? 'ninguna tarea' : 'ningún hito') + ' así. Puedes crearlo abajo.</p>');
      cuadro.innerHTML =
        '<div class="campos-elegir-cab"><div class="campos-elegir-titulo"><h3>' + esc(ctx.titulo || (tarea ? 'Tareas de la lista' : 'Hitos de la lista')) + '</h3>' +
        '<button type="button" class="boton" id="cv-cerrar" style="margin-left:auto">Cerrar</button></div>' +
        (st.modo === 'lista' ? '<input type="search" id="cv-buscar" class="campo" placeholder="Buscar por nombre" aria-label="Buscar por nombre" autocomplete="off" value="' + esc(st.q) + '">' : '') + '</div>' +
        '<div class="campos-elegir-cuerpo"' + (grupos ? '' : ' style="grid-template-columns:minmax(0,1fr)"') + '>' + grupos + '<div class="campos-elegir-centro" id="cv-centro">' + centro + '</div></div>' +
        '<div class="campos-elegir-pie">' +
        (ctx.detras && ctx.detras.length ? '<span class="campos-elegir-para"><label class="suave pequeno" for="cv-detras">Va detrás de</label> <select id="cv-detras" class="campo">' +
          ctx.detras.map(function (o) { return '<option value="' + esc(o.valor) + '"' + (o.valor === st.detras ? ' selected' : '') + '>' + esc(o.texto) + '</option>'; }).join('') + '</select></span>' : '') +
        (ctx.para && ctx.para.length > 1 ? '<span class="campos-elegir-para"><label class="suave pequeno" for="cv-para">Para</label> <select id="cv-para" class="campo">' +
          ctx.para.map(function (o) { return '<option value="' + esc(o.valor) + '"' + (o.valor === st.para ? ' selected' : '') + '>' + esc(o.texto) + '</option>'; }).join('') + '</select></span>' : '<span></span>') +
        (st.modo === 'lista' ? '<button type="button" class="boton" id="cv-crear">+ Crear ' + (tarea ? 'una tarea nueva' : 'un hito nuevo') + '</button>' : '') + '</div>';

      cuadro.querySelector('#cv-cerrar').onclick = cerrar;
      var paraSel = cuadro.querySelector('#cv-para');
      if (paraSel) paraSel.onchange = function () { st.para = paraSel.value; };
      var detrasSel = cuadro.querySelector('#cv-detras');
      if (detrasSel) detrasSel.onchange = function () { st.detras = detrasSel.value; };
      var b = cuadro.querySelector('#cv-buscar');
      if (b) {
        b.oninput = function () { st.q = b.value; st.sel = 0; pintar(); var n = cuadro.querySelector('#cv-buscar'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
        b.onkeydown = function (ev) {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          if (visibles[0]) elegir(visibles[0]);
        };
        if (!pintar.enfocado) { b.focus(); pintar.enfocado = true; }
      }
      Array.prototype.forEach.call(cuadro.querySelectorAll('.comunes-fila'), function (x) {
        x.onclick = function () { elegir(Comunes.buscar(lista, x.getAttribute('data-id'))); };
      });
      Array.prototype.forEach.call(cuadro.querySelectorAll('[data-f]'), function (x) {
        x.onclick = function () { var v = x.getAttribute('data-f'); st.f = v === '*' ? null : v; pintar(); };
      });
      var crear = cuadro.querySelector('#cv-crear');
      if (crear) crear.onclick = function () {
        st.modo = 'nuevo';
        st.nuevo = tarea ? { nombre: st.q || '', accion: 'generar', plantilla: '', donde: window.Sitios ? Sitios.propuesto(Sitios.datos(), 'generar') || undefined : undefined } : { nombre: st.q || '', explicacion: '', tareas: [] };
        pintar();
      };
      if (st.modo === 'nuevo') {
        ComunesVentana.pintarNuevo(cuadro.querySelector('#cv-nuevo'), {
          clase: ctx.clase, st: st, listas: listas, tipo: ctx.tipo,
          volver: function () { st.modo = 'lista'; pintar(); },
          elegir: elegir, reabrir: function () { cerrar(); abrir(Object.assign({}, ctx, { estado: st })); }, cerrar: cerrar
        });
      }
    }
    pintar();
  }

  return { abrir: abrir, cerrar: cerrar, nombrePlantilla: nombrePlantilla };
})();
window.ComunesVentana = ComunesVentana;
