/* ============================================================
   documentos-guardar.js — los botones de opción, leer el formulario, la vista previa del nombre y guardar el documento.

   Sacado tal cual de js/documentos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado del cuadro y lo de los demás ficheros se pide a
   `Documentos._interno` (N). Se carga justo detrás de js/documentos.js.
   ============================================================ */
(function () {
  if (typeof Documentos === 'undefined' || !Documentos._interno) return;
  var N = Documentos._interno;

  function $(id) { return document.getElementById(id); }

  function botonOpcion(grupo, valor, texto, marcado) {
    return '<label class="opcion"><input type="radio" name="' + grupo + '" value="' + valor + '"' +
           (marcado ? ' checked' : '') + '><span>' + texto + '</span></label>';
  }

  function elegido(grupo) {
    var m = document.querySelector('input[name="' + grupo + '"]:checked');
    return m ? m.value : '';
  }

  /* Cierra el cuadro entero (el "Cerrar" de siempre), en vez de volver
     a la lista de documentos (fila 174, punto 3). */
  function cerrarCuadro() {
    var aceptar = document.getElementById('cuadro-aceptar');
    if (aceptar) aceptar.click();
  }

  /* Punto previsto para que otro módulo tome el relevo en vez de cerrar
     (fila 174, punto 5: los adjuntos de un correo, uno detrás de otro):
     `fn(nombreGuardado, opciones)` devuelve true si ha abierto otra cosa
     y no hay que cerrar. Se prueban en orden; la primera que devuelva
     true gana. */
  N.alTerminarPonerNombre = [];

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
    if (tipo === N.TIPO_NUEVO) tipo = N.ultimoTipo || '';
    return {
      fecha: $('doc-fecha').value,
      codigo: Nombres.codigoRegistro(registro),
      tipo: tipo,
      campos: window.DocCampos ? DocCampos.enOrden(N.camposDelTipo(tipo), N.valoresDeCampos()) : [],
      curso: $('doc-curso').value.trim(),
      extension: Nombres.extensionDe(opciones.nombreActual)
    };
  }

  function refrescar() {
    if (!$('doc-vista') || !N.ultimasOpciones) return;
    var ajustado = Nombres.montarDocumentoAjustado(datosDelFormulario(N.ultimasOpciones));
    var nombre = ajustado.nombre;
    $('doc-vista').textContent = nombre;
    Nombres.avisoRecorte($('doc-vista'), ajustado.recortado);   /* fila 130 */
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
    var lista = (N.asuntoActual.ficha && N.asuntoActual.ficha.pendientesRegistro) || [];
    var sinElAntiguo = lista.filter(function (n) { return n !== opciones.nombreActual; });
    var final = marcado ? sinElAntiguo.concat([nombreNuevo]) : sinElAntiguo;
    var igual = final.length === lista.length &&
      final.slice().sort().join('\n') === lista.slice().sort().join('\n');
    if (igual) return;
    await App.anotar(N.asuntoActual.nombre, { pendientesRegistro: final });
  }

  async function guardar(opciones) {
    /* Un campo obligatorio del tipo de documento, vacío: no se guarda
       (fila 96), con el mismo aviso que al crear un asunto. */
    var falta = window.DocCampos ? DocCampos.faltaObligatorio(N.camposDelTipo(N.tipoElegido()), N.valoresDeCampos()) : '';
    if (falta) { U.aviso('Hace falta rellenar "' + falta + '".', 'malo'); return; }
    var nombre = Nombres.montarDocumento(datosDelFormulario(opciones));
    if (!nombre) return;
    try {
      var yaEsta = await Carpetas.ficheros(N.asuntoActual.handle);
      var repetido = yaEsta.some(function (f) {
        return f.nombre === nombre && f.nombre !== opciones.nombreActual;
      });
      if (repetido) {
        U.aviso('Ya hay un documento con ese nombre en la carpeta.', 'malo');
        return;
      }
      if (opciones.modo === 'anadir') {
        await Carpetas.copiarFicheroEn(N.asuntoActual.handle, opciones.handle, nombre);
        U.aviso('Documento guardado en la carpeta.', 'bueno');
      } else {
        await Carpetas.renombrarFichero(N.asuntoActual.handle, opciones.nombreActual, nombre);
        U.aviso('Documento renombrado.', 'bueno');
      }
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
    /* El tipo de documento elegido, para la próxima vez (fila 174,
       punto 1): por tipo de asunto, en este ordenador. */
    if (N.guardarUltimoTipoDocumento) {
      var tipoGuardado = $('doc-tipo').value;
      if (tipoGuardado === N.TIPO_NUEVO) tipoGuardado = N.ultimoTipo || '';
      N.guardarUltimoTipoDocumento(App.tipoDeAsunto(N.asuntoActual), tipoGuardado);
    }
    /* Este cuadro se ha abierto desde un hito (fila 103, sección 1):
       lo que se guarde queda apuntado ahí, y se marca sola la casilla
       de "Lo que hay que reunir" que le toque (no crítico: el
       documento ya ha quedado guardado igual). Vale para todo lo que
       se guarde mientras el cuadro esté abierto, no solo lo primero. */
    if (N.hitoActual) {
      try {
        /* Renombrar uno que ya estaba apuntado a este hito (el que entra
           desde "Por clasificar" se apunta nada más entrar): el nombre
           viejo sale del hito, para que no quede como «(ya no está)». */
        if (opciones.modo !== 'anadir' && opciones.nombreActual !== nombre) {
          await Hitos.quitarDocumento(N.asuntoActual.nombre, N.hitoActual.id, opciones.nombreActual);
        }
        await Hitos.anadirDocumento(N.asuntoActual.nombre, N.hitoActual.id, nombre);
        if (window.HitosRequisitos) {
          try { await HitosRequisitos.marcarPorDocumento(N.asuntoActual.nombre, N.hitoActual.id, nombre); }
          catch (e4) { /* no crítico */ }
        }
        if (opciones.modo === 'anadir' && Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(N.asuntoActual, N.hitoActual.id, 'anadir');   /* fila 109 */
        if (window.HitosPanel) {
          window.HitosPanel.desplegarAlAbrir(N.asuntoActual.nombre, N.hitoActual.id);
          window.HitosPanel.programarRepintado();
        }
      } catch (e2b) {
        U.accesorio('Documento guardado, pero no he podido apuntarlo al hito', e2b);
      }
    }
    N.soltarVisor();
    /* Abierto directo para ponerle nombre (opciones.ponerNombre, fila
       174, punto 3): cierra el cuadro entero al terminar, en vez de
       volver a la lista. Abierto desde la lista ("Poner nombre" de una
       fila), se vuelve a la lista, como siempre. */
    if (opciones.ponerNombre) {
      var siguiente = false;
      for (var i = 0; i < N.alTerminarPonerNombre.length && !siguiente; i++) {
        try { siguiente = await N.alTerminarPonerNombre[i](nombre, opciones); }
        catch (e4) { /* un módulo roto no impide cerrar */ }
      }
      if (!siguiente) cerrarCuadro();
      return;
    }
    try { await N.pintarLista(); } catch (e3) { U.accesorio('Documento guardado, pero no he podido repintar la lista', e3); }
  }

  Object.assign(N, {
    botonOpcion: botonOpcion,
    elegido: elegido,
    refrescar: refrescar,
    guardar: guardar,
    cerrarCuadro: cerrarCuadro
  });
})();
