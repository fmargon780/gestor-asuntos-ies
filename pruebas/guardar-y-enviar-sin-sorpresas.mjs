/* Prueba de la fila 130 (24-sep-2026, docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md):
   que no se pierda ni se duplique nada.

   En el navegador de verdad, con el disco de mentira de pruebas/navegador.mjs:
   1. Dos cambios seguidos en el tablón, lanzados a la vez: se conservan los dos.
   2. Dos altas seguidas en empresas.csv, a la vez: se conservan las dos.
   3. Una copia en conflicto de personal.csv con una fila nueva en cada lado:
      salen las dos; una con el mismo nombre y datos distintos se queda la
      del fichero real y se apunta para elegir; la copia va a _GESTOR/copias.
   4. Un nombre de asunto de 300 caracteres sale de 150 como mucho, y
      conserva fecha, tipo y tercero; el de documento, de 120 más la extensión.
   5. El envío que vence su tiempo límite dice «No sé si ha salido».

   Sin navegador, con el propio apps-script/gestor-correos.gs en `vm`:
   6. Dos llamadas con el mismo identificador de envío: sale una vez; sin
      identificador, como hasta ahora.
   7. (fila 178) La memoria de un envío ya no depende solo de CacheService
      (6 horas): vaciada la caché, el mismo identificador se recuerda en
      PropertiesService y sigue sin mandarse dos veces. Un grupo de más
      de 60 días se borra solo; uno reciente, no. */
import { chromium } from 'playwright';
import fs from 'fs';
import vm from 'node:vm';

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- 6. el script de Google, simulado ---------- */
console.log('--- 6. el mismo envío no sale dos veces ---');
{
  const codigo = fs.readFileSync(new URL('../apps-script/gestor-correos.gs', import.meta.url), 'utf8');
  const cache = new Map();
  const propiedades = {};
  let enviados = 0;
  const ctx = {
    console,
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'yo@g.educaand.es' }), getActiveUser: () => ({ getEmail: () => '' }), getScriptTimeZone: () => 'Europe/Madrid' },
    /* fila 178: PropertiesService de mentira, guardando de verdad en
       'propiedades' (con getKeys/deleteProperty, que ya usa la memoria
       permanente de idEnvio). formatDate soporta 'yyMMdd' de verdad
       (con la fecha que se le pase), que es lo único que necesita este
       fichero de Utilities aquí. */
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(propiedades, k) ? propiedades[k] : null),
        setProperty: (k, v) => { propiedades[k] = v; },
        deleteProperty: (k) => { delete propiedades[k]; },
        getKeys: () => Object.keys(propiedades)
      })
    },
    Utilities: {
      base64Decode: () => [], newBlob: () => ({}),
      formatDate: (fecha, tz, patron) => {
        const d = (fecha instanceof Date) ? fecha : new Date();
        if (patron === 'yyMMdd') {
          return String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        }
        return d.toISOString();
      }
    },
    GmailApp: {
      createDraft: () => ({ send: () => { enviados++; return { getThread: () => ({ getId: () => 'hilo-' + enviados }), getHeader: () => '<m' + enviados + '@x>' }; } }),
      getThreadById: () => null
    }
  };
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx, { filename: 'gestor-correos.gs' });
  const pedido = { para: 'familia@ejemplo.es', asunto: 'Prueba', cuerpo: 'Hola', idEnvio: 'env-uno' };
  const r1 = ctx.enviarUnaVez(Object.assign({}, pedido));
  const r2 = ctx.enviarUnaVez(Object.assign({}, pedido));
  await comprobar('6. con el mismo identificador, sale una sola vez', Promise.resolve(enviados), 1);
  await comprobar('6. la segunda contesta como bien, con «ya enviado» y el mismo hilo',
    Promise.resolve([r1.ok, !!r1.yaEnviado, r2.ok, !!r2.yaEnviado, r2.hilo === r1.hilo]), [true, false, true, true, true]);
  ctx.enviarUnaVez({ para: 'familia@ejemplo.es', asunto: 'Otro', cuerpo: 'x', idEnvio: 'env-dos' });
  await comprobar('6. otro identificador, otro envío', Promise.resolve(enviados), 2);
  ctx.enviarUnaVez({ para: 'familia@ejemplo.es', asunto: 'Viejo', cuerpo: 'x' });
  ctx.enviarUnaVez({ para: 'familia@ejemplo.es', asunto: 'Viejo', cuerpo: 'x' });
  await comprobar('6. sin identificador (navegador viejo), como hasta ahora', Promise.resolve(enviados), 4);
  await comprobar('6. la respuesta dice la versión del script', Promise.resolve(/fila 178/.test(r1.version || '')), true);

  console.log('--- 7. memoria permanente más allá de las 6 horas (fila 178) ---');
  const clavesHoy = () => Object.keys(propiedades).filter((k) => k.indexOf('enviados-') === 0);
  await comprobar('7. el envío queda apuntado en un grupo "enviados-AAMMDD"', Promise.resolve(clavesHoy().length >= 1), true);
  const grupoHoy = clavesHoy()[0];
  await comprobar('7. dentro está el identificador del envío', Promise.resolve(JSON.parse(propiedades[grupoHoy]).indexOf('env-uno') !== -1), true);

  /* Se "vacía" la caché (como si hubieran pasado las 6 horas de
     CacheService): sin la memoria permanente, esto reenviaría. */
  cache.clear();
  const antesDeEnviados = enviados;
  const r6b = ctx.enviarUnaVez(Object.assign({}, pedido));
  await comprobar('7. vaciada la caché, el mismo identificador sigue sin mandarse dos veces', Promise.resolve(enviados), antesDeEnviados);
  await comprobar('7. contesta "ya enviado" igualmente', Promise.resolve([r6b.ok, !!r6b.yaEnviado]), [true, true]);

  /* Un grupo de hace más de 60 días se borra solo; uno de hace pocos
     días, no. Con fechas relativas a hoy (nunca a ojo, para que la
     prueba no caduque ella misma con el paso del tiempo real). */
  const comoAamd = (d) => String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const claveVieja = 'enviados-' + comoAamd(haceDias(65));
  const claveReciente = 'enviados-' + comoAamd(haceDias(1));
  propiedades[claveVieja] = JSON.stringify(['env-viejo']);
  propiedades[claveReciente] = JSON.stringify(['env-reciente']);
  ctx.limpiarEnviosViejos();
  await comprobar('7. el grupo de hace más de 60 días se borra', Promise.resolve(claveVieja in propiedades), false);
  await comprobar('7. uno reciente se queda', Promise.resolve(claveReciente in propiedades), true);
}

