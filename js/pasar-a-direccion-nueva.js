/* ============================================================
   pasar-a-direccion-nueva.js — pasar de la dirección de siempre a la nueva
   (fila 731, docs/718-ABRIR-LA-APP-DESDE-GITHUB.md, parte 2).

   Un navegador no deja pasar el permiso de una carpeta de una dirección a otra:
   en la dirección nueva hay que señalar las carpetas de nuevo, en cada ordenador.
   Esta pieza hace dos cosas, cada una en su dirección:

   1. En `asuntos.fmargon.com` y `gestor-de-asuntos.vercel.app`: el botón
      «Pasar a la dirección nueva» (pantalla de entrada). Abre la dirección nueva
      con `#pasar=<datos>`: el identificador de este ordenador (`gestor-ordenador`)
      y el NOMBRE de cada carpeta recordada. Nunca una ruta de disco, un permiso ni una clave.
   2. En `gestor-asuntos-ies.github.io`: lee `#pasar=` (y lo quita de la barra), guarda
      el identificador si este ordenador aún no tiene uno, y enseña «Carpetas por señalar»:
      una casilla por carpeta, que se marca al señalarla con ese mismo nombre. Hasta que las
      dos primeras (asuntos abiertos y ARCHIVO) estén señaladas no se puede entrar, así que
      no se guarda nada en ellas antes de tiempo.
   ============================================================ */
