/* ============================================================
   unir-asuntos-unir.js — unir de verdad dos o más asuntos duplicados (la lógica de siempre, sin tocar). Salió de js/unir-asuntos.js en la fila 133 (24-sep-2026,
   docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada: comparte lo
   necesario por `UnirAsuntos._interno`. Se carga justo después de
   js/unir-asuntos-pantalla.js.
   ============================================================ */
(function () {
  var I = window.UnirAsuntos._interno;
  function $(id) { return document.getElementById(id); }

  /* ---------- unir: la misma lógica de siempre, sin tocar ---------- */

  function porNombreLargo(a, b) { return b.nombre.length - a.nombre.length; }

  async function elegirQuienSeQueda(grupo) {
    var ordenado = grupo.slice().sort(porNombreLargo);
    var opciones = ordenado.map(function (a, i) {
      return '<label class="dup-opcion"><input type="radio" name="unir-cual" value="' + i + '"' +
             (i === 0 ? ' checked' : '') + '> ' + U.escapar(a.nombre) + '</label>';
    }).join('');
    var ok = await U.preguntar('¿Cuál se queda?',
      '<p class="explica">Los documentos y las notas del otro pasan a este, y el otro ' +
      'se borra. Nada se pierde: solo queda una carpeta en vez de dos.</p>' + opciones,
      'Unir');
    if (!ok) return null;
    var marcado = document.querySelector('input[name="unir-cual"]:checked');
    var indice = marcado ? parseInt(marcado.value, 10) : 0;
    return ordenado[indice] || ordenado[0];
  }

  function fechaDeHoy() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  async function fusionarFicha(seQueda, seVa, fechaTexto) {
    await App.guardarRegistroFresco(function (registro) {
      var fichaQueda = registro.asuntos[seQueda.nombre] || {};
      var fichaVa = registro.asuntos[seVa.nombre] || {};

      var notas = (Array.isArray(fichaQueda.notas) ? fichaQueda.notas.slice() : [])
        .concat(Array.isArray(fichaVa.notas) ? fichaVa.notas.slice() : [])
        .sort(function (x, y) { return String(x.cuando || '').localeCompare(String(y.cuando || '')); });

      var pasosHechos = (fichaQueda.pasosHechos && fichaQueda.pasosHechos.length)
        ? fichaQueda.pasosHechos : (fichaVa.pasosHechos || []);
      var pasosElegidos = (fichaQueda.pasosElegidos && Object.keys(fichaQueda.pasosElegidos).length)
        ? fichaQueda.pasosElegidos : (fichaVa.pasosElegidos || {});

      notas.push({
        texto: 'Unido con la carpeta «' + seVa.nombre + '» el ' + fechaTexto,
        quien: App.E.usuario || '',
        cuando: U.ahora()
      });

      registro.asuntos[seQueda.nombre] = Object.assign({}, fichaQueda, {
        notas: notas, pasosHechos: pasosHechos, pasosElegidos: pasosElegidos
      });
      delete registro.asuntos[seVa.nombre];
    });

    /* Los hitos y la señal de presencia de "seVa" viajan con él: se
       fusionan con los de "seQueda", sin perder ninguno (fila 62,
       docs/RENOMBRAR-SIN-PERDER-HITOS.md). */
    await AsuntoRenombrar.fusionar(seQueda.nombre, seVa.nombre);
  }

  /* Un documento con el mismo nombre en las dos carpetas ya no para la
     unión (fila 75, docs/HUECOS-ENCONTRADOS-FILA-69.md, 1: el hueco
     que dejó la fila 69 entre lo que decía el encargo y lo que hacía
     de verdad el código): entra con " (2)", " (3)"..., el mismo
     patrón que ya usa Carpetas.fusionarEn al archivar sobre un
     destino que ya existe. Se apunta cada renombrado, para avisar al
     terminar de cuáles conviene revisar a mano. */
  async function moverConNombreLibre(seVa, nombreFichero, seQueda, renombrados) {
    var destino = seQueda.handle;
    var nombreFinal = nombreFichero;
    if (await Carpetas.existeFichero(destino, nombreFichero)) {
      nombreFinal = await Carpetas.nombreLibreConSufijo(destino, nombreFichero);
      renombrados.push({ de: nombreFichero, a: nombreFinal, deAsunto: seVa.nombre });
    }
    await Carpetas.moverFichero(seVa.handle, nombreFichero, destino, nombreFinal);
  }

  async function unirAsuntos(grupo) {
    var seQueda = await elegirQuienSeQueda(grupo);
    if (!seQueda) return;
    var demas = grupo.filter(function (a) { return a.nombre !== seQueda.nombre; });

    /* Mientras dura, los asuntos del grupo están ocupados (fila 100). */
    var nombres = grupo.map(function (a) { return a.nombre; });
    nombres.forEach(function (n) { App.E.ocupados[n] = true; });
    try { await unirYa(seQueda, demas); }
    finally { nombres.forEach(function (n) { delete App.E.ocupados[n]; }); }
  }

  /* Lo principal: los documentos (y las subcarpetas, fila 100) y la
     ficha de cada uno pasan al que se queda. Quitar la carpeta vacía
     del que se va es accesorio: si queda algo dentro, ámbar diciendo
     qué carpeta revisar, nunca rojo con todo ya unido. */
  async function unirYa(seQueda, demas) {
    var restos = [];
    try {
      var fechaTexto = fechaDeHoy();
      var renombrados = [];
      for (var j = 0; j < demas.length; j++) {
        var seVa = demas[j];
        var ficheros = await Carpetas.ficheros(seVa.handle);
        for (var k = 0; k < ficheros.length; k++) {
          await moverConNombreLibre(seVa, ficheros[k].nombre, seQueda, renombrados);
        }
        var subcarpetas = await Carpetas.subcarpetas(seVa.handle);
        for (var m = 0; m < subcarpetas.length; m++) {
          var sub = subcarpetas[m].nombre;
          if (Carpetas.esCarpetaTemporalDeSincronizacion(sub)) continue;
          if (await Carpetas.existe(seQueda.handle, sub)) await Carpetas.fusionarEn(seVa.handle, sub, seQueda.handle, sub);
          else await Carpetas.mover(seVa.handle, sub, seQueda.handle);
        }
        await fusionarFicha(seQueda, seVa, fechaTexto);
        try { await App.E.abiertos.removeEntry(seVa.nombre); }
        catch (eQuitar) { restos.push(seVa.nombre); }
      }
    } catch (e) {
      U.fallo('No he podido unirlos', e);
      try { await App.verAbiertos(); } catch (e2) { /* solo pintar */ }
      return;
    }

    try {
      if (restos.length) {
        U.aviso('Asuntos unidos, pero no he podido quitar la carpeta vieja de: ' + restos.join(', ') +
          '. Queda algo dentro (quizá un documento abierto en otro programa): míralo y bórrala a mano.', 'ambar');
      }
      var textoUnidos = renombrados.length
        ? 'Asuntos unidos. ' + renombrados.length + (renombrados.length === 1
            ? ' documento tenía el nombre repetido: se ha guardado con "(N)" al final.'
            : ' documentos tenían el nombre repetido: se han guardado con "(N)" al final.')
        : 'Asuntos unidos.';
      /* Fila 119: con «Ir al asunto» (el que se queda, que ya estaba en la lista). */
      if (window.Navegacion) Navegacion.avisoConIr(textoUnidos, 'bueno', seQueda.nombre);
      else U.aviso(textoUnidos, 'bueno');
      await App.verAbiertos();
      /* Si se ha unido desde la pantalla de Duplicados, se sigue
         viendo esa pantalla con la lista al día: no se saca a nadie
         de donde estaba mirando. */
      if (I.pantallaConstruida && !$('pantalla-duplicados').classList.contains('oculto')) {
        I.pintarPantallaDuplicados();
      }
    } catch (e3) {
      U.accesorio('Asuntos unidos, pero no he podido poner la lista al día. Pulsa Recargar', e3);
    }
  }

  I.unirAsuntos = unirAsuntos;
  /* Para pruebas/unir-asuntos.mjs (fila 69): la unión de verdad. */
  window.UnirAsuntos.unirAsuntos = unirAsuntos;
})();
