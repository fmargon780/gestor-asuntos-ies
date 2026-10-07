/* ============================================================
   hitos-desde-el-asunto.js — crear, cambiar y borrar hitos desde la
   mesa de un asunto, sin salir a Ajustes (28-sep-2026, fila 206,
   docs/HITOS-DESDE-EL-ASUNTO.md).

   Tres cuadros, en el menú «Hito ▾» de la cabecera de la mesa
   (js/hito-mesa.js): «Crear», «Cambiar» y «Borrar». Desde la fila 235
   (docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md) cada uno lleva, al pie, el
   bloque «¿Dónde se guarda?» de js/donde-se-guarda.js («A la guía de
   <tipo>», marcada, o «Solo en este asunto»), en vez de la casilla
   «También en la guía de <tipo>». A la guía: el cambio entra en
   `_GESTOR/guias.json` y llega también a los asuntos abiertos del
   mismo tipo, pero solo a los hitos que están «vacíos» (sin trabajo
   apuntado, `estaVacio`); un hito con trabajo nunca se toca. Llevar a
   la guía un hito propio del asunto, y el «Deshacer» del aviso de
   después, viven en js/hitos-desde-el-asunto-guia.js.

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

  /* Un hito está vacío si no tiene nada que perder: distinto de hecho,
     sin ninguna línea del guion marcada ni con valor, sin tareas
     propias, sin notas (las del hito y las del asunto con su
     etiqueta), sin documentos, sin rama elegida y sin una fecha puesta
     a mano. "En curso" solo no cuenta como trabajo (mismo criterio que
     `HitosCambioDeTipo.tieneAlgo`, en negativo).

     El responsable puesto a mano no se distingue aquí de uno que vino
     de la guía (no hay campo aparte que lo diga): al cambiar un hito
     vacío se sobrescribe igual, como ya hacía el editor de la guía
     antes de esta fila con los pasos nuevos. */
  function estaVacio(h, aOClave) {
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
      tambienGuia: window.DondeSeGuarda ? DondeSeGuarda.elegido() === 'guia' : false
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
      (opts.bloque || '')
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

  /* El bloque «¿Dónde se guarda?» de los tres cuadros (fila 235). `o`:
     { a, tipo, idOrigen, hitoNuevo, apagada }. Sin tipo, no sale. */
  async function bloqueDe(o) {
    if (!o.tipo || !window.DondeSeGuarda) return '';
    var otros = DondeSeGuarda.otrosAbiertos(o.a).length;
    var trabajo = 0;
    if (o.idOrigen && !o.apagada && window.HitosDesdeElAsuntoGuia) {
      try { trabajo = await HitosDesdeElAsuntoGuia.conTrabajo(o.tipo, o.idOrigen, o.a.nombre); } catch (e) { trabajo = 0; }
    }
    return DondeSeGuarda.bloqueHTML({
      tipoCorto: nombreCortoDe(o.tipo), otros: otros, conTrabajo: trabajo,
      hitoNuevo: o.hitoNuevo || null, apagada: o.apagada || ''
    });
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
    if (!window.DondeSeGuarda) return;
    DondeSeGuarda.enganchar();
    DondeSeGuarda.introAcepta($('hda-titulo'));
  }

  var MOTIVO_EN_PREGUNTA = 'Este hito está dentro de una pregunta: en la guía se cambia desde Ajustes.';

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
    var otros = Math.max(0, (r.tocados || 0) - 1);
    await HitosDesdeElAsuntoGuia.avisarConDeshacer(
      HitosDesdeElAsuntoGuia.textoGuardado(nombreCortoDe(tipo), otros, r.saltados || 0),
      { tipo: tipo, claveActual: a.nombre, antes: antes, aqui: aqui });
  }

  /* ==========================================================
     PROPAGAR UN CAMBIO (título/explicación/responsable/plazo/posición) A LOS
     ASUNTOS ABIERTOS: en el propio (siempre) y en los demás, solo si
     el hito sigue vacío. Nunca toca el ARCHIVO ni la biblioteca.
     ========================================================== */

  async function propagarCambio(tipo, idOrigen, campos, idAncla, claveActual) {
    var claves = clavesAbiertasDelTipo(tipo);
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
  async function propagarBorrado(tipo, idOrigen, claveActual) {
    var claves = clavesAbiertasDelTipo(tipo);
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
    var llegados = await GuiasDelCentro.guardarPasos(tipo, pasos);
    await avisarGuia(tipo, a, antes, { tocados: llegados, saltados: 0 },
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
        bloque: await bloqueDe({ a: a, tipo: tipo }), esCrear: true
      }), 'Guardar');
    enganchar();
    if (tipo) engancharBusquedaBiblioteca(function (modelo) { modeloElegido = modelo; }, function () { modeloElegido = null; });
    var ok = await esperar;
    var datos = ok ? leerFormulario() : null;
    soltarCuerpo();
    if (!ok) return;
    if (!datos.titulo) { U.aviso('Hace falta un título.', 'ambar'); return; }
    try {
      if (modeloElegido && tipo) {
        await crearDesdeBiblioteca(a, tipo, nivel, datos, modeloElegido);
      } else if (datos.tambienGuia && tipo) {
        await crearConGuia(a, tipo, nivel, datos);
      } else {
        await crearSoloAsunto(a, nivel, datos);
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
    var resultado = null;
    await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[a.nombre] || { creados: U.hoyIso(), hitos: [] };
      colocarTrasAncla(entrada.hitos, nuevo, datos.colocarDespuesDe);
      resultado = Hitos.recomputeEnCurso(entrada.hitos);
      d.porAsunto[a.nombre] = entrada;
      return d;
    });
    if (resultado) await Hitos.aplicarEstadoDelHito(a.nombre, resultado);
    U.aviso('Guardado solo en este asunto.', 'bueno');
  }

  async function crearConGuia(a, tipo, nivel, datos) {
    var idPasoAncla = pasoAnclaDeHito(nivel, datos.colocarDespuesDe);
    var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
    var pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
    var nuevoPaso = Guias.normalizar([{ titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo }])[0];
    colocarTrasAncla(pasos, nuevoPaso, idPasoAncla);
    var llegados = await GuiasDelCentro.guardarPasos(tipo, pasos);
    await avisarGuia(tipo, a, antes, { tocados: llegados, saltados: 0 },
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
    /* Fila 235: un hito que solo existe en este asunto también puede ir
       a la guía (con sus tareas); uno dentro de una pregunta, no. */
    var esPropio = !!(tipo && !conGuia && esNivelSuperior && h.clase !== 'decision' && window.HitosDesdeElAsuntoGuia);
    var colocarActual = '';
    if (esNivelSuperior) {
      var i = nivel.map(function (x) { return x.id; }).indexOf(h.id);
      colocarActual = i > 0 ? nivel[i - 1].id : '';
    }
    var responsables = await opcionesResponsable();
    var bloque = await bloqueDe({
      a: a, tipo: tipo, idOrigen: conGuia ? h.origenGuia : '',
      hitoNuevo: esPropio ? { titulo: h.titulo, tareas: (h.guionPropio || []).filter(function (g) { return !g.enLugarDe; }).length } : null,
      apagada: (tipo && !conGuia && !esPropio) ? (h.clase === 'decision' && esNivelSuperior
        ? 'Una pregunta con sus respuestas: en la guía se cambia desde Ajustes.' : MOTIVO_EN_PREGUNTA) : ''
    });
    var esperar = U.preguntar('Cambiar este hito',
      cuerpoFormulario({
        idPropio: h.id, nivel: esNivelSuperior ? nivel : [], colocarActual: colocarActual,
        responsables: responsables, responsable: h.responsable || '', plazo: h.plazo || null,
        titulo: h.titulo, cuerpo: h.cuerpo, bloque: bloque
      }), 'Guardar');
    enganchar();
    var ok = await esperar;
    var datos = ok ? leerFormulario() : null;
    soltarCuerpo();
    if (!ok) return;
    if (!datos.titulo) { U.aviso('Hace falta un título.', 'ambar'); return; }
    try {
      if (conGuia && datos.tambienGuia) {
        await cambiarConGuia(a, h, tipo, nivel, datos);
      } else if (esPropio && datos.tambienGuia) {
        await cambiarYLlevarALaGuia(a, h, tipo, esNivelSuperior, datos);
      } else {
        await cambiarSoloAsunto(a, h, esNivelSuperior, datos);
      }
      repintar();
    } catch (e) {
      U.aviso('No he podido guardar el cambio: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function cambiarSoloAsunto(a, h, esNivelSuperior, datos, callado) {
    await Hitos.guardarCampos(a.nombre, h.id, {
      titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo
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
    if (!callado) U.aviso('Guardado solo en este asunto.', 'bueno');
  }

  /* Fila 235: el hito propio se cambia aquí y entra en la guía con todas
     sus tareas (js/hitos-desde-el-asunto-guia.js). «Deshacer» lo deja
     como era justo después del cambio, solo en este asunto. */
  async function cambiarYLlevarALaGuia(a, h, tipo, esNivelSuperior, datos) {
    await cambiarSoloAsunto(a, h, esNivelSuperior, datos, true);
    var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
    var r = await HitosDesdeElAsuntoGuia.llevarHitoEntero(a, h);
    await avisarGuia(tipo, a, antes, { tocados: DondeSeGuarda.otrosAbiertos(a).length + 1, saltados: 0 },
      function () { return HitosDesdeElAsuntoGuia.dejarComoEstaba(a.nombre, r.hitoAntes); });
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
    colocarTrasAncla(pasos, paso, idPasoAncla);
    await GuiasDelCentro.guardarPasos(tipo, pasos);
    var r = await propagarCambio(tipo, h.origenGuia,
      { titulo: datos.titulo, cuerpo: datos.cuerpo, responsable: datos.responsable, plazo: datos.plazo },
      idPasoAncla, a.nombre);
    await avisarGuia(tipo, a, antes, r, null);
  }

  /* ==========================================================
     BORRAR ESTE HITO
     ========================================================== */

  async function abrirBorrar(a, h) {
    if (!estaVacio(h, a)) return;
    var tipo = tipoDe(a);
    var pasos = tipo ? GuiasDelCentro.pasosDe(tipo) : [];
    var conGuia = !!(h.origenGuia && pasoEsDeNivelSuperior(pasos, h.origenGuia));
    var bloque = (conGuia || (tipo && h.origenGuia))
      ? await bloqueDe({ a: a, tipo: tipo, idOrigen: conGuia ? h.origenGuia : '', apagada: conGuia ? '' : MOTIVO_EN_PREGUNTA })
      : '';
    var esperar = U.preguntar('Borrar este hito',
      '<p><strong>' + U.escapar(h.titulo || '') + '</strong></p>' + bloque, 'Borrar');
    enganchar();
    var ok = await esperar;
    if (!ok) return;
    var tambienGuia = conGuia && window.DondeSeGuarda && DondeSeGuarda.elegido() === 'guia';
    try {
      if (tambienGuia) {
        var antes = await HitosDesdeElAsuntoGuia.instantanea(tipo, a.nombre);
        var pasosCopia = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
        var i = pasosCopia.map(function (p) { return p.id; }).indexOf(h.origenGuia);
        if (i !== -1) pasosCopia.splice(i, 1);
        await GuiasDelCentro.guardarPasos(tipo, pasosCopia);
        var r = await propagarBorrado(tipo, h.origenGuia, a.nombre);
        await avisarGuia(tipo, a, antes, r, null);
      } else {
        await Hitos.quitarHito(a.nombre, h.id);
        U.aviso('Guardado solo en este asunto.', 'bueno');
      }
      if (window.HitoMesa) HitoMesa.cerrar();
      repintar();
    } catch (e) {
      U.aviso('No he podido borrar el hito: ' + U.mensajeDeError(e), 'malo');
    }
  }

  return {
    estaVacio: estaVacio,
    clavesAbiertasDelTipo: clavesAbiertasDelTipo,
    nivelSuperior: nivelSuperior,
    colocarTrasAncla: colocarTrasAncla,
    propagarCambio: propagarCambio,   /* fila 299: lo usa js/informar-al-tutor.js */
    pasoAnclaDeHito: pasoAnclaDeHito,
    abrirCrear: abrirCrear,
    abrirCambiar: abrirCambiar,
    abrirBorrar: abrirBorrar
  };
})();
