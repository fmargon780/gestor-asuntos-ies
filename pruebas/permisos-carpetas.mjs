/* Fila 318 (docs/PERMISOS-DE-CARPETAS-AL-ENTRAR.md): el permiso de las carpetas recordadas (alumnado,
   bandeja y Centro de datos) se pide al entrar y, si falta, el panel «Comprobación al entrar» lo arregla
   con «Dar permiso», sin señalar nada. Con Chromium real y la copia de pruebas (`sinpermiso=`, `niega=`). */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const TRES = 'alumnado,bandeja,centro-de-datos';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(parametros, antes) {
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1' + parametros);
  return pagina;
}
const fila = (p, id) => p.locator('.comprobacion-fila[data-id="' + id + '"]');
const claseDe = (p, id) => fila(p, id).getAttribute('class');
const verde = (p, id) => claseDe(p, id).then((c) => /comprobacion-bien/.test(c));
const ids = ['alumnado', 'centro-de-datos', 'bandeja'];

/* ---------- 1 a 5 ---------- */
let p = await abrir('&auto=1&sinpermiso=' + TRES);
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila', { timeout: 30000 });
console.log('--- 1. el panel con las tres filas ---');
for (const id of ids) {
  await comprobar('1. ' + id + ': botón «Dar permiso»', fila(p, id).locator('[data-dar]').textContent(), 'Dar permiso');
  await comprobar('1. ' + id + ': frase nueva, sin «Hay que volver a señalarla»',
    fila(p, id).textContent().then((t) => /Pulsa «Dar permiso»: no hay que volver a señalarla/.test(t) && !/Hay que volver a señalarla/.test(t) && /Permitir en cada visita/.test(t)), true);
}
await comprobar('1. no hay «Arreglarlo» en esas tres', p.locator('.comprobacion-fila[data-id="bandeja"] [data-arreglar], .comprobacion-fila[data-id="alumnado"] [data-arreglar], .comprobacion-fila[data-id="centro-de-datos"] [data-arreglar]').count(), 0);

console.log('--- 2. «Dar permiso» en la bandeja ---');
const antes = await p.evaluate(async () => (await Almacen.leer('bandeja')) === Demo.disco().bandeja);
await comprobar('2. la bandeja recordada es la de la demostración', antes, true);
await fila(p, 'bandeja').locator('[data-dar]').click();
await p.waitForFunction(() => /comprobacion-bien/.test(document.querySelector('.comprobacion-fila[data-id="bandeja"]').className), null, { timeout: 15000 });
await comprobar('2. el panel sigue abierto', p.locator('#capa').evaluate((e) => !e.classList.contains('oculto')), true);
await comprobar('2. aviso verde', p.locator('#mensajes .mensaje.bueno').allTextContents().then((l) => l.some((t) => /Permiso dado a la carpeta de la bandeja/.test(t))), true);
await comprobar('2. la carpeta guardada es la misma', p.evaluate(async () => (await Almacen.leer('bandeja')) === Demo.disco().bandeja), true);
await comprobar('2. los correos de la demostración aparecen', p.evaluate(async () => { for (let i = 0; i < 40; i++) { const c = Bandeja.correos(); if (c && c.length) return true; await new Promise((r) => setTimeout(r, 250)); } return false; }), true);

console.log('--- 3. alumnado y Centro de datos ---');
for (const id of ['alumnado', 'centro-de-datos']) {
  await fila(p, id).locator('[data-dar]').click();
  await p.waitForFunction((i) => /comprobacion-bien/.test(document.querySelector('.comprobacion-fila[data-id="' + i + '"]').className), id, { timeout: 15000 });
  await comprobar('3. ' + id + ' en verde', verde(p, id), true);
}
await comprobar('3. se trajo lo del alumnado (copia guardada)', p.evaluate(async () => !!(await AlumnadoBD.leer())), true);

console.log('--- 4. la marca ---');
await p.click('#cuadro-cancelar');
await p.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await comprobar('4. ninguna de las tres cuenta como falta', p.evaluate(() => ComprobacionEntrada.filas().filter(ComprobacionEntrada.cuentanComoFalta).map((f) => f.id).filter((i) => ['alumnado', 'centro-de-datos', 'bandeja'].includes(i))), []);
await p.close();

