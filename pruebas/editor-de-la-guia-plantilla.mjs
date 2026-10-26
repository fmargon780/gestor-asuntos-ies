/* Prueba en navegador de verdad de la fila 465, parte C
   (docs/EDITOR-DE-LA-GUIA-CLARO.md): la plantilla de correo se ve y se cambia desde la guía, y
   en «Normativa e impresos» solo se ven los impresos marcados.

   1. «Ver y cambiar el texto» sale junto a «Plantilla de correo» solo con una plantilla elegida (C1).
   2. Al pulsarlo, la columna derecha enseña el editor de plantillas con el texto, y «← Volver a la guía»
      vuelve sin guardar, sin perder lo escrito en la guía (C2).
   3. «Guardar la plantilla» la guarda al momento (se ve en la memoria y en el disco), vuelve al mismo
      hito con la misma tarea abierta y lo escrito en la guía sigue ahí (C2).
   4. Lo mismo junto a «Con la plantilla:» de «Al terminar este hito» (C3).
   5. «Normativa e impresos»: solo los marcados, el buscador encuentra los demás y marcar uno lo añade (C4).
   6. Guardar la guía deja los impresos marcados como antes.

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

/* Dos plantillas de correo del tipo BAJA y la de aviso. */
await pagina.evaluate(async () => {
  await Plantillas.guardar(App.E.gestor, (a) => {
    a.lista.push({ id: 'pl-acuse', tipo: 'BAJA', categoria: 'ALUMNADO', nombre: 'Acuse de recibo del parte', texto: 'Hemos recibido el parte de baja de {nombre}.' });
    a.lista.push({ id: 'pl-otra', tipo: 'BAJA', categoria: 'ALUMNADO', nombre: 'Otra plantilla', texto: 'Otro texto.' });
    return a;
  });
  await PlantillasAjustes.cargar();
});

const GUIA = [
  { id: 'p1', titulo: 'Recibir el parte de baja', avisarLoPide: true, avisarLoPidePlantilla: 'pl-otra', formularios: ['O11:I'],
    guion: [{ id: 'g1', texto: 'Acusar recibo del parte', accion: 'comunicar', receta: { a: 'tutoria', via: 'correo', plantilla: 'pl-acuse' } },
            { id: 'g2', texto: 'Avisar sin plantilla', accion: 'comunicar', receta: { a: 'tutoria', via: 'correo', plantilla: '' } },
            { id: 'g3', texto: 'Sellar el parte' }] },
  { id: 'p2', titulo: 'Archivar' }
];
const RESP = [];
const F = (id) => '#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila[data-id="' + id + '"]';
async function abrir() {
  await pagina.evaluate(([GUIA, RESP]) => {
    window.__guardada = Guias.editar('BAJA', JSON.parse(JSON.stringify(GUIA)), RESP, []);
  }, [GUIA, RESP]);
  await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
}
const visible = (sel) => pagina.evaluate((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, sel);
const abiertas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="0"] .guion-lista > .guion-fila.guion-abierta')).map(f => f.dataset.id));
const elegido = () => pagina.evaluate(() => document.querySelector('#guia-lista .guia-lista-item.elegido .guia-lista-titulo').textContent);

/* ================= 1 ================= */
console.log('--- 1. el botón solo con plantilla elegida ---');
await abrir();
await pagina.click(F('g1') + ' > .guion-resumen');
await comprobar('con plantilla elegida, el botón sale, a la derecha del desplegable', 
  pagina.evaluate((s) => {
    const f = document.querySelector(s); const b = f.querySelector('.guia-plantilla-ver'); const sel = f.querySelector('.guion-receta-plantilla');
    return [b.textContent, b.offsetParent !== null, b.getBoundingClientRect().left >= sel.getBoundingClientRect().right - 2];
  }, F('g1')), ['Ver y cambiar el texto', true, true]);
