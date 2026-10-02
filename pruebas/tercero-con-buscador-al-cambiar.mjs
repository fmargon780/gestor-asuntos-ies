/* Prueba en navegador de verdad de la fila 219
   (docs/TERCERO-CON-BUSCADOR-AL-CAMBIAR.md): en «Cambiar el asunto», el
   tercero se elige con el buscador de «Nuevo asunto» (todas las
   categorías a la vez, sin pastillas), nunca con texto libre.

   1. Al abrir el cuadro, el tercero actual sale ya elegido (texto tal
      cual, aunque no encaje con nadie de las listas de hoy); guardar
      sin tocarlo deja el nombre de la carpeta igual.
   2. Escribir dos letras trae personas de varias categorías; al pulsar
      una, la vista previa cambia con el formato correcto y, al
      guardar, la carpeta se renombra.
   3. Buscar sin pulsar ningún resultado, y guardar: el tercero no
      cambia (no hay forma de guardar un tercero escrito a mano).
   4. Si no aparece nadie, «Dar de alta» la crea y la deja elegida en
      el mismo cuadro, sin perder lo ya cambiado (la descripción); al
      terminar, «Nuevo asunto» sigue en blanco.
   5. Elegir un tercero de otra categoría que el tipo enseña el aviso
      ámbar junto al tipo, y aun así deja guardar.
   6. Con un organismo de Administraciones sale el selector de
      departamento; con otra categoría, no. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'EXPEDIENTE', categoria: 'ALUMNADO' },
  { tipo: 'COMPRA', categoria: 'EMPRESAS' }
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
await pagina.evaluate(async (tipos) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  const d = await g.getDirectoryHandle('datos', { create: true });

  const regalum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'García López, Lucía;1150111;1º de E.S.O.;1º A;2026;Matriculada;10/02/2013;600111222;tutor1@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regalum));

  const personal = [
    'Nombre;Documento;Puesto;Teléfono;Correo',
    'García Núñez, Pedro;87654321B;Conserje;600333444;pedro@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('personal.csv', window.__disco.fich('personal.csv', personal));
}, TIPOS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

/* Un organismo de Administraciones, con un departamento (punto 6). */
const admIds = await pagina.evaluate(async () => {
  const A = window.Administraciones;
  const del = await A.alta(App.E.datos, { clase: 'organismo', corto: 'Delegación Educación Málaga',
    oficial: 'Delegación Territorial de Pruebas en Málaga', correo: 'delegacion@ejemplo.es' });
  const dep = await A.anadirDepartamento(App.E.datos, del.id, null,
    { nombre: 'Sección de Escolarización', correo: 'escolarizacion@ejemplo.es' });
  return { del: del.id, dep: dep.id };
});

/* Un asunto de EXPEDIENTE (ALUMNADO), con un tercero de texto suelto
   que no encaja con nadie de las listas de hoy (punto 1). */
const NOMBRE = '260901 EXPEDIENTE Texto Antiguo Sin Persona 0000000';
await pagina.evaluate(async (nombre) => {
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  await App.anotar(nombre, { abiertoEl: U.ahora(), tipo: 'EXPEDIENTE', categoria: 'ALUMNADO',
                             tercero: 'Texto Antiguo Sin Persona 0000000', curso: '', grupo: '',
                             descripcion: '', campos: {} });
  await App.verAbiertos();
}, NOMBRE);

/* Abre «Cambiar el asunto» de `nombre` y espera a que el cuadro esté listo. */
async function abrirEditar(nombre) {
  await pagina.evaluate((nombre) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === nombre)[0];
    window.__editando = App.editarAsunto(a);
  }, nombre);
  await pagina.waitForSelector('#capa:not(.oculto) #ed-tipo-cambiar');
}
function terminaEditar() { return pagina.evaluate(() => window.__editando); }
function nombresAbiertos() {
  return pagina.evaluate(() => App.E.listaAbiertos.map(a => a.nombre));
}

/* ================================================================
   1. El tercero actual sale ya elegido; guardar sin tocarlo no cambia nada.
   ================================================================ */
console.log('--- 1. el tercero actual, ya elegido; sin tocarlo, no cambia ---');

await abrirEditar(NOMBRE);
await comprobar('1. sale el texto de siempre, como "elegido"',
  pagina.locator('#ed-tercero-caja .elegido strong').textContent(), 'Texto Antiguo Sin Persona 0000000');
