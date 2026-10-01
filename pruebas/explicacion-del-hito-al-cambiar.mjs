/* Prueba en navegador de verdad de la fila 228 de docs/COLA.md
   (docs/EXPLICACION-DEL-HITO-AL-CAMBIAR.md): la explicación del hito
   (`cuerpo`, con viñetas) en «Hito ▾» → «Cambiar» y «Crear».

   1. «Cambiar» trae la explicación del hito, con sus viñetas.
   2. Cambiarla «A la guía»: llega al paso de la guía y al otro asunto vacío.
   3. «Deshacer»: guía y otro asunto vuelven a como estaban; aquí se queda
      (igual que el título, docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md, punto 5).
   4. «Solo en este asunto»: cambia aquí, no en la guía, y sigue tras recargar.
   5. «Crear» solo aquí: caja vacía; el hito nace con su explicación y viñetas.
   6. «Crear» con un hito de la biblioteca: la caja se rellena y, si se cambia,
      el paso nuevo lleva el texto cambiado (la biblioteca no se toca).
   7. Vaciar la explicación y guardar: el hito no la enseña, sin error.
   8. Con 15 líneas a 1280 px la ventana cabe y «Guardar» se ve. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO_1 = '260912 CONVALIDACION 26-27 Actual, Uno 9990101';
const ASUNTO_2 = '260913 CONVALIDACION 26-27 Vacio, Dos 9990102';
const VINETAS = '<p>Si es factura, comprobamos la validez fiscal:</p><ul><li>Dice: FACTURA</li><li>Tiene número fiscal</li></ul>';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Comunicar', cuerpo: VINETAS, opciones: [] },
    { id: 'c2', titulo: 'Resolver', cuerpo: '', opciones: [] }
  ]
};
const BIBLIOTECA = {
  version: 1,
  modelos: [
    { id: 'm1', nombre: 'Firma de Secretaría', titulo: 'Firma de Secretaría', responsable: 'secretaria',
      explicacion: '<p>Con el sello:</p><ul><li>Sello</li><li>Firma</li></ul>',
      guion: [{ id: 'bg1', texto: 'Comprobar el sello', explicacion: '', accion: '' }] }
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
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, biblioteca, a1, a2]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, t] of [['guias.json', guias], ['hitos-biblioteca.json', biblioteca]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(t)); await w.close();
  }
  for (const n of [a1, a2]) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [GUIAS, BIBLIOTECA, ASUNTO_1, ASUNTO_2]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2]) => {
  for (const [n, tercero] of [[a1, 'Actual, Uno 9990101'], [a2, 'Vacio, Dos 9990102']]) {
    await App.anotar(n, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
      tercero: tercero, curso: '26-27', grupo: '', descripcion: '', campos: {} });
  }
  await App.verAbiertos();
}, [ASUNTO_1, ASUNTO_2]);

function leerHitos(clave) {
  return pagina.evaluate(async (clave) => {
    const d = await Hitos.leer();
    return (d.porAsunto[clave] || { hitos: [] }).hitos.map((h) => ({ id: h.id, titulo: h.titulo, cuerpo: h.cuerpo || '', origenGuia: h.origenGuia || null }));
  }, clave);
}

function leerGuia() {
  return pagina.evaluate(async () => {
    const g = await Carpetas.leerJson(App.E.gestor, 'guias.json');
    return (g.CONVALIDACION || []).map((p) => ({ id: p.id, titulo: p.titulo, cuerpo: p.cuerpo || '' }));
  });
}

/* Mientras una mesa está abierta, esconde las filas de los demás
   hitos (docs/contexto/HITO-MESA.md): para ir a otro, hay que usar su
   celda de la tira de arriba, o cerrar la mesa primero. */
async function irAHito(idHito) {
  const yaAbierta = await pagina.locator('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]').count();
  if (!yaAbierta) {
    const tira = pagina.locator('.mesa-tira-hito[data-id="' + idHito + '"]');
    if (await tira.count()) {
      await tira.first().click();
    } else {
      await pagina.evaluate(() => { if (window.HitoMesa) HitoMesa.cerrar(); });
      await pagina.waitForTimeout(150);
      await pagina.locator('#ficha-guia .hito[data-id="' + idHito + '"] .hito-titulo').click();
    }
    await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]');
  }
  await pagina.waitForTimeout(300);
}

