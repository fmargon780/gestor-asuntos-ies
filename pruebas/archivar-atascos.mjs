/* Prueba en navegador de verdad de la fila 44 (docs/ARCHIVAR-ATASCOS.md):
   archivar y reabrir un asunto no se atasca cuando la carpeta ya no
   está donde la tarjeta cree, cuando hay ficheros temporales de
   sincronización de por medio, o cuando uno desaparece a mitad de la
   copia. Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

console.log('--- 5. U.mensajeDeError traduce, y deja pasar lo que ya está en castellano ---');
await comprobar('5. NotFoundError',
  pagina.evaluate(() => window.U.mensajeDeError({ name: 'NotFoundError', message: 'not found' })),
  'No encuentro la carpeta o el fichero. Puede que se haya movido o que lo esté sincronizando Dropbox en este momento.');
await comprobar('5. NotAllowedError',
  pagina.evaluate(() => window.U.mensajeDeError({ name: 'NotAllowedError', message: 'nope' })),
  'El navegador ha retirado el permiso sobre la carpeta. Vuelve a señalarla en Ajustes.');
await comprobar('5. un error nuestro, ya en castellano, se deja tal cual',
  pagina.evaluate(() => window.U.mensajeDeError(new Error('Ya hay una carpeta llamada "X" en el destino.'))),
  'Ya hay una carpeta llamada "X" en el destino.');

console.log('--- 3. ficheros temporales: no se copian, no se cuentan, el traslado termina bien ---');
await pagina.evaluate(async () => {
  const origen = await window.__disco.abiertos.getDirectoryHandle('temp-origen', { create: true });
  origen._hijos.set('bueno.pdf', window.__disco.fich('bueno.pdf', 'contenido'));
  origen._hijos.set('.dropbox.cache', window.__disco.fich('.dropbox.cache', 'basura'));
  origen._hijos.set('desktop.ini', window.__disco.fich('desktop.ini', 'basura'));
});
await pagina.evaluate(async () => {
  const destino = await window.__disco.abiertos.getDirectoryHandle('temp-destino', { create: true });
  await window.Carpetas.trasladar(window.__disco.abiertos, 'temp-origen', destino, 'temp-final');
});
await comprobar('3. el destino solo tiene el fichero bueno',
  pagina.evaluate(async () => {
    const destino = await window.__disco.abiertos.getDirectoryHandle('temp-destino');
    const carpeta = await destino.getDirectoryHandle('temp-final');
    const nombres = [];
    for await (const p of carpeta.entries()) nombres.push(p[0]);
    return nombres.sort();
  }), ['bueno.pdf']);
await comprobarQue('3. el origen ha desaparecido (el traslado terminó bien, sin descuadre de cuenta)',
  pagina.evaluate(async () => {
    try { await window.__disco.abiertos.getDirectoryHandle('temp-origen'); return false; }
    catch (e) { return e.name === 'NotFoundError'; }
  }));

console.log('--- 4. un fichero que desaparece a mitad de la copia: se reintenta, y si sigue sin estar, se avisa con su nombre ---');
await pagina.evaluate(async () => {
  const origen = await window.__disco.abiertos.getDirectoryHandle('desaparece-origen', { create: true });
  const h = window.__disco.fich('fantasma.pdf', 'contenido');
  let intentos = 0;
  const getFileDeVerdad = h.getFile.bind(h);
  h.getFile = async function () {
    intentos++;
    if (intentos === 1) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
    return getFileDeVerdad();
  };
  origen._hijos.set('fantasma.pdf', h);
});
await comprobarQue('4a. con un solo fallo, el reintento lo copia igual',
  pagina.evaluate(async () => {
    const destino = await window.__disco.abiertos.getDirectoryHandle('desaparece-destino-a', { create: true });
    await window.Carpetas.trasladar(window.__disco.abiertos, 'desaparece-origen', destino, 'final');
    const carpeta = await destino.getDirectoryHandle('final');
    const nombres = [];
    for await (const p of carpeta.entries()) nombres.push(p[0]);
    return nombres.length === 1 && nombres[0] === 'fantasma.pdf';
  }));

await pagina.evaluate(async () => {
  const origen = await window.__disco.abiertos.getDirectoryHandle('desaparece-del-todo', { create: true });
  const h = window.__disco.fich('fantasma2.pdf', 'contenido');
  h.getFile = async function () { const e = new Error('no'); e.name = 'NotFoundError'; throw e; };
  origen._hijos.set('fantasma2.pdf', h);
});
const errorDesaparecido = await pagina.evaluate(async () => {
  const destino = await window.__disco.abiertos.getDirectoryHandle('desaparece-destino-b', { create: true });
  try {
    await window.Carpetas.trasladar(window.__disco.abiertos, 'desaparece-del-todo', destino, 'final');
    return null;
  } catch (e) { return e.message; }
});
await comprobarQue('4b. sin recuperarse, el mensaje dice el nombre del fichero, en castellano',
  errorDesaparecido && errorDesaparecido.indexOf('fantasma2.pdf') !== -1 &&
  errorDesaparecido.indexOf('desaparecido a mitad de la copia') !== -1,
  errorDesaparecido);
await comprobarQue('4b. el origen sigue entero (no se ha borrado nada)',
  pagina.evaluate(async () => {
    try { await window.__disco.abiertos.getDirectoryHandle('desaparece-del-todo'); return true; }
    catch (e) { return false; }
  }));

console.log('--- 1. archivar cuando el origen ya no está pero el destino sí: no revienta, pone la lista al día ---');
const NOMBRE_1 = '260911 COMPRA Ya Archivado SL 11111111A';
await pagina.evaluate(async (nombre) => {
  await window.App.anotar(nombre, { categoria: 'EMPRESAS', tercero: 'Ya Archivado SL 11111111A' });
  const destino = await window.__disco.archivo.getDirectoryHandle('EMPRESAS', { create: true });
  const delTercero = await destino.getDirectoryHandle('Ya Archivado SL 11111111A', { create: true });
  await delTercero.getDirectoryHandle(nombre, { create: true });
}, NOMBRE_1);
await pagina.evaluate((nombre) => {
  const a = {
    nombre: nombre,
    ficha: { categoria: 'EMPRESAS', tercero: 'Ya Archivado SL 11111111A' },
    leido: { categoria: 'EMPRESAS', resto: 'Ya Archivado SL 11111111A' }
  };
  window.__p1 = window.App.cerrarAsunto(a);
}, NOMBRE_1);
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__p1);
await comprobar('1. la ficha queda con estado cerrado', pagina.evaluate(async (nombre) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  return j.asuntos[nombre] && j.asuntos[nombre].estado;
}, NOMBRE_1), 'cerrado');

console.log('--- 2. archivar cuando no está en ningún sitio: aviso en castellano, sin tocar nada ---');
const NOMBRE_2 = '260911 COMPRA No Existe Ya SL 22222222B';
await pagina.evaluate((nombre) => {
  window.__avisos = [];
  window.__comoEraAviso = window.U.aviso;
  window.U.aviso = function (t, c) { window.__avisos.push(t); return window.__comoEraAviso(t, c); };
  const a = {
    nombre: nombre,
    ficha: { categoria: 'EMPRESAS', tercero: 'No Existe Ya SL 22222222B' },
    leido: { categoria: 'EMPRESAS', resto: 'No Existe Ya SL 22222222B' }
  };
  window.__p2 = window.App.cerrarAsunto(a);
}, NOMBRE_2);
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
const avisoSinSitio = await pagina.evaluate(async () => {
  await window.__p2;
  window.U.aviso = window.__comoEraAviso;
  return window.__avisos;
});
await comprobarQue('2. avisa, en castellano, sin "NotFoundError" ni inglés',
  avisoSinSitio.length === 1 && avisoSinSitio[0].indexOf('No encuentro la carpeta') === 0 &&
  avisoSinSitio[0].toLowerCase().indexOf('notfounderror') === -1,
  JSON.stringify(avisoSinSitio));

console.log('--- 6. reabrir con un a.padre viejo que ya no vale: se recalcula y funciona ---');
const NOMBRE_6 = '260911 COMPRA Para Reabrir SL 33333333C';
await pagina.evaluate(async (nombre) => {
  await window.App.anotar(nombre, { categoria: 'EMPRESAS', tercero: 'Para Reabrir SL 33333333C', estado: 'cerrado' });
  const cat = await window.__disco.archivo.getDirectoryHandle('EMPRESAS', { create: true });
  const delTercero = await cat.getDirectoryHandle('Para Reabrir SL 33333333C', { create: true });
  const carpeta = await delTercero.getDirectoryHandle(nombre, { create: true });
  carpeta._hijos.set('doc.pdf', window.__disco.fich('doc.pdf', 'contenido'));
}, NOMBRE_6);
await pagina.evaluate(async (nombre) => {
  const padreViejo = await window.__disco.archivo.getDirectoryHandle('PERSONAL', { create: true });
  const a = {
    nombre: nombre, padre: padreViejo,
    ficha: { categoria: 'EMPRESAS', tercero: 'Para Reabrir SL 33333333C' },
    leido: { categoria: 'EMPRESAS', resto: 'Para Reabrir SL 33333333C' }
  };
  window.__p6 = window.App.reabrirAsunto(a);
}, NOMBRE_6);
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
const resultado6 = await pagina.evaluate(async (nombre) => {
  await window.__p6;
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre);
  const nombres = [];
  for await (const p of carpeta.entries()) nombres.push(p[0]);
  return nombres;
}, NOMBRE_6);
await comprobar('6. la carpeta ha vuelto a Asuntos abiertos, con su documento', resultado6, ['doc.pdf']);
await comprobar('6. la ficha queda con estado abierto', pagina.evaluate(async (nombre) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  return j.asuntos[nombre] && j.asuntos[nombre].estado;
}, NOMBRE_6), 'abierto');

await comprobar('sin errores de consola', errores, []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
