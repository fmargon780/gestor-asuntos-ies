/* Prueba en navegador de verdad de la fila 243 de docs/COLA.md
   (docs/TITULOS-DE-LA-TABLA-FIJOS.md): en Inicio, al bajar por la tabla, se
   quedan fijas debajo de la cabecera encogida las cuatro pestañas y la fila
   de títulos de las columnas.

   1. Bajado hasta el final: cabecera, pestañas y títulos, en ese orden, sin
      huecos ni solaparse, y la fila «Ha llegado» se ha ido.
   3. Bajado, pulsar otra pestaña: siguen fijos.
   5. El fondo de pestañas y títulos es opaco.
   6. Subir del todo: todo vuelve a su sitio.
   7. Ventana estrecha: la tabla sigue pudiéndose ver entera (scroll lateral).
   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 700 } });
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
await pagina.evaluate(async () => {
  for (let i = 10; i < 70; i++) {
    await window.__disco.abiertos.getDirectoryHandle('2609' + i + ' CONSULTA Relleno Número ' + i, { create: true });
  }
  App.ir('abiertos');
  await App.verAbiertos();
});
await pagina.click('.inicio-pestana[data-pestana="todos"]');
await pagina.waitForTimeout(300);

const cajas = () => pagina.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
  return { cab: r('#pantalla-abiertos header.cabecera'), pest: r('#inicio-pestanas'), th: r('.inicio-tabla thead th'), scrollY: Math.round(window.scrollY),
    ha: (() => { const e = document.querySelector('#inicio-fila-superior'); return e ? Math.round(e.getBoundingClientRect().bottom) : null; })() };
});
const pegadas = (c) => c.pest.top >= c.cab.bottom - 1 && c.pest.top <= c.cab.bottom + 1 && c.th.top >= c.pest.bottom - 1 && c.th.top <= c.pest.bottom + 1;

console.log('--- 1. bajado: cabecera, pestañas y títulos pegados, en orden ---');
const antes = await cajas();
await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await pagina.waitForTimeout(700);
let c = await cajas();
await comprobar('1. la ventana ha bajado de verdad', Promise.resolve(c.scrollY > 600), true);
await comprobar('1. la cabecera está arriba, las pestañas pegadas debajo y los títulos pegados debajo de ellas', Promise.resolve(pegadas(c)), true);
await comprobar('1. la cabecera arriba del todo (top 0)', Promise.resolve(c.cab.top), 0);
await comprobar('2. «Ha llegado» se ha ido con la página', Promise.resolve(c.ha === null || c.ha < c.cab.bottom), true);

console.log('--- 5. fondo opaco ---');
await comprobar('5. pestañas y títulos con fondo opaco',
  pagina.evaluate(() => ['#inicio-pestanas', '.inicio-tabla thead th'].map((s) => {
    const col = getComputedStyle(document.querySelector(s)).backgroundColor;
    return !/rgba\(0, 0, 0, 0\)|transparent/.test(col);
  })), [true, true]);

console.log('--- 3. cambiar de pestaña, bajado ---');
await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await pagina.click('.inicio-pestana[data-pestana="dorm"]');
await pagina.waitForTimeout(400);
c = await cajas();
await comprobar('3. cambia la pestaña activa, y pestañas y títulos no se solapan',
  pagina.evaluate(() => document.querySelector('.inicio-pestana.activa').dataset.pestana).then((p) => [p, c.th.top >= c.pest.bottom - 1]), ['dorm', true]);
await pagina.click('.inicio-pestana[data-pestana="todos"]');
await pagina.waitForTimeout(300);
await pagina.evaluate(() => window.scrollTo(0, 500));
await pagina.waitForTimeout(500);
c = await cajas();
await comprobar('3. de vuelta en «Todos» y bajado, siguen pegados', Promise.resolve(pegadas(c) && c.th.top > 0), true);

console.log('--- 6. subir del todo ---');
await pagina.evaluate(() => window.scrollTo(0, 0));
await pagina.waitForTimeout(800);
const arriba = await cajas();
await comprobar('6. arriba del todo todo vuelve a su sitio (mismas posiciones que al principio)',
  Promise.resolve([arriba.scrollY, Math.abs(arriba.pest.top - antes.pest.top) <= 2, Math.abs(arriba.th.top - antes.th.top) <= 2]), [0, true, true]);

console.log('--- 7. ventana estrecha: scroll lateral, la tabla se ve entera ---');
await pagina.setViewportSize({ width: 800, height: 700 });
await pagina.waitForTimeout(600);
await comprobar('7. la tabla desborda y conserva su scroll lateral',
  pagina.evaluate(() => { const e = document.querySelector('.inicio-tabla-envoltorio'); return [e.classList.contains('desborda'), getComputedStyle(e).overflowX, e.scrollWidth > e.clientWidth]; }),
  [true, 'auto', true]);
await comprobar('7. y llega hasta su última columna (se puede desplazar)',
  pagina.evaluate(() => { const e = document.querySelector('.inicio-tabla-envoltorio'); e.scrollLeft = 99999; return e.scrollLeft > 0; }), true);
await pagina.evaluate(() => window.scrollTo(0, 800));
await pagina.waitForTimeout(500);
c = await cajas();
await comprobar('7. aun así las pestañas siguen pegadas bajo la cabecera', Promise.resolve(c.pest.top >= c.cab.bottom - 1 && c.pest.top <= c.cab.bottom + 1), true);

console.log('--- 8. con los datos de la demostración (nombres y hitos de verdad), a 1280 px ---');
const demo = await navegador.newPage({ viewport: { width: 1280, height: 700 } });
demo.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await demo.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");   /* fila 248: la ventana «Qué hay de nuevo» no tapa la prueba */
await demo.goto(new URL('?demo=1&auto=1', process.env.DIRECCION || 'http://localhost:8123/index.html').href);
await demo.waitForSelector('#inicio-tabla-cuerpo tr', { timeout: 30000 });
await demo.evaluate(async () => {
  for (let i = 10; i < 40; i++) await Carpetas.crear(App.E.abiertos, '2609' + i + ' CONSULTA Relleno Número ' + i);
  App.ir('abiertos');
  await App.verAbiertos();
});
await demo.click('.inicio-pestana[data-pestana="todos"]');
await demo.waitForTimeout(600);
await demo.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await demo.waitForTimeout(800);
const cd = await demo.evaluate(() => {
  const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
  const e = document.querySelector('.inicio-tabla-envoltorio');
  return { cab: r('#pantalla-abiertos header.cabecera'), pest: r('#inicio-pestanas'), th: r('.inicio-tabla thead th'),
    cabe: !e.classList.contains('desborda'), y: Math.round(window.scrollY) };
});
await comprobar('8. a 1280 px la tabla cabe (sin scroll lateral) y los títulos se quedan fijos, bajo las pestañas',
  Promise.resolve([cd.cabe, cd.y > 400, pegadas(cd)]), [true, true, true]);
await demo.close();

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
