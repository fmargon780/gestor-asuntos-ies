/* ============================================================
   etiquetas-pantalla.js — la pantalla «Etiquetas» de Herramientas (fila 344, docs/ETIQUETAS.md).

   A todo el ancho: a la izquierda, a quién (el filtro del reparto, js/repartir-filtro.js) y las copias; a la
   derecha, las tarjetas Hoja, Diseño y Orden (js/etiquetas-tarjetas.js) y debajo la vista previa de las hojas tal
   cual saldrán; abajo, el pie fijo con las cuentas y «Guardar PDF» e «Imprimir». Se abre desde Herramientas o, con
   las personas de un asunto de grupo ya elegidas, desde su tarjeta «Personas del grupo». Imprimir no escribe nada;
   solo guardar un modelo o un diseño.

   Fila 450 (docs/ETIQUETAS-RECUERDA-TU-TRABAJO.md): el trabajo a medias se recuerda solo en este ordenador
   (`EtiquetasGuardado.trabajo()`), cada pestaña (Alumnado, Personal) con lo suyo: `E.pest[clase]` guarda sus
   huecos, desmarcadas, añadidas, lista pegada y el orden en que entraron las personas; E.gastadas, E.quitadas,
   E.anadidas, E.entrada y E.pegado son los de la pestaña que se ve. Sin grupo, clase, departamento, lista pegada
   ni nadie buscado, no hay nadie elegido y la hoja sale vacía.

   Los cálculos viven en js/etiquetas-datos.js, -disenos.js, -hoja.js y -modelos.js; el PDF, en -pdf.js; los
   formularios, en -editor.js; lo guardado (`_GESTOR/etiquetas.json`), en -guardado.js.
   ============================================================ */