/* ---------- en el navegador ---------- */
const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(500);

console.log('--- 1. el tablón, dos cambios a la vez ---');
await comprobar('1. se conservan las dos notas', pagina.evaluate(async () => {
  const nota = (id) => (l) => l.concat([{ id: id, texto: 'Nota ' + id, autor: 'Francisco', creado: new Date().toISOString() }]);
  await Promise.all([Tablon._cambiar(nota('a')), Tablon._cambiar(nota('b'))]);
  const t = await Carpetas.leerJson(App.E.gestor, 'tablon.json');
  return t.notas.map(n => n.id).sort();
}), ['a', 'b']);

console.log('--- 2. empresas.csv, dos altas a la vez ---');
await comprobar('2. se conservan las dos', pagina.evaluate(async () => {
  await Promise.all([
    Datos.anadirALista(App.E.datos, 'EMPRESAS', { 'Razón social': 'Papeles del Sur SL', 'NIF': 'B11111111' }),
    Datos.anadirALista(App.E.datos, 'EMPRESAS', { 'Razón social': 'Autocares Norte SA', 'NIF': 'A22222222' })
  ]);
  const t = Datos.aTabla(await Carpetas.leerTexto(App.E.datos, 'empresas.csv')).filas.slice(1);
  return t.map(f => f[0]).sort();
}), ['Autocares Norte SA', 'Papeles del Sur SL']);

console.log('--- 3. una copia en conflicto de personal.csv ---');
const r3 = await pagina.evaluate(async () => {
  const cab = Datos.LISTAS.PERSONAL.cabecera;
  const real = Datos.aCsv(cab, [['Común, Ana', '1111', 'Conserje', '600', ''], ['Solo Aquí, Luis', '2222', 'Profesor', '', ''],
                               ['Repetida, Eva', '3333', 'Profesora', '611', '']]);
  const otro = Datos.aCsv(cab, [['Común, Ana', '1111', 'Conserje', '600', ''], ['Solo Allí, Marta', '4444', 'Profesora', '', ''],
                               ['Repetida, Eva', '3333', 'Profesora', '699', 'eva@ejemplo.es']]);
  await Carpetas.escribirTexto(App.E.datos, 'personal.csv', real);
  await Carpetas.escribirTexto(App.E.datos, 'personal (copia en conflicto de PC2 2026-09-24).csv', otro);
  await Conflictos.revisar();
  const filas = Datos.aTabla(await Carpetas.leerTexto(App.E.datos, 'personal.csv')).filas.slice(1);
  const copias = await App.E.gestor.getDirectoryHandle('copias');
  const enCopias = (await Carpetas.ficheros(copias)).map(f => f.nombre);
  const quedan = (await Carpetas.ficheros(App.E.datos)).map(f => f.nombre);
  return {
    nombres: filas.map(f => f[0]),
    eva: filas.filter(f => f[0] === 'Repetida, Eva')[0][3],
    dudosas: Conflictos.pendientes().filter(p => p.fila).map(p => p.nombre),
    conflictoApartado: enCopias.some(n => /copia en conflicto/.test(n)) && !quedan.some(n => /conflicto/.test(n)),
    realCopiado: enCopias.some(n => /^personal-antes-de-unir-/.test(n))
  };
});
await comprobar('3. salen las filas nuevas de los dos lados, sin repetir la común',
  Promise.resolve(r3.nombres), ['Común, Ana', 'Repetida, Eva', 'Solo Allí, Marta', 'Solo Aquí, Luis']);
