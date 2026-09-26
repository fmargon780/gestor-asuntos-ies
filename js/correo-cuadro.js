/* ============================================================
   correo-cuadro.js — el cuadro de "Correo electrónico" de un asunto
   (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 5),
   sacado de js/correo.js (que pasaba de las 800 líneas) para que se
   vea entero, igual que se hizo con Séneca en la fila 53
   (js/seneca-cuadro.js).

   Este fichero es dueño de todo lo que solo usa el cuadro de Correo:
   a quién se escribe (`elegidos`), la copia oculta de los grupos
   (`cco`/`ccoSinCorreo`), qué documentos se han adjuntado por última
   vez, y —desde el 24-sep-2026 (fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md)—
   el botón "Enviar" y el resumen que lo confirma. Lo que necesita de
   js/correo.js —el asunto del mensaje, el cuerpo con su plantilla, a
   quién se escribe en palabras, apuntar el rastro— se usa a través de
   `window.CorreoNucleo` (mismo patrón que ya usaba js/seneca-cuadro.js).

   EL BOTÓN "ENVIAR" (fila 115): sustituye a "Preparar borrador con los
   documentos". La aplicación ya NO deja nunca todo listo sin más: al
   pulsar "Enviar" se pinta, dentro del mismo cuadro (nunca un segundo
   cuadro encima: regla de U.preguntar), un resumen de lo que se va a
   mandar — Para, Copia oculta, Asunto, primeras líneas del texto y los
   documentos con su tamaño — con "Confirmar y enviar" y "Volver". El
   formulario (`#correo-formulario`) y el resumen (`#correo-resumen`)
   son dos bloques HERMANOS dentro del mismo `#correo-caja`: "Enviar" y
   "Volver" solo alternan cuál de los dos se ve (con la clase `oculto`),
   sin volver a montar el formulario ni perder nada de lo escrito a
   mano. Al confirmar, `window.CorreoEnviar` llama a la aplicación web
   de Apps Script; si falla, el aviso sale en rojo dentro del propio
   resumen y el formulario sigue intacto detrás, listo para reintentar
   sin haber perdido el texto. "Abrir en Gmail" y "Abrir en el correo
   del ordenador" se quedan, como botones secundarios.

   Va después de js/correo.js, js/correo-adjuntos.js y
   js/correo-enviar.js en index.html. */
