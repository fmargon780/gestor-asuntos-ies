/* ============================================================
   candidaturas.js — las candidaturas a las elecciones al Consejo Escolar, dentro de UN asunto
   (15-oct-2026, fila 347, docs/CANDIDATURAS-CONSEJO-ESCOLAR.md).

   Un tipo de asunto con la casilla «Lleva candidaturas» (`tipo.candidaturas = true`, en tipos.json, como
   `actividades` de la fila 306) es el de una convocatoria: todas las solicitudes de candidatura, de cualquier
   sector, viven en la ficha de ese único asunto: `ficha.candidaturas`, una lista de
     { id, persona: { categoria, nombre (el del tercero: con su número o DNI, sirve para relacionarla), visible (solo nombre
       y apellidos, lo que se enseña y va al PDF), clave }, sector, estado, motivo, documentos: [nombre de fichero],
       fecha, registro, creadaPor, creadaEl, cambiadaPor, cambiadaEl }.
   Se funde por elemento (App.anotarLista, identidad = id); cambiar una sola la relee del disco y toca solo esa.

   Este fichero lleva los datos y el campo «¿De quién es esta candidatura?» del cuadro de nombre de un
   documento (se engancha desde js/documentos-formulario.js y js/documentos-guardar.js, como js/esperas.js).
   La tarjeta de la ficha vive en js/candidaturas-ficha.js; la lista en PDF, en js/candidaturas-lista.js.
   ============================================================ */
