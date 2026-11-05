/* ============================================================
   hitos-desde-el-asunto.js — crear, cambiar y borrar hitos desde la
   mesa de un asunto, sin salir a Ajustes (28-sep-2026, fila 206,
   docs/HITOS-DESDE-EL-ASUNTO.md).

   Tres cuadros, en el menú «Hito ▾» de la cabecera de la mesa
   (js/hito-mesa.js): «Crear», «Cambiar» y «Borrar». Desde la fila 416
   (docs/HITOS-UN-SOLO-SITIO.md, parte A) **la guía manda**: ya no hay
   pregunta «¿Dónde se guarda?». Crear, cambiar o borrar un hito de la
   guía de su tipo va a la guía y llega a los asuntos abiertos donde el
   hito no está empezado (`estaVacio`, más abajo; js/hitos-sincronizar.js);
   en el propio asunto el cambio se aplica siempre. «+ Crear un hito» lleva
   la casilla «Solo para este asunto» (desmarcada): el hito se queda aquí,
   con su marca «solo aquí», y «Pasar a la guía» (menú «Hito ▾») lo lleva
   entero. Sin tipo, o dentro de una pregunta, se guarda solo aquí. El
   aviso verde de después lleva «Deshacer» (js/hitos-desde-el-asunto-guia.js).

   Simplificación a propósito, como ya hace `Hitos.mover`
   ("complicaría las bifurcaciones sin que Francisco lo haya pedido"):
   «Colocar después de» solo ofrece los hitos de NIVEL SUPERIOR del
   asunto (nunca los de dentro de una rama de un hito-pregunta), y lo
   mismo para los pasos de la guía. Borrar un hito de dentro de una
   rama sigue funcionando (con `Hitos.quitarHito`, que ya sabe buscar a
   cualquier profundidad), pero solo «en este asunto»: la casilla de la
   guía no sale si el paso de origen está dentro de una opción.

   El plazo del cuadro es el mismo que el de la guía (días + cómo se
   cuentan + «desde» qué hito, js/guias-plazo.js): al guardar sin
   guía, se escribe igual en el propio hito (`Hitos.guardarCampos`,
   que gana el campo `plazo`), porque `Hitos.aplicarPlazosDependientes`
   ya sabe recalcular la fecha de cualquier hito, tenga guía o no.

   Se engancha como módulo aparte (`window.HitosDesdeElAsunto`), sin
   añadir nada a `window.Hitos`: no lo necesita ningún otro fichero.
   Carga después de js/hito-mesa.js, js/guias-enganche.js, js/guias.js,
   js/guias-plazo.js y js/responsable-organismo.js (los tres últimos,
   si existen).
   ============================================================ */
