/* ============================================================
   hitos-guion.js — el guion de un hito (24-sep-2026, fila 109,
   docs/EL-HITO-A-PANTALLA-COMPLETA.md, sección 3).

   El guion es la lista de lo que hay que hacer dentro de un hito. Vive
   en su paso de la guía (`guion: [{ id, texto, explicacion, accion,
   normativa }]`), no en hitos.json: el hito lo lee por `origenGuia`,
   igual que la comunicación, así que un guion corregido vale también
   para los asuntos vivos. En el hito solo se guarda el estado:

     guionHecho:  { <id>: { hecho, noaplica, quien, cuando } }
     guionPropio: [{ id, texto }]   (lo añadido solo a este asunto)

   Un paso de guion que desaparece de la guía se deja de ver; su estado
   se queda guardado sin estorbar.

   Se engancha a window.Hitos, como js/hitos-requisitos.js:
     Hitos.guionDe(a, hito)              -> [{ id, texto, explicacion, accion, normativa, propio, hecho, noaplica, quien, cuando }]
     Hitos.cuentaGuion(lista)            -> { hechos, total }
     Hitos.marcarGuion(clave, idHito, idPaso, { hecho?, noaplica? })
     Hitos.marcarGuionPorAccion(a, idHito, accion)  (el primer paso sin marcar con esa acción)
     Hitos.anadirGuionPropio(clave, idHito, texto)

   Se carga después de js/hitos-requisitos.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  var ACCIONES = ['generar', 'registrar', 'comunicar', 'anadir'];

  function tipoDe(a) {
    return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || '';
  }

  /* El paso de la guía de este hito, a cualquier profundidad. */
  function buscarPaso(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      var p = pasos[i];
      if (p.id === id) return p;
      for (var j = 0; j < (p.opciones || []).length; j++) {
        var enc = buscarPaso((p.opciones[j] && p.opciones[j].pasos) || [], id);
        if (enc) return enc;
      }
    }
    return null;
  }

  function pasoDe(a, hito) {
    if (!hito || !hito.origenGuia || !window.GuiasDelCentro) return null;
    return buscarPaso(GuiasDelCentro.pasosDe(tipoDe(a)), hito.origenGuia);
  }

  /* Puro: junta el guion del paso y el propio del asunto con el estado
     guardado en el hito. */
  function unir(guionDelPaso, hito) {
    var estado = (hito && hito.guionHecho) || {};
    var lista = (guionDelPaso || []).map(function (g) {
      return Object.assign({ propio: false }, g, estado[g.id] || {});
    });
    ((hito && hito.guionPropio) || []).forEach(function (g) {
      lista.push(Object.assign({ explicacion: '', accion: '', normativa: null, propio: true }, g, estado[g.id] || {}));
    });
    return lista.map(function (g) {
      return { id: g.id, texto: g.texto || '', explicacion: g.explicacion || '', accion: g.accion || '',
               normativa: g.normativa || null, propio: !!g.propio, hecho: !!g.hecho,
               noaplica: !!g.noaplica, quien: g.quien || '', cuando: g.cuando || '' };
    });
  }

  function guionDe(a, hito) {
    if (!hito || hito.clase === 'decision') return [];
    var paso = pasoDe(a, hito);
    return unir((paso && paso.guion) || [], hito);
  }

  function cuentaGuion(lista) {
    var hechos = (lista || []).filter(function (g) { return g.hecho || g.noaplica; }).length;
    return { hechos: hechos, total: (lista || []).length };
  }

  async function editarHito(clave, idHito, mutador) {
    var datos = await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = Hitos.buscar(entrada.hitos, idHito);
      if (h) mutador(h);
      return d;
    });
    var entrada = datos.porAsunto[clave];
    return entrada ? Hitos.buscar(entrada.hitos, idHito) : null;
  }

  function quien() { return (window.App && App.E && App.E.usuario) || ''; }

  /* `cambio`: { hecho: true/false } o { noaplica: true/false }. Marcar uno
     quita el otro. Desmarcar deja el paso como estaba al principio. */
  function marcarGuion(clave, idHito, idPaso, cambio) {
    return editarHito(clave, idHito, function (h) {
      h.guionHecho = h.guionHecho || {};
      var e = h.guionHecho[idPaso] || {};
      if ('hecho' in cambio) { e.hecho = !!cambio.hecho; if (e.hecho) e.noaplica = false; }
      if ('noaplica' in cambio) { e.noaplica = !!cambio.noaplica; if (e.noaplica) e.hecho = false; }
      if (e.hecho || e.noaplica) { e.quien = quien(); e.cuando = U.ahora(); }
      else { delete e.quien; delete e.cuando; }
      h.guionHecho[idPaso] = e;
    });
  }

  /* Marcar solo (decisión 2): cuando pasa la acción desde ese hito, el
     primer paso del guion sin marcar con esa `accion`. No crítico: si
     falla, la acción ya está hecha (ámbar). Devuelve el paso marcado, o
     null si no había ninguno. */
  async function marcarGuionPorAccion(a, idHito, accion) {
    /* `a` puede ser el asunto o solo su clave (el nombre de la carpeta). */
    if (typeof a === 'string') {
      var clave = a;
      a = ((window.App && App.E && App.E.listaAbiertos) || []).filter(function (x) { return x.nombre === clave; })[0] ||
        { nombre: clave, ficha: (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[clave]) || {} };
    }
    if (!a || !idHito || ACCIONES.indexOf(accion) === -1) return null;
    try {
      var datos = await Hitos.leer();
      var entrada = datos.porAsunto[a.nombre];
      var h = entrada && Hitos.buscar(entrada.hitos, idHito);
      if (!h) return null;
      var paso = guionDe(a, h).filter(function (g) { return g.accion === accion && !g.hecho && !g.noaplica; })[0];
      if (!paso) return null;
      await marcarGuion(a.nombre, idHito, paso.id, { hecho: true });
      if (window.HitosPanel) HitosPanel.programarRepintado();
      return paso;
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('Hecho, pero no he podido marcar el paso del guion', e);
      return null;
    }
  }

  function anadirGuionPropio(clave, idHito, texto) {
    texto = String(texto || '').trim();
    if (!texto) return Promise.resolve(null);
    return editarHito(clave, idHito, function (h) {
      h.guionPropio = (h.guionPropio || []).concat([{ id: U.nuevoId('gp'), texto: texto }]);
    });
  }

  Hitos.guionDe = guionDe;
  Hitos.unirGuion = unir;
  Hitos.cuentaGuion = cuentaGuion;
  Hitos.marcarGuion = marcarGuion;
  Hitos.marcarGuionPorAccion = marcarGuionPorAccion;
  Hitos.anadirGuionPropio = anadirGuionPropio;
  Hitos.pasoDeGuia = pasoDe;
  Hitos.ACCIONES_GUION = ACCIONES;
})();
