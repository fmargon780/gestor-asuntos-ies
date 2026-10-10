/* ============================================================
   actividades-pantalla.js — la pantalla «Actividades extraescolares» de
   Herramientas (9-oct-2026, fila 310, docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md).

   Todas las actividades del registro (`_GESTOR/actividades.json`) en una tabla
   a todo el ancho, con buscador y filtros por curso, profesor/a, unidad y
   situación. Un bloque de Herramientas con el botón «Abrir» y una vista que
   sustituye a la lista de bloques mientras está abierta, como el control del
   registro (js/control-registro-pantalla.js) y las plantillas
   (js/plantillas-pantalla.js).

   Lee solo `actividades.json`: nunca recorre el ARCHIVO ni abre fichas para
   pintar la tabla. Pulsar una fila abre la ficha de su asunto (y «Volver» trae
   otra vez aquí); una antigua abre su cuadro (js/actividades-antigua.js).
   Exportar: js/actividades-exportar.js.
   ============================================================ */
var ActividadesPantalla = (function () {

  var CLAVE = 'gestor.actividades.filtros';
  var E = { abierta: false, vuelta: false, orden: 'desc', curso: null, texto: '', profesor: '', unidad: '', situacion: '', turno: 0 };

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function n(t) { return U.normalizar(String(t || '')); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- sin efectos ---------- */

  function cursoDe(a) { return U.cursoDeFecha(a.inicio) || ''; }

  function textoBuscable(a) {
    return n([a.nombre, a.lugar, a.departamento, (a.unidades || []).map(function (u) { return u.unidad; }).join(' '),
      (a.profesorado || []).map(function (p) { return p.nombre; }).join(' ')].join(' '));
  }

  /* PURA. `filtros`: { curso ('' = todos), profesor, unidad, situacion, texto }. Las de la papelera no salen. */
  function filtrar(actividades, filtros, hoyIso) {
    filtros = filtros || {};
    var palabras = n(filtros.texto).split(/\s+/).filter(Boolean);
    return (actividades || []).filter(function (a) {
      if (a.enPapelera) return false;
      if (filtros.curso && cursoDe(a) !== filtros.curso) return false;
      if (filtros.profesor && !(a.profesorado || []).some(function (p) { return n(p.nombre) === n(filtros.profesor); })) return false;
      if (filtros.unidad && !(a.unidades || []).some(function (u) { return u.unidad === filtros.unidad; })) return false;
      if (filtros.situacion && Actividades.situacion(a, hoyIso) !== filtros.situacion) return false;
      if (palabras.length) { var t = textoBuscable(a); if (!palabras.every(function (w) { return t.indexOf(w) !== -1; })) return false; }
      return true;
    });
  }

  /* De más reciente a más antigua (o al revés). */
  function ordenar(lista, orden) {
    var s = orden === 'asc' ? 1 : -1;
    return lista.slice().sort(function (a, b) {
      if (a.inicio !== b.inicio) return a.inicio < b.inicio ? -s : s;
      return n(a.nombre) < n(b.nombre) ? -1 : (n(a.nombre) > n(b.nombre) ? 1 : 0);
    });
  }

  /* `15-oct-2026`, o `15 a 17-oct-2026` si dura varios días del mismo mes. */
  function fechaDeTabla(a) {
    var i = String(a.inicio || ''), f = String(a.fin || a.inicio || '');
    if (!i) return '';
    if (!f || f === i) return Actividades.fechaCorta(i);
    var ci = Actividades.fechaCorta(i), cf = Actividades.fechaCorta(f);
    if (i.slice(0, 7) === f.slice(0, 7)) return ci.split('-')[0] + ' a ' + cf;
    return ci + ' a ' + cf;
  }

  function cuentas(lista, hoyIso) {
    var c = { total: lista.length, realizada: 0, prevista: 0, anulada: 0 };
    lista.forEach(function (a) { c[Actividades.situacion(a, hoyIso)]++; });
    return c;
  }

  function lineaDeCuentas(c) {
    return c.total + (c.total === 1 ? ' actividad' : ' actividades') + ' · ' + c.realizada + (c.realizada === 1 ? ' realizada' : ' realizadas') +
      ' · ' + c.prevista + (c.prevista === 1 ? ' prevista' : ' previstas') + ' · ' + c.anulada + (c.anulada === 1 ? ' anulada' : ' anuladas');
  }

  /* ---------- lo elegido se recuerda en este ordenador ---------- */

  function recordar() {
    try { window.localStorage.setItem(CLAVE, JSON.stringify({ curso: E.curso, profesor: E.profesor, unidad: E.unidad, situacion: E.situacion })); } catch (e) { /* sin memoria: nada */ }
  }
  function recuperar() {
    var v = null;
    try { v = JSON.parse(window.localStorage.getItem(CLAVE) || 'null'); } catch (e) { v = null; }
    E.curso = v && typeof v.curso === 'string' ? v.curso : U.cursoActual();
    E.profesor = v && typeof v.profesor === 'string' ? v.profesor : '';
    E.unidad = v && typeof v.unidad === 'string' ? v.unidad : '';
    E.situacion = v && typeof v.situacion === 'string' ? v.situacion : '';
  }

  function filtros() { return { curso: E.curso, profesor: E.profesor, unidad: E.unidad, situacion: E.situacion, texto: E.texto }; }

  /* ---------- pintar ---------- */

  function opciones(valores, elegido, etiqueta) {
    var vistos = {}, v = [];
    valores.concat(elegido ? [elegido] : []).forEach(function (x) { if (x && !vistos[x]) { vistos[x] = true; v.push(x); } });
    return '<option value="">Todos</option>' + v.map(function (x) {
      return '<option value="' + esc(x) + '"' + (x === elegido ? ' selected' : '') + '>' + esc(etiqueta ? etiqueta(x) : x) + '</option>';
    }).join('');
  }

  function cursosConActividad() {
    var vistos = {}, l = [];
    Actividades.lista().forEach(function (a) { var c = cursoDe(a); if (!a.enPapelera && c && !vistos[c]) { vistos[c] = true; l.push(c); } });
    return l.sort().reverse();
  }

  function hoy() { return U.hoyIso(); }

  function celdaProfes(a) {
    return (a.profesorado || []).map(function (p) { return esc(p.nombre) + (p.papel === 'organiza' ? ' <span class="suave">(organiza)</span>' : ''); }).join('<br>');
  }

  function fila(a, h) {
    var s = Actividades.situacion(a, h);
    var off = soloConsulta() ? ' disabled' : '';
    var menu = a.antigua
      ? '<details class="pt-mas-menu"><summary title="Más" data-solo-lectura>⋯</summary><div class="pt-menu">' +
        '<button type="button" class="boton" data-accion="cambiar"' + off + '>Cambiar</button>' +
        '<button type="button" class="boton boton-peligro" data-accion="borrar"' + off + '>Borrar</button></div></details>'
      : '';
    return '<tr class="ap-fila' + (a.asunto || (a.antigua && !soloConsulta()) ? ' ap-clic' : '') + '" data-id="' + esc(a.id) + '">' +
      '<td class="ap-fecha">' + esc(fechaDeTabla(a)) + '</td>' +
      '<td class="ap-nombre">' + esc(a.nombre) + '</td>' +
      '<td>' + esc(a.departamento) + '</td>' +
      '<td>' + esc(a.lugar) + '</td>' +
      '<td>' + (a.antigua ? '' : esc((a.unidades || []).map(function (u) { return u.unidad; }).join(', '))) + '</td>' +
      '<td class="ap-num">' + (a.antigua ? '' : esc(a.alumnado || '')) + '</td>' +
      '<td>' + celdaProfes(a) + '</td>' +
      '<td class="ap-situacion ap-' + s + '">' + esc(Actividades.textoSituacion(s)) + (a.antigua ? ' <span class="pt-etiqueta">antigua</span>' : '') + '</td>' +
      '<td class="pt-acciones">' + menu + '</td></tr>';
  }

  function textoFiltrado() {
    var p = [];
    if (E.profesor) p.push(E.profesor);
    if (E.unidad) p.push('unidad ' + E.unidad);
    if (E.situacion) p.push(E.situacion === 'prevista' ? 'previstas' : (E.situacion === 'realizada' ? 'realizadas' : 'anuladas'));
    if (E.texto.trim()) p.push('«' + E.texto.trim() + '»');
    return p.join(' · ');
  }

  function pintarCuerpo() {
    var cuerpo = $('ap-cuerpo');
    if (!cuerpo) return;
    var h = hoy(), todas = Actividades.lista(), l = ordenar(filtrar(todas, filtros(), h), E.orden);
    var filtrado = textoFiltrado();
    $('ap-filtrado').innerHTML = filtrado ? 'Filtrado por: <strong>' + esc(filtrado) + '</strong> <button type="button" class="enlace" id="ap-quitar" data-solo-lectura>✕ Quitar</button>' : '';
    $('ap-filtrado').classList.toggle('oculto', !filtrado);
    if (filtrado) $('ap-quitar').onclick = function () { E.texto = ''; E.profesor = ''; E.unidad = ''; E.situacion = ''; recordar(); pintar(); };
    if (!todas.filter(function (a) { return !a.enPapelera; }).length) {
      cuerpo.innerHTML = '<div class="vacio">Todavía no hay ninguna actividad apuntada.</div>';
    } else if (!l.length) {
      cuerpo.innerHTML = '<div class="vacio">Ninguna actividad encaja con eso.</div>';
    } else {
      cuerpo.innerHTML = '<table class="pt-tabla ap-tabla"><thead><tr>' +
        '<th><button type="button" class="enlace pt-ordenar activa" data-solo-lectura id="ap-orden" title="Cambiar el orden">Fecha ' + (E.orden === 'desc' ? '▼' : '▲') + '</button></th>' +
        '<th>Actividad</th><th>Departamento</th><th>Lugar</th><th>Unidades</th><th>Alumnado</th><th>Profesorado</th><th>Situación</th><th></th></tr></thead><tbody>' +
        l.map(function (a) { return fila(a, h); }).join('') + '</tbody></table>';
      $('ap-orden').onclick = function () { E.orden = E.orden === 'desc' ? 'asc' : 'desc'; pintarCuerpo(); };
    }
    $('ap-cuenta').textContent = lineaDeCuentas(cuentas(l, h));
  }

  function pintar() {
    var vista = $('actividades-vista');
    if (!vista || !E.abierta) return;
    var h = hoy(), todas = Actividades.lista();
    var sin = Object.assign({}, filtros());
    var paraProfes = filtrar(todas, Object.assign({}, sin, { profesor: '' }), h);
    var paraUnidades = filtrar(todas, Object.assign({}, sin, { unidad: '' }), h);
    var profes = [], unidades = [], vistosP = {}, vistosU = {};
    paraProfes.forEach(function (a) { (a.profesorado || []).forEach(function (p) { if (!vistosP[n(p.nombre)]) { vistosP[n(p.nombre)] = true; profes.push(p.nombre); } }); });
    paraUnidades.forEach(function (a) { (a.unidades || []).forEach(function (u) { if (u.unidad && !vistosU[u.unidad]) { vistosU[u.unidad] = true; unidades.push(u.unidad); } }); });
    profes.sort(function (a, b) { return n(a) < n(b) ? -1 : 1; });
    unidades.sort();
    var off = soloConsulta() ? ' disabled' : '';
    var cursos = cursosConActividad();
    var optCurso = '<option value=""' + (E.curso === '' ? ' selected' : '') + '>Todos</option>' +
      (cursos.indexOf(E.curso) === -1 && E.curso ? [E.curso] : []).concat(cursos).sort().reverse().map(function (c) {
        return '<option value="' + esc(c) + '"' + (c === E.curso ? ' selected' : '') + '>' + esc(c) + '</option>';
      }).join('');
    var sit = [['', 'Todas'], ['prevista', 'Previstas'], ['realizada', 'Realizadas'], ['anulada', 'Anuladas']].map(function (x) {
      return '<option value="' + x[0] + '"' + (x[0] === E.situacion ? ' selected' : '') + '>' + x[1] + '</option>';
    }).join('');
    vista.innerHTML =
      '<div class="pt-barra"><button type="button" class="boton" id="ap-volver" data-solo-lectura>← Volver a Herramientas</button>' +
        '<h3 class="pt-titulo">Actividades extraescolares</h3></div>' +
      '<div class="pt-filtros">' +
        '<input id="ap-buscar" class="campo" data-solo-lectura placeholder="Buscar entre las actividades…" value="' + esc(E.texto) + '">' +
        '<label class="pt-etq">Curso <select id="ap-curso" class="campo" data-solo-lectura>' + optCurso + '</select></label>' +
        '<label class="pt-etq">Profesor/a <select id="ap-profesor" class="campo" data-solo-lectura>' + opciones(profes, E.profesor) + '</select></label>' +
        '<label class="pt-etq">Unidad <select id="ap-unidad" class="campo" data-solo-lectura>' + opciones(unidades, E.unidad) + '</select></label>' +
        '<label class="pt-etq">Situación <select id="ap-situacion" class="campo" data-solo-lectura>' + sit + '</select></label>' +
      '</div>' +
      '<div class="pt-filtros">' +
        '<button type="button" class="boton boton-principal" id="ap-nueva"' + off + '>+ Nueva actividad</button>' +
        '<button type="button" class="boton" id="ap-antigua"' + off + '>+ Apuntar una actividad antigua</button>' +
        '<details class="pt-mas-menu ap-exportar"><summary class="boton" data-solo-lectura>Exportar ▾</summary><div class="pt-menu">' +
          '<button type="button" class="boton" id="ap-hoja" data-solo-lectura>Hoja de cálculo</button></div></details>' +
      '</div>' +
      '<div id="ap-filtrado" class="ap-filtrado oculto"></div>' +
      '<div id="ap-cuerpo"></div>' +
      '<p class="suave ap-cuenta" id="ap-cuenta" aria-live="polite"></p>';
    $('ap-volver').onclick = cerrar;
    $('ap-buscar').oninput = function () { E.texto = this.value; pintarCuerpo(); };
    $('ap-curso').onchange = function () { E.curso = this.value; E.profesor = ''; E.unidad = ''; recordar(); pintar(); };
    $('ap-profesor').onchange = function () { E.profesor = this.value; recordar(); pintar(); };
    $('ap-unidad').onchange = function () { E.unidad = this.value; recordar(); pintar(); };
    $('ap-situacion').onchange = function () { E.situacion = this.value; recordar(); pintar(); };
    $('ap-nueva').onclick = nueva;
    $('ap-antigua').onclick = function () { return antigua(null); };
    $('ap-hoja').onclick = function () {
      var det = this.closest('details'); if (det) det.open = false;
      var l = ordenar(filtrar(Actividades.lista(), filtros(), hoy()), E.orden);
      return ActividadesExportar.exportar(l, E.curso, hoy()).catch(function (e) { U.fallo('No he podido preparar la hoja de cálculo', e); });
    };
    pintarCuerpo();
    enlazarTabla(vista);
  }

  /* ---------- las pulsaciones de la tabla ---------- */

  function enlazarTabla(vista) {
    if (vista.dataset.enlazada) return;
    vista.dataset.enlazada = '1';
    vista.addEventListener('click', function (ev) {
      var tr = ev.target.closest && ev.target.closest('tr.ap-fila');
      if (!tr) return;
      var a = Actividades.porId(tr.dataset.id);
      if (!a) return;
      var accion = ev.target.closest('[data-accion]');
      if (accion) {
        var det = accion.closest('details'); if (det) det.open = false;
        if (accion.dataset.accion === 'cambiar') return antigua(a);
        if (accion.dataset.accion === 'borrar') return borrar(a);
        return;
      }
      if (ev.target.closest('details')) return;
      if (a.asunto) return abrirAsunto(a);
      if (a.antigua && !soloConsulta()) return antigua(a);
    });
  }

  async function abrirAsunto(a) {
    var nombre = a.asunto && a.asunto.nombre;
    if (!nombre) return;
    var ab = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombre; })[0];
    E.vuelta = true;
    if (ab) { App.abrirFicha(ab, 'abierto'); return; }
    try {
      var entrada = null;
      if (window.ArchivoIndice) {
        var r = await ArchivoIndice.leerDisco({ todos: true });
        entrada = r && r.ok ? (r.datos.asuntos || []).filter(function (x) { return x.nombre === nombre || (a.asunto.numero && x.numero === a.asunto.numero); })[0] : null;
      }
      var objeto = entrada && window.OtrosDelTercero ? await OtrosDelTercero.montarArchivado(entrada.nombre, entrada.categoria, entrada.tercero) : null;
      if (objeto) { App.abrirFicha(objeto, 'archivado'); return; }
    } catch (e) { /* aviso de abajo */ }
    E.vuelta = false;
    U.aviso('No he podido abrir «' + nombre + '»: ya no está abierto ni en el archivo.', 'malo');
  }

  async function antigua(a) {
    var r = await ActividadesAntigua.abrir(a);
    if (r) { U.aviso('Actividad apuntada.', 'bueno'); pintar(); pintarBloque(); }
  }

  async function borrar(a) {
    if (await ActividadesAntigua.borrar(a)) { pintar(); pintarBloque(); if (typeof App.pintarPapelera === 'function') App.pintarPapelera(); }
  }

  async function nueva() {
    var tipos = (App.E.tipos || []).filter(function (t) { return t.actividades === true; });
    if (!tipos.length) { U.aviso('Ningún tipo de asunto está marcado para actividades extraescolares.', 'ambar'); return; }
    var tipo = tipos[0];
    var r = await ActividadesFormulario.abrir({ titulo: 'La actividad', textoSeguir: 'Seguir' });
    if (!r) return;
    if (tipos.length > 1) {
      var html = '<p>¿Con qué tipo de asunto se apunta?</p><select id="ap-tipo-elegir" class="campo">' + tipos.map(function (t, i) {
        return '<option value="' + i + '">' + esc(t.tipo) + '</option>'; }).join('') + '</select>';
      var ok = await U.preguntar('Tipo de asunto', html, 'Seguir');
      if (!ok) return;
      tipo = tipos[+$('ap-tipo-elegir').value] || tipo;
    }
    E.abierta = false;
    App.nuevoAsuntoCon({ tipo: tipo.tipo });
    ActividadesFormulario.fijarEnNuevo(r);
  }

  /* ---------- abrir, cerrar, recargar ---------- */

  async function abrir(opciones) {
    opciones = opciones || {};
    if (!opciones.conservar) recuperar(); else if (E.curso === null) recuperar();
    if (!opciones.conservar) { E.texto = ''; E.orden = 'desc'; }
    var herr = $('pantalla-herramientas');
    if (herr && herr.classList.contains('oculto') && App.ir) App.ir('herramientas');
    var l = $('herramientas-lista'), vista = $('actividades-vista');
    if (!vista) return;
    E.abierta = true; E.vuelta = false;
    if (l) l.classList.add('oculto');
    ['control-registro-vista', 'plantillas-vista'].forEach(function (id) { var o = $(id); if (o) o.classList.add('oculto'); });
    vista.classList.remove('oculto');
    vista.innerHTML = '<p class="explica">Abriendo las actividades…</p>';
    var mio = ++E.turno;
    try { await Actividades.releer(); } catch (e) { /* se queda con lo que hay */ }
    if (mio !== E.turno) return;
    pintar();
  }

  function cerrar() {
    E.abierta = false; E.vuelta = false;
    var l = $('herramientas-lista'), vista = $('actividades-vista');
    if (l) l.classList.remove('oculto');
    if (vista) vista.classList.add('oculto');
    pintarBloque();
  }

  /* Al entrar en Herramientas: si se vuelve de la ficha de una actividad, se reabre la tabla tal como estaba; si no, se cierra. */
  async function alEntrarEnHerramientas() {
    if (E.vuelta && E.curso !== null) { await abrir({ conservar: true }); return; }
    cerrar();
    await pintarBloque();
  }

  /* La línea del bloque: «N este curso · M previstas». */
  async function pintarBloque() {
    var linea = $('actividades-resumen');
    if (!linea || !App.E.gestor) return;
    try {
      await Actividades.releer();
      var h = hoy(), actual = U.cursoActual();
      var delCurso = Actividades.lista().filter(function (a) { return !a.enPapelera && cursoDe(a) === actual; });
      var previstas = delCurso.filter(function (a) { return Actividades.situacion(a, h) === 'prevista'; }).length;
      linea.textContent = delCurso.length + ' este curso · ' + previstas + (previstas === 1 ? ' prevista' : ' previstas');
    } catch (e) { linea.textContent = ''; }
    var b = $('actividades-abrir');
    if (b && !b.onclick) b.onclick = function () { return abrir(); };
  }

  /* Cuando el registro cambia (otro ordenador, un cambio aquí), la tabla se repinta sola. */
  if (window.Actividades && Actividades.alCambiar) Actividades.alCambiar.push(function () { if (E.abierta) pintar(); });

  return {
    abrir: abrir, cerrar: cerrar, pintarBloque: pintarBloque, alEntrarEnHerramientas: alEntrarEnHerramientas,
    filtrar: filtrar, ordenar: ordenar, fechaDeTabla: fechaDeTabla, cuentas: cuentas, lineaDeCuentas: lineaDeCuentas,
    estaAbierta: function () { return E.abierta; }
  };
})();
window.ActividadesPantalla = ActividadesPantalla;
