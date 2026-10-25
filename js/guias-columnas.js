/* ============================================================
   guias-columnas.js — el editor de la guía a dos columnas
   (25-oct-2026, fila 463, docs/EDITOR-DE-LA-GUIA-CLARO.md, parte A).

   Sustituye a «Más ajustes» (js/guias-mas-ajustes.js, fila 418): lo que
   estaba tras ese botón se reparte en apartados con título, plegados,
   cada uno con un resumen en gris de lo que tiene activado.

   No se cambia el DOM de los campos: siguen siendo hijos directos del
   recuadro del hito (recoger() de js/guias-editor.js los lee igual,
   estén a la vista o no). Aquí solo se les pone una clase de apartado
   (`ap-campo ap-<clave>`), se les antepone la línea del título del
   apartado y se ordenan. El CSS (css/guias-columnas.css) esconde los
   campos de un apartado mientras el recuadro no tenga `abre-<clave>`.

   - `montar(el, p, o)`: ordena y titula un recuadro de hito (`el`, ya
     montado con todos sus campos). `o.sub` es true en un hito de dentro
     de una respuesta. Un hito pregunta lleva solo «Explicación» y «Otros».
   - `actualizar(el, p, responsables)`: los resúmenes y el número de tareas.
   - `reiniciar()`: se olvidan los apartados abiertos (al abrir el editor).
   - `resumenes(p)`: la parte pura, { clave: texto }.
   ============================================================ */
