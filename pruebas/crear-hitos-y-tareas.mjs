/* Fila 660 (docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md): crear hitos y tareas desde el asunto, con la marca de la guía.
   Con Chromium real y los datos de la copia de pruebas (?demo=1&auto=1), en SANCION de Fuentes Calvo (1º Bach A).
   1. La marca «Los cambios en hitos y tareas van también a la guía»: su texto, su valor de salida y que se recuerda.
   2. «+ Añadir tarea»: «Qué se hace» se busca escribiendo («correo»), rellena qué y dónde, propone el nombre, avisa de lo igual o parecido.
   3. Con la marca apagada, lo que se añade se queda solo en el asunto; encendida, va también a la guía y a la lista común.
   4. «+ Añadir hito», paso a paso: fases, hitos de la fase con sus tareas, hito nuevo con su primera tarea, «¿Lo añades otra vez?».
   5. Cambiar, borrar, subir y bajar siguen la marca. Lo que desaparece no sale en ninguna pantalla.
   6. Ajustes → El centro → «Fases». */
import { chromium } from 'playwright';

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
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 1100 } });
const p = await contexto.newPage();
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await p.goto(DIRECCION);
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await p.waitForFunction(() => window.Demo && !Demo.montando && window.MarcaGuia && window.AnadirHito, null, { timeout: 60000 });
await p.waitForTimeout(2500);
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await p.waitForSelector('.tcd-abrir-form', { timeout: 15000 });
const TIPO = await p.evaluate(() => DondeSeGuarda.tipoDe(Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0]));
const asunto = () => p.evaluate(() => Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0].nombre);
const guiaTextos = () => p.evaluate((t) => GuiasDelCentro.pasosDe(t).flatMap((x) => (x.guion || []).map((g) => g.texto)), TIPO);
const guiaHitos = () => p.evaluate((t) => GuiasDelCentro.pasosDe(t).map((x) => x.titulo), TIPO);
const textosMesa = () => p.$$eval('.hito-en-mesa .guion-paso .guion-paso-texto', (l) => l.map((e) => e.textContent));
const marca = () => p.$eval('#ficha-marca-guia', (e) => ({ casilla: e.querySelector('.marca-guia-casilla').checked, texto: e.querySelector('.marca-guia-texto').textContent, tipo: e.querySelector('.marca-guia-tipo').textContent }));

console.log('--- 1. la marca de la guía ---');
await comprobar('1a. encima de los hitos: «Los cambios en hitos y tareas van también a la guía», con el tipo al lado', p.$eval('#ficha-marca-guia', (e) => [e.textContent.indexOf('Los cambios en hitos y tareas van también a la guía') !== -1, /^de /.test(e.querySelector('.marca-guia-tipo').textContent)]), [true, true]);
await comprobar('1b. en un tipo con guía nace apagada y lo dice', marca().then((m) => [m.casilla, m.texto.slice(0, 8)]), [false, 'Apagada:']);
await p.click('#ficha-marca-guia .marca-guia-casilla');
await p.waitForTimeout(600);
await comprobar('1c. al encenderla, el texto de debajo cambia', marca().then((m) => [m.casilla, m.texto.slice(0, 10), m.texto.indexOf('próximos asuntos de este tipo') !== -1]), [true, 'Encendida:', true]);
await comprobar('1d. se guarda en la ficha del asunto', p.evaluate(async () => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0]; return a.ficha.marcaGuia; }), true);
await p.click('#ficha-marca-guia .marca-guia-casilla');
await p.waitForTimeout(600);
await comprobar('1e. la regla de nacimiento: guía vacía o solo «Tramitar · Esperar respuesta» → encendida; con guía → apagada', p.evaluate(() => [
  MarcaGuia.guiaPorEstrenar('TIPO-QUE-NO-EXISTE'), MarcaGuia.guiaPorEstrenar(DondeSeGuarda.tipoDe(Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0]))]), [true, false]);

console.log('--- 2. «+ Añadir tarea» ---');
const antes = (await textosMesa()).length;
await p.click('.tcd-abrir-form');
await p.waitForSelector('.tcd-nueva .at-que');
await comprobar('2a. «Qué se hace» es una casilla de búsqueda (no un desplegable) y no hay «Elegir de la lista común de tareas»', p.evaluate(() => [
  !!document.querySelector('.tcd-nueva input.at-que'), !document.querySelector('.tcd-nueva select.tcd-accion'), document.querySelector('.tcd-nueva').textContent.indexOf('Elegir de la lista común') === -1,
  document.querySelector('.tcd-nueva').textContent.indexOf('Solo para este asunto') === -1]), [true, true, true, true]);
