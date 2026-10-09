/* Prueba de la fila 314 (docs/FECHA-QUE-NO-DEJA-ESCRIBIR-EL-ANO.md): los campos de fecha que guardaban con
   cada cifra (U.alTerminarFecha, js/util-pantalla.js) guardan ahora al salir del campo o con Intro. Chromium
   real y el teclado de verdad, cifra a cifra.

   1. Un `desde` de 0020 guardado cuenta como sin fecha y no hay avisos del registro en Inicio.
   2. «Revisar desde el día»: se teclea 01092026 seguido; el campo sigue siendo el mismo y con el foco, no se
      guarda nada hasta salir, y entonces vale 2026-09-01.
   3. Con Intro se guarda una sola vez; la misma fecha otra vez no guarda ni repinta; un año 0020 da aviso ámbar.
   4. Con apuntes: adelantar la fecha pregunta; «Cancelar» no cambia nada; «Quitar» quita y respeta las decisiones.
      Atrasarla no pregunta y avisa de que hay que volver a subir.
   5. Cargos: en «desde» se teclea la fecha entera sin perder el foco; se guarda al salir; «hasta» vacío vale.
   6. `ControlRegistro.cuantosQuitaria` y `ponerDesde('0020-01-01')`. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const ENTRADA = fs.readFileSync(new URL('./control-registro-entrada.csv', import.meta.url)).toString('latin1');
const SALIDA = fs.readFileSync(new URL('./control-registro-salida.csv', import.meta.url)).toString('latin1');

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 }, locale: 'es-ES' });
const pagina = await contexto.newPage();
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
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  await g.getDirectoryHandle('datos', { create: true });
  /* El 0020 que quedó guardado de la primera vez. */
  g._hijos.set('control-registro.json', window.__disco.fich('control-registro.json',
    JSON.stringify({ _esquema: 1, desde: '0020-01-01', subidas: {}, decisiones: {}, clasesSinAsunto: { E: [], S: [] } })));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2200);

/* El orden de los trozos del campo de fecha depende del navegador: se averigua tecleando una fecha de prueba. */
await pagina.evaluate(() => { const i = document.createElement('input'); i.type = 'date'; i.id = 'sonda-fecha'; document.body.appendChild(i); });
await pagina.focus('#sonda-fecha');
for (const c of '31122000') await pagina.keyboard.press(c);
const DIA_PRIMERO = (await pagina.inputValue('#sonda-fecha')) === '2000-12-31';
await pagina.evaluate(() => document.getElementById('sonda-fecha').remove());
console.log('   (el campo de fecha de este navegador pide ' + (DIA_PRIMERO ? 'día/mes/año' : 'mes/día/año') + ')');
const cifras = (dd, mm, aaaa) => (DIA_PRIMERO ? dd + mm : mm + dd) + aaaa;
const control = () => pagina.evaluate(async () => (await ControlRegistro.cargar()).control);
const apuntes = () => pagina.evaluate(async () => Object.keys((await ControlRegistro.cargar()).apuntes).length);
const guardadoEnDisco = () => pagina.evaluate(async () => JSON.parse(await Carpetas.leerTexto(App.E.gestor, 'control-registro.json')).desde);

/* ================= 1. EL 0020 ================= */
console.log('--- 1. el 0020 guardado ---');
await comprobar('un `desde` de 0020 se lee como sin fecha (y en el disco no se toca)',
  pagina.evaluate(async () => [(await ControlRegistro.cargar()).control.desde, JSON.parse(await Carpetas.leerTexto(App.E.gestor, 'control-registro.json')).desde]), ['', '0020-01-01']);
await comprobar('y no hay avisos del registro en Inicio',
  pagina.evaluate(async () => ControlRegistro.resumenParaAvisos(await ControlRegistro.cargar(), null, 7).activo), false);
