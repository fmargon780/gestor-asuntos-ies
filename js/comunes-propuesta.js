/* ============================================================
   comunes-propuesta.js — Ajustes → Mantenimiento → «Pasar las guías a las
   listas comunes»: la propuesta, solo para mirarla (fila 531,
   docs/531-TAREAS-E-HITOS-COMUNES.md, punto 9).

   La app prepara en pantalla qué tareas e hitos de las guías de hoy pasarían a
   las listas comunes, cuáles se unirían (los que dicen lo mismo) y cuáles
   quedan separados (mismo nombre pero otra plantilla u otra acción). NO cambia
   nada: no escribe ni las listas ni las guías. Aplicarla, con Francisco y
   Claude revisándola juntos, es la fila 532. Va también como texto plano
   («Copiar la propuesta») para leerla en una conversación.

   El cálculo, puro, está en js/comunes.js (`Comunes.propuesta`).
   ============================================================ */
var ComunesPropuesta = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function veces(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* La propuesta como texto plano, una línea por cosa. */
  function aTexto(p) {
    var l = ['PROPUESTA DE PASAR LAS GUÍAS A LAS LISTAS COMUNES (no se ha cambiado nada)', '',
      'Tareas que pasarían a la lista: ' + p.tareas.length + ' (de ' + p.lineas + ' tareas escritas en las guías)',
      'Hitos que pasarían a la lista: ' + p.hitos.length, ''];
    l.push('TAREAS');
    p.tareas.forEach(function (t) {
      l.push('- ' + t.nombre + ' [' + Comunes.textoDeHace(t.accion) + (t.plantilla ? ', plantilla ' + t.plantilla : '') + '] · ' + veces(t.usos.length, 'uso', 'usos') +
        (t.yaEnLista ? ' · ya está en la lista' : ''));
    });
    l.push('', 'HITOS');
    p.hitos.forEach(function (h) {
      l.push('- ' + h.nombre + ' · tareas: ' + (h.tareas.length || 'ninguna') + ' · en ' + veces(h.usos.length, 'tipo', 'tipos') + ': ' + h.usos.join(', ') + (h.yaEnLista ? ' · ya está en la lista' : ''));
    });
    l.push('', 'SE UNIRÍAN (dicen lo mismo en varias guías)');
    if (!p.iguales.length) l.push('- ninguna');
    p.iguales.forEach(function (x) { l.push('- ' + (x.tipo === 'tarea' ? 'Tarea' : 'Hito') + ' «' + x.nombre + '»: ' + veces(x.veces, 'vez', 'veces')); });
    l.push('', 'QUEDARÍAN SEPARADAS (mismo nombre, pero no dicen lo mismo)');
    if (!p.distintas.length) l.push('- ninguna');
    p.distintas.forEach(function (x) { l.push('- ' + (x.tipo === 'tarea' ? 'Tarea' : 'Hito') + ' «' + x.nombre + '»: ' + veces(x.maneras, 'manera', 'maneras') + ' distintas'); });
    l.push('', 'SE QUEDAN COMO ESTÁN', '- ' + veces(p.seQuedan.preguntas, 'pregunta', 'preguntas') + ' dentro de las tareas',
      '- ' + veces(p.seQuedan.hitosConRamas, 'hito con preguntas y ramas', 'hitos con preguntas y ramas'),
      '', p.sinPerdidas ? 'Nada se pierde: cada tarea escrita en las guías está en la propuesta.' : 'ATENCIÓN: alguna tarea no está en la propuesta.');
    return l.join('\n');
  }

  function aHTML(p) {
    function lista(items) { return items.length ? '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '<p class="suave">Ninguna.</p>'; }
    return '<p><strong>' + veces(p.tareas.length, 'tarea', 'tareas') + '</strong> y <strong>' + veces(p.hitos.length, 'hito', 'hitos') + '</strong> pasarían a las listas (de ' +
      veces(p.lineas, 'tarea escrita', 'tareas escritas') + ' en las guías). ' + (p.sinPerdidas ? 'Nada se pierde.' : '<span class="aviso aviso-ambar">Alguna tarea no está en la propuesta.</span>') + '</p>' +
      '<h4>Se unirían (dicen lo mismo en varias guías)</h4>' + lista(p.iguales.map(function (x) { return (x.tipo === 'tarea' ? 'Tarea' : 'Hito') + ' «' + esc(x.nombre) + '»: ' + veces(x.veces, 'vez', 'veces'); })) +
      '<h4>Quedarían separadas (mismo nombre, pero no dicen lo mismo)</h4>' + lista(p.distintas.map(function (x) { return (x.tipo === 'tarea' ? 'Tarea' : 'Hito') + ' «' + esc(x.nombre) + '»: ' + veces(x.maneras, 'manera', 'maneras') + ' distintas'; })) +
      '<h4>Tareas</h4>' + lista(p.tareas.map(function (t) { return esc(t.nombre) + ' <span class="suave">· ' + esc(Comunes.textoDeHace(t.accion)) + (t.plantilla ? ' · plantilla ' + esc(t.plantilla) : '') + ' · ' + veces(t.usos.length, 'uso', 'usos') + '</span>'; })) +
      '<h4>Hitos</h4>' + lista(p.hitos.map(function (h) { return esc(h.nombre) + ' <span class="suave">· ' + veces(h.tareas.length, 'tarea', 'tareas') + ' · en ' + veces(h.usos.length, 'tipo', 'tipos') + '</span>'; })) +
      '<h4>Se quedan como están</h4><p>' + veces(p.seQuedan.preguntas, 'pregunta', 'preguntas') + ' dentro de las tareas y ' + veces(p.seQuedan.hitosConRamas, 'hito con preguntas y ramas', 'hitos con preguntas y ramas') + '.</p>';
  }

  async function preparar() {
    var salida = document.getElementById('resultado-comunes-propuesta');
    var boton = document.getElementById('btn-comunes-propuesta');
    if (!salida) return;
    boton.disabled = true;
    try {
      try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
      var p = Comunes.propuesta(GuiasDelCentro.todas());
      salida.innerHTML = '<div class="aviso aviso-ambar">Es solo una propuesta: no se ha cambiado nada.</div>' +
        '<div class="comunes-propuesta">' + aHTML(p) + '</div>' +
        '<button type="button" class="boton" id="btn-comunes-copiar">Copiar la propuesta como texto</button>';
      document.getElementById('btn-comunes-copiar').onclick = function () {
        var texto = aTexto(p);
        (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject(new Error('sin portapapeles'))).then(
          function () { U.aviso('Propuesta copiada.', 'bueno'); },
          function () { salida.insertAdjacentHTML('beforeend', '<textarea class="campo" rows="12" readonly>' + esc(texto) + '</textarea>'); });
      };
    } catch (e) { U.fallo('No he podido preparar la propuesta', e); }
    boton.disabled = false;
  }

  function bloque() {
    if (document.getElementById('bloque-comunes-propuesta')) return;
    var pantalla = document.getElementById('ajustes-tab-mantenimiento');
    if (!pantalla) return;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-comunes-propuesta';
    d.innerHTML = '<summary><span class="bloque-titulo">Pasar las guías a las listas comunes</span>' +
      '<span class="bloque-pie">Una propuesta para mirar con calma: no cambia nada</span></summary>' +
      '<div class="bloque-cuerpo"><p class="explica">La aplicación mira las tareas y los hitos de todas las guías y propone cuáles pasarían a la lista común de tareas y a la de hitos, y cuáles se unirían por decir lo mismo. ' +
      'Aquí solo se ve: no se cambia ninguna guía ni ninguna lista. Aplicarla es un paso aparte, que se hace después de revisarla.</p>' +
      '<button type="button" class="boton" id="btn-comunes-propuesta">Preparar la propuesta</button><div id="resultado-comunes-propuesta"></div></div>';
    pantalla.appendChild(d);
    document.getElementById('btn-comunes-propuesta').onclick = preparar;
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      /* Sale al llegar a Herramientas o a Ajustes, en cualquier orden. */
      if (App.pantallaALaVista && !App.pantallaALaVista('ajustes') && !App.pantallaALaVista('herramientas')) return;
      if (window.Gestor.carpetaGestor()) bloque();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { aTexto: aTexto, aHTML: aHTML, preparar: preparar };
})();
window.ComunesPropuesta = ComunesPropuesta;
