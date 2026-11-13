/* ============================================================
   ficha-tarjetas.js — la vista del asunto: el hito a la izquierda y, a la
   derecha, cinco bloques plegados (13-nov-2026, fila 637,
   docs/637-VISTA-DEL-ASUNTO-CABECERA-Y-PANEL.md; antes, seis pestañas,
   filas 107 y 425).

   - Arriba, la fila de hitos (`#ficha-tira`, la pinta js/hito-mesa.js) con, a
     su derecha, `#ficha-acciones` (vencimiento, «Esperando a…», «Comunicar»).
   - «Trabajo» son dos columnas de igual ancho: a la izquierda el hito entero
     de arriba abajo (`#ficha-guia`, js/hitos-panel.js y js/hito-mesa.js) y a
     la derecha los bloques plegados (`#ficha-plegables`), o el documento
     abierto tapándolos (js/ficha-trabajo-visor.js).
   - Los bloques, en este orden, cada uno con su icono: Datos, Personas y
     entidades relacionadas, Documentos de la carpeta, Registro y Otros
     asuntos de este tercero (y «La actividad» / «Candidaturas» al principio,
     solo donde existen: filas 306 y 347). Se abren y se pliegan al pulsar su
     título; cuáles están abiertos se recuerda mientras no se salga del asunto.
   - Los huecos de dentro (`#ficha-documentos`, `#ficha-notas`, `#ficha-otros`,
     `#ficha-relacionados`…) son los de siempre y los sigue pintando el mismo
     módulo. «Datos» lo pinta js/ficha-datos-bloque.js.

   js/ficha-asunto.js monta el HTML con `html(tramite, a)` y llama a
   `alEntrar()` al abrir una ficha y a `alPintar(raiz, a)` al terminar de
   pintarla.

   `abrir(id)` se queda por quien lo llamaba con el nombre de una pestaña: ahora
   abre el bloque que corresponde (`contacto` y `tramite` son «Datos»).
   ============================================================ */
