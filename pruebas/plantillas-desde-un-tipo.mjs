/* Fila 320 (docs/PANTALLA-DE-PLANTILLAS.md), paso 20, separado de plantillas-pantalla.mjs en la fila 584:
   «Ver todas las plantillas» desde la pantalla de un tipo abre la pantalla de Plantillas con ese tipo puesto.
   APARTADA (RETIRADAS de pruebas/ejecutar.mjs): fallo real de la app, idea 593 de docs/COLA.md. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(antes, ancho) {
  const pagina = await navegador.newPage({ viewport: { width: ancho || 1280, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1&auto=1');
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  await pagina.waitForTimeout(2500);
  return pagina;
}

let p = await abrir();
await p.evaluate(() => { App.ir('herramientas'); });
await p.waitForTimeout(800);
/* ---------- 20: desde un tipo ---------- */
console.log('--- 20. «Ver todas las plantillas» desde un tipo ---');
await p.evaluate(async () => { await App.abrirTipoDeAsunto((App.E.tipos || []).filter((t) => t.tipo === 'FACTURA')[0]); });
await p.waitForSelector('#tipo-pd-nueva', { state: 'attached', timeout: 15000 });
await p.evaluate(() => document.getElementById('tipo-pd-nueva').nextElementSibling.querySelector('button').click());
await p.waitForSelector('.pt-tabla', { timeout: 15000 });
await comprobar('20. se abre en «Word» con ese tipo puesto', p.evaluate(() => [document.querySelector('.pt-pestana.activa').textContent.replace(/\d+/, 'N'), document.getElementById('pt-tipo').value, document.querySelectorAll('.pt-tabla tbody tr').length]), ['Word (N)', 'FACTURA', 1]);

await p.close();
console.log('--- sin errores ---');
await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodo bien.');
