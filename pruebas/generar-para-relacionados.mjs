/* Prueba en navegador de verdad de la fila 171
   (docs/DOCUMENTO-PARA-CADA-RELACIONADO.md), con la plantilla real
   `plantillas/participacion-actividad.docx` (fila 170): un asunto con
   tres relacionados (uno sin DNI, porque no está en el RelPerCen)
   genera tres documentos, con el nombre de cada uno en su documento y
   en el nombre del fichero, los campos del asunto (preguntados una sola
   vez) iguales en los tres, y el aviso del DNI que falta. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const PLANTILLA = fs.readFileSync(new URL('../plantillas/participacion-actividad.docx', import.meta.url)).toString('base64');

const ASUNTO = '260910 ACTIVIDAD EXTRAESCOLAR 26-27 Viaje de prueba Departamento de Pruebas';
const PLANTILLAS = {
  lista: [],
  documentos: [{ id: 'pd-act', tipo: 'ACTIVIDAD EXTRAESCOLAR', categoria: 'OTROS', nombre: 'Participación del profesorado',
                 fichero: 'participacion-actividad.docx', tipoDocumento: 'CERTIFICADO', texto: 'participacion', firmante: '', vistoBueno: '' }]
};
const RELACIONADOS = [
  { categoria: 'PERSONAL', nombre: 'Aguado Ranea, Marcos Antonio 591R' },
  { categoria: 'PERSONAL', nombre: 'Ordóñez Gil, Rafael 677B' },
  { categoria: 'PERSONAL', nombre: 'Sinficha Nadie, Pepa 000X' }
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
  const f = await carpeta.getFileHandle('participacion-actividad.docx', { create: true });
  const w2 = await f.createWritable(); await w2.write(new Blob([bytes])); await w2.close();
  await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  /* El personal, del RelPerCen (como pruebas/navegador.mjs). */
  const datos = await g.getDirectoryHandle('datos', { create: true });
  datos._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese","Teléfono","Cuenta Google/Microsoft"',
    '"Aguado Ranea, Marcos Antonio","33357591R","Música P.E.S.","01/09/2011","","952276078","maguran591@g.educaand.es"',
    '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015","","",""'
  ].join('\r\n') + '\r\n'));
}, [PLANTILLAS, PLANTILLA, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, rels]) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'ACTIVIDAD EXTRAESCOLAR', categoria: 'OTROS',
    tercero: 'Departamento de Pruebas', curso: '26-27', grupo: '', descripcion: '', campos: {}, relacionados: rels });
  await App.verAbiertos();
  await Plantillas.cargar(App.E.gestor);
}, [ASUNTO, RELACIONADOS]);

console.log('--- 1. el botón, con la cuenta de relacionados ---');
await comprobar('cuántos relacionados', pagina.evaluate((a1) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === a1)[0];
  return GenerarParaRelacionados.cuantos(a);
}, ASUNTO), 3);

console.log('--- 2. generar: lo del asunto se pregunta una sola vez ---');
await pagina.evaluate((a1) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === a1)[0];
  window.__resultado = GenerarParaRelacionados.generar(a, Plantillas.enMemoria().documentos[0], null)
    .then((r) => r, (e) => ({ error: e.message }));
}, ASUNTO);
await pagina.waitForSelector('#capa:not(.oculto) .word-falta');
const preguntados = await pagina.evaluate(() => Array.from(document.querySelectorAll('#capa .word-falta')).map((c) => c.dataset.hueco));
await comprobar('pregunta Actividad, Lugar, Fechas y Horas (una vez cada uno)',
  ['Actividad', 'Lugar', 'Fechas', 'Horas'].map((c) => preguntados.filter((p) => p === c).length), [1, 1, 1, 1]);
await comprobar('no pregunta el DNI (es de cada persona)',
  preguntados.some((p) => /dni/i.test(p)), false);
