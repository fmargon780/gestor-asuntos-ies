/* Prueba en navegador de verdad de la fila 338 (docs/ANADIR-VARIOS-MAS-CLARO.md): el cuadro «Añadir varios
   relacionados», con la ventana baja (1280×650) para que no quepa entero.

   1. Cancelar y el botón principal se ven siempre, aunque se desplace el cuerpo.
   2. Sin nadie señalado, Cancelar cierra sin preguntar y el asunto no cambia.
   3. Con tres señalados, Cancelar, la ✕ y Esc preguntan una vez («¿Descartar los 3 señalados?»);
      «Seguir eligiendo» no pierde nada y «Descartar» cierra sin añadir.
   4. El botón principal dice «Añadir al asunto los N» y mete a los N.
   5. Los atajos de alumnado salen debajo del buscador, solo con ALUMNADO.
   6. Los miembros de un grupo de Ajustes, sin cambiar nada, se cierran sin preguntar.
   7. La regla pura (qué se descarta y el texto de la pregunta). */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 650 } });
const pagina = await contexto.newPage();
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.goto(BASE + '?demo=1&auto=1');
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForFunction(() => App.E.listaAbiertos && App.E.listaAbiertos.length > 5 && !(window.Demo && Demo.montando), null, { timeout: 60000 });
await pagina.waitForTimeout(1500);

const abrir = () => pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter((x) => x.ficha && x.ficha.categoria === 'ALUMNADO')[0] || App.E.listaAbiertos[0];
  window.__a = a; window.__nombre = a.nombre;
  window.__fin = Relacionados.agregarVarios(a).then((r) => { window.__hecho = r; return r; });
  window.__hecho = undefined;
});
const abierto = () => pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto'));
const relacionados = () => pagina.evaluate(() => {
  const f = (App.E.registro.asuntos || {})[window.__nombre] || (App.E.listaAbiertos.filter((x) => x.nombre === window.__nombre)[0] || {}).ficha || {};
  return (f.relacionados || []).length;
});
async function buscarYMarcar(n) {
  await pagina.click('.categoria-mini-boton:has-text("ALUMNADO")');
  await pagina.fill('#rel-buscar', 'ar');
  await pagina.waitForSelector('.resultado-casilla', { timeout: 10000 });
  const cuantas = await pagina.locator('.resultado-casilla').count();
  for (let i = 0; i < Math.min(n, cuantas); i++) await pagina.locator('.resultado-casilla').nth(i).check();
  return Math.min(n, cuantas);
}

console.log('--- 1. el pie siempre a la vista ---');
await abrir();
await pagina.waitForSelector('#rel-cancelar');
const posicion = () => pagina.evaluate(() => {
  const c = document.getElementById('rel-cancelar').getBoundingClientRect(), p = document.getElementById('rel-marcados-anadir').getBoundingClientRect();
  return { dentro: c.bottom <= window.innerHeight && p.bottom <= window.innerHeight && c.top >= 0 && p.top >= 0, y: Math.round(c.top) };
});
const antes = await posicion();
comprobar('1. Cancelar y el principal están dentro de la pantalla', antes.dentro, true);
await buscarYMarcar(3);
await pagina.evaluate(() => { document.getElementById('cuadro-cuerpo').scrollTop = 99999; });
const despues = await posicion();
comprobar('1. con lo señalado y el cuerpo desplazado, siguen dentro de la pantalla', despues.dentro, true);
comprobar('1. el botón «Aceptar» común no se ve', await pagina.locator('#cuadro-aceptar').isVisible(), false);

console.log('--- 3. con gente señalada, pregunta ---');
const n = await pagina.evaluate(() => document.querySelectorAll('#varios-pie .marcado-chip').length);
comprobar('3. hay señalados en el pie', n >= 1, true);
comprobar('4. el botón principal dice «Añadir al asunto los N»', await pagina.locator('#rel-marcados-anadir').textContent(), n === 1 ? 'Añadir al asunto 1' : 'Añadir al asunto los ' + n);
const pregunta = () => pagina.evaluate(() => { const p = document.getElementById('varios-pie-pregunta'); return p.classList.contains('oculto') ? '' : p.textContent; });
const textoP = n === 1 ? '¿Descartar 1 señalado?' : '¿Descartar los ' + n + ' señalados?';
await pagina.click('#rel-cancelar');
comprobar('3. Cancelar pregunta', (await pregunta()).indexOf(textoP) !== -1, true);
await pagina.click('#varios-seguir');
comprobar('3. «Seguir eligiendo» lo deja todo como estaba', [await abierto(), await pagina.locator('#varios-pie .marcados-cuenta').textContent()], [true, n + (n === 1 ? ' señalado' : ' señalados')]);
await pagina.click('#varios-cerrar');
comprobar('3. la ✕ pregunta lo mismo', (await pregunta()).indexOf(textoP) !== -1, true);
await pagina.keyboard.press('Escape');
comprobar('3. Esc con la pregunta puesta sigue eligiendo (una sola pregunta)', [await pregunta(), await abierto()], ['', true]);
await pagina.keyboard.press('Escape');
comprobar('3. Esc pregunta', (await pregunta()).indexOf(textoP) !== -1, true);
await pagina.click('#varios-descartar');
await pagina.waitForTimeout(300);
comprobar('3. «Descartar» cierra y el asunto no cambia', [await abierto(), await relacionados()], [false, 0]);

