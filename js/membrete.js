/* ============================================================
   membrete.js — el membrete del centro, sin el nombre de la
   Consejería dentro de la imagen (20-sep-2026, fila 81,
   docs/FIRMANTES-Y-MEMBRETE.md).

   La imagen se sube una vez, en Ajustes → El centro, y se guarda tal
   cual en _GESTOR/PLANTILLAS/membrete.png (la única vez que la
   aplicación escribe en esa carpeta: el resto sigue siendo solo
   lectura). El nombre de la Consejería se escribe ENCIMA, con
   `Membrete.montar()`, a partir de lo que diga Ajustes: así, cuando la
   Consejería cambie de nombre, basta con corregir una línea de texto,
   sin rehacer ninguna imagen.

   `Membrete.medir` es una función SIN EFECTOS (nada de DOM ni de
   canvas): calcula el tamaño de letra y, si no cabe ni al mínimo,
   las dos líneas en las que partir el texto. Se prueba suelta en
   pruebas/membrete.mjs. Como no hay una fuente de verdad delante (ni
   en Node ni pensada para depender de un <canvas>), el ancho del
   texto se estima con un factor medio de una tipografía de palo seco
   (Arial/Helvetica): cada carácter, unas 0,52 veces el tamaño de la
   letra. Es una aproximación a propósito: sobra para decidir "cabe" o
   "no cabe" sin arrastrar aquí toda la máquina de pintar.
   ============================================================ */
