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
   ============================================================ */
var Documentos = (function () {

  var ctx = { tipos: function () { return []; }, curso: function () { return ''; } };
  var asuntoActual = null;
  var urlVisor = null;   /* la dirección temporal del documento que se está viendo */

  function configurar(o) { ctx = o; }

  function $(id) { return document.getElementById(id); }

  /* ---------- el cuadro ---------- */

  async function abrir(asunto) {
    asuntoActual = asunto;
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-ancho');
    var esperar = U.preguntar(asunto.nombre, '<div id="doc-cuerpo"></div>', 'Cerrar', true);
    await pintarLista();
    await esperar;
    soltarVisor();
    cuadro.classList.remove('cuadro-ancho');
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
        return '<div class="fila-documento">' +
                 '<span class="nombre-documento">' + U.escapar(f.nombre) + '</span>' +
                 '<button type="button" class="boton" data-renombrar="' + i + '">Poner nombre</button>' +
               '</div>';
      }).join('') + '</div>';
    }

    html += '<button type="button" class="boton boton-principal boton-ancho" id="doc-anadir">' +
            'Añadir documento</button>';

    caja.innerHTML = html;

    Array.prototype.forEach.call(caja.querySelectorAll('[data-renombrar]'), function (b) {
      b.onclick = function () {
        var f = lista[Number(b.dataset.renombrar)];
        pintarFormulario({ modo: 'renombrar', nombreActual: f.nombre });
      };
    });

    $('doc-anadir').onclick = async function () {
      try {
        var handle = await Carpetas.elegirFichero();
        pintarFormulario({ modo: 'anadir', handle: handle, nombreActual: handle.name });
      } catch (e) {
        if (e.name !== 'AbortError') U.aviso('No he podido abrir ese fichero: ' + e.message, 'malo');
      }
    };
  }

  /* ---------- el formulario del nombre ---------- */

  var ultimasOpciones = null;

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
    var tipos = ctx.tipos();
    var hoy = U.hoyIso();
    var fecha = previo.fecha || hoy;
    var curso = previo.curso || ctx.curso(fecha);
    /* Si el curso ya venía del nombre del fichero, es una elección hecha
       y no se toca. Si es el calculado por defecto, se sigue recalculando
       mientras el usuario no lo cambie a mano. */
    var cursoDocAuto = previo.curso ? '' : curso;

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
          '<label class="etiqueta">Año académico <span class="suave">(opcional)</span></label>' +
          '<input id="doc-curso" class="campo" value="' + U.escapar(curso) + '">' +
        '</div>' +
      '</div>' +

      '<label class="etiqueta">Tipo de documento</label>' +
      '<select id="doc-tipo" class="campo">' +
        tipos.map(function (t) {
          return '<option value="' + U.escapar(t) + '"' +
                 (U.normalizar(t) === U.normalizar(previo.tipo) ? ' selected' : '') + '>' +
                 U.escapar(t) + '</option>';
        }).join('') +
      '</select>' +

      '<label class="interruptor">' +
        '<input type="checkbox" id="doc-hay-registro"' + (previo.registro ? ' checked' : '') + '>' +
        '<span>Está registrado en Séneca</span>' +
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

    /* refrescar la vista previa con cualquier cambio */
    Array.prototype.forEach.call(caja.querySelectorAll('input, select'), function (c) {
      c.oninput = refrescar;
      c.onchange = refrescar;
    });
    $('doc-fecha').oninput = $('doc-fecha').onchange = function () {
      var actual = $('doc-curso').value.trim();
      if (!actual || actual === cursoDocAuto) {
        cursoDocAuto = ctx.curso($('doc-fecha').value);
        $('doc-curso').value = cursoDocAuto;
      }
      refrescar();
    };
    $('doc-hay-registro').onchange = function () {
      $('doc-registro').classList.toggle('oculto', !$('doc-hay-registro').checked);
      refrescar();
    };

    /* Esconde los campos para que el documento ocupe toda la ventana. */
    $('doc-ampliar').onclick = function () {
      var partido = caja.querySelector('.doc-partido');
      var ampliado = partido.classList.toggle('solo-visor');
      $('doc-ampliar').textContent = ampliado ? 'Volver a los campos' : 'Ver más grande';
    };

    $('doc-volver').onclick = function () { soltarVisor(); pintarLista(); };
    $('doc-guardar').onclick = function () { guardar(opciones); };
    refrescar();
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
    return {
      fecha: $('doc-fecha').value,
      codigo: Nombres.codigoRegistro(registro),
      tipo: $('doc-tipo').value,
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

  async function guardar(opciones) {
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
      soltarVisor();
      await pintarLista();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
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
    for (var i = 0; i < tipos.length; i++) {
      if (U.normalizar(resto).indexOf(U.normalizar(tipos[i])) === 0) {
        salida.tipo = tipos[i];
        resto = resto.slice(tipos[i].length).trim();
        break;
      }
    }
    /* Solo se admite como año académico algo con forma de año académico:
       26-27. Lo demás que quede en el nombre no es el año, y meterlo en
       ese campo hacía que saliera un texto cualquiera donde no toca. */
    var mCurso = resto.match(/\b(\d{2})\s*[-\/]\s*(\d{2})\b/);
    salida.curso = mCurso ? mCurso[1] + '-' + mCurso[2] : '';
    return salida;
  }

  return { configurar: configurar, abrir: abrir, leerNombre: leerNombre };
})();
