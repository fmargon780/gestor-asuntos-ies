/* ============================================================
   ajustes-tipo-comprobacion.js — la lista de comprobación de arriba de
   la pantalla de un tipo (27-sep-2026, fila 198, apartado 1,
   docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md).

   Una línea por cada cosa que conviene rellenar en un tipo de asunto,
   con su casilla marcada o vacía, calculada a partir de lo que ya hay
   guardado (tipo, campos.json, guias.json): no guarda nada, solo lee y
   pinta dentro del hueco `#tipo-asunto-comprobacion` (index.html, justo
   encima de las dos columnas). Cada línea es un botón que abre y
   despliega la sección que toca (`AjustesPlegado.abrirSeccionTipo`).

   La llama `AjustesPlegado.resumirTipo()` cada vez que hay que ponerla
   al día (al pintar la pantalla del tipo y tras cada guardado, con el
   mismo debounce que los resúmenes de las secciones): por eso, igual
   que `ponerResumen()`, solo se vuelve a escribir el contenedor cuando
   la lista calculada cambia de verdad, para no despertar en bucle al
   `MutationObserver` que la llama.
   ============================================================ */
var ListaComprobacionTipo = (function () {

  function $(id) { return document.getElementById(id); }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* El guion de un paso, normalizado (fila 138 y siguientes,
     js/guias-guion.js): así una guía vieja, guardada antes de que
     existiera algún campo, se lee igual que una nueva. */
  function guionDe(paso) {
    var g = (paso && paso.guion) || [];
    return (window.GuiasGuion && GuiasGuion.normalizar) ? GuiasGuion.normalizar(g) : g;
  }

  /* El primer paso (0-based) cuyo guion tiene una tarea con esa acción
     y sin plantilla en la receta; -1 si no hay ninguno así. */
  function primerIncompleto(pasos, accion) {
    for (var i = 0; i < pasos.length; i++) {
      var guion = guionDe(pasos[i]);
      var falta = guion.some(function (g) {
        return g.accion === accion && (!g.receta || !g.receta.plantilla);
      });
      if (falta) return i;
    }
    return -1;
  }

  function algunoConAccion(pasos, accion) {
    return pasos.some(function (p) {
      return guionDe(p).some(function (g) { return g.accion === accion; });
    });
  }

  /* La lista de líneas que aplican a este tipo, ya calculadas. */
  function calcular(tipo) {
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo.tipo)) || [];
    var items = [];

    /* Nombre corto: el tipo siempre tiene nombre (con o sin nombre
       corto explícito: sin él, se usa el de arriba), así que esta
       casilla está siempre marcada. */
    items.push({ id: 'nombre-corto', texto: 'Nombre corto', marcado: true, seccion: 'datos' });

    items.push({ id: 'organo', texto: 'Quién lo encarga',
      marcado: !!(window.TiposOrgano && TiposOrgano.deTipo(tipo)), seccion: 'datos' });

    items.push({ id: 'guia', texto: 'Guía (' + plural(pasos.length, 'hito', 'hitos') + ')',
      marcado: pasos.length > 0, seccion: 'pasos' });

    /* Plantilla de documento: solo si algún hito tiene «Generar un
       documento». */
    if (algunoConAccion(pasos, 'generar')) {
      var faltaDoc = primerIncompleto(pasos, 'generar');
      items.push({ id: 'plantilla-documento',
        texto: faltaDoc === -1 ? 'Plantilla de documento'
          : 'Plantilla de documento — el hito ' + (faltaDoc + 1) + ' la necesita',
        marcado: faltaDoc === -1, seccion: 'pasos' });
    }

    /* Plantilla de correo: por «Comunicar» en algún hito, o por «Al
       cerrar el asunto, avisar a quien lo pide» (fila 195). Si falta
       la plantilla del aviso al cerrar, el enlace lleva a «Al terminar el
       asunto» (ahí está el interruptor, fila 274); si falta la de un hito,
       a "Guía" (ahí está ese hito). */
    if (tipo.avisarLoPideCierre || algunoConAccion(pasos, 'comunicar')) {
      var seccionCorreo = tipo.avisarLoPideCierre ? 'al-terminar' : 'pasos';
      var texto = 'Plantilla de correo', marcado = true;
      if (tipo.avisarLoPideCierre && !tipo.avisarLoPideCierrePlantilla) {
        texto = 'Plantilla de correo — Falta la plantilla del aviso al cerrar';
        marcado = false;
      } else {
        var faltaCorreo = primerIncompleto(pasos, 'comunicar');
        if (faltaCorreo !== -1) {
          texto = 'Plantilla de correo — el hito ' + (faltaCorreo + 1) + ' la necesita';
          marcado = false;
        }
      }
      items.push({ id: 'plantilla-correo', texto: texto, marcado: marcado, seccion: seccionCorreo });
    }

    items.push({ id: 'plazo', texto: 'Plazo', marcado: !!tipo.plazo, seccion: 'plazo' });

    var palabras = tipo.palabrasClave || [];
    items.push({ id: 'palabras-clave', texto: 'Palabras clave (para que la bandeja acierte el tipo)',
      marcado: palabras.length > 0, seccion: 'palabras' });

    var anios = parseInt(tipo.conservarAnios, 10);
    items.push({ id: 'conservacion', texto: 'Plazo de conservación', marcado: anios > 0, seccion: 'datos' });

    return items;
  }

  function pintar(tipo) {
    var cont = $('tipo-asunto-comprobacion');
    if (!cont || !tipo) return;
    var items = calcular(tipo);
    var completo = items.every(function (i) { return i.marcado; });
    var firma = JSON.stringify(completo ? ['completo'] :
      items.map(function (i) { return [i.id, i.marcado, i.texto, i.seccion]; }));
    /* Solo se reescribe si cambia de verdad: igual que `ponerResumen()`
       en js/ajustes-plegado.js, para no autoalimentar el
       MutationObserver que llama a esto tras cada cambio del DOM. */
    if (cont.dataset.firma === firma) return;
    cont.dataset.firma = firma;

    if (completo) {
      cont.innerHTML = '<div class="aviso-bueno">Este tipo está completo</div>';
      return;
    }

    cont.innerHTML = '<div class="tipo-comprobacion">' + items.map(function (i) {
      return '<button type="button" class="tipo-comprobacion-fila' +
        (i.marcado ? ' tipo-comprobacion-hecha' : '') + '" data-seccion="' + U.escapar(i.seccion) + '">' +
        '<span class="tipo-comprobacion-marca">' + (i.marcado ? '✓' : '☐') + '</span> ' +
        '<span class="tipo-comprobacion-texto">' + U.escapar(i.texto) + '</span>' +
        '</button>';
    }).join('') + '</div>';

    Array.prototype.forEach.call(cont.querySelectorAll('.tipo-comprobacion-fila'), function (boton) {
      boton.onclick = function () {
        if (window.AjustesPlegado) AjustesPlegado.abrirSeccionTipo(boton.dataset.seccion);
      };
    });
  }

  return { calcular: calcular, pintar: pintar };
})();
window.ListaComprobacionTipo = ListaComprobacionTipo;
