/* Prueba en navegador de verdad de la fila 168
   (docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md): las opciones de cada documento
   de la ficha, en su propia fila. ⧉ detrás del nombre, «Registrar» si
   falta, «Poner nombre» siempre, «Asociar a un hito» y ⋮ con solo
   «Pasar a versiones previas» y «Borrar»; «+ Añadir documento» junto al
   título, sin «Documentos ▾»; y las herramientas de PDF en una barra
   encima del documento, en el visor, solo para un PDF.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/filas-estrechas.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({
  viewport: { width: 1600, height: 950 }, permissions: ['clipboard-read', 'clipboard-write']
});
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript(() => {
  window.__tarjeta = 'documentos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba SL 12345678A';
const PDF = '260911 SOLICITUD Papel de prueba.pdf';
const WORD = 'nota suelta.docx';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.pdf, window.__disco.fich(datos.pdf, '%PDF-1.4 lo que sea', 'application/pdf'));
  carpeta._hijos.set(datos.word, window.__disco.fich(datos.word, 'PK lo que sea'));
}, { asunto: NOMBRE_ASUNTO, pdf: PDF, word: WORD });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

function filaDe(nombre) {
  return pagina.locator('#ficha-documentos .ficha-documento-fila', {
    has: pagina.locator('.ficha-documento', { hasText: nombre })
  });
}

console.log('--- 1. el título del bloque ---');
await comprobar('1. «+ Añadir documento» está junto al título',
  pagina.locator('.ficha-titulo .ficha-documentos-anadir').textContent(), '+ Añadir documento');
await comprobar('1. no queda «Documentos ▾» en la ficha',
  pagina.locator('#pantalla-asunto').getByRole('button', { name: 'Documentos ▾' }).count(), 0);

console.log('--- 2. la fila de un documento sin registro ---');
const botones = await filaDe(PDF).evaluate((fila) =>
  Array.from(fila.children).filter(n => n.tagName === 'BUTTON').map(b => b.textContent.trim()));
await comprobar('2. ⧉ justo detrás del nombre, «Registrar» y «Poner nombre» a la vista',
  botones.slice(1), ['⧉', 'Registrar', 'Poner nombre']);
await comprobar('2. el título de ⧉ lo explica',
  filaDe(PDF).locator('.ficha-documento-copiar').getAttribute('title'), 'Copiar el nombre, sin la extensión');
await filaDe(PDF).locator('.fila-menu-btn').click();
await comprobar('2. el menú ⋮ tiene solo dos cosas',
  filaDe(PDF).locator('.fila-menu button').allTextContents().then(ts => ts.map(t => t.trim())),
  ['Pasar a versiones previas', 'Borrar']);
await filaDe(PDF).locator('.fila-menu-btn').click();

console.log('--- 3. ⧉ copia el nombre sin la extensión ---');
await filaDe(PDF).locator('.ficha-documento-copiar').click();
await pagina.waitForTimeout(200);
await comprobar('3. en el portapapeles, sin .pdf',
  pagina.evaluate(() => navigator.clipboard.readText()), '260911 SOLICITUD Papel de prueba');
await comprobar('3. js/copiar.js ya no mete su «Copiar» en la fila',
  filaDe(PDF).locator('.boton-copiar-nombre').count(), 0);

console.log('--- 4. la barra de PDF, en el visor ---');
await pagina.locator('#ficha-documentos .ficha-documento', { hasText: PDF }).click();
await pagina.waitForSelector('#visor-acciones:not(.oculto) .ficha-visor-pdf');
await comprobar('4. un PDF de un asunto abierto trae las cinco herramientas',
  pagina.locator('#visor-acciones .ficha-visor-pdf button').allTextContents(),
  ['Separar', 'Unir', 'Sacar páginas', 'Ajustar tamaño', 'Repartir entre terceros']);
await pagina.click('#visor-cerrar');
await comprobar('4. un Word no trae la barra',
  pagina.evaluate(async (datos) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
    const h = await carpeta.getFileHandle(datos.nombre);
    const antes = window.WordVisor; window.WordVisor = null;   /* sin el Word grande: el visor lateral */
    try { await Visor.abrir(h, datos.nombre, { asunto: App.asuntoDeLaFicha(), acciones: null }); }
    finally { window.WordVisor = antes; }
    const hay = !!document.querySelector('#visor-acciones:not(.oculto) .ficha-visor-pdf');
    Visor.cerrar();
    return hay;
  }, { asunto: NOMBRE_ASUNTO, nombre: WORD }), false);
await comprobar('4. y el visor abierto desde otro sitio (sin acciones) tampoco',
  pagina.evaluate(async (datos) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
    await Visor.abrir(await carpeta.getFileHandle(datos.nombre), datos.nombre);
    const hay = !!document.querySelector('#visor-acciones:not(.oculto) .ficha-visor-pdf');
    Visor.cerrar();
    return hay;
  }, { asunto: NOMBRE_ASUNTO, nombre: PDF }), false);

console.log('--- 5. «Poner nombre» renombra y repinta ---');
await filaDe(WORD).getByRole('button', { name: 'Poner nombre', exact: true }).click();
await pagina.waitForSelector('#doc-guardar');
await pagina.fill('#doc-fecha', '2026-09-11');
await pagina.selectOption('#doc-tipo', 'SOLICITUD');
await pagina.fill('#doc-curso', 'Renombrado');
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('ficha-documentos').textContent.indexOf('Renombrado') !== -1);
await comprobar('5. la ficha enseña el nombre nuevo y ya no el viejo',
  pagina.evaluate(() => {
    const t = document.getElementById('ficha-documentos').textContent;
    return [t.indexOf('260911 SOLICITUD Renombrado.docx') !== -1, t.indexOf('nota suelta') !== -1];
  }), [true, false]);

console.log('--- 6. «+ Añadir documento» abre el cuadro de añadir ---');
await pagina.click('.ficha-documentos-anadir');
await pagina.waitForSelector('#doc-guardar');
await comprobar('6. el cuadro es el del asunto', pagina.locator('#cuadro-titulo').textContent(), NOMBRE_ASUNTO);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

await comprobar('sin errores de consola', errores, []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
