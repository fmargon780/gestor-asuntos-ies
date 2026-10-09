/* Fila 320 (docs/PANTALLA-DE-PLANTILLAS.md): la pantalla «Plantillas» de Herramientas. Con Chromium real y la copia de pruebas. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(antes, ancho) {
  const pagina = await navegador.newPage({ viewport: { width: ancho || 1280, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1&auto=1');
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  await pagina.waitForTimeout(2500);
  return pagina;
}
async function irAHerramientas(p) {
  await p.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-plantillas').open = true; });
  await p.waitForFunction(() => /\d+ de Word · \d+ de correo/.test(document.getElementById('plantillas-resumen').textContent), null, { timeout: 15000 });
}
const filas = (p) => p.evaluate(() => [...document.querySelectorAll('.pt-tabla tbody tr')].map((r) => ({
  id: r.dataset.id, celdas: [...r.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim()) })));
const nombres = (p) => filas(p).then((f) => f.map((x) => x.celdas[0].replace(/ De la aplicación$/, '')));
const fila = (p, nombre) => p.locator('.pt-tabla tbody tr').filter({ has: p.locator('.pt-nombre', { hasText: nombre }) });
async function docxDeMentira(p, texto) {
  const lista = await p.evaluate((t) => { const P = Demo.plantilla; return Array.from(P.docx([P.p([P.r(t, true)], true), P.p([P.r('Hola {{NOMBRE NATURAL}}')])])); }, texto);
  return Buffer.from(lista);
}
async function elegirFichero(p, boton, contenido, nombre, tipo) {
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), boton()]);
  await fc.setFiles({ name: nombre, mimeType: tipo || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: contenido });
}

/* ---------- 1 y 2: el bloque, la vista y las pestañas ---------- */
console.log('--- 1 y 2. el bloque y la vista ---');
let p = await abrir();
await irAHerramientas(p);
await comprobar('1. el bloque dice cuántas hay', p.evaluate(() => /^\d+ de Word · \d+ de correo$/.test(document.getElementById('plantillas-resumen').textContent)), true);
await comprobar('1. el bloque está debajo de «Control del registro»', p.evaluate(() => document.getElementById('bloque-control-registro').nextElementSibling.id), 'bloque-plantillas');
await p.click('#plantillas-abrir');
await p.waitForSelector('.pt-tabla');
await comprobar('2. la lista de Herramientas desaparece y se ve la vista con «← Volver a Herramientas»', p.evaluate(() => [document.getElementById('herramientas-lista').classList.contains('oculto'), document.getElementById('pt-volver').textContent]), [true, '← Volver a Herramientas']);
await comprobar('2. dos pestañas con su número', p.locator('.pt-pestana').allTextContents().then((t) => t.map((x) => x.replace(/\d+/, 'N'))), ['Word (N)', 'Correo (N)']);
await comprobar('3. columnas de Word', p.locator('.pt-tabla th').allTextContents().then((t) => t.filter(Boolean)), ['Nombre', 'Tipo de documento', 'Tipo de asunto', 'Hitos que la usan', 'Fichero']);
const word = await filas(p);
await comprobar('3. al menos cuatro de Word', word.length >= 4, true);

/* ---------- 4: hitos ---------- */
console.log('--- 3 y 4. hitos ---');
const notas = word.filter((f) => /Certificado de notas/.test(f.celdas[0]))[0];
await comprobar('4. «Certificado de notas» enseña el nombre de un hito', /Hito 1 · Preparar y enviar el certificado/.test(notas.celdas[3]), true);
await comprobar('4. otra dice «Ninguno»', word.some((f) => f.celdas[3] === 'Ninguno'), true);

/* ---------- 5, 6 y 7: filtros ---------- */
console.log('--- 5, 6 y 7. filtros ---');
await p.check('#pt-sin-hito');
await comprobar('5. «Sin ningún hito» quita «Certificado de notas»', nombres(p).then((n) => n.indexOf('Certificado de notas') === -1 && n.length > 0), true);
await p.uncheck('#pt-sin-hito');
await comprobar('5. y al desmarcar vuelve', nombres(p).then((n) => n.indexOf('Certificado de notas') !== -1), true);
await p.fill('#pt-buscar', 'cobro');
await comprobar('6. el buscador deja las que llevan la palabra', nombres(p), ['Justificante de cobro']);
await p.fill('#pt-buscar', 'zzzzz');
await comprobar('6. sin resultados', p.locator('#pt-cuerpo .vacio').textContent(), 'Ninguna plantilla tiene esas palabras.');
await p.fill('#pt-buscar', '');
await p.selectOption('#pt-tipo', 'BAJA MEDICA');
await comprobar('7. el desplegable «Tipo de asunto» deja las de ese tipo', nombres(p), ['Nota de baja médica']);
await p.selectOption('#pt-tipo', '');
await comprobar('7. y «Todos» las devuelve', nombres(p).then((n) => n.length >= 4), true);

