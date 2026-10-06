/* ============================================================
   convertir-en-plantilla.js — «Convertir en plantilla», en el menú ⋮ de
   un documento de un asunto abierto (fila 280,
   docs/CONVERTIR-EN-PLANTILLA.md).

   Aquí vive todo menos la pantalla (js/convertir-en-plantilla-pantalla.js):
     - cuándo sale la entrada del menú y si está apagada (`estados`,
       `botonDeMenu`, `opcionDeMesa`);
     - de qué fichero se parte: el .docx, o el Word gemelo de un PDF
       (la misma clave de gemelos de js/versiones-previas.js), en la
       carpeta del asunto o en sus versiones previas. Se lee UNA vez y es
       «el original»: todo lo demás trabaja sobre copias en memoria; en la
       carpeta del asunto no se escribe nada, nunca;
     - el estado: las líneas propuestas (js/convertir-en-plantilla-
       propuestas.js), lo marcado a mano, los datos de la plantilla;
     - la copia de trabajo (js/docx-sustituir.js, siempre desde el
       original), la plantilla rellena con este mismo asunto y el guardado.
   ============================================================ */
var ConvertirEnPlantilla = (function () {

  var TEXTO = 'Convertir en plantilla';
  var MOTIVO_PDF = 'No encuentro el Word de este PDF.';
  var MOTIVO_VIEJO = 'Solo con Word moderno (.docx) o PDF. Ábrelo en Word y guárdalo como .docx.';
  var cache = {};   /* asunto.nombre -> { carpeta: [{ nombre, handle }], previas: [...] } */
  var estado = null;

  function sin(t) { return U.normalizar(String(t || '')); }
  function extension(n) { var m = /\.([A-Za-z0-9]{1,8})$/.exec(String(n || '')); return m ? m[1].toLowerCase() : ''; }

  function esAbierto(a) {
    return !!(a && App.E && (App.E.listaAbiertos || []).some(function (x) { return x === a || x.nombre === a.nombre; }));
  }

  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- cuándo sale la entrada ---------- */

  async function listado(a) {
    var carpeta = await Carpetas.ficheros(a.handle);
    var previas = [];
    try { previas = window.VersionesPrevias ? await VersionesPrevias.listar(a.handle) : []; } catch (e) { previas = []; }
    cache[a.nombre] = { carpeta: carpeta, previas: previas };
    return cache[a.nombre];
  }

  /* El Word gemelo de un PDF: un .docx con la misma clave, en la carpeta o en versiones previas; el más reciente. */
  async function gemeloDe(nombrePdf, lis) {
    var clave = VersionesPrevias.claveGemelo(nombrePdf), mejor = null, mejorT = -1;
    var candidatos = lis.carpeta.concat(lis.previas).filter(function (f) {
      return extension(f.nombre) === 'docx' && VersionesPrevias.claveGemelo(f.nombre) === clave;
    });
    for (var i = 0; i < candidatos.length; i++) {
      var t = 0;
      try { t = (await candidatos[i].handle.getFile()).lastModified || 0; } catch (e) { t = 0; }
      if (t > mejorT) { mejor = candidatos[i]; mejorT = t; }
    }
    return mejor;
  }

  /* { visible, apagada, motivo } de un documento, con el listado ya leído. `gemelo`: lo encontrado para un PDF. */
  function estadoDe(a, nombre, gemelo) {
    var e = extension(nombre);
    if (!esAbierto(a) || (window.IndiceExpediente && IndiceExpediente.es(nombre))) return { visible: false, apagada: true, motivo: '' };
    var base;
    if (e === 'docx') base = { visible: true, apagada: false, motivo: '' };
    else if (e === 'pdf') base = { visible: true, apagada: !gemelo, motivo: gemelo ? '' : MOTIVO_PDF };
    else if (e === 'doc' || e === 'odt' || e === 'rtf') base = { visible: true, apagada: true, motivo: MOTIVO_VIEJO };
    else return { visible: false, apagada: true, motivo: '' };
    if (soloConsulta()) { base.apagada = true; base.motivo = base.motivo || 'Estás en «solo consultar».'; }
    return base;
  }

  /* Para la ficha: { <nombre>: estado } de los documentos de la carpeta del asunto. */
  async function estados(a) {
    var salida = {};
    if (!esAbierto(a)) return salida;
    var lis = await listado(a);
    for (var i = 0; i < lis.carpeta.length; i++) {
      var n = lis.carpeta[i].nombre;
      var g = extension(n) === 'pdf' ? await gemeloDe(n, lis) : null;
      salida[n] = estadoDe(a, n, g);
    }
    return salida;
  }

  /* El mismo estado, pero sin esperar (la mesa de un hito): con lo último que se leyó de ese asunto. */
  function estadoRapido(a, nombre) {
    var lis = cache[a.nombre];
    if (!lis) { listado(a).catch(function () { /* la próxima vez */ }); return estadoDe(a, nombre, true); }
    if (extension(nombre) !== 'pdf') return estadoDe(a, nombre, true);
    var clave = VersionesPrevias.claveGemelo(nombre);
    var hay = lis.carpeta.concat(lis.previas).some(function (f) { return extension(f.nombre) === 'docx' && VersionesPrevias.claveGemelo(f.nombre) === clave; });
    return estadoDe(a, nombre, hay);
  }

  function botonDeMenu(a, f, est, hito) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = TEXTO;
    b.disabled = !!est.apagada;
    if (est.motivo) b.title = est.motivo;
    b.onclick = function () { abrir({ asunto: a, nombre: f.nombre, hito: hito || null }); };
    return b;
  }

  /* Para FichaMenus (la mesa del hito). */
  function opcionDeMesa(a, nombre, hito) {
    var est = estadoRapido(a, nombre);
    if (!est.visible) return null;
    return { texto: TEXTO, deshabilitado: !!est.apagada, title: est.motivo || '', alPulsar: function () { abrir({ asunto: a, nombre: nombre, hito: hito || null }); } };
  }

  /* ---------- de qué fichero se parte ---------- */

  function fechaDe(nombre, modificado) {
    var m = /^(\d{2})(\d{2})(\d{2})\b/.exec(String(nombre || ''));
    if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return '20' + m[1] + '-' + m[2] + '-' + m[3];
    var d = new Date(modificado || Date.now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* El tipo de documento que diga el nombre («260930 CERTIFICADO D26-0003 …»), si está en la lista del centro. */
  function tipoDeDocumentoDe(nombre) {
    var resto = String(nombre || '').replace(/^\d{6}\s+/, '').replace(/\.[A-Za-z0-9]{1,8}$/, '');
    var k = sin(resto), mejor = '';
    (App.E.tiposDocumento || []).forEach(function (t) {
      var kt = sin(t);
      if (kt && (k === kt || k.indexOf(kt + ' ') === 0) && kt.length > sin(mejor).length) mejor = t;
    });
    return mejor;
  }

  async function leerOriginal(a, nombre) {
    var lis = await listado(a);
    var f = lis.carpeta.concat(lis.previas).filter(function (x) { return x.nombre === nombre; })[0];
    if (!f) throw new Error('No encuentro el documento «' + nombre + '» en la carpeta.');
    var origen = f, usaGemelo = false;
    if (extension(nombre) === 'pdf') {
      origen = await gemeloDe(nombre, lis);
      if (!origen) throw new Error(MOTIVO_PDF);
      usaGemelo = true;
    }
    var fichero = await origen.handle.getFile();
    return { buffer: new Uint8Array(await fichero.arrayBuffer()), usaGemelo: usaGemelo, modificado: fichero.lastModified, nombreWord: origen.nombre };
  }

  async function hitoDelDocumento(a, nombre) {
    if (!window.Hitos) return null;
    try {
      var visibles = Hitos.visibles(await Hitos.hitosDe(a.nombre));
      return visibles.filter(function (h) { return (h.documentos || []).indexOf(nombre) !== -1; })[0] || null;
    } catch (e) { return null; }
  }

  /* Quien ocupaba cada cargo en la fecha del documento. */
  async function cargosEnFecha(iso) {
    if (!window.Cargos) return [];
    var salida = [];
    try {
      var datos = await Cargos.leer();
      Cargos.ordenados(datos).forEach(function (c) {
        var o = (c.ocupantes || []).filter(function (x) { return x.desde && x.desde <= iso && (!x.hasta || iso <= x.hasta); })[0];
        if (o && o.persona) salida.push({ id: c.id, nombre: c.nombre, persona: o.persona, sexo: o.sexo || '', tratamiento: c.tratamiento || '' });
      });
    } catch (e) { /* sin cargos, sin «Quien firma» */ }
    return salida;
  }

  function nombreProp(tipoDoc) {
    var t = String(tipoDoc || '').trim().toLowerCase();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  /* ---------- el estado ---------- */

  function porDefecto(lineas) {
    var activos = {};
    lineas.forEach(function (l) { activos[l.id] = true; });
    return activos;
  }

  async function preparar(op) {
    var a = op.asunto, nombre = op.nombre;
    var orig = await leerOriginal(a, nombre);
    var iso = fechaDe(nombre, orig.modificado);
    var hito = op.hito || await hitoDelDocumento(a, nombre);
    var valores = await Plantillas.valoresDeAsunto(a, { fecha: iso, hito: hito, conLoQueFalta: false });
    var leidos = await DocxSustituir.leerParrafos(orig.buffer);
    var cuerpo = DocxSustituir.parrafosConImagen(await DocxSustituir.xmlDelCuerpo(orig.buffer));
    var tieneMembrete = cuerpo.some(function (p) { return /\{\{\s*MEMBRETE\s*\}\}/i.test(p.texto); });
    var cargos = await cargosEnFecha(iso);
    var prop = ConvertirEnPlantillaPropuestas.proponer({
      cuerpo: cuerpo, pies: leidos.pies, valores: valores, cargos: cargos, tieneMembrete: tieneMembrete,
      centro: { nombre: valores.centro, codigo: valores.codigoCentro }
    });
    var tipo = PlantillasDocumento.tipoDelAsunto(a), categoria = PlantillasDocumento.categoriaDelAsunto(a);
    var tipoDoc = tipoDeDocumentoDe(nombre);
    var firma0 = prop.firma[0], firma1 = prop.firma[1];
    var hitoGuia = hito && hito.origenGuia && buscarPaso(GuiasDelCentro.pasosDe(tipo), hito.origenGuia) ? hito.origenGuia : '';
    estado = {
      asunto: a, nombre: nombre, hito: hito, iso: iso, orig: orig, valores: valores, prop: prop, tieneMembrete: tieneMembrete,
      activos: porDefecto(prop.lineas), manuales: [], membrete: !tieneMembrete, conLogo: true,
      plantilla: { nombre: nombreProp(tipoDoc), categoria: categoria, tipo: tipo, tipoDocumento: tipoDoc, texto: '',
        firmante: firma0 ? firma0.cargo.id : '', vistoBueno: firma1 ? firma1.cargo.id : '', hitoId: hitoGuia },
      cargos: cargos, trabajo: null, tocado: false, cuenta: 0
    };
    estado.inicial = JSON.stringify({ a: estado.activos, p: estado.plantilla, m: estado.membrete, l: estado.conLogo });
    await recalcular();
    return estado;
  }

  /* ---------- la copia de trabajo ---------- */

  function porLargo(a, b) { return b.buscar.length - a.buscar.length; }

  function lineasManualesActivas() { return estado.manuales.filter(function (m) { return estado.activos[m.id]; }); }

  /* Orden fijo: quitar; datos y quien firma (los más largos primero); lo marcado a mano; las formas dobles. */
  function opcionesDeAplicar() {
    var quitarParrafos = [], conHueco = [], dobles = [];
    estado.prop.lineas.forEach(function (l) {
      if (!estado.activos[l.id]) return;
      if (l.grupo === 'quitar') { if (estado.membrete) quitarParrafos.push(l.indice); return; }
      if (l.tambien && !estado.activos[l.tambien]) return;   /* un «D.» sin su nombre no se cambia solo */
      var c = { id: l.id, buscar: l.buscar, poner: l.poner, tambien: l.tambien || '' };
      if (l.grupo === 'genero' && !l.tambien) dobles.push(c); else conHueco.push(c);
    });
    conHueco.sort(porLargo);
    var manuales = lineasManualesActivas().map(function (m) { return { id: m.id, buscar: m.buscar, poner: m.poner }; }).sort(porLargo);
    return {
      cambios: conHueco.concat(manuales, dobles), quitarParrafos: quitarParrafos,
      sinCabecera: estado.membrete, membrete: estado.membrete
    };
  }

  async function recalcular() {
    estado.trabajo = await DocxSustituir.aplicar(estado.orig.buffer, opcionesDeAplicar());
    return estado.trabajo;
  }

  function marcarTocado() {
    estado.tocado = JSON.stringify({ a: estado.activos, p: estado.plantilla, m: estado.membrete, l: estado.conLogo }) !== estado.inicial || estado.manuales.length > 0;
  }

  async function activar(id, valor) {
    estado.activos[id] = !!valor;
    marcarTocado();
    return recalcular();
  }

  async function cambiarMembrete(valor) { estado.membrete = !!valor; marcarTocado(); return recalcular(); }

  /* Lo marcado a mano: `tipo` 'dato' (poner = un hueco), 'cadavez' (poner = {campo:nombre}) o 'quitar'. */
  async function anadirManual(m) {
    estado.cuenta++;
    var linea = Object.assign({ id: 'man' + estado.cuenta, grupo: 'manual' }, m);
    estado.manuales.push(linea);
    estado.activos[linea.id] = true;
    marcarTocado();
    await recalcular();
    return linea;
  }

  /* Un nombre que ya es un hueco del catálogo o un campo del tipo no se crea como «se pregunta cada vez». */
  function nombreDeDatoOcupado(nombre) {
    var k = sin(nombre).replace(/\s+/g, '');
    var enCatalogo = Plantillas.HUECOS.some(function (h) { return sin(h.clave).replace(/\s+/g, '') === k || sin(h.etiqueta).replace(/\s+/g, '') === k; });
    if (enCatalogo) return true;
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[estado.plantilla.tipo]) || [];
    return config.some(function (cfg) {
      try { return sin(Campos.nombreDeCampo(cfg, App.E.campos)).replace(/\s+/g, '') === k; } catch (e) { return false; }
    });
  }

  function aMano() {
    var salida = {};
    lineasManualesActivas().forEach(function (m) { if (m.tipo === 'cadavez') salida[m.nombreDato] = m.buscar; });
    return salida;
  }

  /* Cuántas veces sale cada línea ahora (lo que cuenta la copia de trabajo, o lo propuesto si está desmarcada). */
  function veces(linea) {
    var v = estado.trabajo && estado.trabajo.veces ? estado.trabajo.veces[linea.id] : undefined;
    return estado.activos[linea.id] && v !== undefined ? v : (linea.veces || 0);
  }

  /* ---------- el paso 2: la plantilla rellena con este mismo asunto ---------- */

  function plantillaBorrador() {
    var d = estado.plantilla;
    return { firmante: d.firmante, vistoBueno: d.vistoBueno, conLogoCentro: !(estado.membrete && !estado.conLogo) };
  }

  async function rellenarEnMemoria() {
    var borrador = plantillaBorrador();
    var buffer = estado.trabajo.bytes;
    if (estado.membrete) buffer = await PlantillasDocumento._interno.ponerMembrete(buffer, borrador);
    var valores = await Plantillas.valoresDeAsunto(estado.asunto, { fecha: estado.iso, plantilla: borrador, hito: estado.hito, conLoQueFalta: false });
    valores.aMano = aMano();
    return Docx.rellenar(buffer, valores);
  }

  /* ---------- guardar ---------- */

  function buscarPaso(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      if (pasos[i].id === id) return pasos[i];
      for (var j = 0; j < (pasos[i].opciones || []).length; j++) {
        var enc = buscarPaso((pasos[i].opciones[j] && pasos[i].opciones[j].pasos) || [], id);
        if (enc) return enc;
      }
    }
    return null;
  }

  /* Los hitos de la guía de un tipo, a cualquier profundidad: [{ id, titulo }]. */
  function hitosDeLaGuia(tipo) {
    var salida = [];
    (function recorrer(pasos) {
      (pasos || []).forEach(function (p) {
        salida.push({ id: p.id, titulo: p.titulo || p.id });
        (p.opciones || []).forEach(function (o) { recorrer(o && o.pasos); });
      });
    })(GuiasDelCentro.pasosDe(tipo));
    return salida;
  }

  function nombreDeFichero(nombre) {
    var t = String(nombre || '').replace(/[\\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
    return t || 'Plantilla';
  }

  /* Tres botones en un solo cuadro: «Sustituirla» (el principal), «Guardar como otra» y «Cancelar». */
  async function preguntarSustituir(existente) {
    var otra = false;
    var espera = U.preguntar('Ya hay una plantilla para ese tipo de documento',
      '<p>Este tipo de asunto ya tiene la plantilla «' + U.escapar(existente.nombre) + '» para ese tipo de documento.</p>' +
      '<p style="margin-top:10px"><button type="button" class="boton" id="cep-otra">Guardar como otra</button></p>', 'Sustituirla');
    var b = document.getElementById('cep-otra');
    if (b) b.onclick = function () { otra = true; document.getElementById('cuadro-aceptar').click(); };
    var ok = await espera;
    if (!ok) return 'cancelar';
    return otra ? 'otra' : 'sustituir';
  }

  async function ficheroLibre(carpeta, base) {
    var existentes = (await Carpetas.ficheros(carpeta)).map(function (f) { return sin(f.nombre); });
    var nombre = base + '.docx', n = 2;
    while (existentes.indexOf(sin(nombre)) !== -1) { nombre = base + ' (' + n + ').docx'; n++; }
    return nombre;
  }

  /* Devuelve true si se ha guardado (la pantalla se cierra), false si no (se sigue en ella). */
  async function guardar() {
    var d = estado.plantilla, g = App.E.gestor;
    var datos = await Plantillas.cargar(g);
    var delTipo = datos.documentos.filter(function (p) { return p.categoria === d.categoria && sin(p.tipo) === sin(d.tipo); });
    if (delTipo.some(function (p) { return sin(p.nombre) === sin(d.nombre); })) {
      U.aviso('Ya hay una plantilla con ese nombre en este tipo de asunto.', 'malo');
      return false;
    }
    var sustituye = null;
    var mismoDoc = delTipo.filter(function (p) { return sin(p.tipoDocumento) === sin(d.tipoDocumento); })[0];
    if (mismoDoc) {
      var r = await preguntarSustituir(mismoDoc);
      if (r === 'cancelar') return false;
      if (r === 'sustituir') sustituye = mismoDoc;
    }
    var fichero, id;
    try {
      var carpeta = await PlantillasDocumento._interno.carpetaDePlantillas();
      fichero = await ficheroLibre(carpeta, nombreDeFichero(d.nombre));
      await PlantillasDocumento._interno.guardarBlobEnCarpeta(carpeta, fichero, estado.trabajo.blob);
      var registro = { tipo: d.tipo, categoria: d.categoria, nombre: d.nombre, fichero: fichero, tipoDocumento: d.tipoDocumento,
        texto: d.texto, firmante: d.firmante, vistoBueno: d.vistoBueno, conLogoCentro: !(estado.membrete && !estado.conLogo) };
      if (sustituye && window.Papelera) {
        try { await Papelera.mandarDato('plantilla-documento', sustituye.nombre, { categoria: sustituye.categoria, tipo: sustituye.tipo }, { plantilla: sustituye }); }
        catch (e) { U.accesorio('Plantilla guardada, pero no he podido mandar la anterior a la papelera', e); }
      }
      await Plantillas.guardar(g, function (actual) {
        registro.id = sustituye ? sustituye.id : Plantillas.idNuevoDocumento();
        id = registro.id;
        var i = sustituye ? actual.documentos.findIndex(function (x) { return x.id === sustituye.id; }) : -1;
        if (i !== -1) actual.documentos[i] = registro; else actual.documentos.push(registro);
        return actual;
      });
    } catch (e) {
      U.fallo('No he podido guardar la plantilla', e);
      return false;
    }
    /* Lo principal ya está guardado. Si solo falla la guía, ámbar: sale en todos los hitos. */
    if (d.hitoId) {
      try { await anadirTareaAlHito(d.tipo, d.hitoId, id, d.nombre); }
      catch (e2) { U.accesorio('Plantilla guardada, pero no he podido añadir la tarea al hito: sale en todos los hitos de este tipo', e2); }
    }
    Plantillas.olvidar();
    return true;
  }

  /* La tarea «Generar «X»» en el hito de la guía, por el guion de la guía (acción `generar`). Sin duplicar. */
  async function anadirTareaAlHito(tipo, idHito, idPlantilla, nombre) {
    await GuiasDelCentro.cambiarPasos(tipo, function (copia) {
      var paso = buscarPaso(copia, idHito);
      if (!paso) return false;
      paso.guion = paso.guion || [];
      if (paso.guion.some(function (x) { return x.accion === 'generar' && x.receta && x.receta.plantilla === idPlantilla; })) return false;
      paso.guion.push({ id: U.nuevoId('g'), texto: 'Generar «' + nombre + '»', accion: 'generar', receta: { plantilla: idPlantilla } });
      if (window.GuiasGuion) paso.guion = GuiasGuion.normalizar(paso.guion);
      return true;
    });
  }

  /* ---------- abrir ---------- */

  async function abrir(op) {
    if (!window.ConvertirEnPlantillaPantalla) return;
    try {
      var st = await preparar(op);
      await ConvertirEnPlantillaPantalla.abrir(api(), st);
    } catch (e) {
      if (String(e && e.message) === MOTIVO_PDF) U.aviso(MOTIVO_PDF, 'ambar');
      else U.fallo('No he podido abrir «Convertir en plantilla»', e);
    }
  }

  function api() {
    return {
      estado: function () { return estado; }, activar: activar, cambiarMembrete: cambiarMembrete, anadirManual: anadirManual,
      recalcular: recalcular, rellenarEnMemoria: rellenarEnMemoria, guardar: guardar, veces: veces, hitosDeLaGuia: hitosDeLaGuia,
      nombreDeDatoOcupado: nombreDeDatoOcupado, marcarTocado: marcarTocado, tipoDeDocumentoDe: tipoDeDocumentoDe
    };
  }

  return {
    TEXTO: TEXTO, MOTIVO_PDF: MOTIVO_PDF, MOTIVO_VIEJO: MOTIVO_VIEJO,
    estados: estados, estadoRapido: estadoRapido, botonDeMenu: botonDeMenu, opcionDeMesa: opcionDeMesa, abrir: abrir,
    /* para las pruebas */
    _fechaDe: fechaDe, _gemeloDe: gemeloDe, _estado: function () { return estado; }, _api: api
  };
})();
window.ConvertirEnPlantilla = ConvertirEnPlantilla;
