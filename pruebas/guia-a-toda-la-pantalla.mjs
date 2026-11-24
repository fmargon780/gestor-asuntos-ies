/* Prueba de la fila 737 de docs/COLA.md (docs/737-GUIA-A-TODA-LA-PANTALLA.md): el editor de la guía de un tipo «sin hitos» ocupa toda
   la pantalla: la guía de un vistazo a la izquierda (Intro, borrar, «+», arrastrar), la tarea elegida a la derecha (con el recorrido
   del papel), «Ver la guía para:» y Guardar/Cancelar arriba. Con Chromium real y el tipo «IPASEN ALUMNADO» de la copia de pruebas
   (?demo=1&auto=1, js/demo/datos-guia-sin-hitos.js). */
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.GuiasDelCentro && GuiasDelCentro.pasosDe('IPASEN ALUMNADO').length, null, { timeout: 30000 });   /* la copia de pruebas acaba de montarse */

const TIPO = 'IPASEN ALUMNADO';
const textos = () => pagina.locator('#gsh-lista .gsh-texto').evaluateAll((l) => l.map((x) => x.value));
const guardada = () => pagina.evaluate((t) => GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0].guion.map((g) => (g.rotulo ? '# ' : '') + g.texto), TIPO);
const abrir = async () => { pagina.evaluate((t) => GuiasDelCentro.escribir(t, {}), TIPO); await pagina.waitForSelector('#capa:not(.oculto) #gsh-lista .gsh-fila'); };
const fila = (n) => pagina.locator('#gsh-lista .gsh-fila').nth(n);
const guardar = async () => { await pagina.click('#gsh-guardar'); await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto')); await pagina.waitForTimeout(400); };

console.log('--- a toda la pantalla ---');
await comprobar('0. la copia de pruebas lleva el tipo «sin hitos», con tareas con «Solo si»', pagina.evaluate((t) => [AsuntoSinHitos.tipoSinHitos(t), GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0].guion.filter((g) => g.soloSi).length], TIPO), [true, 2]);
await abrir();
await comprobar('1. ocupa toda la ventana, con «Cancelar» y «Guardar» arriba', pagina.evaluate(() => {
  const c = document.querySelector('#capa .cuadro'), r = c.getBoundingClientRect();
  const arriba = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return b.width > 0 && b.top < r.top + 90; };
  return [r.width >= innerWidth - 60, r.height >= innerHeight - 60, arriba('gsh-cancelar'), arriba('gsh-guardar'), getComputedStyle(document.getElementById('cuadro-aceptar').parentElement).display];
}), [true, true, true, true, 'none']);
await comprobar('1. el título es «Guía de <tipo>»', pagina.locator('.gsh-cab-titulo').innerText(), 'Guía de ' + TIPO);
await comprobar('2. una línea por tarea con su frase entera', textos(), ['Comprobar quién la pide', 'Guardar la solicitud firmada', 'Guardar aquí la credencial', 'Entregar la credencial en mano', 'Enviar la credencial']);
await comprobar('2. las marcas: papel, «Solo si» y «Cómo se hace»', pagina.locator('#gsh-lista .gsh-fila').evaluateAll((l) => l.map((f) => Array.from(f.querySelectorAll('.gsh-marca')).map((m) => m.textContent))), [
  ['Cómo se hace'], ['📄 SOLICITUD DE CREDENCIAL'], ['📄 CREDENCIAL IPASEN', 'Cómo se hace'], ['📄 JUSTIFICANTE DE ENTREGA', 'Solo si Cómo la quiere: En persona', 'Cómo se hace'], ['Solo si Cómo la quiere: Por correo o Por iPasen', 'Cómo se hace']]);
await comprobar('2. sin botones ↑ ↓ ni «Quitar» en cada línea', pagina.locator('#gsh-lista button:not(.gsh-meter)').count(), 0);

console.log('--- escribir como en una lista ---');
await fila(4).locator('.gsh-texto').click();
await pagina.keyboard.press('Enter');
await pagina.keyboard.type('Archivar la copia');
await comprobar('3. Intro crea una tarea justo debajo, con el cursor en ella', Promise.all([textos(), pagina.evaluate(() => document.activeElement.value)]), [['Comprobar quién la pide', 'Guardar la solicitud firmada', 'Guardar aquí la credencial', 'Entregar la credencial en mano', 'Enviar la credencial', 'Archivar la copia'], 'Archivar la copia']);
await pagina.keyboard.press('Enter');
await pagina.keyboard.press('Backspace');
await comprobar('3. borrar en una frase vacía quita la línea y el cursor sube a la de arriba', Promise.all([textos().then((l) => l.length), pagina.evaluate(() => document.activeElement.value)]), [6, 'Archivar la copia']);
await fila(1).hover();
await fila(1).locator('.gsh-meter').click();
await comprobar('3. el «+» del borde mete una tarea debajo, con el cursor en ella', Promise.all([textos().then((l) => l.slice(0, 4)), pagina.evaluate(() => document.activeElement.value)]), [['Comprobar quién la pide', 'Guardar la solicitud firmada', '', 'Guardar aquí la credencial'], '']);
await pagina.keyboard.press('Backspace');
await comprobar('3. (se quita la vacía)', textos().then((l) => l.length), 6);

