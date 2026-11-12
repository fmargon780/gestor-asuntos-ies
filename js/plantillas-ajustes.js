/* ============================================================
   plantillas-ajustes.js — las plantillas de correo (16-sep-2026,
   docs/PLANTILLAS-DE-CORREO.md), y desde el 17-sep-2026 (fila 39,
   docs/AJUSTES-POR-TIPO.md) también los datos del centro y la firma.

   Vivía dentro de js/plantillas.js hasta que ese fichero, al crecer
   con el motor de las plantillas de documento (fila 17 de
   docs/COLA.md, docs/PLANTILLAS-DE-DOCUMENTO.md), pasó de 450 líneas.
   Se sacó aquí sin cambiar lo que hace: solo pantalla, apoyada en la
   API pública de `window.Plantillas` (cargar, guardar, deTipo,
   idNuevo, rellenar, HUECOS...).

   Con la pantalla propia de un tipo de asunto (fila 39) esto dejó de
   pintar un único bloque grande con TODAS las plantillas: ahora
   `pintarDeTipo` pinta solo las de un tipo, dentro de su sección de
   js/ajustes-tipo.js. El cuadro de alta/edición (`abrirCuadroDePlantilla`)
   es el mismo de siempre, con un `tipoPreset` opcional para que se abra
   ya con el tipo elegido. Los campos de "Datos del centro y firma" son
   ahora estáticos en index.html, dentro de la pestaña "El centro"; este
   fichero solo los rellena y guarda, ya no los construye.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* Fila 560: lo de «Datos del centro y firma» vive en js/plantillas-ajustes-centro.js (se carga antes que este fichero). */
  var Centro = window.PlantillasAjustesCentro;
  var cargar = Centro.cargar;
  var pintarFirmaYCentro = Centro.pintarFirmaYCentro;
  var ayudarConLaDireccionNormativa = Centro.ayudarConLaDireccionNormativa;
  var montarCamposDeCorreo = Centro.montarCamposDeCorreo;

  /* ---------- las plantillas de UN tipo (sección de js/ajustes-tipo.js) ---------- */

  /* Fila 321: «Volver a activar» en la tarjeta de una plantilla fuera de uso. */
  function botonVolverAActivar(p, clase, alTerminar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = 'Volver a activar';
    b.onclick = function () { return PlantillasFueraDeUso.volverAActivar(p, clase, alTerminar); };
    return b;
  }

  function tarjetaDePlantilla(p) {
    var div = document.createElement('div');
    div.className = 'tarjeta-tipo' + (Plantillas.enUso(p) ? '' : ' tarjeta-fuera-de-uso');
    div.innerHTML = '<div class="nombre-tipo">' + U.escapar(p.nombre) + '</div>' +
      (Plantillas.enUso(p) ? '' : '<div class="suave">' + U.escapar(PlantillasFueraDeUso.etiqueta(p)) + '</div>');

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.style.marginTop = '8px';

    var editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'boton';
    editar.textContent = 'Cambiar';
    editar.onclick = function () { abrirCuadroDePlantilla(p, null, refrescarSeccionActual); };
    acciones.appendChild(editar);
    if (!Plantillas.enUso(p)) acciones.appendChild(botonVolverAActivar(p, 'correo', async function () { await cargar(); refrescarSeccionActual(); }));

    acciones.appendChild(Papelera.botonBorrar(async function () {
      if (!(await Plantillas.borrarConPapelera(p, 'correo'))) return;   /* fila 320: el mismo código que la pantalla «Plantillas» */
      await cargar();
      refrescarSeccionActual();
    }));

    div.appendChild(acciones);
    return div;
  }

  var refrescarSeccionActual = function () {};   /* la sustituye pintarDeTipo mientras está abierta */

  /* Pinta, dentro de `contenedor`, solo las plantillas de `tipo`. Se
     llama desde la sección "Plantillas de correo y de Séneca" de la
     pantalla de un tipo (js/ajustes-tipo.js). */
  async function pintarDeTipo(contenedor, tipo) {
    if (!contenedor) return;
    await cargar();
    refrescarSeccionActual = function () { pintarDeTipo(contenedor, tipo); };

    var lista = (Centro.datos() ? Centro.datos().lista : [])
      .filter(function (p) { return p.tipo === tipo.tipo; })
      .sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });

    contenedor.innerHTML =
      '<p class="explica">Cada plantilla lleva su texto y, si quieres, su saludo, su firma y a quién va (Para, Copia y Copia oculta); ' +
      'vacíos, salen los de siempre. Sirve igual para el correo y para el mensaje de Séneca. Los campos variables entre ' +
      'llaves, como <code>{nombre}</code>, se rellenan solos al abrir el cuadro.</p>' +
      '<div id="tipo-plantillas-lista" class="rejilla-tipos"></div>' +
      '<button type="button" class="boton boton-principal" id="tipo-plantillas-nueva" ' +
      'style="margin-top:10px">+ Nueva plantilla</button>';

    var caja = $('tipo-plantillas-lista');
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ninguna plantilla de correo para este tipo.</div>';
    } else {
      lista.forEach(function (p) { caja.appendChild(tarjetaDePlantilla(p)); });
    }
    $('tipo-plantillas-nueva').onclick = function () {
      abrirCuadroDePlantilla(null, tipo, refrescarSeccionActual);
    };
    /* Fila 320: la pantalla «Plantillas», con este tipo ya puesto. */
    if (window.PlantillasPantalla) PlantillasPantalla.enlaceDeTipo($('tipo-plantillas-nueva'), 'correo', tipo.tipo);
  }

  /* ---------- el cuadro de alta / edición ----------

     Un cuadro de U.preguntar corriente. `tipoPreset` (un objeto
     { tipo, categoria }) preselecciona los dos desplegables cuando se
     abre desde la pantalla de un tipo; `alGuardar` se llama, además
     del aviso de siempre, cuando el guardado termina bien (para que
     la sección que lo abrió se repinte). */

  function datosDeMuestra(categoria, tipo) {
    var real = (App.E.listaAbiertos || []).filter(function (a) {
      var c = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria);
      var t = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo);
      return c === categoria && t === tipo;
    })[0];

    var hoy = U.fechaLegible(U.aAaMmDd(U.hoyIso()));
    if (real) {
      var f = real.ficha || {};
      var resto = (real.leido && real.leido.resto) || '';
      return {
        nombre: soloElNombreDeMuestra(f.tercero || Nombres.terceroDeResto(resto)),
        grupo: f.grupo || '',
        curso: f.curso || '',
        tipo: tipo,
        hoy: hoy,
        limite: f.limite ? U.fechaLegible(U.aAaMmDd(f.limite)) : '',
        usuario: App.E.usuario || 'Quien firme',
        centro: (Centro.datos() && Centro.datos().centro) || Plantillas.POR_DEFECTO_CENTRO,
        campos: {}
      };
    }
    return {
      nombre: 'Pérez García, Ana', grupo: '2ºA', curso: U.cursoActual(), tipo: tipo || 'Tipo de ejemplo',
      hoy: hoy, limite: hoy, usuario: App.E.usuario || 'Quien firme',
      centro: (Centro.datos() && Centro.datos().centro) || Plantillas.POR_DEFECTO_CENTRO, campos: {}
    };
  }

  function soloElNombreDeMuestra(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  function opcionesDeCategoria(categoria) {
    return (App.E.tipos || []).filter(function (t) { return t.categoria === categoria; });
  }

  /* Un campo de texto con su botón "Insertar hueco" (18-sep-2026, fila
     60, docs/COMUNICAR-DESDE-EL-HITO.md, 4): el cuadro de una
     plantilla. `otrosCampos` son campos adicionales (por ejemplo, el
     de asunto) que también pueden recibir el hueco desde el mismo
     botón. (Hasta la fila 199 también lo usaba «Comunicación de este
     paso» del editor de la guía, `js/guias-comunicacion.js`, ya
     borrado: esa sección se convierte ahora en tareas del guion.) */
  function campoDeTextoHTML(idTexto, idBoton, etiqueta, valor, filas) {
    return '<div class="etiqueta-con-boton">' +
      '<label class="etiqueta">' + U.escapar(etiqueta) + '</label>' +
      /* Fila 510: el recuadro «Insertar», con «Campo variable» y «Texto condicional». */
      HuecosBuscador.recuadroInsertarHTML(idBoton, idTexto + '-condicional') +
      '</div>' +
      '<textarea id="' + idTexto + '" class="campo" rows="' + (filas || 7) + '">' + U.escapar(valor || '') + '</textarea>' +
      '<p class="nota texto-cond-aviso" id="' + idTexto + '-cond-aviso" aria-live="polite"></p>';
  }

  /* Fila 170 (docs/PLANTILLAS-DEL-COMPANERO.md, parte 2): un segundo
     recuadro, plegado, con el texto propio del mensaje de Séneca (Séneca
     no adjunta ficheros). Vacío, el cuadro de Séneca usa el `texto`. */
  /* Fila 627: el campo «Asunto» de la plantilla (debajo del nombre) y su enganche. */
  function campoAsuntoHTML(id, existente) {
    return window.AsuntoExtractoCampo ? AsuntoExtractoCampo.html(id, {
      etiqueta: 'Asunto', valor: (existente && existente.asunto) || '', placeholder: 'Vacío: sale el asunto general del centro'
    }) : '';
  }
  function engancharAsunto(id, tipoDeLaPlantilla, valoresDelAsunto) {
    if (!window.AsuntoExtractoCampo || !$(id)) return;
    AsuntoExtractoCampo.enganchar(id, {
      unaLinea: true, ocultar: AsuntoExtracto.SOLO_DEL_DOCUMENTO, tipo: tipoDeLaPlantilla, valores: valoresDelAsunto,
      general: function () { return AsuntoExtracto.modeloGeneralDeAsunto(Plantillas.enMemoria()); },
      deQuien: { propio: '(el de esta plantilla)', general: '(el general del centro)' }
    });
  }

  function campoSenecaHTML(prefijo, valor) {
    return '<details class="pl-seneca">' +
      '<summary>Texto para Séneca (opcional)' + (String(valor || '').trim() ? ' · escrito' : '') + '</summary>' +
      '<p class="nota">Si lo escribes, el mensaje de Séneca usa este texto; si no, el de arriba.</p>' +
      campoDeTextoHTML(prefijo + '-texto-seneca', prefijo + '-insertar-hueco-seneca', 'Texto para Séneca', valor || '', 5) +
      '</details>';
  }

  /* La fila de `plantillas.json`: `textoSeneca` solo si trae algo. */
  function filaDePlantilla(id, tipo, categoria, nombre, texto, textoSeneca, adjuntar, previa, papeles, asunto) {
    var fila = { id: id, tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
    if (String(asunto || '').trim()) fila.asunto = String(asunto).trim();   /* fila 627: el asunto propio de la plantilla; vacío, sale el general del centro */
    if (previa && previa.fueraDeUso) fila.fueraDeUso = previa.fueraDeUso;   /* fila 321: cambiar una plantilla no pierde la marca */
    if (String(textoSeneca || '').trim()) fila.textoSeneca = textoSeneca;
    if (String(adjuntar || '').trim()) fila.adjuntar = adjuntar;   /* fila 299: «Adjuntar solo» */
    if (window.PlantillaPapeles) PlantillaPapeles.aFila(fila, papeles);   /* fila 555: destinatarios por papeles, saludo y firma */
    return fila;
  }

  function engancharCampoDeTexto(idTexto, idBoton, otrosCampos, tipoDeLaPlantilla) {
    var boton = $(idBoton), campo = $(idTexto);
    if (!boton || !campo) return;
    HuecosBuscador.montar({ boton: boton, campos: (otrosCampos || []).concat([campo]), tipo: tipoDeLaPlantilla });
    /* Fila 510: «Texto condicional» pone {si:Campo=Valor} al principio del párrafo del cursor. */
    if (window.TextoCondicionalCuadro) {
      TextoCondicionalCuadro.montarBoton({ boton: $(idTexto + '-condicional'), campo: campo, tipo: tipoDeLaPlantilla, aviso: $(idTexto + '-cond-aviso') });
    }
  }

  /* Fila 465: una plantilla general (sin tipo ni categoría, como «Aviso de avance») se puede ver y cambiar
     desde la guía sin que el cuadro le ponga un tipo que no tenía. */
  function esGeneral(existente) { return !!existente && !existente.tipo && !existente.categoria; }

  function opcionesTiposDe(categoria, existente, tipoPreset) {
    if (esGeneral(existente) && !categoria) return '<option value="" selected>(vale para cualquier tipo)</option>';
    return opcionesDeCategoria(categoria).map(function (t) {
      var elegido = existente ? existente.tipo === t.tipo : (tipoPreset && tipoPreset.tipo === t.tipo);
      return '<option value="' + U.escapar(t.tipo) + '"' + (elegido ? ' selected' : '') + '>' +
        U.escapar(t.tipo) + '</option>';
    }).join('');
  }

  /* El cuerpo del editor (los campos de siempre). Lo usan el cuadro de Ajustes
     (`abrirCuadroDePlantilla`) y, desde la fila 465, la columna derecha del
     editor de la guía (js/guias-plantilla.js): un solo editor para los dos. */
  function cuerpoDelCuadroHTML(existente, tipoPreset) {
    var categorias = Nombres.CATEGORIAS;
    var categoriaInicial = esGeneral(existente) ? '' : ((existente && existente.categoria) || (tipoPreset && tipoPreset.categoria) || categorias[0]);
    return '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Categoría</label>' +
          '<select id="pl-categoria" class="campo">' +
            (esGeneral(existente) ? '<option value="" selected>(todas)</option>' : '') +
            categorias.map(function (c) {
              return '<option value="' + c + '"' + (c === categoriaInicial ? ' selected' : '') + '>' + c + '</option>';
            }).join('') +
          '</select></div>' +
        '<div><label class="etiqueta">Tipo de asunto</label>' +
          '<select id="pl-tipo" class="campo">' + opcionesTiposDe(categoriaInicial, existente, tipoPreset) + '</select></div>' +
      '</div>' +
      '<label class="etiqueta">Nombre de la plantilla</label>' +
      '<input id="pl-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      campoAsuntoHTML('pl-asunto', existente) +
      (window.PlantillaPapeles ? PlantillaPapeles.antesDelTextoHTML('pl', existente) : '') +
      campoDeTextoHTML('pl-texto', 'pl-insertar-hueco', 'Texto', (existente && existente.texto) || '', 7) +
      (window.PlantillaPapeles ? PlantillaPapeles.despuesDelTextoHTML('pl', existente) : '') +
      campoSenecaHTML('pl', existente && existente.textoSeneca) +
      (window.PlantillaAdjuntar ? PlantillaAdjuntar.selectHTML('pl-adjuntar', existente && existente.adjuntar) : '') +
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl-previa"></div></div>';
  }

  /* El catálogo de huecos ya no se pinta entero encima del texto:
     un solo botón abre el buscador de js/huecos-buscador.js
     (17-sep-2026, docs/HUECOS-INSERTAR.md). `campos` va en el orden
     del formulario, y el hueco entra en el que tuviera el foco por
     última vez; sin foco previo, al final del último, que es el
     cuadro de texto. La vista previa se repinta sola, porque al
     insertar se lanza un evento `input`. */
  function engancharCuadro(existente, tipoPreset) {
    function tipoElegido() { return ($('pl-tipo') || {}).value || ''; }
    engancharAsunto('pl-asunto', tipoElegido);
    engancharCampoDeTexto('pl-texto', 'pl-insertar-hueco', window.PlantillaPapeles ? PlantillaPapeles.camposDeTexto('pl') : [], tipoElegido);
    if (window.PlantillaPapeles) PlantillaPapeles.enganchar('pl');
    engancharCampoDeTexto('pl-texto-seneca', 'pl-insertar-hueco-seneca', [], tipoElegido);

    function pintarPrevia() {
      var muestra = datosDeMuestra($('pl-categoria').value, $('pl-tipo').value);
      var r = Plantillas.rellenar($('pl-texto').value, muestra);
      $('pl-previa').textContent = r.texto || '(vacío)';
    }

    $('pl-categoria').onchange = function () {
      $('pl-tipo').innerHTML = opcionesTiposDe($('pl-categoria').value, existente, tipoPreset);
      pintarPrevia();
    };
    $('pl-tipo').onchange = pintarPrevia;
    $('pl-texto').oninput = pintarPrevia;
    pintarPrevia();
  }

  /* Lee los campos y guarda. Devuelve true si ha guardado (si falta algo o falla, avisa y devuelve false). */
  async function guardarCuadro(existente, alGuardar) {
    var nombre = $('pl-nombre').value.trim();
    var tipo = $('pl-tipo').value;
    var categoria = $('pl-categoria').value;
    var texto = $('pl-texto').value;
    var textoSeneca = $('pl-texto-seneca') ? $('pl-texto-seneca').value : '';
    var asunto = $('pl-asunto') ? $('pl-asunto').value : '';
    var adjuntar = window.PlantillaAdjuntar ? PlantillaAdjuntar.leer('pl-adjuntar') : '';
    var papeles = window.PlantillaPapeles ? PlantillaPapeles.leer('pl') : null;
    if (!nombre || (!tipo && !esGeneral(existente)) || !texto.trim()) {
      U.aviso('Hace falta el nombre, el tipo y el texto.', 'malo');
      return false;
    }
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        if (existente) {
          var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
          if (i !== -1) actual.lista[i] = filaDePlantilla(existente.id, tipo, categoria, nombre, texto, textoSeneca, adjuntar, actual.lista[i], papeles, asunto);
        } else {
          actual.lista.push(filaDePlantilla(Plantillas.idNuevo(), tipo, categoria, nombre, texto, textoSeneca, adjuntar, null, papeles, asunto));
        }
        return actual;
      });
      U.aviso(existente ? 'Plantilla guardada.' : 'Plantilla creada.', 'bueno');
      await cargar();
      if (typeof alGuardar === 'function') alGuardar();
      return true;
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
  }

  function abrirCuadroDePlantilla(existente, tipoPreset, alGuardar) {
    var promesa = U.preguntar(existente ? 'Cambiar plantilla' : 'Nueva plantilla', cuerpoDelCuadroHTML(existente, tipoPreset),
      existente ? 'Guardar' : 'Crear');
    engancharCuadro(existente, tipoPreset);
    promesa.then(function (ok) {
      if (!ok) return;
      return guardarCuadro(existente, alGuardar);
    });
  }

  /* ==========================================================
     ENGANCHE
     ========================================================== */

  function enganchar() {
    ayudarConLaDireccionNormativa();
    montarCamposDeCorreo();
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (!App.E.gestor) return;
      cargar().then(pintarFirmaYCentro).catch(function () { /* un bloque roto no puede tumbar la aplicación */ });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  /* Público, para js/ajustes-tipo.js. */
  window.PlantillasAjustes = {
    cargar: cargar,
    pintarDeTipo: pintarDeTipo,
    /* Fila 465: repinta la lista de plantillas de la ficha del tipo, si hay una abierta (tras guardar una desde la guía). */
    refrescarSeccion: function () { refrescarSeccionActual(); },
    abrirCuadroDePlantilla: abrirCuadroDePlantilla,
    /* Fila 465: el mismo editor, para pintarlo en otro sitio (js/guias-plantilla.js). */
    cuerpoDelCuadroHTML: cuerpoDelCuadroHTML,
    engancharCuadro: engancharCuadro,
    guardarCuadro: guardarCuadro,
    campoDeTextoHTML: campoDeTextoHTML,
    engancharCampoDeTexto: engancharCampoDeTexto,
    /* Fila 560: lo que necesita js/plantillas-ajustes-editor.js, que cuelga aquí `montarEditorEnLinea` (fila 151). */
    _interno: { campoSenecaHTML: campoSenecaHTML, filaDePlantilla: filaDePlantilla, campoAsuntoHTML: campoAsuntoHTML, engancharAsunto: engancharAsunto }
  };

})();
