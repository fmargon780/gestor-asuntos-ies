/* Fila 672 (15-nov-2026, docs/672-ACCIONES-QUE-HACEN-ALGO-2.md, tema 665): Publicar, Cobrar o pagar y Archivar, con Chromium real y los datos
   de la copia de pruebas (?demo=1&auto=1), en SANCION de Fuentes Calvo:
   1. Sin casilla las tres. 2. «Publicado»: línea verde con «Expuesto hasta», aviso en Inicio ese día, «Deshacer» lo quita.
   3. «Apuntar cobro o pago»: cobro y pago, importe con coma, forma; sin importe, «Cobro». 4. «Archivado»: sitio, zona nueva elegible,
   «Ver todos los sitios…» abre «Sitios» encima, detalle. 5. En blanco, las tres quedan hechas. 6. Consola sin errores. */
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
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 } });
const pagina = await contexto.newPage();
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.TareaHecha, null, { timeout: 60000 });
await pagina.waitForTimeout(2500);
await pagina.click('button.pestana[data-pantalla="abiertos"]');
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await pagina.waitForSelector('.tcd-abrir-form', { timeout: 15000 });

const tarea = (nombre) => pagina.locator('.guion-paso', { has: pagina.locator('.guion-paso-texto', { hasText: nombre }) });
async function anadirTarea(nombre, que) {
  await pagina.click('.tcd-abrir-form');
  await pagina.fill('.tcd-nueva .at-nombre', nombre);
  await pagina.fill('.tcd-nueva .at-que', que);
  await pagina.click('.tcd-nueva .at-anadir');
  await pagina.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("' + nombre + '"))');
}
async function ventana() { await pagina.waitForSelector('.th-capa .th-cuadro', { timeout: 8000 }); }
async function ventanaCerrada() { await pagina.waitForSelector('.th-capa', { state: 'detached', timeout: 8000 }); await pagina.waitForTimeout(600); }
const registro = () => pagina.evaluate(() => RegistroAsunto.lineas(FichaNucleo.actual).map((l) => l.texto));
const estadoDe = (nombre) => pagina.evaluate((n) => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
  return t ? { casilla: !!t.querySelector('.guion-casilla'), hecho: t.classList.contains('hecho'), botones: [...t.querySelectorAll('.guion-hecha-boton')].map((b) => b.textContent.trim()),
    verde: (t.querySelector('.guion-hecha-linea') || {}).textContent || '' } : null;
}, nombre);
const avisoExposicion = () => pagina.evaluate(async () => { await AvisosExposicion.pintar(); if (window.InicioPlegados) InicioPlegados.poner('avisos', false); AvisosLinea.refrescar();
  return [...document.querySelectorAll('#avisos-linea [data-aviso="exposiciones"]')].map((b) => b.textContent); });
const hoy = await pagina.evaluate(() => U.hoyIso());
const manana = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

console.log('--- 1. sin casilla ---');
await anadirTarea('Publicar el listado', 'Publicar · Tablón');
await anadirTarea('Cobrar la tasa', 'Cobrar o pagar · En mano');
await anadirTarea('Archivar el papel', 'Archivar');
await anadirTarea('Llamar con casilla', 'Llamar · Teléfono');
await comprobar('Publicar, Cobrar y Archivar: sin casilla y con su botón', Promise.all([estadoDe('Publicar el listado'), estadoDe('Cobrar la tasa'), estadoDe('Archivar el papel')]).then((l) => l.map((e) => [e.casilla, e.botones])),
  [[false, ['Publicado']], [false, ['Apuntar cobro o pago']], [false, ['Archivado']]]);
await comprobar('Llamar sigue con casilla', estadoDe('Llamar con casilla').then((e) => e.casilla), true);