var CorreoCuadro = (function () {

  var elegidos = {};             /* qué correos van marcados */
  var cco = {};                  /* direcciones en copia oculta, de los grupos */
  var ccoSinCorreo = [];         /* nombres de miembros de un grupo sin ningún correo */
  var documentosAdjuntados = []; /* los que ha llevado el último correo enviado de verdad */
  var plantillaElegida = '';
  var textoProgramado = '';

  function $(id) { return document.getElementById(id); }
  function n() { return window.CorreoNucleo || {}; }

  /* ---------- de dónde salen los correos ---------- */

  /* Todas las direcciones de la ficha de esa persona: la regla común de
     js/destinatarios.js (fila 132). */
  function correosDe(persona) { return Destinatarios.correosDe(persona); }

  function paraDelCuadro() {
    var lista = [];
    Array.prototype.forEach.call(document.querySelectorAll('.correo-marca'), function (c) {
      if (c.checked) lista.push(c.value);
    });
    var otro = $('correo-otro') ? $('correo-otro').value.trim() : '';
    if (otro) lista.push(otro);
    return lista.join(', ');
  }

  function ccoDelCuadro() {
    return Object.keys(cco).join(', ');
  }

  /* ---------- los grupos, para la copia oculta ----------

     17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md. Decisión de
     Francisco: los destinatarios que vienen de un grupo van SIEMPRE en
     copia oculta, nunca en Para, para que una familia no vea el correo
     de las demás. */

  /* De cada miembro, TODOS sus correos: la regla común (fila 132). */
  function combinarCorreosDeGrupo(miembrosConPersona) { return Destinatarios.delGrupo(miembrosConPersona); }

  function contenidoCco() {
    var direcciones = Object.keys(cco);
    if (!direcciones.length && !ccoSinCorreo.length) return '';
    return (direcciones.length
      ? '<label class="etiqueta">Copia oculta <span class="suave">(' + direcciones.length + ')</span></label>' +
        '<div class="marcados-lista">' + direcciones.map(function (d) {
          return '<span class="marcado-chip">' + U.escapar(d) +
            '<button type="button" class="cco-quitar" data-dir="' + U.escapar(d) + '" ' +
            'title="Quitarlo de la copia oculta">×</button></span>';
        }).join('') + '</div>'
      : '') +
      (ccoSinCorreo.length
        ? '<p class="nota aviso-en-linea">' + ccoSinCorreo.length +
          (ccoSinCorreo.length === 1 ? ' no tiene correo: ' : ' no tienen correo: ') +
          U.escapar(ccoSinCorreo.join(', ')) + '</p>'
        : '');
  }

  function engancharCco() {
    Array.prototype.forEach.call(document.querySelectorAll('.cco-quitar'), function (b) {
      b.onclick = function () { delete cco[b.dataset.dir]; refrescarCco(); };
    });
  }

  function refrescarCco() {
    var caja = $('correo-cco-caja');
    if (!caja) return;
    caja.innerHTML = contenidoCco();
    engancharCco();
  }

  /* ---------- copiar y abrir ---------- */

  function copiar(texto, boton) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    U.copiar(texto, boton);
  }

  function abrirGmail() {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=' + encodeURIComponent(paraDelCuadro()) +
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '') +
      '&su=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value);
    window.open(url, '_blank');
  }

  function abrirDelOrdenador() {
    var url = 'mailto:' + encodeURIComponent(paraDelCuadro()) +
      '?subject=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value) +
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '');
    window.location.href = url;
  }

  /* ---------- el cuerpo del cuadro, en dos columnas ----------

     18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 5: mismo
     patrón que `SenecaCuadro.cuerpoHtml` (fila 53) — ancho hasta
     1100px, y a partir de 900px, dos columnas: a la izquierda
     destinatarios, asunto y los documentos que se adjuntan; a la
     derecha el texto del correo. Todo el formulario va dentro de
     `#correo-formulario`, hermano de `#correo-resumen` (fila 115). */
  function cuerpoHtml(a, persona, bloqueAdjuntos, opcionesGrupo) {
    elegidos = {};
    cco = {};
    ccoSinCorreo = [];
    documentosAdjuntados = [];
    plantillaElegida = '';

    var correos = correosDe(persona);
    /* Un hito con "Comunicar" (fila 60, docs/COMUNICAR-DESDE-EL-HITO.md,
       5.1) puede proponer una dirección propia (o varias, separadas
       por coma): gana a la de "Lo pide", y esta a la del departamento (fila 167). */
    var correoLoPide = (n().destinatarioPreferente && n().destinatarioPreferente()) ||
      (window.LoPide ? LoPide.correoDe(a.ficha) : '') || (window.Administraciones ? Administraciones.correoDelAsunto(a) : '');
    /* Cuáles van marcados de partida: la regla común (fila 132). */
    var posibles = Destinatarios.posibles(persona, correoLoPide, elegidos);
    elegidos = posibles.elegidos;
    var otroInicial = posibles.otro;

    return '<div id="correo-formulario">' +
             '<div class="cuadro-cabecera-ruta"><span id="correo-ruta-lugar"></span></div>' +
             '<div id="correo-ruta-en-linea" class="oculto"></div>' +
             '<div id="correo-script-viejo"></div>' +
             '<div class="correo-grid">' +
               '<div class="correo-col-izq">' +
                 bloqueDestinatarios(a, correos, persona, otroInicial, opcionesGrupo) +
                 bloqueAsunto(a) +
                 (bloqueAdjuntos || '') +
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
    if (!d || !d.nombre) return '';
    var texto = 'Lo pidió ' + d.nombre + (d.relacion ? ' (' + d.relacion + ')' : '') +
      (d.fecha ? ', el ' + U.fechaLegible(U.aAaMmDd(d.fecha)) : '') + '.';
    return '<p class="nota" style="margin-top:0">' + U.escapar(texto) + '</p>';
  }

  function bloqueDestinatarios(a, correos, persona, otroInicial, opcionesGrupo) {
    return avisoLoPideHtml(a) +
      '<label class="etiqueta" style="margin-top:0">Para</label>' +
      (correos.length
        ? '<div id="correo-lista">' + correos.map(function (c) {
            return '<label class="correo-fila">' +
                     '<input type="checkbox" class="correo-marca" value="' + U.escapar(c.dir) + '"' +
                       (elegidos[c.dir] ? ' checked' : '') + '>' +
                     '<span><strong>' + U.escapar(c.dir) + '</strong>' +
                     '<span class="suave"> · ' + U.escapar(c.titulo) + '</span></span>' +
                   '</label>';
          }).join('') + '</div>'
        : '<p class="nota" style="margin-top:0">' +
          (persona
            ? 'En el fichero de Séneca no hay ningún correo de ' + U.escapar(n().terceroDe(a)) + '.'
            : 'No he encontrado a ' + U.escapar(n().terceroDe(a)) + ' en los ficheros de datos.') +
          ' Escríbelo aquí abajo.</p>') +
      '<input id="correo-otro" class="campo" value="' + U.escapar(otroInicial || '') + '" ' +
        'placeholder="Otro correo, si hace falta" style="margin-top:8px">' +

      (opcionesGrupo
        ? '<label class="etiqueta">Añadir un grupo</label>' +
          '<select id="correo-grupo" class="campo"><option value="">Elige…</option>' +
            opcionesGrupo + '</select>'
        : '') +
      '<div id="correo-cco-caja">' + contenidoCco() + '</div>';
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
    /* Fila 164: la receta de un paso trae su plantilla (una vez). */
    var pedida = (n()._interno || {}).plantillaPedida;
    if (pedida && opciones.some(function (p) { return p.id === pedida; })) { plantillaElegida = pedida; n()._interno.plantillaPedida = ''; }
    if (!plantillaElegida && opciones.length) plantillaElegida = opciones[0].id;
    if (plantillaElegida && !opciones.some(function (p) { return p.id === plantillaElegida; })) {
      plantillaElegida = '';
    }

    var cuerpo = n().cuerpoDelMedio(a, plantillaElegida);
    textoProgramado = cuerpo.texto;

    /* Fila 151: sin ninguna plantilla, «Crear plantilla»; con alguna,
       «Editar plantilla» junto al desplegable, para la elegida. */
    var desplegable = opciones.length
      ? '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<div class="etiqueta-con-boton">' +
        '<select id="correo-plantilla" class="campo">' +
          '<option value="">Sin plantilla</option>' +
          opciones.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === plantillaElegida ? ' selected' : '') + '>' +
              U.escapar(p.nombre) + '</option>';
          }).join('') +
        '</select>' +
        '<button type="button" class="boton boton-chico" id="correo-plantilla-editar">Editar plantilla</button>' +
        '</div>' +
        '<div id="correo-plantilla-confirmar" class="oculto"></div>'
      : '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<button type="button" class="boton" id="correo-plantilla-crear">Crear plantilla</button>';

    return desplegable +
      '<label class="etiqueta"' + (opciones.length ? '' : ' style="margin-top:0"') + '>Cuerpo</label>' +
      (cuerpo.faltan.length
        ? '<p class="aviso aviso-ambar" id="correo-faltan-datos">Faltan datos: ' +
          U.escapar(cuerpo.faltan.join(', ')) + '</p>'
        : '') +
      '<textarea id="correo-cuerpo-texto" class="campo" rows="9">' + U.escapar(cuerpo.texto) + '</textarea>';
  }

  /* ---------- enganchar ---------- */

  function enganchar(a) {
    var caja = $('correo-caja');
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-marca'), function (c) {
      c.onchange = function () { elegidos[c.value] = c.checked; };
    });

    engancharPlantilla(a);
    engancharCco();
    engancharRuta(a);

    var selectorGrupo = $('correo-grupo');
    if (selectorGrupo) {
      selectorGrupo.onchange = async function () {
        var valor = selectorGrupo.value;
        selectorGrupo.value = '';
        var resueltos = await Destinatarios.miembrosDeOpcion(valor);   /* fila 132 */
        if (!resueltos.length) return;
        var resultado = combinarCorreosDeGrupo(resueltos);
        resultado.direcciones.forEach(function (d) { cco[d] = true; });
        resultado.sinCorreo.forEach(function (nombre) {
          if (ccoSinCorreo.indexOf(nombre) === -1) ccoSinCorreo.push(nombre);
        });
        refrescarCco();
      };
    }

    $('correo-copiar-para').onclick = function () { copiar(paraDelCuadro(), this); };
    $('correo-copiar-asunto').onclick = function () { copiar($('correo-asunto').value, this); };

    /* "Copiar Cuerpo", "Abrir en Gmail" y "Abrir en el correo del
       ordenador" son para quien quiere escribir por su cuenta: dejan
       el mismo rastro de siempre ("Correo a X"), distinto del que deja
       un envío real ("Correo enviado a X", ver textoDeLaNota en
       js/correo.js). */
    $('correo-copiar-cuerpo').onclick = function () {
      copiar($('correo-cuerpo-texto').value, this);
      if (n().apuntarElRastro) n().apuntarElRastro(a);
    };
    $('correo-gmail').onclick = function () { abrirGmail(); if (n().apuntarElRastro) n().apuntarElRastro(a); };
    $('correo-ordenador').onclick = function () { abrirDelOrdenador(); if (n().apuntarElRastro) n().apuntarElRastro(a); };

    engancharEnviar(a);

    /* Fila 178, punto 2: solo enseña lo que CorreoEnviar ya sepa del script. */
    var avisoScript = $('correo-script-viejo');
    var mensajeScript = window.CorreoEnviar && CorreoEnviar.avisoScriptViejo && CorreoEnviar.avisoScriptViejo();
    if (avisoScript) avisoScript.innerHTML = mensajeScript ? '<p class="aviso aviso-ambar">' + U.escapar(mensajeScript) + '</p>' : '';
  }

  /* El botón «Ruta» en la cabecera del cuadro (fila 152,
     docs/RUTA-QUE-NO-VA-A-BING.md, punto 3): el modo (abierto/archivado)
     sale del propio asunto, igual que en js/ficha-nombre-acciones.js. */
  function engancharRuta(a) {
    if (!window.RutaCarpetas) return;
    var interno = n()._interno || {};
    RutaCarpetas.montarEnCuadro($('correo-ruta-lugar'), $('correo-ruta-en-linea'), a, interno.modoDelAsunto || 'abierto');
  }

  function engancharPlantilla(a) {
    var desplegable = $('correo-plantilla');
    if (desplegable) desplegable.onchange = function () { elegirPlantilla(a, this.value); };

    var editar = $('correo-plantilla-editar');
    if (editar) editar.onclick = function () {
      var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
      var existente = opciones.filter(function (p) { return p.id === plantillaElegida; })[0] || null;
      abrirEditorPlantilla(a, existente);
    };
    var crear = $('correo-plantilla-crear');
    if (crear) crear.onclick = function () { abrirEditorPlantilla(a, null); };
  }

  /* Cambiar de plantilla, con la confirmación en línea de siempre si el
     cuerpo tenía algo escrito a mano (`#correo-plantilla-confirmar`):
     la misma regla al elegir del desplegable y al guardar una nueva o
     editada desde el propio cuadro (fila 151). */
  function elegirPlantilla(a, idElegida) {
    var escritoAMano = $('correo-cuerpo-texto') && $('correo-cuerpo-texto').value !== textoProgramado;
    if (!escritoAMano) { cambiarDePlantilla(a, idElegida); return; }

    var caja2 = $('correo-plantilla-confirmar');
    var desplegable = $('correo-plantilla');
    caja2.className = 'aviso aviso-ambar';
    caja2.innerHTML = '<p>Lo que hay escrito en el cuerpo se perderá.</p>';
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
    $('correo-comunes-der').innerHTML = bloqueCuerpo(a);
    engancharPlantilla(a);
  }

  /* ---------- crear/editar la plantilla desde el propio cuadro
     (25-sep-2026, fila 151, docs/PLANTILLA-DESDE-EL-CUADRO.md) ---------- */

  function abrirEditorPlantilla(a, existente) {
    var formulario = $('correo-formulario');
    var editor = $('correo-plantilla-editor');
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
    var formulario = $('correo-formulario');
    var editor = $('correo-plantilla-editor');
    if (editor) editor.className = 'oculto';
    if (formulario) formulario.className = '';
  }

  /* ---------- ENVIAR: resumen y confirmación (fila 115) ---------- */

  function ultimoHiloDelAsunto(a) {
    var hilos = a.ficha && a.ficha.hilos;
    if (!hilos || !hilos.length) return '';
    return hilos[hilos.length - 1].id || '';
  }

  /* Primeras líneas del cuerpo, recortadas: ni una pared de texto en
     el resumen, ni una sola palabra sin decir nada. */
  function primerasLineas(texto) {
    var lineas = String(texto || '').split('\n');
    var recorte = lineas.slice(0, 4).join('\n');
    if (recorte.length > 400) return recorte.slice(0, 400) + '…';
    if (lineas.length > 4) return recorte + '…';
    return recorte;
  }

  function marcasDeAdjuntos() {
    return Array.prototype.filter.call(
      document.querySelectorAll('#correo-formulario .adjunto-marca'),
      function (c) { return c.checked; }
    ).map(function (c) { return c.value; });
  }

  function engancharEnviar(a) {
    var boton = $('correo-enviar');
    if (!boton) return;
    var conectado = window.CorreoEnviar && CorreoEnviar.tieneConexion();
    if (!conectado) {
      boton.textContent = 'Conecta el envío en Ajustes → Enviar correo';
      boton.onclick = function () { if (window.CorreoEnviar) CorreoEnviar.irAAjustes(); };
      return;
    }
    boton.textContent = 'Enviar';
    boton.onclick = function () { alPulsarEnviar(a); };
  }

  function alPulsarEnviar(a) {
    var para = paraDelCuadro();
    var ccoTexto = ccoDelCuadro();
    if (!para && !ccoTexto) { U.aviso('Elige a quién se lo mandas.', 'malo'); return; }

    var marcadas = marcasDeAdjuntos();
    var totalBytes = (window.CorreoAdjuntos && CorreoAdjuntos.totalBytesDe) ? CorreoAdjuntos.totalBytesDe(marcadas) : 0;
    if (totalBytes > (window.CorreoAdjuntos ? CorreoAdjuntos.MAXIMO_BYTES : 20 * 1024 * 1024)) {
      var tl = window.CorreoAdjuntos ? CorreoAdjuntos.tamanoLegible(totalBytes) : (totalBytes + ' B');
      U.aviso('Eso pesa ' + tl + '. Gmail no admite más de 20 MB.', 'malo');
      return;
    }

    pintarResumen(a, {
      para: para,
      cco: ccoTexto,
      asunto: $('correo-asunto') ? $('correo-asunto').value : '',
      cuerpo: $('correo-cuerpo-texto') ? $('correo-cuerpo-texto').value : '',
      adjuntos: marcadas
    });
  }

  /* Sale DENTRO del mismo cuadro (regla de U.preguntar: nunca un
     segundo cuadro encima). `#correo-formulario` y `#correo-resumen`
     son hermanos: se alterna cuál se ve, así que "Volver" no pierde
     nada de lo escrito a mano, sin tener que volver a montar nada. */
  function pintarResumen(a, datos) {
    var formulario = $('correo-formulario');
    var resumen = $('correo-resumen');
    if (!formulario || !resumen) return;

    var listaTam = (window.CorreoAdjuntos && CorreoAdjuntos.listaConTamanos) ? CorreoAdjuntos.listaConTamanos() : [];
    var porNombre = {};
    listaTam.forEach(function (f) { porNombre[f.nombre] = f.tam; });
    var tl = window.CorreoAdjuntos ? CorreoAdjuntos.tamanoLegible : function (b) { return b + ' B'; };

    resumen.innerHTML =
      '<h3 style="margin-top:0">Vas a mandar este correo</h3>' +
      '<p><strong>Para:</strong> ' +
        (datos.para ? U.escapar(datos.para) : '<span class="suave">(nadie en Para; va en copia oculta)</span>') +
      '</p>' +
      (datos.cco ? '<p><strong>Copia oculta:</strong> ' + U.escapar(datos.cco) + '</p>' : '') +
      '<p><strong>Asunto:</strong> ' + U.escapar(datos.asunto) + '</p>' +
      '<p class="nota" style="white-space:pre-wrap">' + U.escapar(primerasLineas(datos.cuerpo)) + '</p>' +
      (datos.adjuntos.length
        ? '<p><strong>Documentos</strong></p><ul>' + datos.adjuntos.map(function (nombre) {
            return '<li>' + U.escapar(nombre) + (porNombre[nombre] !== undefined ? ' · ' + tl(porNombre[nombre]) : '') + '</li>';
          }).join('') + '</ul>'
        : '<p class="nota">Sin documentos adjuntos.</p>') +
      '<div id="correo-resumen-aviso"></div>' +
      '<div class="correo-botones" style="margin-top:14px">' +
        '<button type="button" class="boton boton-principal" id="correo-confirmar-envio">Confirmar y enviar</button>' +
        '<button type="button" class="boton" id="correo-resumen-volver">Volver</button>' +
      '</div>';

    formulario.className = 'oculto';
    resumen.className = '';

    $('correo-resumen-volver').onclick = function () {
      resumen.className = 'oculto';
      formulario.className = '';
    };
    /* Fila 130: un identificador por cuadro de confirmación; si se vuelve
       a pulsar aquí mismo, el mismo (el script no manda dos veces). */
    var idEnvio = CorreoEnviar.nuevoIdEnvio ? CorreoEnviar.nuevoIdEnvio() : '';
    $('correo-confirmar-envio').onclick = function () { confirmarEnvio(a, datos, idEnvio); };
  }

  async function confirmarEnvio(a, datos, idEnvio) {
    var boton = $('correo-confirmar-envio');
    var volver = $('correo-resumen-volver');
    var avisoEl = $('correo-resumen-aviso');
    if (avisoEl) avisoEl.innerHTML = '';
    if (boton) { boton.disabled = true; boton.textContent = 'Enviando…'; }
    if (volver) volver.disabled = true;

    try {
      var adjuntosBase64 = [];
      for (var i = 0; i < datos.adjuntos.length; i++) {
        var origen = await a.handle.getFileHandle(datos.adjuntos[i]);
        var fichero = await origen.getFile();
        var base64 = await CorreoAdjuntos.aBase64(fichero);
        adjuntosBase64.push({ nombre: datos.adjuntos[i], tipo: fichero.type || 'application/octet-stream', base64: base64 });
      }

      var respuesta = await CorreoEnviar.enviar({
        para: datos.para,
        cco: datos.cco,
        asunto: datos.asunto,
        cuerpo: datos.cuerpo,
        hilo: ultimoHiloDelAsunto(a),
        adjuntos: adjuntosBase64,
        idEnvio: idEnvio || ''
      });
      if (!respuesta || !respuesta.ok) {
        var fallo = new Error((respuesta && respuesta.motivo) || 'El envío no ha salido bien.');
        fallo.sinSaber = !!(respuesta && respuesta.sinSaber);
        throw fallo;
      }

      documentosAdjuntados = datos.adjuntos.slice();
      if (respuesta.hilo) { try { await anadirHiloAlAsunto(a, respuesta.hilo, datos.asunto); } catch (e) { /* accesorio */ } }
      if (n().marcarEnvioRealizado) n().marcarEnvioRealizado();
      if (n().apuntarElRastro) n().apuntarElRastro(a);

      var resumen = $('correo-resumen');
      if (resumen) {
        resumen.innerHTML = '<p class="aviso aviso-ambar"><strong>Correo enviado a ' +
          U.escapar(datos.para || datos.cco || 'la cuenta') + '.</strong></p>';
      }
      U.aviso('Correo enviado a ' + (datos.para || datos.cco || '') + '.', 'bueno');
    } catch (e) {
      if (avisoEl) {
        /* Fila 130: si venció el tiempo, no se sabe si ha salido: ámbar. */
        avisoEl.innerHTML = e && e.sinSaber
          ? '<p class="aviso aviso-ambar">' + U.escapar(e.message) + '</p>'
          : '<p class="aviso aviso-rojo">No he podido enviarlo: ' + U.escapar(U.mensajeDeError(e)) + '</p>';
      }
      if (boton) { boton.disabled = false; boton.textContent = 'Confirmar y enviar'; }
      if (volver) volver.disabled = false;
    }
  }

  /* Deja el hilo del correo enviado enganchado al asunto (como un
     correo guardado desde la bandeja): así la respuesta del tercero
     entra sola. No crítico: si falla, el correo ya ha salido. */
  /* Fila 176: fundido con App.anotarLista, no mandado entero. */
  async function anadirHiloAlAsunto(a, hiloId, asuntoTexto) {
    var huella = {
      id: hiloId, asunto: String(asuntoTexto || a.nombre).toLowerCase(), visto: 1,
      matriculas: [], metidoPor: App.E.usuario, metidoEl: U.ahora()
    };
    await App.anotarLista(a.nombre, 'hilos', { anadir: [huella] });
    if (a.ficha) a.ficha.hilos = App.unirPorIdentidad(a.ficha.hilos, [huella], App.IDENTIDAD_LISTA.hilos);
    if (window.Bandeja && window.Bandeja.escribirSeguidos) await window.Bandeja.escribirSeguidos();
  }

  /* ---------- lo que usa js/correo.js ----------

     `textoDeLaNota` (js/correo.js) necesita "a quién" y "con cuántos
     documentos" para el rastro que se apunta en las notas del asunto;
     js/correo-adjuntos.js ya no lee "Para"/la copia oculta del DOM: se
     lee aquí mismo, al enviar. */
  return {
    cuerpoHtml: cuerpoHtml,
    enganchar: enganchar,
    paraDelCuadro: paraDelCuadro,
    ccoDirecciones: function () { return Object.keys(cco); },
    documentosAdjuntados: function () { return documentosAdjuntados; }
  };
})();
window.CorreoCuadro = CorreoCuadro;