for (const [c, v] of [['Actividad', 'Viaje a Granada'], ['Lugar', 'Granada'], ['Fechas', 'el 3 de octubre'], ['Horas', '8']]) {
  await pagina.fill('#capa .word-falta[data-hueco="' + c + '"]', v);
}
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('cuadro-titulo').textContent === 'Un documento para cada relacionado');

const resumen = await pagina.evaluate(() => document.getElementById('cuadro-cuerpo').textContent);
await comprobar('el resumen cuenta tres', resumen.indexOf('3 certificados generados.') !== -1, true);
await comprobar('y dice a quién le falta el DNI',
  /A 1 persona le falta el DNI: Sinficha Nadie, Pepa/.test(resumen), true);
await comprobar('trae «Enviar a cada uno»', pagina.locator('#gpr-enviar').count(), 1);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
const r = await pagina.evaluate(() => window.__resultado);
await comprobar('sin error', r.error || '', '');

console.log('--- 3. tres documentos, uno por persona ---');
const docs = await pagina.evaluate(async (a1) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  const salida = [];
  for await (const [k, v] of d.entries()) {
    if (v.kind !== 'file' || !/\.docx$/.test(k)) continue;
    const buf = await (await v.getFile()).arrayBuffer();
    const xml = await Docx.leerEntradaDeTexto(buf, 'word/document.xml');
    salida.push({ nombre: k, texto: xml.replace(/<[^>]+>/g, '') });
  }
  return salida.sort((x, y) => x.nombre < y.nombre ? -1 : 1);
}, ASUNTO);
await comprobar('hay tres documentos', docs.length, 3);
await comprobar('cada fichero lleva el nombre de su persona',
  docs.map((d) => d.nombre.replace(/^\d{6} /, '')),
  ['CERTIFICADO participacion Aguado Ranea, Marcos Antonio.docx',
   'CERTIFICADO participacion Ordóñez Gil, Rafael.docx',
   'CERTIFICADO participacion Sinficha Nadie, Pepa.docx']);
await comprobar('cada documento lleva su propio nombre y no el de los otros',
  docs.map((d) => [d.texto.indexOf('Marcos Antonio Aguado Ranea') !== -1, d.texto.indexOf('Rafael Ordóñez Gil') !== -1, d.texto.indexOf('Pepa Sinficha Nadie') !== -1]),
  [[true, false, false], [false, true, false], [false, false, true]]);
await comprobar('el DNI de cada uno, del RelPerCen',
  docs.map((d) => [d.texto.indexOf('33357591R') !== -1, d.texto.indexOf('44556677B') !== -1]),
  [[true, false], [false, true], [false, false]]);
await comprobar('lo del asunto, igual en los tres',
  docs.map((d) => d.texto.indexOf('Viaje a Granada') !== -1 && d.texto.indexOf('Granada el 3 de octubre') !== -1), [true, true, true]);

console.log('--- 4. pura: el reparto de lo que falta y el id de envío ---');
await comprobar('repartirFaltan separa lo del asunto y lo de cada persona',
  pagina.evaluate(() => GenerarParaRelacionados.repartirFaltan([
    { nombre: 'A', faltan: ['Actividad', 'DNI del alumnado o del personal'] },
    { nombre: 'B', faltan: ['Actividad'] }])),
  { delAsunto: ['Actividad'], dePersona: [{ nombre: 'A', faltan: ['DNI del alumnado o del personal'] }] });
await comprobar('el id de envío es siempre el mismo para el mismo documento y correo',
  pagina.evaluate(() => {
    const a = { nombre: 'X' };
    const h = { documento: 'd.docx', correo: 'a@b.es' };
    return GenerarParaRelacionados.idEnvioDe(a, h) === GenerarParaRelacionados.idEnvioDe(a, { documento: 'd.docx', correo: 'A@B.es' }) &&
      GenerarParaRelacionados.idEnvioDe(a, h) !== GenerarParaRelacionados.idEnvioDe(a, { documento: 'e.docx', correo: 'a@b.es' });
  }), true);

await comprobar('sin errores de consola', errores, []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
