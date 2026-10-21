/* ============================================================
   guardado-pendiente.js — un cambio que no se puede guardar no se
   tira (fila 364, docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md,
   parte 1).

   Antes: si Dropbox no soltaba un fichero de datos, la escritura
   probaba cuatro veces (Reintentar.escritura), se rendía, el guardado
   daba un aviso rojo de un solo uso y el cambio desaparecía: el
   registro cambiado vivía en una variable local que nadie guardaba, y
   el siguiente guardado releía el disco sin él.

   Ahora, cuando una escritura de un fichero de datos de `_GESTOR`
   (los de Copias.FICHEROS) acaba con un error de sincronización:

   - asuntos.json: se apunta lo que ha cambiado en cada asunto
     (`antes` y `despues` de su ficha, y lo mismo para los campos
     sueltos de la raíz). Al reintentar se relee el disco y se pone
     encima SOLO lo que cambió (campo a campo si el otro ordenador ha
     tocado el mismo asunto entretanto: así no se pisa su trabajo).
     Cualquier otro guardado de asuntos.json hace lo mismo antes de
     escribir (`superponer`), así que un cambio posterior nunca vuelve
     atrás el pendiente.
   - cualquier otro fichero de Copias.FICHEROS: su contenido entero,
     tal como se quería escribir (Copias.guardar).

   Lo pendiente se guarda también en el navegador de este ordenador
   (Almacen, IndexedDB), por carpeta del centro: aunque se cierre la
   pestaña, al volver a entrar se escribe lo primero (alCargar).

   Se ve un aviso rojo fijo arriba, sin botón de cerrar, mientras haya
   algo pendiente. Quien pidió el guardado queda esperando (su botón
   sigue en «guardando») hasta que sale de verdad: el mensaje verde
   solo sale entonces. Si el asunto ya no admite el cambio porque otro
   ordenador lo archivó, lo renombró, lo unió o lo mandó a la papelera
   (App.comprobarNoCerrado), el cambio se tira con un aviso rojo que sí
   se puede cerrar, y quien esperaba recibe un AsuntoCerrado ya avisado
   (`yaAvisado`: U.fallo y U.accesorio no repiten el aviso).

   Medidas: `tarde:<fichero>` cuando un cambio sale en un reintento
   posterior; `sin-remedio:<fichero>` solo cuando se tira.

   Se carga después de js/nucleo.js y js/borrados-fusion.js.
   ============================================================ */
