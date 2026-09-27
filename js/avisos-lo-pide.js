/* ============================================================
   avisos-lo-pide.js — avisar a quien lo pide, y «Enviar estado»
   (27-sep-2026, fila 195, docs/AVISOS-A-QUIEN-LO-PIDE.md, apartados
   1, 2 y 3).

   El resto del centro no entra en el gestor: pide y consulta por
   correo. Regla que manda: ningún correo sale sin que alguien pulse
   «Enviar» (js/correo-cuadro.js) — este módulo solo abre el cuadro ya
   relleno, nunca envía nada por su cuenta.

   - Al marcar un hito como hecho con su casilla «avisar a quien lo
     pide» encendida (js/hitos-panel-lista.js), o al archivar un
     asunto de un tipo con la suya (aquí mismo, envolviendo
     App.cerrarAsunto): se abre el cuadro de Correo con la plantilla
     que toque, y ya no se vuelve a preguntar por ese mismo hito (o,
     al archivar, no hace falta: solo pasa una vez).
   - «Enviar estado»: el mismo cuadro, con «Aviso de avance» y el hito
     actual, para contestar un «¿cómo va lo mío?» sin escribir nada
     (js/ficha-asunto.js, js/hito-mesa.js).
   - Las dos plantillas («Aviso de avance», «Aviso de cierre») se
     crean solas, sin categoría ni tipo (válidas para cualquier
     asunto: fila 195 en js/plantillas.js, `deTipo`), la primera vez
     que hacen falta.

   Sin «Lo pide» con correo, no pasa nada, nunca: `correoLoPide` es la
   única puerta.
   ============================================================ */
