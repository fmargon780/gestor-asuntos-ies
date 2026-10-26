/* ============================================================
   guias-guion.js — la sección «Tareas de este hito» del editor de guías
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 3).

   El guion es lo que hay que hacer dentro del hito, paso a paso:
   `guion: [{ id, texto, explicacion, accion, normativa }]`. `accion` es
   'generar' | 'registrar' | 'comunicar' | 'anadir' | '' (con ella, la
   tarea se marca sola cuando la aplicación ve esa acción desde el hito,
   js/hitos-guion.js). `normativa`, la misma forma que la de un hito
   (`{ cita, bloque, clave, url }`), o null. Nunca en un hito-pregunta.

   Preguntas en las tareas (24-sep-2026, fila 116, docs/PREGUNTAS-EN-EL-GUION.md):
   una línea puede ser `{ id, texto, explicacion, pregunta: true, opciones:
   [{ id, texto, lineas: [...líneas normales...] }] }`. Un solo nivel: las
   líneas de una opción nunca son pregunta, y una pregunta no lleva
   `accion` ni `normativa`.

   Algo que hay que reunir (25-sep-2026, fila 138, docs/UNA-SOLA-LISTA-EN-EL-HITO.md):
   una línea normal puede llevar `reunir: 'documento' | 'dato'` y
   `obligatorio`. Es lo que antes era «Lo que hay que reunir», que deja de
   ser una lista aparte: la casilla «Hay que reunirlo», junto a «Es una
   pregunta».

   La receta de una tarea (25-sep-2026, fila 164, docs/HITOS-ACCIONES-EN-EL-HITO.md,
   punto 3): la `accion` es su clase (comunicar, generar, registrar) y
   `receta` sus detalles, todos opcionales: comunicar `{ a, via,
   plantilla }` (a: tercero, tutores, tutoria, relacionados u otro; via:
   correo o seneca; plantilla: id de `plantillas.json` › `lista`);
   generar `{ plantilla }` (id de `plantillas.json` › `documentos`);
   registrar `{ sentido }` (entrada o salida). Una tarea con `accion` y sin
   `receta` (las de la guía del instituto de antes) ya es una tarea con
   receta, sin detalles: no hace falta convertir nada. Sale arriba en el
   menú del hito (js/hito-mesa-recetas.js).

   Aquí, el dato (normalizar, la receta). Pintar, leer y enganchar la lista de
   tareas dentro de un contenedor, en js/guias-guion-editor.js (fila 464). Se
   carga después de js/guias.js.
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
    { valor: 'tutores', texto: 'La familia' }, { valor: 'tutoria', texto: 'Tutor/a del grupo' },
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
    /* Fila 321: las fuera de uso no se ofrecen, salvo la que ya tiene la tarea (con «(fuera de uso)»), para no perderla al guardar. */
    var lista = ((datos && datos[clase]) || []).filter(function (p) {
      return !window.Plantillas || Plantillas.enUso(p) || p.id === actual;
    }).map(function (p) {
      return { valor: p.id, texto: p.nombre + (p.tipo ? ' (' + p.tipo + ')' : '') + ((window.Plantillas && !Plantillas.enUso(p)) ? ' (fuera de uso)' : '') };
    });
    if (actual && !lista.some(function (x) { return x.valor === actual; })) lista.push({ valor: actual, texto: actual });
    return [{ valor: '', texto: 'Sin plantilla fija' }].concat(lista);
  }

  /* Fila 321: la misma marca que en la mesa del hito. */
  function marcaFueraDeUso(g) {
    return (window.Plantillas && Plantillas.fueraDeUsoDeLaTarea(g)) ? ' <span class="guion-fuera-de-uso">plantilla fuera de uso</span>' : '';
  }

  /* Fila 464, B2: en una tarea, cada desplegable con su rótulo; las líneas de dentro de una respuesta (`dentro`) siguen con «Detalles:». */
  function conRotulo(rotulo, selectHTML, dentro) {
    return dentro ? selectHTML : '<label class="dato"><span class="etiqueta">' + rotulo + '</span>' + selectHTML + '</label>';
  }

  function recetaHTML(g, dentro) {
    var r = g.receta || {};
    var titulo = dentro ? '<span class="guion-receta-titulo">Detalles:</span>' : '';
    if (g.accion === 'comunicar') {
      return '<div class="guion-fila-linea guion-receta">' + titulo +
        conRotulo('A quién', '<select class="campo guion-receta-a">' + opcionesHTML(A_QUIEN, r.a) + '</select>', dentro) +
        conRotulo('Por dónde', '<select class="campo guion-receta-via">' + opcionesHTML(VIAS, r.via) + '</select>', dentro) +
        conRotulo('Plantilla de correo', '<select class="campo guion-receta-plantilla">' + opcionesHTML(plantillasPara('lista', r.plantilla), r.plantilla) + '</select>', dentro) +
        marcaFueraDeUso(g) + '</div>';
    }
    if (g.accion === 'generar') {
      return '<div class="guion-fila-linea guion-receta">' + titulo +
        conRotulo('Plantilla de documento', '<select class="campo guion-receta-plantilla">' + opcionesHTML(plantillasPara('documentos', r.plantilla), r.plantilla) + '</select>', dentro) +
        marcaFueraDeUso(g) + '</div>';
    }
    if (g.accion === 'registrar') {
      return '<div class="guion-fila-linea guion-receta">' + titulo +
        conRotulo('Entrada o salida', '<select class="campo guion-receta-sentido">' + opcionesHTML(SENTIDOS, r.sentido) + '</select>', dentro) + '</div>';
    }
    return '';
  }

  function nuevoId() { return U.nuevoId('g'); }

  function normalizarNormativa(n) {
    if (!n || !String(n.cita || '').trim()) return null;
    return { cita: String(n.cita).trim(), bloque: String(n.bloque || ''),
             clave: String(n.clave || '').trim().replace(/\s+/g, '-'), url: String(n.url || '').trim() };
  }

  /* Una tarea sin texto no sobrevive (como un requisito). `dentro`:
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

  /* Las tareas en una línea de texto (para comparar con la biblioteca). */
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

  return { normalizar: normalizar, textoLegible: textoLegible, ACCIONES: ACCIONES,
           normalizarReceta: normalizarReceta, A_QUIEN: A_QUIEN, VIAS: VIAS, recetaHTML: recetaHTML, nuevoId: nuevoId };
})();
window.GuiasGuion = GuiasGuion;
