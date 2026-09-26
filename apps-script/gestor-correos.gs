/* PARA ACTUALIZARLO: abre https://script.google.com, proyecto
   "Gestor - Correos", borra todo el contenido del fichero de código y
   pega este entero. Guarda y ejecuta una vez prepararTodo().

   17-sep-2026: guarda la matrícula (Message-ID) de cada mensaje, y
   sigue los hilos también por matrícula, no solo por identificador de
   hilo (docs/CORREO-EN-DOS-BUZONES.md, fila 18 de la cola). Si esta
   fecha no está en la copia pegada en script.google.com, está vieja.

   17-sep-2026 (más tarde), fila 21, docs/GRUPOS-DE-PERSONAS.md: los
   destinatarios que vienen de un grupo van en copia oculta (`cco` del
   encargo), nunca en «Para». Si el correo no lleva a nadie en «Para»
   pero sí lleva `cco`, se pone como «Para» la propia cuenta de quien
   ejecuta el script: Gmail no admite un borrador sin nadie ahí, y es
   lo que hace todo el mundo con un envío en copia oculta.

   24-sep-2026: encuentra la carpeta GESTOR-BANDEJA aunque esté dentro
   de otra carpeta, no solo en la raíz de «Mi unidad». Sin esto, los
   borradores con documentos se quedaban en "Borrador en camino".

   24-sep-2026 (más tarde), fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md:
   la aplicación web (doPost) manda el correo EN EL MOMENTO, llamada
   directamente por el Gestor de Asuntos desde el cuadro de Correo. Se
   acabó la carpeta intermedia de "mandar documentos por correo": los
   encargos se quedaban sin recoger (comprobado el 24-sep-2026), y
   Francisco tenía que irse del asunto a buscar el borrador a Gmail.
   `mandarBorradores()` se queda tal cual, sin uso, por si quedara
   algún encargo `.envio.json` antiguo suelto en la bandeja; no se
   borra para no perder ese camino de rescate.

   24-sep-2026 (tarde), fila 117, docs/ENVIO-CUENTA-DEL-SCRIPT.md:
   la cuenta propia sale de getEffectiveUser() (la que ejecuta el
   script, «Ejecutar como: Yo»), no de getActiveUser(), que llega vacía
   con acceso «Cualquier usuario» y dejaba «Probar» en «No hay ningún
   destinatario». prepararEnvio() ya no da la dirección /dev: da la
   clave sola y dice de dónde copiar la dirección /exec.

   24-sep-2026 (noche), fila 130, docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md:
   un correo no sale dos veces. La aplicación manda un identificador de
   envío (`idEnvio`); si llega otra vez el mismo (se cortó la red después
   de enviar y se volvió a pulsar), no se envía de nuevo: se contesta
   como si hubiera salido bien, con `yaEnviado: true`. Una petición sin
   identificador se envía como siempre.

   26-sep-2026, fila 178, docs/CORREO-VERSIONES-Y-LIMPIEZA.md: la caché
   de seis horas (CacheService, su máximo) se queda corta si el
   reintento llega más tarde. Cada `idEnvio` que sale bien también se
   apunta para siempre en PropertiesService, agrupado por día
   (`enviados-AAMMDD`); se mira ahí si la caché ya no lo tiene, y los
   grupos de más de 60 días se borran solos en cada vuelta de
   `recogerCorreos()`. Versión del script: VERSION_SCRIPT, más abajo.
   ============================================================
   Gestor de Asuntos — recogida de correos y envío desde el asunto
   Google Apps Script, en la cuenta g.educaand.es

   La recogida de correos (ETIQUETA GESTOR, GESTOR-BANDEJA en Drive) no
   se ejecuta desde la web: es una copia de lo que hay pegado en
   script.google.com. Si se cambia aquí, hay que volver a pegarlo allí.

   El ENVÍO (doPost) sí se ejecuta desde la web: es la aplicación web
   que el Gestor de Asuntos llama directamente al pulsar "Confirmar y
   enviar" en el cuadro de Correo. Hace falta implementarla (Ajustes →
   Enviar correo, en la propia aplicación, explica los pasos) y pegar
   aquí el código cada vez que cambie.

   Qué hace, cada minuto (recogerCorreos, con el disparador puesto por
   prepararTodo):

   1. Mira los correos que tengan la etiqueta GESTOR.
   2. De cada uno guarda una ficha en la carpeta GESTOR-BANDEJA de
      Drive: remitente, fecha, asunto, texto y direcciones.
   3. Guarda también el hilo en PDF y sus documentos adjuntos.
   4. Le quita la etiqueta GESTOR y le pone GESTOR/Hecho, para no
      volver a recogerlo.
   5. Y después lee seguidos.json, que escribe el Gestor de Asuntos con
      los hilos que ya están enganchados a un asunto. De esos hilos ya
      no hay etiqueta que valga: se miran uno por uno y, si han crecido,
      se recogen otra vez. Así entran las respuestas del tercero y
      también los correos que manda Francisco desde Gmail.

   El Gestor de Asuntos lee esa carpeta en js/bandeja-correos.js.
   Este script no crea carpetas de asuntos ni toca nada del centro.
   ============================================================ */

