/* ============================================================
   hitos-panel-lista.js — cómo se pinta cada hito por dentro (16-sep-2026).

   La orquestación (el observador, cuándo repintar, el bloque de
   entrada de un asunto sin hitos) vive en js/hitos-panel.js; aquí solo
   la fila de un hito, su cuerpo desplegado y el cambio de rama. Los
   dos ficheros se hablan por window.HitosPanel (programarRepintado,
   pedirYAnadirHito, observadorPausar/observadorReanudar).

   Se carga después de js/hitos-panel.js.
   ============================================================ */
var HitosPanelLista = (function () {

  function contextoResponsable(a) {
    var f = a.ficha || {};
    return {
      tercero: f.tercero || (a.leido && a.leido.resto) || '',
      relacionados: f.relacionados || [],
      tutor: null
    };
  }

  /* Marca (o desmarca) un hito desde su casilla, sea la de la lista o
     la que pulsa por debajo "Marcar como hecho" de la mesa (fila 173,
     punto 5, js/hito-mesa.js). Devuelve si el guardado ha terminado
     bien, para que quien llama sepa si de verdad se ha marcado. */
  async function marcarDesdeCasilla(casillaEl, a, h) {
    var nuevoEstado = casillaEl.checked ? 'hecho' : 'pendiente';
    /* No se impide nunca, solo se avisa (18-sep-2026, fila 59,
       sección 6 del encargo): si quedan casillas obligatorias sin
       reunir y Francisco sigue igualmente, el hito se marca y se le
       apunta una nota automática. */
    var faltan = (nuevoEstado === 'hecho' && window.Hitos.faltanObligatorios)
      ? Hitos.faltanObligatorios(h, a) : [];
    /* Fila 524: lo que falta por firmar o registrar en este hito; se avisa, no se impide. Un solo cuadro a la vez:
       si ya hay el de las casillas obligatorias, ese va después y no se repite. */
    if (nuevoEstado === 'hecho' && window.AvisosFalta && !(await AvisosFalta.alMarcarHito(a, h))) { casillaEl.checked = false; return false; }
    if (faltan.length) {
      var ok = await U.preguntar('Dar este hito por hecho',
        '<p class="explica">Faltan ' + faltan.length + (faltan.length === 1 ? ' cosa' : ' cosas') +
        ' por reunir: ' + U.escapar(faltan.map(function (r) { return r.texto; }).join(', ')) + '.</p>' +
        '<p class="explica">¿Lo das por hecho igualmente?</p>', 'Darlo por hecho');
      if (!ok) { casillaEl.checked = false; return false; }
    }
    /* La nota automática va en la misma escritura que el estado
       (fila 100): antes eran dos, y si fallaba la segunda salía rojo
       con el hito ya marcado. */
    var nota = faltan.length ? 'Dado por hecho con ' + faltan.length +
      (faltan.length === 1 ? ' cosa sin reunir.' : ' cosas sin reunir.') : '';
    /* Fila 229: darlo por hecho y reabrirlo dejan su línea en el registro. */
    if (!nota && window.RegistroAsunto) nota = RegistroAsunto.notaDeEstado(h.estado, nuevoEstado);
    try {
      await U.mientrasGuarda(casillaEl, function () { return Hitos.marcar(a.nombre, h.id, nuevoEstado, nota); });
      /* «Avisar a quien lo pide» (fila 195): solo al marcar hecho, con
         el hito ya actualizado en memoria. Un aviso roto no debe
         impedir que el hito quede marcado. */
      if (nuevoEstado === 'hecho' && window.AvisosLoPide) {
        h.estado = 'hecho';
        try { await AvisosLoPide.alMarcarHecho(a, h); } catch (e) { /* ver arriba */ }
      }
      /* Fila 249 (docs/POR-LIQUIDAR.md): el último hito hecho de un tipo que hay que
         liquidar pasa el asunto a «Por liquidar»; desmarcar uno lo devuelve. */
      if (window.PorLiquidar) {
        if (nuevoEstado === 'hecho') await PorLiquidar.alMarcarHecho(a, h);
        else await PorLiquidar.alDesmarcar(a);
      }
      return true;
    } catch (e) {
      casillaEl.checked = !casillaEl.checked;
      U.fallo('No he podido guardar el hito', e);
      return false;
    } finally {
      window.HitosPanel.programarRepintado();
    }
  }

  function bloqueDeHitos(a, hitos, ajustes, abierto, nombresDeLaCarpeta) {
    var raiz = document.createElement('div');

    var c = Hitos.cuenta(hitos);
    var cuenta = document.createElement('p');
    cuenta.className = 'explica hitos-cuenta';
    cuenta.textContent = c.hechos + ' de ' + c.total + ' hitos hechos.' +
      (abierto ? ' Lo que marques lo ve todo el que abra la aplicación.' : '');
    raiz.appendChild(cuenta);

    var lista = document.createElement('div');
    lista.className = 'lista-hitos';
    var visibles = Hitos.visibles(hitos);
    visibles.forEach(function (h) {
      lista.appendChild(filaDeHito(a, hitos, h, ajustes, abierto, nombresDeLaCarpeta));
    });
    raiz.appendChild(lista);

    var huerfanos = Hitos.huerfanos(hitos);
    if (huerfanos.length) {
      var det = document.createElement('details');
      det.className = 'hitos-huerfanos';
      /* Fila 94: también los que se quedaron del tipo anterior del asunto. */
      var delTipo = huerfanos.some(function (h) { return h.delTipoAnterior; });
      det.innerHTML = '<summary>' + huerfanos.length +
        (delTipo
          ? (huerfanos.length === 1 ? ' hito que ya no aplica' : ' hitos que ya no aplican') +
            ' (de una rama descartada o del tipo anterior, pero tenían algo apuntado)'
          : (huerfanos.length === 1 ? ' hito de una rama descartada' : ' hitos de ramas descartadas') +
            ' (no aplica, pero tenían notas o documentos)') + '</summary>';
      var dentro = document.createElement('div');
      dentro.className = 'lista-hitos';
      huerfanos.forEach(function (h) { dentro.appendChild(filaDeHito(a, hitos, h, ajustes, false, nombresDeLaCarpeta)); });
      det.appendChild(dentro);
      raiz.appendChild(det);
    }

    if (abierto) {
      var mas = document.createElement('button');
      mas.type = 'button';
      mas.className = 'boton boton-ancho';
      mas.textContent = '+ Añadir un hito';
      mas.onclick = function () { window.HitosPanel.pedirYAnadirHito(a); };
      raiz.appendChild(mas);
    }

    return raiz;
  }

  function metaDeHito(h, ajustes, contexto) {
    var trozos = [];
    if (h.estado === 'hecho' && h.sinRespuesta) trozos.push('<span class="hito-sin-respuesta">Hecho · sin respuesta</span>');   /* fila 286 */
    if (h.fecha) trozos.push('<span class="hito-fecha">' + U.escapar(Plazos.legible(h.fecha)) + '</span>');
    if (h.responsable) {
      var r = Hitos.resolverResponsable(h.responsable, ajustes, contexto);
      if (r) trozos.push('<span class="hito-resp' + (r.resuelto ? '' : ' hito-resp-sinresolver') + '">' +
        U.escapar(r.texto) + '</span>');
    }
    return trozos.join('');
  }

  function filaDeHito(a, raiz, h, ajustes, abierto, nombresDeLaCarpeta) {
    var contexto = contextoResponsable(a);
    var div = document.createElement('div');
    div.className = 'hito hito-' + h.estado + (h.clase === 'decision' ? ' hito-decision' : '') +
      (h.soloInformativo ? ' hito-informativo' : '');
    div.dataset.id = h.id;

    if (h.clase === 'decision' && !h.elegida) {
      div.innerHTML =
        '<div class="hito-linea">' +
          '<span class="hito-marca-pregunta">?</span>' +
          '<span class="hito-titulo">' + U.escapar(h.titulo || 'Pregunta') + '</span>' +
        '</div>' +
        (h.cuerpo ? '<div class="hito-explicacion">' + h.cuerpo + '</div>' : '') +
        '<div class="hito-opciones">' + h.opciones.map(function (o) {
          return '<button type="button" class="boton hito-opcion" data-opcion="' +
            U.escapar(o.id) + '">' + U.escapar(o.texto || 'Opción') + '</button>';
        }).join('') + '</div>';
      if (abierto) {
        Array.prototype.forEach.call(div.querySelectorAll('.hito-opcion'), function (b) {
          b.onclick = async function () {
            try {
              await U.mientrasGuarda(b, function () { return Hitos.elegirOpcion(a.nombre, h.id, b.dataset.opcion); });
              window.HitosPanel.programarRepintado();
            } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
          };
        });
      }
      return div;
    }

    var casilla = '<input type="checkbox" class="hito-casilla"' +
      (h.estado === 'hecho' ? ' checked' : '') + (abierto ? '' : ' disabled') + '>';
    if (h.clase === 'decision') {
      var opt = h.opciones.filter(function (o) { return o.id === h.elegida; })[0];
      casilla = '<span class="hito-marca-pregunta">?</span>';
      div.dataset.opcion = h.elegida;
      var elegidaTxt = opt ? opt.texto : '';
    }

    div.innerHTML =
      '<div class="hito-linea">' +
        casilla +
        '<span class="hito-titulo">' + U.escapar(h.titulo) +
          (h.clase === 'decision' ? ' <span class="suave">— ' + U.escapar(elegidaTxt) + '</span>' : '') +
          (h.soloInformativo ? ' <span class="etiqueta-informativo">Informativo</span>' : '') +
          (window.HitosDesdeElAsunto ? HitosDesdeElAsunto.marcaSoloAquiHTML(a, h) : '') +   /* fila 416 */
          (window.SoloSi ? SoloSi.faltaHTML(h.cond === 'falta' ? h.faltaCampo : '') : '') +   /* fila 576 */
        '</span>' +
        '<span class="hito-meta">' + metaDeHito(h, ajustes, contexto) + '</span>' +
        /* Fila 129: dar por hechos los anteriores (js/estado-hito.js). */
        /* Fila 162: el hito actual lleva «Paso actual»; los de después, «Saltar a este paso». */
        (window.EstadoHito && EstadoHito.idActual && EstadoHito.idActual(raiz, ajustes) === h.id ? EstadoHito.etiquetaPasoActualHTML()
          : (abierto && window.EstadoHito && EstadoHito.puedeSituar(raiz, h.id) ? EstadoHito.botonSituarHTML('hito-situar') : '')) +
        '<button type="button" class="hito-desplegar" data-ayuda-clave="ver-mas">▾</button>' +
      '</div>' +
      '<div class="hito-cuerpo oculto">' + cuerpoDeHito(a, h, ajustes, contexto, abierto, nombresDeLaCarpeta, raiz) + '</div>';

    var casillaEl = div.querySelector('.hito-casilla');
    if (casillaEl) {
      casillaEl.onclick = function (ev) { ev.stopPropagation(); };
      casillaEl.onchange = function () { marcarDesdeCasilla(casillaEl, a, h); };
    }
    var linea = div.querySelector('.hito-linea');
    var cuerpoDiv = div.querySelector('.hito-cuerpo');
    /* Pulsar el hito abre su mesa a pantalla completa (fila 109). */
    function abrirMesa() {
      if (window.HitoMesa) HitoMesa.abrir(a, h.id); else cuerpoDiv.classList.toggle('oculto');
    }
    linea.querySelector('.hito-desplegar').onclick = abrirMesa;
    linea.querySelector('.hito-titulo').onclick = abrirMesa;
    var situarBtn = linea.querySelector('.hito-situar');
    if (situarBtn) situarBtn.onclick = function (ev) { ev.stopPropagation(); EstadoHito.situar(a, h.id, situarBtn); };

    engancharCuerpo(div, a, h, abierto);
    return div;
  }

  /* El cuerpo de un hito es su mesa de trabajo (24-sep-2026, fila 109,
     docs/EL-HITO-A-PANTALLA-COMPLETA.md): solo se ve con el hito abierto
     a pantalla completa (js/hito-mesa.js). Desde la fila 425, el hito entero
     en una columna: el guion (lo pinta js/hito-mesa-guion.js en `.mesa-guion`);
     fila 638: sin campos, documentos ni registro propios. La cabecera (`.mesa-cabecera`) la pone js/hito-mesa.js. Los botones de
     siempre conservan su clase, y los mismos `enganchar…` de cada módulo
     los encuentran dentro de la fila. */
  function cuerpoDeHito(a, h, ajustes, contexto, abierto, nombresDeLaCarpeta, hitos) {
    /* Fila 138: lo que hay que reunir está en el guion. Solo un hito del
       ARCHIVO que aún lo trajera aparte lo enseña, para leer. */
    var htmlRequisitos = (!abierto && window.HitosRequisitos && (h.requisitos || []).length)
      ? HitosRequisitos.bloqueDeRequisitos(a, h) : '';

    /* Fila 638 (docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md): el hito es su explicación y sus tareas (las pinta
       js/hito-mesa-guion.js en `.mesa-guion`, cada una con su único botón y su documento colgado). Ya no hay los
       recuadros «Tareas», «Campos», «Documentos» ni «Registro»: los datos están en «Datos» de la derecha, los
       documentos cuelgan de su tarea y en «Documentos de la carpeta», y las notas y lo hecho van al registro del
       asunto (bloque «Registro» de la derecha, con el hito de cada línea). */
    var grandeGuion = (h.cuerpo ? '<div class="hito-explicacion">' + h.cuerpo + '</div>' : '') +
      '<div class="mesa-grande-guion" data-tarjeta="guion"><div class="mesa-guion"></div></div>';

    var cuantasNormas = (h.normativa || []).filter(function (r) { return r && r.cita; }).length;
    var columna = '<div class="mesa-col mesa-col-hito">' + grandeGuion + htmlRequisitos +
      (window.HitosNormativa ? '<details class="mesa-bloque mesa-normativa' + (cuantasNormas ? '' : ' oculto') + '">' +
        '<summary class="mesa-bloque-titulo">Normativa (<span class="mesa-normativa-cuenta">' + cuantasNormas + '</span>)</summary>' +
        HitosNormativa.listaHTML(h.normativa) + '<div class="mesa-normativa-guion"></div></details>' : '') +
    '</div>';

    /* Lo que va en el menú ⋯ de la cabecera de la mesa (js/hito-mesa.js
       pulsa estos botones por debajo), y "Cambiar de rama" de siempre.
       Los botones de siempre de generar y comunicar quedan escondidos: los
       pulsan las acciones del guion. */
    var botones = abierto ? '<div class="hito-botones">' +
      (h.clase === 'decision' ? '<button type="button" class="boton hito-cambiar-rama">Cambiar de rama</button>' : '') +
      '<button type="button" class="boton hito-solo-informativo oculto">' +
        (h.soloInformativo ? 'Pedírmelo a mí' : 'Dejarlo solo informativo') + '</button>' +
      '<button type="button" class="boton boton-peligro hito-quitar oculto">Quitar este hito</button>' +
      '<span class="mesa-ocultos oculto">' + (window.HitosGenerar ? HitosGenerar.botonHTML(a, h) : '') +
        (window.HitosComunicar ? HitosComunicar.botonHTML(a, h) : '') + '</span></div>' : '';

    return '<div class="mesa-cabecera"></div><div class="mesa-columnas">' + columna + '</div>' + botones;
  }

  /* Guardar un cambio de un hito con el control apagado mientras tanto,
     aviso rojo si falla y repintado siempre (fila 100,
     docs/AVISOS-QUE-DICEN-LA-VERDAD.md: antes, si fallaba, el error se
     perdía y no se repintaba). */
  async function guardarHito(control, queNo, hacer) {
    try {
      await U.mientrasGuarda(control, hacer);
    } catch (e) {
      U.fallo('No he podido ' + queNo, e);
    } finally {
      window.HitosPanel.programarRepintado();
    }
  }

  function engancharCuerpo(div, a, h, abierto) {
    if (!abierto) return;
    if (window.HitosAnadir) HitosAnadir.engancharBoton(div, a, h);   /* fila 103 */
    if (window.HitosComunicar) HitosComunicar.engancharBoton(div, a, h);
    if (window.HitosGenerar) HitosGenerar.engancharBoton(div, a, h);   /* fila 102 */
    var resp = div.querySelector('.hito-campo-responsable');
    if (resp) resp.onchange = function () {
      return guardarHito(resp, 'guardar el responsable', function () { return Hitos.guardarCampos(a.nombre, h.id, { responsable: resp.value }); });
    };
    var fecha = div.querySelector('.hito-campo-fecha');
    if (fecha) fecha.onchange = function () {
      return guardarHito(fecha, 'guardar la fecha', function () { return Hitos.guardarCampos(a.nombre, h.id, { fecha: fecha.value }); });
    };
    var quitar = div.querySelector('.hito-quitar');
    if (quitar) quitar.onclick = async function () {
      var ok = await U.preguntar('Quitar este hito', '<p><strong>' + U.escapar(h.titulo) + '</strong></p>', 'Quitar');
      if (!ok) return;
      return guardarHito(quitar, 'quitar el hito', function () { return Hitos.quitarHito(a.nombre, h.id); });
    };
    var cambiarRamaBtn = div.querySelector('.hito-cambiar-rama');
    if (cambiarRamaBtn) cambiarRamaBtn.onclick = function () { mostrarOpcionesDeRama(div, a, h); };
    var soloInfBtn = div.querySelector('.hito-solo-informativo');
    if (soloInfBtn) soloInfBtn.onclick = function () {
      return guardarHito(soloInfBtn, 'guardarlo', function () {
        return Hitos.guardarCampos(a.nombre, h.id, { soloInformativo: !h.soloInformativo });
      });
    };
  }

  /* Cambiar de rama (la misma pregunta de siempre si la rama de ahora
     tiene cosas apuntadas). La usa también la mesa (js/hito-mesa-guion.js). */
  async function cambiarRama(a, h, idOpcion, control) {
    if (idOpcion === h.elegida) return;
    var opt = h.opciones.filter(function (o) { return o.id === h.elegida; })[0];
    var conAlgo = ((opt && opt.hitos) || []).filter(function (x) {
      return Hitos.notasPropias(x).length || (x.documentos && x.documentos.length);
    });
    if (conAlgo.length) {
      var ok = await U.preguntar('Cambiar de rama',
        '<p>Estos hitos de la rama actual tienen notas o documentos apuntados. Se marcan ' +
        '"No aplica" y se quedan al final, plegados:</p>' +
        '<ul class="lista-repetidos">' + conAlgo.map(function (x) {
          return '<li>' + U.escapar(x.titulo) + '</li>';
        }).join('') + '</ul>', 'Cambiar igualmente');
      if (!ok) return;
    }
    try {
      await U.mientrasGuarda(control || null, function () { return Hitos.cambiarRama(a.nombre, h.id, idOpcion); });
      window.HitosPanel.programarRepintado();
    } catch (e) { U.aviso('No he podido cambiar de rama: ' + U.mensajeDeError(e), 'malo'); }
  }

  function mostrarOpcionesDeRama(div, a, h) {
    var caja = div.querySelector('.hito-cuerpo');
    var fila = document.createElement('div');
    fila.className = 'hito-opciones';
    fila.innerHTML = h.opciones.map(function (o) {
      return '<button type="button" class="boton hito-opcion' + (o.id === h.elegida ? ' elegida' : '') +
        '" data-opcion="' + U.escapar(o.id) + '">' + U.escapar(o.texto || 'Opción') + '</button>';
    }).join('');
    /* Este trozo se añade a mano, fuera de un repintado entero: sin
       pausar el observador un instante, el propio añadido se
       detectaría como un cambio y un repintado a los 30ms lo borraría
       antes de que se pudiera pulsar ningún botón. */
    window.HitosPanel.observadorPausar();
    caja.appendChild(fila);
    window.HitosPanel.observadorReanudar();
    Array.prototype.forEach.call(fila.querySelectorAll('.hito-opcion'), function (b) {
      b.onclick = async function () {
        if (b.dataset.opcion === h.elegida) return;
        var opt = h.opciones.filter(function (o) { return o.id === h.elegida; })[0];
        var conNotas = window.NotasHito ? NotasHito.idsConNotas(a.nombre) : {};   /* fila 139 */
        var conAlgo = ((opt && opt.hitos) || []).filter(function (x) {
          return Hitos.notasPropias(x).length || (x.documentos && x.documentos.length) || conNotas[x.id];
        });
        if (conAlgo.length) {
          var ok = await U.preguntar('Cambiar de rama',
            '<p>Estos hitos de la rama actual tienen notas o documentos apuntados. Se marcan ' +
            '"No aplica" y se quedan al final, plegados:</p>' +
            '<ul class="lista-repetidos">' + conAlgo.map(function (x) {
              return '<li>' + U.escapar(x.titulo) + '</li>';
            }).join('') + '</ul>', 'Cambiar igualmente');
          if (!ok) return;
        }
        try {
          await U.mientrasGuarda(b, function () { return Hitos.cambiarRama(a.nombre, h.id, b.dataset.opcion); });
          window.HitosPanel.programarRepintado();
        } catch (e) { U.aviso('No he podido cambiar de rama: ' + U.mensajeDeError(e), 'malo'); }
      };
    });
  }

  return {
    bloqueDeHitos: bloqueDeHitos, cambiarRama: cambiarRama, guardarHito: guardarHito,
    marcarDesdeCasilla: marcarDesdeCasilla
  };
})();
