/* Fila 462 (docs/AYUDA-AL-PASAR-EL-RATON.md): el recuadro de ayuda al dejar el ratón quieto sobre una pestaña o un botón.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. Los textos: ninguno pasa de 20 palabras; todas las pestañas tienen el suyo.
   2. Con ratón: sale tras la espera (no antes) y se va al salir; en «Lo de cada día» y en «Liquidar».
   3. «Liquidar» apagado dice por qué; encendido, solo lo que hace.
   4. En «Guardar» y los botones obvios no sale nada.
   5. Con el tabulador sale; solo hay un recuadro a la vez.
   6. No tapa el botón ni se corta por el borde (el ⋮ de la derecha de una fila).
   7. Ningún `title` queda en la página (salvo los <iframe>), y ningún botón de solo un símbolo se queda sin nombre.
   8. En una pantalla táctil no sale nada. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
async function nueva(opciones) {
  const contexto = await navegador.newContext(Object.assign({ viewport: { width: 1500, height: 1000 } }, opciones || {}));
  const p = await contexto.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 90000 });
  await p.waitForTimeout(3000);
  return p;
}
const texto = (p) => p.evaluate(() => { const c = document.getElementById('ayuda-raton'); return c && !c.hidden ? c.innerText.replace(/\s+/g, ' ').trim() : null; });
const cuantos = (p) => p.evaluate(() => document.querySelectorAll('#ayuda-raton').length);
async function pasarPor(p, selector) {
  await p.mouse.move(5, 5);
  await p.waitForTimeout(80);
  const el = await p.$(selector);
  await el.hover({ force: true });
}

const pagina = await nueva();

/* ================= 1. LOS TEXTOS ================= */
console.log('--- 1. los textos ---');
const largos = await pagina.evaluate(() => {
  const dichos = [];
  const mira = (o, donde) => Object.keys(o).forEach((k) => { if (String(o[k]).trim().split(/\s+/).length > 20) dichos.push(donde + ':' + k); });
  mira(Ayudas.TEXTOS, 'TEXTOS'); mira(Ayudas.POR_ID, 'POR_ID'); mira(Ayudas.POR_PESTANA, 'POR_PESTANA'); mira(Ayudas.POR_ROTULO, 'POR_ROTULO');
  mira(Ayudas.MOTIVOS, 'MOTIVOS'); mira(Ayudas.MOTIVO_POR_ID, 'MOTIVO_POR_ID'); mira(Ayudas.MOTIVO_POR_ROTULO, 'MOTIVO_POR_ROTULO');
  return dichos;
});
comprobar('1. ningún texto pasa de 20 palabras', largos, []);

const sinTexto = await pagina.evaluate(() => {
  const faltan = [];
  const todas = document.querySelectorAll('.lateral .pestana, .inicio-pestana, .pestana-ajustes, #pestanas-tipos button');
  todas.forEach((b) => { if (!Ayudas.de(b, false)) faltan.push((b.textContent || '').trim()); });
  return faltan;
});
comprobar('1. cada pestaña (barra, Inicio, Ajustes, categorías) tiene su texto', sinTexto, []);

