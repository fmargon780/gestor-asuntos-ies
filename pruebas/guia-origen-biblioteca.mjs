/* Prueba en navegador de verdad de los apartados 2 y 3 de
   docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md (28-sep-2026, fila 201):

   1. Apartado 2: cada hito de la guía lleva su etiqueta de origen,
      siempre a la vista («De la biblioteca», «De la biblioteca ·
      cambiado aquí», «Propio de este tipo»); pulsar la de uno que
      viene de la biblioteca enseña el nombre del modelo.
   2. Apartado 3, punto 1: escribir «Firma de Sec» en el título de un
      hito nuevo ofrece «Usarlo»; pulsarlo trae el modelo entero y la
      etiqueta pasa a «De la biblioteca».

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Un modelo de la biblioteca, creado directamente (sin pasar por su
   propia pantalla: no es lo que se prueba aquí). */
const modelo = await pagina.evaluate(() =>
  HitosBiblioteca.crearDesdePaso(
    { id: 'm1', titulo: 'Firma de Secretaría', opciones: [], cuerpo: '' },
    'Firma de Secretaría', 'Francisco'));

const GUIA = [
  { id: 'p1', titulo: 'Ya de la biblioteca', opciones: [],
    origenBiblioteca: { id: modelo.id, revision: modelo.revision, divergido: false } },
  { id: 'p2', titulo: 'Cambiado aquí', opciones: [],
    origenBiblioteca: { id: modelo.id, revision: modelo.revision, divergido: true } },
  { id: 'p3', titulo: 'Uno propio', opciones: [] }
];

await pagina.evaluate(([GUIA]) => { window.__guardada = Guias.editar('CERTIFICADO', GUIA, [], []); }, [GUIA]);
await pagina.waitForSelector('#guia-pasos .paso-editor');

const textoChip = (pos) => pagina.textContent('#guia-pasos > .paso-editor[data-pos="' + pos + '"] > .paso-cabecera > .chip-origen');

/* ================= 1. la etiqueta de cada hito ================= */
console.log('--- 1. la etiqueta de origen, siempre a la vista ---');
await comprobar('«De la biblioteca», sin cambios', textoChip(0), 'De la biblioteca');
await comprobar('«De la biblioteca · cambiado aquí», divergido', textoChip(1), 'De la biblioteca · cambiado aquí');
await comprobar('«Propio de este tipo», sin origen', textoChip(2), 'Propio de este tipo');

console.log('--- pulsar la etiqueta enseña el nombre del modelo ---');
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] > .paso-cabecera > .chip-origen');
await pagina.waitForSelector('#guia-pasos > .paso-editor[data-pos="0"] .chip-origen-ver');
await comprobar('el nombre del modelo, y el enlace a la biblioteca',
  pagina.textContent('#guia-pasos > .paso-editor[data-pos="0"] > .paso-cabecera > .chip-origen-panel'),
  'Firma de SecretaríaVer en la biblioteca');

/* ================= 2. la biblioteca se ofrece sola ================= */
console.log('--- 2. escribir el título de un hito nuevo ofrece "Usarlo" ---');
await pagina.click('#guia-anadir');
await pagina.waitForSelector('#guia-pasos > .paso-editor[data-pos="3"]');
await pagina.locator('#guia-pasos > .paso-editor[data-pos="3"] > .paso-cabecera > .paso-titulo').fill('Firma de Sec');
await pagina.waitForSelector('#guia-pasos > .paso-editor[data-pos="3"] .paso-titulo-usarlo');
await comprobar('dice qué hay en la biblioteca',
  pagina.textContent('#guia-pasos > .paso-editor[data-pos="3"] > .paso-cabecera > .paso-titulo-parecido'),
  'En la biblioteca hay «Firma de Secretaría» · Usarlo');

await pagina.click('#guia-pasos > .paso-editor[data-pos="3"] .paso-titulo-usarlo');
await comprobar('«Usarlo» trae el modelo entero (el título, primero)',
  pagina.inputValue('#guia-pasos > .paso-editor[data-pos="3"] > .paso-cabecera > .paso-titulo'),
  'Firma de Secretaría');
await comprobar('y la etiqueta pasa a «De la biblioteca»', textoChip(3), 'De la biblioteca');

await pagina.keyboard.press('Escape');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
