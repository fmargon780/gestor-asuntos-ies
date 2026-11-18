/* ============================================================
   tarea-papel.js — la tarea de papel: una línea que sigue al documento
   (18-nov-2026, fila 703, docs/703-TAREA-DE-PAPEL.md; pantalla de prueba docs/pantallas/692.html;
   diseño en docs/notas-diseno/692.md y 692-documentos.md).

   Solo para un asunto «lista de tareas» (js/asunto-sin-hitos.js). Una tarea puede llevar un papel: un tipo de
   documento (`papel` en la tarea, copiado de la guía o elegido al añadirla). No tiene casilla: sus pasos salen del
   recorrido de su tipo (js/recorrido-tipo.js, fila 698) y se marcan solos con su prueba:
     - Generado / Recibido: la tarea ya tiene su documento;
     - Firmado: la ficha del documento trae las firmas que hacen falta (`firmas`, fila 515);
     - Registrado: la ficha trae un registro (el sello o el listado de Séneca, filas 573 y 239);
     - Enviado: solo a mano (fila 705).
   Con todos los pasos hechos, la tarea queda hecha.

   Qué se guarda, en `guionHecho[<id de la tarea>].papelDoc` del hito oculto: { numero, nombre, firmas, manual, soltados }
     - `numero`/`nombre`: el documento de la tarea (su número D26-…, que es la clave de `ficha.documentos`);
     - `firmas`: 1 o 2 si la plantilla con la que se generó dice quién firma (manda sobre la firma del tipo);
     - `manual`: { <paso>: { quien, cuando } }, lo marcado con «Marcar el paso a mano»;
     - `soltados`: números que se quitaron de la tarea («Quitar el documento»): no vuelven a unirse solos.
   El estado nunca se guarda: se saca de lo anterior y de la ficha del documento. Los pasos que llegan por otro camino
   (la cabecera, la bandeja, la carpeta) se unen solos en `sincronizar`. Lo que se pinta está en js/tarea-papel-pintar.js.
   ============================================================ */