await pagina.click(F('g2') + ' > .guion-resumen');
await comprobar('«Sin plantilla fija»: el botón no sale', visible(F('g2') + ' .guia-plantilla-ver'), false);
await pagina.selectOption(F('g2') + ' .guion-receta-plantilla', 'pl-otra');
await comprobar('al elegir una plantilla, sale', visible(F('g2') + ' .guia-plantilla-ver'), true);
await pagina.selectOption(F('g2') + ' .guion-receta-plantilla', '');
await comprobar('y al quitarla, se va', visible(F('g2') + ' .guia-plantilla-ver'), false);

/* ================= 2 ================= */
console.log('--- 2. ver y volver sin guardar ---');
await pagina.click(F('g1') + ' > .guion-resumen');
await pagina.fill(F('g1') + ' .guion-texto', 'Acusar recibo (escrito en la guía)');
await pagina.click(F('g1') + ' .guia-plantilla-ver');
await pagina.waitForSelector('#guia-plantilla-guardar');
await comprobar('la columna derecha enseña el editor con el texto de la plantilla y «← Volver a la guía»',
  pagina.evaluate(() => [document.querySelector('#guia-plantilla-volver').textContent, document.querySelector('#pl-nombre').value,
    document.querySelector('#pl-texto').value, document.querySelector('#guia-col-der').contains(document.querySelector('#pl-texto')),
    document.querySelector('#guia-pasos').offsetParent === null]),
  ['← Volver a la guía', 'Acuse de recibo del parte', 'Hemos recibido el parte de baja de {nombre}.', true, true]);
await pagina.fill('#pl-texto', 'Texto que no se guarda');
await pagina.click('#guia-plantilla-volver');
await comprobar('«← Volver a la guía»: vuelve al mismo hito con la misma tarea abierta, y lo escrito en la guía sigue',
  pagina.evaluate(() => [document.querySelector('#guia-plantilla-panel').classList.contains('oculto'), document.querySelector('#pl-texto'),
    Array.from(document.querySelectorAll('#guia-pasos .guion-fila.guion-abierta')).map(f => f.dataset.id),
    document.querySelector('#guia-pasos .guion-fila[data-id="g1"] .guion-texto').value]),
  [true, null, ['g1'], 'Acusar recibo (escrito en la guía)']);
await comprobar('sin guardar, la plantilla sigue como estaba',
  pagina.evaluate(() => Plantillas.enMemoria().lista.filter(p => p.id === 'pl-acuse')[0].texto), 'Hemos recibido el parte de baja de {nombre}.');

/* ================= 3 ================= */
console.log('--- 3. cambiar y guardar la plantilla ---');
await pagina.click(F('g1') + ' .guia-plantilla-ver');
await pagina.waitForSelector('#guia-plantilla-guardar');
await pagina.fill('#pl-texto', 'Hemos recibido el parte médico de {nombre}.');
await pagina.click('#guia-plantilla-guardar');
await pagina.waitForFunction(() => document.querySelector('#guia-plantilla-panel').classList.contains('oculto'));
await comprobar('«Guardar la plantilla» vuelve al mismo hito y la misma tarea abierta, con lo escrito en la guía',
  pagina.evaluate(() => [document.querySelector('#guia-plantilla-panel').innerHTML,
    Array.from(document.querySelectorAll('#guia-pasos .guion-fila.guion-abierta')).map(f => f.dataset.id),
    document.querySelector('#guia-pasos .guion-fila[data-id="g1"] .guion-texto').value,
    document.querySelector('#guia-pasos').offsetParent !== null]),
  ['', ['g1'], 'Acusar recibo (escrito en la guía)', true]);
await comprobar('la plantilla guardada, en memoria', 
  pagina.evaluate(() => Plantillas.enMemoria().lista.filter(p => p.id === 'pl-acuse')[0].texto), 'Hemos recibido el parte médico de {nombre}.');
