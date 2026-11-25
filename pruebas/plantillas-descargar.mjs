/* Fila 748 (docs/748-DESCARGAR-EL-WORD-DE-UNA-PLANTILLA.md): «Descargar el Word» en el menú «⋮» de una plantilla de Word.
   Con Chromium real y la copia de pruebas. */
import { chromium } from 'playwright';
import fs from 'node:fs';

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
async function abrir(antes) {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1&auto=1');
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  await pagina.waitForTimeout(2500);
  await pagina.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-plantillas').open = true; });
  await pagina.waitForFunction(() => /\d+ de Word · \d+ de correo/.test(document.getElementById('plantillas-resumen').textContent), null, { timeout: 15000 });
  await pagina.click('#plantillas-abrir');
  await pagina.waitForSelector('.pt-tabla');
  return pagina;
}
const fila = (p, nombre) => p.locator('.pt-tabla tbody tr').filter({ has: p.locator('.pt-nombre', { hasText: nombre }) });

console.log('--- 1. el menú y la descarga ---');
let p = await abrir();
const f = fila(p, 'Certificado de notas');
const fichero = await f.locator('.pt-fichero').innerText();
await f.locator('summary').click();
await comprobar('1. «Descargar el Word» es la primera del menú, encima de «Sustituir el fichero…»',
  f.locator('.pt-menu button').allTextContents().then((t) => t.slice(0, 2)), ['Descargar el Word', 'Sustituir el fichero…']);
const [descarga] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), f.locator('[data-accion="descargar"]').click()]);
await comprobar('1. el fichero baja con el nombre de la columna «Fichero»', descarga.suggestedFilename(), fichero.trim());
const ruta = await descarga.path();
const bajado = fs.readFileSync(ruta);
const original = Buffer.from(await p.evaluate(async () => {
  const d = await PlantillasDocumento._interno.carpetaDePlantillas();
  const nombre = Plantillas.enMemoria().documentos.filter((x) => x.nombre === 'Certificado de notas')[0].fichero;
  const file = await (await d.getFileHandle(nombre)).getFile();
  return Array.from(new Uint8Array(await file.arrayBuffer()));
}));
await comprobar('1. el contenido es el mismo que el del fichero de la carpeta', [bajado.length > 0, bajado.equals(original)], [true, true]);
await comprobar('1. y es un fichero de Word (empieza por PK, un zip)', bajado.toString('latin1').indexOf('PK') === 0, true);
await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje')].some((m) => /Descargado «/.test(m.textContent) && /Sustituir el fichero/.test(m.textContent)), null, { timeout: 10000 });
await comprobar('1. sale el aviso verde con el nombre del fichero', p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje')].some((m) => /^Descargado «.+»\. Cámbialo en Word sin tocar lo que va entre llaves y, para devolverlo, usa «Sustituir el fichero…»\.$/.test(m.textContent.trim()))), true);

console.log('--- 2. la pestaña Correo no lo lleva ---');
await p.click('[data-pestana="correo"]');
await p.waitForSelector('.pt-tabla tbody tr');
await comprobar('2. en Correo no hay «Descargar el Word»', p.evaluate(() => document.querySelectorAll('[data-accion="descargar"]').length), 0);
await p.click('[data-pestana="word"]');
await p.waitForSelector('.pt-tabla tbody tr');

console.log('--- 3. el fichero no está ---');
await p.evaluate(async () => {
  const d = await PlantillasDocumento._interno.carpetaDePlantillas();
  const nombre = Plantillas.enMemoria().documentos.filter((x) => x.nombre === 'Certificado de notas')[0].fichero;
  await d.removeEntry(nombre);
});
const g = fila(p, 'Certificado de notas');
await g.locator('summary').click();
await g.locator('[data-accion="descargar"]').click();
await p.waitForFunction((n) => [...document.querySelectorAll('#mensajes .mensaje')].some((m) => m.textContent.indexOf('No encuentro «' + n) !== -1), fichero.trim(), { timeout: 10000 });
await comprobar('3. avisa y marca «Falta el fichero»', await p.evaluate(() => !!document.querySelector('.pt-falta')), true);
await p.close();

console.log('--- 4. solo consultar ---');
p = await abrir("try { localStorage.setItem('gestor.soloConsulta', '1'); } catch (e) {}");
await p.waitForTimeout(600);
await comprobar('4. en solo consulta el botón sigue activo', p.evaluate(() => !document.querySelector('[data-accion="descargar"]').disabled), true);
/* (el Chromium sin pantalla pone «download» a los nombres con tilde; el de verdad no) */
const h = fila(p, 'Certificado de notas');
await h.locator('summary').click();
const [d2] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), h.locator('[data-accion="descargar"]').click()]);
await comprobar('4. y baja el fichero', d2.suggestedFilename(), (await h.locator('.pt-fichero').innerText()).trim());
await p.close();

await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de «Descargar el Word» pasan.');
