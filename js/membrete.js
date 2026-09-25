/* ============================================================
   membrete.js — el membrete de los documentos, dibujado entero por la
   aplicación con el manual de la Junta (25-sep-2026, fila 149,
   docs/MEMBRETE-LETRA-DEL-MANUAL.md). Sustituye al de la fila 81, que
   escribía el nombre de la Consejería encima de una imagen subida.

   Lo fijo: el símbolo de la Junta (img/junta-andalucia-simbolo.svg) y
   «Junta de Andalucía» en Noto Sans HK negrita. Lo de Ajustes → El
   centro → Membrete: la Consejería (vacía, «Consejería de Educación»),
   el nombre del centro (el mismo dato `centro` de plantillas.json, en
   MAYÚSCULAS y verde) y, opcional, el logo del centro
   (_GESTOR/PLANTILLAS/logo-centro.png), a la derecha. Cada plantilla de
   documento dice si lleva el logo (`conLogoCentro`; sin la clave, sí).

   `Membrete.componer` es SIN EFECTOS (nada de DOM ni de canvas): dice
   dónde va cada cosa, en píxeles de un lienzo de 2480 × 400, todo en
   proporción a S (la altura del símbolo). Se prueba suelta en
   pruebas/membrete.mjs. Para medir el ancho de un texto recibe una
   función; sin ella, lo estima (0,56 veces el tamaño por carácter).

   La letra (fonts/NotoSansHK-latin-400/700.woff2) y el símbolo se leen
   con `App.leerFicheroDeLaApp`, así que también valen en la copia sin
   internet. Si la letra no carga, se dibuja con Arial; si el símbolo no
   carga, el documento sale sin membrete, como antes sin imagen.
   ============================================================ */
