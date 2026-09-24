/* Prueba en navegador de verdad de "no pisarse en un mismo asunto"
   (17-sep-2026, fila 24 de la cola, docs/NO-PISARSE-EN-UN-ASUNTO.md).

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

async function leerPresencia() {
  return pagina.evaluate(async () => {
    try {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const h = await g.getFileHandle('presencia.json');
      return JSON.parse(await (await h.getFile()).text());
    } catch (e) { return null; }
  });
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

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
await comprobar('presencia.json lleva la señal de Ana',
  leerPresencia().then(p => p && p['260901 MATRICULA 26-27 Alguien 1140233'] &&
    p['260901 MATRICULA 26-27 Alguien 1140233'].usuario), 'Ana');
await comprobar('no sale ningún aviso: el asunto es solo suyo',
  pagina.locator('.aviso-presencia').count(), 0);
await comprobar('el desplegable de estado está activo',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), false);

console.log('--- 2) al volver a la lista, se quita la propia señal ---');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);
await comprobar('presencia.json ya no tiene esa clave',
  leerPresencia().then(p => p && Object.prototype.hasOwnProperty.call(p, '260901 MATRICULA 26-27 Alguien 1140233')), false);

console.log('--- 3) el compañero ya está dentro: modo consulta ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('presencia.json', window.__disco.fich('presencia.json', JSON.stringify({
    '260901 MATRICULA 26-27 Alguien 1140233': { usuario: 'Juan', ultima: new Date().toISOString() }
  })));
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
await comprobar('presencia.json sigue diciendo que es de Juan (no se ha pisado solo)',
  leerPresencia().then(p => p['260901 MATRICULA 26-27 Alguien 1140233'].usuario), 'Juan');

console.log('--- 4) tomar el mando ---');
await pagina.getByRole('button', { name: 'Tomar el mando', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);
await comprobar('el aviso desaparece', pagina.locator('.aviso-presencia').count(), 0);
await comprobar('el desplegable de estado vuelve a estar activo',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), false);
await comprobar('presencia.json ahora dice que es de Ana',
  leerPresencia().then(p => p['260901 MATRICULA 26-27 Alguien 1140233'].usuario), 'Ana');

await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);

console.log('--- 5) una señal caducada no cuenta como ocupado ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const vieja = new Date(Date.now() - 5 * 60 * 1000).toISOString();   /* hace 5 minutos */
  g._hijos.set('presencia.json', window.__disco.fich('presencia.json', JSON.stringify({
    '260902 MATRICULA 26-27 Otra Persona 1140777': { usuario: 'Juan', ultima: vieja }
  })));
});
await pagina.locator('#lista-abiertos .tarjeta').filter({ hasText: 'Otra Persona 1140777' })
  .locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(200);
await comprobar('no sale ningún aviso: la señal ya había caducado',
  pagina.locator('.aviso-presencia').count(), 0);
await comprobar('el desplegable de estado está activo',
  pagina.locator('#ficha-acciones .boton-vencimiento').isDisabled(), false);
await comprobar('la señal caducada se ha limpiado, y ahora es de Ana',
  leerPresencia().then(p => p['260902 MATRICULA 26-27 Otra Persona 1140777'].usuario), 'Ana');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);

console.log('--- 6) la marca en la tarjeta de la lista ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('presencia.json', window.__disco.fich('presencia.json', JSON.stringify({
    '260901 MATRICULA 26-27 Alguien 1140233': { usuario: 'Juan', ultima: new Date().toISOString() }
  })));
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

console.log('--- 7) presencia.json queda fuera de copias y papelera ---');
await comprobar('no está en la lista de ficheros protegidos por Copias',
  pagina.evaluate(() => window.Copias.FICHEROS.indexOf('presencia.json')), -1);
await comprobar('no hay ninguna copia de seguridad de presencia.json', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  let copias;
  try { copias = await g.getDirectoryHandle('copias'); } catch (e) { return true; }
  const nombres = [];
  for await (const p of copias.entries()) nombres.push(p[0]);
  return !nombres.some(n => n.indexOf('presencia') !== -1);
}), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
