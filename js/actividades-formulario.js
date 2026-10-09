/* ============================================================
   actividades-formulario.js — el formulario «La actividad» (8-oct-2026,
   fila 306, docs/ACTIVIDADES-EXTRAESCOLARES.md).

   Una sola ventana ancha, en columnas: los datos de la actividad, las unidades
   convocadas con su alumnado ya marcado (se desmarca a quien no va) y el
   profesorado, con «Organiza» o «Acompaña».

   - `abrir({ inicial, textoSeguir, bloqueadas })` devuelve lo que se ha escrito
     (o null si se cancela). Sirve para crear y para «Cambiar».
   - En «Nuevo asunto», con un tipo marcado para actividades, sale el botón
     «Apuntar la actividad» (`alRefrescarNuevo`). «Seguir» vuelve a «Nuevo
     asunto» con el grupo puesto (js/asunto-de-grupo.js, `fijar`).
   - Al crear el asunto, la actividad entra en el registro (js/actividades.js)
     por el mismo punto que usan otros módulos: `Gestor.alCrearAsunto`.
   Nada se repinta entero al marcar: lo escrito en los campos no se pierde.
   ============================================================ */
var ActividadesFormulario = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(String(v === undefined || v === null ? '' : v)); }
  function clave(m) { return m.categoria + '|' + m.nombre; }

  /* ---------- sin efectos ---------- */

  function estadoVacio() {
    return {
      id: '', nombre: '', corto: '', cortoManual: false, inicio: '', fin: '', finManual: false, salida: '', regreso: '',
      lugar: '', departamento: '', horas: '', unidades: [], quitados: {}, otros: [], profesorado: []
    };
  }

  /* El nombre corto que se propone: el principio del nombre, limpio. */
  function cortoDe(nombre) { return U.limpiarNombre(nombre).slice(0, 40); }

  /* El alumnado que va: las personas de cada unidad señalada que no se han desmarcado, más las de otras unidades. */
  function quienesVan(S, matriculados) {
    var vistos = {}, salida = [];
    function poner(nombre, p) {
      var m = { categoria: 'ALUMNADO', nombre: nombre, unidad: p.unidad || '', curso: p.curso || '', matriculado: true };
      if (S.quitados[clave(m)] || vistos[clave(m)]) return;
      vistos[clave(m)] = true;
      salida.push(m);
    }
    S.unidades.forEach(function (u) {
      Relacionados.filtrarPorUnidad(matriculados, u).forEach(function (p) { poner(App.textoTercero(p), p); });
    });
    S.otros.forEach(function (o) { poner(o.nombre, o); });
    return salida;
  }

  /* Lo que devuelve el formulario: las piezas de la actividad más lo necesario para volver a abrirlo. */
  function resultado(S, matriculados) {
    var horas = String(S.horas).trim() === '' ? null : Number(String(S.horas).replace(',', '.'));
    return {
      id: S.id, nombre: S.nombre.trim(), corto: U.limpiarNombre(S.corto).slice(0, 40),
      inicio: S.inicio, fin: S.fin || S.inicio, salida: S.salida, regreso: S.regreso,
      lugar: S.lugar.trim(), departamento: S.departamento.trim(), horas: isFinite(horas) ? horas : null,
      alumnos: quienesVan(S, matriculados), matriculados: matriculados,
      profesorado: S.profesorado.map(function (p) { return { nombre: p.nombre, clave: p.clave, papel: p.papel }; }),
      form: JSON.parse(JSON.stringify(S))
    };
  }

  /* ---------- la ventana ---------- */

  var abierto = false;

  function plantilla() {
    return '<div class="act-form">' +
      '<div class="act-col act-col-datos">' +
        '<label class="etiqueta act-et" for="act-nombre">Nombre de la actividad</label>' +
        '<input id="act-nombre" class="campo" maxlength="120" autocomplete="off">' +
        '<label class="etiqueta act-et" for="act-corto">Nombre corto, para la carpeta</label>' +
        '<input id="act-corto" class="campo" maxlength="40" autocomplete="off">' +
        '<div class="act-dos">' +
          '<div><label class="etiqueta act-et" for="act-inicio">Fecha de inicio</label><input id="act-inicio" type="date" class="campo"></div>' +
          '<div><label class="etiqueta act-et" for="act-fin">Fecha de fin</label><input id="act-fin" type="date" class="campo"></div>' +
        '</div>' +
        '<div class="act-dos">' +
          '<div><label class="etiqueta act-et" for="act-salida">Hora de salida</label><input id="act-salida" type="time" class="campo"></div>' +
          '<div><label class="etiqueta act-et" for="act-regreso">Hora de regreso</label><input id="act-regreso" type="time" class="campo"></div>' +
        '</div>' +
        '<label class="etiqueta act-et" for="act-lugar">Lugar</label>' +
        '<input id="act-lugar" class="campo" maxlength="200" autocomplete="off">' +
        '<label class="etiqueta act-et" for="act-depto">Departamento que la organiza</label>' +
        '<input id="act-depto" class="campo" maxlength="120" list="act-deptos" autocomplete="off"><datalist id="act-deptos"></datalist>' +
        '<label class="etiqueta act-et" for="act-horas">Horas de dedicación <span class="nota">(no es obligatorio)</span></label>' +
        '<input id="act-horas" type="number" min="0" step="0.5" class="campo act-horas">' +
      '</div>' +
      '<div class="act-col act-col-alumnado">' +
        '<div class="etiqueta act-et">Unidades convocadas</div>' +
        '<div id="act-unidades" class="act-unidades"></div>' +
        '<div class="act-acciones">' +
          '<button type="button" class="boton boton-chico" id="act-marcar-todos">Marcar todos</button>' +
          '<button type="button" class="boton boton-chico" id="act-desmarcar-todos">Desmarcar todos</button>' +
          '<button type="button" class="boton boton-chico" id="act-mas-otra">+ Añadir a alguien de otra unidad</button>' +
        '</div>' +
        '<div id="act-bloques" class="act-bloques"></div>' +
      '</div>' +
      '<div class="act-col act-col-profesorado">' +
        '<div class="etiqueta act-et">Profesorado</div>' +
        '<div id="act-profes" class="act-profes"></div>' +
        '<button type="button" class="boton boton-chico" id="act-mas-profe">+ Añadir profesorado</button>' +
      '</div>' +
    '</div>' +
    '<div id="act-picker" class="act-picker oculto"></div>' +
    '<div id="act-cuenta" class="act-cuenta" aria-live="polite"></div>';
  }

  /* Abre la ventana. `opciones`: { titulo, inicial (estado de una vez anterior), textoSeguir, bloqueadas: { clave: motivo } }. */
  async function abrir(opciones) {
    opciones = opciones || {};
    if (abierto) return null;
    abierto = true;
    var S = Object.assign(estadoVacio(), JSON.parse(JSON.stringify(opciones.inicial || {})));
    if (!S.id) S.id = U.nuevoId('act');
    var bloqueadas = opciones.bloqueadas || {};
    var matriculados = [];
    try { matriculados = (await Actividades.alumnadoMatriculado()).filter(function (p) { return p.matriculado; }); }
    catch (e) { matriculados = []; }
    var unidadesDelCentro = Datos.unidadesDistintas(matriculados);

    var capa = $('capa'), cuadro = capa.querySelector('.cuadro');
    var promesa = U.preguntar(opciones.titulo || 'La actividad', plantilla(), opciones.textoSeguir || 'Seguir');
    cuadro.classList.add('cuadro-ancho', 'cuadro-actividad');
    var aceptar = $('cuadro-aceptar');

    /* ---- datos de arriba ---- */
    var campos = { nombre: 'act-nombre', corto: 'act-corto', inicio: 'act-inicio', fin: 'act-fin', salida: 'act-salida', regreso: 'act-regreso',
      lugar: 'act-lugar', departamento: 'act-depto', horas: 'act-horas' };
    Object.keys(campos).forEach(function (k) { $(campos[k]).value = S[k] === null || S[k] === undefined ? '' : S[k]; });
    var deptos = {};
    Actividades.lista().forEach(function (a) { if (a.departamento) deptos[a.departamento] = true; });
    $('act-deptos').innerHTML = Object.keys(deptos).sort().map(function (d) { return '<option value="' + esc(d) + '">'; }).join('');
    if (S.corto && S.corto !== cortoDe(S.nombre)) S.cortoManual = true;

    function leerCampos() {
      Object.keys(campos).forEach(function (k) { S[k] = $(campos[k]).value; });
    }
    $('act-nombre').oninput = function () {
      S.nombre = this.value;
      if (!S.cortoManual) { S.corto = cortoDe(S.nombre); $('act-corto').value = S.corto; }
      revisar();
    };
    $('act-corto').oninput = function () { S.corto = this.value; S.cortoManual = true; revisar(); };
    $('act-inicio').onchange = $('act-inicio').oninput = function () {
      S.inicio = this.value;
      if (S.inicio && (!S.finManual || !S.fin || S.fin < S.inicio)) { S.fin = S.inicio; $('act-fin').value = S.fin; }
      $('act-fin').min = S.inicio || '';
      revisar();
    };
    $('act-fin').onchange = $('act-fin').oninput = function () {
      S.fin = this.value; S.finManual = true;
      if (S.inicio && S.fin && S.fin < S.inicio) { S.fin = S.inicio; this.value = S.fin; }
      revisar();
    };
    ['act-salida', 'act-regreso', 'act-lugar', 'act-depto', 'act-horas'].forEach(function (id) {
      $(id).oninput = function () { leerCampos(); };
    });
    if (S.inicio) $('act-fin').min = S.inicio;

    /* ---- unidades y alumnado ---- */
    function pintarUnidades() {
      $('act-unidades').innerHTML = unidadesDelCentro.map(function (u) {
        var puesta = S.unidades.indexOf(u.unidad) !== -1;
        return '<button type="button" class="act-unidad' + (puesta ? ' elegida' : '') + '" data-unidad="' + esc(u.unidad) + '" aria-pressed="' + puesta + '">' +
          esc(u.unidad) + ' <small>' + u.cuantos + '</small></button>';
      }).join('') || '<p class="nota">No hay alumnado matriculado este curso.</p>';
      Array.prototype.forEach.call($('act-unidades').querySelectorAll('.act-unidad'), function (b) {
        b.onclick = function () {
          var u = b.dataset.unidad, i = S.unidades.indexOf(u);
          if (i === -1) {
            S.unidades.push(u);
            Relacionados.filtrarPorUnidad(matriculados, u).forEach(function (p) { delete S.quitados['ALUMNADO|' + App.textoTercero(p)]; });
          } else S.unidades.splice(i, 1);
          pintarUnidades(); pintarBloques(); revisar();
        };
      });
    }

    function bloque(titulo, personas, otras) {
      var van = personas.filter(function (p) { return !S.quitados[clave(p)]; }).length;
      return '<section class="act-bloque" data-unidad="' + esc(otras ? '' : titulo.unidad) + '">' +
        '<h4>' + esc(otras ? 'Otras unidades' : titulo.unidad) + ' · ' + (otras ? 'van ' + van : 'van ' + van + ' de ' + titulo.de) + '</h4>' +
        '<div class="act-personas">' + personas.map(function (p) {
          var k = clave(p), motivo = bloqueadas[k];
          var marcada = !S.quitados[k] || !!motivo;
          return '<label class="act-persona' + (motivo ? ' bloqueada' : '') + '"' + (motivo ? ' title="' + esc(motivo) + '"' : '') + '>' +
            '<input type="checkbox" class="act-casilla" data-clave="' + esc(k) + '"' + (marcada ? ' checked' : '') + (motivo ? ' disabled' : '') + '> ' +
            esc(p.visto || p.nombre) + '</label>';
        }).join('') + '</div></section>';
    }

    function personasDeUnidad(u) {
      return Relacionados.filtrarPorUnidad(matriculados, u).map(function (p) {
        return { categoria: 'ALUMNADO', nombre: App.textoTercero(p), visto: p.nombre, unidad: p.unidad, curso: p.curso };
      });
    }

    function pintarBloques() {
      var html = S.unidades.map(function (u) {
        var gente = personasDeUnidad(u);
        return bloque({ unidad: u, de: gente.length }, gente, false);
      }).join('');
      var otros = S.otros.filter(function (o) { return S.unidades.indexOf(o.unidad) === -1; });
      if (otros.length) html += bloque({}, otros, true);
      $('act-bloques').innerHTML = html || '<p class="nota">Señala una o varias unidades: saldrá su alumnado, todo marcado.</p>';
      Array.prototype.forEach.call($('act-bloques').querySelectorAll('.act-casilla'), function (c) {
        c.onchange = function () {
          if (c.checked) delete S.quitados[c.dataset.clave]; else S.quitados[c.dataset.clave] = true;
          retocarTitulos(); revisar();
        };
      });
    }

    /* Los títulos «van N de M» se rehacen sin tocar las casillas. */
    function retocarTitulos() {
      Array.prototype.forEach.call($('act-bloques').querySelectorAll('.act-bloque'), function (b) {
        var cas = b.querySelectorAll('.act-casilla'), van = 0;
        Array.prototype.forEach.call(cas, function (c) { if (c.checked) van++; });
        var h = b.querySelector('h4'), unidad = b.dataset.unidad;
        h.textContent = (unidad || 'Otras unidades') + ' · van ' + van + (unidad ? ' de ' + cas.length : '');
      });
    }

    function marcarTodos(valor) {
      var vistas = quienesVan(Object.assign({}, S, { quitados: {} }), matriculados);
      S.quitados = {};
      if (!valor) vistas.forEach(function (m) { S.quitados[clave(m)] = true; });
      Object.keys(bloqueadas).forEach(function (k) { delete S.quitados[k]; });
      pintarBloques(); revisar();
    }
    $('act-marcar-todos').onclick = function () { marcarTodos(true); };
    $('act-desmarcar-todos').onclick = function () { marcarTodos(false); };

    /* ---- profesorado ---- */
    function pintarProfes() {
      $('act-profes').innerHTML = S.profesorado.length ? S.profesorado.map(function (p, i) {
        return '<div class="act-profe" data-i="' + i + '"><span class="act-profe-nombre">' + esc(p.nombre) + '</span>' +
          '<select class="campo act-papel" aria-label="Papel de ' + esc(p.nombre) + '">' +
            '<option value="acompana"' + (p.papel === 'organiza' ? '' : ' selected') + '>Acompaña</option>' +
            '<option value="organiza"' + (p.papel === 'organiza' ? ' selected' : '') + '>Organiza</option></select>' +
          '<button type="button" class="act-profe-quitar" title="Quitar" aria-label="Quitar a ' + esc(p.nombre) + '">×</button></div>';
      }).join('') : '<p class="nota">Nadie todavía.</p>';
      Array.prototype.forEach.call($('act-profes').querySelectorAll('.act-profe'), function (f) {
        var i = +f.dataset.i;
        f.querySelector('.act-papel').onchange = function () { S.profesorado[i].papel = this.value; };
        f.querySelector('.act-profe-quitar').onclick = function () { S.profesorado.splice(i, 1); pintarProfes(); revisar(); };
      });
    }

    /* ---- el buscador de personas (alumnado de otra unidad, o profesorado) ---- */
    function cerrarPicker() { $('act-picker').classList.add('oculto'); $('act-picker').innerHTML = ''; }
    function abrirPicker(categoria, alElegir, texto) {
      var caja = $('act-picker');
      caja.classList.remove('oculto');
      caja.innerHTML = '<div class="act-picker-cabecera"><strong>' + esc(texto) + '</strong>' +
        '<button type="button" class="boton boton-chico" id="act-picker-cerrar">Cerrar</button></div><div id="act-picker-sitio"></div>';
      $('act-picker-cerrar').onclick = cerrarPicker;
      App.pintarBuscadorDeTercero($('act-picker-sitio'), categoria, function (marcados) { alElegir(marcados); cerrarPicker(); },
        { multiple: true, categorias: [categoria], textoBoton: function (n) { return 'Añadir los ' + n + ' señalados'; } });
    }
    $('act-mas-otra').onclick = function () {
      abrirPicker('ALUMNADO', function (marcados) {
        marcados.forEach(function (m) {
          var p = m.persona || {};
          var existe = S.otros.some(function (o) { return clave(o) === clave(m); });
          if (!existe && S.unidades.indexOf(p.unidad) === -1) S.otros.push({ categoria: 'ALUMNADO', nombre: m.nombre, visto: p.nombre || m.nombre, unidad: p.unidad || '', curso: p.curso || '' });
          delete S.quitados[clave(m)];
        });
        pintarBloques(); revisar();
      }, 'Alumnado de otra unidad');
    };
    $('act-mas-profe').onclick = function () {
      abrirPicker('PERSONAL', function (marcados) {
        marcados.forEach(function (m) {
          var p = m.persona || {};
          var k = Datos.clavePersona(p.documento, p.nombre || m.nombre);
          if (S.profesorado.some(function (x) { return x.nombre === m.nombre; })) return;
          S.profesorado.push({ nombre: m.nombre, clave: k, papel: 'acompana' });
        });
        pintarProfes(); revisar();
      }, 'Profesorado');
    };

    /* ---- la cuenta y «Seguir» ---- */
    function revisar() {
      var van = quienesVan(S, matriculados).length, profes = S.profesorado.length;
      $('act-cuenta').textContent = 'Van ' + van + (van === 1 ? ' alumno/a' : ' alumnos/as') + ' · ' + profes + (profes === 1 ? ' profesor/a' : ' profesores/as');
      aceptar.disabled = !(S.nombre.trim() && U.limpiarNombre(S.corto) && S.inicio && van > 0);
    }

    pintarUnidades(); pintarBloques(); pintarProfes(); revisar();
    $('act-nombre').focus();

    var ok = await promesa;
    cuadro.classList.remove('cuadro-ancho', 'cuadro-actividad');
    aceptar.disabled = false;
    abierto = false;
    if (!ok) return null;
    leerCampos();
    return resultado(S, matriculados);
  }

  /* ---------- «Nuevo asunto» ---------- */

  function categoriaDelTipo() {
    var t = (App.E.tipos || []).filter(function (x) { return x.tipo === App.E.nuevo.tipo; })[0];
    return t ? t.categoria : 'OTROS';
  }

  function fijarEnNuevo(r) {
    AsuntoDeGrupo.fijar({
      nombre: r.corto, origen: 'actividad', categoria: categoriaDelTipo(), atajos: [], actividad: r,
      marcados: r.alumnos.map(function (m) { return { categoria: m.categoria, nombre: m.nombre }; })
    });
    $('campo-limite').value = r.inicio;
  }

  async function apuntarDesdeNuevo() {
    var r = await abrir({ titulo: 'La actividad', textoSeguir: 'Seguir' });
    if (r) fijarEnNuevo(r);
  }

  async function cambiarDesdeNuevo() {
    var g = App.E.nuevo.tercero && App.E.nuevo.tercero.grupoDatos;
    if (!g || !g.actividad) return;
    var r = await abrir({ titulo: 'La actividad', inicial: g.actividad.form, textoSeguir: 'Seguir' });
    if (r) fijarEnNuevo(r);
  }

  /* El botón de «Nuevo asunto»: solo con un tipo marcado para actividades. Se llama desde App.refrescarVista. */
  function alRefrescarNuevo() {
    var caja = $('actividad-nuevo-caja');
    if (!caja) return;
    var tipo = App.E && App.E.nuevo && App.E.nuevo.tipo;
    var ver = !!tipo && Actividades.esTipoDeActividad(tipo);
    var hay = !caja.classList.contains('oculto');
    if (ver === hay) return;
    caja.classList.toggle('oculto', !ver);
    if (!ver) { caja.innerHTML = ''; return; }
    caja.innerHTML = '<button type="button" class="boton boton-principal" id="btn-apuntar-actividad">Apuntar la actividad</button>';
    $('btn-apuntar-actividad').onclick = apuntarDesdeNuevo;
  }

  /* Al crear el asunto: la actividad entra en el registro. Si falla, el asunto ya está creado y la tarjeta ofrece apuntarla. */
  if (window.Gestor && Gestor.alCrearAsunto) {
    Gestor.alCrearAsunto.push(async function (nombre, datos, tercero) {
      var g = tercero && tercero.esGrupo && tercero.grupoDatos;
      if (!g || !g.actividad || !datos.actividad) return;
      try {
        var a = Actividades.construir(Object.assign({}, g.actividad, { asunto: { numero: datos.numero || '', nombre: nombre } }), null);
        await Actividades.guardarActividad(a);
      } catch (e) {
        U.accesorio('El asunto está creado, pero no he podido apuntar la actividad. Abre su ficha y pulsa «Apuntar los datos de la actividad»', e);
      }
    });
  }

  return {
    abrir: abrir, alRefrescarNuevo: alRefrescarNuevo, cambiarDesdeNuevo: cambiarDesdeNuevo,
    _interno: { quienesVan: quienesVan, cortoDe: cortoDe, estadoVacio: estadoVacio, resultado: resultado }
  };
})();
window.ActividadesFormulario = ActividadesFormulario;
