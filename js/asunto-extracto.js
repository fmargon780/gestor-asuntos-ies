/* ============================================================
   asunto-extracto.js — el asunto de correos y mensajes de Séneca y el extracto del registro de Séneca, compuestos
   por la app (fila 627, docs/627-ASUNTO-Y-EXTRACTO.md; tema 623).

   Antes, el asunto era el nombre de la carpeta (docs/ASUNTO-SIN-ELECCION.md, sustituido por esta fila). Ahora:

   - Asunto general del centro (Ajustes → El centro → «Asunto y extracto»), un texto de una línea con campos variables.
     Cada plantilla de correo o de Séneca puede llevar el suyo (`asunto`); vacío, sale el general.
   - Extracto: general (varias líneas) y, si se quiere, uno propio por tipo de documento. Se guardan en
     `_GESTOR/plantillas.json` (`asuntoGeneral`, `extractoGeneral`, `extractosPorTipo`).
   - El número del asunto (A26-0137) va SIEMPRE: si el modelo no lo lleva, se añade al final (de la última línea, en el
     extracto), separado por « · ». Si ya lo lleva, no se repite.
   - Un asunto de antes, sin número: asunto y extracto siguen siendo el nombre de la carpeta.

   La parte pura (`limpiar`, `componer`, `modeloDe…`) no toca disco ni pantalla. Las funciones `asunto` y
   `extractoDeDocumento` leen los valores del asunto con `Plantillas.valoresDeAsunto`.
   ============================================================ */
