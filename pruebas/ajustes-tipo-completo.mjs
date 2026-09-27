/* Prueba en navegador de verdad de la pantalla del tipo, de arriba
   abajo (27-sep-2026, fila 198, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md,
   apartados 1, 2, 3, 5 y 8).

   Lo que comprueba:
     1. Un tipo recién creado enseña la lista de comprobación con
        "Nombre corto" marcado y lo demás vacío (apartado 1).
     2. Con una guía cuyo hito tiene la tarea "Generar un documento" sin
        plantilla, aparece "Plantilla de documento — el hito 1 la
        necesita" (apartado 1). Una línea de la lista abre su sección.
     3. Cambiar las palabras clave las guarda sola, sin botón (apartado
        2); tampoco hay botón "Guardar campos". La tarjeta de la
        parrilla de tipos enseña el plazo, pero no lo edita (apartado 3).
     4. "Campos propios" de El centro es una línea con enlace, sin
        editor propio (apartado 5).
     5. El editor de la guía trae el texto nuevo, no el desfasado
        (apartado 8).

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

async function leerJson(nombreFichero) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, nombreFichero);
}

async function filasChecklist() {
  return pagina.evaluate(() => Array.from(document.querySelectorAll('.tipo-asunto-checklist-item')).map((b) => ({
    texto: b.textContent.trim(),
    hecho: b.classList.contains('hecho')
  })));
}

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');

/* ================================================================
   1. Un tipo recién creado: solo "Nombre corto" marcado.
   ================================================================ */
console.log('--- 1. un tipo recién creado, la lista casi vacía ---');

await pagina.selectOption('#nueva-categoria', 'OTROS');
await pagina.fill('#nuevo-tipo', 'PRUEBACHK');
await pagina.click('#btn-anadir-tipo');
await pagina.waitForTimeout(200);

const tarjetaNueva = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'PRUEBACHK' });
await comprobar('la tarjeta enseña el plazo (sin plazo todavía), sin poder editarlo ahí',
  tarjetaNueva.locator('.tarjeta-tipo-sub').textContent(), 'sin plazo');
await comprobarQue('ninguna casilla de plazo en la tarjeta (apartado 3)',
  tarjetaNueva.locator('.tarjeta-tipo-sub input').count().then((n) => n === 0));

await tarjetaNueva.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('.tipo-asunto-checklist-lista');

const filas1 = await filasChecklist();
await comprobar('las líneas de la lista, en orden, con "Nombre corto" marcado y lo demás vacío',
  filas1.map((f) => ({ texto: f.texto, hecho: f.hecho })), [
    { texto: '☑ Nombre corto', hecho: true },
    { texto: '☐ Quién lo encarga', hecho: false },
    { texto: '☐ Guía (0 hitos)', hecho: false },
    { texto: '☐ Plazo', hecho: false },
    { texto: '☐ Palabras clave', hecho: false },
    { texto: '☐ Plazo de conservación', hecho: false }
  ]);
await comprobarQue('no hay ya botón "Guardar campos"',
  pagina.locator('#campos-guardar').count().then((n) => n === 0));
await comprobarQue('ni botón "Guardar palabras clave"',
  pagina.locator('#tipo-palabras-clave-guardar').count().then((n) => n === 0));

/* ================================================================
   2. Una guía con la tarea "Generar un documento" sin plantilla.
   ================================================================ */
console.log('--- 2. la guía con "Generar un documento" hace aparecer la línea ---');

await pagina.evaluate(async () => {
  await GuiasDelCentro.guardarPasos('PRUEBACHK', [
    { id: 'h1', titulo: 'Redactar el escrito', cuerpo: '', opciones: [],
      guion: [{ id: 'g1', texto: 'Redactar el documento', explicacion: '', accion: 'generar', normativa: null }] }
  ]);
  App.cerrarTipoDeAsunto();
  const t = App.E.tipos.filter((x) => x.tipo === 'PRUEBACHK')[0];
  await App.abrirTipoDeAsunto(t);
});
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('.tipo-asunto-checklist-lista');

const filas2 = await filasChecklist();
await comprobarQue('"Guía (1 hito)" ya marcada',
  filas2.some((f) => f.texto === '☑ Guía (1 hito)'));
await comprobarQue('"Plantilla de documento — el hito 1 la necesita" aparece, sin marcar',
  filas2.some((f) => f.texto === '☐ Plantilla de documento — el hito 1 la necesita' && !f.hecho));

/* Cada línea es un enlace: pulsar "Guía" abre esa sección. */
await pagina.evaluate(() => document.getElementById('pantalla-tipo-asunto')
  .querySelector('details[data-seccion="pasos"]').open = false);
await pagina.locator('.tipo-asunto-checklist-item').filter({ hasText: 'Guía' }).click();
await comprobarQue('pulsar "Guía" en la lista despliega la sección',
  pagina.evaluate(() => document.querySelector('#pantalla-tipo-asunto details[data-seccion="pasos"]').open));

/* ================================================================
   3. Las palabras clave se guardan solas, sin botón.
   ================================================================ */
console.log('--- 3. las palabras clave, sin botón ---');

/* Abre la sección pulsando su línea de la lista (también un enlace). */
await pagina.locator('.tipo-asunto-checklist-item').filter({ hasText: 'Palabras clave' }).click();
await pagina.waitForSelector('#tipo-palabras-clave', { state: 'visible' });
await pagina.fill('#tipo-palabras-clave', 'matricula, escolarizacion');
await pagina.locator('#tipo-palabras-clave').blur();
await pagina.waitForTimeout(400);
await comprobar('tipos.json guarda las palabras clave, sin haber pulsado nada',
  leerJson('tipos.json').then((t) => (t.filter((x) => x.tipo === 'PRUEBACHK')[0] || {}).palabrasClave),
  ['matricula', 'escolarizacion']);
await comprobarQue('la lista de comprobación pasa "Palabras clave" a marcada',
  filasChecklist().then((f) => f.some((x) => x.texto === '☑ Palabras clave')));

/* ================================================================
   4. "Campos propios" de El centro, una línea con enlace.
   ================================================================ */
console.log('--- 4. "Campos propios", solo una línea con enlace ---');

await pagina.click('#pantalla-tipo-asunto .boton-volver');
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.waitForSelector('#campos-propios-enlace');
await comprobar('el enlace dice "Se configuran dentro de cada tipo"',
  pagina.locator('#campos-propios-enlace').textContent(), 'Se configuran dentro de cada tipo');
await comprobarQue('no hay editor propio de campos propios en "El centro"',
  pagina.locator('#nuevo-propio').count().then((n) => n === 0));
await pagina.click('#campos-propios-enlace');
await comprobar('el enlace lleva a "Tipos de asunto"',
  pagina.locator('.pestana-ajustes.activa').textContent(), 'Tipos de asunto');

/* ================================================================
   5. El editor de la guía trae el texto nuevo.
   ================================================================ */
console.log('--- 5. el texto nuevo del editor de la guía ---');

const tarjetaOtraVez = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'PRUEBACHK' });
await tarjetaOtraVez.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.click('#pantalla-tipo-asunto details[data-seccion="pasos"] button:has-text("Cambiar la guía")');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el texto de arriba del editor ya no habla de "una casilla para ir marcando"',
  pagina.locator('#capa .explica').first().textContent(),
  'Cada hito de la guía es un hito del asunto, con sus tareas.');
await pagina.click('#cuadro-cancelar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
