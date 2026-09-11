/* Prueba en navegador de verdad de las copias en conflicto de Dropbox
   (bloque 2 del plan de robustez).

   - asuntos.json: se fusiona solo, uniendo asuntos y notas.
   - tablon.json: se fusiona solo, uniendo notas por id.
   - tipos.json (uno de los que NO se fusionan solos): sale en el
     bloque de Ajustes, y se puede elegir con cuál quedarse.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

console.log('--- asuntos.json se fusiona solo ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const real = {
    asuntos: {
      'uno': { tipo: 'MATRICULA', notas: [{ texto: 'nota de este ordenador', cuando: '2026-09-11T08:00:00.000Z' }] }
    }
  };
  const conflicto = {
    asuntos: {
      'uno': { tipo: 'MATRICULA', notas: [{ texto: 'nota del otro ordenador', cuando: '2026-09-11T09:00:00.000Z' }] },
      'dos': { tipo: 'COMPRA', notas: [] }
    }
  };
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify(real)));
  g._hijos.set("asuntos (copia en conflicto de PC2 2026-09-11).json",
    window.__disco.fich("asuntos (copia en conflicto de PC2 2026-09-11).json", JSON.stringify(conflicto)));
  await window.Conflictos.revisar();
});

const registroTrasFusion = await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  return JSON.parse(await (await h.getFile()).text());
});
await comprobar('el asunto que solo estaba en el conflicto se suma',
  Object.keys(registroTrasFusion.asuntos).sort(), ['dos', 'uno']);
await comprobar('las notas de los dos ordenadores se unen',
  registroTrasFusion.asuntos.uno.notas.map(n => n.texto).sort(),
  ['nota de este ordenador', 'nota del otro ordenador']);

await comprobar('el fichero de conflicto ya no está en _GESTOR', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const n = [];
  for await (const p of g.entries()) n.push(p[0]);
  return n.some(x => x.indexOf('conflicto') !== -1);
}), false);
await comprobar('y ha quedado a salvo en _GESTOR/copias', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const c = await g.getDirectoryHandle('copias');
  const n = [];
  for await (const p of c.entries()) n.push(p[0]);
  return n.some(x => x.indexOf('conflicto') !== -1);
}), true);

console.log('--- tablon.json se fusiona solo, por id ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const real = { notas: [{ id: 'n1', texto: 'Llamar al banco', color: 'amarillo' }] };
  const conflicto = { notas: [
    { id: 'n1', texto: 'Llamar al banco', color: 'amarillo' },
    { id: 'n2', texto: 'Avisar a dirección', color: 'azul' }
  ] };
  g._hijos.set('tablon.json', window.__disco.fich('tablon.json', JSON.stringify(real)));
  g._hijos.set("tablon (copia en conflicto de PC2 2026-09-11).json",
    window.__disco.fich("tablon (copia en conflicto de PC2 2026-09-11).json", JSON.stringify(conflicto)));
  await window.Conflictos.revisar();
});
await comprobar('las notas del tablón se unen sin repetir la que está en las dos',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('tablon.json');
    const t = JSON.parse(await (await h.getFile()).text());
    return t.notas.map(n => n.id).sort();
  }), ['n1', 'n2']);

console.log('--- tipos.json NO se fusiona solo: se avisa en Ajustes ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const conflicto = [{ tipo: 'DEL OTRO ORDENADOR', categoria: 'OTROS' }];
  g._hijos.set("tipos (copia en conflicto de PC2 2026-09-11).json",
    window.__disco.fich("tipos (copia en conflicto de PC2 2026-09-11).json", JSON.stringify(conflicto)));
  await window.Conflictos.revisar();
});
await comprobar('sale como pendiente, no se fusiona solo',
  pagina.evaluate(() => window.Conflictos.pendientes().map(p => p.real)), ['tipos.json']);

await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(200);
await comprobar('aparece en la tabla de Ajustes',
  pagina.locator('#tabla-conflictos .fila-tipo').count(), 1);
await pagina.evaluate(() => { document.getElementById('bloque-conflictos').open = true; });

await pagina.getByRole('button', { name: 'Quedarse con el otro' }).click();
await pagina.waitForTimeout(300);
await comprobar('al elegir "el otro", tipos.json pasa a ser el del conflicto',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('tipos.json');
    return JSON.parse(await (await h.getFile()).text());
  }), [{ tipo: 'DEL OTRO ORDENADOR', categoria: 'OTROS' }]);
await comprobar('y ya no queda pendiente', pagina.evaluate(() => window.Conflictos.pendientes().length), 0);

console.log('--- si a este ordenador le faltaba algo, guardarTipos lo recupera ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('tipos.json');
  const w = await h.createWritable();
  await w.write(JSON.stringify([
    { tipo: 'DEL OTRO ORDENADOR', categoria: 'OTROS' },
    { tipo: 'AÑADIDO EN EL OTRO', categoria: 'OTROS' }
  ]));
  await w.close();
  App.E.tipos = [{ tipo: 'DEL OTRO ORDENADOR', categoria: 'OTROS' }];
  await App.guardarTipos();
});
await comprobar('al guardar se suma lo que el otro ordenador había añadido',
  pagina.evaluate(() => App.E.tipos.map(t => t.tipo).sort()),
  ['AÑADIDO EN EL OTRO', 'DEL OTRO ORDENADOR']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
