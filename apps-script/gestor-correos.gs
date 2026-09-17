/* PARA ACTUALIZARLO: abre https://script.google.com, proyecto
   "Gestor - Correos", borra todo el contenido del fichero de código y
   pega este entero. Guarda y ejecuta una vez prepararTodo().

   17-sep-2026: guarda la matrícula (Message-ID) de cada mensaje, y
   sigue los hilos también por matrícula, no solo por identificador de
   hilo (docs/CORREO-EN-DOS-BUZONES.md, fila 18 de la cola). Si esta
   fecha no está en la copia pegada en script.google.com, está vieja.

   ============================================================
   Gestor de Asuntos — recogida de correos
   Google Apps Script, en la cuenta g.educaand.es

   ESTE FICHERO NO SE EJECUTA DESDE LA WEB. Es una copia de lo que hay
   pegado en script.google.com. Si se cambia aquí, hay que volver a
   pegarlo allí: el repositorio no lo despliega.

   Qué hace, cada minuto:

   1. Manda los borradores pendientes (ver más abajo, "mandar
      documentos por correo").
   2. Mira los correos que tengan la etiqueta GESTOR.
   3. De cada uno guarda una ficha en la carpeta GESTOR-BANDEJA de
      Drive: remitente, fecha, asunto, texto y direcciones.
   4. Guarda también el hilo en PDF y sus documentos adjuntos.
   5. Le quita la etiqueta GESTOR y le pone GESTOR/Hecho, para no
      volver a recogerlo.
   5. Y después lee seguidos.json, que escribe el Gestor de Asuntos con
      los hilos que ya están enganchados a un asunto. De esos hilos ya
      no hay etiqueta que valga: se miran uno por uno y, si han crecido,
      se recogen otra vez. Así entran las respuestas del tercero y
      también los correos que manda Francisco desde Gmail.

   El Gestor de Asuntos lee esa carpeta en js/bandeja-correos.js.
   Este script no crea carpetas de asuntos ni toca nada del centro.

   16-sep-2026, "mandar documentos por correo"
   (docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md): el Gestor no puede
   adjuntar ficheros a un correo desde el navegador, así que deja en
   esta misma carpeta una copia de cada documento marcado y un encargo,
   <id>.envio.json. mandarBorradores() los recoge, antes de recoger
   correos, y monta un BORRADOR en Gmail (nunca lo envía) con los
   adjuntos, respondiendo dentro del hilo si el encargo trae uno. Deja
   <id>.listo.json (con el enlace a los borradores) o <id>.error.json
   (con el motivo), y borra el .envio.json y las copias: un encargo no
   puede repetirse cada minuto para siempre.
   ============================================================ */

var ETIQUETA = 'GESTOR';
var ETIQUETA_HECHO = 'GESTOR/Hecho';
var CARPETA = 'GESTOR-BANDEJA';
var FICHERO_SEGUIDOS = 'seguidos.json';
var MAX_POR_VUELTA = 20;
var MAX_SEGUIDOS_POR_VUELTA = 40;
var MAX_LETRAS_TEXTO = 6000;
var MAX_ENCARGOS_POR_VUELTA = 20;

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
             ' preparada, y revisión cada minuto.');
}

/* ---------- la vuelta de cada minuto ---------- */

function recogerCorreos() {
  mandarBorradores();

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
  var mia = String(Session.getActiveUser().getEmail() || '').toLowerCase();

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

/* ---------- mandar documentos por correo ----------

   docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md, 16-sep-2026. El Gestor deja
   en GESTOR-BANDEJA las copias de los documentos marcados y un
   encargo, <id>.envio.json. Aquí se recogen, se monta el borrador (con
   los adjuntos, que Gmail sí deja poner desde Apps Script) y nunca se
   envía nada: siempre queda como borrador. */

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

    var hilo = encargo.hilo ? GmailApp.getThreadById(encargo.hilo) : null;
    if (hilo) {
      hilo.createDraftReply(encargo.cuerpo || '', { attachments: adjuntos });
    } else {
      GmailApp.createDraft(encargo.para || '', encargo.asunto || '', encargo.cuerpo || '',
        { attachments: adjuntos });
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
    encodeURIComponent(Session.getActiveUser().getEmail()) + '#drafts';
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
                 encodeURIComponent(Session.getActiveUser().getEmail());
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

function carpetaBandeja() {
  var busca = DriveApp.getRootFolder().getFoldersByName(CARPETA);
  return busca.hasNext() ? busca.next() : DriveApp.getRootFolder().createFolder(CARPETA);
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
   tuya. Con ellas el Gestor busca al alumno en el RegAlum. */
function direccionesDelHilo(mensajes) {
  var mia = String(Session.getActiveUser().getEmail() || '').toLowerCase();
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
