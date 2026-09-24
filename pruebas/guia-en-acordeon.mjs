/* Prueba en navegador de verdad de la fila 122 (docs/GUIA-EN-ACORDEON.md):
   el cuadro de escribir la guía, en acordeón.

   1. Al entrar, todos los pasos cerrados, cada uno en una línea con su
      título y sus marcas (Normativa, Documentos, Guion, Pregunta, Solo
      informativo, el responsable).
   2. Pulsar la línea abre el paso; pulsarla otra vez lo cierra; abrir
      otro cierra el primero.
   3. «Añadir un paso»: sale abierto, con el cursor en su título.
   4. Las flechas no lo abren ni lo cierran.
   5. Un repintado (marcar «es una pregunta») deja el paso abierto.
   6. Un paso nuevo dentro de una opción sale abierto sin cerrar el
      paso-pregunta que lo contiene; abrir otro de arriba cierra los dos.
   7. Desde el mapa (`irA`), el paso sale abierto.
   8. «Documentos» y «Guion» con la misma caja gris y letra que los demás.
   9. Lo guardado no cambia: un paso cerrado conserva todo lo suyo.

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

const GUIA = [
  { id: 'p1', titulo: 'Registrar la entrada', responsable: 'r1',
    normativa: [{ cita: 'Decreto 1/2020, art. 3' }, { cita: 'Orden 2/2021' }],
    guion: [{ id: 'g1', texto: 'Sellar' }], plantillasDocumento: ['pd-x'] },
  { id: 'q1', titulo: '¿Cómo ha llegado?', opciones: [
    { id: 'a', titulo: 'En mano', pasos: [{ id: 'a1', titulo: 'Poner el sello' }] },
    { id: 'b', titulo: 'Por correo', pasos: [{ id: 'b1', titulo: 'Guardar el correo' }] }
  ] },
  { id: 'p3', titulo: 'Avisar a la familia', soloInformativo: true },
  { id: 'p4', titulo: 'Archivar' }
];
const RESP = [{ id: 'r1', nombre: 'Secretaría' }];

/* Qué pasos (y subpasos) están abiertos, por su título. */
const abiertos = () => pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-pasos .paso-editor, #guia-pasos .subpaso-editor'))
    .filter(el => !el.classList.contains('paso-plegado'))
    .map(el => el.querySelector(':scope > .paso-cabecera > .paso-titulo, :scope > .paso-cabecera > .subpaso-titulo').value));
const linea = (pos) => pagina.click('#guia-pasos > .paso-editor[data-pos="' + pos + '"] > .paso-cabecera > .paso-resumen');

async function abrirEditor(opciones) {
  await pagina.evaluate(([GUIA, RESP, opciones]) => {
    window.__guardada = Guias.editar('FACTURA', GUIA, RESP, [], opciones);
  }, [GUIA, RESP, opciones || null]);
  await pagina.waitForSelector('#guia-pasos .paso-editor');
}

/* ================= 1 ================= */
console.log('--- 1. al entrar, todo cerrado ---');
await abrirEditor();
await comprobar('ningún paso abierto', abiertos(), []);
await comprobar('cada línea: título y marcas',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor > .paso-cabecera > .paso-resumen'))
    .map(r => r.textContent)),
  ['Registrar la entradaNormativa (2)Documentos (1)Guion (1)Secretaría', '¿Cómo ha llegado?Pregunta',
   'Avisar a la familiaSolo informativo', 'Archivar']);
await comprobar('cerrado solo se ve la línea (el campo del título y el cuerpo, escondidos)',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]');
    return [d.querySelector('.paso-titulo').offsetParent === null, d.querySelector('.paso-cuerpo').offsetParent === null,
            d.querySelector('.paso-resumen').offsetParent !== null];
  }), [true, true, true]);
await comprobar('las flechas y «Quitar» siguen en la línea cerrada',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-cabecera > .paso-mandos > .boton').evaluateAll(b => b.slice(0, 3).map(x => x.offsetParent !== null && x.textContent)),
  ['↑', '↓', 'Quitar']);

/* ================= 2 ================= */
console.log('--- 2. abrir y cerrar ---');
await linea(0);
await comprobar('pulsar la línea lo abre', abiertos(), ['Registrar la entrada']);
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] > .paso-cabecera > .paso-numero');
await comprobar('pulsarla otra vez lo cierra', abiertos(), []);
await linea(0);
await linea(2);
await comprobar('abrir otro cierra el primero', abiertos(), ['Avisar a la familia']);

/* ================= 3 ================= */
console.log('--- 3. añadir un paso ---');
await pagina.click('#guia-anadir');
await comprobar('el nuevo sale abierto y los demás cerrados', abiertos(), ['']);
await comprobar('con el cursor en su título',
  pagina.evaluate(() => document.activeElement === document.querySelector('#guia-pasos > .paso-editor[data-pos="4"] .paso-titulo')), true);
