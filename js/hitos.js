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

  function nuevoId() {
    return 'h' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  }

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
        ? { dias: parseInt(h.plazo.dias, 10) || 0, desde: String(h.plazo.desde || '') } : null,
      estadoAsunto: (h && h.estadoAsunto) || null,
      notas: Array.isArray(h && h.notas) ? h.notas.map(normalizarNota) : [],
      documentos: Array.isArray(h && h.documentos) ? h.documentos.map(String) : [],
      requisitos: Array.isArray(h && h.requisitos) ? h.requisitos.map(normalizarRequisitoHito) : [],
      plantilla: (h && h.plantilla) || null,   /* hueco sin uso, sección 9 */
      opciones: [], elegida: null
    };
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
      .map(function (r) { return { id: String((r && r.id) || ''), nombre: String((r && r.nombre) || ''), clase: 'centro' }; })
      .filter(function (r) { return r.id && r.nombre; });
    var noLectivos = (Array.isArray(a && a.noLectivos) ? a.noLectivos : [])
      .map(String).filter(function (f) { return /^\d{4}-\d{2}-\d{2}$/.test(f); }).sort();
    return { responsables: responsables, noLectivos: noLectivos };
  }

  function normalizar(leido) {
    var l = leido || {};
    var porAsunto = {};
    var origen = (l.porAsunto && typeof l.porAsunto === 'object') ? l.porAsunto : {};
    Object.keys(origen).forEach(function (clave) {
      var e = origen[clave] || {};
      porAsunto[clave] = { creados: String(e.creados || ''), hitos: normalizarLista(e.hitos) };
    });
    return { ajustes: normalizarAjustes(l.ajustes), porAsunto: porAsunto };
  }

  function vacio() { return normalizar(null); }

  async function leer() {
    var g = gestor();
    if (!g) return vacio();
    var leido = await Carpetas.leerJson(g, FICHERO);
    return normalizar(leido);
  }

  /* Como todo fichero compartido: se relee justo antes de escribir, y
     todo pasa por Copias.guardar, nunca por Carpetas.guardarJson
     directo (sección 2.2 del encargo). 'hacer' recibe los datos ya
     releídos, los muta a gusto y los devuelve (o no devuelve nada, y
     se guarda igual: ya han quedado mutados). */
  async function cambiar(hacer) {
    var g = gestor();
    if (!g) return vacio();
    var actual = await leer();
    var nuevo = hacer(actual) || actual;
    await Copias.guardar(g, FICHERO, nuevo);
    return nuevo;
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

  function visibles(lista) {
    var out = [];
    for (var i = 0; i < (lista || []).length; i++) {
      var h = lista[i];
      out.push(h);
      if (h.clase === 'decision') {
        if (!h.elegida) return out;   /* se corta aquí: nada más se ve */
        var opt = h.opciones.filter(function (o) { return o.id === h.elegida; })[0];
        if (opt) out = out.concat(visibles(opt.hitos));
      }
    }
    return out;
  }

  /* Los hitos "noaplica" que se quedaron colgando al cambiar de rama
     (tenían notas o documentos, así que no se borraron). Se pintan
     plegados, al final, vengan de la rama que vengan. */
  function huerfanos(lista) {
    var out = [];
    (lista || []).forEach(function (h) {
      if (h.clase !== 'decision') return;
      h.opciones.forEach(function (o) {
        if (o.id !== h.elegida) {
          (o.hitos || []).forEach(function (x) { if (x.estado === 'noaplica') out.push(x); });
        } else {
          out = out.concat(huerfanos(o.hitos));
        }
      });
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
  function faltanObligatorios(hito) {
    return ((hito && hito.requisitos) || []).filter(function (r) { return r.obligatorio && !r.hecho; });
  }

  /* ==========================================================
     EL ESTADO DEL ASUNTO (sección 8 del encargo)

     Cada paso de la guía puede llevar apuntado un estado de
     estados.json. Cuando el hito pasa a "encurso", el asunto pasa
     solo a ese estado. Esta es la ÚNICA función que lo decide: nadie
     más lo deduce por su cuenta, para poder cambiarla sin tocar diez
     sitios si el día de mañana el estado del asunto desaparece y lo
     sustituye el propio hito en curso. */
  function estadoDelAsunto(hito) {
    return (hito && hito.estadoAsunto) || null;
  }

  async function aplicarEstadoDelHito(clave, hito) {
    var estado = estadoDelAsunto(hito);
    if (!estado || !window.App) return;
    try {
      await App.anotar(clave, { situacion: estado, situacionEl: U.ahora(), situacionPor: App.E.usuario });
      if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
    } catch (e) { /* no crítico: el hito ya ha quedado guardado */ }
  }

  /* Las fechas límite calculadas por plazo (sección 7): cuando un hito
     pasa a "hecho", los hitos cuyo plazo cuenta "desde" él (y que
     Francisco no haya tocado a mano) recalculan su fecha, en días
     hábiles según los no lectivos de Ajustes. */
  function aplicarPlazosDependientes(raiz, idHecho, noLectivos) {
    (function recorrer(lista) {
      (lista || []).forEach(function (h) {
        if (h.plazo && h.plazo.desde === idHecho && !h.fechaManual) {
          h.fecha = Plazos.sumarDiasHabiles(U.hoyIso(), h.plazo.dias, noLectivos);
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
      plazo: (p.plazo && p.plazo.dias) ? { dias: p.plazo.dias, desde: p.plazo.desde || '' } : null,
      /* Una pregunta no lleva requisitos propios (fila 59, sección 4.1
         del encargo: el editor no se los deja poner); los de sus
         opciones llegan solos, porque cada paso de dentro se convierte
         en su propio hito, con los suyos. */
      requisitos: esDecision ? [] : (p.requisitos || []),
      opciones: esDecision ? p.opciones.map(function (o) {
        return { id: o.id, texto: o.titulo, hitos: (o.pasos || []).map(pasoAHito) };
      }) : [],
      elegida: null
    });
  }

  /* Asunto nuevo (sección 3.1): los hitos se crean de golpe al abrirlo,
     y el primero queda en curso. No hace nada si el asunto ya tiene
     hitos (para no crearlos dos veces si esto se llama más de una
     vez). Si el tipo no tiene guía, se queda sin hitos: el botón para
     añadirlos a mano lo pone js/hitos-panel.js. */
  async function crearDesdeGuia(clave, tipo) {
    var previos = await hitosDe(clave);
    if (previos.length) return previos;
    var pasos = (window.GuiasDelCentro && window.GuiasDelCentro.pasosDe(tipo)) || [];
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

  /* Asunto viejo, botón "Crear los hitos de la guía" (sección 3.2):
     igual que crearDesdeGuia, pero importando lo que ya estaba
     marcado en pasosHechos/pasosElegidos. pasosHechos y pasosElegidos
     se quedan en asuntos.json tal cual: aquí no se tocan. */
  async function crearDesdeGuiaImportando(clave, tipo, pasosHechos, pasosElegidos) {
    var previos = await hitosDe(clave);
    if (previos.length) return previos;
    var pasos = (window.GuiasDelCentro && window.GuiasDelCentro.pasosDe(tipo)) || [];
    if (!pasos.length) return [];
    var hechos = pasosHechos || [];
    var elegidos = pasosElegidos || {};
    var resultado = null;
    var datos = await cambiar(function (d) {
      var lista = pasos.map(pasoAHito);
      (function aplicar(l) {
        (l || []).forEach(function (h) {
          if (h.origenGuia && hechos.indexOf(h.origenGuia) !== -1) h.estado = 'hecho';
          if (h.clase === 'decision') {
            if (h.origenGuia && elegidos[h.origenGuia]) h.elegida = elegidos[h.origenGuia];
            h.opciones.forEach(function (o) { aplicar(o.hitos); });
          }
        });
      })(lista);
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

  async function marcar(clave, idHito, nuevoEstado) {
    if (CLASES_ESTADO.indexOf(nuevoEstado) === -1) return hitosDe(clave);
    var resultado = null;
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = buscar(entrada.hitos, idHito);
      if (!h) return d;
      h.estado = nuevoEstado;
      if (nuevoEstado === 'encurso') h.desde = U.hoyIso();
      if (nuevoEstado === 'hecho') aplicarPlazosDependientes(entrada.hitos, h.id, d.ajustes.noLectivos);
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
  (function envolverCreacion() {
    if (typeof App === 'undefined' || typeof App.anotar !== 'function') return;
    var comoEra = App.anotar;
    App.anotar = async function (clave, datos) {
      var esCreacion = !!(datos && datos.abiertoEl && datos.tipo);
      await comoEra(clave, datos);
      if (esCreacion) {
        try { await crearDesdeGuia(clave, datos.tipo); } catch (e) { /* no crítico */ }
      }
    };
  })();

  return {
    FICHERO: FICHERO, RESPONSABLES_DEFECTO: RESPONSABLES_DEFECTO, PAPELES: PAPELES,
    nuevoId: nuevoId, normalizarHito: normalizarHito, normalizarAjustes: normalizarAjustes,
    leer: leer, cambiar: cambiar, hitosDe: hitosDe,
    buscar: buscar, visibles: visibles, huerfanos: huerfanos, cuenta: cuenta,
    faltanObligatorios: faltanObligatorios,
    recomputeEnCurso: recomputeEnCurso, aplicarEstadoDelHito: aplicarEstadoDelHito,
    aplicarPlazosDependientes: aplicarPlazosDependientes, estadoDelAsunto: estadoDelAsunto,
    pasoAHito: pasoAHito, crearDesdeGuia: crearDesdeGuia,
    crearDesdeGuiaImportando: crearDesdeGuiaImportando,
    marcar: marcar
  };
})();
window.Hitos = Hitos;
