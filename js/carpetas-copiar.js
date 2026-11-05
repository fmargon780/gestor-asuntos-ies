/* ============================================================
   carpetas-copiar.js — copiar, trasladar y fusionar carpetas (fila 535: trozo de js/carpetas.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga después de js/carpetas-disco.js y antes de js/carpetas.js.
   ============================================================ */
(function () {

  var I = window.CarpetasNucleo = window.CarpetasNucleo || {};
  function ficheros() { return I.ficheros.apply(this, arguments); }
  function noSeCopia() { return I.noSeCopia.apply(this, arguments); }
  function existe() { return I.existe.apply(this, arguments); }
  function crear() { return I.crear.apply(this, arguments); }


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
        '(seguramente la nube estaba sincronizando). No se ha borrado nada.');
    }
  }

  /* Fila 265: cuelga del error dos datos (`paso`, `fichero`) sin cambiarle
     el `name`, para que quien archiva diga dónde ha fallado de verdad. Si
     ya los lleva (el fallo vino de más adentro), no los pisa. `destino`:
     el fallo fue al crear o escribir en el destino. */
  function marcar(e, paso, fichero, destino) {
    if (e && typeof e === 'object' && !e.paso) {
      e.paso = paso; e.fichero = fichero || '';
      if (destino) e.destino = true;
    }
    return e;
  }

  async function copiarDentro(origen, destino) {
    var copiados = 0;
    for await (var pareja of origen.entries()) {
      var nombre = pareja[0], h = pareja[1], enDestino = false;
      if (noSeCopia(nombre, h)) continue;
      try {
        if (h.kind === 'file') {
          var f = await leerFicheroParaCopiar(h, nombre);
          enDestino = true;
          var salida = await destino.getFileHandle(nombre, { create: true });
          var w = await salida.createWritable();
          await w.write(f);
          await w.close();
          copiados++;
        } else {
          enDestino = true;
          var sub = await destino.getDirectoryHandle(nombre, { create: true });
          enDestino = false;
          copiados += await copiarDentro(h, sub);
        }
      } catch (e) { throw marcar(e, 'al copiar', nombre, enDestino); }
    }
    return copiados;
  }

  async function contarFicheros(dir) {
    var n = 0;
    for await (var pareja of dir.entries()) {
      if (noSeCopia(pareja[0], pareja[1])) continue;
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
    var esperados;
    try { esperados = await contarFicheros(origen); }
    catch (e0) { throw marcar(e0, 'al leer la carpeta del asunto'); }
    /* La carpeta de destino es nuestra: la hemos creado nosotros justo
       arriba, después de comprobar que no existía. Si algo falla a
       partir de aquí (Dropbox sincronizando, un fichero bloqueado), se
       limpia lo que se haya llegado a copiar: si no, el siguiente
       intento se encuentra esa carpeta a medias y ya no puede archivar
       nunca más (17-sep-2026, fila 32, un asunto real se quedó así). */
    try {
      var destino = await padreDestino.getDirectoryHandle(nombreDestino, { create: true });
      await copiarDentro(origen, destino);
      var llegados;
      try { llegados = await contarFicheros(destino); }
      catch (e1) { throw marcar(e1, 'al comprobar la copia'); }
      if (llegados !== esperados) {
        throw marcar(new Error('La copia no ha salido completa (' + llegados + ' de ' + esperados +
                        ' ficheros). No se ha borrado nada: la carpeta sigue donde estaba.'), 'al comprobar la copia');
      }
    } catch (e) {
      try { await padreDestino.removeEntry(nombreDestino, { recursive: true }); }
      catch (e2) { if (e && typeof e === 'object') e.limpiezaFallida = true; /* se lanza igual el error de arriba */ }
      throw marcar(e, 'al crear la carpeta del asunto en el destino', '', true);
    }
    await borrarOrigenYaCopiado(padreOrigen, nombre);
    return esperados;
  }

  /* La copia ya está entera en el destino: si ahora no se puede borrar
     el original (un fichero abierto en Word o en Acrobat, Dropbox
     bloqueándolo), el traslado se da por bueno y se avisa en ámbar de
     que queda una copia vieja (fila 100, docs/AVISOS-QUE-DICEN-LA-VERDAD.md).
     Antes salía rojo, y al repetir, «ya hay una carpeta…». */
  async function borrarOrigenYaCopiado(padreOrigen, nombre) {
    try {
      await padreOrigen.removeEntry(nombre, { recursive: true });
    } catch (e) {
      var donde = (padreOrigen && padreOrigen.name ? padreOrigen.name + ' / ' : '') + nombre;
      if (window.U && U.accesorio) {
        U.accesorio('Hecho, pero queda una copia vieja en ' + donde + '; ciérrala si está abierta ' +
          'en otro programa y bórrala', e);
      }
    }
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

  /* Fila 176: la fecha de modificación de un fichero, para saber si el
     otro ordenador lo ha tocado desde la última vez sin tener que leer
     su contenido entero. 0 si no existe o no se puede mirar. */
  async function fechaFichero(dir, nombre) {
    try {
      var h = await dir.getFileHandle(nombre);
      var f = await h.getFile();
      return f.lastModified;
    } catch (e) { return 0; }
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
      if (noSeCopia(nombre, h)) continue;
      try { await fusionarUno(nombre, h, destino, rastro); }
      catch (e) { throw marcar(e, 'al copiar', nombre, true); }
    }
  }

  async function fusionarUno(nombre, h, destino, rastro) {
    if (h.kind !== 'file') {
      await fusionarDentro(h, await destino.getDirectoryHandle(nombre, { create: true }), rastro);
      return;
    }
    var f = await leerFicheroParaCopiar(h, nombre);
    var final = nombre;
    if (await existeFichero(destino, nombre)) {
      var existente = await (await destino.getFileHandle(nombre)).getFile();
      if (existente.size === f.size) {
        rastro.yaEstaban++;
        rastro.verificar.push({ dir: destino, nombre: nombre, tamano: f.size });
        return;
      }
      final = await nombreLibreConSufijo(destino, nombre);
      rastro.conSufijo.push(final);
    } else {
      rastro.copiados++;
    }
    await copiarFicheroDentro(f, destino, final);
    rastro.verificar.push({ dir: destino, nombre: final, tamano: f.size });
  }

  /* Junta `nombre` (dentro de `padreOrigen`) con `nombreDestino`, que ya
     existe dentro de `padreDestino`. Solo se borra el origen si, al
     terminar, cada fichero suyo está de verdad en el destino (con su
     nombre o con el sufijo) y con el mismo tamaño. */
  async function fusionarEn(padreOrigen, nombre, padreDestino, nombreDestino) {
    var origen = await padreOrigen.getDirectoryHandle(nombre);
    var destino = await padreDestino.getDirectoryHandle(nombreDestino, { create: true });
    var rastro = { copiados: 0, yaEstaban: 0, conSufijo: [], verificar: [] };
    try { await fusionarDentro(origen, destino, rastro); }
    catch (eF) { if (eF && typeof eF === 'object') eF.copiaAMedias = true; throw eF; }

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
      var eFus = new Error('La fusión no ha salido completa (' + (total - faltan) + ' de ' + total +
                      ' ficheros). No se ha borrado nada del origen.');
      eFus.copiaAMedias = true;
      throw marcar(eFus, 'al comprobar la copia');
    }

    /* No se envuelve en `Papelera` a propósito: viviría en el sentido
       contrario (`js/papelera.js` ya depende de `js/carpetas.js`), y no
       hay ninguna función pública ahí que valga para esto (`mandarAsunto`
       es del registro de un asunto que se está BORRANDO, no de este
       origen ya fusionado). Se borra igual que hace `trasladar` de
       siempre, ya comprobado uno a uno. */
    await borrarOrigenYaCopiado(padreOrigen, nombre);
    return { copiados: rastro.copiados, yaEstaban: rastro.yaEstaban, conSufijo: rastro.conSufijo };
  }

  I.marcar = marcar;
  I.contarFicheros = contarFicheros;
  I.trasladar = trasladar;
  I.existeFichero = existeFichero;
  I.fechaFichero = fechaFichero;
  I.nombreLibreConSufijo = nombreLibreConSufijo;
  I.fusionarEn = fusionarEn;
})();
