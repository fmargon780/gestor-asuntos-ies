import { abrir } from './_rev_lib.mjs';
const { browser, page, errores } = await abrir();
const out = '/tmp/claude-0/revisor528/';
// list subtabs in ajustes
const tabs = await page.$$eval('button, [role=tab]', els => els.filter(e => e.offsetParent).map(e => e.textContent.trim()).filter(t => t && t.length < 40));
console.log('BOTONES', JSON.stringify(tabs.slice(0, 80)));
await page.getByText('El centro', { exact: true }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: out + 'centro.png', fullPage: true });
const heads = await page.$$eval('summary, h2, h3', els => els.filter(e => e.offsetParent).map(e => e.tagName + ':' + e.textContent.trim().slice(0, 60)));
console.log('HEADS', JSON.stringify(heads));
console.log('ERR', JSON.stringify(errores));
await browser.close();
