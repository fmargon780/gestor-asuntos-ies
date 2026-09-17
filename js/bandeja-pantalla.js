/* ============================================================
   bandeja-pantalla.js — la bandeja de correos, en pantalla
   (17-sep-2026, fila 27, docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md).

   Toda la lógica de leer los correos, adivinar el asunto y guardarlos
   sigue en js/bandeja-correos.js (1.478 líneas: se saca de allí la
   parte de pantalla para no seguir engordándolo), que la expone por
   window.Bandeja, igual que ya hacía para js/bandeja-enlace.js y
   js/correo-adjuntos.js. Aquí solo se pinta.

   Vive dentro de "Por clasificar" (#zona-clasificar, en index.html),
   detrás de una barra plegable: "Correos sin clasificar (N)". Se
   despliega y se pliega al pulsarla, y **siempre arranca plegada** al
   entrar en la vista (aviso en js/asuntos-lista.js, `App.irVista`):
   sin memoria en `localStorage`, a propósito.

   La lectura de correos (`mirar()`, cada `SEGUNDOS_ENTRE_MIRADAS`) no
   se entera de si está plegada o desplegada: sigue corriendo igual, y
   el número de la barra se actualiza aunque no se esté mirando. Lo
   único que decide el plegado es si `#bandeja-correos` se ve o no.

   Se carga después de js/bandeja-correos.js (necesita window.Bandeja)
   y antes de js/bandeja-enlace.js y js/correo-adjuntos.js.
   ============================================================ */
