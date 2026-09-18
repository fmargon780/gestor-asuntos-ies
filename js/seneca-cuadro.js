/* ============================================================
   seneca-cuadro.js — el cuadro de "Mensaje de Séneca" (18-sep-2026,
   fila 53, docs/SENECA-CUADRO-ANCHO.md).

   Antes vivía dentro de js/correo.js, compartiendo cuadro con el
   correo normal. Aquí Séneca no tiene "Para": el destinatario no se
   escribe, se elige en la propia lista de Séneca (Utilidades →
   Comunicaciones), así que el cuadro es distinto del todo: ancho
   (hasta 1100px) y a dos columnas desde 900px — a la izquierda el
   aviso, "Añadir un grupo", los destinatarios y el Asunto; a la
   derecha el Texto del mensaje, ocupando toda la columna.

   Nada de esto cambia lo que hace cada pieza: solo dónde vive y cómo
   se ve. Reutiliza, expuesto por js/correo.js como `window.CorreoComun`
   (igual que ya hacía `window.CorreoGrupos` para el desplegable
   "Añadir un grupo"), lo que los dos cuadros necesitan igual: de qué
   categoría es el tercero, su nombre sin el número, el asunto en sus
   dos versiones, el cuerpo con la plantilla ya rellena, a quién se
   escribe en palabras, y el estado de espera del centro. */
