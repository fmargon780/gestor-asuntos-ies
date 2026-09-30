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
   solo no sale todavía en el Centro de mando.
   ============================================================ */

var VERSION_SCRIPT = '30-sep-2026 · fila 213';

/* Los repositorios que pueden mandar avisos. Lo que venga de otro se
   rechaza. Cuando se ponga el botón en las demás apps, se añaden aquí. */
var REPOS_PERMITIDOS = ['fmargon780/gestor-asuntos-ies'];

var CARPETA_RAIZ = 'SOPORTE-AVISOS';
var FICHERO_COLA = 'docs/COLA.md';
var RAMA_COLA = 'main';
var MAX_CUERPO = 6000000;      /* caracteres del POST entero */
var MAX_CAPTURA = 5000000;     /* caracteres de la captura en base64 */
var MAX_TEXTO = 5000;
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
      return respuesta({ ok: false, motivo: 'El aviso es demasiado grande. Prueba sin la captura.' });
    }
    var datos;
    try { datos = JSON.parse(contenido); }
    catch (err) { return respuesta({ ok: false, motivo: 'El aviso llegó estropeado.' }); }

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

function cadena(v, max) {
  return (typeof v === 'string') ? v.slice(0, max) : '';
}

function validar(d) {
  if (!d || typeof d !== 'object') return 'El aviso llegó vacío.';
  if (REPOS_PERMITIDOS.indexOf(d.repo) === -1) return 'Este repositorio no puede mandar avisos.';
  if (d.tipo !== 'error' && d.tipo !== 'mejora') return 'Falta decir si es un error o una mejora.';
  if (typeof d.texto !== 'string' || !d.texto.trim()) return 'Falta el texto del aviso.';
  if (d.texto.length > MAX_TEXTO) return 'El texto es demasiado largo.';
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
  if (tieneCaptura) lineas.push('', 'Captura: ' + base + '.jpg (en esta misma carpeta)');
  var fichero = carpeta.createFile(base + '.txt', lineas.join('\n'), 'text/plain');
  if (tieneCaptura) {
    var bytes = Utilities.base64Decode(d.captura.replace(/\s+/g, ''));
    carpeta.createFile(Utilities.newBlob(bytes, 'image/jpeg', base + '.jpg'));
  }
  return { enlace: fichero.getUrl(), carpeta: carpeta.getUrl() };
}

/* ---------- la fila IDEA en docs/COLA.md ---------- */

function peticionGitHub(metodo, repo, opciones) {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Falta GITHUB_TOKEN en las propiedades del script.');
  var url = 'https://api.github.com/repos/' + repo + '/contents/' + FICHERO_COLA +
            (metodo === 'get' ? '?ref=' + RAMA_COLA : '');
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
  if (opciones && opciones.cuerpo) {
    p.contentType = 'application/json';
    p.payload = JSON.stringify(opciones.cuerpo);
  }
  var r = UrlFetchApp.fetch(url, p);
  var codigo = r.getResponseCode();
  var texto = r.getContentText();
  var json = null;
  try { json = JSON.parse(texto); } catch (err) { json = null; }
  return { codigo: codigo, json: json };
}

/* El número siguiente al más alto de la tabla de la cola. */
function siguienteNumero(cola) {
  var max = 0;
  var re = /^\|\s*(\d+)\s*\|/gm;
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

function filaDeCola(numero, d, enlace) {
  var que = (d.tipo === 'error') ? 'error' : 'mejora';
  return '| ' + numero + ' | Aviso de usuario: ' + que + ' en «' + pantallaLimpia(d.pantalla) + '» | ' +
         'IDEA (' + fechaCorta() + '): enviada por un usuario desde el botón de soporte · ' +
         'aviso completo: ' + enlace + ' |';
}

/* Añade la fila justo después de la última fila de la tabla. */
function meterFila(cola, fila) {
  var lineas = cola.split('\n');
  var ultima = -1;
  for (var i = 0; i < lineas.length; i++) {
    if (/^\|\s*\d+\s*\|/.test(lineas[i])) ultima = i;
  }
  if (ultima === -1) throw new Error('No encuentro la tabla de la cola.');
  lineas.splice(ultima + 1, 0, fila);
  return lineas.join('\n');
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
    var nuevo = meterFila(actual, filaDeCola(numero, d, enlace));
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

/* ---------- la primera vez ---------- */

/* Se ejecuta a mano una vez: crea la carpeta de avisos y comprueba que
   el permiso de GitHub llega a la cola. Solo LEE la cola, no escribe. */
function prepararTodo() {
  var carpeta = carpetaRaiz();
  Logger.log('Carpeta de avisos lista: ' + carpeta.getUrl());
  var repo = REPOS_PERMITIDOS[0];
  var r = peticionGitHub('get', repo);
  if (r.codigo === 200) {
    Logger.log('Permiso de GitHub bien: he podido leer ' + FICHERO_COLA + ' de ' + repo + '.');
  } else {
    Logger.log('OJO: GitHub respondió ' + r.codigo + ' al leer la cola. Revisa el permiso (GITHUB_TOKEN).');
  }
  return 'Versión del buzón: ' + VERSION_SCRIPT;
}
