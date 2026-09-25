/* ============================================================
   correo.js — el correo de un asunto, con los campos ya escritos.

   Desde el 24-sep-2026 (fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md) la
   aplicación SÍ envía correo: el botón "Enviar" del cuadro de Correo
   (js/correo-cuadro.js), tras confirmar un resumen, llama a la
   aplicación web de Apps Script (js/correo-enviar.js) y el mensaje
   sale en ese momento, con sus documentos. Esto sustituye a la regla
   de siempre ("la aplicación nunca envía nada"): el correo solo sale
   tras "Confirmar y enviar", nunca antes. Lo que sigue haciendo este
   fichero es preparar las tres piezas de un correo —a quién va, el
   asunto y el cuerpo— sacándolas del propio asunto y de los ficheros
   de Séneca, y dejarlas listas para pegar, para abrir la ventana de
   redactar de Gmail, o para el envío real:

     - PARA: los correos que trae el fichero del tercero. En el
       alumnado son los de los tutores legales, y salen con casilla
       para elegir a quién se le escribe.
     - ASUNTO: el nombre de la carpeta, siempre (fila 55, 18-sep-2026,
       docs/ASUNTO-SIN-ELECCION.md): es la pista que permite reconocer
       después a qué asunto pertenece cada mensaje del hilo.
     - CUERPO: el saludo y la despedida hechos; el medio, en blanco.

   Lo único que sí queda guardado, se envíe o no, es el rastro: en
   cuanto se copia el cuerpo, se abre la ventana de redactar o se
   envía de verdad, se apunta una nota en el asunto diciendo a quién se
   le ha escrito y qué día (con "enviado" cuando de verdad ha salido).
   Así el compañero ve lo que ya está hecho sin tener que preguntar.
   Debajo salen además el botón para dejar el asunto a la espera del
   tercero y el recordatorio de guardar el PDF del hilo en la carpeta
   (cuando no se ha enviado por aquí, que ya lo deja solo la bandeja).

   El mismo cuadro sirve para la MENSAJERÍA DE SÉNECA, con un cambio:
   allí el destinatario no se escribe, se elige de las listas del propio
   Séneca (Utilidades → Comunicaciones). Así que no hay "Para": solo el
   asunto y el texto, y un botón que los va dando de uno en uno, en el
   orden en que hay que pegarlos. Séneca nunca envía desde aquí: solo
   Correo.

   El cuadro de Correo (con "Para", los grupos, los documentos y el
   botón "Enviar") vive en js/correo-cuadro.js desde la fila 58
   (18-sep-2026, docs/AJUSTES-DE-USO-2026-09-18.md, 5): este fichero se
   había ido a más de 800 líneas. Aquí solo queda lo que comparten los
   dos cuadros (Correo y Séneca): el asunto y el cuerpo del mensaje, a
   quién se escribe en palabras, y el rastro que se apunta en las notas
   del asunto.

   Desde la fila 133 (24-sep-2026, docs/PARTIR-FICHEROS-GRANDES.md) los
   grupos para la copia oculta (window.CorreoGrupos) viven en
   js/correo-grupos.js y el rastro que queda en el asunto en
   js/correo-rastro.js, que se cargan justo después. El estado del
   cuadro que comparten está en `CorreoNucleo._interno` (I).
   ============================================================ */
