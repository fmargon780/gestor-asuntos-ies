/* Fila 669 (docs/669-ANADIR-TAREA-OCULTO.md): con el plan de las guías aplicado (clase plan-guias-aplicado en <html>),
   «+ Añadir tarea» del hito enseña el formulario visible y se puede añadir una tarea; «+ Añadir hito» también se ve. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await (await navegador.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await p.goto(DIRECCION);
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await p.waitForFunction(() => window.Demo && !Demo.montando && window.MarcaGuia && window.AnadirHito, null, { timeout: 60000 });
await p.waitForTimeout(2500);
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await p.waitForSelector('.tcd-abrir-form', { timeout: 15000 });
await p.evaluate(() => document.documentElement.classList.add('plan-guias-aplicado'));
const visible = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, sel);
const textos = () => p.$$eval('.hito-en-mesa .guion-paso .guion-paso-texto', (l) => l.length);
const antes = await textos();
await p.click('.tcd-abrir-form');
await p.waitForSelector('.tcd-nueva .at-que', { state: 'attached' });
comprobar('1. el formulario de la tarea nueva se ve con el plan aplicado', await visible('.tcd-nueva .at-que'), true);
comprobar('2. se ven «Añadir» y «Cancelar»', [await visible('.tcd-nueva .at-nombre'), await visible('.tcd-nueva .at-cancelar')], [true, true]);
await p.fill('.tcd-nueva .at-que', 'Enviar · Correo electrónico');
await p.press('.tcd-nueva .at-que', 'Tab');
await p.waitForTimeout(400);
const nombre = await p.inputValue('.tcd-nueva .at-nombre');
if (!nombre) await p.fill('.tcd-nueva .at-nombre', 'Tarea de prueba 669');
const boton = p.locator('.tcd-nueva button:has-text("Añadir")').first();
await boton.click();
await p.waitForTimeout(1200);
const hayAviso = await p.locator('.capa-campos button:has-text("Añadir de todos modos"), .tcd-nueva .aviso button').count();
if (hayAviso && await visible('.tcd-nueva')) { await p.locator('.tcd-nueva .aviso button').first().click().catch(() => {}); await p.waitForTimeout(800); }
comprobar('3. la tarea nueva aparece en el hito', (await textos()) > antes, true);
comprobar('4. «+ Añadir hito» se ve con el plan aplicado', await p.locator('button:has-text("+ Añadir hito"):visible').count() > 0, true);
await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('todo bien');
