/* ============================================================
   guias-plegado.js — qué hito se ve en el editor de la guía.

   Fila 122 (24-sep-2026) lo hizo acordeón; desde la fila 463 (25-oct-2026,
   docs/EDITOR-DE-LA-GUIA-CLARO.md, parte A) es la lista de la columna
   izquierda: un hito elegido a la vez, y es el que se ve en la derecha.

   No se quita nada del DOM: un hito no elegido lleva la clase
   `paso-plegado` y el CSS lo esconde entero. Así recoger() de
   js/guias-editor.js sigue leyendo todos los campos, se vean o no, y lo
   que se guarda no cambia. Los hitos de dentro de una respuesta no se
   pliegan: se ven siempre, dentro de la pregunta que los contiene.

   `GuiasPlegado.crear(o)` con o = { nivel(), recoger, responsables,
   alElegir(editor) } devuelve el selector de un editor:
   - `abrir(id)`: ese hito queda como el elegido (sin repintar).
   - `abrirAlLlegar(id)` / `alCambiarDeNivel()`: al cambiar de nivel se
     elige el hito al que se va desde el mapa, o el primero.
   - `aplicar()`: clases, lista de la izquierda y resúmenes; se llama al
     final de cada pintar().
   - `enganchar()`: la lista y los avisos de cambio, una sola vez por cuadro.
   - `alTitulo(id)`: el cursor en el título de ese hito.
   - `seguir(id)`: ese hito queda elegido y a la vista (al subirlo/bajarlo).
   `GuiasPlegado.marcas(p, responsables)` es la parte pura: la lista de
   marcas de un hito.
   ============================================================ */
