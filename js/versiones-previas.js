/* ============================================================
   versiones-previas.js — la subcarpeta «Versiones previas» de cada
   asunto (25-sep-2026, fila 160, docs/VERSIONES-PREVIAS.md).

   Lo que ya no es el documento bueno, pero no se debe borrar, sale de
   la vista sin dejar de estar en la carpeta del asunto:

     - el original «SIN SELLAR» que deja registrar un documento sellado
       (js/registro-sellado.js), siempre;
     - el borrador de Word (.doc/.docx) en cuanto hay en la carpeta un PDF
       con la misma clave de gemelo (sin extensión, sin «SIN SELLAR» y sin
       código de registro). Un Word sin su PDF nunca se mueve solo.

   La subcarpeta se crea solo cuando hace falta. Nunca se pisa nada: si
   ya hay uno con ese nombre, se numera «(2)». No es un borrado: no pasa
   por la papelera. Archivar, reabrir y fusionar mueven la carpeta del
   asunto entera (js/carpetas.js, `fusionarDentro`, entra en las
   subcarpetas), así que viaja con ella.

   Lo usan js/registro-sellado.js y js/registro.js (al registrar),
   js/word-visor.js (al guardar el PDF), js/ficha-documentos.js y
   js/hito-mesa-documentos.js (la línea «N versiones previas · ver»,
   y «Pasar a / Sacar de versiones previas»), y Ajustes › Mantenimiento
   («Ordenar versiones previas», `ordenarTodo`).
   ============================================================ */
