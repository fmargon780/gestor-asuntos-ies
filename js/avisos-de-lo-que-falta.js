/* ============================================================
   avisos-de-lo-que-falta.js — lo que falta por firmar o registrar (fila 524,
   5-nov-2026, docs/524-AVISOS-DE-LO-QUE-FALTA.md; tema 516).

   Avisa, nunca impide. Una sola función dice qué falta, con tres alcances:
     - 'hito':   las tareas del hito y sus documentos (al marcar el hito como hecho);
     - 'asunto': las de todos los hitos y los documentos pendientes de registro del
                 asunto (al archivar);
     - 'docs':   solo lo que cuelga de unos documentos (los adjuntos de un correo).
   Qué cuenta: tareas de firmar o registrar sin hacer (ni «No aplica»), y los
   documentos con la casilla «Pendiente de registro» que aún no llevan registro.
   «Comunicar», «Generar» o una tarea sin acción no cuentan.

   También decide la marca «Sin registrar» de la mesa y de la ficha: solo en los
   documentos con la casilla y en los que cuelgan de una tarea de registrar sin hacer.

   Los cuadros usan U.preguntar (un solo cuadro a la vez). Lo llaman
   js/hitos-panel-lista.js (marcar), js/asuntos-archivar.js (archivar) y
   js/correo-cuadro.js (enviar).
   ============================================================ */
