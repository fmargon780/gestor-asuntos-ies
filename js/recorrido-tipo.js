/* ============================================================
   recorrido-tipo.js — el recorrido de cada tipo de documento
   (17-nov-2026, fila 698, docs/698-RECORRIDO-DEL-TIPO-DE-DOCUMENTO.md).

   El recorrido de un papel se escribe una sola vez, en su tipo de
   documento, y vale para todos los documentos de ese tipo en todos los
   trámites. Esta fila solo lo guarda y lo da a leer; lo usan las filas
   siguientes (703 a 705). La ventana está en js/recorrido-tipo-ventana.js.

   Se guarda aparte, en `_GESTOR/recorridos-tipos.json`
   ({ version: 1, recorridos: { "COMUNICACION": { entra, firma, registro,
   envia, aquien, via } } }), porque `tipos-documento.json` es una lista de
   nombres. Un tipo que nunca ha tenido recorrido sale como «Nos llega · no
   se registra»; la app no rellena ninguno a partir de las plantillas.
   ============================================================ */
var RecorridoTipo = (function () {

  var FICHERO = 'recorridos-tipos.json';
  var FIRMAS = ['Nadie', 'Administración', 'Secretaría', 'Secretaría, con visto bueno de Dirección', 'Dirección', 'Jefatura de Estudios'];
  var AQUIEN = ['Familia', 'Interesado', 'Quien lo pide', 'Tutor/a del grupo', 'Personas relacionadas', 'Otro centro u organismo'];   /* fila 782: el último */
  /* Fila 782: la Ventanilla Electrónica es una vía más de «Por dónde» (no es un sitio de la lista del centro). */
  var VIA_VENTANILLA = 'Ventanilla Electrónica';
  /* Las vías de envío de `Sitios` (js/sitios.js): por si no está cargado, y para saber cuáles lo son. */
  var IDS_VIAS = ['st-correo', 'st-ipasen', 'st-postal', 'st-en-mano', 'st-tablon'];
  var VIAS_POR_DEFECTO = ['Correo electrónico', 'iPasen', 'Correo postal', 'En mano', 'Tablón'];
  var mapa = {};

  function gestor() { return window.App && App.E && App.E.gestor; }
  function clave(t) { return U.normalizar(String(t || '')); }

  /* «Por dónde»: las vías de envío de la lista de sitios del centro, con el nombre que tengan hoy. */
  function vias() {
    var salida = [];
    try {
      var d = window.Sitios && Sitios.datos ? Sitios.datos() : null;
      ((d && d.sitios) || []).forEach(function (s) { if (IDS_VIAS.indexOf(s.id) !== -1 && s.nombre) salida.push(s.nombre); });
    } catch (e) { salida = []; }
    return (salida.length ? salida : VIAS_POR_DEFECTO.slice()).concat([VIA_VENTANILLA]);
  }

  function viaEsVentanilla(via) { return clave(via) === clave(VIA_VENTANILLA); }

  /* Lo guardado, limpio y con lo que no encaja quitado. */
  function limpiar(r) {
    r = r || {};
    var entra = r.entra !== false;
    if (entra) return { entra: true, firma: 'Nadie', registro: !!r.registro, envia: false, aquien: '', via: '' };
    var envia = !!r.envia;
    return {
      entra: false,
      firma: FIRMAS.indexOf(r.firma) !== -1 ? r.firma : 'Nadie',
      registro: !!r.registro,
      envia: envia,
      aquien: envia ? (AQUIEN.indexOf(r.aquien) !== -1 ? r.aquien : AQUIEN[0]) : '',
      via: envia ? (String(r.via || '') || vias()[0]) : ''
    };
  }

  async function leerDisco() {
    var g = gestor();
    var r = g ? await Carpetas.leerJson(g, FICHERO) : null;
    return { version: 1, recorridos: (r && r.recorridos && typeof r.recorridos === 'object' && !Array.isArray(r.recorridos)) ? r.recorridos : {} };
  }

  async function cargar() {
    try { mapa = (await leerDisco()).recorridos; }
    catch (e) { mapa = {}; }   /* roto o ilegible: todos sin recorrido */
  }

  function guardado(tipo) {
    var k = clave(tipo), hallado = null;
    Object.keys(mapa).forEach(function (t) { if (clave(t) === k) hallado = mapa[t]; });
    return hallado;
  }

  /* ¿Tiene el tipo un recorrido guardado? */
  function tiene(tipo) { return !!guardado(tipo); }

  /* El recorrido del tipo: { entra, firma, registro, envia, aquien, via }. Sin guardar: «Nos llega · no se registra». */
  function de(tipo) { return limpiar(guardado(tipo) || { entra: true }); }

  /* Los pasos que tendrá el papel, como en la pantalla de prueba: [{ k, t }]. */
  function pasosDe(r) {
    var p = [];
    if (r.entra) {
      p.push({ k: 'recibido', t: 'Recibido' });
      if (r.registro) p.push({ k: 'registrado', t: 'Registrado de entrada' });
      return p;
    }
    p.push({ k: 'generado', t: 'Generado' });
    if (r.firma !== 'Nadie') p.push({ k: 'firmado', t: 'Firmado' });
    if (r.registro) p.push({ k: 'registrado', t: 'Registrado' });
    if (r.envia) p.push({ k: 'enviado', t: 'Enviado' });
    return p;
  }
  function pasos(tipo) { return pasosDe(de(tipo)); }

  /* El resumen en una frase. */
  function resumenDe(r) {
    if (r.entra) return 'Nos llega' + (r.registro ? ' · se registra de entrada' : ' · no se registra');
    return (r.firma === 'Nadie' ? 'Sin firma' : 'Firma: ' + r.firma) + (r.registro ? ' · se registra de salida' : ' · no se registra') +
      (r.envia ? ' · a ' + r.aquien + ' por ' + r.via : ' · no se envía');
  }
  function resumen(tipo) { return resumenDe(de(tipo)); }

  /* Guarda el recorrido del tipo, releyendo antes el fichero por si el otro ordenador ha tocado algo. */
  function poner(tipo, recorrido) {
    var limpio = limpiar(recorrido);
    var hacer = async function () {
      if (window.SoloConsulta && SoloConsulta.activo()) throw new Error(SoloConsulta.textoError ? SoloConsulta.textoError() : 'Solo consulta: no se ha guardado nada.');
      var d = await leerDisco();
      Object.keys(d.recorridos).forEach(function (t) { if (clave(t) === clave(tipo)) delete d.recorridos[t]; });
      d.recorridos[tipo] = limpio;
      if (gestor()) await Copias.guardar(gestor(), FICHERO, d);
      mapa = d.recorridos;
    };
    return App.enFila ? App.enFila(FICHERO, hacer) : hacer();
  }

  /* Pasa el recorrido guardado de un tipo a otro nombre (al unir tipos): si el nuevo ya tiene el suyo, se queda ese. */
  function mover(viejo, nuevo) {
    var hacer = async function () {
      var d = await leerDisco(), cambia = false;
      Object.keys(d.recorridos).forEach(function (t) {
        if (clave(t) !== clave(viejo) || clave(t) === clave(nuevo)) return;
        var ya = Object.keys(d.recorridos).some(function (o) { return clave(o) === clave(nuevo); });
        if (!ya) d.recorridos[nuevo] = d.recorridos[t];
        delete d.recorridos[t];
        cambia = true;
      });
      if (cambia && gestor()) await Copias.guardar(gestor(), FICHERO, d);
      mapa = d.recorridos;
    };
    return App.enFila ? App.enFila(FICHERO, hacer) : hacer();
  }

  return {
    FICHERO: FICHERO, FIRMAS: FIRMAS, AQUIEN: AQUIEN, vias: vias, VIA_VENTANILLA: VIA_VENTANILLA, viaEsVentanilla: viaEsVentanilla,
    cargar: cargar, tiene: tiene, de: de, pasos: pasos, resumen: resumen,
    pasosDe: pasosDe, resumenDe: resumenDe, limpiar: limpiar, poner: poner, mover: mover
  };
})();
window.RecorridoTipo = RecorridoTipo;
