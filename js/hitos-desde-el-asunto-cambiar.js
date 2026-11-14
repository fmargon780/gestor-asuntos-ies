/* ============================================================
   hitos-desde-el-asunto-cambiar.js — cambiar y borrar un hito (fila 535: trozo de js/hitos-desde-el-asunto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga después de js/hitos-desde-el-asunto-propagar.js y antes de js/hitos-desde-el-asunto.js.
   ============================================================ */
(function () {

  var I = window.HitosDesdeElAsuntoNucleo = window.HitosDesdeElAsuntoNucleo || {};
  function nivelSuperior() { return I.nivelSuperior.apply(this, arguments); }
  function sinTrabajo() { return I.sinTrabajo.apply(this, arguments); }
  function colocarTrasAncla() { return I.colocarTrasAncla.apply(this, arguments); }
  function pasoAnclaDeHito() { return I.pasoAnclaDeHito.apply(this, arguments); }
  function leerFormulario() { return I.leerFormulario.apply(this, arguments); }
  function opcionesResponsable() { return I.opcionesResponsable.apply(this, arguments); }
  function cuerpoFormulario() { return I.cuerpoFormulario.apply(this, arguments); }
  function tipoDe() { return I.tipoDe.apply(this, arguments); }
  function nombreCortoDe() { return I.nombreCortoDe.apply(this, arguments); }
  function soltarCuerpo() { return I.soltarCuerpo.apply(this, arguments); }
  function enganchar() { return I.enganchar.apply(this, arguments); }
  var SOLO_AQUI = I.SOLO_AQUI;
  var SOLO_AQUI_EN_PREGUNTA = I.SOLO_AQUI_EN_PREGUNTA;
  function pasoEsDeNivelSuperior() { return I.pasoEsDeNivelSuperior.apply(this, arguments); }
  function avisarGuia() { return I.avisarGuia.apply(this, arguments); }
  function repartoDe() { return I.repartoDe.apply(this, arguments); }
  function propagarCambio() { return I.propagarCambio.apply(this, arguments); }
  function propagarBorrado() { return I.propagarBorrado.apply(this, arguments); }
  function repintar() { return I.repintar.apply(this, arguments); }

  /* ==========================================================
     CAMBIAR ESTE HITO
     ========================================================== */

  async function abrirCambiar(a, h) {
    var hitos = await Hitos.hitosDe(a.nombre);
    var nivel = nivelSuperior(hitos);
    var esNivelSuperior = nivel.some(function (x) { return x.id === h.id; });
    var tipo = tipoDe(a);
    var pasos = tipo ? GuiasDelCentro.pasosDe(tipo) : [];
    /* Fila 660: con la marca de la guía apagada, el cambio se queda solo en este asunto. */
    var conGuia = !!(h.origenGuia && esNivelSuperior && pasoEsDeNivelSuperior(pasos, h.origenGuia)) && !!(window.MarcaGuia && MarcaGuia.enGuia(a));
    var colocarActual = '';
    if (esNivelSuperior) {
      var i = nivel.map(function (x) { return x.id; }).indexOf(h.id);
      colocarActual = i > 0 ? nivel[i - 1].id : '';
    }
    var responsables = await opcionesResponsable();
    var esperar = U.preguntar('Cambiar este hito',
      cuerpoFormulario({
        idPropio: h.id, nivel: esNivelSuperior ? nivel : [], colocarActual: colocarActual,
        responsables: responsables, responsable: h.responsable || '', plazo: h.plazo || null,
        variosDocumentos: !!h.variosDocumentos, sinVarios: h.clase === 'decision',
        titulo: h.titulo, cuerpo: h.cuerpo, alcance: window.MarcaGuia ? MarcaGuia.alcance(a) : ''
      }), 'Guardar');
    enganchar();
    var ok = await esperar;
    var datos = ok ? leerFormulario() : null;
    soltarCuerpo();
    if (!ok) return;
    if (!datos.titulo) { U.aviso('Hace falta un título.', 'ambar'); return; }
    try {
      if (conGuia) {
        await cambiarConGuia(a, h, tipo, nivel, datos);
      } else {
        /* Sin tipo, solo para este asunto o dentro de una pregunta: se queda aquí. */
        var enPregunta = !!tipo && !!h.origenGuia && !esNivelSuperior;
        await cambiarSoloAsunto(a, h, esNivelSuperior, datos, false, enPregunta ? SOLO_AQUI_EN_PREGUNTA : SOLO_AQUI);
      }
      repintar();
    } catch (e) {
      U.aviso('No he podido guardar el cambio: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function cambiarSoloAsunto(a, h, esNivelSuperior, datos, callado, mensaje) {
    /* Fila 414: si difiere de la guía, queda como «propio» y la sincronización con la guía no lo pisa. */
    var tipoA = tipoDe(a);
    var pasoG = (tipoA && h.origenGuia && !h.delTipoAnterior)
      ? GuiasDelCentro.pasosDe(tipoA).filter(function (p) { return p.id === h.origenGuia; })[0] : null;
    await Hitos.guardarCampos(a.nombre, h.id, {
      titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo,
      variosDocumentos: !!datos.variosDocumentos,
      variosPropio: !!pasoG && !!pasoG.variosDocumentos !== !!datos.variosDocumentos
    });
    if (esNivelSuperior) {
      await Hitos.cambiar(function (d) {
        var entrada = d.porAsunto[a.nombre];
        if (!entrada) return d;
        var hh = Hitos.buscar(entrada.hitos, h.id);
        if (hh) colocarTrasAncla(entrada.hitos, hh, datos.colocarDespuesDe);
        return d;
      });
    }
    if (!callado) U.aviso(mensaje || SOLO_AQUI, 'bueno');
  }

  async function cambiarConGuia(a, h, tipo, nivel, datos) {
    var idPasoAncla = pasoAnclaDeHito(nivel, datos.colocarDespuesDe);
    var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
    var pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
    var paso = pasos.filter(function (p) { return p.id === h.origenGuia; })[0];
    if (!paso) { await cambiarSoloAsunto(a, h, true, datos); return; }
    paso.titulo = datos.titulo;
    paso.cuerpo = datos.cuerpo;
    paso.responsable = datos.responsable;
    paso.plazo = datos.plazo;
    paso.variosDocumentos = !!datos.variosDocumentos;
    colocarTrasAncla(pasos, paso, idPasoAncla);
    /* Los demás asuntos abiertos los toca el propio guardado de la guía (los que no han empezado el hito)... */
    await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
    var reparto = repartoDe();
    /* ...y en este, el cambio se aplica siempre, aunque el hito esté empezado. */
    await propagarCambio(tipo, h.origenGuia,
      { titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo, variosDocumentos: datos.variosDocumentos },
      idPasoAncla, a.nombre, true);
    await avisarGuia(tipo, a, antes, reparto, null);
  }

  /* ==========================================================
     BORRAR ESTE HITO
     ========================================================== */

  async function abrirBorrar(a, h) {
    if (!sinTrabajo(h, a)) return;
    var tipo = tipoDe(a);
    var pasos = tipo ? GuiasDelCentro.pasosDe(tipo) : [];
    var conGuia = !!(h.origenGuia && pasoEsDeNivelSuperior(pasos, h.origenGuia)) && !!(window.MarcaGuia && MarcaGuia.enGuia(a));   /* fila 660 */
    var esperar = U.preguntar('Borrar este hito',
      '<p><strong>' + U.escapar(h.titulo || '') + '</strong></p>' +
      (conGuia ? '<p class="suave">Se quita también de la guía de ' + U.escapar(nombreCortoDe(tipo)) +
        ' y de los asuntos abiertos donde no esté empezado.</p>' : '<p class="suave">Se borra solo de este asunto: la guía no cambia.</p>'), 'Borrar');
    enganchar();
    var ok = await esperar;
    if (!ok) return;
    try {
      if (conGuia) {
        var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
        var pasosCopia = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
        var i = pasosCopia.map(function (p) { return p.id; }).indexOf(h.origenGuia);
        if (i !== -1) pasosCopia.splice(i, 1);
        await GuiasDelCentro.guardarPasos(tipo, pasosCopia, { claveActual: a.nombre });
        var reparto = repartoDe();
        await propagarBorrado(tipo, h.origenGuia, a.nombre, true);
        await avisarGuia(tipo, a, antes, reparto, null);
      } else {
        var enPregunta = !!tipo && !!h.origenGuia && !nivelSuperior(await Hitos.hitosDe(a.nombre)).some(function (x) { return x.id === h.id; });
        await Hitos.quitarHito(a.nombre, h.id);
        U.aviso(enPregunta ? SOLO_AQUI_EN_PREGUNTA : SOLO_AQUI, 'bueno');
      }
      if (window.HitoMesa) HitoMesa.cerrar();
      repintar();
    } catch (e) {
      U.aviso('No he podido borrar el hito: ' + U.mensajeDeError(e), 'malo');
    }
  }


  I.abrirCambiar = abrirCambiar;
  I.abrirBorrar = abrirBorrar;
})();
