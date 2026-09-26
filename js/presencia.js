/* ============================================================
   presencia.js — no pisarse cuando los dos entran en el mismo asunto
   (17-sep-2026, fila 24).

   La aplicación la usan dos personas sobre la misma carpeta de
   Dropbox. Aquí se apunta quién tiene abierta la ficha de cada asunto,
   para que el otro entre en MODO CONSULTA (ve todo, no toca nada) en
   vez de escribir encima sin saberlo. Nunca se deja fuera a nadie: el
   botón "Tomar el mando" siempre está.

   Fila 176 (docs/DATOS-ENTRE-ORDENADORES.md, punto 5): vive en
   `_GESTOR/presencia/<usuario>.json`, uno por usuario (el nombre del
   fichero es el mismo "hueso" que usa U.parecidos: sin tildes,
   mayúsculas ni espacios), EXPRESAMENTE fuera de los dieciocho
   ficheros protegidos (ver docs/CONTEXTO.md, "Lo que la aplicación
   guarda en _GESTOR"): se escribe muy a menudo y es un dato que
   caduca solo, así que ni necesita copia de seguridad, ni papelera, ni
   la fusión de conflictos de Dropbox de los demás (que ni lo tocan:
   `js/copias.js`, `js/papelera.js` y `js/conflictos.js` solo trabajan
   con los ficheros que tienen apuntados, y esta carpeta no está en esa
   lista; js/conflictos.js sí borra sin preguntar cualquier copia en
   conflicto que quede dentro). Se lee y se escribe directo con
   `Carpetas`, sin pasar por `Copias.guardar`.

   Antes de esta fila era un único `_GESTOR/presencia.json` que escribían
   los dos ordenadores cada 30 segundos: Dropbox dejaba constantemente
   "presencia (copia en conflicto...)" que nadie limpiaba. Con un
   fichero por ordenador (por usuario) ya no hay nada que choque: cada
   uno solo escribe el suyo. El fichero viejo (y sus copias en
   conflicto) se borran solos la primera vez que se entra después de
   esta fila.

   Este fichero es el modelo y la vigilancia; `js/ficha-asunto.js` es
   quien pinta el aviso y apaga los controles, y `js/asuntos-lista.js`
   quien pinta la marca en la tarjeta (ambos, por envoltura, sin que
   este fichero sepa nada de cómo se ve nada).

   Se carga después de `js/puente.js` (usa `window.Gestor`),
   `js/asuntos-lista.js`, `js/ficha-asunto.js` y
   `js/documentos-sueltos.js` (envuelve `App.tarjetaAsunto` y
   `App.vigilarLaCarpeta`).
   ============================================================ */
