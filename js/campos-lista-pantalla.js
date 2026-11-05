/* ============================================================
   campos-lista-pantalla.js — la sección «Campos» de Ajustes → El
   centro (fila 528, docs/528-LISTA-DE-CAMPOS.md, puntos 1 a 7).

   Una sola lista con todos los datos posibles, de cualquier origen
   (`CamposLista.reunir`): Campo, Grupo, De dónde sale (con tabla y
   columna), Ejemplo, Dónde se pide y En cuántos sitios se usa. A la
   derecha, al pulsar un campo: el camino entero, cuándo llegó el
   fichero, un ejemplo y dónde se usa. Filtros por grupo, origen o
   tabla; el buscador mira campo, tabla y columna.
   ============================================================ */
var CamposListaPantalla = (function () {

  var estado = { lista: [], q: '', grupo: '', origen: '', sel: '', personas: [], persona: 0, nuevo: false, ficheros: {} };
  var raiz = null;

  function $(id) { return raiz && raiz.querySelector('#' + id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function etiqueta(c) {
    var extra = c.origen === 'Manual' ? ' etq-manual' : (c.origen === 'Calculado' ? ' etq-calculado' : '');
    return '<span class="campos-etq' + extra + '">' + esc(c.origen) + '</span>';
  }

  function ejemploHtml(v) { return v ? esc(v) : '<span class="suave">sin dato</span>'; }

  async function recargar() {
    var e = await CamposListaDatos.entrada();
    estado.ficheros = e.ficheros;
    estado.lista = CamposLista.reunir(e);
    if (!estado.personas.length) estado.personas = await CamposListaDatos.personas('ALUMNADO');
    await pintar();
  }

  function filtrados() { return CamposLista.buscar(estado.lista, estado.q, estado.grupo, estado.origen); }

  async function pintar() {
    if (!raiz) return;
    var origenes = CamposLista.ORIGENES.filter(function (o) { return estado.lista.some(function (c) { return c.origen === o; }); });
    var tablas = [];
    estado.lista.forEach(function (c) {
      if ((c.origen === 'Centro de datos' || c.origen === 'Tabla de datos') && tablas.indexOf(c.tabla) === -1) tablas.push(c.tabla);
    });
    var fs = filtrados();
    var persona = estado.personas[estado.persona];
    var ejemplos = {};
    for (var i = 0; i < fs.length; i++) ejemplos[fs[i].id] = await CamposListaDatos.ejemplo(fs[i], persona);

    raiz.innerHTML =
      '<div class="campos-lista-dos"><div class="campos-lista-izq">' +
      '<div class="campos-lista-barra">' +
      '<input type="search" id="cl-buscar" class="campo" placeholder="Buscar por campo, tabla o columna" aria-label="Buscar un campo" autocomplete="off" value="' + esc(estado.q) + '">' +
      '<select id="cl-origen" class="campo" aria-label="De dónde sale"><option value="">De cualquier origen</option>' +
      '<optgroup label="Origen">' + origenes.map(function (o) { return '<option' + (o === estado.origen ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="Tabla">' + tablas.map(function (o) { return '<option' + (o === estado.origen ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</optgroup></select>' +
      '<button type="button" class="boton" id="cl-nuevo-manual">+ Campo manual</button>' +
      '<button type="button" class="boton principal" id="cl-nuevo-calculado">+ Crear a partir de otros</button></div>' +
      '<div class="campos-lista-grupos"><button type="button" class="campos-pastilla' + (estado.grupo ? '' : ' on') + '" data-g="">Todos (' + estado.lista.length + ')</button>' +
      CamposLista.GRUPOS.map(function (g) {
        var n = estado.lista.filter(function (c) { return c.grupo === g; }).length;
        return '<button type="button" class="campos-pastilla' + (estado.grupo === g ? ' on' : '') + '" data-g="' + esc(g) + '">' + esc(g) + ' (' + n + ')</button>';
      }).join('') + '</div>' +
      '<div class="campos-lista-persona"><label for="cl-persona" class="suave pequeno">Ejemplos con</label> <select id="cl-persona" class="campo">' +
      (estado.personas.length ? estado.personas.map(function (p, n) { return '<option value="' + n + '"' + (n === estado.persona ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') : '<option>(sin personas)</option>') + '</select></div>' +
      '<div class="campos-lista-tabla"><table><thead><tr><th>Campo</th><th>Grupo</th><th>De dónde sale</th><th>Ejemplo</th><th>Dónde se pide</th><th>Se usa en</th></tr></thead><tbody>' +
      (fs.length ? fs.map(function (c) {
        return '<tr tabindex="0" data-id="' + esc(c.id) + '" class="' + (estado.sel === c.id ? 'sel' : '') + '"><td>' + esc(c.nombre) + '</td><td>' + esc(c.grupo) + '</td>' +
          '<td>' + etiqueta(c) + (CamposLista.rutaCorta(c) ? '<div class="suave pequeno">' + esc(CamposLista.rutaCorta(c)) + '</div>' : '') + '</td><td>' + ejemploHtml(ejemplos[c.id]) + '</td>' +
          '<td class="suave pequeno">' + esc(CamposLista.dondeSePide(c)) + '</td><td class="num">' + c.usos.length + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="suave">Ningún campo con ese nombre.</td></tr>') +
      '</tbody></table></div></div><div class="campos-lista-der" id="cl-detalle"></div></div>';

    ligar();
    await pintarDetalle(ejemplos);
  }

  async function pintarDetalle(ejemplos) {
    var c = $('cl-detalle');
    if (!c) return;
    if (estado.nuevo) {
      CamposManualNuevo.pintar(c, {
        existentes: function () { return estado.lista; },
        alCrear: function (p) { estado.nuevo = false; estado.sel = 'p:' + p.id; recargar(); },
        alCancelar: function () { estado.nuevo = false; pintarDetalle(ejemplos); }
      });
      return;
    }
    var campo = estado.lista.filter(function (x) { return x.id === estado.sel; })[0];
    if (!campo) {
      c.innerHTML = '<h3>Pulsa un campo de la lista</h3><p class="suave pequeno">Aquí verás de dónde sale, cuándo llegó el fichero y dónde se usa.</p>';
      return;
    }
    var persona = estado.personas[estado.persona];
    var ej = (ejemplos && ejemplos[campo.id] !== undefined) ? ejemplos[campo.id] : await CamposListaDatos.ejemplo(campo, persona);
    var fecha = await CamposListaDatos.fechaDelFichero(campo, estado.ficheros);
    var clases = campo.clases.length ? 'vale para ' + campo.clases.map(function (x) { return CamposLista.CLASES_PERSONA[x] || x; }).join(', ') : 'vale para todos';
    var h = '<h3>' + esc(campo.nombre) + '</h3><div>' + etiqueta(campo) + ' <span class="suave pequeno">Grupo ' + esc(campo.grupo) + ' · ' + esc(clases) + '</span></div>' +
      '<p class="campos-camino"><strong class="pequeno">De dónde sale</strong><br><span id="cl-camino">' + esc(CamposLista.camino(campo)) + '</span>' +
      (fecha ? '<br><span class="suave pequeno" id="cl-fecha">' + esc(fecha) + '</span>' : '') + '</p>' +
      '<p><strong class="pequeno">Ejemplo con ' + esc(persona ? persona.nombre : 'nadie') + '</strong><br>' + ejemploHtml(ej) + '</p>' +
      '<p><strong class="pequeno">Se escribe así en una plantilla</strong><br><code>' + esc(campo.marca) + '</code></p>';
    if (campo.propioId) {
      h += '<p class="pequeno">Clase de dato: ' + esc(CamposClases.nombreDe(campo.clase)) + (campo.clase === 'lista' ? ' · ' + esc((campo.opciones || []).join(', ')) : '') + '</p>' +
        '<div><strong class="pequeno">Dónde se pide</strong>' +
        (campo.dondeSePide.length ? '<ul class="campos-usos" id="cl-donde-pide">' + (campo.dondeDetalle || []).map(function (d) {
          var paso = d.donde === 'hito' && window.CamposDeHito ? CamposDeHito.pasosDeLaGuia(d.tipo).filter(function (x) { return x.id === d.hito; })[0] : null;
          return '<li>' + esc(CamposLista.textoDonde(d, paso && paso.titulo)) + '</li>';   /* fila 530: lo que hace cada tipo */
        }).join('') + '</ul>'
          : '<p class="suave pequeno" id="cl-donde-pide">Se pide al usarlo, en la tarea que lo necesite.</p>') +
        '<p class="suave pequeno">No se decide aquí: se decide en cada tipo de asunto.</p></div>';
    }
    h += '<div><strong class="pequeno">Se usa en</strong>' + (campo.usos.length ? '<ul class="campos-usos" id="cl-usos">' + campo.usos.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul>'
      : '<p class="suave pequeno" id="cl-usos">Todavía no se usa.</p>') + '</div>';
    if (campo.propioId || campo.calculadoId) {
      h += CamposLista.sePuedeQuitar(campo) ? '<div><button type="button" class="boton boton-peligro" id="cl-quitar">Quitar el campo</button></div>'
        : '<p class="suave pequeno" id="cl-no-quitar">No se puede quitar mientras se use.</p>';
    }
    c.innerHTML = h;
    var q = $('cl-quitar');
    if (q) q.onclick = function () { quitar(campo); };
  }

  async function quitar(campo) {
    if (!CamposLista.sePuedeQuitar(campo)) return;
    var ok = await U.preguntar('Quitar el campo', '<p>' + esc('¿Quitar el campo «' + campo.nombre + '»? No se usa en ningún sitio.') + '</p>', 'Quitar');
    if (!ok) return;
    try {
      if (campo.propioId) App.E.campos = await Campos.guardarPropios(App.E.gestor, function (l) { return l.filter(function (x) { return x.id !== campo.propioId; }); });
      else App.E.campos = await Campos.guardarCalculados(App.E.gestor, function (l) { return l.filter(function (x) { return x.id !== campo.calculadoId; }); });
      estado.sel = '';
      U.aviso('Campo quitado.', 'bueno');
      await recargar();
    } catch (e) { U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  function ligar() {
    var buscar = $('cl-buscar');
    buscar.oninput = function () {
      estado.q = buscar.value;
      clearTimeout(ligar.t);
      ligar.t = setTimeout(async function () { await pintar(); var b = $('cl-buscar'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 150);
    };
    $('cl-origen').onchange = function () { estado.origen = this.value; pintar(); };
    $('cl-persona').onchange = function () { estado.persona = +this.value || 0; pintar(); };
    Array.prototype.forEach.call(raiz.querySelectorAll('.campos-pastilla'), function (b) {
      b.onclick = function () { estado.grupo = b.getAttribute('data-g'); pintar(); };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('tbody tr[data-id]'), function (tr) {
      function elegir() { estado.sel = tr.getAttribute('data-id'); estado.nuevo = false; pintar(); }
      tr.onclick = elegir;
      tr.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); elegir(); } };
    });
    $('cl-nuevo-manual').onclick = function () { estado.nuevo = true; pintarDetalle(); };
    $('cl-nuevo-calculado').onclick = function () {
      var c = $('cl-detalle');
      estado.nuevo = false;
      /* Hasta la fila 529, el editor de siempre. */
      CamposCalculadosEditor.abrir(c, { existente: null, alGuardar: function (cal) { estado.sel = 'c:' + cal.id; recargar(); }, alCancelar: function () { pintarDetalle(); } });
    };
  }

  /* La sección se pinta al abrirla; se repinta cada vez que se vuelve a abrir (los datos pueden haber cambiado). */
  function montar() {
    var det = document.getElementById('bloque-lista-campos');
    raiz = document.getElementById('lista-campos-cuerpo');
    if (!det || !raiz) return;
    det.addEventListener('toggle', function () { if (det.open) recargar().catch(function (e) { U.fallo('No he podido abrir la lista de campos', e); }); });
    if (det.open) recargar().catch(function (e) { U.fallo('No he podido abrir la lista de campos', e); });
  }

  document.addEventListener('DOMContentLoaded', montar);
  if (document.readyState !== 'loading') montar();

  return { montar: montar, recargar: recargar, _estado: estado };
})();
window.CamposListaPantalla = CamposListaPantalla;
