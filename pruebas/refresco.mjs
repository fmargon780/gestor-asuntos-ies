/* Prueba en navegador de verdad de que la pantalla se repinta sola
   después de guardar (17-sep-2026, fila 23 de la cola).

   Nació de un fallo contado por Francisco: al cambiar el estado de un
   asunto, al marcar un hito como hecho y al archivar, la pantalla se
   quedaba con lo de antes hasta salir y volver a entrar. Aquí se
   comprueba, sin recargar nada, que las tres acciones dejan la
   pantalla ya con el dato nuevo, y que el control usado se apaga
   ("Guardando…") mientras se guarda. Reutiliza el disco de mentira de
   pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'hitos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
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

/* Estados y la guía del tipo, puestos antes de entrar (se leen una
   sola vez, al arrancar). */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('estados.json', window.__disco.fich('estados.json',
    JSON.stringify([{ nombre: 'En el departamento' }, { nombre: 'A la espera de terceros', espera: true }])));
  g._hijos.set('guias.json', window.__disco.fich('guias.json', JSON.stringify({
    MATRICULA: [{ id: 'p1', titulo: 'Primer paso' }, { id: 'p2', titulo: 'Segundo paso' }]
  })));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Alguien Prueba, Marina;1140233;1º de E.S.O.;1º A;2025;Matriculada;14/03/2013'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});

await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* Un asunto de verdad, creado como lo hace Francisco (con categoría y
   tercero, no una carpeta suelta puesta a mano en el disco). */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'marina');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-01');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

console.log('--- 1) cambiar el estado de un asunto ---');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
const selEstado = pagina.locator('#ficha-acciones select.campo-estado');
/* El cambio y la comprobación de que el desplegable se apaga van en el
   mismo 'evaluate': entre elegir la opción y mirar 'disabled' no puede
   colarse ninguna otra vuelta al bucle de eventos, así que da igual lo
   rápido que guarde el disco de mentira o lo que tarde el viaje de ida
   y vuelta de Playwright. */
const seApagaAlElegir = await pagina.evaluate(() => {
  var sel = document.querySelector('#ficha-acciones select.campo-estado');
  var opcion = Array.prototype.filter.call(sel.options, function (o) {
    return o.textContent === 'En el departamento';
  })[0];
  sel.value = opcion.value;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return sel.disabled;
});
await comprobar('el desplegable se apaga mientras guarda', seApagaAlElegir, true);
await pagina.waitForTimeout(300);
await comprobar('la ficha ya enseña el estado nuevo, sin recargar',
  pagina.locator('#ficha-acciones select.campo-estado').inputValue(), 'En el departamento');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);
await comprobar('la tarjeta de la lista también, sin recargar',
  pagina.locator('#lista-abiertos .tarjeta .marca-estado').first().textContent(), 'En el departamento');

console.log('--- 2) marcar un hito (paso de la guía) como hecho ---');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.hito');
await comprobar('empieza en 0 de 2', pagina.locator('.hitos-cuenta').textContent()
  .then(t => t.indexOf('0 de 2') !== -1), true);
const casilla = pagina.locator('.hito-casilla').first();
/* Mismo motivo que arriba: marcar y comprobar 'disabled' en el mismo
   'evaluate', sin ninguna vuelta al bucle de eventos por en medio. */
const seApagaAlMarcar = await pagina.evaluate(() => {
  var c = document.querySelector('.hito-casilla');
  c.checked = true;
  c.dispatchEvent(new Event('change', { bubbles: true }));
  return c.disabled;
});
await comprobar('la casilla se apaga mientras guarda', seApagaAlMarcar, true);
await pagina.waitForTimeout(300);
await comprobar('la cuenta sube a 1 de 2, sin recargar', pagina.locator('.hitos-cuenta').textContent()
  .then(t => t.indexOf('1 de 2') !== -1), true);
await comprobar('el hito queda pintado como hecho, sin recargar',
  pagina.locator('.hito').first().evaluate(el => el.className.indexOf('hito-hecho') !== -1), true);

console.log('--- 3) archivar el asunto ---');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
const btnArchivar = pagina.getByRole('button', { name: 'Archivar el asunto', exact: true });
await btnArchivar.click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('vuelve solo a la lista de abiertos', pagina.locator('#pantalla-abiertos').isVisible(), true);
await comprobar('el asunto ya no sale en abiertos, sin recargar',
  pagina.locator('#lista-abiertos .tarjeta').count(), 0);
await comprobar('y la lista dice que está vacía',
  pagina.locator('#lista-abiertos .vacio').count(), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
