/* Fila 671 (15-nov-2026, docs/671-ACCIONES-QUE-HACEN-ALGO-1.md, tema 665): las tareas con ventana, con Chromium real y los datos de la
   copia de pruebas (?demo=1&auto=1), en SANCION de Fuentes Calvo:
   1. «Grabar o cambiar datos», «Entregar», «Recoger» y «Comprobar» no llevan casilla; «Llamar» y «Otra cosa», sí.
   2. «Cómo se hace» escrito en «Cambiar» sale plegado, con los pasos numerados; vacío, no sale; no sale en «+ Añadir tarea».
   3. «Grabado» enseña los pasos y «Copiar los pasos»; sin pasos, el aviso; guardar en blanco la deja hecha, con línea verde y Registro.
   4. «Entregado» / «Recogido» proponen la persona de «A quién» / «De quién», se puede cambiar; línea verde y Registro.
   5. «Está bien» marca al momento; «Falta algo» deja la tarea sin hacer, en rojo; «Está bien» después la marca.
   6. «Deshacer» (menú ⋮) la deja sin hacer y queda en el Registro; no sale en las tareas con casilla.
   7. Una versión anterior no pierde `como`, `hechoCon` ni `falta` (Hitos.normalizar y la normalización de la guía).
   8. Consola sin errores. */
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
/* Las tareas nuevas, creadas por el formulario de siempre («Qué se hace» se busca escribiendo). */
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
  return t ? {
    casilla: !!t.querySelector('.guion-casilla'), hecho: t.classList.contains('hecho'), rojo: t.classList.contains('con-falta'),
    botones: [...t.querySelectorAll('.guion-hecha-boton')].map((b) => b.textContent.trim()),
    verde: (t.querySelector('.guion-hecha-linea') || {}).textContent || '', falta: (t.querySelector('.guion-falta-linea') || {}).textContent || '',
    como: !!t.querySelector('details.guion-como')
  } : null;
}, nombre);
async function menu(nombre) {
  await tarea(nombre).locator('.guion-tarea-menu-boton').click();
  await pagina.waitForTimeout(200);
  return pagina.evaluate(() => [...document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')].map((b) => b.textContent.trim()));
}

console.log('--- 1. sin casilla ---');
await anadirTarea('Grabar la sanción', 'Grabar o cambiar datos · Séneca · Alumnado');
await anadirTarea('Entregar el acuse', 'Entregar · En mano');
await anadirTarea('Recoger el recibí', 'Recoger · En mano');
await anadirTarea('Comprobar los datos', 'Comprobar');
await anadirTarea('Llamar sin casilla no', 'Llamar · Teléfono');
await anadirTarea('Otra cosa con casilla', 'Otra cosa');
await comprobar('Grabar: sin casilla, botón «Grabado»', estadoDe('Grabar la sanción').then((e) => [e.casilla, e.botones]), [false, ['Grabado']]);
await comprobar('Entregar: sin casilla, botón «Entregado»', estadoDe('Entregar el acuse').then((e) => [e.casilla, e.botones]), [false, ['Entregado']]);
await comprobar('Recoger: sin casilla, botón «Recogido»', estadoDe('Recoger el recibí').then((e) => [e.casilla, e.botones]), [false, ['Recogido']]);
await comprobar('Comprobar: sin casilla, «Está bien» y «Falta algo»', estadoDe('Comprobar los datos').then((e) => [e.casilla, e.botones]), [false, ['Está bien', 'Falta algo']]);
await comprobar('Llamar y Otra cosa siguen con casilla', Promise.all([estadoDe('Llamar sin casilla no'), estadoDe('Otra cosa con casilla')]).then((l) => l.map((e) => e.casilla)), [true, true]);

console.log('--- 2. «Cómo se hace» ---');
await tarea('Grabar la sanción').locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: /^Cambiar$/ }).first().click();
await pagina.waitForSelector('.guion-tarea-editar .donde-como', { timeout: 8000 });
await pagina.fill('.guion-tarea-editar .donde-como', 'Entra en Séneca\n  Abre Alumnado  \n\nGraba la sanción');
await pagina.locator('.guion-tarea-editar .donde-como').blur();
await pagina.click('.guion-tarea-editar-guardar');
await pagina.waitForTimeout(1500);
await comprobar('«Cómo se hace» sale plegado y con los pasos numerados (sin líneas vacías)', pagina.evaluate(() => {
  const d = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Grabar la sanción')[0].querySelector('details.guion-como');
  return d ? { abierto: d.open, resumen: d.querySelector('summary').textContent, pasos: [...d.querySelectorAll('ol li')].map((l) => l.textContent) } : null;
}), { abierto: false, resumen: 'Cómo se hace', pasos: ['Entra en Séneca', 'Abre Alumnado', 'Graba la sanción'] });
await comprobar('sin pasos, «Cómo se hace» no sale', estadoDe('Entregar el acuse').then((e) => e.como), false);
await pagina.click('.tcd-abrir-form');
await comprobar('en «+ Añadir tarea» no sale la casilla «Cómo se hace»', pagina.evaluate(() => { document.querySelector('.tcd-nueva .at-que').value = 'Entregar · En mano'; document.querySelector('.tcd-nueva .at-que').dispatchEvent(new Event('input', { bubbles: true })); return document.querySelectorAll('.tcd-nueva .donde-como').length; }), 0);
await pagina.click('.tcd-nueva .at-cancelar');

