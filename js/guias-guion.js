/* ============================================================
   guias-guion.js — la sección «Tareas de este hito» del editor de guías
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 3).

   El guion es lo que hay que hacer dentro del hito, paso a paso:
   `guion: [{ id, texto, explicacion, accion, normativa }]`. `accion` es
   'generar' | 'firmar' | 'registrar' | 'comunicar' | 'anadir' | '' (con ella, la
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

   Fila 659 (docs/659-DONDE-SE-HACE-Y-NOMBRES.md): una tarea dice QUÉ se hace (`accion`) y, aparte, DÓNDE:
   `donde: { sitio, zona? }` (por `id`, js/sitios.js). Además, opcionales según su acción, `tipoDocumento`
   (Registrar, Poner a la firma, Añadir documento: un tipo de documento de la app) y `aQuien` (Llamar: Tercero,
   Familia, Relacionado o Sus profesores). Se normalizan con `Sitios.aplicarDatos`.

   Aquí, el dato (normalizar, la receta). Pintar, leer y enganchar la lista de
   tareas dentro de un contenedor, en js/guias-guion-editor.js (fila 464). Se
   carga después de js/guias.js.
   ============================================================ */
var GuiasGuion = (function () {

  var ACCIONES = [
    { valor: 'generar', texto: 'Generar documento' },
    { valor: 'firmar', texto: 'Poner a la firma' },
    { valor: 'registrar', texto: 'Registrar' },
    { valor: 'comunicar', texto: 'Enviar' },
    { valor: 'anadir', texto: 'Añadir documento' },
    { valor: 'pedir', texto: 'Rellenar datos del asunto' },   /* fila 530 */
    { valor: 'copiar', texto: 'Copiar a otra carpeta' },   /* fila 552 */
    { valor: 'llamar', texto: 'Llamar' },   /* fila 639 */
    /* Fila 651: las que solo clasifican se marcan a mano. Fila 659: los nombres dicen qué se hace, sin el sitio (el sitio es «Dónde se hace»). */
    { valor: 'seneca', texto: 'Grabar o cambiar datos' },
    { valor: 'entregar', texto: 'Entregar' },
    { valor: 'recoger', texto: 'Recoger' },
    { valor: 'publicar', texto: 'Publicar' },
    { valor: 'cobrar', texto: 'Cobrar o pagar' },
    { valor: 'comprobar', texto: 'Comprobar' },
    { valor: 'archivar', texto: 'Archivar' },
    { valor: '', texto: 'Otra cosa' }
  ];


  var A_QUIEN = [
    { valor: '', texto: 'A quien toque' }, { valor: 'tercero', texto: 'El tercero' },
    { valor: 'tutores', texto: 'La familia' }, { valor: 'tutoria', texto: 'Tutor/a del grupo' },
    { valor: 'relacionados', texto: 'Los relacionados' }, { valor: 'otro', texto: 'Otro' }
  ];
  var VIAS = [{ valor: '', texto: 'Correo o Séneca' }, { valor: 'correo', texto: 'Por correo' }, { valor: 'seneca', texto: 'Por Séneca' }];
  /* Fila 523: las firmas que necesita la tarea de firmar (1 por defecto). */
  var FIRMAS = [{ valor: '1', texto: '1' }, { valor: '2', texto: '2' }, { valor: '3', texto: '3' }];
  var SENTIDOS = [{ valor: '', texto: 'Entrada o salida' }, { valor: 'entrada', texto: 'Entrada' }, { valor: 'salida', texto: 'Salida' }];

  /* Fila 530: los campos que pide una tarea «Pedir datos»: { origen, id | columna }, sin repetir. */
  function normalizarCampos(lista) {
    var vistos = {}, salida = [];
    (Array.isArray(lista) ? lista : []).forEach(function (c) {
      var o = String((c && c.origen) || '');
      if (['fichero', 'calculado', 'propio'].indexOf(o) === -1) return;
      var e = o === 'fichero' ? { origen: o, columna: String(c.columna || '') } : { origen: o, id: String(c.id || '') };
      var k = o + ':' + (e.columna || e.id);
      if (!(e.columna || e.id) || vistos[k]) return;
      vistos[k] = true;
      salida.push(e);
    });
    return salida;
  }

  function valido(lista, v) { return lista.some(function (x) { return x.valor === v; }) ? v : ''; }

  /* La receta, limpia y solo con lo que toca a su acción; null si no dice nada. */
  function normalizarReceta(accion, r) {
    r = r || {};
    var out = null;
    if (accion === 'comunicar') {
      out = { a: valido(A_QUIEN, String(r.a || '')), via: valido(VIAS, String(r.via || '')), plantilla: String(r.plantilla || '') };
    } else if (accion === 'generar') {
      /* Fila 660: «Sin plantilla por ahora (se marca a mano)»: sin plantilla y sin botón. */
      out = { plantilla: String(r.plantilla || '') };
      if (!out.plantilla && r.sinPlantilla) out.sinPlantilla = true;
    } else if (accion === 'registrar') {
      out = { sentido: valido(SENTIDOS, String(r.sentido || '')) };
    } else if (accion === 'firmar') {
      var f = valido(FIRMAS, String(r.firmas || ''));
      out = { firmas: f === '1' ? '' : f };   /* 1 es lo normal: no se guarda */
    } else if (accion === 'pedir') {
      var campos = normalizarCampos(r.campos);
      out = { campos: campos.length ? campos : '' };   /* fila 530 */
    } else if (accion === 'copiar') {   /* fila 552 (js/tarea-copiar.js) */
      out = { carpeta: String(r.carpeta || '').trim(), carpetaId: r.carpeta ? String(r.carpetaId || '') : '', patron: String(r.patron || '').trim() };
    }
    if (!out) return null;
    return Object.keys(out).some(function (k) { return out[k]; }) ? out : null;
  }

  /* Fila 523: cuántas firmas necesita una tarea de firmar (1, 2 o 3). */
  function firmasNecesarias(g) {
    var n = parseInt(g && g.receta && g.receta.firmas, 10);
    return n >= 2 && n <= 3 ? n : 1;
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

  /* Fila 615: la última opción, «+ Nueva plantilla…», solo en el editor de la guía (js/guias-plantilla-nueva.js). */
  function nuevaPlantillaHTML(g) {
    return g && g.editorGuia && window.ListaNuevo ? ListaNuevo.opcionHTML('+ Nueva plantilla…') : '';
  }

  /* Fila 321: la misma marca que en la mesa del hito. */
  function marcaFueraDeUso(g) {
    return (window.Plantillas && Plantillas.fueraDeUsoDeLaTarea(g)) ? ' <span class="guion-fuera-de-uso">plantilla fuera de uso</span>' : '';
  }

  /* Fila 464, B2: en una tarea, cada desplegable con su rótulo; las líneas de dentro de una respuesta (`dentro`) siguen con «Detalles:». */
  function conRotulo(rotulo, selectHTML, dentro) {
    return dentro ? selectHTML : '<label class="dato"><span class="etiqueta">' + rotulo + '</span>' + selectHTML + '</label>';
  }

  /* Fila 530: los campos de una tarea «Pedir datos». En el editor de la guía (`g.editorGuia`) se quitan y se añaden aquí;
     en «Nueva tarea» se añaden después, desde la propia tarea. */
  function pedirHTML(g) {
    var campos = (g.receta && g.receta.campos) || [];
    if (!g.editorGuia) return '<div class="guion-fila-linea guion-receta"><span class="suave pequeno">Los campos que pide se añaden después, en la propia tarea.</span></div>';
    return '<div class="guion-fila-linea guion-receta guion-receta-pedir" data-campos="' + U.escapar(JSON.stringify(campos)) + '">' +
      '<span class="etiqueta">Datos que pide</span>' +
      (campos.length ? campos.map(function (c, i) {
        return '<span class="guion-pedir-campo">' + U.escapar(window.Campos ? Campos.nombreDeCampo(c, window.App && App.E && App.E.campos) : (c.columna || c.id)) +
          ' <button type="button" class="enlace guion-pedir-quitar" data-i="' + i + '" aria-label="Quitar este campo">✕</button></span>';
      }).join('') : '<span class="suave pequeno">Ninguno todavía.</span>') +
      '<button type="button" class="boton boton-chico guion-pedir-anadir">+ Añadir campo</button></div>';
  }

  function aQuienVaHTML(idPlantilla) {
    var p = idPlantilla && window.Plantillas && Plantillas.porId ? Plantillas.porId(idPlantilla) : null;
    var t = p && window.PlantillaPapeles ? PlantillaPapeles.resumenDe(p) : '';
    return '<span class="guion-a-quien-va"><span class="etiqueta">A quién va (lo dice la plantilla)</span> <span class="guion-a-quien-texto">' +
      U.escapar(t || (idPlantilla ? 'Nadie propuesto: se elige al enviar' : 'Elige una plantilla')) + '</span></span>';
  }

  function recetaHTML(g, dentro) {
    var r = g.receta || {};
    var titulo = dentro ? '<span class="guion-receta-titulo">Detalles:</span>' : '';
    if (g.accion === 'comunicar') {
      /* Fila 555: el «a quién» antiguo se conserva, aunque ya no manda. Fila 659: lo mismo con la vía de antes («Por dónde»): ya no se elige aquí,
         lo dice «Dónde se hace» (Correo electrónico o iPasen); la vía vieja se conserva como valor de reserva, sin verse. */
      return '<div class="guion-fila-linea guion-receta"' + (r.a ? ' data-a="' + U.escapar(r.a) + '"' : '') + (r.via ? ' data-via="' + U.escapar(r.via) + '"' : '') + '>' + titulo +
        conRotulo('Plantilla de correo', '<select class="campo guion-receta-plantilla" data-clase="lista">' + opcionesHTML(plantillasPara('lista', r.plantilla), r.plantilla) + nuevaPlantillaHTML(g) + '</select>', dentro) +
        /* Fila 465, C1: «Ver y cambiar el texto» solo con una plantilla elegida (js/guias-plantilla.js). */
        (window.GuiasPlantilla ? GuiasPlantilla.botonHTML(!r.plantilla) : '') +
        marcaFueraDeUso(g) +
        /* Fila 555: a quién va lo dice la plantilla, con sus papeles por campo. */
        aQuienVaHTML(r.plantilla) + '</div>';
    }
    if (g.accion === 'generar') {
      return '<div class="guion-fila-linea guion-receta">' + titulo +
        conRotulo('Plantilla de documento', '<select class="campo guion-receta-plantilla" data-clase="documentos">' + opcionesHTML(plantillasPara('documentos', r.plantilla), r.plantilla) + nuevaPlantillaHTML(g) + '</select>', dentro) +
        marcaFueraDeUso(g) + '</div>';
    }
    if (g.accion === 'registrar') {
      return '<div class="guion-fila-linea guion-receta">' + titulo +
        conRotulo('Entrada o salida', '<select class="campo guion-receta-sentido">' + opcionesHTML(SENTIDOS, r.sentido) + '</select>', dentro) + '</div>';
    }
    if (g.accion === 'pedir') return pedirHTML(g);
    if (g.accion === 'copiar') {   /* fila 552 */
      return dentro || !window.TareaCopiarEditor ? '<div class="guion-fila-linea guion-receta"><span class="suave pequeno">«Copiar a otra carpeta» no va dentro de una pregunta.</span></div>'
        : TareaCopiarEditor.bloqueGuiaHTML(r);
    }
    if (g.accion === 'firmar') {
      return '<div class="guion-fila-linea guion-receta">' + titulo +
        conRotulo('Firmas necesarias', '<select class="campo guion-receta-firmas">' + opcionesHTML(FIRMAS, String(firmasNecesarias(g))) + '</select>', dentro) + '</div>';
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
      if (window.Sitios) Sitios.aplicarDatos(base, base.accion, g);   /* fila 659: «Dónde se hace», «Qué documento» y «A quién» */
      /* Fila 576: «Cuándo se hace» de la tarea (js/solo-si.js). */
      var soloSi = window.SoloSi ? SoloSi.normalizar(g && g.soloSi) : null;
      if (soloSi) base.soloSi = soloSi;
      if (g && g.comun) base.comun = String(g.comun);   /* fila 531: viene de la lista común de tareas (js/comunes.js) */
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
           normalizarReceta: normalizarReceta, normalizarCampos: normalizarCampos, firmasNecesarias: firmasNecesarias, A_QUIEN: A_QUIEN, VIAS: VIAS, recetaHTML: recetaHTML, nuevoId: nuevoId };
})();
window.GuiasGuion = GuiasGuion;
