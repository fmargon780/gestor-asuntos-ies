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

   Fila 268 (docs/VIGILANTE-Y-CORREOS.md): además, el VIGILANTE (al final de
   este fichero). Una función, `vigilar`, que un disparador ejecuta cada
   diez minutos: mira las colas de todos los proyectos, manda correos a
   Francisco cuando algo le obliga a hacer algo, comprueba que cada app
   abre, contesta por correo a quien envió un aviso cuando queda resuelto
   y deja el fichero ESTADO-VIGILANTE.json para el Centro de mando.
   ============================================================ */

var VERSION_SCRIPT = '6-oct-2026 · fila 268';

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
    vigilanteAvisoNuevo(datos, guardado.enlace, cola);

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
  /* Fila 268: el correo de quien avisa es opcional. Con mala forma se trata
     como vacío; nunca se rechaza un aviso por esto. */
  d.correo = correoValido(d.correo);
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
    'Quién lo envía: ' + cadena(d.quien, 120)
  ].concat(d.correo ? ['Correo: ' + d.correo] : []).concat([
    'Fecha: ' + cadena(d.fecha, 60),
    'Versión de la app: ' + cadena(d.version, 60),
    '',
    'Texto:',
    d.texto
  ]);
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
  var vigilante = prepararVigilante();
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Soporte: prueba del buzón', resumen +
      '\n\nSi te llega este correo, el permiso de correo del buzón está autorizado.' + vigilante);
  } catch (err) { Logger.log('OJO: no he podido mandar el correo de prueba: ' + textoDe(err)); }
  return 'Versión del buzón: ' + VERSION_SCRIPT + ' · ' + resumen;
}


/* ============================================================
   EL VIGILANTE (fila 268, docs/VIGILANTE-Y-CORREOS.md)
   ============================================================ */

var CENTRO_DE_MANDO = 'https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E';
var PROPIETARIO = 'fmargon780';
var CADA_MINUTOS = 10;
var PARADA_MINUTOS = 90;            /* una fila EN CURSO sin pasos en este tiempo está a medias */
var SILENCIO_DESDE = 23;            /* de 23:00 a 7:00, hora de Madrid, no sale ningún correo */
var SILENCIO_HASTA = 7;
var RELEER_CADA_HORAS = 6;          /* lista de repositorios y direcciones de las apps */
var QUIETO_DIAS = 14;               /* un proyecto sin cambios en tantos días se mira una vez por hora */
var GUARDAR_DIAS = 60;
var CARPETA_VIGILANTE = '_VIGILANTE';
var FICHERO_MEMORIA = 'memoria.json';
var FICHERO_ESTADO = 'ESTADO-VIGILANTE.json';
/* Lo que Vercel deja como «fallo» y no lo es: el proyecto se salta a propósito la
   publicación, o se ha acabado el tope diario de la cuenta. */
