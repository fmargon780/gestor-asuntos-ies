/* ============================================================
   elegir-asunto.js — el cuadro de elegir un asunto ya existente
   (16-sep-2026, docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md).

   Sirve para cuando hay un documento que hay que meter en un asunto
   que ya existe, en vez de crear uno nuevo: hoy lo usa "Meter en un
   asunto" de Por clasificar. Está pensado para que lo use también la
   bandeja de correos (fila 11 de docs/COLA.md) cuando se retome: cada
   sitio trae su propia forma de puntuar el parecido, y este módulo
   solo pone el cuadro, el buscador y la lista.
   ============================================================ */
var ElegirAsunto = (function () {

  function $(id) { return document.getElementById(id); }

  var MAXIMO_PODRIAN = 5;
  var PUNTOS_MINIMOS = 40;
  var MAXIMO_LISTA = 200;

  /* El nombre del tercero de un asunto, ya sea abierto o archivado: el
     de su ficha si lo tiene, y si no, el que se pueda leer del propio
     nombre de la carpeta. */
  function terceroDe(a) {
    if (a.ficha && a.ficha.tercero) return a.ficha.tercero;
    var leido = a.leido || Nombres.leer(a.nombre, App.E.tipos);
    return Nombres.terceroDeResto(leido.resto || '');
  }

  /* La fecha más reciente que se conoce del asunto: cuándo se abrió,
     o cuándo se movió (reabierto o archivado) por última vez. */
  function fechaDe(a) {
    var f = a.ficha || {};
    return f.reabiertoEl || f.cerradoEl || f.abiertoEl || '';
  }

  function creadoOMovidoHaceMenosDe30Dias(a) {
    var iso = fechaDe(a);
    if (!iso) return false;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    return (Date.now() - d.getTime()) < 30 * 86400000;
  }

  /* Todos los asuntos, abiertos y archivados, en una sola lista con la
     misma forma. El archivo se lee entero si todavía no se ha leído
     (o se relee, para no ofrecer algo que ya no está). */
  async function todosLosAsuntos() {
    try { await App.verArchivo(); } catch (e) { /* se sigue solo con los abiertos */ }

    var abiertos = (App.E.listaAbiertos || []).map(function (a) {
      return { nombre: a.nombre, archivado: false, ficha: a.ficha, leido: a.leido, handle: a.handle };
    });
    var archivados = (App.E.listaArchivo || []).map(function (a) {
      return { nombre: a.nombre, archivado: true, ficha: a.ficha, leido: a.leido, handle: a.handle, padre: a.padre };
    });
    return abiertos.concat(archivados);
  }

  /* ---------- palabras útiles de un texto ----------

     Para la puntuación por palabras: de cuatro letras o más, sin las
     que no dicen nada del tercero ni del tipo. */
  var PALABRAS_VACIAS = ['para', 'sobre', 'desde', 'con', 'los', 'las', 'del',
    'esta', 'este', 'estos', 'estas', 'entre', 'como', 'una', 'unos', 'unas'];

  function palabrasUtilesDe(texto) {
    return U.normalizar(texto).split(/[^a-z0-9]+/).filter(function (p) {
      return p.length >= 4 && PALABRAS_VACIAS.indexOf(p) === -1;
    });
  }

  /* ---------- el cuadro ---------- */

  function filaDeAsunto(a, alElegir) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ea-fila';
    b.innerHTML = U.escapar(a.nombre) +
      (a.archivado ? ' <span class="suave">(Archivado)</span>' : '');
    b.onclick = function () { alElegir(a); };
    return b;
  }

  /* Devuelve { accion: 'cancelar' } o { accion: 'elegido', asunto }.
     `opciones.titulo` y `opciones.calcularPuntuacion(asunto)` los pone
     quien llama; la puntuación depende de lo que se sepa (un correo,
     un nombre de fichero…), así que no se calcula aquí. */
  async function abrir(opciones) {
    opciones = opciones || {};
    var calcularPuntuacion = opciones.calcularPuntuacion || function () { return 0; };

    var todos = await todosLosAsuntos();
    var podrian = todos
      .map(function (a) { return { asunto: a, puntos: calcularPuntuacion(a) }; })
      .filter(function (p) { return p.puntos > PUNTOS_MINIMOS; })
      .sort(function (a, b) { return b.puntos - a.puntos; })
      .slice(0, MAXIMO_PODRIAN)
      .map(function (p) { return p.asunto; });

    var cuerpo =
      '<div id="ea-podrian"></div>' +
      '<label class="etiqueta">Todos los asuntos</label>' +
      '<input type="text" id="ea-buscar" class="campo" placeholder="Buscar por nombre…">' +
      '<div id="ea-todos" class="ea-lista"></div>';

    var promesa = U.preguntar(opciones.titulo || 'Elegir asunto', cuerpo, 'Cancelar', false);
    var aceptar = $('cuadro-aceptar');
    if (aceptar) aceptar.classList.add('oculto');

    var elegido = null;
    function elegir(a) {
      elegido = a;
      var cancelar = $('cuadro-cancelar');
      if (cancelar) cancelar.click();
    }

    var cajaPodrian = $('ea-podrian');
    if (podrian.length) {
      cajaPodrian.innerHTML = '<label class="etiqueta">Podrían encajar</label>';
      var envoltorio = document.createElement('div');
      envoltorio.className = 'ea-lista';
      podrian.forEach(function (a) { envoltorio.appendChild(filaDeAsunto(a, elegir)); });
      cajaPodrian.appendChild(envoltorio);
    }

    function pintarTodos() {
      var q = U.normalizar($('ea-buscar').value);
      var caja = $('ea-todos');
      caja.innerHTML = '';
      var lista = todos.filter(function (a) { return !q || U.normalizar(a.nombre).indexOf(q) !== -1; });
      if (!lista.length) {
        caja.innerHTML = '<div class="vacio">Nada coincide con lo que buscas.</div>';
        return;
      }
      var abiertos = lista.filter(function (a) { return !a.archivado; });
      var archivados = lista.filter(function (a) { return a.archivado; });
      abiertos.concat(archivados).slice(0, MAXIMO_LISTA).forEach(function (a) {
        caja.appendChild(filaDeAsunto(a, elegir));
      });
    }
    $('ea-buscar').oninput = pintarTodos;
    pintarTodos();

    await promesa;
    if (aceptar) aceptar.classList.remove('oculto');

    if (!elegido) return { accion: 'cancelar' };
    return { accion: 'elegido', asunto: elegido };
  }

  /* El cuadro de "reabrir o no" cuando lo elegido está en el ARCHIVO.
     Devuelve 'reabrir', 'sin-reabrir' o null (canceló). */
  async function preguntarSiReabrir(nombreAsunto) {
    var cuerpo = '<p><strong>' + U.escapar(nombreAsunto) + '</strong> está archivado.</p>' +
      '<div class="dup-botones">' +
        '<button type="button" id="ea-reabrir" class="boton boton-principal">Reabrir y meterlo aquí</button>' +
        '<button type="button" id="ea-sin-reabrir" class="boton">Meterlo sin reabrir</button>' +
      '</div>';
    var promesa = U.preguntar('Este asunto está archivado', cuerpo, 'Cancelar', false);
    var aceptar = $('cuadro-aceptar');
    if (aceptar) aceptar.classList.add('oculto');

    var elegido = null;
    $('ea-reabrir').onclick = function () { elegido = 'reabrir'; $('cuadro-cancelar').click(); };
    $('ea-sin-reabrir').onclick = function () { elegido = 'sin-reabrir'; $('cuadro-cancelar').click(); };

    await promesa;
    if (aceptar) aceptar.classList.remove('oculto');
    return elegido;
  }

  return {
    abrir: abrir,
    preguntarSiReabrir: preguntarSiReabrir,
    terceroDe: terceroDe,
    creadoOMovidoHaceMenosDe30Dias: creadoOMovidoHaceMenosDe30Dias,
    palabrasUtilesDe: palabrasUtilesDe
  };
})();
