/* ============================================================
   asuntos-archivar.js — llevar un asunto al ARCHIVO, o traerlo de vuelta.

   Sacado de js/documentos-sueltos.js el 17-sep-2026 (fila 32, un asunto
   real se quedó atascado): ese fichero pasaba de 400 líneas, y
   App.cerrarAsunto/App.reabrirAsunto no tienen nada que ver con los
   documentos sueltos de "Por clasificar".

   Va cargado justo después de js/documentos-sueltos.js y antes de
   js/relacionados.js y de js/hitos-archivo.js, que envuelven las dos
   funciones de aquí.

   Desde el 17-sep-2026 (fila 44, docs/BUSCADOR-ARCHIVO-INDICE.md),
   aquí mismo se da de alta o de baja el asunto en el índice guardado
   del ARCHIVO (`_GESTOR/indice-archivo.json`, `js/archivo-indice.js`),
   sin reconstruirlo entero: al archivar se añade su entrada, al
   reabrir se quita. Siempre DESPUÉS de que el traslado de la carpeta
   haya salido bien, y en un `try/catch` aparte: el índice se puede
   rehacer entero en cualquier momento con "Reconstruir el índice", así
   que un fallo aquí no debe impedir que el archivado o la reapertura,
   que sí han salido bien, se den por buenos. */

/* Construye la entrada de una sola carpeta de asunto ya archivada y la
   añade al índice. Silencioso a propósito: sin índice todavía, o si
   algo falla al leer la carpeta, no pasa nada (queda para la próxima
   reconstrucción). */
async function actualizarIndiceAlArchivar(nombre, categoria, tercero, handle) {
  if (!window.IndiceArchivo) return;
  try {
    /* La ficha todavía está en App.E.registro.asuntos en este punto:
       js/ficha-archivo.js (fila 64) no la baja a su carpeta hasta
       después, envolviendo App.cerrarAsunto por fuera de esto. Se
       pasa aquí para que el índice guarde ya los pocos campos que
       hacen falta para pintar la tarjeta y para buscar. */
    var ficha = (App.E.registro.asuntos && App.E.registro.asuntos[nombre]) || {};
    var entrada = await IndiceArchivo.entradaDe(
      handle, nombre, categoria, tercero, categoria + ' / ' + tercero, '', App.E.tipos, ficha);
    await IndiceArchivo.anadirEntrada(entrada);
  } catch (e) { /* el índice es prescindible: se puede reconstruir entero */ }
}

/* Quita del índice el asunto que se acaba de reabrir, y repinta la
   pantalla ARCHIVO si estaba cargada en memoria (sin releer nada del
   disco: "basta repintar", punto 6.3 del encargo). Si la pantalla
   ARCHIVO no se había visitado todavía en esta sesión, `App.E.listaArchivo`
   ni existe, y no hay nada que repintar. */
async function actualizarIndiceAlReabrir(nombre) {
  if (window.IndiceArchivo) {
    try { await IndiceArchivo.quitarEntrada(nombre); } catch (e) { /* ver arriba */ }
  }
  if (Array.isArray(App.E.listaArchivo)) {
    App.E.listaArchivo = App.E.listaArchivo.filter(function (a) { return a.nombre !== nombre; });
    if (typeof App.pintarArchivo === 'function') App.pintarArchivo();
  }
}

/* ---------- archivar un asunto ----------

   El navegador no sabe mover carpetas de un lado a otro: se copia todo
   y solo si llega completo se borra el original (Carpetas.trasladar).
   Si una copia falla a mitad camino (Dropbox sincronizando, un fichero
   bloqueado), antes se quedaba una carpeta a medias en el destino, y a
   partir de ahí ningún intento siguiente podía archivar: siempre
   encontraba "ya hay una carpeta con ese nombre" y se paraba ahí. Ahora
   `Carpetas.trasladar` limpia lo que haya llegado a copiar si algo
   falla, y si de un intento de antes de este arreglo ya quedó una
   carpeta a medias, aquí se detecta y se completa con
   `Carpetas.fusionarEn` en vez de fallar otra vez. */

