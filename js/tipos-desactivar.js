/* ============================================================
   tipos-desactivar.js — apagar un tipo de asunto sin borrarlo
   (fila 422, docs/DESACTIVAR-UN-TIPO.md).

   Un tipo desactivado lleva `desactivado: true` en tipos.json (sin ese
   dato está activo). Sigue entero —campos, hitos, plantillas, plazo,
   recurrencia— y los asuntos que ya lo tienen siguen igual; lo único
   que cambia es que no se ofrece para asuntos nuevos o cambiados
   (`App.tiposParaElegir`, js/nucleo.js), que el lector no lo propone y
   que su recurrencia se para (js/recurrentes.js).

   Al volver a activarlo, sus asuntos que se repiten esperan a la
   siguiente fecha que les toque contando desde ese día
   (`Recurrentes.alActivarTipo`).
   ============================================================ */
window.TiposDesactivar = (function () {

  function porNombre(nombre) {
    return (App.E.tipos || []).filter(function (t) { return t.tipo === nombre; })[0] || null;
  }

  /* Cuántos asuntos abiertos tienen este tipo. */
  function contarAbiertos(nombre) {
    return (App.E.listaAbiertos || []).filter(function (a) {
      return ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo)) === nombre;
    }).length;
  }

  function repintar(tipo) {
    if (App.pintarTiposAjustes) App.pintarTiposAjustes();
    if (App.E.tipoAjustesActual === tipo && App.pintarTipoDeAsunto) App.pintarTipoDeAsunto();
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* Pregunta antes y apaga el tipo. true si se ha desactivado. */
  async function desactivar(tipo) {
    if (!tipo || tipo.desactivado) return false;
    var abiertos = contarAbiertos(tipo.tipo);
    var seRepiten = window.Recurrentes ? await Recurrentes.contarDeTipo(tipo.tipo) : 0;
    var cuerpo = '<p>' + (abiertos
      ? 'Hay ' + plural(abiertos, 'asunto abierto', 'asuntos abiertos') + ' de <strong>' + U.escapar(tipo.tipo) + '</strong>. Seguirán igual.'
      : 'No hay ningún asunto abierto de <strong>' + U.escapar(tipo.tipo) + '</strong>.') +
      ' El tipo dejará de salir al crear asuntos nuevos.</p>' +
      (seRepiten ? '<p>Se pararán sus ' + plural(seRepiten, 'asunto que se repite', 'asuntos que se repiten') + '.</p>' : '');
    var ok = await U.preguntar('Desactivar ' + tipo.tipo, cuerpo, 'Desactivar');
    if (!ok) return false;
    try {
      tipo.desactivado = true;
      await App.guardarTipos();
    } catch (e) {
      delete tipo.desactivado;
      U.aviso('No he podido desactivarlo: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
    repintar(tipo);
    U.aviso(tipo.tipo + ' desactivado.', 'bueno');
    return true;
  }

  /* Enciende el tipo, sin preguntar. true si se ha activado. */
  async function activar(tipo) {
    if (!tipo || !tipo.desactivado) return false;
    try {
      delete tipo.desactivado;
      await App.guardarTipos();
      if (window.Recurrentes) await Recurrentes.alActivarTipo(tipo.tipo);
    } catch (e) {
      tipo.desactivado = true;
      U.aviso('No he podido activarlo: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
    repintar(tipo);
    U.aviso(tipo.tipo + ' activado.', 'bueno');
    return true;
  }

  /* El botón «Desactivar» / «Activar» de la pantalla de un tipo. */
  function botonDe(tipo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-tipo-desactivar';
    b.style.marginTop = '10px';
    b.style.marginLeft = '8px';
    b.textContent = tipo.desactivado ? 'Activar' : 'Desactivar';
    b.title = tipo.desactivado
      ? 'Volver a ofrecerlo al crear asuntos'
      : 'Dejar de ofrecerlo al crear asuntos, sin borrar nada';
    b.onclick = function () { return tipo.desactivado ? activar(tipo) : desactivar(tipo); };
    return b;
  }

  return { porNombre: porNombre, desactivar: desactivar, activar: activar, botonDe: botonDe, contarAbiertos: contarAbiertos };
})();
