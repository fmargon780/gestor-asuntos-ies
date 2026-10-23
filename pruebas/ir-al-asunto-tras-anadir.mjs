/* Prueba en navegador de verdad de la fila 449 (docs/IR-AL-ASUNTO-TRAS-ANADIR.md):
   ir al asunto tras guardarle un documento desde «Ver todo».

   1. El aviso «Documento guardado en…» con «Ir al asunto» no se borra solo (pasan más de 8 s) y lleva ✕.
   2. Guardar otro quita el aviso viejo: nunca dos a la vez. La ✕ lo cierra. Salir de «Ver todo» lo quita.
   3. «Ir al asunto» abre «Trabajo» con el hito en curso; guardado desde un hito, con ese hito.
   4. «← Volver a Ver todo» vuelve a «Ver todo», a la misma parte; abierta de otra forma, «← Volver».
   5. El documento ya no sale en «Ver todo» ni queda en el disco.
   6. Si no se puede borrar el original de la bandeja: aviso ámbar y el aviso con «Ir al asunto» sale igual.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

const visible = (p) => pagina.evaluate((p) => !document.getElementById('pantalla-' + p).classList.contains('oculto'), p);
const avisosConIr = () => pagina.locator('#mensajes .mensaje:has(.mensaje-boton)').count();
const textoVolver = () => pagina.evaluate(() => (document.getElementById('ficha-volver') || {}).textContent || '');

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Un asunto abierto con tres hitos: hecho, en curso y por venir. */
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 CONSULTA Prueba Ir, Ana 5550001', { create: true });
  App.ir('abiertos'); await App.verAbiertos();
});
const DESTINO = await pagina.evaluate(async () => {
  const nombre = App.E.listaAbiertos[0].nombre;
  await Hitos.cambiar(function (datos) {
    datos.porAsunto[nombre] = { creados: U.ahora(), hitos: [
      { id: 'h-hecho', titulo: 'Primero', estado: 'hecho' },
      { id: 'h-curso', titulo: 'Segundo', estado: 'encurso' },
      { id: 'h-luego', titulo: 'Tercero', estado: 'pendiente' }
    ] };
    return datos;
  });
  return nombre;
});

/* Crea un suelto y lo guarda en el asunto; cierra el cuadro de ponerle nombre. */
async function guardar(nombreFichero, opciones) {
  await pagina.evaluate(async (n) => {
    const h = await window.__disco.abiertos.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write('%PDF-1.4 prueba'); await w.close();
  }, nombreFichero);
  const hecho = pagina.evaluate(([n, d, o]) => App.llevarSueltoA({ nombre: n }, d, {}, o || undefined), [nombreFichero, DESTINO, opciones || null]);
  await pagina.waitForSelector('#capa:not(.oculto)', { timeout: 10000 });
  await pagina.click('#cuadro-aceptar');
  await hecho;
}

/* ============================================================
   1 y 5. El aviso se queda; el documento ya no sale en «Ver todo»
   ============================================================ */
console.log('--- 1. el aviso se queda ---');
await pagina.evaluate(() => App.irVista('clasificar', 'documentos'));
await guardar('uno.pdf');
await pagina.locator('#mensajes .mensaje-boton', { hasText: 'Ir al asunto' }).waitFor({ timeout: 5000 });
await comprobar('1. el aviso lleva «Ir al asunto» y una ✕', pagina.locator('#mensajes .mensaje-cerrar').count(), 1);
await pagina.waitForTimeout(9500);
await comprobar('1. pasados más de 8 s, sigue ahí', avisosConIr(), 1);
await comprobar('5. el documento ya no sale en «Ver todo»', pagina.evaluate(() => document.getElementById('zona-clasificar').textContent.indexOf('uno.pdf') !== -1), false);
await comprobar('5. ni está en la bandeja del disco', pagina.evaluate(async () => { try { await window.__disco.abiertos.getFileHandle('uno.pdf'); return true; } catch (e) { return false; } }), false);

