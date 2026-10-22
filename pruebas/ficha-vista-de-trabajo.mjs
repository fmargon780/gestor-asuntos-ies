/* Prueba en navegador de verdad de la ficha con vista de trabajo
   (22-oct-2026, fila 425 de docs/COLA.md, docs/FICHA-VISTA-DE-TRABAJO.md, parte A).

   Con un asunto de la demostración con tres hitos y varios documentos:
     1. Al abrirlo, la primera pestaña es «Trabajo» y está abierta, con el hito actual a la vista.
     2. A la izquierda, el hito de arriba abajo (tareas, campos, documentos del hito, registro); a la
        derecha, la carpeta; cada columna mide la mitad y la página no baja.
     3. Los documentos de la carpeta que son del hito abierto llevan «Hito N»; al cambiar de hito, cambian.
     4. Otra pestaña se abre a todo el ancho; «Trabajo» vuelve a las dos columnas.
     5. Pulsar un documento de la carpeta lo abre en la columna derecha, con «← Carpeta», y el hito sigue
        a la izquierda; «← Carpeta» y Escape devuelven la lista.
     6. La casilla de un documento de la carpeta lo pone entre los adjuntos del hito abierto.
     7. A 1000 px las columnas van una debajo de otra.
     8. «← Hitos» enseña la lista en la columna izquierda y no se reabre sola un hito.

   Con FOTOS=<carpeta>, deja allí una foto de la vista a 1905 px. */
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
    await Hitos.anadirDocumento(asunto, 'm2', docs[1]);
    await App.verAbiertos();
  }, [ASUNTO, DOCS]);
  await pagina.waitForTimeout(300);
  return { pagina, errores };
}

async function abrirFicha(pagina) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  /* Fila 209: la celda de la tabla ya no lleva el nombre entero de la
     carpeta (solo el tercero); se busca por `data-asunto`, que sí lo
     lleva siempre. */
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ASUNTO + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForTimeout(500);
}


const pestanaAbierta = (pagina) => pagina.evaluate(() => (document.getElementById('ficha-tarjetas') || {}).dataset?.abierta || null);
const hitoEnMesa = (pagina) => pagina.evaluate(() => (document.querySelector('#ficha-guia .hito-en-mesa') || {}).dataset?.id || null);
const marcas = (pagina) => pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila'))
  .map((f) => [f.dataset.doc, (f.querySelector('.ficha-marca-hito') || {}).textContent || '']));
const caja = (pagina, sel) => pagina.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom }; }, sel);

