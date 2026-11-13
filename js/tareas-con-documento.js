/* ============================================================
   tareas-con-documento.js — cada tarea de generar o registrar lleva colgado
   su documento (fila 522, 5-nov-2026, docs/522-TAREAS-CON-DOCUMENTO.md; tema
   516). Aquí, el dato y sus reglas; lo que se pinta está en
   js/tareas-con-documento-vista.js.

   El documento de cada tarea se guarda en el hito de cada asunto, nunca en la
   guía: `h.guionDocumento = { <idTarea>: { doc, version? } }`.
     - `doc`: el documento con el que trabaja la tarea (su nombre; se compara
       por la «clave de gemelo» del nombre, así que el Word y su PDF, o el
       original y el sellado, son el mismo documento).
     - `version`: el nombre que tiene en «_Previas» la versión con la que quedó
       el documento cuando la tarea ya estaba hecha (… SIN SELLAR.pdf). Se
       apunta en el momento en que el documento pasa a «_Previas».

   Quien llama:
     - generar: TareasConDocumento.alGenerar (js/plantillas-documento.js) deja
       el documento en la tarea de generar y en las siguientes del hito que
       trabajan sobre él;
     - registrar: Hitos.marcarGuionPorAccion(…, documento) elige la tarea de
       ese documento (TareasConDocumento.elegirPaso);
     - al pasar un documento a «_Previas» (js/registro-sellado.js,
       js/ruta-copia.js): TareasConDocumento.versionConservada.
   ============================================================ */
