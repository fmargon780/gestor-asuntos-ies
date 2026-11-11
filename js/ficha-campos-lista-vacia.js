/* ============================================================
   ficha-campos-lista-vacia.js — en «Campos del asunto», un dato de lista
   que todavía no tiene valor sale con su desplegable «Elegir…», para
   rellenarlo ahí mismo (fila 592, docs/592-BAJA-MATRICULA.md; era el límite
   apuntado al cerrar la fila 576).

   - `fila(cfg, a)`: la fila para un campo del tipo que es de lista y está
     vacío; null si no lo es (o es de un hito: ese se rellena en su hito).
   - `filaHtml(f)`: la fila pintada (la llama js/ficha-asunto.js).
   - `alPintar(caja, a)`: engancha los desplegables tras pintar la ficha
     (lo llama `CampoDesdeElAsunto.alPintar`). Guarda con
     `DatosDelAsunto.guardar`, como cualquier otro dato.
   En un asunto que no está abierto (consulta, archivo) el desplegable sale
   apagado.
   ============================================================ */
var FichaCamposListaVacia = (function () {

  function fila(cfg, a) {
    if (!cfg || cfg.hito || cfg.soloAqui || !window.Campos) return null;
    if (Campos.claseDeCampo(cfg, App.E.campos) !== 'lista') return null;
    var propio = cfg.origen === 'propio' ? Campos.propioDe(cfg.id, App.E.campos) : null;
    var valores = (propio && propio.valores) || [];
    if (!valores.length) return null;
    var nombre = Campos.nombreDeCampo(cfg, App.E.campos);
    return { titulo: nombre, valor: '', elegir: { nombre: nombre, valores: valores.slice() } };
  }

  function abierto() {
    var N = window.FichaNucleo;
    return !N || N.modoActual === 'abierto';
  }

  function filaHtml(f) {
    return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' +
      '<select class="campo ficha-dato-elegir" data-nombre="' + U.escapar(f.elegir.nombre) + '"' + (abierto() ? '' : ' disabled') + '>' +
      '<option value="">Elegir…</option>' +
      f.elegir.valores.map(function (v) { return '<option value="' + U.escapar(v) + '">' + U.escapar(v) + '</option>'; }).join('') +
      '</select></span></div>';
  }

  function alPintar(caja, a) {
    Array.prototype.forEach.call(caja.querySelectorAll('.ficha-dato-elegir'), function (el) {
      el.onchange = async function () {
        if (el.dataset.guardando || !el.value) return;
        el.dataset.guardando = '1';
        var nombre = el.dataset.nombre;
        try {
          var r = await DatosDelAsunto.guardar(a, nombre, el.value);
          if (!r.ok) { U.aviso(r.aviso, 'ambar'); el.value = ''; return; }
          U.aviso('«' + nombre + '» guardado en el asunto.', 'bueno');
          if (window.DatosDelAsuntoVista) DatosDelAsuntoVista.alGuardarAlgo(a);
        } catch (e) { U.fallo('No he podido guardar «' + nombre + '»', e); el.value = ''; }
        finally { delete el.dataset.guardando; }
      };
    });
  }

  return { fila: fila, filaHtml: filaHtml, alPintar: alPintar };
})();
window.FichaCamposListaVacia = FichaCamposListaVacia;
