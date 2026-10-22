/* Prueba en navegador de verdad de la fila 423 de docs/COLA.md (docs/RUTA-DE-UN-DOCUMENTO.md):
   el botón «Ruta» de cada documento copia su ruta entera, con la extensión.
   Sale en la ficha del asunto (justo detrás del ⧉), en la mesa del hito, en las versiones
   previas (`_Previas` y `Versiones previas`, con su nombre real) y en la barra del visor.
   Asunto abierto y archivado; sin la ruta del centro, la pide con el cuadro de siempre y
   después copia la del documento. Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');


let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const ABIERTO = '260918 SOLICITUD 26-27 Pérez Ruiz, Ana 1150055';
const ARCHIVADO = '250110 MATRICULA 25-26 Pérez Ruiz, Ana 1150055';
const TERCERO = 'Pérez Ruiz, Ana 1150055';
const FACTURA = '261019 FACTURA D26-00259.pdf';
const GUIAS = { SOLICITUD: [{ id: 'h1', titulo: 'Tramitar', cuerpo: '', opciones: [], responsable: '' }] };

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
/* Las rutas de Dropbox y del centro, puestas de antemano (la demostración no las trae). */
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const escribir = async (n, t) => { const h = await g.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(t); await w.close(); };
  await escribir('guias.json', JSON.stringify(guias));
  await escribir('rutas.json', JSON.stringify({ abiertos: 'IES/ASUNTOS ABIERTOS', archivo: 'ARCHIVO' }));
  localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\francisco\\Dropbox');
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([ABIERTO, ARCHIVADO, TERCERO, FACTURA]) => {
  async function fichero(dir, nombre) { const h = await dir.getFileHandle(nombre, { create: true }); const w = await h.createWritable(); await w.write('%PDF-1.4\n%%EOF'); await w.close(); }
  const ab = await window.__disco.abiertos.getDirectoryHandle(ABIERTO, { create: true });
  await fichero(ab, FACTURA);
  await fichero(await ab.getDirectoryHandle('_Previas', { create: true }), '261018 FACTURA vieja.pdf');
  await App.anotar(ABIERTO, { tercero: TERCERO, categoria: 'ALUMNADO', tipo: 'SOLICITUD' });
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle(TERCERO, { create: true });
  const ar = await ter.getDirectoryHandle(ARCHIVADO, { create: true });
  await fichero(ar, FACTURA);
  await fichero(await ar.getDirectoryHandle('Versiones previas', { create: true }), '250101 Antigua.pdf');
  await App.verAbiertos();
}, [ABIERTO, ARCHIVADO, TERCERO, FACTURA]);

const BASE = 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\' + ABIERTO + '\\';
const BASE_ARCHIVO = 'C:\\Users\\francisco\\Dropbox\\ARCHIVO\\ALUMNADO\\' + TERCERO + '\\' + ARCHIVADO + '\\';

async function pegado(clic) {
  await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
  await clic();
  await pagina.waitForFunction(() => navigator.clipboard.readText().then((t) => t !== '(nada)'));
  const t = await pagina.evaluate(() => navigator.clipboard.readText());
  await pagina.waitForTimeout(1300);
  return t;
}

/* ---------- ficha de un asunto abierto ---------- */
console.log('--- 1 y 2. ficha, asunto abierto ---');
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ABIERTO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('.ficha-documento-fila');
await comprobarQue('1. el botón «Ruta» va justo detrás del ⧉ de cada documento',
  pagina.evaluate(() => {
    const c = document.querySelector('.ficha-documento-fila .ficha-documento-copiar');
    const r = c && c.nextElementSibling;
    return !!r && r.classList.contains('ruta-documento') && r.textContent.trim() === 'Ruta' && r.classList.contains('boton-chico');
  }));
await comprobar('2. copia la ruta entera del documento, con su nombre y su .pdf',
  pegado(() => pagina.click('.ficha-documento-fila .ruta-documento')), BASE + FACTURA);
await comprobar('el aviso verde enseña la ruta copiada',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#mensajes .mensaje.bueno')).map((m) => m.textContent).filter((t) => t.indexOf('Ruta copiada: ') === 0).pop()),
  'Ruta copiada: ' + BASE + FACTURA);

console.log('--- 4. versiones previas ---');
await pagina.evaluate(() => { const d = document.querySelector('.ficha-previas'); if (d) d.open = true; });
await comprobar('la previa lleva su botón y copia ...\\_Previas\\nombre.pdf',
  pegado(() => pagina.click('.ficha-previa-fila .ruta-documento')), BASE + '_Previas\\261018 FACTURA vieja.pdf');