var Presencia = (function () {

  var CARPETA = 'presencia';
  var FICHERO_VIEJO = 'presencia.json';
  var RENUEVA_MS = 30 * 1000;
  var CADUCA_MS = 3 * 60 * 1000;
  var RELEE_MS = 10 * 1000;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }
  function usuario() { return (window.Gestor && window.Gestor.usuario()) || ''; }

  /* El mismo "hueso" que usa U.parecidos (sin tildes, mayúsculas ni
     espacios): así "Francisco" y "francisco" son el mismo fichero, y
     nunca chocan con nada raro que traiga el nombre de quien entra. */
  function nombreDeFichero(nombreUsuario) {
    var h = (window.U && U.hueso) ? U.hueso(nombreUsuario) : String(nombreUsuario || '').toLowerCase();
    return (h || 'sin-nombre') + '.json';
  }

  async function carpeta() {
    var g = gestor();
    if (!g) return null;
    try { return await Carpetas.crear(g, CARPETA); } catch (e) { return null; }
  }

  function vigente(entrada) {
    if (!entrada || !entrada.ultima) return false;
    var t = new Date(entrada.ultima).getTime();
    return !isNaN(t) && (Date.now() - t) < CADUCA_MS;
  }

  /* ==========================================================
     EL FICHERO PROPIO, LEÍDO Y ESCRITO DIRECTO (sin Copias.guardar)

     Cada ordenador solo lee y escribe el fichero de SU usuario: ya no
     hay nada que dos ordenadores puedan pisarse, así que no hace falta
     ni releer antes de escribir ni fusionar nada.
     ========================================================== */

  async function leerPropio() {
    var c = await carpeta();
    if (!c) return {};
    var leido;
    try { leido = await Carpetas.leerJson(c, nombreDeFichero(usuario())); } catch (e) { return {}; }
    var asuntos = (leido && typeof leido.asuntos === 'object' && leido.asuntos) ? leido.asuntos : {};
    var limpio = {};
    Object.keys(asuntos).forEach(function (clave) { if (vigente(asuntos[clave])) limpio[clave] = asuntos[clave]; });
    return limpio;
  }

  async function escribirPropio(asuntos) {
    var c = await carpeta();
    if (!c) return;
    await Carpetas.escribirTexto(c, nombreDeFichero(usuario()), JSON.stringify({ usuario: usuario(), asuntos: asuntos }));
  }

  /* Todos los usuarios a la vez, para saber quién está dentro de cada
     asunto: { clave: { usuario, ultima } }. Un fichero por usuario,
     leídos todos (son pequeños y pocos: uno por persona del centro). */
  async function leerTodos() {
    var c = await carpeta();
    if (!c) return {};
    var lista;
    try { lista = await Carpetas.ficheros(c); } catch (e) { return {}; }
    var combinado = {};
    for (var i = 0; i < lista.length; i++) {
      var nombre = lista[i].nombre;
      if (!/\.json$/i.test(nombre) || /conflic/i.test(nombre)) continue;
      var leido;
      try { leido = await Carpetas.leerJson(c, nombre); } catch (e) { continue; }
      var quien = (leido && leido.usuario) || '';
      var asuntos = (leido && typeof leido.asuntos === 'object' && leido.asuntos) ? leido.asuntos : {};
      Object.keys(asuntos).forEach(function (clave) {
        if (!vigente(asuntos[clave])) return;
        var ya = combinado[clave];
        /* Si dos usuarios anuncian el mismo asunto a la vez (uno lo tenía
           ya abierto cuando el otro entra, antes de que el primero se
           entere y pase a modo consulta), gana el anuncio más reciente:
           es lo mismo que hacía el `presencia.json` único de antes, donde
           solo podía haber una señal por asunto y ganaba quien escribiera
           el último. */
        if (ya && ya.ultima >= asuntos[clave].ultima) return;
        combinado[clave] = { usuario: quien, ultima: asuntos[clave].ultima };
      });
    }
    return combinado;
  }

  /* Pone (o pisa) la propia señal en 'clave' y guarda solo el fichero
     propio. */
  async function anunciar(clave) {
    var asuntos = await leerPropio();
    asuntos[clave] = { ultima: U.ahora() };
    await escribirPropio(asuntos);
  }

  /* Solo quita la propia señal: como cada ordenador solo escribe su
     fichero, nunca puede quitar la de otro por error. */
  async function quitar(clave) {
    var asuntos = await leerPropio();
    if (asuntos[clave]) { delete asuntos[clave]; await escribirPropio(asuntos); }
  }

  /* Fila 62 (docs/RENOMBRAR-SIN-PERDER-HITOS.md): cuando un asunto
     cambia de clave (se renombra, se une con otro, se borra), la señal
     de quién está dentro tiene que viajar con él, en el fichero propio. */
  async function mover(claveVieja, claveNueva) {
    if (claveVieja === claveNueva) return;
    var asuntos = await leerPropio();
    if (asuntos[claveVieja]) {
      asuntos[claveNueva] = asuntos[claveVieja];
      delete asuntos[claveVieja];
      await escribirPropio(asuntos);
    }
  }

  /* Al borrar el asunto del todo (mandado a la papelera): la señal no
     tiene ya ningún sitio adonde viajar. */
  async function borrarClave(clave) {
    var asuntos = await leerPropio();
    if (asuntos[clave]) { delete asuntos[clave]; await escribirPropio(asuntos); }
  }

  /* Quién tiene 'clave' ahora mismo, si no es uno mismo. Null si está
     libre, caducada, o es la propia señal. */
  async function quienEstaDentro(clave) {
    var mapa = await leerTodos();
    var e = mapa[clave];
    if (!e || e.usuario === usuario()) return null;
    return { usuario: e.usuario };
  }

  /* El presencia.json de antes de esta fila (y sus copias en
     conflicto), borrados solos al entrar: ya no lo escribe nadie, y
     js/conflictos.js no lo mira porque no está en Copias.FICHEROS. Se
     llama una sola vez por sesión, desde el envoltorio de
     App.vigilarLaCarpeta (que también se llama una sola vez, justo
     después de entrar): no hace falta ningún guardián propio. */
  async function borrarFicheroViejo() {
    var g = gestor();
    if (!g) return;
    try {
      var lista = await Carpetas.ficheros(g);
      for (var i = 0; i < lista.length; i++) {
        var nombre = lista[i].nombre;
        if (nombre === FICHERO_VIEJO || (/^presencia\s*\([^)]*conflic[^)]*\)\.json$/i.test(nombre))) {
          try { await g.removeEntry(nombre); } catch (e) { /* se intenta la próxima vez */ }
        }
      }
    } catch (e) { /* no crítico */ }
  }

  /* ==========================================================
     VIGILAR UNA FICHA ABIERTA
     ========================================================== */

  var vigilando = null;   /* { clave, timer, modo, ultimaAnunciada } */

  /* Fila 99 (docs/GUARDAR-EN-FILA.md): una pasada no se solapa con la
     anterior, y con un guardado en marcha se salta (la siguiente, a los
     10 s, ya lo hará). */
  var actualizando = false;

  async function actualizar() {
    if (!vigilando || actualizando) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    actualizando = true;
    try { await actualizarUnaVez(); } finally { actualizando = false; }
  }

  async function actualizarUnaVez() {
    if (!vigilando) return;
    var clave = vigilando.clave;
    var ocupante = await quienEstaDentro(clave);
    if (!vigilando || vigilando.clave !== clave) return;   /* se ha cambiado de ficha mientras leíamos */

    if (ocupante) {
      /* Solo se avisa cuando cambia algo (fila 101): antes se avisaba
         cada 10 s, y la ficha pintaba el aviso otra vez encima. */
      var yaEra = vigilando.modo === 'consulta' && vigilando.usuarioConsulta === ocupante.usuario;
      vigilando.modo = 'consulta';
      vigilando.usuarioConsulta = ocupante.usuario;
      if (!yaEra) vigilando.onCambio({ modo: 'consulta', usuario: ocupante.usuario });
      return;
    }

    var ahora = Date.now();
    var eraConsulta = vigilando.modo === 'consulta' || vigilando.modo === null;
    if (eraConsulta || (ahora - vigilando.ultimaAnunciada) >= RENUEVA_MS) {
      await anunciar(clave);
      if (!vigilando || vigilando.clave !== clave) return;
      vigilando.ultimaAnunciada = ahora;
    }
    if (eraConsulta) {
      vigilando.modo = 'normal';
      vigilando.onCambio({ modo: 'normal' });
    }
  }

  /* Empieza a vigilar 'clave': comprueba si está libre, anuncia la
     propia señal si lo está, y a partir de ahí relee cada 10 segundos
     (renovando la propia señal cada 30). 'onCambio' se llama cada vez
     que el modo pasa de consulta a normal o de normal a consulta (para
     pintar el aviso y apagar o encender los controles). */
  function vigilar(clave, onCambio) {
    dejarDeVigilar();
    vigilando = { clave: clave, onCambio: onCambio, modo: null, ultimaAnunciada: 0 };
    actualizar();
    vigilando.timer = setInterval(actualizar, RELEE_MS);
  }

  /* Deja de vigilar la ficha actual. Si se tenía el mando (modo
     'normal'), se quita la propia señal: así el siguiente que entre no
     se encuentra un "ocupado" fantasma. Si solo se estaba consultando,
     no hay nada propio que quitar. */
  function dejarDeVigilar() {
    if (!vigilando) return;
    clearInterval(vigilando.timer);
    var clave = vigilando.clave, modo = vigilando.modo;
    vigilando = null;
    if (modo === 'normal') quitar(clave);
  }

  /* "Tomar el mando": pisa la señal del otro con la propia. Si es la
     ficha que se está vigilando ahora mismo, pasa a modo normal sin
     esperar a la siguiente vuelta de 10 segundos. */
  async function tomarElMando(clave) {
    await anunciar(clave);
    if (vigilando && vigilando.clave === clave) {
      vigilando.modo = 'normal';
      vigilando.ultimaAnunciada = Date.now();
    }
  }

  /* ==========================================================
     LA MARCA EN LA LISTA DE "ASUNTOS ABIERTOS"
     ========================================================== */

  /* Una copia en memoria, para que pintar una tarjeta no tenga que
     esperar a leer el disco. Se refresca sola cada 10 segundos
     mientras la aplicación esté abierta (enganchado a
     App.vigilarLaCarpeta, más abajo). */
  var cache = {};

  async function refrescarCache() {
    cache = await leerTodos();
  }

  /* El usuario que tiene 'clave' ahora mismo, o '' si está libre, ha
     caducado, o es uno mismo (que no necesita marca en su propia
     lista). */
  function ocupantePor(clave) {
    var e = cache[clave];
    if (!vigente(e) || e.usuario === usuario()) return '';
    return e.usuario;
  }

  /* Una huella de quién está dentro de qué, ahora mismo, en la caché.
     Sirve para saber si de verdad ha cambiado algo entre una lectura y
     la siguiente (fila 33, 17-sep-2026): si nadie ha entrado ni salido
     de ningún asunto, la huella sale igual. */
  function huella() {
    return Object.keys(cache).sort().map(function (clave) {
      return clave + ':' + cache[clave].usuario;
    }).join('|');
  }

  return {
    CARPETA: CARPETA,
    vigilar: vigilar, dejarDeVigilar: dejarDeVigilar, tomarElMando: tomarElMando,
    ocupantePor: ocupantePor, refrescarCache: refrescarCache, huella: huella,
    mover: mover, borrarClave: borrarClave, borrarFicheroViejo: borrarFicheroViejo
  };
})();
window.Presencia = Presencia;

