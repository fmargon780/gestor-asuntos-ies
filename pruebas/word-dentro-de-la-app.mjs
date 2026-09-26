/* Prueba en navegador de verdad de la fila 155 de docs/COLA.md
   (docs/WORD-DENTRO-DE-LA-APP.md), con una plantilla real del centro
   (`plantillas/acuerdo-iniciacion-cambio-centro.docx`):

   1. Con huecos sin dato, sale «Faltan datos para este documento» ANTES
      de que haya ningún fichero nuevo en la carpeta; al escribir un
      valor, el Word guardado lo lleva.
   2. «Cancelar» no deja nada en la carpeta.
   3. Tras generar, el Word se abre dentro de la aplicación; «Guardar
      PDF» deja en la carpeta un .pdf con el mismo nombre que el Word.
   4. Abrir un .docx que ya está, desde la ficha, no hace `window.open`
      de un `blob:`: se abre en el visor de la aplicación.
   5. Otro fichero que el navegador no sabe enseñar se baja con su
      nombre de verdad (un enlace con `download`), no con el del `blob:`. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const PLANTILLA = fs.readFileSync(new URL('../plantillas/acuerdo-iniciacion-cambio-centro.docx', import.meta.url)).toString('base64');

const ASUNTO = '260910 CAMBIO CENTRO 26-27 Inventada Uno, Eva 9990001';
const PLANTILLAS = {
  lista: [],
  documentos: [{ id: 'pd-1', tipo: 'CAMBIO CENTRO', categoria: 'ALUMNADO', nombre: 'Acuerdo de iniciación',
                 fichero: 'acuerdo.docx', tipoDocumento: 'ACUERDO', texto: 'iniciacion', firmante: '', vistoBueno: '' }]
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
await pagina.addInitScript(() => {
  window.__abiertos = [];
  const abrirDeVerdad = window.open;
  window.open = function (url) { window.__abiertos.push(String(url)); return null; };
  window.__abrirDeVerdad = abrirDeVerdad;
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([plantillas, b64, a1]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('plantillas.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(plantillas)); await w.close();
  const carpeta = await g.getDirectoryHandle('PLANTILLAS', { create: true });
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const f = await carpeta.getFileHandle('acuerdo.docx', { create: true });
  const w2 = await f.createWritable(); await w2.write(new Blob([bytes])); await w2.close();
  const d = await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  const x = await d.getFileHandle('260901 HOJA.xlsx', { create: true });
  const w3 = await x.createWritable(); await w3.write('no es de verdad'); await w3.close();
}, [PLANTILLAS, PLANTILLA, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (a1) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CAMBIO CENTRO', categoria: 'ALUMNADO',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(500);

const ficherosDelAsunto = () => pagina.evaluate(async (a1) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  const n = []; for await (const [k, v] of d.entries()) if (v.kind === 'file') n.push(k);
  return n.sort();
}, ASUNTO);
function generar() {
  return pagina.evaluate((a1) => {
    const a = App.asuntoDeLaFicha();
    window.__generado = PlantillasDocumento.generar(a, Plantillas.enMemoria().documentos[0], 'abierto').then(() => 'hecho', (e) => 'error ' + e.message);
  }, ASUNTO);
}
await pagina.evaluate(() => Plantillas.cargar(App.E.gestor));

console.log('--- 2. «Cancelar» no deja nada ---');
await generar();
await pagina.waitForSelector('#capa:not(.oculto) .word-falta');
await comprobar('sale «Faltan datos para este documento»',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent), 'Faltan datos para este documento');
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(() => window.__generado);
await comprobar('«Cancelar» no deja nada en la carpeta', ficherosDelAsunto(), ['260901 HOJA.xlsx']);

console.log('--- 1. el dato, antes de guardar ---');
await generar();
await pagina.waitForSelector('#capa:not(.oculto) .word-falta');
await comprobar('con el cuadro a la vista, todavía no hay ningún fichero nuevo', ficherosDelAsunto(), ['260901 HOJA.xlsx']);
const hueco = await pagina.evaluate(() => document.querySelector('#capa .word-falta').dataset.hueco);
await pagina.fill('#capa .word-falta', 'VALOR ESCRITO A MANO');
await pagina.click('#cuadro-aceptar');
await comprobar('generar termina bien', pagina.evaluate(() => window.__generado), 'hecho');
const tras = await ficherosDelAsunto();
const word = tras.filter((n) => /\.docx$/.test(n))[0];
await comprobar('el Word está en la carpeta', !!word, true);
console.log('   (hueco rellenado a mano: ' + hueco + ')');

console.log('--- 3. el Word, dentro de la aplicación, y «Guardar PDF» ---');
await pagina.waitForSelector('#word-visor:not(.oculto) section.docx', { timeout: 20000 });
await comprobar('el Word lleva lo escrito a mano',
  pagina.evaluate(() => document.querySelector('#word-visor .word-visor-hoja').textContent.indexOf('VALOR ESCRITO A MANO') > -1), true);
await comprobar('el visor nombra el Word', pagina.evaluate(() => document.querySelector('.word-visor-nombre').textContent), word);
await pagina.click('#word-visor .word-visor-pdf');
await pagina.waitForFunction(() => !document.querySelector('#word-visor .word-visor-pdf').disabled &&
  document.querySelector('#word-visor .word-visor-pdf').textContent === 'Guardar PDF', null, { timeout: 30000 });
await pagina.waitForTimeout(300);
const pdf = word.replace(/\.docx$/, '.pdf');
await comprobar('«Guardar PDF» deja en la carpeta un PDF con el mismo nombre', ficherosDelAsunto().then((l) => l.indexOf(pdf) > -1), true);
await comprobar('y es un PDF de verdad', pagina.evaluate(async ([a1, n]) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  const t = await (await (await d.getFileHandle(n)).getFile()).arrayBuffer();
  return new TextDecoder().decode(new Uint8Array(t).slice(0, 5));
}, [ASUNTO, pdf]), '%PDF-');
/* Fila 160: con su PDF, el Word pasa a «Versiones previas». */
await comprobar('y el Word, con su PDF, pasa a «Versiones previas»', pagina.evaluate(async ([a1, n]) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  try { await (await d.getDirectoryHandle('Versiones previas')).getFileHandle(n); return true; } catch (e) { return false; }
}, [ASUNTO, word]), true);
/* Fila 173, punto 7: «Guardar PDF» ya deja cerrado el visor solo, sin
   tener que pulsar «Cerrar» a mano. */
