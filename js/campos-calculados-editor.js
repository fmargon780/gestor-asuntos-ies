/* ============================================================
   campos-calculados-editor.js — crear y cambiar un campo a partir de
   otros, por pasos (fila 529, docs/529-CREAR-CAMPOS-POR-PASOS.md;
   sustituye al editor de una sola operación de la fila 56).

   Un campo lleva: nombre, grupo en el que sale, el campo del que parte
   y una lista de pasos que se añaden, quitan y ordenan con flechas.
   Cada paso enseña lo que sale con la persona de ejemplo; al lado, una
   tabla con el resultado final para varias personas. Qué personas lo
   usan (`categorias`) se saca de los campos de los que sale.

   Se pinta directo en el hueco que le pasan (`abrir(caja, ctx)`, con
   `ctx.existente`, `ctx.alGuardar(calculado, esNuevo)` y
   `ctx.alCancelar()`), como el de antes: lo llaman la lista de campos
   (js/campos-lista-pantalla.js), la ventana de elegir campo
   (js/campos-elegir.js) y el catálogo (js/campos-catalogo.js). Los
   pasos de cada operación están en js/campos-pasos.js; sus casillas,
   en js/campos-calculados-pasos.js.

   Se puede partir de cualquier campo de la lista que tenga valor para
   una persona (columnas de sus ficheros, grupo, otros calculados, los
   datos del Centro de datos, tutores y tablas de datos; no los campos
   manuales del asunto). Los que no vienen de su ficha se leen antes
   con js/campos-datos-cache.js, porque el cálculo es síncrono.
   ============================================================ */
