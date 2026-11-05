/* ============================================================
   carpetas.js — todo lo que toca el disco.

   La aplicación no sube nada a ningún sitio. Trabaja sobre las
   carpetas que el usuario ha señalado, con el permiso que le da
   el navegador.
   ============================================================ */
var Carpetas = (function () {
  var I = window.CarpetasNucleo;
  function soportado() { return I.soportado.apply(this, arguments); }
  function elegir() { return I.elegir.apply(this, arguments); }
  function permiso() { return I.permiso.apply(this, arguments); }
  function subcarpetas() { return I.subcarpetas.apply(this, arguments); }
  function ficheros() { return I.ficheros.apply(this, arguments); }
  function contenido() { return I.contenido.apply(this, arguments); }
  function esCarpetaTemporalDeSincronizacion() { return I.esCarpetaTemporalDeSincronizacion.apply(this, arguments); }
  function noSeCopia() { return I.noSeCopia.apply(this, arguments); }
  function existe() { return I.existe.apply(this, arguments); }
  function crear() { return I.crear.apply(this, arguments); }
  function bajar() { return I.bajar.apply(this, arguments); }
  function marcar() { return I.marcar.apply(this, arguments); }
  function contarFicheros() { return I.contarFicheros.apply(this, arguments); }
  function trasladar() { return I.trasladar.apply(this, arguments); }
  function existeFichero() { return I.existeFichero.apply(this, arguments); }
  function fechaFichero() { return I.fechaFichero.apply(this, arguments); }
  function nombreLibreConSufijo() { return I.nombreLibreConSufijo.apply(this, arguments); }
  function fusionarEn() { return I.fusionarEn.apply(this, arguments); }
  function mover() { return I.mover.apply(this, arguments); }
  function renombrar() { return I.renombrar.apply(this, arguments); }
  function fusionarEnOcupado() { return I.fusionarEnOcupado.apply(this, arguments); }
  function renombrarFichero() { return I.renombrarFichero.apply(this, arguments); }
  function avisarEscritura() { return I.avisarEscritura.apply(this, arguments); }
  function moverFichero() { return I.moverFichero.apply(this, arguments); }
  function elegirFichero() { return I.elegirFichero.apply(this, arguments); }
  function copiarFicheroEn() { return I.copiarFicheroEn.apply(this, arguments); }

  /* ---------- ficheros de texto ---------- */

  /* Reintenta si Dropbox está tocando el fichero justo al leerlo
     (NotReadableError, fila 99, docs/GUARDAR-EN-FILA.md): antes, eso
     tumbaba el segundo paso de las acciones encadenadas. */
  function leerTextoSinMedir(dir, nombre) {
    if (window.Reintentar && window.Reintentar.lectura) {
      return window.Reintentar.lectura(function () { return leerTextoUnaVez(dir, nombre); });
    }
    return leerTextoUnaVez(dir, nombre);
  }
  var leerTexto = window.Medidas ? Medidas.fichero('leer', leerTextoSinMedir) : leerTextoSinMedir;   /* fila 332: cuánto tarda */

  async function leerTextoUnaVez(dir, nombre) {
    try {
      var h = await dir.getFileHandle(nombre);
      var f = await h.getFile();
      var buffer = await f.arrayBuffer();
      /* Los CSV de Séneca vienen en cp1252, no en UTF-8. Si al leerlos como
         UTF-8 salen caracteres rotos, se reintenta con Windows-1252. */
      var texto = new TextDecoder('utf-8').decode(buffer);
      if (texto.indexOf('�') !== -1) {
        texto = new TextDecoder('windows-1252').decode(buffer);
      }
      return texto;
    } catch (e) {
      if (e.name === 'NotFoundError') return null;
      throw e;
    }
  }

  /* Reintenta si Dropbox está sincronizando esta misma carpeta en este
     instante (fila 90, docs/ARCHIVAR-SIN-AVISOS-FALSOS.md, js/reintentar-escritura.js).
     Si el módulo no se ha cargado, escribe sin reintento: nunca un
     «Reintentar is not defined» que deja la aplicación sin poder guardar
     nada (fila 92, docs/NADA-SE-GUARDA-REINTENTAR.md). */
  function conReintento(intento, dir, nombre) {
    if (window.Reintentar && window.Reintentar.escritura) return window.Reintentar.escritura(intento, dir, nombre);
    return intento();
  }

  function escribirTextoSinMedir(dir, nombre, texto) {
    return conReintento(async function () {
      var h = await dir.getFileHandle(nombre, { create: true });
      var w = await h.createWritable();
      await w.write(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
      await w.close();
      return true;
    }, dir, nombre);
  }
  var escribirTexto = window.Medidas ? Medidas.fichero('escribir', escribirTextoSinMedir) : escribirTextoSinMedir;   /* fila 332 */

  /* Como escribirTexto, pero para bytes cualquiera: un PDF nuevo, por
     ejemplo (17-sep-2026, fila 22, separar y unir PDF). */
  function escribirBytesSinMedir(dir, nombre, bytes, tipo) {
    return conReintento(async function () {
      var h = await dir.getFileHandle(nombre, { create: true });
      var w = await h.createWritable();
      await w.write(new Blob([bytes], { type: tipo || 'application/octet-stream' }));
      await w.close();
      await avisarEscritura(dir, nombre);
      return true;
    }, dir, nombre);
  }
  var escribirBytes = window.Medidas ? Medidas.fichero('escribir', escribirBytesSinMedir) : escribirBytesSinMedir;   /* fila 332 */

  /* Distingue "no existe" de "no se puede leer". Sin fichero devuelve null
     (lo normal la primera vez). Si está pero no es JSON (un corte a mitad de
     guardar, un conflicto de Dropbox mal resuelto a mano) se lanza un error
     FicheroRoto en vez de devolver null: así el siguiente guardado no lo
     escribe encima y no se pierde todo. */
  async function leerJson(dir, nombre) {
    var t = await leerTexto(dir, nombre);
    if (t === null) return null;
    try { return JSON.parse(t); }
    catch (e) {
      var error = new Error('El fichero ' + nombre + ' no se puede leer: ' + e.message);
      error.name = 'FicheroRoto';
      error.fichero = nombre;
      throw error;
    }
  }

  /* Los dos ficheros grandes se guardan sin sangría (fila 99): pesan
     bastante menos y Dropbox tarda menos en subirlos. Leerlos no
     cambia. */
  var SIN_SANGRIA = ['asuntos.json', 'hitos.json'];

  function guardarJson(dir, nombre, objeto) {
    var sangria = SIN_SANGRIA.indexOf(nombre) === -1 ? 2 : 0;
    return escribirTexto(dir, nombre, JSON.stringify(objeto, null, sangria));
  }

  return {
    soportado: soportado, elegir: elegir, permiso: permiso,
    subcarpetas: subcarpetas, ficheros: ficheros, contenido: contenido, existe: existe,
    esCarpetaTemporalDeSincronizacion: esCarpetaTemporalDeSincronizacion,
    marcar: marcar, noSeCopia: noSeCopia, crear: crear, bajar: bajar, mover: mover, renombrar: renombrar, trasladar: trasladar,
    fusionarEn: fusionarEnOcupado, contarFicheros: contarFicheros,
    existeFichero: existeFichero, fechaFichero: fechaFichero, nombreLibreConSufijo: nombreLibreConSufijo,
    renombrarFichero: renombrarFichero, moverFichero: moverFichero,
    elegirFichero: elegirFichero, copiarFicheroEn: copiarFicheroEn,
    leerTexto: leerTexto, escribirTexto: escribirTexto, escribirBytes: escribirBytes,
    leerJson: leerJson, guardarJson: guardarJson
  };
})();
