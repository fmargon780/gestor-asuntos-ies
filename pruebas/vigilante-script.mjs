/* Prueba de la fila 268 (docs/VIGILANTE-Y-CORREOS.md): el vigilante de
   apps-script/soporte.gs, sin Google y sin navegador, con dobles de GitHub,
   Drive, correo, reloj, cerrojo y disparadores.

    1. Los cinco casos mandan cada uno su correo, una sola vez en diez pasadas.
    2. Una fila parada que se retoma y se vuelve a parar manda un correo nuevo.
    3. Una publicación saltada a propósito y el tope de Vercel no mandan correo.
    4. A las 2:00 no sale nada; a las 7:00 un solo correo con lo que sigue
       siendo verdad, y lo que se arregló de noche no sale.
    5. Una app con una pasada mal no avisa; con dos, sí; al volver, correo corto;
       una caída de noche arreglada antes de las 7:00 no manda ninguno.
    6. La entrada de Google cuenta como bien (alcance «entrada»); sin dirección:
       «sin-vigilar».
    7. Un aviso con `correo`: HECHA, DESCARTADA, sin correo, propio, y una fila que
       ya no está en la cola pero consta hecha en la historia.
    8. `correo` mal formado no rechaza el aviso; no sale en la cola ni en el estado.
    9. ESTADO-VIGILANTE.json tiene la forma acordada y es siempre el mismo fichero.
   10. prepararTodo pone un solo disparador aunque se ejecute tres veces.
   11. Si GitHub falla a mitad, ni correos falsos ni memoria estropeada.
   12. Todo lo que probaba soporte-script.mjs sigue en verde (se lanza aparte).  */
import fs from 'node:fs';
import vm from 'node:vm';

const codigo = fs.readFileSync(new URL('../apps-script/soporte.gs', import.meta.url), 'utf8');
const MIN = 60000;

function formatear(d, zona, f) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  const t = { 'H': String(+p.hour), 'HH:mm': p.hour + ':' + p.minute, 'yyyy-MM-dd': `${p.year}-${p.month}-${p.day}`,
    'd-M-yyyy': `${+p.day}-${+p.month}-${p.year}`, 'yyyy-MM-dd HHmmss': `${p.year}-${p.month}-${p.day} ${p.hour}${p.minute}${p.second}` };
  return t[f];
}

function resp(codigo, texto) { return { getResponseCode: () => codigo, getContentText: () => texto }; }
const b64 = (t) => Buffer.from(t, 'utf8').toString('base64');
const SHA = 'abc1234def5678abc1234def5678abc1234def56';

function tabla(filas) {
  return '# Cola\n\n| Nº | Instrucción | Estado |\n|---|---|---|\n' + filas.map(([n, e]) => `| ${n} | \`doc${n}\` | ${e} |`).join('\n') + '\n\n## Lo que queda\n';
}

