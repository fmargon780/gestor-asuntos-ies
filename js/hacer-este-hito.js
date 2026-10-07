/* ============================================================
   hacer-este-hito.js — «Hacer este hito»: las tareas del hito, encadenadas
   (6-oct-2026, fila 285, docs/HACER-ESTE-HITO.md).

   Un solo botón en la cabecera de la mesa del hito que hace, una tras otra,
   las tareas pendientes con acción: genera el documento y guarda el PDF solo,
   se para en el registro de Séneca (se hace fuera) y deja el correo preparado
   con el documento adjunto. Usa lo de siempre (PlantillasDocumento.generar,
   WordVisor, HitosComunicar.comunicar, las recetas de la fila 164): no cambia
   ninguno de los tres menús.

   El apunte `cadena` del hito (hitos.json) dice dónde está parada:
   { estado: 'esperando-sello' | 'listo-para-enviar', tarea, documento, quien, cuando }.
   Lo borra terminar la cadena, dar el hito por hecho y «Dejar de esperar».
   El reconocimiento del PDF sellado, y el aviso de Inicio, viven en
   js/hacer-este-hito-sello.js.

   La palabra «cadena» no sale nunca en pantalla. Se carga después de
   js/hito-mesa-recetas.js.
   ============================================================ */
var HacerEsteHito = (function () {

  var ACCIONES = ['generar', 'registrar', 'comunicar'];
  var activos = {};   /* «asunto|hito» -> true, mientras la cadena corre */

  var PARA_QUIEN = { tercero: 'al tercero', tutores: 'a la familia', relacionados: 'a los relacionados', tutoria: 'al tutor o tutora del grupo', otro: 'a otra persona' };

  function clave(a, h) { return a.nombre + '|' + h.id; }
  function esDeCadena(g) { return !g.pregunta && !g.hecho && !g.noaplica && ACCIONES.indexOf(g.accion) !== -1; }
  function tareasDe(a, h) { return window.Hitos && Hitos.guionDe ? Hitos.guionDe(a, h).filter(esDeCadena) : []; }
  function enCurso(a, h) { return !!(a && h && activos[clave(a, h)]); }
  function puede(h) { return !!h && h.clase !== 'decision' && h.estado !== 'hecho' && h.estado !== 'noaplica'; }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  async function fresco(a, idHito) {
    var hitos = await Hitos.hitosDe(a.nombre);
    return Hitos.buscar(hitos, idHito);
  }

  function repintar() {
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    if (window.HacerEsteHitoSello) HacerEsteHitoSello.avisar();   /* el «N listos para enviar» de Inicio */
  }

  function guardarCadena(a, h, cadena) {
    return Hitos.guardarCampos(a.nombre, h.id, { cadena: cadena });
  }

  /* ---------- lo que se ve en la cabecera ---------- */

  function botonHTML(a, h) {
    if (!puede(h) || (window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a))) return '';   /* fila 293: en un asunto de grupo, los botones de la lista */
    var c = h.cadena;
    if (c && c.estado === 'esperando-sello') {
      return '<button type="button" class="boton mesa-hacer-hito mesa-hacer-espera" disabled>Esperando el PDF sellado</button>' +
        '<button type="button" class="enlace mesa-hacer-dejar">Dejar de esperar</button>';
    }
    if (c && c.estado === 'listo-para-enviar') {
      return '<button type="button" class="boton mesa-hacer-hito mesa-hacer-enviar"' +
        (soloConsulta() ? ' disabled title="En este ordenador solo se puede consultar"' : '') + '>Enviar</button>';
    }
    var t = tareasDe(a, h);
    if (!t.some(function (g) { return g.accion === 'generar' || g.accion === 'comunicar'; })) return '';
    return '<button type="button" class="boton boton-principal mesa-hacer-hito"' +
      (soloConsulta() ? ' disabled title="En este ordenador solo se puede consultar"' : '') + '>Hacer este hito</button>';
  }

  function nombreDePlantilla(g) {
    var id = g.receta && g.receta.plantilla;
    var d = id && window.Plantillas && Plantillas.documentoPorId ? Plantillas.documentoPorId(id) : null;
    return d && d.nombre ? d.nombre : g.texto;
  }

  /* «Genera «Certificado» → espera el registro en Séneca → correo a la familia». */
  function lineaHTML(a, h) {
    if (!puede(h) || (window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a))) return '';   /* fila 293 */
    var c = h.cadena;
    if (c && c.estado === 'listo-para-enviar') return '<div class="mesa-hacer-linea">El documento ya está sellado.</div>';
    if (c && c.estado === 'esperando-sello') return '';
    var t = tareasDe(a, h);
    if (!t.some(function (g) { return g.accion === 'generar' || g.accion === 'comunicar'; })) return '';
    var partes = t.map(function (g) {
      if (g.accion === 'generar') return 'Genera «' + nombreDePlantilla(g) + '»';
      if (g.accion === 'registrar') return 'espera el registro en Séneca';
      var r = g.receta || {};
      return (r.via === 'seneca' ? 'mensaje por Séneca' : 'correo') + (PARA_QUIEN[r.a] ? ' ' + PARA_QUIEN[r.a] : '');
    });
    return '<div class="mesa-hacer-linea">' + U.escapar(partes.join(' → ')) + '</div>';
  }

  function enganchar(cab, a, h) {
    var b = cab.querySelector('.mesa-hacer-hito:not([disabled])');
    if (b) b.onclick = function () { ejecutar(a, h); };
    var dejar = cab.querySelector('.mesa-hacer-dejar');
    if (dejar) dejar.onclick = async function () {
      try { await guardarCadena(a, h, null); repintar(); }
      catch (e) { U.fallo('No he podido dejar de esperar', e); }
    };
  }

  /* ---------- la plantilla de una tarea de generar ---------- */

  async function plantillaDe(a, g) {
    var id = g.receta && g.receta.plantilla;
    var datos = null;
    if (window.Plantillas) { try { datos = await Plantillas.cargarReciente(App.E.gestor); } catch (e) { datos = null; } }
    var p = id && datos && (datos.documentos || []).filter(function (x) { return x.id === id; })[0];
    if (p) return p;
    /* Sin plantilla en la receta: el cuadro de elegir de siempre. */
    var lista = await PlantillasDocumento.plantillasDelAsunto(a);
    if (lista.length === 1) return lista[0];
    return PlantillasDocumento.elegir({ delPaso: [], delTipo: lista, buscar: true });
  }

  /* ---------- los pasos de la cadena ---------- */

  async function pasoGenerar(a, h, g, siguiente) {
    var p = await plantillaDe(a, g);
    if (!p) return { sigue: false };
    var guardado = false;
    var paraRegistrar = !!(siguiente && siguiente.accion === 'registrar');
    var res = await PlantillasDocumento.generar(a, p, 'abierto', {
      hito: h, idPasoGuion: g.id,
      alAbrirVisor: async function (nombre, abierto) {
        await abierto;
        guardado = await WordVisor.guardarPdfAhora({ sinCerrar: paraRegistrar });
      }
    });
    if (!res || !guardado) return { sigue: false };
    return { sigue: true, documento: WordVisor.nombrePdf(res.nombre) };
  }

  async function pasoRegistrar(a, h, g, documento) {
    await guardarCadena(a, h, { estado: 'esperando-sello', tarea: g.id, documento: documento || '', quien: App.E.usuario || '', cuando: U.ahora() });
    if (window.WordVisor && WordVisor.abierto()) {
      var f = WordVisor.franja('Documento listo. Ahora toca firmarlo y registrarlo en Séneca. Cuando guardes el PDF sellado en la carpeta del asunto, la aplicación sigue sola. ');
      if (f && window.RutaCarpetas) {
        var sitio = document.createElement('span');
        f.appendChild(RutaCarpetas.boton(a, 'abierto', { enLinea: true, contenedor: sitio }));
        f.appendChild(sitio);
      }
    }
    repintar();
    return { sigue: false };
  }

  /* El cuadro de Correo cambia de contenido al enviar (pide confirmación en el mismo cuadro): su promesa
     acaba antes de que la persona termine. Se espera a que el cuadro se cierre de verdad. */
  async function esperarAQueSeCierre() {
    function cerrado() { var c = document.getElementById('capa'); return !c || c.classList.contains('oculto'); }
    await new Promise(function (ok) { setTimeout(ok, 250); });
    while (!cerrado()) await new Promise(function (ok) { setTimeout(ok, 250); });
  }

  async function pasoComunicar(a, h, g, documento) {
    var receta = g.receta || {};
    var canales = HitosComunicar.canalesDe ? HitosComunicar.canalesDe(a, h) : ['correo'];
    var via = receta.via || canales[0] || 'correo';
    var lista = await HitoMesaComunicar.candidatos(a, h);
    var op = await HitoMesaRecetas.opcionesDePaso(a, h, g, lista, via);   /* fila 299: la misma regla que la mesa */
    op.cerrarTexto = 'Todavía no';
    if (via === 'correo') {
      if (documento) op.adjuntos = [documento];
    } else if (documento) op.documentoSeneca = documento;
    await HitosComunicar.comunicar(a, h, via, op);
    await esperarAQueSeCierre();
    var despues = await fresco(a, h.id);
    var hecha = despues && Hitos.guionDe(a, despues).filter(function (x) { return x.id === g.id && x.hecho; }).length;
    if (hecha) return { sigue: true };
    /* «Todavía no»: el hito queda listo para enviar. */
    await guardarCadena(a, h, { estado: 'listo-para-enviar', tarea: g.id, documento: documento || '', quien: App.E.usuario || '', cuando: U.ahora() });
    repintar();
    return { sigue: false };
  }

  /* ---------- terminar ---------- */

  function abrirElSiguiente(a) {
    var datos = Hitos.ultimosLeidos && Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto ? datos.porAsunto[a.nombre] : null;
    if (!window.EstadoHito || !EstadoHito.idActual || !window.HitoMesa || !datos) return;
    var siguiente = EstadoHito.idActual(entrada ? entrada.hitos : [], datos.ajustes);
    if (siguiente) HitoMesa.abrir(a, siguiente);
  }

  function casillaDe(idHito) {
    var fila = document.querySelector('.hito[data-id="' + idHito + '"]');
    return fila && fila.querySelector(':scope > .hito-linea .hito-casilla');
  }

  async function terminar(a, idHito) {
    var h = await fresco(a, idHito);
    if (!h) return;
    if (h.cadena) { try { await guardarCadena(a, h, null); } catch (e) { U.accesorio('No he podido borrar el apunte del hito', e); } }
    var cuenta = Hitos.cuentaGuion(Hitos.guionDe(a, h));
    var quedan = cuenta.total - cuenta.hechos;
    if (quedan > 0) {
      U.aviso('Hecho lo que podía hacer la aplicación. Quedan ' + quedan + (quedan === 1 ? ' tarea por marcar.' : ' tareas por marcar.'), 'bueno');
      return;
    }
    var casilla = casillaDe(idHito);
    if (!casilla || casilla.checked || !window.HitosPanelLista || !HitosPanelLista.marcarDesdeCasilla) return;
    casilla.checked = true;
    var ok = await HitosPanelLista.marcarDesdeCasilla(casilla, a, h);
    if (!ok) return;
    U.aviso('Hito hecho: «' + (h.titulo || '') + '».', 'bueno', {
      boton: 'Deshacer',
      alPulsar: async function () {
        var c = casillaDe(idHito);
        if (!c) return;
        c.checked = false;
        try { await HitosPanelLista.marcarDesdeCasilla(c, a, h); } catch (e) { U.fallo('No he podido deshacerlo', e); }
      }
    });
    abrirElSiguiente(a);
  }

  /* ---------- la cadena ---------- */

  async function ejecutar(a, hito0) {
    var k = clave(a, hito0);
    if (activos[k] || soloConsulta()) return;
    activos[k] = true;
    var documento = (hito0.cadena && hito0.cadena.documento) || '';
    var intentadas = {};
    try {
      for (var vuelta = 0; vuelta < 30; vuelta++) {
        var h = await fresco(a, hito0.id);
        if (!h || h.estado === 'hecho') return;
        var guion = Hitos.guionDe(a, h);
        var pendientes = guion.filter(function (g) { return !g.hecho && !g.noaplica && (g.pregunta || ACCIONES.indexOf(g.accion) !== -1); });
        var sig = pendientes[0];
        if (!sig) break;
        if (sig.pregunta) { U.aviso('Antes hay que responder: «' + sig.texto + '».', 'ambar'); return; }
        if (intentadas[sig.id]) return;   /* no ha avanzado: se para, sin dar vueltas */
        intentadas[sig.id] = true;
        var resto = pendientes.slice(1).filter(function (g) { return !g.pregunta; })[0];
        var r;
        if (sig.accion === 'generar') r = await pasoGenerar(a, h, sig, resto);
        else if (sig.accion === 'registrar') r = await pasoRegistrar(a, h, sig, documento);
        else r = await pasoComunicar(a, h, sig, documento);
        if (!r || !r.sigue) return;
        if (r.documento) documento = r.documento;
      }
      await terminar(a, hito0.id);
    } catch (e) {
      U.fallo('No he podido hacer el hito', e);
    } finally {
      delete activos[k];
      repintar();
    }
  }

  return {
    botonHTML: botonHTML, lineaHTML: lineaHTML, enganchar: enganchar, enCurso: enCurso,
    ejecutar: ejecutar, tareasDe: tareasDe,
    /* para js/hacer-este-hito-sello.js y las pruebas */
    _fresco: fresco, _guardarCadena: guardarCadena
  };
})();
window.HacerEsteHito = HacerEsteHito;
