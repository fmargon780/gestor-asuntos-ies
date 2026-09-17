/* Prueba en navegador de verdad de la guía dentro de un asunto, después
   del cambio de diseño "los hitos son la guía" (17-sep-2026, fila 26,
   docs/HITOS-SON-LA-GUIA.md): escribirla desde la ficha, sin pasar por
   Ajustes, y que sus pasos nazcan solos como hitos.

   Lo que tiene que pasar:
     - en un asunto abierto cuyo tipo no tiene guía sale el bloque
       "Hitos" vacío, con "+ Añadir el primer hito" y el enlace de
       escribir la guía (que ya no manda a Ajustes),
     - al escribirla se guarda en _GESTOR/guias.json,
     - la ficha se repinta sola: sus pasos nacen como hitos, sin pedir
       nada ni mostrar ningún botón de crearlos,
     - y entonces el enlace pasa a ser "Cambiar la guía",
     - marcar un hito sigue funcionando igual que siempre.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
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

/* Abre la ficha del asunto y espera a que el bloque "Hitos" deje de
   leerse. */
const abrirLaFicha = async () => {
  await pagina.evaluate(() => {
    const a = App.E.listaAbiertos.filter(x => x.nombre.indexOf('MATRICULA') !== -1)[0];
    App.abrirFicha(a, 'abierto');
  });
  await pagina.waitForFunction(() => {
    const c = document.getElementById('ficha-guia');
    return c && c.textContent.indexOf('Leyendo') === -1;
  });
  await pagina.waitForTimeout(300);
};

console.log('--- un tipo sin guía todavía ---');
await abrirLaFicha();
const textoGuia = () => pagina.locator('#ficha-guia').textContent();

await comprobar('dice que el tipo no tiene guía y se puede apuntar a mano',
  textoGuia().then(t => t.indexOf('Este tipo no tiene guía') !== -1), true);
await comprobar('sale "+ Añadir el primer hito"',
  pagina.getByRole('button', { name: '+ Añadir el primer hito' }).isVisible(), true);
await comprobar('y ya NO manda a Ajustes',
  textoGuia().then(t => t.indexOf('Ajustes') !== -1), false);
await comprobar('sale el enlace de escribirla',
  pagina.locator('#ficha-guia .nota button').textContent(),
  'Escribir la guía de MATRICULA');
await comprobar('y avisa de que vale para todos',
  textoGuia().then(t => t.indexOf('todos los asuntos MATRICULA') !== -1), true);
await comprobar('no sale ningún botón de "Crear los hitos de la guía": ya no existe',
  pagina.getByRole('button', { name: 'Crear los hitos de la guía' }).count(), 0);
await comprobar('y tampoco el bloque #hitos-entrada de antes',
  pagina.locator('#hitos-entrada').count(), 0);

console.log('--- escribiéndola desde aquí ---');
await pagina.locator('#ficha-guia .nota button').click();
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
await pagina.waitForTimeout(900);

await comprobar('se ha guardado en guias.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('guias.json');
    const t = await (await f.getFile()).text();
    const j = JSON.parse(t);
    return (j.MATRICULA || []).map(p => p.titulo);
  }),
  ['Pedir el sobre de matrícula', 'Comprobar el pago de la Seguridad Escolar']);

console.log('--- la ficha se repinta sola: los pasos nacen como hitos ---');
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .hito').length > 0);
await pagina.waitForTimeout(300);
await comprobar('salen los dos hitos',
  pagina.locator('#ficha-guia .hito').count(), 2);
await comprobar('sale el primero',
  textoGuia().then(t => t.indexOf('Pedir el sobre de matrícula') !== -1), true);
await comprobar('y la cuenta de hitos hechos',
  textoGuia().then(t => t.indexOf('0 de 2 hitos hechos') !== -1), true);
await comprobar('el primero nace en curso',
  pagina.locator('#ficha-guia .hito').first().getAttribute('class').then(c => c.indexOf('hito-encurso') !== -1), true);
await comprobar('el enlace ahora es el de cambiarla',
  pagina.locator('#ficha-guia .nota button').textContent(), 'Cambiar la guía');
await comprobar('no ha hecho falta ningún botón para crearlos',
  pagina.locator('#hitos-entrada').count(), 0);

console.log('--- marcar un hito sigue funcionando ---');
await pagina.locator('#ficha-guia .hito-casilla').first().check();
await pagina.waitForTimeout(500);
await comprobar('se apunta en hitos.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('hitos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const clave = Object.keys(j.porAsunto).filter(k => k.indexOf('MATRICULA') !== -1)[0];
    return j.porAsunto[clave].hitos.filter(h => h.estado === 'hecho').length;
  }), 1);
await comprobar('y el siguiente pasa a estar en curso',
  pagina.locator('#ficha-guia .hito').nth(1).getAttribute('class').then(c => c.indexOf('hito-encurso') !== -1), true);

console.log('--- en Ajustes se ve lo mismo ---');
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(600);
await comprobar('la tabla de guías dice 2 pasos',
  pagina.locator('#tabla-guias').textContent().then(t => t.indexOf('2 pasos') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
