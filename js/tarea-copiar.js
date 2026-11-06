/* ============================================================
   tarea-copiar.js — la tarea «Copiar a otra carpeta» (fila 552, 6-nov-2026,
   docs/552-COPIAR-A-OTRA-CARPETA.md; tema 550).

   Una tarea con `accion: 'copiar'` y esta receta: `{ carpeta, carpetaId, patron }`.
     - `carpeta`: el nombre de la carpeta de destino (es lo que se ve).
     - `carpetaId`: con él se recuerda, en ESTE ordenador (Almacen), la carpeta
       señalada; la carpeta en sí no viaja entre ordenadores.
     - `patron`: el nombre del fichero copiado, con texto y campos ({…}, los
       mismos de las plantillas). Vacío = el mismo nombre del documento.

   Cuándo copia: cuando llega el registrado a un hito que tiene una tarea de
   registrar (Hitos.marcarGuionPorAccion › TareaCopiar.alRegistrar). Copia el
   documento de esa tarea de registrar (js/tareas-con-documento.js) a la
   carpeta y se marca hecha, con la línea «Copiado a <carpeta> como «<nombre>».».
     - Sin permiso (o sin carpeta señalada en este ordenador): no copia; queda
       pendiente («Pendiente: falta permiso sobre la carpeta.») con un aviso
       ámbar y «Dar permiso»; al darlo, se copia y se marca.
     - Si ya hay un fichero con ese nombre: nunca se pisa; la copia lleva
       « (2)», « (3)»… al final del nombre.
     - Si el hito no tiene tarea de registrar, no se hace sola.
   Escribe en la carpeta de destino solo cuando lo provoca la llegada del
   registrado o «Dar permiso», y mira antes SoloConsulta.activo().
   Lo que se guarda en el hito: `guionHecho[<id>].copia = { texto } | { pendiente, permiso }`.
   El formulario para crearla o cambiarla, en js/tarea-copiar-editor.js.
   ============================================================ */