console.log('--- 3. el visor ---');
await pagina.click('.ficha-documento-fila .ficha-documento');
await pagina.waitForSelector('#visor-lateral:not(.oculto) #visor-ruta .ruta-documento');
await comprobar('3. el visor lleva «Ruta» junto al nombre y copia la del documento abierto',
  pegado(() => pagina.click('#visor-ruta .ruta-documento')), BASE + FACTURA);
await pagina.click('#visor-cerrar');

/* ---------- la mesa del hito ---------- */
console.log('--- 3. la mesa del hito ---');
await pagina.evaluate(async ([ABIERTO, FACTURA]) => { await Hitos.anadirDocumento(ABIERTO, 'h1', FACTURA); await Hitos.anadirDocumento(ABIERTO, 'h1', '261018 FACTURA vieja.pdf'); }, [ABIERTO, FACTURA]);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(400);
await pagina.locator('#ficha-guia .hito[data-id="h1"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="h1"]');
await pagina.locator('.hito-en-mesa .mesa-resumen[data-tarjeta="docs"]').click();
await pagina.waitForSelector('.hito-en-mesa .mesa-doc .ruta-documento >> visible=true');
await comprobar('3. el documento de la mesa del hito lleva «Ruta» y copia la del documento',
  pegado(() => pagina.click('.hito-en-mesa .mesa-doc .ruta-documento >> visible=true')), BASE + FACTURA);
await comprobar('5. con el visor abierto desde la mesa también sale',
  (async () => { await pagina.click('.hito-en-mesa .mesa-doc-abrir >> visible=true'); await pagina.waitForSelector('#visor-lateral:not(.oculto) #visor-ruta .ruta-documento'); return true; })(), true);
await pagina.click('#visor-cerrar');
await pagina.evaluate(() => { const d = document.querySelector('.hito-en-mesa .mesa-previas'); if (d) d.open = true; });
await comprobar('4. la previa de la mesa del hito lleva su botón y copia ...\\_Previas\\nombre.pdf',
  pegado(() => pagina.click('.hito-en-mesa .mesa-previa-fila .ruta-documento >> visible=true')), BASE + '_Previas\\261018 FACTURA vieja.pdf');

/* ---------- asunto archivado ---------- */
console.log('--- asunto archivado ---');
await pagina.evaluate(async ([ARCHIVADO, TERCERO]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle(TERCERO);
  const h = await ter.getDirectoryHandle(ARCHIVADO);
  App.abrirFicha({
    nombre: ARCHIVADO, handle: h, padre: ter, ruta: 'ALUMNADO / ' + TERCERO,
    categoria: 'ALUMNADO', tercero: TERCERO, sueltoEn: '',
    leido: Nombres.leer(ARCHIVADO, App.E.tipos), ficha: { categoria: 'ALUMNADO', tercero: TERCERO }
  }, 'archivado');
}, [ARCHIVADO, TERCERO]);
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('.ficha-documento-fila .ruta-documento');
await comprobar('ficha de un archivado: ARCHIVO\\categoría\\tercero\\asunto\\nombre.pdf',
  pegado(() => pagina.click('.ficha-documento-fila .ruta-documento')), BASE_ARCHIVO + FACTURA);
await pagina.evaluate(() => { const d = document.querySelector('.ficha-previas'); if (d) d.open = true; });
await comprobar('y la de «Versiones previas» (carpeta antigua) lleva su nombre real',
  pegado(() => pagina.click('.ficha-previa-fila .ruta-documento')), BASE_ARCHIVO + 'Versiones previas\\250101 Antigua.pdf');

/* ---------- sin la ruta del centro: la pide y copia la del documento ---------- */
console.log('--- sin ruta: la pide ---');
await pagina.evaluate(async () => {
  localStorage.removeItem('gestor-ruta-dropbox');
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  await g.removeEntry('rutas.json');
});
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ABIERTO + '"] .nombre-pulsable').first().click();
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('.ficha-documento-fila .ruta-documento');
await pagina.click('.ficha-documento-fila .ruta-documento');
await pagina.waitForSelector('#capa:not(.oculto) #ruta-pedida-ficha');
await comprobar('pide la ruta de la CARPETA con el mismo cuadro de siempre',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent), 'Ruta de la carpeta ASUNTOS ABIERTOS');
await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
await pagina.fill('#ruta-pedida-ficha', 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await comprobar('y al guardar copia ya la ruta del documento, no la de la carpeta',
  pagina.evaluate(() => navigator.clipboard.readText()), BASE + FACTURA);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLO(S)' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