var FichaTarjetas = (function () {

  /* En el orden de los bloques. `icono`: el de su título. */
  var BLOQUES = [
    { id: 'actividad', titulo: 'La actividad', icono: '🎯' },        /* fila 306: solo en un asunto de actividad extraescolar */
    { id: 'candidaturas', titulo: 'Candidaturas', icono: '🗳️' },    /* fila 347: solo en el asunto de unas elecciones */
    { id: 'datos', titulo: 'Datos', icono: '📋' },
    { id: 'relacionados', titulo: 'Personas y entidades relacionadas', icono: '👥', cuenta: true },
    { id: 'documentos', titulo: 'Documentos de la carpeta', icono: '📁', cuentaId: 'ficha-cuenta-docs' },
    { id: 'notas', titulo: 'Registro', icono: '📝', cuenta: true },
    { id: 'otros', titulo: 'Otros asuntos de este tercero', icono: '🗂️', cuenta: true }
  ];

  /* Los nombres de las pestañas de antes. */
  var ALIAS = { hitos: 'trabajo', contacto: 'datos', tramite: 'datos', carpeta: 'documentos' };
  function idDe(id) { return ALIAS[id] || id || 'trabajo'; }

  var abiertos = {};           /* { <id del bloque>: true } mientras se está en el asunto */
  var pendienteAlEntrar = null;
  var asuntoActual = null;
  var turnoResumen = null;

  function $(id) { return document.getElementById(id); }
  function raiz() { return $('ficha-tarjetas'); }

  /* ---------- el HTML (lo pide js/ficha-asunto.js) ---------- */

  function bloque(b, dentro) {
    var abierto = !!abiertos[b.id];
    return '<section class="ficha-tarjeta ficha-plegable' + (abierto ? ' abierto' : '') + '" data-tarjeta="' + b.id + '">' +
      '<div class="plegable-cab" role="button" tabindex="0" aria-expanded="' + (abierto ? 'true' : 'false') + '">' +
        '<span class="plegable-flecha" aria-hidden="true">▸</span>' +
        '<span class="plegable-icono" aria-hidden="true">' + b.icono + '</span>' +
        '<b class="ficha-titulo plegable-titulo">' + U.escapar(b.titulo) + '</b>' +
        (b.cuenta ? '<span class="ficha-cuenta" data-cuenta-tarjeta="' + b.id + '"></span>' : '') +
        (b.cuentaId ? '<span class="ficha-cuenta" id="' + b.cuentaId + '"></span>' : '') +
        '<span class="plegable-resumen" data-resumen-bloque="' + b.id + '"></span>' +
      '</div>' +
      '<div class="plegable-dentro ficha-tarjeta-cuerpo">' + dentro + '</div>' +
    '</section>';
  }

  function html(tramite, a) {
    var conActividad = !!(window.Actividades && Actividades.tarjetaAplica(a));   /* fila 306 */
    var conCandidaturas = !!(window.Candidaturas && Candidaturas.aplica(a));   /* fila 347 */
    var dentro = {
      actividad: '<div id="ficha-actividad" class="explica">Leyendo…</div>',
      candidaturas: '<div id="ficha-candidaturas" class="explica">Leyendo…</div>',
      datos: '<div id="ficha-datos-bloque" class="datos-bloque"><p class="explica">Leyendo…</p></div>',
      relacionados: '<div id="ficha-relacionados" class="explica">Leyendo…</div>',
      /* El hueco lleva su propia barra de botones («+ Añadir documento», «Generar documento»…) que pinta js/ficha-documentos.js. */
      documentos: '<section class="ficha-bloque trabajo-carpeta" id="trabajo-carpeta"><h3 class="ficha-titulo ficha-titulo-barra"></h3><div id="ficha-documentos" class="explica">Leyendo…</div></section>',
      notas: '<div id="ficha-notas"></div>',
      otros: '<div id="ficha-otros" class="explica">Buscando…</div>'
    };
    var plegables = BLOQUES.filter(function (b) {
      return (b.id !== 'actividad' || conActividad) && (b.id !== 'candidaturas' || conCandidaturas);
    }).map(function (b) { return bloque(b, dentro[b.id]); }).join('');
    return '<div class="ficha-tarjetas" id="ficha-tarjetas" data-abierta="trabajo">' +
      '<div class="ficha-tira-fila">' +
        '<div class="ficha-tira" id="ficha-tira"></div>' +
        '<div class="ficha-acciones" id="ficha-acciones"></div>' +
      '</div>' +
      '<section class="ficha-tarjeta ficha-trabajo abierta" data-tarjeta="trabajo">' +
        '<div class="trabajo-columnas" id="trabajo-columnas">' +
          '<div class="trabajo-col trabajo-izq ficha-bloque" id="trabajo-izq">' +
            '<div id="ficha-guia" class="explica">Leyendo…</div>' +
          '</div>' +
          '<div class="trabajo-col trabajo-der" id="trabajo-der">' +
            '<div class="ficha-plegables" id="ficha-plegables">' + plegables + '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  /* ---------- entrar, pintar, abrir y plegar ---------- */

  /* Al entrar en una ficha nueva, todos los bloques plegados. Si es la misma que ya está a la vista (la aplicación la vuelve
     a abrir sola tras guardar algo), se quedan como estaban. */
  function alEntrar(a) {
    var r = raiz();
    var mismaALaVista = !!(a && asuntoActual && asuntoActual.nombre === a.nombre && r && r.offsetParent);
    if (!mismaALaVista) abiertos = {};
    if (pendienteAlEntrar && pendienteAlEntrar !== 'trabajo') abiertos[pendienteAlEntrar] = true;
    pendienteAlEntrar = null;
    if (window.HitoMesa && HitoMesa.alEntrarEnLaFicha) HitoMesa.alEntrarEnLaFicha(a, mismaALaVista);   /* fila 425: el hito de partida */
  }

  /* "Qué me toca": llamar justo antes de App.abrirFicha. */
  function abrirAlEntrar(id) { pendienteAlEntrar = id ? idDe(id) : null; }

  function alPintar(caja, a) {
    asuntoActual = a || null;
    var r = raiz();
    if (!r) return;
    if (window.AsuntoDeGrupo) AsuntoDeGrupo.titularTarjeta(r, a);   /* fila 293 */
    var plegables = $('ficha-plegables');
    new MutationObserver(function (cambios) {
      var deVerdad = cambios.some(function (c) {
        var t = c.target.nodeType === 1 ? c.target : c.target.parentNode;
        return t && !t.closest('.ficha-cuenta');
      });
      if (deVerdad) programarResumen();
    }).observe(plegables, { childList: true, subtree: true, characterData: true });
    engancharCabezas();
    resumirTodas();
    programarResumen();
    engancharVentana();
    ajustarAlto();
    if (window.FichaTrabajoVisor) FichaTrabajoVisor.ubicar();
  }

  function bloqueDe(id) {
    var r = raiz();
    return r && r.querySelector('.ficha-plegable[data-tarjeta="' + id + '"]');
  }

  function poner(id, abierto) {
    var b = bloqueDe(id);
    if (!b) return;
    if (abierto) abiertos[id] = true; else delete abiertos[id];
    b.classList.toggle('abierto', !!abierto);
    var cab = b.querySelector('.plegable-cab');
    if (cab) cab.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    ajustarAlto();
  }

  function engancharCabezas() {
    Array.prototype.forEach.call(document.querySelectorAll('#ficha-plegables .plegable-cab'), function (cab) {
      var id = cab.parentNode.dataset.tarjeta;
      function alternar(ev) {
        /* Un botón de dentro del título (⧉ de un dato) hace lo suyo, no pliega. */
        if (ev.target && ev.target.closest && ev.target.closest('button, a, input, select')) return;
        poner(id, !abiertos[id]);
      }
      cab.onclick = alternar;
      cab.onkeydown = function (ev) {
        if (ev.target !== cab || (ev.key !== 'Enter' && ev.key !== ' ')) return;
        ev.preventDefault();
        alternar(ev);
      };
    });
  }

  /* El nombre de una pestaña de antes (o de un bloque) abre ese bloque. `deParte` ya no hace falta: se queda para quien lo llama. */
  function abrir(id) {
    id = idDe(id);
    if (id === 'trabajo') { if (window.FichaTrabajoVisor) FichaTrabajoVisor.ubicar(); return; }
    if (!bloqueDe(id)) return;
    poner(id, true);
  }

  function plegar(id) { poner(idDe(id), false); }
  function estaAbierto(id) { return !!abiertos[idDe(id)]; }

  /* ---------- los números de los bloques ---------- */

  function programarResumen() {
    clearTimeout(turnoResumen);
    turnoResumen = setTimeout(function () { resumirTodas(); ajustarAlto(); }, 80);
  }

  /* Los números viven en js/ficha-tarjetas-resumen.js. */
  var resumen = FichaTarjetasResumen.crear({ raiz: raiz, asunto: function () { return asuntoActual; } });
  function resumirTodas() { resumen.todas(); }

  /* ---------- «Trabajo» llena el alto visible, sin bajar ---------- */

  var ANCHO_DE_UNA_COLUMNA = 1100;

  /* Lo que hay por debajo de un elemento hasta el final de la página: los hermanos que le siguen en
     cada nivel y el relleno de cada contenedor. No depende de cuánto estire la página, así que no se
     queda en un punto fijo. */
  function debajoDe(el) {
    var total = 0;
    var nodo = el;
    while (nodo && nodo.parentElement && nodo !== document.body) {
      for (var sig = nodo.nextElementSibling; sig; sig = sig.nextElementSibling) {
        var e = getComputedStyle(sig);
        if (e.display === 'none' || e.position === 'fixed' || e.position === 'absolute') continue;
        total += sig.offsetHeight + (parseFloat(e.marginTop) || 0) + (parseFloat(e.marginBottom) || 0);
      }
      var p = getComputedStyle(nodo.parentElement);
      total += (parseFloat(p.paddingBottom) || 0) + (parseFloat(p.borderBottomWidth) || 0) + (parseFloat(getComputedStyle(nodo).marginBottom) || 0);
      nodo = nodo.parentElement;
    }
    return total;
  }

  function ajustarAlto() {
    var columnas = $('trabajo-columnas');
    var r = raiz();
    if (!columnas || !r || !columnas.offsetParent) return;
    if (window.innerWidth <= ANCHO_DE_UNA_COLUMNA) { if (columnas.style.height) columnas.style.height = ''; return; }   /* una columna debajo de otra: la página baja */
    var arriba = columnas.getBoundingClientRect().top + window.scrollY;
    var hueco = Math.max(360, window.innerHeight - arriba - debajoDe(columnas) - 1);
    var nuevo = Math.floor(hueco) + 'px';
    if (columnas.style.height !== nuevo) columnas.style.height = nuevo;
  }

  var ventanaEnganchada = false;
  function engancharVentana() {
    if (ventanaEnganchada) return;
    ventanaEnganchada = true;
    window.addEventListener('resize', ajustarAlto);
    /* Una clase del <body> (documento abierto, marco…) cambia el ancho disponible. */
    new MutationObserver(function () { ajustarAlto(); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  return {
    html: html, alEntrar: alEntrar, alPintar: alPintar, abrirAlEntrar: abrirAlEntrar,
    abrir: abrir, plegar: plegar, estaAbierto: estaAbierto,
    /* La vista es siempre la misma («Trabajo»): lo usan el visor y la mesa del hito. */
    abierta: function () { return 'trabajo'; },
    alCambiarLaMesa: function () { ajustarAlto(); },
    ajustarAlto: ajustarAlto
  };
})();
