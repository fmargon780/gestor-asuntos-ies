/* ============================================================
   tarea-firmar.js — la tarea «Firmar un documento» se marca sola
   (fila 523, 5-nov-2026, docs/523-TAREA-FIRMAR.md; tema 516).

   Cuando llega el PDF firmado de un documento (js/documentos-firmados.js,
   `alLlegar`: «Ruta» pulsado y el firmado guardado encima), se miran las
   tareas de firmar PENDIENTES de los hitos del asunto cuyo documento colgado
   es ese (js/tareas-con-documento.js). Cada una necesita 1, 2 o 3 firmas
   (`receta.firmas`, GuiasGuion.firmasNecesarias):
     - si el documento ya las tiene, la tarea se marca, y si «Hacer este hito»
       estaba esperando esa firma, sigue (espera el sello, queda listo para
       enviar o nada, según la tarea que venga);
     - si no llega, no se marca y el aviso dice cuántas faltan.
   Una tarea de otro documento, o sin documento, no se toca. El hito nunca se
   cierra solo. Solo cuenta firmas: no comprueba que sean válidas.
   ============================================================ */
window.TareaFirmar = (function () {

  /* Las tareas de firmar pendientes de ese documento: [{ h, g }]. */
  function pendientesDe(a, hitos, doc) {
    var r = [];
    TareasConDocumento.recorrer(hitos, function (h) {
      Hitos.guionDe(a, h).forEach(function (g) {
        if (g.accion !== 'firmar' || g.hecho || g.noaplica) return;
        var e = TareasConDocumento.de(h, g.id);
        if (e && TareasConDocumento.mismo(e.doc, doc)) r.push({ h: h, g: g });
      });
    });
    return r;
  }

  function faltan(n, total) { return (n === 1 ? 'falta 1' : 'faltan ' + n) + ' de ' + total + ' firmas'; }

  /* «Hacer este hito» estaba esperando esta firma: sigue con lo que viene. */
  async function seguirCadena(a, h, g, doc) {
    if (!window.HacerEsteHito) return;
    var h1 = await HacerEsteHito._fresco(a, h.id);
    if (!h1 || !h1.cadena || h1.cadena.estado !== 'esperando-firma' || h1.cadena.tarea !== g.id) return;
    await HacerEsteHito._guardarCadena(a, h1, HacerEsteHito._cadenaTrasMarcar(a, h1, doc));
  }

  /* Llega `doc` con `firmas` firmas. Devuelve el texto que se añade al aviso verde (« Marcado: …», « Aún no se marca la
     tarea: …»), o ''. Nunca falla: es un accesorio de la llegada del firmado. */
  async function alLlegar(a, doc, firmas) {
    var texto = '';
    try {
      if (!window.Hitos || !window.TareasConDocumento || !window.GuiasGuion || !(firmas > 0)) return '';
      var lista = pendientesDe(a, await Hitos.hitosDe(a.nombre), doc);
      for (var i = 0; i < lista.length; i++) {
        var h = lista[i].h, g = lista[i].g, necesarias = GuiasGuion.firmasNecesarias(g);
        if (firmas < necesarias) {
          texto += ' Aún no se marca la tarea: ' + faltan(necesarias - firmas, necesarias) + '.';
          continue;
        }
        await Hitos.marcarGuion(a.nombre, h.id, g.id, { hecho: true });
        texto += ' Marcado: ' + g.texto + '.';
        try { await seguirCadena(a, h, g, doc); } catch (e1) { U.accesorio('Tarea marcada, pero no he podido seguir con el hito', e1); }
      }
      if (lista.length && window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
      if (window.HacerEsteHitoSello) HacerEsteHitoSello.avisar();
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('Documento firmado, pero no he podido marcar la tarea de firmar', e);
    }
    return texto;
  }

  return { alLlegar: alLlegar, pendientesDe: pendientesDe };
})();