var VersionesPrevias = (function () {

  var CARPETA = 'Versiones previas';
  var RE_SIN_SELLAR = / SIN SELLAR(\s*\(\d+\))?$/i;
  var RE_REGISTRO = /\b\d{2}[ES][MA]\d{4}\b/;

  function extension(n) { var m = /\.([A-Za-z0-9]{1,8})$/.exec(String(n || '')); return m ? m[1] : ''; }
  function sinExtension(n) { var e = extension(n); return e ? String(n).slice(0, -(e.length + 1)) : String(n); }
  function esSinSellar(n) { return RE_SIN_SELLAR.test(sinExtension(n)); }
  function esWord(n) { return /^docx?$/i.test(extension(n)); }
  function esPdf(n) { return /^pdf$/i.test(extension(n)); }
  function claveGemelo(n) {
    return sinExtension(n).replace(RE_SIN_SELLAR, '').replace(RE_REGISTRO, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  async function carpeta(dirAsunto, crear) {
    if (!dirAsunto) return null;
    try { return await dirAsunto.getDirectoryHandle(CARPETA, crear ? { create: true } : undefined); }
    catch (e) { return null; }
  }

  /* Los ficheros de «Versiones previas» ([{ nombre, handle }]); sin la carpeta, []. */
  async function listar(dirAsunto) {
    var sub = await carpeta(dirAsunto, false);
    if (!sub) return [];
    try { return await Carpetas.ficheros(sub); } catch (e) { return []; }
  }

  async function nombreLibre(dir, nombre) {
    return (await Carpetas.existeFichero(dir, nombre)) ? Carpetas.nombreLibreConSufijo(dir, nombre) : nombre;
  }

  /* Pasa `nombre` a la subcarpeta. Devuelve el nombre con el que queda. */
  async function mover(dirAsunto, nombre) {
    var sub = await carpeta(dirAsunto, true);
    var destino = await nombreLibre(sub, nombre);
    await Carpetas.moverFichero(dirAsunto, nombre, sub, destino);
    return destino;
  }

  /* Lo devuelve a la carpeta del asunto. */
  async function sacar(dirAsunto, nombre) {
    var sub = await carpeta(dirAsunto, false);
    if (!sub) throw new Error('No está en «Versiones previas».');
    var destino = await nombreLibre(dirAsunto, nombre);
    await Carpetas.moverFichero(sub, nombre, dirAsunto, destino);
    return destino;
  }

  /* Pura: de los nombres de la carpeta del asunto, los que tocan ir a
     «Versiones previas»: los «SIN SELLAR» y los Word con su PDF. */
  function queMover(nombres) {
    var conPdf = {};
    (nombres || []).forEach(function (n) { if (esPdf(n) && !esSinSellar(n)) conPdf[claveGemelo(n)] = true; });
    return (nombres || []).filter(function (n) {
      return esSinSellar(n) || (esWord(n) && conPdf[claveGemelo(n)]);
    });
  }

  /* Ordena una carpeta de asunto. Con `soloContar`, no mueve nada. */
  async function ordenarAsunto(dirAsunto, soloContar) {
    var nombres = (await Carpetas.ficheros(dirAsunto)).map(function (f) { return f.nombre; });
    var lista = queMover(nombres);
    var r = { movidos: [], fallos: [] };
    if (soloContar) { r.movidos = lista; return r; }
    for (var i = 0; i < lista.length; i++) {
      try { await mover(dirAsunto, lista[i]); r.movidos.push(lista[i]); }
      catch (e) { r.fallos.push(lista[i]); }
    }
    return r;
  }

  /* Tras registrar o guardar un PDF: los Word que ya tienen su PDF (y
     los «SIN SELLAR»). Accesorio: si algo falla, se queda como estaba. */
  async function ordenarTrasCambio(dirAsunto) {
    try { return await ordenarAsunto(dirAsunto, false); }
    catch (e) { return { movidos: [], fallos: [] }; }
  }

  /* Abrir uno de «Versiones previas» en el visor de siempre. */
  async function abrir(a, nombre) {
    var sub = await carpeta(a && a.handle, false);
    try {
      var h = await sub.getFileHandle(nombre);
      if (window.Visor) Visor.abrir(h, nombre, { asunto: a, carpeta: a.handle });
    } catch (e) { U.fallo('No he podido abrirlo', e); }
  }

  /* ---------- «Ordenar versiones previas» (Ajustes › Mantenimiento) ---------- */

  /* Las carpetas de asunto de abiertos y del ARCHIVO. */
  async function carpetasDeAsuntos() {
    var salida = [];
    var abiertos = window.App && App.E && App.E.abiertos;
    if (abiertos) {
      (await Carpetas.subcarpetas(abiertos)).forEach(function (s) {
        if (s.nombre !== (App.CARPETA_GESTOR || '_GESTOR') && !/^[_.]/.test(s.nombre)) salida.push(s);
      });
    }
    var archivo = window.App && App.E && App.E.archivo;
    if (archivo) {
      var categorias = await Carpetas.subcarpetas(archivo);
      for (var i = 0; i < categorias.length; i++) {
        var terceros = await Carpetas.subcarpetas(categorias[i].handle);
        for (var j = 0; j < terceros.length; j++) {
          (await Carpetas.subcarpetas(terceros[j].handle)).forEach(function (s) {
            if (s.nombre !== CARPETA) salida.push(s);
          });
        }
      }
    }
    return salida.filter(function (s) { return s.nombre !== CARPETA; });
  }

  async function ordenarTodo(boton) {
    var carpetas;
    try { carpetas = await carpetasDeAsuntos(); }
    catch (e) { U.fallo('No he podido recorrer las carpetas', e); return; }
    var cuenta = [];
    for (var i = 0; i < carpetas.length; i++) {
      var r = await ordenarAsunto(carpetas[i].handle, true).catch(function () { return { movidos: [] }; });
      if (r.movidos.length) cuenta.push({ carpeta: carpetas[i], n: r.movidos.length });
    }
    var total = cuenta.reduce(function (s, c) { return s + c.n; }, 0);
    if (!total) { U.aviso('Todo está ya en su sitio: no hay nada que pasar a «Versiones previas».', 'bueno'); return; }
    var ok = await U.preguntar('Ordenar versiones previas',
      '<p>Se moverán <strong>' + total + '</strong> documento' + (total === 1 ? '' : 's') + ' de <strong>' + cuenta.length +
      '</strong> asunto' + (cuenta.length === 1 ? '' : 's') + ' a «Versiones previas»: los originales «SIN SELLAR» y los ' +
      'borradores de Word que ya tienen su PDF. No se borra nada.</p>', 'Moverlos');
    if (!ok) return;
    var movidos = 0, fallos = [];
    await U.mientrasGuarda(boton || null, async function () {
      for (var k = 0; k < cuenta.length; k++) {
        var res = await ordenarAsunto(cuenta[k].carpeta.handle, false).catch(function () { return { movidos: [], fallos: ['(la carpeta entera)'] }; });
        movidos += res.movidos.length;
        res.fallos.forEach(function (f) { fallos.push(cuenta[k].carpeta.nombre + ' › ' + f); });
      }
    });
    if (fallos.length) U.aviso('Movidos ' + movidos + '. No he podido mover: ' + fallos.join('; ') + '.', 'ambar');
    else U.aviso('Movidos ' + movidos + ' documentos a «Versiones previas».', 'bueno');
  }

  /* El bloque de Ajustes › Mantenimiento, como el de la biblioteca del
     centro (js/cargar-biblioteca.js): se pone solo, una vez. */
  function bloque() {
    if (document.getElementById('bloque-versiones-previas')) return;
    var pantalla = document.getElementById('ajustes-tab-mantenimiento');
    if (!pantalla) return;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-versiones-previas';
    d.innerHTML = '<summary><span class="bloque-titulo">Versiones previas</span>' +
      '<span class="bloque-pie">Los «SIN SELLAR» y los Word que ya tienen su PDF, fuera de la vista</span></summary>' +
      '<div class="bloque-cuerpo"><p class="explica">Pasa a la subcarpeta «Versiones previas» de cada asunto (abiertos y ' +
      'ARCHIVO) los originales «SIN SELLAR» y los borradores de Word que ya tienen su PDF. Antes dice cuántos son. ' +
      'No se borra nada, y se puede pulsar más de una vez.</p>' +
      '<button type="button" class="boton" id="btn-ordenar-versiones">Ordenar versiones previas</button></div>';
    pantalla.appendChild(d);
    document.getElementById('btn-ordenar-versiones').onclick = function (ev) { ordenarTodo(ev.currentTarget); };
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(function () { if (Gestor.carpetaGestor()) bloque(); });
    bloque();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { CARPETA: CARPETA, listar: listar, bloque: bloque, mover: mover, sacar: sacar, queMover: queMover,
           ordenarAsunto: ordenarAsunto, ordenarTrasCambio: ordenarTrasCambio, abrir: abrir,
           ordenarTodo: ordenarTodo, claveGemelo: claveGemelo, esSinSellar: esSinSellar };
})();
window.VersionesPrevias = VersionesPrevias;
