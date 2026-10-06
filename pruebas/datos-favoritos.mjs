/* Prueba en navegador de verdad de la fila 272 de docs/COLA.md
   (docs/DATOS-FAVORITOS-EN-LA-FICHA.md): hasta 3 datos del tercero junto
   al nombre del asunto, y el cuadro «Elegir datos».

   Datos inventados: dos alumnas matriculadas (una con la nacionalidad
   rellena y otra no), un alumno que no está matriculado este curso y una
   empresa. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
const ASUNTOS = {
  marina: '260907 A26-0001 MATRICULA Aguilar Ponce, Marina 1140233',
  ana: '260907 A26-0002 MATRICULA Cano Inventada, Ana 1141000',
  luis: '260907 A26-0003 MATRICULA Baja Inventado, Luis 1140999',
  empresa: '260907 A26-0004 FACTURA Suministros Inventados, SL'
};
await pagina.evaluate(async (ASUNTOS) => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Nacionalidad',
    'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;2026;Matriculada;14/03/2013;600111222;',
    'Cano Inventada, Ana;1141000;3º de E.S.O.;3º C;2026;Matriculada;02/05/2012;600333444;Española',
    'Baja Inventado, Luis;1140999;1º de E.S.O.;1º A;2025;Matriculada;01/01/2014;600555666;Francesa'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv',
    'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo\r\nSuministros Inventados, SL;Suministros del Sur;B12345674;Pedro;955000111;info@suministros.invalid\r\n'));
  for (const n of Object.values(ASUNTOS)) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, ASUNTOS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (ASUNTOS) => {
  const f = (n, tipo, cat, ter) => App.anotar(n, { abiertoEl: U.ahora(), tipo, categoria: cat, tercero: ter, curso: '', grupo: '', descripcion: '', campos: {}, estado: 'abierto' });
  await f(ASUNTOS.marina, 'MATRICULA', 'ALUMNADO', 'Aguilar Ponce, Marina 1140233');
  await f(ASUNTOS.ana, 'MATRICULA', 'ALUMNADO', 'Cano Inventada, Ana 1141000');
  await f(ASUNTOS.luis, 'MATRICULA', 'ALUMNADO', 'Baja Inventado, Luis 1140999');
  await f(ASUNTOS.empresa, 'FACTURA', 'EMPRESAS', 'Suministros Inventados, SL');
  await App.verAbiertos();
}, ASUNTOS);

async function abrir(clave, modo) {
  await pagina.evaluate(([n, modo]) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === n)[0];
    App.abrirFicha(a, modo || 'abierto');
  }, [ASUNTOS[clave], modo]);
  await pagina.waitForSelector('#fav-elegir');
  await pagina.waitForTimeout(500);
}
const datos = () => pagina.locator('#ficha-favoritos-datos').innerText().then(t => t.replace(/\s+/g, ' ').trim());
async function abrirCuadro() {
  await pagina.click('#fav-elegir');
  await pagina.waitForSelector('#fav-lista input');
  await pagina.waitForTimeout(100);
}
const marcadas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#fav-lista input:checked')).map(c => c.dataset.clave));
async function marcar(clave) { await pagina.locator('#fav-lista input[data-clave="' + clave + '"]').click(); }

console.log('--- 1 a 3. lo que se ve en la cabecera ---');
await abrir('marina');
await comprobar('1. alumna matriculada: «Unidad: 2º B»', datos(), 'Unidad: 2º B');
await comprobar('1. el botón «Elegir datos» sale detrás', pagina.locator('#fav-elegir').innerText(), 'Elegir datos');
await comprobar('1. a la derecha del nombre y a la izquierda de «Archivar»', pagina.evaluate(() => {
  const n = document.querySelector('.ficha-nombre').getBoundingClientRect();
  const f = document.getElementById('ficha-favoritos').getBoundingClientRect();
  const ar = document.getElementById('ficha-archivar').getBoundingClientRect();
  return [f.left >= n.right - 1, f.right <= ar.left + 1, f.top < n.bottom];
}), [true, true, true]);
await abrir('luis');
await comprobar('2. alumno no matriculado: ni «Unidad» ni hueco, solo el botón', [await datos(), await pagina.locator('#fav-elegir').isVisible()], ['', true]);
await abrir('empresa');
await comprobar('3. empresa sin elegir nada: solo el botón', [await datos(), await pagina.locator('#fav-elegir').isVisible()], ['', true]);

console.log('--- 4 y 5. el cuadro ---');
await abrir('marina');
await abrirCuadro();
await comprobar('4. título y línea de ayuda', pagina.evaluate(() => [
  document.getElementById('cuadro-titulo').textContent,
  /^Marca hasta 3\. Se verán junto al nombre en todos los asuntos de alumnado, en todos los ordenadores del centro\.$/.test(document.querySelector('#cuadro-cuerpo .explica').textContent)
]), ['Elegir datos · Alumnado', true]);
await comprobar('4. «Unidad» marcada, la primera, con «2º B» en gris', pagina.evaluate(() => {
  const f = document.querySelector('#fav-lista .fav-fila');
  return [f.querySelector('input').checked, f.querySelector('.fav-fila-nombre').textContent, f.querySelector('.fav-fila-valor').textContent];
}), [true, 'Unidad', '— 2º B']);
await comprobar('5. ni nombre ni apellidos en la lista', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#fav-lista .fav-fila-nombre')).some(e => /^(nombre|apellidos?|alumno\/a)$/i.test(e.textContent.trim()))), false);
await comprobar('5. sí hay datos que esta alumna tiene vacíos («Nacionalidad»)', pagina.evaluate(() => {
  const f = Array.from(document.querySelectorAll('#fav-lista .fav-fila')).filter(l => l.querySelector('.fav-fila-nombre').textContent === 'Nacionalidad')[0];
  return !!f && !f.querySelector('.fav-fila-valor');
}), true);

await pagina.click('#cuadro-cancelar');

console.log('--- 6 a 8. elegir, máximo 3, cancelar (con la otra alumna) ---');
await abrir('ana');
await abrirCuadro();
await marcar('nacionalidad');
await marcar('telefono del tutor');
await comprobar('7. con 3 marcados, las demás apagadas y «Máximo 3»', pagina.evaluate(() => [
  Array.from(document.querySelectorAll('#fav-lista input:not(:checked)')).every(c => c.disabled),
  !document.getElementById('fav-maximo').classList.contains('oculto')
]), [true, true]);
await marcar('nacionalidad');
await comprobar('7. al desmarcar una, se encienden', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#fav-lista input:not(:checked)')).every(c => !c.disabled)), true);
await pagina.click('#cuadro-cancelar');
await comprobar('8. «Cancelar» no cambia nada', datos(), 'Unidad: 3º C');
await abrirCuadro();
await marcar('nacionalidad');
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(200);
await comprobar('8. Escape tampoco', [await datos(), await pagina.locator('#capa.oculto').count()], ['Unidad: 3º C', 1]);
await abrirCuadro();
await marcar('telefono del tutor');
await marcar('nacionalidad');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('6. «Guardar»: los tres, en el orden marcado, con su nombre delante', datos(),
  'Unidad: 3º C · Teléfono del tutor: 600333444 · Nacionalidad: Española');

console.log('--- 9. otro asunto de alumnado ---');
await abrir('marina');
await comprobar('9. los mismos datos, con los valores de esa alumna (sin lo que no tiene)', datos(), 'Unidad: 2º B · Teléfono del tutor: 600111222');

console.log('--- 10. la empresa no se mezcla ---');
await abrir('empresa');
await comprobar('10. la empresa sigue sin datos', datos(), '');
await abrirCuadro();
await comprobar('10. sin «Unidad» en su lista, con «NIF»', pagina.evaluate(() => {
  const n = Array.from(document.querySelectorAll('#fav-lista .fav-fila-nombre')).map(e => e.textContent);
  return [n.indexOf('Unidad') === -1, n.indexOf('NIF') !== -1];
}), [true, true]);
await marcar('nif');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('10. «NIF» sale en la empresa', datos(), 'NIF: B12345674');
await abrir('marina');
await comprobar('10. y no en el alumnado', (await datos()).indexOf('NIF') === -1, true);

console.log('--- 11 y 12. se guarda en _GESTOR ---');
await comprobar('11. el disco lleva lo elegido', pagina.evaluate(async () => {
  const r = await App.leerRegistroDelDisco();
  return r.ajustesAvisos.datosFavoritos;
}), { ALUMNADO: ['unidad', 'telefono del tutor', 'nacionalidad'], EMPRESAS: ['nif'] });
await abrirCuadro();
for (const k of ['unidad', 'telefono del tutor']) await marcar(k);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('12. quitadas dos, queda la tercera (Marina no tiene nacionalidad: solo el botón)', [await datos(), await pagina.locator('#fav-elegir').isVisible()], ['', true]);
await comprobar('12. (se quita «Unidad» y «Teléfono»: queda «Nacionalidad») y el disco lo guarda', pagina.evaluate(async () => {
  const r = await App.leerRegistroDelDisco();
  return [r.ajustesAvisos.datosFavoritos.ALUMNADO, r.ajustesAvisos.datosFavoritos.EMPRESAS];
}), [['nacionalidad'], ['nif']]);
await abrir('ana');
await comprobar('12. y tras volver a abrir (otra vez desde el disco)', pagina.evaluate(async () => {
  App.E.registro = await App.leerRegistroDelDisco();
  return DatosFavoritos.elegidos('ALUMNADO');
}), ['nacionalidad']);

console.log('--- 13. cabecera encogida ---');
await abrir('ana');
await comprobar('13. el botón se esconde y los datos siguen', pagina.evaluate(() => {
  document.querySelector('.ficha-cabecera').classList.add('encogida');
  const b = document.getElementById('fav-elegir');
  const d = document.getElementById('ficha-favoritos-datos');
  const r = [getComputedStyle(b).display === 'none', d.textContent.indexOf('Nacionalidad: Española') !== -1,
    getComputedStyle(d).whiteSpace === 'nowrap'];
  document.querySelector('.ficha-cabecera').classList.remove('encogida');
  return r;
}), [true, true, true]);

console.log('--- 14. en el ARCHIVO ---');
await abrir('ana', 'archivado');
await comprobar('14. se ven los datos y el botón funciona', [await datos(), await pagina.locator('#fav-elegir').isEnabled()], ['Nacionalidad: Española', true]);

console.log('--- 15. modo consulta ---');
await abrir('ana');
await comprobar('15. con el compañero dentro, los datos se ven y el botón está apagado', pagina.evaluate(() => {
  FichaNucleo.ocupacionActual = { usuario: 'Otra Persona' };
  FichaNucleo.aplicarModoConsulta();
  const r = [document.getElementById('fav-elegir').disabled, document.getElementById('ficha-favoritos-datos').textContent.length > 0];
  FichaNucleo.ocupacionActual = null;
  FichaNucleo.aplicarModoConsulta();
  return r;
}), [true, true]);

console.log('--- 16. otras pantallas ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(300);
await comprobar('16. la tabla de Inicio no enseña estos datos', pagina.evaluate(() =>
  /Nacionalidad:|Unidad:/.test(document.getElementById('pantalla-abiertos').innerText)), false);

console.log('--- 17. pantalla estrecha (1280 px) ---');
await pagina.setViewportSize({ width: 1280, height: 900 });
await abrir('ana');
await comprobar('17. el bloque no se tapa con «Archivar» ni con el nombre', pagina.evaluate(() => {
  const n = document.querySelector('.ficha-nombre').getBoundingClientRect();
  const f = document.getElementById('ficha-favoritos').getBoundingClientRect();
  const ar = document.getElementById('ficha-archivar').getBoundingClientRect();
  const sinTaparNombre = f.left >= n.right - 1 || f.top >= n.bottom - 1;
  const sinTaparArchivar = f.right <= ar.left + 1 || f.top >= ar.bottom - 1 || ar.top >= f.bottom - 1 ? true : false;
  return [sinTaparNombre, sinTaparArchivar, document.documentElement.scrollWidth <= window.innerWidth];
}), [true, true, true]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
