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
   ============================================================ */
var Documentos = (function () {

  var ctx = { tipos: function () { return []; }, curso: function () { return ''; } };
  var asuntoActual = null;

  function configurar(o) { ctx = o; }

  function $(id) { return document.getElementById(id); }

  /* ---------- el cuadro ---------- */

  async function abrir(asunto) {
    asuntoActual = asunto;
    var esperar = U.preguntar(asunto.nombre, '<div id="doc-cuerpo"></div>', 'Cerrar', true);
    await pintarLista();
    await esperar;
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

  function pintarFormulario(opciones) {
    var caja = $('doc-cuerpo');
    if (!caja) return;
    ultimasOpciones = opciones;   /* lo usa la vista previa */

    var previo = leerNombre(opciones.nombreActual);
    var tipos = ctx.tipos();
    var hoy = U.hoyIso();
    var fecha = previo.fecha || hoy;

    caja.innerHTML =
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
          '<input id="doc-curso" class="campo" value="' + U.escapar(previo.curso || ctx.curso()) + '">' +
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
      '</div>';

    /* refrescar la vista previa con cualquier cambio */
    Array.prototype.forEach.call(caja.querySelectorAll('input, select'), function (c) {
      c.oninput = refrescar;
      c.onchange = refrescar;
    });
    $('doc-hay-registro').onchange = function () {
      $('doc-registro').classList.toggle('oculto', !$('doc-hay-registro').checked);
      refrescar();
    };
    $('doc-volver').onclick = function () { pintarLista(); };
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
    salida.curso = resto.trim();
    return salida;
  }

  return { configurar: configurar, abrir: abrir, leerNombre: leerNombre };
})();
