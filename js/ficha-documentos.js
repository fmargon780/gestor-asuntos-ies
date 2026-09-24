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

  /* El original que se conserva al registrar un documento sellado
     (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 4,
     `RegistroSellado.nombreSinSellar`): "SIN SELLAR" al final del
     nombre, antes de la extensión y de un posible "(2)". */
  var SIN_SELLAR = / SIN SELLAR(\s*\(\d+\))?\.[A-Za-z0-9]{1,8}$/i;

  function esSinSellar(nombre) {
    return SIN_SELLAR.test(String(nombre || ''));
  }

  /* `hitosVisibles`/`hitoDe` (18-sep-2026, fila 58,
     docs/AJUSTES-DE-USO-2026-09-18.md, 6): asociar un documento a un
     hito, desde el propio documento. `hitoDe` es el mapa nombre de
     documento → hito, calculado una vez por `pintar()` a partir de los
     mismos `h.documentos` que ya guarda "Apuntar un documento"
     (js/hitos-documentos.js): ningún dato nuevo, ningún sitio nuevo
     donde guardarlo. */
  function filaDeDocumento(f, a, hitosVisibles, hitoDe) {
    var ext = Nombres.extensionDe(f.nombre);
    var sinSellar = esSinSellar(f.nombre);
    var hitoDelDoc = hitoDe[f.nombre] || null;
    /* Fila 137: el índice del expediente no se registra ni se asocia a hitos. */
    var esIndice = !!(window.IndiceExpediente && IndiceExpediente.es(f.nombre));
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ficha-documento' + (sinSellar ? ' ficha-documento-sinsellar' : '') + (esIndice ? ' ficha-documento-indice' : '');
    b.title = sinSellar
      ? 'El original sin sellar, conservado por si hay que repetir el registro. Verlo al lado del programa'
      : 'Verlo al lado del programa';
    /* La etiqueta del hito va en un `<div>`, nunca un `<span>`: js/copiar.js
       coge el ÚLTIMO `<span>` de este botón para saber qué nombre
       copiar, y un tercer `<span>` aquí se lo llevaría por delante. */
    b.innerHTML = (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
                  '<span>' + U.escapar(f.nombre) + '</span>' +
                  (hitoDelDoc ? '<div class="ficha-documento-hito">' + U.escapar(hitoDelDoc.titulo) + '</div>' : '');
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

    if (window.Registro && !esIndice && !Registro.tieneRegistro(f.nombre)) {
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

    /* "Asociar a un hito" (18-sep-2026, fila 58,
       docs/AJUSTES-DE-USO-2026-09-18.md, 6): un botón pequeño con el
       menú de js/ficha-menus.js, no el de tres puntos (U.menuDeAcciones)
       de más abajo, que es solo para acciones de un único paso. Solo
       sale si el asunto tiene hitos con los que asociar. */
    if (window.FichaMenus && !esIndice && hitosVisibles && hitosVisibles.length) {
      var asociar = document.createElement('button');
      asociar.type = 'button';
      asociar.className = 'boton boton-chico ficha-documento-asociar';
      asociar.title = 'Asociar este documento a un hito';
      asociar.textContent = 'Asociar a un hito';
      fila.appendChild(asociar);

      function accionAsociar(hitoNuevo) {
        return async function () {
          if ((hitoNuevo && hitoNuevo.id) === (hitoDelDoc && hitoDelDoc.id)) return;
          try {
            if (hitoDelDoc) await Hitos.quitarDocumento(a.nombre, hitoDelDoc.id, f.nombre);
            if (hitoNuevo) await Hitos.anadirDocumento(a.nombre, hitoNuevo.id, f.nombre);
            /* Fila 138: la línea «hay que reunir un documento» del guion. */
            if (window.HitosRequisitos) {
              try {
                if (hitoDelDoc) await HitosRequisitos.desmarcarPorDocumento(a.nombre, hitoDelDoc.id, f.nombre);
                if (hitoNuevo) await HitosRequisitos.marcarPorDocumento(a.nombre, hitoNuevo.id, f.nombre);
              } catch (e2) { /* no crítico */ }
            }
            if (window.HitosPanel) window.HitosPanel.programarRepintado();
            pintar(a);
          } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
        };
      }

      FichaMenus.montar(asociar, [{
        texto: (hitoDelDoc ? '' : '✓ ') + 'Ninguno',
        alPulsar: accionAsociar(null)
      }].concat(hitosVisibles.map(function (h) {
        return {
          texto: (hitoDelDoc && hitoDelDoc.id === h.id ? '✓ ' : '') + h.titulo,
          alPulsar: accionAsociar(h)
        };
      })));
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
      /* Fila 57, 18-sep-2026, docs/HUECO-PARA-SELLO-Y-FIRMA.md. Texto del
         botón "Ajustar tamaño" desde la fila 58 (docs/AJUSTES-DE-USO-2026-
         09-18.md, 2); el fichero y la función se quedan igual. */
      if (window.PrepararDocumento) {
        enMenu.push(botonPdf('Ajustar tamaño',
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
          U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
          borrar.disabled = false;
        }
      });
      enMenu.push(borrar);
    }

    if (enMenu.length) fila.appendChild(U.menuDeAcciones(enMenu));

    return fila;
  }

  function grupoDeDocumentos(caja, titulo, ficheros, conRotulo, a, hitosVisibles, hitoDe) {
    if (!ficheros.length) return;
    if (conRotulo) {
      var r = document.createElement('div');
      r.className = 'ficha-grupo-docs';
      r.textContent = titulo + '  (' + ficheros.length + ')';
      caja.appendChild(r);
    }
    ficheros.sort(porNombre).forEach(function (f) {
      caja.appendChild(filaDeDocumento(f, a, hitosVisibles, hitoDe));
    });
  }

  /* Los hitos del asunto, y en qué hito está apuntado cada documento
     (18-sep-2026, fila 58, 6): mismo dato que ya guarda "Apuntar un
     documento" (js/hitos-documentos.js, `h.documentos`), solo los
     visibles (`Hitos.visibles`), igual que el panel de la izquierda. */
  async function hitosParaAsociar(a) {
    if (!window.Hitos) return { visibles: [], porDocumento: {} };
    try {
      var todos = await Hitos.hitosDe(a.nombre);
      var visibles = Hitos.visibles(todos);
      var porDocumento = {};
      visibles.forEach(function (h) {
        (h.documentos || []).forEach(function (d) { porDocumento[d] = h; });
      });
      return { visibles: visibles, porDocumento: porDocumento };
    } catch (e) {
      return { visibles: [], porDocumento: {} };
    }
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
      /* El índice del expediente (fila 137) se ve, pero no cuenta. */
      var sinIndice = window.IndiceExpediente ? IndiceExpediente.fuera(lista) : lista;
      if (cuenta) cuenta.textContent = sinIndice.length || '';
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

      var hitos = await hitosParaAsociar(a);

      /* Con un solo grupo no hacen falta rótulos: sobran. */
      var conRotulo = correos.length > 0 && expediente.length > 0;
      grupoDeDocumentos(caja, 'Del expediente', expediente, conRotulo, a, hitos.visibles, hitos.porDocumento);
      grupoDeDocumentos(caja, 'Llegados por correo', correos, conRotulo, a, hitos.visibles, hitos.porDocumento);
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer la carpeta: ' + U.mensajeDeError(e);
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
      U.aviso('No he podido abrirlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  return {
    pintar: function (a, alBorrar) {
      alBorrarActual = alBorrar || null;
      return pintar(a);
    }
  };
})();
