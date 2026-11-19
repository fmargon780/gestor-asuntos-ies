/* ============================================================
   asunto-sin-hitos-guia.js — la guía de un tipo «sin hitos» llega al asunto
   (18-nov-2026, fila 701, docs/701-GUIA-COMO-LISTA-DE-TAREAS.md).

   La guía de un tipo «sin hitos» es una lista de frases: un solo paso de `guias.json` con
   `listaDeTareas: true` y las frases en su `guion` (cada una puede llevar `soloSi`, js/solo-si.js).

   Al nacer, el asunto recibe una COPIA de esas tareas en el hito oculto donde vive su lista
   (`guionPropio`, con `deGuia: true`: salen sin la marca «solo aquí» y conservan su «Solo si»).
   Como son una copia, cambiar o borrar una frase en la guía no toca los asuntos abiertos; añadir una
   frase sí las lleva a todos (regla del 6-nov-2026, «añadir no es cambiar»). `tareasConocidas`
   apunta las frases de la guía que ya han llegado al asunto: una que se borró en el asunto no vuelve.
   ============================================================ */
var AsuntoSinHitosGuia = (function () {

  function pasoLista(pasos) { return (pasos || []).filter(function (p) { return p && p.listaDeTareas; })[0] || null; }

  /* Las líneas de la guía en su orden, rótulos incluidos (fila 706). */
  function lineasDe(pasos) {
    var p = pasoLista(pasos);
    return p ? (p.guion || []).filter(function (g) { return g && !g.pregunta && g.texto; }) : [];
  }

  /* Las tareas de la guía, en su orden. Fila 706: cada una lleva `grupo`, el texto del último rótulo que tiene encima
     (sin rótulo, nada); los rótulos no son tareas y no salen aquí. */
  function tareasDe(pasos) {
    var grupo = '';
    var salida = [];
    lineasDe(pasos).forEach(function (g) {
      if (g.rotulo) { grupo = g.texto; return; }
      salida.push(grupo ? Object.assign({}, g, { grupo: grupo }) : g);
    });
    return salida;
  }

  /* Las tareas de la guía de un tipo, ya puesta al día con el disco. */
  async function deLaGuia(tipo) {
    if (!window.GuiasDelCentro) return [];
    try { await GuiasDelCentro.ponerAlDia(); } catch (e) { /* se sigue con la que hay */ }
    return tareasDe(GuiasDelCentro.pasosDe(tipo));
  }

  function copia(g) {
    var c = { id: U.nuevoId('gp'), texto: g.texto, deGuia: true, origenGuia: g.id };
    if (g.soloSi) c.soloSi = JSON.parse(JSON.stringify(g.soloSi));
    if (g.papel) c.papel = g.papel;   /* fila 703: la tarea de papel de la guía */
    if (g.grupo) c.grupo = g.grupo;   /* fila 706: el rótulo bajo el que va */
    return c;
  }

  /* Pone en el hito oculto `h` las tareas de la guía que no le habían llegado. Devuelve cuántas. */
  function darTareas(h, tareas) {
    var conocidas = h.tareasConocidas || [];
    var n = 0;
    (tareas || []).forEach(function (g) {
      if (conocidas.indexOf(g.id) !== -1) return;
      conocidas = conocidas.concat([g.id]);
      h.guionPropio = (h.guionPropio || []).concat([copia(g)]);
      n++;
    });
    h.tareasConocidas = conocidas;
    return n;
  }

  function tipoDeAsunto(a) {
    if (window.App && typeof App.tipoDeAsunto === 'function') { try { return App.tipoDeAsunto(a); } catch (e) { /* se prueba la ficha */ } }
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  /* Al guardar la guía: las tareas nuevas llegan a los asuntos abiertos de ese tipo que son una lista de tareas.
     Devuelve a cuántos asuntos ha llegado algo. */
  async function llevar(tipo, pasos) {
    var tareas = tareasDe(pasos);
    if (!tareas.length || !tipo || !window.Gestor || typeof Gestor.asuntos !== 'function' || !window.AsuntoSinHitos) return 0;
    var claves = Gestor.asuntos().filter(function (a) { return tipoDeAsunto(a) === tipo; }).map(function (a) { return a.nombre; });
    if (!claves.length) return 0;
    var llegados = 0;
    await Hitos.cambiar(function (d) {
      llegados = 0;
      claves.forEach(function (clave) {
        var e = d.porAsunto[clave];
        var h = e && AsuntoSinHitos.hitoDe(e.hitos);
        if (h && darTareas(h, tareas)) llegados++;
      });
      return d;
    });
    return llegados;
  }

  /* Después de guardar la guía de un tipo «sin hitos»: reparte las tareas nuevas y devuelve la frase verde de después. */
  /* Lo que se enseña de la guía de un tipo: en uno «sin hitos», solo la lista de tareas (los hitos de antes se quedan sin usar). */
  function pasosVisibles(tipo, pasos) {
    var lista = esLista(tipo);
    return (pasos || []).filter(function (p) { return p && !!p.listaDeTareas === lista; });
  }

  /* Al guardar la guía de un tipo con hitos: la lista de tareas guardada (de cuando tuvo la casilla «Sin hitos») no se pierde. */
  function conservarLista(tipo, nuevos, antes) {
    if (esLista(tipo) || pasoLista(nuevos)) return nuevos;
    var p = pasoLista(antes);
    return p ? (nuevos || []).concat([p]) : nuevos;
  }

  function esLista(tipo) { return !!(window.AsuntoSinHitos && window.GuiaSinHitos && AsuntoSinHitos.tipoSinHitos(tipo)); }

  async function alGuardar(tipo, pasos) {
    if (!esLista(tipo)) return '';
    var llegadas = 0;
    try { llegadas = await llevar(tipo, pasos); }
    catch (e) { U.accesorio('Guía guardada, pero no he podido llevar las tareas nuevas a los asuntos abiertos', e); }
    var n = tareasDe(pasos).length;
    if (!n) return tipo + ' se queda sin tareas en la guía.';
    return 'Guía de ' + tipo + ' guardada: ' + (n === 1 ? '1 tarea.' : n + ' tareas.') +
      (llegadas ? ' Las tareas nuevas han llegado a ' + (llegadas === 1 ? '1 asunto abierto.' : llegadas + ' asuntos abiertos.') : '');
  }

  /* La red de seguridad al abrir la ficha (Hitos.completarAsuntoConGuia): solo escribe si de verdad falta algo. */
  async function completar(clave, entradaLeida, pasos) {
    var h = window.AsuntoSinHitos && AsuntoSinHitos.hitoDe(entradaLeida && entradaLeida.hitos);
    var tareas = tareasDe(pasos);
    if (!h || !tareas.length) return null;
    var conocidas = h.tareasConocidas || [];
    if (tareas.every(function (g) { return conocidas.indexOf(g.id) !== -1; })) return null;
    var nuevas = 0;
    var datos = await Hitos.cambiar(function (d) {
      var e = d.porAsunto[clave];
      var hh = e && AsuntoSinHitos.hitoDe(e.hitos);
      nuevas = hh ? darTareas(hh, tareas) : 0;
      return d;
    });
    if (!nuevas) return null;
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : null;
  }

  /* Ajustes › Guía de un tipo «sin hitos»: «N tareas» y las frases en su orden, con su «Solo si». */
  function vistaHTML(pasos) {
    var tareas = tareasDe(pasos);
    if (!tareas.length) return '<div class="vacio">Todavía no hay tareas en la guía de este tipo.</div>';
    return '<p class="suave gsh-cuenta">' + (tareas.length === 1 ? '1 tarea' : tareas.length + ' tareas') + '</p>' +
      '<ol class="gsh-vista">' + lineasDe(pasos).map(function (g) {
        if (g.rotulo) return '<li class="gsh-vista-rotulo"><b>' + U.escapar(g.texto) + '</b></li>';   /* fila 706 */
        var cuando = window.SoloSi && g.soloSi ? SoloSi.etiqueta(g.soloSi) : '';
        return '<li>' + U.escapar(g.texto) + (cuando ? ' <span class="suave">· ' + U.escapar(cuando) + '</span>' : '') + '</li>';
      }).join('') + '</ol>';
  }

  return { conservarLista: conservarLista, vistaHTML: vistaHTML, pasoLista: pasoLista, tareasDe: tareasDe, lineasDe: lineasDe, deLaGuia: deLaGuia, darTareas: darTareas, llevar: llevar, alGuardar: alGuardar, esLista: esLista, pasosVisibles: pasosVisibles, completar: completar };
})();
window.AsuntoSinHitosGuia = AsuntoSinHitosGuia;
