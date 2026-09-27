/* ============================================================
   inicio.js — la pantalla de Inicio (27-sep-2026, fila 191,
   docs/INICIO-CUATRO-BLOQUES.md, apartados 1, 2, 3, 4 y 7).

   "Asuntos abiertos" pasa a llamarse "Inicio" y enseña, todo a la
   vez, en el orden en que se mira por la mañana:

     1. "Ha llegado": los documentos sueltos y los correos de la
        bandeja, juntos, los más nuevos arriba.
     2. "Me toca": un hito por asunto, el que le toca a Administración,
        con fecha, ordenado por plazo. Cálculos de js/que-me-toca.js.
     3. "Esperamos a otros": un hito por asunto, el que espera a
        cualquier otro, ordenado por días de espera.
     4. El tablón, en su columna, sin esconderse nunca.

   Los apartados 5 y 6 (docs/INICIO-CUATRO-BLOQUES.md: la tabla "Todos
   los asuntos abiertos" y los plegados "Dormidos"/"Sin fecha") son la
   fila 192: la tabla vive en el trío asuntos-lista*.js
   (App.pintarAbiertos ya la pinta dentro de #inicio-tabla-cuerpo); los
   plegados, en js/inicio-plegados.js (InicioPlegados.pintar), enganchados
   aquí mismo con lo que ya calcula repintarTodo (g.sinFecha,
   QueMeToca.reunirDormidos()).

   Se engancha por window.Gestor.alRefrescar, como avisos.js y
   tablon.js: nada de envolturas nuevas. Va penúltimo en index.html
   (justo antes de js/envolturas-esperadas.js), para tener ya a mano
   todo lo que usa (QueMeToca, Bandeja, BandejaPantalla, HitosPanel,
   FichaTarjetas, Reservados, App.tarjetaSuelto…).
   ============================================================ */
