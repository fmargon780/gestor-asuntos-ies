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

  var datosDeAjustes = null;   /* { firma, centro, lista } ya leído, para pintar sin esperar */

  async function cargar() {
    if (!App.E.gestor) return datosDeAjustes;
    datosDeAjustes = await Plantillas.cargar(App.E.gestor);
    return datosDeAjustes;
  }

  /* ---------- Datos del centro y firma ---------- */

  function pintarFirmaYCentro() {
    if (!datosDeAjustes || !$('plantillas-firma')) return;
    $('plantillas-firma').value = datosDeAjustes.firma;
    $('plantillas-centro').value = datosDeAjustes.centro;
    $('plantillas-localidad').value = datosDeAjustes.localidad;
    $('plantillas-direccion').value = datosDeAjustes.direccion;
    $('plantillas-codigo').value = datosDeAjustes.codigo;
    $('plantillas-cargo').value = datosDeAjustes.cargo;
    /* 20-sep-2026, fila 84: para el hueco {{PROVINCIA}} de un impreso. */
    if ($('plantillas-provincia')) $('plantillas-provincia').value = datosDeAjustes.provincia;
    /* 20-sep-2026, fila 79, apartado 4.7. */
    if ($('plantillas-direccion-normativa')) {
      $('plantillas-direccion-normativa').value = datosDeAjustes.direccionNormativa;
    }
    if (window.HitosNormativa) HitosNormativa.refrescar();
    if (window.CentroDeDatosConfiguracion) CentroDeDatosConfiguracion.marcarCampos();   /* fila 313: lo que viene del Centro de datos no se escribe aquí */
  }

  /* Fila 87, docs/ENLACE-AL-ARTICULO-DE-NORMATIVA.md: solo el texto de
     ayuda del campo, nunca el valor guardado. Se monta desde aquí (el
     campo en sí sigue estático en index.html) para no tocar ningún
     otro fichero. */
  function ayudarConLaDireccionNormativa() {
    var campo = $('plantillas-direccion-normativa');
    if (!campo) return;
    campo.placeholder = 'https://normativa.fmargon.com';
    if ($('plantillas-direccion-normativa-ayuda')) return;
    var ayuda = document.createElement('p');
    ayuda.id = 'plantillas-direccion-normativa-ayuda';
    ayuda.className = 'nota';
    ayuda.textContent = 'Escribe solo eso, sin "/norma" ni el nombre de ningún bloque. Ojo: la ' +
      'red del instituto bloquea las direcciones "vercel.app".';
    campo.parentNode.insertBefore(ayuda, campo.nextSibling);
  }

  async function guardarFirma() {
    var firma = $('plantillas-firma').value;
    var centro = $('plantillas-centro').value.trim() || Plantillas.POR_DEFECTO_CENTRO;
    var localidad = $('plantillas-localidad').value.trim();
    var direccion = $('plantillas-direccion').value.trim();
    var codigo = $('plantillas-codigo').value.trim();
    var cargo = $('plantillas-cargo').value.trim();
    var provincia = $('plantillas-provincia') ? $('plantillas-provincia').value.trim() : datosDeAjustes.provincia;
    var direccionNormativa = $('plantillas-direccion-normativa')
      ? $('plantillas-direccion-normativa').value.trim().replace(/\/$/, '')
      : datosDeAjustes.direccionNormativa;
    try {
      datosDeAjustes = await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.firma = firma;
        actual.centro = centro;
        actual.localidad = localidad;
        actual.direccion = direccion;
        actual.codigo = codigo;
        actual.cargo = cargo;
        actual.provincia = provincia;
        actual.direccionNormativa = direccionNormativa;
        return actual;
      });
      if (window.HitosNormativa) HitosNormativa.refrescar();
      U.aviso('Firma y centro guardados.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  if ($('plantillas-guardar-firma')) $('plantillas-guardar-firma').onclick = guardarFirma;

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

    var lista = (datosDeAjustes ? datosDeAjustes.lista : [])
      .filter(function (p) { return p.tipo === tipo.tipo; })
      .sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });

    contenedor.innerHTML =
      '<p class="explica">Cada plantilla es solo el cuerpo del medio: el saludo y la firma se ' +
      'ponen solos. Sirve igual para el correo y para el mensaje de Séneca. Los huecos entre ' +
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
        centro: (datosDeAjustes && datosDeAjustes.centro) || Plantillas.POR_DEFECTO_CENTRO,
        campos: {}
      };
    }
    return {
      nombre: 'Pérez García, Ana', grupo: '2ºA', curso: U.cursoActual(), tipo: tipo || 'Tipo de ejemplo',
      hoy: hoy, limite: hoy, usuario: App.E.usuario || 'Quien firme',
      centro: (datosDeAjustes && datosDeAjustes.centro) || Plantillas.POR_DEFECTO_CENTRO, campos: {}
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
      '<button type="button" class="boton boton-hueco" id="' + idBoton + '">Insertar hueco</button>' +
      '</div>' +
      '<textarea id="' + idTexto + '" class="campo" rows="' + (filas || 7) + '">' + U.escapar(valor || '') + '</textarea>';
  }

  /* Fila 170 (docs/PLANTILLAS-DEL-COMPANERO.md, parte 2): un segundo
     recuadro, plegado, con el texto propio del mensaje de Séneca (Séneca
     no adjunta ficheros). Vacío, el cuadro de Séneca usa el `texto`. */
  function campoSenecaHTML(prefijo, valor) {
    return '<details class="pl-seneca">' +
      '<summary>Texto para Séneca (opcional)' + (String(valor || '').trim() ? ' · escrito' : '') + '</summary>' +
      '<p class="nota">Si lo escribes, el mensaje de Séneca usa este texto; si no, el de arriba.</p>' +
      campoDeTextoHTML(prefijo + '-texto-seneca', prefijo + '-insertar-hueco-seneca', 'Texto para Séneca', valor || '', 5) +
      '</details>';
  }

  /* La fila de `plantillas.json`: `textoSeneca` solo si trae algo. */
  function filaDePlantilla(id, tipo, categoria, nombre, texto, textoSeneca, adjuntar, previa) {
    var fila = { id: id, tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
    if (previa && previa.fueraDeUso) fila.fueraDeUso = previa.fueraDeUso;   /* fila 321: cambiar una plantilla no pierde la marca */
    if (String(textoSeneca || '').trim()) fila.textoSeneca = textoSeneca;
    if (String(adjuntar || '').trim()) fila.adjuntar = adjuntar;   /* fila 299: «Adjuntar solo» */
    return fila;
  }

  function engancharCampoDeTexto(idTexto, idBoton, otrosCampos) {
    var boton = $(idBoton), campo = $(idTexto);
    if (!boton || !campo) return;
    HuecosBuscador.montar({ boton: boton, campos: (otrosCampos || []).concat([campo]) });
  }

  function abrirCuadroDePlantilla(existente, tipoPreset, alGuardar) {
    var categorias = Nombres.CATEGORIAS;
    var categoriaInicial = (existente && existente.categoria) || (tipoPreset && tipoPreset.categoria) || categorias[0];

    function opcionesTipos(categoria) {
      return opcionesDeCategoria(categoria).map(function (t) {
        var elegido = existente ? existente.tipo === t.tipo : (tipoPreset && tipoPreset.tipo === t.tipo);
        return '<option value="' + U.escapar(t.tipo) + '"' + (elegido ? ' selected' : '') + '>' +
          U.escapar(t.tipo) + '</option>';
      }).join('');
    }

    var cuerpo =
      '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Categoría</label>' +
          '<select id="pl-categoria" class="campo">' +
            categorias.map(function (c) {
              return '<option value="' + c + '"' + (c === categoriaInicial ? ' selected' : '') + '>' + c + '</option>';
            }).join('') +
          '</select></div>' +
        '<div><label class="etiqueta">Tipo de asunto</label>' +
          '<select id="pl-tipo" class="campo">' + opcionesTipos(categoriaInicial) + '</select></div>' +
      '</div>' +
      '<label class="etiqueta">Nombre de la plantilla</label>' +
      '<input id="pl-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      campoDeTextoHTML('pl-texto', 'pl-insertar-hueco', 'Texto', (existente && existente.texto) || '', 7) +
      campoSenecaHTML('pl', existente && existente.textoSeneca) +
      (window.PlantillaAdjuntar ? PlantillaAdjuntar.selectHTML('pl-adjuntar', existente && existente.adjuntar) : '') +
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl-previa"></div></div>';

    var promesa = U.preguntar(existente ? 'Cambiar plantilla' : 'Nueva plantilla', cuerpo,
      existente ? 'Guardar' : 'Crear');

    /* El catálogo de huecos ya no se pinta entero encima del texto:
       un solo botón abre el buscador de js/huecos-buscador.js
       (17-sep-2026, docs/HUECOS-INSERTAR.md). `campos` va en el orden
       del formulario, y el hueco entra en el que tuviera el foco por
       última vez; sin foco previo, al final del último, que es el
       cuadro de texto. La vista previa se repinta sola, porque al
       insertar se lanza un evento `input`. */
    engancharCampoDeTexto('pl-texto', 'pl-insertar-hueco', []);
    engancharCampoDeTexto('pl-texto-seneca', 'pl-insertar-hueco-seneca', []);

    function pintarPrevia() {
      var muestra = datosDeMuestra($('pl-categoria').value, $('pl-tipo').value);
      var r = Plantillas.rellenar($('pl-texto').value, muestra);
      $('pl-previa').textContent = r.texto || '(vacío)';
    }

    $('pl-categoria').onchange = function () {
      $('pl-tipo').innerHTML = opcionesTipos($('pl-categoria').value);
      pintarPrevia();
    };
    $('pl-tipo').onchange = pintarPrevia;
    $('pl-texto').oninput = pintarPrevia;
    pintarPrevia();

    promesa.then(async function (ok) {
      if (!ok) return;
      var nombre = $('pl-nombre').value.trim();
      var tipo = $('pl-tipo').value;
      var categoria = $('pl-categoria').value;
      var texto = $('pl-texto').value;
      var textoSeneca = $('pl-texto-seneca') ? $('pl-texto-seneca').value : '';
      var adjuntar = window.PlantillaAdjuntar ? PlantillaAdjuntar.leer('pl-adjuntar') : '';
      if (!nombre || !tipo || !texto.trim()) {
        U.aviso('Hace falta el nombre, el tipo y el texto.', 'malo');
        return;
      }
      try {
        await Plantillas.guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) actual.lista[i] = filaDePlantilla(existente.id, tipo, categoria, nombre, texto, textoSeneca, adjuntar, actual.lista[i]);
          } else {
            actual.lista.push(filaDePlantilla(Plantillas.idNuevo(), tipo, categoria, nombre, texto, textoSeneca, adjuntar));
          }
          return actual;
        });
        U.aviso(existente ? 'Plantilla guardada.' : 'Plantilla creada.', 'bueno');
        await cargar();
        if (typeof alGuardar === 'function') alGuardar();
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      }
    });
  }

  /* ---------- el editor en línea, dentro del cuadro de Correo o de
     Séneca (25-sep-2026, fila 151, docs/PLANTILLA-DESDE-EL-CUADRO.md)

     A diferencia de `abrirCuadroDePlantilla`, no abre un `U.preguntar`
     (solo hay una capa de diálogo, y ya la está usando el cuadro de
     Correo o de Séneca): se monta dentro de `contenedor`, un bloque
     hermano del formulario del cuadro, que ese mismo fichero esconde y
     vuelve a enseñar. El tipo y la categoría son los del asunto abierto,
     no se preguntan. Reutiliza `campoDeTextoHTML`/`engancharCampoDeTexto`
     (el mismo "Insertar hueco" de arriba); la vista previa usa los datos
     reales del asunto en el que se está, con `Plantillas.valoresDeAsunto`. */

  /* `inicial` (fila 270, js/plantilla-de-lo-escrito.js): { texto, cambios } de
     «Guardar como plantilla nueva»: el texto de partida, la lista de datos
     cambiados por su hueco y la nota de que el saludo y la firma no entran. */
  function cuerpoEditorEnLineaHTML(existente, inicial) {
    return '<label class="etiqueta" style="margin-top:0">Nombre de la plantilla</label>' +
      '<input id="pl2-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      campoDeTextoHTML('pl2-texto', 'pl2-insertar-hueco', 'Texto', inicial ? inicial.texto : ((existente && existente.texto) || ''), 6) +
      (inicial ? '<div id="pl2-cambios"></div>' +
        '<p class="nota">El saludo y la firma no van en la plantilla: la app los pone sola en cada mensaje.</p>' : '') +
      campoSenecaHTML('pl2', existente && existente.textoSeneca) +
      (window.PlantillaAdjuntar ? PlantillaAdjuntar.selectHTML('pl2-adjuntar', existente && existente.adjuntar) : '') +
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl2-previa"></div></div>' +
      '<div id="pl2-aviso"></div>' +
      '<div class="correo-botones" style="margin-top:14px">' +
        '<button type="button" class="boton boton-principal" id="pl2-guardar">Guardar</button>' +
        '<button type="button" class="boton" id="pl2-cancelar">Cancelar</button>' +
      '</div>';
  }

  /* `a`: el asunto abierto (de ahí salen el tipo, la categoría y los
     datos de la vista previa). `existente`: la plantilla a editar, o
     `null` para crear una nueva. `alGuardar(plantillaGuardada)` se
     llama al terminar bien; `alCancelar()`, al pulsar Cancelar. */
  /* La lista «He cambiado estos datos por su hueco» (fila 270): una línea por
     cambio, con «Deshacer» (devuelve el dato en todos los sitios de ese hueco);
     pulsar la línea deja seleccionado el hueco en el texto; si el hueco desaparece
     del texto a mano, su línea desaparece sola. Devuelve el manejador de `input`
     del texto. */
  function montarCambios(cambios, alCambiar) {
    var caja = $('pl2-cambios');
    var vivos = (cambios || []).slice();
    function pintar() {
      if (!caja) return;
      if (!vivos.length) { caja.innerHTML = ''; return; }
      caja.innerHTML = '<p class="nota">He cambiado estos datos por su hueco. Revísalos:</p>';
      vivos.forEach(function (c) {
        var fila = document.createElement('div');
        fila.className = 'pl2-cambio';
        fila.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer';
        var t = document.createElement('span');
        t.textContent = c.dato + ' → ' + c.hueco;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'boton boton-chico'; b.textContent = 'Deshacer';
        b.onclick = function (ev) {
          ev.stopPropagation();
          var campo = $('pl2-texto');
          campo.value = campo.value.split(c.hueco).join(c.dato);
          vivos = vivos.filter(function (x) { return x !== c; });
          pintar();
          alCambiar();
        };
        fila.onclick = function () {
          var campo = $('pl2-texto');
          var i = campo.value.indexOf(c.hueco);
          if (i === -1) return;
          campo.focus();
          campo.setSelectionRange(i, i + c.hueco.length);
        };
        fila.appendChild(t); fila.appendChild(b);
        caja.appendChild(fila);
      });
    }
    pintar();
    return function () {
      var texto = $('pl2-texto').value;
      var antes = vivos.length;
      vivos = vivos.filter(function (c) { return texto.indexOf(c.hueco) !== -1; });
      if (vivos.length !== antes) pintar();
      alCambiar();
    };
  }

  function montarEditorEnLinea(contenedor, a, existente, alGuardar, alCancelar, inicial) {
    contenedor.innerHTML = cuerpoEditorEnLineaHTML(existente, inicial);
    engancharCampoDeTexto('pl2-texto', 'pl2-insertar-hueco', []);
    engancharCampoDeTexto('pl2-texto-seneca', 'pl2-insertar-hueco-seneca', []);

    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';

    /* Con el cuadro abierto desde un hito, la vista previa lleva también el hito (fila 270). */
    var hitoDelCuadro = (window.CorreoNucleo && CorreoNucleo._interno && CorreoNucleo._interno.hitoActual) || undefined;
    function pintarPrevia() {
      Plantillas.valoresDeAsunto(a, hitoDelCuadro ? { hito: hitoDelCuadro } : undefined).then(function (valores) {
        var r = Plantillas.rellenar($('pl2-texto').value, valores || {});
        if ($('pl2-previa')) $('pl2-previa').textContent = r.texto || '(vacío)';
      }).catch(function () { if ($('pl2-previa')) $('pl2-previa').textContent = '(vacío)'; });
    }
    var alCambiarTexto = pintarPrevia;
    if (inicial) alCambiarTexto = montarCambios(inicial.cambios, pintarPrevia);
    $('pl2-texto').oninput = alCambiarTexto;
    pintarPrevia();
    if (inicial) $('pl2-nombre').focus();

    $('pl2-cancelar').onclick = function () { if (typeof alCancelar === 'function') alCancelar(); };
    $('pl2-guardar').onclick = async function () {
      var nombre = $('pl2-nombre').value.trim();
      var texto = $('pl2-texto').value;
      var textoSeneca = $('pl2-texto-seneca') ? $('pl2-texto-seneca').value : '';
      var adjuntar2 = window.PlantillaAdjuntar ? PlantillaAdjuntar.leer('pl2-adjuntar') : '';
      if (!nombre || !texto.trim()) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">Hace falta el nombre y el texto.</p>';
        return;
      }
      /* Fila 270: no dos plantillas con el mismo nombre en un tipo de asunto. */
      var yaEsta = ((Plantillas.enMemoria() || {}).lista || []).some(function (x) {
        return (!existente || x.id !== existente.id) && x.categoria === categoria &&
          U.normalizar(x.tipo || '') === U.normalizar(tipo) && U.normalizar(x.nombre || '') === U.normalizar(nombre);
      });
      if (yaEsta) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">Ya hay una plantilla con ese nombre en este tipo de asunto.</p>';
        return;
      }
      try {
        var guardada = null;
        await Plantillas.guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) {
              actual.lista[i] = filaDePlantilla(existente.id, tipo, categoria, nombre, texto, textoSeneca, adjuntar2, actual.lista[i]);
              guardada = actual.lista[i];
            }
          } else {
            guardada = filaDePlantilla(Plantillas.idNuevo(), tipo, categoria, nombre, texto, textoSeneca, adjuntar2);
            actual.lista.push(guardada);
          }
          return actual;
        });
        await cargar();
        if (typeof alGuardar === 'function') alGuardar(guardada);
      } catch (e) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">No he podido guardarlo: ' + U.escapar(U.mensajeDeError(e)) + '</p>';
      }
    };
  }

  /* ==========================================================
     ENGANCHE
     ========================================================== */

  function enganchar() {
    ayudarConLaDireccionNormativa();
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
    abrirCuadroDePlantilla: abrirCuadroDePlantilla,
    campoDeTextoHTML: campoDeTextoHTML,
    engancharCampoDeTexto: engancharCampoDeTexto,
    /* Fila 151: el editor de plantilla dentro del cuadro de Correo o de
       Séneca, sin U.preguntar. */
    montarEditorEnLinea: montarEditorEnLinea
  };

})();
