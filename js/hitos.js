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
  var I = window.HitosNucleo;
  var FICHERO = I.FICHERO;
  var CLASES_ESTADO = I.CLASES_ESTADO;
  var RESPONSABLES_DEFECTO = I.RESPONSABLES_DEFECTO;
  var PAPELES = I.PAPELES;
  function nuevoId() { return I.nuevoId.apply(this, arguments); }
  function normalizarHito() { return I.normalizarHito.apply(this, arguments); }
  function normalizarAjustes() { return I.normalizarAjustes.apply(this, arguments); }
  function leer() { return I.leer.apply(this, arguments); }
  function cambiar() { return I.cambiar.apply(this, arguments); }
  function ultimoCambioLocal() { return I.ultimoCambioLocal.apply(this, arguments); }
  function ultimosLeidos() { return I.ultimosLeidos.apply(this, arguments); }
  var alCambiar = I.alCambiar;
  var alLeer = I.alLeer;
  function hitosDe() { return I.hitosDe.apply(this, arguments); }
  function notasPropias() { return I.notasPropias.apply(this, arguments); }
  function buscar() { return I.buscar.apply(this, arguments); }
  function visibles() { return I.visibles.apply(this, arguments); }
  function huerfanos() { return I.huerfanos.apply(this, arguments); }
  function recomputeEnCurso() { return I.recomputeEnCurso.apply(this, arguments); }
  function cuenta() { return I.cuenta.apply(this, arguments); }
  function faltanObligatorios() { return I.faltanObligatorios.apply(this, arguments); }
  function estadoDelAsunto() { return I.estadoDelAsunto.apply(this, arguments); }
  function aplicarEstadoDelHito() { return I.aplicarEstadoDelHito.apply(this, arguments); }
  function aplicarPlazosDependientes() { return I.aplicarPlazosDependientes.apply(this, arguments); }
  function pasoAHito() { return I.pasoAHito.apply(this, arguments); }

  async function pasosOMinima(tipo) {
    var pasos = (window.GuiasDelCentro && (await window.GuiasDelCentro.ponerAlDia(), window.GuiasDelCentro.pasosDe(tipo))) || [];   /* fila 273: la guardada, no la de al arrancar */
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
      entrada.actividadEl = U.ahora();   /* fila 451: marcar o desmarcar es actividad (el asunto deja de estar dormido) */
      /* Fila 129: el «Esperando a…» se quita al terminar su hito. */
      if ((nuevoEstado === 'hecho' || nuevoEstado === 'noaplica') && Hitos.quitarEspera) Hitos.quitarEspera(h);
      if (nota) h.notas.push({ texto: String(nota), quien: (window.App && App.E.usuario) || '', cuando: U.ahora() });
      if (nuevoEstado === 'encurso') h.desde = U.hoyIso();
      if (nuevoEstado === 'hecho') h.hechoEl = U.hoyIso();
      else delete h.hechoEl;
      if (nuevoEstado === 'hecho') {
        aplicarPlazosDependientes(entrada.hitos, h.id, d.ajustes, window.FechaDeRegistroPlazos ? function (id) {
          return FechaDeRegistroPlazos.fechaDelHito(clave, buscar(entrada.hitos, id));   /* fila 573 */
        } : null);
      }
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
    faltanObligatorios: faltanObligatorios, notasPropias: notasPropias,
    recomputeEnCurso: recomputeEnCurso, aplicarEstadoDelHito: aplicarEstadoDelHito,
    aplicarPlazosDependientes: aplicarPlazosDependientes, estadoDelAsunto: estadoDelAsunto,
    pasoAHito: pasoAHito, crearDesdeGuia: crearDesdeGuia, listaImportando: listaImportando,
    crearDesdeGuiaImportando: crearDesdeGuiaImportando,
    marcar: marcar, ultimoCambioLocal: ultimoCambioLocal,
    ultimosLeidos: ultimosLeidos, alCambiar: alCambiar, alLeer: alLeer
  };
})();
window.Hitos = Hitos;