/* ---------- 8: Ver ---------- */
console.log('--- 8. Ver ---');
await fila(p, 'Certificado de notas').locator('[data-accion="ver"]').click();
await p.waitForSelector('#word-visor:not(.oculto) section.docx, #word-visor:not(.oculto) .docx-wrapper', { timeout: 30000 });
await comprobar('8. el visor se abre con sus huecos a la vista y sin «Guardar PDF»', p.evaluate(() => [document.getElementById('word-visor').textContent.indexOf('{{NOMBRE NATURAL}}') !== -1, getComputedStyle(document.querySelector('.word-visor-pdf')).display === 'none']), [true, true]);
await p.keyboard.press('Escape');   /* en la demostración la franja fija tapa el botón «Cerrar» del visor: Escape también cierra */
await p.waitForFunction(() => document.getElementById('word-visor').classList.contains('oculto'), null, { timeout: 5000 });

/* ---------- 9 y 10: Cambiar y el cuadro ---------- */
console.log('--- 9 y 10. Cambiar ---');
await fila(p, 'Nota de baja médica').locator('[data-accion="cambiar"]').click();
await p.waitForSelector('#pd-nombre');
await comprobar('10. etiqueta «Fichero de Word», botón de traer, y ningún fichero de código nombrado', p.evaluate(() => {
  const t = document.getElementById('cuadro-cuerpo').textContent;
  return [t.indexOf('Fichero de Word') !== -1, !!document.getElementById('pd-traer-word'), /\.js|_GESTOR/.test(t)];
}), [true, true, false]);
await p.fill('#pd-nombre', 'Nota de baja cambiada');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.body.textContent.indexOf('Nota de baja cambiada') !== -1 && document.querySelector('.pt-tabla'), null, { timeout: 10000 });
await comprobar('9. la línea enseña el nombre nuevo sin recargar', nombres(p).then((n) => n.indexOf('Nota de baja cambiada') !== -1), true);

/* ---------- 11: Nueva + traer ---------- */
console.log('--- 11. + Nueva plantilla con «Traer un Word del ordenador…» ---');
await p.click('#pt-nueva');
await p.waitForSelector('#pd-traer-word');
const buenDocx = await docxDeMentira(p, 'PLANTILLA TRAIDA');
await elegirFichero(p, () => p.click('#pd-traer-word'), buenDocx, 'Mi certificado (3).docx');
await p.waitForFunction(() => document.getElementById('pd-fichero').value === 'Mi certificado (3).docx', null, { timeout: 10000 });
await comprobar('11. el fichero queda elegido en el desplegable', p.evaluate(() => document.getElementById('pd-fichero').value), 'Mi certificado (3).docx');
await p.fill('#pd-nombre', 'Plantilla traída');
await p.fill('#pd-tipo-doc', 'NOTIFICACIÓN');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.body.textContent.indexOf('Plantilla traída') !== -1 && document.querySelector('.pt-tabla'), null, { timeout: 10000 });
await comprobar('11. la plantilla nueva sale en la lista', nombres(p).then((n) => n.indexOf('Plantilla traída') !== -1), true);
await comprobar('11. y el fichero está en la carpeta de plantillas', p.evaluate(async () => { const d = await PlantillasDocumento._interno.carpetaDePlantillas(); return (await Carpetas.ficheros(d)).some((f) => f.nombre === 'Mi certificado (3).docx'); }), true);

