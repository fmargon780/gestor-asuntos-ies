/* Prueba en navegador de verdad de la fila 326 (docs/BOTON-UNICO-DE-SOPORTE.md):
   el botón «Soporte» único se pide a Google después de cargar; aquí lo contesta un botón de mentira.

   1. Sin `soporte=1` (demostración) no sale ninguna petición a Google.
   2. Con `soporte=1`: una sola petición, a la dirección exacta, después del `load`.
   3. `SOPORTE_APP`: repositorio, versión, nombre de pantalla (cambia al cambiar de pantalla), persona,
      contexto, y un error provocado antes de que cargue el botón sale en `errores()`.
   4. Con el botón cargado, un error nuevo ya no se suma a `errores()`.
   5. Si Google no contesta: ni botón, ni aviso, ni error propio en la consola; al volver la conexión
      (`online`) se pide otra vez, y con el botón puesto no se vuelve a pedir.
   6. Con `body.con-lector` y con un cuadro abierto, el botón se aparta o se retira como toca.
   7. `vercel.json` trae los dos sitios de Google en `script-src`.
   El Gestor ya no lleva ni botón ni ventana propios: no se copia nada del botón aquí. */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const ESPERADA = 'https://script.google.com/macros/s/AKfycbz2LFRhlvnlUjr_QZFW5cuY3ayE-wmXCCg1TdtUCNDJ6SEosNMetkZP6muz1NVwFDMXhQ/exec?boton=1&repo=fmargon780/gestor-asuntos-ies';
/* El botón de mentira: apunta cuándo se ejecuta y deja lo mismo que el de verdad (la marca, `Soporte` y el elemento). */
const BOTON_FALSO = `window.__falso = { estado: document.readyState };
window.__soporteBoton = true;
window.Soporte = { abrir: function () { return true; }, cerrar: function () {}, version: 'falso', correoBueno: function () { return true; }, errores: function () { return []; } };
(function () { var h = document.createElement('div'); h.id = 'soporte-boton';
  h.style.cssText = 'position:fixed;right:var(--soporte-derecha,20px);bottom:var(--soporte-abajo,20px);width:60px;height:30px;z-index:2147483000';
  h.textContent = 'Soporte'; document.body.appendChild(h); })();`;

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Abre una página con la demostración; `contestar(ruta)` decide qué pasa con Google. */
async function abrir(parametros, contestar) {
  const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
  const pagina = await contexto.newPage();
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");   /* sin la ventana de novedades */
  const peticiones = [], errores = [];
  await pagina.route('https://script.google.com/**', async (ruta) => { peticiones.push(ruta.request().url()); await contestar(ruta); });
  pagina.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.goto(BASE + '?demo=1&auto=1' + parametros);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  return { contexto, pagina, peticiones, errores };
}
const fingir = (ruta) => ruta.fulfill({ status: 200, contentType: 'application/javascript', body: BOTON_FALSO });

/* ================= 1. sin soporte=1 no se pide nada ================= */
console.log('--- 1. la demostración no pide el botón ---');
{
  const { contexto, pagina, peticiones } = await abrir('', fingir);
  await pagina.waitForTimeout(1500);
  await comprobar('1. ninguna petición a Google, y no hay botón', [peticiones.length, await pagina.evaluate(() => !!window.__soporteBoton || !!window.Soporte)], [0, false]);
  await contexto.close();
}

