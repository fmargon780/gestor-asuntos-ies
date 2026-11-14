/* ============================================================
   datos-de-la-tarea.js — los datos de una tarea en la mesa del hito (fila
   530, docs/530-DATOS-EN-EL-ASUNTO.md, puntos 3, 4, 8 y 9; pantalla
   docs/pantallas/518.html, «En un asunto»).

   Bajo una tarea pendiente de generar o de comunicar con plantilla sale la
   lista de datos de esa plantilla: los que existen, con su valor, y los que
   faltan, para escribir ahí mismo (js/datos-del-asunto-vista.js). Dice
   cuántos faltan; se puede seguir sin ellos y lo que falte sale en
   amarillo. Lo escrito se guarda en el asunto al momento.

   La tarea «Pedir datos» (`accion: 'pedir'`, `receta.campos`: los campos que
   pide) enseña sus campos para rellenar, con «+ Añadir campo» (la ventana
   de elegir, js/campo-elegir-en-asunto.js), y se marca sola al tener todos
   rellenos.

   La lista de una tarea se abre y se cierra con su rótulo; la de la
   siguiente tarea nace abierta. `marcoHTML(g)` es el hueco que deja
   js/hito-mesa-guion.js bajo cada tarea y `pintar` lo rellena.
   ============================================================ */
