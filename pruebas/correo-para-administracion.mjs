/* Prueba de la fila 717 (19-nov-2026, docs/717-CORREO-PARA-ADMINISTRACION.md): en un asunto cuyo tercero es una administración, «Para» del
   correo lleva ya su correo: el del departamento del asunto o, si no, el general. Sin ninguno, vacío; un tercero que no es administración, igual que antes.
   Mismo disco de mentira que pruebas/administraciones.mjs. Datos inventados. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await (await navegador.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(400);

const A1 = '260921 CORRESPONDENCIA Organismo Con Correo';
const A2 = '260922 CORRESPONDENCIA Organismo Con Departamento';
const A3 = '260923 CORRESPONDENCIA Organismo Sin Correo';
const ids = await pagina.evaluate(async (n) => {
  const A = window.Administraciones;
  const o1 = await A.alta(App.E.datos, { clase: 'organismo', corto: 'Organismo Con Correo', correo: 'general1@ejemplo.es' });
  const o2 = await A.alta(App.E.datos, { clase: 'organismo', corto: 'Organismo Con Departamento', correo: 'general2@ejemplo.es' });
  const d2 = await A.anadirDepartamento(App.E.datos, o2.id, null, { nombre: 'Servicio Con Correo', correo: 'servicio2@ejemplo.es' });
  await A.alta(App.E.datos, { clase: 'organismo', corto: 'Organismo Sin Correo' });
  for (const x of n) await window.__disco.abiertos.getDirectoryHandle(x, { create: true });
  await App.anotar(n[0], { categoria: 'ADMINISTRACIONES', tercero: 'Organismo Con Correo' });
  await App.anotar(n[1], { categoria: 'ADMINISTRACIONES', tercero: 'Organismo Con Departamento', departamento: { id: d2.id, nombre: 'Servicio Con Correo', correo: 'servicio2@ejemplo.es' } });
  await App.anotar(n[2], { categoria: 'ADMINISTRACIONES', tercero: 'Organismo Sin Correo' });
  await App.verAbiertos();
  return o1.id;
}, [A1, A2, A3]);

async function paraDe(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + nombre + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
  await pagina.waitForTimeout(400);
  await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Correo electrónico');
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.waitForSelector('#correo-para');
  const r = await pagina.evaluate(() => [CorreoPara.texto('para'), CorreoPara.texto('copia'), CorreoPara.texto('oculta')]);
  await pagina.keyboard.press('Escape');
  await pagina.waitForSelector('#capa', { state: 'hidden' });
  return r;
}

await comprobar('1. sin departamento: sale el correo general', paraDe(A1), ['general1@ejemplo.es', '', '']);
await comprobar('2. con departamento con correo: sale el del departamento, no el general', paraDe(A2), ['servicio2@ejemplo.es', '', '']);
await comprobar('3. sin ningún correo: «Para» vacío, como antes', paraDe(A3), ['', '', '']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
