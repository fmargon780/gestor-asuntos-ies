/* ============================================================
   guias-barra.js — la barra de formato del cuadro de escribir la guía
   (negrita, viñetas, enlace, quitar formato). Sacada de js/guias.js
   (24-sep-2026, fila 122, docs/GUIA-EN-ACORDEON.md: aquel fichero
   pasaba de las 1.200 líneas). Una sola barra arriba, que actúa sobre
   el recuadro en el que se está escribiendo.

   - `html()`: la barra y la fila de pedir un enlace.
   - `enganchar()`: sus botones, una vez abierto el cuadro.
   - `escribiendoEn(el)`: el recuadro donde está el cursor (al enfocarlo).
   - `reiniciar()`: se olvida el recuadro y la selección (al repintar o
     al cerrar el cuadro).
   ============================================================ */
var GuiasBarra = (function () {

  function $(id) { return document.getElementById(id); }

  var editando = null;      /* el recuadro donde está el cursor */
  var rangoGuardado = null; /* lo que había seleccionado al pedir un enlace */

  function mandar(orden, valor) {
    if (!editando) { U.aviso('Pon antes el cursor en el texto de un paso.'); return; }
    editando.focus();
    try { document.execCommand(orden, false, valor || null); } catch (e) {}
  }

  function html() {
    return '<div class="guia-barra">' +
      '<button type="button" class="boton" id="guia-negrita" title="Negrita"><strong>N</strong></button>' +
      '<button type="button" class="boton" id="guia-vinetas" title="Lista con viñetas">Viñetas</button>' +
      '<button type="button" class="boton" id="guia-enlace" title="Poner un enlace">Enlace</button>' +
      '<button type="button" class="boton" id="guia-quitar" title="Quitar el formato">Quitar formato</button>' +
      '</div>' +
      '<div class="guia-enlace-fila oculto" id="guia-enlace-fila">' +
      '<input id="guia-enlace-url" class="campo" placeholder="https://…  o  correo@centro.es">' +
      '<button type="button" class="boton boton-principal" id="guia-enlace-poner">Poner</button>' +
      '<button type="button" class="boton" id="guia-enlace-quitar">Cancelar</button>' +
      '</div>';
  }

  function enganchar() {
    function sinPerderElCursor(id, hacer) {
      var b = $(id);
      b.onmousedown = function (ev) { ev.preventDefault(); };
      b.onclick = hacer;
    }

    sinPerderElCursor('guia-negrita', function () { mandar('bold'); });
    sinPerderElCursor('guia-vinetas', function () { mandar('insertUnorderedList'); });
    sinPerderElCursor('guia-quitar', function () { mandar('removeFormat'); });
    sinPerderElCursor('guia-enlace', function () {
      if (!editando) { U.aviso('Pon antes el cursor en el texto de un paso.'); return; }
      var sel = window.getSelection();
      rangoGuardado = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
      $('guia-enlace-fila').classList.remove('oculto');
      $('guia-enlace-url').value = '';
      $('guia-enlace-url').focus();
    });

    $('guia-enlace-quitar').onclick = function () {
      $('guia-enlace-fila').classList.add('oculto');
    };

    $('guia-enlace-poner').onclick = function () {
      var url = $('guia-enlace-url').value.trim();
      if (!url) return;
      if (url.indexOf('@') !== -1 && !/^mailto:/i.test(url) && url.indexOf(' ') === -1 &&
          !/^https?:\/\//i.test(url)) url = 'mailto:' + url;
      if (!/^(https?:\/\/|mailto:)/i.test(url)) url = 'https://' + url;
      $('guia-enlace-fila').classList.add('oculto');
      if (!editando) return;
      editando.focus();
      if (rangoGuardado) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rangoGuardado);
        if (rangoGuardado.collapsed) {
          document.execCommand('insertHTML', false,
            '<a href="' + U.escapar(url) + '">' + U.escapar(url) + '</a>');
        } else {
          document.execCommand('createLink', false, url);
        }
      }
      rangoGuardado = null;
    };
  }

  return {
    html: html, enganchar: enganchar,
    escribiendoEn: function (el) { editando = el; },
    reiniciar: function () { editando = null; rangoGuardado = null; }
  };
})();
window.GuiasBarra = GuiasBarra;
