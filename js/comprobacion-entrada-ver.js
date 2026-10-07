/* ============================================================
   comprobacion-entrada-ver.js — la marca de la barra lateral y el
   panel de «Comprobación al entrar» (29-sep-2026, fila 204,
   docs/COMPROBACION-AL-ENTRAR.md). Las comprobaciones en sí están
   en js/comprobacion-entrada.js.

   - Al entrar (una sola vez, en segundo plano, sin retrasar la
     primera pantalla) se revisa todo. Si está bien: marca verde
     «✓ Todo configurado» y ningún panel. Si falta algo: sale el
     panel una vez y la marca pasa a ámbar «⚠ N por configurar».
   - Pulsar la marca abre el panel cuando se quiera.
   - «Arreglarlo» cierra el panel y lleva a donde se configura; la
     marca se recalcula sola en el siguiente repintado.
   - El panel usa U.preguntar (un solo cuadro a la vez): si hay otro
     abierto, espera a que se cierre.
   - La marca vive en la barra lateral, que está fija en todas las
     pantallas (es la «cabecera fija» de este aviso: la de cada
     pantalla cambia de sitio y de forma).
   - Sin panel automático en la copia de pruebas ni bajo un navegador
     automatizado (`navigator.webdriver`, salvo que la prueba pida lo
     contrario con `window.__COMPROBACION_ABRIR_PANEL__`): allí solo
     la marca, para no tapar a quien esté probando otra cosa. Y bajo
     un navegador automatizado que no sea la copia de pruebas, ni se
     revisa (ver `noArrancar`).
   ============================================================ */