await comprobar('`desdeValida` y `ponerDesde` rechazan lo disparatado',
  pagina.evaluate(async () => {
    let motivo = '';
    try { await ControlRegistro.ponerDesde('0020-01-01'); } catch (e) { motivo = e.message; }
    return [ControlRegistro.desdeValida('2026-09-01'), ControlRegistro.desdeValida('0020-01-01'), ControlRegistro.desdeValida('2026-02-30'), ControlRegistro.desdeValida('2100-01-01'), motivo];
  }), [true, false, false, false, 'La fecha tiene que ser un día real entre 2000 y 2099.']);
await comprobar('y `ponerDesde(0020)` no guardó nada', guardadoEnDisco(), '0020-01-01');

await pagina.click('.pestana[data-pantalla="herramientas"]');
await pagina.evaluate(() => ControlRegistroPantalla.abrir());
await pagina.waitForSelector('#cr-desde');
await pagina.waitForTimeout(500);
await comprobar('la pantalla sale sin fecha, con el aviso, y el campo con sus límites',
  pagina.evaluate(() => [document.getElementById('cr-desde').value, /Pon la fecha «Revisar desde el día…»/.test(document.getElementById('control-registro-vista').textContent), document.getElementById('cr-desde').min, document.getElementById('cr-desde').max]),
  ['', true, '2000-01-01', '2099-12-31']);

/* ================= 2. TECLEAR ================= */
console.log('--- 2. teclear la fecha ---');
await pagina.evaluate(() => { window.__campo = document.getElementById('cr-desde'); window.__llamadas = 0; const o = ControlRegistro.ponerDesde; ControlRegistro.ponerDesde = function () { window.__llamadas++; return o.apply(this, arguments); }; });
await pagina.focus('#cr-desde');
const escrito = cifras('01', '09', '2026');
let sigue = true;
for (const c of escrito) {
  await pagina.keyboard.press(c);
  await pagina.waitForTimeout(150);
  const estado = await pagina.evaluate(() => [document.getElementById('cr-desde') === window.__campo, document.activeElement === window.__campo, window.__llamadas]);
  if (!(estado[0] && estado[1] && estado[2] === 0)) sigue = false;
}
await comprobar('mientras se teclea: mismo campo, con el foco y sin guardar nada', sigue, true);
await comprobar('con la fecha entera escrita, el campo la tiene y el disco no ha cambiado todavía',
  pagina.evaluate(async () => [window.__campo.value, window.__llamadas]), ['2026-09-01', 0]);
await comprobar('y el disco sigue como estaba', guardadoEnDisco(), '0020-01-01');
await pagina.click('h3.cr-titulo');
await pagina.waitForTimeout(1200);
await comprobar('al salir del campo se guarda 2026-09-01, una sola vez, y el aviso de «Pon la fecha» desaparece',
  pagina.evaluate(async () => [(await ControlRegistro.cargar()).control.desde, window.__llamadas, /Pon la fecha «Revisar desde el día…»/.test(document.getElementById('control-registro-vista').textContent)]),
  ['2026-09-01', 1, false]);

/* ================= 3. INTRO, LO MISMO, 0020 ================= */
console.log('--- 3. Intro, lo mismo y el año 0020 ---');
await pagina.evaluate(() => { window.__campo = document.getElementById('cr-desde'); window.__llamadas = 0; });
await pagina.focus('#cr-desde');
for (const c of cifras('15', '09', '2026')) await pagina.keyboard.press(c);
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(1200);
await comprobar('con Intro se guarda una sola vez (y el blur de después no repite)',
  pagina.evaluate(async () => [(await ControlRegistro.cargar()).control.desde, window.__llamadas]), ['2026-09-15', 1]);
await pagina.evaluate(() => { window.__campo = document.getElementById('cr-desde'); window.__llamadas = 0; });
await pagina.click('#cr-desde');
await pagina.click('h3.cr-titulo');
await pagina.waitForTimeout(500);
await comprobar('dejar la fecha igual y salir: no se guarda ni se repinta nada',
  pagina.evaluate(() => [window.__llamadas, document.getElementById('cr-desde') === window.__campo]), [0, true]);
