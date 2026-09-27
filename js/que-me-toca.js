/* ============================================================
   que-me-toca.js — los cálculos de "qué toca" a cada asunto abierto
   (16-sep-2026, fila 16; ya no es una pantalla propia desde la fila
   191, docs/INICIO-CUATRO-BLOQUES.md: sus tres bloques viven ahora
   dentro de Inicio, "Ha llegado / Me toca / Esperamos a otros").

   Los hitos de la fila 15 (js/hitos.js) se ven dentro de cada asunto,
   uno a uno. Aquí se cruzan todos: los hitos `pendiente` y `encurso`
   de TODOS los asuntos abiertos, sin tener que entrar en ellos. Se
   calcula leyendo Hitos.leer() una vez y window.Gestor.asuntos(),
   cruzando por la clave del asunto.

   Este fichero es puro cálculo, sin pantalla propia: js/inicio.js lo
   usa para pintar "Me toca" y "Esperamos a otros", con `reunir`,
   `unoPorAsunto`, `clasificar` y `abrirMesaDelHito`.
   ============================================================ */
(function () {

  var CLAVE_FILTRO = 'gestor-que-me-toca-responsable';

  function $(id) { return document.getElementById(id); }

  function leerFiltro() {
    try { return window.localStorage.getItem(CLAVE_FILTRO) || ''; } catch (e) { return ''; }
  }
  function guardarFiltro(v) {
    try { window.localStorage.setItem(CLAVE_FILTRO, v); } catch (e) {}
  }

  /* ==========================================================
     REUNIR LOS HITOS DE TODOS LOS ASUNTOS ABIERTOS
     ========================================================== */

  /* Igual que terceroDe() de js/unir-asuntos.js. */
  function terceroDe(a) {
    if (a.ficha && a.ficha.tercero) return a.ficha.tercero;
    if (a.leido && a.leido.resto && window.Nombres) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  /* Igual que contextoResponsable() de js/hitos-panel-lista.js: lo que
     necesita Hitos.resolverResponsable para resolver "tercero" y
     "relacionado". */
  function contextoResponsable(a) {
    var f = a.ficha || {};
    return { tercero: f.tercero || (a.leido && a.leido.resto) || '', relacionados: f.relacionados || [], tutor: null };
  }

  /* Fila 104: "de Administración" sale de la marca de cada responsable
     en Ajustes › Hitos (Hitos.esDeAdministracion), no de `yo`/`companero`
     a pelo. Sin responsable sigue yendo a "Sin fecha", como siempre. */
  function esMio(idResponsable, ajustes) {
    return !!idResponsable && Hitos.esDeAdministracion(idResponsable, ajustes);
  }

  async function reunir() {
    var datos = await Hitos.leer();
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    var items = [];
    asuntos.forEach(function (a) {
      var entrada = datos.porAsunto[a.nombre];
      if (!entrada || !entrada.hitos.length) return;
      Hitos.visibles(entrada.hitos).forEach(function (h) {
        if (h.estado !== 'pendiente' && h.estado !== 'encurso') return;
        /* 20-sep-2026, fila 79, apartado 4.6: un hito solo informativo
           no reclama trabajo, así que no sale aquí. */
        if (h.soloInformativo) return;
        items.push({ asunto: a, hito: h });
      });
    });
    return { ajustes: datos.ajustes, items: items };
  }

  /* Días que lleva parado desde 'desde' (0 si no tiene: un hito
     "pendiente" que todavía no ha llegado a estar en curso no lo
     tiene, y no por eso hay que tratarlo como el más urgente). */
  function diasParado(h) {
    if (!h.desde) return 0;
    var d = Plazos.diasHasta(h.desde);
    return d === null ? 0 : Math.max(0, -d);
  }

  function clasificar(items, ajustes) {
    var tejado = [], otros = [], sinFecha = [];
    items.forEach(function (it) {
      var h = it.hito;
      if (esMio(h.responsable, ajustes) && h.fecha) tejado.push(it);
      else if (h.responsable && !esMio(h.responsable, ajustes)) otros.push(it);
      else sinFecha.push(it);
    });
    tejado.sort(function (a, b) {
      return (Plazos.diasHasta(a.hito.fecha) || 0) - (Plazos.diasHasta(b.hito.fecha) || 0);
    });
    otros.sort(function (a, b) { return diasParado(b.hito) - diasParado(a.hito); });
    return { tejado: tejado, otros: otros, sinFecha: sinFecha };
  }

  function vencidos(items) {
    return items.filter(function (it) {
      var p = it.hito.fecha ? Plazos.de(it.hito.fecha) : null;
      return p && p.clase === 'plazo-vencido';
    }).length;
  }

  /* ---------- la cuenta de vencidos ---------- */

  function pintarCuenta(items) {
    var el = $('cuenta-vencidos-inicio');
    if (!el) return;
    var n = vencidos(items);
    el.textContent = n ? String(n) : '';
    el.classList.toggle('oculto', !n);
  }

  /* ---------- los asuntos dormidos (19-sep-2026, fila 68,
     docs/AVISOS-QUE-FALTAN.md, 2) ----------

     "No ha pasado nada" = ni nota, ni cambio de estado, ni edición de
     la ficha, tomando la fecha más reciente de `notaEl`, `situacionEl`
     y `editadoEl` (o `abiertoEl` si el asunto no ha tenido ninguna
     de las anteriores todavía). El encargo pide explícitamente NO
     mirar el documento más nuevo de la carpeta: costaría un recorrido
     del disco por cada asunto, solo para pintar esta pantalla. */
  var DIAS_DORMIDO_POR_DEFECTO = 60;

  App.diasDormido = function () {
    var n = App.E.registro.ajustesAvisos && App.E.registro.ajustesAvisos.diasDormido;
    return (typeof n === 'number' && n > 0) ? n : DIAS_DORMIDO_POR_DEFECTO;
  };

  App.guardarDiasDormido = async function (n) {
    await App.guardarRegistroFresco(function (registro) {
      registro.ajustesAvisos = registro.ajustesAvisos || {};
      registro.ajustesAvisos.diasDormido = n;
    });
  };

  /* El campo de Ajustes → El centro. Lo llama App.pintarAjustesCentro
     (js/ajustes-centro.js). */
  App.pintarDiasDormido = function () {
    var campo = $('dias-dormido');
    if (!campo) return;
    campo.value = String(App.diasDormido());
    campo.onchange = async function () {
      var n = parseInt(campo.value, 10);
      if (isNaN(n) || n < 1) { campo.value = String(App.diasDormido()); return; }
      try {
        await App.guardarDiasDormido(n);
        U.aviso('Avisará de los dormidos a partir de ' + n + ' días.', 'bueno');
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
  };

  function ultimaActividad(ficha) {
    return [ficha.notaEl, ficha.situacionEl, ficha.editadoEl, ficha.abiertoEl]
      .filter(Boolean).sort().pop() || '';
  }

  function diasDesdeIso(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  /* Los abiertos sin novedades desde hace `App.diasDormido()` días o
     más, sin los que se han ocultado a propósito y todavía no toca
     volver a avisar de ellos (`ficha.dormidoOcultoHasta`). */
  function reunirDormidos() {
    var umbral = App.diasDormido();
    var hoy = U.hoyIso();
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    var salida = [];
    asuntos.forEach(function (a) {
      var f = a.ficha || {};
      if (f.dormidoOcultoHasta && f.dormidoOcultoHasta > hoy) return;
      var ultima = ultimaActividad(f);
      if (!ultima) return;
      var dias = diasDesdeIso(ultima);
      if (dias >= umbral) salida.push({ asunto: a, dias: dias });
    });
    salida.sort(function (a, b) { return b.dias - a.dias; });
    return salida;
  }

  function bloqueDormidos(lista) {
    if (!lista.length) return null;
    var d = document.createElement('div');
    d.className = 'qmt-bloque qmt-bloque-dormidos';
    d.innerHTML = '<h3 class="qmt-bloque-titulo">Dormidos ' +
      '<span class="cuenta-lista">' + lista.length + '</span></h3>';
    var caja = document.createElement('div');
    caja.className = 'qmt-lista';
    lista.forEach(function (it) {
      var a = it.asunto;
      var tapado = window.Reservados && Reservados.tapar(a);   /* fila 135 */
      var tercero = tapado ? '' : terceroDe(a);
      var fila = document.createElement('div');
      fila.className = 'qmt-fila qmt-fila-dormido';
      fila.style.cursor = 'default';
      fila.innerHTML =
        '<span class="qmt-fila-titulo">' + (window.Reservados ? Reservados.candadoHtml(a) : '') +
          U.escapar(window.Reservados ? Reservados.nombreParaVer(a) : a.nombre) + '</span>' +
        (tercero ? '<span class="qmt-fila-tercero">' + U.escapar(tercero) + '</span>' : '') +
        '<span class="qmt-fila-espera">Sin novedades desde hace ' + it.dias + ' días</span>';

      var abrir = document.createElement('button');
      abrir.type = 'button';
      abrir.className = 'boton';
      abrir.textContent = 'Abrir';
      abrir.onclick = function () { App.abrirFicha(a, 'abierto'); };
      fila.appendChild(abrir);

      var ocultar = document.createElement('button');
      ocultar.type = 'button';
      ocultar.className = 'boton';
      ocultar.textContent = 'Ocultar por 30 días';
      ocultar.onclick = async function () {
        var hasta = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        try {
          await App.anotar(a.nombre, { dormidoOcultoHasta: hasta });
          pintar();
        } catch (e) {
          U.aviso('No he podido ocultarlo: ' + U.mensajeDeError(e), 'malo');
        }
      };
      fila.appendChild(ocultar);

      caja.appendChild(fila);
    });
    d.appendChild(caja);
    return d;
  }

  /* ---------- el aviso de aspirantes sin Nº de identificación escolar ----------

     17-sep-2026, fila 42, sección 5 de
     docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md. Un aviso, no un hito: sin
     fecha límite ni responsable, mientras queden aspirantes dados de
     alta sin número. Se pulsa y lleva a Personas y empresas, en
     Alumnado, donde salen marcados como "Solicitante". */
  async function contarAspirantesSinNumero() {
    try {
      var datos = await Datos.cargar(App.E.datos, 'ALUMNADO');
      return (datos.lista || []).filter(function (p) { return p.solicitante && !p.id; }).length;
    } catch (e) { return 0; }
  }

  /* ---------- la cuenta de la barra, siempre al día ----------

     Igual que el aviso de duplicados (js/unir-asuntos.js): enganchado
     a window.Gestor.alRefrescar, para que la cuenta de vencidos esté
     bien aunque no se haya visitado la pantalla todavía. */
  (function () {
    function enganchar() {
      if (!window.Gestor) return;
      /* La cuenta de vencidos no relee hitos.json en cada repintado de
         la lista (fila 101): solo si este ordenador ha cambiado algún
         hito desde la última cuenta, o si han pasado dos minutos (lo
         que haya tocado el otro ordenador). */
      var ultimaCuenta = 0;
      window.Gestor.alRefrescar.push(function () {
        var ahora = Date.now();
        var cambio = window.Hitos && Hitos.ultimoCambioLocal ? Hitos.ultimoCambioLocal() : ahora;
        if (ultimaCuenta && cambio < ultimaCuenta && ahora - ultimaCuenta < 2 * 60 * 1000) return;
        ultimaCuenta = ahora;
        reunir().then(function (d) { pintarCuenta(d.items); }).catch(function () {});
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  /* ---------- un hito por asunto ----------

     El PRIMERO en el orden de reunir() (el de la guía), ANTES de
     ordenar por fecha o por días parados: así "Me toca" y "Esperamos a
     otros" enseñan un solo hito por asunto, el que de verdad toca
     ahora. */
  function unoPorAsunto(items) {
    var visto = {};
    return items.filter(function (it) {
      if (visto[it.asunto.nombre]) return false;
      visto[it.asunto.nombre] = true;
      return true;
    });
  }

  /* Abre la ficha del asunto con la mesa de ese hito ya desplegada
     (lo que hacía filaDeHito, ahora pulsando una fila de "Me toca" en
     Inicio: js/inicio.js). */
  function abrirMesaDelHito(a, h) {
    if (window.HitosPanel) window.HitosPanel.desplegarAlAbrir(a.nombre, h.id);
    /* Con la tarjeta de Hitos abierta en grande (fila 107). */
    if (window.FichaTarjetas) FichaTarjetas.abrirAlEntrar('hitos');
    App.abrirFicha(a, 'abierto');
  }

  window.QueMeToca = {
    reunir: reunir, clasificar: clasificar, esMio: esMio, diasParado: diasParado,
    vencidos: vencidos, unoPorAsunto: unoPorAsunto,
    contarAspirantesSinNumero: contarAspirantesSinNumero,
    reunirDormidos: reunirDormidos,
    leerFiltroResponsable: leerFiltro, guardarFiltroResponsable: guardarFiltro,
    abrirMesaDelHito: abrirMesaDelHito,
    /* Pequeñas ayudas que también usa js/inicio.js para pintar "Me
       toca" y "Esperamos a otros" (el tercero de un asunto, y el
       contexto que necesita Hitos.resolverResponsable). */
    terceroDe: terceroDe, contextoResponsable: contextoResponsable,
    /* para las pruebas */
    _reunirDormidos: reunirDormidos
  };

})();