var Candidaturas = (function () {

  var SECTORES = ['Alumnado', 'Madres y padres', 'Profesorado', 'PAS'];
  var ESTADOS = ['Presentada', 'Admitida', 'Excluida', 'Retirada'];
  var TIPO_SOLICITUD = 'SOLICITUD DE CANDIDATURA';
  var CORTO_SOLICITUD = 'CANDIDATURA';

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- qué asuntos las llevan ---------- */

  function tipoPorNombre(t) {
    if (!t) return null;
    if (typeof t === 'object') return t;
    return (App.E.tipos || []).filter(function (x) { return x.tipo === t; })[0] || null;
  }
  function esTipoConCandidaturas(tipo) {
    var t = tipoPorNombre(tipo);
    return !!(t && t.candidaturas === true);
  }
  function lista(a) {
    var f = (a && a.ficha) || {};
    return Array.isArray(f.candidaturas) ? f.candidaturas : [];
  }
  /* ¿Lleva este asunto la tarjeta «Candidaturas»? Por su tipo, o porque ya lleva alguna. */
  function aplica(a) {
    if (!a) return false;
    if (lista(a).length) return true;
    var tipo = window.App && App.tipoDeAsunto ? App.tipoDeAsunto(a) : ((a.ficha || {}).tipo || '');
    return esTipoConCandidaturas(tipo);
  }

  /* ---------- el sector de una persona ---------- */

  function sectorDe(categoria, persona) {
    if (categoria === 'ALUMNADO') return 'Alumnado';
    if (categoria === 'TUTORES LEGALES') return 'Madres y padres';
    if (categoria === 'PERSONAL') {
      var c = persona && persona.tipoPersonal;
      if (c === 'docente') return 'Profesorado';
      if (c === 'no-docente') return 'PAS';
    }
    return '';
  }

  /* Solo nombre y apellidos (nunca el DNI ni el número escolar que lleva el nombre del tercero). */
  function visible(persona) { return (persona && (persona.visible || persona.nombre)) || ''; }

  function claveDe(persona, nombre) {
    return window.Datos && Datos.clavePersona ? Datos.clavePersona(persona && persona.documento, (persona && persona.nombre) || nombre) : U.normalizar(nombre);
  }

  function misma(c, categoria, nombre, clave) {
    var p = c.persona || {};
    return p.categoria === categoria && (p.clave && clave ? p.clave === clave : U.normalizar(p.nombre) === U.normalizar(nombre));
  }
  function deLaPersona(a, categoria, nombre, clave) {
    return lista(a).filter(function (c) { return misma(c, categoria, nombre, clave); })[0] || null;
  }

  /* Las de un sector, por apellidos (el nombre sale ya como «Apellidos, Nombre»). */
  function porSector(cands, sector) {
    return cands.filter(function (c) { return c.sector === sector; })
      .sort(function (x, y) { return U.normalizar(visible(x.persona)) < U.normalizar(visible(y.persona)) ? -1 : 1; });
  }

  function cuentas(cands) {
    var s = {};
    SECTORES.forEach(function (x) { s[x] = porSector(cands, x).length; });
    s.sinSector = cands.filter(function (c) { return SECTORES.indexOf(c.sector) === -1; }).length;
    return s;
  }

  /* ---------- guardar ---------- */

  function quien() { return App.E.usuario || ''; }
  function ahora() { return new Date().toISOString(); }

  /* Fila 176: añadir sin sustituir la lista entera. */
  async function anadir(a, cand) {
    await App.anotarLista(a.nombre, 'candidaturas', { anadir: [cand] });
  }

  /* Cambiar UNA: se relee el disco y se toca solo esa (el resto de la lista no se sustituye). */
  async function cambiar(a, id, hacer) {
    await App.guardarRegistroFresco(async function (registro) {
      await App.comprobarNoCerrado(a.nombre);
      var ficha = registro.asuntos[a.nombre];
      var c = ficha && Array.isArray(ficha.candidaturas) ? ficha.candidaturas.filter(function (x) { return x.id === id; })[0] : null;
      if (!c) throw new Error('Esa candidatura ya no está en el asunto.');
      hacer(c);
      c.cambiadaPor = quien(); c.cambiadaEl = ahora();
    });
  }

  async function quitar(a, id) {
    await App.anotarLista(a.nombre, 'candidaturas', { quitar: [{ id: id }] });
  }

  function nueva(persona, sector, extra) {
    return Object.assign({
      id: U.nuevoId('cand'), persona: persona, sector: sector, estado: 'Presentada', motivo: '', documentos: [],
      fecha: U.hoyIso(), registro: '', creadaPor: quien(), creadaEl: ahora(), cambiadaPor: '', cambiadaEl: ''
    }, extra || {});
  }

  /* Relaciona a la persona con el asunto (sin duplicar) y apunta su candidatura. */
  async function apuntar(a, persona, sector, extra) {
    var cand = nueva(persona, sector, extra);
    await App.anotarLista(a.nombre, 'relacionados', { anadir: [{ categoria: persona.categoria, nombre: persona.nombre }] });
    await anadir(a, cand);
    return cand;
  }

  /* El documento sigue a la candidatura si cambia de nombre (js/documento-renombrar.js y el cuadro de nombre). */
  async function alRenombrar(a, viejo, nuevo) {
    if (!a || viejo === nuevo) return;
    var ids = lista(a).filter(function (c) { return (c.documentos || []).indexOf(viejo) !== -1; }).map(function (c) { return c.id; });
    for (var i = 0; i < ids.length; i++) {
      await cambiar(a, ids[i], function (c) {
        c.documentos = (c.documentos || []).map(function (d) { return d === viejo ? nuevo : d; });
        c.cambiadaPor = ''; c.cambiadaEl = '';   /* un cambio de nombre no es un cambio de la candidatura */
      });
    }
  }

  /* ---------- el tipo de documento y el tipo de asunto ---------- */

  async function asegurarTipoDeDocumento(nombre, corto) {
    if (!window.App || !App.E || !Array.isArray(App.E.tiposDocumento)) return;
    if (App.E.tiposDocumento.indexOf(nombre) === -1) {
      if (window.Borrados && Borrados.revivir) await Borrados.revivir(App.E.gestor, 'tiposDocumento', nombre);
      App.E.tiposDocumento.push(nombre);
      await App.guardarTiposDocumento();
    }
    if (corto && window.TiposDocumentoCortos && !TiposDocumentoCortos.de(nombre)) {
      try { await TiposDocumentoCortos.poner(nombre, corto); } catch (e) { /* sin nombre corto, sale el entero */ }
    }
  }

  /* «Lleva candidaturas», en Ajustes → un tipo → Datos del tipo (como «Reservado»). */
  function filaDeTipo(tipo) {
    var fila = document.createElement('div');
    fila.style.marginTop = '10px';
    fila.appendChild(App.construirInterruptorDeTipo(tipo, 'candidaturas', false, 'Lleva candidaturas',
      'Para el asunto de unas elecciones: cada solicitud de candidatura queda apuntada en una tarjeta, por sectores, con su estado.'));
    return fila;
  }

  /* ============================================================
     EL CAMPO «¿DE QUIÉN ES ESTA CANDIDATURA?» EN EL CUADRO DE NOMBRE
     ============================================================ */

  var cuadro = null;   /* { asunto, persona: { categoria, nombre, clave, tipoPersonal }, sector, no, turno } */

  function entra(opciones) { return !!opciones && (opciones.modo === 'anadir' || !!opciones.ponerNombre); }

  function yaEsDeUna(a, nombreFichero) {
    return lista(a).some(function (c) { return (c.documentos || []).indexOf(nombreFichero) !== -1; });
  }

  /* ¿Sale el campo en este cuadro? */
  function sale(opciones, a) {
    if (soloConsulta() || !entra(opciones) || !a) return false;
    var tipo = window.App && App.tipoDeAsunto ? App.tipoDeAsunto(a) : '';
    if (!esTipoConCandidaturas(tipo)) return false;
    return !yaEsDeUna(a, opciones.nombreActual);
  }

  /* El tipo de documento con el que arranca el cuadro (solo si no lo trae ya el nombre). */
  function tipoPorDefecto(opciones, a) {
    return sale(opciones, a) ? TIPO_SOLICITUD : '';
  }

  /* Antes de pintar el cuadro: el tipo de documento tiene que existir en la lista. */
  async function preparar(opciones, a) {
    if (!sale(opciones, a)) return;
    try { await asegurarTipoDeDocumento(TIPO_SOLICITUD, CORTO_SOLICITUD); }
    catch (e) { U.accesorio('No he podido dar de alta el tipo de documento ' + TIPO_SOLICITUD, e); }
  }

  function campoHTML(opciones, a) {
    if (!sale(opciones, a)) return '';
    return '<div class="cand-campo" id="cand-campo">' +
      '<label class="etiqueta">¿De quién es esta candidatura?</label>' +
      '<div id="cand-elegida" class="cand-elegida oculto"></div>' +
      '<div id="cand-picker"></div>' +
      '<div id="cand-sector-fila" class="oculto"><label class="etiqueta">Sector</label>' +
        '<select id="cand-sector" class="campo"><option value="">Elige el sector…</option>' +
        SECTORES.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('') + '</select></div>' +
      '<p class="aviso aviso-ambar oculto" id="cand-aviso"></p>' +
      '<label class="interruptor"><input type="checkbox" id="cand-no"><span>No es una candidatura</span></label>' +
      '<p class="nota">Por ejemplo, un acta o una reclamación: se guarda como un documento más.</p>' +
      '</div>';
  }

  function pintarElegida() {
    var caja = $('cand-elegida'), picker = $('cand-picker'), fila = $('cand-sector-fila'), aviso = $('cand-aviso');
    if (!caja || !cuadro) return;
    var p = cuadro.persona;
    caja.classList.toggle('oculto', !p);
    picker.classList.toggle('oculto', !!p || cuadro.no);
    if (!p) { fila.classList.add('oculto'); aviso.classList.add('oculto'); caja.innerHTML = ''; return; }
    caja.innerHTML = '<span class="cand-nombre">' + esc(visible(p)) + '</span>' +
      '<span class="suave"> · ' + esc(cuadro.sector || 'sin sector') + '</span> ' +
      '<button type="button" class="boton boton-mini" id="cand-cambiar">Cambiar</button>';
    $('cand-cambiar').onclick = function () { cuadro.persona = null; cuadro.sector = ''; pintarElegida(); };
    var auto = sectorDe(p.categoria, p);
    var mensajes = [];
    if (!auto) mensajes.push('«' + visible(p) + '» no es de ninguno de los cuatro sectores por su categoría: elige el sector a mano.');
    fila.classList.toggle('oculto', !!auto);
    if (auto) cuadro.sector = auto;
    else $('cand-sector').value = cuadro.sector || '';
    var ya = deLaPersona(cuadro.asunto, p.categoria, p.nombre, p.clave);
    if (ya) mensajes.push('Ya tiene candidatura: este documento se guardará como un papel más de su candidatura.');
    aviso.textContent = mensajes.join(' ');
    aviso.classList.toggle('oculto', !mensajes.length);
    caja.querySelector('.suave').textContent = ' · ' + (cuadro.sector || 'sin sector');
  }

  function elegir(categoria, persona) {
    if (!cuadro || !persona) return;
    cuadro.persona = { categoria: categoria || persona.categoria, nombre: App.textoTercero(persona), visible: persona.nombre, clave: claveDe(persona), tipoPersonal: persona.tipoPersonal || '' };
    cuadro.sector = '';
    pintarElegida();
  }

  /* Si el documento deja ver de quién es, se propone (mejor esfuerzo: sin lectura, el campo queda vacío). */
  async function proponer(opciones, turno) {
    try {
      var h = opciones.handle || await cuadro.asunto.handle.getFileHandle(opciones.nombreActual);
      var fichero = await h.getFile();
      if (!/\.pdf$/i.test(fichero.name)) return;
      var texto = await RegistroLector.textoDe(fichero, 5);
      if (!texto || !window.ContextoDocumentos || !window.LectorDocumentos) return;
      var analisis = LectorDocumentos.analizar(texto, await ContextoDocumentos.delCentro());
      var t = analisis && analisis.tercero;
      if (!t || !t.persona || !cuadro || cuadro.turno !== turno || cuadro.persona || cuadro.no) return;
      elegir(t.categoria, t.persona);
    } catch (e) { /* sin propuesta */ }
  }

  /* Después de pintar el cuadro. */
  function enganchar(opciones, a) {
    cuadro = null;
    if (!$('cand-campo')) return;
    cuadro = { asunto: a, persona: null, sector: '', no: false, turno: (enganchar.turno = (enganchar.turno || 0) + 1) };
    App.pintarBuscadorDeTercero($('cand-picker'), null, function (categoria, persona) {
      if (persona) elegir(categoria, persona);
      else U.aviso('Aquí solo se elige a alguien que ya esté en las listas. Si falta, dalo de alta antes en «Personas y empresas».', 'ambar');
    });
    $('cand-no').onchange = function () {
      cuadro.no = this.checked;
      if (cuadro.no) { cuadro.persona = null; cuadro.sector = ''; }
      pintarElegida();
      $('cand-picker').classList.toggle('oculto', cuadro.no || !!cuadro.persona);
    };
    $('cand-sector').onchange = function () { cuadro.sector = this.value; pintarElegida(); };
    proponer(opciones, cuadro.turno);
  }

  /* Antes de guardar: o hay persona (y sector), o «No es una candidatura». '' si va bien. */
  function falta() {
    if (!cuadro || !$('cand-campo')) return '';
    if (cuadro.no) return '';
    if (!cuadro.persona) return 'Elige de quién es la candidatura, o marca «No es una candidatura».';
    if (SECTORES.indexOf(cuadro.sector) === -1) return 'Elige el sector de «' + visible(cuadro.persona) + '».';
    return '';
  }

  /* Tras guardar el documento: la candidatura. `d` = { fecha, registro (código) }. */
  async function alGuardar(a, nombreFichero, d) {
    if (!cuadro || !$('cand-campo') || cuadro.no || !cuadro.persona) return;
    var p = { categoria: cuadro.persona.categoria, nombre: cuadro.persona.nombre, visible: cuadro.persona.visible, clave: cuadro.persona.clave };
    var sector = cuadro.sector;
    try {
      var ya = deLaPersona(a, p.categoria, p.nombre, p.clave);
      if (ya) {
        await cambiar(a, ya.id, function (c) { if ((c.documentos || []).indexOf(nombreFichero) === -1) c.documentos = (c.documentos || []).concat([nombreFichero]); });
        if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Documento «' + nombreFichero + '» añadido a la candidatura de ' + visible(p));
        U.aviso('Añadido a la candidatura de ' + visible(p) + '.', 'bueno');
      } else {
        await apuntar(a, p, sector, { documentos: [nombreFichero], fecha: (d && d.fecha) || U.hoyIso(), registro: (d && d.registro) || '' });
        if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Candidatura presentada: ' + visible(p) + ' (' + sector + ')');
        U.aviso('Candidatura de ' + visible(p) + ' apuntada en «' + sector + '».', 'bueno');
      }
    } catch (e) {
      U.accesorio('Documento guardado, pero no he podido apuntar la candidatura', e);
    }
    if (window.CandidaturasFicha) CandidaturasFicha.repintar();
  }

  return {
    SECTORES: SECTORES, ESTADOS: ESTADOS, TIPO_SOLICITUD: TIPO_SOLICITUD,
    aplica: aplica, esTipoConCandidaturas: esTipoConCandidaturas, lista: lista, sectorDe: sectorDe, porSector: porSector, cuentas: cuentas,
    deLaPersona: deLaPersona, claveDe: claveDe, visible: visible, anadir: anadir, cambiar: cambiar, quitar: quitar, nueva: nueva, apuntar: apuntar,
    alRenombrar: alRenombrar, asegurarTipoDeDocumento: asegurarTipoDeDocumento, filaDeTipo: filaDeTipo,
    sale: sale, tipoPorDefecto: tipoPorDefecto, preparar: preparar, campoHTML: campoHTML, enganchar: enganchar, falta: falta, alGuardar: alGuardar
  };
})();
window.Candidaturas = Candidaturas;
