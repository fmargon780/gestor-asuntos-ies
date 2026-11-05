/* ============================================================
   comunes-asunto.js — «+ Añadir tarea» y «+ Añadir hito» desde un asunto
   (fila 531, docs/531-TAREAS-E-HITOS-COMUNES.md, puntos 4 a 6 y 8).

   Abren la ventana de la lista común (js/comunes-ventana.js) con «Para»:
     - Este asunto y los siguientes (en la guía): la tarea (o el hito) se
       pone en la guía del tipo, con su marca de común, y llega a los
       asuntos abiertos como siempre llega lo de la guía.
     - Solo este asunto: queda solo aquí; la guía no se toca.
   Una tarea «solo aquí» es una copia suelta: no lleva la marca de común, así
   que «Cambiar la tarea» no la toca después. Lo llama js/hito-mesa-guion.js.
   ============================================================ */
var ComunesAsunto = (function () {

  var PARA_GUIA = 'Este asunto y los siguientes (en la guía)';
  var PARA_AQUI = 'Solo este asunto';

  function tipoDe(a) { return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || ''; }
  function repintar() { if (window.HitosPanel) HitosPanel.programarRepintado(); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function paraTarea(a, h) {
    var l = [];
    if (window.HitoMesaGuion && HitoMesaGuion.puedeAnadirALaGuia(a, h)) l.push({ valor: 'guia', texto: PARA_GUIA });
    l.push({ valor: 'aqui', texto: PARA_AQUI });
    return l;
  }

  /* ---------- tarea ---------- */

  async function ponerTarea(a, h, t, para) {
    var tipo = tipoDe(a);
    if (para === 'guia') {
      var hecho = await GuiasDelCentro.cambiarPasos(tipo, function (pasos) {
        var p = HitoMesaGuion.buscarPasoDeGuia(pasos, h.origenGuia);
        if (!p || (p.opciones && p.opciones.length)) return false;
        p.guion = (p.guion || []).concat([Comunes.lineaDeTarea(t)]);
      }, { claveActual: a.nombre });
      if (!hecho) { U.aviso('Ese hito ya no está en la guía del tipo.', 'ambar'); return; }
      U.aviso('Tarea «' + t.nombre + '» añadida al hito «' + h.titulo + '», en la guía de ' + tipo + '.', 'bueno');
    } else {
      await Hitos.anadirGuionPropio(a.nombre, h.id, t.nombre, { accion: t.accion || '', receta: t.receta || null });
      U.aviso('Tarea «' + t.nombre + '» añadida solo a este asunto.', 'bueno');
    }
    repintar();
  }

  function anadirTarea(a, h) {
    return ComunesVentana.abrir({
      clase: 'tarea', titulo: 'Elegir una tarea para «' + h.titulo + '»', tipo: tipoDe(a), para: paraTarea(a, h),
      alElegir: function (t, para) { ponerTarea(a, h, t, para).catch(function (e) { U.fallo('No he podido añadir la tarea', e); }); }
    });
  }

  /* ---------- hito ---------- */

  async function ponerHito(a, h, hc, para) {
    var tipo = tipoDe(a), listas = await ComunesGuardado.leer();
    if (para === 'guia' && tipo) {
      var N = window.HitosDesdeElAsuntoNucleo, G = window.HitosDesdeElAsuntoGuia;
      var nivel = N.nivelSuperior(await Hitos.hitosDe(a.nombre));
      var idAncla = N.pasoAnclaDeHito(nivel, h.id);
      var antes = await G.instantanea(tipo, a.nombre);
      var pasos = copia(GuiasDelCentro.pasosDe(tipo));
      var nuevo = Comunes.pasoDeHito(hc, listas.tareas);
      N.colocarTrasAncla(pasos, nuevo, idAncla);
      await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
      await N.avisarGuia(tipo, a, antes, N.repartoDe(), function () { return G.desenlazar(a.nombre, nuevo.id); });
    } else {
      var hito = Hitos.normalizarHito({ titulo: hc.nombre, cuerpo: hc.explicacion, clase: 'paso', estado: 'pendiente' });
      hito.guionPropio = (hc.tareas || []).map(function (id) { return Comunes.buscar(listas.tareas, id); }).filter(Boolean).map(function (t) {
        var g = Comunes.lineaDeTarea(t);
        delete g.comun;
        g.id = U.nuevoId('gp');
        return g;
      });
      var resultado = null;
      await Hitos.cambiar(function (d) {
        var entrada = d.porAsunto[a.nombre] || { creados: U.hoyIso(), hitos: [] };
        window.HitosDesdeElAsuntoNucleo.colocarTrasAncla(entrada.hitos, hito, h.id);
        resultado = Hitos.recomputeEnCurso(entrada.hitos);
        d.porAsunto[a.nombre] = entrada;
        return d;
      });
      if (resultado) await Hitos.aplicarEstadoDelHito(a.nombre, resultado);
      U.aviso('Hito «' + hc.nombre + '» añadido solo a este asunto.', 'bueno');
    }
    repintar();
  }

  function anadirHito(a, h) {
    var para = tipoDe(a) ? [{ valor: 'guia', texto: PARA_GUIA }, { valor: 'aqui', texto: PARA_AQUI }] : [{ valor: 'aqui', texto: PARA_AQUI }];
    return ComunesVentana.abrir({
      clase: 'hito', titulo: 'Elegir un hito', tipo: tipoDe(a), para: para,
      alElegir: function (hc, p) { ponerHito(a, h, hc, p).catch(function (e) { U.fallo('No he podido añadir el hito', e); }); }
    });
  }

  /* El hito común del que viene este hito del asunto (por el paso de la guía), o ''. */
  function hitoComunDe(a, h) {
    var p = (window.Hitos && Hitos.pasoDeGuia && h && h.origenGuia) ? Hitos.pasoDeGuia(a, h) : null;
    return (p && p.comun) || '';
  }

  /* Los botones de debajo de las tareas del hito, y su enganche (los llama js/hito-mesa-guion.js). */
  function botonesHTML(a, h) {
    return '<div class="guion-comunes en-linea"><button type="button" class="boton boton-chico comunes-anadir-tarea">+ Añadir tarea</button>' +
      '<button type="button" class="boton boton-chico comunes-anadir-hito">+ Añadir hito</button>' +
      (hitoComunDe(a, h) ? '<button type="button" class="boton boton-chico comunes-cambiar-hito">Cambiar el hito</button>' : '') + '</div>';
  }

  function enganchar(caja, a, h) {
    function q(sel) { return caja.querySelector(sel); }
    if (q('.comunes-anadir-tarea')) q('.comunes-anadir-tarea').onclick = function () { anadirTarea(a, h); };
    if (q('.comunes-anadir-hito')) q('.comunes-anadir-hito').onclick = function () { anadirHito(a, h); };
    if (q('.comunes-cambiar-hito')) q('.comunes-cambiar-hito').onclick = async function () {
      try {
        var listas = await ComunesGuardado.leer(), hc = Comunes.buscar(listas.hitos, hitoComunDe(a, h));
        if (!hc) { U.aviso('Este hito ya no está en la lista de hitos.', 'ambar'); return; }
        ComunesCambiar.hito(hc, { claveActual: a.nombre, asunto: a.nombre, hitoDelAsunto: h.id });
      } catch (e) { U.fallo('No he podido leer la lista', e); }
    };
  }

  return { anadirTarea: anadirTarea, anadirHito: anadirHito, hitoComunDe: hitoComunDe, paraTarea: paraTarea, botonesHTML: botonesHTML, enganchar: enganchar };
})();
window.ComunesAsunto = ComunesAsunto;