/* ---------- 5. niega ---------- */
console.log('--- 5. niega=bandeja ---');
p = await abrir('&auto=1&sinpermiso=bandeja&niega=bandeja');
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila', { timeout: 30000 });
await fila(p, 'bandeja').locator('[data-dar]').click();
await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje.ambar')].some((m) => /Sin permiso no puedo leer la carpeta de la bandeja/.test(m.textContent)), null, { timeout: 15000 });
await comprobar('5. la fila sigue como estaba y el botón está encendido',
  Promise.all([claseDe(p, 'bandeja').then((c) => !/comprobacion-bien/.test(c)), fila(p, 'bandeja').locator('[data-dar]').isEnabled()]), [true, true]);
await p.close();

/* ---------- 6 a 8: sin auto, pulsando «Entrar» ---------- */
async function entrando(extra, antes) {
  const q = await abrir('&sinpermiso=' + extra, antes);
  await q.click('#btn-demo-entrar');
  await q.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  await q.waitForSelector('#franja-demo', { timeout: 30000 });
  await q.waitForTimeout(4500);   /* la comprobación arranca a los 2,5 s */
  return q;
}
console.log('--- 6. «Entrar» pide los tres permisos ---');
p = await entrando(TRES);
await comprobar('6. los tres con permiso', p.evaluate(async () => [await PermisosCarpetas.estado('alumnado'), await PermisosCarpetas.estado('bandeja'), await PermisosCarpetas.estado('centro-de-datos')]), ['con-permiso', 'con-permiso', 'con-permiso']);
await comprobar('6. sin panel', p.locator('#capa').evaluate((e) => e.classList.contains('oculto')), true);
await p.evaluate(() => { ComprobacionEntrada.abrirPanel(); });
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila');
await comprobar('6. sus filas en verde', Promise.all(ids.map((i) => verde(p, i))), [true, true, true]);
await p.close();

console.log('--- 7. niega=alumnado ---');
p = await abrir('&sinpermiso=alumnado,bandeja&niega=alumnado');
await p.click('#btn-demo-entrar');
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila', { timeout: 30000 });
await comprobar('7. se entra y el panel trae «Dar permiso» solo en el alumnado',
  p.locator('[data-dar]').evaluateAll((bs) => bs.map((b) => b.closest('li').dataset.id)), ['alumnado']);
await comprobar('7. la bandeja está en verde', verde(p, 'bandeja'), true);
await p.close();

console.log('--- 8. alumnado omitido ---');
p = await entrando('alumnado,bandeja', "try { localStorage.setItem('gestor-comprobacion-omitidas', JSON.stringify(['alumnado'])); } catch (e) {}");
await comprobar('8. al alumnado no se le pide permiso', p.evaluate(() => PermisosCarpetas.estado('alumnado')), 'sin-permiso');
await comprobar('8. la bandeja sí', p.evaluate(() => PermisosCarpetas.estado('bandeja')), 'con-permiso');
await p.evaluate(() => { ComprobacionEntrada.abrirPanel(); });
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila');
await comprobar('8. su fila sale «No se usa en este ordenador»', fila(p, 'alumnado').textContent().then((t) => /No se usa en este ordenador/.test(t)), true);
await p.close();

/* ---------- 9. todas seguidas ---------- */
console.log('--- 9. las peticiones salen todas antes de que conteste la primera ---');
p = await abrir('&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await comprobar('9. tres peticiones lanzadas antes de la primera respuesta', p.evaluate(async () => {
  Demo.sinPulsacion = () => false;
  const registro = [];
  const falsa = (nombre) => ({ kind: 'directory', name: nombre,
    queryPermission: async () => 'prompt',
    requestPermission: async () => { registro.push('pide ' + nombre); await new Promise((r) => setTimeout(r, 300)); registro.push('contesta ' + nombre); return 'granted'; } });
  await Almacen.guardar('alumnado-bd-carpeta', falsa('a'));
  await Almacen.guardar('centro-de-datos-carpeta', falsa('c'));
  await Almacen.guardar('bandeja', falsa('b'));
  const r = await PermisosCarpetas.pedirAlEntrar();
  return [registro.slice(0, 3).every((x) => /^pide/.test(x)), r.conPermiso.length, r.sinPermiso.length];
}), [true, 3, 0]);
await p.close();

/* ---------- 10. sin sinpermiso, como antes ---------- */
console.log('--- 10. la demostración de siempre ---');
p = await abrir('&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(4500);
await p.evaluate(() => { ComprobacionEntrada.abrirPanel(); });
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila');
await comprobar('10. ningún «Dar permiso»', p.locator('[data-dar]').count(), 0);
await comprobar('10. el panel no sale solo, como siempre', p.evaluate(() => Demo.permisosSimulados()), false);
await p.close();

console.log('--- sin errores ---');
await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de permisos de carpetas pasan.');
