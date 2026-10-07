/* Fila 292 (docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartado 4): «Qué cambia» en la tarjeta de lo
   guardado a la vez en dos ordenadores. De cuándo es cada versión, las diferencias con nombres (como
   mucho diez líneas y «y N más»), «Las dos dicen lo mismo.» con un solo botón «Resolver», y que enseñar
   la diferencia no escribe nada. Chromium real con la copia de pruebas (?demo=1&auto=1). */
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
await pagina.evaluate(() => { App.ir('ajustes'); App.cambiarPestanaAjustes('problemas'); });
await pagina.waitForTimeout(500);

const nombresEnGestor = () => pagina.evaluate(async () => { const n = []; for await (const p of App.E.gestor.entries()) n.push(p[0]); return n.sort(); });

console.log('--- 1. «Qué cambia» en la tarjeta de la demostración ---');
const antes = await nombresEnGestor();
const lineas = await pagina.evaluate(() => [...document.querySelectorAll('[data-problema="conflictos"] .problema-cambia li')].map((l) => l.textContent));
await comprobar('1. la línea lleva «Qué cambia», abierto, antes de los dos botones',
  pagina.evaluate(() => { const e = document.querySelector('[data-problema="conflictos"] .problema-elemento'); const d = e.querySelector('details.problema-cambia');
    return [d.querySelector('summary').textContent, d.open, !!(d.compareDocumentPosition(e.querySelector('.problema-acciones')) & Node.DOCUMENT_POSITION_FOLLOWING)]; }), ['Qué cambia', true, true]);
await comprobar('1. de cuándo es cada versión, con día y hora, y de qué ordenador es la otra',
  [/^La de este ordenador: .*20\d\d.*\d:\d\d/.test(lineas[0]), /^La del otro \(PC-Secretaría\): 5 oct 2026, \d\d:\d\d$/.test(lineas[1])], [true, true]);
await comprobar('1. las dos diferencias, con nombres: una solo aquí y una solo en el otro',
  [lineas.length, /^Solo en este ordenador: \S/.test(lineas[2]), lineas[3]], [4, true, 'Solo en el otro: Informe de la Inspección']);
await comprobar('1. no se nombra ningún fichero ni dato interno',
  /json|\.js|_esquema/i.test(lineas.join(' ')), false);
await comprobar('1. enseñar la diferencia no escribe nada: _GESTOR sigue igual', nombresEnGestor(), antes);

console.log('--- 2. cómo se cuenta la diferencia de cada fichero ---');
const comparar = (mio, otro) => pagina.evaluate(([a, b]) => ConflictosDiferencias.comparar(null, 'x.json', a, b), [mio, otro]);
await comprobar('2. la lista de asuntos: uno nuevo, uno que solo está en el otro y uno distinto, con lo que cambia',
  comparar({ asuntos: { 'A uno': { situacion: 'Pedir', notas: [{ id: 'n1', texto: 'a' }] }, 'B nuevo': {}, 'C igual': { x: 1 } } },
    { asuntos: { 'A uno': { situacion: 'Pagar', notas: [{ id: 'n1', texto: 'a' }, { id: 'n2', texto: 'b' }, { id: 'n3', texto: 'c' }] }, 'D del otro': {}, 'C igual': { x: 1 } } }),
  { igual: false, lineas: ['Solo en este ordenador: B nuevo', 'Solo en el otro: D del otro', 'Distinto: A uno — hito actual, 2 notas'] });
await comprobar('2. el tablón: las notas que solo están en una',
  comparar({ notas: [{ id: '1', texto: 'Reunión el lunes' }] }, { notas: [{ id: '1', texto: 'Reunión el lunes' }, { id: '2', texto: 'Traer el acta' }] }),
  { igual: false, lineas: ['Solo en el otro: Traer el acta'] });
await comprobar('2. los hitos: el asunto y el hito que cambia',
  comparar({ porAsunto: { 'Asunto X': { hitos: [{ id: 'h1', titulo: 'Pedir', estado: 'hecho' }] } } }, { porAsunto: { 'Asunto X': { hitos: [{ id: 'h1', titulo: 'Pedir', estado: 'encurso' }] } } }),
  { igual: false, lineas: ['Distinto: Asunto X, hito Pedir — estado'] });