/* ================= 2 a 4. con soporte=1 ================= */
console.log('--- 2 a 4. con soporte=1 ---');
{
  let soltar; const compuerta = new Promise((r) => { soltar = r; });
  const { contexto, pagina, peticiones, errores } = await abrir('&soporte=1', async (ruta) => { await compuerta; await fingir(ruta); });
  await pagina.waitForFunction(() => document.readyState === 'complete');
  await pagina.waitForTimeout(300);
  await comprobar('2. una sola petición, a la dirección exacta', [peticiones.length, peticiones[0]], [1, ESPERADA]);

  await comprobar('3. repositorio y versión', await pagina.evaluate(() => [SOPORTE_APP.repo, SOPORTE_APP.version === App.VERSION && App.VERSION.length > 5]), ['fmargon780/gestor-asuntos-ies', true]);
  const inicio = await pagina.evaluate(() => SOPORTE_APP.pantalla());
  await pagina.click('.pestana[data-pantalla="ajustes"]');
  await comprobar('3. el nombre de la pantalla cambia al cambiar de pantalla',
    [inicio, await pagina.evaluate(() => SOPORTE_APP.pantalla())], ['Inicio', 'Ajustes']);
  await comprobar('3. la persona es quien ha entrado, con su correo (vacío si no se sabe)',
    await pagina.evaluate(() => { const p = SOPORTE_APP.persona(); return [p.nombre === App.E.usuario && p.nombre.length > 0, typeof p.correo]; }), [true, 'string']);
  await comprobar('3. el contexto dice «web» y el perfil, sin datos de nadie',
    await pagina.evaluate(() => { const c = SOPORTE_APP.contexto(); return [/^web/.test(c), /perfil/.test(c), c.length <= 300]; }), [true, true, true]);
  await pagina.evaluate(() => { console.error('fallo temprano de prueba'); });
  await comprobar('3. un error provocado antes de cargar el botón sale en errores()',
    await pagina.evaluate(() => SOPORTE_APP.errores().some((e) => /fallo temprano de prueba/.test(e))), true);

  soltar();
  await pagina.waitForFunction(() => window.__soporteBoton === true);
  await comprobar('2. el botón se ejecutó después del load', await pagina.evaluate(() => window.__falso.estado), 'complete');
  await pagina.evaluate(() => { console.error('fallo tardío de prueba'); });
  await comprobar('4. con el botón cargado, un error nuevo ya no se suma a errores()',
    await pagina.evaluate(() => SOPORTE_APP.errores().some((e) => /fallo tardío de prueba/.test(e))), false);
  await comprobar('4. y los de antes se conservan', await pagina.evaluate(() => SOPORTE_APP.errores().some((e) => /fallo temprano de prueba/.test(e))), true);

  /* ================= 6. el sitio del botón ================= */
  console.log('--- 6. el sitio del botón ---');
  const derecha = () => pagina.evaluate(() => getComputedStyle(document.getElementById('soporte-boton')).right);
  await comprobar('6. sin lector, a 20 px del borde', await derecha(), '20px');
  await pagina.evaluate(() => document.body.classList.add('con-lector'));
  await comprobar('6. con el lector abierto, a la izquierda de su panel (46 % del ancho + 20 px)', await derecha(), (1400 * 0.46 + 20) + 'px');
  await pagina.evaluate(() => document.body.classList.remove('con-lector'));
  await comprobar('6. con un cuadro abierto el botón se retira',
    await pagina.evaluate(() => { const capa = document.getElementById('capa'); capa.classList.remove('oculto'); const d = getComputedStyle(document.getElementById('soporte-boton')).display; capa.classList.add('oculto'); return [d, getComputedStyle(document.getElementById('soporte-boton')).display]; }), ['none', 'block']);
  await comprobar('6. los avisos siguen saliendo por encima del botón (64 px del borde de abajo)',
    await pagina.evaluate(() => getComputedStyle(document.querySelector('.mensajes')).bottom), '64px');
  await comprobar('2 a 6. sin errores propios en la consola', errores.filter((e) => !/prueba/.test(e)), []);
  await contexto.close();
}

/* ================= 5. Google no contesta ================= */
console.log('--- 5. Google no contesta ---');
{
  let modo = 'caido';
  const { contexto, pagina, peticiones, errores } = await abrir('&soporte=1', async (ruta) => { if (modo === 'caido') await ruta.abort(); else await fingir(ruta); });
  await pagina.waitForFunction(() => document.readyState === 'complete');
  await pagina.waitForTimeout(500);
  await comprobar('5. se pidió una vez y no hay botón', [peticiones.length, await pagina.evaluate(() => !!window.__soporteBoton)], [1, false]);
  await comprobar('5. ni aviso en pantalla, ni error propio en la consola',
    [await pagina.evaluate(() => (document.querySelector('.mensajes') || { textContent: '' }).textContent.trim()), errores], ['', []]);
  await pagina.evaluate(() => window.dispatchEvent(new Event('online')));
  await pagina.waitForTimeout(500);
  await comprobar('5. al volver la conexión se pide otra vez (y sigue sin botón)', [peticiones.length, await pagina.evaluate(() => !!window.__soporteBoton)], [2, false]);
  modo = 'bien';
  await pagina.evaluate(() => window.dispatchEvent(new Event('online')));
  await pagina.waitForFunction(() => window.__soporteBoton === true);
  await pagina.evaluate(() => window.dispatchEvent(new Event('online')));
  await pagina.waitForTimeout(500);
  await comprobar('5. con el botón puesto no se vuelve a pedir', peticiones.length, 3);
  await contexto.close();
}

/* ================= 7. vercel.json ================= */
console.log('--- 7. vercel.json ---');
const csp = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).headers
  .flatMap((h) => h.headers).find((x) => x.key === 'Content-Security-Policy').value;
const scripts = (csp.split(';').map((x) => x.trim()).find((x) => x.startsWith('script-src')) || '').split(/\s+/);
await comprobar('7. script-src deja pasar script.google.com y script.googleusercontent.com, y sigue sin permitir nada en línea',
  [scripts.includes('https://script.google.com'), scripts.includes('https://script.googleusercontent.com'), scripts.includes("'unsafe-inline'"), scripts.includes("'self'")], [true, true, false, true]);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
