/* Fila 543 (docs/543-TIPOS-Y-SU-USO.md): Herramientas → «Tipos y su uso». Copia de pruebas (demo), Chromium real:
   el disco es falso, nunca se tocan datos reales. El envío se prueba con el `fetch` sustituido. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function abrir(extra) {
  const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await p.goto(BASE + '?demo=1&auto=1' + extra);
  await p.waitForSelector('#franja-demo', { timeout: 30000 });
  await p.waitForTimeout(2500);
  /* Entrando directo a Herramientas, sin pasar por Ajustes. */
  await p.evaluate(() => App.ir('herramientas'));
  await p.waitForSelector('#bloque-tipos-uso', { state: 'attached' });
  await p.evaluate(() => { document.getElementById('bloque-tipos-uso').open = true; });
  await p.waitForSelector('#tu-filas tr[data-t]');
  return p;
}

let p = await abrir('&guias=1');
const num = (sel) => p.evaluate((s) => Number(document.querySelector(s).textContent.match(/\((\d+)\)/)[1]), sel);

console.log('--- 1. el bloque y su tabla ---');
await comprobar('1a. sale en Herramientas', p.evaluate(() => !!document.getElementById('bloque-tipos-uso').closest('#pantalla-herramientas')), true);
const total = await p.evaluate(() => App.E.tipos.length);
await comprobar('1b. la tabla enseña todos los tipos', p.locator('#tu-filas tr[data-t]').count(), total);
const cuentas = await p.evaluate(() => [...document.querySelectorAll('.tu-pastilla')].map((b) => [b.textContent.split(' (')[0], Number(b.textContent.match(/\((\d+)\)/)[1])]));
await comprobar('1c. los filtros son Todos, Sin usar, Usados y Desactivados, y sus números cuadran', [cuentas.map((c) => c[0]), cuentas[0][1] === total, cuentas[1][1] + cuentas[2][1] + cuentas[3][1] === total],
  [['Todos', 'Sin usar', 'Usados', 'Desactivados'], true, true]);
const usos = await p.evaluate(() => TiposYSuUso.recoger().map((f) => [f.tipo, f.abiertos, f.archivados, f.ultimo]));
const filaTabla = await p.evaluate(() => [...document.querySelectorAll('#tu-filas tr[data-t]')].map((tr) => [tr.dataset.t, Number(tr.cells[3].textContent), Number(tr.cells[4].textContent), tr.cells[5].textContent]));
await comprobar('1d. abiertos, archivados y último uso (o «Nunca») salen en cada fila', filaTabla.every((f) => {
  const u = usos.find((x) => x[0] === f[0]);
  return u && u[1] === f[1] && u[2] === f[2] && (u[3] ? /^\d{2}-[a-z]{3}-\d{4}$/.test(f[3]) : f[3] === 'Nunca');
}), true);
await comprobar('1e. abiertos del asunto: la cuenta de la tabla cuadra con los asuntos abiertos', p.evaluate(() => TiposYSuUso.recoger().reduce((s, f) => s + f.abiertos, 0) === App.E.listaAbiertos.filter((a) => App.E.tipos.some((t) => t.tipo === ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo)))).length), true);
const primero = filaTabla[0][0];
await p.fill('#tu-buscar', primero.slice(0, 4).toLowerCase());
await comprobar('1f. el buscador deja solo los que cuadran', p.evaluate((n) => [...document.querySelectorAll('#tu-filas tr[data-t]')].every((tr) => tr.dataset.t.toLowerCase().indexOf(n) !== -1), primero.slice(0, 4).toLowerCase()), true);
await p.fill('#tu-buscar', '');

console.log('--- 2. la guía ---');
await p.click('#tu-filas tr[data-t] >> nth=1');
await comprobar('2a. al pulsar un tipo se ve su guía con hitos y tareas', p.evaluate(() => {
  const t = document.querySelector('#tu-filas tr.sel').dataset.t, g = document.getElementById('tu-guia');
  return [g.querySelector('h3').textContent === t, g.querySelectorAll('.tu-hito').length === GuiasDelCentro.pasosDe(t).length, !!g.querySelector('#tu-editar')];
}), [true, true, true]);
await p.evaluate(() => { window.__abierto = null; App.abrirTipoDeAsunto = (t) => { window.__abierto = t; }; });
await p.click('#tu-editar');
await comprobar('2b. «Abrir en el editor de la guía» abre el tipo', p.evaluate(() => window.__abierto === document.querySelector('#tu-filas tr.sel').dataset.t), true);

