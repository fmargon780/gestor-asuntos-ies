/* ============================================================
   hitos.js — el modelo de los hitos de un asunto (16-sep-2026).

   Hasta hoy la guía de un tipo era texto que se leía y se marcaba con
   una casilla (js/guias.js). Un HITO es ese mismo paso, pero vivo
   dentro de un asunto concreto: además de estar marcado o no, lleva
   estado, fecha límite, responsable, notas y documentos apuntados.

   Los hitos NO van en asuntos.json: viven en su propio fichero,
   _GESTOR/hitos.json, el duodécimo fichero compartido (js/copias.js).
   Solo se lee al abrir un asunto y al archivarlo (y, más adelante, en
   la pantalla "Qué me toca", fila 16 de la cola).

   Ver docs/HITOS.md para el encargo completo. Este fichero es el
   modelo: leer y escribir hitos.json, crear los hitos de un asunto a
   partir de su guía (nuevo, o importando pasosHechos/pasosElegidos de
   uno viejo), marcar un hito y avanzar solo al siguiente, y la única
   función que calcula el estado del asunto a partir del hito en curso
   (sección 8 del encargo). Las bifurcaciones y el historial que se
   escribe al archivar viven en js/hitos-archivo.js, para no pasar de
   las 400 líneas.

   Se carga después de js/puente.js (usa window.Gestor) y después de
   js/guias-enganche.js (usa window.GuiasDelCentro.pasosDe).
   ============================================================ */
