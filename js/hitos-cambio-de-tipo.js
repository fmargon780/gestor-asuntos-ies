/* ============================================================
   hitos-cambio-de-tipo.js — al cambiar el tipo de un asunto abierto,
   ofrecer la guía del tipo nuevo sin perder lo trabajado (23-sep-2026,
   fila 94, docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md).

   Lo llama App.editarAsunto (js/asuntos-editar.js) al terminar bien el
   guardado, con la clave YA nueva del asunto. Pregunta (Francisco
   eligió preguntar: a veces se cambia el tipo solo para corregir el
   nombre de la carpeta) y, si dice que sí:

   1. Crea los hitos de la guía del tipo nuevo (Hitos.pasoAHito).
   2. De los viejos, los intactos (sin hacer, sin notas, sin
      documentos, sin requisitos marcados y sin rama elegida) se quitan;
      los que tienen algo, o están hechos, se quedan al final
      como "noaplica" con `delTipoAnterior`, y salen plegados con los
      huérfanos (Hitos.huerfanos), igual que al cambiar de rama.
   3. El primero pendiente de la guía nueva pasa a "en curso".
   4. Una nota en el asunto: «Cambiado el tipo de X a Y».
   ============================================================ */
window.HitosCambioDeTipo = (function () {

  /* Algo apuntado en un hito, o en cualquiera de los de sus ramas. */
  /* "En curso" solo no cuenta: la aplicación pone en curso el primero
     pendiente sola, al crear los hitos, sin que nadie haya hecho nada. */
  function tieneAlgo(h) {
    if (h.estado === 'hecho') return true;
    if (h.notas && h.notas.length) return true;
    if (h.documentos && h.documentos.length) return true;
    if ((h.requisitos || []).some(function (r) { return r.hecho || r.valor || r.documento; })) return true;
    if (h.clase === 'decision') {
      if (h.elegida) return true;
      return (h.opciones || []).some(function (o) { return (o.hitos || []).some(tieneAlgo); });
    }
    return false;
  }

  /* Sustituye los hitos de `clave` por los de la guía de `tipoNuevo`.
     Devuelve cuántos hitos viejos se han conservado. */
  async function traerGuia(clave, tipoViejo, tipoNuevo) {
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipoNuevo)) || [];
    var conservados = 0;
    var resultado = null;
    await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave] || { creados: U.hoyIso(), hitos: [] };
      var quedan = entrada.hitos.filter(function (h) {
        if (h.delTipoAnterior) return true;          /* de un cambio anterior: se queda */
        if (!tieneAlgo(h)) return false;
        h.estado = 'noaplica';
        h.delTipoAnterior = tipoViejo;
        conservados++;
        return true;
      });
      var nuevos = pasos.map(Hitos.pasoAHito);
      entrada.hitos = nuevos.concat(quedan);
      resultado = Hitos.recomputeEnCurso(entrada.hitos);
      d.porAsunto[clave] = entrada;
      return d;
    });
    if (resultado && Hitos.aplicarEstadoDelHito) await Hitos.aplicarEstadoDelHito(clave, resultado);
    if (window.Notas) {
      try {
        await Notas.anadir({ nombre: clave }, 'Cambiado el tipo de ' + tipoViejo + ' a ' + tipoNuevo +
          ' · ' + U.fechaLegible(U.hoyIso().replace(/-/g, '').slice(2)) +
          '. Se ha traído la guía del tipo nuevo' +
          (conservados ? '; ' + conservados + (conservados === 1 ? ' paso viejo se queda' : ' pasos viejos se quedan') +
            ' abajo, como «no aplica», porque tenían algo apuntado.' : '.'));
      } catch (e) { /* no crítico */ }
    }
    return conservados;
  }

  /* El punto de entrada. No hace nada si el tipo no ha cambiado o si
     el asunto no tiene hitos. Un solo U.preguntar: el cuadro de editar
     ya está cerrado cuando se llega aquí. */
  async function ofrecer(clave, tipoViejo, tipoNuevo) {
    if (!tipoViejo || !tipoNuevo || tipoViejo === tipoNuevo) return false;
    var hitos = await Hitos.hitosDe(clave);
    if (!hitos.length) return false;
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipoNuevo)) || [];
    if (!pasos.length) {
      U.aviso('El tipo nuevo no tiene guía escrita: los pasos se quedan como estaban.', 'ambar');
      return false;
    }
    /* U.preguntar no deja poner el texto de Cancelar: se pone aquí y
       se devuelve como estaba al cerrar. */
    var cancelar = document.getElementById('cuadro-cancelar');
    var textoCancelar = cancelar ? cancelar.textContent : '';
    if (cancelar) cancelar.textContent = 'Dejar los pasos como están';
    var si = await U.preguntar('El tipo ha cambiado',
      '<p class="explica">Este asunto era <b>' + U.escapar(tipoViejo) + '</b> y ahora es <b>' +
      U.escapar(tipoNuevo) + '</b>. Sus pasos siguen siendo los del tipo viejo. ¿Traigo la guía de <b>' +
      U.escapar(tipoNuevo) + '</b>?</p>' +
      '<p class="explica suave">Los pasos viejos que tengan algo apuntado no se pierden: se quedan ' +
      'abajo, plegados, como «no aplica».</p>',
      'Traer la guía nueva');
    if (cancelar) cancelar.textContent = textoCancelar;
    if (!si) return false;
    var conservados = await traerGuia(clave, tipoViejo, tipoNuevo);
    U.aviso('Guía de ' + tipoNuevo + ' traída.' +
      (conservados ? ' ' + conservados + (conservados === 1 ? ' paso viejo se queda' : ' pasos viejos se quedan') +
        ' abajo, como «no aplica».' : ''), 'bueno');
    return true;
  }

  return { ofrecer: ofrecer, traerGuia: traerGuia, tieneAlgo: tieneAlgo };
})();
