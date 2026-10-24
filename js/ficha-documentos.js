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
  var cepEstados = null;   /* fila 280: { <nombre>: { visible, apagada, motivo } } del asunto que se está pintando */

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

  /* Fila 425 (docs/FICHA-VISTA-DE-TRABAJO.md): esta lista es la columna derecha de «Trabajo». Con un
     hito abierto a la izquierda, los documentos que son suyos llevan la marca «Hito N»; los demás,
     «Traer a este hito»; y cada uno, una casilla para adjuntarlo al «Comunicar» y al «Enviar» del hito.
     `js/hito-mesa.js` avisa con `marcarHito` cada vez que cambia la mesa. */
  var enMesa = { clave: '', hitos: [], idHito: '', editable: false };
  var marcadosCarpeta = {};      /* nombre → true: las casillas marcadas, que sobreviven a un repintado de la lista */
  var marcadosDeAsunto = '';

  function marcarHito(a, hitos, idHito, editable) {
    var clave = a ? a.nombre : '';
    if (clave !== enMesa.clave || (idHito || '') !== enMesa.idHito) marcadosCarpeta = {};
    enMesa = { clave: clave, hitos: hitos || [], idHito: idHito || '', editable: !!editable };
    aplicarMarcas(a);
  }

  function aplicarMarcas(a) {
    var caja = $('ficha-documentos');
    if (!caja || !window.Hitos) return;
    var h = enMesa.idHito ? Hitos.buscar(enMesa.hitos, enMesa.idHito) : null;
    var n = h && Hitos.numerados ? Hitos.numerados(enMesa.hitos).indexOf(h) + 1 : 0;
    var suyos = h ? (h.documentos || []) : [];
    var conCasillas = !!(h && enMesa.editable);
    var puedeTraer = conCasillas && h.clase !== 'decision';
    caja.classList.toggle('con-casillas', conCasillas);
    Array.prototype.forEach.call(caja.querySelectorAll('.ficha-documento-fila'), function (fila) {
      var es = !!h && suyos.indexOf(fila.dataset.doc) !== -1;
      var marca = fila.querySelector('.ficha-marca-hito');
      if (es && !marca) {
        marca = document.createElement('span');
        marca.className = 'ficha-marca-hito';
        var boton = fila.querySelector('button.ficha-documento');
        fila.insertBefore(marca, boton ? boton.nextSibling : null);
      }
      if (marca) {
        if (es) marca.textContent = n ? 'Hito ' + n : 'Hito'; else marca.remove();
      }
      var traer = fila.querySelector('.ficha-documento-traer');
      if (traer) traer.classList.toggle('oculto', !(puedeTraer && !es));
    });
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
    var lineaDeDatos = window.DocumentosDatos ? DocumentosDatos.lineaHTML(a, f.nombre, null, 'ficha-documento-datos') : '';
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
                  '<span class="ficha-documento-nombre" title="' + U.escapar(f.nombre) + '">' + U.escapar(f.nombre) + '</span>' +
                  (hitoDelDoc ? '<div class="ficha-documento-hito" title="' + U.escapar(hitoDelDoc.titulo) + '">' + U.escapar(hitoDelDoc.titulo) + '</div>' : '');
    b.onclick = function () { abrirDocumento(f, a); };

    var fila = document.createElement('div');
    fila.className = 'ficha-documento-fila';
    fila.dataset.doc = f.nombre;
    /* Fila 425: la casilla de adjuntar, solo con un hito abierto a la izquierda (la lista le pone `con-casillas`). */
    if (!esIndice) {
      var casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.className = 'ficha-documento-marca';
      casilla.setAttribute('data-ayuda-clave', 'adjuntar-al-correo-del-hito');
      casilla.checked = !!marcadosCarpeta[f.nombre];
      casilla.onchange = function () {
        if (casilla.checked) marcadosCarpeta[f.nombre] = true; else delete marcadosCarpeta[f.nombre];
        if (window.HitoMesaDocumentos && HitoMesaDocumentos.alMarcar) HitoMesaDocumentos.alMarcar();
      };
      fila.appendChild(casilla);
    }
    fila.appendChild(b);

    /* Fila 423: «Ruta», pegado al nombre: copia la ruta entera del documento. Fila 439: es lo único que
       queda a la vista; lo demás, en el menú ⋮ de la derecha, y los datos, en gris, tras «Ruta». */
    if (window.RutaCarpetas) fila.appendChild(RutaCarpetas.botonDocumento(a, RutaCarpetas.modoDe(a), { nombre: f.nombre }));

    /* Fila 439: las entradas del menú ⋮, en este orden: copiar el nombre, Registrar, Cambiar el nombre,
       Asociar a un hito, Traer a este hito, y lo que ya tenía el menú. Cada una sale solo cuando hoy saldría su botón. */
    var enMenu = [];
    function entrada(texto, clase, ayuda, alPulsar) {
      var e = document.createElement('button');
      e.type = 'button';
      e.className = clase || '';
      e.title = ayuda || '';
      e.textContent = texto;
      e.onclick = alPulsar;
      return e;
    }

    /* Fila 168: copia el nombre sin la extensión (antes, ⧉; antes aún, «Copiar» del menú). */
    var copiar = entrada('Copiar el nombre', 'ficha-documento-copiar', 'Copiar el nombre, sin la extensión', function (ev) {
      ev.stopPropagation();
      U.copiar(String(f.nombre).replace(/\.[A-Za-z0-9]{1,8}$/, '').trim(), copiar);
    });
    enMenu.push(copiar);

    if (window.Registro && !esIndice && !Registro.tieneRegistro(f.nombre, a)) {
      var pendiente = Registro.pendiente(a, f.nombre);
      if (pendiente) {
        var marca = document.createElement('span');
        marca.className = 'marca-sin-registrar';
        marca.textContent = 'Sin registrar';
        fila.appendChild(marca);
      }

      var reg = entrada('Registrar', 'ficha-documento-registrar', 'Dar registro de entrada o salida a este documento', async function () {
        reg.disabled = true;
        await Registro.abrirCuadro(a, f.nombre, function () { pintar(a); });
        reg.disabled = false;
      });
      enMenu.push(reg);
    }

    /* «Cambiar el nombre», siempre a la vista (fila 168): el mismo cuadro que
       el de la ventana de documentos, ya abierto en este documento. */
    if (!esIndice) {
      var nombrar = entrada('Cambiar el nombre', 'ficha-documento-nombrar', 'Cambiarle el nombre a este documento, según la norma', async function () {
        nombrar.disabled = true;
        try { await App.verDocumentos(a, { ponerNombre: f.nombre }); }
        finally { nombrar.disabled = false; }
        pintar(a);
      });
      enMenu.push(nombrar);
    }

    /* "Asociar a un hito" (18-sep-2026, fila 58,
       docs/AJUSTES-DE-USO-2026-09-18.md, 6): un botón pequeño con el
       menú de js/ficha-menus.js, no el de tres puntos (U.menuDeAcciones)
       de más abajo, que es solo para acciones de un único paso. Solo
       sale si el asunto tiene hitos con los que asociar. */
    if (window.FichaMenus && !esIndice && hitosVisibles && hitosVisibles.length) {
      /* El desplegable de hitos cuelga de un ancla sin tamaño junto al ⋮; la entrada del menú la pulsa. */
      var ancla = document.createElement('button');
      ancla.type = 'button';
      ancla.className = 'ficha-documento-ancla';
      ancla.tabIndex = -1;
      ancla.setAttribute('aria-hidden', 'true');
      fila.appendChild(ancla);
      var asociar = entrada('Asociar a un hito', 'ficha-documento-asociar', 'Asociar este documento a un hito', function () { ancla.click(); });
      enMenu.push(asociar);

      /* Fila 282: «Quitar del hito» y «mover» por la función común (js/hitos-sacar-documento.js): la tarea que se marcó
         con el documento se queda marcada, con su aviso y «Desmarcar». */
      function accionAsociar(hitoNuevo) {
        return async function () {
          if (hitoNuevo && hitoDelDoc && hitoNuevo.id === hitoDelDoc.id) return;
          try {
            if (hitoNuevo) await HitosSacarDocumento.mover(a, [f.nombre], hitoNuevo);
            else await HitosSacarDocumento.quitar(a, [f.nombre]);   /* ya repinta la tarjeta: sin un segundo pintar a la vez */
          } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
        };
      }

      FichaMenus.montar(ancla, (hitoDelDoc ? [
        { texto: 'Quitar del hito', alPulsar: accionAsociar(null) }, { raya: true }
      ] : []).concat(hitosVisibles.map(function (h) {
        return {
          texto: (hitoDelDoc && hitoDelDoc.id === h.id ? '✓ ' : '') + h.titulo,
          alPulsar: accionAsociar(h)
        };
      })));
    }

    /* Fila 425: «Traer a este hito», lo que hacía el «⋯» de las filas «De otros hitos» de la mesa. Solo se ve
       (`aplicarMarcas`) con un hito abierto a la izquierda del que el documento todavía no es. */
    if (window.HitosSacarDocumento && !esIndice) {
      var traer = entrada('Traer a este hito', 'ficha-documento-traer oculto', 'Apuntar este documento al hito que está abierto a la izquierda', async function () {
        var h = enMesa.idHito && window.Hitos ? Hitos.buscar(enMesa.hitos, enMesa.idHito) : null;
        if (!h) return;
        try { await HitosSacarDocumento.mover(a, [f.nombre], h); }
        catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      });
      enMenu.push(traer);
    }

    /* Fila 280: «Convertir en plantilla» (js/convertir-en-plantilla.js), antes de «Pasar a versiones previas». */
    var cep = cepEstados && cepEstados[f.nombre];
    if (cep && cep.visible && window.ConvertirEnPlantilla) enMenu.push(ConvertirEnPlantilla.botonDeMenu(a, f, cep));

    /* Fila 160: «Pasar a versiones previas», para corregir a mano. */
    if (window.VersionesPrevias && !esIndice) {
      var aPrevias = document.createElement('button');
      aPrevias.type = 'button';
      aPrevias.textContent = 'Pasar a versiones previas';
      aPrevias.onclick = async function () {
        try { await VersionesPrevias.mover(a.handle, f.nombre); U.aviso('Pasado a «Versiones previas».', 'bueno'); }
        catch (e) { U.fallo('No he podido moverlo', e); }
        pintar(a);
      };
      enMenu.push(aPrevias);
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

    /* Fila 239 y 439: lo que ya no entra en el nombre (registro, campos, texto), en gris, tras «Ruta»; largo, se corta con «…». */
    if (lineaDeDatos) fila.insertAdjacentHTML('beforeend', lineaDeDatos);

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

  /* «+ Añadir documento», en la cabecera del bloque (fila 168,
     docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md; antes «Documentos ▾», que abría
     la ventana entera): el mismo cuadro de añadir, directo al selector.
     Se pinta una sola vez por bloque: el `<h3>` no se rehace. */
  function ponerBotonAnadir(bloqueEl, a) {
    if (!bloqueEl) return;
    var titulo = bloqueEl.querySelector('.ficha-titulo');
    if (!titulo) return;
    var viejo = titulo.querySelector('.ficha-documentos-anadir');
    if (viejo) { viejo.onclick = alPulsar; if (window.FichaGenerarDocumento) FichaGenerarDocumento.poner(titulo, a); return; }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-principal ficha-documentos-anadir';
    b.textContent = '+ Añadir documento';
    b.setAttribute('data-ayuda-clave', 'traer-un-documento-del-ordenador-a');
    b.onclick = alPulsar;
    titulo.appendChild(b);
    if (window.FichaGenerarDocumento) FichaGenerarDocumento.poner(titulo, a);
    async function alPulsar() {
      await App.verDocumentos(a, { irDirectoAAnadir: true });
      pintar(a);
    }
  }

  /* «Repartir ficheros entre terceros» (fila 337): en la cabecera del bloque, solo con dos documentos o más
     en un asunto abierto. */
  function ponerBotonRepartir(bloqueEl, a, cuantos) {
    if (!bloqueEl) return;
    var titulo = bloqueEl.querySelector('.ficha-titulo');
    if (!titulo) return;
    var viejo = titulo.querySelector('.ficha-documentos-repartir');
    if (!window.RepartirFicheros || !RepartirFicheros.puede(a, cuantos)) { if (viejo) viejo.remove(); return; }
    var b = viejo || document.createElement('button');
    b.type = 'button';
    b.className = 'boton ficha-documentos-repartir';
    b.textContent = 'Repartir ficheros entre terceros';
    b.setAttribute('data-ayuda-clave', 'un-fichero-por-persona-crea-el');
    b.onclick = function () { RepartirFicheros.abrir({ asunto: a, alTerminar: function () { pintar(a); } }); };
    if (!viejo) titulo.appendChild(b);
  }

  /* Las herramientas de PDF, en una barra encima del documento en el
     visor (fila 168): Separar, Unir, Sacar páginas, Ajustar tamaño y
     Repartir entre terceros, con las mismas condiciones que tenían en el
     menú de la fila. Solo para un PDF abierto desde esta lista. */
  function barraPdf(f, a) {
    if (!window.PdfSepararUnir || !window.PdfHerramientas || !PdfHerramientas.esPdf(f.nombre, '')) return null;
    if (window.IndiceExpediente && IndiceExpediente.es(f.nombre)) return null;
    var barra = document.createElement('div');
    barra.className = 'visor-barra-pdf';
    function botonPdf(texto, ayuda, accion) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton boton-chico';
      boton.title = ayuda;
      boton.textContent = texto;
      boton.onclick = function () {
        accion({
          modo: 'asunto', dir: a.handle, nombre: f.nombre, handle: f.handle, asunto: a,
          alTerminar: function () { pintar(a); }
        });
      };
      barra.appendChild(boton);
    }
    botonPdf('Separar', 'Partirlo en varios documentos', PdfSepararUnir.separar);
    botonPdf('Unir', 'Juntarlo con otro PDF del asunto', PdfSepararUnir.unir);
    botonPdf('Sacar páginas', 'Sacar una copia con solo algunas páginas', PdfSepararUnir.sacarPaginas);
    if (window.PrepararDocumento) {
      botonPdf('Ajustar tamaño', 'Deja hueco arriba para el sello de Séneca y abajo para la firma', PrepararDocumento.abrir);
    }
    if (window.Repartir && Repartir.puede(a)) {
      botonPdf('Repartir entre terceros',
        'Partirlo en trozos, uno por persona, y dejar cada trozo en su propio asunto archivado', Repartir.abrir);
    }
    return barra;
  }

  async function pintar(a) {
    var caja = $('ficha-documentos');
    var cuenta = $('ficha-cuenta-docs');
    if (!caja) return;
    if (marcadosDeAsunto !== a.nombre) { marcadosDeAsunto = a.nombre; marcadosCarpeta = {}; }
    try {
      var lista = (await Carpetas.ficheros(a.handle)).filter(function (f) { return !Carpetas.esFicheroDeGoogle(f.nombre); });   /* fila 456 */
      /* El índice del expediente (fila 137) se ve, pero no cuenta. */
      var sinIndice = window.IndiceExpediente ? IndiceExpediente.fuera(lista) : lista;
      if (cuenta) cuenta.textContent = sinIndice.length || '';
      /* Un bloque vacío ocupa una sola línea, no una tarjeta entera
         (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md, 8). */
      var bloqueEl = caja.closest('.ficha-bloque');
      if (bloqueEl) bloqueEl.classList.toggle('vacio', !lista.length);
      ponerBotonAnadir(bloqueEl, a);
      ponerBotonRepartir(bloqueEl, a, sinIndice.length);   /* fila 337 */
      if (!lista.length) {
        caja.className = 'explica';
        caja.textContent = 'La carpeta todavía está vacía.';
        await pintarPrevias(caja, a);
        return;
      }
      caja.className = 'ficha-documentos';
      caja.innerHTML = '';

      var correos = lista.filter(function (f) { return esDeCorreo(f.nombre); });
      var expediente = lista.filter(function (f) { return !esDeCorreo(f.nombre); });

      var hitos = await hitosParaAsociar(a);
      /* Fila 280: qué documentos pueden convertirse en plantilla (los PDF, si tienen su Word). */
      try { cepEstados = window.ConvertirEnPlantilla ? await ConvertirEnPlantilla.estados(a) : null; } catch (eCep) { cepEstados = null; }

      /* Con un solo grupo no hacen falta rótulos: sobran. */
      var conRotulo = correos.length > 0 && expediente.length > 0;
      grupoDeDocumentos(caja, 'Del expediente', expediente, conRotulo, a, hitos.visibles, hitos.porDocumento);
      grupoDeDocumentos(caja, 'Llegados por correo', correos, conRotulo, a, hitos.visibles, hitos.porDocumento);
      await pintarPrevias(caja, a);
      aplicarMarcas(a);   /* fila 425: «Hito N», casillas y «Traer a este hito» */
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer la carpeta: ' + U.mensajeDeError(e);
    }
  }

  /* Fila 160 (docs/VERSIONES-PREVIAS.md): debajo, en gris, «N versiones
     previas · ver», plegado; cada una con «Abrir» y «Sacar de versiones
     previas». Sin ninguna, no sale. No cuentan en el número del bloque
     ni en el resumen de la tarjeta (clases propias, no `.ficha-documento`). */
  async function pintarPrevias(caja, a) {
    if (!window.VersionesPrevias) return;
    var previas = await VersionesPrevias.listar(a.handle);
    if (!previas.length) return;
    var modo = window.RutaCarpetas ? RutaCarpetas.modoDe(a) : 'abierto';
    var det = document.createElement('details');
    det.className = 'ficha-previas';
    det.innerHTML = '<summary>' + previas.length + (previas.length === 1 ? ' versión previa' : ' versiones previas') + ' · ver</summary>';
    previas.forEach(function (f) {
      var fila = document.createElement('div');
      fila.className = 'ficha-previa-fila';
      var abrir = document.createElement('button');
      abrir.type = 'button'; abrir.className = 'ficha-previa-abrir'; abrir.textContent = f.nombre; abrir.setAttribute('data-ayuda-clave', 'verlo-al-lado-del-programa');
      abrir.onclick = function () { if (window.Visor) Visor.abrir(f.handle, f.nombre, { asunto: a, carpeta: a.handle, modo: modo, subcarpeta: f.carpeta }); };
      var sacar = document.createElement('button');
      sacar.type = 'button'; sacar.textContent = 'Sacar de versiones previas';
      sacar.onclick = async function () {
        try { await VersionesPrevias.sacar(a.handle, f.nombre); U.aviso('Devuelto a la carpeta del asunto.', 'bueno'); }
        catch (e) { U.fallo('No he podido sacarlo', e); }
        pintar(a);
      };
      fila.appendChild(abrir);
      if (window.RutaCarpetas) fila.appendChild(RutaCarpetas.botonDocumento(a, modo, { nombre: f.nombre, subcarpeta: f.carpeta }));   /* fila 423: su nombre real en el disco */
      fila.appendChild(U.menuDeAcciones([sacar]));
      det.appendChild(fila);
    });
    caja.appendChild(det);
  }

  /* Se abre en la columna de la derecha, al lado del programa, para
     poder trabajar con el papel delante. */
  async function abrirDocumento(f, a) {
    if (window.Visor) return window.Visor.abrir(f.handle, f.nombre, { acciones: a ? barraPdf(f, a) : null, asunto: a || null, modo: a && window.RutaCarpetas ? RutaCarpetas.modoDe(a) : '' });
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
    },
    marcarHito: marcarHito
  };
})();
