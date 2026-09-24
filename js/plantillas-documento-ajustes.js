/* ============================================================
   plantillas-documento-ajustes.js — la sección «Plantilla de documento
   de Word» de la pantalla de un tipo (PlantillasDocumento.pintarDeTipo
   y PlantillasDocumento.abrirCuadroDePlantillaDoc). Salió de
   js/plantillas-documento.js en la fila 133 (24-sep-2026,
   docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada. Se carga justo
   después de js/plantillas-documento.js.
   ============================================================ */
(function () {
  var I = window.PlantillasDocumento._interno;
  function $(id) { return document.getElementById(id); }

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
      var carpeta = await I.carpetaDePlantillas();
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

  window.PlantillasDocumento.pintarDeTipo = pintarDeTipo;
  window.PlantillasDocumento.abrirCuadroDePlantillaDoc = abrirCuadroDePlantillaDoc;
})();
