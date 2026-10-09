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
   6. Sin permiso de GitHub guardado, igual.

   Fila 261 (docs/BUZON-PARA-TODAS-LAS-APPS.md):
   7. Un aviso de cada repositorio de la lista se acepta; de otro, no.
   8. La fila IDEA, en la forma de cada cola: tres columnas, cuatro, apartados;
      sin el texto del usuario en ninguna.
   9. `captura` con `data:image/…;base64,` y `errores` en lista.
  10. GitHub responde 403: ok con colaApuntada false, un correo, y un segundo
      aviso del mismo repositorio el mismo día no manda otro.
  11. `prepararTodo` recorre la lista: «Bien» y «OJO», sin escribir en ninguna cola.  */
import fs from 'node:fs';
import vm from 'node:vm';

const codigo = fs.readFileSync(new URL('../apps-script/soporte.gs', import.meta.url), 'utf8');

function montar({ cola, respuestasPut, codigosGet = {}, repoVisible = {} }) {
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
  const registro = [], correos = [], propiedades = {};
  const puts = [...respuestasPut];
  const contexto = {
    console, JSON, Date, Error, String, parseInt, RegExp,
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    Logger: { log(t) { registro.push(t); } },
    MailApp: { sendEmail(para, asunto, cuerpo) { correos.push({ para, asunto, cuerpo }); } },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'dueno@ejemplo.es' }) },
    DriveApp: {
      getFoldersByName(n) { const h = raiz.hijas.get(n); return { hasNext: () => !!h, next: () => h }; },
      createFolder(n) { const c = carpeta('raiz/' + n); raiz.hijas.set(n, c); return c; }
    },
    Utilities: {
      formatDate: (d, z, f) => f === 'd-M-yyyy' ? '30-9-2026' : f === 'yyyy-MM-dd' ? '2026-09-30' : '2026-09-30 101500',
      Charset: { UTF_8: 'utf8' },
      base64Decode: (s) => Buffer.from(s, 'base64'),
      base64Encode: (t) => Buffer.from(t, 'utf8').toString('base64'),
      newBlob: (b, tipo, nombre) => ({ bytes: b, tipo, nombre, getDataAsString: () => Buffer.from(b).toString('utf8') })
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k === 'GITHUB_TOKEN') ? (contexto.__sinToken ? null : 'tok') : (propiedades[k] || null),
      setProperty: (k, v) => { propiedades[k] = v; } }) },
    UrlFetchApp: {
      fetch(url, p) {
        peticiones.push({ url, metodo: p.method, cuerpo: p.payload ? JSON.parse(p.payload) : null });
        const dentro = /\/repos\/([^/]+\/[^/]+)(\/contents\/|$)/.exec(url);
        const repo = dentro && dentro[1];
        if (p.method === 'get' && dentro && dentro[2] === '' ) {
          return { getResponseCode: () => repoVisible[repo] || 200, getContentText: () => '{}' };
        }
        if (p.method === 'get' && repo && codigosGet[repo]) {
          return { getResponseCode: () => codigosGet[repo], getContentText: () => '{}' };
        }
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
  return { contexto, ficheros, peticiones, registro, correos, cola: () => laCola };
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

/* Fila 240: sin tope de texto. Uno de 50.000 caracteres se guarda entero, sin cortes. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  const largo = 'palabra '.repeat(6250) + 'FINAL-DEL-TEXTO';
  const r = envio(m, { ...BUENO, texto: largo });
  comprobar('1b. un texto de 50.000 caracteres se acepta', r.ok, true);
  const txt = m.ficheros.find((f) => f.nombre.endsWith('.txt'));
  comprobar('1b. el .txt lo guarda entero, sin cortes', txt && txt.contenido.indexOf(largo) > -1, true);
  comprobar('1b. ya no existe «El texto es demasiado largo»', r.motivo === undefined && !/demasiado largo/.test(JSON.stringify(r)), true);
  const colaTexto = JSON.stringify(m.cola());
  comprobar('1b. la cola sigue sin llevar el texto del usuario', colaTexto.indexOf('palabra palabra') === -1 && colaTexto.indexOf('FINAL-DEL-TEXTO') === -1, true);
  const enorme = envio(montar({ cola: COLA, respuestasPut: [] }), 'x'.repeat(6000001));
  comprobar('1b. el único tope es el del mensaje entero, dicho en llano', /demasiado grande/.test(enorme.motivo), true);
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

/* ---------- fila 261 ---------- */
const LISTA = ['gestor-asuntos-ies', 'bd-alumnado-ies', 'ausencias-guardias-ies', 'normativa-escolarizacion', 'migracion-dropbox-drive',
  'Disciplina-IES', 'club-tolox-corre', 'comparador-listas', 'Partituras-de-Caja-Clara', 'Cancionero-Parroquia',
  'Parroquia_Conteo_Colectas', 'ERP-Nutricion', 'Focus_Lingo', 'centro-de-datos-ies'].map((r) => 'fmargon780/' + r);
const COLA4 = '# Cola\n\n| Nº | Instrucción | Estado | Notas |\n|---|---|---|---|\n| 3 | `a` | HECHA | nota \\| con barra |\n| 9 | `b` | PENDIENTE | |\n\n## Más\n\n- algo\n';
const COLA_APARTADOS = '# Cola de la app\n\n## 1. Primera cosa — HECHA\n\nTexto.\n\n## 4. Otra cosa — PENDIENTE\n\nMás texto.\n';

/* 7. Todos los repositorios de la lista. */
{
  LISTA.forEach((repo) => {
    const m = montar({ cola: COLA, respuestasPut: [] });
    comprobar('7. se acepta ' + repo, envio(m, { ...BUENO, repo }).ok, true);
  });
  const m = montar({ cola: COLA, respuestasPut: [] });
  const r = envio(m, { ...BUENO, repo: 'fmargon780/otro-cualquiera' });
  comprobar('7. otro repositorio se rechaza con su motivo', [r.ok, r.motivo], [false, 'Este repositorio no puede mandar avisos.']);
}

/* 8. La forma de cada cola. */
{
  const m3 = montar({ cola: COLA, respuestasPut: [] });
  envio(m3, { ...BUENO, repo: 'fmargon780/bd-alumnado-ies' });
  comprobar('8. tres columnas: como siempre', m3.cola().split('\n').find((l) => l.startsWith('| 231 ')).replace(/https:[^ ]+/, 'ENLACE'),
    '| 231 | Aviso de usuario: error en «Inicio» | IDEA (30-sep-2026): enviada por un usuario desde el botón de soporte · aviso completo: ENLACE |');

  const m4 = montar({ cola: COLA4, respuestasPut: [] });
  const r4 = envio(m4, { ...BUENO, repo: 'fmargon780/ausencias-guardias-ies' });
  const f4 = m4.cola().split('\n').find((l) => l.startsWith('| 10 '));
  comprobar('8. cuatro columnas: número siguiente', r4.fila, 10);
  comprobar('8. cuatro columnas: IDEA (fecha) sola en la tercera y el enlace en la cuarta',
    f4.replace(/https:[^ ]+/, 'ENLACE'),
    '| 10 | Aviso de usuario: error en «Inicio» | IDEA (30-sep-2026) | Enviada por un usuario desde el botón de soporte · aviso completo: ENLACE |');
  comprobar('8. cuatro columnas: cuatro celdas', f4.split('|').length, 6);
  comprobar('8. cuatro columnas: va justo tras la última fila', m4.cola().split('\n').indexOf(f4), m4.cola().split('\n').indexOf('| 9 | `b` | PENDIENTE | |') + 1);

  const ma = montar({ cola: COLA_APARTADOS, respuestasPut: [] });
  const ra = envio(ma, { ...BUENO, repo: 'fmargon780/Disciplina-IES', tipo: 'mejora' });
  const nueva = ma.cola().replace(/https:[^ \n]+/, 'ENLACE');
  comprobar('8. apartados: número siguiente', ra.fila, 5);
  comprobar('8. apartados: apartado nuevo al final con su línea', nueva.slice(COLA_APARTADOS.length - 1),
    '\n\n## 5. Aviso de usuario: mejora en «Inicio» — IDEA (30-sep-2026)\n\nEnviada por un usuario desde el botón de soporte · aviso completo: ENLACE\n');
  comprobar('8. apartados: lo anterior queda igual', ma.cola().startsWith(COLA_APARTADOS.replace(/\s*$/, '')), true);

  for (const [n, m] of [['tres columnas', m3], ['cuatro columnas', m4], ['apartados', ma]]) {
    comprobar('8. ' + n + ': nada del usuario en la cola', ['SECRETO', 'Pérez', 'Francisco-Marmol', 'fallo raro'].some((t) => m.cola().indexOf(t) > -1), false);
  }
  const mx = montar({ cola: '# Sin nada que entender\n', respuestasPut: [] });
  comprobar('8. cola que no se entiende: aviso guardado, nada inventado', [envio(mx, BUENO).colaApuntada, mx.ficheros.length, mx.peticiones.filter((p) => p.metodo === 'put').length], [false, 1, 0]);
}

/* 8c. El Centro de datos (fila 315): cola de cuatro columnas. */
{
  const m = montar({ cola: COLA4, respuestasPut: [] });
  const r = envio(m, { ...BUENO, app: 'Centro de datos', repo: 'fmargon780/centro-de-datos-ies' });
  const f = m.cola().split('\n').find((l) => l.startsWith('| 10 '));
  comprobar('315. Centro de datos: se acepta', r.ok, true);
  comprobar('315. Centro de datos: cuatro celdas, IDEA (fecha) sola en la tercera y el enlace en la cuarta',
    [f.split('|').length, f.replace(/https:[^ ]+/, 'ENLACE')],
    [6, '| 10 | Aviso de usuario: error en «Inicio» | IDEA (30-sep-2026) | Enviada por un usuario desde el botón de soporte · aviso completo: ENLACE |']);
  comprobar('315. Centro de datos: nada del usuario en la cola', ['SECRETO', 'Pérez', 'Francisco-Marmol', 'fallo raro'].some((t) => m.cola().indexOf(t) > -1), false);
  const ro = envio(montar({ cola: COLA, respuestasPut: [] }), { ...BUENO, repo: 'fmargon780/otro-cualquiera' });
  comprobar('315. otro repositorio se sigue rechazando', [ro.ok, ro.motivo], [false, 'Este repositorio no puede mandar avisos.']);
}

/* 8b. Focus Lingo (fila 262): cola de cuatro columnas. */
{
  const m = montar({ cola: COLA4, respuestasPut: [] });
  const r = envio(m, { ...BUENO, repo: 'fmargon780/Focus_Lingo' });
  const f = m.cola().split('\n').find((l) => l.startsWith('| 10 '));
  comprobar('262. Focus Lingo: se acepta', r.ok, true);
  comprobar('262. Focus Lingo: cuatro celdas, IDEA (fecha) sola en la tercera y el enlace en la cuarta',
    [f.split('|').length, f.replace(/https:[^ ]+/, 'ENLACE')],
    [6, '| 10 | Aviso de usuario: error en «Inicio» | IDEA (30-sep-2026) | Enviada por un usuario desde el botón de soporte · aviso completo: ENLACE |']);
  comprobar('262. Focus Lingo: nada del usuario en la cola', ['SECRETO', 'Pérez', 'Francisco-Marmol', 'fallo raro'].some((t) => m.cola().indexOf(t) > -1), false);
  const ro = envio(montar({ cola: COLA, respuestasPut: [] }), { ...BUENO, repo: 'fmargon780/otro-cualquiera' });
  comprobar('262. otro repositorio se sigue rechazando', [ro.ok, ro.motivo], [false, 'Este repositorio no puede mandar avisos.']);
}

/* 9. Lo que mandan otras apps de otra forma. */
{
  const m = montar({ cola: COLA, respuestasPut: [] });
  const r = envio(m, { ...BUENO, captura: 'data:image/jpeg;base64,' + Buffer.from('imagen').toString('base64'), errores: ['fallo uno', 'fallo dos'] });
  const jpg = m.ficheros.find((f) => f.nombre.endsWith('.jpg'));
  const txt = m.ficheros.find((f) => f.nombre.endsWith('.txt'));
  comprobar('9. captura con data:image/jpeg se guarda bien', [r.ok, jpg && Buffer.from(jpg.contenido.bytes).toString()], [true, 'imagen']);
  comprobar('9. errores en lista se guardan como texto, uno por línea', txt.contenido.indexOf('Últimos errores de la consola:\nfallo uno\nfallo dos') > -1, true);
  const mp = montar({ cola: COLA, respuestasPut: [] });
  const rp = envio(mp, { ...BUENO, captura: 'data:image/png;base64,' + Buffer.from('pngbytes').toString('base64') });
  const png = mp.ficheros.find((f) => f.nombre.endsWith('.png'));
  comprobar('9. un PNG se guarda con su extensión y su tipo', [rp.ok, png && png.contenido.tipo, png && Buffer.from(png.contenido.bytes).toString()], [true, 'image/png', 'pngbytes']);
  comprobar('9. y el texto nombra esa extensión', mp.ficheros.find((f) => f.nombre.endsWith('.txt')).contenido.indexOf('.png (en esta misma carpeta)') > -1, true);
}

/* 10. GitHub no deja: correo, y uno solo por repositorio y día. */
{
  const m = montar({ cola: COLA, respuestasPut: [], codigosGet: { 'fmargon780/gestor-asuntos-ies': 403 } });
  const r1 = envio(m, BUENO);
  comprobar('10. con 403: ok, guardado, sin cola', [r1.ok, r1.colaApuntada, m.ficheros.length], [true, false, 1]);
  comprobar('10. sale un correo al dueño con el motivo y el enlace, sin el texto del usuario',
    [m.correos.length, m.correos[0].para, /403/.test(m.correos[0].cuerpo), /drive\.test/.test(m.correos[0].cuerpo), /SECRETO|Pérez|Francisco-Marmol/.test(m.correos[0].asunto + m.correos[0].cuerpo)],
    [1, 'dueno@ejemplo.es', true, true, false]);
  envio(m, BUENO);
  comprobar('10. un segundo aviso del mismo repositorio el mismo día no manda otro correo', m.correos.length, 1);
  comprobar('10. el aviso sí se guarda', m.ficheros.length, 2);
  const m2 = montar({ cola: COLA, respuestasPut: [] });
  envio(m2, BUENO);
  comprobar('10. si la cola se apunta bien, no hay correo', m2.correos.length, 0);
}

/* 11. prepararTodo. */
{
  const m = montar({ cola: COLA, respuestasPut: [], codigosGet: { 'fmargon780/bd-alumnado-ies': 403, 'fmargon780/club-tolox-corre': 404, 'fmargon780/comparador-listas': 404 },
    repoVisible: { 'fmargon780/comparador-listas': 404 } });
  m.contexto.prepararTodo();
  comprobar('11. solo lee: ninguna subida', m.peticiones.filter((p) => p.metodo === 'put').length, 0);
  comprobar('11. una línea por repositorio, más carpeta y resumen', m.registro.length, LISTA.length + 2);
  comprobar('11. «Bien» con el tamaño de la cola', m.registro.includes('Bien: fmargon780/gestor-asuntos-ies (cola de 230 filas)'), true);
  comprobar('11. «OJO» si el permiso no llega (403)', m.registro.some((l) => l.indexOf('OJO: fmargon780/bd-alumnado-ies — el permiso de GitHub no llega') === 0), true);
  comprobar('11. «Sin cola» si el permiso llega pero no hay docs/COLA.md', m.registro.some((l) => l.indexOf('Sin cola: fmargon780/club-tolox-corre') === 0), true);
  comprobar('11. 404 con el repositorio invisible: OJO', m.registro.some((l) => l.indexOf('OJO: fmargon780/comparador-listas') === 0), true);
  comprobar('11. resumen de una línea', m.registro[m.registro.length - 1], 'Resumen: 12 bien, 2 con OJO, de 14 repositorios.');
  comprobar('11. correo de prueba con el mismo resumen', [m.correos.length, m.correos[0].cuerpo.indexOf('Resumen: 12 bien, 2 con OJO') === 0], [1, true]);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
