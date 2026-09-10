/* Prueba en navegador de verdad de la guía dentro de un asunto:
   escribirla desde la ficha, sin pasar por Ajustes, y que un paso
   marcado se pliegue.

   Lo que tiene que pasar:
     - en un asunto abierto cuyo tipo no tiene guía sale el botón de
       escribirla, y ya no se manda al usuario a Ajustes,
     - al escribirla se guarda en _GESTOR/guias.json,
     - la ficha se repinta sola con los pasos recién escritos,
     - y entonces el botón pasa a ser "Cambiar la guía",
     - al marcar un paso, su explicación se esconde y el botón "ver"
       la vuelve a abrir.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Pérez, Ana 1234', { create: true });
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(800);

/* Abre la ficha del asunto y espera a que la guía deje de leerse. */
const abrirLaFicha = async () => {
  await pagina.evaluate(() => {
    const a = App.E.listaAbiertos.filter(x => x.nombre.indexOf('MATRICULA') !== -1)[0];
    App.abrirFicha(a, 'abierto');
  });
  await pagina.waitForFunction(() => {
    const c = document.getElementById('ficha-guia');
    return c && c.textContent.indexOf('Leyendo') === -1;
  });
  await pagina.waitForTimeout(200);
};

console.log('--- un tipo sin guía todavía ---');
await abrirLaFicha();
const textoGuia = () => pagina.locator('#ficha-guia').textContent();

await comprobar('dice que todavía no tiene guía',
  textoGuia().then(t => t.indexOf('todavía no tiene guía') !== -1), true);
await comprobar('y ya NO manda a Ajustes',
  textoGuia().then(t => t.indexOf('Ajustes') !== -1), false);
await comprobar('sale el botón de escribirla',
  pagina.locator('#ficha-guia button').first().textContent(),
  'Escribir la guía de MATRICULA');
await comprobar('y avisa de que vale para todos',
  textoGuia().then(t => t.indexOf('todos los asuntos MATRICULA') !== -1), true);

console.log('--- escribiéndola desde aquí ---');
await pagina.locator('#ficha-guia button').first().click();
await pagina.waitForSelector('#guia-anadir');
await comprobar('el cuadro es el de escribir la guía de ese tipo',
  pagina.locator('#cuadro-titulo').textContent(), 'Guía de MATRICULA');

await pagina.click('#guia-anadir');
await pagina.waitForSelector('#guia-pasos .paso-titulo');
await pagina.fill('#guia-pasos .paso-titulo', 'Pedir el sobre de matrícula');
await pagina.click('#guia-anadir');
await pagina.waitForTimeout(200);
await pagina.locator('#guia-pasos .paso-titulo').nth(1).fill('Comprobar el pago de la Seguridad Escolar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);

await comprobar('se ha guardado en guias.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('guias.json');
    const t = await (await f.getFile()).text();
    const j = JSON.parse(t);
    return (j.MATRICULA || []).map(p => p.titulo);
  }),
  ['Pedir el sobre de matrícula', 'Comprobar el pago de la Seguridad Escolar']);

console.log('--- la ficha se repinta sola ---');
await pagina.waitForTimeout(400);
await comprobar('sale el primer paso',
  textoGuia().then(t => t.indexOf('Pedir el sobre de matrícula') !== -1), true);
await comprobar('y la cuenta de pasos hechos',
  textoGuia().then(t => t.indexOf('0 de 2 pasos hechos') !== -1), true);
await comprobar('el botón ahora es el de cambiarla',
  pagina.locator('#ficha-guia button').last().textContent(), 'Cambiar la guía');

console.log('--- marcar un paso sigue funcionando ---');
await pagina.locator('#ficha-guia .paso-casilla').first().check();
await pagina.waitForTimeout(500);
await comprobar('se apunta en la ficha del asunto',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const clave = Object.keys(j.asuntos).filter(k => k.indexOf('MATRICULA') !== -1)[0];
    return (j.asuntos[clave].pasosHechos || []).length;
  }), 1);

console.log('--- un paso hecho se pliega ---');
/* Al segundo paso se le pone explicación; se marca y su cuerpo tiene
   que esconderse, y volver con el botón "ver". */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const f = await g.getFileHandle('guias.json');
  const j = JSON.parse(await (await f.getFile()).text());
  j.MATRICULA[1].cuerpo = '<p>Mirar el recibo del banco</p>';
  const w = await f.createWritable();
  await w.write(JSON.stringify(j));
  await w.close();
});
await abrirLaFicha();
const segundo = pagina.locator('#ficha-guia .paso-lectura').nth(1);
await comprobar('antes de marcarlo, la explicación se ve',
  segundo.locator('.paso-cuerpo-texto').isVisible(), true);
await segundo.locator('.paso-casilla').check();
await pagina.waitForTimeout(400);
await comprobar('al marcarlo se pliega',
  segundo.locator('.paso-cuerpo-texto').isVisible(), false);
await comprobar('y el título sigue a la vista',
  segundo.locator('.paso-titulo-texto').isVisible(), true);
await comprobar('con el botón "ver" se vuelve a abrir',
  segundo.locator('.paso-ver').click().then(() => segundo.locator('.paso-cuerpo-texto').isVisible()),
  true);
await comprobar('y el botón pasa a decir esconder',
  segundo.locator('.paso-ver').textContent(), 'esconder');
await segundo.locator('.paso-casilla').uncheck();
await pagina.waitForTimeout(400);
await comprobar('al desmarcarlo vuelve a verse entero',
  segundo.locator('.paso-cuerpo-texto').isVisible(), true);
await comprobar('y el botón se esconde',
  segundo.locator('.paso-ver').isVisible(), false);

console.log('--- en Ajustes se ve lo mismo ---');
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(600);
await comprobar('la tabla de guías dice 2 pasos',
  pagina.locator('#tabla-guias').textContent().then(t => t.indexOf('2 pasos') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
