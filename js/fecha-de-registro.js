/* ============================================================
   fecha-de-registro.js — la fecha de registro de cada documento registrado
   (fila 573, docs/573-FECHA-DE-REGISTRO.md).

   Cada registro de la ficha (`documentos[n].registros[]`) lleva `fecha` (AAAA-MM-DD) y `fuente`
   (`'sello'` o `'listado'`). Nunca se escribe a mano:
   - con sello de Séneca, la toma de él al registrar (`deSello`);
   - sin sello, o si no coinciden, del listado del registro de Séneca (`ControlRegistro`): manda el listado.
   Mientras no hay fecha, solo se ve el código. `texto(r)` es lo que se enseña: «Registro 26EM0123 · 03/11/2026».
   ============================================================ */
var FechaDeRegistro = (function () {

  /* PURA. «dd/mm/aaaa» (la del sello) -> «aaaa-mm-dd», o ''. */
  function isoDeSello(t) {
    var m = String(t || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
  }

  /* PURA. «aaaa-mm-dd» -> «dd/mm/aaaa», o ''. */
  function legible(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  /* PURA. Lo que se enseña de un registro: «26EM0123 · 03/11/2026» (o solo el código). */
  function codigoYFecha(r) {
    if (!r || !r.codigo) return '';
    var f = legible(r.fecha);
    return r.codigo + (f ? ' · ' + f : '');
  }

  function texto(r) { return r && r.codigo ? 'Registro ' + codigoYFecha(r) : ''; }

  /* PURA. El dato nuevo de una fecha sobre un registro ya apuntado (o por apuntar). El listado manda sobre el sello.
     Devuelve el registro con `fecha` y `fuente`, o el mismo si no cambia nada. */
  function conFecha(registro, fecha, fuente) {
    if (!registro || !fecha) return registro;
    if (registro.fuente === 'listado' && fuente !== 'listado') return registro;
    if (registro.fecha === fecha && registro.fuente === fuente) return registro;
    return Object.assign({}, registro, { fecha: fecha, fuente: fuente });
  }

  /* PURA. Los registros de un documento con las fechas del listado (`apuntes`: { codigo: { fecha } }).
     Devuelve { registros, cambiado }. */
  function aplicarListado(registros, apuntes) {
    var cambiado = false;
    var salida = (registros || []).map(function (r) {
      var ap = r && apuntes && apuntes[r.codigo];
      if (!ap || !ap.fecha) return r;
      var nuevo = conFecha(r, ap.fecha, 'listado');
      if (nuevo !== r) cambiado = true;
      return nuevo;
    });
    return { registros: salida, cambiado: cambiado };
  }

  /* Pone al día la ficha de los asuntos con las fechas del listado. Devuelve las claves de los asuntos que han cambiado.
     Nunca lanza. En solo consulta no escribe. */
  var enMarcha = null;
  async function repasar() {
    if (enMarcha) return enMarcha;
    enMarcha = (async function () {
      var tocados = [];
      try {
        if (window.SoloConsulta && SoloConsulta.activo()) return tocados;
        if (!window.ControlRegistro || !ControlRegistro.cargar || !window.DocumentosDatos || !window.App || !App.E || !App.E.registro) return tocados;
        var apuntes = ((await ControlRegistro.cargar()) || {}).apuntes || {};
        if (!Object.keys(apuntes).length) return tocados;
        var asuntos = App.E.registro.asuntos || {};
        var nombres = Object.keys(asuntos);
        for (var i = 0; i < nombres.length; i++) {
          var f = asuntos[nombres[i]] || {};
          if (String(f.estado || '') === 'cerrado') continue;
          var docs = f.documentos || {};
          var claves = Object.keys(docs);
          for (var j = 0; j < claves.length; j++) {
            var r = aplicarListado((docs[claves[j]] || {}).registros, apuntes);
            if (!r.cambiado) continue;
            await DocumentosDatos.anotar(nombres[i], claves[j], { registros: r.registros });
            if (tocados.indexOf(nombres[i]) === -1) tocados.push(nombres[i]);
          }
        }
        if (tocados.length && window.FechaDeRegistroPlazos) await FechaDeRegistroPlazos.recalcular(tocados);
      } catch (e) { /* accesorio: lo que no se pueda, se hará en el siguiente listado */ }
      return tocados;
    })();
    try { return await enMarcha; } finally { enMarcha = null; }
  }

  return { isoDeSello: isoDeSello, legible: legible, codigoYFecha: codigoYFecha, texto: texto, conFecha: conFecha, aplicarListado: aplicarListado, repasar: repasar };
})();
window.FechaDeRegistro = FechaDeRegistro;
