/* ============================================================
   por-liquidar.js — los asuntos «Por liquidar» (1-oct-2026, fila 249,
   docs/POR-LIQUIDAR.md).

   Hay asuntos que, terminados, aún no se pueden archivar: hay que
   liquidarlos de vez en cuando con otro órgano del centro (el seguro
   escolar que cobra Administración y entrega a Secretaría). Cada tipo
   de asunto lleva una casilla en Ajustes, «Al terminar, pasa a «Por
   liquidar» en vez de archivarse» (`tipo.liquidar`, apartado «Al terminar
   el asunto», fila 274). Los asuntos de esos tipos, en el momento
   en que se ofrecería archivarlos, pasan a la pestaña «Por liquidar» de
   Inicio en vez de archivarse.

   El estado vive en la ficha del asunto: `porLiquidar: { desde: AAAA-MM-DD,
   auto: true|false }`, nunca en el nombre de la carpeta. `auto` quiere
   decir que entró solo, al dar por hecho el último hito: si luego se
   desmarca un hito o se añade uno, vuelve a su pestaña normal sin que
   nadie lo pida (`destapar`). Si se pasó con el botón «Pasar a Por
   liquidar», se queda hasta que se liquide.

   Este fichero tiene lo común: qué tipo exige liquidar, pasar y quitar,
   el importe de cada asunto y la pestaña (tabla, casillas, total). El
   cuadro «Liquidar» y el PDF viven en js/por-liquidar-liquidar.js.
   Carga después de js/inicio-tabla.js.
   ============================================================ */
