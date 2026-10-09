/* Fila 321 (docs/PLANTILLAS-FUERA-DE-USO.md): dejar una plantilla «fuera de uso» y volver a activarla. Con Chromium real y la
   copia de pruebas (`fueradeuso=1`). */
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

async function abrir(parametros, antes) {
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1&auto=1' + (parametros || ''));
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
  await pagina.waitForTimeout(2500);
  return pagina;
}
async function abrirPlantillas(p, pestana) {
  await p.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-plantillas').open = true; });
  await p.waitForFunction(() => /\d+ de Word/.test(document.getElementById('plantillas-resumen').textContent), null, { timeout: 15000 });
  await p.click('#plantillas-abrir');
  await p.waitForSelector('.pt-tabla');
  if (pestana === 'correo') { await p.click('[data-pestana="correo"]'); await p.waitForTimeout(200); }
}
const fila = (p, nombre) => p.locator('.pt-tabla tbody tr').filter({ has: p.locator('.pt-nombre', { hasText: nombre }) });
const nombres = (p) => p.evaluate(() => [...document.querySelectorAll('.pt-tabla tbody tr .pt-nombre')].map((c) => c.firstChild.textContent.trim()));
const pestanas = (p) => p.locator('.pt-pestana').allTextContents();
async function abrirMenu(p, nombre) { await fila(p, nombre).locator('summary').click(); }
const marcaEnDisco = (p, nombre) => p.evaluate(async (n) => {
  const d = await Plantillas.cargar(App.E.gestor);
  const x = d.documentos.concat(d.lista).filter((y) => y.nombre === n)[0];
  return x ? !!x.fueraDeUso : null;
}, nombre);
async function dejarFuera(p, nombre) {
  await abrirMenu(p, nombre);
  await fila(p, nombre).locator('[data-accion="fuera"]').click();
  await p.waitForSelector('#capa:not(.oculto)');
  await p.click('#cuadro-aceptar');
  await p.waitForFunction((n) => [...document.querySelectorAll('.pt-tabla tbody tr')].some((r) => r.classList.contains('pt-fuera') && r.textContent.indexOf(n) !== -1), nombre, { timeout: 10000 });
}

/* ---------- 1, 2, 3: el cuadro, el gris, Deshacer ---------- */
console.log('--- 1 a 3. dejar fuera de uso ---');
let p = await abrir('');
await abrirPlantillas(p);
await abrirMenu(p, 'Certificado de notas');
await fila(p, 'Certificado de notas').locator('[data-accion="fuera"]').click();
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('1. el cuadro dice cuántos hitos y de cuántos tipos, y los lista', p.evaluate(() => {
  const t = document.getElementById('cuadro-cuerpo').textContent;
  return [document.getElementById('cuadro-titulo').textContent, /La usa 1 hito de 1 tipo de asunto:/.test(t), /CERTIFICADO DE NOTAS · Hito 1 · Preparar y enviar el certificado/.test(t),
    /no generan nada hasta que les pongas otra plantilla o vuelvas a activar esta/.test(t), /Deja de ofrecerse al generar un documento o al preparar un correo/.test(t),
    document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent];
}), ['Dejar fuera de uso «Certificado de notas»', true, true, true, true, 'Dejar fuera de uso', 'Cancelar']);
await p.click('#cuadro-cancelar');
await comprobar('2. «Cancelar»: no cambia nada', marcaEnDisco(p, 'Certificado de notas'), false);
await abrirMenu(p, 'Certificado de notas');
await fila(p, 'Certificado de notas').locator('[data-accion="fuera"]').click();
await p.waitForSelector('#capa:not(.oculto)');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.querySelector('.pt-fuera'), null, { timeout: 10000 });
await comprobar('3. aviso verde con «Deshacer»', p.evaluate(() => { const m = [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /queda fuera de uso/.test(x.textContent))[0]; return m && [m.firstChild.textContent, m.querySelector('button').textContent]; }), ['«Certificado de notas» queda fuera de uso.', 'Deshacer']);
await comprobar('3. la línea en gris, al final, con la etiqueta y la fecha', p.evaluate(() => {
  const filas = [...document.querySelectorAll('.pt-tabla tbody tr')], ultima = filas[filas.length - 1];
  const hoy = new Date(), f = String(hoy.getDate()).padStart(2, '0') + '/' + String(hoy.getMonth() + 1).padStart(2, '0') + '/' + hoy.getFullYear();
  return [ultima.classList.contains('pt-fuera'), ultima.textContent.indexOf('Certificado de notas') !== -1, ultima.textContent.indexOf('Fuera de uso desde el ' + f) !== -1];
}), [true, true, true]);
await comprobar('3. la pestaña cuenta las dos cosas', pestanas(p).then((t) => /^Word \(\d+ · 1 fuera de uso\)$/.test(t[0])), true);
await comprobar('3. plantillas.json lleva la marca', marcaEnDisco(p, 'Certificado de notas'), true);
await comprobar('3. el bloque de Herramientas la cuenta', (async () => { await p.click('#pt-volver'); await p.waitForTimeout(300); return p.evaluate(() => /· 1 fuera de uso$/.test(document.getElementById('plantillas-resumen').textContent)); })(), true);
await p.click('#plantillas-abrir');
await p.waitForSelector('.pt-tabla');
await p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /queda fuera de uso/.test(x.textContent))[0] && [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /queda fuera de uso/.test(x.textContent))[0].querySelector('button').click());
await p.waitForFunction(() => !document.querySelector('.pt-fuera'), null, { timeout: 10000 });
await comprobar('4. «Deshacer» la quita', marcaEnDisco(p, 'Certificado de notas'), false);

