/* ============================================================
   hitos-archivo.js — segunda mitad del modelo de hitos (16-sep-2026).

   js/hitos.js se quedaba corto de sitio (sección 13 de docs/HITOS.md
   pide partirlo si pasa de las 400 líneas): el modelo básico —leer,
   escribir, crear desde la guía, marcar— vive allí; aquí va el resto,
   enganchado al mismo objeto window.Hitos:

     - Añadir, quitar, reordenar y editar un hito a mano.
     - Las bifurcaciones: elegir una opción y cambiar de rama
       (sección 4 del encargo).
     - Los responsables de Ajustes › Hitos (sección 6).
     - El historial que se escribe al archivar, y que se vuelve a
       cargar si el asunto se reabre (sección 2.3).

   Se carga después de js/relacionados.js: necesita App.cerrarAsunto y
   App.reabrirAsunto ya definidos (y, si el asunto tiene relacionados,
   ya envueltos por ese fichero), para engancharse detrás sin tocarlo.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  var nuevoId = Hitos.nuevoId;
  var normalizarHito = Hitos.normalizarHito;
  var cambiar = Hitos.cambiar;
  var buscar = Hitos.buscar;
  var recomputeEnCurso = Hitos.recomputeEnCurso;
  var aplicarEstadoDelHito = Hitos.aplicarEstadoDelHito;
  var PAPELES = Hitos.PAPELES;

  /* ==========================================================
     CRUD A MANO: añadir, quitar, reordenar, editar
     ========================================================== */

  async function anadirHito(clave, titulo) {
    var resultado = null;
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave] || { creados: U.hoyIso(), hitos: [] };
      entrada.hitos.push(normalizarHito({ id: nuevoId(), titulo: titulo, clase: 'paso', estado: 'pendiente' }));
      resultado = recomputeEnCurso(entrada.hitos);
      d.porAsunto[clave] = entrada;
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  async function quitarHito(clave, idHito) {
    var resultado = null;
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      (function quitarDe(lista) {
        for (var i = 0; i < lista.length; i++) {
          if (lista[i].id === idHito) { lista.splice(i, 1); return true; }
          if (lista[i].clase === 'decision') {
            for (var j = 0; j < lista[i].opciones.length; j++) {
              if (quitarDe(lista[i].opciones[j].hitos)) return true;
            }
          }
        }
        return false;
      })(entrada.hitos);
      resultado = recomputeEnCurso(entrada.hitos);
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  /* Solo al nivel de arriba: mover un hito entre ramas complicaría las
     bifurcaciones sin que Francisco lo haya pedido. */
  async function mover(clave, idHito, salto) {
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var lista = entrada.hitos;
      var i = -1;
      for (var k = 0; k < lista.length; k++) { if (lista[k].id === idHito) { i = k; break; } }
      if (i === -1) return d;
      var j = i + salto;
      if (j < 0 || j >= lista.length) return d;
      var tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp;
      return d;
    });
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  async function editar(clave, idHito, mutador) {
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = buscar(entrada.hitos, idHito);
      if (h) mutador(h);
      return d;
    });
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  function guardarCampos(clave, idHito, cambios) {
    return editar(clave, idHito, function (h) {
      if ('titulo' in cambios) h.titulo = String(cambios.titulo || '');
      if ('responsable' in cambios) h.responsable = String(cambios.responsable || '');
      if ('fecha' in cambios) { h.fecha = String(cambios.fecha || ''); h.fechaManual = !!cambios.fecha; }
      /* 20-sep-2026, fila 79, apartado 4.6: "Pedírmelo a mí" / "Dejarlo
         solo informativo", del menú del propio hito. Afecta solo a este
         hito de este asunto, nunca a la guía del tipo. */
      if ('soloInformativo' in cambios) h.soloInformativo = !!cambios.soloInformativo;
    });
  }

  function anadirNota(clave, idHito, texto) {
    return editar(clave, idHito, function (h) {
      h.notas.push({ texto: String(texto || ''), quien: (window.App && App.E.usuario) || '', cuando: U.ahora() });
    });
  }

  function anadirDocumento(clave, idHito, nombre) {
    return editar(clave, idHito, function (h) {
      if (h.documentos.indexOf(nombre) === -1) h.documentos.push(nombre);
    });
  }

  function quitarDocumento(clave, idHito, nombre) {
    return editar(clave, idHito, function (h) {
      h.documentos = h.documentos.filter(function (x) { return x !== nombre; });
    });
  }

  async function quitarAsunto(clave) {
    var entrada = null;
    await cambiar(function (d) { entrada = d.porAsunto[clave] || null; delete d.porAsunto[clave]; return d; });
    return entrada;
  }

  async function restaurarAsunto(clave, entrada) {
    if (!entrada) return;
    await cambiar(function (d) { d.porAsunto[clave] = entrada; return d; });
  }

  /* ==========================================================
     LAS BIFURCACIONES (sección 4 del encargo)
     ========================================================== */

  /* Elegir (o deshacer) la opción de un hito de clase "decision". Al
     elegirla, se cuenta como resuelta y se avanza al primer hito
     pendiente de la rama, igual que al marcar cualquier otro hito. */
  async function elegirOpcion(clave, idDecision, idOpcion) {
    var resultado = null;
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = buscar(entrada.hitos, idDecision);
      if (!h || h.clase !== 'decision') return d;
      var mismo = h.elegida === idOpcion;
      h.elegida = mismo ? null : idOpcion;
      h.estado = h.elegida ? 'hecho' : 'pendiente';
      if (h.elegida) h.hechoEl = U.hoyIso(); else delete h.hechoEl;   /* fila 102 */
      resultado = recomputeEnCurso(entrada.hitos);
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  /* Cambiar de rama: los hitos de la rama vieja que no tengan nada
     apuntado se quitan del todo; los que tengan notas o documentos se
     marcan "noaplica" y se quedan (huerfanos(), en js/hitos.js, los
     pinta plegados al final). Devuelve además los títulos de los que
     se han quedado, para poder avisar de ellos. */
  /* La rama que se deja, entera, a cualquier profundidad (fila 95):
     lo vacío se quita; lo que tiene notas o documentos se queda como
     "noaplica". Una pregunta de dentro se queda si tiene algo suyo o
     si le queda algo en alguna de sus ramas. */
  function podar(lista, quedados) {
    return (lista || []).filter(function (x) {
      var suyo = (x.notas && x.notas.length) || (x.documentos && x.documentos.length);
      var dentro = false;
      if (x.clase === 'decision') {
        x.opciones.forEach(function (o) {
          o.hitos = podar(o.hitos, quedados);
          if (o.hitos.length) dentro = true;
        });
      }
      if (!suyo && !dentro) return false;
      x.estado = 'noaplica';
      if (suyo) quedados.push(x.titulo);
      return true;
    });
  }

  async function cambiarRama(clave, idDecision, idOpcionNueva) {
    var resultado = null;
    var quedados = [];
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = buscar(entrada.hitos, idDecision);
      if (!h || h.clase !== 'decision') return d;
      var vieja = h.elegida;
      if (vieja && vieja !== idOpcionNueva) {
        var opt = h.opciones.filter(function (o) { return o.id === vieja; })[0];
        if (opt) opt.hitos = podar(opt.hitos, quedados);
      }
      h.elegida = idOpcionNueva;
      h.estado = 'hecho';
      h.hechoEl = U.hoyIso();   /* fila 102 */
      resultado = recomputeEnCurso(entrada.hitos);
      return d;
    });
    if (resultado) await aplicarEstadoDelHito(clave, resultado);
    return { hitos: datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [], quedados: quedados };
  }

  /* ==========================================================
     RESPONSABLES (sección 6)
     ========================================================== */

  function resolverResponsable(idResponsable, ajustes, contexto) {
    if (!idResponsable) return null;
    var persona = (ajustes.responsables || []).filter(function (r) { return r.id === idResponsable; })[0];
    if (persona) return { texto: persona.nombre, resuelto: true };
    var papel = PAPELES.filter(function (p) { return p.id === idResponsable; })[0];
    if (!papel) return { texto: idResponsable, resuelto: true };
    var c = contexto || {};
    if (idResponsable === 'tercero' && c.tercero) return { texto: c.tercero, resuelto: true };
    if (idResponsable === 'relacionado' && c.relacionados && c.relacionados.length) {
      return { texto: c.relacionados[0].nombre, resuelto: true };
    }
    if (idResponsable === 'tutor' && c.tutor) return { texto: c.tutor, resuelto: true };
    return { texto: papel.nombre, resuelto: false };
  }

  async function anadirResponsable(id, nombre) {
    return (await cambiar(function (d) {
      d.ajustes.responsables.push({ id: id, nombre: nombre, clase: 'centro' });
      return d;
    })).ajustes;
  }

  async function renombrarResponsable(id, nombre) {
    return (await cambiar(function (d) {
      var r = d.ajustes.responsables.filter(function (x) { return x.id === id; })[0];
      if (r) r.nombre = nombre;
      return d;
    })).ajustes;
  }

  async function quitarResponsable(id) {
    return (await cambiar(function (d) {
      d.ajustes.responsables = d.ajustes.responsables.filter(function (x) { return x.id !== id; });
      return d;
    })).ajustes;
  }

  async function guardarNoLectivos(lista) {
    return (await cambiar(function (d) {
      d.ajustes.noLectivos = Hitos.normalizarAjustes({ noLectivos: lista }).noLectivos;
      return d;
    })).ajustes;
  }

  /* ==========================================================
     AL ARCHIVAR: EL HISTORIAL (sección 2.3)

     Cuando se archiva un asunto, sus hitos salen de hitos.json y se
     escriben en su propia carpeta, ya dentro del ARCHIVO, como
     "HISTORIAL DE TRAMITACION.txt". Legible sin la aplicación, con un
     bloque por hito. Mismo criterio que "DONDE ESTA ESTE ASUNTO.txt"
     de js/relacionados.js: nunca se copia ningún documento.

     Debajo del texto legible se deja, tras una marca, el propio JSON
     de los hitos: es lo que permite volver a cargarlos si el asunto se
     reabre, sin dejar de ser un fichero de texto que cualquiera puede
     abrir y entender.
     ========================================================== */

  var NOMBRE_HISTORIAL = 'HISTORIAL DE TRAMITACION.txt';
  var MARCA = '\n\n---\nNo toques lo de aquí abajo: son los datos para recuperar los hitos si se ' +
              'reabre el asunto.\n';

  var ROTULOS_ESTADO = { pendiente: 'PENDIENTE', encurso: 'EN CURSO', hecho: 'HECHO', noaplica: 'NO APLICA' };

  /* Distinta a propósito de U.fechaCorta (fila 71, docs/COSAS-
     REPETIDAS.md, 2.3): esta ni pone el mes en letra, se queda con la
     fecha ISO tal cual llega. No escribe la fecha igual que las otras
     tres, así que se deja como estaba. */
  function fechaCorta(iso) {
    return String(iso || '').slice(0, 10);
  }

  function lineasDeHito(h, numero, sangria) {
    var pre = sangria || '';
    var lineas = [];
    var cabecera = pre + numero + '. ' + (h.titulo || '(sin título)');
    var detalle = [];
    if (h.clase === 'decision') {
      var opt = (h.opciones || []).filter(function (o) { return o.id === h.elegida; })[0];
      detalle.push('pregunta, elegida: ' + (opt ? opt.texto : '(sin elegir)'));
    } else {
      detalle.push(ROTULOS_ESTADO[h.estado] || h.estado);
    }
    if (h.desde) detalle.push('desde ' + fechaCorta(h.desde));
    if (h.fecha) detalle.push('fecha límite ' + fechaCorta(h.fecha));
    if (h.responsable) detalle.push('responsable: ' + h.responsable);
    lineas.push(cabecera + '  [' + detalle.join(' · ') + ']');
    (h.notas || []).forEach(function (n) {
      lineas.push(pre + '     nota (' + (n.quien || '?') + ', ' + fechaCorta(n.cuando) + '): ' + n.texto);
    });
    (h.documentos || []).forEach(function (d) {
      lineas.push(pre + '     documento apuntado: ' + d);
    });
    if (h.clase === 'decision') {
      (h.opciones || []).forEach(function (o) {
        var esLaElegida = o.id === h.elegida;
        var conAlgo = (o.hitos || []).filter(function (x) { return esLaElegida || x.estado === 'noaplica'; });
        conAlgo.forEach(function (sub, i) {
          lineas = lineas.concat(lineasDeHito(sub, i + 1, pre + '  '));
        });
      });
    }
    return lineas;
  }

  function textoHistorial(clave, hitos, creados) {
    var lineas = [
      'HISTORIAL DE TRAMITACIÓN',
      clave,
      'Archivado el ' + fechaCorta(U.hoyIso()),
      'Hitos creados el ' + fechaCorta(creados || ''),
      ''
    ];
    hitos.forEach(function (h, i) { lineas = lineas.concat(lineasDeHito(h, i + 1)); lineas.push(''); });
    return lineas.join('\n') + MARCA + JSON.stringify({ creados: creados || '', hitos: hitos });
  }

  function leerHitosDeHistorial(texto) {
    var i = String(texto || '').indexOf(MARCA);
    if (i === -1) return null;
    try {
      var datos = JSON.parse(texto.slice(i + MARCA.length));
      return (datos && Array.isArray(datos.hitos)) ? datos : null;
    } catch (e) { return null; }
  }

  U.envolver(window.App, 'App.cerrarAsunto', 'hitos-archivo.js', function (comoEra) {
    return async function (a) {
      var clave = a.nombre;
      await comoEra(a);
      var ficha = App.E.registro.asuntos[clave] || {};
      if (ficha.estado !== 'cerrado') return;   /* cancelado, o ha fallado */
      try {
        var entrada = await hitosDeConCreados(clave);
        if (!entrada || !entrada.hitos.length) return;
        var destino = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], true);
        var carpetaAsunto = await destino.getDirectoryHandle(clave);
        var texto = textoHistorial(clave, entrada.hitos, entrada.creados);
        await Carpetas.escribirTexto(carpetaAsunto, NOMBRE_HISTORIAL, texto);
        await quitarAsunto(clave);
      } catch (e) {
        U.accesorio('El asunto se ha archivado, pero no he podido guardar el historial de hitos', e);
      }
    };
  });

  async function hitosDeConCreados(clave) {
    var datos = await Hitos.leer();
    return datos.porAsunto[clave] || null;
  }

  U.envolver(window.App, 'App.reabrirAsunto', 'hitos-archivo.js', function (comoEra) {
    return async function (a) {
      var clave = a.nombre;
      var textoPrevio = null;
      try { textoPrevio = await Carpetas.leerTexto(a.handle, NOMBRE_HISTORIAL); } catch (e) { textoPrevio = null; }
      await comoEra(a);
      var ficha = App.E.registro.asuntos[clave] || {};
      if (ficha.estado !== 'abierto' || !textoPrevio) return;
      var datos = leerHitosDeHistorial(textoPrevio);
      if (!datos) {
        U.aviso('Este asunto tenía un historial de hitos, pero no he podido leerlo. ' +
                'Se reabre sin hitos, y el fichero se queda donde estaba.', 'ambar');
        return;
      }
      try {
        await restaurarAsunto(clave, { creados: datos.creados || U.hoyIso(), hitos: datos.hitos });
        var carpeta = await App.E.abiertos.getDirectoryHandle(clave);
        await carpeta.removeEntry(NOMBRE_HISTORIAL);
      } catch (e) {
        U.accesorio('Los hitos se han recuperado, pero no he podido borrar el historial viejo', e);
      }
    };
  });

  Object.assign(Hitos, {
    anadirHito: anadirHito, quitarHito: quitarHito, mover: mover,
    guardarCampos: guardarCampos, anadirNota: anadirNota,
    anadirDocumento: anadirDocumento, quitarDocumento: quitarDocumento,
    quitarAsunto: quitarAsunto, restaurarAsunto: restaurarAsunto,
    elegirOpcion: elegirOpcion, cambiarRama: cambiarRama,
    resolverResponsable: resolverResponsable,
    anadirResponsable: anadirResponsable, renombrarResponsable: renombrarResponsable,
    quitarResponsable: quitarResponsable, guardarNoLectivos: guardarNoLectivos,
    NOMBRE_HISTORIAL: NOMBRE_HISTORIAL,
    /* para las pruebas */
    _textoHistorial: textoHistorial, _leerHitosDeHistorial: leerHitosDeHistorial
  });
})();