/* ---------- 12, 13, 14: sustituir, deshacer, no es un Word ---------- */
console.log('--- 12 a 14. Sustituir el fichero ---');
const antes = await p.evaluate(() => Object.fromEntries(Plantillas.enMemoria().documentos.map((d) => [d.nombre, d.fichero])));
await fila(p, 'Justificante de pago').locator('summary').click();
const otroDocx = await docxDeMentira(p, 'OTRO WORD');
await elegirFichero(p, () => fila(p, 'Justificante de pago').locator('[data-accion="sustituir"]').click(), otroDocx, 'Nuevo certificado.docx');
await p.waitForSelector('#capa:not(.oculto) #pf-solo-esta', { timeout: 15000 });
await comprobar('12. la pregunta nombra a la otra y ofrece las tres respuestas', p.evaluate(() => [document.getElementById('cuadro-cuerpo').textContent.indexOf('Justificante de cobro') !== -1, document.getElementById('pf-solo-esta').textContent, document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent]), [true, 'Solo en esta', 'En todas', 'Cancelar']);
await p.click('#pf-solo-esta');
await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje')].some((m) => /Fichero sustituido/.test(m.textContent)), null, { timeout: 10000 });
await comprobar('12. aviso verde con «Deshacer»', p.evaluate(() => { const m = [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /Fichero sustituido/.test(x.textContent))[0]; return m && m.querySelector('button').textContent; }), 'Deshacer');
const despues = await p.evaluate(() => Object.fromEntries(Plantillas.enMemoria().documentos.map((d) => [d.nombre, d.fichero])));
await comprobar('12. cambia la de esta y la otra sigue con el de antes', [despues['Justificante de pago'], despues['Justificante de cobro']], ['Nuevo certificado.docx', antes['Justificante de cobro']]);
await comprobar('12. el fichero de antes no se ha borrado', p.evaluate(async (f) => { const d = await PlantillasDocumento._interno.carpetaDePlantillas(); return (await Carpetas.ficheros(d)).some((x) => x.nombre === f); }, antes['Justificante de pago']), true);
await p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /Fichero sustituido/.test(x.textContent))[0].querySelector('button').click());
await p.waitForFunction((f) => Plantillas.enMemoria().documentos.some((d) => d.nombre === 'Justificante de pago' && d.fichero === f), antes['Justificante de pago'], { timeout: 10000 });
await comprobar('13. «Deshacer» devuelve el fichero de antes', fila(p, 'Justificante de pago').locator('.pt-fichero').textContent(), antes['Justificante de pago']);
await fila(p, 'Justificante de pago').locator('summary').click();
const pdfFalso = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
await elegirFichero(p, () => fila(p, 'Justificante de pago').locator('[data-accion="sustituir"]').click(), pdfFalso, 'falso.docx', 'application/pdf');
await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje.malo')].some((m) => /no es un documento de Word/.test(m.textContent)), null, { timeout: 10000 });
await comprobar('14. un fichero que no es un Word: aviso rojo y nada cambia', p.evaluate((f) => [Plantillas.enMemoria().documentos.filter((d) => d.nombre === 'Justificante de pago')[0].fichero, document.getElementById('capa').classList.contains('oculto')], antes['Justificante de pago']), [antes['Justificante de pago'], true]);

/* ---------- 15, 16, 17: correo ---------- */
console.log('--- 15 a 17. Correo ---');
await p.click('[data-pestana="correo"]');
await comprobar('15. «Aviso de avance» y «Aviso de cierre»: «De la aplicación» y «Cualquier tipo»', p.evaluate(() => ['Aviso de avance', 'Aviso de cierre'].map((n) => { const r = [...document.querySelectorAll('.pt-tabla tbody tr')].filter((x) => x.children[0].textContent.indexOf(n) === 0)[0]; return !!r && /De la aplicación/.test(r.children[0].textContent) && r.children[1].textContent.trim() === 'Cualquier tipo'; })), [true, true]);
await comprobar('15. otra enseña un hito', filas(p).then((f) => f.some((x) => /Hito 1 · /.test(x.celdas[2]))), true);
await comprobar('15. columnas de correo', p.locator('.pt-tabla th').allTextContents().then((t) => t.filter(Boolean)), ['Nombre', 'Tipo de asunto', 'Hitos que la usan', 'Séneca']);
await fila(p, 'Acuse de recibo del parte').locator('[data-accion="ver"]').click();
await p.waitForSelector('#capa:not(.oculto) .pt-texto');
await comprobar('16. «Ver» de correo enseña su texto, solo para leer', p.evaluate(() => [document.querySelector('#cuadro-cuerpo .pt-texto').textContent.indexOf('Hemos recibido su parte de baja') !== -1, document.getElementById('cuadro-cancelar').classList.contains('oculto'), document.querySelectorAll('#cuadro-cuerpo textarea').length]), [true, true, 0]);
await p.click('#cuadro-aceptar');
await fila(p, 'Aviso de avance').locator('summary').click();
await comprobar('17. «Borrar» está apagado en «Aviso de avance»', p.evaluate(() => { const b = [...document.querySelectorAll('.pt-tabla tbody tr')].filter((x) => x.children[0].textContent.indexOf('Aviso de avance') === 0)[0].querySelector('[data-accion="borrar"]'); return [b.disabled, b.title]; }), [true, 'La aplicación la vuelve a crear sola.']);
await fila(p, 'Aviso de avance').locator('summary').click();
await fila(p, 'Confirmación de matrícula').locator('summary').click();
await fila(p, 'Confirmación de matrícula').locator('[data-accion="borrar"]').click();
await p.waitForSelector('#capa:not(.oculto)');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.querySelector('.pt-tabla') && document.querySelector('.pt-tabla').textContent.indexOf('Confirmación de matrícula') === -1, null, { timeout: 10000 });
await comprobar('17. «Borrar» pregunta, la línea desaparece y va a la Papelera', p.evaluate(async () => JSON.stringify(await Carpetas.leerJson(App.E.gestor, 'papelera.json')).indexOf('Confirmación de matrícula') !== -1), true);

