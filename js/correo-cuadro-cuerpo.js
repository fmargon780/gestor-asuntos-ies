/* ============================================================
   correo-cuadro-cuerpo.js — el cuerpo del correo y sus bloques (fila 536: trozo de js/correo-cuadro.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/correo-cuadro.js.
   ============================================================ */
var CorreoCuadroNucleo = CorreoCuadroNucleo || {};
(function () {

  var I = CorreoCuadroNucleo;
  I.S = I.S || {};
  function n() { return I.n.apply(this, arguments); }
  function copiar() { return I.copiar.apply(this, arguments); }
  function plantillaInicial() { return I.plantillaInicial.apply(this, arguments); }

  function cuerpoHtml(a, persona, bloqueAdjuntos, opcionesGrupo) {
    I.S.documentosAdjuntados = [];
    I.S.plantillaElegida = null; /* fila 271: null = sin decidir; '' = «Sin plantilla» */
    I.S.ccoSinCorreo = [];

    /* Fila 555: la plantilla con la que se abre propone Para, Copia y Copia oculta por papeles; sin plantilla, nadie. Lo que
       pide la propia aplicación (un aviso a quien lo pidió, un hito…) entra además en «Para». */
    var plantillaDeEntrada = plantillaInicial(a);
    if (window.CorreoPara) {
      CorreoPara.vaciar();
      var antes = (n()._interno || {}).restaurar;   /* el cuadro se cerró para relacionar a alguien y se vuelve a abrir */
      if (antes) CorreoPara.restaurar(antes.dest);
      else {
        if (plantillaDeEntrada) CorreoPara.aplicarPapeles({ para: plantillaDeEntrada.para, copia: plantillaDeEntrada.copia, oculta: plantillaDeEntrada.oculta });
        var preferente = (n().destinatarioPreferente && n().destinatarioPreferente()) || '';
        if (preferente) CorreoPara.ponerDirecciones('para', String(preferente).match(Destinatarios.RE_CORREO) || []);
      }
    }

    return '<div id="correo-formulario">' +
             '<div class="cuadro-cabecera-ruta"><span id="correo-ruta-lugar"></span></div>' +
             '<div id="correo-ruta-en-linea" class="oculto"></div>' +
             '<div class="correo-grid">' +
               '<div class="correo-col-izq">' +
                 (window.CorreoTutor ? CorreoTutor.arribaHtml() : '') +   /* fila 299 */
                 bloqueDestinatarios(a) +
                 bloqueAsunto(a) +
                 (bloqueAdjuntos || '') +
                 (window.CorreoAdjuntoPlantilla ? CorreoAdjuntoPlantilla.avisoHtml() : '') +   /* fila 299 */
               '</div>' +
               '<div class="correo-col-der">' +
                 '<div id="correo-comunes-der">' + bloqueCuerpo(a) + '</div>' +
               '</div>' +
             '</div>' +
             '<div class="correo-botones" style="margin-top:14px">' +
               '<button type="button" class="boton" id="correo-copiar-para">Copiar Para</button>' +
               '<button type="button" class="boton" id="correo-copiar-asunto">Copiar Asunto</button>' +
               '<button type="button" class="boton" id="correo-copiar-cuerpo">Copiar Cuerpo</button>' +
             '</div>' +
             '<div class="correo-botones" style="margin-top:8px">' +
               '<button type="button" class="boton boton-principal" id="correo-enviar">Enviar</button>' +
               '<button type="button" class="boton" id="correo-gmail">Abrir en Gmail</button>' +
               '<button type="button" class="boton" id="correo-ordenador">Abrir en el correo del ordenador</button>' +
               (window.CorreoRelacionar ? '<button type="button" class="boton" id="correo-relacionar">Relacionar a alguien con el asunto</button>' : '') +
             '</div>' +
             '<p class="nota">"Enviar" manda el correo de verdad, tras confirmar el resumen. ' +
             '"Abrir en Gmail" y "Abrir en el correo del ordenador" son para escribir allí, sin adjuntos.</p>' +
           '</div>' +
           '<div id="correo-resumen" class="oculto"></div>' +
           '<div id="correo-plantilla-editor" class="oculto"></div>';
  }

  /* La línea gris de "Lo pidió...", encima de la lista de "Para"
     (docs/LO-PIDE.md, 6). */
  function avisoLoPideHtml(a) {
    if (!window.LoPide) return '';
    var d = a.ficha && a.ficha.loPide;
    var c = LoPide.contactoDe(a.ficha);
    var quien = d && d.nombre
      ? 'Lo pidió ' + d.nombre + (d.relacion ? ' (' + d.relacion + ')' : '') +
        (d.fecha ? ', el ' + U.fechaLegible(U.aAaMmDd(d.fecha)) : '') + '.'
      : '';
    /* Fila 305: si la dirección sale de lo escrito en «El encargo», se dice. */
    var escrito = c.correoEscrito ? 'Correo apuntado en «El encargo»: ' + c.correo : '';
    var texto = [quien, escrito].filter(Boolean).join(' ');
    return texto ? '<p class="nota" style="margin-top:0">' + U.escapar(texto) + '</p>' : '';
  }

  function bloqueDestinatarios(a) {
    return avisoLoPideHtml(a) +
      (window.CorreoPara ? CorreoPara.html() : '') +
      (window.CorreoTutorBotones ? CorreoTutorBotones.avisosHtml() : '') +   /* fila 348, fila 434 */
      '<div id="correo-cco-sin-correo"></div>';
  }

  /* El asunto del mensaje, siempre el nombre de la carpeta (fila 55,
     18-sep-2026, docs/ASUNTO-SIN-ELECCION.md). */
  function bloqueAsunto(a) {
    return '<label class="etiqueta">Asunto</label>' +
      '<input id="correo-asunto" class="campo" value="' + U.escapar(n().asuntoDelCorreo(a)) + '">';
  }

  /* La plantilla y el cuerpo del correo. */
  function bloqueCuerpo(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    /* Fila 164: la receta de una tarea trae su plantilla (una vez). */
    var pedida = (n()._interno || {}).plantillaPedida;
    if (pedida && opciones.some(function (p) { return p.id === pedida; })) { I.S.plantillaElegida = pedida; n()._interno.plantillaPedida = ''; }
    if (I.S.plantillaElegida === null) I.S.plantillaElegida = n().plantillaDeEntrada(a, opciones);
    if (I.S.plantillaElegida && !opciones.some(function (p) { return p.id === I.S.plantillaElegida; })) {
      I.S.plantillaElegida = '';
    }

    var cuerpo = n().cuerpoDelMedio(a, I.S.plantillaElegida);
    I.S.textoProgramado = cuerpo.texto;

    /* Fila 151: sin ninguna plantilla, «Crear plantilla»; con alguna,
       «Editar plantilla» junto al desplegable, para la elegida. */
    var desplegable = opciones.length
      ? '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<div class="etiqueta-con-boton">' +
        '<select id="correo-plantilla" class="campo">' +
          '<option value="">Sin plantilla</option>' +
          opciones.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === I.S.plantillaElegida ? ' selected' : '') + '>' +
              U.escapar(p.nombre) + '</option>';
          }).join('') +
        '</select>' +
        '<button type="button" class="boton boton-chico" id="correo-plantilla-editar">Cambiar la plantilla</button>' +
        '<button type="button" class="boton boton-chico" id="correo-plantilla-desde-escrito">Guardar como plantilla nueva</button>' +
        '</div>' +
        '<div id="correo-plantilla-confirmar" class="oculto"></div>'
      : '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<button type="button" class="boton" id="correo-plantilla-crear">Crear plantilla</button>';

    return desplegable +
      '<label class="etiqueta"' + (opciones.length ? '' : ' style="margin-top:0"') + '>Cuerpo</label>' +
      /* Fila 530: lo que falta se escribe aquí y se guarda en el asunto (js/datos-del-asunto-cuadro.js). */
      (window.DatosDelAsuntoCuadro ? DatosDelAsuntoCuadro.html('correo', a, cuerpo.faltan)
        : (cuerpo.faltan.length ? '<p class="aviso aviso-ambar" id="correo-faltan-datos">Faltan datos: ' + U.escapar(cuerpo.faltan.join(', ')) + '</p>' : '')) +
      '<textarea id="correo-cuerpo-texto" class="campo" rows="9">' + U.escapar(cuerpo.texto) + '</textarea>';
  }

  /* ---------- enganchar ---------- */

  I.cuerpoHtml = cuerpoHtml;
  I.bloqueCuerpo = bloqueCuerpo;
})();
