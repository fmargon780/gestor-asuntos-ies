/* Prueba de la fila 274 de docs/COLA.md (docs/AL-TERMINAR-EL-ASUNTO.md): el
   apartado «Al terminar el asunto» de la pantalla de un tipo. Con Chromium real y
   los datos inventados de la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
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

async function abrirTipo(nombre) {
  await pagina.click('.pestana[data-pantalla="ajustes"]');
  await pagina.waitForTimeout(300);
  await pagina.click('[data-ajustes-pestana="tipos"]');
  await pagina.fill('#buscar-tipos', nombre);
  await pagina.waitForTimeout(300);
  await pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: nombre }).first().locator('.tarjeta-tipo-nombre').click();
  await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
  await pagina.waitForTimeout(500);
}
const apartado = '#pantalla-tipo-asunto details[data-seccion="al-terminar"]';
const resumen = () => pagina.locator(apartado + ' > summary .bloque-resumen').textContent().then((t) => t.trim());
const abierto = () => pagina.evaluate((s) => document.querySelector(s).open, apartado);
async function abrir() { if (!(await abierto())) await pagina.click(apartado + ' > summary'); }
const casilla = () => pagina.locator(apartado + ' label.interruptor-fila input');

await pagina.evaluate(async () => { App.E.tipos.push({ tipo: 'PRUEBA SIN LIQUIDAR', categoria: 'ALUMNADO' }); await App.guardarTipos(); });

console.log('--- el tipo del seguro escolar ---');
await abrirTipo('SEGURO ESCOLAR');
await comprobar('1. el orden de los apartados de la columna izquierda', pagina.locator('#tipo-asunto-col-1 > details > summary .bloque-titulo').allTextContents(),
  ['Datos del tipo', 'Campos', 'Guía', 'Al terminar el asunto', 'Plazo', 'Palabras clave']);
await comprobar('2. sale plegado, con su texto gris', [await abierto(), await pagina.locator(apartado + ' > summary .bloque-pie').textContent()],
  [false, 'Qué pasa con un asunto de este tipo cuando se termina.']);
await comprobar('3. sin abrirlo dice «pasa a Por liquidar»', resumen(), 'pasa a Por liquidar');
await abrir();
await comprobar('5. dos casillas, en este orden, con la nota de la primera', pagina.evaluate((s) => {
  const d = document.querySelector(s);
  return [Array.from(d.querySelectorAll('label.interruptor')).map((l) => l.textContent.trim()), /pestaña «Por liquidar» de Inicio hasta que se liquidan/.test(d.textContent)];
}, apartado), [['Al terminar, pasa a «Por liquidar» en vez de archivarse', 'Al cerrar el asunto, avisar a quien lo pide'], true]);
await comprobar('6. la primera sale marcada en el seguro escolar', casilla().first().isChecked(), true);
await comprobar('13. en ningún sitio queda el texto viejo', pagina.evaluate(() => document.getElementById('pantalla-tipo-asunto').textContent.indexOf('Hay que liquidarlo antes de archivar') !== -1), false);

console.log('--- el otro tipo ---');
await abrirTipo('PRUEBA SIN LIQUIDAR');
await comprobar('4. sin abrirlo dice «se archiva»', resumen(), 'se archiva');
await abrir();
await comprobar('6. la primera sale desmarcada', casilla().first().isChecked(), false);
await casilla().first().check();
await pagina.waitForTimeout(500);
await comprobar('7. al marcarla, el título pasa a «pasa a Por liquidar»', resumen(), 'pasa a Por liquidar');
await comprobar('7. y se guarda en el tipo', pagina.evaluate(() => App.E.tipos.filter((t) => t.tipo === 'PRUEBA SIN LIQUIDAR')[0].liquidar), true);
await abrirTipo('PRUEBA SIN LIQUIDAR');
await comprobar('7. al volver a entrar sigue marcada', [await abierto(), await casilla().first().isChecked()], [true, true]);
await casilla().first().uncheck();
await pagina.waitForTimeout(500);
await comprobar('9. desmarcada, vuelve a «se archiva»', resumen(), 'se archiva');

console.log('--- avisar a quien lo pide ---');
await pagina.locator(apartado + ' .tipo-avisar-lopide-cierre').check();
await pagina.waitForTimeout(500);
await comprobar('10. marcada: sale la plantilla y el título acaba en « · avisa a quien lo pide»', pagina.evaluate((s) => [
  !document.querySelector(s + ' .tipo-avisar-lopide-cierre-plantilla').classList.contains('oculto')], apartado), [true]);
await comprobar('10. el título', resumen(), 'se archiva · avisa a quien lo pide');
await comprobar('11. la lista de comprobación pide la plantilla y su línea abre «Al terminar el asunto»', (async () => {
  await pagina.click('#pantalla-tipo-asunto details[data-seccion="al-terminar"] > summary');   /* se pliega para ver que la línea lo abre */
  await pagina.locator('#pantalla-tipo-asunto .tipo-comprobacion-linea, #pantalla-tipo-asunto [class*="comprobacion"] button, #pantalla-tipo-asunto [class*="comprobacion"] li').filter({ hasText: 'Falta la plantilla del aviso al cerrar' }).first().click();
  await pagina.waitForTimeout(300);
  return abierto();
})(), true);
await pagina.locator(apartado + ' .tipo-avisar-lopide-cierre').uncheck();
await pagina.waitForTimeout(400);
await comprobar('10. desmarcada: se esconde la plantilla y el título pierde ese trozo', pagina.evaluate((s) => [
  document.querySelector(s + ' .tipo-avisar-lopide-cierre-plantilla').classList.contains('oculto')], apartado), [true]);
await comprobar('10. el título', resumen(), 'se archiva');

console.log('--- «Datos del tipo» ---');
await pagina.evaluate(() => { document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').open = true; });
await comprobar('12. ya no están las dos casillas; siguen el sello, la firma y el nombre corto', pagina.evaluate(() => {
  const t = document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').textContent;
  return [/Por liquidar|liquidarlo/.test(t), /avisar a quien lo pide/.test(t), /Lleva el sello de registro de Séneca/.test(t), /Lleva la firma digital del director/.test(t)];
}), [false, false, true, true]);
await comprobar('12. plegado, su título sigue diciendo solo la categoría', pagina.locator('#pantalla-tipo-asunto details[data-seccion="datos"] > summary .bloque-resumen').textContent().then((t) => t.trim()), 'ALUMNADO');

console.log('--- 14. se recuerda abierto ---');
await abrirTipo('SEGURO ESCOLAR');
await comprobar('14. «Al terminar el asunto» sigue abierto en otro tipo', abierto(), true);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
