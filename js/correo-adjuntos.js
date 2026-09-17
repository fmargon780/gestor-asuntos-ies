/* ============================================================
   correo-adjuntos.js — mandar los documentos de un asunto por correo
   (16-sep-2026, docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md).

   Gmail no deja que una página web le enganche ficheros. La salida es
   la carpeta GESTOR-BANDEJA (la misma que recoge los correos, ver
   js/bandeja-correos.js): aquí se dejan copias de los documentos
   marcados y un encargo, `<id>.envio.json`, y un script de Apps Script
   —que sí puede adjuntar— monta un borrador en Gmail. Siempre
   borrador, nunca envío automático.

   Este fichero solo pinta el bloque "Documentos de este asunto" dentro
   del cuadro de Correo (nunca en el de Séneca: allí no hay adjuntos) y
   escribe el encargo. La tarjeta "Borrador en camino" y la vigilancia
   de la bandeja viven en js/bandeja-correos.js, que ya sabe hablar con
   esa carpeta; aquí solo se le avisa de que hay un encargo nuevo.
   ============================================================ */
var CorreoAdjuntos = (function () {

  var MAXIMO_BYTES = 20 * 1024 * 1024;

  var ultimaLista = [];   /* [{nombre, tam}], de lo último que se ha pintado */

  function $(id) { return document.getElementById(id); }

  function tamanoLegible(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function carpetaBandeja() {
    return (window.Bandeja && window.Bandeja.carpeta && window.Bandeja.carpeta()) || null;
  }

  /* ---------- el bloque dentro del cuadro de Correo ---------- */

  /* Devuelve el HTML del bloque, o cadena vacía si el asunto no tiene
     ningún documento (entonces el bloque no se pinta). */
  async function pintarBloque(a) {
    ultimaLista = [];
    if (!a || !a.handle) return '';
    var ficheros;
    try { ficheros = await Carpetas.ficheros(a.handle); } catch (e) { return ''; }
    if (!ficheros.length) return '';

    for (var i = 0; i < ficheros.length; i++) {
      var tam = 0;
      try { tam = (await ficheros[i].handle.getFile()).size; } catch (e) { /* se enseña sin tamaño */ }
      ultimaLista.push({ nombre: ficheros[i].nombre, tam: tam });
    }

    var filas = ultimaLista.map(function (f) {
      return '<label class="correo-fila">' +
        '<input type="checkbox" class="adjunto-marca" value="' + U.escapar(f.nombre) + '">' +
        '<span><strong>' + U.escapar(f.nombre) + '</strong>' +
        '<span class="suave"> · ' + tamanoLegible(f.tam) + '</span></span>' +
        '</label>';
    }).join('');

    /* Desmarcados de partida: lo normal es mandar uno, no todos. */
    var pie = carpetaBandeja()
      ? '<button type="button" class="boton" id="adjuntos-preparar" disabled>' +
        'Preparar borrador con los documentos</button>' +
        '<div id="adjuntos-aviso"></div>'
      : '<p class="nota">Señala la carpeta <code>GESTOR-BANDEJA</code> en Ajustes para poder ' +
        'mandar documentos con el correo.</p>';

    return '<label class="etiqueta">Documentos de este asunto</label>' +
      '<div id="adjuntos-lista">' + filas + '</div>' + pie;
  }

  /* `alPreparado(nombresOriginales)` se llama cuando el encargo ha
     salido bien, para que js/correo.js pueda añadirlo al rastro. */
  function enganchar(a, alPreparado) {
    var caja = $('correo-caja');
    if (!caja) return;
    var marcas = caja.querySelectorAll('.adjunto-marca');
    if (!marcas.length) return;
    var boton = $('adjuntos-preparar');

    function actualizarBoton() {
      if (!boton) return;
      boton.disabled = !Array.prototype.some.call(marcas, function (c) { return c.checked; });
    }
    Array.prototype.forEach.call(marcas, function (c) { c.onchange = actualizarBoton; });
    actualizarBoton();

    if (boton) boton.onclick = function () { prepararBorrador(a, alPreparado); };
  }

  /* ---------- preparar el encargo ---------- */

  function idNuevo() {
    var d = new Date();
    function dos(n) { return String(n).padStart(2, '0'); }
    return 'envio-' + String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate()) +
      '-' + dos(d.getHours()) + dos(d.getMinutes()) + dos(d.getSeconds()) +
      '-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  /* El hilo del asunto, si la fila 11 de la cola ya lo trae (`hilos` en
     la ficha). Si no, cadena vacía: el script manda un correo nuevo. */
  function ultimoHilo(a) {
    var hilos = a.ficha && a.ficha.hilos;
    if (!hilos || !hilos.length) return '';
    return hilos[hilos.length - 1].id || '';
  }

  /* Lo mismo que App.paraDelCuadro de js/correo.js: no vale la pena
     exponerla solo para esto. */
  function paraActual() {
    var lista = [];
    Array.prototype.forEach.call(document.querySelectorAll('.correo-marca'), function (c) {
      if (c.checked) lista.push(c.value);
    });
    var otro = $('correo-otro') ? $('correo-otro').value.trim() : '';
    if (otro) lista.push(otro);
    return lista.join(', ');
  }

  /* Igual que paraActual, para la copia oculta que dejan los grupos
     (17-sep-2026, fila 21): se lee del propio DOM, de los mismos chips
     que pinta js/correo.js, por la misma razón de no exponer nada solo
     para esto. */
  function ccoActual() {
    var lista = [];
    Array.prototype.forEach.call(document.querySelectorAll('.cco-quitar'), function (b) {
      lista.push(b.dataset.dir);
    });
    return lista.join(', ');
  }

  /* `_GESTOR/envios.json`: la lista de encargos vivos, para que se vea
     el "Borrador en camino" aunque se cierre el cuadro. Se relee antes
     de escribir: es un fichero compartido con el compañero. */
  async function anadirAEnviosJson(entrada) {
    var g = App.E.gestor;
    if (!g) return;
    var leido = await Carpetas.leerJson(g, 'envios.json');
    var lista = Array.isArray(leido) ? leido.slice() : [];
    lista.push(entrada);
    await Copias.guardar(g, 'envios.json', lista);
  }

  async function prepararBorrador(a, alPreparado) {
    var caja = $('correo-caja');
    if (!caja) return;
    var marcadas = Array.prototype.filter.call(caja.querySelectorAll('.adjunto-marca'),
      function (c) { return c.checked; }).map(function (c) { return c.value; });
    if (!marcadas.length) return;

    var avisoEl = $('adjuntos-aviso');
    if (avisoEl) avisoEl.innerHTML = '';

    var total = 0;
    ultimaLista.forEach(function (f) { if (marcadas.indexOf(f.nombre) !== -1) total += f.tam; });
    if (total > MAXIMO_BYTES) {
      if (avisoEl) {
        avisoEl.innerHTML = '<p class="aviso aviso-rojo">Eso pesa ' + tamanoLegible(total) +
          '. Gmail no admite más de 20 MB.</p>';
      }
      return;
    }

    var bandeja = carpetaBandeja();
    if (!bandeja) return;

    var boton = $('adjuntos-preparar');
    if (boton) { boton.disabled = true; boton.textContent = 'Preparando…'; }

    var id = idNuevo();
    try {
      var adjuntosEnBandeja = [];
      for (var i = 0; i < marcadas.length; i++) {
        var origen = await a.handle.getFileHandle(marcadas[i]);
        var nombreEnBandeja = id + ' - ' + marcadas[i];
        await Carpetas.copiarFicheroEn(bandeja, origen, nombreEnBandeja);
        adjuntosEnBandeja.push(nombreEnBandeja);
      }

      var para = paraActual();
      var encargo = {
        id: id,
        creado: new Date().toISOString().slice(0, 19),
        para: para,
        cco: ccoActual(),
        asunto: $('correo-asunto') ? $('correo-asunto').value : '',
        cuerpo: $('correo-cuerpo-texto') ? $('correo-cuerpo-texto').value : '',
        adjuntos: adjuntosEnBandeja,
        hilo: ultimoHilo(a),
        asuntoCarpeta: a.nombre
      };
      /* El .json se escribe el último: para el script, un encargo
         existe cuando existe su fichero. Es la misma regla que ya usa
         la bandeja al revés, con los correos recogidos. */
      await Carpetas.guardarJson(bandeja, id + '.envio.json', encargo);

      await anadirAEnviosJson({ id: id, asunto: a.nombre, para: para, creado: encargo.creado });
      if (window.Bandeja && window.Bandeja.avisarEnvioNuevo) window.Bandeja.avisarEnvioNuevo();

      U.aviso('Borrador en camino. Avisaré cuando esté listo en Gmail.', 'bueno');
      if (typeof alPreparado === 'function') alPreparado(marcadas);
    } catch (e) {
      U.aviso('No he podido preparar el borrador: ' + e.message, 'malo');
    } finally {
      if (boton) { boton.disabled = false; boton.textContent = 'Preparar borrador con los documentos'; }
      Array.prototype.forEach.call(caja.querySelectorAll('.adjunto-marca'), function (c) { c.checked = false; });
    }
  }

  return { pintarBloque: pintarBloque, enganchar: enganchar };
})();