window.HitosDesdeElAsunto = (function () {
  var I = window.HitosDesdeElAsuntoNucleo;
  function $() { return I.$.apply(this, arguments); }
  function nivelSuperior() { return I.nivelSuperior.apply(this, arguments); }
  function sinTrabajo() { return I.sinTrabajo.apply(this, arguments); }
  function estaVacio() { return I.estaVacio.apply(this, arguments); }
  function colocarTrasAncla() { return I.colocarTrasAncla.apply(this, arguments); }
  function pasoAnclaDeHito() { return I.pasoAnclaDeHito.apply(this, arguments); }
  function leerFormulario() { return I.leerFormulario.apply(this, arguments); }
  function opcionesResponsable() { return I.opcionesResponsable.apply(this, arguments); }
  function cuerpoFormulario() { return I.cuerpoFormulario.apply(this, arguments); }
  function tipoDe() { return I.tipoDe.apply(this, arguments); }
  function nombreCortoDe() { return I.nombreCortoDe.apply(this, arguments); }
  function soltarCuerpo() { return I.soltarCuerpo.apply(this, arguments); }
  function enganchar() { return I.enganchar.apply(this, arguments); }
  var SOLO_AQUI = I.SOLO_AQUI;
  function esSoloAqui() { return I.esSoloAqui.apply(this, arguments); }
  function marcaSoloAquiHTML() { return I.marcaSoloAquiHTML.apply(this, arguments); }
  function clavesAbiertasDelTipo() { return I.clavesAbiertasDelTipo.apply(this, arguments); }
  function avisarGuia() { return I.avisarGuia.apply(this, arguments); }
  function repartoDe() { return I.repartoDe.apply(this, arguments); }
  function propagarCambio() { return I.propagarCambio.apply(this, arguments); }
  function repintar() { return I.repintar.apply(this, arguments); }
  function abrirCambiar() { return I.abrirCambiar.apply(this, arguments); }
  function pasarALaGuia() { return I.pasarALaGuia.apply(this, arguments); }
  function abrirBorrar() { return I.abrirBorrar.apply(this, arguments); }

  /* ==========================================================
     + CREAR UN HITO
     ========================================================== */

  /* Fila 224 (docs/TAREAS-DEL-HITO-SENCILLAS.md, sección 3): mientras se
     escribe el título en «Crear un hito», los hitos de la biblioteca que
     casen (por palabras sueltas, como los demás buscadores) salen debajo
     para elegirlo, igual que «Usarlo» en el editor de la guía
     (js/guias-paso-bloques.js). `alElegir(modelo)` se llama al pulsar
     uno; `alEscribir()`, en cada tecla, para olvidar la elección si se
     sigue escribiendo. Sin ella, la ventana sigue como siempre: lo
     escrito es el título de un hito nuevo. */
  function engancharBusquedaBiblioteca(alElegir, alEscribir) {
    var campo = $('hda-titulo');
    var resultados = $('hda-biblioteca-resultados');
    if (!campo || !resultados || !window.HitosBiblioteca) return;
    var espera = null;
    campo.addEventListener('input', function () {
      alEscribir();
      clearTimeout(espera);
      var texto = campo.value.trim();
      if (texto.length < 2) { resultados.classList.add('oculto'); resultados.innerHTML = ''; return; }
      espera = setTimeout(async function () {
        var biblioteca;
        try { biblioteca = await HitosBiblioteca.leer(); } catch (e) { return; }
        if (!resultados.isConnected || campo.value.trim() !== texto) return;
        var palabras = U.normalizar(texto).split(' ').filter(Boolean);
        var encontrados = (biblioteca.modelos || []).filter(function (m) {
          var t = U.normalizar(m.nombre || '');
          return palabras.every(function (w) { return t.indexOf(w) !== -1; });
        }).slice(0, 8);
        if (!encontrados.length) { resultados.classList.add('oculto'); resultados.innerHTML = ''; return; }
        resultados.classList.remove('oculto');
        resultados.innerHTML = encontrados.map(function (m) {
          return '<button type="button" class="enlace hda-biblioteca-opcion" data-id="' + U.escapar(m.id) + '">' +
            U.escapar(m.nombre) + '</button>';
        }).join('');
        Array.prototype.forEach.call(resultados.querySelectorAll('.hda-biblioteca-opcion'), function (b) {
          b.onclick = function () {
            var modelo = encontrados.filter(function (m) { return m.id === b.dataset.id; })[0];
            if (!modelo) return;
            campo.value = modelo.titulo || modelo.nombre;
            var caja = $('hda-cuerpo');
            if (caja && window.Guias) caja.innerHTML = Guias.limpiar(modelo.explicacion || '');   /* fila 228 */
            resultados.classList.add('oculto');
            resultados.innerHTML = '';
            alElegir(modelo);
          };
        });
      }, 200);
    });
  }

  /* Crea el hito a partir del modelo elegido (siempre con guía: un
     modelo de la biblioteca es, por naturaleza, cosa de la guía). */
  async function crearDesdeBiblioteca(a, tipo, nivel, datos, modelo) {
    var idPasoAncla = pasoAnclaDeHito(nivel, datos.colocarDespuesDe);
    var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
    var pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
    var nuevoPaso = HitosBiblioteca.modeloAPaso(modelo, idPasoAncla);   /* fila 284: cuenta desde el de arriba */
    /* Fila 228: si se ha cambiado la explicación antes de guardar, el paso
       lleva el texto cambiado; la biblioteca no se toca. */
    if (window.Guias && typeof datos.cuerpo === 'string') nuevoPaso.cuerpo = datos.cuerpo;
    colocarTrasAncla(pasos, nuevoPaso, idPasoAncla);
    await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
    await avisarGuia(tipo, a, antes, repartoDe(),
      function () { return HitosDesdeElAsuntoGuia.desenlazar(a.nombre, nuevoPaso.id); });
  }

  /* `idAnclaPorDefecto`: qué sale ya elegido en "Colocar después de"
     ('' vale para "Al principio"; `undefined` coloca al final, para
     el botón "+ Añadir un hito" de la lista y el de la mesa). */
  async function abrirCrear(a, idAnclaPorDefecto) {
    var hitos = await Hitos.hitosDe(a.nombre);
    var nivel = nivelSuperior(hitos);
    var tipo = tipoDe(a);
    var ancla = idAnclaPorDefecto;
    if (ancla === undefined) ancla = nivel.length ? nivel[nivel.length - 1].id : '';
    var responsables = await opcionesResponsable();
    var modeloElegido = null;
    var esperar = U.preguntar('Crear un hito',
      cuerpoFormulario({
        nivel: nivel, colocarActual: ancla, responsables: responsables, responsable: '', plazo: null,
        casillaSoloAqui: tipo ? nombreCortoDe(tipo) : '', esCrear: true
      }), 'Guardar');
    enganchar();
    if (tipo) engancharBusquedaBiblioteca(function (modelo) { modeloElegido = modelo; }, function () { modeloElegido = null; });
    var ok = await esperar;
    var datos = ok ? leerFormulario() : null;
    soltarCuerpo();
    if (!ok) return;
    if (!datos.titulo) { U.aviso('Hace falta un título.', 'ambar'); return; }
    try {
      if (!tipo || datos.soloAqui) {
        await crearSoloAsunto(a, nivel, datos);
      } else if (modeloElegido) {
        await crearDesdeBiblioteca(a, tipo, nivel, datos, modeloElegido);
      } else {
        await crearConGuia(a, tipo, nivel, datos);
      }
      repintar();
    } catch (e) {
      U.aviso('No he podido crear el hito: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function crearSoloAsunto(a, nivel, datos) {
    /* normalizarHito ya copia el nombre del organismo si el responsable
       es uno (mismo criterio que `pasoAHito`). */
    var nuevo = Hitos.normalizarHito({
      titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, clase: 'paso', estado: 'pendiente'
    });
    nuevo.plazo = datos.plazo;
    nuevo.variosDocumentos = !!datos.variosDocumentos;
    var resultado = null;
    await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[a.nombre] || { creados: U.hoyIso(), hitos: [] };
      colocarTrasAncla(entrada.hitos, nuevo, datos.colocarDespuesDe);
      resultado = Hitos.recomputeEnCurso(entrada.hitos);
      d.porAsunto[a.nombre] = entrada;
      return d;
    });
    if (resultado) await Hitos.aplicarEstadoDelHito(a.nombre, resultado);
    U.aviso(SOLO_AQUI, 'bueno');
  }

  async function crearConGuia(a, tipo, nivel, datos) {
    var idPasoAncla = pasoAnclaDeHito(nivel, datos.colocarDespuesDe);
    var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
    var pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
    var nuevoPaso = Guias.normalizar([{ titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo, variosDocumentos: datos.variosDocumentos }])[0];
    colocarTrasAncla(pasos, nuevoPaso, idPasoAncla);
    await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
    await avisarGuia(tipo, a, antes, repartoDe(),
      function () { return HitosDesdeElAsuntoGuia.desenlazar(a.nombre, nuevoPaso.id); });
  }


  return {
    estaVacio: estaVacio,
    sinTrabajo: sinTrabajo,
    clavesAbiertasDelTipo: clavesAbiertasDelTipo,
    nivelSuperior: nivelSuperior,
    colocarTrasAncla: colocarTrasAncla,
    propagarCambio: propagarCambio,   /* fila 299: lo usa js/informar-al-tutor.js */
    pasoAnclaDeHito: pasoAnclaDeHito,
    abrirCrear: abrirCrear,
    abrirCambiar: abrirCambiar,
    abrirBorrar: abrirBorrar,
    esSoloAqui: esSoloAqui,   /* fila 416 */
    marcaSoloAquiHTML: marcaSoloAquiHTML,
    pasarALaGuia: pasarALaGuia
  };
})();
