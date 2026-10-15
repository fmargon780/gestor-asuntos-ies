/* ============================================================
   pdf-margenes.js — la cuenta y el PDF nuevo para "Preparar el
   documento" (18-sep-2026, fila 57, docs/HUECO-PARA-SELLO-Y-FIRMA.md).

   Deja libre una banda arriba (para el sello de registro de Séneca) y
   una banda abajo (para la firma digital del director), encogiendo el
   contenido de cada página y recolocándolo dentro de la misma hoja.

   Sin nada de DOM, igual que js/pdf-herramientas.js, para poder
   probarlo sin navegador (pruebas/margenes-pdf.mjs). Usa
   PdfHerramientas.cargarPdfLib y PdfHerramientas.esPdf tal cual, sin
   tocar ese fichero.

   Las páginas giradas (`/Rotate`) se respetan: la escala y el hueco se
   calculan sobre el tamaño VISIBLE de la página (con el ancho y el
   alto ya intercambiados si hace falta), pero el contenido se sigue
   dibujando en el sistema de coordenadas CRUDO de la página (sin
   deshacer el giro): la hoja nueva se crea con el mismo tamaño crudo
   y el mismo `/Rotate` que la original, y solo cambia dónde y a qué
   escala se dibuja el contenido dentro de ese sistema crudo. Así no
   hace falta averiguar cómo `drawPage` compone su propia rotación:
   basta con saber, para cada uno de los cuatro giros posibles, qué
   esquina cruda corresponde a la esquina visible que ya se ha
   calculado (`posicionCruda`, más abajo).

   Aviso conocido (dejado también en docs/CONTEXTO.md): `embedPage` no
   arrastra los enlaces ni las anotaciones de la página original. Para
   los documentos que se registran esto no importa (son papeles para
   sellar).
   ============================================================ */