console.log('--- 2. sin nadie señalado ---');
await abrir();
await pagina.waitForSelector('#rel-cancelar');
comprobar('2. sin nadie: «Nadie señalado todavía» y el principal apagado', await pagina.evaluate(() => [document.querySelector('#varios-pie .marcados-cuenta').textContent, document.getElementById('rel-marcados-anadir').disabled]), ['Nadie señalado todavía', true]);
await pagina.click('#rel-cancelar');
await pagina.waitForTimeout(200);
comprobar('2. Cancelar cierra sin preguntar y el asunto no cambia', [await abierto(), await relacionados()], [false, 0]);

console.log('--- 5. el orden de arriba ---');
await abrir();
await pagina.waitForSelector('#rel-cancelar');
await pagina.click('.categoria-mini-boton:has-text("ALUMNADO")');
await pagina.waitForSelector('#rel-atajos .atajo-fila', { timeout: 10000 }).catch(() => {});
const orden = await pagina.evaluate(() => {
  const y = (s) => { const e = document.querySelector(s); return e && e.offsetParent ? Math.round(e.getBoundingClientRect().top) : null; };
  return { pestanas: y('#rel-categorias'), buscador: y('#rel-buscador'), atajos: y('#rel-atajos'), pegar: y('#rel-pegar-fila') };
});
comprobar('5. con ALUMNADO: pestañas, buscador, atajos y «Pegar una lista», de arriba abajo', orden.pestanas < orden.buscador && orden.buscador < orden.atajos && orden.atajos < orden.pegar, true);
await pagina.click('.categoria-mini-boton:has-text("PERSONAL")');
await pagina.waitForTimeout(300);
comprobar('5. con PERSONAL no salen los atajos', await pagina.evaluate(() => { const e = document.getElementById('rel-atajos'); return !e.offsetParent; }), true);
await pagina.click('#rel-cancelar');

console.log('--- 4. añadir de verdad ---');
await abrir();
await pagina.waitForSelector('#rel-cancelar');
const m = await buscarYMarcar(2);
await pagina.click('#rel-marcados-anadir');
await pagina.waitForFunction(() => window.__hecho !== undefined, null, { timeout: 15000 });
comprobar('4. al pulsarlo, los señalados quedan en el asunto', [await abierto(), await relacionados() >= 1, await pagina.evaluate(() => window.__hecho)], [false, true, true]);

console.log('--- 6. los miembros de un grupo de Ajustes ---');
await pagina.evaluate(() => {
  window.__g = undefined;
  App.editarMiembrosDeGrupo({ id: 'g-prueba', nombre: 'Prueba', miembros: [{ categoria: 'ALUMNADO', nombre: 'Nadie Conocido, Pepe 0000000' }] }).then((r) => { window.__g = r; });
});
await pagina.waitForSelector('#rel-cancelar');
comprobar('6. el pie está en el cuadro de grupos', await pagina.evaluate(() => document.querySelector('#varios-pie .marcados-cuenta').textContent), '1 señalado');
await pagina.click('#rel-cancelar');
await pagina.waitForTimeout(200);
comprobar('6. sin cambiar nada, cierra sin preguntar', [await abierto(), await pagina.evaluate(() => window.__g)], [false, false]);

console.log('--- 7. la regla ---');
comprobar('7. nadie señalado: no hay nada que descartar', await pagina.evaluate(() => VariosCuadro._hayQueDescartar([], null)), false);
comprobar('7. lo mismo que entró: no se pregunta', await pagina.evaluate(() => VariosCuadro._hayQueDescartar([{ categoria: 'A', nombre: 'x' }], [{ categoria: 'A', nombre: 'x' }])), false);
comprobar('7. algo nuevo: se pregunta', await pagina.evaluate(() => VariosCuadro._hayQueDescartar([{ categoria: 'A', nombre: 'x' }, { categoria: 'A', nombre: 'y' }], [{ categoria: 'A', nombre: 'x' }])), true);
comprobar('7. singular y plural', await pagina.evaluate(() => [VariosCuadro._textoPregunta(1), VariosCuadro._textoPregunta(3)]), ['¿Descartar 1 señalado?', '¿Descartar los 3 señalados?']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
