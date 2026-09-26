/* Prueba en navegador de verdad del panel de "+ Añadir campo" y del
   creador de campos calculados (fila 56, 18-sep-2026,
   docs/CAMPOS-CATALOGO-Y-CALCULADOS.md). pruebas/campos.mjs ya
   comprueba el catálogo "De la ficha" y los campos propios de
   siempre; aquí se comprueba lo nuevo: las tres pestañas con su
   cuenta, la pestaña Calculados (con "Curso" de respaldo antes de
   guardar nada), crear un campo calculado con su vista previa, y el
   aviso al salir con campos añadidos sin guardar.

   Reutiliza el disco de mentira por defecto de pruebas/navegador.mjs
   (RegAlum con la columna Unidad y varios alumnos). */
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

/* Fila 105 (docs/AJUSTES-PLEGADO.md): Ajustes nace plegado; esta prueba
   trabaja con las secciones de la pantalla de un tipo ya desplegadas. */
await pagina.addInitScript(() => {
  try {
    const abiertas = {};
    ['datos', 'campos', 'pasos', 'correo', 'word', 'plazo', 'palabras', 'repite']
      .forEach((s) => { abiertas['tipo:' + s] = true; });
    window.localStorage.setItem('gestor-ajustes-plegado', JSON.stringify(abiertas));
  } catch (e) { /* sin localStorage, se queda plegado */ }
});
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* El RegAlum de mentira: navegador.mjs solo trae el mecanismo del
   disco falso (lo que se extrae arriba como `preparacion`); el
   contenido de cada fichero lo pone cada prueba con su propio
   `pagina.evaluate`, como aquí. */
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Aguilar Ponce, Marina;1140233;1º de E.S.O.;1º A;2025;Matriculada;14/03/2013'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});

const tarjetaMatricula = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'MATRICULA' });
await tarjetaMatricula.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('#campos-puestos');

/* ============================================================
   1. "+ Añadir campo" abre el panel, con las tres pestañas y su cuenta
   ============================================================ */
console.log('--- 1. el panel, con sus tres pestañas ---');
await pagina.click('#campos-btn-anadir');
await pagina.waitForSelector('#campos-catalogo-pestanas');
const pestanas = pagina.locator('#campos-catalogo-pestanas .pestana-categoria');
await comprobar('las tres pestañas, en orden (el nombre, sin la cuenta)',
  pestanas.allTextContents().then((t) => t.map((x) => x.replace(/\s*\d+\s*$/, '').trim())),
  ['De la ficha', 'Míos', 'Calculados']);
await comprobarQue('"De la ficha" está activa de partida',
  pagina.locator('#campos-catalogo-pestanas .pestana-categoria.activa').textContent().then((t) => t.indexOf('De la ficha') === 0));
await comprobarQue('trae columnas de verdad, como "Unidad"',
  pagina.locator('#campos-catalogo-ficha-lista .fila-tipo').filter({ hasText: 'Unidad' }).count().then((n) => n === 1));

/* ============================================================
   2. La pestaña Calculados: "Curso" de respaldo, sin haber guardado nada
   ============================================================ */
console.log('--- 2. la pestaña Calculados, con "Curso" de respaldo ---');
await pagina.click('#campos-catalogo-pestanas .pestana-categoria[data-pestana="calculados"]');
await pagina.waitForSelector('#campos-calc-lista');
await comprobarQue('"Curso" ya sale, aunque campos.json no exista todavía',
  pagina.locator('#campos-calc-lista .fila-tipo').filter({ hasText: 'Curso' }).count().then((n) => n === 1));

/* ============================================================
   3. Crear un campo calculado nuevo, con vista previa
   ============================================================ */
console.log('--- 3. crear un campo calculado, con vista previa ---');
await pagina.click('#campos-calc-crear');
await pagina.waitForSelector('#calc-nombre');
await pagina.fill('#calc-nombre', 'Nivel');
await pagina.click('[data-cat="ALUMNADO"]');
/* Origen "El grupo" ya viene elegido de partida; operación por
   defecto "Quitar los últimos caracteres" también: se cambia a
   "Quitar los primeros caracteres", con n=1, para sacar del "1ºA"
   compacto algo distinto de "Curso" (que ya quita del final). */
await pagina.selectOption('#calc-operacion', 'quitarInicio');
await pagina.waitForSelector('#p-n');
await pagina.fill('#p-n', '1');
await pagina.waitForTimeout(200);

await comprobarQue('la vista previa dice con quién se prueba',
  pagina.locator('#calc-preview').textContent().then((t) => t.indexOf('Probando con:') !== -1));
await comprobarQue('y enseña algún resultado (puede estar vacío para esa persona, pero no revienta)',
  pagina.locator('#calc-preview').textContent().then((t) => t.indexOf('Resultado:') !== -1));

await pagina.click('#calc-guardar');
await pagina.waitForSelector('#calc-nombre', { state: 'detached' });
await pagina.waitForTimeout(200);

await comprobarQue('el nuevo calculado se ha guardado en campos.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('campos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    return (j.calculados || []).some((c) => c.nombre === 'Nivel');
  }));

/* ============================================================
   4. Al crearlo, se añade solo al tipo (todavía sin guardar), y
      "← Volver" avisa antes de perderlo
   ============================================================ */
console.log('--- 4. se añade al tipo, y "Volver" avisa si no se guarda ---');
await pagina.click('#campos-catalogo-volver');
await pagina.waitForSelector('#campos-puestos');
await comprobarQue('"Nivel" ya sale en los campos puestos, sin guardar todavía',
  pagina.locator('#campos-puestos .fila-tipo').filter({ hasText: 'Nivel' }).count().then((n) => n === 1));

await pagina.click('#pantalla-tipo-asunto .boton-volver');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('avisa de que hay campos sin guardar',
  pagina.locator('#cuadro-titulo').textContent(), 'Salir sin guardar');
await pagina.click('#cuadro-cancelar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await comprobarQue('cancelando, se queda en la pantalla del tipo',
  pagina.evaluate(() => !document.getElementById('pantalla-tipo-asunto').classList.contains('oculto')));

await pagina.click('#campos-guardar');
await pagina.waitForTimeout(200);
await pagina.click('#pantalla-tipo-asunto .boton-volver');
await pagina.waitForTimeout(200);
await comprobarQue('guardado ya, "Volver" no pregunta nada',
  pagina.evaluate(() => !document.getElementById('pantalla-tipo-asunto').classList.contains('oculto')).then((sigue) => !sigue));

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
