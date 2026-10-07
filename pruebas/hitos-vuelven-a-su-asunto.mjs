/* Fila 292 (docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartado 1): los hitos de un asunto que ya no existe
   con ese nombre pueden volver a su asunto: pasar (el asunto no tenía hitos), unir (ya tenía) y deshacer.
   Chromium real con la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForFunction(() => window.Problemas && ['carpetas', 'hitos', 'conflictos'].every((id) => Problemas.ids().includes(id)), null, { timeout: 30000 });
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => { App.ir('ajustes'); App.cambiarPestanaAjustes('problemas'); });
await pagina.waitForTimeout(500);

const VIVO = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).find((k) => /A26-0888/.test(k)));
const VIEJO = await pagina.evaluate(async () => Object.keys((await Hitos.leer()).porAsunto).find((k) => /A26-0888/.test(k)));
const hitosDe = (clave) => pagina.evaluate(async (c) => { const d = await Hitos.leer(); return d.porAsunto[c] ? d.porAsunto[c].hitos.map((h) => h.titulo + ':' + h.estado) : null; }, clave);
const filaVieja = () => pagina.locator('[data-problema="hitos"] .problema-elemento', { hasText: 'A26-0888' });

console.log('--- 1. cada línea: «Son de este asunto…» y «Quitar» ---');
await comprobar('1. la línea del asunto de la demostración lleva los dos botones, el primero es el normal, y no dice «no los quites todavía»',
  pagina.evaluate(() => {
    const t = document.querySelector('[data-problema="hitos"]');
    const bs = [...t.querySelectorAll('.problema-elemento')].map((e) => [...e.querySelectorAll('button')].map((b) => b.textContent));
    return [bs, t.textContent.includes('no los quites')];
  }), [[['Son de este asunto… (lo normal)', 'Quitar'], ['Son de este asunto… (lo normal)', 'Quitar']], false]);
await comprobar('1. el asunto vivo no tiene hitos todavía; el nombre viejo tiene tres', pagina.evaluate(async (v) => {
  const d = await Hitos.leer();
  return [d.porAsunto[v] ? d.porAsunto[v].hitos.length : 0, Object.keys(d.porAsunto).filter((k) => /A26-0888/.test(k)).length];
}, VIVO), [0, 1]);

console.log('--- 2. el cuadro propone el asunto y dice qué se mueve ---');
await filaVieja().getByRole('button', { name: 'Son de este asunto… (lo normal)' }).click();
await pagina.waitForSelector('#enlace-buscar');
await comprobar('2. «Parece este:» con el asunto del mismo número, y «3 hitos, 1 hecho» con los títulos',
  pagina.evaluate(() => {
    const c = document.getElementById('cuadro-cuerpo');
    const bloque = [...c.querySelectorAll('.enlace-bloque')][0];
    return [bloque.querySelector('.etiqueta').textContent, [...bloque.querySelectorAll('.enlace-asunto')].map((b) => b.dataset.nombre),
      /3 hitos, 1 hecho/.test(c.textContent), c.textContent.includes('Pedir presupuesto, Encargar la impresión, Pagar la factura')];
  }), ['Parece este:', [VIVO], true, true]);

console.log('--- 3. «Pasar los hitos» y el aviso con «Deshacer» ---');
await pagina.locator('#cuadro-cuerpo .enlace-bloque').first().locator('.enlace-asunto').click();
await pagina.waitForSelector('#cuadro-aceptar:not(.oculto)');
await comprobar('3. el cuadro dice «Pasar los hitos»', pagina.locator('#cuadro-aceptar').textContent(), 'Pasar los hitos');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#mensajes .mensaje.bueno .mensaje-boton');
await comprobar('3. aviso verde «Hitos pasados a …» con «Deshacer»',
  pagina.locator('#mensajes .mensaje.bueno:has(.mensaje-boton)').first().evaluate((m) => [m.textContent.startsWith('Hitos pasados a '), m.querySelector('.mensaje-boton').textContent]), [true, 'Deshacer']);
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="hitos"] .problema-elemento').length === 1, null, { timeout: 10000 });
await comprobar('3. la línea desaparece de la tarjeta', filaVieja().count(), 0);
await comprobar('3. el asunto vivo tiene los tres hitos, y el nombre viejo ya no', Promise.all([hitosDe(VIVO), hitosDe(VIEJO).then((h) => !!h)]),
  [['Pedir presupuesto:hecho', 'Encargar la impresión:encurso', 'Pagar la factura:pendiente'], false]);

console.log('--- 4. «Deshacer» ---');
await pagina.locator('#mensajes .mensaje.bueno .mensaje-boton').first().click();
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="hitos"] .problema-elemento').length === 2, null, { timeout: 10000 });
await comprobar('4. la línea vuelve a la tarjeta', filaVieja().count(), 1);
await comprobar('4. el asunto vivo se queda sin esos hitos', hitosDe(VIVO), null);

console.log('--- 5. unir con un asunto que ya tiene hitos ---');
const DESTINO = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).find((k) => /Aguilar Ponce, Pablo/.test(k)));
await pagina.evaluate(async (d) => {   /* uno con el mismo título que uno del nombre viejo, sin hacer: debe contar como uno */
  await Hitos.cambiar((x) => { x.porAsunto[d].hitos.push(Hitos.normalizarHito({ id: 'otro-pagar', titulo: 'Pagar la factura', estado: 'pendiente', clase: 'paso' })); return x; });
}, DESTINO);
const antes = await hitosDe(DESTINO);
await filaVieja().getByRole('button', { name: 'Son de este asunto… (lo normal)' }).click();
await pagina.waitForSelector('#enlace-buscar');
await pagina.fill('#enlace-buscar', 'Pablo');
await pagina.locator('#enlace-todos .enlace-asunto').first().click();
await pagina.waitForSelector('#cuadro-aceptar:not(.oculto)');
await comprobar('5. el cuadro avisa de que se unen y el botón dice «Unir los hitos»',
  pagina.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cuerpo').textContent.includes('ya tiene ' + (document.getElementById('cuadro-cuerpo').textContent.match(/ya tiene (\d+) hitos/) || [])[1] + ' hitos. Se unen'),
    document.getElementById('cuadro-cuerpo').textContent.includes('el mismo título cuentan como uno')]), ['Unir los hitos', true, true]);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="hitos"] .problema-elemento').length === 1, null, { timeout: 10000 });
const despues = await hitosDe(DESTINO);
await comprobar('5. el asunto tiene los hitos de los dos, sin repetir el del mismo título',
  [despues.length, despues.filter((t) => t.startsWith('Pagar la factura')).length, despues.filter((t) => antes.includes(t)).length === antes.length, despues.includes('Pedir presupuesto:hecho')],
  [antes.length + 2, 1, true, true]);
await pagina.locator('#mensajes .mensaje.bueno .mensaje-boton').first().click();
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="hitos"] .problema-elemento').length === 2, null, { timeout: 10000 });
await comprobar('5. «Deshacer» deja el asunto como estaba', hitosDe(DESTINO), antes);

console.log('--- 6. cancelar no mueve nada ---');
await filaVieja().getByRole('button', { name: 'Son de este asunto… (lo normal)' }).click();
await pagina.waitForSelector('#enlace-buscar');
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(300);
await comprobar('6. los tres hitos siguen en el nombre viejo', filaVieja().textContent().then((t) => /3 hitos/.test(t)), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
