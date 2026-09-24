/* ============================================================
   hito-mesa-documentos.js — la columna central de la mesa del hito
   (documentos y formularios) y los destinatarios de "Comunicar"
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 4 y 5).

   - Una tabla con los documentos del hito: casilla de selección, el
     tipo en negrita y el nombre del fichero en gris, el estado
     ("Registrado 26SM0617", "Sin registrar" en ámbar, "(ya no está)") y
     sus acciones: Abrir, Enviar y ⋯ (el menú de siempre,
     js/hitos-documento-menu.js). Cada fila sigue siendo un
     `.hito-documento[data-doc]` con su `.hito-doc-abrir`.
   - Los gemelos (el "SIN SELLAR" y el .doc/.docx con el mismo nombre
     base) cuelgan debajo del principal, en pequeño.
   - Con varios marcados, una barra: "Enviar por correo", "Abrir para
     imprimir" y "Mover a otro hito".
   - Las plantillas de documento del paso, una fila cada una con
     "Generar documento" (js/hitos-generar.js), y las demás del tipo en
     "Otras plantillas", plegado.
   - Soltar un fichero del ordenador encima hace lo mismo que "Desde el
     ordenador".
   - Los destinatarios de "Comunicar", como chips marcables, y los dos
     botones "Preparar correo" y "Mensaje de Séneca".

   Lo llaman js/hitos-panel-lista.js (`filasHTML`, al pintar el cuerpo)
   y js/hito-mesa.js (`enganchar`, con la mesa abierta).
   ============================================================ */
