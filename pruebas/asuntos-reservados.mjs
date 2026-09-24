/* Prueba en navegador de verdad de la fila 135 (25-sep-2026,
   docs/ASUNTOS-RESERVADOS.md): asuntos reservados.

   1. Tipo reservado (casilla en la pantalla del tipo) → tarjeta tapada:
      candado, tipo y curso, sin el nombre del tercero.
   2. Un asunto con `reservado: false` en un tipo reservado se ve entero.
   3. El buscador no lo encuentra por una nota; sí por su nombre de
      carpeta, y tapado.
   4. «Mostrar reservados» lo destapa; no se guarda en ningún sitio, así
      que al recargar vuelve a tapar.
   5. Desde el menú de la ficha: «Marcar como reservado», con candado en
      la cabecera.
   6. Cuentas: en «quién lo pide», como «Reservado». */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function esperar(fn, arg) {
  for (let i = 0; i < 100; i++) {
    if (await pagina.evaluate(fn, arg)) return;
    await pagina.waitForTimeout(100);
  }
}

const ANA = '260901 MATRICULA 26-27 Pérez, Ana 1234';
const LUIS = '260902 MATRICULA 26-27 Gómez, Luis 5678';
const COMPRA = '260903 COMPRA Papeles del Sur SL B29111222';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (nombres) => {
  for (const n of nombres) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [ANA, LUIS, COMPRA]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');
await pagina.waitForTimeout(500);

/* Una nota con una palabra que solo está en ella, y Luis sacado a mano del tipo reservado. */
await pagina.evaluate(async ([ana, luis]) => {
  await App.anotar(ana, { notas: [{ texto: 'Parte de expulsion por una pelea', autor: 'Francisco', el: U.ahora() }] });
  await App.anotar(luis, { reservado: false });
  await App.verAbiertos();
}, [ANA, LUIS]);

console.log('--- sin nada reservado: sin candado ni botón ---');
await comprobar('ningún asunto es reservado', pagina.evaluate(() => App.E.listaAbiertos.filter(a => Reservados.es(a)).length), 0);
await comprobar('«Mostrar reservados» no sale', pagina.locator('#btn-mostrar-reservados').isHidden(), true);

console.log('--- 1. la casilla del tipo ---');
await pagina.evaluate(() => App.abrirTipoDeAsunto(App.E.tipos.filter(t => t.tipo === 'MATRICULA')[0]));
await pagina.waitForSelector('#pantalla-tipo-asunto .tipo-reservado', { state: 'attached' });
await pagina.evaluate(() => { document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').open = true; });
await comprobar('dice lo que no hace', pagina.locator('#pantalla-tipo-asunto .tipo-reservado-fila').textContent()
  .then(t => t.indexOf('La carpeta sigue visible en Dropbox') !== -1), true);
await pagina.check('#pantalla-tipo-asunto .tipo-reservado');
await esperar(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const t = JSON.parse(await (await (await g.getFileHandle('tipos.json')).getFile()).text()).filter(x => x.tipo === 'MATRICULA')[0];
  return t && t.reservado === true;
});
await comprobar('se guarda en tipos.json', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  return JSON.parse(await (await (await g.getFileHandle('tipos.json')).getFile()).text()).filter(x => x.tipo === 'MATRICULA')[0].reservado;
}), true);

await pagina.click('.pestana[data-pantalla="abiertos"]');
const tarjeta = (nombreBuscado) => pagina.evaluate((n) => {
  App.pintarAbiertos();
  const t = Array.prototype.filter.call(document.querySelectorAll('#lista-abiertos .tarjeta-asunto'),
    x => x.dataset.prueba === n || x.textContent.indexOf(n) !== -1)[0];
  return t ? { nombre: t.querySelector('.tarjeta-nombre').textContent, pie: t.querySelector('.tarjeta-pie').textContent } : null;
}, nombreBuscado);
const tarjetas = () => pagina.evaluate(() => {
  App.pintarAbiertos();
  return Array.prototype.map.call(document.querySelectorAll('#lista-abiertos .tarjeta-asunto .tarjeta-nombre'), x => x.textContent);
});
const todas = await tarjetas();
const deAna = todas.filter(t => t.indexOf('1234') !== -1 || (t.indexOf('MATRICULA') !== -1 && t.indexOf('Gómez') === -1));
await comprobar('la de Ana, tapada: con candado, tipo y curso, sin su nombre',
  deAna.map(t => [t.indexOf('🔒') !== -1, t.indexOf('MATRICULA') !== -1, t.indexOf('26-27') !== -1, t.indexOf('Pérez') === -1, t.indexOf('1234') === -1]),
  [[true, true, true, true, true]]);