/* ---------- 18: ancho ---------- */
console.log('--- 18. ancho ---');
for (const ancho of [1280, 1000]) {
  await p.setViewportSize({ width: ancho, height: 900 });
  await p.waitForTimeout(300);
  await p.click('[data-pestana="word"]');
  await comprobar('18. ' + ancho + ': sin «…» y sin desbordar' + (ancho === 1280 ? ', y el título y la tabla terminan en el mismo borde' : ''), p.evaluate(() => {
    const t = document.querySelector('.pt-tabla'), v = document.getElementById('plantillas-vista'), h = document.querySelector('.pt-barra');
    const sinMenus = t.cloneNode(true);
    sinMenus.querySelectorAll('.pt-menu').forEach((m) => m.remove());   /* «Sustituir el fichero…» lleva sus puntos de verdad */
    const bt = t.getBoundingClientRect().right, bv = v.getBoundingClientRect().right;
    return [sinMenus.textContent.includes('…'), t.scrollWidth > v.clientWidth + 1, Math.abs(bt - bv) <= 2, h.getBoundingClientRect().right <= bv + 1];
  }), [false, false, true, true]);
}
await p.setViewportSize({ width: 1280, height: 900 });

/* ---------- 19: volver ---------- */
console.log('--- 19. volver ---');
await p.click('#pt-volver');
await comprobar('19. «← Volver a Herramientas» enseña la lista de bloques', p.evaluate(() => [document.getElementById('herramientas-lista').classList.contains('oculto'), document.getElementById('plantillas-vista').classList.contains('oculto')]), [false, true]);
await p.click('#plantillas-abrir');
await p.waitForSelector('.pt-tabla');
await p.evaluate(() => { App.ir('inicio'); });
await p.waitForTimeout(300);
await p.evaluate(() => { App.ir('herramientas'); });
await p.waitForTimeout(800);
await comprobar('19. al volver a Herramientas se ve la lista de bloques, no la tabla', p.evaluate(() => [document.getElementById('herramientas-lista').classList.contains('oculto'), document.getElementById('plantillas-vista').classList.contains('oculto')]), [false, true]);

/* ---------- 20: desde un tipo ---------- */
console.log('--- 20. «Ver todas las plantillas» desde un tipo ---');
await p.evaluate(async () => { await App.abrirTipoDeAsunto((App.E.tipos || []).filter((t) => t.tipo === 'FACTURA')[0]); });
await p.waitForSelector('#tipo-pd-nueva', { state: 'attached', timeout: 15000 });
await p.evaluate(() => document.getElementById('tipo-pd-nueva').nextElementSibling.querySelector('button').click());
await p.waitForSelector('.pt-tabla', { timeout: 15000 });
await comprobar('20. se abre en «Word» con ese tipo puesto', p.evaluate(() => [document.querySelector('.pt-pestana.activa').textContent.replace(/\d+/, 'N'), document.getElementById('pt-tipo').value, document.querySelectorAll('.pt-tabla tbody tr').length]), ['Word (N)', 'FACTURA', 1]);

/* ---------- 21: el buscador de Ajustes ---------- */
console.log('--- 21. el buscador de Ajustes ---');
await comprobar('21. «plantillas» encuentra el bloque de Herramientas', p.evaluate(async () => {
  App.ir('ajustes');
  await new Promise((r) => setTimeout(r, 400));
  const c = document.getElementById('ajustes-buscar');
  c.value = 'plantillas'; c.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 500));
  return [...document.querySelectorAll('.ajustes-resultado')].some((x) => /Plantillas/.test(x.textContent) && /Herramientas/.test(x.textContent));
}), true);
await p.close();

/* ---------- 22: solo consultar ---------- */
console.log('--- 22. solo consultar ---');
p = await abrir("try { localStorage.setItem('gestor.soloConsulta', '1'); } catch (e) {}");
await p.waitForSelector('#franja-solo-consulta', { timeout: 30000 });
await irAHerramientas(p);
await p.click('#plantillas-abrir');
await p.waitForSelector('.pt-tabla');
await p.waitForTimeout(600);
await comprobar('22. se abre, se puede buscar y «Ver» funciona', p.evaluate(() => [!document.getElementById('pt-buscar').disabled, !document.querySelector('[data-accion="ver"]').disabled]), [true, true]);
await comprobar('22. «Cambiar», «+ Nueva plantilla» y lo de «⋮» apagados', p.evaluate(() => [document.querySelector('[data-accion="cambiar"]').disabled, document.getElementById('pt-nueva').disabled, document.querySelector('[data-accion="sustituir"]').disabled, document.querySelector('[data-accion="borrar"]').disabled]), [true, true, true, true]);
await p.close();

console.log('--- sin errores ---');
await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de la pantalla «Plantillas» pasan.');
