/* ============================================================
   guias-comunicacion.js — "Comunicación de este paso" del editor de
   un paso (18-sep-2026, fila 60, docs/COMUNICAR-DESDE-EL-HITO.md).

   Un paso puede llevar su propio texto para correo, para Séneca, o
   para los dos, aparte de la plantilla general del tipo. Aparte de
   js/guias.js para no engordarlo (sección 6 del encargo).

   A diferencia de js/guias-requisitos.js, aquí no hace falta el patrón
   de "recoger(); mutar; pintar()": son solo campos de texto (asunto y
   cuerpo, por canal), y se leen en `recoger()` como el título o el
   cuerpo del propio paso — `js/guias.js` llama a `leer(caja)` ahí.

   Reutiliza el campo de texto con "Insertar hueco" de
   `js/plantillas-ajustes.js` (mismo patrón que ya usa el cuadro de una
   plantilla, sección 6 del encargo: "no escribas un editor nuevo").

   CÓMO SE USA (desde js/guias.js)

     d.insertAdjacentHTML('beforeend', GuiasComunicacion.bloqueHTML(p.id, p.comunicacion));
     GuiasComunicacion.enganchar(d, p.id);
     ...
     pasos[i].comunicacion = GuiasComunicacion.leer(caja);   // en recoger()

   Se carga después de js/guias.js y de js/plantillas-ajustes.js.
   ============================================================ */
var GuiasComunicacion = (function () {

  var CANALES = [
    { clave: 'correo', etiqueta: 'Correo' },
    { clave: 'seneca', etiqueta: 'Mensaje de Séneca' }
  ];

  function idAsunto(idPaso, canal) { return 'guiacom-' + idPaso + '-' + canal + '-asunto'; }
  function idCuerpo(idPaso, canal) { return 'guiacom-' + idPaso + '-' + canal + '-cuerpo'; }
  function idHueco(idPaso, canal) { return 'guiacom-' + idPaso + '-' + canal + '-hueco'; }

  function tieneTexto(canal) { return !!(canal && canal.cuerpo && canal.cuerpo.trim()); }

  function marcaHTML(comunicacion) {
    var c = comunicacion || {};
    var trozos = [];
    if (tieneTexto(c.correo)) trozos.push('Correo');
    if (tieneTexto(c.seneca)) trozos.push('Séneca');
    return trozos.length ? ' <span class="suave">— ' + trozos.join(' · ') + '</span>' : '';
  }

  function panelHTML(idPaso, canal, datos, activo) {
    var d = datos || { asunto: '', cuerpo: '' };
    return '<div class="paso-comunicacion-panel' + (activo ? '' : ' oculto') + '" data-canal="' + canal.clave + '">' +
      '<label class="etiqueta" style="margin-top:0">Asunto</label>' +
      '<input class="campo" id="' + idAsunto(idPaso, canal.clave) + '" value="' + U.escapar(d.asunto) + '">' +
      (window.PlantillasAjustes
        ? PlantillasAjustes.campoDeTextoHTML(idCuerpo(idPaso, canal.clave), idHueco(idPaso, canal.clave), 'Texto', d.cuerpo, 6)
        : '<label class="etiqueta">Texto</label><textarea id="' + idCuerpo(idPaso, canal.clave) +
          '" class="campo" rows="6">' + U.escapar(d.cuerpo) + '</textarea>') +
      '</div>';
  }

  /* El HTML de todo el bloque plegable, listo para insertar como hijo
     directo del recuadro del paso (o del subpaso). `comunicacion` puede
     venir vacío, `null` o sin definir: un paso que nunca la tuvo. */
  function bloqueHTML(idPaso, comunicacion) {
    var c = comunicacion || { correo: null, seneca: null };
    return '<details class="paso-comunicacion">' +
      '<summary>Comunicación de este paso' + marcaHTML(c) + '</summary>' +
      '<div class="paso-comunicacion-pestanas">' +
        CANALES.map(function (canal, i) {
          return '<button type="button" class="boton paso-comunicacion-pestana' + (i === 0 ? ' activa' : '') +
            '" data-canal="' + canal.clave + '">' + U.escapar(canal.etiqueta) + '</button>';
        }).join('') +
      '</div>' +
      CANALES.map(function (canal, i) { return panelHTML(idPaso, canal, c[canal.clave], i === 0); }).join('') +
      '</details>';
  }

  /* Lee lo escrito en los dos canales, tal y como está en el DOM dentro
     de `raiz` (el recuadro del paso o del subpaso). `idPaso` es el
     mismo que se le dio a bloqueHTML(): sin bloque pintado (paso de
     pregunta, o antes de que este fichero cargara), se queda como
     estaba. */
  function leer(raiz, idPaso) {
    var det = raiz.querySelector(':scope > .paso-comunicacion');
    if (!det) return { correo: { asunto: '', cuerpo: '' }, seneca: { asunto: '', cuerpo: '' } };
    function valorDe(id) {
      var el = raiz.querySelector('#' + CSS.escape(id));
      return el ? el.value : '';
    }
    return {
      correo: { asunto: valorDe(idAsunto(idPaso, 'correo')).trim(), cuerpo: valorDe(idCuerpo(idPaso, 'correo')) },
      seneca: { asunto: valorDe(idAsunto(idPaso, 'seneca')).trim(), cuerpo: valorDe(idCuerpo(idPaso, 'seneca')) }
    };
  }

  /* Engancha las pestañas y, por cada canal, su botón "Insertar hueco"
     (con `PlantillasAjustes.engancharCampoDeTexto`, que ya sabe meter
     el hueco en el asunto o en el cuerpo según cuál tuviera el foco). */
  function enganchar(raiz, idPaso) {
    var det = raiz.querySelector(':scope > .paso-comunicacion');
    if (!det) return;

    var pestanas = det.querySelectorAll(':scope > .paso-comunicacion-pestanas > .paso-comunicacion-pestana');
    var paneles = det.querySelectorAll(':scope > .paso-comunicacion-panel');
    Array.prototype.forEach.call(pestanas, function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call(pestanas, function (x) { x.classList.toggle('activa', x === b); });
        Array.prototype.forEach.call(paneles, function (p) { p.classList.toggle('oculto', p.dataset.canal !== b.dataset.canal); });
      };
    });

    if (!window.PlantillasAjustes) return;
    CANALES.forEach(function (canal) {
      PlantillasAjustes.engancharCampoDeTexto(
        idCuerpo(idPaso, canal.clave), idHueco(idPaso, canal.clave),
        [document.getElementById(idAsunto(idPaso, canal.clave))]
      );
    });
  }

  return { bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar };
})();
window.GuiasComunicacion = GuiasComunicacion;
