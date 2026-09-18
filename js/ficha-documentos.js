/* ============================================================
   ficha-documentos.js — los documentos de la carpeta, en la ficha del
   asunto (17-sep-2026, fila 26: se separa de js/ficha-asunto.js, al
   quitarle trabajo la fila "los hitos son la guía", para no dejarlo
   pasar de las 1.100 líneas).

   Van en dos grupos: los papeles del expediente y lo que ha llegado
   por correo. Mezclados, la solicitud se pierde entre hilos y
   adjuntos, que son los que más se acumulan.

   Se habla con js/ficha-asunto.js por window.FichaDocumentos.pintar
   (llamado cada vez que puede haber cambiado la lista, con un aviso
   por si un borrado obliga a repintar las notas). No sabe nada del
   modo consulta: eso lo aplica aplicarModoConsulta recorriendo los
   controles ya pintados, igual que con cualquier otro bloque.

   Se carga después de js/ficha-asunto.js.
   ============================================================ */
var FichaDocumentos = (function () {

  /* El aviso que hay que dar (repintar notas) cuando un borrado puede
     haber tocado algo más que la lista de documentos. Lo trae quien
     llama a pintar(); se conserva de una llamada a otra para que los
     repintados internos (tras registrar, separar, unir o borrar) lo
     sigan usando igual. */
  var alBorrarActual = null;

  function $(id) { return document.getElementById(id); }

  /* Lo que la aplicación mete cuando entra un correo: el hilo en PDF
     (CORREO, y HILO en las primeras versiones) y sus adjuntos. */
  var DE_CORREO = /(^|[\s_-])(CORREO|HILO|ADJUNTO)([\s_.\-(]|$)/i;

  function esDeCorreo(nombre) {
    return DE_CORREO.test(String(nombre || ''));
  }

  /* El nombre empieza por la fecha, así que por orden alfabético
     quedan en orden de antigüedad. */
  function porNombre(a, b) {
    return String(a.nombre).localeCompare(String(b.nombre), 'es');
  }

  function filaDeDocumento(f, a) {
    var ext = Nombres.extensionDe(f.nombre);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ficha-documento';
    b.title = 'Verlo al lado del programa';
    b.innerHTML = (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
                  '<span>' + U.escapar(f.nombre) + '</span>';
    b.onclick = function () { abrirDocumento(f); };

    var fila = document.createElement('div');
    fila.className = 'ficha-documento-fila';
    fila.appendChild(b);

    /* A la vista solo el nombre y "Registrar" (cuando sale): el resto
       (Copiar —lo añade js/copiar.js, aparte—, Separar, Unir, Sacar
       páginas y Borrar) va detrás del menú de tres puntos, para que el
       nombre nunca se estruje (17-sep-2026, fila 36,
       docs/FILAS-QUE-NO-SE-ESTRUJAN.md). */
    var enMenu = [];

    if (window.Registro && !Registro.tieneRegistro(f.nombre)) {
      var pendiente = Registro.pendiente(a, f.nombre);
      if (pendiente) {
        var marca = document.createElement('span');
        marca.className = 'marca-sin-registrar';
        marca.textContent = 'Sin registrar';
        fila.appendChild(marca);
      }

      var reg = document.createElement('button');
      reg.type = 'button';
      reg.className = 'boton' + (pendiente ? ' boton-ambar' : '');
      reg.title = 'Dar registro de entrada o salida a este documento';
      reg.textContent = 'Registrar';
      reg.onclick = async function () {
        reg.disabled = true;
        await Registro.abrirCuadro(a, f.nombre, function () { pintar(a); });
        reg.disabled = false;
      };
      fila.appendChild(reg);
    }

    /* Separar, Unir y Sacar páginas (17-sep-2026, fila 22,
       docs/SEPARAR-Y-UNIR-PDF.md): solo para PDF. */
    if (window.PdfSepararUnir && window.PdfHerramientas && PdfHerramientas.esPdf(f.nombre, '')) {
      function botonPdf(texto, ayuda, accion) {
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'boton';
        boton.title = ayuda;
        boton.textContent = texto;
        boton.onclick = function () {
          accion({
            modo: 'asunto', dir: a.handle, nombre: f.nombre, handle: f.handle, asunto: a,
            alTerminar: function () { pintar(a); }
          });
        };
        return boton;
      }
      enMenu.push(botonPdf('Separar', 'Partirlo en varios documentos', PdfSepararUnir.separar));
      enMenu.push(botonPdf('Unir', 'Juntarlo con otro PDF del asunto', PdfSepararUnir.unir));
      enMenu.push(botonPdf('Sacar páginas', 'Sacar una copia con solo algunas páginas', PdfSepararUnir.sacarPaginas));
      /* Fila 57, 18-sep-2026, docs/HUECO-PARA-SELLO-Y-FIRMA.md. */
      if (window.PrepararDocumento) {
        enMenu.push(botonPdf('Preparar el documento',
          'Deja hueco arriba para el sello de Séneca y abajo para la firma', PrepararDocumento.abrir));
      }
    }

    /* Borrar, con papelera (11-sep-2026): siempre el último del menú. */
    if (window.Papelera) {
      var borrar = window.Papelera.botonBorrar(async function () {
        var ok = await window.Papelera.preguntarBorrar(f.nombre);
        if (!ok) return;
        borrar.disabled = true;
        try {
          await Papelera.mandarDocumentoDeAsunto(a, f.nombre);
          U.aviso('Documento mandado a la papelera.', 'bueno');
          pintar(a);
          if (alBorrarActual) await alBorrarActual();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + e.message, 'malo');
          borrar.disabled = false;
        }
      });
      enMenu.push(borrar);
    }

    if (enMenu.length) fila.appendChild(U.menuDeAcciones(enMenu));

    return fila;
  }

  function grupoDeDocumentos(caja, titulo, ficheros, conRotulo, a) {
    if (!ficheros.length) return;
    if (conRotulo) {
      var r = document.createElement('div');
      r.className = 'ficha-grupo-docs';
      r.textContent = titulo + '  (' + ficheros.length + ')';
      caja.appendChild(r);
    }
    ficheros.sort(porNombre).forEach(function (f) { caja.appendChild(filaDeDocumento(f, a)); });
  }

  /* "Documentos ▾", en la cabecera del bloque (18-sep-2026, fila 52,
     docs/CABECERA-DEL-ASUNTO.md, 11): lo que antes era "Gestionar
     documentos" en la barra de la ficha, exactamente igual, solo que
     al lado del título de este bloque, también con la carpeta vacía.
     Se pinta una sola vez por bloque: `pintar()` se llama en cada
     repintado de la lista de documentos, pero el título del bloque
     (`<h3>`) no se rehace, así que basta con no duplicar el botón. */
  function ponerBotonGestionar(bloqueEl, a) {
    if (!bloqueEl) return;
    var titulo = bloqueEl.querySelector('.ficha-titulo');
    if (!titulo || titulo.querySelector('.ficha-documentos-gestionar')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ficha-documentos-gestionar';
    b.textContent = 'Documentos ▾';
    b.title = 'Nombrar y archivar los documentos de la carpeta';
    b.onclick = async function () { await App.verDocumentos(a); pintar(a); };
    titulo.appendChild(b);
  }

  async function pintar(a) {
    var caja = $('ficha-documentos');
    var cuenta = $('ficha-cuenta-docs');
    if (!caja) return;
    try {
      var lista = await Carpetas.ficheros(a.handle);
      if (cuenta) cuenta.textContent = lista.length || '';
      /* Un bloque vacío ocupa una sola línea, no una tarjeta entera
         (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md, 8). */
      var bloqueEl = caja.closest('.ficha-bloque');
      if (bloqueEl) bloqueEl.classList.toggle('vacio', !lista.length);
      ponerBotonGestionar(bloqueEl, a);
      if (!lista.length) {
        caja.className = 'explica';
        caja.textContent = 'La carpeta todavía está vacía.';
        return;
      }
      caja.className = 'ficha-documentos';
      caja.innerHTML = '';

      var correos = lista.filter(function (f) { return esDeCorreo(f.nombre); });
      var expediente = lista.filter(function (f) { return !esDeCorreo(f.nombre); });

      /* Con un solo grupo no hacen falta rótulos: sobran. */
      var conRotulo = correos.length > 0 && expediente.length > 0;
      grupoDeDocumentos(caja, 'Del expediente', expediente, conRotulo, a);
      grupoDeDocumentos(caja, 'Llegados por correo', correos, conRotulo, a);
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer la carpeta: ' + e.message;
    }
  }

  /* Se abre en la columna de la derecha, al lado del programa, para
     poder trabajar con el papel delante. */
  async function abrirDocumento(f) {
    if (window.Visor) return window.Visor.abrir(f.handle, f.nombre);
    try {
      var fichero = await f.handle.getFile();
      var url = URL.createObjectURL(fichero);
      window.open(url, '_blank');
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      U.aviso('No he podido abrirlo: ' + e.message, 'malo');
    }
  }

  return {
    pintar: function (a, alBorrar) {
      alBorrarActual = alBorrar || null;
      return pintar(a);
    }
  };
})();