var Membrete = (function () {

  var FACTOR_ANCHO_CARACTER = 0.52;
  var MINIMO_PROPORCION = 0.55;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  function anchoAproximado(texto, tamano) {
    return String(texto || '').length * tamano * FACTOR_ANCHO_CARACTER;
  }

  /* El punto donde partir en dos líneas más parejas posible, por un
     espacio (nunca a mitad de palabra). Sin ningún espacio, no hay
     dónde partir: se deja como una sola línea, aunque no quepa del
     todo (mejor que partir una palabra por la mitad). */
  function partirEnDosLineas(texto) {
    var palabras = String(texto || '').trim().split(/\s+/);
    if (palabras.length < 2) return [texto];
    var mejorCorte = 1, mejorDiferencia = Infinity;
    for (var i = 1; i < palabras.length; i++) {
      var izq = palabras.slice(0, i).join(' ');
      var der = palabras.slice(i).join(' ');
      var diferencia = Math.abs(izq.length - der.length);
      if (diferencia < mejorDiferencia) { mejorDiferencia = diferencia; mejorCorte = i; }
    }
    return [palabras.slice(0, mejorCorte).join(' '), palabras.slice(mejorCorte).join(' ')];
  }

  /* `caja` es la de docs/FIRMANTES-Y-MEMBRETE.md (Plantillas.HUECOS
     no la toca; vive en plantillas.json como `membreteCaja`): `{ x, y,
     ancho, alto }`, todo en % del ancho o del alto de la imagen.
     Devuelve `{ tamano, lineas }`, con `tamano` en píxeles de la
     imagen (no en %: quien pinta ya sabe el tamaño real). */
  function medir(texto, caja, anchoImagen, altoImagen) {
    var maximo = (caja.alto / 100) * altoImagen;
    var minimo = maximo * MINIMO_PROPORCION;
    var anchoMaximo = (caja.ancho / 100) * anchoImagen;

    for (var tamano = maximo; tamano >= minimo; tamano -= 1) {
      if (anchoAproximado(texto, tamano) <= anchoMaximo) return { tamano: tamano, lineas: [String(texto || '')] };
    }
    if (anchoAproximado(texto, minimo) <= anchoMaximo) return { tamano: minimo, lineas: [String(texto || '')] };
    return { tamano: minimo, lineas: partirEnDosLineas(texto) };
  }

  /* Dibuja `blob` (la imagen tal cual, un File o un Blob) en un
     `<canvas>` de su propio tamaño, con `consejeria` escrita encima
     según `caja`, y devuelve `{ bytes, ancho, alto }` en PNG. Aparte de
     `montar` (que lee todo de disco) para que la vista previa en vivo
     de Ajustes pueda usar la imagen y los valores TODAVÍA SIN GUARDAR
     del formulario, sin tener que guardar primero para verla. */
  async function dibujar(blob, consejeria, caja) {
    var bitmap = await createImageBitmap(blob);
    var ancho = bitmap.width, alto = bitmap.height;

    var canvas = document.createElement('canvas');
    canvas.width = ancho; canvas.height = alto;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    var texto = String(consejeria || '').trim();
    if (texto) {
      var m = medir(texto, caja, ancho, alto);
      var x = (caja.x / 100) * ancho;
      var yBase = (caja.y / 100) * alto;
      ctx.fillStyle = '#1E1A1E';
      ctx.textBaseline = 'alphabetic';
      ctx.font = m.tamano + 'px Arial, Helvetica, sans-serif';
      if (m.lineas.length === 1) {
        ctx.fillText(m.lineas[0], x, yBase);
      } else {
        var salto = m.tamano * 1.15;
        ctx.fillText(m.lineas[0], x, yBase - salto / 2);
        ctx.fillText(m.lineas[1], x, yBase + salto / 2);
      }
    }

    var blobSalida = await new Promise(function (resolver) { canvas.toBlob(resolver, 'image/png'); });
    var bytes = new Uint8Array(await blobSalida.arrayBuffer());
    return { bytes: bytes, ancho: ancho, alto: alto };
  }

  /* Lee _GESTOR/PLANTILLAS/membrete.png y los ajustes de
     plantillas.json, y devuelve `{ bytes, ancho, alto }` en PNG, con
     el nombre de la Consejería ya escrito encima. Si no hay imagen
     guardada, o no hay carpeta señalada, devuelve `null`: quien llama
     sigue sin membrete, sin que nada falle. */
  async function montar() {
    var g = gestor();
    if (!g || !window.Carpetas) return null;
    var carpetaPlantillas;
    try { carpetaPlantillas = await Carpetas.crear(g, 'PLANTILLAS'); } catch (e) { return null; }
    if (!(await Carpetas.existe(carpetaPlantillas, 'membrete.png'))) return null;

    var handle = await carpetaPlantillas.getFileHandle('membrete.png');
    var fichero = await handle.getFile();

    var datos = window.Plantillas ? await Plantillas.cargar(g) : { consejeria: '', membreteCaja: null };
    var caja = datos.membreteCaja || (window.Plantillas ? Plantillas.POR_DEFECTO_MEMBRETE_CAJA : { x: 10.3, y: 43.2, ancho: 20.7, alto: 10 });

    return dibujar(fichero, datos.consejeria, caja);
  }

  /* Guarda la imagen elegida en Ajustes tal cual, sin tocarla: el
     nombre de la Consejería se escribe encima solo al generar un
     documento (`montar`), nunca sobre el propio `membrete.png`. */
  async function guardarImagen(bytesOFile) {
    var g = gestor();
    if (!g || !window.Carpetas) throw new Error('No hay carpeta de asuntos abiertos señalada.');
    var carpetaPlantillas = await Carpetas.crear(g, 'PLANTILLAS');
    await Carpetas.escribirBytes(carpetaPlantillas, 'membrete.png', bytesOFile, 'image/png');
  }

  async function hayImagen() {
    var g = gestor();
    if (!g || !window.Carpetas) return false;
    try {
      var carpetaPlantillas = await Carpetas.crear(g, 'PLANTILLAS');
      return await Carpetas.existe(carpetaPlantillas, 'membrete.png');
    } catch (e) { return false; }
  }

  /* La imagen ya guardada, como File (un Blob), o `null`. Para la
     vista previa en vivo de Ajustes: así no hace falta volver a elegir
     el fichero solo para ver el resultado de cambiar un número. */
  async function imagenGuardada() {
    var g = gestor();
    if (!g || !window.Carpetas) return null;
    try {
      var carpetaPlantillas = await Carpetas.crear(g, 'PLANTILLAS');
      if (!(await Carpetas.existe(carpetaPlantillas, 'membrete.png'))) return null;
      var handle = await carpetaPlantillas.getFileHandle('membrete.png');
      return await handle.getFile();
    } catch (e) { return null; }
  }

  return {
    medir: medir, montar: montar, dibujar: dibujar,
    guardarImagen: guardarImagen, hayImagen: hayImagen, imagenGuardada: imagenGuardada,
    /* para las pruebas */
    _partirEnDosLineas: partirEnDosLineas
  };
})();
window.Membrete = Membrete;

