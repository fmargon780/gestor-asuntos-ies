/* ============================================================
   inicio-tabla.js — pestañas + la tabla única de Inicio (27-sep-2026,
   fila 209, docs/INICIO-EN-PESTANAS.md). Sustituye a js/inicio-plegados.js
   (borrado en esta misma fila) y a los bloques "Me toca"/"Esperamos a
   otros" de js/inicio.js (fila 191/192).

   Cuatro pestañas, una sola tabla debajo (App.filaTablaAsunto,
   js/asuntos-lista-pintar.js). Desde la fila 451
   (docs/CONTADORES-DE-INICIO-QUE-CUADRAN.md) cada asunto de «Todos los
   abiertos» sale en UNA sola de las otras tres, así que
   En Administración + En espera + Por liquidar = Todos los abiertos:

     - "Por liquidar" (`liq`): PorLiquidar.estaPorLiquidar.
     - "En espera" (`esp`): su hito actual (aQuienLeToca) es de terceros
       o está «Esperando a…».
     - "En Administración" (`adm`): el resto: su hito actual es de
       Administración (con o sin fecha) o no tiene ninguno por hacer
       (esos, al final, con «Añade un hito o archívalo»).
     - "Todos los abiertos" (`todos`): App.pintarAbiertos pinta esta
       pestaña de verdad (sigue siendo LA función que lo hace, porque
       js/unir-asuntos.js la envuelve); aquí solo se la llama.
     - «Dormido» ya no es pestaña: es una marca en la fila
       (App.filaTablaAsunto) y el filtro «Solo dormidos» de Situación.

   Se engancha a window.Gestor.alRefrescar desde js/inicio.js (un solo
   punto de enganche para toda la pantalla de Inicio), que llama a
   InicioTabla.pintar() dentro de su propio repintado.

   Se carga justo después de js/inicio.js. */
