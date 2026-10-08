/* ============================================================
   exportar-informe.js — el informe de «Exportar ▾ → Informe en PDF»
   (1-oct-2026, fila 241, docs/EXPORTAR-ASUNTOS.md, sección 5).

   Se abre en una capa a pantalla completa, igual que el Word
   (js/word-visor.js, mismo estilo, css/word-visor.css), con tres
   botones: «Guardar PDF», «Imprimir» y «Cerrar» (y Escape). Lleva:

     - El membrete de la Junta (Membrete.montar; sin él, un encabezado
       de texto), el título «Listado de asuntos», la fecha de hoy y una
       línea con los filtros aplicados.
     - La tabla con las columnas elegidas, en el mismo orden que la
       pantalla; apaisada si no caben en vertical. Con «Agrupar por» (fila 278,
       js/exportar-agrupar.js), en bloques: título, su tabla (sin las columnas
       por las que se agrupa) y una línea de cierre con su número de asuntos y
       sus sumas; sin saltos de página entre bloques.
     - Con «Incluir los hitos», debajo de cada asunto sus hitos en letra
       pequeña (título, estado, responsable y fechas).
     - Al final: «N asuntos» y la suma de cada columna de cantidades
       («Total Importe: 345,00 €»), con el formato español.

   Las páginas se cortan midiendo (cada asunto entero en una página).
   «Guardar PDF» hace una imagen de cada página a 200 ppp (como el
   Word) y la descarga; «Imprimir» saca solo las páginas.
   ============================================================ */
