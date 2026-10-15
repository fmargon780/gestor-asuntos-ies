/* ============================================================
   etiquetas-editor.js — los formularios de «Etiquetas»: un modelo de hoja y un diseño (fila 344, docs/ETIQUETAS.md).

   Se pintan dentro de la propia pantalla (no son cuadros). Nada se guarda aquí: avisan a quien los abrió.
   - modelo(estado): { tipo: 'modelo', modelo (copia que se edita), existente (id si se cambia uno propio), titulo, aviso? }.
   - diseno(estado): { tipo: 'diseno', diseno (copia que se edita), titulo, aviso? }.
   `aviso` (fila 346): lo que se dice arriba cuando se cambia uno de la app y se guardará como copia.
   - html(estado) y enganchar(raiz, estado, cb): `cb` = { guardar(objeto), cancelar(), cambio() }.
   ============================================================ */
var EtiquetasEditor = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }

  var MARGENES = [['sup', 'Margen de arriba'], ['inf', 'Margen de abajo'], ['izq', 'Margen izquierdo'], ['der', 'Margen derecho'],
    ['sepH', 'Separación entre columnas'], ['sepV', 'Separación entre filas']];

  function aviso(e) { return e.aviso ? '<p class="aviso aviso-ambar et-aviso-copia">' + esc(e.aviso) + '</p>' : ''; }

  function htmlTamano(m) {
    var h = EtiquetasModelos.hojaDe(m), otro = h.nombre === 'Otro' || !EtiquetasModelos.tamano(h.nombre);
    return '<div class="et-fila"><label class="etiqueta">Tamaño de la hoja <select class="campo" id="em-hoja">' +
      EtiquetasModelos.TAMANOS.map(function (t) {
        return '<option value="' + t.nombre + '"' + (!otro && t.nombre === h.nombre ? ' selected' : '') + '>' + t.nombre + ' (' + t.ancho + ' × ' + t.alto + ' mm)</option>';
      }).join('') + '<option value="Otro"' + (otro ? ' selected' : '') + '>Otro (medidas en mm)</option></select></label>' +
      '<span class="et-fila' + (otro ? '' : ' oculto') + '" id="em-hoja-otro">' +
      '<label class="etiqueta">Ancho (mm) <input class="campo" id="em-hoja-ancho" type="number" step="0.1" min="50" max="1000" value="' + esc(otro ? h.ancho : '') + '"></label>' +
      '<label class="etiqueta">Alto (mm) <input class="campo" id="em-hoja-alto" type="number" step="0.1" min="50" max="1000" value="' + esc(otro ? h.alto : '') + '"></label></span></div>';
  }

  function htmlModelo(e) {
    var m = e.modelo;
    return '<div class="et-editor" id="et-editor"><h4>' + esc(e.titulo) + '</h4>' + aviso(e) +
      '<label class="etiqueta">Nombre <input class="campo" id="em-nombre" value="' + esc(m.nombre) + '" maxlength="60"></label>' +
      '<div class="et-fila"><label class="etiqueta">Filas <input class="campo" id="em-filas" type="number" min="1" max="40" value="' + esc(m.filas || '') + '"></label>' +
      '<label class="etiqueta">Columnas <input class="campo" id="em-columnas" type="number" min="1" max="12" value="' + esc(m.columnas || '') + '"></label></div>' +
      htmlTamano(m) +
      '<p class="explica">La app reparte la hoja entera entre las casillas. Si al imprimir no cuadra, ajusta los márgenes.</p>' +
      '<details class="et-margenes"' + (e.margenesAbiertos ? ' open' : '') + '><summary>Márgenes y separaciones</summary><div class="et-fila et-fila-margenes">' +
      MARGENES.map(function (x) {
        return '<label class="etiqueta">' + x[1] + ' (mm) <input class="campo" data-margen="' + x[0] + '" type="number" step="0.1" value="' + esc(m[x[0]]) + '"></label>';
      }).join('') + '</div></details>' +
      '<p class="explica et-medida" id="em-medida"></p><p class="aviso aviso-ambar oculto" id="em-problema"></p>' +
      '<div class="et-botones"><button type="button" class="boton boton-principal" id="em-guardar">Guardar el modelo</button>' +
      '<button type="button" class="boton" id="em-cancelar">Cancelar</button></div></div>';
  }

  function htmlDiseno(e) {
    var d = e.diseno, campos = EtiquetasDatos.CAMPOS.filter(function (c) { return d.para === 'ambos' || c.para === 'ambos' || c.para === d.para; });
    function opcion(valor, texto, actual) { return '<option value="' + esc(valor) + '"' + (valor === actual ? ' selected' : '') + '>' + esc(texto) + '</option>'; }
    function alinear(a, x) { return '<button type="button" class="boton boton-mini" data-alinea-todo="' + a + '">' + x + '</button>'; }
    return '<div class="et-editor" id="et-editor"><h4>' + esc(e.titulo) + '</h4>' + aviso(e) +
      '<label class="etiqueta">Nombre <input class="campo" id="ed-nombre" value="' + esc(d.nombre) + '" maxlength="60"></label>' +
      '<div class="et-fila"><label class="etiqueta">Vale para <select class="campo" id="ed-para">' +
        opcion('alumnado', 'Alumnado', d.para) + opcion('personal', 'Personal', d.para) + opcion('ambos', 'Los dos', d.para) + '</select></label>' +
      '<label class="et-casilla-texto"><input type="checkbox" id="ed-familia"' + (d.unaPorFamilia ? ' checked' : '') + (d.para === 'personal' ? ' disabled' : '') + '> Una por familia (los hermanos salen en una sola)</label></div>' +
      '<div class="et-fila et-alinear-todo"><span class="et-casilla-texto">Alinear todo:</span>' +
        alinear('izq', 'A la izquierda') + alinear('centro', 'Centrado') + alinear('der', 'A la derecha') + '</div>' +
      '<div class="et-fila et-colocar"><span class="et-casilla-texto">Colocar el texto:</span>' +
        [['arriba', 'Arriba'], ['centro', 'Centro'], ['abajo', 'Abajo']].map(function (v) {
          var activo = (d.vertical || 'centro') === v[0];
          return '<button type="button" class="boton boton-mini' + (activo ? ' et-activa' : '') + '" data-vertical="' + v[0] + '" aria-pressed="' + activo + '">' + v[1] + '</button>';
        }).join('') + '</div>' +
      '<div class="et-renglones">' + d.renglones.map(function (x, i) {
        return '<div class="et-renglon" data-i="' + i + '"><span class="et-renglon-n">' + (i + 1) + '</span>' +
          '<select class="campo" data-r="dato">' + campos.map(function (c) { return opcion(c.clave, c.texto, x.dato); }).join('') + opcion('texto', 'Texto fijo…', x.dato) + '</select>' +
          (x.dato === 'texto' ? '<input class="campo" data-r="texto" value="' + esc(x.texto) + '" placeholder="Escribe el texto">' : '') +
          '<label class="et-casilla-texto"><input type="checkbox" data-r="negrita"' + (x.negrita ? ' checked' : '') + '> Negrita</label>' +
          '<select class="campo" data-r="tamano">' + opcion('pequeno', 'Letra pequeña', x.tamano) + opcion('normal', 'Letra normal', x.tamano) + opcion('grande', 'Letra grande', x.tamano) + '</select>' +
          '<select class="campo" data-r="alinea">' + opcion('izq', 'A la izquierda', x.alinea) + opcion('centro', 'Centrado', x.alinea) + opcion('der', 'A la derecha', x.alinea) + '</select>' +
          '<button type="button" class="boton boton-mini" data-sube="' + i + '" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" class="boton boton-mini" data-baja="' + i + '" aria-label="Bajar"' + (i === d.renglones.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button type="button" class="boton boton-mini" data-quita="' + i + '" aria-label="Quitar el renglón">✕</button></div>';
      }).join('') + '</div>' +
      '<div class="et-botones"><button type="button" class="boton" id="ed-mas">+ Añadir un renglón</button></div>' +
      '<p class="aviso aviso-ambar oculto" id="ed-problema"></p>' +
      '<div class="et-botones"><button type="button" class="boton boton-principal" id="ed-guardar">Guardar el diseño</button>' +
      '<button type="button" class="boton" id="ed-cancelar">Cancelar</button></div></div>';
  }

  function html(e) { return e.tipo === 'modelo' ? htmlModelo(e) : htmlDiseno(e); }

  function enganchaModelo(raiz, e, cb) {
    var m = e.modelo, q = function (id) { return raiz.querySelector('#' + id); };
    function leer() {
      m.nombre = q('em-nombre').value;
      m.filas = parseInt(q('em-filas').value, 10) || 0;
      m.columnas = parseInt(q('em-columnas').value, 10) || 0;
      MARGENES.forEach(function (x) { m[x[0]] = num(raiz.querySelector('[data-margen="' + x[0] + '"]').value); });
      var tam = q('em-hoja').value, t = EtiquetasModelos.tamano(tam);
      q('em-hoja-otro').classList.toggle('oculto', !!t);
      m.hoja = t ? { nombre: t.nombre, ancho: t.ancho, alto: t.alto } : { nombre: 'Otro', ancho: num(q('em-hoja-ancho').value), alto: num(q('em-hoja-alto').value) };
      var p = m.filas && m.columnas ? EtiquetasModelos.problema(m) : 'Pon las filas y las columnas.';
      q('em-problema').classList.toggle('oculto', !p);
      q('em-problema').textContent = p;
      q('em-medida').textContent = p ? '' : 'Cada etiqueta mide ' + EtiquetasModelos.texto(m).split(' · ')[1];
      return p;
    }
    Array.prototype.forEach.call(raiz.querySelectorAll('#et-editor input'), function (i) { i.oninput = function () { leer(); cb.cambio(); }; });
    q('em-hoja').onchange = function () { leer(); cb.cambio(); };
    q('em-cancelar').onclick = cb.cancelar;
    q('em-guardar').onclick = function () {
      var p = leer();
      if (!m.nombre.trim()) { q('em-problema').textContent = 'Ponle un nombre.'; q('em-problema').classList.remove('oculto'); return; }
      if (p) return;
      cb.guardar(m);
    };
    leer();
  }

  function enganchaDiseno(raiz, e, cb) {
    var d = e.diseno, q = function (id) { return raiz.querySelector('#' + id); };
    q('ed-nombre').oninput = function () { d.nombre = this.value; };
    q('ed-para').onchange = function () {
      d.para = this.value;
      if (d.para === 'personal') d.unaPorFamilia = false;
      /* un renglón con un dato que ya no vale para esta clase de persona vuelve al primero que sí */
      d.renglones.forEach(function (x) {
        if (x.dato === 'texto') return;
        var c = EtiquetasDatos.CAMPOS.filter(function (k) { return k.clave === x.dato; })[0];
        if (c && d.para !== 'ambos' && c.para !== 'ambos' && c.para !== d.para) x.dato = d.para === 'personal' ? 'departamento' : 'unidad';
      });
      cb.repintar();
    };
    q('ed-familia').onchange = function () { d.unaPorFamilia = this.checked; cb.cambio(); };
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-alinea-todo]'), function (b) {
      b.onclick = function () { var a = b.getAttribute('data-alinea-todo'); d.renglones.forEach(function (x) { x.alinea = a; }); cb.repintar(); };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-vertical]'), function (b) {
      b.onclick = function () { d.vertical = b.getAttribute('data-vertical'); cb.repintar(); };
    });
    q('ed-mas').onclick = function () { d.renglones.push(EtiquetasDisenos.nuevoRenglon()); cb.repintar(); };
    Array.prototype.forEach.call(raiz.querySelectorAll('.et-renglon'), function (fila) {
      var i = Number(fila.getAttribute('data-i')), x = d.renglones[i];
      Array.prototype.forEach.call(fila.querySelectorAll('[data-r]'), function (c) {
        var k = c.getAttribute('data-r');
        c.onchange = c.oninput = function () {
          x[k] = c.type === 'checkbox' ? c.checked : c.value;
          if (k === 'dato') { if (x.dato === 'texto' && x.texto === undefined) x.texto = ''; cb.repintar(); } else cb.cambio();
        };
      });
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-sube],[data-baja],[data-quita]'), function (b) {
      b.onclick = function () {
        var s = b.getAttribute('data-sube'), j = b.getAttribute('data-baja'), k = b.getAttribute('data-quita');
        if (s !== null) { s = Number(s); d.renglones.splice(s - 1, 0, d.renglones.splice(s, 1)[0]); }
        else if (j !== null) { j = Number(j); d.renglones.splice(j + 1, 0, d.renglones.splice(j, 1)[0]); }
        else d.renglones.splice(Number(k), 1);
        cb.repintar();
      };
    });
    q('ed-cancelar').onclick = cb.cancelar;
    q('ed-guardar').onclick = function () {
      var p = q('ed-problema'), msg = '';
      if (!d.nombre.trim()) msg = 'Ponle un nombre.';
      else if (!d.renglones.length) msg = 'Añade al menos un renglón.';
      else if (d.renglones.some(function (x) { return x.dato === 'texto' && !String(x.texto || '').trim(); })) msg = 'Hay un texto fijo vacío.';
      p.textContent = msg; p.classList.toggle('oculto', !msg);
      if (!msg) cb.guardar(d);
    };
  }

  function enganchar(raiz, e, cb) {
    if (e.tipo === 'modelo') enganchaModelo(raiz, e, cb); else enganchaDiseno(raiz, e, cb);
  }

  return { html: html, enganchar: enganchar };
})();
window.EtiquetasEditor = EtiquetasEditor;
