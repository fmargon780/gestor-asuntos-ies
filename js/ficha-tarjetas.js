/* ============================================================
   ficha-tarjetas.js — las pestañas de la ficha del asunto y la vista de
   trabajo (24-sep-2026, fila 107; 22-oct-2026, fila 425,
   docs/FICHA-VISTA-DE-TRABAJO.md).

   Debajo de la cabecera de la ficha hay siempre una fila de pestañas:
   «Trabajo» (la primera, y la que está abierta al entrar), «La actividad»
   y «Candidaturas» (donde existen), «Datos y contacto», «Campos del
   asunto» (si lo hay), «Registro», «Otros asuntos de este tercero» y
   «Personas y entidades relacionadas».

   - «Trabajo» son dos columnas de igual ancho: a la izquierda el hito
     entero de arriba abajo (`#ficha-guia`, que pinta js/hitos-panel.js y
     js/hito-mesa.js) y a la derecha los documentos de la carpeta
     (`#ficha-documentos`, js/ficha-documentos.js), o el documento abierto
     en lugar de la lista (js/ficha-trabajo-visor.js). Sustituye a las
     antiguas pestañas «Hitos» y «Documentos de la carpeta».
   - Las demás pestañas se abren a todo el ancho.
   - Al entrar en una ficha, siempre «Trabajo»; desde «Qué me toca»
     (`abrirAlEntrar('trabajo')`) también. Un repintado de la misma ficha
     no cambia de pestaña.

   js/ficha-asunto.js monta el HTML con `html(tramite)` y llama a
   `alEntrar()` al abrir una ficha y a `alPintar(raiz, a)` al terminar
   de pintarla: puntos de enganche previstos, sin envolver nada.
   ============================================================ */