/* ================= 2. CON RATÓN ================= */
console.log('--- 2. con ratón ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(800);
await pasarPor(pagina, '[data-ajustes-pestana="dia"]');
await pagina.waitForTimeout(200);
comprobar('2. a los 200 ms todavía no ha salido', await texto(pagina), null);
await pagina.waitForTimeout(450);
const lo = await texto(pagina);
comprobar('2. en menos de un segundo sale el de «Lo de cada día»', !!lo && /tipos de asunto/i.test(lo), true);
await pagina.mouse.move(700, 700);
await pagina.waitForTimeout(150);
comprobar('2. se va en cuanto el ratón sale', await texto(pagina), null);

await pasarPor(pagina, '[data-ajustes-pestana="centro"]');
await pagina.waitForTimeout(600);
const centro = await texto(pagina);
await pasarPor(pagina, '[data-ajustes-pestana="problemas"]');
await pagina.waitForTimeout(600);
comprobar('2. solo un recuadro a la vez, y cambia de texto', [await cuantos(pagina), centro !== (await texto(pagina))], [1, true]);

/* ================= 3. LIQUIDAR ================= */
console.log('--- 3. liquidar ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(800);
await pagina.evaluate(() => document.querySelector('[data-pestana="liq"]').click());
await pagina.waitForSelector('#inicio-liquidar-boton');
await pagina.waitForTimeout(500);
comprobar('3. «Liquidar» está apagado sin asuntos marcados', await pagina.$eval('#inicio-liquidar-boton', (b) => b.disabled), true);
await pasarPor(pagina, '#inicio-liquidar-boton');
await pagina.waitForTimeout(650);
const apagado = await texto(pagina);
comprobar('3. apagado: dice qué hace y que hay que marcar antes algún asunto',
  [/liquidación/i.test(apagado || ''), /Marca antes algún asunto/i.test(apagado || '')], [true, true]);
await pagina.screenshot({ path: process.env.FOTOS ? process.env.FOTOS + '/liquidar-apagado.png' : '/tmp/ayuda-liquidar.png' });
await pagina.click('.liq-marca');
await pagina.waitForTimeout(300);
await pasarPor(pagina, '#inicio-liquidar-boton');
await pagina.waitForTimeout(650);
const encendido = await texto(pagina);
comprobar('3. encendido: solo lo que hace, sin motivo', [/liquidación/i.test(encendido || ''), /Marca antes/i.test(encendido || '')], [true, false]);
{
  const r = await pagina.evaluate(() => { const b = document.getElementById('inicio-liquidar-boton').getBoundingClientRect(), c = document.getElementById('ayuda-raton').getBoundingClientRect(); return { solapa: !(c.right <= b.left || c.left >= b.right || c.bottom <= b.top || c.top >= b.bottom) }; });
  comprobar('3. el recuadro no tapa el botón', r.solapa, false);
}

/* ================= 4. LOS OBVIOS ================= */
console.log('--- 4. botones obvios ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(500);
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => { const d = document.getElementById('membrete-guardar').closest('details'); if (d) d.open = true; });
await pagina.waitForTimeout(300);
await pasarPor(pagina, '#membrete-guardar');
await pagina.waitForTimeout(700);
comprobar('4. en «Guardar» del membrete no sale nada', await texto(pagina), null);
await pasarPor(pagina, '#membrete-elegir-logo');
await pagina.waitForTimeout(700);
comprobar('4. en «Subir el logo» sí sale', !!(await texto(pagina)), true);
const obvios = await pagina.evaluate(() => {
  const b = document.createElement('button'); b.textContent = 'Cerrar'; b.setAttribute('data-ayuda', 'Cerrar el cuadro');
  const c = document.createElement('button'); c.textContent = '← Volver'; c.setAttribute('data-ayuda', 'Volver atrás');
  return [Ayudas.de(b, false), Ayudas.de(c, false)];
});
comprobar('4. «Cerrar» y «Volver» pierden la ayuda gris que llevaban', obvios, ['', '']);

/* ================= 5. EL TABULADOR ================= */
console.log('--- 5. el tabulador ---');
await pagina.mouse.move(5, 5);
await pagina.evaluate(() => { document.activeElement && document.activeElement.blur(); document.querySelector('[data-ajustes-pestana="dia"]').focus(); });
await pagina.keyboard.press('Tab');
await pagina.keyboard.press('Shift+Tab');
await pagina.waitForTimeout(200);
const conTab = await texto(pagina);
comprobar('5. al llegar con el tabulador sale el recuadro', !!conTab && /tipos de asunto/i.test(conTab), true);
await pagina.keyboard.press('Tab');
await pagina.waitForTimeout(200);
comprobar('5. se va al salir del botón (y sale el del siguiente, si lo tiene)', await cuantos(pagina), 1);

/* ================= 6. EL BORDE DE LA PANTALLA ================= */
console.log('--- 6. no se corta ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => document.querySelector('[data-pestana="todos"]').click());
await pagina.waitForSelector('.fila-menu-btn');
await pagina.waitForTimeout(500);
await pasarPor(pagina, '.fila-menu-btn');
await pagina.waitForTimeout(650);
const geo = await pagina.evaluate(() => {
  const c = document.getElementById('ayuda-raton').getBoundingClientRect();
  const b = document.querySelector('.fila-menu-btn').getBoundingClientRect();
  return { texto: document.getElementById('ayuda-raton').innerText, dentro: c.left >= 0 && c.top >= 0 && c.right <= window.innerWidth && c.bottom <= window.innerHeight,
    solapa: !(c.right <= b.left || c.left >= b.right || c.bottom <= b.top || c.top >= b.bottom), derechaBoton: Math.round(b.right), anchoVentana: window.innerWidth };
});
comprobar('6. el ⋮ de una fila (pegado a la derecha): el recuadro cabe en la pantalla y no tapa el botón', [geo.dentro, geo.solapa], [true, false]);
await pagina.screenshot({ path: process.env.FOTOS ? process.env.FOTOS + '/fila-mas.png' : '/tmp/ayuda-fila-mas.png' });
await pagina.setViewportSize({ width: 900, height: 600 });
await pagina.waitForTimeout(300);
await pasarPor(pagina, '#btn-exportar');
await pagina.waitForTimeout(650);
const geo2 = await pagina.evaluate(() => { const c = document.getElementById('ayuda-raton'); if (c.hidden) return null; const r = c.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight; });
comprobar('6. con la ventana estrecha tampoco se corta', geo2, true);
await pagina.setViewportSize({ width: 1500, height: 1000 });

/* ================= 7. NI TITLE NI BOTONES SIN NOMBRE ================= */
console.log('--- 7. ningún title, ningún botón sin nombre ---');
const pantallas = ['abiertos', 'nuevo', 'archivo', 'personas', 'herramientas', 'ajustes'];
const restos = [];
const sinNombre = [];
for (const pn of pantallas) {
  await pagina.click('.pestana[data-pantalla="' + pn + '"]');
  await pagina.waitForTimeout(900);
  if (pn === 'ajustes') {
    for (const t of ['dia', 'centro', 'ordenador', 'problemas']) {
      await pagina.click('[data-ajustes-pestana="' + t + '"]'); await pagina.waitForTimeout(500);
      restos.push(...await pagina.evaluate(() => [...document.querySelectorAll('[title]')].filter((e) => e.tagName !== 'IFRAME').map((e) => e.tagName + ':' + e.getAttribute('title'))));
      sinNombre.push(...await pagina.evaluate(() => [...document.querySelectorAll('button, summary')].filter((b) => !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(b.textContent || '') && !b.getAttribute('aria-label') && !b.querySelector('svg[aria-label]') && b.offsetParent).map((b) => b.className + ':' + b.textContent)));
    }
  }
  restos.push(...await pagina.evaluate(() => [...document.querySelectorAll('[title]')].filter((e) => e.tagName !== 'IFRAME').map((e) => e.tagName + ':' + e.getAttribute('title'))));
  sinNombre.push(...await pagina.evaluate(() => [...document.querySelectorAll('button, summary')].filter((b) => !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(b.textContent || '') && !b.getAttribute('aria-label') && !b.querySelector('svg[aria-label]') && b.offsetParent).map((b) => b.className + ':' + b.textContent)));
}
comprobar('7. no queda ningún atributo title en la página ya pintada (salvo <iframe>)', restos, []);
comprobar('7. ningún botón de solo un símbolo se queda sin nombre', sinNombre, []);

/* una ficha de asunto y su mesa de trabajo */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => App.abrirFicha(App.E.listaAbiertos[0], 'abierto'));
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1500);
const enFicha = await pagina.evaluate(() => ({
  titles: [...document.querySelectorAll('[title]')].filter((e) => e.tagName !== 'IFRAME').map((e) => e.tagName + ':' + e.getAttribute('title')),
  sin: [...document.querySelectorAll('button, summary')].filter((b) => !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(b.textContent || '') && !b.getAttribute('aria-label') && b.offsetParent).map((b) => b.className + ':' + b.textContent)
}));
comprobar('7. la ficha de un asunto: sin title y sin botones sin nombre', enFicha, { titles: [], sin: [] });
const props = await pagina.evaluate(() => { const d = document.createElement('div'); d.title = 'Hola'; return [d.title, d.getAttribute('title'), d.getAttribute('data-ayuda')]; });
comprobar('7. `el.title = …` del código va a data-ayuda', props, ['Hola', null, 'Hola']);
const html = await pagina.evaluate(async () => { const d = document.createElement('div'); document.body.appendChild(d); d.innerHTML = '<button id="zz-prueba" title="Algo largo">✕</button>'; await Promise.resolve(); await new Promise((r) => setTimeout(r, 20)); const b = d.firstChild; const r = [b.hasAttribute('title'), b.getAttribute('data-ayuda'), b.getAttribute('aria-label')]; d.remove(); return r; });
comprobar('7. un title dentro de un texto HTML se pasa solo, y el botón de un símbolo conserva su nombre', html, [false, 'Algo largo', 'Algo largo']);

/* ================= 8. PANTALLA TÁCTIL ================= */
console.log('--- 8. pantalla táctil ---');
const tactil = await nueva({ isMobile: true, hasTouch: true, viewport: { width: 900, height: 1200 } });
comprobar('8. en un aparato táctil el navegador no tiene ratón', await tactil.evaluate(() => matchMedia('(any-hover: hover)').matches), false);
await tactil.waitForSelector('#btn-recargar', { state: 'visible' });
const caja = await tactil.$eval('#btn-recargar', (b) => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await tactil.mouse.move(5, 5);
await tactil.mouse.move(caja.x, caja.y);
await tactil.waitForTimeout(800);
comprobar('8. con un toque o un «ratón» en pantalla táctil no sale nada', await texto(tactil), null);

comprobar('9. sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobaciones fallan.'); process.exit(1); }
console.log('\nTodo bien.');
