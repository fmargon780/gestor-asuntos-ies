/* ============================================================
   informar-al-tutor.js — «Informar al tutor/a» llega solo al centro
   (7-oct-2026, fila 299, docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartado 1.6).

   Una pasada, una vez por centro (la marca `informarAlTutor` vive en
   `_GESTOR/hitos-biblioteca.json`, que ya pasa por Copias; como
   js/plazos-del-centro.js), enganchada por `Gestor.alRefrescar`. Nunca con
   un guardado en marcha ni con «solo consultar». Para el tipo SANCION (nombre
   corto `SANCION` o el largo «Medida disciplinaria por conducta gravemente
   perjudicial») que tenga el hito «Notificar al tutor/a»:

   - el hito pasa a llamarse «Informar al tutor/a» (en la guía y, por la
     misma puerta de «Hito ▾» → «Cambiar», en los asuntos abiertos);
   - se crea la plantilla de correo «Informar al tutor/a de la sanción»,
     que adjunta sola el documento NOTIFICACION;
   - su tarea de comunicar (o una nueva, «Enviar el correo al tutor/a») queda
     «Tutor/a del grupo», por correo y con esa plantilla.
   Y, en todo el centro (guías y modelos de la biblioteca), una tarea de
   comunicar sin «a quién» que habla de la tutoría recibe «Tutor/a del
   grupo», sin subir ninguna `revision`. No avisa en pantalla.
   ============================================================ */
