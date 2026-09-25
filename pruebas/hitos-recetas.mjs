/* Prueba en navegador de verdad de la fila 164 de docs/COLA.md
   (docs/HITOS-ACCIONES-EN-EL-HITO.md, puntos 3 y 4):

   a. Un paso con receta de comunicar sale arriba en «Comunicar ▾»; al
      elegirlo, el cuadro (Séneca, por la receta) se abre ya con la
      plantilla de la receta, y al terminar se marca ESE paso (el
      segundo), no el primero pendiente.
   b. Un documento del hito 2 se ve en la mesa del hito 3, en «De otros
      hitos», con su etiqueta; y uno de la carpeta sin hito, al final. El
      título cuenta «1 (y 2 más del asunto)».
   c. El editor del guion enseña la receta al elegir una acción, y la
      lee y la guarda; un paso con acción y sin receta sigue valiendo
      (los de antes, sin convertir nada).
   d. «Generar documento ▾» enseña arriba el paso con receta de generar,
      y «Registrar» el de registrar como título de su menú. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Uno, Eva 9990001';
const GUIAS = {
  CONVALIDACION: [
    { id: 'p1', titulo: 'Recibir', cuerpo: '', opciones: [] },
    { id: 'p2', titulo: 'Revisar', cuerpo: '', opciones: [] },
    { id: 'p3', titulo: 'Comunicar', cuerpo: '', opciones: [],
      guion: [
        { id: 'g1', texto: 'Avisar a la tutoría', explicacion: '', accion: 'comunicar' },
        { id: 'g2', texto: 'Enviarla a la familia por iPasen', explicacion: '', accion: 'comunicar',
          receta: { a: 'tercero', via: 'seneca', plantilla: 'pl-2' } },
        { id: 'g3', texto: 'Generar el oficio', explicacion: '', accion: 'generar' },
        { id: 'g4', texto: 'Registrar la salida', explicacion: '', accion: 'registrar', receta: { sentido: 'salida' } }
      ] }
  ]
};
const PLANTILLAS = {
  lista: [
    { id: 'pl-1', tipo: 'CONVALIDACION', categoria: 'ALUMNADO', nombre: 'Primera', texto: 'Texto primero' },
    { id: 'pl-2', tipo: 'CONVALIDACION', categoria: 'ALUMNADO', nombre: 'Para la familia', texto: 'Texto para la familia' }
  ],
  documentos: []
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
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, plantillas, a1]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, t] of [['guias.json', guias], ['plantillas.json', plantillas]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(t)); await w.close();
  }
  const d = await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  await d.getFileHandle('260905 SOLICITUD.pdf', { create: true });
  await d.getFileHandle('260906 INFORME.pdf', { create: true });
  await d.getFileHandle('260907 SUELTO.pdf', { create: true });
}, [GUIAS, PLANTILLAS, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (a1) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);

await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito[data-id="p3"]', { state: 'attached' });
await pagina.evaluate(async (a1) => {
  await Hitos.anadirDocumento(a1, 'p1', '260905 SOLICITUD.pdf');
  await Hitos.anadirDocumento(a1, 'p2', '260906 INFORME.pdf');
  HitosPanel.programarRepintado();
}, ASUNTO);
await pagina.waitForTimeout(800);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);
await pagina.locator('#ficha-guia .hito[data-id="p3"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="p3"]');
await pagina.waitForTimeout(400);

console.log('--- b. todos los documentos del asunto, en cada hito ---');
await comprobar('«De otros hitos», con la etiqueta del hito de cada uno',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-doc-ajeno')).map((d) =>
    [d.dataset.doc, (d.querySelector('.mesa-doc-de-hito') || {}).textContent || ''])),
  [['260905 SOLICITUD.pdf', '1 · Recibir'], ['260906 INFORME.pdf', '2 · Revisar'], ['260907 SUELTO.pdf', '']]);
await comprobar('y los apartados, en su orden',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-docs-apartado')).map((x) => x.textContent)),
  ['De otros hitos', 'En la carpeta, sin hito']);
await comprobar('el título cuenta los del hito y los demás',
  pagina.evaluate(() => document.querySelector('.hito-en-mesa .mesa-docs-cuenta').textContent), '· 0 (y 3 más del asunto)');
await comprobar('los de otros hitos no llevan el ⋯ (son de su hito)',
  pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .mesa-doc-ajeno .hito-doc-menu-boton').length), 0);

console.log('--- d. «Generar documento ▾» y «Registrar» ---');
await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="generar"]');
await pagina.waitForTimeout(300);
await comprobar('«Generar documento ▾» enseña arriba el paso con receta de generar',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-recetas[data-accion="generar"] .mesa-receta')).map((b) => b.textContent)),
  ['Generar el oficio']);
await pagina.keyboard.press('Escape');
await pagina.evaluate(async (a1) => {
  await Hitos.anadirDocumento(a1, 'p3', '260907 SUELTO.pdf');
  HitosPanel.programarRepintado();
}, ASUNTO);
await pagina.waitForTimeout(800);
await pagina.click('.hito-en-mesa .mesa-registrar');
await pagina.waitForTimeout(200);
await comprobar('«Registrar» enseña el paso con su receta como título, y el documento',
  pagina.evaluate(() => {
    const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
    return menu ? Array.from(menu.querySelectorAll('.ficha-menu-opcion')).map((o) => [o.textContent, o.disabled]) : null;
  }), [['Paso: Registrar la salida (salida)', true], ['260907 SUELTO.pdf', false]]);
await pagina.keyboard.press('Escape');
await pagina.mouse.click(5, 5);

console.log('--- a. la receta de comunicar ---');
await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="comunicar"]');
await pagina.waitForSelector('.hito-en-mesa .mesa-recetas[data-accion="comunicar"] .mesa-receta');
await comprobar('arriba, los dos pasos pendientes de comunicar, con su texto',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-recetas[data-accion="comunicar"] .mesa-receta')).map((b) => b.textContent)),
  ['Avisar a la tutoría', 'Enviarla a la familia por iPasen']);
await pagina.click('.hito-en-mesa .mesa-receta[data-paso="g2"]');
await pagina.waitForSelector('#capa:not(.oculto) #seneca-formulario');
await comprobar('se abre el cuadro de Séneca (la vía de la receta) con su plantilla ya elegida',
  pagina.evaluate(() => [document.getElementById('seneca-plantilla').value,
    document.getElementById('seneca-cuerpo-texto').value.indexOf('Texto para la familia') > -1]), ['pl-2', true]);
await pagina.click('#seneca-copiar-texto');
await pagina.waitForTimeout(400);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForTimeout(500);
await comprobar('al terminar, se marca ESE paso (g2), no el primero pendiente (g1)',
  pagina.evaluate(() => ['g1', 'g2'].map((id) => document.querySelector('.hito-en-mesa .guion-paso[data-id="' + id + '"]').classList.contains('hecho'))),
  [false, true]);

console.log('--- c. el editor del guion ---');
await comprobar('elegir «Comunicar» enseña su receta; se lee y se normaliza',
  pagina.evaluate(() => {
    const caja = document.createElement('div');
    caja.innerHTML = GuiasGuion.bloqueHTML([{ id: 'x1', texto: 'Avisar', accion: 'comunicar', receta: { a: 'tutores', via: 'correo', plantilla: 'pl-1' } },
                                           { id: 'x2', texto: 'Mirar', accion: '' }]);
    const recetas = caja.querySelectorAll('.guion-receta').length;
    const leido = GuiasGuion.normalizar(GuiasGuion.leer(caja));
    return [recetas, leido[0].receta, leido[1].receta || null];
  }), [1, { a: 'tutores', via: 'correo', plantilla: 'pl-1' }, null]);
await comprobar('un paso con acción y sin receta sigue siendo un paso con receta (sin detalles)',
  pagina.evaluate(() => GuiasGuion.normalizar([{ id: 'y', texto: 'Comunicar', accion: 'comunicar' }])[0]),
  { id: 'y', texto: 'Comunicar', explicacion: '', accion: 'comunicar', normativa: null });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