await comprobar('2. dos listas iguales (aunque el esquema cambie): las dos dicen lo mismo',
  comparar({ _esquema: 1, tipos: ['a', 'b'] }, { _esquema: 2, tipos: ['a', 'b'] }), { igual: true, lineas: [] });
await comprobar('2. un fichero que no se sabe contar: sin detalle', comparar({ margen: 1 }, { margen: 2 }), { sinDetalle: true, lineas: [] });
await comprobar('2. como mucho diez líneas, y «y N más»', pagina.evaluate(async () => {
  const g = App.E.gestor;
  const mia = [], otra = [];
  for (let i = 0; i < 14; i++) otra.push('Tipo ' + i);
  await Carpetas.escribirTexto(g, 'tipos-documento.json', JSON.stringify(mia));
  await Carpetas.escribirTexto(g, 'tipos-documento (copia en conflicto de PC9 2026-10-06).json', JSON.stringify(otra));
  const d = await ConflictosDiferencias.describir(g, { real: 'tipos-documento.json', nombreConflicto: 'tipos-documento (copia en conflicto de PC9 2026-10-06).json' });
  return [d.lineas.length, d.mas, d.cuando[1].startsWith('La del otro (PC9): ')];
}), [10, 4, true]);
await pagina.evaluate(async () => {   /* se deja la lista como estaba en la demostración */
  await Carpetas.escribirTexto(App.E.gestor, 'tipos-documento.json', JSON.stringify(App.E.tiposDocumento));
  await App.E.gestor.removeEntry('tipos-documento (copia en conflicto de PC9 2026-10-06).json');
});

console.log('--- 3. las dos versiones dicen lo mismo: un solo botón «Resolver» ---');
await pagina.evaluate(async () => {
  const g = App.E.gestor;
  const real = await Carpetas.leerTexto(g, 'estados.json');
  await Carpetas.escribirTexto(g, 'estados (copia en conflicto de PC2 2026-10-06).json', real);
  await Conflictos.revisar();
});
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="conflictos"] .problema-elemento').length === 2, null, { timeout: 10000 });
await comprobar('3. «Las dos dicen lo mismo.» y un solo botón, «Resolver»',
  pagina.evaluate(() => { const e = [...document.querySelectorAll('[data-problema="conflictos"] .problema-elemento')].find((x) => /estados/.test(x.textContent));
    return [e.querySelector('.problema-nombre').textContent, [...e.querySelectorAll('.problema-cambia li')].pop().textContent, [...e.querySelectorAll('button')].map((b) => b.textContent)]; }),
  ['La lista de estados', 'Las dos dicen lo mismo.', ['Resolver']]);
await pagina.locator('[data-problema="conflictos"] .problema-elemento', { hasText: 'La lista de estados' }).getByRole('button', { name: 'Resolver' }).click();
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="conflictos"] .problema-elemento').length === 1, null, { timeout: 10000 });
await comprobar('3. «Resolver» deja la de este ordenador y guarda la otra en las copias',
  pagina.evaluate(async () => { const g = App.E.gestor; const n = []; for await (const p of g.entries()) n.push(p[0]);
    const c = await g.getDirectoryHandle('copias'); const k = []; for await (const p of c.entries()) k.push(p[0]);
    return [n.some((x) => /estados \(copia/.test(x)), k.some((x) => /estados \(copia/.test(x))]; }), [false, true]);

console.log('--- 4. un fichero que no se sabe contar ---');
await pagina.evaluate(async () => {
  await Carpetas.escribirTexto(App.E.gestor, 'margenes-pdf (copia en conflicto de PC2 2026-10-06).json', JSON.stringify({ arriba: 3 }));
  await Conflictos.revisar();
});
await pagina.waitForFunction(() => document.querySelectorAll('[data-problema="conflictos"] .problema-elemento').length === 2, null, { timeout: 10000 });
await comprobar('4. «No se puede enseñar la diferencia de este fichero.», con sus dos botones de siempre',
  pagina.evaluate(() => { const e = [...document.querySelectorAll('[data-problema="conflictos"] .problema-elemento')].find((x) => /márgenes/.test(x.textContent));
    return [[...e.querySelectorAll('.problema-cambia li')].pop().textContent, [...e.querySelectorAll('button')].map((b) => b.textContent)]; }),
  ['No se puede enseñar la diferencia de este fichero.', ['Quedarse con el de este ordenador', 'Quedarse con el otro']]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
