/* Prueba en navegador de verdad de la fila 55 (18-sep-2026,
   docs/ASUNTO-SIN-ELECCION.md): el asunto del mensaje es siempre el
   nombre de la carpeta, sin elección entre esa y una "versión
   legible", ni en el cuadro de Correo ni en el de Mensaje de Séneca.
   Mismo patrón que pruebas/correos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260905 CERT. MATRICULA 26-27 Albarracín Beltrán, María Teresa 1140233';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 800 } });
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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async (asunto) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [asunto]: {
        tercero: 'Albarracín Beltrán, María Teresa 1140233', categoria: 'ALUMNADO', situacion: 'PENDIENTE',
        curso: '26-27', grupo: '1ºBachA', abiertoPor: 'Francisco Marmolejo González'
      }
    }
  })));
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
}, ASUNTO);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await pagina.locator('.tarjeta-nombre', { hasText: ASUNTO }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(300);

/* ============================================================
   EL CUADRO DE CORREO
   ============================================================ */
console.log('--- el cuadro de Correo ---');
await pagina.click('.boton-comunicar');
await pagina.waitForTimeout(100);
await pagina.getByRole('button', { name: 'Correo electrónico', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForTimeout(150);

await comprobar('el asunto de partida es el nombre de la carpeta, tal cual',
  pagina.locator('#correo-asunto').inputValue(), ASUNTO);
await comprobar('no hay botón "Nombre de la carpeta"',
  pagina.getByRole('button', { name: 'Nombre de la carpeta', exact: true }).count(), 0);
await comprobar('no hay botón "Versión legible"',
  pagina.getByRole('button', { name: 'Versión legible', exact: true }).count(), 0);
await comprobarQue('el campo se sigue pudiendo editar a mano',
  pagina.locator('#correo-asunto').evaluate((el) => !el.disabled && !el.readOnly));

await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ============================================================
   EL CUADRO DE MENSAJE DE SÉNECA
   ============================================================ */
console.log('--- el cuadro de Mensaje de Séneca ---');
await pagina.click('.boton-comunicar');
await pagina.waitForTimeout(100);
await pagina.getByRole('button', { name: 'Mensaje de Séneca', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForTimeout(150);

await comprobar('en Séneca también: el asunto de partida es el nombre de la carpeta',
  pagina.locator('#seneca-asunto').inputValue(), ASUNTO);
await comprobar('tampoco hay aquí botón "Nombre de la carpeta"',
  pagina.getByRole('button', { name: 'Nombre de la carpeta', exact: true }).count(), 0);
await comprobar('ni "Versión legible"',
  pagina.getByRole('button', { name: 'Versión legible', exact: true }).count(), 0);
await comprobarQue('el campo se sigue pudiendo editar a mano',
  pagina.locator('#seneca-asunto').evaluate((el) => !el.disabled && !el.readOnly));

await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