var ETIQUETA = 'GESTOR';
var ETIQUETA_HECHO = 'GESTOR/Hecho';
var CARPETA = 'GESTOR-BANDEJA';
var FICHERO_SEGUIDOS = 'seguidos.json';
var MAX_POR_VUELTA = 20;
var MAX_SEGUIDOS_POR_VUELTA = 40;
var MAX_LETRAS_TEXTO = 6000;
var MAX_ENCARGOS_POR_VUELTA = 20;
var MAX_BYTES_ENVIO = 20 * 1024 * 1024;
var PROPIEDAD_CLAVE = 'clave-envio';

/* ---------- lo que hay que ejecutar una sola vez ---------- */

function prepararTodo() {
  etiqueta(ETIQUETA);
  etiqueta(ETIQUETA_HECHO);
  var carpeta = carpetaBandeja();

  var puestos = ScriptApp.getProjectTriggers();
  for (var i = 0; i < puestos.length; i++) {
    if (puestos[i].getHandlerFunction() === 'recogerCorreos') {
      ScriptApp.deleteTrigger(puestos[i]);
    }
  }
  ScriptApp.newTrigger('recogerCorreos').timeBased().everyMinutes(1).create();

  Logger.log('Listo. Etiquetas creadas, carpeta ' + carpeta.getName() +
             ' preparada, y revisión cada minuto. Para el ENVÍO, implementa esto como ' +
             'aplicación web (Implementar → Nueva implementación) y ejecuta prepararEnvio().');
}

/* Se ejecuta una sola vez, después de haber implementado el proyecto
   como aplicación web (paso 3 de Ajustes → Enviar correo, en el
   Gestor de Asuntos). Crea la clave si no existe y la deja en el
   registro de ejecución. getUrl(), ejecutado desde el editor, da la
   dirección de pruebas (/dev), que solo funciona con la sesión del
   dueño abierta: esa no se da nunca. La buena se copia de «Implementar
   → Gestionar implementaciones» (termina en /exec). */
function prepararEnvio() {
  var propiedades = PropertiesService.getScriptProperties();
  var clave = propiedades.getProperty(PROPIEDAD_CLAVE);
  if (!clave) {
    clave = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    propiedades.setProperty(PROPIEDAD_CLAVE, clave);
  }
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  if (/\/exec$/.test(url)) {
    Logger.log('Pega esto en el Gestor de Asuntos, en Ajustes → Enviar correo: ' + url + '?k=' + clave);
    return;
  }
  Logger.log('Clave: ' + clave);
  Logger.log('Copia la URL de Implementar → Gestionar implementaciones (termina en /exec), y pégala ' +
    'en Ajustes → Enviar correo; añade al final ?k=' + clave);
}

/* ---------- la vuelta de cada minuto ---------- */

function recogerCorreos() {
  limpiarEnviadosViejos();
  var pendiente = etiqueta(ETIQUETA);
  var hecho = etiqueta(ETIQUETA_HECHO);
  var carpeta = carpetaBandeja();
  var hilos = pendiente.getThreads(0, MAX_POR_VUELTA);

  for (var i = 0; i < hilos.length; i++) {
    var hilo = hilos[i];
    try {
      guardarHilo(hilo, carpeta, null);
      hilo.removeLabel(pendiente);
      hilo.addLabel(hecho);
    } catch (e) {
      Logger.log('No he podido guardar "' + hilo.getFirstMessageSubject() + '": ' + e.message);
    }
  }

  seguirHilosConocidos(carpeta);
}

/* ---------- los hilos que ya están enganchados a un asunto ----------

   El Gestor de Asuntos escribe en la carpeta de la bandeja un fichero
   seguidos.json con los hilos que ya viven dentro de algún asunto y
   cuántos mensajes tenía cada uno la última vez:

     { "hilos": [ { "id": "...", "visto": 2, "asunto": "..." } ] }

   Aquí se miran esos hilos uno por uno. Si han crecido, se recogen
   otra vez, con dos campos más en la ficha: `respuestaDe`, con el
   identificador del hilo, y `enviado`, cuando el último mensaje lo
   mandó el propio usuario.

   Si el fichero no existe o está roto, no pasa nada: el script sigue
   con su trabajo de siempre sin quejarse. */

