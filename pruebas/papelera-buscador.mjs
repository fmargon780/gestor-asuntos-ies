/* Prueba en navegador de verdad del buscador de la papelera
   (fila 172, docs/PAPELERA-BUSCADOR.md).

   Sin el arreglo esta prueba falla desde el primer paso: no existe
   #buscar-papelera ni #cuenta-papelera en el bloque Papelera de
   Ajustes, y escribir en la caja no filtra nada.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, igual que
   pruebas/papelera.mjs. Aquí se manda a la papelera notas del tablón
   (clase 'nota-tablon'): no necesitan carpeta, así que "Devolver a su
   sitio" no depende de que exista ningún asunto. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Tres cosas a la papelera, directamente en papelera.json, como notas
   del tablón (no necesitan carpeta). Solo la primera lleva a la vez
   "garcia" y "matricula", en cualquier orden y sin tildes. */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const ahora = new Date().toISOString();
  const fichas = [
    {
      id: 'n1', clase: 'nota-tablon', nombre: 'García López, Ana — recordar la matrícula', carpeta: null,
      origen: null, datos: { id: 'n1', texto: 'García López, Ana — recordar la matrícula', color: 'amarillo',
        autor: 'Francisco', creado: ahora, para: '', privada: false, hecha: false, hechaPor: '', hechaEl: '' },
      quien: 'Francisco', cuando: ahora
    },
    {
      id: 'n2', clase: 'nota-tablon', nombre: 'Sánchez Ruiz, Pedro — llamar mañana', carpeta: null,
      origen: null, datos: { id: 'n2', texto: 'Sánchez Ruiz, Pedro — llamar mañana', color: 'amarillo',
        autor: 'Ana', creado: ahora, para: '', privada: false, hecha: false, hechaPor: '', hechaEl: '' },
      quien: 'Ana', cuando: ahora
    },
    {
      id: 'n3', clase: 'nota-tablon', nombre: 'Revisar factura de suministros', carpeta: null,
      origen: null, datos: { id: 'n3', texto: 'Revisar factura de suministros', color: 'amarillo',
        autor: 'Pedro', creado: ahora, para: '', privada: false, hecha: false, hechaPor: '', hechaEl: '' },
      quien: 'Pedro', cuando: ahora
    }
  ];
  const h = await g.getFileHandle('papelera.json', { create: true });
  await (await h.createWritable()).write(JSON.stringify({ fichas }));
});

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#tabla-papelera .fila-papelera');
await comprobar('las tres cosas salen en la papelera', pagina.locator('#tabla-papelera .fila-papelera').count(), 3);
await comprobar('el contador dice el total, sin filtro', pagina.locator('#cuenta-papelera').textContent(), '3');

/* ================================================================
   1. Dos palabras sueltas, en desorden y sin tildes, dejan solo la
      que toca.
   ================================================================ */
console.log('--- 1. dos palabras sueltas, en desorden y sin tildes ---');

await pagina.fill('#buscar-papelera', 'garcia matricula');
await pagina.waitForTimeout(200);
await comprobar('solo queda una fila', pagina.locator('#tabla-papelera .fila-papelera').count(), 1);
await comprobar('es la de García López',
  pagina.locator('#tabla-papelera .fila-papelera').textContent().then(t => t.indexOf('García López') !== -1), true);
await comprobar('el contador dice «1 de 3»', pagina.locator('#cuenta-papelera').textContent(), '1 de 3');

/* ================================================================
   2. Devolver esa nota a su sitio: la caja conserva lo escrito.
   ================================================================ */
console.log('--- 2. devolver, y la caja conserva lo escrito ---');

await pagina.getByRole('button', { name: 'Devolver a su sitio' }).click();
await pagina.waitForTimeout(400);

await comprobar('la caja de búsqueda conserva lo escrito',
  pagina.locator('#buscar-papelera').inputValue(), 'garcia matricula');
await comprobar('ya no queda ninguna fila con esas palabras (se ha devuelto)',
  pagina.locator('#tabla-papelera .fila-papelera').count(), 0);
await comprobar('el aviso de "nada" sale',
  pagina.locator('#tabla-papelera .vacio').textContent(), 'Nada en la papelera con esas palabras.');
await comprobar('el contador dice «0 de 2»', pagina.locator('#cuenta-papelera').textContent(), '0 de 2');

await comprobar('la nota ha vuelto al tablón', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('tablon.json');
  const j = JSON.parse(await (await h.getFile()).text());
  return j.notas.some(n => n.id === 'n1');
}), true);

/* ================================================================
   3. Buscar por la fecha (AAMMDD y dd/mm/aaaa), y vaciar la caja.
   ================================================================ */
console.log('--- 3. buscar por la fecha, y vaciar la caja ---');

const hoyAammdd = await pagina.evaluate(() => U.aAaMmDd(U.hoyIso()));
await pagina.fill('#buscar-papelera', hoyAammdd);
await pagina.waitForTimeout(200);
await comprobar('las dos que quedan tienen fecha de hoy', pagina.locator('#tabla-papelera .fila-papelera').count(), 2);
await comprobar('el contador dice «2 de 2»', pagina.locator('#cuenta-papelera').textContent(), '2 de 2');

await pagina.fill('#buscar-papelera', '');
await pagina.waitForTimeout(200);
await comprobar('caja vacía: vuelven las dos', pagina.locator('#tabla-papelera .fila-papelera').count(), 2);
await comprobar('el contador dice solo el total', pagina.locator('#cuenta-papelera').textContent(), '2');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
