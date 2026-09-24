/* ============================================================
   otros-del-tercero.js — saltar a otro asunto del mismo tercero,
   y volver.

   17-sep-2026, fila 40, docs/SALTAR-A-OTRO-ASUNTO.md. Hasta ahora el
   bloque "Otros asuntos de este tercero" (en la ficha del asunto) solo
   pintaba texto muerto: aquí se le lleva `listaDeOtros` y
   `pintarOtrosDelTercero` tal cual desde js/ficha-asunto.js (que ya
   pasa de 400 líneas), y se les añade que cada línea se pulse y abra
   la ficha de ese asunto. Mismo patrón que js/relacionados.js: la
   ficha solo cuelga el hueco (`#ficha-otros`) y llama aquí.

   También el botón "← Volver a [asunto de partida]" que sale arriba
   en la ficha a la que se ha saltado: saltando varias veces seguidas
   (A → B → C), sigue apuntando siempre al asunto de partida (A), no a
   una cadena de vueltas.

   Cómo se abre cada asunto:
   - Uno ABIERTO: se busca por nombre en App.E.listaAbiertos, igual que
     `irAlCandidatoAbierto` en js/duplicados.js.
   - Uno del ARCHIVO: NO se llama a App.verArchivo (recorre el ARCHIVO
     entero: la operación más cara de la aplicación). Como aquí ya se
     sabe la categoría y el tercero, el objeto se monta a mano, con una
     sola lectura de carpeta, igual que hace App.verArchivo
     (js/archivo-personas.js) para cada asunto suyo.

   Saltar nunca debe romper la ficha: todo dentro de try/catch, y si
   algo falla, un aviso de una línea y no se navega a ningún sitio roto.
   ============================================================ */