function seguirHilosConocidos(carpeta) {
  var lista = leerSeguidos(carpeta);
  var cuantos = Math.min(lista.length, MAX_SEGUIDOS_POR_VUELTA);

  for (var i = 0; i < cuantos; i++) {
    var s = lista[i] || {};
    if (!s.id) continue;
    try {
      var hilo = hiloDeSeguido(s);
      if (!hilo) continue;                       /* no ha pasado por este buzón */
      var idLocal = hilo.getId();
      var cuantosMensajes = hilo.getMessageCount();
      var visto = vistoLocal(idLocal, s.visto);
      if (cuantosMensajes <= visto) continue;    /* nada nuevo */
      guardarHilo(hilo, carpeta, s.id);
      guardarVistoLocal(idLocal, cuantosMensajes);
    } catch (e) {
      Logger.log('El hilo seguido ' + s.id + ' no se ha podido mirar: ' + e.message);
    }
  }
}

/* El identificador de hilo es de cada buzón: en el que enganchó el
   correo vale tal cual, pero en el del compañero no existe. Ahí se
   busca por matrícula (el Message-ID, el mismo en todos los buzones),
   de la última a la primera: la más reciente es la que más
   probablemente ha llegado también aquí. Si no aparece ninguna, este
   correo no ha pasado por este buzón, y se salta sin ruido. */
function hiloDeSeguido(s) {
  var hilo = GmailApp.getThreadById(s.id);
  if (hilo) return hilo;
  var matriculas = s.matriculas || [];
  for (var i = matriculas.length - 1; i >= 0; i--) {
    if (!matriculas[i]) continue;
    var encontrados = GmailApp.search('rfc822msgid:' + matriculas[i], 0, 1);
    if (encontrados.length) return encontrados[0];
  }
  return null;
}

/* La cuenta de mensajes vistos es de cada buzón, no compartida: el
   mismo hilo puede tener un número de mensajes distinto en cada uno
   (correos internos, borradores, reenvíos que no están en los dos
   sitios). Comparar con el 'visto' de seguidos.json (que escribe el
   buzón que enganchó el correo) haría que el hilo se recogiera cada
   minuto para siempre, o que no se recogiera nunca. Así que la cuenta
   de este buzón se guarda aparte, en el propio proyecto de Apps
   Script; solo la primera vez que se seguimos un hilo, sin cuenta
   propia todavía, se parte del 'visto' compartido (o 1). */
function vistoLocal(idLocal, vistoCompartido) {
  var guardado = PropertiesService.getScriptProperties().getProperty('visto:' + idLocal);
  if (guardado !== null) return parseInt(guardado, 10) || 0;
  return parseInt(vistoCompartido, 10) || 1;
}

function guardarVistoLocal(idLocal, cuantosMensajes) {
  PropertiesService.getScriptProperties().setProperty('visto:' + idLocal, String(cuantosMensajes));
}

function leerSeguidos(carpeta) {
  try {
    var busca = carpeta.getFilesByName(FICHERO_SEGUIDOS);
    if (!busca.hasNext()) return [];
    var leido = JSON.parse(busca.next().getBlob().getDataAsString());
    var lista = (leido && leido.hilos) ? leido.hilos : leido;
    return Object.prototype.toString.call(lista) === '[object Array]' ? lista : [];
  } catch (e) {
    Logger.log('seguidos.json no se puede leer: ' + e.message);
    return [];
  }
}

/* Lo que quedara de una recogida anterior del mismo hilo. Sin esto,
   Drive admite dos ficheros con el mismo nombre y el Gestor no sabría
   cuál coger. La ficha .json se escribe la última, así que borrar
   primero no deja nunca un correo a medias. */
function limpiarRestos(carpeta, id) {
  try {
    var suyos = carpeta.getFiles();
    var fuera = [];
    while (suyos.hasNext()) {
      var f = suyos.next();
      var n = f.getName();
      if (n === id + '.json' || n.indexOf(id + ' - ') === 0) fuera.push(f);
    }
    for (var i = 0; i < fuera.length; i++) fuera[i].setTrashed(true);
  } catch (e) { /* si no se puede limpiar, se sigue */ }
}

/* ---------- guardar un hilo ---------- */

