/* ============================================================
   guias-guion.js — la sección «Guion de este paso» del editor de guías
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 3).

   El guion es lo que hay que hacer dentro del hito, paso a paso:
   `guion: [{ id, texto, explicacion, accion, normativa }]`. `accion` es
   'generar' | 'registrar' | 'comunicar' | 'anadir' | '' (con ella, el
   paso se marca solo cuando la aplicación ve esa acción desde el hito,
   js/hitos-guion.js). `normativa`, la misma forma que la de un paso
   (`{ cita, bloque, clave, url }`), o null. Nunca en un paso-pregunta.

   Mismo patrón que js/guias-requisitos.js: pintar, leer y enganchar una
   lista dentro de un contenedor. Se carga después de js/guias.js.
   ============================================================ */
var GuiasGuion = (function () {

  var ACCIONES = [
    { valor: '', texto: 'Sin acción (se marca a mano)' },
    { valor: 'generar', texto: 'Generar un documento' },
    { valor: 'registrar', texto: 'Registrar un documento' },
    { valor: 'comunicar', texto: 'Comunicar' },
    { valor: 'anadir', texto: 'Añadir un documento' }
  ];

  function nuevoId() { return U.nuevoId('g'); }

  function normalizarNormativa(n) {
    if (!n || !String(n.cita || '').trim()) return null;
    return { cita: String(n.cita).trim(), bloque: String(n.bloque || ''),
             clave: String(n.clave || '').trim().replace(/\s+/g, '-'), url: String(n.url || '').trim() };
  }

  /* Un paso de guion sin texto no sobrevive (como un requisito). */
  function normalizar(lista) {
    return (Array.isArray(lista) ? lista : []).map(function (g) {
      var accion = String((g && g.accion) || '');
      return {
        id: (g && g.id) || nuevoId(),
        texto: String((g && g.texto) || '').trim(),
        explicacion: String((g && g.explicacion) || '').trim(),
        accion: ACCIONES.some(function (a) { return a.valor === accion; }) ? accion : '',
        normativa: normalizarNormativa(g && g.normativa)
      };
    }).filter(function (g) { return g.texto; });
  }

  function filaHTML(g) {
    var n = g.normativa || {};
    return '<div class="guion-fila" data-id="' + U.escapar(g.id) + '">' +
      '<div class="guion-fila-linea">' +
        '<input class="campo guion-texto" value="' + U.escapar(g.texto || '') + '" placeholder="Qué hay que hacer">' +
        '<select class="campo guion-accion">' + ACCIONES.map(function (a) {
          return '<option value="' + a.valor + '"' + (a.valor === (g.accion || '') ? ' selected' : '') + '>' +
            U.escapar(a.texto) + '</option>';
        }).join('') + '</select>' +
        '<span class="requisito-mandos">' +
          '<button type="button" class="boton guion-subir" title="Subir">↑</button>' +
          '<button type="button" class="boton guion-bajar" title="Bajar">↓</button>' +
          '<button type="button" class="boton boton-peligro guion-quitar" title="Quitar el paso">✕</button>' +
        '</span>' +
      '</div>' +
      '<input class="campo guion-explicacion" value="' + U.escapar(g.explicacion || '') + '" placeholder="Explicación corta (opcional)">' +
      '<div class="guion-fila-linea">' +
        '<input class="campo guion-cita" value="' + U.escapar(n.cita || '') + '" placeholder="Normativa: la cita (opcional)">' +
        '<input class="campo guion-url" value="' + U.escapar(n.url || '') + '" placeholder="Enlace al BOE o al BOJA (opcional)">' +
      '</div>' +
    '</div>';
  }

  function bloqueHTML(guion) {
    var lista = guion || [];
    return '<details class="paso-guion">' +
      '<summary>Guion de este paso' + (lista.length ? ' (' + lista.length + ')' : '') + '</summary>' +
      '<p class="nota">Lo que hay que hacer dentro del hito. Los pasos con acción se marcan solos cuando ' +
      'la aplicación la ve desde el hito; los demás, a mano.</p>' +
      '<div class="guion-lista">' + lista.map(filaHTML).join('') + '</div>' +
      '<button type="button" class="boton boton-ancho guion-anadir">+ Añadir un paso al guion</button>' +
      '</details>';
  }

  /* Lee las filas tal cual (sin descartar las vacías: el índice tiene que
     casar con el de la lista para subir/bajar/quitar). */
  function leer(raiz) {
    var filas = raiz.querySelectorAll(':scope > .paso-guion > .guion-lista > .guion-fila');
    return Array.prototype.map.call(filas, function (f) {
      var cita = f.querySelector('.guion-cita').value.trim();
      return {
        id: f.dataset.id || nuevoId(),
        texto: f.querySelector('.guion-texto').value.trim(),
        explicacion: f.querySelector('.guion-explicacion').value.trim(),
        accion: f.querySelector('.guion-accion').value,
        normativa: cita ? { cita: cita, bloque: '', clave: '', url: f.querySelector('.guion-url').value.trim() } : null
      };
    });
  }

  function enganchar(raiz, alCambiar) {
    var det = raiz.querySelector(':scope > .paso-guion');
    if (!det) return;
    var anadir = det.querySelector(':scope > .guion-anadir');
    if (anadir) anadir.onclick = function () {
      alCambiar(function (lista) { lista.push({ id: nuevoId(), texto: '', explicacion: '', accion: '', normativa: null }); });
    };
    Array.prototype.forEach.call(det.querySelectorAll(':scope > .guion-lista > .guion-fila'), function (fila, idx) {
      fila.querySelector('.guion-subir').onclick = function () {
        alCambiar(function (l) { if (idx > 0) { var t = l[idx - 1]; l[idx - 1] = l[idx]; l[idx] = t; } });
      };
      fila.querySelector('.guion-bajar').onclick = function () {
        alCambiar(function (l) { if (idx < l.length - 1) { var t = l[idx + 1]; l[idx + 1] = l[idx]; l[idx] = t; } });
      };
      fila.querySelector('.guion-quitar').onclick = function () {
        alCambiar(function (l) { l.splice(idx, 1); });
      };
    });
  }

  return { normalizar: normalizar, bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar, ACCIONES: ACCIONES };
})();
window.GuiasGuion = GuiasGuion;
