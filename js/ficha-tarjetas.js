/* ============================================================
   ficha-tarjetas.js — la ficha del asunto en tarjetas (24-sep-2026,
   fila 107, docs/FICHA-EN-TARJETAS.md).

   Debajo de la cabecera de la ficha, en vez de tres columnas, una
   cuadrícula de tarjetas del mismo tamaño que llena el alto visible sin
   desplazarse: Hitos, Documentos de la carpeta, Datos y contacto (y
   Datos del trámite, si lo hay) arriba; Notas, Otros asuntos de este
   tercero y Personas y entidades relacionadas abajo.

   - Cada tarjeta cerrada enseña un resumen. Los resúmenes se sacan de
     lo que ya pinta cada módulo dentro de la tarjeta (el cuerpo sigue
     ahí, solo oculto), con un `MutationObserver` que no mira nunca lo
     que pinta este fichero (resúmenes, franja, pestañas).
   - Pulsar una tarjeta (menos en un botón o un enlace suyo) la abre en
     grande con su contenido completo de siempre; las demás pasan a una
     fila de pestañas pequeñas, con "Volver a las tarjetas". Escape
     (js/usabilidad.js, `cerrarSiAbierta`) vuelve a la cuadrícula.
   - Toda tarjeta abierta, menos Documentos, lleva arriba una franja con
     los documentos como chips (en Hitos, los del hito desplegado si
     tiene); pulsar uno lo abre en el panel de la derecha (el mismo
     botón de la lista de documentos, pulsado por debajo), sin repintar.
   - Al entrar en una ficha, siempre la cuadrícula; desde "Qué me toca"
     (`abrirAlEntrar('hitos')`), con Hitos abierta. Un repintado de la
     misma ficha no cierra la tarjeta abierta.

   js/ficha-asunto.js monta el HTML con `html(tramite)` y llama a
   `alEntrar()` al abrir una ficha y a `alPintar(raiz, a)` al terminar
   de pintarla: puntos de enganche previstos, sin envolver nada.
   ============================================================ */
