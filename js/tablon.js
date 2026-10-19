/* ============================================================
   tablon.js — el tablón de notas rápidas: leer, guardar y quién ve
   qué. Todo lo que es pantalla (la columna compacta, cada nota, el
   formulario) vive en js/tablon-compacto.js, que se carga justo
   detrás (fila 212, docs/INICIO-A-TODO-EL-ANCHO.md: este fichero
   pasaba de 600 líneas al meter ahí también el modo compacto).

   No todo lo que llega es un asunto. "Llamar a fulano", "el director
   dice que el lunes hay claustro", "preguntar en Séneca por lo del
   transporte". Eso antes acababa en un papel encima de la mesa.

   Las notas se guardan en _GESTOR/tablon.json, dentro de la carpeta de
   asuntos abiertos: las ve el compañero desde su ordenador, igual que
   los asuntos. Antes de escribir se vuelve a leer el fichero, para no
   pisar lo que él haya puesto mientras tanto.

   Una nota puede marcarse "Solo para mí": entonces sale únicamente en
   el tablón de quien la escribió. No es un secreto —el fichero está en
   la carpeta compartida y quien lo abra la leería—, es para no llenarle
   el tablón al otro de recordatorios que no son suyos.
   ============================================================ */
(function () {

  var FICHERO = 'tablon.json';

  var COLORES = ['amarillo', 'azul', 'verde', 'rosa'];

  /* Fila 372 (docs/TABLON-AVISO-A-HORA-FIJA.md): cuántos minutos antes de
     la hora se avisa; el primero es «a la hora justa». */
  var ANTELACIONES = [0, 15, 30, 60];
  var ANTES_DE_FABRICA = 15;

  var notas = [];
  var arrancado = false;
  var reglaAplicada = false;
  var fallo = '';           /* lo último que ha ido mal al leer o escribir */

  function $(id) { return document.getElementById(id); }

  function pintarVista() { if (window.TablonVista) TablonVista.pintar(); }

  /* ---------- leer y escribir ---------- */

  function horaValida(n) {
    return /^\d{4}-\d{2}-\d{2}$/.test(n.para || '') && /^([01]\d|2[0-3]):[0-5]\d$/.test(n.hora || '') ? n.hora : '';
  }

  function antesValido(v) {
    return typeof v === 'number' && ANTELACIONES.indexOf(v) !== -1 ? v : ANTES_DE_FABRICA;
  }

  /* El momento de la cita y el del aviso (hora local), si la nota tiene hora. */
  function cita(n) {
    if (!n.hora) return null;
    var d = n.para.split('-'), h = n.hora.split(':');
    return new Date(+d[0], +d[1] - 1, +d[2], +h[0], +h[1]);
  }

  function momentoAviso(n) {
    var c = cita(n);
    return c ? new Date(c.getTime() - n.antes * 60000) : null;
  }

  /* Cada «Entendido» se guarda con el momento al que respondía: si luego
     se cambia el día, la hora o la antelación, el viejo ya no cuenta. */
  function claveAviso(n) { return n.hora ? n.para + ' ' + n.hora + ' ' + n.antes : ''; }

  function atendidaPorMi(n) {
    var yo = U.normalizar(quienSoy()), k = claveAviso(n);
    return !!yo && n.atendido.some(function (a) { return a.m === k && U.normalizar(a.q) === yo; });
  }

  function normalizar(leido) {
    var lista = (leido && leido.notas) || [];
    return lista.filter(function (n) { return n && n.texto; }).map(function (n) {
      return {
        id: String(n.id || ''),
        texto: String(n.texto || ''),
        color: COLORES.indexOf(n.color) === -1 ? 'amarillo' : n.color,
        autor: String(n.autor || ''),
        creado: String(n.creado || ''),
        para: /^\d{4}-\d{2}-\d{2}$/.test(n.para || '') ? n.para : '',
        /* Fila 372: hora (solo con día), antelación y quién ha atendido
           el aviso. Opcionales: las notas viejas siguen valiendo. */
        hora: horaValida(n),
        antes: horaValida(n) ? antesValido(n.antes) : 0,
        atendido: (Array.isArray(n.atendido) ? n.atendido : []).filter(function (a) {
          return a && a.q && a.m;
        }).map(function (a) { return { q: String(a.q), m: String(a.m) }; }),
        privada: !!n.privada,
        hecha: !!n.hecha,
        hechaPor: String(n.hechaPor || ''),
        hechaEl: String(n.hechaEl || '')
      };
    });
  }

  function enFila(fichero, fn) { return window.ColaGuardado ? ColaGuardado.poner(fichero, fn) : fn(); }

  async function leer() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return [];
    var leido = await Carpetas.leerJson(g, FICHERO);
    return normalizar(leido);
  }

  /* Todo cambio pasa por aquí: se relee el fichero, se aplica el cambio
     sobre lo que hay ahora mismo, y se escribe. Así dos ordenadores no
     se borran las notas el uno al otro. */
  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): leer, cambiar y
     escribir, en fila con los demás guardados de tablon.json. */
  async function cambiar(hacer) {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return;
    try {
      var lista = await enFila(FICHERO, async function () {
        var l = await leer();
        l = hacer(l) || l;
        await Copias.guardar(g, FICHERO, { notas: l });
        return l;
      });
      notas = lista;
      pintarVista();
    } catch (e) {
      U.aviso('No he podido guardar la nota: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* Una lectura nueva del fichero, sin tocar lo que se está enseñando
     (la usa la ventana del aviso, justo antes de salir). */
  async function leerFresco() { return await leer(); }

  /* ---------- quién soy, y qué notas veo ----------

     Una nota privada es de quien la escribió. Se comparan los nombres
     con los que se entra en la aplicación, sin mayúsculas ni tildes. */

  function quienSoy() {
    return (window.Gestor && window.Gestor.usuario && window.Gestor.usuario()) || '';
  }

  function laVeo(n) {
    if (!n.privada) return true;
    return U.normalizar(n.autor) === U.normalizar(quienSoy());
  }

  /* ---------- arranque ---------- */

  /* La columna se pinta ANTES de leer el fichero. Si la lectura falla,
     el tablón sigue estando ahí y lo dice, en vez de no aparecer y dejar
     a uno mirando la pantalla sin saber qué ha pasado. */
  async function refrescar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    pintarVista();
    try {
      notas = await leer();
      fallo = '';
      pintarVista();
      if (window.TablonAvisos) TablonAvisos.revisar();
      /* Fila 353: la regla de apertura (una nota para hoy → abierto) se
         aplica al arrancar, en cuanto hay notas leídas. */
      if (!reglaAplicada && window.TablonVista && TablonVista.reglaApertura) {
        reglaAplicada = true;
        TablonVista.reglaApertura();
      }
    } catch (e) {
      fallo = U.mensajeDeError(e) || 'no he podido leer las notas';
      pintarVista();
    }
  }

  var enganchado = false;

  function enganchar() {
    if (enganchado || !window.Gestor) return;
    enganchado = true;
    window.Gestor.alRefrescar.push(function () {
      if (!window.Gestor.carpetaGestor()) return;
      if (!arrancado) { arrancado = true; refrescar(); return; }
      /* Mientras se escribe una nota, o se está cambiando una ya
         puesta, no se relee: el repintado no debe quitarle el sitio al
         cursor (TablonVista.ocupado, en js/tablon-compacto.js). */
      if (window.TablonVista && TablonVista.ocupado && TablonVista.ocupado()) return;
      refrescar();
    });
  }

  /* El puente ya está puesto cuando se carga este fichero. Por si algún
     día cambiara el orden, se reintenta al terminar la página. */
  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

  /* Lo que usa js/tablon-compacto.js (la pantalla) y las pruebas (fila
     130: el mismo cambiar() que usan los botones). */
  window.Tablon = {
    _cambiar: cambiar,
    notas: function () { return notas; },
    fallo: function () { return fallo; },
    laVeo: laVeo,
    quienSoy: quienSoy,
    cambiar: cambiar,
    leerFresco: leerFresco,
    ANTELACIONES: ANTELACIONES,
    ANTES_DE_FABRICA: ANTES_DE_FABRICA,
    cita: cita,
    momentoAviso: momentoAviso,
    claveAviso: claveAviso,
    atendidaPorMi: atendidaPorMi
  };

})();
