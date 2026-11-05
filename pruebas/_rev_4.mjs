import { abrir } from './_rev_lib.mjs';
const { browser, page, errores } = await abrir();
const out = '/tmp/claude-0/revisor528/';
await page.getByText('El centro', { exact: true }).first().click();
await page.waitForTimeout(800);
const sum = page.locator('summary', { hasText: /^\s*Campos/ }).last();
await sum.scrollIntoViewIfNeeded(); await sum.click(); await page.waitForTimeout(800);
const det = sum.locator('xpath=..');
const cuenta = async (l) => { const r = await det.locator('tbody tr').allInnerTexts(); console.log(l, r.length, '|', r.slice(0, 4).map(x => x.replace(/\s+/g, ' ').slice(0, 70)).join(' || ')); };
// detail of Nº Id escolar
await det.locator('tbody tr', { hasText: 'Nº escolar, documento o NIF' }).first().click();
await page.waitForTimeout(600);
await det.screenshot({ path: out + 'detalle-nie.png' });
// find right panel text
const panel = await det.innerText();
const i = panel.indexOf('Campo\tGrupo');
console.log('PANEL-DERECHA:', panel.slice(panel.lastIndexOf('Se usa en') , panel.lastIndexOf('Se usa en')+10));
console.log(await page.evaluate(() => { const el = [...document.querySelectorAll('aside, section, div')].filter(e => /Centro de datos →/.test(e.textContent) && e.children.length < 30).sort((a,b)=>a.textContent.length-b.textContent.length)[0]; return el ? el.innerText : 'NO HAY CAMINO'; }));
// switch example persona
const sel = det.locator('select').nth(1);
console.log('SELECTS', await det.locator('select').count());
await sel.selectOption({ label: 'Castro Reina, Noa' });
await page.waitForTimeout(600);
await cuenta('tras persona Noa');
console.log(await page.evaluate(() => { const el = [...document.querySelectorAll('aside, section, div')].filter(e => /Centro de datos →/.test(e.textContent) && e.children.length < 30).sort((a,b)=>a.textContent.length-b.textContent.length)[0]; return el ? el.innerText : 'NO HAY CAMINO'; }));
// filters
for (const g of ['Persona', 'Tutores', 'Centro', 'Firmantes', 'Asunto']) { await det.getByRole('button', { name: new RegExp('^' + g + ' \\(') }).click(); await page.waitForTimeout(300); await cuenta('grupo ' + g); }
await det.getByRole('button', { name: /^Todos/ }).click();
const orig = det.locator('select').first();
for (const o of ['Calculado', 'Manual', 'RegAlum', 'TUTORIAS', 'Datos del centro']) { await orig.selectOption({ label: o }); await page.waitForTimeout(300); await cuenta('origen ' + o); }
await orig.selectOption({ index: 0 });
const bus = det.locator('input[type=search], input[placeholder*="Buscar"]').first();
for (const q of ['regalum', 'nº id', 'unidad', 'tutorias', 'importe']) { await bus.fill(q); await page.waitForTimeout(400); await cuenta('busca ' + q); }
await bus.fill('');
console.log('ERR', JSON.stringify(errores));
await browser.close();
