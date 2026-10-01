/* Prueba de la fila 231 (docs/CREAR-ASUNTO-DESDE-POR-CLASIFICAR.md): tras
   «Cancelar» (abajo, arriba a la derecha) o «← Volver», la siguiente entrada
   a «Nuevo asunto» sale siempre con pastillas, buscador de personas y
   parrilla de tipos, venga de un documento suelto o de la barra. */
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

const CAMPOS = {
  propios: [{ id: 'cp1', nombre: 'Campo de prueba', clase: 'texto' }],
  porTipo: { 'ALU 01': [{ origen: 'propio', id: 'cp1' }] }
};

const ALUMNOS = [
  ['Uno Prueba, Ana', '1150001'],
  ['Dos Prueba, Bea', '1150002'],
  ['Tres Prueba, Cris', '1150003'],
  ['Cuatro Prueba, Dora', '1150004']
];

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
await pagina.evaluate(async ([tipos, campos, alumnos]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  g._hijos.set('campos.json', window.__disco.fich('campos.json', JSON.stringify(campos)));
  g._hijos.set('tablon.json', window.__disco.fich('tablon.json',
    JSON.stringify({ notas: [{ id: 'n1', texto: 'Aviso: revisar ayudas de comedor', color: 'amarillo' }] })));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const filas = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor'
  ];
  alumnos.forEach(([nombre, id]) => {
    filas.push([nombre, id, '1º de E.S.O.', '1º A', '2026', 'Matriculada', '10/02/2013', '600000000', 'tutor@ejemplo.es'].join(';'));
  });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', filas.join('\r\n') + '\r\n'));
}, [TIPOS, CAMPOS, ALUMNOS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');


const textoCrear = () => pagina.locator('#btn-crear').textContent().then(t => t.trim());
async function partesVisibles(etiqueta) {
  for (const id of ['categorias-lista', 'buscar-tercero', 'tipos-lista', 'btn-crear']) {
    await comprobar(etiqueta + ': se ve #' + id, pagina.locator('#' + id).isVisible(), true);
  }
  await comprobar(etiqueta + ': la parrilla tiene tipos',
    pagina.locator('#tipos-lista .tipo-boton').count().then(n => n > 0), true);
}
const entrarDesdeSuelto = () => pagina.evaluate(() => {
  App.E.pendiente = { nombre: 'Factura.pdf' };
  App.nuevoAsuntoCon({ fecha: null });
});
async function nuevoDesdeBarra() {
  await pagina.click('.pestana[data-pantalla="abiertos"]');
  await pagina.click('#btn-nuevo-asunto');
}
const salidas = {
  'Cancelar de abajo': () => pagina.locator('#pantalla-nuevo .botones-formulario .boton', { hasText: 'Cancelar' }).click(),
  'Cancelar de arriba': () => pagina.locator('#pantalla-nuevo .cabecera .acciones .boton', { hasText: 'Cancelar' }).click(),
  '← Volver': () => pagina.locator('#pantalla-nuevo .boton-volver').click()
};
for (const [nombre, salir] of Object.entries(salidas)) {
  for (let i = 1; i <= 3; i++) {
    await entrarDesdeSuelto();
    await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
    await partesVisibles(nombre + ' (vuelta ' + i + ') desde suelto');
    await comprobar(nombre + ' (vuelta ' + i + '): el cuadro ámbar sigue', pagina.locator('#aviso-pendiente').isVisible(), true);
    await salir();
    await pagina.waitForSelector('#pantalla-nuevo', { state: 'hidden' });
  }
  await nuevoDesdeBarra();
  await partesVisibles(nombre + ': desde la barra tras cancelar');
  await salidas[nombre]();
  await pagina.waitForSelector('#pantalla-nuevo', { state: 'hidden' });
}

await entrarDesdeSuelto();
await pagina.locator('#pantalla-nuevo .cabecera .acciones .boton', { hasText: 'Cancelar' }).click();
await entrarDesdeSuelto();
await partesVisibles('tras cancelar, de nuevo');
await pagina.fill('#buscar-tercero', 'Uno Prueba');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').first().click();
await pagina.getByRole('button', { name: 'ALU 01', exact: true }).click();
await comprobar('elegir persona y tipo activa «Crear el asunto»', pagina.locator('#btn-crear').isDisabled(), false);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('el asunto se crea de principio a fin',
  pagina.evaluate(() => App.E.registro && Object.keys(App.E.registro.asuntos).some((x) => x.indexOf('ALU 01') !== -1)), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
