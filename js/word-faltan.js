/* ============================================================
   word-faltan.js — «Faltan datos para este documento», ANTES de
   guardar el Word (25-sep-2026, fila 155, docs/WORD-DENTRO-DE-LA-APP.md,
   parte A).

   `generarDocumento` (js/plantillas-documento.js) rellena la plantilla
   en memoria; si quedan huecos sin dato, pregunta aquí antes de guardar
   nada. Una línea por hueco, con su recuadro, y tres botones:

     - «Generar»: con lo escrito (lo vacío se queda como hoy).
     - «Generar igualmente»: sin escribir nada.
     - «Cancelar»: no se guarda nada.

   Devuelve una promesa con { accion: 'generar' | 'igual' | 'cancelar',
   aMano: { <hueco>: <valor> } }. Fila 530 (docs/530-DATOS-EN-EL-ASUNTO.md,
   punto 5): con `opciones.asunto`, lo escrito se GUARDA en el asunto
   (js/datos-del-asunto.js) antes de volver: un solo valor de cada dato
   por asunto, que ninguna otra plantilla vuelve a pedir y que sale en
   «Campos del asunto». `aMano` es lo que se acaba de escribir, para que
   quien llama rellene ya el documento sin volver a leer el asunto; ya no
   vale «solo para este documento». Lo que no se pueda guardar (un importe
   que no se entiende, un {hecho:…}) sale en ámbar y se usa igualmente en
   este documento. Sin `opciones.asunto`, como antes. Usa el cuadro de
   siempre (`U.preguntar`, `#capa`).
   ============================================================ */
var WordFaltan = (function () {

  /* «NOMBRE DEL PADRE» → «Nombre del padre»; «nombreNatural» → «Nombre natural». */
  function legible(hueco) {
    var t = String(hueco || '').replace(/^campo\s*:\s*/i, '').replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2').trim();
    if (t === t.toUpperCase()) t = t.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /* Guarda lo escrito en el asunto (accesorio: si algo falla, ámbar, y el documento sigue con lo escrito). */
  async function guardarEnElAsunto(asunto, aMano) {
    var nombres = Object.keys(aMano).filter(function (n) { return !/^hecho\s*:/i.test(n); });
    for (var i = 0; i < nombres.length; i++) {
      var opciones = window.TextoCondicional ? TextoCondicional.opcionesDeFalta(nombres[i]) : null;
      try {
        var r = await DatosDelAsunto.guardar(asunto, nombres[i], aMano[nombres[i]], opciones);
        if (!r.ok) U.aviso(r.aviso + ' No se ha guardado en el asunto.', 'ambar');
      } catch (e) { U.accesorio('Lo escrito vale para este documento, pero no he podido guardar «' + nombres[i] + '» en el asunto', e); }
    }
  }

  async function preguntar(faltan, opciones) {
    var asunto = opciones && opciones.asunto;
    var lista = [];
    (faltan || []).forEach(function (f) { if (f && lista.indexOf(f) === -1) lista.push(f); });
    if (!lista.length) return { accion: 'igual', aMano: {} };
    var igual = false;
    /* Fila 530: el mismo control que en la lista de la tarea (desplegable para un campo de lista y para el tutor con custodia). */
    var infos = {};
    if (asunto && window.DatosDelAsunto) {
      var valores = null;
      try { valores = await Plantillas.valoresDeAsunto(asunto); } catch (e) { valores = null; }
      lista.forEach(function (f) { try { infos[f] = DatosDelAsunto.infoDe(f, asunto, valores); } catch (e2) { /* sin info: caja de texto */ } });
    }
    var esperar = U.preguntar('Faltan datos para este documento',
      '<p class="explica">Escribe lo que falte.' + (asunto ? ' Se guarda en el asunto: ninguna otra plantilla lo vuelve a pedir. ' : ' Vale solo para este documento. ') +
      'Lo que dejes vacío se queda sin rellenar en el Word.</p>' +
      lista.map(function (f, i) {
        /* Fila 510: un campo de lista que decide un texto condicional se elige en un desplegable con sus opciones. */
        var opciones = (infos[f] && infos[f].clase === 'lista' && infos[f].valores && infos[f].valores.length) ? infos[f].valores : (window.TextoCondicional ? TextoCondicional.opcionesDeFalta(f) : null);
        var control = opciones
          ? '<select class="campo word-falta" id="word-falta-' + i + '" data-hueco="' + U.escapar(f) + '"><option value="">—</option>' +
            opciones.map(function (o) { return '<option>' + U.escapar(o) + '</option>'; }).join('') + '</select>'
          : '<input class="campo word-falta" id="word-falta-' + i + '" data-hueco="' + U.escapar(f) + '">';
        return '<label class="etiqueta" for="word-falta-' + i + '">' + U.escapar(legible(f)) + '</label>' + control;
      }).join('') +
      '<p style="margin-top:10px"><button type="button" class="boton" id="word-falta-igual">Generar igualmente</button></p>',
      'Generar');
    var botonIgual = document.getElementById('word-falta-igual');
    if (botonIgual) botonIgual.onclick = function () {
      igual = true;
      var aceptar = document.getElementById('cuadro-aceptar');
      if (aceptar) aceptar.click();
    };
    var primero = document.getElementById('word-falta-0');
    if (primero) primero.focus();
    /* Leer antes de que el cuadro se cierre y se vacíe. */
    var aMano = {};
    var aceptar = document.getElementById('cuadro-aceptar');
    function recoger() {
      Array.prototype.forEach.call(document.querySelectorAll('#capa .word-falta'), function (c) {
        if (c.value.trim()) aMano[c.dataset.hueco] = c.value.trim();
      });
    }
    if (aceptar) aceptar.addEventListener('click', recoger, true);
    var ok = await esperar;
    if (aceptar) aceptar.removeEventListener('click', recoger, true);
    if (!ok) return { accion: 'cancelar', aMano: {} };
    if (igual) return { accion: 'igual', aMano: {} };
    if (asunto && Object.keys(aMano).length) await guardarEnElAsunto(asunto, aMano);
    return { accion: 'generar', aMano: aMano };
  }

  return { preguntar: preguntar, legible: legible };
})();
window.WordFaltan = WordFaltan;