(function () {

  var TOPE_ME_TOCA = 8;
  var TOPE_ESPERAMOS = 8;
  var TOPE_HA_LLEGADO = 6;
  var DIAS_ESPERA_ROJO = 15;
  var DIAS_ESPERA_AMBAR = 7;

  var verTodoMeToca = false;
  var verTodoEsperamos = false;

  function $(id) { return document.getElementById(id); }

  /* "5-sep": igual que la fecha corta sin año que usa Plazos.etiquetaMeToca
     (js/plazos.js) para "Sin prisa · …", aquí para "desde el …". */
  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaCorta(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3) return '';
    var mes = parseInt(p[1], 10);
    if (!mes || mes < 1 || mes > 12) return '';
    return String(parseInt(p[2], 10)) + '-' + MESES_CORTOS[mes - 1];
  }

  /* ==========================================================
     EL BUSCADOR DE LA CABECERA, PARA LOS TRES BLOQUES
     ========================================================== */

  function textoBuscado() {
    var campo = $('buscar-abiertos');
    return campo ? U.normalizar(campo.value) : '';
  }

  /* Nombre, tipo y tercero de un asunto, ya normalizados (fila 191,
     apartado 3): tapado, sin el tercero (Reservados.textoDeBusqueda). */
  function textoDelAsunto(a) {
    if (window.Reservados && Reservados.tapar(a)) return Reservados.textoDeBusqueda(a);
    var tercero = window.QueMeToca ? QueMeToca.terceroDe(a) : '';
    return U.normalizar([a.nombre, a.leido && a.leido.tipo, tercero].filter(Boolean).join(' '));
  }

  function coincideAsunto(a, texto) {
    return !texto || textoDelAsunto(a).indexOf(texto) !== -1;
  }

  function coincideTexto(texto, campos) {
    return !texto || U.normalizar(campos.filter(Boolean).join(' ')).indexOf(texto) !== -1;
  }

  /* ==========================================================
     "ME TOCA" Y "ESPERAMOS A OTROS"
     ========================================================== */

  /* El badge rojo de vencidos, en la propia pestaña de Inicio (fila
     191, apartado 7: el número que llevaba "Qué me toca" pasa aquí).
     Se repinta en cada vuelta de Inicio (no hace falta esperar al
     enganche por lotes de js/que-me-toca.js, que solo lo mantiene al
     día cuando no se ha visitado Inicio todavía). */
  function pintarCuentaVencidos(items) {
    var el = $('cuenta-vencidos-inicio');
    if (!el) return;
    var n = QueMeToca.vencidos(items);
    el.textContent = n ? String(n) : '';
    el.classList.toggle('oculto', !n);
  }

  function pintarFiltroResponsable(ajustes) {
    var sel = $('inicio-me-toca-responsable');
    if (!sel) return;
    var actual = QueMeToca.leerFiltroResponsable();
    sel.innerHTML = ['<option value="">Todos</option>'].concat(
      (ajustes.responsables || []).map(function (r) {
        return '<option value="' + U.escapar(r.id) + '">' + U.escapar(r.nombre) + '</option>';
      })
    ).join('');
    sel.value = actual;
    if (sel.value !== actual) sel.value = '';   /* el guardado ya no existe */
    sel.onchange = function () {
      QueMeToca.guardarFiltroResponsable(this.value);
      repintarTodo();
    };
  }

  /* El tipo, en su propia etiqueta gris (igual que .marca-tipo de
     siempre). "Sin tipo" queda fuera: no aporta nada aquí. */
  function etiquetaTipo(a) {
    if (!a.leido || !a.leido.tipo) return '';
    var texto = window.Nombres ? Nombres.tipoParaVer(a.leido.tipo, App.E.tipos) : a.leido.tipo;
    return '<span class="marca-tipo">' + U.escapar(texto) + '</span>';
  }

  /* Tercero y quién lo encarga, en gris; con el candado si es
     reservado, sin el tercero (igual que hacía que-me-toca.js). */
  function lineaTerceroYEncarga(a) {
    var tapado = window.Reservados && Reservados.tapar(a);
    var tercero = tapado ? '' : QueMeToca.terceroDe(a);
    var organo = window.TiposOrgano ? TiposOrgano.deNombre(a.leido && a.leido.tipo) : '';
    var encarga = organo ? 'lo encarga ' + TiposOrgano.texto(organo) : '';
    var candado = window.Reservados ? Reservados.candadoHtml(a) : '';
    var trozos = [tercero, encarga].filter(Boolean);
    return candado + U.escapar(trozos.join(' · '));
  }

  /* "Hito N de M · título del hito", igual que la marca del estado en
     la tarjeta de siempre (js/estado-hito.js): App.ladoDe(a) ya lo
     calcula a partir del hito actual, que es justo el que llega aquí
     (unoPorAsunto se queda con el primero, el mismo orden). Si por lo
     que fuera no coincidiera (asunto sin hitos, por ejemplo), se cae
     al título suelto del propio hito. */
  function tituloDeHito(a, h) {
    var l = App.ladoDe(a);
    if (l && !l.sinHitos && !l.listo && l.hito === h.id) {
      return 'Hito ' + (l.n || 1) + ' de ' + Math.max(l.m || 0, l.n || 1) + (l.titulo ? ' · ' + l.titulo : '');
    }
    return h.titulo || '(sin título)';
  }

  function filaMeToca(it) {
    var h = it.hito, a = it.asunto;
    var p = Plazos.etiquetaMeToca(h.fecha);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'inicio-fila';
    if (p.clase) b.classList.add(p.clase);
    b.dataset.asunto = a.nombre;
    b.dataset.hito = h.id;
    b.innerHTML =
      '<span class="inicio-fila-l1">' +
        (p.clase ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '<span class="marca-plazo">' + U.escapar(p.texto) + '</span>') +
        etiquetaTipo(a) +
      '</span>' +
      '<span class="inicio-fila-titulo">' + U.escapar(tituloDeHito(a, h)) + '</span>' +
      '<span class="inicio-fila-gris">' + lineaTerceroYEncarga(a) + '</span>';
    b.onclick = function () { QueMeToca.abrirMesaDelHito(a, h); };
    return b;
  }

  function claseDias(dias) {
    if (dias >= DIAS_ESPERA_ROJO) return 'inicio-dias-rojo';
    if (dias >= DIAS_ESPERA_AMBAR) return 'inicio-dias-ambar';
    return '';
  }

  function filaEsperamos(it, ajustes) {
    var h = it.hito, a = it.asunto;
    var contexto = QueMeToca.contextoResponsable(a);
    var r = Hitos.resolverResponsable(h.responsable, ajustes, contexto);
    var quien = r ? r.texto : h.responsable;
    var dias = QueMeToca.diasParado(h);
    var clase = claseDias(dias);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'inicio-fila';
    if (clase) b.classList.add(clase);
    b.dataset.asunto = a.nombre;
    b.dataset.hito = h.id;
    b.innerHTML =
      '<span class="inicio-fila-l1">' +
        '<span class="marca-plazo' + (clase ? ' ' + clase : '') + '">' +
          (dias === 1 ? '1 día' : dias + ' días') + '</span>' +
        etiquetaTipo(a) +
      '</span>' +
      '<span class="inicio-fila-titulo">Esperando a ' + U.escapar(quien) + ' · ' +
        U.escapar(h.titulo || '(sin título)') + '</span>' +
      '<span class="inicio-fila-gris">' + lineaTerceroYEncarga(a) +
        (h.desde ? ' · desde el ' + U.escapar(fechaCorta(h.desde)) : '') + '</span>';
    b.onclick = function () { App.abrirFicha(a, 'abierto'); };
    return b;
  }

  /* Pinta un bloque de hitos ("Me toca" o "Esperamos a otros"): como
     mucho `tope` filas, con "Ver los N" para quitar el tope, sin salir
     de Inicio (decisión 2 de la fila 191). */
  function pintarBloqueDeHitos(lista, opciones) {
    var caja = $(opciones.idLista);
    var cuenta = $(opciones.idCuenta);
    var verMas = $(opciones.idVerMas);
    if (!caja) return;
    if (cuenta) cuenta.textContent = lista.length ? String(lista.length) : '';

    var verTodo = opciones.verTodo();
    var visibles = verTodo ? lista : lista.slice(0, opciones.tope);

    caja.innerHTML = '';
    if (!visibles.length) {
      var vacio = document.createElement('div');
      vacio.className = 'inicio-lista-vacia';
      vacio.textContent = opciones.vacio;
      caja.appendChild(vacio);
    }
    visibles.forEach(function (it) { caja.appendChild(opciones.fila(it)); });

    if (verMas) {
      var quedan = lista.length > opciones.tope;
      verMas.classList.toggle('oculto', verTodo || !quedan);
      verMas.textContent = 'Ver los ' + lista.length;
      verMas.onclick = function () { opciones.marcarVerTodo(); repintarTodo(); };
    }
  }

  function pintarMeToca(lista) {
    pintarBloqueDeHitos(lista, {
      idLista: 'inicio-me-toca-lista', idCuenta: 'inicio-me-toca-n', idVerMas: 'inicio-me-toca-ver',
      tope: TOPE_ME_TOCA, fila: filaMeToca, vacio: 'Nada pendiente por ahora.',
      verTodo: function () { return verTodoMeToca; },
      marcarVerTodo: function () { verTodoMeToca = true; }
    });
  }

  function pintarEsperamos(lista, ajustes) {
    pintarBloqueDeHitos(lista, {
      idLista: 'inicio-esperamos-lista', idCuenta: 'inicio-esperamos-n', idVerMas: 'inicio-esperamos-ver',
      tope: TOPE_ESPERAMOS, fila: function (it) { return filaEsperamos(it, ajustes); },
      vacio: 'No se espera a nadie por ahora.',
      verTodo: function () { return verTodoEsperamos; },
      marcarVerTodo: function () { verTodoEsperamos = true; }
    });
  }

  /* ==========================================================
     "HA LLEGADO": SUELTOS Y CORREOS, JUNTOS
     ========================================================== */

  async function reunirHaLlegado(texto) {
    var sueltos = (App.E.sueltos || []).filter(function (s) {
      return coincideTexto(texto, [s.nombre]);
    });
    var items = [];
    for (var i = 0; i < sueltos.length; i++) {
      var s = sueltos[i];
      var fecha = await App.fechaDeSuelto(s);
      items.push({ tipo: 'suelto', suelto: s, fecha: fecha });
    }

    var correos = window.Bandeja ? window.Bandeja.correos() : null;
    if (Array.isArray(correos)) {
      correos.filter(function (item) {
        var d = item.datos;
        return coincideTexto(texto, [d.asunto, d.de && (d.de.nombre || d.de.correo)]);
      }).forEach(function (item) {
        var d = item.datos;
        var f = new Date(String(d.fecha || '') + 'T00:00:00');
        items.push({ tipo: 'correo', item: item, fecha: isNaN(f.getTime()) ? null : f });
      });
    }

    items.sort(function (a, b) {
      var ta = a.fecha ? a.fecha.getTime() : 0;
      var tb = b.fecha ? b.fecha.getTime() : 0;
      return tb - ta;
    });
    return items;
  }

  function nodoDeHaLlegado(it) {
    var nodo;
    if (it.tipo === 'suelto') {
      var s = it.suelto;
      var pie = it.fecha ? 'Puesto ahí el ' + it.fecha.toLocaleDateString('es-ES') + ' a las ' +
        String(it.fecha.getHours()).padStart(2, '0') + ':' + String(it.fecha.getMinutes()).padStart(2, '0') : '';
      nodo = App.tarjetaSuelto(s, pie, !!App.E.reciales[s.nombre]);
    } else {
      nodo = window.BandejaPantalla ? window.BandejaPantalla.tarjeta(it.item) : document.createElement('div');
    }
    nodo.classList.add('inicio-fila-compacta');
    return nodo;
  }

  async function pintarHaLlegado(texto) {
    var caja = $('inicio-ha-llegado-lista');
    if (!caja) return;
    var items = await reunirHaLlegado(texto);
    var n = items.length;

    var cuenta = $('inicio-ha-llegado-n');
    if (cuenta) cuenta.textContent = n ? String(n) : '';

    /* El botón "Ver todo" reaprovechado (.panel[data-vista="clasificar"])
       enseña el mismo número: sueltos + correos, coherente con "Ha
       llegado" (fila 191, apartado 1). */
    var cuentaClasificar = $('cuenta-clasificar');
    if (cuentaClasificar) {
      cuentaClasificar.textContent = String(n);
      cuentaClasificar.classList.toggle('cuenta-ambar', n > 0);
    }

    caja.innerHTML = '';
    if (!n) {
      caja.innerHTML = '<div class="vacio">No ha llegado nada nuevo.</div>';
      return;
    }
    items.slice(0, TOPE_HA_LLEGADO).forEach(function (it) { caja.appendChild(nodoDeHaLlegado(it)); });
  }

  /* ==========================================================
     EL AVISO DE ASPIRANTES SIN Nº DE IDENTIFICACIÓN ESCOLAR

     Venía de la vieja pantalla "Qué me toca" (bloqueAspirantes): se
     queda con la MISMA clase CSS (qmt-aviso-aspirantes, encima de
     qmt-fila para el aspecto), para no tocar css/que-me-toca.css ni
     las pruebas que la buscan por esa clase.
     ========================================================== */

  async function pintarAvisoAspirantes() {
    var caja = $('inicio-aviso-aspirantes');
    if (!caja) return;
    var n = await QueMeToca.contarAspirantesSinNumero();
    caja.innerHTML = '';
    if (!n) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'qmt-fila qmt-aviso-aspirantes';
    b.textContent = n + ' ' + (n === 1 ? 'aspirante' : 'aspirantes') +
      ' sin Nº de identificación escolar';
    b.onclick = function () {
      if ($('filtro-personas')) $('filtro-personas').value = 'ALUMNADO';
      if ($('buscar-personas')) $('buscar-personas').value = '';
      App.ir('personas');
      if (App.pintarPersonas) App.pintarPersonas();
    };
    caja.appendChild(b);
  }

  /* ==========================================================
     EL REPINTADO ENTERO
     ========================================================== */

  var turno = 0;

  async function repintarTodo() {
    if (!$('inicio-rejilla') || !window.QueMeToca) return;
    var esteTurno = ++turno;
    var texto = textoBuscado();

    var datos = await QueMeToca.reunir();
    if (esteTurno !== turno) return;
    pintarFiltroResponsable(datos.ajustes);
    pintarCuentaVencidos(datos.items);

    var items = QueMeToca.unoPorAsunto(datos.items);
    var filtro = QueMeToca.leerFiltroResponsable();
    if (filtro) {
      items = items.filter(function (it) {
        return window.HitosAdministracion
          ? HitosAdministracion.cuentaPara(it.hito.responsable, filtro, datos.ajustes)
          : it.hito.responsable === filtro;
      });
    }
    items = items.filter(function (it) { return coincideAsunto(it.asunto, texto); });

    var g = QueMeToca.clasificar(items, datos.ajustes);
    pintarMeToca(g.tejado);
    pintarEsperamos(g.otros, datos.ajustes);
    if (window.InicioPlegados) InicioPlegados.pintar(g.sinFecha, QueMeToca.reunirDormidos());

    await pintarHaLlegado(texto);
    if (esteTurno !== turno) return;
    await pintarAvisoAspirantes();
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  function enganchar() {
    if (!$('pantalla-abiertos')) return;

    if ($('btn-ha-llegado-volver')) {
      $('btn-ha-llegado-volver').onclick = function () { App.irVista('departamento'); };
    }

    /* El buscador de la cabecera ya lleva su propio .oninput
       (js/asuntos-lista-pintar.js, para el legado): este se añade sin
       pisarlo, así que los dos conviven (fila 191, apartado 3). */
    if ($('buscar-abiertos')) $('buscar-abiertos').addEventListener('input', repintarTodo);

    if (window.Gestor) window.Gestor.alRefrescar.push(repintarTodo);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  window.Inicio = { repintar: repintarTodo };

})();

App.arrancar();
