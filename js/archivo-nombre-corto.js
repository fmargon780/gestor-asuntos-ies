/* ============================================================
   archivo-nombre-corto.js — carpetas archivadas con el nombre más corto (fila 648,
   docs/648-CARPETAS-ARCHIVADAS-MAS-CORTAS.md, tema 631).

   Un asunto con número, al archivarlo, entra en la carpeta de su persona SIN el nombre de la persona:
       abierto:    261113 A26-0137 BAJA MATRICULA Cordero Navas, Lucía 1139877
       archivado:  ARCHIVO / Alumnado / Cordero Navas, Lucía 1139877 / 261113 A26-0137 BAJA MATRICULA
   Al reabrirlo recupera la persona. Los asuntos sin número no cambian nunca.

   Aquí viven: las dos funciones que dicen qué nombre toca (`paraArchivo`, `paraAbrir`), el apunte del nombre que
   tiene en el archivo un asunto recién archivado (`deArchivo`, para quien lo busca por su clave de siempre), la
   vuelta al nombre entero al reabrir (única envoltura que hace falta, apuntada en js/envolturas-esperadas.js) y
   `acortarUna`, que usa el botón de Herramientas (js/archivo-acortar.js) con las carpetas ya archivadas.

   Se carga después de js/asunto-renombrar.js y de js/archivo-indice.js.
   ============================================================ */
