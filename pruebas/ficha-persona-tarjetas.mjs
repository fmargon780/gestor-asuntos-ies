/* Prueba en navegador de «La ficha de una persona, en tarjetas» (fila 252,
   docs/FICHA-DE-PERSONA-EN-TARJETAS.md). Todo INVENTADO: un matriculado con
   tutores, materias, historia y procedencia; un apartado desconocido; un
   antiguo; y un personal. Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

const BD = {
  acuerdo: 2, generado: '2099-09-20T08:00:00+02:00', origen: 'bd-alumnado-ies', cursoAcademico: '2026-2027',
  campos: [
    { clave: 'curso', etiqueta: 'Curso', apartado: 'Matrícula', tipo: 'texto' },
    { clave: 'materias', etiqueta: 'Materias matriculadas', apartado: 'Materias', tipo: 'tabla',
      columnas: [{ clave: 'materia', etiqueta: 'Materia' }, { clave: 'situacion', etiqueta: 'Situación' }] },
    { clave: 'repite', etiqueta: 'Repeticiones', apartado: 'Historia', tipo: 'texto' },
    { clave: 'centroProcedencia', etiqueta: 'Centro de procedencia', apartado: 'Procedencia', tipo: 'texto' },
    { clave: 'neae', etiqueta: 'NEAE', apartado: 'Apoyos', tipo: 'texto' },
    { clave: 'lugarNac', etiqueta: 'Lugar de nacimiento', apartado: 'Identidad', tipo: 'texto' },
    { clave: 'rareza', etiqueta: 'Marca rara', apartado: 'Apartado nuevo', tipo: 'texto' }
  ],
  alumnos: [
    { idEscolar: '9990001', matriculado: true, datos: { curso: '1º ESO', repite: '1 vez', centroProcedencia: 'CEIP Inventado Uno', neae: 'Sí',
      lugarNac: 'Villa Inventada', rareza: 'violeta',
      materias: [{ materia: 'Lengua inventada', situacion: 'Matriculada' }, { materia: 'Mates inventadas', situacion: 'Matriculada' }] } }
  ]
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (bd) => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono;Domicilio;Nombre Primer tutor;Primer apellido Primer tutor;Teléfono Primer tutor;Observaciones',
    'Primera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014;600000001;Calle Inventada 1;Rosa;Modelo;600000002;Sin observaciones raras',
    'Antiguo, Pablo;9990002;4º de E.S.O.;4º ESO A;2025;Matriculado;05/06/2010;600000003;Calle Inventada 2;;;;'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
  d._hijos.set('ALUMNADO-BD.json', window.__disco.fich('ALUMNADO-BD.json', JSON.stringify(bd)));
}, BD);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2200);

await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.selectOption('#filtro-personas', 'ALUMNADO');
await pagina.fill('#buscar-personas', 'primera');
await pagina.waitForSelector('#lista-personas [data-persona]');
await pagina.locator('#lista-personas [data-persona]').filter({ hasText: 'Primera' }).first().click();
await pagina.waitForSelector('#ficha-persona .fp-tarjeta');

console.log('--- 1 y 2. cabecera y tarjetas ---');
await comprobar('la cabecera lleva nombre, grupo, estado, Nº escolar y los botones',
  pagina.evaluate(() => {
    const c = document.querySelector('#ficha-persona .vt-cabecera');
    const t = c.textContent;
    return [t.indexOf('Lucía') !== -1, t.indexOf('1º ESO C') !== -1, t.indexOf('Matriculado') !== -1, t.indexOf('9990001') !== -1,
      !!c.querySelector('#nuevo-asunto-persona')];
  }), [true, true, true, true, true]);
await comprobar('las tarjetas, en orden, y las sin datos no salen',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-persona .fp-tarjeta')).map(t => t.dataset.tarjeta)),
  ['familia', 'asuntos', 'matricula', 'materias', 'trayectoria', 'procedencia', 'datos', 'otros']);
await comprobar('Familia y Sus asuntos abiertas; las demás cerradas',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-persona .fp-tarjeta')).map(t => t.open)),
  [true, true, false, false, false, false, false, false]);
await comprobar('cada título lleva su resumen',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-persona .fp-tarjeta')).map(t => t.querySelector('.fp-resumen').textContent.length > 0)),
  [true, true, true, true, true, true, true, true]);
await comprobar('Familia: resumen con la tutora y su teléfono',
  pagina.locator('#ficha-persona [data-tarjeta="familia"] .fp-resumen').textContent().then(t => t.indexOf('600 000 002') !== -1), true);
await comprobar('Materias: «2 materias» y la tabla',
  pagina.evaluate(() => [document.querySelector('[data-tarjeta="materias"] .fp-resumen').textContent,
    document.querySelectorAll('[data-tarjeta="materias"] .bd-tabla tbody tr').length]), ['2 materias', 2]);
await comprobar('la fecha de los datos al pie de la tarjeta de la base de datos',
  pagina.locator('[data-tarjeta="materias"] .nota').textContent(), 'Datos de la base de datos de alumnado del 20-09-2099');

console.log('--- 3. dos columnas con ancho; sin barra horizontal ---');
await comprobar('dos columnas', pagina.evaluate(() => getComputedStyle(document.querySelector('#ficha-persona .fp-tarjetas')).gridTemplateColumns.split(' ').length), 2);
await comprobar('sin barra horizontal', pagina.evaluate(() => { const f = document.getElementById('ficha-persona'); return f.scrollWidth <= f.clientWidth + 1; }), true);

console.log('--- 5. ningún dato dos veces; el apartado desconocido, en Otros ---');
await comprobar('«Curso» sale una sola vez en toda la ficha',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-persona .ficha-dato > span:first-child')).filter(s => s.textContent === 'Curso').length), 1);
await comprobar('«Marca rara» (apartado nuevo) y las observaciones, en «Otros datos del fichero»',
  pagina.evaluate(() => { const t = document.querySelector('[data-tarjeta="otros"]').textContent; return [t.indexOf('Marca rara') !== -1, t.indexOf('Observaciones') !== -1]; }),
  [true, true]);
await comprobar('Datos personales lleva el domicilio, el nacimiento y el lugar',
  pagina.evaluate(() => { const t = document.querySelector('[data-tarjeta="datos"]').textContent; return [t.indexOf('Calle Inventada 1') !== -1, t.indexOf('04/03/2014') !== -1, t.indexOf('Villa Inventada') !== -1]; }),
  [true, true, true]);

console.log('--- 6. se recuerda lo abierto, por categoría ---');
await pagina.locator('[data-tarjeta="trayectoria"] > summary').click();
await pagina.locator('[data-tarjeta="asuntos"] > summary').click();
await pagina.reload();
await pagina.waitForSelector('#aplicacion:not(.oculto)', { state: 'attached' }).catch(() => {});
await comprobar('la clave guardada recuerda las dos cosas', pagina.evaluate(() => JSON.parse(localStorage.getItem('gestor.fichaPersona.abiertas')).ALUMNADO),
  { trayectoria: true, asuntos: false });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
