/* Fila 660: la ventana de la lista común (js/comunes-ventana.js) ya no se abre desde un asunto («+ Añadir tarea» y «+ Añadir hito»
   son js/anadir-tarea.js y js/anadir-hito.js), pero sigue siendo la que usa el editor de la guía. Para seguir probando la ventana
   (buscar, crear ahí mismo, «Para»), la prueba la abre con lo que hacía `ComunesAsunto` antes de la fila 660. */
export const AYUDANTES = `
(function () {
  function tipoDe(a) { return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || ''; }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  async function ponerTarea(a, h, t, para) {
    var tipo = tipoDe(a);
    if (para === 'guia') {
      await GuiasDelCentro.cambiarPasos(tipo, function (pasos) {
        var p = HitoMesaGuion.buscarPasoDeGuia(pasos, h.origenGuia);
        if (!p || (p.opciones && p.opciones.length)) return false;
        p.guion = (p.guion || []).concat([Comunes.lineaDeTarea(t)]);
      }, { claveActual: a.nombre });
    } else {
      await Hitos.anadirGuionPropio(a.nombre, h.id, t.nombre, { accion: t.accion || '', receta: t.receta || null });
    }
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }
  window.__anadirTarea = function (a, h) {
    var para = [];
    if (HitoMesaGuion.puedeAnadirALaGuia(a, h)) para.push({ valor: 'guia', texto: 'Este asunto y los siguientes (en la guía)' });
    para.push({ valor: 'aqui', texto: 'Solo este asunto' });
    return ComunesVentana.abrir({ clase: 'tarea', titulo: 'Tareas de la lista para «' + h.titulo + '»', tipo: tipoDe(a), para: para,
      alElegir: function (t, p) { ponerTarea(a, h, t, p); } });
  };
  async function ponerHito(a, h, hc, para) {
    var tipo = tipoDe(a), listas = await ComunesGuardado.leer();
    if (para === 'guia' && tipo) {
      var N = HitosDesdeElAsuntoNucleo, G = HitosDesdeElAsuntoGuia;
      var nivel = N.nivelSuperior(await Hitos.hitosDe(a.nombre));
      var idAncla = N.pasoAnclaDeHito(nivel, h.id);
      var antes = await G.instantanea(tipo, a.nombre);
      var pasos = copia(GuiasDelCentro.pasosDe(tipo));
      var nuevo = Comunes.pasoDeHito(hc, listas.tareas);
      N.colocarTrasAncla(pasos, nuevo, idAncla);
      await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
    } else {
      var hito = Hitos.normalizarHito({ titulo: hc.nombre, cuerpo: hc.explicacion, clase: 'paso', estado: 'pendiente', responsable: hc.responsable || '' });
      hito.guionPropio = (hc.tareas || []).map(function (id) { return Comunes.buscar(listas.tareas, id); }).filter(Boolean).map(function (t) {
        var g = Comunes.lineaDeTarea(t); delete g.comun; g.id = U.nuevoId('gp'); return g;
      });
      await Hitos.cambiar(function (d) {
        var entrada = d.porAsunto[a.nombre] || { creados: U.hoyIso(), hitos: [] };
        HitosDesdeElAsuntoNucleo.colocarTrasAncla(entrada.hitos, hito, h.id);
        d.porAsunto[a.nombre] = entrada;
        return d;
      });
    }
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }
  window.__anadirHito = async function (a) {
    var hitos = HitosDesdeElAsuntoNucleo.nivelSuperior(await Hitos.hitosDe(a.nombre));
    var detras = hitos.map(function (x, i) { return { valor: x.id, texto: (i + 1) + '. ' + (x.titulo || 'Hito') + (i === hitos.length - 1 ? ' (al final)' : '') }; });
    var para = tipoDe(a) ? [{ valor: 'guia', texto: 'Este asunto y los siguientes (en la guía)' }, { valor: 'aqui', texto: 'Solo este asunto' }] : [{ valor: 'aqui', texto: 'Solo este asunto' }];
    return ComunesVentana.abrir({ clase: 'hito', titulo: 'Hitos de la lista', tipo: tipoDe(a), para: para, detras: detras,
      alElegir: function (hc, p, idDetras) { ponerHito(a, hitos.filter(function (x) { return x.id === idDetras; })[0] || hitos[hitos.length - 1], hc, p); } });
  };
})();
`;
