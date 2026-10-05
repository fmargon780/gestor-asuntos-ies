/* ============================================================
   archivar-cabe.js — antes de archivar, medir si cada documento del
   asunto va a caber en la ruta del ARCHIVO, y si no, dejar acortar su
   nombre ahí mismo (fila 265, docs/ARCHIVAR-MIDE-ANTES-LA-RUTA.md).

   Al archivar, la carpeta del asunto queda dos niveles más adentro
   (`<ARCHIVO>/<categoría>/<tercero>/<asunto>/…`) y la ruta de algún
   documento puede pasar de los 259 caracteres de Windows. Entonces
   Windows contesta «ruta no encontrada» y Chrome lo entrega como un
   NotFoundError que no dice nada. Aquí se mide ANTES de tocar nada:

     - todo cabe → `medir` devuelve una lista vacía y se archiva como siempre;
     - algún documento no cabe → `cuadro` enseña solo esos, cada uno con su
       nombre en una caja para acortarlo, y `acortar` los renombra
       (`DocumentoRenombrar`, que pone al día ficha y hitos);
     - la propia carpeta del asunto no deja sitio ni a un documento de 30
       caracteres → no hay cajas que valgan: se dice y se lleva a
       «Cambiar el asunto».

   Nada se acorta solo. Sin la ruta del ARCHIVO conocida no hay con qué
   medir (`medir` devuelve null) y se archiva como hoy.

   Archivar varios de golpe (js/repartir-crear.js, js/por-liquidar-liquidar.js)
   no abre ningún cuadro: el asunto que no cabe se queda donde estaba y
   se cuenta en `App.E.noCabeEnArchivo`; al acabar el lote sale un solo
   aviso (`avisarLote`).
   ============================================================ */
