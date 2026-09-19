/* ============================================================
   pdf-separar-unir.js — el cuadro de Separar, Unir y Sacar páginas
   (17-sep-2026, fila 22, docs/SEPARAR-Y-UNIR-PDF.md).

   La misma máquina sirve en dos sitios: la carpeta de un asunto
   (js/ficha-asunto.js) y Por clasificar (js/documentos-sueltos.js).
   Quien llama monta un `contexto`:

       { modo: 'asunto' | 'suelto',
         dir: la carpeta donde está el fichero (asunto.handle, o
              App.E.abiertos para un suelto),
         nombre: el nombre del fichero sobre el que se ha pulsado,
         handle: su FileSystemFileHandle,
         asunto: el asunto (solo en modo 'asunto'; hace falta para
                 nombrar el resultado y para la papelera),
         alTerminar: se llama si algo ha cambiado, para repintar }

   `js/pdf-herramientas.js` hace el trabajo de verdad con los bytes
   (pdf-lib); aquí solo se pintan las miniaturas (con pdf.js, que ya
   está) y los cuadros, y se lee/escribe el disco.
   ============================================================ */
var PdfSepararUnir = (function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- pdf.js, para las miniaturas ----------

     Mismo truco que js/registro-lector.js: si otro módulo ya lo ha
     cargado (`window.pdfjsLib`), no se vuelve a traer. Desde la
     versión 4.2.67 (fila 72, docs/DETALLES-DE-MANTENIMIENTO.md, punto
     5) pdf.js solo se distribuye como módulo, así que se trae con
     `import()` en vez de una etiqueta `<script>`. */
  var cargandoPdfJs = null;
  function cargarPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (cargandoPdfJs) return cargandoPdfJs;
    cargandoPdfJs = import('./lib/pdf.min.mjs').then(function (modulo) {
      window.pdfjsLib = modulo;
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/lib/pdf.worker.min.mjs';
      return window.pdfjsLib;
    }, function () {
      throw new Error('No se ha podido cargar pdf.js.');
    });
    return cargandoPdfJs;
  }

  async function abrirConPdfJs(bytes) {
    var pdfjsLib = await cargarPdfJs();
    try { return await pdfjsLib.getDocument({ data: bytes.slice() }).promise; }
    catch (e) {
      var error = new Error('Este PDF no se puede abrir: puede que venga protegido o roto.');
      error.name = 'PdfIlegible';
      throw error;
    }
  }

  async function renderizarPagina(pdfDoc, numPagina, canvas, anchoDeseado) {
    var pagina = await pdfDoc.getPage(numPagina);
    var base = pagina.getViewport({ scale: 1 });
    var viewport = pagina.getViewport({ scale: anchoDeseado / base.width });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
  }

  /* Una sola imagen suelta (la miniatura grande del cuadro de poner
     nombre), como un `data:` para meterla en un `<img>` sin líos de
     memoria que recoger luego. */
  async function miniaturaDeBytes(bytes, anchoDeseado) {
    var pdfDoc = await abrirConPdfJs(bytes);
    var canvas = document.createElement('canvas');
    await renderizarPagina(pdfDoc, 1, canvas, anchoDeseado);
    return canvas.toDataURL('image/png');
  }

  /* Las miniaturas de una rejilla no se pintan todas de golpe: un PDF
     de cientos de páginas se quedaría pillado. Se renderiza cada una
     solo cuando su hueco entra en pantalla (`IntersectionObserver`,
     con margen de sobra para que no se note el hueco al desplazar). */
  function observarRejilla(pdfDoc, ancho) {
    return new IntersectionObserver(function (entradas, observador) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var canvas = entrada.target;
        observador.unobserve(canvas);
        renderizarPagina(pdfDoc, Number(canvas.dataset.pagina), canvas, ancho).catch(function () {});
      });
    }, { rootMargin: '300px' });
  }

  /* ---------- la rejilla de miniaturas ---------- */

  var ANCHO_MINIATURA = 130;

  /* `conTijeras`: pone una tijera entre cada dos páginas, y llama a
     `alCortar(despuesDePagina)` cuando se pulsa una (despuesDePagina
     es 1-indexado: 1 = después de la primera página).
     `conCasillas`: pone una casilla en cada página, y llama a
     `alMarcar(numPagina, marcada)`.
     Solo uno de los dos se usa a la vez. */
  function pintarRejilla(caja, pdfDoc, total, opciones) {
    caja.innerHTML = '';
    var observador = observarRejilla(pdfDoc, ANCHO_MINIATURA);
    for (var i = 1; i <= total; i++) {
      var celda = document.createElement('div');
      celda.className = 'pdf-pagina';

      var canvas = document.createElement('canvas');
      canvas.dataset.pagina = i;
      celda.appendChild(canvas);
      observador.observe(canvas);

      var pie = document.createElement('div');
      pie.className = 'pdf-pagina-pie';
      if (opciones.conCasillas) {
        var etiqueta = document.createElement('label');
        var casilla = document.createElement('input');
        casilla.type = 'checkbox';
        casilla.dataset.pagina = i;
        casilla.onchange = function (ev) {
          opciones.alMarcar(Number(ev.target.dataset.pagina), ev.target.checked);
        };
        etiqueta.appendChild(casilla);
        etiqueta.appendChild(document.createTextNode(' ' + i));
        pie.appendChild(etiqueta);
      } else {
        pie.textContent = i;
      }
      celda.appendChild(pie);
      caja.appendChild(celda);

      if (opciones.conTijeras && i < total) {
        var tijera = document.createElement('button');
        tijera.type = 'button';
        tijera.className = 'pdf-tijera';
        tijera.title = 'Cortar aquí';
        tijera.textContent = '✂';
        tijera.dataset.despuesDe = i;
        tijera.onclick = function (ev) {
          var boton = ev.currentTarget;
          var activa = boton.classList.toggle('activa');
          opciones.alCortar(Number(boton.dataset.despuesDe), activa);
        };
        caja.appendChild(tijera);
      }
    }
  }

  /* ---------- Separar ---------- */

  /* "a, b y c", que es como se escribe una lista en español, no
     "a, b, c". */
  function listaEnEspanol(partes) {
    if (partes.length < 2) return partes.join('');
    return partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
  }

  function resumenDeCortes(total, cortes) {
    var trozos = PdfHerramientas.cortesATrozos(cortes, total);
    if (trozos.length < 2) return 'Marca una tijera entre dos páginas para partir el documento.';
    var rangos = trozos.map(function (t) {
      return t.length === 1 ? String(t[0] + 1) : (t[0] + 1) + '-' + (t[t.length - 1] + 1);
    });
    return 'Van a salir ' + trozos.length + ' documentos: páginas ' + listaEnEspanol(rangos) + '.';
  }

  async function separar(contexto) {
    var fichero;
    try { fichero = await contexto.handle.getFile(); }
    catch (e) { U.aviso('No he podido abrir el documento: ' + e.message, 'malo'); return; }
    var bytes = new Uint8Array(await fichero.arrayBuffer());

    var pdfDoc;
    try { pdfDoc = await abrirConPdfJs(bytes); }
    catch (e) { U.aviso(e.message, 'malo'); return; }
    var total = pdfDoc.numPages;

    if (total < 2) {
      await U.preguntar('Separar "' + contexto.nombre + '"',
        '<p class="explica">Este PDF solo tiene una página: no hay dónde cortar.</p>', 'Entendido', true);
      return;
    }

    var cortes = {};
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-ancho');
    $('cuadro-cancelar').textContent = 'Dejarlo';

    var promesa = U.preguntar('Separar "' + contexto.nombre + '"',
      '<p class="explica" id="pdf-resumen">' + U.escapar(resumenDeCortes(total, [])) + '</p>' +
      '<div id="pdf-rejilla" class="pdf-rejilla"></div>', 'Separar');

    pintarRejilla($('pdf-rejilla'), pdfDoc, total, {
      conTijeras: true,
      alCortar: function (despuesDe, activa) {
        if (activa) cortes[despuesDe] = true; else delete cortes[despuesDe];
        $('pdf-resumen').textContent = resumenDeCortes(total, Object.keys(cortes).map(Number));
      }
    });

    var ok = await promesa;
    cuadro.classList.remove('cuadro-ancho');
    $('cuadro-cancelar').textContent = 'Cancelar';
    if (!ok) return;

    var listaCortes = Object.keys(cortes).map(Number).sort(function (a, b) { return a - b; });
    if (!listaCortes.length) { U.aviso('No has marcado ningún corte.', 'malo'); return; }

    var trozos;
    try { trozos = await PdfHerramientas.separar(bytes, listaCortes); }
    catch (e) { U.aviso(e.message, 'malo'); return; }

    await guardarTrozosDeSeparar(contexto, trozos);
  }

  async function guardarTrozosDeSeparar(contexto, trozos) {
    if (contexto.modo === 'asunto') {
      var guardados = 0;
      for (var i = 0; i < trozos.length; i++) {
        var nombreNuevo = await abrirCuadroDeNombre(contexto.asunto, trozos[i], contexto.nombre,
          'Nombrar el trozo ' + (i + 1) + ' de ' + trozos.length,
          'Trozo ' + (i + 1) + ' de ' + trozos.length + '.');
        if (!nombreNuevo) break;
        guardados++;
      }
      if (!guardados) return;
      if (guardados < trozos.length) {
        U.aviso(guardados + ' de ' + trozos.length + ' trozos guardados; se ha dejado a medias.', 'malo');
      } else {
        U.aviso('Documento partido en ' + trozos.length + '.', 'bueno');
      }
      await mandarOriginalAPapelera(contexto);
      if (contexto.alTerminar) contexto.alTerminar();
      return;
    }

    var base = String(contexto.nombre).replace(/\.[A-Za-z0-9]{1,8}$/, '');
    var yaEsta = (await Carpetas.ficheros(contexto.dir)).map(function (f) { return f.nombre; });
    var escritos = 0;
    for (var j = 0; j < trozos.length; j++) {
      var nombreSuelto = base + ' (' + (j + 1) + ' de ' + trozos.length + ').pdf';
      if (PdfHerramientas.hayColision(yaEsta, nombreSuelto)) {
        U.aviso('Ya hay un fichero llamado "' + nombreSuelto + '": no se ha tocado.', 'malo');
        continue;
      }
      await Carpetas.escribirBytes(contexto.dir, nombreSuelto, trozos[j], 'application/pdf');
      yaEsta.push(nombreSuelto);
      escritos++;
    }
    if (!escritos) return;
    U.aviso('Documento partido en ' + escritos + '.', 'bueno');
    await mandarOriginalAPapelera(contexto);
    if (contexto.alTerminar) contexto.alTerminar();
  }

  /* ---------- Unir ---------- */

  async function listarOtrosPdf(contexto) {
    var lista = await Carpetas.ficheros(contexto.dir);
    return lista.filter(function (f) {
      return f.nombre !== contexto.nombre && PdfHerramientas.esPdf(f.nombre, '');
    });
  }

  function pintarListaDeUnir(caja, candidatos, elegidos) {
    caja.innerHTML = candidatos.map(function (c, i) {
      var pos = elegidos.indexOf(i);
      return '<div class="unir-fila">' +
        '<label><input type="checkbox" class="unir-marca" data-indice="' + i + '"' +
          (pos !== -1 ? ' checked' : '') + '>' +
          '<span>' + U.escapar(c.nombre) + '</span>' +
          '<span class="suave"> · ' +
            (c.paginas != null ? c.paginas + (c.paginas === 1 ? ' página' : ' páginas') : '?') +
          '</span></label>' +
        '<span class="unir-orden">' + (pos !== -1 ? (pos + 2) + 'º' : '') + '</span>' +
        '<button type="button" class="boton unir-subir" data-indice="' + i + '"' +
          (pos <= 0 ? ' disabled' : '') + ' title="Antes">▲</button>' +
        '<button type="button" class="boton unir-bajar" data-indice="' + i + '"' +
          (pos === -1 || pos === elegidos.length - 1 ? ' disabled' : '') + ' title="Después">▼</button>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(caja.querySelectorAll('.unir-marca'), function (c) {
      c.onchange = function () {
        var i = Number(c.dataset.indice);
        if (c.checked) elegidos.push(i);
        else { var p = elegidos.indexOf(i); if (p !== -1) elegidos.splice(p, 1); }
        pintarListaDeUnir(caja, candidatos, elegidos);
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('.unir-subir'), function (b) {
      b.onclick = function () {
        var i = Number(b.dataset.indice);
        var p = elegidos.indexOf(i);
        if (p > 0) { var t = elegidos[p - 1]; elegidos[p - 1] = elegidos[p]; elegidos[p] = t; }
        pintarListaDeUnir(caja, candidatos, elegidos);
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('.unir-bajar'), function (b) {
      b.onclick = function () {
        var i = Number(b.dataset.indice);
        var p = elegidos.indexOf(i);
        if (p !== -1 && p < elegidos.length - 1) { var t = elegidos[p + 1]; elegidos[p + 1] = elegidos[p]; elegidos[p] = t; }
        pintarListaDeUnir(caja, candidatos, elegidos);
      };
    });
  }

  async function unir(contexto) {
    var candidatos;
    try { candidatos = await listarOtrosPdf(contexto); }
    catch (e) { U.aviso('No he podido leer la carpeta: ' + e.message, 'malo'); return; }
    if (!candidatos.length) {
      U.aviso('No hay ningún otro PDF ' +
        (contexto.modo === 'asunto' ? 'en este asunto' : 'en Por clasificar') + ' para unir.', 'malo');
      return;
    }

    for (var i = 0; i < candidatos.length; i++) {
      try {
        var f = await candidatos[i].handle.getFile();
        candidatos[i].paginas = await PdfHerramientas.contarPaginas(new Uint8Array(await f.arrayBuffer()));
      } catch (e) { candidatos[i].paginas = null; }
    }

    var elegidos = [];
    var promesa = U.preguntar('Unir "' + contexto.nombre + '"',
      '<p class="explica">Se parte de <strong>' + U.escapar(contexto.nombre) +
      '</strong>, que va siempre el primero.</p><div id="unir-lista"></div>', 'Unir');
    pintarListaDeUnir($('unir-lista'), candidatos, elegidos);

    var ok = await promesa;
    if (!ok) return;
    if (!elegidos.length) { U.aviso('No has señalado ningún PDF para unir.', 'malo'); return; }

    var nombresOrigen = [contexto.nombre].concat(elegidos.map(function (i) { return candidatos[i].nombre; }));
    var listaDeBytes = [];
    try {
      var propio = await contexto.handle.getFile();
      listaDeBytes.push(new Uint8Array(await propio.arrayBuffer()));
      for (var j = 0; j < elegidos.length; j++) {
        var otro = await candidatos[elegidos[j]].handle.getFile();
        listaDeBytes.push(new Uint8Array(await otro.arrayBuffer()));
      }
    } catch (e) { U.aviso('No he podido leer alguno de los PDF: ' + e.message, 'malo'); return; }

    var unido;
    try { unido = await PdfHerramientas.unir(listaDeBytes); }
    catch (e) { U.aviso(e.message, 'malo'); return; }

    await guardarUnion(contexto, unido, nombresOrigen);
  }

  async function guardarUnion(contexto, bytesUnido, nombresOrigen) {
    var nombreNuevo;
    if (contexto.modo === 'asunto') {
      nombreNuevo = await abrirCuadroDeNombre(contexto.asunto, bytesUnido, contexto.nombre,
        'Nombrar el documento unido', 'Va a llevar las páginas de los ' + nombresOrigen.length + ' documentos elegidos.');
      if (!nombreNuevo) return;
    } else {
      var base = String(contexto.nombre).replace(/\.[A-Za-z0-9]{1,8}$/, '');
      var propuesto = base + ' (unido).pdf';
      var yaEsta = (await Carpetas.ficheros(contexto.dir)).map(function (f) { return f.nombre; });
      if (PdfHerramientas.hayColision(yaEsta, propuesto)) {
        U.aviso('Ya hay un fichero llamado "' + propuesto + '": no se ha tocado nada.', 'malo');
        return;
      }
      await Carpetas.escribirBytes(contexto.dir, propuesto, bytesUnido, 'application/pdf');
      nombreNuevo = propuesto;
    }

    U.aviso('Documento unido guardado como "' + nombreNuevo + '".', 'bueno');

    var perdidos = [];
    for (var i = 0; i < nombresOrigen.length; i++) {
      try { await mandarAPapelera(contexto, nombresOrigen[i]); }
      catch (e) { perdidos.push(nombresOrigen[i]); }
    }
    if (perdidos.length) {
      U.aviso('La unión ha salido bien, pero no he podido mandar a la papelera: ' + perdidos.join(', '), 'malo');
    }
    if (contexto.alTerminar) contexto.alTerminar();
  }

  /* ---------- Sacar páginas ---------- */

  async function sacarPaginas(contexto) {
    var fichero;
    try { fichero = await contexto.handle.getFile(); }
    catch (e) { U.aviso('No he podido abrir el documento: ' + e.message, 'malo'); return; }
    var bytes = new Uint8Array(await fichero.arrayBuffer());

    var pdfDoc;
    try { pdfDoc = await abrirConPdfJs(bytes); }
    catch (e) { U.aviso(e.message, 'malo'); return; }
    var total = pdfDoc.numPages;

    var marcadas = {};
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-ancho');

    var promesa = U.preguntar('Sacar páginas de "' + contexto.nombre + '"',
      '<p class="explica">Señala las páginas que te interesan: saldrán en un documento nuevo, en ' +
      'este mismo orden. El original no se toca.</p>' +
      '<div id="pdf-rejilla" class="pdf-rejilla"></div>', 'Sacar páginas');

    pintarRejilla($('pdf-rejilla'), pdfDoc, total, {
      conCasillas: true,
      alMarcar: function (numPagina, marcada) {
        if (marcada) marcadas[numPagina] = true; else delete marcadas[numPagina];
      }
    });

    var ok = await promesa;
    cuadro.classList.remove('cuadro-ancho');
    if (!ok) return;

    var indices = Object.keys(marcadas).map(function (n) { return Number(n) - 1; }).sort(function (a, b) { return a - b; });
    if (!indices.length) { U.aviso('No has señalado ninguna página.', 'malo'); return; }

    var salida;
    try { salida = await PdfHerramientas.sacarPaginas(bytes, indices); }
    catch (e) { U.aviso(e.message, 'malo'); return; }

    var nombreNuevo;
    if (contexto.modo === 'asunto') {
      nombreNuevo = await abrirCuadroDeNombre(contexto.asunto, salida, contexto.nombre,
        'Nombrar el documento con las páginas sacadas',
        'Lleva ' + indices.length + (indices.length === 1 ? ' página' : ' páginas') +
        ' de "' + contexto.nombre + '". El original se queda igual.');
      if (!nombreNuevo) return;
    } else {
      var base = String(contexto.nombre).replace(/\.[A-Za-z0-9]{1,8}$/, '');
      var propuesto = base + ' (paginas sacadas).pdf';
      var yaEsta = (await Carpetas.ficheros(contexto.dir)).map(function (f) { return f.nombre; });
      if (PdfHerramientas.hayColision(yaEsta, propuesto)) {
        U.aviso('Ya hay un fichero llamado "' + propuesto + '": no se ha tocado nada.', 'malo');
        return;
      }
      await Carpetas.escribirBytes(contexto.dir, propuesto, salida, 'application/pdf');
      nombreNuevo = propuesto;
    }

    U.aviso('Páginas sacadas a "' + nombreNuevo + '". El original sigue igual.', 'bueno');
    if (contexto.alTerminar) contexto.alTerminar();
  }

  /* ---------- el cuadro de poner nombre, reutilizado por las tres ----------

     Mismos campos que "Añadir documento" (js/documentos.js): fecha,
     texto adicional y tipo, con Nombres.montarDocumento. Un cuadro
     propio, más pequeño, porque no hace falta el visor entero (ya se
     ha visto la miniatura en la rejilla de antes). Devuelve el nombre
     nuevo si se ha guardado, o null si se ha cancelado ("Dejarlo") o
     si el nombre ya existe. */
  async function abrirCuadroDeNombre(asunto, bytes, nombreOriginal, titulo, explica) {
    var previo = Documentos.leerNombre(nombreOriginal);
    var hoy = U.hoyIso();
    var miniatura = '';
    try { miniatura = await miniaturaDeBytes(bytes, 220); } catch (e) { miniatura = ''; }

    function opcionesDeTipo(elegido) {
      return (App.E.tiposDocumento || []).map(function (t) {
        return '<option value="' + U.escapar(t) + '"' +
          (U.normalizar(t) === U.normalizar(elegido || '') ? ' selected' : '') + '>' + U.escapar(t) + '</option>';
      }).join('');
    }

    var cuerpo =
      (explica ? '<p class="explica">' + U.escapar(explica) + '</p>' : '') +
      (miniatura ? '<img class="pdf-miniatura-grande" src="' + miniatura + '" alt="Primera página">' : '') +
      '<label class="etiqueta">Fecha del documento</label>' +
      '<input type="date" id="pdf-nombre-fecha" class="campo" value="' + U.escapar(previo.fecha || hoy) + '">' +
      '<label class="etiqueta">Texto adicional <span class="suave">(opcional)</span></label>' +
      '<input id="pdf-nombre-curso" class="campo" value="' + U.escapar(previo.curso || '') + '">' +
      '<label class="etiqueta">Tipo de documento</label>' +
      '<select id="pdf-nombre-tipo" class="campo">' + opcionesDeTipo(previo.tipo) + '</select>' +
      '<div class="vista-previa"><div class="vista-rotulo">Se guardará así</div>' +
        '<div id="pdf-nombre-vista" class="vista-nombre"></div></div>';

    $('cuadro-cancelar').textContent = 'Dejarlo';
    var promesa = U.preguntar(titulo, cuerpo, 'Guardar y seguir');

    function nombrePropuesto() {
      return Nombres.montarDocumento({
        fecha: $('pdf-nombre-fecha').value,
        tipo: $('pdf-nombre-tipo').value,
        curso: $('pdf-nombre-curso').value.trim(),
        extension: 'pdf'
      });
    }
    function refrescar() { $('pdf-nombre-vista').textContent = nombrePropuesto() || '(falta la fecha o el tipo)'; }
    ['pdf-nombre-fecha', 'pdf-nombre-curso', 'pdf-nombre-tipo'].forEach(function (id) {
      $(id).oninput = refrescar; $(id).onchange = refrescar;
    });
    refrescar();

    var ok = await promesa;
    $('cuadro-cancelar').textContent = 'Cancelar';
    if (!ok) return null;

    var nombreNuevo = nombrePropuesto();
    if (!nombreNuevo) { U.aviso('Falta la fecha o el tipo.', 'malo'); return null; }

    var yaEsta = (await Carpetas.ficheros(asunto.handle)).map(function (f) { return f.nombre; });
    if (PdfHerramientas.hayColision(yaEsta, nombreNuevo)) {
      U.aviso('Ya hay un documento con ese nombre en la carpeta: "' + nombreNuevo + '".', 'malo');
      return null;
    }

    await Carpetas.escribirBytes(asunto.handle, nombreNuevo, bytes, 'application/pdf');
    return nombreNuevo;
  }

  /* ---------- la papelera, en el sitio que toque ---------- */

  function mandarAPapelera(contexto, nombre) {
    if (!window.Papelera) return Promise.resolve();
    if (contexto.modo === 'asunto') return Papelera.mandarDocumentoDeAsunto(contexto.asunto, nombre);
    return Papelera.mandarSuelto({ nombre: nombre });
  }

  function mandarOriginalAPapelera(contexto) {
    return mandarAPapelera(contexto, contexto.nombre).catch(function (e) {
      U.aviso('Se ha guardado, pero no he podido mandar el original a la papelera: ' + e.message, 'malo');
    });
  }

  return {
    separar: separar,
    unir: unir,
    sacarPaginas: sacarPaginas
  };
})();
window.PdfSepararUnir = PdfSepararUnir;
