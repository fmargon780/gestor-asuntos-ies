/* ============================================================
   hitos-fichero.js — leer y guardar hitos.json, con su cola y el estado
   de la última lectura (fila 535: trozo de js/hitos.js; mismas
   funciones, solo cambian de fichero). Se carga después de
   js/hitos-normalizar.js y antes de js/hitos.js.
   ============================================================ */
(function () {

  var I = window.HitosNucleo = window.HitosNucleo || {};
  var FICHERO = I.FICHERO;
  function gestor() { return I.gestor.apply(this, arguments); }
  function normalizar() { return I.normalizar.apply(this, arguments); }
  function vacio() { return I.vacio.apply(this, arguments); }
  /* Fila 576: lo que dice el campo de cada asunto sobre sus hitos y tareas «Solo si» (js/solo-si.js). */
  function marcar(datos) { return window.SoloSi ? SoloSi.marcarTodo(datos) : datos; }

  /* La lectura pasa por la misma cola que el guardado (`cambiar`,
     más abajo): sin esto, una lectura lanzada mientras una escritura
     de hitos.json todavía está en marcha (una migración en segundo
     plano, al entrar en Ajustes) puede coger el fichero a medio
     escribir ("no se puede leer"), aunque nadie haya tocado nada de
     verdad. Encontrado en la fila 197 al sumar más trabajo asíncrono
     a la pantalla de Ajustes: el fallo ya podía pasar antes, solo que
     con menos probabilidad. */
  async function leer() {
    var g = gestor();
    if (!g) return vacio();
    var hacerlo = async function () {
      var leido = marcar(normalizar(await Carpetas.leerJson(g, FICHERO)));
      var n = Object.keys(leido.porAsunto).length;
      if (n) vistosConDatos = n;
      ultimos = leido;
      alLeer.forEach(function (f) { try { f(leido); } catch (e) { /* solo pintar */ } });
      return leido;
    };
    return window.ColaGuardado ? window.ColaGuardado.poner(FICHERO, hacerlo) : hacerlo();
  }

  /* Como todo fichero compartido: se relee justo antes de escribir, y
     todo pasa por Copias.guardar, nunca por Carpetas.guardarJson
     directo (sección 2.2 del encargo). 'hacer' recibe los datos ya
     releídos, los muta a gusto y los devuelve (o no devuelve nada, y
     se guarda igual: ya han quedado mutados). */
  /* Desde la fila 99 (docs/GUARDAR-EN-FILA.md), en fila con los demás
     guardados de hitos.json, y sin escribir encima de todo si la
     lectura llega vacía de repente (leerParaCambiar). */
  function cambiar(hacer) {
    var g = gestor();
    if (!g) return Promise.resolve(vacio());
    var hacerlo = async function () {
      var actual = await leerParaCambiar(g);
      var nuevo = hacer(actual) || actual;
      /* Fila 162: una espera a mano que ya no es del hito actual, fuera. */
      if (Hitos.limpiarEsperasViejas) Hitos.limpiarEsperasViejas(nuevo);
      await Copias.guardar(g, FICHERO, nuevo);
      ultimoCambio = Date.now();
      vistosConDatos = Object.keys(nuevo.porAsunto || {}).length;
      ultimos = nuevo;
      alCambiar.forEach(function (f) { try { f(nuevo); } catch (e) { /* solo avisar */ } });
      return nuevo;
    };
    return window.ColaGuardado ? window.ColaGuardado.poner(FICHERO, hacerlo) : hacerlo();
  }

  /* Cuántos asuntos con hitos se han visto en la última lectura buena.
     Si una lectura llega vacía y antes había, se relee dos veces y, si
     sigue vacía, error en vez de escribir (fila 99, punto 5.1). */
  var vistosConDatos = 0;

  /* Cuándo escribió hitos.json este ordenador por última vez (fila 101):
     quien pinta algo a partir de los hitos puede saltarse la relectura
     si no ha cambiado nada desde la suya. */
  var ultimoCambio = 0;
  function ultimoCambioLocal() { return ultimoCambio; }

  /* Lo último leído o escrito de hitos.json en este ordenador, sin ir
     al disco (fila 104: la lista de asuntos abiertos lo mira en cada
     repintado), y quién quiere enterarse de cada escritura. */
  var ultimos = null;
  function ultimosLeidos() { return ultimos; }
  var alCambiar = [];
  /* Y quién quiere enterarse de cada lectura (fila 129: la cabecera de la
     ficha enseña el hito actual con lo último leído). */
  var alLeer = [];
  var ESPERAS_LECTURA_VACIA_MS = [700, 1500];

  async function leerParaCambiar(g) {
    for (var i = 0; ; i++) {
      var datos = marcar(normalizar(await Carpetas.leerJson(g, FICHERO)));
      var n = Object.keys(datos.porAsunto).length;
      if (n || !vistosConDatos) { vistosConDatos = n; return datos; }
      if (i >= ESPERAS_LECTURA_VACIA_MS.length) {
        var e = new Error('hitos.json ha llegado vacío y hace un momento tenía los hitos de ' +
          vistosConDatos + ' asuntos. No he guardado nada para no borrarlos. Espera un poco ' +
          '(la nube puede estar sincronizando) y vuelve a intentarlo.');
        e.name = 'LecturaVacia';
        throw e;
      }
      await new Promise(function (ok) { setTimeout(ok, ESPERAS_LECTURA_VACIA_MS[i]); });
    }
  }

  async function hitosDe(clave) {
    var datos = await leer();
    var e = datos.porAsunto[clave];
    return e ? e.hitos : [];
  }

  I.leer = leer;
  I.cambiar = cambiar;
  I.ultimoCambioLocal = ultimoCambioLocal;
  I.ultimosLeidos = ultimosLeidos;
  I.alCambiar = alCambiar;
  I.alLeer = alLeer;
  I.hitosDe = hitosDe;
})();
