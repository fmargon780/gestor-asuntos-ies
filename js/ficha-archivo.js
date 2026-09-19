/* ============================================================
   ficha-archivo.js — la ficha de un asunto archivado, en su propia
   carpeta (fila 64, docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md).

   `_GESTOR/asuntos.json` llevaba dentro la ficha de TODOS los asuntos
   de la vida del centro, abiertos y archivados, y se reescribía
   entero entre 50 y 150 veces al día. Con los años, ese fichero solo
   podía crecer: a los cinco cursos, más de 17 MB.

   Se copia el patrón que ya usa js/hitos-archivo.js con el historial
   de hitos: al archivar, la ficha entera baja a un fichero dentro de
   la propia carpeta del asunto (`_ficha.json`, el guion bajo para que
   la lista de abiertos y el índice del ARCHIVO no lo cuenten como
   documento) y se borra su clave de asuntos.json; al reabrir, se lee
   de vuelta y el fichero desaparece. Así asuntos.json se queda solo
   con los asuntos abiertos, y no tiene techo.

   Un asunto archivado ANTES de esta fila no tiene `_ficha.json`: se
   trata como si tuviera una ficha vacía, igual que hoy con cualquier
   carpeta que nunca pasó por la aplicación. El botón de Ajustes →
   Mantenimiento "Poner en orden las fichas del ARCHIVO" los pasa a
   todos, cuando Francisco quiera pulsarlo.

   Se carga después de js/hitos-archivo.js (envuelve las mismas
   App.cerrarAsunto/App.reabrirAsunto, así que tiene que quedar por
   fuera: entra en juego después de que los hitos ya se hayan movido) y
   después de js/archivo-indice.js (usa IndiceArchivo.resolverHandle
   para completar la ficha de una tarjeta del ARCHIVO que no trae
   manejador de carpeta).
   ============================================================ */
