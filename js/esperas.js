/* ============================================================
   esperas.js — las esperas se cierran al llegar el documento
   (6-oct-2026, fila 286, docs/ESPERAS-QUE-SE-CIERRAN.md).

   Un asunto está en espera cuando su hito actual le toca a otro (el
   tercero, un tutor, otro organismo): es la misma regla de la pestaña «En
   espera» de Inicio (`App.ladoDe(a).lado === 'terceros'`). Aquí:

   1. La casilla del cuadro de ponerle nombre a un documento que ENTRA en
      ese asunto («Es lo que se esperaba. Termina la espera de «…».»), ya
      marcada. Con ella, al guardar: el documento se apunta al hito, se marca
      su tarea de añadir, el hito se da por hecho por el camino de «Marcar
      como hecho» y sale un aviso con «Deshacer». No cambia de pantalla.
   2. El botón «No ha llegado nada» de la mesa de un hito de espera con la
      fecha límite pasada: anota «Venció el … sin respuesta.», da el hito por
      hecho con `sinRespuesta: true` y abre el siguiente.

   Se engancha por `Documentos._interno` (js/documentos-formulario.js y
   js/documentos-guardar.js llaman a `casillaHTML` y `alGuardar`) y por la
   cabecera de la mesa (js/hito-mesa.js). Se carga después de js/hito-mesa.js.
   ============================================================ */