await pagina.click('#cuadro-aceptar');
await terminaEditar();
await comprobar('1. la carpeta sigue llamándose igual', nombresAbiertos(), [NOMBRE]);

/* ================================================================
   2. Buscar en varias categorías, elegir una, y guardar renombra.
   ================================================================ */
console.log('--- 2. buscar, elegir, y la carpeta se renombra ---');

await abrirEditar(NOMBRE);
await pagina.click('#ed-tercero-cambiar');
await pagina.fill('#ed-tercero-buscar', 'garcia');
await pagina.waitForSelector('#ed-tercero-resultados .resultado');
await pagina.waitForTimeout(200);
const textosResultado = () => pagina.locator('#ed-tercero-resultados .resultado').allTextContents();
const textos = await textosResultado();
await comprobar('2. salen las dos personas, de dos categorías',
  [textos.some(t => t.indexOf('García López') !== -1 && /alumnado/i.test(t)),
   textos.some(t => t.indexOf('García Núñez') !== -1 && /personal/i.test(t))],
  [true, true]);

await pagina.locator('#ed-tercero-resultados .resultado', { hasText: 'García López' })
  .locator('div').first().click();
await pagina.waitForSelector('#ed-tercero-caja .elegido');
await comprobar('2. queda elegida, con su categoría',
  pagina.locator('#ed-tercero-caja .elegido').textContent().then(t =>
    t.indexOf('García López') !== -1 && /alumnado/i.test(t)), true);
await pagina.waitForTimeout(200);
await comprobar('2. la vista previa lleva su nombre',
  pagina.locator('#ed-vista').textContent().then(t => t.indexOf('García López') !== -1), true);
await comprobar('2. sin aviso de categoría (EXPEDIENTE es de ALUMNADO, igual que ella)',
  pagina.locator('#ed-aviso-categoria').isHidden(), true);

await pagina.click('#cuadro-aceptar');
await terminaEditar();
const abiertos2 = await nombresAbiertos();
const NOMBRE2 = abiertos2.find(n => n.indexOf('García López') !== -1);
await comprobar('2. la carpeta se ha renombrado con su nombre', !!NOMBRE2, true);
await comprobar('2. y ya no queda la de antes', abiertos2.indexOf(NOMBRE), -1);

/* ================================================================
   3. Buscar sin elegir, y guardar: no hay forma de guardar texto libre.
   ================================================================ */
console.log('--- 3. buscar sin elegir a nadie: el tercero no cambia ---');

await abrirEditar(NOMBRE2);
await pagina.click('#ed-tercero-cambiar');
await pagina.fill('#ed-tercero-buscar', 'un texto que no se elige');
await pagina.waitForTimeout(250);
await pagina.click('#cuadro-aceptar');
await terminaEditar();
const abiertos3 = await nombresAbiertos();
await comprobar('3. la carpeta sigue con el nombre de la persona elegida antes',
  abiertos3.indexOf(NOMBRE2) !== -1, true);
await comprobar('3. "un texto que no se elige" no ha entrado en ningún nombre',
  abiertos3.some(n => n.indexOf('un texto que no se elige') !== -1), false);

/* ================================================================
   4. Dar de alta a quien no aparece: queda elegida en el mismo
   cuadro, sin perder lo ya cambiado, y "Nuevo asunto" sigue en blanco.
   ================================================================ */
console.log('--- 4. dar de alta, sin perder lo ya cambiado ---');

await abrirEditar(NOMBRE2);
await pagina.fill('#ed-descripcion', 'urgente');
await pagina.click('#ed-tercero-cambiar');
await pagina.fill('#ed-tercero-buscar', 'Zapata Nueva, Sonia');
await pagina.waitForSelector('#ed-tercero-resultados .vacio');
await comprobar('4. nadie con ese nombre', pagina.locator('#ed-tercero-resultados .vacio').textContent(),
  'Nadie con ese nombre en ninguna categoría.');

await pagina.getByRole('button', { name: '+ Dar de alta un solicitante', exact: true }).click();
await pagina.waitForSelector('#cuadro-titulo:has-text("Dar de alta un solicitante")');
await pagina.click('#cuadro-aceptar');   /* el nombre ya viene relleno con lo buscado */

/* El cuadro «Cambiar el asunto» se vuelve a abrir solo, con la recién
   creada ya elegida. */
