/* ============================================================
   llamadas-ventana.js — la ventana «Apuntar llamada» y «Corregir llamada» (13-nov-2026, fila 639,
   docs/639-LLAMAR-POR-TELEFONO.md; pantalla de prueba docs/pantallas/565.html).

   Arriba, «He llamado yo» / «Me han llamado»; «A quién» (o «Quién ha llamado») con las personas del asunto y sus
   teléfonos (js/llamadas-personas.js), cada uno con su botón de copiar, y la casilla «Otra persona o número» (escribir en
   ella suelta a la persona elegida); «Qué ha pasado» (solo si he llamado yo); «¿Es de una tarea?» (solo desde la cabecera
   del asunto: «No, de ninguna» y los hitos en negrita; al pulsar un hito salen sus tareas); «Comentario»; abajo, el día y
   la hora (se pueden cambiar) y quien la apunta. La app no marca el número: solo lo enseña y lo copia.

   `Llamadas.abrir(a, o)` → Promise de { r, tarea } (r: lo que `Llamadas.apuntar` espera) o null si se cancela.
   o: { tarea: { h, g } | null (desde el botón de una tarea), cabecera: true (desde la cabecera del asunto),
        corregir: { llamada, cuando } (rellena todo y no pregunta la tarea) }.
   ============================================================ */
