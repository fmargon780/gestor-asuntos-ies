/* Fila 288 (7-oct-2026, docs/AJUSTES-EN-CUATRO-PESTANAS.md): Ajustes en cuatro pestañas, con buscador.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. Las cuatro pestañas, en su orden y con su línea gris; no existe «Mantenimiento».
   2. Cada sección de la tabla está en su sitio y solo en uno; nada queda en el sitio de paso que no se ve.
   3. «Problemas»: con el asunto sin carpeta de la demostración sale su tarjeta y el punto ámbar; al quitarlo, la tarjeta desaparece (el resto, en pruebas/problemas.mjs).
   4. Herramientas lleva «Puesta a punto y reparaciones» con sus ocho secciones.
   5. El buscador: por título, por otra palabra, sin acentos, resultado de Herramientas, de dentro de un tipo, sin resultados, Esc.
   6. El salto común y lo recordado (pestaña y sección abierta). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-ajustes-pestana', 'mantenimiento'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForTimeout(7000);
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(2500);

const titulos = (selector) => pagina.$$eval(selector, (e) => e.map((x) => x.querySelector(':scope > summary .bloque-titulo').textContent.trim()));

console.log('--- 1. las pestañas ---');
await comprobar('1. cuatro pestañas, en su orden (la última lleva el número de problemas, fila 291)', pagina.$$eval('.pestana-ajustes', (b) => b.map((x) => x.textContent.trim().replace(/ \(\d+\)$/, ''))),
  ['Lo de cada día', 'El centro', 'Este ordenador', 'Problemas']);
await comprobar('1. lo recordado era «Mantenimiento»: se abre «Lo de cada día»', pagina.locator('.pestana-ajustes.activa').textContent(), 'Lo de cada día');
const lineas = [];
for (const p of ['dia', 'centro', 'ordenador', 'problemas']) {
  await pagina.click('.pestana-ajustes[data-ajustes-pestana="' + p + '"]');
  lineas.push(await pagina.locator('#ajustes-linea-pestana').textContent());
}
await comprobar('2. cada pestaña tiene su línea gris, distinta', [new Set(lineas).size, lineas[2]],
  [4, 'Lo de esta pestaña se guarda solo en este ordenador. En otro ordenador hay que ponerlo otra vez.']);

console.log('--- 2. cada sección en su sitio ---');
const sitio = (id) => pagina.evaluate((i) => { const e = document.getElementById(i); if (!e) return null; const c = e.closest('.ajustes-tab'); return c ? c.id : (e.closest('#herramientas-puesta-cuerpo') ? 'herramientas' : '?'); }, id);
await comprobar('2. «Lo de cada día»: tipos de documento, grupos, biblioteca de hitos y quién encarga, en ese orden',
  pagina.$$eval('#ajustes-tab-dia > details.bloque-ajustes', (e) => e.map((x) => x.id)),
  ['bloque-tipos-documento', 'bloque-grupos-personas', 'bloque-biblioteca-hitos', 'bloque-tipos-organo']);
await comprobar('2. «El centro», en el orden del documento', titulos('#ajustes-tab-centro > details.bloque-ajustes'),
  ['Datos del centro y firma', 'Cargos del centro', 'Quién usa la aplicación', 'Membrete', 'Sello y firma en el papel', 'Calendario y responsables',
    'Días de aviso', 'Copias de seguridad', 'Impresos', 'Alumnado y personal', 'Aviso de actividades extraescolares', 'Buzón de soporte']);   /* fila 309 */
await comprobar('2. «Este ordenador»: las ocho', titulos('#ajustes-tab-ordenador > details.bloque-ajustes'),
  ['Carpetas de este ordenador', 'Rutas de las carpetas', 'Largo de las rutas', 'Carpeta de la base de datos de alumnado', 'Carpeta del Centro de datos', 'Bandeja de correos', 'Enviar correo', 'El ayudante de Séneca']);
await comprobar('2. el sitio de paso no guarda ninguna sección', pagina.$$eval('#ajustes-tab-mantenimiento > details', (e) => e.length), 0);
await comprobar('2. no hay «Campos propios» ni una sección «Hitos»', pagina.evaluate(() => [...document.querySelectorAll('#pantalla-ajustes .bloque-titulo')].map((t) => t.textContent.trim()).filter((t) => t === 'Campos propios' || t === 'Hitos')), []);
await comprobar('2. «Impresos» lleva el catálogo dentro y no hay otra sección «Impresos»',
  pagina.evaluate(() => [!!document.querySelector('#bloque-impresos #bloque-formularios'), [...document.querySelectorAll('#pantalla-ajustes .bloque-titulo, #pantalla-herramientas .bloque-titulo')].filter((t) => t.textContent.trim() === 'Impresos').length]),
  [true, 1]);