var InformarAlTutor = (function () {

  var VERSION = 1;
  var NOMBRE_LARGO = 'Medida disciplinaria por conducta gravemente perjudicial';
  var TITULO_NUEVO = 'Informar al tutor/a';
  var TITULOS_VIEJOS = ['notificar al tutor/a', 'notificar al tutor', 'notificar al tutor o tutora'];
  var NOMBRE_PLANTILLA = 'Informar al tutor/a de la sanción';
  var TEXTO_PLANTILLA = 'Jefatura de Estudios entregará al/a la alumno/a la notificación escrita para la familia.\n\n' +
    'Esta comunicación es solo a efectos informativos para el tutor o la tutora.';
  var TAREA_NUEVA = 'Enviar el correo al tutor/a';
  var corriendo = false;

  function n(t) { return U.normalizar(String(t || '')).replace(/[.:;\s]+$/, '').trim(); }

  function esTipoDeSancion(t) {
    if (!t) return false;
    var corto = n(t.nombreCorto), largo = n(NOMBRE_LARGO);
    return corto === 'sancion' || n(t.tipo) === 'sancion' || corto === largo || n(t.tipo) === largo;
  }

  function esElHito(titulo) {
    var k = n(titulo);
    return k === n(TITULO_NUEVO) || TITULOS_VIEJOS.indexOf(k) !== -1;
  }

  /* El paso (a cualquier profundidad) que es «Notificar al tutor/a» (o ya «Informar…»). */
  function buscarPaso(pasos) {
    for (var i = 0; i < (pasos || []).length; i++) {
      var p = pasos[i];
      if (p && esElHito(p.titulo)) return p;
      for (var j = 0; j < ((p && p.opciones) || []).length; j++) {
        var enc = buscarPaso((p.opciones[j] && p.opciones[j].pasos) || []);
        if (enc) return enc;
      }
    }
    return null;
  }

  /* La primera tarea de comunicar de un paso, también dentro de las respuestas de una pregunta. */
  function primeraDeComunicar(lineas) {
    for (var i = 0; i < (lineas || []).length; i++) {
      var g = lineas[i];
      if (g && g.accion === 'comunicar') return g;
      for (var j = 0; j < ((g && g.opciones) || []).length; j++) {
        var enc = primeraDeComunicar(g.opciones[j] && g.opciones[j].lineas);
        if (enc) return enc;
      }
    }
    return null;
  }

  /* PURA. Cambia `paso` en su sitio: el título, y su tarea de comunicar (o una nueva) con «Tutor/a del grupo»,
     correo y esa plantilla. Devuelve { titulo, tarea: '' | 'puesta' | 'nueva' }. */
  function completarPaso(paso, idPlantilla, nuevoId) {
    var r = { titulo: false, tarea: '' };
    if (paso.titulo !== TITULO_NUEVO) { paso.titulo = TITULO_NUEVO; r.titulo = true; }
    paso.guion = Array.isArray(paso.guion) ? paso.guion : [];
    var receta = { a: 'tutoria', via: 'correo', plantilla: idPlantilla || '' };
    var t = primeraDeComunicar(paso.guion);
    if (t) {
      var ya = t.receta && t.receta.a === 'tutoria' && t.receta.via === 'correo' && t.receta.plantilla === receta.plantilla;
      if (!ya) { t.receta = receta; r.tarea = 'puesta'; }
    } else {
      paso.guion.push({ id: nuevoId ? nuevoId() : 'g-tutor', texto: TAREA_NUEVA, explicacion: '', accion: 'comunicar', normativa: null, receta: receta });
      r.tarea = 'nueva';
    }
    return r;
  }

  /* ¿Una tarea de comunicar habla de la tutoría (y no de la familia ni de las dos tutorías)? PURA. */
  function hablaDeLaTutoria(texto) {
    var k = U.normalizar(String(texto || ''));
    if (/familia|tutores legales|tutor legal|dos tutorias/.test(k)) return false;
    return /\btutoria\b|\btutor\/a\b|\btutor o tutora\b/.test(k);
  }

  /* PURA. Recorre `raiz` (guías o modelos, a cualquier profundidad) y pone «Tutor/a del grupo» a las tareas de comunicar
     sin «a quién» que hablan de la tutoría: solo eso (ni vía ni plantilla). Devuelve cuántas ha cambiado. */
  function tutoriaEnTareas(raiz) {
    var cambiadas = 0;
    (function recorrer(x) {
      if (Array.isArray(x)) { x.forEach(recorrer); return; }
      if (!x || typeof x !== 'object') return;
      if (x.accion === 'comunicar' && typeof x.texto === 'string' && !(x.receta && x.receta.a) && hablaDeLaTutoria(x.texto)) {
        x.receta = Object.assign({ a: '', via: '', plantilla: '' }, x.receta || {}, { a: 'tutoria' });
        cambiadas++;
      }
      Object.keys(x).forEach(function (k) { if (x[k] && typeof x[k] === 'object') recorrer(x[k]); });
    })(raiz);
    return cambiadas;
  }

  function tipoDocumentoNotificacion() {
    var lista = (window.App && App.E && App.E.tiposDocumento) || [];
    return lista.filter(function (t) { return n(t) === 'notificacion'; })[0] || 'NOTIFICACION';
  }

  /* La plantilla de correo del tipo (la crea si no hay una con ese nombre). Devuelve su id. */
  async function asegurarPlantilla(tipo) {
    var id = '';
    await Plantillas.guardar(App.E.gestor, function (actual) {
      var hay = actual.lista.filter(function (p) {
        return n(p.tipo) === n(tipo.tipo) && n(p.nombre) === n(NOMBRE_PLANTILLA);
      })[0];
      if (hay) { id = hay.id; return actual; }
      id = Plantillas.idNuevo();
      actual.lista.push({ id: id, tipo: tipo.tipo, categoria: tipo.categoria || 'ALUMNADO', nombre: NOMBRE_PLANTILLA,
        texto: TEXTO_PLANTILLA, adjuntar: tipoDocumentoNotificacion() });
      return actual;
    });
    return id;
  }

  /* La pasada entera. `forzar`: aunque la marca ya esté puesta. Devuelve el resumen, o null si no ha corrido. */
  async function pasada(opciones) {
    var forzar = !!(opciones && opciones.forzar);
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!window.Gestor || !Gestor.carpetaGestor() || !App.E.gestor) return null;
    corriendo = true;
    try {
      var biblioteca = await HitosBiblioteca.leer();
      if (!forzar && biblioteca.informarAlTutor >= VERSION) return null;
      var resumen = { tipos: 0, titulos: 0, plantillas: 0, tareas: 0, asuntos: 0, tutoria: 0, modelos: 0 };

      var enDisco = null;
      try { enDisco = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { enDisco = null; }
      enDisco = (enDisco && typeof enDisco === 'object') ? enDisco : {};
      var cambiados = {};
      var renombrados = [];   /* { tipo, paso } */

      /* 1 a 4: el tipo de las sanciones y su hito. */
      var tipos = (App.E.tipos || []).filter(esTipoDeSancion);
      for (var i = 0; i < tipos.length; i++) {
        var pasos = enDisco[tipos[i].tipo];
        var paso = Array.isArray(pasos) ? buscarPaso(pasos) : null;
        if (!paso) continue;
        resumen.tipos++;
        var antes = Plantillas.enMemoria ? ((Plantillas.enMemoria() || {}).lista || []).length : 0;
        var idPlantilla = await asegurarPlantilla(tipos[i]);
        if (Plantillas.enMemoria && ((Plantillas.enMemoria() || {}).lista || []).length > antes) resumen.plantillas++;
        var c = completarPaso(paso, idPlantilla, function () { return U.nuevoId('g'); });
        if (c.titulo) { resumen.titulos++; renombrados.push({ tipo: tipos[i].tipo, paso: paso }); }
        if (c.tarea) resumen.tareas++;
        if (c.titulo || c.tarea) cambiados[tipos[i].tipo] = true;
      }

      /* 6: en todo el centro, la tutoría de las tareas de comunicar. */
      Object.keys(enDisco).forEach(function (tipo) {
        var k = tutoriaEnTareas(enDisco[tipo]);
        if (k) { resumen.tutoria += k; cambiados[tipo] = true; }
      });
      var tiposCambiados = Object.keys(cambiados);
      if (tiposCambiados.length) {
        await Copias.guardar(App.E.gestor, 'guias.json', enDisco);
        var ultimo = tiposCambiados[tiposCambiados.length - 1];
        await GuiasDelCentro.guardarPasos(ultimo, enDisco[ultimo]);
      }
      await HitosBiblioteca.cambiar(function (d) {
        resumen.modelos = tutoriaEnTareas(d.modelos);
        d.informarAlTutor = VERSION;
        return d;
      });

      /* 5: los asuntos abiertos, por la puerta de «Hito ▾» → «Cambiar» → «A la guía de <tipo>». */
      for (var j = 0; j < renombrados.length && window.HitosDesdeElAsunto && HitosDesdeElAsunto.propagarCambio; j++) {
        var p = renombrados[j].paso;
        var r = await HitosDesdeElAsunto.propagarCambio(renombrados[j].tipo, p.id,
          { titulo: TITULO_NUEVO, soloTitulo: true }, '', '');
        resumen.asuntos += r.tocados;
      }
      return resumen;
    } finally {
      corriendo = false;
    }
  }

  /* Al entrar: en segundo plano, nunca con un guardado en marcha; si falla, solo ámbar. */
  var yaMirado = false;
  function alEntrar() {
    if (yaMirado || !window.App || !App.E || !App.E.gestor || !window.Gestor || !Gestor.carpetaGestor()) return;
    yaMirado = true;
    var intentos = 0;
    (function turno() {
      setTimeout(async function () {
        if (window.ColaGuardado && ColaGuardado.hayGuardado() && ++intentos < 10) return turno();
        if (window.Demo && Demo.montando) return;   /* la copia de pruebas hace su propia pasada al acabar de montar */
        try { await pasada(); }
        catch (e) { U.accesorio('No he podido poner «Informar al tutor/a» en la guía', e); }
      }, 4000);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    VERSION: VERSION, TITULO_NUEVO: TITULO_NUEVO, NOMBRE_PLANTILLA: NOMBRE_PLANTILLA, TEXTO_PLANTILLA: TEXTO_PLANTILLA, pasada: pasada,
    esTipoDeSancion: esTipoDeSancion, buscarPaso: buscarPaso, completarPaso: completarPaso,
    hablaDeLaTutoria: hablaDeLaTutoria, tutoriaEnTareas: tutoriaEnTareas,
    _alEntrar: function () { yaMirado = false; alEntrar(); }
  };
})();
window.InformarAlTutor = InformarAlTutor;
