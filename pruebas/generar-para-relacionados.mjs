/* Prueba en navegador de verdad de la fila 171 de docs/COLA.md
   (docs/DOCUMENTO-PARA-CADA-RELACIONADO.md), con la plantilla real
   `plantillas/participacion-actividad.docx`:

   1. «… para cada relacionado (N)» cuenta los relacionados del asunto.
   2. Un asunto con tres relacionados (uno sin DNI) genera tres
      documentos, con el nombre de cada uno en su documento y en el
      nombre del fichero.
   3. Lo del asunto se pregunta una sola vez, y sale igual en los tres.
   4. El resumen dice a cuántas personas les falta el DNI. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const PLANTILLA = fs.readFileSync(new URL('../plantillas/participacion-actividad.docx', import.meta.url)).toString('base64');

const ASUNTO = '260925 ACTIVIDAD EXTRAESCOLAR 26-27 Viaje a Granada';
const PLANTILLAS = {
  lista: [],
  documentos: [{ id: 'pd-act', tipo: 'ACTIVIDAD EXTRAESCOLAR', categoria: 'OTROS', nombre: 'Participación en actividad',
                 fichero: 'participacion.docx', tipoDocumento: 'CERTIFICADO', texto: 'participacion', firmante: '', vistoBueno: '' }]
};
const RELACIONADOS = [
  { categoria: 'PERSONAL', nombre: 'Prueba Uno, Ana 111H' },
  { categoria: 'PERSONAL', nombre: 'Prueba Dos, Luis 222J' },
  { categoria: 'PERSONAL', nombre: 'Prueba Tres, Eva' }
];

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
  const f = await carpeta.getFileHandle('participacion.docx', { create: true });
  const w2 = await f.createWritable(); await w2.write(new Blob([bytes])); await w2.close();
  await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
}, [PLANTILLAS, PLANTILLA, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, rels]) => {
  const cab = Datos.LISTAS.PERSONAL.cabecera;
  await Carpetas.escribirTexto(App.E.datos, 'personal.csv', Datos.aCsv(cab, [
    ['Prueba Uno, Ana', '11111111H', 'Profesora', '', 'ana@ejemplo.es'],
    ['Prueba Dos, Luis', '22222222J', 'Profesor', '', ''],
    ['Prueba Tres, Eva', '', 'Profesora', '', 'eva@ejemplo.es']
  ]));
  if (window.Datos && Datos.olvidar) Datos.olvidar();
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'ACTIVIDAD EXTRAESCOLAR', categoria: 'OTROS',
    tercero: 'Viaje a Granada', curso: '26-27', grupo: '', descripcion: '', campos: {}, relacionados: rels });
  await App.verAbiertos();
}, [ASUNTO, RELACIONADOS]);
await pagina.locator('.tarjeta-nombre', { hasText: 'Viaje a Granada' }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => Plantillas.cargar(App.E.gestor));

const ficherosDelAsunto = () => pagina.evaluate(async (a1) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  const n = []; for await (const [k, v] of d.entries()) if (v.kind === 'file') n.push(k);
  return n.sort();
}, ASUNTO);

console.log('--- 1. el botón cuenta los relacionados ---');
await comprobar('«… para cada relacionado (3)»',
  pagina.evaluate(() => GenerarParaRelacionados.botonHTML(App.asuntoDeLaFicha()).indexOf('para cada relacionado (3)') !== -1), true);
await comprobar('sin relacionados, no sale',
  pagina.evaluate(() => GenerarParaRelacionados.botonHTML({ ficha: {} })), '');

console.log('--- 2 y 3. tres documentos, lo del asunto preguntado una vez ---');
await pagina.evaluate(() => {
  const a = App.asuntoDeLaFicha();
  window.__lote = GenerarParaRelacionados.generar(a, Plantillas.enMemoria().documentos[0], null)
    .then((r) => r ? { hechos: r.hechos.length, faltas: r.faltas.map((x) => x.rel.nombre + ':' + x.faltan.join('|')) } : null,
          (e) => 'error ' + e.message);
});
await pagina.waitForSelector('#capa:not(.oculto) .word-falta');
const preguntados = await pagina.evaluate(() => Array.from(document.querySelectorAll('#capa .word-falta')).map((c) => c.dataset.hueco));
await comprobar('se preguntan los datos del asunto (Actividad, Lugar, Fechas, Horas)',
  ['Actividad', 'Lugar', 'Fechas', 'Horas'].every((x) => preguntados.indexOf(x) !== -1), true);
await comprobar('y no los de la persona (ni el DNI ni el nombre)',
  preguntados.some((x) => /dni|documento de identidad|nombre/i.test(x)), false);
await comprobar('con la carpeta todavía sin nada', ficherosDelAsunto(), []);
const valores = { Actividad: 'Viaje a Granada', Lugar: 'la Alhambra', Fechas: 'el 3 de octubre', Horas: '8' };
for (const [clave, v] of Object.entries(valores)) {
  await pagina.fill('#capa .word-falta[data-hueco="' + clave + '"]', v);
}
console.log('   (preguntados: ' + preguntados.join(' · ') + ')');
/* El cuadro trae muchas líneas y el botón puede quedar fuera de la vista. */
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForSelector('.word-visor-franja .muestra-generar');   /* fila 294: la muestra, antes de hacer los tres */
await pagina.click('.muestra-generar');
await pagina.waitForFunction(() => document.getElementById('cuadro-titulo').textContent.indexOf('generados') !== -1, null, { timeout: 90000 });
const textoResumen = await pagina.evaluate(() => document.getElementById('cuadro-cuerpo').textContent);
console.log('   (resumen: ' + textoResumen + ')');
await comprobar('4. el resumen dice los tres', textoResumen.indexOf('3 documentos generados') !== -1, true);
await comprobar('4. y que a una persona le falta el DNI', /A 1 persona le falta[^.]*DNI/.test(textoResumen), true);
await comprobar('4. y a quién', textoResumen.indexOf('Prueba Tres, Eva') !== -1, true);
await comprobar('4. y remite a «Enviar…» de la lista de personas (fila 295: quien no tiene correo se ve allí)', /Para enviarlos: «Enviar…», en la lista de personas\./.test(textoResumen), true);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
const lote = await pagina.evaluate(() => window.__lote);
await comprobar('el lote termina bien, con tres', lote && lote.hechos, 3);