function mundo(inicio) {
  const w = { t: new Date(inicio).getTime(), repos: new Map(), apps: {}, caidos: new Set(), llamadas: 0, correos: [], disparadores: [], props: { GITHUB_TOKEN: 'tok' },
              falloEnviando: false, fetchAllLlamadas: 0 };
  const raiz = carpeta('raiz');
  function fichero(nombre, contenido) {
    return { nombre, contenido, setContent(t) { this.contenido = t; }, getBlob() { return { getDataAsString: () => this.contenido }; },
             getUrl: () => 'https://drive.test/f/' + encodeURIComponent(nombre) };
  }
  function carpeta(nombre) {
    const c = { nombre, hijas: new Map(), ficheros: new Map(),
      getFoldersByName(n) { const h = c.hijas.get(n); return { hasNext: () => !!h, next: () => h }; },
      createFolder(n) { const h = carpeta(nombre + '/' + n); c.hijas.set(n, h); return h; },
      getFilesByName(n) { const f = c.ficheros.get(n); return { hasNext: () => !!f, next: () => f }; },
      createFile(a, b) { const f = typeof a === 'object' ? fichero(a.nombre, a) : fichero(a, b); c.ficheros.set(f.nombre, f); return f; },
      getEditors: () => [], getViewers: () => [], getUrl: () => 'https://drive.test/carpeta/' + nombre };
    return c;
  }
  w.raiz = raiz;
  w.avisos = () => raiz.hijas.get('SOPORTE-AVISOS');
  w.memoria = () => JSON.parse(w.avisos().hijas.get('_VIGILANTE').ficheros.get('memoria.json').contenido);
  w.estado = () => w.avisos().ficheros.get('ESTADO-VIGILANTE.json');

  function uno(url, p) {
    w.llamadas++;
    let m;
    if (/^https:\/\/api\.github\.com\/user\/repos/.test(url)) {
      return resp(200, JSON.stringify([...w.repos].map(([n, r]) => ({ full_name: n, pushed_at: r.pushed || new Date(w.t).toISOString(), archived: false }))));
    }
    if ((m = /^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/?]+)([^?]*)/.exec(url))) {
      const nombre = m[1], ruta = m[2], r = w.repos.get(nombre);
      if (!r) return resp(404, '{}');
      if (w.caidos.has(nombre)) return resp(500, '{}');
      const crudo = /raw/.test((p.headers && p.headers.Accept) || '');
      const texto = (t) => t == null ? resp(404, '{}') : resp(200, t);
      if (ruta === '') return resp(200, '{}');
      if (ruta === '/contents/docs/COLA.md') {
        if (r.cola == null) return resp(404, '{}');
        if (p.method === 'put') { r.cola = Buffer.from(JSON.parse(p.payload).content, 'base64').toString('utf8'); return resp(200, '{}'); }
        return crudo ? resp(200, r.cola) : resp(200, JSON.stringify({ sha: 'sha1', content: b64(r.cola) }));
      }
      if (ruta === '/commits/main/status') return resp(200, JSON.stringify({ sha: SHA, state: 'success', statuses: r.estado || [{ context: 'Vercel', state: 'success', description: 'Deployment has completed' }] }));
      if (ruta === '/contents/ESPERANDO.json') return texto(r.esperando == null ? null : JSON.stringify(r.esperando));
      if (ruta === '/contents/docs/CONTEXTO-CORTO.md') return texto(r.corto);
      if (ruta === '/contents/CLAUDE.md') return texto(r.claude);
      if (ruta === '/contents/docs/HISTORIA.md') return texto(r.historia);
      if (ruta === '/activity') return resp(200, JSON.stringify(r.actividad || []));
      return resp(404, '{}');
    }
    const a = w.apps[url];
    if (!a || a === 'no-conecta') throw new Error('no conecta');
    return resp(a.codigo, a.texto || 'hola');
  }

  const contexto = {
    console, JSON, Error, String, parseInt, RegExp, Object, Array, Math, isNaN,
    Date: class extends Date { constructor(...a) { if (a.length) super(...a); else super(w.t); } static now() { return w.t; } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    Logger: { log() {} },
    MailApp: { sendEmail(a, b, c) {
      if (w.falloEnviando) throw new Error('el correo falla');
      const o = typeof a === 'object' ? { para: a.to, asunto: a.subject, cuerpo: a.body, replyTo: a.replyTo } : { para: a, asunto: b, cuerpo: c };
      w.correos.push(o);
    } },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'dueno@ejemplo.es' }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) },
    ScriptApp: { getProjectTriggers: () => w.disparadores.map((f) => ({ getHandlerFunction: () => f })),
      newTrigger: (f) => ({ timeBased() { return this; }, everyMinutes() { return this; }, create() { w.disparadores.push(f); } }) },
    DriveApp: {
      getFoldersByName(n) { const h = raiz.hijas.get(n); return { hasNext: () => !!h, next: () => h }; },
      createFolder(n) { const c = carpeta(n); raiz.hijas.set(n, c); return c; }
    },
    Utilities: { formatDate: formatear, Charset: { UTF_8: 'utf8' }, base64Decode: (s) => Buffer.from(s, 'base64'), base64Encode: (t) => b64(t),
      newBlob: (bytes, tipo, nombre) => ({ bytes, tipo, nombre, getDataAsString: () => Buffer.from(bytes).toString('utf8') }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => w.props[k] || null, setProperty: (k, v) => { w.props[k] = v; } }) },
    UrlFetchApp: { fetch: uno, fetchAll(lista) { w.fetchAllLlamadas++; return lista.map((p) => uno(p.url, p)); } }
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto, { filename: 'soporte.gs' });
  w.c = contexto;
  w.repo = (nombre, datos) => { w.repos.set('fmargon780/' + nombre, { ...datos }); return w.repos.get('fmargon780/' + nombre); };
  w.avanza = (min) => { w.t += min * MIN; };
  w.pasada = (min = 10) => { w.avanza(min); return w.c.vigilar(); };
  w.asuntos = () => w.correos.map((x) => x.asunto);
  w.cuantos = (re) => w.correos.filter((x) => re.test(x.asunto)).length;
  w.envio = (d) => { w.t += 1000; return JSON.parse(w.c.doPost({ postData: { contents: JSON.stringify(d) } }).t); };
  return w;
}

