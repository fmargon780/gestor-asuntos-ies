/* Prueba con navegador de la fila 439 de docs/COLA.md (docs/DOCUMENTOS-EN-UNA-LINEA.md):
   cada documento, en una sola línea. Con Chromium real y los datos inventados de la copia de pruebas
   (?demo=1&auto=1), en el asunto de Aguilar Ponce, Marina, con la ventana a 1280 px de ancho:
   1: la carpeta de la ficha: casilla · tipo · nombre · «Ruta» · datos · ⋮, en un solo renglón;
   2: el ⋮ trae copiar el nombre, Cambiar el nombre y Asociar a un hito (y Registrar en un PDF sin registro);
   3: los datos largos se cortan con «…» y se ven enteros en el title;
   4: la mesa del hito y las versiones previas, igual. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
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

const UNO = '260901 CERTIFICADO prueba uno.pdf', DOS = '260902 CERTIFICADO prueba dos.pdf', PREVIA = '260903 CERTIFICADO vieja.pdf';
const LARGO = 'Alumno: Nombre Apellido Apellido · Motivo: ' + 'un texto bastante largo '.repeat(8);
await pagina.evaluate(async ([uno, dos, previa, largo]) => {
  const a = App.E.listaAbiertos.filter((x) => /Aguilar Ponce, Marina/.test(x.nombre))[0];
  for (const n of [uno, dos]) await Carpetas.escribirBytes(a.handle, n, new TextEncoder().encode('x'), 'application/octet-stream');
  /* Datos largos de uno de los documentos: se sustituye la línea, para probar el corte con «…». */
  const real = DocumentosDatos.lineaHTML;
  DocumentosDatos.lineaHTML = function (asunto, nombre, opciones, clase) {
    return nombre === uno ? '<div class="doc-datos ' + (clase || '') + '" title="' + largo + '">' + largo + '</div>' : real.apply(this, arguments);
  };
  await FichaDocumentos.pintar(a);
  window.__a = a;
  if (window.VersionesPrevias) {
    await Carpetas.escribirBytes(a.handle, previa, new TextEncoder().encode('x'), 'application/octet-stream');
    await VersionesPrevias.mover(a.handle, previa);
  }
}, [UNO, DOS, PREVIA, LARGO]);

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.locator('#inicio-tabla-cuerpo .nombre-pulsable', { hasText: 'Aguilar Ponce, Marina' }).first().click();
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila', { timeout: 15000 });
await pagina.waitForTimeout(1500);

const fila = (n) => pagina.locator('#ficha-documentos .ficha-documento-fila').filter({ hasText: n }).first();

console.log('--- 1. la carpeta: una línea por documento ---');
await comprobar('1. cada documento de la carpeta mide un solo renglón y no lleva fila de botones debajo', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).map((f) => [f.getBoundingClientRect().height < 56,
    Array.from(f.children).every((c) => c.getBoundingClientRect().bottom <= f.getBoundingClientRect().bottom + 1)]).flat().every(Boolean)), true);
await comprobar('1. a la vista solo hay «Ruta» (y el ⋮); ni ⧉, ni Registrar, ni Cambiar el nombre, ni Asociar sueltos', fila(UNO).evaluate((f) =>
  Array.from(f.querySelectorAll(':scope > button, :scope > .fila-menu-envoltorio > button')).filter((b) => b.offsetParent && !b.classList.contains('ficha-documento')).map((b) => b.textContent.trim())), ['Ruta', '⋮']);
await comprobar('1. el orden: nombre, «Ruta», datos y ⋮', fila(UNO).evaluate((f) => {
  const orden = Array.from(f.children).filter((c) => c.offsetParent || c.matches('.doc-datos')).map((c) =>
    c.matches('.ficha-documento') ? 'nombre' : c.matches('.ruta-documento') ? 'ruta' : c.matches('.doc-datos') ? 'datos' : c.matches('.fila-menu-envoltorio') ? 'menu' : '');
  return orden.filter(Boolean);
}), ['nombre', 'ruta', 'datos', 'menu']);