console.log('--- 3. las marcas ---');
const sin = await num('.tu-pastilla[data-f="sin"]');
await comprobar('3a. los activos sin usar salen marcados y el botón dice cuántos desactiva',
  p.evaluate(() => [document.querySelectorAll('#tu-filas input:checked').length, document.getElementById('tu-desactivar').textContent]).then((r) => [r[0], r[1]]),
  [sin, sin ? 'Desactivar ' + sin + (sin === 1 ? ' tipo' : ' tipos') : 'Desactivar']);
await p.click('#tu-quitar');
await comprobar('3b. «Quitar todas las marcas» las quita y el botón queda apagado', p.evaluate(() => [document.querySelectorAll('#tu-filas input:checked').length, document.getElementById('tu-desactivar').disabled, document.getElementById('tu-desactivar').textContent]), [0, true, 'Desactivar']);
await p.click('#tu-marcar');
await comprobar('3c. «Marcar los que se ven» marca todos los activos de la lista', p.evaluate(() => [document.querySelectorAll('#tu-filas input[type=checkbox]').length === document.querySelectorAll('#tu-filas input:checked').length, document.getElementById('tu-desactivar').disabled]), [true, false]);
await p.click('#tu-quitar');

console.log('--- 4. desactivar varios a la vez ---');
const elegidos = await p.evaluate(() => TiposYSuUso.recoger().filter((f) => !f.desactivado).slice(0, 2).map((f) => f.tipo));
for (const n of elegidos) await p.check('#tu-filas input[data-m="' + n + '"]');
const antes = await p.evaluate(async () => JSON.stringify([GuiasDelCentro.todas(), App.E.listaAbiertos.length]));
await p.evaluate(() => { window.__guardados = 0; const g = Copias.guardar; Copias.guardar = function (a, f) { if (f === App.FICHERO_TIPOS) window.__guardados++; return g.apply(this, arguments); }; });
await p.click('#tu-desactivar');
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('4a. el cuadro lista los tipos y dice que sus guías se conservan', p.evaluate((e) => { const t = document.getElementById('cuadro-cuerpo').textContent; return [e.every((n) => t.indexOf(n) !== -1), t.indexOf('Dejarán de salir al crear asuntos') !== -1, t.indexOf('se conservan') !== -1, document.getElementById('cuadro-titulo').textContent]; }, elegidos), [true, true, true, 'Desactivar 2 tipos']);
await p.click('#cuadro-cancelar');
await comprobar('4b. cancelar no desactiva nada', p.evaluate(() => App.E.tipos.filter((t) => t.desactivado).length), 0);
await p.click('#tu-desactivar');
await p.waitForSelector('#capa:not(.oculto)');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => document.getElementById('tu-mensaje').textContent.indexOf('tipos desactivados') !== -1);
await comprobar('4c. tipos.json se escribe una sola vez', p.evaluate(() => window.__guardados), 1);
await comprobar('4d. ya no salen al crear asuntos; guías y asuntos abiertos siguen igual', p.evaluate(async ([e, ant]) => [e.every((n) => App.tiposParaElegir().map((x) => x.tipo).indexOf(n) === -1), JSON.stringify([GuiasDelCentro.todas(), App.E.listaAbiertos.length]) === ant], [elegidos, antes]), [true, true]);
await comprobar('4e. salen en «Desactivados» con su Activar', p.evaluate((e) => [document.querySelector('.tu-pastilla.on').textContent.startsWith('Desactivados'), [...document.querySelectorAll('#tu-filas tr[data-t]')].map((t) => t.dataset.t).sort().join('|') === [...e].sort().join('|'), document.querySelectorAll('#tu-filas [data-a]').length], elegidos), [true, true, 2]);

console.log('--- 5. activar ---');
await p.click('#tu-filas [data-a="' + elegidos[0] + '"]');
await p.waitForFunction((n) => document.getElementById('tu-mensaje').textContent.indexOf(n + ' vuelve a estar activo') !== -1, elegidos[0]);
await comprobar('5a. vuelve a salir al crear asuntos', p.evaluate((n) => App.tiposParaElegir().some((x) => x.tipo === n), elegidos[0]), true);