var AsuntoExtracto = (function () {

  var SEPARADOR = ' · ';
  /* Los modelos de partida, hasta que alguien los cambie. Ninguno lleva el número escolar ni el documento del tercero. */
  var MODELO_ASUNTO = '{tipo}' + SEPARADOR + '{nombre}';
  var MODELO_EXTRACTO = '{tipo de documento}' + SEPARADOR + '{tipo}\n{nombre}' + SEPARADOR + '{grupo}';
  /* Los campos que solo tienen valor al copiar el extracto de un documento: no salen en el asunto. */
  var SOLO_DEL_DOCUMENTO = ['h:tipo de documento', 'h:fecha del documento', 'h:numero del documento'];
  /* Un asunto inventado, para «Así sale» donde no hay asunto delante (Ajustes). */
  var NUMERO_DE_MUESTRA = 'A26-0003';

  /* ---------- parte pura ---------- */

  /* Cada línea sin espacios de más y sin separadores sueltos (al principio, al final o dos seguidos); sin líneas
     vacías. `unaLinea`: las líneas se unen con un espacio (el asunto de un correo es de una sola línea). */
  function limpiar(texto, unaLinea) {
    var lineas = String(texto == null ? '' : texto).split(/\r?\n/).map(function (l) {
      return l.replace(/\s+/g, ' ').replace(/(\s*·\s*){2,}/g, SEPARADOR).replace(/^(\s*·\s*)+|(\s*·\s*)+$/g, '').trim();
    }).filter(function (l) { return l; });
    return lineas.join(unaLinea ? ' ' : '\n');
  }

  function llevaElNumero(texto, numero) {
    return !!numero && String(texto || '').toUpperCase().indexOf(String(numero).toUpperCase()) !== -1;
  }

  /* El modelo con sus campos rellenos, limpio y con el número del asunto al final si no estaba. `valores`: los de
     `Plantillas.valoresDeAsunto`. */
  function componer(modelo, valores, numero, unaLinea) {
    var relleno = Plantillas.rellenar(String(modelo || ''), valores || {}).texto;
    var t = limpiar(relleno, unaLinea);
    if (numero && !llevaElNumero(t, numero)) t = (t ? t + SEPARADOR : '') + numero;
    return t;
  }

  function numeroDe(a) {
    return String((a && a.ficha && a.ficha.numero) || (a && a.leido && a.leido.numero) || '').trim();
  }

  function esSuyo(clave, tipo) { return U.normalizar(clave) === U.normalizar(tipo); }

  /* El modelo del asunto: el de la plantilla si lo tiene; si no, el general del centro; si tampoco, el de partida. */
  function modeloDeAsunto(datos, plantilla) {
    var propio = plantilla && String(plantilla.asunto || '').trim();
    if (propio) return propio;
    return modeloGeneralDeAsunto(datos);
  }
  function modeloGeneralDeAsunto(datos) {
    var g = datos && String(datos.asuntoGeneral || '').trim();
    return g || MODELO_ASUNTO;
  }
  function modeloGeneralDeExtracto(datos) {
    var g = datos && String(datos.extractoGeneral || '').trim();
    return g || MODELO_EXTRACTO;
  }
  /* El extracto propio de un tipo de documento, o '' si no tiene. */
  function extractoPropioDelTipo(datos, tipo) {
    var mapa = (datos && datos.extractosPorTipo) || {};
    var hallado = '';
    Object.keys(mapa).forEach(function (k) { if (tipo && esSuyo(k, tipo) && String(mapa[k] || '').trim()) hallado = String(mapa[k]).trim(); });
    return hallado;
  }
  function modeloDeExtracto(datos, tipo) {
    return extractoPropioDelTipo(datos, tipo) || modeloGeneralDeExtracto(datos);
  }

  /* El asunto de un asunto (sincrónico, con lo ya leído). Sin número del asunto, el nombre de la carpeta. */
  function asuntoCon(a, valores, datos, plantilla) {
    var numero = numeroDe(a);
    if (!numero) return (a && a.nombre) || '';
    return componer(modeloDeAsunto(datos, plantilla), valores, numero, true);
  }

  /* El extracto de un documento de un asunto (sincrónico). `tipo`: el tipo de documento (para elegir su extracto). */
  function extractoCon(a, valores, datos, tipo) {
    var numero = numeroDe(a);
    if (!numero) return (a && a.nombre) || '';
    return componer(modeloDeExtracto(datos, tipo), valores, numero, false);
  }

  /* Valores de un asunto inventado (Ajustes, «Así sale»). `extra` los cambia o completa. */
  function muestra(extra) {
    var hoy = U.fechaLegible(U.aAaMmDd(U.hoyIso()));
    return Object.assign({
      nombre: 'Espejo Montes, Carla', nombreNatural: 'Carla Espejo Montes', grupo: '4º A', curso: '26-27',
      tipo: 'BAJA MATRICULA', referencia: '2100006', descripcion: '', hoy: hoy, limite: hoy,
      centro: (window.Plantillas && Plantillas.POR_DEFECTO_CENTRO) || '', usuario: (window.App && App.E && App.E.usuario) || '',
      'numero del asunto': NUMERO_DE_MUESTRA, 'tipo de documento': 'RESOLUCION', 'fecha del documento': '09/11/2026',
      'numero del documento': 'D26-00008', campos: {}
    }, extra || {});
  }

  /* «Así sale» de un modelo con el asunto de muestra. `opciones.unaLinea`; `opciones.valores`, los de un asunto de verdad. */
  function asiSale(modelo, opciones) {
    var op = opciones || {};
    var valores = op.valores || muestra(op.extra);
    var numero = op.valores ? String(valores['numero del asunto'] || '') : NUMERO_DE_MUESTRA;
    return componer(modelo, valores, numero, !!op.unaLinea);
  }

  /* ---------- con lo que hay en la aplicación ---------- */

  async function datosDelCentro() {
    try { if (window.App && App.E && App.E.gestor) return await Plantillas.cargar(App.E.gestor); } catch (e) { /* con lo que haya */ }
    return Plantillas.enMemoria() || null;
  }

  function plantillaPorId(datos, id) {
    return id && datos ? ((datos.lista || []).filter(function (p) { return p.id === id; })[0] || null) : null;
  }

  /* El asunto que sale hoy para este asunto: el de la plantilla `idPlantilla` si la tiene; si no, el general. */
  async function asunto(a, idPlantilla) {
    if (!numeroDe(a)) return (a && a.nombre) || '';
    var datos = await datosDelCentro();
    var valores = await Plantillas.valoresDeAsunto(a);
    return asuntoCon(a, valores, datos, plantillaPorId(datos, idPlantilla));
  }

  /* Los datos de un documento de la carpeta, por su nombre: { tipo, fecha (AAAA-MM-DD), numero }. */
  function datosDelDocumento(a, nombre) {
    var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(nombre, a && a.ficha) : {};
    return { tipo: leido.tipo || '', fecha: leido.fecha || '', numero: leido.numero || '' };
  }

  /* El extracto de un documento del asunto: el de su tipo de documento o el general, con los datos del asunto y del
     documento. Sin número del asunto, el nombre de la carpeta. */
  async function extractoDeDocumento(a, nombreDoc) {
    if (!numeroDe(a)) return (a && a.nombre) || '';
    var doc = datosDelDocumento(a, nombreDoc);
    var datos = await datosDelCentro();
    var valores = await Plantillas.valoresDeAsunto(a, { documento: doc });
    return extractoCon(a, valores, datos, doc.tipo);
  }

  return {
    SEPARADOR: SEPARADOR, MODELO_ASUNTO: MODELO_ASUNTO, MODELO_EXTRACTO: MODELO_EXTRACTO, SOLO_DEL_DOCUMENTO: SOLO_DEL_DOCUMENTO,
    limpiar: limpiar, componer: componer, numeroDe: numeroDe, llevaElNumero: llevaElNumero,
    modeloDeAsunto: modeloDeAsunto, modeloGeneralDeAsunto: modeloGeneralDeAsunto, modeloGeneralDeExtracto: modeloGeneralDeExtracto,
    extractoPropioDelTipo: extractoPropioDelTipo, modeloDeExtracto: modeloDeExtracto,
    asuntoCon: asuntoCon, extractoCon: extractoCon, muestra: muestra, asiSale: asiSale,
    asunto: asunto, extractoDeDocumento: extractoDeDocumento, datosDelDocumento: datosDelDocumento
  };
})();
window.AsuntoExtracto = AsuntoExtracto;