(function () {
  'use strict';

  var NUEVA = 'gestor-asuntos-ies.github.io';
  var VIEJAS = ['asuntos.fmargon.com', 'gestor-de-asuntos.vercel.app'];
  var CLAVE_PENDIENTES = 'gestor-pasar';

  /* La clave con la que cada carpeta se recuerda en Almacen, cómo se llama en pantalla y si impide entrar. */
  var CARPETAS = [
    { clave: 'abiertos', rotulo: 'Carpeta de asuntos abiertos', primera: true },
    { clave: 'archivo', rotulo: 'Carpeta ARCHIVO', primera: true },
    { clave: 'entrada', rotulo: 'Carpeta de entrada de los documentos sueltos' },
    { clave: 'bandeja', rotulo: 'Carpeta de la bandeja de correos' },
    { clave: 'alumnado-bd-carpeta', rotulo: 'Carpeta del alumnado' },
    { clave: 'centro-de-datos-carpeta', rotulo: 'Carpeta del Centro de datos' },
    { clave: 'copiaCarpeta', rotulo: 'Carpeta de la copia sin internet' }
  ];

  function $(id) { return document.getElementById(id); }
  function datosDe(clave) { return CARPETAS.filter(function (c) { return c.clave === clave; })[0] || null; }
  function guardado(clave) { try { return window.localStorage.getItem(clave); } catch (e) { return null; } }
  function guardar(clave, valor) {
    try { if (valor === null) window.localStorage.removeItem(clave); else window.localStorage.setItem(clave, valor); } catch (e) { /* sin memoria del navegador */ }
  }

  /* ---------- 1. el botón, en la dirección de siempre ---------- */

  async function nombresRecordados() {
    var lista = [];
    for (var i = 0; i < CARPETAS.length; i++) {
      try {
        var h = await Almacen.leer(CARPETAS[i].clave);
        if (h && typeof h.name === 'string' && h.name) lista.push([CARPETAS[i].clave, h.name.slice(0, 120)]);
      } catch (e) { /* esa carpeta no se recuerda */ }
    }
    return lista;
  }

  async function enlaceNuevo() {
    var datos = { o: U.ordenador(), c: await nombresRecordados() };
    return 'https://' + NUEVA + '/#pasar=' + encodeURIComponent(JSON.stringify(datos));
  }

  /* En la misma pestaña: `window.open` con `noopener` devuelve siempre null y abriría dos. */
  async function pasar() {
    window.location.href = await enlaceNuevo();
  }

  function ponerBoton() {
    var entrar = $('btn-entrar');
    if (!entrar || $('btn-pasar-direccion')) return;
    var caja = document.createElement('div');
    caja.id = 'pasar-direccion';
    caja.className = 'pasar-direccion';
    caja.innerHTML = '<button id="btn-pasar-direccion" class="boton boton-ancho" type="button">Pasar a la dirección nueva</button>' +
      '<p class="nota">La dirección nueva abre también en el instituto. Te dirá qué carpetas hay que señalar de nuevo en ' +
      'este ordenador; no se pierde nada.</p>';
    entrar.parentNode.insertBefore(caja, entrar.nextSibling);
    $('btn-pasar-direccion').onclick = pasar;
  }

  /* ---------- 2. la lista, en la dirección nueva ---------- */

  /* Lee `#pasar=`, lo quita de la barra y apunta lo que falta señalar. Solo acepta lo que reconoce. */
  function leerEnlace() {
    var m = /^#pasar=(.*)$/.exec(window.location.hash || '');
    if (!m) return;
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* se queda */ }
    var datos;
    try { datos = JSON.parse(decodeURIComponent(m[1])); } catch (e) { return; }
    if (!datos || typeof datos !== 'object') return;
    if (/^[a-z0-9]{6}$/.test(datos.o || '') && !/^[a-z0-9]{6}$/.test(guardado('gestor-ordenador') || '')) guardar('gestor-ordenador', datos.o);
    var pendientes = [];
    (Array.isArray(datos.c) ? datos.c : []).slice(0, 12).forEach(function (p) {
      if (Array.isArray(p) && datosDe(p[0]) && typeof p[1] === 'string' && p[1] && p[1].length <= 120 &&
          !pendientes.some(function (x) { return x[0] === p[0]; })) pendientes.push([p[0], p[1]]);
    });
    guardar(CLAVE_PENDIENTES, pendientes.length ? JSON.stringify({ c: pendientes }) : null);
  }

  function pendientesGuardadas() {
    try {
      var t = JSON.parse(guardado(CLAVE_PENDIENTES) || 'null');
      return (t && Array.isArray(t.c)) ? t.c : [];
    } catch (e) { return []; }
  }

  /* Para cada carpeta de la lista: 'hecha', 'otra' (señalada con otro nombre; trae el nombre) o 'falta'. */
  async function estados() {
    var salida = [];
    var lista = pendientesGuardadas();
    for (var i = 0; i < lista.length; i++) {
      var h = null;
      try { h = await Almacen.leer(lista[i][0]); } catch (e) { h = null; }
      if (!h && window.App && App.E && App.E[lista[i][0]]) h = App.E[lista[i][0]];
      var est = !h ? { quedaPor: 'falta' } : (h.name === lista[i][1] ? { quedaPor: 'hecha' } : { quedaPor: 'otra', tiene: h.name });
      est.clave = lista[i][0]; est.nombre = lista[i][1];
      salida.push(est);
    }
    return salida;
  }

  var ultimo = [];
  function faltaAlgunaPrimera() {
    return ultimo.some(function (e) { return e.quedaPor !== 'hecha' && datosDe(e.clave).primera; });
  }

  function texto(s) { var d = document.createElement('span'); d.textContent = s; return d.innerHTML; }

  function pintar() {
    var caja = $('pasar-lista');
    if (!ultimo.length) { if (caja) caja.remove(); return; }
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'pasar-lista';
      caja.className = 'aviso aviso-ambar';
      var paso = $('paso-carpetas');
      if (!paso) return;
      paso.insertBefore(caja, paso.firstChild);
    }
    var filas = ultimo.map(function (e) {
      var d = datosDe(e.clave);
      var marca = e.quedaPor === 'hecha' ? '☑' : '☐';
      var frase = e.quedaPor === 'hecha' ? 'Señalada.' :
        (e.quedaPor === 'otra' ? 'Has señalado «' + e.tiene + '»: esta carpeta se llama «' + e.nombre + '».' :
          (d.primera ? 'Se llama «' + e.nombre + '».' : 'Se llama «' + e.nombre + '». Se señala ya dentro de la aplicación, donde la usas.'));
      return '<li data-carpeta="' + texto(e.clave) + '" data-estado="' + e.quedaPor + '"><span class="pasar-marca">' + marca + '</span> <strong>' +
        texto(d.rotulo) + '</strong> · ' + texto(frase) + '</li>';
    }).join('');
    caja.innerHTML = '<strong>Carpetas por señalar</strong>' +
      '<p>Esta dirección es nueva para el navegador: hay que señalar de nuevo cada carpeta, una por una y con su mismo nombre. ' +
      'Hasta señalar las dos primeras no se puede entrar.</p><ul class="pasar-carpetas" style="list-style:none;padding:0;margin:8px 0">' + filas + '</ul>' +
      '<button id="btn-pasar-quitar" class="boton" type="button">Quitar la lista</button>';
    $('btn-pasar-quitar').onclick = function () { guardar(CLAVE_PENDIENTES, null); ultimo = []; pintar(); if (window.App && App.revisarArranque) App.revisarArranque(); };
  }

  async function repasar() {
    if (!pendientesGuardadas().length) { if (ultimo.length) { ultimo = []; pintar(); } return; }
    ultimo = await estados();
    if (ultimo.length && ultimo.every(function (e) { return e.quedaPor === 'hecha'; })) guardar(CLAVE_PENDIENTES, null);
    pintar();
    if (window.App && App.revisarArranque) App.revisarArranque();
  }

  function ponerLista() {
    leerEnlace();
    if (!pendientesGuardadas().length) return;
    ultimo = pendientesGuardadas().map(function (p) { return { clave: p[0], nombre: p[1], quedaPor: 'falta' }; });
    /* Hasta señalar las dos primeras, «Entrar» no se abre. */
    var revisarDeSiempre = App.revisarArranque;
    App.revisarArranque = function () {
      revisarDeSiempre();
      if (faltaAlgunaPrimera()) $('btn-entrar').disabled = true;
    };
    ['btn-abiertos', 'btn-archivo'].forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener('click', function () { setTimeout(repasar, 600); });
    });
    repasar();
    var vuelta = setInterval(function () {
      if (!pendientesGuardadas().length) { clearInterval(vuelta); return; }
      repasar();
    }, 2000);
  }

  var h = window.location.hostname;
  function arrancar() {
    if (VIEJAS.indexOf(h) !== -1) ponerBoton();
    else if (h === NUEVA) ponerLista();
  }
  /* Los <script> van al final de la página: ya está todo pintado y se engancha antes de que js/inicio.js llame a App.arrancar(). */
  if ($('btn-entrar')) arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);

  window.PasarADireccionNueva = { enlaceNuevo: enlaceNuevo, repasar: repasar };
})();