await comprobar('su pie tampoco dice quién es', pagina.evaluate(() => Array.prototype.filter.call(
  document.querySelectorAll('#lista-abiertos .tarjeta-tapada .tarjeta-pie'), p => p.textContent.indexOf('Pérez') !== -1).length), 0);
console.log('--- 2. reservado: false en un tipo reservado ---');
await comprobar('la de Luis se ve entera, sin candado',
  tarjeta('Gómez').then(t => t && [t.nombre.indexOf('Gómez, Luis') !== -1, t.nombre.indexOf('🔒') === -1]), [true, true]);
await comprobar('«Mostrar reservados» ya sale', pagina.locator('#btn-mostrar-reservados').isHidden(), false);

console.log('--- 3. el buscador ---');
await pagina.fill('#buscar-abiertos', 'expulsion');
await pagina.dispatchEvent('#buscar-abiertos', 'input');
await comprobar('por una palabra de la nota, no sale', tarjetas().then(l => l.length), 0);
await pagina.fill('#buscar-abiertos', 'perez');
await pagina.dispatchEvent('#buscar-abiertos', 'input');
await comprobar('por su nombre de carpeta sí sale, pero tapado',
  tarjetas().then(l => l.map(t => [t.indexOf('🔒') !== -1, t.indexOf('Pérez') === -1])), [[true, true]]);

console.log('--- 4. «Mostrar reservados» ---');
await pagina.fill('#buscar-abiertos', '');
await pagina.dispatchEvent('#buscar-abiertos', 'input');
await pagina.click('#btn-mostrar-reservados');
await comprobar('destapado: se ve el nombre, con candado',
  tarjetas().then(l => l.filter(t => t.indexOf('Pérez, Ana') !== -1).map(t => t.indexOf('🔒') !== -1)), [true]);
await pagina.fill('#buscar-abiertos', 'expulsion');
await pagina.dispatchEvent('#buscar-abiertos', 'input');
await comprobar('y el buscador ya lo encuentra por la nota', tarjetas().then(l => l.length), 1);
await pagina.fill('#buscar-abiertos', '');
await pagina.dispatchEvent('#buscar-abiertos', 'input');
await comprobar('no se apunta en ningún sitio del navegador',
  pagina.evaluate(() => JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage)))
    .then(t => /reservad/i.test(t)), false);
/* Recargar: el módulo arranca de nuevo, con lo tapado de partida. */
await pagina.evaluate(async () => {
  const js = await (await fetch('js/reservados.js')).text();
  (0, eval)(js);
  window.Reservados = Reservados;
});
await comprobar('al recargar vuelve a tapar',
  tarjetas().then(l => l.filter(t => t.indexOf('🔒') !== -1).map(t => t.indexOf('Pérez') === -1)), [true]);

console.log('--- 5. desde la ficha ---');
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter(a => a.nombre === n)[0], 'abierto'), COMPRA);
await pagina.waitForSelector('.ficha-nombre-menu-boton');
await comprobar('sin candado en la cabecera', pagina.locator('.ficha-nombre .marca-reservado').count(), 0);
await pagina.click('.ficha-nombre-menu-boton');
await pagina.click('.ficha-menu:not(.oculto) >> text=Marcar como reservado');
await esperar(() => document.querySelectorAll('.ficha-nombre .marca-reservado').length === 1);
await comprobar('candado en la cabecera', pagina.locator('.ficha-nombre .marca-reservado').count(), 1);
await comprobar('la ficha se ve entera', pagina.locator('.ficha-nombre-texto').textContent(), COMPRA);
await comprobar('guardado en asuntos.json', pagina.evaluate(async (n) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  return JSON.parse(await (await (await g.getFileHandle('asuntos.json')).getFile()).text()).asuntos[n].reservado;
}, COMPRA), true);
await pagina.click('.ficha-nombre-menu-boton');
await comprobar('y el menú ya ofrece quitarla',
  pagina.locator('.ficha-menu:not(.oculto)').textContent().then(t => t.indexOf('Quitar la reserva') !== -1), true);
await pagina.keyboard.press('Escape');

console.log('--- 6. Cuentas ---');
await comprobar('en «quién lo pide», como «Reservado»; Luis no',
  pagina.evaluate(([ana, luis]) => [ana, luis].map(n => Cuentas._entradaAbierta(App.E.listaAbiertos.filter(a => a.nombre === n)[0], App.E.tipos).loPide), [ANA, LUIS]),
  ['Reservado', '']);
  /* ↑ LUIS no tiene «Lo pide» apuntado: cadena vacía, como siempre. */

console.log('--- «Qué me toca»: con candado y sin el tercero ---');
await comprobar('el nombre que enseña', pagina.evaluate((n) => Reservados.nombreParaVer(App.E.listaAbiertos.filter(a => a.nombre === n)[0]), ANA),
  '260901 MATRICULA 26-27 · reservado');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
