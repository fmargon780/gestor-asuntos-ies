/* Prueba en navegador de verdad de las pestañas de la ficha del asunto (24-sep-2026, fila 107 de
   docs/COLA.md, docs/FICHA-EN-TARJETAS.md; adaptada el 22-oct-2026 a la fila 425,
   docs/FICHA-VISTA-DE-TRABAJO.md: antes era una cuadrícula de tarjetas con resumen, ahora pestañas).

   A 1905×1000 y a 1280×800:
     1. Las pestañas están siempre a la vista y «Trabajo» es la primera y la abierta.
     2. Pasar a otra pestaña por su botón; solo se ve la abierta.
     3. Con un documento abierto a la derecha, Escape lo cierra primero; el siguiente cierra la mesa del
        hito (la lista) y el siguiente sale de la ficha.
     4. Escribir una nota, provocar un repintado: ni cambia la pestaña ni se pierde lo escrito.
     5. Desde «En Administración» (Inicio), entra en «Trabajo» con la mesa del hito. */
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

const pestanaAbierta = (pagina) => pagina.evaluate(() => (document.getElementById('ficha-tarjetas') || {}).dataset?.abierta || null);

for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);
  await abrirFicha(pagina);

  /* 1. */
  await comprobar('1. las pestañas están a la vista, «Trabajo» primera',
    pagina.locator('#ficha-tarjetas-pestanas .ficha-pestana').allTextContents().then((t) => [t.length >= 6, t[0]]), [true, 'Trabajo']);
  await comprobar('1. «Trabajo» está abierta', pestanaAbierta(pagina), 'trabajo');
  await comprobar('1. «Registro» lleva su número (1 nota)',
    pagina.locator('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"] .ficha-pestana-cuenta').textContent(), '1');

  /* 2. */
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"]');
  await comprobar('2. por su pestaña se pasa a Registro', pestanaAbierta(pagina), 'notas');
  await comprobar('2. y se ve la caja de escribir la nota', pagina.locator('#ficha-notas textarea').first().isVisible(), true);
  await comprobar('2. las demás no se ven', pagina.locator('.ficha-tarjeta[data-tarjeta="relacionados"]').isVisible(), false);
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="trabajo"]');

  /* 3. */
  await pagina.locator('#ficha-documentos button.ficha-documento', { hasText: DOCS[0] }).click();
  await pagina.waitForSelector('body.con-visor');
  await pagina.waitForTimeout(300);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('3. el primer Escape cierra el documento y deja la mesa', [await pestanaAbierta(pagina), await hitoEnLaMesa(pagina)], ['trabajo', 'm1']);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('3. el siguiente cierra la mesa del hito (la lista de hitos)', [await pestanaAbierta(pagina), await hitoEnLaMesa(pagina)], ['trabajo', null]);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
  await comprobar('3. y el siguiente sale de la ficha', pagina.locator('#pantalla-asunto').isVisible(), false);
  await abrirFicha(pagina);

  /* 4. */
  await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"]');
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
  await comprobar('4. tras el repintado, Registro sigue abierta', pestanaAbierta(pagina), 'notas');
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
  await comprobar('5. desde "En Administración" (Inicio), entra en «Trabajo»', pestanaAbierta(pagina), 'trabajo');
  await comprobar('5. y con la mesa del hito', hitoEnLaMesa(pagina), 'm1');

  await comprobar('sin errores en la consola', errores, []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
