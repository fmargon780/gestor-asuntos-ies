/* Prueba en navegador de verdad de "Nuevo asunto: la categoría guía el
   formulario" (fila 215, docs/NUEVO-ASUNTO-CATEGORIA-GUIA.md).

   1. Sin nada elegido: «Crear el asunto» está a la vista, en gris, y
      dice «Falta elegir la persona y el tipo de asunto»; la lista de
      tipos enseña solo los 8 más usados de todas las categorías, con
      «Ver todos».
   2. Pulsar la pastilla ALUMNADO: el cursor queda en el buscador de
      personas (justo debajo de las pastillas) y la lista de tipos solo
      tiene tipos de ALUMNADO, 8 como mucho, con «Ver todos (N)» que
      despliega el resto.
   3. Elegir un tipo cambia el texto del botón a «Falta elegir la
      persona»; elegir la persona lo activa y dice «Crear el asunto».
   4. Crear funciona.
   5. Con la persona primero, el botón dice «Falta elegir el tipo de
      asunto».
   6. Apagar la pastilla vuelve a «todas las categorías». */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'AAA COMPRA', categoria: 'EMPRESAS' },
  { tipo: 'AAB OBRAS', categoria: 'EMPRESAS' }
];
for (let i = 1; i <= 12; i++) TIPOS.push({ tipo: 'ALU ' + (i < 10 ? '0' : '') + i, categoria: 'ALUMNADO' });

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
await pagina.evaluate(async (tipos) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const regalum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'García López, Lucía;1150111;1º de E.S.O.;1º A;2026;Matriculada;10/02/2013;600111222;tutor1@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regalum));
}, TIPOS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const visibles = () => pagina.locator('#tipos-lista .tipo-boton:not(.oculto)');
const categoriasVisibles = () => pagina.locator('#tipos-lista .tipo-boton:not(.oculto)')
  .evaluateAll(bs => Array.from(new Set(bs.map(b => b.dataset.categoria))).sort());
const textoCrear = () => pagina.locator('#btn-crear').textContent().then(t => t.trim());

/* ---------- 1. sin nada elegido ---------- */
console.log('--- 1. sin nada elegido ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await comprobar('«Crear el asunto» está a la vista', pagina.locator('#btn-crear').isVisible(), true);
await comprobar('y en gris', pagina.locator('#btn-crear').isDisabled(), true);
await comprobar('dice qué falta', textoCrear(), 'Falta elegir la persona y el tipo de asunto');
await comprobar('solo 8 tipos de partida', visibles().count(), 8);
await comprobar('de las dos categorías', categoriasVisibles(), ['ALUMNADO', 'EMPRESAS']);
await comprobar('con «Ver todos (14)»', pagina.locator('#btn-ver-tipos').textContent().then(t => t.trim()), 'Ver todos (14)');

/* ---------- 2. la pastilla ALUMNADO ---------- */
console.log('--- 2. pulsar ALUMNADO ---');
await pagina.locator('.categoria-boton[data-categoria="ALUMNADO"]').click();
await comprobar('el cursor está en el buscador de personas',
  pagina.evaluate(() => document.activeElement && document.activeElement.id), 'buscar-tercero');
await comprobar('el buscador está justo debajo de las pastillas',
  pagina.evaluate(() => document.getElementById('categorias-lista').nextElementSibling.id), 'buscar-tercero');
await comprobar('la lista de tipos solo tiene ALUMNADO', categoriasVisibles(), ['ALUMNADO']);
await comprobar('como mucho 8', visibles().count(), 8);
await comprobar('con «Ver todos (12)»', pagina.locator('#btn-ver-tipos').textContent().then(t => t.trim()), 'Ver todos (12)');
await pagina.click('#btn-ver-tipos');
await comprobar('«Ver todos» despliega los 12', visibles().count(), 12);
await comprobar('y sigue siendo solo ALUMNADO', categoriasVisibles(), ['ALUMNADO']);
await pagina.click('#btn-ver-tipos');
await comprobar('se vuelve a plegar', visibles().count(), 8);

/* ---------- 3. tipo, luego persona ---------- */
console.log('--- 3. el botón cambia según lo que falta ---');
await pagina.getByRole('button', { name: 'ALU 01', exact: true }).click();
await comprobar('con tipo y sin persona', textoCrear(), 'Falta elegir la persona');
await comprobar('sigue en gris', pagina.locator('#btn-crear').isDisabled(), true);
await pagina.fill('#buscar-tercero', 'garcia');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').locator('div').first().click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('con las dos cosas se activa', pagina.locator('#btn-crear').isDisabled(), false);
await comprobar('y dice «Crear el asunto»', textoCrear(), 'Crear el asunto');

/* ---------- 4. crear ---------- */
console.log('--- 4. crear ---');
await pagina.fill('#campo-fecha', '2026-09-20');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('el asunto se ha creado',
  pagina.evaluate(() => App.E.registro && Object.keys(App.E.registro.asuntos)
    .some(n => n.indexOf('ALU 01') !== -1 && n.indexOf('García López') !== -1)), true);

/* ---------- 5. persona primero ---------- */
console.log('--- 5. persona primero ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await comprobar('al volver, otra vez en gris y diciendo qué falta', textoCrear(), 'Falta elegir la persona y el tipo de asunto');
await pagina.fill('#buscar-tercero', 'garcia');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').locator('div').first().click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('con persona y sin tipo', textoCrear(), 'Falta elegir el tipo de asunto');
await comprobar('la lista de tipos es la de su categoría', categoriasVisibles(), ['ALUMNADO']);
await pagina.click('#btn-cambiar-tercero');
await comprobar('al cambiar de persona vuelve a decir qué falta', textoCrear(), 'Falta elegir la persona y el tipo de asunto');

/* ---------- 6. apagar la pastilla ---------- */
console.log('--- 6. apagar la pastilla ---');
await pagina.locator('.categoria-boton[data-categoria="EMPRESAS"]').click();
await comprobar('EMPRESAS: solo sus 2 tipos', categoriasVisibles(), ['EMPRESAS']);
await comprobar('sin «Ver todos» (no sobra ninguno)', pagina.locator('#btn-ver-tipos').isHidden(), true);
await pagina.locator('.categoria-boton[data-categoria="EMPRESAS"]').click();
await comprobar('apagada, vuelven todas las categorías', categoriasVisibles(), ['ALUMNADO', 'EMPRESAS']);
await comprobar('otra vez 8 de partida', visibles().count(), 8);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