await comprobar('y en el disco (se ve también al releerla, como en Ajustes)',
  pagina.evaluate(async () => { const d = await Plantillas.cargar(App.E.gestor); return d.lista.filter(p => p.id === 'pl-acuse')[0].texto; }),
  'Hemos recibido el parte médico de {nombre}.');
await comprobar('sigue elegida en la tarea', pagina.evaluate((s) => document.querySelector(s + ' .guion-receta-plantilla').value, F('g1')), 'pl-acuse');
await pagina.click(F('g1') + ' .guia-plantilla-ver');
await pagina.waitForSelector('#guia-plantilla-guardar');
await pagina.fill('#pl-nombre', '');
await pagina.click('#guia-plantilla-guardar');
await comprobar('si falta el nombre, avisa y se queda en el editor',
  pagina.evaluate(() => [!document.querySelector('#guia-plantilla-panel').classList.contains('oculto'), !!document.querySelector('#pl-texto')]), [true, true]);
await pagina.click('#guia-plantilla-volver');
await pagina.click('#cuadro-cancelar');
await comprobar('cancelar la guía no deshace la plantilla ya guardada',
  pagina.evaluate(() => Plantillas.enMemoria().lista.filter(p => p.id === 'pl-acuse')[0].texto), 'Hemos recibido el parte médico de {nombre}.');

/* ================= 4 ================= */
console.log('--- 4. el aviso «Al terminar este hito» ---');
await abrir();
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] > .paso-apartado-cab[data-ap="aviso"]');
await pagina.waitForFunction(() => document.querySelector('#guia-pasos .paso-avisar-lopide-select').options.length > 1);
await comprobar('junto a «Con la plantilla:», el botón sale',
  pagina.evaluate(() => { const b = document.querySelector('#guia-pasos .paso-avisar-lopide-plantilla .guia-plantilla-ver'); return [b.textContent, b.offsetParent !== null]; }),
  ['Ver y cambiar el texto', true]);
await pagina.click('#guia-pasos .paso-avisar-lopide-plantilla .guia-plantilla-ver');
await pagina.waitForSelector('#guia-plantilla-guardar');
await comprobar('enseña la plantilla elegida del aviso', pagina.evaluate(() => [document.querySelector('#pl-nombre').value, document.querySelector('#pl-texto').value]), ['Otra plantilla', 'Otro texto.']);
await pagina.fill('#pl-texto', 'Otro texto, cambiado.');
await pagina.click('#guia-plantilla-guardar');
await pagina.waitForFunction(() => document.querySelector('#guia-plantilla-panel').classList.contains('oculto'));
await comprobar('guardada, y la guía vuelve con el apartado abierto y la misma plantilla elegida',
  pagina.evaluate(async () => {
    await new Promise(r => setTimeout(r, 300));
    return [Plantillas.enMemoria().lista.filter(p => p.id === 'pl-otra')[0].texto,
      document.querySelector('#guia-pasos .paso-avisar-lopide-select').value,
      document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]').classList.contains('abre-aviso')];
  }), ['Otro texto, cambiado.', 'pl-otra', true]);
await pagina.click('#cuadro-cancelar');

