/* ============================================================
   asunto-extracto-ajustes.js — lo de Ajustes de la fila 627 (docs/627-ASUNTO-Y-EXTRACTO.md):

   1. La tarjeta «Asunto y extracto» de Ajustes → El centro: el asunto general (una línea) y el extracto general (varias
      líneas), cada uno con «+ Campo variable» y «Así sale». Se guardan en `_GESTOR/plantillas.json`
      (`asuntoGeneral`, `extractoGeneral`) por la cola de guardado de siempre (`Plantillas.guardar`).
   2. «Extracto de este tipo» en el menú ⋮ de cada tipo de documento (Ajustes → Lo de cada día → Tipos de documento): su
      propio extracto (`extractosPorTipo`); vacío, ese tipo usa el general. La tarjeta del tipo dice cuál lleva.

   La parte de componer está en js/asunto-extracto.js; el campo con su «Así sale», en js/asunto-extracto-campo.js.
   ============================================================ */
var AsuntoExtractoAjustes = (function () {

  function $(id) { return document.getElementById(id); }

  var ID_ASUNTO = 'ae-asunto-general';
  var ID_EXTRACTO = 'ae-extracto-general';
  var montada = false;

  function datos() { return Plantillas.enMemoria(); }

  /* ---------- 1. la tarjeta de Ajustes → El centro ---------- */

  function cuerpoHTML() {
    return '<div class="dos-columnas">' +
        '<div>' + AsuntoExtractoCampo.html(ID_ASUNTO, { etiqueta: 'Asunto de correos y mensajes de Séneca', placeholder: AsuntoExtracto.MODELO_ASUNTO }) +
          '<p class="nota">Cada plantilla de correo o de Séneca puede llevar su propio asunto. Si lo deja vacío, sale este.</p></div>' +
        '<div>' + AsuntoExtractoCampo.html(ID_EXTRACTO, { etiqueta: 'Extracto general del registro de Séneca', varias: true, filas: 3, placeholder: AsuntoExtracto.MODELO_EXTRACTO }) +
          '<p class="nota">Puede tener varias líneas y llevar datos del documento que se registra. Cada tipo de documento puede llevar su propio extracto (Ajustes → Lo de cada día → Tipos de documento). Si lo deja vacío, sale este.</p></div>' +
      '</div>' +
      '<p class="nota ae-numero"><b>El número del asunto se añade siempre al final</b>, aunque no lo pongas: con él la app reconoce las respuestas y los apuntes del registro. En los asuntos de antes, sin número, sigue saliendo el nombre de la carpeta.</p>' +
      '<button type="button" class="boton" id="ae-guardar">Guardar asunto y extracto</button>';
  }

  function montar() {
    var cuerpo = $('asunto-extracto-cuerpo');
    if (!cuerpo || montada) return;
    montada = true;
    cuerpo.innerHTML = cuerpoHTML();
    AsuntoExtractoCampo.enganchar(ID_ASUNTO, {
      unaLinea: true, ocultar: AsuntoExtracto.SOLO_DEL_DOCUMENTO,
      general: function () { return AsuntoExtracto.MODELO_ASUNTO; }
    });
    AsuntoExtractoCampo.enganchar(ID_EXTRACTO, {
      general: function () { return AsuntoExtracto.MODELO_EXTRACTO; }
    });
    $('ae-guardar').onclick = guardar;
  }

  function poner(id, valor) {
    var c = $(id);
    if (!c || document.activeElement === c) return;   /* lo que se está escribiendo no se pisa */
    c.value = valor || '';
    c.dispatchEvent(new Event('input'));
  }

  function pintar() {
    var d = datos();
    if (!d || !$(ID_ASUNTO)) return;
    poner(ID_ASUNTO, d.asuntoGeneral);
    poner(ID_EXTRACTO, d.extractoGeneral);
  }

  async function guardar() {
    var asunto = $(ID_ASUNTO).value.replace(/\s*\r?\n\s*/g, ' ').trim();
    var extracto = $(ID_EXTRACTO).value.replace(/[ \t]+$/gm, '').replace(/^\s+|\s+$/g, '');
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.asuntoGeneral = asunto;
        actual.extractoGeneral = extracto;
        return actual;
      });
      U.aviso('Asunto y extracto guardados.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- 2. el extracto de cada tipo de documento ---------- */

  /* «Extracto propio» o «Extracto general», para la tarjeta del tipo. Vacío si todavía no se han leído los ajustes. */
  function textoDeTarjeta(tipo) {
    var d = datos();
    if (!d) return '';
    return AsuntoExtracto.extractoPropioDelTipo(d, tipo) ? 'Extracto propio' : 'Extracto general';
  }

  async function editarDelTipo(tipo) {
    var d = datos();
    try { d = await Plantillas.cargar(App.E.gestor); } catch (e) { /* con lo que haya */ }
    var propio = AsuntoExtracto.extractoPropioDelTipo(d, tipo);
    var promesa = U.preguntar('Extracto de ' + tipo,
      '<p class="explica">El extracto de los documentos de este tipo cuando se registran en Séneca. Admite varias líneas y campos variables, ' +
      'también los del documento (su tipo, su fecha, su número). Vacío, este tipo usa el extracto general del centro.</p>' +
      AsuntoExtractoCampo.html('ae-extracto-tipo', { varias: true, filas: 3, valor: propio, placeholder: 'Vacío: sale el extracto general del centro' }),
      'Guardar');
    AsuntoExtractoCampo.enganchar('ae-extracto-tipo', {
      general: function () { return AsuntoExtracto.modeloGeneralDeExtracto(Plantillas.enMemoria()); },
      deQuien: { propio: '(el de este tipo)', general: '(el general del centro)' },
      extra: { 'tipo de documento': tipo }
    });
    var campo = $('ae-extracto-tipo');
    var ok = await promesa;
    if (!ok) return false;
    var texto = campo ? campo.value.replace(/[ \t]+$/gm, '').replace(/^\s+|\s+$/g, '') : '';
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        var mapa = actual.extractosPorTipo || (actual.extractosPorTipo = {});
        Object.keys(mapa).forEach(function (k) { if (U.normalizar(k) === U.normalizar(tipo)) delete mapa[k]; });
        if (texto) mapa[tipo] = texto;
        return actual;
      });
      U.aviso(texto ? 'Extracto de ' + tipo + ' guardado: ahora tiene extracto propio.' : 'Extracto de ' + tipo + ' vacío: usa el extracto general.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
    if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
    return true;
  }

  /* ---------- enganche ---------- */

  async function alRefrescar() {
    if (!App.E.gestor) return;
    try { await Plantillas.cargarReciente(App.E.gestor, 4000); } catch (e) { return; }
    montar();
    pintar();
    if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () { alRefrescar().catch(function () { /* un bloque roto no puede tumbar la aplicación */ }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { montar: montar, pintar: pintar, guardar: guardar, textoDeTarjeta: textoDeTarjeta, editarDelTipo: editarDelTipo };
})();
window.AsuntoExtractoAjustes = AsuntoExtractoAjustes;
