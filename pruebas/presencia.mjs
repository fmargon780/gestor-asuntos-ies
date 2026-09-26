/* Prueba en navegador de verdad de "no pisarse en un mismo asunto"
   (17-sep-2026, fila 24 de la cola, docs/NO-PISARSE-EN-UN-ASUNTO.md;
   reescrita el 26-sep-2026, fila 176, docs/DATOS-ENTRE-ORDENADORES.md,
   punto 5: presencia.json pasa a un fichero por usuario dentro de
   _GESTOR/presencia, para que dos ordenadores no dejen copias en
   conflicto).

   Como en pruebas/conflictos.mjs, la "otra persona" se simula
   escribiendo directamente en el disco de mentira (window.__disco),
   sin necesidad de dos pestañas ni dos navegadores. Reutiliza el
   disco de pruebas/navegador.mjs. */
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
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* El nombre del fichero de cada usuario es su "hueso" (U.hueso, sin
   tildes, mayúsculas ni espacios): se calcula en la propia página, con
   la misma función que usa la aplicación, para no duplicar la reducción
   aquí. */
async function ficheroDe(usuario) {
  return pagina.evaluate((u) => window.U.hueso(u) + '.json', usuario);
}

async function leerPresenciaDe(usuario) {
  const nombre = await ficheroDe(usuario);
  return pagina.evaluate(async (nombre) => {
    try {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const p = await g.getDirectoryHandle('presencia');
      const h = await p.getFileHandle(nombre);
      return JSON.parse(await (await h.getFile()).text());
    } catch (e) { return null; }
  }, nombre);
}

async function escribirPresenciaDe(usuario, asuntos) {
  const nombre = await ficheroDe(usuario);
  await pagina.evaluate(async ([usuario, nombre, asuntos]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const p = await g.getDirectoryHandle('presencia', { create: true });
    p._hijos.set(nombre, window.__disco.fich(nombre, JSON.stringify({ usuario, asuntos })));
  }, [usuario, nombre, asuntos]);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Alguien 1140233', { create: true });
  await window.__disco.abiertos.getDirectoryHandle('260902 MATRICULA 26-27 Otra Persona 1140777', { create: true });
});
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);

console.log('--- 1) al abrir la ficha, se anuncia la propia señal ---');
await pagina.locator('#lista-abiertos .tarjeta').filter({ hasText: 'Alguien 1140233' })
  .locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(200);
await comprobar('el fichero de Ana lleva su propia señal',
  leerPresenciaDe('Ana').then(p => p && p.asuntos && p.asuntos['260901 MATRICULA 26-27 Alguien 1140233'] &&
    p.usuario), 'Ana');
await comprobar('no sale ningún aviso: el asunto es solo suyo',
  pagina.locator('.aviso-presencia').count(), 0);
await comprobar('el desplegable de estado está activo',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), false);

console.log('--- 2) al volver a la lista, se quita la propia señal ---');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);
await comprobar('el fichero de Ana ya no tiene esa clave',
  leerPresenciaDe('Ana').then(p => p && Object.prototype.hasOwnProperty.call(p.asuntos, '260901 MATRICULA 26-27 Alguien 1140233')), false);

console.log('--- 3) el compañero ya está dentro: modo consulta ---');
await escribirPresenciaDe('Juan', {
  '260901 MATRICULA 26-27 Alguien 1140233': { ultima: new Date().toISOString() }
});
await pagina.locator('#lista-abiertos .tarjeta').filter({ hasText: 'Alguien 1140233' })
  .locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.aviso-presencia');
await comprobar('el aviso nombra a Juan',
  pagina.locator('.aviso-presencia').textContent().then(t => t.indexOf('Juan') !== -1 &&
    t.indexOf('no puedes modificar') !== -1), true);
await comprobar('el desplegable de estado está apagado',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), true);
await comprobar('el botón de archivar está apagado',
  pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).isDisabled(), true);
await comprobar('pero "Volver a la lista" sigue activo',
  pagina.locator('#ficha-volver').isDisabled(), false);
await comprobar('"Tomar el mando" está y activo',
  pagina.getByRole('button', { name: 'Tomar el mando', exact: true }).isDisabled(), false);
await comprobar('el fichero de Juan sigue con su señal (no se ha pisado solo)',
  leerPresenciaDe('Juan').then(p => !!(p && p.asuntos['260901 MATRICULA 26-27 Alguien 1140233'])), true);

console.log('--- 4) tomar el mando ---');
await pagina.getByRole('button', { name: 'Tomar el mando', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);
await comprobar('el aviso desaparece', pagina.locator('.aviso-presencia').count(), 0);
await comprobar('el desplegable de estado vuelve a estar activo',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), false);
await comprobar('el fichero de Ana ahora tiene la señal (tomó el mando)',
  leerPresenciaDe('Ana').then(p => !!(p && p.asuntos['260901 MATRICULA 26-27 Alguien 1140233'])), true);

await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);

console.log('--- 5) una señal caducada no cuenta como ocupado ---');
await escribirPresenciaDe('Juan', {
  '260902 MATRICULA 26-27 Otra Persona 1140777': { ultima: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
});
await pagina.locator('#lista-abiertos .tarjeta').filter({ hasText: 'Otra Persona 1140777' })
  .locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(200);
await comprobar('no sale ningún aviso: la señal ya había caducado',
  pagina.locator('.aviso-presencia').count(), 0);
await comprobar('el desplegable de estado está activo',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), false);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);

console.log('--- 6) la marca en la tarjeta de la lista ---');
await escribirPresenciaDe('Juan', {
  '260901 MATRICULA 26-27 Alguien 1140233': { ultima: new Date().toISOString() }
});
await pagina.evaluate(async () => {
  await window.Presencia.refrescarCache();
  window.App.pintarAbiertos();
});
await pagina.waitForTimeout(100);
await comprobar('la tarjeta de Juan lleva la marca',
  pagina.locator('#lista-abiertos .tarjeta').filter({ hasText: 'Alguien 1140233' })
    .locator('.marca-presencia').count(), 1);
await comprobar('la otra tarjeta no lleva ninguna',
  pagina.locator('#lista-abiertos .tarjeta').filter({ hasText: 'Otra Persona 1140777' })
    .locator('.marca-presencia').count(), 0);

console.log('--- 7) presencia/ queda fuera de copias y papelera ---');
await comprobar('no está en la lista de ficheros protegidos por Copias',
  pagina.evaluate(() => window.Copias.FICHEROS.indexOf('presencia.json')), -1);
await comprobar('no hay ninguna copia de seguridad de un fichero de presencia', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  let copias;
  try { copias = await g.getDirectoryHandle('copias'); } catch (e) { return true; }
  const nombres = [];
  for await (const p of copias.entries()) nombres.push(p[0]);
  return !nombres.some(n => n.indexOf('presencia') !== -1);
}), true);

console.log('--- 8) presencia.json viejo (de antes de la fila 176) se borra solo al entrar ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('presencia.json', window.__disco.fich('presencia.json', JSON.stringify({ x: 1 })));
  g._hijos.set("presencia (Juan's conflicted copy 2026-09-26).json",
    window.__disco.fich("presencia (Juan's conflicted copy 2026-09-26).json", JSON.stringify({ x: 1 })));
  await window.Presencia.borrarFicheroViejo();
});
await comprobar('presencia.json viejo ha desaparecido', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const nombres = [];
  for await (const p of g.entries()) nombres.push(p[0]);
  return nombres.some(n => n.indexOf('presencia') === 0 && n !== 'presencia');
}), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