window.TareasConDocumento = (function () {

  /* Fila 638: también «comunicar» (el documento que se envía) y, aparte, «Añadir documento». */
  var CON_DOCUMENTO = { generar: true, registrar: true, firmar: true, comunicar: true };

  /* ¿Esta línea del guion lleva un documento colgado que viene de generar (el encadenado de abajo)? */
  function conDocumento(g) { return !!g && !g.pregunta && !!CON_DOCUMENTO[g.accion]; }

  /* ¿Se enseña su documento colgado? Las anteriores y «Añadir documento», cuyo documento es el que se añade (fila 638). */
  function colgable(g) { return conDocumento(g) || (!!g && !g.pregunta && g.accion === 'anadir'); }

  function claveDe(nombre) {
    var n = String(nombre || '');
    return (window.HitoMesaDocumentos && HitoMesaDocumentos.claveGemelo) ? HitoMesaDocumentos.claveGemelo(n) : n.toLowerCase();
  }
  function mismo(a, b) { return !!a && !!b && (a === b || claveDe(a) === claveDe(b)); }

  /* Lo que la tarea `idTarea` guarda de su documento, o null. */
  function de(h, idTarea) {
    var m = h && h.guionDocumento;
    return (m && m[idTarea]) || null;
  }

  function recorrer(lista, hacer) {
    (lista || []).forEach(function (h) {
      hacer(h);
      (h.opciones || []).forEach(function (o) { recorrer(o.hitos, hacer); });
    });
  }

  function poner(h, idTarea, valor) {
    var m = Object.assign({}, h.guionDocumento || {});
    if (valor) m[idTarea] = valor; else delete m[idTarea];
    if (Object.keys(m).length) h.guionDocumento = m; else delete h.guionDocumento;
  }

  /* La tarea trabaja con ese documento (elegido a mano, o puesto por la aplicación). Sin documento, lo quita. */
  function asignar(clave, idHito, idTarea, doc) {
    return Hitos.cambiar(function (d) {
      var e = d.porAsunto[clave];
      var h = e && Hitos.buscar(e.hitos, idHito);
      if (h) poner(h, idTarea, doc ? { doc: String(doc) } : null);
      return d;
    });
  }

  /* El documento colgado de la tarea `desde` pasa a colgar de `hasta` (otro id de la misma tarea); con `hasta` vacío, se quita. */
  function mover(h, desde, hasta) {
    var e = de(h, desde);
    if (!e) return;
    poner(h, desde, null);
    if (hasta) poner(h, hasta, e);
  }

  /* De las tareas pendientes con esa acción, la que toca marcar. Con `documento` (registrar o firmar), la que trabaja
     con ese documento; si ninguna lo tiene, la primera que aún no tiene documento (las de asuntos de antes y las de
     «Elegir documento» siguen como siempre). Una con el documento de otro no se marca. */
  function elegirPaso(h, candidatos, accion, documento) {
    if (!documento || (accion !== 'registrar' && accion !== 'firmar')) return candidatos[0] || null;
    var suyo = candidatos.filter(function (c) { var e = de(h, c.id); return e && mismo(e.doc, documento); })[0];
    if (suyo) return suyo;
    return candidatos.filter(function (c) { return !de(h, c.id); })[0] || null;
  }

  /* Tras marcar una tarea con su documento: si no lo tenía, lo guarda. */
  async function alMarcar(a, h, paso, documento) {
    if (!documento || !paso || !conDocumento(paso) || de(h, paso.id)) return;
    try { await asignar(a.nombre, h.id, paso.id, documento); }
    catch (e) { /* accesorio: la tarea ya está marcada */ }
  }

  /* Se ha generado `nombre` desde la tarea `idTarea`: lo lleva esa tarea y las siguientes del hito que trabajan
     sobre él (registrar o firmar, sin documento y sin hacer), hasta la siguiente tarea de generar. */
  async function alGenerar(asunto, hito, idTarea, nombre) {
    if (!asunto || !hito || !idTarea || !nombre) return;
    try {
      var h = Hitos.buscar(await Hitos.hitosDe(asunto.nombre), hito.id);
      if (!h) return;
      var guion = Hitos.guionDe(asunto, h);
      var i = guion.map(function (g) { return g.id; }).indexOf(idTarea);
      if (i === -1) return;
      var ids = [idTarea];
      for (var k = i + 1; k < guion.length; k++) {
        var g = guion[k];
        if (g.accion === 'generar') break;
        if (conDocumento(g) && !g.hecho && !g.noaplica && !de(h, g.id)) ids.push(g.id);
      }
      await Hitos.cambiar(function (d) {
        var e = d.porAsunto[asunto.nombre];
        var x = e && Hitos.buscar(e.hitos, hito.id);
        if (x) ids.forEach(function (id) { poner(x, id, { doc: String(nombre) }); });
        return d;
      });
    } catch (e2) {
      if (window.U && U.accesorio) U.accesorio('Documento generado, pero no he podido colgarlo de las tareas', e2);
    }
  }

  /* El documento `original` acaba de dejar su versión `version` en «_Previas» (y, si cambió de nombre, ahora es `nuevo`):
     la última tarea hecha que trabajaba con él guarda esa versión; las demás siguen con el documento actual. */
  async function versionConservada(asunto, original, version, nuevo) {
    if (!asunto || !original || !window.Hitos) return;
    try {
      await Hitos.cambiar(function (d) {
        var e = d.porAsunto && d.porAsunto[asunto.nombre];
        if (!e) return d;
        recorrer(e.hitos, function (h) {
          var m = h.guionDocumento;
          if (!m) return;
          var ids = Object.keys(m).filter(function (id) { return mismo(m[id].doc, original) && !m[id].version; });
          if (!ids.length) return;
          var orden = Hitos.guionDe(asunto, h).map(function (g) { return g.id; });
          var hechas = ids.filter(function (id) { var s = h.guionHecho && h.guionHecho[id]; return s && s.hecho; });
          if (version && hechas.length) {
            var ultima = hechas.sort(function (x, y) { return orden.indexOf(x) - orden.indexOf(y); }).pop();
            m[ultima].version = version;
          }
          if (nuevo) ids.forEach(function (id) { if (!m[id].version) m[id].doc = nuevo; });
        });
        return d;
      });
    } catch (err) {
      if (window.U && U.accesorio) U.accesorio('Documento guardado, pero no he podido apuntar la versión anterior en las tareas', err);
    }
  }

  /* Un documento cambió de nombre (js/documento-renombrar.js). Puro, sobre un hito. */
  function alRenombrar(h, viejo, nuevo) {
    var m = h && h.guionDocumento;
    if (!m) return;
    Object.keys(m).forEach(function (id) {
      if (m[id].doc === viejo) m[id].doc = nuevo;
      if (m[id].version === viejo) m[id].version = nuevo;
    });
  }

  return { conDocumento: conDocumento, colgable: colgable, mismo: mismo, de: de, asignar: asignar, elegirPaso: elegirPaso, alMarcar: alMarcar,
           alGenerar: alGenerar, versionConservada: versionConservada, alRenombrar: alRenombrar, mover: mover, claveDe: claveDe, recorrer: recorrer };
})();
