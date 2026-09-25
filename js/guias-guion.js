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

   Algo que hay que reunir (25-sep-2026, fila 138, docs/UNA-SOLA-LISTA-EN-EL-HITO.md):
   una línea normal puede llevar `reunir: 'documento' | 'dato'` y
   `obligatorio`. Es lo que antes era «Lo que hay que reunir», que deja de
   ser una lista aparte: la casilla «Hay que reunirlo», junto a «Es una
   pregunta».

   La receta de un paso (25-sep-2026, fila 164, docs/HITOS-ACCIONES-EN-EL-HITO.md,
   punto 3): la `accion` es su clase (comunicar, generar, registrar) y
   `receta` sus detalles, todos opcionales: comunicar `{ a, via,
   plantilla }` (a: tercero, tutores, tutoria, relacionados u otro; via:
   correo o seneca; plantilla: id de `plantillas.json` › `lista`);
   generar `{ plantilla }` (id de `plantillas.json` › `documentos`);
   registrar `{ sentido }` (entrada o salida). Un paso con `accion` y sin
   `receta` (los de la guía del instituto de antes) ya es un paso con
   receta, sin detalles: no hace falta convertir nada. Sale arriba en el
   menú del hito (js/hito-mesa-recetas.js).

   Pinta, lee y engancha una lista dentro de un contenedor. Se carga
   después de js/guias.js.
   ============================================================ */