async function abrirMesaDe(nombreCorto, idHito) {
  await pagina.locator('.tarjeta-nombre', { hasText: nombreCorto }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(300);
  await irAHito(idHito);
}

async function volver() {
  await pagina.click('#ficha-volver');
  await pagina.waitForTimeout(300);
}

async function abrirMas() {
  await pagina.click('.hito-en-mesa .mesa-mas');
  await pagina.waitForSelector('.ficha-menu:not(.oculto)');
}

async function elegirDelMenu(texto) {
  await abrirMas();
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: texto }).first().click();
  await pagina.waitForSelector('#capa:not(.oculto)');
}


const cuerpoHito = (clave, id) => leerHitos(clave).then((hs) => (hs.filter((h) => h.id === id)[0] || {}).cuerpo);
const cuerpoPaso = (id) => leerGuia().then((g) => (g.filter((p) => p.id === id)[0] || {}).cuerpo);
const NUEVO = '<p>Si es factura, comprobamos la validez fiscal:</p><ul><li>Dice: FACTURA</li><li>Tiene número fiscal y base imponible</li></ul>';
const PONER = (html) => pagina.evaluate((h) => { document.getElementById('hda-cuerpo').innerHTML = h; }, html);

/* ========== 1. «Cambiar» trae la explicación, con sus viñetas ========== */