window.TareaCopiar = (function () {

  var CLAVE = 'copiar-carpeta:';
  var NO_VALIDOS = /[\\\/:*?"<>|\u0000-\u001f]/g;
  var PERMISO = 'Pendiente: falta permiso sobre la carpeta.';

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  /* ---------- el nombre ---------- */

  function limpiar(t) { return String(t || '').replace(NO_VALIDOS, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, ''); }

  /* El nombre del fichero copiado: el patrón con los campos rellenos (un campo vacío no deja huecos dobles), los caracteres
     que un nombre de fichero no admite, fuera, y la extensión del documento. Sin patrón, el nombre del propio documento. */
  function nombreDe(patron, valores, documento) {
    var ext = window.Nombres ? Nombres.extensionDe(documento) : '';
    var base = '';
    if (String(patron || '').trim()) {
      var r = Plantillas.rellenar(String(patron), valores || {});
      base = limpiar(r.texto.replace(/\{[^{}]*\}/g, ''));   /* un campo que no se sabe no se deja a medias */
    }
    if (!base) base = limpiar(String(documento || '').replace(/\.[A-Za-z0-9]{1,8}$/, ''));
    if (!base) return '';
    return base + (ext && !new RegExp('\\.' + ext + '$', 'i').test(base) ? '.' + ext : '');
  }

  /* Un asunto para los ejemplos y los nombres: el dado, o el primero abierto. */
  function asuntoDeEjemplo() {
    var l = (window.App && App.E && App.E.listaAbiertos) || [];
    return l[0] || null;
  }

  /* «Saldrá así»: el nombre con un asunto de verdad (el primero abierto) y un documento de ejemplo. */
  async function ejemplo(patron, a) {
    try {
      var asunto = a || asuntoDeEjemplo();
      var valores = asunto ? await Plantillas.valoresDeAsunto(asunto, { conLoQueFalta: false }) : {};
      return nombreDe(patron, valores, 'Documento.pdf') || 'Documento.pdf';
    } catch (e) { return nombreDe(patron, {}, 'Documento.pdf') || 'Documento.pdf'; }
  }

  /* ---------- la carpeta, en este ordenador ---------- */

  function carpetaId(receta) { return receta && receta.carpetaId; }

  async function recordada(receta) {
    if (!carpetaId(receta)) return null;
    try {
      var h = await Almacen.leer(CLAVE + carpetaId(receta));
      return h && h.name === receta.carpeta ? h : null;   /* otra carpeta señalada antes con la misma marca: no vale */
    } catch (e) { return null; }
  }

  async function recordar(receta, handle) { await Almacen.guardar(CLAVE + carpetaId(receta), handle); }

  /* «Elegir carpeta»: la ventana del ordenador. Devuelve el handle, o null si se cancela. */
  async function elegirCarpeta() {
    if (!window.showDirectoryPicker) { U.aviso('Este navegador no deja elegir carpetas.', 'ambar'); return null; }
    try { return await window.showDirectoryPicker({ id: 'gestor-copiar', mode: 'readwrite' }); }
    catch (e) { return null; }   /* cancelado */
  }

  /* ---------- el documento registrado ---------- */

  async function ficheroDe(a, documento) {
    var lista = await Carpetas.ficheros(a.handle);
    var igual = lista.filter(function (f) { return f.nombre === documento; })[0];
    if (igual) return igual;
    var gemelos = lista.filter(function (f) { return TareasConDocumento.mismo(f.nombre, documento); });
    return gemelos.filter(function (f) { return /\.pdf$/i.test(f.nombre); })[0] || gemelos[0] || null;
  }

  /* ---------- copiar ---------- */

  async function guardarEstado(a, h, g, copia, hecho) {
    await Hitos.anotarCopia(a.nombre, h.id, g.id, copia, hecho);
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
  }

  /* Intenta copiar `documento` para la tarea `g`. `pedirPermiso`: viene de una pulsación («Dar permiso»).
     Devuelve 'copiado' | 'pendiente' | 'nada'. Nunca lanza: es un accesorio de la llegada del registrado. */
  async function intentar(a, h, g, documento, pedirPermiso) {
    try {
      if (window.SoloConsulta && SoloConsulta.activo()) return 'nada';
      var receta = g.receta || {};
      if (!receta.carpeta || !carpetaId(receta)) {
        await guardarEstado(a, h, g, { pendiente: 'Pendiente: falta elegir la carpeta de destino.' }, false);
        return 'pendiente';
      }
      var origen = await ficheroDe(a, documento);
      if (!origen) {
        await guardarEstado(a, h, g, { pendiente: 'Pendiente: no encuentro el documento registrado en la carpeta del asunto.' }, false);
        return 'pendiente';
      }
      var dir = await recordada(receta);
      var permiso = false;
      if (dir) { try { permiso = await Carpetas.permiso(dir, !!pedirPermiso); } catch (e0) { permiso = false; } }
      if (!permiso) {
        await guardarEstado(a, h, g, { pendiente: PERMISO, permiso: true }, false);
        return 'pendiente';
      }
      var valores = await Plantillas.valoresDeAsunto(a, { conLoQueFalta: false });
      var deseado = nombreDe(receta.patron, valores, origen.nombre);
      var final = (await Carpetas.existeFichero(dir, deseado)) ? await Carpetas.nombreLibreConSufijo(dir, deseado) : deseado;
      await Carpetas.copiarFicheroEn(dir, origen.handle, final);
      await guardarEstado(a, h, g, { texto: 'Copiado a ' + receta.carpeta + ' como «' + final + '».' }, true);
      return 'copiado';
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('Registrado, pero no he podido copiarlo a otra carpeta', e);
      return 'nada';
    }
  }

  /* Ha llegado el registrado de `documento` a la tarea de registrar `paso` del hito `h` (hitos-guion-marcar.js). */
  async function alRegistrar(a, h, paso, documento) {
    try {
      if (!window.Hitos || !window.TareasConDocumento) return;
      var datos = await Hitos.leer();
      var entrada = datos.porAsunto[a.nombre];
      var fresco = entrada && Hitos.buscar(entrada.hitos, h.id);
      if (!fresco) return;
      var guion = Hitos.guionDe(a, fresco);
      var copiar = guion.filter(function (g) { return g.accion === 'copiar' && !g.hecho && !g.noaplica; });
      if (!copiar.length) return;
      var colgado = TareasConDocumento.de(fresco, paso.id);
      var doc = documento || (colgado && colgado.doc);
      if (!doc) return;
      for (var i = 0; i < copiar.length; i++) await intentar(a, fresco, copiar[i], doc, false);
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('Registrado, pero no he podido copiarlo a otra carpeta', e);
    }
  }

  /* El documento registrado del hito: el de su tarea de registrar ya hecha. */
  function documentoRegistrado(h, guion) {
    var r = guion.filter(function (g) { return g.accion === 'registrar' && g.hecho && TareasConDocumento.de(h, g.id); })[0];
    return r ? TareasConDocumento.de(h, r.id).doc : '';
  }

  /* ---------- «Dar permiso» ---------- */

  function asuntoPorClave(clave) {
    return ((window.App && App.E && App.E.listaAbiertos) || []).filter(function (x) { return x.nombre === clave; })[0] ||
      { nombre: clave, ficha: (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[clave]) || {} };
  }

  async function darPermiso(clave, idHito, idTarea) {
    var a = asuntoPorClave(clave);
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[clave];
    var h = entrada && Hitos.buscar(entrada.hitos, idHito);
    if (!h) return;
    var guion = Hitos.guionDe(a, h);
    var g = guion.filter(function (x) { return x.id === idTarea; })[0];
    if (!g) return;
    var receta = g.receta || {};
    var dir = await recordada(receta);
    if (!dir) {   /* en este ordenador no se ha señalado: se señala ahora */
      var elegida = await elegirCarpeta();
      if (!elegida) return;
      if (receta.carpeta && elegida.name !== receta.carpeta) {
        U.aviso('La carpeta de destino se llama «' + receta.carpeta + '». Elige esa.', 'ambar');
        return;
      }
      await recordar(receta, elegida);
    }
    var doc = documentoRegistrado(h, guion);
    if (!doc) { U.aviso('No encuentro el documento registrado de este hito.', 'ambar'); return; }
    var r = await intentar(a, h, g, doc, true);
    if (r === 'copiado') U.aviso('Copiado a ' + receta.carpeta + '.', 'bueno');
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('.tcp-dar-permiso') : null;
    if (!b) return;
    ev.preventDefault();
    darPermiso(b.getAttribute('data-asunto'), b.getAttribute('data-hito'), b.getAttribute('data-tarea'))
      .catch(function (e) { U.fallo('No he podido dar el permiso', e); });
  });

  /* ---------- lo que se ve en la tarea ---------- */

  /* Bajo la tarea: la línea de lo copiado, o lo pendiente (con el aviso ámbar y «Dar permiso»). */
  function vistaHTML(g, a, h) {
    var c = g.copia;
    if (g.accion !== 'copiar') return '';
    if (!c) return g.hecho ? '' : '<div class="guion-paso-explicacion tcp-linea">Se hará sola cuando llegue el registrado.</div>';
    if (g.hecho) return c.texto ? '<div class="guion-paso-explicacion tcp-linea">' + esc(c.texto) + '</div>' : '';
    if (!c.pendiente) return '';
    return '<div class="aviso aviso-ambar tcp-pendiente">' + esc(c.pendiente) +
      (c.permiso && a && h ? ' <button type="button" class="boton boton-chico tcp-dar-permiso" data-asunto="' + esc(a.nombre) +
        '" data-hito="' + esc(h.id) + '" data-tarea="' + esc(g.id) + '">Dar permiso</button>' : '') + '</div>';
  }

  return { nombreDe: nombreDe, ejemplo: ejemplo, alRegistrar: alRegistrar, vistaHTML: vistaHTML, darPermiso: darPermiso,
           elegirCarpeta: elegirCarpeta, recordar: recordar, recordada: recordada, intentar: intentar, limpiar: limpiar };
})();