const CORTO = (url) => `# Contexto\n\n- Dirección publicada: **${url}** (dominio propio).\n- Otra cosa\n`;
const BUENO = (repo, extra = {}) => ({ app: 'Mi App', repo: 'fmargon780/' + repo, tipo: 'error', texto: 'SECRETO-DEL-USUARIO: no sale el alumno Pérez',
  pantalla: 'Guardias', quien: 'Pepe-Perez', fecha: '2026-10-03 10:00', version: 'v1', ...extra });

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const MEDIODIA = '2026-10-06T10:00:00Z';   /* 12:00 en Madrid */
const NOCHE = '2026-10-06T21:00:00Z';      /* 23:00 en Madrid */

/* 1 y 2. Los cinco casos, una sola vez; una fila retomada y parada otra vez. */
{
  const w = mundo(MEDIODIA);
  const hace = (min) => new Date(w.t - min * MIN).toISOString();
  w.repo('app-espera', { cola: tabla([[214, 'EN CURSO (6-oct-2026 09:00) · conversación: https://claude.ai/code/session_AAA']]),
    esperando: { estado: 'esperando', fila: '214', motivo: 'permiso', desde: hace(20), mensaje: '' }, actividad: [{ ref: 'refs/heads/main', timestamp: hace(10) }] });
  w.repo('app-parada', { cola: tabla([[30, 'EN CURSO (6-oct-2026 07:00)']]),
    actividad: [{ ref: 'refs/heads/fila-30', timestamp: hace(180) }, { ref: 'refs/heads/otra-rama', timestamp: hace(1) }] });
  w.repo('app-publicacion', { cola: tabla([[5, 'HECHA']]), estado: [{ context: 'Vercel', state: 'failure', description: 'Deployment failed' }] });
  w.repo('bd-alumnado-ies', { cola: tabla([[7, 'HECHA']]) });
  w.repo('app-caida', { cola: tabla([[9, 'PENDIENTE']]), corto: CORTO('https://caida.example.com') });
  w.apps['https://caida.example.com'] = { codigo: 503 };
  w.c.vigilar();
  w.envio(BUENO('bd-alumnado-ies'));
  for (let i = 0; i < 10; i++) w.pasada();
  const n = (re) => w.cuantos(re);
  comprobar('1. espera: un solo correo en diez pasadas', n(/Claude Code espera tu respuesta \(fila 214\)/), 1);
  comprobar('1. parada: uno solo', n(/la fila 30 lleva parada desde las 09:00/), 1);
  comprobar('1. publicación fallada: uno solo', n(/la última publicación ha fallado/), 1);
  comprobar('1. aviso de usuario: uno solo', n(/aviso nuevo de un usuario/), 1);
  comprobar('1. app caída: uno solo', n(/la app no abre/), 1);
  comprobar('1. y no hay ningún otro correo', w.correos.length, 5);
  comprobar('1. asunto: «Centro de mando · <app>: <qué pasa>»', w.asuntos().every((a) => /^Centro de mando · .+: .+/.test(a)), true);
  const esp = w.correos.find((x) => /espera tu respuesta/.test(x.asunto));
  comprobar('1. el correo lleva el Centro de mando y la conversación de la fila', [/claude\.ai\/artifact\/7pDUJyXkUbPwuccZRx6J7E/.test(esp.cuerpo), /code\/session_AAA/.test(esp.cuerpo)], [true, true]);
  const av = w.correos.find((x) => /aviso nuevo/.test(x.asunto));
  comprobar('1. el correo del aviso lleva pantalla y enlace, nunca el texto ni el nombre', [/Guardias/.test(av.cuerpo), /drive\.test/.test(av.cuerpo), /SECRETO|Pérez|Pepe/.test(av.asunto + av.cuerpo)], [true, true, false]);
  comprobar('1. llegan a la dirección del dueño del script', w.correos.every((x) => x.para === 'dueno@ejemplo.es'), true);

  /* 2. Se retoma (hay un paso nuevo) y se vuelve a parar: suceso nuevo. */
  w.repos.get('fmargon780/app-parada').actividad.push({ ref: 'refs/heads/fila-30', timestamp: new Date(w.t).toISOString() });
  w.pasada();
  comprobar('2. retomada: no hay correo mientras trabaja', n(/lleva parada/), 1);
  w.pasada(120);
  comprobar('2. vuelve a pararse: un correo nuevo', n(/lleva parada/), 2);
  w.pasada(); w.pasada();
  comprobar('2. y sin repetirse', n(/lleva parada/), 2);

  /* 9. El fichero de estado. */
  const f = JSON.parse(w.estado().contenido);
  comprobar('9. el fichero de estado tiene la forma acordada',
    [typeof f.version, typeof f.actualizado, f.cadaMinutos, Object.keys(f).sort().join()], ['string', 'string', 10, 'actualizado,avisos,cadaMinutos,repos,version']);
  const rc = f.repos['fmargon780/app-caida'].app;
  comprobar('9. app caída: estado y desde', [rc.estado, rc.url, typeof rc.desde, Object.keys(rc).sort().join()], ['caida', 'https://caida.example.com', 'string', 'alcance,comprobado,desde,estado,url']);
  comprobar('9. app sin dirección: sin-vigilar', f.repos['fmargon780/app-parada'].app.estado, 'sin-vigilar');
  comprobar('9. avisos: clave repo#fila', f.avisos['fmargon780/bd-alumnado-ies#8'], { estado: 'sin-correo', fecha: '2026-10-06' });
  comprobar('9. un solo fichero ESTADO-VIGILANTE.json tras muchas pasadas', [...w.avisos().ficheros.keys()].filter((k) => /ESTADO/.test(k)), ['ESTADO-VIGILANTE.json']);
  comprobar('9. la memoria está en _VIGILANTE', w.avisos().hijas.has('_VIGILANTE'), true);
  comprobar('9. el estado no lleva nombres, correos ni texto', /SECRETO|Pérez|Pepe|@/.test(w.estado().contenido), false);
}

