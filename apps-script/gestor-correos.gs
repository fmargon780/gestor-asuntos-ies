/* ============================================================
   Gestor de Asuntos — recogida de correos
   Google Apps Script, en la cuenta g.educaand.es

   ESTE FICHERO NO SE EJECUTA DESDE LA WEB. Es una copia de lo que hay
   pegado en https://script.google.com, proyecto "Gestor - Correos".
   Si se cambia aquí, hay que volver a pegarlo allí.

   Qué hace, cada minuto:

   1. Manda los borradores pendientes (ver más abajo, "mandar
      documentos por correo").
   2. Mira los correos que tengan la etiqueta GESTOR.
   3. De cada uno guarda una ficha en la carpeta GESTOR-BANDEJA de
      Drive: remitente, fecha, asunto, texto y direcciones.
   4. Guarda también el hilo en PDF y sus documentos adjuntos.
   5. Le quita la etiqueta GESTOR y le pone GESTOR/Hecho, para no
      volver a recogerlo.

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
var MAX_POR_VUELTA = 20;
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
      guardarHilo(hilo, carpeta);
      hilo.removeLabel(pendiente);
      hilo.addLabel(hecho);
    } catch (e) {
      Logger.log('No he podido guardar "' + hilo.getFirstMessageSubject() + '": ' + e.message);
    }
  }
}

/* ---------- guardar un hilo ---------- */

function guardarHilo(hilo, carpeta) {
  var mensajes = hilo.getMessages();
  var primero = mensajes[0];
  var ultimo = mensajes[mensajes.length - 1];
  var id = hilo.getId();

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
    adjuntos: []
  };

  /* El hilo en PDF, para archivarlo dentro de la carpeta del asunto. */
  try {
    var pdf = carpeta.createFile(hiloEnPdf(hilo, mensajes));
    ficha.pdf = pdf.getName();
  } catch (e) {
    Logger.log('Sin PDF de "' + ficha.asunto + '": ' + e.message);
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
    if (cabecera) return quienSoy + '#search/rfc822msgid%3A' + encodeURIComponent(cabecera);
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
