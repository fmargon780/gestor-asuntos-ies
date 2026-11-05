import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
await page.goto('file:///home/user/gestor-asuntos-ies/docs/pantallas/518.html');
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/claude-0/revisor528/p518.png', fullPage: true });
console.log((await page.innerText('body')).slice(0, 5000));
await browser.close();