var FichaTarjetas = (function () {

  /* En el orden de la cuadrícula. `siempre`: el cuerpo se ve también con
     la tarjeta cerrada (ya es, él mismo, un resumen de una línea). */
  var TARJETAS = [
    { id: 'hitos', titulo: 'Hitos' },
    { id: 'documentos', titulo: 'Documentos de la carpeta' },
    { id: 'contacto', titulo: 'Datos y contacto', siempre: true },
    { id: 'tramite', titulo: 'Datos del trámite', siempre: true },
    { id: 'notas', titulo: 'Notas' },
    { id: 'otros', titulo: 'Otros asuntos de este tercero' },
    { id: 'relacionados', titulo: 'Personas y entidades relacionadas' }
  ];

  var abierta = null;          /* id de la tarjeta abierta en grande, o null */
  var pendienteAlEntrar = null;
  var asuntoActual = null;
  var turnoResumen = null;

  function $(id) { return document.getElementById(id); }
  function raiz() { return $('ficha-tarjetas'); }

  /* ---------- el HTML (lo pide js/ficha-asunto.js) ---------- */

  function tarjeta(id, titulo, dentro, alLado) {
    var t = TARJETAS.filter(function (x) { return x.id === id; })[0];
    return '<section class="ficha-bloque ficha-tarjeta' + (t && t.siempre ? ' ficha-tarjeta-siempre' : '') +
        '" data-tarjeta="' + id + '">' +
      (titulo ? '<h3 class="ficha-titulo">' + U.escapar(titulo) + (alLado || '') + '</h3>' : '') +
      '<div class="ficha-tarjeta-resumen"></div>' +
      '<div class="ficha-tarjeta-franja"></div>' +
      '<div class="ficha-tarjeta-cuerpo">' + dentro + '</div>' +
    '</section>';
  }

  function html(tramite) {
    return '<div class="ficha-tarjetas' + (tramite ? ' con-tramite' : '') + '" id="ficha-tarjetas">' +
      '<div class="ficha-tarjetas-pestanas" id="ficha-tarjetas-pestanas"></div>' +
      '<div class="ficha-tarjetas-rejilla" id="ficha-tarjetas-rejilla">' +
        tarjeta('hitos', 'Hitos', '<div id="ficha-guia" class="explica">Leyendo…</div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="hitos"></span>') +
        tarjeta('documentos', 'Documentos de la carpeta',
                '<div id="ficha-documentos" class="explica">Leyendo…</div>',
                '<span class="ficha-cuenta" id="ficha-cuenta-docs"></span>') +
        /* "Datos y contacto" trae su propio título (js/ficha-tercero.js). */
        tarjeta('contacto', '', '<div id="ficha-contacto-caja"></div>') +
        (tramite ? tarjeta('tramite', 'Datos del trámite', tramite) : '') +
        tarjeta('notas', 'Notas', '<div id="ficha-notas"></div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="notas"></span>') +
        tarjeta('otros', 'Otros asuntos de este tercero', '<div id="ficha-otros" class="explica">Buscando…</div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="otros"></span>') +
        tarjeta('relacionados', 'Personas y entidades relacionadas',
                '<div id="ficha-relacionados" class="explica">Leyendo…</div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="relacionados"></span>') +
      '</div>' +
    '</div>';
  }

  /* ---------- entrar, pintar, abrir y cerrar ---------- */

  /* Al entrar en una ficha, la cuadrícula. Pero si es la misma que ya
     está a la vista (la aplicación la vuelve a abrir sola tras guardar
     algo, por ejemplo al cerrar el cuadro de Correo o al generar un
     documento), se queda la tarjeta que estuviera abierta. */
  function alEntrar(a) {
    var r = raiz();
    var mismaALaVista = !!(a && asuntoActual && asuntoActual.nombre === a.nombre && r && r.offsetParent);
    if (pendienteAlEntrar) abierta = pendienteAlEntrar;
    else if (!mismaALaVista) abierta = null;
    pendienteAlEntrar = null;
  }

  /* "Qué me toca": llamar justo antes de App.abrirFicha. */
  function abrirAlEntrar(id) { pendienteAlEntrar = id || null; }

  function alPintar(caja, a) {
    asuntoActual = a || null;
    var r = raiz();
    if (!r) return;
    var rejilla = $('ficha-tarjetas-rejilla');
    if (abierta && !r.querySelector('.ficha-tarjeta[data-tarjeta="' + abierta + '"]')) abierta = null;
    rejilla.addEventListener('click', alPulsar);
    new MutationObserver(function (cambios) {
      var deVerdad = cambios.some(function (c) {
        var t = c.target.nodeType === 1 ? c.target : c.target.parentNode;
        return t && !t.closest('.ficha-tarjeta-resumen, .ficha-tarjeta-franja, .ficha-cuenta[data-cuenta-tarjeta]');
      });
      if (deVerdad) programarResumen();
    }).observe(rejilla, { childList: true, subtree: true, characterData: true });
    aplicar();
    resumirTodas();
    programarResumen();
    engancharVentana();
  }

  function abrir(id) {
    if (!raiz() || !raiz().querySelector('.ficha-tarjeta[data-tarjeta="' + id + '"]')) return;
    abierta = id;
    aplicar();
    window.scrollTo(0, 0);
  }

  function cerrar() {
    abierta = null;
    aplicar();
  }

  /* Para Escape (js/usabilidad.js): cierra la tarjeta abierta y dice si
     había una; si no, Escape hace lo de siempre en la ficha. */
  function cerrarSiAbierta() {
    var r = raiz();
    if (!abierta || !r || !r.offsetParent) return false;
    cerrar();
    return true;
  }

  function aplicar() {
    var r = raiz();
    if (!r) return;
    if (abierta) r.dataset.abierta = abierta; else delete r.dataset.abierta;
    Array.prototype.forEach.call(r.querySelectorAll('.ficha-tarjeta'), function (t) {
      t.classList.toggle('abierta', t.dataset.tarjeta === abierta);
    });
    pintarPestanas();
    pintarFranja();
    ajustarAlto();
  }

  /* Pulsar en la tarjeta, menos en lo que ya hace algo por sí mismo. */
  function alPulsar(ev) {
    var t = ev.target.closest && ev.target.closest('.ficha-tarjeta');
    if (!t) return;
    if (abierta) {
      /* Desplegar un hito cambia los documentos de la franja. */
      if (abierta === 'hitos') setTimeout(pintarFranja, 60);
      return;
    }
    if (ev.target.closest('button, a, input, textarea, select, label, summary, [contenteditable]')) return;
    abrir(t.dataset.tarjeta);
  }

  /* ---------- las pestañas de arriba, con una tarjeta abierta ---------- */

  function tituloDe(id) {
    var t = TARJETAS.filter(function (x) { return x.id === id; })[0];
    return t ? t.titulo : id;
  }

  function cuentaDe(id) {
    var r = raiz();
    var el = r && r.querySelector('.ficha-tarjeta[data-tarjeta="' + id + '"] .ficha-cuenta');
    return el ? (el.textContent || '').trim() : '';
  }

  function pintarPestanas() {
    var caja = $('ficha-tarjetas-pestanas');
    var r = raiz();
    if (!caja || !r) return;
    caja.innerHTML = '';
    if (!abierta) return;
    Array.prototype.forEach.call(r.querySelectorAll('.ficha-tarjeta'), function (t) {
      var id = t.dataset.tarjeta;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ficha-pestana' + (id === abierta ? ' activa' : '');
      b.dataset.tarjeta = id;
      var cuenta = cuentaDe(id);
      b.innerHTML = U.escapar(tituloDe(id)) + (cuenta ? ' <span class="ficha-pestana-cuenta">' + U.escapar(cuenta) + '</span>' : '');
      /* Fila 112: sin «Volver a las tarjetas»; se vuelve pulsando otra vez
         la pestaña abierta: desde un hito abierto, a la lista de hitos;
         desde ahí, a las tarjetas (lo mismo que Escape). */
      if (id === abierta) b.title = 'Volver a las tarjetas';
      b.onclick = function () {
        if (id !== abierta) { abrir(id); return; }
        if (id === 'hitos' && window.HitoMesa && HitoMesa.cerrarSiAbierta()) { pintarPestanas(); return; }
        cerrar();
      };
      caja.appendChild(b);
    });
  }

  /* ---------- la franja de documentos ---------- */

  /* Los documentos de la carpeta, tal como los pinta js/ficha-documentos.js. */
  function documentosDeLaCarpeta() {
    var caja = $('ficha-documentos');
    if (!caja) return [];
    /* El índice del expediente (fila 137) no cuenta como documento. */
    return Array.prototype.map.call(caja.querySelectorAll('button.ficha-documento:not(.ficha-documento-indice)'), function (b) {
      var spans = b.querySelectorAll(':scope > span');
      var nombre = spans.length ? spans[spans.length - 1].textContent : b.textContent;
      return { nombre: nombre, boton: b };
    });
  }

  function abrirDocumento(nombre) {
    var doc = documentosDeLaCarpeta().filter(function (d) { return d.nombre === nombre; })[0];
    if (doc) doc.boton.click();
  }

  /* En Hitos: los del hito desplegado; si no hay ninguno, o no tiene
     documentos, todos los de la carpeta. */
  function nombresParaLaFranja() {
    var todos = documentosDeLaCarpeta().map(function (d) { return d.nombre; });
    if (abierta !== 'hitos') return todos;
    var guia = $('ficha-guia');
    var cuerpo = guia && Array.prototype.filter.call(guia.querySelectorAll('.hito-cuerpo'), function (c) {
      return !c.classList.contains('oculto');
    })[0];
    if (!cuerpo) return todos;
    var delHito = Array.prototype.map.call(
      cuerpo.querySelectorAll('.hito-documento[data-doc]'), function (s) { return s.dataset.doc; })
      .filter(function (n) { return todos.indexOf(n) !== -1; });
    return delHito.length ? delHito : todos;
  }

  function nombreEnElVisor() {
    if (!document.body.classList.contains('con-visor')) return '';
    return (window.Visor && Visor.nombreAbierto) ? (Visor.nombreAbierto() || '') : '';
  }

  function pintarFranja() {
    var r = raiz();
    if (!r) return;
    Array.prototype.forEach.call(r.querySelectorAll('.ficha-tarjeta-franja'), function (f) {
      var t = f.closest('.ficha-tarjeta');
      /* Con la mesa de un hito abierta, la franja no sale: la mesa ya
         tiene sus documentos (fila 109). */
      var conMesa = abierta === 'hitos' && document.querySelector('#ficha-guia.con-mesa');
      if (!abierta || t.dataset.tarjeta !== abierta || abierta === 'documentos' || conMesa) {
        if (f.childNodes.length) f.innerHTML = '';
        delete f.dataset.firma;
        return;
      }
      var nombres = nombresParaLaFranja();
      var enVisor = nombreEnElVisor();
      var firma = nombres.join('\n') + '|' + enVisor;
      if (f.dataset.firma === firma) return;
      f.dataset.firma = firma;
      f.innerHTML = '';
      nombres.forEach(function (n) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ficha-chip-doc' + (n === enVisor ? ' activo' : '');
        chip.textContent = n;
        chip.title = 'Verlo al lado';
        chip.onclick = function (ev) { ev.stopPropagation(); abrirDocumento(n); };
        f.appendChild(chip);
      });
    });
  }

  /* ---------- los resúmenes de las tarjetas cerradas ---------- */

  function programarResumen() {
    clearTimeout(turnoResumen);
    turnoResumen = setTimeout(function () { resumirTodas(); pintarFranja(); pintarPestanas(); ajustarAlto(); }, 80);
  }

  /* Los resúmenes viven en js/ficha-tarjetas-resumen.js (fila 114). */
  var resumen = FichaTarjetasResumen.crear({
    raiz: raiz, documentos: function () { return documentosDeLaCarpeta(); },
    abrirDocumento: function (n) { abrirDocumento(n); }, abrir: function (id) { abrir(id); },
    asunto: function () { return asuntoActual; }
  });
  function resumirTodas() { resumen.todas(); }

  /* ---------- que llene el alto visible, sin bajar ---------- */

  function ajustarAlto() {
    var r = raiz();
    var rejilla = $('ficha-tarjetas-rejilla');
    if (!r || !rejilla || !rejilla.offsetParent) return;
    var caja = rejilla.getBoundingClientRect();
    var arriba = caja.top + window.scrollY;
    /* Lo que queda por debajo de la rejilla (el relleno de abajo de la
       pantalla) también tiene que caber sin desplazarse. */
    var debajo = Math.max(0, document.documentElement.scrollHeight - (caja.bottom + window.scrollY));
    var hueco = Math.max(300, window.innerHeight - arriba - debajo - 2);
    if (abierta) {
      rejilla.style.height = '';
      rejilla.style.minHeight = hueco + 'px';
    } else {
      var columnas = getComputedStyle(rejilla).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      var filas = Math.ceil(rejilla.querySelectorAll('.ficha-tarjeta').length / columnas);
      rejilla.style.minHeight = '';
      rejilla.style.height = Math.max(hueco, filas * 130) + 'px';
      resumen.medir();   /* cuántos documentos caben enteros (fila 114) */
    }
  }

  var ventanaEnganchada = false;
  function engancharVentana() {
    if (ventanaEnganchada) return;
    ventanaEnganchada = true;
    window.addEventListener('resize', ajustarAlto);
    /* Abrir o cerrar el documento de la derecha cambia el ancho (y con él
       las columnas), y el chip que va marcado. */
    new MutationObserver(function () { ajustarAlto(); pintarFranja(); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (window.Visor && Visor.alCambiar) Visor.alCambiar(function () { pintarFranja(); });
  }

  return {
    html: html, alEntrar: alEntrar, alPintar: alPintar, abrirAlEntrar: abrirAlEntrar,
    abrir: abrir, cerrar: cerrar, cerrarSiAbierta: cerrarSiAbierta,
    abierta: function () { return abierta; },
    alCambiarLaMesa: function () { pintarFranja(); },
    ajustarAlto: ajustarAlto
  };
})();
