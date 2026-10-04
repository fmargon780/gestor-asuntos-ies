/* ============================================================
   soporte.gs — el buzón de soporte de las apps de Francisco
   (fila 213 de la cola, docs/BOTON-DE-SOPORTE.md).

   PARA ACTUALIZARLO: abre https://script.google.com, proyecto
   "Gestor - Soporte", borra todo el contenido del fichero de código y
   pega este entero. Guarda. Los pasos de la primera vez están en
   docs/PONER-EN-MARCHA-SOPORTE.md.

   Qué hace: el botón «Soporte» del Gestor de Asuntos (js/soporte.js)
   manda aquí, con un POST de texto plano (así el navegador no hace la
   pregunta previa de CORS y funciona igual desde la web que desde la
   copia sin internet), un aviso de error o de mejora. Aquí:

   1. Se comprueba que viene de un repositorio permitido y que los
      datos son razonables.
   2. Se guarda el aviso ENTERO en Drive, en SOPORTE-AVISOS / <app> /:
      un fichero de texto con todo lo recibido y, si la hay, la captura.
      Nada de esto va a GitHub.
   3. Se apunta una fila IDEA en docs/COLA.md del repositorio de la app,
      con la API de GitHub. La fila NO lleva el texto del usuario ni la
      captura (el repositorio es público): solo el tipo, la pantalla y
      el enlace a Drive, que solo abre quien tenga permiso en la carpeta.

   El permiso de GitHub va en las propiedades del script
   (GITHUB_TOKEN), nunca en este código.

   Si el aviso llega a Drive pero GitHub falla, la respuesta es igual
   de buena (ok: true) con colaApuntada: false: el aviso no se pierde,
   solo no sale todavía en el Centro de mando. Desde la fila 261, en ese
   caso además se manda un correo al dueño del script (con el enlace al
   aviso, nunca con su texto), como mucho uno por repositorio y día.

   La fila IDEA se escribe en la forma de la cola de cada app: tabla de
   tres columnas (Gestor), de cuatro (con Notas) o apartados «## N. …».
   ============================================================ */

var VERSION_SCRIPT = '4-oct-2026 · fila 262';

/* Los repositorios que pueden mandar avisos (fila 261: todas las apps de
   Francisco). Que uno esté aquí no hace nada por sí solo: hasta que esa app
   tenga su botón, no manda avisos. Lo que venga de otro se rechaza. */
var REPOS_PERMITIDOS = [
  'fmargon780/gestor-asuntos-ies',
  'fmargon780/bd-alumnado-ies',
  'fmargon780/ausencias-guardias-ies',
  'fmargon780/normativa-escolarizacion',
  'fmargon780/migracion-dropbox-drive',
  'fmargon780/Disciplina-IES',
  'fmargon780/club-tolox-corre',
  'fmargon780/comparador-listas',
  'fmargon780/Partituras-de-Caja-Clara',
  'fmargon780/Cancionero-Parroquia',
  'fmargon780/Parroquia_Conteo_Colectas',
  'fmargon780/ERP-Nutricion',
  'fmargon780/Focus_Lingo'
];

var CARPETA_RAIZ = 'SOPORTE-AVISOS';
var FICHERO_COLA = 'docs/COLA.md';
var RAMA_COLA = 'main';
var MAX_CUERPO = 6000000;      /* caracteres del POST entero */
var MAX_CAPTURA = 5000000;     /* caracteres de la captura en base64 */
var MAX_ERRORES = 6000;
var INTENTOS_COLA = 3;
var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* ---------- la entrada ---------- */

function doGet() {
  return respuesta({ ok: true, servicio: 'soporte', version: VERSION_SCRIPT });
}