var HitoMesaDocumentos = (function () {

  var RE_SIN_SELLAR = / SIN SELLAR(\s*\(\d+\))?$/i;
  var RE_REGISTRO = /\b\d{2}[ES][MA]\d{4}\b/;

  function extension(n) { return (window.Nombres && Nombres.extensionDe(n)) || ''; }
  function sinExtension(n) { var e = extension(n); return e ? n.slice(0, -(e.length + 1)) : n; }

  /* La clave que comparten los gemelos: sin extensión, sin "SIN SELLAR"
     y sin el código de registro. */
  function claveGemelo(n) {
    return sinExtension(n).replace(RE_SIN_SELLAR, '').replace(RE_REGISTRO, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function esSinSellar(n) { return RE_SIN_SELLAR.test(sinExtension(n)); }
  function esWord(n) { return /^docx?$/i.test(extension(n)); }

  /* Pura: agrupa los nombres en principales con sus gemelos. */
  function agrupar(nombres, nombresDeLaCarpeta) {
    var grupos = [];
    var porClave = {};
    var principales = nombres.filter(function (n) { return !esSinSellar(n) && !esWord(n); });
    principales.concat(nombres.filter(function (n) { return principales.indexOf(n) === -1; })).forEach(function (n) {
      var k = claveGemelo(n);
      if (porClave[k] && (esSinSellar(n) || esWord(n))) { porClave[k].gemelos.push(n); return; }
      var g = { nombre: n, gemelos: [] };
      grupos.push(g);
      if (!porClave[k]) porClave[k] = g;
    });
    /* Los gemelos que están en la carpeta aunque no se hayan apuntado al hito. */
    (nombresDeLaCarpeta || []).forEach(function (n) {
      if (nombres.indexOf(n) !== -1 || !(esSinSellar(n) || esWord(n))) return;
      var g = porClave[claveGemelo(n)];
      if (g && g.nombre !== n && g.gemelos.indexOf(n) === -1) g.gemelos.push(n);
    });
    return grupos;
  }

  function estadoDe(n, falta) {
    if (falta) return { texto: '(ya no está)', clase: 'mesa-doc-gris' };
    var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(n) : {};
    var reg = leido && leido.registro;
    var codigo = (sinExtension(n).match(RE_REGISTRO) || [])[0] ||
      (reg && typeof reg === 'object' && window.Nombres && Nombres.codigoRegistro ? Nombres.codigoRegistro(reg) : (typeof reg === 'string' ? reg : ''));
    return codigo ? { texto: 'Registrado ' + codigo, clase: 'mesa-doc-verde' } : { texto: 'Sin registrar', clase: 'mesa-doc-ambar' };
  }

  function tipoDe(n) {
    var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(n) : null;
    return (leido && leido.tipo) || sinExtension(n);
  }

  /* "viene del hito N": el mismo documento apuntado a un hito anterior. */
  function origenDe(n, h, hitos) {
    var visibles = window.Hitos ? Hitos.visibles(hitos || []) : [];
    for (var i = 0; i < visibles.length; i++) {
      if (visibles[i].id === h.id) return '';
      if ((visibles[i].documentos || []).indexOf(n) !== -1) return 'viene del hito ' + (i + 1);
    }
    return '';
  }

  function filasHTML(a, h, hitos, nombresDeLaCarpeta, abierto) {
    var docs = h.documentos || [];
    if (!docs.length) return abierto ? '<p class="explica mesa-sin-docs">Todavía no hay ningún documento en este hito.</p>' : '';
    return agrupar(docs, nombresDeLaCarpeta).map(function (g) {
      var falta = !!(nombresDeLaCarpeta && nombresDeLaCarpeta.indexOf(g.nombre) === -1);
      var estado = estadoDe(g.nombre, falta);
      var origen = origenDe(g.nombre, h, hitos);
      return '<div class="hito-documento mesa-doc" data-doc="' + U.escapar(g.nombre) + '">' +
        '<input type="checkbox" class="mesa-doc-marca" title="Seleccionar"' + (falta ? ' disabled' : '') + '>' +
        '<div class="mesa-doc-nombre"><span class="mesa-doc-tipo">' + U.escapar(tipoDe(g.nombre)) + '</span>' +
          '<button type="button" class="hito-doc-abrir' + (falta ? ' hito-doc-falta' : '') + '" data-doc="' + U.escapar(g.nombre) + '">' +
            U.escapar(g.nombre) + (falta ? ' (ya no está)' : '') + '</button>' +
          (origen ? '<span class="mesa-doc-origen">' + U.escapar(origen) + '</span>' : '') +
          g.gemelos.map(function (x) {
            return '<button type="button" class="mesa-doc-gemelo" data-doc="' + U.escapar(x) + '">' +
              (esSinSellar(x) ? 'Original sin sellar' : 'Borrador en Word') + '</button>';
          }).join('') +
        '</div>' +
        '<span class="mesa-doc-estado ' + estado.clase + '">' + U.escapar(estado.texto) + '</span>' +
        '<span class="mesa-doc-acciones">' +
          (falta ? '' : '<button type="button" class="enlace mesa-doc-enviar">Enviar</button>') +
          (abierto && window.HitosDocumentoMenu ? HitosDocumentoMenu.botonHTML(g.nombre) : '') +
        '</span>' +
      '</div>';
    }).join('');
  }

  /* ---------- con la mesa abierta ---------- */

  async function abrirEnVisor(a, nombre) {
    try {
      var handle = await a.handle.getFileHandle(nombre);
      if (window.Visor) Visor.abrir(handle, nombre);
    } catch (e) { U.aviso('No he podido abrirlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function abrirParaImprimir(a, nombres) {
    for (var i = 0; i < nombres.length; i++) {
      try {
        var f = await (await a.handle.getFileHandle(nombres[i])).getFile();
        var url = URL.createObjectURL(f);
        window.open(url, '_blank');
        setTimeout(URL.revokeObjectURL.bind(URL, url), 60000);
      } catch (e) { U.aviso('No he podido abrir ' + nombres[i] + '.', 'malo'); }
    }
  }

  function enviar(a, h, nombres) {
    if (window.HitosComunicar && HitosComunicar.comunicar) HitosComunicar.comunicar(a, h, 'correo', { adjuntos: nombres });
  }

  async function moverAOtroHito(a, h, hitos, nombres) {
    var otros = Hitos.visibles(hitos).filter(function (x) { return x.id !== h.id && x.clase !== 'decision'; });
    if (!otros.length) { U.aviso('No hay otro hito al que moverlo.', 'ambar'); return; }
    var ok = await U.preguntar('Mover a otro hito',
      '<select class="campo" id="mesa-mover-destino">' + otros.map(function (x) {
        return '<option value="' + U.escapar(x.id) + '">' + U.escapar(x.titulo) + '</option>';
      }).join('') + '</select>', 'Mover');
    if (!ok) return;
    var destino = document.getElementById('mesa-mover-destino');
    var id = destino ? destino.value : '';
    if (!id) return;
    try {
      for (var i = 0; i < nombres.length; i++) {
        await Hitos.quitarDocumento(a.nombre, h.id, nombres[i]);
        await Hitos.anadirDocumento(a.nombre, id, nombres[i]);
      }
      U.aviso(nombres.length === 1 ? 'Movido.' : 'Movidos.', 'bueno');
    } catch (e) { U.fallo('No he podido moverlo', e); }
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  function marcados(fila) {
    return Array.prototype.filter.call(fila.querySelectorAll('.mesa-doc-marca'), function (c) { return c.checked; })
      .map(function (c) { return c.closest('.hito-documento').dataset.doc; });
  }

  function pintarSeleccion(fila, a, h, hitos) {
    var barra = fila.querySelector('.mesa-seleccion');
    if (!barra) return;
    var lista = marcados(fila);
    barra.classList.toggle('oculto', !lista.length);
    if (!lista.length) { barra.innerHTML = ''; return; }
    barra.innerHTML = '<span>' + lista.length + (lista.length === 1 ? ' marcado' : ' marcados') + '</span>' +
      '<button type="button" class="boton boton-chico mesa-sel-enviar">Enviar por correo</button>' +
      '<button type="button" class="boton boton-chico mesa-sel-imprimir">Abrir para imprimir</button>' +
      '<button type="button" class="boton boton-chico mesa-sel-mover">Mover a otro hito</button>';
    barra.querySelector('.mesa-sel-enviar').onclick = function () { enviar(a, h, marcados(fila)); };
    barra.querySelector('.mesa-sel-imprimir').onclick = function () { abrirParaImprimir(a, marcados(fila)); };
    barra.querySelector('.mesa-sel-mover').onclick = function () { moverAOtroHito(a, h, hitos, marcados(fila)); };
  }

  function pintarPlantillas(fila, a, h, abierto) {
    var caja = fila.querySelector('.mesa-plantillas');
    if (!caja || !window.HitosGenerar || !HitosGenerar.grupos) return;
    var g = HitosGenerar.grupos(a, h);
    if (!g || (!g.delPaso.length && !g.delTipo.length)) { caja.innerHTML = ''; return; }
    function filaP(p) {
      return '<div class="mesa-plantilla" data-id="' + U.escapar(p.id) + '"><span class="mesa-icono-doc">DOC</span>' +
        '<span class="mesa-plantilla-nombre">' + U.escapar(p.nombre) + '</span>' +
        (abierto ? '<button type="button" class="boton boton-chico mesa-plantilla-generar">Generar documento</button>' : '') + '</div>';
    }
    caja.innerHTML = g.delPaso.map(filaP).join('') +
      (g.delTipo.length ? '<details class="mesa-otras-plantillas"><summary>Otras plantillas (' + g.delTipo.length + ')</summary>' +
        g.delTipo.map(filaP).join('') + '</details>' : '');
    var todas = g.delPaso.concat(g.delTipo);
    Array.prototype.forEach.call(caja.querySelectorAll('.mesa-plantilla-generar'), function (b) {
      b.onclick = async function () {
        var id = b.closest('.mesa-plantilla').dataset.id;
        var p = todas.filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        try {
          await U.mientrasGuarda(b, function () { return PlantillasDocumento.generar(a, p, 'abierto', { hito: h }); });
        } catch (e) { U.fallo('No he podido generar el documento', e); }
      };
    });
  }

  /* Soltar un fichero: lo mismo que "Desde el ordenador" (js/documentos.js,
     con el hito), con el fichero ya elegido. */
  function engancharSoltar(fila, a, h) {
    var zona = fila.querySelector('.mesa-soltar');
    if (!zona) return;
    zona.ondragover = function (ev) { ev.preventDefault(); zona.classList.add('encima'); };
    zona.ondragleave = function () { zona.classList.remove('encima'); };
    zona.ondrop = function (ev) {
      ev.preventDefault();
      zona.classList.remove('encima');
      var ficheros = ev.dataTransfer && ev.dataTransfer.files;
      if (!ficheros || !ficheros.length) return;
      if (window.Documentos && Documentos.abrir) {
        Documentos.abrir(a, { hito: h, ficheroSoltado: ficheros[0] });
      }
    };
  }

  function enganchar(fila, a, h, hitos, abierto) {
    if (!h) return;
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-gemelo'), function (b) {
      b.onclick = function () { abrirEnVisor(a, b.dataset.doc); };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-enviar'), function (b) {
      b.onclick = function () { enviar(a, h, [b.closest('.hito-documento').dataset.doc]); };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-marca'), function (c) {
      c.onchange = function () { pintarSeleccion(fila, a, h, hitos); };
    });
    pintarSeleccion(fila, a, h, hitos);
    pintarPlantillas(fila, a, h, abierto);
    if (abierto) engancharSoltar(fila, a, h);
    if (abierto && window.HitoMesaComunicar) HitoMesaComunicar.pintar(fila, a, h);
  }

  return { filasHTML: filasHTML, enganchar: enganchar, agrupar: agrupar, claveGemelo: claveGemelo, marcados: marcados,
           moverAOtroHito: moverAOtroHito };
})();
window.HitoMesaDocumentos = HitoMesaDocumentos;