var ExportarInforme = (function () {

  var PPP = 200;
  var CLAVE = 'exportar-visor';
  var capa = null;
  var actual = null;   /* { nombre, apaisado } */
  var cargas = {};
  var urlMembrete = null;

  function cargarScript(ruta, global) {
    if (window[global]) return Promise.resolve(window[global]);
    if (cargas[ruta]) return cargas[ruta];
    cargas[ruta] = new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = ruta;
      s.onload = function () { resolver(window[global]); };
      s.onerror = function () { delete cargas[ruta]; rechazar(new Error('No se ha podido cargar ' + ruta + '.')); };
      document.head.appendChild(s);
    });
    return cargas[ruta];
  }

  function escapar(t) { return U.escapar(t); }

  function construir() {
    if (capa) return;
    capa = document.createElement('div');
    capa.id = CLAVE;
    capa.className = 'word-visor exportar-visor oculto';
    capa.innerHTML =
      '<div class="word-visor-barra">' +
        '<span class="word-visor-nombre"></span>' +
        '<span class="exportar-aviso oculto" role="alert"></span>' +
        '<span class="word-visor-botones">' +
          '<button type="button" class="boton boton-principal exportar-guardar-pdf">Guardar PDF</button>' +
          '<button type="button" class="boton exportar-imprimir">Imprimir</button>' +
          '<button type="button" class="boton exportar-cerrar">Cerrar</button>' +
        '</span>' +
      '</div>' +
      '<div class="word-visor-hoja exportar-hoja"></div>';
    document.body.appendChild(capa);
    capa.querySelector('.exportar-cerrar').onclick = cerrar;
    capa.querySelector('.exportar-imprimir').onclick = imprimir;
    capa.querySelector('.exportar-guardar-pdf').onclick = function (ev) { guardarPdf(ev.currentTarget); };
  }

  function abierto() { return !!(capa && !capa.classList.contains('oculto')); }

  function cerrar() {
    if (!capa) return;
    capa.classList.add('oculto');
    document.body.classList.remove('con-exportar-visor');
    capa.querySelector('.exportar-hoja').innerHTML = '';
    var css = document.getElementById('exportar-pagina-css');
    if (css) css.remove();
    if (urlMembrete) { URL.revokeObjectURL(urlMembrete); urlMembrete = null; }
    actual = null;
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && abierto() && !document.querySelector('#capa:not(.oculto)')) { ev.stopPropagation(); cerrar(); }
  }, true);

  function imprimir() { if (revisar().completo) window.print(); }

  /* ---------- las páginas ---------- */

  function paginas() {
    return capa ? Array.prototype.slice.call(capa.querySelectorAll('section.exportar-pagina')) : [];
  }

  function hoyLegible() { return ExportarAsuntos.fechaLegible(U.hoyIso()); }

  /* Las líneas de hitos de un asunto, una por hito (fila 307: así un asunto muy alto se puede repartir). */
  function lineasDeHitos(r) {
    return (r.hitos || []).map(function (h) {
      var partes = [h.estado, h.responsable];
      if (h.plazo) partes.push('plazo ' + ExportarAsuntos.fechaLegible(h.plazo));
      if (h.terminado) partes.push('terminado el ' + ExportarAsuntos.fechaLegible(h.terminado));
      return '<div>' + h.n + '. ' + escapar(h.titulo) + ' <span class="suave">— ' +
        escapar(partes.filter(Boolean).join(' · ')) + '</span></div>';
    });
  }

  function cabeceraHtml(membrete, filtros, apaisado) {
    var logo = membrete
      ? '<img class="exportar-membrete" alt="Junta de Andalucía" src="' + membrete.url + '" width="' + membrete.ancho + '" height="' + membrete.alto + '">'
      : '<div class="exportar-membrete-texto"><strong>Junta de Andalucía</strong></div>';
    return logo +
      '<h1 class="exportar-titulo">Listado de asuntos</h1>' +
      '<p class="exportar-fecha">' + hoyLegible() + '</p>' +
      '<p class="exportar-filtros">' + escapar(filtros) + '</p>';
  }

  function lineaDeFiltros(f, incluyeArchivados, agrupado) {
    var partes = [];
    if (f.pestanaTexto) partes.push('Pestaña: ' + f.pestanaTexto);
    partes = partes.concat(f.palabras || []);
    if (incluyeArchivados) partes.push('Incluye también los archivados');
    if (agrupado && agrupado.niveles.length) partes.push(ExportarAgrupar.textoDeAgrupado(agrupado));   /* fila 278 */
    return partes.join(' · ');
  }

  function totalesHtml(tabla) {
    var lineas = ['<p class="exportar-total-n"><strong>' + escapar(ExportarAsuntos.textoDeNumeroDeAsuntos(tabla.total)) + '</strong></p>'];
    tabla.columnas.forEach(function (c, i) {
      if (c.clase === 'numero') lineas.push('<p class="exportar-total">' + escapar(ExportarAsuntos.textoDeTotal(tabla, i)) + '</p>');
    });
    return '<div class="exportar-totales">' + lineas.join('') + '</div>';
  }

  /* Cada asunto es un <tbody> propio (su fila y sus hitos): así se
     puede pasar entero a la página siguiente. Con `datos.agrupado`
     (fila 278, js/exportar-agrupar.js) el informe va en bloques: título,
     su tabla (sin las columnas por las que se agrupa) y su línea de cierre. */
  function montar(hoja, datos, membrete) {
    var agr = datos.agrupado && datos.agrupado.niveles.length ? datos.agrupado : null;
    var pos = agr ? agr.posiciones : datos.tabla.columnas.map(function (c, i) { return i; });
    var cols = pos.map(function (i) { return datos.tabla.columnas[i]; });
    var apaisado = cols.length > 5;
    var anchoPag = apaisado ? 1123 : 794, altoPag = apaisado ? 794 : 1123;
    var margenSup = apaisado ? 36 : 48, margenInf = 52, margenLados = apaisado ? 40 : 48;
    var altoUtil = altoPag - margenSup - margenInf;
    hoja.innerHTML = '';

    var css = document.getElementById('exportar-pagina-css');
    if (!css) { css = document.createElement('style'); css.id = 'exportar-pagina-css'; document.head.appendChild(css); }
    css.textContent = '@media print { @page { size: A4 ' + (apaisado ? 'landscape' : 'portrait') + '; margin: 0; } }';

    var n = cols.length;
    var cabeza = '<thead><tr>' + cols.map(function (c) {
      return '<th class="' + (c.clase === 'numero' ? 'exportar-derecha' : '') + '">' + escapar(c.titulo) + '</th>';
    }).join('') + '</tr></thead>';

    var base = 0;   /* cuántos hijos tiene una página recién hecha (su cabecera) */
    function paginaNueva(conCabecera) {
      var sec = document.createElement('section');
      sec.className = 'exportar-pagina ' + (apaisado ? 'exportar-apaisada' : 'exportar-vertical');
      sec.style.width = anchoPag + 'px';
      sec.style.height = altoPag + 'px';
      sec.style.padding = margenSup + 'px ' + margenLados + 'px ' + margenInf + 'px';
      var cont = document.createElement('div');
      cont.className = 'exportar-contenido';
      if (conCabecera) cont.innerHTML = cabeceraHtml(membrete, datos.lineaDeFiltros, apaisado);
      sec.appendChild(cont);
      hoja.appendChild(sec);
      base = cont.children.length;
      return cont;
    }

    function tablaNueva(cont) {
      var t = document.createElement('table');
      t.className = 'exportar-tabla';
      t.innerHTML = cabeza;
      var cuerpo = document.createElement('tbody');
      t.appendChild(cuerpo);
      cont.appendChild(t);
      return t;
    }

    function celdaHtml(celda, columna) {
      var texto = ExportarAsuntos.textoDeCelda(celda, columna);
      return '<td class="' + (celda.k === 'numero' ? 'exportar-derecha' : '') + '">' + escapar(texto) + '</td>';
    }

    /* Un asunto: su fila y sus hitos desde `desde` hasta `hasta` (sin incluir). Con `continua`, es la fila repetida
       de un asunto que sigue de la página anterior: lleva «(continúa)» y no cuenta como otro asunto. */
    function grupoDe(i, desde, hasta, continua) {
      var r = datos.registros[i], fila = datos.tabla.filas[i];
      var lineas = datos.conHitos ? lineasDeHitos(r) : [];
      var puesto = false;
      var celdas = pos.map(function (p, j) {
        var h = celdaHtml(fila[p], cols[j]);
        if (continua && !puesto && fila[p].k === 'texto' && ExportarAsuntos.textoDeCelda(fila[p], cols[j])) {
          puesto = true;
          h = h.replace('</td>', ' (continúa)</td>');
        }
        return h;
      });
      if (continua && !puesto) celdas[0] = celdas[0].replace('</td>', ' (continúa)</td>');
      var grupo = document.createElement('tbody');
      grupo.className = 'exportar-asunto';
      grupo.innerHTML = '<tr class="' + (continua ? 'exportar-fila-continua' : 'exportar-fila') + (r.abierto ? '' : ' exportar-archivado') + '">' +
        celdas.join('') + '</tr>' +
        (lineas.length ? '<tr class="exportar-hitos"><td colspan="' + n + '">' + lineas.slice(desde, hasta).join('') + '</td></tr>' : '');
      return grupo;
    }

    var cont = paginaNueva(true);
    var tabla = null;
    var titulosAhora = [];
    function desborda() { return cont.offsetHeight > altoUtil; }
    function hayPrevio() { return cont.children.length > base; }

    function elTitulo(t, continua) {
      var d = document.createElement('div');
      d.className = 'exportar-bloque-titulo exportar-bloque-' + t.nivel;
      d.textContent = t.texto + (continua ? ' (continúa)' : '');
      return d;
    }
    function elCierre(t) {
      var d = document.createElement('div');
      d.className = 'exportar-cierre exportar-cierre-' + t.nivel;
      d.textContent = t.texto;
      return d;
    }

    /* Pone en la página de ahora el asunto `i` (sus hitos de `desde` a `hasta`), con los títulos y la tabla si
       empieza un bloque o si la página no tiene ya la tabla, y con las líneas de cierre si `conCierres`.
       Devuelve lo que ha puesto y cómo quitarlo. */
    function intento(i, desde, hasta, nuevoBloque, continua, cierres) {
      var nodos = [], grupo;
      var tablaAnterior = tabla;
      var nueva = nuevoBloque || !tabla || tabla.parentNode !== cont;
      if (nueva) {
        if (agr) titulosAhora.forEach(function (t) { var e = elTitulo(t, !nuevoBloque); cont.appendChild(e); nodos.push(e); });
        tabla = tablaNueva(cont);
        nodos.push(tabla);
      }
      grupo = grupoDe(i, desde, hasta, continua);
      tabla.appendChild(grupo);
      var elementosCierre = cierres ? cierres() : [];
      elementosCierre.forEach(function (e) { cont.appendChild(e); nodos.push(e); });
      return {
        grupo: grupo, cierres: elementosCierre,
        quitar: function () {
          if (grupo.parentNode) grupo.parentNode.removeChild(grupo);
          nodos.forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
          if (!nueva) tabla = tablaAnterior;
        }
      };
    }

    /* Lo que no cabe pasa entero a la página siguiente; un asunto que no cabe ni en una página vacía se reparte
       (su fila se repite con «(continúa)» y el resto de sus hitos). Las líneas de cierre van con el último trozo. */
    function poner(i, opciones) {
      var total = datos.conHitos ? (datos.registros[i].hitos || []).length : 0;
      var desde = 0, continua = false, nuevoBloque = opciones.nuevoBloque;
      for (var vuelta = 0; vuelta < 1000; vuelta++) {
        var previo = hayPrevio();
        var u = intento(i, desde, total, nuevoBloque, continua, opciones.cierres);
        if (desborda() && previo) {
          u.quitar();
          cont = paginaNueva(false);
          u = intento(i, desde, total, nuevoBloque, continua, opciones.cierres);
        }
        var hasta = total;
        var divs = u.grupo.querySelectorAll('.exportar-hitos div');
        while (desborda() && hasta > desde + 1) {
          divs[hasta - desde - 1].parentNode.removeChild(divs[hasta - desde - 1]);
          hasta--;
          u.cierres.forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
        }
        if (hasta >= total) return;
        desde = hasta; continua = true; nuevoBloque = false;
        cont = paginaNueva(false);
      }
    }

    if (!agr) {
      if (!datos.registros.length) tablaNueva(cont);
      datos.registros.forEach(function (r, i) { poner(i, { nuevoBloque: i === 0, cierres: null }); });
    } else {
      /* ---- el informe agrupado ---- */
      /* Las hojas del árbol de bloques (los del último nivel), con los títulos que abre cada una y las líneas que cierra. */
      function hojasDelArbol() {
        var hojas = [];
        (function recorrer(lista, nivel) {
          lista.forEach(function (b) {
            if (!b.hijos.length) { hojas.push({ bloque: b, nivel: nivel, abre: [], cierra: [{ nivel: nivel, bloque: b }] }); return; }
            var desde = hojas.length;
            recorrer(b.hijos, nivel + 1);
            hojas[desde].abre.unshift({ nivel: nivel, bloque: b });
            hojas[hojas.length - 1].cierra.push({ nivel: nivel, bloque: b });
          });
        })(agr.bloques, 0);
        return hojas;
      }

      var NIVELES = ['exterior', 'interior'];
      hojasDelArbol().forEach(function (h) {
        var b = h.bloque;
        titulosAhora = h.abre.map(function (x) { return { nivel: NIVELES[x.nivel] || 'interior', texto: x.bloque.titulo }; })
          .concat([{ nivel: NIVELES[h.nivel] || 'interior', texto: b.titulo }]);
        var cierres = function () {
          return h.cierra.map(function (x) {
            return elCierre({ nivel: x.nivel === 0 && agr.niveles.length > 1 ? 'exterior' : 'interior', texto: ExportarAgrupar.lineaDeCierre(datos.tabla, agr, x.bloque) });
          });
        };
        b.filas.forEach(function (i, k) {
          poner(i, { nuevoBloque: k === 0, cierres: k === b.filas.length - 1 ? cierres : null });
        });
      });
    }

    var totales = document.createElement('div');
    totales.innerHTML = totalesHtml(datos.tabla);
    cont.appendChild(totales.firstChild);
    if (desborda() && cont.children.length > base) {
      var bloque = cont.querySelector('.exportar-totales');
      cont.removeChild(bloque);
      cont = paginaNueva(false);
      cont.appendChild(bloque);
    }

    /* El pie de cada página. */
    var todas = paginas();
    var pie = 'Generado por el Gestor de Asuntos el ' + hoyLegible() +
      (datos.por ? ', por ' + datos.por : '') + '.';
    todas.forEach(function (sec, i) {
      var p = document.createElement('div');
      p.className = 'exportar-pie';
      p.innerHTML = '<span>' + escapar(pie) + '</span><span>Página ' + (i + 1) + ' de ' + todas.length + '</span>';
      sec.appendChild(p);
    });
    return { apaisado: apaisado };
  }

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* El membrete, ya cargado y con su alto (si no carga en unos segundos, encabezado de texto). */
  async function prepararMembrete() {
    if (!(window.Membrete && Membrete.montar)) return null;
    var m = await Membrete.montar({ conLogoCentro: true });
    if (!(m && m.bytes)) return null;
    if (urlMembrete) URL.revokeObjectURL(urlMembrete);
    var url = URL.createObjectURL(new Blob([m.bytes], { type: 'image/png' }));
    urlMembrete = url;
    var img = new Image();
    img.src = url;
    try {
      await Promise.race([img.decode(), esperar(4000).then(function () { throw new Error('tarda'); })]);
    } catch (e) { return null; }
    if (!img.naturalWidth || !img.naturalHeight) return null;
    return { url: url, ancho: img.naturalWidth, alto: img.naturalHeight };
  }

  /* La cuenta (fila 307): si en las páginas falta algún asunto o algo desborda, aviso rojo y botones apagados. */
  function revisar() {
    if (!capa || !actual) return { completo: true };
    var r = ExportarComprobar.comprobar(paginas(), actual.esperados);
    var aviso = capa.querySelector('.exportar-aviso');
    var texto = r.completo ? '' : ExportarComprobar.textoDeAviso(r);
    aviso.textContent = texto;
    aviso.classList.toggle('oculto', r.completo);
    ['.exportar-guardar-pdf', '.exportar-imprimir'].forEach(function (q) {
      var b = capa.querySelector(q);
      b.disabled = !r.completo;
      if (r.completo) b.removeAttribute('title'); else b.title = texto;
    });
    return r;
  }

  /* `datos`: { tabla, registros, filtros (ExportarAsuntos.filtrosActuales), conHitos,
     incluyeArchivados, por }. */
  async function abrir(datos) {
    construir();
    var nombre = 'Listado de asuntos';
    capa.querySelector('.word-visor-nombre').textContent = nombre;
    var hoja = capa.querySelector('.exportar-hoja');
    hoja.innerHTML = '<p class="explica">Preparando el informe…</p>';
    actual = null;
    capa.querySelector('.exportar-aviso').classList.add('oculto');
    capa.querySelector('.exportar-guardar-pdf').disabled = false;
    capa.querySelector('.exportar-imprimir').disabled = false;
    capa.classList.remove('oculto');
    document.body.classList.add('con-exportar-visor');
    try {
      var membrete = await prepararMembrete();
      datos.lineaDeFiltros = lineaDeFiltros(datos.filtros || {}, datos.incluyeArchivados, datos.agrupado);
      /* El reparto de páginas mide: antes, todo tiene que estar cargado (fila 307). */
      await Promise.race([document.fonts && document.fonts.ready, esperar(3000)]);
      var r = montar(hoja, datos, membrete);
      actual = { nombre: nombre, apaisado: r.apaisado, esperados: datos.registros.length };
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (actual) revisar(); }); });
    } catch (e) {
      hoja.innerHTML = '<p class="explica">No he podido preparar el informe: ' + escapar(U.mensajeDeError(e)) + '</p>';
    }
  }

  /* ---------- guardar el PDF ---------- */

  function nombrePdf() {
    var d = new Date();
    var aammdd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return aammdd + ' Listado de asuntos.pdf';
  }

  async function hacerPdf() {
    var html2canvas = await cargarScript('js/lib/html2canvas.min.js', 'html2canvas');
    var PDFLib = await cargarScript('js/lib/pdf-lib.min.js', 'PDFLib');
    var pdf = await PDFLib.PDFDocument.create();
    var lista = paginas();
    if (!lista.length) throw new Error('El informe no tiene páginas que guardar.');
    for (var i = 0; i < lista.length; i++) {
      var el = lista[i];
      var lienzo = await html2canvas(el, { scale: PPP / 96, backgroundColor: '#ffffff', useCORS: true, logging: false });
      var bytes = await new Promise(function (r) { lienzo.toBlob(function (b) { r(b.arrayBuffer()); }, 'image/jpeg', 0.92); });
      var img = await pdf.embedJpg(await bytes);
      var ancho = el.offsetWidth * 0.75, alto = el.offsetHeight * 0.75;
      var pagina = pdf.addPage([ancho, alto]);
      pagina.drawImage(img, { x: 0, y: 0, width: ancho, height: alto });
    }
    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  async function guardarPdf(boton) {
    if (!actual || !revisar().completo) return;
    try {
      await U.mientrasGuarda(boton, async function () {
        var blob = await hacerPdf();
        ExportarHoja.descargar(blob, nombrePdf());
      });
    } catch (e) { U.fallo('No he podido guardar el PDF', e); return; }
    U.aviso('PDF guardado: ' + nombrePdf(), 'bueno');
  }

  return { abrir: abrir, cerrar: cerrar, abierto: abierto, nombrePdf: nombrePdf, hacerPdf: hacerPdf, revisar: revisar,
           _lineaDeFiltros: lineaDeFiltros };
})();
window.ExportarInforme = ExportarInforme;