function doPost(e) {
  try {
    var contenido = (e && e.postData && e.postData.contents) || '';
    if (!contenido) return respuesta({ ok: false, motivo: 'No ha llegado nada.' });
    if (contenido.length > MAX_CUERPO) {
      return respuesta({ ok: false, motivo: 'El aviso es demasiado grande (el texto y la captura juntos). Prueba sin la captura o acórtalo un poco.' });
    }
    var datos;
    try { datos = JSON.parse(contenido); }
    catch (err) { return respuesta({ ok: false, motivo: 'El aviso llegó estropeado.' }); }

    normalizar(datos);
    var fallo = validar(datos);
    if (fallo) return respuesta({ ok: false, motivo: fallo });

    var guardado;
    try { guardado = guardarEnDrive(datos); }
    catch (err) {
      return respuesta({ ok: false, motivo: 'No he podido guardarlo en Drive: ' + textoDe(err) });
    }

    var cola = { ok: false };
    try { cola = apuntarEnCola(datos, guardado.enlace); }
    catch (err) { cola = { ok: false, motivo: textoDe(err) }; }
    if (!cola.ok) avisarPorCorreo(datos, guardado.enlace, cola.motivo);

    return respuesta({
      ok: true,
      version: VERSION_SCRIPT,
      colaApuntada: !!cola.ok,
      fila: cola.ok ? cola.numero : null
    });
  } catch (err) {
    return respuesta({ ok: false, motivo: 'Fallo del buzón: ' + textoDe(err) });
  }
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

function textoDe(err) {
  return String((err && err.message) || err || 'error desconocido').slice(0, 300);
}

/* ---------- validar ---------- */

/* Fila 261: lo que otras apps mandan de otra forma. `captura` puede venir
   con el principio `data:image/…;base64,` (se quita; si no es JPEG se
   guarda con su extensión y su tipo) y `errores` como lista (se junta,
   una línea por error). */
function normalizar(d) {
  if (!d || typeof d !== 'object') return;
  d.capturaTipo = 'image/jpeg';
  d.capturaExt = 'jpg';
  if (typeof d.captura === 'string') {
    var m = /^data:image\/([A-Za-z0-9.+-]+);base64,/.exec(d.captura);
    if (m) {
      var sub = m[1].toLowerCase();
      d.captura = d.captura.slice(m[0].length);
      if (sub !== 'jpeg' && sub !== 'jpg') {
        d.capturaTipo = 'image/' + sub;
        d.capturaExt = sub.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'img';
      }
    }
  }
  if (Array.isArray(d.errores)) {
    d.errores = d.errores.map(function (x) { return typeof x === 'string' ? x : JSON.stringify(x); }).join('\n');
  }
}

function cadena(v, max) {
  return (typeof v === 'string') ? v.slice(0, max) : '';
}

function validar(d) {
  if (!d || typeof d !== 'object') return 'El aviso llegó vacío.';
  if (REPOS_PERMITIDOS.indexOf(d.repo) === -1) return 'Este repositorio no puede mandar avisos.';
  if (d.tipo !== 'error' && d.tipo !== 'mejora') return 'Falta decir si es un error o una mejora.';
  if (typeof d.texto !== 'string' || !d.texto.trim()) return 'Falta el texto del aviso.';
  if (typeof d.app !== 'string' || !d.app.trim()) return 'Falta el nombre de la app.';
  if (d.captura !== undefined && d.captura !== null && d.captura !== '') {
    if (typeof d.captura !== 'string' || d.captura.length > MAX_CAPTURA) return 'La captura es demasiado grande.';
    if (!/^[A-Za-z0-9+\/=\r\n]+$/.test(d.captura)) return 'La captura no es una imagen válida.';
  }
  return '';
}

/* ---------- Drive ---------- */

function limpiarNombre(s) {
  var t = String(s || '').replace(/[\\\/:*?"<>|\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.slice(0, 60) || 'sin nombre';
}

function carpetaHija(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

function carpetaRaiz() {
  var it = DriveApp.getFoldersByName(CARPETA_RAIZ);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_RAIZ);
}

function marcaDeTiempo() {
  return Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd HHmmss');
}

function guardarEnDrive(d) {
  var carpeta = carpetaHija(carpetaRaiz(), limpiarNombre(d.app));
  var base = marcaDeTiempo() + ' ' + d.tipo;
  var lineas = [
    'Aviso de usuario (' + (d.tipo === 'error' ? 'algo no funciona' : 'propuesta de mejora') + ')',
    '',
    'App: ' + cadena(d.app, 100),
    'Repositorio: ' + cadena(d.repo, 100),
    'Pantalla: ' + cadena(d.pantalla, 120),
    'Quién lo envía: ' + cadena(d.quien, 120),
    'Fecha: ' + cadena(d.fecha, 60),
    'Versión de la app: ' + cadena(d.version, 60),
    '',
    'Texto:',
    d.texto
  ];
  if (d.errores) { lineas.push('', 'Últimos errores de la consola:', cadena(d.errores, MAX_ERRORES)); }
  var tieneCaptura = !!d.captura;
  var extCaptura = d.capturaExt || 'jpg';
  if (tieneCaptura) lineas.push('', 'Captura: ' + base + '.' + extCaptura + ' (en esta misma carpeta)');
  var fichero = carpeta.createFile(base + '.txt', lineas.join('\n'), 'text/plain');
  if (tieneCaptura) {
    var bytes = Utilities.base64Decode(d.captura.replace(/\s+/g, ''));
    carpeta.createFile(Utilities.newBlob(bytes, d.capturaTipo || 'image/jpeg', base + '.' + extCaptura));
  }
  return { enlace: fichero.getUrl(), carpeta: carpeta.getUrl() };
}

/* ---------- la fila IDEA en docs/COLA.md ---------- */

function llamarGitHub(metodo, url, cuerpo) {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Falta GITHUB_TOKEN en las propiedades del script.');
  var p = {
    method: metodo,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gestor-soporte'
    }
  };
  if (cuerpo) {
    p.contentType = 'application/json';
    p.payload = JSON.stringify(cuerpo);
  }
  var r = UrlFetchApp.fetch(url, p);
  var codigo = r.getResponseCode();
  var texto = r.getContentText();
  var json = null;
  try { json = JSON.parse(texto); } catch (err) { json = null; }
  return { codigo: codigo, json: json };
}

function peticionGitHub(metodo, repo, opciones) {
  var url = 'https://api.github.com/repos/' + repo + '/contents/' + FICHERO_COLA +
            (metodo === 'get' ? '?ref=' + RAMA_COLA : '');
  return llamarGitHub(metodo, url, opciones && opciones.cuerpo);
}

/* El número siguiente al más alto de la cola, mirando las filas de la
   tabla y los apartados «## N. Título». */
function siguienteNumero(cola) {
  var max = 0;
  var re = /^(?:\|\s*|##\s+)(\d+)\s*(?:\||\.)/gm;
  var m;
  while ((m = re.exec(cola)) !== null) {
    var n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max + 1;
}

/* La pantalla es lo único "libre" que entra en la fila: se deja en
   letras, números y unos pocos signos, y corta. Nunca lleva el texto
   del usuario. */
function pantallaLimpia(p) {
  var t = String(p || '').replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ·\-.,()]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.slice(0, 50) || 'pantalla sin nombre';
}

function fechaCorta() {
  var f = Utilities.formatDate(new Date(), 'Europe/Madrid', 'd-M-yyyy').split('-');
  return f[0] + '-' + MESES[parseInt(f[1], 10) - 1] + '-' + f[2];
}

/* La forma de la cola (fila 261): cuántas columnas tiene la tabla donde
   están las filas numeradas (3 o 4), o 'apartados' si no hay tabla. Se
   mira la línea de guiones de la cabecera de esa tabla. */
function formaDeLaCola(cola) {
  var lineas = cola.split('\n');
  var ultima = -1;
  for (var i = 0; i < lineas.length; i++) {
    if (/^\|\s*\d+\s*\|/.test(lineas[i])) ultima = i;
  }
  if (ultima === -1) {
    return /^##\s+\d+\./m.test(cola) ? { forma: 'apartados' } : { forma: '' };
  }
  for (var j = ultima; j >= 0; j--) {
    if (/^\|[\s:|-]+\|\s*$/.test(lineas[j]) && lineas[j].indexOf('---') !== -1) {
      return { forma: 'tabla', columnas: lineas[j].trim().split('|').length - 2, ultima: ultima };
    }
  }
  return { forma: '' };
}

function filaDeCola(numero, d, enlace, columnas) {
  var que = (d.tipo === 'error') ? 'error' : 'mejora';
  var titulo = 'Aviso de usuario: ' + que + ' en «' + pantallaLimpia(d.pantalla) + '»';
  var nota = 'enviada por un usuario desde el botón de soporte · aviso completo: ' + enlace;
  if (columnas === 4) {
    return '| ' + numero + ' | ' + titulo + ' | IDEA (' + fechaCorta() + ') | ' +
           'Enviada por un usuario desde el botón de soporte · aviso completo: ' + enlace + ' |';
  }
  return '| ' + numero + ' | ' + titulo + ' | IDEA (' + fechaCorta() + '): ' + nota + ' |';
}

/* Añade la fila justo después de la última fila de la tabla, o, en una
   cola de apartados, un apartado nuevo al final. */
function meterFila(cola, numero, d, enlace) {
  var forma = formaDeLaCola(cola);
  if (forma.forma === 'tabla') {
    if (forma.columnas !== 3 && forma.columnas !== 4) throw new Error('No entiendo la tabla de la cola.');
    var lineas = cola.split('\n');
    lineas.splice(forma.ultima + 1, 0, filaDeCola(numero, d, enlace, forma.columnas));
    return lineas.join('\n');
  }
  if (forma.forma === 'apartados') {
    var que = (d.tipo === 'error') ? 'error' : 'mejora';
    return cola.replace(/\s*$/, '') + '\n\n## ' + numero + '. Aviso de usuario: ' + que + ' en «' +
      pantallaLimpia(d.pantalla) + '» — IDEA (' + fechaCorta() + ')\n\n' +
      'Enviada por un usuario desde el botón de soporte · aviso completo: ' + enlace + '\n';
  }
  throw new Error('No encuentro la cola.');
}

function apuntarEnCola(d, enlace) {
  var ultimoMotivo = '';
  for (var intento = 1; intento <= INTENTOS_COLA; intento++) {
    var leida = peticionGitHub('get', d.repo);
    if (leida.codigo !== 200 || !leida.json || !leida.json.content) {
      throw new Error('No he podido leer la cola (' + leida.codigo + ').');
    }
    var actual = Utilities.newBlob(Utilities.base64Decode(leida.json.content.replace(/\s+/g, '')))
      .getDataAsString('UTF-8');
    var numero = siguienteNumero(actual);
    var nuevo = meterFila(actual, numero, d, enlace);
    var subida = peticionGitHub('put', d.repo, { cuerpo: {
      message: 'Fila ' + numero + ': aviso de usuario desde el botón de soporte',
      content: Utilities.base64Encode(nuevo, Utilities.Charset.UTF_8),
      sha: leida.json.sha,
      branch: RAMA_COLA
    } });
    if (subida.codigo === 200 || subida.codigo === 201) return { ok: true, numero: numero };
    ultimoMotivo = 'GitHub respondió ' + subida.codigo;
    /* 409 / 422: alguien tocó la cola entre medias. Se relee y se repite. */
    if (subida.codigo !== 409 && subida.codigo !== 422) break;
  }
  throw new Error(ultimoMotivo || 'No he podido apuntarlo en la cola.');
}

/* ---------- si no llega a la cola, un correo (fila 261) ---------- */

/* Como mucho uno por repositorio y día (se apunta en las propiedades del
   script). Lleva el motivo y el enlace al aviso, nunca su texto. */
function avisarPorCorreo(d, enlace, motivo) {
  try {
    var props = PropertiesService.getScriptProperties();
    var clave = 'CORREO_' + d.repo;
    var hoy = Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd');
    if (props.getProperty(clave) === hoy) return;
    var dueno = Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(dueno, 'Soporte: un aviso no ha llegado a la cola de ' + cadena(d.app, 60),
      'Ha llegado un aviso de ' + cadena(d.app, 100) + ' (' + d.repo + ') y se ha guardado en Drive, ' +
      'pero no se ha podido apuntar en su cola.\n\nMotivo: ' + cadena(motivo, 300) +
      '\n\nAviso en Drive: ' + enlace + '\n');
    props.setProperty(clave, hoy);
  } catch (err) { /* un correo que falla no estropea la respuesta */ }
}

/* ---------- la primera vez ---------- */

/* Se ejecuta a mano: crea la carpeta de avisos y comprueba, repositorio
   por repositorio, que el permiso de GitHub llega a su cola. Solo LEE las
   colas, no escribe. Al final, un resumen en el registro y por correo (el
   correo sirve para autorizar ese permiso). */
function prepararTodo() {
  var carpeta = carpetaRaiz();
  Logger.log('Carpeta de avisos lista: ' + carpeta.getUrl());
  var bien = 0, ojo = 0;
  REPOS_PERMITIDOS.forEach(function (repo) {
    var r = peticionGitHub('get', repo);
    if (r.codigo === 200) {
      var texto = '';
      try { texto = Utilities.newBlob(Utilities.base64Decode(r.json.content.replace(/\s+/g, ''))).getDataAsString('UTF-8'); } catch (err) { texto = ''; }
      bien++;
      Logger.log('Bien: ' + repo + ' (cola de ' + (siguienteNumero(texto) - 1) + ' filas)');
    } else if (r.codigo === 404) {
      var g = llamarGitHub('get', 'https://api.github.com/repos/' + repo);
      if (g.codigo === 200) {
        bien++;
        Logger.log('Sin cola: ' + repo + ' — el permiso llega, pero no tiene ' + FICHERO_COLA);
      } else {
        ojo++;
        Logger.log('OJO: ' + repo + ' — el permiso de GitHub no llega a este repositorio');
      }
    } else {
      ojo++;
      Logger.log('OJO: ' + repo + ' — el permiso de GitHub no llega a este repositorio (respondió ' + r.codigo + ')');
    }
  });
  var resumen = 'Resumen: ' + bien + ' bien, ' + ojo + ' con OJO, de ' + REPOS_PERMITIDOS.length + ' repositorios.';
  Logger.log(resumen);
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Soporte: prueba del buzón', resumen +
      '\n\nSi te llega este correo, el permiso de correo del buzón está autorizado.');
  } catch (err) { Logger.log('OJO: no he podido mandar el correo de prueba: ' + textoDe(err)); }
  return 'Versión del buzón: ' + VERSION_SCRIPT + ' · ' + resumen;
}