console.log('--- arrastrar ---');
await fila(5).locator('.gsh-asa').dragTo(fila(0), { targetPosition: { x: 60, y: 3 } });   /* en la mitad de arriba: cae antes */
await comprobar('4. arrastrar la línea por su asa la cambia de sitio y los números se rehacen', Promise.all([textos().then((l) => l.slice(0, 2)), pagina.locator('#gsh-lista .gsh-num').allTextContents()]), [['Archivar la copia', 'Comprobar quién la pide'], ['1', '2', '3', '4', '5', '6']]);
await fila(0).locator('.gsh-asa').dragTo(fila(5), { targetPosition: { x: 60, y: 30 } });   /* en la mitad de abajo: cae después */
await comprobar('4. (y vuelve)', textos().then((l) => l.slice(-2)), ['Enviar la credencial', 'Archivar la copia']);

console.log('--- la tarea elegida, a la derecha ---');
await fila(2).click();
await comprobar('5. la línea queda marcada y se ve a la derecha: frase, papel, cuándo y cómo', pagina.evaluate(() => [
  document.querySelector('#gsh-lista .gsh-fila.elegida .gsh-texto').value, document.getElementById('gsh-d-frase').value,
  document.querySelector('#gsh-der .gsh-papel').value, !!document.querySelector('#gsh-der .cuando-campo'), document.getElementById('gsh-d-como').tagName]),
  ['Guardar aquí la credencial', 'Guardar aquí la credencial', 'CREDENCIAL IPASEN', true, 'TEXTAREA']);
await pagina.fill('#gsh-d-frase', 'Guardar la credencial aquí');
await comprobar('5. lo escrito a la derecha sale al momento a la izquierda', fila(2).locator('.gsh-texto').inputValue(), 'Guardar la credencial aquí');
await fila(2).locator('.gsh-texto').fill('Guardar aquí la credencial');
await comprobar('5. y lo escrito a la izquierda, a la derecha', pagina.locator('#gsh-d-frase').inputValue(), 'Guardar aquí la credencial');
await pagina.click('#gsh-bajar');
await comprobar('5. «↓ Bajar» y «↑ Subir» mueven la tarea', textos().then((l) => l.slice(2, 4)), ['Entregar la credencial en mano', 'Guardar aquí la credencial']);
await pagina.click('#gsh-subir');
await comprobar('5. («↑ Subir» la devuelve)', textos().then((l) => l.slice(2, 4)), ['Guardar aquí la credencial', 'Entregar la credencial en mano']);
await comprobar('5. «Quitar esta tarea» sale abajo', pagina.locator('#gsh-quitar').innerText(), 'Quitar esta tarea');

console.log('--- el recorrido del papel ---');
await comprobar('6. con papel con recorrido: «Así saldrá en la tarea» y su resumen', pagina.locator('#gsh-recorrido').innerText(), 'Así saldrá en la tarea: Generado › Enviado\nNadie firma · no se registra · a Interesado por iPasen'.replace('Nadie firma', 'Sin firma'));
await pagina.selectOption('#gsh-der .gsh-papel', 'JUSTIFICANTE DE ENTREGA');
await comprobar('6. un papel sin recorrido avisa y dice dónde se pone', pagina.locator('#gsh-recorrido').innerText(), 'Este tipo de documento todavía no tiene recorrido.\nSe pone en Ajustes › El centro › Tipos de documento › «Recorrido».');
await pagina.selectOption('#gsh-der .gsh-papel', 'SOLICITUD DE CREDENCIAL');
await comprobar('6. cambia al elegir otro papel', pagina.locator('#gsh-recorrido').innerText(), 'Así saldrá en la tarea: Recibido › Registrado de entrada\nNos llega · se registra de entrada');
await pagina.selectOption('#gsh-der .gsh-papel', '');
await comprobar('6. sin papel no sale nada', pagina.locator('#gsh-recorrido').innerHTML(), '');
await pagina.selectOption('#gsh-der .gsh-papel', 'CREDENCIAL IPASEN');

