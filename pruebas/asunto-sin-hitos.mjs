/* Prueba de la fila 699 de docs/COLA.md (docs/699-ASUNTO-SIN-HITOS-PANTALLA.md): un tipo con la casilla «Sin hitos» da asuntos
   nuevos con panel y lista de tareas, sin fila de hitos; los demás asuntos no cambian. Con Chromium real y los datos inventados
   de la copia de pruebas (?demo=1&auto=1). */
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

async function abrirTipo(nombre) {
  await pagina.click('.pestana[data-pantalla="ajustes"]');
  await pagina.waitForTimeout(300);
  await pagina.click('[data-ajustes-pestana="dia"]');
  await pagina.fill('#buscar-tipos', nombre);
  await pagina.waitForTimeout(300);
  await pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: nombre }).first().locator('.tarjeta-tipo-nombre').click();
  await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
  await pagina.waitForTimeout(500);
}
async function abrirFicha(clave) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(300);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .ash, #ficha-guia .hito, #ficha-guia .explica', { state: 'attached', timeout: 10000 });
  await pagina.waitForTimeout(400);
}
const ficha = (js) => pagina.evaluate(js);
const tareas = () => pagina.locator('#ficha-guia .ash-tarea .ash-texto-tarea').allTextContents();
const panel = () => pagina.locator('#ficha-guia .ash-panel-texto').innerText().then((t) => t.replace(/\s+/g, ' ').trim());
const cuenta = () => pagina.locator('#ficha-guia .ash-cuenta').textContent();

