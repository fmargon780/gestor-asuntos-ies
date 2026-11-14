/* ============================================================
   comunes.js — las listas comunes de tareas y de hitos: la parte que
   solo es lógica (fila 531, docs/531-TAREAS-E-HITOS-COMUNES.md).

   Una tarea común: { id, nombre, accion, receta?, explicacion?, normativa? }.
   `accion` sale de una lista fija (`HACE`; fila 659: Generar documento, Poner a la
   firma, Registrar, Enviar, Añadir documento… Otra cosa = ''). Una tarea lleva además,
   opcionales, `donde` ({ sitio, zona? }, js/sitios.js), `tipoDocumento` y `aQuien`. Un hito común
   se comparte entero: { id, nombre, explicacion, tareas: [ids de tareas
   comunes] }; el plazo y el lugar son de cada guía.

   En la guía (`guias.json`) un hito o una tarea comunes llevan `comun: <id>`
   y además su contenido tal cual lo tenía (el «retrato»): así todo lo que ya
   lee la guía (asuntos, editor, sincronizar) sigue funcionando sin cambiar
   nada, y las guías de antes, sin `comun`, siguen igual. «Cambiar» reescribe
   el retrato en todas las guías que llevan esa marca.

   Todo aquí es puro (sin disco ni pantalla): guardar, js/comunes-guardado.js;
   las ventanas, js/comunes-ventana*.js.
   ============================================================ */