var GuiasGuion = (function () {

  var ACCIONES = [
    { valor: '', texto: 'Sin acción (se marca a mano)' },
    { valor: 'generar', texto: 'Generar un documento' },
    { valor: 'registrar', texto: 'Registrar un documento' },
    { valor: 'comunicar', texto: 'Comunicar' },
    { valor: 'anadir', texto: 'Añadir un documento' }
  ];

  var A_QUIEN = [
    { valor: '', texto: 'A quien toque' }, { valor: 'tercero', texto: 'El tercero' },
    { valor: 'tutores', texto: 'La familia (tutores legales)' }, { valor: 'tutoria', texto: 'La tutoría' },
    { valor: 'relacionados', texto: 'Los relacionados' }, { valor: 'otro', texto: 'Otro' }
  ];
  var VIAS = [{ valor: '', texto: 'Correo o Séneca' }, { valor: 'correo', texto: 'Por correo' }, { valor: 'seneca', texto: 'Por Séneca' }];
  var SENTIDOS = [{ valor: '', texto: 'Entrada o salida' }, { valor: 'entrada', texto: 'Entrada' }, { valor: 'salida', texto: 'Salida' }];

  function valido(lista, v) { return lista.some(function (x) { return x.valor === v; }) ? v : ''; }

  /* La receta, limpia y solo con lo que toca a su acción; null si no dice nada. */
  function normalizarReceta(accion, r) {
    r = r || {};
    var out = null;
    if (accion === 'comunicar') {
      out = { a: valido(A_QUIEN, String(r.a || '')), via: valido(VIAS, String(r.via || '')), plantilla: String(r.plantilla || '') };
    } else if (accion === 'generar') {
      out = { plantilla: String(r.plantilla || '') };
    } else if (accion === 'registrar') {
      out = { sentido: valido(SENTIDOS, String(r.sentido || '')) };
    }
    if (!out) return null;
    return Object.keys(out).some(function (k) { return out[k]; }) ? out : null;
  }

  function opcionesHTML(lista, actual) {
    return lista.map(function (x) {
      return '<option value="' + U.escapar(x.valor) + '"' + (x.valor === (actual || '') ? ' selected' : '') + '>' + U.escapar(x.texto) + '</option>';
    }).join('');
  }

  /* Las plantillas del centro que ya se hayan leído (Plantillas.enMemoria);
     la elegida sale aunque no esté, para no perderla al guardar. */
  function plantillasPara(clase, actual) {
    var datos = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    if (!datos && window.Plantillas && Plantillas.cargarReciente && window.App && App.E && App.E.gestor) {
      Plantillas.cargarReciente(App.E.gestor).catch(function () { /* sin plantillas, sin lista */ });
    }
    var lista = ((datos && datos[clase]) || []).map(function (p) {
      return { valor: p.id, texto: p.nombre + (p.tipo ? ' (' + p.tipo + ')' : '') };
    });
    if (actual && !lista.some(function (x) { return x.valor === actual; })) lista.push({ valor: actual, texto: actual });
    return [{ valor: '', texto: 'Sin plantilla fija' }].concat(lista);
  }

  function recetaHTML(g) {
    var r = g.receta || {};
    if (g.accion === 'comunicar') {
      return '<div class="guion-fila-linea guion-receta"><span class="guion-receta-titulo">Receta:</span>' +
        '<select class="campo guion-receta-a">' + opcionesHTML(A_QUIEN, r.a) + '</select>' +
        '<select class="campo guion-receta-via">' + opcionesHTML(VIAS, r.via) + '</select>' +
        '<select class="campo guion-receta-plantilla">' + opcionesHTML(plantillasPara('lista', r.plantilla), r.plantilla) + '</select></div>';
    }
    if (g.accion === 'generar') {
      return '<div class="guion-fila-linea guion-receta"><span class="guion-receta-titulo">Receta:</span>' +
        '<select class="campo guion-receta-plantilla">' + opcionesHTML(plantillasPara('documentos', r.plantilla), r.plantilla) + '</select></div>';
    }
    if (g.accion === 'registrar') {
      return '<div class="guion-fila-linea guion-receta"><span class="guion-receta-titulo">Receta:</span>' +
        '<select class="campo guion-receta-sentido">' + opcionesHTML(SENTIDOS, r.sentido) + '</select></div>';
    }
    return '';
  }

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
      var receta = normalizarReceta(base.accion, g && g.receta);
      if (receta) base.receta = receta;
      /* Fila 138: algo que hay que reunir. */
      if (g && (g.reunir === 'documento' || g.reunir === 'dato')) {
        base.reunir = g.reunir;
        base.obligatorio = !!g.obligatorio;
      }
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
      return g.texto + (g.accion ? ' [' + g.accion + (g.receta ? ' ' + JSON.stringify(g.receta) : '') + ']' : '') +
        (g.reunir ? ' [reunir ' + g.reunir + (g.obligatorio ? ', obligatorio' : '') + ']' : '');
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
      (pregunta ? '' : recetaHTML(g)) +
      '<input class="campo guion-explicacion" value="' + U.escapar(g.explicacion || '') + '" placeholder="Explicación corta (opcional)">' +
      (pregunta ? '' :
        '<div class="guion-fila-linea guion-norma">' +
          '<input class="campo guion-cita" value="' + U.escapar(n.cita || '') + '" placeholder="Normativa: la cita (opcional)">' +
          '<input class="campo guion-url" value="' + U.escapar(n.url || '') + '" placeholder="Enlace al BOE o al BOJA (opcional)">' +
        '</div>') +
      (pregunta ? '' :
        '<div class="guion-fila-linea guion-reunir-fila">' +
          '<label class="interruptor"><input type="checkbox" class="guion-reunir"' + (g.reunir ? ' checked' : '') +
            '><span>Hay que reunirlo</span></label>' +
          '<select class="campo guion-reunir-clase">' +
            '<option value="documento"' + (g.reunir !== 'dato' ? ' selected' : '') + '>📎 Un documento</option>' +
            '<option value="dato"' + (g.reunir === 'dato' ? ' selected' : '') + '>✎ Un dato</option>' +
          '</select>' +
          '<label class="interruptor"><input type="checkbox" class="guion-obligatorio"' + (g.obligatorio ? ' checked' : '') +
            '><span>Obligatorio</span></label>' +
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
    var receta = q('.guion-receta');
    if (receta) {
      var leida = {};
      [['a', '.guion-receta-a'], ['via', '.guion-receta-via'], ['plantilla', '.guion-receta-plantilla'], ['sentido', '.guion-receta-sentido']]
        .forEach(function (x) { var c = receta.querySelector(x[1]); if (c) leida[x[0]] = c.value; });
      var limpia = normalizarReceta(base.accion, leida);
      if (limpia) base.receta = limpia;
    }
    base.normativa = (cita && cita.value.trim())
      ? { cita: cita.value.trim(), bloque: '', clave: '', url: q('.guion-norma > .guion-url').value.trim() } : null;
    var reunir = q('.guion-reunir-fila .guion-reunir');
    if (reunir && reunir.checked) {
      base.reunir = q('.guion-reunir-fila > .guion-reunir-clase').value === 'dato' ? 'dato' : 'documento';
      base.obligatorio = !!q('.guion-reunir-fila .guion-obligatorio').checked;
    }
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
      /* Fila 164: al cambiar la acción, sale (o se va) su receta. */
      var accionSel = fila.querySelector(':scope > .guion-fila-linea > .guion-accion');
      if (accionSel) accionSel.onchange = function () { alCambiar(function () { /* solo repintar con lo leído */ }); };
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

  return { normalizar: normalizar, textoLegible: textoLegible, bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar, ACCIONES: ACCIONES,
           normalizarReceta: normalizarReceta, A_QUIEN: A_QUIEN };
})();
window.GuiasGuion = GuiasGuion;
