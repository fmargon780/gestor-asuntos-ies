/* Prueba en navegador de la fila 248 (docs/NOVEDADES-AL-RECARGAR.md):
   la ventana «Qué hay de nuevo». Usa una lista de novedades de mentira
   con fechas de hoy, para no depender del día en que se pase. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript('window.__pruebaNovedades = true;');
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const visible = () => pagina.locator('#capa:not(.oculto)').count();
const titulo = () => pagina.locator('#cuadro-titulo').textContent();
async function cerrar() {
  if (await visible()) await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#capa.oculto', { state: 'attached' });
}

console.log('--- 0. la parte pura y la lista de verdad ---');
await comprobar('fechaCorta', pagina.evaluate(() => NovedadesVentana.fechaCorta('2026-10-01')), '1 oct');
await comprobar('primera vez: solo los últimos 7 días',
  pagina.evaluate(() => NovedadesVentana.sinVer([{ id: 'a', fecha: '2026-10-01' }, { id: 'b', fecha: '2026-09-20' }], '', '2026-10-01').map(n => n.id)), ['a']);
await comprobar('con lo visto: solo lo que va antes',
  pagina.evaluate(() => NovedadesVentana.sinVer([{ id: 'c', fecha: '2026-10-01' }, { id: 'a', fecha: '2026-10-01' }, { id: 'b', fecha: '2026-10-01' }], 'a', '2026-10-02').map(n => n.id)), ['c']);
await comprobar('ninguna línea de la lista lleva ficheros, funciones ni números de fila',
  pagina.evaluate(() => NOVEDADES.filter(n => /\.m?js\b|\.json\b|\bfila \d|\w+\(\)/i.test(n.texto)).length), 0);
await cerrar();

console.log('--- 1. más de 10: diez y «y N más» ---');
await pagina.evaluate(() => {
  const hoy = U.hoyIso();
  window.NOVEDADES = Array.from({ length: 12 }, (_, i) => ({ id: 't' + (12 - i), fecha: hoy, texto: 'Novedad de prueba ' + (12 - i) }));
  localStorage.removeItem('gestor.novedadesVistas');
  window.__p = NovedadesVentana.alEntrar();
});
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('título', titulo(), 'Qué hay de nuevo');
await comprobar('diez líneas a la vista', pagina.locator('.novedades-lista:not(.oculto) li').count(), 10);
await comprobar('la más nueva, arriba, con su fecha', pagina.locator('.novedades-lista li').first().textContent().then(t => /Novedad de prueba 12/.test(t) && /^\d+ [a-z]{3}/.test(t.trim())), true);
await comprobar('el botón «y 2 más»', pagina.locator('#novedades-mas').textContent(), 'y 2 más');
await pagina.click('#novedades-mas');
await comprobar('al pulsarlo salen las doce', pagina.locator('.novedades-lista:not(.oculto) li').count(), 12);
await comprobar('un solo botón: «Entendido», sin Cancelar',
  pagina.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').classList.contains('oculto')]), ['Entendido', true]);
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__p);
await comprobar('«Entendido» la cierra', visible(), 0);
await comprobar('y lo marca visto (la más nueva)', pagina.evaluate(() => localStorage.getItem('gestor.novedadesVistas')), 't12');

console.log('--- 2. sin nada nuevo, no sale ---');
await pagina.evaluate(() => NovedadesVentana.alEntrar());
await pagina.waitForTimeout(400);
await comprobar('no sale', visible(), 0);

console.log('--- 3. una novedad nueva: sale solo esa ---');
await pagina.evaluate(() => {
  NOVEDADES.unshift({ id: 't13', fecha: U.hoyIso(), texto: 'Otra novedad de prueba' });
  window.__p = NovedadesVentana.alEntrar();
});
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('una sola línea', pagina.locator('.novedades-lista li').count(), 1);
await comprobar('es la nueva', pagina.locator('.novedades-lista li').textContent().then(t => /Otra novedad de prueba/.test(t)), true);
await pagina.keyboard.press('Escape');
await pagina.evaluate(() => window.__p);
await comprobar('Escape también la cierra', visible(), 0);
await comprobar('y cuenta como vista', pagina.evaluate(() => localStorage.getItem('gestor.novedadesVistas')), 't13');

console.log('--- 4. el número de versión, pulsable ---');
await comprobar('la versión es pulsable, con su título',
  pagina.evaluate(() => { const s = document.querySelector('#usuario-pie .version-pulsable'); return s ? [s.title, s.textContent === App.textoVersion()] : null; }),
  ['Ver qué hay de nuevo', true]);
await pagina.click('#usuario-pie .version-pulsable');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('salen las 10 últimas, vistas o no', pagina.locator('.novedades-lista:not(.oculto) li').count(), 10);
await comprobar('y «y 3 más»', pagina.locator('#novedades-mas').textContent(), 'y 3 más');
await pagina.click('#cuadro-aceptar');
await comprobar('«Entendido» la cierra', visible(), 0);

console.log('--- 5. recargar: lo visto no vuelve ---');
await comprobar('lo guardado sigue ahí tras recargar', (async () => {
  await pagina.reload();
  return pagina.evaluate(() => localStorage.getItem('gestor.novedadesVistas'));
})(), 't13');

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log(fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien');
