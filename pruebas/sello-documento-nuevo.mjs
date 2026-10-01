/* Prueba en navegador de verdad de la fila 233 de docs/COLA.md
   (docs/SELLO-DOCUMENTO-NUEVO.md): un papel con el sello de registro de Séneca
   que es un documento nuevo, sin ningún documento anterior en la carpeta.

   1. El aviso ámbar enseña «Es un documento nuevo» el primero, y sin ningún
      documento de la aplicación en la carpeta no sale el desplegable.
   2. Al pulsarlo se abre el cuadro de poner nombre con el registro (cuatro
      piezas) y su fecha ya puestos y un tipo de documento propuesto.
   3. Cerrar el cuadro sin guardar deja el aviso como estaba.
   4. Al guardar: el fichero queda `AAMMDD TIPO D26-xxxxx.pdf`, el aviso se va,
      el registro queda en la ficha del documento y en una nota del asunto, el
      documento queda asociado al hito en curso y su tarea de registro, marcada.
   5. Con documentos de la aplicación en la carpeta, «Elige un documento…» y
      «No es un registro» siguen estando. */
import { chromium } from 'playwright';
import fs from 'fs';

function pdfConTexto(texto) {
  const escapado = String(texto).replace(/([()\\])/g, '\\$1');
  const stream = 'BT /F1 8 Tf 20 750 Td (' + escapado + ') Tj ET';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objetos.length; i++) {
    offsets.push(pdf.length);
    pdf += (i + 1) + ' 0 obj\n' + objetos[i] + '\nendobj\n';
  }
  const inicioXref = pdf.length;
  let xref = 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  pdf += xref;
  pdf += 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\n' +
         'startxref\n' + inicioXref + '\n%%EOF';
  return pdf;
}

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260911 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const GUIAS = { CONVALIDACION: [
  { id: 'c1', titulo: 'Descargar el documento', cuerpo: '', opciones: [],
    guion: [{ id: 'g1', texto: 'Descargar el documento registrado a la carpeta del asunto y anotar registro', explicacion: '', accion: 'registrar' }] },
  { id: 'c2', titulo: 'Archivar', cuerpo: '', opciones: [] }
] };

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
await pagina.evaluate(async ([asunto, guias, pdf]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  c._hijos.set('29700692 - Fuente Lucena.pdf', window.__disco.fich('29700692 - Fuente Lucena.pdf', pdf, 'application/pdf'));
}, [ASUNTO, GUIAS, pdfConTexto('2026/29700692/M000000000657SALIDAFecha: 30/09/2026 10:15:00')]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (asunto) => {
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Sola Uno, Eva 9990201', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
await pagina.click('#inicio-tabla-cuerpo .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.aviso-sello');

console.log('--- 1. el aviso y sus salidas ---');
await comprobar('1. «Es un documento nuevo» va el primero, y no hay desplegable vacío',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.aviso-sello .sello-fila > *')).map((e) => e.textContent.trim())),
  ['Es un documento nuevo', 'No es un registro']);

console.log('--- 2. el cuadro de poner nombre, con el sello puesto ---');
await pagina.click('.sello-nuevo');
await pagina.waitForSelector('#capa:not(.oculto) #doc-guardar');
await comprobar('2. registro y fecha del sello ya puestos',
  pagina.evaluate(() => ({
    marcado: document.getElementById('doc-hay-registro').checked,
    ano: document.getElementById('doc-ano').value, numero: document.getElementById('doc-numero').value,
    sentido: (document.querySelector('[name="doc-sentido"]:checked') || {}).value,
    fecha: document.getElementById('doc-fecha').value,
    tipo: !!document.getElementById('doc-tipo').value
  })), { marcado: true, ano: '26', numero: '0657', sentido: 'S', fecha: '2026-09-30', tipo: true });

console.log('--- 3. cerrar sin guardar ---');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForTimeout(400);
await comprobar('3. el aviso sigue igual', pagina.locator('.aviso-sello').count(), 1);

console.log('--- 4. guardar ---');
await pagina.click('.sello-nuevo');
await pagina.waitForSelector('#capa:not(.oculto) #doc-guardar');
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForTimeout(900);
const ficheros = await pagina.evaluate(async (a) => Array.from((await window.__disco.abiertos.getDirectoryHandle(a))._hijos.keys()), ASUNTO);
const nuevo = ficheros.filter((n) => /^\d{6} .*D26-\d{5}\.pdf$/.test(n));
await comprobar('4. el fichero queda `AAMMDD TIPO D26-xxxxx.pdf` y el suelto ya no está', Promise.resolve([nuevo.length, ficheros.indexOf('29700692 - Fuente Lucena.pdf') === -1]), [1, true]);
await comprobar('4. el aviso se ha ido', pagina.locator('.aviso-sello').count(), 0);
await comprobar('4. el registro queda en una nota del asunto',
  pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).some((n) => /^Registrado 26SM0657 el 30\/09\/2026 · /.test(n.texto)), ASUNTO), true);
await comprobar('4. el registro, en la ficha del documento',
  pagina.evaluate(async ([a, n]) => { const d = await DocumentosDatos.deNombre ? null : null; const todos = App.E.registro.asuntos[a].documentosDatos || App.E.registro.asuntos[a].documentos || {}; return JSON.stringify(todos).indexOf('0657') !== -1; }, [ASUNTO, nuevo[0]]),
  true);
await comprobar('4. asociado al hito en curso, y su tarea de registro marcada',
  pagina.evaluate(async ([a, n]) => {
    const hs = await Hitos.hitosDe(a);
    const h = hs[0];
    const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
    const paso = Hitos.guionDe(asunto, h)[0];
    return [(h.documentos || []).map((d) => d.nombre || d).indexOf(n) !== -1, !!paso.hecho];
  }, [ASUNTO, nuevo[0]]), [true, true]);

console.log('--- 5. con documentos de la aplicación, las otras salidas siguen ---');
await pagina.evaluate(async ([a, pdf]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  c._hijos.set('260901 SOLICITUD D26-90001.pdf', window.__disco.fich('260901 SOLICITUD D26-90001.pdf', 'otro'));
  c._hijos.set('otro sellado.pdf', window.__disco.fich('otro sellado.pdf', pdf, 'application/pdf'));
}, [ASUNTO, pdfConTexto('2026/29700692/M000000000700ENTRADAFecha: 01/10/2026 09:00:00')]);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.click('#btn-recargar');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr');
await pagina.click('#inicio-tabla-cuerpo .nombre-pulsable');
await pagina.waitForSelector('.aviso-sello');
await comprobar('5. «Es un documento nuevo», el desplegable y «No es un registro»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.aviso-sello .sello-fila > *')).map((e) => e.tagName === 'SELECT' ? 'desplegable' : e.textContent.trim())),
  ['Es un documento nuevo', 'desplegable', 'No es un registro']);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
