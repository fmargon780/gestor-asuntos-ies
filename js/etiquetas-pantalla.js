/* ============================================================
   etiquetas-pantalla.js — la pantalla «Etiquetas» de Herramientas (fila 344, docs/ETIQUETAS.md).

   A todo el ancho: a la izquierda, a quién (el filtro del reparto, js/repartir-filtro.js) y las copias; a la
   derecha, las tarjetas Hoja, Diseño y Orden (js/etiquetas-tarjetas.js) y debajo la vista previa de las hojas tal
   cual saldrán; abajo, el pie fijo con las cuentas y «Guardar PDF» e «Imprimir». Se abre desde Herramientas o, con
   las personas de un asunto de grupo ya elegidas, desde su tarjeta «Personas del grupo». Imprimir no escribe nada;
   solo guardar un modelo o un diseño.

   Fila 450 (docs/ETIQUETAS-RECUERDA-TU-TRABAJO.md): el trabajo a medias se recuerda solo en este ordenador
   (`EtiquetasGuardado.trabajo()`), cada pestaña (Alumnado, Personal) con lo suyo: `E.pest[clase]` guarda sus
   huecos, desmarcadas, añadidas, lista pegada y el orden en que entraron las personas; E.gastadas, E.quitadas,
   E.anadidas, E.entrada y E.pegado son los de la pestaña que se ve. Sin grupo, clase, departamento, lista pegada
   ni nadie buscado, no hay nadie elegido y la hoja sale vacía.

   Los cálculos viven en js/etiquetas-datos.js, -disenos.js, -hoja.js y -modelos.js; el PDF, en -pdf.js; los
   formularios, en -editor.js; lo guardado (`_GESTOR/etiquetas.json`), en -guardado.js.
   ============================================================ */
