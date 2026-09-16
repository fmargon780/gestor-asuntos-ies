/* ============================================================
   correo-adjuntos.js — mandar los documentos de un asunto en un correo.

   Gmail no deja que una página web le enganche ficheros: ni la
   dirección de redactar (view=cm) ni mailto: admiten adjuntos. Así que
   para mandar un papel del expediente había que buscarlo a mano en el
   Dropbox y adjuntarlo con el clip.

   La salida es la carpeta que ya existe: GESTOR-BANDEJA, la misma por
   la que entran los correos. Aquí se va en el otro sentido:

     1. En el cuadro "Correo" se marcan los documentos del asunto.
     2. La aplicación deja en la bandeja una copia de cada uno y, al
        final, el encargo <id>.envio.json.
     3. El script de Apps Script —que sí puede adjuntar— monta un
        BORRADOR en Gmail, borra el encargo y deja <id>.listo.json con
        el enlace. Si algo falla, deja <id>.error.json con el motivo.
     4. Aquí se mira la bandeja cada 15 segundos mientras haya algún
        encargo vivo, y la tarjeta de arriba va contando cómo va.

   Siempre borrador, nunca envío automático: enviar, lo envía él.

   El .envio.json se escribe el último, igual que hace el script con la
   ficha de un correo: para el que lee, un encargo existe cuando existe
   su .json, y así nunca se coge uno a medio escribir.

   Los encargos vivos se apuntan en _GESTOR/envios.json, que es un
   fichero compartido: se relee antes de escribirlo y se guarda con
   Copias.guardar, nunca con Carpetas.guardarJson.
   ============================================================ */
