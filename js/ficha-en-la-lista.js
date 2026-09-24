/* ============================================================
   ficha-en-la-lista.js — el nombre del asunto, en la tarjeta de la lista, abre la ficha; y la tarjeta se queda con lo justo.

   Sacado tal cual de js/ficha-asunto.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la ficha (el asunto que se ve, su modo, la huella…) y lo
   de los demás ficheros de la ficha se piden a `window.FichaNucleo` (N).
   Se carga justo detrás de js/ficha-asunto.js.
   ============================================================ */
(function () {
  var N = window.FichaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* El nombre del asunto, en la tarjeta de la lista, abre la ficha.

     Y ya que dentro de la ficha están todos los botones, la tarjeta se
     queda con lo justo: el desplegable del estado, que es lo que más
     se toca y se hace de un clic sin entrar, copiar el nombre para
     pegarlo en un correo, y archivar el asunto cuando se termina. Lo
     demás (vía, plazo, editar, guía, notas, documentos y los campos
     del tipo) se hace dentro. */
  var BOTONES_DE_LA_TARJETA = ['Copiar nombre', 'Cerrar', 'Reabrir'];

  /* "Cerrar" se llama Archivar, que es lo que de verdad hace: llevar
     la carpeta al ARCHIVO. El texto se cambia aquí, donde ya se está
     tocando la tarjeta. */
  var NOMBRES_NUEVOS = { 'Cerrar': 'Archivar' };

  U.envolver(App, 'App.tarjetaAsunto', 'ficha-en-la-lista.js', function (comoEra) {
    return function (a, modo) {
      var div = comoEra(a, modo);

      var nombre = div.querySelector('.tarjeta-nombre');
      if (nombre) {
        nombre.classList.add('nombre-pulsable');
        nombre.title = 'Abrir la ficha de este asunto';
        nombre.onclick = async function (ev) {
          ev.stopPropagation();
          /* Fila 64: la tarjeta del ARCHIVO solo trae lo poco que
             guarda el índice (situacion, via, categoria, tercero). Antes
             de abrir la ficha de verdad, se completa con lo que haya en
             _ficha.json, dentro de la propia carpeta. */
          if (modo === 'archivado' && window.FichaArchivo) await FichaArchivo.completar(a);
          App.abrirFicha(a, modo);
        };
      }

      var acciones = div.querySelector('.acciones');
      if (acciones) {
        Array.prototype.slice.call(acciones.children).forEach(function (h) {
          if (h.tagName === 'SELECT') return;            /* el estado se queda */
          var texto = (h.textContent || '').trim();
          if (BOTONES_DE_LA_TARJETA.indexOf(texto) === -1) { acciones.removeChild(h); return; }
          if (NOMBRES_NUEVOS[texto]) {
            h.textContent = NOMBRES_NUEVOS[texto];
            h.title = 'Llevar la carpeta al ARCHIVO';
          }
        });
      }

      return div;
    };
  });
})();
