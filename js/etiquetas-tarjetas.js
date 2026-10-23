/* ============================================================
   etiquetas-tarjetas.js — las tres tarjetas de encima de la hoja: Hoja, Diseño y Orden (fila 450,
   docs/ETIQUETAS-RECUERDA-TU-TRABAJO.md). Antes la hoja y el diseño estaban en el panel de la izquierda.

   En una fila a todo el ancho: «Hoja» (modelo y columnas × filas), «Diseño» y «Orden». Pulsar una la despliega
   debajo, en ese mismo sitio; pulsarla otra vez, o pulsar otra, la pliega (solo una abierta). Los formularios de
   un modelo o un diseño salen en el mismo despliegue.

   - html(g) / enganchar(raiz, g) / pintar(g): la zona (`#et-tarjetas`).
   - filtrarModelos(lista, texto, actualId), textoOrden(id), ORDENES.
   `g` = lo que da js/etiquetas-pantalla.js: { E (su estado), nor, modelos(), disenos(), vale(d), soloConsulta(),
   pintar(), elegirModelo(id), elegirDiseno(id), elegirOrden(id), nuevoModelo(), cambiarModelo(), borrarModelo(),
   nuevoDiseno(), duplicarDiseno(), cambiarDiseno(), borrarDiseno(), editor: { guardar, cancelar, cambio, repintar } }.
   ============================================================ */