await comprobar('«Guardar PDF» cierra el visor solo',
  pagina.evaluate(() => document.getElementById('word-visor').classList.contains('oculto')), true);

console.log('--- 4. abrir un .docx que ya está ---');
await pagina.evaluate(() => { window.__abiertos = []; });
await pagina.evaluate(async ([a1, n]) => {
  const d = await (await window.__disco.abiertos.getDirectoryHandle(a1)).getDirectoryHandle('Versiones previas');
  await Visor.abrir(await d.getFileHandle(n), n);
}, [ASUNTO, word]);
await pagina.waitForSelector('#word-visor:not(.oculto) section.docx', { timeout: 20000 });
await comprobar('se abre en el visor de la aplicación, sin window.open de un blob:',
  pagina.evaluate(() => window.__abiertos.filter((u) => u.indexOf('blob:') === 0).length), 0);
await comprobar('y con «Guardar PDF» para la carpeta del asunto (la de la ficha)',
  pagina.evaluate(() => !document.querySelector('#word-visor .word-visor-pdf').disabled), true);
await pagina.keyboard.press('Escape');
await comprobar('Escape lo cierra', pagina.evaluate(() => document.getElementById('word-visor').classList.contains('oculto')), true);

console.log('--- 5. otro fichero, con su nombre de verdad ---');
const descarga = pagina.waitForEvent('download', { timeout: 10000 });
await pagina.evaluate(async (a1) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  await Visor.abrir(await d.getFileHandle('260901 HOJA.xlsx'), '260901 HOJA.xlsx');
}, ASUNTO);
await comprobar('se baja como «260901 HOJA.xlsx»', descarga.then((d) => d.suggestedFilename()), '260901 HOJA.xlsx');
await comprobar('sin window.open de un blob:', pagina.evaluate(() => window.__abiertos.filter((u) => u.indexOf('blob:') === 0).length), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
