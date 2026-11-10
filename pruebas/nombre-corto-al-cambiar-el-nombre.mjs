/* Prueba en navegador de la fila 606 (docs/606-NOMBRE-CORTO-AL-CAMBIAR-EL-NOMBRE.md): al cambiar el nombre de un tipo
   que tiene nombre corto, el cuadro enseña su casilla, la valida como Ajustes, y las carpetas abiertas del tipo
   llevan lo que toque sin recortarse mal. Datos inventados; el disco es el de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import { abrirHito, verLaLista } from './apoyo/hito.mjs';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));


const TIPOS = [
  { tipo: 'CERTIFICADO DE TUTORIA DE PRUEBA', nombreCorto: 'TUTORIA PRUEBA', categoria: 'PERSONAL' },
  { tipo: 'AYUDA DE COMEDOR LARGA', nombreCorto: 'COMEDOR', categoria: 'ALUMNADO' },
  { tipo: 'SIN CORTO PARA PROBAR', categoria: 'ALUMNADO' },
  { tipo: 'OTRO CON CORTO', nombreCorto: 'USADO YA', categoria: 'ALUMNADO' }
];
const A1 = '260920 TUTORIA PRUEBA Uno, Ana 1150001';
const A2 = '260920 A26-0137 COMEDOR Dos, Eva 1150002';
const A3 = '260920 AYUDA DE COMEDOR LARGA Tres, Luis 1150003';   /* lleva el largo aunque el tipo tenga corto */
const A4 = '260920 SIN CORTO PARA PROBAR Cuatro, Pau 1150004';
const ASUNTOS = [[A1, 'PERSONAL', 'CERTIFICADO DE TUTORIA DE PRUEBA'], [A2, 'ALUMNADO', 'AYUDA DE COMEDOR LARGA'],
  [A3, 'ALUMNADO', 'AYUDA DE COMEDOR LARGA'], [A4, 'ALUMNADO', 'SIN CORTO PARA PROBAR']];

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
await pagina.evaluate(async ([tipos, asuntos]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('tipos.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(tipos)); await w.close();
  for (const [n] of asuntos) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [TIPOS, ASUNTOS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (asuntos) => {
  for (const [n, categoria, tipo] of asuntos) await App.anotar(n, { abiertoEl: U.ahora(), tipo, categoria, tercero: '', campos: {} });
  await App.verAbiertos();
}, ASUNTOS);

const carpetas = () => pagina.evaluate(() => App.E.listaAbiertos.map(a => a.nombre).filter(n => / (Uno|Dos|Tres|Cuatro), /.test(n)).sort());
const tipoDe = (largo) => pagina.evaluate((l) => { const t = App.E.tipos.filter(x => x.tipo === l)[0]; return t ? [t.tipo, t.nombreCorto || '', (t.alias || []).slice()] : null; }, largo);
async function abrir(largo) {
  await pagina.evaluate((l) => { App.renombrarTipo(App.E.tipos.filter(t => t.tipo === l)[0]); }, largo);
  await pagina.waitForSelector('#tipo-nuevo-nombre');
}
async function terminar() {
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForFunction(() => Array.prototype.some.call(document.querySelectorAll('.mensaje'),
    (m) => /Tipo renombrado|Nombre corto cambiado/.test(m.textContent)), null, { timeout: 15000 });
  await pagina.waitForTimeout(400);
}

console.log('--- 1. la casilla sale solo si el tipo tiene nombre corto ---');
await abrir('CERTIFICADO DE TUTORIA DE PRUEBA');
await comprobar('1. con corto: sale su casilla con el corto de hoy', pagina.locator('#tipo-nuevo-corto').inputValue(), 'TUTORIA PRUEBA');
await pagina.click('#cuadro-cancelar');
await abrir('SIN CORTO PARA PROBAR');
await comprobar('1. sin corto: no sale', pagina.locator('#tipo-nuevo-corto').count(), 0);
await pagina.click('#cuadro-cancelar');

console.log('--- 2. las comprobaciones, como en Ajustes ---');
await abrir('CERTIFICADO DE TUTORIA DE PRUEBA');
await pagina.fill('#tipo-nuevo-corto', 'usado ya');
await comprobar('2. el corto de otro tipo se avisa en vivo', pagina.locator('#tipo-nuevo-corto-aviso').textContent(), 'Ya lo usa otro tipo: no puede repetirse.');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#tipo-nuevo-motivo');
await comprobar('2. no deja guardar: el cuadro vuelve con el motivo y lo escrito',
  [await pagina.locator('#tipo-nuevo-motivo').textContent(), await pagina.locator('#tipo-nuevo-corto').inputValue()],
  ['Ya lo usa otro tipo: no puede repetirse.', 'usado ya']);
/* (el campo lleva maxlength 25: se pega por programa, como un texto largo pegado) */
await pagina.evaluate(() => { document.getElementById('tipo-nuevo-corto').value = 'A'.repeat(26); });
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => /máximo es 25|pasar de 25/.test(document.getElementById('cuadro-cuerpo').textContent));
await comprobar('2. más de 25 caracteres: tampoco', (await pagina.locator('#tipo-nuevo-motivo').textContent()).indexOf('25') !== -1, true);
await comprobar('2. no ha cambiado nada', [await carpetas(), await tipoDe('CERTIFICADO DE TUTORIA DE PRUEBA')],
  [[A3, A1, A2, A4].sort(), ['CERTIFICADO DE TUTORIA DE PRUEBA', 'TUTORIA PRUEBA', []]]);

console.log('--- 3. cambiando nombre y corto: la carpeta lleva el corto nuevo y el resto igual ---');
await pagina.fill('#tipo-nuevo-nombre', 'certificado de tutoria nuevo');
await pagina.fill('#tipo-nuevo-corto', 'tutoria nueva');
await terminar();
await comprobar('3. la carpeta', carpetas(), [A3, '260920 TUTORIA NUEVA Uno, Ana 1150001', A2, A4].sort());
await comprobar('3. el tipo guardado: largo, corto y alias (el corto viejo también)',
  tipoDe('CERTIFICADO DE TUTORIA NUEVO'), ['CERTIFICADO DE TUTORIA NUEVO', 'TUTORIA NUEVA', ['CERTIFICADO DE TUTORIA DE PRUEBA', 'TUTORIA PRUEBA']]);
await comprobar('3. la ficha del asunto sigue con su carpeta nueva',
  pagina.evaluate(() => !!App.E.registro.asuntos['260920 TUTORIA NUEVA Uno, Ana 1150001'] && !App.E.registro.asuntos['260920 TUTORIA PRUEBA Uno, Ana 1150001']), true);

console.log('--- 4. vaciando el corto: la carpeta lleva el largo nuevo (con número, y aunque llevara el largo) ---');
await abrir('AYUDA DE COMEDOR LARGA');
await pagina.fill('#tipo-nuevo-nombre', 'ayuda de comedor nueva');
await pagina.fill('#tipo-nuevo-corto', '');
await terminar();
await comprobar('4. las dos carpetas', carpetas(), [
  '260920 TUTORIA NUEVA Uno, Ana 1150001', '260920 A26-0137 AYUDA DE COMEDOR NUEVA Dos, Eva 1150002',
  '260920 AYUDA DE COMEDOR NUEVA Tres, Luis 1150003', A4].sort());
await comprobar('4. sin corto, y el corto viejo es alias', tipoDe('AYUDA DE COMEDOR NUEVA'),
  ['AYUDA DE COMEDOR NUEVA', '', ['AYUDA DE COMEDOR LARGA', 'COMEDOR']]);

console.log('--- 5. solo el corto: se guarda y se renombran las carpetas ---');
await abrir('CERTIFICADO DE TUTORIA NUEVO');
await pagina.fill('#tipo-nuevo-corto', 'tutoria 2');
await terminar();
await comprobar('5. la carpeta', carpetas(), [
  '260920 TUTORIA 2 Uno, Ana 1150001', '260920 A26-0137 AYUDA DE COMEDOR NUEVA Dos, Eva 1150002',
  '260920 AYUDA DE COMEDOR NUEVA Tres, Luis 1150003', A4].sort());
await comprobar('5. el nombre largo no cambia', (await tipoDe('CERTIFICADO DE TUTORIA NUEVO'))[0], 'CERTIFICADO DE TUTORIA NUEVO');

console.log('--- 6. un tipo sin corto cambia de nombre como siempre ---');
await abrir('SIN CORTO PARA PROBAR');
await pagina.fill('#tipo-nuevo-nombre', 'sin corto cambiado');
await terminar();
await comprobar('6. la carpeta', pagina.evaluate(() => App.E.listaAbiertos.map(a => a.nombre).filter(n => /Cuatro/.test(n))), ['260920 SIN CORTO CAMBIADO Cuatro, Pau 1150004']);
await comprobar('6. sigue sin corto', (await tipoDe('SIN CORTO CAMBIADO'))[1], '');

console.log('--- 7. Ajustes enseña lo guardado y valida igual ---');
await pagina.evaluate(() => {
  const t = App.E.tipos.filter(x => x.tipo === 'CERTIFICADO DE TUTORIA NUEVO')[0];
  window.__ver = [t.nombreCorto, TiposNombre.problemaDelCorto('USADO YA', t), TiposNombre.problemaDelCorto('X'.repeat(26), t), TiposNombre.problemaDelCorto('NUEVO', t)];
});
await comprobar('7. corto guardado y comprobaciones comunes', pagina.evaluate(() => window.__ver),
  ['TUTORIA 2', 'Ya lo usa otro tipo: no puede repetirse.', 'El nombre corto no puede pasar de 25 caracteres.', '']);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
