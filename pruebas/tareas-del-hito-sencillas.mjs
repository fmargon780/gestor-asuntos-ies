/* Prueba en navegador de verdad de la fila 224 de docs/COLA.md
   (docs/TAREAS-DEL-HITO-SENCILLAS.md): la tarjeta «Tareas del hito» sin
   frases de sobra, la caja «Nueva tarea…» y el «⋮» de cada tarea.

   1. Un hito sin tareas no enseña ninguna frase, solo la caja.
   2. «Cambiar aquí» de una tarea de la guía: cambia solo en este
      asunto, con «solo aquí»; la guía y el otro asunto abierto no se
      tocan.
   3. «Anotar»: la nota entra en la libreta con el nombre de la tarea
      delante, y la tarea queda con su 💬.
   4. «Borrar» de una tarea de la guía: desaparece de este asunto sin
      tocar la guía ni el otro asunto abierto.
   5. El botón «Hito ▾» solo trae Crear · Cambiar · Borrar arriba,
      ninguna opción de tareas. */
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

/* 1. Un hito sin tareas: ni frase ni enlaces, solo la caja. */
await abrirMesaDe('Sola Uno', 'c2');
await comprobar('1. sin ninguna frase de «no tiene tareas»',
  pagina.evaluate(() => (document.querySelector('.hito-en-mesa .mesa-guion') || {}).textContent.indexOf('todavía no tiene tareas') === -1), true);
await comprobar('1. la caja «Nueva tarea…» está, y nada más al pie',
  pagina.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-nueva-tarea')), true);
await comprobar('1. sin el enlace viejo de añadir a la guía',
  pagina.evaluate(() => !document.querySelector('.hito-en-mesa .guion-cambiar-guion') &&
    !document.querySelector('.hito-en-mesa .guion-anadir-propio')), true);

/* 2. «Cambiar aquí»: solo en este asunto. */
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Uno', 'c1');
await abrirMenuDeTarea('g1');
await comprobar('2. la tarea de la guía trae Anotar/Cambiar aquí/Cambiar en la guía/Borrar',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion'), (b) => b.textContent)),
  ['Anotar', 'Cambiar aquí', 'Cambiar en la guía', 'Borrar']);
await elegirDelMenu('Cambiar aquí');
await pagina.fill('.hito-en-mesa .guion-paso[data-id="g1"] .guion-tarea-editar-texto', 'Avisar a la tutoría (por iPasen)');
await pagina.press('.hito-en-mesa .guion-paso[data-id="g1"] .guion-tarea-editar-texto', 'Enter');
await pagina.waitForTimeout(500);
await comprobar('2. el texto cambia en este asunto y lleva «solo aquí»',
  pagina.locator('.hito-en-mesa .guion-paso', { hasText: 'Avisar a la tutoría (por iPasen)' }).locator('.guion-tarea-propia').isVisible(), true);
await comprobar('2. la guía no cambia', pagina.evaluate(async () => {
  const guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
  return guias.CONVALIDACION.filter((p) => p.id === 'c1')[0].guion[0].texto;
}), 'Avisar a la tutoría');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('2. y el otro asunto abierto sigue con el texto de antes',
  pagina.evaluate(() => (document.querySelector('.hito-en-mesa .guion-paso[data-id="g1"] .guion-paso-texto') || {}).textContent),
  'Avisar a la tutoría');

/* 3. «Anotar»: la nota lleva el nombre de la tarea delante, y sale el 💬.
   De vuelta en «Sola Uno» (donde se comprueba la nota guardada). */
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Uno', 'c1');
await abrirMenuDeTarea('g2');
await elegirDelMenu('Anotar');
await pagina.fill('.hito-en-mesa .guion-paso[data-id="g2"] .guion-tarea-anotar-texto', 'ya está avisada la familia');
await pagina.press('.hito-en-mesa .guion-paso[data-id="g2"] .guion-tarea-anotar-texto', 'Enter');
await pagina.waitForTimeout(600);
await comprobar('3. la tarea lleva su 💬',
  pagina.locator('.hito-en-mesa .guion-paso[data-id="g2"] .guion-tarea-notas-boton').isVisible(), true);
const notaGuardada = await pagina.evaluate((asunto1) => {
  const f = App.E.registro.asuntos[asunto1];
  const n = (f.notas || []).filter((x) => x.tarea === 'g2')[0];
  return n ? n.texto : null;
}, ASUNTO_1);
await comprobar('3. y el texto guardado empieza por el nombre de la tarea',
  Promise.resolve(notaGuardada), 'Avisar a la familia: ya está avisada la familia');

/* 4. «Borrar» de una tarea de la guía: se esconde solo aquí. Con nota
   (la de la prueba 3), pide confirmación de una línea. */
await abrirMenuDeTarea('g2');
await elegirDelMenu('Borrar');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('4. desaparece de este asunto',
  pagina.evaluate(() => !document.querySelector('.hito-en-mesa .guion-paso[data-id="g2"]')), true);
await comprobar('4. la guía no cambia', pagina.evaluate(async () => {
  const guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
  return guias.CONVALIDACION.filter((p) => p.id === 'c1')[0].guion.length;
}), 2);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Sola Dos', 'c1');
await comprobar('4. y el otro asunto abierto la sigue teniendo',
  pagina.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-paso[data-id="g2"]')), true);

/* 5. El botón «Hito ▾»: solo Crear · Cambiar · Borrar arriba. */
await pagina.click('.hito-en-mesa .mesa-mas');
await pagina.waitForSelector('.ficha-menu:not(.oculto)');
await comprobar('5. arriba, sin repetir la palabra: Crear, Cambiar, Borrar',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion'), (b) => b.textContent).slice(0, 3)),
  ['Crear', 'Cambiar', 'Borrar']);
await comprobar('5. ninguna opción de tareas en el menú del hito',
  pagina.evaluate(() => !Array.prototype.some.call(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion'),
    (b) => b.textContent.indexOf('tarea') !== -1)), true);
await pagina.keyboard.press('Escape');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