/* ============================================================
   La pantalla, en Ajustes → El centro, bloque "Membrete" (index.html,
   `details` estático, como "Datos del centro y firma"). Mismo criterio
   que js/cargos.js: el modelo y su pantalla en un solo fichero.
   ============================================================ */
(function () {
  function $(id) { return document.getElementById(id); }

  var imagenActual = null;   /* File/Blob todavía sin guardar, o ya guardada */
  var urlVistaPrevia = null;

  function cajaDelFormulario() {
    return {
      x: parseFloat(($('membrete-caja-x') || {}).value) || 0,
      y: parseFloat(($('membrete-caja-y') || {}).value) || 0,
      ancho: parseFloat(($('membrete-caja-ancho') || {}).value) || 0,
      alto: parseFloat(($('membrete-caja-alto') || {}).value) || 0
    };
  }

  async function refrescarVistaPrevia() {
    var caja2 = $('membrete-vista-previa');
    if (!caja2) return;
    if (!imagenActual) { caja2.innerHTML = '<span class="suave">Sin imagen todavía.</span>'; return; }
    try {
      var resultado = await Membrete.dibujar(imagenActual, ($('membrete-consejeria') || {}).value, cajaDelFormulario());
      if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
      urlVistaPrevia = URL.createObjectURL(new Blob([resultado.bytes], { type: 'image/png' }));
      caja2.innerHTML = '';
      var img = document.createElement('img');
      img.src = urlVistaPrevia;
      img.style.maxWidth = '100%';
      img.style.border = '1px solid #ccc';
      caja2.appendChild(img);
    } catch (e) {
      caja2.innerHTML = '<span class="aviso-en-vivo">No he podido pintar la vista previa: ' + U.escapar(U.mensajeDeError(e)) + '</span>';
    }
  }

  async function elegirImagen() {
    var handle;
    try {
      handle = await Carpetas.elegirFichero(null, [{
        description: 'Imagen', accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }
      }]);
    } catch (e) { return; }   /* cancelado */
    var fichero = await handle.getFile();
    try {
      await Membrete.guardarImagen(fichero);
      imagenActual = fichero;
      $('membrete-estado').textContent = 'Imagen guardada. Puedes cambiarla cuando quieras.';
      await refrescarVistaPrevia();
      U.aviso('Membrete guardado.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function guardarConsejeria() {
    var caja2 = cajaDelFormulario();
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.consejeria = $('membrete-consejeria').value.trim();
        actual.membreteCaja = caja2;
        return actual;
      });
      U.aviso('Guardado.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function pintarEnAjustes() {
    if (!$('membrete-elegir-imagen') || !App.E.gestor) return;

    imagenActual = await Membrete.imagenGuardada();
    $('membrete-estado').textContent = imagenActual
      ? 'Imagen guardada. Puedes cambiarla cuando quieras.'
      : 'Todavía no se ha subido ninguna imagen.';

    var datos = await Plantillas.cargar(App.E.gestor);
    $('membrete-consejeria').value = datos.consejeria || '';
    var caja2 = datos.membreteCaja || Plantillas.POR_DEFECTO_MEMBRETE_CAJA;
    $('membrete-caja-x').value = caja2.x;
    $('membrete-caja-y').value = caja2.y;
    $('membrete-caja-ancho').value = caja2.ancho;
    $('membrete-caja-alto').value = caja2.alto;

    $('membrete-elegir-imagen').onclick = elegirImagen;
    $('membrete-guardar').onclick = guardarConsejeria;
    ['membrete-consejeria', 'membrete-caja-x', 'membrete-caja-y', 'membrete-caja-ancho', 'membrete-caja-alto']
      .forEach(function (id) { $(id).oninput = refrescarVistaPrevia; });

    await refrescarVistaPrevia();
  }

  Membrete.pintarEnAjustes = pintarEnAjustes;
})();
