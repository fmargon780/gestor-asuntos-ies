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
     - Enviado: la ficha del documento trae `enviado` (fila 705: lo apunta la app cuando el correo sale de verdad, o «Marcar enviado»).
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

  /* Función pura. ¿La vía de envío del recorrido es el correo electrónico? (fila 705: abre el correo; las demás se marcan a mano) */
  function viaEsCorreo(via) {
    var d = window.Sitios && Sitios.datos ? Sitios.datos() : null, hallada = null;
    ((d && d.sitios) || []).forEach(function (s) { if (norm(s.nombre) === norm(via)) hallada = s; });
    return hallada ? hallada.id === 'st-correo' : norm(via) === 'correo electronico';
  }

  /* El estado de la tarea de papel: { pasos: [{ k, t, hecho, aMano, quien, cuando }], toca: índice del que toca o -1, todos }. */
  function estado(a, g) {
    var rec = recorridoDe(g), est = g.papelDoc || {}, manual = est.manual || {}, doc = docDe(a, est.numero);
    var enFirma = !!(g.espera && g.espera.paso === 'firmado');   /* fila 704: puesto a la firma, a la espera del PDF firmado */
    var pasos = RecorridoTipo.pasosDe(rec).map(function (p) {
      var prueba = false;
      if (p.k === 'generado' || p.k === 'recibido') prueba = !!est.numero;
      else if (p.k === 'firmado') prueba = !!doc && (Number(doc.firmas) || 0) >= firmasNecesarias(rec, est);
      else if (p.k === 'registrado') prueba = !!doc && (doc.registros || []).length > 0;
      else if (p.k === 'enviado') prueba = !!doc && (!!doc.enviado || (!rec.entra && RecorridoTipo.viaEsVentanilla(rec.via) && (doc.registros || []).length > 0));   /* filas 705 y 782: por la Ventanilla, el registro de salida ya es el envío */
      var m = manual[p.k];
      var texto = p.t;
      if (!(prueba || m) && p.k === 'firmado' && enFirma) texto = 'A la firma';
      if (!(prueba || m) && p.k === 'registrado' && est.pideSello) texto = 'Falta el sellado';
      var env = (p.k === 'enviado' && prueba && doc.enviado) || null;   /* fila 705: lo marcado con «Marcar enviado» también es «a mano» */
      if (env) return { k: p.k, t: texto, hecho: true, aMano: !!env.aMano, quien: env.quien || '', cuando: env.cuando || '' };
      return { k: p.k, t: texto, hecho: prueba || !!m, aMano: !prueba && !!m, quien: (m && m.quien) || '', cuando: (m && m.cuando) || '' };
    });
    var toca = -1;
    pasos.forEach(function (p, i) { if (toca === -1 && !p.hecho) toca = i; });
    var envio = rec.envia ? { via: rec.via, aquien: rec.aquien, correo: viaEsCorreo(rec.via) } : null;   /* fila 705 */
    return { pasos: pasos, toca: toca, todos: toca === -1, enFirma: enFirma, pideSello: !!est.pideSello, envio: envio };
  }

  /* El botón del paso que toca (en esta fila, solo los de generar y añadir): { k, texto } o null. */
  function botonDe(est) {
    var p = est.toca === -1 ? null : est.pasos[est.toca];
    if (!p) return null;
    if (p.k === 'generado') return { k: 'generar', texto: 'Generar documento' };
    if (p.k === 'recibido') return { k: 'anadir', texto: 'Añadir documento' };
    if (p.k === 'firmado' && !est.enFirma) return { k: 'firmar', texto: 'Poner a la firma' };   /* fila 704 */
    if (p.k === 'registrado' && !est.pideSello) return { k: 'registrar', texto: 'Registrar' };
    if (p.k === 'enviado' && est.envio) return est.envio.correo ? { k: 'enviarcorreo', texto: 'Enviar correo' } : { k: 'marcarenviado', texto: 'Marcar enviado' };   /* fila 705 */
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
      if (datos.quienFirma) p.quienFirma = String(datos.quienFirma); else delete p.quienFirma;
    });
  }

  /* «Quitar el documento»: la tarea lo suelta, sin borrarlo; no vuelve a unirse solo. */
  async function quitarDocumento(a, h, g) {
    var numero = (g.papelDoc && g.papelDoc.numero) || '';
    await editar(a, h, function (hito) {
      var p = papelDocDe(hito, g.id);
      if (numero) p.soltados = (p.soltados || []).concat([numero]);
      delete p.numero; delete p.nombre; delete p.firmas; delete p.quienFirma; delete p.pideSello;
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
      if (p.k === 'firmado') delete (hito.guionHecho[g.id] || {}).espera;   /* fila 704: marcado a mano, deja de esperar la firma */
    });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Paso «' + p.t + '» marcado a mano: ' + g.texto);
  }

  /* ---------- fila 704: poner a la firma y registrar ---------- */

  /* Quién firma, escrito para la espera: lo que dijo la plantilla o, si no, el recorrido del tipo. */
  function quienFirma(g) {
    var est = g.papelDoc || {};
    if (est.quienFirma) return est.quienFirma;
    var f = recorridoDe(g).firma;
    return /visto bueno/i.test(f) ? f.replace(/^(.*?),\s*con visto bueno de\s*/i, '$1 y ') : (f === 'Nadie' ? 'Dirección' : f);
  }

  /* Hoy más los días hábiles de Ajustes (uno para todo el centro; nace en 1), con los festivos y días no lectivos. */
  function diaPropuesto() {
    var d = window.Hitos && Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    var aj = (d && d.ajustes) || {};
    return Plazos.sumarPlazo(U.hoyIso(), aj.diasFirma || 1, 'habiles', aj.festivos, aj.noLectivos);
  }

  /* «Poner a la firma»: la tarea queda esperando a quien firma, con el día propuesto. */
  async function ponerAFirma(a, h, g) {
    var nombre = quienFirma(g), dia = diaPropuesto();
    await editar(a, h, function (hito) {
      hito.guionHecho = hito.guionHecho || {};
      var e = hito.guionHecho[g.id] = hito.guionHecho[g.id] || {};
      e.espera = { quien: 'firma', nombre: nombre, paso: 'firmado', desde: U.hoyIso(), volver: dia };
    });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Documento puesto a la firma de ' + nombre + ': ' + g.texto);
    if (window.TareaEspera) await TareaEspera.avisar();
  }

  /* «Registrar»: la tarea queda con «Falta el sellado» hasta que llegue el PDF sellado. */
  async function pedirSello(a, h, g) {
    await editar(a, h, function (hito) { papelDocDe(hito, g.id).pideSello = true; });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Documento llevado a registrar; falta el sellado: ' + g.texto);
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

  /* Llegado el PDF firmado, la tarea deja de esperar. Devuelve cuántas ha cambiado. */
  async function acabarEsperasDeFirma(a, h) {
    var n = 0;
    var lista = Hitos.guionDe(a, h).filter(function (g) { return g.papel && g.espera && g.espera.paso === 'firmado'; });
    for (var i = 0; i < lista.length; i++) {
      var st = estado(a, lista[i]).pasos.filter(function (p) { return p.k === 'firmado'; })[0];
      if (!st || !st.hecho) continue;
      await editar(a, h, function (hito) { var e = (hito.guionHecho || {})[lista[i].id]; if (e) delete e.espera; });
      n++;
    }
    return n;
  }

  /* Pone la tarea hecha cuando todos sus pasos lo están (y sin hacer cuando deja de estarlo). Devuelve cuántas ha cambiado. */
  async function ponerHechas(a, h) {
    var n = 0;
    var lista = Hitos.guionDe(a, h).filter(function (g) { return g.papel && !g.noaplica; });
    for (var i = 0; i < lista.length; i++) {
      var g = lista[i], est = estado(a, g), todos = est.todos;
      if (todos && !g.hecho) {
        await Hitos.marcarGuion(a.nombre, h.id, g.id, { hecho: true }); n++;
        /* Fila 782: enviado solo, por la Ventanilla, al llegar el registro de salida: la tarea que espera lo que vuelve salta igual que con «Marcar enviado». */
        if (est.envio && RecorridoTipo.viaEsVentanilla(est.envio.via) && window.PapelEsperaRecibir && est.pasos.some(function (p) { return p.k === 'enviado' && p.hecho && !p.aMano && !p.quien; })) {
          try { await PapelEsperaRecibir.alEnviar(a); } catch (e) { if (U.accesorio) U.accesorio('El papel está enviado, pero no he podido poner en espera la tarea de recibirlo', e); }
        }
      }
      else if (!todos && g.hecho) { await Hitos.deshacerGuion(a.nombre, h.id, g.id); n++; }
    }
    return n;
  }

  /* Fila 783: una tarea «Copiar a otra carpeta» que sigue a una tarea de papel ya registrada copia el papel (una sola vez: queda anotado en `copia`). */
  async function copiarLoRegistrado(a, h) {
    if (!window.TareaCopiar) return 0;
    var lista = Hitos.guionDe(a, h), n = 0;
    for (var i = 1; i < lista.length; i++) {
      var g = lista[i], previa = lista[i - 1];
      if (g.accion !== 'copiar' || g.hecho || g.noaplica || g.copia || !previa.papel || !previa.papelDoc || !previa.papelDoc.numero) continue;
      if (!estado(a, previa).pasos.some(function (p) { return p.k === 'registrado' && p.hecho; })) continue;
      await TareaCopiar.intentar(a, h, g, previa.papelDoc.numero, false);
      n++;
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
      if (await acabarEsperasDeFirma(a, de)) { cambio = true; de = Hitos.buscar(await Hitos.hitosDe(a.nombre), h.id) || de; }
      if (await ponerHechas(a, de)) cambio = true;
      de = Hitos.buscar(await Hitos.hitosDe(a.nombre), h.id) || de;
      if (await copiarLoRegistrado(a, de)) cambio = true;   /* fila 783 */
      return cambio;
    } catch (e) {
      if (U.accesorio) U.accesorio('No he podido poner al día las tareas de papel', e);
      return false;
    } finally { enMarcha = false; }
  }

  return { estado: estado, botonDe: botonDe, viaEsCorreo: viaEsCorreo, fichaDe: fichaDe, firmasDePlantilla: firmasDePlantilla, firmasNecesarias: firmasNecesarias, anadir: anadir, asignar: asignar,
           quitarDocumento: quitarDocumento, ponerAFirma: ponerAFirma, pedirSello: pedirSello, diaPropuesto: diaPropuesto, quienFirma: quienFirma, marcarAMano: marcarAMano, sincronizar: sincronizar, documentosDeTipo: documentosDeTipo };
})();
window.TareaPapel = TareaPapel;
