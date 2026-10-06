/* Prueba con navegador de la fila 281 de docs/COLA.md (docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md):
   «Convertir en plantilla» con un PDF que no tiene su Word, con Chromium real y los datos inventados
   de la copia de pruebas (?demo=1&auto=1): la entrada encendida, la línea fija de «copiado solo el
   texto», el título y los párrafos, lo que se propone quitar, el PDF de verdad en «El original»,
   guardar, generar con ella en otro asunto, la tabla (avisa y deja seguir), el PDF escaneado (avisa
   y no abre nada) y que el PDF con su Word sigue como en la fila 280. */
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
async function entrada(texto) {
  const fila = pagina.locator('#ficha-documentos .ficha-documento-fila', { hasText: texto }).first();
  await fila.locator('.fila-menu-btn').click();
  return fila.locator('.fila-menu button', { hasText: 'Convertir en plantilla' });
}
const lineas = () => pagina.locator('.cep-linea').allTextContents();
const nombresDeCarpeta = (clave) => pagina.evaluate(async (c) => (await Carpetas.ficheros(App.E.listaAbiertos.filter((a) => a.nombre.indexOf(c) !== -1)[0].handle)).map((f) => f.nombre).sort(), clave);

console.log('--- 1. la entrada y la pantalla ---');
await abrirFicha('Aguilar Ponce, Pablo');
const antes = await nombresDeCarpeta('Aguilar Ponce, Pablo');
const e1 = await entrada('JUSTIFICANTE');
await comprobar('1. en el PDF «JUSTIFICANTE» (sin Word) la entrada está encendida', [await e1.isDisabled(), await e1.getAttribute('title')], [false, null]);
await e1.click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 30000 });
await pagina.waitForTimeout(2500);
await comprobar('1. la línea fija de arriba', pagina.locator('.cep-aviso-gemelo').first().textContent(), 'Este PDF no tiene su Word: he copiado solo el texto. Las tablas y los recuadros no se copian.');
await comprobar('1. el título centrado y en negrita; «Se hace constar…» es un solo párrafo', pagina.evaluate(() => {
  const ps = Array.from(document.querySelectorAll('.cep-doc p'));
  const titulo = ps.filter((x) => /JUSTIFICANTE DE MATR/.test(x.textContent))[0];
  const cuerpo = ps.filter((x) => /Se hace constar/.test(x.textContent));
  const e = titulo && (titulo.querySelector('span') || titulo);
  return [titulo ? getComputedStyle(titulo).textAlign : null, titulo ? Number(getComputedStyle(e).fontWeight) >= 600 : null, cuerpo.length, cuerpo[0] && /ha formalizado su matr/.test(cuerpo[0].textContent)];
}), ['center', true, 1, true]);
const l = await lineas();
await comprobar('1. datos: «Pablo Aguilar Ponce» y «2100002», marcados', [l.some((x) => /^Pablo Aguilar Ponce → /.test(x)), l.some((x) => /^2100002 → /.test(x)), await pagina.locator('.cep-linea input:checked').count() === l.length], [true, true, true]);
await comprobar('1. quitar: la cabecera (una sola línea, aunque sale en las dos páginas) y «Firmado digitalmente por…»', [
  l.filter((x) => /IES Fuente Lucena \(copia de pruebas\) - Secretaría → se quita/.test(x)).length, l.filter((x) => /Firmado digitalmente por Fernando Reyes Palma → se quita/.test(x)).length], [1, 1]);
await comprobar('1. el membrete de la app, marcado', pagina.isChecked('#cep-membrete'), true);

console.log('--- 2. comparar con el PDF de verdad ---');
await pagina.fill('#cep-nombre-plantilla', 'Justificante de matrícula');
await pagina.click('text=Ver cómo queda');
await pagina.waitForSelector('.cep-paso2 .cep-col');
await pagina.waitForTimeout(5000);
await comprobar('2. en «El original» se ve el PDF, con sus dos páginas', pagina.locator('.cep-col').nth(0).locator('canvas.cep-pdf-pagina').count(), 2);
const derecha = await pagina.locator('.cep-col').nth(1).innerText();
await comprobar('2. a la derecha: el nombre, el número y la frase de la segunda página; sin «Firmado digitalmente»', ['Pablo Aguilar Ponce', '2100002', 'Este justificante no tiene validez sin el sello del centro.'].map((t) => derecha.indexOf(t) !== -1).concat(/Firmado digitalmente/.test(derecha)), [true, true, true, false]);
await comprobar('2. lleva el membrete de la app', pagina.locator('.cep-col').nth(1).locator('img').count().then((n) => n > 0), true);

