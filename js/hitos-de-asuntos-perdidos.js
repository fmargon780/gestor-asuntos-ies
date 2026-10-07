/* ============================================================
   hitos-de-asuntos-perdidos.js — «Son de este asunto…» (fila 292,
   docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartado 1).

   En la tarjeta «Hay hitos guardados de N asuntos que ya no existen con ese
   nombre» de Ajustes → Problemas, cada nombre viejo deja elegir el asunto al
   que pertenecen sus hitos:

     1. un cuadro con el buscador de asuntos de siempre (js/elegir-asunto.js),
        con el que más se parece ya propuesto («Parece este:»; js/parecido-de-carpetas.js)
        y, debajo, lo que se va a mover;
     2. la confirmación: «Pasar los hitos», o, si el asunto ya tiene hitos,
        «Unir los hitos» (los del mismo título cuentan como uno);
     3. el aviso verde con «Deshacer».

   Todo por `AsuntoRenombrar` (js/asunto-renombrar.js) y la cola de guardado:
   nunca se escribe hitos.json a mano.
   ============================================================ */
var HitosDeAsuntosPerdidos = (function () {

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* Cuántos hitos hay bajo un nombre, cuántos hechos y los tres primeros títulos. */
  function resumen(entrada) {
    var lista = (entrada && entrada.hitos) || [];
    return {
      n: lista.length,
      hechos: lista.filter(function (h) { return h.estado === 'hecho'; }).length,
      titulos: lista.slice(0, 3).map(function (h) { return h.titulo || 'Sin título'; })
    };
  }

  function textoDeLoQueSeMueve(r) {
    return '<p class="explica"><strong>' + plural(r.n, 'hito', 'hitos') + ', ' +
      (r.hechos === 1 ? '1 hecho' : r.hechos + ' hechos') + '</strong>' +
      (r.titulos.length ? ': ' + r.titulos.map(function (t) { return U.escapar(t); }).join(', ') + (r.n > r.titulos.length ? '…' : '') : '') + '.</p>';
  }

  /* Los asuntos abiertos, para proponer. */
  function candidatos() {
    var fichas = (App.E.registro && App.E.registro.asuntos) || {};
    return (App.E.listaAbiertos || []).filter(function (a) { return fichas[a.nombre]; })
      .map(function (a) { return { nombre: a.nombre, ficha: fichas[a.nombre] }; });
  }

  async function elegir(clave) {
    var datos = await Hitos.leer();
    var quedan = resumen(datos.porAsunto[clave]);
    if (!quedan.n) { U.aviso('Esos hitos ya no están.', 'ambar'); if (window.Problemas) await Problemas.recalcular('hitos'); return; }

    var propuesto = window.ParecidoDeCarpetas ? ParecidoDeCarpetas.mejor(clave, candidatos(), App.E.tipos) : null;
    var elegido = await ElegirAsunto.elegir({
      titulo: 'Son de este asunto',
      cabecera: '<p class="explica">Los hitos guardados de <strong>' + U.escapar(clave) + '</strong> pasan al asunto que elijas.</p>',
      rotuloSugeridos: 'Parece este:',
      sugeridos: propuesto ? [{ nombre: propuesto.candidato.nombre, ficha: propuesto.candidato.ficha, puntos: propuesto.puntos }] : [],
      pie: '<div class="enlace-bloque"><div class="etiqueta">Lo que se va a mover</div>' + textoDeLoQueSeMueve(quedan) + '</div>'
    });
    if (!elegido) return;

    var actuales = await Hitos.leer();
    var yaTiene = resumen(actuales.porAsunto[elegido.nombre]);
    var une = yaTiene.n > 0;
    var ok = await U.preguntar(une ? 'Unir los hitos' : 'Pasar los hitos',
      '<p>De <strong>' + U.escapar(clave) + '</strong> a <strong>' + U.escapar(elegido.nombre) + '</strong>.</p>' +
      textoDeLoQueSeMueve(quedan) +
      (une
        ? '<p class="nota">Este asunto ya tiene ' + plural(yaTiene.n, 'hito', 'hitos') + '. Se unen: los que tengan el mismo título cuentan ' +
          'como uno, y se queda con lo hecho en cualquiera de los dos.</p>'
        : '<p class="nota">El asunto no tiene hitos: los recibe tal cual.</p>'),
      une ? 'Unir los hitos' : 'Pasar los hitos');
    if (!ok) return;

    var antes;
    try { antes = await AsuntoRenombrar.pasarHitos(clave, elegido.nombre); }
    catch (e) { U.aviso('No he podido pasar los hitos: ' + U.mensajeDeError(e), 'malo'); return; }
    U.aviso('Hitos pasados a ' + elegido.nombre + '.', 'bueno', {
      boton: 'Deshacer',
      alPulsar: async function () {
        try {
          await AsuntoRenombrar.deshacerPasarHitos(clave, elegido.nombre, antes);
          U.aviso('Hitos devueltos a donde estaban.', 'bueno');
        } catch (e) { U.aviso('No he podido deshacerlo: ' + U.mensajeDeError(e), 'malo'); }
        if (window.Problemas) await Problemas.recalcular('hitos');
      }
    });
    if (window.Problemas) await Problemas.recalcular('hitos');
  }

  return { elegir: elegir, resumen: resumen, candidatos: candidatos };
})();
window.HitosDeAsuntosPerdidos = HitosDeAsuntosPerdidos;
