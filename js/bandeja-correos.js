/* ============================================================
   bandeja-correos.js — los correos que esperan a ser un asunto.

   En Gmail, a un correo se le pone la etiqueta GESTOR. Un script de
   Google Apps Script lo recoge cada pocos minutos y deja tres cosas
   en una carpeta de Drive llamada GESTOR-BANDEJA:

     <id>.json          la ficha del correo
     <id> - correo.pdf  el hilo entero en PDF
     <id> - <nombre>    cada documento adjunto

   Este módulo lee esa carpeta y enseña los correos arriba, en la
   pantalla de asuntos abiertos. De cada uno propone el asunto ya
   montado: quién es el tercero, de qué tipo es y con qué fecha.

   Al pulsar "Crear el asunto" no se crea nada por su cuenta: se
   rellena la pantalla de siempre, y el asunto lo crea él con el botón
   de siempre. Después, el PDF del correo y sus adjuntos entran solos
   en la carpeta recién creada, se apunta una nota con el remitente, y
   el correo desaparece de la bandeja.

   Hay un caso que no es un asunto nuevo: la respuesta a un correo que
   salió de aquí. Como esos correos llevan por asunto el nombre de la
   carpeta, al volver se reconocen, y entonces la tarjeta ofrece
   guardar el correo dentro de ese asunto en vez de crear otro. Si ese
   asunto ya estaba archivado, se ofrece reabrirlo.

   Desde el 16-sep-2026 hay algo más fuerte que esa adivinación por
   texto: la huella del hilo. Al guardar un correo en un asunto se
   apunta el identificador de su hilo en la ficha del asunto, y a
   partir de ahí ese hilo es suyo, se llame el asunto como se llame.
   Y si nada encaja, el botón "Elegir asunto" deja escogerlo a mano de
   la lista entera (js/bandeja-enlace.js). Nunca se guarda nada solo:
   siempre hay que pulsar.

   La carpeta de la bandeja se señala una vez en Ajustes. Mientras no
   se señale, este módulo no enseña nada y la aplicación funciona como
   siempre.

   La ficha se escribe la última en Drive, así que un correo se lee
   solo cuando su .json existe: nunca se coge uno a medio guardar.

   24-sep-2026 (fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md): este fichero
   ya NO vigila "encargos de correo" (el viejo "Borrador en camino").
   Mandar documentos por correo ahora envía de verdad, en el momento,
   desde js/correo-cuadro.js + js/correo-enviar.js: no hay nada que
   dejar en esta carpeta ni que revisar cada 15 segundos. Solo queda
   `limpiarEnviosViejos`, que se ejecuta una vez al arrancar por si
   quedara algún encargo `.envio.json`/`.listo.json`/`.error.json`
   suelto de antes de esta fila.
   Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): este fichero se parte por
   temas, sin cambiar nada de lo que hace. Aquí queda el núcleo (el
   estado, la carpeta, leer la bandeja, las fechas y el arranque); el
   resto vive en js/bandeja-huella.js (¿es la respuesta de un asunto?, la
   huella del hilo y el enlace a Gmail), js/bandeja-propuesta.js (la
   propuesta de asunto y la pantalla de Nuevo asunto),
   js/bandeja-guardar.js (leer el correo, guardarlo en un asunto y lo que
   pasa después de crearlo) y js/bandeja-ajustes.js (el bloque de Ajustes
   y la limpieza de los encargos viejos). Se hablan por
   `window.BandejaNucleo` (N), que solo usan estos cinco ficheros.
   ============================================================ */
