/* ============================================================
   formularios-rellenar.js — el impreso, con los datos del centro ya
   puestos (20-sep-2026, fila 84, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md).

   La regla que manda: SOLO se rellenan los datos del centro y el año
   académico. Los datos de la persona los sigue escribiendo ella, a
   propósito: así, al recibir el impreso, se ve si algo suyo ha
   cambiado.

   Este fichero trae:
     1. El mapa de cada impreso (`_GESTOR/formularios-campos.json`,
        el fichero compartido número dieciocho): qué casilla del PDF
        recibe qué hueco.
     2. `proponerMapa`, sin efectos: propone un hueco por el nombre de
        la casilla, mirando siete reglas (docs, parte 2).
     3. `rellenarPdf`, con pdf-lib: rellena solo las casillas del mapa,
        las deja en solo lectura, y no aplana el formulario.
     4. La pantalla "Impresos oficiales" de Ajustes → El centro (desde la
        fila 146, en js/formularios-ajustes.js).
     5. El botón "Preparar para el tercero", colgado del punto que deja
        js/formularios.js (`data-clave-formulario`) en el panel de
        hitos y en la línea "Formularios" de la ficha.

   Los PDF en blanco viven en `formularios/` del propio repositorio
   (no en _GESTOR): se piden con `fetch` relativo, como
   `datos/formularios.json` en js/formularios.js.
   ============================================================ */
