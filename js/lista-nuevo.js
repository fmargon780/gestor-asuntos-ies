/* ============================================================
   lista-nuevo.js — «+ Nuevo…» en los desplegables de hitos y tareas
   (fila 615, 11-nov-2026, docs/615-LISTAS-EDITABLES.md, tema 582).

   La última opción de un desplegable cuyos valores son una lista del centro es
   «+ Nuevo…». Al elegirla, el desplegable se queda con lo que tenía y se abre un
   cuadro propio (encima del editor de la guía, que es ya el único cuadro de la
   app y se cerraría): pide el nombre (y, en un campo de lista, sus opciones).

   Aquí, lo común:
   - `NUEVO` (el valor de esa opción) y `opcionHTML(texto)` (la opción, que no sale
     en solo consulta).
   - `parecido`, `buscarParecidos`: «igual» sin mayúsculas ni tildes, y «se parece»
     cuando uno contiene al otro como palabras enteras de más de tres letras.
   - `mostrarAviso`: «Ya hay algo parecido en esta lista:» con «Usar “X”».
   - `pedir(o)`: el cuadro. Devuelve { creado } o { usado } o null (Cancelar).
   - `registrar(selector, abrir)`: quién atiende cada tipo de desplegable; un solo
     escucha en captura devuelve el desplegable a lo que tenía y llama a `abrir`.
   - `ponerOpcion` y `elegir`: dejar lo creado en el desplegable y elegido.
   Lo propio de cada lista vive en js/lista-nuevo-listas.js.
   ============================================================ */