const tras = await ficherosDelAsunto();
/* Fila 294: cada uno con su PDF, y el Word a «Versiones previas». */
await comprobar('tres PDF en la carpeta y ningún Word suelto', [tras.filter((n) => /\.pdf$/.test(n)).length, tras.filter((n) => /\.docx$/.test(n)).length], [3, 0]);
for (const quien of ['Prueba Uno, Ana', 'Prueba Dos, Luis', 'Prueba Tres, Eva']) {
  /* Fila 239: el nombre ya no lleva a la persona (`AAMMDD TIPO D<año>-<cinco cifras>.docx`): está en el
     texto adicional que la ficha guarda de cada documento, con su número. */
  const docsFicha = await pagina.evaluate((a1) => App.E.registro.asuntos[a1].documentos || {}, ASUNTO);
  const numeroDeEl = Object.keys(docsFicha).filter((k) => (docsFicha[k].texto || '').indexOf(quien) !== -1)[0];
  const nombrePdf = tras.filter((n) => numeroDeEl && n.indexOf(numeroDeEl) !== -1)[0];
  const nombre = nombrePdf && nombrePdf.replace(/\.pdf$/, '.docx');
  await comprobar('el documento de «' + quien + '» lleva su número y la ficha guarda su nombre', !!nombrePdf && / CERTIFICADO D\d{2}-\d{5}\.pdf$/.test(nombrePdf) &&
    /participacion/.test(docsFicha[numeroDeEl].texto), true);
  const texto = await pagina.evaluate(async ([a1, n]) => {
    const d = await (await window.__disco.abiertos.getDirectoryHandle(a1)).getDirectoryHandle(await VersionesPrevias.nombreDeCarpeta(
      await window.__disco.abiertos.getDirectoryHandle(a1)));
    const buf = await (await (await d.getFileHandle(n)).getFile()).arrayBuffer();
    return Docx.textoDelDocumento(buf);
  }, [ASUNTO, nombre]);
  const natural = quien.split(', ')[1] + ' ' + quien.split(', ')[0];
  await comprobar('su documento lleva su nombre (' + natural + ')', texto.indexOf(natural) !== -1, true);
  await comprobar('y lo del asunto, igual que los demás', ['Viaje a Granada', 'la Alhambra', 'el 3 de octubre'].every((v) => texto.indexOf(v) !== -1), true);
  if (quien === 'Prueba Uno, Ana') await comprobar('con su DNI', texto.indexOf('11111111H') !== -1, true);
  if (quien === 'Prueba Dos, Luis') await comprobar('con su DNI', texto.indexOf('22222222J') !== -1, true);
}

console.log('--- el resumen ya no ofrece «Enviar a cada uno» (fila 295: el envío está en «Enviar…» de la lista) ---');
async function lanzarOtraVez() {
  await pagina.evaluate(() => {
    const a = App.asuntoDeLaFicha();
    window.__lote = GenerarParaRelacionados.generar(a, Plantillas.enMemoria().documentos[0], null).then(() => 'hecho', (e) => 'error ' + e.message);
  });
  await pagina.waitForSelector('#capa:not(.oculto) .word-falta');
  for (const [clave, v] of Object.entries(valores)) await pagina.fill('#capa .word-falta[data-hueco="' + clave + '"]', v);
  await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
  await pagina.waitForFunction(() => document.getElementById('cuadro-titulo').textContent.indexOf('generado') !== -1, null, { timeout: 20000 });
}
await lanzarOtraVez();
await comprobar('los que ya estaban no se rehacen', pagina.evaluate(() => /Ya estaban en la carpeta/.test(document.getElementById('cuadro-cuerpo').textContent)), true);
await comprobar('el resumen termina con «Cerrar» y la línea que lleva a «Enviar…»',
  pagina.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, /Para enviarlos: «Enviar…», en la lista de personas\./.test(document.getElementById('cuadro-cuerpo').textContent),
    /Enviar a cada uno/.test(document.getElementById('capa').textContent)]), ['Cerrar', true, false]);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.evaluate(() => window.__lote);

console.log('--- el envío: nunca dos veces el mismo documento a la misma persona ---');
await comprobar('el identificador del envío es siempre el mismo para la misma persona, y distinto para otra', pagina.evaluate(() => {
  const I = GrupoEnviar.idEnvioDe;
  return [I({ nombre: 'X' }, 'doc.pdf', 'ALUMNADO|Ana') === I({ nombre: 'X' }, 'doc.pdf', 'alumnado|ana'), I({ nombre: 'X' }, 'doc.pdf', 'ALUMNADO|Eva') !== I({ nombre: 'X' }, 'doc.pdf', 'ALUMNADO|Ana')];
}), [true, true]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
