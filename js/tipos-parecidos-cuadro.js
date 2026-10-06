/* ============================================================
   tipos-parecidos-cuadro.js — el cuadro «Tipos de asunto parecidos»
   (fila 277, docs/TIPOS-QUE-SON-EL-MISMO.md, punto 2).

   Un solo `U.preguntar` (con «Cerrar») y una fila por pareja: los dos
   nombres con su categoría y sus asuntos abiertos, y «Unir» y «No son el
   mismo». «Unir» no abre otro cuadro: la propia fila pasa a preguntar
   «¿Con cuál te quedas?», con el mismo resumen de «Unir con otro tipo»
   (`TiposUnir.textoResumen`). La lógica de cada pareja vive en
   js/tipos-parecidos.js.
   ============================================================ */
var TiposParecidosCuadro = (function () {

  var lista = [];       /* las parejas que se enseñan */
  var uniendo = null;   /* la pareja que está preguntando «¿Con cuál te quedas?» */
  var cerrada = true;

  function $(id) { return document.getElementById(id); }

  function abiertos(t) { return (App.E.listaAbiertos || []).filter(function (a) { return App.tipoDeAsunto(a) === t.tipo; }).length; }

  function conGuia(t) {
    var p = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(t.tipo)) || [];
    return p.length > 0 && !(window.EstadoHito && EstadoHito.esGuiaMinima(p));
  }

  /* Con cuál se queda de partida: el nombre nuevo si uno es el antiguo del otro; si no, el que tiene guía de verdad;
     si los dos o ninguno, el que tiene más asuntos abiertos; si empatan, el de nombre más largo. */
  function quedaDePartida(p) {
    if (p.antiguo) return p.antiguo.nuevo;
    var ga = conGuia(p.a), gb = conGuia(p.b);
    if (ga !== gb) return ga ? p.a : p.b;
    var oa = abiertos(p.a), ob = abiertos(p.b);
    if (oa !== ob) return oa > ob ? p.a : p.b;
    return p.a.tipo.length >= p.b.tipo.length ? p.a : p.b;
  }

  function nombreConDatos(t) {
    return '<strong>' + U.escapar(t.tipo) + '</strong> <span class="suave">(' + U.escapar(t.categoria || '') + ' · ' + abiertos(t) +
      (abiertos(t) === 1 ? ' asunto abierto' : ' asuntos abiertos') + ')</span>';
  }

  function filaNormal(p, i) {
    return '<div class="tp-fila" data-i="' + i + '">' +
      '<div class="tp-nombres">' + nombreConDatos(p.a) + '<br>' + nombreConDatos(p.b) + '</div>' +
      (p.antiguo ? '<div class="nota">«' + U.escapar(p.antiguo.viejo.tipo) + '» es el nombre antiguo de «' + U.escapar(p.antiguo.nuevo.tipo) + '».' +
        (p.motivo ? ' No se unen solos: ' + U.escapar(p.motivo) + '.' : '') + '</div>' : '') +
      '<div class="tp-botones"><button type="button" class="boton" data-accion="unir">Unir</button>' +
      '<button type="button" class="boton" data-accion="distintos">No son el mismo</button></div></div>';
  }

  function filaUniendo(p, i) {
    var quedan = quedaDePartida(p);
    var opciones = [p.a, p.b].map(function (t, k) {
      return '<label class="tp-opcion"><input type="radio" name="tp-quedan-' + i + '" value="' + k + '"' + (t === quedan ? ' checked' : '') + '> ' +
        U.escapar(t.tipo) + '</label>';
    }).join('');
    return '<div class="tp-fila tp-uniendo" data-i="' + i + '">' +
      '<div class="etiqueta">¿Con cuál te quedas?</div>' + opciones +
      '<p class="nota tp-resumen"></p>' +
      '<div class="tp-botones"><button type="button" class="boton boton-principal" data-accion="confirmar">Unir</button>' +
      '<button type="button" class="boton" data-accion="volver">Volver</button></div></div>';
  }

  function elegido(i) {
    var p = lista[i];
    var r = document.querySelector('#tp-lista [name="tp-quedan-' + i + '"]:checked');
    var quedan = r ? [p.a, p.b][parseInt(r.value, 10)] : quedaDePartida(p);
    return { quedan: quedan, desaparece: quedan === p.a ? p.b : p.a };
  }

  function pintar() {
    var caja = $('tp-lista');
    if (!caja) return;
    if (!lista.length) { cerrar(); return; }
    caja.innerHTML = lista.map(function (p, i) { return uniendo === p ? filaUniendo(p, i) : filaNormal(p, i); }).join('');
    Array.prototype.forEach.call(caja.querySelectorAll('.tp-fila'), function (fila) {
      var i = parseInt(fila.dataset.i, 10);
      var p = lista[i];
      function boton(accion) { return fila.querySelector('[data-accion="' + accion + '"]'); }
      if (boton('unir')) boton('unir').onclick = function () { uniendo = p; pintar(); };
      if (boton('volver')) boton('volver').onclick = function () { uniendo = null; pintar(); };
      if (boton('distintos')) boton('distintos').onclick = function () { noSonElMismo(p); };
      if (boton('confirmar')) {
        var resumen = fila.querySelector('.tp-resumen');
        function repintarResumen() { var e = elegido(i); resumen.innerHTML = TiposUnir.textoResumen(e.desaparece, e.quedan); }
        Array.prototype.forEach.call(fila.querySelectorAll('input[type="radio"]'), function (r) { r.onchange = repintarResumen; });
        repintarResumen();
        boton('confirmar').onclick = function () { unir(i); };
      }
    });
  }

  function cerrar() {
    if (cerrada) return;
    var b = $('cuadro-aceptar');
    if (b) b.click();
  }

  async function recalcular() {
    uniendo = null;
    try { lista = await TiposParecidos.parejas(); } catch (e) { lista = []; }
    TiposParecidos.repintarAviso();
    pintar();
  }

  async function noSonElMismo(p) {
    try {
      await TiposParecidos.apuntarDistinto(p.a, p.b);
      /* Si uno era el nombre antiguo del otro, deja de serlo: si no, la app volvería a intentar unirlos. */
      if (p.antiguo) {
        var nuevo = p.antiguo.nuevo, k = U.normalizar(String(p.antiguo.viejo.tipo)).trim();
        nuevo.alias = (nuevo.alias || []).filter(function (x) { return U.normalizar(String(x || '')).trim() !== k; });
        await App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); });
      }
    } catch (e) { U.fallo('No he podido apuntarlo', e); return; }
    await recalcular();
  }

  async function unir(i) {
    var e = elegido(i);
    var resultado;
    try { resultado = await TiposUnir.unir(e.desaparece, e.quedan); }
    catch (err) { U.fallo('No se han podido unir', err); return; }
    await TiposUnir.despuesDeUnir(e.desaparece, e.quedan);
    TiposUnir.avisarUnidos(e.quedan, resultado);
    await recalcular();
  }

  async function abrir() {
    if (!cerrada) return;
    try { lista = await TiposParecidos.parejas(); } catch (e) { lista = []; }
    if (!lista.length) return;
    uniendo = null;
    cerrada = false;
    var promesa = U.preguntar('Tipos de asunto parecidos', '<div id="tp-lista" class="tp-lista"></div>', 'Cerrar', true);
    pintar();
    await promesa;
    cerrada = true;
    TiposParecidos.repintarAviso();
  }

  return { abrir: abrir, quedaDePartida: quedaDePartida };
})();
window.TiposParecidosCuadro = TiposParecidosCuadro;
