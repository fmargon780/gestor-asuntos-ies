/* ============================================================
   guia-sin-hitos.js — el editor de la guía de un tipo «sin hitos»
   (18-nov-2026, fila 701, docs/701-GUIA-COMO-LISTA-DE-TAREAS.md; pantalla de prueba
   docs/pantallas/692.html).

   La guía de un tipo con la casilla «Sin hitos» es solo una lista de frases: sin hitos, fases,
   responsables, plazos, «Qué se hace», «Dónde se hace» ni «A quién». Cada frase puede llevar «Cuándo
   se hace» (js/guias-cuando.js): «Siempre» o «Solo si» un dato de lista del asunto vale tal cosa o el
   tercero es de tal clase.

   Fila 707 (docs/707-COMO-SE-HACE.md): cada tarea puede llevar «Cómo se hace», un texto libre de varias líneas
   (`comoSeHace`), opcional; el asunto lo enseña desplegable junto a la tarea (js/asunto-sin-hitos.js).

   Se guarda como UN paso de la guía del tipo (`listaDeTareas: true`, sus frases en `guion`). Los demás
   pasos que el tipo tuviera (una guía con hitos de antes de marcar la casilla) se dejan como están,
   sin usarse. Lo reparte a los asuntos js/asunto-sin-hitos-guia.js.

   `GuiaSinHitos.editar(tipo, pasos, opciones)` devuelve la guía entera ya normalizada, o null si se cancela.
   `opciones.aviso`: el texto de arriba («Vale para todos los asuntos de X, no solo para este.»).
   ============================================================ */
var GuiaSinHitos = (function () {

  var G = window.Guias || Guias;

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function editar(nombreTipo, pasos, opciones) {
    opciones = opciones || {};
    var todos = G.normalizar(pasos);
    var paso = todos.filter(function (p) { return p.listaDeTareas; })[0] || null;
    var resto = todos.filter(function (p) { return !p.listaDeTareas; });
    var tareas = ((paso && paso.guion) || []).filter(function (g) { return !g.pregunta; }).map(function (g) { return Object.assign({}, g); });
    if (window.GuiasCuando) GuiasCuando.ponerTipo(nombreTipo, { conClase: true });

    var esperar = U.preguntar('Guía de ' + nombreTipo,
      (opciones.aviso ? '<p class="nota guia-aviso">' + esc(opciones.aviso) + '</p>' : '') +
      '<p class="nota">Una frase por tarea, en el orden en que salen en el asunto. Las que añadas aquí llegan también a los asuntos abiertos de este tipo; cambiar o borrar una frase no los toca.</p>' +
      '<div id="gsh-lista" class="gsh-lista"></div>' +
      '<button type="button" class="boton boton-ancho" id="gsh-anadir">+ Añadir una tarea</button>',
      'Guardar');

    function $(id) { return document.getElementById(id); }

    /* Lo escrito ahora en pantalla, de vuelta en `tareas`. */
    function recoger() {
      Array.prototype.forEach.call(document.querySelectorAll('#gsh-lista .gsh-fila'), function (fila) {
        var g = tareas[parseInt(fila.dataset.pos, 10)];
        if (!g) return;
        g.texto = fila.querySelector('.gsh-texto').value.trim();
        var como = fila.querySelector('.gsh-como').value.trim();   /* fila 707 */
        if (como) g.comoSeHace = como; else delete g.comoSeHace;
        var si = window.GuiasCuando && window.SoloSi ? SoloSi.normalizar(GuiasCuando.leer(fila)) : null;
        if (si) g.soloSi = si; else delete g.soloSi;
        var papel = fila.querySelector('.gsh-papel');   /* fila 703 */
        if (papel && papel.value) g.papel = papel.value; else delete g.papel;
      });
    }

    function pintar() {
      var caja = $('gsh-lista');
      if (!caja) return;
      caja.innerHTML = '';
      if (!tareas.length) caja.innerHTML = '<p class="vacio">Todavía no hay tareas. Añade la primera.</p>';
      tareas.forEach(function (g, i) {
        var fila = document.createElement('div');
        fila.className = 'gsh-fila';
        fila.dataset.pos = i;
        fila.innerHTML = '<div class="gsh-linea"><span class="gsh-num">' + (i + 1) + '</span>' +
          '<input class="campo gsh-texto" value="' + esc(g.texto) + '" placeholder="Escribe la tarea" aria-label="Tarea ' + (i + 1) + '">' +
          (window.TareaPapelPintar ? TareaPapelPintar.selectorHTML('gsh-papel', g.papel, 'Papel de la tarea ' + (i + 1)) : '') +
          '<span class="gsh-mandos"></span></div>' +
          '<textarea class="campo gsh-como" rows="2" placeholder="Cómo se hace (opcional): explicación, pasos, ruta de Séneca o normativa" aria-label="Cómo se hace la tarea ' + (i + 1) + '">' + esc(g.comoSeHace) + '</textarea>';
        var mandos = fila.querySelector('.gsh-mandos');
        function boton(texto, titulo, hacer, clase, apagado) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'boton' + (clase ? ' ' + clase : ''); b.textContent = texto; b.title = titulo;
          b.disabled = !!apagado;
          b.onclick = hacer;
          mandos.appendChild(b);
        }
        boton('↑', 'Subir esta tarea', function () { recoger(); var x = tareas[i - 1]; tareas[i - 1] = tareas[i]; tareas[i] = x; pintar(); }, '', i === 0);
        boton('↓', 'Bajar esta tarea', function () { recoger(); var x = tareas[i + 1]; tareas[i + 1] = tareas[i]; tareas[i] = x; pintar(); }, '', i === tareas.length - 1);
        boton('Quitar', 'Quitar esta tarea', function () { recoger(); tareas.splice(i, 1); pintar(); }, 'boton-peligro');
        if (window.GuiasCuando) fila.appendChild(GuiasCuando.bloque(g.soloSi, 'gsh-cuando'));
        caja.appendChild(fila);
      });
    }

    $('gsh-anadir').onclick = function () {
      recoger();
      tareas.push({ id: GuiasGuion.nuevoId(), texto: '' });
      pintar();
      var cajas = document.querySelectorAll('#gsh-lista .gsh-texto');
      if (cajas.length) cajas[cajas.length - 1].focus();
    };
    pintar();

    return esperar.then(function (ok) {
      if (!ok) return null;
      recoger();
      var guion = GuiasGuion.normalizar(tareas);   /* sin frase, la tarea no se guarda */
      if (!guion.length) return resto;
      var nuevo = paso ? Object.assign({}, paso, { guion: guion }) : { id: G.nuevoId(), titulo: 'Tareas', cuerpo: '', opciones: [], listaDeTareas: true, guion: guion };
      return G.normalizar(resto.concat([nuevo]));
    });
  }

  return { editar: editar };
})();
window.GuiaSinHitos = GuiaSinHitos;
