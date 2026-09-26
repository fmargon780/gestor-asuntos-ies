/* Prueba en navegador de verdad de la fila 136 (25-sep-2026,
   docs/PLAZO-DE-CONSERVACION.md): cuánto tiempo se guarda cada asunto.

   1. Tipo con 4 años y asunto archivado hace más de 4 → sale en el aviso.
   2. Con `conservarHasta` en el futuro → no sale.
   3. Tipo sin plazo → nunca sale.
   4. Un archivado de antes, sin fecha de cierre: con la del nombre,
      marcado como aproximado.
   5. «Conservar más tiempo…» apunta `conservarHasta` en su ficha y sale
      de la lista.
   6. «Mandar a la papelera» lo deja en la papelera, no borrado, y se
      puede devolver a su sitio del ARCHIVO. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
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
async function esperar(fn, arg) {
  for (let i = 0; i < 100; i++) {
    if (await pagina.evaluate(fn, arg)) return;
    await pagina.waitForTimeout(100);
  }
}

const ANA = '210901 MATRICULA 21-22 Pérez, Ana 1234';
const LUIS = '210902 MATRICULA 21-22 Gómez, Luis 5678';
const EVA = '150901 MATRICULA 15-16 Ruiz, Eva 9999';
const COMPRA = '190901 COMPRA Papeles del Sur SL B29111222';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([ana, luis, eva, compra]) => {
  async function archivado(categoria, tercero, nombre, ficha) {
    const cat = await window.__disco.archivo.getDirectoryHandle(categoria, { create: true });
    const ter = await cat.getDirectoryHandle(tercero, { create: true });
    const car = await ter.getDirectoryHandle(nombre, { create: true });
    const doc = await car.getFileHandle('210901 SOLICITUD.pdf', { create: true });
    const w = await doc.createWritable(); await w.write('pdf'); await w.close();
    if (ficha) {
      const f = await car.getFileHandle('_ficha.json', { create: true });
      const w2 = await f.createWritable(); await w2.write(JSON.stringify(ficha)); await w2.close();
    }
  }
  await archivado('ALUMNADO', 'Pérez, Ana 1234', ana, { cerradoEl: '2021-06-01T10:00:00.000Z' });
  await archivado('ALUMNADO', 'Gómez, Luis 5678', luis, { cerradoEl: '2021-06-02T10:00:00.000Z', conservarHasta: '2099-01-01' });
  await archivado('ALUMNADO', 'Ruiz, Eva 9999', eva, null);
  await archivado('EMPRESAS', 'Papeles del Sur SL B29111222', compra, { cerradoEl: '2019-10-01T10:00:00.000Z' });
}, [ANA, LUIS, EVA, COMPRA]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(500);
await pagina.evaluate(async () => { await App.reconstruirIndiceArchivo(); });

const cumplidos = () => pagina.evaluate(async () => (await Conservacion.leerCumplidos()).lista
  .map(x => x.entrada.nombre + (x.plazo.aproximada ? ' (aprox.)' : '')).sort());

console.log('--- sin plazo en ningún tipo: nunca avisa ---');
await comprobar('ninguno', cumplidos(), []);

console.log('--- el campo del tipo ---');
await pagina.evaluate(() => App.abrirTipoDeAsunto(App.E.tipos.filter(t => t.tipo === 'MATRICULA')[0]));
await pagina.waitForSelector('#pantalla-tipo-asunto .tipo-conservar-anios', { state: 'attached' });
await pagina.evaluate(() => { document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').open = true; });
await comprobar('trae el enlace a las tablas de valoración',
  pagina.locator('#pantalla-tipo-asunto .tipo-conservar-fila a').getAttribute('href').then(h => h.indexOf('tablas-valoracion') !== -1), true);
await pagina.fill('#pantalla-tipo-asunto .tipo-conservar-anios', '4');
await pagina.dispatchEvent('#pantalla-tipo-asunto .tipo-conservar-anios', 'change');
await esperar(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const t = JSON.parse(await (await (await g.getFileHandle('tipos.json')).getFile()).text()).filter(x => x.tipo === 'MATRICULA')[0];
  return t && t.conservarAnios === 4;
});
await comprobar('se guarda en tipos.json como número', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  return JSON.parse(await (await (await g.getFileHandle('tipos.json')).getFile()).text()).filter(x => x.tipo === 'MATRICULA')[0].conservarAnios;
}), 4);

console.log('--- 1 a 4. quién ha cumplido su plazo ---');
await comprobar('Ana (archivada en 2021) y Eva (sin fecha de cierre, aproximada); ni Luis (conservar hasta 2099) ni la COMPRA (sin plazo)',
  cumplidos(), [EVA + ' (aprox.)', ANA].sort());
await comprobar('el índice guarda la fecha de archivo', pagina.evaluate(async (n) => {
  const r = await IndiceArchivo.leerDisco({ todos: true });
  return r.datos.asuntos.filter(e => e.nombre === n)[0].archivadoEl;
}, ANA), '2021-06-01');
await comprobar('4 años sobre el 29 de febrero caen en el 28', pagina.evaluate(() => Conservacion.sumarAnios('2024-02-29', 1)), '2025-02-28');

console.log('--- el aviso en Ajustes › Mantenimiento ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
await pagina.evaluate(async () => { await App.pintarAjustesMantenimiento(); });
await comprobar('el bloque se ve', pagina.locator('#bloque-conservacion').isHidden(), false);
await comprobar('su resumen, en el título plegado', pagina.locator('#bloque-conservacion .bloque-resumen').textContent(),
  '2 asuntos han cumplido su plazo de conservación');
await pagina.evaluate(() => { document.getElementById('bloque-conservacion').open = true; });
await comprobar('dos filas; la de Eva, con la fecha aproximada',
  pagina.locator('#tabla-conservacion .conservacion-fila').allTextContents().then(l => l.map(t => t.indexOf('(aprox.)') !== -1)).then(l => l.sort()),
  [false, true]);

console.log('--- 5. «Conservar más tiempo…» ---');
await pagina.check(`#tabla-conservacion .conservacion-elegir[data-nombre="${ANA}"]`);
await pagina.click('#btn-conservacion-mas');
await pagina.waitForSelector('#conservar-mas-anios');
await pagina.fill('#conservar-mas-anios', '3');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await esperar(() => document.querySelectorAll('#tabla-conservacion .conservacion-fila').length === 1);
const dentroDeTres = await pagina.evaluate(() => Conservacion.sumarAnios(U.hoyIso(), 3));
await comprobar('apunta conservarHasta en su _ficha.json', pagina.evaluate(async () => {
  const c = await (await (await window.__disco.archivo.getDirectoryHandle('ALUMNADO')).getDirectoryHandle('Pérez, Ana 1234'))
    .getDirectoryHandle('210901 MATRICULA 21-22 Pérez, Ana 1234');
  return JSON.parse(await (await (await c.getFileHandle('_ficha.json')).getFile()).text()).conservarHasta;
}), dentroDeTres);
await comprobar('y ya no sale', cumplidos(), [EVA + ' (aprox.)']);

console.log('--- 6. «Mandar a la papelera» ---');
await pagina.check(`#tabla-conservacion .conservacion-elegir[data-nombre="${EVA}"]`);
await pagina.click('#btn-conservacion-papelera');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('la confirmación dice cuántos', pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('1 asunto') !== -1), true);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await esperar(() => document.getElementById('bloque-conservacion').classList.contains('oculto'));
const enElArchivo = () => pagina.evaluate(async () => {
  const t = await (await window.__disco.archivo.getDirectoryHandle('ALUMNADO')).getDirectoryHandle('Ruiz, Eva 9999');
  const n = []; for await (const [k] of t.entries()) n.push(k); return n;
});
await comprobar('ya no está en el ARCHIVO', enElArchivo(), []);
await comprobar('está en la papelera, con su carpeta', pagina.evaluate(async (n) => {
  const l = await Papelera.leer();
  const f = l.filter(x => x.nombre === n)[0];
  if (!f) return null;
  const pap = await Papelera._interno.carpetaPapelera();
  const car = await pap.getDirectoryHandle(f.carpeta);
  const dentro = []; for await (const [k] of car.entries()) dentro.push(k);
  return [f.clase, dentro];
}, EVA), ['archivado', ['210901 SOLICITUD.pdf']]);
await comprobar('y fuera del índice', pagina.evaluate(async (n) => (await IndiceArchivo.leerDisco({ todos: true })).datos.asuntos.some(e => e.nombre === n), EVA), false);
await comprobar('el bloque se esconde: ya no queda ninguno', pagina.locator('#bloque-conservacion').isHidden(), true);

console.log('--- y se devuelve a su sitio ---');
await comprobar('devolver sale bien', pagina.evaluate(async (n) => {
  const f = (await Papelera.leer()).filter(x => x.nombre === n)[0];
  return (await Papelera.devolver(f)).ok;
}, EVA), true);
await comprobar('vuelve a su carpeta del ARCHIVO', enElArchivo(), [EVA]);
await comprobar('y a su índice', pagina.evaluate(async (n) => (await IndiceArchivo.leerDisco({ todos: true })).datos.asuntos.some(e => e.nombre === n), EVA), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
