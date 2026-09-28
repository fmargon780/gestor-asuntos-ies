/* ============================================================
   guias-biblioteca-ajustes.js — el bloque de Ajustes → El centro →
   Biblioteca de hitos: crear, editar y quitar un modelo (apartado 4.5
   de docs/BIBLIOTECA-DE-HITOS.md).

   Sacado de js/guias-biblioteca.js en la fila 201
   (docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md, "416 líneas: partir antes"),
   sin cambiar nada de lo que hacía, más `editarModeloPorId` (apartado
   2: «Ver en la biblioteca» desde el editor de la guía, reutilizando
   el mismo `editarModelo` que ya usaba el botón «Cambiar» de aquí).

   Se carga justo después de js/guias-biblioteca.js, y extiende el
   mismo `GuiasBiblioteca` (un solo nombre hacia fuera, como antes).
   ============================================================ */
(function () {
  if (typeof GuiasBiblioteca === 'undefined') return;
  var GB = GuiasBiblioteca;

  function usuario() { return (window.App && App.E && App.E.usuario) || ''; }
  function $(id) { return document.getElementById(id); }

  function bloqueDeAjustes() {
    var ya = document.getElementById('bloque-biblioteca-hitos');
    if (ya) return ya;
    var pantalla = document.getElementById('ajustes-tab-centro');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-biblioteca-hitos';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Biblioteca de hitos</span>' +
        '<span class="bloque-pie">Los hitos del trámite que se repiten entre tipos de asunto</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<div class="alta-tipo">' +
          '<input id="biblioteca-nuevo-nombre" class="campo" placeholder="Nombre en la biblioteca">' +
          '<button id="btn-anadir-modelo-biblioteca" class="boton">Crear desde cero</button>' +
        '</div>' +
        '<div id="tabla-biblioteca" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    $('btn-anadir-modelo-biblioteca').onclick = crearDesdeCero;
    return d;
  }

  async function crearDesdeCero() {
    var nombre = ($('biblioteca-nuevo-nombre').value || '').trim();
    if (!nombre) return;
    try {
      await HitosBiblioteca.crearDesdeCero(nombre, usuario());
      $('biblioteca-nuevo-nombre').value = '';
      U.aviso('Hito de la biblioteca creado. Ábrelo para escribir el resto.', 'bueno');
      pintarAjustes();
    } catch (e) { U.aviso('No he podido crearlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  /* El mismo editor de un hito que ya existe, para no escribir un
     segundo formulario (apartado 4.5): un hito de la biblioteca, aquí, no es más que
     un hito sin id de guía, así que Guias.editar() sirve igual con una
     lista de un solo elemento. Al guardar, solo hace falta el primero. */
  async function editarModelo(m) {
    if (window.GuiasDocumentos) await GuiasDocumentos.precargar();   /* fila 102 */
    /* Fila 159: el responsable por defecto de un hito de la biblioteca, como en la guía. */
    var opcionesResp = [];
    try {
      var aj = (await Hitos.leer()).ajustes;
      opcionesResp = (window.HitosAdministracion ? HitosAdministracion.paraGuia(aj) : aj.responsables).concat(Hitos.PAPELES);
    } catch (e) { opcionesResp = []; }
    var pasos = await Guias.editar(m.nombre, [{
      id: m.id, titulo: m.titulo, cuerpo: m.explicacion, opciones: [],
      responsable: m.responsable, estadoAsunto: m.estadoAsunto, plazo: m.plazo,
      requisitos: m.requisitos, comunicacion: m.comunicacion,
      soloInformativo: m.soloInformativo, normativa: m.normativa,
      /* Sin estos dos, editar un hito de la biblioteca los perdía (fila 102). */
      formularios: m.formularios, plantillasDocumento: m.plantillasDocumento,
      guion: m.guion   /* fila 109 */
    }], opcionesResp, [], { irA: m.id });   /* fila 122: el único hito, ya abierto */
    if (!pasos || !pasos.length) return;
    try {
      await HitosBiblioteca.editar(m.id, pasos[0], usuario());
      pintarAjustes();
      U.aviso('Guardado en la biblioteca.', 'bueno');
    } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  /* «Ver en la biblioteca» (28-sep-2026, fila 201, apartado 2): desde
     la etiqueta de origen de un hito de la guía, el mismo camino que
     «Cambiar» aquí abajo, no uno nuevo. Al abrir este editor (otro
     U.preguntar) el cuadro de la guía que estuviera abierto se da por
     cancelado (regla de siempre: solo hay un #capa); si tenía cambios
     sin guardar, se pierden, igual que si se hubiera pulsado Cancelar. */
  async function editarModeloPorId(id) {
    var biblioteca;
    try { biblioteca = await HitosBiblioteca.leer(); }
    catch (e) { U.aviso('No he podido leer la biblioteca: ' + U.mensajeDeError(e), 'malo'); return; }
    var m = HitosBiblioteca.buscar(biblioteca, id);
    if (!m) { U.aviso('Este hito ya no está en la biblioteca.', 'malo'); return; }
    await editarModelo(m);
  }

  async function borrarModelo(m) {
    var guias = null;
    try { guias = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { guias = null; }
    var enUso = HitosBiblioteca.tiposQueUsan(m.id, guias || {});
    var aviso = enUso.length
      ? '<p class="nota">Está en uso en: <strong>' + enUso.map(U.escapar).join(', ') + '</strong>. ' +
        'Los hitos ya insertados en esos tipos se quedan como están, sin este vínculo.</p>'
      : '';
    var ok = await U.preguntar('Quitar de la biblioteca',
      '<p><strong>' + U.escapar(m.nombre) + '</strong></p>' + aviso, 'Quitar');
    if (!ok) return;
    try {
      await HitosBiblioteca.borrar(m.id);
      pintarAjustes();
      U.aviso('Quitado de la biblioteca.', 'bueno');
    } catch (e) { U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function pintarAjustes() {
    var d = bloqueDeAjustes();
    if (!d) return;
    var caja = $('tabla-biblioteca');
    var datos;
    try { datos = await HitosBiblioteca.leer(); }
    catch (e) { caja.innerHTML = '<div class="vacio">No he podido leer la biblioteca: ' + U.escapar(U.mensajeDeError(e)) + '</div>'; return; }
    caja.innerHTML = '';
    if (!datos.modelos.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ningún hito en la biblioteca.</div>';
      return;
    }
    datos.modelos.forEach(function (m) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(m.nombre) + '</span>' +
        '<span class="suave" style="flex:1">' + U.escapar(GB.resumenDeModelo(m)) + '</span>';
      var editarBtn = document.createElement('button');
      editarBtn.type = 'button'; editarBtn.className = 'boton'; editarBtn.textContent = 'Cambiar';
      editarBtn.onclick = function () { editarModelo(m); };
      f.appendChild(editarBtn);
      var borrarBtn = document.createElement('button');
      borrarBtn.type = 'button'; borrarBtn.className = 'boton boton-peligro'; borrarBtn.textContent = 'Quitar';
      borrarBtn.onclick = function () { borrarModelo(m); };
      f.appendChild(borrarBtn);
      caja.appendChild(f);
    });
  }

  (function enganchar() {
    function hacerlo() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (App.pantallaALaVista && !App.pantallaALaVista('ajustes')) return;   /* fila 101 */
        if (window.Gestor.carpetaGestor()) pintarAjustes();
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hacerlo);
    else hacerlo();
  })();

  Object.assign(GB, { editarModeloPorId: editarModeloPorId });
})();