var BandejaPantalla = (function () {

  var plegado = true;   /* arranca siempre plegada: sin memoria */

  function $(id) { return document.getElementById(id); }

  /* ---------- la barra y el plegado ---------- */

  function aplicarPlegado() {
    var b = $('btn-correos-sin-clasificar'), c = $('bandeja-correos');
    if (!b || !c) return;
    b.setAttribute('aria-expanded', plegado ? 'false' : 'true');
    /* pintarCaja() ya ha decidido su propio className (oculto, aviso o
       bandeja) según si hay algo que enseñar; aquí solo se le añade
       'oculto' por encima cuando está plegada, sin tocar lo demás. */
    if (plegado) c.classList.add('oculto');
  }

  function plegar() {
    plegado = true;
    aplicarPlegado();
  }

  function alternar() {
    plegado = !plegado;
    pintar();
  }

  function engancharBarra() {
    var b = $('btn-correos-sin-clasificar');
    if (!b || b.dataset.enganchado) return;
    b.dataset.enganchado = '1';
    b.onclick = alternar;
  }

  /* ---------- pintar la barra y la caja ---------- */

  function pintar() {
    engancharBarra();
    var wrap = $('correos-sin-clasificar'), cuenta = $('cuenta-correos-sin-clasificar');
    if (!wrap || !cuenta || !window.Bandeja) return;

    var carpeta = window.Bandeja.carpeta();
    if (!carpeta) { wrap.classList.add('oculto'); return; }
    wrap.classList.remove('oculto');

    var correos = window.Bandeja.correos();
    var n = Array.isArray(correos) ? correos.length : 0;
    cuenta.textContent = n;
    $('btn-correos-sin-clasificar').classList.toggle('correos-sin-clasificar-vacio',
      correos !== null && n === 0);

    pintarCaja(correos);
    aplicarPlegado();
  }

  function pintarCaja(correos) {
    var c = $('bandeja-correos');
    if (!c) return;
    c.innerHTML = '';

    if (correos === null) {
      c.className = 'aviso aviso-ambar';
      c.innerHTML = '<strong>La bandeja de correos necesita permiso otra vez.</strong>' +
        '<p>El navegador pide el permiso de nuevo cada vez que se abre la aplicación.</p>';
      var dar = document.createElement('button');
      dar.className = 'boton boton-principal';
      dar.textContent = 'Dar permiso a la bandeja';
      dar.onclick = async function () {
        var ok = await window.Bandeja.pedirPermiso();
        if (!ok) U.aviso('Sin permiso no puedo leer los correos.', 'malo');
      };
      c.appendChild(dar);
      return;
    }

    if (!correos.length) { c.className = 'oculto'; return; }

    c.className = 'bandeja';

    /* Un correo que ya metió el compañero en un asunto (fila 18, "Un
       mismo correo en dos buzones") no es un correo que atender: sale
       aparte, en una línea gris, nunca mezclado con las tarjetas de
       verdad. Se reconoce por matrícula, y solo si el hilo de este
       correo (el propio o el de que responde) no es ya una huella
       conocida: si lo es, es un correo de este mismo buzón y su
       tarjeta sale normal. */
    var normales = [];
    var yaGuardados = [];
    correos.forEach(function (item) {
      var d = item.datos;
      var porHilo = window.Bandeja.asuntoDelHilo(d.id) || window.Bandeja.asuntoDelHilo(d.respuestaDe);
      var porMatricula = porHilo ? null : window.Bandeja.asuntoDeLaMatricula(d.matriculas);
      if (porMatricula) yaGuardados.push({ item: item, encaje: porMatricula });
      else normales.push(item);
    });

    /* El título y la cuenta ya los da la barra plegable: aquí solo
       queda el botón de forzar una mirada. */
    var accionesArriba = document.createElement('div');
    accionesArriba.className = 'bandeja-acciones-arriba';
    var mirarYa = document.createElement('button');
    mirarYa.className = 'boton';
    mirarYa.textContent = 'Mirar ahora';
    mirarYa.onclick = function () { window.Bandeja.mirarDeNuevo(); };
    accionesArriba.appendChild(mirarYa);
    c.appendChild(accionesArriba);

    var lista = document.createElement('div');
    lista.className = 'lista';
    normales.forEach(function (item) { lista.appendChild(tarjeta(item)); });
    c.appendChild(lista);

    if (yaGuardados.length) {
      var listaGris = document.createElement('div');
      listaGris.className = 'lista lista-ya-guardados';
      yaGuardados.forEach(function (g) { listaGris.appendChild(lineaYaGuardado(g.item, g.encaje)); });
      c.appendChild(listaGris);
    }
  }

  /* "Ya está en el asunto «...» · lo metió Juan el 17-sep-2026 · 09:14",
     con "Abrir el asunto" (si sigue abierto) y "Quitar de mi bandeja"
     (nunca por la papelera: son copias de trabajo, el correo de verdad
     sigue en Gmail). */
  function lineaYaGuardado(item, encaje) {
    var huella = encaje.huella || {};
    var archivado = window.Bandeja.estaArchivado(encaje.ficha);
    var div = document.createElement('div');
    div.className = 'linea-ya-guardado';

    var frase = 'Ya está en el asunto «' + U.escapar(encaje.nombre) + '»';
    if (huella.metidoPor) frase += ' · lo metió ' + U.escapar(huella.metidoPor);
    if (huella.metidoEl) frase += ' el ' + U.escapar(window.Bandeja.fechaHoraLegible(huella.metidoEl));
    if (archivado) frase += ' · <strong>asunto archivado</strong>';
    div.innerHTML = '<span class="ya-guardado-texto">' + frase + '</span>';

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    if (!archivado) {
      var abrir = document.createElement('button');
      abrir.className = 'boton';
      abrir.textContent = 'Abrir el asunto';
      abrir.onclick = function () { abrirAsuntoYaGuardado(encaje.nombre); };
      acciones.appendChild(abrir);
    }
    var quitar = document.createElement('button');
    quitar.className = 'boton';
    quitar.textContent = 'Quitar de mi bandeja';
    quitar.onclick = async function () {
      var ok = await U.preguntar('Quitar de tu bandeja',
        '<p>Se quita de tu bandeja. El correo de verdad sigue en Gmail, y el asunto sigue como ' +
        'está.</p>', 'Quitar');
      if (!ok) return;
      await window.Bandeja.borrarDeLaBandeja(item);
    };
    acciones.appendChild(quitar);
    div.appendChild(acciones);
    return div;
  }

  function abrirAsuntoYaGuardado(nombreAsunto) {
    var a = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombreAsunto; })[0];
    if (!a) { U.aviso('No encuentro ese asunto entre los abiertos.', 'malo'); return; }
    App.ir('abiertos');
    App.abrirFicha(a, 'abierto');
  }

  function tarjeta(item) {
    var d = item.datos;
    var div = document.createElement('div');
    div.className = 'tarjeta tarjeta-correo';

    var de = (d.de && (d.de.nombre || d.de.correo)) || 'Remitente desconocido';
    var pie = [de, window.Bandeja.fechaLegible(d.fecha),
               d.mensajes > 1 ? d.mensajes + ' mensajes' : '',
               (d.adjuntos && d.adjuntos.length)
                 ? (d.adjuntos.length === 1 ? '1 documento' : d.adjuntos.length + ' documentos')
                 : ''].filter(Boolean).join('  ·  ');

    div.innerHTML = window.Bandeja.sobre() +
      '<div class="tarjeta-texto">' +
        '<div class="tarjeta-nombre">' + U.escapar(d.asunto || '(sin asunto)') + '</div>' +
        '<div class="tarjeta-pie">' + U.escapar(pie) + '</div>' +
        (d.enviado ? '<div class="tarjeta-pie correo-enviado">Lo enviaste tú</div>' : '') +
        '<div class="tarjeta-pie propuesta-correo"></div>' +
      '</div>';

    /* Primero la huella del hilo; si no la hay, se mira si el asunto
       del correo lleva dentro el nombre de un asunto que ya existe. En
       los dos casos es una respuesta: no hay que crear nada nuevo.
       Nunca se guarda solo: siempre hay que pulsar. */
    var yaEsta = window.Bandeja.asuntoDeEsteCorreo(d);
    var linea = div.querySelector('.propuesta-correo');

    if (yaEsta) {
      linea.innerHTML = '<span class="marca-tipo">Respuesta de</span>' +
        U.escapar(yaEsta.nombre) +
        (window.Bandeja.estaArchivado(yaEsta.ficha) ? '  ·  <strong>asunto archivado</strong>' : '');
    } else {
      /* La propuesta se calcula al pintar, sin esperar: primero sale la
         tarjeta y un momento después lo que se ha reconocido. */
      window.Bandeja.proponer(d).then(function (p) {
        if (!linea) return;
        if (!p.tercero && !p.tipo) {
          linea.textContent = 'Sin reconocer: elegirás tú el tercero y el tipo.';
          return;
        }
        var trozos = [];
        if (p.tipo) trozos.push(p.tipo.tipo);
        if (p.tercero) trozos.push(App.textoTercero(p.tercero));
        linea.innerHTML = '<span class="marca-tipo">Propuesta</span>' + U.escapar(trozos.join('  ·  '));
      }).catch(function () {});
    }

    var acciones = document.createElement('div');
    acciones.className = 'acciones';

    if (yaEsta && window.Bandeja.estaArchivado(yaEsta.ficha)) {
      /* Si contestan a un asunto archivado, la gestión ha vuelto a
         moverse: lo primero que se ofrece es reabrirlo. */
      var reabrir = document.createElement('button');
      reabrir.className = 'boton boton-principal';
      reabrir.textContent = 'Reabrir y guardar aquí';
      reabrir.onclick = function () { window.Bandeja.reabrirYGuardar(item, yaEsta); };
      acciones.appendChild(reabrir);

      var soloGuardar = document.createElement('button');
      soloGuardar.className = 'boton';
      soloGuardar.textContent = 'Guardar sin reabrir';
      soloGuardar.onclick = function () { window.Bandeja.guardarEnAsunto(item, yaEsta); };
      acciones.appendChild(soloGuardar);
    } else if (yaEsta) {
      var guardar = document.createElement('button');
      guardar.className = 'boton boton-principal';
      guardar.textContent = 'Guardar en ese asunto';
      guardar.onclick = function () { window.Bandeja.guardarEnAsunto(item, yaEsta); };
      acciones.appendChild(guardar);
    }

    /* Elegir a mano el asunto de destino, sea cual sea lo que haya
       adivinado la tarjeta: la huella también se puede equivocar.
       Lo de dentro está en js/bandeja-enlace.js. */
    if (typeof App.elegirAsuntoDelCorreo === 'function') {
      var elegir = document.createElement('button');
      elegir.className = 'boton';
      elegir.textContent = 'Elegir asunto';
      elegir.onclick = function () { App.elegirAsuntoDelCorreo(item); };
      acciones.appendChild(elegir);
    }

    var crear = document.createElement('button');
    crear.className = 'boton' + (yaEsta ? '' : ' boton-principal');
    crear.textContent = yaEsta ? 'Crear uno nuevo' : 'Crear el asunto';
    crear.onclick = function () { window.Bandeja.llevarANuevo(item); };
    acciones.appendChild(crear);

    if ((d.pdf || d.pdfMensaje) && window.Lector) {
      var leer = document.createElement('button');
      leer.className = 'boton';
      leer.textContent = 'Leer el correo';
      leer.onclick = function () { window.Bandeja.leerElCorreo(d); };
      acciones.appendChild(leer);
    }

    if (d.enlace) {
      var ver = document.createElement('button');
      ver.className = 'boton';
      ver.textContent = 'Abrir en Gmail';
      ver.onclick = function () { window.open(window.Bandeja.enlaceAGmail(d), '_blank'); };
      acciones.appendChild(ver);
    }

    var fuera = document.createElement('button');
    fuera.className = 'boton';
    fuera.textContent = 'Descartar';
    fuera.onclick = function () { window.Bandeja.descartar(item); };
    acciones.appendChild(fuera);

    div.appendChild(acciones);
    return div;
  }

  return { pintar: pintar, plegar: plegar };
})();
