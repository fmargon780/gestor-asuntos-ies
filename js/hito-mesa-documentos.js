/* ============================================================
   hito-mesa-documentos.js — la columna central de la mesa del hito
   (documentos y formularios) y los destinatarios de "Comunicar"
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 4 y 5).

   - Una tabla con los documentos del hito: casilla de selección, el
     tipo en negrita y el nombre del fichero en gris, el estado
     ("Registrado", "Sin registrar" en ámbar, "(ya no está)"; el código,
     en su columna desde la fila 147) y sus acciones: Abrir, Enviar ▾ y
     ⋯ (el menú de siempre, js/hitos-documento-menu.js). Cada fila
     sigue siendo un `.hito-documento[data-doc]` con su `.hito-doc-abrir`.
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

  function codigoDe(n) {
    var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(n) : {};
    var reg = leido && leido.registro;
    return (sinExtension(n).match(RE_REGISTRO) || [])[0] ||
      (reg && typeof reg === 'object' && window.Nombres && Nombres.codigoRegistro ? Nombres.codigoRegistro(reg) : (typeof reg === 'string' ? reg : ''));
  }

  /* Fila 147: el código de registro va en su columna; aquí, solo el estado. */
  function estadoDe(n, falta) {
    if (falta) return { texto: '(ya no está)', clase: 'mesa-doc-gris' };
    return codigoDe(n) ? { texto: 'Registrado', clase: 'mesa-doc-verde' } : { texto: 'Sin registrar', clase: 'mesa-doc-ambar' };
  }

  function fechaDe(n) {
    var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(n) : null;
    return leido && leido.fecha && window.Plazos ? Plazos.legible(leido.fecha) : '';
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

  /* «Documentos del hito · 2». */
  function cuentaTitulo(h) {
    return String(agrupar(h.documentos || [], null).length);
  }

  function ruta(nombre, subcarpeta) {
    return window.RutaCarpetas ? RutaCarpetas.huecoHTML(nombre, subcarpeta) : '';   /* fila 423: «Ruta» de un documento, un solo botón para todos los sitios */
  }

  /* Fila 160: «N versiones previas · ver», plegado: las de este hito (las
     suyas y los gemelos de las suyas) que viven en «Versiones previas». */
  function previasHTML(h, previas, carpetas) {
    if (!previas || !previas.length) return '';
    var claves = {};
    (h.documentos || []).forEach(function (n) { claves[claveGemelo(n)] = true; });
    var suyas = previas.filter(function (n) { return (h.documentos || []).indexOf(n) !== -1 || claves[claveGemelo(n)]; });
    if (!suyas.length) return '';
    return '<details class="mesa-previas"><summary>' + suyas.length + (suyas.length === 1 ? ' versión previa' : ' versiones previas') +
      ' · ver</summary>' + suyas.map(function (n) {
        return '<div class="mesa-previa-fila"><span class="mesa-previa-nombre">' + U.escapar(n) + '</span>' +
          '<button type="button" class="enlace mesa-previa-abrir" data-doc="' + U.escapar(n) + '">Abrir</button>' +
          ruta(n, (carpetas || {})[n]) +
          '<button type="button" class="enlace mesa-previa-sacar" data-doc="' + U.escapar(n) + '">Sacar de versiones previas</button></div>';
      }).join('') + '</details>';
  }

  function filasHTML(a, h, hitos, nombresDeLaCarpeta, abierto) {
    var previas = (nombresDeLaCarpeta && nombresDeLaCarpeta.previas) || [];
    var docs = (h.documentos || []).filter(function (n) { return previas.indexOf(n) === -1; });
    var plegadas = previasHTML(h, previas, nombresDeLaCarpeta && nombresDeLaCarpeta.carpetaDePrevias);
    /* Fila 425: solo los del propio hito; los demás de la carpeta se ven en la columna de la derecha. */
    /* Fila 145: vacío, una sola línea gris. */
    if (!docs.length) return (abierto ? '<p class="mesa-sin-docs">Ninguno todavía. <span class="mesa-soltar-pista">Suelta aquí un documento del ordenador</span></p>' : '') + plegadas;
    return agrupar(docs, nombresDeLaCarpeta).map(function (g) {
      var falta = !!(nombresDeLaCarpeta && nombresDeLaCarpeta.indexOf(g.nombre) === -1);
      var estado = estadoDe(g.nombre, falta);
      var origen = origenDe(g.nombre, h, hitos);
      /* Fila 147: la tabla con sitio (en la tarjeta grande): casilla,
         documento (tipo y el nombre entero), fecha, registro, estado y
         acciones; los gemelos, debajo, sangrados, cada uno con su «Abrir». */
      return '<div class="hito-documento mesa-doc" data-doc="' + U.escapar(g.nombre) + '">' +
        '<input type="checkbox" class="mesa-doc-marca" title="Seleccionar"' + (falta ? ' disabled' : '') + '>' +
        '<div class="mesa-doc-nombre"><span class="mesa-doc-tipo">' + U.escapar(tipoDe(g.nombre)) + '</span>' +
          '<button type="button" class="hito-doc-abrir' + (falta ? ' hito-doc-falta' : '') + '" data-doc="' + U.escapar(g.nombre) + '">' +
            U.escapar(g.nombre) + (falta ? ' (ya no está)' : '') + '</button>' +
          (origen ? '<span class="mesa-doc-origen">' + U.escapar(origen) + '</span>' : '') +
        '</div>' +
        '<span class="mesa-doc-fecha">' + U.escapar(fechaDe(g.nombre)) + '</span>' +
        '<span class="mesa-doc-registro">' + U.escapar(codigoDe(g.nombre) || '—') + '</span>' +
        '<span class="mesa-doc-estado ' + estado.clase + '">' + U.escapar(estado.texto) + '</span>' +
        '<span class="mesa-doc-acciones">' +
          (falta ? '' : ruta(g.nombre) + '<button type="button" class="enlace mesa-doc-abrir">Abrir</button><button type="button" class="enlace mesa-doc-enviar">Enviar ▾</button>') +
          (abierto && window.HitosDocumentoMenu ? HitosDocumentoMenu.botonHTML(g.nombre) : '') +
        '</span>' +
        g.gemelos.map(function (x) {
          return '<div class="mesa-doc-gemelo-fila"><span class="mesa-doc-gemelo-nombre"><span class="mesa-doc-gemelo-que">' +
            (esSinSellar(x) ? 'Original sin sellar' : 'Borrador en Word') + '</span> · ' + U.escapar(x) + '</span>' +
            '<button type="button" class="enlace mesa-doc-gemelo" data-doc="' + U.escapar(x) + '">Abrir</button>' + ruta(x) + '</div>';
        }).join('') +
      '</div>';
    }).join('') + plegadas;
  }

  /* ---------- con la mesa abierta ---------- */

  async function abrirEnVisor(a, nombre, modo) {
    try {
      var handle = await a.handle.getFileHandle(nombre);
      if (window.Visor) Visor.abrir(handle, nombre, { asunto: a, carpeta: a.handle, modo: modo });
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

  /* Fila 153: «Enviar ▾» de un documento, por correo o por Séneca, con
     ese documento ya elegido. Una sola función (`HitosComunicar.
     comunicarConDocumento`), para no duplicarla en otro sitio que
     también tenga «Enviar» de un documento. */
  function menuEnviarUno(boton, a, h, nombre) {
    if (!window.FichaMenus || !window.HitosComunicar || !HitosComunicar.comunicarConDocumento) return;
    FichaMenus.montar(boton, [
      { texto: 'Por correo', alPulsar: function () { HitosComunicar.comunicarConDocumento(a, h, 'correo', nombre); } },
      { texto: 'Por Séneca', alPulsar: function () { HitosComunicar.comunicarConDocumento(a, h, 'seneca', nombre); } }
    ]);
  }

  /* Fila 282: «Mover a otro hito» deja cada documento solo en el destino (js/hitos-sacar-documento.js), saliendo del hito
     en el que esté de verdad. Si entre los marcados hay alguno que no es de este hito, «Este hito» es un destino más. */
  async function moverAOtroHito(a, h, hitos, nombres) {
    var visibles = Hitos.visibles(hitos);
    var otros = visibles.filter(function (x) { return x.id !== h.id && x.clase !== 'decision'; });
    var hayAjeno = nombres.some(function (n) { return (h.documentos || []).indexOf(n) === -1; }) && h.clase !== 'decision';
    var destinos = (hayAjeno ? [h] : []).concat(otros);
    if (!destinos.length) { U.aviso('No hay otro hito al que moverlo.', 'ambar'); return; }
    var ok = await U.preguntar('Mover a otro hito',
      '<select class="campo" id="mesa-mover-destino">' + destinos.map(function (x) {
        return '<option value="' + U.escapar(x.id) + '">' + (x === h ? 'Este hito (' + U.escapar(window.HitosSacarDocumento ? HitosSacarDocumento.etiqueta(h, hitos) : h.titulo) + ')' : U.escapar(x.titulo)) + '</option>';
      }).join('') + '</select>', 'Mover');
    if (!ok) return;
    var destino = document.getElementById('mesa-mover-destino');
    var id = destino ? destino.value : '';
    var elegido = destinos.filter(function (x) { return x.id === id; })[0];
    if (!elegido) return;
    await HitosSacarDocumento.mover(a, nombres, elegido);
  }

  /* Los documentos marcados para adjuntar: las casillas de los documentos del hito (a la izquierda) y las de la
     carpeta (a la derecha, fila 425), sin repetir. */
  function marcados(fila) {
    var nombres = [];
    function sumar(n) { if (n && nombres.indexOf(n) === -1) nombres.push(n); }
    Array.prototype.forEach.call((fila || document).querySelectorAll('.mesa-doc-marca'), function (c) {
      if (c.checked) sumar(c.closest('.mesa-doc').dataset.doc);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#ficha-documentos .ficha-documento-marca'), function (c) {
      if (c.checked) sumar(c.closest('.ficha-documento-fila').dataset.doc);
    });
    return nombres;
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
    /* Fila 126: con la mesa abierta, «Buscar otra plantilla…» sale siempre. */
    if (!g || (!g.delPaso.length && !g.delTipo.length && !(abierto && window.PlantillaBuscar))) { caja.innerHTML = ''; return; }
    function filaP(p) {
      return '<div class="mesa-plantilla" data-id="' + U.escapar(p.id) + '"><span class="mesa-icono-doc">DOC</span>' +
        '<span class="mesa-plantilla-nombre">' + U.escapar(p.nombre) + '</span>' +
        (abierto ? '<button type="button" class="boton boton-chico mesa-plantilla-generar">Generar documento</button>' : '') +
        /* Fila 171: «… para cada relacionado (N)», si el asunto los tiene. */
        (abierto && window.GenerarParaRelacionados ? GenerarParaRelacionados.botonHTML(a, p) : '') + '</div>';
    }
    /* Fila 164: arriba, los pasos pendientes con receta de generar. */
    caja.innerHTML = (abierto && window.HitoMesaRecetas ? HitoMesaRecetas.bloqueHTML(a, h, 'generar') : '') +
      g.delPaso.map(filaP).join('') +
      (g.delTipo.length ? '<details class="mesa-otras-plantillas"' + (g.delPaso.length ? '' : ' open') + '><summary>' +   /* fila 434: sin plantilla propia, las del tipo se ven abiertas */
        (g.delPaso.length ? 'Otras plantillas (' : 'Plantillas del tipo (') + g.delTipo.length + ')</summary>' +
        g.delTipo.map(filaP).join('') + '</details>' : '') +
      (abierto && window.PlantillaBuscar ? '<button type="button" class="enlace mesa-buscar-plantilla">Buscar otra plantilla…</button>' +
        '<div class="mesa-buscar-caja"></div>' : '');
    if (abierto && window.HitoMesaRecetas) HitoMesaRecetas.enganchar(caja, a, h, 'generar', { fila: fila });
    var buscar = caja.querySelector('.mesa-buscar-plantilla');
    if (buscar) {
      buscar.onclick = function () {
        buscar.classList.add('oculto');
        PlantillaBuscar.montar(caja.querySelector('.mesa-buscar-caja'), async function (p, boton) {
          try {
            await U.mientrasGuarda(boton, function () { return PlantillasDocumento.generar(a, p, 'abierto', { hito: h }); });
          } catch (e) { U.fallo('No he podido generar el documento', e); }
        });
      };
    }
    var todas = g.delPaso.concat(g.delTipo);
    if (abierto && window.GenerarParaRelacionados) GenerarParaRelacionados.enganchar(caja, a, h, todas);
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
     con el hito), con el fichero ya elegido. Fila 425: sobre cualquier parte
     de «Trabajo» (las dos columnas) el fichero entra en el hito abierto; sin
     hito abierto (la lista de hitos), no se hace nada. */
  var ultimaMesa = null;   /* { fila, a, h, hitos } de la mesa abierta, para la casilla de la carpeta */

  function soltarAlHito(destino) {
    var zona = document.getElementById('trabajo-columnas');
    if (!zona) return;
    if (!destino) {
      zona.ondragover = zona.ondragleave = zona.ondrop = null;
      zona.classList.remove('encima');
      return;
    }
    zona.ondragover = function (ev) { ev.preventDefault(); zona.classList.add('encima'); };
    zona.ondragleave = function (ev) { if (!ev.relatedTarget || !zona.contains(ev.relatedTarget)) zona.classList.remove('encima'); };
    zona.ondrop = function (ev) {
      ev.preventDefault();
      zona.classList.remove('encima');
      var ficheros = ev.dataTransfer && ev.dataTransfer.files;
      if (!ficheros || !ficheros.length) return;
      if (window.Perfil && Perfil.esDirectivo()) return;   /* fila 287: un directivo no guarda documentos */
      if (window.Documentos && Documentos.abrir) {
        Documentos.abrir(destino.a, { hito: destino.h, ficheroSoltado: ficheros[0] });
      }
    };
  }

  /* Fila 425: marcar o desmarcar la casilla de un documento de la carpeta cambia la barra de lo marcado. */
  function alMarcar() {
    if (ultimaMesa && ultimaMesa.fila && ultimaMesa.fila.isConnected) pintarSeleccion(ultimaMesa.fila, ultimaMesa.a, ultimaMesa.h, ultimaMesa.hitos);
  }

  function enganchar(fila, a, h, hitos, abierto) {
    if (!h) return;
    var modo = abierto ? 'abierto' : 'archivado';
    if (window.RutaCarpetas) RutaCarpetas.enganchar(fila, a, modo);   /* fila 423 */
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-gemelo'), function (b) {
      b.onclick = function () { abrirEnVisor(a, b.dataset.doc, modo); };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-abrir'), function (b) {
      b.onclick = function () { abrirEnVisor(a, b.closest('.mesa-doc').dataset.doc, modo); };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-enviar'), function (b) {
      menuEnviarUno(b, a, h, b.closest('.mesa-doc').dataset.doc);
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-marca'), function (c) {
      c.onchange = function () { pintarSeleccion(fila, a, h, hitos); };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-previa-abrir'), function (b) {
      b.onclick = function () { if (window.VersionesPrevias) VersionesPrevias.abrir(a, b.dataset.doc, modo); };
    });
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-previa-sacar'), function (b) {
      b.onclick = async function () {
        try { await VersionesPrevias.sacar(a.handle, b.dataset.doc); U.aviso('Devuelto a la carpeta del asunto.', 'bueno'); }
        catch (e) { U.fallo('No he podido sacarlo', e); }
        if (window.HitosPanel) HitosPanel.programarRepintado();
      };
    });
    ultimaMesa = { fila: fila, a: a, h: h, hitos: hitos };
    pintarSeleccion(fila, a, h, hitos);
    pintarPlantillas(fila, a, h, abierto);
    soltarAlHito(abierto ? { a: a, h: h } : null);
    if (abierto && window.HitoMesaComunicar) HitoMesaComunicar.pintar(fila, a, h);
  }

  return { filasHTML: filasHTML, enganchar: enganchar, cuentaTitulo: cuentaTitulo, agrupar: agrupar, claveGemelo: claveGemelo, marcados: marcados,
           moverAOtroHito: moverAOtroHito, soltarAlHito: soltarAlHito, alMarcar: alMarcar };
})();
window.HitoMesaDocumentos = HitoMesaDocumentos;
