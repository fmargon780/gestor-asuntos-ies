/* ============================================================
   ficha-plegables.js — los dos bloques de la ficha que casi nunca se
   miran, plegados detrás de su cuenta (18-sep-2026, fila 51,
   docs/FICHA-DISPOSICION.md, 6): "Otros asuntos de este tercero" y
   "Personas y entidades relacionadas".

   El `<details class="ficha-bloque ficha-plegable">` ya estaba escrito
   en css/ficha-asunto.css (líneas 158-168) desde antes de esta fila,
   sin que nadie lo usara: aquí solo se monta con ese molde. El
   contenido de dentro lo sigue pintando exactamente quien pintaba
   antes (`OtrosDelTercero.pintarEnFicha`, `Relacionados.pintarEnFicha`
   en js/ficha-asunto.js): este fichero no sabe nada de asuntos, de
   terceros ni de relacionados, solo de plegar y desplegar.

   `js/ficha-asunto.js` rehace la ficha entera con `innerHTML` en cada
   `pintar()`, sobre el mismo `#ficha-asunto-cuerpo` de siempre, tanto
   si es un repintado del mismo asunto como si se ha saltado a otro
   (`App.abrirFicha` no lo distingue): por eso el abierto/cerrado se
   guarda **por asunto** (`recordar`/`reponer`, con el nombre del
   asunto como clave), no solo "lo último que hubiera en el DOM" —
   si no, el bloque abierto de un asunto se colaría abierto en el
   siguiente que se mirase, aunque no tenga nada que ver. Mismo
   patrón que `volverADesplegar` en js/hitos-panel.js, adaptado para
   que la memoria sea del asunto, no del sitio en la pantalla.
   Cerrado de partida: de un asunto que no se ha visto todavía en esta
   pantalla, un `<details>` nuevo nace cerrado. */
var FichaPlegables = (function () {

  var IDS = {
    otros: 'ficha-plegable-otros',
    relacionados: 'ficha-plegable-relacionados'
  };

  /* Nombre del asunto -> { otros, relacionados }, mientras dure la
     pantalla (memoria en el propio módulo, no en disco: no hace falta
     recordarlo entre sesiones). */
  var estadosPorAsunto = {};

  /* Llamar justo ANTES de rehacer el `innerHTML` de la ficha, con el
     asunto que se ESTABA viendo hasta ahora (antes de que `pintar()`
     lo cambie, si es que lo cambia). */
  function recordar(nombreAsunto, raiz) {
    if (!nombreAsunto) return;
    var estado = {};
    Object.keys(IDS).forEach(function (clave) {
      var el = raiz.querySelector('#' + IDS[clave]);
      if (el) estado[clave] = el.open;
    });
    estadosPorAsunto[nombreAsunto] = estado;
  }

  /* Llamar justo DESPUÉS, con el asunto que se pasa a ver ahora (el
     mismo que antes, en un repintado, u otro distinto tras saltar). */
  function reponer(nombreAsunto, raiz) {
    var estado = (nombreAsunto && estadosPorAsunto[nombreAsunto]) || {};
    Object.keys(IDS).forEach(function (clave) {
      var el = raiz.querySelector('#' + IDS[clave]);
      if (el) el.open = !!estado[clave];
    });
  }

  /* `id` es la clave del propio `<details>` (uno de los valores de
     IDS), `titulo` el de la cabecera, `idDentro` el hueco donde pinta
     quien de verdad monta el contenido, y `textoDeEntrada` lo que se
     ve mientras eso todavía no ha llegado ("Buscando…", "Leyendo…"). */
  function bloque(id, titulo, idDentro, textoDeEntrada) {
    return '<details class="ficha-bloque ficha-plegable" id="' + id + '">' +
             '<summary>' +
               '<h3 class="ficha-titulo">' + U.escapar(titulo) + '</h3>' +
               '<span class="ficha-resumen"></span>' +
             '</summary>' +
             '<div class="ficha-plegable-cuerpo">' +
               '<div id="' + idDentro + '" class="explica">' + textoDeEntrada + '</div>' +
             '</div>' +
           '</details>';
  }

  /* Lo llama quien pinta el contenido de un bloque (js/otros-del-tercero.js,
     js/relacionados.js), en cuanto sabe la cuenta, aunque el bloque
     siga cerrado: así el número avisa sin tener que abrir nada.
     `caja` es el mismo hueco que le pasa js/ficha-asunto.js (el
     `idDentro` de arriba); de ahí se sube hasta el `<details>` para
     escribir el resumen y, con la cuenta a cero, apagarlo en gris. */
  function ponResumen(caja, texto, vacio) {
    var detalle = caja && caja.closest('.ficha-plegable');
    if (!detalle) return;
    var resumen = detalle.querySelector('.ficha-resumen');
    if (resumen) resumen.textContent = texto;
    detalle.classList.toggle('ficha-plegable-vacio', !!vacio);
  }

  return { recordar: recordar, reponer: reponer, bloque: bloque, ponResumen: ponResumen };
})();
