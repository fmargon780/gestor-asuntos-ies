/* ============================================================
   guias-guion.js — la sección «Guion de este paso» del editor de guías
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 3).

   El guion es lo que hay que hacer dentro del hito, paso a paso:
   `guion: [{ id, texto, explicacion, accion, normativa }]`. `accion` es
   'generar' | 'registrar' | 'comunicar' | 'anadir' | '' (con ella, el
   paso se marca solo cuando la aplicación ve esa acción desde el hito,
   js/hitos-guion.js). `normativa`, la misma forma que la de un paso
   (`{ cita, bloque, clave, url }`), o null. Nunca en un paso-pregunta.

   Preguntas en el guion (24-sep-2026, fila 116, docs/PREGUNTAS-EN-EL-GUION.md):
   una línea puede ser `{ id, texto, explicacion, pregunta: true, opciones:
   [{ id, texto, lineas: [...líneas normales...] }] }`. Un solo nivel: las
   líneas de una opción nunca son pregunta, y una pregunta no lleva
   `accion` ni `normativa`.

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

  /* Un paso de guion sin texto no sobrevive (como un requisito). `dentro`:
     las líneas de una opción, que nunca son pregunta. */
  function normalizar(lista, dentro) {
    return (Array.isArray(lista) ? lista : []).map(function (g) {
      var base = {
        id: (g && g.id) || nuevoId(),
        texto: String((g && g.texto) || '').trim(),
        explicacion: String((g && g.explicacion) || '').trim()
      };
      if (!dentro && g && g.pregunta) {
        base.pregunta = true;
        base.opciones = (Array.isArray(g.opciones) ? g.opciones : []).map(function (o) {
          return { id: (o && o.id) || nuevoId(), texto: String((o && o.texto) || '').trim(),
                   lineas: normalizar(o && o.lineas, true) };
        }).filter(function (o) { return o.texto || o.lineas.length; });
        return base;
      }
      var accion = String((g && g.accion) || '');
      base.accion = ACCIONES.some(function (a) { return a.valor === accion; }) ? accion : '';
      base.normativa = normalizarNormativa(g && g.normativa);
      return base;
    }).filter(function (g) { return g.texto; });
  }

  /* El guion en una línea de texto (para comparar con la biblioteca). */
  function textoLegible(lista) {
    return (lista || []).map(function (g) {
      if (g.pregunta) {
        return g.texto + ' [pregunta: ' + (g.opciones || []).map(function (o) {
          return o.texto + ' → ' + (o.lineas || []).map(function (x) { return x.texto; }).join(', ');
        }).join(' / ') + ']';
      }
      return g.texto + (g.accion ? ' [' + g.accion + ']' : '');
    }).join('; ');
  }

  function filaHTML(g, dentro) {
    var n = g.normativa || {};
    var pregunta = !dentro && !!g.pregunta;
    return '<div class="guion-fila' + (dentro ? ' guion-subfila' : '') + (pregunta ? ' guion-fila-pregunta' : '') +
        '" data-id="' + U.escapar(g.id) + '">' +
      '<div class="guion-fila-linea">' +
        '<input class="campo guion-texto" value="' + U.escapar(g.texto || '') + '" placeholder="' +
          (pregunta ? 'La pregunta (¿Viene con toda la documentación?)' : 'Qué hay que hacer') + '">' +
        (pregunta ? '' : '<select class="campo guion-accion">' + ACCIONES.map(function (a) {
          return '<option value="' + a.valor + '"' + (a.valor === (g.accion || '') ? ' selected' : '') + '>' +
            U.escapar(a.texto) + '</option>';
        }).join('') + '</select>') +
        '<span class="requisito-mandos">' +
          (dentro ? '' : '<button type="button" class="boton guion-subir" title="Subir">↑</button>' +
            '<button type="button" class="boton guion-bajar" title="Bajar">↓</button>') +
          '<button type="button" class="boton boton-peligro guion-quitar" title="Quitar">✕</button>' +
        '</span>' +
      '</div>' +
      '<input class="campo guion-explicacion" value="' + U.escapar(g.explicacion || '') + '" placeholder="Explicación corta (opcional)">' +
      (pregunta ? '' :
        '<div class="guion-fila-linea guion-norma">' +
          '<input class="campo guion-cita" value="' + U.escapar(n.cita || '') + '" placeholder="Normativa: la cita (opcional)">' +
          '<input class="campo guion-url" value="' + U.escapar(n.url || '') + '" placeholder="Enlace al BOE o al BOJA (opcional)">' +
        '</div>') +
      (dentro ? '' : '<label class="interruptor guion-pregunta-fila"><input type="checkbox" class="guion-es-pregunta"' +
        (pregunta ? ' checked' : '') + '><span>Es una pregunta: lo que hay que hacer depende de la respuesta</span></label>') +
      (pregunta ? '<div class="guion-opciones">' + (g.opciones || []).map(function (o) {
        return '<div class="guion-opcion" data-id="' + U.escapar(o.id) + '">' +
          '<div class="guion-fila-linea guion-opcion-cabecera"><input class="campo guion-opcion-texto" value="' +
            U.escapar(o.texto || '') + '" placeholder="Respuesta (Sí, No…)">' +
            '<button type="button" class="boton boton-peligro guion-opcion-quitar" title="Quitar la respuesta">✕</button></div>' +
          '<div class="guion-opcion-lineas">' + (o.lineas || []).map(function (x) { return filaHTML(x, true); }).join('') + '</div>' +
          '<button type="button" class="enlace guion-linea-anadir">+ Añadir línea</button>' +
        '</div>';
      }).join('') + '<button type="button" class="enlace guion-opcion-anadir">+ Añadir respuesta</button></div>' : '') +
    '</div>';
  }

  function bloqueHTML(guion) {
    var lista = guion || [];
    return '<details class="paso-guion">' +
      '<summary>Guion de este paso' + (lista.length ? ' (' + lista.length + ')' : '') + '</summary>' +
      '<p class="nota">Lo que hay que hacer dentro del hito. Los pasos con acción se marcan solos cuando ' +
      'la aplicación la ve desde el hito; los demás, a mano.</p>' +
      '<div class="guion-lista">' + lista.map(function (g) { return filaHTML(g, false); }).join('') + '</div>' +
      '<button type="button" class="boton boton-ancho guion-anadir">+ Añadir un paso al guion</button>' +
      '</details>';
  }

  /* Lee las filas tal cual (sin descartar las vacías: el índice tiene que
     casar con el de la lista para subir/bajar/quitar). */
  function leerFila(f, dentro) {
    function q(sel) { return f.querySelector(':scope > ' + sel); }
    var marca = q('.guion-pregunta-fila > .guion-es-pregunta');
    var base = { id: f.dataset.id || nuevoId(), texto: q('.guion-fila-linea > .guion-texto').value.trim(),
                 explicacion: q('.guion-explicacion').value.trim() };
    if (!dentro && marca && marca.checked) {
      base.pregunta = true;
      base.opciones = Array.prototype.map.call(f.querySelectorAll(':scope > .guion-opciones > .guion-opcion'), function (o) {
        return { id: o.dataset.id || nuevoId(),
                 texto: o.querySelector(':scope > .guion-opcion-cabecera > .guion-opcion-texto').value.trim(),
                 lineas: Array.prototype.map.call(o.querySelectorAll(':scope > .guion-opcion-lineas > .guion-fila'),
                   function (x) { return leerFila(x, true); }) };
      });
      return base;
    }
    var sel = q('.guion-fila-linea > .guion-accion');
    var cita = q('.guion-norma > .guion-cita');
    base.accion = sel ? sel.value : '';
    base.normativa = (cita && cita.value.trim())
      ? { cita: cita.value.trim(), bloque: '', clave: '', url: q('.guion-norma > .guion-url').value.trim() } : null;
    return base;
  }

  function leer(raiz) {
    var filas = raiz.querySelectorAll(':scope > .paso-guion > .guion-lista > .guion-fila');
    return Array.prototype.map.call(filas, function (f) { return leerFila(f, false); });
  }

  function lineaNueva() { return { id: nuevoId(), texto: '', explicacion: '', accion: '', normativa: null }; }

  function enganchar(raiz, alCambiar) {
    var det = raiz.querySelector(':scope > .paso-guion');
    if (!det) return;
    var anadir = det.querySelector(':scope > .guion-anadir');
    if (anadir) anadir.onclick = function () {
      alCambiar(function (lista) { lista.push({ id: nuevoId(), texto: '', explicacion: '', accion: '', normativa: null }); });
    };
    Array.prototype.forEach.call(det.querySelectorAll(':scope > .guion-lista > .guion-fila'), function (fila, idx) {
      function boton(sel) { return fila.querySelector(':scope > .guion-fila-linea ' + sel); }
      boton('.guion-subir').onclick = function () {
        alCambiar(function (l) { if (idx > 0) { var t = l[idx - 1]; l[idx - 1] = l[idx]; l[idx] = t; } });
      };
      boton('.guion-bajar').onclick = function () {
        alCambiar(function (l) { if (idx < l.length - 1) { var t = l[idx + 1]; l[idx + 1] = l[idx]; l[idx] = t; } });
      };
      boton('.guion-quitar').onclick = function () {
        alCambiar(function (l) { l.splice(idx, 1); });
      };
      /* Fila 116: la casilla «Es una pregunta» y sus respuestas. */
      var marca = fila.querySelector(':scope > .guion-pregunta-fila > .guion-es-pregunta');
      if (marca) marca.onchange = function () {
        alCambiar(function (l) {
          var g = l[idx];
          if (!g) return;
          if (marca.checked) {
            g.pregunta = true;
            if (!g.opciones || !g.opciones.length) {
              g.opciones = [{ id: nuevoId(), texto: 'Sí', lineas: [] }, { id: nuevoId(), texto: 'No', lineas: [lineaNueva()] }];
            }
          } else { delete g.pregunta; delete g.opciones; }
        });
      };
      var anadirOpcion = fila.querySelector(':scope > .guion-opciones > .guion-opcion-anadir');
      if (anadirOpcion) anadirOpcion.onclick = function () {
        alCambiar(function (l) { l[idx].opciones.push({ id: nuevoId(), texto: '', lineas: [lineaNueva()] }); });
      };
      Array.prototype.forEach.call(fila.querySelectorAll(':scope > .guion-opciones > .guion-opcion'), function (op, j) {
        op.querySelector(':scope > .guion-opcion-cabecera > .guion-opcion-quitar').onclick = function () {
          alCambiar(function (l) { l[idx].opciones.splice(j, 1); });
        };
        op.querySelector(':scope > .guion-linea-anadir').onclick = function () {
          alCambiar(function (l) { l[idx].opciones[j].lineas.push(lineaNueva()); });
        };
        Array.prototype.forEach.call(op.querySelectorAll(':scope > .guion-opcion-lineas > .guion-fila'), function (sub, k) {
          sub.querySelector(':scope > .guion-fila-linea .guion-quitar').onclick = function () {
            alCambiar(function (l) { l[idx].opciones[j].lineas.splice(k, 1); });
          };
        });
      });
    });
  }

  return { normalizar: normalizar, textoLegible: textoLegible, bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar, ACCIONES: ACCIONES };
})();
window.GuiasGuion = GuiasGuion;