console.log('--- 2. Publicado ---');
await tarea('Publicar el listado').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('la ventana pide «Publicado el», «Expuesto hasta» y nota', pagina.evaluate(() => [...document.querySelectorAll('.th-capa .th-rotulo')].map((e) => e.textContent)), ['Publicado el', 'Expuesto hasta', 'Nota']);
await pagina.fill('#th-hasta', manana);
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('línea verde «Publicado hasta el … (aviso ese día)»', estadoDe('Publicar el listado').then((e) => [e.hecho, /^✔ Publicado hasta el \d+-\w{3}-\d{4} \(aviso ese día\) · \d+-\w{3}-\d{4} · .+$/.test(e.verde)]), [true, true]);
await comprobar('con «Expuesto hasta» mañana, hoy no hay aviso', avisoExposicion(), []);
await pagina.locator('.guion-paso', { has: pagina.locator('.guion-paso-texto', { hasText: 'Publicar el listado' }) }).locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: /^Deshacer$/ }).first().click();
await pagina.waitForFunction(() => ![...document.querySelectorAll('.guion-paso')].some((x) => x.querySelector('.guion-paso-texto').textContent === 'Publicar el listado' && x.classList.contains('hecho')), null, { timeout: 8000 });
await tarea('Publicar el listado').locator('.guion-hecha-boton').click();
await ventana();
await pagina.fill('#th-hasta', hoy);
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('con «Expuesto hasta» hoy, sale el aviso «Termina la exposición de …» con el asunto', avisoExposicion().then((l) => l.length === 1 && /Termina la exposición de «Publicar el listado» \(.*SANCION.*\)/.test(l[0])), true);
await pagina.locator('.guion-paso', { has: pagina.locator('.guion-paso-texto', { hasText: 'Publicar el listado' }) }).locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: /^Deshacer$/ }).first().click();
await pagina.waitForTimeout(1200);
await comprobar('«Deshacer» quita el aviso', avisoExposicion(), []);

console.log('--- 3. Cobrar o pagar ---');
await tarea('Cobrar la tasa').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('la ventana: Cobro/Pago, importe, forma con tres opciones', pagina.evaluate(() => ({ cp: [...document.querySelectorAll('input[name="th-cp"]')].map((r) => r.value), formas: [...document.querySelectorAll('#th-forma option')].map((o) => o.textContent) })),
  { cp: ['cobro', 'pago'], formas: ['Sin decir', 'Efectivo', 'Tarjeta', 'Transferencia'] });
