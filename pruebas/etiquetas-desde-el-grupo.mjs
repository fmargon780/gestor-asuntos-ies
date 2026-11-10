/* Prueba de la fila 344 (docs/ETIQUETAS.md), paso 9, separada de etiquetas.mjs en la fila 584:
   desde el asunto de grupo (tarjeta «Personas del grupo»), «Imprimir etiquetas» abre la pantalla de Etiquetas con
   las personas del grupo, y «Volver» lleva a la ficha del asunto.
   APARTADA (RETIRADAS de pruebas/ejecutar.mjs): fallo real de la app, idea 585 de docs/COLA.md. */
import { chromium } from 'playwright';
import { tarjetasSolas } from './apoyo/etiquetas-tarjetas.mjs';
import fs from 'node:fs';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
tarjetasSolas(pagina);
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

async function esperarVista() { await pagina.waitForSelector('.et-hoja'); await pagina.waitForTimeout(200); }

console.log('--- 9. desde el asunto de grupo ---');
await pagina.evaluate(() => App.ir('abiertos'));
const demo = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-etiquetas', { state: 'visible', timeout: 20000 });
const miembros = await pagina.evaluate((n) => App.E.registro.asuntos[n].relacionados.filter((r) => r.categoria === 'ALUMNADO').length, demo);
await pagina.click('.pg-etiquetas');
await esperarVista();
await comprobar('9. la pantalla se abre con las personas del grupo', pagina.evaluate(() => [document.getElementById('et-resumen').textContent, document.querySelector('.repartir-filtro-resumen').textContent]),
  [miembros + ' personas · ' + miembros + ' etiquetas', 'Sin criterios: se ve todo como siempre.']);
await comprobar('9. y «Volver» lleva a la ficha del asunto', (async () => { await pagina.click('#et-volver'); await pagina.waitForSelector('#pantalla-asunto:not(.oculto)'); return true; })(), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
