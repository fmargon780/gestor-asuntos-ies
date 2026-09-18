/* Prueba en navegador de verdad de docs/GRUPOS-DE-PERSONAS.md (fila 21,
   17-sep-2026): lo que de verdad necesita el navegador y no se puede
   probar en pruebas/grupos.mjs.

   Lo que tiene que pasar:
     - un grupo guardado con un miembro que ya no está en las listas lo
       conserva al abrir "Ver y cambiar los miembros" (se ve, no
       desaparece solo);
     - señalar en el buscador de "varios" no se pierde al cambiar de
       categoría ni de búsqueda;
     - "Meter un grupo entero" en Relacionados añade de golpe a todo el
       grupo a un asunto;
     - "Añadir un grupo" en Correo mete los correos del grupo en Copia
       oculta, y avisa aparte de quien no tiene.

   Mismo disco de mentira que pruebas/relacionados.mjs. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const textoNavegador = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const inicioMarca = 'const preparacion = `';
const finMarca = '`;\n\nconst DIRECCION';
const preparacion = textoNavegador.slice(
  textoNavegador.indexOf(inicioMarca) + inicioMarca.length, textoNavegador.indexOf(finMarca));

const DIRECCION = process.env.DIRECCION || 'http://localhost:8123/index.html';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
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

/* Datos de sobra: dos alumnos de 1º de E.S.O. A (matriculados este
   curso) y un miembro de personal con correo. Además, ANTES de entrar,
   se deja ya un grupo en _GESTOR/grupos.json con un miembro que no
   está en ningún CSV: así se comprueba que Grupos.cargar lo respeta
   igual (nunca se pierde un miembro solo). */
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Correo del tutor',
    'Aguilar Ponce, Marina;1140233;1º de E.S.O.;1º A;2026;Matriculada;14/03/2013;tutor.marina@correo.es',
    'Bermúdez Ortiz, Álvaro;1140501;1º de E.S.O.;1º A;2026;Matriculado;02/09/2014;tutor.alvaro@correo.es'
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
      id: 'g-prueba', nombre: 'Grupo de prueba',
      miembros: [
        { categoria: 'ALUMNADO', nombre: 'Aguilar Ponce, Marina 1140233' },
        { categoria: 'ALUMNADO', nombre: 'Quintero Vidal, Ya No Está 9999' }
      ],
      creadoPor: 'Francisco', creadoEl: '2026-09-16T09:00:00'
    }]
  })));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

console.log('--- el grupo, con su miembro que ya no está, se ve en Ajustes ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
/* 17-sep-2026, fila 39: "Grupos de personas" vive en la pestaña "El
   centro". */
await pagina.evaluate(() => App.cambiarPestanaAjustes('centro'));
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#tabla-grupos-personas .tarjeta-tipo');
await comprobar('el grupo sale con sus 2 miembros contados',
  pagina.locator('#tabla-grupos-personas .tarjeta-tipo-linea').first().textContent()
    .then(t => t.replace(/\s+/g, ' ').trim()),
  'Grupo de prueba · 2 personas');

console.log('--- "Ver y cambiar los miembros": el que ya no está se ve y se puede quitar ---');
await pagina.click('#tabla-grupos-personas .tarjeta-tipo button');
await pagina.getByRole('button', { name: 'Ver y cambiar los miembros' }).click();
await pagina.waitForSelector('#grupo-picker .marcados-lista');
await comprobar('los dos miembros salen en la barra, aunque uno no esté en ningún CSV',
  pagina.locator('#grupo-picker .marcado-chip').allTextContents()
    .then(ts => ts.map(t => t.replace('×', '').trim()).sort()),
  ['Aguilar Ponce, Marina 1140233', 'Quintero Vidal, Ya No Está 9999'].sort());
await pagina.waitForSelector('#grupo-picker .marcado-chip-perdido');
await comprobar('el que ya no está en ningún CSV se marca aparte, en gris',
  pagina.locator('#grupo-picker .marcado-chip-perdido').textContent()
    .then(t => t.replace('×', '').trim()),
  'Quintero Vidal, Ya No Está 9999');

/* Escenario 5: señalar en una categoría y buscar/cambiar no pierde lo
   ya señalado. Se añade a Bermúdez (ALUMNADO) y luego, cambiando a
   PERSONAL y buscando otra cosa, se comprueba que Marina y el
   perdido siguen en la barra. */
await pagina.click('.categoria-mini-boton:has-text("ALUMNADO")');
await pagina.fill('#rel-buscar', 'bermudez');
await pagina.waitForSelector('#rel-resultados .resultado-marcable');
await pagina.click('#rel-resultados .resultado-marcable input[type="checkbox"]');
await pagina.waitForTimeout(150);
await comprobar('con Bermúdez señalado van ya 3',
  pagina.locator('#grupo-picker .marcados-cuenta').textContent(), '3 señalados');

await pagina.click('.categoria-mini-boton:has-text("PERSONAL")');
await pagina.fill('#rel-buscar', 'aguado');
await pagina.waitForSelector('#rel-resultados .resultado-marcable');
await comprobar('al cambiar de categoría y de búsqueda, los 3 anteriores no se pierden',
  pagina.locator('#grupo-picker .marcados-cuenta').textContent(), '3 señalados');

/* Se quita al que ya no está (la ×), y se deja tal cual el resto. */
await pagina.evaluate(() => {
  const chip = Array.from(document.querySelectorAll('#grupo-picker .marcado-chip'))
    .find(c => c.textContent.indexOf('Ya No Está') !== -1);
  chip.querySelector('.marcado-quitar').click();
});
await comprobar('quitar al que ya no está deja 2 señalados',
  pagina.locator('#grupo-picker .marcados-cuenta').textContent(), '2 señalados');

await pagina.click('#grupo-picker .marcados-cabecera .boton-principal');
await pagina.waitForTimeout(300);
await comprobar('los miembros del grupo se han guardado sin el que ya no estaba',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('grupos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    return j.grupos[0].miembros.map(m => m.nombre).sort();
  }),
  ['Aguilar Ponce, Marina 1140233', 'Bermúdez Ortiz, Álvaro 1140501'].sort());