var FormulariosRellenar = (function () {

  var ARCHIVO = 'formularios-campos.json';
  var CARPETA_REPO = 'formularios';

  /* Los siete huecos permitidos, y ninguno más: ningún dato de
     persona entra aquí (docs, parte 2, "Los huecos permitidos"). */
  var HUECOS = [
    { clave: '{{CENTRO}}', etiqueta: 'Nombre del centro' },
    { clave: '{{CODIGO CENTRO}}', etiqueta: 'Código del centro' },
    { clave: '{{DIRECCION CENTRO}}', etiqueta: 'Dirección del centro' },
    { clave: '{{LOCALIDAD}}', etiqueta: 'Localidad' },
    { clave: '{{PROVINCIA}}', etiqueta: 'Provincia' },
    { clave: '{{CURSO}}', etiqueta: 'Año académico' },
    { clave: '{{HOY}}', etiqueta: 'Fecha de hoy' }
  ];

  var cache = null;

  /* ==========================================================
     EL MAPA DE CADA IMPRESO: _GESTOR/formularios-campos.json
     ========================================================== */

  async function cargar(gestor) {
    var leido = null;
    try { leido = gestor ? await Carpetas.leerJson(gestor, ARCHIVO) : null; } catch (e) { leido = null; }
    cache = (leido && typeof leido === 'object') ? leido : {};
    return cache;
  }

  /* Releer, cambiar y guardar, de uno en uno (fila 146: por ColaGuardado,
     como todo _GESTOR). */
  function guardar(gestor, mutar) {
    var hacer = async function () {
      var leido = null;
      try { leido = await Carpetas.leerJson(gestor, ARCHIVO); } catch (e) { leido = null; }
      var actual = (leido && typeof leido === 'object') ? leido : {};
      var nuevo = mutar(actual) || actual;
      await Copias.guardar(gestor, ARCHIVO, nuevo);
      cache = nuevo;
      return nuevo;
    };
    return window.ColaGuardado ? ColaGuardado.poner(ARCHIVO, hacer) : hacer();
  }

  /* ==========================================================
     LA PROPUESTA AUTOMÁTICA: sin efectos, es lo que se prueba
     ========================================================== */

  /* Si el nombre de la casilla contiene... -> propone (docs, parte 2).
     Se mira sin mayúsculas ni tildes (U.normalizar). El orden importa:
     "codigo" se mira antes que "centro" (para no confundir "código del
     centro" con el nombre del centro), y "domicilio/dirección junto a
     centro" antes que "centro" a secas. */
  function huecoPropuestoDe(nombreCasilla) {
    /* Fila 146: solo el nombre propio de la casilla, no el camino entero
       (en los impresos de la Junta, un bloque «CENTROS» de más arriba
       hacía proponer el centro para casillas como «Rellenable» o
       «Botones»). Y nada para una numerada del 2 en adelante: «Centro 2»,
       «Código 3»… son los otros centros que pide la familia. */
    var n = window.FormulariosCasillas ? FormulariosCasillas.palabrasDe(nombreCasilla) : U.normalizar(nombreCasilla);
    if (/(^|\s)([2-9]|\d{2,})$/.test(n)) return '';
    if (/codigo/.test(n)) return '{{CODIGO CENTRO}}';
    if (/(domicilio|direccion)/.test(n) && /centro/.test(n)) return '{{DIRECCION CENTRO}}';
    if (/centro|denominacion|instituto/.test(n)) return '{{CENTRO}}';
    if (/localidad|municipio/.test(n)) return '{{LOCALIDAD}}';
    if (/provincia/.test(n)) return '{{PROVINCIA}}';
    if (/curso/.test(n) && /(escolar|academico)/.test(n)) return '{{CURSO}}';
    if (/ano academico/.test(n)) return '{{CURSO}}';
    if (/fecha/.test(n)) return '{{HOY}}';
    return '';
  }

  /* `Formularios.proponerMapa(nombresDeCasillas)` del encargo: una
     casilla que no case con ninguna regla no entra en el mapa
     propuesto (sale "sin asignar" en la pantalla). */
  function proponerMapa(nombresDeCasillas) {
    var mapa = {};
    (nombresDeCasillas || []).forEach(function (nombre) {
      /* Fila 146: nada para una casilla de la persona (la fecha de
         nacimiento no es {{HOY}}, el domicilio no es el del centro). */
      if (window.FormulariosCasillas && FormulariosCasillas.esDePersona(nombre)) return;
      var hueco = huecoPropuestoDe(nombre);
      if (hueco) mapa[nombre] = hueco;
    });
    return mapa;
  }

  /* ==========================================================
     LEER EL PDF EN BLANCO Y SUS CASILLAS (pdf-lib)
     ========================================================== */

  async function leerPdfDelRepositorio(nombreFichero) {
    try {
      return await App.leerFicheroDeLaApp(CARPETA_REPO + '/' + nombreFichero, 'binario');
    } catch (e) {
      throw new Error('No encuentro "' + nombreFichero + '" en formularios/.');
    }
  }

  /* Los nombres de las casillas de un PDF, o `null` si no tiene
     formulario rellenable (getFields() vacío, o pdf-lib no puede
     leerlo como tal: no se inventa nada). */
  async function casillasDe(bytesPdf) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc;
    try { doc = await PDFLib.PDFDocument.load(bytesPdf); } catch (e) { return null; }
    var form;
    try { form = doc.getForm(); } catch (e) { return null; }
    var campos;
    try { campos = form.getFields(); } catch (e) { return null; }
    if (!campos.length) return null;
    return campos.map(function (c) { return c.getName(); });
  }

  /* Rellena SOLO las casillas del mapa, con los valores que traiga
     `valores` (un objeto hueco -> texto), y las deja en solo lectura
     (`enableReadOnly`); las demás casillas siguen escribiéndose. Sin
     efectos de disco: recibe y devuelve bytes. Nunca aplana el
     formulario (`flatten()`). Si el PDF no tiene formulario
     rellenable, devuelve `rellenable: false` y los bytes tal cual. */
  async function rellenarPdf(bytesPdf, mapa, valores) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc;
    try { doc = await PDFLib.PDFDocument.load(bytesPdf); }
    catch (e) { return { bytes: bytesPdf, rellenas: [], rellenable: false }; }

    var form, campos;
    try { form = doc.getForm(); campos = form.getFields(); }
    catch (e) { return { bytes: bytesPdf, rellenas: [], rellenable: false }; }
    if (!campos.length) return { bytes: bytesPdf, rellenas: [], rellenable: false };

    var rellenas = [];
    campos.forEach(function (campo) {
      var nombre = campo.getName();
      var hueco = (mapa || {})[nombre];
      var valor = hueco ? ((valores || {})[hueco] || '') : '';
      if (!hueco || !valor || typeof campo.setText !== 'function') return;
      try {
        campo.setText(valor);
        campo.enableReadOnly();
        rellenas.push(nombre);
      } catch (e) { /* una casilla que no admite texto se deja como está */ }
    });

    /* Fila 146: sin la parte XFA, todos los visores enseñan lo rellenado
       (pdf-lib ya la quita al leer el formulario; esto lo asegura). */
    try {
      var xfa = PDFLib.PDFName.of('XFA');
      if (form.acroForm.dict.has(xfa)) form.acroForm.dict.delete(xfa);
    } catch (e) { /* sin AcroForm que tocar */ }

    return { bytes: await doc.save(), rellenas: rellenas, rellenable: true };
  }

  /* ==========================================================
     LOS SIETE VALORES DEL CENTRO, PARA UN ASUNTO
     ========================================================== */

  async function valoresDelCentro(asunto) {
    var valoresAsunto = {};
    var datosCentro = {};
    if (window.Plantillas && App.E && App.E.gestor) {
      try { valoresAsunto = await Plantillas.valoresDeAsunto(asunto); } catch (e) { valoresAsunto = {}; }
      try { datosCentro = await Plantillas.cargar(App.E.gestor); } catch (e) { datosCentro = {}; }
    }
    var salida = {};
    salida['{{CENTRO}}'] = valoresAsunto.centro || '';
    salida['{{CODIGO CENTRO}}'] = valoresAsunto.codigoCentro || '';
    salida['{{DIRECCION CENTRO}}'] = valoresAsunto.direccionCentro || '';
    salida['{{LOCALIDAD}}'] = valoresAsunto.localidad || '';
    salida['{{PROVINCIA}}'] = datosCentro.provincia || '';
    salida['{{CURSO}}'] = valoresAsunto.curso || '';
    salida['{{HOY}}'] = valoresAsunto.hoy || '';
    return salida;
  }

  /* ==========================================================
     "PREPARAR PARA EL TERCERO"
     ========================================================== */

  async function prepararParaElTercero(asunto, clave) {
    var catalogo = await Formularios.cargar();
    var f = catalogo[clave];
    if (!f || !f.f) { U.aviso('Este formulario no tiene PDF guardado.', 'malo'); return; }

    var bytesPdf;
    try { bytesPdf = await leerPdfDelRepositorio(f.f); }
    catch (e) { U.aviso(U.mensajeDeError(e), 'malo'); return; }

    var mapas = await cargar(App.E.gestor);
    var mapa = mapas[clave] || {};
    var valores = await valoresDelCentro(asunto);

    var resultado;
    try { resultado = await rellenarPdf(bytesPdf, mapa, valores); }
    catch (e) { U.aviso('No he podido rellenarlo: ' + U.mensajeDeError(e), 'malo'); return; }

    var nombreDoc = Nombres.montarDocumento({ fecha: U.hoyIso(), tipo: 'IMPRESO', curso: f.n, extension: 'pdf',
      tercero: asunto && asunto.tercero, nombreAsunto: asunto && asunto.nombre });
    if (nombreDoc.length > App.LARGO_MAXIMO_NOMBRE) {
      U.aviso('El nombre del impreso sale demasiado largo (más de ' + App.LARGO_MAXIMO_NOMBRE + ' letras).', 'malo');
      return;
    }

    var yaEsta;
    try { yaEsta = await Carpetas.ficheros(asunto.handle); } catch (e) { yaEsta = []; }
    if (yaEsta.some(function (x) { return x.nombre === nombreDoc; })) {
      U.aviso('Ya hay un documento con ese nombre en la carpeta: "' + nombreDoc + '".', 'malo');
      return;
    }

    try {
      await Carpetas.escribirBytes(asunto.handle, nombreDoc, resultado.bytes, 'application/pdf');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return;
    }

    if (window.Notas) {
      try { await Notas.anadir(asunto, 'Preparado el impreso ' + nombreDoc); } catch (e) { /* ya está guardado */ }
    }

    U.aviso(
      resultado.rellenable
        ? 'Impreso preparado: ' + nombreDoc + ' (' + resultado.rellenas.length + ' casillas puestas).'
        : 'Este impreso no se puede rellenar: se guarda en blanco. ' + nombreDoc,
      'bueno');

    if (typeof alTerminar === 'function') alTerminar();
  }

  /* ==========================================================
     EL BOTÓN, COLGADO DE `data-clave-formulario` (js/formularios.js)
     ========================================================== */

  var asuntoActual = null;
  var modoActual = 'abierto';
  var alTerminar = null;

  async function ponerBotones() {
    if (!asuntoActual || !window.Formularios) return;
    var asuntoDeEsteMomento = asuntoActual;
    var catalogo = await Formularios.cargar();
    if (asuntoActual !== asuntoDeEsteMomento) return;   /* se cambió de ficha mientras se leía */
    Array.prototype.forEach.call(document.querySelectorAll('[data-clave-formulario]'), function (nodo) {
      if (nodo.querySelector('.boton-preparar-formulario')) return;
      var clave = nodo.dataset.claveFormulario;
      var f = catalogo[clave];
      if (!f || !f.f) return;
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton boton-preparar-formulario';
      boton.textContent = 'Preparar para el tercero';
      boton.title = 'Rellena los datos del centro y del curso, y lo guarda en la carpeta del asunto';
      boton.onclick = function () {
        boton.disabled = true;
        prepararParaElTercero(asuntoDeEsteMomento, clave).finally(function () { boton.disabled = false; });
      };
      nodo.appendChild(boton);
    });
  }

  (function enganchar() {
    var nueva = U.envolver(App, 'App.abrirFicha', 'formularios-rellenar.js', function (comoEra) {
      return function (a, modo) {
        asuntoActual = a;
        modoActual = modo || 'abierto';
        comoEra(a, modo);
        alTerminar = function () { if (typeof App.abrirFicha === 'function') App.abrirFicha(a, modoActual); };
        ponerBotones();
      };
    });
    if (!nueva) return;
    var pantalla = document.getElementById('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(ponerBotones).observe(pantalla, { childList: true, subtree: true });
    }
  })();

  /* La pantalla «Impresos oficiales» de Ajustes → El centro vive, desde
     la fila 146, en js/formularios-ajustes.js. */
  function pintarPantallaImpresos() {
    return window.FormulariosAjustes ? FormulariosAjustes.pintar() : Promise.resolve();
  }

  return {
    ARCHIVO: ARCHIVO, HUECOS: HUECOS,
    proponerMapa: proponerMapa, huecoPropuestoDe: huecoPropuestoDe,
    cargar: cargar, guardar: guardar, leerPdfDelRepositorio: leerPdfDelRepositorio,
    casillasDe: casillasDe,
    rellenarPdf: rellenarPdf,
    valoresDelCentro: valoresDelCentro,
    prepararParaElTercero: prepararParaElTercero,
    pintarPantallaImpresos: pintarPantallaImpresos
  };
})();
window.FormulariosRellenar = FormulariosRellenar;
