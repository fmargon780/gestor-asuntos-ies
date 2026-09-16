/* Prueba en navegador de verdad de "meter un documento de Por
   clasificar en un asunto ya creado" (docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md,
   16-sep-2026, fila 12 de docs/COLA.md).

   Lo que tiene que pasar:
     1. La tarjeta de un documento suelto trae "Meter en un asunto",
        además de "Crear asunto con él" y "Borrar".
     2. Elegir un asunto abierto mueve el fichero a su carpeta y lo
        quita de la raíz.
     3. Después del traslado se abre el cuadro de ponerle nombre.
     4. Si ya existe un fichero con ese nombre en el destino, no se
        pisa y el original sigue en la raíz.
     5. Si el traslado falla, el documento sigue en la raíz y se avisa.
     6. La puntuación de parecido pone primero el asunto cuyo tercero
        aparece en el nombre del fichero.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
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

function nombresRaiz() {
  return pagina.evaluate(async () => {
    const nombres = [];
    for await (const p of window.__disco.abiertos.entries()) {
      if (p[1].kind === 'file') nombres.push(p[0]);
    }
    return nombres;
  });
}

function nombresDeCarpeta(nombreAsunto) {
  return pagina.evaluate(async (n) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(n);
    const nombres = [];
    for await (const p of carpeta.entries()) nombres.push(p[0]);
    return nombres;
  }, nombreAsunto);
}

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* --- tres asuntos abiertos, con ficha completa, y un suelto ---

   A: el tercero está literalmente dentro del nombre del fichero
      suelto, además de dos palabras del propio nombre del asunto.
   D: solo comparte una palabra con el fichero, y no el tercero: debe
      quedar por detrás de A en "Podrían encajar".
   B: no comparte nada con el fichero de la puntuación, y ya lleva un
      documento dentro, para la prueba del nombre repetido. */
