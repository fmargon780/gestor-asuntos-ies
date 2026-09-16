/* ============================================================
   hitos-panel.js — pinta los hitos en la ficha del asunto (16-sep-2026).

   js/ficha-asunto.js pinta la guía del tipo dentro de #ficha-guia,
   dentro del bloque "Guía del procedimiento". Aquí se ENVUELVE eso,
   sin tocar ese fichero: cuando el asunto tiene hitos, la lista de
   hitos sustituye a la lista de pasos; el botón de "Escribir/Cambiar
   la guía" que pone pintarGuia (siempre el último hijo, un <p
   class="nota">) se conserva donde está.

   pintarGuia es una función privada de ficha-asunto.js: no hay
   ninguna función de App que envolver para saber cuándo termina de
   pintar. Por eso se usa un MutationObserver sobre #ficha-guia, tal y
   como recomienda docs/CONTEXTO.md para un panel que se repinta
   entero. Se engancha a App.abrirFicha (esa sí es pública) para saber
   de qué asunto se trata y si está abierto o archivado.

   Se carga después de js/ficha-asunto.js.
   ============================================================ */
(function () {
  if (typeof App === 'undefined' || typeof App.abrirFicha !== 'function') return;

  var actual = null;
  var modoActual = 'abierto';
  var observador = null;
  var cajaObservada = null;
  var repintando = false;
  var pendiente = null;

  function $(id) { return document.getElementById(id); }

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  (function envolverAbrirFicha() {
    var comoEra = App.abrirFicha;
    App.abrirFicha = function (a, modo) {
      actual = a;
      modoActual = modo || 'abierto';
      comoEra(a, modo);
      asegurarObservador();
      programarRepintado();
    };
  })();

  function asegurarObservador() {
    var raiz = $('ficha-asunto-cuerpo');
    if (!raiz) return;
    if (observador) observador.disconnect();
    observador = new MutationObserver(function () {
      if (repintando) return;
      programarRepintado();
    });
    observador.observe(raiz, { childList: true, subtree: true });
  }

  function programarRepintado() {
    if (pendiente) clearTimeout(pendiente);
    pendiente = setTimeout(function () { pendiente = null; repintar(); }, 30);
  }

  /* Mientras el asunto no tenga hitos, #ficha-guia NO SE TOCA: se deja
     tal cual lo pinta js/ficha-asunto.js (con las casillas de
     siempre, pasosHechos y pasosElegidos, exactamente como hasta
     hoy). El botón de entrada ("Crear los hitos de la guía", o "+
     Añadir el primer hito" si el tipo no tiene guía) sale en un
     bloque propio y aparte, justo debajo. Solo cuando el asunto YA
     tiene hitos se sustituye el contenido de #ficha-guia por la lista
     de hitos, conservando el botón de escribir/cambiar la guía. */
  async function repintar() {
    var a = actual;
    if (!a) return;
    var abierto = modoActual === 'abierto';
    var clave = a.nombre;
    var tipo = tipoDe(a);

    var datos = null, entrada = null, errorLectura = null;
    try { datos = await Hitos.leer(); entrada = datos.porAsunto[clave] || null; }
    catch (e) { errorLectura = e; }

    if (actual !== a) return;   /* se ha cambiado de ficha mientras leíamos */
    var caja = $('ficha-guia');
    if (!caja) return;
    cajaObservada = caja;

    var hitos = entrada ? entrada.hitos : [];

    repintando = true;
    try {
      if (!errorLectura && hitos.length) {
        quitarBloqueDeEntrada();
        var botonGuia = (caja.lastElementChild && caja.lastElementChild.classList.contains('nota'))
          ? caja.lastElementChild : null;
        if (botonGuia) botonGuia.remove();
        caja.innerHTML = '';
        caja.className = 'hitos-panel';
        caja.appendChild(bloqueDeHitos(a, hitos, datos.ajustes, abierto));
        if (botonGuia) caja.appendChild(botonGuia);
      } else {
        pintarBloqueDeEntrada(a, tipo, abierto, errorLectura);
      }
    } finally {
      repintando = false;
    }
  }

  /* ---------- el bloque de entrada, aparte de #ficha-guia ----------

     Se cuelga justo debajo del bloque "Guía del procedimiento", como
     hermano suyo dentro de .ficha-izquierda. Al no vivir dentro de
     #ficha-guia, no interfiere para nada con lo que pinta
     js/ficha-asunto.js ahí (importante: pruebas/guias.mjs abre una
     ficha sin hitos y espera ver la guía de siempre, con sus
     casillas). */

  function bloqueDeEntrada() {
    var ya = $('hitos-entrada');
    if (ya) return ya;
    var guiaBloque = caja0();
    if (!guiaBloque || !guiaBloque.parentNode) return null;
    var div = document.createElement('div');
    div.id = 'hitos-entrada';
    div.className = 'ficha-bloque';
    guiaBloque.parentNode.insertBefore(div, guiaBloque.nextSibling);
    return div;
  }

  function caja0() {
    var c = $('ficha-guia');
    return c ? c.closest('.ficha-bloque') : null;
  }

  function quitarBloqueDeEntrada() {
    var d = $('hitos-entrada');
    if (d) d.remove();
  }

  function pintarBloqueDeEntrada(a, tipo, abierto, errorLectura) {
    var d = bloqueDeEntrada();
    if (!d) return;
    d.innerHTML = '<h3 class="ficha-titulo">Hitos</h3>';
    if (errorLectura) {
      var av = document.createElement('p');
      av.className = 'explica';
      av.textContent = 'No he podido leer los hitos: ' + errorLectura.message;
      d.appendChild(av);
      return;
    }
    if (!abierto) {
      d.remove();   /* archivado y sin hitos: no hay nada que ofrecer aquí */
      return;
    }
    var pasosGuia = (window.GuiasDelCentro && tipo) ? window.GuiasDelCentro.pasosDe(tipo) : [];
    d.appendChild(pasosGuia.length ? botonCrearDesdeGuia(a, tipo) : botonAnadirAMano(a));
  }

  /* ---------- el botón para asuntos viejos (sección 3.2) ---------- */

  function botonCrearDesdeGuia(a, tipo) {
    var caja = document.createElement('div');
    var p = document.createElement('p');
    p.className = 'explica';
    p.textContent = 'Este asunto todavía se gobierna por la guía de siempre, más abajo.';
    caja.appendChild(p);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-principal';
    b.textContent = 'Crear los hitos de la guía';
    b.onclick = async function () {
      b.disabled = true;
      try {
        var hechos = (a.ficha && a.ficha.pasosHechos) || [];
        var elegidos = (a.ficha && a.ficha.pasosElegidos) || {};
        await Hitos.crearDesdeGuiaImportando(a.nombre, tipo, hechos, elegidos);
        U.aviso('Hitos creados desde la guía.', 'bueno');
        programarRepintado();
      } catch (e) {
        U.aviso('No he podido crear los hitos: ' + e.message, 'malo');
        b.disabled = false;
      }
    };
    caja.appendChild(b);
    return caja;
  }

  function botonAnadirAMano(a) {
    var caja = document.createElement('div');
    var p = document.createElement('p');
    p.className = 'explica';
    p.textContent = 'Este tipo no tiene guía. Puedes ir apuntando los hitos a mano.';
    caja.appendChild(p);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = '+ Añadir el primer hito';
    b.onclick = function () { pedirYAnadirHito(a); };
    caja.appendChild(b);
    return caja;
  }

  async function pedirYAnadirHito(a) {
    var ok = await U.preguntar('Añadir un hito',
      '<label class="etiqueta">Título</label>' +
      '<input id="hito-nuevo-titulo" class="campo" placeholder="Por ejemplo: Firma del director">',
      'Añadir');
    if (!ok) return;
    var titulo = ($('hito-nuevo-titulo') && $('hito-nuevo-titulo').value.trim()) || '';
    if (!titulo) return;
    try {
      await Hitos.anadirHito(a.nombre, titulo);
      programarRepintado();
    } catch (e) {
      U.aviso('No he podido añadir el hito: ' + e.message, 'malo');
    }
  }

  /* ---------- la lista de hitos ---------- */

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
      mas.onclick = function () { pedirYAnadirHito(a); };
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
              programarRepintado();
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
          programarRepintado();
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
      programarRepintado();
    };
    var fecha = div.querySelector('.hito-campo-fecha');
    if (fecha) fecha.onchange = async function () {
      await Hitos.guardarCampos(a.nombre, h.id, { fecha: fecha.value });
      programarRepintado();
    };
    var notaBtn = div.querySelector('.hito-nota-anadir');
    if (notaBtn) notaBtn.onclick = async function () {
      var ta = div.querySelector('.hito-nota-texto');
      var texto = (ta.value || '').trim();
      if (!texto) return;
      await Hitos.anadirNota(a.nombre, h.id, texto);
      programarRepintado();
    };
    Array.prototype.forEach.call(div.querySelectorAll('.hito-doc-quitar'), function (b) {
      b.onclick = async function () {
        await Hitos.quitarDocumento(a.nombre, h.id, b.dataset.doc);
        programarRepintado();
      };
    });
    var quitar = div.querySelector('.hito-quitar');
    if (quitar) quitar.onclick = async function () {
      var ok = await U.preguntar('Quitar este hito', '<p><strong>' + U.escapar(h.titulo) + '</strong></p>', 'Quitar');
      if (!ok) return;
      await Hitos.quitarHito(a.nombre, h.id);
      programarRepintado();
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
    caja.appendChild(fila);
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
          programarRepintado();
        } catch (e) { U.aviso('No he podido cambiar de rama: ' + e.message, 'malo'); }
      };
    });
  }
})();
