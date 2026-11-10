/* ============================================================
   fecha-de-registro-plazos.js — plazos «desde su registro» (fila 573, docs/573-FECHA-DE-REGISTRO.md).

   Un plazo con `base: 'registro'` cuenta desde la fecha de registro del documento del hito `desde` (si hay varios documentos
   registrados, el registro más reciente). `fechaDelHito` la da al hacer el hito (js/hitos.js); `recalcular` rehace la fecha
   límite de los hitos que contaron desde hoy por no tener aún la fecha, cuando llega el listado de Séneca. Un hito con la
   fecha puesta a mano (`fechaManual`) no se toca.
   ============================================================ */
var FechaDeRegistroPlazos = (function () {

  /* PURA. La fecha de registro más reciente entre los documentos de un hito (`ficha.documentos`), o ''. */
  function fechaDeDocumentos(nombres, ficha) {
    var mejor = '';
    (nombres || []).forEach(function (n) {
      var d = window.DocumentosDatos ? DocumentosDatos.deFichero(ficha, n) : null;
      ((d && d.registros) || []).forEach(function (r) { if (r && r.fecha && r.fecha > mejor) mejor = r.fecha; });
    });
    return mejor;
  }

  function fichaDe(clave) {
    return (window.App && App.E && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[clave]) || null;
  }

  /* La fecha de registro del documento de un hito de un asunto, o ''. */
  function fechaDelHito(clave, hito) {
    return hito ? fechaDeDocumentos(hito.documentos, fichaDe(clave)) : '';
  }

  /* Rehace la fecha límite de los hitos «desde su registro» cuyo hito de origen ya está hecho y ya tiene fecha de registro. */
  async function recalcular(claves) {
    if (!window.Hitos || !Hitos.cambiar) return;
    for (var k = 0; k < claves.length; k++) {
      var clave = claves[k];
      try {
        await Hitos.cambiar(function (d) {
          var entrada = d.porAsunto && d.porAsunto[clave];
          if (!entrada) return d;
          var aj = d.ajustes || {};
          (function recorrer(lista) {
            (lista || []).forEach(function (h) {
              if (h.plazo && h.plazo.base === 'registro' && h.plazo.desde && !h.fechaManual) {
                var origen = Hitos.buscar(entrada.hitos, h.plazo.desde);
                var f = origen && origen.estado === 'hecho' ? fechaDelHito(clave, origen) : '';
                if (f) h.fecha = Plazos.sumarPlazo(f, h.plazo.dias, h.plazo.cuenta, aj.festivos, aj.noLectivos);
              }
              if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { recorrer(o.hitos); });
            });
          })(entrada.hitos);
          return d;
        });
      } catch (e) { /* accesorio */ }
    }
  }

  return { fechaDeDocumentos: fechaDeDocumentos, fechaDelHito: fechaDelHito, recalcular: recalcular };
})();
window.FechaDeRegistroPlazos = FechaDeRegistroPlazos;
