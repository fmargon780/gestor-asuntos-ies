/* Prueba de la fila 740 (docs/740-ENTRAR-DICE-DONDE-SE-QUEDA.md): «Entrar» dice en qué se ha quedado.
   Chromium real con la copia de pruebas (?demo=1&auto=1: entra sola; después se vuelve a llamar al botón con un paso simulado).

   1. Un paso que no termina (el permiso de las carpetas recordadas no responde): bajo «Entrar» sale la línea de lo que espera, con su texto, y a los 15 s se añade «Sigue esperando».
   2. Un paso que falla: sale el cuadro rojo con lo que dijo el navegador y NO desaparece solo; la línea de espera se va.
   3. Volver a pulsar «Entrar» quita el cuadro rojo viejo.
   4. Al entrar bien, no queda ninguna línea ni cuadro; el botón sigue diciendo «Entrar». */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
async function nueva(url) {
  const pagina = await navegador.newPage({ viewport: { width: 1300, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await pagina.goto(url);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 90000 });
  await pagina.waitForFunction(() => window.EntrarPasos && window.Demo && !Demo.montando, null, { timeout: 60000 });
  await pagina.waitForTimeout(500);
  return pagina;
}
const texto = (p, id) => p.evaluate((i) => { const e = document.getElementById(i); return e ? e.textContent : null; }, id);

console.log('--- 1. un paso que no termina ---');
let p = await nueva(BASE + '?demo=1&auto=1');
await p.evaluate(() => { PermisosCarpetas.pedirAlEntrar = () => new Promise(() => {}); document.getElementById('btn-entrar').onclick(); });
await p.waitForTimeout(800);
await comprobar('sale la línea de lo que espera', texto(p, 'entrar-paso'), 'Pidiendo permiso para las carpetas recordadas…');
await comprobar('el botón sigue diciendo «Entrar» y sin apagar', p.evaluate(() => [document.getElementById('btn-entrar').textContent, document.getElementById('btn-entrar').disabled]), ['Entrar', false]);
await p.waitForTimeout(15500);
await comprobar('a los 15 s añade «Sigue esperando»', texto(p, 'entrar-paso').then((t) => /Sigue esperando: Pidiendo permiso para las carpetas recordadas\. Si Chrome o Edge te pide permiso, pulsa «Permitir»\.$/.test(t)), true);
await p.close();

console.log('--- 2 y 3. un paso que falla ---');
p = await nueva(BASE + '?demo=1&auto=1');
await p.evaluate(() => { App.cargarTipos = async () => { throw new Error('el navegador dice: boom'); }; document.getElementById('btn-entrar').onclick(); });
await p.waitForTimeout(2500);
await comprobar('sale el cuadro rojo con lo que falló', texto(p, 'entrar-fallo').then((t) => (t || '').indexOf('boom') !== -1), true);
await comprobar('la línea de espera ya no está', texto(p, 'entrar-paso'), null);
await p.waitForTimeout(6000);
await comprobar('el cuadro rojo no desaparece solo', texto(p, 'entrar-fallo').then((t) => (t || '').indexOf('boom') !== -1), true);
await p.evaluate(() => { PermisosCarpetas.pedirAlEntrar = () => new Promise(() => {}); document.getElementById('btn-entrar').onclick(); });
await p.waitForTimeout(500);
await comprobar('volver a pulsar «Entrar» quita el cuadro viejo', texto(p, 'entrar-fallo'), null);
await p.close();

console.log('--- 4. entrar bien ---');
p = await nueva(BASE + '?demo=1&auto=1');
await comprobar('al entrar no queda línea ni cuadro', p.evaluate(() => [!!document.getElementById('entrar-paso'), !!document.getElementById('entrar-fallo')]), [false, false]);
await p.close();

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
