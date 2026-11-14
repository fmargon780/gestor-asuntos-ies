/* Prueba en navegador de verdad de la fila 416 de docs/COLA.md
   (docs/HITOS-UN-SOLO-SITIO.md, parte A) puesta al día con la fila 660 (docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md):
   a dónde va un cambio lo dice la marca «Los cambios en hitos y tareas van también a la guía»; no hay pregunta
   «¿Dónde se guarda?» ni «Pasar a la guía».

   1. «+ Añadir tarea» con la marca apagada: sin emergente; se guarda solo en este asunto,
      con su marca «solo aquí»; la guía y el otro asunto no la tienen.
   4. Con la marca encendida, «Cambiar» y «Borrar» una tarea de la guía van a la guía, sin preguntar.
   7. Con la marca encendida, «Cambiar» un hito va a la guía y llega al otro asunto. */
import { chromium } from 'playwright';
import { abrirHito, verLaLista } from './apoyo/hito.mjs';
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
    await abrirHito(pagina, '' + idHito + '');
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
  await pagina.click('.hito-en-mesa .tcd-abrir-form');   /* fila 638: el formulario se abre con «+ Añadir tarea» */
  await pagina.fill('.hito-en-mesa .tcd-nueva .at-que', 'Otra cosa');   /* fila 660: «Qué se hace» se busca escribiendo */
  await pagina.fill('.hito-en-mesa .tcd-nueva .at-nombre', texto);
  await pagina.press('.hito-en-mesa .tcd-nueva .at-nombre', 'Enter');
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
await comprobar('1. el formulario se ha cerrado (fila 638) y queda «+ Añadir tarea»',
  pagina.evaluate(() => [!document.querySelector('.tcd-nueva'), !!document.querySelector('.hito-en-mesa .tcd-abrir-form')]), [true, true]);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('1. el otro asunto no la tiene',
  tareasVistas('c1').then((t) => t.indexOf('Pedir el libro de familia') !== -1), false);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 4. Con la marca de la guía encendida (fila 660), cambiar y borrar una tarea de la guía van a la guía, sin preguntar. */
await pagina.evaluate(async (c) => { await MarcaGuia.poner(Gestor.asuntos().filter((x) => x.nombre === c)[0], true); }, ASUNTO_1);
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

/* 7. «Cambiar» un hito de la guía (marca encendida): sin pregunta, va a la guía y llega al otro asunto. */
await abrirMesaDe('Sola Uno', 'c1');
await pagina.click('.hito-en-mesa .mesa-mas');
await elegirDelMenuAbierto('Cambiar');
await pagina.waitForSelector('#capa:not(.oculto) #hda-titulo');
await comprobar('7. «Cambiar» un hito: sin la pregunta de dónde se guarda',
  pagina.evaluate(() => !document.querySelector('.dsg') && !document.querySelector('input[name="dsg-donde"]')), true);
await pagina.fill('#hda-titulo', 'Comunicar bis');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('7. el título nuevo está en la guía',
  guiaGuardada().then((g) => g.map((p) => p.titulo)[0]), 'Comunicar bis');
await comprobar('7. y en el otro asunto, que no lo había empezado',
  pagina.evaluate(async (clave) => (await Hitos.leer()).porAsunto[clave].hitos.map((x) => x.titulo)[0], ASUNTO_2),
  'Comunicar bis');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
