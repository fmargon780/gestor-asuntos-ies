/* ============================================================
   hitos-sincronizar.js — los pasos nuevos de una guía llegan a los
   asuntos abiertos (24-sep-2026, fila 118,
   docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md).

   Los hitos se copian de la guía una sola vez, al abrir la ficha por
   primera vez (Hitos.crearDesdeGuia, js/hitos.js). Desde esta fila,
   al guardar la guía de un tipo (js/guias-enganche.js) y, como red de
   seguridad, al abrir la ficha (js/hitos-panel.js), los pasos que la
   guía tiene y el asunto nunca ha tenido se añaden en su sitio. Nada
   de lo que ya tiene el asunto se toca, ni se reordena, ni se borra.

   `pasosConocidos` (en cada entrada de `porAsunto`): los ids de paso de
   la guía que ya han pasado alguna vez por ese asunto. Así un hito
   quitado a mano, o podado al cambiar de rama, no vuelve. Hitos.leer
   lo completa en cada lectura con los `origenGuia` que tenga el asunto
   (pasosConocidosDe, llamado desde `normalizar` de js/hitos.js), así
   que cualquier escritura de hitos.json lo deja guardado, también al
   crear los hitos y en los asuntos de antes de esta fila.

   Se engancha a window.Hitos sin envolver nada, como js/hitos-archivo.js,
   y se carga justo detrás de él.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }

  /* Los `origenGuia` de una lista de hitos, a cualquier profundidad. */
  function origenesDe(hitos, out) {
    out = out || [];
    (hitos || []).forEach(function (h) {
      if (h && h.origenGuia) out.push(String(h.origenGuia));
      if (h && h.clase === 'decision') {
        (h.opciones || []).forEach(function (o) { origenesDe(o.hitos, out); });
      }
    });
    return out;
  }

  /* Los ids de todos los pasos de una guía, a cualquier profundidad. */
  function idsDePasos(pasos, out) {
    out = out || [];
    (pasos || []).forEach(function (p) {
      if (p && p.id) out.push(String(p.id));
      if (esPregunta(p)) p.opciones.forEach(function (o) { idsDePasos(o.pasos, out); });
    });
    return out;
  }

  function unirSinRepetir(a, b) {
    var vistos = {}, out = [];
    (a || []).concat(b || []).forEach(function (x) {
      x = String(x);
      if (x && !vistos[x]) { vistos[x] = true; out.push(x); }
    });
    return out;
  }

  /* Lo que se guarda: lo apuntado más lo que el asunto tiene ahora. */
  function pasosConocidosDe(entrada, hitos) {
    var guardados = Array.isArray(entrada && entrada.pasosConocidos) ? entrada.pasosConocidos : [];
    return unirSinRepetir(guardados, origenesDe(hitos));
  }

  /* Añade a `lista` (hitos de un nivel) los pasos de `pasos` (la guía
     de ese mismo nivel) que falten, y baja a las preguntas que ya
     existen. `ya` es un mapa id → true de lo que no hay que añadir. */
  function completarNivel(lista, pasos, ya, cuenta) {
    (pasos || []).forEach(function (p, i) {
      if (!p || !p.id) return;
      if (!ya[p.id]) {
        var nuevo = Hitos.pasoAHito(p);
        /* Detrás del hito del paso anterior de la guía que sí esté en
           este nivel; si no hay ninguno, al principio. */
        var sitio = 0;
        for (var k = i - 1; k >= 0; k--) {
          var idAnterior = pasos[k] && pasos[k].id;
          var pos = posicionDe(lista, idAnterior);
          if (pos !== -1) { sitio = pos + 1; break; }
        }
        lista.splice(sitio, 0, nuevo);
        idsDePasos([p]).forEach(function (id) { ya[id] = true; });
        cuenta.n++;
        return;
      }
      if (!esPregunta(p)) return;
      var h = lista[posicionDe(lista, p.id)];
      if (!h || h.clase !== 'decision') return;
      p.opciones.forEach(function (o, j) {
        var opt = (h.opciones || []).filter(function (x) { return x.id === o.id; })[0];
        if (!opt) {
          /* Opción nueva de una pregunta que ya existe: entera, en su
             sitio (detrás de la opción anterior que esté). */
          opt = { id: o.id, texto: String(o.titulo || ''), hitos: [] };
          var sitioOpt = 0;
          for (var m = j - 1; m >= 0; m--) {
            var ant = p.opciones[m] && p.opciones[m].id;
            var posOpt = -1;
            h.opciones.forEach(function (x, n) { if (x.id === ant) posOpt = n; });
            if (posOpt !== -1) { sitioOpt = posOpt + 1; break; }
          }
          h.opciones.splice(sitioOpt, 0, opt);
          cuenta.n++;
        }
        completarNivel(opt.hitos, o.pasos, ya, cuenta);
      });
    });
  }

  function posicionDe(lista, idPaso) {
    if (!idPaso) return -1;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] && lista[i].origenGuia === idPaso && !lista[i].delTipoAnterior) return i;
    }
    return -1;
  }

  /* La función pura: no toca disco ni pantalla, y no cambia `hitos`.
     Devuelve { hitos, anadidos, conocidos, enCurso }: la lista nueva,
     cuántos pasos (u opciones) se han añadido, los ids de paso que hay
     que guardar en `pasosConocidos`, y el hito que haya pasado a "en
     curso" (solo si no había ninguno), para poner el estado del asunto. */
  function pasosQueFaltan(hitos, pasos, conocidos) {
    var lista = JSON.parse(JSON.stringify(hitos || [])).map(Hitos.normalizarHito);
    var yaLista = unirSinRepetir(conocidos, origenesDe(lista));
    var ya = {};
    yaLista.forEach(function (id) { ya[id] = true; });
    var cuenta = { n: 0 };
    completarNivel(lista, pasos || [], ya, cuenta);
    var enCurso = cuenta.n ? Hitos.recomputeEnCurso(lista) : null;
    return {
      hitos: lista,
      anadidos: cuenta.n,
      conocidos: unirSinRepetir(yaLista, idsDePasos(pasos)),
      enCurso: enCurso
    };
  }

  /* Aplica pasosQueFaltan a una entrada de `porAsunto` ya leída (dentro
     de un Hitos.cambiar). Devuelve lo mismo que pasosQueFaltan. */
  function completarEntrada(entrada, pasos) {
    var r = pasosQueFaltan(entrada.hitos, pasos, entrada.pasosConocidos);
    if (r.anadidos) entrada.hitos = r.hitos;
    entrada.pasosConocidos = r.conocidos;
    return r;
  }

  /* Al guardar la guía de un tipo: todos los asuntos abiertos de ese
     tipo que ya tienen hitos, en UNA sola escritura de hitos.json, por
     la cola de guardado. Devuelve a cuántos asuntos ha llegado algo. */
  async function llevarAAbiertos(tipo, pasos) {
    if (!tipo || !window.Gestor || typeof Gestor.asuntos !== 'function') return 0;
    var claves = Gestor.asuntos().filter(function (a) {
      var t = (window.App && typeof App.tipoDeAsunto === 'function')
        ? App.tipoDeAsunto(a) : ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '');
      return t === tipo;
    }).map(function (a) { return a.nombre; });
    if (!claves.length) return 0;
    var llegados = 0;
    var enCurso = [];
    await Hitos.cambiar(function (d) {
      llegados = 0;
      enCurso = [];
      claves.forEach(function (clave) {
        var entrada = d.porAsunto[clave];
        if (!entrada || !(entrada.hitos || []).length) return;   /* se crearán enteros al abrirlo */
        var r = completarEntrada(entrada, pasos);
        if (r.anadidos) llegados++;
        if (r.enCurso) enCurso.push({ clave: clave, hito: r.enCurso });
      });
      return d;
    });
    for (var i = 0; i < enCurso.length; i++) {
      await Hitos.aplicarEstadoDelHito(enCurso[i].clave, enCurso[i].hito);
    }
    return llegados;
  }

  /* La red de seguridad al abrir la ficha (js/hitos-panel.js): solo
     escribe si de verdad falta algo, mirándolo antes en memoria. */
  async function completarAsunto(clave, entradaLeida, pasos) {
    if (!entradaLeida || !(entradaLeida.hitos || []).length || !(pasos || []).length) return null;
    if (!pasosQueFaltan(entradaLeida.hitos, pasos, entradaLeida.pasosConocidos).anadidos) return null;
    var resultado = null, anadidos = 0;
    var datos = await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada || !(entrada.hitos || []).length) return d;
      var r = completarEntrada(entrada, pasos);
      anadidos = r.anadidos;
      resultado = r.enCurso;
      return d;
    });
    if (resultado) await Hitos.aplicarEstadoDelHito(clave, resultado);
    if (!anadidos) return null;
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : null;
  }

  Hitos.pasosQueFaltan = pasosQueFaltan;
  Hitos.pasosConocidosDe = pasosConocidosDe;
  Hitos.llevarGuiaAAbiertos = llevarAAbiertos;
  Hitos.completarAsuntoConGuia = completarAsunto;
})();
