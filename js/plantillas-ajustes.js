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

  function tarjetaDePlantilla(p) {
    var div = document.createElement('div');
    div.className = 'tarjeta-tipo';
    div.innerHTML = '<div class="nombre-tipo">' + U.escapar(p.nombre) + '</div>';

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.style.marginTop = '8px';

    var editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'boton';
    editar.textContent = 'Editar';
    editar.onclick = function () { abrirCuadroDePlantilla(p, null, refrescarSeccionActual); };
    acciones.appendChild(editar);

    acciones.appendChild(Papelera.botonBorrar(async function () {
      var ok = await Papelera.preguntarBorrar(p.nombre);
      if (!ok) return;
      try {
        await Papelera.mandarDato('plantilla', p.nombre, { categoria: p.categoria, tipo: p.tipo }, { plantilla: p });
        await Plantillas.guardar(App.E.gestor, function (actual) {
          actual.lista = actual.lista.filter(function (x) { return x.id !== p.id; });
          return actual;
        });
        U.aviso('Plantilla mandada a la papelera.', 'bueno');
        await cargar();
        refrescarSeccionActual();
      } catch (e) {
        U.aviso('No he podido borrarla: ' + U.mensajeDeError(e), 'malo');
      }
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
     60, docs/COMUNICAR-DESDE-EL-HITO.md, 4): lo que hasta hoy solo
     montaba el cuadro de una plantilla, ahora también lo usa la
     sección "Comunicación de este paso" del editor de un paso de la
     guía (js/guias-comunicacion.js), con sus propios ids. `otrosCampos`
     son campos adicionales (por ejemplo, el de asunto) que también
     pueden recibir el hueco desde el mismo botón. */
  function campoDeTextoHTML(idTexto, idBoton, etiqueta, valor, filas) {
    return '<div class="etiqueta-con-boton">' +
      '<label class="etiqueta">' + U.escapar(etiqueta) + '</label>' +
      '<button type="button" class="boton boton-hueco" id="' + idBoton + '">Insertar hueco</button>' +
      '</div>' +
      '<textarea id="' + idTexto + '" class="campo" rows="' + (filas || 7) + '">' + U.escapar(valor || '') + '</textarea>';
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
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl-previa"></div></div>';

    var promesa = U.preguntar(existente ? 'Editar plantilla' : 'Nueva plantilla', cuerpo,
      existente ? 'Guardar' : 'Crear');

    /* El catálogo de huecos ya no se pinta entero encima del texto:
       un solo botón abre el buscador de js/huecos-buscador.js
       (17-sep-2026, docs/HUECOS-INSERTAR.md). `campos` va en el orden
       del formulario, y el hueco entra en el que tuviera el foco por
       última vez; sin foco previo, al final del último, que es el
       cuadro de texto. La vista previa se repinta sola, porque al
       insertar se lanza un evento `input`. */
    engancharCampoDeTexto('pl-texto', 'pl-insertar-hueco', []);

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
      if (!nombre || !tipo || !texto.trim()) {
        U.aviso('Hace falta el nombre, el tipo y el texto.', 'malo');
        return;
      }
      try {
        await Plantillas.guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) actual.lista[i] = { id: existente.id, tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
          } else {
            actual.lista.push({ id: Plantillas.idNuevo(), tipo: tipo, categoria: categoria, nombre: nombre, texto: texto });
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

  function cuerpoEditorEnLineaHTML(existente) {
    return '<label class="etiqueta" style="margin-top:0">Nombre de la plantilla</label>' +
      '<input id="pl2-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      campoDeTextoHTML('pl2-texto', 'pl2-insertar-hueco', 'Texto', (existente && existente.texto) || '', 6) +
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
  function montarEditorEnLinea(contenedor, a, existente, alGuardar, alCancelar) {
    contenedor.innerHTML = cuerpoEditorEnLineaHTML(existente);
    engancharCampoDeTexto('pl2-texto', 'pl2-insertar-hueco', []);

    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';

    function pintarPrevia() {
      Plantillas.valoresDeAsunto(a).then(function (valores) {
        var r = Plantillas.rellenar($('pl2-texto').value, valores || {});
        if ($('pl2-previa')) $('pl2-previa').textContent = r.texto || '(vacío)';
      }).catch(function () { if ($('pl2-previa')) $('pl2-previa').textContent = '(vacío)'; });
    }
    $('pl2-texto').oninput = pintarPrevia;
    pintarPrevia();

    $('pl2-cancelar').onclick = function () { if (typeof alCancelar === 'function') alCancelar(); };
    $('pl2-guardar').onclick = async function () {
      var nombre = $('pl2-nombre').value.trim();
      var texto = $('pl2-texto').value;
      if (!nombre || !texto.trim()) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">Hace falta el nombre y el texto.</p>';
        return;
      }
      try {
        var guardada = null;
        await Plantillas.guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) {
              actual.lista[i] = { id: existente.id, tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
              guardada = actual.lista[i];
            }
          } else {
            guardada = { id: Plantillas.idNuevo(), tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
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
    /* Para "Comunicación de este paso" (js/guias-comunicacion.js, fila
       60): el mismo campo de texto con "Insertar hueco" de aquí. */
    campoDeTextoHTML: campoDeTextoHTML,
    engancharCampoDeTexto: engancharCampoDeTexto,
    /* Fila 151: el editor de plantilla dentro del cuadro de Correo o de
       Séneca, sin U.preguntar. */
    montarEditorEnLinea: montarEditorEnLinea
  };

})();
