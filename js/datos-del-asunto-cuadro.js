/* ============================================================
   datos-del-asunto-cuadro.js — lo que falta en un correo o en un mensaje
   de Séneca se escribe ahí mismo y se guarda en el asunto (fila 530,
   docs/530-DATOS-EN-EL-ASUNTO.md, punto 5).

   Sustituye al aviso ámbar «Faltan datos: …» de js/correo-cuadro-cuerpo.js
   y js/seneca-cuadro.js: una caja ámbar con una fila por dato que falta
   (js/datos-del-asunto-vista.js). Al salir de una caja el dato se guarda
   en el asunto, se vuelven a leer los valores del cuadro y el texto de la
   plantilla se rellena otra vez (con la misma pregunta de siempre si el
   texto tenía algo escrito a mano).

   html(prefijo, a, faltan)       la caja, o '' si no falta nada
   enganchar(prefijo, a, alGuardar)  tras pintar el cuerpo; `alGuardar()` repinta
   ============================================================ */
var DatosDelAsuntoCuadro = (function () {

  function valoresDelCuadro() { return window.CorreoNucleo && CorreoNucleo.valoresDelCuadro ? CorreoNucleo.valoresDelCuadro() : null; }

  function datosDe(a, faltan, valores) {
    var vistos = {};
    return (faltan || []).filter(function (f) { var k = DatosDelAsunto.norm(f); if (vistos[k]) return false; vistos[k] = true; return true; }).map(function (f) {
      return { nombre: f, valor: '', falta: true, info: DatosDelAsunto.infoDe(f, a, valores) };
    });
  }

  function html(prefijo, a, faltan) {
    if (!faltan || !faltan.length) return '';
    var datos = datosDe(a, faltan, valoresDelCuadro());
    return '<div class="dap-cuadro" id="' + prefijo + '-faltan-datos" data-faltan="' + U.escapar(JSON.stringify(faltan)) + '">' +
      '<div class="pequeno"><strong>Faltan datos.</strong> Escribe lo que falte: se guarda en el asunto y ninguna otra plantilla lo vuelve a pedir.</div>' +
      DatosDelAsuntoVista.html(a, datos, { prefijo: prefijo + '-dato', sinResumen: true }) + '</div>';
  }

  /* Los valores del cuadro (los que usa el cuerpo) se releen del asunto, dentro del mismo objeto. */
  async function refrescarValores(a) {
    var vivos = valoresDelCuadro();
    if (!vivos) return;
    var hito = (CorreoNucleo._interno && CorreoNucleo._interno.hitoActual) || null;
    var nuevos = await Plantillas.valoresDeAsunto(a, { hito: hito });
    Object.keys(vivos).forEach(function (k) { delete vivos[k]; });
    Object.assign(vivos, nuevos);
  }

  function enganchar(prefijo, a, alGuardar) {
    var caja = document.getElementById(prefijo + '-faltan-datos');
    if (!caja) return;
    var faltan = [];
    try { faltan = JSON.parse(caja.dataset.faltan || '[]'); } catch (e) { faltan = []; }
    var datos = datosDe(a, faltan, valoresDelCuadro());
    var raiz = caja.querySelector('.dap');
    if (!raiz) return;
    DatosDelAsuntoVista.enganchar(raiz, a, datos, {
      alCambiar: async function () {
        try { await refrescarValores(a); }
        catch (e) { U.accesorio('Guardado en el asunto, pero no he podido volver a leer los datos', e); return; }
        if (alGuardar) alGuardar();
      }
    });
  }

  return { html: html, enganchar: enganchar, datosDe: datosDe };
})();
window.DatosDelAsuntoCuadro = DatosDelAsuntoCuadro;
