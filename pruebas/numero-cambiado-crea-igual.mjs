/* Prueba en navegador de verdad de la fila 275 de docs/COLA.md
   (docs/NUMERO-CAMBIADO-CREA-IGUAL.md):

   Si otro ordenador se queda el número que enseñaba la vista previa, el
   asunto (o el documento) se crea igual con el siguiente, en una sola
   pulsación, y el aviso verde lo dice. Antes se salía sin crear nada y
   cada pulsación gastaba otro número.

   1. Nuevo asunto, contador subido por fuera hasta el número de la vista
      previa: una pulsación crea la carpeta con N+1, la ficha lleva N+1,
      el aviso nombra N+1 y N y el contador queda en N+1.
   2. No queda ninguna carpeta con el número N.
   3. El asunto siguiente, sin tocar nada por fuera: N+2 y «Asunto creado.».
   4. Documento nuevo con el contador de documentos subido por fuera: una
      pulsación de «Guardar» deja el fichero con M+1, en la ficha, con el
      aviso largo y el contador en M+1.
   5. Sin cambio por fuera, guardar un documento sigue igual (el mismo
      fichero de origen conserva su número). */
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

const AA = String(new Date().getFullYear()).slice(2);
const A = (n) => 'A' + AA + '-' + String(n).padStart(4, '0');
const D = (n) => 'D' + AA + '-' + String(n).padStart(5, '0');

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

async function clicTipo(nombre) {
  const boton = pagina.getByRole('button', { name: nombre, exact: true });
  if (!(await boton.isVisible())) {
    const ver = pagina.locator('#btn-ver-tipos');
    if (await ver.isVisible() && /^Ver todos/.test((await ver.textContent()).trim())) await ver.click();
  }
  await boton.click();
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;2026;Matriculada;14/03/2013;600111222;tutor.marina@correo.es'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
/* Todos los avisos que salen, en orden. */
await pagina.evaluate(() => {
  window.__avisos = [];
  const o = U.aviso;
  U.aviso = function (m, t) { window.__avisos.push(String(m)); return o.apply(this, arguments); };
});

async function nuevoAsunto() {
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
  await clicTipo('MATRICULA');
  await pagina.fill('#buscar-tercero', 'marina');
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.fill('#campo-fecha', '2026-09-07');
  await pagina.waitForFunction(() => /^\d{6} A\d{2}-\d{4} /.test(document.getElementById('vista-nombre').textContent));
  return pagina.locator('#vista-nombre').textContent();
}
async function pulsarCrear() {
  await pagina.click('#btn-crear');
  await pagina.waitForTimeout(500);
  /* Puede salir «¿esto no lo hicimos ya?»: se crea igual. */
  if (await pagina.locator('#capa:not(.oculto)').count()) {
    const crear = pagina.locator('#capa button').filter({ hasText: /Crear/ }).first();
    if (await crear.count()) await crear.click();
  }
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 15000 });
}
const carpetas = () => pagina.evaluate(async () => {
  const n = []; for await (const p of window.__disco.abiertos.entries()) n.push(p[0]);
  return n.filter(x => x[0] !== '_' && /MATRICULA/.test(x)).sort();
});
const ultimoAviso = () => pagina.evaluate(() => window.__avisos.filter(a => /^Asunto creado|^Documento guardado/.test(a)).pop());
const contador = (clase) => pagina.evaluate(async (c) => {
  const j = (await Carpetas.leerJson(App.E.gestor, 'numeros.json')) || {};
  return (j[c] || {})[Numeros.anoDe()];
}, clase);
const subirPorFuera = (clase, n) => pagina.evaluate(async ([c, n]) => {
  const j = (await Carpetas.leerJson(App.E.gestor, 'numeros.json')) || { asuntos: {}, documentos: {} };
  j[c] = j[c] || {};
  j[c][Numeros.anoDe()] = n;
  await Carpetas.guardarJson(App.E.gestor, 'numeros.json', j);
}, [clase, n]);

