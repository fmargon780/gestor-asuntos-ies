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
     4. La pantalla "Impresos oficiales" de Ajustes → El centro.
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

  async function guardar(gestor, mutar) {
    var leido = null;
    try { leido = await Carpetas.leerJson(gestor, ARCHIVO); } catch (e) { leido = null; }
    var actual = (leido && typeof leido === 'object') ? leido : {};
    var nuevo = mutar(actual) || actual;
    await Copias.guardar(gestor, ARCHIVO, nuevo);
    cache = nuevo;
    return nuevo;
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
    var n = U.normalizar(nombreCasilla);
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

    var nombreDoc = Nombres.montarDocumento({ fecha: U.hoyIso(), tipo: 'IMPRESO', curso: f.n, extension: 'pdf' });
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

  /* ==========================================================
     AJUSTES → EL CENTRO → "IMPRESOS OFICIALES"
     ========================================================== */

  var casillasPorFichero = {};   /* nombreFichero -> lista de casillas, o null si no se pudo leer */

  function $(id) { return document.getElementById(id); }

  function opcionesHuecos(elegido) {
    return '<option value="">(sin asignar)</option>' + HUECOS.map(function (h) {
      return '<option value="' + U.escapar(h.clave) + '"' + (h.clave === elegido ? ' selected' : '') + '>' +
        U.escapar(h.etiqueta) + '</option>';
    }).join('');
  }

  async function guardarCasilla(clave, nombreCasilla, hueco) {
    await guardar(App.E.gestor, function (actual) {
      actual[clave] = actual[clave] || {};
      if (hueco) actual[clave][nombreCasilla] = hueco;
      else delete actual[clave][nombreCasilla];
      return actual;
    });
  }

  /* El botón "Leer las casillas del PDF" (en vez de leerlo solo al
     desplegar la tarjeta): abrir un `<details>` no debe disparar una
     petición de red por su cuenta —lo hacen, sin querer, varias
     pruebas de navegador que despliegan TODOS los `<details>` de
     Ajustes para comprobar otra cosa—, así que la lectura de verdad
     espera a un clic. */
  function botonLeerHTML() {
    return '<button type="button" class="boton boton-leer-impreso">Leer las casillas del PDF</button>';
  }

  async function pintarDetalleImpreso(contenedor, clave, f) {
    contenedor.innerHTML = '<p class="suave">Leyendo el PDF…</p>';
    if (!(f.f in casillasPorFichero)) {
      try {
        var bytes = await leerPdfDelRepositorio(f.f);
        casillasPorFichero[f.f] = await casillasDe(bytes);
      } catch (e) {
        casillasPorFichero[f.f] = undefined;   /* no encontrado: distinto de null (sin casillas) */
      }
    }
    var casillas = casillasPorFichero[f.f];
    if (casillas === undefined) {
      contenedor.innerHTML = '<p class="suave">No encuentro "' + U.escapar(f.f) +
        '" en <code>formularios/</code> todavía.</p>';
      return;
    }
    if (casillas === null) {
      contenedor.innerHTML = '<p class="suave">Este impreso no se puede rellenar: no trae casillas. Se guardará en blanco.</p>';
      return;
    }
    var mapas = await cargar(App.E.gestor);
    var guardado = mapas[clave] || {};
    var propuesta = Object.keys(guardado).length ? guardado : proponerMapa(casillas);

    contenedor.innerHTML = casillas.map(function (nombreCasilla) {
      return '<div class="fila-tipo" data-casilla="' + U.escapar(nombreCasilla) + '">' +
        '<span class="nombre-tipo" style="flex:1">' + U.escapar(nombreCasilla) + '</span>' +
        '<select class="campo campo-hueco-impreso">' + opcionesHuecos(propuesta[nombreCasilla] || '') + '</select>' +
        '</div>';
    }).join('');

    Array.prototype.forEach.call(contenedor.querySelectorAll('[data-casilla]'), function (fila) {
      var nombreCasilla = fila.dataset.casilla;
      var select = fila.querySelector('select');
      select.onchange = async function () {
        try {
          await guardarCasilla(clave, nombreCasilla, select.value);
          U.aviso('Guardado.', 'bueno');
          pintarPantallaImpresos();
        } catch (e) {
          U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
        }
      };
    });
  }

  function tarjetaImpreso(clave, f, mapaGuardado) {
    var n = mapaGuardado ? Object.keys(mapaGuardado).length : 0;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    var resumen = document.createElement('summary');
    resumen.innerHTML = '<span class="bloque-titulo">' + U.escapar(f.n) + '</span>' +
      '<span class="bloque-pie">' + (n ? n + ' casilla' + (n === 1 ? '' : 's') + ' puesta' + (n === 1 ? '' : 's') : 'Sin configurar') + '</span>';
    d.appendChild(resumen);
    var cuerpo = document.createElement('div');
    cuerpo.className = 'bloque-cuerpo';
    cuerpo.innerHTML = botonLeerHTML();
    cuerpo.querySelector('.boton-leer-impreso').onclick = function () { pintarDetalleImpreso(cuerpo, clave, f); };
    d.appendChild(cuerpo);
    return d;
  }

  async function pintarPantallaImpresos() {
    var caja = $('tabla-impresos-oficiales');
    if (!caja) return;
    var catalogo = await Formularios.cargar();
    var mapas = await cargar(App.E.gestor);
    var conPdf = Object.keys(catalogo).filter(function (c) { return catalogo[c].f; })
      .sort(function (a, b) { return catalogo[a].n < catalogo[b].n ? -1 : 1; });
    caja.innerHTML = '';
    if (!conPdf.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ningún impreso con PDF en <code>formularios/</code>.</div>';
      return;
    }
    conPdf.forEach(function (clave) { caja.appendChild(tarjetaImpreso(clave, catalogo[clave], mapas[clave])); });
  }

  return {
    ARCHIVO: ARCHIVO, HUECOS: HUECOS,
    proponerMapa: proponerMapa,
    casillasDe: casillasDe,
    rellenarPdf: rellenarPdf,
    valoresDelCentro: valoresDelCentro,
    prepararParaElTercero: prepararParaElTercero,
    pintarPantallaImpresos: pintarPantallaImpresos
  };
})();
window.FormulariosRellenar = FormulariosRellenar;