/* ---------- 6: sin hitos ---------- */
await abrirMenu(p, 'Nota de baja médica');
await fila(p, 'Nota de baja médica').locator('[data-accion="fuera"]').click();
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('5. una que no usa ningún hito: «No la usa ningún hito.»', p.evaluate(() => document.getElementById('cuadro-cuerpo').textContent.indexOf('No la usa ningún hito.') !== -1), true);
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.querySelector('.pt-fuera'), null, { timeout: 10000 });

/* ---------- 3 bis: Cambiar conserva la marca ---------- */
console.log('--- Cambiar conserva la marca ---');
await fila(p, 'Nota de baja médica').locator('[data-accion="cambiar"]').click();
await p.waitForSelector('#pd-nombre');
await p.fill('#pd-nombre', 'Nota de baja cambiada');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.body.textContent.indexOf('Nota de baja cambiada') !== -1 && document.querySelector('.pt-tabla'), null, { timeout: 10000 });
await comprobar('6. Word: «Cambiar» una fuera de uso y guardar: sigue fuera de uso', Promise.all([marcaEnDisco(p, 'Nota de baja cambiada'), fila(p, 'Nota de baja cambiada').evaluate((r) => r.classList.contains('pt-fuera'))]), [true, true]);

/* ---------- 7: la casilla ---------- */
await p.check('#pt-fuera');
await comprobar('7. la casilla «Fuera de uso» deja solo las fuera de uso', nombres(p), ['Nota de baja cambiada']);
await p.uncheck('#pt-fuera');

/* ---------- 8, 9: correo ---------- */
console.log('--- correo ---');
await p.click('[data-pestana="correo"]');
await p.waitForTimeout(200);
await abrirMenu(p, 'Aviso de avance');
await comprobar('8. «Aviso de avance»: «Dejar fuera de uso…» apagado', p.evaluate(() => {
  const b = [...document.querySelectorAll('.pt-tabla tbody tr')].filter((r) => r.children[0].textContent.indexOf('Aviso de avance') === 0)[0].querySelector('[data-accion="fuera"]');
  return [b.disabled, b.title];
}), [true, 'La aplicación la necesita para avisar a quien lo pide.']);
await abrirMenu(p, 'Aviso de avance');
await dejarFuera(p, 'Confirmación de matrícula');
await fila(p, 'Confirmación de matrícula').locator('[data-accion="cambiar"]').click();
await p.waitForSelector('#pl-nombre');
await p.fill('#pl-nombre', 'Confirmación cambiada');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.body.textContent.indexOf('Confirmación cambiada') !== -1 && document.querySelector('.pt-tabla'), null, { timeout: 10000 });
await comprobar('6. correo: «Cambiar» una fuera de uso y guardar: sigue fuera de uso', marcaEnDisco(p, 'Confirmación cambiada'), true);
await comprobar('9. y en el desplegable del cuadro de Correo de un asunto de su tipo no sale', p.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => /MATRICULA/.test((x.leido && x.leido.tipo) || (x.ficha && x.ficha.tipo) || ''))[0];
  CorreoNucleo.abrirCuadro(a, false);
  for (let i = 0; i < 40 && !document.getElementById('correo-plantilla'); i++) await new Promise((r) => setTimeout(r, 250));
  const s = document.getElementById('correo-plantilla');
  const opciones = s ? [...s.options].map((o) => o.textContent) : null;
  document.getElementById('cuadro-cancelar').click();
  return opciones && opciones.indexOf('Confirmación cambiada') === -1;
}), true);
await comprobar('4. una de Word fuera de uso no sale en «Buscar otra plantilla…»', p.evaluate(async () => {
  const caja = document.createElement('div');
  document.body.appendChild(caja);
  await PlantillaBuscar.montar(caja, function () {});
  const t = caja.textContent;
  caja.remove();
  return t.indexOf('Nota de baja cambiada') === -1 && t.indexOf('Justificante de pago') !== -1;
}), true);

