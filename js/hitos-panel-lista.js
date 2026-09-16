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

  function bloqueDeHitos(a, hitos, ajustes, abierto) {
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
      lista.appendChild(filaDeHito(a, hitos, h, ajustes, abierto));
    });
    raiz.appendChild(lista);

    var huerfanos = Hitos.huerfanos(hitos);
    if (huerfanos.length) {
      var det = document.createElement('details');
      det.className = 'hitos-huerfanos';
      det.innerHTML = '<summary>' + huerfanos.length +
        (huerfanos.length === 1 ? ' hito de una rama descartada' : ' hitos de ramas descartadas') +
        ' (no aplica, pero tenían notas o documentos)</summary>';
      var dentro = document.createElement('div');
      dentro.className = 'lista-hitos';
      huerfanos.forEach(function (h) { dentro.appendChild(filaDeHito(a, hitos, h, ajustes, false)); });
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

  function filaDeHito(a, raiz, h, ajustes, abierto) {
    var contexto = contextoResponsable(a);
    var div = document.createElement('div');
    div.className = 'hito hito-' + h.estado + (h.clase === 'decision' ? ' hito-decision' : '');
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
              await Hitos.elegirOpcion(a.nombre, h.id, b.dataset.opcion);
              window.HitosPanel.programarRepintado();
            } catch (e) { U.aviso('No he podido guardarlo: ' + e.message, 'malo'); }
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
        '</span>' +
        '<span class="hito-meta">' + metaDeHito(h, ajustes, contexto) + '</span>' +
        '<button type="button" class="hito-desplegar" title="Ver más">▾</button>' +
      '</div>' +
      '<div class="hito-cuerpo oculto">' + cuerpoDeHito(a, h, ajustes, contexto, abierto) + '</div>';

    var casillaEl = div.querySelector('.hito-casilla');
    if (casillaEl) {
      casillaEl.onclick = function (ev) { ev.stopPropagation(); };
      casillaEl.onchange = async function () {
        try {
          await Hitos.marcar(a.nombre, h.id, casillaEl.checked ? 'hecho' : 'pendiente');
          window.HitosPanel.programarRepintado();
        } catch (e) { U.aviso('No he podido guardarlo: ' + e.message, 'malo'); }
      };
    }
    var linea = div.querySelector('.hito-linea');
    var cuerpoDiv = div.querySelector('.hito-cuerpo');
    linea.querySelector('.hito-desplegar').onclick = function () { cuerpoDiv.classList.toggle('oculto'); };
    linea.querySelector('.hito-titulo').onclick = function () { cuerpoDiv.classList.toggle('oculto'); };

    engancharCuerpo(div, a, h, abierto);
    return div;
  }

  function cuerpoDeHito(a, h, ajustes, contexto, abierto) {
    var trozos = [];
    if (h.cuerpo) trozos.push('<div class="hito-explicacion">' + h.cuerpo + '</div>');

    if (abierto) {
      var opciones = ajustes.responsables.concat(Hitos.PAPELES);
      trozos.push('<label class="etiqueta">Responsable</label>' +
        '<select class="campo hito-campo-responsable"><option value="">(sin responsable)</option>' +
        opciones.map(function (r) {
          return '<option value="' + U.escapar(r.id) + '"' + (r.id === h.responsable ? ' selected' : '') +
            '>' + U.escapar(r.nombre) + '</option>';
        }).join('') + '</select>');
      trozos.push('<label class="etiqueta">Fecha límite</label>' +
        '<input type="date" class="campo hito-campo-fecha" value="' + U.escapar(h.fecha || '') + '">');
    }

    trozos.push('<div class="hito-notas">' + (h.notas || []).map(function (n) {
      return '<div class="hito-nota"><strong>' + U.escapar(n.quien || '') + '</strong> · ' +
        U.escapar((n.cuando || '').slice(0, 10)) + '<br>' + U.escapar(n.texto) + '</div>';
    }).join('') + '</div>');

    if (abierto) {
      trozos.push('<div class="nota-nueva">' +
        '<textarea class="campo hito-nota-texto" rows="2" placeholder="Añadir una nota a este hito"></textarea>' +
        '<button type="button" class="boton hito-nota-anadir">Añadir nota</button></div>');
    }

    if ((h.documentos || []).length) {
      trozos.push('<div class="hito-documentos">' + h.documentos.map(function (d) {
        return '<span class="hito-documento">' + U.escapar(d) +
          (abierto ? ' <button type="button" class="hito-doc-quitar" data-doc="' + U.escapar(d) + '">✕</button>' : '') +
          '</span>';
      }).join('') + '</div>');
    }

    if (abierto) {
      trozos.push('<div class="hito-botones">' +
        (h.clase === 'decision' ? '<button type="button" class="boton hito-cambiar-rama">Cambiar de rama</button>' : '') +
        '<button type="button" class="boton boton-peligro hito-quitar">Quitar este hito</button></div>');
    }

    return trozos.join('');
  }

  function engancharCuerpo(div, a, h, abierto) {
    if (!abierto) return;
    var resp = div.querySelector('.hito-campo-responsable');
    if (resp) resp.onchange = async function () {
      await Hitos.guardarCampos(a.nombre, h.id, { responsable: resp.value });
      window.HitosPanel.programarRepintado();
    };
    var fecha = div.querySelector('.hito-campo-fecha');
    if (fecha) fecha.onchange = async function () {
      await Hitos.guardarCampos(a.nombre, h.id, { fecha: fecha.value });
      window.HitosPanel.programarRepintado();
    };
    var notaBtn = div.querySelector('.hito-nota-anadir');
    if (notaBtn) notaBtn.onclick = async function () {
      var ta = div.querySelector('.hito-nota-texto');
      var texto = (ta.value || '').trim();
      if (!texto) return;
      await Hitos.anadirNota(a.nombre, h.id, texto);
      window.HitosPanel.programarRepintado();
    };
    Array.prototype.forEach.call(div.querySelectorAll('.hito-doc-quitar'), function (b) {
      b.onclick = async function () {
        await Hitos.quitarDocumento(a.nombre, h.id, b.dataset.doc);
        window.HitosPanel.programarRepintado();
      };
    });
    var quitar = div.querySelector('.hito-quitar');
    if (quitar) quitar.onclick = async function () {
      var ok = await U.preguntar('Quitar este hito', '<p><strong>' + U.escapar(h.titulo) + '</strong></p>', 'Quitar');
      if (!ok) return;
      await Hitos.quitarHito(a.nombre, h.id);
      window.HitosPanel.programarRepintado();
    };
    var cambiarRamaBtn = div.querySelector('.hito-cambiar-rama');
    if (cambiarRamaBtn) cambiarRamaBtn.onclick = function () { mostrarOpcionesDeRama(div, a, h); };
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
          await Hitos.cambiarRama(a.nombre, h.id, b.dataset.opcion);
          window.HitosPanel.programarRepintado();
        } catch (e) { U.aviso('No he podido cambiar de rama: ' + e.message, 'malo'); }
      };
    });
  }

  return { bloqueDeHitos: bloqueDeHitos };
})();
