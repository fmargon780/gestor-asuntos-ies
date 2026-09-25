/* Prueba en navegador de la fila 126 (docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md):

   1. El caso real: un tipo ya renombrado al nombre largo con la guía
      todavía bajo su nombre corto se arregla solo al entrar (aviso
      verde), y la plantilla repetida (mismo nombre y fichero) va a la
      papelera; la mesa del hito vuelve a ver la plantilla del paso.
   2. Renombrar un tipo con guía, campos, recurrente y plantilla unida a
      un paso: todo sigue en el tipo y el asunto abierto ve la plantilla.
   3. «Cargar las plantillas del centro» no duplica una que ya estaba
      colgada de otro tipo: le cambia el tipo.
   4. «Buscar otra plantilla…»: en la mesa del hito y en el cuadro de
      «Generar documento», encuentra una de otro tipo y la genera.

   Datos inventados. Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const LARGO = 'CERTIFICADO DE TUTORIA DE PRUEBA';
const TIPOS = [
  { tipo: LARGO, nombreCorto: 'TUTORIA PRUEBA', categoria: 'PERSONAL' },
  { tipo: 'BECA', categoria: 'ALUMNADO' },
  { tipo: 'MATRICULA', categoria: 'ALUMNADO' }
];
const GUIAS = {
  'TUTORIA PRUEBA': [{ id: 't1', titulo: 'Confección del Certificado', opciones: [], plantillasDocumento: ['pd-tut'] }],
  BECA: [{ id: 'b1', titulo: 'Recoger la solicitud', opciones: [], plantillasDocumento: ['pd-beca'] },
         { id: 'b2', titulo: 'Resolver', opciones: [] }]
};
const PLANTILLAS = { documentos: [
  { id: 'pd-tut', tipo: 'TUTORIA PRUEBA', categoria: 'PERSONAL', nombre: 'Certificado de tutoría', fichero: 'tut.docx', tipoDocumento: 'CERTIFICADO', texto: '' },
  { id: 'pd-tut-2', tipo: 'OTRO VIEJO', categoria: 'PERSONAL', nombre: 'Certificado de tutoría', fichero: 'tut.docx', tipoDocumento: 'CERTIFICADO', texto: '' },
  { id: 'pd-beca', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'Acuse de la beca', fichero: 'acuse.docx', tipoDocumento: 'ACUSE', texto: '' },
  { id: 'pd-otra', tipo: 'MATRICULA', categoria: 'ALUMNADO', nombre: 'Autorización de salida', fichero: 'salida.docx', tipoDocumento: 'AUTORIZACION', texto: '' }
] };
const CAMPOS = { propios: [{ id: 'c1', nombre: 'Convocatoria', clase: 'texto' }], porTipo: { BECA: [{ origen: 'propio', id: 'c1' }] } };
const RECURRENTES = [{ id: 'r1', tipo: 'BECA', categoria: 'ALUMNADO', tercero: '', cada: 'anual', dia: 1, mes: 9 }];
const ASUNTO = '260920 BECA Uno, Ana 1150001';

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([ficheros, asunto]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, d] of ficheros) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close();
  }
  const pl = await g.getDirectoryHandle('PLANTILLAS', { create: true });
  for (const f of ['tut.docx', 'acuse.docx', 'salida.docx']) pl._hijos.set(f, window.__disco.fich(f, 'PK'));
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
}, [[['tipos.json', TIPOS], ['guias.json', GUIAS], ['plantillas.json', PLANTILLAS], ['campos.json', CAMPOS],
    ['recurrentes.json', RECURRENTES]], ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

async function leer(n) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, n);
}

/* ---------- 1. el caso real se arregla solo al entrar ---------- */
console.log('--- 1. al entrar ---');
await pagina.waitForFunction(() => Array.prototype.some.call(document.querySelectorAll('.mensaje'),
  (m) => m.textContent.indexOf('He juntado con su tipo la guía de') !== -1), null, { timeout: 15000 });
await pagina.waitForTimeout(500);
const g1 = await leer('guias.json');
await comprobar('1. la guía pasa al nombre de hoy, con el id de su paso', [Object.keys(g1).sort(), (g1[LARGO] || []).map(p => p.id)],
  [['BECA', LARGO], ['t1']]);
const p1 = await leer('plantillas.json');
await comprobar('1. la repetida se va (se queda la unida al paso)',
  p1.documentos.filter(d => d.nombre === 'Certificado de tutoría').map(d => d.id), ['pd-tut']);
await comprobar('1. y está en la papelera', leer('papelera.json').then(l => l.fichas.some(x => x.clase === 'plantilla-documento' && x.datos.plantilla.id === 'pd-tut-2')), true);
await comprobar('1. la mesa del hito vuelve a ver la plantilla del paso',
  pagina.evaluate(async (LARGO) => {
    await Plantillas.cargar(App.E.gestor);
    const a = { leido: { tipo: LARGO, categoria: 'PERSONAL' }, ficha: { categoria: 'PERSONAL' } };
    const g = HitosGenerar.grupos(a, { id: 't1', origenGuia: 't1' });
    return g.delPaso.map(p => p.id);
  }, LARGO), ['pd-tut']);
await comprobar('1. una plantilla colgada del nombre corto casa con el tipo',
  pagina.evaluate((LARGO) => Plantillas.documentosDeTipo({ documentos: [{ id: 'x', tipo: 'Tutoria prueba', categoria: 'PERSONAL' }] }, 'PERSONAL', LARGO).length, LARGO), 1);