/* ---------- 9: volver a activar ---------- */
await p.click('[data-pestana="word"]');
await abrirMenu(p, 'Nota de baja cambiada');
await comprobar('9. dentro del «⋮» ahora dice «Volver a activar»', fila(p, 'Nota de baja cambiada').locator('[data-accion="activar"]').textContent(), 'Volver a activar');
await fila(p, 'Nota de baja cambiada').locator('[data-accion="activar"]').click();
await p.waitForFunction(() => !document.querySelector('.pt-fuera'), null, { timeout: 10000 });
await comprobar('9. «Volver a activar»: deja de estar en gris y vuelve a ofrecerse', Promise.all([marcaEnDisco(p, 'Nota de baja cambiada'), p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje.bueno')].some((x) => /vuelve a estar en uso/.test(x.textContent)))]), [false, true]);
await p.close();

/* ---------- 6, 7, 8, 10, 11: fueradeuso=1 ---------- */
console.log('--- fueradeuso=1 ---');
p = await abrir('&fueradeuso=1');
async function abrirMesa(frag) {
  await p.click('button.pestana[data-pantalla="abiertos"]');
  await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]');
  await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + frag + '"] .tarjeta-nombre').first().click();
  await p.waitForTimeout(1200);
  await p.evaluate(() => FichaTarjetas.abrir('hitos'));
  await p.waitForTimeout(400);
  if (!(await p.locator('#ficha-guia.con-mesa').count())) await p.locator('#ficha-guia .hito .hito-titulo').first().click();
  await p.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
  await p.waitForTimeout(800);
}
const ficheros = (frag) => p.evaluate(async (f) => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(f) !== -1)[0]; return (await Carpetas.ficheros(a.handle)).map((x) => x.nombre).sort(); }, frag);
await abrirMesa('Vidal Soto');
const antes = await ficheros('Vidal Soto');
await comprobar('10. en la mesa, la tarea de generar lleva «plantilla fuera de uso»', p.evaluate(() => document.querySelector('.hito-en-mesa .guion-fuera-de-uso').textContent), 'plantilla fuera de uso');
await p.evaluate(() => document.querySelector('.hito-en-mesa .mesa-receta').click());   /* está dentro del menú «Generar documento ▾» */
await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje.ambar')].some((m) => /está fuera de uso/.test(m.textContent)), null, { timeout: 10000 });
await comprobar('10. su botón da el aviso ámbar con la plantilla y dónde activarla, y no crea ningún fichero', Promise.all([
  p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje.ambar')].filter((m) => /está fuera de uso/.test(m.textContent))[0].textContent),
  ficheros('Vidal Soto').then((f) => JSON.stringify(f) === JSON.stringify(antes)), p.evaluate(() => !document.getElementById('word-visor') || document.getElementById('word-visor').classList.contains('oculto'))]),
  ['La plantilla «Certificado de notas» está fuera de uso. Vuelve a activarla en Herramientas → Plantillas, o pon otra en la tarea.', true, true]);
