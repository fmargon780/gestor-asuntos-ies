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

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     FUNCIONES PURAS
     ========================================================== */

  /* Los hitos de nivel superior de un asunto, en su orden, sin los del
     tipo anterior (fila 94: esos ya no son "de este asunto" de verdad).
     Nunca baja a las opciones de un hito-pregunta: ver la nota de
     arriba sobre la simplificación de esta fila. */
  function nivelSuperior(hitos) {
    return (hitos || []).filter(function (h) { return h && !h.delTipoAnterior; });
  }

  /* Sin trabajo apuntado: distinto de hecho, sin ninguna línea del guion
     marcada ni con valor, sin tareas propias, sin notas (las del hito y
     las del asunto con su etiqueta), sin documentos, sin rama elegida y
     sin una fecha puesta a mano. "En curso" solo no cuenta como trabajo
     (mismo criterio que `HitosCambioDeTipo.tieneAlgo`, en negativo). Es
     lo que decide si un hito se puede BORRAR; lo que decide si la guía
     lo puede tocar es `estaVacio`, más estricta (fila 416). */
  function sinTrabajo(h, aOClave) {
    if (!h) return true;
    if (h.estado === 'hecho') return false;
    if (h.fechaManual) return false;
    if (h.clase === 'decision' && h.elegida) return false;
    var guionHecho = h.guionHecho || {};
    var algunoMarcado = Object.keys(guionHecho).some(function (id) {
      var g = guionHecho[id];
      return g && (g.hecho || g.valor);
    });
    if (algunoMarcado) return false;
    if (h.guionPropio && h.guionPropio.length) return false;
    if (Hitos.notasPropias(h).length) return false;
    if (h.documentos && h.documentos.length) return false;
    var clave = (aOClave && aOClave.nombre) ? aOClave.nombre : aOClave;
    var conNotas = (clave && window.NotasHito) ? NotasHito.idsConNotas(clave) : {};
    if (conNotas[h.id]) return false;
    if (h.clase === 'decision') {
      var dentro = (h.opciones || []).some(function (o) {
        return (o.hitos || []).some(function (x) { return !sinTrabajo(x, aOClave); });
      });
      if (dentro) return false;
    }
    return true;
  }

  /* Un hito está «sin empezar» (vacío) si no tiene trabajo (`sinTrabajo`)
     y nadie ha decidido nada solo para ese asunto (fila 416,
     docs/HITOS-UN-SOLO-SITIO.md): responsable, plazo, título o
     explicación cambiados aquí (`cambioAqui`, que escribe
     `Hitos.guardarCampos`), «Dejarlo solo informativo» / «Pedírmelo a
     mí» (también `cambioAqui`), «Recibe varios documentos» cambiado aquí
     (`variosPropio`), tareas de la guía escondidas aquí (`guionOcultos`)
     o preguntas del guion cambiadas aquí (`guionTextos`). Una sola
     función para todo: la guía solo toca lo que está vacío. */
  function estaVacio(h, aOClave) {
    if (!h) return true;
    if (!sinTrabajo(h, aOClave)) return false;
    if (h.cambioAqui || h.variosPropio) return false;
    if (h.guionOcultos && h.guionOcultos.length) return false;
    if (h.guionTextos && Object.keys(h.guionTextos).length) return false;
    if ((h.requisitos || []).some(function (r) { return r.hecho || r.valor || r.documento; })) return false;
    if (h.clase === 'decision') {
      var dentro = (h.opciones || []).some(function (o) {
        return (o.hitos || []).some(function (x) { return !estaVacio(x, aOClave); });
      });
      if (dentro) return false;
    }
    return true;
  }

  /* Mueve (o inserta, si `nuevo` no está ya en la lista) un elemento
     detrás de `idAncla` (vacío = al principio). Trabaja sobre
     cualquier lista de nivel superior, con `.id`: hitos o pasos. */
  function colocarTrasAncla(lista, elemento, idAncla) {
    var i = lista.indexOf(elemento);
    if (i !== -1) lista.splice(i, 1);
    var destino = 0;
    if (idAncla) {
      for (var j = 0; j < lista.length; j++) {
        if (lista[j] && lista[j].id === idAncla && !lista[j].delTipoAnterior) { destino = j + 1; break; }
      }
    }
    lista.splice(destino, 0, elemento);
  }

  /* El paso de la guía "de origen" para "Colocar después de" el hito
     `idHitoAncla`: si ese hito viene de la guía, su propio
     `origenGuia`; si es propio, el del hito anterior en el nivel
     superior que sí venga de la guía; si no hay ninguno, ''
     ("al principio"). '' si `idHitoAncla` está vacío o no se
     encuentra. */
  function pasoAnclaDeHito(nivel, idHitoAncla) {
    if (!idHitoAncla) return '';
    for (var i = 0; i < nivel.length; i++) {
      if (nivel[i].id !== idHitoAncla) continue;
      for (var k = i; k >= 0; k--) {
        if (nivel[k].origenGuia) return nivel[k].origenGuia;
      }
      return '';
    }
    return '';
  }

  /* ==========================================================
     EL FORMULARIO (compartido por crear y cambiar)
     ========================================================== */

  function plazoDelFormulario() {
    var dias = parseInt(($('hda-plazo-dias') || {}).value, 10);
    var desde = ($('hda-plazo-desde') || {}).value || '';
    var cuenta = window.GuiasPlazo ? GuiasPlazo.leerSelect($('hda-plazo-cuenta')) : 'habiles';
    return (!isNaN(dias) && dias > 0) ? { dias: dias, desde: desde, cuenta: cuenta } : null;
  }

  /* Fila 228 (docs/EXPLICACION-DEL-HITO-AL-CAMBIAR.md): la explicación del
     hito (`cuerpo`), con su formato, limpiada igual que en el editor de la
     guía; vacía si no dice nada. */
  function cuerpoDelFormulario() {
    var caja = $('hda-cuerpo');
    if (!caja || !window.Guias) return '';
    var html = Guias.limpiar(caja.innerHTML);
    return Guias.tieneTexto(html) ? html : '';
  }

  function leerFormulario() {
    return {
      titulo: (($('hda-titulo') || {}).value || '').trim(),
      cuerpo: cuerpoDelFormulario(),
      colocarDespuesDe: ($('hda-despues') || {}).value || '',
      responsable: ($('hda-responsable') || {}).value || '',
      plazo: plazoDelFormulario(),
      variosDocumentos: !!($('hda-varios-documentos') || {}).checked,   /* fila 414 */
      soloAqui: !!($('hda-solo-aqui') || {}).checked   /* fila 416 */
    };
  }

  /* Los responsables de Ajustes › Hitos (con Administración, fila 159)
     más los papeles fijos: la misma lista que ofrece la guía. */
  async function opcionesResponsable() {
    try {
      var datos = await Hitos.leer();
      var base = window.HitosAdministracion ? HitosAdministracion.paraGuia(datos.ajustes) : datos.ajustes.responsables;
      return (base || []).concat(Hitos.PAPELES || []);
    } catch (e) { return Hitos.PAPELES || []; }
  }

  function cuerpoFormulario(opts) {
    var nivel = opts.nivel || [];
    var opcionesColocar = '<option value="">Al principio</option>' + nivel
      .filter(function (x) { return x.id !== opts.idPropio; })
      .map(function (x) {
        return '<option value="' + U.escapar(x.id) + '"' + (x.id === opts.colocarActual ? ' selected' : '') + '>' +
          U.escapar(x.titulo || '(sin título)') + '</option>';
      }).join('');
    var opcionesDesde = '<option value="">(sin plazo)</option>' + nivel
      .filter(function (x) { return x.id !== opts.idPropio; })
      .map(function (x) {
        return '<option value="' + U.escapar(x.id) + '"' + (opts.plazo && opts.plazo.desde === x.id ? ' selected' : '') + '>' +
          U.escapar(x.titulo || '(sin título)') + '</option>';
      }).join('');
    return (
      '<label class="etiqueta">' + (opts.esCrear ? 'Título, o busca en la biblioteca' : 'Título') + '</label>' +
      '<input id="hda-titulo" class="campo" value="' + U.escapar(opts.titulo || '') + '" placeholder="Por ejemplo: Firma del director">' +
      (opts.esCrear ? '<div id="hda-biblioteca-resultados" class="hda-biblioteca-resultados oculto"></div>' : '') +
      (window.Guias && window.GuiasBarra
        ? '<label class="etiqueta">Explicación <span class="suave">(opcional)</span></label>' + GuiasBarra.html() +
          '<div id="hda-cuerpo" class="paso-cuerpo hda-cuerpo" contenteditable="true" data-vacio="Explicación del hito">' +
          Guias.limpiar(opts.cuerpo || '') + '</div>'
        : '') +
      '<label class="etiqueta">Colocar después de</label>' +
      '<select id="hda-despues" class="campo">' + opcionesColocar + '</select>' +
      '<label class="etiqueta">Responsable <span class="suave">(opcional)</span></label>' +
      '<select id="hda-responsable" class="campo paso-responsable"><option value="">(sin responsable)</option>' +
      opts.responsables.map(function (r) {
        return '<option value="' + U.escapar(r.id) + '"' + (r.id === opts.responsable ? ' selected' : '') + '>' +
          U.escapar(r.nombre) + '</option>';
      }).join('') + (window.ResponsableOrganismo ? ResponsableOrganismo.opcionesExtra({ responsable: opts.responsable }) : '') + '</select>' +
      '<label class="etiqueta">Plazo <span class="suave">(opcional)</span></label>' +
      '<div class="paso-plazo-fila">' +
        '<input type="number" min="1" id="hda-plazo-dias" class="campo" placeholder="' + (opts.plazo && opts.plazo.cuenta === 'meses' ? 'meses' : 'días') + '" value="' +
        (opts.plazo ? opts.plazo.dias : '') + '">' +
        (window.GuiasPlazo ? GuiasPlazo.htmlConId(opts, 'hda-plazo-cuenta') : '') +
        '<span class="suave">desde</span>' +
        '<select id="hda-plazo-desde" class="campo">' + opcionesDesde + '</select>' +
      '</div>' +
      /* Fila 414: no se ofrece en una pregunta ni al crear desde la biblioteca. */
      (opts.sinVarios ? '' :
        '<label class="interruptor hda-varios-documentos-fila"><input type="checkbox" id="hda-varios-documentos"' +
        (opts.variosDocumentos ? ' checked' : '') + '><span>Recibe varios documentos</span></label>' +
        '<p class="suave">Con esto, al añadir un documento al asunto no se ofrece terminar la espera; el hito se cierra a mano.</p>') +
      /* Fila 416: solo al crear, y solo con tipo (sin tipo no hay guía). Desmarcada al abrirse. */
      (opts.casillaSoloAqui ? '<label class="interruptor hda-solo-aqui-fila"><input type="checkbox" id="hda-solo-aqui"><span>Solo para este asunto</span></label>' +
        '<p class="suave">Sin marcar, el hito va a la guía de ' + U.escapar(opts.casillaSoloAqui) + ' y llega a los asuntos abiertos que no lo hayan empezado.</p>' : '')
    );
  }

  function tipoDe(a) {
    var t = (window.App && typeof App.tipoDeAsunto === 'function') ? App.tipoDeAsunto(a)
      : ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '');
    return (window.App && t === App.SIN_TIPO) ? '' : t;   /* fila 235: sin tipo no hay guía */
  }

  function nombreCortoDe(tipo) {
    return (window.Nombres && window.App) ? Nombres.tipoParaVer(tipo, App.E.tipos) : tipo;
  }

  /* La caja de la explicación (fila 228): misma barra de formato que la
     guía, al pegar solo el texto, y el cuadro acotado al alto de la
     pantalla (la caja crece con el texto y el cuadro se desplaza por
     dentro, con «Guardar» siempre a la vista). */
  function engancharCuerpo() {
    var caja = $('hda-cuerpo');
    if (!caja) return;
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-alto', 'cuadro-hda');
    GuiasBarra.reiniciar();
    GuiasBarra.enganchar();
    caja.onfocus = function () { GuiasBarra.escribiendoEn(caja); };
    caja.onpaste = function (ev) {
      ev.preventDefault();
      var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, t);
    };
  }

  function soltarCuerpo() {
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.remove('cuadro-alto', 'cuadro-hda');
    if (window.GuiasBarra) GuiasBarra.reiniciar();
  }

  function enganchar() {
    engancharCuerpo();
    if (window.DondeSeGuarda) DondeSeGuarda.introAcepta($('hda-titulo'));
  }

  var SOLO_AQUI = 'Guardado solo en este asunto.';
  var SOLO_AQUI_EN_PREGUNTA = 'Guardado solo en este asunto: dentro de una pregunta no se puede cambiar la guía desde aquí.';

  /* Fila 416: un hito que solo existe en este asunto (sin paso en la guía
     de su tipo) lleva la marca «solo aquí». Sin tipo, todos lo son: no se marca. */
  function esSoloAqui(a, h) {
    var tipo = tipoDe(a);
    if (!tipo || !h || h.delTipoAnterior) return false;
    if (h.origenGuia && Hitos.pasoDeGuia && Hitos.pasoDeGuia(a, h)) return false;
    return true;
  }

  function marcaSoloAquiHTML(a, h) {
    return esSoloAqui(a, h)
      ? ' <span class="marca-solo-aqui" data-ayuda-clave="solo-aqui-hito">solo aquí</span>' : '';
  }

  function pasoEsDeNivelSuperior(pasos, idPaso) {
    return (pasos || []).some(function (p) { return p.id === idPaso; });
  }

  /* Los asuntos abiertos del mismo tipo (incluido, si está en la
     lista, el propio `claveActual`): fila 207, un asunto que ha
     pasado por "Unir con otro tipo" no recibe nada de su guía vieja. */
  function clavesAbiertasDelTipo(tipo) {
    if (!window.Gestor || typeof Gestor.asuntos !== 'function') return [];
    return Gestor.asuntos().filter(function (a) {
      return tipoDe(a) === tipo && !(a.ficha && a.ficha.tipoUnidoDe);
    }).map(function (a) { return a.nombre; });
  }

  /* Fila 235: la frase verde de después y su «Deshacer». `base` es lo
     que se dice si el cambio se queda solo en este asunto. */
  async function avisarGuia(tipo, a, antes, r, aqui) {
    await HitosDesdeElAsuntoGuia.avisarConDeshacer(
      HitosDesdeElAsuntoGuia.textoGuardado(nombreCortoDe(tipo), r.otros || 0, r.saltados || 0),
      { tipo: tipo, claveActual: a.nombre, antes: antes, aqui: aqui });
  }

  /* Lo que el último guardado de la guía ha repartido (fila 416). */
  function repartoDe() { return GuiasDelCentro.ultimoReparto ? GuiasDelCentro.ultimoReparto() : { otros: 0, saltados: 0 }; }

  /* ==========================================================
     PROPAGAR UN CAMBIO (título/explicación/responsable/plazo/posición) A LOS
     ASUNTOS ABIERTOS: en el propio (siempre) y en los demás, solo si
     el hito sigue vacío. Nunca toca el ARCHIVO ni la biblioteca.
     ========================================================== */

  async function propagarCambio(tipo, idOrigen, campos, idAncla, claveActual, soloActual) {
    var claves = soloActual ? [claveActual] : clavesAbiertasDelTipo(tipo);
    var tocados = 0, saltados = 0, enCurso = [];
    await Hitos.cambiar(function (d) {
      tocados = 0; saltados = 0; enCurso = [];
      claves.forEach(function (clave) {
        var entrada = d.porAsunto[clave];
        if (!entrada) return;
        var lista = entrada.hitos;
        var h = lista.filter(function (x) { return x.origenGuia === idOrigen && !x.delTipoAnterior; })[0];
        if (!h) return;
        var esActual = clave === claveActual;
        /* Fila 299 (`soloTitulo`, js/informar-al-tutor.js): cambiar solo el nombre del hito, en todos los abiertos. */
        if (!esActual && !campos.soloTitulo && !estaVacio(h, clave)) { saltados++; return; }
        h.titulo = campos.titulo;
        if (!campos.soloTitulo) {
          h.cuerpo = campos.cuerpo;
          h.responsable = campos.responsable;
          if (window.ResponsableOrganismo && ResponsableOrganismo.esOrganismo(h.responsable)) {
            h.responsableNombre = ResponsableOrganismo.copia(h.responsable, null);
          } else {
            delete h.responsableNombre;
          }
          h.plazo = campos.plazo;
          h.variosDocumentos = !!campos.variosDocumentos;
          delete h.variosPropio;
          colocarTrasAncla(lista, h, idAncla);
        }
        tocados++;
        var r = Hitos.recomputeEnCurso(lista);
        if (r) enCurso.push({ clave: clave, hito: r });
      });
      return d;
    });
    for (var i = 0; i < enCurso.length; i++) await Hitos.aplicarEstadoDelHito(enCurso[i].clave, enCurso[i].hito);
    return { tocados: tocados, saltados: saltados };
  }

  /* Quita el hito de origen `idOrigen` de los asuntos abiertos donde
     siga vacío (el actual, siempre); en los que tienen trabajo, se
     queda. El id sigue en `pasosConocidos` (Hitos.leer lo completa
     solo), así que la fila 118 no lo vuelve a traer. */
  async function propagarBorrado(tipo, idOrigen, claveActual, soloActual) {
    var claves = soloActual ? [claveActual] : clavesAbiertasDelTipo(tipo);
    var tocados = 0, saltados = 0, enCurso = [];
    await Hitos.cambiar(function (d) {
      tocados = 0; saltados = 0; enCurso = [];
      claves.forEach(function (clave) {
        var entrada = d.porAsunto[clave];
        if (!entrada) return;
        var lista = entrada.hitos;
        var i = -1;
        for (var k = 0; k < lista.length; k++) {
          if (lista[k].origenGuia === idOrigen && !lista[k].delTipoAnterior) { i = k; break; }
        }
        if (i === -1) return;
        var esActual = clave === claveActual;
        if (!esActual && !estaVacio(lista[i], clave)) { saltados++; return; }
        lista.splice(i, 1);
        tocados++;
        var r = Hitos.recomputeEnCurso(lista);
        if (r) enCurso.push({ clave: clave, hito: r });
      });
      return d;
    });
    for (var i = 0; i < enCurso.length; i++) await Hitos.aplicarEstadoDelHito(enCurso[i].clave, enCurso[i].hito);
    return { tocados: tocados, saltados: saltados };
  }

  function repintar() {
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

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

  /* ==========================================================
     CAMBIAR ESTE HITO
     ========================================================== */

  async function abrirCambiar(a, h) {
    var hitos = await Hitos.hitosDe(a.nombre);
    var nivel = nivelSuperior(hitos);
    var esNivelSuperior = nivel.some(function (x) { return x.id === h.id; });
    var tipo = tipoDe(a);
    var pasos = tipo ? GuiasDelCentro.pasosDe(tipo) : [];
    var conGuia = !!(h.origenGuia && esNivelSuperior && pasoEsDeNivelSuperior(pasos, h.origenGuia));
    var colocarActual = '';
    if (esNivelSuperior) {
      var i = nivel.map(function (x) { return x.id; }).indexOf(h.id);
      colocarActual = i > 0 ? nivel[i - 1].id : '';
    }
    var responsables = await opcionesResponsable();
    var esperar = U.preguntar('Cambiar este hito',
      cuerpoFormulario({
        idPropio: h.id, nivel: esNivelSuperior ? nivel : [], colocarActual: colocarActual,
        responsables: responsables, responsable: h.responsable || '', plazo: h.plazo || null,
        variosDocumentos: !!h.variosDocumentos, sinVarios: h.clase === 'decision',
        titulo: h.titulo, cuerpo: h.cuerpo
      }), 'Guardar');
    enganchar();
    var ok = await esperar;
    var datos = ok ? leerFormulario() : null;
    soltarCuerpo();
    if (!ok) return;
    if (!datos.titulo) { U.aviso('Hace falta un título.', 'ambar'); return; }
    try {
      if (conGuia) {
        await cambiarConGuia(a, h, tipo, nivel, datos);
      } else {
        /* Sin tipo, solo para este asunto o dentro de una pregunta: se queda aquí. */
        var enPregunta = !!tipo && !!h.origenGuia && !esNivelSuperior;
        await cambiarSoloAsunto(a, h, esNivelSuperior, datos, false, enPregunta ? SOLO_AQUI_EN_PREGUNTA : SOLO_AQUI);
      }
      repintar();
    } catch (e) {
      U.aviso('No he podido guardar el cambio: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function cambiarSoloAsunto(a, h, esNivelSuperior, datos, callado, mensaje) {
    /* Fila 414: si difiere de la guía, queda como «propio» y la sincronización con la guía no lo pisa. */
    var tipoA = tipoDe(a);
    var pasoG = (tipoA && h.origenGuia && !h.delTipoAnterior)
      ? GuiasDelCentro.pasosDe(tipoA).filter(function (p) { return p.id === h.origenGuia; })[0] : null;
    await Hitos.guardarCampos(a.nombre, h.id, {
      titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo,
      variosDocumentos: !!datos.variosDocumentos,
      variosPropio: !!pasoG && !!pasoG.variosDocumentos !== !!datos.variosDocumentos
    });
    if (esNivelSuperior) {
      await Hitos.cambiar(function (d) {
        var entrada = d.porAsunto[a.nombre];
        if (!entrada) return d;
        var hh = Hitos.buscar(entrada.hitos, h.id);
        if (hh) colocarTrasAncla(entrada.hitos, hh, datos.colocarDespuesDe);
        return d;
      });
    }
    if (!callado) U.aviso(mensaje || SOLO_AQUI, 'bueno');
  }

  /* Fila 416: «Pasar a la guía» (menú «Hito ▾») de un hito «solo aquí»: entra
     en la guía con todas sus tareas, sin preguntar, y llega a los demás
     asuntos abiertos. «Deshacer» lo deja como estaba, solo aquí. */
  async function pasarALaGuia(a, h) {
    var tipo = tipoDe(a);
    if (!tipo) return false;
    try {
      var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
      var r = await HitosDesdeElAsuntoGuia.llevarHitoEntero(a, h);
      await avisarGuia(tipo, a, antes, repartoDe(),
        function () { return HitosDesdeElAsuntoGuia.dejarComoEstaba(a.nombre, r.hitoAntes); });
      repintar();
      return true;
    } catch (e) {
      U.aviso('No he podido pasarlo a la guía: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
  }

  async function cambiarConGuia(a, h, tipo, nivel, datos) {
    var idPasoAncla = pasoAnclaDeHito(nivel, datos.colocarDespuesDe);
    var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
    var pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
    var paso = pasos.filter(function (p) { return p.id === h.origenGuia; })[0];
    if (!paso) { await cambiarSoloAsunto(a, h, true, datos); return; }
    paso.titulo = datos.titulo;
    paso.cuerpo = datos.cuerpo;
    paso.responsable = datos.responsable;
    paso.plazo = datos.plazo;
    paso.variosDocumentos = !!datos.variosDocumentos;
    colocarTrasAncla(pasos, paso, idPasoAncla);
    /* Los demás asuntos abiertos los toca el propio guardado de la guía (los que no han empezado el hito)... */
    await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
    var reparto = repartoDe();
    /* ...y en este, el cambio se aplica siempre, aunque el hito esté empezado. */
    await propagarCambio(tipo, h.origenGuia,
      { titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo, variosDocumentos: datos.variosDocumentos },
      idPasoAncla, a.nombre, true);
    await avisarGuia(tipo, a, antes, reparto, null);
  }

  /* ==========================================================
     BORRAR ESTE HITO
     ========================================================== */

  async function abrirBorrar(a, h) {
    if (!sinTrabajo(h, a)) return;
    var tipo = tipoDe(a);
    var pasos = tipo ? GuiasDelCentro.pasosDe(tipo) : [];
    var conGuia = !!(h.origenGuia && pasoEsDeNivelSuperior(pasos, h.origenGuia));
    var esperar = U.preguntar('Borrar este hito',
      '<p><strong>' + U.escapar(h.titulo || '') + '</strong></p>' +
      (conGuia ? '<p class="suave">Se quita también de la guía de ' + U.escapar(nombreCortoDe(tipo)) +
        ' y de los asuntos abiertos donde no esté empezado.</p>' : ''), 'Borrar');
    enganchar();
    var ok = await esperar;
    if (!ok) return;
    try {
      if (conGuia) {
        var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
        var pasosCopia = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
        var i = pasosCopia.map(function (p) { return p.id; }).indexOf(h.origenGuia);
        if (i !== -1) pasosCopia.splice(i, 1);
        await GuiasDelCentro.guardarPasos(tipo, pasosCopia, { claveActual: a.nombre });
        var reparto = repartoDe();
        await propagarBorrado(tipo, h.origenGuia, a.nombre, true);
        await avisarGuia(tipo, a, antes, reparto, null);
      } else {
        var enPregunta = !!tipo && !!h.origenGuia && !nivelSuperior(await Hitos.hitosDe(a.nombre)).some(function (x) { return x.id === h.id; });
        await Hitos.quitarHito(a.nombre, h.id);
        U.aviso(enPregunta ? SOLO_AQUI_EN_PREGUNTA : SOLO_AQUI, 'bueno');
      }
      if (window.HitoMesa) HitoMesa.cerrar();
      repintar();
    } catch (e) {
      U.aviso('No he podido borrar el hito: ' + U.mensajeDeError(e), 'malo');
    }
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
