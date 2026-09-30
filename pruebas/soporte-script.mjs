/* Prueba de la fila 213 (docs/BOTON-DE-SOPORTE.md): el buzón
   apps-script/soporte.gs, sin Google, con dobles de Drive, GitHub y
   compañía. Sin navegador.

   1. Rechaza otro repositorio, sin tipo o sin texto, y un cuerpo enorme.
   2. Guarda el aviso entero en SOPORTE-AVISOS/<app> (texto y captura).
   3. La fila de la cola lleva el número siguiente al más alto, va tras
      la última fila de la tabla y NO lleva el texto del usuario, ni su
      nombre, ni la captura.
   4. Si hay conflicto al subir a GitHub, relee y reintenta (hasta 3).
   5. Si GitHub falla del todo, el aviso sigue guardado y la respuesta es
      ok con colaApuntada: false.
   6. Sin permiso de GitHub guardado, igual.  */
import fs from 'node:fs';
import vm from 'node:vm';

const codigo = fs.readFileSync(new URL('../apps-script/soporte.gs', import.meta.url), 'utf8');

function montar({ cola, respuestasPut }) {
  const ficheros = [];
  const carpetas = new Map();
  function carpeta(nombre) {
    if (!carpetas.has(nombre)) {
      const hijas = new Map();
      carpetas.set(nombre, {
        nombre, hijas,
        getFoldersByName(n) { const h = hijas.get(n); return { hasNext: () => !!h, next: () => h }; },
        createFolder(n) { const c = carpeta(nombre + '/' + n); hijas.set(n, c); return c; },
        getUrl: () => 'https://drive.test/carpeta/' + nombre,
        createFile(...a) {
          const f = { nombre: a.length === 1 ? a[0].nombre : a[0], contenido: a.length === 1 ? a[0] : a[1],
                      getUrl: () => 'https://drive.test/f/' + encodeURIComponent(nombre + '/' + (a.length === 1 ? a[0].nombre : a[0])) };
          ficheros.push({ carpeta: nombre, ...f });
          return f;
        }
      });
    }
    return carpetas.get(nombre);
  }
  const raiz = carpeta('raiz');
  let laCola = cola;
  let sha = 1;
  const peticiones = [];
  const puts = [...respuestasPut];
  const contexto = {
    console, JSON, Date, Error, String, parseInt, RegExp,
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    Logger: { log() {} },
    DriveApp: {
      getFoldersByName(n) { const h = raiz.hijas.get(n); return { hasNext: () => !!h, next: () => h }; },
      createFolder(n) { const c = carpeta('raiz/' + n); raiz.hijas.set(n, c); return c; }
    },
    Utilities: {
      formatDate: (d, z, f) => f === 'd-M-yyyy' ? '30-9-2026' : '2026-09-30 101500',
      Charset: { UTF_8: 'utf8' },
      base64Decode: (s) => Buffer.from(s, 'base64'),
      base64Encode: (t) => Buffer.from(t, 'utf8').toString('base64'),
      newBlob: (b, tipo, nombre) => ({ bytes: b, tipo, nombre, getDataAsString: () => Buffer.from(b).toString('utf8') })
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'GITHUB_TOKEN' && !contexto.__sinToken) ? 'tok' : null }) },
    UrlFetchApp: {
      fetch(url, p) {
        peticiones.push({ url, metodo: p.method, cuerpo: p.payload ? JSON.parse(p.payload) : null });
        if (p.method === 'get') {
          return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ sha: 'sha' + sha, content: Buffer.from(laCola, 'utf8').toString('base64') }) };
        }
        const codigo = puts.length ? puts.shift() : 200;
        if (codigo === 200) { laCola = Buffer.from(JSON.parse(p.payload).content, 'base64').toString('utf8'); sha++; }
        return { getResponseCode: () => codigo, getContentText: () => '{}' };
      }
    }
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto, { filename: 'soporte.gs' });
  return { contexto, ficheros, peticiones, cola: () => laCola };
}

const COLA = '# Cola\n\n| Nº | Instrucción | Estado |\n|---|---|---|\n| 12 | `a` | HECHA |\n| 230 | `b` | PENDIENTE |\n| 7 | `c` | IDEA |\n\n## Lo que queda\n\n- algo\n';
const BUENO = { app: 'Gestor de Asuntos', repo: 'fmargon780/gestor-asuntos-ies', tipo: 'error',
  texto: 'SECRETO-DEL-USUARIO: el alumno Pérez no sale', pantalla: 'Inicio', quien: 'Francisco-Marmol',
  fecha: '2026-09-30 10:15', version: '30-sep-2026 · 10:00', errores: '10:14 fallo raro' };
