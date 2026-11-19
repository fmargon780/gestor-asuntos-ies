/* Prueba de la fila 706 de docs/COLA.md (docs/706-ROTULOS.md): rótulos que agrupan las tareas de un trámite largo.
   En la guía de un tipo «sin hitos» se añade un rótulo (junto a «+ Añadir una tarea»), se cambia su texto, se mueve y se quita;
   el asunto nuevo lo enseña en una banda con las tareas de debajo metidas; sin rótulos nada se mete; el rótulo no tiene casilla ni ⋮
   y no cuenta en «N de M tareas hechas»; desde el asunto no se añaden rótulos.
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1). */
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
const guia = () => pagina.evaluate((t) => GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0].guion.map((g) => (g.rotulo ? '# ' : '') + g.texto), TIPO);
const abrirGuia = async () => { pagina.evaluate((t) => GuiasDelCentro.escribir(t, {}), TIPO); await pagina.waitForSelector('#capa:not(.oculto) #gsh-lista'); };
const guardarGuia = async () => { await pagina.click('#cuadro-aceptar'); await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto')); await pagina.waitForTimeout(400); };

console.log('--- la guía ---');
await abrirGuia();
await pagina.click('#gsh-anadir-rotulo');
await pagina.locator('#gsh-lista .gsh-texto').last().fill('Recibir la petición');
for (const t of ['Pedir el certificado', 'Enviar la carta']) { await pagina.click('#gsh-anadir'); await pagina.locator('#gsh-lista .gsh-texto').last().fill(t); }
await pagina.click('#gsh-anadir-rotulo');
await pagina.locator('#gsh-lista .gsh-texto').last().fill('Avisar y cerrar');
await pagina.click('#gsh-anadir');
await pagina.locator('#gsh-lista .gsh-texto').last().fill('Archivar');
await comprobar('1. «+ Añadir rótulo» está junto a «+ Añadir una tarea»', pagina.locator('#capa button').evaluateAll((l) => l.map((b) => b.textContent).filter((t) => /^\+ Añadir/.test(t))), ['+ Añadir una tarea', '+ Añadir rótulo']);
await comprobar('2. un rótulo no lleva papel, «Cómo se hace» ni «Cuándo se hace»; una tarea sí', pagina.locator('#gsh-lista .gsh-fila').evaluateAll((l) => l.map((f) => [f.classList.contains('gsh-rotulo'), !!f.querySelector('.gsh-papel'), !!f.querySelector('.gsh-como')])), [[true, false, false], [false, true, true], [false, true, true], [true, false, false], [false, true, true]]);
await comprobar('3. las tareas se numeran sin contar los rótulos', pagina.locator('#gsh-lista .gsh-num').allTextContents(), ['▌', '1', '2', '▌', '3']);
await pagina.locator('#gsh-lista .gsh-fila').nth(3).locator('button', { hasText: '↑' }).click();
await comprobar('4. el rótulo se sube con la flecha como una tarea', pagina.locator('#gsh-lista .gsh-texto').evaluateAll((l) => l.map((x) => x.value)), ['Recibir la petición', 'Pedir el certificado', 'Avisar y cerrar', 'Enviar la carta', 'Archivar']);
await pagina.locator('#gsh-lista .gsh-fila').nth(2).locator('button', { hasText: '↓' }).click();
await pagina.locator('#gsh-lista .gsh-fila').nth(0).locator('.gsh-texto').fill('Recibir la petición del interesado');
await comprobar('5. se baja con la flecha y se cambia el texto', pagina.locator('#gsh-lista .gsh-texto').evaluateAll((l) => l.map((x) => x.value)), ['Recibir la petición del interesado', 'Pedir el certificado', 'Enviar la carta', 'Avisar y cerrar', 'Archivar']);
await comprobar('6. el rótulo bajado queda entre las dos tareas últimas', pagina.locator('#gsh-lista .gsh-fila').evaluateAll((l) => l.map((f) => f.classList.contains('gsh-rotulo'))), [true, false, false, true, false]);
await guardarGuia();
await comprobar('7. la guía guarda rótulos y tareas en su orden', guia(), ['# Recibir la petición del interesado', 'Pedir el certificado', 'Enviar la carta', '# Avisar y cerrar', 'Archivar']);
await comprobar('8. «Ajustes › Guía» cuenta 3 tareas, no 5', pagina.evaluate((t) => AsuntoSinHitosGuia.vistaHTML(GuiasDelCentro.pasosDe(t)).indexOf('3 tareas') !== -1, TIPO), true);

console.log('--- el asunto ---');
await pagina.evaluate(async ([k, t]) => { await Hitos.cambiar((d) => { delete d.porAsunto[k]; return d; }); await Hitos.crearDesdeGuia(k, t); }, [NUEVO, TIPO]);
await abrirFicha(NUEVO);
await comprobar('9. el asunto enseña dos rótulos en banda y tres tareas', Promise.all([pagina.locator('#ficha-guia .ash-rotulo').allTextContents(), tareasPantalla()]), [['Recibir la petición del interesado', 'Avisar y cerrar'], ['Pedir el certificado', 'Enviar la carta', 'Archivar']]);
await comprobar('10. los rótulos van delante de su grupo, en orden', pagina.locator('#ficha-guia .ash-lista > div').evaluateAll((l) => l.map((x) => x.classList.contains('ash-rotulo') ? '#' : 't')), ['#', 't', 't', '#', 't']);
await comprobar('11. las tareas de debajo van metidas a la derecha y el rótulo no', pagina.evaluate(() => {
  const t = document.querySelector('#ficha-guia .ash-tarea').getBoundingClientRect().left, r = document.querySelector('#ficha-guia .ash-rotulo').getBoundingClientRect().left;
  return t > r + 8;
}), true);
await comprobar('12. el rótulo no tiene casilla ni ⋮', pagina.locator('#ficha-guia .ash-rotulo').evaluateAll((l) => l.map((x) => x.querySelectorAll('input, button').length)), [0, 0]);
await comprobar('13. el panel cuenta solo tareas: 0 de 3', pagina.locator('#ficha-guia .ash-cuenta').innerText(), '0 de 3 tareas hechas');
await comprobar('14. desde el asunto no se puede añadir un rótulo', pagina.evaluate(() => [document.querySelectorAll('#ficha-guia .ash-anadir button').length, /rótulo/i.test(document.querySelector('#ficha-guia .ash-anadir').textContent)]), [1, false]);
await comprobar('15. Inicio dice «Tarea 1 de 3»', (async () => {
  await pagina.evaluate(async () => { App.ir('abiertos'); InicioTabla.cambiar('adm'); await InicioTabla.pintar(); });
  await pagina.waitForTimeout(500);
  const f = pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + NUEVO + '"]');
  return (await f.count()) ? /Tarea 1 de 3/.test(await f.innerText()) : 'sin fila';
})(), true);

console.log('--- un trámite sin rótulos ---');
await pagina.evaluate(async (t) => { const p = GuiasDelCentro.pasosDe(t); p.filter((x) => x.listaDeTareas)[0].guion = p.filter((x) => x.listaDeTareas)[0].guion.filter((g) => !g.rotulo); await GuiasDelCentro.guardarPasos(t, p); }, TIPO);
await pagina.evaluate(async ([k, t]) => { await Hitos.cambiar((d) => { delete d.porAsunto[k]; return d; }); await Hitos.crearDesdeGuia(k, t); }, [NUEVO, TIPO]);
await abrirFicha(NUEVO);
await comprobar('16. sin rótulos no hay bandas y las tareas no se meten', pagina.evaluate(() => [document.querySelectorAll('#ficha-guia .ash-rotulo').length, document.querySelectorAll('#ficha-guia .bajo-rotulo').length]), [0, 0]);

console.log('--- lo de siempre ---');
await comprobar('17. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
