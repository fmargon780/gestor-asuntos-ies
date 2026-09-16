/* PARA ACTUALIZARLO: abre https://script.google.com, proyecto
   "Gestor - Correos", borra todo el contenido del fichero de código y
   pega este entero. Guarda y ejecuta una vez prepararTodo().

   ============================================================
   Gestor de Asuntos — recogida de correos
   Google Apps Script, en la cuenta g.educaand.es

   ESTE FICHERO NO SE EJECUTA DESDE LA WEB. Es una copia de lo que hay
   pegado en script.google.com. Si se cambia aquí, hay que volver a
   pegarlo allí: el repositorio no lo despliega.

   Qué hace, cada minuto:

   0. Antes que nada, mira si el Gestor ha dejado algún encargo de
      borrador (`<id>.envio.json`) en GESTOR-BANDEJA. De cada uno monta
      un BORRADOR en Gmail con sus documentos adjuntados —dentro del
      hilo del asunto si lo tiene—, borra el encargo y contesta con
      `<id>.listo.json`. Nunca envía nada: enviar, lo envía Francisco.
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
  var carpeta = carpetaBandeja();

  /* Lo primero, los borradores que ha encargado el Gestor: es lo que
     tiene a alguien esperando delante de la pantalla. */
  mandarBorradores(carpeta);

  var pendiente = etiqueta(ETIQUETA);
  var hecho = etiqueta(ETIQUETA_HECHO);
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

/* ---------- los borradores con documentos ----------

   El Gestor de Asuntos no puede enganchar ficheros a un correo: Gmail
   no deja. Lo que hace es dejar en GESTOR-BANDEJA una copia de cada
   documento y, AL FINAL, el encargo:

     <id>.envio.json
     { id, creado, para, asunto, cuerpo, adjuntos: [...], hilo,
       asuntoCarpeta }

   Aquí se monta con eso un BORRADOR en Gmail. Si `hilo` trae algo y el
   hilo todavía existe, el borrador es una respuesta dentro de esa misma
   conversación; si no, uno nuevo. Nunca se envía: enviar, lo envía él.

   Después se borran de la carpeta el encargo y sus copias, y se deja la
   contestación: `<id>.listo.json` con el enlace a los borradores, o
   `<id>.error.json` con el motivo en una línea. En los dos casos los
   ficheros del encargo desaparecen: un encargo roto no puede repetirse
   cada minuto para siempre.

   Si no hay encargos, esto no hace nada y no se queja. */

function mandarBorradores(carpeta) {
  var encargos = ficherosDeEncargo(carpeta);
  for (var i = 0; i < encargos.length; i++) {
    var fichero = encargos[i];
    var id = String(fichero.getName()).replace(/\.envio\.json$/, '');
    var encargo = null;
    try {
      encargo = JSON.parse(fichero.getBlob().getDataAsString());
    } catch (e) {
      limpiarEncargo(carpeta, id);
      contestar(carpeta, id + '.error.json',
                { id: id, motivo: unaLinea('El encargo no se puede leer: ' + e.message) });
      continue;
    }
    try {
      crearBorrador(encargo, blobsDelEncargo(carpeta, encargo.adjuntos));
      limpiarEncargo(carpeta, id);
      contestar(carpeta, id + '.listo.json',
                { id: id, hecho: ahora(), enlace: enlaceALosBorradores() });
    } catch (e2) {
      limpiarEncargo(carpeta, id);
      contestar(carpeta, id + '.error.json', { id: id, motivo: unaLinea(e2.message) });
    }
  }
}

function ficherosDeEncargo(carpeta) {
  var salida = [];
  try {
    var todos = carpeta.getFiles();
    while (todos.hasNext()) {
      var f = todos.next();
      if (/\.envio\.json$/.test(f.getName())) salida.push(f);
    }
  } catch (e) {
    Logger.log('No he podido mirar los encargos: ' + e.message);
  }
  return salida;
}

/* Los documentos del encargo, tal y como los dejó el Gestor. Al
   adjuntarlos se les quita el "<id> - " de delante, que solo servía
   para no mezclarlos con los de otro encargo. */
function blobsDelEncargo(carpeta, nombres) {
  var salida = [];
  var lista = nombres || [];
  for (var i = 0; i < lista.length; i++) {
    var busca = carpeta.getFilesByName(lista[i]);
    if (!busca.hasNext()) throw new Error('Falta el documento "' + lista[i] + '".');
    var blob = busca.next().getBlob();
    blob.setName(String(lista[i]).replace(/^envio-[0-9-]+ - /, ''));
    salida.push(blob);
  }
  return salida;
}

function crearBorrador(encargo, adjuntos) {
  var opciones = adjuntos.length ? { attachments: adjuntos } : {};
  var cuerpo = String(encargo.cuerpo || '');

  if (encargo.hilo) {
    var hilo = null;
    try { hilo = GmailApp.getThreadById(encargo.hilo); } catch (e) { hilo = null; }
    if (hilo) return hilo.createDraftReply(cuerpo, opciones);
  }
  return GmailApp.createDraft(String(encargo.para || ''),
                              String(encargo.asunto || ''), cuerpo, opciones);
}

/* El enlace es la lista de borradores, sin más: el recién hecho sale el
   primero. NO se inventa una dirección con el identificador del
   borrador: es exactamente el error que ya dio #all/<id de hilo>. */
function enlaceALosBorradores() {
  return 'https://mail.google.com/mail/u/?authuser=' +
         encodeURIComponent(Session.getActiveUser().getEmail()) + '#drafts';
}

function limpiarEncargo(carpeta, id) {
  try {
    var todos = carpeta.getFiles();
    var fuera = [];
    while (todos.hasNext()) {
      var f = todos.next();
      var n = f.getName();
      if (n === id + '.envio.json' || n.indexOf(id + ' - ') === 0) fuera.push(f);
    }
    for (var i = 0; i < fuera.length; i++) fuera[i].setTrashed(true);
  } catch (e) { /* si no se puede limpiar, se sigue */ }
}

function contestar(carpeta, nombre, datos) {
  try {
    carpeta.createFile(nombre, JSON.stringify(datos, null, 2), 'application/json');
  } catch (e) {
    Logger.log('No he podido contestar con ' + nombre + ': ' + e.message);
  }
}

function unaLinea(texto) {
  var t = String(texto || 'No se sabe qué ha pasado.').replace(/\s+/g, ' ').trim();
  return t.length > 200 ? t.slice(0, 200) + '…' : t;
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
      var hilo = GmailApp.getThreadById(s.id);
      if (!hilo) continue;                       /* hilo borrado: se salta */
      var cuantosMensajes = hilo.getMessageCount();
      var visto = parseInt(s.visto, 10) || 0;
      if (cuantosMensajes <= visto) continue;    /* nada nuevo */
      guardarHilo(hilo, carpeta, s.id);
    } catch (e) {
      Logger.log('El hilo seguido ' + s.id + ' no se ha podido mirar: ' + e.message);
    }
  }
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
