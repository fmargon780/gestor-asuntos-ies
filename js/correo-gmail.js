/* ============================================================
   correo-gmail.js — lo que la app le pide a Gmail después de tocar un
   correo (fila 480, docs/CORREO-SE-QUEDA-EN-RECIBIDOS.md).

   El script de Gmail ya no archiva lo que recoge: el correo se queda en
   recibidos, sin leer. Aquí se manda al script (doPost, `accion: 'gmail'`,
   la misma dirección y clave que el envío) lo que la app ha hecho:

     leído      al meterlo en un asunto y al descartarlo;
     archivar   al descartarlo y al archivar su asunto;
     recibidos  al reabrir su asunto (lo leído no se toca).

   Por hilo hay dos cosas independientes: `leido: true` (una vez puesto no
   se quita) y `bandeja: 'archivar' | 'recibidos'` (gana la última).

   Nunca frena nada: si el script no contesta (sin red, script viejo), la
   orden se guarda en `_GESTOR/gmail-pendiente/<ordenador>.json` (uno por
   ordenador, para que dos no se pisen) y se reintenta al abrir la app y cada
   pocos minutos, solo desde ese ordenador. Más de un día sin salir:
   tarjeta en Ajustes → Problemas.

   Puesta al día única: la primera vez que el script nuevo contesta, un solo
   ordenador (marca `_GESTOR/gmail-puesta-al-dia.json`, con cerrojo) le manda
   los hilos de los asuntos abiertos y de las fichas de la bandeja sin
   decidir; el script devuelve a recibidos los que aún llevan GESTOR/Hecho.
   ============================================================ */
