/* ============================================================
   seneca-cuadro.js — el cuadro de "Mensaje de Séneca" (fila 53,
   18-sep-2026, docs/SENECA-CUADRO-ANCHO.md), sacado de js/correo.js
   (que se había ido a 38 KB) para que se vea entero.

   Aquí no hay "Para": en Séneca los destinatarios se marcan en su
   propia lista (js/seneca-destinatarios.js). Lo que se recuerda es a
   quién hay que marcar. El asunto y el texto son dos casillas
   distintas, y cada una tiene su propio botón de copiar (antes había
   uno solo que iba cambiando de significado).

   Ningún cambio de funcionamiento respecto a lo de antes: mismas
   piezas (asunto, plantilla, cuerpo, rastro en las notas), solo
   disposición y claridad. Lo que hace falta de js/correo.js —sacar el
   asunto, el cuerpo con su plantilla, a quién se escribe, apuntar el
   rastro— se usa a través de `window.CorreoNucleo`, que ese fichero
   expone para esto (mismo patrón que ya usaba `window.CorreoGrupos`
   para las opciones de "Añadir un grupo").

   Va después de js/correo.js y de js/seneca-destinatarios.js en
   index.html: los usa nada más abrirse el cuadro, nunca al cargar el
   fichero, así que el orden entre este y js/seneca-ayudante.js no
   importa (se llama en tiempo de ejecución, igual que ya pasaba).
   ============================================================ */