function guardarHilo(hilo, carpeta, respuestaDe) {
  var mensajes = hilo.getMessages();
  var primero = mensajes[0];
  var ultimo = mensajes[mensajes.length - 1];
  var id = hilo.getId();
  var mia = String(miCorreo() || '').toLowerCase();

  limpiarRestos(carpeta, id);

  var matriculas = [];
  for (var i = 0; i < mensajes.length; i++) {
    var m = matricula(mensajes[i]);
    if (m && matriculas.indexOf(m) === -1) matriculas.push(m);
  }

  var ficha = {
    id: id,
    recogido: ahora(),
    fecha: soloFecha(primero.getDate()),
    fechaUltimo: soloFecha(ultimo.getDate()),
    asunto: hilo.getFirstMessageSubject(),
    de: quien(primero.getFrom()),
    correos: direccionesDelHilo(mensajes),
    mensajes: mensajes.length,
    texto: recortar(ultimo.getPlainBody(), MAX_LETRAS_TEXTO),
    enlace: enlaceAlHilo(hilo, primero),
    matriculas: matriculas,
    matricula: matricula(ultimo),
    pdf: '',
    pdfMensaje: '',
    adjuntos: []
  };

  if (respuestaDe) ficha.respuestaDe = respuestaDe;
  if (quien(ultimo.getFrom()).correo === mia) ficha.enviado = true;

  /* El hilo entero en PDF, para archivarlo dentro de la carpeta del
     asunto. En un hilo de un solo mensaje no hay hilo que valga: ese
     PDF es el del propio correo, y así lo nombra el Gestor. */
  try {
    var pdf = carpeta.createFile(hiloEnPdf(hilo, mensajes));
    if (mensajes.length > 1) ficha.pdf = pdf.getName();
    else ficha.pdfMensaje = pdf.getName();
  } catch (e) {
    Logger.log('Sin PDF de "' + ficha.asunto + '": ' + e.message);
  }

  /* Y el último mensaje él solo, para que cada correo entre en la
     carpeta del asunto como su propio documento. */
  if (mensajes.length > 1) {
    try {
      var suelto = carpeta.createFile(mensajeEnPdf(hilo, ultimo, mensajes.length));
      ficha.pdfMensaje = suelto.getName();
    } catch (e) { /* si falla, queda el hilo entero, que lo lleva dentro */ }
  }

  /* Los documentos que traiga el correo. */
  for (var m = 0; m < mensajes.length; m++) {
    var trae = mensajes[m].getAttachments();
    for (var a = 0; a < trae.length; a++) {
      try {
        var nombre = id + ' - ' + trae[a].getName();
        carpeta.createFile(trae[a].copyBlob().setName(nombre));
        ficha.adjuntos.push(nombre);
      } catch (e) { /* un adjunto raro no puede tumbar la recogida */ }
    }
  }

  /* La ficha se escribe la última: para el Gestor, un correo existe
     cuando existe su .json. Así nunca lee uno a medio guardar. */
  carpeta.createFile(id + '.json', JSON.stringify(ficha, null, 2), 'application/json');
}

/* ============================================================
   ENVIAR EL CORREO DESDE EL ASUNTO (24-sep-2026, fila 115,
   docs/ENVIAR-DESDE-EL-ASUNTO.md)

   La aplicación web de este mismo proyecto. El Gestor de Asuntos le
   manda un POST, con el cuerpo en JSON, y `Content-Type: text/plain`
   a propósito: así el navegador lo trata como una petición "simple" y
   no hace la consulta previa CORS, que Apps Script no sabe contestar.

   Cuerpo esperado:
     { clave, para, cco, asunto, cuerpo, hilo,
       adjuntos: [ { nombre, tipo, base64 } ], prueba }

   `clave` se comprueba contra la propiedad del script que deja
   prepararEnvio(); si no coincide, no se manda nada. También se
   acepta por `e.parameter.k` (el `?k=` de la propia dirección), para
   que Francisco solo tenga que pegar una cosa en Ajustes.

   Con `hilo`: si el hilo existe y los destinatarios que se piden ya
   son destinatarios del hilo (todos ellos), se responde DENTRO del
   hilo, con `createDraftReply(...)` + `.send()` del borrador: eso
   conserva el hilo y admite adjuntos y `bcc`. Si no, correo nuevo
   (mismo camino, `createDraft(...)` + `.send()`): así el Message-ID de
   lo mandado sale igual en los dos casos.

   `prueba: true` (el botón "Probar" de Ajustes) manda el correo a la
   propia cuenta, sin mirar `para`/`cco`.
   ============================================================ */

var VERSION_SCRIPT = '26-sep-2026 · fila 178';
var SEGUNDOS_RECORDAR_ENVIO = 6 * 60 * 60;   /* el máximo de CacheService */

