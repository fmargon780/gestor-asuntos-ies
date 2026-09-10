/* Prueba en navegador de verdad de las preguntas con opciones dentro de
   una guía.

   El caso es el suyo, el de la factura:
     Comprobación de validez
     Registrar entrada
     ¿Cómo hemos recibido la factura?
        · En mano       -> sello y firma · entregarla a Fátima
        · Digitalmente  -> a la firma digital del director

   Lo que tiene que pasar:
     - hasta elegir, no se ve ningún paso de ninguna rama,
     - al elegir una, salen solo los suyos,
     - la cuenta de pasos crece con la rama elegida,
     - lo elegido se guarda en la ficha del asunto,
     - se puede cambiar de respuesta, y se puede escribir todo esto
       desde el cuadro de la guía sin tocar el fichero a mano. */
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
await pagina.locator('#ficha-guia button').first().click();
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

console.log('--- sin responder, no se ve ninguna rama ---');
await pagina.waitForTimeout(400);
const texto = () => pagina.locator('#ficha-guia').textContent();
await comprobar('los dos botones están',
  pagina.locator('#ficha-guia .guia-opcion').count(), 2);
await comprobar('la rama de en mano está escondida',
  pagina.locator('#ficha-guia .guia-rama').nth(0).isVisible(), false);
await comprobar('la digital también',
  pagina.locator('#ficha-guia .guia-rama').nth(1).isVisible(), false);
await comprobar('y la cuenta es de 2 pasos',
  texto().then(t => t.indexOf('0 de 2 pasos hechos') !== -1), true);

console.log('--- eligiendo "en mano" ---');
await pagina.locator('#ficha-guia .guia-opcion').nth(0).click();
await pagina.waitForTimeout(600);
await comprobar('sale su rama',
  pagina.locator('#ficha-guia .guia-rama').nth(0).isVisible(), true);
await comprobar('y la otra sigue escondida',
  pagina.locator('#ficha-guia .guia-rama').nth(1).isVisible(), false);
await comprobar('salen sus dos pasos',
  texto().then(t => t.indexOf('Entregársela a Fátima') !== -1), true);
await comprobar('la cuenta pasa a 4 pasos, uno hecho',
  texto().then(t => t.indexOf('1 de 4 pasos hechos') !== -1), true);
await comprobar('se ha guardado la respuesta en el asunto',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const clave = Object.keys(j.asuntos).filter(k => k.indexOf('COMPRA') !== -1)[0];
    return Object.keys(j.asuntos[clave].pasosElegidos || {}).length;
  }), 1);

console.log('--- marcando un paso de la rama ---');
await pagina.locator('#ficha-guia .guia-rama').nth(0).locator('.paso-casilla').first().check();
await pagina.waitForTimeout(600);
await comprobar('la cuenta sube',
  texto().then(t => t.indexOf('2 de 4 pasos hechos') !== -1), true);

console.log('--- cambiando de respuesta ---');
await pagina.locator('#ficha-guia .guia-opcion').nth(1).click();
await pagina.waitForTimeout(600);
await comprobar('ahora se ve la rama digital',
  pagina.locator('#ficha-guia .guia-rama').nth(1).isVisible(), true);
await comprobar('y la de en mano se esconde',
  pagina.locator('#ficha-guia .guia-rama').nth(0).isVisible(), false);
await comprobar('la cuenta cuenta solo la rama elegida',
  texto().then(t => t.indexOf('1 de 3 pasos hechos') !== -1), true);

console.log('--- y se puede dejar sin responder ---');
await pagina.locator('#ficha-guia .guia-opcion').nth(1).click();
await pagina.waitForTimeout(600);
await comprobar('las dos ramas se esconden',
  pagina.locator('#ficha-guia .guia-rama').nth(1).isVisible(), false);
await comprobar('y la cuenta vuelve a 2 pasos',
  texto().then(t => t.indexOf('0 de 2 pasos hechos') !== -1), true);

console.log('--- al volver a entrar, se recuerda ---');
await pagina.locator('#ficha-guia .guia-opcion').nth(0).click();
await pagina.waitForTimeout(600);
await abrirLaFicha();
await comprobar('sigue elegida "en mano"',
  pagina.locator('#ficha-guia .guia-opcion').nth(0).getAttribute('class'),
  'guia-opcion elegida');
await comprobar('con su rama a la vista',
  pagina.locator('#ficha-guia .guia-rama').nth(0).isVisible(), true);
await comprobar('y lo que estaba marcado sigue marcado',
  texto().then(t => t.indexOf('2 de 4 pasos hechos') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
