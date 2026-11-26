/* ============================================================
   tarea-coger-de-bandeja.js — «Coger de Por clasificar» en la tarea de añadir documento (fila 646,
   docs/646-COGER-DE-POR-CLASIFICAR.md).

   Junto al recuadro «Suelta aquí el PDF» (js/hito-mesa-guion.js) sale este botón. Abre una lista con los documentos sueltos de «Por
   clasificar» (nombre y fecha, el más reciente arriba). Al elegir uno sale el cuadro del nombre de siempre, con el hito y la tarea ya
   puestos y el fichero todavía en «Por clasificar»: entra en el asunto al pulsar «Guardar» (App.llevarSueltoA, js/bandeja-a-asunto.js,
   fila 661). «Volver», «Cerrar» y la ✕ no guardan nada.

     - `botonHTML()`: el botón, para pintarlo junto al recuadro de soltar.
     - `enganchar(caja, a, h, porId)`: engancha los botones pintados en `caja` (id de tarea → tarea).
     - `lista()`: los sueltos de «Por clasificar», con su fecha, el más reciente primero.
   ============================================================ */
window.TareaCogerDeBandeja = (function () {

  function botonHTML() {
    return '<div class="guion-coger"><button type="button" class="enlace guion-coger-bandeja">Coger de Por clasificar</button></div>';
  }

  function fechaTexto(d) {
    return d ? d.toLocaleDateString('es-ES') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '';
  }

  /* Solo documentos sueltos (los correos de la bandeja no se ofrecen aquí). */
  async function lista() {
    var sueltos = (App.E.sueltos || []).slice();
    var filas = [];
    for (var i = 0; i < sueltos.length; i++) filas.push({ s: sueltos[i], fecha: await App.fechaDeSuelto(sueltos[i]) });
    filas.sort(function (x, y) { return (y.fecha ? y.fecha.getTime() : 0) - (x.fecha ? x.fecha.getTime() : 0); });
    return filas;
  }

  /* Devuelve el suelto elegido, o null si se pulsa «Volver», «Cerrar» o la ✕. */
  async function elegir(filas) {
    var elegido = null;
    var cuerpo = filas.length
      ? '<div class="coger-lista">' + filas.map(function (f, i) {
          return '<button type="button" class="coger-fila" data-i="' + i + '"><span class="coger-nombre">' + U.escapar(f.s.nombre) +
            '</span><span class="coger-fecha">' + U.escapar(fechaTexto(f.fecha)) + '</span></button>';
        }).join('') + '</div>'
      : '<p class="vacio">No hay documentos en «Por clasificar».</p>';
    var espera = U.preguntar('Coger de Por clasificar', cuerpo, 'Volver', true);
    Array.prototype.forEach.call(document.querySelectorAll('#cuadro-cuerpo .coger-fila'), function (b) {
      b.onclick = function () {
        elegido = filas[parseInt(b.dataset.i, 10)].s;
        document.getElementById('cuadro-aceptar').click();
      };
    });
    await espera;
    return elegido;
  }

  async function coger(a, h, g) {
    var filas;
    try { filas = await lista(); }
    catch (e) { U.fallo('No he podido leer «Por clasificar»', e); return; }
    var s = await elegir(filas);
    if (!s) return;
    await App.llevarSueltoA(s, a.nombre, a.ficha || {}, { hito: h, tarea: g.id });
  }

  function enganchar(caja, a, h, porId) {
    Array.prototype.forEach.call(caja.querySelectorAll('.guion-coger-bandeja'), function (b) {
      var paso = b.closest('.guion-paso');
      var g = paso && porId[paso.dataset.id];
      if (g) b.onclick = function () { coger(a, h, g); };
    });
  }

  return { botonHTML: botonHTML, enganchar: enganchar, lista: lista };
})();