await comprobar('2. «Alumnado y personal» lleva dentro las tres, en su orden',
  pagina.$$eval('#alumnado-personal-cuerpo > details', (e) => e.map((x) => x.id)), ['bloque-ficheros-datos', 'bloque-frescura', 'bloque-abreviar-grupos']);
await comprobar('2. y arriba, los dos enlaces', pagina.$$eval('#alumnado-personal-cuerpo .enlace', (e) => e.map((x) => x.textContent.trim())),
  ['Traer el alumnado', 'Carpeta de la base de datos de alumnado']);
await comprobar('2. «Copias de seguridad» lleva el enlace «Restaurar una copia»', pagina.locator('#copias-enlace-restaurar').textContent(), 'Restaurar una copia');
await comprobar('2. ninguna sección queda escondida sin querer', pagina.evaluate(() => [...document.querySelectorAll('#pantalla-ajustes details.bloque-ajustes')].filter((d) => d.offsetParent === null && !d.classList.contains('oculto') && d.closest('.ajustes-tab:not(.oculto)')).length), 0);
await comprobar('2. el rótulo de «solo en este ordenador» y el de «para todo el centro»',
  pagina.evaluate(() => [document.getElementById('bloque-dias-aviso').textContent.includes('(solo en este ordenador)'), document.getElementById('bloque-rutas').textContent.includes('(para todo el centro)')]), [true, true]);

console.log('--- 3. Problemas ---');
await pagina.click('.pestana-ajustes[data-ajustes-pestana="problemas"]');
await pagina.waitForTimeout(1500);
await comprobar('3. sale la tarjeta de los asuntos que han perdido su carpeta (fila 291)', pagina.evaluate(() => { const d = document.querySelector('#ajustes-tab-problemas [data-problema="carpetas"]'); return [!!d, d.querySelectorAll('.problema-elemento').length]; }), [true, 3]);   /* fila 303: la demostración trae tres */
await comprobar('3. el botón de la pestaña lleva un punto ámbar', pagina.locator('#problemas-punto').evaluate((p) => !p.classList.contains('oculto')), true);
await comprobar('3. y no sale «Todo en orden»', pagina.locator('#problemas-todo-bien').evaluate((p) => p.classList.contains('oculto')), true);
for (let i = 0; i < 3; i++) {   /* fila 303: son tres */
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('[data-problema="carpetas"] button')].find((x) => /El asunto ya no existe/.test(x.textContent)); b.click(); });
  await pagina.waitForTimeout(600);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForTimeout(1500);
}
await pagina.waitForTimeout(1000);
await comprobar('3. quitado el asunto: la tarjeta desaparece', pagina.evaluate(() => !!document.querySelector('#ajustes-tab-problemas [data-problema="carpetas"]')), false);

console.log('--- 4. Herramientas ---');
await pagina.click('.pestana[data-pantalla="herramientas"]');
await pagina.waitForTimeout(1500);
await comprobar('4. «Puesta a punto y reparaciones» con sus ocho secciones, en orden',
  pagina.evaluate(() => [document.querySelector('.herramientas-puesta-titulo').textContent, [...document.querySelectorAll('#herramientas-puesta-cuerpo > details .bloque-titulo')].map((t) => t.textContent.trim())]),
  ['Puesta a punto y reparaciones', ['Plantillas del centro', 'Cargar tipos, guías y tareas del instituto', 'Poner en orden las fichas del ARCHIVO', 'Guardar el contacto de los asuntos abiertos',
    'Versiones previas', 'Duplicados descartados', 'Pasar a Administraciones', 'Borrados que se fusionan']]);
await comprobar('4. y no queda en Ajustes ninguna sección «Herramientas»', pagina.evaluate(() => [...document.querySelectorAll('#pantalla-ajustes .bloque-titulo')].some((t) => t.textContent.trim() === 'Herramientas')), false);

