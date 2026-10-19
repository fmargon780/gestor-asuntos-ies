/* ============================================================
   tablon-avisos.js — el aviso de una nota del tablón a su hora (fila
   372, docs/TABLON-AVISO-A-HORA-FIJA.md). Llegado el momento (hora de
   la cita menos la antelación) sale una ventana por encima de todo,
   con un sonido corto, con «Entendido» y «Recordar en 10 minutos».

   - Cuelga de <body>, no de #tablon ni de #pantalla-abiertos: no la
     destruyen los repintados de Inicio (docs/TABLON-NO-SE-BORRA.md).
   - Se comprueba cada 30 segundos, al arrancar (cuando el tablón
     lee las notas) y al volver a la pestaña: el navegador frena los
     temporizadores de las pestañas que no se ven.
   - «Entendido» es de cada persona: se guarda en la propia nota
     (`atendido`, con el momento al que respondía) y, siempre, en este
     ordenador. Sin nombre o en solo consulta, solo en este ordenador.
   - «Recordar» se guarda en este ordenador (localStorage).
   Se carga detrás de js/tablon-hora.js.
   ============================================================ */
(function () {

  var CADA = 30000;
  var RECORDAR_MIN = 10;
  var TOLERANCIA_MS = 2 * 60000;   /* pasados 2 min de la cita, el aviso dice «era a las…» */
  var LOCAL_ENTENDIDOS = 'gestor.tablon.entendidos';
  var LOCAL_RECORDAR = 'gestor.tablon.recordar';

  var reloj = null;            /* solo las pruebas lo cambian */
  var ventana = null;
  var tituloAntes = null;
  var comprobando = false;
  var contexto = null;         /* el audio, solo si ya se ha pulsado algo en la página */

  function ahora() { return reloj ? reloj() : new Date(); }

  /* ---------- lo guardado en este ordenador ---------- */

  function leerLocal(clave) {
    try { return JSON.parse(localStorage.getItem(clave)) || {}; } catch (e) { return {}; }
  }
  function escribirLocal(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  }

  /* El aviso de esta nota, a su hora actual, ya está atendido. */
  function atendida(n) {
    if (Tablon.atendidaPorMi(n)) return true;
    var k = Tablon.claveAviso(n);
    var local = leerLocal(LOCAL_ENTENDIDOS)[n.id];
    return !!local && local === k;
  }

  function aplazada(n) {
    var r = leerLocal(LOCAL_RECORDAR)[n.id];
    return !!r && r.m === Tablon.claveAviso(n) && r.hasta > ahora().getTime();
  }

  /* ---------- qué notas tocan ---------- */

  function tocan(lista) {
    var t = ahora().getTime();
    return lista.filter(function (n) {
      if (n.hecha || !n.hora || !Tablon.laVeo(n)) return false;
      if (Tablon.momentoAviso(n).getTime() > t) return false;
      return !atendida(n) && !aplazada(n);
    }).sort(function (a, b) { return Tablon.momentoAviso(a) - Tablon.momentoAviso(b); });
  }

  /* ---------- la comprobación ---------- */

  async function revisar() {
    if (ventana || comprobando) return;
    if (!window.Gestor || !Gestor.carpetaGestor()) return;
    /* En la copia de pruebas la ventana solo sale con `&avisos=1` (si no, taparía las demás pruebas y revisiones). */
    if (window.Demo && Demo.activo && Demo.activo() && !/[?&]avisos=1(&|$)/.test(location.search)) return;
    var primeras = tocan(Tablon.notas());
    if (!primeras.length) return;
    comprobando = true;
    try {
      /* Datos frescos: la nota puede haberse hecho, borrado, atendido o
         cambiado de hora desde la última lectura. */
      var frescas = primeras;
      try { frescas = tocan(await Tablon.leerFresco()); } catch (e) { /* si no se puede leer, vale lo que hay */ }
      if (ventana || !frescas.length) return;
      mostrar(frescas[0], frescas.length - 1);
    } finally {
      comprobando = false;
    }
  }

  /* ---------- la ventana ---------- */

  function mostrar(n, quedan) {
    var cuando = Tablon.cita(n);
    var tarde = ahora().getTime() - cuando.getTime() > TOLERANCIA_MS;

    var fondo = document.createElement('div');
    fondo.className = 'tablon-aviso-fondo';
    fondo.id = 'tablon-aviso';
    fondo.setAttribute('role', 'alertdialog');
    fondo.setAttribute('aria-modal', 'true');
    fondo.setAttribute('aria-labelledby', 'tablon-aviso-titulo');

    var caja = document.createElement('div');
    caja.className = 'tablon-aviso-caja color-' + n.color;

    var titulo = document.createElement('h2');
    titulo.id = 'tablon-aviso-titulo';
    titulo.textContent = 'Aviso del tablón';
    caja.appendChild(titulo);

    var texto = document.createElement('div');
    texto.className = 'tablon-aviso-texto';
    texto.textContent = n.texto;
    caja.appendChild(texto);

    var dia = document.createElement('div');
    dia.className = 'tablon-aviso-dia';
    dia.textContent = TablonHora.cuando(n);
    caja.appendChild(dia);
    if (tarde) {
      var era = document.createElement('div');
      era.className = 'tablon-aviso-era';
      era.textContent = 'era a las ' + TablonHora.corta(n.hora);
      caja.appendChild(era);
    }
    if (quedan > 0) {
      var mas = document.createElement('div');
      mas.className = 'tablon-aviso-mas';
      mas.textContent = quedan === 1 ? 'Hay otro aviso esperando.' : 'Hay ' + quedan + ' avisos más esperando.';
      caja.appendChild(mas);
    }

    var botones = document.createElement('div');
    botones.className = 'tablon-aviso-botones';
    var entendido = document.createElement('button');
    entendido.type = 'button';
    entendido.id = 'tablon-aviso-entendido';
    entendido.className = 'boton boton-principal';
    entendido.textContent = 'Entendido';
    entendido.onclick = function () { entender(n); };
    var recordar = document.createElement('button');
    recordar.type = 'button';
    recordar.id = 'tablon-aviso-recordar';
    recordar.className = 'boton';
    recordar.textContent = 'Recordar en ' + RECORDAR_MIN + ' minutos';
    recordar.onclick = function () { aplazar(n); };
    botones.appendChild(entendido);
    botones.appendChild(recordar);
    caja.appendChild(botones);

    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    ventana = fondo;

    if (tituloAntes === null) tituloAntes = document.title;
    if (document.title.indexOf('🔔 ') !== 0) document.title = '🔔 ' + document.title;
    sonar();
    entendido.focus();
  }

  function cerrar() {
    if (ventana && ventana.parentNode) ventana.parentNode.removeChild(ventana);
    ventana = null;
    if (document.title.indexOf('🔔 ') === 0) document.title = document.title.slice(3);
    tituloAntes = null;
  }

  async function entender(n) {
    var k = Tablon.claveAviso(n);
    var local = leerLocal(LOCAL_ENTENDIDOS);
    local[n.id] = k;
    escribirLocal(LOCAL_ENTENDIDOS, local);
    cerrar();
    var quien = Tablon.quienSoy();
    var consulta = window.SoloConsulta && SoloConsulta.activo();
    if (quien && !consulta) {
      await Tablon.cambiar(function (lista) {
        lista.forEach(function (x) {
          if (x.id !== n.id || Tablon.claveAviso(x) !== k) return;
          if (!Tablon.atendidaPorMi(x)) x.atendido.push({ q: quien, m: k });
        });
        return lista;
      });
    }
    revisar();   /* el siguiente, si hay varios */
  }

  function aplazar(n) {
    var r = leerLocal(LOCAL_RECORDAR);
    r[n.id] = { m: Tablon.claveAviso(n), hasta: ahora().getTime() + RECORDAR_MIN * 60000 };
    escribirLocal(LOCAL_RECORDAR, r);
    cerrar();
    revisar();   /* otro aviso distinto, si lo hay */
  }

  /* ---------- el sonido ---------- */

  /* El navegador solo deja sonar si ya se ha pulsado algo en la página:
     el audio se prepara en el primer gesto; antes de eso, la ventana
     sale sin sonido. */
  function prepararSonido() {
    if (contexto) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { contexto = new AC(); if (contexto.resume) contexto.resume(); }
    } catch (e) { contexto = null; }
  }
  ['pointerdown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, prepararSonido, { once: true, capture: true });
  });

  function sonar() {
    if (!contexto || contexto.state !== 'running') return;
    try {
      [0, 0.28].forEach(function (retraso, i) {
        var o = contexto.createOscillator(), g = contexto.createGain();
        var t0 = contexto.currentTime + retraso;
        o.type = 'sine';
        o.frequency.value = i ? 1046 : 784;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
        o.connect(g); g.connect(contexto.destination);
        o.start(t0); o.stop(t0 + 0.27);
      });
    } catch (e) { /* sin sonido, pero con ventana */ }
  }

  /* ---------- el temporizador ---------- */

  /* Otras partes de la página ponen el título (documentos pendientes): si
     lo pisan mientras hay un aviso sin atender, se vuelve a poner la campana. */
  setInterval(function () {
    if (ventana && document.title.indexOf('🔔 ') !== 0) document.title = '🔔 ' + document.title;
    revisar();
  }, CADA);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) revisar();
  });

  window.TablonAvisos = {
    revisar: revisar,
    ahora: ahora,
    abierto: function () { return !!ventana; },
    _interno: { ponerReloj: function (f) { reloj = f; }, tocan: tocan }
  };

})();