var CamposCalculadosEditor = (function () {

  var GRUPOS = ['Persona', 'Tutores', 'Asunto', 'Centro', 'Firmantes'];
  var TODAS = ['ALUMNADO', 'PERSONAL'];

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function $(raiz, id) { return raiz.querySelector('#' + id); }

  function clave(o) {
    if (!o) return '';
    return o.clase === 'columna' ? 'f|' + o.columna : o.clase === 'calculado' ? 'c|' + o.id : o.clase === 'dato' ? 'd|' + o.id : 'g';
  }
  function origenDeEntrada(e) {
    if (e.id && e.id.indexOf('f:') === 0 && e.columna) return { clase: 'columna', columna: e.columna };
    if (e.id === 'h:grupo') return { clase: 'grupo' };
    if (e.calculadoId) return { clase: 'calculado', id: e.calculadoId };
    if (e.id && (e.id.indexOf('h:') === 0 || e.id.indexOf('d:') === 0)) return { clase: 'dato', id: e.id, nombre: e.nombre };   /* nº escolar, tutores, tablas de datos… */
    return null;
  }
  function nombreCategoria(c) { return c.charAt(0) + c.slice(1).toLowerCase(); }

  function abrir(caja, ctx) {
    var existente = ctx.existente;
    var estado = {
      nombre: existente ? existente.nombre || '' : '',
      grupo: existente && existente.grupo ? existente.grupo : 'Persona',
      desde: existente ? existente.origen : null,
      pasos: existente && window.CamposPasos ? CamposPasos.deLegado(existente) : []
    };
    var entradas = [];       /* los campos que se pueden elegir: { clave, origen, nombre, grupo, clases } */
    var listaCampos = [];    /* la lista completa de campos, para leer los datos de otra parte */
    var personas = [];
    var persona = 0;         /* la de ejemplo */

    function receta() {
      return { id: existente && existente.id ? existente.id : 'nuevo', nombre: estado.nombre.trim(), origen: estado.desde, operacion: 'pasos', parametros: {}, pasos: estado.pasos };
    }
    function entradaDe(o) { var k = clave(o); return entradas.filter(function (e) { return e.clave === k; })[0] || null; }

    /* A qué personas vale: la unión de lo que dicen los campos de los que sale. */
    function categorias() {
      var out = [];
      var origenes = [estado.desde];
      estado.pasos.forEach(function (p) { origenes = origenes.concat(CamposPasos.camposDelPaso(p)); });
      origenes.forEach(function (o) {
        var e = entradaDe(o);
        ((e && e.clases) || []).forEach(function (c) { if (TODAS.indexOf(c) !== -1 && out.indexOf(c) === -1) out.push(c); });
      });
      return out.length ? out : TODAS.slice();
    }

    async function cargar() {
      var lista = [];
      try { lista = await CamposListaDatos.lista(); } catch (e) { lista = []; }
      listaCampos = lista;
      var vistos = {};
      lista.forEach(function (e) {
        var o = origenDeEntrada(e);
        if (!o) return;
        if (o.clase === 'calculado' && existente && (o.id === existente.id || Calculo.dependeDe(o.id, existente.id, App.E.campos))) return;
        var k = clave(o);
        if (vistos[k]) { vistos[k].clases = vistos[k].clases.concat(e.clases || []); return; }
        vistos[k] = { clave: k, origen: o, nombre: e.nombre, grupo: e.grupo, clases: (e.clases || []).slice() };
        entradas.push(vistos[k]);
      });
      /* Una receta de antes puede partir de algo que la lista no trae: se deja elegible. */
      var faltan = [estado.desde].concat(estado.pasos.reduce(function (a, p) { return a.concat(CamposPasos.camposDelPaso(p)); }, []));
      faltan.forEach(function (o) {
        if (o && !entradaDe(o)) entradas.push({ clave: clave(o), origen: o, nombre: o.clase === 'columna' ? o.columna : (o.clase === 'grupo' ? 'El grupo' : 'Campo calculado'), grupo: 'Persona', clases: [] });
      });
      await cargarPersonas();
    }

    async function cargarPersonas() {
      var cats = categorias(), salida = [];
      for (var i = 0; i < cats.length; i++) {
        try { salida = salida.concat(await CamposListaDatos.personas(cats[i])); } catch (e) { /* sin ejemplos de esa categoría */ }
      }
      personas = salida;
      if (persona >= personas.length) persona = 0;
      /* Los datos de otra parte se leen antes (el cálculo es síncrono): de las personas que se ven. */
      var ids = window.CamposDatosCache ? CamposDatosCache.idsDe(receta(), App.E.campos) : [];
      if (ids.length) {
        var vistas = personas.slice(0, 6).concat(personas[persona] ? [personas[persona]] : []);
        for (var j = 0; j < vistas.length; j++) await CamposDatosCache.precargar(ids, vistas[j], listaCampos);
      }
    }

    function opciones(elegida, vacio) {
      var k = clave(elegida), h = vacio === undefined ? '' : '<option value="">' + esc(vacio) + '</option>';
      if (vacio === undefined) h = '<option value="">Elige un campo</option>';
      GRUPOS.forEach(function (g) {
        var fs = entradas.filter(function (e) { return e.grupo === g; });
        if (fs.length) h += '<optgroup label="' + g + '">' + fs.map(function (e) {
          return '<option value="' + esc(e.clave) + '"' + (e.clave === k ? ' selected' : '') + '>' + esc(e.nombre) + '</option>';
        }).join('') + '</optgroup>';
      });
      return h;
    }

    function pintar() {
      var gruposPasos = CamposPasos.GRUPOS_DE_PASOS;
      caja.innerHTML =
        '<div class="campos-calc-form cp-dos">' +
          '<div class="cp-panel">' +
            '<h3 style="margin-top:0">' + (existente && existente.id ? 'Cambiar el campo' : 'Campo nuevo a partir de otros') + '</h3>' +
            '<div class="cp-mitad">' +
              '<div><label class="etiqueta" for="calc-nombre">Nombre del campo</label><input id="calc-nombre" class="campo" value="' + esc(estado.nombre) + '"><div id="calc-nombre-aviso" class="nota"></div></div>' +
              '<div><label class="etiqueta" for="calc-desde">Parte de</label><select id="calc-desde" class="campo">' + opciones(estado.desde) + '</select></div>' +
            '</div>' +
            '<label class="etiqueta" for="calc-grupo">Grupo en el que sale</label>' +
            '<select id="calc-grupo" class="campo">' + GRUPOS.map(function (g) { return '<option' + (g === estado.grupo ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select>' +
            '<div id="calc-pasos" class="cp-pasos">' + estado.pasos.map(function (s, i) {
              return '<div class="cp-paso"><div class="cp-paso-cab"><strong>Paso ' + (i + 1) + '. ' + esc(CamposPasos.OPS[s.op].n) + '</strong><span class="cp-botones">' +
                '<button type="button" class="boton boton-chico" data-acc="subir" data-paso="' + i + '"' + (i ? '' : ' disabled') + ' aria-label="Subir el paso ' + (i + 1) + '">↑</button>' +
                '<button type="button" class="boton boton-chico" data-acc="bajar" data-paso="' + i + '"' + (i < estado.pasos.length - 1 ? '' : ' disabled') + ' aria-label="Bajar el paso ' + (i + 1) + '">↓</button>' +
                '<button type="button" class="boton boton-chico" data-acc="quitar-paso" data-paso="' + i + '">Quitar</button></span></div>' +
                '<div class="cp-paso-datos">' + CamposCalculadosPasos.formulario(s, i, opciones) + '</div><div class="cp-sale" id="sale-' + i + '"></div></div>';
            }).join('') + '</div>' +
            '<div class="cp-anadir"><label class="nota" for="calc-op">Añadir un paso</label><select id="calc-op" class="campo"><option value="">Elige qué hacer</option>' +
              gruposPasos.map(function (g) { return '<optgroup label="' + g[0] + '">' + g[1].map(function (k) { return '<option value="' + k + '">' + esc(CamposPasos.OPS[k].n) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></div>' +
            '<div id="calc-error" class="nota" role="alert"></div>' +
            '<div class="cp-botones" style="justify-content:flex-end;margin-top:10px">' +
              '<button type="button" class="boton" id="calc-cancelar">Cancelar</button>' +
              '<button type="button" class="boton boton-principal" id="calc-guardar">' + (existente && existente.id ? 'Guardar los cambios' : 'Crear y añadir') + '</button></div>' +
          '</div>' +
          '<div class="cp-panel"><h3 style="margin-top:0">Resultado</h3>' +
            '<label class="etiqueta" for="calc-persona">Persona de ejemplo</label><select id="calc-persona" class="campo"></select>' +
            '<div class="cp-tabla"><table><thead><tr><th>Persona</th><th>Sale</th></tr></thead><tbody id="calc-res"></tbody></table></div>' +
            '<div id="calc-vale" class="nota"></div>' +
            '<strong class="nota" style="display:block;margin-top:8px">Probar con uno ya hecho</strong><div id="calc-muestras" class="cp-botones" style="flex-wrap:wrap"></div>' +
            '<p class="nota" style="margin:8px 0 0">Un campo creado aquí sale en la lista y se puede usar para crear otros.</p>' +
          '</div>' +
        '</div>';
      enganchar();
      actualizar();
    }

    /* Lo que cambia con cada tecla: los resultados, no las casillas. */
    function actualizar() {
      var sel = $(caja, 'calc-persona');
      if (sel) {
        sel.innerHTML = personas.length ? personas.map(function (p, i) { return '<option value="' + i + '"' + (i === persona ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') : '<option>No hay con quién probarlo todavía</option>';
      }
      var r = receta(), ej = personas[persona];
      var traza = ej ? Calculo.trazar(r, ej.persona, App.E.campos) : null;
      estado.pasos.forEach(function (s, i) {
        var n = $(caja, 'sale-' + i);
        if (!n) return;
        n.innerHTML = traza ? '<span class="cp-tit">Tras este paso, con ' + esc(ej.nombre) + '</span> ' + (traza[i + 1] === '' ? '<span class="nota">vacío</span>' : esc(traza[i + 1])) : '';
      });
      var t = $(caja, 'calc-res');
      if (t) {
        t.innerHTML = personas.slice(0, 6).map(function (p) {
          var v = estado.desde ? Calculo.evaluar(r, p.persona, App.E.campos) : '';
          return '<tr><td>' + esc(p.nombre) + '</td><td>' + (v ? esc(v) : '<span class="nota">vacío</span>') + '</td></tr>';
        }).join('') || '<tr><td colspan="2" class="nota">No hay con quién probarlo todavía.</td></tr>';
      }
      var cats = categorias();
      var vale = $(caja, 'calc-vale');
      if (vale) vale.textContent = cats.length === TODAS.length ? 'Vale para todos los tipos de persona.' : 'Vale para ' + cats.map(nombreCategoria).join(' y ') + ', porque sale de sus datos.';
      var m = $(caja, 'calc-muestras');
      if (m && !m.dataset.listo) {
        m.dataset.listo = '1';
        (App.E.campos.calculados || []).filter(function (c) { return !existente || c.id !== existente.id; }).slice(0, 6).forEach(function (c) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'boton boton-chico'; b.textContent = c.nombre;
          b.onclick = function () {
            estado.desde = c.origen; estado.pasos = CamposPasos.deLegado(c);
            cargarPersonas().then(pintar);
          };
          m.appendChild(b);
        });
      }
    }

    function avisoNombre() {
      var aviso = $(caja, 'calc-nombre-aviso');
      if (!aviso) return;
      var nombre = estado.nombre.trim();
      if (!nombre) { aviso.textContent = 'Escribe el nombre del campo.'; return; }
      var otros = (App.E.campos.calculados || []).filter(function (c) { return !existente || c.id !== existente.id; }).map(function (c) { return c.nombre; });
      var cerca = U.parecidos(nombre, otros);
      var mismo = cerca.filter(function (c) { return c.igual; })[0];
      aviso.textContent = mismo ? 'Ya hay un campo calculado así, escrito: ' + mismo.nombre + '.'
        : (cerca.length ? 'Ojo, se parece a: ' + cerca.slice(0, 3).map(function (c) { return c.nombre; }).join(', ') + '.' : '');
    }

    function origenDeClave(k) { var e = entradas.filter(function (x) { return x.clave === k; })[0]; return e ? e.origen : null; }

    function enganchar() {
      $(caja, 'calc-nombre').oninput = function () { estado.nombre = this.value; avisoNombre(); };
      avisoNombre();
      $(caja, 'calc-desde').onchange = function () { estado.desde = origenDeClave(this.value); cargarPersonas().then(actualizar); };
      $(caja, 'calc-grupo').onchange = function () { estado.grupo = this.value; };
      $(caja, 'calc-persona').onchange = function () { persona = parseInt(this.value, 10) || 0; actualizar(); };
      $(caja, 'calc-op').onchange = function () { if (!this.value) return; estado.pasos.push(CamposPasos.nuevoPaso(this.value)); pintar(); };
      $(caja, 'calc-cancelar').onclick = function () { ctx.alCancelar(); };
      $(caja, 'calc-guardar').onclick = guardar;
      var pasos = $(caja, 'calc-pasos');
      pasos.oninput = function (ev) { cambio(ev.target, false); };
      pasos.onchange = function (ev) { cambio(ev.target, true); };
      pasos.onclick = function (ev) {
        var b = ev.target.closest && ev.target.closest('button[data-acc]');
        if (!b) return;
        var i = parseInt(b.dataset.paso, 10), j = parseInt(b.dataset.fila, 10), a = b.dataset.acc;
        if (a === 'subir' && i > 0) estado.pasos.splice(i - 1, 0, estado.pasos.splice(i, 1)[0]);
        else if (a === 'bajar' && i < estado.pasos.length - 1) estado.pasos.splice(i + 1, 0, estado.pasos.splice(i, 1)[0]);
        else if (a === 'quitar-paso') estado.pasos.splice(i, 1);
        else if (a === 'anadir-fila') estado.pasos[i].filas.push({ de: '', a: '' });
        else if (a === 'quitar-fila') { estado.pasos[i].filas.splice(j, 1); if (!estado.pasos[i].filas.length) estado.pasos[i].filas.push({ de: '', a: '' }); }
        else return;
        cargarPersonas().then(pintar);
      };
    }

    /* Una casilla de un paso ha cambiado. `terminado`: se ha soltado (change) y no solo tecleado (input). */
    function cambio(el, terminado) {
      if (el.dataset.paso === undefined) return;
      var s = estado.pasos[parseInt(el.dataset.paso, 10)];
      if (!s) return;
      if (el.dataset.fila !== undefined) { s.filas[parseInt(el.dataset.fila, 10)][el.dataset.c] = el.value; actualizar(); return; }
      var k = el.dataset.k;
      if (el.type === 'checkbox') s[k] = el.checked;
      else if (el.dataset.campo) s[k] = el.value ? origenDeClave(el.value) : null;
      else s[k] = el.value;
      if (terminado && el.dataset.re) { cargarPersonas().then(pintar); return; }
      if (terminado && el.dataset.campo) { cargarPersonas().then(actualizar); return; }
      actualizar();
    }

    async function guardar() {
      var calculado = {
        id: existente && existente.id ? existente.id : ('c' + Date.now() + Math.floor(Math.random() * 1000)),
        nombre: estado.nombre.trim(), categorias: categorias(), grupo: estado.grupo,
        origen: estado.desde, operacion: 'pasos', parametros: {},
        pasos: JSON.parse(JSON.stringify(estado.pasos))
      };
      var motivos = Calculo.validar(calculado, App.E.campos);
      var error = $(caja, 'calc-error');
      if (motivos.length) { if (error) error.textContent = motivos[0]; U.aviso(motivos[0], 'malo'); return; }
      U.mientrasGuarda($(caja, 'calc-guardar'), async function () {
        try {
          var esNuevo = !(existente && existente.id);
          App.E.campos = await Campos.guardarCalculados(App.E.gestor, function (calculados) {
            var i = calculados.findIndex(function (c) { return c.id === calculado.id; });
            if (i === -1) calculados.push(calculado); else calculados[i] = calculado;
            return calculados;
          });
          U.aviso('Campo ' + calculado.nombre + ' guardado.', 'bueno');
          ctx.alGuardar(calculado, esNuevo);
        } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      });
    }

    cargar().then(pintar);
  }

  return { abrir: abrir };
})();
window.CamposCalculadosEditor = CamposCalculadosEditor;
