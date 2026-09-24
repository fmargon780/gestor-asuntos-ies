/* ============================================================
   guias-niveles.js — entrar y salir de las preguntas de dentro en el
   cuadro de escribir la guía (fila 95), sacado de js/guias.js
   (24-sep-2026, fila 113, docs/MAPA-DE-LA-GUIA.md: aquel fichero
   pasaba de las 1.200 líneas).

   `GuiasNiveles.crear(o)` con o = { pasos, nombreTipo, recoger, pintar,
   alCambiar(lista) } devuelve el navegador de niveles de un editor:
   - `irA(camino)`: ir a un nivel (camino = [{ pregunta, opcion, lista }]).
   - `entrar(p, op)`: a los pasos de la opción `op` de la pregunta `p`.
   - `pintarCamino()`: «← Volver» y la línea de camino (#guia-camino).
   - `irAPaso(id)`: al nivel donde está ese paso, con él desplegado y a
     la vista (lo usa el mapa, js/guias-mapa.js).
   `GuiasNiveles.caminoHasta(pasos, id)` es la búsqueda, pura.
   ============================================================ */
var GuiasNiveles = (function () {
  function $(id) { return document.getElementById(id); }

  function tramo(p, o) {
    return { pregunta: p.titulo || 'Pregunta sin título', opcion: o.titulo || 'Opción sin nombre', lista: o.pasos };
  }

  /* El camino hasta la lista que contiene el paso `id`; [] si está arriba,
     null si no está. */
  function caminoHasta(pasos, id) {
    function buscar(lista, camino) {
      for (var i = 0; i < (lista || []).length; i++) {
        var p = lista[i];
        if (p.id === id) return camino;
        var ops = p.opciones || [];
        for (var j = 0; j < ops.length; j++) {
          var r = buscar(ops[j].pasos, camino.concat([tramo(p, ops[j])]));
          if (r) return r;
        }
      }
      return null;
    }
    return buscar(pasos, []);
  }

  function crear(o) {
    var camino = [];

    function nivelDe(c) { return c.length ? c[c.length - 1].lista : o.pasos; }

    function irA(nuevoCamino) {
      o.recoger();
      camino = nuevoCamino;
      o.alCambiar(nivelDe(camino));
      $('guia-pasos').innerHTML = '';   /* que pintar() no arrastre los plegables del nivel de antes */
      o.pintar();
      var cuerpo = document.querySelector('#capa .cuadro-cuerpo') || document.getElementById('cuadro-cuerpo');
      if (cuerpo && cuerpo.scrollTo) cuerpo.scrollTo(0, 0);
    }

    function entrar(p, op) { irA(camino.concat([tramo(p, op)])); }

    function pintarCamino() {
      var caja = $('guia-camino');
      if (!caja) return;
      if (!camino.length) { caja.innerHTML = ''; caja.classList.add('oculto'); return; }
      caja.classList.remove('oculto');
      var trozos = ['<button type="button" class="guia-camino-trozo" data-nivel="0">Guía de ' +
        U.escapar(o.nombreTipo) + '</button>'];
      camino.forEach(function (c, k) {
        trozos.push('<span class="guia-camino-pregunta">' + U.escapar(c.pregunta) + '</span>');
        trozos.push(k === camino.length - 1
          ? '<strong class="guia-camino-aqui">' + U.escapar(c.opcion) + '</strong>'
          : '<button type="button" class="guia-camino-trozo" data-nivel="' + (k + 1) + '">' + U.escapar(c.opcion) + '</button>');
      });
      caja.innerHTML = '<button type="button" class="boton" id="guia-volver">← Volver</button> ' +
        trozos.join(' <span class="suave">›</span> ');
      $('guia-volver').onclick = function () { irA(camino.slice(0, -1)); };
      Array.prototype.forEach.call(caja.querySelectorAll('.guia-camino-trozo'), function (b) {
        b.onclick = function () { irA(camino.slice(0, parseInt(b.dataset.nivel, 10))); };
      });
    }

    function irAPaso(id) {
      o.recoger();
      var c = caminoHasta(o.pasos, id);
      if (!c) return false;
      irA(c);
      var pos = nivelDe(camino).map(function (p) { return p.id; }).indexOf(id);
      var d = document.querySelector('#guia-pasos > .paso-editor[data-pos="' + pos + '"]');
      if (!d) return true;
      var extra = d.querySelector(':scope > .paso-extra');
      if (extra) extra.open = true;
      d.classList.add('paso-destacado');
      if (d.scrollIntoView) d.scrollIntoView({ block: 'start' });
      var t = d.querySelector('.paso-titulo');
      if (t) t.focus({ preventScroll: true });
      return true;
    }

    return { irA: irA, entrar: entrar, pintarCamino: pintarCamino, irAPaso: irAPaso };
  }

  return { crear: crear, caminoHasta: caminoHasta };
})();
window.GuiasNiveles = GuiasNiveles;