for (const [ancho, alto] of [[1905, 1000], [1600, 900]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);
  await abrirFicha(pagina);

  /* 1. */
  await comprobar('1. la primera pestaña es «Trabajo»',
    pagina.locator('#ficha-tarjetas-pestanas .ficha-pestana').first().textContent(), 'Trabajo');
  await comprobar('1. y está abierta', pestanaAbierta(pagina), 'trabajo');
  await comprobar('1. ya no hay pestañas «Hitos» ni «Documentos de la carpeta»',
    pagina.locator('#ficha-tarjetas-pestanas .ficha-pestana').allTextContents().then((t) => t.filter((x) => /^(Hitos|Documentos de la carpeta)/.test(x)).length), 0);
  await comprobar('1. se abre solo el hito actual (el primero sin hacer)', hitoEnMesa(pagina), 'm1');

  /* 2. */
  await comprobar('2. a la izquierda: tareas, campos, documentos del hito y registro, en ese orden',
    pagina.evaluate(() => {
      const col = document.querySelector('#trabajo-izq .mesa-col-hito');
      return Array.from(col.children).map((e) => e.classList.contains('mesa-grande-guion') ? 'tareas' : e.classList.contains('mesa-campos-hito') ? 'campos'
        : e.classList.contains('mesa-grande-docs') ? 'docs' : e.classList.contains('mesa-grande-notas') ? 'registro' : e.classList.contains('mesa-normativa') ? 'normativa' : '?');
    }).then((o) => o.filter((x) => x !== 'normativa')), ['tareas', 'campos', 'docs', 'registro']);
  await comprobar('2. a la derecha: la carpeta con sus tres documentos',
    pagina.locator('#trabajo-der #ficha-documentos .ficha-documento-fila').count(), 3);
  const izq = await caja(pagina, '#trabajo-izq'), der = await caja(pagina, '#trabajo-der');
  await comprobar('2. cada columna mide la mitad (±2 %)', Math.abs(izq.w - der.w) / (izq.w + der.w) <= 0.02, true);
  await comprobar('2. una al lado de la otra', izq.x < der.x && Math.abs(izq.y - der.y) < 2, true);
  await comprobar('2. llenan el alto hasta abajo de la ventana', Math.abs(izq.b - alto) < 40, true);
  await comprobar('2. y la página no baja', pagina.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2), true);
  if (ancho === 1905 && process.env.FOTOS) await pagina.screenshot({ path: process.env.FOTOS + '/trabajo-dos-columnas.png' });

  /* 3. */
  await comprobar('3. el documento del hito 1 lleva «Hito 1»; los demás, nada', marcas(pagina),
    [[DOCS[0], 'Hito 1'], [DOCS[1], ''], [DOCS[2], '']].sort());
  await pagina.locator('#ficha-guia .mesa-tira-hito[data-id="m2"]').click();
  await pagina.waitForTimeout(500);
  await comprobar('3. al cambiar de hito, la marca cambia', marcas(pagina),
    [[DOCS[0], ''], [DOCS[1], 'Hito 2'], [DOCS[2], '']]);
  await pagina.locator('#ficha-guia .mesa-tira-hito[data-id="m1"]').click();
  await pagina.waitForTimeout(500);

  /* 4. */
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="contacto"]');
  await comprobar('4. «Datos y contacto» se abre', pestanaAbierta(pagina), 'contacto');
  await comprobar('4. a todo el ancho: ya no se ven las dos columnas', pagina.locator('#trabajo-columnas').isVisible(), false);
  await comprobar('4. y su contenido ocupa más de la mitad de la ventana',
    pagina.evaluate(() => document.querySelector('.ficha-tarjeta.abierta').getBoundingClientRect().width > window.innerWidth * 0.6), true);
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="trabajo"]');
  await comprobar('4. «Trabajo» vuelve a las dos columnas', pagina.locator('#trabajo-columnas').isVisible(), true);
  await comprobar('4. con el mismo hito', hitoEnMesa(pagina), 'm1');

  /* 5. */
  await pagina.locator('#ficha-documentos button.ficha-documento', { hasText: DOCS[2] }).click();
  await pagina.waitForSelector('#trabajo-der #visor-lateral.en-trabajo');
  await pagina.waitForTimeout(300);
  await comprobar('5. el documento se abre en la columna derecha', pagina.locator('#trabajo-der #visor-lateral').isVisible(), true);
  await comprobar('5. en lugar de la lista', pagina.locator('#trabajo-carpeta').isVisible(), false);
  await comprobar('5. con «← Carpeta» arriba', pagina.locator('#visor-volver').isVisible(), true);
  await comprobar('5. el hito sigue a la izquierda', hitoEnMesa(pagina), 'm1');
  const dentro = await caja(pagina, '#visor-lateral');
  const derecha = await caja(pagina, '#trabajo-der');
  await comprobar('5. y el visor llena la columna', Math.abs(dentro.w - derecha.w) < 6 && dentro.x >= derecha.x - 1, true);
  await comprobar('5. la página no se estrecha', pagina.evaluate(() => getComputedStyle(document.getElementById('aplicacion')).paddingRight), '0px');
  await pagina.click('#visor-volver');
  await pagina.waitForTimeout(200);
  await comprobar('5. «← Carpeta» devuelve la lista', pagina.locator('#trabajo-carpeta').isVisible(), true);
  await comprobar('5. y cierra el visor', pagina.evaluate(() => document.body.classList.contains('con-visor')), false);
  await pagina.locator('#ficha-documentos button.ficha-documento', { hasText: DOCS[1] }).click();
  await pagina.waitForSelector('#trabajo-der #visor-lateral.en-trabajo');
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('5. Escape cierra primero el visor y deja la lista', [await pagina.locator('#trabajo-carpeta').isVisible(), await pestanaAbierta(pagina)], [true, 'trabajo']);
  /* Con otra pestaña abierta, abrir un documento lleva antes a «Trabajo». */
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"]');
  await pagina.evaluate(async (asunto) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
    await Visor.abrir(await c.getFileHandle('260903 DNI.pdf'), '260903 DNI.pdf', {});
  }, ASUNTO);
  await pagina.waitForTimeout(300);
  await comprobar('5. desde otra pestaña, primero se pasa a «Trabajo»', [await pestanaAbierta(pagina), await pagina.locator('#trabajo-der #visor-lateral').isVisible()], ['trabajo', true]);
  await pagina.click('#visor-volver');
  await pagina.waitForTimeout(200);
  await comprobar('5. y al cerrarlo se vuelve a la pestaña de antes', pestanaAbierta(pagina), 'notas');
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="trabajo"]');

  /* 6. */
  await pagina.locator('#ficha-documentos .ficha-documento-fila', { hasText: DOCS[2] }).locator('.ficha-documento-marca').check();
  await comprobar('6. la casilla de un documento de la carpeta lo pone entre los adjuntos del hito',
    pagina.evaluate(() => HitoMesaDocumentos.marcados(document)), [DOCS[2]]);
  await comprobar('6. y la barra de lo marcado lo cuenta', pagina.locator('.hito-en-mesa .mesa-seleccion').isVisible(), true);
  await pagina.locator('#ficha-documentos .ficha-documento-fila', { hasText: DOCS[2] }).locator('.ficha-documento-marca').uncheck();

  /* 7. */
  await pagina.setViewportSize({ width: 1000, height: alto });
  await pagina.waitForTimeout(300);
  const i2 = await caja(pagina, '#trabajo-izq'), d2 = await caja(pagina, '#trabajo-der');
  await comprobar('7. a 1000 px, una columna debajo de la otra', d2.y >= i2.b - 2 && Math.abs(i2.x - d2.x) < 2, true);
  await pagina.setViewportSize({ width: ancho, height: alto });
  await pagina.waitForTimeout(300);

  /* 8. */
  await pagina.click('#mesa-volver-hitos');
  await pagina.waitForTimeout(400);
  await comprobar('8. «← Hitos» enseña la lista', [await hitoEnMesa(pagina), await pagina.locator('#ficha-guia .hito').count()], [null, 3]);
  await comprobar('8. y las casillas de la carpeta se esconden', pagina.locator('#ficha-documentos .ficha-documento-marca').first().isVisible(), false);
  await pagina.evaluate(() => HitosPanel.programarRepintado());
  await pagina.waitForTimeout(500);
  await comprobar('8. un repintado no reabre el hito solo', hitoEnMesa(pagina), null);

  await comprobar('sin errores en la consola', errores, []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