var Membrete = (function () {

  var LIENZO = { ancho: 2480, alto: 400 };
  var S = 270;
  var MARGEN = 60;
  var SIMBOLO_PROPORCION = 670 / 627;   /* ancho / alto del viewBox del SVG */
  var NEGRO = '#221E1B';
  var VERDE = '#017836';
  var POR_DEFECTO_CONSEJERIA = 'Consejería de Educación';
  var FAMILIA = 'MembreteNotoSansHK';
  var FACTOR_ANCHO_CARACTER = 0.56;
  var RUTA_SIMBOLO = 'img/junta-andalucia-simbolo.svg';
  var LOGO = 'logo-centro.png';

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  function estimarAncho(texto, tamano) { return String(texto || '').length * tamano * FACTOR_ANCHO_CARACTER; }

  /* Parte en dos líneas por el espacio que las deje más parejas. */
  function partirEnDosLineas(texto) {
    var palabras = String(texto || '').trim().split(/\s+/);
    if (palabras.length < 2) return [String(texto || '').trim()];
    var mejorCorte = 1, mejorDiferencia = Infinity;
    for (var i = 1; i < palabras.length; i++) {
      var d = Math.abs(palabras.slice(0, i).join(' ').length - palabras.slice(i).join(' ').length);
      if (d < mejorDiferencia) { mejorDiferencia = d; mejorCorte = i; }
    }
    return [palabras.slice(0, mejorCorte).join(' '), palabras.slice(mejorCorte).join(' ')];
  }

  /* Una línea si cabe; si no, dos; si ni así, la letra más pequeña. */
  function ajustar(texto, tamano, peso, anchoMax, medir) {
    var cabe = function (lineas, t) { return lineas.every(function (l) { return medir(l, t, peso) <= anchoMax; }); };
    var una = [texto];
    if (cabe(una, tamano)) return { lineas: una, tamano: tamano };
    var dos = partirEnDosLineas(texto);
    var t = tamano;
    while (t > 4 && !cabe(dos, t)) t -= 0.5;
    return { lineas: dos, tamano: t };
  }

  /* Dónde va cada cosa. `opciones`: { consejeria, centro, logo: { ancho,
     alto } | null, conLogo, medir(texto, tamano, peso) }. */
  function componer(opciones) {
    var o = opciones || {};
    var medir = typeof o.medir === 'function' ? o.medir : estimarAncho;
    var arriba = (LIENZO.alto - S) / 2;
    var simbolo = { x: MARGEN, y: arriba, ancho: S * SIMBOLO_PROPORCION, alto: S };
    var x = simbolo.x + simbolo.ancho + 0.20 * S;
    var anchoMax = 0.72 * LIENZO.ancho - x;
    var salto = 0.20 * S;

    var consejeria = String(o.consejeria || '').trim() || POR_DEFECTO_CONSEJERIA;
    var centro = String(o.centro || '').trim().toUpperCase();
    var k = ajustar(consejeria, 0.144 * S, 400, anchoMax, medir);
    var c = centro ? ajustar(centro, 0.111 * S, 400, anchoMax, medir) : { lineas: [], tamano: 0.111 * S };

    /* De abajo arriba: la última línea del centro, en la base del símbolo;
       las líneas de más suben todo el bloque. */
    var textos = [];
    var base = arriba + S;
    var i;
    for (i = c.lineas.length - 1; i >= 0; i--) {
      textos.unshift({ texto: c.lineas[i], x: x, y: base, tamano: c.tamano, peso: 400, color: VERDE });
      if (i > 0) base -= salto;
    }
    base = c.lineas.length ? base - 0.265 * S : arriba + 0.735 * S;
    var lineasK = [];
    for (i = k.lineas.length - 1; i >= 0; i--) {
      lineasK.unshift({ texto: k.lineas[i], x: x, y: base, tamano: k.tamano, peso: 400, color: NEGRO });
      if (i > 0) base -= salto;
    }
    var junta = { texto: 'Junta de Andalucía', x: x, y: base - 0.27 * S, tamano: 0.244 * S, peso: 700, color: NEGRO };

    var logo = null;
    if (o.conLogo !== false && o.logo && o.logo.ancho > 0 && o.logo.alto > 0) {
      var alto = S + 20;
      var ancho = alto * o.logo.ancho / o.logo.alto;
      if (ancho > 0.25 * LIENZO.ancho) { ancho = 0.25 * LIENZO.ancho; alto = ancho * o.logo.alto / o.logo.ancho; }
      logo = { x: LIENZO.ancho - MARGEN - ancho, y: (LIENZO.alto - alto) / 2, ancho: ancho, alto: alto };
    }

    return { lienzo: { ancho: LIENZO.ancho, alto: LIENZO.alto }, simbolo: simbolo, textos: [junta].concat(lineasK, textos), logo: logo };
  }

  /* ---------- la letra y el símbolo, una sola vez ---------- */

  var promesaLetra = null;
  /* true si la Noto Sans HK está lista; false si hay que tirar de Arial. */
  function cargarLetra() {
    if (promesaLetra) return promesaLetra;
    promesaLetra = (async function () {
      try {
        if (typeof FontFace === 'undefined' || !window.App || !App.leerFicheroDeLaApp) return false;
        var pesos = [400, 700];
        for (var i = 0; i < pesos.length; i++) {
          var bytes = await App.leerFicheroDeLaApp('fonts/NotoSansHK-latin-' + pesos[i] + '.woff2', 'binario');
          var cara = new FontFace(FAMILIA, bytes, { weight: String(pesos[i]) });
          await cara.load();
          document.fonts.add(cara);
        }
        return true;
      } catch (e) { return false; }
    })();
    return promesaLetra;
  }

  function imagenDeBlob(blob) {
    return new Promise(function (resolver, rechazar) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () { resolver(img); setTimeout(function () { URL.revokeObjectURL(url); }, 0); };
      img.onerror = function () { URL.revokeObjectURL(url); rechazar(new Error('No se ha podido leer la imagen.')); };
      img.src = url;
    });
  }

  var promesaSimbolo = null;
  function cargarSimbolo() {
    if (promesaSimbolo) return promesaSimbolo;
    promesaSimbolo = (async function () {
      var bytes = await App.leerFicheroDeLaApp(RUTA_SIMBOLO, 'binario');
      return imagenDeBlob(new Blob([bytes], { type: 'image/svg+xml' }));
    })();
    promesaSimbolo.catch(function () { promesaSimbolo = null; });
    return promesaSimbolo;
  }

  /* ---------- dibujar ---------- */

  /* Dibuja el membrete con estos datos y devuelve `{ bytes, ancho, alto }`
     en PNG. `logo`: un Blob/File o null. Aparte de `montar` para que la
     vista previa de Ajustes use lo que hay escrito, aún sin guardar. */
  async function dibujar(datos) {
    var d = datos || {};
    var simbolo = await cargarSimbolo();
    var conNoto = await cargarLetra();
    var imgLogo = null;
    if (d.logo && d.conLogo !== false) {
      try { imgLogo = await imagenDeBlob(d.logo); } catch (e) { imgLogo = null; }
    }

    var canvas = document.createElement('canvas');
    canvas.width = LIENZO.ancho; canvas.height = LIENZO.alto;
    var ctx = canvas.getContext('2d');
    var familia = conNoto ? FAMILIA + ', Arial, sans-serif' : 'Arial, Helvetica, sans-serif';
    function fuente(tamano, peso) { return peso + ' ' + tamano + 'px ' + familia; }

    var plan = componer({
      consejeria: d.consejeria, centro: d.centro, conLogo: d.conLogo,
      logo: imgLogo ? { ancho: imgLogo.naturalWidth || imgLogo.width, alto: imgLogo.naturalHeight || imgLogo.height } : null,
      medir: function (texto, tamano, peso) { ctx.font = fuente(tamano, peso); return ctx.measureText(texto).width; }
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LIENZO.ancho, LIENZO.alto);
    ctx.drawImage(simbolo, plan.simbolo.x, plan.simbolo.y, plan.simbolo.ancho, plan.simbolo.alto);
    ctx.textBaseline = 'alphabetic';
    plan.textos.forEach(function (t) {
      ctx.font = fuente(t.tamano, t.peso);
      ctx.fillStyle = t.color;
      ctx.fillText(t.texto, t.x, t.y);
    });
    if (plan.logo && imgLogo) ctx.drawImage(imgLogo, plan.logo.x, plan.logo.y, plan.logo.ancho, plan.logo.alto);

    var blob = await new Promise(function (resolver) { canvas.toBlob(resolver, 'image/png'); });
    return { bytes: new Uint8Array(await blob.arrayBuffer()), ancho: LIENZO.ancho, alto: LIENZO.alto, conNoto: conNoto, plan: plan };
  }

  async function carpetaPlantillas() {
    var g = gestor();
    if (!g || !window.Carpetas) return null;
    try { return await Carpetas.crear(g, 'PLANTILLAS'); } catch (e) { return null; }
  }

  /* El logo guardado, como File, o null. */
  async function logoGuardado() {
    var c = await carpetaPlantillas();
    if (!c) return null;
    try {
      if (!(await Carpetas.existeFichero(c, LOGO))) return null;
      return await (await c.getFileHandle(LOGO)).getFile();
    } catch (e) { return null; }
  }

  /* Para generar un documento: lee Ajustes y el logo, y dibuja. Si algo
     falla (sin carpeta, sin símbolo), `null`: el documento sale igual,
     sin membrete. `opciones.conLogoCentro === false` lo deja sin logo. */
  async function montar(opciones) {
    var g = gestor();
    if (!g) return null;
    try {
      var datos = window.Plantillas ? await Plantillas.cargar(g) : {};
      var conLogo = !(opciones && opciones.conLogoCentro === false);
      return await dibujar({
        consejeria: datos.consejeria, centro: datos.centro,
        logo: conLogo ? await logoGuardado() : null, conLogo: conLogo
      });
    } catch (e) { return null; }
  }

  async function guardarLogo(bytesOFile) {
    var c = await carpetaPlantillas();
    if (!c) throw new Error('No hay carpeta de asuntos abiertos señalada.');
    await Carpetas.escribirBytes(c, LOGO, bytesOFile, 'image/png');
  }

  /* A la papelera, como el resto de borrados. */
  async function quitarLogo() {
    var c = await carpetaPlantillas();
    if (!c || !(await Carpetas.existeFichero(c, LOGO))) return;
    if (window.Papelera && Papelera.mandarFichero) await Papelera.mandarFichero(c, LOGO, 'logo', { plantillas: true });
    else await c.removeEntry(LOGO);
  }

  return {
    componer: componer, montar: montar, dibujar: dibujar,
    guardarLogo: guardarLogo, quitarLogo: quitarLogo, logoGuardado: logoGuardado,
    cargarLetra: cargarLetra,
    LIENZO: LIENZO, S: S, POR_DEFECTO_CONSEJERIA: POR_DEFECTO_CONSEJERIA,
    /* para las pruebas */
    _partirEnDosLineas: partirEnDosLineas,
    _olvidarCargas: function () { promesaLetra = null; promesaSimbolo = null; }
  };
})();
window.Membrete = Membrete;