var Comunes = (function () {

  /* Lo que hace una tarea: lista fija (punto 1). '' = «Otra cosa». */
  var HACE = [
    { valor: 'generar', texto: 'Generar documento' }, { valor: 'firmar', texto: 'Poner a la firma' },
    { valor: 'registrar', texto: 'Registrar' }, { valor: 'comunicar', texto: 'Enviar' },
    { valor: 'anadir', texto: 'Añadir documento' }, { valor: 'pedir', texto: 'Rellenar datos del asunto' },
    { valor: 'copiar', texto: 'Copiar a otra carpeta' },   /* fila 552 */
    { valor: 'llamar', texto: 'Llamar' },   /* fila 639; fila 659: antes «Llamar por teléfono» */
    /* Fila 651: solo clasifican, se marcan a mano (sin botón, como «Otra cosa»). Fila 659: «En Séneca» pasa a «Grabar o cambiar datos»
       (qué se hace, sin el sitio), «Entregar o recoger en mano» se parte en «Entregar» y «Recoger», y «Archivar» es nueva. */
    { valor: 'seneca', texto: 'Grabar o cambiar datos' }, { valor: 'entregar', texto: 'Entregar' }, { valor: 'recoger', texto: 'Recoger' },
    { valor: 'publicar', texto: 'Publicar' }, { valor: 'cobrar', texto: 'Cobrar o pagar' },
    { valor: 'comprobar', texto: 'Comprobar' }, { valor: 'archivar', texto: 'Archivar' },
    { valor: '', texto: 'Otra cosa' }
  ];


  /* Fila 657: las once fases de un hito común, en el orden en que se hacen. */
  var FASES = ['recibir', 'pedir', 'comprobar', 'elaborar', 'firma', 'publicar', 'enviar', 'seneca', 'cobrar', 'esperar', 'archivar'];
  /* Fila 659: lo que dice cada fase donde se lea (los valores internos no cambian). */
  var FASES_TEXTO = { recibir: 'Recibir', pedir: 'Pedir', comprobar: 'Comprobar', elaborar: 'Generar documento', firma: 'Poner a la firma', publicar: 'Publicar',
    enviar: 'Enviar o entregar', seneca: 'Grabar o cambiar datos', cobrar: 'Cobrar o pagar', esperar: 'Esperar', archivar: 'Archivar' };
  function textoDeFase(f) { return FASES_TEXTO[f] || ''; }

  function norm(t) { return (window.U && U.normalizar) ? U.normalizar(String(t || '')) : String(t || '').toLowerCase().trim(); }
  function nuevoId(p) { return (window.U && U.nuevoId) ? U.nuevoId(p) : p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function textoDeHace(accion) {
    var h = HACE.filter(function (x) { return x.valor === (accion || ''); })[0];
    return h ? h.texto : 'Otra cosa';
  }
  function accionValida(a) { return HACE.some(function (x) { return x.valor === a; }) ? a : ''; }

  /* ---------- las dos listas ---------- */

  function normalizarTarea(t) {
    var accion = accionValida(String((t && t.accion) || ''));
    var receta = window.GuiasGuion ? GuiasGuion.normalizarReceta(accion, t && t.receta) : ((t && t.receta) || null);
    var o = { id: (t && t.id) || nuevoId('tc'), nombre: String((t && t.nombre) || '').trim(), accion: accion };
    if (receta) o.receta = receta;
    if (t && String(t.explicacion || '').trim()) o.explicacion = String(t.explicacion).trim();
    if (t && t.normativa && t.normativa.cita) o.normativa = copia(t.normativa);
    if (window.Sitios) Sitios.aplicarDatos(o, accion, t);   /* fila 659: «Dónde se hace», «Qué documento» y «A quién» */
    if (t && (t.reunir === 'documento' || t.reunir === 'dato')) { o.reunir = t.reunir; o.obligatorio = !!t.obligatorio; }
    return o;
  }

  function normalizarHito(h) {
    var ids = [];
    ((h && h.tareas) || []).forEach(function (i) { if (typeof i === 'string' && ids.indexOf(i) === -1) ids.push(i); });
    var o = { id: (h && h.id) || nuevoId('hc'), nombre: String((h && h.nombre) || '').trim(),
              explicacion: String((h && h.explicacion) || '').trim(), tareas: ids };
    if (h && FASES.indexOf(h.fase) !== -1) o.fase = h.fase;   /* fila 657: la fase del hito común (todavía no se ve ni se elige) */
    return o;
  }

  /* `leido` es lo que trae el fichero (o nada): { version: 1, tareas|hitos: [...] }. */
  function normalizarFichero(clave, leido) {
    var lista = leido && Array.isArray(leido[clave]) ? leido[clave] : [];
    var hacer = clave === 'tareas' ? normalizarTarea : normalizarHito;
    var o = { version: 1 };
    o[clave] = lista.map(hacer).filter(function (x) { return x.nombre; });
    return o;
  }

  function buscar(lista, id) { return (lista || []).filter(function (x) { return x.id === id; })[0] || null; }

  /* ¿Qué se parece al nombre que se escribe? Palabras de más de dos letras en común, o el mismo nombre. */
  function palabras(t) { return norm(t).split(/[^a-z0-9ñ]+/).filter(function (p) { return p.length > 2; }); }
  function parecidas(nombre, lista, max) {
    var w = palabras(nombre);
    if (!w.length) return [];
    return (lista || []).filter(function (x) {
      return norm(x.nombre) === norm(nombre) || palabras(x.nombre).some(function (p) { return w.indexOf(p) !== -1; });
    }).slice(0, max || 4);
  }
  /* Fila 551: tras pasar las guías puede haber dos tareas (u hitos) con el mismo nombre que no dicen lo mismo (otra plantilla, otras tareas).
     Al cambiar una, solo cuenta como repetida la que es igual en todo. */
  function existeIgual(clave, lista, e, salvoId) {
    return (lista || []).some(function (x) {
      if (x.id === salvoId || norm(x.nombre) !== norm(e.nombre)) return false;
      if (clave === 'hitos') return (x.tareas || []).join(',') === (e.tareas || []).join(',');
      return (x.accion || '') === (e.accion || '') && ((x.receta && x.receta.plantilla) || '') === ((e.receta && e.receta.plantilla) || '') &&
        ((x.receta && x.receta.carpeta) || '') === ((e.receta && e.receta.carpeta) || '');   /* fila 552: dos «Copiar» a carpetas distintas no son la misma */
    });
  }
  function existeNombre(lista, nombre, salvoId) {
    return (lista || []).some(function (x) { return x.id !== salvoId && norm(x.nombre) === norm(nombre); });
  }

  /* ---------- recorrer las guías ---------- */

  /* Cada línea del guion de cada hito normal de cada guía, a cualquier nivel (también dentro de las respuestas de una pregunta). */
  function recorrerLineas(lista, fn, tipo, paso) {
    (lista || []).forEach(function (g, i) {
      fn(g, lista, i, tipo, paso);
      if (g && g.pregunta) (g.opciones || []).forEach(function (o) { recorrerLineas(o.lineas, fn, tipo, paso); });
    });
  }
  function recorrerPasos(pasos, fn, tipo) {
    (pasos || []).forEach(function (p, i) {
      fn(p, pasos, i, tipo);
      (p.opciones || []).forEach(function (o) { recorrerPasos(o.pasos, fn, tipo); });
    });
  }
  function recorrerGuias(guias, fnPaso, fnLinea) {
    Object.keys(guias || {}).forEach(function (tipo) {
      recorrerPasos(guias[tipo], function (p, lista, i) {
        if (fnPaso) fnPaso(p, lista, i, tipo);
        if (fnLinea && !(p.opciones && p.opciones.length)) recorrerLineas(p.guion, fnLinea, tipo, p);
      }, tipo);
    });
  }

  /* En qué tipos se usa cada tarea y cada hito: { tareas: {id: [tipos]}, hitos: {id: [tipos]} }. */
  function usos(guias) {
    var r = { tareas: {}, hitos: {} };
    function poner(mapa, id, tipo) { var l = mapa[id] = mapa[id] || []; if (l.indexOf(tipo) === -1) l.push(tipo); }
    recorrerGuias(guias, function (p, l, i, tipo) { if (p.comun) poner(r.hitos, p.comun, tipo); },
      function (g, l, i, tipo) { if (g.comun) poner(r.tareas, g.comun, tipo); });
    return r;
  }
  function textoUsos(tipos) {
    var n = (tipos || []).length;
    return n === 0 ? 'todavía no se usa en ningún tipo' : 'se usa en ' + n + (n === 1 ? ' tipo' : ' tipos');
  }

  /* ---------- de la lista común a la guía ---------- */

  /* Una línea de guion con el retrato de la tarea común. `id` nuevo en cada uso. */
  function lineaDeTarea(t) {
    var g = { id: nuevoId('g'), comun: t.id, texto: t.nombre, explicacion: t.explicacion || '', accion: t.accion || '',
              normativa: t.normativa ? copia(t.normativa) : null };
    if (t.receta) g.receta = copia(t.receta);
    if (window.Sitios) Sitios.aplicarDatos(g, t.accion || '', t);   /* fila 659 */
    if (t.reunir) { g.reunir = t.reunir; g.obligatorio = !!t.obligatorio; }
    return g;
  }

  /* Un hito de la guía con el retrato del hito común y las líneas de sus tareas. `desde`: el hito de arriba (para un plazo; sin plazo al nacer). */
  function pasoDeHito(h, tareas) {
    var base = window.Guias ? Guias.normalizar([{ titulo: h.nombre, cuerpo: h.explicacion }])[0] : { titulo: h.nombre, cuerpo: h.explicacion, opciones: [] };
    base.comun = h.id;
    if (h.responsable) base.responsable = h.responsable;   /* fila 615: el elegido al crear el hito */
    base.guion = (h.tareas || []).map(function (id) { return buscar(tareas, id); }).filter(Boolean).map(lineaDeTarea);
    return base;
  }

  /* ¿Una línea de la guía dice lo mismo que la tarea común? (texto, lo que hace y plantilla) */
  function textoIgual(g, t) {
    return norm(g.texto) === norm(t.nombre) && (g.accion || '') === (t.accion || '') &&
      ((g.receta && g.receta.plantilla) || '') === ((t.receta && t.receta.plantilla) || '');
  }

  function aplicarATarea(g, t) {
    g.texto = t.nombre; g.explicacion = t.explicacion || ''; g.accion = t.accion || '';
    g.normativa = t.normativa ? copia(t.normativa) : null;
    if (t.receta) g.receta = copia(t.receta); else delete g.receta;
    if (window.Sitios) Sitios.aplicarDatos(g, t.accion || '', t);   /* fila 659 */
    if (t.reunir) { g.reunir = t.reunir; g.obligatorio = !!t.obligatorio; } else { delete g.reunir; delete g.obligatorio; }
  }

  /* «Cambiar la tarea»: copia de las guías con el retrato nuevo en cada línea que lleva la marca.
     Devuelve { guias, tipos: [tipos tocados], antes: { tipo: [{ pasoId, linea }] } } (las líneas como eran). */
  function cambiarTareaEnGuias(guias, t) {
    var nuevas = copia(guias || {}), tipos = [], antes = {};
    recorrerGuias(nuevas, null, function (g, l, i, tipo, paso) {
      if (g.comun !== t.id) return;
      if (tipos.indexOf(tipo) === -1) tipos.push(tipo);
      (antes[tipo] = antes[tipo] || []).push({ pasoId: paso.id, linea: copia(g) });
      aplicarATarea(g, t);
    });
    return { guias: nuevas, tipos: tipos, antes: antes };
  }

  /* «Cambiar el hito»: nombre y explicación. */
  function cambiarHitoEnGuias(guias, h) {
    var nuevas = copia(guias || {}), tipos = [];
    recorrerGuias(nuevas, function (p, l, i, tipo) {
      if (p.comun !== h.id) return;
      if (tipos.indexOf(tipo) === -1) tipos.push(tipo);
      p.titulo = h.nombre;
      p.cuerpo = window.Guias ? Guias.limpiar(h.explicacion) : h.explicacion;
    });
    return { guias: nuevas, tipos: tipos };
  }

  /* ---------- la propuesta de pasar las guías actuales (punto 9; solo se ve, no se aplica) ---------- */

  function plantillaDe(g) { return (g.receta && g.receta.plantilla) || ''; }
  function claveTarea(g) { return [norm(g.texto), g.accion || '', plantillaDe(g)].join('|'); }

  /* Lo que se podría pasar: los hitos normales (no preguntas) del primer nivel de cada guía y sus tareas normales (las preguntas se quedan como están).
     { tareas: [{ clave, nombre, accion, plantilla, usos: [{ tipo, hito }], yaEnLista }], hitos: [{ clave, nombre, explicacion, tareas: [claves], usos: [tipo], yaEnLista }],
       iguales: [{ tipo: 'tarea', nombre, veces }], distintas: [{ tipo, nombre, maneras }], seQuedan: { preguntas, hitosConRamas }, total } */
  function propuesta(guias, tareasLista, hitosLista) {
    var porT = {}, ordenT = [], porH = {}, ordenH = [], seQuedan = { preguntas: 0, hitosConRamas: 0 }, lineas = 0;
    Object.keys(guias || {}).forEach(function (tipo) {
      (guias[tipo] || []).forEach(function (p) {
        if (p.opciones && p.opciones.length) { seQuedan.hitosConRamas++; return; }
        var claves = [];
        (p.guion || []).forEach(function (g) {
          if (g.pregunta) { seQuedan.preguntas++; return; }
          lineas++;
          var k = claveTarea(g), t = porT[k];
          if (!t) { t = porT[k] = { clave: k, nombre: g.texto, accion: g.accion || '', plantilla: plantillaDe(g), usos: [], yaEnLista: !!g.comun }; ordenT.push(k); }
          t.usos.push({ tipo: tipo, hito: p.titulo });
          claves.push(k);
        });
        var kh = [norm(p.titulo), norm(p.cuerpo), claves.join(',')].join('|'), h = porH[kh];
        if (!h) { h = porH[kh] = { clave: kh, nombre: p.titulo, explicacion: p.cuerpo || '', tareas: claves, usos: [], yaEnLista: !!p.comun }; ordenH.push(kh); }
        if (h.usos.indexOf(tipo) === -1) h.usos.push(tipo);
      });
    });
    var tareas = ordenT.map(function (k) { return porT[k]; }), hitos = ordenH.map(function (k) { return porH[k]; });
    function maneras(lista, clave) {
      var por = {};
      lista.forEach(function (x) { var n = norm(x.nombre); (por[n] = por[n] || { nombre: x.nombre, n: 0 }).n++; });
      return Object.keys(por).filter(function (n) { return por[n].n > 1; }).map(function (n) { return { tipo: clave, nombre: por[n].nombre, maneras: por[n].n }; });
    }
    return {
      tareas: tareas, hitos: hitos, lineas: lineas,
      iguales: tareas.filter(function (t) { return t.usos.length > 1; }).map(function (t) { return { tipo: 'tarea', nombre: t.nombre, veces: t.usos.length }; })
        .concat(hitos.filter(function (h) { return h.usos.length > 1; }).map(function (h) { return { tipo: 'hito', nombre: h.nombre, veces: h.usos.length }; })),
      distintas: maneras(tareas, 'tarea').concat(maneras(hitos, 'hito')),
      seQuedan: seQuedan,
      /* Nada se pierde: cada tarea de cada hito pasable está en una de las tareas de la propuesta. */
      sinPerdidas: tareas.reduce(function (n, t) { return n + t.usos.length; }, 0) === lineas
    };
  }

  return {
    HACE: HACE, FASES: FASES, FASES_TEXTO: FASES_TEXTO, textoDeFase: textoDeFase, textoDeHace: textoDeHace, accionValida: accionValida,
    normalizarTarea: normalizarTarea, normalizarHito: normalizarHito, normalizarFichero: normalizarFichero,
    buscar: buscar, parecidas: parecidas, existeNombre: existeNombre, existeIgual: existeIgual,
    recorrerGuias: recorrerGuias, usos: usos, textoUsos: textoUsos,
    lineaDeTarea: lineaDeTarea, pasoDeHito: pasoDeHito, aplicarATarea: aplicarATarea, textoIgual: textoIgual,
    cambiarTareaEnGuias: cambiarTareaEnGuias, cambiarHitoEnGuias: cambiarHitoEnGuias, propuesta: propuesta
  };
})();
window.Comunes = Comunes;
