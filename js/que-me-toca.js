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
    return { ajustes: datos.ajustes, items: items, porAsunto: datos.porAsunto };
  }

  /* Días que lleva parado desde 'desde' (0 si no tiene: un hito
     "pendiente" que todavía no ha llegado a estar en curso no lo
     tiene, y no por eso hay que tratarlo como el más urgente). */
  function diasParado(h) {
    if (!h.desde) return 0;
    var d = Plazos.diasHasta(h.desde);
    return d === null ? 0 : Math.max(0, -d);
  }

  /* Fila 209, docs/INICIO-EN-PESTANAS.md: "En Administración" ya no
     exige fecha (antes se iba a `sinFecha`, un bloque aparte que ya no
     existe: ahora esos hitos entran en `tejado`, con "Sin plazo", y el
     orden los deja al final). Un hito sin responsable también es de
     Administración, igual que Hitos.esDeAdministracion (sin
     responsable, true) y App.ladoDe (sin hitos, Administración). */
  function clasificar(items, ajustes) {
    var tejado = [], otros = [];
    items.forEach(function (it) {
      var h = it.hito;
      if (esMio(h.responsable, ajustes) || !h.responsable) tejado.push(it);
      else otros.push(it);
    });
    /* Vencidos y con fecha, por plazo; los "Sin plazo" (null), al final. */
    tejado.sort(function (a, b) {
      var da = Plazos.diasHasta(a.hito.fecha), db = Plazos.diasHasta(b.hito.fecha);
      if (da === null) return db === null ? 0 : 1;
      if (db === null) return -1;
      return da - db;
    });
    otros.sort(function (a, b) { return diasParado(b.hito) - diasParado(a.hito); });
    return { tejado: tejado, otros: otros };
  }

  function vencidos(items) {
    return items.filter(function (it) {
      var p = it.hito && it.hito.fecha ? Plazos.de(it.hito.fecha) : null;
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

  /* Fila 451: también cuenta marcar o desmarcar un hito (`actividadEl` de su
     entrada en hitos.json, que escribe Hitos.marcar, y `hechoEl` de cada hito)
     y el cambio de situación (`situacionEl`, que ahora sí se guarda). */
  function ultimaActividad(a) {
    var ficha = a.ficha || {};
    var fechas = [ficha.notaEl, ficha.situacionEl, ficha.editadoEl, ficha.abiertoEl];
    var datos = window.Hitos && Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    var entrada = datos && datos.porAsunto && datos.porAsunto[a.nombre];
    if (entrada) {
      fechas.push(entrada.actividadEl);
      (entrada.hitos || []).forEach(function (h) { fechas.push(h.hechoEl); });
    }
    return fechas.filter(Boolean).sort().pop() || '';
  }

  function diasDesdeIso(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  /* Fila 451: los días que lleva dormido un asunto, o null si no lo está
     (sin novedades desde hace `App.diasDormido()` días o más, sin los
     ocultados a propósito con `ficha.dormidoOcultoHasta` todavía en el
     futuro, ni los que están en «Por liquidar», quietos a propósito). */
  function diasDormidoDe(a) {
    var f = a.ficha || {};
    if (f.dormidoOcultoHasta && f.dormidoOcultoHasta > U.hoyIso()) return null;
    if (f.porLiquidar && f.porLiquidar.desde) return null;
    var ultima = ultimaActividad(a);
    if (!ultima) return null;
    var dias = diasDesdeIso(ultima);
    return dias >= App.diasDormido() ? dias : null;
  }

  /* Los abiertos dormidos, de más a menos días (para las pruebas y los avisos). */
  function reunirDormidos() {
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    var salida = [];
    asuntos.forEach(function (a) {
      var dias = diasDormidoDe(a);
      if (dias !== null) salida.push({ asunto: a, dias: dias });
    });
    salida.sort(function (a, b) { return b.dias - a.dias; });
    return salida;
  }

  /* Del menú ⋮ de la fila de un asunto dormido: dejar de avisar 30 días. */
  async function ocultarDormido(a) {
    var hasta = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    try {
      await App.anotar(a.nombre, { dormidoOcultoHasta: hasta });
      if (a.ficha) a.ficha.dormidoOcultoHasta = hasta;
      U.aviso('No avisaré de este asunto como dormido hasta el ' + hasta + '.', 'bueno');
      if (window.Inicio) Inicio.repintar();
    } catch (e) {
      U.aviso('No he podido ocultarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- el aviso de aspirantes sin Nº de identificación escolar ----------

     17-sep-2026, fila 42, sección 5 de
     docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md. Un aviso, no un hito: sin
     fecha límite ni responsable, mientras queden aspirantes dados de
     alta sin número. Se pulsa y lleva a Personas y empresas, en
     Alumnado, donde salen marcados como "Solicitante". */
  async function reunirAspirantesSinNumero() {
    try {
      var datos = await Datos.cargar(App.E.datos, 'ALUMNADO');
      return (datos.lista || []).filter(function (p) { return p.solicitante && !p.id; });
    } catch (e) { return []; }
  }

  async function contarAspirantesSinNumero() {
    return (await reunirAspirantesSinNumero()).length;
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
    /* Con la pestaña «Trabajo» abierta (fila 425). */
    if (window.FichaTarjetas) FichaTarjetas.abrirAlEntrar('trabajo');
    App.abrirFicha(a, 'abierto');
  }

  window.QueMeToca = {
    reunir: reunir, clasificar: clasificar, esMio: esMio, diasParado: diasParado,
    vencidos: vencidos, unoPorAsunto: unoPorAsunto,
    contarAspirantesSinNumero: contarAspirantesSinNumero,
    reunirAspirantesSinNumero: reunirAspirantesSinNumero,
    reunirDormidos: reunirDormidos, diasDormidoDe: diasDormidoDe, ocultarDormido: ocultarDormido,
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
