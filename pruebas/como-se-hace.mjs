/* Prueba de la fila 707 de docs/COLA.md (docs/707-COMO-SE-HACE.md): «Cómo se hace» dentro de la tarea de un tipo «sin hitos»:
   se escribe en la guía (varias líneas, opcional) y el asunto lo enseña con una marca que despliega y pliega. Con Chromium real y los
   datos inventados de la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const tareasPantalla = () => pagina.locator('#ficha-guia .ash-tarea .ash-texto-tarea').allTextContents();
async function abrirFicha(clave) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(300);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .ash', { timeout: 10000 });
  await pagina.waitForTimeout(400);
}
const { NUEVO, TIPO } = await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const t = App.tipoDeAsunto(a);
  App.E.tipos.filter((x) => x.tipo === t)[0].sinHitos = true;
  await App.guardarTipos();
  return { NUEVO: a.nombre, TIPO: t };
});

console.log('--- la guía ---');
pagina.evaluate((t) => GuiasDelCentro.escribir(t, {}), TIPO);
await pagina.waitForSelector('#capa:not(.oculto) #gsh-lista');
for (const t of ['Pedir el certificado', 'Enviar la carta']) {
  await pagina.click('#gsh-anadir');
  await pagina.locator('#gsh-lista .gsh-texto').last().fill(t);
}
const cuadros = [];
for (let i = 0; i < 2; i++) {   /* fila 737: el cuadro está a la derecha, al elegir la tarea */
  await pagina.locator('#gsh-lista .gsh-fila').nth(i).click();
  cuadros.push(await pagina.locator('#gsh-der .gsh-como').evaluate((x) => [x.tagName, x.value]));
}
await comprobar('1. cada tarea tiene su cuadro «Cómo se hace», vacío y opcional', cuadros, [['TEXTAREA', ''], ['TEXTAREA', '']]);
await pagina.locator('#gsh-lista .gsh-fila').nth(0).click();
await pagina.locator('#gsh-der .gsh-como').fill('Entra en Séneca.\nVe a Alumnado › Certificados.\nImprime el certificado.');
await pagina.evaluate(() => (document.getElementById('gsh-guardar') || document.getElementById('cuadro-aceptar')).click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForTimeout(400);
await comprobar('2. se guarda con la tarea y solo la que lo tiene', pagina.evaluate((t) => GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0].guion.map((g) => g.comoSeHace || ''), TIPO),
  ['Entra en Séneca.\nVe a Alumnado › Certificados.\nImprime el certificado.', '']);

console.log('--- el asunto ---');
await pagina.evaluate(async ([k, t]) => { await Hitos.cambiar((d) => { delete d.porAsunto[k]; return d; }); await Hitos.crearDesdeGuia(k, t); }, [NUEVO, TIPO]);
await abrirFicha(NUEVO);
await comprobar('3. solo la tarea con texto lleva la marca', pagina.locator('#ficha-guia .ash-tarea').evaluateAll((l) => l.map((x) => !!x.querySelector('.ash-como-boton'))), [true, false]);
await comprobar('3. la marca se llama «Cómo se hace»', pagina.locator('.ash-como-boton').first().getAttribute('aria-label'), 'Cómo se hace');
await comprobar('4. sale plegado', pagina.locator('#ficha-guia .ash-como').count(), 0);
await pagina.locator('.ash-como-boton').first().click();
await comprobar('5. al pulsar sale el texto debajo de la tarea, con sus saltos de línea', pagina.evaluate(() => {
  const t = document.querySelector('#ficha-guia .ash-tarea'); const c = t.querySelector('.ash-como');
  return [c && c.textContent, c && getComputedStyle(c).whiteSpace, !!c && c.previousElementSibling.classList.contains('ash-fila')];
}), ['Entra en Séneca.\nVe a Alumnado › Certificados.\nImprime el certificado.', 'pre-line', true]);
await pagina.locator('.ash-como-boton').first().click();
await comprobar('6. al pulsar otra vez se pliega', pagina.locator('#ficha-guia .ash-como').count(), 0);

console.log('--- «+ Añadir tarea» ---');
await pagina.fill('#ficha-guia .ash-anadir-texto', 'Una tarea mía');
await pagina.keyboard.press('Enter');
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea').length === 3, null, { timeout: 8000 });
await comprobar('7. la tarea añadida es una línea, sin marca', pagina.locator('#ficha-guia .ash-tarea').last().evaluate((x) => [!!x.querySelector('.ash-como-boton'), !!x.querySelector('.ash-como')]), [false, false]);

console.log('--- se corrige en la guía ---');
await pagina.evaluate(async (t) => {
  const pasos = GuiasDelCentro.pasosDe(t);
  const g = pasos.filter((p) => p.listaDeTareas)[0].guion;
  g[0].comoSeHace = 'Texto corregido';
  g[1].comoSeHace = 'Ahora también esta';
  await GuiasDelCentro.guardarPasos(t, pasos);
}, TIPO);
await abrirFicha(NUEVO);
await comprobar('8. el asunto ya abierto enseña el texto corregido y la tarea que ahora lo tiene lleva marca', (async () => {
  await pagina.locator('.ash-como-boton').first().click();
  return pagina.evaluate(() => [document.querySelector('#ficha-guia .ash-como').textContent, document.querySelectorAll('#ficha-guia .ash-como-boton').length]);
})(), ['Texto corregido', 2]);

await comprobar('9. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