var DatosDeLaTarea = (function () {

  var abiertas = {};
  var turnos = {};
  var pintadas = {};   /* clave → función que vuelve a pintar esa lista */

  function plantillaDe(g) { return (g.receta && g.receta.plantilla) || ''; }

  function esDePlantilla(g) {
    return !g.pregunta && !g.hecho && !g.noaplica && (g.accion === 'generar' || g.accion === 'comunicar') && !!plantillaDe(g);
  }
  function esDePedir(g) { return !g.pregunta && !g.noaplica && g.accion === 'pedir'; }

  /* El hueco bajo la tarea; vacío si la tarea no lleva datos. */
  function marcoHTML(g) {
    return (esDePlantilla(g) || esDePedir(g)) ? '<div class="dat-tarea" data-paso="' + U.escapar(g.id) + '"></div>' : '';
  }

  function porClase(g) { return g.accion === 'generar' ? 'documentos' : 'lista'; }

  /* Los datos de una tarea «Pedir datos»: cada campo con su valor en el asunto. */
  function datosDePedir(a, g, valores) {
    return ((g.receta && g.receta.campos) || []).map(function (entrada) {
      var nombre = Campos.nombreDeCampo(entrada, App.E.campos);
      var clave = Campos.claveDeCampo(entrada);
      var valor = DatosDelAsunto.valorGuardado(a, clave) || String((valores.campos || {})[nombre] || '');
      var info = DatosDelAsunto.infoDe(nombre, a, valores);
      if (!info.delAsunto) { info.clave = clave; info.clase = Campos.claseDeCampo(entrada, App.E.campos); }
      return { nombre: nombre, valor: valor, falta: !valor.trim(), info: info };
    });
  }

  function cabeza(abierto, texto) {
    return '<button type="button" class="enlace dat-cabeza" aria-expanded="' + (abierto ? 'true' : 'false') + '">' + (abierto ? '▾ ' : '▸ ') + U.escapar(texto) + '</button>';
  }

  async function datosDe(a, h, g) {
    if (esDePedir(g)) {
      var valores = await Plantillas.valoresDeAsunto(a, { hito: h, conLoQueFalta: false });
      return { datos: datosDePedir(a, g, valores), titulo: g.texto || 'Pedir datos' };
    }
    var datos = null;
    try { datos = await Plantillas.cargarReciente(App.E.gestor); } catch (e) { datos = Plantillas.enMemoria(); }
    var clase = porClase(g);
    var p = ((datos && datos[clase]) || []).filter(function (x) { return x.id === plantillaDe(g); })[0];
    if (!p) return null;
    var via = window.Sitios ? Sitios.canalDeTarea(g) : (g.receta && g.receta.via);   /* fila 659 */
    var r = await DatosDePlantilla.datosDeLaPlantilla(a, p, clase, h, via);
    return { datos: r.datos, titulo: 'Plantilla «' + p.nombre + '»' };
  }

  async function pintarUno(el, a, h, g, siguiente, abierto, alRepintar) {
    var clave = a.nombre + '|' + h.id + '|' + g.id;
    var turno = turnos[clave] = (turnos[clave] || 0) + 1;
    pintadas[clave] = { el: el, de: function () { return pintarUno(el, a, h, g, siguiente, abierto, alRepintar); } };
    var open = clave in abiertas ? abiertas[clave] : !!(siguiente && siguiente.id === g.id);
    function conmutar() { abiertas[clave] = !open; pintarUno(el, a, h, g, siguiente, abierto, alRepintar); }
    if (!open) { el.innerHTML = cabeza(false, 'Ver los datos'); el.querySelector('.dat-cabeza').onclick = conmutar; return; }
    var r = null;
    try { r = await datosDe(a, h, g); }
    catch (e) { U.accesorio('No he podido leer los datos de la tarea', e); }
    if (turno !== turnos[clave] || !el.isConnected) return;
    if (!r) { el.innerHTML = ''; return; }
    var editable = !!abierto && !(window.SoloConsulta && SoloConsulta.activo());
    var faltan = r.datos.filter(function (d) { return d.falta; }).length;
    var html = cabeza(true, 'Datos') + DatosDelAsuntoVista.html(a, r.datos, { titulo: r.titulo, prefijo: 'dat-' + g.id, soloLectura: !editable, pedirAntes: esDePlantilla(g) });
    if (esDePedir(g)) {
      if (!r.datos.length) html = cabeza(true, 'Datos') + '<p class="vacio pequeno dat-vacio">Sin campos todavía.</p>';
      if (editable) html += '<div class="dat-anadir"><button type="button" class="boton boton-chico dat-anadir-campo">+ Añadir campo</button></div>';
    } else if (faltan) html += '<p class="pequeno suave dat-sigue">Si sigues, lo que falta sale en amarillo.</p>';
    U.conservandoLoEscrito(el, function () { el.innerHTML = html; });
    el.querySelector('.dat-cabeza').onclick = conmutar;
    var raiz = el.querySelector('.dap');
    if (raiz) DatosDelAsuntoVista.enganchar(raiz, a, r.datos, { alCambiar: function () { despuesDeCambiar(el, a, h, g, siguiente, abierto, alRepintar); } });
    var anadir = el.querySelector('.dat-anadir-campo');
    if (anadir) anadir.onclick = function () { anadirCampo(a, h, g, alRepintar); };
  }

  /* Tras escribir un dato: se vuelve a pintar la lista y una tarea «Pedir datos» completa se marca sola. */
  async function despuesDeCambiar(el, a, h, g, siguiente, abierto, alRepintar) {
    if (esDePedir(g) && !g.hecho) {
      try {
        var valores = await Plantillas.valoresDeAsunto(a, { hito: h, conLoQueFalta: false });
        var d = datosDePedir(a, g, valores);
        if (d.length && !d.some(function (x) { return x.falta; })) {
          await Hitos.marcarGuion(a.nombre, h.id, g.id, { hecho: true });
          if (window.HitosPanel) HitosPanel.programarRepintado();
          return;
        }
      } catch (e) { U.accesorio('Guardado, pero no he podido marcar la tarea', e); }
    }
    pintarUno(el, a, h, g, siguiente, abierto, alRepintar);
  }

  /* «+ Añadir campo» de una tarea «Pedir datos»: el campo pasa a su receta (en la guía, o solo en este asunto si la tarea es de aquí). */
  function anadirCampo(a, h, g, alRepintar) {
    CamposElegir.abrir({
      tipo: DatosDelAsunto.tipoDe(a), soloGuardables: true,
      alElegir: async function (campo) {
        try {
          var entrada = await DatosDelAsunto.entradaDeCampoDeLista(campo, a);
          var clave = Campos.claveDeCampo(entrada);
          var actuales = (g.receta && g.receta.campos) || [];
          if (actuales.some(function (c) { return Campos.claveDeCampo(c) === clave; })) { U.aviso('«' + campo.nombre + '» ya está en esta tarea.', 'ambar'); return; }
          await DondeSeGuardaTareas.cambiar(a, h, g, g.texto, { accion: 'pedir', receta: { campos: actuales.concat([entrada]) } });
        } catch (e) { U.fallo('No he podido añadir el campo a la tarea', e); }
      }
    });
  }

  /* Todas las listas de datos que están a la vista se vuelven a pintar (tras guardar un dato en cualquier sitio). */
  function repintarTodas() {
    Object.keys(pintadas).forEach(function (k) {
      var x = pintadas[k];
      if (!x.el.isConnected) { delete pintadas[k]; return; }
      x.de();
    });
  }

  /* Rellena los huecos de `caja` (la lista de tareas de un hito). `guion`: Hitos.guionDe; `siguiente`: la primera sin hacer. */
  function pintar(caja, a, h, guion, siguiente, abierto, alRepintar) {
    var porId = {};
    guion.forEach(function (g) { porId[g.id] = g; });
    Array.prototype.forEach.call(caja.querySelectorAll('.dat-tarea'), function (el) {
      var g = porId[el.dataset.paso];
      if (g) pintarUno(el, a, h, g, siguiente, abierto, alRepintar);
    });
  }

  /* Fila 638: el botón «Rellenar» de una tarea «Pedir datos»: abre su lista de datos y pone el cursor en el primer dato que falta. */
  async function abrir(a, h, g, fila) {
    var clave = a.nombre + '|' + h.id + '|' + g.id;
    abiertas[clave] = true;
    var p = pintadas[clave];
    if (p && p.el.isConnected) await p.de();
    var el = (fila || document).querySelector('.dat-tarea[data-paso="' + g.id + '"]');
    var vacio = el && Array.prototype.filter.call(el.querySelectorAll('input.campo, select.campo, textarea.campo'), function (c) { return !c.value; })[0];
    var campo = vacio || (el && el.querySelector('input.campo, select.campo, textarea.campo'));
    if (campo) campo.focus();
    else if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  return { abrir: abrir, repintarTodas: repintarTodas, marcoHTML: marcoHTML, pintar: pintar, esDePlantilla: esDePlantilla, esDePedir: esDePedir, datosDePedir: datosDePedir };
})();
window.DatosDeLaTarea = DatosDeLaTarea;