await pagina.keyboard.type('Pagar');

/* ================= 4 ================= */
console.log('--- 4. las flechas ---');
await linea(0);
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] .paso-mandos button[title="Bajar este paso"]');
await comprobar('bajado, sigue abierto (ahora en el sitio 2)',
  pagina.evaluate(() => !document.querySelector('#guia-pasos > .paso-editor[data-pos="1"]').classList.contains('paso-plegado')), true);
await comprobar('y es el único abierto', abiertos(), ['Registrar la entrada']);
await pagina.click('#guia-pasos > .paso-editor[data-pos="1"] .paso-mandos button[title="Subir este paso"]');
await comprobar('subido, sigue abierto', abiertos(), ['Registrar la entrada']);
await pagina.click('#guia-pasos > .paso-editor[data-pos="3"] .paso-mandos button[title="Subir este paso"]');
await comprobar('mover uno cerrado no lo abre', abiertos(), ['Registrar la entrada']);

/* ================= 5 ================= */
console.log('--- 5. tras repintar ---');
await linea(2);
await pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-es-pregunta-fila .paso-es-pregunta').check();
await comprobar('marcar «es una pregunta» repinta y el paso sigue abierto', abiertos(), ['Archivar']);
await comprobar('(ya con sus dos opciones a la vista)',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] .opcion-editor').evaluateAll(o => o.filter(x => x.offsetParent !== null).length), 2);
await pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-es-pregunta-fila .paso-es-pregunta').uncheck();
await comprobar('y al desmarcarla, igual', abiertos(), ['Archivar']);

/* ================= 6 ================= */
console.log('--- 6. un paso dentro de una opción ---');
await linea(1);
await pagina.locator('#guia-pasos > .paso-editor[data-pos="1"] .opcion-editor').nth(0)
  .locator('button', { hasText: '+ Añadir un paso a esta opción' }).click();
await comprobar('el nuevo, abierto, y la pregunta que lo contiene también', abiertos(), ['¿Cómo ha llegado?', '']);
await comprobar('con el cursor en su título',
  pagina.evaluate(() => document.activeElement === document.querySelectorAll('#guia-pasos .opcion-editor')[0].querySelectorAll('.subpaso-titulo')[1]), true);
await pagina.keyboard.type('Escanear');
await pagina.locator('#guia-pasos .subpaso-editor', { hasText: '' }).first().locator('.paso-resumen').click();
await comprobar('abrir otro de la misma pregunta cierra el primero, sin cerrar la pregunta', abiertos(), ['¿Cómo ha llegado?', 'Poner el sello']);
await linea(0);
await comprobar('abrir uno de arriba cierra la pregunta y su paso', abiertos(), ['Registrar la entrada']);

/* ================= 8 ================= */
console.log('--- 8. las cajas de «Documentos» y «Guion» ---');
await comprobar('misma caja gris y misma letra que «Responsable, estado y plazo»',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]');
    const mira = (sel) => { const el = d.querySelector(sel); const s = getComputedStyle(el); const t = getComputedStyle(el.querySelector('summary'));
      return [s.backgroundColor, s.borderTopWidth, s.borderRadius, t.fontSize]; };
    const base = JSON.stringify(mira(':scope > .paso-extra'));
    return [JSON.stringify(mira(':scope > .paso-documentos')) === base, JSON.stringify(mira(':scope > .paso-guion')) === base];
  }), [true, true]);

/* ================= 9 ================= */
console.log('--- 9. guardar ---');
await pagina.click('#cuadro-aceptar');
const guardada = await pagina.evaluate(() => window.__guardada);
await comprobar('los pasos, en su orden nuevo', Promise.resolve(guardada.map(p => p.titulo)),
  ['Registrar la entrada', '¿Cómo ha llegado?', 'Archivar', 'Avisar a la familia', 'Pagar']);
await comprobar('lo de un paso cerrado no se pierde',
  Promise.resolve([guardada[0].normativa.length, guardada[0].guion.length, guardada[0].responsable, guardada[3].soloInformativo]),
  [2, 1, 'r1', true]);
await comprobar('el paso nuevo de la opción, guardado', Promise.resolve(guardada[1].opciones[0].pasos.map(p => p.titulo)),
  ['Poner el sello', 'Escanear']);

/* ================= 7 ================= */
console.log('--- 7. desde el mapa ---');
await abrirEditor({ irA: 'p3' });
await comprobar('el paso al que se va, abierto; los demás, cerrados', abiertos(), ['Avisar a la familia']);
await pagina.click('#cuadro-cancelar').catch(() => pagina.keyboard.press('Escape'));
await abrirEditor({ irA: 'b1' });
await comprobar('uno de dentro de una opción: su nivel, con él abierto', abiertos(), ['Guardar el correo']);
await pagina.keyboard.press('Escape');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
