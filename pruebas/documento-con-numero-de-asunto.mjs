/* Fila 760 (docs/760-DOCUMENTO-CON-NUMERO-A-SU-ASUNTO.md): en «Por clasificar», un documento que lleva el número de un asunto (A26-0002)
   en el nombre, o solo dentro del texto del PDF, dice «Es de» y ese asunto y propone guardarse en él; con el asunto archivado ofrece
   «Reabrir y guardar aquí» y «Guardar sin reabrir»; sin número la tarjeta queda como siempre. Nunca guarda sin pulsar. Con Chromium real
   y la copia de pruebas (?demo=1&auto=1&latido=hoy). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&latido=hoy';
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await (await navegador.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errores = [];
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await p.goto(DIRECCION);
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await p.waitForFunction(() => window.Demo && !Demo.montando && window.SueltoConNumero && App.E.sueltos.length >= 6, null, { timeout: 60000 });
await p.waitForTimeout(2000);

/* Un tercer asunto abierto (A26-0035) cuyo número solo sale dentro del texto de un PDF de verdad. */
const NUMERO_EN_TEXTO = await p.evaluate(async () => {
  const k = Object.keys(App.E.registro.asuntos).filter((x) => /SANCION Klein Soto, Ana/.test(x))[0];
  const numero = App.E.registro.asuntos[k].numero;
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([595, 842]).drawText('Referencia del expediente ' + numero + ' del alumnado', { x: 50, y: 700, size: 14 });
  await Carpetas.escribirBytes(App.E.abiertos, 'Informe de la Consejería.pdf', await doc.save(), 'application/pdf');
  return numero;
});
const ABIERTO = await p.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /MATRICULA Aguilar Ponce, Pablo/.test(x))[0]);
const ARCHIVADO = await p.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /CERTIFICADO Bravo Lozano, Hugo/.test(x))[0]);
const SANCION = await p.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /SANCION Klein Soto, Ana/.test(x))[0]);
await p.evaluate(async () => { await Gestor.recargar(); });
await p.click('.panel[data-vista="clasificar"]');
await p.waitForSelector('#lista-sueltos .tarjeta-suelto', { timeout: 15000 });
await p.waitForFunction(() => document.querySelector('.tarjeta-suelto[data-suelto="Informe de la Consejería.pdf"] .propuesta-numero'), null, { timeout: 20000 });
await p.waitForTimeout(500);

const tarjeta = (n) => p.evaluate((n) => {
  const t = document.querySelector('.tarjeta-suelto[data-suelto="' + n + '"]');
  return t && {
    es: (t.querySelector('.propuesta-numero') || {}).textContent || null,
    botones: Array.from(t.querySelectorAll('.acciones > button')).map((b) => b.textContent + (b.classList.contains('boton-principal') ? '*' : '')),
    sugerencias: Array.from(t.querySelectorAll('.tarjeta-pie')).filter((x) => /Podría ir en/.test(x.textContent)).length
  };
}, n);
const enAbiertos = (n) => p.evaluate(async (n) => { try { await App.E.abiertos.getFileHandle(n); return true; } catch (e) { return false; } }, n);

console.log('--- 1. el número está en el nombre, asunto abierto ---');
const N1 = 'Correo de Secretaría · ' + (await p.evaluate((a) => App.E.registro.asuntos[a].numero, ABIERTO)) + '.pdf';
comprobar('1. dice «Es de» y el asunto, y «Guardar en ese asunto» es el principal', await tarjeta(N1),
  { es: 'Es de' + ABIERTO, botones: ['Guardar en ese asunto*', 'Crear asunto con él', 'Guardar en un asunto'], sugerencias: 0 });

console.log('--- 2. el número solo está en el texto del PDF ---');
comprobar('2. dice «Es de» el asunto del número del texto', await tarjeta('Informe de la Consejería.pdf'),
  { es: 'Es de' + SANCION, botones: ['Guardar en ese asunto*', 'Crear asunto con él', 'Guardar en un asunto'], sugerencias: 0 });

console.log('--- 3. asunto archivado ---');
const N3 = (await p.evaluate(() => App.E.sueltos.map((s) => s.nombre)))
  .filter((n) => /^Recibido A26-\d+ certificado\.pdf$/.test(n))[0];
comprobar('3. «Reabrir y guardar aquí» principal y «Guardar sin reabrir»', await tarjeta(N3),
  { es: 'Es de' + ARCHIVADO + '  ·  asunto cerrado', botones: ['Reabrir y guardar aquí*', 'Guardar sin reabrir', 'Crear asunto con él', 'Guardar en un asunto'], sugerencias: 0 });

console.log('--- 4. sin número, como siempre ---');
const T4 = await tarjeta('justificante.pdf');
comprobar('4. sin «Es de» y «Crear asunto con él» sigue de principal', [T4.es, T4.botones], [null, ['Crear asunto con él*', 'Guardar en un asunto']]);

console.log('--- 5. nunca se guarda sin pulsar ---');
comprobar('5. los tres siguen en «Por clasificar»', [await enAbiertos(N1), await enAbiertos(N3), await enAbiertos('Informe de la Consejería.pdf')], [true, true, true]);

console.log('--- 6. «Guardar en ese asunto» lleva al cuadro del nombre ---');
await p.click('.tarjeta-suelto[data-suelto="' + N1 + '"] [data-accion-suelto="numero-guardar"]');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('6. el cuadro es el del asunto elegido y el fichero sigue en «Por clasificar»', await p.evaluate(async (n) => [
  document.querySelector('#cuadro-cuerpo, #capa').innerText.indexOf('Aguilar Ponce, Pablo') !== -1,
  await App.E.abiertos.getFileHandle(n).then(() => true, () => false)], N1), [true, true]);
await p.click('#doc-volver');
await p.waitForTimeout(600);
comprobar('6. «Volver» no guarda nada', await enAbiertos(N1), true);

console.log('--- 7. asunto archivado: «Guardar sin reabrir» y «Reabrir y guardar aquí» ---');
await p.evaluate(() => { window.__reabiertos = []; App.reabrirAsunto = async (pedido) => { window.__reabiertos.push(pedido.nombre); }; });
await p.click('.tarjeta-suelto[data-suelto="' + N3 + '"] [data-accion-suelto="numero-reabrir"]');
await p.waitForTimeout(1200);
comprobar('7. «Reabrir y guardar aquí» pide reabrir ese asunto y, sin reabrirlo, no toca el documento',
  [await p.evaluate(() => window.__reabiertos), await enAbiertos(N3)], [[ARCHIVADO], true]);
await p.click('.tarjeta-suelto[data-suelto="' + N3 + '"] [data-accion-suelto="numero-guardar"]');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('7. «Guardar sin reabrir» no pregunta si reabrir: va al cuadro del nombre', await p.evaluate(() => [
  !!document.querySelector('#doc-guardar'), window.__reabiertos.length], null), [true, 1]);
await p.click('#doc-volver');
await p.waitForTimeout(400);

comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallo(s)' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
