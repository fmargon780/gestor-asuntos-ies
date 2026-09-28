/* Prueba en navegador de verdad de la fila 220
   (docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md): el mismo formulario de
   "Nuevo asunto", preparado desde cero, entre desde donde entre.

   Recorre varias de las entradas de la lista del punto 1 del
   documento, alternando entre ellas y dejando cada vez el formulario
   "sucio" (tipo, tercero, campos propios y descripción escritos a
   mano) antes de pasar a la siguiente, para comprobar que ninguna
   arrastra nada de la anterior. En todas: las pastillas de categoría
   están encima del buscador de personas, la pastilla filtra la
   parrilla de tipos (y manda siempre, aunque hubiera un tercero de
   otra categoría), "Crear el asunto" está a la vista, y se puede crear
   el asunto de principio a fin.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

/* ---------- utilidades ---------- */

const textoCrear = () => pagina.locator('#btn-crear').textContent().then(t => t.trim());
const categoriasVisibles = () => pagina.locator('#tipos-lista .tipo-boton:not(.oculto)')
  .evaluateAll(bs => Array.from(new Set(bs.map(b => b.dataset.categoria))).sort());

async function comprobarInvariantes(etiqueta) {
  await comprobar(etiqueta + ': las pastillas están encima del buscador de personas',
    pagina.evaluate(() => document.getElementById('categorias-lista').nextElementSibling.id), 'buscar-tercero');
  await comprobar(etiqueta + ': «Crear el asunto» está a la vista',
    pagina.locator('#btn-crear').isVisible(), true);
  await comprobar(etiqueta + ': no llevan lo escrito de la visita anterior (basura)',
    pagina.locator('#campo-descripcion').inputValue().then(t => t.indexOf('BASURA') === -1), true);
  await comprobar(etiqueta + ': el campo propio de la visita anterior no se ve',
    pagina.locator('#bloque-campos').isHidden(), true);
}

/* Pulsar la pastilla EMPRESAS filtra la parrilla, mande lo que mande
   (tercero u otra pastilla) de antes: la pastilla siempre gana. */
async function comprobarPastillaManda(etiqueta) {
  await pagina.click('.categoria-boton[data-categoria="EMPRESAS"]');
  await comprobar(etiqueta + ': la pastilla EMPRESAS filtra la parrilla (manda siempre)',
    categoriasVisibles(), ['EMPRESAS']);
  await comprobar(etiqueta + ': y el buscador de personas tiene el foco',
    pagina.evaluate(() => document.activeElement && document.activeElement.id), 'buscar-tercero');
}

/* Deja el formulario "sucio": categoría, tipo, tercero y un texto
   largo escrito a mano, sin llegar a crear nada. Se usa antes de cada
   entrada siguiente, para comprobar que no se cuela en la próxima. */
async function dejarSucio() {
  await pagina.click('.pestana[data-pantalla="abiertos"]');
  await pagina.waitForSelector('#btn-nuevo-asunto');
  await pagina.click('#btn-nuevo-asunto');
  await pagina.waitForSelector('#tipos-lista .tipo-boton');
  await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
  await pagina.getByRole('button', { name: 'ALU 01', exact: true }).click();
  await pagina.fill('#buscar-tercero', 'Uno Prueba');
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.locator('#resultados-tercero .resultado').first().click();
  await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
  await pagina.waitForSelector('#campos-lista-nuevo .campo');
  await pagina.fill('#campo-descripcion', 'BASURA DE LA VISITA ANTERIOR, no debería verse nunca más');
  await pagina.fill('#campos-lista-nuevo .campo', 'BASURA en el campo propio');
}

async function crearYComprobar(etiqueta, nombreEsperadoContiene) {
  await comprobar(etiqueta + ': con todo elegido, «Crear el asunto» se activa',
    pagina.locator('#btn-crear').isDisabled(), false);
  await pagina.click('#btn-crear');
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await comprobar(etiqueta + ': el asunto se ha creado de principio a fin',
    pagina.evaluate((n) => App.E.registro && Object.keys(App.E.registro.asuntos).some((x) => x.indexOf(n) !== -1),
      nombreEsperadoContiene), true);
}

/* ================================================================
   1) y 2) alternando dos veces entre el botón de la barra y
      "+ Nuevo asunto para esta persona" (archivo-personas.js).
   ================================================================ */
console.log('--- 1ª vez: botón de la barra ---');
await pagina.click('#btn-nuevo-asunto');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await comprobarInvariantes('barra (1ª)');
await comprobar('barra (1ª): 8 más usados + «Ver todos»',
  pagina.locator('#tipos-lista .tipo-boton:not(.oculto)').count(), 8);
await comprobar('barra (1ª): con «Ver todos (N)»', pagina.locator('#btn-ver-tipos').isVisible(), true);
await comprobarPastillaManda('barra (1ª)');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'ALU 02', exact: true }).click();
await pagina.fill('#buscar-tercero', 'Uno Prueba');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').first().click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await crearYComprobar('barra (1ª)', 'ALU 02');

console.log('--- se ensucia el formulario antes de la siguiente entrada ---');
await dejarSucio();