await pagina.evaluate(() => { window.__campo = document.getElementById('cr-desde'); window.__avisosTexto = []; const o = U.aviso; U.aviso = function (t, c) { window.__avisosTexto.push([t, c || '']); return o.apply(this, arguments); }; });
await pagina.focus('#cr-desde');
for (const c of cifras('01', '01', '0020')) await pagina.keyboard.press(c);
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(800);
await comprobar('un año 0020: aviso ámbar, el campo vuelve a la fecha de antes y no se guarda',
  pagina.evaluate(async () => [[...document.querySelectorAll('#mensajes .mensaje')].filter((m) => /El año tiene que estar entre 2000 y 2099/.test(m.textContent)).map((m) => m.classList.contains('ambar') ? 'ambar' : m.className), window.__campo.value, (await ControlRegistro.cargar()).control.desde, window.__llamadas]),
  [['ambar'], '2026-09-15', '2026-09-15', 0]);

/* ================= 4. ADELANTAR Y ATRASAR ================= */
console.log('--- 4. adelantar y atrasar ---');
await pagina.evaluate(async ([e, s]) => {
  await ControlRegistro.ponerDesde('2026-09-01');
  await ControlRegistro.subir([{ nombre: 'RegLibEntCen.csv', texto: e }, { nombre: 'RegLibSalCen.csv', texto: s }]);
  await ControlRegistro.decidir(Object.keys((await ControlRegistro.cargar()).apuntes)[0], { que: 'no-necesita' });
  await ControlRegistroPantalla.recargar();
}, [ENTRADA, SALIDA]);
await pagina.waitForTimeout(500);
const antes = await apuntes();
const cuantos = await pagina.evaluate(() => ControlRegistro.cuantosQuitaria('2026-10-02'));
await comprobar('hay apuntes y `cuantosQuitaria` cuenta los anteriores sin quitar nada', [antes > cuantos, cuantos > 0, await apuntes() === antes], [true, true, true]);
await pagina.evaluate(() => { window.__campo = document.getElementById('cr-desde'); });
await pagina.focus('#cr-desde');
for (const c of cifras('02', '10', '2026')) await pagina.keyboard.press(c);
await pagina.keyboard.press('Enter');
await pagina.waitForSelector('#cuadro-aceptar', { state: 'visible' });
await comprobar('adelantar la fecha pregunta cuántos apuntes se van a quitar, con «Quitar» y «Cancelar»',
  pagina.evaluate((n) => [document.getElementById('cuadro-titulo').textContent, document.getElementById('cuadro-cuerpo').textContent.indexOf('Se van a quitar ' + n + ' apuntes anteriores al día 02/10/2026.') === 0, document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent, /Lo que ya decidiste sobre ellos no se pierde/.test(document.getElementById('cuadro-cuerpo').textContent)], cuantos),
  ['Revisar desde el día…', true, 'Quitar', 'Cancelar', true]);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(800);
await comprobar('«Cancelar»: la fecha vuelve a 2026-09-01 y siguen todos los apuntes',
  pagina.evaluate(async () => [window.__campo.value, (await ControlRegistro.cargar()).control.desde]).then(async (r) => [...r, await apuntes() === antes]), ['2026-09-01', '2026-09-01', true]);