/* Fila 178, punto 1: la caché solo aguanta seis horas (el máximo de
   CacheService); un reintento más tarde mandaba el correo otra vez.
   Cada `idEnvio` que sale bien se apunta también, para siempre (hasta
   que caduca), en PropertiesService, agrupado por día de envío
   ('enviados-AAMMDD' -> lista de ids). `limpiarEnviadosViejos` quita
   los grupos de más de DIAS_RECORDAR_ENVIO_PERMANENTE días en cada
   vuelta del disparador (recogerCorreos), así esto no crece sin fin. */
var PREFIJO_ENVIADOS = 'enviados-';
var DIAS_RECORDAR_ENVIO_PERMANENTE = 60;

function grupoDeHoy() {
  return PREFIJO_ENVIADOS + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
}

function yaEnviadoPermanente(id) {
  var propiedades = PropertiesService.getScriptProperties().getProperties();
  for (var clave in propiedades) {
    if (clave.indexOf(PREFIJO_ENVIADOS) !== 0) continue;
    var lista;
    try { lista = JSON.parse(propiedades[clave] || '[]'); } catch (e) { lista = []; }
    if (lista.indexOf(id) !== -1) return true;
  }
  return false;
}

function apuntarEnviadoPermanente(id) {
  var propiedades = PropertiesService.getScriptProperties();
  var clave = grupoDeHoy();
  var lista;
  try { lista = JSON.parse(propiedades.getProperty(clave) || '[]'); } catch (e) { lista = []; }
  if (lista.indexOf(id) === -1) lista.push(id);
  propiedades.setProperty(clave, JSON.stringify(lista));
}

function limpiarEnviadosViejos() {
  var propiedades = PropertiesService.getScriptProperties();
  var todas = propiedades.getProperties();
  var limite = new Date();
  limite.setDate(limite.getDate() - DIAS_RECORDAR_ENVIO_PERMANENTE);
  var limiteAaMmDd = Utilities.formatDate(limite, Session.getScriptTimeZone(), 'yyMMdd');
  for (var clave in todas) {
    if (clave.indexOf(PREFIJO_ENVIADOS) !== 0) continue;
    if (clave.slice(PREFIJO_ENVIADOS.length) < limiteAaMmDd) propiedades.deleteProperty(clave);
  }
}

