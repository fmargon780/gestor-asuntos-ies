/* Fila 646 (docs/646-COGER-DE-POR-CLASIFICAR.md): en la tarea de añadir documento, «Coger de Por clasificar» junto al recuadro de soltar
   abre la lista de los sueltos (el más reciente arriba); al elegir uno sale el cuadro del nombre con el hito y la tarea puestos y el
   fichero aún en «Por clasificar»; entra en el asunto al pulsar «Guardar». Con Chromium real y la copia de pruebas con sueltos
   (?demo=1&auto=1&latido=hoy). */
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
await p.waitForFunction(() => window.Demo && !Demo.montando && window.TareaCogerDeBandeja && App.E.sueltos.length >= 2, null, { timeout: 60000 });
await p.waitForTimeout(2500);
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="MATRICULA Aguilar Ponce, Pablo"] .tarjeta-nombre').first().click();
await p.waitForSelector('.hito-en-mesa .guion-paso', { timeout: 15000 });
await p.waitForTimeout(1000);

const PABLO = await p.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /MATRICULA Aguilar Ponce, Pablo/.test(x))[0]);
const enAbiertos = (n) => p.evaluate(async (n) => { try { await App.E.abiertos.getFileHandle(n); return true; } catch (e) { return false; } }, n);
const sueltos = () => p.evaluate(() => App.E.sueltos.map((s) => s.nombre).sort());
const tareaHecha = () => p.evaluate(async (n) => {
  const a = { nombre: n, ficha: App.E.registro.asuntos[n], leido: Nombres.leer(n, App.E.tipos) };
  return (await Hitos.hitosDe(n))[1] ? Hitos.guionDe(a, (await Hitos.hitosDe(n))[1]).filter((g) => /Reunir el libro de familia/.test(g.texto)).map((g) => !!g.hecho) : null;
}, PABLO);

console.log('--- 1. dónde sale el botón ---');
comprobar('1. sale una sola vez, en la siguiente tarea de añadir documento, junto al recuadro', await p.evaluate(() => ({
  botones: document.querySelectorAll('.guion-coger-bandeja').length,
  junto: !!document.querySelector('.guion-siguiente .guion-soltar + .guion-coger .guion-coger-bandeja'),
  recuadro: document.querySelector('.guion-soltar').textContent })), { botones: 1, junto: true, recuadro: 'Suelta aquí el PDF' });

console.log('--- 2. la lista ---');
const antes = await sueltos();
await p.click('.guion-coger-bandeja');
await p.waitForSelector('#cuadro-cuerpo .coger-fila', { timeout: 10000 });
comprobar('2. enseña todos los sueltos, con nombre y fecha', await p.$$eval('#cuadro-cuerpo .coger-fila', (l) => l.map((b) => [b.querySelector('.coger-nombre').textContent, /^\d{1,2}\/\d{1,2}\/\d{4} \d\d:\d\d$/.test(b.querySelector('.coger-fecha').textContent)]).sort()),
  antes.map((n) => [n, true]).sort());
comprobar('2. con el más reciente arriba', await p.evaluate(async () => {
  const f = await TareaCogerDeBandeja.lista();
  const orden = f.map((x) => x.fecha ? x.fecha.getTime() : 0);
  const mostrados = Array.from(document.querySelectorAll('#cuadro-cuerpo .coger-nombre')).map((e) => e.textContent);
  return [orden.every((t, i) => i === 0 || orden[i - 1] >= t), mostrados[0] === f[0].s.nombre];
}), [true, true]);
await p.click('#cuadro-aceptar');   /* «Volver» */
await p.waitForTimeout(400);
comprobar('2. «Volver» cierra la lista y no toca nada', [await p.locator('#capa:not(.oculto)').count(), await sueltos()], [0, antes]);

console.log('--- 3. elegir uno ---');
const ELEGIDO = antes.filter((n) => /justificante/i.test(n))[0] || antes[0];
await p.click('.guion-coger-bandeja');
await p.waitForSelector('#cuadro-cuerpo .coger-fila');
await p.locator('#cuadro-cuerpo .coger-fila', { hasText: ELEGIDO }).first().click();
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
await p.waitForSelector('#doc-tarea-bloque h4', { timeout: 15000 });
await p.waitForTimeout(400);
comprobar('3. sale el cuadro del nombre con el hito y la tarea puestos', await p.evaluate(() => {
  const t = document.querySelector('#doc-tarea-bloque').innerText;
  return [/Hito: 2\./.test(t), /Tarea: Reunir el libro de familia/.test(t)]; }), [true, true]);
comprobar('3. el fichero sigue en «Por clasificar»', await enAbiertos(ELEGIDO), true);
await p.click('#doc-volver');
await p.waitForTimeout(800);
comprobar('3. «Volver» no guarda nada: sigue en «Por clasificar» y la tarea sigue sin hacer', [await enAbiertos(ELEGIDO), await sueltos(), await tareaHecha()], [true, antes, [false]]);

console.log('--- 4. «Guardar» ---');
await p.click('.guion-coger-bandeja');
await p.waitForSelector('#cuadro-cuerpo .coger-fila');
await p.locator('#cuadro-cuerpo .coger-fila', { hasText: ELEGIDO }).first().click();
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
await p.selectOption('#doc-tipo', 'JUSTIFICANTE');
await p.waitForTimeout(400);
await p.click('#doc-guardar');
await p.waitForTimeout(3500);
comprobar('4. el documento sale de «Por clasificar» y entra en la carpeta del asunto', await p.evaluate(async ([n, a]) => {
  const d = await App.E.abiertos.getDirectoryHandle(a);
  const dentro = (await Carpetas.ficheros(d)).map((f) => f.nombre).filter((x) => /JUSTIFICANTE D26-/.test(x)).length;
  return [(App.E.sueltos || []).some((s) => s.nombre === n), dentro > 0];
}, [ELEGIDO, PABLO]), [false, true]);
comprobar('4. la tarea queda hecha', await tareaHecha(), [true]);

console.log('--- 5. directivo ---');
comprobar('5. como directivo no se ve el botón', await p.evaluate(() => {
  document.body.classList.add('perfil-directivo');
  const v = getComputedStyle(document.querySelector('.guion-coger-bandeja').parentElement).display;
  document.body.classList.remove('perfil-directivo');
  return v; }), 'none');

console.log('--- 6. sin ningún suelto ---');
await p.evaluate(() => { App.E.sueltos = []; });
const hayBoton = await p.locator('.guion-coger-bandeja').count();
if (hayBoton) {
  await p.click('.guion-coger-bandeja');
  await p.waitForSelector('#cuadro-cuerpo');
  comprobar('6. sin sueltos la lista lo dice', await p.textContent('#cuadro-cuerpo'), 'No hay documentos en «Por clasificar».');
  await p.click('#cuadro-aceptar');
} else console.log('--     (la siguiente tarea ya no es de añadir documento: sin botón; se comprueba con la lista vacía directa)');
comprobar('6. la lista vacía no tiene filas', await p.evaluate(async () => (await TareaCogerDeBandeja.lista()).length), 0);

comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallo(s)' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
