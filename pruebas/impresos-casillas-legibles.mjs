/* Prueba en navegador de verdad de la fila 146
   (docs/IMPRESOS-CASILLAS-LEGIBLES.md): Ajustes → El centro → «Impresos
   oficiales», con el Anexo III de verdad (formularios/O-III.pdf, en
   blanco: no lleva datos de nadie).

   - Antes de leerlo, «Sin leer todavía».
   - Leído: arriba, las del centro; «Otras casillas» y «Datos de la
     persona» plegados; ningún nombre interno (`form1[0]…`) a la vista.
   - Sin nada guardado, la propuesta se guarda sola y se avisa en verde;
     el resumen dice cuántas del centro.
   - Una fila se ve con su página: «Página 2 · …» o «… (en N páginas)».
   - La miniatura se pinta al pasar por encima. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.evaluate(async () => {
  await FormulariosRellenar.pintarPantallaImpresos();
  /* El bloque «Impresos oficiales» nace plegado (fila 105). */
  let d = document.getElementById('tabla-impresos-oficiales').closest('details');
  while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
});

const tarjeta = pagina.locator('#tabla-impresos-oficiales > details').filter({ hasText: 'Anexo III · Solicitud de admisión' });
await comprobar('antes de leerlo, «Sin leer todavía»', tarjeta.locator('summary .bloque-pie').textContent(), 'Sin leer todavía');

await tarjeta.locator('summary').click();
await tarjeta.locator('.boton-leer-impreso').click();
await pagina.waitForSelector('#tabla-impresos-oficiales .impreso-casilla', { timeout: 20000 });
await pagina.waitForTimeout(500);

await comprobar('arriba, las del centro; los otros dos grupos, plegados',
  tarjeta.evaluate((d) => {
    const cuerpo = d.querySelector('.bloque-cuerpo');
    const hijos = Array.from(cuerpo.children).map((x) => x.className + (x.tagName === 'DETAILS' ? (x.open ? ':abierto' : ':plegado') : ''));
    return hijos;
  }), ['impreso-grupo impreso-centro', 'impreso-grupo impreso-otras:plegado', 'impreso-grupo impreso-persona:plegado']);
await comprobar('ningún nombre interno a la vista',
  tarjeta.evaluate((d) => Array.from(d.querySelectorAll('.impreso-casilla-nombre')).filter((e) => e.offsetParent)
    .some((e) => /^form1\[0\]/.test(e.textContent))), false);
await comprobar('las del centro, con su nombre legible',
  tarjeta.evaluate((d) => Array.from(d.querySelectorAll('.impreso-centro .impreso-casilla-nombre')).map((e) => e.textContent)),
  ['Centroprioritario', 'Municipioprioritario', 'Código 1', 'Centro 1 (en 2 páginas)', 'Municipio 1']);
await comprobar('«Datos de la persona» dice que no se rellenan nunca, y lleva el primer apellido una sola vez',
  tarjeta.evaluate((d) => {
    const p = d.querySelector('.impreso-persona');
    const nombres = Array.from(p.querySelectorAll('.impreso-casilla-nombre')).map((e) => e.textContent);
    return [/— no se rellenan nunca$/.test(p.querySelector('summary').textContent), nombres.filter((n) => /^Primer apellido/.test(n))];
  }), [true, ['Primer apellido (en 3 páginas)']]);
await comprobar('el nombre interno, en el title de la fila',
  tarjeta.evaluate((d) => /^form1\[0\]/.test(d.querySelector('.impreso-centro .impreso-casilla').title)), true);

await comprobar('la propuesta se ha guardado sola',
  pagina.evaluate(async () => {
    const m = await Carpetas.leerJson(App.E.gestor, 'formularios-campos.json');
    return Object.keys(m['O:III'] || {}).length;
  }), 6);
await comprobar('con su aviso en verde',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.mensaje')).some((m) => /He puesto 5 casillas del centro\. Revísalas si quieres\./.test(m.textContent))), true);
await comprobar('y el resumen lo dice', tarjeta.locator('summary .bloque-pie').textContent(), '5 casillas del centro puestas');

await tarjeta.locator('.impreso-centro .impreso-casilla').first().hover();
await pagina.waitForFunction(() => !!document.querySelector('.impreso-centro .impreso-mini canvas'), null, { timeout: 20000 }).catch(() => {});
await comprobar('la miniatura se pinta al pasar por encima',
  tarjeta.evaluate((d) => !!d.querySelector('.impreso-centro .impreso-casilla .impreso-mini canvas')), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
