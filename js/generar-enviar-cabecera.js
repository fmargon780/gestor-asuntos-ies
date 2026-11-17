/* ============================================================
   generar-enviar-cabecera.js — «Generar documento ▾» y «Enviar ▾» en la cabecera del asunto
   (17-nov-2026, fila 695, docs/695-GENERAR-Y-ENVIAR-SIN-TAREA.md).

   Siempre a la vista, junto al botón del teléfono, tenga el asunto hitos o no. No piden ni crean ninguna tarea
   ni ningún hito, y no marcan nada solos: se genera con `PlantillasDocumento.generar(a, p, 'abierto', {})` (sin `hito`
   ni `idPasoGuion`) y se envía con el cuadro de siempre (`CorreoNucleo.abrirCuadro`, sin `comunicarHito`, para que
   js/correo-rastro.js no marque ninguna tarea). Con «solo consultar» no salen. La llama js/ficha-asunto.js.
   ============================================================ */
var GenerarEnviarCabecera = (function () {

  var turno = 0;

  function consulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  function boton(texto, clase) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ' + clase;
    b.textContent = texto;
    return b;
  }

  async function generar(a, p, b) {
    try {
      await U.mientrasGuarda(b, function () { return PlantillasDocumento.generar(a, p, 'abierto', {}); });
    } catch (e) { U.fallo('No he podido generar el documento', e); }
  }

  /* El menú de plantillas se monta cuando están leídas; si el asunto ya no es el de la ficha, no se toca nada. */
  async function montarGenerar(a, b, mio) {
    var lista = [];
    try { lista = await PlantillasDocumento.plantillasDelAsunto(a); } catch (e) { lista = []; }
    if (mio !== turno || !b.isConnected) return;
    var opciones = lista.map(function (p) {
      return { texto: p.nombre, alPulsar: function () { generar(a, p, b); } };
    });
    if (!opciones.length) opciones = [{ texto: 'Este tipo de asunto no tiene plantillas de documento', deshabilitado: true }];
    FichaMenus.montar(b, opciones);
  }

  function montarEnviar(a, b) {
    FichaMenus.montar(b, [
      { texto: 'Correo', alPulsar: function () { CorreoNucleo.abrirCuadro(a, false, {}); } },
      { texto: 'Séneca', alPulsar: function () { CorreoNucleo.abrirCuadro(a, true, {}); } }
    ]);
  }

  /* Pone los dos botones dentro de `sitio`. Con «solo consultar» no pone nada. */
  function pintar(sitio, a) {
    if (!sitio || !a || consulta()) return;
    var mio = ++turno;
    var g = boton('Generar documento ▾', 'ficha-generar-cab');
    var e = boton('Enviar ▾', 'ficha-enviar-cab');
    sitio.appendChild(g);
    sitio.appendChild(e);
    if (window.FichaMenus && window.PlantillasDocumento) montarGenerar(a, g, mio);
    if (window.FichaMenus && window.CorreoNucleo) montarEnviar(a, e);
  }

  return { pintar: pintar };
})();
window.GenerarEnviarCabecera = GenerarEnviarCabecera;
