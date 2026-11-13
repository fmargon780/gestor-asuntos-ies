/* Prueba en navegador de verdad de los bloques plegados de la ficha del asunto (24-sep-2026, fila 107 de
   docs/COLA.md; adaptada a la fila 425 y, el 13-nov-2026, a la fila 637, docs/637-VISTA-DEL-ASUNTO-CABECERA-Y-PANEL.md:
   antes eran pestañas, ahora son cinco bloques plegados a la derecha del hito).

   A 1905×1000 y a 1280×800:
     1. No hay pestañas; los cinco bloques están a la vista, en su orden, plegados, y «Registro» lleva su número.
     2. Pulsar el título de un bloque lo abre (y se ve su contenido); volver a pulsarlo lo pliega; abrir uno no pliega otro.
     3. Con un documento abierto a la derecha (tapando los bloques), Escape lo cierra primero; el siguiente cierra la
        mesa del hito (la lista) y el siguiente sale de la ficha.
     4. Escribir una nota, provocar un repintado: ni se pliega lo abierto ni se pierde lo escrito.
     5. Desde «En Administración» (Inicio), entra con la mesa del hito y con los bloques plegados. */
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

const hitoEnLaMesa = (pagina) => pagina.evaluate(() => (document.querySelector('#ficha-guia .hito-en-mesa') || {}).dataset?.id || null);

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

/* Los bloques de la derecha que están abiertos, en su orden. */
const bloquesAbiertos = (pagina) => pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-plegables .ficha-plegable.abierto')).map((b) => b.dataset.tarjeta));
const cabecera = (pagina, titulo) => pagina.locator('#ficha-plegables .plegable-cab', { hasText: titulo }).first();

for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);
  await abrirFicha(pagina);

  /* 1. */
  await comprobar('1. los bloques, a la vista y en su orden',
    pagina.locator('#ficha-plegables .plegable-titulo').allTextContents(),
    ['Datos', 'Personas y entidades relacionadas', 'Documentos de la carpeta', 'Registro', 'Otros asuntos de este tercero']);
  await comprobar('1. no hay pestañas', pagina.locator('#ficha-tarjetas-pestanas, .ficha-pestana').count(), 0);
  await comprobar('1. todos plegados al entrar', bloquesAbiertos(pagina), []);
  await comprobar('1. y la vista es la de siempre («Trabajo»)', pagina.evaluate(() => FichaTarjetas.abierta()), 'trabajo');
  await comprobar('1. «Registro» lleva su número (1 nota)',
    pagina.locator('#ficha-plegables .ficha-cuenta[data-cuenta-tarjeta="notas"]').textContent(), '1');
  await comprobar('1. con el contenido de «Registro» plegado (oculto)', pagina.locator('#ficha-notas textarea').first().isVisible(), false);

  /* 2. */
  await cabecera(pagina, 'Registro').click();
  await comprobar('2. por su título se abre Registro', bloquesAbiertos(pagina), ['notas']);
  await comprobar('2. y se ve la caja de escribir la nota', pagina.locator('#ficha-notas textarea').first().isVisible(), true);
  await comprobar('2. los demás siguen plegados (su contenido no se ve)', pagina.locator('#ficha-relacionados').isVisible(), false);
  await cabecera(pagina, 'Documentos de la carpeta').click();
  await comprobar('2. abrir otro no pliega el primero', bloquesAbiertos(pagina), ['documentos', 'notas']);
  await cabecera(pagina, 'Registro').click();
  await comprobar('2. volver a pulsar un título lo pliega', bloquesAbiertos(pagina), ['documentos']);
  await comprobar('2. y su contenido se oculta', pagina.locator('#ficha-notas textarea').first().isVisible(), false);
  await pagina.evaluate(() => FichaTarjetas.plegar('documentos'));
  await comprobar('2. «FichaTarjetas.plegar» los deja todos plegados', bloquesAbiertos(pagina), []);

  /* 3. */
  await cabecera(pagina, 'Documentos de la carpeta').click();
  await pagina.locator('#ficha-documentos button.ficha-documento', { hasText: DOCS[0] }).click();
  await pagina.waitForSelector('body.con-visor');
  await comprobar('3. el documento tapa los bloques', pagina.locator('#trabajo-der.con-documento #ficha-plegables').isVisible(), false);
  await pagina.waitForTimeout(300);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('3. el primer Escape cierra el documento y deja la mesa (y vuelven los bloques)', [await pagina.locator('#ficha-plegables').isVisible(), await hitoEnLaMesa(pagina)], [true, 'm1']);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('3. el siguiente cierra la mesa del hito (la lista de hitos)', [await pagina.locator('#ficha-plegables').isVisible(), await hitoEnLaMesa(pagina)], [true, null]);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
  await comprobar('3. y el siguiente sale de la ficha', pagina.locator('#pantalla-asunto').isVisible(), false);
  await abrirFicha(pagina);

  /* 4. */
  await cabecera(pagina, 'Registro').click();
  await pagina.locator('#ficha-notas textarea').first().fill('Nota a medias que no se puede perder');
  /* Un repintado entero de verdad: llega un documento a la carpeta. */
  await pagina.evaluate(async (asunto) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
    c._hijos.set('260910 NUEVO.pdf', window.__disco.fich('260910 NUEVO.pdf', 'x'));
    window.__nodoFicha = document.getElementById('ficha-tarjetas');
    await App.verAbiertos();
  }, ASUNTO);
  await pagina.waitForTimeout(400);
  await comprobar('4. la ficha se ha repintado de verdad',
    pagina.evaluate(() => window.__nodoFicha !== document.getElementById('ficha-tarjetas')), true);
  await comprobar('4. tras el repintado, Registro sigue abierto (no se pliega)', bloquesAbiertos(pagina), ['notas']);
  await comprobar('4. y lo escrito sigue ahí',
    pagina.locator('#ficha-notas textarea').first().inputValue(), 'Nota a medias que no se puede perder');
  await pagina.locator('#ficha-notas textarea').first().fill('');
  await pagina.waitForTimeout(100);

  /* 5. */
  await pagina.keyboard.press('Escape');
  /* m1 necesita responsable de Administración para salir en "En Administración" (Inicio, fila 209): esta guía no se
     lo pone. La fecha ya no hace falta desde la fila 209 (sale igual, con "Sin plazo"), pero se le pone también. */
  await pagina.evaluate(async (asunto) => {
    var hoy = new Date().toISOString().slice(0, 10);
    await Hitos.cambiar(function (datos) {
      var e = datos.porAsunto[asunto];
      var h = e && e.hitos.filter(function (x) { return x.id === 'm1'; })[0];
      if (h) { h.responsable = 'administracion'; h.fecha = hoy; }
      return datos;
    });
  }, ASUNTO);
  await pagina.click('.pestana[data-pantalla="abiertos"]');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
  await pagina.click('.inicio-pestana[data-pestana="adm"]');
  await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
  /* La lista se pinta un momento después de verse la pantalla (lee los hitos). */
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-hito="m1"]', { state: 'attached' });
  await pagina.evaluate(() => document.querySelector('#inicio-tabla-cuerpo tr[data-hito="m1"]').click());
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(600);
  await comprobar('5. desde "En Administración" (Inicio), entra con los bloques plegados', bloquesAbiertos(pagina), []);
  await comprobar('5. y con la mesa del hito', hitoEnLaMesa(pagina), 'm1');

  await comprobar('sin errores en la consola', errores, []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