await pagina.fill('#th-importe', 'abc');
await pagina.click('#th-ok');
await pagina.waitForTimeout(400);
await comprobar('un importe que no es número no deja guardar', pagina.evaluate(() => !!document.querySelector('.th-capa')), true);
await pagina.fill('#th-importe', '1,12');
await pagina.selectOption('#th-forma', 'Efectivo');
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('línea verde «Cobro de 1,12 € · Efectivo · fecha · quién»', estadoDe('Cobrar la tasa').then((e) => /^✔ Cobro de 1,12 € · Efectivo · \d+-\w{3}-\d{4} · .+$/.test(e.verde)), true);
await comprobar('y el Registro lo dice', registro().then((l) => l.some((t) => /^Tarea hecha: Cobrar la tasa — Cobro de 1,12 € · Efectivo \(/.test(t))), true);
await comprobar('se guarda como número', pagina.evaluate(async () => { const a = FichaNucleo.actual; const hs = await Hitos.hitosDe(a.nombre); let v = null; hs.forEach((h) => Object.values(h.guionHecho || {}).forEach((e) => { if (e.hechoCon && e.hechoCon.cobroPago) v = e.hechoCon.importe; })); return v; }), 1.12);
await pagina.evaluate(async () => { const a = FichaNucleo.actual; const hs = await Hitos.hitosDe(a.nombre); const h = hs.filter((x) => x.clase !== 'decision' && x.estado !== 'hecho')[0];
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Pagar la fotocopia', { accion: 'cobrar' }); HitosPanel.programarRepintado(); });
await pagina.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Pagar la fotocopia"))');
await tarea('Pagar la fotocopia').locator('.guion-hecha-boton').click();
await ventana();
await pagina.check('input[name="th-cp"][value="pago"]');
await pagina.fill('#th-importe', '3,5');
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('un pago de 3,5 sale «Pago de 3,50 €»', estadoDe('Pagar la fotocopia').then((e) => /^✔ Pago de 3,50 € · \d+/.test(e.verde)), true);

console.log('--- 4. Archivar ---');
await pagina.evaluate(() => { const r = Sitios.anadir(Sitios.datos(), 'Armario 2', 'st-archivo'); Sitios.poner(r.datos); });
await tarea('Archivar el papel').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('«Dónde queda el papel» ofrece los sitios y la zona nueva, y hay «Ver todos los sitios…»', pagina.evaluate(() => ({
  zona: [...document.querySelectorAll('#th-donde option')].some((o) => o.textContent === 'Archivo del centro · Armario 2'), ver: document.getElementById('th-ver-sitios').textContent })),
  { zona: true, ver: 'Ver todos los sitios…' });
await pagina.selectOption('#th-donde', { label: 'Archivo del centro · Armario 2' });
await pagina.fill('#th-detalle', 'caja 2025-26');
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('línea verde «Archivado en Archivo del centro · Armario 2 · caja 2025-26 · fecha · quién»', estadoDe('Archivar el papel').then((e) => /^✔ Archivado en Archivo del centro · Armario 2 · caja 2025-26 · \d+-\w{3}-\d{4} · .+$/.test(e.verde)), true);
await pagina.evaluate(async () => { const a = FichaNucleo.actual; const hs = await Hitos.hitosDe(a.nombre); const h = hs.filter((x) => x.clase !== 'decision' && x.estado !== 'hecho')[0];
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Archivar en expediente', { accion: 'archivar', donde: { sitio: 'st-expediente' } }); HitosPanel.programarRepintado(); });
await pagina.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Archivar en expediente"))');
await tarea('Archivar en expediente').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('propone el «Dónde se hace» de la tarea', pagina.evaluate(() => { const s = document.getElementById('th-donde'); return s.options[s.selectedIndex].textContent; }), 'Expediente del alumno');
await pagina.click('#th-ver-sitios');
await pagina.waitForSelector('.sitios-capa', { timeout: 8000 });
await comprobar('«Sitios» se abre encima de la ventana', pagina.evaluate(() => { const s = document.querySelector('.sitios-capa'), t = document.querySelector('.th-capa'); return Number(getComputedStyle(s).zIndex) > Number(getComputedStyle(t).zIndex); }), true);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('.sitios-capa', { state: 'detached', timeout: 8000 });
await comprobar('Escape cierra solo «Sitios»; la ventana de la tarea sigue', pagina.evaluate(() => !!document.querySelector('.th-capa')), true);
await pagina.click('#th-ver-sitios');
await pagina.waitForSelector('.sitios-capa', { timeout: 8000 });
await pagina.locator('.sitios-capa #sv-mapa button', { hasText: 'Alumnado' }).first().click();
await pagina.click('#sv-usar');
await pagina.waitForSelector('.sitios-capa', { state: 'detached', timeout: 8000 });
await comprobar('elegir una zona en «Sitios» («Usar … en la tarea») la deja elegida en «Dónde queda el papel»', pagina.evaluate(() => { const s = document.getElementById('th-donde'); return s.options[s.selectedIndex].textContent; }), 'Séneca · Alumnado');
await pagina.selectOption('#th-donde', { label: 'Expediente del alumno' });
await comprobar('al volver, sigue elegido el sitio de la tarea', pagina.evaluate(() => { const s = document.getElementById('th-donde'); return s.options[s.selectedIndex].textContent; }), 'Expediente del alumno');
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('sin detalle: «Archivado en Expediente del alumno»', estadoDe('Archivar en expediente').then((e) => /^✔ Archivado en Expediente del alumno · \d+-\w{3}-\d{4} · /.test(e.verde)), true);

console.log('--- 5. en blanco ---');
await comprobar('Publicado y Cobro en blanco las dejan hechas', (async () => {
  await pagina.evaluate(async () => { const a = FichaNucleo.actual; const hs = await Hitos.hitosDe(a.nombre); const h = hs.filter((x) => x.clase !== 'decision' && x.estado !== 'hecho')[0];
    await Hitos.anadirGuionPropio(a.nombre, h.id, 'Publicar en blanco', { accion: 'publicar' }); await Hitos.anadirGuionPropio(a.nombre, h.id, 'Cobrar en blanco', { accion: 'cobrar' }); HitosPanel.programarRepintado(); });
  await pagina.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Cobrar en blanco"))');
  const res = [];
  for (const n of ['Publicar en blanco', 'Cobrar en blanco']) { await tarea(n).locator('.guion-hecha-boton').click(); await ventana(); await pagina.click('#th-ok'); await ventanaCerrada(); res.push((await estadoDe(n)).verde.replace(/ · .*$/, '')); }
  return res;
})(), ['✔ Publicado', '✔ Cobro']);

console.log('--- 6. consola ---');
await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
