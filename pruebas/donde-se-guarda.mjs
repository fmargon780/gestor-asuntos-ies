/* Prueba en navegador de verdad de la fila 235 de docs/COLA.md
   (docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md): «¿Dónde se guarda?» al crear,
   cambiar o borrar una tarea o un hito desde un asunto.

   1. Nueva tarea + Intro: sale el emergente con «A la guía de …» marcada
      y «Llegará a 1 asunto abierto»; Intro otra vez la guarda en la guía
      y el otro asunto abierto del tipo la tiene. El aviso lleva «Deshacer».
   2. «Deshacer»: en este asunto la tarea sigue, «solo aquí»; en la guía y
      en el otro asunto ya no está.
   3. Flecha abajo + Intro: «Solo en este asunto»; no llega a la guía.
   4. Escape no guarda nada y deja lo escrito en la caja.
   5. Un hito propio (creado «solo en este asunto»): al escribir una tarea
      el emergente avisa de que el hito no está en la guía; aceptando, el
      hito entra en la guía con su tarea, detrás de los que ya estaban, y
      la guía conserva todo lo que tenía.
   6. «Hito ▾» → Cambiar y Borrar llevan el bloque, y de una tarea de la
      guía, «Borrar» pregunta antes de quitarla de la guía.
   7. «Cambiar la guía…» del menú del hito, tras crear un hito, enseña la
      guía previa entera. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO_1 = '260915 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const ASUNTO_2 = '260916 CONVALIDACION 26-27 Sola Dos, Ana 9990202';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Comunicar', cuerpo: '', opciones: [],
      guion: [
        { id: 'g1', texto: 'Avisar a la tutoría', explicacion: '', accion: '' },
        { id: 'g2', texto: 'Avisar a la familia', explicacion: '', accion: '' }
      ] },
    { id: 'c2', titulo: 'Sin tareas', cuerpo: '', opciones: [] },
    { id: 'c3', titulo: 'Resolver', cuerpo: '', opciones: [] }
  ]
};

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, asunto1, asunto2]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
  await window.__disco.abiertos.getDirectoryHandle(asunto1, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(asunto2, { create: true });
}, [GUIAS, ASUNTO_1, ASUNTO_2]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([asunto1, asunto2]) => {
  await App.anotar(asunto1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Sola Uno, Eva 9990201', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.anotar(asunto2, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Sola Dos, Ana 9990202', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, [ASUNTO_1, ASUNTO_2]);

async function abrirMesaDe(nombreCorto, idHito) {
  await pagina.locator('.tarjeta-nombre', { hasText: nombreCorto }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(300);
  /* Una mesa abierta de una visita anterior a este mismo asunto se
     recuerda por su clave (js/hito-mesa.js): sin cerrarla antes, la
     lista compacta seguiría enseñando solo aquel hito, y el título del
     que se busca ahora no estaría a la vista (mismo cuidado que toma
     `irAHito` en pruebas/hitos-desde-el-asunto.mjs). */
  const yaAbierta = await pagina.locator('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]').count();
  if (!yaAbierta) {
    await pagina.evaluate(() => { if (window.HitoMesa) HitoMesa.cerrar(); });
    await pagina.waitForTimeout(150);
    await pagina.locator('#ficha-guia .hito[data-id="' + idHito + '"] .hito-titulo').click();
  }
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]');
  await pagina.waitForTimeout(300);
}

async function abrirMenuDeTarea(idTarea) {
  const fila = pagina.locator('.hito-en-mesa .guion-paso[data-id="' + idTarea + '"]');
  await fila.locator('.guion-tarea-menu-boton').click();
  return fila;
}

async function elegirDelMenu(texto) {
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: texto }).first().click();
}


async function guiaGuardada() {
  return pagina.evaluate(async () => (await Carpetas.leerJson(App.E.gestor, 'guias.json')).CONVALIDACION);
}
async function tareasVistas(idHito) {
  return pagina.evaluate((id) => Array.prototype.map.call(
    document.querySelectorAll('.hito-en-mesa .guion-paso .guion-paso-texto'), (e) => e.textContent), idHito);
}

async function escribirTarea(texto) {
  await pagina.fill('#guion-nueva-tarea', texto);
  await pagina.press('#guion-nueva-tarea', 'Enter');
  await pagina.waitForSelector('#capa:not(.oculto) input[name="dsg-donde"]');
}

