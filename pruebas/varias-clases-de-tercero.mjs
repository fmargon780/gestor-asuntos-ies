/* Prueba en navegador de verdad de la fila 493 (30-oct-2026, docs/493-varias-clases-de-tercero.md):
   un tipo de asunto admite varias clases de tercero. Datos inventados; mismo disco de mentira que
   pruebas/navegador.mjs.

   Comprueba: las casillas de «Clases de tercero» en Ajustes (la última no se apaga, se guarda al
   cambiar), las pastillas y la línea «admite» de Nuevo asunto, el buscador limitado a esas clases,
   la parrilla con la persona elegida primero, y la clase guardada en el asunto (la del tercero). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 1000 } });
const pagina = await contexto.newPage();
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
await pagina.evaluate(async () => {
  const D = window.__disco;
  const g = await D.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const datos = await g.getDirectoryHandle('datos', { create: true });
  datos._hijos.set('otros.csv', D.fich('otros.csv', 'Nombre;Referencia;Teléfono;Correo\r\nAyuntamiento de Villaprueba;P2999999X;952000000;registro@villaprueba.es\r\n'));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(400);

await pagina.evaluate(async () => {
  await App.crearTipo({ nombre: 'COMUNICACION RECIBIDA', categoria: 'OTROS' });
  await Administraciones.alta(App.E.datos, { clase: 'organismo', corto: 'Delegación Educación Málaga', oficial: 'Delegación Territorial de Pruebas', superior: 'Consejería de Pruebas' });
});

const leerTipos = () => pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  return JSON.parse(await (await (await g.getFileHandle('tipos.json')).getFile()).text());
});
const pastillas = () => pagina.locator('#categorias-lista .categoria-boton').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-categoria')));

/* ---------- 1. Ajustes ---------- */
console.log('--- 1. Ajustes: Clases de tercero ---');
await pagina.evaluate(() => App.abrirTipoDeAsunto(App.E.tipos.find((t) => t.tipo === 'COMUNICACION RECIBIDA')));
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.evaluate(() => document.querySelectorAll('#pantalla-tipo-asunto details').forEach((d) => { d.open = true; }));
const casillas = () => pagina.locator('.tipo-clases-casilla input').evaluateAll((is) => is.map((i) => [i.getAttribute('data-clase'), i.checked, i.disabled]));
await comprobar('1. seis casillas, solo OTROS marcada, y apagada', casillas(),
  [['ALUMNADO', false, false], ['PERSONAL', false, false], ['EMPRESAS', false, false], ['OTROS', true, true], ['TUTORES LEGALES', false, false], ['ADMINISTRACIONES', false, false]]);
await comprobar('1. la fila se llama «Clases de tercero»', pagina.locator('#pantalla-tipo-asunto .tipo-clases-fila .nombre-tipo').textContent(), 'Clases de tercero');
await pagina.locator('.tipo-clases-casilla input[data-clase="ADMINISTRACIONES"]').check();
await pagina.waitForTimeout(400);
await comprobar('1. la cabecera enseña las dos', pagina.locator('#tipo-asunto-categoria').textContent(), 'OTROS · ADMINISTRACIONES');
await comprobar('1. se guarda en tipos.json (categoria sigue siendo la primera)', leerTipos().then((l) => {
  const t = l.find((x) => x.tipo === 'COMUNICACION RECIBIDA'); return [t.categoria, t.categorias];
}), ['OTROS', ['OTROS', 'ADMINISTRACIONES']]);
await comprobar('1. ya ninguna está apagada', casillas().then((l) => l.filter((c) => c[2]).length), 0);
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.evaluate(() => App.abrirTipoDeAsunto(App.E.tipos.find((t) => t.tipo === 'COMUNICACION RECIBIDA')));
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await comprobar('1. al volver a abrirlo sigue marcada', casillas().then((l) => l.filter((c) => c[1]).map((c) => c[0])), ['OTROS', 'ADMINISTRACIONES']);
await pagina.locator('.tipo-clases-casilla input[data-clase="OTROS"]').uncheck();
await pagina.waitForTimeout(300);
await comprobar('1. la que queda sola se apaga', casillas().then((l) => l.filter((c) => c[1]).map((c) => c[0] + (c[2] ? '(apagada)' : ''))), ['ADMINISTRACIONES(apagada)']);
await pagina.locator('.tipo-clases-casilla input[data-clase="OTROS"]').check();
await pagina.waitForTimeout(300);

