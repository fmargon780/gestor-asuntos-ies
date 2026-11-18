/* ============================================================
   entrada-aviso.js — el aviso de «falta señalar la carpeta de entrada»
   (fila 687, docs/687-AVISO-SIN-CARPETA-DE-ENTRADA.md; de la fila 677).

   Si las carpetas están en Drive (`nube: "drive"` en _GESTOR/rutas.json) y en este
   ordenador no se ha señalado la carpeta de entrada (js/entrada.js, estado «no-esta»
   sin carpeta señalada), «Por clasificar» se quedaba vacío sin decir nada. Ahora sale un
   aviso ámbar con «Señalar la carpeta» (la misma ventana que «Señalar» de Ajustes) junto a
   la línea «Ha llegado» de Inicio y arriba de la pantalla de «Por clasificar».
   Con la carpeta señalada, o con las carpetas fuera de Drive, no sale nada.
   Lo pinta App.verAbiertos (js/asuntos-lista.js) cada vez que lee los sueltos.
   ============================================================ */
var EntradaAviso = (function () {
  'use strict';

  var FRASE = 'En este ordenador falta señalar la carpeta de entrada: los documentos sueltos no se ven.';
  var BOTON = 'Señalar la carpeta';

  /* ¿Falta señalarla? Solo si no hay carpeta señalada y la entrada «no está» (carpetas en Drive). */
  function falta() {
    return !!(window.Entrada && !Entrada.senalada() && Entrada.estado() === 'no-esta');
  }

  async function senalar() {
    try {
      await Entrada.elegir();
      U.aviso('Carpeta de entrada señalada: ' + Entrada.nombre(), 'bueno');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      U.aviso('No he podido usar esa carpeta: ' + U.mensajeDeError(e), 'malo');
      return;
    }
    if (window.App && App.pintarCarpetasDeEsteOrdenador) App.pintarCarpetasDeEsteOrdenador();
    if (window.App && App.verAbiertos) { try { await App.verAbiertos(); } catch (e) { /* ya se verá al pulsar algo */ } }
  }

  /* Crea el aviso (una vez) en su sitio y devuelve el elemento, o null si el sitio no existe. */
  function asegurar(id, sitio, despuesDe) {
    var el = document.getElementById(id);
    if (el) return el;
    var padre = document.getElementById(sitio);
    if (!padre) return null;
    el = document.createElement('div');
    el.id = id;
    el.className = 'aviso-sin-entrada oculto';
    el.setAttribute('role', 'status');
    var texto = document.createElement('span');
    texto.className = 'aviso-sin-entrada-texto';
    texto.textContent = FRASE;
    el.appendChild(texto);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton aviso-sin-entrada-boton';
    b.textContent = BOTON;
    b.title = 'Elige la carpeta donde el resto del centro deja los documentos';
    b.onclick = senalar;
    el.appendChild(b);
    if (despuesDe) padre.insertBefore(el, padre.firstChild); else padre.appendChild(el);
    return el;
  }

  function pintar() {
    var hay = falta();
    var enSolo = !!(window.SoloConsulta && SoloConsulta.activo());
    [asegurar('aviso-sin-entrada-inicio', 'inicio-fila-superior', false),
     asegurar('aviso-sin-entrada-clasificar', 'zona-clasificar', true)].forEach(function (el) {
      if (!el) return;
      el.classList.toggle('oculto', !hay);
      el.querySelector('button').classList.toggle('oculto', enSolo);   /* solo consultar: el texto sí, el botón no */
    });
  }

  return { FRASE: FRASE, falta: falta, pintar: pintar };
})();
window.EntradaAviso = EntradaAviso;
