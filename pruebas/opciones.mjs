/* Prueba en navegador de verdad de las preguntas con opciones dentro de
   una guía, ahora que sus pasos son hitos (docs/HITOS-SON-LA-GUIA.md,
   fila 26, 17-sep-2026): elegir una respuesta y cambiar de rama se
   hacen sobre el hito de la pregunta, dentro de la lista de hitos, no
   sobre un bloque de guía aparte con casillas.

   El caso es el suyo, el de la factura:
     Registrar entrada
     ¿Cómo hemos recibido la factura?
        · En mano       -> sello y firma · entregarla a Fátima
        · Digitalmente  -> a la firma digital del director

   Lo que tiene que pasar:
     - se escribe la pregunta con sus ramas desde el cuadro de la
       guía, sin tocar ningún fichero a mano (eso no cambia),
     - los pasos de la guía se convierten solos en hitos, y hasta
       elegir no se ve ningún hito de ninguna rama,
     - al elegir, salen solo los suyos, la cuenta de hitos crece con
       la rama elegida, y lo elegido se guarda en hitos.json (ya NO en
       la ficha del asunto, como antes),
     - marcar un hito de la rama se guarda igual que cualquier otro,
     - al volver a entrar se recuerda todo, sin duplicar nada,
     - y se puede cambiar de rama con "Cambiar de rama": lo marcado en
       la rama vieja que no tenga notas ni documentos se descarta del
       todo (docs/HITOS.md, sección de las bifurcaciones). */
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
  await pagina.waitForTimeout(300);
};
const texto = () => pagina.locator('#ficha-guia').textContent();

const leerHitosCompra = () => pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const f = await g.getFileHandle('hitos.json');
  const j = JSON.parse(await (await f.getFile()).text());
  const clave = Object.keys(j.porAsunto).filter(k => k.indexOf('COMPRA') !== -1)[0];
  return j.porAsunto[clave];
});

console.log('--- escribiendo la pregunta desde la ficha ---');
await abrirLaFicha();
await pagina.locator('#ficha-guia-nota button').click();
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

await comprobar('se ha guardado la pregunta con sus dos ramas en guias.json',
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

console.log('--- se han creado los hitos solos; sin responder no se ve ninguna rama ---');
await pagina.waitForTimeout(600);
await comprobar('solo se ven los dos hitos de arriba',
  pagina.locator('#ficha-guia .hito').count(), 2);
await comprobar('el segundo es la pregunta, con sus dos opciones',
  pagina.locator('#ficha-guia .hito-decision .hito-opcion').count(), 2);
await comprobar('y la cuenta es de 2 hitos, ninguno hecho',
  texto().then(t => t.indexOf('0 de 2 hitos hechos') !== -1), true);

console.log('--- eligiendo "en mano" ---');
await pagina.locator('#ficha-guia .hito-opcion', { hasText: 'La hemos recibido en mano' }).click();
await pagina.waitForTimeout(600);
await comprobar('salen los cuatro hitos',
  pagina.locator('#ficha-guia .hito').count(), 4);
await comprobar('con los títulos de su rama',
  texto().then(t => t.indexOf('Entregársela a Fátima') !== -1), true);
await comprobar('y no los de la otra',
  texto().then(t => t.indexOf('firma digital') !== -1), false);
await comprobar('la cuenta pasa a 4 hitos, uno hecho: la propia pregunta',
  texto().then(t => t.indexOf('1 de 4 hitos hechos') !== -1), true);
await comprobar('se ha guardado la respuesta en hitos.json',
  leerHitosCompra().then(entrada => {
    const decision = entrada.hitos[1];
    const elegida = decision.opciones.filter(o => o.id === decision.elegida)[0];
    return elegida && elegida.texto;
  }), 'La hemos recibido en mano');
await comprobar('y ya NO en asuntos.json (pasosElegidos ya no se usa para esto)',
  pagina.evaluate(async () => {
    try {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const f = await g.getFileHandle('asuntos.json');
      const j = JSON.parse(await (await f.getFile()).text());
      const clave = Object.keys(j.asuntos || {}).filter(k => k.indexOf('COMPRA') !== -1)[0];
      return Object.keys((clave && j.asuntos[clave].pasosElegidos) || {}).length;
    } catch (e) {
      return 0;   /* ni siquiera hace falta que exista la ficha del asunto */
    }
  }), 0);

console.log('--- marcando un hito de la rama ---');
await pagina.locator('#ficha-guia .hito', { hasText: 'Ponerle el sello de recibido y la firma' })
  .locator('.hito-casilla').check();
await pagina.waitForTimeout(500);
await comprobar('se apunta en hitos.json',
  leerHitosCompra().then(entrada => {
    const decision = entrada.hitos[1];
    const rama = decision.opciones.filter(o => o.id === decision.elegida)[0];
    const h = rama.hitos.filter(x => x.titulo === 'Ponerle el sello de recibido y la firma')[0];
    return h.estado;
  }), 'hecho');
await comprobar('y la cuenta sube a 2 de 4',
  texto().then(t => t.indexOf('2 de 4 hitos hechos') !== -1), true);

console.log('--- al volver a entrar, se recuerda todo (y no se duplica) ---');
await abrirLaFicha();
await comprobar('sigue habiendo 4 hitos, no 8',
  pagina.locator('#ficha-guia .hito').count(), 4);
await comprobar('sigue elegida "en mano"',
  texto().then(t => t.indexOf('Entregársela a Fátima') !== -1), true);
await comprobar('y lo marcado sigue marcado',
  texto().then(t => t.indexOf('2 de 4 hitos hechos') !== -1), true);

console.log('--- cambiando de rama ---');
/* Hay que desplegar el cuerpo de la pregunta para ver "Cambiar de rama". */
await pagina.locator('#ficha-guia .hito-decision .hito-titulo').click();
await pagina.locator('#ficha-guia .hito-decision .hito-cambiar-rama').click();
await pagina.waitForTimeout(200);
await pagina.locator('#ficha-guia .hito-decision .hito-cuerpo .hito-opcion',
  { hasText: 'Nos ha llegado digitalmente' }).click();
await pagina.waitForTimeout(600);

await comprobar('ahora salen los hitos de la rama digital',
  texto().then(t => t.indexOf('A la firma digital del director') !== -1), true);
await comprobar('y ya no los de la rama de en mano',
  texto().then(t => t.indexOf('Entregársela a Fátima') !== -1), false);
await comprobar('el hito marcado de la rama vieja, sin notas ni documentos, se descarta del todo',
  texto().then(t => t.indexOf('Ponerle el sello') !== -1), false);
await comprobar('la cuenta ahora es de 3, uno hecho: la pregunta',
  texto().then(t => t.indexOf('1 de 3 hitos hechos') !== -1), true);
await comprobar('se ha guardado el cambio en hitos.json',
  leerHitosCompra().then(entrada => {
    const decision = entrada.hitos[1];
    const elegida = decision.opciones.filter(o => o.id === decision.elegida)[0];
    return elegida && elegida.texto;
  }), 'Nos ha llegado digitalmente');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