window.AvisosFalta = (function () {

  var CLASE = { firmar: 'Firmar', registrar: 'Registrar' };

  function mismo(a, b) {
    return window.TareasConDocumento ? TareasConDocumento.mismo(a, b) : (!!a && a === b);
  }

  function abierta(g) { return !!g && !g.pregunta && !g.hecho && !g.noaplica && !!CLASE[g.accion]; }

  /* ¿Este documento ya lleva el registro en el nombre? */
  function registrado(a, nombre) {
    if (window.HitoMesaDocumentos && HitoMesaDocumentos.codigoDe) return !!HitoMesaDocumentos.codigoDe(nombre);
    return !!(window.Registro && Registro.tieneRegistro(nombre, a));
  }

  function pendiente(a, nombre) { return !!(window.Registro && Registro.pendiente(a, nombre)); }

  function lineasDe(a, h) {
    try { return window.Hitos ? Hitos.guionDe(a, h) : []; } catch (e) { return []; }
  }

  /* Las tareas abiertas de firmar o registrar de un hito: [{ paso, doc }] (doc '' si no tiene). */
  function tareasDe(a, h) {
    return lineasDe(a, h).filter(abierta).map(function (g) {
      var e = window.TareasConDocumento ? TareasConDocumento.de(h, g.id) : null;
      return { paso: g, doc: (e && e.doc) || '' };
    });
  }

  /* ¿Cuelga el documento de una tarea de registrar sin hacer, en alguno de esos hitos? */
  function cuelgaDeRegistrar(a, hitos, nombre) {
    return (hitos || []).some(function (h) {
      return tareasDe(a, h).some(function (t) { return t.paso.accion === 'registrar' && t.doc && mismo(t.doc, nombre); });
    });
  }

  /* La marca «Sin registrar» de un documento (mesa y ficha). */
  function sinRegistrar(a, hitos, nombre) {
    if (registrado(a, nombre)) return false;
    return pendiente(a, nombre) || cuelgaDeRegistrar(a, hitos, nombre);
  }

  /* «Firmar: <doc> (falta 1 de 2 firmas)». Solo cuando hacen falta varias. */
  function faltanFirmas(a, g, doc) {
    var necesarias = window.GuiasGuion && GuiasGuion.firmasNecesarias ? GuiasGuion.firmasNecesarias(g) : 1;
    if (g.accion !== 'firmar' || necesarias < 2) return '';
    var datos = doc && window.DocumentosDatos && a && a.ficha ? DocumentosDatos.deFichero(a.ficha, doc) : null;
    var hay = datos ? Number(datos.firmas) || 0 : 0;
    var faltan = Math.max(necesarias - hay, 0);
    if (!faltan) return '';
    return ' (' + (faltan === 1 ? 'falta 1' : 'faltan ' + faltan) + ' de ' + necesarias + ' firmas)';
  }

  function nombresDeHito(h) {
    var lista = (h.documentos || []).slice();
    var m = h.guionDocumento || {};
    Object.keys(m).forEach(function (id) { if (m[id] && m[id].doc && lista.indexOf(m[id].doc) === -1) lista.push(m[id].doc); });
    return lista;
  }

  /* Pura. `hitos`: los del asunto. `alcance`: { tipo: 'hito', hito } | { tipo: 'asunto' } | { tipo: 'docs', docs: [...] }.
     Devuelve las líneas, en este orden: las tareas (en el orden del hito) y después los documentos con la casilla. */
  function queFalta(a, hitos, alcance) {
    var salida = [];
    var vistos = [];
    var tipo = (alcance && alcance.tipo) || 'asunto';
    var enAlcance = tipo === 'hito' ? [alcance.hito] : (window.Hitos ? Hitos.visibles(hitos || []) : (hitos || []));
    var solo = tipo === 'docs' ? (alcance.docs || []) : null;
    function estaEnLosDocs(doc) { return !!doc && solo.some(function (n) { return mismo(n, doc); }); }

    enAlcance.forEach(function (h) {
      tareasDe(a, h).forEach(function (t) {
        if (solo && !estaEnLosDocs(t.doc)) return;
        if (t.doc) {
          salida.push(CLASE[t.paso.accion] + ': ' + t.doc + faltanFirmas(a, t.paso, t.doc));
          if (t.paso.accion === 'registrar') vistos.push(t.doc);
        } else salida.push((t.paso.texto || CLASE[t.paso.accion]) + ' (sin documento)');
      });
    });

    var candidatos = [];
    if (tipo === 'docs') candidatos = solo.slice();
    else {
      enAlcance.forEach(function (h) { candidatos = candidatos.concat(nombresDeHito(h)); });
      if (tipo === 'asunto') candidatos = candidatos.concat((a && a.ficha && a.ficha.pendientesRegistro) || []);
    }
    var yaEsta = [];
    candidatos.forEach(function (n) {
      if (yaEsta.some(function (x) { return mismo(x, n); })) return;
      yaEsta.push(n);
      if (vistos.some(function (v) { return mismo(v, n); })) return;
      if (pendiente(a, n) && !registrado(a, n)) salida.push('Registrar: ' + n);
    });
    return salida;
  }

  function listaHtml(lineas) {
    return '<ul class="falta-lista">' + lineas.map(function (l) { return '<li>' + U.escapar(l) + '</li>'; }).join('') + '</ul>';
  }

  /* El cuadro. Devuelve true si se sigue (no faltaba nada, o «igualmente»). Nunca impide. */
  async function preguntar(titulo, lineas, botonSeguir) {
    if (!lineas || !lineas.length) return true;
    return U.preguntar(titulo, listaHtml(lineas), botonSeguir, false, 'Volver');   /* como la pantalla 516: título, lista y dos botones */
  }

  async function hitosDe(a) {
    try { return window.Hitos ? await Hitos.hitosDe(a.nombre) : []; } catch (e) { return []; }
  }

  /* Al marcar el hito como hecho. */
  async function alMarcarHito(a, h) {
    return preguntar('Falta por hacer en este hito', queFalta(a, [h], { tipo: 'hito', hito: h }), 'Marcar como hecho igualmente');
  }

  /* Al archivar el asunto. Devuelve { sigue, hayAviso }: si hubo cuadro, no se pregunta otro seguido. */
  async function alArchivar(a) {
    var l = queFalta(a, await hitosDe(a), { tipo: 'asunto' });
    if (!l.length) return { sigue: true, hayAviso: false };
    return { sigue: await preguntar('Falta por hacer en este asunto', l, 'Archivar igualmente'), hayAviso: true };
  }

  /* Al enviar un correo: lo que falta de los documentos adjuntos (para el cuadro de correo, que ya es un cuadro). */
  async function deLosAdjuntos(a, docs) {
    if (!docs || !docs.length) return [];
    return queFalta(a, await hitosDe(a), { tipo: 'docs', docs: docs });
  }

  return { queFalta: queFalta, sinRegistrar: sinRegistrar, cuelgaDeRegistrar: cuelgaDeRegistrar, preguntar: preguntar, listaHtml: listaHtml,
           alMarcarHito: alMarcarHito, alArchivar: alArchivar, deLosAdjuntos: deLosAdjuntos };
})();
