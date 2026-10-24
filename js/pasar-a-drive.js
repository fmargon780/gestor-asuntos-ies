/* ============================================================
   pasar-a-drive.js — el botón «Pasar a Drive» (fila 458,
   docs/PASAR-A-DRIVE.md): lleva las carpetas del Gestor de Dropbox a
   Google Drive para ordenadores, sin perder nada.

   Pasos (los pinta js/pasar-a-drive-ajustes.js):
     1. antes de empezar: nadie más dentro, cerrojo `_GESTOR/traslado-en-marcha.json`
        (de Dropbox, no se copia), señalar «Mi unidad» y contar lo que se va a copiar;
     2. copia, con avance en `_GESTOR/traslado-avance.json` de Drive (se puede cortar y seguir)
        y las fechas originales en `_GESTOR/fechas-de-dropbox.json` (js/fechas-de-origen.js);
     3. comprobación: mismo número de documentos y mismo tamaño; `_GESTOR` byte a byte;
     4. cambio: los manejadores recordados pasan a Drive, `entrada` se queda en Dropbox,
        `rutas.json` dice `nube: "drive"`, marca `PASADO-A-DRIVE.json`;
     5. carpetas viejas: la app crea «NO USAR – pasado a Drive el <fecha>» y pide arrastrar allí
        las viejas (el navegador no puede mover carpetas en Dropbox). No borra nada.

   Qué no se copia: los ficheros sueltos de la raíz de «asuntos vivos» (son la entrada), la
   carpeta `_GESTOR/presencia` (caduca sola) y los ficheros que escribe el propio traslado.
   La marca `PASADO-A-DRIVE.json` va en la raíz de Dropbox y, con el mismo identificador, en el
   `_GESTOR` de Drive.
   ============================================================ */