(function () {
  if (typeof window.Llamadas === 'undefined') return;

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }

  /* Los hitos con tareas para «¿Es de una tarea?»: el actual el primero. */
  async function hitosParaElegir(a) {
    var datos = await Hitos.leer();
    var e = datos.porAsunto[a.nombre];
    var hitos = e ? e.hitos : [];
    var idActual = window.EstadoHito && EstadoHito.idActual ? EstadoHito.idActual(hitos, datos.ajustes) : null;
    var lista = hitos.filter(function (h) { return h && h.estado !== 'noaplica' && h.clase !== 'decision'; }).map(function (h) {
      return { h: h, actual: h.id === idActual, tareas: Hitos.guionDe(a, h).filter(function (g) { return !g.pregunta; }) };
    });
    if (!lista.some(function (x) { return x.tareas.length; })) return [];   /* sin tareas en ningún hito, la pregunta no sale */
    return lista.filter(function (x) { return x.actual; }).concat(lista.filter(function (x) { return !x.actual; }));
  }

  function conDe(p) { return p.nombre + (p.papel ? ' (' + p.papel + ')' : '') + ' · ' + p.telefono; }

  window.Llamadas.abrir = async function (a, o) {
    o = o || {};
    var corr = o.corregir ? o.corregir.llamada : null;
    var S = { sentido: corr ? corr.sentido : (o.cabecera ? 'recibida' : 'emitida'), persona: -1, res: corr && corr.sentido === 'emitida' ? corr.resultado : '',
      sel: '', lista: false, hAb: '', tarea: o.tarea || null };
    var personas = [];
    try { personas = await LlamadasPersonas.personasDe(a); } catch (e) { personas = []; }
    var hitos = [];
    if (o.cabecera) { try { hitos = await hitosParaElegir(a); } catch (e2) { hitos = []; } }
    if (!corr && S.tarea && S.tarea.g && S.tarea.g.aQuien && LlamadasPersonas.proponerA) S.persona = LlamadasPersonas.proponerA(personas, S.tarea.g.aQuien);   /* fila 659: «A quién» de la tarea */
    var ini = Llamadas.camposDe(corr ? o.corregir.cuando : new Date().toISOString());
    var otra = '';
    if (corr) {
      var coincide = personas.map(function (p, i) { return p.copia && p.copia === LlamadasPersonas.digitos(corr.telefono) && p.nombre === corr.persona ? i : -1; }).filter(function (i) { return i !== -1; })[0];
      if (coincide !== undefined) S.persona = coincide; else otra = corr.con || '';
    }

    return new Promise(function (resolver) {
      var previo = document.activeElement;
      var capa = document.createElement('div');
      capa.className = 'capa ll-capa';
      var titulo = corr ? 'Corregir llamada' : 'Apuntar llamada' + (S.tarea ? ' · ' + S.tarea.g.texto : '');
      capa.innerHTML = '<div class="cuadro ll-cuadro" role="dialog" aria-modal="true" aria-labelledby="ll-titulo">' +
        '<h3 id="ll-titulo">' + esc(titulo) + '</h3>' +
        '<div class="ll-cuerpo">' +
          '<div class="ll-dos" id="ll-sentido"><label><input type="radio" name="ll-sentido" value="emitida"> He llamado yo</label>' +
            '<label><input type="radio" name="ll-sentido" value="recibida"> Me han llamado</label></div>' +
          '<div class="ll-rotulo" id="ll-rot-quien">A quién</div><div id="ll-personas"></div>' +
          '<input type="text" class="campo" id="ll-otra" placeholder="Otra persona o número" aria-label="Otra persona o número" autocomplete="off">' +
          '<div id="ll-bloque-res"><div class="ll-rotulo">Qué ha pasado</div><div class="ll-dos" id="ll-res">' +
            '<label><input type="radio" name="ll-res" value="si"> He hablado</label><label><input type="radio" name="ll-res" value="no"> No contesta</label></div></div>' +
          '<div id="ll-bloque-tarea"' + (o.cabecera && hitos.length ? '' : ' hidden') + '><div class="ll-rotulo">¿Es de una tarea?</div>' +
            '<button type="button" class="boton ll-tarea" id="ll-tarea" aria-label="¿Es de una tarea?" aria-expanded="false"></button><div id="ll-tarea-lista" class="ll-tarea-lista" hidden></div></div>' +
          '<div class="ll-rotulo">Comentario</div><textarea class="campo" id="ll-com" rows="3" placeholder="Qué se ha dicho, o nada"></textarea>' +
          '<p class="ll-falta" id="ll-falta" role="alert" hidden></p>' +
        '</div>' +
        '<div class="cuadro-botones ll-pie"><span class="ll-cuando"><input type="date" class="campo" id="ll-dia" aria-label="Día de la llamada">' +
          '<input type="time" class="campo" id="ll-hora" aria-label="Hora de la llamada"><small id="ll-quien"></small></span>' +
          '<button type="button" class="boton" id="ll-no">Cancelar</button>' +
          '<button type="button" class="boton boton-principal" id="ll-ok">' + (corr ? 'Guardar' : 'Apuntar') + '</button></div></div>';
      document.body.appendChild(capa);
      function $(id) { return capa.querySelector('#' + id); }
      $('ll-otra').value = otra;
      $('ll-com').value = corr ? corr.comentario || '' : '';
      $('ll-dia').value = ini.dia;
      $('ll-hora').value = ini.hora;
      $('ll-quien').textContent = '· ' + (corr ? (corr.corregida ? corr.corregida.quien : Llamadas.quien()) : Llamadas.quien());
      var cerrado = false;
      function cerrar(valor) {
        if (cerrado) return;
        cerrado = true;
        document.removeEventListener('keydown', alTeclear, true);
        if (capa.parentNode) capa.parentNode.removeChild(capa);
        try { if (previo && previo.focus && document.contains(previo)) previo.focus(); } catch (e) { /* sin foco que devolver */ }
        resolver(valor);
      }
      function alTeclear(ev) {
        if (ev.key !== 'Escape') return;
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        cerrar(null);
      }
      document.addEventListener('keydown', alTeclear, true);

      function textoTarea() {
        if (!S.sel) return 'No, de ninguna';
        var v = S.sel.split('|'), x = hitos.filter(function (k) { return k.h.id === v[0]; })[0];
        var g = x && x.tareas.filter(function (t) { return t.id === v[1]; })[0];
        return g ? (x.h.titulo || 'Hito') + ' › ' + g.texto : 'No, de ninguna';
      }
      function pintar() {
        var rec = S.sentido === 'recibida';
        Array.prototype.forEach.call(capa.querySelectorAll('input[name="ll-sentido"]'), function (r) { r.checked = r.value === S.sentido; r.parentNode.classList.toggle('el', r.checked); });
        Array.prototype.forEach.call(capa.querySelectorAll('input[name="ll-res"]'), function (r) { r.checked = r.value === S.res; r.parentNode.classList.toggle('el', r.checked); });
        $('ll-rot-quien').textContent = rec ? 'Quién ha llamado' : 'A quién';
        $('ll-bloque-res').hidden = rec;
        $('ll-personas').innerHTML = personas.map(function (p, i) {
          return '<div class="ll-per' + (i === S.persona ? ' el' : '') + '" data-per="' + i + '" role="button" tabindex="0" aria-pressed="' + (i === S.persona) + '">' +
            '<span class="ll-q">' + esc(p.nombre) + ' <small>' + esc(p.papel + (p.custodia ? ' · tiene la custodia' : '')) + '</small></span>' +
            '<b class="ll-tel">' + esc(p.telefono) + '</b>' +
            '<button type="button" class="ll-cop" data-copia="' + esc(p.copia) + '" aria-label="Copiar el teléfono" title="Copiar el teléfono">⧉</button></div>';
        }).join('');
        if (!$('ll-bloque-tarea').hidden) {
          $('ll-tarea').innerHTML = '<span>' + esc(textoTarea()) + '</span><span>' + (S.lista ? '▴' : '▾') + '</span>';
          $('ll-tarea').setAttribute('aria-expanded', S.lista ? 'true' : 'false');
          var op = '<button type="button" data-sel=""' + (S.sel === '' ? ' class="el"' : '') + '>No, de ninguna</button>';
          hitos.forEach(function (x) {
            op += '<button type="button" class="ll-hito" data-hab="' + esc(x.h.id) + '">' + (S.hAb === x.h.id ? '▾ ' : '▸ ') + esc(x.h.titulo || 'Hito') + (x.actual ? ' (el actual)' : '') + '</button>';
            if (S.hAb === x.h.id && !x.tareas.length) op += '<span class="ll-sin-tareas">Este hito no tiene tareas.</span>';
            if (S.hAb === x.h.id) op += x.tareas.map(function (g) {
              return '<button type="button" class="ll-ta' + (S.sel === x.h.id + '|' + g.id ? ' el' : '') + '" data-sel="' + esc(x.h.id + '|' + g.id) + '">' + esc(g.texto) + (g.hecho ? ' (hecha)' : '') + '</button>';
            }).join('');
          });
          $('ll-tarea-lista').innerHTML = op;
          $('ll-tarea-lista').hidden = !S.lista;
        }
      }
      pintar();

      function apuntar() {
        var rec = S.sentido === 'recibida', otro = $('ll-otra').value.trim();
        var p = S.persona > -1 ? personas[S.persona] : null;
        var con = p ? conDe(p) : otro;
        var cuando = Llamadas.isoDe($('ll-dia').value, $('ll-hora').value);
        var falta = !cuando ? 'Pon el día y la hora de la llamada.' : !con ? (rec ? 'Di quién ha llamado.' : 'Di a quién has llamado.') : (!rec && !S.res ? 'Di si has hablado o no contesta.' : '');
        if (falta) { $('ll-falta').textContent = falta; $('ll-falta').hidden = false; return; }
        var tarea = S.tarea;
        if (o.cabecera && S.sel) {
          var v = S.sel.split('|'), x = hitos.filter(function (k) { return k.h.id === v[0]; })[0];
          var g = x && x.tareas.filter(function (t) { return t.id === v[1]; })[0];
          tarea = g ? { h: x.h, g: g, delActual: x.actual } : null;
        }
        cerrar({ tarea: tarea, r: { sentido: S.sentido, con: con, persona: p ? p.nombre : '', telefono: p ? p.telefono : '', resultado: rec ? 'si' : S.res,
          comentario: $('ll-com').value.trim(), cuando: cuando } });
      }

      capa.addEventListener('click', function (ev) {
        var b = ev.target.closest('button,[data-per]');
        if (ev.target === capa) return;
        if (!b) return;
        if (b.dataset.copia !== undefined) { ev.stopPropagation(); U.copiar(b.dataset.copia, b, { avisoFallo: 'No he podido copiar el teléfono.' }); return; }
        if (b.dataset.per !== undefined) {
          S.persona = S.persona === +b.dataset.per ? -1 : +b.dataset.per;
          if (S.persona > -1) $('ll-otra').value = '';
          pintar(); return;
        }
        if (b.id === 'll-tarea') { S.lista = !S.lista; pintar(); return; }
        if (b.dataset.hab !== undefined) { S.hAb = S.hAb === b.dataset.hab ? '' : b.dataset.hab; pintar(); return; }
        if (b.dataset.sel !== undefined) { S.sel = b.dataset.sel; S.lista = false; pintar(); $('ll-tarea').focus(); return; }
        if (b.id === 'll-no') { cerrar(null); return; }
        if (b.id === 'll-ok') apuntar();
      });
      capa.addEventListener('change', function (ev) {
        var e = ev.target;
        if (e.name === 'll-sentido') { S.sentido = e.value; pintar(); }
        else if (e.name === 'll-res') { S.res = e.value; pintar(); }
      });
      capa.addEventListener('input', function (ev) {
        if (ev.target.id === 'll-otra' && ev.target.value && S.persona > -1) { S.persona = -1; pintar(); }   /* escribir a mano suelta a la persona elegida */
      });
      capa.addEventListener('keydown', function (ev) {
        if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.dataset && ev.target.dataset.per !== undefined) { ev.preventDefault(); ev.target.click(); }
      });
      var primero = capa.querySelector('input[name="ll-sentido"]:checked') || $('ll-no');
      primero.focus();
    });
  };
})();