var EtiquetasPantalla = (function () {

  var E = { abierta: false, listo: false, turno: 0, clase: 'alumnado', copias: 1, gastadas: {}, quitadas: {}, anadidas: {}, entrada: [], vistas: {}, pegado: null,
            personal: { clase: '', depto: '', todo: false }, pest: null, orden: 'grupo', tarjeta: '',
            guardado: { modelos: [], disenos: [] }, editor: null, base: null, volverA: null, listaAbierta: false, medir: null };
  var CLASES = ['alumnado', 'personal'];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function clave(p) { return PersonasFamilias.claveAlumno(p); }

  /* ---------- modelos y diseños ---------- */

  function modelos() {
    return EtiquetasModelos.todos().concat(E.guardado.modelos.map(function (m) { var c = Object.assign({}, m); c.propio = true; return c; }));
  }
  function disenos() {
    return EtiquetasDisenos.integrados().concat(E.guardado.disenos.map(function (d) { return EtiquetasDisenos.limpiar(d); }));
  }
  function modeloActual() {
    var bo = E.editor && E.editor.tipo === 'modelo' ? E.editor.modelo : null;
    if (bo && bo.filas && bo.columnas && !EtiquetasModelos.problema(bo)) return Object.assign({}, bo, { id: 'borrador' });
    var l = modelos();
    return l.filter(function (m) { return m.id === E.modeloId; })[0] || l.filter(function (m) { return m.id === 'avery-L7160'; })[0] || l[0];
  }
  function vale(d) { return d.para === 'ambos' || d.para === E.clase; }
  function disenoActual() {
    if (E.editor && E.editor.tipo === 'diseno') return EtiquetasDisenos.limpiar(E.editor.diseno);
    var l = disenos().filter(vale);
    return l.filter(function (d) { return d.id === E.disenoId; })[0] || l.filter(function (d) { return d.id === (E.clase === 'personal' ? 'profesor' : 'alumno'); })[0] || l[0];
  }

  /* ---------- a quién ---------- */

  function nor(t) { return U.normalizar(String(t || '')); }

  function sinSalir(lista) { return lista.filter(function (p) { return !E.quitadas[clave(p)]; }); }

  /* `fichas`: { línea normalizada: su puesto en la lista pegada (desde 1) }. 0 = no está. */
  function puestoEnPegado(pegado, p) {
    var x = EtiquetasDatos.partes(p.nombre), f = pegado.fichas, mejor = 0;
    [nor(p.nombre), nor((x.pila + ' ' + x.apellidos).trim()), p.id ? nor(p.id) : null].forEach(function (k) {
      if (k && f[k] && (!mejor || f[k] < mejor)) mejor = f[k];
    });
    return mejor;
  }

  function porPegado(lista, pegado) {
    pegado = pegado === undefined ? E.pegado : pegado;
    if (!pegado) return lista;
    return lista.filter(function (p) { return puestoEnPegado(pegado, p) > 0; });
  }

  /* Hay alguien elegido de partida: grupo/clase/departamento, un asunto de grupo o una lista pegada. */
  function criterioActivo() {
    if (E.pegado) return true;
    return E.clase === 'alumnado' ? !!(E.base || (E.filtro && E.filtro.activo())) : !!(E.personal.clase || E.personal.depto || E.personal.todo);
  }

  /* Fila 350: las personas que suma el buscador, de esta clase (alumnado o personal). */
  function anadidasLista() { return Object.keys(E.anadidas).map(function (k) { return E.anadidas[k]; }); }

  /* Las personas de la lista con casilla: las del filtro y las que suma el buscador. Sin grupo, clase, departamento,
     lista pegada ni grupo de partida no hay nadie de partida (fila 450): solo salen las que suma el buscador. */
  function candidatas() {
    var lista = [];
    if (!criterioActivo()) lista = [];
    else if (E.clase === 'alumnado') {
      lista = E.base || E.matriculados || [];
      if (E.filtro && E.filtro.activo()) {
        var dentro = {};
        E.filtro.todas().forEach(function (p) { dentro[clave(p)] = true; });
        lista = lista.filter(function (p) { return dentro[clave(p)]; });
      }
    } else {
      lista = (E.personal.lista || []).filter(function (p) {
        if (E.personal.clase && p.tipoPersonal !== E.personal.clase) return false;
        if (E.personal.depto && EtiquetasDatos.valores(p, 'personal', {}).departamento !== E.personal.depto) return false;
        return true;
      });
    }
    var extra = anadidasLista();
    var salida = porPegado(lista);
    var vistos = {};
    salida.forEach(function (p) { vistos[clave(p)] = true; });
    extra.forEach(function (p) { if (!vistos[clave(p)]) { vistos[clave(p)] = true; salida.push(p); } });
    return salida;
  }

  function personasElegidas() { return sinSalir(candidatas()); }

  /* Fila 345: la lista del filtro de personal (clase y departamento, sin la lista pegada) para «Exportar la lista ▾». */
  function listaDePersonal() {
    var criterios = [];
    if (E.personal.clase) criterios.push({ texto: 'Clase de personal: ' + (E.personal.clase === 'docente' ? 'Docente' : 'No docente'), columna: 'Clase de personal',
      valor: function (p) { return p.tipoPersonal === 'docente' ? 'Docente' : (p.tipoPersonal ? 'No docente' : ''); } });
    if (E.personal.depto) criterios.push({ texto: 'Departamento: ' + E.personal.depto, columna: 'Departamento',
      valor: function (p) { return EtiquetasDatos.valores(p, 'personal', {}).departamento; } });
    if (!criterios.length) return { filas: [] };
    var lista = (E.personal.lista || []).filter(function (p) {
      if (E.personal.clase && p.tipoPersonal !== E.personal.clase) return false;
      return !(E.personal.depto && EtiquetasDatos.valores(p, 'personal', {}).departamento !== E.personal.depto);
    });
    return FiltroExportar.listaDePersonal(sinSalir(lista), criterios);   /* fila 350: solo las marcadas */
  }

  function exportarPersonal(panel) {
    var b = panel.querySelector('.filtro-exportar-boton');
    if (b) b.disabled = !listaDePersonal().filas.length;
  }

  function ctx() { return { centro: (window.Plantillas && Plantillas.POR_DEFECTO_CENTRO) || 'IES Fuente Lucena', curso: U.cursoActual() }; }

  /* Fila 450, orden «en el orden en que los marco»: bloque 0 = las que entraron de golpe (por grupo y apellidos, o por
     el puesto en la lista pegada); después, una a una, las añadidas o vueltas a marcar, en el orden en que se marcaron. */
  function rango(p) {
    var i = E.entrada.indexOf(clave(p));
    if (i !== -1) return { b: 1 + i, n: null };
    var n = E.pegado ? puestoEnPegado(E.pegado, p) : 0;
    return { b: 0, n: n || null };
  }

  function calcular() {
    var personas = personasElegidas(), diseno = disenoActual(), modelo = modeloActual();
    E.personasN = personas.length;
    E.items = EtiquetasHoja.construir(personas, E.clase, diseno, { copias: E.copias, indice: E.indice, ctx: ctx(), orden: E.orden, rango: rango });
    E.pag = EtiquetasHoja.paginar(E.items, modelo, E.gastadas);
    E.prep = EtiquetasHoja.preparar(E.items, diseno, modelo, E.medir);
    E.diseno = diseno; E.modelo = modelo;
  }

  /* ---------- pintar ---------- */

  var CLASES_PERSONAL = [{ valor: '', texto: 'Todo el personal' }, { valor: 'docente', texto: 'Docente' }, { valor: 'no-docente', texto: 'No docente' }];
  function textoClasePersonal() {
    var c = CLASES_PERSONAL.filter(function (o) { return o.valor === (E.personal.clase || ''); })[0];
    if (c && c.valor) return c.texto;
    return E.personal.todo ? 'Todo el personal' : '';
  }
  function departamentos() {
    var deptos = {};
    (E.personal.lista || []).forEach(function (p) { var d = EtiquetasDatos.valores(p, 'personal', {}).departamento; if (d) deptos[d] = true; });
    return Object.keys(deptos).sort();
  }

  /* Fila 350: lo que encuentra el buscador (3 letras o más): alumnado por apellidos, nombre o nº escolar; personal por
     apellidos, nombre o los 4 últimos del documento. Hasta 10, con su unidad o departamento. */
  function buscarPersonas(texto) {
    var palabras = nor(texto).split(/\s+/).filter(Boolean);
    var alumnado = E.clase === 'alumnado';
    var pool = alumnado ? (E.matriculados || []) : (E.personal.lista || []);
    var salida = [];
    pool.forEach(function (p) {
      var v = alumnado ? null : EtiquetasDatos.valores(p, 'personal', {});
      var documento = v ? String(v.dni || '') : '';
      var pajar = nor(p.nombre) + ' ' + (alumnado ? nor(p.id) : nor(documento.slice(-4)));
      if (palabras.every(function (w) { return pajar.indexOf(w) !== -1; })) {
        salida.push({ valor: clave(p), texto: p.nombre, detalle: alumnado ? (p.unidad || '') : (v.departamento || ''), persona: p });
      }
    });
    salida.sort(function (a, b) { return nor(a.texto) < nor(b.texto) ? -1 : (nor(a.texto) > nor(b.texto) ? 1 : 0); });
    return salida.slice(0, 10);
  }

  function elegirPersona(o) {
    var aviso = $('et-buscar-aviso'), k = o.valor;
    function decir(t) { if (aviso) aviso.textContent = t; }
    var yaEsta = candidatas().some(function (p) { return clave(p) === k; });
    if (E.anadidas[k] || yaEsta) {
      if (E.quitadas[k]) { delete E.quitadas[k]; entrar(k); decir('Estaba desmarcada en la lista: la he vuelto a marcar.'); pintarVista(); }
      else decir('Ya está en la lista.');
      return;
    }
    E.anadidas[k] = o.persona;
    entrar(k);
    decir('Añadida: ' + o.texto + '.');
    pintarVista();
  }

  function htmlAQuien() {
    var h = '<div class="et-pestanas">' +
      ['alumnado', 'personal'].map(function (c) {
        return '<button type="button" class="boton et-pestana' + (E.clase === c ? ' et-activa' : '') + '" data-clase="' + c + '" data-solo-lectura>' + (c === 'alumnado' ? 'Alumnado' : 'Personal') + '</button>';
      }).join('') + '</div>';
    /* Fila 350: el buscador de personas, a partir de 3 letras, según la clase elegida. */
    h += '<div class="et-buscar-persona">' + CajaConSugerencias.html('et-buscar-persona', { placeholder: 'Buscar a una persona…' }) +
      '<p class="et-buscar-aviso" id="et-buscar-aviso" aria-live="polite"></p></div>';
    if (E.clase === 'alumnado') {
      h += E.filtro ? RepartirFiltro.html(E.filtro) : '<p class="explica">No hay alumnado cargado.</p>';
    } else {
      h += '<div class="et-fila"><div class="etiqueta">Clase de personal ' + CajaConSugerencias.html('et-pclase', { valor: textoClasePersonal(), placeholder: 'Todo el personal' }) + '</div>' +
        '<div class="etiqueta">Departamento ' + CajaConSugerencias.html('et-pdepto', { valor: E.personal.depto, placeholder: 'Todos' }) + '</div></div>' +
        FiltroExportar.botonHTML(false);   /* fila 345: se enciende en listaDePersonal() cuando hay criterio */
    }
    h += '<details class="et-pegar"' + (E.pegado ? ' open' : '') + '><summary>Pegar una lista' + (E.pegado ? ' (' + E.pegado.cuantas + ')' : '') + '</summary>' +
      '<p class="explica">Un nombre o un número escolar por línea. Solo saldrán esas personas.</p>' +
      '<textarea class="campo" id="et-pegado" rows="4" data-solo-lectura>' + esc(E.pegado ? E.pegado.texto : '') + '</textarea>' +
      '<div class="et-botones"><button type="button" class="boton" id="et-pegar-usar" data-solo-lectura>Usar esta lista</button>' +
      (E.pegado ? '<button type="button" class="boton" id="et-pegar-quitar" data-solo-lectura>Quitar la lista</button>' : '') + '</div>' +
      '<p class="explica" id="et-pegado-aviso">' + esc(E.pegado ? E.pegado.aviso : '') + '</p></details>';
    h += '<div class="et-botones"><button type="button" class="boton" id="et-empezar" data-solo-lectura>Empezar de cero</button></div>' +
      '<p class="et-resumen" id="et-resumen" aria-live="polite"></p><div id="et-lista"></div>';
    return h;
  }

  function htmlPanel() {
    return '<section class="et-seccion"><h4>A quién</h4>' + htmlAQuien() + '</section>' +
      '<section class="et-seccion"><h4>Copias y hoja empezada</h4>' +
        '<label class="etiqueta">Copias por persona <input class="campo et-copias" id="et-copias" type="number" min="1" max="50" value="' + E.copias + '" data-solo-lectura></label>' +
        '<p class="explica">Pulsa o arrastra sobre las etiquetas ya gastadas de cualquier hoja.</p>' +
        '<button type="button" class="boton" id="et-hoja-nueva" data-solo-lectura>Quitar todos los huecos</button></section>';
  }

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

  function vaciar(o) { Object.keys(o).forEach(function (k) { delete o[k]; }); }
  function pestanaNueva() { return { gastadas: {}, quitadas: {}, anadidas: {}, entrada: [], pegado: null }; }
  function nuevoTrabajo() { E.pest = { alumnado: pestanaNueva(), personal: pestanaNueva() }; }

  /* Los huecos dependen de la hoja: al cambiar de modelo se quitan en las dos pestañas. */
  function vaciarHuecos() { CLASES.forEach(function (c) { vaciar(E.pest[c].gastadas); }); }

  function guardarEnPestana() {
    var P = E.pest[E.clase];
    P.pegado = E.pegado; P.entrada = E.entrada;
  }

  function cargarPestana(c) {
    var P = E.pest[c];
    E.clase = c;
    E.gastadas = P.gastadas; E.quitadas = P.quitadas; E.anadidas = P.anadidas; E.entrada = P.entrada; E.pegado = P.pegado;
    E.vistas = Object.assign({}, E.quitadas);
    if (E.filtro && c === 'alumnado') { E.filtro.desmarcadas = E.quitadas; E.filtro.cache = null; E.filtro.cacheMarcadas = null; }
  }

  function cambiarPestana(c) {
    if (c === E.clase) return;
    guardarEnPestana();
    cargarPestana(c);
  }

  /* Una persona entra en la selección «una a una»: va detrás de las que entraron de golpe. */
  function salir(k) { var i = E.entrada.indexOf(k); if (i !== -1) E.entrada.splice(i, 1); }
  function entrar(k) { salir(k); E.entrada.push(k); delete E.vistas[k]; }

  /* Tras marcar o desmarcar en la lista: las que se acaban de volver a marcar pasan al final. */
  function notarMarcadas() {
    Object.keys(E.vistas).forEach(function (k) { if (!E.quitadas[k]) entrar(k); });
    E.vistas = Object.assign({}, E.quitadas);
  }

  function empezarDeCero() {
    vaciar(E.anadidas); vaciar(E.quitadas); vaciar(E.gastadas); vaciar(E.vistas); E.entrada.length = 0;
    E.pegado = null; E.copias = 1;
    if (E.clase === 'alumnado') {
      E.base = null;
      if (E.filtro) { E.filtro.conds = []; E.filtro.antiguos = false; E.filtro.abierto = false; E.filtro.cache = null; E.filtro.cacheMarcadas = null; }
    } else E.personal.clase = E.personal.depto = '', E.personal.todo = false;
    pintar();
  }

  function claves(o) { return Object.keys(o); }

  function guardarTrabajo() {
    if (!E.listo) return;
    guardarEnPestana();
    var t = { v: 1, clase: E.clase, copias: E.copias };
    CLASES.forEach(function (c) {
      var P = E.pest[c];
      t[c] = { anadidas: claves(P.anadidas), quitadas: claves(P.quitadas), entrada: P.entrada.slice(), gastadas: claves(P.gastadas), pegado: P.pegado ? P.pegado.texto : null };
    });
    t.alumnado.conds = E.filtro ? E.filtro.conds : [];
    t.alumnado.antiguos = !!(E.filtro && E.filtro.antiguos);
    t.alumnado.base = E.base ? E.base.map(clave) : null;
    t.personal.clase = E.personal.clase; t.personal.depto = E.personal.depto; t.personal.todo = !!E.personal.todo;
    EtiquetasGuardado.guardarTrabajo(t);
  }

  /* Lo guardado vuelve a la pantalla; quien ya no está en los listados simplemente no sale. */
  function restaurar(t) {
    if (!t || t.v !== 1) return;
    CLASES.forEach(function (c) {
      var s = t[c], P = E.pest[c];
      if (!s) return;
      var lista = c === 'alumnado' ? (E.matriculados || []) : (E.personal.lista || []), por = {};
      lista.forEach(function (p) { por[clave(p)] = p; });
      (Array.isArray(s.anadidas) ? s.anadidas : []).forEach(function (k) { if (por[k]) P.anadidas[k] = por[k]; });
      (Array.isArray(s.quitadas) ? s.quitadas : []).forEach(function (k) { P.quitadas[k] = true; });
      (Array.isArray(s.entrada) ? s.entrada : []).forEach(function (k) { if (typeof k === 'string') P.entrada.push(k); });
      (Array.isArray(s.gastadas) ? s.gastadas : []).forEach(function (k) { P.gastadas[k] = true; });
      if (typeof s.pegado === 'string') P.pegado = hacerPegado(s.pegado, lista);
    });
    var a = t.alumnado || {};
    if (E.filtro && Array.isArray(a.conds)) {
      E.filtro.conds = a.conds.filter(function (c) { return c && typeof c.tipo === 'string' && typeof c.valor === 'string'; });
      E.filtro.antiguos = !!a.antiguos;
      E.filtro.abierto = E.filtro.conds.length > 0;
    }
    if (Array.isArray(a.base)) {
      var por2 = {};
      (E.matriculados || []).forEach(function (p) { por2[clave(p)] = p; });
      var base = a.base.map(function (k) { return por2[k]; }).filter(Boolean);
      if (base.length) E.base = base;
    }
    var pe = t.personal || {};
    if (pe.clase === 'docente' || pe.clase === 'no-docente') E.personal.clase = pe.clase;
    if (typeof pe.depto === 'string') E.personal.depto = pe.depto;
    E.personal.todo = !!pe.todo && !E.personal.clase;
    if (typeof t.copias === 'number') E.copias = Math.max(1, Math.min(50, Math.round(t.copias) || 1));
    if (t.clase === 'personal') E.clase = 'personal';
  }

  /* ---------- PDF e imprimir ---------- */

  async function bytes() {
    calcular();
    return EtiquetasPdf.generar(E.pag, E.modelo, E.prep);
  }

  async function guardarPdf() {
    try {
      var b = new Blob([await bytes()], { type: 'application/pdf' });
      descargar(b, EtiquetasPdf.nombreDeFichero(E.diseno, new Date()));
    } catch (e) { U.fallo('No he podido hacer el PDF', e); }
  }

  function descargar(blob, nombre) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  async function imprimir() {
    try {
      var url = URL.createObjectURL(new Blob([await bytes()], { type: 'application/pdf' }));
      var marco = document.createElement('iframe');
      marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
      marco.onload = function () {
        try { marco.contentWindow.focus(); marco.contentWindow.print(); }
        catch (e) { window.open(url, '_blank'); }
        setTimeout(function () { marco.remove(); URL.revokeObjectURL(url); }, 60000);
      };
      marco.src = url;
      document.body.appendChild(marco);
    } catch (e) { U.fallo('No he podido preparar la impresión', e); }
  }

  /* ---------- abrir y cerrar ---------- */

  async function cargarDatos(op) {
    var fuenteAl = await Datos.cargar(App.E.datos, 'ALUMNADO');
    E.matriculados = (fuenteAl.lista || []).filter(function (p) { return p.matriculado; });
    E.indice = PersonasFamilias.indice(E.matriculados);
    E.filtro = null;
    try { E.filtro = await RepartirFiltro.crear({ lista: E.matriculados }, [], { sinLista: true }); } catch (e) { E.filtro = null; }
    if (E.filtro) { E.filtro.clave = clave; E.filtro.desmarcadas = E.quitadas; }   /* fila 350: lo desmarcado en la lista vale también para exportar */
    var fuentePe = null;
    try { fuentePe = await Datos.cargar(App.E.datos, 'PERSONAL'); } catch (e) { fuentePe = null; }
    E.personal.lista = fuentePe ? (fuentePe.lista || []).filter(function (p) { return p.enElCentro; }) : [];
    E.base = null;
    if (op.nombres) {
      var por = {};
      E.matriculados.forEach(function (p) { por[App.textoTercero(p)] = p; por[p.nombre] = p; });
      E.base = op.nombres.map(function (n) { return por[n]; }).filter(Boolean);
    }
  }

  async function abrir(op) {
    op = op || {};
    var herr = $('pantalla-herramientas');
    if (herr && herr.classList.contains('oculto') && App.ir) App.ir('herramientas');
    var l = $('herramientas-lista'), vista = $('etiquetas-vista');
    if (!vista) return;
    E.abierta = true; E.volverA = op.asunto ? { asunto: op.asunto, modo: op.modo || 'abierto' } : null;
    E.listo = false; E.editor = null; E.copias = 1; E.tarjeta = ''; E.personal = { clase: '', depto: '', todo: false, lista: [] };
    nuevoTrabajo(); cargarPestana('alumnado');
    var ult = EtiquetasGuardado.ultimo();
    E.modeloId = ult.modelo || null; E.disenoId = ult.diseno || null;
    E.orden = EtiquetasTarjetas.ORDENES.some(function (o) { return o.id === ult.orden; }) ? ult.orden : 'grupo';
    if (l) l.classList.add('oculto');
    ['control-registro-vista', 'plantillas-vista', 'actividades-vista'].forEach(function (id) { var o = $(id); if (o) o.classList.add('oculto'); });
    vista.classList.remove('oculto');
    vista.innerHTML = '<p class="explica">Preparando las etiquetas…</p>';
    var mio = ++E.turno;
    try {
      E.guardado = await EtiquetasGuardado.leer();
      await cargarDatos(op);
      E.medir = await EtiquetasPdf.medidor();
    } catch (e) { if (mio === E.turno) { vista.innerHTML = '<p class="aviso aviso-ambar">No he podido preparar las etiquetas: ' + esc(e && e.message) + '</p>'; } return; }
    if (mio !== E.turno) return;
    /* Desde «Personas del grupo» empieza con esas personas y sustituye lo guardado; si no, vuelve lo que se dejó. */
    if (!op.nombres) { restaurar(EtiquetasGuardado.trabajo()); cargarPestana(E.clase); }
    E.listo = true;
    pintar();
  }

  /* Desde la tarjeta «Personas del grupo»: sus personas ya elegidas. */
  function abrirDesdeGrupo(a, modo) {
    var rel = ((window.App && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {}).relacionados || [];
    return abrir({ asunto: a, modo: modo, nombres: rel.map(function (r) { return r.nombre; }) });
  }

  function cerrar() {
    E.abierta = false; E.listo = false; E.volverA = null; E.turno++;
    var l = $('herramientas-lista'), vista = $('etiquetas-vista');
    if (l) l.classList.remove('oculto');
    if (vista) { vista.classList.add('oculto'); vista.innerHTML = ''; }
    var b = $('etiquetas-abrir');
    if (b && !b.onclick) b.onclick = function () { return abrir(); };
  }

  function enlazarBloque() {
    var b = $('etiquetas-abrir');
    if (b && !b.onclick) b.onclick = function () { return abrir(); };
  }

  return { abrir: abrir, abrirDesdeGrupo: abrirDesdeGrupo, cerrar: cerrar, enlazarBloque: enlazarBloque, estaAbierta: function () { return E.abierta; } };
})();
window.EtiquetasPantalla = EtiquetasPantalla;
