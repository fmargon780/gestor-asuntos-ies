/* ============================================================
   plantillas-uso.js — qué hitos usan cada plantilla (10-oct-2026,
   fila 320, docs/PANTALLA-DE-PLANTILLAS.md, punto 2).

   Módulo PURO: recibe lo ya leído y devuelve, para cada `id` de
   plantilla, la lista de sitios donde se usa. No lee ni escribe nada.
   Lo usan la pantalla «Plantillas» de Herramientas (js/plantillas-pantalla.js)
   y, más adelante, el aviso de la fila 321.

   Un `id` se guarda en estos sitios (los únicos que hay hoy):
   - una tarea del guion de un hito con `accion` 'generar' (Word) o
     'comunicar' (correo) y `receta.plantilla`;
   - los «documentos de este hito» (`plantillasDocumento`, ids de Word);
   - el aviso «al terminar» del hito (`avisarLoPide` + `avisarLoPidePlantilla`);
   - el aviso «al cerrar» del tipo (`avisarLoPideCierre` + `avisarLoPideCierrePlantilla`);
   - los modelos de la biblioteca de hitos (mismas tareas, documentos y aviso).
   Los hitos de dentro de las respuestas de una pregunta (`opciones[].pasos`)
   se recorren también. Un aviso encendido sin plantilla elegida usa la que
   se llama «Aviso de avance» / «Aviso de cierre».
   «Adjuntar solo» de una plantilla de correo guarda un tipo de documento,
   no una plantilla: no cuenta.

   Cada sitio: { tipo, titulo, numero, de, forma, biblioteca }
   - `numero`/`de`/`hitoId`: el hito de primer nivel que lo contiene («Hito 2 de 5»);
   - `forma`: 'tarea' | 'documentos' | 'aviso-al-terminar' | 'aviso-al-cerrar' | 'biblioteca';
   - `etiqueta`: «Hito 2 · Notificar a la familia», «Al cerrar el asunto»,
     «Biblioteca · título del modelo».
   ============================================================ */
var PlantillasUso = (function () {

  var NOMBRE_AVANCE = 'Aviso de avance';
  var NOMBRE_CIERRE = 'Aviso de cierre';

  function lista(x) { return Array.isArray(x) ? x : []; }

  /* Todos los hitos de un nivel y, dentro, los de las respuestas de una pregunta. */
  function recorrer(pasos, alHito, numero, de, idRaiz) {
    lista(pasos).forEach(function (p, i) {
      if (!p || typeof p !== 'object') return;
      var n = numero || (i + 1);
      var raiz = idRaiz || p.id || '';
      alHito(p, n, de || lista(pasos).length, raiz);
      lista(p.opciones).forEach(function (o) { recorrer(o && o.pasos, alHito, n, de || lista(pasos).length, raiz); });
    });
  }

  function calcular(datos) {
    datos = datos || {};
    var plantillas = datos.plantillas || {};
    var todas = lista(plantillas.lista).concat(lista(plantillas.documentos));
    var ids = {};
    todas.forEach(function (p) { if (p && p.id) ids[p.id] = true; });
    var porNombre = function (n) { return lista(plantillas.lista).filter(function (p) { return p && p.nombre === n; })[0] || null; };
    var avance = porNombre(NOMBRE_AVANCE), cierre = porNombre(NOMBRE_CIERRE);

    var salida = {};
    var vistos = {};
    function anotar(id, sitio, clave) {
      if (!id || !ids[id]) return;
      var k = id + '|' + clave;
      if (vistos[k]) return;
      vistos[k] = true;
      (salida[id] = salida[id] || []).push(sitio);
    }

    function deUnHito(p, tipo, numero, de, prefijo, biblioteca, titulo, hitoId) {
      var etiqueta = biblioteca ? 'Biblioteca · ' + titulo : 'Hito ' + numero + ' · ' + (p.titulo || 'sin título');
      var sitio = function (forma) { return { tipo: tipo, titulo: p.titulo || '', numero: numero, de: de, forma: forma, biblioteca: !!biblioteca, etiqueta: etiqueta, hitoId: hitoId || '' }; };
      var clave = prefijo + (p.id || p.titulo || '');
      lista(p.guion).forEach(function (g, i) {
        var r = g && g.receta;
        if (g && (g.accion === 'generar' || g.accion === 'comunicar') && r && r.plantilla) anotar(r.plantilla, sitio('tarea'), clave + '|t' + i);
      });
      lista(p.plantillasDocumento).forEach(function (id) { anotar(id, sitio('documentos'), clave + '|d'); });
      if (p.avisarLoPide) {
        var idAviso = p.avisarLoPidePlantilla || (avance && avance.id);
        anotar(idAviso, sitio('aviso-al-terminar'), clave + '|a');
      }
    }

    var guias = datos.guias || {};
    Object.keys(guias).forEach(function (tipo) {
      recorrer(guias[tipo], function (p, numero, de, raiz) { deUnHito(p, tipo, numero, de, 'g:' + tipo + ':', false, '', raiz); });
    });

    lista(datos.tipos).forEach(function (t) {
      if (!t || !t.avisarLoPideCierre) return;
      var id = t.avisarLoPideCierrePlantilla || (cierre && cierre.id);
      anotar(id, { tipo: t.tipo, titulo: 'Al cerrar el asunto', numero: null, de: null, forma: 'aviso-al-cerrar', biblioteca: false, etiqueta: 'Al cerrar el asunto' }, 'c:' + t.tipo);
    });

    lista(datos.modelos).forEach(function (m) {
      if (!m) return;
      deUnHito(m, '', null, null, 'm:' + (m.id || m.titulo) + ':', true, m.titulo || 'sin título');
    });

    return salida;
  }

  return { calcular: calcular, NOMBRE_AVANCE: NOMBRE_AVANCE, NOMBRE_CIERRE: NOMBRE_CIERRE };
})();
window.PlantillasUso = PlantillasUso;
