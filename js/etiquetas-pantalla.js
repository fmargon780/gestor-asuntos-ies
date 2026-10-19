/* ============================================================
   etiquetas-pantalla.js — la pantalla «Etiquetas» de Herramientas (fila 344, docs/ETIQUETAS.md).

   A todo el ancho: a la izquierda, a quién (el filtro del reparto, js/repartir-filtro.js), la hoja, el diseño
   y las copias; a la derecha, la vista previa de las hojas tal cual saldrán; abajo, el pie fijo con las cuentas
   y «Guardar PDF» e «Imprimir». Se abre desde Herramientas o, con las personas de un asunto de grupo ya
   elegidas, desde su tarjeta «Personas del grupo». Imprimir no escribe nada; solo guardar un modelo o un diseño.

   Los cálculos viven en js/etiquetas-datos.js, -disenos.js, -hoja.js y -modelos.js; el PDF, en -pdf.js; los
   formularios, en -editor.js; lo guardado (`_GESTOR/etiquetas.json`), en -guardado.js.
   ============================================================ */
var EtiquetasPantalla = (function () {

  var E = { abierta: false, turno: 0, clase: 'alumnado', copias: 1, gastadas: {}, quitadas: {}, anadidas: {}, pegado: null, personal: { clase: '', depto: '' },
            guardado: { modelos: [], disenos: [] }, editor: null, base: null, volverA: null, listaAbierta: false, medir: null };

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

  function porPegado(lista) {
    if (!E.pegado) return lista;
    var fichas = E.pegado.fichas;
    return lista.filter(function (p) {
      var x = EtiquetasDatos.partes(p.nombre);
      return fichas[nor(p.nombre)] || fichas[nor((x.pila + ' ' + x.apellidos).trim())] || (p.id && fichas[nor(p.id)]);
    });
  }

  function criterioActivo() {
    return E.clase === 'alumnado' ? !!(E.filtro && E.filtro.activo()) : !!(E.personal.clase || E.personal.depto);
  }

  /* Fila 350: las personas que suma el buscador, de esta clase (alumnado o personal). */
  function anadidasLista() { return Object.keys(E.anadidas).map(function (k) { return E.anadidas[k]; }); }

  /* Las personas de la lista con casilla: las del filtro (o todas, sin filtro) y las que suma el buscador. Sin ningún
     filtro ni lista pegada ni grupo de partida, y con alguien elegido en el buscador, solo salen las elegidas. */
  function candidatas() {
    var lista;
    if (E.clase === 'alumnado') {
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
    var soloLasElegidas = extra.length && !criterioActivo() && !E.base && !E.pegado;
    var salida = soloLasElegidas ? [] : porPegado(lista);
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

  function calcular() {
    var personas = personasElegidas(), diseno = disenoActual(), modelo = modeloActual();
    E.personasN = personas.length;
    E.items = EtiquetasHoja.construir(personas, E.clase, diseno, { copias: E.copias, indice: E.indice, ctx: ctx() });
    E.pag = EtiquetasHoja.paginar(E.items, modelo, E.gastadas);
    E.prep = EtiquetasHoja.preparar(E.items, diseno, modelo, E.medir);
    E.diseno = diseno; E.modelo = modelo;
  }

  /* ---------- pintar ---------- */

  function opciones(lista, actual, texto) {
    return lista.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === actual ? ' selected' : '') + '>' + esc(texto(o)) + '</option>'; }).join('');
  }

  var CLASES_PERSONAL = [{ valor: '', texto: 'Todo el personal' }, { valor: 'docente', texto: 'Docente' }, { valor: 'no-docente', texto: 'No docente' }];
  function textoClasePersonal() {
    var c = CLASES_PERSONAL.filter(function (o) { return o.valor === (E.personal.clase || ''); })[0];
    return c && c.valor ? c.texto : '';
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
    /* Sin filtro ni nadie elegido, en la lista están todas: elegir a una deja solo esa, no «ya estaba». */
    var todosPorDefecto = !anadidasLista().length && !criterioActivo() && !E.base && !E.pegado;
    var yaEsta = !todosPorDefecto && candidatas().some(function (p) { return clave(p) === k; });
    if (E.anadidas[k] || yaEsta) {
      if (E.quitadas[k]) { delete E.quitadas[k]; decir('Estaba desmarcada en la lista: la he vuelto a marcar.'); pintarVista(); }
      else decir('Ya está en la lista.');
      return;
    }
    E.anadidas[k] = o.persona;
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
    h += '<p class="et-resumen" id="et-resumen" aria-live="polite"></p><div id="et-lista"></div>';
    return h;
  }

  function htmlHoja() {
    var l = modelos(), m = E.modelo || modeloActual();
    var propio = !!(m && m.propio);
    return '<label class="etiqueta">Buscar por código o por filas × columnas <input class="campo" id="et-buscar-modelo" data-solo-lectura value="' + esc(E.buscarModelo || '') + '" placeholder="L7160, 3x8…"></label>' +
      '<select class="campo" id="et-modelo" data-solo-lectura>' + opciones(filtrarModelos(l, E.buscarModelo, m.id), m.id, function (x) { return x.nombre + ' · ' + x.columnas + ' × ' + x.filas + (x.propio ? ' (propio)' : ''); }) + '</select>' +
      '<p class="explica" id="et-medida-modelo">' + esc(EtiquetasModelos.texto(m)) + '</p>' +
      '<div class="et-botones"><button type="button" class="boton" id="et-modelo-nuevo"' + (soloConsulta() ? ' disabled' : '') + '>Nuevo modelo</button>' +
      '<button type="button" class="boton" id="et-modelo-cambiar"' + (soloConsulta() ? ' disabled' : '') + '>Cambiar</button>' +
      (propio ? '<button type="button" class="boton" id="et-modelo-borrar"' + (soloConsulta() ? ' disabled' : '') + '>Borrar este modelo</button>' : '') + '</div>';
  }

  function filtrarModelos(l, texto, actual) {
    var q = nor(texto).replace(/\s+/g, '').replace(/[x×]/g, 'x');
    if (!q) return l;
    return l.filter(function (m) {
      if (m.id === actual) return true;
      var a = nor(m.nombre + (m.codigo || '') + (m.apli || '')).replace(/\s+/g, ''), b = (m.filas + 'x' + m.columnas), c = (m.columnas + 'x' + m.filas);
      return a.indexOf(q) !== -1 || b === q || c === q;
    });
  }

  function htmlDiseno() {
    var l = disenos().filter(vale), d = disenoActual();
    var propio = !!d && !d.integrado && !(E.editor && E.editor.tipo === 'diseno');
    var ALINEA = { centro: ' · centrado', der: ' · a la derecha' };
    var off = soloConsulta() ? ' disabled' : '';
    return '<select class="campo" id="et-diseno" data-solo-lectura>' + opciones(l, d.id, function (x) { return x.nombre + (x.integrado ? '' : ' (propio)'); }) + '</select>' +
      '<ul class="et-renglones-ver">' + d.renglones.map(function (x) {
        var c = EtiquetasDatos.CAMPOS.filter(function (k) { return k.clave === x.dato; })[0];
        return '<li>' + esc(x.dato === 'texto' ? '«' + x.texto + '»' : (c ? c.texto : x.dato)) + (x.negrita ? ' · negrita' : '') + (ALINEA[x.alinea] || '') + '</li>';
      }).join('') + (d.vertical === 'arriba' || d.vertical === 'abajo' ? '<li>Texto ' + d.vertical + '</li>' : '') + '</ul>' +
      (d.unaPorFamilia ? '<p class="explica">Una etiqueta por familia: los hermanos salen juntos.</p>' : '') +
      '<div class="et-botones"><button type="button" class="boton" id="et-diseno-nuevo"' + off + '>Nuevo diseño</button>' +
      '<button type="button" class="boton" id="et-diseno-duplicar"' + off + '>Duplicar</button>' +
      '<button type="button" class="boton" id="et-diseno-editar"' + off + '>Cambiar</button>' +
      (propio ? '<button type="button" class="boton" id="et-diseno-borrar"' + off + '>Borrar</button>' : '') + '</div>';
  }

  function htmlPanel() {
    if (E.editor) return EtiquetasEditor.html(E.editor);
    return '<section class="et-seccion"><h4>A quién</h4>' + htmlAQuien() + '</section>' +
      '<section class="et-seccion"><h4>Hoja de etiquetas</h4>' + htmlHoja() + '</section>' +
      '<section class="et-seccion"><h4>Qué lleva cada etiqueta</h4>' + htmlDiseno() + '</section>' +
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
      '<div class="et-vista" id="et-vista-hojas"></div></div>' +
      '<div class="et-pie" id="et-pie"></div>';
    enganchar();
    pintarVista();
  }

  function pintarVista() {
    calcular();
    var cont = $('et-vista-hojas');
    if (!cont) return;
    var ancho = Math.max(300, cont.clientWidth - 24);
    var escala = Math.max(1.2, Math.min(3, ancho / 210));
    cont.innerHTML = EtiquetasHoja.vistaHtml(E.pag, E.modelo, E.prep, escala);
    var sinDir = 0, cortas = 0;
    E.items.forEach(function (it, i) {
      if (E.items.indexOf(it) !== i) return;
      if (it.sinDireccion) sinDir++;
      if (E.prep.get(it).corto) cortas++;
    });
    var res = $('et-resumen');
    if (res) res.textContent = E.personasN + (E.personasN === 1 ? ' persona' : ' personas') + ' · ' + E.items.length + (E.items.length === 1 ? ' etiqueta' : ' etiquetas');
    var lista = $('et-lista');
    if (lista && !E.editor) lista.innerHTML = htmlLista();
    if (lista && !E.editor) engancharLista();
    var avisos = (sinDir ? '<span class="et-aviso-pie">' + sinDir + (sinDir === 1 ? ' familia sin dirección' : ' familias sin dirección') + '</span>' : '') +
      (cortas ? '<span class="et-aviso-pie">' + cortas + (cortas === 1 ? ' etiqueta con el texto cortado' : ' etiquetas con el texto cortado') + '</span>' : '');
    $('et-pie').innerHTML =
      '<span class="et-pie-cuenta" id="et-cuenta">' + E.pag.hojas.length + (E.pag.hojas.length === 1 ? ' hoja' : ' hojas') + ' · ' + E.items.length + (E.items.length === 1 ? ' etiqueta' : ' etiquetas') + '</span>' + avisos +
      '<span class="et-pie-botones"><button type="button" class="boton" id="et-guardar-pdf" data-solo-lectura' + (E.items.length ? '' : ' disabled') + '>Guardar PDF</button>' +
      '<button type="button" class="boton boton-principal" id="et-imprimir" data-solo-lectura' + (E.items.length ? '' : ' disabled') + '>Imprimir</button></span>' +
      '<span class="et-pie-nota">En el cuadro de impresión, elige tamaño real (100 %), no «Ajustar».</span>';
    $('et-guardar-pdf').onclick = guardarPdf;
    $('et-imprimir').onclick = imprimir;
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
      alCambiar: function () { if (E.filtro) E.filtro.cacheMarcadas = null; pintarVista(); },
      alQuitar: function (k) { delete E.anadidas[k]; delete E.quitadas[k]; pintarVista(); }
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
    if (E.editor) {
      EtiquetasEditor.enganchar(panel, E.editor, {
        guardar: guardarEditor, cancelar: function () { E.editor = null; pintar(); },
        cambio: function () { pintarVista(); }, repintar: function () { pintar(); }
      });
      return;
    }
    Array.prototype.forEach.call(panel.querySelectorAll('[data-clase]'), function (b) {
      b.onclick = function () { E.clase = b.getAttribute('data-clase'); E.gastadas = {}; E.anadidas = {}; pintar(); };
    });
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
      alElegir: function (o) { E.personal.clase = o.valor; if (!o.valor) pc.value = ''; pintarVista(); exportarPersonal(panel); }
    });
    if (pd) CajaConSugerencias.enganchar(panel, 'et-pdepto', {
      fuente: conTodos(function () { return [{ valor: '', texto: 'Todos' }].concat(departamentos().map(function (d) { return { valor: d, texto: d }; })); }, function () { return E.personal.depto; }),
      alElegir: function (o) { E.personal.depto = o.valor; if (!o.valor) pd.value = ''; pintarVista(); exportarPersonal(panel); }
    });
    if (pd) pd.addEventListener('input', function () { if (!pd.value.trim() && E.personal.depto) { E.personal.depto = ''; pintarVista(); exportarPersonal(panel); } });
    if (pc) pc.addEventListener('input', function () { if (!pc.value.trim() && E.personal.clase) { E.personal.clase = ''; pintarVista(); exportarPersonal(panel); } });
    if (pc) { FiltroExportar.enganchar(panel, function () { return listaDePersonal(); }); exportarPersonal(panel); }
    $('et-pegar-usar').onclick = function () { pegar($('et-pegado').value); };
    var pq = $('et-pegar-quitar');
    if (pq) pq.onclick = function () { E.pegado = null; pintar(); };
    $('et-copias').oninput = function () { E.copias = Math.max(1, Math.min(50, parseInt(this.value, 10) || 1)); pintarVista(); };
    $('et-hoja-nueva').onclick = function () { E.gastadas = {}; pintarVista(); };
    $('et-buscar-modelo').oninput = function () {
      E.buscarModelo = this.value;
      var m = modeloActual();
      $('et-modelo').innerHTML = opciones(filtrarModelos(modelos(), E.buscarModelo, m.id), m.id, function (x) { return x.nombre + ' · ' + x.columnas + ' × ' + x.filas + (x.propio ? ' (propio)' : ''); });
    };
    $('et-modelo').onchange = function () { E.modeloId = this.value; E.gastadas = {}; EtiquetasGuardado.recordar('modelo', this.value); pintar(); };
    $('et-diseno').onchange = function () { E.disenoId = this.value; EtiquetasGuardado.recordar('diseno', this.value); pintar(); };
    $('et-modelo-nuevo').onclick = function () { abrirEditorModelo(null); };
    $('et-modelo-cambiar').onclick = function () { abrirEditorModelo(modeloActual()); };
    var mb = $('et-modelo-borrar');
    if (mb) mb.onclick = function () { borrarModelo(modeloActual()); };
    $('et-diseno-nuevo').onclick = function () {
      E.editor = { tipo: 'diseno', titulo: 'Nuevo diseño', diseno: { nombre: '', para: E.clase, unaPorFamilia: false, renglones: [EtiquetasDisenos.nuevoRenglon()] } };
      pintar();
    };
    $('et-diseno-duplicar').onclick = function () {
      var d = JSON.parse(JSON.stringify(disenoActual()));
      delete d.id; delete d.integrado; d.nombre = 'Copia de ' + d.nombre;
      E.editor = { tipo: 'diseno', titulo: 'Duplicar el diseño', diseno: d }; pintar();
    };
    var de = $('et-diseno-editar'), db = $('et-diseno-borrar');
    if (de) de.onclick = function () { abrirEditorDiseno(disenoActual()); };
    if (db) db.onclick = function () { borrarDiseno(disenoActual()); };
  }

  function pegar(texto) {
    var fichas = {}, cuantas = 0;
    String(texto || '').split(/\r?\n/).forEach(function (l) {
      var t = nor(l).trim();
      if (t) { fichas[t] = true; cuantas++; }
    });
    if (!cuantas) { E.pegado = null; pintar(); return; }
    var lista = E.clase === 'alumnado' ? (E.base || E.matriculados || []) : (E.personal.lista || []);
    E.pegado = { fichas: fichas, texto: texto, cuantas: cuantas, aviso: '' };
    var halladas = porPegado(lista).length;
    E.pegado.aviso = halladas + ' de ' + cuantas + (cuantas === 1 ? ' línea encontrada.' : ' líneas encontradas.');
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
        E.modeloId = id; E.gastadas = {};
      } else {
        var dis = EtiquetasDisenos.limpiar(obj), idd = obj.id || EtiquetasGuardado.nuevoId('d');
        dis.id = idd;
        E.guardado = await EtiquetasGuardado.cambiar(function (d) {
          var i = d.disenos.findIndex(function (x) { return x.id === idd; });
          if (i === -1) d.disenos.push(dis); else d.disenos[i] = dis;
        });
        E.disenoId = idd;
      }
      E.editor = null;
      U.aviso('Guardado.', 'bueno');
      pintar();
    } catch (e) { U.fallo('No he podido guardar', e); }
  }

  async function borrarModelo(m) {
    if (!m || !m.propio || !(await U.preguntar('Borrar el modelo', '<p>Se borra el modelo «' + esc(m.nombre) + '».</p>', 'Sí, borrarlo'))) return;
    try { E.guardado = await EtiquetasGuardado.cambiar(function (d) { d.modelos = d.modelos.filter(function (x) { return x.id !== m.id; }); }); E.modeloId = null; E.gastadas = {}; pintar(); }
    catch (e) { U.fallo('No he podido borrar el modelo', e); }
  }

  async function borrarDiseno(d) {
    if (!d || d.integrado || !(await U.preguntar('Borrar el diseño', '<p>Se borra el diseño «' + esc(d.nombre) + '».</p>', 'Sí, borrarlo'))) return;
    try { E.guardado = await EtiquetasGuardado.cambiar(function (x) { x.disenos = x.disenos.filter(function (y) { return y.id !== d.id; }); }); E.disenoId = null; pintar(); }
    catch (e) { U.fallo('No he podido borrar el diseño', e); }
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
    E.clase = 'alumnado'; E.gastadas = {}; E.quitadas = {}; E.anadidas = {}; E.pegado = null; E.editor = null; E.copias = 1; E.personal = { clase: '', depto: '', lista: [] };
    var ult = EtiquetasGuardado.ultimo();
    E.modeloId = ult.modelo || null; E.disenoId = ult.diseno || null;
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
    pintar();
  }

  /* Desde la tarjeta «Personas del grupo»: sus personas ya elegidas. */
  function abrirDesdeGrupo(a, modo) {
    var rel = ((window.App && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {}).relacionados || [];
    return abrir({ asunto: a, modo: modo, nombres: rel.map(function (r) { return r.nombre; }) });
  }

  function cerrar() {
    E.abierta = false; E.volverA = null; E.turno++;
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
