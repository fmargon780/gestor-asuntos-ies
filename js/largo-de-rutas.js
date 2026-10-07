/* ============================================================
   largo-de-rutas.js — Ajustes → El centro → «Largo de las rutas»
   (30-sep-2026, fila 239, docs/NOMBRES-FIJOS-CON-NUMERO.md, apartado 6).

   Calcula el peor caso de una ruta completa dentro de Dropbox con la
   ruta real (`rutas.json` y la raíz de Dropbox de este ordenador): la
   categoría más larga, el tercero más largo del catálogo, el tipo de
   asunto más largo, el tipo de documento más largo, la subcarpeta de
   previas y los números (`Nombres.medidor`, js/nombres-topes.js).

   «Quedan N caracteres de margen»: verde; ámbar por debajo de 20; rojo
   si no cabe (entonces también entra en la comprobación al entrar, con
   lo que más ocupa). Las carpetas ASUNTOS ABIERTOS y ARCHIVO no se
   mueven: el medidor solo avisa.
   ============================================================ */
var LargoDeRutas = (function () {

  var UMBRAL_AMBAR = 20;

  /* { clase: 'verde'|'ambar'|'rojo'|'gris', frase } a partir de lo que devuelve Nombres.medidor. */
  function veredicto(m) {
    if (!m || !m.conocido) {
      return { clase: 'gris', frase: 'Todavía no se sabe: falta apuntar la ruta de la carpeta ARCHIVO en «Rutas de las carpetas».' };
    }
    if (m.margen < 0) {
      return { clase: 'rojo', frase: 'La ruta más larga no cabe: se pasa ' + (-m.margen) + ' caracteres. Lo que más ocupa es ' +
        m.masOcupa.texto + '.' };
    }
    if (m.margen < UMBRAL_AMBAR) {
      return { clase: 'ambar', frase: 'Quedan ' + m.margen + ' caracteres de margen. Lo que más ocupa es ' + m.masOcupa.texto + '.' };
    }
    return { clase: 'verde', frase: 'Quedan ' + m.margen + ' caracteres de margen.' };
  }

  async function pintar() {
    var el = document.getElementById('largo-rutas-margen');
    if (!el) return;
    el.textContent = 'Calculando…';
    var m;
    try { m = await Nombres.medidor(); }
    catch (e) { el.className = 'aviso-en-vivo'; el.textContent = 'No he podido calcularlo: ' + U.mensajeDeError(e); return; }
    var v = veredicto(m);
    el.className = 'aviso-en-vivo largo-rutas-' + v.clase + ' ' +
      (v.clase === 'verde' ? 'aviso-en-vivo-bueno' : v.clase === 'rojo' ? 'aviso-en-vivo-malo' : v.clase === 'ambar' ? 'aviso-en-vivo-ambar' : '');
    el.textContent = v.frase;
    var det = document.getElementById('largo-rutas-detalle');
    if (det && m.conocido) {
      det.innerHTML = '<p class="nota">Peor caso: categoría «' + U.escapar(m.categoria) + '», tercero «' + U.escapar(m.tercero) +
        '», asunto «' + U.escapar(m.peorAsunto) + '», subcarpeta «' + U.escapar(m.previas) + '» y un documento de ' +
        m.peorDocumento + ' caracteres. Tope de la ruta entera: ' + m.tope + '.</p>';
    } else if (det) { det.innerHTML = ''; }
  }

  /* Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): si la ruta más larga no cabe, la tarjeta «La ruta
     más larga no cabe» de «Problemas». Mide al abrir Ajustes. */
  async function calcularProblema() {
    if (!window.Problemas || !window.ProblemasTextos || !window.Nombres || !Nombres.medidor) return;
    var m;
    try { m = await Nombres.medidor(); } catch (e) { return; }
    if (!m || !m.conocido || m.margen >= 0) { Problemas.registrar('rutas', null); return; }
    var d = ProblemasTextos.rutas(m);
    d.acciones[0].alPulsar = function () { App.irASeccionDeAjustes('#bloque-largo-rutas'); };
    d.acciones[1].alPulsar = async function () { await Problemas.recalcular('rutas'); pintar(); U.aviso('He vuelto a medir la ruta.', ''); };
    Problemas.registrar('rutas', d);
  }
  /* Medir lee el catálogo de terceros: solo al abrir Ajustes (la comprobación al entrar ya cuenta si no cabe). */
  if (window.Problemas) Problemas.calculador('rutas', function (forzar) { return forzar ? calcularProblema() : null; });

  function ponerBloque() {
    var tab = document.getElementById('ajustes-tab-centro');
    if (!tab || document.getElementById('bloque-largo-rutas')) return;
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = 'bloque-largo-rutas';
    det.innerHTML =
      '<summary><span class="bloque-titulo">Largo de las rutas</span>' +
      '<span class="bloque-pie">Cuánto margen queda antes de que Windows no sincronice un nombre</span></summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="nota">Con la estructura fija de los nombres (número de asunto y de documento), el nombre no se recorta nunca: ' +
        'aquí se comprueba que el caso más largo cabe.</p>' +
        '<div id="largo-rutas-margen" class="aviso-en-vivo"></div>' +
        '<div id="largo-rutas-detalle"></div>' +
      '</div>';
    tab.appendChild(det);
    det.addEventListener('toggle', function () { if (det.open) pintar(); });
  }

  ponerBloque();
  return { veredicto: veredicto, pintar: pintar, ponerBloque: ponerBloque, UMBRAL_AMBAR: UMBRAL_AMBAR };
})();
window.LargoDeRutas = LargoDeRutas;
