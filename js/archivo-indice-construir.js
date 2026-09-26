/* ============================================================
   archivo-indice-construir.js — recorrer el disco entero y reconstruir
   el índice del ARCHIVO (fila 177, docs/ARCHIVO-POR-CURSO-Y-RUTAS.md:
   `js/archivo-indice.js` llegó a 435 líneas y se partió en dos; este
   trozo es "recorrer el disco y reconstruir", el otro es "leer,
   guardar, añadir, quitar"). Añade `construir` y `recuentoActual` al
   mismo `IndiceArchivo` de siempre: quien lo usa no nota el cambio.

   Va cargado justo después de `js/archivo-indice.js`, en el mismo
   sitio donde antes iba todo junto: después de `js/carpetas.js`,
   `js/nombres.js` y `js/nucleo.js`, y antes de `js/asuntos-archivar.js`
   y `js/archivo-personas.js`.
   ============================================================ */
(function () {

  /* ==========================================================
     LOS DOCUMENTOS DE LA CARPETA Y SUS REGISTROS DE SÉNECA
     ========================================================== */

  /* Solo los nombres, nunca el contenido: la carpeta del asunto y un
     nivel más, si tiene subcarpetas (ficheros escaneados aparte, por
     ejemplo). */
  async function nombresDeDocumentos(handle) {
    var salida = [];
    var contenido = await Carpetas.contenido(handle);
    contenido.ficheros.forEach(function (f) {
      if (Carpetas.esCarpetaTemporalDeSincronizacion(f.nombre)) return;
      if (window.IndiceExpediente && IndiceExpediente.es(f.nombre)) return;   /* fila 137 */
      salida.push(f.nombre);
    });
    for (var i = 0; i < contenido.carpetas.length; i++) {
      var sub = contenido.carpetas[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(sub.nombre)) continue;
      var subFicheros = await Carpetas.ficheros(sub.handle);
      subFicheros.forEach(function (f) { salida.push(f.nombre); });
    }
    return salida;
  }

  /* 26EM1234: año + serie (E/S) + serie (M/A) + hasta seis cifras.
     El mismo patrón que ya reconoce `js/plantillas.js`
     (`ultimoRegistroDe`), pero buscado en cualquier sitio del nombre,
     no solo justo detrás de la fecha. */
  var RE_REGISTRO = /\d{2}[ES][MA]\d{4,6}/g;

  function registrosDeNombres(nombres) {
    var vistos = {}, salida = [];
    (nombres || []).forEach(function (n) {
      var m = String(n || '').match(RE_REGISTRO);
      if (!m) return;
      m.forEach(function (r) { if (!vistos[r]) { vistos[r] = true; salida.push(r); } });
    });
    return salida;
  }

  /* ==========================================================
     UNA ENTRADA DEL ÍNDICE
     ========================================================== */

  /* Lo poco de la ficha que hace falta para pintar la tarjeta y para
     buscar (fila 64, docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): desde
     que la ficha de un archivado vive en su propia carpeta
     (`_ficha.json`) y no en `asuntos.json`, se guarda aquí, tomada de
     la ficha en el momento de archivar o releída de `_ficha.json` al
     reconstruir el índice. */
  function camposDeFicha(ficha) {
    var campos = (ficha && ficha.campos) || {};
    return Object.keys(campos).map(function (c) { return campos[c] && campos[c].valor; })
      .filter(Boolean).join(' ');
  }

  function relacionadosDeFicha(ficha) {
    return ((ficha && ficha.relacionados) || []).filter(function (r) { return r && r.nombre; });
  }

  /* `handle` es la carpeta del asunto ya localizada; `sueltoEn` es ''
     para un asunto en su sitio, o el texto del punto 5 del encargo de
     la fila 44 para uno descolocado. `fichaConocida` es la ficha en
     memoria, si ya se tiene (al archivar); si no se pasa (al
     reconstruir el índice desde cero), se intenta leer `_ficha.json`
     de la propia carpeta. */
  async function entradaDe(handle, nombre, categoria, tercero, ruta, sueltoEn, tipos, fichaConocida) {
    var leido = Nombres.leer(nombre, tipos);
    var cursoGrupo = Nombres.cursoYGrupoDeResto(leido.resto);
    var documentos = await nombresDeDocumentos(handle);
    var ficha = fichaConocida;
    if (ficha === undefined && window.FichaArchivo) {
      try { ficha = await FichaArchivo.leer(handle); } catch (e) { ficha = null; }
    }
    ficha = ficha || {};
    return {
      nombre: nombre, categoria: categoria, tercero: tercero, ruta: ruta,
      fecha: leido.fecha || '', tipo: leido.tipo || '', reconocido: !!leido.reconocido,
      curso: cursoGrupo.curso, grupo: cursoGrupo.grupo,
      documentos: documentos, registros: registrosDeNombres(documentos),
      sueltoEn: sueltoEn || '',
      situacion: ficha.situacion || '', via: ficha.via || '', viaDato: ficha.viaDato || '',
      /* Fila 129: dónde se quedó al archivar (js/hitos-archivo.js). */
      seQuedoEn: ficha.seQuedoEn || '', terminado: !!ficha.terminado,
      loPideNombre: (ficha.loPide && ficha.loPide.nombre) || '',
      /* Fila 74, docs/CUENTAS-DE-FIN-DE-CURSO.md: categoría y relación
         de quien lo pidió (para agrupar "familia"/"alumnado"/"centro"/
         "empresa" en Cuentas.js, sin guardar su nombre otra vez: ya
         está en loPideNombre, arriba), y las fechas de apertura y
         cierre del asunto (para "cuánto se tarda"). */
      loPideCategoria: (ficha.loPide && ficha.loPide.categoria) || '',
      loPideRelacion: (ficha.loPide && ficha.loPide.relacion) || '',
      abiertoEl: ficha.abiertoEl || '', cerradoEl: ficha.cerradoEl || '',
      relacionados: relacionadosDeFicha(ficha), camposTexto: camposDeFicha(ficha),
      /* Fila 73, docs/BUSCAR-EN-LAS-NOTAS.md: el texto de las notas,
         recortado (Notas.textoParaBuscar ya lo recorta a 2.000
         caracteres), para poder buscar dentro de ellas sin tener que
         abrir la carpeta. */
      notas: window.Notas ? Notas.textoParaBuscar(ficha) : '',
      /* Fila 135: solo si la ficha lo dice (sin el dato, manda el tipo). */
      reservado: typeof ficha.reservado === 'boolean' ? ficha.reservado : undefined,
      /* Fila 136 (js/conservacion.js): el día en que se archivó (sin él,
         se usa la fecha del nombre, como aproximada) y, si se ha pedido
         «Conservar más tiempo», hasta cuándo. */
      archivadoEl: ficha.cerradoEl ? String(ficha.cerradoEl).slice(0, 10) : undefined,
      conservarHasta: ficha.conservarHasta || undefined
    };
  }

  /* ==========================================================
     RECORRER EL ARCHIVO ENTERO (construir el índice, o el
     recuento barato para saber si se ha quedado corto)
     ========================================================== */

  /* ¿Esta carpeta, justo debajo de la categoría o de un tercero, es
     un asunto (tiene fecha y tipo) en vez de una carpeta normal? El
     mismo criterio para los dos casos descolocados del punto 5. */
  function pareceAsunto(nombreCarpeta, tipos) {
    var leido = Nombres.leer(nombreCarpeta, tipos);
    return !!(leido.fecha && leido.tipo);
  }

  /* Recorre el archivo entero UNA VEZ y devuelve el índice completo
     (todos los cursos juntos, tal como antes de la fila 177), sin
     guardarlo: `IndiceArchivo.guardar()` es quien lo parte por curso al
     escribirlo. `onProgreso(nombreCategoria, totalHastaAhora)` se llama
     al terminar cada categoría, para la línea de estado. */
  async function construir(onProgreso) {
    var archivo = App.E.archivo;
    var tipos = App.E.tipos;
    var categorias = await Carpetas.subcarpetas(archivo);
    var asuntos = [];
    var recuento = {};

    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(cat.nombre)) continue;
      var nivel2 = await Carpetas.subcarpetas(cat.handle);
      var contadorTerceros = 0;

      for (var j = 0; j < nivel2.length; j++) {
        var item2 = nivel2[j];
        if (Carpetas.esCarpetaTemporalDeSincronizacion(item2.nombre)) continue;

        if (pareceAsunto(item2.nombre, tipos)) {
          /* Un asunto archivado a mano justo debajo de la categoría
             (punto 5.1 del encargo de la fila 44): tercero vacío. */
          asuntos.push(await entradaDe(
            item2.handle, item2.nombre, cat.nombre, '', cat.nombre, 'bajo la categoría', tipos));
          continue;
        }

        contadorTerceros++;
        var nivel3 = await Carpetas.subcarpetas(item2.handle);
        var rutaTercero = cat.nombre + ' / ' + item2.nombre;

        for (var k = 0; k < nivel3.length; k++) {
          var item3 = nivel3[k];
          if (Carpetas.esCarpetaTemporalDeSincronizacion(item3.nombre)) continue;

          if (pareceAsunto(item3.nombre, tipos)) {
            asuntos.push(await entradaDe(
              item3.handle, item3.nombre, cat.nombre, item2.nombre, rutaTercero, '', tipos));
            continue;
          }

          /* No parece un asunto: puede ser una carpeta de más que
             esconde el asunto un nivel más adentro (punto 5.2). Se
             mira un nivel más antes de rendirse. */
          var nivel4 = await Carpetas.subcarpetas(item3.handle);
          var huboAlguno = false;
          var rutaExtra = rutaTercero + ' / ' + item3.nombre;
          for (var m = 0; m < nivel4.length; m++) {
            var item4 = nivel4[m];
            if (Carpetas.esCarpetaTemporalDeSincronizacion(item4.nombre)) continue;
            if (pareceAsunto(item4.nombre, tipos)) {
              huboAlguno = true;
              asuntos.push(await entradaDe(
                item4.handle, item4.nombre, cat.nombre, item2.nombre, rutaExtra, rutaExtra, tipos));
            }
          }
          if (!huboAlguno) {
            /* Ni lo uno ni lo otro: se enseña igual, como hacía el
               recorrido de siempre (que tampoco miraba el nombre). */
            asuntos.push(await entradaDe(
              item3.handle, item3.nombre, cat.nombre, item2.nombre, rutaTercero, '', tipos));
          }
        }
      }

      recuento[cat.nombre] = contadorTerceros;
      if (onProgreso) onProgreso(cat.nombre, asuntos.length);
    }

    return {
      version: IndiceArchivo.VERSION, hechoEl: U.ahora(), hechoPor: (App.E && App.E.usuario) || '',
      recuento: recuento, asuntos: asuntos
    };
  }

  /* El recuento de ahora mismo, barato: solo categorías y carpetas de
     tercero (un nivel), sin entrar en los asuntos. Para saber si el
     índice guardado se ha quedado corto: si no cuadra con el
     `recuento` del resumen, puede que falte algo. */
  async function recuentoActual() {
    var archivo = App.E.archivo;
    var tipos = App.E.tipos;
    var categorias = await Carpetas.subcarpetas(archivo);
    var recuento = {};
    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(cat.nombre)) continue;
      var nivel2 = await Carpetas.subcarpetas(cat.handle);
      var n = 0;
      for (var j = 0; j < nivel2.length; j++) {
        var item2 = nivel2[j];
        if (Carpetas.esCarpetaTemporalDeSincronizacion(item2.nombre)) continue;
        if (!pareceAsunto(item2.nombre, tipos)) n++;
      }
      recuento[cat.nombre] = n;
    }
    return recuento;
  }

  Object.assign(window.IndiceArchivo, {
    construir: construir, recuentoActual: recuentoActual,
    /* Por si alguna prueba quiere fabricar una entrada suelta sin
       recorrer disco ninguno. */
    entradaDe: entradaDe
  });
})();
