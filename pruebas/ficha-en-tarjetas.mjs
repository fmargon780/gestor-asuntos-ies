/* Prueba en navegador de verdad de la ficha del asunto en tarjetas
   (24-sep-2026, fila 107 de docs/COLA.md, docs/FICHA-EN-TARJETAS.md).

   A 1905×1000 (monitor del trabajo) y a 1280×800 (Chromebook):
     1. Todas las tarjetas se ven enteras sin desplazarse.
     2. Pulsar Hitos la abre en grande; las demás salen como pestañas;
        pasar a Notas por su pestaña.
     3. Con un documento abierto a la derecha, la tarjeta sigue abierta
        y ocupa el resto.
     4. La franja de Hitos enseña los documentos del hito desplegado;
        pulsar un chip abre el documento sin cerrar la tarjeta.
     5. Escape vuelve a la cuadrícula (y un segundo Escape, a la lista).
     6. Escribir una nota, provocar un repintado: ni se cierra la
        tarjeta ni se pierde lo escrito.
     7. Desde "Qué me toca", entra con Hitos en grande y el hito
        desplegado.

   Con FOTOS=<carpeta>, deja allí una foto de la cuadrícula y otra de una
   tarjeta abierta con el documento a la derecha, a 1905 px. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [] },
    { id: 'm2', titulo: 'Comprobar el expediente', cuerpo: '', opciones: [] },
    { id: 'm3', titulo: 'Grabar en Séneca', cuerpo: '', opciones: [] }
  ]
};
const DOCS = ['260901 SOLICITUD.pdf', '260902 JUSTIFICANTE.pdf', '260903 DNI.pdf'];

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function preparar(ancho, alto) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(preparacion);
  await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.evaluate(async ([guias, docs, asunto]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    const h = await g.getFileHandle('guias.json', { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
    docs.forEach((d) => c._hijos.set(d, window.__disco.fich(d, '%PDF-1.4 de mentira')));
  }, [GUIAS, DOCS, ASUNTO]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async ([asunto, docs]) => {
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
      tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {},
      notas: [{ texto: 'Llamó la madre para preguntar por el plazo', quien: 'Francisco', cuando: new Date().toISOString() }] });
    await Hitos.anadirDocumento(asunto, 'm1', docs[0]);
    await App.verAbiertos();
  }, [ASUNTO, DOCS]);
  await pagina.waitForTimeout(300);
  return { pagina, errores };
}

async function abrirFicha(pagina) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre', { hasText: ASUNTO }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForTimeout(500);
}

function todasEnteras(pagina) {
  return pagina.evaluate(() => {
    const alto = window.innerHeight;
    const t = Array.from(document.querySelectorAll('#ficha-tarjetas .ficha-tarjeta'));
    return t.length >= 6 && t.every((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= alto + 1 && r.height > 60;
    }) && document.documentElement.scrollHeight <= alto + 2;
  });
}

function abierta(pagina) {
  return pagina.evaluate(() => (document.getElementById('ficha-tarjetas') || {}).dataset?.abierta || null);
}

for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);
  await abrirFicha(pagina);

  /* 1. */
  await comprobar('1. todas las tarjetas se ven enteras, sin desplazarse', todasEnteras(pagina), true);
  await comprobar('1. las del mismo tamaño',
    pagina.evaluate(() => {
      const t = Array.from(document.querySelectorAll('#ficha-tarjetas .ficha-tarjeta')).map((el) => Math.round(el.getBoundingClientRect().height));
      return Math.max(...t) - Math.min(...t) <= 1;
    }), true);
  await comprobar('1. Hitos resume "0 de 3 hechos"',
    pagina.locator('.ficha-tarjeta[data-tarjeta="hitos"] .ficha-tarjeta-resumen .fuerte').textContent(), '0 de 3 hechos');
  await comprobar('1. Documentos dice cuántos hay',
    pagina.locator('.ficha-tarjeta[data-tarjeta="documentos"] .ficha-tarjeta-resumen .fuerte').textContent(), '3 documentos');
  await comprobar('1. Notas enseña la última',
    pagina.locator('.ficha-tarjeta[data-tarjeta="notas"] .ficha-tarjeta-resumen').textContent().then((t) => t.indexOf('Llamó la madre') !== -1), true);
  if (ancho === 1905 && process.env.FOTOS) await pagina.screenshot({ path: process.env.FOTOS + '/tarjetas-cuadricula.png' });

  /* 2. */
  await pagina.click('.ficha-tarjeta[data-tarjeta="hitos"] .ficha-tarjeta-resumen');
  await comprobar('2. pulsar Hitos la abre en grande', abierta(pagina), 'hitos');
  await comprobar('2. se ven sus hitos de verdad', pagina.locator('#ficha-guia .hito').first().isVisible(), true);
  await comprobar('2. las demás salen como pestañas',
    pagina.locator('#ficha-tarjetas-pestanas .ficha-pestana').count().then((n) => n >= 6), true);
  await comprobar('2. las demás tarjetas no se ven',
    pagina.locator('.ficha-tarjeta[data-tarjeta="notas"]').isVisible(), false);
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"]');
  await comprobar('2. por su pestaña se pasa a Notas', abierta(pagina), 'notas');
  await comprobar('2. y se ve la caja de escribir la nota',
    pagina.locator('#ficha-notas textarea').first().isVisible(), true);

  /* 4. Desde la fila 109, un hito se abre a pantalla completa (su mesa)
     en vez de desplegarse: la franja sale con la lista de hitos, y con
     la mesa abierta se esconde (la mesa ya tiene sus documentos). */
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="hitos"]');
  await comprobar('4. con la lista de hitos, la franja trae todos los documentos',
    pagina.locator('.ficha-tarjeta.abierta .ficha-chip-doc').count(), 3);
  await pagina.locator('.ficha-tarjeta.abierta .ficha-chip-doc', { hasText: DOCS[0] }).click();
  await pagina.waitForSelector('body.con-visor');
  await pagina.waitForTimeout(300);
  await comprobar('4. el chip abre el documento a la derecha, sin cerrar la tarjeta', abierta(pagina), 'hitos');
  await comprobar('4. y el chip queda marcado',
    pagina.locator('.ficha-tarjeta.abierta .ficha-chip-doc.activo').textContent(), DOCS[0]);
  await pagina.locator('#ficha-guia .hito[data-id="m1"] .hito-desplegar').click();
  await pagina.waitForTimeout(200);
  await comprobar('4. con la mesa del hito abierta, la franja no sale',
    pagina.locator('.ficha-tarjeta.abierta .ficha-chip-doc').count(), 0);
  await comprobar('4. la mesa enseña el documento del hito',
    pagina.locator('#ficha-guia .hito-en-mesa .hito-documento').allTextContents().then((t) => t.join(' ').indexOf(DOCS[0]) !== -1), true);
  await comprobar('4. la mesa del hito sigue abierta con el documento a la derecha',
    pagina.locator('#ficha-guia .hito[data-id="m1"] .hito-cuerpo').isVisible(), true);

  /* 3. */
  await comprobar('3. con el documento a la derecha, la tarjeta ocupa el resto',
    pagina.evaluate(() => {
      const t = document.querySelector('.ficha-tarjeta.abierta').getBoundingClientRect();
      const v = document.querySelector('#visor, .visor, [id*="visor"]');
      const vr = v ? v.getBoundingClientRect() : null;
      return t.width > 300 && (!vr || t.right <= vr.left + 2);
    }), true);
  if (ancho === 1905 && process.env.FOTOS) await pagina.screenshot({ path: process.env.FOTOS + '/tarjetas-abierta-con-documento.png' });

  /* 5. El primer Escape cierra el documento, el siguiente la tarjeta. */
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('5. el primer Escape cierra el documento y deja la tarjeta', abierta(pagina), 'hitos');
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('5. el siguiente cierra la mesa del hito (fila 109) y deja la tarjeta', abierta(pagina), 'hitos');
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('5. Escape vuelve a la cuadrícula', abierta(pagina), null);
  await comprobar('5. seguimos en la ficha', pagina.locator('#pantalla-asunto').isVisible(), true);

  /* 6. */
  await pagina.click('.ficha-tarjeta[data-tarjeta="notas"] .ficha-tarjeta-resumen');
  await pagina.locator('#ficha-notas textarea').first().fill('Nota a medias que no se puede perder');
  /* Un repintado entero de verdad: llega un documento a la carpeta. */
  await pagina.evaluate(async (asunto) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
    c._hijos.set('260910 NUEVO.pdf', window.__disco.fich('260910 NUEVO.pdf', 'x'));
    window.__nodoFicha = document.getElementById('ficha-tarjetas');
    await App.verAbiertos();
  }, ASUNTO);
  await pagina.waitForTimeout(400);
  await comprobar('6. la ficha se ha repintado de verdad',
    pagina.evaluate(() => window.__nodoFicha !== document.getElementById('ficha-tarjetas')), true);
  await comprobar('6. tras el repintado, Notas sigue abierta', abierta(pagina), 'notas');
  await comprobar('6. y lo escrito sigue ahí',
    pagina.locator('#ficha-notas textarea').first().inputValue(), 'Nota a medias que no se puede perder');
  await pagina.locator('#ficha-notas textarea').first().fill('');
  await pagina.waitForTimeout(100);

  /* 7. */
  await pagina.keyboard.press('Escape');
  await pagina.evaluate(() => document.querySelector('.pestana[data-pantalla="que-me-toca"]').click());
  await pagina.waitForSelector('#pantalla-que-me-toca:not(.oculto)');
  /* La lista se pinta un momento después de verse la pantalla (lee los hitos). */
  await pagina.waitForSelector('.qmt-fila[data-hito="m1"]', { state: 'attached' });
  await pagina.evaluate(() => document.querySelector('.qmt-fila[data-hito="m1"]').click());
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(600);
  await comprobar('7. desde "Qué me toca", entra con Hitos en grande', abierta(pagina), 'hitos');
  await comprobar('7. y el hito desplegado',
    pagina.locator('#ficha-guia .hito[data-id="m1"] .hito-cuerpo').isVisible(), true);

  await comprobar('sin errores en la consola', errores, []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
