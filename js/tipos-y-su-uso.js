/* ============================================================
   tipos-y-su-uso.js — Herramientas → «Tipos y su uso» (fila 543,
   docs/543-TIPOS-Y-SU-USO.md, tema 540). HERRAMIENTA TEMPORAL de limpieza:
   se quita en la fila 545.

   Una tabla con todos los tipos (abiertos, archivados, último uso), su guía
   al pulsarlos, desactivar varios a la vez (los activos sin usar salen
   marcados) y activar uno. El envío a Claude está en js/tipos-y-su-uso-enviar.js.
   ============================================================ */
var TiposYSuUso = (function () {

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var st = { filtro: 'todos', texto: '', sel: '', marcas: {}, iniciado: false, mensaje: '', indice: [], leido: false };

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function pl(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function fechaLegible(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '-' + MESES[+m[2] - 1] + '-' + m[1] : '';
  }

  /* Una fila por tipo: { tipo, categoria, abiertos, archivados, uso, ultimo (ISO o ''), desactivado }. */
  function recoger() {
    var ab = {}, ar = {}, ult = {}, abiertos = {}, vistos = {};
    function ultimo(tipo, nombre, ficha) {
      var m = /^(\d{2})(\d{2})(\d{2})(\s|$)/.exec(nombre || '');
      var f = m ? '20' + m[1] + '-' + m[2] + '-' + m[3] : '';
      var c = ficha && ficha.cerradoEl ? String(ficha.cerradoEl).slice(0, 10) : '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(c) && c > f) f = c;
      if (f && f > (ult[tipo] || '')) ult[tipo] = f;
    }
    (App.E.listaAbiertos || []).forEach(function (a) {
      var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo);
      if (!tipo) return;
      abiertos[a.nombre] = true;
      ab[tipo] = (ab[tipo] || 0) + 1;
      ultimo(tipo, a.nombre, a.ficha);
    });
    var reg = (App.E.registro && App.E.registro.asuntos) || {};
    Object.keys(reg).forEach(function (nombre) {
      if (abiertos[nombre]) return;
      var tipo = (reg[nombre] || {}).tipo;
      if (!tipo) { var l = window.Nombres && Nombres.leer(nombre, App.E.tipos); tipo = l && l.tipo; }
      if (!tipo) return;
      vistos[nombre] = true;
      ar[tipo] = (ar[tipo] || 0) + 1;
      ultimo(tipo, nombre, reg[nombre]);
    });
    /* Fila 546: lo archivado vive en el índice del ARCHIVO (todos los cursos). */
    st.indice.forEach(function (e) {
      if (!e || !e.nombre || abiertos[e.nombre] || vistos[e.nombre]) return;
      var l = window.Nombres && Nombres.leer(e.nombre, App.E.tipos), tipo = (l && l.tipo) || e.tipo;
      if (!tipo) return;
      vistos[e.nombre] = true;
      ar[tipo] = (ar[tipo] || 0) + 1;
      var f = e.cerradoEl || e.fecha;
      ultimo(tipo, e.nombre, { cerradoEl: f });
    });
    return (App.E.tipos || []).map(function (t) {
      var a = ab[t.tipo] || 0, r = ar[t.tipo] || 0;
      return { tipo: t.tipo, categoria: t.categoria || '', abiertos: a, archivados: r, uso: a + r, ultimo: ult[t.tipo] || '', desactivado: !!t.desactivado };
    }).sort(function (x, y) { return (x.categoria + ' ' + x.tipo) < (y.categoria + ' ' + y.tipo) ? -1 : 1; });
  }

  function visibles(filas) {
    return filas.filter(function (f) {
      if (st.texto && norm(f.tipo).indexOf(norm(st.texto)) < 0) return false;
      if (st.filtro === 'sin') return f.uso === 0 && !f.desactivado;
      if (st.filtro === 'usados') return f.uso > 0 && !f.desactivado;
      if (st.filtro === 'apagados') return f.desactivado;
      return true;
    });
  }

  /* La guía de un tipo como hitos con sus tareas (las preguntas se cuentan aparte). */
  function guiaDe(tipo) {
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo)) || [];
    return pasos.map(function (p) {
      var tareas = (p.guion || []).filter(function (g) { return !g.pregunta; });
      return { titulo: p.titulo || '', tareas: tareas, preguntas: (p.guion || []).length - tareas.length, ramas: !!(p.opciones && p.opciones.length) };
    });
  }

  function pintarGuia(filas) {
    var caja = $('tu-guia');
    var f = filas.filter(function (x) { return x.tipo === st.sel; })[0];
    if (!f) { caja.innerHTML = '<p class="tu-suave">Pulsa un tipo para ver su guía.</p>'; return; }
    var g = guiaDe(f.tipo), n = g.reduce(function (s, h) { return s + h.tareas.length; }, 0);
    caja.innerHTML = '<h3>' + esc(f.tipo) + '</h3><div class="tu-suave">' + pl(g.length, 'hito', 'hitos') + ' · ' + pl(n, 'tarea', 'tareas') + ' · ' +
      (f.desactivado ? 'desactivado' : f.uso ? pl(f.uso, 'asunto', 'asuntos') : 'sin usar') + '</div>' +
      (g.length ? g.map(function (h) {
        return '<div class="tu-hito"><h4>' + esc(h.titulo) + '</h4><ul>' + h.tareas.map(function (t) {
          return '<li><span>' + esc(t.texto) + '</span><span class="tu-etq">' + esc(Comunes.textoDeHace(t.accion)) + '</span></li>';
        }).join('') + (h.preguntas ? '<li class="tu-suave">' + pl(h.preguntas, 'pregunta', 'preguntas') + '</li>' : '') +
          (h.ramas ? '<li class="tu-suave">Con preguntas y ramas</li>' : '') + '</ul></div>';
      }).join('') : '<p class="tu-suave">Este tipo no tiene guía.</p>') +
      '<button type="button" class="boton" id="tu-editar">Abrir en el editor de la guía</button>';
  }

  function pintar() {
    if (!$('tu-filas')) return;
    var filas = recoger();
    if (!st.iniciado && st.leido) {   /* de partida: marcados los activos sin usar, ya leído el ARCHIVO */
      st.iniciado = true;
      filas.forEach(function (f) { if (f.uso === 0 && !f.desactivado) st.marcas[f.tipo] = true; });
    }
    if (!st.sel && filas.length) st.sel = filas[0].tipo;
    function cuenta(fn) { return filas.filter(fn).length; }
    var sin = cuenta(function (f) { return f.uso === 0 && !f.desactivado; });
    $('tu-resumen').textContent = pl(filas.length, 'tipo', 'tipos') + ' · ' + pl(cuenta(function (f) { return !f.desactivado; }), 'activo', 'activos') + ' · ' + pl(sin, 'sin usar', 'sin usar');
    var ps = [['todos', 'Todos', filas.length], ['sin', 'Sin usar', sin], ['usados', 'Usados', cuenta(function (f) { return f.uso > 0 && !f.desactivado; })],
      ['apagados', 'Desactivados', cuenta(function (f) { return f.desactivado; })]];
    $('tu-pastillas').innerHTML = ps.map(function (p) {
      return '<button type="button" class="tu-pastilla' + (st.filtro === p[0] ? ' on' : '') + '" data-f="' + p[0] + '">' + p[1] + ' (' + p[2] + ')</button>';
    }).join('');
    var v = visibles(filas);
    $('tu-filas').innerHTML = v.length ? v.map(function (f) {
      return '<tr tabindex="0" data-t="' + esc(f.tipo) + '" class="' + (f.tipo === st.sel ? 'sel ' : '') + (f.desactivado ? 'apagado' : '') + '"><td>' +
        (f.desactivado ? '' : '<input type="checkbox" data-m="' + esc(f.tipo) + '" aria-label="Marcar ' + esc(f.tipo) + '"' + (st.marcas[f.tipo] ? ' checked' : '') + '>') +
        '</td><td>' + esc(f.tipo) + '</td><td class="tu-suave tu-cat">' + esc(f.categoria) + '</td><td class="num">' + f.abiertos + '</td><td class="num">' + f.archivados +
        '</td><td class="tu-ult ' + (f.ultimo ? '' : 'nunca') + '">' + (fechaLegible(f.ultimo) || 'Nunca') + '</td><td>' +
        (f.desactivado ? '<span class="tu-etq">Desactivado</span> <button type="button" class="boton" data-a="' + esc(f.tipo) + '">Activar</button>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="tu-suave">No hay ningún tipo así.</td></tr>';
    var marcados = filas.filter(function (f) { return st.marcas[f.tipo] && !f.desactivado; }).length;
    var b = $('tu-desactivar');
    b.textContent = marcados ? 'Desactivar ' + pl(marcados, 'tipo', 'tipos') : 'Desactivar';
    b.disabled = !marcados;
    $('tu-mensaje').innerHTML = st.mensaje;
    pintarGuia(filas);
  }

  function mensaje(html, clase) { st.mensaje = '<div class="aviso ' + (clase || 'aviso-verde') + '">' + html + '</div>'; $('tu-mensaje').innerHTML = st.mensaje; }

  async function desactivar() {
    var filas = recoger().filter(function (f) { return st.marcas[f.tipo] && !f.desactivado; });
    if (!filas.length) return;
    var abiertos = filas.reduce(function (s, f) { return s + f.abiertos; }, 0), repiten = [];
    for (var i = 0; i < filas.length; i++) {
      if (window.Recurrentes && await Recurrentes.contarDeTipo(filas[i].tipo)) repiten.push(filas[i].tipo);
    }
    var cuerpo = '<ul>' + filas.map(function (f) { return '<li>' + esc(f.tipo) + '</li>'; }).join('') + '</ul>' +
      '<p>Dejarán de salir al crear asuntos. Sus guías y plantillas se conservan, y se pueden volver a activar.</p>' +
      (abiertos ? '<div class="aviso aviso-ambar">' + pl(abiertos, 'asunto abierto sigue', 'asuntos abiertos siguen') + ' igual.</div>' : '') +
      (repiten.length ? '<div class="aviso aviso-ambar">' + repiten.map(esc).join(', ') + (repiten.length === 1 ? ' se repite solo. Dejará' : ' se repiten solos. Dejarán') + ' de crearse.</div>' : '');
    if (!(await U.preguntar('Desactivar ' + pl(filas.length, 'tipo', 'tipos'), cuerpo, 'Desactivar'))) return;
    var tipos = filas.map(function (f) { return TiposDesactivar.porNombre(f.tipo); }).filter(Boolean);
    if (!(await TiposDesactivar.desactivarVarios(tipos))) return;
    filas.forEach(function (f) { delete st.marcas[f.tipo]; });
    st.filtro = 'apagados';
    st.mensaje = '';
    mensaje(pl(tipos.length, 'tipo desactivado', 'tipos desactivados') + '.');
    pintar();
  }

  async function activar(nombre) {
    var t = TiposDesactivar.porNombre(nombre);
    if (!t || !(await TiposDesactivar.activar(t))) return;
    delete st.marcas[nombre];
    st.mensaje = '';
    mensaje(esc(nombre) + ' vuelve a estar activo.');
    pintar();
  }

  function enganchar() {
    $('tu-buscar').oninput = function () { st.texto = this.value; pintar(); };
    $('tu-pastillas').onclick = function (e) { var f = e.target.dataset && e.target.dataset.f; if (f) { st.filtro = f; pintar(); } };
    $('tu-filas').onclick = function (e) {
      var d = e.target.dataset || {};
      if (d.m !== undefined) { if (e.target.checked) st.marcas[d.m] = true; else delete st.marcas[d.m]; pintar(); return; }
      if (d.a !== undefined) { activar(d.a); return; }
      var tr = e.target.closest && e.target.closest('tr[data-t]');
      if (tr) { st.sel = tr.dataset.t; pintar(); }
    };
    $('tu-filas').onkeydown = function (e) {
      var tr = e.target.closest && e.target.closest('tr[data-t]');
      if (tr && e.target === tr && e.key === 'Enter') { st.sel = tr.dataset.t; pintar(); }
    };
    $('tu-guia').onclick = function (e) { var t = e.target.id === 'tu-editar' && TiposDesactivar.porNombre(st.sel); if (t) App.abrirTipoDeAsunto(t); };
    $('tu-marcar').onclick = function () {
      recoger().forEach(function (f) { if (!f.desactivado && visibles([f]).length) st.marcas[f.tipo] = true; });
      pintar();
    };
    $('tu-quitar').onclick = function () { st.marcas = {}; pintar(); };
    $('tu-desactivar').onclick = desactivar;
    $('tu-enviar').onclick = async function () { if (!st.leido) await leerArchivo(); if (window.TiposYSuUsoEnviar) TiposYSuUsoEnviar.enviar(recoger(), guiaDe, mensaje); };
  }

  async function alAbrir() {
    try { if (window.GuiasDelCentro) await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
    await leerArchivo();
    pintar();
  }

  /* Fila 546: el índice del ARCHIVO, de todos los cursos, como App.contarAsuntosConTipo. */
  async function leerArchivo() {
    st.indice = [];
    try {
      var r = window.IndiceArchivo && await IndiceArchivo.leerDisco({ todos: true });
      if (r && r.ok && r.datos && Array.isArray(r.datos.asuntos)) st.indice = r.datos.asuntos;
    } catch (e) { /* sin índice usable, se cuenta lo que hay */ }
    st.leido = true;
  }

  function bloque() {
    if ($('bloque-tipos-uso')) return;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-tipos-uso';
    d.innerHTML = '<summary><span class="bloque-titulo">Tipos y su uso</span>' +
      '<span class="bloque-pie">Herramienta temporal de limpieza: ver cada tipo con su guía y desactivar los que no se usan</span></summary>' +
      '<div class="bloque-cuerpo"><div class="tu-cab"><span class="tu-resumen" id="tu-resumen"></span>' +
      '<button type="button" class="boton tu-enviar" id="tu-enviar">Enviar las guías activas a Claude</button></div>' +
      '<div id="tu-mensaje"></div><div class="tu-dos"><section class="tu-panel"><div class="tu-filtros">' +
      '<input type="search" class="campo" id="tu-buscar" placeholder="Buscar un tipo" aria-label="Buscar un tipo" style="max-width:240px"><span class="tu-filtros" id="tu-pastillas"></span></div>' +
      '<div class="tu-caja"><table class="tu-tabla"><thead><tr><th>Desactivar</th><th>Tipo de asunto</th><th class="tu-cat">Categoría</th><th class="num">Abiertos</th><th class="num">Archivados</th><th>Último uso</th><th></th></tr></thead>' +
      '<tbody id="tu-filas"></tbody></table></div><div class="tu-pie"><button type="button" class="boton" id="tu-desactivar">Desactivar</button>' +
      '<button type="button" class="boton" id="tu-marcar">Marcar los que se ven</button><button type="button" class="boton" id="tu-quitar">Quitar todas las marcas</button>' +
      '<span class="tu-suave">Los tipos sin usar salen marcados. Desmarca los que sabes que llegarán.</span></div></section>' +
      '<section class="tu-panel tu-guia" id="tu-guia"></section></div></div>';
    pantalla.appendChild(d);
    enganchar();
    d.addEventListener('toggle', function () { if (d.open) alAbrir(); });
    pintar();
  }

  function engancharRefresco() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (App.pantallaALaVista && !App.pantallaALaVista('ajustes') && !App.pantallaALaVista('herramientas')) return;
      if (window.Gestor.carpetaGestor()) { bloque(); if ($('bloque-tipos-uso') && $('bloque-tipos-uso').open) pintar(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', engancharRefresco);
  else engancharRefresco();

  return { crear: bloque, recoger: recoger, guiaDe: guiaDe, fechaLegible: fechaLegible, pintar: pintar };
})();
window.TiposYSuUso = TiposYSuUso;
