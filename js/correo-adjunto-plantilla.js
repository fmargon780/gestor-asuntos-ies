/* ============================================================
   correo-adjunto-plantilla.js — una plantilla de correo que adjunta sola
   un documento (7-oct-2026, fila 299, docs/CORREO-AL-TUTOR-DEL-GRUPO.md,
   apartado 1.5).

   La plantilla lleva `adjuntar` (el nombre de un tipo de documento del
   centro). Al abrirse el cuadro de Correo con ella, o al elegirla en el
   desplegable, en «Documentos de este asunto» queda marcado el documento
   más reciente de ese tipo, además de los que ya vinieran marcados. Al
   cambiar de plantilla se desmarca el que marcó la app (si la persona no
   lo ha tocado) y se marca el de la plantilla nueva; lo que marcó la
   persona no se toca. Sin ninguno, una línea ámbar en ese bloque (no
   impide enviar). En el cuadro de Séneca no hay adjuntos: el documento se
   señala como el que hay que adjuntar a mano (`documentoSeneca`), si no
   venía ya otro señalado.

   `elegirDocumento` es pura. El tipo se saca del nombre con
   `Documentos.leerNombre` (los nombres de antes y los de la fila 239).
   ============================================================ */
var CorreoAdjuntoPlantilla = (function () {

  var marcadoPorApp = '';   /* el documento que marcó la app en este cuadro */
  var tocado = false;       /* la persona ha cambiado esa casilla */

  function $(id) { return document.getElementById(id); }

  function numeroDe(numero) {
    var m = String(numero || '').match(/^D(\d{2})-(\d+)$/);
    return m ? parseInt(m[1], 10) * 1000000 + parseInt(m[2], 10) : -1;
  }

  /* PURA. `leer(nombre)` -> { tipo, fecha, numero } (por defecto, `Documentos.leerNombre`).
     El más reciente del tipo: la fecha del nombre y, a igualdad, el número mayor; con Word y PDF
     del mismo documento, el PDF. '' si no hay ninguno. */
  function elegirDocumento(nombres, tipo, leer) {
    var buscado = U.normalizar(String(tipo || '')).trim();
    if (!buscado) return '';
    var lee = leer || function (n) { return window.Documentos ? Documentos.leerNombre(n) : {}; };
    var candidatos = [];
    (nombres || []).forEach(function (n) {
      var l = lee(n) || {};
      if (!l.tipo || U.normalizar(String(l.tipo)).trim() !== buscado) return;
      candidatos.push({ nombre: n, fecha: l.fecha || '', num: numeroDe(l.numero), pdf: /\.pdf$/i.test(n) ? 1 : 0 });
    });
    candidatos.sort(function (a, b) {
      return (b.fecha < a.fecha ? -1 : b.fecha > a.fecha ? 1 : 0) || (b.num - a.num) || (b.pdf - a.pdf) || (a.nombre < b.nombre ? -1 : 1);
    });
    return candidatos.length ? candidatos[0].nombre : '';
  }

  function avisoHtml() { return '<div id="correo-adjunto-plantilla-aviso"></div>'; }

  async function nombresDelAsunto(a) {
    try { return a && a.handle ? (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }) : []; } catch (e) { return []; }
  }

  function plantillaPorId(a, id) {
    if (!id || !window.CorreoNucleo || !CorreoNucleo.plantillasDelTipo) return null;
    return (CorreoNucleo.plantillasDelTipo(a) || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  function casilla(nombre) {
    return Array.prototype.filter.call(document.querySelectorAll('#correo-formulario .adjunto-marca'), function (c) { return c.value === nombre; })[0] || null;
  }

  function ponerAviso(texto) {
    var caja = $('correo-adjunto-plantilla-aviso');
    if (!caja) return;
    caja.className = texto ? 'aviso aviso-ambar' : '';
    caja.textContent = texto || '';
  }

  /* Deja marcado el documento de la plantilla (y desmarca el que marcó la app antes, si nadie lo tocó). */
  async function aplicar(a, id) {
    var previo = marcadoPorApp && !tocado ? casilla(marcadoPorApp) : null;
    if (previo) previo.checked = false;
    marcadoPorApp = ''; tocado = false;
    ponerAviso('');
    var p = plantillaPorId(a, id);
    var tipo = p && p.adjuntar;
    if (!tipo) return;
    var nombre = elegirDocumento(await nombresDelAsunto(a), tipo);
    if (!nombre) { ponerAviso('Esta plantilla adjunta el documento ' + tipo + ', y en este asunto todavía no hay ninguno.'); return; }
    var c = casilla(nombre);
    if (c && !c.checked) { c.checked = true; marcadoPorApp = nombre; }   /* si ya venía marcado, no es de la app */
  }

  function alAbrir(a, id) {
    marcadoPorApp = ''; tocado = false;
    var form = $('correo-formulario');
    if (form) form.addEventListener('change', function (ev) {
      if (ev.target && ev.target.classList && ev.target.classList.contains('adjunto-marca') && ev.target.value === marcadoPorApp) tocado = true;
    });
    return aplicar(a, id);
  }

  function alElegir(a, id) { return aplicar(a, id); }

  /* Séneca: no hay adjuntos; se señala el documento para adjuntarlo a mano si no venía ya otro. */
  async function paraSeneca(a, id) {
    var N = window.CorreoNucleo || {};
    var previo = document.querySelector('#seneca-formulario .seneca-doc-adjuntar[data-de-plantilla]');
    if (previo) previo.remove();
    if (N.documentoSeneca && N.documentoSeneca()) return;
    var p = plantillaPorId(a, id);
    var nombre = p && p.adjuntar ? elegirDocumento(await nombresDelAsunto(a), p.adjuntar) : '';
    var arriba = document.querySelector('#seneca-formulario .seneca-aviso-arriba');
    if (!nombre || !arriba || document.querySelector('#seneca-formulario .seneca-doc-adjuntar[data-de-plantilla]')) return;
    var d = document.createElement('div');
    d.className = 'seneca-doc-adjuntar';
    d.setAttribute('data-de-plantilla', '1');
    d.innerHTML = '<strong>Adjunta este documento en Séneca:</strong> ' + U.escapar(nombre) + ' <button type="button" class="enlace">Copiar el nombre</button>';
    d.querySelector('button').onclick = function () { U.copiar(nombre, this); };
    arriba.parentNode.insertBefore(d, arriba.nextSibling);
  }

  return { elegirDocumento: elegirDocumento, avisoHtml: avisoHtml, alAbrir: alAbrir, alElegir: alElegir, paraSeneca: paraSeneca };
})();
window.CorreoAdjuntoPlantilla = CorreoAdjuntoPlantilla;