/* ---------- 2. renombrar un tipo ---------- */
console.log('--- 2. renombrar un tipo ---');
await pagina.evaluate(async (asunto) => {
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'BECA', categoria: 'ALUMNADO', tercero: 'Uno, Ana 1150001', campos: {} });
  await App.verAbiertos();
  App.renombrarTipo(App.E.tipos.filter(t => t.tipo === 'BECA')[0]);
}, ASUNTO);
await pagina.waitForSelector('#tipo-nuevo-nombre');
await pagina.fill('#tipo-nuevo-nombre', 'AYUDA AL ESTUDIO');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => Array.prototype.some.call(document.querySelectorAll('.mensaje'),
  (m) => m.textContent.indexOf('Tipo renombrado') !== -1), null, { timeout: 15000 });
await pagina.waitForTimeout(300);
const g2 = await leer('guias.json');
await comprobar('2. la guía se va con el tipo, con sus id', [g2.BECA === undefined, (g2['AYUDA AL ESTUDIO'] || []).map(p => p.id)], [true, ['b1', 'b2']]);
const c2 = await leer('campos.json');
await comprobar('2. los campos también', [c2.porTipo.BECA === undefined, (c2.porTipo['AYUDA AL ESTUDIO'] || []).map(c => c.id)], [true, ['c1']]);
await comprobar('2. el recurrente también', leer('recurrentes.json').then(l => l.map(r => r.tipo)), ['AYUDA AL ESTUDIO']);
await comprobar('2. y la plantilla', leer('plantillas.json').then(p => p.documentos.filter(d => d.id === 'pd-beca')[0].tipo), 'AYUDA AL ESTUDIO');
const nuevoNombre = await pagina.evaluate(() => App.E.listaAbiertos.map(a => a.nombre).filter(n => n.indexOf('Uno, Ana') !== -1)[0]);
await comprobar('2. el asunto abierto ve la plantilla del paso',
  pagina.evaluate(async (nombre) => {
    await Plantillas.cargar(App.E.gestor);
    const a = App.E.listaAbiertos.filter(x => x.nombre === nombre)[0];
    return HitosGenerar.grupos(a, { id: 'b1', origenGuia: 'b1' }).delPaso.map(p => p.id);
  }, nuevoNombre), ['pd-beca']);

/* ---------- 3. la carga de plantillas del centro no duplica ---------- */
console.log('--- 3. cargar las plantillas del centro ---');
const r3 = await pagina.evaluate(async () => {
  const indice = await App.leerFicheroDeLaApp('plantillas/indice.json', 'json');
  const e = indice.filter(x => x.clase === 'documento')[0];
  await Plantillas.guardar(App.E.gestor, function (a) {
    a.documentos.push({ id: 'pd-vieja', tipo: 'UN TIPO DE ANTES', categoria: e.categoria, nombre: e.nombre, fichero: e.fichero,
      tipoDocumento: e.tipoDocumento, texto: '' });
    return a;
  });
  await PlantillasCentro.cargar();
  const d = (await Plantillas.cargar(App.E.gestor)).documentos.filter(x => x.nombre === e.nombre);
  return [d.length, d[0].id, d[0].tipo === e.tipo];
});
await comprobar('3. una sola, la de antes, con el tipo del índice', Promise.resolve(r3), [1, 'pd-vieja', true]);

/* ---------- 4. «Buscar otra plantilla…» ---------- */
console.log('--- 4. buscar otra plantilla ---');
await pagina.evaluate(() => { window.Docx.rellenar = async () => ({ blob: new Blob(['doc']), faltan: [] }); });
await pagina.locator('.tarjeta-nombre', { hasText: 'Uno, Ana' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(400);
await pagina.locator('#ficha-guia .hito[data-id="b2"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="b2"]');
await pagina.waitForTimeout(300);
/* Fila 145: dentro del desplegable «Generar documento ▾». */
await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="generar"]');
await comprobar('4. en un hito sin plantillas sale «Buscar otra plantilla…»',
  pagina.locator('.hito-en-mesa .mesa-buscar-plantilla').count(), 1);
await pagina.click('.hito-en-mesa .mesa-buscar-plantilla');
await pagina.fill('.hito-en-mesa .plantilla-buscar-campo', 'salida');
await comprobar('4. encuentra una de otro tipo', pagina.locator('.hito-en-mesa .plantilla-buscar-opcion').evaluateAll(b => b.map(x => x.dataset.id)), ['pd-otra']);
await pagina.click('.hito-en-mesa .plantilla-buscar-opcion');
await pagina.waitForTimeout(800);
const r4 = await pagina.evaluate(async (nombre) => {
  const h = (await Hitos.hitosDe(nombre)).filter(x => x.id === 'b2')[0];
  return h ? h.documentos : null;
}, nuevoNombre);
const esperado = await pagina.evaluate(() => PlantillasDocumento.nombreDelDocumentoGenerado(Plantillas.documentoPorId('pd-otra'), U.hoyIso()));
await comprobar('4. y la genera, apuntada a este hito', Promise.resolve(r4), [esperado]);
await comprobar('4. el cuadro de «Generar documento» también la busca, en el mismo cuadro',
  pagina.evaluate(async () => {
    const promesa = PlantillasDocumento.elegir({ delPaso: [], delTipo: [], buscar: true });
    await new Promise(r => setTimeout(r, 300));
    const campo = document.querySelector('#cuadro-cuerpo .plantilla-buscar-campo');
    campo.value = 'autorizacion salida'; campo.oninput();   /* fila 170: hay otras «Autorización» del centro */
    document.querySelector('#cuadro-cuerpo .plantilla-buscar-opcion').click();
    return (await promesa).id;
  }), 'pd-otra');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