var FichaTarjetas = (function () {

  /* En el orden de las pestañas. */
  var TARJETAS = [
    { id: 'trabajo', titulo: 'Trabajo' },
    { id: 'actividad', titulo: 'La actividad' },   /* fila 306: solo en un asunto de actividad extraescolar */
    { id: 'candidaturas', titulo: 'Candidaturas' },   /* fila 347: solo en el asunto de unas elecciones */
    { id: 'contacto', titulo: 'Datos y contacto' },
    { id: 'tramite', titulo: 'Campos del asunto' },
    { id: 'notas', titulo: 'Registro' },
    { id: 'otros', titulo: 'Otros asuntos de este tercero' },
    { id: 'relacionados', titulo: 'Personas y entidades relacionadas' }
  ];

  /* Las pestañas de antes (fila 425): «Hitos» y «Documentos de la carpeta» son ahora «Trabajo». */
  var ALIAS = { hitos: 'trabajo', documentos: 'trabajo' };
  function idDe(id) { return ALIAS[id] || id || 'trabajo'; }

  var abierta = 'trabajo';     /* id de la pestaña abierta */
  var pendienteAlEntrar = null;
  var asuntoActual = null;
  var turnoResumen = null;

  function $(id) { return document.getElementById(id); }
  function raiz() { return $('ficha-tarjetas'); }

  /* ---------- el HTML (lo pide js/ficha-asunto.js) ---------- */

  function tarjeta(id, titulo, dentro, alLado) {
    return '<section class="ficha-bloque ficha-tarjeta' + (id === abierta ? ' abierta' : '') + '" data-tarjeta="' + id + '">' +
      (titulo ? '<h3 class="ficha-titulo">' + U.escapar(titulo) + (alLado || '') + '</h3>' : '') +
      '<div class="ficha-tarjeta-cuerpo">' + dentro + '</div>' +
    '</section>';
  }

  /* Fila 425: el hito a la izquierda y la carpeta a la derecha. Los huecos de dentro
     (#ficha-guia, #ficha-documentos, #ficha-cuenta-docs) son los de siempre. */
  function trabajo() {
    return '<section class="ficha-tarjeta ficha-trabajo' + (abierta === 'trabajo' ? ' abierta' : '') + '" data-tarjeta="trabajo">' +
      '<div class="trabajo-columnas" id="trabajo-columnas">' +
        '<div class="trabajo-col trabajo-izq ficha-bloque" id="trabajo-izq">' +
          '<div id="ficha-guia" class="explica">Leyendo…</div>' +
        '</div>' +
        '<div class="trabajo-col trabajo-der" id="trabajo-der">' +
          '<div id="trabajo-der-arriba"></div>' +
          '<section class="ficha-bloque trabajo-carpeta" id="trabajo-carpeta">' +
            '<h3 class="ficha-titulo">Documentos de la carpeta<span class="ficha-cuenta" id="ficha-cuenta-docs"></span></h3>' +
            '<div id="ficha-documentos" class="explica">Leyendo…</div>' +
          '</section>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function html(tramite, a) {
    var conActividad = !!(window.Actividades && Actividades.tarjetaAplica(a));   /* fila 306 */
    var conCandidaturas = !!(window.Candidaturas && Candidaturas.aplica(a));   /* fila 347 */
    if (abierta === 'actividad' && !conActividad) abierta = 'trabajo';
    if (abierta === 'candidaturas' && !conCandidaturas) abierta = 'trabajo';
    if (abierta === 'tramite' && !tramite) abierta = 'trabajo';
    return '<div class="ficha-tarjetas" id="ficha-tarjetas" data-abierta="' + abierta + '">' +
      '<div class="ficha-tarjetas-pestanas" id="ficha-tarjetas-pestanas"></div>' +
      '<div class="ficha-tarjetas-rejilla" id="ficha-tarjetas-rejilla">' +
        trabajo() +
        (conActividad ? tarjeta('actividad', 'La actividad', '<div id="ficha-actividad" class="explica">Leyendo…</div>') : '') +
        (conCandidaturas ? tarjeta('candidaturas', 'Candidaturas', '<div id="ficha-candidaturas" class="explica">Leyendo…</div>') : '') +
        /* "Datos y contacto" trae su propio título (js/ficha-tercero.js). */
        tarjeta('contacto', '', '<div id="ficha-contacto-caja"></div>') +
        (tramite ? tarjeta('tramite', 'Campos del asunto', tramite,
          window.CampoDesdeElAsunto ? CampoDesdeElAsunto.botonTituloHtml() : '') : '') +
        tarjeta('notas', 'Registro', '<div id="ficha-notas"></div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="notas"></span>') +
        tarjeta('otros', 'Otros asuntos de este tercero', '<div id="ficha-otros" class="explica">Buscando…</div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="otros"></span>') +
        tarjeta('relacionados', 'Personas y entidades relacionadas',
                '<div id="ficha-relacionados" class="explica">Leyendo…</div>',
                '<span class="ficha-cuenta" data-cuenta-tarjeta="relacionados"></span>') +
      '</div>' +
    '</div>';
  }

  /* ---------- entrar, pintar y cambiar de pestaña ---------- */

  /* Al entrar en una ficha, «Trabajo». Pero si es la misma que ya está a
     la vista (la aplicación la vuelve a abrir sola tras guardar algo, por
     ejemplo al cerrar el cuadro de Correo o al generar un documento), se
     queda la pestaña que estuviera abierta. */
  function alEntrar(a) {
    var r = raiz();
    var mismaALaVista = !!(a && asuntoActual && asuntoActual.nombre === a.nombre && r && r.offsetParent);
    if (pendienteAlEntrar) abierta = pendienteAlEntrar;
    else if (!mismaALaVista) abierta = 'trabajo';
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
    var rejilla = $('ficha-tarjetas-rejilla');
    if (!r.querySelector('.ficha-tarjeta[data-tarjeta="' + abierta + '"]')) abierta = 'trabajo';
    new MutationObserver(function (cambios) {
      var deVerdad = cambios.some(function (c) {
        var t = c.target.nodeType === 1 ? c.target : c.target.parentNode;
        return t && !t.closest('.ficha-cuenta[data-cuenta-tarjeta]');
      });
      if (deVerdad) programarResumen();
    }).observe(rejilla, { childList: true, subtree: true, characterData: true });
    aplicar();
    resumirTodas();
    programarResumen();
    engancharVentana();
  }

  /* `deParte` (js/ficha-trabajo-visor.js): el cambio no lo pide quien mira, sino un documento que se abre. */
  function abrir(id, deParte) {
    id = idDe(id);
    if (!raiz() || !raiz().querySelector('.ficha-tarjeta[data-tarjeta="' + id + '"]')) return;
    if (!deParte && window.FichaTrabajoVisor) FichaTrabajoVisor.olvidar();
    abierta = id;
    aplicar();
    window.scrollTo(0, 0);
  }

  function aplicar() {
    var r = raiz();
    if (!r) return;
    r.dataset.abierta = abierta;
    Array.prototype.forEach.call(r.querySelectorAll('.ficha-tarjeta'), function (t) {
      t.classList.toggle('abierta', t.dataset.tarjeta === abierta);
    });
    pintarPestanas();
    ajustarAlto();
    /* El documento que esté abierto se pone en la columna derecha de «Trabajo», o se saca de ahí. */
    if (window.FichaTrabajoVisor) FichaTrabajoVisor.ubicar();
  }

  /* ---------- las pestañas de arriba ---------- */

  function tituloDe(id) {
    var viva = raiz() && raiz().querySelector('.ficha-tarjeta[data-tarjeta="' + id + '"]');
    if (viva && viva.dataset.titulo) return viva.dataset.titulo;   /* fila 293: «Personas del grupo (N)» */
    var t = TARJETAS.filter(function (x) { return x.id === id; })[0];
    return t ? t.titulo : id;
  }

  function cuentaDe(id) {
    var r = raiz();
    var el = r && r.querySelector('.ficha-tarjeta[data-tarjeta="' + id + '"] .ficha-cuenta[data-cuenta-tarjeta]');
    return el ? (el.textContent || '').trim() : '';
  }

  function pintarPestanas() {
    var caja = $('ficha-tarjetas-pestanas');
    var r = raiz();
    if (!caja || !r) return;
    var firma = [];
    var tarjetas = Array.prototype.slice.call(r.querySelectorAll('.ficha-tarjeta'));
    tarjetas.forEach(function (t) {
      var id = t.dataset.tarjeta;
      firma.push(id + '|' + tituloDe(id) + '|' + cuentaDe(id) + '|' + (id === abierta ? '1' : '0'));
    });
    firma = firma.join('\n');
    if (caja.dataset.firma === firma) return;   /* solo se rehace si cambia algo: no despierta al observador en balde */
    caja.dataset.firma = firma;
    caja.innerHTML = '';
    tarjetas.forEach(function (t) {
      var id = t.dataset.tarjeta;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ficha-pestana' + (id === abierta ? ' activa' : '');
      b.dataset.tarjeta = id;
      var cuenta = cuentaDe(id);
      b.innerHTML = U.escapar(tituloDe(id)) + (cuenta ? ' <span class="ficha-pestana-cuenta">' + U.escapar(cuenta) + '</span>' : '');
      b.onclick = function () { if (id !== abierta) abrir(id); };
      caja.appendChild(b);
    });
  }

  /* ---------- los números de las pestañas ---------- */

  function programarResumen() {
    clearTimeout(turnoResumen);
    turnoResumen = setTimeout(function () { resumirTodas(); pintarPestanas(); ajustarAlto(); }, 80);
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
    if (!columnas || !r || abierta !== 'trabajo' || !columnas.offsetParent) return;
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
    abrir: abrir,
    abierta: function () { return abierta; },
    alCambiarLaMesa: function () { ajustarAlto(); },
    ajustarAlto: ajustarAlto
  };
})();
