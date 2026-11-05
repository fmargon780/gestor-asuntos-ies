/* ============================================================
   hitos-desde-el-asunto-puras.js — las funciones puras: hitos de nivel superior, si un hito está vacío, dónde colocar uno nuevo (fila 535: trozo de js/hitos-desde-el-asunto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/hitos-desde-el-asunto.js.
   ============================================================ */
(function () {

  var I = window.HitosDesdeElAsuntoNucleo = window.HitosDesdeElAsuntoNucleo || {};
  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     FUNCIONES PURAS
     ========================================================== */

  /* Los hitos de nivel superior de un asunto, en su orden, sin los del
     tipo anterior (fila 94: esos ya no son "de este asunto" de verdad).
     Nunca baja a las opciones de un hito-pregunta: ver la nota de
     arriba sobre la simplificación de esta fila. */
  function nivelSuperior(hitos) {
    return (hitos || []).filter(function (h) { return h && !h.delTipoAnterior; });
  }

  /* Sin trabajo apuntado: distinto de hecho, sin ninguna línea del guion
     marcada ni con valor, sin tareas propias, sin notas (las del hito y
     las del asunto con su etiqueta), sin documentos, sin rama elegida y
     sin una fecha puesta a mano. "En curso" solo no cuenta como trabajo
     (mismo criterio que `HitosCambioDeTipo.tieneAlgo`, en negativo). Es
     lo que decide si un hito se puede BORRAR; lo que decide si la guía
     lo puede tocar es `estaVacio`, más estricta (fila 416). */
  function sinTrabajo(h, aOClave) {
    if (!h) return true;
    if (h.estado === 'hecho') return false;
    if (h.fechaManual) return false;
    if (h.clase === 'decision' && h.elegida) return false;
    var guionHecho = h.guionHecho || {};
    var algunoMarcado = Object.keys(guionHecho).some(function (id) {
      var g = guionHecho[id];
      return g && (g.hecho || g.valor);
    });
    if (algunoMarcado) return false;
    if (h.guionPropio && h.guionPropio.length) return false;
    if (Hitos.notasPropias(h).length) return false;
    if (h.documentos && h.documentos.length) return false;
    var clave = (aOClave && aOClave.nombre) ? aOClave.nombre : aOClave;
    var conNotas = (clave && window.NotasHito) ? NotasHito.idsConNotas(clave) : {};
    if (conNotas[h.id]) return false;
    if (h.clase === 'decision') {
      var dentro = (h.opciones || []).some(function (o) {
        return (o.hitos || []).some(function (x) { return !sinTrabajo(x, aOClave); });
      });
      if (dentro) return false;
    }
    return true;
  }

  /* Un hito está «sin empezar» (vacío) si no tiene trabajo (`sinTrabajo`)
     y nadie ha decidido nada solo para ese asunto (fila 416,
     docs/HITOS-UN-SOLO-SITIO.md): responsable, plazo, título o
     explicación cambiados aquí (`cambioAqui`, que escribe
     `Hitos.guardarCampos`), «Dejarlo solo informativo» / «Pedírmelo a
     mí» (también `cambioAqui`), «Recibe varios documentos» cambiado aquí
     (`variosPropio`), tareas de la guía escondidas aquí (`guionOcultos`)
     o preguntas del guion cambiadas aquí (`guionTextos`). Una sola
     función para todo: la guía solo toca lo que está vacío. */
  function estaVacio(h, aOClave) {
    if (!h) return true;
    if (!sinTrabajo(h, aOClave)) return false;
    if (h.cambioAqui || h.variosPropio) return false;
    if (h.guionOcultos && h.guionOcultos.length) return false;
    if (h.guionTextos && Object.keys(h.guionTextos).length) return false;
    if ((h.requisitos || []).some(function (r) { return r.hecho || r.valor || r.documento; })) return false;
    if (h.clase === 'decision') {
      var dentro = (h.opciones || []).some(function (o) {
        return (o.hitos || []).some(function (x) { return !estaVacio(x, aOClave); });
      });
      if (dentro) return false;
    }
    return true;
  }

  /* Mueve (o inserta, si `nuevo` no está ya en la lista) un elemento
     detrás de `idAncla` (vacío = al principio). Trabaja sobre
     cualquier lista de nivel superior, con `.id`: hitos o pasos. */
  function colocarTrasAncla(lista, elemento, idAncla) {
    var i = lista.indexOf(elemento);
    if (i !== -1) lista.splice(i, 1);
    var destino = 0;
    if (idAncla) {
      for (var j = 0; j < lista.length; j++) {
        if (lista[j] && lista[j].id === idAncla && !lista[j].delTipoAnterior) { destino = j + 1; break; }
      }
    }
    lista.splice(destino, 0, elemento);
  }

  /* El paso de la guía "de origen" para "Colocar después de" el hito
     `idHitoAncla`: si ese hito viene de la guía, su propio
     `origenGuia`; si es propio, el del hito anterior en el nivel
     superior que sí venga de la guía; si no hay ninguno, ''
     ("al principio"). '' si `idHitoAncla` está vacío o no se
     encuentra. */
  function pasoAnclaDeHito(nivel, idHitoAncla) {
    if (!idHitoAncla) return '';
    for (var i = 0; i < nivel.length; i++) {
      if (nivel[i].id !== idHitoAncla) continue;
      for (var k = i; k >= 0; k--) {
        if (nivel[k].origenGuia) return nivel[k].origenGuia;
      }
      return '';
    }
    return '';
  }

  I.$ = $;
  I.nivelSuperior = nivelSuperior;
  I.sinTrabajo = sinTrabajo;
  I.estaVacio = estaVacio;
  I.colocarTrasAncla = colocarTrasAncla;
  I.pasoAnclaDeHito = pasoAnclaDeHito;
})();