var Hitos = (function () {

  var FICHERO = 'hitos.json';
  var CLASES_ESTADO = ['pendiente', 'encurso', 'hecho', 'noaplica'];

  /* Los responsables de "persona del centro" de partida (sección 6 del
     encargo). Francisco los cambia desde Ajustes › Hitos. */
  var RESPONSABLES_DEFECTO = [
    { id: 'yo', nombre: 'Yo', clase: 'centro' },
    { id: 'companero', nombre: 'Mi compañero', clase: 'centro' },
    { id: 'direccion', nombre: 'Dirección', clase: 'centro' },
    { id: 'jefatura', nombre: 'Jefatura', clase: 'centro' },
    { id: 'secretaria', nombre: 'Secretaría', clase: 'centro' }
  ];

  /* Los "papeles" son fijos, no configurables: se resuelven con datos
     que la aplicación ya tiene, asunto por asunto. */
  var PAPELES = [
    { id: 'tercero', nombre: 'El tercero del asunto', clase: 'papel' },
    { id: 'tutor', nombre: 'El tutor del alumnado', clase: 'papel' },
    { id: 'relacionado', nombre: 'Un relacionado', clase: 'papel' }
  ];

  function nuevoId() { return U.nuevoId('h'); }

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  /* ==========================================================
     LEER Y NORMALIZAR
     ========================================================== */

  function normalizarNota(n) {
    return {
      texto: String((n && n.texto) || ''),
      quien: String((n && n.quien) || ''),
      cuando: String((n && n.cuando) || '')
    };
  }

  /* "Lo que hay que reunir" (18-sep-2026, fila 59,
     docs/REQUISITOS-DE-HITO.md): la misma casilla de la guía
     (id/texto/clase/obligatorio), con el estado propio del hito
     encima (hecho/valor/documento/quien/cuando, como en las notas). */
  function normalizarRequisitoHito(r) {
    return {
      id: (r && r.id) || nuevoId(),
      texto: String((r && r.texto) || ''),
      clase: (r && r.clase) === 'documento' ? 'documento' : 'dato',
      obligatorio: !!(r && r.obligatorio),
      hecho: !!(r && r.hecho),
      valor: String((r && r.valor) || ''),
      documento: String((r && r.documento) || ''),
      quien: String((r && r.quien) || ''),
      cuando: String((r && r.cuando) || '')
    };
  }

  /* Cómo se cuenta un plazo (fila 131, js/plazos.js): hábiles si no dice. */
  function cuentaDePlazo(c) { return (c === 'lectivos' || c === 'naturales') ? c : 'habiles'; }

  /* Un hito, tal y como se guarda. Recursivo: un hito de clase
     "decision" lleva sus opciones, cada una con su propia lista de
     hitos (nunca otra decisión dentro, igual que en la guía). */
  function normalizarHito(h) {
    var esDecision = (h && h.clase) === 'decision';
    var salida = {
      id: (h && h.id) || nuevoId(),
      titulo: String((h && h.titulo) || ''),
      cuerpo: String((h && h.cuerpo) || ''),
      origenGuia: (h && h.origenGuia) || null,
      clase: esDecision ? 'decision' : 'paso',
      estado: CLASES_ESTADO.indexOf(h && h.estado) !== -1 ? h.estado : 'pendiente',
      desde: String((h && h.desde) || ''),
      responsable: String((h && h.responsable) || ''),
      fecha: String((h && h.fecha) || ''),
      fechaManual: !!(h && h.fechaManual),
      plazo: (h && h.plazo && h.plazo.dias)
        ? { dias: parseInt(h.plazo.dias, 10) || 0, desde: String(h.plazo.desde || ''),
            cuenta: cuentaDePlazo(h.plazo.cuenta) } : null,   /* fila 131: hábiles si no dice */
      estadoAsunto: (h && h.estadoAsunto) || null,
      notas: Array.isArray(h && h.notas) ? h.notas.map(normalizarNota) : [],
      documentos: Array.isArray(h && h.documentos) ? h.documentos.map(String) : [],
      requisitos: Array.isArray(h && h.requisitos) ? h.requisitos.map(normalizarRequisitoHito) : [],
      plantilla: (h && h.plantilla) || null,   /* hueco sin uso, sección 9 */
      /* 20-sep-2026, fila 79, apartados 4.6 y 4.7: un hito sin estos dos
         campos (todos los que ya existían antes de esta fila) se
         comporta como uno normal y sin normativa. Solo existen en el
         hito de arriba, nunca en el de una opción (igual que en su paso
         de guía). */
      soloInformativo: !!(h && h.soloInformativo),
      normativa: (window.Guias ? Guias.normalizarNormativa(h && h.normativa) : []),
      /* 20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md: claves del
         catálogo de `js/formularios.js`. Mismo criterio que `normativa`:
         solo en el hito de arriba, nunca en el de una opción. */
      formularios: Array.isArray(h && h.formularios) ? h.formularios.map(String) : [],
      /* 23-sep-2026, fila 94, docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md: el
         tipo del que venía un hito que se ha quedado tras cambiar el tipo
         del asunto (tenía algo apuntado). No existe en los demás. No
         se ve en la lista ni cuenta: sale plegado con los huérfanos.
         Solo se escribe cuando lo hay (más abajo), para no cambiar la
         forma de ningún hito de antes. */
      opciones: [], elegida: null
    };
    if (h && h.delTipoAnterior) salida.delTipoAnterior = String(h.delTipoAnterior);
    /* La fecha en que se dio por hecho (fila 102, para {hecho:...}).
       Solo si la hay: los hitos de antes no la tienen, y no se inventa. */
    if (h && h.hechoEl) salida.hechoEl = String(h.hechoEl);
    /* El estado del guion (fila 109, js/hitos-guion.js): solo si lo hay. */
    if (h && h.guionHecho && typeof h.guionHecho === 'object') salida.guionHecho = h.guionHecho;
    if (h && Array.isArray(h.guionPropio) && h.guionPropio.length) salida.guionPropio = h.guionPropio;
    /* Fila 116: la respuesta a cada pregunta del guion, solo si la hay. */
    if (h && h.guionElegido && typeof h.guionElegido === 'object' && Object.keys(h.guionElegido).length) salida.guionElegido = h.guionElegido;
    /* Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md), solo si los hay: la marca
       del paso («Nos toca» / «Esperamos a…») y el «Esperando a…» puesto a
       mano, con desde cuándo, el motivo y los ficheros que había. */
    if (h && (h.toca === 'nos' || h.toca === 'espera')) salida.toca = h.toca;
    if (h && h.toca === 'espera' && h.tocaA) salida.tocaA = String(h.tocaA);
    if (h && h.esperandoA) {
      salida.esperandoA = String(h.esperandoA);
      salida.esperandoDesde = String(h.esperandoDesde || '');
      if (h.esperandoMotivo) salida.esperandoMotivo = String(h.esperandoMotivo);
      if (Array.isArray(h.esperandoFicheros)) salida.esperandoFicheros = h.esperandoFicheros.map(String);
    }
    if (esDecision) {
      salida.opciones = (Array.isArray(h && h.opciones) ? h.opciones : []).map(function (o) {
        return {
          id: (o && o.id) || nuevoId(),
          texto: String((o && o.texto) || ''),
          hitos: (Array.isArray(o && o.hitos) ? o.hitos : []).map(normalizarHito)
        };
      });
      salida.elegida = (h && h.elegida) || null;
    }
    return salida;
  }

  function normalizarLista(lista) {
    return (Array.isArray(lista) ? lista : []).map(normalizarHito);
  }

  function normalizarAjustes(a) {
    var responsables = (Array.isArray(a && a.responsables) ? a.responsables : RESPONSABLES_DEFECTO.slice())
      .map(function (r) {
        var id = String((r && r.id) || '');
        /* Fila 104: si es de Administración (sí/no). De partida, `yo` y
           `companero`; los que se guardaron antes de la marca, igual. */
        var adm = (r && typeof r.administracion === 'boolean') ? r.administracion : (id === 'yo' || id === 'companero');
        return { id: id, nombre: String((r && r.nombre) || ''), clase: 'centro', administracion: adm };
      })
      .filter(function (r) { return r.id && r.nombre; });
    var noLectivos = (Array.isArray(a && a.noLectivos) ? a.noLectivos : [])
      .map(String).filter(function (f) { return /^\d{4}-\d{2}-\d{2}$/.test(f); }).sort();
    /* Fila 131: los festivos, aparte (cuentan para todos los plazos). */
    var festivos = (Array.isArray(a && a.festivos) ? a.festivos : [])
      .map(String).filter(function (f) { return /^\d{4}-\d{2}-\d{2}$/.test(f); }).sort();
    return { responsables: responsables, noLectivos: noLectivos, festivos: festivos };
  }

  function normalizar(leido) {
    var l = leido || {};
    var porAsunto = {};
    var origen = (l.porAsunto && typeof l.porAsunto === 'object') ? l.porAsunto : {};
    Object.keys(origen).forEach(function (clave) {
      var e = origen[clave] || {};
      porAsunto[clave] = { creados: String(e.creados || ''), hitos: normalizarLista(e.hitos) };
      /* Fila 118 (js/hitos-sincronizar.js): los pasos de la guía que ya han pasado por el asunto. */
      if (window.Hitos && Hitos.pasosConocidosDe) porAsunto[clave].pasosConocidos = Hitos.pasosConocidosDe(e, porAsunto[clave].hitos);
    });
    return { ajustes: normalizarAjustes(l.ajustes), porAsunto: porAsunto };
  }

  function vacio() { return normalizar(null); }

  async function leer() {
    var g = gestor();
    if (!g) return vacio();
    var leido = normalizar(await Carpetas.leerJson(g, FICHERO));
    var n = Object.keys(leido.porAsunto).length;
    if (n) vistosConDatos = n;
    ultimos = leido;
    alLeer.forEach(function (f) { try { f(leido); } catch (e) { /* solo pintar */ } });
    return leido;
  }

  /* Como todo fichero compartido: se relee justo antes de escribir, y
     todo pasa por Copias.guardar, nunca por Carpetas.guardarJson
     directo (sección 2.2 del encargo). 'hacer' recibe los datos ya
     releídos, los muta a gusto y los devuelve (o no devuelve nada, y
     se guarda igual: ya han quedado mutados). */
  /* Desde la fila 99 (docs/GUARDAR-EN-FILA.md), en fila con los demás
     guardados de hitos.json, y sin escribir encima de todo si la
     lectura llega vacía de repente (leerParaCambiar). */
  function cambiar(hacer) {
    var g = gestor();
    if (!g) return Promise.resolve(vacio());
    var hacerlo = async function () {
      var actual = await leerParaCambiar(g);
      var nuevo = hacer(actual) || actual;
      await Copias.guardar(g, FICHERO, nuevo);
      ultimoCambio = Date.now();
      vistosConDatos = Object.keys(nuevo.porAsunto || {}).length;
      ultimos = nuevo;
      alCambiar.forEach(function (f) { try { f(nuevo); } catch (e) { /* solo avisar */ } });
      return nuevo;
    };
    return window.ColaGuardado ? window.ColaGuardado.poner(FICHERO, hacerlo) : hacerlo();
  }

  /* Cuántos asuntos con hitos se han visto en la última lectura buena.
     Si una lectura llega vacía y antes había, se relee dos veces y, si
     sigue vacía, error en vez de escribir (fila 99, punto 5.1). */
  var vistosConDatos = 0;

  /* Cuándo escribió hitos.json este ordenador por última vez (fila 101):
     quien pinta algo a partir de los hitos puede saltarse la relectura
     si no ha cambiado nada desde la suya. */
  var ultimoCambio = 0;
  function ultimoCambioLocal() { return ultimoCambio; }

  /* Lo último leído o escrito de hitos.json en este ordenador, sin ir
     al disco (fila 104: la lista de asuntos abiertos lo mira en cada
     repintado), y quién quiere enterarse de cada escritura. */
  var ultimos = null;
  function ultimosLeidos() { return ultimos; }
  var alCambiar = [];
  /* Y quién quiere enterarse de cada lectura (fila 129: la cabecera de la
     ficha enseña el hito actual con lo último leído). */
  var alLeer = [];
  var ESPERAS_LECTURA_VACIA_MS = [700, 1500];

  async function leerParaCambiar(g) {
    for (var i = 0; ; i++) {
      var datos = normalizar(await Carpetas.leerJson(g, FICHERO));
      var n = Object.keys(datos.porAsunto).length;
      if (n || !vistosConDatos) { vistosConDatos = n; return datos; }
      if (i >= ESPERAS_LECTURA_VACIA_MS.length) {
        var e = new Error('hitos.json ha llegado vacío y hace un momento tenía los hitos de ' +
          vistosConDatos + ' asuntos. No he guardado nada para no borrarlos. Espera un poco ' +
          '(Dropbox puede estar sincronizando) y vuelve a intentarlo.');
        e.name = 'LecturaVacia';
        throw e;
      }
      await new Promise(function (ok) { setTimeout(ok, ESPERAS_LECTURA_VACIA_MS[i]); });
    }
  }

  async function hitosDe(clave) {
    var datos = await leer();
    var e = datos.porAsunto[clave];
    return e ? e.hitos : [];
  }

  /* ==========================================================
     BUSCAR, LO VISIBLE Y EL SIGUIENTE EN CURSO

     Un hito de clase "decision" corta la lista mientras no se elige
     una opción: nada de lo que viene después se ve ni se cuenta. Al
     elegir, los hitos de la rama elegida se cuentan como si vinieran
     justo debajo (sección 4 del encargo).
     ========================================================== */

  function buscar(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) {
      var h = lista[i];
      if (h.id === id) return h;
      if (h.clase === 'decision') {
        for (var j = 0; j < h.opciones.length; j++) {
          var enc = buscar(h.opciones[j].hitos, id);
          if (enc) return enc;
        }
      }
    }
    return null;
  }

  /* Una pregunta sin responder corta la lista ENTERA, esté al nivel
     que esté (fila 95: preguntas dentro de las respuestas): si la de
     dentro de una rama no se ha respondido, tampoco se ve lo que viene
     después de la pregunta de fuera. */
  function recorrerVisibles(lista, out) {
    for (var i = 0; i < (lista || []).length; i++) {
      var h = lista[i];
      if (h.delTipoAnterior) continue;   /* fila 94: va con los huérfanos */
      out.push(h);
      if (h.clase === 'decision') {
        if (!h.elegida) return true;   /* se corta aquí: nada más se ve */
        var opt = h.opciones.filter(function (o) { return o.id === h.elegida; })[0];
        if (opt && recorrerVisibles(opt.hitos, out)) return true;
      }
    }
    return false;
  }

  function visibles(lista) {
    var out = [];
    recorrerVisibles(lista, out);
    return out;
  }

  /* Los hitos "noaplica" que se quedaron colgando al cambiar de rama
     (tenían notas o documentos, así que no se borraron). Se pintan
     plegados, al final, vengan de la rama que vengan. */
  function huerfanos(lista) {
    var out = [];
    (lista || []).forEach(function (h) {
      if (h.delTipoAnterior) { out.push(h); return; }   /* fila 94 */
      if (h.clase !== 'decision') return;
      h.opciones.forEach(function (o) {
        if (o.id !== h.elegida) out = out.concat(descartados(o.hitos));
        else out = out.concat(huerfanos(o.hitos));
      });
    });
    return out;
  }

  /* Todo lo "noaplica" de una rama no elegida, a cualquier profundidad
     (fila 95): una pregunta de dentro se enseña solo si tenía algo
     suyo apuntado; sus pasos con algo, siempre. */
  function descartados(lista) {
    var out = [];
    (lista || []).forEach(function (x) {
      if (x.clase === 'decision') {
        if (x.estado === 'noaplica' && ((x.notas && x.notas.length) || (x.documentos && x.documentos.length))) out.push(x);
        x.opciones.forEach(function (o) { out = out.concat(descartados(o.hitos)); });
      } else if (x.estado === 'noaplica') {
        out.push(x);
      }
    });
    return out;
  }

  /* Solo puede haber un hito en curso a la vez (sección 5). Si ya hay
     uno, no se toca nada. Si no, el primer "pendiente" de la lista
     visible pasa a "encurso" y se le anota "desde". Devuelve ese hito,
     o null si no había ninguno que avanzar. */
  function recomputeEnCurso(raiz) {
    var vis = visibles(raiz);
    if (vis.some(function (h) { return h.estado === 'encurso'; })) return null;
    var siguiente = vis.filter(function (h) { return h.estado === 'pendiente'; })[0];
    if (!siguiente) return null;
    siguiente.estado = 'encurso';
    siguiente.desde = U.hoyIso();
    return siguiente;
  }

  function cuenta(lista) {
    var vis = visibles(lista);
    var hechos = vis.filter(function (h) { return h.estado === 'hecho'; }).length;
    return { hechos: hechos, total: vis.length };
  }

  /* "Lo que hay que reunir" (fila 59, sección 6 del encargo): las
     casillas obligatorias de un hito que siguen sin marcar. Vacía si
     no hay ninguna, o si el hito no tiene requisitos. No cambia
     `marcar`: es js/hitos-panel-lista.js quien llama a esto ANTES de
     pasar un hito a "hecho", para avisar sin impedir nada. */
  function faltanObligatorios(hito, a) {
    /* Fila 138: con el asunto, las líneas obligatorias del guion por reunir. */
    if (a && window.Hitos && Hitos.faltanReunir) return Hitos.faltanReunir(a, hito, true);
    return ((hito && hito.requisitos) || []).filter(function (r) { return r.obligatorio && !r.hecho; });
  }

  /* ==========================================================
     EL ESTADO DEL ASUNTO (sección 8 del encargo)

     Desde la fila 129 (docs/EL-HITO-ES-EL-ESTADO.md) el estado del
     asunto ES su hito actual: «Paso N de M · título», «Listo para
     archivar» o «Sin hitos», y a quién le toca. Esta es la ÚNICA
     función que lo decide; la cuenta vive en js/hitos-a-quien.js
     (Hitos.ladoDelAsunto). Ya no se escribe nada en asuntos.json. */
  function estadoDelAsunto(hitos, ajustes, contexto) {
    if (typeof Hitos.ladoDelAsunto !== 'function') return { lado: 'administracion', texto: '', sinHitos: true };
    return Hitos.ladoDelAsunto(hitos || [], ajustes || null, contexto);
  }

  /* Tras mover un hito: la cabecera de la ficha, si está abierta, y la
     lista, solo si se ve (App.pintarAbiertos la deja pendiente si no). */
  async function aplicarEstadoDelHito(clave) {
    if (!window.App) return;
    try {
      if (typeof App.repintarAccionesFicha === 'function') App.repintarAccionesFicha(clave);
      if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
    } catch (e2) { /* solo pintar */ }
  }

  /* Las fechas límite calculadas por plazo (sección 7): cuando un hito
     pasa a "hecho", los hitos cuyo plazo cuenta "desde" él (y que
     Francisco no haya tocado a mano) recalculan su fecha, contada como
     diga su plazo (fila 131: hábiles, lectivos o naturales) con los
     festivos y los no lectivos de Ajustes › Hitos. */
  function aplicarPlazosDependientes(raiz, idHecho, ajustes) {
    var aj = ajustes || {};
    (function recorrer(lista) {
      (lista || []).forEach(function (h) {
        if (h.plazo && h.plazo.desde === idHecho && !h.fechaManual) {
          h.fecha = Plazos.sumarPlazo(U.hoyIso(), h.plazo.dias, h.plazo.cuenta, aj.festivos, aj.noLectivos);
        }
        if (h.clase === 'decision') h.opciones.forEach(function (o) { recorrer(o.hitos); });
      });
    })(raiz);
  }

  /* ==========================================================
     CREAR LOS HITOS DE UN ASUNTO, DESDE SU GUÍA

     El id del hito es el mismo que el del paso de la guía
     (origenGuia): así un plazo "desde" tal paso, o un pasosElegidos
     de un asunto viejo, se traduce solo, sin tener que llevar un mapa
     aparte.
     ========================================================== */

  function pasoAHito(p) {
    var esDecision = Guias.esPregunta(p);
    return normalizarHito({
      id: p.id, origenGuia: p.id, titulo: p.titulo, cuerpo: p.cuerpo,
      clase: esDecision ? 'decision' : 'paso', estado: 'pendiente',
      responsable: p.responsable || '', estadoAsunto: p.estadoAsunto || null,
      toca: p.toca || '', tocaA: p.tocaA || '',
      plazo: (p.plazo && p.plazo.dias) ? { dias: p.plazo.dias, desde: p.plazo.desde || '', cuenta: p.plazo.cuenta } : null,
      /* Una pregunta no lleva requisitos propios (fila 59, sección 4.1
         del encargo: el editor no se los deja poner); los de sus
         opciones llegan solos, porque cada paso de dentro se convierte
         en su propio hito, con los suyos. */
      requisitos: esDecision ? [] : (p.requisitos || []),
      /* Una pregunta tampoco lleva estos dos (fila 79, apartados 4.6 y
         4.7): igual que los requisitos, son de los pasos de arriba. */
      soloInformativo: esDecision ? false : !!p.soloInformativo,
      normativa: esDecision ? [] : (p.normativa || []),
      formularios: esDecision ? [] : (p.formularios || []),
      opciones: esDecision ? p.opciones.map(function (o) {
        return { id: o.id, texto: o.titulo, hitos: (o.pasos || []).map(pasoAHito) };
      }) : [],
      elegida: null
    });
  }

  /* La guía del tipo; si no tiene, la guía mínima (fila 129,
     js/estado-hito.js), que se guarda como guía normal del tipo. */
  async function pasosOMinima(tipo) {
    var pasos = (window.GuiasDelCentro && window.GuiasDelCentro.pasosDe(tipo)) || [];
    if (pasos.length || !tipo || !window.EstadoHito || !EstadoHito.guiaMinima) return pasos;
    try { return (await EstadoHito.guiaMinima(tipo)) || []; } catch (e) { return []; }
  }

  /* Asunto nuevo (sección 3.1): los hitos se crean de golpe al abrirlo,
     y el primero queda en curso. No hace nada si el asunto ya tiene
     hitos (para no crearlos dos veces si esto se llama más de una
     vez). Si el tipo no tiene guía, se queda sin hitos: el botón para
     añadirlos a mano lo pone js/hitos-panel.js. */
  async function crearDesdeGuia(clave, tipo) {
    var previos = await hitosDe(clave);
    if (previos.length) return previos;
    var pasos = await pasosOMinima(tipo);
    if (!pasos.length) return [];
    var resultado = null;
    var datos = await cambiar(function (d) {
      var lista = pasos.map(pasoAHito);
      resultado = recomputeEnCurso(lista);
      d.porAsunto[clave] = { creados: U.hoyIso(), hitos: lista };
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  /* Los hitos de una guía, con lo ya marcado en pasosHechos/pasosElegidos
     de un asunto viejo. Función pura (también la usa el paso único de la
     fila 129, js/estado-migracion.js). */
  function listaImportando(pasos, pasosHechos, pasosElegidos) {
    var hechos = pasosHechos || [];
    var elegidos = pasosElegidos || {};
    var lista = (pasos || []).map(pasoAHito);
    (function aplicar(l) {
      (l || []).forEach(function (h) {
        if (h.origenGuia && hechos.indexOf(h.origenGuia) !== -1) h.estado = 'hecho';
        if (h.clase === 'decision') {
          if (h.origenGuia && elegidos[h.origenGuia]) h.elegida = elegidos[h.origenGuia];
          h.opciones.forEach(function (o) { aplicar(o.hitos); });
        }
      });
    })(lista);
    return lista;
  }

  /* Asunto viejo, botón "Crear los hitos de la guía" (sección 3.2):
     igual que crearDesdeGuia, pero importando lo que ya estaba
     marcado en pasosHechos/pasosElegidos. pasosHechos y pasosElegidos
     se quedan en asuntos.json tal cual: aquí no se tocan. */
  async function crearDesdeGuiaImportando(clave, tipo, pasosHechos, pasosElegidos) {
    var previos = await hitosDe(clave);
    if (previos.length) return previos;
    var pasos = await pasosOMinima(tipo);
    if (!pasos.length) return [];
    var resultado = null;
    var datos = await cambiar(function (d) {
      var lista = listaImportando(pasos, pasosHechos, pasosElegidos);
      resultado = recomputeEnCurso(lista);
      d.porAsunto[clave] = { creados: U.hoyIso(), hitos: lista };
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  /* ==========================================================
     MARCAR UN HITO (pendiente/encurso/hecho/noaplica)
     ========================================================== */

  /* `nota` (opcional, fila 100): una nota que se apunta en el hito en la
     MISMA escritura, en vez de en una segunda que pudiera fallar sola. */
  async function marcar(clave, idHito, nuevoEstado, nota) {
    if (CLASES_ESTADO.indexOf(nuevoEstado) === -1) return hitosDe(clave);
    var resultado = null;
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = buscar(entrada.hitos, idHito);
      if (!h) return d;
      h.estado = nuevoEstado;
      /* Fila 129: el «Esperando a…» se quita al terminar su hito. */
      if ((nuevoEstado === 'hecho' || nuevoEstado === 'noaplica') && Hitos.quitarEspera) Hitos.quitarEspera(h);
      if (nota) h.notas.push({ texto: String(nota), quien: (window.App && App.E.usuario) || '', cuando: U.ahora() });
      if (nuevoEstado === 'encurso') h.desde = U.hoyIso();
      if (nuevoEstado === 'hecho') h.hechoEl = U.hoyIso();
      else delete h.hechoEl;
      if (nuevoEstado === 'hecho') aplicarPlazosDependientes(entrada.hitos, h.id, d.ajustes);
      resultado = recomputeEnCurso(entrada.hitos);
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  /* El resto del modelo —añadir/quitar/reordenar hitos a mano, editar
     sus campos, notas y documentos, los responsables de Ajustes, las
     bifurcaciones y lo que pasa al archivar y al reabrir— vive en
     js/hitos-archivo.js, para no pasar de las 400 líneas aquí (sección
     13 del encargo). Se engancha al mismo objeto Hitos, usando estos
     mismos leer/cambiar/buscar/visibles/recomputeEnCurso. */

  /* ==========================================================
     AL CREAR UN ASUNTO NUEVO (sección 3.1)

     Se envuelve App.anotar en vez de tocar js/asuntos-nuevo.js o
     js/recurrentes.js: los dos crean un asunto llamando a App.anotar
     con 'abiertoEl' y 'tipo', y esa es la única marca fiable de "esto
     acaba de nacer". Si algo falla creando los hitos, el asunto ya
     está creado: no se tumba nada por esto. */
  U.envolver(window.App, 'App.anotar', 'hitos.js', function (comoEra) {
    return async function (clave, datos) {
      var esCreacion = !!(datos && datos.abiertoEl && datos.tipo);
      await comoEra(clave, datos);
      if (esCreacion) {
        try { await crearDesdeGuia(clave, datos.tipo); } catch (e) { /* no crítico */ }
      }
    };
  });

  return {
    FICHERO: FICHERO, RESPONSABLES_DEFECTO: RESPONSABLES_DEFECTO, PAPELES: PAPELES,
    nuevoId: nuevoId, normalizarHito: normalizarHito, normalizarAjustes: normalizarAjustes,
    leer: leer, cambiar: cambiar, hitosDe: hitosDe,
    buscar: buscar, visibles: visibles, huerfanos: huerfanos, cuenta: cuenta,
    faltanObligatorios: faltanObligatorios,
    recomputeEnCurso: recomputeEnCurso, aplicarEstadoDelHito: aplicarEstadoDelHito,
    aplicarPlazosDependientes: aplicarPlazosDependientes, estadoDelAsunto: estadoDelAsunto,
    pasoAHito: pasoAHito, crearDesdeGuia: crearDesdeGuia, listaImportando: listaImportando,
    crearDesdeGuiaImportando: crearDesdeGuiaImportando,
    marcar: marcar, ultimoCambioLocal: ultimoCambioLocal,
    ultimosLeidos: ultimosLeidos, alCambiar: alCambiar, alLeer: alLeer
  };
})();
window.Hitos = Hitos;
