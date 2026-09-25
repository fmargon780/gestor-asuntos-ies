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
   aMano: { <hueco>: <valor> } }. Lo escrito vale solo para ese
   documento (`valores.aMano`, js/plantillas.js): no se guarda en la
   ficha del asunto ni en la del tercero. Usa el cuadro de siempre
   (`U.preguntar`, `#capa`).
   ============================================================ */
var WordFaltan = (function () {

  /* «NOMBRE DEL PADRE» → «Nombre del padre»; «nombreNatural» → «Nombre natural». */
  function legible(hueco) {
    var t = String(hueco || '').replace(/^campo\s*:\s*/i, '').replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2').trim();
    if (t === t.toUpperCase()) t = t.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  async function preguntar(faltan) {
    var lista = [];
    (faltan || []).forEach(function (f) { if (f && lista.indexOf(f) === -1) lista.push(f); });
    if (!lista.length) return { accion: 'igual', aMano: {} };
    var igual = false;
    var esperar = U.preguntar('Faltan datos para este documento',
      '<p class="explica">Escribe lo que falte. Vale solo para este documento: no se guarda en ninguna ficha. ' +
      'Lo que dejes vacío se queda como hueco en el Word.</p>' +
      lista.map(function (f, i) {
        return '<label class="etiqueta" for="word-falta-' + i + '">' + U.escapar(legible(f)) + '</label>' +
          '<input class="campo word-falta" id="word-falta-' + i + '" data-hueco="' + U.escapar(f) + '">';
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
    return { accion: 'generar', aMano: aMano };
  }

  return { preguntar: preguntar, legible: legible };
})();
window.WordFaltan = WordFaltan;
