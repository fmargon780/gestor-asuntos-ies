/* Prueba en navegador de verdad del botón "Insertar hueco" (17-sep-2026,
   fila 35 de la cola, docs/HUECOS-INSERTAR.md).

   El editor de una plantilla de correo (Ajustes › Plantillas de correo)
   pintaba un botón por cada hueco disponible (más de treinta), un muro
   que ocupaba casi toda la pantalla y tapaba el resto del formulario.
   Se sustituye por un solo botón, "Insertar hueco", que abre un cuadro
   pequeño con buscador (`U.engancharInsertarHueco`, en `js/util.js`).

   El formulario de hoy solo tiene un campo con huecos (`#pl-texto`: no
   hay ningún campo de "asunto del correo" que los admita), así que el
   encargo de "recordar cuál de los dos campos tuvo el foco" se prueba
   con lo que hay: que sin haber tocado el campo todavía, el hueco
   entra al final; y que con el cursor en medio de lo ya escrito, entra
   justo ahí.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
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
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#plantillas-nueva');

console.log('--- 1) ya no se pinta el muro de un botón por hueco ---');
await pagina.click('#plantillas-nueva');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#pl-insertar-hueco');
await comprobar('ya no existe #pl-huecos (el muro de antes)', pagina.locator('#pl-huecos').count(), 0);
await comprobar('solo hay un botón para los huecos', pagina.locator('#pl-insertar-hueco').count(), 1);

console.log('--- 2) el botón abre el cuadro, y el buscador filtra ---');
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('.hueco-popover');
await comprobar('el campo de búsqueda tiene el foco',
  pagina.evaluate(() => document.activeElement === document.querySelector('.hueco-popover-buscar')), true);
await pagina.fill('.hueco-popover-buscar', 'tutor');
await comprobar('"Grupo" queda fuera al buscar "tutor"',
  pagina.locator('.hueco-popover-item', { hasText: 'Grupo' }).count(), 0);
await comprobar('un hueco de tutor sí sale',
  pagina.locator('.hueco-popover-item', { hasText: 'primer tutor' }).count().then((n) => n > 0), true);

console.log('--- Escape cierra sin insertar nada ---');
await pagina.keyboard.press('Escape');
await comprobar('el cuadro se ha cerrado', pagina.locator('.hueco-popover').count(), 0);
await comprobar('el texto sigue vacío', pagina.inputValue('#pl-texto'), '');
await comprobar('el cuadro de la plantilla sigue abierto (el Escape no se ha propagado)',
  pagina.locator('#capa:not(.oculto)').count(), 1);

console.log('--- 3) sin haber tocado el campo todavía, el hueco entra al final ---');
await pagina.fill('#pl-texto', 'Buenos días,');
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('.hueco-popover');
await pagina.fill('.hueco-popover-buscar', 'correo del tercero');
await pagina.click('.hueco-popover-item');
await comprobar('el hueco ha entrado al final de lo ya escrito',
  pagina.inputValue('#pl-texto'), 'Buenos días,{correo}');

console.log('--- 4) con el cursor en medio del texto, entra justo ahí ---');
await pagina.click('#pl-texto');
await pagina.evaluate(() => {
  var c = document.getElementById('pl-texto');
  c.setSelectionRange(7, 7);   /* justo detrás de "Buenos " */
});
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('.hueco-popover');
await pagina.fill('.hueco-popover-buscar', 'Nombre del tercero');
await pagina.keyboard.press('Enter');
await comprobar('el hueco ha entrado en medio del texto, no al final',
  pagina.inputValue('#pl-texto'), 'Buenos {nombre}días,{correo}');
await comprobar('el foco vuelve al texto, justo detrás de lo insertado',
  pagina.evaluate(() => {
    var c = document.getElementById('pl-texto');
    return document.activeElement === c && c.selectionStart === c.selectionEnd && c.selectionStart === 15;
  }), true);

console.log('--- la vista previa se actualiza al insertar ---');
await comprobar('la vista previa refleja el hueco insertado',
  pagina.locator('#pl-previa').textContent().then((t) => t.indexOf('{nombre}') === -1 && t.indexOf('{correo}') === -1), true);

console.log(errores.length ? '\nErrores de consola:\n' + errores.join('\n') : '');
await navegador.close();
if (fallos || errores.length) { console.log('\n' + (fallos + errores.length) + ' fallo(s).'); process.exit(1); }
console.log('\nTodas las pruebas de plantillas-huecos pasan.');