/* 1. Nueva tarea → «¿Dónde se guarda?» → a la guía. */
await abrirMesaDe('Sola Uno', 'c1');
await escribirTarea('Pedir el libro de familia');
await comprobar('1. «A la guía» marcada y la frase de a cuántos llega',
  pagina.evaluate(() => ({
    marcada: document.querySelector('input[name="dsg-donde"]:checked').value,
    nota: (document.querySelector('.dsg-nota') || {}).textContent,
    cuerpo: (document.querySelector('.dsg-tarea') || {}).textContent
  })), { marcada: 'guia', nota: 'Llegará a 1 asunto abierto de este tipo.', cuerpo: 'Pedir el libro de familia' });
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(600);
await comprobar('1. la guía tiene la tarea nueva al final',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría', 'Avisar a la familia', 'Pedir el libro de familia']);
await comprobar('1. la caja se ha vaciado y conserva el foco',
  pagina.evaluate(() => ({ v: document.getElementById('guion-nueva-tarea').value, f: document.activeElement.id })),
  { v: '', f: 'guion-nueva-tarea' });
await comprobar('1. el aviso verde dice dónde y lleva «Deshacer»',
  pagina.evaluate(() => {
    const m = Array.prototype.filter.call(document.querySelectorAll('#mensajes .mensaje'), (x) => x.textContent.indexOf('Guardado en la guía') === 0)[0];
    return m ? { texto: m.firstChild.textContent, boton: m.querySelector('.mensaje-boton').textContent } : null;
  }), { texto: 'Guardado en la guía de CONVALIDACION y en 1 asunto abierto.', boton: 'Deshacer' });
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('1. el otro asunto abierto del tipo la tiene',
  tareasVistas('c1').then((t) => t.indexOf('Pedir el libro de familia') !== -1), true);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 2. «Deshacer» desde el aviso. */
await abrirMesaDe('Sola Uno', 'c1');
await pagina.click('#mensajes .mensaje-boton');
await pagina.waitForTimeout(800);
await comprobar('2. la guía vuelve a como estaba',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría', 'Avisar a la familia']);
await comprobar('2. en este asunto la tarea sigue, con «solo aquí»',
  pagina.locator('.hito-en-mesa .guion-paso', { hasText: 'Pedir el libro de familia' }).locator('.guion-tarea-propia').isVisible(), true);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('2. en el otro asunto ya no está',
  tareasVistas('c1').then((t) => t.indexOf('Pedir el libro de familia') !== -1), false);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 3. «Solo en este asunto» con el teclado; 4. Escape. */
await abrirMesaDe('Sola Uno', 'c1');
await escribirTarea('Apuntar el teléfono');
await pagina.keyboard.press('ArrowDown');
await comprobar('3. la flecha abajo cambia a «Solo en este asunto»',
  pagina.evaluate(() => document.querySelector('input[name="dsg-donde"]:checked').value), 'aqui');
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(500);
await comprobar('3. sale con «solo aquí»',
  pagina.locator('.hito-en-mesa .guion-paso', { hasText: 'Apuntar el teléfono' }).locator('.guion-tarea-propia').isVisible(), true);
await comprobar('3. y no está en la guía',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.length), 2);

await escribirTarea('Esta no se guarda');
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);
await comprobar('4. Escape no guarda nada y deja lo escrito',
  pagina.evaluate(() => ({ abierto: !document.getElementById('capa').classList.contains('oculto'),
    escrito: document.getElementById('guion-nueva-tarea').value,
    hay: Array.prototype.some.call(document.querySelectorAll('.hito-en-mesa .guion-paso-texto'), (e) => e.textContent === 'Esta no se guarda') })),
  { abierto: false, escrito: 'Esta no se guarda', hay: false });
await pagina.fill('#guion-nueva-tarea', '');