var TareaPapel = (function () {

  var enMarcha = false;

  function norm(t) { return U.normalizar(String(t || '')); }
  function quien() { return (window.App && App.E && App.E.usuario) || ''; }

  /* La ficha del asunto con lo último guardado (la de `a` puede ser de antes). */
  function fichaDe(a) {
    var r = window.App && App.E && App.E.registro;
    return (r && r.asuntos && a && r.asuntos[a.nombre]) || (a && a.ficha) || null;
  }
  function docDe(a, numero) { return numero && window.DocumentosDatos ? DocumentosDatos.de(fichaDe(a), numero) : null; }

  /* Función pura. Cuántas firmas piden: lo que dice la plantilla con la que se generó; si no, lo del tipo. */
  function firmasNecesarias(rec, est) {
    if (est && Number(est.firmas) > 0) return Number(est.firmas);
    return /visto bueno/i.test(rec.firma || '') ? 2 : 1;
  }

  /* Función pura. Cuántas firmas dice una plantilla de documento (0 si no dice nada: vale la del tipo). */
  function firmasDePlantilla(p) {
    if (!p || !String(p.firmante || '').trim()) return 0;
    return String(p.vistoBueno || '').trim() ? 2 : 1;
  }

  /* El recorrido que vale para esta tarea: el del tipo, salvo que la plantilla diga que alguien firma y el tipo no. */
  function recorridoDe(g) {
    var rec = RecorridoTipo.de(g.papel), est = g.papelDoc || {};
    if (!rec.entra && rec.firma === 'Nadie' && Number(est.firmas) > 0) rec = Object.assign({}, rec, { firma: 'Dirección' });
    return rec;
  }

  /* El estado de la tarea de papel: { pasos: [{ k, t, hecho, aMano, quien, cuando }], toca: índice del que toca o -1, todos }. */
  function estado(a, g) {
    var rec = recorridoDe(g), est = g.papelDoc || {}, manual = est.manual || {}, doc = docDe(a, est.numero);
    var pasos = RecorridoTipo.pasosDe(rec).map(function (p) {
      var prueba = false;
      if (p.k === 'generado' || p.k === 'recibido') prueba = !!est.numero;
      else if (p.k === 'firmado') prueba = !!doc && (Number(doc.firmas) || 0) >= firmasNecesarias(rec, est);
      else if (p.k === 'registrado') prueba = !!doc && (doc.registros || []).length > 0;
      var m = manual[p.k];
      return { k: p.k, t: p.t, hecho: prueba || !!m, aMano: !prueba && !!m, quien: (m && m.quien) || '', cuando: (m && m.cuando) || '' };
    });
    var toca = -1;
    pasos.forEach(function (p, i) { if (toca === -1 && !p.hecho) toca = i; });
    return { pasos: pasos, toca: toca, todos: toca === -1 };
  }

  /* El botón del paso que toca (en esta fila, solo los de generar y añadir): { k, texto } o null. */
  function botonDe(est) {
    var p = est.toca === -1 ? null : est.pasos[est.toca];
    if (!p) return null;
    if (p.k === 'generado') return { k: 'generar', texto: 'Generar documento' };
    if (p.k === 'recibido') return { k: 'anadir', texto: 'Añadir documento' };
    return null;
  }

  function soloLectura() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function editar(a, h, hacer) { return Hitos._guionInterno.editarHito(a.nombre, h.id, hacer); }
  function papelDocDe(hito, id) {
    hito.guionHecho = hito.guionHecho || {};
    var e = hito.guionHecho[id] = hito.guionHecho[id] || {};
    e.papelDoc = e.papelDoc || {};
    return e.papelDoc;
  }

  /* Añade a la lista del asunto una tarea de papel (o una sin papel, si `papel` va vacío). */
  function anadir(a, h, texto, papel) {
    texto = String(texto || '').trim();
    if (!texto) return Promise.resolve(null);
    return editar(a, h, function (hito) {
      var g = { id: U.nuevoId('gp'), texto: texto };
      if (papel) g.papel = papel;
      hito.guionPropio = (hito.guionPropio || []).concat([g]);
    });
  }

  /* El documento `datos` ({ numero, nombre, firmas }) es el de la tarea. */
  function asignar(a, h, g, datos) {
    return editar(a, h, function (hito) {
      var p = papelDocDe(hito, g.id);
      p.numero = String(datos.numero || '');
      p.nombre = String(datos.nombre || '');
      if (Number(datos.firmas) > 0) p.firmas = Number(datos.firmas); else delete p.firmas;
    });
  }

  /* «Quitar el documento»: la tarea lo suelta, sin borrarlo; no vuelve a unirse solo. */
  async function quitarDocumento(a, h, g) {
    var numero = (g.papelDoc && g.papelDoc.numero) || '';
    await editar(a, h, function (hito) {
      var p = papelDocDe(hito, g.id);
      if (numero) p.soltados = (p.soltados || []).concat([numero]);
      delete p.numero; delete p.nombre; delete p.firmas;
      if (p.manual) { delete p.manual.generado; delete p.manual.recibido; }
    });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Documento quitado de la tarea: ' + g.texto);
  }

  /* «Marcar el paso a mano»: marca el paso que toca, con quién y qué día. */
  async function marcarAMano(a, h, g) {
    var est = estado(a, g), p = est.toca === -1 ? null : est.pasos[est.toca];
    if (!p) return;
    await editar(a, h, function (hito) {
      var d = papelDocDe(hito, g.id);
      d.manual = d.manual || {};
      d.manual[p.k] = { quien: quien(), cuando: U.ahora() };
    });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Paso «' + p.t + '» marcado a mano: ' + g.texto);
  }

  /* Los números de documento del asunto cuyo tipo es `papel`. */
  function documentosDeTipo(a, papel) {
    var docs = (fichaDe(a) || {}).documentos || {};
    return Object.keys(docs).filter(function (n) { return docs[n] && norm(docs[n].tipo) === norm(papel); });
  }

  /* Une solos los documentos que han llegado por otro camino: con una sola tarea de ese tipo sin documento (o con la
     que se ha pulsado, `preferida`); con varias, se quedan sin tarea. Devuelve cuántos ha unido. */
  async function unirSueltos(a, h, preferida) {
    var lista = Hitos.guionDe(a, h).filter(function (g) { return g.papel && !g.noaplica; });
    var cogidos = {};
    lista.forEach(function (g) {
      var p = g.papelDoc || {};
      if (p.numero) cogidos[p.numero] = true;
      (p.soltados || []).forEach(function (n) { cogidos[n] = true; });
    });
    var cambios = [];
    var tipos = {};
    lista.forEach(function (g) { tipos[norm(g.papel)] = g.papel; });
    Object.keys(tipos).forEach(function (t) {
      var sinDoc = lista.filter(function (g) { return norm(g.papel) === t && !(g.papelDoc && g.papelDoc.numero); });
      documentosDeTipo(a, tipos[t]).filter(function (n) { return !cogidos[n]; }).forEach(function (n) {
        var suya = sinDoc.length === 1 ? sinDoc[0] : sinDoc.filter(function (g) { return g.id === preferida; })[0];
        if (!suya) return;
        sinDoc = sinDoc.filter(function (g) { return g !== suya; });
        cambios.push({ g: suya, numero: n });
      });
    });
    for (var i = 0; i < cambios.length; i++) await asignar(a, h, cambios[i].g, { numero: cambios[i].numero, nombre: '' });
    return cambios.length;
  }

  /* Pone la tarea hecha cuando todos sus pasos lo están (y sin hacer cuando deja de estarlo). Devuelve cuántas ha cambiado. */
  async function ponerHechas(a, h) {
    var n = 0;
    var lista = Hitos.guionDe(a, h).filter(function (g) { return g.papel && !g.noaplica; });
    for (var i = 0; i < lista.length; i++) {
      var g = lista[i], todos = estado(a, g).todos;
      if (todos && !g.hecho) { await Hitos.marcarGuion(a.nombre, h.id, g.id, { hecho: true }); n++; }
      else if (!todos && g.hecho) { await Hitos.deshacerGuion(a.nombre, h.id, g.id); n++; }
    }
    return n;
  }

  /* Al pintar y al cambiar algo: une los documentos sueltos y pone hechas las tareas completas. Solo escribe si hace falta.
     Devuelve true si ha cambiado algo (quien llama repinta). */
  async function sincronizar(a, h, preferida) {
    if (enMarcha || soloLectura() || !a || !h) return false;
    enMarcha = true;
    try {
      var cambio = false;
      var fresco = Hitos.buscar(await Hitos.hitosDe(a.nombre), h.id) || h;
      if (!Hitos.guionDe(a, fresco).some(function (g) { return g.papel; })) return false;
      if (await unirSueltos(a, fresco, preferida)) cambio = true;
      var de = Hitos.buscar(await Hitos.hitosDe(a.nombre), h.id) || fresco;
      if (await ponerHechas(a, de)) cambio = true;
      return cambio;
    } catch (e) {
      if (U.accesorio) U.accesorio('No he podido poner al día las tareas de papel', e);
      return false;
    } finally { enMarcha = false; }
  }

  return { estado: estado, botonDe: botonDe, firmasDePlantilla: firmasDePlantilla, firmasNecesarias: firmasNecesarias, anadir: anadir, asignar: asignar,
           quitarDocumento: quitarDocumento, marcarAMano: marcarAMano, sincronizar: sincronizar, documentosDeTipo: documentosDeTipo };
})();
window.TareaPapel = TareaPapel;
