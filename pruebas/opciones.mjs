/* Prueba en navegador de verdad de las preguntas con opciones dentro de
   una guía, después del cambio de diseño "los hitos son la guía"
   (17-sep-2026, fila 26, docs/HITOS-SON-LA-GUIA.md): ya no se ven como
   texto (`.guia-opcion`/`.guia-rama`), nacen como un hito de decisión.

   El caso es el suyo, el de la factura:
     Registrar entrada
     ¿Cómo hemos recibido la factura?
        · En mano       -> sello y firma · entregarla a Fátima
        · Digitalmente  -> a la firma digital del director

   Lo que tiene que pasar:
     - se puede escribir la pregunta desde la ficha, con el mismo
       cuadro de siempre (eso no cambia),
     - hasta elegir, no se ve ningún hito de ninguna rama, y los dos
       botones de la decisión están siempre a la vista (no hace falta
       desplegar nada),
     - al elegir una opción, salen solo sus hitos y la cuenta crece,
     - se puede cambiar de rama (con el mismo "Cambiar de rama" que
       usan los hitos normales), y se recuerda al volver a entrar. */
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
  await window.__disco.abiertos.getDirectoryHandle('260901 COMPRA Papeles del Sur SL B29111222', { create: true });
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(800);

const abrirLaFicha = async () => {
  await pagina.evaluate(() => {
    const a = App.E.listaAbiertos.filter(x => x.nombre.indexOf('COMPRA') !== -1)[0];
    App.abrirFicha(a, 'abierto');
  });
  await pagina.waitForFunction(() => {
    const c = document.getElementById('ficha-guia');
    return c && c.textContent.indexOf('Leyendo') === -1;
  });
  await pagina.waitForTimeout(250);
};

console.log('--- escribiendo la pregunta desde la ficha ---');
await abrirLaFicha();
await pagina.locator('#ficha-guia .nota button').click();
await pagina.waitForSelector('#guia-anadir');

/* Paso 1, normal. */
await pagina.click('#guia-anadir');
await pagina.waitForSelector('#guia-pasos .paso-titulo');
await pagina.fill('#guia-pasos .paso-titulo', 'Registrar entrada');

/* Paso 2, pregunta con dos opciones. */
await pagina.click('#guia-anadir');
await pagina.waitForTimeout(200);
await pagina.locator('#guia-pasos .paso-titulo').nth(1).fill('¿Cómo hemos recibido la factura?');
await pagina.locator('#guia-pasos .paso-es-pregunta').nth(1).check();
await pagina.waitForTimeout(300);

await comprobar('al marcarla como pregunta salen dos opciones vacías',
  pagina.locator('#guia-pasos .opcion-editor').count(), 2);

await pagina.locator('.opcion-titulo').nth(0).fill('La hemos recibido en mano');
await pagina.locator('.opcion-titulo').nth(1).fill('Nos ha llegado digitalmente');

/* Dos pasos en la primera opción y uno en la segunda. */
await pagina.locator('.opcion-editor').nth(0).getByText('+ Añadir un paso a esta opción').click();
await pagina.waitForTimeout(250);
await pagina.locator('.subpaso-titulo').nth(0).fill('Ponerle el sello de recibido y la firma');
await pagina.locator('.opcion-editor').nth(0).getByText('+ Añadir un paso a esta opción').click();
await pagina.waitForTimeout(250);
await pagina.locator('.subpaso-titulo').nth(1).fill('Entregársela a Fátima');
await pagina.locator('.opcion-editor').nth(1).getByText('+ Añadir un paso a esta opción').click();
await pagina.waitForTimeout(250);
await pagina.locator('.subpaso-titulo').nth(2).fill('A la firma digital del director');

await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(900);

await comprobar('se ha guardado la pregunta con sus dos ramas',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('guias.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const p = j.COMPRA[1];
    return {
      titulo: p.titulo,
      opciones: p.opciones.map(o => ({ titulo: o.titulo, pasos: o.pasos.map(x => x.titulo) }))
    };
  }),
  { titulo: '¿Cómo hemos recibido la factura?',
    opciones: [
      { titulo: 'La hemos recibido en mano',
        pasos: ['Ponerle el sello de recibido y la firma', 'Entregársela a Fátima'] },
      { titulo: 'Nos ha llegado digitalmente',
        pasos: ['A la firma digital del director'] }
    ] });

console.log('--- la ficha se repinta: nace como hito de decisión ---');
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .hito').length > 0);
await pagina.waitForTimeout(300);
const texto = () => pagina.locator('#ficha-guia').textContent();

console.log('--- sin responder, no se ve ninguna rama ---');
await comprobar('salen el paso normal y la decisión, sin ramas todavía',
  pagina.locator('#ficha-guia .hito').count(), 2);
await comprobar('la decisión es un hito de clase decision',
  pagina.locator('#ficha-guia .hito-decision').count(), 1);
await comprobar('los dos botones de opción están siempre a la vista',
  pagina.locator('#ficha-guia .hito-opcion').count(), 2);
await comprobar('y la cuenta se corta en la decisión: 2 hitos',
  texto().then(t => t.indexOf('0 de 2 hitos hechos') !== -1), true);

console.log('--- eligiendo "en mano" ---');
await pagina.getByRole('button', { name: 'La hemos recibido en mano', exact: true }).click();
await pagina.waitForTimeout(600);
await comprobar('salen sus dos hitos',
  texto().then(t => t.indexOf('Ponerle el sello de recibido y la firma') !== -1 &&
                     t.indexOf('Entregársela a Fátima') !== -1), true);
await comprobar('la otra rama no aparece',
  texto().then(t => t.indexOf('firma digital del director') !== -1), false);
await comprobar('la cuenta pasa a 4 hitos',
  texto().then(t => t.indexOf('0 de 4 hitos hechos') !== -1), true);
await comprobar('se ha guardado la elección en hitos.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('hitos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const clave = Object.keys(j.porAsunto).filter(k => k.indexOf('COMPRA') !== -1)[0];
    const decision = j.porAsunto[clave].hitos.find(h => h.clase === 'decision');
    return !!decision.elegida;
  }), true);

console.log('--- marcando un hito de la rama ---');
await pagina.locator('#ficha-guia .hito', { hasText: 'Ponerle el sello de recibido y la firma' })
  .locator('.hito-casilla').check();
await pagina.waitForTimeout(600);
await comprobar('la cuenta sube',
  texto().then(t => t.indexOf('1 de 4 hitos hechos') !== -1), true);

console.log('--- cambiando de rama ---');
await pagina.locator('#ficha-guia .hito-decision .hito-titulo').click();
await pagina.locator('#ficha-guia .hito-decision .hito-cambiar-rama').click();
await pagina.locator('#ficha-guia .hito-decision .hito-cuerpo .hito-opcion',
  { hasText: 'Nos ha llegado digitalmente' }).click();
await pagina.waitForTimeout(600);
await comprobar('ahora se ve la rama digital',
  texto().then(t => t.indexOf('A la firma digital del director') !== -1), true);
await comprobar('y la de en mano ya no se ve',
  texto().then(t => t.indexOf('Entregársela a Fátima') !== -1), false);

console.log('--- al volver a entrar, se recuerda ---');
await abrirLaFicha();
await comprobar('sigue elegida la rama digital',
  texto().then(t => t.indexOf('A la firma digital del director') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
