/* ============================================================
   carpetas-ficheros.js — mover y renombrar carpetas y ficheros sueltos (fila 535: trozo de js/carpetas.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga después de js/carpetas-copiar.js y antes de js/carpetas.js.
   ============================================================ */
(function () {

  var I = window.CarpetasNucleo = window.CarpetasNucleo || {};
  function trasladar() { return I.trasladar.apply(this, arguments); }
  function fusionarEn() { return I.fusionarEn.apply(this, arguments); }

  /* Un traslado de carpeta cuenta como "guardado en marcha" (fila 99):
     mientras dura, las tareas de fondo no miran la carpeta, y no ven
     desaparecer un asunto que se está archivando. */
  function comoOcupado(fn) {
    return window.ColaGuardado ? window.ColaGuardado.ocupado(fn) : fn();
  }

  function mover(padreOrigen, nombre, padreDestino) {
    return comoOcupado(function () { return trasladar(padreOrigen, nombre, padreDestino, nombre); });
  }

  function renombrar(padre, nombre, nombreNuevo) {
    if (nombre === nombreNuevo) return Promise.resolve(0);
    return comoOcupado(function () { return trasladar(padre, nombre, padre, nombreNuevo); });
  }

  function fusionarEnOcupado(padreOrigen, nombre, padreDestino, nombreDestino) {
    return comoOcupado(function () { return fusionarEn(padreOrigen, nombre, padreDestino, nombreDestino); });
  }

  /* ---------- ficheros sueltos ----------

     Cambiar el nombre de un fichero.

     Lo rápido es pedírselo al navegador con move(), pero move() no
     funciona en todas partes: en carpetas sincronizadas con Dropbox o
     con OneDrive, Chrome lo rechaza con "The request is not allowed by
     the user agent or the platform in the current context". Cuando eso
     pasa se hace a mano: se copia el fichero con el nombre nuevo, se
     comprueba que la copia pesa lo mismo, y solo entonces se borra el
     original. Si la copia no cuadra, se deshace y no se borra nada. */
  async function renombrarFichero(dir, nombre, nombreNuevo) {
    if (nombre === nombreNuevo) return true;
    var h = await dir.getFileHandle(nombre);

    if (typeof h.move === 'function') {
      try {
        await h.move(nombreNuevo);
        await avisarEscritura(dir, nombre, nombreNuevo);
        return true;
      } catch (e) { /* no se puede aquí: se copia y se borra */ }
    }

    var f = await h.getFile();
    var salida = await dir.getFileHandle(nombreNuevo, { create: true });
    var w = await salida.createWritable();
    await w.write(f);
    await w.close();

    var copia = await (await dir.getFileHandle(nombreNuevo)).getFile();
    if (copia.size !== f.size) {
      try { await dir.removeEntry(nombreNuevo); } catch (e2) {}
      throw new Error('La copia no ha salido completa. No se ha borrado el original.');
    }

    await dir.removeEntry(nombre);
    await avisarEscritura(dir, nombre, nombreNuevo);
    return true;
  }

  /* Fila 478: si la app escribe, renombra o mueve un PDF, la copia de seguridad de su «Ruta»
     (js/ruta-copia.js) ya no vale y se borra. */
  async function avisarEscritura(dir) {
    if (!window.RutaCopia) return;
    for (var i = 1; i < arguments.length; i++) await window.RutaCopia.alEscribir(dir, arguments[i]);
  }

  /* Lleva un fichero suelto dentro de otra carpeta.

     Misma precaución que al renombrar: primero se prueba con move(), y
     si Dropbox no lo permite se copia, se comprueba que la copia pesa
     lo mismo, y solo entonces se borra el original. */
  /* `opciones.toleraNoBorrar` (fila 449): si la copia sale completa y no se puede borrar el original
     (tras reintentarlo una vez), no se lanza error: devuelve 'sin-borrar' en vez de true. */
  async function moverFichero(dirOrigen, nombre, dirDestino, nombreDestino, opciones) {
    var destino = nombreDestino || nombre;
    var h = await dirOrigen.getFileHandle(nombre);

    if (typeof h.move === 'function') {
      try {
        await h.move(dirDestino, destino);
        await avisarEscritura(dirOrigen, nombre);
        await avisarEscritura(dirDestino, destino);
        return true;
      } catch (e) { /* no se puede aquí: se copia y se borra */ }
    }

    var f = await h.getFile();
    var salida = await dirDestino.getFileHandle(destino, { create: true });
    var w = await salida.createWritable();
    await w.write(f);
    await w.close();

    var copia = await (await dirDestino.getFileHandle(destino)).getFile();
    if (copia.size !== f.size) {
      try { await dirDestino.removeEntry(destino); } catch (e2) {}
      throw new Error('La copia no ha salido completa. No se ha borrado el original.');
    }

    try {
      await dirOrigen.removeEntry(nombre);
    } catch (e3) {
      try { await dirOrigen.removeEntry(nombre); } catch (e4) {
        if (opciones && opciones.toleraNoBorrar) return 'sin-borrar';
        throw e4;
      }
    }
    await avisarEscritura(dirOrigen, nombre);
    await avisarEscritura(dirDestino, destino);
    return true;
  }

  /* Abre el cuadro de "Abrir archivo" de Windows para traer un documento
     desde donde esté: Descargas, el escritorio, un pendrive.

     `carpetaInicio`, si se conoce, es el manejador de la carpeta donde
     se abre el explorador (17-sep-2026, fila 20): la del asunto cuando
     se está en un asunto, y así. Sin ella, se abre donde el navegador
     quiera, como siempre. */
  async function elegirFichero(carpetaInicio, tipos) {
    var opciones = { multiple: false };
    if (carpetaInicio) opciones.startIn = carpetaInicio;
    /* 20-sep-2026, fila 81: para elegir la imagen del membrete, sin
       mezclarla con cualquier fichero (`tipos` es el `types` de
       showOpenFilePicker, por ejemplo para PNG/JPG). */
    if (tipos) opciones.types = tipos;
    var lista = await window.showOpenFilePicker(opciones);
    return lista[0];
  }

  /* Guarda una copia del fichero elegido dentro de la carpeta, con el
     nombre que se le haya montado. El original no se toca. */
  async function copiarFicheroEn(dir, ficheroHandle, nombreNuevo) {
    var f = await ficheroHandle.getFile();
    var salida = await dir.getFileHandle(nombreNuevo, { create: true });
    var w = await salida.createWritable();
    await w.write(f);
    await w.close();
    await avisarEscritura(dir, nombreNuevo);
    return f.name;
  }

  I.mover = mover;
  I.renombrar = renombrar;
  I.fusionarEnOcupado = fusionarEnOcupado;
  I.renombrarFichero = renombrarFichero;
  I.avisarEscritura = avisarEscritura;
  I.moverFichero = moverFichero;
  I.elegirFichero = elegirFichero;
  I.copiarFicheroEn = copiarFicheroEn;
})();
