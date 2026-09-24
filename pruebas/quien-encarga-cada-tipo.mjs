/* Prueba en navegador de verdad de la fila 134 (25-sep-2026,
   docs/QUIEN-ENCARGA-CADA-TIPO.md): quién encarga cada tipo.

   1. Un tipo sin `organo` sale como «Sin asignar».
   2. Al asignarlo en Ajustes › «Quién encarga cada tipo» se guarda en
      tipos.json, y el resumen del bloque lo cuenta.
   3. La parrilla de Nuevo asunto agrupa por órgano.
   4. El filtro «Lo encarga» de Asuntos abiertos filtra.
   5. Cuentas suma por órgano.
   6. El desplegable de la pantalla de un tipo, y el de «+ Crear tipo
      nuevo», también guardan. */
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

async function organoEnDisco(nombre) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('tipos.json');
    const t = JSON.parse(await (await h.getFile()).text()).filter(x => x.tipo === n)[0];
    return t ? (t.organo || '') : null;
  }, nombre);
}
/* Espera (hasta 10 s) a que el guardado llegue al disco. */
async function esperarOrgano(nombre, valor) {
  for (let i = 0; i < 100; i++) {
    if (await organoEnDisco(nombre) === valor) return;
    await pagina.waitForTimeout(100);
  }
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Pérez, Ana 1234', { create: true });
  await window.__disco.abiertos.getDirectoryHandle('260902 COMPRA Papeles del Sur SL B29111222', { create: true });
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');
await pagina.waitForTimeout(600);

console.log('--- 1. un tipo sin organo: «Sin asignar» ---');
await comprobar('MATRICULA no trae órgano en tipos.json', organoEnDisco('MATRICULA'), '');
await comprobar('y se lee como «Sin asignar»',
  pagina.evaluate(() => TiposOrgano.texto(TiposOrgano.deNombre('MATRICULA'))), 'Sin asignar');
await comprobar('un valor raro se lee también como vacío',
  pagina.evaluate(() => TiposOrgano.deTipo({ tipo: 'X', organo: 'conserjeria' })), '');

console.log('--- 2. Ajustes › «Quién encarga cada tipo» ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => App.cambiarPestanaAjustes('tipos'));
await pagina.waitForSelector('#bloque-tipos-organo');
const total = await pagina.evaluate(() => App.E.tipos.length);
const resumen = () => pagina.locator('#bloque-tipos-organo .bloque-resumen').textContent();
await comprobar('el resumen del título dice cuántos faltan', resumen(), total + ' sin asignar');
await pagina.evaluate(() => { document.getElementById('bloque-tipos-organo').open = true; });
await comprobar('una fila por tipo', pagina.locator('#bloque-tipos-organo .tipos-organo-fila').count(), total);
const filaDe = (tipo) => pagina.locator('#bloque-tipos-organo .tipos-organo-fila', { has: pagina.locator('.nombre-tipo', { hasText: new RegExp('^' + tipo + '$') }) });
await filaDe('MATRICULA').locator('select').selectOption('SECRETARIA');
await esperarOrgano('MATRICULA', 'SECRETARIA');
await comprobar('al cambiar el desplegable se guarda en tipos.json', organoEnDisco('MATRICULA'), 'SECRETARIA');
await comprobar('y el resumen baja uno', resumen(), (total - 1) + ' sin asignar');
await pagina.check('#tipos-organo-solo-sin');
await comprobar('«Solo los sin asignar» deja fuera el ya asignado',
  pagina.locator('#bloque-tipos-organo .tipos-organo-fila').count(), total - 1);
await pagina.uncheck('#tipos-organo-solo-sin');

console.log('--- 6. la pantalla de un tipo y «+ Crear tipo nuevo» ---');
await pagina.evaluate(() => App.abrirTipoDeAsunto(App.E.tipos.filter(t => t.tipo === 'COMPRA')[0]));
await pagina.waitForSelector('#pantalla-tipo-asunto .tipo-organo-fila select', { state: 'attached' });
await pagina.evaluate(() => { document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').open = true; });
await comprobar('«Quién lo encarga» sale junto a la categoría, sin asignar',
  pagina.locator('#pantalla-tipo-asunto .tipo-organo-fila select').inputValue(), '');
await pagina.selectOption('#pantalla-tipo-asunto .tipo-organo-fila select', 'DIRECCION');
await esperarOrgano('COMPRA', 'DIRECCION');
await comprobar('y guarda en tipos.json', organoEnDisco('COMPRA'), 'DIRECCION');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await pagina.fill('#buscar-tipo', 'guardia de recreo');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.waitForSelector('#tipo-al-vuelo-panel:not(.oculto)');
await comprobar('el panel trae el desplegable, sin asignar de partida',
  pagina.locator('#tipo-al-vuelo-organo').inputValue(), '');
await pagina.selectOption('#tipo-al-vuelo-organo', 'JEFATURA');
await pagina.click('#tipo-al-vuelo-crear');
await pagina.waitForSelector('#tipo-al-vuelo-panel.oculto', { state: 'attached' });
await comprobar('el tipo nuevo se guarda con su órgano', organoEnDisco('GUARDIA DE RECREO'), 'JEFATURA');

console.log('--- 3. la parrilla de Nuevo asunto, agrupada ---');
await pagina.fill('#buscar-tipo', '');
await pagina.dispatchEvent('#buscar-tipo', 'input');
await pagina.click('#btn-ver-tipos');
const grupos = () => pagina.evaluate(() => {
  const salida = [];
  let actual = null;
  Array.prototype.forEach.call(document.getElementById('tipos-lista').children, (el) => {
    if (el.classList.contains('tipos-grupo-organo')) { actual = { grupo: el.textContent, tipos: [] }; salida.push(actual); }
    else if (el.classList.contains('tipo-boton') && actual && ['MATRICULA', 'GUARDIA DE RECREO', 'BECA'].indexOf(el.textContent) !== -1) actual.tipos.push(el.textContent);
  });
  return salida.map(g => g.grupo + ': ' + g.tipos.join(', '));
});
await comprobar('los rótulos, en su orden, y cada tipo bajo el suyo', grupos(),
  ['Secretaría: MATRICULA', 'Jefatura de Estudios: GUARDIA DE RECREO', 'Sin asignar: BECA']);
await pagina.fill('#buscar-tipo', 'matri');
await comprobar('al buscar, solo se ve el rótulo del grupo con resultados',
  pagina.evaluate(() => Array.prototype.filter.call(document.querySelectorAll('#tipos-lista .tipos-grupo-organo'),
    r => !r.classList.contains('oculto')).map(r => r.textContent)), ['Secretaría']);
await pagina.fill('#buscar-tipo', '');
await pagina.click('.categoria-boton[data-categoria="EMPRESAS"]');
await comprobar('en una categoría con todos del mismo órgano, sin rótulos',
  pagina.evaluate(() => document.querySelectorAll('#tipos-lista .tipos-grupo-organo').length),
  await pagina.evaluate(() => {
    const o = {};
    App.E.tipos.filter(t => t.categoria === 'EMPRESAS').forEach(t => { o[TiposOrgano.deTipo(t)] = true; });
    return Object.keys(o).length < 2 ? 0 : Object.keys(o).length;
  }));

console.log('--- 4. el filtro «Lo encarga» ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
if (await pagina.locator('#filtros-abiertos').isHidden()) await pagina.click('#btn-filtros');
const enLaLista = () => pagina.evaluate(() => {
  App.pintarAbiertos();
  return Array.prototype.map.call(document.querySelectorAll('#lista-abiertos .tarjeta-asunto'),
    t => (t.textContent.indexOf('MATRICULA') !== -1 ? 'MATRICULA' : (t.textContent.indexOf('COMPRA') !== -1 ? 'COMPRA' : '?'))).sort();
});
const todos = await enLaLista();
await comprobar('sin filtro, los dos asuntos', todos, ['COMPRA', 'MATRICULA']);
await pagina.selectOption('#filtro-organo', 'SECRETARIA');
await comprobar('Secretaría: solo MATRICULA', enLaLista(), ['MATRICULA']);
await pagina.selectOption('#filtro-organo', 'SIN');
await comprobar('Sin asignar: ninguno de los dos (COMPRA es de Dirección)', enLaLista(), []);
await pagina.selectOption('#filtro-organo', 'DIRECCION');
await comprobar('Dirección: solo COMPRA', enLaLista(), ['COMPRA']);
await comprobar('el filtro puesto sale en la barra de etiquetas',
  pagina.evaluate(() => document.body.textContent.indexOf('Lo encarga: Dirección') !== -1), true);
await comprobar('el filtro de verdad, sobre el montón entero',
  pagina.evaluate(() => App.E.listaAbiertos.filter(a => TiposOrgano.pasaFiltro(App.tipoDeAsunto(a), 'SECRETARIA'))
    .map(a => App.tipoDeAsunto(a))), ['MATRICULA']);
await pagina.selectOption('#filtro-organo', '');

console.log('--- 5. Cuentas, por órgano ---');
await comprobar('suma por órgano, abiertos y archivados, en su orden',
  pagina.evaluate(() => Cuentas._porOrgano([
    { tipo: 'MATRICULA', abierta: true, fecha: '260901' },
    { tipo: 'MATRICULA', abierta: false, fecha: '260902' },
    { tipo: 'COMPRA', abierta: true, fecha: '260903' },
    { tipo: 'BECA', abierta: false, fecha: '260904' },
    { tipo: '', abierta: true, fecha: '260905' }
  ], '', TiposOrgano.deNombre)), [
    { organo: 'Secretaría', cuantos: 2, abiertos: 1, archivados: 1 },
    { organo: 'Dirección', cuantos: 1, abiertos: 1, archivados: 0 },
    { organo: 'Sin asignar', cuantos: 2, abiertos: 1, archivados: 1 }
  ]);
await pagina.evaluate(async () => { await App.reconstruirIndiceArchivo(); });
await pagina.evaluate(() => Cuentas.abrir());
await pagina.waitForSelector('#cuentas-cuerpo');
await pagina.waitForTimeout(400);
const cuerpo = await pagina.locator('#cuentas-cuerpo').textContent();
await comprobar('la pantalla de Cuentas trae la columna «Lo encarga» y la tabla por órgano',
  [cuerpo.indexOf('Lo encarga') !== -1, cuerpo.indexOf('Por quién lo encarga') !== -1], [true, true]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