window.PorLiquidar = (function () {

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     QUÉ TIPOS Y QUÉ ASUNTOS
     ========================================================== */

  function nombreDeTipo(a) {
    return (a && a.leido && a.leido.tipo) || (a && a.ficha && a.ficha.tipo) || '';
  }

  function tipoDe(a) {
    var nombre = nombreDeTipo(a);
    var lista = (window.App && App.E && App.E.tipos) || [];
    return lista.filter(function (t) { return t.tipo === nombre; })[0] ||
      lista.filter(function (t) { return (t.alias || []).indexOf(nombre) !== -1; })[0] || null;
  }

  function exige(a) {
    var t = tipoDe(a);
    return !!(t && t.liquidar);
  }

  function hayTipos() {
    return ((window.App && App.E && App.E.tipos) || []).some(function (t) { return t.liquidar; });
  }

  function estaPorLiquidar(a) {
    return !!(a && a.ficha && a.ficha.porLiquidar && a.ficha.porLiquidar.desde);
  }

  function lista() {
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    return asuntos.filter(estaPorLiquidar).sort(function (x, y) {
      var dx = x.ficha.porLiquidar.desde, dy = y.ficha.porLiquidar.desde;
      return dx === dy ? (x.nombre < y.nombre ? -1 : 1) : (dx < dy ? -1 : 1);
    });
  }

  function repintar(a) {
    if (window.Inicio && Inicio.repintar) Inicio.repintar();
    /* La ficha abierta cambia su botón («Pasar a Por liquidar» / «Archivar el asunto»). */
    try { if (a && App.repintarAccionesFicha) App.repintarAccionesFicha(a.nombre); } catch (e) { /* solo pintar */ }
  }

  /* ==========================================================
     PASAR A «POR LIQUIDAR» Y VOLVER
     ========================================================== */

  async function pasar(a, opciones) {
    var o = opciones || {};
    var estado = { desde: U.hoyIso(), auto: !!o.auto };
    await App.anotar(a.nombre, { porLiquidar: estado });
    if (a.ficha) a.ficha.porLiquidar = estado;
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Pasa a Por liquidar');
    if (!o.sinRepintar) repintar(a);
  }

  async function quitar(a) {
    await App.anotar(a.nombre, { porLiquidar: null });
    if (a.ficha) a.ficha.porLiquidar = null;
    repintar(a);
  }

  /* Lo que llaman los botones «Archivar el asunto» / «Archivar»: para un
     tipo que hay que liquidar, el asunto pasa a «Por liquidar» (con su
     aviso y «Deshacer»); para los demás, el archivado de siempre. */
  async function archivarOPasar(a) {
    if (!exige(a) || estaPorLiquidar(a)) return App.cerrarAsunto(a);
    await pasar(a, { auto: false });
    U.aviso('Pasa a Por liquidar.', 'bueno', {
      boton: 'Deshacer',
      alPulsar: function () { quitar(a).catch(function (e) { U.fallo('No he podido deshacerlo', e); }); }
    });
  }

  function textoDelBoton(a) {
    return exige(a) ? (estaPorLiquidar(a) ? 'Ir a Por liquidar' : 'Pasar a Por liquidar') : 'Archivar el asunto';
  }

  /* Tras dar por hecho un hito (js/hitos-panel-lista.js): si era el
     último y el tipo hay que liquidarlo, el asunto pasa solo. */
  async function alMarcarHecho(a, h) {
    try {
      if (!exige(a) || estaPorLiquidar(a)) return;
      var datos = await Hitos.leer();
      var entrada = datos.porAsunto[a.nombre];
      if (!entrada || !entrada.hitos.length) return;
      var r = Hitos.aQuienLeToca(entrada.hitos, datos.ajustes);
      if (!r.listo) return;
      await pasar(a, { auto: true });
      U.aviso('Pasa a Por liquidar.', 'bueno', {
        boton: 'Deshacer',
        alPulsar: async function () {
          try {
            await Hitos.marcar(a.nombre, h.id, 'pendiente', '');
            await quitar(a);
            if (window.HitosPanel) HitosPanel.programarRepintado();
          } catch (e) { U.fallo('No he podido deshacerlo', e); }
        }
      });
    } catch (e) {
      U.accesorio('El hito está hecho, pero no he podido pasar el asunto a Por liquidar', e);
    }
  }

  /* Un hito vuelve a «pendiente»: un asunto que entró solo vuelve a su pestaña. */
  async function alDesmarcar(a) {
    try { if (estaPorLiquidar(a) && a.ficha.porLiquidar.auto) await quitar(a); } catch (e) { /* se arregla al repintar */ }
  }

  /* El asunto que entró solo y ya tiene un hito pendiente (se desmarcó o
     se añadió uno): sale de «Por liquidar». */
  async function destapar(a) {
    if (!estaPorLiquidar(a) || !a.ficha.porLiquidar.auto) return false;
    try { await App.anotar(a.nombre, { porLiquidar: null }); } catch (e) { return false; }
    if (a.ficha) a.ficha.porLiquidar = null;
    return true;
  }

  /* ==========================================================
     LA REGLA DE LA FILA 253 (docs/POR-LIQUIDAR-AL-CAMBIAR-TIPO.md)
     ==========================================================

     Un asunto abierto, de un tipo que hay que liquidar, que no está ya
     en «Por liquidar» y no tiene ningún hito por hacer (todos hechos, o
     ninguno) pasa solo, como automático. La usan tres sitios: cambiar el
     tipo de un asunto, marcar la casilla en un tipo y la pasada al
     entrar. Si le quedan hitos por hacer, no se toca. */

  /* Los pasos de la guía del tipo cuentan: si el asunto aún no los tiene (se
     crean o se completan al abrir su ficha, js/hitos-sincronizar.js), le quedan
     cosas por hacer aunque ahora no lo parezca. Un asunto cuyo tipo vino de unir
     dos tipos (`tipoUnidoDe`) no recibe los pasos de la guía nueva. */
  function sinNadaPorHacer(a, datos) {
    var entrada = datos.porAsunto && datos.porAsunto[a.nombre];
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(nombreDeTipo(a))) || [];
    var recibePasos = pasos.length && !(a.ficha && a.ficha.tipoUnidoDe);
    if (!entrada || !entrada.hitos || !entrada.hitos.length) return !recibePasos;
    if (recibePasos && Hitos.pasosQueFaltan && Hitos.pasosQueFaltan(entrada.hitos, pasos, entrada.pasosConocidos).anadidos) return false;
    return !!Hitos.aQuienLeToca(entrada.hitos, datos.ajustes).listo;
  }

  /* Devuelve los asuntos que han pasado. */
  async function revisar(asuntos) {
    var pasados = [];
    if (!hayTipos()) return pasados;
    var candidatos = (asuntos || []).filter(function (a) { return a && exige(a) && !estaPorLiquidar(a); });
    if (!candidatos.length) return pasados;
    var datos = await Hitos.leer();
    for (var i = 0; i < candidatos.length; i++) {
      if (!sinNadaPorHacer(candidatos[i], datos)) continue;
      await pasar(candidatos[i], { auto: true, sinRepintar: true });
      pasados.push(candidatos[i]);
    }
    if (pasados.length) repintar(pasados[0]);
    return pasados;
  }

  async function quitarTodos(asuntos) {
    for (var i = 0; i < asuntos.length; i++) await quitar(asuntos[i]);
  }

  /* 1. Tras cambiar el tipo de un asunto abierto (js/asuntos-editar.js), ya con
     la guía nueva ofrecida: si cumple la regla, pasa, con «Deshacer». */
  async function alCambiarTipo(nombre, tipoViejo, tipoNuevo) {
    if (tipoViejo === tipoNuevo) return;
    try {
      var a = (window.Gestor ? Gestor.asuntos() : []).filter(function (x) { return x.nombre === nombre; })[0];
      if (!a) return;
      var pasados = await revisar([a]);
      if (!pasados.length) return;
      U.aviso('Pasa a Por liquidar.', 'bueno', {
        boton: 'Deshacer',
        alPulsar: function () { quitarTodos(pasados).catch(function (e) { U.fallo('No he podido deshacerlo', e); }); }
      });
    } catch (e) {
      U.accesorio('El tipo está cambiado, pero no he podido pasar el asunto a Por liquidar', e);
    }
  }

  /* 2. Tras marcar la casilla en un tipo (Ajustes): pasan todos sus asuntos abiertos
     que cumplan la regla; un solo aviso, sin aviso si no pasa ninguno. */
  async function alMarcarCasilla(tipo) {
    try {
      if (!tipo || !tipo.liquidar) return;
      var suyos = (window.Gestor ? Gestor.asuntos() : []).filter(function (a) { return nombreDeTipo(a) === tipo.tipo; });
      var pasados = await revisar(suyos);
      if (!pasados.length) return;
      U.aviso(pasados.length + (pasados.length === 1 ? ' asunto pasa a Por liquidar.' : ' asuntos pasan a Por liquidar.'), 'bueno', {
        boton: 'Deshacer',
        alPulsar: function () { quitarTodos(pasados).catch(function (e) { U.fallo('No he podido deshacerlo', e); }); }
      });
    } catch (e) {
      U.accesorio('La casilla está marcada, pero no he podido pasar sus asuntos a Por liquidar', e);
    }
  }

  /* 3. Una pasada al entrar, en segundo plano y sin aviso verde. Nunca con un
     guardado en marcha (ColaGuardado); si falla, solo ámbar. */
  var yaMirado = false;
  function alEntrar() {
    if (yaMirado || !window.App || !App.E || !App.E.registro || !App.E.listaAbiertos || !App.E.listaAbiertos.length) return;
    yaMirado = true;
    var intentos = 0;
    (function turno() {
      setTimeout(async function () {
        if (window.ColaGuardado && ColaGuardado.hayGuardado() && ++intentos < 10) return turno();
        try { await revisar(Gestor.asuntos()); }
        catch (e) { U.accesorio('No he podido mirar qué asuntos pasan a Por liquidar', e); }
      }, 2500);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  /* ==========================================================
     EL IMPORTE DE CADA ASUNTO
     ========================================================== */

  /* El primer campo propio de clase «Importe en euros» del tipo, o null. */
  function campoImporte(a) {
    var campos = (window.App && App.E && App.E.campos) || {};
    var cfgs = (campos.porTipo && campos.porTipo[nombreDeTipo(a)]) || [];
    var propios = campos.propios || [];
    for (var i = 0; i < cfgs.length; i++) {
      if (cfgs[i].origen !== 'propio') continue;
      var p = propios.filter(function (x) { return x.id === cfgs[i].id; })[0];
      if (p && p.clase === 'importe') return { clave: 'propio:' + p.id, nombre: p.nombre };
    }
    return null;
  }

  /* null si el tipo no tiene campo de importe; si no, { n, sinImporte, texto }.
     Uno vacío o que no se entiende (ámbar) cuenta 0 y se dice. */
  function importeDe(a) {
    var c = campoImporte(a);
    if (!c) return null;
    var g = ((a.ficha && a.ficha.campos) || {})[c.clave];
    var t = (g && g.valor !== undefined && g.valor !== null) ? String(g.valor).trim() : '';
    if (!t) return { n: 0, sinImporte: true, texto: '' };
    var r = CamposClases.leer('importe', t);
    if (!r.ok) return { n: 0, sinImporte: true, texto: t };
    return { n: parseFloat(r.valor), sinImporte: false, texto: CamposClases.mostrar('importe', t) };
  }

  function euros(n) { return CamposClases.formatoEs(Math.round(n * 100) / 100, 2) + ' €'; }

  /* PURA: { n (asuntos), total, sinImporte } de una lista de asuntos. */
  function sumar(asuntos) {
    var total = 0, sin = 0;
    asuntos.forEach(function (a) {
      var i = importeDe(a);
      if (i && !i.sinImporte) total += i.n; else sin++;
    });
    return { n: asuntos.length, total: Math.round(total * 100) / 100, sinImporte: sin };
  }

  /* ==========================================================
     LA PESTAÑA «POR LIQUIDAR»
     ========================================================== */

  var marcados = {};   /* nombre del asunto → true */
  var visibles = [];   /* los asuntos que se ven ahora */

  function marcadosVisibles() {
    return visibles.filter(function (a) { return marcados[a.nombre]; });
  }

  function textoDeMarcados() {
    var m = marcadosVisibles();
    var s = sumar(m);
    var conImporte = visibles.some(function (a) { return importeDe(a); });
    var t = 'Marcados: ' + s.n + (s.n === 1 ? ' asunto' : ' asuntos');
    if (conImporte) {
      t += ' · Total: ' + euros(s.total);
      if (s.sinImporte) t += ' (' + s.sinImporte + ' sin importe)';
    }
    return t;
  }

  function pintarMarcados() {
    var linea = $('inicio-liquidar-marcados');
    if (linea) linea.textContent = textoDeMarcados();
    var boton = $('inicio-liquidar-boton');
    if (boton) boton.disabled = !marcadosVisibles().length;
    var todos = $('liq-todos');
    if (todos) {
      var n = marcadosVisibles().length;
      todos.checked = visibles.length > 0 && n === visibles.length;
      todos.indeterminate = n > 0 && n < visibles.length;
    }
  }

  function fila(a, conImporte) {
    var tr = document.createElement('tr');
    tr.className = 'inicio-tabla-fila inicio-tabla-fila-liquidar';
    tr.dataset.asunto = a.nombre;
    var tapado = window.Reservados && Reservados.tapar(a);
    if (tapado) tr.classList.add('inicio-tabla-fila-tapada');

    var tdCasilla = document.createElement('td');
    tdCasilla.className = 'liq-casilla';
    var caja = document.createElement('input');
    caja.type = 'checkbox';
    caja.className = 'liq-marca';
    caja.title = 'Marcar para liquidar';
    caja.checked = !!marcados[a.nombre];
    caja.onchange = function () {
      if (caja.checked) marcados[a.nombre] = true; else delete marcados[a.nombre];
      pintarMarcados();
    };
    tdCasilla.appendChild(caja);
    tr.appendChild(tdCasilla);

    var tdTercero = document.createElement('td');
    tdTercero.className = 'inicio-tabla-tercero';
    var span = document.createElement('span');
    span.className = 'nombre-pulsable tarjeta-nombre';
    span.title = 'Abrir la ficha de este asunto';
    var candado = window.Reservados ? Reservados.candadoHtml(a) : '';
    span.innerHTML = candado + '<b>' + (tapado ? 'Reservado' : U.escapar(QueMeToca.terceroDe(a) || a.nombre)) + '</b>';
    tdTercero.appendChild(span);
    tr.appendChild(tdTercero);

    var tdTipo = document.createElement('td');
    var tipo = nombreDeTipo(a);
    if (tipo) tdTipo.innerHTML = '<span class="marca-tipo" title="' + U.escapar(tipo) + '">' +
      U.escapar(Nombres.tipoParaVer(tipo, App.E.tipos)) + '</span>';
    var numero = (a.ficha && a.ficha.numero) || (a.leido && a.leido.numero) || '';
    if (numero) tdTipo.innerHTML += '<span class="marca-numero" title="Número del asunto">' + U.escapar(numero) + '</span>';
    tr.appendChild(tdTipo);

    var tdDesde = document.createElement('td');
    tdDesde.textContent = U.fechaCorta(U.fechaLegible(a.ficha.porLiquidar.desde));
    tr.appendChild(tdDesde);

    if (conImporte) {
      var tdImporte = document.createElement('td');
      tdImporte.className = 'liq-importe';
      var i = importeDe(a);
      if (i && i.texto) {
        tdImporte.textContent = i.texto;
        if (i.sinImporte) tdImporte.classList.add('liq-importe-ambar');
      }
      tr.appendChild(tdImporte);
    }

    tr.onclick = function (ev) {
      if (ev.target.closest('input, button, a')) return;
      App.abrirFicha(a, 'abierto');
    };
    return tr;
  }

  function cabecera(conImporte) {
    return '<tr><th class="liq-casilla"><input type="checkbox" id="liq-todos" title="Marcar todos los que se ven"></th>' +
      '<th>Tercero</th><th>Tipo</th><th>Por liquidar desde</th>' + (conImporte ? '<th>Importe</th>' : '') + '</tr>';
  }

  /* Pinta la pestaña con `asuntos` (ya filtrados). Cambia la cabecera de
     la tabla y enseña la barra del total y del botón «Liquidar». */
  function pintarTabla(asuntos) {
    var caja = $('inicio-tabla-cuerpo');
    if (!caja) return;
    visibles = asuntos;
    Object.keys(marcados).forEach(function (n) {
      if (!asuntos.some(function (a) { return a.nombre === n; })) delete marcados[n];
    });
    var conImporte = asuntos.some(function (a) { return importeDe(a); });

    var normal = $('inicio-thead-normal'), liq = $('inicio-thead-liquidar');
    if (normal) normal.classList.add('oculto');
    if (liq) { liq.classList.remove('oculto'); liq.innerHTML = cabecera(conImporte); }
    var barra = $('inicio-liquidar-barra');
    if (barra) barra.classList.remove('oculto');
    var rotulo = $('cuenta-lista-abiertos');
    if (rotulo) rotulo.textContent = asuntos.length;

    caja.innerHTML = '';
    if (!asuntos.length) {
      caja.innerHTML = '<tr><td colspan="' + (conImporte ? 5 : 4) + '" class="vacio">Ningún asunto por liquidar por ahora.</td></tr>';
    } else {
      asuntos.forEach(function (a) { caja.appendChild(fila(a, conImporte)); });
    }
    var todos = $('liq-todos');
    if (todos) todos.onchange = function () {
      asuntos.forEach(function (a) { if (todos.checked) marcados[a.nombre] = true; else delete marcados[a.nombre]; });
      Array.prototype.forEach.call(caja.querySelectorAll('.liq-marca'), function (c) { c.checked = todos.checked; });
      pintarMarcados();
    };
    var boton = $('inicio-liquidar-boton');
    if (boton) boton.onclick = function () { if (window.PorLiquidarLiquidar) PorLiquidarLiquidar.abrir(marcadosVisibles()); };
    pintarMarcados();
  }

  /* Las demás pestañas devuelven la tabla y su cabecera de siempre. */
  function soltarTabla() {
    var normal = $('inicio-thead-normal'), liq = $('inicio-thead-liquidar');
    if (normal) normal.classList.remove('oculto');
    if (liq) liq.classList.add('oculto');
    var barra = $('inicio-liquidar-barra');
    if (barra) barra.classList.add('oculto');
  }

  function desmarcar(nombres) {
    nombres.forEach(function (n) { delete marcados[n]; });
  }

  return {
    exige: exige, hayTipos: hayTipos, estaPorLiquidar: estaPorLiquidar, tipoDe: tipoDe, lista: lista,
    revisar: revisar, alCambiarTipo: alCambiarTipo, alMarcarCasilla: alMarcarCasilla,
    pasar: pasar, quitar: quitar, destapar: destapar, archivarOPasar: archivarOPasar,
    textoDelBoton: textoDelBoton, alMarcarHecho: alMarcarHecho, alDesmarcar: alDesmarcar,
    importeDe: importeDe, campoImporte: campoImporte, sumar: sumar, euros: euros,
    pintarTabla: pintarTabla, soltarTabla: soltarTabla, desmarcar: desmarcar,
    /* para las pruebas */
    _textoDeMarcados: textoDeMarcados,
    _alEntrar: function () { yaMirado = false; alEntrar(); }
  };
})();