console.log('--- 3. Grabado ---');
await tarea('Grabar la sanción').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('la ventana enseña los pasos y «Copiar los pasos»', pagina.evaluate(() => ({
  titulo: document.getElementById('th-titulo').textContent, pasos: [...document.querySelectorAll('.th-pasos li')].map((l) => l.textContent),
  copiar: !!document.getElementById('th-copiar'), fecha: document.getElementById('th-fecha').value === new Date().toISOString().slice(0, 10) || document.getElementById('th-fecha').value.length === 10
})), { titulo: 'Grabado · Grabar la sanción', pasos: ['Entra en Séneca', 'Abre Alumnado', 'Graba la sanción'], copiar: true, fecha: true });
await pagina.click('#th-no');
await ventanaCerrada();
await comprobar('cancelar no marca nada', estadoDe('Grabar la sanción').then((e) => e.hecho), false);
await tarea('Grabar la sanción').locator('.guion-hecha-boton').click();
await ventana();
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('guardar en blanco la deja hecha, sin botón, con su línea verde', estadoDe('Grabar la sanción').then((e) => [e.hecho, e.botones, /^✔ Grabado · \d+-\w{3}-\d{4} · /.test(e.verde)]), [true, [], true]);
await comprobar('y queda en el Registro', registro().then((l) => l.some((t) => t.indexOf('Tarea hecha: Grabar la sanción — Grabado') === 0)), true);

console.log('--- 4. Entregado y Recogido ---');
await tarea('Entregar el acuse').locator('.guion-hecha-boton').click();
await ventana();
const lista = await pagina.evaluate(() => [...document.querySelectorAll('#th-persona option')].map((o) => o.textContent));
await comprobar('«A quién se entrega» ofrece Dirección, Jefatura de Estudios y Secretaría al final, y «Tutor/a»', Promise.resolve(lista.slice(-4)), ['Tutor/a', 'Dirección', 'Jefatura de Estudios', 'Secretaría']);
await comprobar('sale el tercero con su nombre', Promise.resolve(/Fuentes Calvo/.test(lista.join('|'))), true);
await pagina.selectOption('#th-persona', { label: 'Dirección' });
await pagina.fill('#th-nota', 'En su despacho');
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('línea verde «Entregado a Dirección»', estadoDe('Entregar el acuse').then((e) => [e.hecho, /^✔ Entregado a Dirección · \d+-\w{3}-\d{4} · .+ · En su despacho$/.test(e.verde)]), [true, true]);
await comprobar('Registro: Entregado a Dirección y la nota', registro().then((l) => l.some((t) => /^Tarea hecha: Entregar el acuse — Entregado a Dirección \(.+\)\. En su despacho$/.test(t))), true);
await tarea('Recoger el recibí').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('«De quién se recoge»', pagina.evaluate(() => document.querySelector('label[for="th-persona"]').textContent), 'De quién se recoge');
await pagina.selectOption('#th-persona', { label: 'Secretaría' });
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('línea verde «Recogido de Secretaría»', estadoDe('Recoger el recibí').then((e) => /^✔ Recogido de Secretaría · /.test(e.verde)), true);

console.log('--- 4b. «A quién» y «De quién» en la guía y la persona propuesta ---');
await comprobar('«Entregar» pide «A quién» con siete papeles; «Recoger», «De quién»; «Llamar» sigue con los suyos', pagina.evaluate(() => {
  const ver = (accion, aQuien) => { const d = document.createElement('div'); d.innerHTML = DondeCampo.html({ accion, aQuien, como: 'a\nb' });
    return { rotulo: [...d.querySelectorAll('.etiqueta')].map((e) => e.textContent).filter((x) => /quién/.test(x))[0], valor: (d.querySelector('.donde-a-quien') || {}).value,
      opciones: [...d.querySelectorAll('datalist')].pop().querySelectorAll('option').length, como: d.querySelector('.donde-como').value }; };
  return [ver('entregar', 'direccion'), ver('recoger', 'jefatura'), ver('llamar', 'profesores')];
}), [{ rotulo: 'A quién', valor: 'Dirección', opciones: 7, como: 'a\nb' }, { rotulo: 'De quién', valor: 'Jefatura de Estudios', opciones: 7, como: 'a\nb' },
     { rotulo: 'A quién', valor: 'Sus profesores', opciones: 4, como: 'a\nb' }]);