(function () {

  var CLAVE = 'bandeja';           /* dónde se recuerda la carpeta */
  var SEGUNDOS_ENTRE_MIRADAS = 90;

  /* La lista de hilos que el recolector de Apps Script tiene que seguir
     vigilando aunque ya no lleven la etiqueta GESTOR. La escribe esta
     aplicación; el script solo la lee. Ver la sección "LA HUELLA DEL
     HILO", más abajo. */
  var FICHERO_SEGUIDOS = 'seguidos.json';

  var carpeta = null;
  var correos = [];
  var pendiente = null;            /* el correo que se está convirtiendo */
  var ultimaMirada = 0;
  var arrancado = false;
  var mirando = false;

  function $(id) { return document.getElementById(id); }

  /* Lo que comparten los cinco ficheros de la bandeja (fila 133). */
  var N = window.BandejaNucleo = {
    FICHERO_SEGUIDOS: FICHERO_SEGUIDOS,
    carpeta: function () { return carpeta; },
    correos: function () { return correos; },
    ponerCorreos: function (x) { correos = x; },
    pendiente: function () { return pendiente; },
    ponerPendiente: function (x) { pendiente = x; }
  };

  /* La bandeja en pantalla —la barra plegable, la caja, cada tarjeta—
     vive en js/bandeja-pantalla.js (17-sep-2026, fila 27, para no
     pasar de las 1.478 líneas aquí): se habla con ella por
     window.BandejaPantalla.pintar(), llamado cada vez que `correos`
     puede haber cambiado. */
  function repintarPantalla() {
    if (window.BandejaPantalla) window.BandejaPantalla.pintar();
  }

  /* ==========================================================
     LA CARPETA
     ========================================================== */

  async function recordarCarpeta() {
    try { carpeta = await Almacen.leer(CLAVE); } catch (e) { carpeta = null; }
  }

  async function elegirCarpeta() {
    try {
      var h = await window.showDirectoryPicker({ id: 'gestor-bandeja', mode: 'readwrite' });
      carpeta = h;
      await Almacen.guardar(CLAVE, h);
      N.pintarBloqueAjustes();
      ultimaMirada = 0;
      await mirar(true);
      U.aviso('Bandeja de correos señalada: ' + h.name, 'bueno');
    } catch (e) {
      if (e.name === 'AbortError') return;
      U.aviso('No he podido usar esa carpeta: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function olvidarCarpeta() {
    carpeta = null;
    correos = [];
    try { await Almacen.guardar(CLAVE, null); } catch (e) {}
    N.pintarBloqueAjustes();
    repintarPantalla();
  }

  /* Chrome solo devuelve el permiso sin preguntar si ya lo tenía. Para
     volver a pedirlo hace falta que él acabe de pulsar algo, y por eso
     hay un botón. */
  function tienePermiso(pedir) {
    if (!carpeta) return Promise.resolve(false);
    return Carpetas.permiso(carpeta, !!pedir).catch(function () { return false; });
  }

  /* ==========================================================
     LEER LA BANDEJA
     ========================================================== */

  async function mirar(aLaFuerza) {
    if (!carpeta || mirando) return;
    var ahora = Date.now();
    if (!aLaFuerza && ahora - ultimaMirada < SEGUNDOS_ENTRE_MIRADAS * 1000) return;
    mirando = true;
    try {
      if (!(await tienePermiso(false))) { correos = null; repintarPantalla(); return; }
      var lista = await Carpetas.ficheros(carpeta);
      var salida = [];
      for (var i = 0; i < lista.length; i++) {
        var n = lista[i].nombre;
        if (!/\.json$/i.test(n)) continue;
        /* Restos del viejo "Borrador en camino" (antes de la fila 115),
           por si quedara alguno sin limpiar todavía: no son correos que
           recoger. */
        if (/\.(envio|listo|error)\.json$/i.test(n)) continue;
        if (n === FICHERO_SEGUIDOS) continue;   /* ese lo escribimos nosotros */
        var d = await Carpetas.leerJson(carpeta, n);
        if (!d || !d.id) continue;
        /* Las fechas se dejan en AAAA-MM-DD, que es lo que entienden
           U.aAaMmDd y fechaLegible. Si el script del correo escribiera
           la hora también, el nombre del PDF saldría como
           "260909T10:00:00.000Z CORREO.pdf". */
        d.fecha = soloElDia(d.fecha);
        d.fechaUltimo = soloElDia(d.fechaUltimo);
        salida.push({ fichero: n, datos: d });
      }
      salida.sort(function (a, b) {
        var fa = String(a.datos.fecha || ''), fb = String(b.datos.fecha || '');
        return fa < fb ? -1 : (fa > fb ? 1 : 0);
      });
      correos = salida;
      ultimaMirada = ahora;
      repintarPantalla();
    } catch (e) {
      correos = null;
      repintarPantalla();
    }
    mirando = false;
  }

  /* ==========================================================
     UTILIDADES DE FECHA Y DE ICONO

     Las usa tanto lo de aquí abajo (notas, nombres de fichero) como
     js/bandeja-pantalla.js, que pinta la bandeja en pantalla
     (17-sep-2026, fila 27): por eso están expuestas en window.Bandeja,
     más abajo, en vez de vivir allí.
     ========================================================== */

  /* Se queda con el AAAA-MM-DD, venga la hora detrás o no. */
  function soloElDia(iso) {
    var t = String(iso || '');
    return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : t;
  }

  function fechaLegible(iso) {
    var p = soloElDia(iso).split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* "17-sep-2026 · 09:14", para "lo metió Juan el...". */
  function fechaHoraLegible(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '-' + MESES_CORTOS[d.getMonth()] + '-' + d.getFullYear() +
      ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function sobre() {
    return '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/>' +
      '<path d="m3.6 6.4 8.4 6 8.4-6"/></svg>';
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  async function arrancar() {
    if (arrancado) return;
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    arrancado = true;
    await recordarCarpeta();
    N.pintarBloqueAjustes();
    N.engancharElBotonDeCrear();
    await mirar(true);
    await N.limpiarEnviosViejos();
    await N.escribirSeguidos();
  }

  /* ==========================================================
     LO QUE USAN LOS DEMÁS FICHEROS DE LA BANDEJA
     ========================================================== */

  /* Pide el permiso otra vez y, si lo da, fuerza una mirada. Lo usa el
     botón de "La bandeja de correos necesita permiso otra vez", en
     js/bandeja-pantalla.js. Devuelve si ha quedado con permiso. */
  async function pedirPermiso() {
    if (!(await tienePermiso(true))) return false;
    ultimaMirada = 0;
    await mirar(true);
    return true;
  }

  /* `window.Bandeja` lo usan tres ficheros aparte, para no seguir
     engordando este: js/bandeja-enlace.js (el elegidor de asuntos a
     mano de un correo), js/correo-adjuntos.js (mandar documentos por
     correo) y js/bandeja-pantalla.js (la bandeja en pantalla,
     17-sep-2026, fila 27). A ninguno se le enseña nada más que esto.
     Desde la fila 133 cada fichero de la bandeja pone aquí lo suyo. */
  window.Bandeja = Object.assign(window.Bandeja || {}, {
    carpeta: function () { return carpeta; },
    /* Para js/bandeja-pantalla.js. */
    correos: function () { return correos; },
    mirarDeNuevo: function (aLaFuerza) { ultimaMirada = 0; return mirar(aLaFuerza !== false); },
    pedirPermiso: pedirPermiso,
    soloElDia: soloElDia,
    fechaLegible: fechaLegible,
    fechaHoraLegible: fechaHoraLegible,
    sobre: sobre
  });
  /* Lo que usan los otros cuatro ficheros de la bandeja (fila 133). */
  Object.assign(N, {
    repintarPantalla: repintarPantalla, tienePermiso: tienePermiso,
    elegirCarpeta: elegirCarpeta, olvidarCarpeta: olvidarCarpeta, mirar: mirar,
    soloElDia: soloElDia, fechaLegible: fechaLegible, fechaHoraLegible: fechaHoraLegible
  });

  var enganchado = false;

  function enganchar() {
    if (enganchado || !window.Gestor) return;
    enganchado = true;
    window.Gestor.alRefrescar.push(function () {
      if (!arrancado) { arrancar(); return; }
      mirar(false);
    });
  }

  /* El puente ya está puesto cuando se carga este fichero. Por si algún
     día cambiara el orden, se reintenta al terminar la página. */
  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

})();