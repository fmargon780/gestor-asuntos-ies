/* ============================================================
   etiquetas-pantalla-vista.js — pintar la vista, enganchar los controles, los editores y los ganchos (fila 536: trozo de js/etiquetas-pantalla.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/etiquetas-pantalla.js.
   ============================================================ */
var EtiquetasPantallaNucleo = EtiquetasPantallaNucleo || {};
(function () {

  var I = EtiquetasPantallaNucleo;
  var E = I.E;
  function $() { return I.$.apply(this, arguments); }
  function esc() { return I.esc.apply(this, arguments); }
  function soloConsulta() { return I.soloConsulta.apply(this, arguments); }
  function clave() { return I.clave.apply(this, arguments); }
  function modelos() { return I.modelos.apply(this, arguments); }
  function disenos() { return I.disenos.apply(this, arguments); }
  function modeloActual() { return I.modeloActual.apply(this, arguments); }
  function vale() { return I.vale.apply(this, arguments); }
  function disenoActual() { return I.disenoActual.apply(this, arguments); }
  function nor() { return I.nor.apply(this, arguments); }
  function porPegado() { return I.porPegado.apply(this, arguments); }
  function candidatas() { return I.candidatas.apply(this, arguments); }
  function listaDePersonal() { return I.listaDePersonal.apply(this, arguments); }
  function exportarPersonal() { return I.exportarPersonal.apply(this, arguments); }
  function calcular() { return I.calcular.apply(this, arguments); }
  var CLASES_PERSONAL = I.CLASES_PERSONAL;
  function textoClasePersonal() { return I.textoClasePersonal.apply(this, arguments); }
  function departamentos() { return I.departamentos.apply(this, arguments); }
  function buscarPersonas() { return I.buscarPersonas.apply(this, arguments); }
  function elegirPersona() { return I.elegirPersona.apply(this, arguments); }
  function htmlPanel() { return I.htmlPanel.apply(this, arguments); }
  function vaciar() { return I.vaciar.apply(this, arguments); }
  function vaciarHuecos() { return I.vaciarHuecos.apply(this, arguments); }
  function cambiarPestana() { return I.cambiarPestana.apply(this, arguments); }
  function salir() { return I.salir.apply(this, arguments); }
  function notarMarcadas() { return I.notarMarcadas.apply(this, arguments); }
  function empezarDeCero() { return I.empezarDeCero.apply(this, arguments); }
  function guardarTrabajo() { return I.guardarTrabajo.apply(this, arguments); }
  function guardarPdf() { return I.guardarPdf.apply(this, arguments); }
  function imprimir() { return I.imprimir.apply(this, arguments); }
  function cerrar() { return I.cerrar.apply(this, arguments); }

  function pintar() {
    var vista = $('etiquetas-vista');
    if (!vista) return;
    calcular();
    vista.innerHTML =
      '<div class="pt-barra"><button type="button" class="boton" id="et-volver" data-solo-lectura>' + (E.volverA ? '← Volver al asunto' : '← Volver a Herramientas') + '</button>' +
        '<h3 class="pt-titulo">Etiquetas</h3></div>' +
      '<div class="et-cuerpo"><div class="et-panel" id="et-panel">' + htmlPanel() + '</div>' +
      '<div class="et-derecha"><div class="et-tarjetas" id="et-tarjetas"></div><div class="et-vista" id="et-vista-hojas"></div></div></div>' +
      '<div class="et-pie" id="et-pie"></div>';
    EtiquetasTarjetas.pintar(ganchos);
    enganchar();
    pintarVista();
  }

  function pintarVista() {
    calcular();
    var cont = $('et-vista-hojas');
    if (!cont) return;
    var ancho = Math.max(300, cont.clientWidth - 24);
    var escala = Math.max(1.2, Math.min(3, ancho / 210));
    cont.innerHTML = EtiquetasHoja.vistaHtml(E.pag, E.modelo, E.prep, escala) +
      (E.personasN ? '' : '<p class="explica et-vacio">Elige un grupo, busca personas o pega una lista.</p>');
    var sinDir = 0, cortas = 0;
    E.items.forEach(function (it, i) {
      if (E.items.indexOf(it) !== i) return;
      if (it.sinDireccion) sinDir++;
      if (E.prep.get(it).corto) cortas++;
    });
    var res = $('et-resumen');
    if (res) res.textContent = E.personasN + (E.personasN === 1 ? ' persona' : ' personas') + ' · ' + E.items.length + (E.items.length === 1 ? ' etiqueta' : ' etiquetas');
    var lista = $('et-lista');
    if (lista) { lista.innerHTML = htmlLista(); engancharLista(); }
    var avisos = (sinDir ? '<span class="et-aviso-pie">' + sinDir + (sinDir === 1 ? ' familia sin dirección' : ' familias sin dirección') + '</span>' : '') +
      (cortas ? '<span class="et-aviso-pie">' + cortas + (cortas === 1 ? ' etiqueta con el texto cortado' : ' etiquetas con el texto cortado') + '</span>' : '');
    $('et-pie').innerHTML =
      '<span class="et-pie-cuenta" id="et-cuenta">' + E.pag.hojas.length + (E.pag.hojas.length === 1 ? ' hoja' : ' hojas') + ' · ' + E.items.length + (E.items.length === 1 ? ' etiqueta' : ' etiquetas') + '</span>' + avisos +
      '<span class="et-pie-botones"><button type="button" class="boton" id="et-guardar-pdf" data-solo-lectura' + (E.items.length ? '' : ' disabled') + '>Guardar PDF</button>' +
      '<button type="button" class="boton boton-principal" id="et-imprimir" data-solo-lectura' + (E.items.length ? '' : ' disabled') + '>Imprimir</button></span>' +
      '<span class="et-pie-nota">En el cuadro de impresión, elige tamaño real (100 %), no «Ajustar».</span>';
    $('et-guardar-pdf').onclick = guardarPdf;
    $('et-imprimir').onclick = imprimir;
    guardarTrabajo();
  }

  function itemsLista() {
    return candidatas().map(function (p) {
      return { clave: clave(p), texto: p.nombre + (p.unidad ? ' · ' + p.unidad : ''), anadida: !!E.anadidas[clave(p)] };
    });
  }

  function htmlLista() {
    var items = itemsLista();
    return items.length ? ListaConCasillas.html(items, E.quitadas, { id: 'et' }) : '';
  }

  function engancharLista() {
    var cont = $('et-lista');
    if (!cont) return;
    ListaConCasillas.enganchar(cont, itemsLista(), E.quitadas, {
      alCambiar: function () { notarMarcadas(); if (E.filtro) E.filtro.cacheMarcadas = null; pintarVista(); },
      alQuitar: function (k) { delete E.anadidas[k]; delete E.quitadas[k]; delete E.vistas[k]; salir(k); pintarVista(); }
    });
  }

  /* ---------- las pulsaciones ---------- */

  /* Fila 374: pulsar una etiqueta de cualquier hoja la raya o la libera; arrastrar marca el rectángulo hasta otra de la
     misma hoja. Con el dedo, el rectángulo pide dejarlo quieto un momento antes de arrastrar (si no, la página se desplaza). */
  function enganchaHuecos(cont) {
    var ini = null;
    function casillaEn(hoja, ev) {
      var g = EtiquetasModelos.geometria(E.modelo), r = hoja.getBoundingClientRect(), k = r.width / g.hojaAncho;
      var col = Math.floor(((ev.clientX - r.left) / k - g.x0) / g.px), fila = Math.floor(((ev.clientY - r.top) / k - g.y0) / g.py);
      col = Math.max(0, Math.min(E.modelo.columnas - 1, col)); fila = Math.max(0, Math.min(E.modelo.filas - 1, fila));
      return fila * E.modelo.columnas + col;
    }
    function resaltar(fin) {
      var rect = EtiquetasHoja.rectangulo(E.modelo, ini.casilla, fin);
      Array.prototype.forEach.call(ini.hoja.querySelectorAll('.et-casilla'), function (c) {
        c.classList.toggle('et-marcando', rect.indexOf(Number(c.getAttribute('data-casilla'))) !== -1);
      });
      ini.fin = fin;
    }
    function acabar() {
      if (!ini) return;
      clearTimeout(ini.espera);
      Array.prototype.forEach.call(ini.hoja.querySelectorAll('.et-marcando'), function (c) { c.classList.remove('et-marcando'); });
      ini = null;
    }
    cont.addEventListener('dragstart', function (ev) { ev.preventDefault(); });
    cont.addEventListener('touchmove', function (ev) { if (ini && ini.armado && ev.cancelable) ev.preventDefault(); }, { passive: false });
    cont.addEventListener('pointerdown', function (ev) {
      var c = ev.target.closest && ev.target.closest('.et-casilla'), hoja = c && c.closest('.et-hoja');
      if (!c || !hoja || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      acabar();
      var i = Number(c.getAttribute('data-casilla'));
      ini = { hoja: hoja, nh: Number(hoja.getAttribute('data-hoja')), casilla: i, fin: i, x: ev.clientX, y: ev.clientY, id: ev.pointerId, armado: ev.pointerType !== 'touch' };
      ini.estaba = !!E.gastadas[ini.nh + ':' + i];
      if (ini.armado) { ev.preventDefault(); try { cont.setPointerCapture(ev.pointerId); } catch (e) {} }
      else ini.espera = setTimeout(function () {
        if (!ini) return;
        ini.armado = true; try { cont.setPointerCapture(ini.id); } catch (e) {}
        resaltar(ini.casilla);
      }, 400);
    });
    cont.addEventListener('pointermove', function (ev) {
      if (!ini || ev.pointerId !== ini.id) return;
      if (!ini.armado) { if (Math.abs(ev.clientX - ini.x) + Math.abs(ev.clientY - ini.y) > 10) acabar(); return; }
      var fin = casillaEn(ini.hoja, ev);
      if (fin !== ini.fin || !ini.hoja.querySelector('.et-marcando')) resaltar(fin);
    });
    cont.addEventListener('pointerup', function (ev) {
      if (!ini || ev.pointerId !== ini.id) return;
      var a = ini, fin = a.armado ? casillaEn(a.hoja, ev) : a.casilla;
      var c = ev.target.closest && ev.target.closest('.et-casilla');
      if (!a.armado && (!c || c.closest('.et-hoja') !== a.hoja || Number(c.getAttribute('data-casilla')) !== a.casilla)) { acabar(); return; }
      acabar();
      EtiquetasHoja.rectangulo(E.modelo, a.casilla, fin).forEach(function (i) {
        if (a.estaba) delete E.gastadas[a.nh + ':' + i]; else E.gastadas[a.nh + ':' + i] = true;
      });
      pintarVista();
    });
    cont.addEventListener('pointercancel', acabar);
  }

  function enganchar() {
    var panel = $('et-panel'), vista = $('etiquetas-vista');
    $('et-volver').onclick = function () {
      if (E.volverA) { var v = E.volverA; cerrar(); App.abrirFicha(v.asunto, v.modo); } else cerrar();
    };
    enganchaHuecos($('et-vista-hojas'));
    Array.prototype.forEach.call(panel.querySelectorAll('[data-clase]'), function (b) {
      b.onclick = function () { cambiarPestana(b.getAttribute('data-clase')); pintar(); };
    });
    $('et-empezar').onclick = empezarDeCero;
    if (E.filtro && E.clase === 'alumnado') RepartirFiltro.enganchar(E.filtro, panel, function () { pintar(); });
    CajaConSugerencias.enganchar(panel, 'et-buscar-persona', { fuente: buscarPersonas, minimo: 3, vaciar: true, alElegir: elegirPersona });
    var pc = $('et-pclase'), pd = $('et-pdepto');
    function conTodos(items, actual) {
      return function (texto) {
        return nor(texto) === nor(actual()) ? items() : CajaConSugerencias.deLista(items())(texto);
      };
    }
    if (pc) CajaConSugerencias.enganchar(panel, 'et-pclase', {
      fuente: conTodos(function () { return CLASES_PERSONAL; }, textoClasePersonal),
      alElegir: function (o) { E.personal.clase = o.valor; E.personal.todo = !o.valor; pintarVista(); exportarPersonal(panel); }
    });
    if (pd) CajaConSugerencias.enganchar(panel, 'et-pdepto', {
      fuente: conTodos(function () { return [{ valor: '', texto: 'Todos' }].concat(departamentos().map(function (d) { return { valor: d, texto: d }; })); }, function () { return E.personal.depto; }),
      alElegir: function (o) { E.personal.depto = o.valor; if (!o.valor) pd.value = ''; pintarVista(); exportarPersonal(panel); }
    });
    if (pd) pd.addEventListener('input', function () { if (!pd.value.trim() && E.personal.depto) { E.personal.depto = ''; pintarVista(); exportarPersonal(panel); } });
    if (pc) pc.addEventListener('input', function () { if (!pc.value.trim() && (E.personal.clase || E.personal.todo)) { E.personal.clase = ''; E.personal.todo = false; pintarVista(); exportarPersonal(panel); } });
    if (pc) { FiltroExportar.enganchar(panel, function () { return listaDePersonal(); }); exportarPersonal(panel); }
    $('et-pegar-usar').onclick = function () { pegar($('et-pegado').value); };
    var pq = $('et-pegar-quitar');
    if (pq) pq.onclick = function () { E.pegado = null; pintar(); };
    $('et-copias').oninput = function () { E.copias = Math.max(1, Math.min(50, parseInt(this.value, 10) || 1)); pintarVista(); };
    $('et-hoja-nueva').onclick = function () { vaciar(E.gastadas); pintarVista(); };
  }

  /* La lista pegada de una pestaña: cada línea con su puesto (el orden «en que los marco» la respeta). */
  function hacerPegado(texto, lista) {
    var fichas = {}, cuantas = 0;
    String(texto || '').split(/\r?\n/).forEach(function (l) {
      var t = nor(l).trim();
      if (t) { cuantas++; if (!fichas[t]) fichas[t] = cuantas; }
    });
    if (!cuantas) return null;
    var pegado = { fichas: fichas, texto: texto, cuantas: cuantas, aviso: '' };
    var halladas = porPegado(lista, pegado).length;
    pegado.aviso = halladas + ' de ' + cuantas + (cuantas === 1 ? ' línea encontrada.' : ' líneas encontradas.');
    return pegado;
  }

  function pegar(texto) {
    var lista = E.clase === 'alumnado' ? (E.base || E.matriculados || []) : (E.personal.lista || []);
    E.pegado = hacerPegado(texto, lista);
    pintar();
  }

  /* ---------- guardar modelos y diseños ---------- */

  /* «Cambiar»: uno propio se sustituye (mismo id); uno de la app se guarda como copia con otro nombre. */
  function abrirEditorModelo(base) {
    var m, aviso = '';
    if (!base) m = Object.assign(EtiquetasModelos.nuevo('', 0, 0), { filas: '', columnas: '' });
    else {
      m = JSON.parse(JSON.stringify(base));
      delete m.propio;
      if (m.integrado) {
        delete m.integrado; delete m.id; delete m.codigo; delete m.apli; m.nombre = 'Copia de ' + base.nombre;
        aviso = 'Es un modelo de la app: se guardará como copia con otro nombre.';
      }
    }
    E.editor = { tipo: 'modelo', modelo: m, existente: base && base.propio ? base.id : null, margenesAbiertos: !!base, aviso: aviso,
                 titulo: !base ? 'Nuevo modelo de hoja' : (base.propio ? 'Cambiar el modelo' : 'Cambiar el modelo (se guarda como copia propia)') };
    pintar();
  }

  function abrirEditorDiseno(base) {
    var d = JSON.parse(JSON.stringify(base)), aviso = '';
    if (d.integrado) {
      delete d.id; delete d.integrado; d.nombre = 'Copia de ' + base.nombre;
      aviso = 'Es un diseño de la app: se guardará como copia con otro nombre.';
    }
    E.editor = { tipo: 'diseno', titulo: base.integrado ? 'Cambiar el diseño (se guarda como copia propia)' : 'Cambiar el diseño', diseno: d, aviso: aviso };
    pintar();
  }

  async function guardarEditor(obj) {
    try {
      if (E.editor.tipo === 'modelo') {
        var guardar = Object.assign({}, obj), id = E.editor.existente || EtiquetasGuardado.nuevoId('m');
        guardar.id = id; guardar.nombre = guardar.nombre.trim();
        ['sup', 'inf', 'izq', 'der', 'sepH', 'sepV'].forEach(function (k) { guardar[k] = EtiquetasModelos.r2(guardar[k]); });
        E.guardado = await EtiquetasGuardado.cambiar(function (d) {
          var i = d.modelos.findIndex(function (x) { return x.id === id; });
          if (i === -1) d.modelos.push(guardar); else d.modelos[i] = guardar;
        });
        E.modeloId = id; vaciarHuecos();
        EtiquetasGuardado.recordar('modelo', id);
      } else {
        var dis = EtiquetasDisenos.limpiar(obj), idd = obj.id || EtiquetasGuardado.nuevoId('d');
        dis.id = idd;
        E.guardado = await EtiquetasGuardado.cambiar(function (d) {
          var i = d.disenos.findIndex(function (x) { return x.id === idd; });
          if (i === -1) d.disenos.push(dis); else d.disenos[i] = dis;
        });
        E.disenoId = idd;
        EtiquetasGuardado.recordar('diseno', idd);
      }
      E.editor = null;
      U.aviso('Guardado.', 'bueno');
      pintar();
    } catch (e) { U.fallo('No he podido guardar', e); }
  }

  async function borrarModelo(m) {
    if (!m || !m.propio || !(await U.preguntar('Borrar el modelo', '<p>Se borra el modelo «' + esc(m.nombre) + '».</p>', 'Sí, borrarlo'))) return;
    try { E.guardado = await EtiquetasGuardado.cambiar(function (d) { d.modelos = d.modelos.filter(function (x) { return x.id !== m.id; }); }); E.modeloId = null; vaciarHuecos(); pintar(); }
    catch (e) { U.fallo('No he podido borrar el modelo', e); }
  }

  async function borrarDiseno(d) {
    if (!d || d.integrado || !(await U.preguntar('Borrar el diseño', '<p>Se borra el diseño «' + esc(d.nombre) + '».</p>', 'Sí, borrarlo'))) return;
    try { E.guardado = await EtiquetasGuardado.cambiar(function (x) { x.disenos = x.disenos.filter(function (y) { return y.id !== d.id; }); }); E.disenoId = null; pintar(); }
    catch (e) { U.fallo('No he podido borrar el diseño', e); }
  }

  /* ---------- las tarjetas Hoja, Diseño y Orden (js/etiquetas-tarjetas.js) ---------- */

  var ganchos = {
    E: E, nor: nor, modelos: modelos, disenos: disenos, vale: vale, soloConsulta: soloConsulta,
    elegirModelo: function (id) { E.modeloId = id; vaciarHuecos(); EtiquetasGuardado.recordar('modelo', id); pintar(); },
    elegirDiseno: function (id) { E.disenoId = id; EtiquetasGuardado.recordar('diseno', id); pintar(); },
    elegirOrden: function (id) { E.orden = id; E.tarjeta = ''; EtiquetasGuardado.recordar('orden', id); pintar(); },
    nuevoModelo: function () { abrirEditorModelo(null); },
    cambiarModelo: function () { abrirEditorModelo(modeloActual()); },
    borrarModelo: function () { borrarModelo(modeloActual()); },
    nuevoDiseno: function () {
      E.editor = { tipo: 'diseno', titulo: 'Nuevo diseño', diseno: { nombre: '', para: E.clase, unaPorFamilia: false, renglones: [EtiquetasDisenos.nuevoRenglon()] } };
      pintar();
    },
    duplicarDiseno: function () {
      var d = JSON.parse(JSON.stringify(disenoActual()));
      delete d.id; delete d.integrado; d.nombre = 'Copia de ' + d.nombre;
      E.editor = { tipo: 'diseno', titulo: 'Duplicar el diseño', diseno: d }; pintar();
    },
    cambiarDiseno: function () { abrirEditorDiseno(disenoActual()); },
    borrarDiseno: function () { borrarDiseno(disenoActual()); },
    editor: {
      guardar: function (obj) { return guardarEditor(obj); }, cancelar: function () { E.editor = null; pintar(); },
      cambio: function () { pintarVista(); }, repintar: function () { pintar(); }
    }
  };

  /* ---------- el trabajo a medias: una pestaña cada vez, y recordado en este ordenador (fila 450) ---------- */

  I.pintar = pintar;
  I.pintarVista = pintarVista;
  I.hacerPegado = hacerPegado;
  I.pegar = pegar;
})();