console.log('--- 2. el ⋮ ---');
await fila(DOS).locator('.fila-menu-btn').click();
await comprobar('2. trae copiar el nombre, Cambiar el nombre y Asociar a un hito, en ese orden',
  fila(DOS).locator('.fila-menu button:visible').allTextContents().then((t) => t.map((x) => x.trim()).filter((x) => ['Copiar el nombre', 'Registrar', 'Cambiar el nombre', 'Asociar a un hito'].indexOf(x) !== -1)),
  ['Copiar el nombre', 'Registrar', 'Cambiar el nombre', 'Asociar a un hito']);
await pagina.keyboard.press('Escape');

console.log('--- 3. datos largos ---');
const datos = await fila(UNO).evaluate((f) => { const d = f.querySelector('.doc-datos'); const c = getComputedStyle(d); return [c.textOverflow, d.scrollWidth > d.clientWidth, d.title.length > 100, d.getBoundingClientRect().height < 24]; });
await comprobar('3. los datos largos se cortan con «…», enteros en el title y sin partir la línea', datos, ['ellipsis', true, true, true]);
await comprobar('3. los datos tienen sitio (8em) y el nombre se ve entero en su title', fila(UNO).evaluate((f) => { const n = f.querySelector('.ficha-documento-nombre'); return [f.querySelector('.doc-datos').getBoundingClientRect().width >= 80, n.title === n.textContent]; }), [true, true]);

console.log('--- 3b. el ⋮ de la última fila no se corta ---');
await fila(DOS).locator('.fila-menu-btn').click();
await comprobar('3b. el menú ⋮ cabe dentro de la ventana y de la tarjeta', fila(DOS).evaluate((f) => { const m = f.querySelector('.fila-menu'); const r = m.getBoundingClientRect(); const c = m.closest('.trabajo-col, .trabajo-der') || document.body; return r.top >= 0 && r.bottom <= Math.min(innerHeight, c.getBoundingClientRect().bottom) + 1; }), true);
await pagina.keyboard.press('Escape');

console.log('--- 4. la mesa del hito y las versiones previas ---');
await pagina.evaluate(async () => {
  const hs = Hitos.visibles(await Hitos.hitosDe(window.__a.nombre));
  await Hitos.anadirDocumento(window.__a.nombre, hs[0].id, '260901 CERTIFICADO prueba uno.pdf');
  HitosPanel.programarRepintado();
  await new Promise((r) => setTimeout(r, 1200));
  HitoMesa.abrir(window.__a, hs[0].id);
});
await pagina.waitForSelector('.hito-en-mesa .mesa-doc', { timeout: 10000 });
await pagina.waitForTimeout(800);
await comprobar('4. el documento de la mesa mide un solo renglón y «Ruta» va pegado a su nombre', pagina.evaluate(() => {
  const d = document.querySelector('.hito-en-mesa .mesa-doc');
  const n = d.querySelector('.hito-doc-abrir');
  const r = d.querySelector('.ruta-documento');
  return [d.getBoundingClientRect().height < 56, !!r && r.getBoundingClientRect().left >= n.getBoundingClientRect().right - 1 && Math.abs(r.getBoundingClientRect().top - n.getBoundingClientRect().top) < 12];
}), [true, true]);
const previas = await pagina.evaluate(async () => {
  const det = document.querySelector('.hito-en-mesa .mesa-previas, #ficha-documentos .ficha-previas');
  if (!det) return null;
  det.open = true;
  const f = det.querySelector('.mesa-previa-fila, .ficha-previa-fila');
  return f ? [f.getBoundingClientRect().height < 40, !!f.querySelector('.ruta-documento'), !!f.querySelector('.fila-menu-btn')] : null;
});
await comprobar('4. una versión previa: una línea, con «Ruta» y ⋮', previas, [true, true, true]);

await pagina.screenshot({ path: '/tmp/claude-0/mesa.png' });
await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien');
