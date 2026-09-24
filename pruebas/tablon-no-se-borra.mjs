/* Prueba en navegador de verdad de que el tablón no se borra mientras
   se escribe (17-sep-2026, fila 33 de la cola,
   docs/TABLON-NO-SE-BORRA.md).

   El fallo: la envoltura de `App.vigilarLaCarpeta` en js/presencia.js
   repintaba la lista de "Asuntos abiertos" cada 10 segundos, hubiera
   cambiado algo o no, sin mirar si alguien estaba escribiendo en el
   tablón. Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/presencia.mjs y pruebas/tablon.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
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
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Alguien 1140233', { create: true });
  /* Fila 129: el paso único de los asuntos de antes ya está hecho (si no,
     al ponerlos al día repintaría la lista una vez, a los 3 s de entrar). */
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const f = await g.getFileHandle('estado-migrado.json', { create: true });
  const w = await f.createWritable(); await w.write('{}'); await w.close();
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(400);

console.log('--- 1) escribir en el tablón y dejarle el foco ---');
await pagina.click('#tablon-texto');
await pagina.keyboard.type('Llamar al director mañana', { delay: 10 });
/* el cursor se deja a mitad de frase, no al final */
await pagina.evaluate(() => {
  var campo = document.getElementById('tablon-texto');
  campo.setSelectionRange(7, 7);
});

console.log('--- 2) el repintado de presencia (llamar a App.pintarAbiertos dos veces seguidas) ---');
await pagina.evaluate(async () => {
  window.App.pintarAbiertos();
  window.App.pintarAbiertos();
});
await pagina.waitForTimeout(50);

await comprobar('el texto escrito sigue ahí',
  pagina.inputValue('#tablon-texto'), 'Llamar al director mañana');
await comprobar('el campo sigue teniendo el foco',
  pagina.evaluate(() => document.activeElement === document.getElementById('tablon-texto')), true);
await comprobar('el cursor sigue en el mismo sitio',
  pagina.evaluate(() => {
    var c = document.getElementById('tablon-texto');
    return [c.selectionStart, c.selectionEnd];
  }), [7, 7]);

console.log('--- 3) con la caché de presencia igual que antes, el intervalo no repinta ---');
await pagina.evaluate(() => {
  window.__pintados = 0;
  var comoEra = window.App.pintarAbiertos;
  window.App.pintarAbiertos = function () { window.__pintados++; return comoEra.apply(this, arguments); };
});
/* nos vamos del campo para no chocar con la barrera del foco: aquí lo
   que se comprueba es la huella, no la escritura */
await pagina.evaluate(() => document.getElementById('tablon-texto').blur());
await pagina.waitForTimeout(10500);
await comprobar('el intervalo de 10s no ha repintado nada: nadie ha entrado ni salido de ningún asunto',
  pagina.evaluate(() => window.__pintados), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
