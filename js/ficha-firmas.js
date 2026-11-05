/* ============================================================
   ficha-firmas.js — las dos preguntas del tema 392, arriba de la ficha
   (5-nov-2026, fila 515, docs/515-DETECTAR-DOCUMENTOS-FIRMADOS.md).

   1. Un PDF con firma digital que llega a la carpeta con otro nombre (sin
      nombre de la aplicación y sin sello): aviso ámbar «Este papel lleva
      firma digital. ¿De qué documento es?», como el del papel sellado
      (js/ficha-sellos.js), con tres salidas: «Es un documento nuevo»,
      «Elige un documento…» y «No es de este asunto».
   2. Llega algo sin firma encima de un documento firmado (punto 7): la
      duda vive en la lista compartida `_GESTOR/copias-ruta.json`
      (js/ruta-copia.js) y aquí se pregunta, con dos botones.

   Cada ordenador se acuerda de qué PDF ya ha mirado (nombre y tamaño), para
   no leerlos otra vez. Solo cuenta firmas (js/documentos-firmados.js): no las
   comprueba. Los asuntos de grupo no entran.
   ============================================================ */
(function () {
  var N = window.FichaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }
  var turno = 0;

  function clave(nombre, tamano) { return nombre + '|' + tamano; }
  function sinExtension(n) { var p = n.lastIndexOf('.'); return p === -1 ? n : n.slice(0, p); }
  function extensionCon(n) { var p = n.lastIndexOf('.'); return p === -1 ? '' : n.slice(p); }
  function memoriaDe(a) { return 'firmas-mirados:' + a.nombre; }

  /* ---------- los firmados con otro nombre ---------- */

  async function sueltos(a) {
    if (!window.RegistroLector || !window.DocumentosFirmados) return [];
    if (window.GrupoRegistro && GrupoRegistro.activo(a)) return [];
    var lista = await Carpetas.ficheros(a.handle);
    var pdfs = lista.filter(function (f) {
      if (!/\.pdf$/i.test(f.nombre)) return false;
      if (window.IndiceExpediente && IndiceExpediente.es(f.nombre)) return false;
      return !Documentos.pareceDeLaAplicacion(f.nombre);
    });
    if (!pdfs.length) return [];
    var memoria = (await Almacen.leer(memoriaDe(a))) || {};
    var sellos = (await Almacen.leer('sellos-mirados:' + a.nombre)) || {};
    var cambio = false, salida = [];
    for (var i = 0; i < pdfs.length; i++) {
      var f = pdfs[i];
      var fichero = await f.handle.getFile();
      var k = clave(f.nombre, fichero.size);
      if (!memoria[k]) {
        var sello = sellos[k] ? sellos[k].sello : null;
        if (!sellos[k]) { try { sello = await RegistroLector.leerSello(fichero); } catch (e) { sello = null; } }
        memoria[k] = { firmas: sello ? 0 : await DocumentosFirmados.contar(fichero), ignorado: false };
        cambio = true;
      }
      if (memoria[k].firmas > 0 && !memoria[k].ignorado) salida.push({ nombre: f.nombre, firmas: memoria[k].firmas });
    }
    if (cambio) await Almacen.guardar(memoriaDe(a), memoria);
    return salida;
  }

  async function noEsDeEsteAsunto(a, nombre) {
    var f = (await Carpetas.ficheros(a.handle)).filter(function (x) { return x.nombre === nombre; })[0];
    if (!f) return;
    var tamano = (await f.handle.getFile()).size;
    var memoria = (await Almacen.leer(memoriaDe(a))) || {};
    var k = clave(nombre, tamano);
    if (!memoria[k]) return;
    memoria[k].ignorado = true;
    await Almacen.guardar(memoriaDe(a), memoria);
  }

  /* «Elige un documento…»: el firmado ocupa el nombre de ese documento, como al guardar encima
     (el original, a previas como «SIN FIRMAR» o «CON n FIRMAS»). */
  async function ocuparNombre(a, d, original) {
    var datos = window.DocumentosDatos ? DocumentosDatos.deFichero(a.ficha, original) : null;
    var previas = Math.max(await DocumentosFirmados.contarEn(a.handle, original), datos ? Number(datos.firmas) || 0 : 0);
    var caso = previas > 0 ? 'masFirmas' : 'firmado';
    var nombres = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }).filter(function (n) { return n !== d.nombre; });
    var conservado = RegistroSellado.nombreLibreEntre(nombres, sinExtension(original) + DocumentosFirmados.sufijoDelAnterior(caso, previas) + extensionCon(original));
    var nombreFinal = sinExtension(original) + extensionCon(d.nombre);
    await Carpetas.renombrarFichero(a.handle, original, conservado);
    var enPrevias = false;
    if (window.VersionesPrevias) {
      try { await VersionesPrevias.mover(a.handle, conservado); enPrevias = true; } catch (e) { enPrevias = false; }
    }
    if (nombreFinal !== d.nombre) await Carpetas.renombrarFichero(a.handle, d.nombre, nombreFinal);
    if (window.VersionesPrevias) await VersionesPrevias.ordenarTrasCambio(a.handle);
    var carpeta = enPrevias && VersionesPrevias.nombreDeCarpeta ? await VersionesPrevias.nombreDeCarpeta(a.handle) : '';
    await DocumentosFirmados.alLlegar(a, nombreFinal, caso, d.firmas, carpeta || '');
    if (!carpeta) U.aviso('El original se ha quedado en la carpeta, con el nombre «' + conservado + '».', 'ambar');
  }

  /* «Es un documento nuevo»: el cuadro de poner nombre de siempre; al guardar, la marca y la nota. */
  async function esDocumentoNuevo(a, d, boton) {
    var antes = [];
    try { antes = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { antes = []; }
    var hito = null;
    try { await Hitos.leer(); hito = Hitos.hitoActualDeAsunto ? Hitos.hitoActualDeAsunto(a) : null; } catch (e1) { hito = null; }
    boton.disabled = true;
    try { await App.verDocumentos(a, { ponerNombre: d.nombre, hito: hito }); } finally { boton.disabled = false; }
    if (N.actual !== a) return;
    var despues = [];
    try { despues = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e2) { despues = []; }
    var nombreNuevo = despues.filter(function (n) { return antes.indexOf(n) === -1; })[0];
    if (nombreNuevo && despues.indexOf(d.nombre) === -1) await DocumentosFirmados.alLlegar(a, nombreNuevo, 'firmado', d.firmas, '');
  }

  /* ---------- pintar ---------- */

  function htmlSuelto(d, i, elegibles) {
    return '<div class="aviso aviso-ambar aviso-sello aviso-firma" data-firma="' + i + '">' +
      '<strong>Este papel lleva firma digital.</strong>' +
      '<p>¿De qué documento es? <span class="suave">(' + U.escapar(d.nombre) + ')</span></p>' +
      '<div class="sello-fila">' +
        '<button type="button" class="boton boton-principal firma-nuevo">Es un documento nuevo</button>' +
        (elegibles.length
          ? '<select class="campo sello-elegir firma-elegir"><option value="">Elige un documento…</option>' +
              elegibles.map(function (n) { return '<option value="' + U.escapar(n) + '">' + U.escapar(n) + '</option>'; }).join('') + '</select>'
          : '') +
        '<button type="button" class="boton sello-no-es firma-no-es">No es de este asunto</button>' +
      '</div></div>';
  }

  function htmlDuda(item, i) {
    return '<div class="aviso aviso-ambar aviso-sello aviso-duda-firma" data-duda="' + i + '">' +
      '<strong>Lo que has guardado encima de ' + U.escapar(item.doc) + ' no trae firma, y el documento anterior estaba firmado. El firmado se conserva.</strong>' +
      '<p>¿Con cuál te quedas?</p>' +
      '<div class="sello-fila">' +
        '<button type="button" class="boton boton-principal duda-firmado">Quedarme con el firmado</button>' +
        '<button type="button" class="boton duda-nuevo">Usar el nuevo</button>' +
      '</div></div>';
  }

  async function repintarTodo(a) {
    if (N.actual !== a) return;
    N.pintarDocumentos(a);
    if (window.Notas) {
      try { a.ficha.notas = await Notas.frescas(a); N.pintarNotas(a, N.modoActual === 'abierto'); } catch (e) { /* solo pintar */ }
    }
    pintarFirmas(a);
  }

  async function pintarFirmas(a) {
    var caja = $('ficha-firmas');
    if (!caja || !window.DocumentosFirmados) return;
    var mio = ++turno;
    if (N.modoActual !== 'abierto') { caja.innerHTML = ''; return; }
    var preguntas = [], detectados = [], elegibles = [];
    try { if (window.RutaCopia) preguntas = await RutaCopia.dudas(a); } catch (e) { preguntas = []; }
    try { detectados = await sueltos(a); } catch (e1) { detectados = []; }
    if (detectados.length) {
      try {
        elegibles = (await Carpetas.ficheros(a.handle)).filter(function (f) { return Documentos.pareceDeLaAplicacion(f.nombre); })
          .map(function (f) { return f.nombre; }).sort().reverse();
      } catch (e2) { elegibles = []; }
    }
    if (mio !== turno || N.actual !== a) return;   /* el último gana */
    caja.innerHTML = preguntas.map(htmlDuda).join('') + detectados.map(function (d, i) { return htmlSuelto(d, i, elegibles); }).join('');

    Array.prototype.forEach.call(caja.querySelectorAll('.aviso-duda-firma'), function (div, i) {
      var item = preguntas[i];
      [['.duda-firmado', true], ['.duda-nuevo', false]].forEach(function (par) {
        var b = div.querySelector(par[0]);
        b.onclick = async function () {
          try { await U.mientrasGuarda(b, function () { return RutaCopia.contestar(a, item.doc, par[1]); }); }
          catch (e) { U.fallo('No he podido contestar', e); }
          await repintarTodo(a);
        };
      });
    });

    Array.prototype.forEach.call(caja.querySelectorAll('.aviso-firma'), function (div, i) {
      var d = detectados[i];
      var nuevo = div.querySelector('.firma-nuevo'), sel = div.querySelector('.firma-elegir'), noEs = div.querySelector('.firma-no-es');
      nuevo.onclick = async function () {
        try { await esDocumentoNuevo(a, d, nuevo); } catch (e) { U.fallo('No he podido guardarlo', e); }
        await repintarTodo(a);
      };
      if (sel) sel.onchange = async function () {
        if (!sel.value) return;
        var original = sel.value;
        try { await U.mientrasGuarda(sel, function () { return ocuparNombre(a, d, original); }); }
        catch (e) { U.fallo('No he podido asociar la firma', e); }
        await repintarTodo(a);
      };
      noEs.onclick = async function () {
        try { await U.mientrasGuarda(noEs, function () { return noEsDeEsteAsunto(a, d.nombre); }); }
        catch (e) { U.fallo('No he podido guardarlo', e); }
        if (N.actual !== a) return;
        pintarFirmas(a);
      };
    });
  }

  Object.assign(N, { pintarFirmas: pintarFirmas });
})();
