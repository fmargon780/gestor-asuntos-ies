/* Arreglo de la fila 103 (docs/EL-HITO-MESA-DE-TRABAJO.md, sección 1,
   camino «Desde "Por clasificar"»): el documento que entra desde
   «Por clasificar» queda apuntado al hito nada más entrar, aunque se
   cierre el cuadro sin ponerle nombre; si se le pone nombre, en el
   hito queda solo el nombre nuevo; y el hito sigue desplegado.

   Con el navegador de verdad y el disco de mentira de
   pruebas/navegador.mjs. */
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

const GUIA = { MATRICULA: [{ id: 'p1', titulo: 'Recoger la solicitud' }, { id: 'p2', titulo: 'Comprobar' }] };
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (GUIA) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(GUIA)); await w.close();
}, GUIA);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const A = '260920 MATRICULA Uno, Ana 1150001';
const PRIMERO = 'escaneo 0001.pdf';
const SEGUNDO = 'escaneo 0002.pdf';
await pagina.evaluate(async ([A, PRIMERO, SEGUNDO]) => {
  await window.__disco.abiertos.getDirectoryHandle(A, { create: true });
  await App.anotar(A, { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: 'Uno, Ana 1150001', abiertoEl: U.ahora() });
  await App.verAbiertos();
  const sueltos = [];
  for (const n of [PRIMERO, SEGUNDO]) {
    const f = window.__disco.fich(n, '%PDF-1.4 ' + n);
    window.__disco.abiertos._hijos.set(n, f);
    sueltos.push({ nombre: n, handle: f });
  }
  App.E.sueltos = sueltos;
  await Hitos.hitosDe(A);
  App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === A)[0], 'abierto');
}, [A, PRIMERO, SEGUNDO]);
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]');
await pagina.waitForTimeout(500);
const hito1 = pagina.locator('#ficha-guia .hito[data-id="p1"]');

async function meter(nombre) {
  if (await pagina.evaluate(() => document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-cuerpo').classList.contains('oculto'))) {
    await hito1.locator('.hito-titulo').click();
  }
  await hito1.locator('.hito-anadir-documento').click();
  await hito1.locator('.ficha-menu-opcion', { hasText: 'Por clasificar' }).click();
  await pagina.waitForSelector('.enlace-asunto');
  await pagina.locator('.enlace-asunto', { hasText: nombre }).click();
  await pagina.waitForSelector('#doc-cuerpo #doc-guardar');
}
async function estado() {
  return pagina.evaluate(async (A) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(A);
    return {
      docs: (await Hitos.hitosDe(A)).filter(x => x.id === 'p1')[0].documentos,
      carpeta: Array.from(c._hijos.keys()).sort(),
      desplegado: !document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-cuerpo').classList.contains('oculto'),
      enLaFicha: !document.getElementById('pantalla-asunto').classList.contains('oculto')
    };
  }, A);
}

console.log('--- 1. se cierra el cuadro sin ponerle nombre ---');
await meter(PRIMERO);
await comprobar('se abre directamente el formulario de ponerle nombre a ese documento',
  pagina.locator('#doc-vista').count(), 1);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(700);
const r1 = await estado();
await comprobar('queda apuntado al hito con el nombre que traía', Promise.resolve(r1.docs), [PRIMERO]);
await comprobar('está en la carpeta del asunto', Promise.resolve(r1.carpeta), [PRIMERO]);
await comprobar('sin salir de la ficha, y con el hito desplegado', Promise.resolve([r1.enLaFicha, r1.desplegado]), [true, true]);

console.log('--- 2. se le pone nombre ---');
await meter(SEGUNDO);
await pagina.fill('#doc-fecha', '2026-09-07');
await pagina.fill('#doc-curso', 'prueba');
await pagina.waitForTimeout(150);
const nuevo = await pagina.locator('#doc-vista').textContent();
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(700);
const r2 = await estado();
await comprobar('en el hito queda el nombre nuevo, y no el viejo', Promise.resolve(r2.docs), [PRIMERO, nuevo]);
await comprobar('en la carpeta, con el nombre nuevo', Promise.resolve(r2.carpeta), [PRIMERO, nuevo].sort());
await comprobar('el hito sigue desplegado', Promise.resolve(r2.desplegado), true);

if (errores.length) { fallos++; console.log('FALLA  errores en la consola:\n   ' + errores.join('\n   ')); }
else console.log('bien   sin errores en la consola');

await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
