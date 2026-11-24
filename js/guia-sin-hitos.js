/* ============================================================
   guia-sin-hitos.js — el editor de la guía de un tipo «sin hitos»
   (18-nov-2026, fila 701, docs/701-GUIA-COMO-LISTA-DE-TAREAS.md).

   La guía de un tipo con la casilla «Sin hitos» es solo una lista de frases: sin hitos, fases,
   responsables, plazos, «Qué se hace», «Dónde se hace» ni «A quién». Cada frase puede llevar «Cuándo
   se hace» (js/guias-cuando.js): «Siempre» o «Solo si» un dato de lista del asunto vale tal cosa o el
   tercero es de tal clase. Fila 703: un papel (tipo de documento). Fila 706 (docs/706-ROTULOS.md): rótulos
   (`rotulo: true`) que solo nombran el grupo de tareas de debajo. Fila 707 (docs/707-COMO-SE-HACE.md): «Cómo se
   hace» (`comoSeHace`), texto libre y opcional.

   Fila 737 (docs/737-GUIA-A-TODA-LA-PANTALLA.md): el editor ocupa toda la pantalla. A la izquierda, la guía de un
   vistazo (una línea por tarea: asa, número, frase y sus marcas; Intro crea otra debajo, borrar en una frase
   vacía la quita, el «+» del borde mete una, y se arrastran por el asa). A la derecha, la tarea elegida en grande
   (frase, papel con su recorrido, «Cuándo se hace» y «Cómo se hace»). Encima de la lista, «Ver la guía para:»
   (js/guia-sin-hitos-mapa.js). Lo escrito se guarda en `tareas` al momento; no hay nada que «recoger» de la pantalla.

   Se guarda como UN paso de la guía del tipo (`listaDeTareas: true`, sus frases en `guion`). Los demás
   pasos que el tipo tuviera (una guía con hitos de antes de marcar la casilla) se dejan como están,
   sin usarse. Lo reparte a los asuntos js/asunto-sin-hitos-guia.js.

   `GuiaSinHitos.editar(tipo, pasos, opciones)` devuelve la guía entera ya normalizada, o null si se cancela.
   `opciones.aviso`: el texto de arriba («Vale para todos los asuntos de X, no solo para este.»).
   ============================================================ */