console.log('--- 1. nuevo asunto con el número ya gastado por otro ordenador ---');
const vista1 = await nuevoAsunto();
await comprobar('la vista previa enseña el número 1', vista1.indexOf(A(1)) !== -1, true);
await subirPorFuera('asuntos', 1);
await pulsarCrear();
const NOMBRE_2 = vista1.replace(A(1), A(2));
await comprobar('una sola pulsación crea la carpeta con el número siguiente', await carpetas(), [NOMBRE_2]);
await comprobar('la ficha lleva el número siguiente', pagina.evaluate((n) => App.E.registro.asuntos[n].numero, NOMBRE_2), A(2));
await comprobar('el aviso verde nombra los dos números', ultimoAviso(),
  'Asunto creado como ' + A(2) + '; el ' + A(1) + ' lo acaba de usar otro ordenador.');
await comprobar('el contador queda en el número dado', contador('asuntos'), 2);
await comprobar('ya no se pide pulsar otra vez', pagina.evaluate(() => window.__avisos.some(a => /otra vez/.test(a))), false);

console.log('--- 2. ninguna carpeta con el número perdido ---');
await comprobar('no hay carpeta con el número 1', (await carpetas()).some(n => n.indexOf(A(1)) !== -1), false);

console.log('--- 3. el siguiente asunto sale sin salto ni aviso largo ---');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
const vista3 = await nuevoAsunto();
await comprobar('la vista previa enseña el número 3', vista3.indexOf(A(3)) !== -1, true);
await pulsarCrear();
await comprobar('se crea con el número 3', (await carpetas()).some(n => n.indexOf(A(3)) !== -1), true);
await comprobar('y el aviso es el corto', ultimoAviso(), 'Asunto creado.');
await comprobar('el contador queda en 3', contador('asuntos'), 3);

console.log('--- 4. documento con el número ya gastado por otro ordenador ---');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.locator('#inicio-tabla-cuerpo .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
const ASUNTO = await pagina.locator('.ficha-nombre-texto').textContent();
async function anadirDocumento(fecha, antesDeGuardar) {
  await pagina.click('.ficha-documentos-anadir');
  await pagina.waitForSelector('#doc-vista');
  await pagina.fill('#doc-fecha', fecha);
  await pagina.selectOption('#doc-tipo', 'SOLICITUD');
  await pagina.waitForTimeout(200);
  const vista = await pagina.locator('#doc-vista').textContent();
  if (antesDeGuardar) await antesDeGuardar();
  await pagina.click('#doc-guardar');
  await pagina.waitForSelector('#doc-cuerpo .fila-documento');
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForTimeout(300);
  return vista;
}
await pagina.waitForSelector('.ficha-documentos-anadir');
const ficheros = () => pagina.evaluate(async (a) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  const n = []; for await (const p of c.entries()) if (p[1].kind === 'file') n.push(p[0]);
  return n.sort();
}, ASUNTO);
const vistaDoc = await anadirDocumento('2026-09-07', () => subirPorFuera('documentos', 1));
await comprobar('la vista previa enseñaba el documento 1', vistaDoc, '260907 SOLICITUD ' + D(1) + '.pdf');
await comprobar('una sola pulsación guarda el fichero con el número siguiente', await ficheros(), ['260907 SOLICITUD ' + D(2) + '.pdf']);
await comprobar('la ficha lo tiene apuntado con ese número', pagina.evaluate(([a, d]) => !!App.E.registro.asuntos[a].documentos[d], [ASUNTO, D(2)]), true);
await comprobar('el aviso verde nombra los dos números', ultimoAviso(),
  'Documento guardado como ' + D(2) + '; el ' + D(1) + ' lo acaba de usar otro ordenador.');
await comprobar('el contador de documentos queda en 2', contador('documentos'), 2);
await comprobar('ya no se pide pulsar «Guardar» otra vez', pagina.evaluate(() => window.__avisos.some(a => /pulsa «Guardar»/.test(a))), false);

console.log('--- 5. documento sin cambio por fuera ---');
const vistaDoc2 = await anadirDocumento('2026-09-08');
/* El mismo fichero de origen lleva el mismo número (fila 239): el 2. */
await comprobar('la vista previa enseña el mismo número del fichero y se guarda con él', [vistaDoc2, (await ficheros()).length], ['260908 SOLICITUD ' + D(2) + '.pdf', 2]);
await comprobar('y el aviso es el de siempre', ultimoAviso(), 'Documento guardado en la carpeta.');

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
