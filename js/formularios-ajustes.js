/* ============================================================
   formularios-ajustes.js — Ajustes → El centro → «Impresos oficiales»
   (fila 84, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md; rehecha en la
   fila 146, 25-sep-2026, docs/IMPRESOS-CASILLAS-LEGIBLES.md, y sacada de
   js/formularios-rellenar.js).

   Un bloque plegado por impreso con PDF en `formularios/`. Su resumen:
   «N casillas del centro puestas», «Sin casillas del centro» (leído, sin
   ninguna) o «Sin leer todavía». Dentro, «Leer las casillas del PDF» (la
   lectura espera a un clic: varias pruebas despliegan todos los
   `<details>` de Ajustes) y, leídas:

   - Arriba, abiertas, las del centro; debajo, plegadas, «Otras casillas
     (N)» y «Datos de la persona (N) — no se rellenan nunca». Cada fila con
     su nombre legible («Página 2 · Primer apellido»; el interno, en el
     `title`), su desplegable de hueco y una miniatura de dónde está, que
     se pinta al pasar por encima o al desplegar su grupo; pulsarla la
     enseña en grande ahí mismo. Las repetidas, en una sola fila.
   - Si el impreso no tenía nada guardado, la propuesta se guarda sola
     (una escritura) y se avisa en verde.

   `_GESTOR/formularios-campos.json` no cambia de forma: guarda el nombre
   interno de cada casilla (js/formularios-rellenar.js).
   ============================================================ */