(function () {

  var viendo = null;
  var modoDelAsunto = 'abierto';
  var asuntoLargo = false;      /* en Séneca manda la versión legible: el nombre de la carpeta no cabe */
  var yaApuntado = false;       /* la nota se escribe una vez por cuadro, no una por botón */
  var algoCambiado = false;     /* al cerrar, la ficha se repinta si se ha tocado algo */
  var plantillaElegida = '';
  var textoProgramado = '';     /* lo último que ha escrito el propio cuadro, para saber si se ha tocado a mano */
  var plantillasDatos = null;
  var valoresActuales = null;
  var MAXIMO_LETRAS = 4000;

  function $(id) { return document.getElementById(id); }

  /* ---------- copiar, con "Copiado" en el propio botón ----------

     Mismo aviso de siempre (js/copiar.js), pero cada uno de los dos
     botones numerados copia lo suyo, siempre, se pulse en el orden
     que se pulse (docs/SENECA-CUADRO-ANCHO.md, 3.4): no hay un solo
     botón que vaya cambiando de significado. */
  function copiarConAviso(boton, texto, alCopiar) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    if (!(navigator.clipboard && navigator.clipboard.writeText)) {
      U.aviso('Este navegador no deja copiar solo.', 'malo');
      return;
    }
    navigator.clipboard.writeText(texto).then(function () {
      var antes = boton.textContent;
      boton.textContent = 'Copiado';
      setTimeout(function () { boton.textContent = antes; }, 1400);
      if (alCopiar) alCopiar();
    }).catch(function () { U.aviso('No he podido copiarlo.', 'malo'); });
  }

  /* ---------- el rastro que queda en el asunto ----------

     Igual que en js/correo.js: se apunta una nota una sola vez por
     cuadro, con el botón de dejarlo en espera del tercero debajo. */

  function textoDeLaNota() {
    var asunto = $('seneca-asunto') ? $('seneca-asunto').value : '';
    var cola = asunto ? ' — asunto: "' + asunto + '"' : '';
    return 'Mensaje por Séneca a ' + (CorreoComun.aQuien(viendo) || 'el tercero') + cola;
  }

  async function apuntarElRastro(a) {
    if (yaApuntado) { pintarRastro(a, ''); return; }
    yaApuntado = true;
    if (modoDelAsunto === 'archivado' || !window.Notas) { pintarRastro(a, ''); return; }
    try {
      await window.Notas.anadir(a, textoDeLaNota());
      algoCambiado = true;
      pintarRastro(a, 'Apuntado en las notas del asunto.');
    } catch (e) {
      pintarRastro(a, 'No he podido apuntarlo en el asunto: ' + e.message);
    }
  }

  function pintarRastro(a, aviso) {
    var caja = $('seneca-caja');
    if (!caja) return;
    var sitio = $('seneca-rastro');
    if (!sitio) {
      sitio = document.createElement('div');
      sitio.id = 'seneca-rastro';
      sitio.className = 'aviso aviso-ambar';
      sitio.style.marginTop = '14px';
      caja.appendChild(sitio);
    }

    var espera = CorreoComun.estadoDeEspera();
    var ahora = (a.ficha && a.ficha.situacion) || '';
    var puedeEsperar = modoDelAsunto !== 'archivado' && espera && ahora !== espera;

    sitio.innerHTML = '<strong>' + U.escapar(aviso || 'Rastro del mensaje') + '</strong>' +
      '<p>Acuérdate de guardar el PDF del hilo en la carpeta del asunto, con "Documentos ▾".</p>';

    if (!puedeEsperar) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.style.marginTop = '8px';
    b.textContent = 'Poner el asunto en ' + espera;
    b.onclick = async function () {
      b.disabled = true;
      try {
        await App.ponerEstado(a, espera);
        if (a.ficha) a.ficha.situacion = espera;
        algoCambiado = true;
        b.textContent = 'Hecho: ' + espera;
      } catch (e) {
        b.disabled = false;
        U.aviso('No he podido cambiar el estado: ' + e.message, 'malo');
      }
    };
    sitio.appendChild(b);
  }

  /* ---------- el cuadro ---------- */

  async function abrir(a, modo) {
    viendo = a;
    modoDelAsunto = modo || 'abierto';
    asuntoLargo = false;
    yaApuntado = false;
    algoCambiado = false;
    plantillaElegida = '';
    if (window.SenecaDestinatarios) SenecaDestinatarios.limpiar();

    var esperar = U.preguntar('Mensaje por Séneca',
      '<div id="seneca-caja"><p class="explica">Preparando…</p></div>', 'Cerrar', true);
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-seneca');

    try { plantillasDatos = await Plantillas.cargar(App.E.gestor); } catch (e) { plantillasDatos = null; }
    try { valoresActuales = await Plantillas.valoresDeAsunto(a); } catch (e) { valoresActuales = null; }
    var opcionesGrupo = '';
    try { opcionesGrupo = (window.CorreoGrupos && await CorreoGrupos.opciones()) || ''; } catch (e) { opcionesGrupo = ''; }

    pintarCuadro(a, opcionesGrupo);
    await esperar;
    if (cuadro) cuadro.classList.remove('cuadro-seneca');
    /* Si se ha apuntado la nota o cambiado el estado, la ficha que hay
       detrás se ha quedado vieja: se vuelve a abrir. */
    if (algoCambiado) App.abrirFicha(a, modoDelAsunto);
  }

  function pintarCuadro(a, opcionesGrupo) {
    var caja = $('seneca-caja');
    if (!caja) return;
    var quien = CorreoComun.aQuien(a);

    caja.innerHTML =
      '<p class="seneca-aviso-linea">' +
        '<strong>En Séneca: Utilidades → Comunicaciones.</strong> Los destinatarios se marcan allí' +
        (quien ? ', en su lista: <strong>' + U.escapar(quien) + '</strong>' : ', en su lista') + '.' +
      '</p>' +
      '<div class="seneca-grid">' +
        '<div class="seneca-col-izq">' +
          (window.SenecaDestinatarios ? SenecaDestinatarios.bloqueHtml(opcionesGrupo) : '') +
          asuntoHtml(a) +
        '</div>' +
        '<div class="seneca-col-der">' + textoHtml(a) + '</div>' +
      '</div>' +
      '<div class="seneca-pasos">' +
        '<button type="button" class="boton boton-principal" id="seneca-paso-asunto">1. Copiar el asunto</button>' +
        '<button type="button" class="boton" id="seneca-paso-texto">2. Copiar el texto</button>' +
      '</div>' +
      '<div id="seneca-ayudante" class="seneca-ayudante-fila"></div>';

    engancharAsunto(a);
    engancharTexto(a);
    engancharPasos(a);
    if (window.SenecaDestinatarios) SenecaDestinatarios.enganchar();
    if (window.SenecaAyudante) SenecaAyudante.pintarPlegado($('seneca-ayudante'));
  }

  /* ---------- el asunto (columna izquierda) ---------- */

  function asuntoHtml(a) {
    var texto = CorreoComun.asuntoDelCorreo(a, asuntoLargo);
    return '<label class="etiqueta" style="margin-top:0">Asunto</label>' +
      '<textarea id="seneca-asunto" class="campo" rows="2">' + U.escapar(texto) + '</textarea>' +
      '<div class="seneca-asunto-pie">' +
        '<span>' +
          '<button type="button" class="boton boton-chico" id="seneca-nombre-carpeta">Nombre de la carpeta</button> ' +
          '<button type="button" class="boton boton-chico" id="seneca-legible">Versión legible</button>' +
        '</span>' +
        '<span class="seneca-asunto-cuenta" id="seneca-asunto-cuenta"></span>' +
      '</div>';
  }

  function autoAlto(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function actualizarCuenta() {
    var el = $('seneca-asunto'), cuenta = $('seneca-asunto-cuenta');
    if (el && cuenta) cuenta.textContent = el.value.length + ' caracteres';
  }

  function engancharAsunto(a) {
    var el = $('seneca-asunto');
    autoAlto(el);
    actualizarCuenta();
    el.addEventListener('input', function () { autoAlto(el); actualizarCuenta(); });

    function marcarBotonDelAsunto() {
      $('seneca-nombre-carpeta').classList.toggle('boton-marcado', asuntoLargo);
      $('seneca-legible').classList.toggle('boton-marcado', !asuntoLargo);
    }
    $('seneca-nombre-carpeta').onclick = function () {
      asuntoLargo = true; el.value = CorreoComun.asuntoDelCorreo(a, asuntoLargo);
      autoAlto(el); actualizarCuenta(); marcarBotonDelAsunto();
    };
    $('seneca-legible').onclick = function () {
      asuntoLargo = false; el.value = CorreoComun.asuntoDelCorreo(a, asuntoLargo);
      autoAlto(el); actualizarCuenta(); marcarBotonDelAsunto();
    };
    marcarBotonDelAsunto();
  }

  /* ---------- el texto del mensaje (columna derecha) ---------- */

  function textoHtml(a) {
    var opciones = CorreoComun.plantillasDelTipo(a, plantillasDatos);
    /* Con una plantilla, sale puesta; con varias, sale la primera y el
       desplegable deja cambiar (igual que en Correo). */
    if (!plantillaElegida && opciones.length) plantillaElegida = opciones[0].id;
    if (plantillaElegida && !opciones.some(function (p) { return p.id === plantillaElegida; })) {
      plantillaElegida = '';
    }

    var cuerpo = CorreoComun.cuerpoDelMedio(a, plantillaElegida, plantillasDatos, valoresActuales);
    textoProgramado = cuerpo.texto;

    var cabecera = opciones.length
      ? '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<select id="seneca-plantilla" class="campo">' +
          '<option value="">Sin plantilla</option>' +
          opciones.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === plantillaElegida ? ' selected' : '') + '>' +
              U.escapar(p.nombre) + '</option>';
          }).join('') +
        '</select>' +
        '<div id="seneca-plantilla-confirmar" class="oculto"></div>'
      : avisoSinPlantillaHtml(a);

    return cabecera +
      '<label class="etiqueta">Texto del mensaje</label>' +
      (cuerpo.faltan.length
        ? '<p class="aviso aviso-ambar" id="seneca-faltan-datos">Faltan datos: ' +
          U.escapar(cuerpo.faltan.join(', ')) + '</p>'
        : '') +
      '<textarea id="seneca-cuerpo-texto" class="campo" rows="14">' + U.escapar(cuerpo.texto) + '</textarea>';
  }

  /* Sin plantilla de mensaje de Séneca para este tipo, el hueco entre
     el saludo y la firma ya no se queda mudo (docs/SENECA-CUADRO-
     ANCHO.md, 3.3): un aviso, con el atajo a escribirla de una vez. */
  function avisoSinPlantillaHtml(a) {
    return '<p class="aviso aviso-ambar" id="seneca-sin-plantilla">' +
      'Este tipo de asunto no tiene plantilla de mensaje de Séneca. Escríbela una vez y saldrá ' +
      'rellena siempre. → <a href="#" id="seneca-ir-a-plantilla">Escribir la plantilla</a></p>';
  }

  function engancharTexto(a) {
    var enlace = $('seneca-ir-a-plantilla');
    if (enlace) {
      enlace.onclick = async function (ev) {
        ev.preventDefault();
        var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
        if (!tipo || !window.App || typeof App.abrirTipoDeAsunto !== 'function') return;
        var cerrar = $('cuadro-aceptar');
        if (cerrar) cerrar.click();
        await App.abrirTipoDeAsunto(tipo);
      };
    }

    var desplegable = $('seneca-plantilla');
    if (!desplegable) return;

    /* Mismo cuidado que en js/correo.js: cambiar de plantilla con algo
       escrito a mano pregunta antes, en línea (no hay un segundo
       cuadro de diálogo posible con `#capa` ya ocupado). */
    desplegable.onchange = function () {
      var elegida = this.value;
      var escritoAMano = $('seneca-cuerpo-texto').value !== textoProgramado;
      if (!escritoAMano) { cambiarDePlantilla(a, elegida); return; }

      var caja2 = $('seneca-plantilla-confirmar');
      caja2.className = 'aviso aviso-ambar';
      caja2.innerHTML = '<p>Lo que hay escrito en el texto se perderá.</p>';
      var seguir = document.createElement('button');
      seguir.type = 'button';
      seguir.className = 'boton boton-principal';
      seguir.textContent = 'Cambiar de todas formas';
      seguir.onclick = function () { cambiarDePlantilla(a, elegida); };
      var cancelar = document.createElement('button');
      cancelar.type = 'button';
      cancelar.className = 'boton';
      cancelar.textContent = 'Seguir con lo escrito';
      cancelar.style.marginLeft = '8px';
      cancelar.onclick = function () {
        desplegable.value = plantillaElegida;
        caja2.className = 'oculto';
        caja2.innerHTML = '';
      };
      caja2.appendChild(seguir);
      caja2.appendChild(cancelar);
    };
  }

  function cambiarDePlantilla(a, idElegida) {
    plantillaElegida = idElegida;
    var col = $('seneca-caja').querySelector('.seneca-col-der');
    col.innerHTML = textoHtml(a);
    engancharTexto(a);
  }

  /* ---------- los dos pasos numerados ---------- */

  function marcarDestacado(cual) {
    $('seneca-paso-asunto').classList.toggle('boton-principal', cual === 1);
    $('seneca-paso-texto').classList.toggle('boton-principal', cual === 2);
  }

  function engancharPasos(a) {
    marcarDestacado(1);
    $('seneca-paso-asunto').onclick = function () {
      copiarConAviso(this, $('seneca-asunto').value, function () { marcarDestacado(2); });
    };
    $('seneca-paso-texto').onclick = function () {
      var self = this;
      var texto = $('seneca-cuerpo-texto').value;
      var recortado = texto.length > MAXIMO_LETRAS;
      if (recortado) texto = texto.slice(0, MAXIMO_LETRAS);
      copiarConAviso(self, texto, function () {
        apuntarElRastro(a);
        if (recortado) U.aviso('El texto se ha recortado a 4.000 letras.', 'ambar');
      });
    };
  }

  window.SenecaCuadro = { abrir: abrir };

})();
