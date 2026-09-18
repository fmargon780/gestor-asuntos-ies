/* ============================================================
   ficha-menus.js — el menú pequeño y reutilizable de la cabecera de un
   asunto (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md, 5 y 9):
   lo usan los tres puntos del nombre y "Comunicar".

   Un botón que ya está en la página abre, al lado, una lista de
   opciones. Se cierra con Escape, pulsando fuera, o al elegir una:
   solo puede haber uno abierto a la vez, así que abrir uno cierra
   cualquier otro que hubiera quedado abierto.

   No sabe nada de asuntos ni de correo: monta el botón disparador con
   la lista que le pasen (`{texto, clase, deshabilitado, raya,
   alPulsar}`) y ya está. Iguales en espíritu a `U.menuDeAcciones`
   (js/util.js), que hace lo mismo para el menú de tres puntos de un
   documento: se escribe aparte porque esta fila lo pide como fichero
   propio (docs/CABECERA-DEL-ASUNTO.md, 14). */
var FichaMenus = (function () {

  var abierto = null;   /* { envoltorio, menu } del menú visible, o null */

  function cerrar() {
    if (!abierto) return;
    abierto.menu.classList.add('oculto');
    abierto = null;
  }

  document.addEventListener('mousedown', function (ev) {
    if (abierto && !abierto.envoltorio.contains(ev.target)) cerrar();
  }, true);

  /* En captura, y parando la tecla: por debajo, js/usabilidad.js
     también escucha Escape en el documento entero y, sin nada más
     abierto, la usa para volver a la pantalla anterior (pulsa
     `#ficha-volver`). Sin `stopPropagation` aquí, cerrar este menú con
     Escape se llevaba por delante la ficha entera (mismo cuidado que
     ya toma js/huecos-buscador.js). */
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !abierto) return;
    ev.stopPropagation();
    cerrar();
  }, true);

  /* `disparador` es el botón que ya está en la página (se envuelve tal
     cual, sin moverlo de sitio). `opciones` es la lista de entradas del
     menú, en orden. Devuelve `{ cerrar }`, por si hiciera falta cerrar
     desde fuera. Llamar de nuevo sobre el mismo `disparador` (por
     ejemplo, tras un repintado que lo haya dejado igual) no duplica
     nada: cada llamada monta su propio envoltorio y menú nuevos. */
  function montar(disparador, opciones) {
    var envoltorio = document.createElement('span');
    envoltorio.className = 'ficha-menu-envoltorio';
    disparador.parentNode.insertBefore(envoltorio, disparador);
    envoltorio.appendChild(disparador);

    var menu = document.createElement('div');
    menu.className = 'ficha-menu oculto';
    (opciones || []).forEach(function (o) {
      if (o.raya) {
        var raya = document.createElement('hr');
        raya.className = 'ficha-menu-raya';
        menu.appendChild(raya);
        return;
      }
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'ficha-menu-opcion' + (o.clase ? ' ' + o.clase : '');
      item.textContent = o.texto;
      item.disabled = !!o.deshabilitado;
      item.onclick = function () {
        cerrar();
        o.alPulsar();
      };
      menu.appendChild(item);
    });
    envoltorio.appendChild(menu);

    var propio = { envoltorio: envoltorio, menu: menu };
    disparador.onclick = function (ev) {
      ev.stopPropagation();
      var yaAbierto = abierto === propio;
      cerrar();
      if (yaAbierto) return;
      menu.classList.remove('oculto');
      abierto = propio;
    };

    return { cerrar: function () { if (abierto === propio) cerrar(); } };
  }

  return { montar: montar };
})();