var NO_ES_FALLO = /ignored build|canceled by ignored|resource is limited|rate limit|limit(ed)? reached|exceeded|too many deployments/i;
/* La página de error que da Google cuando un script de Apps Script falla. */
var PAGINA_DE_ERROR_DE_GOOGLE = /Script function not found|No se ha podido abrir el archivo|Se ha producido un error|Error \(TypeError|Exception: |<title>\s*Error\s*<\/title>|userCodeAppPanel[^>]*error|El script ha finalizado pero/i;
var PANTALLA_DE_ENTRADA_DE_GOOGLE = /accounts\.google\.com|ServiceLogin|Inicia sesión con Google|Sign in - Google|Iniciar sesión: Cuentas de Google/i;
var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ---------- utilidades ---------- */

function correoValido(v) {
  if (typeof v !== 'string') return '';
  var t = v.trim();
  if (!t || t.length > 120) return '';
  return /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(t) ? t : '';
}

function horaDeMadrid(f) { return Utilities.formatDate(f, 'Europe/Madrid', 'HH:mm'); }
function enSilencio(f) {
  var h = parseInt(Utilities.formatDate(f, 'Europe/Madrid', 'H'), 10);
  return h >= SILENCIO_DESDE || h < SILENCIO_HASTA;
}
function minutosEntre(a, b) { return Math.round((b.getTime() - a.getTime()) / 60000); }
function duracionEnLlano(min) {
  if (min < 90) return min + ' minutos';
  var h = Math.round(min / 6) / 10;
  return (h >= 48 ? Math.round(h / 24) + ' días' : String(h).replace('.', ',') + ' horas');
}
function nombreCortoDeRepo(repo) { return String(repo).split('/').pop().replace(/[-_]+/g, ' '); }
function nombreDeApp(mem, repo) { return (mem.nombres && mem.nombres[repo]) || nombreCortoDeRepo(repo); }
function fechaLarga(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? parseInt(m[3], 10) + ' de ' + MESES_LARGOS[parseInt(m[2], 10) - 1] : 'hace unos días';
}

/* ---------- las direcciones de Francisco ---------- */

function correosDeFrancisco() {
  var lista = [];
  var prop = PropertiesService.getScriptProperties().getProperty('CORREO_AVISOS');
  if (prop) {
    lista = String(prop).split(/[,;\s]+/);
  } else {
    lista.push(Session.getEffectiveUser().getEmail());
    try {
      var c = carpetaRaiz();
      ['getEditors', 'getViewers'].forEach(function (m) {
        (c[m]() || []).forEach(function (u) { lista.push(u.getEmail()); });
      });
    } catch (err) { /* sin la carpeta, vale el dueño */ }
  }
  var vistas = {}, salida = [];
  lista.forEach(function (x) {
    var v = correoValido(x);
    if (v && !vistas[v.toLowerCase()]) { vistas[v.toLowerCase()] = 1; salida.push(v); }
  });
  return salida;
}

/* ---------- la memoria (JSON en Drive: SOPORTE-AVISOS/_VIGILANTE) ---------- */

function memoriaVacia() {
  return { v: 1, avisados: {}, noche: [], apps: {}, avisos: {}, direcciones: {}, filas: {}, nombres: {},
           repos: { leida: null, lista: [], sinCola: {}, mirada: {} } };
}

function ficheroDe(carpeta, nombre) {
  var it = carpeta.getFilesByName(nombre);
  return it.hasNext() ? it.next() : null;
}

function escribirFichero(carpeta, nombre, texto) {
  var f = ficheroDe(carpeta, nombre);
  if (f) f.setContent(texto); else carpeta.createFile(nombre, texto, 'text/plain');
}

function cargarMemoria() {
  var f = ficheroDe(carpetaHija(carpetaRaiz(), CARPETA_VIGILANTE), FICHERO_MEMORIA);
  var m = null;
  if (f) { try { m = JSON.parse(f.getBlob().getDataAsString('UTF-8')); } catch (err) { m = null; } }
  var v = memoriaVacia();
  if (!m || typeof m !== 'object') return v;
  Object.keys(v).forEach(function (k) { if (m[k] === undefined || m[k] === null) m[k] = v[k]; });
  ['lista', 'sinCola', 'mirada'].forEach(function (k) { if (m.repos[k] === undefined) m.repos[k] = v.repos[k]; });
  return m;
}

function guardarMemoria(m) {
  escribirFichero(carpetaHija(carpetaRaiz(), CARPETA_VIGILANTE), FICHERO_MEMORIA, JSON.stringify(m));
}

/* Lo ya cerrado con más de 60 días se borra. */
function podarMemoria(m, ahora) {
  var tope = ahora.getTime() - GUARDAR_DIAS * 86400000;
  Object.keys(m.avisados).forEach(function (k) { if (new Date(m.avisados[k]).getTime() < tope) delete m.avisados[k]; });
  Object.keys(m.avisos).forEach(function (k) {
    var a = m.avisos[k];
    if (a.estado !== 'esperando' && a.fecha && new Date(a.fecha).getTime() < tope) delete m.avisos[k];
  });
}

/* ---------- GitHub y la web, varias llamadas a la vez ---------- */

function peticionApi(url, token, crudo) {
  return { url: url, method: 'get', muteHttpExceptions: true, followRedirects: true,
    headers: { Authorization: 'Bearer ' + token,
      Accept: crudo ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'gestor-soporte' } };
}

function peticionWeb(url) {
  return { url: url, method: 'get', muteHttpExceptions: true, followRedirects: true,
    headers: { 'User-Agent': 'gestor-vigilante' } };
}

function resultadoDe(r) {
  var texto = '';
  try { texto = r.getContentText(); } catch (err) { texto = ''; }
  return { codigo: r.getResponseCode(), texto: texto, fallo: false };
}

/* fetchAll tira todo el lote si una sola dirección ni siquiera conecta: entonces
   se repite una a una, y la que no conecta queda como `fallo`. */
function traerTodo(peticiones) {
  if (!peticiones.length) return [];
  try {
    return UrlFetchApp.fetchAll(peticiones).map(resultadoDe);
  } catch (err) {
    return peticiones.map(function (p) {
      try { return resultadoDe(UrlFetchApp.fetch(p.url, p)); }
      catch (e) { return { codigo: 0, texto: '', fallo: true }; }
    });
  }
}

function jsonDe(r) { try { return JSON.parse(r.texto); } catch (err) { return null; } }

/* ---------- la cola ---------- */

function estadoDeTexto(t) {
  var x = String(t || '').trim().replace(/^[*_\s]+/, '');
  if (/^EN CURSO/i.test(x)) return 'EN CURSO';
  if (/^BLOQUEADA/i.test(x)) return 'BLOQUEADA';
  if (/^SIN PUBLICACI[OÓ]N COMPROBADA/i.test(x)) return 'SIN PUBLICACION';
  var m = /^(HECHA|DESCARTADA|SUSTITUIDA|PENDIENTE|DEVUELTA|IDEA|EN DISE[ÑN]O)/i.exec(x);
  return m ? m[1].toUpperCase().replace('DISEÑO', 'DISENO') : 'OTRO';
}

/* Las filas de la cola: tabla de tres o cuatro columnas, o apartados «## N. …». */
function filasDeCola(texto) {
  var filas = [];
  String(texto || '').split('\n').forEach(function (l) {
    var m;
    if (l.charAt(0) === '|') {
      var c = l.split('|');
      if (c.length >= 4 && /^\d+$/.test(c[1].trim())) {
        filas.push({ n: c[1].trim(), estado: estadoDeTexto(c[3]), texto: l });
      }
    } else if ((m = /^##\s+(\d+)\.\s+(.*)$/.exec(l))) {
      var partes = m[2].split(/\s[—–-]\s/);
      filas.push({ n: m[1], estado: estadoDeTexto(partes.length > 1 ? partes[partes.length - 1] : ''), texto: l });
    }
  });
  return filas;
}

function enlaceDeConversacion(texto) {
  var m = /https:\/\/claude\.ai\/code\/session_[A-Za-z0-9_]+/.exec(texto || '');
  return m ? m[0] : '';
}

/* ---------- las direcciones de las apps ---------- */

var LINEA_DE_DIRECCION = /^[\s>*#-]*\**\s*(Direcci[oó]n publicada|Producci[oó]n|Publicada en|Direcci[oó]n|D[oó]nde se usa)\b/i;
var LINEA_QUE_HABLA_DE_DIRECCION = /direcci[oó]n|publica/i;

function direccionesDe(linea) {
  var salida = [];
  (String(linea).match(/https?:\/\/[^\s)>\]*`"']+/g) || []).forEach(function (u) {
    u = u.replace(/[.,;:*]+$/, '');
    if (!/pruebas|demo|preview|localhost/i.test(u)) salida.push(u);
  });
  return salida;
}

function buscarDireccion(corto, claude) {
  var lineas = String(corto || '').split('\n');
  for (var i = 0; i < lineas.length; i++) {
    if (LINEA_DE_DIRECCION.test(lineas[i])) {
      var d = direccionesDe(lineas[i]);
      if (d.length) return d[0];
    }
  }
  lineas = String(claude || '').split('\n');
  for (var j = 0; j < lineas.length; j++) {
    if (LINEA_QUE_HABLA_DE_DIRECCION.test(lineas[j])) {
      var e = direccionesDe(lineas[j]);
      if (e.length) return e[0];
    }
  }
  return '';
}

/* ¿Responde la app? bien (entera o solo la entrada de Google) o mal. */
function mirarApp(r) {
  if (!r || r.fallo || !r.codigo) return { bien: false };
  var cuerpo = r.texto || '';
  if (PAGINA_DE_ERROR_DE_GOOGLE.test(cuerpo) && !PANTALLA_DE_ENTRADA_DE_GOOGLE.test(cuerpo)) return { bien: false };
  if (PANTALLA_DE_ENTRADA_DE_GOOGLE.test(cuerpo)) return { bien: true, alcance: 'entrada' };
  if (r.codigo === 404 || r.codigo >= 500) return { bien: false };
  return { bien: true, alcance: 'entera' };
}

/* ---------- los correos ---------- */

function mandar(para, asunto, cuerpo, responderA) {
  var o = { to: para, subject: asunto, body: cuerpo };
  if (responderA) o.replyTo = responderA;
  MailApp.sendEmail(o);
}

function pieDeCorreo(s) {
  var t = '\n\nCentro de mando: ' + CENTRO_DE_MANDO;
  if (s.conv) t += '\nConversación de Claude Code: ' + s.conv;
  return t;
}

/* Un suceso: { tipo, repo, clave, vig, asunto, cuerpo, conv, siempre }.
   `clave` evita repetirlo; `vig` es la clave del estado que lo causa: sirve para
   comprobar a las 7:00 que sigue siendo verdad. Devuelve 'enviado', 'noche' o
   'ya' (ya avisado) o 'prueba'. */
function suceso(ctx, s) {
  var mem = ctx.mem;
  if (mem.avisados[s.clave]) return 'ya';
  if (ctx.prueba) return 'prueba';
  if (ctx.silencio) {
    mem.avisados[s.clave] = ctx.iso;
    mem.noche.push({ tipo: s.tipo, repo: s.repo, clave: s.clave, vig: s.vig || '', siempre: !!s.siempre,
      app: nombreDeApp(mem, s.repo), asunto: s.asunto, cuerpo: s.cuerpo, conv: s.conv || '' });
    return 'noche';
  }
  /* Si el correo falla, no se apunta como avisado: la siguiente pasada lo vuelve a intentar. */
  try {
    mandar(ctx.francisco.join(','), 'Centro de mando · ' + nombreDeApp(mem, s.repo) + ': ' + s.asunto, s.cuerpo + pieDeCorreo(s));
  } catch (err) { return 'fallo'; }
  mem.avisados[s.clave] = ctx.iso;
  return 'enviado';
}

/* A las 7:00: un solo correo con lo guardado de noche que siga siendo verdad. */
function vaciarNoche(ctx) {
  var mem = ctx.mem;
  if (!mem.noche.length) return;
  /* Lo que no se ha podido comprobar en esta pasada (GitHub no ha respondido) espera a la siguiente. */
  var verificable = function (x) { return x.siempre || (x.tipo === 'caida' ? ctx.examinados[x.repo] : ctx.leidos[x.repo]); };
  var quedan = mem.noche.filter(function (x) { return verificable(x) && (x.siempre || ctx.vigentes[x.vig]); });
  var siguen = mem.noche.filter(function (x) { return !verificable(x); });
  if (quedan.length) {
    var cuerpo = quedan.map(function (x) {
      return '• ' + x.app + ': ' + x.asunto + '\n  ' + x.cuerpo.replace(/\n+/g, ' ');
    }).join('\n\n') + '\n\nCentro de mando: ' + CENTRO_DE_MANDO;
    try {
      mandar(ctx.francisco.join(','), 'Centro de mando · resumen de la noche', 'Esto ha pasado de noche y sigue sin resolver:\n\n' + cuerpo);
    } catch (err) { return; }                      /* se guarda todo y se repite en la siguiente pasada */
  }
  quedan.forEach(function (x) {
    if (x.tipo === 'caida' && mem.apps[x.repo]) { mem.apps[x.repo].avisada = true; mem.apps[x.repo].enNoche = null; }
  });
  mem.noche = siguen;
}

/* ---------- el aviso de un usuario (doPost) ---------- */

function vigilanteAvisoNuevo(d, enlace, cola) {
  try {
    var bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(20000);
    var mem = null;
    try {
      mem = cargarMemoria();
      var ahora = new Date();
      var iso = ahora.toISOString();
      var ctx = { mem: mem, ahora: ahora, iso: iso, silencio: enSilencio(ahora), prueba: false,
                  vigentes: {}, francisco: correosDeFrancisco() };
      mem.nombres[d.repo] = cadena(d.app, 60);
      var fila = cola && cola.ok ? String(cola.numero) : '';
      if (fila) {
        var correo = d.correo || '';
        var propio = correo && ctx.francisco.map(function (x) { return x.toLowerCase(); }).indexOf(correo.toLowerCase()) !== -1;
        mem.avisos[d.repo + '#' + fila] = {
          repo: d.repo, fila: fila, app: cadena(d.app, 60), tipo: d.tipo, pantalla: pantallaLimpia(d.pantalla),
          fecha: Utilities.formatDate(ahora, 'Europe/Madrid', 'yyyy-MM-dd'), correo: correo, enlace: enlace,
          estado: !correo ? 'sin-correo' : (propio ? 'propio' : 'esperando'), historia: false
        };
      }
      suceso(ctx, {
        tipo: 'aviso', repo: d.repo, clave: d.repo + '|aviso|' + enlace, siempre: true,
        asunto: 'aviso nuevo de un usuario',
        cuerpo: 'Un usuario ha enviado un aviso desde el botón de soporte de ' + nombreDeApp(mem, d.repo) + '.\n' +
          'Tipo: ' + (d.tipo === 'error' ? 'algo no funciona' : 'propuesta de mejora') +
          '. Pantalla: ' + pantallaLimpia(d.pantalla) + '.' + (fila ? ' Fila de la cola: ' + fila + '.' : '') +
          '\nAviso completo en Drive: ' + enlace
      });
      guardarMemoria(mem);
    } finally { bloqueo.releaseLock(); }
  } catch (err) { /* el vigilante nunca estropea la respuesta al usuario */ }
}

/* ---------- la pasada ---------- */

function vigilar() { return pasadaDelVigilante({}); }

function pasadaDelVigilante(op) {
  var bloqueo = LockService.getScriptLock();
  if (!bloqueo.tryLock(10000)) return { ocupado: true };
  var mem = null;
  try {
    mem = cargarMemoria();
    return correrPasada(mem, op || {});
  } finally {
    if (mem) { try { guardarMemoria(mem); } catch (err) { /* la siguiente pasada lo repite */ } }
    bloqueo.releaseLock();
  }
}

/* Los repositorios que se miran en esta pasada. La lista se averigua con el propio
   permiso y se vuelve a mirar cada seis horas; si no se puede, vale REPOS_PERMITIDOS. */
function elegirRepos(ctx, token) {
  var mem = ctx.mem, r = mem.repos;
  var vieja = !r.leida || minutosEntre(new Date(r.leida), ctx.ahora) >= RELEER_CADA_HORAS * 60;
  if (vieja || !r.lista.length) {
    var rs = traerTodo([peticionApi('https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner', token)])[0];
    var js = rs.codigo === 200 ? jsonDe(rs) : null;
    var lista = [];
    if (js && js.length) {
      js.forEach(function (x) {
        if (x && x.full_name && x.full_name.indexOf(PROPIETARIO + '/') === 0 && !x.archived) lista.push({ n: x.full_name, pushed: x.pushed_at || '' });
      });
    }
    if (!lista.length) lista = REPOS_PERMITIDOS.map(function (n) { return { n: n, pushed: '' }; });
    r.lista = lista; r.leida = ctx.iso; r.sinCola = {};
    ctx.relistado = true;
  }
  return r.lista.filter(function (x) { return !r.sinCola[x.n]; });
}

function estaQuieto(ctx, repo, pushed) {
  var mem = ctx.mem;
  if (!pushed || ctx.ahora.getTime() - new Date(pushed).getTime() < QUIETO_DIAS * 86400000) return false;
  var filas = mem.filas[repo.n] || {};
  for (var k in filas) { if (filas[k] === 'EN CURSO') return false; }
  var app = mem.apps[repo.n];
  if (app && (app.fallos || app.caida)) return false;
  if (mem.noche.some(function (x) { return x.repo === repo.n; })) return false;
  for (var a in mem.avisos) { if (mem.avisos[a].repo === repo.n && mem.avisos[a].estado === 'esperando') return false; }
  return true;
}

function correrPasada(mem, op) {
  var ahora = new Date();
  var ctx = { mem: mem, ahora: ahora, iso: ahora.toISOString(), silencio: enSilencio(ahora), prueba: !!op.prueba,
              vigentes: {}, examinados: {}, leidos: {}, francisco: correosDeFrancisco() };
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  var informe = { repos: [], vigilados: [] };
  if (!token) return informe;
  podarMemoria(mem, ahora);

  /* Qué repositorios se miran ahora (los quietos, una vez por hora). */
  var repos = elegirRepos(ctx, token).filter(function (x) {
    var vista = mem.repos.mirada[x.n];
    if (!ctx.relistado && estaQuieto(ctx, x, x.pushed) && vista && minutosEntre(new Date(vista), ahora) < 55) return false;
    return true;
  });

  /* Primera tanda: la cola, el estado de la última publicación, ESPERANDO.json, las
     direcciones (si toca releerlas) y la propia app. */
  var peticiones = [], donde = [];
  function pedir(repo, que, p) { peticiones.push(p); donde.push({ repo: repo, que: que }); }
  repos.forEach(function (x) {
    var base = 'https://api.github.com/repos/' + x.n;
    pedir(x.n, 'cola', peticionApi(base + '/contents/docs/COLA.md?ref=main', token, true));
    pedir(x.n, 'estado', peticionApi(base + '/commits/main/status', token));
    pedir(x.n, 'esperando', peticionApi(base + '/contents/ESPERANDO.json?ref=avisos', token, true));
    var dir = mem.direcciones[x.n];
    if (!dir || minutosEntre(new Date(dir.leida), ahora) >= RELEER_CADA_HORAS * 60) {
      pedir(x.n, 'corto', peticionApi(base + '/contents/docs/CONTEXTO-CORTO.md?ref=main', token, true));
      pedir(x.n, 'claude', peticionApi(base + '/contents/CLAUDE.md?ref=main', token, true));
    } else if (dir.url) {
      pedir(x.n, 'app', peticionWeb(dir.url));
    }
  });
  var rs = traerTodo(peticiones);
  var por = {};
  rs.forEach(function (r, i) { (por[donde[i].repo] = por[donde[i].repo] || {})[donde[i].que] = r; });

  /* Las direcciones recién leídas: se piden también las apps (segunda tanda corta). */
  var segunda = [], dondeSegunda = [];
  repos.forEach(function (x) {
    var g = por[x.n];
    if (g.corto || g.claude) {
      var url = buscarDireccion(g.corto && g.corto.codigo === 200 ? g.corto.texto : '',
                                g.claude && g.claude.codigo === 200 ? g.claude.texto : '');
      if ((g.corto && g.corto.codigo !== 200 && g.corto.codigo !== 404) || (g.claude && g.claude.codigo !== 200 && g.claude.codigo !== 404)) {
        /* GitHub no ha respondido bien: se deja la dirección que había y se vuelve a intentar. */
        if (!mem.direcciones[x.n]) mem.direcciones[x.n] = { url: '', leida: new Date(0).toISOString() };
      } else {
        mem.direcciones[x.n] = { url: url, leida: ctx.iso };
      }
      var u = mem.direcciones[x.n].url;
      if (u) { segunda.push(peticionWeb(u)); dondeSegunda.push(x.n); }
    }
  });
  traerTodo(segunda).forEach(function (r, i) { por[dondeSegunda[i]].app = r; });

  /* Segunda tanda de GitHub: la actividad (solo donde hay una fila EN CURSO) y la historia
     (solo para un aviso cuya fila ya no está en la cola). */
  var tercera = [], dondeTercera = [];
  var datos = {};
  repos.forEach(function (x) {
    var g = por[x.n];
    var d = datos[x.n] = { ok: !!g.cola && g.cola.codigo === 200, filas: [] };
    if (!d.ok) return;
    d.filas = filasDeCola(g.cola.texto);
    var base = 'https://api.github.com/repos/' + x.n;
    if (d.filas.some(function (f) { return f.estado === 'EN CURSO'; })) {
      tercera.push(peticionApi(base + '/activity?per_page=50', token)); dondeTercera.push({ repo: x.n, que: 'actividad' });
    }
    var espera = Object.keys(mem.avisos).some(function (k) {
      var a = mem.avisos[k];
      return a.repo === x.n && a.estado === 'esperando' && !a.historia && !d.filas.some(function (f) { return f.n === a.fila; });
    });
    if (espera) { tercera.push(peticionApi(base + '/contents/docs/HISTORIA.md?ref=main', token, true)); dondeTercera.push({ repo: x.n, que: 'historia' }); }
  });
  traerTodo(tercera).forEach(function (r, i) { por[dondeTercera[i].repo][dondeTercera[i].que] = r; });

  /* Lo de cada repositorio. */
  repos.forEach(function (x) {
    var d = datos[x.n], g = por[x.n];
    mem.repos.mirada[x.n] = ctx.iso;
    ctx.examinados[x.n] = true;
    if (g.cola && g.cola.codigo === 404) {
      var yaSabido = (g.estado && g.estado.codigo === 200);
      if (yaSabido) mem.repos.sinCola[x.n] = true;       /* el repositorio existe pero no tiene cola */
    }
    comprobarApp(ctx, x.n, g.app);
    if (!d.ok) return;                                    /* GitHub no ha respondido: nada se deduce de este repositorio */
    informe.vigilados.push(x.n);
    ctx.leidos[x.n] = true;
    deducirDeLaCola(ctx, x.n, d, g);
    contestarAvisos(ctx, x.n, d, g);
  });

  /* Las 7:00: lo guardado de noche; y el fichero para la página. */
  if (!ctx.silencio && !ctx.prueba) vaciarNoche(ctx);
  escribirEstado(ctx);
  informe.apps = mem.apps;
  informe.direcciones = mem.direcciones;
  informe.francisco = ctx.francisco;
  return informe;
}

/* ---------- lo que se deduce de la cola, la publicación y ESPERANDO.json ---------- */

function deducirDeLaCola(ctx, repo, d, g) {
  var mem = ctx.mem;
  var filas = d.filas;
  var estados = {};
  filas.forEach(function (f) { estados[f.n] = f.estado; });
  var previas = mem.filas[repo];

  /* Caso 1: Claude Code espera su respuesta. */
  var espera = g.esperando && g.esperando.codigo === 200 ? jsonDe(g.esperando) : null;
  var esperando = false;
  if (espera && espera.estado === 'esperando') {
    var fila = String(espera.fila || '');
    var filaEnCurso = filas.filter(function (f) { return f.n === fila && f.estado === 'EN CURSO'; })[0];
    if (!fila || filaEnCurso) {
      esperando = true;
      var vig = repo + '|espera|' + fila + '|' + espera.desde;
      ctx.vigentes[vig] = true;
      suceso(ctx, { tipo: 'espera', repo: repo, clave: vig, vig: vig,
        asunto: 'Claude Code espera tu respuesta' + (fila ? ' (fila ' + fila + ')' : ''),
        cuerpo: 'Claude Code se ha parado y espera que le contestes' + (fila ? ' en la fila ' + fila : '') +
          ', desde las ' + (espera.desde ? horaDeMadrid(new Date(espera.desde)) : '—') + '. Abre su conversación y contesta.',
        conv: filaEnCurso ? enlaceDeConversacion(filaEnCurso.texto) : '' });
    }
  }

  /* Caso 2: una tarea a medias (EN CURSO sin pasos desde hace más de 90 minutos). */
  var enCurso = filas.filter(function (f) { return f.estado === 'EN CURSO'; });
  if (enCurso.length && !esperando) {
    var ultimo = ultimoPaso(g.actividad, enCurso[0].n);
    if (ultimo) {
      enCurso.forEach(function (f) {
        if (minutosEntre(ultimo, ctx.ahora) <= PARADA_MINUTOS) return;
        var v = repo + '|parada|' + f.n + '|' + ultimo.toISOString();
        ctx.vigentes[v] = true;
        suceso(ctx, { tipo: 'parada', repo: repo, clave: v, vig: v,
          asunto: 'la fila ' + f.n + ' lleva parada desde las ' + horaDeMadrid(ultimo),
          cuerpo: 'La fila ' + f.n + ' está EN CURSO, pero no ha habido ningún paso de trabajo desde las ' + horaDeMadrid(ultimo) +
            ' (hace ' + duracionEnLlano(minutosEntre(ultimo, ctx.ahora)) + '). Puede que Claude Code se haya quedado a medias.',
          conv: enlaceDeConversacion(f.texto) });
      });
    }
  }

  /* Casos 2 y 3: filas que pasan a BLOQUEADA o a SIN PUBLICACIÓN COMPROBADA. */
  filas.forEach(function (f) {
    var v = repo + '|' + f.estado + '|' + f.n;
    if (f.estado === 'BLOQUEADA' || f.estado === 'SIN PUBLICACION') ctx.vigentes[v] = true;
    if (!previas || previas[f.n] === f.estado) return;
    if (f.estado === 'BLOQUEADA') {
      suceso(ctx, { tipo: 'bloqueada', repo: repo, clave: v + '|' + ctx.iso, vig: v,
        asunto: 'la fila ' + f.n + ' se ha quedado BLOQUEADA',
        cuerpo: 'La fila ' + f.n + ' ha pasado a BLOQUEADA: Claude Code no ha podido terminarla y sigue con la siguiente.',
        conv: enlaceDeConversacion(f.texto) });
    } else if (f.estado === 'SIN PUBLICACION') {
      suceso(ctx, { tipo: 'publicacion', repo: repo, clave: v + '|' + ctx.iso, vig: v,
        asunto: 'la fila ' + f.n + ' no se ha podido comprobar publicada',
        cuerpo: 'La fila ' + f.n + ' está SIN PUBLICACIÓN COMPROBADA: el cambio está hecho, pero no se ha podido comprobar que esté publicado.',
        conv: enlaceDeConversacion(f.texto) });
    }
  });
  if (!ctx.prueba || !previas) mem.filas[repo] = estados;

  /* Caso 3: la última publicación de main ha fallado. */
  var est = g.estado && g.estado.codigo === 200 ? jsonDe(g.estado) : null;
  if (est && est.statuses) {
    var vercel = est.statuses.filter(function (s) { return /vercel/i.test(s.context || ''); })[0];
    if (vercel && (vercel.state === 'failure' || vercel.state === 'error') && !NO_ES_FALLO.test(vercel.description || '')) {
      var vp = repo + '|publicacion|' + est.sha;
      ctx.vigentes[vp] = true;
      suceso(ctx, { tipo: 'publicacion', repo: repo, clave: vp, vig: vp,
        asunto: 'la última publicación ha fallado',
        cuerpo: 'Vercel no ha podido publicar el último cambio de main (' + String(est.sha || '').slice(0, 7) + '): ' +
          cadena(vercel.description, 120) + '. La web puede seguir con la versión anterior.' });
    }
  }
}

function ultimoPaso(actividad, fila) {
  var js = actividad && actividad.codigo === 200 ? jsonDe(actividad) : null;
  if (!js || !js.length) return null;
  var mejor = null;
  js.forEach(function (a) {
    var ref = String(a.ref || '').replace(/^refs\/heads\//, '');
    if (ref === 'main' || ref === 'pruebas' || ref === 'fila-' + fila || ref.indexOf('claude/') === 0) {
      var t = new Date(a.timestamp);
      if (!isNaN(t.getTime()) && (!mejor || t.getTime() > mejor.getTime())) mejor = t;
    }
  });
  return mejor;
}

/* ---------- la app abre ---------- */

function comprobarApp(ctx, repo, respuesta) {
  var mem = ctx.mem;
  var dir = mem.direcciones[repo];
  var a = mem.apps[repo] = mem.apps[repo] || { url: '', estado: 'sin-vigilar', alcance: null, desde: null, comprobado: null,
                                                 fallos: 0, primerFallo: null, caida: false, avisada: false, enNoche: null };
  if (!dir || !dir.url) {
    if (dir && dir.leida && dir.leida !== new Date(0).toISOString()) { a.url = ''; a.estado = 'sin-vigilar'; a.alcance = null; a.desde = null; a.caida = false; a.fallos = 0; }
    return;
  }
  a.url = dir.url;
  if (!respuesta) return;                          /* esta pasada no se ha pedido (acaba de leerse la dirección) */
  var m = mirarApp(respuesta);
  a.comprobado = ctx.iso;
  if (m.bien) {
    if (a.caida) {
      if (a.avisada) {
        var min = minutosEntre(new Date(a.desde), ctx.ahora);
        suceso(ctx, { tipo: 'recuperada', repo: repo, clave: repo + '|recuperada|' + a.desde, siempre: true,
          asunto: 'la app ya funciona',
          cuerpo: 'La app vuelve a abrir (' + a.url + '). Estuvo caída desde las ' + horaDeMadrid(new Date(a.desde)) + ', unos ' + duracionEnLlano(min) + '.' });
      } else if (a.enNoche) {
        mem.noche = mem.noche.filter(function (x) { return x.clave !== a.enNoche; });   /* se arregló antes de avisar: nada que contar */
      }
    }
    a.estado = 'bien'; a.alcance = m.alcance; a.desde = null;
    a.fallos = 0; a.primerFallo = null; a.caida = false; a.avisada = false; a.enNoche = null;
    return;
  }
  a.fallos = (a.fallos || 0) + 1;
  if (a.fallos === 1) a.primerFallo = ctx.iso;
  if (a.fallos >= 2) {
    a.caida = true; a.estado = 'caida'; a.desde = a.primerFallo;
    ctx.vigentes[repo + '|caida|' + a.desde] = true;
    var r = suceso(ctx, { tipo: 'caida', repo: repo, clave: repo + '|caida|' + a.desde, vig: repo + '|caida|' + a.desde,
      asunto: 'la app no abre',
      cuerpo: 'La app no responde (' + a.url + ') desde las ' + horaDeMadrid(new Date(a.desde)) + '. Dos comprobaciones seguidas han fallado.' });
    if (r === 'enviado') a.avisada = true;
    if (r === 'noche') a.enNoche = repo + '|caida|' + a.desde;
  }
}

/* ---------- contestar a quien envió un aviso ---------- */

function contestarAvisos(ctx, repo, d, g) {
  var mem = ctx.mem;
  Object.keys(mem.avisos).forEach(function (k) {
    var a = mem.avisos[k];
    if (a.repo !== repo || a.estado !== 'esperando') return;
    var fila = d.filas.filter(function (f) { return f.n === a.fila; })[0];
    var hecha = false;
    if (fila) {
      if (fila.estado === 'DESCARTADA' || fila.estado === 'SUSTITUIDA') { if (!ctx.prueba) a.estado = 'descartado'; return; }
      hecha = fila.estado === 'HECHA';
    } else if (g.historia && g.historia.codigo === 200) {
      a.historia = true;
      hecha = constaHechaEnLaHistoria(g.historia.texto, a.fila);
      if (!hecha) { if (!ctx.prueba) a.estado = 'no-encontrada'; return; }
    } else if (g.historia) {
      return;                                         /* GitHub no ha dado la historia: se vuelve a intentar */
    } else if (a.historia) {
      a.estado = 'no-encontrada'; return;
    } else {
      return;
    }
    if (!hecha || ctx.silencio || ctx.prueba) return;
    var enLlano = a.tipo === 'error';
    var pantalla = a.pantalla ? ' en la pantalla «' + a.pantalla + '»' : '';
    var asunto = a.app + ': ' + (enLlano ? 'tu aviso ya está resuelto' : 'tu propuesta ya está hecha');
    var cuerpo = enLlano
      ? 'Hola. Tu aviso del ' + fechaLarga(a.fecha) + pantalla + ' de ' + a.app + ' ya está resuelto. Ábrela y compruébalo. ' +
        'Si sigue fallando, vuelve a pulsar el botón de soporte. Este correo sale solo; si respondes, le llega a Francisco.'
      : 'Hola. Tu propuesta del ' + fechaLarga(a.fecha) + pantalla + ' de ' + a.app + ' ya está hecha. Ábrela y mírala. ' +
        'Si no es lo que pedías, vuelve a pulsar el botón de soporte. Este correo sale solo; si respondes, le llega a Francisco.';
    try { mandar(a.correo, asunto, cuerpo, ctx.francisco[0] || ''); } catch (err) { return; }
    a.estado = 'contestado';
    a.fecha = Utilities.formatDate(ctx.ahora, 'Europe/Madrid', 'yyyy-MM-dd');
  });
}

function constaHechaEnLaHistoria(texto, fila) {
  var re = new RegExp('(?:\\bfilas?\\s+|^\\|\\s*|^#+\\s*)' + fila + '\\b', 'i');
  return String(texto || '').split('\n').some(function (l) { return re.test(l) && /HECHA|hecha|publicad/.test(l); });
}

/* ---------- el fichero para la página ---------- */

function escribirEstado(ctx) {
  var mem = ctx.mem;
  var repos = {};
  Object.keys(mem.apps).forEach(function (r) {
    var a = mem.apps[r];
    if (!mem.filas[r] && !a.comprobado) return;
    repos[r] = { app: { url: a.url || null, estado: a.estado, alcance: a.alcance || null,
      desde: a.estado === 'caida' ? a.desde : null, comprobado: a.comprobado || null } };
  });
  Object.keys(mem.filas).forEach(function (r) {
    if (!repos[r]) repos[r] = { app: { url: null, estado: 'sin-vigilar', alcance: null, desde: null, comprobado: null } };
  });
  var avisos = {};
  Object.keys(mem.avisos).forEach(function (k) { avisos[k] = { estado: mem.avisos[k].estado, fecha: mem.avisos[k].fecha }; });
  var texto = JSON.stringify({ version: VERSION_SCRIPT, actualizado: ctx.iso, cadaMinutos: CADA_MINUTOS, repos: repos, avisos: avisos });
  escribirFichero(carpetaRaiz(), FICHERO_ESTADO, texto);
}

/* ---------- el disparador y la prueba de prepararTodo ---------- */

/* Pone el disparador (una sola vez, sin duplicarlo) y hace una pasada de prueba SIN
   mandar avisos. Devuelve el texto que se añade al correo de resumen. */
function prepararVigilante() {
  try {
    var hay = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'vigilar'; });
    var texto = '\n\n— El vigilante —\n';
    if (!hay.length) {
      ScriptApp.newTrigger('vigilar').timeBased().everyMinutes(CADA_MINUTOS).create();
      texto += 'Disparador puesto: cada ' + CADA_MINUTOS + ' minutos.\n';
    } else {
      texto += 'El disparador ya estaba puesto.\n';
    }
    var inf = pasadaDelVigilante({ prueba: true });
    if (inf.ocupado) return texto + 'La pasada de prueba no se ha hecho: había otra en marcha.\n';
    texto += 'Los avisos llegarán a: ' + (inf.francisco && inf.francisco.length ? inf.francisco.join(', ') : '(ninguna dirección)') + '\n';
    texto += 'Repositorios vigilados (' + inf.vigilados.length + '): ' + (inf.vigilados.join(', ') || 'ninguno') + '\n';
    texto += 'Apps:\n';
    inf.vigilados.forEach(function (r) {
      var a = inf.apps[r];
      var que = !a || a.estado === 'sin-vigilar' ? 'sin vigilar (no tiene dirección escrita)'
        : a.url + ' — ' + (a.alcance === 'entrada' ? 'solo se llega a la entrada de Google' : (a.estado === 'bien' ? 'se llega a la app entera' : (a.fallos ? 'no responde' : 'aún sin comprobar')));
      texto += '  · ' + r + ': ' + que + '\n';
    });
    return texto;
  } catch (err) {
    return '\n\nNo he podido poner el vigilante: ' + textoDe(err) + '\n';
  }
}
