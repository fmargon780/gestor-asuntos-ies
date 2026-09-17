/* ============================================================
   asuntos-archivar.js — llevar un asunto al ARCHIVO, o traerlo de vuelta.

   Sacado de js/documentos-sueltos.js el 17-sep-2026 (fila 32, un asunto
   real se quedó atascado): ese fichero pasaba de 400 líneas, y
   App.cerrarAsunto/App.reabrirAsunto no tienen nada que ver con los
   documentos sueltos de "Por clasificar".

   Va cargado justo después de js/documentos-sueltos.js y antes de
   js/relacionados.js y de js/hitos-archivo.js, que envuelven las dos
   funciones de aquí.
   ============================================================ */

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

  var confirmar = await U.preguntar('Archivar el asunto',
    '<p>Se llevará la carpeta a:</p>' +
    '<div class="vista-previa"><div class="vista-nombre">' +
      U.escapar(App.E.archivo.name + ' / ' + categoria + ' / ' + tercero) +
    '</div></div>' +
    avisoFusion +
    '<p class="nota">Se copia primero y se comprueba que ha llegado todo. ' +
    'Si algo falla, la carpeta se queda donde está.</p>', 'Archivar el asunto');
  if (!confirmar) return;

  try {
    var destino = await Carpetas.bajar(App.E.archivo, [categoria, tercero], true);
    var haciendoFusion = await Carpetas.existe(destino, a.nombre);
    var resultado = haciendoFusion
      ? await Carpetas.fusionarEn(App.E.abiertos, a.nombre, destino, a.nombre)
      : { conSufijo: [] };
    if (!haciendoFusion) await Carpetas.mover(App.E.abiertos, a.nombre, destino);
    var totalFicheros = await Carpetas.contarFicheros(await destino.getDirectoryHandle(a.nombre));
    await App.anotar(a.nombre, {
      estado: 'cerrado', categoria: categoria, tercero: tercero,
      cerradoEl: U.ahora(), cerradoPor: App.E.usuario, ficheros: totalFicheros
    });
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
    U.aviso('No se ha podido archivar: ' + e.message, 'malo');
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
    var haciendoFusion = await Carpetas.existe(App.E.abiertos, a.nombre);
    var resultado = haciendoFusion
      ? await Carpetas.fusionarEn(a.padre, a.nombre, App.E.abiertos, a.nombre)
      : { conSufijo: [] };
    if (!haciendoFusion) await Carpetas.mover(a.padre, a.nombre, App.E.abiertos);
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
    await App.verArchivo();
  } catch (e) {
    U.aviso('No se ha podido reabrir: ' + e.message, 'malo');
  }
};
