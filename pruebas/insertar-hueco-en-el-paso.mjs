/* Prueba en navegador de verdad de la fila 158 de docs/COLA.md
   (docs/INSERTAR-HUECO-EN-EL-PASO.md): en el editor de la guía, dentro de
   «Comunicación de este paso», el botón «Insertar hueco» abre el buscador
   de huecos y el elegido entra en el texto, en Correo y en Séneca, en un
   paso normal y en uno que cuelga de una pregunta (antes se enganchaba
   antes de que el paso estuviera en la página y no hacía nada). */
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
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(() => {
  window.__editada = Guias.editar('MATRICULA', [
    { id: 'p1', titulo: 'Avisar', cuerpo: '', opciones: [] },
    { id: 'p2', titulo: '¿Viene completa?', cuerpo: '', opciones: [
      { id: 'o1', texto: 'No', pasos: [{ id: 'p3', titulo: 'Pedir lo que falta', cuerpo: '', opciones: [] }] }
    ] }
  ], [], []);
});
await pagina.waitForSelector('#guia-pasos [id="guiacom-p1-correo-hueco"]', { state: 'attached' });

async function probar(idPaso, canal) {
  await pagina.evaluate(([idPaso, canal]) => {
    const boton = document.getElementById('guiacom-' + idPaso + '-' + canal + '-hueco');
    let el = boton;
    while (el) { if (el.tagName === 'DETAILS') el.open = true; el = el.parentElement; }
    /* La pestaña del canal, a la vista. */
    const det = boton.closest('.paso-comunicacion');
    const pestana = det.querySelector('.paso-comunicacion-pestana[data-canal="' + canal + '"]');
    if (pestana) pestana.click();
    document.getElementById('guiacom-' + idPaso + '-' + canal + '-cuerpo').value = 'Hola ';
  }, [idPaso, canal]);
  /* El acordeón deja el paso cerrado: el clic, por debajo (lo que se prueba es el enganche). */
  await pagina.evaluate(([idPaso, canal]) => document.getElementById('guiacom-' + idPaso + '-' + canal + '-hueco').click(), [idPaso, canal]);
  await pagina.waitForSelector('.huecos-cuadro .huecos-opcion', { timeout: 3000 }).catch(() => {});
  const abierto = await pagina.evaluate(() => !!document.querySelector('.huecos-cuadro .huecos-opcion'));
  if (abierto) await pagina.evaluate(() => document.querySelector('.huecos-cuadro .huecos-opcion').click());
  await pagina.waitForTimeout(150);
  return [abierto, await pagina.evaluate(([idPaso, canal]) =>
    /^Hola \{[^}]+\}$/.test(document.getElementById('guiacom-' + idPaso + '-' + canal + '-cuerpo').value), [idPaso, canal])];
}

await comprobar('paso normal, Correo: abre el buscador y el hueco entra en el texto', probar('p1', 'correo'), [true, true]);
await comprobar('paso normal, Séneca: igual', probar('p1', 'seneca'), [true, true]);
await comprobar('paso de una pregunta, Correo: igual', probar('p3', 'correo'), [true, true]);

if (errores.length) { fallos++; console.log('ERRORES:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
