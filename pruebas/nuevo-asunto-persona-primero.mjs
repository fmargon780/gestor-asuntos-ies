/* Prueba en navegador de verdad de "Nuevo asunto empieza por la
   persona" (fila 197, docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md).

   1. Escribir "garcia" en el buscador único trae resultados de más de
      una categoría (ALUMNADO y PERSONAL), cada uno con su etiqueta; en
      ALUMNADO, la matriculada sale antes que la antigua.
   2. Elegir la alumna limita la parrilla de tipos a los de ALUMNADO.
   3. Pulsar un tipo con guía enseña el resumen en una línea, pulsable:
      despliega y pliega la guía entera.
   4. "Crear el asunto" abre directamente la mesa del hito 1.
   5. El camino inverso (tipo primero, sin persona) también crea, y
      deja el buscador filtrado a la categoría del tipo elegido. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'CERTIFICADO', categoria: 'ALUMNADO' },
  { tipo: 'COMPRA', categoria: 'EMPRESAS' }
];
const GUIAS = {
  CERTIFICADO: [
    { id: 'c1', titulo: 'Primer paso', cuerpo: '', opciones: [], guion: [] },
    { id: 'c2', titulo: 'Segundo paso', cuerpo: '', opciones: [], guion: [] }
  ]
};

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

/* ---------- arranque, con datos de partida ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([tipos, guias]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  g._hijos.set('guias.json', window.__disco.fich('guias.json', JSON.stringify(guias)));
  const d = await g.getDirectoryHandle('datos', { create: true });

  const regalum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'García López, Lucía;1150111;1º de E.S.O.;1º A;2026;Matriculada;10/02/2013;600111222;tutor1@ejemplo.es',
    'García Ruiz, Marta;1150112;4º de E.S.O.;4º D;2024;Matriculada;10/02/2011;600111223;tutor2@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regalum));

  const personal = [
    'Nombre;Documento;Puesto;Teléfono;Correo',
    'García Núñez, Pedro;87654321B;Conserje;600333444;pedro@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('personal.csv', window.__disco.fich('personal.csv', personal));

  const empresas = [
    'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo',
    'Suministros Bermejo SL;;B12345678;;600555666;info@bermejo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv', empresas));
}, [TIPOS, GUIAS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================================================================
   1. El buscador único, con resultados de varias categorías.
   ================================================================ */
console.log('--- 1. "garcia" trae ALUMNADO y PERSONAL, con etiqueta ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.fill('#buscar-tercero', 'garcia');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.waitForTimeout(200);

const textosResultado = () => pagina.locator('#resultados-tercero .resultado').allTextContents();
const textos = await textosResultado();
await comprobar('salen los tres', textos.length, 3);
await comprobar('la matriculada sale con su etiqueta ALUMNADO',
  textos.some(t => t.indexOf('García López') !== -1 && /alumnado/i.test(t)), true);
await comprobar('el conserje sale con su etiqueta PERSONAL',
  textos.some(t => t.indexOf('García Núñez') !== -1 && /personal/i.test(t)), true);
await comprobar('matriculada antes que antigua, dentro de ALUMNADO',
  textos.findIndex(t => t.indexOf('García López') !== -1) < textos.findIndex(t => t.indexOf('García Ruiz') !== -1), true);

/* ================================================================
   2. Elegir la persona limita la parrilla a su categoría.
   ================================================================ */
console.log('--- 2. elegir a la alumna limita la parrilla a ALUMNADO ---');

/* Se pulsa la línea del nombre, no el centro de toda la tarjeta: en
   ALUMNADO la segunda línea lleva el botón de copiar el Nº de
   identificación escolar (js/copiar.js), que para su propio clic. */
await pagina.locator('#resultados-tercero .resultado', { hasText: 'García López' })
  .locator('div').first().click();
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('la parrilla solo trae el tipo de ALUMNADO',
  pagina.locator('#tipos-lista .tipo-boton').count(), 1);
await comprobar('ya no lleva la clase de "todas las categorías"',
  pagina.locator('#tipos-lista').evaluate(el => el.classList.contains('tipos-todas-categorias')), false);

/* ================================================================
   3. El resumen de la guía, pulsable.
   ================================================================ */
console.log('--- 3. el resumen de la guía, en una línea, pulsable ---');

await pagina.getByRole('button', { name: 'CERTIFICADO', exact: true }).click();
await pagina.waitForSelector('#guia-resumen-nuevo:not(.oculto)');
await comprobar('el resumen dice cuántos hitos',
  pagina.locator('#guia-resumen-nuevo').textContent().then(t => t.indexOf('2 hitos') !== -1), true);
await comprobar('la guía entera todavía no se ve', pagina.locator('#guia-nuevo').isHidden(), true);

await pagina.click('#guia-resumen-nuevo');
await pagina.waitForSelector('#guia-nuevo:not(.oculto)');
await comprobar('al pulsarlo se despliega la guía entera',
  pagina.locator('#guia-nuevo').textContent().then(t => t.indexOf('Primer paso') !== -1 && t.indexOf('Segundo paso') !== -1), true);

await pagina.click('#guia-resumen-nuevo');
await pagina.waitForSelector('#guia-nuevo.oculto', { state: 'attached' });
await comprobar('y se vuelve a plegar', pagina.locator('#guia-nuevo').isHidden(), true);

/* ================================================================
   4. "Crear el asunto" abre la mesa del hito 1.
   ================================================================ */
console.log('--- 4. crear abre la mesa del primer hito ---');

await pagina.fill('#campo-fecha', '2026-09-20');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
await comprobar('la mesa del primer hito está abierta',
  pagina.locator('.hito-en-mesa[data-id="c1"]').isVisible(), true);

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* ================================================================
   5. El camino inverso: tipo primero, sin persona.
   ================================================================ */
console.log('--- 5. tipo primero también crea, y filtra el buscador ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.getByRole('button', { name: 'COMPRA', exact: true }).click();
await comprobar('elegir el tipo, sin persona, marca la pastilla de su categoría',
  pagina.locator('.categoria-boton[data-categoria="EMPRESAS"]').evaluate(el => el.classList.contains('elegido')), true);

await pagina.fill('#buscar-tercero', 'bermejo');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-21');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
/* COMPRA no tiene guía: se abre la ficha, sin mesa (fila 119). */
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('el asunto del camino inverso se ha creado',
  pagina.evaluate(() => App.E.registro && Object.keys(App.E.registro.asuntos)
    .some(n => n.indexOf('COMPRA') !== -1 && n.indexOf('Bermejo') !== -1)), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
