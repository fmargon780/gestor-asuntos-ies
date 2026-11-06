/* ============================================================
   hitos-guion-orden.js — el orden de las tareas de un hito (fila 553,
   docs/553-PARTES-DEL-HITO.md).

   «Subir» y «Bajar» del «⋮» de cada tarea cambian el orden en este asunto al
   momento: el hito guarda `guionOrden` (los ids de las tareas, en su orden;
   `Hitos.guionDe` lo respeta y lo que no esté en la lista va al final). Si el
   orden de las tareas de la guía queda distinto del de la guía, sale una
   franja con dos botones:
     - «Guardar también en la guía»: la guía del tipo guarda el orden nuevo,
       sin repartirlo a los asuntos abiertos (esos se quedan como estaban:
       antes de tocar la guía se les fija su orden de ahora).
     - «Solo en este asunto»: la guía no cambia y la franja se va
       (`guionOrdenVisto`, el orden que ya se ha dado por bueno).
   Las tareas «solo aquí» se mueven igual, pero no cuentan para la franja ni
   van a la guía.

     Hitos.moverGuion(a, idHito, clave, delta)      (-1 sube, +1 baja)
     Hitos.posicionGuion(a, h, clave)               -> { indice, total }
     Hitos.ordenDeLaGuiaCambiado(a, h)              -> true si hay que preguntar
     Hitos.dejarOrdenSoloAqui(a, idHito)
     Hitos.guardarOrdenEnLaGuia(a, h)
   Se carga después de js/hitos-guion.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;
  var I = Hitos._guionInterno;

  function claves(lista) { return (lista.bloques || []).map(function (b) { return b.clave; }); }
  function deLaGuia(lista) { return (lista.bloques || []).filter(function (b) { return b.deGuia; }).map(function (b) { return b.clave; }); }

  function posicion(a, h, clave) {
    var c = claves(I.guionDe(a, h));
    return { indice: c.indexOf(clave), total: c.length };
  }

  function mover(a, idHito, clave, delta) {
    return I.editarHito(a.nombre, idHito, function (h) {
      var c = claves(I.guionDe(a, h)), i = c.indexOf(clave), j = i + delta;
      if (i === -1 || j < 0 || j >= c.length) return;
      c[i] = c[j];
      c[j] = clave;
      h.guionOrden = c;
    });
  }

  function ordenDeLaGuiaCambiado(a, h) {
    var lista = I.guionDe(a, h), ahora = deLaGuia(lista);
    if (ahora.join(',') === lista.ordenGuia.join(',')) return false;
    return (h.guionOrdenVisto || '') !== ahora.join(',');
  }

  function dejarOrdenSoloAqui(a, idHito) {
    return I.editarHito(a.nombre, idHito, function (h) { h.guionOrdenVisto = deLaGuia(I.guionDe(a, h)).join(','); });
  }

  /* Los otros asuntos abiertos del tipo se quedan como están: se les fija su orden de ahora (hay que llamarlo ANTES de tocar la guía). */
  async function fijarEnAbiertos(origenGuia, claveActual) {
    var abiertos = (window.Gestor && Gestor.asuntos) ? Gestor.asuntos() : [];
    var tipoActual = '';
    for (var i = 0; i < abiertos.length; i++) {
      var o = abiertos[i];
      if (o.nombre !== claveActual) continue;
      tipoActual = (o.leido && o.leido.tipo) || (o.ficha && o.ficha.tipo) || '';
    }
    for (var k = 0; k < abiertos.length; k++) {
      var a = abiertos[k];
      if (a.nombre === claveActual || (a.ficha && a.ficha.tipoUnidoDe)) continue;
      if (((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '') !== tipoActual) continue;
      var hitos = await Hitos.hitosDe(a.nombre);
      for (var j = 0; j < hitos.length; j++) {
        if (hitos[j].origenGuia !== origenGuia || (hitos[j].guionOrden && hitos[j].guionOrden.length)) continue;
        await I.editarHito(a.nombre, hitos[j].id, function (h) { h.guionOrden = claves(I.guionDe(a, h)); });
      }
    }
  }

  /* Pone las tareas de la guía en el orden de este asunto, en los mismos huecos (las escondidas aquí no se mueven). */
  function ordenarPaso(paso, deseado) {
    var huecos = [], mover = [];
    (paso.guion || []).forEach(function (g, i) { if (deseado.indexOf(g.id) !== -1) { huecos.push(i); mover.push(g); } });
    mover.sort(function (x, y) { return deseado.indexOf(x.id) - deseado.indexOf(y.id); });
    huecos.forEach(function (pos, n) { paso.guion[pos] = mover[n]; });
  }

  async function guardarEnLaGuia(a, h) {
    var tipo = (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || '';
    var deseado = deLaGuia(I.guionDe(a, h));
    await fijarEnAbiertos(h.origenGuia, a.nombre);
    var hecho = await GuiasDelCentro.cambiarPasos(tipo, function (pasos) {
      var p = HitoMesaGuion.buscarPasoDeGuia(pasos, h.origenGuia);
      if (!p || (p.opciones && p.opciones.length)) return false;
      ordenarPaso(p, deseado);
    }, { claveActual: a.nombre, sinLlevar: true });
    return hecho;
  }

  Hitos.moverGuion = mover;
  Hitos.posicionGuion = posicion;
  Hitos.ordenDeLaGuiaCambiado = ordenDeLaGuiaCambiado;
  Hitos.dejarOrdenSoloAqui = dejarOrdenSoloAqui;
  Hitos.guardarOrdenEnLaGuia = guardarEnLaGuia;
})();