var PasarADrive = (function () {
  'use strict';

  var CERROJO = 'traslado-en-marcha.json';
  var AVANCE = 'traslado-avance.json';
  var MARCA = 'PASADO-A-DRIVE.json';
  var CLAVE_ID = 'gestor.traslado.id';
  var URL_ESPACIO = 'https://drive.google.com/settings/storage';
  var DOCE_HORAS = 12 * 60 * 60 * 1000;
  var NOMBRES_DRIVE = ['mi unidad', 'my drive'];
  var NO_SE_COPIA_DE_GESTOR = [CERROJO, AVANCE, MARCA, 'fechas-de-dropbox.json', 'presencia'];
  var CADA_CUANTOS_GUARDAR = 25;

  var T = null;            /* el traslado en curso (ver montar) */
  var corteHecho = false;  /* el interruptor de prueba solo corta una vez por página */

  /* ---------- pequeñas cosas ---------- */

  function idPropio() { try { return window.localStorage.getItem(CLAVE_ID) || ''; } catch (e) { return ''; } }
  function ponerIdPropio(id) {
    try { if (id) window.localStorage.setItem(CLAVE_ID, id); else window.localStorage.removeItem(CLAVE_ID); } catch (e) { /* vale solo hasta recargar */ }
  }
  function nuevoId() { return 'T' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esNoUsar(n) { return /^NO USAR/i.test(String(n || '')); }
  function dosCifras(n) { return (n < 10 ? '0' : '') + n; }
  function fechaDeHoy() { var d = new Date(); return dosCifras(d.getDate()) + '-' + dosCifras(d.getMonth() + 1) + '-' + d.getFullYear(); }
  function esDemo() { return !!(window.Demo && Demo.activo && Demo.activo()); }

  function gb(bytes) {
    var g = bytes / (1024 * 1024 * 1024);
    return (g >= 0.1 ? g.toFixed(1) : g.toFixed(2)).replace('.', ',');
  }

  async function leerJsonSuave(dir, nombre) {
    try { return (await Carpetas.leerJson(dir, nombre)) || null; } catch (e) { return null; }
  }

  async function subcarpeta(dir, nombre) {
    try { return await dir.getDirectoryHandle(nombre); } catch (e) { return null; }
  }

  /* El nombre de la nube en uso según `_GESTOR/rutas.json` (lo escribe este traslado). */
  async function nubeDeRutas() {
    if (!window.App || !App.E || !App.E.gestor) return 'dropbox';
    var r = await leerJsonSuave(App.E.gestor, 'rutas.json');
    return r && r.nube === 'drive' ? 'drive' : 'dropbox';
  }

  /* ---------- quién está dentro de la app ---------- */

  async function dentroDeLaApp() {
    if (!window.Presencia || !Presencia.quienesDentro) return [];
    try { return await Presencia.quienesDentro(); } catch (e) { return []; }
  }

  /* ---------- el cerrojo ---------- */

  async function leerCerrojo(gestor) { return gestor ? leerJsonSuave(gestor, CERROJO) : null; }

  async function ponerCerrojo(gestor, fase) {
    var c = (await leerCerrojo(gestor)) || {};
    c.id = c.id || idPropio() || nuevoId();
    ponerIdPropio(c.id);
    c.quien = c.quien || (App.E && App.E.usuario) || '';
    c.desde = c.desde || new Date().toISOString();
    c.ultima = new Date().toISOString();
    c.fase = fase || c.fase || 'copia';
    await Carpetas.guardarJson(gestor, CERROJO, c);
    return c;
  }

  async function quitarCerrojo(gestor) {
    try { await gestor.removeEntry(CERROJO); } catch (e) { /* ya no estaba */ }
  }

  /* Al entrar (js/nucleo.js, después de los permisos y antes de crear nada): si hay un cerrojo que no es de
     este ordenador, la app entra en «solo consulta» con una franja que lo dice. Devuelve true si lo hay. */
  async function alEntrar(abiertos) {
    if (!abiertos || !window.SoloConsulta || !SoloConsulta.cerrojo) return false;
    var c = null, gestor = null;
    try {
      gestor = await abiertos.getDirectoryHandle(App.CARPETA_GESTOR);
      c = await leerCerrojo(gestor);
    } catch (e) { return false; }
    if (!c) return false;
    if (c.id && c.id === idPropio()) return false;
    var edad = Date.now() - new Date(c.ultima || c.desde || 0).getTime();
    var vieja = !isNaN(edad) && edad > DOCE_HORAS;
    SoloConsulta.cerrojo({
      texto: 'Se están pasando las carpetas a Google Drive. Espera a que termine.',
      boton: vieja ? 'Quitar el cerrojo' : '',
      alPulsar: async function () {
        var ok = await U.preguntar('Quitar el cerrojo',
          '<p>El traslado lleva más de 12 horas sin moverse. ¿Quitar el cerrojo? Lo copiado en Drive se queda y no se usa.</p>', 'Quitar');
        if (!ok) return;
        try { await quitarCerrojo(SoloConsulta.crudo(gestor)); } catch (e) { U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo'); return; }
        window.location.reload();
      }
    });
    return true;
  }

  /* ---------- el avance y las fechas (en el _GESTOR de Drive) ---------- */

  async function guardarAvance() {
    if (!T || !T.dGestor) return;
    T.avance.ultima = new Date().toISOString();
    await Carpetas.guardarJson(T.dGestor, AVANCE, T.avance);
    await Carpetas.guardarJson(T.dGestor, FechasOrigen.FICHERO, { ficheros: T.fechas });
  }

  async function marcarCerrojo() {
    if (T && T.o && T.o.gestor) { try { await ponerCerrojo(T.o.gestor, T.avance.fase); } catch (e) { /* se vuelve a intentar con el siguiente */ } }
  }

  /* ---------- preparar: el destino y la cuenta de lo que se va a copiar ---------- */

  function elegirDrive() {
    return window.showDirectoryPicker({ id: 'gestor-drive', mode: 'readwrite' }).then(function (h) {
      if (NOMBRES_DRIVE.indexOf(String(h.name || '').trim().toLowerCase()) === -1) {
        var e = new Error('Esa carpeta se llama «' + h.name + '». Tiene que ser la carpeta «Mi unidad» (o «My Drive») de Google Drive.');
        e.name = 'NoEsDrive';
        throw e;
      }
      return h;
    });
  }

  async function recorrer(dir, ruta, zona, salida) {
    for await (var p of dir.entries()) {
      var n = p[0], h = p[1];
      if (Carpetas.noSeCopia(n, h)) continue;
      if (zona === 'gestor' && !ruta.length && NO_SE_COPIA_DE_GESTOR.indexOf(n) !== -1) continue;
      if (h.kind === 'file') {
        var f = await h.getFile();
        salida.ficheros.push({ ruta: ruta.concat([n]), handle: h, size: f.size, mod: f.lastModified, esDocumento: zona !== 'gestor' && zona !== 'copia' && !Carpetas.esFicheroDeGoogle(n) });
      } else {
        salida.carpetas.push(ruta.concat([n]));
        await recorrer(h, ruta.concat([n]), zona, salida);
      }
    }
  }

  /* Las unidades de copia: cada carpeta de asunto, el ARCHIVO (cada cosa de su raíz), la copia sin internet y,
     la última, `_GESTOR`. */
  async function planear() {
    var o = T.o, unidades = [];
    async function unidad(clave, zona, nombre, origen, esFichero) {
      var u = { clave: clave, zona: zona, nombre: nombre, origen: origen, ficheros: [], carpetas: [], esFichero: !!esFichero };
      if (esFichero) {
        var f = await origen.getFile();
        u.ficheros.push({ ruta: [nombre], handle: origen, size: f.size, mod: f.lastModified, esDocumento: !Carpetas.esFicheroDeGoogle(nombre) });
      } else {
        await recorrer(origen, [], zona, u);
      }
      unidades.push(u);
    }
    var cont = await Carpetas.contenido(o.abiertos);
    for (var i = 0; i < cont.carpetas.length; i++) {
      var c = cont.carpetas[i];
      if (c.nombre === App.CARPETA_GESTOR || esNoUsar(c.nombre) || Carpetas.esCarpetaTemporalDeSincronizacion(c.nombre)) continue;
      await unidad('a:' + c.nombre, 'abiertos', c.nombre, c.handle);
    }
    var arch = await Carpetas.contenido(o.archivo);
    for (var j = 0; j < arch.carpetas.length; j++) {
      if (Carpetas.esCarpetaTemporalDeSincronizacion(arch.carpetas[j].nombre)) continue;
      await unidad('r:' + arch.carpetas[j].nombre, 'archivo', arch.carpetas[j].nombre, arch.carpetas[j].handle);
    }
    for (var k = 0; k < arch.ficheros.length; k++) {
      if (Carpetas.noSeCopia(arch.ficheros[k].nombre, arch.ficheros[k].handle)) continue;
      await unidad('f:' + arch.ficheros[k].nombre, 'archivo', arch.ficheros[k].nombre, arch.ficheros[k].handle, true);
    }
    if (o.copia) await unidad('c', 'copia', o.copia.name, o.copia);
    await unidad('g', 'gestor', App.CARPETA_GESTOR, o.gestor);
    return unidades;
  }

  function claveFecha(u, ruta) {
    if (u.zona === 'abiertos') return 'abiertos/' + u.nombre + '/' + ruta.join('/');
    if (u.zona === 'gestor') return 'abiertos/' + App.CARPETA_GESTOR + '/' + ruta.join('/');
    if (u.zona === 'archivo') return u.esFichero ? 'archivo/' + ruta.join('/') : 'archivo/' + u.nombre + '/' + ruta.join('/');
    return 'copia/' + ruta.join('/');
  }

  /* El sitio de Drive donde cuelgan las rutas de la unidad (se crea si falta). */
  async function baseDe(u) {
    if (u.zona === 'abiertos') return T.dAbiertos.getDirectoryHandle(u.nombre, { create: true });
    if (u.zona === 'archivo') return u.esFichero ? T.dArchivo : T.dArchivo.getDirectoryHandle(u.nombre, { create: true });
    if (u.zona === 'copia') return T.dCopia;
    return T.dGestor;
  }

  /* Construye el traslado a partir de «Mi unidad» y de lo recordado: las carpetas de origen son las que la
     aplicación tiene señaladas (Dropbox). `drive` es la carpeta «Mi unidad» ya validada. */
  async function montar(drive) {
    var abiertosViejo = (await Almacen.leer('abiertos')) || App.E.abiertos;
    var archivoViejo = (await Almacen.leer('archivo')) || App.E.archivo;
    var copia = null;
    try { copia = (await Almacen.leer('copiaCarpeta')) || null; } catch (e) { copia = null; }
    if (copia) { try { await copia.entries().next(); } catch (e2) { copia = null; } }
    var gestorViejo = await abiertosViejo.getDirectoryHandle(App.CARPETA_GESTOR);
    T = { drive: drive, o: { abiertos: abiertosViejo, archivo: archivoViejo, copia: copia, gestor: gestorViejo },
          avance: null, fechas: {}, unidades: [], documentos: 0, bytes: 0 };
    T.dAbiertos = await drive.getDirectoryHandle(abiertosViejo.name, { create: true });
    T.dArchivo = await drive.getDirectoryHandle(archivoViejo.name, { create: true });
    T.dCopia = copia ? await drive.getDirectoryHandle(copia.name, { create: true }) : null;
    T.dGestor = await T.dAbiertos.getDirectoryHandle(App.CARPETA_GESTOR, { create: true });
    var previo = await leerJsonSuave(T.dGestor, AVANCE);
    T.avance = (previo && previo.id) ? previo : { id: idPropio() || nuevoId(), fase: 'copia', unidades: {}, desde: new Date().toISOString() };
    var fe = await leerJsonSuave(T.dGestor, FechasOrigen.FICHERO);
    T.fechas = (fe && fe.ficheros && typeof fe.ficheros === 'object') ? fe.ficheros : {};
    T.unidades = await planear();
    T.unidades.forEach(function (u) {
      u.ficheros.forEach(function (f) {
        T.bytes += f.size;
        if (f.esDocumento) T.documentos++;
      });
    });
    return resumen();
  }

  function resumen() {
    return {
      documentos: T.documentos, bytes: T.bytes, texto: 'Vas a copiar ' + T.documentos + ' documentos (' + gb(T.bytes) + ' GB). ' +
        'La cuenta común tiene 50 GB. Mira el espacio libre aquí antes de seguir: ' + URL_ESPACIO,
      urlEspacio: URL_ESPACIO, aMedias: Object.keys(T.avance.unidades).length > 0
    };
  }

  /* Primer paso: el cerrojo (después de comprobar que no hay nadie más dentro). */
  async function cerrar() {
    if (window.SoloConsulta && SoloConsulta.activo()) throw new Error('En «solo consultar» no se puede pasar a Drive.');
    if ((await nubeDeRutas()) === 'drive') throw new Error('Las carpetas ya están en Google Drive.');
    var abiertos = (await Almacen.leer('abiertos')) || App.E.abiertos;
    var gestorViejo = await abiertos.getDirectoryHandle(App.CARPETA_GESTOR);
    var c = await leerCerrojo(gestorViejo);
    if (c && c.id !== idPropio()) throw new Error('Se están pasando las carpetas a Google Drive. Espera a que termine.');
    await ponerCerrojo(gestorViejo, 'copia');
  }

  /* Segundo: con «Mi unidad» ya señalada, crea el destino y cuenta lo que se va a copiar. Devuelve el resumen
     para enseñar «Empezar» / «Cancelar». */
  async function preparar(drive) {
    var ok = await Carpetas.permiso(drive, true);
    if (!ok) throw new Error('Sin permiso sobre «Mi unidad». Vuelve a señalarla.');
    await Almacen.guardar('traslado-drive', drive);
    return montar(drive);
  }

  /* Un traslado a medias de este ordenador: vuelve a montarlo con lo recordado. */
  async function reanudar() {
    var drive = await Almacen.leer('traslado-drive');
    if (!drive) throw new Error('No recuerdo la carpeta «Mi unidad». Pulsa «Pasar a Drive» otra vez.');
    var ok = await Carpetas.permiso(drive, true);
    if (!ok) throw new Error('Sin permiso sobre «Mi unidad». Vuelve a señalarla.');
    return montar(drive);
  }

  /* ---------- copiar ---------- */

  function corteDeLaDemo() {
    if (!esDemo() || corteHecho) return 0;
    try {
      if (new URLSearchParams(window.location.search).get('traslado') !== 'corta') return 0;
    } catch (e) { return 0; }
    return Math.max(1, Math.floor(T.unidades.reduce(function (n, u) { return n + u.ficheros.length; }, 0) / 2));
  }

  async function copiarFichero(base, f, forzar) {
    var padre = base;
    for (var i = 0; i < f.ruta.length - 1; i++) padre = await padre.getDirectoryHandle(f.ruta[i], { create: true });
    var nombre = f.ruta[f.ruta.length - 1];
    var origen;
    try { origen = await f.handle.getFile(); }
    catch (e) {
      if (e.name !== 'NotFoundError') throw e;
      await new Promise(function (r) { setTimeout(r, 1000); });
      origen = await f.handle.getFile();
    }
    var salida = await padre.getFileHandle(nombre, { create: true });
    var w = await salida.createWritable();
    await w.write(origen);
    await w.close();
    var copia = await (await padre.getFileHandle(nombre)).getFile();
    if (copia.size !== origen.size) throw new Error('"' + nombre + '" no ha salido completo (' + copia.size + ' de ' + origen.size + ' bytes).');
    return { f: origen.lastModified, t: origen.size, c: copia.lastModified };
  }

  async function yaEstaBien(base, f, clave) {
    var e = T.fechas[clave];
    if (!e || e.t !== f.size || e.f !== f.mod) return false;
    try {
      var padre = base;
      for (var i = 0; i < f.ruta.length - 1; i++) padre = await padre.getDirectoryHandle(f.ruta[i]);
      var h = await padre.getFileHandle(f.ruta[f.ruta.length - 1]);
      return (await h.getFile()).size === f.size;
    } catch (err) { return false; }
  }

  /* Copia todas las unidades que falten. `progreso({ hechos, total, nombre })` se llama tras cada fichero.
     Devuelve { fallos: [{ ruta, motivo }] }. Si se corta (cerrar la página, fallo del disco), lanza el error:
     lo copiado queda apuntado y se sigue al volver. */
  async function copiar(progreso, soloEstos) {
    var total = 0, hechos = 0, fallos = [];
    T.unidades.forEach(function (u) { total += u.ficheros.length; });
    var corteEn = corteDeLaDemo();
    var desdeElGuardado = 0;
    for (var i = 0; i < T.unidades.length; i++) {
      var u = T.unidades[i];
      if (T.avance.unidades[u.clave] && !soloEstos) { hechos += u.ficheros.length; continue; }
      var base = await baseDe(u);
      for (var c = 0; c < u.carpetas.length; c++) await Carpetas.bajar(base, u.carpetas[c], true);
      var fallosDeLaUnidad = 0;
      for (var j = 0; j < u.ficheros.length; j++) {
        var f = u.ficheros[j];
        var clave = claveFecha(u, f.ruta);
        if (soloEstos && !soloEstos[clave]) { hechos++; continue; }
        if (progreso) progreso({ hechos: hechos, total: total, nombre: u.nombre + ' / ' + f.ruta.join(' / ') });
        if (corteEn && hechos >= corteEn) {
          corteHecho = true;
          await guardarAvance();
          var corte = new Error('Corte de prueba: el traslado se ha parado a la mitad.');
          corte.name = 'CorteDePrueba';
          throw corte;
        }
        if (!soloEstos && await yaEstaBien(base, f, clave)) { hechos++; continue; }
        try {
          T.fechas[clave] = await copiarFichero(base, f);
        } catch (e) {
          fallosDeLaUnidad++;
          fallos.push({ ruta: u.nombre + ' / ' + f.ruta.join(' / '), motivo: U.mensajeDeError(e) });
        }
        hechos++;
        if (++desdeElGuardado >= CADA_CUANTOS_GUARDAR) { desdeElGuardado = 0; await guardarAvance(); await marcarCerrojo(); }
      }
      if (!fallosDeLaUnidad) T.avance.unidades[u.clave] = true;
      await guardarAvance();
      await marcarCerrojo();
    }
    if (progreso) progreso({ hechos: total, total: total, nombre: '' });
    return { fallos: fallos };
  }

  /* ---------- comprobar ---------- */

  async function iguales(a, b) {
    var x = new Uint8Array(await a.arrayBuffer()), y = new Uint8Array(await b.arrayBuffer());
    if (x.length !== y.length) return false;
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }

  /* Por cada unidad: el mismo número de ficheros y el mismo tamaño de cada uno; `_GESTOR`, byte a byte.
     Devuelve { documentos, faltan: [{ clave, unidad, ruta, motivo }] }. */
  async function comprobar(progreso) {
    var faltan = [], hechos = 0, total = 0;
    T.unidades.forEach(function (u) { total += u.ficheros.length; });
    for (var i = 0; i < T.unidades.length; i++) {
      var u = T.unidades[i];
      var base = await baseDe(u);
      for (var j = 0; j < u.ficheros.length; j++) {
        var f = u.ficheros[j];
        var clave = claveFecha(u, f.ruta);
        if (progreso) progreso({ hechos: hechos, total: total, nombre: u.nombre + ' / ' + f.ruta.join(' / ') });
        hechos++;
        var motivo = '';
        try {
          var padre = base;
          for (var k = 0; k < f.ruta.length - 1; k++) padre = await padre.getDirectoryHandle(f.ruta[k]);
          var dest = await (await padre.getFileHandle(f.ruta[f.ruta.length - 1])).getFile();
          var orig = await f.handle.getFile();
          if (dest.size !== orig.size) motivo = 'tamaño distinto';
          else if (u.zona === 'gestor' && !(await iguales(orig, dest))) motivo = 'contenido distinto';
        } catch (e) { motivo = 'no está en Drive'; }
        if (motivo) faltan.push({ clave: clave, unidad: u.clave, ruta: u.nombre + ' / ' + f.ruta.join(' / '), motivo: motivo });
      }
    }
    return { documentos: T.documentos, faltan: faltan };
  }

  /* Vuelve a copiar solo lo que faltaba y lo comprueba otra vez. */
  async function reintentar(faltan, progreso) {
    var solo = {};
    faltan.forEach(function (x) { solo[x.clave] = true; delete T.fechas[x.clave]; });
    faltan.forEach(function (x) { delete T.avance.unidades[x.unidad]; });
    var r = await copiar(progreso, solo);
    var c = await comprobar();
    if (!r.fallos.length) T.unidades.forEach(function (u) { if (!c.faltan.some(function (x) { return x.unidad === u.clave; })) T.avance.unidades[u.clave] = true; });
    await guardarAvance();
    return c;
  }

  /* ---------- cambiar y dejar las carpetas viejas ---------- */

  function listaParaArrastrar() {
    var lista = [];
    T.unidades.forEach(function (u) { if (u.zona === 'abiertos') lista.push(u.nombre); });
    lista.push(App.CARPETA_GESTOR);
    return lista;
  }

  /* Pasos 4 y 5 (hasta enseñar qué arrastrar). Solo se llama con la comprobación limpia. */
  async function cambiar() {
    var id = T.avance.id;
    var rutas = (await leerJsonSuave(T.dGestor, 'rutas.json')) || {};
    rutas.nube = 'drive';
    rutas.abiertos = T.dAbiertos.name;
    rutas.archivo = T.dArchivo.name;
    await Carpetas.guardarJson(T.dGestor, 'rutas.json', rutas);

    var nombreNoUsar = 'NO USAR – pasado a Drive el ' + fechaDeHoy();
    await Carpetas.crear(T.o.abiertos, nombreNoUsar);

    var marca = { id: id, fecha: new Date().toISOString(), quien: (App.E && App.E.usuario) || '',
      abiertos: T.dAbiertos.name, archivo: T.dArchivo.name, copia: T.dCopia ? T.dCopia.name : '', noUsar: nombreNoUsar };
    await Carpetas.guardarJson(T.dGestor, MARCA, marca);
    await Carpetas.guardarJson(T.o.abiertos, MARCA, marca);

    await Almacen.guardar('traslado-archivo-viejo', T.o.archivo);
    if (T.o.copia) await Almacen.guardar('traslado-copia-vieja', T.o.copia);
    await Almacen.guardar('abiertos', T.dAbiertos);
    await Almacen.guardar('archivo', T.dArchivo);
    await Almacen.guardar('entrada', T.o.abiertos);
    if (T.dCopia) await Almacen.guardar('copiaCarpeta', T.dCopia);

    var lista = listaParaArrastrar();
    T.avance.fase = 'arrastrar';
    T.avance.noUsar = nombreNoUsar;
    T.avance.arrastrar = lista;
    T.avance.archivoViejo = T.o.archivo.name;
    T.avance.copiaVieja = T.o.copia ? T.o.copia.name : '';
    await guardarAvance();
    await pasarLaSesionADrive();

    return { noUsar: nombreNoUsar, lista: lista, archivoViejo: T.o.archivo.name, copiaVieja: T.o.copia ? T.o.copia.name : '',
      copiaNueva: T.dCopia ? T.dCopia.name : '', rutaCopia: rutaDeLaCopia() };
  }

  /* La aplicación sigue en esta misma página, ya sobre Drive (no recarga: la copia sin internet ha cambiado de sitio). */
  async function pasarLaSesionADrive() {
    FechasOrigen.fijar(T.fechas);
    App.E.abiertos = FechasOrigen.envolver(T.dAbiertos, 'abiertos/');
    App.E.archivo = FechasOrigen.envolver(T.dArchivo, 'archivo/');
    App.E.gestor = FechasOrigen.envolver(T.dGestor, 'abiertos/' + App.CARPETA_GESTOR + '/');
    App.E.datos = await Carpetas.crear(App.E.gestor, 'datos');
    if (window.Entrada) await Entrada.cargar();
    if (window.RutaCarpetas) { try { await RutaCarpetas.cargarComun(); } catch (e) { /* se queda como estaba */ } }
    if (window.App && App.marcarCarpeta) {
      try { App.marcarCarpeta('estado-abiertos', T.dAbiertos.name); App.marcarCarpeta('estado-archivo', T.dArchivo.name); } catch (e) { /* no crítico */ }
    }
  }

  function rutaDeLaCopia() {
    if (!T.dCopia || !window.RutaCarpetas) return '';
    var raiz = '';
    try { raiz = RutaCarpetas.raizDeLaNube().valor || ''; } catch (e) { raiz = ''; }
    if (!raiz || RutaCarpetas.nubeDeRuta(raiz) !== 'drive') return '';
    return RutaCarpetas.unir(RutaCarpetas.sinFileUrl(raiz), [T.dCopia.name]);
  }

  async function sigueAhi(carpeta, noUsar) {
    if (!carpeta) return false;
    try {
      if (noUsar && noUsar.resolve) { var r = await noUsar.resolve(carpeta); if (r) return false; }
    } catch (e) { /* sin resolve: se mira abajo */ }
    try { await carpeta.entries().next(); return true; } catch (e) { return false; }
  }

  /* «Ya las he arrastrado»: mira que en la raíz de Dropbox no quede ninguna carpeta de asunto ni `_GESTOR`, y que el
     ARCHIVO y la copia viejos ya no se abran. Devuelve { quedan: [texto] }; si no queda nada, quita el cerrojo. */
  async function comprobarArrastre() {
    var a = T ? T.avance : await leerJsonSuave(App.E.gestor, AVANCE);
    if (!a || a.fase !== 'arrastrar') return { quedan: [] };
    var dropbox = T ? T.o.abiertos : await Almacen.leer('entrada');
    var archivoViejo = T ? T.o.archivo : await Almacen.leer('traslado-archivo-viejo');
    var copiaVieja = T ? T.o.copia : await Almacen.leer('traslado-copia-vieja');
    var noUsar = await subcarpeta(dropbox, a.noUsar);
    var quedan = [];
    var hay = await Carpetas.contenido(dropbox);
    var lista = (a.arrastrar || []).slice();
    hay.carpetas.forEach(function (c) {
      if (esNoUsar(c.nombre)) return;
      if (lista.indexOf(c.nombre) !== -1) quedan.push(c.nombre);
    });
    if (await sigueAhi(archivoViejo, noUsar)) quedan.push(a.archivoViejo + ' (el ARCHIVO viejo)');
    if (copiaVieja && await sigueAhi(copiaVieja, noUsar)) quedan.push(a.copiaVieja + ' (la copia sin internet vieja)');
    if (quedan.length) return { quedan: quedan };
    var gestorViejo = noUsar ? await subcarpeta(noUsar, App.CARPETA_GESTOR) : null;
    if (gestorViejo) await quitarCerrojo(gestorViejo);
    a.fase = 'hecho';
    a.terminado = new Date().toISOString();
    if (T) T.avance = a;
    await Carpetas.guardarJson(App.E.gestor, AVANCE, a);
    ponerIdPropio('');
    return { quedan: [] };
  }

  /* El texto del paso 6. */
  function textoFinal(info) {
    var ruta = info.rutaCopia || (info.copiaNueva ? 'la carpeta «' + info.copiaNueva + '» dentro de «Mi unidad» de Google Drive' : 'la carpeta de la copia sin internet, dentro de «Mi unidad» de Google Drive (si la tenías)');
    return 'Las carpetas ya están en Google Drive. Antes de usar la app desde el otro ordenador o desde casa, espera a que ' +
      'Google Drive termine de subirlo todo (el icono de Drive deja de girar). Diego tendrá que señalarlas la próxima vez que entre. ' +
      'Abre a partir de ahora la copia de la app que está en Google Drive: ' + ruta + '. Las carpetas viejas de Dropbox, en «' +
      info.noUsar + '»: borradlas dentro de un mes.';
  }

  /* «Cancelar el traslado» (el ordenador que puso el cerrojo): quita el cerrojo; lo copiado se queda y no se usa. */
  async function cancelar() {
    var gestorViejo = (T && T.o && T.o.gestor) || null;
    if (!gestorViejo) {
      var ab = (await Almacen.leer('abiertos')) || App.E.abiertos;
      gestorViejo = await subcarpeta(ab, App.CARPETA_GESTOR);
    }
    if (gestorViejo) await quitarCerrojo(gestorViejo);
    if (T && T.dGestor) {
      try { await T.dGestor.removeEntry(AVANCE); } catch (e) { /* no había */ }
      try { await T.dGestor.removeEntry(FechasOrigen.FICHERO); } catch (e) { /* no había */ }
    } else {
      var drive = await Almacen.leer('traslado-drive');
      var dab = drive ? await subcarpeta(drive, ((await Almacen.leer('abiertos')) || App.E.abiertos).name) : null;
      var dg = dab ? await subcarpeta(dab, App.CARPETA_GESTOR) : null;
      if (dg) {
        try { await dg.removeEntry(AVANCE); } catch (e) { /* no había */ }
        try { await dg.removeEntry(FechasOrigen.FICHERO); } catch (e) { /* no había */ }
      }
    }
    ponerIdPropio('');
    T = null;
  }

  /* Cómo está el asunto, para pintar Ajustes: 'inicio' | 'amedias' | 'ajeno' | 'arrastrar' | 'hecho'. */
  async function estado() {
    var gestor = App.E && App.E.gestor;
    if (!gestor) return { vista: 'inicio' };
    var a = await leerJsonSuave(gestor, AVANCE);
    if (a && a.fase === 'arrastrar') return { vista: 'arrastrar', avance: a };
    var c = await leerCerrojo(gestor);
    if (c && c.id && c.id === idPropio()) return { vista: 'amedias', cerrojo: c };
    if (c) return { vista: 'ajeno', cerrojo: c };
    if ((await nubeDeRutas()) === 'drive') return { vista: 'hecho', avance: a };
    return { vista: 'inicio' };
  }

  return {
    CERROJO: CERROJO, AVANCE: AVANCE, MARCA: MARCA, URL_ESPACIO: URL_ESPACIO,
    dentroDeLaApp: dentroDeLaApp, elegirDrive: elegirDrive, cerrar: cerrar, preparar: preparar, reanudar: reanudar, copiar: copiar,
    comprobar: comprobar, reintentar: reintentar, cambiar: cambiar, comprobarArrastre: comprobarArrastre,
    textoFinal: textoFinal, cancelar: cancelar, estado: estado, alEntrar: alEntrar, resumen: function () { return T ? resumen() : null; },
    traslado: function () { return T; }
  };
})();
window.PasarADrive = PasarADrive;
