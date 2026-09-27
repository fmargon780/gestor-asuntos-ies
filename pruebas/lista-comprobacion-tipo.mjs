/* Prueba en navegador de verdad de la lista de comprobación de arriba
   de la pantalla de un tipo (27-sep-2026, fila 198 de docs/COLA.md,
   docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md, apartado 1).

   Lo que comprueba:
     1. Un tipo recién creado enseña "Nombre corto" marcado (siempre) y
        el resto de las casillas aplicables, vacías.
     2. Añadir una guía con un hito con "Generar un documento" sin
        plantilla hace aparecer "Plantilla de documento — el hito 1 la
        necesita".
     3. Poner la plantilla en ese hito hace que la casilla pase a
        marcada.
     4. Cambiar una palabra clave, sin pulsar ningún botón, se guarda
        sola y actualiza la casilla de "Palabras clave".
     5. Pulsar una línea de la lista abre y despliega la sección que
        toca.
     6. Con todo lo aplicable marcado, la lista se pliega en la línea
        verde "Este tipo está completo".

   Reutiliza el disco de mentira de pruebas/navegador.mjs. Las secciones
   de la pantalla del tipo se dejan tal cual nacen (plegadas): parte de
   lo que se comprueba es, justamente, que la lista de comprobación las
   despliega sola al pulsarlas. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPO = 'PRUEBACHECK';

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

function filas() {
  return pagina.locator('#tipo-asunto-comprobacion .tipo-comprobacion-fila');
}
function filaConTexto(t) {
  return filas().filter({ hasText: t });
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
   1. Crear un tipo nuevo: "Nombre corto" marcado, el resto vacío.
   ================================================================ */
console.log('--- 1. un tipo recién creado ---');

await pagina.fill('#nuevo-tipo', TIPO);
await pagina.click('#btn-anadir-tipo');
await pagina.fill('#buscar-tipos', TIPO);
const tarjeta = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: TIPO });
await tarjeta.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('#tipo-asunto-comprobacion .tipo-comprobacion-fila');

await comprobar('todavía no está completo: se ve la lista, no la línea verde',
  pagina.locator('#tipo-asunto-comprobacion .aviso-bueno').count(), 0);
await comprobarQue('"Nombre corto" sale marcada',
  filaConTexto('Nombre corto').first().evaluate((b) => b.classList.contains('tipo-comprobacion-hecha')));
await comprobarQue('"Quién lo encarga" sale sin marcar',
  filaConTexto('Quién lo encarga').first().evaluate((b) => !b.classList.contains('tipo-comprobacion-hecha')));
await comprobar('la guía dice "0 hitos", sin marcar',
  filaConTexto('Guía').first().evaluate((b) => [b.textContent.trim(), b.classList.contains('tipo-comprobacion-hecha')]),
  ['☐ Guía (0 hitos)', false]);
await comprobar('ni "Plantilla de documento" ni "Plantilla de correo" salen todavía (no aplican)',
  filas().allTextContents().then((ts) => ts.some((t) => /Plantilla de/.test(t))), false);
await comprobarQue('"Plazo de conservación" sale sin marcar',
  filaConTexto('Plazo de conservación').first().evaluate((b) => !b.classList.contains('tipo-comprobacion-hecha')));

/* ================================================================
   2. Una guía con "Generar un documento" sin plantilla: aparece la
      casilla, incompleta, con el hito que la necesita.
   ================================================================ */
console.log('--- 2. la guía trae un "Generar un documento" sin plantilla ---');

await pagina.evaluate(async (tipo) => {
  await GuiasDelCentro.guardarPasos(tipo, [
    { id: 'h1', titulo: 'Notificar la sanción', cuerpo: '', opciones: [],
      guion: [{ id: 'g1', texto: 'Generar el oficio', explicacion: '', accion: 'generar' }] }
  ]);
  /* Como escribir la guía de verdad: al volver a pintar la pantalla
     del tipo (aquí, sin cerrarla y volver a entrar) se recalcula la
     lista de comprobación, igual que al pintar o tras un guardado. */
  await App.pintarTipoDeAsunto();
}, TIPO);
await pagina.waitForTimeout(200);

await comprobar('"Plantilla de documento" aparece, sin marcar, con el hito que la necesita',
  filaConTexto('Plantilla de documento').first().evaluate((b) => [b.textContent.trim(), b.classList.contains('tipo-comprobacion-hecha')]),
  ['☐ Plantilla de documento — el hito 1 la necesita', false]);
