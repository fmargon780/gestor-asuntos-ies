/* ============================================================
   asunto-sin-hitos-falta.js — «Falta: <dato>» en una tarea de la lista de un asunto sin hitos
   (18-nov-2026, fila 701, docs/701-GUIA-COMO-LISTA-DE-TAREAS.md).

   Una tarea con «Solo si» sale en amarillo con «Falta: <dato>» cuando el dato del asunto está vacío
   (js/solo-si.js). Al pulsar ese aviso se elige el valor ahí mismo, con el desplegable de siempre, y se
   guarda en «Datos» por el mismo camino que «Rellenar» (js/campo-desde-el-asunto.js). Con el dato
   puesto, la lista se queda con las tareas que tocan. El aviso «Falta: Clase del tercero» no se rellena
   aquí (la clase la dice el tercero del asunto).
   ============================================================ */
var AsuntoSinHitosFalta = (function () {

  var abiertas = {};   /* idTarea -> true: el desplegable está a la vista (vista, no se guarda) */

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function etiquetaHTML(g) {
    if (!g.falta) return '';
    var rellenable = !(window.SoloSi && (g.falta === SoloSi.CAMPO_TERCERO || g.falta === SoloSi.CAMPO_ENSENANZA));   /* filas 701 y 781: salen solos */
    return '<button type="button" class="solo-si-etiqueta ash-falta" data-campo="' + esc(g.falta) + '"' + (rellenable ? '' : ' disabled') + '>Falta: ' + esc(g.falta) + '</button>';
  }

  function opcionesDe(a, campo) {
    var tipo = SoloSi.tipoDe(a);
    var listas = window.TextoCondicional ? TextoCondicional.listasPorNombre(tipo, a.ficha) : {};
    var k = Object.keys(listas).filter(function (n) { return U.normalizar(n) === U.normalizar(campo); })[0];
    return k ? listas[k] : [];
  }

  function debajoHTML(g, a) {
    if (!abiertas[g.id] || !g.falta) return '';
    return '<div class="ash-rellenar"><label class="etiqueta" for="ash-rellenar-' + esc(g.id) + '">' + esc(g.falta) + '</label>' +
      '<select class="campo ash-rellenar-valor" id="ash-rellenar-' + esc(g.id) + '" data-clave="ash-rellenar-' + esc(g.id) + '"><option value="">Elige…</option>' +
      opcionesDe(a, g.falta).map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="enlace ash-rellenar-cancelar">Cancelar</button></div>';
  }

  /* Escribe el valor en la ficha del asunto, por el camino de «Rellenar». */
  async function guardar(a, campo, valor) {
    var tipo = SoloSi.tipoDe(a);
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    var ficha = (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha;
    var cfg = Campos.camposDeAsunto(config, ficha).filter(function (c) { return U.normalizar(Campos.nombreDeCampo(c, App.E.campos)) === U.normalizar(campo); })[0];
    if (!cfg) throw new Error('El asunto ya no tiene el dato «' + campo + '».');
    await CampoDesdeElAsunto._i.escribirEnAsunto(a, Campos.claveDeCampo(cfg), { valor: valor });
    CampoDesdeElAsunto._i.repintar(a);
  }

  /* `el`: la tarea pintada; `repintar`: vuelve a pintar la lista. */
  function enganchar(el, a, g, repintar) {
    var boton = el.querySelector('.ash-falta');
    if (boton && !boton.disabled) boton.onclick = function () { abiertas[g.id] = !abiertas[g.id]; repintar(); };
    var cancelar = el.querySelector('.ash-rellenar-cancelar');
    if (cancelar) cancelar.onclick = function () { delete abiertas[g.id]; repintar(); };
    var lista = el.querySelector('.ash-rellenar-valor');
    if (lista) lista.onchange = async function () {
      if (!lista.value) return;
      lista.disabled = true;
      try {
        await guardar(a, g.falta, lista.value);
        delete abiertas[g.id];
        U.aviso('«' + g.falta + '» guardado en los datos del asunto.', 'bueno');
      } catch (err) {
        lista.disabled = false;
        U.fallo('No he podido guardar «' + g.falta + '»', err);
      }
      repintar();
    };
  }

  return { etiquetaHTML: etiquetaHTML, debajoHTML: debajoHTML, enganchar: enganchar };
})();
window.AsuntoSinHitosFalta = AsuntoSinHitosFalta;
