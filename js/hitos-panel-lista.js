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
        '</span>' +
        '<span class="hito-meta">' + metaDeHito(h, ajustes, contexto) + '</span>' +
        /* Fila 129: dar por hechos los anteriores (js/estado-hito.js). */
        (abierto && window.EstadoHito && EstadoHito.puedeSituar(raiz, h.id) ? EstadoHito.botonSituarHTML('hito-situar') : '') +
        '<button type="button" class="hito-desplegar" title="Ver más">▾</button>' +
      '</div>' +
      '<div class="hito-cuerpo oculto">' + cuerpoDeHito(a, h, ajustes, contexto, abierto, nombresDeLaCarpeta, raiz) + '</div>';

    var casillaEl = div.querySelector('.hito-casilla');
    if (casillaEl) {
      casillaEl.onclick = function (ev) { ev.stopPropagation(); };
      casillaEl.onchange = async function () {
        var nuevoEstado = casillaEl.checked ? 'hecho' : 'pendiente';
        /* No se impide nunca, solo se avisa (18-sep-2026, fila 59,
           sección 6 del encargo): si quedan casillas obligatorias sin
           reunir y Francisco sigue igualmente, el hito se marca y se le
           apunta una nota automática. */
        var faltan = (nuevoEstado === 'hecho' && window.Hitos.faltanObligatorios)
          ? Hitos.faltanObligatorios(h, a) : [];
        if (faltan.length) {
          var ok = await U.preguntar('Dar este hito por hecho',
            '<p class="explica">Faltan ' + faltan.length + (faltan.length === 1 ? ' cosa' : ' cosas') +
            ' por reunir: ' + U.escapar(faltan.map(function (r) { return r.texto; }).join(', ')) + '.</p>' +
            '<p class="explica">¿Lo das por hecho igualmente?</p>', 'Darlo por hecho');
          if (!ok) { casillaEl.checked = false; return; }
        }
        /* La nota automática va en la misma escritura que el estado
           (fila 100): antes eran dos, y si fallaba la segunda salía rojo
           con el hito ya marcado. */
        var nota = faltan.length ? 'Dado por hecho con ' + faltan.length +
          (faltan.length === 1 ? ' cosa sin reunir.' : ' cosas sin reunir.') : '';
        try {
          await U.mientrasGuarda(casillaEl, function () { return Hitos.marcar(a.nombre, h.id, nuevoEstado, nota); });
        } catch (e) {
          casillaEl.checked = !casillaEl.checked;
          U.fallo('No he podido guardar el hito', e);
        } finally {
          window.HitosPanel.programarRepintado();
        }
      };
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
     a pantalla completa (js/hito-mesa.js). Desde la fila 147, tres
     tarjetas: el guion (lo pinta js/hito-mesa-guion.js en `.mesa-guion`),
     los documentos, y las notas con la historia. La cabecera (`.mesa-cabecera`) la pone js/hito-mesa.js. Los botones de
     siempre conservan su clase, y los mismos `enganchar…` de cada módulo
     los encuentran dentro de la fila. */
  function cuerpoDeHito(a, h, ajustes, contexto, abierto, nombresDeLaCarpeta, hitos) {
    /* Fila 138: lo que hay que reunir está en el guion. Solo un hito del
       ARCHIVO que aún lo trajera aparte lo enseña, para leer. */
    var htmlRequisitos = (!abierto && window.HitosRequisitos && (h.requisitos || []).length)
      ? HitosRequisitos.bloqueDeRequisitos(a, h) : '';

    /* Fila 147 (docs/MESA-TARJETAS-QUE-SE-ABREN.md): tres tarjetas. Una
       abierta en grande a la izquierda (el guion, los documentos, o las
       notas y la historia) y las otras dos, de resumen, a la derecha. Las
       tres grandes están siempre en el DOM (los botones del guion pulsan
       los de siempre por debajo); cuál se ve lo dice `data-tarjeta` de
       `.mesa-columnas`, que pone js/hito-mesa.js. Los resúmenes los
       rellena js/hito-mesa-tarjetas.js. Las plantillas, los formularios y
       «Comunicar» van a los desplegables de la cabecera (fila 145). */
    var tarjeta = window.HitoMesa && HitoMesa.tarjetaDe ? HitoMesa.tarjetaDe(a.nombre, h.id) : 'guion';
    var volver = '<button type="button" class="enlace mesa-volver-guion">← Volver al guion</button>';
    var grandeGuion = '<section class="mesa-grande mesa-grande-guion" data-tarjeta="guion">' +
      (h.cuerpo ? '<div class="hito-explicacion">' + h.cuerpo + '</div>' : '') +
      '<div class="mesa-guion"></div>' +
    '</section>';

    var documentosHTML = window.HitoMesaDocumentos
      ? HitoMesaDocumentos.filasHTML(a, h, hitos || [], nombresDeLaCarpeta, abierto)
      : (h.documentos || []).map(function (d) {
          return '<span class="hito-documento" data-doc="' + U.escapar(d) + '"><button type="button" class="hito-doc-abrir" data-doc="' +
            U.escapar(d) + '">' + U.escapar(d) + '</button></span>';
        }).join('');
    var grandeDocs = '<section class="mesa-grande mesa-grande-docs mesa-docs" data-tarjeta="docs">' +
        '<div class="mesa-bloque-cabecera"><span class="mesa-grande-titulo">Documentos del hito' +
          (abierto && window.HitosAnadir ? HitosAnadir.botonHTML(a, h) : '') + '</span>' + volver + '</div>' +
        '<div class="mesa-seleccion oculto"></div>' +
        (abierto || (h.documentos || []).length ? '<div class="hito-documentos">' + documentosHTML + '</div>' : '') +
        htmlRequisitos +
        (abierto ? '<div class="mesa-soltar">Suelta aquí un documento del ordenador: va a este hito</div>' : '') +
      '</section>';

    /* Fila 139 (docs/UNA-SOLA-LIBRETA-DE-NOTAS.md): las notas son las del
       asunto escritas desde este hito (js/notas-migracion.js); la historia
       automática del hito se queda aparte, a la derecha (fila 147). */
    var notas = (window.NotasHito ? NotasHito.delHito(a, h.id) : []).slice().reverse();
    var historia = (h.notas || []).slice().reverse();
    var grandeNotas = '<section class="mesa-grande mesa-grande-notas" data-tarjeta="notas">' +
      '<div class="mesa-bloque-cabecera"><span class="mesa-grande-titulo">Notas e historia</span>' + volver + '</div>' +
      '<div class="mesa-notas-columnas">' +
        '<div class="mesa-bloque mesa-notas">' +
          (abierto ? '<div class="nota-nueva">' +
            '<textarea class="campo hito-nota-texto" rows="5" placeholder="Escribe una nota; Intro guarda (Mayúsculas+Intro, otra línea)"></textarea>' +
            '<button type="button" class="boton hito-nota-anadir oculto">Añadir nota</button></div>' : '') +
          '<div class="hito-notas">' + notas.map(function (n) {
            return '<div class="hito-nota"><strong>' + U.escapar(n.quien || '') + '</strong> · ' +
              U.escapar((n.cuando || '').slice(0, 10)) + '<br>' + U.escapar(n.texto) + '</div>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="mesa-bloque mesa-historia"><span class="mesa-bloque-titulo hito-historia-titulo">Historia</span>' +
          '<div class="hito-notas hito-historia">' + (historia.length ? historia.map(function (n) {
            var auto = !window.NotasHito || NotasHito.esAutomatica(n.texto);
            return '<div class="hito-nota' + (auto ? ' hito-nota-auto' : '') + '"><strong>' + U.escapar(n.quien || '') + '</strong> · ' +
              U.escapar((n.cuando || '').slice(0, 10)) + '<br>' + U.escapar(n.texto) + '</div>';
          }).join('') : '<p class="mesa-sin-docs">Nada todavía.</p>') + '</div></div>' +
      '</div>' +
    '</section>';

    var cuantasNormas = (h.normativa || []).filter(function (r) { return r && r.cita; }).length;
    var resumen = function (cual, titulo) {
      return '<div class="mesa-resumen" data-tarjeta="' + cual + '" role="button" tabindex="0" title="Abrir en grande">' +
        '<div class="mesa-resumen-cabecera"><span class="mesa-bloque-titulo">' + titulo + '</span><span class="mesa-resumen-cuenta"></span></div>' +
        '<div class="mesa-resumen-cuerpo"></div></div>';
    };
    var colDerecha = '<div class="mesa-col mesa-col-derecha">' +
      resumen('guion', 'Qué hay que hacer') + resumen('docs', 'Documentos del hito') + resumen('notas', 'Notas e historia') +
      (window.HitosNormativa ? '<details class="mesa-bloque mesa-normativa' + (cuantasNormas ? '' : ' oculto') + '">' +
        '<summary class="mesa-bloque-titulo">Normativa (<span class="mesa-normativa-cuenta">' + cuantasNormas + '</span>)</summary>' +
        HitosNormativa.listaHTML(h.normativa) + '<div class="mesa-normativa-guion"></div></details>' : '') +
    '</div>';
    var colGrande = '<div class="mesa-col mesa-col-grande">' + grandeGuion + grandeDocs + grandeNotas + '</div>';

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

    return '<div class="mesa-cabecera"></div><div class="mesa-columnas" data-tarjeta="' + U.escapar(tarjeta) + '">' +
      colGrande + colDerecha + '</div>' + botones;
  }

  /* Ya se sabe, desde que se pintó el cuerpo, qué documentos siguen en
     la carpeta (nombresDeLaCarpeta, leído una vez en js/hitos-panel.js
     antes de repintar): aquí solo se cuelgan los onclick. Abrir uno
     pide su handle en el momento de pulsarlo, no antes: así no hace
     falta guardar nada más que el nombre, y no se toca el DOM después
     de pintar (evita el problema de siempre con el observador de aquí
     abajo, que vigila #ficha-asunto-cuerpo entero). */
  function engancharDocumentos(div, a, h, abierto) {
    var caja = div.querySelector('.hito-documentos');
    if (caja) {
      Array.prototype.forEach.call(caja.querySelectorAll('.hito-doc-abrir'), function (b) {
        if (b.classList.contains('hito-doc-falta')) return;
        b.onclick = async function () {
          try {
            var handle = await a.handle.getFileHandle(b.dataset.doc);
            if (window.Visor) window.Visor.abrir(handle, b.dataset.doc);
          } catch (e) { /* puede que ya no esté: el próximo repintado lo dirá */ }
        };
      });

      /* El menú de tres puntos de cada documento (fila 103, sección
         2), en vez de la ✕ de siempre. */
      if (abierto && window.HitosDocumentoMenu) HitosDocumentoMenu.engancharTodos(caja, a, h);
    }
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
    engancharDocumentos(div, a, h, abierto);
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
    var notaTa = div.querySelector('.hito-nota-texto');
    if (notaTa) notaTa.onkeydown = function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); var b = div.querySelector('.hito-nota-anadir'); if (b) b.click(); }
    };
    /* Fila 145: de una línea, crece al escribir. */
    if (notaTa) notaTa.oninput = function () { notaTa.style.height = 'auto'; notaTa.style.height = notaTa.scrollHeight + 'px'; };
    var notaBtn = div.querySelector('.hito-nota-anadir');
    if (notaBtn) notaBtn.onclick = async function () {
      var ta = div.querySelector('.hito-nota-texto');
      var texto = (ta.value || '').trim();
      if (!texto) return;
      /* Fila 139: a las notas del asunto, con la etiqueta de este hito. */
      return guardarHito(notaBtn, 'guardar la nota', function () {
        var guardar = window.NotasHito ? NotasHito.anadirDesdeHito(a, h, texto) : Hitos.anadirNota(a.nombre, h.id, texto);
        /* Guardada, la caja se vacía: si no, el repintado (que conserva lo
           escrito) la volvería a llenar con la nota ya guardada. */
        return Promise.resolve(guardar).then(function (r) { ta.value = ''; return r; });
      });
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
      return (x.notas && x.notas.length) || (x.documentos && x.documentos.length);
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
          return (x.notas && x.notas.length) || (x.documentos && x.documentos.length) || conNotas[x.id];
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

  return { bloqueDeHitos: bloqueDeHitos, cambiarRama: cambiarRama, guardarHito: guardarHito };
})();
