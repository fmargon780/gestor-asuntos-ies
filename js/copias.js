/* ============================================================
   copias.js — copias de seguridad de los ficheros de _GESTOR, y el
   aviso cuando alguno está roto.

   Antes de escribir cualquiera de los ficheros compartidos se
   guarda la versión que había, una copia por fichero y día, en
   _GESTOR/copias. Si algún día un fichero se estropea —un corte de luz
   a mitad de guardar, un conflicto de Dropbox mal resuelto a mano—, la
   copia de ayer sigue ahí.

   Todo lo que escribe alguno de esos ficheros llama a
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

  /* Caducidad de las copias (fila 72, docs/DETALLES-DE-MANTENIMIENTO.md,
     punto 4), configurable en Ajustes → El centro (App.pintarDiasCaducidadCopias,
     en js/ajustes-centro.js). Se lee mirando directamente App.E.registro en
     vez de que cada uno de los muchos sitios que llaman a Copias.guardar
     tenga que pasarla como parámetro: misma idea que App.diasDormido() en
     js/que-me-toca.js. Con `window.App` (nunca `App` a secas): este fichero
     se carga antes que js/nucleo.js, que es quien declara `App`. */
  var DIAS_CADUCIDAD_POR_DEFECTO = 90;
  function diasCaducidad() {
    var n = window.App && App.E && App.E.registro && App.E.registro.ajustesAvisos &&
            App.E.registro.ajustesAvisos.diasCaducidadCopias;
    return (typeof n === 'number' && n > 0) ? n : DIAS_CADUCIDAD_POR_DEFECTO;
  }

  /* Días desde una fecha AAMMDD (la que llevan los nombres de las copias)
     hasta hoy. */
  function diasDesde(aammdd) {
    var fecha = new Date(2000 + parseInt(aammdd.slice(0, 2), 10),
                          parseInt(aammdd.slice(2, 4), 10) - 1,
                          parseInt(aammdd.slice(4, 6), 10));
    var hoy = new Date();
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.round((hoy - fecha) / 86400000);
  }

  /* Los ficheros compartidos que hay que proteger. `campos.json`
     (11-sep-2026, los campos de cada tipo de asunto) entró aquí igual
     que los demás JSON de _GESTOR. `papelera.json` (11-sep-2026, la
     papelera) y `no-duplicados.json` (11-sep-2026, los duplicados
     descartados con "No son el mismo") también. `hitos.json`
     (16-sep-2026, los hitos de cada asunto) es el duodécimo,
     `grupos.json` (17-sep-2026, los grupos propios de personas) el
     decimotercero, y `usuarios.json` (19-sep-2026, fila 72, la lista
     de nombres de quien entra) el decimocuarto. `borrados-listas.json`
     (20-sep-2026, fila 77, docs/DETALLES-DE-MANTENIMIENTO.md, punto 3:
     los borrados de tipos, estados, tipos de documento y recurrentes
     que se fusionan entre ordenadores, ver js/borrados-fusion.js) es
     el decimoquinto. `hitos-biblioteca.json` (20-sep-2026, fila 79, la
     biblioteca de hitos del centro, ver js/hitos-biblioteca.js) es el
     decimosexto. `cargos.json` (20-sep-2026, fila 81, los cargos del
     centro y quién los ha ocupado, ver js/cargos.js) es el
     decimoséptimo. `formularios-campos.json` (20-sep-2026, fila 84,
     qué casilla de cada impreso recibe qué dato del centro, ver
     js/formularios-rellenar.js) es el decimoctavo. */
  var FICHEROS = ['asuntos.json', 'guias.json', 'tipos.json', 'estados.json',
                   'tipos-documento.json', 'tablon.json', 'recurrentes.json', 'frescura.json',
                   'campos.json', 'papelera.json', 'no-duplicados.json', 'hitos.json', 'grupos.json',
                   'usuarios.json', 'borrados-listas.json', 'hitos-biblioteca.json', 'cargos.json',
                   'formularios-campos.json'];

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

  /* Se queda solo con las últimas MAXIMO copias de un fichero, y además
     quita las que ya hayan pasado de la caducidad (aunque no se hayan
     llegado a MAXIMO): fila 72, docs/DETALLES-DE-MANTENIMIENTO.md, punto
     4. Las "-roto-" no cuentan para ninguna de las dos cosas y nunca se
     borran solas. */
  async function podar(carpeta, base) {
    var todas = (await Carpetas.ficheros(carpeta))
      .map(function (f) { return f.nombre; })
      .filter(function (n) { return n.indexOf(base + '-') === 0 && n.indexOf(base + '-roto-') !== 0; })
      .sort();

    var limite = diasCaducidad();
    for (var i = todas.length - 1; i >= 0; i--) {
      var m = todas[i].match(/-(\d{6})\.json$/);
      if (!m || diasDesde(m[1]) <= limite) continue;
      var caducada = todas[i];
      todas.splice(i, 1);
      try { await carpeta.removeEntry(caducada); } catch (e) { /* no pasa nada si ya no está */ }
    }

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
    /* existeFichero, no existe (que busca una CARPETA y con un fichero
       siempre decía que no): antes cada guardado rehacía la copia del
       día y listaba copias/ entera (fila 99, docs/GUARDAR-EN-FILA.md).
       Así la copia de hoy es la de antes del PRIMER guardado del día.
       Y en memoria, para no preguntarle al disco cada vez. */
    if (copiasHechas[nombreCopia]) return;
    if (await Carpetas.existeFichero(carpeta, nombreCopia)) { copiasHechas[nombreCopia] = true; return; }
    var actual = await Carpetas.leerTexto(gestor, nombre);
    if (actual === null) return;
    await escribirCopiaVerificada(carpeta, nombreCopia, actual);
    copiasHechas[nombreCopia] = true;
    await podar(carpeta, base);
  }
  var copiasHechas = {};

  /* Fila 178, punto 5: la copia recién escrita se relee y se
     comprueba que es JSON de verdad (un corte a media escritura la
     dejaría a medias). Si falla, se reintenta escribirla una vez;
     si sigue sin poder leerse, no sirve de red de seguridad y no se
     llega a tocar el original: mejor quedarse con lo de antes. */
  async function copiaLegible(carpeta, nombreCopia) {
    try {
      var texto = await Carpetas.leerTexto(carpeta, nombreCopia);
      if (texto === null) return false;
      JSON.parse(texto);
      return true;
    } catch (e) { return false; }
  }
  async function escribirCopiaVerificada(carpeta, nombreCopia, texto) {
    await Carpetas.escribirTexto(carpeta, nombreCopia, texto);
    if (await copiaLegible(carpeta, nombreCopia)) return;
    await Carpetas.escribirTexto(carpeta, nombreCopia, texto);   /* un reintento */
    if (await copiaLegible(carpeta, nombreCopia)) return;
    U.fallo('No he podido guardar: la copia de seguridad no se ha escrito bien. Vuelve a intentarlo.');
    var e = new Error('La copia de seguridad no se ha escrito bien');
    e.name = 'CopiaNoVerificada';
    throw e;
  }

  /* Fila 178, punto 3: número de esquema de los ficheros compartidos
     que son un objeto (no una lista, como envios.json, tipos.json,
     tipos-documento.json o recurrentes.json: a esos no se les añade,
     no tienen dónde meter una clave de primer nivel). Cada migración
     futura que cambie el formato de alguno sube este número.

     `guias.json` y `formularios-campos.json` también se quedan fuera,
     aunque sean un objeto: sus claves de primer nivel son dinámicas
     (un tipo de asunto, la clave de un impreso), no un sitio fijo
     donde meter algo más sin que alguien que recorra sus claves
     (`for...in`, `Object.keys`) se encuentre con una que no espera. */
  var ESQUEMA = 1;
  var SIN_ESQUEMA = { 'guias.json': true, 'formularios-campos.json': true };

  /* Si el fichero en disco trae un _esquema MAYOR que el de esta app,
     es que el otro ordenador tiene una versión más nueva que ya ha
     migrado el formato: escribir encima con el formato viejo lo
     estropearía. Se avisa y no se escribe nada. */
  async function comprobarEsquemaDisco(gestor, nombre) {
    var disco;
    try { disco = await Carpetas.leerJson(gestor, nombre); } catch (e) { return; }
    if (!disco || typeof disco._esquema !== 'number' || disco._esquema <= ESQUEMA) return;
    U.fallo('En el otro ordenador hay una versión más nueva de la aplicación. Recarga la página para ponerte al día.');
    var e = new Error('En el otro ordenador hay una versión más nueva de la aplicación');
    e.name = 'EsquemaMasNuevo';
    throw e;
  }

  /* Lo que hay que llamar en vez de Carpetas.guardarJson para los
     ficheros compartidos: guarda la copia del día y después escribe,
     con su _esquema si es de los que lo llevan. */
  function guardar(gestor, nombre, objeto) {
    /* Cuenta como guardado en marcha (fila 99): las tareas de fondo
       esperan a la siguiente pasada. */
    var hacer = async function () {
      await copiarSiHaceFalta(gestor, nombre);
      var sinEsquema = Array.isArray(objeto) || SIN_ESQUEMA[nombre];
      if (!sinEsquema) await comprobarEsquemaDisco(gestor, nombre);
      var paraEscribir = sinEsquema ? objeto
        : Object.assign({}, objeto, { _esquema: Math.max(ESQUEMA, (typeof objeto._esquema === 'number') ? objeto._esquema : 0) });
      await Carpetas.guardarJson(gestor, nombre, paraEscribir);
    };
    return window.ColaGuardado ? window.ColaGuardado.ocupado(hacer) : hacer();
  }

  /* Mira los ficheros compartidos y dice cuáles están rotos (existen
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

  /* Para el bloque de Ajustes: las copias de los ficheros, listas
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
    ESQUEMA: ESQUEMA,
    guardar: guardar,
    comprobarTodos: comprobarTodos,
    restaurar: restaurar,
    listar: listar,
    listarTodas: listarTodas
  };
})();