await abrirMesaDe('Actual', 'c1');
await comprobar('0. la mesa enseña la explicación con sus viñetas',
  pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .hito-explicacion li').length), 2);
await elegirDelMenu('Cambiar');
await comprobar('1. «Cambiar» trae el cuadro «Explicación» con viñetas',
  pagina.evaluate(() => ({
    etiqueta: [...document.querySelectorAll('#cuadro-cuerpo .etiqueta')].map((e) => e.textContent.trim()).indexOf('Explicación (opcional)') !== -1,
    lis: document.querySelectorAll('#hda-cuerpo li').length,
    texto: document.getElementById('hda-cuerpo').textContent.indexOf('Si es factura') === 0,
    editable: document.getElementById('hda-cuerpo').isContentEditable,
    barra: !!document.querySelector('#cuadro-cuerpo #guia-vinetas')
  })), { etiqueta: true, lis: 2, texto: true, editable: true, barra: true });

/* ========== 2. A la guía: guía y otro asunto vacío ========== */

await PONER(NUEVO);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('2. la mesa enseña el texto nuevo, con viñetas',
  pagina.evaluate(() => ({ lis: document.querySelectorAll('.hito-en-mesa .hito-explicacion li').length, t: document.querySelector('.hito-en-mesa .hito-explicacion').textContent.indexOf('base imponible') !== -1 })),
  { lis: 2, t: true });
await comprobar('2. el paso de la guía tiene el texto nuevo', cuerpoPaso('c1'), NUEVO);
await comprobar('2. el otro asunto vacío también', cuerpoHito(ASUNTO_2, 'c1'), NUEVO);

/* ========== 3. Deshacer ========== */

await pagina.click('.mensaje-boton');
await pagina.waitForTimeout(600);
await comprobar('3. deshacer: la guía vuelve a la de antes', cuerpoPaso('c1'), VINETAS);
await comprobar('3. deshacer: el otro asunto vuelve a la de antes', cuerpoHito(ASUNTO_2, 'c1'), VINETAS);
await comprobar('3. deshacer: aquí se queda el cambio (solo en este asunto, como el título)', cuerpoHito(ASUNTO_1, 'c1'), NUEVO);

/* ========== 4. Solo en este asunto ========== */

await volver();
await abrirMesaDe('Actual', 'c2');
await elegirDelMenu('Cambiar');
await comprobar('4. «Resolver» no tiene explicación: la caja sale vacía', pagina.evaluate(() => document.getElementById('hda-cuerpo').textContent), '');
await PONER('<p>Solo aquí:</p><ul><li>uno</li></ul>');
await pagina.check('input[name="dsg-donde"][value="aqui"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('4. cambia aquí', cuerpoHito(ASUNTO_1, 'c2'), '<p>Solo aquí:</p><ul><li>uno</li></ul>');
await comprobar('4. la guía sigue sin explicación', cuerpoPaso('c2'), '');
await comprobar('4. el otro asunto, igual', cuerpoHito(ASUNTO_2, 'c2'), '');
/* Los datos se leen del disco cada vez (no hay caché): al volver a abrir la
   mesa, la explicación sigue ahí, sin que la guía la pise. */
await volver();
await abrirMesaDe('Actual', 'c2');
await comprobar('4. al volver a abrir la mesa, la explicación sigue aquí',
  pagina.evaluate(() => document.querySelector('.hito-en-mesa .hito-explicacion').textContent.indexOf('Solo aquí') === 0), true);

/* ========== 5. Crear solo en este asunto ========== */

await volver();
await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Crear');
await comprobar('5. «Crear» lleva la caja «Explicación» vacía', pagina.evaluate(() => ({ hay: !!document.getElementById('hda-cuerpo'), t: document.getElementById('hda-cuerpo').textContent })), { hay: true, t: '' });
await pagina.fill('#hda-titulo', 'Nota con viñetas');
await PONER('<p>Pasos:</p><ul><li>uno</li><li>dos</li></ul>');
await pagina.check('input[name="dsg-donde"][value="aqui"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
const idNota = (await leerHitos(ASUNTO_1)).filter((h) => h.titulo === 'Nota con viñetas')[0].id;
await comprobar('5. el hito nuevo guarda su explicación con viñetas', cuerpoHito(ASUNTO_1, idNota), '<p>Pasos:</p><ul><li>uno</li><li>dos</li></ul>');
await volver();
await abrirMesaDe('Actual', idNota);
await comprobar('5. y la mesa la enseña con sus viñetas', pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .hito-explicacion li').length), 2);

/* ========== 6. Crear desde la biblioteca ========== */

await volver();
await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Crear');
await pagina.fill('#hda-titulo', 'Firma');
await pagina.waitForSelector('.hda-biblioteca-resultados:not(.oculto) .hda-biblioteca-opcion');
await pagina.click('.hda-biblioteca-opcion');
await comprobar('6. al elegir el modelo, la caja se rellena con su explicación',
  pagina.evaluate(() => document.querySelectorAll('#hda-cuerpo li').length), 2);
await PONER('<p>Con el sello, cambiado:</p><ul><li>Sello</li></ul>');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
const firma = (await leerHitos(ASUNTO_1)).filter((h) => h.titulo === 'Firma de Secretaría')[0];
await comprobar('6. el paso nuevo lleva el texto cambiado', cuerpoPaso(firma.origenGuia), '<p>Con el sello, cambiado:</p><ul><li>Sello</li></ul>');
await comprobar('6. la biblioteca no se toca', pagina.evaluate(async () => {
  const b = await Carpetas.leerJson(App.E.gestor, 'hitos-biblioteca.json'); return b.modelos[0].explicacion;
}), '<p>Con el sello:</p><ul><li>Sello</li><li>Firma</li></ul>');

/* ========== 7. Vaciar la explicación ========== */

await volver();
await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Cambiar');
await PONER('<p><br></p>');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('7. explicación vaciada: se guarda vacía', cuerpoHito(ASUNTO_1, 'c1'), '');
await comprobar('7. la mesa ya no la enseña', pagina.evaluate(() => !document.querySelector('.hito-en-mesa .hito-explicacion')), true);

/* ========== 8. 15 líneas a 1280 px ========== */

await volver();
await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Cambiar');
await PONER(Array.from({ length: 15 }, (_, i) => '<p>Línea ' + (i + 1) + '</p>').join(''));
await comprobar('8. «Guardar» a la vista y la página sin desplazar', pagina.evaluate(() => {
  const b = document.getElementById('cuadro-aceptar').getBoundingClientRect();
  const c = document.querySelector('#capa .cuadro').getBoundingClientRect();
  return { guardar: b.top >= 0 && b.bottom <= window.innerHeight, cuadro: c.right <= window.innerWidth && c.bottom <= window.innerHeight, scroll: window.scrollY, ancho: document.documentElement.scrollWidth <= window.innerWidth };
}), { guardar: true, cuadro: true, scroll: 0, ancho: true });
await pagina.click('#cuadro-cancelar');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await pagina.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