console.log('--- «Ver la guía para» ---');
await comprobar('7. sale con un desplegable por dato, con «Todos los casos» y sus valores', pagina.evaluate(() => Array.from(document.querySelectorAll('#gsh-ver select')).map((s) => [s.dataset.campo, Array.from(s.options).map((o) => o.textContent)])), [['Cómo la quiere', ['Todos los casos', 'En persona', 'Por correo', 'Por iPasen']]]);
const tachadas = () => pagina.locator('#gsh-lista .gsh-fila').evaluateAll((l) => l.map((f) => f.classList.contains('no-sale')));
await pagina.selectOption('#gsh-ver select', 'En persona');
await comprobar('7. «En persona»: la de enviar sale en gris y tachada, sin desaparecer', Promise.all([tachadas(), textos().then((l) => l.length)]), [[false, false, false, false, true, false], 6]);
await pagina.selectOption('#gsh-ver select', 'Por iPasen');
await comprobar('7. «Por iPasen»: la de entregar en mano', tachadas(), [false, false, false, true, false, false]);
await pagina.selectOption('#gsh-ver select', '');
await comprobar('7. «Todos los casos»: la lista queda normal', tachadas(), [false, false, false, false, false, false]);
await comprobar('7. elegir un caso no se guarda: las frases siguen', textos(), ['Comprobar quién la pide', 'Guardar la solicitud firmada', 'Guardar aquí la credencial', 'Entregar la credencial en mano', 'Enviar la credencial', 'Archivar la copia']);
await fila(3).click();
await pagina.selectOption('#gsh-der .cuando-campo', '');
await fila(4).click();
await pagina.selectOption('#gsh-der .cuando-campo', '');
await comprobar('7. si ninguna tarea tiene «Solo si», la línea no sale', pagina.locator('#gsh-ver').evaluate((x) => [x.classList.contains('oculto'), x.innerHTML]), [true, '']);
await pagina.click('#gsh-cancelar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await comprobar('8. «Cancelar» no guarda nada', guardada(), ['Comprobar quién la pide', 'Guardar la solicitud firmada', 'Guardar aquí la credencial', 'Entregar la credencial en mano', 'Enviar la credencial']);

console.log('--- guardar ---');
await abrir();
await fila(0).locator('.gsh-texto').fill('Comprobar quién la pide hoy');
await fila(2).click();
await pagina.fill('#gsh-d-como', 'Otro texto');
await fila(4).click();
await pagina.click('#gsh-quitar');
await pagina.click('#gsh-anadir-rotulo');
await pagina.locator('#gsh-lista .gsh-texto').last().fill('Al terminar');
await pagina.click('#gsh-anadir');
await pagina.locator('#gsh-lista .gsh-texto').last().fill('Enviar o entregar');
await pagina.locator('#gsh-lista .gsh-fila').last().click();
await pagina.selectOption('#gsh-der .cuando-campo', 'Cómo la quiere');
await pagina.locator('#gsh-der .cuando-valor[value="Por correo"]').check();
await guardar();
await comprobar('9. «Guardar» guarda el orden, los rótulos y las frases', guardada(), ['Comprobar quién la pide hoy', 'Guardar la solicitud firmada', 'Guardar aquí la credencial', 'Entregar la credencial en mano', '# Al terminar', 'Enviar o entregar']);
await comprobar('9. y el papel, «Cómo se hace» y «Solo si» de cada tarea', pagina.evaluate((t) => GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0].guion.map((g) => [g.papel || '', g.comoSeHace || '', g.soloSi ? g.soloSi.campo + ':' + g.soloSi.valores.join('/') : '']), TIPO).then((l) => l.map((x) => [x[0], x[1].slice(0, 10), x[2]])), [
  ['', 'En persona', ''], ['SOLICITUD DE CREDENCIAL', '', ''], ['CREDENCIAL IPASEN', 'Otro texto', ''], ['JUSTIFICANTE DE ENTREGA', 'Imprímela ', 'Cómo la quiere:En persona'], ['', '', ''], ['', '', 'Cómo la quiere:Por correo']]);
await abrir();
await comprobar('9. al volver a abrir, todo sigue', Promise.all([textos(), pagina.locator('#gsh-lista .gsh-fila').evaluateAll((l) => l.map((f) => f.classList.contains('gsh-rotulo')))]), [['Comprobar quién la pide hoy', 'Guardar la solicitud firmada', 'Guardar aquí la credencial', 'Entregar la credencial en mano', 'Al terminar', 'Enviar o entregar'], [false, false, false, false, true, false]]);
await pagina.click('#gsh-cancelar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

console.log('--- lo demás sigue igual ---');
await pagina.evaluate(async (t) => { App.E.tipos.filter((x) => x.tipo === t)[0].sinHitos = false; await App.guardarTipos(); }, TIPO);
pagina.evaluate((t) => GuiasDelCentro.escribir(t), TIPO);
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-cuerpo .guia-dos-col');
await comprobar('10. un tipo con hitos se edita con el editor de siempre', pagina.evaluate(() => [!!document.getElementById('gsh-lista'), !!document.getElementById('guia-anadir'), document.querySelector('#capa .cuadro').classList.contains('cuadro-gsh'), getComputedStyle(document.querySelector('#capa .cuadro-botones')).display]), [false, true, false, 'flex']);
await pagina.click('#cuadro-cancelar');
await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
