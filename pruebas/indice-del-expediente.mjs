/* Prueba en navegador de verdad de la fila 137 (25-sep-2026,
   docs/INDICE-DEL-EXPEDIENTE.md): el índice del expediente.

   1. Una carpeta con tres documentos (uno registrado, uno «SIN SELLAR» y
      un Word) da tres filas en orden de fecha, con su registro y sus
      páginas, y un PDF de una página.
   2. El botón del menú de la ficha lo crea en la carpeta; rehacerlo
      manda el anterior a la papelera.
   3. No cuenta como documento: ni en la cuenta de la ficha, ni con
      «Registrar», ni en el índice del ARCHIVO.
   4. Archivar lo crea; si falla al crearlo, el asunto queda archivado
      igual (aviso ámbar). */
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

const ANA = '260901 MATRICULA 26-27 Pérez, Ana 1234';
const LUIS = '260902 MATRICULA 26-27 Gómez, Luis 5678';
const INDICE = '000 ÍNDICE DEL EXPEDIENTE.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* Las dos carpetas, con PDF de verdad (hechos con pdf-lib) y un Word. */
await pagina.evaluate(async ([ana, luis]) => {
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  async function pdf(paginas) {
    const d = await PDFLib.PDFDocument.create();
    for (let i = 0; i < paginas; i++) d.addPage();
    return d.save();
  }
  async function poner(dir, nombre, bytes) {
    const h = await dir.getFileHandle(nombre, { create: true });
    const w = await h.createWritable(); await w.write(new Blob([bytes])); await w.close();
  }
  for (const [nombre, tercero] of [[ana, 'Pérez, Ana 1234'], [luis, 'Gómez, Luis 5678']]) {
    const c = await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
    await poner(c, '260905 26EM1234 SOLICITUD.pdf', await pdf(2));
    await poner(c, '260903 SOLICITUD SIN SELLAR.pdf', await pdf(1));
    await poner(c, '260910 INFORME.docx', new TextEncoder().encode('word'));
    const actual = await Carpetas.leerJson(App.E.gestor, 'asuntos.json') || { asuntos: {} };
    actual.asuntos[nombre] = { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: tercero, estado: 'abierto', notas: [] };
    await Carpetas.guardarJson(App.E.gestor, 'asuntos.json', actual);
  }
  await App.cargarRegistro();
  await App.verAbiertos();
}, [ANA, LUIS]);
await pagina.evaluate(async () => { await App.reconstruirIndiceArchivo(); });

console.log('--- 1. los datos del índice ---');
const filas = await pagina.evaluate(async (n) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === n)[0];
  const d = await IndiceExpediente.datosDe(a);
  return d.filas.map(f => [f.fecha, f.registro, f.nombre, f.paginas, f.sinSellar]);
}, ANA);
await comprobar('tres filas, por fecha: sin sellar, registrado y Word', filas, [
  ['03-09-2026', '', '260903 SOLICITUD SIN SELLAR.pdf', 1, true],
  ['05-09-2026', '26EM1234', '260905 26EM1234 SOLICITUD.pdf', 2, false],
  ['10-09-2026', '', '260910 INFORME.docx', null, false]
]);

console.log('--- 2. el botón del menú de la ficha ---');
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter(a => a.nombre === n)[0], 'abierto'), ANA);
await pagina.waitForSelector('.ficha-nombre-menu-boton');
await pagina.click('.ficha-nombre-menu-boton');
await pagina.click('.ficha-menu:not(.oculto) >> text=Índice del expediente');
await pagina.waitForSelector('.mensaje.bueno:has-text("Índice del expediente hecho")');
const enCarpeta = (n) => pagina.evaluate(async (n) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(n);
  const l = []; for await (const [k] of c.entries()) l.push(k); return l.sort();
}, n);
await comprobar('está en la carpeta, el primero', enCarpeta(ANA).then(l => l[0]), INDICE);
await comprobar('es un PDF de una página, con el nombre de la carpeta en el título',
  pagina.evaluate(async (n) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(n);
    const bytes = new Uint8Array(await (await (await c.getFileHandle('000 ÍNDICE DEL EXPEDIENTE.pdf')).getFile()).arrayBuffer());
    const PDFLib = await PdfHerramientas.cargarPdfLib();
    const d = await PDFLib.PDFDocument.load(bytes);
    return [d.getPageCount(), d.getTitle().indexOf(n) !== -1];
  }, ANA), [1, true]);