var EtiquetasPantalla = (function () {
  var I = EtiquetasPantallaNucleo;
  var E = I.E;
  var CLASES = I.CLASES;
  function $() { return I.$.apply(this, arguments); }
  function esc() { return I.esc.apply(this, arguments); }
  function clave() { return I.clave.apply(this, arguments); }
  function calcular() { return I.calcular.apply(this, arguments); }
  function pintar() { return I.pintar.apply(this, arguments); }
  function hacerPegado() { return I.hacerPegado.apply(this, arguments); }

  function vaciar(o) { Object.keys(o).forEach(function (k) { delete o[k]; }); }
  function pestanaNueva() { return { gastadas: {}, quitadas: {}, anadidas: {}, entrada: [], pegado: null }; }
  function nuevoTrabajo() { E.pest = { alumnado: pestanaNueva(), personal: pestanaNueva() }; }

  /* Los huecos dependen de la hoja: al cambiar de modelo se quitan en las dos pestañas. */
  function vaciarHuecos() { CLASES.forEach(function (c) { vaciar(E.pest[c].gastadas); }); }

  function guardarEnPestana() {
    var P = E.pest[E.clase];
    P.pegado = E.pegado; P.entrada = E.entrada;
  }

  function cargarPestana(c) {
    var P = E.pest[c];
    E.clase = c;
    E.gastadas = P.gastadas; E.quitadas = P.quitadas; E.anadidas = P.anadidas; E.entrada = P.entrada; E.pegado = P.pegado;
    E.vistas = Object.assign({}, E.quitadas);
    if (E.filtro && c === 'alumnado') { E.filtro.desmarcadas = E.quitadas; E.filtro.cache = null; E.filtro.cacheMarcadas = null; }
  }

  function cambiarPestana(c) {
    if (c === E.clase) return;
    guardarEnPestana();
    cargarPestana(c);
  }

  /* Una persona entra en la selección «una a una»: va detrás de las que entraron de golpe. */
  function salir(k) { var i = E.entrada.indexOf(k); if (i !== -1) E.entrada.splice(i, 1); }
  function entrar(k) { salir(k); E.entrada.push(k); delete E.vistas[k]; }

  /* Tras marcar o desmarcar en la lista: las que se acaban de volver a marcar pasan al final. */
  function notarMarcadas() {
    Object.keys(E.vistas).forEach(function (k) { if (!E.quitadas[k]) entrar(k); });
    E.vistas = Object.assign({}, E.quitadas);
  }

  function empezarDeCero() {
    vaciar(E.anadidas); vaciar(E.quitadas); vaciar(E.gastadas); vaciar(E.vistas); E.entrada.length = 0;
    E.pegado = null; E.copias = 1;
    if (E.clase === 'alumnado') {
      E.base = null;
      if (E.filtro) { E.filtro.conds = []; E.filtro.antiguos = false; E.filtro.abierto = false; E.filtro.cache = null; E.filtro.cacheMarcadas = null; }
    } else E.personal.clase = E.personal.depto = '', E.personal.todo = false;
    pintar();
  }

  function claves(o) { return Object.keys(o); }

  function guardarTrabajo() {
    if (!E.listo) return;
    guardarEnPestana();
    var t = { v: 1, clase: E.clase, copias: E.copias };
    CLASES.forEach(function (c) {
      var P = E.pest[c];
      t[c] = { anadidas: claves(P.anadidas), quitadas: claves(P.quitadas), entrada: P.entrada.slice(), gastadas: claves(P.gastadas), pegado: P.pegado ? P.pegado.texto : null };
    });
    t.alumnado.conds = E.filtro ? E.filtro.conds : [];
    t.alumnado.antiguos = !!(E.filtro && E.filtro.antiguos);
    t.alumnado.base = E.base ? E.base.map(clave) : null;
    t.personal.clase = E.personal.clase; t.personal.depto = E.personal.depto; t.personal.todo = !!E.personal.todo;
    EtiquetasGuardado.guardarTrabajo(t);
  }

  /* Lo guardado vuelve a la pantalla; quien ya no está en los listados simplemente no sale. */
  function restaurar(t) {
    if (!t || t.v !== 1) return;
    CLASES.forEach(function (c) {
      var s = t[c], P = E.pest[c];
      if (!s) return;
      var lista = c === 'alumnado' ? (E.matriculados || []) : (E.personal.lista || []), por = {};
      lista.forEach(function (p) { por[clave(p)] = p; });
      (Array.isArray(s.anadidas) ? s.anadidas : []).forEach(function (k) { if (por[k]) P.anadidas[k] = por[k]; });
      (Array.isArray(s.quitadas) ? s.quitadas : []).forEach(function (k) { P.quitadas[k] = true; });
      (Array.isArray(s.entrada) ? s.entrada : []).forEach(function (k) { if (typeof k === 'string') P.entrada.push(k); });
      (Array.isArray(s.gastadas) ? s.gastadas : []).forEach(function (k) { P.gastadas[k] = true; });
      if (typeof s.pegado === 'string') P.pegado = hacerPegado(s.pegado, lista);
    });
    var a = t.alumnado || {};
    if (E.filtro && Array.isArray(a.conds)) {
      E.filtro.conds = a.conds.filter(function (c) { return c && typeof c.tipo === 'string' && typeof c.valor === 'string'; });
      E.filtro.antiguos = !!a.antiguos;
      E.filtro.abierto = E.filtro.conds.length > 0;
    }
    if (Array.isArray(a.base)) {
      var por2 = {};
      (E.matriculados || []).forEach(function (p) { por2[clave(p)] = p; });
      var base = a.base.map(function (k) { return por2[k]; }).filter(Boolean);
      if (base.length) E.base = base;
    }
    var pe = t.personal || {};
    if (pe.clase === 'docente' || pe.clase === 'no-docente') E.personal.clase = pe.clase;
    if (typeof pe.depto === 'string') E.personal.depto = pe.depto;
    E.personal.todo = !!pe.todo && !E.personal.clase;
    if (typeof t.copias === 'number') E.copias = Math.max(1, Math.min(50, Math.round(t.copias) || 1));
    if (t.clase === 'personal') E.clase = 'personal';
  }

  /* ---------- PDF e imprimir ---------- */

  async function bytes() {
    calcular();
    return EtiquetasPdf.generar(E.pag, E.modelo, E.prep);
  }

  async function guardarPdf() {
    try {
      var b = new Blob([await bytes()], { type: 'application/pdf' });
      descargar(b, EtiquetasPdf.nombreDeFichero(E.diseno, new Date()));
    } catch (e) { U.fallo('No he podido hacer el PDF', e); }
  }

  function descargar(blob, nombre) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  async function imprimir() {
    try {
      var url = URL.createObjectURL(new Blob([await bytes()], { type: 'application/pdf' }));
      var marco = document.createElement('iframe');
      marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
      marco.onload = function () {
        try { marco.contentWindow.focus(); marco.contentWindow.print(); }
        catch (e) { window.open(url, '_blank'); }
        setTimeout(function () { marco.remove(); URL.revokeObjectURL(url); }, 60000);
      };
      marco.src = url;
      document.body.appendChild(marco);
    } catch (e) { U.fallo('No he podido preparar la impresión', e); }
  }

  /* ---------- abrir y cerrar ---------- */

  async function cargarDatos(op) {
    var fuenteAl = await Datos.cargar(App.E.datos, 'ALUMNADO');
    E.matriculados = (fuenteAl.lista || []).filter(function (p) { return p.matriculado; });
    E.indice = PersonasFamilias.indice(E.matriculados);
    E.filtro = null;
    try { E.filtro = await RepartirFiltro.crear({ lista: E.matriculados }, [], { sinLista: true }); } catch (e) { E.filtro = null; }
    if (E.filtro) { E.filtro.clave = clave; E.filtro.desmarcadas = E.quitadas; }   /* fila 350: lo desmarcado en la lista vale también para exportar */
    var fuentePe = null;
    try { fuentePe = await Datos.cargar(App.E.datos, 'PERSONAL'); } catch (e) { fuentePe = null; }
    E.personal.lista = fuentePe ? (fuentePe.lista || []).filter(function (p) { return p.enElCentro; }) : [];
    E.base = null;
    if (op.nombres) {
      var por = {};
      E.matriculados.forEach(function (p) { por[App.textoTercero(p)] = p; por[p.nombre] = p; });
      E.base = op.nombres.map(function (n) { return por[n]; }).filter(Boolean);
    }
  }

  async function abrir(op) {
    op = op || {};
    var herr = $('pantalla-herramientas');
    if (herr && herr.classList.contains('oculto') && App.ir) App.ir('herramientas');
    var l = $('herramientas-lista'), vista = $('etiquetas-vista');
    if (!vista) return;
    E.abierta = true; E.volverA = op.asunto ? { asunto: op.asunto, modo: op.modo || 'abierto' } : null;
    E.listo = false; E.editor = null; E.copias = 1; E.tarjeta = ''; E.personal = { clase: '', depto: '', todo: false, lista: [] };
    nuevoTrabajo(); cargarPestana('alumnado');
    var ult = EtiquetasGuardado.ultimo();
    E.modeloId = ult.modelo || null; E.disenoId = ult.diseno || null;
    E.orden = EtiquetasTarjetas.ORDENES.some(function (o) { return o.id === ult.orden; }) ? ult.orden : 'grupo';
    if (l) l.classList.add('oculto');
    ['control-registro-vista', 'plantillas-vista', 'actividades-vista'].forEach(function (id) { var o = $(id); if (o) o.classList.add('oculto'); });
    vista.classList.remove('oculto');
    vista.innerHTML = '<p class="explica">Preparando las etiquetas…</p>';
    var mio = ++E.turno;
    try {
      E.guardado = await EtiquetasGuardado.leer();
      await cargarDatos(op);
      E.medir = await EtiquetasPdf.medidor();
    } catch (e) { if (mio === E.turno) { vista.innerHTML = '<p class="aviso aviso-ambar">No he podido preparar las etiquetas: ' + esc(e && e.message) + '</p>'; } return; }
    if (mio !== E.turno) return;
    /* Desde «Personas del grupo» empieza con esas personas y sustituye lo guardado; si no, vuelve lo que se dejó. */
    if (!op.nombres) { restaurar(EtiquetasGuardado.trabajo()); cargarPestana(E.clase); }
    E.listo = true;
    pintar();
  }

  /* Desde la tarjeta «Personas del grupo»: sus personas ya elegidas. */
  function abrirDesdeGrupo(a, modo) {
    var rel = ((window.App && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {}).relacionados || [];
    return abrir({ asunto: a, modo: modo, nombres: rel.map(function (r) { return r.nombre; }) });
  }

  function cerrar() {
    E.abierta = false; E.listo = false; E.volverA = null; E.turno++;
    var l = $('herramientas-lista'), vista = $('etiquetas-vista');
    if (l) l.classList.remove('oculto');
    if (vista) { vista.classList.add('oculto'); vista.innerHTML = ''; }
    var b = $('etiquetas-abrir');
    if (b && !b.onclick) b.onclick = function () { return abrir(); };
  }

  function enlazarBloque() {
    var b = $('etiquetas-abrir');
    if (b && !b.onclick) b.onclick = function () { return abrir(); };
  }

  I.vaciar = vaciar;
  I.vaciarHuecos = vaciarHuecos;
  I.cambiarPestana = cambiarPestana;
  I.salir = salir;
  I.entrar = entrar;
  I.notarMarcadas = notarMarcadas;
  I.empezarDeCero = empezarDeCero;
  I.guardarTrabajo = guardarTrabajo;
  I.guardarPdf = guardarPdf;
  I.imprimir = imprimir;
  I.cerrar = cerrar;

  return { abrir: abrir, abrirDesdeGrupo: abrirDesdeGrupo, cerrar: cerrar, enlazarBloque: enlazarBloque, estaAbierta: function () { return E.abierta; } };
})();
window.EtiquetasPantalla = EtiquetasPantalla;
