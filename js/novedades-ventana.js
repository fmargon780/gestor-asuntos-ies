/* ============================================================
   novedades-ventana.js — la ventana «Qué hay de nuevo» (fila 248,
   docs/NOVEDADES-AL-RECARGAR.md). Lee `window.NOVEDADES`
   (js/novedades.js, lo más nuevo primero).

     - Al entrar (`alEntrar`, desde App.entrar en js/nucleo.js): sale
       si hay novedades que este ordenador no ha visto. Lo visto es el
       `id` más nuevo visto, en localStorage (clave `gestor.novedadesVistas`),
       siempre con try/catch. Primera vez en un ordenador: solo las de
       los últimos 7 días. Sin nada nuevo, no sale.
     - `ver()`: la misma ventana con las 10 últimas, vistas o no; la usa
       el número de versión de la barra lateral, que se vuelve pulsable.
     - Más de 10 líneas: salen 10 y debajo «y N más», que despliega el resto.
     - Un solo botón, «Entendido»; Escape también la cierra. Cerrada,
       todo cuenta como visto.
     - Un solo cuadro a la vez: si hay otro abierto, espera a que se cierre.
   ============================================================ */
window.NovedadesVentana = (function () {
  var CLAVE = 'gestor.novedadesVistas';
  var MAXIMO = 10;
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function lista() { return Array.isArray(window.NOVEDADES) ? window.NOVEDADES : []; }

  function leerVisto() {
    try { return localStorage.getItem(CLAVE) || ''; } catch (e) { return ''; }
  }
  function guardarVisto(id) {
    try { if (id) localStorage.setItem(CLAVE, id); } catch (e) { /* sin almacenamiento: saldrá otra vez */ }
  }

  /* PURA. «1 oct» desde AAAA-MM-DD. */
  function fechaCorta(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? (parseInt(m[3], 10) + ' ' + MESES[parseInt(m[2], 10) - 1]) : '';
  }

  /* PURA. Las novedades que no ha visto quien tiene guardado `visto` (el
     id más nuevo que vio; '' = primera vez: las de los últimos 7 días
     contando desde `hoyIso`). */
  function sinVer(novedades, visto, hoyIso) {
    var lista = novedades || [];
    if (visto === 'todo') return [];   /* solo lo pone el entorno de pruebas */
    if (visto) {
      for (var i = 0; i < lista.length; i++) if (lista[i].id === visto) return lista.slice(0, i);
    }
    var limite = new Date(hoyIso + 'T12:00:00');
    limite.setDate(limite.getDate() - 7);
    var desde = limite.toISOString().slice(0, 10);
    return lista.filter(function (n) { return String(n.fecha) >= desde; });
  }

  function lineaHtml(n) {
    return '<li><span class="novedad-fecha">' + U.escapar(fechaCorta(n.fecha)) + '</span> ' + U.escapar(n.texto) + '</li>';
  }

  function cuerpoHtml(items) {
    var primeras = items.slice(0, MAXIMO), resto = items.slice(MAXIMO);
    return '<ul class="novedades-lista">' + primeras.map(lineaHtml).join('') + '</ul>' +
      (resto.length
        ? '<ul class="novedades-lista oculto" id="novedades-resto">' + resto.map(lineaHtml).join('') + '</ul>' +
          '<p><button type="button" class="enlace" id="novedades-mas">y ' + resto.length + ' más</button></p>'
        : '');
  }

  function cuadroAbierto() { return !!document.querySelector('#capa:not(.oculto)'); }

  var mostrando = false;

  async function mostrar(items, marcarId) {
    if (!items.length || mostrando) return;
    mostrando = true;
    try {
      /* Un solo cuadro a la vez: espero a que se cierre el que haya. */
      for (var i = 0; i < 300 && cuadroAbierto(); i++) await new Promise(function (r) { setTimeout(r, 500); });
      var promesa = U.preguntar('Qué hay de nuevo', cuerpoHtml(items), 'Entendido', true);
      var mas = document.getElementById('novedades-mas');
      if (mas) mas.onclick = function () {
        document.getElementById('novedades-resto').classList.remove('oculto');
        mas.parentNode.classList.add('oculto');
      };
      function alTecla(ev) {
        if (ev.key === 'Escape') { var a = document.getElementById('cuadro-aceptar'); if (a) a.click(); }
      }
      document.addEventListener('keydown', alTecla, true);
      await promesa;
      document.removeEventListener('keydown', alTecla, true);
      guardarVisto(marcarId);
    } finally { mostrando = false; }
  }

  async function alEntrar() {
    try {
      var l = lista();
      if (!l.length) return;
      var nuevas = sinVer(l, leerVisto(), U.hoyIso());
      if (!nuevas.length) { guardarVisto(l[0].id); return; }
      await mostrar(nuevas, l[0].id);
    } catch (e) { /* solo un aviso: nunca rompe la entrada */ }
  }

  function ver() {
    var l = lista();
    return mostrar(l, l[0] && l[0].id);
  }

  /* El número de versión de la barra lateral, pulsable. */
  function hacerPulsable() {
    var pie = document.getElementById('usuario-pie');
    if (!pie || pie.querySelector('.version-pulsable') || !window.App || !App.textoVersion) return;
    var v = App.textoVersion();
    var texto = pie.textContent, i = texto.lastIndexOf(v);
    if (i < 0) return;
    pie.textContent = '';
    pie.appendChild(document.createTextNode(texto.slice(0, i)));
    var s = document.createElement('span');
    s.className = 'version-pulsable';
    s.textContent = v;
    s.title = 'Ver qué hay de nuevo';
    s.setAttribute('role', 'button');
    s.tabIndex = 0;
    s.onclick = function () { ver(); };
    s.onkeydown = function (ev) { if (ev.key === 'Enter') ver(); };
    pie.appendChild(s);
  }

  return { alEntrar: alEntrar, ver: ver, hacerPulsable: hacerPulsable, sinVer: sinVer, fechaCorta: fechaCorta, CLAVE: CLAVE };
})();
