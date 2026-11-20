/* ============================================================
   papel-espera-recibir.js — enviar un papel deja esperando al que tiene que volver
   (20-nov-2026, fila 723, docs/723-AULA-CONVIVENCIA-NOTA-Y-SEGUIMIENTO.md).

   Una tarea de papel que NOS LLEGA (por ejemplo «Recibir la parte firmada y el compromiso») puede llevar en
   la guía de su tipo `esperaAlEnviar`. Cuando en ese asunto se envía un papel (js/papel-enviado.js: «Marcar
   enviado» o el correo que sale de verdad), si esa tarea aún no tiene documento ni espera, queda esperando
   a la familia (a «Tercero» si el asunto no es de alumnado) con la espera de la fila 702 (js/tarea-espera.js),
   y como día de volver a mirarlo, el que propone la app: hoy más los días hábiles de Ajustes (el mismo número
   que para la firma). Al llegar el día, el asunto vuelve a «En Administración» con «Reclamar a…». Cuando llega
   el documento, la tarea queda hecha (js/tarea-papel.js) y la espera deja de verse.
   El flag se lee de la guía al enviar, no se copia al asunto (como «Cómo se hace», fila 707).
   ============================================================ */
var PapelEsperaRecibir = (function () {

  function tipoDe(a) { return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || ''; }

  /* ¿La guía del tipo dice que esta tarea espera al enviar? Función pura sobre las tareas de la guía. */
  function laGuiaLoDice(tareasGuia, g) {
    var t = (tareasGuia || []).filter(function (x) { return x.id === g.origenGuia; })[0];
    return !!(t && t.esperaAlEnviar);
  }

  /* Pone la espera. Devuelve cuántas tareas ha puesto en espera. */
  async function alEnviar(a) {
    if (!a || !window.AsuntoSinHitos || !window.Hitos || !window.TareaPapel || !window.GuiasDelCentro || !window.AsuntoSinHitosGuia) return 0;
    if (window.SoloConsulta && SoloConsulta.activo()) return 0;
    var h = AsuntoSinHitos.hitoDe(await Hitos.hitosDe(a.nombre));
    if (!h) return 0;
    var guia = AsuntoSinHitosGuia.tareasDe(GuiasDelCentro.pasosDe(tipoDe(a)) || []);
    var lista = Hitos.guionDe(a, h).filter(function (g) {
      return g.papel && !g.hecho && !g.noaplica && !g.espera && !(g.papelDoc && g.papelDoc.numero) && g.origenGuia && laGuiaLoDice(guia, g);
    });
    if (!lista.length) return 0;
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = categoria === 'ALUMNADO' ? 'tutor' : 'tercero';
    var dia = TareaPapel.diaPropuesto();
    for (var i = 0; i < lista.length; i++) {
      var g = lista[i];
      await Hitos._guionInterno.editarHito(a.nombre, h.id, function (hito) {
        hito.guionHecho = hito.guionHecho || {};
        var e = hito.guionHecho[g.id] = hito.guionHecho[g.id] || {};
        e.espera = { quien: quien, desde: U.hoyIso(), volver: dia };
      });
      if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Tarea en espera tras enviar el papel (volver a mirarlo el ' + (window.TareaEspera ? TareaEspera.diaCorto(dia) : dia) + '): ' + g.texto);
    }
    if (window.TareaEspera) await TareaEspera.avisar();
    return lista.length;
  }

  return { alEnviar: alEnviar, laGuiaLoDice: laGuiaLoDice };
})();
window.PapelEsperaRecibir = PapelEsperaRecibir;
