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
      extension: Nombres.extensionDe(opciones.nombreActual),
      numeroDoc: opciones.numeroDoc || ''   /* fila 239: con número, estructura fija */
    };
  }

  /* Fila 239: los datos que ya no entran en el nombre, a la ficha del asunto. */
  function datosParaLaFicha(opciones) {
    var d = datosDelFormulario(opciones);
    var tipo = d.tipo;
    var registro = null;
    if ($('doc-hay-registro').checked) {
      registro = { ano: $('doc-ano').value.trim(), sentido: elegido('doc-sentido'), modo: elegido('doc-modo'), numero: $('doc-numero').value.trim() };
      registro.codigo = Nombres.codigoRegistro(registro);
    }
    var datos = {
      tipo: tipo, fecha: d.fecha,
      registros: registro && registro.codigo ? [registro] : [],
      campos: d.campos, valores: N.valoresDeCampos(), texto: d.curso
    };
    if (N.hitoActual && N.hitoActual.id) datos.hito = N.hitoActual.id;
    return datos;
  }

  function refrescar() {
    if (!$('doc-vista') || !N.ultimasOpciones) return;
    var ajustado = Nombres.montarDocumentoAjustado(datosDelFormulario(N.ultimasOpciones));
    var nombre = ajustado.nombre;
    $('doc-vista').textContent = nombre;
    Nombres.avisoRecorte($('doc-vista'), ajustado.recortado, ajustado.noCabe);   /* filas 130 y 177 */
    $('doc-guardar').disabled = nombre.length < 10 || !!ajustado.noCabe;
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
    var estabaAntes = lista.indexOf(opciones.nombreActual) !== -1;
    if (!estabaAntes && !marcado) return;
    /* Fila 176, punto 1: quitar el nombre antiguo y añadir el nuevo (si
       sigue marcado), dentro de la misma pasada de la cola. */
    await App.anotarLista(N.asuntoActual.nombre, 'pendientesRegistro', {
      quitar: estabaAntes ? [opciones.nombreActual] : [],
      anadir: marcado ? [nombreNuevo] : []
    });
  }

  async function guardar(opciones) {
    /* Un campo obligatorio del tipo de documento, vacío: no se guarda
       (fila 96), con el mismo aviso que al crear un asunto. */
    var falta = window.DocCampos ? DocCampos.faltaObligatorio(N.camposDelTipo(N.tipoElegido()), N.valoresDeCampos()) : '';
    if (falta) { U.aviso('Hace falta rellenar "' + falta + '".', 'malo'); return; }
    var ajustadoFinal = Nombres.montarDocumentoAjustado(datosDelFormulario(opciones));
    var nombre = ajustadoFinal.nombre;
    if (!nombre) return;
    /* Fila 177: por si acaso, se comprueba también aquí antes de guardar. */
    if (ajustadoFinal.noCabe) { U.aviso(Nombres.AVISO_NO_CABE, 'malo'); return; }
    /* Fila 239: el número de documento se gasta ahora, releyendo el disco.
       Si otro ordenador se ha quedado el que enseñaba la vista previa, el
       nombre cambia: se enseña y hay que volver a pulsar «Guardar». */
    if (opciones.numeroNuevo) {
      try {
        var reserva = await Numeros.reservar('documentos', opciones.numeroDoc);
        opciones.numeroDoc = reserva.numero;
        opciones.numeroNuevo = false;
        if (reserva.cambio) {
          refrescar();
          U.aviso('Otro ordenador acaba de usar ese número: el documento pasa a llamarse ' +
            Nombres.montarDocumentoAjustado(datosDelFormulario(opciones)).nombre + '. Revísalo y pulsa «Guardar» otra vez.', 'ambar');
          return;
        }
      } catch (eRes) { U.fallo('No he podido reservar el número del documento', eRes); return; }
    }
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
      } else if (nombre === opciones.nombreActual) {
        /* Fila 239: con la estructura fija, cambiar el registro, los campos o
           el texto no cambia el nombre: solo se pone al día la ficha. */
        U.aviso('Datos del documento guardados.', 'bueno');
      } else {
        await Carpetas.renombrarFichero(N.asuntoActual.handle, opciones.nombreActual, nombre);
        U.aviso('Nombre del documento cambiado.', 'bueno');
      }
    } catch (e) {
      U.fallo('No he podido guardarlo', e);
      return;
    }
    /* El documento ya está en la carpeta con su nombre: lo de después
       es accesorio, y si falla, ámbar (fila 100). */
    if (opciones.numeroDoc) {
      try {
        await DocumentosDatos.anotar(N.asuntoActual.nombre, opciones.numeroDoc, datosParaLaFicha(opciones));
        Numeros.recordarOrigen(opciones.claveOrigen, opciones.numeroDoc);
      } catch (eDatos) {
        U.accesorio('Documento guardado, pero no he podido apuntar su registro y sus datos en la ficha', eDatos);
      }
    }
    try {
      await actualizarPendiente(opciones, nombre);
    } catch (e2) {
      U.accesorio('Documento guardado, pero no he podido apuntar si está pendiente de registro', e2);
    }
    /* Fila 229: guardado en el asunto, queda su línea en el registro. */
    if (opciones.modo === 'anadir' && window.RegistroAsunto) {
      await RegistroAsunto.auto(N.asuntoActual, 'Documento guardado «' + nombre + '»', N.hitoActual);
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
