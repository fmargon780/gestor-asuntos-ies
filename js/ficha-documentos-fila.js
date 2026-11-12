/* ============================================================
   ficha-documentos-fila.js — la fila de cada documento de la carpeta en la ficha del asunto (fila 560,
   docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/ficha-documentos.js sin cambiar nada de lo que se ve).

   Es la función `filaDeDocumento` de siempre, movida tal cual. Lo que necesita del resto (las marcas, el hito
   abierto en la mesa, los estados de «convertir en plantilla», el aviso de borrado, repintar y abrir) se lo pasa
   js/ficha-documentos.js en `I`, que es `FichaDocumentos._interno` (el estado común sigue viviendo allí).

   Se carga antes de js/ficha-documentos.js.
   ============================================================ */
var FichaDocumentosFila = (function () {

  /* `hitosVisibles`/`hitoDe` (18-sep-2026, fila 58,
     docs/AJUSTES-DE-USO-2026-09-18.md, 6): asociar un documento a un
     hito, desde el propio documento. `hitoDe` es el mapa nombre de
     documento → hito, calculado una vez por `pintar()` a partir de los
     mismos `h.documentos` que ya guarda "Apuntar un documento"
     (js/hitos-documentos.js): ningún dato nuevo, ningún sitio nuevo
     donde guardarlo. */
  function crear(I, f, a, hitosVisibles, hitoDe) {
    var ext = Nombres.extensionDe(f.nombre);
    var sinSellar = I.esSinSellar(f.nombre);
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
    b.onclick = function () { I.abrirDocumento(f, a); };

    var fila = document.createElement('div');
    fila.className = 'ficha-documento-fila';
    fila.dataset.doc = f.nombre;
    /* Fila 425: la casilla de adjuntar, solo con un hito abierto a la izquierda (la lista le pone `con-casillas`). */
    if (!esIndice) {
      var casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.className = 'ficha-documento-marca';
      casilla.setAttribute('data-ayuda-clave', 'adjuntar-al-correo-del-hito');
      casilla.checked = !!I.marcados()[f.nombre];
      casilla.onchange = function () {
        if (casilla.checked) I.marcados()[f.nombre] = true; else delete I.marcados()[f.nombre];
        if (window.HitoMesaDocumentos && HitoMesaDocumentos.alMarcar) HitoMesaDocumentos.alMarcar();
      };
      fila.appendChild(casilla);
    }
    fila.appendChild(b);

    /* Fila 423: «Ruta», pegado al nombre: copia la ruta entera del documento. Fila 439: es lo único que
       queda a la vista; lo demás, en el menú ⋮ de la derecha, y los datos, en gris, tras «Ruta». */
    if (window.RutaCarpetas) fila.appendChild(RutaCarpetas.botonDocumento(a, RutaCarpetas.modoDe(a), { nombre: f.nombre }));
    /* Fila 627: «Extracto», al lado de «Ruta»: copia el extracto de este documento para el registro de Séneca (en todos, también los registrados). */
    if (window.ExtractoDocumento) fila.appendChild(ExtractoDocumento.boton(a, f.nombre));

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
      var pendiente = window.AvisosFalta ? AvisosFalta.sinRegistrar(a, hitosVisibles || [], f.nombre) : Registro.pendiente(a, f.nombre);   /* fila 524: también si cuelga de una tarea de registrar sin hacer */
      if (pendiente) {
        var marca = document.createElement('span');
        marca.className = 'marca-sin-registrar';
        marca.textContent = 'Sin registrar';
        fila.appendChild(marca);
      }

      var reg = entrada('Registrar', 'ficha-documento-registrar', 'Dar registro de entrada o salida a este documento', async function () {
        reg.disabled = true;
        await Registro.abrirCuadro(a, f.nombre, function () { I.pintar(a); });
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
        I.pintar(a);
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
        var h = I.enMesa().idHito && window.Hitos ? Hitos.buscar(I.enMesa().hitos, I.enMesa().idHito) : null;
        if (!h) return;
        try { await HitosSacarDocumento.mover(a, [f.nombre], h); }
        catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      });
      enMenu.push(traer);
    }

    /* Fila 280: «Convertir en plantilla» (js/convertir-en-plantilla.js), antes de «Pasar a versiones previas». */
    var cep = I.cepEstados() && I.cepEstados()[f.nombre];
    if (cep && cep.visible && window.ConvertirEnPlantilla) enMenu.push(ConvertirEnPlantilla.botonDeMenu(a, f, cep));

    /* Fila 160: «Pasar a versiones previas», para corregir a mano. */
    if (window.VersionesPrevias && !esIndice) {
      var aPrevias = document.createElement('button');
      aPrevias.type = 'button';
      aPrevias.textContent = 'Pasar a versiones previas';
      aPrevias.onclick = async function () {
        try { await VersionesPrevias.mover(a.handle, f.nombre); U.aviso('Pasado a «Versiones previas».', 'bueno'); }
        catch (e) { U.fallo('No he podido moverlo', e); }
        I.pintar(a);
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
          I.pintar(a);
          if (I.alBorrar()) await I.alBorrar()();
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

  return { crear: crear };
})();
window.FichaDocumentosFila = FichaDocumentosFila;
