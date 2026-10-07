/* ============================================================
   hitos-sincronizar.js — los pasos nuevos de una guía llegan a los
   asuntos abiertos (24-sep-2026, fila 118,
   docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md).

   Los hitos se copian de la guía una sola vez, al abrir la ficha por
   primera vez (Hitos.crearDesdeGuia, js/hitos.js). Desde esta fila,
   al guardar la guía de un tipo (js/guias-enganche.js) y, como red de
   seguridad, al abrir la ficha (js/hitos-panel.js), los pasos que la
   guía tiene y el asunto nunca ha tenido se añaden en su sitio. Nada
   de lo que ya tiene el asunto se toca ni se borra. Solo se reordena
   cuando quien guarda cambió el orden de los hitos en «Cambiar la guía»
   (7-oct-2026, fila 300, docs/ORDEN-DE-LA-GUIA-LLEGA-A-LOS-ASUNTOS.md):
   `ordenDeLaGuia`, y solo con los hitos sin hacer.

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

  /* Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md): la marca «Nos toca» /
     «Esperamos a…» de cada paso (`toca`, `tocaA`) llega a los hitos que
     ya existen, a cualquier profundidad. Devuelve cuántos ha cambiado. */
  function retocarMarcas(lista, pasos) {
    var porId = {};
    (function recoger(ps) {
      (ps || []).forEach(function (p) {
        if (p && p.id) porId[p.id] = p;
        if (esPregunta(p)) p.opciones.forEach(function (o) { recoger(o.pasos); });
      });
    })(pasos);
    var n = 0;
    (function recorrer(hs) {
      (hs || []).forEach(function (h) {
        var p = h.origenGuia && !h.delTipoAnterior ? porId[h.origenGuia] : null;
        if (p) {
          var toca = (p.toca === 'nos' || p.toca === 'espera') ? p.toca : '';
          var tocaA = toca === 'espera' ? String(p.tocaA || '') : '';
          if ((h.toca || '') !== toca || (h.tocaA || '') !== tocaA) {
            if (toca) h.toca = toca; else delete h.toca;
            if (tocaA) h.tocaA = tocaA; else delete h.tocaA;
            n++;
          }
        }
        if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { recorrer(o.hitos); });
      });
    })(lista);
    return n;
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
    var retocados = retocarMarcas(lista, pasos || []);
    return {
      hitos: lista,
      anadidos: cuenta.n,
      retocados: retocados,
      conocidos: unirSinRepetir(yaLista, idsDePasos(pasos)),
      enCurso: enCurso
    };
  }

  /* ==========================================================
     Fila 300: el orden nuevo de la guía llega a los asuntos abiertos,
     solo para los hitos sin hacer. Función pura (ni disco ni pantalla,
     no cambia `hitos`). Devuelve { hitos, movidos, actual }: la lista
     nueva, cuántos hitos han cambiado de posición y el hito que ha
     pasado a ser el actual (o null si el actual no cambia). */
  function idsDe(pasos) {
    return (pasos || []).map(function (p) { return p && p.id ? String(p.id) : ''; }).filter(Boolean);
  }

  function ordenCambiado(antes, ahora) {
    var a = idsDe(antes), b = idsDe(ahora);
    var comunesA = a.filter(function (id) { return b.indexOf(id) !== -1; });
    var comunesB = b.filter(function (id) { return a.indexOf(id) !== -1; });
    return comunesA.join('|') !== comunesB.join('|');
  }

  /* Un nivel: `lista` son los hitos del asunto; `antes` y `ahora`, los pasos
     de ese mismo nivel en la guía. Devuelve cuántos hitos se han movido. */
  function ordenarNivel(lista, antes, ahora) {
    var movidos = 0;
    var idsAhora = idsDe(ahora);
    if (ordenCambiado(antes, ahora)) {
      var sitios = [], movibles = [];
      lista.forEach(function (h, i) {
        var id = h && h.origenGuia && !h.delTipoAnterior ? String(h.origenGuia) : '';
        if (id && idsAhora.indexOf(id) !== -1 &&
            (h.estado === 'pendiente' || h.estado === 'encurso')) {
          sitios.push(i); movibles.push(h);
        }
      });
      movibles.sort(function (x, y) {
        return idsAhora.indexOf(String(x.origenGuia)) - idsAhora.indexOf(String(y.origenGuia));
      });
      sitios.forEach(function (pos, k) {
        if (lista[pos] !== movibles[k]) movidos++;
        lista[pos] = movibles[k];
      });
    }
    /* Dentro de cada opción de cada pregunta que exista en el asunto. */
    lista.forEach(function (h) {
      if (!h || h.clase !== 'decision' || !h.origenGuia || h.delTipoAnterior) return;
      var pAhora = (ahora || []).filter(function (p) { return p && p.id === h.origenGuia; })[0];
      var pAntes = (antes || []).filter(function (p) { return p && p.id === h.origenGuia; })[0];
      if (!esPregunta(pAhora) || !esPregunta(pAntes)) return;
      pAhora.opciones.forEach(function (o) {
        var opt = (h.opciones || []).filter(function (x) { return x.id === o.id; })[0];
        var oAntes = pAntes.opciones.filter(function (x) { return x.id === o.id; })[0];
        if (opt && oAntes) movidos += ordenarNivel(opt.hitos, oAntes.pasos, o.pasos);
      });
    });
    return movidos;
  }

  function ordenDeLaGuia(hitos, pasosAntes, pasosAhora) {
    var lista = JSON.parse(JSON.stringify(hitos || []));
    var movidos = ordenarNivel(lista, pasosAntes || [], pasosAhora || []);
    var actual = null;
    if (movidos) {
      var sinHacer = Hitos.visibles(lista).filter(function (h) { return h.estado === 'pendiente' || h.estado === 'encurso'; });
      var enCurso = sinHacer.filter(function (h) { return h.estado === 'encurso'; })[0];
      if (enCurso && enCurso.cadena) {
        actual = null;   /* un «Hacer este hito» a medias sigue siendo el actual */
      } else if (sinHacer[0] && sinHacer[0] !== enCurso) {
        if (enCurso) enCurso.estado = 'pendiente';   /* conserva todo lo suyo, como al desmarcar */
        sinHacer[0].estado = 'encurso';
        sinHacer[0].desde = U.hoyIso();
        actual = sinHacer[0];
      }
    }
    return { hitos: lista, movidos: movidos, actual: actual };
  }

  /* Aplica pasosQueFaltan a una entrada de `porAsunto` ya leída (dentro
     de un Hitos.cambiar). Devuelve lo mismo que pasosQueFaltan. */
  function completarEntrada(entrada, pasos) {
    var r = pasosQueFaltan(entrada.hitos, pasos, entrada.pasosConocidos);
    if (r.anadidos || r.retocados) entrada.hitos = r.hitos;
    entrada.pasosConocidos = r.conocidos;
    return r;
  }

  /* Fila 207 (docs/UNIR-DOS-TIPOS.md): un asunto que ha pasado de tipo
     al unir dos tipos en uno lleva `ficha.tipoUnidoDe` con el nombre del
     tipo que desapareció. Sus hitos son los de aquella guía, no los de
     la guía del tipo que se queda: no se le ofrece la guía nueva, así
     que tampoco debe recibir sus pasos nuevos, ni ahora ni más adelante
     (si Francisco vuelve a cambiar esa guía la semana que viene). */
  function tieneTipoUnido(clave) {
    var registro = window.App && App.E && App.E.registro;
    var ficha = registro && registro.asuntos && registro.asuntos[clave];
    return !!(ficha && ficha.tipoUnidoDe);
  }

  /* Al guardar la guía de un tipo: todos los asuntos abiertos de ese
     tipo que ya tienen hitos, en UNA sola escritura de hitos.json, por
     la cola de guardado. Devuelve a cuántos asuntos ha llegado algo; con
     `pasosAntes` (solo «Cambiar la guía», fila 300) recoloca además el
     orden y devuelve { llegados, recolocados }. */
  async function llevarAAbiertos(tipo, pasos, pasosAntes) {
    var conOrden = Array.isArray(pasosAntes);
    var vacio = conOrden ? { llegados: 0, recolocados: 0 } : 0;
    if (!tipo || !window.Gestor || typeof Gestor.asuntos !== 'function') return vacio;
    var claves = Gestor.asuntos().filter(function (a) {
      var t = (window.App && typeof App.tipoDeAsunto === 'function')
        ? App.tipoDeAsunto(a) : ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '');
      return t === tipo && !tieneTipoUnido(a.nombre);
    }).map(function (a) { return a.nombre; });
    if (!claves.length) return vacio;
    var llegados = 0, recolocados = 0;
    var enCurso = [];
    await Hitos.cambiar(function (d) {
      llegados = 0; recolocados = 0;
      enCurso = [];
      claves.forEach(function (clave) {
        var entrada = d.porAsunto[clave];
        if (!entrada || !(entrada.hitos || []).length) return;   /* se crearán enteros al abrirlo */
        var r = completarEntrada(entrada, pasos);
        if (r.anadidos) llegados++;
        if (r.enCurso) enCurso.push({ clave: clave, hito: r.enCurso });
        if (conOrden) {
          var o = ordenDeLaGuia(entrada.hitos, pasosAntes, pasos);
          if (o.movidos) {
            entrada.hitos = o.hitos;
            recolocados++;
            if (o.actual) enCurso.push({ clave: clave, hito: o.actual });
          }
        }
      });
      return d;
    });
    for (var i = 0; i < enCurso.length; i++) {
      await Hitos.aplicarEstadoDelHito(enCurso[i].clave, enCurso[i].hito);
    }
    return conOrden ? { llegados: llegados, recolocados: recolocados } : llegados;
  }

  /* La red de seguridad al abrir la ficha (js/hitos-panel.js): solo
     escribe si de verdad falta algo, mirándolo antes en memoria. */
  async function completarAsunto(clave, entradaLeida, pasos) {
    if (!entradaLeida || !(entradaLeida.hitos || []).length || !(pasos || []).length) return null;
    if (tieneTipoUnido(clave)) return null;
    var previa = pasosQueFaltan(entradaLeida.hitos, pasos, entradaLeida.pasosConocidos);
    if (!previa.anadidos && !previa.retocados) return null;
    var resultado = null, anadidos = 0;
    var datos = await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada || !(entrada.hitos || []).length) return d;
      var r = completarEntrada(entrada, pasos);
      anadidos = r.anadidos + r.retocados;
      resultado = r.enCurso;
      return d;
    });
    if (resultado) await Hitos.aplicarEstadoDelHito(clave, resultado);
    if (!anadidos) return null;
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : null;
  }

  Hitos.pasosQueFaltan = pasosQueFaltan;
  Hitos.ordenDeLaGuia = ordenDeLaGuia;
  Hitos.pasosConocidosDe = pasosConocidosDe;
  Hitos.llevarGuiaAAbiertos = llevarAAbiertos;
  Hitos.completarAsuntoConGuia = completarAsunto;
})();