(function () {
  'use strict';
  var C = window.ComprobacionEntrada;
  if (!C) return;

  var filas = null;          /* lo último revisado */
  var revisando = false;
  var yaMirado = false;
  var recalcular = false;    /* tras «Arreglarlo»: recalcular sin panel en el próximo repintado */

  function $(id) { return document.getElementById(id); }

  function esc(t) { return (window.U && U.escapar) ? U.escapar(t) : String(t); }

  function sinPanelAutomatico() {
    if (window.__COMPROBACION_ABRIR_PANEL__) return false;
    if (window.Demo && Demo.activo && Demo.activo()) return true;
    return !!(navigator && navigator.webdriver);
  }

  /* Bajo un navegador automatizado (las pruebas de las demás filas) ni
     se revisa: esas pruebas cuentan las lecturas de disco de lo suyo y
     esta revisión, una vez por entrada, les sumaría lecturas. En la
     copia de pruebas sí (ahí el revisor comprueba la marca). */
  function noArrancar() {
    if (window.__COMPROBACION_ABRIR_PANEL__) return false;
    if (window.Demo && Demo.activo && Demo.activo()) return false;
    return !!(navigator && navigator.webdriver);
  }

  /* ---------- la marca ---------- */

  function marca() {
    var m = $('comprobacion-marca');
    if (m) return m;
    var pie = document.querySelector('.lateral-pie');
    if (!pie) return null;
    m = document.createElement('button');
    m.type = 'button';
    m.id = 'comprobacion-marca';
    m.className = 'comprobacion-marca oculto';
    m.onclick = function () { abrirPanel(); };
    pie.insertBefore(m, pie.firstChild);
    return m;
  }

  function pintarMarca() {
    var m = marca();
    if (!m) return;
    if (!filas) { m.classList.add('oculto'); registrarProblema(0); return; }
    var faltan = filas.filter(C.cuentanComoFalta).length;
    var hayRoja = filas.some(function (f) { return f.estado === 'falta' && !f.ambar; });
    m.classList.remove('oculto', 'comprobacion-bien', 'comprobacion-ambar', 'comprobacion-roja');
    if (!faltan) {
      m.textContent = '✓ Todo configurado';
      m.classList.add('comprobacion-bien');
    } else {
      m.textContent = '⚠ ' + faltan + ' por configurar';
      m.classList.add(hayRoja ? 'comprobacion-roja' : 'comprobacion-ambar');
    }
    m.title = 'Comprobación al entrar: pulsa para ver el detalle';
    registrarProblema(faltan);
  }

  /* Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): lo que falta, como tarjeta de «Problemas». Lo
     marcado como «No lo uso en este ordenador» no cuenta (cuentanComoFalta). */
  function registrarProblema(faltan) {
    if (!window.Problemas || !window.ProblemasTextos) return;
    if (!faltan) { Problemas.registrar('configurar', null); return; }
    var d = ProblemasTextos.configurar(faltan);
    d.acciones[0].alPulsar = function () { return abrirPanel(); };
    Problemas.registrar('configurar', d);
  }

  /* ---------- el panel ---------- */

  var ETIQUETA = { bien: 'Bien', falta: 'Falta', 'sin-comprobar': 'Sin comprobar', omitida: 'No se usa aquí' };

  function htmlFila(f) {
    var clase = f.estado === 'bien' ? 'bien' : f.estado === 'omitida' ? 'omitida' :
      f.estado === 'sin-comprobar' ? 'gris' : (f.ambar ? 'ambar' : 'roja');
    var botones = '';
    if (f.estado === 'falta' || f.estado === 'sin-comprobar') {
      if (f.arreglar) botones += '<button type="button" class="boton boton-principal" data-arreglar="' + esc(f.id) + '">Arreglarlo</button>';
      botones += '<button type="button" class="comprobacion-enlace" data-omitir="' + esc(f.id) + '">No lo uso en este ordenador</button>';
    } else if (f.estado === 'omitida') {
      botones += '<button type="button" class="comprobacion-enlace" data-revisar="' + esc(f.id) + '">Volver a revisarla</button>';
    }
    return '<li class="comprobacion-fila comprobacion-' + clase + '" data-id="' + esc(f.id) + '">' +
      '<span class="comprobacion-punto"></span>' +
      '<div class="comprobacion-texto"><strong>' + esc(f.titulo) + '</strong> ' +
      '<span class="comprobacion-estado">' + ETIQUETA[f.estado] + '</span>' +
      (f.frase ? '<div>' + esc(f.frase) + '</div>' : '') + '</div>' +
      '<div class="comprobacion-botones">' + botones + '</div></li>';
  }

  function htmlPanel() {
    var sinNinguna = filas.length && filas.every(function (f) { return f.estado === 'sin-comprobar'; });
    return (sinNinguna ? '<p class="aviso aviso-ambar">No he podido comprobar nada ahora mismo. Prueba a volver a comprobar.</p>' : '') +
      '<ul class="comprobacion-lista">' + filas.map(htmlFila).join('') + '</ul>';
  }

  function esperarQueNoHayaCuadro() {
    return new Promise(function (resolver) {
      (function mirar() {
        var capa = $('capa');
        if (!capa || capa.classList.contains('oculto')) resolver();
        else setTimeout(mirar, 400);
      })();
    });
  }

  var panelAbierto = false;

  async function abrirPanel() {
    if (panelAbierto || !filas) return;
    panelAbierto = true;
    try {
      await esperarQueNoHayaCuadro();
      var seguir = true;
      while (seguir) {
        var accion = null;
        var promesa = U.preguntar('Comprobación al entrar', htmlPanel(), 'Volver a comprobar');
        var cancelar = $('cuadro-cancelar');
        var textoCancelar = cancelar.textContent;
        cancelar.textContent = 'Ahora no';
        var cuerpo = $('cuadro-cuerpo');
        Array.prototype.forEach.call(cuerpo.querySelectorAll('[data-arreglar]'), function (b) {
          b.onclick = function () {
            var f = filas.filter(function (x) { return x.id === b.dataset.arreglar; })[0];
            accion = function () { recalcular = true; if (f && f.arreglar) f.arreglar(); };
            cancelar.click();
          };
        });
        ['omitir', 'revisar'].forEach(function (que) {
          Array.prototype.forEach.call(cuerpo.querySelectorAll('[data-' + que + ']'), function (b) {
            b.onclick = function () {
              var id = b.dataset[que];
              if (que === 'omitir') C.omitir(id); else C.volverARevisar(id);
              accion = 'recomprobar';
              cancelar.click();
            };
          });
        });
        var acepto = await promesa;
        cancelar.textContent = textoCancelar;
        if (typeof accion === 'function') { seguir = false; accion(); }
        else if (accion === 'recomprobar' || acepto) { await comprobar(); }
        else seguir = false;
      }
    } finally { panelAbierto = false; }
  }

  /* ---------- revisar ---------- */

  async function comprobar() {
    if (revisando) return;
    revisando = true;
    try { filas = await C.revisar(); }
    catch (e) { filas = null; }
    finally { revisando = false; }
    pintarMarca();
  }

  async function alEntrar() {
    await comprobar();
    if (filas && filas.some(C.cuentanComoFalta) && !sinPanelAutomatico()) abrirPanel();
  }

  /* Una sola vez por entrada, cuando ya hay datos y el _GESTOR; y, tras
     «Arreglarlo», una vez más sin panel. */
  function alRefrescar() {
    if (!window.App || !App.E || !App.E.datos || !App.E.registro || !App.E.gestor) return;
    if (!yaMirado) {
      yaMirado = true;
      if (noArrancar()) return;
      setTimeout(alEntrar, 2500);
    } else if (recalcular && !panelAbierto) {
      recalcular = false;
      setTimeout(comprobar, 1200);
    }
  }

  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  C.abrirPanel = abrirPanel;
  C.comprobar = comprobar;
  C.filas = function () { return filas; };
})();
