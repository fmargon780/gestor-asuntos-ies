/* ============================================================
   guias-mas-ajustes.js — el hito de la guía, más limpio
   (22-oct-2026, fila 418, docs/HITOS-UN-SOLO-SITIO.md, parte C).

   Al abrir un hito en el editor de la guía solo se ven el título, el
   responsable, el plazo y las tareas. Todo lo demás (explicación, a
   quién le toca, normativa, solo informativo, avisar a quien lo pide,
   texto para los documentos, recibe varios documentos, «es una
   pregunta»…) se esconde tras un botón «Más ajustes», cerrado al abrir.

   No se cambia el DOM de los campos: siguen siendo hijos directos del
   recuadro del hito (recoger() de js/guias-editor.js los lee igual,
   estén a la vista o no). Solo llevan la clase `paso-ajuste` y el CSS
   los esconde mientras el recuadro no tenga `mas-abierto`. Nada de lo
   guardado cambia.

   Debajo del título, una línea gris con lo que hay activado dentro
   (`linea`), también con el hito cerrado. Un hito que es pregunta se
   queda como estaba.
   ============================================================ */
var GuiasMasAjustes = (function () {

  /* Qué recuadros tienen «Más ajustes» abierto: por id del hito, para que
     un repintado (añadir una tarea, marcar algo…) no lo cierre. */
  var abiertos = {};

  function reiniciar() { abiertos = {}; }

  function cuantos(x) { return Array.isArray(x) ? x.length : 0; }

  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }

  /* La parte pura: [{ k: clave, t: texto }] en el orden cerrado de la
     fila 418. */
  function lista(p, responsables) {
    var m = [];
    if (!p || esPregunta(p)) return m;
    if (p.soloInformativo) m.push({ k: 'solo', t: 'Solo informativo' });
    if (p.avisarLoPide) m.push({ k: 'avisa', t: 'Avisa a quien lo pide' });
    if (p.variosDocumentos) m.push({ k: 'varios', t: 'Recibe varios documentos' });
    if (cuantos(p.normativa)) m.push({ k: 'normativa', t: 'Normativa (' + cuantos(p.normativa) + ')' });
    if (cuantos(p.plantillasDocumento)) m.push({ k: 'documentos', t: 'Documentos (' + cuantos(p.plantillasDocumento) + ')' });
    if (cuantos(p.campos)) m.push({ k: 'campos', t: 'Campos (' + cuantos(p.campos) + ')' });
    if (p.textoDocumentos && String(p.textoDocumentos).trim()) m.push({ k: 'texto', t: 'Texto para documentos' });
    if (p.toca === 'nos') m.push({ k: 'toca', t: 'A quién le toca: nos toca' });
    else if (p.toca === 'espera') {
      var a = window.GuiasToca ? GuiasToca.nombreDe(p.tocaA || 'tercero', responsables) : (p.tocaA || 'tercero');
      m.push({ k: 'toca', t: 'A quién le toca: esperamos a ' + a });
    }
    return m;
  }

  /* El texto de la línea gris. Con el hito cerrado, lo que ya sale en su
     línea de marcas (solo informativo, normativa, documentos, a quién le
     toca) no se repite. */
  function linea(p, responsables, cerrado) {
    var repetidas = { solo: 1, normativa: 1, documentos: 1, toca: 1 };
    return lista(p, responsables).filter(function (x) { return !(cerrado && repetidas[x.k]); })
      .map(function (x) { return x.t; }).join(' · ');
  }

  function textoBoton(abierto) { return (abierto ? '▾' : '▸') + ' Más ajustes'; }

  /* Esconde los ajustes de un recuadro de hito (`el`, ya montado con todos
     sus campos) y le pone el botón. Un hito pregunta se deja como estaba. */
  function montar(el, p) {
    if (!el || esPregunta(p)) return;
    var hijos = Array.prototype.slice.call(el.children);
    var sel = ['paso-cuerpo', 'paso-solo-informativo-fila', 'paso-varios-documentos-fila',
      'paso-varios-documentos-ayuda', 'paso-avisar-lopide-fila', 'paso-avisar-lopide-plantilla',
      'paso-texto-documentos-fila', 'paso-normativa', 'paso-es-pregunta-fila'];
    hijos.forEach(function (h) {
      if (sel.some(function (c) { return h.classList.contains(c); })) h.classList.add('paso-ajuste');
    });
    var toca = el.querySelector(':scope > .paso-extra > .paso-extra-cuerpo > .paso-toca-bloque');
    if (toca) toca.classList.add('paso-ajuste');

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton paso-mas-ajustes-boton';
    boton.setAttribute('data-ayuda-clave', 'explicacion-a-quien-le-toca-normativa');
    var abierto = !!abiertos[p.id];
    boton.textContent = textoBoton(abierto);
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    el.classList.toggle('mas-abierto', abierto);
    boton.onclick = function () {
      var ahora = !el.classList.contains('mas-abierto');
      el.classList.toggle('mas-abierto', ahora);
      abiertos[p.id] = ahora;
      boton.textContent = textoBoton(ahora);
      boton.setAttribute('aria-expanded', ahora ? 'true' : 'false');
    };

    var guion = el.querySelector(':scope > .paso-guion');
    if (guion) guion.insertAdjacentElement('afterend', boton);
    else {
      var cab = el.querySelector(':scope > .paso-cabecera');
      var extra = el.querySelector(':scope > .paso-extra');
      (extra || cab).insertAdjacentElement('afterend', boton);
    }
    /* La explicación va justo debajo del botón, para que al abrirlo se lea
       antes que lo demás. Sigue siendo hijo directo del recuadro. */
    var cuerpo = el.querySelector(':scope > .paso-cuerpo');
    if (cuerpo) boton.insertAdjacentElement('afterend', cuerpo);
  }

  return { montar: montar, reiniciar: reiniciar, lista: lista, linea: linea };
})();
window.GuiasMasAjustes = GuiasMasAjustes;