/* ---------- 2. Nuevo asunto: el tipo primero ---------- */
console.log('--- 2. Nuevo asunto, tipo primero ---');
await pagina.evaluate(() => {
  window.__cats = [];
  const f = App.buscarEnCategorias;
  App.buscarEnCategorias = function (texto, categorias) { window.__cats.push(categorias.slice()); return f.apply(this, arguments); };
  App.ir('nuevo');
});
await comprobar('2. sin tipo, seis pastillas', pastillas().then((l) => l.length), 6);
await pagina.fill('#buscar-tipo', 'COMUNICACION');
await pagina.locator('#tipos-lista .tipo-boton[data-tipo="COMUNICACION RECIBIDA"]').click();
await comprobar('2. solo las pastillas Otros y Administraciones', pastillas(), ['OTROS', 'ADMINISTRACIONES']);
await comprobar('2. la línea «admite»', pagina.locator('#categorias-admite').textContent(), 'COMUNICACION RECIBIDA admite: Otros · Administraciones.');
await comprobar('2. sin pastilla «Todas»', pagina.locator('#categorias-lista').textContent().then((t) => /Todas/.test(t)), false);
await comprobar('2. ninguna pastilla pulsada', pagina.locator('#categorias-lista .categoria-boton.elegido').count(), 0);
await pagina.fill('#buscar-tercero', 'de');
await pagina.waitForFunction(() => document.querySelectorAll('#resultados-tercero .resultado').length >= 2);
await comprobar('2. el buscador busca solo en las dos clases', pagina.evaluate(() => window.__cats[window.__cats.length - 1]), ['OTROS', 'ADMINISTRACIONES']);
await comprobar('2. salen terceros de las dos', pagina.locator('#resultados-tercero .resultado .resultado-categoria').allTextContents().then((l) => Array.from(new Set(l)).sort()), ['Administraciones', 'Otros']);
await pagina.locator('#categorias-lista .categoria-boton[data-categoria="ADMINISTRACIONES"]').click();
await pagina.waitForFunction(() => !document.querySelector('#resultados-tercero .explica'));
await comprobar('2. pulsada Administraciones: solo Administraciones', pagina.locator('#resultados-tercero .resultado .resultado-categoria').allTextContents().then((l) => Array.from(new Set(l))), ['Administraciones']);
await pagina.locator('#categorias-lista .categoria-boton[data-categoria="ADMINISTRACIONES"]').click();
await pagina.waitForFunction(() => document.querySelectorAll('#resultados-tercero .resultado').length >= 2);
await comprobar('2. pulsada otra vez: vuelven las dos', pagina.locator('#resultados-tercero .resultado .resultado-categoria').allTextContents().then((l) => Array.from(new Set(l)).sort()), ['Administraciones', 'Otros']);

/* ---------- 3. Persona primero, y crear ---------- */
console.log('--- 3. persona primero, y crear ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.fill('#buscar-tipo', '');
await pagina.fill('#buscar-tercero', 'Delegación');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.locator('#resultados-tercero .resultado').first().click();
await comprobar('3. con una Administración, la parrilla trae COMUNICACION RECIBIDA',
  pagina.locator('#tipos-lista .tipo-boton').evaluateAll((bs) => bs.map((b) => b.dataset.tipo)).then((l) => l.includes('COMUNICACION RECIBIDA')), true);
await comprobar('3. y no trae MATRICULA (solo Alumnado)',
  pagina.locator('#tipos-lista .tipo-boton').evaluateAll((bs) => bs.map((b) => b.dataset.tipo)).then((l) => l.includes('MATRICULA')), false);
await comprobar('3. el botón del tipo lleva debajo sus clases',
  pagina.locator('#tipos-lista .tipo-boton[data-tipo="COMUNICACION RECIBIDA"] small').textContent(), 'OTROS · ADMINISTRACIONES');
await pagina.locator('#tipos-lista .tipo-boton[data-tipo="COMUNICACION RECIBIDA"]').click();
await comprobar('3. elegido el tipo, el tercero se queda', pagina.evaluate(() => App.E.nuevo.tercero && App.E.nuevo.tercero.nombre), 'Delegación Educación Málaga');
await pagina.waitForFunction(() => App.E.nuevo.numero);
await pagina.waitForFunction(() => !document.getElementById('btn-crear').disabled);
await pagina.click('#btn-crear');
await pagina.waitForTimeout(700);
await comprobar('3. el asunto creado guarda la clase del tercero (Administraciones)', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const r = JSON.parse(await (await (await g.getFileHandle('asuntos.json')).getFile()).text());
  return Object.keys(r.asuntos).filter((k) => /COMUNICACION RECIBIDA/.test(k)).map((k) => r.asuntos[k].categoria);
}), ['ADMINISTRACIONES']);

/* ---------- 4. Un tipo de una sola clase se porta como hoy ---------- */
console.log('--- 4. tipo de una sola clase ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.fill('#buscar-tipo', 'MATRIC');
await pagina.locator('#tipos-lista .tipo-boton[data-tipo="MATRICULA"]').click();
await comprobar('4. una sola pastilla, ALUMNADO, ya fijada', pagina.locator('#categorias-lista .categoria-boton').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-categoria') + (b.classList.contains('elegido') ? '*' : ''))), ['ALUMNADO*']);
await comprobar('4. la línea «admite»', pagina.locator('#categorias-admite').textContent(), 'MATRICULA admite: Alumnado.');

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobaciones fallan.'); process.exit(1); }
console.log('\nTodo bien.');