await pagina.evaluate(async () => {
  const abiertos = window.__disco.abiertos;
  const ahora = new Date().toISOString();

  async function crearAsunto(nombreCarpeta, ficha) {
    await abiertos.getDirectoryHandle(nombreCarpeta, { create: true });
    return ficha;
  }

  const registro = { asuntos: {} };
  registro.asuntos['260910 CONTRATO 26-27 Limpiezas Andalucia SL'] = await crearAsunto(
    '260910 CONTRATO 26-27 Limpiezas Andalucia SL',
    { estado: 'abierto', tipo: 'CONTRATO', categoria: 'EMPRESAS', tercero: 'Limpiezas Andalucia SL', abiertoEl: ahora });
  registro.asuntos['260908 CONTRATO 26-27 Limpiezas Sevilla SL'] = await crearAsunto(
    '260908 CONTRATO 26-27 Limpiezas Sevilla SL',
    { estado: 'abierto', tipo: 'CONTRATO', categoria: 'EMPRESAS', tercero: 'Limpiezas Sevilla SL', abiertoEl: ahora });
  registro.asuntos['260901 FACTURA 26-27 Papeleria Ruiz SL'] = await crearAsunto(
    '260901 FACTURA 26-27 Papeleria Ruiz SL',
    { estado: 'abierto', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Papeleria Ruiz SL', abiertoEl: '2026-01-01T00:00:00.000Z' });

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('asuntos.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify(registro));
  await w.close();

  const carpetaB = await abiertos.getDirectoryHandle('260901 FACTURA 26-27 Papeleria Ruiz SL');
  const informe = await carpetaB.getFileHandle('informe.pdf', { create: true });
  const wi = await informe.createWritable();
  await wi.write('el informe que ya estaba');
  await wi.close();

  const suelto = await abiertos.getFileHandle('Contrato Limpiezas Andalucia SL renovacion.pdf', { create: true });
  const ws = await suelto.createWritable();
  await ws.write('contenido del contrato');
  await ws.close();
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#zona-clasificar:not(.oculto)');

const NOMBRE_A = '260910 CONTRATO 26-27 Limpiezas Andalucia SL';
const NOMBRE_D = '260908 CONTRATO 26-27 Limpiezas Sevilla SL';
const NOMBRE_B = '260901 FACTURA 26-27 Papeleria Ruiz SL';
const SUELTO_1 = 'Contrato Limpiezas Andalucia SL renovacion.pdf';

/* --- prueba 1: los tres botones, más el que añade la papelera --- */
const tarjeta1 = pagina.locator('.tarjeta-suelto', { hasText: SUELTO_1 });
await comprobar('trae "Meter en un asunto"',
  tarjeta1.getByRole('button', { name: 'Meter en un asunto' }).count(), 1);
await comprobar('sigue trayendo "Crear asunto con él"',
  tarjeta1.getByRole('button', { name: 'Crear asunto con él' }).count(), 1);
await comprobar('sigue trayendo "Borrar"',
  tarjeta1.getByRole('button', { name: 'Borrar' }).count(), 1);

/* --- pruebas 2, 3 y 6: elegir un asunto abierto, en el orden correcto --- */
await tarjeta1.getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#ea-podrian .ea-fila');

const podrian = await pagina.locator('#ea-podrian .ea-fila').allTextContents();
await comprobar('"Podrían encajar" trae los dos candidatos que pasan el mínimo',
  podrian.length, 2);
await comprobar('el tercero que aparece en el nombre del fichero va primero',
  podrian[0].indexOf('Limpiezas Andalucia') !== -1, true);
await comprobar('el que solo comparte una palabra va detrás',
  podrian[1].indexOf('Limpiezas Sevilla') !== -1, true);

await pagina.locator('#ea-podrian .ea-fila', { hasText: 'Limpiezas Andalucia' }).click();
await pagina.waitForSelector('#cuadro-titulo:has-text("' + NOMBRE_A + '")');
await comprobar('se abre el cuadro de ponerle nombre, con el asunto elegido',
  pagina.locator('#cuadro-titulo').textContent(), NOMBRE_A);

await comprobar('el documento ha entrado en la carpeta del asunto',
  nombresDeCarpeta(NOMBRE_A).then(l => l.includes(SUELTO_1)), true);
await comprobar('el documento ya no está en Por clasificar',
  nombresRaiz().then(l => l.includes(SUELTO_1)), false);

await pagina.click('#cuadro-aceptar');   /* "Cerrar" del cuadro de nombrar */
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* --- prueba 4: ya hay un fichero con ese nombre en el destino --- */
await pagina.evaluate(async () => {
  const suelto = await window.__disco.abiertos.getFileHandle('informe.pdf', { create: true });
  const w = await suelto.createWritable();
  await w.write('otro informe, recién llegado');
  await w.close();
});
await pagina.click('#btn-recargar');
await pagina.waitForSelector('.tarjeta-suelto:has-text("informe.pdf")');

const tarjeta2 = pagina.locator('.tarjeta-suelto', { hasText: 'informe.pdf' });
await tarjeta2.getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('#ea-buscar', 'Papeleria Ruiz');
await pagina.locator('#ea-todos .ea-fila', { hasText: NOMBRE_B }).click();
await pagina.waitForSelector('.mensaje.malo:has-text("Ya hay un documento llamado")');

await comprobar('el documento repetido sigue en Por clasificar',
  nombresRaiz().then(l => l.includes('informe.pdf')), true);
await comprobar('el documento de dentro del asunto no se ha pisado',
  pagina.evaluate(async (n) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(n);
    const h = await carpeta.getFileHandle('informe.pdf');
    return (await (await h.getFile()).text());
  }, NOMBRE_B),
  'el informe que ya estaba');

/* --- prueba 5: el traslado falla a media copia --- */
await pagina.evaluate(async () => {
  const suelto = await window.__disco.abiertos.getFileHandle('prueba fallo.pdf', { create: true });
  const w = await suelto.createWritable();
  await w.write('esto no debería llegar a ningún sitio');
  await w.close();

  /* Se rompe el destino a propósito: como si el disco fallara justo
     al escribir la copia. */
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(
    '260908 CONTRATO 26-27 Limpiezas Sevilla SL');
  carpeta.getFileHandle = async () => { throw new Error('fallo de prueba, a propósito'); };
});
await pagina.click('#btn-recargar');
await pagina.waitForSelector('.tarjeta-suelto:has-text("prueba fallo.pdf")');

const tarjeta3 = pagina.locator('.tarjeta-suelto', { hasText: 'prueba fallo.pdf' });
await tarjeta3.getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('#ea-buscar', 'Limpiezas Sevilla');
await pagina.locator('#ea-todos .ea-fila', { hasText: NOMBRE_D }).click();
await pagina.waitForSelector('.mensaje.malo:has-text("no ha podido entrar")');

await comprobar('si el traslado falla, el documento sigue en Por clasificar',
  nombresRaiz().then(l => l.includes('prueba fallo.pdf')), true);

/* --- nada raro en la consola --- */
await comprobar('sin errores de JavaScript', errores, []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' prueba(s) fallida(s).' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