await pagina.focus('#cr-desde');
for (const c of cifras('02', '10', '2026')) await pagina.keyboard.press(c);
await pagina.keyboard.press('Enter');
await pagina.waitForSelector('#cuadro-aceptar', { state: 'visible' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('«Quitar»: la fecha cambia, se quitan los anteriores y las decisiones siguen',
  pagina.evaluate(async () => { const c = await ControlRegistro.cargar(); return [c.control.desde, Object.keys(c.apuntes).length, Object.keys(c.control.decisiones).length]; }).then(([d, n, dec]) => [d, n === antes - cuantos, dec]),
  ['2026-10-02', true, 1]);
await comprobar('y sale el aviso verde con cuántos se han quitado',
  pagina.evaluate((n) => [...document.querySelectorAll('#mensajes .mensaje')].some((m) => m.textContent === 'Se han quitado ' + n + ' apuntes anteriores a esa fecha.'), cuantos), true);
await pagina.focus('#cr-desde');
for (const c of cifras('01', '09', '2026')) await pagina.keyboard.press(c);
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(1500);
await comprobar('atrasar la fecha no pregunta y deja el aviso de volver a subir',
  pagina.evaluate(async () => [(await ControlRegistro.cargar()).control.desde, document.getElementById('cuadro-aceptar') && !document.getElementById('capa').classList.contains('oculto'), /Vuelve a subir los listados para revisar esos días\./.test(document.getElementById('control-registro-vista').textContent)]),
  ['2026-09-01', false, true]);
await pagina.evaluate(() => ControlRegistroPantalla.cerrar());

/* ================= 5. CARGOS ================= */
console.log('--- 5. cargos ---');
await pagina.evaluate(async () => {
  const d = await Cargos.leer();
  await Cargos.anadirOcupante(d.cargos[0].id, 'Persona Inventada', '2020-01-01', 'M');
  App.ir('ajustes');
  await Cargos.pintarEnAjustes();
});
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.waitForTimeout(1800);
await pagina.evaluate(() => { document.querySelectorAll('#bloque-cargos details').forEach((d) => { d.open = true; }); document.getElementById('bloque-cargos').open = true; });
const sel = '#cargos-lista .fila-tipo input[type="date"]';
const abrirCargos = () => pagina.evaluate(() => { document.querySelectorAll('#bloque-cargos details').forEach((d) => { d.open = true; }); });
await pagina.evaluate((sel) => { const campos = [...document.querySelectorAll(sel)]; window.__desde = campos.filter((c) => c.value === '2020-01-01')[0]; window.__desde.setAttribute('data-prueba-desde', '1'); }, sel);
await pagina.focus('[data-prueba-desde]');
for (const c of cifras('03', '03', '2021')) { await pagina.keyboard.press(c); await pagina.waitForTimeout(100); }
await comprobar('«desde» de un cargo: se teclea la fecha entera sin perder el foco, sin guardar todavía',
  pagina.evaluate(async () => [document.activeElement === window.__desde, window.__desde.value, (await Cargos.leer()).cargos[0].ocupantes.filter((o) => o.persona === 'Persona Inventada')[0].desde]), [true, '2021-03-03', '2020-01-01']);
await pagina.evaluate(() => { document.activeElement.blur(); });
await pagina.waitForTimeout(1000);
await comprobar('al salir se guarda',
  pagina.evaluate(async () => (await Cargos.leer()).cargos[0].ocupantes.filter((o) => o.persona === 'Persona Inventada')[0].desde), '2021-03-03');
await abrirCargos();
await pagina.evaluate((sel) => { const d = [...document.querySelectorAll(sel)].filter((c) => c.value === '2021-03-03')[0]; d.nextElementSibling.setAttribute('data-prueba-hasta2', '1'); }, sel);
await pagina.focus('[data-prueba-hasta2]');
for (const c of cifras('04', '04', '2022')) { await pagina.keyboard.press(c); await pagina.waitForTimeout(100); }
await pagina.evaluate(() => { document.activeElement.blur(); });
await pagina.waitForTimeout(1000);
await comprobar('«hasta» se guarda al salir',
  pagina.evaluate(async () => (await Cargos.leer()).cargos[0].ocupantes.filter((o) => o.persona === 'Persona Inventada')[0].hasta), '2022-04-04');
await abrirCargos();
await pagina.evaluate((sel) => { window.__h2 = [...document.querySelectorAll(sel)].filter((x) => x.value === '2022-04-04')[0]; window.__h2.setAttribute('data-prueba-hasta', '1'); }, sel);
await pagina.fill('[data-prueba-hasta]', '');
await pagina.waitForTimeout(1000);
await comprobar('«hasta» vaciado se guarda vacío', pagina.evaluate(async () => (await Cargos.leer()).cargos[0].ocupantes.filter((o) => o.persona === 'Persona Inventada')[0].hasta), '');

const deVerdad = errores.filter((e) => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