/* 5. Hito propio: «Hito ▾» → Crear → «Solo en este asunto»; su tarea lo lleva entero. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Crear' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto) #hda-titulo');
await pagina.fill('#hda-titulo', 'Revisión extra');
await pagina.selectOption('#hda-despues', 'c2');
await pagina.check('input[name="dsg-donde"][value="aqui"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
const idPropio = await pagina.evaluate(async (clave) => {
  const d = await Hitos.leer();
  return d.porAsunto[clave].hitos.filter((h) => h.titulo === 'Revisión extra')[0].id;
}, ASUNTO_1);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Uno', idPropio);

/* El fallo de «no me carga el mapa previo» (punto 6 del documento): con el
   hito recién creado solo en este asunto, «Cambiar la guía…» y el mapa del
   asunto enseñan la guía que ya había, entera. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar la guía' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#guia-pasos .paso-titulo', { state: 'attached' });
await comprobar('6b. «Cambiar la guía…» con el hito solo-aquí: sale la guía previa entera',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#guia-pasos .paso-titulo'), (x) => x.value)),
  ['Comunicar', 'Sin tareas', 'Resolver']);
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);
await pagina.evaluate(() => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Sola Uno') !== -1)[0]; GuiasMapa.abrirDeAsunto(a); });
await pagina.waitForSelector('#mapa-cuadro .mapa-caja');
await comprobar('6b. y el mapa del asunto también',
  pagina.evaluate(() => {
    const t = document.getElementById('mapa-cuadro').textContent;
    return ['Comunicar', 'Sin tareas', 'Resolver'].every((x) => t.indexOf(x) !== -1);
  }), true);
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);

await escribirTarea('Mirar el expediente');
await comprobar('5. el emergente avisa de que el hito no está en la guía',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.dsg-nota'), (x) => x.textContent)),
  ['El hito «Revisión extra» todavía no está en la guía: irá con su tarea.',
   'Llegará a 1 asunto abierto de este tipo.']);
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(800);
await comprobar('5. la guía conserva todo y suma el hito nuevo, en su sitio, con su tarea',
  guiaGuardada().then((g) => g.map((p) => p.titulo + (p.guion && p.guion.length ? ':' + p.guion.length : ''))),
  ['Comunicar:2', 'Sin tareas', 'Revisión extra:1', 'Resolver']);
await comprobar('5. en este asunto el hito queda enlazado con la guía',
  pagina.evaluate(async (clave) => {
    const d = await Hitos.leer();
    const h = d.porAsunto[clave].hitos.filter((x) => x.titulo === 'Revisión extra');
    return { cuantos: h.length, enlazado: !!h[0].origenGuia, propias: (h[0].guionPropio || []).length };
  }, ASUNTO_1), { cuantos: 1, enlazado: true, propias: 0 });
await comprobar('5. llega al otro asunto abierto, una sola vez',
  pagina.evaluate(async (clave) => {
    const d = await Hitos.leer();
    return d.porAsunto[clave].hitos.map((x) => x.titulo);
  }, ASUNTO_2), ['Comunicar', 'Sin tareas', 'Revisión extra', 'Resolver']);

/* 6. Cambiar y Borrar de un hito, y Borrar de una tarea de la guía. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto) input[name="dsg-donde"]');
await comprobar('6. «Cambiar» un hito: sin la casilla vieja y con las dos opciones',
  pagina.evaluate(() => ({ vieja: !!document.querySelector('#hda-tambien-guia'),
    opciones: Array.prototype.map.call(document.querySelectorAll('input[name="dsg-donde"]'), (r) => r.value + (r.checked ? '*' : '')) })),
  { vieja: false, opciones: ['guia*', 'aqui'] });
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(200);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Uno', 'c1');
await pagina.locator('.hito-en-mesa .guion-paso[data-id="g2"] .guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Borrar' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto) input[name="dsg-donde"]');
await comprobar('6. «Borrar» una tarea de la guía pregunta dónde, con «A la guía» marcada',
  pagina.evaluate(() => document.querySelector('input[name="dsg-donde"]:checked').value), 'guia');
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(200);
await comprobar('6. y cancelar no quita nada',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.length), 2);

/* 7. «Cambiar la guía…» tras crear un hito: la guía previa se ve entera. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar la guía' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');   /* la advertencia de «Vale para todos los asuntos…» */
await pagina.waitForSelector('#guia-pasos .paso-titulo', { state: 'attached' });
await comprobar('7. «Cambiar la guía…» enseña todos los hitos que la guía ya tenía, más el nuevo',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#guia-pasos .paso-titulo'), (x) => x.value)),
  ['Comunicar', 'Sin tareas', 'Revisión extra', 'Resolver']);
await pagina.click('#guia-ver-mapa');
await pagina.waitForTimeout(400);
await comprobar('7. y «Ver mapa» también los trae todos',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#guia-mapa-panel .mapa-caja'), (x) => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 14))
    .filter((t) => /Comunicar|Sin tareas|Revisi|Resolver/.test(t)).length), 4);
await pagina.keyboard.press('Escape');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
