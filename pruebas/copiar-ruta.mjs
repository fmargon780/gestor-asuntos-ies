/* Prueba en navegador de verdad de la fila 98
   (docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md): el botón «Ruta» de la fila
   de copiar de la ficha del asunto.

   1. Sin ruta apuntada: copia solo el nombre de la carpeta y avisa.
   2. Con ruta de Windows (Ajustes → El centro), asunto abierto: la
      ruta con `\`.
   3. Asunto archivado, con ruta estilo Linux: ruta del ARCHIVO +
      categoría + tercero + nombre, con `/`.
   4. La ruta se guarda en este ordenador (localStorage), no en _GESTOR.
   5. En modo consulta el botón sigue encendido.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 850 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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

const ABIERTO = '260918 SOLICITUD 26-27 Pérez Ruiz, Ana 1150055';
const ARCHIVADO = '250110 MATRICULA 25-26 Pérez Ruiz, Ana 1150055';
const TERCERO = 'Pérez Ruiz, Ana 1150055';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([ABIERTO, ARCHIVADO, TERCERO]) => {
  await window.__disco.abiertos.getDirectoryHandle(ABIERTO, { create: true });
  await App.anotar(ABIERTO, { tercero: TERCERO, categoria: 'ALUMNADO' });
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle(TERCERO, { create: true });
  await ter.getDirectoryHandle(ARCHIVADO, { create: true });
  await App.verAbiertos();
}, [ABIERTO, ARCHIVADO, TERCERO]);

async function abrirAbierto() {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(150);
  await pagina.locator('.tarjeta-nombre', { hasText: ABIERTO }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.ficha-copiar-fila');
}

async function copiarRuta() {
  await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
  await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("Ruta")');
  await pagina.waitForFunction(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
    .some((x) => x.textContent.trim() === 'Copiado'));
  const texto = await pagina.evaluate(() => navigator.clipboard.readText());
  await pagina.waitForTimeout(1500);   /* que el botón vuelva a decir «Ruta» */
  return texto;
}

/* ---------- 1. sin ruta apuntada ---------- */
console.log('--- 1. sin ruta apuntada ---');
await abrirAbierto();
await comprobar('el botón «Ruta» va detrás de «Asunto»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])'))
    .map(b => b.textContent.trim()).slice(0, 2)), ['Asunto', 'Ruta']);
await comprobar('copia solo el nombre de la carpeta', copiarRuta(), ABIERTO);
await comprobar('y avisa de dónde apuntarla',
  pagina.locator('.mensaje', { hasText: 'Apunta la ruta de tus carpetas en Ajustes → El centro' }).count().then(n => n > 0), true);

/* ---------- 2. ruta de Windows, asunto abierto ---------- */
console.log('--- 2. ruta de Windows ---');
await pagina.evaluate(() => { App.ir('ajustes'); App.cambiarPestanaAjustes('centro'); });
await pagina.waitForSelector('#bloque-rutas');
await pagina.click('#bloque-rutas summary');
await pagina.fill('#ruta-abiertos', 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\');
await pagina.press('#ruta-abiertos', 'Tab');
await comprobar('se guarda en este ordenador',
  pagina.evaluate(() => localStorage.getItem('gestor-ruta-abiertos')), 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\');
await comprobar('y no en la carpeta compartida',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const nombres = []; for await (const p of g.entries()) nombres.push(p[0]);
    const textos = [];
    for (const n of nombres) {
      try { const f = await (await g.getFileHandle(n)).getFile(); textos.push(await f.text()); } catch (e) { /* carpeta */ }
    }
    return textos.some(t => t.indexOf('ASUNTOS ABIERTOS') > -1);
  }), false);
await abrirAbierto();
await comprobar('copia la ruta entera, con \\ y sin barras dobles',
  copiarRuta(), 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\' + ABIERTO);

/* ---------- 5. modo consulta ---------- */
await comprobar('lleva la clase que el modo consulta deja encendida (copiar no cambia nada)',
  pagina.evaluate(() => {
    const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila')).find(x => x.textContent.trim() === 'Ruta');
    return b.classList.contains('boton-copiar-fila') && !b.disabled;
  }), true);

/* ---------- 3. archivado, ruta estilo Linux ---------- */
console.log('--- 3. archivado ---');
await pagina.evaluate(() => localStorage.setItem('gestor-ruta-archivo', '/home/francisco/Dropbox/ARCHIVO/'));
await pagina.evaluate(async ([ARCHIVADO, TERCERO]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle(TERCERO);
  const h = await ter.getDirectoryHandle(ARCHIVADO);
  App.abrirFicha({
    nombre: ARCHIVADO, handle: h, padre: ter, ruta: 'ALUMNADO / ' + TERCERO,
    categoria: 'ALUMNADO', tercero: TERCERO, sueltoEn: '',
    leido: Nombres.leer(ARCHIVADO, App.E.tipos), ficha: { categoria: 'ALUMNADO', tercero: TERCERO }
  }, 'archivado');
}, [ARCHIVADO, TERCERO]);
await pagina.waitForSelector('.ficha-copiar-fila');
await comprobar('copia ARCHIVO / categoría / tercero / nombre, con /',
  copiarRuta(), '/home/francisco/Dropbox/ARCHIVO/ALUMNADO/' + TERCERO + '/' + ARCHIVADO);

/* ---------- lo de unir, suelto ---------- */
await comprobar('una ruta de red (\\\\servidor) va con \\',
  pagina.evaluate(() => RutaCarpetas.unir('\\\\servidor\\compartida', ['ALUMNADO', 'X'])), '\\\\servidor\\compartida\\ALUMNADO\\X');
await comprobar('un archivado sin ruta del índice usa categoría y tercero',
  pagina.evaluate(() => RutaCarpetas.de({ nombre: 'N', categoria: 'PERSONAL', tercero: 'T' }, 'archivado').texto),
  '/home/francisco/Dropbox/ARCHIVO/PERSONAL/T/N');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
