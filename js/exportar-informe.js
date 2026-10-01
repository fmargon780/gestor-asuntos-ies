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
       pantalla; apaisada si no caben en vertical.
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

  function imprimir() { window.print(); }

  /* ---------- las páginas ---------- */

  function paginas() {
    return capa ? Array.prototype.slice.call(capa.querySelectorAll('section.exportar-pagina')) : [];
  }

  function hoyLegible() { return ExportarAsuntos.fechaLegible(U.hoyIso()); }

  function celdaHtml(celda, columna) {
    var texto = ExportarAsuntos.textoDeCelda(celda, columna);
    return '<td class="' + (celda.k === 'numero' ? 'exportar-derecha' : '') + '">' + escapar(texto) + '</td>';
  }

  function hitosHtml(r, n) {
    if (!r.hitos || !r.hitos.length) return '';
    var lineas = r.hitos.map(function (h) {
      var partes = [h.estado, h.responsable];
      if (h.plazo) partes.push('plazo ' + ExportarAsuntos.fechaLegible(h.plazo));
      if (h.terminado) partes.push('terminado el ' + ExportarAsuntos.fechaLegible(h.terminado));
      return '<div>' + h.n + '. ' + escapar(h.titulo) + ' <span class="suave">— ' +
        escapar(partes.filter(Boolean).join(' · ')) + '</span></div>';
    }).join('');
    return '<tr class="exportar-hitos"><td colspan="' + n + '">' + lineas + '</td></tr>';
  }

  function cabeceraHtml(membrete, filtros, apaisado) {
    var logo = membrete
      ? '<img class="exportar-membrete" alt="Junta de Andalucía" src="' + membrete + '">'
      : '<div class="exportar-membrete-texto"><strong>Junta de Andalucía</strong></div>';
    return logo +
      '<h1 class="exportar-titulo">Listado de asuntos</h1>' +
      '<p class="exportar-fecha">' + hoyLegible() + '</p>' +
      '<p class="exportar-filtros">' + escapar(filtros) + '</p>';
  }

  function lineaDeFiltros(f, incluyeArchivados) {
    var partes = [];
    if (f.pestanaTexto) partes.push('Pestaña: ' + f.pestanaTexto);
    partes = partes.concat(f.palabras || []);
    if (incluyeArchivados) partes.push('Incluye también los archivados');
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
     puede pasar entero a la página siguiente. */
  function montar(hoja, datos, membrete) {
    var apaisado = datos.tabla.columnas.length > 5;
    var anchoPag = apaisado ? 1123 : 794, altoPag = apaisado ? 794 : 1123;
    var margenSup = apaisado ? 36 : 48, margenInf = 52, margenLados = apaisado ? 40 : 48;
    var altoUtil = altoPag - margenSup - margenInf;
    hoja.innerHTML = '';

    var css = document.getElementById('exportar-pagina-css');
    if (!css) { css = document.createElement('style'); css.id = 'exportar-pagina-css'; document.head.appendChild(css); }
    css.textContent = '@media print { @page { size: A4 ' + (apaisado ? 'landscape' : 'portrait') + '; margin: 0; } }';

    var n = datos.tabla.columnas.length;
    var cabeza = '<thead><tr>' + datos.tabla.columnas.map(function (c) {
      return '<th class="' + (c.clase === 'numero' ? 'exportar-derecha' : '') + '">' + escapar(c.titulo) + '</th>';
    }).join('') + '</tr></thead>';

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

    var cont = paginaNueva(true);
    var tabla = tablaNueva(cont);

    function desborda() { return cont.offsetHeight > altoUtil; }

    datos.registros.forEach(function (r, i) {
      var fila = datos.tabla.filas[i];
      var grupo = document.createElement('tbody');
      grupo.className = 'exportar-asunto';
      grupo.innerHTML = '<tr class="exportar-fila' + (r.abierto ? '' : ' exportar-archivado') + '">' +
        fila.map(function (c, j) { return celdaHtml(c, datos.tabla.columnas[j]); }).join('') + '</tr>' +
        (datos.conHitos ? hitosHtml(r, n) : '');
      tabla.appendChild(grupo);
      if (desborda() && tabla.querySelectorAll('tbody.exportar-asunto').length > 1) {
        tabla.removeChild(grupo);
        cont = paginaNueva(false);
        tabla = tablaNueva(cont);
        tabla.appendChild(grupo);
      }
    });

    var totales = document.createElement('div');
    totales.innerHTML = totalesHtml(datos.tabla);
    cont.appendChild(totales.firstChild);
    if (desborda() && cont.querySelectorAll('tbody.exportar-asunto').length > 0) {
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

  /* `datos`: { tabla, registros, filtros (ExportarAsuntos.filtrosActuales), conHitos,
     incluyeArchivados, por }. */
  async function abrir(datos) {
    construir();
    var nombre = 'Listado de asuntos';
    capa.querySelector('.word-visor-nombre').textContent = nombre;
    var hoja = capa.querySelector('.exportar-hoja');
    hoja.innerHTML = '<p class="explica">Preparando el informe…</p>';
    capa.classList.remove('oculto');
    document.body.classList.add('con-exportar-visor');
    try {
      var membrete = null;
      if (window.Membrete && Membrete.montar) {
        var m = await Membrete.montar({ conLogoCentro: true });
        if (m && m.bytes) {
          if (urlMembrete) URL.revokeObjectURL(urlMembrete);
          urlMembrete = URL.createObjectURL(new Blob([m.bytes], { type: 'image/png' }));
          membrete = urlMembrete;
        }
      }
      datos.lineaDeFiltros = lineaDeFiltros(datos.filtros || {}, datos.incluyeArchivados);
      var r = montar(hoja, datos, membrete);
      actual = { nombre: nombre, apaisado: r.apaisado };
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
    if (!actual) return;
    try {
      await U.mientrasGuarda(boton, async function () {
        var blob = await hacerPdf();
        ExportarHoja.descargar(blob, nombrePdf());
      });
    } catch (e) { U.fallo('No he podido guardar el PDF', e); return; }
    U.aviso('PDF guardado: ' + nombrePdf(), 'bueno');
  }

  return { abrir: abrir, cerrar: cerrar, abierto: abierto, nombrePdf: nombrePdf, hacerPdf: hacerPdf,
           _lineaDeFiltros: lineaDeFiltros };
})();
window.ExportarInforme = ExportarInforme;
