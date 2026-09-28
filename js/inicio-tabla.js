/* ============================================================
   inicio-tabla.js — pestañas + la tabla única de Inicio (27-sep-2026,
   fila 209, docs/INICIO-EN-PESTANAS.md). Sustituye a js/inicio-plegados.js
   (borrado en esta misma fila) y a los bloques "Me toca"/"Esperamos a
   otros" de js/inicio.js (fila 191/192).

   Cuatro pestañas, una sola tabla debajo (App.filaTablaAsunto,
   js/asuntos-lista-pintar.js):

     - "En Administración" (`adm`): QueMeToca.clasificar(...).tejado —
       el hito actual de cada asunto abierto que le toca a
       Administración, CON O SIN FECHA (js/que-me-toca.js ya no exige
       fecha para entrar aquí: fila 209, apartado 2).
     - "En espera" (`esp`): QueMeToca.clasificar(...).otros.
     - "Todos los abiertos" (`todos`): App.pintarAbiertos pinta esta
       pestaña de verdad (sigue siendo LA función que lo hace, porque
       js/unir-asuntos.js la envuelve); aquí solo se la llama.
     - "Dormidos" (`dorm`): QueMeToca.reunirDormidos(), sin cambios.

   Se engancha a window.Gestor.alRefrescar desde js/inicio.js (un solo
   punto de enganche para toda la pantalla de Inicio), que llama a
   InicioTabla.pintar() dentro de su propio repintado.

   Se carga justo después de js/inicio.js. */
(function () {

  var CLAVE_PESTANA = 'gestor-inicio-pestana';
  var PESTANAS = ['adm', 'esp', 'todos', 'dorm'];
  var ROTULOS = { adm: 'En Administración', esp: 'En espera', todos: 'Todos los abiertos', dorm: 'Dormidos' };

  function $(id) { return document.getElementById(id); }

  /* ---------- la pestaña activa, recordada por ordenador ----------

     Decisión explícita de la fila 209 (ver el plan de esta fila): por
     defecto, la primera vez, es 'todos', NO 'adm'. Unos 25 ficheros de
     pruebas/ pulsan una fila de la tabla esperando que abra la ficha
     del asunto, no la mesa del hito (que es lo que hace la pestaña
     "En Administración"); con 'todos' de partida se preserva ese
     comportamiento para cualquier prueba que no mencione pestañas. */
  function pestanaInicial() {
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
    if (PESTANAS.indexOf(cual) === -1 || cual === pestanaActual) return;
    pestanaActual = cual;
    filtroAviso = null;   /* cambiar de pestaña a mano quita el chip */
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
     filtro más de #filtros-abiertos, y solo afecta a "En
     Administración"/"En espera" (las dos pestañas que pasan por
     QueMeToca.clasificar). */
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
    sel.onchange = function () {
      QueMeToca.guardarFiltroResponsable(this.value);
      pintar();
    };
  }

  /* ---------- reunir las listas de las cuatro pestañas ---------- */

  async function calcular(texto) {
    var datos = await QueMeToca.reunir();
    var items = QueMeToca.unoPorAsunto(datos.items);
    var filtroResp = QueMeToca.leerFiltroResponsable();
    var hitosAbiertos = items.map(function (it) { return it.hito; });   /* fila 205: para el filtro, antes de filtrar */
    if (filtroResp) {
      items = items.filter(function (it) {
        return window.HitosAdministracion
          ? HitosAdministracion.cuentaPara(it.hito.responsable, filtroResp, datos.ajustes)
          : it.hito.responsable === filtroResp;
      });
    }
    items = items.filter(function (it) { return coincideAsunto(it.asunto, texto); });

    var g = QueMeToca.clasificar(items, datos.ajustes);
    var dormidos = QueMeToca.reunirDormidos().filter(function (it) { return coincideAsunto(it.asunto, texto); });
    return { ajustes: datos.ajustes, adm: g.tejado, esp: g.otros, dorm: dormidos, hitosAbiertos: hitosAbiertos };
  }

  function listaDe(pestana, r) {
    if (pestana === 'adm') return r.adm;
    if (pestana === 'esp') return r.esp;
    if (pestana === 'dorm') return r.dorm;
    return [];
  }

  /* ---------- pintar una fila de "adm"/"esp"/"dorm" ---------- */

  function fila(entry, pestana) {
    var opciones = { pestana: pestana };
    if (pestana === 'adm' || pestana === 'esp') opciones.hito = entry.hito;
    if (pestana === 'esp') opciones.dias = QueMeToca.diasParado(entry.hito);
    if (pestana === 'dorm') opciones.dias = entry.dias;
    return App.filaTablaAsunto(entry.asunto, opciones);
  }

  function pintarTabla(lista, pestana) {
    var caja = $('inicio-tabla-cuerpo');
    if (!caja) return;
    var rotulo = $('cuenta-lista-abiertos');
    if (rotulo) rotulo.textContent = lista.length;
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<tr><td colspan="7" class="vacio">' +
        (pestana === 'adm' ? 'Nada pendiente de Administración por ahora.'
          : pestana === 'esp' ? 'No se espera a nadie por ahora.'
          : 'Ningún asunto dormido por ahora.') +
        '</td></tr>';
      return;
    }
    lista.forEach(function (entry) { caja.appendChild(fila(entry, pestana)); });
  }

  /* ---------- las pestañas: rótulo, número y el rojo de vencidos ---------- */

  function pintarPestanas(r) {
    var cont = $('inicio-pestanas');
    if (!cont) return;
    var cuentas = {
      adm: r.adm.length, esp: r.esp.length, dorm: r.dorm.length,
      todos: App.listaAbiertosFiltrada ? App.listaAbiertosFiltrada().length : 0
    };
    var vencidosAdm = window.QueMeToca ? QueMeToca.vencidos(r.adm) : 0;

    Array.prototype.forEach.call(cont.querySelectorAll('.inicio-pestana'), function (b) {
      var p = b.dataset.pestana;
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
    var esteTurno = ++turno;
    var texto = textoBuscado();

    var r = await calcular(texto);
    if (esteTurno !== turno) return;

    pintarFiltroResponsable(r.ajustes, r.hitosAbiertos);
    pintarPestanas(r);
    pintarChip();

    var alto = window.scrollY;   /* fila 119: la lista se queda a la misma altura */
    if (pestanaActual === 'todos') {
      App.pintarAbiertos();
    } else {
      pintarTabla(listaDe(pestanaActual, r), pestanaActual);
    }
    if (window.scrollY !== alto) window.scrollTo(0, alto);

    /* El trozo activo de la franja de avisos (si lo hay) se resalta
       según el chip: se repinta la franja con lo que ya tiene
       guardado, sin recalcular ningún aviso. */
    if (window.AvisosLinea && AvisosLinea.refrescar) AvisosLinea.refrescar();
  }

  /* ---------- «Ordenar»: se queda igual que antes de esta fila (solo
     gobierna la pestaña "Todos los abiertos", vía App.ORDENES /
     App.pintarAbiertos, sin tocar js/asuntos-lista.js): el propio
     documento de la fila no pide que "En Administración"/"En espera"/
     "Dormidos" dejen su orden natural (vencidos primero, o más días
     esperando/dormido arriba) por el que se elija aquí. ---------- */

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