var FichaArchivo = (function () {

  var NOMBRE = '_ficha.json';

  /* ==========================================================
     LEER, ESCRIBIR Y BORRAR EL FICHERO DE LA CARPETA
     ========================================================== */

  /* null si no existe (asunto archivado antes de esta fila, o
     borrado a mano) o si el fichero no se puede interpretar: en
     los dos casos se trata como "ficha vacía", nunca como un error
     que frene nada. */
  async function leer(handle) {
    if (!handle) return null;
    try {
      var texto = await Carpetas.leerTexto(handle, NOMBRE);
      if (texto === null) return null;
      var datos = JSON.parse(texto);
      return (datos && typeof datos === 'object') ? datos : null;
    } catch (e) { return null; }
  }

  async function escribir(handle, ficha) {
    await Carpetas.escribirTexto(handle, NOMBRE, JSON.stringify(ficha || {}));
  }

  async function borrar(handle) {
    try { await handle.removeEntry(NOMBRE); } catch (e) { /* ya no estaba: no pasa nada */ }
  }

  /* Completa 'a.ficha' (y, si hacía falta, 'a.handle'/'a.padre') con
     lo que haya de verdad en _ficha.json, para una tarjeta del
     ARCHIVO que solo trae los pocos campos que guarda el índice
     (situacion, via, viaDato, categoria, tercero). Nunca lanza: si
     algo falla, 'a' se queda como estaba, con lo poco que ya tuviera.
     Devuelve true si ha encontrado y aplicado una ficha de verdad. */
  async function completar(a) {
    if (!a) return false;
    try {
      var handle = a.handle;
      if (!handle && window.IndiceArchivo && typeof IndiceArchivo.resolverHandle === 'function') {
        var resuelto = await IndiceArchivo.resolverHandle(a);
        if (resuelto) {
          handle = resuelto.handle;
          a.handle = resuelto.handle;
          a.padre = resuelto.padre;
        }
      }
      if (!handle) return false;
      var ficha = await leer(handle);
      if (!ficha) return false;
      a.ficha = ficha;
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ==========================================================
     AL ARCHIVAR Y AL REABRIR

     Mismo patrón que js/hitos-archivo.js: se envuelve lo que ya hace
     App.cerrarAsunto/App.reabrirAsunto (js/asuntos-archivar.js,
     envuelto ya por js/relacionados.js y js/hitos-archivo.js), sin
     tocar ninguna de esas dos funciones.
     ========================================================== */

  U.envolver(window.App, 'App.cerrarAsunto', 'ficha-archivo.js', function (comoEra) {
    return async function (a) {
      var clave = a.nombre;
      await comoEra(a);
      var ficha = App.E.registro.asuntos[clave];
      if (!ficha || ficha.estado !== 'cerrado') return;   /* canceló, o algo ha fallado */
      try {
        var carpetaTercero = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], true);
        var handle = await carpetaTercero.getDirectoryHandle(clave);
        await escribir(handle, ficha);
        await App.guardarRegistroFresco(function (registro) {
          delete registro.asuntos[clave];
        });
      } catch (e) {
        U.aviso('El asunto se ha archivado, pero no he podido guardar su ficha en la carpeta: ' +
          e.message, 'malo');
      }
    };
  });

  U.envolver(window.App, 'App.reabrirAsunto', 'ficha-archivo.js', function (comoEra) {
    return async function (a) {
      /* Se lee (o se completa, si a.handle no venía puesto) ANTES de
         llamar a lo de siempre: en cuanto la carpeta se mueva, el
         manejador viejo de 'a.handle' deja de servir. */
      var encontrada = await completar(a);
      var clave = a.nombre;
      var fichaGuardada = encontrada ? a.ficha : null;

      await comoEra(a);

      var actual = App.E.registro.asuntos[clave];
      if (!actual || actual.estado !== 'abierto' || !fichaGuardada) return;
      try {
        await App.guardarRegistroFresco(function (registro) {
          registro.asuntos[clave] = Object.assign({}, fichaGuardada, registro.asuntos[clave]);
        });
        var carpetaAbierta = await App.E.abiertos.getDirectoryHandle(clave);
        await borrar(carpetaAbierta);
      } catch (e) {
        U.aviso('La ficha se ha recuperado, pero no he podido borrar el fichero viejo de la ' +
          'carpeta: ' + e.message, 'malo');
      }
    };
  });

  /* ==========================================================
     LA CONVERSIÓN DE LO QUE YA HAY (sección 3.4 del encargo)

     Botón de Ajustes → Mantenimiento: baja a su carpeta la ficha de
     cada asunto que ya esté archivado (estado 'cerrado' en
     asuntos.json) y no tenga todavía _ficha.json. No se hace sola al
     arrancar: hay que pulsarla.
     ========================================================== */

  /* Cuántos asuntos archivados siguen en asuntos.json. Sin ningún
     acceso a disco: solo mirar el registro que ya está en memoria,
     para poder enseñar el número sin coste cada vez que se pinta
     Ajustes → Mantenimiento. */
  function clavesCerradas() {
    return Object.keys(App.E.registro.asuntos || {}).filter(function (k) {
      return App.E.registro.asuntos[k].estado === 'cerrado';
    });
  }

  /* Los asuntos archivados que todavía están en asuntos.json, con la
     carpeta ya localizada (o null si no se encuentra). Esto sí lee
     disco (una carpeta por asunto): solo se llama al desplegar el
     bloque o al pulsar el botón, nunca solo al pintar la pestaña. */
  async function pendientesDeConvertir() {
    var claves = clavesCerradas();
    var salida = [];
    for (var i = 0; i < claves.length; i++) {
      var clave = claves[i];
      var ficha = App.E.registro.asuntos[clave];
      var handle = null;
      try {
        var carpetaTercero = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
        handle = await carpetaTercero.getDirectoryHandle(clave);
      } catch (e) { handle = null; }
      salida.push({ clave: clave, ficha: ficha, handle: handle });
    }
    return salida;
  }

  /* Convierte uno: escribe _ficha.json y borra la clave de
     asuntos.json. Se relee justo antes de borrar (App.guardarRegistroFresco),
     así que aunque se conviertan muchos uno detrás de otro no se pisa
     nada que el compañero guarde mientras tanto. */
  async function convertirUno(pendiente) {
    await escribir(pendiente.handle, pendiente.ficha);
    await App.guardarRegistroFresco(function (registro) {
      delete registro.asuntos[pendiente.clave];
    });
  }

  /* onProgreso(hechos, total) se llama después de cada uno. Devuelve
     { movidos, sinCarpeta } (los de 'sinCarpeta' se quedan tal cual,
     no se tocan). */
  async function convertirTodo(onProgreso) {
    var pendientes = await pendientesDeConvertir();
    var movidos = 0, sinCarpeta = [];
    for (var i = 0; i < pendientes.length; i++) {
      var p = pendientes[i];
      if (!p.handle) { sinCarpeta.push(p.clave); continue; }
      try {
        await convertirUno(p);
        movidos++;
      } catch (e) { sinCarpeta.push(p.clave); }
      if (onProgreso) onProgreso(i + 1, pendientes.length);
    }
    return { movidos: movidos, sinCarpeta: sinCarpeta };
  }

  /* ---------- el bloque de Ajustes → Mantenimiento ---------- */

  function $(id) { return document.getElementById(id); }

  function bloqueDeAjustes() {
    var ya = $('bloque-fichas-archivo');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-fichas-archivo';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Poner en orden las fichas del ARCHIVO</span>' +
        '<span class="bloque-pie" id="fichas-archivo-pie"></span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Antes de esta fila, la ficha de un asunto archivado se quedaba en ' +
        '<code>asuntos.json</code> para siempre, y ese fichero solo podía crecer. Este botón baja ' +
        'a su propia carpeta la ficha de cada asunto ya archivado que todavía la tenga ahí. No se ' +
        'pierde ningún dato: se copia tal cual, dentro de <code>_ficha.json</code>.</p>' +
        '<div id="fichas-archivo-cuerpo" class="explica">Comprobando…</div>' +
      '</div>';
    pantalla.appendChild(d);
    /* Localizar la carpeta de cada uno es un acceso a disco por
       asunto: se deja para cuando de verdad se despliega el bloque,
       no para cada vez que se pinta la pestaña de Mantenimiento. */
    d.addEventListener('toggle', function () {
      if (d.open) pintarCuerpo();
    });
    return d;
  }

  async function pintarCuerpo() {
    var cuerpo = $('fichas-archivo-cuerpo');
    if (!cuerpo) return;
    cuerpo.className = 'explica';
    cuerpo.textContent = 'Comprobando…';
    var pendientes = await pendientesDeConvertir();
    cuerpo.className = '';
    cuerpo.innerHTML = '';
    if (!pendientes.length) {
      cuerpo.innerHTML = '<div class="vacio">Todas las fichas de asuntos archivados están ya en su carpeta.</div>';
      return;
    }
    var sinCarpeta = pendientes.filter(function (p) { return !p.handle; }).length;

    var boton = document.createElement('button');
    boton.className = 'boton';
    boton.textContent = 'Mover ' + pendientes.length + (pendientes.length === 1 ? ' ficha' : ' fichas');
    var progreso = document.createElement('div');
    progreso.className = 'explica oculto';

    boton.onclick = async function () {
      var detalle = sinCarpeta
        ? '<p class="aviso aviso-ambar">' + sinCarpeta + ' no tienen carpeta localizable: se ' +
          'quedan como están, no se cuentan como error.</p>'
        : '';
      var ok = await U.preguntar('Poner en orden las fichas del ARCHIVO',
        '<p>Se van a mover ' + pendientes.length + ' ficha' + (pendientes.length === 1 ? '' : 's') +
        ' a su propia carpeta, dentro de <code>_ficha.json</code>.</p>' + detalle,
        'Adelante');
      if (!ok) return;
      await U.mientrasGuarda(boton, async function () {
        progreso.classList.remove('oculto');
        var resultado = await convertirTodo(function (hechos, total) {
          progreso.textContent = 'Moviendo… ' + hechos + ' de ' + total;
        });
        var mensaje = resultado.movidos + (resultado.movidos === 1 ? ' ficha movida.' : ' fichas movidas.');
        if (resultado.sinCarpeta.length) {
          mensaje += ' ' + resultado.sinCarpeta.length + ' sin carpeta localizable, sin tocar.';
        }
        U.aviso(mensaje, 'bueno');
        App.pintarFichasDelArchivo();
      });
    };

    cuerpo.appendChild(boton);
    cuerpo.appendChild(progreso);
  }

  /* Se llama al pintar Ajustes → Mantenimiento: solo pone el número
     barato en el resumen (sin tocar disco) y, si el bloque ya estaba
     desplegado (por ejemplo, justo después de pulsar "Mover"), vuelve
     a comprobar de verdad. */
  App.pintarFichasDelArchivo = async function () {
    var bloque = bloqueDeAjustes();
    var n = clavesCerradas().length;
    var pie = $('fichas-archivo-pie');
    if (pie) pie.textContent = n
      ? n + (n === 1 ? ' ficha por poner en orden' : ' fichas por poner en orden')
      : 'Ya está todo en orden';
    if (bloque && bloque.open) await pintarCuerpo();
  };

  return {
    NOMBRE: NOMBRE, leer: leer, escribir: escribir, borrar: borrar, completar: completar,
    /* para las pruebas */
    _pendientesDeConvertir: pendientesDeConvertir, _convertirTodo: convertirTodo
  };
})();
window.FichaArchivo = FichaArchivo;
