/* ============================================================
   documentos.js — los documentos que van dentro de la carpeta
   de un asunto.

   Dos caminos, y los dos acaban con el fichero bien nombrado:

     - Añadir documento: se busca donde esté (Descargas, el
       escritorio, un pendrive) y la aplicación GUARDA UNA COPIA
       en la carpeta del asunto, ya con el nombre montado. El
       original no se toca: el navegador no puede borrar nada
       fuera de las dos carpetas señaladas.

     - Poner nombre: para los que ya están dentro de la carpeta,
       porque han llegado por otro camino. Ese sí se renombra en
       el sitio, y es instantáneo.

   En los dos casos el documento se ve a la izquierda mientras se
   rellenan los campos, para poder leer la fecha de la factura o el
   sello del registro sin abrir nada aparte. Se enseña a todo el
   ancho de su columna, y con el botón "Ver más grande" ocupa
   toda la ventana.

   Si el tipo de documento que hace falta no está en la lista, se crea
   aquí mismo, sin salir del cuadro. Antes de crearlo se mira si ya hay
   uno que se le parezca aunque esté escrito de otra manera: mayúsculas,
   tildes, espacios, guiones, puntos o el plural. Así la lista no se
   llena de dos nombres para la misma cosa.
   ============================================================ */
var Documentos = (function () {

  var ctx = {
    tipos: function () { return []; },
    curso: function () { return ''; },
    crearTipo: null            /* lo pone nucleo.js: guarda el tipo nuevo en _GESTOR */
  };
  var asuntoActual = null;
  var urlVisor = null;   /* la dirección temporal del documento que se está viendo */

  function configurar(o) { ctx = o; }

  function $(id) { return document.getElementById(id); }

  /* ---------- el cuadro ---------- */

  /* Desde un hito (fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md): los
     nombres que se siguen en esta apertura del cuadro. Cada documento
     que se añade entra; uno que se renombra cambia su nombre aquí.
     Al cerrar el cuadro, `abrir` los devuelve para que el hito los
     apunte (js/hitos-anadir.js): este fichero no sabe nada de hitos. */
  var seguidos = null;

  /* `opciones` (fila 103), solo desde un hito:
       { anadir: fichero }  → abre directamente el formulario de
                             "Añadir documento" con ese fichero ya elegido;
       { nombre: 'x.pdf' }  → abre directamente "Poner nombre" de un
                             documento que ya está en la carpeta.
     Devuelve la lista de nombres seguidos (vacía sin opciones). */
  async function abrir(asunto, opciones) {
    asuntoActual = asunto;
    seguidos = opciones ? (opciones.nombre ? [opciones.nombre] : []) : null;
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-ancho');
    var esperar = U.preguntar(asunto.nombre, '<div id="doc-cuerpo"></div>', 'Cerrar', true);
    if (opciones && opciones.anadir) {
      pintarFormulario({ modo: 'anadir', handle: opciones.anadir, nombreActual: opciones.anadir.name });
    } else if (opciones && opciones.nombre) {
      pintarFormulario({ modo: 'renombrar', nombreActual: opciones.nombre });
    } else {
      await pintarLista();
    }
    await esperar;
    soltarVisor();
    cuadro.classList.remove('cuadro-ancho');
    var salida = seguidos || [];
    seguidos = null;
    return salida;
  }

  /* Pura, para las pruebas (fila 103): cómo cambia la lista de seguidos
     al guardar. */
  function seguirGuardado(lista, modo, nombreActual, nombreNuevo) {
    var salida = (lista || []).slice();
    if (modo === 'anadir') {
      if (salida.indexOf(nombreNuevo) === -1) salida.push(nombreNuevo);
      return salida;
    }
    var i = salida.indexOf(nombreActual);
    if (i !== -1) salida[i] = nombreNuevo;
    return salida;
  }

  /* El navegador guarda en memoria el documento que enseña hasta que se
     le dice que ya no hace falta. */
  function soltarVisor() {
    if (urlVisor) { URL.revokeObjectURL(urlVisor); urlVisor = null; }
  }

  /* Qué se puede enseñar. Los PDF y las imágenes los pinta el navegador
     por su cuenta; un Word o un Excel no sabe. */
  function visorDe(fichero, nombre) {
    soltarVisor();
    var ext = Nombres.extensionDe(nombre);
    var tipo = fichero.type || '';
    if (tipo === 'application/pdf' || ext === 'pdf') {
      urlVisor = URL.createObjectURL(fichero);
      /* Sin la barra de Chrome: enseña el nombre interno del fichero, que no
         dice nada, y roba sitio a la página. Se sigue pudiendo desplazar y
         hacer zoom con Ctrl y la rueda. */
      return '<iframe id="doc-visor" src="' + urlVisor +
             '#toolbar=0&navpanes=0&view=FitH" title="Documento"></iframe>';
    }
    if (tipo.indexOf('image/') === 0 || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].indexOf(ext) !== -1) {
      urlVisor = URL.createObjectURL(fichero);
      return '<img id="doc-visor" src="' + urlVisor + '" alt="Documento">';
    }
    return '<p class="explica" id="doc-sin-visor">Este tipo de fichero no se puede ver aquí. ' +
           'El navegador solo sabe enseñar PDF e imágenes.<br>' +
           'Ponle el nombre igual: lo de la derecha funciona lo mismo.</p>';
  }

  async function pintarLista() {
    var caja = $('doc-cuerpo');
    if (!caja) return;
    var lista = await Carpetas.ficheros(asuntoActual.handle);

    var html = '<p class="explica">' +
      (lista.length ? 'Los documentos guardados en esta carpeta.'
                    : 'La carpeta todavía está vacía.') + '</p>';

    if (lista.length) {
      html += '<div class="lista-documentos">' + lista.map(function (f, i) {
        var pendiente = Registro.pendiente(asuntoActual, f.nombre);
        var sinRegistro = !Registro.tieneRegistro(f.nombre);
        return '<div class="fila-documento">' +
                 '<span class="nombre-documento">' + U.escapar(f.nombre) + '</span>' +
                 (pendiente ? '<span class="marca-sin-registrar">Sin registrar</span>' : '') +
                 '<button type="button" class="boton" data-copiar="' + i + '" ' +
                   'title="Copiar el nombre del documento, sin la extensión">Copiar nombre</button>' +
                 '<button type="button" class="boton" data-renombrar="' + i + '">Poner nombre</button>' +
                 (sinRegistro ? '<button type="button" class="boton' + (pendiente ? ' boton-ambar' : '') +
                   '" data-registrar="' + i + '" title="Dar registro de entrada o salida a este documento">' +
                   'Registrar</button>' : '') +
                 '<button type="button" class="boton boton-peligro" data-borrar="' + i +
                   '" style="margin-left:auto">Borrar</button>' +
               '</div>';
      }).join('') + '</div>';
    }

    html += '<button type="button" class="boton boton-principal boton-ancho" id="doc-anadir">' +
            'Añadir documento</button>';

    caja.innerHTML = html;

    /* El nombre, sin la extensión, para pegarlo en el registro de Séneca
       o en un correo. */
    Array.prototype.forEach.call(caja.querySelectorAll('[data-copiar]'), function (b) {
      b.onclick = function () {
        var f = lista[Number(b.dataset.copiar)];
        var sinExtension = String(f.nombre).replace(/\.[A-Za-z0-9]{1,8}$/, '');
        U.copiar(sinExtension, b);
      };
    });

    Array.prototype.forEach.call(caja.querySelectorAll('[data-renombrar]'), function (b) {
      b.onclick = function () {
        var f = lista[Number(b.dataset.renombrar)];
        pintarFormulario({ modo: 'renombrar', nombreActual: f.nombre });
      };
    });

    /* Pulsar la fila del documento lo enseña igual que "Poner nombre":
       es el visor que tiene este cuadro (17-sep-2026, fila 86). Los
       botones de la propia fila siguen haciendo lo suyo. */
    Array.prototype.forEach.call(caja.querySelectorAll('.fila-documento'), function (fila, i) {
      fila.style.cursor = 'pointer';
      fila.title = 'Pulsa para verlo';
      fila.onclick = function (ev) {
        if (ev.target.closest('button, a, input, select, textarea, label')) return;
        pintarFormulario({ modo: 'renombrar', nombreActual: lista[i].nombre });
      };
    });

    Array.prototype.forEach.call(caja.querySelectorAll('[data-registrar]'), function (b) {
      b.onclick = async function () {
        var f = lista[Number(b.dataset.registrar)];
        await Registro.pintarEnContenedor(caja, asuntoActual, f.nombre, function () { pintarLista(); });
      };
    });

    Array.prototype.forEach.call(caja.querySelectorAll('[data-borrar]'), function (b) {
      b.onclick = async function () {
        var f = lista[Number(b.dataset.borrar)];
        if (!window.Papelera) return;
        var ok = await window.Papelera.preguntarBorrar(f.nombre);
        if (!ok) return;
        b.disabled = true;
        try {
          await Papelera.mandarDocumentoDeAsunto(asuntoActual, f.nombre);
          U.aviso('Documento mandado a la papelera.', 'bueno');
          await pintarLista();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
          b.disabled = false;
        }
      };
    });

    $('doc-anadir').onclick = async function () {
      try {
        var handle = await Carpetas.elegirFichero(asuntoActual.handle);
        pintarFormulario({ modo: 'anadir', handle: handle, nombreActual: handle.name });
      } catch (e) {
        if (e.name !== 'AbortError') U.aviso('No he podido abrir ese fichero: ' + U.mensajeDeError(e), 'malo');
      }
    };
  }

  /* ---------- el formulario del nombre ---------- */

  var ultimasOpciones = null;
  var ultimoTipo = '';       /* el tipo elegido antes de abrir el cuadro de crear uno */

  /* El valor de la opción que abre el cuadro de crear un tipo nuevo.
     No es un tipo: son dos guiones bajos a cada lado para que no pueda
     coincidir nunca con uno de verdad. */
  var TIPO_NUEVO = '__nuevo__';

  async function pintarFormulario(opciones) {
    var caja = $('doc-cuerpo');
    if (!caja) return;
    ultimasOpciones = opciones;   /* lo usa la vista previa */

    /* El documento, para poder verlo mientras se le pone el nombre. */
    var fichero = null;
    try {
      var h = opciones.handle ||
              await asuntoActual.handle.getFileHandle(opciones.nombreActual);
      fichero = await h.getFile();
    } catch (e) { fichero = null; }
    var visor = fichero ? visorDe(fichero, opciones.nombreActual)
                        : '<p class="explica">No he podido abrir el documento para verlo.</p>';

    var previo = leerNombre(opciones.nombreActual);
    var hoy = U.hoyIso();
    var fecha = previo.fecha || hoy;
    /* El hueco de texto libre del nombre. Antes se llamaba "Año
       académico" y se rellenaba solo con el curso que tocaba por la
       fecha. Él lo usa para otras cosas —un número de expediente, una
       referencia de la factura— y ese relleno automático estorbaba:
       había que borrarlo cada vez. Desde el 10-sep-2026 se llama
       **Texto adicional**, nace vacío y no depende de ningún otro
       campo. Lo único que se conserva es lo que ya trajera el nombre
       del propio fichero. */
    var curso = previo.curso || '';
    /* Los campos del tipo de documento (fila 96): los de lista que ya
       estén, tal cual, al principio del texto adicional se reconocen y
       salen de ahí; el resto se queda como texto adicional. */
    var valoresIniciales = {};
    var camposIniciales = camposDelTipo(previo.tipo);
    if (camposIniciales.length) {
      var rec = DocCampos.reconocer(camposIniciales, curso);
      valoresIniciales = rec.valores;
      curso = rec.resto;
    }
    /* Solo se ofrece cuando ya está en la carpeta: un documento que se
       acaba de añadir todavía no puede estar "pendiente" de nada. */
    var pendienteInicial = opciones.modo === 'renombrar' &&
      Registro.pendiente(asuntoActual, opciones.nombreActual);

    caja.innerHTML =
      '<div class="doc-partido">' +

      '<div>' +
        '<div class="visor-barra">' +
          '<button type="button" class="boton" id="doc-ampliar">Ver más grande</button>' +
        '</div>' +
        '<div class="visor">' + visor + '</div>' +
      '</div>' +

      '<div class="doc-campos">' +

      '<p class="explica">' +
        (opciones.modo === 'anadir'
          ? 'Se guardará una copia en la carpeta del asunto. El original se queda donde está.'
          : 'Se le cambia el nombre al fichero que ya está en la carpeta.') +
        '<br><span class="suave">Fichero: ' + U.escapar(opciones.nombreActual) + '</span></p>' +

      '<div class="dos-columnas">' +
        '<div>' +
          '<label class="etiqueta">Fecha del documento</label>' +
          '<input type="date" id="doc-fecha" class="campo" value="' + fecha + '">' +
          '<p class="nota">La que trae el documento, no la de hoy.</p>' +
        '</div>' +
        '<div>' +
          '<label class="etiqueta">Texto adicional <span class="suave">(opcional)</span></label>' +
          '<input id="doc-curso" class="campo" value="' + U.escapar(curso) + '">' +
          '<p class="nota">Lo que quieras añadir al nombre: el curso, una referencia…</p>' +
        '</div>' +
      '</div>' +

      '<label class="etiqueta">Tipo de documento</label>' +
      '<select id="doc-tipo" class="campo">' + opcionesDeTipo(previo.tipo) + '</select>' +
      '<div id="doc-campos-tipo"></div>' +

      '<label class="interruptor">' +
        '<input type="checkbox" id="doc-hay-registro"' + (previo.registro ? ' checked' : '') + '>' +
        '<span>Está registrado en Séneca</span>' +
      '</label>' +

      '<label class="interruptor' + (previo.registro ? ' oculto' : '') + '" id="doc-fila-pendiente">' +
        '<input type="checkbox" id="doc-pendiente-registro"' +
          (pendienteInicial ? ' checked' : '') + '>' +
        '<span>Pendiente de registro</span>' +
      '</label>' +

      '<div id="doc-registro" class="' + (previo.registro ? '' : 'oculto') + '">' +
        '<div class="registro-campos">' +
          '<div>' +
            '<label class="etiqueta">Año</label>' +
            '<input id="doc-ano" class="campo" maxlength="2" value="' +
              U.escapar(previo.registro ? previo.registro.ano : fecha.slice(2, 4)) + '">' +
          '</div>' +
          '<div>' +
            '<label class="etiqueta">Entrada o salida</label>' +
            '<div class="opciones">' +
              botonOpcion('doc-sentido', 'E', 'Entrada', !previo.registro || previo.registro.sentido !== 'S') +
              botonOpcion('doc-sentido', 'S', 'Salida', !!previo.registro && previo.registro.sentido === 'S') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label class="etiqueta">Serie</label>' +
            '<div class="opciones">' +
              botonOpcion('doc-modo', 'M', 'Manual', !previo.registro || previo.registro.modo !== 'A') +
              botonOpcion('doc-modo', 'A', 'Automático', !!previo.registro && previo.registro.modo === 'A') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label class="etiqueta">Número</label>' +
            '<input id="doc-numero" class="campo" maxlength="6" inputmode="numeric" value="' +
              U.escapar(previo.registro ? previo.registro.numero : '') + '">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="vista-previa">' +
        '<div class="vista-rotulo">Se guardará así</div>' +
        '<div id="doc-vista" class="vista-nombre"></div>' +
      '</div>' +

      '<div class="cuadro-botones">' +
        '<button type="button" class="boton" id="doc-volver">Volver</button>' +
        '<button type="button" class="boton boton-principal" id="doc-guardar">Guardar</button>' +
      '</div>' +

      '</div></div>';

    /* La última opción de la lista de tipos no es un tipo: abre el cuadro
       de crear uno. Se engancha antes que el refresco general para que la
       vista previa no llegue a enseñar el nombre postizo. */
    ultimoTipo = $('doc-tipo').value;
    pintarCamposDelTipo(valoresIniciales);
    $('doc-tipo').addEventListener('change', function () {
      var sel = $('doc-tipo');
      if (sel.value !== TIPO_NUEVO) { ultimoTipo = sel.value; pintarCamposDelTipo(); return; }
      sel.value = ultimoTipo || (ctx.tipos()[0] || '');
      abrirCuadroDeTipoNuevo();
    });

    /* refrescar la vista previa con cualquier cambio */
    Array.prototype.forEach.call(caja.querySelectorAll('input, select'), function (c) {
      c.oninput = refrescar;
      c.onchange = refrescar;
    });
    /* La fecha ya no toca el texto adicional: son dos campos
       independientes, y escribir en uno no puede pisar el otro. */
    $('doc-hay-registro').onchange = function () {
      var hay = $('doc-hay-registro').checked;
      $('doc-registro').classList.toggle('oculto', !hay);
      $('doc-fila-pendiente').classList.toggle('oculto', hay);
      refrescar();
    };

    /* Esconde los campos para que el documento ocupe toda la ventana. */
    $('doc-ampliar').onclick = function () {
      var partido = caja.querySelector('.doc-partido');
      var ampliado = partido.classList.toggle('solo-visor');
      $('doc-ampliar').textContent = ampliado ? 'Volver a los campos' : 'Ver más grande';
    };

    $('doc-volver').onclick = function () { soltarVisor(); pintarLista(); };
    $('doc-guardar').onclick = function () {
      return U.mientrasGuarda($('doc-guardar'), function () { return guardar(opciones); });
    };
    refrescar();
  }

  /* ---------- los campos del tipo de documento (fila 96) ---------- */

  function camposDelTipo(tipo) {
    return (window.DocCampos && tipo && tipo !== TIPO_NUEVO) ? DocCampos.campos(tipo) : [];
  }

  function tipoElegido() {
    var sel = $('doc-tipo');
    var tipo = sel ? sel.value : '';
    return tipo === TIPO_NUEVO ? (ultimoTipo || '') : tipo;
  }

  /* Pinta los campos del tipo elegido. Sin `valores`, conserva lo ya
     escrito en los que se repiten (mismo id). */
  function pintarCamposDelTipo(valores) {
    var caja = $('doc-campos-tipo');
    if (!caja || !window.DocCampos) return;
    var antes = valores || DocCampos.leerDe(caja);
    DocCampos.pintar(caja, camposDelTipo(tipoElegido()), antes);
    Array.prototype.forEach.call(caja.querySelectorAll('input, select'), function (c) {
      c.oninput = refrescar;
      c.onchange = refrescar;
    });
    refrescar();
  }

  function valoresDeCampos() {
    return window.DocCampos ? DocCampos.leerDe($('doc-campos-tipo')) : {};
  }

  /* ---------- la lista de tipos de documento ---------- */

  function opcionesDeTipo(elegido) {
    return ctx.tipos().map(function (t) {
      return '<option value="' + U.escapar(t) + '"' +
             (U.normalizar(t) === U.normalizar(elegido) ? ' selected' : '') + '>' +
             U.escapar(t) + '</option>';
    }).join('') +
    '<option value="' + TIPO_NUEVO + '">+  Crear un tipo nuevo…</option>';
  }

  /* ---------- crear un tipo sin salir del cuadro ----------

     La comparación de nombres parecidos vive en util.js, porque la usan
     también las listas de Ajustes: aquí solo se pinta el resultado. */

  function parecidos(nombre, lista) {
    return U.parecidos(nombre, lista);
  }

  function cerrarCuadroDeTipoNuevo() {
    var caja = $('doc-tipo-nuevo');
    if (caja) caja.parentNode.removeChild(caja);
  }

  function abrirCuadroDeTipoNuevo() {
    var sel = $('doc-tipo');
    if (!sel || $('doc-tipo-nuevo')) return;

    var caja = document.createElement('div');
    caja.id = 'doc-tipo-nuevo';
    caja.style.cssText = 'margin:8px 0 4px;padding:10px 12px;border:1px solid #d7dee6;' +
                         'border-radius:8px;background:#f7f9fb';
    caja.innerHTML =
      '<label class="etiqueta">Nombre del tipo nuevo</label>' +
      '<input id="doc-tipo-nombre" class="campo" autocomplete="off" ' +
        'placeholder="Por ejemplo: DILIGENCIA">' +
      '<div id="doc-tipo-aviso" class="nota"></div>' +
      '<div id="doc-tipo-botones" style="display:flex;gap:8px;justify-content:flex-end;' +
        'margin-top:8px">' +
        '<button type="button" class="boton" id="doc-tipo-cancelar">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="doc-tipo-crear">Crear y usar</button>' +
      '</div>';
    sel.parentNode.insertBefore(caja, sel.nextSibling);

    $('doc-tipo-nombre').oninput = pintarAvisoDeTipo;
    $('doc-tipo-nombre').onkeydown = function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); crearYUsarTipo(); }
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrarCuadroDeTipoNuevo(); }
    };
    $('doc-tipo-cancelar').onclick = cerrarCuadroDeTipoNuevo;
    $('doc-tipo-crear').onclick = crearYUsarTipo;
    pintarAvisoDeTipo();
    $('doc-tipo-nombre').focus();
  }

  function usarTipoDeLaLista(tipo) {
    var sel = $('doc-tipo');
    sel.value = tipo;
    ultimoTipo = tipo;
    cerrarCuadroDeTipoNuevo();
    pintarCamposDelTipo();
  }

  /* El aviso que va debajo del campo. Dice una de tres cosas: que el
     tipo ya existe, que hay otros que se le parecen, o que se va a
     crear. Los parecidos salen como botones: pulsarlos usa el que ya
     está, que es lo que se quiere casi siempre. */
  function pintarAvisoDeTipo() {
    var campo = $('doc-tipo-nombre');
    var aviso = $('doc-tipo-aviso');
    var crear = $('doc-tipo-crear');
    if (!campo || !aviso || !crear) return;

    var limpio = U.limpiarNombre(campo.value).toUpperCase();
    aviso.innerHTML = '';

    function decir(texto) {
      var p = document.createElement('div');
      p.textContent = texto;
      aviso.appendChild(p);
    }

    function botonUsar(tipo) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.style.margin = '6px 6px 0 0';
      b.textContent = 'Usar ' + tipo;
      b.onclick = function () { usarTipoDeLaLista(tipo); };
      aviso.appendChild(b);
    }

    if (!limpio) {
      crear.disabled = true;
      decir('Escribe el nombre del tipo.');
      return;
    }

    var lista = parecidos(limpio, ctx.tipos());
    var mismo = lista.filter(function (p) { return p.igual; })[0];

    if (mismo) {
      crear.disabled = true;
      decir('Ese tipo ya está en la lista, escrito así: ' + mismo.nombre + '.');
      botonUsar(mismo.nombre);
      return;
    }

    crear.disabled = false;
    if (lista.length) {
      decir('Ojo, hay tipos que se le parecen. Si es el mismo, usa el que ya está:');
      lista.slice(0, 4).forEach(function (p) { botonUsar(p.nombre); });
    } else {
      decir('Se creará ' + limpio + ', y queda en la lista del centro para todos.');
    }
  }

  async function crearYUsarTipo() {
    var campo = $('doc-tipo-nombre');
    if (!campo) return;
    var limpio = U.limpiarNombre(campo.value).toUpperCase();
    if (!limpio) return;
    if (typeof ctx.crearTipo !== 'function') {
      U.aviso('Desde aquí no se pueden crear tipos. Se crean en Ajustes.', 'malo');
      return;
    }
    try {
      await ctx.crearTipo(limpio);
      var sel = $('doc-tipo');
      sel.innerHTML = opcionesDeTipo(limpio);
      sel.value = limpio;
      ultimoTipo = limpio;
      cerrarCuadroDeTipoNuevo();
      pintarCamposDelTipo();
      U.aviso('Tipo de documento ' + limpio + ' añadido a la lista del centro.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  function botonOpcion(grupo, valor, texto, marcado) {
    return '<label class="opcion"><input type="radio" name="' + grupo + '" value="' + valor + '"' +
           (marcado ? ' checked' : '') + '><span>' + texto + '</span></label>';
  }

  function elegido(grupo) {
    var m = document.querySelector('input[name="' + grupo + '"]:checked');
    return m ? m.value : '';
  }

  function datosDelFormulario(opciones) {
    var registro = null;
    if ($('doc-hay-registro').checked) {
      registro = {
        ano: $('doc-ano').value.trim(),
        sentido: elegido('doc-sentido'),
        modo: elegido('doc-modo'),
        numero: $('doc-numero').value.trim()
      };
    }
    var tipo = $('doc-tipo').value;
    if (tipo === TIPO_NUEVO) tipo = ultimoTipo || '';
    return {
      fecha: $('doc-fecha').value,
      codigo: Nombres.codigoRegistro(registro),
      tipo: tipo,
      campos: window.DocCampos ? DocCampos.enOrden(camposDelTipo(tipo), valoresDeCampos()) : [],
      curso: $('doc-curso').value.trim(),
      extension: Nombres.extensionDe(opciones.nombreActual)
    };
  }

  function refrescar() {
    if (!$('doc-vista') || !ultimasOpciones) return;
    var nombre = Nombres.montarDocumento(datosDelFormulario(ultimasOpciones));
    $('doc-vista').textContent = nombre;
    $('doc-guardar').disabled = nombre.length < 10;
  }

  /* La lista de "pendientesRegistro" vive en la ficha del asunto, no
     en el nombre del fichero. Un documento con registro nunca puede
     estar pendiente: si se marca "Está registrado en Séneca" aquí
     mismo, la casilla de pendiente queda oculta y no cuenta. Al
     renombrar, si el documento seguía en la lista se actualiza al
     nombre nuevo. */
  async function actualizarPendiente(opciones, nombreNuevo) {
    var marcado = !$('doc-hay-registro').checked &&
      !!($('doc-pendiente-registro') && $('doc-pendiente-registro').checked);
    var lista = (asuntoActual.ficha && asuntoActual.ficha.pendientesRegistro) || [];
    var sinElAntiguo = lista.filter(function (n) { return n !== opciones.nombreActual; });
    var final = marcado ? sinElAntiguo.concat([nombreNuevo]) : sinElAntiguo;
    var igual = final.length === lista.length &&
      final.slice().sort().join('\n') === lista.slice().sort().join('\n');
    if (igual) return;
    await App.anotar(asuntoActual.nombre, { pendientesRegistro: final });
  }

  async function guardar(opciones) {
    /* Un campo obligatorio del tipo de documento, vacío: no se guarda
       (fila 96), con el mismo aviso que al crear un asunto. */
    var falta = window.DocCampos ? DocCampos.faltaObligatorio(camposDelTipo(tipoElegido()), valoresDeCampos()) : '';
    if (falta) { U.aviso('Hace falta rellenar "' + falta + '".', 'malo'); return; }
    var nombre = Nombres.montarDocumento(datosDelFormulario(opciones));
    if (!nombre) return;
    try {
      var yaEsta = await Carpetas.ficheros(asuntoActual.handle);
      var repetido = yaEsta.some(function (f) {
        return f.nombre === nombre && f.nombre !== opciones.nombreActual;
      });
      if (repetido) {
        U.aviso('Ya hay un documento con ese nombre en la carpeta.', 'malo');
        return;
      }
      if (opciones.modo === 'anadir') {
        await Carpetas.copiarFicheroEn(asuntoActual.handle, opciones.handle, nombre);
        U.aviso('Documento guardado en la carpeta.', 'bueno');
      } else {
        await Carpetas.renombrarFichero(asuntoActual.handle, opciones.nombreActual, nombre);
        U.aviso('Documento renombrado.', 'bueno');
      }
      if (seguidos) seguidos = seguirGuardado(seguidos, opciones.modo, opciones.nombreActual, nombre);
    } catch (e) {
      U.fallo('No he podido guardarlo', e);
      return;
    }
    /* El documento ya está en la carpeta con su nombre: lo de después
       es accesorio, y si falla, ámbar (fila 100). */
    try {
      await actualizarPendiente(opciones, nombre);
    } catch (e2) {
      U.accesorio('Documento guardado, pero no he podido apuntar si está pendiente de registro', e2);
    }
    soltarVisor();
    try { await pintarLista(); } catch (e3) { U.accesorio('Documento guardado, pero no he podido repintar la lista', e3); }
  }

  /* Lee un nombre de documento que ya siga la norma, para rellenar el
     formulario con lo que se pueda aprovechar. */
  function leerNombre(nombre) {
    var salida = { fecha: '', registro: null, tipo: '', curso: '' };
    var sinExtension = String(nombre || '').replace(/\.[A-Za-z0-9]{1,8}$/, '');
    var m = sinExtension.match(/^(\d{2})(\d{2})(\d{2})\s+(.*)$/);
    if (!m) return salida;
    salida.fecha = '20' + m[1] + '-' + m[2] + '-' + m[3];
    var resto = m[4];

    var reg = resto.match(/^(\d{2})([ES])([MA])(\d{4,6})\s*(.*)$/);
    if (reg) {
      salida.registro = { ano: reg[1], sentido: reg[2], modo: reg[3], numero: reg[4] };
      resto = reg[5];
    }

    var tipos = ctx.tipos().slice().sort(function (a, b) { return b.length - a.length; });
    var seSabeElTipo = false;
    for (var i = 0; i < tipos.length; i++) {
      if (U.normalizar(resto).indexOf(U.normalizar(tipos[i])) === 0) {
        salida.tipo = tipos[i];
        resto = resto.slice(tipos[i].length).trim();
        seSabeElTipo = true;
        break;
      }
    }
    /* Lo que quede después del tipo es el texto adicional, sea lo que
       sea: un curso, una referencia de la factura, un expediente. Antes
       aquí solo se admitía algo con forma de año académico, porque el
       campo se llamaba así; desde que es texto libre se recoge entero.

       Eso sí, **solo si se ha reconocido el tipo**. Si no, lo que queda
       es el propio tipo sin identificar, y meterlo aquí sacaría un texto
       cualquiera donde no toca. */
    salida.curso = seSabeElTipo ? resto.trim() : '';
    return salida;
  }

  /* ¿Este nombre ya lo ha puesto la aplicación? Lo dice la fecha de
     delante (AAMMDD): es lo que Séneca nunca escribe. Lo usa
     js/registro-sellado.js (17-sep-2026, fila 20) para no leer el
     sello de un PDF que ya está bien colocado. */
  function pareceDeLaAplicacion(nombre) {
    return !!leerNombre(nombre).fecha;
  }

  return { configurar: configurar, abrir: abrir, leerNombre: leerNombre,
           parecidos: parecidos, pareceDeLaAplicacion: pareceDeLaAplicacion,
           seguirGuardado: seguirGuardado };
})();