/* 3. Publicación saltada a propósito y tope de Vercel: ningún correo. */
{
  const w = mundo(MEDIODIA);
  const r = w.repo('app-vercel', { cola: tabla([[1, 'HECHA']]), estado: [{ context: 'Vercel', state: 'success', description: 'Canceled by Ignored Build Step' }] });
  w.c.vigilar(); w.pasada();
  comprobar('3. «Canceled by Ignored Build Step» no es fallo', w.correos.length, 0);
  r.estado = [{ context: 'Vercel', state: 'failure', description: 'Canceled by Ignored Build Step' }];
  w.pasada();
  comprobar('3. aunque llegue como failure', w.correos.length, 0);
  r.estado = [{ context: 'Vercel', state: 'error', description: 'Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day").' }];
  w.pasada();
  comprobar('3. el tope diario de la cuenta no es fallo', w.correos.length, 0);
  r.estado = [{ context: 'Vercel', state: 'pending', description: 'Building' }];
  w.pasada();
  comprobar('3. publicándose tampoco', w.correos.length, 0);
  r.estado = [{ context: 'Vercel', state: 'failure', description: 'Deployment failed' }];
  w.pasada();
  comprobar('3. un fallo de verdad sí', w.cuantos(/la última publicación ha fallado/), 1);
  /* una fila que pasa a SIN PUBLICACIÓN COMPROBADA o a BLOQUEADA */
  r.cola = tabla([[1, 'HECHA'], [2, 'SIN PUBLICACIÓN COMPROBADA · SHA abc'], [3, 'BLOQUEADA (motivo)']]);
  w.pasada(); w.pasada();
  comprobar('3. fila SIN PUBLICACIÓN COMPROBADA: un correo', w.cuantos(/la fila 2 no se ha podido comprobar publicada/), 1);
  comprobar('3. fila BLOQUEADA: un correo', w.cuantos(/la fila 3 se ha quedado BLOQUEADA/), 1);
}