(function () {

  var NOMBRE_AVANCE = 'Aviso de avance';
  var NOMBRE_CIERRE = 'Aviso de cierre';

  var TEXTO_AVANCE = 'Le informamos de que su gestión sigue en marcha.\n\n' +
    'Va por el hito {{HITON}} de {{HITOSM}}: {{HITO}}.\n\nFecha: {{HOY}}.';
  var TEXTO_CIERRE = 'Le informamos de que su gestión ha quedado cerrada el {{HOY}}.';

  function porNombre(datos, nombre) {
    return ((datos && datos.lista) || []).filter(function (p) { return p.nombre === nombre; })[0] || null;
  }

  function porId(datos, id) {
    if (!id) return null;
    return ((datos && datos.lista) || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  /* Relee y añade las que falten, como hace «Cargar las plantillas
     del centro» (js/plantillas-centro.js): nunca pisa una que ya
     exista (por nombre), así que Francisco puede editarlas o
     borrarlas sin que vuelvan solas mientras siga habiendo alguna con
     ese nombre… si de verdad se borran las dos, vuelven a crearse la
     siguiente vez que hagan falta, igual que "Cargar las plantillas
     del centro". */
  async function asegurarPlantillas(gestor) {
    if (!gestor || !window.Plantillas) return window.Plantillas ? Plantillas.cargar(gestor) : null;
    var datos = await Plantillas.cargar(gestor);
    if (porNombre(datos, NOMBRE_AVANCE) && porNombre(datos, NOMBRE_CIERRE)) return datos;
    return Plantillas.guardar(gestor, function (actual) {
      if (!porNombre(actual, NOMBRE_AVANCE)) {
        actual.lista.push({ id: Plantillas.idNuevo(), tipo: '', categoria: '', nombre: NOMBRE_AVANCE, texto: TEXTO_AVANCE });
      }
      if (!porNombre(actual, NOMBRE_CIERRE)) {
        actual.lista.push({ id: Plantillas.idNuevo(), tipo: '', categoria: '', nombre: NOMBRE_CIERRE, texto: TEXTO_CIERRE });
      }
      return actual;
    });
  }

  function correoLoPide(a) {
    return (window.LoPide && a && LoPide.correoDe(a.ficha)) || '';
  }

  function gestorActual() {
    return (window.Gestor && Gestor.carpetaGestor()) || (window.App && App.E && App.E.gestor) || null;
  }

  /* El desplegable «Con la plantilla:» del editor de la guía y de la
     pantalla del tipo (apartado 1): las plantillas de correo del
     tipo (incluidas las dos de aquí, que valen para cualquiera),
     `seleccionada` marcada, o si no hay ninguna elegida, la que
     corresponda por defecto (`nombreDefecto`). */
  async function opcionesPlantillaHTML(nombreTipo, seleccionada, nombreDefecto) {
    var gestor = gestorActual();
    var datos = null;
    try { datos = await asegurarPlantillas(gestor); } catch (e) { datos = window.Plantillas ? Plantillas.enMemoria && Plantillas.enMemoria() : null; }
    if (!datos) return '<option value="">(sin plantillas)</option>';
    var categoria = (window.Nombres && window.App) ? Nombres.categoriaDeTipo(App.E.tipos, nombreTipo) : '';
    var opciones = Plantillas.deTipo(datos, categoria, nombreTipo);
    if (!opciones.length) return '<option value="">(sin plantillas de correo en este tipo)</option>';
    var elegida = seleccionada && opciones.some(function (p) { return p.id === seleccionada; })
      ? seleccionada
      : ((porNombre(datos, nombreDefecto || NOMBRE_AVANCE) || {}).id || '');
    return opciones.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === elegida ? ' selected' : '') + '>' + U.escapar(p.nombre) + '</option>';
    }).join('');
  }

  /* ---------- al marcar un hito como hecho (apartado 2) ---------- */

  async function marcarPreguntado(claveAsunto, idHito) {
    if (!window.Hitos) return;
    try {
      await Hitos.cambiar(function (d) {
        var entrada = d.porAsunto[claveAsunto];
        var h = entrada ? Hitos.buscar(entrada.hitos, idHito) : null;
        if (h) h.avisoLoPideHecho = true;
        return d;
      });
    } catch (e) { /* si no se puede guardar la marca, como mucho se vuelve a preguntar */ }
  }

  /* Llamado desde js/hitos-panel-lista.js justo después de guardar el
     hito como hecho (con el `h` ya en memoria, ya con `estado:'hecho'`). */
  async function alMarcarHecho(a, h) {
    if (!h || !h.avisarLoPide || h.avisoLoPideHecho) return;
    if (!correoLoPide(a)) return;
    if (!window.CorreoNucleo) return;
    var gestor = gestorActual();
    var datos = null;
    try { datos = await asegurarPlantillas(gestor); } catch (e) { datos = null; }
    var plantilla = (datos && (porId(datos, h.avisarLoPidePlantilla) || porNombre(datos, NOMBRE_AVANCE))) || null;
    if (!plantilla) return;
    await CorreoNucleo.abrirCuadro(a, false, { plantilla: plantilla.id, hito: h, avisoLoPide: true });
    await marcarPreguntado(a.nombre, h.id);
  }

  /* ---------- al archivar (apartado 2) ---------- */

  function infoDelTipo(a) {
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
    return ((window.App && App.E.tipos) || []).filter(function (t) { return t.tipo === tipo; })[0] || null;
  }

  async function alArchivar(a) {
    var info = infoDelTipo(a);
    if (!info || !info.avisarLoPideCierre) return;
    if (!correoLoPide(a)) return;
    if (!window.CorreoNucleo) return;
    var gestor = gestorActual();
    var datos = null;
    try { datos = await asegurarPlantillas(gestor); } catch (e) { datos = null; }
    var plantilla = (datos && (porId(datos, info.avisarLoPideCierrePlantilla) || porNombre(datos, NOMBRE_CIERRE))) || null;
    if (!plantilla) return;
    /* Se abre y se espera; se archive lo que se decida dentro. */
    await CorreoNucleo.abrirCuadro(a, false, { plantilla: plantilla.id, avisoLoPide: true });
  }

  /* Antes de mover la carpeta (para que el cuadro tenga la ficha a
     mano, con sus documentos): se envuelve aquí, cargado después de
     js/ficha-archivo.js, así que esta envoltura queda por fuera y se
     ejecuta primero. */
  U.envolver(window.App, 'App.cerrarAsunto', 'avisos-lo-pide.js', function (comoEra) {
    return async function (a) {
      try { await alArchivar(a); } catch (e) { /* un aviso roto no puede impedir archivar */ }
      return comoEra(a);
    };
  });

  /* ---------- «Enviar estado» (apartado 3) ---------- */

  async function hitoActualDe(a) {
    try {
      var lado = (window.App && App.ladoDe) ? App.ladoDe(a) : null;
      if (!lado || !lado.hito || !window.Hitos) return null;
      var datos = await Hitos.leer();
      var lista = (datos.porAsunto[a.nombre] || {}).hitos || [];
      return Hitos.buscar(lista, lado.hito);
    } catch (e) { return null; }
  }

  async function enviarEstado(a) {
    if (!window.CorreoNucleo) return;
    if (!correoLoPide(a)) {
      U.aviso('Este asunto no tiene «Lo pide» con correo: ábrelo desde «El encargo».', 'malo');
      return;
    }
    var gestor = gestorActual();
    var datos = null;
    try { datos = await asegurarPlantillas(gestor); } catch (e) { datos = null; }
    var plantilla = datos && porNombre(datos, NOMBRE_AVANCE);
    if (!plantilla) { U.aviso('No he encontrado la plantilla «Aviso de avance».', 'malo'); return; }
    var hito = await hitoActualDe(a);
    await CorreoNucleo.abrirCuadro(a, false, { plantilla: plantilla.id, hito: hito });
  }

  window.AvisosLoPide = {
    NOMBRE_AVANCE: NOMBRE_AVANCE, NOMBRE_CIERRE: NOMBRE_CIERRE,
    asegurarPlantillas: asegurarPlantillas,
    opcionesPlantillaHTML: opcionesPlantillaHTML,
    alMarcarHecho: alMarcarHecho,
    enviarEstado: enviarEstado,
    /* para las pruebas */
    _correoLoPide: correoLoPide
  };
})();