const envio = (m, d) => JSON.parse(m.contexto.doPost({ postData: { contents: typeof d === 'string' ? d : JSON.stringify(d) } }).t);

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* 1. Rechazos. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  comprobar('1. otro repositorio', envio(m, { ...BUENO, repo: 'otro/repo' }).ok, false);
  comprobar('1. sin tipo', envio(m, { ...BUENO, tipo: 'x' }).ok, false);
  comprobar('1. sin texto', envio(m, { ...BUENO, texto: '  ' }).ok, false);
  comprobar('1. captura que no es base64', envio(m, { ...BUENO, captura: '<script>' }).ok, false);
  comprobar('1. cuerpo estropeado', envio(m, 'no es json').ok, false);
  comprobar('1. cuerpo enorme', envio(m, 'x'.repeat(6000001)).ok, false);
  comprobar('1. nada de esto ha tocado Drive ni GitHub', [m.ficheros.length, m.peticiones.length], [0, 0]);
  comprobar('doGet contesta', JSON.parse(m.contexto.doGet().t).ok, true);
}

/* 2 y 3. Un aviso bueno con captura. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  const r = envio(m, { ...BUENO, captura: Buffer.from('imagen').toString('base64') });
  comprobar('2. contesta ok con la cola apuntada', [r.ok, r.colaApuntada, r.fila], [true, true, 231]);
  const txt = m.ficheros.find((f) => f.nombre.endsWith('.txt'));
  const jpg = m.ficheros.find((f) => f.nombre.endsWith('.jpg'));
  comprobar('2. carpeta SOPORTE-AVISOS/<app>', txt && txt.carpeta, 'raiz/SOPORTE-AVISOS/Gestor de Asuntos');
  comprobar('2. el texto guardado lleva todo', ['SECRETO-DEL-USUARIO', 'Francisco-Marmol', 'fallo raro', 'Inicio', 'Versión de la app'].every((t) => txt.contenido.indexOf(t) > -1), true);
  comprobar('2. la captura se guarda como imagen', jpg && Buffer.from(jpg.contenido.bytes).toString(), 'imagen');
  const cola = m.cola();
  const filas = cola.split('\n').filter((l) => l.startsWith('| 231 '));
  comprobar('3. una fila nueva con el número 231', filas.length, 1);
  comprobar('3. va justo tras la última fila de la tabla', cola.split('\n').indexOf(filas[0]), cola.split('\n').indexOf('| 7 | `c` | IDEA |') + 1);
  comprobar('3. formato de la fila', filas[0].replace(/https:[^ ]+/, 'ENLACE'),
    '| 231 | Aviso de usuario: error en «Inicio» | IDEA (30-sep-2026): enviada por un usuario desde el botón de soporte · aviso completo: ENLACE |');
  comprobar('3. el enlace es al fichero de Drive', /aviso completo: https:\/\/drive\.test\/f\//.test(filas[0]), true);
  comprobar('3. NADA del usuario en la cola (texto, nombre, errores, captura)',
    ['SECRETO', 'Pérez', 'Francisco-Marmol', 'fallo raro', 'aW1hZ2Vu'].some((t) => cola.indexOf(t) > -1), false);
  comprobar('3. el resto de la cola queda igual', cola.replace(filas[0] + '\n', ''), COLA);
  const put = m.peticiones.find((p) => p.metodo === 'put');
  comprobar('3. sube con su sha y a main', [put.cuerpo.sha, put.cuerpo.branch], ['sha1', 'main']);
}

/* La pantalla con signos raros o larga no rompe la tabla. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  envio(m, { ...BUENO, tipo: 'mejora', pantalla: 'Ficha | de\nAna | ' + 'x'.repeat(200) });
  const fila = m.cola().split('\n').find((l) => l.startsWith('| 231 '));
  comprobar('3. una pantalla con | y saltos no rompe la fila', fila.split('|').length, 5);
  comprobar('3. una mejora dice mejora', fila.indexOf('mejora en «') > -1, true);
}

/* 4. Conflicto y reintento. */
{
  const m = montar({ cola: COLA, respuestasPut: [409, 409] });
  const r = envio(m, BUENO);
  comprobar('4. tras dos conflictos, al tercero entra', [r.ok, r.colaApuntada], [true, true]);
  comprobar('4. relee cada vez (3 lecturas, 3 subidas)', [m.peticiones.filter((p) => p.metodo === 'get').length, m.peticiones.filter((p) => p.metodo === 'put').length], [3, 3]);
}

/* 5. GitHub falla del todo. */
{
  const m = montar({ cola: COLA, respuestasPut: [409, 409, 409] });
  const r = envio(m, BUENO);
  comprobar('5. tres conflictos: el aviso sigue guardado y se dice', [r.ok, r.colaApuntada, m.ficheros.length], [true, false, 1]);
  const n = montar({ cola: COLA, respuestasPut: [500] });
  comprobar('5. un 500 no se reintenta', [envio(n, BUENO).colaApuntada, n.peticiones.filter((p) => p.metodo === 'put').length], [false, 1]);
}

/* 6. Sin token. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  m.contexto.__sinToken = true;
  const r = envio(m, BUENO);
  comprobar('6. sin permiso de GitHub: ok, guardado, sin cola', [r.ok, r.colaApuntada, m.ficheros.length, m.peticiones.length], [true, false, 1, 0]);
}

/* prepararTodo. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  m.contexto.prepararTodo();
  comprobar('prepararTodo crea la carpeta y solo lee la cola', [m.peticiones.length, m.peticiones[0].metodo], [1, 'get']);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
