/* Fila 731 (docs/718-ABRIR-LA-APP-DESDE-GITHUB.md, parte 2), con Chromium real. Los nombres de las
   direcciones se simulan con una regla de resolución de Chromium que los lleva al servidor local.
   1. En asuntos.fmargon.com: el botón «Pasar a la dirección nueva» lleva a la dirección nueva con el
      identificador del ordenador y SOLO los nombres de las carpetas recordadas. No sale en la nueva,
      ni en la de prueba, ni en local.
   2. En la dirección nueva: lee `#pasar=`, lo quita de la barra, enseña las carpetas por señalar, marca
      cada una al señalarla con su nombre, avisa si el nombre es otro y no deja entrar hasta señalar las dos primeras. */
import { chromium } from 'playwright';

const local = new URL(process.env.DIRECCION || 'http://localhost:8123/index.html');
const PUERTO = local.port;
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--host-resolver-rules=MAP asuntos.fmargon.com 127.0.0.1, MAP gestor-asuntos-ies.github.io 127.0.0.1, MAP fmargon780.github.io 127.0.0.1']
});
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (ok) console.log('bien   ' + titulo);
  else { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
}
/* Un selector de carpetas de mentira: devuelve una carpeta con el nombre que diga window.__proximo. */
const SELECTOR = "window.showDirectoryPicker = async function () { return { kind: 'directory', name: window.__proximo || 'SIN NOMBRE' }; };" +
  "try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}";

async function abrir(nombre, ruta, antes) {
  const ctx = await navegador.newContext({ ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  const errores = [];
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript(SELECTOR + (antes || ''));
  await p.goto('http://' + nombre + ':' + PUERTO + (ruta || '/index.html'));
  await p.waitForSelector('#arranque', { timeout: 30000 });
  await p.waitForTimeout(500);
  return { ctx, p, errores };
}

/* ---------- 1. el botón, en la dirección de siempre ---------- */
{
  const v = await abrir('asuntos.fmargon.com', '/index.html', "try { localStorage.setItem('gestor-ordenador', 'abc123'); } catch (e) {}");
  /* La dirección nueva de verdad no se abre desde aquí: se contesta con una página vacía para ver adónde lleva el botón. */
  await v.ctx.route('https://gestor-asuntos-ies.github.io/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>nueva</body></html>' }));
  await v.p.evaluate(async () => {
    await Almacen.guardar('abiertos', { kind: 'directory', name: 'ASUNTOS ABIERTOS' });
    await Almacen.guardar('archivo', { kind: 'directory', name: 'ARCHIVO' });
    await Almacen.guardar('entrada', { kind: 'directory', name: 'SUELTOS' });
  });
  comprobar('en asuntos.fmargon.com hay botón «Pasar a la dirección nueva»', await v.p.locator('#btn-pasar-direccion').textContent(), 'Pasar a la dirección nueva');
  await v.p.click('#btn-pasar-direccion');
  await v.p.waitForEvent('framenavigated', { predicate: (f) => f.url().indexOf('https://gestor-asuntos-ies.github.io/') === 0, timeout: 15000 }).catch(() => null);
  const url = v.p.url();
  comprobar('lleva a la dirección nueva con #pasar=', url.indexOf('https://gestor-asuntos-ies.github.io/#pasar='), 0);
  const datos = JSON.parse(decodeURIComponent(url.split('#pasar=')[1]));
  comprobar('el enlace lleva el identificador y solo los nombres de las carpetas',
    datos, { o: 'abc123', c: [['abiertos', 'ASUNTOS ABIERTOS'], ['archivo', 'ARCHIVO'], ['entrada', 'SUELTOS']] });
  comprobar('el enlace no lleva rutas ni permisos', /[\\]|:\\|permission|token|clave/i.test(decodeURIComponent(url)), false);
  comprobar('sin errores de consola en la dirección de siempre', v.errores, []);
  await v.ctx.close();
}
for (const nombre of ['gestor-asuntos-ies.github.io', 'fmargon780.github.io', 'localhost']) {
  const v = await abrir(nombre === 'localhost' ? 'localhost' : nombre, nombre === 'localhost' ? '/index.html' : '/index.html');
  comprobar('en ' + nombre + ' no sale el botón de pasar', await v.p.locator('#btn-pasar-direccion').count(), 0);
  await v.ctx.close();
}

