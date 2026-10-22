/* Prueba en navegador de verdad de la fila 416 de docs/COLA.md
   (docs/HITOS-UN-SOLO-SITIO.md, parte A; antes fila 235,
   docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md): la guía manda, ya no hay pregunta
   «¿Dónde se guarda?» al crear, cambiar o borrar una tarea o un hito.

   1. «Nueva tarea…» + Intro: sin emergente; se guarda solo en este asunto,
      con su marca «solo aquí»; la guía y el otro asunto no la tienen.
   2. «⋮» → «Pasar a la guía»: sin pregunta; entra en la guía y llega al otro
      asunto. El aviso lleva «Deshacer».
   3. «Deshacer»: en este asunto la tarea sigue «solo aquí»; en la guía y en
      el otro asunto ya no está.
   4. «Cambiar» y «Borrar» una tarea de la guía van a la guía, sin preguntar.
   5. «Hito ▾» → Crear con «Solo para este asunto»: el hito sale con la marca
      «solo aquí»; «Pasar a la guía» lo lleva entero a la guía y llega al otro asunto.
   6. «Cambiar la guía…» tras crear un hito enseña la guía previa entera. */
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
const elegirDelMenuAbierto = elegirDelMenu;


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
  await pagina.waitForTimeout(600);
}
const hayEmergente = () => pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto'));

/* 1. Nueva tarea → solo en este asunto, sin preguntar. */
await abrirMesaDe('Sola Uno', 'c1');
await escribirTarea('Pedir el libro de familia');
await comprobar('1. no sale ningún emergente', hayEmergente(), false);
await comprobar('1. la tarea sale con «solo aquí»',
  pagina.locator('.hito-en-mesa .guion-paso', { hasText: 'Pedir el libro de familia' }).locator('.guion-tarea-propia').isVisible(), true);