console.log('--- "Meter un grupo entero" en Relacionados ---');
async function crearAsunto(categoriaIndice, botonTipo, buscarTexto) {
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.click('#categorias-lista .categoria-boton:nth-child(' + categoriaIndice + ')');
  await pagina.getByRole('button', { name: botonTipo, exact: true }).click();
  await pagina.fill('#buscar-tercero', buscarTexto);
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.fill('#campo-fecha', '2026-09-17');
  await pagina.click('#btn-crear');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
}
/* El tercero principal es de PERSONAL (Aguado Ranea), para no chocar
   con los miembros del grupo, que son de ALUMNADO. */
await crearAsunto(2, 'PERMISO', 'aguado');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
/* "Personas y entidades relacionadas" vive plegada (fila 51,
   18-sep-2026, docs/FICHA-DISPOSICION.md). */
await pagina.click('#ficha-plegable-relacionados > summary');
await pagina.waitForSelector('#rel-anadir-varios');

await pagina.click('#rel-anadir-varios');
await pagina.waitForSelector('#rel-grupo-fila select');
await pagina.selectOption('#rel-grupo-elegir', { label: 'Grupo de prueba (2)' });
await pagina.waitForTimeout(150);
await comprobar('elegir el grupo entero señala a sus 2 miembros',
  pagina.locator('#rel-picker .marcados-cuenta').textContent(), '2 señalados');
await pagina.click('#rel-picker .marcados-cabecera .boton-principal');
await pagina.waitForTimeout(300);
await comprobar('los dos miembros del grupo quedan relacionados con el asunto', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const clave = Object.keys(j.asuntos).find(k => k.indexOf('PERMISO') !== -1);
  return (j.asuntos[clave].relacionados || []).map(r => r.nombre).sort();
}), ['Aguilar Ponce, Marina 1140233', 'Bermúdez Ortiz, Álvaro 1140501'].sort());

console.log('--- "Añadir un grupo" en Correo mete los correos en Copia oculta ---');
/* "Correo" vive ahora dentro de "Comunicar" (18-sep-2026, fila 52,
   docs/CABECERA-DEL-ASUNTO.md). */
await pagina.getByRole('button', { name: 'Comunicar', exact: true }).click();
await pagina.getByRole('button', { name: 'Correo electrónico', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#correo-grupo');
await pagina.selectOption('#correo-grupo', { label: 'Grupo de prueba' });
await pagina.waitForTimeout(200);
await comprobar('los dos correos del grupo entran en Copia oculta, sin repetidos',
  pagina.locator('#correo-cco-caja .marcado-chip').allTextContents()
    .then(ts => ts.map(t => t.replace('×', '').trim()).sort()),
  ['tutor.alvaro@correo.es', 'tutor.marina@correo.es'].sort());

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
