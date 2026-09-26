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

   26-sep-2026, fila 178, docs/CORREO-VERSIONES-Y-LIMPIEZA.md, puntos 3
   y 5:

   - Número de esquema. Cada fichero de FICHEROS cuyo contenido sea un
     objeto (no una lista: `tipos.json`, `tipos-documento.json` y
     `recurrentes.json` son listas y no pueden llevar una clave de más,
     JSON.stringify se la comería sin avisar) lleva `_esquema: ESQUEMA`
     en su primer nivel. Antes de escribir, se relee el fichero: si en
     disco hay un `_esquema` MAYOR que el de esta app, no se escribe
     (`EsquemaMasNuevo`): otro ordenador tiene una versión más nueva, y
     escribir aquí encima sería volver al formato viejo sobre datos ya
     migrados. Un fichero sin `_esquema` es válido (es de antes de esta
     fila): se le añade sin más.
   - Copia verificada. Tras escribir la copia del día (solo la primera
     de cada fichero: las demás no hacen copia), se relee y se le hace
     JSON.parse; si falla, se reintenta una vez; si sigue sin poder
     leerse, NO se escribe el original (`CopiaNoVerificada`): mejor
     dejar el fichero real como estaba que fiarse de una red de
     seguridad que no se sabe si funciona.
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

  /* Fila 178: el número de esquema de hoy. Cada migración futura que
     cambie el formato de alguno de estos ficheros lo sube. */
  var ESQUEMA = 1;

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

  /* Fila 178: la copia recién escrita, ¿se puede releer como JSON de
     verdad? false también si ha desaparecido entre medias. */
  async function copiaLegible(carpeta, nombreCopia) {
    var releido;
    try { releido = await Carpetas.leerTexto(carpeta, nombreCopia); } catch (e) { return false; }
    if (releido === null) return false;
    try { JSON.parse(releido); return true; } catch (e) { return false; }
  }

  /* Antes de escribir 'nombre' dentro de 'gestor', guarda una copia del
     contenido de ANTES de tocarlo, una vez por día. Si el fichero
     todavía no existía, no hay nada que copiar.

     Fila 178: tras escribirla, se relee y se comprueba que es JSON de
     verdad; si no, se reintenta una vez; si sigue sin poder leerse, se
     lanza CopiaNoVerificada y NO se marca como hecha (así el próximo
     guardado la vuelve a intentar), para que quien llama no llegue a
     escribir el original sobre una red de seguridad que no vale. */
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
    await Carpetas.escribirTexto(carpeta, nombreCopia, actual);
    var verificada = await copiaLegible(carpeta, nombreCopia);
    if (!verificada) {
      await Carpetas.escribirTexto(carpeta, nombreCopia, actual);
      verificada = await copiaLegible(carpeta, nombreCopia);
    }
    if (!verificada) {
      var error = new Error('No he podido guardar: la copia de seguridad no se ha escrito bien. ' +
        'Vuelve a intentarlo.');
      error.name = 'CopiaNoVerificada';
      throw error;
    }
    copiasHechas[nombreCopia] = true;
    await podar(carpeta, base);
  }
  var copiasHechas = {};

  /* `guias.json` no lleva `_esquema`: a diferencia de los demás, su
     primer nivel no es un puñado de claves fijas, sino un diccionario
     dinámico (una entrada por cada TIPO de asunto que tenga guía), y
     varios sitios lo recorren entero con `for...in`/`Object.keys`
     esperando que cada clave sea un tipo con su lista de pasos
     (js/cargar-biblioteca.js, js/hitos-administracion.js,
     js/hitos-biblioteca.js, js/reunir-migracion.js,
     js/tipos-nombre.js): una clave más, `_esquema`, rompería esos
     recorridos exactamente igual que le pasaría a una lista. */
  var SIN_ESQUEMA = ['guias.json'];

  /* Fila 178, punto 3: antes de escribir uno de los FICHEROS cuyo
     contenido sea un objeto de forma fija (nunca una lista, ahí
     `_esquema` no cabe y JSON.stringify la ignora sin avisar; ni
     `guias.json`, ver arriba), se relee del disco. Si trae un
     `_esquema` mayor que el de esta app, no se escribe: se lanza
     EsquemaMasNuevo. Si no, se deja (o se añade) `_esquema: ESQUEMA`
     en el propio objeto que se va a guardar. */
  async function comprobarEsquemaAntesDeEscribir(gestor, nombre, objeto) {
    if (FICHEROS.indexOf(nombre) === -1 || SIN_ESQUEMA.indexOf(nombre) !== -1) return;
    if (!objeto || typeof objeto !== 'object' || Array.isArray(objeto)) return;
    /* Con Carpetas.leerTexto (+ JSON.parse aquí mismo), no con
       Carpetas.leerJson: así esta comprobación no suma una relectura
       más a las que ya cuentan pruebas/repintar-solo-lo-que-cambia.mjs
       ('leerTexto:<fichero>' ya estaba permitido, por la copia del día
       de copiarSiHaceFalta; un fichero roto no para aquí, ya lo trata
       Copias.comprobarTodos). */
    var actual = null;
    try {
      var textoActual = await Carpetas.leerTexto(gestor, nombre);
      actual = textoActual === null ? null : JSON.parse(textoActual);
    } catch (e) { actual = null; }
    var esquemaEnDisco = (actual && typeof actual === 'object' && !Array.isArray(actual)) ? actual._esquema : undefined;
    if (typeof esquemaEnDisco === 'number' && esquemaEnDisco > ESQUEMA) {
      var error = new Error('En el otro ordenador hay una versión más nueva de la aplicación. ' +
        'Recarga la página para ponerte al día.');
      error.name = 'EsquemaMasNuevo';
      throw error;
    }
    /* Nunca hacia abajo: una fusión (js/conflictos.js) puede haber
       dejado ya un `_esquema` mayor que el de esta app (el del otro
       lado del conflicto); esto solo sube el que hubiera hasta
       ESQUEMA como mínimo, sin bajarlo nunca. */
    objeto._esquema = Math.max(ESQUEMA, Number(objeto._esquema) || 0);
  }

  /* Lo que hay que llamar en vez de Carpetas.guardarJson para los
     ficheros compartidos: guarda la copia del día (verificada) y
     comprueba el esquema antes de escribir. */
  function guardar(gestor, nombre, objeto) {
    /* Cuenta como guardado en marcha (fila 99): las tareas de fondo
       esperan a la siguiente pasada. */
    var hacer = async function () {
      await copiarSiHaceFalta(gestor, nombre);
      await comprobarEsquemaAntesDeEscribir(gestor, nombre, objeto);
      await Carpetas.guardarJson(gestor, nombre, objeto);
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
