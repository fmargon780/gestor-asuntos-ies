/* Prueba con navegador de la fila 280 de docs/COLA.md (docs/CONVERTIR-EN-PLANTILLA.md): la pantalla
   «Convertir en plantilla», con Chromium real y los datos inventados de la copia de pruebas
   (?demo=1&auto=1): la entrada del menú ⋮ (y cuándo está apagada), los cambios propuestos, marcar y
   desmarcar, lo marcado a mano, el paso de comparar, guardar (la plantilla, el hito de la guía, el
   original intacto), generar con ella en otro asunto, el nombre repetido y el cuadro de sustituir,
   el PDF con su Word, y salir sin guardar. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1600, height: 1000 } });
const pagina = await contexto.newPage();
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await pagina.waitForTimeout(3000);
await pagina.evaluate(() => { window.__avisos = []; const o = U.aviso; U.aviso = function (m, t) { window.__avisos.push(String(m) + '|' + t); return o.apply(this, arguments); }; });
const avisos = () => pagina.evaluate(() => window.__avisos.slice());

async function abrirFicha(texto) {
  await pagina.click('.pestana[data-pantalla="abiertos"]');
  await pagina.locator('#inicio-tabla-cuerpo .nombre-pulsable', { hasText: texto }).first().click();
  await pagina.waitForSelector('#ficha-documentos', { state: 'attached' });
  const tarjeta = pagina.locator('.ficha-tarjeta', { hasText: 'Documentos de la carpeta' }).first();
  if (!(await tarjeta.evaluate((t) => t.classList.contains('abierta')))) await tarjeta.click();
  await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');
  await pagina.waitForTimeout(800);
}
const filaDe = (texto) => pagina.locator('#ficha-documentos .ficha-documento-fila', { hasText: texto }).first();
async function menuDe(texto) {
  const fila = filaDe(texto);
  await fila.locator('.fila-menu-btn').click();
  return fila.locator('.fila-menu button', { hasText: 'Convertir en plantilla' });
}
const lineas = () => pagina.locator('.cep-linea').allTextContents();
const textoDoc = () => pagina.locator('.cep-doc .cep-hoja-interior').innerText();
async function seleccionar(frase) {
  await pagina.evaluate((f) => {
    const w = document.createTreeWalker(document.querySelector('.cep-doc .cep-hoja-interior'), NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const i = n.nodeValue.indexOf(f);
      if (i !== -1) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + f.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); break; }
    }
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }, frase);
  await pagina.waitForTimeout(400);
}

console.log('--- 1. la entrada del menú ---');
await abrirFicha('Espejo');
const entradaWord = await menuDe('CERTIFICADO D26');
await comprobar('1. en el Word hay «Convertir en plantilla» y está encendida', entradaWord.isDisabled(), false);
await pagina.keyboard.press('Escape');
const entradaPdf = await menuDe('Fuente Lucena');
await comprobar('1. en un PDF sin su Word está apagada, con el motivo', [await entradaPdf.isDisabled(), await entradaPdf.getAttribute('title')], [true, 'No encuentro el Word de este PDF.']);
await pagina.keyboard.press('Escape');

console.log('--- 2. la pantalla y lo que propone ---');
await (await menuDe('CERTIFICADO D26')).click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 20000 });
await pagina.waitForTimeout(2500);
await comprobar('2. título y nombre del documento', pagina.locator('.cep-titulo').textContent(), 'Convertir en plantilla');
await comprobar('2. la página entera no se desplaza', pagina.evaluate(() => [getComputedStyle(document.body).overflow, document.getElementById('convertir-plantilla').getBoundingClientRect().bottom <= window.innerHeight + 1]), ['hidden', true]);
const l1 = await lineas();
await comprobar('2. datos: el nombre, el número y el lugar y la fecha', [/Carla Espejo Montes/.test(l1[0]), /2100006/.test(l1[1]), /Localidad de pruebas, a \d+ de \w+ de \d{4}/.test(l1[2])], [true, true, true]);
await comprobar('2. quien firma: Fernando Reyes Palma, 2 veces', /Fernando Reyes Palma.*2 veces/.test(l1[3]), true);
await comprobar('2. «la alumna» pasa a «el/la alumno/a»', l1.some((l) => /la alumna → el\/la alumno\/a/.test(l)), true);
await comprobar('2. el membrete: casilla marcada y el rótulo de la cabecera antigua para quitar', [await pagina.isChecked('#cep-membrete'), l1.some((l) => /JUNTA DE ANDALUCÍA - Consejería de Educación → se quita/.test(l))], [true, true]);
const d1 = await textoDoc();
await comprobar('2. en el documento ya no se lee el nombre ni el número; sí los huecos', [/Carla Espejo Montes|2100006/.test(d1), /\{nombreNatural\}/.test(d1), /\{\{MEMBRETE\}\}/.test(d1)], [false, true, true]);
await comprobar('2. el título sigue centrado y en negrita', pagina.evaluate(() => {
  const p = Array.from(document.querySelectorAll('.cep-doc p')).filter((x) => /CERTIFICADO DE MATR/.test(x.textContent))[0];
  const e = p && (p.querySelector('span') || p);
  return p ? [getComputedStyle(p).textAlign, Number(getComputedStyle(e).fontWeight) >= 600] : null;
}), ['center', true]);
await comprobar('2. los huecos están resaltados', pagina.locator('.cep-doc mark.cep-hueco').count().then((n) => n >= 5), true);

console.log('--- 3. marcar y desmarcar ---');
const fila2100006 = pagina.locator('.cep-linea', { hasText: '2100006' });
await fila2100006.locator('input').uncheck();
await pagina.waitForTimeout(1500);
await comprobar('3. desmarcar: el número vuelve a leerse', /2100006/.test(await textoDoc()), true);
await fila2100006.locator('input').check();
await pagina.waitForTimeout(1500);
await comprobar('3. marcar otra vez: vuelve el hueco', [/2100006/.test(await textoDoc()), /\{referencia\}/.test(await textoDoc())], [false, true]);

console.log('--- 4. lo marcado a mano ---');
await seleccionar('la solicitud de beca');
await comprobar('4. sale el menú con tres opciones', pagina.locator('.cep-menu-sel button').allTextContents(), ['Cambiar por un dato…', 'Esto se pregunta cada vez', 'Quitar del documento']);
await pagina.locator('.cep-menu-sel button', { hasText: 'Esto se pregunta cada vez' }).click();
await pagina.waitForSelector('#cep-nombre-dato');
await comprobar('4. pide el nombre del dato', pagina.locator('#cuadro-titulo').textContent(), '¿Cómo se llama este dato?');
await pagina.fill('#cep-nombre-dato', 'Nombre del tercero');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('4. un nombre que ya es un dato no se crea', [(await avisos()).some((a) => /Ya hay un dato con ese nombre\. Elígelo en «Cambiar por un dato…»\.\|ambar/.test(a)), (await lineas()).some((l) => /Se pregunta cada vez/.test(l))], [true, false]);
await seleccionar('la solicitud de beca');
await pagina.locator('.cep-menu-sel button', { hasText: 'Esto se pregunta cada vez' }).click();
await pagina.waitForSelector('#cep-nombre-dato');
await pagina.fill('#cep-nombre-dato', 'Para qué se presenta');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2000);
await comprobar('4. aparece «Lo que has marcado tú» con esa línea y el hueco en el documento', [
  await pagina.locator('.cep-rotulo', { hasText: 'Lo que has marcado tú' }).count(),
  (await lineas()).some((l) => /la solicitud de beca → Se pregunta cada vez: Para qué se presenta/.test(l)),
  /\{campo:Para qué se presenta\}/.test(await textoDoc())], [1, true, true]);

await seleccionar('el presente certificado');
await pagina.locator('.cep-menu-sel button', { hasText: 'Cambiar por un dato…' }).click();
await pagina.waitForSelector('#huecos-buscar');
await pagina.fill('#huecos-buscar', 'grupo');
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(2000);
await comprobar('4. «Cambiar por un dato…» abre el buscador de huecos y cambia el trozo por el elegido', [
  (await lineas()).some((l) => /el presente certificado → /.test(l)), /\{grupo\}/.test(await textoDoc())], [true, true]);

console.log('--- 5. los datos de la plantilla ---');
await comprobar('5. nombre, tipo de asunto, tipo de documento y quien firma', pagina.evaluate(() => [
  document.getElementById('cep-nombre-plantilla').value, document.querySelector('#cep-tipo-asunto strong').textContent,
  document.getElementById('cep-tipo-doc').value, document.getElementById('cep-firmante').selectedOptions[0].textContent]),
  ['Certificado', 'CERTIFICADO', 'CERTIFICADO', 'Secretaría']);
await comprobar('5. hito de la guía: «Preparar el certificado»', pagina.evaluate(() => document.getElementById('cep-hito').selectedOptions[0].textContent), 'Preparar el certificado');
await pagina.fill('#cep-nombre-plantilla', '');
await pagina.click('text=Ver cómo queda');
await comprobar('5. sin nombre: aviso rojo y no avanza', [(await avisos()).some((a) => /\|malo$/.test(a) && /nombre/i.test(a)), await pagina.locator('.cep-paso1').count()], [true, 1]);
await pagina.fill('#cep-nombre-plantilla', 'Certificado de matrícula');

console.log('--- 6. comparar ---');
await pagina.click('text=Ver cómo queda');
await pagina.waitForSelector('.cep-paso2 .cep-col');
await pagina.waitForTimeout(4000);
const col0 = await pagina.locator('.cep-col').nth(0).innerText();
const col1 = await pagina.locator('.cep-col').nth(1).innerText();
await comprobar('6. dos columnas con sus títulos', [/El original/.test(col0), /Con la plantilla nueva/.test(col1)], [true, true]);
await comprobar('6. a la derecha se lee lo mismo que en el original', ['Carla Espejo Montes', '2100006', 'Fernando Reyes Palma', 'la alumna', 'la solicitud de beca'].map((t) => col1.indexOf(t) !== -1), [true, true, true, true, true]);
await comprobar('6. lleva el membrete (una imagen) y ya no el rótulo de la cabecera antigua', [await pagina.locator('.cep-col').nth(1).locator('img').count() > 0, /JUNTA DE ANDALUCÍA - Consejería de Educación/.test(col1)], [true, false]);

console.log('--- 7. volver a corregir y guardar ---');
await pagina.click('text=← Volver a corregir');
await pagina.waitForSelector('.cep-paso1 .cep-linea');
await comprobar('7. se vuelve con lo mismo marcado y el nombre puesto', [(await lineas()).length, await pagina.inputValue('#cep-nombre-plantilla')], [10, 'Certificado de matrícula']);
const antesDeGuardar = await pagina.evaluate(async () => (await Carpetas.ficheros(App.E.listaAbiertos.filter((a) => /Espejo/.test(a.nombre))[0].handle)).map((f) => f.nombre).sort());
await pagina.click('text=Ver cómo queda');
await pagina.waitForSelector('.cep-paso2 .cep-col');
await pagina.waitForTimeout(3000);
await pagina.click('text=Guardar plantilla');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached', timeout: 20000 });
await comprobar('7. aviso verde', (await avisos()).some((a) => /^Plantilla guardada\. Ya sale en «Generar documento» de este tipo de asunto\.\|bueno$/.test(a)), true);
await comprobar('7. los documentos del asunto siguen siendo los mismos', pagina.evaluate(async () => (await Carpetas.ficheros(App.E.listaAbiertos.filter((a) => /Espejo/.test(a.nombre))[0].handle)).map((f) => f.nombre).sort()), antesDeGuardar);
const guardada = await pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.nombre === 'Certificado de matrícula')[0] || null);
await comprobar('7. la plantilla está en plantillas.json, del tipo CERTIFICADO', guardada && [guardada.tipo, guardada.categoria, guardada.tipoDocumento, guardada.firmante, /\.docx$/.test(guardada.fichero), guardada.conLogoCentro], ['CERTIFICADO', 'ALUMNADO', 'CERTIFICADO', 'secretaria', true, true]);
await comprobar('7. el fichero está en _GESTOR/PLANTILLAS con los huecos', pagina.evaluate(async (f) => {
  const dir = await PlantillasDocumento._interno.carpetaDePlantillas();
  const h = await dir.getFileHandle(f); const bytes = new Uint8Array(await (await h.getFile()).arrayBuffer());
  const xml = await Docx.leerEntradaDeTexto(bytes, 'word/document.xml');
  return [xml.indexOf('{{MEMBRETE}}') !== -1, xml.indexOf('{nombreNatural}') !== -1, xml.indexOf('{campo:Para qué se presenta}') !== -1, xml.indexOf('Carla Espejo') === -1];
}, guardada && guardada.fichero), [true, true, true, true]);
await comprobar('7. la tarea de generar está en el hito de la guía', pagina.evaluate((id) => {
  const paso = GuiasDelCentro.pasosDe('CERTIFICADO').filter((p) => /Preparar el certificado/.test(p.titulo))[0];
  const t = (paso.guion || []).filter((x) => x.accion === 'generar' && x.receta && x.receta.plantilla === id);
  return [t.length, t[0] && t[0].texto];
}, guardada && guardada.id), [1, 'Generar «Certificado de matrícula»']);
await comprobar('7. la línea gris de Ajustes encima del alta', pagina.evaluate(async () => {
  const d = document.createElement('div'); document.body.appendChild(d);
  await PlantillasDocumento.pintarDeTipo(d, App.E.tipos.filter((t) => t.tipo === 'CERTIFICADO')[0]);
  const ok = /También puedes crear una plantilla desde un documento de un asunto: en su menú ⋮, «Convertir en plantilla»\./.test(d.textContent) && /Certificado de matrícula/.test(d.textContent);
  d.remove(); return ok;
}), true);

console.log('--- 8. generar con ella en otro asunto ---');
const resultado = await pagina.evaluate(async (id) => {
  const a = App.E.listaAbiertos.filter((x) => /Herrera/.test(x.nombre))[0];
  const p = (await Plantillas.cargar(App.E.gestor)).documentos.filter((x) => x.id === id)[0];
  const hitos = Hitos.visibles(await Hitos.hitosDe(a.nombre));
  window.__generando = PlantillasDocumento.generar(a, p, 'abierto', { hito: hitos[0] || null });
  return a.nombre;
}, guardada.id);
await pagina.waitForSelector('#word-falta-0', { timeout: 20000 });
await comprobar('8. «Faltan datos» pregunta «Para qué se presenta»', pagina.locator('label[for="word-falta-0"]').textContent(), 'Para qué se presenta');
await pagina.fill('#word-falta-0', 'la matrícula en otro centro');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#word-visor:not(.oculto) .docx', { timeout: 20000 });
await pagina.waitForTimeout(2000);
const generado = await pagina.evaluate(async (nombre) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === nombre)[0];
  const f = (await Carpetas.ficheros(a.handle)).filter((x) => /\.docx$/i.test(x.nombre) && /CERTIFICADO/.test(x.nombre)).pop();
  const bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
  const xml = await Docx.leerEntradaDeTexto(bytes, 'word/document.xml');
  return DocxSustituir.textosDeParrafos(xml).join('\n');
}, resultado);
await comprobar('8. lleva a Diego, «el alumno», lo escrito a mano y la fecha de hoy (no la del documento de Carla)', [
  /Diego Herrera Lozano/.test(generado), /Que el alumno /.test(generado), /la matrícula en otro centro/.test(generado), !/la alumna/.test(generado),
  generado.indexOf(new Date().getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][new Date().getMonth()] + ' de ' + new Date().getFullYear()) !== -1
], [true, true, true, true, true]);
await pagina.evaluate(() => WordVisor.cerrar());

console.log('--- 9. nombre repetido y sustituir ---');
await abrirFicha('Espejo');
await (await menuDe('CERTIFICADO D26')).click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 20000 });
await pagina.waitForTimeout(2000);
await pagina.fill('#cep-nombre-plantilla', 'Certificado de matrícula');
await pagina.click('text=Ver cómo queda');
await pagina.waitForSelector('.cep-paso2 .cep-col');
await pagina.waitForTimeout(2500);
await pagina.click('text=Guardar plantilla');
await pagina.waitForTimeout(1500);
await comprobar('9. mismo nombre: aviso rojo y se sigue en la pantalla', [(await avisos()).some((a) => /^Ya hay una plantilla con ese nombre en este tipo de asunto\.\|malo$/.test(a)), await pagina.locator('#convertir-plantilla').count()], [true, 1]);
await pagina.click('text=← Volver a corregir');
await pagina.waitForSelector('.cep-paso1 .cep-linea');
await pagina.fill('#cep-nombre-plantilla', 'Certificado nuevo');
await pagina.click('text=Ver cómo queda');
await pagina.waitForSelector('.cep-paso2 .cep-col');
await pagina.waitForTimeout(2500);
await pagina.click('text=Guardar plantilla');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('9. mismo tipo de documento: el cuadro con tres botones', [await pagina.locator('#cuadro-cuerpo').innerText().then((t) => /Este tipo de asunto ya tiene la plantilla «Certificado de matrícula» para ese tipo de documento\./.test(t)),
  await pagina.locator('#cuadro-aceptar').textContent(), await pagina.locator('#cep-otra').textContent(), await pagina.locator('#cuadro-cancelar').textContent()], [true, 'Sustituirla', 'Guardar como otra', 'Cancelar']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(500);
await comprobar('9. «Cancelar»: no se guarda nada y se sigue en la pantalla', [await pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.tipo === 'CERTIFICADO').length), await pagina.locator('#convertir-plantilla').count()], [1, 1]);
await pagina.click('text=Guardar plantilla');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached', timeout: 20000 });
const tras = await pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.tipo === 'CERTIFICADO').map((p) => [p.id, p.nombre]));
await comprobar('9. «Sustituirla»: una sola plantilla, con el mismo id y el nombre nuevo', [tras.length, tras[0] && tras[0][0] === guardada.id, tras[0] && tras[0][1]], [1, true, 'Certificado nuevo']);

console.log('--- 10. un PDF con su Word, y lo que no vale ---');
await abrirFicha('Otero');
const entradaPdfMarta = await menuDe('COMUNICACION');
await comprobar('10. el PDF de Marta tiene la entrada encendida (su Word está en _Previas)', entradaPdfMarta.isDisabled(), false);
await entradaPdfMarta.click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 20000 });
await pagina.waitForTimeout(2000);
await comprobar('10. dice que usa el Word del PDF', pagina.locator('.cep-aviso-gemelo').first().textContent(), 'He encontrado el Word de este PDF y uso ese.');
await comprobar('10. propone cambiar el nombre de Marta', (await lineas()).some((l) => /Marta Otero Campos/.test(l)), true);
await pagina.click('.cep-pie-botones >> text=Cancelar');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached' });
await comprobar('10. cancelar sin haber cambiado nada: sale sin preguntar y no hay plantillas nuevas', [await pagina.locator('#capa:not(.oculto)').count(), await pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).documentos.length)], [0, 1]);
const entradaDoc = await menuDe('notas antiguas.doc');
await comprobar('10. un .doc viejo: apagada, con su motivo', [await entradaDoc.isDisabled(), await entradaDoc.getAttribute('title')], [true, 'Solo con Word moderno (.docx) o PDF. Ábrelo en Word y guárdalo como .docx.']);
await pagina.keyboard.press('Escape');
await abrirFicha('Aguilar Ponce, Pablo');
const entradaPablo = await menuDe('.pdf');
await comprobar('10. un PDF sin Word (otro asunto): apagada, con su motivo', [await entradaPablo.isDisabled(), await entradaPablo.getAttribute('title')], [true, 'No encuentro el Word de este PDF.']);
await pagina.keyboard.press('Escape');

console.log('--- 11. salir sin guardar ---');
await abrirFicha('Espejo');
await (await menuDe('CERTIFICADO D26')).click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 20000 });
await pagina.waitForTimeout(1500);
await pagina.locator('.cep-linea', { hasText: '2100006' }).locator('input').uncheck();
await pagina.waitForTimeout(1200);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('11. con algo cambiado, Escape pregunta antes', pagina.locator('#cuadro-titulo').textContent(), '¿Salir sin guardar la plantilla?');
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(500);
await comprobar('11. «Cancelar» del cuadro: la pantalla sigue', pagina.locator('#convertir-plantilla').count(), 1);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached' });
await comprobar('11. se sale sin escribir nada', pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.tipo === 'CERTIFICADO').length), 1);

console.log('--- 12. solo consultar ---');
await pagina.evaluate(() => SoloConsulta.guardar(true));
await abrirFicha('Espejo');
await comprobar('12. en solo consultar, el menú ⋮ del Word sale apagado (y con él «Convertir en plantilla»)', filaDe('CERTIFICADO D26').locator('.fila-menu-btn').isDisabled(), true);
await comprobar('12. y la propia entrada, si se pidiera, también', pagina.evaluate(() => { const a = App.E.listaAbiertos.filter((x) => /Espejo/.test(x.nombre))[0]; return ConvertirEnPlantilla.estadoRapido(a, '261003 CERTIFICADO D26-00002.docx').apagada; }), true);
await pagina.evaluate(() => SoloConsulta.guardar(false));

console.log('--- 13. la mesa del hito ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.locator('#inicio-tabla-cuerpo .nombre-pulsable', { hasText: 'Espejo' }).first().click();
await pagina.waitForSelector('#ficha-documentos', { state: 'attached' });
await pagina.waitForTimeout(1200);
await pagina.locator('.ficha-tarjeta', { hasText: 'Hitos' }).first().click();
await pagina.getByText('Preparar el certificado', { exact: true }).first().click();
await pagina.getByText('Pulsa para trabajar con ellos').first().click();
await pagina.waitForSelector('.hito-doc-menu-boton');
await pagina.locator('.hito-doc-menu-boton').first().click();
await comprobar('13. en la mesa del hito el menú del Word lleva «Convertir en plantilla», antes de «Pasar a versiones previas»',
  pagina.locator('.ficha-menu-opcion:visible').allTextContents().then((l) => l.slice(l.indexOf('Convertir en plantilla'), l.indexOf('Convertir en plantilla') + 2)), ['Convertir en plantilla', 'Pasar a versiones previas']);
await pagina.keyboard.press('Escape');

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? fallos + ' fallos' : 'todo bien');
process.exit(fallos ? 1 : 0);