var SenecaCuadro = (function () {

  var MIN_RENGLONES_ASUNTO = 2;
  var MAX_RENGLONES_ASUNTO = 5;
  var ALTO_RENGLON_ASUNTO = 20; /* px, aproximado, para el cálculo de alto */

  var plantillaElegida = '';
  var textoProgramado = '';
  var copiadoElAsunto = false; /* para saber cuál de los dos botones se destaca */

  function $(id) { return document.getElementById(id); }
  function n() { return window.CorreoNucleo || {}; }

  /* ---------- el cuerpo del cuadro ---------- */

  function cuerpoHtml(a, opcionesGrupo) {
    plantillaElegida = '';
    copiadoElAsunto = false;
    var quien = n().aQuien ? n().aQuien(a) : '';
    var documento = n().documentoSeneca ? n().documentoSeneca() : '';

    return '<div id="seneca-formulario">' +
           '<div class="cuadro-cabecera-ruta"><span id="seneca-ruta-lugar"></span></div>' +
           '<div id="seneca-ruta-en-linea" class="oculto"></div>' +
           '<div class="seneca-aviso-arriba">' +
             '<strong>En Séneca: Utilidades → Comunicaciones.</strong> ' +
             'Los destinatarios se marcan allí, en su lista' +
             (quien ? ': <strong>' + U.escapar(quien) + '</strong>' : '') + '.' +
           '</div>' +
           (documento
             ? '<div class="seneca-doc-adjuntar"><strong>Adjunta este documento en Séneca:</strong> ' +
               U.escapar(documento) + ' <button type="button" class="enlace" id="seneca-copiar-doc">Copiar el nombre</button></div>'
             : '') +
           '<div class="seneca-grid">' +
             '<div class="seneca-col-izq">' +
               (window.SenecaDestinatarios ? SenecaDestinatarios.bloqueHtml(opcionesGrupo) : '') +
               bloqueAsunto(a) +
             '</div>' +
             '<div class="seneca-col-der">' +
               '<div id="seneca-comunes-der">' + bloqueCuerpo(a) + '</div>' +
             '</div>' +
           '</div>' +
           '<div class="seneca-pasos">' +
             '<button type="button" class="boton boton-principal" id="seneca-copiar-asunto">1. Copiar el asunto</button>' +
             '<button type="button" class="boton" id="seneca-copiar-texto">2. Copiar el texto</button>' +
           '</div>' +
           '<div class="seneca-ayudante-caja">' +
             '<div id="seneca-ayudante-enlace"></div>' +
             '<details class="seneca-explica-detalles">' +
               '<summary>¿Cómo se instala el ayudante de Séneca? (se hace una sola vez)</summary>' +
               '<div id="seneca-ayudante-explica"></div>' +
             '</details>' +
           '</div>' +
           '</div>' +
           '<div id="seneca-plantilla-editor" class="oculto"></div>';
  }

  /* El asunto es siempre el nombre de la carpeta (fila 55, 18-sep-2026,
     docs/ASUNTO-SIN-ELECCION.md): ya no hay botones para elegir entre
     esa y una "versión legible". El campo se ve y se puede editar a
     mano igual que antes; solo desaparece la elección. */
  function bloqueAsunto(a) {
    var texto = n().asuntoDelCorreo ? n().asuntoDelCorreo(a) : (a.nombre || '');
    return '<label class="etiqueta" style="margin-top:0">Asunto</label>' +
      '<textarea id="seneca-asunto" class="campo">' + U.escapar(texto) + '</textarea>' +
      '<div class="seneca-asunto-pie">' +
        '<span class="seneca-caracteres" id="seneca-caracteres">' + texto.length + ' caracteres</span>' +
      '</div>';
  }

  /* La plantilla y el texto del mensaje. Con el tipo sin ninguna
     plantilla, el aviso de 3.3 en vez del hueco mudo entre saludo y
     firma. */
  function bloqueCuerpo(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    if (!plantillaElegida && opciones.length) plantillaElegida = opciones[0].id;
    if (plantillaElegida && !opciones.some(function (p) { return p.id === plantillaElegida; })) {
      plantillaElegida = '';
    }

    var cuerpo = (n().cuerpoDelMedio && n().cuerpoDelMedio(a, plantillaElegida)) || { texto: '', faltan: [] };
    textoProgramado = cuerpo.texto;

    /* Fila 151: sin ninguna plantilla, «Crear plantilla»; con alguna,
       «Editar plantilla» junto al desplegable, para la elegida. */
    var desplegable = opciones.length
      ? '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<div class="etiqueta-con-boton">' +
        '<select id="seneca-plantilla" class="campo">' +
          '<option value="">Sin plantilla</option>' +
          opciones.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === plantillaElegida ? ' selected' : '') + '>' +
              U.escapar(p.nombre) + '</option>';
          }).join('') +
        '</select>' +
        '<button type="button" class="boton boton-chico" id="seneca-plantilla-editar">Editar plantilla</button>' +
        '</div>' +
        '<div id="seneca-plantilla-confirmar" class="oculto"></div>'
      : '<p class="nota aviso-en-linea" id="seneca-sin-plantilla">Este tipo de asunto no tiene plantilla de ' +
        'mensaje de Séneca. Escríbela una vez y saldrá rellena siempre.</p>' +
        '<button type="button" class="boton" id="seneca-plantilla-crear">Crear plantilla</button>';

    return desplegable +
      '<label class="etiqueta">Texto del mensaje</label>' +
      (cuerpo.faltan.length
        ? '<p class="aviso aviso-ambar" id="seneca-faltan-datos">Faltan datos: ' +
          U.escapar(cuerpo.faltan.join(', ')) + '</p>'
        : '') +
      '<textarea id="seneca-cuerpo-texto" class="campo" rows="14">' + U.escapar(cuerpo.texto) + '</textarea>';
  }

  /* ---------- el alto del asunto, que crece con lo que se escribe ---------- */

  function ajustarAltoAsunto(campo) {
    if (!campo) return;
    campo.style.height = 'auto';
    var minimo = MIN_RENGLONES_ASUNTO * ALTO_RENGLON_ASUNTO;
    var maximo = MAX_RENGLONES_ASUNTO * ALTO_RENGLON_ASUNTO;
    var alto = Math.min(Math.max(campo.scrollHeight, minimo), maximo);
    campo.style.height = alto + 'px';
  }

  function actualizarCaracteres() {
    var campo = $('seneca-asunto');
    var etiqueta = $('seneca-caracteres');
    if (!campo || !etiqueta) return;
    etiqueta.textContent = campo.value.length + ' caracteres';
  }

  /* ---------- enganchar ---------- */

  function enganchar(a) {
    var asunto = $('seneca-asunto');
    if (asunto) {
      ajustarAltoAsunto(asunto);
      asunto.oninput = function () { ajustarAltoAsunto(asunto); actualizarCaracteres(); };
    }

    engancharPlantilla(a);
    engancharPasos(a);
    engancharRuta(a);
    engancharDocAdjuntar();

    if (window.SenecaAyudante) {
      /* El enlace se queda a la vista; la explicación entra en el
         <details> cerrado (3.5, docs/SENECA-CUADRO-ANCHO.md). */
      SenecaAyudante.insertarEnlace($('seneca-ayudante-enlace'), $('seneca-ayudante-explica'));
    }
  }

  /* El botón «Ruta» en la cabecera del cuadro (fila 152,
     docs/RUTA-QUE-NO-VA-A-BING.md, punto 3): misma función que en
     js/correo-cuadro.js, no duplicada. */
  function engancharRuta(a) {
    if (!window.RutaCarpetas) return;
    var interno = n()._interno || {};
    RutaCarpetas.montarEnCuadro($('seneca-ruta-lugar'), $('seneca-ruta-en-linea'), a, interno.modoDelAsunto || 'abierto');
  }

  /* Fila 153: «Copiar el nombre» del documento señalado, si lo hay. */
  function engancharDocAdjuntar() {
    var boton = $('seneca-copiar-doc');
    if (!boton) return;
    var nombre = n().documentoSeneca ? n().documentoSeneca() : '';
    boton.onclick = function () { U.copiar(nombre, boton); };
  }

  function engancharPlantilla(a) {
    var desplegable = $('seneca-plantilla');
    if (desplegable) desplegable.onchange = function () { elegirPlantilla(a, this.value); };

    var editar = $('seneca-plantilla-editar');
    if (editar) editar.onclick = function () {
      var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
      var existente = opciones.filter(function (p) { return p.id === plantillaElegida; })[0] || null;
      abrirEditorPlantilla(a, existente);
    };
    var crear = $('seneca-plantilla-crear');
    if (crear) crear.onclick = function () { abrirEditorPlantilla(a, null); };
  }

  /* Igual que en js/correo-cuadro.js: la misma confirmación en línea si
     el texto tenía algo escrito a mano, al elegir del desplegable o al
     guardar una nueva o editada desde el propio cuadro (fila 151). */
  function elegirPlantilla(a, idElegida) {
    var campoCuerpo = $('seneca-cuerpo-texto');
    var escritoAMano = campoCuerpo && campoCuerpo.value !== textoProgramado;
    if (!escritoAMano) { cambiarDePlantilla(a, idElegida); return; }

    var caja2 = $('seneca-plantilla-confirmar');
    var desplegable = $('seneca-plantilla');
    caja2.className = 'aviso aviso-ambar';
    caja2.innerHTML = '<p>Lo que hay escrito en el texto se perderá.</p>';
    var seguir = document.createElement('button');
    seguir.type = 'button';
    seguir.className = 'boton boton-principal';
    seguir.textContent = 'Cambiar de todas formas';
    seguir.onclick = function () { cambiarDePlantilla(a, idElegida); };
    var cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'boton';
    cancelar.textContent = 'Seguir con lo escrito';
    cancelar.style.marginLeft = '8px';
    cancelar.onclick = function () {
      if (desplegable) desplegable.value = plantillaElegida;
      caja2.className = 'oculto';
      caja2.innerHTML = '';
    };
    caja2.appendChild(seguir);
    caja2.appendChild(cancelar);
  }

  function cambiarDePlantilla(a, idElegida) {
    plantillaElegida = idElegida;
    $('seneca-comunes-der').innerHTML = bloqueCuerpo(a);
    engancharPlantilla(a);
  }

  /* ---------- crear/editar la plantilla desde el propio cuadro
     (25-sep-2026, fila 151, docs/PLANTILLA-DESDE-EL-CUADRO.md) ---------- */

  function abrirEditorPlantilla(a, existente) {
    var formulario = $('seneca-formulario');
    var editor = $('seneca-plantilla-editor');
    if (!formulario || !editor || !window.PlantillasAjustes) return;
    formulario.className = 'oculto';
    editor.className = '';
    PlantillasAjustes.montarEditorEnLinea(editor, a, existente, function (guardada) {
      cerrarEditorPlantilla();
      (n().recargarPlantillas ? n().recargarPlantillas(a) : Promise.resolve()).then(function () {
        elegirPlantilla(a, guardada.id);
      });
    }, cerrarEditorPlantilla);
  }

  function cerrarEditorPlantilla() {
    var formulario = $('seneca-formulario');
    var editor = $('seneca-plantilla-editor');
    if (editor) editor.className = 'oculto';
    if (formulario) formulario.className = '';
  }

  /* Los dos botones numerados (3.4): cada uno copia siempre lo suyo,
     se pulse en el orden que se pulse. El que toca se destaca; al
     copiar, dice "Copiado" un momento (mismo aviso que ya usa
     js/copiar.js en el resto de la aplicación). */
  function engancharPasos(a) {
    var botonAsunto = $('seneca-copiar-asunto');
    var botonTexto = $('seneca-copiar-texto');

    botonAsunto.onclick = function () {
      copiarTexto($('seneca-asunto').value, botonAsunto);
      if (!copiadoElAsunto) {
        copiadoElAsunto = true;
        botonAsunto.classList.remove('boton-principal');
        botonTexto.classList.add('boton-principal');
      }
    };

    botonTexto.onclick = function () {
      var texto = $('seneca-cuerpo-texto').value;
      var maximo = n().MAXIMO_LETRAS_SENECA || 4000;
      var recortado = texto.length > maximo;
      if (recortado) texto = texto.slice(0, maximo);
      copiarTexto(texto, botonTexto);
      /* toLocaleString depende de que el navegador traiga los datos de
         formato en español: no siempre está, así que el separador de
         millar se escribe a mano, como ya hacía el aviso de antes. */
      if (recortado) U.aviso('Copiado, recortado a ' + String(maximo).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' letras.', 'ambar');
      if (n().apuntarElRastro) n().apuntarElRastro(a);
    };
  }

  function copiarTexto(texto, boton) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    U.copiar(texto, boton);
  }

  return {
    cuerpoHtml: cuerpoHtml,
    enganchar: enganchar
  };
})();
window.SenecaCuadro = SenecaCuadro;