var GuiasPlegado = (function () {

  function cuantos(x) { return Array.isArray(x) ? x.length : 0; }

  function marcas(p, responsables) {
    var m = [];
    if (!p) return m;
    var pregunta = !!(p.opciones && p.opciones.length);
    if (pregunta) m.push('Pregunta');
    if (p.soloInformativo) m.push('Solo informativo');
    if (cuantos(p.normativa)) m.push('Normativa (' + cuantos(p.normativa) + ')');
    if (cuantos(p.plantillasDocumento)) m.push('Documentos (' + cuantos(p.plantillasDocumento) + ')');
    if (cuantos(p.guion)) m.push('Tareas (' + cuantos(p.guion) + ')');
    if (p.responsable) {
      var r = (responsables || []).filter(function (x) { return x.id === p.responsable; })[0];
      m.push(r ? r.nombre : (window.ResponsableOrganismo && ResponsableOrganismo.esOrganismo(p.responsable) ? ResponsableOrganismo.nombreDe(p.responsable, p.responsableNombre) : p.responsable));
    }
    /* Fila 129: «Nos toca» o «Espera: Familia» (js/guias-toca.js). */
    if (window.GuiasToca && GuiasToca.marca(p, responsables)) m.push(GuiasToca.marca(p, responsables));
    return m;
  }

  /* El hito `id`, en el nivel que se ve o en los hitos de sus opciones. */
  function buscar(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) {
      var p = lista[i];
      if (p.id === id) return p;
      var ops = p.opciones || [];
      for (var j = 0; j < ops.length; j++) {
        var r = buscar(ops[j].pasos, id);
        if (r) return r;
      }
    }
    return null;
  }

  /* La línea gris de un hito en la columna de la izquierda (fila 463, A2):
     responsable y número de tareas, y detrás las marcas de siempre
     (pregunta, solo informativo, espera…). */
  function lineaDeLista(p, responsables) {
    var m = marcas(p, responsables);
    var partes = [];
    var resp = '';
    if (p && p.responsable) {
      var r = (responsables || []).filter(function (x) { return x.id === p.responsable; })[0];
      resp = r ? r.nombre : (window.ResponsableOrganismo && ResponsableOrganismo.esOrganismo(p.responsable) ? ResponsableOrganismo.nombreDe(p.responsable, p.responsableNombre) : p.responsable);
    }
    if (resp) partes.push(resp);
    var t = cuantos(p && p.guion);
    if (t) partes.push(t + (t === 1 ? ' tarea' : ' tareas'));
    m.forEach(function (x) {
      if (x === resp || /^Tareas \(/.test(x)) return;
      partes.push(x);
    });
    return partes.join(' · ');
  }

  function crear(o) {
    var abierto = null;     /* el hito elegido (columna derecha) */
    var pendiente = null;

    function caja() { return document.getElementById('guia-pasos'); }

    function editores() {
      var c = caja();
      return c ? Array.prototype.slice.call(c.querySelectorAll('.paso-editor, .subpaso-editor')) : [];
    }

    function altos() {
      var c = caja();
      return c ? Array.prototype.slice.call(c.querySelectorAll(':scope > .paso-editor')) : [];
    }

    function editorDe(id) {
      if (!id) return null;
      return editores().filter(function (el) { return el.dataset.pasoId === id; })[0] || null;
    }

    /* El hito elegido: el de `abierto`; si ese es un hito de dentro de una
       respuesta, el hito pregunta que lo contiene; si no hay, el primero. */
    function elegido() {
      var lista = altos();
      if (!lista.length) return null;
      var el = abierto ? editorDe(abierto) : null;
      if (el) {
        var arriba = el.classList.contains('paso-editor') ? el : el.closest('.paso-editor');
        if (arriba) return arriba;
      }
      return lista[0];
    }

    /* Los botones de la lista se reutilizan y su contenido solo se toca si ha
       cambiado: si no, un clic que empieza en la lista justo después de escribir
       en un campo (el cambio repinta) se perdería, porque el botón ya no existe. */
    function pintarLista(sel) {
      var cont = document.getElementById('guia-lista');
      if (!cont) return;
      var nivel = o.nivel();
      while (cont.children.length > nivel.length) cont.removeChild(cont.lastChild);
      nivel.forEach(function (p, i) {
        var b = cont.children[i];
        if (!b) {
          b = document.createElement('button');
          b.type = 'button';
          cont.appendChild(b);
        }
        var elegidoAhora = !!(sel && sel.dataset.pasoId === p.id);
        b.className = 'guia-lista-item' + (elegidoAhora ? ' elegido' : '');
        b.dataset.pasoId = p.id;
        if (elegidoAhora) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
        var html = '<span class="paso-numero">' + (i + 1) + '</span>' +
          '<span class="guia-lista-texto">' +
            '<span class="guia-lista-titulo' + (p.titulo ? '' : ' suave') + '">' + U.escapar(p.titulo || 'Hito sin título') + '</span>' +
            '<span class="guia-lista-gris suave">' + U.escapar(lineaDeLista(p, o.responsables)) + '</span>' +
          '</span>';
        if (b.dataset.html !== html) { b.innerHTML = html; b.dataset.html = html; }
      });
    }

    function aplicar() {
      var sel = elegido();
      if (sel) abierto = sel.dataset.pasoId;
      altos().forEach(function (el) { el.classList.toggle('paso-plegado', el !== sel); });
      editores().forEach(function (el) {
        var p = buscar(o.nivel(), el.dataset.pasoId);
        if (window.GuiasColumnas) GuiasColumnas.actualizar(el, p, o.responsables);
        /* «Tareas de este hito» siempre a la vista: no se pliega. */
        var g = el.querySelector(':scope > .paso-guion');
        if (g && !g.open) g.open = true;
        /* Lo mismo con «Normativa e impresos»: el apartado ya lo pliega; el desplegable de dentro, no. */
        var nm = el.querySelector(':scope > .paso-normativa');
        if (nm && !nm.open) nm.open = true;
      });
      var vacio = document.getElementById('guia-vacio-der');
      if (vacio) vacio.classList.toggle('oculto', !!sel);
      pintarLista(sel);
      if (o.alElegir) o.alElegir(sel);
    }

    function abrir(id) { abierto = id || null; }

    function elegirPorLista(id) {
      o.recoger();
      abierto = id;
      aplicar();
      var der = document.getElementById('guia-col-der');
      if (der) der.scrollTop = 0;
    }

    function enganchar() {
      var c = caja();
      if (!c) return;
      /* La línea gris y los resúmenes siguen a lo que se marca. */
      c.addEventListener('change', function () { o.recoger(); aplicar(); });
      /* El título, en la lista de la izquierda, al escribirlo. */
      c.addEventListener('input', function (ev) {
        var t = ev.target;
        if (!t || !t.classList || !t.classList.contains('paso-titulo')) return;
        var el = t.closest('.paso-editor');
        var item = el && document.querySelector('#guia-lista .guia-lista-item[data-paso-id="' + el.dataset.pasoId + '"] .guia-lista-titulo');
        if (!item) return;
        item.textContent = t.value.trim() || 'Hito sin título';
        item.classList.toggle('suave', !t.value.trim());
        item.closest('.guia-lista-item').dataset.html = '';   /* que el próximo aplicar() lo vuelva a escribir entero */
      });
      var lista = document.getElementById('guia-lista');
      if (lista) lista.addEventListener('click', function (ev) {
        var b = ev.target && ev.target.closest && ev.target.closest('.guia-lista-item');
        if (b) elegirPorLista(b.dataset.pasoId);
      });
      /* «Tareas de este hito» no se pliega: si se cierra con el teclado, se reabre. */
      c.addEventListener('toggle', function (ev) {
        var t = ev.target;
        if (t && t.classList && (t.classList.contains('paso-guion') || t.classList.contains('paso-normativa')) && !t.open) t.open = true;
      }, true);
    }

    function alTitulo(id) {
      var el = editorDe(id);
      if (!el) return;
      aplicar();
      var t = el.querySelector(':scope > .paso-cabecera .paso-titulo, :scope > .paso-cabecera .subpaso-titulo');
      if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      if (t) t.focus();
    }

    function seguir(id) {
      abierto = id;
      aplicar();
      var el = editorDe(id);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }

    return {
      abrir: abrir, aplicar: aplicar, enganchar: enganchar, alTitulo: alTitulo, seguir: seguir,
      abierto: function () { return abierto; },
      elegido: elegido,
      abrirAlLlegar: function (id) { pendiente = id || null; },
      alCambiarDeNivel: function () { abierto = pendiente; pendiente = null; }
    };
  }

  return { crear: crear, marcas: marcas, lineaDeLista: lineaDeLista };
})();
window.GuiasPlegado = GuiasPlegado;
