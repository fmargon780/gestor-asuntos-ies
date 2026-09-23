/* ============================================================
   copiar-ruta.js — el botón «Ruta» de la ficha del asunto, que copia
   la ruta de su carpeta para pegarla en el explorador de archivos
   (23-sep-2026, fila 98, docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md).

   Abrir la carpeta desde la web sigue sin poderse (lo tiene prohibido
   el navegador, y está en la lista de descartado). Tampoco da la ruta
   de verdad: los manejadores de carpeta solo saben su nombre. Así que
   la parte de delante la apunta cada uno, una vez, en Ajustes → El
   centro → «Rutas de las carpetas en este ordenador».

   Se guarda en ESTE ordenador (localStorage), nunca en `_GESTOR`: la
   ruta del ordenador de Francisco no es la de su compañero.

   Qué copia:
     - abierto:   ruta de abiertos + nombre de la carpeta
     - archivado: ruta del ARCHIVO + lo de en medio (`a.ruta` del índice,
       "CATEGORIA / Tercero", o categoría y tercero si no está) + nombre
   Con `\` si la ruta apuntada empieza por una letra de unidad o por
   `\\`; con `/` en los demás casos. Sin ruta apuntada, copia solo el
   nombre de la carpeta y avisa de dónde apuntarla.

   Lo pone js/ficha-nombre-acciones.js en la fila de copiar, detrás de
   «Asunto», con `RutaCarpetas.boton(a, modo)`. Lleva la clase
   `boton-copiar-fila`: en modo consulta sigue encendido (copiar no
   cambia nada).
   ============================================================ */
window.RutaCarpetas = (function () {

  var CLAVES = { abiertos: 'gestor-ruta-abiertos', archivo: 'gestor-ruta-archivo' };

  function leer(cual) {
    try { return (window.localStorage.getItem(CLAVES[cual]) || '').trim(); } catch (e) { return ''; }
  }

  function guardar(cual, valor) {
    try { window.localStorage.setItem(CLAVES[cual], String(valor || '').trim()); } catch (e) { /* sin memoria: nada */ }
  }

  function separadorDe(base) {
    return (/^[A-Za-z]:/.test(base) || /^\\\\/.test(base)) ? '\\' : '/';
  }

  /* Une la base con las piezas, con el separador que toque y sin
     barras repetidas por delante ni por detrás de cada pieza. */
  function unir(base, piezas) {
    var sep = separadorDe(base);
    var limpia = base.replace(/[\\\/]+$/, '');
    var resto = piezas.filter(Boolean).map(function (p) { return String(p).replace(/^[\\\/]+|[\\\/]+$/g, ''); });
    return [limpia].concat(resto).join(sep);
  }

  /* Lo de en medio de un asunto archivado, en piezas. */
  function piezasDelArchivo(a) {
    if (a.ruta) return String(a.ruta).split(' / ').map(function (x) { return x.trim(); }).filter(Boolean);
    var ficha = a.ficha || {};
    var categoria = a.categoria || ficha.categoria || '';
    var tercero = a.tercero !== undefined ? a.tercero : (ficha.tercero || '');
    return [categoria, tercero].filter(Boolean);
  }

  /* { texto, completa }: completa es false si falta la ruta apuntada. */
  function de(a, modo) {
    var archivado = modo === 'archivado';
    var base = leer(archivado ? 'archivo' : 'abiertos');
    if (!base) return { texto: a.nombre, completa: false };
    return {
      texto: unir(base, (archivado ? piezasDelArchivo(a) : []).concat([a.nombre])),
      completa: true
    };
  }

  function boton(a, modo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-copiar-fila';
    b.textContent = 'Ruta';
    b.title = 'Copiar la ruta de la carpeta, para pegarla en el explorador de archivos';
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      var r = de(a, modo);
      U.copiar(r.texto, b, { avisoFallo: 'No he podido copiarlo. Es ' + r.texto + '.' });
      if (!r.completa) U.aviso('Apunta la ruta de tus carpetas en Ajustes → El centro para copiarla entera.', 'ambar');
    };
    return b;
  }

  /* ---------- el bloque de Ajustes → El centro ---------- */

  function ponerBloque() {
    var tab = document.getElementById('ajustes-tab-centro');
    if (!tab || document.getElementById('bloque-rutas')) return;
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = 'bloque-rutas';
    det.innerHTML =
      '<summary><span class="bloque-titulo">Rutas de las carpetas en este ordenador</span>' +
      '<span class="bloque-pie">Para el botón «Ruta» de la ficha del asunto</span></summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="nota">Se guardan solo en este ordenador, no en la carpeta compartida: la ruta ' +
        'de cada ordenador es distinta. Cópiala de la barra del explorador de archivos.</p>' +
        '<label class="etiqueta">Ruta de la carpeta de asuntos abiertos en este ordenador</label>' +
        '<input id="ruta-abiertos" class="campo" placeholder="C:\\Users\\nombre\\Dropbox\\...\\ASUNTOS ABIERTOS">' +
        '<label class="etiqueta">Ruta de la carpeta ARCHIVO en este ordenador</label>' +
        '<input id="ruta-archivo" class="campo" placeholder="C:\\Users\\nombre\\Dropbox\\...\\ARCHIVO">' +
      '</div>';
    tab.appendChild(det);
    ['abiertos', 'archivo'].forEach(function (cual) {
      var campo = document.getElementById('ruta-' + cual);
      campo.value = leer(cual);
      campo.onchange = function () { guardar(cual, campo.value); U.aviso('Ruta guardada en este ordenador.', 'bueno'); };
    });
  }

  ponerBloque();

  return { leer: leer, guardar: guardar, unir: unir, de: de, boton: boton, ponerBloque: ponerBloque };
})();
