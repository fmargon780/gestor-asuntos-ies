/* ============================================================
   presencia.js — no pisarse cuando los dos entran en el mismo asunto
   (17-sep-2026, fila 24).

   La aplicación la usan dos personas sobre la misma carpeta de
   Dropbox. Aquí se apunta quién tiene abierta la ficha de cada asunto,
   para que el otro entre en MODO CONSULTA (ve todo, no toca nada) en
   vez de escribir encima sin saberlo. Nunca se deja fuera a nadie: el
   botón "Tomar el mando" siempre está.

   Vive en `_GESTOR/presencia.json`, EXPRESAMENTE fuera de los doce
   ficheros protegidos (ver docs/CONTEXTO.md, "Lo que la aplicación
   guarda en _GESTOR"): se escribe muy a menudo y es un dato que
   caduca solo, así que ni necesita copia de seguridad, ni papelera, ni
   la fusión de conflictos de Dropbox de los demás (que ni lo tocan:
   `js/copias.js`, `js/papelera.js` y `js/conflictos.js` solo trabajan
   con los ficheros que tienen apuntados, y este no está en esa
   lista). Se lee y se escribe directo con `Carpetas`, sin pasar por
   `Copias.guardar`.

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

  var FICHERO = 'presencia.json';
  var RENUEVA_MS = 30 * 1000;
  var CADUCA_MS = 3 * 60 * 1000;
  var RELEE_MS = 10 * 1000;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }
  function usuario() { return (window.Gestor && window.Gestor.usuario()) || ''; }

  /* ==========================================================
     EL FICHERO, LEÍDO Y ESCRITO DIRECTO (sin Copias.guardar)
     ========================================================== */

  async function leer() {
    var g = gestor();
    if (!g) return {};
    var leido;
    try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { return {}; }
    return (leido && typeof leido === 'object') ? leido : {};
  }

  async function escribir(mapa) {
    var g = gestor();
    if (!g) return;
    await Carpetas.escribirTexto(g, FICHERO, JSON.stringify(mapa));
  }

  function vigente(entrada) {
    if (!entrada || !entrada.ultima) return false;
    var t = new Date(entrada.ultima).getTime();
    return !isNaN(t) && (Date.now() - t) < CADUCA_MS;
  }

  /* Quita las señales caducadas, para no dejar crecer el fichero con
     sesiones que ya nadie va a renovar. */
  function limpiar(mapa) {
    var salida = {};
    Object.keys(mapa).forEach(function (clave) {
      if (vigente(mapa[clave])) salida[clave] = mapa[clave];
    });
    return salida;
  }

  /* Relee, limpia lo caducado, pone (o pisa) la propia señal en
     'clave' y guarda. Se relee justo antes de escribir, como todo
     fichero compartido: si el compañero ha anunciado otro asunto
     mientras tanto, no se pierde. */
  async function anunciar(clave) {
    var mapa = limpiar(await leer());
    mapa[clave] = { usuario: usuario(), ultima: U.ahora() };
    await escribir(mapa);
  }

  /* Solo quita la propia señal: nunca la de otro (por si esto se
     llama tarde, después de que alguien haya tomado el mando). */
  async function quitar(clave) {
    var mapa = limpiar(await leer());
    if (mapa[clave] && mapa[clave].usuario === usuario()) {
      delete mapa[clave];
      await escribir(mapa);
    }
  }

  /* Fila 62 (docs/RENOMBRAR-SIN-PERDER-HITOS.md): cuando un asunto
     cambia de clave (se renombra, se une con otro, se borra), la señal
     de quién está dentro tiene que viajar con él. Se relee justo antes
     de escribir, como todo lo de aquí. */
  async function mover(claveVieja, claveNueva) {
    if (claveVieja === claveNueva) return;
    var mapa = limpiar(await leer());
    if (mapa[claveVieja]) {
      mapa[claveNueva] = mapa[claveVieja];
      delete mapa[claveVieja];
      await escribir(mapa);
    }
  }

  /* Al borrar el asunto del todo (mandado a la papelera): la señal no
     tiene ya ningún sitio adonde viajar. */
  async function borrarClave(clave) {
    var mapa = limpiar(await leer());
    if (mapa[clave]) {
      delete mapa[clave];
      await escribir(mapa);
    }
  }

  /* Quién tiene 'clave' ahora mismo, si no es uno mismo. Null si está
     libre, caducada, o es la propia señal. */
  async function quienEstaDentro(clave) {
    var mapa = await leer();
    var e = mapa[clave];
    if (!vigente(e) || e.usuario === usuario()) return null;
    return { usuario: e.usuario };
  }

  /* ==========================================================
     VIGILAR UNA FICHA ABIERTA
     ========================================================== */

  var vigilando = null;   /* { clave, timer, modo, ultimaAnunciada } */

  async function actualizar() {
    if (!vigilando) return;
    var clave = vigilando.clave;
    var ocupante = await quienEstaDentro(clave);
    if (!vigilando || vigilando.clave !== clave) return;   /* se ha cambiado de ficha mientras leíamos */

    if (ocupante) {
      vigilando.modo = 'consulta';
      vigilando.onCambio({ modo: 'consulta', usuario: ocupante.usuario });
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
    cache = limpiar(await leer());
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
    FICHERO: FICHERO,
    vigilar: vigilar, dejarDeVigilar: dejarDeVigilar, tomarElMando: tomarElMando,
    ocupantePor: ocupantePor, refrescarCache: refrescarCache, huella: huella,
    mover: mover, borrarClave: borrarClave
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

  U.envolver('App.vigilarLaCarpeta', window.App, 'vigilarLaCarpeta', 'js/presencia.js', function (comoEra) {
    return function () {
      comoEra();
      Presencia.refrescarCache().then(function () {
        ultimaHuella = Presencia.huella();
        if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
      });
      setInterval(function () {
        Presencia.refrescarCache().then(function () {
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
U.envolver('App.tarjetaAsunto', window.App, 'tarjetaAsunto', 'js/presencia.js', function (comoEra) {
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

/* ---------- soltar la señal al cerrar la pestaña o salir ----------

   Mejor esfuerzo: el navegador no garantiza que una escritura
   asíncrona termine en 'pagehide'. Si no llega a tiempo, la señal
   caduca sola a los 3 minutos (por eso existe ese plazo). */
window.addEventListener('pagehide', function () {
  Presencia.dejarDeVigilar();
});