await comprobar('3. con el mismo nombre y datos distintos, se queda la del fichero real', Promise.resolve(r3.eva), '611');
await comprobar('3. y la otra se apunta para elegir en Ajustes', Promise.resolve(r3.dudosas), ['Repetida, Eva']);
await comprobar('3. la copia en conflicto se aparta a _GESTOR/copias', Promise.resolve(r3.conflictoApartado), true);
await comprobar('3. y el fichero real se copia antes de unir', Promise.resolve(r3.realCopiado), true);

console.log('--- 4. los nombres no pasan de un largo seguro ---');
const r4 = await pagina.evaluate(() => {
  const largo = 'Texto libre muy largo '.repeat(14);
  const a = Nombres.montarAsunto({ fecha: '2026-09-24', tipo: 'MATRICULA', curso: '26-27', grupo: '1ESO-A',
    campos: ['Campo uno'], descripcion: largo, tercero: 'Apellidolarguísimo Otroapellido, Nombre Compuesto 1234567' });
  const d = Nombres.montarDocumentoAjustado({ fecha: '2026-09-24', codigo: '26EM0001', tipo: 'SOLICITUD',
    curso: largo, extension: 'pdf' });
  const corto = Nombres.montarAsunto({ fecha: '2026-09-24', tipo: 'MATRICULA', descripcion: 'Corto', tercero: 'Uno, Ana 1' });
  return { a: a, d: d, corto: corto, largoOriginal: largo.length };
});
await comprobar('4. la descripción tenía más de 300 caracteres', Promise.resolve(r4.largoOriginal > 300), true);
await comprobar('4. la carpeta sale de 150 como mucho, avisando', Promise.resolve([r4.a.nombre.length <= 150, r4.a.recortado]), [true, true]);
await comprobar('4. conserva fecha, tipo, año, grupo y el campo',
  Promise.resolve(r4.a.nombre.indexOf('260924 MATRICULA 26-27 1ESO-A Campo uno ') === 0), true);
await comprobar('4. y el tercero con su número, entero, al final',
  Promise.resolve(/ Apellidolarguísimo Otroapellido, Nombre Compuesto 1234567$/.test(r4.a.nombre)), true);
await comprobar('4. el documento, 120 como mucho más la extensión',
  Promise.resolve([r4.d.nombre.length <= 124, /\.pdf$/.test(r4.d.nombre), r4.d.nombre.indexOf('260924 26EM0001 SOLICITUD ') === 0, r4.d.recortado]),
  [true, true, true, true]);
await comprobar('4. un nombre corto no se toca', Promise.resolve([r4.corto.nombre, r4.corto.recortado]), ['260924 MATRICULA Corto Uno, Ana 1', false]);

console.log('--- 5. el envío que vence su tiempo ---');
await comprobar('5. «No sé si ha salido», sin darlo por fallado', pagina.evaluate(async () => {
  const antes = window.fetch;
  CorreoEnviar.guardarUrl('https://script.google.com/macros/s/prueba/exec?k=clave');
  window.fetch = (url, op) => new Promise((ok, mal) => {
    op.signal.addEventListener('abort', () => { const e = new Error('abortado'); e.name = 'AbortError'; mal(e); });
  });
  try {
    const r = await CorreoEnviar.enviar({ para: 'x@y.es', asunto: 'a', cuerpo: 'b', idEnvio: CorreoEnviar.nuevoIdEnvio() }, 50);
    return [r.ok, r.sinSaber, r.motivo];
  } finally { window.fetch = antes; }
}), [false, true, 'No sé si ha salido. Mira en Enviados de Gmail antes de volver a pulsar.']);
await comprobar('5. cada cuadro, un identificador distinto',
  pagina.evaluate(() => CorreoEnviar.nuevoIdEnvio() !== CorreoEnviar.nuevoIdEnvio()), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
