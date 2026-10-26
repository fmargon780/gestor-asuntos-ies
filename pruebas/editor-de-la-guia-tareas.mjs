/* Prueba en navegador de verdad de la fila 464, parte B
   (docs/EDITOR-DE-LA-GUIA-CLARO.md): cada tarea del hito en una línea, que se abre
   al pulsarla.

   1. Cada tarea ocupa una línea (texto, lo que hace en gris, «▸»); cerradas, no enseñan más.
   2. Al pulsarla se abre ahí mismo (solo una a la vez) con «Texto de la tarea», ↑, ↓ y «Quitar»
      en la misma línea, «Qué se hace» y, si comunica, «A quién», «Por dónde» y «Plantilla de correo».
   3. «Más de esta tarea», plegado, con la explicación, la normativa, el enlace, «Hay que reunirlo»
      y «Esta tarea es una pregunta…».
   4. «Obligatorio» y «Un documento / Un dato» solo salen con «Hay que reunirlo» marcado.
   5. «+ Añadir una tarea» añade una tarea abierta con el cursor en su texto.
   6. Una tarea que es pregunta dice «Pregunta · N respuestas».
   7. Guardar sin tocar nada deja la guía igual; lo cambiado en una tarea se guarda.
   8. «Abrir en la guía» (opciones.irA + opciones.tarea) abre el editor con ese hito elegido y esa
      tarea abierta y resaltada, y el aviso de arriba.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}


await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const GUIA = [
  { id: 'p1', titulo: 'Recibir el parte de baja', responsable: 'r1',
    guion: [{ id: 'g1', texto: 'Acusar recibo del parte', accion: 'comunicar', receta: { a: 'tutoria', via: 'correo', plantilla: '' } },
            { id: 'g2', texto: 'Sellar el parte', explicacion: 'Con el sello grande' },
            { id: 'g3', texto: '¿Viene completo?', pregunta: true, opciones: [
              { id: 'o1', texto: 'Sí', lineas: [] }, { id: 'o2', texto: 'No', lineas: [{ id: 'l1', texto: 'Pedir lo que falta' }] }] },
            { id: 'g4', texto: 'Archivar el parte', reunir: 'documento', obligatorio: true }] },
  { id: 'q1', titulo: '¿Cómo ha llegado?', opciones: [
    { id: 'a', titulo: 'En mano', pasos: [{ id: 'a1', titulo: 'Poner el sello', guion: [{ id: 'ga', texto: 'Estampar', accion: 'generar' }] }] },
    { id: 'b', titulo: 'Por correo', pasos: [] } ] },
  { id: 'p3', titulo: 'Archivar' }
];
const RESP = [{ id: 'r1', nombre: 'Secretaría' }];

const F = (id) => '#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila[data-id="' + id + '"]';
async function abrir(opciones) {
  await pagina.evaluate(([GUIA, RESP, opciones]) => {
    window.__guardada = Guias.editar('FACTURA', JSON.parse(JSON.stringify(GUIA)), RESP, [], opciones);
  }, [GUIA, RESP, opciones || null]);
  await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
}
const abiertas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila.guion-abierta')).map(f => f.dataset.id));
const visible = (sel) => pagina.evaluate((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, sel);

/* ================= 1 ================= */
console.log('--- 1. una línea por tarea ---');
await abrir();
await comprobar('cada tarea: su texto, lo que hace en gris y «▸»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila')).map(f => [
    f.querySelector(':scope > .guion-resumen .guion-resumen-texto').textContent,
    f.querySelector(':scope > .guion-resumen .guion-resumen-que').textContent,
    getComputedStyle(f.querySelector(':scope > .guion-resumen .guion-resumen-flecha'), '::before').content])),
  [['Acusar recibo del parte', 'Comunicar · Tutor/a del grupo · por correo', '"▸"'], ['Sellar el parte', 'Sin acción', '"▸"'],
   ['¿Viene completo?', 'Pregunta · 2 respuestas', '"▸"'], ['Archivar el parte', 'Sin acción', '"▸"']]);
await comprobar('cerradas, solo se ve la línea (sin campos)',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila')).map(f =>
    [f.querySelector('.guion-texto').offsetParent === null, f.getBoundingClientRect().height < 60])), [[true, true], [true, true], [true, true], [true, true]]);
await comprobar('ninguna abierta al empezar', abiertas(), []);

/* ================= 2 ================= */
console.log('--- 2. abrir una tarea ---');
await pagina.click(F('g1') + ' > .guion-resumen');
await comprobar('se abre ahí mismo', abiertas(), ['g1']);
await comprobar('«Texto de la tarea», ↑, ↓ y «Quitar» en la misma línea',
  pagina.evaluate((s) => {
    const f = document.querySelector(s);
    const y = (q) => Math.round(f.querySelector(q).getBoundingClientRect().top);
    return [f.querySelector('.guion-linea-texto .etiqueta').textContent,
      Array.from(f.querySelectorAll('.guion-linea-texto .requisito-mandos .boton')).map(b => b.textContent),
      Math.abs(y('.guion-texto') - y('.guion-subir')) < 30];
  }, F('g1')), ['Texto de la tarea', ['↑', '↓', 'Quitar'], true]);
