/* ============================================================
   documentos-formulario.js — el formulario del nombre del documento, los campos de su tipo y la lista de tipos.

   Sacado tal cual de js/documentos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado del cuadro y lo de los demás ficheros se pide a
   `Documentos._interno` (N). Se carga justo detrás de js/documentos.js.
   ============================================================ */
(function () {
  if (typeof Documentos === 'undefined' || !Documentos._interno) return;
  var N = Documentos._interno;

  function $(id) { return document.getElementById(id); }

  /* ---------- el formulario del nombre ---------- */

  N.ultimasOpciones = null;
  N.ultimoTipo = '';       /* el tipo elegido antes de abrir el cuadro de crear uno */

  /* El valor de la opción que abre el cuadro de crear un tipo nuevo.
     No es un tipo: son dos guiones bajos a cada lado para que no pueda
     coincidir nunca con uno de verdad. */
  N.TIPO_NUEVO = '__nuevo__';

  async function pintarFormulario(opciones) {
    var caja = $('doc-cuerpo');
    if (!caja) return;
    N.ultimasOpciones = opciones;   /* lo usa la vista previa */

    /* El documento, para poder verlo mientras se le pone el nombre. */
    var fichero = null;
    try {
      var h = opciones.handle ||
              await N.asuntoActual.handle.getFileHandle(opciones.nombreActual);
      fichero = await h.getFile();
    } catch (e) { fichero = null; }
    var visor = fichero ? N.visorDe(fichero, opciones.nombreActual)
                        : '<p class="explica">No he podido abrir el documento para verlo.</p>';

    var previo = N.leerNombre(opciones.nombreActual);
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
      Registro.pendiente(N.asuntoActual, opciones.nombreActual);

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
              N.botonOpcion('doc-sentido', 'E', 'Entrada', !previo.registro || previo.registro.sentido !== 'S') +
              N.botonOpcion('doc-sentido', 'S', 'Salida', !!previo.registro && previo.registro.sentido === 'S') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label class="etiqueta">Serie</label>' +
            '<div class="opciones">' +
              N.botonOpcion('doc-modo', 'M', 'Manual', !previo.registro || previo.registro.modo !== 'A') +
              N.botonOpcion('doc-modo', 'A', 'Automático', !!previo.registro && previo.registro.modo === 'A') +
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
    N.ultimoTipo = $('doc-tipo').value;
    pintarCamposDelTipo(valoresIniciales);
    $('doc-tipo').addEventListener('change', function () {
      var sel = $('doc-tipo');
      if (sel.value !== N.TIPO_NUEVO) { N.ultimoTipo = sel.value; pintarCamposDelTipo(); return; }
      sel.value = N.ultimoTipo || (N.ctx.tipos()[0] || '');
      N.abrirCuadroDeTipoNuevo();
    });

    /* refrescar la vista previa con cualquier cambio */
    Array.prototype.forEach.call(caja.querySelectorAll('input, select'), function (c) {
      c.oninput = N.refrescar;
      c.onchange = N.refrescar;
    });
    /* La fecha ya no toca el texto adicional: son dos campos
       independientes, y escribir en uno no puede pisar el otro. */
    $('doc-hay-registro').onchange = function () {
      var hay = $('doc-hay-registro').checked;
      $('doc-registro').classList.toggle('oculto', !hay);
      $('doc-fila-pendiente').classList.toggle('oculto', hay);
      N.refrescar();
    };

    /* Esconde los campos para que el documento ocupe toda la ventana. */
    $('doc-ampliar').onclick = function () {
      var partido = caja.querySelector('.doc-partido');
      var ampliado = partido.classList.toggle('solo-visor');
      $('doc-ampliar').textContent = ampliado ? 'Volver a los campos' : 'Ver más grande';
    };

    $('doc-volver').onclick = function () { N.soltarVisor(); N.pintarLista(); };
    $('doc-guardar').onclick = function () {
      return U.mientrasGuarda($('doc-guardar'), function () { return N.guardar(opciones); });
    };
    N.refrescar();
  }

  /* ---------- los campos del tipo de documento (fila 96) ---------- */

  function camposDelTipo(tipo) {
    return (window.DocCampos && tipo && tipo !== N.TIPO_NUEVO) ? DocCampos.campos(tipo) : [];
  }

  function tipoElegido() {
    var sel = $('doc-tipo');
    var tipo = sel ? sel.value : '';
    return tipo === N.TIPO_NUEVO ? (N.ultimoTipo || '') : tipo;
  }

  /* Pinta los campos del tipo elegido. Sin `valores`, conserva lo ya
     escrito en los que se repiten (mismo id). */
  function pintarCamposDelTipo(valores) {
    var caja = $('doc-campos-tipo');
    if (!caja || !window.DocCampos) return;
    var antes = valores || DocCampos.leerDe(caja);
    DocCampos.pintar(caja, camposDelTipo(tipoElegido()), antes);
    Array.prototype.forEach.call(caja.querySelectorAll('input, select'), function (c) {
      c.oninput = N.refrescar;
      c.onchange = N.refrescar;
    });
    N.refrescar();
  }

  function valoresDeCampos() {
    return window.DocCampos ? DocCampos.leerDe($('doc-campos-tipo')) : {};
  }

  /* ---------- la lista de tipos de documento ---------- */

  function opcionesDeTipo(elegido) {
    return N.ctx.tipos().map(function (t) {
      return '<option value="' + U.escapar(t) + '"' +
             (U.normalizar(t) === U.normalizar(elegido) ? ' selected' : '') + '>' +
             U.escapar(t) + '</option>';
    }).join('') +
    '<option value="' + N.TIPO_NUEVO + '">+  Crear un tipo nuevo…</option>';
  }

  Object.assign(N, {
    pintarFormulario: pintarFormulario,
    camposDelTipo: camposDelTipo,
    tipoElegido: tipoElegido,
    pintarCamposDelTipo: pintarCamposDelTipo,
    valoresDeCampos: valoresDeCampos,
    opcionesDeTipo: opcionesDeTipo
  });
})();
