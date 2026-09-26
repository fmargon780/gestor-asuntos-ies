/* ============================================================
   archivo-indice-construir.js — recorrer el ARCHIVO entero para
   reconstruir el índice, o para el recuento barato que dice si se ha
   quedado corto.

   Sacado de js/archivo-indice.js en la fila 177
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hacía:
   solo llama a las funciones públicas de `IndiceArchivo`
   (`entradaDe`, `guardar`), así que no hace falta compartir nada por
   dentro. Se carga justo después de js/archivo-indice.js.
   ============================================================ */
(function () {
  if (typeof IndiceArchivo === 'undefined') return;

  /* ¿Esta carpeta, justo debajo de la categoría o de un tercero, es
     un asunto (tiene fecha y tipo) en vez de una carpeta normal? El
     mismo criterio para los dos casos descolocados del punto 5. */
  function pareceAsunto(nombreCarpeta, tipos) {
    var leido = Nombres.leer(nombreCarpeta, tipos);
    return !!(leido.fecha && leido.tipo);
  }

  /* Recorre el archivo entero UNA VEZ y devuelve el índice completo,
     sin guardarlo. `onProgreso(nombreCategoria, totalHastaAhora)` se
     llama al terminar cada categoría, para la línea de estado. */
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
             (punto 5.1 del encargo): tercero vacío. */
          asuntos.push(await IndiceArchivo.entradaDe(
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
            asuntos.push(await IndiceArchivo.entradaDe(
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
              asuntos.push(await IndiceArchivo.entradaDe(
                item4.handle, item4.nombre, cat.nombre, item2.nombre, rutaExtra, rutaExtra, tipos));
            }
          }
          if (!huboAlguno) {
            /* Ni lo uno ni lo otro: se enseña igual, como hacía el
               recorrido de siempre (que tampoco miraba el nombre). */
            asuntos.push(await IndiceArchivo.entradaDe(
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
     índice puede haberse quedado corto. */
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

  function recuentosIguales(a, b) {
    a = a || {}; b = b || {};
    var clavesA = Object.keys(a), clavesB = Object.keys(b);
    if (clavesA.length !== clavesB.length) return false;
    for (var i = 0; i < clavesA.length; i++) {
      if ((a[clavesA[i]] || 0) !== (b[clavesA[i]] || 0)) return false;
    }
    return true;
  }

  Object.assign(window.IndiceArchivo, {
    construir: construir, recuentoActual: recuentoActual, recuentosIguales: recuentosIguales
  });
})();