console.log('--- 3. guardar y generar con ella ---');
await pagina.click('text=Guardar plantilla');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached', timeout: 20000 });
await comprobar('3. aviso verde', (await avisos()).some((a) => /^Plantilla guardada\. Ya sale en «Generar documento» de este tipo de asunto\.\|bueno$/.test(a)), true);
await comprobar('3. en el asunto, el PDF sigue y no hay ningún Word nuevo', nombresDeCarpeta('Aguilar Ponce, Pablo'), antes);
const generado = await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => /Aguilar Ponce, Marina/.test(x.nombre))[0];
  const p = (await Plantillas.cargar(App.E.gestor)).documentos.filter((x) => x.nombre === 'Justificante de matrícula')[0];
  await PlantillasDocumento.generar(a, p, 'abierto');
  const f = (await Carpetas.ficheros(a.handle)).filter((x) => /\.docx$/i.test(x.nombre)).pop();
  const bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
  return DocxSustituir.textosDeParrafos(await Docx.leerEntradaDeTexto(bytes, 'word/document.xml')).join('\n');
});
await pagina.evaluate(() => WordVisor.cerrar());
const hoy = new Date();
const largaHoy = hoy.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][hoy.getMonth()] + ' de ' + hoy.getFullYear();
await comprobar('3. en el asunto de Marina: «Marina Aguilar Ponce», «2100001» y la fecha de hoy', [/Marina Aguilar Ponce/.test(generado), /2100001/.test(generado), generado.indexOf(largaHoy) !== -1, /Pablo/.test(generado)], [true, true, true, false]);

console.log('--- 4. una tabla: avisa y deja seguir ---');
await abrirFicha('Aguilar Ponce, Pablo');
await (await entrada('LISTADO')).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('4. pregunta por la tabla, con «Seguir» y «Cancelar»', [(await pagina.locator('#cuadro-cuerpo').innerText()).replace(/\s+/g, ' ').trim(), await pagina.locator('#cuadro-aceptar').textContent(), await pagina.locator('#cuadro-cancelar').textContent()],
  ['Parece que este documento tiene una tabla. La tabla no se puede copiar: saldrá como renglones de texto.', 'Seguir', 'Cancelar']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(1000);
await comprobar('4. «Cancelar»: no se abre nada', pagina.locator('#convertir-plantilla').count(), 0);
await (await entrada('LISTADO')).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#convertir-plantilla .cep-linea, #convertir-plantilla .cep-lineas', { timeout: 30000 });
await comprobar('4. «Seguir»: se abre la pantalla (con su línea de «solo el texto»)', pagina.locator('.cep-aviso-gemelo').first().textContent().then((t) => /he copiado solo el texto/.test(t)), true);
await pagina.click('.cep-pie-botones >> text=Cancelar');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached' });

console.log('--- 5. un PDF escaneado ---');
await abrirFicha('Aguilar Ponce, Pablo');
await (await entrada('SOLICITUD')).click();
await pagina.waitForTimeout(2500);
await comprobar('5. aviso ámbar y no se abre nada', [(await avisos()).some((a) => /^Este PDF es una imagen escaneada: no tiene texto que leer\. No se puede convertir en plantilla\.\|ambar$/.test(a)), await pagina.locator('#convertir-plantilla').count()], [true, 0]);

console.log('--- 6. lo de la fila 280 sigue igual ---');
await abrirFicha('Otero Campos, Marta');
await (await entrada('COMUNICACION')).click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 30000 });
await pagina.waitForTimeout(1500);
await comprobar('6. el PDF con su Word: «He encontrado el Word…», sin la línea de «he copiado solo el texto»', pagina.locator('.cep-aviso-gemelo').allTextContents(), ['He encontrado el Word de este PDF y uso ese.']);
await pagina.click('.cep-pie-botones >> text=Cancelar');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached' });
await abrirFicha('Espejo');
await (await entrada('CERTIFICADO D26')).click();
await pagina.waitForSelector('#convertir-plantilla .cep-linea', { timeout: 30000 });
await comprobar('6. el Word de Carla abre su pantalla sin línea de aviso', pagina.locator('.cep-avisos .cep-aviso-gemelo').count(), 0);
await pagina.click('.cep-pie-botones >> text=Cancelar');
await pagina.waitForSelector('#convertir-plantilla', { state: 'detached' });

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? fallos + ' fallos' : 'todo bien');
process.exit(fallos ? 1 : 0);