var PdfMargenes = (function () {

  var CM_EN_PT = 28.3465;

  function errorDeLectura() {
    var error = new Error('Este PDF no se puede abrir: puede que venga protegido o roto.');
    error.name = 'PdfIlegible';
    return error;
  }

  async function abrir(PDFLib, bytes) {
    try { return await PDFLib.PDFDocument.load(bytes); }
    catch (e) { throw errorDeLectura(); }
  }

  /* El ángulo de una página, siempre uno de 0, 90, 180 o 270. */
  function anguloDePagina(pagina) {
    var r = pagina.getRotation();
    var a = (r && typeof r.angle === 'number') ? r.angle : 0;
    a = a % 360;
    if (a < 0) a += 360;
    var validos = [0, 90, 180, 270];
    var mejor = 0, distanciaMinima = Infinity;
    validos.forEach(function (v) {
      var d = Math.abs(a - v);
      if (d < distanciaMinima) { distanciaMinima = d; mejor = v; }
    });
    return mejor;
  }

  /* El tamaño visible de una página (con ancho y alto ya
     intercambiados si el giro es de 90 o 270 grados). */
  function tamanoVisible(pagina) {
    var cruda = pagina.getSize();
    var angulo = anguloDePagina(pagina);
    var girada = (angulo === 90 || angulo === 270);
    return {
      ancho: girada ? cruda.height : cruda.width,
      alto: girada ? cruda.width : cruda.height,
      angulo: angulo,
      anchoCrudo: cruda.width,
      altoCrudo: cruda.height
    };
  }

  /* La cuenta del punto 4 de docs/HUECO-PARA-SELLO-Y-FIRMA.md. Todo en
     puntos PDF. Nunca agranda (escala nunca pasa de 1) y nunca da una
     escala negativa. `cabe` es falso cuando los dos huecos juntos
     pasan de la mitad del alto de la página: ahí no se hace nada. */
  function calcularEncaje(ancho, alto, huecoArriba, huecoAbajo) {
    huecoArriba = huecoArriba || 0;
    huecoAbajo = huecoAbajo || 0;
    var cabe = (huecoArriba + huecoAbajo) <= (alto / 2);
    var altoUtil = alto - huecoArriba - huecoAbajo;
    var escala = Math.max(0, Math.min(1, alto ? (altoUtil / alto) : 0));
    var anchoNuevo = ancho * escala;
    var x = (ancho - anchoNuevo) / 2;
    var y = huecoAbajo + (altoUtil - alto * escala) / 2;
    return { escala: escala, x: x, y: y, cabe: cabe };
  }

  /* Traduce la posición visible (x, y, escala) que ha calculado
     `calcularEncaje` a la posición cruda donde hay que dibujar el
     contenido, según el giro de la página (ver la explicación de
     arriba del fichero). `anchoCrudo`/`altoCrudo` son los de la
     página SIN girar (los que devuelve `getSize()`).

     Fila 349: `contenidoAncho`/`contenidoAlto` (opcionales) son el
     tamaño crudo del contenido que se dibuja, cuando la hoja nueva no
     mide lo mismo que la original (pasar a otro tamaño). Sin ellos, el
     contenido y la hoja miden igual, como en `conHueco`. */
  function posicionCruda(angulo, anchoCrudo, altoCrudo, encaje, contenidoAncho, contenidoAlto) {
    var s = encaje.escala, X = encaje.x, Y = encaje.y;
    var cw = (contenidoAncho === undefined ? anchoCrudo : contenidoAncho) * s;
    var ch = (contenidoAlto === undefined ? altoCrudo : contenidoAlto) * s;
    if (angulo === 90) return { x: anchoCrudo - cw - Y, y: X };
    if (angulo === 270) return { x: Y, y: altoCrudo - ch - X };
    if (angulo === 180) return { x: anchoCrudo - cw - X, y: altoCrudo - ch - Y };
    return { x: X, y: Y };
  }

  /* El PDF nuevo, con el hueco hecho en todas las páginas. Primero se
     calcula el encaje de TODAS las páginas y, si alguna no tiene
     sitio, no se escribe nada (ni siquiera las que sí cabían): se
     lanza un error con nombre 'HuecoNoCabe'. */
  async function conHueco(bytes, huecoArribaCm, huecoAbajoCm) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var origen = await abrir(PDFLib, bytes);
    var huecoArriba = (huecoArribaCm || 0) * CM_EN_PT;
    var huecoAbajo = (huecoAbajoCm || 0) * CM_EN_PT;

    var paginasOrigen = origen.getPages();
    var preparadas = paginasOrigen.map(function (pagina) {
      var visible = tamanoVisible(pagina);
      var encaje = calcularEncaje(visible.ancho, visible.alto, huecoArriba, huecoAbajo);
      return { pagina: pagina, visible: visible, encaje: encaje };
    });

    if (preparadas.some(function (p) { return !p.encaje.cabe; })) {
      var error = new Error('El hueco que pides no cabe en esta hoja. Baja las medidas en Ajustes.');
      error.name = 'HuecoNoCabe';
      throw error;
    }

    var nuevo = await PDFLib.PDFDocument.create();
    for (var i = 0; i < preparadas.length; i++) {
      var p = preparadas[i];
      var paginaNueva = nuevo.addPage([p.visible.anchoCrudo, p.visible.altoCrudo]);
      if (p.visible.angulo) paginaNueva.setRotation(PDFLib.degrees(p.visible.angulo));
      var embebida = await nuevo.embedPage(p.pagina);
      var pos = posicionCruda(p.visible.angulo, p.visible.anchoCrudo, p.visible.altoCrudo, p.encaje);
      paginaNueva.drawPage(embebida, {
        x: pos.x, y: pos.y,
        xScale: p.encaje.escala, yScale: p.encaje.escala
      });
    }
    return nuevo.save();
  }


  /* ---------- Pasar las hojas a otro tamaño (fila 349, docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md) ----------

     Medidas en milímetros: lado corto y lado largo. */
  var TAMANOS = {
    A4: { nombre: 'A4', corto: 210, largo: 297 },
    A3: { nombre: 'A3', corto: 297, largo: 420 },
    A5: { nombre: 'A5', corto: 148, largo: 210 },
    Carta: { nombre: 'Carta', corto: 215.9, largo: 279.4 },
    Oficio: { nombre: 'Oficio', corto: 215.9, largo: 330.2 }
  };
  var ORDEN_TAMANOS = ['A4', 'A3', 'A5', 'Carta', 'Oficio'];
  var MM_EN_PT = 72 / 25.4;
  var MARGEN_GRANDE = 1.1;   /* "más de un 10 % por encima de un A4" */

  /* ¿Esta hoja (ancho y alto visibles, en puntos) es claramente más
     grande que un A4, en cualquier orientación? */
  function esHojaGrande(ancho, alto) {
    var corto = Math.min(ancho, alto) / MM_EN_PT;
    var largo = Math.max(ancho, alto) / MM_EN_PT;
    return corto > TAMANOS.A4.corto * MARGEN_GRANDE || largo > TAMANOS.A4.largo * MARGEN_GRANDE;
  }

  /* El tamaño de destino de una hoja, en puntos, con su misma
     orientación (una hoja apaisada queda apaisada). */
  function destinoDeHoja(ancho, alto, tamano) {
    var t = TAMANOS[tamano] || TAMANOS.A4;
    var corto = t.corto * MM_EN_PT, largo = t.largo * MM_EN_PT;
    return ancho > alto ? { ancho: largo, alto: corto } : { ancho: corto, alto: largo };
  }

  /* ¿La hoja ya cabe entera en ese tamaño? (entonces no se toca: nunca se agranda) */
  function cabeEnTamano(ancho, alto, tamano) {
    var d = destinoDeHoja(ancho, alto, tamano);
    return ancho <= d.ancho + 0.5 && alto <= d.alto + 0.5;
  }

  /* Mira las hojas de un PDF y dice si alguna es claramente más grande
     que un A4. Solo lee: no escribe nada. */
  async function hojasGrandes(bytes) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await abrir(PDFLib, bytes);
    var paginas = doc.getPages();
    var grandes = 0;
    paginas.forEach(function (p) {
      var v = tamanoVisible(p);
      if (esHojaGrande(v.ancho, v.alto)) grandes++;
    });
    return { grandes: grandes > 0, cuantas: grandes, total: paginas.length };
  }

  /* El PDF nuevo con cada hoja pasada a `tamano` ('A4', 'A3'…): el
     contenido se encoge en proporción y queda centrado; la orientación
     se conserva; una hoja que ya cabe no se toca. Las mismas cuentas
     para el cuadro de nombre y para «Ajustar tamaño» del visor. */
  async function pasarATamano(bytes, tamano) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var origen = await abrir(PDFLib, bytes);
    var nuevo = await PDFLib.PDFDocument.create();
    var paginas = origen.getPages();
    for (var i = 0; i < paginas.length; i++) {
      var pagina = paginas[i];
      var v = tamanoVisible(pagina);
      if (cabeEnTamano(v.ancho, v.alto, tamano)) {
        var copiada = (await nuevo.copyPages(origen, [i]))[0];
        nuevo.addPage(copiada);
        continue;
      }
      var d = destinoDeHoja(v.ancho, v.alto, tamano);
      var escala = Math.min(d.ancho / v.ancho, d.alto / v.alto);
      var encaje = {
        escala: escala,
        x: (d.ancho - v.ancho * escala) / 2,
        y: (d.alto - v.alto * escala) / 2
      };
      var crudoAncho = (v.angulo === 90 || v.angulo === 270) ? d.alto : d.ancho;
      var crudoAlto = (v.angulo === 90 || v.angulo === 270) ? d.ancho : d.alto;
      var hoja = nuevo.addPage([crudoAncho, crudoAlto]);
      if (v.angulo) hoja.setRotation(PDFLib.degrees(v.angulo));
      var embebida = await nuevo.embedPage(pagina);
      var pos = posicionCruda(v.angulo, crudoAncho, crudoAlto, encaje, v.anchoCrudo, v.altoCrudo);
      hoja.drawPage(embebida, { x: pos.x, y: pos.y, xScale: escala, yScale: escala });
    }
    return nuevo.save();
  }

  /* Si el PDF ya trae una firma digital: buscando en los propios bytes
     las marcas /ByteRange y /Type /Sig (con o sin espacio), sin
     necesidad de interpretar la estructura entera del fichero. */
  function pareceFirmado(bytes) {
    var trozo = 65536;
    var texto = '';
    for (var i = 0; i < bytes.length; i += trozo) {
      var fin = Math.min(bytes.length, i + trozo);
      texto += String.fromCharCode.apply(null, bytes.slice(i, fin));
    }
    return /\/ByteRange/.test(texto) || /\/Type\s*\/Sig\b/.test(texto);
  }

  return {
    calcularEncaje: calcularEncaje,
    conHueco: conHueco,
    pareceFirmado: pareceFirmado,
    posicionCruda: posicionCruda,
    TAMANOS: TAMANOS,
    ORDEN_TAMANOS: ORDEN_TAMANOS,
    esHojaGrande: esHojaGrande,
    destinoDeHoja: destinoDeHoja,
    cabeEnTamano: cabeEnTamano,
    hojasGrandes: hojasGrandes,
    pasarATamano: pasarATamano,
    CM_EN_PT: CM_EN_PT
  };
})();
window.PdfMargenes = PdfMargenes;
