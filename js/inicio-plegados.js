/* ============================================================
   inicio-plegados.js — «Dormidos» y «Sin fecha», al final de Inicio
   (27-sep-2026, fila 192, docs/INICIO-CUATRO-BLOQUES.md, apartado 6).

   Los dos, plegados al entrar; se recuerda si se dejaron abiertos
   (AjustesPlegado.recordar, js/ajustes-plegado.js, sin tocarlo).

   Rescatado casi literal del `bloqueDormidos`/`bloqueSinFecha` que
   tenía "Qué me toca" antes de la fila 191 (`git show
   f3d60e0:js/que-me-toca.js`), con un arreglo: dentro de
   `bloqueDormidos`, el botón «Ocultar por 30 días» llamaba a un
   `pintar()` que ya no existe en js/que-me-toca.js (nadie lo llamaba,
   por eso no había reventado). Aquí se repinta solo este bloque, con
   `QueMeToca.reunirDormidos()` recalculado, sin pasar por el
   repintado entero de Inicio.

   Todo el cálculo (QueMeToca.reunirDormidos, QueMeToca.clasificar(...)
   .sinFecha, QueMeToca.terceroDe, QueMeToca.abrirMesaDelHito) ya está
   expuesto por js/que-me-toca.js: cero cambios en ese fichero.

   window.InicioPlegados.pintar(sinFecha, dormidos) lo llama
   js/inicio.js, dentro de su repintado entero (repintarTodo), con lo
   que ya tiene calculado (g.sinFecha, QueMeToca.reunirDormidos()). Se
   carga justo después de js/inicio.js.
   ============================================================ */
(function () {

  var detDormidos = null;
  var detSinFecha = null;

  function terceroDe(a) {
    return window.QueMeToca ? QueMeToca.terceroDe(a) : '';
  }

  /* La primera vez que hace falta, los dos <details> vacíos, colgados
     de #inicio-plegados y ya enganchados a la memoria de lo abierto.
     Las veces siguientes solo se rellena su cuerpo (recordar() no
     vuelve a tocar `.open` si ya está enganchado). */
  function asegurarEstructura() {
    var caja = document.getElementById('inicio-plegados');
    if (!caja || detDormidos) return caja;
    caja.innerHTML =
      '<details class="qmt-bloque qmt-sinfecha qmt-bloque-dormidos" id="inicio-dormidos">' +
        '<summary></summary><div class="qmt-lista"></div>' +
      '</details>' +
      '<details class="qmt-bloque qmt-sinfecha" id="inicio-sinfecha">' +
        '<summary></summary><div class="qmt-lista"></div>' +
      '</details>';
    detDormidos = document.getElementById('inicio-dormidos');
    detSinFecha = document.getElementById('inicio-sinfecha');
    if (window.AjustesPlegado) {
      AjustesPlegado.recordar(detDormidos, 'inicio:dormidos');
      AjustesPlegado.recordar(detSinFecha, 'inicio:sinfecha');
    }
    return caja;
  }

  /* ---------- Dormidos ---------- */

  function filaDormido(it) {
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
        /* Repintado propio del módulo (no el de js/inicio.js entero):
           solo hace falta recalcular los dormidos. */
        pintarDormidos(QueMeToca.reunirDormidos());
      } catch (e) {
        U.aviso('No he podido ocultarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
    fila.appendChild(ocultar);

    return fila;
  }

  function pintarDormidos(lista) {
    if (!detDormidos) return;
    detDormidos.querySelector('summary').textContent =
      'Dormidos (' + lista.length + ') · sin novedades desde hace más de ' + App.diasDormido() + ' días';
    var caja = detDormidos.querySelector('.qmt-lista');
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Ningún asunto dormido por ahora.</div>';
      return;
    }
    lista.forEach(function (it) { caja.appendChild(filaDormido(it)); });
  }

  /* ---------- Sin fecha ---------- */

  function filaSinFecha(it) {
    var h = it.hito, a = it.asunto;
    var tapado = window.Reservados && Reservados.tapar(a);
    var tercero = tapado ? '' : terceroDe(a);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'qmt-fila';
    b.dataset.asunto = a.nombre;
    b.dataset.hito = h.id;
    b.innerHTML =
      '<span class="qmt-fila-titulo">' + U.escapar(h.titulo || '(sin título)') + '</span>' +
      '<span class="qmt-fila-asunto">' + (window.Reservados ? Reservados.candadoHtml(a) : '') +
        U.escapar(window.Reservados ? Reservados.nombreParaVer(a) : a.nombre) + '</span>' +
      (tercero ? '<span class="qmt-fila-tercero">' + U.escapar(tercero) + '</span>' : '');
    b.onclick = function () { QueMeToca.abrirMesaDelHito(a, h); };
    return b;
  }

  function pintarSinFecha(lista) {
    if (!detSinFecha) return;
    detSinFecha.querySelector('summary').textContent =
      'Sin fecha (' + lista.length + ') · hitos pendientes sin plazo';
    var caja = detSinFecha.querySelector('.qmt-lista');
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Ningún hito pendiente sin fecha.</div>';
      return;
    }
    lista.forEach(function (it) { caja.appendChild(filaSinFecha(it)); });
  }

  /* ---------- lo que llama js/inicio.js ---------- */

  function pintar(sinFecha, dormidos) {
    if (!asegurarEstructura()) return;
    pintarSinFecha(sinFecha || []);
    pintarDormidos(dormidos || []);
  }

  window.InicioPlegados = { pintar: pintar };

})();