(function () {
  var I = {};
  /* Lo que js/correo-rastro.js llama de aquí. */
  I.categoriaDe = categoriaDe; I.terceroDe = terceroDe; I.soloElNombre = soloElNombre;

  I.viendo = null;         /* el asunto que se está mirando */
  I.modoDelAsunto = 'abierto';
  I.yaApuntado = false;    /* la nota se escribe una vez por cuadro, no una por botón */
  I.porSeneca = false;     /* true: el cuadro es el de la mensajería de Séneca */
  I.algoCambiado = false;  /* al cerrar, la ficha se repinta si se ha tocado algo */
  I.envioRealizado = false; /* true: el correo ha salido de verdad por "Enviar" (fila 115) */

  var plantillasDatos = null;   /* _GESTOR/plantillas.json, ya leído */
  var valoresActuales = null;   /* Plantillas.valoresDeAsunto(a), calculado una vez por apertura
                                    (fila 17 de la cola: es la fuente única de los huecos, para
                                    que un documento de Word y un correo lean de un solo sitio) */
  var MAXIMO_LETRAS_SENECA = 4000;

  /* "Pedir lo que falta" (18-sep-2026, fila 59, docs/REQUISITOS-DE-HITO.md,
     sección 7): el texto de las casillas sin marcar de un hito, cuando
     el cuadro se abre desde ese botón; vacío en cualquier otra
     apertura. Ver cuerpoDelMedio, más abajo. */
  var loQueFaltaActual = '';

  /* "Comunicar" desde un hito (18-sep-2026, fila 60,
     docs/COMUNICAR-DESDE-EL-HITO.md): cuando el cuadro se abre desde
     el botón de un hito, js/hitos-comunicar.js ya trae el asunto y el
     cuerpo del mensaje resueltos (con sus huecos sustituidos) y, si lo
     sabe, una dirección preferente; el cuadro los enseña tal cual, sin
     pasar por el desplegable de plantillas del tipo. `comunicarHitoActual`
     guarda a quién se ha creído que se escribe y qué hito lo pidió, para
     la constancia que deja `apuntarElRastro` (sección 5.3: una nota en
     el asunto y una línea en el historial del hito, una sola vez). */
  var asuntoListoActual = '';
  var medioListoActual = '';
  var correoPreferenteActual = '';
  I.comunicarHitoActual = null;
  /* Documentos del hito ya marcados en "Documentos de este asunto"
     (23-sep-2026, fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, sección
     3): `extra.adjuntosMarcados`, una lista de nombres. Solo tiene
     efecto en Correo (en Séneca no hay adjuntos). */
  var adjuntosMarcadosActual = [];
  /* Fila 153 (docs/ENVIAR-DOCUMENTO-POR-SENECA.md): el nombre del
     documento a señalar en el cuadro de Séneca cuando el «Enviar ▾»
     de un documento del hito elige "Por Séneca" (no hay adjuntos de
     verdad allí: se marca el nombre para copiarlo y pegarlo a mano). */
  var documentoSenecaActual = '';

  function $(id) { return document.getElementById(id); }

  /* ---------- de dónde salen los datos ---------- */

  function categoriaDe(a) {
    return (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || '';
  }

  function terceroDe(a) {
    var f = a.ficha || {}, l = a.leido || {};
    if (f.tercero) return f.tercero;
    if (l.resto) return Nombres.terceroDeResto(l.resto);
    return '';
  }

  /* El nombre de la persona, sin el número de identificación ni el NIF
     que lleva pegado detrás. Es lo que se escribe en el saludo. */
  function soloElNombre(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* Se busca en el mismo fichero que usa la pantalla de Personas. Si el
     nombre lleva pegado el número, se prueba también sin él. */
  async function buscarPersona(a) {
    var categoria = categoriaDe(a);
    var quien = terceroDe(a);
    if (!categoria || !quien || !App.E.datos) return null;
    var fuente = await Datos.cargar(App.E.datos, categoria);
    var lista = Datos.buscar(fuente.lista, quien, 1);
    if (!lista.length) lista = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
    if (!lista.length) lista = Datos.buscar(fuente.lista, soloElNombre(quien), 1);
    return lista.length ? lista[0] : null;
  }

  /* ---------- los tres campos ---------- */

  /* El asunto del mensaje es siempre el nombre de la carpeta (fila 55,
     18-sep-2026, docs/ASUNTO-SIN-ELECCION.md): es lo que permite
     reconocer después a qué asunto pertenece cada mensaje del hilo.
     Antes había una "versión legible" alternativa, con sus dos
     botones para elegir una u otra; se ha quitado, junto con la
     función que la fabricaba (`piezasDelNombre`, que ya no tiene para
     qué usarse) y el estado que guardaba cuál estaba elegida. */
  function asuntoDelCorreo(a) {
    return asuntoListoActual || a.nombre;
  }

  /* Desde la fila 17 de la cola, {firma} ya sale calculado dentro de
     Plantillas.valoresDeAsunto (con sus propios huecos sustituidos):
     un solo sitio que sepa cómo se monta. Si por lo que sea no se ha
     podido calcular (fallo de red, cuadro recién abierto), se cae en
     lo de siempre. */
  function textoDeLaFirma() {
    if (valoresActuales && valoresActuales.firma) return valoresActuales.firma;
    return Plantillas.rellenar(Plantillas.POR_DEFECTO_FIRMA, {
      usuario: App.E.usuario || '', centro: Plantillas.POR_DEFECTO_CENTRO
    }).texto;
  }

  /* El cuerpo entero: saludo, el medio (en blanco, o la plantilla
     elegida con sus huecos ya rellenos) y la firma. Devuelve también
     los huecos que se han quedado sin dato, para el aviso de arriba.
     `paraSeneca` (fila 170): el cuadro de Séneca usa el `textoSeneca`
     de la plantilla si lo tiene (allí no se adjunta nada); si no, `texto`. */
  function cuerpoDelMedio(a, idPlantilla, paraSeneca) {
    var categoria = categoriaDe(a);
    var nombre = soloElNombre(terceroDe(a));
    var saludo;
    if (categoria === 'ALUMNADO') {
      saludo = 'Estimados tutores legales de ' + nombre + ':';
    } else if (categoria === 'PERSONAL') {
      saludo = 'Hola' + (nombre ? ', ' + nombre : '') + ':';
    } else {
      saludo = 'Buenos días:';
    }

    var medio = '', faltan = [];

    /* "Comunicar" desde un hito (fila 60): el medio ya viene resuelto,
       sin pasar por ninguna plantilla del tipo ni por el hueco
       {{LO QUE FALTA}} (ese es cosa de la fila 59, para la plantilla
       general; aquí el texto es el propio del paso). */
    if (medioListoActual) {
      medio = medioListoActual;
    } else {
      var plantilla = idPlantilla && plantillasDatos
        ? plantillasDatos.lista.filter(function (p) { return p.id === idPlantilla; })[0]
        : null;
      var textoPlantilla = plantilla
        ? ((paraSeneca && String(plantilla.textoSeneca || '').trim()) ? plantilla.textoSeneca : plantilla.texto)
        : '';
      if (plantilla) {
        var valoresConLoQueFalta = Object.assign({}, valoresActuales || {}, { loQueFalta: loQueFaltaActual });
        var r = Plantillas.rellenar(textoPlantilla, valoresConLoQueFalta);
        medio = r.texto;
        faltan = r.faltan;
      }

      /* Si "Pedir lo que falta" trae texto y la plantilla (o la falta de
         plantilla) no llevaba el hueco {{LO QUE FALTA}} de todas formas,
         se añade al final, separado por una línea en blanco (sección 7
         del encargo): el hueco, cuando existe en la plantilla, ya lo ha
         metido Plantillas.rellenar en su sitio. */
      if (loQueFaltaActual && !(plantilla && Plantillas.tieneLoQueFalta(textoPlantilla))) {
        medio = medio ? (medio + '\n\n' + loQueFaltaActual) : loQueFaltaActual;
      }
    }

    var firma = textoDeLaFirma();
    var texto = medio ? (saludo + '\n\n' + medio + '\n\n' + firma) : (saludo + '\n\n\n\n' + firma);
    return { texto: texto, faltan: faltan };
  }

  /* ---------- el cuadro ----------

     La disposición de los dos cuadros (Séneca, fila 53; Correo, fila
     58) es cosa de js/seneca-cuadro.js y js/correo-cuadro.js: aquí solo
     se decide cuál tocaba, se prepara lo que los dos necesitan
     (persona, plantillas, valores) y se llama al que toque. */

  async function abrirCuadro(a, deSeneca, extra) {
    I.viendo = a;
    I.porSeneca = !!deSeneca;
    loQueFaltaActual = (extra && extra.loQueFalta) || '';
    asuntoListoActual = (extra && extra.asuntoListo) || '';
    medioListoActual = (extra && extra.medioListo) || '';
    correoPreferenteActual = (extra && extra.correoPreferente) || '';
    I.comunicarHitoActual = (extra && extra.comunicarHito) || null;
    adjuntosMarcadosActual = (extra && extra.adjuntosMarcados) || [];
    documentoSenecaActual = (extra && extra.documentoSeneca) || '';
    /* Fila 164: la plantilla de la receta de un paso, ya elegida. */
    I.plantillaPedida = (extra && extra.plantilla) || '';
    if (window.SenecaDestinatarios) SenecaDestinatarios.limpiar();
    I.yaApuntado = false;
    I.algoCambiado = false;
    I.envioRealizado = false;
    /* El cuadro de Séneca ocupa más ancho que el de Correo (fila 53,
       docs/SENECA-CUADRO-ANCHO.md): mismo patrón que .cuadro-ancho en
       js/documentos.js, con su propia clase y un tope menor. Correo
       usa `.cuadro-correo` (fila 58, docs/AJUSTES-DE-USO-2026-09-18.md,
       5), con el mismo ancho pero cabecera y botonera fijas. */
    var cuadroEl = document.querySelector('#capa .cuadro');
    if (cuadroEl) {
      cuadroEl.classList.toggle('cuadro-seneca', I.porSeneca);
      cuadroEl.classList.toggle('cuadro-correo', !I.porSeneca);
    }
    var esperar = U.preguntar(I.porSeneca ? 'Mensaje por Séneca' : 'Correo de este asunto',
      '<div id="correo-caja"><p class="explica">Preparando…</p></div>', 'Cerrar', true);
    var persona = null;
    try { persona = await buscarPersona(a); } catch (e) { persona = null; }
    try { plantillasDatos = await Plantillas.cargar(App.E.gestor); } catch (e) { plantillasDatos = null; }
    try { valoresActuales = await Plantillas.valoresDeAsunto(a); } catch (e) { valoresActuales = null; }
    await pintarCuadro(a, persona);
    await esperar;
    if (cuadroEl) { cuadroEl.classList.remove('cuadro-seneca'); cuadroEl.classList.remove('cuadro-correo'); }
    /* Si se ha apuntado la nota o cambiado el estado, la ficha que hay
       detrás se ha quedado vieja: se vuelve a abrir. */
    if (I.algoCambiado) App.abrirFicha(a, I.modoDelAsunto);
  }

  async function pintarCuadro(a, persona) {
    var caja = $('correo-caja');
    if (!caja) return;

    /* Los documentos del asunto no van en el cuadro de Séneca: allí no
       hay adjuntos. El desplegable "Añadir un grupo" sí va en los dos
       cuadros (fila 47, docs/DESTINATARIOS-EN-SENECA.md): en Correo
       saca correos, en Séneca usuarios IdEA. */
    var bloqueAdjuntos = '';
    var opcionesGrupo = '';
    if (!I.porSeneca && window.CorreoAdjuntos) {
      try { bloqueAdjuntos = await CorreoAdjuntos.pintarBloque(a, adjuntosMarcadosActual); } catch (e) { bloqueAdjuntos = ''; }
    }
    try { opcionesGrupo = await window.CorreoGrupos.opciones(); } catch (e) { opcionesGrupo = ''; }

    if (I.porSeneca) {
      caja.innerHTML = window.SenecaCuadro ? SenecaCuadro.cuerpoHtml(a, opcionesGrupo) : '';
      if (window.SenecaCuadro) SenecaCuadro.enganchar(a);
      if (window.SenecaDestinatarios) SenecaDestinatarios.enganchar();
      return;
    }

    caja.innerHTML = window.CorreoCuadro ? CorreoCuadro.cuerpoHtml(a, persona, bloqueAdjuntos, opcionesGrupo) : '';
    if (window.CorreoCuadro) CorreoCuadro.enganchar(a);
  }

  /* El cuadro de Séneca vive en js/seneca-cuadro.js (fila 53) y el de
     Correo en js/correo-cuadro.js (fila 58): este fichero solo pone a
     su disposición, en `window.CorreoNucleo` (más abajo), las piezas
     que comparten los dos. */

  /* Las plantillas del tipo de este asunto. Con una sola, es la que
     sale puesta; con ninguna, el desplegable no se pinta. */
  function plantillasDelTipo(a) {
    if (!plantillasDatos) return [];
    var categoria = categoriaDe(a);
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
    return Plantillas.deTipo(plantillasDatos, categoria, tipo);
  }

  /* Fila 151: tras crear o editar una plantilla desde el propio cuadro,
     `plantillasDatos` (leído una vez al abrir) se ha quedado viejo:
     se vuelve a leer para que el desplegable y `plantillasDelTipo` vean
     ya la nueva. */
  async function recargarPlantillas() {
    try { plantillasDatos = await Plantillas.cargar(App.E.gestor); } catch (e) { /* se queda con lo que había */ }
    return plantillasDatos;
  }

  /* ---------- lo que usa js/seneca-cuadro.js y js/correo-cuadro.js ----------

     Los dos cuadros viven aparte, pero comparten con este la forma de
     sacar el asunto, el cuerpo (con su plantilla) y el "a quién", y el
     rastro que se apunta en las notas del asunto. Se expone tal cual,
     sin copiar nada de esto en ninguno de los dos ficheros. */
  /* Las dos opciones del menú "Comunicar" (Correo electrónico / Mensaje
     de Séneca), reutilizadas tal cual por el botón "Pedir lo que falta"
     de un hito (js/hitos-requisitos.js, fila 59): `extra` es lo mismo
     que recibe abrirCuadro, con `loQueFalta` cuando toca. */
  function opcionesComunicar(a, extra) {
    return [
      { texto: 'Correo electrónico', alPulsar: function () { abrirCuadro(a, false, extra); } },
      { texto: 'Mensaje de Séneca', alPulsar: function () { abrirCuadro(a, true, extra); } }
    ];
  }

  window.CorreoNucleo = {
    _interno: I,
    categoriaDe: categoriaDe,
    terceroDe: terceroDe,
    soloElNombre: soloElNombre,
    asuntoDelCorreo: asuntoDelCorreo,
    plantillasDelTipo: plantillasDelTipo,
    recargarPlantillas: recargarPlantillas,
    cuerpoDelMedio: cuerpoDelMedio,
    MAXIMO_LETRAS_SENECA: MAXIMO_LETRAS_SENECA,
    /* Abrir un cuadro directamente, sin pasar por el menú "Comunicar":
       lo usa js/hitos-comunicar.js (fila 60) cuando el paso del hito
       solo tiene texto para un canal. */
    abrirCuadro: abrirCuadro,
    /* La dirección que haya propuesto un hito para este cuadro (fila
       60), si la hay: js/correo-cuadro.js la usa igual que ya usaba la
       de "Lo pide" (LoPide.correoDe). */
    destinatarioPreferente: function () { return correoPreferenteActual; },
    /* Fila 153: el documento a señalar en el cuadro de Séneca, si el
       cuadro se abrió con «Enviar ▾» → «Por Séneca» de un documento del
       hito. js/seneca-cuadro.js lo usa para la línea "Adjunta este
       documento en Séneca: …" con su botón "Copiar el nombre". */
    documentoSeneca: function () { return documentoSenecaActual; },
    /* Fila 115: js/correo-cuadro.js avisa aquí en cuanto el correo ha
       salido de verdad, para que textoDeLaNota diga "enviado" y el
       recordatorio del PDF del hilo no salga de más. */
    marcarEnvioRealizado: function () { I.envioRealizado = true; },
    /* Monta sobre `boton` el mismo menú pequeño "Comunicar" (Correo /
       Séneca) que lleva la cabecera de la ficha, sin duplicar ese
       camino (fila 59, sección 7 del encargo). */
    montarBotonComunicar: function (boton, a, extra) {
      if (window.FichaMenus) FichaMenus.montar(boton, opcionesComunicar(a, extra));
    }
  };

  /* ---------- los botones dentro de la ficha del asunto ---------- */

  (function () {
    var actual = null;

    var nueva = U.envolver(App, 'App.abrirFicha', 'correo.js', function (comoEra) {
      return function (a, modo) {
        actual = a;
        I.modoDelAsunto = modo || 'abierto';
        comoEra(a, modo);
        poner();
      };
    });
    if (!nueva) return;

    /* "Correo" y "Mensaje Séneca" se juntan en un solo botón,
       "Comunicar" (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md,
       9): mismo menú pequeño que los tres puntos del nombre
       (js/ficha-menus.js). Entra ANTES del botón de Archivar/Reabrir
       (`.boton-principal`, siempre el último de la barra): este
       fichero pinta por su cuenta, en un `MutationObserver` que puede
       saltar después de que js/ficha-asunto.js ya haya puesto ese
       botón, así que no basta con `appendChild`. */
    function poner() {
      if (!actual) return;
      var caja = $('ficha-acciones');
      if (!caja || caja.querySelector('.boton-comunicar')) return;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton boton-comunicar';
      b.textContent = 'Comunicar';
      b.title = 'Escribir un correo o un mensaje de Séneca de este asunto';

      var principal = caja.querySelector('.boton-principal');
      if (principal) caja.insertBefore(b, principal); else caja.appendChild(b);

      FichaMenus.montar(b, opcionesComunicar(actual));
    }

    var pantalla = $('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { poner(); })
        .observe(pantalla, { childList: true, subtree: true });
    }
  })();

})();
