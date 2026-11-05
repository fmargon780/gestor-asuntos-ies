/* ============================================================
   hitos-desde-el-asunto-formulario.js — el formulario compartido por crear y cambiar un hito (fila 535: trozo de js/hitos-desde-el-asunto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga después de js/hitos-desde-el-asunto-puras.js.
   ============================================================ */
(function () {

  var I = window.HitosDesdeElAsuntoNucleo = window.HitosDesdeElAsuntoNucleo || {};
  function $() { return I.$.apply(this, arguments); }

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

  I.leerFormulario = leerFormulario;
  I.opcionesResponsable = opcionesResponsable;
  I.cuerpoFormulario = cuerpoFormulario;
  I.tipoDe = tipoDe;
  I.nombreCortoDe = nombreCortoDe;
  I.soltarCuerpo = soltarCuerpo;
  I.enganchar = enganchar;
})();
