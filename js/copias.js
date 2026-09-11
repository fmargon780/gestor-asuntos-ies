/* ============================================================
   copias.js — copias de seguridad de los ficheros de _GESTOR, y el
   aviso cuando alguno está roto.

   Antes de escribir cualquiera de los ocho ficheros compartidos se
   guarda la versión que había, una copia por fichero y día, en
   _GESTOR/copias. Si algún día un fichero se estropea —un corte de luz
   a mitad de guardar, un conflicto de Dropbox mal resuelto a mano—, la
   copia de ayer sigue ahí.

   Todo lo que escribe alguno de esos ocho ficheros llama a
   Copias.guardar en vez de a Carpetas.guardarJson directamente, para
   que la copia se haga siempre y no se le pueda olvidar a nadie.

   Lo segundo que hace este fichero es distinguir, al leer, "el fichero
   no existe" (algo normal: la primera vez que arranca la aplicación)
   de "el fichero existe pero no se puede interpretar" (algo grave: se
   ha estropeado). Carpetas.leerJson ya distingue las dos cosas, y aquí
   se usa esa distinción para no dejar entrar si algo está roto.
   ============================================================ */
var Copias = (function () {

  var CARPETA = 'copias';
  var MAXIMO = 30;

  /* Los ocho ficheros compartidos que hay que proteger. */
  var FICHEROS = ['asuntos.json', 'guias.json', 'tipos.json', 'estados.json',
                   'tipos-documento.json', 'tablon.json', 'recurrentes.json', 'frescura.json'];

  function dosDigitos(n) { return String(n).padStart(2, '0'); }

  function hoyAaMmDd() {
    var d = new Date();
    return String(d.getFullYear()).slice(2) + dosDigitos(d.getMonth() + 1) + dosDigitos(d.getDate());
  }

  function ahoraHhMm() {
    var d = new Date();
    return dosDigitos(d.getHours()) + dosDigitos(d.getMinutes());
  }

  function nombreSinExtension(nombre) {
    return nombre.replace(/\.json$/, '');
  }

  function carpetaCopias(gestor) {
    return Carpetas.crear(gestor, CARPETA);
  }

  /* Se queda solo con las últimas MAXIMO copias de un fichero (las
     "-roto-" no cuentan para el recuento y nunca se borran solas). */
  async function podar(carpeta, base) {
    var todas = (await Carpetas.ficheros(carpeta))
      .map(function (f) { return f.nombre; })
      .filter(function (n) { return n.indexOf(base + '-') === 0 && n.indexOf(base + '-roto-') !== 0; })
      .sort();
    while (todas.length > MAXIMO) {
      var quitar = todas.shift();
      try { await carpeta.removeEntry(quitar); } catch (e) { /* no pasa nada si ya no está */ }
    }
  }

  /* Antes de escribir 'nombre' dentro de 'gestor', guarda una copia del
     contenido de ANTES de tocarlo, una vez por día. Si el fichero
     todavía no existía, no hay nada que copiar. */
  async function copiarSiHaceFalta(gestor, nombre) {
    var carpeta = await carpetaCopias(gestor);
    var base = nombreSinExtension(nombre);
    var nombreCopia = base + '-' + hoyAaMmDd() + '.json';
    if (await Carpetas.existe(carpeta, nombreCopia)) return;
    var actual = await Carpetas.leerTexto(gestor, nombre);
    if (actual === null) return;
    await Carpetas.escribirTexto(carpeta, nombreCopia, actual);
    await podar(carpeta, base);
  }

  /* Lo que hay que llamar en vez de Carpetas.guardarJson para los ocho
     ficheros compartidos: guarda la copia del día y después escribe. */
  async function guardar(gestor, nombre, objeto) {
    await copiarSiHaceFalta(gestor, nombre);
    await Carpetas.guardarJson(gestor, nombre, objeto);
  }

  /* Mira los ocho ficheros compartidos y dice cuáles están rotos (existen
     pero no se pueden interpretar). Se llama justo al entrar, antes de
     leer nada más: así no se pisa un fichero roto sin que nadie se
     entere. */
  async function comprobarTodos(gestor) {
    var rotos = [];
    for (var i = 0; i < FICHEROS.length; i++) {
      try { await Carpetas.leerJson(gestor, FICHEROS[i]); }
      catch (e) { if (e.name === 'FicheroRoto') rotos.push(FICHEROS[i]); }
    }
    return rotos;
  }

  /* Las copias de un fichero, de la más antigua a la más nueva. Cada una
     lleva su fecha en AAMMDD, sacada del propio nombre del fichero. */
  async function listar(gestor, nombre) {
    var carpeta = await carpetaCopias(gestor);
    var base = nombreSinExtension(nombre);
    return (await Carpetas.ficheros(carpeta))
      .filter(function (f) { return f.nombre.indexOf(base + '-') === 0 && f.nombre.indexOf(base + '-roto-') !== 0; })
      .map(function (f) {
        var m = f.nombre.match(/-(\d{6})\.json$/);
        return { nombre: f.nombre, handle: f.handle, fecha: m ? m[1] : '' };
      })
      .sort(function (a, b) { return a.nombre < b.nombre ? -1 : (a.nombre > b.nombre ? 1 : 0); });
  }

  /* Aparta el fichero roto (con fecha y hora, nunca se borra) y copia
     encima la copia más reciente que haya. Devuelve true si había una
     copia con la que restaurar. */
  async function restaurar(gestor, nombre) {
    var carpeta = await carpetaCopias(gestor);
    var base = nombreSinExtension(nombre);

    var roto = await Carpetas.leerTexto(gestor, nombre);
    if (roto !== null) {
      var nombreRoto = base + '-roto-' + hoyAaMmDd() + '-' + ahoraHhMm() + '.json';
      await Carpetas.escribirTexto(carpeta, nombreRoto, roto);
    }

    var copias = await listar(gestor, nombre);
    if (!copias.length) return false;
    var ultima = copias[copias.length - 1];
    var contenido = await Carpetas.leerTexto(carpeta, ultima.nombre);
    await Carpetas.escribirTexto(gestor, nombre, contenido);
    return true;
  }

  /* Para el bloque de Ajustes: las copias de los ocho ficheros, listas
     para pintar una tabla. */
  async function listarTodas(gestor) {
    var salida = {};
    for (var i = 0; i < FICHEROS.length; i++) {
      salida[FICHEROS[i]] = await listar(gestor, FICHEROS[i]);
    }
    return salida;
  }

  return {
    FICHEROS: FICHEROS,
    guardar: guardar,
    comprobarTodos: comprobarTodos,
    restaurar: restaurar,
    listar: listar,
    listarTodas: listarTodas
  };
})();
