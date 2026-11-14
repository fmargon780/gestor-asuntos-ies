/* ============================================================
   hito-mesa-nueva-tarea.js — «+ Añadir tarea» del hito (13-nov-2026, fila
   638, docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md; fila 660,
   docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md; pantalla de prueba
   docs/pantallas/650.html).

   Debajo de las tareas, el botón «+ Añadir tarea». Al pulsarlo se abre el formulario
   de js/anadir-tarea.js: «Qué se hace» (se busca escribiendo, también por el sitio),
   «sobre qué», «Dónde se hace», las tareas comunes que ya hacen lo mismo («Añadir esta»)
   y el nombre, que propone la app. Fila 660: lo que se añade va a la guía del tipo o solo a
   este asunto según la marca «Los cambios en hitos y tareas van también a la guía»
   (js/marca-guia.js); el pie del formulario lo dice. Ya no hay «Elegir de la lista común de
   tareas» ni «Solo para este asunto».

   Si el formulario está abierto se recuerda por hito (solo la vista, no se guarda en disco)
   para que un repintado no lo cierre. Lo llama js/hito-mesa-guion.js (`html`, `enganchar`).
   ============================================================ */
var HitoMesaNuevaTarea = (function () {

  var abiertos = {};   /* idHito -> true: el formulario está abierto */
  var formas = {};     /* idHito -> lo elegido hasta ahora, para que un repintado no lo borre */

  function consulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* El botón (o, abierto, el hueco donde se monta el formulario). */
  function html(a, h) {
    if (!abiertos[h.id]) {
      return '<div class="guion-comunes en-linea">' +
        '<button type="button" class="boton boton-chico tcd-abrir-form">+ Añadir tarea</button>' +
        (window.ComunesAsunto && ComunesAsunto.hitoComunDe(a, h) ? '<button type="button" class="boton boton-chico comunes-cambiar-hito">Cambiar el hito</button>' : '') +
      '</div>';
    }
    return '<div class="tcd-nueva"><div class="at-hueco"></div>' +
      '<p class="suave tcd-alcance">' + U.escapar(window.MarcaGuia ? MarcaGuia.alcance(a) : '') + '</p></div>';
  }

  /* Una tarea de la lista común entra en este hito. */
  function usar(a, h, t) {
    delete formas[h.id]; delete abiertos[h.id];
    return DondeSeGuardaTareas.nueva(a, h, t.nombre, null, {
      accion: t.accion || '', receta: t.receta || null, donde: Sitios.dondeDe(t) || undefined, tipoDocumento: t.tipoDocumento, aQuien: t.aQuien,
      explicacion: t.explicacion, normativa: t.normativa, reunir: t.reunir, obligatorio: t.obligatorio, comun: t.id
    });
  }

  /* Una tarea nueva: con la marca encendida entra también en la lista común, para que la encuentren otras guías. */
  async function crear(a, h, r) {
    var extras = { accion: r.accion, receta: r.receta, donde: r.donde || undefined, tipoDocumento: r.tipoDocumento, aQuien: r.aQuien };
    delete formas[h.id]; delete abiertos[h.id];
    if (window.MarcaGuia && MarcaGuia.enGuia(a) && window.ComunesGuardado) {
      try { extras.comun = (await ComunesGuardado.anadir('tareas', Object.assign({ nombre: r.nombre }, extras))).id; }
      catch (e) { /* ya hay una común con ese nombre: la tarea entra en la guía sin la marca de común */ }
    }
    return DondeSeGuardaTareas.nueva(a, h, r.nombre, null, extras);
  }

  function cerrar(idHito, repintar) {
    delete abiertos[idHito];
    delete formas[idHito];
    repintar();
  }

  /* `repintar()`: vuelve a pintar la lista de tareas de este hito. */
  function enganchar(caja, a, h, repintar) {
    var abrir = caja.querySelector('.tcd-abrir-form');
    if (abrir) {
      if (consulta()) { abrir.disabled = true; abrir.setAttribute('data-motivo-clave', 'consulta'); }
      abrir.onclick = async function () {
        try { await ComunesGuardado.leer(); } catch (e) { /* sin la lista, sin sus tareas */ }   /* para montar el formulario sin esperas */
        abiertos[h.id] = true;
        repintar();
        var q = document.querySelector('.tcd-nueva .at-que');
        if (q) q.focus();
      };
    }
    var hueco = caja.querySelector('.tcd-nueva .at-hueco');
    if (hueco) {
      AnadirTarea.montar(hueco, {
        modo: 'nueva', botones: true, comunes: ComunesGuardado.enMemoria().tareas, inicial: formas[h.id],
        alCambiar: function (res) { formas[h.id] = res; },
        alUsar: function (t) { usar(a, h, t).then(function (ok) { if (!ok) { abiertos[h.id] = true; repintar(); } }); },
        alAnadir: function (res) { crear(a, h, res).then(function (ok) { if (!ok) { abiertos[h.id] = true; repintar(); } }); },
        alCancelar: function () { cerrar(h.id, repintar); }
      });
    }
    if (window.ComunesAsunto) ComunesAsunto.enganchar(caja, a, h);
  }

  function estaAbierto(idHito) { return !!abiertos[idHito]; }

  return { html: html, enganchar: enganchar, estaAbierto: estaAbierto };
})();
window.HitoMesaNuevaTarea = HitoMesaNuevaTarea;
