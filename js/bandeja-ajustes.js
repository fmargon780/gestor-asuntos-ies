/* ============================================================
   bandeja-ajustes.js — el bloque «Bandeja de correos» de Ajustes, el último correo recogido y la limpieza de los encargos viejos.

   Sacado tal cual de js/bandeja-correos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la bandeja (la carpeta, los correos, el pendiente) y lo
   de los demás ficheros de la bandeja se piden a `window.BandejaNucleo`
   (N). Se carga justo detrás de js/bandeja-correos.js.
   ============================================================ */
(function () {
  var N = window.BandejaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     EL BLOQUE DE AJUSTES
     ========================================================== */

  function bloqueDeAjustes() {
    var ya = $('bloque-bandeja');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-bandeja';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Bandeja de correos</span>' +
        '<span class="bloque-pie">La carpeta de Drive donde caen los correos etiquetados en Gmail</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">En Gmail le pones a un correo la etiqueta <code>GESTOR</code>. ' +
        'Un script lo recoge y deja su ficha en la carpeta <code>GESTOR-BANDEJA</code> de tu Drive. ' +
        'Señálala aquí una vez y los correos saldrán arriba, en la pantalla de asuntos abiertos, ' +
        'con el asunto ya propuesto.</p>' +
        '<div id="estado-bandeja" class="lista"></div>' +
        '<div class="alta-tipo" id="botones-bandeja"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function pintarBloqueAjustes() {
    if (!bloqueDeAjustes()) return;
    var estado = $('estado-bandeja');
    var botones = $('botones-bandeja');
    if (!estado || !botones) return;

    estado.innerHTML = '<div class="fila-tipo"><span class="nombre-tipo">' +
      (N.carpeta() ? U.escapar(N.carpeta().name) : 'Sin señalar') + '</span>' +
      '<span class="suave">' +
      (N.carpeta() ? 'Los correos aparecen en la pantalla de asuntos abiertos.'
               : 'Mientras no la señales, esto no hace nada.') +
      '</span></div>' +
      (N.carpeta() ? '<div class="fila-tipo" id="fila-ultimo-correo"><span class="suave">Mirando…</span></div>' : '');
    if (N.carpeta()) pintarUltimoCorreoRecogido();

    botones.innerHTML = '';
    var elegir = document.createElement('button');
    elegir.className = 'boton' + (N.carpeta() ? '' : ' boton-principal');
    elegir.textContent = N.carpeta() ? 'Cambiar la carpeta' : 'Señalar la carpeta de correos';
    elegir.onclick = N.elegirCarpeta;
    botones.appendChild(elegir);

    if (N.carpeta()) {
      var quitar = document.createElement('button');
      quitar.className = 'boton';
      quitar.textContent = 'Dejar de usarla';
      quitar.onclick = N.olvidarCarpeta;
      botones.appendChild(quitar);
    }
  }

  /* ---------- "último correo recogido" (fila 18, punto 4) ----------

     El 17-sep-2026, montando la fila 18, se descubrió que el
     recolector llevaba seis días dejando los correos en una carpeta
     GESTOR-BANDEJA distinta de la que leía la aplicación (alguien
     había movido la de verdad dentro de otra, y el script, que solo
     busca en la raíz del Drive, se creó una nueva sin decir nada). En
     pantalla no se veía ningún error: la bandeja estaba siempre vacía.

     Se mira la fecha del propio fichero más nuevo de la carpeta (da
     igual si es un .json, un PDF o un adjunto): si el recolector deja
     de escribir aquí, esta fecha deja de moverse, aunque el .json de
     cada correo se lea bien. Más de tres días, aviso. */
  var DIAS_DE_AVISO_BANDEJA = 3;

  async function ultimoFicheroRecogido() {
    if (!N.carpeta()) return null;
    var lista;
    try { lista = await Carpetas.ficheros(N.carpeta()); } catch (e) { return null; }
    var masNuevo = 0;
    for (var i = 0; i < lista.length; i++) {
      try {
        var f = await lista[i].handle.getFile();
        if (f.lastModified > masNuevo) masNuevo = f.lastModified;
      } catch (e) { /* un fichero raro no debe tumbar esto */ }
    }
    return masNuevo || null;
  }

  async function pintarUltimoCorreoRecogido() {
    var t = await ultimoFicheroRecogido();
    var fila = $('fila-ultimo-correo');
    if (!fila) return;   /* se ha repintado el bloque, o se ha cerrado Ajustes, mientras tanto */

    if (!t) {
      fila.innerHTML = '<span class="suave">Todavía no ha llegado ningún correo a esta carpeta.</span>';
      return;
    }
    var dias = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
    if (dias > DIAS_DE_AVISO_BANDEJA) {
      fila.innerHTML = '<span class="aviso-en-linea">Último correo recogido: hace ' + dias + ' días. ' +
        'Si esperabas correos, comprueba que el recolector está dejándolos en esta carpeta y no en ' +
        'otra con el mismo nombre.</span>';
    } else {
      fila.innerHTML = '<span class="suave">Último correo recogido: ' +
        U.escapar(N.fechaHoraLegible(new Date(t).toISOString())) + '</span>';
    }
  }

  /* ==========================================================
     LIMPIAR LOS RESTOS DEL VIEJO "BORRADOR EN CAMINO"
     (16-sep-2026 → 24-sep-2026, fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md)

     Hasta esta fila, `_GESTOR/envios.json` guardaba los encargos vivos
     de "mandar documentos por correo" (un borrador que montaba Apps
     Script), y la carpeta de la bandeja tenía sus copias de documentos
     y sus `<id>.envio.json`/`.listo.json`/`.error.json`. Ese mecanismo
     ha desaparecido: ahora el correo sale en el momento
     (js/correo-cuadro.js + js/correo-enviar.js). Esta limpieza se
     ejecuta una sola vez por arranque, y no hace nada si no queda
     ningún encargo viejo: no vigila nada, no repinta ninguna tarjeta. */

  async function limpiarEnviosViejos() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    try {
      var g = window.Gestor.carpetaGestor();
      var lista = await Carpetas.leerJson(g, 'envios.json');
      if (!Array.isArray(lista) || !lista.length) return;

      if (N.carpeta() && (await N.tienePermiso(false))) {
        for (var i = 0; i < lista.length; i++) {
          var id = lista[i] && lista[i].id;
          if (!id) continue;
          var restos = [id + '.envio.json', id + '.listo.json', id + '.error.json'];
          for (var j = 0; j < restos.length; j++) {
            try { await N.carpeta().removeEntry(restos[j]); } catch (e) { /* ya no estaba */ }
          }
        }
        try {
          var ficherosBandeja = await Carpetas.ficheros(N.carpeta());
          for (var k = 0; k < ficherosBandeja.length; k++) {
            var nombreFichero = ficherosBandeja[k].nombre;
            var esCopiaDeUnEncargo = lista.some(function (item) {
              return item && item.id && nombreFichero.indexOf(item.id + ' - ') === 0;
            });
            if (esCopiaDeUnEncargo) { try { await N.carpeta().removeEntry(nombreFichero); } catch (e) {} }
          }
        } catch (e) { /* si no se puede listar, se deja como esté: no es crítico */ }
      }

      await Copias.guardar(g, 'envios.json', []);
    } catch (e) { /* limpieza accesoria de un mecanismo que ya no existe: si falla, no pasa nada */ }
  }

  Object.assign(N, {
    pintarBloqueAjustes: pintarBloqueAjustes,
    limpiarEnviosViejos: limpiarEnviosViejos
  });
})();
