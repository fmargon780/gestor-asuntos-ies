/* Prueba de la fila 270 de docs/COLA.md (docs/PLANTILLA-NUEVA-DE-LO-ESCRITO.md):
   «Guardar como plantilla nueva» en el cuadro de Correo y en el de Séneca.

   1. La parte pura: quitar saludo y firma, cambiar datos por huecos.
   2. Correo: el botón, el editor con lo escrito, la lista de cambios con
      «Deshacer», el nombre repetido, guardar (queda elegida y el texto no
      se toca), la plantilla en otro asunto, cancelar.
   3. Séneca: lo mismo, y la plantilla sale también en Correo.
   Datos inventados. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const A1 = '260910 CONVALIDACION 26-27 Prueba Inventada, Persona 9990001';
const A2 = '260911 CONVALIDACION 26-27 Ejemplo Ficticio, Otra 9990002';

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 950 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([a1, a2]) => {
  await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(a2, { create: true });
}, [A1, A2]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2]) => {
  const f = (n, ter, grupo, limite) => App.anotar(n, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: ter, curso: '26-27', grupo, descripcion: '', campos: {}, limite });
  await f(a1, 'Prueba Inventada, Persona 9990001', '2º ESO B', '2026-10-20');
  await f(a2, 'Ejemplo Ficticio, Otra 9990002', '1º BACH A', '2026-11-05');
  await Plantillas.guardar(App.E.gestor, (x) => {
    x.lista.push({ id: 'pl-del-tipo', tipo: 'CONVALIDACION', categoria: 'ALUMNADO', nombre: 'Plantilla del tipo', texto: 'Texto base de {nombre}.' });
    return x;
  });
  await App.verAbiertos();
  window.__avisos = [];
  const o = U.aviso;
  U.aviso = function (m, t) { window.__avisos.push(String(m) + '|' + t); return o.apply(this, arguments); };
}, [A1, A2]);

console.log('--- 1. la parte pura ---');
await comprobar('quitar saludo y firma, solo si coinciden', pagina.evaluate(() => [
  PlantillaDeLoEscrito.sinSaludoNiFirma('Hola:\n\nCuerpo aquí.\n\nUn saludo,\nFrancisco', 'Hola:', 'Un saludo,\nFrancisco'),
  PlantillaDeLoEscrito.sinSaludoNiFirma('Hola a todos:\n\nCuerpo.\n\nUn saludo,\nFrancisco', 'Hola:', 'Un saludo,\nFrancisco'),
  PlantillaDeLoEscrito.sinSaludoNiFirma('Hola:\n\nCuerpo.\n\nSaludos', 'Hola:', 'Un saludo,\nFrancisco')
]), ['Cuerpo aquí.', 'Hola a todos:\n\nCuerpo.', 'Cuerpo.\n\nSaludos']);
await comprobar('cambiar datos por su hueco: enteros, más largos primero, sin tocar lo corto ni trozos de palabras', pagina.evaluate(() => {
  const v = { nombre: 'Prueba Inventada, Persona', nombreNatural: 'Persona Prueba Inventada', grupo: '2º ESO B', limite: '20/10/2026', hoy: '20/10/2026',
    correo: 'tutor@correo.invalid', referencia: 'Sí', campos: { 'Número de plaza': '88123' } };
  const r = PlantillaDeLoEscrito.cambiarDatos('Persona Prueba Inventada, del 2º ESO B y del 12º ESO B: hasta el 20/10/2026 (hoy 20/10/2026). Sí. Plaza 88123. tutor@CORREO.invalid', v);
  return [r.texto, r.cambios.map(c => c.hueco)];
}), ['{nombreNatural}, del {grupo} y del 12º ESO B: hasta el {limite} (hoy {limite}). Sí. Plaza {campo:Número de plaza}. {correo}',
  ['{nombreNatural}', '{correo}', '{grupo}', '{limite}', '{campo:Número de plaza}']]);

async function abrirCuadro(asunto, tipo) {
  await pagina.evaluate((n) => { App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === n)[0], 'abierto'); }, asunto);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
  await pagina.waitForTimeout(400);
  await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), tipo);
  await pagina.waitForSelector('#capa:not(.oculto) #' + (tipo === 'Correo electrónico' ? 'correo' : 'seneca') + '-formulario');
  await pagina.waitForTimeout(300);
}
const FRASE = 'Le informamos de que la solicitud de Persona Prueba Inventada, del grupo 2º ESO B, está lista. Puede recogerla hasta el 20/10/2026.';

async function recorrido(p, nombreNueva, tipo) {
  console.log('--- cuadro de ' + (p === 'correo' ? 'Correo' : 'Séneca') + ' ---');
  await comprobar(p + ' · dos botones junto al desplegable', pagina.evaluate((p) =>
    Array.from(document.querySelectorAll('#' + p + '-comunes-der .etiqueta-con-boton button')).map(b => b.textContent.trim()), p),
    ['Cambiar la plantilla', 'Guardar como plantilla nueva']);
  await pagina.selectOption('#' + p + '-plantilla', '');
  await pagina.waitForTimeout(150);
  const escrito = await pagina.evaluate(([p, frase]) => {
    const c = document.getElementById(p + '-cuerpo-texto');
    c.value = c.value.replace('\n\n\n\n', '\n\n' + frase + '\n\n');
    return c.value;
  }, [p, FRASE]);
  await pagina.click('#' + p + '-plantilla-desde-escrito');
  await pagina.waitForSelector('#' + p + '-plantilla-editor:not(.oculto) #pl2-nombre');
  await comprobar(p + ' · el editor se abre dentro del cuadro con el nombre vacío y el foco', pagina.evaluate(() =>
    [document.getElementById('pl2-nombre').value, document.activeElement.id]), ['', 'pl2-nombre']);
  const texto = await pagina.locator('#pl2-texto').inputValue();
  await comprobar(p + ' · sin saludo ni firma y con tres huecos', [/Estimados|Buenos días|Hola/.test(texto), texto],
    [false, 'Le informamos de que la solicitud de {nombreNatural}, del grupo {grupo}, está lista. Puede recogerla hasta el {limite}.']);
  await comprobar(p + ' · tres líneas con «Deshacer» y la nota del saludo y la firma', pagina.evaluate((p) => [
    document.querySelectorAll('#pl2-cambios .pl2-cambio').length,
    Array.from(document.querySelectorAll('#pl2-cambios .pl2-cambio button')).every(b => b.textContent === 'Deshacer'),
    /He cambiado estos datos por su hueco\. Revísalos:/.test(document.getElementById('pl2-cambios').textContent),
    /El saludo y la firma no van en la plantilla: la app los pone sola en cada mensaje\./.test(document.getElementById(p + '-plantilla-editor').textContent)
  ], p), [3, true, true, true]);
  await comprobar(p + ' · la vista previa lee lo que se había escrito', pagina.locator('#pl2-previa').textContent(), FRASE);
  await pagina.locator('#pl2-cambios .pl2-cambio', { hasText: '{grupo}' }).locator('button').click();
  await comprobar(p + ' · «Deshacer» devuelve el grupo y quita su línea; las otras siguen', pagina.evaluate(() => [
    document.getElementById('pl2-texto').value.indexOf('2º ESO B') !== -1,
    document.getElementById('pl2-texto').value.indexOf('{grupo}'),
    document.querySelectorAll('#pl2-cambios .pl2-cambio').length]), [true, -1, 2]);
  await pagina.click('#pl2-guardar');
  await comprobar(p + ' · sin nombre no guarda', pagina.locator('#pl2-aviso').textContent(), 'Hace falta el nombre y el texto.');
  await pagina.fill('#pl2-nombre', 'Plantilla del tipo');
  await pagina.click('#pl2-guardar');
  await comprobar(p + ' · nombre repetido no guarda', pagina.locator('#pl2-aviso').textContent(), 'Ya hay una plantilla con ese nombre en este tipo de asunto.');
  await pagina.fill('#pl2-nombre', nombreNueva);
  await pagina.click('#pl2-guardar');
  await pagina.waitForSelector('#' + p + '-formulario:not(.oculto)');
  await pagina.waitForTimeout(300);
  await comprobar(p + ' · vuelve al cuadro con la plantilla nueva elegida', pagina.evaluate((p) =>
    document.querySelector('#' + p + '-plantilla option:checked').textContent, p), nombreNueva);
  await comprobar(p + ' · el texto del mensaje sigue como se dejó, sin pregunta de «se perderá»', pagina.evaluate((p) => [
    document.getElementById(p + '-cuerpo-texto').value,
    document.getElementById(p + '-plantilla-confirmar').className], p), [escrito, 'oculto']);
  await comprobar(p + ' · saludo y firma una sola vez', pagina.evaluate(([p]) => {
    const t = document.getElementById(p + '-cuerpo-texto').value;
    return [t.split('Estimados tutores legales').length - 1, t.split('Francisco').length - 1];
  }, [p]), [1, 1]);
  await comprobar(p + ' · aviso verde', pagina.evaluate(() => window.__avisos.some(a => a === 'Plantilla guardada. Queda elegida en este cuadro.|bueno')), true);
}

await abrirCuadro(A1, 'Correo electrónico');
await recorrido('correo', 'Recogida');

console.log('--- la plantilla en otro asunto ---');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await abrirCuadro(A2, 'Correo electrónico');
const idRecogida = await pagina.evaluate(() => Array.from(document.querySelectorAll('#correo-plantilla option')).filter(o => o.textContent === 'Recogida')[0].value);
await pagina.selectOption('#correo-plantilla', idRecogida);
await pagina.waitForTimeout(200);
await comprobar('otro asunto: nombre y fecha de ese asunto; el grupo, el de antes (se deshizo)', pagina.evaluate(() => {
  const t = document.getElementById('correo-cuerpo-texto').value;
  return [t.indexOf('Otra Ejemplo Ficticio') !== -1, t.indexOf('05/11/2026') !== -1, t.indexOf('2º ESO B') !== -1,
    t.split('Estimados tutores legales').length - 1, t.split('Francisco').length - 1];
}), [true, true, true, 1, 1]);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

console.log('--- cancelar ---');
await abrirCuadro(A1, 'Correo electrónico');
const antes = await pagina.evaluate(() => document.querySelectorAll('#correo-plantilla option').length);
await pagina.selectOption('#correo-plantilla', '');
await pagina.waitForTimeout(150);
await pagina.evaluate(() => { const c = document.getElementById('correo-cuerpo-texto'); c.value = c.value.replace('\n\n\n\n', '\n\nOtra frase distinta.\n\n'); });
const escrito2 = await pagina.locator('#correo-cuerpo-texto').inputValue();
await pagina.click('#correo-plantilla-desde-escrito');
await pagina.waitForSelector('#correo-plantilla-editor:not(.oculto) #pl2-nombre');
await pagina.click('#pl2-cancelar');
await pagina.waitForSelector('#correo-formulario:not(.oculto)');
await comprobar('cancelar: frase intacta y ninguna plantilla más', pagina.evaluate(() =>
  [document.getElementById('correo-cuerpo-texto').value, document.querySelectorAll('#correo-plantilla option').length]), [escrito2, antes]);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

await abrirCuadro(A1, 'Mensaje de Séneca');
await recorridoSeneca();
async function recorridoSeneca() {
  /* El saludo de Séneca es el mismo; la plantilla va al mismo sitio. */
  await recorrido('seneca', 'Recogida Séneca');
}
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await abrirCuadro(A1, 'Correo electrónico');
await comprobar('«Recogida Séneca» sale también en el desplegable de Correo', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#correo-plantilla option')).some(o => o.textContent === 'Recogida Séneca')), true);
await comprobar('la plantilla se guarda para el tipo, sin colgarla de ningún hito', pagina.evaluate(() => {
  const p = Plantillas.enMemoria().lista.filter(x => x.nombre === 'Recogida')[0];
  return [p.tipo, p.categoria, p.textoSeneca === undefined];
}), ['CONVALIDACION', 'ALUMNADO', true]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