var GuiaSinHitos = (function () {

  var G = window.Guias || Guias;

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function $(id) { return document.getElementById(id); }

  function editar(nombreTipo, pasos, opciones) {
    opciones = opciones || {};
    var todos = G.normalizar(pasos);
    var paso = todos.filter(function (p) { return p.listaDeTareas; })[0] || null;
    var resto = todos.filter(function (p) { return !p.listaDeTareas; });
    var tareas = ((paso && paso.guion) || []).filter(function (g) { return !g.pregunta; }).map(function (g) { return Object.assign({}, g); });
    var elegida = 0, arrastrada = null;
    var elegidos = {};   /* «Ver la guía para»: dato -> valor; solo para mirar, no se guarda */
    if (window.GuiasCuando) GuiasCuando.ponerTipo(nombreTipo, { conClase: true });

    var cuadro = document.querySelector('#capa .cuadro');
    var esperar = U.preguntar('Guía de ' + nombreTipo,
      (opciones.aviso ? '<p class="nota guia-aviso">' + esc(opciones.aviso) + '</p>' : '') +
      '<div class="gsh-cab"><h3 class="gsh-cab-titulo">Guía de ' + esc(nombreTipo) + '</h3>' +
        '<p class="nota gsh-cab-nota">Una frase por tarea, en el orden en que salen en el asunto. Un rótulo nombra el grupo de tareas que tiene debajo. Las que añadas aquí llegan también a los asuntos abiertos de este tipo; cambiar o borrar una frase no los toca.</p>' +
        '<div class="gsh-cab-herr"><button type="button" class="boton" id="gsh-cancelar">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="gsh-guardar">Guardar</button></div></div>' +
      '<div class="gsh-dos"><div class="gsh-izq">' +
        '<div class="gsh-ver" id="gsh-ver"></div><div id="gsh-lista" class="gsh-lista"></div>' +
        '<div class="gsh-anadir"><button type="button" class="boton" id="gsh-anadir">+ Añadir una tarea</button>' +
        '<button type="button" class="boton" id="gsh-anadir-rotulo">+ Añadir rótulo</button></div></div>' +   /* fila 706 */
      '<div class="gsh-der" id="gsh-der"></div></div>',
      'Guardar');
    if (cuadro) cuadro.classList.add('cuadro-gsh');

    function numeroDe(i) { var n = 0; for (var k = 0; k <= i; k++) if (!tareas[k].rotulo) n++; return n; }

    function marcasHTML(g) {
      if (g.rotulo) return '';
      var m = [], c = window.SoloSi ? SoloSi.normalizar(g.soloSi) : null;
      if (g.papel) m.push('<span class="gsh-marca gsh-marca-papel">📄 ' + esc(g.papel) + '</span>');
      if (c) m.push('<span class="gsh-marca gsh-marca-solo-si">' + esc(SoloSi.etiqueta(c)) + '</span>');
      if (String(g.comoSeHace || '').trim()) m.push('<span class="gsh-marca">Cómo se hace</span>');
      return m.length ? '<div class="gsh-marcas">' + m.join('') + '</div>' : '';
    }

    function pintarVer() {
      var caja = $('gsh-ver');
      if (!caja) return;
      var html = window.GuiaSinHitosMapa ? GuiaSinHitosMapa.barraHTML(tareas, elegidos) : '';
      caja.classList.toggle('oculto', !html);
      caja.innerHTML = html;
      Array.prototype.forEach.call(caja.querySelectorAll('select'), function (s) {
        s.onchange = function () { if (s.value) elegidos[s.dataset.campo] = s.value; else delete elegidos[s.dataset.campo]; pintarLista(); };
      });
    }

    function meter(pos, rotulo) {
      tareas.splice(pos, 0, rotulo ? { id: GuiasGuion.nuevoId(), texto: '', rotulo: true } : { id: GuiasGuion.nuevoId(), texto: '' });
      elegida = pos;
      pintarTodo(pos);
    }
    function mover(desde, destino) {   /* `destino`: el sitio, contando la tarea aún en su lugar */
      if (desde < 0 || desde >= tareas.length) return;
      var g = tareas.splice(desde, 1)[0];
      if (destino > desde) destino--;
      destino = Math.max(0, Math.min(tareas.length, destino));
      tareas.splice(destino, 0, g);
      elegida = destino;
      pintarTodo();
    }
    function elegir(i) {
      if (elegida === i) return;
      elegida = i;
      Array.prototype.forEach.call(document.querySelectorAll('#gsh-lista .gsh-fila'), function (f) { f.classList.toggle('elegida', +f.dataset.pos === i); });
      pintarDetalle();
    }

    function pintarLista(foco) {
      pintarVer();
      var caja = $('gsh-lista');
      if (!caja) return;
      caja.innerHTML = '';
      if (!tareas.length) caja.innerHTML = '<p class="vacio">Todavía no hay tareas. Añade la primera.</p>';
      var n = 0;
      tareas.forEach(function (g, i) {
        if (!g.rotulo) n++;
        var quitada = !g.rotulo && window.GuiaSinHitosMapa && !GuiaSinHitosMapa.sale(g, elegidos);
        var f = document.createElement('div');
        f.className = 'gsh-fila' + (g.rotulo ? ' gsh-rotulo' : '') + (i === elegida ? ' elegida' : '') + (quitada ? ' no-sale' : '');
        f.dataset.pos = i;
        f.draggable = true;
        if (quitada) f.title = 'En este caso, esta tarea no sale en el asunto';
        f.innerHTML = '<span class="gsh-asa" title="Arrastra para cambiarla de sitio" aria-hidden="true">⠿</span>' +
          '<span class="gsh-num">' + (g.rotulo ? '' : n) + '</span>' +
          '<div class="gsh-cuerpo"><input class="campo gsh-texto" value="' + esc(g.texto) + '" placeholder="' + (g.rotulo ? 'Escribe el rótulo' : 'Escribe la tarea') + '" aria-label="' + (g.rotulo ? 'Rótulo' : 'Tarea ' + n) + '">' + marcasHTML(g) + '</div>' +
          '<button type="button" class="gsh-meter" title="Meter una tarea aquí debajo" aria-label="Meter una tarea debajo">+</button>';
        var caja2 = f.querySelector('.gsh-texto');
        f.addEventListener('click', function (e) { if (!e.target.classList.contains('gsh-meter')) elegir(i); });
        caja2.addEventListener('focus', function () { elegir(i); });
        caja2.addEventListener('input', function () { g.texto = caja2.value; var d = $('gsh-d-frase'); if (d && elegida === i) d.value = caja2.value; });
        caja2.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); meter(i + 1, false); }
          else if (e.key === 'Backspace' && !caja2.value && tareas.length > 1) { e.preventDefault(); tareas.splice(i, 1); elegida = Math.max(0, i - 1); pintarTodo(elegida); }
        });
        f.querySelector('.gsh-meter').addEventListener('click', function (e) { e.stopPropagation(); meter(i + 1, false); });
        f.addEventListener('dragstart', function (e) { arrastrada = i; f.classList.add('arrastrando'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        f.addEventListener('dragend', function () { arrastrada = null; pintarLista(); });
        f.addEventListener('dragover', function (e) {
          if (arrastrada === null) return;
          e.preventDefault();
          var r = f.getBoundingClientRect(), antes = e.clientY < r.top + r.height / 2;
          f.classList.toggle('encima-antes', antes); f.classList.toggle('encima-despues', !antes);
        });
        f.addEventListener('dragleave', function () { f.classList.remove('encima-antes', 'encima-despues'); });
        f.addEventListener('drop', function (e) {
          e.preventDefault();
          if (arrastrada === null) return;
          var r = f.getBoundingClientRect(), desde = arrastrada;
          arrastrada = null;
          mover(desde, i + (e.clientY < r.top + r.height / 2 ? 0 : 1));
        });
        caja.appendChild(f);
      });
      if (foco != null) { var c = caja.querySelectorAll('.gsh-texto')[foco]; if (c) c.focus(); }
    }

    /* La tarea elegida, en grande. Lo escrito aquí se apunta en `g` al momento y se repinta solo lo que cambia a la izquierda. */
    function pintarDetalle() {
      var caja = $('gsh-der'), g = tareas[elegida];
      if (!caja) return;
      if (!g) { caja.innerHTML = '<p class="vacio">Elige una tarea de la lista para verla entera.</p>'; return; }
      var rot = !!g.rotulo;
      caja.innerHTML = '<h4 class="gsh-der-titulo">' + (rot ? 'Rótulo' : 'Tarea ' + numeroDe(elegida)) + '</h4>' +
        '<div class="gsh-grupo"><label class="etiqueta" for="gsh-d-frase">' + (rot ? 'Rótulo' : 'Frase') + '</label><input class="campo" id="gsh-d-frase" value="' + esc(g.texto) + '"></div>' +
        (rot ? '' : '<div class="gsh-dos-grupos"><div class="gsh-grupo"><label class="etiqueta">Papel</label>' +
          (window.TareaPapelPintar ? TareaPapelPintar.selectorHTML('gsh-papel', g.papel, 'Papel de la tarea ' + numeroDe(elegida)) : '') +
          '<div id="gsh-recorrido"></div></div><div class="gsh-grupo" id="gsh-cuando-sitio"></div></div>' +
          '<div class="gsh-grupo"><label class="etiqueta" for="gsh-d-como">Cómo se hace <span class="gsh-opcional">(opcional)</span></label>' +   /* fila 707 */
          '<textarea class="campo gsh-como" id="gsh-d-como" placeholder="Explicación, pasos, ruta de Séneca o normativa">' + esc(g.comoSeHace) + '</textarea></div>') +
        '<div class="gsh-mandos"><button type="button" class="boton" id="gsh-subir"' + (elegida === 0 ? ' disabled' : '') + '>↑ Subir</button>' +
        '<button type="button" class="boton" id="gsh-bajar"' + (elegida === tareas.length - 1 ? ' disabled' : '') + '>↓ Bajar</button>' +
        '<button type="button" class="boton boton-peligro" id="gsh-quitar">' + (rot ? 'Quitar este rótulo' : 'Quitar esta tarea') + '</button></div>';
      var pos = elegida;
      $('gsh-d-frase').oninput = function () {
        g.texto = this.value;
        var c = document.querySelectorAll('#gsh-lista .gsh-texto')[pos];
        if (c) c.value = this.value;
      };
      if (!rot) {
        var papel = caja.querySelector('.gsh-papel');
        var pintarRecorrido = function () { $('gsh-recorrido').innerHTML = window.GuiaSinHitosMapa ? GuiaSinHitosMapa.recorridoHTML(g.papel) : ''; };
        pintarRecorrido();
        if (papel) papel.onchange = function () { if (papel.value) g.papel = papel.value; else delete g.papel; pintarRecorrido(); pintarLista(); };
        if (window.GuiasCuando) {
          var bloque = null;
          var alCambiarCuando = function () { if (bloque) { g.soloSi = GuiasCuando.leer(bloque); pintarLista(); } };
          bloque = GuiasCuando.bloque(g.soloSi, 'gsh-cuando', alCambiarCuando);
          $('gsh-cuando-sitio').appendChild(bloque);
          bloque.addEventListener('change', alCambiarCuando);
        }
        $('gsh-d-como').oninput = function () { var tenia = !!String(g.comoSeHace || '').trim(); g.comoSeHace = this.value; if (tenia !== !!this.value.trim()) pintarLista(); };
      }
      $('gsh-subir').onclick = function () { mover(pos, pos - 1); };
      $('gsh-bajar').onclick = function () { mover(pos, pos + 2); };
      $('gsh-quitar').onclick = function () { tareas.splice(pos, 1); elegida = Math.max(0, Math.min(pos, tareas.length - 1)); pintarTodo(); };
    }

    function pintarTodo(foco) { pintarLista(foco); pintarDetalle(); }

    /* Lo que se guarda: cada tarea con lo suyo (un rótulo solo lleva su texto). */
    function limpias() {
      tareas.forEach(function (g) {
        g.texto = String(g.texto || '').trim();
        if (g.rotulo) { delete g.papel; delete g.comoSeHace; delete g.soloSi; return; }
        var como = String(g.comoSeHace || '').trim();
        if (como) g.comoSeHace = como; else delete g.comoSeHace;
        var si = window.SoloSi ? SoloSi.normalizar(g.soloSi) : null;
        if (si) g.soloSi = si; else delete g.soloSi;
        if (!g.papel) delete g.papel;
      });
    }

    $('gsh-anadir').onclick = function () { meter(tareas.length, false); };
    $('gsh-anadir-rotulo').onclick = function () { meter(tareas.length, true); };   /* fila 706 */
    $('gsh-cancelar').onclick = function () { $('cuadro-cancelar').click(); };
    $('gsh-guardar').onclick = function () { $('cuadro-aceptar').click(); };
    pintarTodo();

    return esperar.then(function (ok) {
      if (cuadro) cuadro.classList.remove('cuadro-gsh');
      if (!ok) return null;
      limpias();
      var guion = GuiasGuion.normalizar(tareas);   /* sin frase, la tarea no se guarda */
      if (!guion.length) return resto;
      var nuevo = paso ? Object.assign({}, paso, { guion: guion }) : { id: G.nuevoId(), titulo: 'Tareas', cuerpo: '', opciones: [], listaDeTareas: true, guion: guion };
      return G.normalizar(resto.concat([nuevo]));
    });
  }

  return { editar: editar };
})();
window.GuiaSinHitos = GuiaSinHitos;
