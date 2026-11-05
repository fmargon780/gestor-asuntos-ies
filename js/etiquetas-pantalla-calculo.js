/* ============================================================
   etiquetas-pantalla-calculo.js — el estado, quién sale en las etiquetas y el cálculo de la lista (fila 536: trozo de js/etiquetas-pantalla.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/etiquetas-pantalla.js.
   ============================================================ */
var EtiquetasPantallaNucleo = EtiquetasPantallaNucleo || {};
(function () {

  var I = EtiquetasPantallaNucleo;
  function pintarVista() { return I.pintarVista.apply(this, arguments); }
  function pegar() { return I.pegar.apply(this, arguments); }
  function entrar() { return I.entrar.apply(this, arguments); }

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

  I.E = E;
  I.CLASES = CLASES;
  I.$ = $;
  I.esc = esc;
  I.soloConsulta = soloConsulta;
  I.clave = clave;
  I.modelos = modelos;
  I.disenos = disenos;
  I.modeloActual = modeloActual;
  I.vale = vale;
  I.disenoActual = disenoActual;
  I.nor = nor;
  I.porPegado = porPegado;
  I.candidatas = candidatas;
  I.listaDePersonal = listaDePersonal;
  I.exportarPersonal = exportarPersonal;
  I.calcular = calcular;
  I.CLASES_PERSONAL = CLASES_PERSONAL;
  I.textoClasePersonal = textoClasePersonal;
  I.departamentos = departamentos;
  I.buscarPersonas = buscarPersonas;
  I.elegirPersona = elegirPersona;
  I.htmlPanel = htmlPanel;
})();
