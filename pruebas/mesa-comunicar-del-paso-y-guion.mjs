/* Prueba en navegador de verdad de la fila 150 de docs/COLA.md
   (docs/MESA-COMUNICAR-DEL-PASO-Y-GUION.md):

   1. El «Comunicar» de un paso del guion (con dos vías, correo y Séneca)
      abre un menú VISIBLE (antes, con dos vías, se enganchaba con
      FichaMenus al botón escondido de `.mesa-ocultos`, y el menú salía
      invisible: el fallo que veía Francisco).
   2. Con dos pasos «Comunicar» en el mismo hito, pulsar el del SEGUNDO y
      terminar por Séneca marca ESE paso, no el primero (antes, marcaba
      «el primero pendiente» sin mirar cuál se había pulsado).
   3. «✎ Cambiar el guion de este hito» edita la guía del tipo desde la
      propia mesa, y el cambio se ve en otro asunto abierto del mismo tipo. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO_1 = '260910 CONVALIDACION 26-27 Inventada Uno, Eva 9990001';
const ASUNTO_2 = '260911 CONVALIDACION 26-27 Inventada Dos, Ana 9990002';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Comunicar', cuerpo: '', opciones: [],
      guion: [
        { id: 'g1', texto: 'Avisar a la tutoría', explicacion: '', accion: 'comunicar' },
        { id: 'g2', texto: 'Avisar a la familia', explicacion: '', accion: 'comunicar' }
      ] },
    { id: 'c2', titulo: 'Resolver', cuerpo: '', opciones: [] }
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
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.anotar(asunto2, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Dos, Ana 9990002', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, [ASUNTO_1, ASUNTO_2]);

async function abrirMesaDe(nombreCorto) {
  await pagina.locator('.tarjeta-nombre', { hasText: nombreCorto }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(300);
  await pagina.locator('#ficha-guia .hito[data-id="c1"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
  await pagina.waitForTimeout(300);
}

await abrirMesaDe('Inventada Uno');

/* 1 y 2: pulsar «Comunicar» del SEGUNDO paso (g2) abre un menú visible. */
await pagina.click('.hito-en-mesa .guion-paso[data-id="g2"] .guion-accion-boton');
await pagina.waitForTimeout(150);
await comprobar('1. el menú de «Comunicar» de un paso sale VISIBLE (no dentro de .mesa-ocultos)',
  pagina.evaluate(() => {
    const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent &&
      Array.from(m.querySelectorAll('.ficha-menu-opcion')).some((o) => /Séneca/.test(o.textContent)));
    if (!menu) return null;
    return Array.from(menu.querySelectorAll('.ficha-menu-opcion')).map((o) => o.textContent.trim());
  }), ['Correo electrónico', 'Mensaje de Séneca']);

/* Elegir «Mensaje de Séneca» y terminar (botón 2, copiar el texto). */
await pagina.evaluate(() => {
  const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
  const opcion = menu && Array.from(menu.querySelectorAll('.ficha-menu-opcion')).find((o) => /Séneca/.test(o.textContent));
  if (opcion) opcion.click();
});
await pagina.waitForSelector('#capa:not(.oculto) #seneca-copiar-texto');
await pagina.click('#seneca-copiar-texto');
await pagina.waitForTimeout(300);

await comprobar('2. se marca el paso pulsado (g2), no «el primero pendiente» (g1)',
  pagina.evaluate(() => {
    const g1 = document.querySelector('.hito-en-mesa .guion-paso[data-id="g1"]');
    const g2 = document.querySelector('.hito-en-mesa .guion-paso[data-id="g2"]');
    return [g1 && g1.classList.contains('hecho'), g2 && g2.classList.contains('hecho')];
  }), [false, true]);

/* Cerrar el cuadro de Séneca («Cerrar» es #cuadro-aceptar: se abre sin
   botón Cancelar, U.preguntar(..., 'Cerrar', true)). */
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

/* 3. «✎ Cambiar el guion de este hito» desde la mesa. */
await pagina.waitForTimeout(300);
await comprobar('3. el enlace para cambiar el guion está en la mesa',
  pagina.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-cambiar-guion')), true);
await pagina.click('.hito-en-mesa .guion-cambiar-guion', { force: true });
await pagina.waitForSelector('#capa:not(.oculto) .paso-guion .guion-fila');
await pagina.fill('#capa .paso-guion .guion-fila[data-id="g1"] .guion-texto', 'Avisar a la tutoría (por iPasen)');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForTimeout(400);

await comprobar('3. el cambio se ve en la mesa del mismo asunto',
  pagina.evaluate(() => {
    const p = document.querySelector('.hito-en-mesa .guion-paso[data-id="g1"] .guion-paso-texto');
    return p ? p.textContent : null;
  }), 'Avisar a la tutoría (por iPasen)');

await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await abrirMesaDe('Inventada Dos');
await comprobar('3. y en otro asunto abierto del mismo tipo',
  pagina.evaluate(() => {
    const p = document.querySelector('.hito-en-mesa .guion-paso[data-id="g1"] .guion-paso-texto');
    return p ? p.textContent : null;
  }), 'Avisar a la tutoría (por iPasen)');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await pagina.close();

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