await comprobarQue('"Guía" ya cuenta el hito y sale marcada',
  filaConTexto('Guía').first().evaluate((b) => b.textContent.trim() === '✓ Guía (1 hito)' && b.classList.contains('tipo-comprobacion-hecha')));

/* ================================================================
   3. Poner la plantilla en ese hito: la casilla pasa a marcada.
   ================================================================ */
console.log('--- 3. se pone la plantilla: la casilla se marca ---');

await pagina.evaluate(async (tipo) => {
  await GuiasDelCentro.guardarPasos(tipo, [
    { id: 'h1', titulo: 'Notificar la sanción', cuerpo: '', opciones: [],
      guion: [{ id: 'g1', texto: 'Generar el oficio', explicacion: '', accion: 'generar', receta: { plantilla: 'pd-1' } }] }
  ]);
  await App.pintarTipoDeAsunto();
}, TIPO);
await pagina.waitForTimeout(200);

await comprobar('"Plantilla de documento" ya sale marcada, sin decir qué falta',
  filaConTexto('Plantilla de documento').first().evaluate((b) => [b.textContent.trim(), b.classList.contains('tipo-comprobacion-hecha')]),
  ['✓ Plantilla de documento', true]);

/* ================================================================
   4. Cambiar una palabra clave, sin pulsar ningún botón: se guarda
      sola y la casilla se pone al día.
   ================================================================ */
console.log('--- 4. las palabras clave se guardan solas, sin botón ---');

await comprobarQue('la fila "Palabras clave" abre y despliega la sección "Palabras clave"',
  pagina.evaluate(() => !document.querySelector('#pantalla-tipo-asunto details[data-seccion="palabras"]').open));
await filaConTexto('Palabras clave').first().click();
await comprobarQue('al pulsarla, la sección "Palabras clave" queda desplegada',
  pagina.evaluate(() => document.querySelector('#pantalla-tipo-asunto details[data-seccion="palabras"]').open));

await pagina.fill('#tipo-palabras-clave', 'sancion, disciplina');
await pagina.locator('#tipo-palabras-clave').blur();
await pagina.waitForTimeout(300);

await comprobar('se guarda en tipos.json sin haber pulsado ningún botón "Guardar"',
  leerJson('tipos.json').then((t) => t.filter((x) => x.tipo === TIPO)[0].palabrasClave), ['sancion', 'disciplina']);
await pagina.waitForTimeout(1700);
await comprobarQue('la casilla "Palabras clave" pasa a marcada, sola',
  filaConTexto('Palabras clave').first().evaluate((b) => b.classList.contains('tipo-comprobacion-hecha')));

/* ================================================================
   5. Rellenar el resto (Quién lo encarga, Plazo, Plazo de
      conservación), cada uno abriendo su sección desde la lista.
   ================================================================ */
console.log('--- 5. cada línea abre su sección, y al completar todo sale la línea verde ---');

await filaConTexto('Quién lo encarga').first().click();
await comprobarQue('"Quién lo encarga" abre "Datos del tipo"',
  pagina.evaluate(() => document.querySelector('#pantalla-tipo-asunto details[data-seccion="datos"]').open));
await pagina.selectOption('#pantalla-tipo-asunto .tipo-organo', 'SECRETARIA');
await pagina.waitForTimeout(300);

/* "Plazo de conservación" vive en la misma sección "Datos del tipo",
   ya desplegada por el clic de arriba. */
await pagina.fill('#pantalla-tipo-asunto .tipo-conservar-anios', '5');
await pagina.locator('#pantalla-tipo-asunto .tipo-conservar-anios').blur();
await pagina.waitForTimeout(300);

await filaConTexto('Plazo').first().click();
await comprobarQue('"Plazo" abre su propia sección',
  pagina.evaluate(() => document.querySelector('#pantalla-tipo-asunto details[data-seccion="plazo"]').open));
await pagina.locator('#pantalla-tipo-asunto details[data-seccion="plazo"] .campo-plazo').fill('15');
await pagina.locator('#pantalla-tipo-asunto details[data-seccion="plazo"] .campo-plazo').blur();

/* ================================================================
   6. Con todo lo aplicable marcado, la lista se pliega en la línea
      verde "Este tipo está completo".
   ================================================================ */
await pagina.waitForTimeout(1800);
await comprobar('la lista desaparece y sale la línea verde',
  pagina.locator('#tipo-asunto-comprobacion .aviso-bueno').textContent(), 'Este tipo está completo');
await comprobar('ya no quedan filas sueltas',
  filas().count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