var OtrosDelTercero = (function () {

  /* El asunto de partida: { nombre, modo, categoria, tercero }, o null
     si no se ha saltado todavía. Se guarda la PRIMERA vez que se
     salta, y no se sustituye hasta que se olvida (Volver a la lista,
     el propio botón de vuelta, o abrir cualquier ficha desde otro
     sitio: la lista, "Qué me toca", duplicados, Por clasificar). */
  var origen = null;

  /* Bandera interna: mientras este módulo está llamando a
     App.abrirFicha (para saltar o para volver), la envoltura de más
     abajo no debe olvidar el origen que se acaba de fijar. */
  var saltandoDesdeAqui = false;

  /* ==========================================================
     EL BLOQUE "OTROS ASUNTOS DE ESTE TERCERO"
     ========================================================== */

  function listaDeOtros(titulo, nombres, tipo, archivado) {
    if (!nombres.length) return '';
    return '<div class="otros-grupo"><div class="otros-rotulo">' + U.escapar(titulo) + '</div>' +
      nombres.slice(0, 12).map(function (n) {
        var igual = tipo && window.Duplicados &&
                    U.normalizar(window.Duplicados.tipoDeNombre(n)) === U.normalizar(tipo);
        return '<button type="button" class="otros-asunto' + (igual ? ' otros-mismo-tipo' : '') + '" ' +
               'data-nombre="' + U.escapar(n) + '" data-archivado="' + (archivado ? '1' : '0') + '">' +
               U.escapar(n) + '</button>';
      }).join('') +
      (nombres.length > 12 ? '<p class="nota">Y ' + (nombres.length - 12) + ' más.</p>' : '') +
      '</div>';
  }

  /* `a` es el asunto de la ficha que se está pintando; `modoActual` es
     'abierto' o 'archivado'; `datos` trae la categoria, el tercero
     (`nombreDelTercero(a)`, que se queda en js/ficha-asunto.js porque
     también la usa "Lo pide") y el tipo, ya calculados allí. */
  /* La cuenta de verdad (la lista solo enseña los doce primeros de cada
     grupo), para el resumen de su tarjeta (fila 107, js/ficha-tarjetas.js). */
  function resumenDeOtros(caja, n) {
    caja.dataset.cuenta = String(n);
  }

  async function pintarEnFicha(caja, a, modoActual, datos) {
    if (!caja) return;
    var categoria = datos.categoria;
    var quien = datos.tercero;
    var tipo = datos.tipo;

    if (!window.Duplicados || !categoria || !quien) {
      caja.className = 'explica';
      caja.textContent = 'No se sabe de qué tercero es este asunto, así que no se puede buscar.';
      resumenDeOtros(caja, 0);
      return;
    }

    var infoOrigen = { nombre: a.nombre, modo: modoActual, categoria: categoria, tercero: quien };

    try {
      var todo = await window.Duplicados.delTercero(categoria, quien);
      var fuera = function (n) { return n !== a.nombre; };
      var abiertos = todo.abiertos.filter(fuera);
      var archivados = todo.archivados.filter(fuera);

      if (!abiertos.length && !archivados.length) {
        caja.className = 'explica';
        caja.textContent = 'Es el único asunto de ' + quien + '.';
        resumenDeOtros(caja, 0);
        return;
      }
      caja.className = 'otros-lista';
      caja.innerHTML = listaDeOtros('Abiertos', abiertos, tipo, false) +
                       listaDeOtros('En el archivo', archivados, tipo, true);
      resumenDeOtros(caja, abiertos.length + archivados.length);

      Array.prototype.forEach.call(caja.querySelectorAll('.otros-asunto'), function (b) {
        b.onclick = function () {
          saltar(b.dataset.nombre, categoria, quien, b.dataset.archivado === '1', infoOrigen);
        };
      });
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido mirar el archivo: ' + U.mensajeDeError(e);
      resumenDeOtros(caja, 0);
    }
  }

  /* ==========================================================
     ABRIR UN ASUNTO (ABIERTO O DEL ARCHIVO)
     ========================================================== */

  function buscarAbierto(nombre) {
    return (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombre; })[0] || null;
  }

  /* El objeto de un asunto del ARCHIVO, montado a mano si hace falta:
     una sola lectura de carpeta, nunca App.verArchivo. Si ya está en
     App.E.listaArchivo (porque la pantalla ARCHIVO ya se leyó), se usa
     ese mismo objeto, tal cual. */
  async function montarArchivado(nombre, categoria, tercero) {
    var existente = (App.E.listaArchivo || []).filter(function (x) { return x.nombre === nombre; })[0];
    if (existente) {
      if (window.FichaArchivo) await FichaArchivo.completar(existente);
      return existente;
    }

    var padre = await window.Duplicados.carpetaDelTercero(categoria, tercero);
    if (!padre) return null;
    var handle = await padre.getDirectoryHandle(nombre);
    var objeto = {
      nombre: nombre, handle: handle, padre: padre,
      ruta: categoria + ' / ' + tercero,
      leido: Nombres.leer(nombre, App.E.tipos),
      /* Fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): la ficha de
         un archivado ya no vive en App.E.registro.asuntos, se lee de
         su propia carpeta, que ya se tiene aquí mismo. */
      ficha: {},
      busca: U.normalizar(nombre + ' ' + categoria + ' ' + tercero)
    };
    if (window.FichaArchivo) await FichaArchivo.completar(objeto);
    return objeto;
  }

  /* Llama a App.abrirFicha marcando que la llamada es de este módulo,
     para que la envoltura de más abajo no olvide el origen que se
     acaba de fijar. */
  function abrirFicha(a, modo) {
    saltandoDesdeAqui = true;
    try { App.abrirFicha(a, modo); }
    finally { saltandoDesdeAqui = false; }
  }

  async function saltar(nombre, categoria, tercero, archivado, infoOrigen) {
    if (!origen) origen = infoOrigen;
    try {
      if (archivado) {
        var objeto = await montarArchivado(nombre, categoria, tercero);
        if (!objeto) throw new Error('ya no está en el archivo');
        abrirFicha(objeto, 'archivado');
      } else {
        var a = buscarAbierto(nombre);
        if (!a) throw new Error('ya no está abierto: puede que se haya archivado desde otro ordenador');
        abrirFicha(a, 'abierto');
      }
    } catch (e) {
      U.aviso('No he podido abrir «' + nombre + '»: ' + U.mensajeDeError(e) + '.', 'malo');
    }
  }

  /* ==========================================================
     EL BOTÓN "← VOLVER A …"
     ========================================================== */

  function pintarVuelta(caja, a) {
    if (!caja) return;
    caja.innerHTML = '';
    if (!origen || origen.nombre === a.nombre) return;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'ficha-volver-al-origen';
    boton.className = 'boton boton-volver-origen';
    boton.textContent = '← Volver a ' + origen.nombre;
    boton.title = origen.nombre;
    boton.onclick = volverAlOrigen;
    caja.appendChild(boton);
  }

  async function volverAlOrigen() {
    if (!origen) return;
    var destino = origen;
    origen = null;
    try {
      if (destino.modo === 'archivado') {
        var objeto = await montarArchivado(destino.nombre, destino.categoria, destino.tercero);
        if (!objeto) throw new Error('ya no está');
        abrirFicha(objeto, 'archivado');
      } else {
        var a = buscarAbierto(destino.nombre);
        if (!a) throw new Error('ya no está');
        abrirFicha(a, 'abierto');
      }
    } catch (e) {
      U.aviso('No he podido volver a «' + destino.nombre + '»: puede que ya no esté.', 'malo');
      App.ir(destino.modo === 'archivado' ? 'archivo' : 'abiertos');
    }
  }

  function olvidarOrigen() { origen = null; }

  /* ---------- olvidar el origen al abrir cualquier ficha desde fuera ----------

     Mismo patrón de envolturas de siempre: cada llamada a
     App.abrirFicha que no venga de este módulo (la lista, "Qué me
     toca", el aviso de duplicados, Por clasificar...) olvida el
     origen, para que el botón de vuelta no sobreviva a una navegación
     de verdad. Va aquí dentro, no en una envoltura aparte, porque
     necesita ver `saltandoDesdeAqui` directamente. */
  U.envolver(App, 'App.abrirFicha', 'otros-del-tercero.js', function (comoEra) {
    return function (a, modo) {
      if (!saltandoDesdeAqui) origen = null;
      return comoEra(a, modo);
    };
  });

  return {
    pintarEnFicha: pintarEnFicha,
    pintarVuelta: pintarVuelta,
    olvidarOrigen: olvidarOrigen,
    montarArchivado: montarArchivado   /* fila 119: js/duplicados.js */
  };
})();
window.OtrosDelTercero = OtrosDelTercero;