/* ---------- enganchar la vigilancia global de la lista ----------

   Se apoya en App.vigilarLaCarpeta (js/documentos-sueltos.js), que ya
   se llama una vez al entrar: así no hace falta tocar js/nucleo.js
   para arrancar nada.

   Antes esto repintaba la lista cada 10 segundos, hubiera cambiado
   algo o no, y sin mirar si alguien estaba escribiendo: se llevaba por
   delante el tablón de notas a medio escribir (fila 33, 17-sep-2026).
   Ahora solo repinta si la huella de quién está dentro de cada asunto
   ha cambiado de verdad, y nunca mientras el foco esté en un campo. */
(function () {
  var ultimaHuella = null;

  /* Si se está escribiendo en cualquier campo, esta vuelta no toca la
     pantalla: ni el tablón, ni ningún otro formulario abierto. */
  function escribiendoAhoraMismo() {
    var el = document.activeElement;
    if (!el) return false;
    if (el.isContentEditable) return true;
    var etiqueta = el.tagName ? el.tagName.toLowerCase() : '';
    return etiqueta === 'input' || etiqueta === 'textarea' || etiqueta === 'select';
  }

  U.envolver(window.App, 'App.vigilarLaCarpeta', 'presencia.js', function (comoEra) {
    return function () {
      comoEra();
      Presencia.borrarFicheroViejo();
      Presencia.refrescarCache().then(function () {
        ultimaHuella = Presencia.huella();
        if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
      });
      var refrescando = false;
      setInterval(function () {
        /* Fila 99: sin solaparse, y nunca con un guardado en marcha. */
        if (refrescando || (window.ColaGuardado && ColaGuardado.hayGuardado())) return;
        refrescando = true;
        Presencia.refrescarCache().then(function () { refrescando = false; }, function () { refrescando = false; })
        .then(function () {
          var pantalla = document.getElementById('pantalla-abiertos');
          if (!pantalla || pantalla.classList.contains('oculto') || typeof App.pintarAbiertos !== 'function') return;
          if (escribiendoAhoraMismo()) return;   /* se deja la huella sin actualizar: se repinta en la siguiente vuelta */
          var huellaAhora = Presencia.huella();
          if (huellaAhora === ultimaHuella) return;   /* nadie ha entrado ni salido de ningún asunto */
          ultimaHuella = huellaAhora;
          App.pintarAbiertos();
        });
      }, 10 * 1000);
    };
  });
})();

/* ---------- la marca pequeña en la tarjeta de "Asuntos abiertos" ----------

   Solo en abierto: en el ARCHIVO nadie está "dentro" de nada. */
(function () {
  U.envolver(window.App, 'App.tarjetaAsunto', 'presencia.js', function (comoEra) {
    return function (a, modo) {
      var div = comoEra(a, modo);
      if (modo !== 'abierto') return div;
      var quien = Presencia.ocupantePor(a.nombre);
      if (!quien) return div;
      var nombre = div.querySelector('.tarjeta-nombre');
      if (!nombre) return div;
      var marca = document.createElement('span');
      marca.className = 'marca-presencia';
      marca.title = quien + ' está dentro de este asunto ahora mismo';
      marca.textContent = quien.charAt(0).toUpperCase();
      nombre.insertBefore(marca, nombre.firstChild);
      return div;
    };
  });
})();

/* ---------- soltar la señal al cerrar la pestaña o salir ----------

   Mejor esfuerzo: el navegador no garantiza que una escritura
   asíncrona termine en 'pagehide'. Si no llega a tiempo, la señal
   caduca sola a los 3 minutos (por eso existe ese plazo). */
window.addEventListener('pagehide', function () {
  Presencia.dejarDeVigilar();
});
