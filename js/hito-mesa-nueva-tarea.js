/* ============================================================
   hito-mesa-nueva-tarea.js — «+ Añadir tarea» del hito (13-nov-2026, fila
   638, docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md; pantalla de prueba
   docs/pantallas/630.html).

   Debajo de las tareas, el botón «+ Añadir tarea». Al pulsarlo se abre el
   formulario (el nombre y «Qué se hace»), que ya no está siempre abierto:
   «Añadir» guarda la tarea solo en este asunto (con su marca «solo aquí») y
   «Cancelar» lo cierra. Al añadirla, la tarea queda en la lista y nada más: no
   se abre ninguna ventana. Después se pulsa su botón.

   Dentro del formulario sigue la salida a la lista común de tareas (fila 531,
   js/comunes-asunto.js), que antes era el propio «+ Añadir tarea».

   Si el formulario está abierto se recuerda por hito (solo la vista, no se
   guarda en disco) para que un repintado no lo cierre. Lo llama
   js/hito-mesa-guion.js (`html`, `enganchar`).
   ============================================================ */
var HitoMesaNuevaTarea = (function () {

  var abiertos = {};   /* idHito -> true: el formulario está abierto */
  var formas = {};     /* idHito -> { accion, receta }: lo elegido en «Qué se hace», para que un repintado no lo borre */

  function consulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* Con el plan de las guías aplicado (fila 551, js/plan-guias-aplicar.js) desaparece escribir tareas libres: «+ Añadir tarea» abre la lista
     común, como antes de la fila 638, y no hay formulario. */
  function conPlan() { return document.documentElement.classList.contains('plan-guias-aplicado'); }

  /* El botón (o, abierto, el formulario). Con la lista común de tareas a mano. */
  function html(a, h) {
    if (conPlan()) {
      return '<div class="guion-comunes en-linea"><button type="button" class="boton boton-chico comunes-anadir-tarea">+ Añadir tarea</button>' +
        (window.ComunesAsunto && ComunesAsunto.hitoComunDe(a, h) ? '<button type="button" class="boton boton-chico comunes-cambiar-hito">Cambiar el hito</button>' : '') + '</div>';
    }
    if (!abiertos[h.id]) {
      return '<div class="guion-comunes en-linea">' +
        '<button type="button" class="boton boton-chico tcd-abrir-form">+ Añadir tarea</button>' +
        (window.ComunesAsunto && ComunesAsunto.hitoComunDe(a, h) ? '<button type="button" class="boton boton-chico comunes-cambiar-hito">Cambiar el hito</button>' : '') +
      '</div>';
    }
    return '<div class="tcd-nueva">' +
      '<input class="campo guion-nueva-tarea" id="guion-nueva-tarea" placeholder="Nombre de la tarea" autocomplete="off">' +
      (window.TareasConDocumentoVista ? TareasConDocumentoVista.formularioHTML(formas[h.id]) : '') +
      '<div class="tcd-botones">' +
        '<button type="button" class="boton boton-chico boton-principal tcd-anadir">Añadir</button>' +
        '<button type="button" class="boton boton-chico tcd-cancelar-form">Cancelar</button>' +
        (window.ComunesAsunto ? '<button type="button" class="enlace comunes-anadir-tarea">Elegir de la lista común de tareas</button>' : '') +
      '</div>' +
    '</div>';
  }

  /* `repintar()`: vuelve a pintar la lista de tareas de este hito. */
  function enganchar(caja, a, h, repintar) {
    var abrir = caja.querySelector('.tcd-abrir-form');
    if (abrir) {
      if (consulta()) { abrir.disabled = true; abrir.setAttribute('data-motivo-clave', 'consulta'); }
      abrir.onclick = function () {
        abiertos[h.id] = true;
        repintar();
        var campo = document.getElementById('guion-nueva-tarea');
        if (campo) campo.focus();
      };
    }
    var cont = caja.querySelector('.tcd-nueva');
    if (cont) {
      var campo = cont.querySelector('#guion-nueva-tarea');
      if (window.TareasConDocumentoVista) {
        TareasConDocumentoVista.engancharFormulario(cont, function (forma) { formas[h.id] = forma; });
      }
      var anadir = function () {
        var texto = campo.value.trim();
        if (!texto) { U.aviso('Escribe el nombre de la tarea.', 'ambar'); campo.focus(); return; }
        if (cont.dataset.guardando) return;
        cont.dataset.guardando = '1';
        var forma = window.TareasConDocumentoVista ? TareasConDocumentoVista.leerFormulario(cont) : null;
        delete formas[h.id];
        delete abiertos[h.id];
        /* La caja se vacía al guardar (antes del repintado, para que no vuelva el texto escrito). */
        DondeSeGuardaTareas.nueva(a, h, texto, function () { campo.value = ''; }, forma).then(function (ok) {
          if (!ok) { abiertos[h.id] = true; repintar(); }
        });
      };
      campo.onkeydown = function (ev) {
        if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); anadir(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrar(h.id, repintar); }
      };
      cont.querySelector('.tcd-anadir').onclick = anadir;
      cont.querySelector('.tcd-cancelar-form').onclick = function () { cerrar(h.id, repintar); };
    }
    if (window.ComunesAsunto) ComunesAsunto.enganchar(caja, a, h);
  }

  function cerrar(idHito, repintar) {
    delete abiertos[idHito];
    delete formas[idHito];
    repintar();
  }

  function estaAbierto(idHito) { return !!abiertos[idHito]; }

  return { html: html, enganchar: enganchar, estaAbierto: estaAbierto };
})();
window.HitoMesaNuevaTarea = HitoMesaNuevaTarea;