await comprobar('11. «Generar documento ▾»: no ofrece la fuera de uso', p.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const lista = await PlantillasDocumento.plantillasDelAsunto(a);
  return lista.map((x) => x.nombre).indexOf('Certificado de notas');
}), -1);
await p.evaluate(() => { document.querySelectorAll('#mensajes .mensaje').forEach((m) => m.remove()); });
await comprobar('12. «Hacer este hito» se para con el mismo aviso y el hito no queda hecho', (async () => {
  const b = p.locator('.hito-en-mesa .mesa-hacer-hito:not([disabled])').first();
  await b.click();
  await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje.ambar')].some((m) => /está fuera de uso/.test(m.textContent)), null, { timeout: 15000 });
  await p.waitForTimeout(800);
  return Promise.all([p.evaluate(async () => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0]; return (await Hitos.hitosDe(a.nombre))[0].estado !== 'hecho'; }),
    ficheros('Vidal Soto').then((f) => JSON.stringify(f) === JSON.stringify(antes))]);
})(), [true, true]);

console.log('--- editor de la guía y tipo ---');
await comprobar('13. en el editor de la guía: la tarea lleva la marca y su desplegable la enseña con «(fuera de uso)»', p.evaluate(async () => {
  const pasos = GuiasDelCentro.pasosDe('CERTIFICADO DE NOTAS');
  const html = GuiasGuion.bloqueHTML(pasos[0].guion);
  const caja = document.createElement('div');
  caja.innerHTML = html;
  const opciones = [...caja.querySelectorAll('.guion-receta-plantilla option')].map((o) => o.textContent);
  const otra = document.createElement('div');
  otra.innerHTML = GuiasGuion.bloqueHTML([{ id: 'x1', texto: 'Otra tarea', accion: 'generar', receta: {} }]);
  const deOtra = [...otra.querySelectorAll('.guion-receta-plantilla option')].map((o) => o.textContent);
  return [caja.textContent.indexOf('plantilla fuera de uso') !== -1, opciones.some((t) => /Certificado de notas.*\(fuera de uso\)/.test(t)), deOtra.some((t) => /Certificado de notas/.test(t))];
}), [true, true, false]);
await p.evaluate(async () => { await App.abrirTipoDeAsunto((App.E.tipos || []).filter((t) => t.tipo === 'CERTIFICADO DE NOTAS')[0]); });
await p.waitForSelector('#tipo-pd-lista .tarjeta-tipo', { state: 'attached', timeout: 15000 });
await comprobar('14. en la pantalla del tipo: la tarjeta en gris con la etiqueta y «Volver a activar»; la lista de comprobación, pendiente', p.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 600));
  const t = document.querySelector('#tipo-pd-lista .tarjeta-fuera-de-uso');
  const comp = document.getElementById('tipo-asunto-comprobacion').textContent;
  return [!!t, t && /Fuera de uso desde el/.test(t.textContent), t && [...t.querySelectorAll('button')].some((b) => b.textContent === 'Volver a activar'), /Plantilla de documento/.test(comp)];
}), [true, true, true, true]);
await p.evaluate(() => [...document.querySelectorAll('#tipo-pd-lista .tarjeta-fuera-de-uso button')].filter((b) => b.textContent === 'Volver a activar')[0].click());
await p.waitForFunction(() => !document.querySelector('#tipo-pd-lista .tarjeta-fuera-de-uso'), null, { timeout: 10000 });
await comprobar('15. «Volver a activar»: la tarjeta deja de estar en gris y la tarea ya no lleva la marca', p.evaluate(async () => {
  await Plantillas.cargar(App.E.gestor);
  const g = GuiasDelCentro.pasosDe('CERTIFICADO DE NOTAS')[0].guion.filter((x) => x.accion === 'generar')[0];
  return Plantillas.fueraDeUsoDeLaTarea(g) === null;
}), true);
await p.close();

/* ---------- 16: solo consultar ---------- */
console.log('--- solo consultar ---');
p = await abrir('&fueradeuso=1', "try { localStorage.setItem('gestor.soloConsulta', '1'); } catch (e) {}");
await p.waitForSelector('#franja-solo-consulta', { timeout: 30000 });
await abrirPlantillas(p);
await p.waitForTimeout(800);
await abrirMenu(p, 'Justificante de pago');
await comprobar('16. «Dejar fuera de uso…» y «Volver a activar» apagadas', p.evaluate(() => {
  const f = (n) => [...document.querySelectorAll('.pt-tabla tbody tr')].filter((r) => r.children[0].textContent.indexOf(n) === 0)[0];
  return [f('Justificante de pago').querySelector('[data-accion="fuera"]').disabled, f('Certificado de notas').querySelector('[data-accion="activar"]').disabled];
}), [true, true]);
await p.close();

console.log('--- sin errores ---');
await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de «plantillas fuera de uso» pasan.');