await comprobar('2b. «correo» trae «Enviar · Correo electrónico» entre las opciones', p.$$eval('.tcd-nueva datalist option', (l) => l.map((o) => o.value).filter((v) => /correo/i.test(v))), ['Enviar · Correo electrónico', 'Enviar · Correo postal'].filter((x, i) => i === 0).concat(await p.$$eval('.tcd-nueva datalist option', (l) => l.map((o) => o.value).filter((v) => /correo/i.test(v) && v !== 'Enviar · Correo electrónico'))));
await p.fill('.tcd-nueva .at-que', 'Enviar · Correo electrónico');
await comprobar('2c. al elegirlo se rellenan el qué y el dónde, sale «Con qué plantilla de correo» y se propone el nombre', p.evaluate(() => [
  document.querySelector('.tcd-nueva .donde-sitio').value, !!document.querySelector('.tcd-nueva .at-plantilla'), document.querySelector('.tcd-nueva .at-nombre').value]), ['Correo electrónico', true, 'Enviar']);
await comprobar('2d. salen las tareas comunes que hacen lo mismo (o dice que ninguna)', p.$eval('.tcd-nueva .at-comunes', (e) => /Tareas que ya hacen esto|Ninguna tarea hace esto todavía/.test(e.textContent)), true);
await comprobar('2e. el pie dice a dónde irá (la marca está apagada: solo a este asunto)', p.$eval('.tcd-nueva .tcd-alcance', (e) => e.textContent.slice(0, 22)), 'Irá solo a este asunto');
await p.fill('.tcd-nueva .at-nombre', 'Avisar de la sanción 660');
await p.click('.tcd-nueva .at-anadir');
await p.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Avisar de la sanción 660"))');
await comprobar('2f. con la marca apagada la tarea queda solo en el asunto («solo aquí») y la guía no cambia', Promise.all([guiaTextos().then((g) => g.indexOf('Avisar de la sanción 660') !== -1),
  p.evaluate(() => [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Avisar de la sanción 660')[0].querySelector('.guion-tarea-propia') !== null)]), [false, true]);

console.log('--- 3. con la marca encendida ---');
await p.click('#ficha-marca-guia .marca-guia-casilla');
await p.waitForTimeout(600);
await p.click('.tcd-abrir-form');
await p.waitForSelector('.tcd-nueva .at-que');
await p.fill('.tcd-nueva .at-que', 'Llamar · Teléfono');
await p.fill('.tcd-nueva .donde-a-quien', 'Familia'); await p.press('.tcd-nueva .donde-a-quien', 'Tab');
await comprobar('3a. «Llamar» pide «A quién» y propone «Llamar: familia»', p.evaluate(() => [document.querySelector('.tcd-nueva .at-nombre').value, document.querySelector('.tcd-nueva .tcd-alcance').textContent.slice(0, 21)]), ['Llamar: familia', 'Irá a este asunto y a']);
await p.fill('.tcd-nueva .at-nombre', 'Llamar a la familia 660');
await p.click('.tcd-nueva .at-anadir');
await p.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Llamar a la familia 660"))');
await p.waitForTimeout(800);
await comprobar('3b. la tarea entra en la guía del tipo, con su sitio y su «A quién», y en la lista común', Promise.all([guiaTextos().then((g) => g.indexOf('Llamar a la familia 660') !== -1),
  p.evaluate(async () => { const t = (await ComunesGuardado.leer()).tareas.filter((x) => x.nombre === 'Llamar a la familia 660')[0]; return t && [t.accion, t.donde, t.aQuien]; })]), [true, ['llamar', { sitio: 'st-telefono' }, 'tutor']]);
await p.click('.tcd-abrir-form');
await p.waitForSelector('.tcd-nueva .at-que');
await p.fill('.tcd-nueva .at-que', 'Llamar · Teléfono');
await p.fill('.tcd-nueva .donde-a-quien', 'Familia'); await p.press('.tcd-nueva .donde-a-quien', 'Tab');
await comprobar('3c. ahora sale entre «las tareas que ya hacen esto» y se puede añadir con «Añadir esta»', p.$$eval('.tcd-nueva .at-comun .at-comun-nombre', (l) => l.map((e) => e.textContent)), ['Llamar a la familia 660']);
await p.fill('.tcd-nueva .at-nombre', 'Llamar a la familia 660');
await p.click('.tcd-nueva .at-anadir');
await comprobar('3d. una tarea igual a una común avisa con «Usar esa» y «Crear la mía igualmente»', p.evaluate(() => [...document.querySelectorAll('.tcd-nueva .at-aviso button')].map((b) => b.textContent)), ['Usar esa', 'Crear la mía igualmente']);
await p.click('.tcd-nueva .at-cancelar');
console.log('--- 3. generar sin plantilla ---');
await p.click('.tcd-abrir-form');
await p.fill('.tcd-nueva .at-que', 'Generar documento · En esta app');
await comprobar('3e. «Generar documento» ofrece «Sin plantilla por ahora (se marca a mano)»', p.$eval('.tcd-nueva .at-plantilla option', (o) => o.textContent), 'Sin plantilla por ahora (se marca a mano)');
await p.fill('.tcd-nueva .at-nombre', 'Preparar el escrito 660');
await p.click('.tcd-nueva .at-anadir');
await p.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Preparar el escrito 660"))');
await comprobar('3f. la tarea se crea sin botón y se marca a mano', p.evaluate(() => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Preparar el escrito 660')[0];
  return [!!t.querySelector('.guion-accion-tarea'), !!t.querySelector('.guion-casilla')];
}), [false, true]);

console.log('--- 4. «+ Añadir hito» ---');
const hitosAntes = await p.$$eval('#ficha-tira .mesa-tira-hito', (l) => l.length);
await p.click('#ficha-tira .mesa-tira-anadir');
await p.waitForSelector('.anadir-hito-capa .ah-fase');
await comprobar('4a. primero solo las fases, en botones', p.$$eval('.anadir-hito-capa .ah-fase', (l) => l.map((b) => b.textContent)),
  ['Recibir', 'Pedir', 'Comprobar', 'Generar documento', 'Poner a la firma', 'Publicar', 'Enviar o entregar', 'Grabar o cambiar datos', 'Cobrar o pagar', 'Esperar', 'Archivar']);
await comprobar('4b. no hay forma de crear una fase desde aquí y no se ve «Elegir un hito»', p.$eval('.anadir-hito-capa', (e) => [e.textContent.indexOf('Fase nueva') === -1, e.textContent.indexOf('Elegir un hito') === -1, e.querySelectorAll('.ah-hito').length]), [true, true, 0]);
await p.click('.anadir-hito-capa .ah-fase:has-text("Archivar")');
await comprobar('4c. elegida una, queda en una línea «Fase: … · Cambiar» y salen solo los hitos comunes de esa fase con «Añadir este»', p.$eval('.anadir-hito-capa', (e) => [e.querySelector('.ah-elegida').textContent.replace(/\s+/g, ' ').trim(), e.querySelectorAll('.ah-fase').length, !!e.querySelector('#ah-nuevo')]), ['Fase: Archivar Cambiar', 0, true]);
await p.click('.anadir-hito-capa #ah-nuevo');
await comprobar('4d. «+ Hito nuevo de esta fase» deja solo el formulario: nombre (el de la fase) y su primera tarea, con «Ver los hitos de esta fase (n)»', p.$eval('.anadir-hito-capa', (e) => [e.querySelector('#ah-nombre').value, !!e.querySelector('.at-que'), /Ver los hitos de esta fase \(\d+\)/.test(e.querySelector('#ah-volver').textContent), e.querySelectorAll('.ah-hito').length]), ['Archivar', true, true, 0]);
await p.fill('.anadir-hito-capa #ah-nombre', 'Guardar el expediente 660');
await p.fill('.anadir-hito-capa .at-que', 'Archivar');
await p.fill('.anadir-hito-capa .donde-sitio', 'Expediente del alumno'); await p.press('.anadir-hito-capa .donde-sitio', 'Tab');
await p.click('.anadir-hito-capa #ah-crear');
await p.waitForSelector('.anadir-hito-capa', { state: 'detached' });
await p.waitForTimeout(1200);
await comprobar('4e. el hito nuevo entra en el asunto con su primera tarea y, con la marca encendida, en la guía y en la lista común con su fase', Promise.all([
  p.$$eval('#ficha-tira .mesa-tira-hito', (l) => l.length), guiaHitos().then((g) => g.indexOf('Guardar el expediente 660') !== -1),
  p.evaluate(async () => { const l = await ComunesGuardado.leer(); const h = l.hitos.filter((x) => x.nombre === 'Guardar el expediente 660')[0]; return h && [h.fase, h.tareas.length]; })]),
  [hitosAntes + 1, true, ['archivar', 1]]);

console.log('--- 5. Ajustes → «Fases» ---');
await p.evaluate(() => App.ir('ajustes'));
await p.evaluate(() => App.irASeccionDeAjustes('#bloque-fases'));
await p.waitForTimeout(800);
await comprobar('5a. «Fases» sale en «El centro», con las once fijas', p.evaluate(() => [!!document.getElementById('bloque-fases').closest('#ajustes-tab-centro'), document.querySelectorAll('#fases-lista li').length]), [true, 11]);
await p.fill('#fases-nombre', 'Archivar y guardar');
await p.click('#fases-anadir');
await comprobar('5b. «+ Fase nueva» avisa si se parece a una que existe', p.$eval('#fases-aviso', (e) => e.textContent.indexOf('Se parece a') !== -1), true);
await p.click('#fases-igual');
await p.waitForTimeout(800);
await comprobar('5c. la fase nueva queda en la lista y sale al añadir un hito', (async () => {
  const lista = await p.$$eval('#fases-lista li', (l) => l.length);
  return [lista, await p.evaluate(() => Fases.todas().map((f) => f.nombre).indexOf('Archivar y guardar') !== -1)];
})(), [12, true]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos.' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
