/* ============================================================
   archivar-fondo.js — archivar sin esperar (fila 398,
   docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md, parte 2).

   Los botones «Archivar» llaman a ArchivarFondo.archivar(a) en vez de
   a App.cerrarAsunto(a). Las preguntas de siempre (notas de directivos,
   «No cabe en el archivo», confirmación…) salen igual, antes. En el
   punto donde App.cerrarAsunto ya no pregunta nada
   (js/asuntos-archivar.js llama a `empieza`):

   - el asunto sale de la lista en el momento y quien pulsó recupera la
     pantalla (la promesa de `archivar` se cumple ahí);
   - en asuntos.json queda la marca `archivandose` ({ equipo, por, desde,
     categoria, tercero }) para que otro ordenador lo vea como
     «Archivándose en otro ordenador…» y para que, si se cierra la
     pestaña, este ordenador termine lo que quedó a medias al volver
     (`retomar`). Una marca de más de una hora se da por abandonada;
   - arriba sale «Archivando…» hasta que la carpeta está en el ARCHIVO y
     todo lo demás (ficha, hitos, índice) guardado: el final de toda la
     cadena de envolturas de App.cerrarAsunto;
   - si falla el traslado de la carpeta, el asunto vuelve a la lista como
     estaba, se quita la marca y sale un aviso rojo con botón de cerrar;
   - un guardado de datos que falle durante el archivo se comporta como en
     la parte 1 (js/guardado-pendiente.js).

   Quien llama a App.cerrarAsunto directamente (los archivados por lotes,
   las pruebas) sigue esperando a que acabe, como siempre. */
