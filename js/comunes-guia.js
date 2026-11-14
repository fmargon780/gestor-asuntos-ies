/* ============================================================
   comunes-guia.js — las listas comunes dentro del editor de la guía
   (fila 531, docs/531-TAREAS-E-HITOS-COMUNES.md, puntos 4, 5 y 7).

   - «+ Añadir un hito de la lista» (junto a «+ Añadir un hito») y «+ Añadir
     una tarea de la lista» (debajo de las tareas de cada hito): abren la
     ventana de la lista común (js/comunes-ventana.js). Lo elegido (o creado
     ahí) entra en la guía con su marca de común y su retrato.
   - «Cambiar la tarea» / «Cambiar el hito»: js/comunes-cambiar.js. Como el
     editor tiene la guía de este tipo en memoria, el cambio también se hace
     ahí (y el propio «Guardar» del editor la guarda).
   - Las guías de antes siguen igual: «+ Añadir un hito» y «+ Añadir una tarea»
     (en blanco) siguen donde estaban hasta que se pasen las guías actuales
     a las listas (fila 532).

   Lo llama js/guias-editor-abrir.js al abrir el editor, con
   `ctx = { nombreTipo, plegado, pintar, recoger, pasos, nivel() }`.
   ============================================================ */
var ComunesGuia = (function () {

  /* Una tarea sigue siendo de la lista mientras no se le cambie su texto, lo que hace ni su plantilla. */
  function sigueIgual(g) {
    var t = Comunes.buscar(ComunesGuardado.enMemoria().tareas, g.comun);
    if (!t) return true;
    return Comunes.textoIgual(g, t);
  }

  function alAbrir(ctx) {
    var col = document.getElementById('guia-col-der'), izq = document.getElementById('guia-anadir');
    if (izq && !document.getElementById('guia-anadir-comun')) {
      izq.insertAdjacentHTML('afterend', '<button type="button" class="boton boton-ancho" id="guia-anadir-comun">+ Añadir un hito de la lista</button>');
    }
    ComunesGuardado.leer().catch(function () { /* sin lista, las tareas siguen como están */ });

    var anadirHito = document.getElementById('guia-anadir-comun');
    if (anadirHito) anadirHito.onclick = function () {
      ComunesVentana.abrir({
        clase: 'hito', titulo: 'Hitos de la lista', tipo: ctx.nombreTipo,
        alElegir: async function (hc) {
          try {
            var listas = await ComunesGuardado.leer();
            ctx.recoger();
            var paso = Comunes.pasoDeHito(hc, listas.tareas);
            ctx.nivel().push(paso);
            ctx.plegado.abrir(paso.id);
            ctx.pintar();
            ctx.plegado.alTitulo(paso.id);
          } catch (e) { U.fallo('No he podido añadir el hito', e); }
        }
      });
    };

    if (!col) return;
    col.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.comunes-anadir-tarea-guia, .comunes-cambiar-tarea, .comunes-cambiar-hito');
      if (!b) return;
      ev.preventDefault();
      var caja = b.closest('#guia-pasos > *');
      var i = caja ? parseInt(caja.dataset.pos, 10) : NaN;
      if (b.classList.contains('comunes-anadir-tarea-guia')) {
        if (isNaN(i)) return;
        ComunesVentana.abrir({
          clase: 'tarea', titulo: 'Tareas de la lista', tipo: ctx.nombreTipo,
          alElegir: function (t) {
            ctx.recoger();
            var paso = ctx.nivel()[i];
            if (!paso) return;
            var linea = Comunes.lineaDeTarea(t);
            paso.guion = (paso.guion || []).concat([linea]);
            if (window.GuiasGuion) GuiasGuion.abrirTarea(linea.id);
            ctx.pintar();
          }
        });
      } else if (b.classList.contains('comunes-cambiar-tarea')) {
        cambiar('tarea', b.getAttribute('data-comun'), ctx);
      } else {
        cambiar('hito', b.getAttribute('data-comun'), ctx);
      }
    });
  }

  async function cambiar(clase, id, ctx) {
    try {
      ctx.recoger();
      var listas = await ComunesGuardado.leer();
      var x = Comunes.buscar(clase === 'tarea' ? listas.tareas : listas.hitos, id);
      if (!x) { U.aviso('Ya no está en la lista.', 'ambar'); return; }
      var alCambiar = function (nueva) {
        var raiz = {};
        raiz[ctx.nombreTipo] = ctx.pasos;
        if (clase === 'tarea') Comunes.recorrerGuias(raiz, null, function (g) { if (g.comun === nueva.id) Comunes.aplicarATarea(g, nueva); });
        else Comunes.recorrerGuias(raiz, function (p) { if (p.comun === nueva.id) { p.titulo = nueva.nombre; p.cuerpo = Guias.limpiar(nueva.explicacion); } });
        ctx.pintar();
      };
      if (clase === 'tarea') ComunesCambiar.tarea(x, { alCambiar: alCambiar });
      else ComunesCambiar.hito(x, { alCambiar: alCambiar });
    } catch (e) { U.fallo('No he podido leer la lista', e); }
  }

  return { alAbrir: alAbrir, sigueIgual: sigueIgual };
})();
window.ComunesGuia = ComunesGuia;