await comprobar('«Qué se hace» con sus cinco opciones, y para «Comunicar»: «A quién», «Por dónde» y «Plantilla de correo»',
  pagina.evaluate((s) => {
    const f = document.querySelector(s);
    return [f.querySelector('.guion-linea-accion .etiqueta').textContent,
      Array.from(f.querySelectorAll('.guion-accion option')).map(o => o.textContent),
      Array.from(f.querySelectorAll('.guion-receta .etiqueta')).map(e => e.textContent),
      f.querySelector('.guion-receta-a').value, f.querySelector('.guion-receta-via').value];
  }, F('g1')),
  ['Qué se hace', ['Sin acción (se marca a mano)', 'Generar un documento', 'Registrar un documento', 'Comunicar', 'Añadir un documento'],
   ['A quién', 'Por dónde', 'Plantilla de correo'], 'tutoria', 'correo']);
await pagina.locator(F('g1') + ' .guion-accion').selectOption('generar');
await comprobar('con «Generar un documento»: «Plantilla de documento»; la línea lo dice y la tarea sigue abierta',
  pagina.evaluate((s) => {
    const f = document.querySelector(s);
    return [Array.from(f.querySelectorAll('.guion-receta .etiqueta')).map(e => e.textContent),
      f.querySelector(':scope > .guion-resumen .guion-resumen-que').textContent, f.classList.contains('guion-abierta')];
  }, F('g1')), [['Plantilla de documento'], 'Generar un documento', true]);
await pagina.locator(F('g1') + ' .guion-accion').selectOption('registrar');
await comprobar('con «Registrar un documento»: «Entrada o salida»',
  pagina.evaluate((s) => Array.from(document.querySelectorAll(s + ' .guion-receta .etiqueta')).map(e => e.textContent), F('g1')), ['Entrada o salida']);
await pagina.locator(F('g1') + ' .guion-accion').selectOption('comunicar');
await pagina.fill(F('g1') + ' .guion-texto', 'Acusar recibo del parte médico');
await comprobar('la línea sigue lo que se escribe',
  pagina.evaluate((s) => document.querySelector(s + ' > .guion-resumen .guion-resumen-texto').textContent, F('g1')), 'Acusar recibo del parte médico');
await pagina.click(F('g2') + ' > .guion-resumen');
await comprobar('abrir otra cierra la anterior (solo una a la vez)', abiertas(), ['g2']);
await pagina.click(F('g2') + ' > .guion-resumen');
await comprobar('pulsar la abierta la cierra', abiertas(), []);

/* ================= 3 ================= */
console.log('--- 3. «Más de esta tarea» ---');
await pagina.click(F('g2') + ' > .guion-resumen');
await comprobar('plegado al abrir la tarea',
  Promise.all([visible(F('g2') + ' .guion-mas-cab'), visible(F('g2') + ' .guion-explicacion')]), [true, false]);
await pagina.click(F('g2') + ' .guion-mas-cab');
await comprobar('se despliega dentro de la tarea con sus cinco cosas',
  pagina.evaluate((s) => {
    const f = document.querySelector(s);
    return [f.querySelector('.guion-explicacion').placeholder, f.querySelector('.guion-cita').placeholder, f.querySelector('.guion-url').placeholder,
      f.querySelector('.guion-reunir + span').textContent, f.querySelector('.guion-pregunta-fila span').textContent,
      Array.from(f.querySelectorAll('.guion-mas input, .guion-mas select')).every(e => e.offsetParent !== null || e.classList.contains('guion-reunir-clase') || e.classList.contains('guion-obligatorio'))];
  }, F('g2')),
  ['Explicación corta (opcional)', 'Normativa: la cita (opcional)', 'Enlace al BOE o al BOJA (opcional)', 'Hay que reunirlo',
   'Esta tarea es una pregunta: lo que hay que hacer depende de la respuesta', true]);
await comprobar('tras repintar (cambiar lo que se hace) «Más de esta tarea» sigue abierto',
  (async () => { await pagina.locator(F('g2') + ' .guion-accion').selectOption('generar'); return visible(F('g2') + ' .guion-explicacion'); })(), true);
await pagina.locator(F('g2') + ' .guion-accion').selectOption('');

/* ================= 4 ================= */
console.log('--- 4. «Obligatorio» solo con «Hay que reunirlo» ---');
await comprobar('sin «Hay que reunirlo», ni «Obligatorio» ni «Un documento / Un dato»',
  Promise.all([visible(F('g2') + ' .guion-obligatorio'), visible(F('g2') + ' .guion-reunir-clase')]), [false, false]);
