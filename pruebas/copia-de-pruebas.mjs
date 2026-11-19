/* Fila 222, docs/COPIA-DE-PRUEBAS.md: la copia de pruebas entra sola
   con datos inventados, sin señalar ninguna carpeta, y "Volver a
   empezar" la deja como al principio. Con Chromium real, como
   pruebas/navegador.mjs. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();

const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");   /* fila 248: la ventana «Qué hay de nuevo» no tapa la prueba */
await pagina.goto(DIRECCION);

/* Entra sola, sin pulsar nada: la franja aparece y la pantalla de
   entrada desaparece. */
await pagina.waitForSelector('#franja-demo', { timeout: 20000 });
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await comprobar('la pantalla de entrada queda oculta', pagina.locator('#arranque').isHidden(), true);
await comprobar('la franja dice que es de pruebas',
  pagina.locator('#franja-demo').textContent().then((t) => t.indexOf('Copia de pruebas') !== -1), true);

/* Inicio ya trae asuntos inventados, con al menos uno con plazo vencido. */
await pagina.waitForSelector('#inicio-tabla-cuerpo .fila, #inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });
await comprobar('Inicio no está vacío',
  pagina.locator('#inicio-tabla-cuerpo .vacio').count(), 0);
await comprobar('hay al menos un asunto con el plazo vencido',
  pagina.locator('.plazo-vencido').count().then((n) => n > 0), true);
const abiertosDePartida = await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila').count();

/* El Archivo también tiene algo, en dos cursos (el selector nace en el
   curso de hoy, así que hay que pedir "Todos los cursos" para verlos
   los dos juntos). */
await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.waitForSelector('#lista-archivo .tarjeta', { timeout: 20000 });
await comprobar('el selector de curso ofrece los dos cursos',
  pagina.locator('#selector-curso-archivo option').count().then((n) => n >= 3), true);
await pagina.selectOption('#selector-curso-archivo', '');
await pagina.waitForTimeout(400);
await comprobar('con "Todos los cursos" salen las dos carpetas archivadas',
  pagina.locator('#lista-archivo .tarjeta').count().then((n) => n >= 2), true);

/* Crear un asunto nuevo funciona de verdad. */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.fill('#buscar-tercero', 'aguilar');
await pagina.waitForSelector('#resultados-tercero .resultado', { timeout: 20000 });
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await pagina.click('#tipos-lista .tipo-boton');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 20000 });
await comprobar('crear un asunto de verdad abre su ficha', pagina.locator('#pantalla-asunto').isHidden(), false);

/* "Volver a empezar": recarga con el disco vacío, y lo creado ya no está:
   vuelve a haber los mismos asuntos que al entrar la primera vez, uno
   menos que justo antes de reiniciar (el que se acaba de crear). */
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
const conElNuevo = await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila').count();
await comprobar('el asunto recién creado se suma a los de partida',
  conElNuevo, abiertosDePartida + 1);
await pagina.click('#btn-demo-reiniciar');
await pagina.waitForSelector('#franja-demo', { timeout: 20000 });
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
const despues = await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila').count();
await comprobar('tras "Volver a empezar" hay los mismos asuntos de partida que la primera vez',
  despues, abiertosDePartida);

await comprobar('sin errores de consola', Promise.resolve(errores), []);

/* Fila 710: la dirección de pruebas entra SIEMPRE en demostración, aunque falte `?demo=1&auto=1`, y no ofrece
   señalar carpetas de verdad; producción no carga nada de `js/demo/`. El nombre de la dirección se simula con una
   regla de resolución de nombres de Chromium que lo lleva al servidor local. */
const local = new URL(process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegadorNombres = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--host-resolver-rules=MAP pruebas.fmargon.com 127.0.0.1, MAP fmargon780.github.io 127.0.0.1, MAP asuntos.fmargon.com 127.0.0.1']
});
async function conNombre(nombre) {
  const ctx = await navegadorNombres.newContext();
  const p = await ctx.newPage();
  const peticionesDemo = [];
  p.on('request', (r) => { if (r.url().indexOf('/js/demo/') !== -1) peticionesDemo.push(r.url()); });
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
  await p.goto('http://' + nombre + ':' + local.port + '/index.html', { waitUntil: 'commit' });
  return { ctx, p, peticionesDemo };
}

const enPruebas = await conNombre('pruebas.fmargon.com');
await enPruebas.p.waitForSelector('#franja-demo', { timeout: 90000 });
await enPruebas.p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 90000 });
await comprobar('en pruebas.fmargon.com, sin ?demo=1, entra sola en demostración',
  enPruebas.p.locator('#franja-demo').count(), 1);
await comprobar('en pruebas.fmargon.com no queda a la vista ningún botón de señalar carpetas',
  enPruebas.p.locator('#btn-abiertos, #btn-archivo').evaluateAll((bs) => bs.every((b) => b.offsetParent === null)), true);
await enPruebas.ctx.close();

/* Fila 713: la dirección de prueba es ahora la de GitHub Pages; se comporta igual. */
const enPages = await conNombre('fmargon780.github.io');
await enPages.p.waitForSelector('#franja-demo', { timeout: 90000 });
await enPages.p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 90000 });
await comprobar('en fmargon780.github.io, sin ?demo=1, entra sola en demostración',
  enPages.p.locator('#franja-demo').count(), 1);
await comprobar('en fmargon780.github.io no queda a la vista ningún botón de señalar carpetas',
  enPages.p.locator('#btn-abiertos, #btn-archivo').evaluateAll((bs) => bs.every((b) => b.offsetParent === null)), true);
await enPages.ctx.close();

const enProduccion = await conNombre('asuntos.fmargon.com');
await enProduccion.p.waitForLoadState('load', { timeout: 90000 });
await enProduccion.p.waitForSelector('#arranque', { timeout: 20000 });
await enProduccion.p.waitForTimeout(800);
await comprobar('en asuntos.fmargon.com no existe window.Demo', enProduccion.p.evaluate(() => typeof window.Demo), 'undefined');
await comprobar('en asuntos.fmargon.com no hay franja ni botón de demostración',
  enProduccion.p.locator('#franja-demo, #btn-demo-entrar').count(), 0);
await comprobar('en asuntos.fmargon.com no se pide nada de js/demo/', Promise.resolve(enProduccion.peticionesDemo.filter((u) => !/arrancar\.js$/.test(u))), []);
await enProduccion.ctx.close();

await navegadorNombres.close();
await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de la copia de pruebas pasan.');
process.exit(fallos ? 1 : 0);
