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
     página SIN girar (los que devuelve `getSize()`). */
  function posicionCruda(angulo, anchoCrudo, altoCrudo, encaje) {
    var s = encaje.escala, X = encaje.x, Y = encaje.y;
    if (angulo === 90) return { x: anchoCrudo * (1 - s) - Y, y: X };
    if (angulo === 270) return { x: Y, y: altoCrudo * (1 - s) - X };
    if (angulo === 180) return { x: anchoCrudo * (1 - s) - X, y: altoCrudo * (1 - s) - Y };
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
    CM_EN_PT: CM_EN_PT
  };
})();
window.PdfMargenes = PdfMargenes;
