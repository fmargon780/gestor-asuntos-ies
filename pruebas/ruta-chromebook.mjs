/* Prueba en navegador de verdad de la fila 770 de docs/COLA.md
   (docs/770-LA-APP-DESDE-UN-CHROMEBOOK.md): «Ruta» y «Abrir en Drive» en un Chromebook.

   Con `window.__ES_CHROMEBOOK__ = true`:
   1. «Ruta» de la ficha copia solo el nombre de la carpeta y el aviso lo dice; no pide ruta.
   2. Lo mismo con un asunto archivado.
   3. «Ruta» de un documento copia solo el nombre del documento.
   4. «Ruta» del cuadro de Correo y del de Séneca (montarEnCuadro): solo el nombre, sin formulario.
   5. «Abrir en Drive» junto a «Ruta» abre la búsqueda en Drive con la cuenta común.
   6. «Comprobación al entrar» no lleva «Ruta de la nube en este ordenador».
   Con `window.__ES_CHROMEBOOK__ = false`: «Ruta» pide la ruta como siempre, no hay «Abrir en Drive»
   y la comprobación sigue como antes. */
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

const GUIAS = {
  SOLICITUD: [
    { id: 'h1', titulo: 'Tramitar', cuerpo: '', opciones: [], responsable: '' }
  ]
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([ABIERTO, ARCHIVADO, TERCERO]) => {
  await window.__disco.abiertos.getDirectoryHandle(ABIERTO, { create: true });
  await App.anotar(ABIERTO, { tercero: TERCERO, categoria: 'ALUMNADO', tipo: 'SOLICITUD' });
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle(TERCERO, { create: true });
  await ter.getDirectoryHandle(ARCHIVADO, { create: true });
  await App.verAbiertos();
}, [ABIERTO, ARCHIVADO, TERCERO]);

const PIDE = (t) => t.indexOf('Ruta de la carpeta') === 0;

async function pulsar(b, ficha) {
  await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
  await pagina.evaluate(() => { document.querySelectorAll('#mensajes .mensaje').forEach((m) => m.remove()); });
  await b.click();
  await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#mensajes .mensaje.bueno, #capa:not(.oculto)')).length > 0, null, { timeout: 4000 }).catch(() => {});
  const texto = await pagina.evaluate(() => navigator.clipboard.readText());
  const aviso = await pagina.evaluate(() => (document.querySelector('#mensajes .mensaje.bueno') || {}).textContent || '');
  const cuadro = await pagina.evaluate(() => !!document.querySelector('#capa:not(.oculto)'));
  return { texto, aviso, cuadro };
}

console.log('--- Chromebook ---');
await pagina.evaluate(() => { window.__ES_CHROMEBOOK__ = true; });
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ABIERTO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-ruta .boton-copiar-fila');
await comprobar('en la ficha: «Ruta» y «Abrir en Drive»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-ruta .boton-copiar-fila')).map(b => b.textContent.trim())), ['Ruta', 'Abrir en Drive']);
let r = await pulsar(pagina.locator('#ficha-ruta .boton-copiar-fila', { hasText: /^Ruta$/ }));
await comprobar('«Ruta» copia solo el nombre del asunto', r.texto, ABIERTO);
await comprobar('el aviso lo dice', r.aviso, 'Copiado: ' + ABIERTO + '. Pégalo en la lupa de la ventana «Abrir archivo».');
await comprobar('no pide ninguna ruta', r.cuadro, false);

/* el asunto archivado y los cuadros, con el botón montado a mano */
r = await pagina.evaluate(async ([ARCH]) => {
  const b = RutaCarpetas.boton({ nombre: ARCH }, 'archivado'); document.body.appendChild(b);
  await navigator.clipboard.writeText('(nada)'); b.click();
  await new Promise((f) => setTimeout(f, 400));
  const t = await navigator.clipboard.readText(); b.remove(); return t;
}, [ARCHIVADO]);
await comprobar('asunto archivado: solo el nombre', r, ARCHIVADO);
r = await pagina.evaluate(async ([ABI]) => {
  const lugar = document.createElement('span'), en = document.createElement('div'); document.body.append(lugar, en);
  RutaCarpetas.montarEnCuadro(lugar, en, { nombre: ABI }, 'abierto');
  await navigator.clipboard.writeText('(nada)'); lugar.querySelector('button').click();
  await new Promise((f) => setTimeout(f, 400));
  const t = await navigator.clipboard.readText(); const form = en.innerHTML; lugar.remove(); en.remove(); return [t, form];
}, [ABIERTO]);
await comprobar('cuadro de Correo o Séneca: solo el nombre y sin formulario', r, [ABIERTO, '']);
r = await pagina.evaluate(async ([ABI]) => {
  const b = RutaCarpetas.botonDocumento({ nombre: ABI }, 'abierto', { nombre: 'Solicitud firmada.pdf' }); document.body.appendChild(b);
  await navigator.clipboard.writeText('(nada)'); b.click();
  await new Promise((f) => setTimeout(f, 400));
  const t = await navigator.clipboard.readText(); b.remove(); return t;
}, [ABIERTO]);
await comprobar('«Ruta» de un documento: solo el nombre del documento', r, 'Solicitud firmada.pdf');

/* «Abrir en Drive» */
await pagina.evaluate(() => { window.__abierto = null; window.open = (u, d, f) => { window.__abierto = [u, d, f]; return null; }; });
await pagina.click('#ficha-abrir-en-drive');
const abierto = await pagina.evaluate(() => window.__abierto);
await comprobarQue('«Abrir en Drive» abre la búsqueda del asunto con la cuenta común, en otra pestaña',
  abierto && abierto[0].indexOf('https://drive.google.com/drive/search?q=' + encodeURIComponent(ABIERTO)) === 0 &&
  /&authuser=[^&]+$/.test(abierto[0]) && abierto[1] === '_blank' && abierto[2] === 'noopener');

/* comprobación al entrar */
await comprobar('«Comprobación al entrar» sin la línea de la ruta',
  pagina.evaluate(async () => (await ComprobacionEntrada.revisar()).filter((f) => f.id === 'ruta').length), 0);

console.log('--- No Chromebook ---');
await pagina.evaluate(() => { window.__ES_CHROMEBOOK__ = false; });
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ABIERTO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#ficha-ruta .boton-copiar-fila');
await comprobar('en la ficha solo «Ruta»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-ruta .boton-copiar-fila')).map(b => b.textContent.trim())), ['Ruta']);
await pagina.click('#ficha-ruta .boton-copiar-fila');
await pagina.waitForSelector('#ruta-pedida-ficha');
await comprobarQue('«Ruta» pide la ruta como siempre', true);
await pagina.click('#capa button:has-text("Cancelar")').catch(() => {});
await comprobar('«Comprobación al entrar» sigue con la línea de la ruta',
  pagina.evaluate(async () => (await ComprobacionEntrada.revisar()).filter((f) => f.id === 'ruta').length), 1);

await navegador.close();
if (errores.length) { fallos++; console.log('ERRORES EN CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? 'FALLAN ' + fallos : 'TODO BIEN');
process.exit(fallos ? 1 : 0);