var EtiquetasTarjetas = (function () {

  var ORDENES = [
    { id: 'grupo', texto: 'Por grupo y apellidos' },
    { id: 'apellidos', texto: 'Por apellidos' },
    { id: 'nombre', texto: 'Por nombre' },
    { id: 'marcado', texto: 'En el orden en que los marco' }
  ];

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function $(id) { return document.getElementById(id); }

  function textoOrden(id) {
    var o = ORDENES.filter(function (x) { return x.id === id; })[0];
    return (o || ORDENES[0]).texto;
  }

  function opciones(lista, actual, texto) {
    return lista.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === actual ? ' selected' : '') + '>' + esc(texto(o)) + '</option>'; }).join('');
  }

  function filtrarModelos(g, l, texto, actual) {
    var q = g.nor(texto).replace(/\s+/g, '').replace(/[x×]/g, 'x');
    if (!q) return l;
    return l.filter(function (m) {
      if (m.id === actual) return true;
      var a = g.nor(m.nombre + (m.codigo || '') + (m.apli || '')).replace(/\s+/g, ''), b = (m.filas + 'x' + m.columnas), c = (m.columnas + 'x' + m.filas);
      return a.indexOf(q) !== -1 || b === q || c === q;
    });
  }

  function textoModelo(x) { return x.nombre + ' · ' + x.columnas + ' × ' + x.filas + (x.propio ? ' (propio)' : ''); }

  /* ---------- lo que hay dentro de cada tarjeta ---------- */

  function htmlHoja(g) {
    var E = g.E, m = E.modelo, propio = !!(m && m.propio), off = g.soloConsulta() ? ' disabled' : '';
    return '<label class="etiqueta">Buscar por código o por filas × columnas <input class="campo" id="et-buscar-modelo" data-solo-lectura value="' + esc(E.buscarModelo || '') + '" placeholder="L7160, 3x8…"></label>' +
      '<select class="campo" id="et-modelo" data-solo-lectura>' + opciones(filtrarModelos(g, g.modelos(), E.buscarModelo, m.id), m.id, textoModelo) + '</select>' +
      '<p class="explica" id="et-medida-modelo">' + esc(EtiquetasModelos.texto(m)) + '</p>' +
      '<div class="et-botones"><button type="button" class="boton" id="et-modelo-nuevo"' + off + '>Nuevo modelo</button>' +
      '<button type="button" class="boton" id="et-modelo-cambiar"' + off + '>Cambiar</button>' +
      (propio ? '<button type="button" class="boton" id="et-modelo-borrar"' + off + '>Borrar este modelo</button>' : '') + '</div>';
  }

  function htmlDiseno(g) {
    var E = g.E, l = g.disenos().filter(g.vale), d = E.diseno;
    var propio = !!d && !d.integrado;
    var ALINEA = { centro: ' · centrado', der: ' · a la derecha' };
    var off = g.soloConsulta() ? ' disabled' : '';
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

  function htmlOrden(g) {
    var actual = g.E.orden;
    return '<div class="et-ordenes" role="radiogroup" aria-label="Orden de las etiquetas">' + ORDENES.map(function (o) {
      return '<button type="button" class="boton et-orden' + (o.id === actual ? ' et-activa' : '') + '" role="radio" aria-checked="' + (o.id === actual) + '" data-orden="' + o.id + '" data-solo-lectura>' + esc(o.texto) + '</button>';
    }).join('') + '</div>' +
      (actual === 'marcado' ? '<p class="explica">Las que entran de golpe (un grupo, una clase, un departamento) van juntas, por grupo y apellidos; las que añades o vuelves a marcar, detrás, en el orden en que las marcas.</p>' : '');
  }

  /* ---------- la zona ---------- */

  function abierta(g) {
    var E = g.E;
    return E.editor ? (E.editor.tipo === 'modelo' ? 'hoja' : 'diseno') : E.tarjeta;
  }

  function html(g) {
    var E = g.E, ab = abierta(g);
    var tarjetas = [
      ['hoja', 'Hoja', E.modelo.codigo ? 'Avery ' + E.modelo.nombre : (E.modelo.nombre || 'Nuevo modelo'), E.modelo.columnas && E.modelo.filas ? ' · ' + E.modelo.columnas + ' × ' + E.modelo.filas : ''],
      ['diseno', 'Diseño', E.diseno.nombre || 'Nuevo diseño', ''],
      ['orden', 'Orden', textoOrden(E.orden), '']
    ];
    var h = '<div class="et-tarjetas-fila">' + tarjetas.map(function (t) {
      return '<button type="button" class="et-tarjeta' + (ab === t[0] ? ' et-tarjeta-abierta' : '') + '" data-tarjeta="' + t[0] + '" aria-expanded="' + (ab === t[0]) + '">' +
        '<span class="et-tarjeta-titulo">' + t[1] + '</span><span class="et-tarjeta-valor">' + esc(t[2] + t[3]) + '</span></button>';
    }).join('') + '</div>';
    if (E.editor) h += '<div class="et-despliegue" id="et-despliegue">' + EtiquetasEditor.html(E.editor) + '</div>';
    else if (ab) h += '<div class="et-despliegue" id="et-despliegue">' + (ab === 'hoja' ? htmlHoja(g) : (ab === 'diseno' ? htmlDiseno(g) : htmlOrden(g))) + '</div>';
    return h;
  }

  function enganchar(raiz, g) {
    var E = g.E;
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-tarjeta]'), function (b) {
      b.onclick = function () {
        if (E.editor) return;
        var t = b.getAttribute('data-tarjeta');
        E.tarjeta = E.tarjeta === t ? '' : t;
        pintar(g);
      };
    });
    if (E.editor) {
      EtiquetasEditor.enganchar($('et-despliegue'), E.editor, g.editor);
      return;
    }
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-orden]'), function (b) {
      b.onclick = function () { g.elegirOrden(b.getAttribute('data-orden')); };
    });
    var bm = $('et-buscar-modelo'), sm = $('et-modelo'), sd = $('et-diseno');
    if (bm) bm.oninput = function () {
      E.buscarModelo = this.value;
      sm.innerHTML = opciones(filtrarModelos(g, g.modelos(), E.buscarModelo, E.modelo.id), E.modelo.id, textoModelo);
    };
    if (sm) sm.onchange = function () { g.elegirModelo(this.value); };
    if (sd) sd.onchange = function () { g.elegirDiseno(this.value); };
    var clic = function (id, f) { var b = $(id); if (b) b.onclick = f; };
    clic('et-modelo-nuevo', g.nuevoModelo);
    clic('et-modelo-cambiar', g.cambiarModelo);
    clic('et-modelo-borrar', g.borrarModelo);
    clic('et-diseno-nuevo', g.nuevoDiseno);
    clic('et-diseno-duplicar', g.duplicarDiseno);
    clic('et-diseno-editar', g.cambiarDiseno);
    clic('et-diseno-borrar', g.borrarDiseno);
  }

  /* Repinta solo la zona de las tarjetas (plegar y desplegar no toca nada más). */
  function pintar(g) {
    var zona = $('et-tarjetas');
    if (!zona) return;
    zona.innerHTML = html(g);
    enganchar(zona, g);
  }

  return { ORDENES: ORDENES, textoOrden: textoOrden, filtrarModelos: filtrarModelos, html: html, enganchar: enganchar, pintar: pintar };
})();
window.EtiquetasTarjetas = EtiquetasTarjetas;
