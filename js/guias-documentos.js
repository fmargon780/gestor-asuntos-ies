/* ============================================================
   guias-documentos.js — «Documentos de este paso»: qué plantillas de
   documento van con un paso de la guía (o con un modelo de la
   biblioteca de hitos). 23-sep-2026, fila 102,
   docs/DOCUMENTOS-DESDE-EL-HITO.md.

   Se guarda en el paso como `plantillasDocumento: [id, ...]` (los `id`
   de plantillas.json → documentos). El hito no guarda copia: lo lee
   de su paso al pulsar «Generar documento» (js/hitos-generar.js).

   Lo usa js/guias.js, igual que js/guias-requisitos.js y
   js/guias-comunicacion.js: `bloqueHTML` al pintar cada paso o subpaso
   que no sea pregunta, `enganchar` tras insertarlo y `leer` en
   recoger(). El catálogo de plantillas se lee UNA vez antes de abrir
   el cuadro (`precargar`, lo llaman js/guias-enganche.js y
   js/guias-biblioteca.js), nunca en cada tecla.
   ============================================================ */
window.GuiasDocumentos = (function () {

  function catalogo() {
    var datos = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    return datos ? (datos.documentos || []) : null;
  }

  function precargar() {
    if (!window.Plantillas || !window.App || !App.E || !App.E.gestor) return Promise.resolve();
    return Plantillas.cargar(App.E.gestor).catch(function () {});
  }

  /* Agrupadas por tipo de asunto (y categoría), con un buscador. Los
     id que ya no existen salen tachados, sin casilla: al guardar se
     quitan solos (leer() solo devuelve las casillas marcadas). */
  function bloqueHTML(ids) {
    var marcadas = {};
    (ids || []).forEach(function (id) { marcadas[id] = true; });
    var lista = catalogo();
    var cuantos = (ids || []).length;
    var cabecera = '<summary>Documentos de este paso' +
      (cuantos ? ' <span class="suave">(' + cuantos + ')</span>' : ' <span class="suave">(opcional)</span>') +
      '</summary>';
    if (!lista) {
      /* Sin catálogo leído: se conservan las que hubiera, tal cual. */
      return '<details class="paso-documentos" data-sin-catalogo="' + U.escapar(JSON.stringify(ids || [])) + '">' +
        cabecera + '<p class="suave">No he podido leer las plantillas de documento. Lo que ya ' +
        'estuviera unido a este paso se conserva.</p></details>';
    }
    if (!lista.length) {
      return '<details class="paso-documentos">' + cabecera +
        '<p class="suave">Todavía no hay plantillas de documento. Se suben en Ajustes.</p></details>';
    }
    var grupos = {};
    lista.forEach(function (d) {
      var g = (d.categoria || 'SIN CATEGORÍA') + ' · ' + (d.tipo || 'Cualquier tipo');
      (grupos[g] = grupos[g] || []).push(d);
    });
    var existentes = {};
    lista.forEach(function (d) { existentes[d.id] = true; });
    var borradas = (ids || []).filter(function (id) { return !existentes[id]; });

    return '<details class="paso-documentos">' + cabecera +
      '<div class="formularios-editor">' +
      '<input class="campo formularios-buscar guiadoc-buscar" placeholder="Buscar una plantilla…">' +
      '<div class="formularios-editor-lista">' +
      Object.keys(grupos).sort().map(function (g) {
        return '<div class="guiadoc-grupo"><div class="suave guiadoc-rotulo">' + U.escapar(g) + '</div>' +
          grupos[g].map(function (d) {
            return '<label class="formularios-fila">' +
              '<input type="checkbox" class="guiadoc-casilla" data-id="' + U.escapar(d.id) + '"' +
              (marcadas[d.id] ? ' checked' : '') + '><span>' + U.escapar(d.nombre || d.fichero || d.id) + '</span></label>';
          }).join('') + '</div>';
      }).join('') +
      borradas.map(function () {
        return '<div class="formularios-fila"><s class="suave">(plantilla borrada)</s></div>';
      }).join('') +
      '</div></div></details>';
  }

  function enganchar(raiz) {
    var det = raiz && raiz.querySelector(':scope > .paso-documentos');
    if (!det) return;
    var buscar = det.querySelector('.guiadoc-buscar');
    if (!buscar) return;
    buscar.oninput = function () {
      var q = U.normalizar(buscar.value);
      Array.prototype.forEach.call(det.querySelectorAll('.guiadoc-casilla'), function (c) {
        var fila = c.closest('.formularios-fila');
        fila.classList.toggle('oculto', !!q && U.normalizar(fila.textContent).indexOf(q) === -1);
      });
    };
  }

  /* Lo marcado en el bloque que es hijo directo de `raiz`. */
  function leer(raiz) {
    var det = raiz && raiz.querySelector(':scope > .paso-documentos');
    if (!det) return [];
    if (det.dataset.sinCatalogo) {
      try { return JSON.parse(det.dataset.sinCatalogo) || []; } catch (e) { return []; }
    }
    return Array.prototype.map.call(det.querySelectorAll('.guiadoc-casilla:checked'), function (c) {
      return c.dataset.id;
    });
  }

  /* Para la vista de solo lectura de la guía: «Documentos: …». */
  function lineaHTML(ids) {
    var lista = catalogo();
    if (!ids || !ids.length || !lista) return '';
    var nombres = ids.map(function (id) {
      var d = lista.filter(function (x) { return x.id === id; })[0];
      return d ? (d.nombre || d.fichero) : '';
    }).filter(Boolean);
    if (!nombres.length) return '';
    return '<div class="paso-documentos-linea suave">Documentos: ' + U.escapar(nombres.join(', ')) + '</div>';
  }

  return { precargar: precargar, bloqueHTML: bloqueHTML, enganchar: enganchar, leer: leer, lineaHTML: lineaHTML };
})();
