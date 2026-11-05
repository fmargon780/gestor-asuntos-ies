import { abrir } from './_rev_lib.mjs';
const { browser, page, errores } = await abrir();
await page.getByText('El centro', { exact: true }).first().click();
await page.waitForTimeout(800);
const sum = page.locator('summary', { hasText: /^\s*Campos/ }).last();
await sum.scrollIntoViewIfNeeded(); await sum.click(); await page.waitForTimeout(800);
const det = sum.locator('xpath=..');
const orig = det.locator('select').first();
console.log(JSON.stringify(await orig.locator('option').evaluateAll(os => os.map(o => [o.value, o.textContent, o.parentElement.tagName]))));
await orig.selectOption({ label: 'Calculado' }); await page.waitForTimeout(500);
console.log('calc', await det.locator('tbody tr').count(), await orig.inputValue());
await orig.selectOption({ label: 'Tabla de datos' }); await page.waitForTimeout(500);
console.log('tabla', await det.locator('tbody tr').count());
await orig.selectOption({ label: 'El asunto' }); await page.waitForTimeout(500);
console.log('asunto', await det.locator('tbody tr').count());
await orig.selectOption({ label: 'Ajustes del centro' }); await page.waitForTimeout(500);
console.log('ajustes', await det.locator('tbody tr').count());
await orig.selectOption({ label: 'Centro de datos' }); await page.waitForTimeout(500);
console.log('cdatos', await det.locator('tbody tr').count());
await orig.selectOption({ label: 'Calculado' }); await page.waitForTimeout(500);
console.log('calc2', await det.locator('tbody tr').count());
// detail of calculado Curso and manual Importe
await orig.selectOption({ index: 0 }); await page.waitForTimeout(300);
const pan = async () => page.evaluate(() => { const el = [...document.querySelectorAll('aside, section, div')].filter(e => /De dónde sale\n/.test(e.innerText||'') && /Se usa en/.test(e.innerText||'') && !/Campo\tGrupo/.test(e.innerText||'')).sort((a,b)=>a.innerText.length-b.innerText.length)[0]; return el ? el.innerText : 'NO PANEL'; });
for (const n of ['Se calcula de grupo', 'Importe de la factura', 'Fecha de hoy', 'Tabla de periodos de tutoría', 'Unidad']) {
  await det.locator('tbody tr', { hasText: n }).last().click(); await page.waitForTimeout(500);
  console.log('=== ' + n + '\n' + await pan());
}
console.log('ERR', JSON.stringify(errores));
await browser.close();