console.log('--- la casilla del tipo ---');
await pagina.evaluate(async () => { App.E.tipos.push({ tipo: 'PRUEBA SIN HITOS', categoria: 'ALUMNADO' }); await App.guardarTipos(); });
await abrirTipo('PRUEBA SIN HITOS');
const casilla = pagina.locator('#pantalla-tipo-asunto label.interruptor-fila').filter({ hasText: 'Sin hitos: el asunto es una lista de tareas' }).locator('input');
await pagina.evaluate(() => { document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').open = true; });
await comprobar('1. en Ajustes del tipo está la casilla «Sin hitos: el asunto es una lista de tareas», desmarcada', [await casilla.count(), await casilla.isChecked()], [1, false]);
await casilla.check();
await pagina.waitForTimeout(500);
await comprobar('1. al marcarla se guarda en el tipo', pagina.evaluate(() => App.E.tipos.filter((t) => t.tipo === 'PRUEBA SIN HITOS')[0].sinHitos), true);

console.log('--- un asunto de ese tipo ---');
const claves = await pagina.evaluate(() => App.E.listaAbiertos.slice(0, 2).map((a) => a.nombre));
const [NUEVO, CON_HITOS] = claves;
await pagina.evaluate(async (k) => {   /* un asunto de siempre, con un hito normal */
  await Hitos.cambiar((d) => { d.porAsunto[k] = { creados: U.hoyIso(), hitos: [Hitos.pasoAHito({ id: 'p1', titulo: 'Primer paso' })] }; return d; });
}, CON_HITOS);
const hitosAntes = 1;
await pagina.evaluate(async (k) => {
  await Hitos.cambiar((d) => { delete d.porAsunto[k]; return d; });   /* como un asunto recién nacido: sin hitos todavía */
  await Hitos.crearDesdeGuia(k, 'PRUEBA SIN HITOS');
}, NUEVO);
await abrirFicha(NUEVO);
await comprobar('2. sin fila de hitos, sin «Marcar como hecho» ni «Hito ▾»', pagina.evaluate(() => [
  document.querySelectorAll('#ficha-tira .mesa-tira-hito').length, document.querySelectorAll('.mesa-marcar-hecho').length, document.querySelectorAll('.mesa-mas').length,
  document.querySelectorAll('#ficha-guia .hito').length]), [0, 0, 0, 0]);
await comprobar('2. sin casilla de llevar los cambios a la guía', pagina.evaluate(() => document.querySelectorAll('.marca-guia-casilla').length), 0);
await comprobar('2. el panel dice que aún no hay tareas', panel(), 'Todavía no hay tareas Añade la primera aquí debajo.');

console.log('--- añadir ---');
await pagina.fill('.ash-anadir-texto', 'Pedir el certificado');
await pagina.keyboard.press('Enter');
await pagina.waitForFunction(() => document.querySelectorAll('.ash-tarea').length === 1);
await pagina.fill('.ash-anadir-texto', 'Enviar la carta');
await pagina.click('.ash-anadir-boton');
await pagina.waitForFunction(() => document.querySelectorAll('.ash-tarea').length === 2);
await comprobar('3. «+ Añadir tarea» añade con Intro y con «Añadir», sin ventana', [await tareas(), await pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto'))],
  [['Pedir el certificado', 'Enviar la carta'], true]);
await comprobar('3. las dos llevan «solo aquí»', pagina.locator('.ash-tarea .ash-etq').allTextContents(), ['solo aquí', 'solo aquí']);
await comprobar('3. el panel dice «Ahora toca: » la primera, con la cuenta', [await panel(), await cuenta()],
  ['Ahora toca: Pedir el certificado Le toca a Administración.', '0 de 2 tareas hechas']);

console.log('--- marcar y desmarcar ---');
await pagina.locator('.ash-tarea').first().locator('.ash-casilla').check();
await pagina.waitForFunction(() => document.querySelector('.ash-tarea.hecha'));
await comprobar('4. marcada queda hecha, con quién y qué día', pagina.locator('.ash-tarea.hecha .ash-quien').textContent().then((t) => /\S+ · \d+-[a-z]{3}/.test(t)), true);
await comprobar('4. el panel pasa a la siguiente y la cuenta sube', [await panel(), await cuenta()], ['Ahora toca: Enviar la carta Le toca a Administración.', '1 de 2 tareas hechas']);
await pagina.locator('.ash-tarea').first().locator('.ash-casilla').uncheck();
await pagina.waitForFunction(() => !document.querySelector('.ash-tarea.hecha'));
await comprobar('4. se puede desmarcar', cuenta(), '0 de 2 tareas hechas');

console.log('--- el ⋮ ---');
await pagina.locator('.ash-tarea').nth(1).locator('.ash-menu-boton').click();
await comprobar('5. ofrece Anotar, Cambiar, Esperando a… (fila 702) y Borrar', pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')).map((b) => b.textContent.trim())), ['Anotar', 'Cambiar', 'Esperando a…', 'Borrar']);
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=Cambiar');
await pagina.fill('.ash-editar-texto', 'Enviar la carta certificada');
await pagina.keyboard.press('Enter');
await pagina.waitForFunction(() => /certificada/.test(document.querySelector('.ash-lista').textContent));
await comprobar('5. «Cambiar» cambia la frase', tareas(), ['Pedir el certificado', 'Enviar la carta certificada']);
await pagina.locator('.ash-tarea').nth(1).locator('.ash-menu-boton').click();
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=Anotar');
await pagina.fill('.ash-anotar-texto', 'Llamar antes a la familia');
await pagina.keyboard.press('Enter');
await pagina.waitForSelector('.ash-nota', { timeout: 5000 });
await comprobar('5. «Anotar» deja la nota debajo de la tarea', pagina.locator('.ash-nota').first().innerText().then((t) => /Llamar antes a la familia/.test(t)), true);
await pagina.locator('.ash-tarea').nth(1).locator('.ash-menu-boton').click();
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=Borrar');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.querySelectorAll('.ash-tarea').length === 1);
await comprobar('5. «Borrar» pide confirmación (tenía nota) y la quita', tareas(), ['Pedir el certificado']);

console.log('--- listo para cerrar y cerrar con tareas sin hacer ---');
await pagina.locator('.ash-tarea').first().locator('.ash-casilla').check();
await pagina.waitForSelector('.ash-panel.ash-listo');
await comprobar('6. con todas hechas: «Listo para cerrar» y el botón «Cerrar el asunto»', [await panel(), await pagina.locator('.ash-cerrar').count()], ['Listo para cerrar Todas las tareas están hechas.', 1]);
await pagina.fill('.ash-anadir-texto', 'Otra más');
await pagina.keyboard.press('Enter');
await pagina.waitForFunction(() => document.querySelectorAll('.ash-tarea').length === 2);
await pagina.click('#ficha-archivar button');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('6. cerrar con una tarea sin hacer avisa de cuántas quedan', pagina.locator('#cuadro-cuerpo').innerText().then((t) => /Queda 1 tarea sin hacer/.test(t)), true);
await pagina.click('#cuadro-cancelar');
await comprobar('6. «Cancelar» deja el asunto abierto', pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')), true);

console.log('--- la cabecera y los bloques de siempre ---');
await comprobar('7. «Generar documento ▾» y «Enviar ▾» siguen en la cabecera', pagina.evaluate(() => [
  !!document.querySelector('#ficha-generar-enviar .ficha-generar-cab'), !!document.querySelector('#ficha-archivar button')]), [true, true]);

console.log('--- sin cambios en los demás ---');
await abrirFicha(CON_HITOS);
await comprobar('8. un asunto con hitos sigue con su fila de hitos y sin panel', pagina.evaluate(() => [
  document.querySelectorAll('#ficha-tira .mesa-tira-hito').length > 0, document.querySelectorAll('.ash-panel').length]), [true, 0]);
await comprobar('8. y tenía los mismos hitos que antes', pagina.evaluate(async (k) => (await Hitos.hitosDe(k)).length, CON_HITOS), hitosAntes);
await comprobar('8. un tipo sin la casilla crea sus hitos como siempre', pagina.evaluate(async () => {
  await Hitos.cambiar((d) => { delete d.porAsunto['__prueba__']; return d; });
  const h = await Hitos.crearDesdeGuia('__prueba__', 'PRUEBA SIN HITOS DESMARCADO');
  return h.filter((x) => x.listaDeTareas).length;
}), 0);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
