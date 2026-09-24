/* ============================================================
   reservados.js — los asuntos reservados (fila 135, 25-sep-2026,
   docs/ASUNTOS-RESERVADOS.md).

   Un expediente disciplinario o uno con datos de salud no debe verse
   SIN QUERER en las listas, el buscador o Cuentas. Solo es eso: la
   carpeta sigue viéndose en Dropbox, y la aplicación no dice lo
   contrario.

   El dato:
   - En `tipos.json`, un tipo puede llevar `reservado: true`.
   - En la ficha de `asuntos.json`, `reservado: true`, `false` o nada.
     Sin nada, hereda del tipo; `false` saca un asunto concreto de un
     tipo reservado.
   - `Reservados.es(asunto)` es la ÚNICA que decide.

   Qué hace cada sitio (una llamada, sin envolver nada):
   - Tarjetas de Asuntos abiertos y del ARCHIVO: `enTarjeta(div, a)`
     (candado; y, tapada, sin el nombre del tercero).
   - «Qué me toca»: `nombreParaVer(a)` y `tapar(a)`.
   - Buscadores: `textoDeBusqueda(a)` en vez de las notas, documentos y
     ficha, si está tapado.
   - Ficha del asunto: `ponerCandado(h2, a)` y `opcionDelMenu(a)`.
   - Ficha de una persona: `candadoHtml(a)` (ahí se ve el nombre).
   - Pantalla de un tipo: `filaDeTipo(tipo)`.
   - Cuentas: `es(...)` para contarlos como «Reservado» en «quién lo
     pide».
   - «Mostrar reservados», arriba en Asuntos abiertos (`pintarBoton`):
     destapa solo en esta sesión y en este ordenador. No se recuerda.
   ============================================================ */