/* 4. La noche: silencio de 23:00 a 7:00 y un solo resumen a las 7:00. */
{
  const w = mundo(NOCHE);
  const r = w.repo('ausencias-guardias-ies', { cola: tabla([[50, 'EN CURSO (6-oct-2026 22:00)']]), corto: CORTO('https://noche.example.com'),
    actividad: [{ ref: 'refs/heads/fila-50', timestamp: new Date(w.t - 200 * MIN).toISOString() }], estado: [{ context: 'Vercel', state: 'failure', description: 'Deployment failed' }] });
  const arreglo = w.repo('app-arreglo', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://arreglo.example.com'), estado: [{ context: 'Vercel', state: 'failure', description: 'Deployment failed' }] });
  w.apps['https://noche.example.com'] = { codigo: 500 };
  w.apps['https://arreglo.example.com'] = { codigo: 500 };
  w.c.vigilar();                              /* 23:00 */
  for (let h = 0; h < 3; h++) w.pasada(60);   /* 00:00, 01:00, 02:00 */
  comprobar('4. a las 2:00 no ha salido ningún correo', [new Date(w.t).toISOString().slice(11, 13), w.correos.length], ['00', 0]);
  w.envio(BUENO('ausencias-guardias-ies'));
  comprobar('4. ni siquiera el aviso de un usuario llegado de noche', w.correos.length, 0);
  /* durante la noche se arregla la publicación de app-arreglo y su app */
  arreglo.estado = [{ context: 'Vercel', state: 'success', description: 'Deployment has completed' }];
  w.apps['https://arreglo.example.com'] = { codigo: 200 };
  w.pasada(60);                               /* 03:00 Madrid */
  comprobar('4. arreglarse de noche tampoco manda nada', w.correos.length, 0);
  w.pasada(60); w.pasada(60);                 /* 04:00, 05:00 Madrid */
  comprobar('4. a las 6:00 sigue sin salir nada', w.correos.length, 0);
  w.pasada(60);                               /* 06:00 */
  w.pasada(60);                               /* 07:00 */
  comprobar('4. a las 7:00 sale un solo correo', [w.correos.length, w.correos[0] && w.correos[0].asunto], [1, 'Centro de mando · resumen de la noche']);
  const c = (w.correos[0] || {}).cuerpo || '';
  comprobar('4. cuenta lo que sigue siendo verdad: fila parada, app caída, publicación y aviso', [/fila 50 lleva parada/.test(c), /la app no abre/.test(c), /la última publicación ha fallado/.test(c), /aviso nuevo/.test(c)], [true, true, true, true]);
  comprobar('4. y no cuenta lo que se arregló de noche', /app-arreglo/.test(c), false);
  w.pasada(); w.pasada();
  comprobar('4. después no se repite', w.correos.length, 1);
}

/* 5 y 6. La app abre. */
{
  const w = mundo(MEDIODIA);
  w.repo('app-a', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://a.example.com') });
  w.repo('app-g', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://g.example.com') });
  w.repo('app-n', { cola: tabla([[1, 'HECHA']]), corto: '# Sin dirección escrita\n' });
  w.repo('app-error', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://error.example.com') });
  w.repo('app-pruebas', { cola: tabla([[1, 'HECHA']]), corto: '- Dirección publicada: https://pruebas.example.com y la buena https://buena.example.com\n' });
  w.apps['https://a.example.com'] = { codigo: 200 };
  w.apps['https://g.example.com'] = { codigo: 200, texto: '<a href="https://accounts.google.com/ServiceLogin?x=1">Iniciar sesión</a>' };
  w.apps['https://error.example.com'] = { codigo: 200, texto: '<html><title>Error</title>Script function not found: doGet</html>' };
  w.apps['https://buena.example.com'] = { codigo: 200 };
  w.c.vigilar();
  w.pasada();
  const f = () => JSON.parse(w.estado().contenido).repos;
  comprobar('6. app normal: bien, entera', [f()['fmargon780/app-a'].app.estado, f()['fmargon780/app-a'].app.alcance], ['bien', 'entera']);
  comprobar('6. entrada de Google: bien, alcance «entrada»', [f()['fmargon780/app-g'].app.estado, f()['fmargon780/app-g'].app.alcance], ['bien', 'entrada']);
  comprobar('6. sin dirección: sin-vigilar', f()['fmargon780/app-n'].app.estado, 'sin-vigilar');
  comprobar('6. la dirección de pruebas se salta: se vigila la buena', f()['fmargon780/app-pruebas'].app.url, 'https://buena.example.com');
  comprobar('5. la página de error de Apps Script es mal; con dos pasadas seguidas, caída', w.cuantos(/app error: la app no abre/), 1);
  comprobar('5. y nada más ha avisado', w.correos.length, 1);

  /* una sola pasada mal no avisa */
  w.apps['https://a.example.com'] = { codigo: 404 };
  w.pasada();
  comprobar('5. una sola pasada mal no avisa', w.cuantos(/app a: la app no abre/), 0);
  comprobar('5. y en el fichero sigue «bien»', f()['fmargon780/app-a'].app.estado, 'bien');
  w.apps['https://a.example.com'] = { codigo: 200 };
  w.pasada(); w.apps['https://a.example.com'] = 'no-conecta'; w.pasada(); w.pasada();
  comprobar('5. no conectar cuenta como mal: dos seguidas, caída', w.cuantos(/app a: la app no abre/), 1);
  w.apps['https://a.example.com'] = { codigo: 200 };
  w.pasada(35);
  const corto = w.correos.find((x) => /app a: la app ya funciona/.test(x.asunto));
  comprobar('5. al volver, correo corto con cuánto ha durado', [!!corto, corto && /35 minutos|minutos/.test(corto.cuerpo)], [true, true]);
  w.pasada(); w.pasada();
  comprobar('5. y no se repite', w.cuantos(/app a: la app ya funciona/), 1);
}
{
  /* Caída de noche arreglada antes de las 7:00: ni «no abre» ni «ya funciona». */
  const w = mundo(NOCHE);
  w.repo('app-n', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://n.example.com') });
  w.apps['https://n.example.com'] = { codigo: 500 };
  w.c.vigilar(); w.pasada(60); w.pasada(60);
  w.apps['https://n.example.com'] = { codigo: 200 };
  w.pasada(60); w.pasada(60); w.pasada(60); w.pasada(60); w.pasada(60);
  comprobar('5. caída de noche arreglada antes de las 7:00: ningún correo', [w.correos.length, new Date(w.t).toISOString().slice(11, 13)], [0, '04']);
  w.pasada(60); w.pasada(60); w.pasada(60);
  comprobar('5. ni siquiera a las 7:00', w.correos.length, 0);
}
{
  /* Caída avisada de día, y vuelve de noche: se cuenta a las 7:00. */
  const w = mundo('2026-10-06T19:00:00Z');   /* 21:00 Madrid */
  w.repo('app-n', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://n.example.com') });
  w.apps['https://n.example.com'] = { codigo: 500 };
  w.c.vigilar(); w.pasada(10);
  comprobar('5. caída de día avisada', w.cuantos(/la app no abre/), 1);
  w.apps['https://n.example.com'] = { codigo: 200 };
  w.pasada(10);
  comprobar('5. volver a las 21:20 manda el correo corto', w.cuantos(/la app ya funciona/), 1);
}

/* 7 y 8. Contestar a quien avisó. */
{
  const w = mundo(MEDIODIA);
  w.props.CORREO_AVISOS = 'jefe@ejemplo.es, otro@ejemplo.es';
  const r = w.repo('normativa-escolarizacion', { cola: tabla([[10, 'HECHA']]) });
  const A = w.envio(BUENO('normativa-escolarizacion', { correo: 'ana@ejemplo.es', pantalla: 'Guardias' }));          /* fila 11 */
  const B = w.envio(BUENO('normativa-escolarizacion', { correo: 'berta@ejemplo.es', tipo: 'mejora', pantalla: 'Inicio' }));  /* 12 */
  const C = w.envio(BUENO('normativa-escolarizacion', {}));                                                           /* 13: sin correo */
  const D = w.envio(BUENO('normativa-escolarizacion', { correo: 'JEFE@ejemplo.es' }));                                /* 14: propio */
  const E = w.envio(BUENO('normativa-escolarizacion', { correo: 'eva@ejemplo.es' }));                                 /* 15: descartada */
  const F = w.envio(BUENO('normativa-escolarizacion', { correo: 'fina@ejemplo.es' }));                                /* 16: ya no está en la cola, consta hecha */
  const G = w.envio(BUENO('normativa-escolarizacion', { correo: 'gema@ejemplo.es' }));                                /* 17: ya no está, no consta */
  const H = w.envio(BUENO('normativa-escolarizacion', { correo: 'no es un correo' }));                                /* 18: mal formado */
  comprobar('8. un correo mal formado no rechaza el aviso', [H.ok, H.fila], [true, 18]);
  comprobar('7. las filas de los avisos', [A.fila, B.fila, C.fila, D.fila, E.fila, F.fila, G.fila], [11, 12, 13, 14, 15, 16, 17]);
  const nCorreos = w.correos.length;
  const antes = w.estado ? 0 : 0;
  w.c.vigilar();
  const mem0 = w.memoria();
  comprobar('7. al recordarlos: esperando, sin-correo, propio', [mem0.avisos['fmargon780/normativa-escolarizacion#11'].estado, mem0.avisos['fmargon780/normativa-escolarizacion#13'].estado, mem0.avisos['fmargon780/normativa-escolarizacion#14'].estado,
    mem0.avisos['fmargon780/normativa-escolarizacion#18'].estado], ['esperando', 'sin-correo', 'propio', 'sin-correo']);
  const enviadosA = () => w.correos.filter((x) => /ya está resuelto|ya está hecha/.test(x.asunto));
  comprobar('7. mientras las filas no están HECHAS no se contesta', enviadosA().length, 0);
  /* las filas pasan a HECHA / DESCARTADA; las dos últimas desaparecen de la cola */
  r.cola = r.cola.split('\n').filter((l) => !/^\| (16|17) \|/.test(l)).map((l) => l.replace(/^(\| (?:11|12|13|14) \|.*?\| )IDEA[^|]*/, '$1HECHA (6-oct-2026) ').replace(/^(\| 15 \|.*?\| )IDEA[^|]*/, '$1DESCARTADA (6-oct-2026) ')).join('\n');
  r.historia = '# Historia\n\n- 6-oct-2026 · fila 16 HECHA: lo que fuera\n- fila 99 HECHA\n';
  w.pasada();
  const mem = w.memoria();
  const e = enviadosA();
  const aAna = e.find((x) => x.para === 'ana@ejemplo.es');
  comprobar('7. fila HECHA: un correo a quien avisó, con el texto fijo', [!!aAna, aAna && aAna.asunto, aAna && aAna.cuerpo],
    [true, 'Mi App: tu aviso ya está resuelto', 'Hola. Tu aviso del 6 de octubre en la pantalla «Guardias» de Mi App ya está resuelto. Ábrela y compruébalo. Si sigue fallando, vuelve a pulsar el botón de soporte. Este correo sale solo; si respondes, le llega a Francisco.']);
  comprobar('7. responder va a la primera dirección de Francisco', aAna && aAna.replyTo, 'jefe@ejemplo.es');
  const aBerta = e.find((x) => x.para === 'berta@ejemplo.es');
  comprobar('7. una propuesta: «tu propuesta ya está hecha»', [aBerta && aBerta.asunto, aBerta && /Tu propuesta del 6 de octubre/.test(aBerta.cuerpo)], ['Mi App: tu propuesta ya está hecha', true]);
  comprobar('7. el correo no cita lo que escribió la persona', /SECRETO|Pérez|Pepe/.test(JSON.stringify(e)), false);
  comprobar('7. DESCARTADA: ningún correo, queda descartado', [e.some((x) => x.para === 'eva@ejemplo.es'), mem.avisos['fmargon780/normativa-escolarizacion#15'].estado], [false, 'descartado']);
  comprobar('7. sin correo y el de Francisco: no se escribe a nadie más', e.map((x) => x.para).sort(), ['ana@ejemplo.es', 'berta@ejemplo.es', 'fina@ejemplo.es']);
  comprobar('7. fuera de la cola pero hecha en la historia: se contesta', [e.some((x) => x.para === 'fina@ejemplo.es'), mem.avisos['fmargon780/normativa-escolarizacion#16'].estado], [true, 'contestado']);
  comprobar('7. fuera de la cola y sin constar: no-encontrada', mem.avisos['fmargon780/normativa-escolarizacion#17'].estado, 'no-encontrada');
  w.pasada(); w.pasada();
  comprobar('7. no se vuelve a contestar', enviadosA().length, 3);
  /* 8. el correo de quien avisa no está en la cola ni en el estado */
  const todoElCorreo = ['ana@', 'berta@', 'eva@', 'fina@', 'gema@', 'JEFE@', 'jefe@'];
  comprobar('8. el correo de quien avisa no aparece en la cola', todoElCorreo.some((x) => r.cola.includes(x)), false);
  comprobar('8. ni en ESTADO-VIGILANTE.json', todoElCorreo.some((x) => w.estado().contenido.includes(x)) || /@/.test(w.estado().contenido), false);
  const txt = [...w.avisos().hijas.get('Mi App').ficheros.values()].find((f) => f.contenido.includes('ana@ejemplo.es'));
  comprobar('8. sí está en el fichero de Drive del aviso, en un renglón «Correo:»', !!txt && /\nCorreo: ana@ejemplo\.es\n/.test(txt.contenido), true);
  const txtMal = [...w.avisos().hijas.get('Mi App').ficheros.values()].filter((f) => /no es un correo/.test(f.contenido));
  comprobar('8. el correo mal formado no se guarda', txtMal.length, 0);
  comprobar('7. al recibirlos solo salieron los avisos nuevos', nCorreos, 8);
  void antes;
  /* de noche, la contestación espera a las 7:00 */
}
{
  const w = mundo('2026-10-06T20:30:00Z');   /* 22:30 */
  const r = w.repo('ausencias-guardias-ies', { cola: tabla([[10, 'HECHA']]) });
  w.envio(BUENO('ausencias-guardias-ies', { correo: 'ana@ejemplo.es' }));
  w.c.vigilar();
  r.cola = r.cola.replace(/IDEA[^|]*/, 'HECHA (hoy) ');
  w.pasada(60); w.pasada(60);
  const antes = w.correos.filter((x) => x.para === 'ana@ejemplo.es').length;
  w.pasada(400);
  comprobar('7. de noche no se contesta; a las 7:00 sale uno por aviso', [antes, w.correos.filter((x) => x.para === 'ana@ejemplo.es').length], [0, 1]);
}

/* 10. prepararTodo. */
{
  const w = mundo(MEDIODIA);
  w.repo('app-uno', { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://uno.example.com') });
  w.repo('app-dos', { cola: tabla([[1, 'HECHA']]) });
  w.repo('app-estado-malo', { cola: tabla([[1, 'EN CURSO (6-oct-2026 09:00)']]), actividad: [{ ref: 'refs/heads/main', timestamp: new Date(w.t - 300 * MIN).toISOString() }] });
  w.apps['https://uno.example.com'] = { codigo: 200, texto: '<a href="https://accounts.google.com/x">entra</a>' };
  w.c.prepararTodo(); w.c.prepararTodo(); w.c.prepararTodo();
  comprobar('10. un solo disparador tras tres ejecuciones', w.disparadores, ['vigilar']);
  comprobar('10. la pasada de prueba no manda avisos (solo el correo de resumen)', [w.correos.length, w.correos.every((x) => /prueba del buzón/.test(x.asunto))], [3, true]);
  const resumen = w.correos[0].cuerpo;
  comprobar('10. el resumen dice a qué direcciones llegan los avisos', /Los avisos llegarán a: dueno@ejemplo\.es/.test(resumen), true);
  comprobar('10. y qué repositorios vigila', /fmargon780\/app-uno, fmargon780\/app-dos, fmargon780\/app-estado-malo/.test(resumen), true);
  comprobar('10. y cada app: dirección, entrada de Google, sin vigilar', [/app-uno: https:\/\/uno\.example\.com — solo se llega a la entrada de Google/.test(resumen), /app-dos: sin vigilar/.test(resumen)], [true, true]);
  /* lo que la prueba vio, luego sí se avisa */
  w.pasada();
  comprobar('10. la pasada real después sí avisa de lo que la prueba no avisó', w.cuantos(/lleva parada/), 1);
}

/* 11. GitHub falla a mitad: sin correos falsos, sin memoria estropeada. */
{
  const w = mundo(MEDIODIA);
  const hace = (min) => new Date(w.t - min * MIN).toISOString();
  const r = w.repo('app-g', { cola: tabla([[214, 'EN CURSO (6-oct-2026 09:00)']]),
    esperando: { estado: 'esperando', fila: '214', motivo: 'pregunta', desde: hace(30), mensaje: '' }, actividad: [{ ref: 'refs/heads/main', timestamp: hace(20) }],
    estado: [{ context: 'Vercel', state: 'failure', description: 'Deployment failed' }], corto: CORTO('https://g.example.com') });
  w.repo('app-b', { cola: tabla([[1, 'HECHA']]) });
  w.apps['https://g.example.com'] = { codigo: 200 };
  w.c.vigilar();
  const avisados = w.correos.length;
  const memAntes = JSON.stringify(w.memoria().avisados);
  comprobar('11. al principio avisa de lo suyo', avisados, 2);
  w.caidos.add('fmargon780/app-g');
  w.pasada(); w.pasada();
  comprobar('11. con GitHub caído no sale ningún correo falso (ni «libre», ni «arreglado»)', w.correos.length, avisados);
  comprobar('11. y la memoria de lo ya avisado sigue igual', JSON.stringify(w.memoria().avisados), memAntes);
  w.caidos.delete('fmargon780/app-g');
  w.pasada();
  comprobar('11. al volver GitHub no se repite nada', w.correos.length, avisados);
  /* un correo que falla no estropea la pasada: se reintenta en la siguiente */
  r.esperando = { estado: 'esperando', fila: '214', motivo: 'pregunta', desde: hace(5), mensaje: '' };
  w.falloEnviando = true;
  w.pasada();
  w.falloEnviando = false;
  w.pasada();
  comprobar('11. si el correo falla, la siguiente pasada lo manda (una sola vez)', w.cuantos(/Claude Code espera tu respuesta/), 2);
  /* todo el repositorio caído en la lista: respaldo */
  const w2 = mundo(MEDIODIA);
  w2.repo('app-x', { cola: tabla([[1, 'HECHA']]) });
  w2.caidos.add('fmargon780/app-x');
  w2.c.vigilar();
  comprobar('11. repositorio que no responde: ni correo ni fallo', w2.correos.length, 0);
}

/* Llamadas por pasada (para docs/PONER-EN-MARCHA-SOPORTE.md). */
{
  const w = mundo(MEDIODIA);
  for (let i = 0; i < 13; i++) w.repo('app' + i, { cola: tabla([[1, 'HECHA']]), corto: CORTO('https://app' + i + '.example.com') });
  for (let i = 0; i < 13; i++) w.apps['https://app' + i + '.example.com'] = { codigo: 200 };
  w.c.vigilar();
  const primera = w.llamadas;
  w.llamadas = 0; w.pasada();
  console.log('       (13 proyectos, sin filas EN CURSO: primera pasada ' + primera + ' llamadas, las siguientes ' + w.llamadas + ')');
  comprobar('8b. menos de 12.000 llamadas al día con 13 proyectos', w.llamadas * 144 < 12000, true);
}

/* Comprobaciones del fichero. */
{
  comprobar('5. soporte.gs no lleva ninguna dirección de correo escrita', /[\w.+-]+@[\w-]+\.[\w.-]+/.test(codigo), false);
  comprobar('5. VERSION_SCRIPT ha cambiado', /VERSION_SCRIPT = '6-oct-2026 · fila 268'/.test(codigo), true);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