var ArchivarCabe = (function () {

  var EXTRA_FICHERO = 7;     /* Chrome escribe antes en un temporal `.crswap` con el nombre entero delante */
  var DOCUMENTO_MINIMO = 30; /* el nombre más corto al que se da por razonable acortar */

  function $(id) { return document.getElementById(id); }

  function partir(nombre) {
    var i = nombre.lastIndexOf('.');
    return i > 0 ? { base: nombre.slice(0, i), ext: nombre.slice(i) } : { base: nombre, ext: '' };
  }

  /* Recorre la carpeta del asunto: cada fichero que se copiaría (con la
     carpeta donde está y su ruta de subcarpetas) y los nombres que hay en
     cada carpeta. */
  async function recorrer(dir, sub, ficheros, nombresPorCarpeta) {
    var clave = sub.join('/');
    nombresPorCarpeta[clave] = nombresPorCarpeta[clave] || [];
    for await (var pareja of dir.entries()) {
      var nombre = pareja[0], h = pareja[1];
      if (Carpetas.noSeCopia(nombre, h)) continue;
      if (h.kind === 'file') {
        nombresPorCarpeta[clave].push(nombre);
        ficheros.push({ dir: dir, sub: sub, nombre: nombre });
      } else {
        await recorrer(h, sub.concat(nombre), ficheros, nombresPorCarpeta);
      }
    }
  }

  function largoDeFichero(ctx, sub, nombre) {
    return Nombres.largoEnArchivo(ctx.categoria, ctx.tercero, ctx.nombre, sub.concat(nombre).join('/')) + EXTRA_FICHERO;
  }

  /* Mide el asunto `nombre` (que está en `abiertos`) tal como quedará en
     `<categoría>/<tercero>/`. Devuelve null si no hay con qué medir;
     si no, { carpeta: {sobran} | null, lista: [{dir, sub, nombre, base, ext, sobran}],
     nombresPorCarpeta, ctx }. */
  async function medir(abiertos, nombre, categoria, tercero) {
    var ctx = { nombre: nombre, categoria: categoria, tercero: tercero };
    if (Nombres.largoEnArchivo(categoria, tercero, nombre, '') === null) return null;
    var ficheros = [], nombresPorCarpeta = {};
    await recorrer(await abiertos.getDirectoryHandle(nombre), [], ficheros, nombresPorCarpeta);

    /* ¿Deja la carpeta sitio, siquiera, a un documento corto? */
    var sobraCarpeta = Nombres.largoEnArchivo(categoria, tercero, nombre, 'x'.repeat(DOCUMENTO_MINIMO)) +
      EXTRA_FICHERO - Nombres.TOPE_TOTAL_RUTA;
    var lista = [];
    ficheros.forEach(function (f) {
      var sobran = largoDeFichero(ctx, f.sub, f.nombre) - Nombres.TOPE_TOTAL_RUTA;
      if (sobran <= 0) return;
      var p = partir(f.nombre);
      /* Ni con una sola letra cabría: el problema es la carpeta, no el nombre. */
      if (sobran >= p.base.length) sobraCarpeta = Math.max(sobraCarpeta, sobran - p.base.length + 1);
      else lista.push({ dir: f.dir, sub: f.sub, nombre: f.nombre, base: p.base, ext: p.ext, sobran: sobran });
    });
    return { ctx: ctx, carpeta: sobraCarpeta > 0 ? { sobran: sobraCarpeta } : null,
             lista: sobraCarpeta > 0 ? [] : lista, nombresPorCarpeta: nombresPorCarpeta };
  }

  function sinProblema(medida) { return !medida || (!medida.carpeta && !medida.lista.length); }

  /* ---------- el cuadro ---------- */

  function motivoDe(fila, base, medida, cajas) {
    var nombre = base + fila.ext;
    if (!base.trim()) return 'El nombre no puede quedar vacío.';
    if (U.limpiarNombre(nombre) !== nombre) {
      return 'Lleva algo que Windows no admite (\\ / : * ? " < > |), o espacios de más.';
    }
    var numero = window.DocumentoRenombrar ? DocumentoRenombrar.numeroDe(fila.nombre) : '';
    if (numero && DocumentoRenombrar.numeroDe(nombre) !== numero) return 'Tiene que conservar el número ' + numero + '.';
    var clave = fila.sub.join('/');
    var repetido = (medida.nombresPorCarpeta[clave] || []).some(function (otro) {
      return otro !== fila.nombre && otro.toLowerCase() === nombre.toLowerCase();
    }) || medida.lista.some(function (otra, j) {
      return otra !== fila && otra.sub.join('/') === clave && (cajas[j].value + otra.ext).toLowerCase() === nombre.toLowerCase();
    });
    return repetido ? 'Ya hay otro documento con ese nombre en la carpeta.' : '';
  }

  function filaHtml(f, i) {
    return '<div class="ac-fila">' +
      (f.sub.length ? '<span class="ac-sub">' + U.escapar(f.sub.join(' / ')) + ' /</span>' : '') +
      '<input class="campo ac-caja" data-i="' + i + '" value="' + U.escapar(f.base) + '" spellcheck="false">' +
      '<span class="ac-ext">' + U.escapar(f.ext) + '</span>' +
      '<span class="ac-estado" id="ac-estado-' + i + '"></span>' +
      '<div class="ac-motivo" id="ac-motivo-' + i + '"></div></div>';
  }

  function destinoHtml(ctx, avisoFusion) {
    return '<div class="vista-previa"><div class="vista-nombre">' +
      U.escapar(App.E.archivo.name + ' / ' + ctx.categoria + ' / ' + ctx.tercero) + '</div></div>' + (avisoFusion || '');
  }

  /* Devuelve 'acortar' (las cajas, todas válidas), 'cambiar' (ir a «Cambiar
     el asunto») o 'cancelar'. En 'acortar' devuelve también los nombres
     nuevos: { accion, nuevos: [nombreNuevo por fila] }. */
  async function cuadro(medida, avisoFusion) {
    var cuadroEl = document.querySelector('#capa .cuadro');
    var aceptar = $('cuadro-aceptar');
    if (medida.carpeta) {
      var ok0 = await U.preguntar('No cabe en el archivo',
        '<p>El nombre de la carpeta de este asunto es demasiado largo para el archivo: le sobran ' +
        medida.carpeta.sobran + ' caracteres. Cámbialo y vuelve a archivar. No se ha movido nada.</p>' +
        destinoHtml(medida.ctx, ''), 'Cambiar el asunto');
      return { accion: ok0 ? 'cambiar' : 'cancelar' };
    }
    var n = medida.lista.length;
    cuadroEl.classList.add('cuadro-ancho');
    var esperar = U.preguntar('No cabe en el archivo',
      '<p>Al archivar, esta carpeta queda dentro de la del tercero, y la ruta de ' + n + ' documento(s) ' +
      'sale más larga de lo que admite Windows. Acorta su nombre aquí. No se ha movido nada.</p>' +
      destinoHtml(medida.ctx, avisoFusion) +
      '<div class="ac-lista' + (n > 12 ? ' ac-lista-larga' : '') + '" id="ac-lista">' +
        medida.lista.map(filaHtml).join('') + '</div>', 'Acortar y archivar');
    var cajas = Array.prototype.slice.call(document.querySelectorAll('#ac-lista .ac-caja'));
    function repasar() {
      var todoBien = true;
      medida.lista.forEach(function (f, i) {
        var base = cajas[i].value;
        var sobran = largoDeFichero(medida.ctx, f.sub, base + f.ext) - Nombres.TOPE_TOTAL_RUTA;
        var motivo = motivoDe(f, base, medida, cajas);
        var estado = $('ac-estado-' + i);
        estado.textContent = sobran > 0 ? 'Sobran ' + sobran : 'Cabe';
        estado.className = 'ac-estado ' + (sobran > 0 ? 'ac-sobra' : 'ac-cabe');
        $('ac-motivo-' + i).textContent = motivo;
        if (sobran > 0 || motivo) todoBien = false;
      });
      aceptar.disabled = !todoBien;
    }
    cajas.forEach(function (c) { c.addEventListener('input', repasar); });
    repasar();
    var ok = await esperar;
    aceptar.disabled = false;
    cuadroEl.classList.remove('cuadro-ancho');
    if (!ok) return { accion: 'cancelar' };
    return { accion: 'acortar', nuevos: medida.lista.map(function (f, i) { return cajas[i].value + f.ext; }) };
  }

  /* Cambia el nombre de cada documento tocado, uno a uno. Si uno falla,
     se para ahí: aviso rojo con su nombre, y los ya cambiados se quedan
     cambiados. Devuelve true si se cambiaron todos. */
  async function acortar(a, medida, nuevos) {
    for (var i = 0; i < medida.lista.length; i++) {
      var f = medida.lista[i];
      if (nuevos[i] === f.nombre) continue;
      try {
        await DocumentoRenombrar.renombrar({ nombre: a.nombre, ficha: a.ficha }, f.dir, f.nombre, nuevos[i],
          { soloFichero: f.sub.length > 0 });
      } catch (e) {
        U.fallo('No se ha podido cambiar el nombre de «' + f.nombre + '», así que no se archiva', e);
        return false;
      }
    }
    return true;
  }

  /* ---------- archivar varios de golpe ---------- */

  function empezarLote() { App.E.noCabeEnArchivo = []; }

  function anotarNoCabe(nombre) {
    (App.E.noCabeEnArchivo = App.E.noCabeEnArchivo || []).push(nombre);
  }

  function noCupo(nombre) { return (App.E.noCabeEnArchivo || []).indexOf(nombre) !== -1; }

  /* Un solo aviso ámbar al acabar el lote, si alguno se quedó sin archivar. */
  function avisarLote() {
    var n = (App.E.noCabeEnArchivo || []).length;
    App.E.noCabeEnArchivo = [];
    if (!n) return 0;
    U.aviso(n + ' asunto(s) no se han archivado porque algún documento no cabe en el archivo: ' +
      'archívalos uno a uno desde su ⋮.', 'ambar');
    return n;
  }

  return { medir: medir, sinProblema: sinProblema, cuadro: cuadro, acortar: acortar,
           empezarLote: empezarLote, anotarNoCabe: anotarNoCabe, noCupo: noCupo, avisarLote: avisarLote };
})();
window.ArchivarCabe = ArchivarCabe;