await comprobar('la guía guarda «como» y «A quién» de Entregar y los pasa a la tarea del asunto', pagina.evaluate(() => {
  const l = GuiasGuion.normalizar([{ id: 'g1', texto: 'Entregar', accion: 'entregar', aQuien: 'secretaria', como: 'uno' }, { id: 'g2', texto: 'Otra', accion: '', como: 'dos' }]);
  return l.map((x) => [x.aQuien || '', x.como || '']);
}), [['secretaria', 'uno'], ['', 'dos']]);
await pagina.evaluate(async () => {
  const a = FichaNucleo.actual; const hitos = await Hitos.hitosDe(a.nombre);
  const h = hitos.filter((x) => x.clase !== 'decision' && x.estado !== 'hecho')[0];
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Entregar a jefatura', { accion: 'entregar', aQuien: 'jefatura', como: 'Lleva el papel' });
  HitosPanel.programarRepintado();
});
await pagina.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("Entregar a jefatura"))');
await comprobar('la tarea trae «Cómo se hace»', estadoDe('Entregar a jefatura').then((e) => e.como), true);
await tarea('Entregar a jefatura').locator('.guion-hecha-boton').click();
await ventana();
await comprobar('«Entregado» propone la persona de «A quién» de la tarea (Jefatura de Estudios)', pagina.evaluate(() => { const s = document.getElementById('th-persona'); return s.options[s.selectedIndex].textContent; }), 'Jefatura de Estudios');
await pagina.selectOption('#th-persona', { label: 'Tutor/a' });
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('se puede cambiar: sale «Entregado a Tutor/a»', estadoDe('Entregar a jefatura').then((e) => /^✔ Entregado a Tutor\/a · /.test(e.verde)), true);

console.log('--- 5. Comprobar ---');
await tarea('Comprobar los datos').locator('.guion-hecha-boton', { hasText: 'Falta algo' }).click();
await ventana();
await pagina.fill('#th-nota', 'Falta el NIE');
await pagina.click('#th-ok');
await ventanaCerrada();
await comprobar('«Falta algo»: sigue sin hacer, en rojo, con «Falta: …» y los dos botones', estadoDe('Comprobar los datos').then((e) => [e.hecho, e.rojo, /^Falta: Falta el NIE · \d+-\w{3}-\d{4} · /.test(e.falta), e.botones]), [false, true, true, ['Está bien', 'Falta algo']]);
await comprobar('«Falta algo» queda en el Registro', registro().then((l) => l.some((t) => t === 'Tarea «Comprobar los datos»: falta: Falta el NIE')), true);
await tarea('Comprobar los datos').locator('.guion-hecha-boton', { hasText: 'Está bien' }).click();
await pagina.waitForFunction(() => [...document.querySelectorAll('.guion-paso')].some((x) => x.querySelector('.guion-paso-texto').textContent === 'Comprobar los datos' && x.classList.contains('hecho')), null, { timeout: 8000 });
await comprobar('«Está bien» la marca hecha al momento, sin ventana, y quita el «Falta»', estadoDe('Comprobar los datos').then((e) => [e.hecho, e.rojo, e.falta, /^✔ Comprobado: está bien · /.test(e.verde)]), [true, false, '', true]);

console.log('--- 6. Deshacer ---');
await comprobar('Deshacer sale en una tarea hecha sin casilla', menu('Grabar la sanción').then((l) => l.indexOf('Deshacer') !== -1), true);
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: /^Deshacer$/ }).first().click();
await pagina.waitForFunction(() => [...document.querySelectorAll('.guion-paso')].some((x) => x.querySelector('.guion-paso-texto').textContent === 'Grabar la sanción' && !x.classList.contains('hecho')), null, { timeout: 8000 });
await comprobar('la tarea vuelve a estar sin hacer, con su botón y sin línea verde', estadoDe('Grabar la sanción').then((e) => [e.hecho, e.botones, e.verde]), [false, ['Grabado'], '']);
await comprobar('«Deshacer» queda en el Registro', registro().then((l) => l.some((t) => t === 'Tarea «Grabar la sanción»: deshecha, vuelve a estar sin hacer')), true);
await comprobar('«Deshacer» no sale en una tarea con casilla hecha', (async () => {
  await tarea('Otra cosa con casilla').locator('.guion-casilla').check();
  await pagina.waitForTimeout(800);
  return (await menu('Otra cosa con casilla')).indexOf('Deshacer') !== -1;
})(), false);
await pagina.keyboard.press('Escape');

console.log('--- 7. una versión anterior no pierde lo apuntado ---');
await comprobar('Hitos.normalizar conserva hechoCon y falta; la guía conserva «como»', pagina.evaluate(() => {
  const h = Hitos.normalizarHito({ id: 'h1', titulo: 'X', guionHecho: { t1: { hecho: true, hechoCon: { texto: '✔ ok' } }, t2: { falta: { texto: 'f' } } }, guionPropio: [{ id: 'gp1', texto: 'Algo', como: 'uno' }] });
  const g = GuiasGuion.normalizar([{ id: 'g1', texto: 'Algo', accion: 'seneca', como: ' uno \n\n dos ' }])[0];
  return { hechoCon: !!(h && h.guionHecho.t1.hechoCon), falta: !!(h && h.guionHecho.t2.falta), como: g.como, propioComo: h.guionPropio[0].como };
}), { hechoCon: true, falta: true, como: 'uno\ndos', propioComo: 'uno' });

console.log('--- 8. consola ---');
await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
