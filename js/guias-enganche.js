/* ============================================================
   guias-enganche.js — pone las guías dentro de la aplicación.

   guias.js sabe pintar y escribir una guía, pero no sabe nada de la
   aplicación. Este fichero es el que la enchufa: guarda las guías en
   _GESTOR/guias.json, pone el botón de cada tipo en Ajustes, y la
   enseña como recordatorio al crear un asunto. Los pasos, ya con sus
   casillas, se ven y se marcan dentro de la ficha del asunto
   (js/ficha-asunto.js), no desde la tarjeta de la lista.

   Lo que se marca como hecho se guarda en la ficha del asunto, en
   asuntos.json, así que lo ve todo el que abra la aplicación.

   Desde el 10-sep-2026 la guía también se escribe **desde la ficha de
   un asunto**, sin ir a Ajustes: es ahí, tramitando, donde uno se da
   cuenta de qué pasos faltan. Ese botón lo pone js/ficha-asunto.js y
   llama aquí, a `window.GuiasDelCentro.escribir`, para que las guías se
   sigan guardando en un solo sitio.
   ============================================================ */
(function () {

  var FICHERO = 'guias.json';

  var guias = {};        /* { "MATRICULA": [pasos], ... } */
  var yaLeido = false;

  function $(id) { return document.getElementById(id); }

  function pasosDe(tipo) {
    return (guias && guias[tipo]) ? guias[tipo] : [];
  }

  async function cargar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    try {
      var leido = await Carpetas.leerJson(g, FICHERO);
      guias = (leido && typeof leido === 'object') ? leido : {};
    } catch (e) {
      guias = {};
      U.aviso('No he podido leer las guías: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function guardar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    await Copias.guardar(g, FICHERO, guias);
  }

  /* ---------- la guía como recordatorio, al crear el asunto ----------

     Aquí sale sin casillas: todavía no hay asunto que marcar. Es para
     ver de un vistazo en qué se está metiendo uno. */

  function pintarGuiaNuevo() {
    var caja = $('guia-nuevo');
    if (!caja) return;
    var elegido = document.querySelector('#tipos-lista .tipo-boton.elegido');
    var tipo = elegido ? elegido.textContent.trim() : '';
    var pasos = pasosDe(tipo);
    if (!pasos.length) {
      caja.className = 'oculto';
      caja.innerHTML = '';
      return;
    }
    caja.className = 'guia-caja';
    caja.innerHTML = '<div class="guia-rotulo">Pasos de un asunto ' + U.escapar(tipo) + '</div>' +
                     Guias.vista(pasos, [], false);
  }

  /* ---------- la tabla de Ajustes ---------- */

  function pintarTabla() {
    var caja = $('tabla-guias');
    if (!caja) return;
    caja.innerHTML = '';

    var tipos = window.Gestor.tipos();
    if (!tipos.length) {
      caja.innerHTML = '<div class="vacio">Primero hacen falta tipos de asunto, ' +
                       'aquí mismo en Ajustes.</div>';
      return;
    }

    Nombres.CATEGORIAS.forEach(function (cat) {
      var deEsta = tipos.filter(function (t) { return t.categoria === cat; });
      if (!deEsta.length) return;
      var t = document.createElement('h4');
      t.textContent = cat;
      t.style.cssText = 'margin:16px 0 4px;font-size:13px;color:#5d6b7a';
      caja.appendChild(t);

      deEsta.forEach(function (tipo) {
        var pasos = pasosDe(tipo.tipo);
        var f = document.createElement('div');
        f.className = 'fila-tipo';
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(tipo.tipo) + '</span>' +
          '<span class="suave" style="flex:1">' +
          (pasos.length
            ? (pasos.length === 1 ? '1 paso' : pasos.length + ' pasos')
            : 'sin guía todavía') + '</span>';

        var b = document.createElement('button');
        b.className = 'boton' + (pasos.length ? ' boton-marcado' : '');
        b.textContent = pasos.length ? 'Cambiar la guía' : 'Escribir la guía';
        b.onclick = function () { escribirGuia(tipo.tipo); };
        f.appendChild(b);

        caja.appendChild(f);
      });
    });
  }

  /* Abre el cuadro de escribir la guía de un tipo y la guarda.
     Devuelve true si se ha guardado algo, false si se ha cancelado o si
     ha fallado.

     **Se relee el fichero antes de abrir el cuadro.** El compañero puede
     haber escrito otra guía desde el otro ordenador mientras tanto, y sin
     releer se guardaría encima de la suya. Es la misma precaución que
     toma App.anotar con asuntos.json. */
  async function escribirGuia(nombreTipo) {
    if (!nombreTipo) return false;
    try {
      await cargar();
      yaLeido = true;
    } catch (e) { /* si no se puede releer, se sigue con lo que hay */ }

    /* Las tres listas que necesitan los tres campos nuevos de cada
       paso (16-sep-2026, hitos): las personas y los papeles de
       Ajustes › Hitos, y los estados de tramitación. Si algo falla al
       leerlas, los desplegables salen vacíos y el resto del cuadro
       sigue funcionando igual. */
    var opcionesResp = [];
    try {
      if (window.Hitos) {
        var datosHitos = await window.Hitos.leer();
        opcionesResp = datosHitos.ajustes.responsables.concat(window.Hitos.PAPELES);
      }
    } catch (e) { /* sin desplegable de responsable, pero se sigue */ }
    var opcionesEstado = (App.E && App.E.estados) ? App.E.estados.map(function (e) { return e.nombre; }) : [];

    var pasos = await Guias.editar(nombreTipo, pasosDe(nombreTipo), opcionesResp, opcionesEstado);
    if (pasos === null || pasos === false || pasos === undefined) return false;

    if (pasos.length) guias[nombreTipo] = pasos;
    else delete guias[nombreTipo];

    try {
      await guardar();
      pintarTabla();
      pintarGuiaNuevo();
      await window.Gestor.recargar();
      U.aviso(pasos.length
        ? 'Guía de ' + nombreTipo + ' guardada: ' + pasos.length + ' pasos.'
        : nombreTipo + ' se queda sin guía.', 'bueno');
      return true;
    } catch (e) {
      U.aviso('No he podido guardarla: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
  }

  /* Guarda una lista de pasos ya decidida, sin abrir el cuadro de
     editar (20-sep-2026, fila 79, apartado 4.4): lo usa "Ver el
     cambio", que ya ha hecho su propia pregunta (Traer el cambio /
     Dejarlo como está) y solo necesita que el resultado quede escrito.
     Se relee antes de escribir, como escribirGuia. */
  async function guardarPasos(nombreTipo, pasosNuevos) {
    try { await cargar(); } catch (e) { /* se sigue con lo que hay */ }
    if (pasosNuevos.length) guias[nombreTipo] = pasosNuevos; else delete guias[nombreTipo];
    await guardar();
    pintarTabla();
    pintarGuiaNuevo();
    await window.Gestor.recargar();
  }

  /* Lo que usa la ficha de un asunto para escribir la guía de su tipo
     sin pasar por Ajustes. Las guías viven en un solo sitio, y es este
     fichero el que las lleva: si la ficha escribiera por su cuenta, las
     dos copias se quedarían distintas. */
  window.GuiasDelCentro = {
    escribir: escribirGuia,
    pasosDe: function (tipo) { return pasosDe(tipo).slice(); },
    guardarPasos: guardarPasos
  };

  /* ---------- arranque ---------- */

  async function arrancar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    yaLeido = true;
    await cargar();
    pintarTabla();
    pintarGuiaNuevo();
    await window.Gestor.recargar();
  }

  function enganchar() {
    if (!window.Gestor) return;

    /* Al elegir el tipo en Nuevo asunto, se enseña su guía debajo. */
    var lista = $('tipos-lista');
    if (lista) {
      lista.addEventListener('click', function () {
        setTimeout(pintarGuiaNuevo, 0);
      });
    }

    window.Gestor.alRefrescar.push(function () {
      if (!yaLeido && window.Gestor.carpetaGestor()) arrancar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
