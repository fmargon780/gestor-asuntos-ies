/* Prueba en navegador de verdad de docs/DESTINATARIOS-EN-SENECA.md
   (fila 47, 17-sep-2026), la parte que necesita el navegador de
   verdad y no se puede probar en pruebas/idea.mjs.

   Lo que tiene que pasar:
     - el desplegable "Añadir un grupo" sale también en el cuadro de
       Séneca (js/correo.js, js/seneca-destinatarios.js);
     - elegir un grupo pinta los chips de usuarios IdEA (con la
       arroba) y la línea de quien no tiene usuario;
     - "Copiar el siguiente" copia solo el primero que quede sin
       copiar, lo marca, y en la siguiente pulsación sigue con el que
       toca (avanza de uno en uno).

   El ayudante (js/seneca-ayudante.js) no se prueba aquí contra Séneca
   de verdad: eso está en pruebas/seneca-ayudante.mjs, sin navegador.

   Mismo disco de mentira que pruebas/grupos-navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const textoNavegador = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const inicioMarca = 'const preparacion = `';
const finMarca = '`;\n\nconst DIRECCION';
const preparacion = textoNavegador.slice(
  textoNavegador.indexOf(inicioMarca) + inicioMarca.length, textoNavegador.indexOf(finMarca));

const DIRECCION = process.env.DIRECCION || 'http://localhost:8123/index.html';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(DIRECCION);

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

/* Tres alumnos de 1º de E.S.O. A: dos con usuario IdEA, uno sin.
   Además, un miembro de personal (tercero del asunto, para no chocar
   con el alumnado del grupo) y un grupo guardado con los tres. */
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Usuario IdEA',
    'Aguilar Ponce, Marina;1140233;1º de E.S.O.;1º A;2026;Matriculada;14/03/2013;mag1',
    'Bermúdez Ortiz, Álvaro;1140501;1º de E.S.O.;1º A;2026;Matriculado;02/09/2014;balv1',
    'Cortés Ruiz, Carla;1140777;1º de E.S.O.;1º A;2026;Matriculada;09/05/2013;'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));

  const per = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Correo"',
    '"Aguado Ranea, Marcos Antonio","33357591R","Música P.E.S.","aguado@correo.es"'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', per));

  g._hijos.set('grupos.json', window.__disco.fich('grupos.json', JSON.stringify({
    grupos: [{
      id: 'g-seneca', nombre: 'Grupo de Séneca',
      miembros: [
        { categoria: 'ALUMNADO', nombre: 'Aguilar Ponce, Marina 1140233' },
        { categoria: 'ALUMNADO', nombre: 'Bermúdez Ortiz, Álvaro 1140501' },
        { categoria: 'ALUMNADO', nombre: 'Cortés Ruiz, Carla 1140777' }
      ],
      creadoPor: 'Francisco', creadoEl: '2026-09-17T09:00:00'
    }]
  })));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

console.log('--- abrir un asunto y entrar en "Mensaje Séneca" ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(2)');   /* PERSONAL */
await pagina.getByRole('button', { name: 'PERMISO', exact: true }).click();
await pagina.fill('#buscar-tercero', 'aguado');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-17');
await pagina.click('#btn-crear');
/* Fila 119: crear abre la ficha del asunto; se vuelve a la lista. */
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');

/* "Mensaje Séneca" vive ahora dentro de "Comunicar" (18-sep-2026, fila 52,
   docs/CABECERA-DEL-ASUNTO.md). */
await pagina.getByRole('button', { name: 'Comunicar', exact: true }).click();
await pagina.getByRole('button', { name: 'Mensaje de Séneca', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#seneca-destinatarios', { state: 'attached' });

await comprobar('el desplegable "Añadir un grupo" sale en el cuadro de Séneca',
  pagina.locator('#seneca-grupo').count(), 1);
await comprobar('trae el grupo guardado como opción',
  pagina.locator('#seneca-grupo option', { hasText: 'Grupo de Séneca' }).count(), 1);

console.log('--- elegir el grupo pinta los chips y la línea de sin usuario ---');
await pagina.selectOption('#seneca-grupo', { label: 'Grupo de Séneca' });
await pagina.waitForSelector('#seneca-destinatarios .marcado-chip');
await comprobar('los dos que tienen usuario IdEA salen en chips, con la arroba delante',
  pagina.locator('#seneca-destinatarios .marcado-chip').allTextContents()
    .then(ts => ts.map(t => t.replace('×', '').trim()).sort()),
  ['@balv1', '@mag1'].sort());
await comprobar('la que no tiene usuario IdEA sale aparte, en la línea de sin usuario',
  pagina.locator('#seneca-destinatarios .aviso-en-linea').textContent()
    .then(t => t.trim()),
  '1 no tiene usuario IdEA: Cortés Ruiz, Carla 1140777');

console.log('--- "Copiar el siguiente" avanza de uno en uno ---');
await pagina.click('#seneca-copiar-siguiente');
await pagina.waitForTimeout(150);
await comprobar('el primer clic copia al primero de la lista (mag1, el orden del grupo)',
  pagina.evaluate(() => navigator.clipboard.readText()), '@mag1');
await comprobar('ese chip queda marcado como ya copiado',
  pagina.locator('#seneca-destinatarios .marcado-chip-copiado').count(), 1);

await pagina.click('#seneca-copiar-siguiente');
await pagina.waitForTimeout(150);
await comprobar('el segundo clic copia al siguiente que quedaba sin copiar (balv1)',
  pagina.evaluate(() => navigator.clipboard.readText()), '@balv1');
await comprobar('ahora los dos chips quedan marcados',
  pagina.locator('#seneca-destinatarios .marcado-chip-copiado').count(), 2);

await pagina.click('#seneca-copiar-siguiente');
await pagina.waitForTimeout(150);
await comprobar('con los dos ya copiados, el tercer clic no cambia el portapapeles y avisa',
  pagina.evaluate(() => navigator.clipboard.readText()), '@balv1');
await comprobar('el aviso dice que ya están todos copiados',
  pagina.locator('#mensajes .mensaje.bueno').last().textContent(), 'Ya se han copiado todos.');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