await pagina.check(F('g2') + ' .guion-reunir');
await comprobar('al marcarlo salen',
  Promise.all([visible(F('g2') + ' .guion-obligatorio'), visible(F('g2') + ' .guion-reunir-clase')]), [true, true]);
await pagina.selectOption(F('g2') + ' .guion-reunir-clase', 'dato');
await pagina.check(F('g2') + ' .guion-obligatorio');
await pagina.uncheck(F('g2') + ' .guion-reunir');
await comprobar('al desmarcarlo se esconden',
  Promise.all([visible(F('g2') + ' .guion-obligatorio'), visible(F('g2') + ' .guion-reunir-clase')]), [false, false]);
await pagina.check(F('g2') + ' .guion-reunir');
await comprobar('y lo que tuvieran sigue ahí al volver a marcarlo',
  pagina.evaluate((s) => [document.querySelector(s + ' .guion-reunir-clase').value, document.querySelector(s + ' .guion-obligatorio').checked], F('g2')), ['dato', true]);

/* ================= 5 ================= */
console.log('--- 5. añadir una tarea ---');
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] .guion-anadir');
await comprobar('la tarea nueva sale abierta (las demás, cerradas), al final, con el cursor en su texto',
  (async () => {
    await pagina.waitForFunction(() => document.activeElement && document.activeElement.classList.contains('guion-texto'));
    return pagina.evaluate(() => {
      const fs = Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila'));
      const ult = fs[fs.length - 1];
      return [fs.length, fs.filter(f => f.classList.contains('guion-abierta')).length, ult.classList.contains('guion-abierta'), ult.contains(document.activeElement)];
    });
  })(), [5, 1, true, true]);
await pagina.keyboard.type('Avisar al tutor');

/* ================= 6 ================= */
console.log('--- 6. los hitos de dentro de una respuesta ---');
await pagina.click('#guia-lista .guia-lista-item:nth-child(2)');
await comprobar('sus tareas también van en una línea',
  pagina.evaluate(() => {
    const f = document.querySelector('#guia-pasos .subpaso-editor .guion-lista > .guion-fila[data-id="ga"]');
    return [f.querySelector(':scope > .guion-resumen .guion-resumen-que').textContent, f.querySelector('.guion-texto').offsetParent === null];
  }), ['Generar un documento', true]);
await pagina.click('#cuadro-cancelar');

/* ================= 7 ================= */
console.log('--- 7. guardar ---');
await abrir();
await pagina.click('#cuadro-aceptar');
await comprobar('sin tocar nada, la guía sale igual que entró',
  pagina.evaluate(async (GUIA) => JSON.stringify(await window.__guardada) === JSON.stringify(Guias.normalizar(JSON.parse(JSON.stringify(GUIA)))), GUIA), true);
await abrir();
await pagina.click(F('g1') + ' > .guion-resumen');
await pagina.fill(F('g1') + ' .guion-texto', 'Acusar recibo (cambiado)');
await pagina.selectOption(F('g1') + ' .guion-receta-via', 'seneca');
await pagina.click(F('g4') + ' > .guion-resumen');
await pagina.click(F('g4') + ' .guion-mas-cab');
await pagina.uncheck(F('g4') + ' .guion-obligatorio');
await pagina.click('#cuadro-aceptar');
await comprobar('lo cambiado en las tareas se guarda, y lo demás queda igual',
  pagina.evaluate(async () => {
    const g = (await window.__guardada)[0].guion;
    return [g[0].texto, g[0].receta, g[1], g[2].opciones.length, g[3].reunir, g[3].obligatorio];
  }), ['Acusar recibo (cambiado)', { a: 'tutoria', via: 'seneca', plantilla: '' },
       { id: 'g2', texto: 'Sellar el parte', explicacion: 'Con el sello grande', accion: '', normativa: null }, 2, 'documento', false]);

/* ================= 8 ================= */
console.log('--- 8. «Abrir en la guía» ---');
await abrir({ irA: 'p1', tarea: 'g2', aviso: 'Vale para todos los asuntos de FACTURA, abiertos y nuevos.' });
await comprobar('el hito elegido, la tarea abierta y resaltada, y el aviso arriba',
  pagina.evaluate(() => [
    document.querySelector('#guia-lista .guia-lista-item.elegido .guia-lista-titulo').textContent,
    Array.from(document.querySelectorAll('#guia-pasos .guion-fila.guion-abierta')).map(f => f.dataset.id),
    !!document.querySelector('#guia-pasos .guion-fila[data-id="g2"].guion-fila-resaltada'),
    document.querySelector('.guia-aviso').textContent,
    !!document.querySelector('.guia-dos-col')]),
  ['Recibir el parte de baja', ['g2'], true, 'Vale para todos los asuntos de FACTURA, abiertos y nuevos.', true]);
await pagina.click('#cuadro-cancelar');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobaciones fallan'); process.exit(1); }
console.log('\nTodo bien');
