/* ============================================================
   hitos-documentos.js — apuntar un documento a un hito (17-sep-2026,
   fila 31 de docs/COLA.md, docs/APUNTAR-DOCUMENTO-A-HITO.md).

   Es la mitad que le faltaba a la fila 15: el modelo ya guardaba los
   documentos apuntados (`Hitos.anadirDocumento`/`quitarDocumento`) y
   la lista ya se pintaba con su ✕, pero no había ninguna forma de
   apuntar uno. Aquí solo el cuadro de elegir, con casillas: apuntar es
   solo señalar, nunca copiar ni mover nada (docs/HITOS.md, 2.1).

   Se habla con js/hitos-panel-lista.js, que pone el botón "Apuntar un
   documento" en el cuerpo de cada hito. Se carga después de
   js/hitos-panel-lista.js y antes de js/inicio.js.
   ============================================================ */
var HitosDocumentos = (function () {

  function filaDeDocumento(nombre, marcado, yaNoEsta) {
    return '<label class="hitosdoc-fila' + (yaNoEsta ? ' hitosdoc-fila-falta' : '') + '">' +
      '<input type="checkbox" class="hitosdoc-marca" value="' + U.escapar(nombre) + '"' +
        (marcado ? ' checked' : '') + '>' +
      '<span>' + U.escapar(nombre) +
        (yaNoEsta ? ' <span class="suave">(ya no está)</span>' : '') +
      '</span></label>';
  }

  /* `a` es el asunto, `h` el hito ya pintado (con su `.documentos`).
     Al aceptar, guarda los cambios y pide el repintado ella misma: a
     quien llama solo le hace falta abrir el cuadro. */
  async function abrir(a, h) {
    var ficheros;
    try { ficheros = await Carpetas.ficheros(a.handle); }
    catch (e) { ficheros = []; }
    if (window.IndiceExpediente) ficheros = IndiceExpediente.fuera(ficheros);   /* fila 137 */
    ficheros = ficheros.slice().sort(function (x, y) {
      return String(x.nombre).localeCompare(String(y.nombre), 'es');
    });

    var apuntadosDeAntes = (h.documentos || []).slice();
    var nombresDeLaCarpeta = ficheros.map(function (f) { return f.nombre; });
    /* Un apuntado que ya no está en la carpeta sale igual en la lista,
       marcado y en gris, para poder desmarcarlo y limpiarlo: nunca se
       quita solo, sin que Francisco lo diga (docs/APUNTAR-DOCUMENTO-A-HITO.md, 2). */
    var faltantes = apuntadosDeAntes.filter(function (n) { return nombresDeLaCarpeta.indexOf(n) === -1; });

    var cuerpo = ficheros.length
      ? '<div id="hitosdoc-lista">' +
          ficheros.map(function (f) {
            return filaDeDocumento(f.nombre, apuntadosDeAntes.indexOf(f.nombre) !== -1, false);
          }).join('') +
          faltantes.map(function (n) { return filaDeDocumento(n, true, true); }).join('') +
        '</div>'
      : '<p class="explica">La carpeta de este asunto todavía no tiene ningún documento.</p>';

    var ok = await U.preguntar('Apuntar un documento', cuerpo,
      ficheros.length ? 'Apuntar' : 'Dejarlo', !ficheros.length);
    if (!ok || !ficheros.length) return;

    var marcados = Array.prototype.map.call(
      document.querySelectorAll('#hitosdoc-lista .hitosdoc-marca:checked'),
      function (c) { return c.value; }
    );
    var anadidos = marcados.filter(function (n) { return apuntadosDeAntes.indexOf(n) === -1; });
    var quitados = apuntadosDeAntes.filter(function (n) { return marcados.indexOf(n) === -1; });

    try {
      for (var i = 0; i < anadidos.length; i++) {
        await Hitos.anadirDocumento(a.nombre, h.id, anadidos[i]);
        /* Marca sola la única casilla de "lo que hay que reunir" que
           sea de clase documento y siga sin marcar (18-sep-2026, fila
           59, sección 5 del encargo); con varias, pregunta con cuál se
           corresponde. No crítico: si falla, el documento ya ha
           quedado apuntado igual. */
        if (window.HitosRequisitos) {
          try { await HitosRequisitos.marcarPorDocumento(a.nombre, h.id, anadidos[i]); } catch (e2) { /* no crítico */ }
          if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(a, h.id, 'anadir');   /* fila 109 */
        }
      }
      for (var j = 0; j < quitados.length; j++) {
        await Hitos.quitarDocumento(a.nombre, h.id, quitados[j]);
        if (window.HitosRequisitos) {
          try { await HitosRequisitos.desmarcarPorDocumento(a.nombre, h.id, quitados[j]); } catch (e2) { /* no crítico */ }
        }
      }
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return;
    }
    window.HitosPanel.programarRepintado();
  }

  return { abrir: abrir };
})();
window.HitosDocumentos = HitosDocumentos;