var ArchivarFondo = (function () {

  var UNA_HORA = 60 * 60 * 1000;
  var CLAVE_EQUIPO = 'gestor-equipo-archivar';
  var en = {};          /* nombre -> { liberar, liberada, a, ... } mientras dura la cadena entera */
  var yaRetomado = false;
  var equipo = null;

  function miEquipo() {
    if (equipo) return equipo;
    try { equipo = localStorage.getItem(CLAVE_EQUIPO); } catch (e) { equipo = null; }
    if (!equipo) {
      equipo = 'e' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(CLAVE_EQUIPO, equipo); } catch (e) { /* sin almacenamiento: vale para esta pestaña */ }
    }
    return equipo;
  }

  /* El número del asunto («A26-0123»); si no lo tiene, el nombre entero. */
  function numeroDe(nombre) {
    var m = /^[A-Z]\d{2}-\d{4}/.exec(String(nombre || ''));
    return m ? m[0] : String(nombre || '');
  }

  function marcaVigente(ficha) {
    var m = ficha && ficha.archivandose;
    if (!m || !m.desde) return null;
    var t = Date.parse(m.desde);
    if (isNaN(t) || Date.now() - t > UNA_HORA) return null;   /* abandonada */
    return m;
  }

  function enOtroOrdenador(ficha) {
    var m = marcaVigente(ficha);
    return !!m && m.equipo !== miEquipo();
  }

  /* Dentro de la lista: este ordenador lo está archivando ahora. */
  function oculta(nombre) { return !!(en[nombre] && en[nombre].oculto); }

  function activo(nombre) { return !!(en[nombre] && en[nombre].oculto); }

  function hayEnMarcha() { return Object.keys(en).some(function (n) { return en[n].oculto; }); }

  /* ---------- «Archivando…» ---------- */

  function pintarAviso() {
    try {
      var nombres = Object.keys(en).filter(function (n) { return en[n].oculto; });
      var caja = document.getElementById('archivando-fondo');
      if (!nombres.length) { if (caja) caja.remove(); return; }
      if (!caja) {
        caja = document.createElement('div');
        caja.id = 'archivando-fondo';
        caja.className = 'archivando-fondo';
        caja.setAttribute('role', 'status');
        document.body.appendChild(caja);
      }
      caja.textContent = nombres.length === 1 ? 'Archivando…'
        : 'Archivando ' + nombres.map(numeroDe).join(', ') + '…';
    } catch (e) { /* solo pintar */ }
  }

  function repintarLista() {
    try {
      App.E.listaAbiertos = (App.E.listaAbiertos || []).filter(function (x) { return !oculta(x.nombre); });
      var c = document.getElementById('cuenta-abiertos');
      if (c) c.textContent = App.E.listaAbiertos.length || '';
      if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
    } catch (e) { /* solo pintar */ }
  }

  /* ---------- lo que llaman los botones ---------- */

  function archivar(a, opciones) {
    var nombre = a.nombre;
    opciones = opciones || {};
    if (en[nombre]) {
      U.aviso('Ese asunto ya se está archivando.', 'ambar');
      return Promise.resolve();
    }
    var entrada = { a: a, oculto: false, empezo: false, liberada: false, resolver: null };
    en[nombre] = entrada;
    return new Promise(function (resolver, rechazar) {
      entrada.resolver = resolver;
      if (opciones.sinPreguntar) App.E.archivarSinPreguntar = true;
      Promise.resolve().then(function () { return App.cerrarAsunto(a); }).then(function () {
        return terminar(nombre);
      }, function (e) {
        return terminar(nombre).then(function () {
          if (!entrada.liberada) { entrada.liberada = true; rechazar(e); }
          else U.fallo('No he podido terminar de archivar el asunto ' + numeroDe(nombre), e);
        });
      }).then(function () {
        if (opciones.sinPreguntar) App.E.archivarSinPreguntar = false;
        if (!entrada.liberada) { entrada.liberada = true; resolver(); }
      });
    });
  }

  /* El final de toda la cadena: quita el asunto de «en marcha», la marca
     si no ha salido bien y repinta. */
  async function terminar(nombre) {
    var entrada = en[nombre];
    delete en[nombre];
    pintarAviso();
    if (!entrada || !entrada.empezo) return;
    try {
      var ficha = (App.E.registro.asuntos || {})[nombre];
      if (ficha && ficha.estado !== 'cerrado') {
        if (ficha.archivandose) await App.anotar(nombre, { archivandose: undefined });
        await App.verAbiertos();
      }
    } catch (e) { /* solo limpieza: la marca vence sola a la hora */ }
    repintarLista();
  }

  /* Lo llama App.cerrarAsunto cuando ya no queda ninguna pregunta. */
  async function empieza(a, categoria, tercero) {
    var entrada = en[a.nombre];
    if (!entrada) return;
    entrada.oculto = true;
    entrada.empezo = true;
    repintarLista();
    pintarAviso();
    if (!entrada.liberada) { entrada.liberada = true; entrada.resolver(); }
    try {
      await App.anotar(a.nombre, { archivandose: {
        equipo: miEquipo(), por: App.E.usuario || '', desde: new Date().toISOString(),
        categoria: categoria, tercero: tercero
      } });
    } catch (e) { /* sin marca, el asunto se archiva igual: solo otro ordenador no lo vería */ }
  }

  /* El traslado de la carpeta no ha salido. Devuelve true si lo ha tratado
     (se estaba archivando por detrás); si no, App.cerrarAsunto avisa como siempre. */
  function fallo(a, e, dondeCopia) {
    if (!activo(a.nombre)) return false;
    var num = numeroDe(a.nombre);
    var aMedias = e && (e.limpiezaFallida || e.copiaAMedias);
    var texto = 'No se ha podido archivar el asunto ' + num + '. ' +
      (aMedias
        ? 'Puede haber quedado una copia a medias en ' + dondeCopia + ' y la carpeta sigue en Asuntos abiertos. Vuelve a pulsar Archivar: se juntan.'
        : 'No se ha movido nada. Vuelve a pulsar Archivar.');
    var detalle = (e && e.paso) ? 'Ha fallado ' + e.paso + (e.fichero ? ' «' + e.fichero + '»' : '') + '. ' + U.mensajeDeError(e)
      : U.mensajeDeError(e);
    /* Se quita ya de «en marcha» para que la lista lo vuelva a enseñar. */
    en[a.nombre].oculto = false;
    if (window.GuardadoPendiente && GuardadoPendiente.avisoConCierre) GuardadoPendiente.avisoConCierre(texto, detalle);
    else U.aviso(texto, 'malo');
    return true;
  }

  /* ---------- al volver a abrir la app ---------- */

  /* Termina, de uno en uno y sin preguntar, lo que este ordenador dejó a
     medias (marca propia y reciente, con la carpeta todavía en Asuntos abiertos). */
  function alPintarLista() {
    if (yaRetomado) return;
    yaRetomado = true;
    var pendientes = (App.E.listaAbiertos || []).filter(function (x) {
      var m = marcaVigente(x.ficha);
      return m && m.equipo === miEquipo() && !en[x.nombre];
    });
    if (!pendientes.length) return;
    (async function () {
      for (var i = 0; i < pendientes.length; i++) {
        try { await archivar(pendientes[i], { sinPreguntar: true }); } catch (e) { /* ya avisado */ }
      }
    })();
  }

  window.addEventListener('beforeunload', function (ev) {
    if (!hayEnMarcha()) return;
    ev.preventDefault();
    ev.returnValue = '';
  });

  return {
    archivar: archivar, empieza: empieza, fallo: fallo, oculta: oculta, activo: activo,
    enOtroOrdenador: enOtroOrdenador, alPintarLista: alPintarLista, numeroDe: numeroDe,
    hayEnMarcha: hayEnMarcha, _miEquipo: miEquipo, _retomarOtraVez: function () { yaRetomado = false; }
  };
})();
window.ArchivarFondo = ArchivarFondo;