var Reservados = (function () {

  var CANDADO = '🔒';
  var mostrando = false;   /* a propósito, sin localStorage: al recargar se vuelve a tapar */

  function $(id) { return document.getElementById(id); }
  function tipos() { return (window.App && App.E && App.E.tipos) || []; }

  function tipoPorNombre(nombre) {
    if (!nombre) return null;
    var lista = tipos();
    return lista.filter(function (t) { return t.tipo === nombre; })[0] ||
      lista.filter(function (t) { return (t.alias || []).indexOf(nombre) !== -1; })[0] || null;
  }

  function tipoReservado(nombreTipo) {
    var t = tipoPorNombre(nombreTipo);
    return !!(t && t.reservado === true);
  }

  function tipoDeAsunto(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || a.tipo || '';
  }

  /* La única que decide. Vale para un asunto de la lista ({ nombre,
     leido, ficha }), uno del ARCHIVO (su ficha trae `reservado` del
     índice) o una entrada de Cuentas ({ tipo, reservado }). */
  function es(a) {
    if (!a) return false;
    var f = a.ficha || {};
    var propio = f.reservado !== undefined ? f.reservado : a.reservado;
    if (propio === true) return true;
    if (propio === false) return false;
    return tipoReservado(tipoDeAsunto(a));
  }

  function tapar(a) { return !mostrando && es(a); }
  function estaMostrando() { return mostrando; }

  /* Lo que un asunto tapado deja buscar: su nombre de carpeta (y los
     nombres de su tipo), nada de notas, documentos ni ficha. */
  function textoDeBusqueda(a) {
    var tipo = tipoDeAsunto(a);
    var nombresTipo = (tipo && window.Nombres) ? Nombres.nombresDeTipo(tipo, tipos()) : [];
    return U.normalizar(a.nombre + ' ' + nombresTipo.join(' '));
  }

  /* El nombre sin el tercero: fecha, tipo, curso y grupo. */
  function nombreTapado(a) {
    var l = a.leido || (window.Nombres ? Nombres.leer(a.nombre, tipos()) : {});
    var cg = (window.Nombres && Nombres.cursoYGrupoDeResto) ? Nombres.cursoYGrupoDeResto(l.resto || '') : {};
    var tipo = l.tipo ? (window.Nombres ? Nombres.tipoParaVer(l.tipo, tipos()) : l.tipo) : '';
    var partes = [l.fecha || '', tipo, cg.curso || '', cg.grupo || ''].filter(Boolean);
    return (partes.length ? partes.join(' ') + ' · ' : '') + 'reservado';
  }

  function nombreParaVer(a) { return tapar(a) ? nombreTapado(a) : a.nombre; }

  function candadoHtml(a) {
    return es(a) ? '<span class="marca-reservado" title="Asunto reservado">' + CANDADO + '</span>' : '';
  }

  function candado() {
    var s = document.createElement('span');
    s.className = 'marca-reservado';
    s.title = 'Asunto reservado';
    s.textContent = CANDADO;
    return s;
  }

  /* ---------- la tarjeta (Asuntos abiertos y ARCHIVO) ----------

     Se llama con la tarjeta ya hecha (y ya pasada por todos sus
     envoltorios), justo antes de colgarla. */
  function enTarjeta(div, a) {
    if (!div || !es(a)) return div;
    div.classList.add('tarjeta-reservada');
    var nombre = div.querySelector('.tarjeta-nombre');
    if (nombre && !nombre.querySelector('.marca-reservado')) nombre.insertBefore(candado(), nombre.firstChild);
    if (!tapar(a)) return div;
    div.classList.add('tarjeta-tapada');
    if (nombre) {
      /* El nombre de la carpeta es el último texto suelto del rótulo. */
      var textos = Array.prototype.filter.call(nombre.childNodes, function (n) { return n.nodeType === 3; });
      var ultimo = textos[textos.length - 1];
      if (ultimo) ultimo.textContent = nombreTapado(a);
      else nombre.appendChild(document.createTextNode(nombreTapado(a)));
    }
    var pie = div.querySelector('.tarjeta-pie');
    if (pie) {
      var fecha = a.leido && a.leido.fecha;
      pie.textContent = 'Reservado' + (fecha ? '  ·  Abierto el ' + U.fechaLegible(fecha) : '') +
        '  ·  Pulsa el nombre para verlo';
    }
    Array.prototype.forEach.call(div.querySelectorAll('.tarjeta-nota-encontrada, .boton-nie'), function (x) { x.remove(); });
    return div;
  }

  /* ---------- «Mostrar reservados», arriba en Asuntos abiertos ---------- */

  function hayReservados() {
    if (tipos().some(function (t) { return t.reservado === true; })) return true;
    var abiertos = (window.App && App.E && App.E.listaAbiertos) || [];
    return abiertos.some(es);
  }

  function pintarBoton() {
    var filtros = $('btn-filtros');
    if (!filtros) return;
    var b = $('btn-mostrar-reservados');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.id = 'btn-mostrar-reservados';
      b.className = 'boton boton-reservados';
      b.onclick = function () {
        mostrando = !mostrando;
        pintarBoton();
        if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
        if (typeof App.pintarArchivo === 'function' && App.E.listaArchivo && App.E.listaArchivo.length) App.pintarArchivo();
      };
      filtros.parentNode.insertBefore(b, filtros);
    }
    b.classList.toggle('oculto', !hayReservados());
    b.textContent = mostrando ? CANDADO + ' Tapar reservados' : CANDADO + ' Mostrar reservados';
    b.title = mostrando
      ? 'Volver a tapar el nombre de los asuntos reservados'
      : 'Ver el nombre de los asuntos reservados, solo ahora y en este ordenador';
    b.setAttribute('aria-pressed', mostrando ? 'true' : 'false');
  }

  /* ---------- la ficha del asunto ---------- */

  function ponerCandado(h2, a) {
    if (!h2) return;
    var hay = h2.querySelector('.marca-reservado');
    if (!es(a)) { if (hay) hay.remove(); return; }
    if (!hay) h2.insertBefore(candado(), h2.firstChild);
  }

  async function cambiar(a, reservar) {
    var deTipo = tipoReservado(tipoDeAsunto(a));
    try {
      await App.guardarRegistroFresco(function (registro) {
        var f = registro.asuntos[a.nombre] || (registro.asuntos[a.nombre] = {});
        if (reservar) f.reservado = true;
        else if (deTipo) f.reservado = false;   /* su tipo es reservado: este no */
        else delete f.reservado;
      });
    } catch (e) {
      U.fallo('No he podido cambiar la reserva', e);
      return;
    }
    a.ficha = (App.E.registro.asuntos || {})[a.nombre] || a.ficha;
    U.aviso(reservar ? 'Asunto reservado: su nombre no se verá sin querer en las listas.'
                     : 'Ya no es reservado.', 'bueno');
    App.abrirFicha(a, 'abierto');
  }

  function opcionDelMenu(a) {
    var ya = es(a);
    return {
      texto: ya ? 'Quitar la reserva' : 'Marcar como reservado',
      alPulsar: function () { cambiar(a, !ya); }
    };
  }

  /* ---------- la pantalla de un tipo ---------- */

  function filaDeTipo(tipo) {
    var fila = document.createElement('div');
    fila.className = 'tipo-reservado-fila';
    fila.innerHTML =
      '<label class="tipo-reservado-casilla"><input type="checkbox" class="tipo-reservado"> ' +
      'Reservado (expedientes disciplinarios, salud, protección…)</label>' +
      '<p class="nota">Solo evita que se vea sin querer en la aplicación. La carpeta sigue visible en Dropbox.</p>';
    var casilla = fila.querySelector('.tipo-reservado');
    casilla.checked = tipo.reservado === true;
    casilla.onchange = async function () {
      var marcar = casilla.checked;
      var t = tipoPorNombre(tipo.tipo) || tipo;
      [t, tipo].forEach(function (x) { if (marcar) x.reservado = true; else delete x.reservado; });
      casilla.disabled = true;
      try {
        await App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); });
        U.aviso(tipo.tipo + (marcar ? ': reservado.' : ': ya no es reservado.'), 'bueno');
      } catch (e) {
        [t, tipo].forEach(function (x) { if (marcar) delete x.reservado; else x.reservado = true; });
        casilla.checked = !marcar;
        U.fallo('No he podido guardarlo', e);
      }
      casilla.disabled = false;
    };
    return fila;
  }

  return {
    CANDADO: CANDADO,
    es: es, tapar: tapar, estaMostrando: estaMostrando, tipoReservado: tipoReservado,
    textoDeBusqueda: textoDeBusqueda, nombreTapado: nombreTapado, nombreParaVer: nombreParaVer,
    candadoHtml: candadoHtml, enTarjeta: enTarjeta, pintarBoton: pintarBoton,
    ponerCandado: ponerCandado, opcionDelMenu: opcionDelMenu, cambiar: cambiar, filaDeTipo: filaDeTipo
  };
})();
window.Reservados = Reservados;