await comprobar('1. no está en la guía',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría', 'Avisar a la familia']);
await comprobar('1. la caja se ha vaciado y conserva el foco',
  pagina.evaluate(() => ({ v: document.getElementById('guion-nueva-tarea').value, f: document.activeElement.id })),
  { v: '', f: 'guion-nueva-tarea' });
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('1. el otro asunto no la tiene',
  tareasVistas('c1').then((t) => t.indexOf('Pedir el libro de familia') !== -1), false);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 2. «Pasar a la guía» desde el «⋮». */
await abrirMesaDe('Sola Uno', 'c1');
const filaTarea = pagina.locator('.hito-en-mesa .guion-paso', { hasText: 'Pedir el libro de familia' });
await filaTarea.locator('.guion-tarea-menu-boton').click();
await elegirDelMenu('Pasar a la guía');
await pagina.waitForTimeout(800);
await comprobar('2. sin emergente', hayEmergente(), false);
await comprobar('2. la guía tiene la tarea al final',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría', 'Avisar a la familia', 'Pedir el libro de familia']);
await comprobar('2. el aviso verde dice dónde y lleva «Deshacer»',
  pagina.evaluate(() => {
    const m = Array.prototype.filter.call(document.querySelectorAll('#mensajes .mensaje'), (x) => x.textContent.indexOf('Guardado en la guía') === 0)[0];
    return m ? { texto: m.firstChild.textContent, boton: m.querySelector('.mensaje-boton').textContent } : null;
  }), { texto: 'Guardado en la guía de CONVALIDACION y en 1 asunto abierto.', boton: 'Deshacer' });
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('2. el otro asunto abierto del tipo la tiene',
  tareasVistas('c1').then((t) => t.indexOf('Pedir el libro de familia') !== -1), true);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 3. «Deshacer» desde el aviso. */
await abrirMesaDe('Sola Uno', 'c1');
await pagina.click('#mensajes .mensaje-boton');
await pagina.waitForTimeout(800);
await comprobar('3. la guía vuelve a como estaba',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría', 'Avisar a la familia']);
await comprobar('3. en este asunto la tarea sigue, con «solo aquí»',
  pagina.locator('.hito-en-mesa .guion-paso', { hasText: 'Pedir el libro de familia' }).locator('.guion-tarea-propia').isVisible(), true);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('3. en el otro asunto ya no está',
  tareasVistas('c1').then((t) => t.indexOf('Pedir el libro de familia') !== -1), false);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 4. Cambiar y Borrar una tarea de la guía: a la guía, sin preguntar. */
await abrirMesaDe('Sola Uno', 'c1');
await abrirMenuDeTarea('g1');
await elegirDelMenu('Cambiar');
await pagina.fill('.hito-en-mesa .guion-tarea-editar-texto', 'Avisar a la tutoría y a jefatura');
await pagina.press('.hito-en-mesa .guion-tarea-editar-texto', 'Enter');
await pagina.waitForTimeout(800);
await comprobar('4. cambiar una tarea de la guía no pregunta', hayEmergente(), false);
await comprobar('4. y la cambia en la guía',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría y a jefatura', 'Avisar a la familia']);
await abrirMenuDeTarea('g2');
await elegirDelMenu('Borrar');
await pagina.waitForTimeout(800);
await comprobar('4. borrar una tarea de la guía no pregunta', hayEmergente(), false);
await comprobar('4. y la quita de la guía',
  guiaGuardada().then((g) => g.filter((p) => p.id === 'c1')[0].guion.map((x) => x.texto)),
  ['Avisar a la tutoría y a jefatura']);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('4. el otro asunto ve el cambio y el borrado',
  tareasVistas('c1').then((t) => t.filter((x) => /Avisar/.test(x))), ['Avisar a la tutoría y a jefatura']);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 5. Hito «solo para este asunto»: marca visible; «Pasar a la guía» lo lleva entero. */
await abrirMesaDe('Sola Uno', 'c1');
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Crear' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto) #hda-titulo');
await pagina.fill('#hda-titulo', 'Revisión extra');
await pagina.selectOption('#hda-despues', 'c2');
await pagina.check('#hda-solo-aqui');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
const idPropio = await pagina.evaluate(async (clave) => {
  const d = await Hitos.leer();
  return d.porAsunto[clave].hitos.filter((h) => h.titulo === 'Revisión extra')[0].id;
}, ASUNTO_1);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Uno', idPropio);
await comprobar('5. el hito sale con la marca «solo aquí»',
  pagina.locator('.hito-en-mesa .mesa-titulo-fila .marca-solo-aqui').isVisible(), true);
await comprobar('5. no está en la guía',
  guiaGuardada().then((g) => g.map((p) => p.titulo)), ['Comunicar', 'Sin tareas', 'Resolver']);

/* El fallo de «no me carga el mapa previo»: con el hito recién creado solo en este asunto,
   «Cambiar la guía…» y el mapa del asunto enseñan la guía que ya había, entera. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar la guía' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#guia-pasos .paso-titulo', { state: 'attached' });
await comprobar('6. «Cambiar la guía…» con el hito solo-aquí: sale la guía previa entera',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#guia-pasos .paso-titulo'), (x) => x.value)),
  ['Comunicar', 'Sin tareas', 'Resolver']);
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);

await pagina.click('.hito-en-mesa .mesa-mas');
await elegirDelMenuAbierto('Pasar a la guía');
await pagina.waitForTimeout(800);
await comprobar('5. «Pasar a la guía» no pregunta', hayEmergente(), false);
await comprobar('5. la guía suma el hito, en su sitio',
  guiaGuardada().then((g) => g.map((p) => p.titulo)), ['Comunicar', 'Sin tareas', 'Revisión extra', 'Resolver']);
await comprobar('5. en este asunto queda enlazado, una sola vez, y ya sin la marca',
  pagina.evaluate(async (clave) => {
    const d = await Hitos.leer();
    const h = d.porAsunto[clave].hitos.filter((x) => x.titulo === 'Revisión extra');
    return { cuantos: h.length, enlazado: !!h[0].origenGuia, marca: !!document.querySelector('.hito-en-mesa .mesa-titulo-fila .marca-solo-aqui') };
  }, ASUNTO_1), { cuantos: 1, enlazado: true, marca: false });
await comprobar('5. llega al otro asunto abierto, una sola vez',
  pagina.evaluate(async (clave) => {
    const d = await Hitos.leer();
    return d.porAsunto[clave].hitos.map((x) => x.titulo);
  }, ASUNTO_2), ['Comunicar', 'Sin tareas', 'Revisión extra', 'Resolver']);

/* 7. «Cambiar» un hito de la guía: sin pregunta, va a la guía y llega al otro asunto. */
await pagina.click('.hito-en-mesa .mesa-mas');
await elegirDelMenuAbierto('Cambiar');
await pagina.waitForSelector('#capa:not(.oculto) #hda-titulo');
await comprobar('7. «Cambiar» un hito: sin la pregunta de dónde se guarda',
  pagina.evaluate(() => !document.querySelector('.dsg') && !document.querySelector('input[name="dsg-donde"]')), true);
await pagina.fill('#hda-titulo', 'Revisión extra bis');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('7. el título nuevo está en la guía',
  guiaGuardada().then((g) => g.map((p) => p.titulo)), ['Comunicar', 'Sin tareas', 'Revisión extra bis', 'Resolver']);
await comprobar('7. y en el otro asunto, que no lo había empezado',
  pagina.evaluate(async (clave) => (await Hitos.leer()).porAsunto[clave].hitos.map((x) => x.titulo), ASUNTO_2),
  ['Comunicar', 'Sin tareas', 'Revisión extra bis', 'Resolver']);

/* 8. «Cambiar la guía…» tras crear un hito: la guía previa se ve entera. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar la guía' }).first().click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');   /* la advertencia de «Vale para todos los asuntos…» */
await pagina.waitForSelector('#guia-pasos .paso-titulo', { state: 'attached' });
await comprobar('8. «Cambiar la guía…» enseña todos los hitos que la guía ya tenía, más el nuevo',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#guia-pasos .paso-titulo'), (x) => x.value)),
  ['Comunicar', 'Sin tareas', 'Revisión extra bis', 'Resolver']);
await pagina.keyboard.press('Escape');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