var Esperas = (function () {

  var cerradaEnEsteCuadro = false;   /* con varios documentos seguidos, la casilla sale solo en el primero */

  function $(id) { return document.getElementById(id); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* El hito de espera del asunto: su hito actual, si le toca a otro. */
  function deEspera(a) {
    if (!a || !window.Hitos || !Hitos.hitoActualDeAsunto || !App.ladoDe) return null;
    var h = null;
    try { h = Hitos.hitoActualDeAsunto(a); } catch (e) { h = null; }
    if (!h || !h.id || h.estado === 'hecho' || h.clase === 'decision') return null;
    var lado = App.ladoDe(a);
    return lado && lado.lado === 'terceros' ? h : null;
  }

  /* Cada vez que se cierra el cuadro compartido, se acaba la «tanda» de documentos. */
  (function vigilarLaCapa() {
    var capa = $('capa');
    if (!capa || !window.MutationObserver) return;
    new MutationObserver(function () { if (capa.classList.contains('oculto')) cerradaEnEsteCuadro = false; })
      .observe(capa, { attributes: true, attributeFilter: ['class'] });
  })();

  /* ---------- 1. la casilla del cuadro de nombre ---------- */

  function casillaHTML(opciones, a, hitoDelCuadro) {
    if (cerradaEnEsteCuadro || soloConsulta() || !opciones) return '';
    var entra = opciones.modo === 'anadir' || !!opciones.ponerNombre;
    if (!entra) return '';
    if (opciones.propuesta && opciones.propuesta.registro) return '';   /* el PDF sellado de un registro */
    var h = deEspera(a);
    if (!h) return '';
    if (hitoDelCuadro && hitoDelCuadro.id !== h.id) return '';
    return '<label class="opcion doc-termina-espera"><input type="checkbox" id="doc-termina-espera" data-hito="' + U.escapar(h.id) + '" checked>' +
      '<span>Es lo que se esperaba. Termina la espera de «' + U.escapar(h.titulo || 'este hito') + '».</span></label>';
  }

  /* Marcar o desmarcar un hito por el camino de siempre (el de su casilla), sin casilla en pantalla. */
  async function marcar(a, h, hecho) {
    var c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = !!hecho;
    return HitosPanelLista.marcarDesdeCasilla(c, a, h);
  }

  async function fresco(a, idHito) {
    return Hitos.buscar(await Hitos.hitosDe(a.nombre), idHito);
  }

  function tituloDelSiguiente(a) {
    var datos = Hitos.ultimosLeidos && Hitos.ultimosLeidos();
    var e = datos && datos.porAsunto ? datos.porAsunto[a.nombre] : null;
    if (!e || !window.EstadoHito || !EstadoHito.idActual) return { id: '', titulo: '' };
    var id = EstadoHito.idActual(e.hitos, datos.ajustes);
    var h = id ? Hitos.buscar(e.hitos, id) : null;
    return { id: id || '', titulo: h ? (h.titulo || '') : '' };
  }

  /* Tras guardar el documento: lo que haga falta si la casilla está marcada. */
  async function alGuardar(a, nombre) {
    var caja = $('doc-termina-espera');
    if (!caja || !caja.checked || !a) return;
    try {
      var h = await fresco(a, caja.dataset.hito);
      if (!h || h.estado === 'hecho') return;
      await Hitos.anadirDocumento(a.nombre, h.id, nombre);
      if (window.HitosRequisitos) { try { await HitosRequisitos.marcarPorDocumento(a.nombre, h.id, nombre); } catch (e1) { /* accesorio */ } }
      if (Hitos.marcarGuionPorAccion) { try { await Hitos.marcarGuionPorAccion(a, h.id, 'anadir'); } catch (e2) { /* accesorio */ } }
      h = await fresco(a, h.id);
      var faltan = Hitos.faltanObligatorios ? Hitos.faltanObligatorios(h, a) : [];
      if (faltan.length) {
        U.aviso('Guardado. La espera no se ha terminado: falta «' + faltan.map(function (r) { return r.texto; }).join(', ') + '».', 'ambar');
        return;
      }
      if (!(await marcar(a, h, true))) return;
      cerradaEnEsteCuadro = true;
      var sig = tituloDelSiguiente(a);
      U.aviso('Espera terminada: «' + (h.titulo || '') + '».' + (sig.titulo ? ' Ahora toca: «' + sig.titulo + '».' : ''), 'bueno', {
        boton: 'Deshacer',
        alPulsar: async function () {
          try { var hh = await fresco(a, h.id); if (hh) await marcar(a, hh, false); }
          catch (e3) { U.fallo('No he podido deshacerlo', e3); }
        }
      });
    } catch (e) {
      U.accesorio('Documento guardado, pero no he podido terminar la espera', e);
    }
  }

  /* ---------- 2. «No ha llegado nada» ---------- */

  function botonHTML(a, h) {
    if (!h || h.estado === 'hecho' || h.estado === 'noaplica') return '';
    var e = deEspera(a);
    if (!e || e.id !== h.id) return '';
    if (!(h.fecha && h.fecha < U.hoyIso())) return '';
    return '<button type="button" class="boton mesa-sin-respuesta"' +
      (soloConsulta() ? ' disabled title="En este ordenador solo se puede consultar"' : '') + '>No ha llegado nada</button>';
  }

  function abrirElSiguiente(a) {
    var sig = tituloDelSiguiente(a);
    if (sig.id && window.HitoMesa) HitoMesa.abrir(a, sig.id);
  }

  async function sinRespuesta(a, h) {
    try {
      await Hitos.anadirNota(a.nombre, h.id, 'Venció el ' + Plazos.legible(h.fecha) + ' sin respuesta.');
      var hh = await fresco(a, h.id);
      if (!hh || !(await marcar(a, hh, true))) return;
      /* La marca va después de darlo por hecho: un hito sin hacer la suelta al leerse (js/hitos.js). */
      await Hitos.guardarCampos(a.nombre, h.id, { sinRespuesta: true });
      U.aviso('Anotado: sin respuesta.', 'bueno', {
        boton: 'Deshacer',
        alPulsar: async function () {
          try { var h2 = await fresco(a, h.id); if (h2) await marcar(a, h2, false); }
          catch (e2) { U.fallo('No he podido deshacerlo', e2); }
        }
      });
      abrirElSiguiente(a);
    } catch (e) {
      U.fallo('No he podido anotarlo', e);
    }
  }

  function enganchar(cab, a, h) {
    var b = cab.querySelector('.mesa-sin-respuesta:not([disabled])');
    if (b) b.onclick = function () { U.mientrasGuarda(b, function () { return sinRespuesta(a, h); }); };
  }

  /* «Hecho» o «Hecho · sin respuesta». */
  function textoHecho(h) { return h && h.sinRespuesta ? 'Hecho · sin respuesta' : 'Hecho'; }

  return { casillaHTML: casillaHTML, alGuardar: alGuardar, botonHTML: botonHTML, enganchar: enganchar, textoHecho: textoHecho,
           deEspera: deEspera };
})();
window.Esperas = Esperas;
