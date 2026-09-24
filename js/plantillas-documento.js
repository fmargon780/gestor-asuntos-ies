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
       Sin imagen guardada, `Membrete.montar()` da `null` y no se toca
       nada: el documento sale igual que si no existiera este paso. */
    if (window.Membrete) {
      try {
        var membrete = await Membrete.montar();
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
    try {
      resultado = await Docx.rellenar(buffer, valores);
      if (tablas) resultado = await TablasDatos.resaltarResultado(resultado, tablas.faltan);
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
        if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(asunto, hito.id, 'generar');   /* fila 109 */
      }
      if (window.HitosPanel && HitosPanel.desplegarAlAbrir) HitosPanel.desplegarAlAbrir(asunto.nombre, hito.id);
    }

    if (typeof App.abrirFicha === 'function') App.abrirFicha(asunto, modo);
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
     LA SECCIÓN "PLANTILLA DE DOCUMENTO DE WORD" DE LA PANTALLA DE UN
     TIPO (17-sep-2026, fila 39, docs/AJUSTES-POR-TIPO.md)

     Hermana de la de correo (js/plantillas-ajustes.js): buscador ya no
     hace falta, porque solo se ven las de un tipo. Tarjetas, alta con
     el .docx elegido de entre los que ya estén subidos a
     _GESTOR/PLANTILLAS, edición y borrado con Papelera, y debajo el
     catálogo de huecos con un botón de copiar en cada uno.
     ========================================================== */

  var datosDeAjustes = null;
  var refrescarSeccionActual = function () {};

  /* Los huecos "de llave doble" (20-sep-2026, fila 81): se resuelven
     aparte, antes que los demás, así que se escriben con doble llave
     para que no se confundan con un dato de asunto corriente. `{LO QUE
     FALTA}` ya trae sus propias llaves dentro de la clave (viene de
     antes); los de aquí, no. */
  var HUECOS_DE_LLAVE_DOBLE = ['firmante', 'cargo firmante', 'tratamiento firmante',
    'visto bueno', 'cargo visto bueno', 'tratamiento visto bueno', 'consejeria', 'formularios', 'especialidad'];

  function textoDelHueco(h) {
    if (h.clave.indexOf('{') !== -1) return '{' + h.clave + '}';    /* {LO QUE FALTA} */
    if (HUECOS_DE_LLAVE_DOBLE.indexOf(h.clave) !== -1) return '{{' + h.clave.toUpperCase() + '}}';
    return '{' + h.clave + '}';
  }

  function pintarHuecos(caja) {
    if (!caja) return;
    caja.innerHTML = '';
    Plantillas.HUECOS.forEach(function (h) {
      var texto = textoDelHueco(h);
      var fila = document.createElement('div');
      fila.className = 'pd-hueco-fila';
      fila.innerHTML = '<code>' + U.escapar(texto) + '</code><span class="suave">' + U.escapar(h.etiqueta) + '</span>';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.textContent = 'Copiar';
      b.onclick = function () { copiarHueco(texto, b); };
      fila.appendChild(b);
      caja.appendChild(fila);
    });
    /* Fila 111 (js/genero.js): las formas dobles, y de quién son. */
    var genero = document.createElement('p');
    genero.className = 'suave pd-hueco-genero';
    genero.innerHTML = 'Masculino o femenino: escribe las dos formas con barra (<code>el/la alumno/a</code>, ' +
      '<code>D./Dña.</code>) y sale solo la que toca. Son de la persona del asunto; para otra, pega detrás ' +
      '<code>:tutor1</code>, <code>:tutor2</code>, <code>:firmante</code> o <code>:vistobueno</code> ' +
      '(<code>hijo/a:tutor1</code>). «Director/a» y los demás cargos ya son de quien firma.';
    caja.appendChild(genero);
  }

  function copiarHueco(texto, boton) {
    U.copiar(texto, boton);
  }

  /* Pinta, dentro de `contenedor`, solo las plantillas de documento de
     `tipo`. Se llama desde la sección "Plantilla de documento de Word"
     de la pantalla de un tipo (js/ajustes-tipo.js). */
  async function pintarDeTipo(contenedor, tipo) {
    if (!contenedor) return;
    if (App.E.gestor) datosDeAjustes = await Plantillas.cargar(App.E.gestor);
    refrescarSeccionActual = function () { pintarDeTipo(contenedor, tipo); };

    var lista = (datosDeAjustes ? datosDeAjustes.documentos : [])
      .filter(function (p) { return p.tipo === tipo.tipo; })
      .sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });

    contenedor.innerHTML =
      '<p class="explica">Sube antes el .docx a Dropbox, dentro de la carpeta de asuntos ' +
      'abiertos, en <code>_GESTOR/PLANTILLAS</code>. Aquí se cuelga de este tipo: el botón ' +
      '"Generar documento" de la ficha saca una copia ya rellena, sin preguntar nada.</p>' +
      '<div id="tipo-pd-lista" class="rejilla-tipos"></div>' +
      '<button type="button" class="boton boton-principal" id="tipo-pd-nueva" ' +
      'style="margin-top:10px">+ Nueva plantilla</button>' +
      '<hr>' +
      '<label class="etiqueta">Huecos que se pueden usar en el Word</label>' +
      '<p class="nota">Cópialos y pégalos donde haga falta, escritos igual, entre llaves.</p>' +
      '<div id="tipo-pd-huecos" class="rejilla-huecos"></div>';

    var caja = $('tipo-pd-lista');
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ninguna plantilla de documento para este tipo.</div>';
    } else {
      lista.forEach(function (p) { caja.appendChild(tarjetaDePlantillaDoc(p)); });
    }
    $('tipo-pd-nueva').onclick = function () { abrirCuadroDePlantillaDoc(null, tipo, refrescarSeccionActual); };
    pintarHuecos($('tipo-pd-huecos'));
  }

  function tarjetaDePlantillaDoc(p) {
    var div = document.createElement('div');
    div.className = 'tarjeta-tipo';
    div.innerHTML = '<div class="nombre-tipo">' + U.escapar(p.nombre) + '</div>' +
      '<div class="suave">' + U.escapar(p.tipo) + '  ·  ' + U.escapar(p.categoria) + '</div>' +
      '<div class="suave">' + U.escapar(p.fichero) + '</div>';

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.style.marginTop = '8px';

    var editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'boton';
    editar.textContent = 'Editar';
    editar.onclick = function () { abrirCuadroDePlantillaDoc(p, null, refrescarSeccionActual); };
    acciones.appendChild(editar);

    acciones.appendChild(Papelera.botonBorrar(async function () {
      var ok = await Papelera.preguntarBorrar(p.nombre);
      if (!ok) return;
      try {
        await Papelera.mandarDato('plantilla-documento', p.nombre,
          { categoria: p.categoria, tipo: p.tipo }, { plantilla: p });
        await Plantillas.guardar(App.E.gestor, function (actual) {
          actual.documentos = actual.documentos.filter(function (x) { return x.id !== p.id; });
          return actual;
        });
        U.aviso('Plantilla de documento mandada a la papelera.', 'bueno');
        refrescarSeccionActual();
      } catch (e) {
        U.aviso('No he podido borrarla: ' + U.mensajeDeError(e), 'malo');
      }
    }));

    div.appendChild(acciones);
    return div;
  }

  function opcionesDeCategoria(categoria) {
    return (App.E.tipos || []).filter(function (t) { return t.categoria === categoria; });
  }

  /* Los .docx que ya haya en _GESTOR/PLANTILLAS, para elegir de ahí en
     el alta: nunca se sube un fichero desde este cuadro (eso lo hace
     Francisco a mano, en Dropbox), solo se cuelga de un tipo. */
  async function ficherosDeWordDisponibles() {
    try {
      var carpeta = await carpetaDePlantillas();
      var lista = await Carpetas.ficheros(carpeta);
      return lista.map(function (f) { return f.nombre; }).filter(function (n) {
        return /\.docx$/i.test(n);
      }).sort();
    } catch (e) { return []; }
  }

  /* Los cargos del centro (20-sep-2026, fila 81), en su `orden`, para
     los desplegables "Quien firma" y "Visto bueno". */
  async function opcionesDeCargos(idElegido) {
    if (!window.Cargos) return '<option value="">(sin cargos)</option>';
    var datos = await Cargos.leer();
    return Cargos.ordenados(datos).map(function (c) {
      return '<option value="' + U.escapar(c.id) + '"' + (c.id === idElegido ? ' selected' : '') + '>' +
        U.escapar(c.nombre) + '</option>';
    }).join('');
  }

  async function abrirCuadroDePlantillaDoc(existente, tipoPreset, alGuardar) {
    var categorias = Nombres.CATEGORIAS;
    var categoriaInicial = (existente && existente.categoria) || (tipoPreset && tipoPreset.categoria) || categorias[0];
    var ficheros = await ficherosDeWordDisponibles();
    var opcionesFirmante = '<option value="">(ninguno)</option>' + await opcionesDeCargos(existente && existente.firmante);
    var opcionesVistoBueno = '<option value="">(ninguno)</option>' + await opcionesDeCargos(existente && existente.vistoBueno);

    function opcionesTipos(categoria) {
      return opcionesDeCategoria(categoria).map(function (t) {
        var elegido = existente ? existente.tipo === t.tipo : (tipoPreset && tipoPreset.tipo === t.tipo);
        return '<option value="' + U.escapar(t.tipo) + '"' + (elegido ? ' selected' : '') + '>' +
          U.escapar(t.tipo) + '</option>';
      }).join('');
    }

    function opcionesFicheros() {
      if (!ficheros.length) {
        return '<option value="">(no hay ningún .docx en _GESTOR/PLANTILLAS)</option>';
      }
      return ficheros.map(function (n) {
        return '<option value="' + U.escapar(n) + '"' +
          (existente && existente.fichero === n ? ' selected' : '') + '>' + U.escapar(n) + '</option>';
      }).join('');
    }

    var cuerpo =
      '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Categoría</label>' +
          '<select id="pd-categoria" class="campo">' +
            categorias.map(function (c) {
              return '<option value="' + c + '"' + (c === categoriaInicial ? ' selected' : '') + '>' + c + '</option>';
            }).join('') +
          '</select></div>' +
        '<div><label class="etiqueta">Tipo de asunto</label>' +
          '<select id="pd-tipo" class="campo">' + opcionesTipos(categoriaInicial) + '</select></div>' +
      '</div>' +
      '<label class="etiqueta">Fichero (.docx en _GESTOR/PLANTILLAS)</label>' +
      '<select id="pd-fichero" class="campo">' + opcionesFicheros() + '</select>' +
      '<label class="etiqueta">Nombre de la plantilla</label>' +
      '<input id="pd-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Tipo de documento</label>' +
          '<input id="pd-tipo-doc" class="campo" placeholder="NOTIFICACIÓN, RESOLUCIÓN…" ' +
            'value="' + U.escapar((existente && existente.tipoDocumento) || '') + '"></div>' +
        '<div><label class="etiqueta">Texto adicional <span class="suave">(opcional)</span></label>' +
          '<input id="pd-texto" class="campo" value="' + U.escapar((existente && existente.texto) || '') + '"></div>' +
      '</div>' +
      '<p class="nota">Con esas dos piezas y la fecha de hoy se monta el nombre del documento ' +
      'generado (js/nombres.js).</p>' +
      '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Quien firma</label>' +
          '<select id="pd-firmante" class="campo">' + opcionesFirmante + '</select></div>' +
        '<div><label class="etiqueta">Visto bueno <span class="suave">(opcional)</span></label>' +
          '<select id="pd-visto-bueno" class="campo">' + opcionesVistoBueno + '</select></div>' +
      '</div>' +
      '<p class="nota">Se pone la persona que ocupaba ese cargo en la fecha del documento ' +
      '(Ajustes → El centro → Cargos del centro).</p>';

    var promesa = U.preguntar(existente ? 'Editar plantilla de documento' : 'Nueva plantilla de documento',
      cuerpo, existente ? 'Guardar' : 'Crear');

    $('pd-categoria').onchange = function () {
      $('pd-tipo').innerHTML = opcionesTipos($('pd-categoria').value);
    };

    var ok = await promesa;
    if (!ok) return;

    var nombre = $('pd-nombre').value.trim();
    var tipo = $('pd-tipo').value;
    var categoria = $('pd-categoria').value;
    var fichero = $('pd-fichero').value;
    var tipoDocumento = $('pd-tipo-doc').value.trim();
    var texto = $('pd-texto').value.trim();
    var firmante = $('pd-firmante').value;
    var vistoBueno = $('pd-visto-bueno').value;

    if (!nombre || !tipo || !fichero || !tipoDocumento) {
      U.aviso('Hace falta el nombre, el tipo, el fichero y el tipo de documento.', 'malo');
      return;
    }

    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        if (existente) {
          var i = actual.documentos.findIndex(function (x) { return x.id === existente.id; });
          if (i !== -1) {
            actual.documentos[i] = { id: existente.id, tipo: tipo, categoria: categoria, nombre: nombre,
              fichero: fichero, tipoDocumento: tipoDocumento, texto: texto,
              firmante: firmante, vistoBueno: vistoBueno };
          }
        } else {
          actual.documentos.push({ id: Plantillas.idNuevoDocumento(), tipo: tipo, categoria: categoria,
            nombre: nombre, fichero: fichero, tipoDocumento: tipoDocumento, texto: texto,
            firmante: firmante, vistoBueno: vistoBueno });
        }
        return actual;
      });
      U.aviso(existente ? 'Plantilla de documento guardada.' : 'Plantilla de documento creada.', 'bueno');
      if (typeof alGuardar === 'function') alGuardar();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* «Cargar las plantillas del centro» vive en js/plantillas-centro.js
     desde la fila 126 (este fichero pasaba de 700 líneas). */

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
    pintarDeTipo: pintarDeTipo,
    abrirCuadroDePlantillaDoc: abrirCuadroDePlantillaDoc,
    /* Para js/hitos-generar.js (fila 102). */
    generar: generarDocumento, elegir: elegirPlantilla, plantillasDelAsunto: plantillasDelAsunto,
    categoriaDelAsunto: categoriaDelAsunto, tipoDelAsunto: tipoDelAsunto
  };

})();
