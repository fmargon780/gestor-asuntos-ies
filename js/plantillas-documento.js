/* ============================================================
   plantillas-documento.js — el gemelo en papel de las plantillas de
   correo (16-sep-2026, docs/PLANTILLAS-DE-DOCUMENTO.md, fila 17 de
   docs/COLA.md).

   Francisco cuelga un .docx de un tipo de asunto en Ajustes. Dentro
   de la ficha de un asunto de ese tipo, el botón "Generar documento"
   saca una copia del Word con los huecos rellenos, ya guardada en la
   carpeta del asunto y con el nombre que mandan las reglas —sin
   preguntar nada: todo hueco sale de datos que la aplicación ya
   tiene (js/plantillas.js, `Plantillas.valoresDeAsunto`).

   Este fichero trae:
     - El motor de la generación (leer el .docx de _GESTOR/PLANTILLAS,
       js/docx.js para rellenarlo, js/nombres.js para su nombre, y
       guardarlo sin pisar).
     - El botón "Generar documento" en la ficha del asunto, puesto con
       el mismo patrón que js/correo.js: se envuelve App.abrirFicha y
       se vigila la pantalla con un MutationObserver, por si se
       repinta sola.
     - El bloque "Plantillas de documento" de Ajustes, hermano del de
       correo (js/plantillas-ajustes.js) y con la misma forma:
       buscador, tarjetas, alta/edición/borrado con Papelera, y la
       lista de huecos con un botón de copiar en cada uno.

   No toca js/plantillas.js (ya se sacó de ahí el bloque de Ajustes de
   correo para no crecer más) ni la lista blanca `BOTONES_DE_LA_TARJETA`
   de js/ficha-asunto.js: el botón va en la ficha, no en la tarjeta.

   Desde la fila 133 (24-sep-2026, docs/PARTIR-FICHEROS-GRANDES.md) la
   sección de la pantalla de un tipo vive en
   js/plantillas-documento-ajustes.js, que se carga justo después.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var CARPETA_PLANTILLAS = 'PLANTILLAS';

  function carpetaDePlantillas() {
    return Carpetas.crear(App.E.gestor, CARPETA_PLANTILLAS);
  }

  /* ==========================================================
     EL MOTOR: LEER, RELLENAR Y GUARDAR
     ========================================================== */

  /* El nombre del documento generado sale de Nombres.montarDocumento,
     con el tipo de documento y el texto adicional que trae la propia
     plantilla (docs/PLANTILLAS-DE-DOCUMENTO.md, 5.3). Aparte para que
     las pruebas puedan comprobarlo sin generar un documento entero. */
  function nombreDelDocumentoGenerado(plantillaDoc, fechaIso) {
    return Nombres.montarDocumento({
      fecha: fechaIso,
      tipo: plantillaDoc.tipoDocumento || 'DOCUMENTO',
      curso: plantillaDoc.texto || '',
      extension: 'docx'
    });
  }

  /* Guardar un Blob dentro de una carpeta: lo mismo que hacen
     Carpetas.escribirTexto y Carpetas.copiarFicheroEn, pero con un
     Blob de entrada en vez de un texto o de un fichero ya elegido
     (aquí no hay ningún fichero que elegir: el contenido lo genera
     js/docx.js en memoria). */
  async function guardarBlobEnCarpeta(dir, nombre, blob) {
    var h = await dir.getFileHandle(nombre, { create: true });
    var w = await h.createWritable();
    await w.write(blob);
    await w.close();
  }

  function categoriaDelAsunto(a) {
    return (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || '';
  }
  function tipoDelAsunto(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    return l.tipo || f.tipo || '';
  }

  /* Las plantillas de documento del tipo de este asunto, o `[]` si el
     fichero no existe todavía o el tipo no tiene ninguna. */
  async function plantillasDelAsunto(a) {
    if (!App.E.gestor) return [];
    var datos = null;
    try { datos = await Plantillas.cargarReciente(App.E.gestor, 60000); } catch (e) { datos = null; }
    if (!datos) return [];
    return Plantillas.documentosDeTipo(datos, categoriaDelAsunto(a), tipoDelAsunto(a));
  }

  /* Los siete pasos de "Al generar" (docs/PLANTILLAS-DE-DOCUMENTO.md, 5). */
  /* `opciones.hito` (fila 102, docs/DOCUMENTOS-DESDE-EL-HITO.md): generado
     desde un hito. Rellena sus huecos ({{HITO}}, {{PLAZO DEL HITO}},
     {hecho:...}, {{LO QUE FALTA}}), deja el documento apuntado a ese
     hito, marca su casilla de "Lo que hay que reunir", apunta una nota
     en el hito y lo deja desplegado al volver a pintar la ficha. Sin
     `opciones`, exactamente lo de siempre. */
  async function generarDocumento(asunto, plantillaDoc, modo, opciones) {
    var hito = (opciones && opciones.hito) || null;
    var carpeta = await carpetaDePlantillas();
    var handle;
    try {
      handle = await carpeta.getFileHandle(plantillaDoc.fichero);
    } catch (e) {
      U.aviso('No encuentro "' + plantillaDoc.fichero + '" en _GESTOR/PLANTILLAS.', 'malo');
      return;
    }

    var buffer;
    try {
      var fichero = await handle.getFile();
      buffer = await fichero.arrayBuffer();
    } catch (e) {
      U.aviso('No he podido leer la plantilla: ' + U.mensajeDeError(e), 'malo');
      return;
    }

    /* El membrete (20-sep-2026, fila 81): se mete ANTES de rellenar,
       porque `Docx.ponerImagen` busca el hueco `{{MEMBRETE}}` en el
       XML tal cual viene de la plantilla, no en el texto ya relleno.
       Si no se puede dibujar, `Membrete.montar()` da `null` y no se toca
       nada: el documento sale igual que si no existiera este paso. */
    if (window.Membrete) {
      try {
        /* Fila 149: cada plantilla dice si lleva el logo del centro (sin la clave, sí). */
        var membrete = await Membrete.montar({ conLogoCentro: plantillaDoc.conLogoCentro !== false });
        if (membrete) buffer = await Docx.ponerImagen(buffer, 'MEMBRETE', membrete.bytes, membrete.ancho, membrete.alto);
      } catch (e) { /* sin membrete, el documento sigue generándose */ }
    }

    var valores = await Plantillas.valoresDeAsunto(asunto, { fecha: U.hoyIso(), plantilla: plantillaDoc, hito: hito });
    /* Las tablas de datos (fila 110, js/tablas-datos.js): {{TABLA …}} se mete
       aquí como tabla de Word; {{ESPECIALIDAD}} y {{DATO …}}, en `valores`. */
    var tablas = null;
    if (window.TablasDatos) {
      try { tablas = await TablasDatos.prepararDocumento(buffer, asunto, valores); buffer = tablas.buffer; }
      catch (e) { tablas = null; }
    }
    var resultado;
    async function rellenarCon(v) {
      var r = await Docx.rellenar(buffer, v);
      return tablas ? TablasDatos.resaltarResultado(r, tablas.faltan) : r;
    }
    try {
      resultado = await rellenarCon(valores);
      /* Fila 155 (docs/WORD-DENTRO-DE-LA-APP.md, A): lo que falta se
         pregunta ANTES de guardar nada (js/word-faltan.js); lo de las
         tablas de datos, en amarillo, no entra aquí. */
      var deTablas = (tablas && tablas.faltan) || [];
      var preguntar = resultado.faltan.filter(function (f) { return deTablas.indexOf(f) === -1; });
      if (preguntar.length && window.WordFaltan) {
        var r = await WordFaltan.preguntar(preguntar);
        if (r.accion === 'cancelar') { U.aviso('No se ha generado nada.', 'ambar'); return; }
        if (r.accion === 'generar' && Object.keys(r.aMano).length) resultado = await rellenarCon(Object.assign({}, valores, { aMano: r.aMano }));
      }
    } catch (e) {
      U.aviso('No he podido rellenar el documento: ' + U.mensajeDeError(e), 'malo');
      return;
    }

    var nombreDoc = nombreDelDocumentoGenerado(plantillaDoc, U.hoyIso());
    if (nombreDoc.length > App.LARGO_MAXIMO_NOMBRE) {
      U.aviso('El nombre del documento sale demasiado largo (más de ' +
        App.LARGO_MAXIMO_NOMBRE + ' letras). Acorta el texto adicional de la plantilla.', 'malo');
      return;
    }

    var yaEsta;
    try { yaEsta = await Carpetas.ficheros(asunto.handle); } catch (e) { yaEsta = []; }
    if (yaEsta.some(function (f) { return f.nombre === nombreDoc; })) {
      U.aviso('Ya hay un documento con ese nombre en la carpeta: "' + nombreDoc + '".', 'malo');
      return;
    }

    try {
      await guardarBlobEnCarpeta(asunto.handle, nombreDoc, resultado.blob);
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return;
    }

    if (window.Notas) {
      try { await Notas.anadir(asunto, 'Generado ' + nombreDoc); } catch (e) { /* ya está guardado */ }
    }

    /* El documento ya está en la carpeta: con amarillo, nunca rojo, si
       le faltan datos (fila 100). */
    U.aviso(
      resultado.faltan.length
        ? 'Documento generado, con huecos sin dato: ' + resultado.faltan.join(', ') + '.'
        : 'Documento generado: ' + nombreDoc,
      resultado.faltan.length ? 'ambar' : 'bueno');

    if (hito && window.Hitos) {
      try {
        await Hitos.anadirDocumento(asunto.nombre, hito.id, nombreDoc);
        await Hitos.anadirNota(asunto.nombre, hito.id, 'Generado «' + nombreDoc + '»');
      } catch (e) {
        U.accesorio('Documento generado, pero no he podido apuntarlo en el hito', e);
      }
      if (window.HitosRequisitos) {
        try { await HitosRequisitos.marcarPorDocumento(asunto.nombre, hito.id, nombreDoc); } catch (e2) { /* no crítico */ }
        /* Fila 164: desde la receta de un paso, se marca ese paso. */
        if (opciones && opciones.idPasoGuion && Hitos.marcarGuion) {
          try { await Hitos.marcarGuion(asunto.nombre, hito.id, opciones.idPasoGuion, { hecho: true }); }
          catch (e3) { U.accesorio('Documento generado, pero no he podido marcar el paso', e3); }
        } else if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(asunto, hito.id, 'generar');   /* fila 109 */
      }
      if (window.HitosPanel && HitosPanel.desplegarAlAbrir) HitosPanel.desplegarAlAbrir(asunto.nombre, hito.id);
    }

    if (typeof App.abrirFicha === 'function') App.abrirFicha(asunto, modo);
    /* Fila 155, B: el Word recién hecho, en grande dentro de la aplicación. */
    if (window.WordVisor) WordVisor.abrir({ blob: resultado.blob, nombre: nombreDoc, carpeta: asunto.handle, asunto: asunto, hito: hito });
  }

  /* ==========================================================
     ELEGIR ENTRE VARIAS PLANTILLAS

     Como Relacionados.elegirTercero: se pinta dentro del cuadro
     compartido (#capa), sin usar U.preguntar, porque aquí la elección
     se hace pulsando una de la lista, no un botón de "Aceptar". Solo
     un cuadro de diálogo a la vez en toda la aplicación.
     ========================================================== */

  /* `lista` puede ser un array (lo de siempre) o, desde un hito (fila
     102), `{ delPaso: [...], delTipo: [...] }`: dos grupos con rótulo,
     y una plantilla que esté en los dos sale solo en "De este paso". */
  function elegirPlantilla(lista) {
    var grupos = Array.isArray(lista) ? [{ rotulo: '', lista: lista }] : (function () {
      var delPaso = lista.delPaso || [];
      var ids = {};
      delPaso.forEach(function (p) { ids[p.id] = true; });
      var delTipo = (lista.delTipo || []).filter(function (p) { return !ids[p.id]; });
      return [{ rotulo: 'De este paso', lista: delPaso }, { rotulo: 'Otras de este tipo de asunto', lista: delTipo }]
        .filter(function (g) { return g.lista.length; });
    })();
    return new Promise(function (resolver) {
      var resuelto = false;
      function resolverUnaVez(v) { if (resuelto) return; resuelto = true; resolver(v); }

      var capa = $('capa');
      $('cuadro-titulo').textContent = 'Elegir plantilla de documento';
      var cuerpo = $('cuadro-cuerpo');
      var hay = grupos.some(function (g) { return g.lista.length; });
      cuerpo.innerHTML = '<p class="explica">' + (hay ? 'Elige con cuál generar.' : 'Este hito no tiene plantillas: búscala entre todas las del centro.') + '</p>' +
        '<div id="pd-elegir-lista"></div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
      }
      $('cuadro-cancelar').onclick = function () { cerrar(); resolverUnaVez(null); };

      grupos.forEach(function (g) {
        if (g.rotulo) {
          var r = document.createElement('div');
          r.className = 'etiqueta pd-elegir-rotulo';
          r.textContent = g.rotulo;
          $('pd-elegir-lista').appendChild(r);
        }
        g.lista.forEach(function (p) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'boton pd-elegir-opcion';
          b.textContent = p.nombre;
          b.onclick = function () { cerrar(); resolverUnaVez(p); };
          $('pd-elegir-lista').appendChild(b);
        });
      });

      /* «Buscar otra plantilla…» (fila 126, js/plantilla-buscar.js), en el mismo cuadro. */
      if (!Array.isArray(lista) && lista.buscar && window.PlantillaBuscar) {
        var caja = document.createElement('div');
        caja.className = 'pd-buscar-caja';
        var enlace = document.createElement('button');
        enlace.type = 'button';
        enlace.className = 'enlace pd-buscar-otra';
        enlace.textContent = 'Buscar otra plantilla…';
        function abrirBuscador() {
          enlace.classList.add('oculto');
          PlantillaBuscar.montar(caja, function (p) { cerrar(); resolverUnaVez(p); });
        }
        enlace.onclick = abrirBuscador;
        $('pd-elegir-lista').appendChild(enlace);
        $('pd-elegir-lista').appendChild(caja);
        if (!hay) abrirBuscador();
      }
    });
  }

  async function elegirYGenerar(asunto, modo, lista) {
    var elegido = lista[0];
    if (lista.length > 1) {
      elegido = await elegirPlantilla(lista);
      if (!elegido) return;
    }
    await generarDocumento(asunto, elegido, modo);
  }

  /* ==========================================================
     EL BOTÓN "GENERAR DOCUMENTO" EN LA FICHA DEL ASUNTO

     Mismo patrón que js/correo.js con "Correo" y "Mensaje Séneca":
     se envuelve App.abrirFicha y se pone el botón en #ficha-acciones,
     sin tocar BOTONES_DE_LA_TARJETA de js/ficha-asunto.js (no va en
     la tarjeta de la lista). Como saber si el tipo tiene plantillas
     de documento es asíncrono (hay que leer plantillas.json), el
     botón puede salir un instante después del resto de la ficha.
     ========================================================== */

  (function () {
    var actual = null;
    var modoActual = 'abierto';

    var nueva = U.envolver(App, 'App.abrirFicha', 'plantillas-documento.js', function (comoEra) {
      return function (a, modo) {
        actual = a;
        modoActual = modo || 'abierto';
        comoEra(a, modo);
        ponerBoton(a);
      };
    });
    if (!nueva) return;

    async function ponerBoton(asunto) {
      var lista = await plantillasDelAsunto(asunto);
      if (asunto !== actual) return;   /* se cambió de ficha mientras se leía */
      if (!lista.length) return;
      var caja = $('ficha-acciones');
      if (!caja || caja.querySelector('.boton-generar-documento')) return;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton boton-generar-documento';
      b.textContent = 'Generar documento';
      b.title = 'Sacar una copia de una plantilla de Word con los huecos ya rellenos';
      b.onclick = function () {
        b.disabled = true;
        elegirYGenerar(asunto, modoActual, lista).finally(function () { b.disabled = false; });
      };
      caja.appendChild(b);
    }

    var pantalla = $('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      /* Con un pequeño retraso (fila 101): una tanda de cambios de la
         ficha es una sola pasada, no una por cada nodo. */
      var pendiente = null;
      new MutationObserver(function () {
        if (!actual) return;
        if (pendiente) clearTimeout(pendiente);
        pendiente = setTimeout(function () { pendiente = null; if (actual) ponerBoton(actual); }, 150);
      }).observe(pantalla, { childList: true, subtree: true });
    }
  })();

  /* ==========================================================
     ENGANCHE
     ========================================================== */

  /* Ya no hay ningún bloque global de Ajustes que mantener al día
     (desde la fila 39, cada tipo pinta el suyo al abrirse): no hace
     falta enganchar nada a `window.Gestor.alRefrescar`. */

  /* Público: `pintarDeTipo` y `abrirCuadroDePlantillaDoc` los usa
     js/ajustes-tipo.js; `nombreDelDocumentoGenerado`, las pruebas
     (docs/PLANTILLAS-DE-DOCUMENTO.md, 8.7). */
  window.PlantillasDocumento = {
    nombreDelDocumentoGenerado: nombreDelDocumentoGenerado,
    /* pintarDeTipo y abrirCuadroDePlantillaDoc los pone
       js/plantillas-documento-ajustes.js (fila 133). */
    _interno: { carpetaDePlantillas: carpetaDePlantillas },
    /* Para js/hitos-generar.js (fila 102). */
    generar: generarDocumento, elegir: elegirPlantilla, plantillasDelAsunto: plantillasDelAsunto,
    categoriaDelAsunto: categoriaDelAsunto, tipoDelAsunto: tipoDelAsunto
  };

})();