console.log('--- 6. enviar a Claude ---');
await p.evaluate(() => {
  window.__envios = [];
  window.fetch = async (url, op) => { window.__envios.push({ url, op }); return { json: async () => ({ ok: true }) }; };
});
await p.click('#tu-enviar');
await p.waitForSelector('#capa:not(.oculto)');
const activos = await p.evaluate(() => App.E.tipos.filter((t) => !t.desactivado).length);
await comprobar('6a. el cuadro da las cifras y dice que no va ningún dato de asuntos ni de personas', p.evaluate(() => { const t = document.getElementById('cuadro-cuerpo').textContent; return [/Se enviarán \d+ gu/.test(t), t.indexOf('No va ningún dato de asuntos ni de personas') !== -1, t.indexOf('desactivados no se envían') !== -1]; }), [true, true, true]);
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => window.__envios.length === 1);
await p.waitForSelector('#tu-mensaje .aviso');
const envio = await p.evaluate(() => ({ url: window.__envios[0].url, tipoC: window.__envios[0].op.headers['Content-Type'], metodo: window.__envios[0].op.method, cuerpo: window.__envios[0].op.body, buzon: SoporteCargar.buzon, nombres: App.E.listaAbiertos.map((a) => a.nombre), desact: App.E.tipos.filter((t) => t.desactivado).map((t) => t.tipo), activosN: App.E.tipos.filter((t) => !t.desactivado).map((t) => t.tipo) }));
const cuerpo = JSON.parse(envio.cuerpo), datos = JSON.parse(cuerpo.texto.split('\n').slice(1).join('\n'));
await comprobar('6b. POST de texto plano al buzón, como aviso normal', [envio.url === envio.buzon, envio.metodo, envio.tipoC, cuerpo.tipo, cuerpo.repo, cuerpo.pantalla, cuerpo.texto.split('\n')[0]], [true, 'POST', 'text/plain', 'mejora', 'fmargon780/gestor-asuntos-ies', 'Herramientas', 'GUIAS-PARA-CLAUDE']);
await comprobar('6c. van los tipos activos (y solo ellos) con su guía', [datos.tipos.map((t) => t.nombre).sort().join('|') === envio.activosN.slice().sort().join('|'), datos.tipos.some((t) => envio.desact.indexOf(t.nombre) !== -1), datos.tipos.every((t) => Array.isArray(t.guia))], [true, false, true]);
await comprobar('6d. no va ningún asunto ni persona', envio.nombres.filter((n) => envio.cuerpo.indexOf(n) !== -1), []);
await comprobar('6e. el aviso final', p.locator('#tu-mensaje').textContent(), 'Enviadas ' + activos + (activos === 1 ? ' guía' : ' guías') + ' a Claude. Dile en la conversación que ya están.');
await p.click('#tu-enviar'); await p.waitForSelector('#capa:not(.oculto)'); await p.click('#cuadro-aceptar');
await p.waitForFunction(() => window.__envios.length === 2);
await comprobar('6f. se puede enviar más de una vez', p.evaluate(() => window.__envios.length), 2);
await p.evaluate(() => { window.fetch = async () => ({ json: async () => ({ ok: false, motivo: 'buzón lleno' }) }); });
await p.click('#tu-enviar'); await p.waitForSelector('#capa:not(.oculto)'); await p.click('#cuadro-aceptar');
await p.waitForSelector('.aviso-malo, .aviso.malo, #avisos .malo, [class*="malo"]', { timeout: 5000 }).catch(() => {});
await comprobar('6g. si el buzón no acepta, aviso con el motivo', p.evaluate(() => document.body.textContent.indexOf('buzón lleno') !== -1), true);
await p.close();

console.log('--- 7. en la demostración no se envía ---');
p = await abrir('');
await p.evaluate(() => { window.__envios = 0; window.fetch = async () => { window.__envios++; return { json: async () => ({ ok: true }) }; }; });
await p.click('#tu-enviar'); await p.waitForSelector('#capa:not(.oculto)'); await p.click('#cuadro-aceptar');
await p.waitForSelector('#tu-mensaje .aviso');
await comprobar('7a. dice lo que enviaría y no llama', p.evaluate(() => [window.__envios, document.getElementById('tu-mensaje').textContent.indexOf('En la demostración no se envía nada') !== -1]), [0, true]);
await p.close();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