(function () {

  var CLAVE_PESTANA = 'gestor-inicio-pestana';
  var PESTANAS = ['adm', 'esp', 'todos', 'liq'];
  var ROTULOS = { adm: 'En Administración', esp: 'En espera', todos: 'Todos los abiertos', liq: 'Por liquidar' };

  function $(id) { return document.getElementById(id); }

  /* ---------- la pestaña activa, recordada por ordenador ----------

     Decisión explícita de la fila 209 (ver el plan de esta fila): por
     defecto, la primera vez, es 'todos', NO 'adm'. Unos 25 ficheros de
     pruebas/ pulsan una fila de la tabla esperando que abra la ficha
     del asunto, no la mesa del hito (que es lo que hace la pestaña
     "En Administración"); con 'todos' de partida se preserva ese
     comportamiento para cualquier prueba que no mencione pestañas. */
  function pestanaInicial() {
    if (window.Perfil && Perfil.esDirectivo()) return 'todos';   /* fila 287: una sola lista */
    try {
      var v = window.localStorage.getItem(CLAVE_PESTANA);
      return PESTANAS.indexOf(v) !== -1 ? v : 'todos';
    } catch (e) { return 'todos'; }
  }

  var pestanaActual = pestanaInicial();

  /* ---------- el filtro-de-aviso (el "chip") ----------

     Pulsar un aviso de la franja de arriba que lleve asuntos detrás
     (js/avisos-linea.js) deja la tabla solo con esos asuntos, cambia a
     la pestaña "Todos los abiertos" (para que se vean sea cual sea su
     pestaña natural) y pinta el chip "Filtrado por…". Volver a
     pulsarlo, "Quitar" o cambiar de pestaña a mano lo quita. */
  var filtroAviso = null;   /* { id, texto, nombres: Set<string> } */

  function avisoActivo() { return filtroAviso; }

  function filtrarPorAviso(id, texto, asuntos) {
    if (filtroAviso && filtroAviso.id === id) {
      filtroAviso = null;
    } else {
      filtroAviso = { id: id, texto: texto, nombres: new Set(asuntos.map(function (a) { return a.nombre; })) };
      if (pestanaActual !== 'todos' && window.InicioOrden) InicioOrden.reiniciar();   /* fila 367 */
      pestanaActual = 'todos';
      try { window.localStorage.setItem(CLAVE_PESTANA, 'todos'); } catch (e) {}
    }
    pintar();
  }

  function pintarChip() {
    var chip = $('inicio-filtrado-por');
    if (!chip) return;
    chip.classList.toggle('oculto', !filtroAviso);
    if (filtroAviso) $('inicio-filtrado-por-texto').textContent = filtroAviso.texto;
  }

  /* ---------- cambiar de pestaña ---------- */

  function cambiar(cual) {
    if (PESTANAS.indexOf(cual) === -1) return;
    /* Fila 367: pulsar la pestaña en la que ya estás también devuelve la lista a su orden de siempre. */
    if (cual === pestanaActual) {
      if (window.InicioOrden && InicioOrden.reiniciar()) pintar();
      return;
    }
    pestanaActual = cual;
    filtroAviso = null;   /* cambiar de pestaña a mano quita el chip */
    if (window.InicioOrden) InicioOrden.reiniciar();   /* fila 367: cada pestaña, con su orden de siempre */
    try { window.localStorage.setItem(CLAVE_PESTANA, cual); } catch (e) {}
    pintar();
  }

  /* ---------- el texto buscado, para las tres pestañas que no pasan
     por App.pintarAbiertos (que ya se filtra solo) ---------- */

  function textoBuscado() {
    var campo = $('buscar-abiertos');
    return campo ? U.normalizar(campo.value) : '';
  }

  function coincideAsunto(a, texto) {
    return !texto || App.textoBusquedaSimple(a).indexOf(texto) !== -1;
  }

  /* ---------- el filtro «Responsable», dentro de «Filtros» ----------

     Vivía a la vista, encima de "Me toca" (js/inicio.js). Ahora es un
     filtro más de #filtros-abiertos, y vale en las cuatro pestañas
     (fila 216, docs/FILTROS-EN-TODAS-LAS-PESTANAS.md): App.pasaFiltrosInicio
     lo aplica también en "Todos los abiertos", con el hito
     actual del asunto (Hitos.hitoActualDeAsunto). */
  function pintarFiltroResponsable(ajustes, hitosAbiertos) {
    var sel = $('inicio-me-toca-responsable');
    if (!sel) return;
    var actual = QueMeToca.leerFiltroResponsable();
    /* Fila 205: además, las Administraciones que son responsables de algún hito abierto. */
    var organismos = window.ResponsableOrganismo ? ResponsableOrganismo.usadosEn(hitosAbiertos) : [];
    sel.innerHTML = ['<option value="">Todos</option>'].concat(
      (ajustes.responsables || []).concat(organismos).map(function (r) {
        return '<option value="' + U.escapar(r.id) + '">' + U.escapar(r.nombre) + '</option>';
      })
    ).join('');
    sel.value = actual;
    if (sel.value !== actual) sel.value = '';   /* el guardado ya no existe */
    /* Fila 216, punto 4: repinta la pestaña que está a la vista con el
       mismo mecanismo que los demás filtros, no con un pintar() propio. */
    sel.onchange = function () {
      QueMeToca.guardarFiltroResponsable(this.value);
      if (window.App && App.repintarLaPestanaActiva) App.repintarLaPestanaActiva();
      else pintar();
    };
  }

  /* ---------- reunir las listas de las pestañas ----------

     Fila 451: UN solo criterio para todas, el hito actual (aQuienLeToca,
     js/hitos-a-quien.js). Cada asunto abierto que pasa la búsqueda y los
     filtros cae en una sola lista. */

  /* Pasada «al pintar» de la regla de la fila 253: los asuntos de un tipo
     que se liquida y sin nada por hacer pasan solos a «Por liquidar». Sin
     aviso, nunca con un guardado en marcha, y si falla solo ámbar. */
  async function pasarLosQueToca(asuntos) {
    if (!window.PorLiquidar || !PorLiquidar.hayTipos()) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    try { await PorLiquidar.revisar(asuntos.filter(function (a) { return !PorLiquidar.rechazado(a); })); }
    catch (e) { U.accesorio('No he podido mirar qué asuntos pasan a Por liquidar', e); }
  }

  async function calcular(texto) {
    var datos = await QueMeToca.reunir();
    var abiertos = (App.E.listaAbiertos || []).filter(function (a) { return coincideAsunto(a, texto); });
    abiertos = abiertos.filter(function (a) { return App.pasaFiltrosInicio(a); });

    /* Fila 249: un asunto que entró solo en «Por liquidar» y tiene ahora un
       hito pendiente vuelve a su pestaña. */
    if (window.PorLiquidar) {
      for (var k = 0; k < abiertos.length; k++) {
        var a0 = abiertos[k];
        if (!PorLiquidar.estaPorLiquidar(a0)) continue;
        var e0 = datos.porAsunto[a0.nombre];
        if (e0 && Hitos.aQuienLeToca(e0.hitos, datos.ajustes).hito) await PorLiquidar.destapar(a0);
      }
      await pasarLosQueToca(abiertos);
    }

    var adm = [], esp = [], liq = [];
    abiertos.forEach(function (a) {
      if (window.PorLiquidar && PorLiquidar.estaPorLiquidar(a)) { liq.push(a); return; }
      var entrada = datos.porAsunto[a.nombre];
      var hitos = entrada ? entrada.hitos : [];
      var r = Hitos.aQuienLeToca(hitos, datos.ajustes);
      var hito = r.hito ? Hitos.buscar(hitos, r.hito) : null;
      if (r.lado === 'terceros' && hito) { esp.push({ asunto: a, hito: hito }); return; }
      var item = { asunto: a, hito: hito };
      if (!hito) {
        item.sinHito = true;
        item.cargarPasos = !!(window.PorLiquidar && PorLiquidar.pasosPorCargar(a, datos));
      }
      adm.push(item);
    });

    /* En Administración: vencidos y con fecha, por plazo; los «Sin plazo»
       después; y los que no tienen ningún hito por hacer, los últimos. */
    adm.sort(function (x, y) {
      if (!x.hito || !y.hito) return !x.hito && !y.hito ? 0 : (!x.hito ? 1 : -1);
      var dx = Plazos.diasHasta(x.hito.fecha), dy = Plazos.diasHasta(y.hito.fecha);
      if (dx === null) return dy === null ? 0 : 1;
      if (dy === null) return -1;
      return dx - dy;
    });
    esp.sort(function (x, y) { return QueMeToca.diasParado(y.hito) - QueMeToca.diasParado(x.hito); });
    if (window.PorLiquidar) {
      var orden = {};
      PorLiquidar.lista().forEach(function (a, i) { orden[a.nombre] = i; });
      liq.sort(function (x, y) { return (orden[x.nombre] || 0) - (orden[y.nombre] || 0); });
    }
    var hitosAbiertos = [];
    abiertos.forEach(function (a) {
      var e = datos.porAsunto[a.nombre];
      var h = e && Hitos.aQuienLeToca(e.hitos, datos.ajustes).hito;
      if (h) hitosAbiertos.push(Hitos.buscar(e.hitos, h));
    });
    return { ajustes: datos.ajustes, adm: adm, esp: esp, liq: liq, hitosAbiertos: hitosAbiertos };
  }

  function listaDe(pestana, r) {
    if (pestana === 'adm') return r.adm;
    if (pestana === 'esp') return r.esp;
    if (pestana === 'liq') return r.liq;
    return [];
  }

  /* ---------- pintar una fila de "adm"/"esp" ---------- */

  function fila(entry, pestana) {
    var opciones = { pestana: pestana };
    if ((pestana === 'adm' || pestana === 'esp') && entry.hito) opciones.hito = entry.hito;
    if (pestana === 'esp') opciones.dias = QueMeToca.diasParado(entry.hito);
    if (entry.sinHito) { opciones.sinHito = true; opciones.cargarPasos = entry.cargarPasos; }   /* fila 451 */
    return App.filaTablaAsunto(entry.asunto, opciones);
  }

  function pintarTabla(lista, pestana) {
    var caja = $('inicio-tabla-cuerpo');
    if (!caja) return;
    var rotulo = $('cuenta-lista-abiertos');
    if (rotulo) rotulo.textContent = lista.length;
    if (window.InicioOrden) InicioOrden.decorar(pestana);   /* fila 367: la flecha */
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<tr><td colspan="7" class="vacio">' +
        (pestana === 'adm' ? 'Nada pendiente de Administración por ahora.'
          : 'No se espera a nadie por ahora.') +
        '</td></tr>';
      return;
    }
    lista = window.InicioOrden ? InicioOrden.ordenar(lista, pestana) : lista;   /* fila 367 */
    lista.forEach(function (entry) { caja.appendChild(fila(entry, pestana)); });
  }

  /* ---------- las pestañas: rótulo, número y el rojo de vencidos ---------- */

  function pintarPestanas(r) {
    var cont = $('inicio-pestanas');
    if (!cont) return;
    var cuentas = {
      adm: r.adm.length, esp: r.esp.length, liq: (r.liq || []).length,
      todos: App.listaAbiertosFiltrada ? App.listaAbiertosFiltrada().length : 0
    };
    var vencidosAdm = window.QueMeToca ? QueMeToca.vencidos(r.adm) : 0;

    Array.prototype.forEach.call(cont.querySelectorAll('.inicio-pestana'), function (b) {
      var p = b.dataset.pestana;
      /* Fila 249: «Por liquidar» solo existe si algún tipo lo pide (o aún quedan asuntos en ella). */
      if (p === 'liq') b.classList.toggle('oculto', !(window.PorLiquidar && PorLiquidar.hayTipos()));
      b.classList.toggle('activa', !filtroAviso && p === pestanaActual);
      var n = b.querySelector('.cuenta-lista');
      if (n) n.textContent = cuentas[p] || 0;
      var venc = b.querySelector('.cuenta-roja');
      if (venc) {
        venc.textContent = (p === 'adm' && vencidosAdm) ? String(vencidosAdm) : '';
        venc.classList.toggle('oculto', !(p === 'adm' && vencidosAdm));
      }
    });
  }

  /* ---------- el orquestador ---------- */

  var turno = 0;

  async function pintar() {
    if (!$('inicio-todos-asuntos') || !window.QueMeToca) return;
    if (window.Perfil && Perfil.esDirectivo()) pestanaActual = 'todos';   /* fila 287: un directivo ve una sola lista */
    var esteTurno = ++turno;
    var texto = textoBuscado();

    var r = await calcular(texto);
    if (esteTurno !== turno) return;

    pintarFiltroResponsable(r.ajustes, r.hitosAbiertos);
    pintarPestanas(r);
    pintarChip();

    /* Fila 249: sin tipos que liquidar, la pestaña no existe: se vuelve a «Todos los abiertos». */
    if (pestanaActual === 'liq' && !(window.PorLiquidar && PorLiquidar.hayTipos())) {
      pestanaActual = 'todos';
      if (window.InicioOrden) InicioOrden.reiniciar();   /* fila 367 */
      pintarPestanas(r);
    }
    if (window.PorLiquidar && pestanaActual !== 'liq') PorLiquidar.soltarTabla();

    var alto = window.scrollY;   /* fila 119: la lista se queda a la misma altura */
    if (pestanaActual === 'todos') {
      App.pintarAbiertos();
    } else if (pestanaActual === 'liq') {
      PorLiquidar.pintarTabla(r.liq);
    } else {
      pintarTabla(listaDe(pestanaActual, r), pestanaActual);
    }
    if (window.scrollY !== alto) window.scrollTo(0, alto);

    /* El trozo activo de la franja de avisos (si lo hay) se resalta
       según el chip: se repinta la franja con lo que ya tiene
       guardado, sin recalcular ningún aviso. */
    if (window.AvisosLinea && AvisosLinea.refrescar) AvisosLinea.refrescar();
  }

  /* ---------- arranque ---------- */

  function enganchar() {
    if (!$('pantalla-abiertos')) return;

    Array.prototype.forEach.call(document.querySelectorAll('.inicio-pestana'), function (b) {
      b.onclick = function () { cambiar(b.dataset.pestana); };
    });

    if ($('inicio-quitar-filtro')) {
      $('inicio-quitar-filtro').onclick = function () { filtroAviso = null; pintar(); };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  window.InicioTabla = {
    pintar: pintar, cambiar: cambiar,
    avisoActivo: avisoActivo, filtrarPorAviso: filtrarPorAviso,
    /* para las pruebas */
    _pestanaActual: function () { return pestanaActual; }
  };

})();