console.log('--- 3. no cuenta como documento ---');
await pagina.waitForFunction(() => document.querySelector('#ficha-documentos .ficha-documento-indice'));
await comprobar('se ve en la lista de la ficha', pagina.locator('#ficha-documentos .ficha-documento-indice').count(), 1);
await comprobar('pero la cuenta dice 3', pagina.locator('#ficha-cuenta-docs').textContent(), '3');
await comprobar('y su fila no trae «Registrar»',
  pagina.evaluate(() => !!document.querySelector('#ficha-documentos .ficha-documento-indice').closest('.ficha-documento-fila')
    .querySelector('button[title^="Dar registro"]')), false);
await comprobar('ni sale en los documentos del resumen', pagina.evaluate(() =>
  Array.prototype.some.call(document.querySelectorAll('.ficha-resumen-doc'), x => x.textContent.indexOf('ÍNDICE') !== -1)), false);

console.log('--- rehacerlo: el anterior va a la papelera ---');
await pagina.click('.ficha-nombre-menu-boton');
await pagina.click('.ficha-menu:not(.oculto) >> text=Índice del expediente');
for (let i = 0; i < 100; i++) {
  if (await pagina.evaluate(async () => (await Papelera.leer()).some(x => x.nombre === '000 ÍNDICE DEL EXPEDIENTE.pdf'))) break;
  await pagina.waitForTimeout(100);
}
await comprobar('el viejo, en la papelera', pagina.evaluate(async () => (await Papelera.leer()).filter(x => x.nombre === '000 ÍNDICE DEL EXPEDIENTE.pdf').length), 1);
await comprobar('y en la carpeta sigue habiendo uno solo', enCarpeta(ANA).then(l => l.filter(x => x === INDICE).length), 1);

console.log('--- 4. archivar lo crea ---');
await pagina.evaluate(() => App.volverALaLista && App.volverALaLista());
const archivar = async (n) => {
  await pagina.evaluate((n) => { App.cerrarAsunto(App.E.listaAbiertos.filter(a => a.nombre === n)[0]); }, n);
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.click('#cuadro-aceptar');
  /* Fila 148: el «Asunto archivado.» del anterior puede seguir a la vista,
     así que se espera a que ESTE asunto haya salido de los abiertos. */
  await pagina.waitForFunction((n) => !App.E.listaAbiertos.some((a) => a.nombre === n), n, { timeout: 20000 });
  await pagina.waitForSelector('.mensaje.bueno:has-text("Asunto archivado.")');
};
/* Se quita antes el de Ana, para ver que lo hace el archivado. */
await pagina.evaluate(async (n) => { const c = await window.__disco.abiertos.getDirectoryHandle(n); await c.removeEntry('000 ÍNDICE DEL EXPEDIENTE.pdf'); }, ANA);
await archivar(ANA);
const enArchivo = (n, t) => pagina.evaluate(async ([n, t]) => {
  const c = await (await (await window.__disco.archivo.getDirectoryHandle('ALUMNADO')).getDirectoryHandle(t)).getDirectoryHandle(n);
  const l = []; for await (const [k] of c.entries()) l.push(k); return l.sort();
}, [n, t]);
await comprobar('el archivado lleva su índice', enArchivo(ANA, 'Pérez, Ana 1234').then(l => l.indexOf(INDICE) !== -1), true);
await comprobar('y el índice del ARCHIVO no lo cuenta entre sus documentos',
  pagina.evaluate(async (n) => (await IndiceArchivo.leerDisco()).datos.asuntos.filter(e => e.nombre === n)[0].documentos.indexOf('000 ÍNDICE DEL EXPEDIENTE.pdf'), ANA), -1);

console.log('--- un fallo al crearlo no impide archivar ---');
await pagina.evaluate(() => { PdfHerramientas.cargarPdfLib = () => Promise.reject(new Error('pdf-lib no carga')); });
await archivar(LUIS);
/* Sin contar `_ficha.json`, que la ficha baja a la carpeta por su cuenta. */
await comprobar('Luis está archivado, sin índice',
  enArchivo(LUIS, 'Gómez, Luis 5678').then(l => l.filter(x => x.charAt(0) !== '_')).then(l => [l.length, l.indexOf(INDICE)]), [3, -1]);
await comprobar('con aviso ámbar que lo dice',
  pagina.locator('.mensaje.ambar').allTextContents().then(l => l.some(t => t.indexOf('índice del expediente') !== -1)), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