function doPost(e) {
  var resultado;
  try {
    var cuerpo = {};
    if (e && e.postData && e.postData.contents) {
      cuerpo = JSON.parse(e.postData.contents);
    }
    var claveRecibida = cuerpo.clave || (e && e.parameter && e.parameter.k) || '';
    var claveGuardada = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_CLAVE);
    if (!claveGuardada) {
      resultado = { ok: false, motivo: 'Esta aplicación todavía no tiene clave. Ejecuta prepararEnvio() una vez.' };
    } else if (claveRecibida !== claveGuardada) {
      resultado = { ok: false, motivo: 'La clave no es correcta.' };
    } else {
      resultado = enviarUnaVez(cuerpo);
    }
  } catch (err) {
    resultado = { ok: false, motivo: 'No he podido enviar el correo: ' + (err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
}

/* Fila 130: con `idEnvio`, cada envío sale una sola vez. El candado del
   script evita que dos peticiones con el mismo identificador, llegadas a
   la vez, salgan las dos. */
function enviarUnaVez(cuerpo) {
  var id = String(cuerpo.idEnvio || '').trim();
  if (!id || cuerpo.prueba) return conVersion(enviarCorreo(cuerpo));
  var cache = CacheService.getScriptCache();
  var clave = 'envio:' + id;
  var candado = LockService.getScriptLock();
  candado.waitLock(30000);
  try {
    var previo = cache.get(clave);
    if (!previo && yaEnviadoPermanente(id)) previo = JSON.stringify({ ok: true });
    if (previo) {
      var r = JSON.parse(previo);
      r.yaEnviado = true;
      return conVersion(r);
    }
    var resultado = enviarCorreo(cuerpo);
    if (resultado && resultado.ok) {
      cache.put(clave, JSON.stringify(resultado), SEGUNDOS_RECORDAR_ENVIO);
      apuntarEnviadoPermanente(id);
    }
    return conVersion(resultado);
  } finally {
    candado.releaseLock();
  }
}

function conVersion(r) {
  if (r && typeof r === 'object') r.version = VERSION_SCRIPT;
  return r;
}

function enviarCorreo(cuerpo) {
  var esPrueba = !!cuerpo.prueba;
  var para = esPrueba ? '' : String(cuerpo.para || '').trim();
  var cco = esPrueba ? '' : String(cuerpo.cco || '').trim();
  var asunto = String(cuerpo.asunto || '(sin asunto)');
  var texto = String(cuerpo.cuerpo || '');

  if (esPrueba) para = miCorreo();
  /* Un grupo va siempre en copia oculta: si no hay nadie en "Para",
     Gmail necesita igualmente alguien ahí, y se pone la propia cuenta
     de quien ejecuta el script (mismo caso de siempre). */
  if (!para && cco) para = miCorreo();
  if (!para) return { ok: false, motivo: 'No hay ningún destinatario.' };

  var adjuntosPedidos = cuerpo.adjuntos || [];
  var attachments = [];
  var total = 0;
  for (var i = 0; i < adjuntosPedidos.length; i++) {
    var a = adjuntosPedidos[i] || {};
    if (!a.base64) continue;
    var bytes;
    try {
      bytes = Utilities.base64Decode(a.base64);
    } catch (e) {
      return { ok: false, motivo: 'Un documento no se ha podido leer.' };
    }
    total += bytes.length;
    if (total > MAX_BYTES_ENVIO) return { ok: false, motivo: 'Los documentos pesan más de 20 MB.' };
    attachments.push(Utilities.newBlob(bytes, a.tipo || 'application/octet-stream', a.nombre || ('adjunto ' + (i + 1))));
  }

  var opciones = { attachments: attachments };
  if (cco) opciones.bcc = cco;

  var hiloId = String(cuerpo.hilo || '').trim();
  var hilo = hiloId ? hiloParaResponder(hiloId, para, cco) : null;

  try {
    var mensaje;
    if (hilo) {
      mensaje = hilo.createDraftReply(texto, opciones).send();
    } else {
      mensaje = GmailApp.createDraft(para, asunto, texto, opciones).send();
    }
    return { ok: true, hilo: mensaje.getThread().getId(), matricula: matricula(mensaje) };
  } catch (err) {
    return { ok: false, motivo: 'Gmail no ha podido enviarlo: ' + (err && err.message ? err.message : err) };
  }
}

/* Solo se responde DENTRO del hilo cuando todas las direcciones que se
   piden (Para + Copia oculta) ya han recibido algún mensaje de ese
   hilo: si el hilo existe pero se le añade alguien nuevo de golpe,
   mejor un correo nuevo que mezclar destinatarios sin que nadie lo
   haya decidido. */
function hiloParaResponder(hiloId, para, cco) {
  var hilo;
  try { hilo = GmailApp.getThreadById(hiloId); } catch (e) { return null; }
  if (!hilo) return null;
  var yaEnHilo = direccionesDelHilo(hilo.getMessages());
  var pedidas = todasLasDirecciones(para + ',' + cco);
  if (!pedidas.length) return null;
  var todasDentro = pedidas.every(function (d) { return yaEnHilo.indexOf(d) !== -1; });
  return todasDentro ? hilo : null;
}

function todasLasDirecciones(texto) {
  var vistas = {};
  var salida = [];
  String(texto || '').split(',').forEach(function (t) {
    var c = quien(t).correo;
    if (c && c.indexOf('@') !== -1 && !vistas[c]) { vistas[c] = true; salida.push(c); }
  });
  return salida;
}

/* ---------- mandar documentos por correo (16-sep-2026, sin uso) ----------

   docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md. Sustituido por doPost, más
   arriba (fila 115, 24-sep-2026): la carpeta intermedia y la revisión
   cada minuto no funcionaban de fiar (los encargos se quedaban sin
   recoger). Se deja esta función tal cual, sin llamarla desde
   recogerCorreos, por si quedara algún encargo `.envio.json` antiguo
   suelto en la bandeja de alguien: ejecutarla a mano lo rescata. */

function mandarBorradores() {
  var carpeta = carpetaBandeja();
  var encontrados = carpeta.getFilesByType('application/json');
  var encargos = [];
  while (encontrados.hasNext()) {
    var f = encontrados.next();
    if (/\.envio\.json$/i.test(f.getName())) encargos.push(f);
    if (encargos.length >= MAX_ENCARGOS_POR_VUELTA) break;
  }
  for (var i = 0; i < encargos.length; i++) {
    mandarUnBorrador(encargos[i], carpeta);
  }
}

function mandarUnBorrador(fichero, carpeta) {
  var encargo = null;
  try {
    encargo = JSON.parse(fichero.getBlob().getDataAsString());
    var adjuntos = [];
    for (var i = 0; i < (encargo.adjuntos || []).length; i++) {
      var buscados = carpeta.getFilesByName(encargo.adjuntos[i]);
      if (buscados.hasNext()) adjuntos.push(buscados.next().getBlob());
    }

    var opciones = { attachments: adjuntos };
    if (encargo.cco) opciones.bcc = encargo.cco;

    var hilo = encargo.hilo ? GmailApp.getThreadById(encargo.hilo) : null;
    if (hilo) {
      hilo.createDraftReply(encargo.cuerpo || '', opciones);
    } else {
      var destinatario = encargo.para || (encargo.cco ? miCorreo() : '');
      GmailApp.createDraft(destinatario, encargo.asunto || '', encargo.cuerpo || '', opciones);
    }

    borrarFicherosDelEncargo(carpeta, encargo, fichero);
    carpeta.createFile(encargo.id + '.listo.json',
      JSON.stringify({ id: encargo.id, hecho: ahora(), enlace: enlaceABorradores() }, null, 2),
      'application/json');
  } catch (e) {
    Logger.log('No he podido mandar el borrador de "' + fichero.getName() + '": ' + e.message);
    if (encargo && encargo.id) {
      try { borrarFicherosDelEncargo(carpeta, encargo, fichero); } catch (e2) { /* al menos que quede el aviso */ }
      carpeta.createFile(encargo.id + '.error.json',
        JSON.stringify({ id: encargo.id, motivo: String(e.message || e) }, null, 2),
        'application/json');
    }
  }
}

/* Un encargo roto no puede repetirse cada minuto para siempre: se
   borran sus copias y el propio .envio.json, haya salido bien o mal. */
function borrarFicherosDelEncargo(carpeta, encargo, fichero) {
  for (var i = 0; i < (encargo.adjuntos || []).length; i++) {
    var buscados = carpeta.getFilesByName(encargo.adjuntos[i]);
    while (buscados.hasNext()) buscados.next().setTrashed(true);
  }
  fichero.setTrashed(true);
}

/* La lista de borradores, sin más: el borrador recién hecho sale el
   primero. No se inventa una dirección con el identificador del propio
   borrador: es exactamente el error que ya dio #all/<id de hilo> y que
   costó dos sesiones arreglar (ver enlaceAlHilo, más abajo). */
function enlaceABorradores() {
  return 'https://mail.google.com/mail/u/?authuser=' +
    encodeURIComponent(miCorreo()) + '#drafts';
}

/* ---------- el enlace que abre el correo en Gmail ----------

   El identificador del hilo no vale para esto: la dirección
   #all/<identificador> hace que Gmail conteste "la conversación que
   has solicitado no se ha podido cargar".

   Lo que sí abre siempre la conversación es buscarla por el
   identificador que el propio correo lleva escrito en su cabecera, el
   Message-ID, con el buscador de Gmail: #search/rfc822msgid:<id>.

   Si un correo no trajera esa cabecera, se usa el de antes. */
function enlaceAlHilo(hilo, primero) {
  var quienSoy = 'https://mail.google.com/mail/u/?authuser=' +
                 encodeURIComponent(miCorreo());
  try {
    var cabecera = String(primero.getHeader('Message-ID') || '').replace(/[<>]/g, '').trim();
    if (cabecera) return quienSoy + '#search/rfc822msgid:' + encodeURIComponent(cabecera);
  } catch (e) { /* sin cabecera: se sigue con el del hilo */ }
  return quienSoy + '#all/' + hilo.getId();
}

/* ---------- piezas ---------- */

function etiqueta(nombre) {
  return GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre);
}

/* 24-sep-2026: la carpeta puede estar dentro de otra (en el Drive de
   Francisco vive en «APP GESTION ASUNTOS/GESTOR-BANDEJA»). Antes solo se
   buscaba en la raíz de «Mi unidad», y los encargos de borrador se
   quedaban sin recoger. Ahora: primero la raíz; si no, la busca en todo
   el Drive (sin papelera, propia antes que compartida); y solo si no
   existe en ningún sitio, la crea en la raíz. */
function carpetaBandeja() {
  var enRaiz = DriveApp.getRootFolder().getFoldersByName(CARPETA);
  if (enRaiz.hasNext()) return enRaiz.next();

  var yo = miCorreo();
  var ajena = null;
  var todas = DriveApp.getFoldersByName(CARPETA);
  while (todas.hasNext()) {
    var c = todas.next();
    if (c.isTrashed()) continue;
    var dueno = c.getOwner();
    if (dueno && dueno.getEmail() === yo) return c;
    if (!ajena) ajena = c;
  }
  if (ajena) return ajena;

  return DriveApp.getRootFolder().createFolder(CARPETA);
}

/* La cuenta propia: la que ejecuta el script («Ejecutar como: Yo»).
   getActiveUser() llega vacía cuando la aplicación web se llama con
   acceso «Cualquier usuario» (fila 117). */
function miCorreo() {
  var correo = '';
  try { correo = Session.getEffectiveUser().getEmail() || ''; } catch (e) { correo = ''; }
  if (!correo) {
    try { correo = Session.getActiveUser().getEmail() || ''; } catch (e) { correo = ''; }
  }
  return correo;
}

function ahora() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

function soloFecha(fecha) {
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/* "Ana Pérez <ana@correo.es>" -> { nombre: 'Ana Pérez', correo: 'ana@correo.es' } */
function quien(texto) {
  var t = String(texto || '');
  var m = t.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { nombre: m[1].trim(), correo: m[2].trim().toLowerCase() };
  return { nombre: '', correo: t.trim().toLowerCase() };
}

/* Todas las direcciones que aparecen en el hilo, sin repetir y sin la
   tuya. Con ellas el Gestor busca al alumno en el RegAlum, y doPost
   decide si un envío puede responder dentro del hilo. */
function direccionesDelHilo(mensajes) {
  var mia = String(miCorreo() || '').toLowerCase();
  var vistas = {};
  var salida = [];
  for (var i = 0; i < mensajes.length; i++) {
    var todo = [mensajes[i].getFrom(), mensajes[i].getTo(), mensajes[i].getCc()].join(',');
    var trozos = todo.split(',');
    for (var j = 0; j < trozos.length; j++) {
      var c = quien(trozos[j]).correo;
      if (!c || c.indexOf('@') === -1) continue;
      if (c === mia || vistas[c]) continue;
      vistas[c] = true;
      salida.push(c);
    }
  }
  return salida;
}

function recortar(texto, tope) {
  var t = String(texto || '').replace(/\r/g, '').trim();
  return t.length > tope ? t.slice(0, tope) + '…' : t;
}

/* El Message-ID de un mensaje, sin los signos `<` `>`: el mismo en
   todos los buzones por los que pasa (docs/CORREO-EN-DOS-BUZONES.md).
   Cadena vacía si el mensaje no lo trae. */
function matricula(mensaje) {
  try {
    return String(mensaje.getHeader('Message-ID') || '').replace(/[<>]/g, '').trim().toLowerCase();
  } catch (e) {
    return '';
  }
}

function escapar(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* El hilo entero en un PDF sencillo: cabecera de cada mensaje y su texto. */
function hiloEnPdf(hilo, mensajes) {
  var html = '<meta charset="utf-8">' +
    '<div style="font-family:Arial,sans-serif;font-size:12px;color:#1b2430">' +
    '<h2 style="margin:0 0 12px">' + escapar(hilo.getFirstMessageSubject()) + '</h2>';
  for (var i = 0; i < mensajes.length; i++) {
    var m = mensajes[i];
    html += '<div style="border-top:1px solid #dde3ea;padding:10px 0">' +
      '<div style="color:#5d6b7a"><strong>De:</strong> ' + escapar(m.getFrom()) + '<br>' +
      '<strong>Para:</strong> ' + escapar(m.getTo()) + '<br>' +
      '<strong>Fecha:</strong> ' + escapar(m.getDate()) + '</div>' +
      '<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:12px">' +
      escapar(m.getPlainBody()) + '</pre></div>';
  }
  html += '</div>';
  var nombre = hilo.getId() + ' - correo.pdf';
  return Utilities.newBlob(html, 'text/html', nombre).getAs('application/pdf').setName(nombre);
}

/* Un solo mensaje en PDF: el último del hilo, el que acaba de llegar
   (o el que se acaba de mandar). Dentro de la carpeta del asunto entra
   como "AAMMDD CORREO <asunto>.pdf". */
function mensajeEnPdf(hilo, mensaje, numero) {
  var html = '<meta charset="utf-8">' +
    '<div style="font-family:Arial,sans-serif;font-size:12px;color:#1b2430">' +
    '<h2 style="margin:0 0 12px">' + escapar(hilo.getFirstMessageSubject()) + '</h2>' +
    '<div style="color:#5d6b7a"><strong>De:</strong> ' + escapar(mensaje.getFrom()) + '<br>' +
    '<strong>Para:</strong> ' + escapar(mensaje.getTo()) + '<br>' +
    '<strong>Fecha:</strong> ' + escapar(mensaje.getDate()) + '</div>' +
    '<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:12px">' +
    escapar(mensaje.getPlainBody()) + '</pre></div>';
  var nombre = hilo.getId() + ' - mensaje ' + numero + '.pdf';
  return Utilities.newBlob(html, 'text/html', nombre).getAs('application/pdf').setName(nombre);
}
