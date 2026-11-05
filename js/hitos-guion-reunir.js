/* ============================================================
   hitos-guion-reunir.js — «lo que hay que reunir» del guion de un hito
   y las funciones que cuelgan de `Hitos` (fila 535: trozo de
   js/hitos-guion.js, mismas funciones, solo cambian de fichero).
   Se carga después de js/hitos-guion-marcar.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  var I = Hitos._guionInterno = Hitos._guionInterno || {};
  var ACCIONES = I.ACCIONES;
  function pasoDe() { return I.pasoDe.apply(this, arguments); }
  function unir() { return I.unir.apply(this, arguments); }
  function guionDe() { return I.guionDe.apply(this, arguments); }
  function cuentaGuion() { return I.cuentaGuion.apply(this, arguments); }
  function editarHito() { return I.editarHito.apply(this, arguments); }
  function quien() { return I.quien.apply(this, arguments); }
  function marcarGuion() { return I.marcarGuion.apply(this, arguments); }
  function marcarGuionPorAccion() { return I.marcarGuionPorAccion.apply(this, arguments); }
  function elegirEnGuion() { return I.elegirEnGuion.apply(this, arguments); }
  function anadirGuionPropio() { return I.anadirGuionPropio.apply(this, arguments); }
  function cambiarGuionAqui() { return I.cambiarGuionAqui.apply(this, arguments); }
  function cambiarPreguntaAqui() { return I.cambiarPreguntaAqui.apply(this, arguments); }
  function cambiarGuionPropioTexto() { return I.cambiarGuionPropioTexto.apply(this, arguments); }
  function borrarGuionPropio() { return I.borrarGuionPropio.apply(this, arguments); }
  function ocultarGuionDeGuia() { return I.ocultarGuionDeGuia.apply(this, arguments); }
  function pasarGuionPropioAGuia() { return I.pasarGuionPropioAGuia.apply(this, arguments); }

  function asuntoDe(a) {
    if (typeof a !== 'string') return a;
    return ((window.App && App.E && App.E.listaAbiertos) || []).filter(function (x) { return x.nombre === a; })[0] ||
      { nombre: a, ficha: (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a]) || {} };
  }

  async function hitoDe(a, idHito) {
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[a.nombre];
    return entrada ? Hitos.buscar(entrada.hitos, idHito) : null;
  }

  /* Las líneas de reunir sin hacer (ni «no aplica»); con `soloObligatorias`,
     solo las obligatorias. */
  function faltanReunir(a, hito, soloObligatorias) {
    return guionDe(a, hito).filter(function (g) {
      return g.reunir && !g.hecho && !g.noaplica && (!soloObligatorias || g.obligatorio);
    });
  }

  /* «Pedir lo que falta»: lo que queda por reunir, en texto. */
  function textoLoQueFalta(a, hito) {
    var pendientes = faltanReunir(a, hito, false);
    if (!pendientes.length) return '';
    return 'Falta por aportar:\n' + pendientes.map(function (g) { return '- ' + g.texto; }).join('\n');
  }

  /* Un dato: se marca al escribirlo (y se desmarca si se borra). */
  function escribirValorGuion(clave, idHito, idLinea, valor) {
    var v = String(valor || '').trim();
    return editarHito(clave, idHito, function (h) {
      h.guionHecho = h.guionHecho || {};
      var e = h.guionHecho[idLinea] || {};
      e.valor = v;
      e.hecho = !!v;
      if (v) { e.noaplica = false; e.quien = quien(); e.cuando = U.ahora(); } else { delete e.quien; delete e.cuando; }
      h.guionHecho[idLinea] = e;
    });
  }

  /* Un documento añadido o asociado al hito marca la línea de documento
     que quede por reunir (si hay varias, pregunta con cuál). */
  async function marcarReunirPorDocumento(a, idHito, nombreDocumento) {
    a = asuntoDe(a);
    var h = await hitoDe(a, idHito);
    if (!h) return null;
    var pendientes = faltanReunir(a, h, false).filter(function (g) { return g.reunir === 'documento'; });
    if (!pendientes.length) return null;
    var elegida = pendientes[0];
    if (pendientes.length > 1) {
      var idCampo = 'guion-reunir-elegir-' + Date.now();
      var ok = await U.preguntar('¿Con qué se corresponde?',
        '<p class="explica">' + U.escapar(nombreDocumento) + '</p>' +
        '<select class="campo" id="' + idCampo + '"><option value="">Ninguna</option>' +
        pendientes.map(function (g) { return '<option value="' + U.escapar(g.id) + '">' + U.escapar(g.texto) + '</option>'; }).join('') +
        '</select>', 'Marcar');
      var campo = document.getElementById(idCampo);
      var id = ok && campo ? campo.value : '';
      elegida = pendientes.filter(function (g) { return g.id === id; })[0] || null;
      if (!elegida) return null;
    }
    await editarHito(a.nombre, idHito, function (x) {
      x.guionHecho = x.guionHecho || {};
      x.guionHecho[elegida.id] = { hecho: true, documento: nombreDocumento, quien: quien(), cuando: U.ahora() };
    });
    U.aviso('Marcado: ' + elegida.texto, 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
    return elegida;
  }

  /* Al quitar ese documento del hito, su línea vuelve a estar por reunir. */
  async function desmarcarReunirPorDocumento(a, idHito, nombreDocumento) {
    a = asuntoDe(a);
    var h = await hitoDe(a, idHito);
    if (!h) return;
    var l = guionDe(a, h).filter(function (g) { return g.reunir === 'documento' && g.hecho && g.documento === nombreDocumento; })[0];
    if (!l) return;
    await editarHito(a.nombre, idHito, function (x) {
      var e = (x.guionHecho || {})[l.id];
      if (e) { e.hecho = false; e.documento = ''; delete e.quien; delete e.cuando; }
    });
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  /* Fila 282: solo leer. La línea del guion que se marcó sola con ese documento (reunir === 'documento', hecha, con ese
     nombre), o null. La usa js/hitos-sacar-documento.js para avisar de que sigue marcada al quitar el documento. */
  function tareaMarcadaPorDocumento(a, hito, nombreDocumento) {
    return guionDe(asuntoDe(a), hito).filter(function (g) {
      return g.reunir === 'documento' && g.hecho && g.documento === nombreDocumento;
    })[0] || null;
  }

  Hitos.tareaMarcadaPorDocumento = tareaMarcadaPorDocumento;
  Hitos.faltanReunir = faltanReunir;
  Hitos.textoLoQueFaltaGuion = textoLoQueFalta;
  Hitos.escribirValorGuion = escribirValorGuion;
  Hitos.marcarReunirPorDocumento = marcarReunirPorDocumento;
  Hitos.desmarcarReunirPorDocumento = desmarcarReunirPorDocumento;

  Hitos.guionDe = guionDe;
  Hitos.unirGuion = unir;
  Hitos.cuentaGuion = cuentaGuion;
  Hitos.marcarGuion = marcarGuion;
  Hitos.marcarGuionPorAccion = marcarGuionPorAccion;
  Hitos.anadirGuionPropio = anadirGuionPropio;
  Hitos.cambiarGuionAqui = cambiarGuionAqui;
  Hitos.cambiarPreguntaAqui = cambiarPreguntaAqui;
  Hitos.cambiarGuionPropioTexto = cambiarGuionPropioTexto;
  Hitos.borrarGuionPropio = borrarGuionPropio;
  Hitos.ocultarGuionDeGuia = ocultarGuionDeGuia;
  Hitos.pasarGuionPropioAGuia = pasarGuionPropioAGuia;
  Hitos.elegirEnGuion = elegirEnGuion;
  Hitos.pasoDeGuia = pasoDe;
  Hitos.ACCIONES_GUION = ACCIONES;
})();