window.ListaNuevo = (function () {
  var NUEVO = '__nuevo__';

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* ¿Son lo mismo, o uno contiene al otro como palabras enteras (la más corta, de más de tres letras)? */
  function parecido(a, b) {
    var x = norm(a), y = norm(b);
    if (!x || !y) return false;
    if (x === y) return true;
    var corto = x.length < y.length ? x : y, largo = x.length < y.length ? y : x;
    return corto.length > 3 && (' ' + largo + ' ').indexOf(' ' + corto + ' ') > -1;
  }

  /* `existentes`: [{ nombre, valor, donde, usable, ... }]. */
  function buscarParecidos(nombre, existentes) {
    return (existentes || []).filter(function (k) { return parecido(nombre, k.nombre); });
  }

  function disponible() { return !(window.SoloConsulta && SoloConsulta.activo()); }

  function opcionHTML(texto) {
    return disponible() ? '<option value="' + NUEVO + '">' + esc(texto) + '</option>' : '';
  }

  /* El aviso de parecidos dentro de `caja`. `alUsar(item)`. Devuelve true si había algo que avisar. */
  function mostrarAviso(caja, parecidos, alUsar) {
    if (!caja || !parecidos || !parecidos.length) return false;
    var h = '<div class="ln-aviso"><b>Ya hay algo parecido en esta lista:</b>';
    parecidos.forEach(function (k, i) {
      h += '<div>«' + esc(k.nombre) + '»' + (k.donde ? ' en ' + esc(k.donde) : '') + '. ' +
        (k.usable ? '<button type="button" class="boton boton-chico ln-usar" data-i="' + i + '">Usar «' + esc(k.nombre) + '»</button>'
                  : 'Aquí no se puede elegir.') + '</div>';
    });
    caja.innerHTML = h + '<span>Si es otra cosa distinta, pulsa otra vez el botón de crear.</span></div>';
    Array.prototype.forEach.call(caja.querySelectorAll('.ln-usar'), function (b) {
      b.onclick = function () { alUsar(parecidos[parseInt(b.dataset.i, 10)]); };
    });
    return true;
  }

  function quitarAviso(caja) { if (caja) caja.innerHTML = ''; }

  /* ---------- el cuadro ----------

     o = { titulo, etiqueta, nota, conOpciones, limpiar(texto) → nombre, existentes, propios (nombres: «ya está»; por defecto, los
     existentes), errorVacio, textoYaEsta(nombre), validar(nombre, opciones) → texto de error o '',
     alCrear(nombre, opciones) → Promise<item> (si falla, el cuadro sigue abierto con el error) }. */
  function pedir(o) {
    return new Promise(function (resolver) {
      var previo = document.activeElement;
      var capa = document.createElement('div');
      capa.className = 'capa ln-capa';
      capa.innerHTML = '<div class="cuadro ln-cuadro" role="dialog" aria-modal="true" aria-labelledby="ln-titulo">' +
        '<h3 id="ln-titulo">' + esc(o.titulo) + '</h3>' +
        '<div class="ln-cuerpo">' +
          '<label class="etiqueta" for="ln-nombre">' + esc(o.etiqueta) + '</label>' +
          '<input id="ln-nombre" class="campo" autocomplete="off">' +
          (o.conOpciones ? '<label class="etiqueta" for="ln-opciones">Opciones (una por línea)</label>' +
            '<textarea id="ln-opciones" class="campo" rows="4"></textarea>' : '') +
          '<div class="ln-parecidos" id="ln-parecidos"></div>' +
          '<p class="ln-error" id="ln-error" role="alert" hidden></p>' +
          '<p class="nota">' + esc(o.nota || '') + '</p>' +
        '</div>' +
        '<div class="cuadro-botones"><button type="button" class="boton" id="ln-cancelar">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="ln-crear">Crear</button></div></div>';
      document.body.appendChild(capa);
      function $(id) { return capa.querySelector('#' + id); }
      var avisado = false, ocupado = false, cerrado = false;

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

      function error(t) { var e = $('ln-error'); e.textContent = t || ''; e.hidden = !t; }
      function limpiar() { avisado = false; quitarAviso($('ln-parecidos')); error(''); }
      $('ln-nombre').oninput = limpiar;
      if ($('ln-opciones')) $('ln-opciones').oninput = function () { error(''); };
      $('ln-cancelar').onclick = function () { cerrar(null); };
      $('ln-nombre').onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('ln-crear').click(); } };

      $('ln-crear').onclick = async function () {
        if (ocupado) return;
        var nombre = (o.limpiar || function (x) { return String(x).replace(/\s+/g, ' ').trim(); })($('ln-nombre').value);
        var opciones = $('ln-opciones') ? $('ln-opciones').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean) : [];
        if (!nombre) { error(o.errorVacio || 'Escribe el nombre.'); return; }
        var propios = o.propios || (o.existentes || []).map(function (x) { return x.nombre; });
        if (propios.some(function (x) { return norm(x) === norm(nombre); })) {
          error(o.textoYaEsta ? o.textoYaEsta(nombre) : '«' + nombre + '» ya está en esta lista.');
          return;
        }
        if (!avisado) {
          var cerca = buscarParecidos(nombre, o.existentes);
          if (mostrarAviso($('ln-parecidos'), cerca, function (k) { cerrar({ usado: k }); })) { avisado = true; return; }
        }
        var falta = o.validar ? o.validar(nombre, opciones) : '';
        if (falta) { error(falta); return; }
        ocupado = true;
        $('ln-crear').disabled = true;
        try {
          var item = await o.alCrear(nombre, opciones);
          cerrar({ creado: item });
        } catch (e) {
          ocupado = false;
          $('ln-crear').disabled = false;
          error('No he podido crearlo: ' + U.mensajeDeError(e));
        }
      };
      $('ln-nombre').focus();
    });
  }

  /* ---------- los desplegables ---------- */

  var registro = [];

  /* `abrir(select)` atiende a los desplegables que cumplen `selector` cuando se elige «+ Nuevo…». */
  function registrar(selector, abrir) { registro.push({ selector: selector, abrir: abrir }); }

  function tieneNuevo(sel) { return !!(sel && sel.querySelector && sel.querySelector('option[value="' + NUEVO + '"]')); }

  function restaurar(sel) {
    var antes = sel.dataset.anterior;
    var hay = antes !== undefined && Array.prototype.some.call(sel.options, function (o) { return o.value === antes; });
    if (hay) { sel.value = antes; return; }
    var def = Array.prototype.filter.call(sel.options, function (o) { return o.defaultSelected && o.value !== NUEVO; })[0];
    sel.value = def ? def.value : (sel.options[0] ? sel.options[0].value : '');
  }

  /* Pone la opción (si falta) antes de `antesDe(select)` o de «+ Nuevo…». Devuelve la opción. */
  function ponerOpcion(sel, valor, texto, antesDe) {
    var op = Array.prototype.filter.call(sel.options, function (x) { return x.value === valor; })[0];
    if (op) return op;
    op = document.createElement('option');
    op.value = valor;
    op.textContent = texto;
    var ref = (antesDe && antesDe(sel)) || sel.querySelector('option[value="' + NUEVO + '"]');
    sel.insertBefore(op, ref || null);
    return op;
  }

  /* Elige `valor` y avisa al editor como si se hubiera elegido a mano. */
  function elegir(sel, valor) {
    sel.value = valor;
    sel.dataset.anterior = valor;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('focusin', function (ev) {
      var t = ev.target;
      if (t && t.tagName === 'SELECT' && tieneNuevo(t) && t.value !== NUEVO) t.dataset.anterior = t.value;
    }, true);
    /* En captura: corre antes que cualquier otro aviso de cambio, que así no ve nunca «+ Nuevo…». */
    document.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || t.tagName !== 'SELECT' || !tieneNuevo(t)) return;
      if (t.value !== NUEVO) { t.dataset.anterior = t.value; return; }
      var r = registro.filter(function (x) { return t.matches(x.selector); })[0];
      if (!r) return;
      ev.stopImmediatePropagation();
      ev.stopPropagation();
      restaurar(t);
      if (t.dataset.nuevoAbierto) return;
      t.dataset.nuevoAbierto = '1';
      Promise.resolve().then(function () { return r.abrir(t); })
        .catch(function (e) { U.fallo('No he podido abrir el cuadro', e); })
        .then(function () { delete t.dataset.nuevoAbierto; });
    }, true);
  }

  return {
    NUEVO: NUEVO, norm: norm, parecido: parecido, buscarParecidos: buscarParecidos, disponible: disponible,
    opcionHTML: opcionHTML, mostrarAviso: mostrarAviso, quitarAviso: quitarAviso, pedir: pedir,
    registrar: registrar, ponerOpcion: ponerOpcion, elegir: elegir
  };
})();
