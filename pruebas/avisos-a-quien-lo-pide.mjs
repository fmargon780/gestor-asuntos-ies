/* Prueba en navegador de verdad de "avisar a quien lo pide" y "Enviar
   estado" (27-sep-2026, fila 195, docs/AVISOS-A-QUIEN-LO-PIDE.md,
   apartados 1, 2 y 3):

     - un asunto con "Lo pide" con correo y un hito con la casilla
       "avisar a quien lo pide" encendida: marcar ese hito abre el
       cuadro de Correo, relleno con el correo de quien lo pide y el
       texto de "Aviso de avance" (con el hito y su número);
     - "Esta vez no" lo cierra sin enviar nada, y no vuelve a abrirse
       si se desmarca y se vuelve a marcar el mismo hito;
     - un asunto sin "Lo pide" no abre nada al marcar ese mismo hito;
     - "Enviar estado", desde la ficha, abre el mismo cuadro.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, con el mismo
   patrón de escritura directa en _GESTOR que pruebas/inicio.mjs. */
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
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= LOS DATOS DE PRUEBA ================= */

const CON_LOPIDE = '260901 TRASLADO 26-27 Uno Reves, Ana 1111';
const SIN_LOPIDE = '260902 TRASLADO 26-27 Familia Espera, Bea 2222';

await pagina.evaluate(async ({ CON_LOPIDE, SIN_LOPIDE }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CON_LOPIDE, { create: true });
  await abiertos.getDirectoryHandle(SIN_LOPIDE, { create: true });
  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }

  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO' }]);
  await escribir('asuntos.json', {
    asuntos: {
      [CON_LOPIDE]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Reves, Ana 1111',
        loPide: { nombre: 'Ana Pide', correo: 'ana.pide@ejemplo.com', via: 'presencial', fecha: '2026-09-01' } },
      [SIN_LOPIDE]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Familia Espera, Bea 2222' }
    }
  });
  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: {
      [CON_LOPIDE]: { creados: '2026-09-01', hitos: [
        { id: 'h1', titulo: 'Pedir papeles', estado: 'hecho', responsable: 'administracion' },
        { id: 'h2', titulo: 'Confirmar la plaza', estado: 'pendiente', responsable: 'administracion',
          avisarLoPide: true, avisarLoPidePlantilla: '' }
      ] },
      [SIN_LOPIDE]: { creados: '2026-09-01', hitos: [
        { id: 'h1', titulo: 'Pedir papeles', estado: 'hecho', responsable: 'administracion' },
        { id: 'h2', titulo: 'Confirmar la plaza', estado: 'pendiente', responsable: 'administracion',
          avisarLoPide: true, avisarLoPidePlantilla: '' }
      ] }
    }
  });
  await App.cargarRegistro();
  await App.cargarTipos();
}, { CON_LOPIDE, SIN_LOPIDE });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr');

/* ================= 1. MARCAR EL HITO ABRE EL CUADRO, RELLENO ================= */
console.log('--- 1. marcar el hito abre el cuadro, con quien lo pide y el "Aviso de avance" ---');

await pagina.locator('.tarjeta-nombre', { hasText: 'Uno Reves' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);

await pagina.locator('#ficha-guia .hito[data-id="h2"] .hito-casilla').check();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#correo-formulario');

await comprobar('el título del cuadro es el de Correo',
  pagina.locator('#cuadro-titulo').textContent(), 'Correo de este asunto');
await comprobar('el botón de cerrar dice "Esta vez no"',
  pagina.locator('#cuadro-aceptar').textContent(), 'Esta vez no');
await comprobar('el correo de quien lo pide sale en "Otro correo" (sin correo de Séneca)',
  pagina.inputValue('#correo-otro'), 'ana.pide@ejemplo.com');
await comprobar('el cuerpo trae el título del hito',
  pagina.inputValue('#correo-cuerpo-texto').then(t => t.indexOf('Confirmar la plaza') !== -1), true);
await comprobar('el cuerpo dice "el hito 2 de 2"',
  pagina.inputValue('#correo-cuerpo-texto').then(t => t.indexOf('hito 2 de 2') !== -1), true);

/* ================= 2. "ESTA VEZ NO": NO VUELVE A PREGUNTAR ================= */
console.log('--- 2. "Esta vez no" cierra, y no vuelve a preguntar por ese hito ---');

await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

await pagina.locator('#ficha-guia .hito[data-id="h2"] .hito-casilla').uncheck();
await pagina.waitForTimeout(300);
await pagina.locator('#ficha-guia .hito[data-id="h2"] .hito-casilla').check();
await pagina.waitForTimeout(500);
await comprobar('la segunda vez no se abre ningún cuadro',
  pagina.locator('#capa:not(.oculto)').count(), 0);

/* ================= 3. SIN "LO PIDE", NO SE ABRE NADA ================= */
console.log('--- 3. un asunto sin "Lo pide" no abre nada al marcar el mismo hito ---');

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.locator('.tarjeta-nombre', { hasText: 'Familia Espera' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);

await pagina.locator('#ficha-guia .hito[data-id="h2"] .hito-casilla').check();
await pagina.waitForTimeout(500);
await comprobar('sin "Lo pide" con correo, no se abre ningún cuadro',
  pagina.locator('#capa:not(.oculto)').count(), 0);

/* ================= 4. "ENVIAR ESTADO" DESDE LA FICHA ================= */
console.log('--- 4. "Enviar estado" abre el cuadro desde la ficha ---');

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.locator('.tarjeta-nombre', { hasText: 'Uno Reves' }).first().click();
await pagina.waitForSelector('#ficha-acciones .ficha-encargo');
await pagina.click('#ficha-acciones .ficha-encargo button:has-text("El encargo")');
await pagina.waitForSelector('#lopide-enviar-estado');
await pagina.click('#lopide-enviar-estado');
await pagina.waitForSelector('#correo-formulario');
await comprobar('el botón de cerrar es el normal, "Cerrar" (sin "Esta vez no")',
  pagina.locator('#cuadro-aceptar').textContent(), 'Cerrar');
await comprobar('el correo de quien lo pide sigue saliendo',
  pagina.inputValue('#correo-otro'), 'ana.pide@ejemplo.com');

/* ================= FIN ================= */

if (errores.length) { fallos++; console.log('FALLA  errores de consola:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