console.log('--- 5. el buscador ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(800);
const resultados = () => pagina.$$eval('.ajustes-resultado', (e) => e.map((x) => x.textContent.trim()));
await pagina.fill('#ajustes-buscar', 'festivos');
await comprobar('5. «festivos»: Calendario y responsables · El centro', resultados().then((r) => r[0]), 'Calendario y responsables · El centro');
await pagina.locator('.ajustes-resultado').first().click();
await pagina.waitForTimeout(1200);
await comprobar('5. al pulsarlo: «El centro» abierta, con la sección desplegada',
  pagina.evaluate(() => [App.E.pestanaAjustes, document.getElementById('bloque-hitos').open, document.getElementById('ajustes-resultados').classList.contains('oculto')]), ['centro', true, true]);
await pagina.fill('#ajustes-buscar', 'logo');
await comprobar('5. «logo»: Membrete · El centro', resultados().then((r) => r.includes('Membrete · El centro')), true);
await pagina.fill('#ajustes-buscar', 'DROPBOX');
await comprobar('5. «dropbox»: Carpetas de este ordenador · Este ordenador', resultados().then((r) => r.includes('Carpetas de este ordenador · Este ordenador')), true);
await pagina.fill('#ajustes-buscar', 'senalar carpetas');
await comprobar('5. «senalar carpetas» (sin eñe), en cualquier orden: Carpetas de este ordenador',
  resultados().then((r) => r.some((x) => x.startsWith('Carpetas de este ordenador'))), true);
await pagina.fill('#ajustes-buscar', 'papelera');
await comprobar('5. «papelera»: un resultado de Herramientas', resultados().then((r) => r.some((x) => /· Herramientas$/.test(x))), true);
await pagina.locator('.ajustes-resultado', { hasText: 'Papelera · Herramientas' }).first().click();
await pagina.waitForTimeout(1500);
await comprobar('5. al pulsarlo: abre Herramientas con la Papelera abierta',
  pagina.evaluate(() => [!document.getElementById('pantalla-herramientas').classList.contains('oculto'), document.getElementById('bloque-papelera').open]), [true, true]);
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(600);
await pagina.fill('#ajustes-buscar', 'plantilla');
await comprobar('5. «plantilla»: hay un resultado «Dentro de cada tipo de asunto»', resultados().then((r) => r.some((x) => /Dentro de cada tipo de asunto$/.test(x))), true);
await pagina.locator('.ajustes-resultado', { hasText: 'Plantilla de documento de Word' }).first().click();
await pagina.waitForTimeout(800);
await comprobar('5. al pulsarlo: «Lo de cada día» con la línea que dice que se pone dentro de cada tipo',
  pagina.evaluate(() => [App.E.pestanaAjustes, (document.getElementById('ajustes-linea-tipo') || {}).textContent]),
  ['dia', 'Se pone dentro de cada tipo: pulsa un tipo y busca «Plantilla de documento de Word».']);
await pagina.fill('#ajustes-buscar', 'zzzz');
await comprobar('5. «zzzz»: «Nada con ese nombre»', pagina.locator('#ajustes-resultados').textContent().then((t) => t.trim()), 'Nada con ese nombre. Prueba con otra palabra.');
await pagina.press('#ajustes-buscar', 'Escape');
await comprobar('5. Esc quita la lista y vacía la caja', pagina.evaluate(() => [document.getElementById('ajustes-resultados').classList.contains('oculto'), document.getElementById('ajustes-buscar').value]), [true, '']);
await pagina.fill('#ajustes-buscar', 'festivos');
await pagina.press('#ajustes-buscar', 'Enter');
await pagina.waitForTimeout(900);
await comprobar('5. Intro va al primer resultado', pagina.evaluate(() => App.E.pestanaAjustes), 'centro');

console.log('--- 6. el salto común y lo recordado ---');
await pagina.evaluate(() => { App.cambiarPestanaAjustes('dia'); });
await pagina.evaluate(() => App.irASeccionDeAjustes('#bloque-envio-correo'));
await pagina.waitForTimeout(800);
await comprobar('6. el salto lleva a «Este ordenador» y abre la sección', pagina.evaluate(() => [App.E.pestanaAjustes, document.getElementById('bloque-envio-correo').open]), ['ordenador', true]);
await pagina.evaluate(() => App.irASeccionDeAjustes('#bloque-traer-alumnado'));
await pagina.waitForTimeout(1500);
await comprobar('6. y un salto a Herramientas va a esa pantalla', pagina.evaluate(() => !document.getElementById('pantalla-herramientas').classList.contains('oculto')), true);
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(800);
await comprobar('6. al volver a Ajustes: la misma pestaña y la sección sigue abierta', pagina.evaluate(() => [App.E.pestanaAjustes, document.getElementById('bloque-envio-correo').open]), ['ordenador', true]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
