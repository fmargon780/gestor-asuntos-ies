/* Fila 457 (docs/PASAR-A-DRIVE.md): las copias «(N)» que podría dejar Google Drive para ordenadores en
   _GESTOR se juntan como las de Dropbox; un «Acta (2).pdf» de un asunto no se toca. Chromium real con la
   copia de pruebas (?demo=1&auto=1). */
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
await pagina.waitForFunction(() => window.Problemas && Problemas.ids().includes('conflictos'), null, { timeout: 30000 });
await pagina.waitForTimeout(1500);

const nombresEn = (ruta) => pagina.evaluate(async (r) => { let d = App.E.gestor; for (const x of r) d = await d.getDirectoryHandle(x); const n = []; for await (const p of d.entries()) n.push(p[0]); return n.sort(); }, ruta);

console.log('--- 1. qué nombres cuentan como copia de Drive ---');
await comprobar('1. «asuntos (1).json» con «asuntos.json» al lado: copia de asuntos.json',
  pagina.evaluate(() => Conflictos.ficheroReal('asuntos (1).json', { 'asuntos.json': true, 'asuntos (1).json': true })), 'asuntos.json');
await comprobar('1. sin «asuntos.json» al lado: no es copia', pagina.evaluate(() => Conflictos.ficheroReal('asuntos (1).json', { 'asuntos (1).json': true })), '');
await comprobar('1. sin lista de la carpeta (fuera de _GESTOR): no es copia', pagina.evaluate(() => Conflictos.ficheroReal('Acta (2).json')), '');
await comprobar('1. la de Dropbox sigue valiendo, sin lista',
  pagina.evaluate(() => [Conflictos.ficheroReal('asuntos (copia en conflicto de PC2 2026-09-11).json'), Conflictos.ficheroReal("asuntos (PC2's conflicted copy 2026-09-11).json")]), ['asuntos.json', 'asuntos.json']);
await comprobar('1. otra extensión no cuenta', pagina.evaluate(() => Conflictos.ficheroReal('Acta (2).pdf', { 'Acta.pdf': true })), '');

console.log('--- 2. asuntos (1).json se junta con asuntos.json y desaparece ---');
const r2 = await pagina.evaluate(async () => {
  const g = App.E.gestor;
  const real = await Carpetas.leerJson(g, 'asuntos.json');
  const nombre = Object.keys(real.asuntos)[0];
  const otra = JSON.parse(JSON.stringify(real));
  otra.asuntos[nombre].notas = (otra.asuntos[nombre].notas || []).concat([{ id: 'drive-1', texto: 'nota hecha en el otro ordenador', cuando: '2099-01-01T09:00:00.000Z', autor: 'Diego' }]);
  otra.asuntos['Asunto solo del otro ordenador'] = { tipo: real.asuntos[nombre].tipo, notas: [] };
  await Carpetas.escribirTexto(g, 'asuntos (1).json', JSON.stringify(otra));
  await Conflictos.revisar();
  const ahora = await Carpetas.leerJson(g, 'asuntos.json');
  return { nombre, notaUnida: (ahora.asuntos[nombre].notas || []).some((n) => n.id === 'drive-1'), nuevo: !!ahora.asuntos['Asunto solo del otro ordenador'] };
});
await comprobar('2. la nota y el asunto del otro ordenador están en asuntos.json', [r2.notaUnida, r2.nuevo], [true, true]);
await comprobar('2. «asuntos (1).json» ya no está en _GESTOR y la copia está en «copias»',
  Promise.all([nombresEn([]).then((n) => n.includes('asuntos (1).json')), nombresEn(['copias']).then((n) => n.includes('asuntos (1).json'))]), [false, true]);

console.log('--- 3. un documento «Acta (2).pdf» de un asunto no se toca ---');
const r3 = await pagina.evaluate(async () => {
  const g = App.E.gestor;
  const antes = Conflictos.pendientes().length;   /* la demostración ya trae uno */
  const abiertos = App.E.abiertos;
  let carpeta = null;
  for await (const p of abiertos.entries()) if (p[1].kind === 'directory' && p[0] !== '_GESTOR') { carpeta = p[1]; break; }
  await Carpetas.escribirTexto(carpeta, 'Acta.pdf', 'uno');
  await Carpetas.escribirTexto(carpeta, 'Acta (2).pdf', 'dos');
  await Carpetas.escribirTexto(g, 'notas (3).json', '{}');   /* sin «notas.json» al lado: tampoco */
  await Conflictos.revisar();
  const n = []; for await (const p of carpeta.entries()) n.push(p[0]);
  return { documentos: n.filter((x) => /^Acta/.test(x)).sort(), suelto: (await Carpetas.ficheros(g)).some((f) => f.nombre === 'notas (3).json'), pendientes: Conflictos.pendientes().length - antes };
});
await comprobar('3. «Acta.pdf» y «Acta (2).pdf» siguen en su carpeta', r3.documentos, ['Acta (2).pdf', 'Acta.pdf']);
await comprobar('3. «notas (3).json» sin «notas.json» no se trata como copia', [r3.suelto, r3.pendientes], [true, 0]);
await pagina.evaluate(async () => { await App.E.gestor.removeEntry('notas (3).json'); });

console.log('--- 4. una lista que no se funde sola: sale en Problemas, con «el otro ordenador» ---');
await pagina.evaluate(async () => {
  const g = App.E.gestor;
  await Carpetas.escribirTexto(g, 'cargos (1).json', JSON.stringify({ cargos: [] }));
  await Conflictos.revisar();
  App.ir('ajustes'); App.cambiarPestanaAjustes('problemas');
});
await pagina.waitForFunction(() => [...document.querySelectorAll('[data-problema="conflictos"] .problema-elemento')].some((x) => /cargos/i.test(x.textContent)), null, { timeout: 10000 });
const lineas = await pagina.evaluate(() => { const e = [...document.querySelectorAll('[data-problema="conflictos"] .problema-elemento')].find((x) => /cargos/i.test(x.textContent)); return [...e.querySelectorAll('.problema-cambia li')].map((l) => l.textContent); });
await comprobar('4. la versión del otro lleva «el otro ordenador» (nadie sabe quién fue)', /^La del otro ordenador: /.test(lineas[1]), true);
await comprobar('4. y dice qué cambia', lineas.some((l) => /Solo en el otro|Distinto|Solo en este|diferencia/.test(l)), true);

console.log('--- 5. la de Dropbox se junta como siempre ---');
const r5 = await pagina.evaluate(async () => {
  const g = App.E.gestor;
  await g.removeEntry('cargos (1).json');
  await Conflictos.revisar();
  const real = await Carpetas.leerJson(g, 'tablon.json');
  const otro = { notas: ((real && real.notas) || []).concat([{ id: 'dropbox-1', texto: 'nota de PC2', creado: '2026-09-11' }]) };
  await Carpetas.escribirTexto(g, 'tablon (copia en conflicto de PC2 2026-09-11).json', JSON.stringify(otro));
  await Conflictos.revisar();
  const ahora = await Carpetas.leerJson(g, 'tablon.json');
  return [(ahora.notas || []).some((n) => n.id === 'dropbox-1'), (await Carpetas.ficheros(g)).some((f) => /^tablon \(/.test(f.nombre))];
});
await comprobar('5. la nota de PC2 está en el tablón y la copia se ha ido', r5, [true, false]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