(function () {

  var FICHERO_ENVIOS = 'envios.json';
  var TOPE = 20 * 1024 * 1024;              /* lo que admite Gmail */
  var SEGUNDOS_ENTRE_MIRADAS = 15;
  var PACIENCIA = 3 * 60 * 1000;            /* a los tres minutos se avisa */

  var ctx = null;            /* lo que el cuadro de correo deja usar */
  var documentos = [];       /* los papeles de la carpeta del asunto */
  var marcados = {};         /* qué casillas van puestas */
  var envios = [];           /* los encargos vivos */
  var estados = {};          /* id -> lo que ha contestado el script */
  var reloj = null;
  var mirando = false;
  var arrancado = false;

  function $(id) { return document.getElementById(id); }

  function laBandeja() {
    if (!window.Bandeja || typeof window.Bandeja.carpeta !== 'function') return null;
    return window.Bandeja.carpeta();
  }

  /* ==========================================================
     PIEZAS SUELTAS
     ========================================================== */

  function tamanoLegible(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
    return String(Math.round(n / (1024 * 1024) * 10) / 10).replace('.', ',') + ' MB';
  }

  function dos(n) { return String(n).padStart(2, '0'); }

  /* envio- + fecha + hora + cuatro dígitos al azar. Nunca se repite. */
  function nuevoId() {
    var d = new Date();
    return 'envio-' +
      String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate()) + '-' +
      dos(d.getHours()) + dos(d.getMinutes()) + dos(d.getSeconds()) + '-' +
      String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  }

  function ahoraSinZona() {
    var d = new Date();
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()) + 'T' +
      dos(d.getHours()) + ':' + dos(d.getMinutes()) + ':' + dos(d.getSeconds());
  }

  function cuandoSePuso(e) {
    var t = Date.parse(String((e && e.creado) || ''));
    return isNaN(t) ? Date.now() : t;
  }

  /* El hilo del asunto, para que el borrador salga dentro de la misma
     conversación. Sale de `hilos` (la huella de la fila 11). Si hay
     varios, el último apuntado; si no hay ninguno, cadena vacía. */
  function hiloDelAsunto(a) {
    var registro = (window.App && App.E && App.E.registro && App.E.registro.asuntos) || {};
    var ficha = registro[(a && a.nombre) || ''] || (a && a.ficha) || {};
    var hilos = Array.isArray(ficha.hilos) ? ficha.hilos : [];
    if (!hilos.length) return '';
    var ultimo = hilos[hilos.length - 1];
    return (ultimo && ultimo.id) || '';
  }

  /* ==========================================================
     EL BLOQUE DENTRO DEL CUADRO "CORREO"

     Solo en el del correo: en el de Séneca no, porque Séneca no admite
     esto. Las casillas van desmarcadas de partida: aquí lo normal es
     mandar un documento, no todos.
     ========================================================== */

  async function pintarBloque(contexto) {
    ctx = contexto;
    documentos = [];
    marcados = {};
    var caja = ctx && ctx.caja;
    if (!caja) return;
    caja.innerHTML = '';

    var a = ctx.asunto;
    if (!a || !a.handle) return;

    var lista;
    try { lista = await Carpetas.ficheros(a.handle); } catch (e) { lista = []; }
    if (!lista.length) return;          /* sin documentos, no se pinta nada */

    for (var i = 0; i < lista.length; i++) {
      var tamano = 0;
      try { tamano = (await lista[i].handle.getFile()).size || 0; } catch (e) { tamano = 0; }
      documentos.push({ nombre: lista[i].nombre, handle: lista[i].handle, tamano: tamano });
    }

    if (!document.body.contains(caja)) return;   /* ha cerrado el cuadro mientras leía */
    caja.innerHTML = cuerpoDelBloque();
    enganchar();
  }

  function cuerpoDelBloque() {
    return '<label class="etiqueta">Documentos de este asunto</label>' +
      '<div id="correo-docs">' +
        documentos.map(function (d, n) {
          return '<label class="correo-fila">' +
                   '<input type="checkbox" class="correo-doc" data-n="' + n + '">' +
                   '<span><strong>' + U.escapar(d.nombre) + '</strong>' +
                   '<span class="suave"> · ' + tamanoLegible(d.tamano) + '</span></span>' +
                 '</label>';
        }).join('') +
      '</div>' +
      '<div id="correo-docs-aviso" class="oculto"></div>' +
      (laBandeja()
        ? '<div class="correo-botones" style="margin-top:10px">' +
            '<button type="button" class="boton" id="correo-preparar" disabled>' +
              'Preparar borrador con los documentos</button>' +
          '</div>' +
          '<p class="nota">Se deja un borrador en tu Gmail con lo marcado. Enviar, lo envías tú.</p>'
        : '<p class="nota">Para mandar documentos hay que señalar la carpeta ' +
          '<code>GESTOR-BANDEJA</code> en Ajustes.</p>');
  }

  function enganchar() {
    var caja = ctx.caja;
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-doc'), function (c) {
      c.onchange = function () {
        marcados[c.getAttribute('data-n')] = c.checked;
        repasar();
      };
    });
    var b = $('correo-preparar');
    if (b) b.onclick = function () { preparar(b); };
    repasar();
  }

  function losMarcados() {
    return documentos.filter(function (d, n) { return !!marcados[String(n)]; });
  }

  /* Los nombres de lo marcado, para el rastro que escribe js/correo.js. */
  function nombresMarcados() {
    return losMarcados().map(function (d) { return d.nombre; });
  }

  /* Si lo marcado pasa de 20 MB no se deja preparar nada: Gmail lo
     rechazaría después, cuando ya no hay quien lo arregle. */
  function repasar() {
    var elegidos = losMarcados();
    var suma = elegidos.reduce(function (t, d) { return t + (d.tamano || 0); }, 0);
    var pasa = suma > TOPE;
    var aviso = $('correo-docs-aviso');
    if (aviso) {
      if (pasa) {
        aviso.className = 'aviso aviso-rojo';
        aviso.innerHTML = '<strong>Lo marcado son ' + tamanoLegible(suma) +
          ': Gmail no admite tanto.</strong>' +
          '<p>El tope son 20 MB. Quita alguno y vuelve a probar.</p>';
      } else {
        aviso.className = 'oculto';
        aviso.innerHTML = '';
      }
    }
    var b = $('correo-preparar');
    if (b) b.disabled = !elegidos.length || pasa;
  }

  /* ==========================================================
     EL ENCARGO
     ========================================================== */

  async function preparar(boton) {
    var elegidos = losMarcados();
    if (!elegidos.length) return;
    var bandeja = laBandeja();
    if (!bandeja) { U.aviso('No hay ninguna carpeta de bandeja señalada.', 'malo'); return; }

    var a = ctx.asunto;
    var id = nuevoId();
    boton.disabled = true;
    boton.textContent = 'Dejando el encargo…';

    try {
      /* Primero las copias, y el .json al final. */
      var puestos = [];
      for (var i = 0; i < elegidos.length; i++) {
        var nombre = id + ' - ' + elegidos[i].nombre;
        await Carpetas.copiarFicheroEn(bandeja, elegidos[i].handle, nombre);
        puestos.push(nombre);
      }
      var encargo = {
        id: id,
        creado: ahoraSinZona(),
        para: (ctx.para && ctx.para()) || '',
        asunto: (ctx.tema && ctx.tema()) || '',
        cuerpo: (ctx.cuerpo && ctx.cuerpo()) || '',
        adjuntos: puestos,
        hilo: hiloDelAsunto(a),
        asuntoCarpeta: (a && a.nombre) || ''
      };
      await Carpetas.escribirTexto(bandeja, id + '.envio.json',
        JSON.stringify(encargo, null, 2));
      await apuntarEnvio({
        id: id, asunto: encargo.asuntoCarpeta, para: encargo.para, creado: encargo.creado
      });
    } catch (e) {
      await limpiarDeLaBandeja(id);
      boton.disabled = false;
      boton.textContent = 'Preparar borrador con los documentos';
      U.aviso('No he podido dejar el encargo: ' + e.message, 'malo');
      return;
    }

    boton.textContent = 'Borrador en camino';
    try { if (ctx.rastro) await ctx.rastro(); } catch (e) { /* la nota es lo de menos */ }
    pintarTarjetas();
    arrancarReloj();
    mirar();
    U.aviso('Encargo puesto. El borrador aparecerá en tu Gmail en un minuto.', 'bueno');
  }

  /* ==========================================================
     envios.json — LOS ENCARGOS VIVOS

     Es un fichero compartido: el compañero puede tener el suyo en
     marcha, así que se relee antes de escribirlo y se guarda con
     Copias.guardar.
     ========================================================== */

  function elGestor() { return (window.App && App.E && App.E.gestor) || null; }

  async function leerEnvios() {
    var gestor = elGestor();
    if (!gestor) return [];
    var leido = null;
    try { leido = await Carpetas.leerJson(gestor, FICHERO_ENVIOS); } catch (e) { leido = null; }
    return Array.isArray(leido) ? leido : [];
  }

  async function apuntarEnvio(uno) {
    var lista = await leerEnvios();
    lista = lista.filter(function (e) { return e && e.id !== uno.id; });
    lista.push(uno);
    var gestor = elGestor();
    if (gestor) await Copias.guardar(gestor, FICHERO_ENVIOS, lista);
    envios = lista;
  }

  async function quitarEnvio(id) {
    var lista = await leerEnvios();
    lista = lista.filter(function (e) { return e && e.id !== id; });
    var gestor = elGestor();
    if (gestor) await Copias.guardar(gestor, FICHERO_ENVIOS, lista);
    envios = lista;
    delete estados[id];
  }

  /* Los ficheros de un encargo: el .envio.json, sus copias y la
     respuesta del script. Se borran a la vez, nunca solos. */
  async function limpiarDeLaBandeja(id) {
    var bandeja = laBandeja();
    if (!bandeja) return;
    var lista = [];
    try { lista = await Carpetas.ficheros(bandeja); } catch (e) { return; }
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i].nombre;
      if (n.indexOf(id + '.') !== 0 && n.indexOf(id + ' - ') !== 0) continue;
      try { await bandeja.removeEntry(n); } catch (e) { /* ya no estaba */ }
    }
  }

  async function olvidar(e) {
    await limpiarDeLaBandeja(e.id);
    await quitarEnvio(e.id);
    pintarTarjetas();
  }

  /* ==========================================================
     LA TARJETA "BORRADOR EN CAMINO"

     Va encima de la bandeja de correos, en la pantalla de asuntos
     abiertos, para que se vea aunque haya cerrado el cuadro del correo
     y esté en otra pantalla.
     ========================================================== */

  function cajaTarjetas() {
    var c = $('envios-en-camino');
    if (!c) {
      var paneles = document.querySelector('#pantalla-abiertos .paneles');
      if (!paneles || !paneles.parentNode) return null;
      c = document.createElement('div');
      c.id = 'envios-en-camino';
      c.className = 'oculto';
      paneles.parentNode.insertBefore(c, paneles.nextSibling);
    }
    /* La bandeja de correos se crea cuando le toca, así que la
       colocación se repasa cada vez: los encargos van encima. */
    var bandeja = $('bandeja-correos');
    if (bandeja && bandeja.parentNode === c.parentNode && c.nextSibling !== bandeja) {
      c.parentNode.insertBefore(c, bandeja);
    }
    return c;
  }

  function boton(texto, clase, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.textContent = texto;
    b.onclick = alPulsar;
    return b;
  }

  function tarjeta(e) {
    var d = document.createElement('div');
    var estado = estados[e.id] || {};
    var quien = U.escapar(e.asunto || 'un asunto');

    if (estado.como === 'error') {
      d.className = 'aviso aviso-rojo envio-tarjeta';
      d.innerHTML = '<strong>El borrador de "' + quien + '" no ha salido.</strong>' +
        '<p>' + U.escapar(estado.motivo || 'No se sabe qué ha pasado.') + '</p>';
      d.appendChild(boton('Entendido', 'boton', function () { olvidar(e); }));
      return d;
    }

    if (estado.como === 'listo') {
      d.className = 'aviso envio-tarjeta envio-listo';
      d.innerHTML = '<strong>Borrador listo — ' + quien + '</strong>' +
        '<p>Está en tus borradores de Gmail, con los documentos puestos. Enviar, lo envías tú.</p>';
      d.appendChild(boton('Abrir el borrador en Gmail', 'boton boton-principal', function () {
        if (estado.enlace) window.open(estado.enlace, '_blank');
        olvidar(e);
      }));
      return d;
    }

    if (Date.now() - cuandoSePuso(e) > PACIENCIA) {
      d.className = 'aviso aviso-ambar envio-tarjeta';
      d.innerHTML = '<strong>Borrador en camino — ' + quien + '</strong>' +
        '<p>Llevo más de tres minutos esperando. Puede que el script de Gmail no esté en marcha.</p>';
      d.appendChild(boton('Dejarlo', 'boton', function () { olvidar(e); }));
      return d;
    }

    d.className = 'aviso envio-tarjeta envio-esperando';
    d.innerHTML = '<strong>Borrador en camino — ' + quien + '</strong>' +
      '<p>Gmail lo está montando con los documentos. Suele tardar menos de un minuto.</p>';
    return d;
  }

  function pintarTarjetas() {
    var c = cajaTarjetas();
    if (!c) return;
    c.innerHTML = '';
    if (!envios.length) {
      c.className = 'oculto';
      pararReloj();
      return;
    }
    c.className = 'envios';
    envios.forEach(function (e) { c.appendChild(tarjeta(e)); });
  }

  /* ==========================================================
     LA ESPERA

     Se mira la bandeja cada 15 segundos mientras haya algún encargo
     vivo, y solo entonces: sin encargos, nada cambia.
     ========================================================== */

  async function leerSiEsta(bandeja, nombre) {
    try { return await Carpetas.leerJson(bandeja, nombre); } catch (e) { return null; }
  }

  async function mirar() {
    if (mirando) return;
    var bandeja = laBandeja();
    if (!bandeja || !envios.length) { pararReloj(); return; }
    mirando = true;
    try {
      for (var i = 0; i < envios.length; i++) {
        var e = envios[i];
        if (!e || !e.id || estados[e.id]) continue;
        var listo = await leerSiEsta(bandeja, e.id + '.listo.json');
        if (listo) {
          estados[e.id] = { como: 'listo', enlace: String(listo.enlace || '') };
          continue;
        }
        var malo = await leerSiEsta(bandeja, e.id + '.error.json');
        if (malo) {
          estados[e.id] = { como: 'error', motivo: String(malo.motivo || '') };
        }
      }
      pintarTarjetas();
    } catch (e) { /* si la bandeja no se deja leer, se reintenta luego */ }
    mirando = false;
  }

  function arrancarReloj() {
    if (reloj || !envios.length) return;
    reloj = setInterval(function () { mirar(); }, SEGUNDOS_ENTRE_MIRADAS * 1000);
  }

  function pararReloj() {
    if (!reloj) return;
    clearInterval(reloj);
    reloj = null;
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  async function arrancar() {
    if (arrancado) return;
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    arrancado = true;
    envios = await leerEnvios();
    pintarTarjetas();
    if (envios.length) { arrancarReloj(); await mirar(); }
  }

  window.Envios = {
    pintarBloque: pintarBloque,
    marcados: nombresMarcados,
    mirar: mirar,
    lista: function () { return envios.slice(); }
  };

  var enganchado = false;

  function engancharAlGestor() {
    if (enganchado || !window.Gestor) return;
    enganchado = true;
    window.Gestor.alRefrescar.push(function () {
      if (!arrancado) { arrancar(); return; }
      cajaTarjetas();          /* por si la bandeja se ha pintado después */
    });
  }

  engancharAlGestor();
  if (!enganchado) document.addEventListener('DOMContentLoaded', engancharAlGestor);

})();