console.log('--- 1ª vez: "+ Nuevo asunto para esta persona" ---');
await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.fill('#buscar-personas', 'Dos Prueba');
await pagina.waitForSelector('#lista-personas .resultado');
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#nuevo-asunto-persona');
await pagina.click('#nuevo-asunto-persona');
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
await comprobarInvariantes('+persona (1ª)');
await comprobar('+persona (1ª): llega con la categoría de esa persona ya elegida',
  pagina.locator('.categoria-boton[data-categoria="ALUMNADO"]').evaluate(el => el.classList.contains('elegido')), true);
await comprobar('+persona (1ª): y esa persona esperando a que se elija el tipo (no la de la basura)',
  pagina.locator('#tercero-propuesto-nuevo').textContent().then(t => t.indexOf('Dos Prueba') !== -1), true);
await comprobarPastillaManda('+persona (1ª)');
/* Al pulsar EMPRESAS se ha olvidado la persona propuesta (era de
   ALUMNADO): se vuelve a poner ALUMNADO para terminar de crear. */
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.fill('#buscar-tercero', 'Dos Prueba');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').first().click();
await pagina.getByRole('button', { name: 'ALU 03', exact: true }).click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await crearYComprobar('+persona (1ª)', 'ALU 03');

console.log('--- se ensucia otra vez ---');
await dejarSucio();

console.log('--- 2ª vez: botón de la barra ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('#btn-nuevo-asunto');
await pagina.click('#btn-nuevo-asunto');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await comprobarInvariantes('barra (2ª)');
await comprobar('barra (2ª): sin pastilla, todas las categorías', categoriasVisibles(), ['ALUMNADO', 'EMPRESAS']);
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'ALU 04', exact: true }).click();
await pagina.fill('#buscar-tercero', 'Tres Prueba');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').first().click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await crearYComprobar('barra (2ª)', 'ALU 04');

console.log('--- se ensucia otra vez ---');
await dejarSucio();

console.log('--- 2ª vez: "+ Nuevo asunto para esta persona" ---');
await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.fill('#buscar-personas', 'Cuatro Prueba');
await pagina.waitForSelector('#lista-personas .resultado');
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#nuevo-asunto-persona');
await pagina.click('#nuevo-asunto-persona');
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
await comprobarInvariantes('+persona (2ª)');
await comprobar('+persona (2ª): la persona esperando es la de ahora',
  pagina.locator('#tercero-propuesto-nuevo').textContent().then(t => t.indexOf('Cuatro Prueba') !== -1), true);
await pagina.getByRole('button', { name: 'ALU 05', exact: true }).click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await crearYComprobar('+persona (2ª)', 'ALU 05');

/* ================================================================
   3) el tablón: una nota que "al final era un asunto" (A asunto).
   ================================================================ */
console.log('--- se ensucia antes del tablón ---');
await dejarSucio();

console.log('--- entrada: el tablón, "A asunto" ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('.tablon-fila-compacta[data-nota="n1"]');
await pagina.click('.tablon-fila-compacta[data-nota="n1"] .fila-menu-btn');
await pagina.getByRole('button', { name: 'A asunto' }).click();
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
await comprobarInvariantes('tablón');
await comprobar('tablón: la descripción trae el texto de la nota',
  pagina.locator('#campo-descripcion').inputValue(), 'Aviso revisar ayudas de comedor');
await comprobar('tablón: sin nada elegido todavía (ni lo de la visita sucia)',
  pagina.locator('#tercero-elegido').isHidden(), true);
await comprobarPastillaManda('tablón');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'ALU 06', exact: true }).click();
await pagina.fill('#buscar-tercero', 'Uno Prueba');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').first().click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await crearYComprobar('tablón', 'ALU 06');

/* ================================================================
   4) la propuesta de la bandeja de correos y "Crear asunto con él"
      (documentos sueltos) comparten el mismo camino que "+ Nuevo
      asunto para esta persona": App.nuevoAsuntoCon. Se comprueba aquí
      llamándolo tal cual lo hacen js/bandeja-propuesta.js y
      js/documentos-sueltos.js, con un tercero real ya cargado.
   ================================================================ */
console.log('--- se ensucia antes de la propuesta de correo/documento ---');
await dejarSucio();

console.log('--- entrada: App.nuevoAsuntoCon (bandeja de correo / documento suelto) ---');
await pagina.evaluate(async () => {
  const fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const p = fuente.lista.find((x) => x.nombre.indexOf('Tres Prueba') !== -1);
  App.nuevoAsuntoCon({ tercero: p, tipo: 'ALU 07', descripcion: 'Del correo', viaInicial: { via: 'CORREO', viaDato: 'x@y.es' } });
});
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
await comprobarInvariantes('correo/documento');
await comprobar('correo/documento: llega con su propia descripción, no la basura',
  pagina.locator('#campo-descripcion').inputValue(), 'Del correo');
await comprobar('correo/documento: con tipo y tercero ya puestos, se puede crear',
  pagina.locator('#btn-crear').isDisabled(), false);
await crearYComprobar('correo/documento', 'ALU 07');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