/* ============================================================
   La pantalla, en Ajustes → El centro, bloque "Membrete" (index.html):
   Consejería, nombre del centro (el mismo `centro` de «Datos del centro
   y firma») y el logo, con la vista previa en vivo debajo.
   ============================================================ */
(function () {
  function $(id) { return document.getElementById(id); }

  var logoActual = null;
  var urlVistaPrevia = null;
  var turno = 0;

  async function refrescarVistaPrevia() {
    var caja = $('membrete-vista-previa');
    if (!caja) return;
    var mio = ++turno;
    try {
      var r = await Membrete.dibujar({
        consejeria: ($('membrete-consejeria') || {}).value,
        centro: ($('membrete-centro') || {}).value || (window.Plantillas ? Plantillas.POR_DEFECTO_CENTRO : ''),
        logo: logoActual, conLogo: true
      });
      if (mio !== turno) return;
      if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
      urlVistaPrevia = URL.createObjectURL(new Blob([r.bytes], { type: 'image/png' }));
      caja.innerHTML = '';
      var img = document.createElement('img');
      img.src = urlVistaPrevia;
      img.alt = 'Vista previa del membrete';
      img.className = 'membrete-vista-img';
      caja.appendChild(img);
    } catch (e) {
      if (mio !== turno) return;
      caja.innerHTML = '<span class="aviso-en-vivo">No he podido pintar la vista previa: ' + U.escapar(U.mensajeDeError(e)) + '</span>';
    }
  }

  function pintarEstadoLogo() {
    var estado = $('membrete-logo-estado');
    if (estado) estado.textContent = logoActual ? 'Hay un logo guardado.' : 'Sin logo: la derecha del membrete sale en blanco.';
    var quitar = $('membrete-quitar-logo');
    if (quitar) quitar.classList.toggle('oculto', !logoActual);
  }

  async function elegirLogo() {
    var handle;
    try {
      handle = await Carpetas.elegirFichero(null, [{
        description: 'Imagen', accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }
      }]);
    } catch (e) { return; }   /* cancelado */
    var fichero = await handle.getFile();
    try {
      await Membrete.guardarLogo(fichero);
      logoActual = fichero;
      pintarEstadoLogo();
      U.aviso('Logo guardado.', 'bueno');
    } catch (e) { U.fallo('No he podido guardar el logo', e); return; }
    await refrescarVistaPrevia();
  }

  async function quitarLogo() {
    var ok = await U.preguntar('Quitar el logo del centro', '<p>Va a la papelera. Los documentos saldrán con la derecha del membrete en blanco.</p>', 'Quitar');
    if (!ok) return;
    try {
      await Membrete.quitarLogo();
      logoActual = null;
      pintarEstadoLogo();
      U.aviso('Logo quitado.', 'bueno');
    } catch (e) { U.fallo('No he podido quitar el logo', e); return; }
    await refrescarVistaPrevia();
  }

  async function guardar() {
    var consejeria = $('membrete-consejeria').value.trim();
    var centro = $('membrete-centro').value.trim() || Plantillas.POR_DEFECTO_CENTRO;
    try {
      await U.mientrasGuarda($('membrete-guardar'), function () {
        return Plantillas.guardar(App.E.gestor, function (actual) {
          actual.consejeria = consejeria;
          actual.centro = centro;
          return actual;
        });
      });
      /* El mismo dato que «Datos del centro y firma»: se pone al día allí. */
      if ($('plantillas-centro')) $('plantillas-centro').value = centro;
      U.aviso('Guardado.', 'bueno');
    } catch (e) { U.fallo('No he podido guardarlo', e); }
  }

  async function pintarEnAjustes() {
    if (!$('membrete-consejeria') || !App.E.gestor) return;
    var datos = await Plantillas.cargar(App.E.gestor);
    $('membrete-consejeria').value = datos.consejeria || '';
    $('membrete-consejeria').placeholder = Membrete.POR_DEFECTO_CONSEJERIA;
    $('membrete-centro').value = datos.centro || '';
    logoActual = await Membrete.logoGuardado();
    pintarEstadoLogo();
    $('membrete-elegir-logo').onclick = elegirLogo;
    $('membrete-quitar-logo').onclick = quitarLogo;
    $('membrete-guardar').onclick = guardar;
    ['membrete-consejeria', 'membrete-centro'].forEach(function (id) { $(id).oninput = refrescarVistaPrevia; });
    await refrescarVistaPrevia();
  }

  Membrete.pintarEnAjustes = pintarEnAjustes;
})();
