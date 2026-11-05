/* ============================================================
   comunes-guardado.js — leer y guardar las dos listas comunes en
   `_GESTOR` (fila 531): `tareas-comunes.json` y `hitos-comunes.json`.

   Todo guardado va por `ColaGuardado.poner(fichero, …)` y por
   `Copias.guardar` (que deja la copia del día antes del primer guardado).
   Se relee justo antes de escribir, como todo fichero compartido.

   Además, `repartirEnGuias`: reescribe en `guias.json` el retrato de una
   tarea o de un hito común cambiado (js/comunes.js), sin llevarlo a los
   asuntos abiertos por el camino del reparto: a los otros asuntos abiertos
   se les deja como estaban con `fijarEnAbiertos`.
   ============================================================ */
var ComunesGuardado = (function () {

  var FICHEROS = { tareas: 'tareas-comunes.json', hitos: 'hitos-comunes.json' };
  var cache = { tareas: null, hitos: null };

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  async function leerLista(clave) {
    var g = gestor();
    var leido = g ? await Carpetas.leerJson(g, FICHEROS[clave]) : null;
    return Comunes.normalizarFichero(clave, leido)[clave];
  }

  /* Las dos listas, tal como están ahora en el disco. */
  async function leer() {
    var r = { tareas: await leerLista('tareas'), hitos: await leerLista('hitos') };
    cache = { tareas: r.tareas, hitos: r.hitos };
    return r;
  }
  function enMemoria() { return { tareas: cache.tareas || [], hitos: cache.hitos || [] }; }

  /* `hacer(lista)` devuelve la lista nueva (o nada si la cambia en su sitio). */
  function cambiar(clave, hacer) {
    return ColaGuardado.poner(FICHEROS[clave], async function () {
      var g = gestor();
      if (!g) throw new Error('No hay carpeta de ajustes señalada.');
      var actual = await leerLista(clave);
      var nueva = hacer(actual) || actual;
      var fichero = { version: 1 };
      fichero[clave] = nueva;
      await Copias.guardar(g, FICHEROS[clave], fichero);
      cache[clave] = nueva;
      return nueva;
    });
  }

  /* Añade una tarea o un hito nuevos a su lista; devuelve el guardado. Ya existe con ese nombre: falla (la ventana ya lo avisa antes). */
  async function anadir(clave, elemento) {
    var normal = clave === 'tareas' ? Comunes.normalizarTarea(elemento) : Comunes.normalizarHito(elemento);
    await cambiar(clave, function (lista) {
      if (Comunes.existeNombre(lista, normal.nombre)) throw new Error('Ya hay uno con el nombre «' + normal.nombre + '».');
      return lista.concat([normal]);
    });
    return normal;
  }

  /* El elemento ya existente cambiado (su id no cambia). Devuelve el guardado. */
  async function reemplazar(clave, elemento) {
    var normal = clave === 'tareas' ? Comunes.normalizarTarea(elemento) : Comunes.normalizarHito(elemento);
    await cambiar(clave, function (lista) {
      if (Comunes.existeNombre(lista, normal.nombre, normal.id)) throw new Error('Ya hay uno con el nombre «' + normal.nombre + '».');
      return lista.map(function (x) { return x.id === normal.id ? normal : x; });
    });
    return normal;
  }

  /* Los asuntos abiertos de estos tipos (menos `claveActual`) siguen como estaban: la línea vieja se les queda como tarea suya
     (js/hitos-guion-marcar.js › cambiarGuionAqui), con lo marcado. Hay que llamarlo ANTES de tocar la guía.
     `antes`: lo que devuelve Comunes.cambiarTareaEnGuias. Devuelve cuántos asuntos se han fijado. */
  async function fijarEnAbiertos(antes, claveActual) {
    var n = 0;
    var abiertos = (window.Gestor && Gestor.asuntos) ? Gestor.asuntos() : [];
    for (var i = 0; i < abiertos.length; i++) {
      var a = abiertos[i], tipo = a.nombre === claveActual ? '' : ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '');
      var viejas = antes[tipo];
      if (!viejas || (a.ficha && a.ficha.tipoUnidoDe)) continue;
      var hitos = await Hitos.hitosDe(a.nombre);
      var tocado = false;
      for (var j = 0; j < hitos.length; j++) {
        var h = hitos[j];
        if (!h.origenGuia) continue;
        var propias = Hitos.guionDe(a, h);
        for (var k = 0; k < viejas.length; k++) {
          if (viejas[k].pasoId !== h.origenGuia) continue;
          var original = propias.filter(function (g) { return g.id === viejas[k].linea.id; })[0];
          if (!original || original.enLugarDe) continue;
          await Hitos.cambiarGuionAqui(a.nombre, h.id, original, original.texto, { accion: original.accion || '', receta: original.receta || null });
          tocado = true;
        }
      }
      if (tocado) n++;
    }
    return n;
  }

  /* Guarda las guías cambiadas (solo las de los tipos tocados) sin repartir nada a los abiertos. */
  async function repartirEnGuias(guiasNuevas, tipos, claveActual) {
    for (var i = 0; i < tipos.length; i++) {
      await GuiasDelCentro.guardarPasos(tipos[i], guiasNuevas[tipos[i]], { sinLlevar: true, claveActual: claveActual });
    }
  }

  return { leer: leer, enMemoria: enMemoria, anadir: anadir, reemplazar: reemplazar, cambiar: cambiar,
           fijarEnAbiertos: fijarEnAbiertos, repartirEnGuias: repartirEnGuias, FICHEROS: FICHEROS };
})();
window.ComunesGuardado = ComunesGuardado;
