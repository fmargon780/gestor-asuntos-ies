/* ============================================================
   registro-sellado.js — ver un papel que ya trae el sello del
   registro, dentro de la propia carpeta del asunto, y colocarlo sin
   duplicarlo.

   Acordado con Francisco el 17-sep-2026, fila 20 de docs/COLA.md
   (docs/REGISTRO-SIN-DUPLICAR.md). Antes había que avisar primero
   (pulsar Registrar) y buscar el papel sellado después, aunque ya
   estuviera en la carpeta, y al final quedaban dos ficheros del mismo
   papel. Aquí se le da la vuelta: se mira la carpeta, y si hay un PDF
   con sello que no tiene el nombre que pone la aplicación, se
   pregunta de qué documento es, se renombra ese PDF con el nombre que
   le toca y el documento viejo se manda a la papelera.

   Lo que ya mira cada PDF (`js/registro-lector.js`) no cambia: esto
   solo decide CUÁNDO hace falta mirarlo y QUÉ hacer si trae sello.
   ============================================================ */
var RegistroSellado = (function () {

  /* ---------- memoria de este ordenador ----------

     No va en los ficheros compartidos: cada ordenador se acuerda por
     su cuenta de qué PDF ya ha mirado, para no leerlos otra vez cada
     vez que se abre el asunto. Se guarda el nombre y el tamaño de
     cada uno (por si dos ficheros distintos comparten nombre en
     asuntos distintos, o el mismo nombre cambia de contenido), y si
     tenía sello o no. */

  function claveAlmacen(asunto) { return 'sellos-mirados:' + asunto.nombre; }

  async function leerMemoria(asunto) {
    var m = await Almacen.leer(claveAlmacen(asunto));
    return m || {};
  }

  function guardarMemoria(asunto, mapa) {
    return Almacen.guardar(claveAlmacen(asunto), mapa);
  }

  function claveDe(nombre, tamano) { return nombre + '|' + tamano; }

  /* ---------- qué hay que leer, y qué queda por resolver ----------

     Sin efectos ni disco: reciben lo que ya se ha listado y deciden.
     Así se pueden probar solas (pruebas/registro-sin-duplicar.mjs). */

  function pendientesDeLeer(pdfs, memoria) {
    return pdfs.filter(function (f) {
      if (Documentos.pareceDeLaAplicacion(f.nombre)) return false;
      return !memoria[claveDe(f.nombre, f.tamano)];
    });
  }

  function pendientesDeResolver(pdfs, memoria) {
    return pdfs.filter(function (f) {
      var entrada = memoria[claveDe(f.nombre, f.tamano)];
      return !!(entrada && entrada.sello && !entrada.ignorado);
    });
  }

  /* Lee el sello de los que hagan falta y deja la memoria al día.
     `leerSelloDe(f)` es quien de verdad abre el PDF: en la aplicación
     es RegistroLector.leerSello; en las pruebas, una función simulada. */
  async function actualizarMemoria(asunto, pdfs, leerSelloDe) {
    var memoria = await leerMemoria(asunto);
    var porLeer = pendientesDeLeer(pdfs, memoria);
    if (!porLeer.length) return memoria;
    for (var i = 0; i < porLeer.length; i++) {
      var f = porLeer[i];
      var sello = await leerSelloDe(f);
      memoria[claveDe(f.nombre, f.tamano)] = { sello: sello || null, ignorado: false };
    }
    await guardarMemoria(asunto, memoria);
    return memoria;
  }

  /* ---------- lo que usa la ficha del asunto ---------- */

  /* Los PDF de la carpeta con sello, sin resolver todavía. Cada uno
     lleva `nombre` y `sello` (lo que ha leído RegistroLector). */
  async function detectar(asunto) {
    if (!window.RegistroLector) return [];
    var lista = await Carpetas.ficheros(asunto.handle);
    var pdfs = [];
    for (var i = 0; i < lista.length; i++) {
      if (!/\.pdf$/i.test(lista[i].nombre)) continue;
      var fichero = await lista[i].handle.getFile();
      pdfs.push({ nombre: lista[i].nombre, handle: lista[i].handle, tamano: fichero.size });
    }
    var candidatos = pdfs.filter(function (f) { return !Documentos.pareceDeLaAplicacion(f.nombre); });
    if (!candidatos.length) return [];

    var memoria = await actualizarMemoria(asunto, candidatos, async function (f) {
      try { return await RegistroLector.leerSello(await f.handle.getFile()); }
      catch (e) { return null; }
    });

    return pendientesDeResolver(candidatos, memoria).map(function (f) {
      return { nombre: f.nombre, sello: memoria[claveDe(f.nombre, f.tamano)].sello };
    });
  }

  /* "No es un registro": deja de preguntar por este PDF, sin tocarlo. */
  async function marcarIgnorado(asunto, nombrePdf) {
    var lista = await Carpetas.ficheros(asunto.handle);
    var f = lista.filter(function (x) { return x.nombre === nombrePdf; })[0];
    if (!f) return;
    var fichero = await f.handle.getFile();
    var memoria = await leerMemoria(asunto);
    var clave = claveDe(nombrePdf, fichero.size);
    if (!memoria[clave]) return;
    memoria[clave].ignorado = true;
    await guardarMemoria(asunto, memoria);
  }

  /* ---------- el nombre nuevo, igual que el botón Registrar ----------

     Mismo cálculo que js/registro.js: la fecha y el tipo se leen del
     nombre del documento original, el código sale del sello, y el
     nombre se monta con Nombres.montarDocumento. Sin efectos: se
     puede probar sola. */
  function nombreParaSello(nombreOriginal, sello) {
    var previo = Documentos.leerNombre(nombreOriginal);
    if (!previo.fecha || !previo.tipo) return '';
    var codigo = Nombres.codigoRegistro({
      ano: sello.anio, sentido: sello.tipo, modo: sello.serie, numero: sello.numero
    });
    if (!codigo) return '';
    return Nombres.montarDocumento({
      fecha: previo.fecha, codigo: codigo, tipo: previo.tipo, curso: previo.curso,
      extension: Nombres.extensionDe(nombreOriginal)
    });
  }

  function hayColision(nombresExistentes, nombreNuevo) {
    return nombresExistentes.indexOf(nombreNuevo) !== -1;
  }

  /* ---------- asociar el sello a un documento ----------

     Renombra el PDF sellado con el nombre que le toca, manda el
     documento viejo (el que se subió sin sellar) a la papelera, y
     apunta la nota de registro, sustituyendo la anterior si la había
     (js/notas.js, sustituir). No se crea ningún fichero nuevo. */
  async function asociar(asunto, nombrePdf, nombreDocumentoOriginal, sello) {
    var nombreNuevo = nombreParaSello(nombreDocumentoOriginal, sello);
    if (!nombreNuevo) {
      U.aviso('Ese documento no tiene fecha ni tipo reconocibles en su nombre: no sé qué ' +
              'ponerle a la copia registrada.', 'malo');
      return false;
    }

    try {
      var yaEsta = await Carpetas.ficheros(asunto.handle);
      var nombres = yaEsta.map(function (f) { return f.nombre; })
        .filter(function (n) { return n !== nombrePdf; });
      if (hayColision(nombres, nombreNuevo)) {
        U.aviso('Ya hay un documento con ese nombre en la carpeta: no se ha tocado nada.', 'malo');
        return false;
      }

      await Carpetas.renombrarFichero(asunto.handle, nombrePdf, nombreNuevo);
      await Papelera.mandarDocumentoDeAsunto(asunto, nombreDocumentoOriginal);

      var codigo = (nombreNuevo.match(/^\d{6}\s+(\S+)/) || [])[1] || '';
      var fechaSello = sello.fecha ? ' el ' + sello.fecha : '';
      await window.Notas.sustituir(asunto,
        'Registrado ' + codigo + fechaSello + ' · ' + nombreDocumentoOriginal,
        'registroDeDocumento', nombreDocumentoOriginal);

      U.aviso('Documento registrado.', 'bueno');
      return true;
    } catch (e) {
      U.aviso('No he podido colocarlo: ' + e.message, 'malo');
      return false;
    }
  }

  return {
    detectar: detectar,
    marcarIgnorado: marcarIgnorado,
    asociar: asociar,
    nombreParaSello: nombreParaSello,
    hayColision: hayColision,
    pendientesDeLeer: pendientesDeLeer,
    pendientesDeResolver: pendientesDeResolver
  };
})();