var GuiasColumnas = (function () {

  /* Qué apartados tienen abiertos cada hito: «idHito|clave», para que un
     repintado (añadir una tarea, marcar algo…) no los cierre. */
  var abiertos = {};

  function reiniciar() { abiertos = {}; }

  function cuantos(x) { return Array.isArray(x) ? x.length : 0; }
  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }

  /* Los apartados, en orden: clave, título y clases de los campos que
     lleva (hijos directos del recuadro del hito). */
  var APARTADOS = [
    { k: 'explicacion', t: 'Explicación del hito', campos: ['paso-cuerpo', 'guia-barra-caja'] },
    { k: 'aviso', t: 'Al terminar este hito', campos: ['paso-avisar-lopide-fila', 'paso-avisar-lopide-plantilla', 'paso-aviso-frase'] },
    { k: 'documentos', t: 'Documentos de este hito', campos: ['paso-varios-documentos-fila', 'paso-varios-documentos-ayuda', 'paso-texto-documentos-fila'] },
    { k: 'normativa', t: 'Normativa e impresos', campos: ['paso-normativa'] },
    { k: 'otros', t: 'Otros', campos: ['paso-solo-informativo-fila', 'paso-es-pregunta-fila'] }
  ];

  /* La parte pura: el resumen en gris de cada apartado (vacío si no hay nada). */
  function resumenes(p) {
    var r = { explicacion: '', aviso: '', documentos: '', normativa: '', otros: '' };
    if (!p) return r;
    var pregunta = esPregunta(p);
    if (!pregunta) {
      r.aviso = 'avisar a quien lo pide: ' + (p.avisarLoPide ? 'sí' : 'no');
      var d = [];
      if (p.variosDocumentos) d.push('Recibe varios documentos');
      if (p.textoDocumentos && String(p.textoDocumentos).trim()) d.push('Texto para documentos');
      r.documentos = d.join(' · ');
      var n = [];
      if (cuantos(p.normativa)) n.push('Normativa (' + cuantos(p.normativa) + ')');
      if (cuantos(p.formularios)) n.push(cuantos(p.formularios) === 1 ? '1 impreso marcado' : cuantos(p.formularios) + ' impresos marcados');
      r.normativa = n.join(' · ');
    }
    var o = [];
    if (p.soloInformativo && !pregunta) o.push('Solo informativo');
    if (pregunta) o.push('Es una pregunta');
    r.otros = o.join(' · ');
    return r;
  }

  function hijoCon(el, clase) {
    return Array.prototype.filter.call(el.children, function (h) { return h.classList.contains(clase); });
  }

  function montar(el, p, o) {
    if (!el) return;
    o = o || {};
    var pregunta = esPregunta(p);
    var id = p && p.id;
    var orden = [];

    function dir(clase) { return hijoCon(el, clase)[0] || null; }
    function poner(n) { if (n && orden.indexOf(n) === -1) orden.push(n); }

    /* Fila 463, A6-2: la frase gris del aviso (un campo más del apartado). */
    if (dir('paso-avisar-lopide-plantilla') && !dir('paso-aviso-frase')) {
      var frase = document.createElement('p');
      frase.className = 'suave paso-aviso-frase';
      frase.textContent = 'Manda un aviso a quien encargó el asunto cuando este hito se marca hecho. ' +
        'Para escribir a otras personas durante el hito, usa una tarea «Comunicar».';
      dir('paso-avisar-lopide-plantilla').insertAdjacentElement('afterend', frase);
    }

    if (!o.sub) {
      var datos = document.createElement('div');
      datos.className = 'paso-apartado-fijo paso-datos-titulo';
      datos.textContent = 'Datos del hito';
      poner(datos);
    }
    /* ↑, ↓ y «Quitar» van al final de la fila de datos, a la derecha. */
    if (!o.sub) {
      var mandos = el.querySelector(':scope > .paso-cabecera > .paso-mandos');
      var cuerpoDatos = el.querySelector(':scope > .paso-extra > .paso-extra-cuerpo');
      if (mandos && cuerpoDatos) cuerpoDatos.appendChild(mandos);
    }
    poner(dir('paso-cabecera'));
    poner(dir('paso-aviso-plazo'));
    poner(dir('paso-extra'));
    poner(dir('paso-opciones'));
    var guion = dir('paso-guion');
    if (guion) {
      guion.open = true;
      guion.classList.add('paso-apartado-fijo');
      poner(guion);
    }

    APARTADOS.forEach(function (a) {
      var campos = [];
      a.campos.forEach(function (c) { hijoCon(el, c).forEach(function (n) { campos.push(n); }); });
      if (!campos.length) return;
      var cab = document.createElement('button');
      cab.type = 'button';
      cab.className = 'paso-apartado-cab';
      cab.dataset.ap = a.k;
      cab.innerHTML = '<span class="ap-flecha"></span><span class="ap-titulo">' + a.t + '</span>' +
        '<span class="ap-resumen suave"></span>';
      var abierto = !!abiertos[id + '|' + a.k];
      el.classList.toggle('abre-' + a.k, abierto);
      cab.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      cab.onclick = function () {
        var ahora = !el.classList.contains('abre-' + a.k);
        el.classList.toggle('abre-' + a.k, ahora);
        abiertos[id + '|' + a.k] = ahora;
        cab.setAttribute('aria-expanded', ahora ? 'true' : 'false');
      };
      poner(cab);
      campos.forEach(function (n) { n.classList.add('ap-campo', 'ap-' + a.k); poner(n); });
    });

    /* Lo que no se ha colocado se queda al final, en su orden. */
    Array.prototype.slice.call(el.children).forEach(poner);
    orden.forEach(function (n) { el.appendChild(n); });
  }

  /* La barra de formato (js/guias-barra.js) es un solo nodo que cambia de
     sitio: se mete en el apartado de la explicación, justo encima del
     recuadro. Lleva las clases del apartado para esconderse con él. */
  function cajaDeBarra(html) {
    var d = document.createElement('div');
    d.id = 'guia-barra-caja';
    d.className = 'guia-barra-caja';
    d.innerHTML = html;
    return d;
  }

  function actualizar(el, p, responsables) {
    if (!el || !p) return;
    var r = resumenes(p);
    Array.prototype.forEach.call(el.querySelectorAll(':scope > .paso-apartado-cab'), function (cab) {
      var t = cab.querySelector('.ap-resumen');
      var nuevo = r[cab.dataset.ap] || '';
      if (t && t.textContent !== nuevo) t.textContent = nuevo;
    });
    var s = el.querySelector(':scope > .paso-guion > summary');
    if (s) {
      var n = cuantos(p.guion);
      var texto = 'Tareas de este hito' + (n ? ' (' + n + ')' : '');
      if (s.textContent !== texto) s.textContent = texto;
    }
  }

  return { montar: montar, actualizar: actualizar, reiniciar: reiniciar, resumenes: resumenes,
           cajaDeBarra: cajaDeBarra, APARTADOS: APARTADOS };
})();
window.GuiasColumnas = GuiasColumnas;