console.log('--- 2. nunca dos, ✕ y salir de «Ver todo» ---');
await guardar('dos.pdf');
await pagina.waitForTimeout(200);
await comprobar('2. guardar otro deja un solo aviso', avisosConIr(), 1);
await pagina.locator('#mensajes .mensaje-cerrar').click();
await comprobar('2. la ✕ lo cierra', avisosConIr(), 0);
await guardar('tres.pdf');
await comprobar('2. otro aviso nuevo', avisosConIr(), 1);
await pagina.evaluate(() => App.ir('archivo'));
await pagina.waitForTimeout(150);
await comprobar('2. salir de «Ver todo» a otra pantalla lo quita', avisosConIr(), 0);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.evaluate(() => App.irVista('clasificar', 'documentos'));
await guardar('tres-b.pdf');
await pagina.evaluate(() => App.irVista('departamento'));
await pagina.waitForTimeout(150);
await comprobar('2. salir de «Ver todo» a Inicio lo quita', avisosConIr(), 0);

/* ============================================================
   3 y 4. Ir al asunto: Trabajo, hito; volver a «Ver todo»
   ============================================================ */
console.log('--- 3 y 4. «Ir al asunto» y «← Volver a Ver todo» ---');
await pagina.evaluate(() => App.irVista('clasificar', 'documentos'));
await guardar('cuatro.pdf');
await pagina.locator('#mensajes .mensaje-boton', { hasText: 'Ir al asunto' }).click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);
await comprobar('3. abre la ficha de ese asunto', pagina.evaluate((d) => (document.querySelector('#pantalla-asunto .ficha-nombre') || {}).textContent.indexOf(d.slice(0, 20)) !== -1, DESTINO), true);
await comprobar('3. en la pestaña «Trabajo»', pagina.evaluate(() => FichaTarjetas.abierta()), 'trabajo');
await comprobar('3. con el hito en curso en la mesa', pagina.evaluate(() => (HitoMesa.abierta() || {}).idHito), 'h-curso');
await comprobar('3. el aviso se ha cerrado', avisosConIr(), 0);
await comprobar('4. el botón dice «← Volver a Ver todo»', textoVolver(), '← Volver a Ver todo');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);
await comprobar('4. vuelve a Inicio', visible('abiertos'), true);
await comprobar('4. en «Ver todo»', pagina.evaluate(() => App.E.vista), 'clasificar');
await comprobar('4. a la misma parte (solo documentos)', pagina.evaluate(() => App.E.soloQueClasificar), 'documentos');
await comprobar('4. y «Ver todo» está a la vista', pagina.evaluate(() => !document.getElementById('zona-clasificar').classList.contains('oculto')), true);

console.log('--- 3. guardado desde un hito: ese hito ---');
await guardar('cinco.pdf', { hito: { id: 'h-luego' } });
await pagina.locator('#mensajes .mensaje-boton', { hasText: 'Ir al asunto' }).click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);
await comprobar('3. abre la mesa de ese hito', pagina.evaluate(() => (HitoMesa.abierta() || {}).idHito), 'h-luego');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);

console.log('--- 4. abierta de otra forma: «← Volver» ---');
await pagina.evaluate(() => App.irVista('departamento'));
await pagina.evaluate((d) => {
  App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === d)[0], 'abierto');
}, DESTINO);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('4. el botón dice «← Volver»', textoVolver(), '← Volver');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);

/* ============================================================
   6. No se puede quitar el original de la bandeja
   ============================================================ */
console.log('--- 6. el original no se puede borrar ---');
await pagina.evaluate(() => App.irVista('clasificar'));
const intentos = await pagina.evaluate(() => {
  const dir = window.__disco.abiertos;
  const buena = dir.removeEntry.bind(dir);
  window.__intentosBorrar = 0;
  dir.removeEntry = async function (n, o) {
    if (n === 'seis.pdf') { window.__intentosBorrar++; const e = new Error('bloqueado'); e.name = 'NoModificationAllowedError'; throw e; }
    return buena(n, o);
  };
  return true;
});
await guardar('seis.pdf');
await pagina.locator('#mensajes .mensaje-boton', { hasText: 'Ir al asunto' }).waitFor({ timeout: 5000 });
await comprobar('6. se intenta dos veces', pagina.evaluate(() => window.__intentosBorrar), 2);
await comprobar('6. sale el aviso ámbar', pagina.locator('#mensajes .mensaje.ambar', { hasText: 'ya está en el asunto, pero no he podido quitarlo de la bandeja. Bórralo de Ver todo' }).count(), 1);
await comprobar('6. y el aviso con «Ir al asunto» sale igual', avisosConIr(), 1);
await comprobar('6. el documento está dentro del asunto', pagina.evaluate(async (d) => {
  const dir = await window.__disco.abiertos.getDirectoryHandle(d);
  try { await dir.getFileHandle('seis.pdf'); return true; } catch (e) { return false; }
}, DESTINO), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