/* ---------- 2. la lista, en la dirección nueva ---------- */
const CARGA = encodeURIComponent(JSON.stringify({ o: 'zzz999', c: [['abiertos', 'ASUNTOS ABIERTOS'], ['archivo', 'ARCHIVO'], ['entrada', 'SUELTOS'], ['carpeta-rara', 'X'], ['bandeja', '']] }));
{
  const v = await abrir('gestor-asuntos-ies.github.io', '/index.html#pasar=' + CARGA);
  const p = v.p;
  comprobar('el #pasar= se quita de la barra de direcciones', await p.evaluate(() => location.hash), '');
  comprobar('este ordenador guarda el identificador que traía', await p.evaluate(() => localStorage.getItem('gestor-ordenador')), 'zzz999');
  comprobar('sale «Carpetas por señalar» con las tres carpetas válidas, sin marcar',
    await p.locator('#pasar-lista li').evaluateAll((l) => l.map((x) => x.dataset.carpeta + ':' + x.dataset.estado)),
    ['abiertos:falta', 'archivo:falta', 'entrada:falta']);
  comprobar('cada una dice cómo se llama', await p.locator('#pasar-lista').textContent().then((t) => ['ASUNTOS ABIERTOS', 'ARCHIVO', 'SUELTOS'].every((n) => t.indexOf('«' + n + '»') !== -1)), true);
  comprobar('«Entrar» no se abre', await p.locator('#btn-entrar').isDisabled(), true);

  await p.evaluate(() => { window.__proximo = 'OTRA CARPETA'; });
  await p.click('#btn-abiertos');
  await p.waitForSelector('#pasar-lista li[data-carpeta="abiertos"][data-estado="otra"]', { timeout: 10000 });
  comprobar('con otro nombre avisa y no la marca', await p.locator('#pasar-lista li[data-carpeta="abiertos"]').textContent().then((t) => t.indexOf('Has señalado «OTRA CARPETA»') !== -1), true);
  await p.evaluate(() => { window.__proximo = 'ASUNTOS ABIERTOS'; });
  await p.click('#btn-abiertos');
  await p.waitForSelector('#pasar-lista li[data-carpeta="abiertos"][data-estado="hecha"]', { timeout: 10000 });
  comprobar('con su nombre se marca', await p.locator('#pasar-lista li[data-carpeta="abiertos"]').getAttribute('data-estado'), 'hecha');
  comprobar('con una sola señalada «Entrar» sigue cerrado', await p.locator('#btn-entrar').isDisabled(), true);
  await p.evaluate(() => { window.__proximo = 'ARCHIVO'; });
  await p.click('#btn-archivo');
  await p.waitForSelector('#pasar-lista li[data-carpeta="archivo"][data-estado="hecha"]', { timeout: 10000 });
  await p.waitForFunction(() => !document.getElementById('btn-entrar').disabled, null, { timeout: 10000 });
  comprobar('con las dos primeras señaladas «Entrar» se abre', await p.locator('#btn-entrar').isDisabled(), false);
  comprobar('la tercera sigue por señalar y la lista se queda', await p.locator('#pasar-lista li[data-carpeta="entrada"]').getAttribute('data-estado'), 'falta');
  await p.click('#btn-pasar-quitar');
  comprobar('«Quitar la lista» la quita', await p.locator('#pasar-lista').count(), 0);
  await p.reload();
  await p.waitForSelector('#arranque');
  await p.waitForTimeout(500);
  comprobar('al recargar ya no sale', await p.locator('#pasar-lista').count(), 0);
  comprobar('en la dirección nueva tampoco sale el botón de pasar', await p.locator('#btn-pasar-direccion').count(), 0);
  /* Las carpetas de mentira que guarda el almacén (sin métodos, para poder guardarse) no saben `queryPermission`: es de la prueba. */
  comprobar('sin errores de consola en la dirección nueva', v.errores.filter((e) => e.indexOf('queryPermission') === -1), []);
  await v.ctx.close();
}
{
  /* La lista sobrevive a recargar, no pisa un identificador ya puesto y una carga rota no hace nada. */
  const v = await abrir('gestor-asuntos-ies.github.io', '/index.html#pasar=' + CARGA, "try { localStorage.setItem('gestor-ordenador', 'qqq111'); } catch (e) {}");
  comprobar('un ordenador que ya tenía identificador lo conserva', await v.p.evaluate(() => localStorage.getItem('gestor-ordenador')), 'qqq111');
  await v.p.reload();
  await v.p.waitForSelector('#arranque');
  await v.p.waitForTimeout(500);
  comprobar('al recargar la lista sigue, con «Entrar» cerrado', [await v.p.locator('#pasar-lista li').count(), await v.p.locator('#btn-entrar').isDisabled()], [3, true]);
  await v.ctx.close();
  const roto = await abrir('gestor-asuntos-ies.github.io', '/index.html#pasar=%7Bno-es-json');
  comprobar('una carga rota no saca lista ni errores', [await roto.p.locator('#pasar-lista').count(), roto.errores], [0, []]);
  await roto.ctx.close();
}
{
  const v = await abrir('localhost', '/index.html#pasar=' + CARGA);
  comprobar('en local el #pasar= no hace nada', await v.p.locator('#pasar-lista').count(), 0);
  await v.ctx.close();
}

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de pasar a la dirección nueva pasan.');
process.exit(fallos ? 1 : 0);