await pagina.waitForSelector('#capa:not(.oculto) #ed-tipo-cambiar');
await comprobar('4. la recién creada queda elegida en el mismo cuadro',
  pagina.locator('#ed-tercero-caja .elegido').textContent().then(t => t.indexOf('Zapata Nueva, Sonia') !== -1), true);
await comprobar('4. lo ya cambiado (la descripción) no se ha perdido',
  pagina.locator('#ed-descripcion').inputValue(), 'urgente');

await pagina.click('#cuadro-aceptar');
await terminaEditar();
const abiertos4 = await nombresAbiertos();
const NOMBRE4 = abiertos4.find(n => n.indexOf('Zapata Nueva') !== -1);
await comprobar('4. la carpeta lleva la recién creada y la descripción', !!NOMBRE4 && NOMBRE4.indexOf('urgente') !== -1, true);

await pagina.click('.pestana[data-pantalla="nuevo"]');
await comprobar('4. «Nuevo asunto» sigue en blanco', pagina.evaluate(() =>
  ({ buscar: document.getElementById('buscar-tercero').value,
     elegidoOculto: document.getElementById('tercero-elegido').classList.contains('oculto') })),
  { buscar: '', elegidoOculto: true });
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* ================================================================
   5 y 6. Elegir un tercero de otra categoría (aviso ámbar, deja
   guardar) y, si es de Administraciones, el selector de departamento.
   ================================================================ */
console.log('--- 5 y 6. aviso de categoría, y el departamento de Administraciones ---');

const NOMBRE5 = '260902 COMPRA Suministros De Antes SL B00000000';
await pagina.evaluate(async (nombre) => {
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  await App.anotar(nombre, { abiertoEl: U.ahora(), tipo: 'COMPRA', categoria: 'EMPRESAS',
                             tercero: 'Suministros De Antes SL B00000000', curso: '', grupo: '',
                             descripcion: '', campos: {} });
  await App.verAbiertos();
}, NOMBRE5);

await abrirEditar(NOMBRE5);
await comprobar('5. sin tocar el tercero, no hay departamento (COMPRA no es de Administraciones)',
  pagina.locator('#ed-departamento-caja select').count(), 0);

await pagina.click('#ed-tercero-cambiar');
await pagina.fill('#ed-tercero-buscar', 'garcia lopez');
await pagina.waitForSelector('#ed-tercero-resultados .resultado');
await pagina.locator('#ed-tercero-resultados .resultado', { hasText: 'García López' })
  .locator('div').first().click();
await pagina.waitForSelector('#ed-tercero-caja .elegido');
await pagina.waitForTimeout(200);
await comprobar('5. aviso ámbar: el tipo es de Empresas y ella es de Alumnado',
  pagina.locator('#ed-aviso-categoria').textContent().then(t =>
    /Empresas/.test(t) && /Alumnado/.test(t) && /Cambia el tipo/.test(t)), true);
await comprobar('6. con ella (Alumnado), sigue sin desplegable de departamento',
  pagina.locator('#ed-departamento-caja select').count(), 0);

await pagina.click('#ed-tercero-cambiar');
await pagina.fill('#ed-tercero-buscar', 'Delegación Educación');
await pagina.waitForSelector('#ed-tercero-resultados .resultado');
await pagina.locator('#ed-tercero-resultados .resultado', { hasText: 'Delegación Educación Málaga' }).click();
await pagina.waitForSelector('#ed-tercero-caja .elegido');
await pagina.waitForTimeout(200);
await comprobar('6. con el organismo, sale el desplegable con su departamento',
  pagina.locator('#ed-departamento-caja select#ed-departamento option').allTextContents(),
  ['Sin departamento', 'Sección de Escolarización']);
await comprobar('5. sigue el aviso ámbar (Empresas / Administraciones), y deja guardar',
  pagina.locator('#ed-aviso-categoria').textContent().then(t => /Administraciones/.test(t)), true);

await pagina.selectOption('#ed-departamento', { label: 'Sección de Escolarización' });
await pagina.click('#cuadro-aceptar');
await terminaEditar();
const abiertos6 = await nombresAbiertos();
const NOMBRE6 = abiertos6.find(n => n.indexOf('Delegación Educación Málaga') !== -1);
await comprobar('6. se ha podido guardar con el aviso puesto', !!NOMBRE6, true);
await comprobar('6. el departamento elegido queda guardado en la ficha', pagina.evaluate((n) =>
  App.E.registro.asuntos[n].departamento && App.E.registro.asuntos[n].departamento.nombre, NOMBRE6),
  'Sección de Escolarización');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