var GuardadoPendiente = (function () {

  var CLAVE_ALMACEN = 'guardado-pendiente';
  var ASUNTOS = 'asuntos.json';
  var ESPERAS_MS = [4000, 8000, 15000, 30000];

  var pend = {};        /* fichero -> lo que falta por guardar */
  var esperas = {};     /* fichero -> [{ claves, ok, mal }] */
  var intentos = {};
  var temporizador = {};
  var comprobadas = null;   /* claves que App.comprobarNoCerrado ha mirado durante el `cambiar` en marcha */
  var cajaFija = null;

  function clonar(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function esObjeto(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function tiene(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function gestor() { return window.App && App.E && App.E.gestor; }

  /* Los ficheros que se guardan pendientes: los de Copias.FICHEROS. */
  function cubre(nombre) { return !!window.Copias && Copias.FICHEROS.indexOf(nombre) !== -1; }

  /* ---------- el aviso fijo ---------- */

  function caja() {
    if (cajaFija && document.body.contains(cajaFija)) return cajaFija;
    cajaFija = document.getElementById('guardado-pendiente-avisos');
    if (cajaFija) return cajaFija;
    cajaFija = document.createElement('div');
    cajaFija.id = 'guardado-pendiente-avisos';
    cajaFija.className = 'guardado-pendiente-avisos';
    cajaFija.innerHTML = '<div id="aviso-guardado-pendiente" class="guardado-pendiente-fijo oculto" role="alert">' +
      'Un cambio no se ha guardado todavía. La aplicación lo sigue intentando.</div>';
    document.body.appendChild(cajaFija);
    return cajaFija;
  }

  function pintarFijo() {
    try {
      var hay = Object.keys(pend).length > 0;
      var fijo = caja().querySelector('#aviso-guardado-pendiente');
      fijo.classList.toggle('oculto', !hay);
    } catch (e) { /* solo pintar */ }
  }

  function avisoConCierre(texto, detalle) {
    try {
      var d = document.createElement('div');
      d.className = 'guardado-pendiente-cerrable';
      d.setAttribute('role', 'alert');
      var t = document.createElement('span');
      t.textContent = texto;
      if (detalle) {
        var s = document.createElement('small');
        s.className = 'guardado-pendiente-detalle';
        s.textContent = detalle;
        t.appendChild(s);
      }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mensaje-boton';
      b.textContent = 'Cerrar';
      b.onclick = function () { d.remove(); };
      d.appendChild(t);
      d.appendChild(b);
      caja().appendChild(d);
    } catch (e) { /* solo pintar */ }
  }

  /* ---------- guardarlo en este ordenador ---------- */

  async function guardarEnElNavegador() {
    var g = gestor();
    if (!g || !window.Almacen) return;
    try {
      var todo = (await Almacen.leer(CLAVE_ALMACEN)) || {};
      if (Object.keys(pend).length) todo[g.name] = pend; else delete todo[g.name];
      if (Object.keys(todo).length) await Almacen.guardar(CLAVE_ALMACEN, todo);
      else await Almacen.borrar(CLAVE_ALMACEN);
    } catch (e) { console.warn('No he podido guardar el cambio pendiente en el navegador:', e); }
  }

  function cambio() { pintarFijo(); guardarEnElNavegador(); }

  /* ---------- poner lo pendiente encima de lo que hay en el disco ---------- */

  /* Pone la ficha pendiente `c` ({antes, despues}) en `contenedor[k]`. */
  function aplicarUna(contenedor, k, c) {
    if (!tiene(c, 'despues')) { delete contenedor[k]; return; }
    var d = contenedor[k];
    if (!tiene(c, 'antes') || !esObjeto(d) || !esObjeto(c.antes) || !esObjeto(c.despues) || igual(d, c.antes)) {
      contenedor[k] = clonar(c.despues);
      return;
    }
    /* El otro ordenador ha tocado esta ficha entretanto: solo lo que cambió aquí. */
    var campos = {};
    Object.keys(c.antes).concat(Object.keys(c.despues)).forEach(function (f) { campos[f] = true; });
    Object.keys(campos).forEach(function (f) {
      if (igual(c.antes[f], c.despues[f])) return;
      if (tiene(c.despues, f)) d[f] = clonar(c.despues[f]); else delete d[f];
    });
  }

  function numeroDe(clave) {
    var m = /^[A-Za-z]\d{2}-\d{3,}/.exec(clave);
    return m ? m[0] : clave;
  }

  async function descartar(clave) {
    if (window.Medidas) Medidas.cuenta('sin-remedio:' + Medidas.rotuloDeFichero(null, ASUNTOS));
    var motivo = '';
    try {
      var lista = (await Borrados.leer(gestor())).asuntos || [];
      var l = lista.filter(function (x) { return x.clave === clave; })[0];
      motivo = (l && l.motivo) || '';
    } catch (e) { /* con el texto general */ }
    var n = numeroDe(clave);
    var texto;
    if (motivo === 'renombrado') {
      texto = 'Un cambio en el asunto ' + n + ' no se ha guardado porque otro ordenador le cambió el nombre antes. ' +
        'Búscalo con su nombre nuevo y repítelo si hace falta.';
    } else if (motivo === 'papelera') {
      texto = 'Un cambio en el asunto ' + n + ' no se ha guardado porque otro ordenador lo mandó a la papelera antes. ' +
        'Míralo en la papelera y repítelo si hace falta.';
    } else if (motivo === 'unido') {
      texto = 'Un cambio en el asunto ' + n + ' no se ha guardado porque otro ordenador lo unió con otro antes. ' +
        'Búscalo en el asunto resultante y repítelo si hace falta.';
    } else {
      texto = 'Un cambio en el asunto ' + n + ' no se ha guardado porque otro ordenador lo archivó antes. ' +
        'Ábrelo desde el Archivo y repítelo si hace falta.';
    }
    avisoConCierre(texto);
    var lista2 = esperas[ASUNTOS] || [];
    esperas[ASUNTOS] = lista2.filter(function (w) {
      if (w.claves.indexOf(clave) === -1) return true;
      var err = new Error('Este asunto ya no admite el cambio: otro ordenador lo cerró antes.');
      err.name = 'AsuntoCerrado';
      err.yaAvisado = true;
      w.mal(err);
      return false;
    });
  }

  /* Pone encima de `registro` (recién leído del disco) lo pendiente de asuntos.json.
     Con `comprobar`, los asuntos que ya no admiten el cambio se tiran (con aviso).
     Devuelve si había algo. */
  async function superponer(registro, comprobar) {
    var e = pend[ASUNTOS];
    if (!e) return false;
    if (!registro.asuntos) registro.asuntos = {};
    var claves = Object.keys(e.claves);
    for (var i = 0; i < claves.length; i++) {
      var k = claves[i], c = e.claves[k];
      if (comprobar && c.comprobar && tiene(c, 'despues')) {
        try { await App.comprobarNoCerrado(k); }
        catch (err) {
          if (err && err.name === 'AsuntoCerrado') { delete e.claves[k]; await descartar(k); continue; }
          throw err;
        }
      }
      aplicarUna(registro.asuntos, k, c);
    }
    Object.keys(e.raiz).forEach(function (k) { aplicarUna(registro, k, e.raiz[k]); });
    if (!Object.keys(e.claves).length && !Object.keys(e.raiz).length) { delete pend[ASUNTOS]; cambio(); return false; }
    return true;
  }

  /* ---------- apuntar lo que no ha salido ---------- */

  function fusionar(destino, antes, despues, tocadas) {
    var cambiado = false;
    var todas = {};
    Object.keys(antes).concat(Object.keys(despues)).forEach(function (k) { todas[k] = true; });
    Object.keys(todas).forEach(function (k) {
      var a = tiene(antes, k), d = tiene(despues, k);
      if (a && d && igual(antes[k], despues[k])) return;
      cambiado = true;
      if (tocadas) tocadas.push(k);
      var c = destino[k];
      if (!c) { c = destino[k] = {}; if (a) c.antes = clonar(antes[k]); }
      if (d) c.despues = clonar(despues[k]); else delete c.despues;
      if (comprobadas && comprobadas.indexOf(k) !== -1) c.comprobar = true;
    });
    return cambiado;
  }

  /* `antesTexto`: el registro como estaba justo antes de `cambiar` (con lo pendiente ya encima).
     Devuelve las claves de asunto tocadas, o null si no había nada que apuntar. */
  function apuntarAsuntos(antesTexto, registro) {
    var antes = JSON.parse(antesTexto);
    var e = pend[ASUNTOS] || { tipo: 'asuntos', claves: {}, raiz: {}, desde: Date.now() };
    var tocadas = [];
    var hay = fusionar(e.claves, antes.asuntos || {}, registro.asuntos || {}, tocadas);
    var a0 = {}, a1 = {};
    Object.keys(antes).forEach(function (k) { if (k !== 'asuntos') a0[k] = antes[k]; });
    Object.keys(registro).forEach(function (k) { if (k !== 'asuntos') a1[k] = registro[k]; });
    if (fusionar(e.raiz, a0, a1)) hay = true;
    if (!hay && !pend[ASUNTOS]) return null;
    pend[ASUNTOS] = e;
    cambio();
    programar(ASUNTOS);
    return tocadas;
  }

  function apuntarCompleto(gestorCarpeta, nombre, objeto) {
    pend[nombre] = { tipo: 'completo', contenido: clonar(objeto), desde: Date.now() };
    cambio();
    programar(nombre);
    return esperar(nombre, []);
  }

  function esperar(fichero, claves) {
    return new Promise(function (ok, mal) {
      (esperas[fichero] = esperas[fichero] || []).push({ claves: claves || [], ok: ok, mal: mal });
    });
  }

  /* Lo pendiente de `fichero` ya está en el disco. */
  function guardado(fichero, tarde) {
    delete pend[fichero];
    delete intentos[fichero];
    if (temporizador[fichero]) { clearTimeout(temporizador[fichero]); delete temporizador[fichero]; }
    if (tarde && window.Medidas) Medidas.cuenta('tarde:' + Medidas.rotuloDeFichero(null, fichero));
    var lista = esperas[fichero] || [];
    delete esperas[fichero];
    lista.forEach(function (w) { w.ok(); });
    cambio();
  }

  /* Un guardado normal de `fichero` acaba de salir bien: si había uno pendiente de otro fichero que
     no es asuntos.json, el nuevo contenido lo sustituye (quien lo quería ya tiene lo más reciente). */
  function guardadoNormal(fichero) {
    if (fichero !== ASUNTOS && pend[fichero]) guardado(fichero, false);
  }

  /* ---------- reintentar solo ---------- */

  function programar(fichero) {
    if (temporizador[fichero]) return;
    var n = intentos[fichero] || 0;
    temporizador[fichero] = setTimeout(function () {
      delete temporizador[fichero];
      reintentar(fichero);
    }, ESPERAS_MS[Math.min(n, ESPERAS_MS.length - 1)]);
  }

  async function reintentar(fichero) {
    if (!pend[fichero]) return;
    intentos[fichero] = (intentos[fichero] || 0) + 1;
    try {
      if (fichero === ASUNTOS) await App.guardarRegistroFresco(function () {}, true);
      else await Copias.guardar(gestor(), fichero, pend[fichero].contenido, { sinPendiente: true });
      if (fichero !== ASUNTOS && pend[fichero]) guardado(fichero, true);
    } catch (e) {
      console.warn('El cambio pendiente de ' + fichero + ' sigue sin guardarse:', e && e.name);
    }
    if (pend[fichero]) programar(fichero);
  }

  /* ---------- engancharse al guardado de asuntos.json (js/nucleo.js) ---------- */

  function empiezaCambio() { comprobadas = []; }
  function acabaCambio() { /* `comprobadas` se queda hasta apuntarAsuntos */ }
  function anotaComprobada(clave) { if (comprobadas) comprobadas.push(clave); }
  function sueltaComprobadas() { comprobadas = null; }

  /* Después de leer el registro del disco (App.cargarRegistro): lo pendiente se ve en pantalla
     aunque el disco todavía no lo tenga, y la primera vez se recupera lo que quedó de la sesión anterior. */
  var arrancado = false;
  async function alCargar(registro) {
    try {
      if (!arrancado) {
        arrancado = true;
        await recuperar();
      }
      if (registro && pend[ASUNTOS]) await superponer(registro, false);
    } catch (e) { console.warn('Guardado pendiente al cargar:', e); }
  }

  async function recuperar() {
    var g = gestor();
    if (!g || !window.Almacen) return;
    var todo = await Almacen.leer(CLAVE_ALMACEN);
    var mio = todo && todo[g.name];
    if (!mio) return;
    Object.keys(mio).forEach(function (f) { if (!pend[f]) pend[f] = mio[f]; });
    pintarFijo();
    Object.keys(mio).forEach(function (f) { if (pend[f]) { intentos[f] = 0; programar(f); } });
  }

  function hayPendiente() { return Object.keys(pend).length > 0; }

  return {
    ASUNTOS: ASUNTOS,
    cubre: cubre, superponer: superponer, apuntarAsuntos: apuntarAsuntos, apuntarCompleto: apuntarCompleto,
    esperar: esperar, guardado: guardado, guardadoNormal: guardadoNormal, alCargar: alCargar,
    empiezaCambio: empiezaCambio, acabaCambio: acabaCambio, anotaComprobada: anotaComprobada,
    sueltaComprobadas: sueltaComprobadas, hayPendiente: hayPendiente, avisoConCierre: avisoConCierre
  };
})();
window.GuardadoPendiente = GuardadoPendiente;
