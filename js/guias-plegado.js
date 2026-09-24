/* ============================================================
   guias-plegado.js — el cuadro de escribir la guía, en acordeón
   (24-sep-2026, fila 122, docs/GUIA-EN-ACORDEON.md).

   Cada paso cerrado ocupa una línea: número, título y unas marcas con
   lo que lleva dentro (Normativa, Documentos, Guion, Pregunta, Solo
   informativo y el responsable). Pulsar la línea (fuera de los
   botones) lo abre o lo cierra. Solo hay UN paso abierto en todo el
   editor; si es un paso de una opción, el paso-pregunta que lo contiene
   sigue abierto, para que se vea dónde está.

   No se quita nada del DOM: un paso cerrado lleva la clase
   `paso-plegado` y el CSS esconde todo lo que no sea su cabecera. Así
   recoger() de js/guias.js sigue leyendo todos los campos, abiertos o
   no, y lo que se guarda no cambia.

   `GuiasPlegado.crear(o)` con o = { nivel(), recoger, responsables }
   devuelve el acordeón de un editor:
   - `abrir(id)`: ese paso queda como el abierto (sin repintar).
   - `abrirAlLlegar(id)` / `alCambiarDeNivel()`: al cambiar de nivel
     todo nace cerrado, salvo el paso al que se va desde el mapa.
   - `aplicar()`: clases y líneas resumidas de lo que hay en pantalla;
     se llama al final de cada pintar().
   - `enganchar()`: el clic en la línea, una sola vez por cuadro.
   - `alTitulo(id)`: el cursor en el título de ese paso.
   - `seguir(id)`: que la pantalla siga a ese paso (al subirlo/bajarlo).
   `GuiasPlegado.marcas(p, responsables)` es la parte pura: la lista de
   marcas de un paso.
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
    if (cuantos(p.guion)) m.push('Guion (' + cuantos(p.guion) + ')');
    if (p.responsable) {
      var r = (responsables || []).filter(function (x) { return x.id === p.responsable; })[0];
      m.push(r ? r.nombre : p.responsable);
    }
    /* Fila 129: «Nos toca» o «Espera: Familia» (js/guias-toca.js). */
    if (window.GuiasToca && GuiasToca.marca(p, responsables)) m.push(GuiasToca.marca(p, responsables));
    return m;
  }

  /* El paso `id`, en el nivel que se ve o en los pasos de sus opciones. */
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

  function crear(o) {
    var abierto = null;
    var pendiente = null;

    function caja() { return document.getElementById('guia-pasos'); }

    function editores() {
      var c = caja();
      return c ? Array.prototype.slice.call(c.querySelectorAll('.paso-editor, .subpaso-editor')) : [];
    }

    function editorDe(id) {
      if (!id) return null;
      return editores().filter(function (el) { return el.dataset.pasoId === id; })[0] || null;
    }

    /* Abierto: el paso elegido y, si es de una opción, el paso-pregunta
       de arriba que lo contiene. */
    function estaAbierto(el) {
      if (!abierto) return false;
      if (el.dataset.pasoId === abierto) return true;
      if (!el.classList.contains('paso-editor')) return false;
      return !!editores().filter(function (x) {
        return x.dataset.pasoId === abierto && x.classList.contains('subpaso-editor') && el.contains(x);
      }).length;
    }

    function resumen(el) {
      var cab = el.querySelector(':scope > .paso-cabecera');
      if (!cab) return;
      var r = cab.querySelector(':scope > .paso-resumen');
      if (!r) {
        r = document.createElement('span');
        r.className = 'paso-resumen';
        var titulo = cab.querySelector(':scope > .paso-titulo, :scope > .subpaso-titulo');
        if (titulo && titulo.nextSibling) cab.insertBefore(r, titulo.nextSibling);
        else cab.appendChild(r);
      }
      var p = buscar(o.nivel(), el.dataset.pasoId);
      var t = p && p.titulo ? p.titulo : 'Paso sin título';
      r.innerHTML = '<span class="paso-resumen-titulo' + (p && p.titulo ? '' : ' suave') + '">' + U.escapar(t) + '</span>' +
        marcas(p, o.responsables).map(function (m) {
          return '<span class="paso-marca">' + U.escapar(m) + '</span>';
        }).join('');
    }

    function aplicar() {
      editores().forEach(function (el) {
        el.classList.toggle('paso-plegado', !estaAbierto(el));
        resumen(el);
      });
    }

    function abrir(id) { abierto = id || null; }

    function alternar(el) {
      o.recoger();
      abierto = el.classList.contains('paso-plegado') ? el.dataset.pasoId : null;
      aplicar();
      if (abierto && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }

    function enganchar() {
      var c = caja();
      if (!c) return;
      c.addEventListener('click', function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest('button, input, select, textarea, a, label, [contenteditable="true"]')) return;
        var cab = t.closest('.paso-cabecera');
        if (!cab || !cab.parentElement) return;
        var el = cab.parentElement;
        if (!el.classList.contains('paso-editor') && !el.classList.contains('subpaso-editor')) return;
        alternar(el);
      });
    }

    function alTitulo(id) {
      var el = editorDe(id);
      if (!el) return;
      var t = el.querySelector(':scope > .paso-cabecera > .paso-titulo, :scope > .paso-cabecera > .subpaso-titulo');
      if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      if (t) t.focus();
    }

    function seguir(id) {
      var el = editorDe(id);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }

    return {
      abrir: abrir, aplicar: aplicar, enganchar: enganchar, alTitulo: alTitulo, seguir: seguir,
      abierto: function () { return abierto; },
      abrirAlLlegar: function (id) { pendiente = id || null; },
      alCambiarDeNivel: function () { abierto = pendiente; pendiente = null; }
    };
  }

  return { crear: crear, marcas: marcas };
})();
window.GuiasPlegado = GuiasPlegado;