window.CorreoGmail = (function () {

  var CARPETA = 'gmail-pendiente';
  var FICHERO_AL_DIA = 'gmail-puesta-al-dia.json';
  var FILA_MINIMA = 480;
  var TANDA = 25;
  var CADA_MS = 5 * 60 * 1000;
  var UN_DIA_MS = 24 * 60 * 60 * 1000;
  var MEDIA_HORA_MS = 30 * 60 * 1000;
  var ESPERA_CERROJO_MS = 1500;
  var LIMITE_MS = 60 * 1000;

  var estado = null;          /* { ordenes: { <id>: { id, matriculas, leido, bandeja, desde, n } } } */
  var cola = Promise.resolve();
  var alDiaEnMarcha = false;
  var arrancado = false;

  function enDemo() { return !!(window.Demo && Demo.activo && Demo.activo()); }
  function ahoraIso() { return new Date().toISOString(); }
  function enSerie(f) {
    var r = cola.then(f, f);
    cola = r.then(function () {}, function () {});
    return r;
  }

  /* ---------- puras ---------- */

  /* [{ id, matriculas }] de la lista `hilos` de una ficha o de un correo de la bandeja. */
  function hilosDeFicha(ficha) {
    var lista = ficha && Array.isArray(ficha.hilos) ? ficha.hilos : [];
    return lista.filter(function (h) { return h && h.id; })
      .map(function (h) { return { id: h.id, matriculas: (h.matriculas || []).filter(Boolean) }; });
  }

  function hiloDeCorreo(d) {
    return d && d.id ? [{ id: d.id, matriculas: Array.isArray(d.matriculas) ? d.matriculas.filter(Boolean) : [] }] : [];
  }

  /* Suma `cambio` ({ leido?, bandeja? }) a las órdenes de esos hilos; devuelve las órdenes nuevas. */
  function aplicar(ordenes, hilos, cambio, cuando) {
    var salida = Object.assign({}, ordenes);
    hilos.forEach(function (h) {
      if (!h || !h.id) return;
      var o = Object.assign({ id: h.id, matriculas: [], desde: cuando, n: 0 }, salida[h.id]);
      var ms = (o.matriculas || []).slice();
      (h.matriculas || []).forEach(function (m) { if (m && ms.indexOf(m) < 0) ms.push(m); });
      o.matriculas = ms;
      if (cambio && cambio.leido) o.leido = true;
      if (cambio && cambio.bandeja) o.bandeja = cambio.bandeja;
      o.n = (o.n || 0) + 1;
      salida[h.id] = o;
    });
    return salida;
  }

  /* Las órdenes que llevan más de un día sin salir. */
  function atascadas(ordenes, ahora) {
    return Object.keys(ordenes || {}).filter(function (id) {
      var t = Date.parse(ordenes[id].desde || '');
      return t && ahora - t > UN_DIA_MS;
    });
  }

  function numeroDeFila(v) {
    var m = String(v || '').match(/fila\s+(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ---------- el fichero de pendientes ---------- */

  function nombreFichero() { return ((window.U && U.ordenador && U.ordenador()) || 'sin-ordenador') + '.json'; }

  async function carpetaPendientes(crear) {
    if (!window.App || !App.E || !App.E.gestor || !window.Carpetas) return null;
    try { return await Carpetas.bajar(App.E.gestor, [CARPETA], !!crear); } catch (e) { return null; }
  }

  async function cargar() {
    if (estado) return estado;
    estado = { ordenes: {} };
    var dir = await carpetaPendientes(false);
    if (!dir) return estado;
    try {
      var leido = await Carpetas.leerJson(dir, nombreFichero());
      if (leido && leido.ordenes && typeof leido.ordenes === 'object') estado = { ordenes: leido.ordenes };
    } catch (e) { /* roto o ilegible: se parte de cero, lo pendiente se rehace con lo próximo */ }
    return estado;
  }

  async function guardar() {
    var dir = await carpetaPendientes(true);
    if (!dir) return;
    try { await Carpetas.escribirTexto(dir, nombreFichero(), JSON.stringify({ ordenes: estado.ordenes }, null, 2)); }
    catch (e) { /* sin disco: sigue en memoria, se reintenta con la próxima orden */ }
  }

  function repintarProblema() { if (window.Problemas && Problemas.recalcular) Problemas.recalcular('gmail-pendiente'); }

  /* ---------- hablar con el script ---------- */

  function hayConexion() {
    return !enDemo() && !!window.CorreoEnviar && CorreoEnviar.tieneConexion();
  }

  /* ¿Se sabe que el script es anterior a esta fila? Sin versión conocida se intenta igual: un script
     viejo contesta «No hay ningún destinatario» y no envía nada. */
  function scriptViejo() {
    var v = window.CorreoEnviar && CorreoEnviar.versionConocida && CorreoEnviar.versionConocida();
    if (v === null || v === undefined) return false;
    var f = numeroDeFila(v);
    return f === null || f < FILA_MINIMA;
  }

  function scriptAlDia() {
    var v = window.CorreoEnviar && CorreoEnviar.versionConocida && CorreoEnviar.versionConocida();
    var f = numeroDeFila(v);
    return f !== null && f >= FILA_MINIMA;
  }

  async function llamar(cuerpo) {
    cuerpo.accion = 'gmail';
    var r = await CorreoEnviar.enviar(cuerpo, LIMITE_MS);
    return r && r.ok && r.resultados ? r : null;
  }

  /* Manda lo pendiente, de tanda en tanda, y quita lo que el script ha hecho. */
  function vaciar() {
    return enSerie(async function () {
      try {
        await cargar();
        if (!hayConexion()) return { ok: false, motivo: 'sin-conexion' };
        for (var vuelta = 0; vuelta < 8; vuelta++) {
          var ids = Object.keys(estado.ordenes);
          if (!ids.length) break;
          if (scriptViejo()) return { ok: false, motivo: 'script-viejo' };
          ids.sort(function (a, b) { return String(estado.ordenes[a].desde).localeCompare(String(estado.ordenes[b].desde)); });
          var lote = ids.slice(0, TANDA).map(function (id) { return estado.ordenes[id]; });
          var r = await llamar({ ordenes: lote.map(function (o) {
            return { id: o.id, matriculas: o.matriculas, leido: !!o.leido, bandeja: o.bandeja };
          }) });
          if (!r) return { ok: false, motivo: 'sin-respuesta' };
          var salidos = 0;
          lote.forEach(function (o) {
            var dicho = r.resultados[o.id];
            var actual = estado.ordenes[o.id];
            /* `noEsta` no tiene arreglo: se da por hecho. Si la orden cambió mientras iba, queda la nueva. */
            if ((dicho === 'hecho' || dicho === 'noEsta') && actual && actual.n === o.n) { delete estado.ordenes[o.id]; salidos++; }
          });
          await guardar();
          if (!salidos) break;
        }
        return { ok: true, quedan: Object.keys(estado.ordenes).length };
      } catch (e) {
        return { ok: false, motivo: 'error' };
      } finally {
        repintarProblema();
      }
    });
  }

  /* Apunta lo que hay que hacer en Gmail con esos hilos y lo manda sin esperar. Nunca falla. */
  function ordenar(hilos, cambio) {
    if (enDemo() || !hilos || !hilos.length) return Promise.resolve();
    return enSerie(async function () {
      try {
        await cargar();
        estado.ordenes = aplicar(estado.ordenes, hilos, cambio, ahoraIso());
        await guardar();
      } catch (e) { /* lo de Gmail nunca frena a la app */ }
    }).then(function () { vaciar(); }, function () {});
  }

  /* Atajos para los sitios donde la app toca un correo. */
  function metidoEnUnAsunto(d) { return ordenar(hiloDeCorreo(d), { leido: true }); }
  function descartado(d) { return ordenar(hiloDeCorreo(d), { leido: true, bandeja: 'archivar' }); }
  function asuntoArchivado(hilos) { return ordenar(hilos, { bandeja: 'archivar' }); }
  function asuntoReabierto(hilos) { return ordenar(hilos, { bandeja: 'recibidos' }); }

  /* ---------- la puesta al día única ---------- */

  function hilosParaPonerAlDia() {
    var vistos = {}, lista = [];
    function meter(h) { if (h && h.id && !vistos[h.id]) { vistos[h.id] = true; lista.push(h); } }
    var asuntos = (App.E.registro && App.E.registro.asuntos) || {};
    Object.keys(asuntos).forEach(function (n) {
      if (asuntos[n] && asuntos[n].estado !== 'cerrado') hilosDeFicha(asuntos[n]).forEach(meter);
    });
    var correos = (window.BandejaNucleo && BandejaNucleo.correos && BandejaNucleo.correos()) || [];
    correos.forEach(function (c) { hiloDeCorreo(c && c.datos).forEach(meter); });
    return lista;
  }

  async function leerMarca() {
    try { return await Carpetas.leerJson(App.E.gestor, FICHERO_AL_DIA); } catch (e) { return null; }
  }

  async function escribirMarca(datos) {
    await Carpetas.escribirTexto(App.E.gestor, FICHERO_AL_DIA, JSON.stringify(datos));
  }

  function pausa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function ponerAlDia() {
    if (alDiaEnMarcha || enDemo() || !hayConexion() || !scriptAlDia()) return { ok: false, motivo: 'no-toca' };
    if (!window.App || !App.E || !App.E.gestor || !window.Carpetas) return { ok: false, motivo: 'sin-carpeta' };
    if (window.SoloConsulta && SoloConsulta.activo()) return { ok: false, motivo: 'solo-consulta' };
    alDiaEnMarcha = true;
    var yo = (window.U && U.ordenador && U.ordenador()) || 'sin-ordenador';
    try {
      var marca = await leerMarca();
      if (marca && marca.estado === 'hecha') return { ok: true, yaHecha: true };
      if (marca && marca.estado === 'en-marcha' && marca.ordenador !== yo && Date.now() - Date.parse(marca.cuando) < MEDIA_HORA_MS) {
        return { ok: false, motivo: 'otro-ordenador' };
      }
      await escribirMarca({ estado: 'en-marcha', ordenador: yo, cuando: ahoraIso() });
      await pausa(ESPERA_CERROJO_MS);
      var despues = await leerMarca();
      if (!despues || despues.ordenador !== yo) return { ok: false, motivo: 'otro-ordenador' };

      if (App.cargarRegistro) await App.cargarRegistro();
      var hilos = hilosParaPonerAlDia();
      var hecho = true;
      for (var i = 0; i < Math.max(1, hilos.length); i += TANDA) {
        var ultima = i + TANDA >= hilos.length;
        var r = await llamar({ ponerAlDia: hilos.slice(i, i + TANDA), ultima: ultima });
        if (!r) { hecho = false; break; }
      }
      if (!hecho) {
        try { await App.E.gestor.removeEntry(FICHERO_AL_DIA); } catch (e) { /* nada */ }   /* que otra vuelta lo reintente */
        return { ok: false, motivo: 'sin-respuesta' };
      }
      await escribirMarca({ estado: 'hecha', ordenador: yo, cuando: ahoraIso(), hilos: hilos.length });
      return { ok: true, hilos: hilos.length };
    } catch (e) {
      return { ok: false, motivo: 'error' };
    } finally {
      alDiaEnMarcha = false;
    }
  }

  /* ---------- reintentar ---------- */

  async function tick() {
    if (enDemo() || !window.App || !App.E || !App.E.gestor) return;
    await vaciar();
    await ponerAlDia();
  }

  function arrancar() {
    if (arrancado) return;
    arrancado = true;
    setTimeout(tick, 20 * 1000);
    setInterval(tick, CADA_MS);
  }
  if (typeof document !== 'undefined' && typeof setTimeout === 'function' && !window.__sinReintentosDeGmail) arrancar();

  /* ---------- la tarjeta de Problemas ---------- */

  function calcularProblema() {
    if (!window.Problemas || !window.ProblemasTextos) return;
    var n = estado ? atascadas(estado.ordenes, Date.now()).length : 0;
    var d = n ? ProblemasTextos.gmailPendiente(n) : null;
    if (d) d.acciones.forEach(function (a) {
      if (a.id === 'problema-gmail-ver') a.alPulsar = function () { if (!App.irASeccionDeAjustes('#bloque-envio-correo') && window.CorreoEnviar) CorreoEnviar.irAAjustes(); };
    });
    Problemas.registrar('gmail-pendiente', d);
  }
  if (window.Problemas) Problemas.calculador('gmail-pendiente', async function () { await enSerie(cargar); calcularProblema(); });

  return {
    ordenar: ordenar, vaciar: vaciar, ponerAlDia: ponerAlDia, tick: tick,
    metidoEnUnAsunto: metidoEnUnAsunto, descartado: descartado,
    asuntoArchivado: asuntoArchivado, asuntoReabierto: asuntoReabierto,
    hilosDeFicha: hilosDeFicha, hiloDeCorreo: hiloDeCorreo,
    pendientes: function () { return estado ? JSON.parse(JSON.stringify(estado.ordenes)) : {}; },
    /* puras, para las pruebas */
    _aplicar: aplicar, _atascadas: atascadas
  };
})();