var FormulariosAjustes = (function () {

  var R = function () { return window.FormulariosRellenar; };
  var C = function () { return window.FormulariosCasillas; };
  var leidos = {};   /* nombreFichero -> { casillas, posiciones, bytes } o { falta } o { sinFormulario } */

  function $(id) { return document.getElementById(id); }

  function opcionesHuecos(elegido) {
    return '<option value="">(sin asignar)</option>' + R().HUECOS.map(function (h) {
      return '<option value="' + U.escapar(h.clave) + '"' + (h.clave === elegido ? ' selected' : '') + '>' +
        U.escapar(h.etiqueta) + '</option>';
    }).join('');
  }

  function cuantasDelCentro(guardado) {
    return C().agrupar(Object.keys(guardado || {})).length;
  }

  function textoResumen(f, guardado) {
    var n = cuantasDelCentro(guardado);
    if (n) return n + (n === 1 ? ' casilla del centro puesta' : ' casillas del centro puestas');
    var l = leidos[f.f];
    if (l && (l.casillas || l.sinFormulario)) return 'Sin casillas del centro';
    return 'Sin leer todavía';
  }

  async function leer(f) {
    if (leidos[f.f] && !leidos[f.f].falta) return leidos[f.f];
    var bytes;
    try { bytes = await R().leerPdfDelRepositorio(f.f); } catch (e) { return (leidos[f.f] = { falta: true }); }
    var casillas = await R().casillasDe(bytes);
    if (!casillas) return (leidos[f.f] = { sinFormulario: true });
    var posiciones = {};
    try { posiciones = await C().posicionesDe(bytes); } catch (e) { posiciones = {}; }
    return (leidos[f.f] = { casillas: casillas, posiciones: posiciones, bytes: bytes });
  }

  function filaHTML(g, i, hueco) {
    return '<div class="fila-tipo impreso-casilla" data-grupo="' + i + '" title="' + U.escapar(g.nombres.join('\n')) + '">' +
      '<span class="impreso-mini" title="Pulsa para verla en grande"></span>' +
      '<span class="nombre-tipo impreso-casilla-nombre">' + U.escapar(g.etiqueta) + '</span>' +
      '<select class="campo campo-hueco-impreso">' + opcionesHuecos(hueco || '') + '</select>' +
    '</div>';
  }

  async function pintarDetalle(contenedor, clave, f, resumen) {
    contenedor.innerHTML = '<p class="suave">Leyendo el PDF…</p>';
    var l = await leer(f);
    if (l.falta) {
      contenedor.innerHTML = '<p class="suave">No encuentro "' + U.escapar(f.f) + '" en <code>formularios/</code> todavía.</p>';
      return;
    }
    if (l.sinFormulario) {
      contenedor.innerHTML = '<p class="suave">Este impreso no se puede rellenar: no trae casillas. Se guardará en blanco.</p>';
      resumen.textContent = textoResumen(f, {});
      return;
    }
    var mapas = await R().cargar(App.E.gestor);
    var guardado = mapas[clave] || {};

    /* Sin nada guardado, la propuesta se guarda sola (una escritura). */
    if (!Object.keys(guardado).length) {
      var propuesta = R().proponerMapa(l.casillas);
      if (Object.keys(propuesta).length) {
        try {
          var nuevo = await R().guardar(App.E.gestor, function (actual) {
            if (actual[clave] && Object.keys(actual[clave]).length) return actual;
            actual[clave] = propuesta;
            return actual;
          });
          guardado = nuevo[clave] || propuesta;
          var n = cuantasDelCentro(guardado);
          U.aviso('He puesto ' + n + (n === 1 ? ' casilla del centro' : ' casillas del centro') + '. Revísalas si quieres.', 'bueno');
        } catch (e) { U.fallo('No he podido guardar la propuesta', e); }
      }
    }

    var grupos = C().agrupar(l.casillas);
    var porClase = { centro: [], otra: [], persona: [] };
    grupos.forEach(function (g, i) {
      var hueco = g.nombres.map(function (n) { return guardado[n]; }).filter(Boolean)[0] || '';
      var clase = hueco ? 'centro' : C().clasificarCasilla(g.nombres[0], guardado);
      porClase[clase].push(filaHTML(g, i, hueco));
    });
    contenedor.innerHTML =
      '<div class="impreso-grupo impreso-centro">' + (porClase.centro.length ? porClase.centro.join('')
        : '<p class="suave">Este impreso no tiene casillas del centro: saldrá en blanco.</p>') + '</div>' +
      (porClase.otra.length ? '<details class="impreso-grupo impreso-otras"><summary>Otras casillas (' + porClase.otra.length + ')</summary>' +
        porClase.otra.join('') + '</details>' : '') +
      (porClase.persona.length ? '<details class="impreso-grupo impreso-persona"><summary>Datos de la persona (' + porClase.persona.length +
        ') — no se rellenan nunca</summary>' + porClase.persona.join('') + '</details>' : '');
    resumen.textContent = textoResumen(f, guardado);

    Array.prototype.forEach.call(contenedor.querySelectorAll('.impreso-casilla'), function (fila) {
      var g = grupos[Number(fila.dataset.grupo)];
      var select = fila.querySelector('select');
      select.onchange = async function () {
        try {
          var nuevo = await R().guardar(App.E.gestor, function (actual) {
            actual[clave] = actual[clave] || {};
            g.nombres.forEach(function (n) { if (select.value) actual[clave][n] = select.value; else delete actual[clave][n]; });
            return actual;
          });
          U.aviso('Guardado.', 'bueno');
          resumen.textContent = textoResumen(f, nuevo[clave] || {});
        } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      };
      var mini = fila.querySelector('.impreso-mini');
      var pos = l.posiciones[g.nombres[0]];
      if (!pos) { mini.classList.add('oculto'); return; }
      fila.addEventListener('mouseenter', function () { pintarMini(mini, l, pos); });
      mini.onclick = function () { pintarMini(mini, l, pos); mini.classList.toggle('grande'); };
    });
    /* Al desplegar un grupo, sus miniaturas. */
    Array.prototype.forEach.call(contenedor.querySelectorAll('details.impreso-grupo'), function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        Array.prototype.forEach.call(d.querySelectorAll('.impreso-casilla'), function (fila) {
          var pos = l.posiciones[grupos[Number(fila.dataset.grupo)].nombres[0]];
          if (pos) pintarMini(fila.querySelector('.impreso-mini'), l, pos);
        });
      });
    });
  }

  function pintarMini(mini, l, pos) {
    if (!mini || mini.dataset.pintada) return;
    mini.dataset.pintada = '1';
    C().pintarMiniatura(mini, l.bytes, pos).catch(function () { mini.classList.add('oculto'); });
  }

  function tarjeta(clave, f, guardado) {
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    var resumen = document.createElement('summary');
    resumen.innerHTML = '<span class="bloque-titulo">' + U.escapar(f.n) + '</span><span class="bloque-pie"></span>';
    var pie = resumen.querySelector('.bloque-pie');
    pie.textContent = textoResumen(f, guardado);
    d.appendChild(resumen);
    var cuerpo = document.createElement('div');
    cuerpo.className = 'bloque-cuerpo';
    cuerpo.innerHTML = '<button type="button" class="boton boton-leer-impreso">Leer las casillas del PDF</button>';
    cuerpo.querySelector('.boton-leer-impreso').onclick = function () { pintarDetalle(cuerpo, clave, f, pie); };
    d.appendChild(cuerpo);
    return d;
  }

  async function pintar() {
    var caja = $('tabla-impresos-oficiales');
    if (!caja) return;
    var catalogo = await Formularios.cargar();
    var mapas = await R().cargar(App.E.gestor);
    var conPdf = Object.keys(catalogo).filter(function (c) { return catalogo[c].f; })
      .sort(function (a, b) { return catalogo[a].n < catalogo[b].n ? -1 : 1; });
    caja.innerHTML = '';
    if (!conPdf.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ningún impreso con PDF en <code>formularios/</code>.</div>';
      return;
    }
    conPdf.forEach(function (clave) { caja.appendChild(tarjeta(clave, catalogo[clave], mapas[clave])); });
  }

  return { pintar: pintar, textoResumen: textoResumen };
})();
window.FormulariosAjustes = FormulariosAjustes;