App.cerrarAsunto = async function (a) {
  var categoria = a.ficha.categoria || a.leido.categoria || '';
  var tercero = a.ficha.tercero || '';

  if (!categoria || !tercero) {
    var opciones = Nombres.CATEGORIAS.map(function (c) {
      return '<option value="' + c + '"' + (c === categoria ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    var ok = await U.preguntar('¿Dónde va esta carpeta?',
      '<p class="explica">Este asunto no lo creó la aplicación, así que hace falta saber ' +
      'en qué parte del archivo va.</p>' +
      '<label class="etiqueta">Categoría</label>' +
      '<select id="cierre-categoria" class="campo">' + opciones + '</select>' +
      '<label class="etiqueta">Carpeta del tercero</label>' +
      '<input id="cierre-tercero" class="campo" value="' + U.escapar(Nombres.terceroDeResto(a.leido.resto)) + '">' +
      '<p class="nota">Se creará dentro de la categoría si todavía no existe.</p>',
      'Continuar');
    if (!ok) return;
    categoria = $('cierre-categoria').value;
    tercero = U.limpiarNombre($('cierre-tercero').value);
    if (!tercero) { U.aviso('Hace falta el nombre de la carpeta del tercero.', 'malo'); return; }
  }

  var yaExiste = false;
  try {
    var carpetaDelTercero = await Carpetas.bajar(App.E.archivo, [categoria, tercero], false);
    yaExiste = await Carpetas.existe(carpetaDelTercero, a.nombre);
  } catch (e) { yaExiste = false; }

  var avisoFusion = yaExiste
    ? '<p class="aviso aviso-ambar">En el archivo ya hay una carpeta con este mismo nombre, ' +
      'seguramente de un intento anterior que se quedó a medias. Se juntarán las dos: no se ' +
      'pierde ningún documento, y si algún papel coincide en nombre pero no en contenido, se ' +
      'guarda al lado con un (2) detrás.</p>'
    : '';

  /* Fila 141: al repartir un PDF entre terceros se archivan muchos de
     golpe, ya confirmados en su propio resumen (js/repartir-crear.js). */
  var confirmar = App.E.archivarSinPreguntar ? true : await U.preguntar('Archivar el asunto',
    '<p>Se llevará la carpeta a:</p>' +
    '<div class="vista-previa"><div class="vista-nombre">' +
      U.escapar(App.E.archivo.name + ' / ' + categoria + ' / ' + tercero) +
    '</div></div>' +
    avisoFusion +
    '<p class="nota">Se copia primero y se comprueba que ha llegado todo. ' +
    'Si algo falla, la carpeta se queda donde está.</p>', 'Archivar el asunto');
  if (!confirmar) return;

  try {
    /* La tarjeta de la lista puede llevar un rato pintada: si un
       intento anterior llegó a completarse (o el otro ordenador la
       movió), la carpeta ya no está en Asuntos abiertos y
       `Carpetas.mover` revienta con un NotFoundError del navegador, en
       inglés (17-sep-2026, fila 45). Se mira primero. */
    if (!(await Carpetas.existe(App.E.abiertos, a.nombre))) {
      var carpetaTerceroYa = null, yaArchivada = false;
      try {
        carpetaTerceroYa = await Carpetas.bajar(App.E.archivo, [categoria, tercero], false);
        yaArchivada = await Carpetas.existe(carpetaTerceroYa, a.nombre);
      } catch (e) { yaArchivada = false; }

      if (yaArchivada) {
        var handleYaArchivada = await carpetaTerceroYa.getDirectoryHandle(a.nombre);
        var totalFicherosYa = await Carpetas.contarFicheros(handleYaArchivada);
        await App.anotar(a.nombre, {
          estado: 'cerrado', categoria: categoria, tercero: tercero,
          cerradoEl: a.ficha.cerradoEl || U.ahora(), ficheros: totalFicherosYa
        });
        await actualizarIndiceAlArchivar(a.nombre, categoria, tercero, handleYaArchivada);
        App.E.recienArchivados[a.nombre] = true;
        U.aviso('Este asunto ya estaba archivado. He puesto la lista al día.', 'bueno');
      } else {
        U.aviso('No encuentro la carpeta de este asunto ni en Asuntos abiertos ni en el archivo. ' +
          'Puede que la haya movido o renombrado el otro ordenador. Pulsa Recargar y míralo.', 'ambar');
      }
      await App.verAbiertos();
      return;
    }

    var destino = await Carpetas.bajar(App.E.archivo, [categoria, tercero], true);
    /* Antes de mover la carpeta, no después (fila 99): una mirada a la
       carpeta a mitad del traslado ya sabe que esto no es "otro
       ordenador". */
    App.E.recienArchivados[a.nombre] = true;
    var haciendoFusion = await Carpetas.existe(destino, a.nombre);
    var resultado = haciendoFusion
      ? await Carpetas.fusionarEn(App.E.abiertos, a.nombre, destino, a.nombre)
      : { conSufijo: [] };
    if (!haciendoFusion) await Carpetas.mover(App.E.abiertos, a.nombre, destino);
  } catch (e) {
    if (App.E.recienArchivados) delete App.E.recienArchivados[a.nombre];
    U.fallo('No se ha podido archivar', e);
    return;
  }

  /* Lo principal (la carpeta, en el archivo) ya está hecho. De aquí
     para abajo, si algo falla, el aviso es ámbar y dice qué (fila 100,
     docs/AVISOS-QUE-DICEN-LA-VERDAD.md): antes salía rojo «No se ha
     podido archivar» y al repetir, «ya hay una carpeta…». */
  try {
    var handleArchivado = await destino.getDirectoryHandle(a.nombre);
    var totalFicheros = await Carpetas.contarFicheros(handleArchivado);
    await App.anotar(a.nombre, {
      estado: 'cerrado', categoria: categoria, tercero: tercero,
      cerradoEl: U.ahora(), cerradoPor: App.E.usuario, ficheros: totalFicheros
    });
  } catch (e) {
    U.accesorio('La carpeta ya está en el archivo, pero no he podido apuntar el cierre en su ficha. ' +
      'Pulsa Recargar', e);
    try { await App.verAbiertos(); } catch (e2) { /* solo pintar */ }
    return;
  }
  /* Fila 137: el índice del expediente, ya en la carpeta archivada. Si
     falla, ámbar: el asunto queda archivado igual. */
  if (window.IndiceExpediente) {
    try {
      await IndiceExpediente.crear({ nombre: a.nombre, handle: handleArchivado, leido: a.leido,
        ficha: Object.assign({}, a.ficha, { tercero: tercero, categoria: categoria }) }, { archivadoEl: U.hoyIso() });
    } catch (e) {
      U.accesorio('Asunto archivado, pero no he podido hacer su índice del expediente', e);
    }
  }
  try {
    await actualizarIndiceAlArchivar(a.nombre, categoria, tercero, handleArchivado);
    /* Para que App.reengancharFicha (js/ficha-asunto.js), llamado dentro
       de App.verAbiertos() justo abajo, sepa que este ordenador acaba de
       archivarlo y no dé el aviso de "otro ordenador" (fila 90). */
    App.E.recienArchivados[a.nombre] = true;
    var mensaje = 'Asunto archivado.';
    if (haciendoFusion) {
      mensaje = 'Asunto archivado. Se ha completado un archivado anterior que se había quedado a medias.';
      if (resultado.conSufijo.length) {
        mensaje += ' Hay ' + resultado.conSufijo.length + ' documento(s) guardados con un (2) ' +
          'detrás porque había otro con el mismo nombre y distinto contenido.';
      }
    }
    U.aviso(mensaje, 'bueno');
    await App.verAbiertos();
  } catch (e) {
    U.accesorio('Asunto archivado, pero no he podido poner la lista al día. Pulsa Recargar', e);
  }
};

/* ---------- reabrir ----------

   El mismo atasco, al revés: si Asuntos abiertos ya tiene una carpeta
   con ese nombre (de una reapertura anterior que se quedó a medias),
   se fusiona en vez de fallar. */

App.reabrirAsunto = async function (a) {
  var yaExiste = await Carpetas.existe(App.E.abiertos, a.nombre);
  var avisoFusion = yaExiste
    ? '<p class="aviso aviso-ambar">En Asuntos abiertos ya hay una carpeta con este mismo ' +
      'nombre, seguramente de un intento anterior que se quedó a medias. Se juntarán las dos: ' +
      'no se pierde ningún documento, y si algún papel coincide en nombre pero no en contenido, ' +
      'se guarda al lado con un (2) detrás.</p>'
    : '';

  var confirmar = await U.preguntar('Reabrir el asunto',
    '<p>La carpeta volverá a <strong>' + U.escapar(App.E.abiertos.name) + '</strong>.</p>' + avisoFusion,
    'Reabrir');
  if (!confirmar) return;
  try {
    /* `a.padre` es un manejador guardado de cuando se pintó la
       pantalla ARCHIVO (o el correo, o Por clasificar), y puede estar
       viejo: si el asunto se movió por el camino, `Carpetas.mover`
       revienta con un NotFoundError del navegador, en inglés
       (17-sep-2026, fila 45). Se comprueba y, si no sirve, se
       recalcula con los datos de la ficha antes de tocar nada. */
    var ficha = a.ficha || {};
    var padreUsar = a.padre;
    if (!padreUsar || !(await Carpetas.existe(padreUsar, a.nombre))) {
      var recalculado = null;
      if (ficha.categoria && ficha.tercero) {
        try { recalculado = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false); }
        catch (e) { recalculado = null; }
      }
      if (recalculado && (await Carpetas.existe(recalculado, a.nombre))) {
        padreUsar = recalculado;
      } else if (await Carpetas.existe(App.E.abiertos, a.nombre)) {
        /* Ya estaba reabierto: una reapertura anterior llegó a
           completarse y la tarjeta se había quedado con datos viejos. */
        await App.anotar(a.nombre, {
          estado: 'abierto', reabiertoEl: ficha.reabiertoEl || U.ahora(),
          reabiertoPor: ficha.reabiertoPor || App.E.usuario
        });
        U.aviso('Este asunto ya estaba reabierto. He puesto la lista al día.', 'bueno');
        await App.verAbiertos();
        await actualizarIndiceAlReabrir(a.nombre);
        return;
      } else {
        U.aviso('No encuentro la carpeta de este asunto ni en Asuntos abiertos ni en el archivo. ' +
          'Puede que la haya movido o renombrado el otro ordenador. Pulsa Recargar y míralo.', 'ambar');
        await App.verAbiertos();
        return;
      }
    }

    var haciendoFusion = await Carpetas.existe(App.E.abiertos, a.nombre);
    var resultado = haciendoFusion
      ? await Carpetas.fusionarEn(padreUsar, a.nombre, App.E.abiertos, a.nombre)
      : { conSufijo: [] };
    if (!haciendoFusion) await Carpetas.mover(padreUsar, a.nombre, App.E.abiertos);
    await App.anotar(a.nombre, { estado: 'abierto', reabiertoEl: U.ahora(), reabiertoPor: App.E.usuario });
    var mensaje = 'Asunto reabierto.';
    if (haciendoFusion) {
      mensaje = 'Asunto reabierto. Se ha completado una reapertura anterior que se había quedado a medias.';
      if (resultado.conSufijo.length) {
        mensaje += ' Hay ' + resultado.conSufijo.length + ' documento(s) guardados con un (2) ' +
          'detrás porque había otro con el mismo nombre y distinto contenido.';
      }
    }
    U.aviso(mensaje, 'bueno');
    await App.verAbiertos();
    await actualizarIndiceAlReabrir(a.nombre);
  } catch (e) {
    U.aviso('No se ha podido reabrir: ' + U.mensajeDeError(e), 'malo');
  }
};
