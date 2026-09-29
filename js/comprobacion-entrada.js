/* ============================================================
   comprobacion-entrada.js — las cosas que se configuran una vez en
   cada ordenador, revisadas al entrar (29-sep-2026, fila 204,
   docs/COMPROBACION-AL-ENTRAR.md).

   Cada comprobación es una función pequeña que devuelve
     { id, titulo, estado, frase, arreglar, ambar }
   con estado 'bien' | 'falta' | 'sin-comprobar' | 'omitida'
   (`ambar`: una «falta» que se pinta ámbar y no roja). Para añadir
   otra, se añade una función a LISTA: el panel no cambia.

   SOLO LEE. No escribe nada en _GESTOR ni en Drive, y el envío de
   correo no se prueba enviando ninguno.

   El panel y la marca de la cabecera viven en
   js/comprobacion-entrada-ver.js. Lo omitido en este ordenador se
   guarda en localStorage (`gestor-comprobacion-omitidas`).
   ============================================================ */
(function () {
  'use strict';

  var CLAVE_OMITIDAS = 'gestor-comprobacion-omitidas';
  var TIEMPO_MAX_MS = 8000;

  /* ---------- lo omitido en este ordenador ---------- */

  function leerOmitidas() {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLAVE_OMITIDAS));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function guardarOmitidas(lista) {
    try { window.localStorage.setItem(CLAVE_OMITIDAS, JSON.stringify(lista)); } catch (e) { /* sin memoria: nada */ }
  }

  function omitir(id) {
    var l = leerOmitidas();
    if (l.indexOf(id) === -1) l.push(id);
    guardarOmitidas(l);
  }

  function volverARevisar(id) {
    guardarOmitidas(leerOmitidas().filter(function (x) { return x !== id; }));
  }

  /* ---------- ayudas ---------- */

  function enDemo() { return !!(window.Demo && Demo.activo && Demo.activo()); }

  function conTiempo(promesa) {
    return new Promise(function (resolver, rechazar) {
      var t = setTimeout(function () { rechazar(new Error('tarda demasiado en contestar')); }, TIEMPO_MAX_MS);
      Promise.resolve(promesa).then(function (v) { clearTimeout(t); resolver(v); },
        function (e) { clearTimeout(t); rechazar(e); });
    });
  }

  function gestor() { return window.Gestor && Gestor.carpetaGestor ? Gestor.carpetaGestor() : null; }

  /* Lleva a donde se arregla: cierra el cuadro que haya, va a Ajustes,
     abre la pestaña y el bloque donde está `selector` y lo deja a la
     vista. Los bloques de Ajustes se pintan sueltos, así que se espera
     un poco a que el elemento exista. */
  function llevarA(selector) {
    return function () {
      var cerrar = document.getElementById('cuadro-cancelar');
      if (cerrar && !document.getElementById('capa').classList.contains('oculto')) cerrar.click();
      App.ir('ajustes');
      var intentos = 30;
      (function buscar() {
        var el = document.querySelector(selector);
        if (!el) {
          if (--intentos > 0) setTimeout(buscar, 100);
          return;
        }
        var tab = el.closest('.ajustes-tab');
        if (tab && App.cambiarPestanaAjustes) App.cambiarPestanaAjustes(tab.id.replace('ajustes-tab-', ''));
        var d = el.closest('details');
        while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
        setTimeout(function () { if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
      })();
    };
  }

  function resultado(id, titulo, estado, frase, arreglar, ambar) {
    return { id: id, titulo: titulo, estado: estado, frase: frase, arreglar: arreglar || null, ambar: !!ambar };
  }

  function sinComprobar(id, titulo, e) {
    return resultado(id, titulo, 'sin-comprobar',
      'No he podido comprobarlo: ' + ((e && e.message) ? e.message : 'no ha contestado') + '.');
  }

  /* El curso en marcha: de septiembre a agosto. */
  function limitesDelCurso() {
    var h = new Date();
    var ano = h.getMonth() >= 8 ? h.getFullYear() : h.getFullYear() - 1;
    return { desde: ano + '-09-01', hasta: (ano + 1) + '-08-31' };
  }

  /* ---------- las comprobaciones ---------- */

  async function carpetas() {
    var T = 'Carpetas de Dropbox';
    var arreglar = llevarA('#estado-carpetas');
    var faltan = [];
    if (!App.E.abiertos) faltan.push('la de asuntos abiertos');
    if (!App.E.archivo) faltan.push('la del ARCHIVO');
    if (faltan.length) {
      return resultado('carpetas', T, 'falta', 'Falta señalar ' + faltan.join(' y ') +
        '. Sin ellas la aplicación no sabe dónde guardar los asuntos.', arreglar);
    }
    if (enDemo()) return resultado('carpetas', T, 'bien', 'Señaladas.');
    var sinPermiso = [];
    if (!(await Carpetas.permiso(App.E.abiertos, false))) sinPermiso.push('asuntos abiertos');
    if (!(await Carpetas.permiso(App.E.archivo, false))) sinPermiso.push('ARCHIVO');
    if (sinPermiso.length) {
      return resultado('carpetas', T, 'falta', 'El navegador ha dejado de dar permiso a la carpeta de ' +
        sinPermiso.join(' y ') + '. Hay que volver a señalarla.', arreglar);
    }
    if (!gestor()) {
      return resultado('carpetas', T, 'falta', 'No encuentro dentro de las carpetas la zona donde la aplicación ' +
        'guarda sus ficheros. Hay que volver a señalarlas.', arreglar);
    }
    return resultado('carpetas', T, 'bien', 'Señaladas y con permiso.');
  }

  async function alumnado() {
    var T = 'Base de datos de alumnado';
    var arreglar = llevarA('#alumnado-bd-carpeta');
    if (!window.AlumnadoBD) return resultado('alumnado', T, 'omitida', '');
    var dir = await AlumnadoBD.carpeta();
    var copia = await AlumnadoBD.leer();
    if (dir) {
      var op = { mode: 'read' };
      var permiso = false;
      try { permiso = (await dir.queryPermission(op)) === 'granted'; } catch (e) { permiso = false; }
      if (!permiso) {
        if (copia) {
          return resultado('alumnado', T, 'falta', 'El navegador ha dejado de dar permiso a la carpeta de la base ' +
            'de datos de alumnado; se sigue usando la última copia. Hay que volver a señalarla.', arreglar, true);
        }
        return resultado('alumnado', T, 'falta', 'El navegador ha dejado de dar permiso a la carpeta de la base ' +
          'de datos de alumnado. Hay que volver a señalarla.', arreglar);
      }
      try { await dir.getFileHandle(AlumnadoBD.FICHERO); }
      catch (e) {
        return resultado('alumnado', T, 'falta', 'La carpeta señalada ya no tiene el fichero de la base de datos ' +
          'de alumnado. Hay que señalar la carpeta buena.', arreglar);
      }
      return resultado('alumnado', T, 'bien', 'Carpeta señalada y con el fichero dentro.');
    }
    if (!copia) {
      return resultado('alumnado', T, 'falta', 'No hay carpeta señalada ni copia de la base de datos de alumnado: ' +
        'el alumnado sale solo del RegAlum.csv, con menos datos.', arreglar);
    }
    /* Sin carpeta pero con copia (el caso del compañero): bien, salvo copia más vieja que el RegAlum. */
    var deLaCopia = new Date(copia.generado);
    var reg = App.E.datos ? await Carpetas.fechaFichero(App.E.datos, 'RegAlum.csv') : 0;
    if (reg && !isNaN(deLaCopia.getTime()) && deLaCopia.getTime() < reg) {
      return resultado('alumnado', T, 'falta', 'Se usa la copia de la base de datos de alumnado, pero es más vieja ' +
        'que el RegAlum.csv. Hay que traerla de nuevo desde el otro ordenador.', arreglar, true);
    }
    return resultado('alumnado', T, 'bien', 'Se usa la copia que hay guardada.');
  }

  async function bandeja() {
    var T = 'Bandeja de Gmail';
    var arreglar = llevarA('#estado-bandeja');
    var h = await Almacen.leer('bandeja');
    if (!h) {
      return resultado('bandeja', T, 'falta', 'No hay carpeta de la bandeja señalada: los correos etiquetados en ' +
        'Gmail no llegan a la aplicación.', arreglar);
    }
    if (enDemo()) return resultado('bandeja', T, 'bien', 'Señalada.');
    if (!(await Carpetas.permiso(h, false))) {
      return resultado('bandeja', T, 'falta', 'El navegador ha dejado de dar permiso a la carpeta de la bandeja. ' +
        'Hay que volver a señalarla.', arreglar);
    }
    try { await h.values().next(); }
    catch (e) {
      return resultado('bandeja', T, 'falta', 'No puedo leer la carpeta de la bandeja (¿se ha movido o borrado?). ' +
        'Hay que volver a señalarla.', arreglar);
    }
    return resultado('bandeja', T, 'bien', 'Señalada y se lee.');
  }

  async function envio() {
    var T = 'Envío de correo';
    var arreglar = llevarA('#envio-correo-url');
    if (!window.CorreoEnviar) return resultado('envio', T, 'omitida', '');
    if (enDemo()) return resultado('envio', T, 'bien', 'Preparado (en la copia de pruebas no sale nada de verdad).');
    var url = CorreoEnviar.leerUrl();
    if (!url) {
      return resultado('envio', T, 'falta', 'No está la dirección del script de Gmail: sin ella el botón «Enviar» ' +
        'no manda nada.', arreglar);
    }
    var problema = CorreoEnviar.problemaDeDireccion(url);
    if (problema) return resultado('envio', T, 'falta', problema, arreglar);
    if (CorreoEnviar.scriptDesactualizado()) {
      return resultado('envio', T, 'falta', 'El script de Gmail es más antiguo que la aplicación. Hay que pegar el ' +
        'script nuevo y pulsar «Nueva versión».', arreglar, true);
    }
    return resultado('envio', T, 'bien', 'La dirección del script está guardada. (Para no enviar ningún correo, ' +
      'no se ha probado; se prueba con «Probar» en Ajustes.)');
  }

  async function ruta() {
    var T = 'Ruta de Dropbox en este ordenador';
    var arreglar = llevarA('#ruta-dropbox-lugar');
    var R = window.RutaCarpetas;
    if (!R) return resultado('ruta', T, 'omitida', '');
    var db = R.dropboxDeEsteOrdenador();
    if (db.deducido) return resultado('ruta', T, 'bien', 'Sale sola de la dirección de esta copia.');
    await R.cargarComun();
    var faltan = [];
    if (!db.valor) faltan.push('dónde está Dropbox en este ordenador');
    ['abiertos', 'archivo'].forEach(function (c) {
      if (!R.comunConocido(c) && !R.leer(c)) faltan.push('la ruta de la carpeta ' + (c === 'archivo' ? 'ARCHIVO' : 'de asuntos abiertos'));
    });
    if (faltan.length) {
      return resultado('ruta', T, 'falta', 'Falta apuntar ' + faltan.join(' y ') + ': sin ello el botón «Ruta» ' +
        'no puede copiar la dirección de la carpeta de un asunto.', arreglar);
    }
    return resultado('ruta', T, 'bien', 'Apuntada.');
  }

  async function datosDelCentro() {
    var T = 'Datos del centro';
    var arreglar = llevarA('#plantillas-centro');
    if (!window.Plantillas) return resultado('centro-datos', T, 'omitida', '');
    var p = await Plantillas.cargar(gestor());
    var falta = [];
    [['centro', 'el nombre'], ['codigo', 'el código'], ['localidad', 'la localidad'],
      ['direccion', 'la dirección'], ['provincia', 'la provincia']].forEach(function (c) {
      if (!String(p[c[0]] || '').trim()) falta.push(c[1]);
    });
    if (falta.length) {
      return resultado('centro-datos', T, 'falta', 'Faltan datos del centro (' + falta.join(', ') +
        '): salen en blanco en los documentos y en los impresos.', arreglar);
    }
    return resultado('centro-datos', T, 'bien', 'Completos.');
  }

  async function cargos() {
    var T = 'Cargos: Dirección y Secretaría';
    var arreglar = llevarA('#cargos-lista');
    if (!window.Cargos) return resultado('centro-cargos', T, 'omitida', '');
    var falta = [];
    var d = await Cargos.vigente('direccion');
    var s = await Cargos.vigente('secretaria');
    if (!d) falta.push('la Dirección');
    if (!s) falta.push('la Secretaría');
    if (falta.length) {
      return resultado('centro-cargos', T, 'falta', 'Hoy no hay nadie apuntado en ' + falta.join(' ni en ') +
        ': las firmas de los documentos saldrán vacías.', arreglar);
    }
    return resultado('centro-cargos', T, 'bien', 'Hay quien los ocupa hoy.');
  }

  async function festivos() {
    var T = 'Festivos del curso';
    var arreglar = llevarA('#hitos-festivos');
    if (!window.Hitos) return resultado('centro-festivos', T, 'omitida', '');
    var datos = await Hitos.leer();
    var lista = (datos && datos.ajustes && datos.ajustes.festivos) || [];
    var c = limitesDelCurso();
    var hay = lista.some(function (f) { return f >= c.desde && f <= c.hasta; });
    if (!hay) {
      return resultado('centro-festivos', T, 'falta', 'No hay ningún festivo apuntado de este curso: los plazos de ' +
        'los asuntos se contarán como si todos los días fueran hábiles.', arreglar);
    }
    return resultado('centro-festivos', T, 'bien', 'Apuntados.');
  }

  async function copiaSinInternet() {
    var T = 'Copia sin internet al día';
    if (window.location.protocol !== 'file:') return null;   /* en la web, esta fila no sale */
    var base = window.__COPIA_BASE_REMOTO__ || 'https://raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/';
    var resp;
    try { resp = await fetch(base + 'version.json?t=' + Date.now(), { cache: 'no-store' }); }
    catch (e) { return resultado('copia', T, 'sin-comprobar', 'No he podido comprobarlo: no hay conexión a internet.'); }
    if (!resp.ok) return resultado('copia', T, 'sin-comprobar', 'No he podido comprobarlo: la página de versiones no contesta.');
    var remoto = await resp.json();
    if (!remoto || !remoto.version) return resultado('copia', T, 'sin-comprobar', 'No he podido comprobarlo: la respuesta no se entiende.');
    if (remoto.version === App.VERSION) return resultado('copia', T, 'bien', 'Es la última versión.');
    var arreglar = function () {
      var cerrar = document.getElementById('cuadro-cancelar');
      if (cerrar && !document.getElementById('capa').classList.contains('oculto')) cerrar.click();
      var b = document.getElementById('franja-copia-actualizar');
      if (b && b.scrollIntoView) { b.scrollIntoView({ block: 'center' }); if (b.focus) b.focus(); }
    };
    return resultado('copia', T, 'falta', 'Hay una versión nueva del Gestor (' + remoto.version + ') y esta copia tiene la ' +
      App.VERSION + '. Pulsa «Actualizar ahora».', arreglar, true);
  }

  var LISTA = [
    ['carpetas', 'Carpetas de Dropbox', carpetas],
    ['alumnado', 'Base de datos de alumnado', alumnado],
    ['bandeja', 'Bandeja de Gmail', bandeja],
    ['envio', 'Envío de correo', envio],
    ['ruta', 'Ruta de Dropbox en este ordenador', ruta],
    ['centro-datos', 'Datos del centro', datosDelCentro],
    ['centro-cargos', 'Cargos: Dirección y Secretaría', cargos],
    ['centro-festivos', 'Festivos del curso', festivos],
    ['copia', 'Copia sin internet al día', copiaSinInternet]
  ];

  /* Revisa todo, cada cosa por separado y con su tiempo máximo: lo que
     falle o tarde se queda en «sin comprobar» sin estorbar al resto.
     Las omitidas en este ordenador no se revisan. */
  async function revisar() {
    var omitidas = leerOmitidas();
    var filas = await Promise.all(LISTA.map(async function (c) {
      if (omitidas.indexOf(c[0]) !== -1) {
        return resultado(c[0], c[1], 'omitida', 'No se usa en este ordenador.');
      }
      try {
        var r = await conTiempo(c[2]());
        return r === null ? null : r;
      } catch (e) { return sinComprobar(c[0], c[1], e); }
    }));
    return filas.filter(function (f) { return f && !(f.estado === 'omitida' && !f.frase); });
  }

  /* Las que cuentan como «falta algo»: falta, o no se ha podido comprobar. */
  function cuentanComoFalta(f) { return f.estado === 'falta' || f.estado === 'sin-comprobar'; }

  window.ComprobacionEntrada = {
    revisar: revisar, cuentanComoFalta: cuentanComoFalta,
    omitir: omitir, volverARevisar: volverARevisar, leerOmitidas: leerOmitidas,
    CLAVE_OMITIDAS: CLAVE_OMITIDAS, _limitesDelCurso: limitesDelCurso
  };
})();
