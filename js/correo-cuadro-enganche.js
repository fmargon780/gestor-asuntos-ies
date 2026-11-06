/* ============================================================
   correo-cuadro-enganche.js — enganchar el cuadro, elegir plantilla y buscar el último hilo (fila 536: trozo de js/correo-cuadro.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/correo-cuadro.js.
   ============================================================ */
var CorreoCuadroNucleo = CorreoCuadroNucleo || {};
(function () {

  var I = CorreoCuadroNucleo;
  I.S = I.S || {};
  function $() { return I.$.apply(this, arguments); }
  function n() { return I.n.apply(this, arguments); }
  function paraDelCuadro() { return I.paraDelCuadro.apply(this, arguments); }
  function copiar() { return I.copiar.apply(this, arguments); }
  function abrirGmail() { return I.abrirGmail.apply(this, arguments); }
  function abrirDelOrdenador() { return I.abrirDelOrdenador.apply(this, arguments); }
  function aplicarDestino() { return I.aplicarDestino.apply(this, arguments); }
  function bloqueCuerpo() { return I.bloqueCuerpo.apply(this, arguments); }
  function engancharEnviar() { return I.engancharEnviar.apply(this, arguments); }

  function enganchar(a) {
    var caja = $('correo-caja');
    if (window.CorreoPara) CorreoPara.enganchar();   /* fila 555 */

    engancharPlantilla(a);
    if (window.CorreoTutorBotones) CorreoTutorBotones.enganchar();   /* fila 348, fila 434 */
    engancharRuta(a);
    if (window.CorreoTutor) CorreoTutor.enganchar();   /* fila 299 */
    if (window.CorreoAdjuntoPlantilla) CorreoAdjuntoPlantilla.alAbrir(a, I.S.plantillaElegida);   /* fila 299 */
    if (window.CorreoRelacionar) CorreoRelacionar.enganchar(a);   /* fila 555 */

    /* Lo que pone la propia aplicación en la copia oculta: un grupo propio (fila 309) o personas sueltas, como el profesorado (fila 352). */
    async function anadirGrupo(valor) {
      var resueltos = await Destinatarios.miembrosDeOpcion(valor);   /* fila 132 */
      anadirACopiaOculta(resueltos);
    }
    function anadirACopiaOculta(miembros) {
      var resultado = Destinatarios.delGrupo(miembros);
      if (window.CorreoPara) CorreoPara.ponerDirecciones('oculta', resultado.direcciones);
      resultado.sinCorreo.forEach(function (nombre) {
        if (I.S.ccoSinCorreo.indexOf(nombre) === -1) I.S.ccoSinCorreo.push(nombre);
      });
      pintarSinCorreo();
      if (window.CorreoPara) CorreoPara.repintar();
    }
    var grupoInicial = (n()._interno || {}).grupoInicial;
    if (grupoInicial) { n()._interno.grupoInicial = ''; anadirGrupo('grupo:' + grupoInicial); }
    var personasCco = (n()._interno || {}).personasCopiaOculta;
    if (personasCco) { n()._interno.personasCopiaOculta = null; anadirACopiaOculta(personasCco); }

    /* El cuadro vuelve a abrirse tras relacionar a alguien: lo escrito a mano sigue ahí. */
    var antes = (n()._interno || {}).restaurar;
    if (antes) {
      n()._interno.restaurar = null;
      if ($('correo-asunto') && antes.asunto !== undefined) $('correo-asunto').value = antes.asunto;
      if (antes.escrito && $('correo-cuerpo-texto')) $('correo-cuerpo-texto').value = antes.cuerpo;
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
  }

  /* El botón «Ruta» en la cabecera del cuadro (fila 152,
     docs/RUTA-QUE-NO-VA-A-BING.md, punto 3): el modo (abierto/archivado)
     sale del propio asunto, igual que en js/ficha-nombre-acciones.js. */
  /* Fila 352: la línea de «sin correo» de la copia oculta (en ámbar y hablando de docentes, si es el aviso al claustro). */
  function pintarSinCorreo() {
    var caja = $('correo-cco-sin-correo');
    if (!caja) return;
    var sin = I.S.ccoSinCorreo || [];
    if (!sin.length) { caja.innerHTML = ''; return; }
    caja.innerHTML = (n()._interno || {}).copiaOcultaDocentes
      ? '<p class="aviso aviso-ambar" id="cco-sin-correo-docentes">' + sin.length +
        (sin.length === 1 ? ' docente del centro no tiene correo: ' : ' docentes del centro no tienen correo: ') + U.escapar(sin.join(', ')) + '</p>'
      : '<p class="nota aviso-en-linea">' + sin.length + (sin.length === 1 ? ' no tiene correo: ' : ' no tienen correo: ') + U.escapar(sin.join(', ')) + '</p>';
  }

  function engancharRuta(a) {
    if (!window.RutaCarpetas) return;
    var interno = n()._interno || {};
    RutaCarpetas.montarEnCuadro($('correo-ruta-lugar'), $('correo-ruta-en-linea'), a, interno.modoDelAsunto || 'abierto');
  }

  function engancharPlantilla(a) {
    var desplegable = $('correo-plantilla');
    if (desplegable) desplegable.onchange = function () { elegirPlantilla(a, this.value); };
    PlantillaDeLoEscrito.engancharBotones(cfgPlantilla, a, function () { return I.S.plantillaElegida; });   /* fila 270 */
    if (window.DatosDelAsuntoCuadro) DatosDelAsuntoCuadro.enganchar('correo', a, function () { elegirPlantilla(a, I.S.plantillaElegida); });   /* fila 530 */
  }

  /* Cambiar de plantilla, con la confirmación en línea de siempre si el
     cuerpo tenía algo escrito a mano (`#correo-plantilla-confirmar`):
     la misma regla al elegir del desplegable y al guardar una nueva o
     editada desde el propio cuadro (fila 151). */
  function elegirPlantilla(a, idElegida) {
    var escritoAMano = $('correo-cuerpo-texto') && $('correo-cuerpo-texto').value !== I.S.textoProgramado;
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
      if (desplegable) desplegable.value = I.S.plantillaElegida;
      caja2.className = 'oculto';
      caja2.innerHTML = '';
    };
    caja2.appendChild(seguir);
    caja2.appendChild(cancelar);
  }

  function cambiarDePlantilla(a, idElegida) {
    I.S.plantillaElegida = idElegida;
    $('correo-comunes-der').innerHTML = bloqueCuerpo(a);
    engancharPlantilla(a);
    aplicarDestino(a);   /* fila 348 */
    if (window.CorreoAdjuntoPlantilla) CorreoAdjuntoPlantilla.alElegir(a, I.S.plantillaElegida);   /* fila 299 */
  }

  /* ---------- crear/editar la plantilla desde el propio cuadro
     (fila 151, docs/PLANTILLA-DESDE-EL-CUADRO.md; el editor y el botón
     «Guardar como plantilla nueva» de la fila 270 viven en
     js/plantilla-de-lo-escrito.js) ---------- */

  /* Plantilla nueva desde lo escrito: queda elegida y el texto del mensaje no se toca. */
  function dejarElegida(a, id, texto) {
    cambiarDePlantilla(a, id);
    if ($('correo-cuerpo-texto')) $('correo-cuerpo-texto').value = texto;
  }
  var cfgPlantilla = { prefijo: 'correo', elegir: elegirPlantilla, dejarElegida: dejarElegida };

  /* ---------- ENVIAR: resumen y confirmación (fila 115) ---------- */

  /* Fila 411: las matrículas (Message-ID) del hilo, para que el script lo busque en la cuenta común si el
     identificador es de otro buzón. */
  function matriculasDelUltimoHilo(a) {
    var hilos = a.ficha && a.ficha.hilos;
    if (!hilos || !hilos.length) return [];
    var m = hilos[hilos.length - 1].matriculas;
    return Array.isArray(m) ? m.filter(Boolean) : [];
  }

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

  I.enganchar = enganchar;
  I.matriculasDelUltimoHilo = matriculasDelUltimoHilo;
  I.ultimoHiloDelAsunto = ultimoHiloDelAsunto;
  I.primerasLineas = primerasLineas;
  I.marcasDeAdjuntos = marcasDeAdjuntos;
})();