/* ================= 4b ================= */
console.log('--- 4b. una plantilla general (sin tipo) no pierde su sitio al guardarse ---');
await pagina.evaluate(async () => {
  await Plantillas.guardar(App.E.gestor, (a) => { a.lista.push({ id: 'pl-gen', tipo: '', categoria: '', nombre: 'Aviso general', texto: 'Texto general.' }); return a; });
  await PlantillasAjustes.cargar();
  window.__guardada = Guias.editar('BAJA', [{ id: 'p1', titulo: 'Uno', avisarLoPide: true, avisarLoPidePlantilla: 'pl-gen' }], [], []);
});
await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] > .paso-apartado-cab[data-ap="aviso"]');
await pagina.waitForFunction(() => document.querySelector('#guia-pasos .paso-avisar-lopide-select').value === 'pl-gen');
await pagina.click('#guia-pasos .paso-avisar-lopide-plantilla .guia-plantilla-ver');
await pagina.waitForSelector('#guia-plantilla-guardar');
await pagina.fill('#pl-texto', 'Texto general, cambiado.');
await pagina.click('#guia-plantilla-guardar');
await pagina.waitForFunction(() => document.querySelector('#guia-plantilla-panel').classList.contains('oculto'));
await comprobar('guardada sin tipo ni categoría, y sigue elegida en el aviso',
  pagina.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); const p = Plantillas.enMemoria().lista.filter(x => x.id === 'pl-gen')[0];
    return [p.tipo, p.categoria, p.texto, document.querySelector('#guia-pasos .paso-avisar-lopide-select').value]; }),
  ['', '', 'Texto general, cambiado.', 'pl-gen']);
await pagina.click('#cuadro-cancelar');

/* ================= 5 ================= */
console.log('--- 5. «Normativa e impresos»: solo los marcados y el buscador ---');
await abrir();
const FILAS = '#guia-pasos > .paso-editor[data-pos="0"] .formularios-editor .formularios-fila';
const veoFilas = () => pagina.evaluate((s) => Array.from(document.querySelectorAll(s)).filter(f => f.offsetParent !== null || (!f.classList.contains('oculto') && getComputedStyle(f).display !== 'none'))
  .map(f => [f.querySelector('.formularios-casilla').dataset.clave, f.querySelector('.formularios-casilla').checked]), FILAS);
await pagina.waitForFunction(() => document.querySelectorAll('#guia-pasos .formularios-fila').length > 5);
await comprobar('la línea plegada dice cuántos hay', pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-apartado-cab[data-ap="normativa"] .ap-resumen').textContent), '1 impreso marcado');
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] > .paso-apartado-cab[data-ap="normativa"]');
await comprobar('buscador vacío: solo el impreso marcado, con su casilla marcada', veoFilas(), [['O11:I', true]]);
await comprobar('el buscador «Buscar un impreso…» está encima', pagina.evaluate(() => document.querySelector('#guia-pasos .formularios-buscar').placeholder), 'Buscar un impreso…');
await pagina.fill('#guia-pasos > .paso-editor[data-pos="0"] .formularios-buscar', 'compromiso de convi');
await comprobar('al escribir salen los que coinciden, sin marcar (y el marcado sigue)',
  pagina.evaluate((s) => Array.from(document.querySelectorAll(s)).filter(f => !f.classList.contains('oculto')).map(f => [f.querySelector('.formularios-casilla').dataset.clave, f.querySelector('.formularios-casilla').checked]), FILAS),
  [['O11:I', true], ['O11:VI', false]]);
await pagina.check(FILAS + ' .formularios-casilla[data-clave="O11:VI"]');
await comprobar('marcar uno lo añade a los de este hito (la línea plegada lo dice)',
  pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-apartado-cab[data-ap="normativa"] .ap-resumen').textContent), '2 impresos marcados');
await pagina.fill('#guia-pasos > .paso-editor[data-pos="0"] .formularios-buscar', '');
await comprobar('con el buscador vacío, los dos marcados',
  pagina.evaluate((s) => Array.from(document.querySelectorAll(s)).filter(f => !f.classList.contains('oculto')).map(f => f.querySelector('.formularios-casilla').dataset.clave).sort(), FILAS), ['O11:I', 'O11:VI']);
await pagina.uncheck(FILAS + ' .formularios-casilla[data-clave="O11:I"]');
await pagina.click('#cuadro-aceptar');
await comprobar('Guardar: se guardan los impresos marcados',
  pagina.evaluate(async () => (await window.__guardada)[0].formularios.slice().sort()), ['O11:VI']);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobaciones fallan'); process.exit(1); }
console.log('\nTodo bien');
