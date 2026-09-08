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

  async function copiarDentro(origen, destino) {
    var copiados = 0;
    for await (var pareja of origen.entries()) {
      var nombre = pareja[0], h = pareja[1];
      if (h.kind === 'file') {
        var f = await h.getFile();
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
    var destino = await padreDestino.getDirectoryHandle(nombreDestino, { create: true });
    await copiarDentro(origen, destino);
    var llegados = await contarFicheros(destino);
    if (llegados !== esperados) {
      throw new Error('La copia no ha salido completa (' + llegados + ' de ' + esperados +
                      ' ficheros). No se ha borrado nada: la carpeta sigue donde estaba.');
    }
    await padreOrigen.removeEntry(nombre, { recursive: true });
    return esperados;
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
     desde donde esté: Descargas, el escritorio, un pendrive. */
  async function elegirFichero() {
    var lista = await window.showOpenFilePicker({ multiple: false });
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

  async function leerJson(dir, nombre) {
    var t = await leerTexto(dir, nombre);
    if (t === null) return null;
    try { return JSON.parse(t); }
    catch (e) { return null; }
  }

  function guardarJson(dir, nombre, objeto) {
    return escribirTexto(dir, nombre, JSON.stringify(objeto, null, 2));
  }

  return {
    soportado: soportado, elegir: elegir, permiso: permiso,
    subcarpetas: subcarpetas, ficheros: ficheros, contenido: contenido, existe: existe,
    crear: crear, bajar: bajar, mover: mover, renombrar: renombrar,
    contarFicheros: contarFicheros,
    renombrarFichero: renombrarFichero, moverFichero: moverFichero,
    elegirFichero: elegirFichero, copiarFicheroEn: copiarFicheroEn,
    leerTexto: leerTexto, escribirTexto: escribirTexto,
    leerJson: leerJson, guardarJson: guardarJson
  };
})();
