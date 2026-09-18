/* ============================================================
   ficha-nombre-acciones.js — el menú de tres puntos del nombre del
   asunto (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md, 5).

   "Editar", "Borrar" y "Copiar nombre" vivían sueltos en la barra de
   acciones. Aquí se juntan bajo el nombre del asunto, en un menú
   pequeño (js/ficha-menus.js) anclado al `<h2 class="ficha-nombre">`,
   con las mismas llamadas de siempre: nada de esto cambia lo que hace
   cada acción, solo dónde vive.

   Mismo envoltorio de siempre para sobrevivir al repintado con
   `innerHTML` de la ficha (js/copiar.js, js/via-contacto.js): se
   envuelve `App.abrirFicha` para saber qué asunto y qué modo hay, y un
   `MutationObserver` sobre `#pantalla-asunto` vuelve a poner el botón
   cada vez que la ficha se rehace entera. */
(function () {

  var comoEra = App.abrirFicha;
  if (typeof comoEra !== 'function') return;

  var viendo = null;
  var modoDelAsunto = 'abierto';

  App.abrirFicha = function (a, modo) {
    viendo = a;
    modoDelAsunto = modo || 'abierto';
    comoEra(a, modo);
    poner();
  };

  async function borrarAsunto() {
    if (!window.Papelera || !viendo) return;
    var a = viendo;
    var docs = [];
    try { docs = await Carpetas.ficheros(a.handle); } catch (e) { docs = []; }
    var ok = await window.Papelera.preguntarBorrar(a.nombre,
      docs.length ? '<p class="nota">Se lleva ' + docs.length + ' documento' +
        (docs.length === 1 ? '' : 's') + '.</p>' : '');
    if (!ok) return;
    if (docs.length) {
      var seguro = await U.preguntar(a.nombre, '<p>¿Seguro?</p>', 'Sí, a la papelera');
      if (!seguro) return;
    }
    try {
      await Papelera.mandarAsunto(a);
      U.aviso('Asunto mandado a la papelera.', 'bueno');
      App.volverALaLista();
    } catch (e) {
      U.aviso('No he podido mandarlo a la papelera: ' + e.message, 'malo');
    }
  }

  function opcionesDelMenu(a, abierto) {
    var lista = [];
    if (abierto) {
      lista.push({
        texto: 'Editar el asunto',
        alPulsar: async function () { await App.editarAsunto(a); App.volverALaLista(); }
      });
    }
    lista.push({
      texto: 'Copiar el nombre del asunto',
      alPulsar: function () {
        navigator.clipboard.writeText(a.nombre).then(function () {
          U.aviso('Nombre copiado.', 'bueno');
        });
      }
    });
    if (abierto && window.Papelera) {
      lista.push({ raya: true });
      lista.push({ texto: 'Borrar el asunto', clase: 'ficha-menu-peligro', alPulsar: borrarAsunto });
    }
    return lista;
  }

  function poner() {
    if (!viendo) return;
    var h2 = document.querySelector('.ficha-nombre');
    if (!h2 || h2.querySelector('.ficha-nombre-menu-boton')) return;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'ficha-nombre-menu-boton';
    boton.title = 'Más acciones sobre el asunto';
    boton.textContent = '⋯';
    h2.appendChild(boton);

    FichaMenus.montar(boton, opcionesDelMenu(viendo, modoDelAsunto === 'abierto'));
  }

  var pantalla = document.getElementById('pantalla-asunto');
  if (pantalla && window.MutationObserver) {
    new MutationObserver(function () { poner(); })
      .observe(pantalla, { childList: true, subtree: true });
  }
})();
