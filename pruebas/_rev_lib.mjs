import { chromium } from 'playwright';
export async function abrir(vp = { width: 1500, height: 1000 }) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const ctx = await browser.newContext({ viewport: vp });
  await ctx.addInitScript(() => { try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {} });
  const page = await ctx.newPage();
  const errores = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('PAGEERROR ' + e.message));
  page.on('dialog', d => { errores.push('DIALOG ' + d.message()); d.accept(); });
  await page.goto('http://localhost:8141/index.html?demo=1&auto=1');
  await page.waitForTimeout(7000);
  await page.click('.pestana[data-pantalla="ajustes"]');
  await page.waitForTimeout(800);
  return { browser, page, errores };
}
