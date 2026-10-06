/* ============================================================
   plantilla-de-lo-escrito.js — «Guardar como plantilla nueva», en el
   cuadro de Correo y en el de Séneca (fila 270,
   docs/PLANTILLA-NUEVA-DE-LO-ESCRITO.md).

   Convierte lo escrito en el mensaje en el texto de una plantilla:
   1. quita el saludo y la firma, que la app pone sola en cada mensaje
      (solo si coinciden exactamente: no se adivina);
   2. cambia los datos de este asunto por su hueco (`{nombre}`,
      `{grupo}`…), con la lista de cambios para poder deshacerlos.
   `preparar` y `cambiarDatos` son funciones puras (prueba sin
   navegador). `abrirEditor` es lo que comparten los dos cuadros: monta
   el editor en línea (PlantillasAjustes.montarEditorEnLinea) y, al
   guardar, deja la plantilla elegida sin tocar el texto del mensaje.
   ============================================================ */
var PlantillaDeLoEscrito = (function () {

  /* Los datos que cambian de un asunto a otro, en el orden en que gana
     el primero si dos tienen el mismo valor. Los fijos del centro, el
     tipo, el estado y {hiton}/{hitosm} no entran. */
  var DATOS = ['nombre', 'nombreNatural', 'referencia', 'dni', 'telefono', 'correo',
    'tutor1', 'tutor1telefono', 'tutor1correo', 'tutor2', 'tutor2telefono', 'tutor2correo',
    'grupo', 'curso', 'registro', 'limite', 'descripcion', 'departamento', 'organismooficial'];
  var DATOS_FINALES = ['hito', 'plazo del hito', 'hoy', 'hoyLargo'];
  var MINIMO = 4;

  function escaparRe(t) { return String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* Quita el saludo del principio y la firma del final, si están tal cual. */
  function sinSaludoNiFirma(texto, saludo, firma) {
    var t = String(texto || '');
    if (saludo && t.indexOf(saludo) === 0) t = t.slice(saludo.length);
    if (firma && t.length >= firma.length && t.slice(t.length - firma.length) === firma) t = t.slice(0, t.length - firma.length);
    return t.replace(/^\s+|\s+$/g, '');
  }

  /* texto + valores -> { texto, cambios: [{ dato, hueco }] }. */
  function cambiarDatos(texto, valores) {
    valores = valores || {};
    var candidatos = [];
    function meter(valor, hueco) {
      var v = String(valor === undefined || valor === null ? '' : valor).trim();
      if (v.length < MINIMO) return;
      if (candidatos.some(function (c) { return c.valor.toLowerCase() === v.toLowerCase(); })) return;   /* gana el primero de la lista */
      candidatos.push({ valor: v, hueco: hueco, orden: candidatos.length });
    }
    DATOS.forEach(function (k) { meter(valores[k], '{' + k + '}'); });
    var campos = valores.campos || {};
    Object.keys(campos).forEach(function (k) { meter(campos[k], '{campo:' + k + '}'); });
    DATOS_FINALES.forEach(function (k) { meter(valores[k], '{' + k + '}'); });
    /* Primero los más largos: el nombre completo gana a una de sus partes. */
    candidatos.sort(function (a, b) { return (b.valor.length - a.valor.length) || (a.orden - b.orden); });

    var salida = String(texto || ''), fichas = [], cambios = [];
    candidatos.forEach(function (c) {
      var re = new RegExp('(?<![\\p{L}\\p{N}_])' + escaparRe(c.valor) + '(?![\\p{L}\\p{N}_])', 'giu');
      var primero = null;
      salida = salida.replace(re, function (m) {
        if (primero === null) primero = m;
        fichas.push(c.hueco);
        return '' + (fichas.length - 1) + '';
      });
      if (primero !== null) cambios.push({ dato: primero, hueco: c.hueco, orden: c.orden });
    });
    salida = salida.replace(/(\d+)/g, function (m, i) { return fichas[+i]; });
    cambios.sort(function (a, b) { return a.orden - b.orden; });
    return { texto: salida, cambios: cambios.map(function (c) { return { dato: c.dato, hueco: c.hueco }; }) };
  }

  function preparar(texto, saludo, firma, valores) {
    return cambiarDatos(sinSaludoNiFirma(texto, saludo, firma), valores);
  }

  /* ---------- lo que comparten los dos cuadros ---------- */

  function $(id) { return document.getElementById(id); }

  /* `cfg`: { prefijo: 'correo'|'seneca', elegir(a, id), dejarElegida(a, id, texto) }.
     `desdeEscrito`: true -> el editor se abre con lo que hay escrito. */
  function abrirEditor(cfg, a, existente, desdeEscrito) {
    var formulario = $(cfg.prefijo + '-formulario');
    var editor = $(cfg.prefijo + '-plantilla-editor');
    if (!formulario || !editor || !window.PlantillasAjustes) return;
    var campo = $(cfg.prefijo + '-cuerpo-texto');
    var escrito = campo ? campo.value : '';
    var inicial = null;
    if (desdeEscrito && window.CorreoNucleo) {
      var N = window.CorreoNucleo;
      inicial = preparar(escrito, N.saludoDe(a), N.firmaDe(), (N.valoresDelCuadro && N.valoresDelCuadro()) || {});
      /* Nada escrito entre el saludo y la firma: el editor en blanco, como siempre, y al guardar el mensaje se rellena con ella. */
      if (!inicial.texto) inicial = null;
    }
    function cerrar() {
      editor.className = 'oculto';
      formulario.className = '';
    }
    formulario.className = 'oculto';
    editor.className = '';
    PlantillasAjustes.montarEditorEnLinea(editor, a, existente, function (guardada) {
      cerrar();
      var N2 = window.CorreoNucleo;
      (N2 && N2.recargarPlantillas ? N2.recargarPlantillas(a) : Promise.resolve()).then(function () {
        if (inicial) {
          cfg.dejarElegida(a, guardada.id, escrito);
          U.aviso('Plantilla guardada. Queda elegida en este cuadro.', 'bueno');
        } else cfg.elegir(a, guardada.id);
      });
    }, cerrar, inicial);
  }

  /* Las dos llamadas de los cuadros, con su botón. */
  function engancharBotones(cfg, a, elegidaActual) {
    var editar = $(cfg.prefijo + '-plantilla-editar');
    var N = window.CorreoNucleo;
    if (editar) editar.onclick = function () {
      var opciones = (N.plantillasDelTipo && N.plantillasDelTipo(a)) || [];
      var existente = opciones.filter(function (p) { return p.id === elegidaActual(); })[0] || null;
      abrirEditor(cfg, a, existente, false);
    };
    var nueva = $(cfg.prefijo + '-plantilla-desde-escrito');
    if (nueva) nueva.onclick = function () { abrirEditor(cfg, a, null, true); };
    var crear = $(cfg.prefijo + '-plantilla-crear');
    if (crear) crear.onclick = function () { abrirEditor(cfg, a, null, true); };
  }

  var BOTON_NUEVA = 'Guardar como plantilla nueva';

  return { DATOS: DATOS, sinSaludoNiFirma: sinSaludoNiFirma, cambiarDatos: cambiarDatos, preparar: preparar,
           abrirEditor: abrirEditor, engancharBotones: engancharBotones, BOTON_NUEVA: BOTON_NUEVA };
})();
window.PlantillaDeLoEscrito = PlantillaDeLoEscrito;
