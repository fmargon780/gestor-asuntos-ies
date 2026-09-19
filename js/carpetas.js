/* ============================================================
   carpetas.js — todo lo que toca el disco.

   La aplicación no sube nada a ningún sitio. Trabaja sobre las
   carpetas que el usuario ha señalado, con el permiso que le da
   el navegador.
   ============================================================ */
var Carpetas = (function () {

  function soportado() {
    return typeof window.showDirectoryPicker === 'function';
  }

  /* Abre el cuadro de Windows para señalar una carpeta. */
  function elegir(id) {
    return window.showDirectoryPicker({ id: id, mode: 'readwrite' });
  }

  /* ¿Seguimos teniendo permiso sobre esta carpeta?
     'pedir' a true muestra el cuadro del navegador; solo vale si el
     usuario acaba de pulsar algo. */
  function permiso(dir, pedir) {
    var opciones = { mode: 'readwrite' };
    return dir.queryPermission(opciones).then(function (estado) {
      if (estado === 'granted') return true;
      if (!pedir) return false;
      return dir.requestPermission(opciones).then(function (e) { return e === 'granted'; });
    });
  }

  /* ---------- listar ---------- */

  function porNombre(a, b) {
    return a.nombre < b.nombre ? -1 : (a.nombre > b.nombre ? 1 : 0);
  }

  async function subcarpetas(dir) {
    var lista = [];
    for await (var pareja of dir.entries()) {
      if (pareja[1].kind === 'directory') lista.push({ nombre: pareja[0], handle: pareja[1] });
    }
    lista.sort(porNombre);
    return lista;
  }

  async function ficheros(dir) {
    var lista = [];
    for await (var pareja of dir.entries()) {
      if (pareja[1].kind === 'file') lista.push({ nombre: pareja[0], handle: pareja[1] });
    }
    lista.sort(porNombre);
    return lista;
  }

  /* Lo que hay en una carpeta, carpetas y ficheros, en una sola pasada.

     La pantalla de asuntos abiertos necesita las dos cosas a la vez, y
     se relee cada poco para ver si ha llegado algo nuevo. Aquí solo se
     leen los nombres: no se abre ningún fichero. */
  async function contenido(dir) {
    var carpetas = [], sueltos = [];
    for await (var pareja of dir.entries()) {
      var ficha = { nombre: pareja[0], handle: pareja[1] };
      if (pareja[1].kind === 'directory') carpetas.push(ficha);
      else sueltos.push(ficha);
    }
    carpetas.sort(porNombre);
    sueltos.sort(porNombre);
    return { carpetas: carpetas, ficheros: sueltos };
  }

  /* Google Drive y Dropbox dejan carpetas propias al sincronizar, que
     la aplicación estaba tomando por carpetas de asunto. Aquí, en un
     solo sitio, para poder ampliar la lista sin buscarla por el
     código: empiezan por un punto o una virgulilla (cubre .tmp,
     .~lock, .dropbox, .driveupload, .tmp.driveupload,
     .tmp.drivedownload y .DS_Store), o son de los nombres y trozos de
     siempre. */
  var NOMBRES_CARPETA_TEMPORAL = ['desktop.ini', 'icon\r'];

  function esCarpetaTemporalDeSincronizacion(nombre) {
    var n = String(nombre || '');
    if (!n) return true;
    var c = n.charAt(0);
    if (c === '.' || c === '~') return true;
    var min = n.toLowerCase();
    if (NOMBRES_CARPETA_TEMPORAL.indexOf(min) !== -1) return true;
    return min.indexOf('conflicted copy') !== -1;
  }

  async function existe(dir, nombre) {
    try { await dir.getDirectoryHandle(nombre); return true; }
    catch (e) { return false; }
  }

  /* ---------- crear ---------- */

  function crear(dir, nombre) {
    return dir.getDirectoryHandle(nombre, { create: true });
  }

  /* Baja por una ruta de carpetas, creando las que falten.
     ruta es una lista: ['ALUMNADO', 'Pérez García, Ana 1234']. */
  async function bajar(dir, ruta, crearlas) {
    var actual = dir;
    for (var i = 0; i < ruta.length; i++) {
      if (!ruta[i]) continue;
      actual = await actual.getDirectoryHandle(ruta[i], { create: !!crearlas });
    }
    return actual;
  }

  /* ---------- mover y renombrar carpetas ---------- */

  function esperarMs(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* Dropbox mueve y borra ficheros temporales mientras sincroniza: un
     `getFile()` puede pillar uno a medio camino y lanzar NotFoundError
     aunque el fichero exista de verdad un instante después. Se
     reintenta una vez, tras esperar un segundo; si sigue sin estar, se
     para con un error en castellano que dice el nombre del fichero
     (17-sep-2026, fila 45: antes salía el NotFoundError del navegador,
     en inglés). Lo usan `copiarDentro` y la fusión. */
  async function leerFicheroParaCopiar(h, nombre) {
    try {
      return await h.getFile();
    } catch (e) {
      if (e.name !== 'NotFoundError') throw e;
    }
    await esperarMs(1000);
    try {
      return await h.getFile();
    } catch (e2) {
      throw new Error('No he podido copiar "' + nombre + '": ha desaparecido a mitad de la copia ' +
        '(seguramente Dropbox estaba sincronizando). No se ha borrado nada.');
    }
  }

  async function copiarDentro(origen, destino) {
    var copiados = 0;
    for await (var pareja of origen.entries()) {
      var nombre = pareja[0], h = pareja[1];
      if (esCarpetaTemporalDeSincronizacion(nombre)) continue;
      if (h.kind === 'file') {
        var f = await leerFicheroParaCopiar(h, nombre);
        var salida = await destino.getFileHandle(nombre, { create: true });
        var w = await salida.createWritable();
        await w.write(f);
        await w.close();
        copiados++;
      } else {
        var sub = await destino.getDirectoryHandle(nombre, { create: true });
        copiados += await copiarDentro(h, sub);
      }
    }
    return copiados;
  }

  async function contarFicheros(dir) {
    var n = 0;
    for await (var pareja of dir.entries()) {
      if (esCarpetaTemporalDeSincronizacion(pareja[0])) continue;
      if (pareja[1].kind === 'file') n++;
      else n += await contarFicheros(pareja[1]);
    }
    return n;
  }

  /* Lleva una carpeta entera a otro sitio, o le cambia el nombre.

     El navegador no sabe mover carpetas, así que se copia todo, se
     comprueba que ha llegado igual, y solo entonces se borra el original.
     Si algo falla por el camino, el original sigue donde estaba. */
  async function trasladar(padreOrigen, nombre, padreDestino, nombreDestino) {
    var origen = await padreOrigen.getDirectoryHandle(nombre);
    if (await existe(padreDestino, nombreDestino)) {
      throw new Error('Ya hay una carpeta llamada "' + nombreDestino + '" en el destino.');
    }
    var esperados = await contarFicheros(origen);
    /* La carpeta de destino es nuestra: la hemos creado nosotros justo
       arriba, después de comprobar que no existía. Si algo falla a
       partir de aquí (Dropbox sincronizando, un fichero bloqueado), se
       limpia lo que se haya llegado a copiar: si no, el siguiente
       intento se encuentra esa carpeta a medias y ya no puede archivar
       nunca más (17-sep-2026, fila 32, un asunto real se quedó así). */
    try {
      var destino = await padreDestino.getDirectoryHandle(nombreDestino, { create: true });
      await copiarDentro(origen, destino);
      var llegados = await contarFicheros(destino);
      if (llegados !== esperados) {
        throw new Error('La copia no ha salido completa (' + llegados + ' de ' + esperados +
                        ' ficheros). No se ha borrado nada: la carpeta sigue donde estaba.');
      }
    } catch (e) {
      try { await padreDestino.removeEntry(nombreDestino, { recursive: true }); } catch (e2) { /* si no se puede limpiar, se lanza igual el error de arriba */ }
      throw e;
    }
    await padreOrigen.removeEntry(nombre, { recursive: true });
    return esperados;
  }

  /* ---------- fusionar dos carpetas ----------

     Para cuando el destino de un archivado (o de una reapertura) ya
     existe: casi siempre, un archivado anterior que se quedó a medias
     antes de este arreglo. `trasladar` sigue fallando si el destino
     existe; solo esto junta las dos sin perder nada. */

  async function existeFichero(dir, nombre) {
    try { await dir.getFileHandle(nombre); return true; }
    catch (e) { return false; }
  }

  async function copiarFicheroDentro(f, destino, nombre) {
    var salida = await destino.getFileHandle(nombre, { create: true });
    var w = await salida.createWritable();
    await w.write(f);
    await w.close();
  }

  /* El primer nombre libre con " (2)", " (3)"... antes de la extensión. */
  async function nombreLibreConSufijo(dir, nombre) {
    var punto = nombre.lastIndexOf('.');
    var base = punto === -1 ? nombre : nombre.slice(0, punto);
    var ext = punto === -1 ? '' : nombre.slice(punto);
    var n = 2;
    while (await existeFichero(dir, base + ' (' + n + ')' + ext)) n++;
    return base + ' (' + n + ')' + ext;
  }

  /* Recorre `origen` y lo va dejando dentro de `destino`, entrando en
     las subcarpetas que también existan allí. `rastro.verificar` se
     usa después para comprobar que todo ha llegado de verdad. */
  async function fusionarDentro(origen, destino, rastro) {
    for await (var pareja of origen.entries()) {
      var nombre = pareja[0], h = pareja[1];
      if (esCarpetaTemporalDeSincronizacion(nombre)) continue;
      if (h.kind === 'file') {
        var f = await leerFicheroParaCopiar(h, nombre);
        if (await existeFichero(destino, nombre)) {
          var existente = await (await destino.getFileHandle(nombre)).getFile();
          if (existente.size === f.size) {
            rastro.yaEstaban++;
            rastro.verificar.push({ dir: destino, nombre: nombre, tamano: f.size });
            continue;
          }
          var libre = await nombreLibreConSufijo(destino, nombre);
          await copiarFicheroDentro(f, destino, libre);
          rastro.conSufijo.push(libre);
          rastro.verificar.push({ dir: destino, nombre: libre, tamano: f.size });
        } else {
          await copiarFicheroDentro(f, destino, nombre);
          rastro.copiados++;
          rastro.verificar.push({ dir: destino, nombre: nombre, tamano: f.size });
        }
      } else {
        var sub = await destino.getDirectoryHandle(nombre, { create: true });
        await fusionarDentro(h, sub, rastro);
      }
    }
  }

  /* Junta `nombre` (dentro de `padreOrigen`) con `nombreDestino`, que ya
     existe dentro de `padreDestino`. Solo se borra el origen si, al
     terminar, cada fichero suyo está de verdad en el destino (con su
     nombre o con el sufijo) y con el mismo tamaño. */
  async function fusionarEn(padreOrigen, nombre, padreDestino, nombreDestino) {
    var origen = await padreOrigen.getDirectoryHandle(nombre);
    var destino = await padreDestino.getDirectoryHandle(nombreDestino, { create: true });
    var rastro = { copiados: 0, yaEstaban: 0, conSufijo: [], verificar: [] };
    await fusionarDentro(origen, destino, rastro);

    var faltan = 0;
    for (var i = 0; i < rastro.verificar.length; i++) {
      var v = rastro.verificar[i];
      var ok = false;
      try {
        var ff = await (await v.dir.getFileHandle(v.nombre)).getFile();
        ok = ff.size === v.tamano;
      } catch (e) { ok = false; }
      if (!ok) faltan++;
    }
    var total = rastro.verificar.length;
    if (faltan > 0) {
      throw new Error('La fusión no ha salido completa (' + (total - faltan) + ' de ' + total +
                      ' ficheros). No se ha borrado nada del origen.');
    }

    /* No se envuelve en `Papelera` a propósito: viviría en el sentido
       contrario (`js/papelera.js` ya depende de `js/carpetas.js`), y no
       hay ninguna función pública ahí que valga para esto (`mandarAsunto`
       es del registro de un asunto que se está BORRANDO, no de este
       origen ya fusionado). Se borra igual que hace `trasladar` de
       siempre, ya comprobado uno a uno. */
    await padreOrigen.removeEntry(nombre, { recursive: true });
    return { copiados: rastro.copiados, yaEstaban: rastro.yaEstaban, conSufijo: rastro.conSufijo };
  }

  function mover(padreOrigen, nombre, padreDestino) {
    return trasladar(padreOrigen, nombre, padreDestino, nombre);
  }

  function renombrar(padre, nombre, nombreNuevo) {
    if (nombre === nombreNuevo) return Promise.resolve(0);
    return trasladar(padre, nombre, padre, nombreNuevo);
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
    return true;
  }

  /* Lleva un fichero suelto dentro de otra carpeta.

     Misma precaución que al renombrar: primero se prueba con move(), y
     si Dropbox no lo permite se copia, se comprueba que la copia pesa
     lo mismo, y solo entonces se borra el original. */
  async function moverFichero(dirOrigen, nombre, dirDestino, nombreDestino) {
    var destino = nombreDestino || nombre;
    var h = await dirOrigen.getFileHandle(nombre);

    if (typeof h.move === 'function') {
      try {
        await h.move(dirDestino, destino);
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

    await dirOrigen.removeEntry(nombre);
    return true;
  }

  /* Abre el cuadro de "Abrir archivo" de Windows para traer un documento
     desde donde esté: Descargas, el escritorio, un pendrive.

     `carpetaInicio`, si se conoce, es el manejador de la carpeta donde
     se abre el explorador (17-sep-2026, fila 20): la del asunto cuando
     se está en un asunto, y así. Sin ella, se abre donde el navegador
     quiera, como siempre. */
  async function elegirFichero(carpetaInicio) {
    var opciones = { multiple: false };
    if (carpetaInicio) opciones.startIn = carpetaInicio;
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
    return f.name;
  }

  /* ---------- ficheros de texto ---------- */

  async function leerTexto(dir, nombre) {
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

  async function escribirTexto(dir, nombre, texto) {
    var h = await dir.getFileHandle(nombre, { create: true });
    var w = await h.createWritable();
    await w.write(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
    await w.close();
    return true;
  }

  /* Como escribirTexto, pero para bytes cualquiera: un PDF nuevo, por
     ejemplo (17-sep-2026, fila 22, separar y unir PDF). */
  async function escribirBytes(dir, nombre, bytes, tipo) {
    var h = await dir.getFileHandle(nombre, { create: true });
    var w = await h.createWritable();
    await w.write(new Blob([bytes], { type: tipo || 'application/octet-stream' }));
    await w.close();
    return true;
  }

  /* Distingue "no existe" de "no se puede leer". Si el fichero no está,
     devuelve null: es lo normal la primera vez que arranca la
     aplicación. Si el fichero está pero no se puede interpretar como
     JSON, es que se ha estropeado (un corte a mitad de guardar, un
     conflicto de Dropbox mal resuelto a mano), y entonces se lanza un
     error con nombre FicheroRoto en vez de devolver null: devolver null
     ahí haría que el siguiente guardado lo escribiera encima, y se
     perdería todo. */
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

  function guardarJson(dir, nombre, objeto) {
    return escribirTexto(dir, nombre, JSON.stringify(objeto, null, 2));
  }

  return {
    soportado: soportado, elegir: elegir, permiso: permiso,
    subcarpetas: subcarpetas, ficheros: ficheros, contenido: contenido, existe: existe,
    esCarpetaTemporalDeSincronizacion: esCarpetaTemporalDeSincronizacion,
    crear: crear, bajar: bajar, mover: mover, renombrar: renombrar, trasladar: trasladar,
    fusionarEn: fusionarEn, contarFicheros: contarFicheros,
    existeFichero: existeFichero, nombreLibreConSufijo: nombreLibreConSufijo,
    renombrarFichero: renombrarFichero, moverFichero: moverFichero,
    elegirFichero: elegirFichero, copiarFicheroEn: copiarFicheroEn,
    leerTexto: leerTexto, escribirTexto: escribirTexto, escribirBytes: escribirBytes,
    leerJson: leerJson, guardarJson: guardarJson
  };
})();
