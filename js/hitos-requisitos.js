/* ============================================================
   hitos-requisitos.js — "lo que hay que reunir" de un hito (18-sep-2026,
   fila 59, docs/REQUISITOS-DE-HITO.md).

   Como js/hitos-archivo.js: se engancha al mismo objeto window.Hitos,
   con las funciones que le faltaban (marcar una casilla, escribir su
   valor, añadir/quitar/editar una a mano, y traer las de la guía a un
   asunto viejo). A diferencia de js/hitos-archivo.js, aquí va también
   cómo se pinta el bloque dentro de la ficha: es poco código y no
   tenía sentido partirlo en dos ficheros más.

   window.HitosRequisitos, que usa js/hitos-panel-lista.js:
     - bloqueDeRequisitos(a, hito): el HTML del bloque (o de la línea
       "Traerlas"), para meter dentro del cuerpo del hito.
     - engancharBloque(div, a, hito): los onclick/onchange, una vez
       pintado.
     - textoLoQueFalta(hito): el texto de la sección 7 del encargo.

   Y lo que usa js/hitos-documentos.js al apuntar o quitar un documento
   de un hito (sección 5):
     - marcarPorDocumento(clave, idHito, nombreDocumento)
     - desmarcarPorDocumento(clave, idHito, nombreDocumento)

   Se carga después de js/hitos-archivo.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  var cambiar = Hitos.cambiar;
  var buscar = Hitos.buscar;

  /* ==========================================================
     EL MODELO: leer, marcar, añadir, quitar, editar, traer
     ========================================================== */

  function buscarRequisito(hito, idRequisito) {
    return (hito.requisitos || []).filter(function (r) { return r.id === idRequisito; })[0] || null;
  }

  async function editarHito(clave, idHito, mutador) {
    var datos = await cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      var h = buscar(entrada.hitos, idHito);
      if (h) mutador(h);
      return d;
    });
    return datos.porAsunto[clave] ? datos.porAsunto[clave].hitos : [];
  }

  function editarRequisito(clave, idHito, idRequisito, mutador) {
    return editarHito(clave, idHito, function (h) {
      var r = buscarRequisito(h, idRequisito);
      if (r) mutador(r);
    });
  }

  /* Marcar o desmarcar una casilla. Al marcarla se apunta quién y
     cuándo, como en las notas del hito; al desmarcarla, el valor (o el
     documento) se conserva y solo deja de contar (sección 4.2). `extra`
     puede traer `valor` y/o `documento`, solo al marcar. */
  function marcarRequisito(clave, idHito, idRequisito, hecho, extra) {
    return editarRequisito(clave, idHito, idRequisito, function (r) {
      r.hecho = !!hecho;
      if (hecho) {
        r.quien = (window.App && App.E.usuario) || '';
        r.cuando = U.ahora();
      }
      if (extra && typeof extra === 'object') {
        if ('valor' in extra) r.valor = String(extra.valor || '');
        if ('documento' in extra) r.documento = String(extra.documento || '');
      }
    });
  }

  function escribirValorRequisito(clave, idHito, idRequisito, valor) {
    return editarRequisito(clave, idHito, idRequisito, function (r) { r.valor = String(valor || ''); });
  }

  function editarTextoRequisito(clave, idHito, idRequisito, texto) {
    return editarRequisito(clave, idHito, idRequisito, function (r) { r.texto = String(texto || ''); });
  }

  /* "+ Añadir algo que falte" (sección 4.2): una casilla solo para este
     asunto, la guía del tipo no se toca. */
  function anadirRequisito(clave, idHito, texto, clase, obligatorio) {
    return editarHito(clave, idHito, function (h) {
      h.requisitos = h.requisitos || [];
      h.requisitos.push({
        id: Hitos.nuevoId(), texto: String(texto || ''),
        clase: clase === 'dato' ? 'dato' : 'documento',
        obligatorio: !!obligatorio, hecho: false, valor: '', documento: '', quien: '', cuando: ''
      });
    });
  }

  /* "Quitar de este asunto" (sección 4.2): solo de este asunto, nunca
     de la guía del tipo. */
  function quitarRequisito(clave, idHito, idRequisito) {
    return editarHito(clave, idHito, function (h) {
      h.requisitos = (h.requisitos || []).filter(function (r) { return r.id !== idRequisito; });
    });
  }

  /* Busca un paso (o un subpaso, dentro de una opción) por su id, en la
     guía tal y como está en memoria ahora mismo (window.GuiasDelCentro,
     síncrono: no hace falta releer nada del disco). */
  function buscarPasoEnGuia(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      var p = pasos[i];
      if (p.id === id) return p;
      if (p.opciones && p.opciones.length) {
        for (var j = 0; j < p.opciones.length; j++) {
          var sub = (p.opciones[j] && p.opciones[j].pasos) || [];
          for (var k = 0; k < sub.length; k++) {
            if (sub[k].id === id) return sub[k];
          }
        }
      }
    }
    return null;
  }

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  /* Los requisitos del paso de origen, si el tipo los tiene ahora y el
     hito no tiene ninguno todavía (sección 4.3). Devuelve null cuando
     no hay nada que traer. */
  function origenConRequisitos(a, hito) {
    if (!hito.origenGuia || (hito.requisitos && hito.requisitos.length)) return null;
    var pasos = (window.GuiasDelCentro && window.GuiasDelCentro.pasosDe(tipoDe(a))) || [];
    var origen = buscarPasoEnGuia(pasos, hito.origenGuia);
    return (origen && origen.requisitos && origen.requisitos.length) ? origen.requisitos : null;
  }

  /* "Traerlas": copia los requisitos del paso de origen, sin marcar.
     No se hace solo nunca: hace falta pulsar el botón. */
  async function traerRequisitos(a, hito) {
    var origen = origenConRequisitos(a, hito);
    if (!origen) return;
    var copia = origen.map(function (r) {
      return { id: Hitos.nuevoId(), texto: r.texto, clase: r.clase, obligatorio: r.obligatorio };
    });
    return editarHito(a.nombre, hito.id, function (h) { h.requisitos = copia; });
  }

  /* ==========================================================
     SECCIÓN 5: marcar el documento sin marcarlo a mano

     Al apuntar un documento a un hito (js/hitos-documentos.js), si hay
     una sola casilla de clase "documento" sin marcar, se marca sola;
     con varias, se pregunta con cuál se corresponde; sin ninguna, no
     pasa nada. Al quitar el documento, la casilla que satisfacía
     vuelve a estar sin marcar.
     ========================================================== */

  async function marcarPorDocumento(clave, idHito, nombreDocumento) {
    var hitos = await Hitos.hitosDe(clave);
    var h = buscar(hitos, idHito);
    if (!h) return;
    var pendientes = (h.requisitos || []).filter(function (r) { return r.clase === 'documento' && !r.hecho; });
    if (!pendientes.length) return;

    if (pendientes.length === 1) {
      await marcarRequisito(clave, idHito, pendientes[0].id, true, { documento: nombreDocumento });
      U.aviso('Marcado: ' + pendientes[0].texto, 'bueno');
      if (window.HitosPanel) window.HitosPanel.programarRepintado();
      return;
    }

    var idCampo = 'hitosreq-elegir-' + Date.now();
    var ok = await U.preguntar('¿Con qué se corresponde?',
      '<p class="explica">' + U.escapar(nombreDocumento) + '</p>' +
      '<select class="campo" id="' + idCampo + '"><option value="">Ninguna</option>' +
      pendientes.map(function (r) { return '<option value="' + U.escapar(r.id) + '">' + U.escapar(r.texto) + '</option>'; }).join('') +
      '</select>', 'Marcar');
    if (!ok) return;
    var campo = document.getElementById(idCampo);
    var idElegido = campo ? campo.value : '';
    if (!idElegido) return;
    var elegido = pendientes.filter(function (r) { return r.id === idElegido; })[0];
    await marcarRequisito(clave, idHito, idElegido, true, { documento: nombreDocumento });
    U.aviso('Marcado: ' + (elegido ? elegido.texto : ''), 'bueno');
    if (window.HitosPanel) window.HitosPanel.programarRepintado();
  }

  async function desmarcarPorDocumento(clave, idHito, nombreDocumento) {
    var hitos = await Hitos.hitosDe(clave);
    var h = buscar(hitos, idHito);
    if (!h) return;
    var r = (h.requisitos || []).filter(function (x) {
      return x.clase === 'documento' && x.hecho && x.documento === nombreDocumento;
    })[0];
    if (!r) return;
    await editarRequisito(clave, idHito, r.id, function (x) { x.hecho = false; x.documento = ''; });
    if (window.HitosPanel) window.HitosPanel.programarRepintado();
  }

  Object.assign(Hitos, {
    marcarRequisito: marcarRequisito, escribirValorRequisito: escribirValorRequisito,
    editarTextoRequisito: editarTextoRequisito, anadirRequisito: anadirRequisito,
    quitarRequisito: quitarRequisito, traerRequisitos: traerRequisitos
  });

  /* ==========================================================
     SECCIÓN 7: "Pedir lo que falta"
     ========================================================== */

  function textoLoQueFalta(hito) {
    var pendientes = (hito.requisitos || []).filter(function (r) { return !r.hecho; });
    if (!pendientes.length) return '';
    return 'Falta por aportar:\n' + pendientes.map(function (r) { return '- ' + r.texto; }).join('\n');
  }

  /* ==========================================================
     PINTAR EL BLOQUE (sección 4.2) Y LA LÍNEA "TRAERLAS" (4.3)
     ========================================================== */

  function filaRequisito(r) {
    var marcada = r.hecho;
    var extra = '';
    if (marcada && r.clase === 'dato' && r.valor) {
      extra = '<span class="hito-requisito-valor">' + U.escapar(r.valor) + '</span>';
    } else if (marcada && r.clase === 'documento' && r.documento) {
      extra = '<span class="hito-requisito-valor">' + U.escapar(r.documento) + '</span>';
    }
    return '<div class="hito-requisito-fila' + (marcada ? ' hito-requisito-hecha' : '') +
      '" data-id="' + U.escapar(r.id) + '">' +
      '<input type="checkbox" class="hito-requisito-casilla"' + (marcada ? ' checked' : '') + '>' +
      '<span class="hito-requisito-texto' + (r.obligatorio ? ' hito-requisito-obligatorio' : '') + '">' +
        (r.obligatorio && !marcada ? '<span class="hito-requisito-punto" title="Obligatorio"></span>' : '') +
        U.escapar(r.texto) +
      '</span>' +
      extra +
      '<button type="button" class="hito-requisito-menu-boton" title="Más opciones">⋯</button>' +
      '</div>';
  }

  function bloqueDeRequisitos(a, hito) {
    var lista = hito.requisitos || [];
    if (!lista.length) {
      var origen = origenConRequisitos(a, hito);
      if (!origen) return '';
      return '<div class="hito-requisitos-traer">El tipo tiene ahora ' + origen.length +
        (origen.length === 1 ? ' cosa que reunir' : ' cosas que reunir') +
        ' · <button type="button" class="enlace hito-requisitos-traerlas">Traerlas</button></div>';
    }
    var falta = lista.filter(function (r) { return !r.hecho; }).length;
    return '<div class="hito-requisitos">' +
      '<div class="hito-requisitos-cabecera">' +
        '<span>Lo que hay que reunir — falta ' + falta + ' de ' + lista.length + '</span>' +
        (falta ? '<button type="button" class="boton hito-requisitos-pedir">Pedir lo que falta</button>' : '') +
      '</div>' +
      '<div class="hito-requisitos-lista">' + lista.map(filaRequisito).join('') + '</div>' +
      '<button type="button" class="boton hito-requisitos-anadir">+ Añadir algo que falte</button>' +
      '</div>';
  }

  function engancharBloque(div, a, h) {
    var traerBtn = div.querySelector('.hito-requisitos-traerlas');
    if (traerBtn) {
      traerBtn.onclick = async function () {
        try {
          await U.mientrasGuarda(traerBtn, function () { return traerRequisitos(a, h); });
          window.HitosPanel.programarRepintado();
        } catch (e) { U.aviso('No he podido traerlas: ' + U.mensajeDeError(e), 'malo'); }
      };
      return;
    }

    var caja = div.querySelector('.hito-requisitos');
    if (!caja) return;

    Array.prototype.forEach.call(caja.querySelectorAll('.hito-requisito-fila'), function (fila) {
      var r = buscarRequisito(h, fila.dataset.id);
      if (!r) return;

      var casilla = fila.querySelector('.hito-requisito-casilla');
      casilla.onclick = function (ev) { ev.stopPropagation(); };
      casilla.onchange = function () {
        if (casilla.checked && r.clase === 'dato') { mostrarCampoValor(fila, a, h, r, casilla); return; }
        marcarDesdeFicha(a, h, r, casilla.checked, casilla);
      };

      var botonMenu = fila.querySelector('.hito-requisito-menu-boton');
      if (botonMenu && window.FichaMenus) {
        FichaMenus.montar(botonMenu, [
          { texto: 'Editar el texto', alPulsar: function () { editarTextoDesdeFicha(a, h, r); } },
          { texto: 'Quitar de este asunto', clase: 'ficha-menu-peligro', alPulsar: function () { quitarDesdeFicha(a, h, r); } }
        ]);
      }

      if (r.clase === 'dato' && r.hecho && r.valor && window.Copiar) {
        var valorSpan = fila.querySelector('.hito-requisito-valor');
        if (valorSpan && !fila.querySelector('.boton-copiar-chico')) {
          var b = Copiar.boton({
            etiqueta: 'Copiar', texto: r.valor, ayuda: 'Copiar ' + r.valor, clase: 'boton-copiar-chico'
          });
          valorSpan.parentNode.insertBefore(b, valorSpan.nextSibling);
        }
      }
    });

    var anadir = caja.querySelector('.hito-requisitos-anadir');
    if (anadir) anadir.onclick = function () { anadirDesdeFicha(a, h); };

    var pedir = caja.querySelector('.hito-requisitos-pedir');
    if (pedir && window.CorreoNucleo && window.CorreoNucleo.montarBotonComunicar) {
      window.CorreoNucleo.montarBotonComunicar(pedir, a, { loQueFalta: textoLoQueFalta(h) });
    }
  }

  /* El campo de valor de una casilla "dato", recién marcada: se añade
     a mano, con el observador de hitos-panel.js pausado un instante
     (mismo cuidado que "Cambiar de rama" en js/hitos-panel-lista.js),
     y se guarda al perder el foco o con Intro. Vacío vale. */
  function mostrarCampoValor(fila, a, h, r, casilla) {
    if (window.HitosPanel) window.HitosPanel.observadorPausar();
    var campo = document.createElement('input');
    campo.type = 'text';
    campo.className = 'campo hito-requisito-valor-campo';
    campo.placeholder = 'Valor (puede dejarse en blanco)';
    campo.value = r.valor || '';
    fila.appendChild(campo);
    if (window.HitosPanel) window.HitosPanel.observadorReanudar();
    campo.focus();

    var guardado = false;
    function guardar() {
      if (guardado) return;
      guardado = true;
      marcarDesdeFicha(a, h, r, true, casilla, campo.value);
    }
    campo.addEventListener('blur', guardar);
    campo.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); campo.blur(); }
    });
  }

  async function marcarDesdeFicha(a, h, r, hecho, casilla, valor) {
    try {
      await U.mientrasGuarda(casilla, function () {
        return marcarRequisito(a.nombre, h.id, r.id, hecho, hecho ? { valor: valor } : undefined);
      });
      window.HitosPanel.programarRepintado();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function editarTextoDesdeFicha(a, h, r) {
    var idCampo = 'hitoreq-editar-' + Date.now();
    var ok = await U.preguntar('Editar el texto',
      '<label class="etiqueta">Texto</label>' +
      '<input id="' + idCampo + '" class="campo" value="' + U.escapar(r.texto) + '">', 'Guardar');
    if (!ok) return;
    var campo = document.getElementById(idCampo);
    var texto = campo ? campo.value.trim() : '';
    if (!texto) return;
    try {
      await editarTextoRequisito(a.nombre, h.id, r.id, texto);
      window.HitosPanel.programarRepintado();
    } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function quitarDesdeFicha(a, h, r) {
    var ok = await U.preguntar('Quitar de este asunto',
      '<p><strong>' + U.escapar(r.texto) + '</strong></p>' +
      '<p class="explica">Solo se quita de este asunto: la guía del tipo no se toca.</p>', 'Quitar');
    if (!ok) return;
    try {
      await quitarRequisito(a.nombre, h.id, r.id);
      window.HitosPanel.programarRepintado();
    } catch (e) { U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function anadirDesdeFicha(a, h) {
    var idTexto = 'hitoreq-nuevo-texto-' + Date.now();
    var idClase = 'hitoreq-nuevo-clase-' + Date.now();
    var idObligatorio = 'hitoreq-nuevo-obligatorio-' + Date.now();
    var ok = await U.preguntar('Añadir algo que falte',
      '<label class="etiqueta">Texto</label>' +
      '<input id="' + idTexto + '" class="campo" placeholder="Qué hay que reunir">' +
      '<label class="etiqueta">Es</label>' +
      '<select id="' + idClase + '" class="campo"><option value="documento">Documento</option><option value="dato">Dato</option></select>' +
      '<label class="interruptor" style="margin-top:8px">' +
        '<input type="checkbox" id="' + idObligatorio + '"><span>Obligatorio</span></label>',
      'Añadir');
    if (!ok) return;
    var campoTexto = document.getElementById(idTexto);
    var texto = campoTexto ? campoTexto.value.trim() : '';
    if (!texto) return;
    var campoClase = document.getElementById(idClase);
    var clase = campoClase ? campoClase.value : 'documento';
    var campoObligatorio = document.getElementById(idObligatorio);
    var obligatorio = !!(campoObligatorio && campoObligatorio.checked);
    try {
      await anadirRequisito(a.nombre, h.id, texto, clase, obligatorio);
      window.HitosPanel.programarRepintado();
    } catch (e) { U.aviso('No he podido añadirlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  window.HitosRequisitos = {
    bloqueDeRequisitos: bloqueDeRequisitos,
    engancharBloque: engancharBloque,
    textoLoQueFalta: textoLoQueFalta,
    marcarPorDocumento: marcarPorDocumento,
    desmarcarPorDocumento: desmarcarPorDocumento,
    /* Para el botón suelto "+ Añadir algo que falte" que pinta
       js/hitos-panel-lista.js entre los botones del hito cuando este
       bloque no se pinta por no tener todavía ninguna casilla. */
    anadir: anadirDesdeFicha
  };
})();