var ArchivoNombreCorto = (function () {

  /* El tercero (carpeta de la persona) y el de la ficha: el nombre abierto acaba con uno de los dos. */
  function paraArchivo(nombre, ficha, carpetaTercero) {
    if (!window.Nombres || !Nombres.nombreEnArchivo) return nombre;
    return Nombres.nombreEnArchivo(nombre, [carpetaTercero, ficha && ficha.tercero]);
  }

  function paraAbrir(nombre, ficha, carpetaTercero) {
    if (!window.Nombres || !Nombres.nombreAbierto) return nombre;
    return Nombres.nombreAbierto(nombre, (ficha && ficha.tercero) || carpetaTercero || '');
  }

  /* Nombre con el que quedó en el archivo el asunto que se acaba de archivar (clave = su nombre abierto). */
  function apuntar(clave, nombreEnArchivo) {
    App.E.nombreEnArchivo = App.E.nombreEnArchivo || {};
    if (nombreEnArchivo && nombreEnArchivo !== clave) App.E.nombreEnArchivo[clave] = nombreEnArchivo;
    else delete App.E.nombreEnArchivo[clave];
  }
  function deArchivo(clave) { return (App.E.nombreEnArchivo && App.E.nombreEnArchivo[clave]) || clave; }

  /* Lleva una carpeta a otro sitio con otro nombre (copia, comprueba y borra, como `Carpetas.mover`). Con el mismo
     nombre es `Carpetas.mover`, tal cual. */
  function trasladarComo(padreOrigen, nombre, padreDestino, nombreDestino) {
    if (nombre === nombreDestino) return Carpetas.mover(padreOrigen, nombre, padreDestino);
    var hacer = function () { return Carpetas.trasladar(padreOrigen, nombre, padreDestino, nombreDestino); };
    return window.ColaGuardado ? ColaGuardado.ocupado(hacer) : hacer();
  }

  /* Que lo que se guardó con el nombre de antes (encargos, actividades) siga encontrando al asunto. */
  async function moverLoDeFuera(antes, despues) {
    if (antes === despues) return;
    try { if (window.Encargos && Encargos.alMoverAsunto) await Encargos.alMoverAsunto(antes, despues); } catch (e) { /* no crítico */ }
    try { if (window.Actividades && Actividades.alMoverAsunto) await Actividades.alMoverAsunto(antes, despues); } catch (e) { /* no crítico */ }
  }

  /* ==========================================================
     REABRIR: la carpeta recupera a su persona
     ========================================================== */

  U.envolver(window.App, 'App.reabrirAsunto', 'archivo-nombre-corto.js', function (comoEra) {
    return async function (a) {
      var corto = a.nombre;
      var ficha = a.ficha || {};
      var carpetaTercero = (a.padre && a.padre.name) || '';
      await comoEra(a);
      try {
        /* La persona: de la carpeta que traía, de la tarjeta o, ya reabierto, de la ficha recuperada. */
        var recuperada = (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[corto]) || {};
        var persona = ficha.tercero || a.tercero || recuperada.tercero || carpetaTercero;
        if (!Nombres.tieneNumeroEnElNombre(corto) || !persona) return;
        if (!Nombres.esNombreCorto(corto, [carpetaTercero, ficha.tercero, a.tercero, recuperada.tercero])) return;   /* ya lleva a la persona */
        if (!(await Carpetas.existe(App.E.abiertos, corto))) return;                    /* cancelado, o no ha salido */
        var largo = Nombres.nombreAbierto(corto, persona);
        if (largo === corto) return;
        if (await Carpetas.existe(App.E.abiertos, largo)) await Carpetas.fusionarEn(App.E.abiertos, corto, App.E.abiertos, largo);
        else await Carpetas.renombrar(App.E.abiertos, corto, largo);
        /* La lápida del nombre entero (se puso al archivarlo) se quita antes de volver a darlo de alta, como hace
           ficha-archivo.js con la clave que reabre. */
        if (window.Borrados) await Borrados.revivir(App.E.gestor, 'asuntos', largo);
        await AsuntoRenombrar.mover(corto, largo, {});
        a.nombre = largo;   /* quien llamó sigue con el mismo objeto: ya sabe cómo se llama */
        try { await App.verAbiertos(); } catch (e2) { /* solo pintar */ }
      } catch (e) {
        U.accesorio('El asunto se ha reabierto, pero no he podido ponerle a su carpeta el nombre entero con la persona. ' +
          'Se queda como «' + corto + '»', e);
      }
    };
  });

  /* ==========================================================
     LAS YA ARCHIVADAS (botón de Herramientas)
     ========================================================== */

  /* Acorta la carpeta archivada `nombre`, que está dentro de `padre` (la carpeta de la persona). Devuelve
     { estado: 'acortada' | 'sinCambio' } o lanza el error (la carpeta se queda como estaba). */
  async function acortarUna(padre, categoria, nombre) {
    var handle = await padre.getDirectoryHandle(nombre);
    var ficha = (window.FichaArchivo ? await FichaArchivo.leer(handle) : null) || {};
    var corto = paraArchivo(nombre, ficha, padre.name);
    if (corto === nombre) return { estado: 'sinCambio' };

    if (await Carpetas.existe(padre, corto)) await Carpetas.fusionarEn(padre, nombre, padre, corto);
    else await Carpetas.renombrar(padre, nombre, corto);

    /* Lo de después se puede rehacer y no echa atrás la carpeta: si falla, no cuenta como error. */
    var tercero = padre.name;
    if (window.IndiceArchivo) {
      try {
        await IndiceArchivo.quitarEntrada(nombre);
        var nueva = await padre.getDirectoryHandle(corto);
        await IndiceArchivo.anadirEntrada(await IndiceArchivo.entradaDe(
          nueva, corto, categoria, tercero, categoria + ' / ' + tercero, '', App.E.tipos));
      } catch (e) { /* el índice se puede reconstruir */ }
    }
    var lista = ficha.relacionados || [];
    if (lista.length && window.Relacionados) {
      try {
        await Relacionados.crearMarcadores({ nombre: corto }, categoria, ficha.tercero || tercero, lista);
        await Relacionados.borrarMarcadores({ nombre: nombre }, lista);
      } catch (e) { /* las notas de los relacionados no son críticas */ }
    }
    await moverLoDeFuera(nombre, corto);
    /* Los archivados de antes de la fila 64 todavía pueden tener su ficha en asuntos.json. */
    try {
      if (window.AsuntoRenombrar && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[nombre]) {
        await AsuntoRenombrar.mover(nombre, corto, {});
      }
    } catch (e) { /* no crítico */ }
    return { estado: 'acortada' };
  }

  /* Recorre ARCHIVO/<categoría>/<tercero>/ y devuelve las carpetas con número que todavía llevan a la persona:
     [{ padre, categoria, tercero, nombre }]. */
  async function pendientes() {
    var salida = [];
    var categorias = await Carpetas.subcarpetas(App.E.archivo);
    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(cat.nombre)) continue;
      var terceros = await Carpetas.subcarpetas(cat.handle);
      for (var j = 0; j < terceros.length; j++) {
        var t = terceros[j];
        if (Carpetas.esCarpetaTemporalDeSincronizacion(t.nombre)) continue;
        var hijas = await Carpetas.subcarpetas(t.handle);
        for (var k = 0; k < hijas.length; k++) {
          var n = hijas[k].nombre;
          if (Carpetas.esCarpetaTemporalDeSincronizacion(n)) continue;
          if (Nombres.tieneNumeroEnElNombre(n) && Nombres.nombreEnArchivo(n, [t.nombre]) !== n) {
            salida.push({ padre: t.handle, categoria: cat.nombre, tercero: t.nombre, nombre: n });
          }
        }
      }
    }
    return salida;
  }

  return {
    paraArchivo: paraArchivo, paraAbrir: paraAbrir, apuntar: apuntar, deArchivo: deArchivo,
    trasladarComo: trasladarComo, moverLoDeFuera: moverLoDeFuera,
    acortarUna: acortarUna, pendientes: pendientes
  };
})();
window.ArchivoNombreCorto = ArchivoNombreCorto;
