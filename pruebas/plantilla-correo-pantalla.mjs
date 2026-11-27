/* Prueba de la fila 771 de docs/COLA.md (docs/758-CORREOS-MAS-COMODOS.md, parte 1): la plantilla de correo, como un correo nuevo.
   La ventana «Nueva plantilla» / «Cambiar plantilla» ocupa toda la pantalla (Cancelar y Crear arriba; Categoría, Tipo y Nombre en una
   línea; el correo en su orden a la izquierda; «Así le llega» a la derecha, que cambia mientras se escribe) y lo mismo el editor en
   línea del cuadro de Correo. Con Chromium real y la copia de pruebas (?demo=1&auto=1), plantilla «Aviso de recogida de libros»
   (js/demo/datos-tipos.js). Si se pone `CAPTURAS`, deja ahí dos capturas de la ventana. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 } });
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.Plantillas && Plantillas.enMemoria() && (Plantillas.enMemoria().lista || []).some((p) => p.id === 'pl-demo-libros'), null, { timeout: 40000 });

const abrir = async (id) => {
  await pagina.evaluate((i) => {
    const p = i ? Plantillas.enMemoria().lista.find((x) => x.id === i) : null;
    PlantillasAjustes.abrirCuadroDePlantilla(p, p ? null : { tipo: 'MATRICULA', categoria: 'ALUMNADO' }, () => {});
  }, id);
  await pagina.waitForSelector('#capa:not(.oculto) #pl-llega');
  await pagina.waitForFunction(() => document.getElementById('pl-previa').textContent !== '');
};
const llega = () => pagina.evaluate(() => ({
  asunto: document.getElementById('pl-llega-asunto').textContent, saludo: document.getElementById('pl-llega-saludo').textContent,
  texto: document.getElementById('pl-previa').textContent, firma: document.getElementById('pl-llega-firma').textContent }));
const cerrar = async () => { await pagina.click('#cuadro-cancelar'); await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto')); };

console.log('--- la ventana a toda la pantalla ---');
await abrir('pl-demo-libros');
await comprobar('1. ocupa toda la ventana, con «Cancelar» y «Guardar» arriba y sin el pie de siempre', pagina.evaluate(() => {
  const c = document.querySelector('#capa .cuadro'), r = c.getBoundingClientRect();
  const arriba = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return b.width > 0 && b.top < r.top + 90; };
  return [r.width >= innerWidth - 60, r.height >= innerHeight - 60, arriba('cuadro-cancelar'), arriba('cuadro-aceptar'),
    document.getElementById('cuadro-aceptar').textContent];
}), [true, true, true, true, 'Guardar']);
await comprobar('2. Categoría, Tipo y Nombre, en una línea', pagina.evaluate(() => {
  const t = (id) => Math.round(document.getElementById(id).getBoundingClientRect().bottom);
  return [Math.abs(t('pl-categoria') - t('pl-tipo')) <= 3, Math.abs(t('pl-tipo') - t('pl-nombre')) <= 3];
}), [true, true]);
await comprobar('3. a la izquierda el correo en su orden: Para, Copia, Copia oculta, Asunto, Saludo, Texto, Firma, y debajo Séneca', pagina.evaluate(() => {
  const ids = ['pl-para', 'pl-copia', 'pl-oculta', 'pl-asunto', 'pl-saludo', 'pl-texto', 'pl-firma'];
  const y = ids.map((i) => document.getElementById(i).getBoundingClientRect().top);
  const seneca = document.querySelector('.pl-seneca').getBoundingClientRect().top;
  return [y.every((v, i) => i === 0 || v > y[i - 1]), seneca > y[6], document.querySelector('.pl-seneca').open];
}), [true, true, false]);
await comprobar('3. no queda la «Vista previa» de abajo', pagina.evaluate(() => /Vista previa/.test(document.getElementById('cuadro-cuerpo').innerText)), false);
await comprobar('4. «Así le llega» está a la derecha del correo', pagina.evaluate(() => {
  const d = document.querySelector('.pcp-der').getBoundingClientRect(), i = document.querySelector('.pcp-izq').getBoundingClientRect();
  return [d.left >= i.right - 1, document.querySelector('.pcp-llega-titulo').textContent];
}), [true, 'Así le llega']);
const antes = await llega();
await comprobar('4. enseña el correo entero: asunto, saludo, texto y firma, con los datos rellenos y sin llaves', Promise.resolve(antes).then((l) => [
  l.asunto.indexOf('Recogida de libros de ') === 0 && !/[{}]/.test(l.asunto), l.saludo, l.texto.indexOf('Les informamos de que ') === 0 && !/[{}]/.test(l.texto),
  /^Un cordial saludo\.\n/.test(l.firma) && !/[{}]/.test(l.firma)]), [true, 'Estimadas familias:', true, true]);
await comprobar('5. «Así sale» del Asunto y «Así le llega» usan el mismo asunto', pagina.evaluate(() => document.querySelector('#pl-asunto-sale .ae-resultado').textContent === document.getElementById('pl-llega-asunto').textContent), true);

console.log('--- se actualiza mientras se escribe ---');
await pagina.fill('#pl-saludo', 'Buenos días, familia de {nombre}:');
await pagina.fill('#pl-firma', 'Secretaría de {centro}');
await pagina.fill('#pl-asunto', 'Libros · {nombre}');
await pagina.fill('#pl-texto', 'Pasen por secretaría.\n\nHasta pronto.');
await comprobar('6. escribir en Saludo, Firma, Asunto y Texto lo cambia a la derecha', llega().then((l) => [l.saludo.indexOf('Buenos días, familia de ') === 0 && !/[{}]/.test(l.saludo), /^Secretaría de \S/.test(l.firma),
  /^Libros · \S/.test(l.asunto), l.texto]), [true, true, true, 'Pasen por secretaría.\n\nHasta pronto.']);
await comprobar('6. «Así sale» sigue igual que «Así le llega»', pagina.evaluate(() => document.querySelector('#pl-asunto-sale .ae-resultado').textContent === document.getElementById('pl-llega-asunto').textContent), true);
await pagina.fill('#pl-saludo', '');
await pagina.fill('#pl-firma', '');
await comprobar('7. con el saludo y la firma vacíos salen los de siempre', llega().then((l) => [/^Estimados tutores legales de \S.*:$/.test(l.saludo), /^Un saludo\./.test(l.firma)]), [true, true]);
await pagina.fill('#pl-texto', 'Hola {nombre}');
await pagina.evaluate(() => { const t = document.getElementById('pl-texto'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('.hb-buscador input, .huecos-buscador input, [class*="buscador"] input', { timeout: 5000 }).catch(() => {});
await pagina.keyboard.type('grupo');
await pagina.keyboard.press('Enter');
await comprobar('7. un campo variable insertado se rellena a la derecha', llega().then((l) => l.texto.indexOf('Hola ') === 0 && !/[{}]/.test(l.texto) && l.texto.length > 6), true);

console.log('--- el Texto crece con lo escrito ---');
const alturaDeAntes = await pagina.evaluate(() => document.getElementById('pl-texto').getBoundingClientRect().height);
await pagina.fill('#pl-texto', Array.from({ length: 60 }, (_, i) => 'Línea de prueba número ' + (i + 1)).join('\n'));
await comprobar('8. el Texto crece y no tiene barra de desplazamiento propia', pagina.evaluate((h0) => {
  const t = document.getElementById('pl-texto');
  return [t.getBoundingClientRect().height > h0 + 400, t.scrollHeight <= t.clientHeight + 4, getComputedStyle(t).overflowY];
}, alturaDeAntes), [true, true, 'hidden']);
await comprobar('8. los botones siguen a la vista y la columna izquierda se desplaza sola', pagina.evaluate(() => {
  const b = document.getElementById('cuadro-aceptar').getBoundingClientRect(), i = document.querySelector('.pcp-izq');
  return [b.top >= 0 && b.bottom <= innerHeight, i.scrollHeight > i.clientHeight, document.querySelector('#capa .cuadro').scrollHeight <= document.querySelector('#capa .cuadro').clientHeight + 2];
}), [true, true, true]);
if (process.env.CAPTURAS) { await pagina.fill('#pl-texto', 'Les informamos de que su hijo puede recoger los libros en secretaría.\n\nUn saludo.'); await pagina.screenshot({ path: process.env.CAPTURAS + '/771-ajustes.png' }); }

console.log('--- el tipo elegido cambia el asunto de ejemplo, en los dos sitios ---');
await pagina.fill('#pl-asunto', '');
const tipos = await pagina.locator('#pl-tipo option').evaluateAll((o) => o.map((x) => x.value));
const otro = tipos.find((t) => t !== 'MATRICULA') || tipos[0];
const asuntoDeMatricula = (await llega()).asunto;
await pagina.selectOption('#pl-tipo', otro);
await comprobar('9. al cambiar de tipo cambian los dos, y siguen iguales', pagina.evaluate(() => [document.querySelector('#pl-asunto-sale .ae-resultado').textContent === document.getElementById('pl-llega-asunto').textContent]), [true]);
await comprobar('9. y el asunto lleva el tipo elegido, no otro', llega().then((l) => [l.asunto.indexOf(otro) !== -1, l.asunto !== asuntoDeMatricula]), [true, true]);
await cerrar();

console.log('--- crear y volver a abrir ---');
await abrir('');
await comprobar('10. una plantilla nueva se abre con el título «Nueva plantilla» y el botón «Crear»', pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('cuadro-aceptar').textContent]), ['Nueva plantilla', 'Crear']);
await pagina.fill('#pl-nombre', 'Prueba de la pantalla grande');
await pagina.fill('#pl-asunto', 'Mi asunto de {nombre}');
await pagina.fill('#pl-saludo', 'Hola:');
await pagina.fill('#pl-texto', 'Primera línea.\n\nSegunda línea.');
await pagina.fill('#pl-firma', 'Firmado');
await pagina.click('.pl-seneca summary');
await pagina.fill('#pl-texto-seneca', 'Texto de Séneca');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForFunction(() => Plantillas.enMemoria().lista.some((p) => p.nombre === 'Prueba de la pantalla grande'));
await comprobar('10. lo escrito se guarda', pagina.evaluate(() => {
  const p = Plantillas.enMemoria().lista.find((x) => x.nombre === 'Prueba de la pantalla grande');
  return [p.tipo, p.categoria, p.asunto, p.saludo, p.texto, p.firma, p.textoSeneca];
}), ['MATRICULA', 'ALUMNADO', 'Mi asunto de {nombre}', 'Hola:', 'Primera línea.\n\nSegunda línea.', 'Firmado', 'Texto de Séneca']);
const id = await pagina.evaluate(() => Plantillas.enMemoria().lista.find((x) => x.nombre === 'Prueba de la pantalla grande').id);
await abrir(id);
await comprobar('10. al volver a abrirla, todo sigue y el título es «Cambiar plantilla»', pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent,
  document.getElementById('pl-nombre').value, document.getElementById('pl-asunto').value, document.getElementById('pl-saludo').value,
  document.getElementById('pl-texto').value, document.getElementById('pl-firma').value, document.getElementById('pl-texto-seneca').value]),
['Cambiar plantilla', 'Prueba de la pantalla grande', 'Mi asunto de {nombre}', 'Hola:', 'Primera línea.\n\nSegunda línea.', 'Firmado', 'Texto de Séneca']);
await pagina.fill('#pl-nombre', 'Prueba de la pantalla grande (cambiada)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForFunction(() => Plantillas.enMemoria().lista.some((p) => p.nombre === 'Prueba de la pantalla grande (cambiada)'));
await comprobar('10. cambiar una que ya existía guarda igual que antes (misma plantilla, mismo texto)', pagina.evaluate((i) => {
  const l = Plantillas.enMemoria().lista.filter((x) => /Prueba de la pantalla grande/.test(x.nombre));
  return [l.length, l[0].id === i, l[0].texto, l[0].saludo];
}, id), [1, true, 'Primera línea.\n\nSegunda línea.', 'Hola:']);
await comprobar('10. «Cancelar» no guarda nada', (async () => {
  await abrir(id); await pagina.fill('#pl-nombre', 'No tiene que guardarse'); await cerrar();
  return pagina.evaluate(() => Plantillas.enMemoria().lista.some((x) => x.nombre === 'No tiene que guardarse'));
})(), false);
await comprobar('10. la plantilla con papeles conserva a quién va', (async () => {
  await abrir('pl-demo-libros');
  const antesDe = await pagina.evaluate(() => [Array.from(document.querySelectorAll('#pl-para .cdest-pastilla')).length, Array.from(document.querySelectorAll('#pl-copia .cdest-pastilla')).length]);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
  await pagina.waitForTimeout(500);
  const despues = await pagina.evaluate(() => { const p = Plantillas.enMemoria().lista.find((x) => x.id === 'pl-demo-libros'); return [p.para, p.copia]; });
  return [antesDe, despues];
})(), [[1, 1], [['legales'], ['tutor']]]);

console.log('--- el editor en línea del cuadro de Correo ---');
const montar = () => pagina.evaluate(async () => {
  const a = (App.E.listaAbiertos || []).find((x) => ((x.leido && x.leido.tipo) || (x.ficha && x.ficha.tipo)) === 'MATRICULA');
  if (!a) return false;
  const cont = document.createElement('div');
  cont.id = 'editor-de-prueba';
  document.body.appendChild(cont);
  window.__guardada = null; window.__cancelada = false;
  PlantillasAjustes.montarEditorEnLinea(cont, a, null, (g) => { window.__guardada = g; }, () => { window.__cancelada = true; });
  return true;
});
await comprobar('11. hay un asunto de MATRICULA para probar', montar(), true);
await pagina.waitForFunction(() => document.getElementById('pl2-previa').textContent !== '');
await comprobar('11. el editor en línea ocupa toda la pantalla, con Guardar y Cancelar arriba', pagina.evaluate(() => {
  const r = document.getElementById('editor-de-prueba').getBoundingClientRect();
  const arriba = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return b.width > 0 && b.top < 130; };
  return [r.width >= innerWidth - 4, r.height >= innerHeight - 60, arriba('pl2-guardar'), arriba('pl2-cancelar')];
}), [true, true, true, true]);
await comprobar('11. con el mismo orden y «Así le llega» a la derecha', pagina.evaluate(() => {
  const ids = ['pl2-para', 'pl2-copia', 'pl2-oculta', 'pl2-asunto', 'pl2-saludo', 'pl2-texto', 'pl2-firma'];
  const y = ids.map((i) => document.getElementById(i).getBoundingClientRect().top);
  return [y.every((v, i) => i === 0 || v > y[i - 1]), document.querySelector('#editor-de-prueba .pcp-der').getBoundingClientRect().left > document.getElementById('pl2-texto').getBoundingClientRect().right - 1];
}), [true, true]);
await pagina.fill('#pl2-nombre', 'Desde el cuadro');
await pagina.fill('#pl2-saludo', 'Hola desde el cuadro:');
await pagina.fill('#pl2-texto', 'Texto del editor en línea para {nombre}');
await comprobar('12. escribir cambia «Así le llega» con los datos del asunto en el que se está', pagina.waitForFunction(() => document.getElementById('pl2-llega-saludo').textContent === 'Hola desde el cuadro:' && /^Texto del editor en línea para \S/.test(document.getElementById('pl2-previa').textContent)).then(() => true), true);
await pagina.waitForFunction(() => document.querySelector('#pl2-asunto-sale .ae-resultado').textContent === document.getElementById('pl2-llega-asunto').textContent);
await comprobar('12. «Así sale» y «Así le llega» llevan el mismo asunto', pagina.evaluate(() => {
  const llega = document.getElementById('pl2-llega-asunto').textContent;
  return [llega.length > 0, document.querySelector('#pl2-asunto-sale .ae-resultado').textContent === llega];
}), [true, true]);
if (process.env.CAPTURAS) await pagina.screenshot({ path: process.env.CAPTURAS + '/771-en-linea.png' });
await pagina.click('#pl2-guardar');
await pagina.waitForFunction(() => window.__guardada);
await comprobar('13. «Guardar» del editor en línea guarda la plantilla del tipo del asunto', pagina.evaluate(() => {
  const p = Plantillas.enMemoria().lista.find((x) => x.nombre === 'Desde el cuadro');
  return [!!p, p && p.tipo, p && p.saludo, p && p.texto];
}), [true, 'MATRICULA', 'Hola desde el cuadro:', 'Texto del editor en línea para {nombre}']);

await comprobar('14. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
