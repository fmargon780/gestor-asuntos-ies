/* Prueba en navegador de verdad de la fila 405 de docs/COLA.md
   (docs/MENU-EN-LAS-PREGUNTAS-DEL-HITO.md): una pregunta de las tareas del
   hito lleva su «⋮» (Anotar · Cambiar · Borrar · Abrir en la guía).

   1. Tiene los tres puntitos y sigue sin casilla.
   2. Sus opciones, sin «Pasar a la guía».
   3. «Cambiar» va a la guía, sin preguntar (fila 416): cambia el texto, conserva
      la respuesta elegida y el otro asunto ve el texto nuevo.
   4. «Borrar» avisa «En N asuntos ya está respondida…» (cancelar no quita nada)
      y, al aceptar, la quita de la guía y se va con las tareas de su respuesta;
      lo elegido queda guardado. */
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
        { id: 'q1', texto: '¿Hay que avisar a la familia?', pregunta: true, opciones: [
          { id: 'si', texto: 'Sí', lineas: [{ id: 'l1', texto: 'Llamar a la familia', explicacion: '', accion: '' }] },
          { id: 'no', texto: 'No', lineas: [] }
        ] }
      ] },
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

const Q = '.hito-en-mesa .guion-paso[data-id="q1"]';

async function opcionesDelMenu() {
  return pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion'), (b) => b.textContent));
}

/* Preparación: en «Sola Dos» la pregunta ya está respondida («Sí»). */
await abrirMesaDe('Sola Dos', 'c1');
await pagina.click(Q + ' .guion-respuesta[data-opcion="si"]');
await pagina.waitForTimeout(400);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 1 y 2. En «Sola Uno»: la pregunta lleva «⋮» con las cuatro opciones, sin «Pasar a la guía». */
await abrirMesaDe('Sola Uno', 'c1');
await comprobar('1. la pregunta lleva sus tres puntitos', pagina.locator(Q + ' .guion-tarea-menu-boton').isVisible(), true);
await comprobar('1. sigue sin casilla', pagina.locator(Q + ' .guion-casilla').count(), 0);
await pagina.click(Q + ' .guion-tarea-menu-boton');
await comprobar('2. trae Anotar · Cambiar · Borrar · Abrir en la guía', opcionesDelMenu(), ['Anotar', 'Cambiar', 'Borrar', 'Abrir en la guía']);
await pagina.keyboard.press('Escape');

/* 3. «Cambiar»: a la guía, sin preguntar. El texto cambia y la respuesta elegida se queda. */
await pagina.click(Q + ' .guion-respuesta[data-opcion="si"]');
await pagina.waitForTimeout(400);
await comprobar('3. antes de cambiar, sale la línea de la respuesta «Sí»',
  pagina.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-paso[data-id="l1"]')), true);
await pagina.click(Q + ' .guion-tarea-menu-boton');
await elegirDelMenu('Cambiar');
await pagina.fill(Q + ' .guion-tarea-editar-texto', '¿Se avisa a la familia?');
await pagina.press(Q + ' .guion-tarea-editar-texto', 'Enter');
await pagina.waitForTimeout(800);
await comprobar('3. no sale ningún emergente de dónde se guarda',
  pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')), true);
await comprobar('3. el texto nuevo se ve en la pregunta',
  pagina.evaluate(() => (document.querySelector('.hito-en-mesa .guion-paso[data-id="q1"] .guion-paso-texto') || {}).textContent), '¿Se avisa a la familia?');
await comprobar('3. la respuesta elegida («Sí») se conserva',
  pagina.evaluate(() => (document.querySelector('.hito-en-mesa .guion-paso[data-id="q1"] .guion-respuesta.elegida') || {}).dataset.opcion), 'si');
await comprobar('3. y la línea de su respuesta sigue',
  pagina.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-paso[data-id="l1"]')), true);
await comprobar('3. la guía lleva el texto nuevo', pagina.evaluate(async () => {
  const guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
  return guias.CONVALIDACION.filter((p) => p.id === 'c1')[0].guion[1].texto;
}), '¿Se avisa a la familia?');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('3. el otro asunto ve el texto nuevo',
  pagina.evaluate(() => (document.querySelector('.hito-en-mesa .guion-paso[data-id="q1"] .guion-paso-texto') || {}).textContent), '¿Se avisa a la familia?');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

/* 4. «Borrar»: avisa de las respondidas; cancelar no quita nada; aceptar la quita de la guía. */
await abrirMesaDe('Sola Uno', 'c1');
await pagina.click(Q + ' .guion-tarea-menu-boton');
await elegirDelMenu('Borrar');
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-aceptar');
await comprobar('4. avisa de que en 1 asunto ya está respondida',
  pagina.evaluate(() => document.querySelector('#capa').textContent.indexOf('En 1 asunto ya está respondida; allí dejará de verse.') !== -1), true);
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);
await comprobar('4. cancelar no la quita de la guía', pagina.evaluate(async () => {
  const guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
  return guias.CONVALIDACION.filter((p) => p.id === 'c1')[0].guion.map((g) => g.id);
}), ['g1', 'q1']);
await pagina.click(Q + ' .guion-tarea-menu-boton');
await elegirDelMenu('Borrar');
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-aceptar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('4. la pregunta sale de la guía del tipo', pagina.evaluate(async () => {
  const guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
  return guias.CONVALIDACION.filter((p) => p.id === 'c1')[0].guion.map((g) => g.id);
}), ['g1']);
await comprobar('4. la pregunta desaparece de este asunto',
  pagina.evaluate(() => !document.querySelector('.hito-en-mesa .guion-paso[data-id="q1"]')), true);
await comprobar('4. y también la tarea de su respuesta',
  pagina.evaluate(() => !document.querySelector('.hito-en-mesa .guion-paso[data-id="l1"]') && !document.querySelector('.hito-en-mesa .guion-plegadas')), true);
await comprobar('4. lo elegido queda guardado',
  pagina.evaluate(async (asunto) => {
    const d = await Hitos.leer();
    const h = d.porAsunto[asunto].hitos.filter((x) => x.origenGuia === 'c1')[0];
    return h.guionElegido.q1;
  }, ASUNTO_1), 'si');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
